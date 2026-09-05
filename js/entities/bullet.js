// 子弹类（反弹物理）
class Bullet {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = Math.cos(config.angle) * config.speed;
        this.vy = Math.sin(config.angle) * config.speed;
        this.owner = config.owner;       // 坦克ID
        this.ownerTank = config.ownerTank; // 坦克引用
        this.damage = config.damage || 1;
        this.maxBounces = config.maxBounces !== undefined ? config.maxBounces : CONSTANTS.BULLET_MAX_BOUNCES;
        this.bounces = 0;
        this.piercing = config.piercing || false;
        this.radius = CONSTANTS.BULLET_RADIUS;
        this.life = CONSTANTS.BULLET_LIFETIME;
        this.selfProtection = CONSTANTS.BULLET_SELF_PROTECTION;
        this.active = true;
        this.trail = [];
        this.color = config.color || '#ffdd00';
    }

    update(deltaTime, map) {
        if (!this.active) return;
        const dt = deltaTime / 16.67;

        // 拖尾
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 6) this.trail.shift();

        // 分步移动（防止穿墙）
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(this.vx), Math.abs(this.vy)) * dt / 4));
        const stepDt = dt / steps;
        for (let s = 0; s < steps && this.active; s++) {
            this.x += this.vx * stepDt;
            this.y += this.vy * stepDt;

            // 边界反弹
            if (this.x - this.radius < 0) { this.vx = Math.abs(this.vx); this.x = this.radius; this.onBounce(); }
            if (this.x + this.radius > CONSTANTS.CANVAS_WIDTH) { this.vx = -Math.abs(this.vx); this.x = CONSTANTS.CANVAS_WIDTH - this.radius; this.onBounce(); }
            if (this.y - this.radius < 0) { this.vy = Math.abs(this.vy); this.y = this.radius; this.onBounce(); }
            if (this.y + this.radius > CONSTANTS.CANVAS_HEIGHT) { this.vy = -Math.abs(this.vy); this.y = CONSTANTS.CANVAS_HEIGHT - this.radius; this.onBounce(); }

            // 墙壁碰撞
            this.checkWallCollision(map);
        }

        // 寿命
        this.life -= deltaTime;
        this.selfProtection -= deltaTime;
        if (this.bounces > this.maxBounces || this.life <= 0) {
            this.active = false;
        }
    }

    onBounce() {
        this.bounces++;
        AudioSystem.bounce();
        if (this.bounces > this.maxBounces) { this.active = false; }
        else { ParticleSystem.spark(this.x, this.y, '#ffdd00'); }
    }

    checkWallCollision(map) {
        const col = Math.floor(this.x / CONSTANTS.TILE_SIZE);
        const row = Math.floor(this.y / CONSTANTS.TILE_SIZE);
        if (row < 0 || row >= CONSTANTS.MAP_ROWS || col < 0 || col >= CONSTANTS.MAP_COLS) return;
        const tile = map[row][col];
        if (tile === CONSTANTS.TILE_STEEL) {
            // 钢墙：反弹
            this.bounceOffTile(col, row);
        } else if (tile === CONSTANTS.TILE_BRICK && !this.piercing) {
            // 砖墙：摧毁 + 子弹消失
            map[row][col] = 0;
            this.active = false;
            ParticleSystem.spark(this.x, this.y, '#c87333');
        } else if (tile === CONSTANTS.TILE_BRICK && this.piercing) {
            // 穿甲弹摧毁砖墙但不消失
            map[row][col] = 0;
            ParticleSystem.spark(this.x, this.y, '#ff6b6b');
        }
        // 草丛/水域/冰面：子弹穿过
    }

    bounceOffTile(col, row) {
        const tx = col * CONSTANTS.TILE_SIZE;
        const ty = row * CONSTANTS.TILE_SIZE;
        const cx = tx + CONSTANTS.TILE_SIZE / 2;
        const cy = ty + CONSTANTS.TILE_SIZE / 2;
        const dx = this.x - cx;
        const dy = this.y - cy;
        // 判断碰撞面
        if (Math.abs(dx) > Math.abs(dy)) {
            this.vx = -this.vx;
            this.x = dx > 0 ? tx + CONSTANTS.TILE_SIZE + this.radius : tx - this.radius;
        } else {
            this.vy = -this.vy;
            this.y = dy > 0 ? ty + CONSTANTS.TILE_SIZE + this.radius : ty - this.radius;
        }
        this.onBounce();
    }

    canHitTank(tank) {
        if (!this.active) return false;
        if (this.selfProtection > 0 && tank === this.ownerTank) return false;
        return true;
    }

    render(ctx) {
        const prevAlpha = ctx.globalAlpha;
        // 拖尾（简化渲染：仅设置一次 fillStyle，用 globalAlpha 控制透明度）
        ctx.fillStyle = this.color;
        for (let i = 0; i < this.trail.length; i++) {
            const a = (i / this.trail.length) * 0.4;
            ctx.globalAlpha = prevAlpha * a;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, this.radius * (i / this.trail.length), 0, Math.PI*2);
            ctx.fill();
        }
        ctx.globalAlpha = prevAlpha;
        // 子弹本体：用双层圆模拟发光效果（替代昂贵的 shadowBlur）
        ctx.fillStyle = this.color;
        ctx.globalAlpha = prevAlpha * 0.35;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = prevAlpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fill();
    }
}
