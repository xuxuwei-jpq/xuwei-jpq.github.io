// 菜单系统
const MenuUI = {
    screens: {},
    pendingMode: 1,    // 玩家数
    pendingDifficulty: 'normal',

    init() {
        this.screens.start = document.getElementById('start-screen');
        this.screens.difficulty = document.getElementById('difficulty-screen');
        this.screens.levelSelect = document.getElementById('level-select-screen');
        this.screens.shop = document.getElementById('shop-screen');
        this.screens.help = document.getElementById('help-screen');
        this.screens.pause = document.getElementById('pause-screen');
        this.screens.result = document.getElementById('result-screen');
        this.screens.gameHud = document.getElementById('game-hud');

        // 模式选择
        document.getElementById('btn-single').addEventListener('click', () => { this.pendingMode = 1; this.showScreen('difficulty'); });
        document.getElementById('btn-double').addEventListener('click', () => { this.pendingMode = 2; this.showScreen('difficulty'); });
        document.getElementById('btn-triple').addEventListener('click', () => { this.pendingMode = 3; this.showScreen('difficulty'); });
        document.getElementById('btn-shop').addEventListener('click', () => { this.showScreen('shop'); this.renderShop(); });
        document.getElementById('btn-help').addEventListener('click', () => { this.showScreen('help'); });

        // AI难度
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.pendingDifficulty = btn.dataset.diff;
                this.showScreen('levelSelect');
                this.renderLevelList();
            });
        });

        // 返回按钮
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const back = btn.dataset.back;
                if (back === 'start') this.showScreen('start');
                else if (back === 'difficulty') this.showScreen('difficulty');
            });
        });

        // 暂停
        document.getElementById('btn-pause').addEventListener('click', () => { if (window.game) window.game.togglePause(); });
        document.getElementById('btn-resume').addEventListener('click', () => { if (window.game) window.game.togglePause(); });
        document.getElementById('btn-restart').addEventListener('click', () => { this.hideScreen('pause'); if (window.game) window.game.restart(); });
        document.getElementById('btn-quit').addEventListener('click', () => { this.hideScreen('pause'); if (window.game) window.game.quitToMenu(); });

        // 结算
        document.getElementById('btn-next-level').addEventListener('click', () => { this.hideScreen('result'); if (window.game) window.game.nextLevel(); });
        document.getElementById('btn-retry').addEventListener('click', () => { this.hideScreen('result'); if (window.game) window.game.restart(); });
        document.getElementById('btn-back-menu').addEventListener('click', () => { this.hideScreen('result'); if (window.game) window.game.quitToMenu(); });

        this.updateStatsBar();
    },

    showScreen(name) { for (const k in this.screens) this.screens[k].classList.remove('active'); if (this.screens[name]) this.screens[name].classList.add('active'); },
    hideScreen(name) { if (this.screens[name]) this.screens[name].classList.remove('active'); },
    showPause() { this.screens.pause.classList.add('active'); },
    hidePause() { this.screens.pause.classList.remove('active'); },

    showResult(victory, stats) {
        const title = document.getElementById('result-title');
        title.textContent = victory ? '胜利!' : '失败';
        title.className = victory ? 'victory' : 'defeat';
        document.getElementById('result-stars').textContent = '⭐'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
        document.getElementById('final-score').textContent = stats.score;
        document.getElementById('final-kills').textContent = stats.kills;
        document.getElementById('final-coins').textContent = stats.coins;
        document.getElementById('btn-next-level').style.display = victory ? 'block' : 'none';
        this.screens.result.classList.add('active');
    },

    updateStatsBar() {
        document.getElementById('highscore-display').textContent = StorageSystem.getHighScore();
        document.getElementById('coins-display').textContent = StorageSystem.getCoins();
        const maxUnlocked = Math.max(...StorageSystem.getUnlockedLevels());
        document.getElementById('progress-display').textContent = `${maxUnlocked}/${CONSTANTS.MAX_LEVEL}`;
    },

    renderLevelList() {
        const list = document.getElementById('level-list');
        list.innerHTML = '';
        for (let i = 1; i <= CONSTANTS.MAX_LEVEL; i++) {
            const data = LEVEL_DATA[i];
            const unlocked = StorageSystem.isLevelUnlocked(i);
            const stars = StorageSystem.getLevelStars(i);
            const card = document.createElement('div');
            card.className = 'level-card' + (unlocked ? '' : ' locked');
            card.innerHTML = `<div class="level-number">${i}</div><div class="level-stars">${'⭐'.repeat(stars)}${'·'.repeat(3-stars)}</div>`;
            if (unlocked) {
                card.addEventListener('click', () => {
                    AudioSystem.resume();
                    if (window.game) window.game.startGame(i, this.pendingMode, this.pendingDifficulty);
                });
            }
            list.appendChild(card);
        }
    },

    renderShop() {
        const content = document.getElementById('shop-content');
        document.getElementById('shop-coins-count').textContent = StorageSystem.getCoins();
        content.innerHTML = '';
        for (const id in UPGRADE_CONFIG) {
            const cfg = UPGRADE_CONFIG[id];
            const lv = StorageSystem.getUpgrade(id);
            const cost = StorageSystem.getUpgradeCost(id);
            const maxed = lv >= cfg.maxLevel;
            const item = document.createElement('div');
            item.className = 'shop-item';
            item.innerHTML = `
                <div>
                    <div class="shop-item-name">${cfg.icon} ${cfg.name} <span style="color:#feca57;font-size:11px;">Lv.${lv}/${cfg.maxLevel}</span></div>
                    <div class="shop-item-level">${cfg.desc}</div>
                </div>
                <button class="shop-item-btn" ${maxed?'disabled':''}>${maxed?'已满级':'💰 '+cost}</button>`;
            const btn = item.querySelector('.shop-item-btn');
            if (!maxed) {
                btn.addEventListener('click', () => {
                    if (StorageSystem.upgradeStat(id)) { AudioSystem.item(); this.renderShop(); }
                    else alert('金币不足！');
                });
            }
            content.appendChild(item);
        }
    }
};
