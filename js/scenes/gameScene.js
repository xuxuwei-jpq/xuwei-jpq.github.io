// 游戏主场景
const GameScene = {
    tanks: [],
    bullets: [],
    items: [],
    map: null,
    levelData: null,
    currentLevel: 1,
    playerCount: 1,
    difficulty: 'normal',

    score: 0,
    kills: 0,
    timeRemaining: 180000,

    itemSpawnTimer: 0,
    gameOver: false,
    victory: false,
    paused: false,
    endTimer: 0,

    init(levelId, playerCount, difficulty) {
        this.currentLevel = levelId;
        this.playerCount = playerCount;
        this.difficulty = difficulty;
        this.levelData = LEVEL_DATA[levelId] || LEVEL_DATA[1];

        this.map = generateMap(this.levelData.mapType);
        this.tanks = [];
        this.bullets = [];
        this.items = [];

        // 玩家坦克
        const playerConfigs = [
            { ...TANK_DATA.player1, playerIndex: 0 },
            { ...TANK_DATA.player2, playerIndex: 1 },
            { ...TANK_DATA.player3, playerIndex: 2 }
        ];
        for (let i = 0; i < playerCount; i++) {
            const cfg = playerConfigs[i];
            this.tanks.push(new Tank({
                ...cfg,
                x: cfg.spawnCol * CONSTANTS.TILE_SIZE + 12,
                y: cfg.spawnRow * CONSTANTS.TILE_SIZE + 12,
                isAI: false
            }));
        }

        // AI坦克
        const enemyCount = this.levelData.enemyCount;
        const aiSpawns = getAISpawnPoints(enemyCount);
        for (let i = 0; i < enemyCount; i++) {
            const sp = aiSpawns[i] || { col: 13, row: 13 };
            this.tanks.push(new Tank({
                id: 'ai' + i,
                color: TANK_DATA.ai.color,
                x: sp.col * CONSTANTS.TILE_SIZE + 12,
                y: sp.row * CONSTANTS.TILE_SIZE + 12,
                isAI: true,
                difficulty: this.difficulty
            }));
        }

        this.score = 0;
        this.kills = 0;
        this.timeRemaining = this.levelData.duration;
        this.itemSpawnTimer = 0;
        this.gameOver = false;
        this.victory = false;
        this.paused = false;
        this.endTimer = 0;

        ParticleSystem.init();
        HUD.show();
        AudioSystem.playBGM('battle');
    },

    update(deltaTime, input) {
        if (this.paused) return;

        if (this.gameOver) {
            this.endTimer += deltaTime;
            // 持续播放爆炸碎片动画与屏幕震动
            ParticleSystem.update(deltaTime);
            ScreenShake.update(deltaTime);
            // 胜利：1秒后显示结算界面（供玩家领星星、选下一关）
            // 失败：2.5秒后自动回主页面（让爆炸碎片动画播完）
            if (this.endTimer > (this.victory ? 1000 : 2500) && this.endTimer > 0) {
                this.endTimer = -99999;
                if (window.game) window.game.onGameOver(this.victory);
            }
            return;
        }

        // 计时
        this.timeRemaining -= deltaTime;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            this.endGame(false);
            return;
        }

        // 更新坦克
        for (const tank of this.tanks) {
            tank.update(deltaTime, input, this.map, this.tanks, this.items);
            // 收集坦克射击的子弹
            if (tank.newBullets.length > 0) {
                for (const b of tank.newBullets) this.bullets.push(b);
                tank.newBullets = [];
            }
        }

        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(deltaTime, this.map);

            // 子弹击中坦克
            if (b.active) {
                for (const tank of this.tanks) {
                    if (!tank.alive) continue;
                    if (!b.canHitTank(tank)) continue;
                    if (MathUtils.distance(b.x, b.y, tank.x, tank.y) < b.radius + tank.size / 2 - 2) {
                        const wasAlive = tank.alive;
                        const damaged = tank.takeDamage(b.damage);
                        b.active = false;
                        if (wasAlive && !tank.alive && tank.isAI) {
                            this.kills++;
                            this.score += 100;
                        } else if (damaged && tank.isAI) {
                            this.score += 10;
                        }
                        break;
                    }
                }
            }
            if (!b.active) this.bullets.splice(i, 1);
        }

        // 更新道具
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(deltaTime);
            for (const tank of this.tanks) {
                if (!tank.alive) continue;
                if (item.checkPickup(tank)) {
                    tank.applyItem(item.type);
                    item.collect();
                    break;
                }
            }
            if (!item.active) this.items.splice(i, 1);
        }

        // 道具生成
        this.itemSpawnTimer += deltaTime;
        if (this.itemSpawnTimer >= CONSTANTS.ITEM_SPAWN_INTERVAL && this.items.length < CONSTANTS.ITEM_MAX_COUNT) {
            this.itemSpawnTimer = 0;
            this.spawnItem();
        }

        ParticleSystem.update(deltaTime);
        ScreenShake.update(deltaTime);

        // 胜负判定
        const aliveEnemies = this.tanks.filter(t => t.isAI && t.alive).length;
        const alivePlayers = this.tanks.filter(t => !t.isAI && t.alive).length;
        if (aliveEnemies === 0) {
            this.endGame(true);
        } else if (alivePlayers === 0) {
            this.endGame(false);
        }

        HUD.update(this);
    },

    spawnItem() {
        for (let attempts = 0; attempts < 20; attempts++) {
            const col = MathUtils.randInt(2, CONSTANTS.MAP_COLS - 3);
            const row = MathUtils.randInt(2, CONSTANTS.MAP_ROWS - 3);
            if (this.map[row][col] === 0) {
                const type = pickRandomItem();
                this.items.push(new Item(type, col * CONSTANTS.TILE_SIZE + 12, row * CONSTANTS.TILE_SIZE + 12));
                return;
            }
        }
    },

    endGame(victory) {
        if (this.gameOver) return;
        this.gameOver = true;
        this.victory = victory;
        this.endTimer = 0;
        if (victory) AudioSystem.victory();
        else AudioSystem.defeat();
    },

    calculateStars() {
        if (!this.victory) return 0;
        const players = this.tanks.filter(t => !t.isAI);
        const allFullHp = players.every(t => t.health >= t.maxHealth);
        if (allFullHp) return 3;
        const avgHp = players.reduce((s, t) => s + t.health / t.maxHealth, 0) / players.length;
        if (avgHp >= 0.5) return 2;
        return 1;
    },

    render(ctx) {
        const shake = ScreenShake.getOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        // 背景
        ctx.fillStyle = '#0d1b2a';
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // 网格
        ctx.strokeStyle = 'rgba(78, 201, 176, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CONSTANTS.MAP_COLS; i++) {
            const p = i * CONSTANTS.TILE_SIZE;
            ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, CONSTANTS.CANVAS_HEIGHT); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(CONSTANTS.CANVAS_WIDTH, p); ctx.stroke();
        }

        // 渲染地图（非草丛）
        this.renderMap(ctx);

        // 渲染道具
        for (const item of this.items) item.render(ctx);

        // 渲染坦克
        for (const tank of this.tanks) {
            if (!tank.alive) continue;
            const col = Math.floor(tank.x / CONSTANTS.TILE_SIZE);
            const row = Math.floor(tank.y / CONSTANTS.TILE_SIZE);
            const inGrass = row >= 0 && row < CONSTANTS.MAP_ROWS && col >= 0 && col < CONSTANTS.MAP_COLS && this.map[row][col] === CONSTANTS.TILE_GRASS;

            if (inGrass && tank.isAI) {
                const hasRadar = this.tanks.some(t => !t.isAI && t.alive && t.radar > 0);
                if (hasRadar) {
                    ctx.globalAlpha = 0.4;
                    tank.render(ctx);
                    ctx.globalAlpha = 1;
                }
            } else if (inGrass && !tank.isAI) {
                ctx.globalAlpha = 0.6;
                tank.render(ctx);
                ctx.globalAlpha = 1;
            } else {
                tank.render(ctx);
            }
        }

        // 渲染子弹
        for (const b of this.bullets) b.render(ctx);

        // 渲染粒子
        ParticleSystem.render(ctx);

        // 草丛覆盖层
        this.renderGrassOverlay(ctx);

        ctx.restore();
    },

    renderMap(ctx) {
        const ts = CONSTANTS.TILE_SIZE;
        const time = performance.now();
        for (let r = 0; r < CONSTANTS.MAP_ROWS; r++) {
            for (let c = 0; c < CONSTANTS.MAP_COLS; c++) {
                const tile = this.map[r][c];
                const x = c * ts, y = r * ts;
                if (tile === 0 || tile === CONSTANTS.TILE_GRASS) continue;

                switch (tile) {
                    case CONSTANTS.TILE_STEEL:
                        ctx.fillStyle = '#555';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = '#777';
                        ctx.fillRect(x + 1, y + 1, ts - 2, ts - 2);
                        ctx.fillStyle = '#999';
                        ctx.fillRect(x + 2, y + 2, 2, 2);
                        ctx.fillRect(x + ts - 4, y + 2, 2, 2);
                        ctx.fillRect(x + 2, y + ts - 4, 2, 2);
                        ctx.fillRect(x + ts - 4, y + ts - 4, 2, 2);
                        ctx.fillStyle = '#444';
                        ctx.fillRect(x + ts / 2 - 1, y + 2, 2, ts - 4);
                        break;
                    case CONSTANTS.TILE_BRICK:
                        ctx.fillStyle = '#8b4513';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = '#c87333';
                        for (let br = 0; br < 3; br++) {
                            for (let bc = 0; bc < 3; bc++) {
                                if ((br + bc) % 2 === 0) {
                                    ctx.fillRect(x + bc * ts / 3 + 1, y + br * ts / 3 + 1, ts / 3 - 2, ts / 3 - 2);
                                }
                            }
                        }
                        break;
                    case CONSTANTS.TILE_WATER:
                        const wave = Math.sin(time * 0.003 + (c + r) * 0.5) * 0.5 + 0.5;
                        ctx.fillStyle = `rgba(40, 100, 180, 0.8)`;
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = `rgba(100, 180, 255, ${wave * 0.4})`;
                        ctx.fillRect(x + 2, y + ts / 3, ts - 4, 2);
                        ctx.fillRect(x + 2, y + 2 * ts / 3, ts - 4, 2);
                        break;
                    case CONSTANTS.TILE_ICE:
                        ctx.fillStyle = '#a8d8f0';
                        ctx.fillRect(x, y, ts, ts);
                        ctx.fillStyle = 'rgba(255,255,255,0.4)';
                        ctx.fillRect(x + 2, y + 2, ts - 4, ts - 4);
                        ctx.fillStyle = 'rgba(200,230,255,0.6)';
                        ctx.fillRect(x + ts / 4, y + ts / 4, ts / 2, ts / 2);
                        break;
                }
            }
        }
    },

    renderGrassOverlay(ctx) {
        const ts = CONSTANTS.TILE_SIZE;
        for (let r = 0; r < CONSTANTS.MAP_ROWS; r++) {
            for (let c = 0; c < CONSTANTS.MAP_COLS; c++) {
                if (this.map[r][c] === CONSTANTS.TILE_GRASS) {
                    const x = c * ts, y = r * ts;
                    ctx.fillStyle = 'rgba(50, 150, 50, 0.55)';
                    ctx.fillRect(x, y, ts, ts);
                    ctx.fillStyle = 'rgba(80, 180, 80, 0.4)';
                    for (let i = 0; i < 4; i++) {
                        const gx = x + ((i * 7 + r * 3) % ts);
                        const gy = y + ((i * 5 + c * 3) % ts);
                        ctx.fillRect(gx, gy, 2, 3);
                    }
                }
            }
        }
    },

    cleanup() {
        HUD.hide();
        AudioSystem.stopBGM();
    }
};
