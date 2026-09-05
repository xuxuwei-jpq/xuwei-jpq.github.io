// 道具数据
const ITEM_DATA = {
    shield:    { id: 'shield',    name: '能量护盾', emoji: '🛡️', color: '#48dbfb', duration: 0,     desc: '免疫1次伤害' },
    speed:     { id: 'speed',     name: '加速引擎', emoji: '⚡',  color: '#feca57', duration: 8000,  desc: '移动速度+50%' },
    rapidfire: { id: 'rapidfire', name: '连发模式', emoji: '🔥',  color: '#ee5a52', duration: 8000,  desc: '射速x2' },
    power:     { id: 'power',     name: '穿甲弹',   emoji: '💥',  color: '#ff6b6b', duration: 6000,  desc: '子弹穿透砖墙' },
    shotgun:   { id: 'shotgun',   name: '散弹',     emoji: '✨',  color: '#ffd700', duration: 0,     desc: '一次发射3发' },
    mine:      { id: 'mine',      name: '地雷',     emoji: '💣',  color: '#ff4444', duration: 0,     desc: '放置地雷' },
    radar:     { id: 'radar',     name: '雷达扫描', emoji: '📡',  color: '#00ff88', duration: 5000,  desc: '显示全图敌人' },
    repair:    { id: 'repair',    name: '紧急修复', emoji: '🔧',  color: '#00ff88', duration: 0,     desc: '恢复1点生命' }
};

const ITEM_IDS = Object.keys(ITEM_DATA);

function pickRandomItem() {
    return ITEM_IDS[Math.floor(Math.random() * ITEM_IDS.length)];
}
