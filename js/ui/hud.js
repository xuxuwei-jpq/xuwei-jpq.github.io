// HUD系统
const HUD = {
    el: {},
    init() {
        this.el.p1hp = document.getElementById('p1-hp');
        this.el.p2hp = document.getElementById('p2-hp');
        this.el.p3hp = document.getElementById('p3-hp');
        this.el.level = document.getElementById('hud-level');
        this.el.enemies = document.getElementById('hud-enemies');
        this.el.score = document.getElementById('hud-score');
        this.el.timer = document.getElementById('hud-timer');
        this.el.itemStatus = document.getElementById('item-status');
        this.el.hud = document.getElementById('game-hud');
    },
    show() { this.el.hud.classList.add('active'); },
    hide() { this.el.hud.classList.remove('active'); },

    hpText(tank) {
        if (!tank || !tank.alive) return '';
        return '❤️'.repeat(tank.health) + '🖤'.repeat(tank.maxHealth - tank.health);
    },

    update(gs) {
        if (!gs) return;
        // 玩家血量
        this.el.p1hp.textContent = gs.playerCount >= 1 && gs.tanks[0] ? 'P1 ' + this.hpText(gs.tanks[0]) : '';
        this.el.p2hp.textContent = gs.playerCount >= 2 && gs.tanks[1] ? 'P2 ' + this.hpText(gs.tanks[1]) : '';
        this.el.p3hp.textContent = gs.playerCount >= 3 && gs.tanks[2] ? 'P3 ' + this.hpText(gs.tanks[2]) : '';

        // 关卡信息
        this.el.level.textContent = gs.currentLevel;
        const enemyCount = gs.tanks.filter(t => t.isAI && t.alive).length;
        this.el.enemies.textContent = enemyCount;

        // 分数
        this.el.score.textContent = gs.score;

        // 计时
        const remain = Math.max(0, gs.timeRemaining);
        const sec = Math.ceil(remain / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        this.el.timer.textContent = `${m}:${s.toString().padStart(2,'0')}`;

        // 道具状态
        let html = '';
        const player = gs.tanks[0];
        if (player && player.alive) {
            if (player.shield) html += '<span class="item-badge">🛡️</span>';
            if (player.speedBoost > 0) html += `<span class="item-badge">⚡${Math.ceil(player.speedBoost/1000)}s</span>`;
            if (player.rapidFire > 0) html += `<span class="item-badge">🔥${Math.ceil(player.rapidFire/1000)}s</span>`;
            if (player.piercing > 0) html += `<span class="item-badge">💥${Math.ceil(player.piercing/1000)}s</span>`;
            if (player.shotgunPending) html += '<span class="item-badge">✨</span>';
        }
        this.el.itemStatus.innerHTML = html;
    }
};
