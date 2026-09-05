// 存档系统
const StorageSystem = {
    SAVE_KEY: 'tank_arena_save',
    useMemory: false,
    data: null,
    defaultData: {
        coins: 0, highScore: 0, unlockedLevels: [1], levelStars: {},
        upgrades: { maxHealth:0, attack:0, fireRate:0, bulletSpeed:0, moveSpeed:0, maxBounces:0 },
        settings: { soundEnabled: true, bgmVolume: 0.3, sfxVolume: 0.5 }
    },
    init() {
        try { localStorage.setItem('__test__', '1'); localStorage.removeItem('__test__'); this.useMemory = false; }
        catch(e) { this.useMemory = true; }
        this.load();
    },
    load() {
        try {
            let saved = this.useMemory ? null : localStorage.getItem(this.SAVE_KEY);
            if (saved) { this.data = { ...JSON.parse(JSON.stringify(this.defaultData)), ...JSON.parse(saved) }; this.data.upgrades = { ...this.defaultData.upgrades, ...(JSON.parse(saved).upgrades||{}) }; }
            else { this.data = JSON.parse(JSON.stringify(this.defaultData)); }
        } catch(e) { this.data = JSON.parse(JSON.stringify(this.defaultData)); }
        return this.data;
    },
    save() { if (this.useMemory) return; try { localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.data)); } catch(e){} },
    getUnlockedLevels() { return this.data.unlockedLevels || [1]; },
    getCoins() { return this.data.coins || 0; },
    addCoins(n) { this.data.coins = (this.data.coins||0) + n; this.save(); },
    spendCoins(n) { if ((this.data.coins||0) >= n) { this.data.coins -= n; this.save(); return true; } return false; },
    getHighScore() { return this.data.highScore || 0; },
    setHighScore(s) { if (s > (this.data.highScore||0)) { this.data.highScore = s; this.save(); return true; } return false; },
    isLevelUnlocked(id) { return (this.data.unlockedLevels||[1]).includes(id); },
    unlockLevel(id) { if (!this.data.unlockedLevels) this.data.unlockedLevels=[1]; if (!this.data.unlockedLevels.includes(id)) { this.data.unlockedLevels.push(id); this.save(); } },
    getLevelStars(id) { return this.data.levelStars[id] || 0; },
    setLevelStars(id, s) { if (s > (this.data.levelStars[id]||0)) { this.data.levelStars[id] = s; this.save(); } },
    getUpgrade(id) { return (this.data.upgrades && this.data.upgrades[id]) || 0; },
    getUpgradeCost(id) { const c = UPGRADE_CONFIG[id]; if (!c) return -1; const cur = this.getUpgrade(id); if (cur >= c.maxLevel) return -1; return Math.floor(c.baseCost * (cur+1) * 1.5); },
    upgradeStat(id) { const c = UPGRADE_CONFIG[id]; if (!c) return false; const cur = this.getUpgrade(id); if (cur >= c.maxLevel) return false; const cost = this.getUpgradeCost(id); if (this.spendCoins(cost)) { this.data.upgrades[id] = cur+1; this.save(); return true; } return false; },
    getUpgradeBonus(id) { const c = UPGRADE_CONFIG[id]; if (!c) return 0; return this.getUpgrade(id) * c.perLevel; }
};
