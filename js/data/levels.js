// 关卡数据
// 地图生成器：生成26x26的地图
function generateMap(type) {
    const S = CONSTANTS.MAP_COLS; // 26
    const map = [];
    for (let r = 0; r < S; r++) {
        map.push(new Array(S).fill(0));
    }
    // 边界钢墙
    for (let i = 0; i < S; i++) {
        map[0][i] = 1; map[S-1][i] = 1; map[i][0] = 1; map[i][S-1] = 1;
    }

    switch (type) {
        case 'open': // 开阔地形
            for (let r = 2; r < S-2; r += 4) {
                for (let c = 2; c < S-2; c += 4) {
                    if (Math.random() < 0.3) map[r][c] = 2;
                }
            }
            break;
        case 'maze': // 砖墙迷宫
            for (let r = 3; r < S-3; r += 3) {
                for (let c = 3; c < S-3; c += 3) {
                    if (Math.random() < 0.5) map[r][c] = 2;
                }
            }
            break;
        case 'steel': // 钢墙为主
            for (let r = 3; r < S-3; r += 4) {
                for (let c = 3; c < S-3; c += 4) {
                    map[r][c] = 1;
                    if (Math.random() < 0.4) map[r][c+1] = 2;
                }
            }
            break;
        case 'grass': // 草丛伏击
            for (let r = 2; r < S-2; r++) {
                for (let c = 2; c < S-2; c++) {
                    if (Math.random() < 0.2) map[r][c] = 3;
                }
            }
            // 加些砖墙
            for (let r = 4; r < S-4; r += 5) {
                for (let c = 4; c < S-4; c += 5) {
                    if (Math.random() < 0.4) map[r][c] = 2;
                }
            }
            break;
        case 'water': // 水域要塞
            for (let c = 2; c < S-2; c++) {
                map[8][c] = 4; map[9][c] = 4;
                map[16][c] = 4; map[17][c] = 4;
            }
            // 留通道
            map[8][6] = 0; map[9][6] = 0; map[16][6] = 0; map[17][6] = 0;
            map[8][12] = 0; map[9][12] = 0; map[16][12] = 0; map[17][12] = 0;
            map[8][19] = 0; map[9][19] = 0; map[16][19] = 0; map[17][19] = 0;
            // 砖墙
            for (let r = 3; r < S-3; r += 4) {
                for (let c = 3; c < S-3; c += 4) {
                    if (Math.random() < 0.3) map[r][c] = 2;
                }
            }
            break;
        case 'ice': // 冰原
            for (let r = 2; r < S-2; r++) {
                for (let c = 2; c < S-2; c++) {
                    if (Math.random() < 0.3) map[r][c] = 5;
                }
            }
            for (let r = 4; r < S-4; r += 5) {
                for (let c = 4; c < S-4; c += 5) {
                    if (Math.random() < 0.3) map[r][c] = 2;
                }
            }
            break;
        case 'mixed': // 混合
            for (let r = 3; r < S-3; r += 3) {
                for (let c = 3; c < S-3; c += 3) {
                    const t = Math.random();
                    if (t < 0.3) map[r][c] = 1;
                    else if (t < 0.55) map[r][c] = 2;
                    else if (t < 0.7) map[r][c] = 3;
                    else if (t < 0.8) map[r][c] = 4;
                }
            }
            break;
        case 'corridor': // 狭窄通道
            for (let r = 3; r < S-3; r++) {
                if (r % 6 < 3) {
                    for (let c = 3; c < S-3; c++) {
                        if (c % 8 !== 0 && c % 8 !== 1) map[r][c] = 2;
                    }
                }
            }
            break;
        case 'arena': // 竞技场
            // 中心钢墙方块
            for (let r = 10; r < 16; r++) {
                for (let c = 10; c < 16; c++) {
                    if (r === 10 || r === 15 || c === 10 || c === 15) map[r][c] = 1;
                }
            }
            // 四角砖墙
            for (let r = 3; r < 7; r++) for (let c = 3; c < 7; c++) if (Math.random()<0.4) map[r][c]=2;
            for (let r = 3; r < 7; r++) for (let c = 19; c < 23; c++) if (Math.random()<0.4) map[r][c]=2;
            for (let r = 19; r < 23; r++) for (let c = 3; c < 7; c++) if (Math.random()<0.4) map[r][c]=2;
            for (let r = 19; r < 23; r++) for (let c = 19; c < 23; c++) if (Math.random()<0.4) map[r][c]=2;
            break;
    }

    // 增加掩体：在战场中部随机放置砖墙掩体块（横条/竖条/2x2），提供更多战术遮挡
    const coverBlocks = 7 + Math.floor(Math.random() * 3); // 7-9个掩体块
    for (let i = 0; i < coverBlocks; i++) {
        const r = 5 + Math.floor(Math.random() * (S - 10));
        const c = 5 + Math.floor(Math.random() * (S - 10));
        const shape = Math.floor(Math.random() * 3);
        if (shape === 0) {
            // 横条掩体
            for (let k = 0; k < 3 && c + k < S - 1; k++) if (map[r][c + k] === 0) map[r][c + k] = 2;
        } else if (shape === 1) {
            // 竖条掩体
            for (let k = 0; k < 3 && r + k < S - 1; k++) if (map[r + k][c] === 0) map[r + k][c] = 2;
        } else {
            // 2x2掩体块
            if (map[r][c] === 0) map[r][c] = 2;
            if (c + 1 < S - 1 && map[r][c + 1] === 0) map[r][c + 1] = 2;
            if (r + 1 < S - 1 && map[r + 1][c] === 0) map[r + 1][c] = 2;
            if (r + 1 < S - 1 && c + 1 < S - 1 && map[r + 1][c + 1] === 0) map[r + 1][c + 1] = 2;
        }
    }

    // 确保出生点附近无障碍
    const spawnClear = [
        [1,1],[2,1],[1,2], [24,24],[23,24],[24,23], [1,24],[2,24],[1,23]
    ];
    for (const [c, r] of spawnClear) {
        if (r < S && c < S) map[r][c] = 0;
    }
    // AI出生点也清理
    for (const p of getAISpawnPoints(10)) {
        if (p.row < S-1 && p.col < S-1) {
            map[p.row][p.col] = 0;
            map[p.row+1][p.col] = 0;
            map[p.row][p.col+1] = 0;
        }
    }
    return map;
}

const LEVEL_DATA = {
    1:  { id:1,  name:'新兵训练营', enemyCount:2, aiDifficulty:'easy',      duration:180000, mapType:'open',     coinReward:100 },
    2:  { id:2,  name:'迷宫战场',   enemyCount:3, aiDifficulty:'easy',      duration:180000, mapType:'maze',     coinReward:120 },
    3:  { id:3,  name:'钢铁防线',   enemyCount:3, aiDifficulty:'easy',      duration:180000, mapType:'steel',    coinReward:150 },
    4:  { id:4,  name:'草丛伏击',   enemyCount:4, aiDifficulty:'normal',    duration:180000, mapType:'grass',    coinReward:180 },
    5:  { id:5,  name:'水域要塞',   enemyCount:4, aiDifficulty:'normal',    duration:180000, mapType:'water',    coinReward:200 },
    6:  { id:6,  name:'冰原突袭',   enemyCount:5, aiDifficulty:'normal',    duration:180000, mapType:'ice',      coinReward:220 },
    7:  { id:7,  name:'混合战场',   enemyCount:5, aiDifficulty:'normal',    duration:180000, mapType:'mixed',    coinReward:250 },
    8:  { id:8,  name:'道具争夺',   enemyCount:6, aiDifficulty:'hard',      duration:180000, mapType:'arena',    coinReward:280 },
    9:  { id:9,  name:'火力压制',   enemyCount:6, aiDifficulty:'hard',      duration:180000, mapType:'corridor', coinReward:300 },
    10: { id:10, name:'精英部队',   enemyCount:7, aiDifficulty:'hard',      duration:180000, mapType:'steel',    coinReward:350 },
    11: { id:11, name:'反弹地狱',   enemyCount:7, aiDifficulty:'hard',      duration:180000, mapType:'steel',    coinReward:380 },
    12: { id:12, name:'暗夜行动',   enemyCount:8, aiDifficulty:'nightmare', duration:180000, mapType:'grass',    coinReward:420 },
    13: { id:13, name:'机关密室',   enemyCount:8, aiDifficulty:'nightmare', duration:180000, mapType:'maze',     coinReward:450 },
    14: { id:14, name:'终极考验',   enemyCount:10,aiDifficulty:'nightmare', duration:180000, mapType:'mixed',    coinReward:500 },
    15: { id:15, name:'钢铁风暴',   enemyCount:12,aiDifficulty:'nightmare', duration:180000, mapType:'arena',    coinReward:800 }
};
