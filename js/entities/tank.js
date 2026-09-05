// 坦克类（玩家+AI）
class Tank {
    constructor(config) {
        this.id = config.id;
        this.color = config.color;
        this.x = config.x;
        this.y = config.y;
        this.angle = 0;          // 炮口朝向
        this.size = CONSTANTS.TANK_SIZE;
        this.isAI = config.isAI || false;
        this.playerIndex = config.playerIndex !== undefined ? config.playerIndex : -1;
        this.alive = true;

        // 升级属性
        const u = StorageSystem.data ? StorageSystem.data.upgrades : {};
        this.maxHealth = CONSTANTS.TANK_MAX_HEALTH + (u.maxHealth || 0);
        this.health = this.maxHealth;
        this.attack = 1 + (u.attack || 0);
        this.fireRate = CONSTANTS.FIRE_COOLDOWN / (1 + (u.fireRate || 0) * 0.3);
        this.bulletSpeed = CONSTANTS.BULLET_SPEED + (u.bulletSpeed || 0) * 0.5;
        this.moveSpeed = CONSTANTS.TANK_SPEED + (u.moveSpeed || 0) * 0.2;
        this.maxBounces = CONSTANTS.BULLET_MAX_BOUNCES + (u.maxBounces || 0);

        this.lastFireTime = 0;

        // 道具效果
        this.shield = false;
        this.speedBoost = 0;
        this.rapidFire = 0;
        this.piercing = 0;
        this.radar = 0;

        // AI状态
        if (this.isAI) {
            this.difficulty = config.difficulty || 'normal';
            this.aiState = 'patrol';
            this.aiTimer = 0;
            this.aiTarget = null;
            this.aiPath = [];
            this.aiPathTimer = 0;
            this.aiFireTimer = 0;
            this.aiPatrolTarget = null;
        }

        // P3鼠标移动插值
        this.targetX = this.x;
        this.targetY = this.y;

        // 待加入场景的子弹
        this.newBullets = [];
        // deltaTime 缩放（标准化移动速度，防止高帧率下过快）
        this.dtScale = 1;
    }

    update(deltaTime, input, map, allTanks, items) {
        if (!this.alive) return;
        // 标准化移动速度：60fps 时 dtScale=1，高帧率时按比例缩小，保证每秒位移恒定
        this.dtScale = deltaTime / 16.67;

        if (this.isAI) {
            this.updateAI(deltaTime, map, allTanks, items);
        } else {
            this.updatePlayer(deltaTime, input, map, allTanks);
        }
        this.updateBuffs(deltaTime);
    }

    // ===== 玩家更新 =====
    updatePlayer(deltaTime, input, map, allTanks) {
        let dx = 0, dy = 0;
        let moved = false;

        if (this.playerIndex === 0) {
            // P1: WASD
            const p = input.getP1();
            if (p.up) { dy = -1; moved = true; }
            else if (p.down) { dy = 1; moved = true; }
            if (p.left) { dx = -1; moved = true; }
            else if (p.right) { dx = 1; moved = true; }
            if (moved) this.angle = Math.atan2(dy, dx);
            if (p.fire) this.tryFire();
        } else if (this.playerIndex === 1) {
            // P2: 方向键
            const p = input.getP2();
            if (p.up) { dy = -1; moved = true; }
            else if (p.down) { dy = 1; moved = true; }
            if (p.left) { dx = -1; moved = true; }
            else if (p.right) { dx = 1; moved = true; }
            if (moved) this.angle = Math.atan2(dy, dx);
            if (p.fire) this.tryFire();
        } else if (this.playerIndex === 2) {
            // P3: 鼠标
            const p = input.getP3();
            // 炮口指向鼠标
            this.angle = MathUtils.angle(this.x, this.y, p.mouseX, p.mouseY);
            // 坦克向鼠标方向移动
            const dist = MathUtils.distance(this.x, this.y, p.mouseX, p.mouseY);
            if (dist > 20) {
                dx = (p.mouseX - this.x) / dist;
                dy = (p.mouseY - this.y) / dist;
                moved = true;
            }
            if (p.fire) this.tryFire();
        }

        if (moved) {
            const speed = this.moveSpeed * (this.speedBoost > 0 ? 1.5 : 1) * 1.3; // 玩家速度加成30%，比AI更灵活
            this.move(dx * speed, dy * speed, map, allTanks);
        }
    }

    // ===== AI更新 =====
    updateAI(deltaTime, map, allTanks, items) {
        const params = AI_PARAMS[this.difficulty];
        const enemies = allTanks.filter(t => t.alive && !t.isAI);
        if (enemies.length === 0) return;

        // 找最近敌人
        const nearest = enemies.reduce((best, e) => {
            const d = MathUtils.distance(this.x, this.y, e.x, e.y);
            return (!best || d < best.dist) ? { tank: e, dist: d } : best;
        }, null);

        if (!nearest) { this.aiState = 'patrol'; return; }

        // 状态切换
        this.aiTimer += deltaTime;
        if (this.health <= 1 && this.health < this.maxHealth && this.difficulty !== 'easy') {
            this.aiState = 'retreat';
        } else if (nearest.dist <= params.attackRange) {
            this.aiState = 'attack';
            this.aiTarget = nearest.tank;
        } else if (nearest.dist <= params.detectRange) {
            this.aiState = 'chase';
            this.aiTarget = nearest.tank;
        } else {
            this.aiState = 'patrol';
        }

        // 执行状态
        switch (this.aiState) {
            case 'patrol': this.aiPatrol(deltaTime, map, allTanks); break;
            case 'chase': this.aiChase(deltaTime, map, allTanks, nearest.tank); break;
            case 'attack': this.aiAttack(deltaTime, map, allTanks, nearest.tank, params); break;
            case 'retreat': this.aiRetreat(deltaTime, map, allTanks, nearest.tank, items, params); break;
        }

        // 拾取附近道具
        if (params.useItems) {
            for (const item of items) {
                if (!item.active) continue;
                if (MathUtils.distance(this.x, this.y, item.x, item.y) < 80) {
                    this.aiMoveTowards(item.x, item.y, map, allTanks);
                    break;
                }
            }
        }
    }

    aiPatrol(dt, map, allTanks) {
        // 随机巡逻
        if (!this.aiPatrolTarget || MathUtils.distance(this.x, this.y, this.aiPatrolTarget.x, this.aiPatrolTarget.y) < 30) {
            const col = MathUtils.randInt(2, CONSTANTS.MAP_COLS - 3);
            const row = MathUtils.randInt(2, CONSTANTS.MAP_ROWS - 3);
            this.aiPatrolTarget = { x: col * CONSTANTS.TILE_SIZE + 12, y: row * CONSTANTS.TILE_SIZE + 12 };
        }
        this.aiMoveTowards(this.aiPatrolTarget.x, this.aiPatrolTarget.y, map, allTanks);
    }

    aiChase(dt, map, allTanks, target) {
        this.aiMoveTowards(target.x, target.y, map, allTanks);
    }

    aiAttack(dt, map, allTanks, target, params) {
        // 瞄准目标
        let aimX = target.x, aimY = target.y;

        // 预判
        if (params.predict > 0) {
            const dist = MathUtils.distance(this.x, this.y, target.x, target.y);
            const timeToHit = dist / this.bulletSpeed;
            aimX += (target.x - (target.lastX || target.x)) * timeToHit * params.predict * 10;
            aimY += (target.y - (target.lastY || target.y)) * timeToHit * params.predict * 10;
        }

        const targetAngle = MathUtils.angle(this.x, this.y, aimX, aimY);
        this.angle = targetAngle;

        // 射击（带精度）
        this.aiFireTimer += dt;
        if (this.aiFireTimer >= params.reactTime) {
            this.aiFireTimer = 0;
            if (Math.random() < params.accuracy) {
                this.tryFire();
            }
        }

        // 保持距离 - 如果太近就后退
        const dist = MathUtils.distance(this.x, this.y, target.x, target.y);
        if (dist < 60) {
            const dx = this.x - target.x, dy = this.y - target.y;
            const d = Math.hypot(dx, dy) || 1;
            this.move(dx/d * this.moveSpeed, dy/d * this.moveSpeed, map, allTanks);
        } else if (dist > 200) {
            this.aiMoveTowards(target.x, target.y, map, allTanks);
        } else {
            // 侧移
            if (Math.random() < 0.02) {
                const perp = this.angle + Math.PI/2 * (Math.random() < 0.5 ? 1 : -1);
                this.move(Math.cos(perp) * this.moveSpeed, Math.sin(perp) * this.moveSpeed, map, allTanks);
            }
        }
    }

    aiRetreat(dt, map, allTanks, target, items, params) {
        // 寻找最近道具
        let nearestItem = null;
        for (const item of items) {
            if (!item.active) continue;
            const d = MathUtils.distance(this.x, this.y, item.x, item.y);
            if (!nearestItem || d < nearestItem.dist) nearestItem = { item, dist: d };
        }

        if (nearestItem && nearestItem.dist < 200) {
            this.aiMoveTowards(nearestItem.item.x, nearestItem.item.y, map, allTanks);
        } else {
            // 远离敌人
            const dx = this.x - target.x, dy = this.y - target.y;
            const d = Math.hypot(dx, dy) || 1;
            this.move(dx/d * this.moveSpeed, dy/d * this.moveSpeed, map, allTanks);
            // 仍可射击
            this.angle = MathUtils.angle(this.x, this.y, target.x, target.y);
            this.aiFireTimer += dt;
            if (this.aiFireTimer >= params.reactTime * 2) {
                this.aiFireTimer = 0;
                if (Math.random() < params.accuracy * 0.5) this.tryFire();
            }
        }

        // 血量恢复后回到追击
        if (this.health >= 2) this.aiState = 'chase';
    }

    aiMoveTowards(tx, ty, map, allTanks) {
        const myCol = Math.floor(this.x / CONSTANTS.TILE_SIZE);
        const myRow = Math.floor(this.y / CONSTANTS.TILE_SIZE);
        const tCol = Math.floor(tx / CONSTANTS.TILE_SIZE);
        const tRow = Math.floor(ty / CONSTANTS.TILE_SIZE);

        // 简化：直接朝目标方向移动，遇墙则用A*
        const dx = tx - this.x, dy = ty - this.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 5) return;

        let mx = dx / dist, my = dy / dist;
        this.angle = Math.atan2(my, mx);

        // 尝试直接移动
        const moved = this.move(mx * this.moveSpeed, my * this.moveSpeed, map, allTanks);
        if (!moved) {
            // 被挡住了，用A*寻路
            this.aiPathTimer -= 16;
            if (this.aiPathTimer <= 0) {
                this.aiPathTimer = 500;
                const next = Pathfinding.getNextStep(map, myCol, myRow, tCol, tRow);
                if (next) {
                    const nx = next.c * CONSTANTS.TILE_SIZE + 12;
                    const ny = next.r * CONSTANTS.TILE_SIZE + 12;
                    const ndx = nx - this.x, ndy = ny - this.y;
                    const nd = Math.hypot(ndx, ndy) || 1;
                    this.move(ndx/nd * this.moveSpeed, ndy/nd * this.moveSpeed, map, allTanks);
                } else {
                    // 无路径，随机转向
                    const a = Math.random() * Math.PI * 2;
                    this.move(Math.cos(a) * this.moveSpeed, Math.sin(a) * this.moveSpeed, map, allTanks);
                }
            }
        }
    }

    // ===== 移动与碰撞 =====
    move(dx, dy, map, allTanks) {
        // 按 dtScale 缩放位移，使速度与帧率解耦（像素/秒恒定）
        dx *= this.dtScale;
        dy *= this.dtScale;
        let moved = false;
        const halfSize = this.size / 2;

        // X轴
        const newX = this.x + dx;
        if (!this.checkTileCollision(newX, this.y, map) && !this.checkTankCollision(newX, this.y, allTanks)) {
            this.x = MathUtils.clamp(newX, halfSize, CONSTANTS.CANVAS_WIDTH - halfSize);
            moved = true;
        }
        // Y轴
        const newY = this.y + dy;
        if (!this.checkTileCollision(this.x, newY, map) && !this.checkTankCollision(this.x, newY, allTanks)) {
            this.y = MathUtils.clamp(newY, halfSize, CONSTANTS.CANVAS_HEIGHT - halfSize);
            moved = true;
        }
        return moved;
    }

    checkTileCollision(x, y, map) {
        const half = this.size / 2 - 1;
        const corners = [
            [x - half, y - half], [x + half, y - half],
            [x - half, y + half], [x + half, y + half]
        ];
        for (const [cx, cy] of corners) {
            const col = Math.floor(cx / CONSTANTS.TILE_SIZE);
            const row = Math.floor(cy / CONSTANTS.TILE_SIZE);
            if (row < 0 || row >= CONSTANTS.MAP_ROWS || col < 0 || col >= CONSTANTS.MAP_COLS) return true;
            const t = map[row][col];
            if (t === CONSTANTS.TILE_STEEL || t === CONSTANTS.TILE_BRICK || t === CONSTANTS.TILE_WATER) return true;
        }
        return false;
    }

    checkTankCollision(x, y, allTanks) {
        const half = this.size / 2;
        for (const t of allTanks) {
            if (t === this || !t.alive) continue;
            if (MathUtils.aabb(x-half, y-half, x+half, y+half, t.x-t.size/2, t.y-t.size/2, t.x+t.size/2, t.y+t.size/2)) return true;
        }
        return false;
    }

    // ===== 射击 =====
    tryFire() {
        const now = performance.now();
        const cd = this.rapidFire > 0 ? this.fireRate / 2 : this.fireRate;
        if (now - this.lastFireTime < cd) return;
        this.lastFireTime = now;
        AudioSystem.fire();

        const mkBullet = (angle) => new Bullet({
            x: this.x + Math.cos(this.angle) * (this.size / 2 + 4),
            y: this.y + Math.sin(this.angle) * (this.size / 2 + 4),
            angle: angle, speed: this.bulletSpeed,
            owner: this.id, ownerTank: this,
            damage: this.attack, maxBounces: this.maxBounces,
            piercing: this.piercing > 0, color: this.color
        });

        if (this.shotgunPending) {
            this.shotgunPending = false;
            this.newBullets.push(mkBullet(this.angle - 0.25));
            this.newBullets.push(mkBullet(this.angle));
            this.newBullets.push(mkBullet(this.angle + 0.25));
        } else {
            this.newBullets.push(mkBullet(this.angle));
        }
    }

    // ===== 受伤 =====
    takeDamage(amount) {
        if (this.shield) {
            this.shield = false;
            ParticleSystem.spark(this.x, this.y, '#48dbfb');
            AudioSystem.hit();
            return false;
        }
        this.health -= amount;
        AudioSystem.hit();
        ParticleSystem.spark(this.x, this.y, this.color);
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            // 爆炸火光 + 冲击波
            ParticleSystem.explosion(this.x, this.y, this.color);
            // 坦克碎片：长寿命粒子，带重力，慢慢飞溅后消失
            for (let i = 0; i < 12; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 1.5 + Math.random() * 3.5;
                ParticleSystem.spawn({
                    x: this.x, y: this.y,
                    vx: Math.cos(a) * s,
                    vy: Math.sin(a) * s - 2.5,
                    life: 1500 + Math.random() * 700,
                    size: 3 + Math.random() * 3.5,
                    color: this.color,
                    gravity: 0.18
                });
            }
            // 深色金属残渣
            for (let i = 0; i < 6; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 1 + Math.random() * 2.5;
                ParticleSystem.spawn({
                    x: this.x, y: this.y,
                    vx: Math.cos(a) * s,
                    vy: Math.sin(a) * s - 1.5,
                    life: 1200 + Math.random() * 500,
                    size: 2 + Math.random() * 2,
                    color: ['#444', '#555', '#666'][Math.floor(Math.random() * 3)],
                    gravity: 0.22
                });
            }
            AudioSystem.explode();
            ScreenShake.shake(10, 300);
        }
        return true;
    }

    // ===== 道具 =====
    applyItem(itemId) {
        const data = ITEM_DATA[itemId];
        if (!data) return;
        AudioSystem.item();
        ParticleSystem.spark(this.x, this.y, data.color);

        switch (itemId) {
            case 'shield': this.shield = true; break;
            case 'speed': this.speedBoost = data.duration; break;
            case 'rapidfire': this.rapidFire = data.duration; break;
            case 'power': this.piercing = data.duration; break;
            case 'shotgun': this.shotgunPending = true; break;
            case 'mine': this.placeMine = true; break;
            case 'radar': this.radar = data.duration; break;
            case 'repair': this.health = Math.min(this.maxHealth, this.health + 1); break;
        }
    }

    updateBuffs(dt) {
        if (this.speedBoost > 0) this.speedBoost -= dt;
        if (this.rapidFire > 0) this.rapidFire -= dt;
        if (this.piercing > 0) this.piercing -= dt;
        if (this.radar > 0) this.radar -= dt;
        // 记录上一帧位置（AI预判用）
        this.lastX = this.x;
        this.lastY = this.y;
    }

    // ===== 渲染 =====
    render(ctx) {
        if (!this.alive) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const s = this.size;
        const half = s / 2;

        // 履带
        ctx.fillStyle = '#333';
        ctx.fillRect(-half, -half-2, s, 4);
        ctx.fillRect(-half, half-2, s, 4);

        // 车身
        ctx.fillStyle = this.color;
        ctx.fillRect(-half, -half+2, s, s-4);

        // 车身高光
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(-half+2, -half+4, s-4, 3);

        // 炮管
        ctx.fillStyle = '#222';
        ctx.fillRect(0, -3, half + 6, 6);
        ctx.fillStyle = '#444';
        ctx.fillRect(half + 2, -4, 4, 8);

        // 护盾
        if (this.shield) {
            ctx.strokeStyle = 'rgba(72, 219, 251, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(72, 219, 251, 0.3)';
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();

        // 血条
        if (this.health < this.maxHealth) {
            const bw = s + 4, bh = 3;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(this.x - bw/2, this.y - half - 8, bw, bh);
            ctx.fillStyle = this.health > 1 ? '#00ff88' : '#ff4444';
            ctx.fillRect(this.x - bw/2, this.y - half - 8, bw * (this.health / this.maxHealth), bh);
        }
    }
}
