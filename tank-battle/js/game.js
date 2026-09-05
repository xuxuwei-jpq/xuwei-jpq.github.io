// 游戏核心引擎
class Game {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.lastTime = 0;
        this.running = false;
        this.isPaused = false;
        this.currentScene = 'start';
        this.currentLevel = 1;
        this.playerCount = 1;
        this.difficulty = 'normal';

        window.addEventListener('keydown', (e) => {
            if ((e.key === 'Escape' || e.key.toLowerCase() === 'p') && this.currentScene === 'game') {
                this.togglePause();
            }
        });
    }

    init() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) { console.error('Canvas 2D 不支持'); return; }

        StorageSystem.init();
        AudioSystem.init();
        InputSystem.init(this.canvas);
        HUD.init();
        MenuUI.init();
        StartScene.init();

        AudioSystem.playBGM('menu');
        this.running = true;
        this.lastTime = performance.now();
        this.gameLoop();
        console.log('🎖️ 钢铁防线启动成功！');
    }

    gameLoop() {
        if (!this.running) return;
        const now = performance.now();
        const dt = Math.min(now - this.lastTime, 50);
        this.lastTime = now;

        if (!this.isPaused) {
            this.update(dt);
        }
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update(dt) {
        switch (this.currentScene) {
            case 'start': StartScene.update(dt); break;
            case 'game':
                if (!GameScene.paused) {
                    GameScene.update(dt, InputSystem);
                }
                InputSystem.endFrame();
                break;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        switch (this.currentScene) {
            case 'start': StartScene.render(this.ctx); break;
            case 'game': GameScene.render(this.ctx); break;
        }
    }

    startGame(levelId, playerCount, difficulty) {
        this.currentLevel = levelId;
        this.playerCount = playerCount;
        this.difficulty = difficulty;
        this.currentScene = 'game';
        this.isPaused = false;
        GameScene.init(levelId, playerCount, difficulty);
        MenuUI.showScreen('gameHud');
        this.lastTime = performance.now();
    }

    togglePause() {
        if (this.currentScene !== 'game') return;
        GameScene.paused = !GameScene.paused;
        this.isPaused = GameScene.paused;
        if (GameScene.paused) MenuUI.showPause();
        else { MenuUI.hidePause(); this.lastTime = performance.now(); }
    }

    restart() {
        this.isPaused = false;
        this.startGame(this.currentLevel, this.playerCount, this.difficulty);
    }

    nextLevel() {
        const next = this.currentLevel + 1;
        if (next > CONSTANTS.MAX_LEVEL) { this.quitToMenu(); return; }
        this.startGame(next, this.playerCount, this.difficulty);
    }

    quitToMenu() {
        this.isPaused = false;
        GameScene.cleanup();
        this.currentScene = 'start';
        MenuUI.showScreen('start');
        MenuUI.updateStatsBar();
        AudioSystem.playBGM('menu');
    }

    onGameOver(victory) {
        const stars = GameScene.calculateStars();
        const baseReward = LEVEL_DATA[this.currentLevel].coinReward;
        const coinMult = [1, 1, 1.5, 2][stars] || 1;
        const coinBonus = 1 + StorageSystem.getUpgradeBonus('coinMultiplier');
        const coins = Math.floor(baseReward * coinMult * (victory ? coinBonus : 0.3));

        // 静默结算金币与最高分
        StorageSystem.addCoins(coins);
        StorageSystem.setHighScore(GameScene.score);

        if (victory) {
            // 胜利：显示结算界面（领星星、解锁下一关、选择下一关/重试/返回）
            StorageSystem.unlockLevel(this.currentLevel + 1);
            StorageSystem.setLevelStars(this.currentLevel, stars);
            MenuUI.showResult(true, {
                score: GameScene.score,
                kills: GameScene.kills,
                coins: coins,
                stars: stars
            });
        } else {
            // 玩家全部阵亡：自动回到主页面（金币已结算，主页可看到最新数值）
            this.quitToMenu();
        }
    }
}
