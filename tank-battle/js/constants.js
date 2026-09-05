// 游戏常量
const CONSTANTS = {
    CANVAS_WIDTH: 624,
    CANVAS_HEIGHT: 624,
    TILE_SIZE: 24,
    MAP_COLS: 26,
    MAP_ROWS: 26,

    TANK_SIZE: 22,
    TANK_SPEED: 1.4,
    TANK_MAX_HEALTH: 3,

    BULLET_RADIUS: 4,
    BULLET_SPEED: 5,
    BULLET_LIFETIME: 6000,
    BULLET_MAX_BOUNCES: 3,
    BULLET_SELF_PROTECTION: 1500,
    FIRE_COOLDOWN: 700,

    ITEM_SPAWN_INTERVAL: 12000,
    ITEM_MAX_COUNT: 3,
    ITEM_LIFETIME: 18000,

    MAX_LEVEL: 15,

    // 地形ID
    TILE_EMPTY: 0,
    TILE_STEEL: 1,
    TILE_BRICK: 2,
    TILE_GRASS: 3,
    TILE_WATER: 4,
    TILE_ICE: 5,

    SCENES: { START: 'start', GAME: 'game' }
};

const UPGRADE_CONFIG = {
    maxHealth: { name: '最大生命', icon: '❤️', desc: '血量+1/级', maxLevel: 5, baseCost: 150, perLevel: 1 },
    attack: { name: '攻击力', icon: '💥', desc: '伤害+1/级', maxLevel: 5, baseCost: 120, perLevel: 1 },
    fireRate: { name: '射速', icon: '🔥', desc: '射速+30%/级', maxLevel: 5, baseCost: 100, perLevel: 0.3 },
    bulletSpeed: { name: '子弹速度', icon: '⚡', desc: '速度+0.5/级', maxLevel: 5, baseCost: 80, perLevel: 0.5 },
    moveSpeed: { name: '移动速度', icon: '🏃', desc: '速度+0.2/级', maxLevel: 5, baseCost: 100, perLevel: 0.2 },
    maxBounces: { name: '反弹次数', icon: '🔄', desc: '反弹+1/级', maxLevel: 3, baseCost: 200, perLevel: 1 }
};

// AI参数
const AI_PARAMS = {
    easy:     { reactTime: 800, accuracy: 0.4, detectRange: 150, attackRange: 120, useItems: false, predict: 0 },
    normal:   { reactTime: 400, accuracy: 0.65, detectRange: 300, attackRange: 200, useItems: true,  predict: 0.3 },
    hard:     { reactTime: 200, accuracy: 0.85, detectRange: 999, attackRange: 300, useItems: true,  predict: 0.6 },
    nightmare:{ reactTime: 100, accuracy: 0.95, detectRange: 999, attackRange: 400, useItems: true,  predict: 1.0 }
};
