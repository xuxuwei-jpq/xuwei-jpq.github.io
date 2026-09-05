// 坦克数据
const TANK_DATA = {
    player1: { id: 'p1', color: '#ff4444', colorName: '红色', spawnCol: 1, spawnRow: 1 },
    player2: { id: 'p2', color: '#4488ff', colorName: '蓝色', spawnCol: 24, spawnRow: 24 },
    player3: { id: 'p3', color: '#44ff44', colorName: '绿色', spawnCol: 1, spawnRow: 24 },
    ai:      { id: 'ai', color: '#aa44ff', colorName: '紫色' }
};

// AI出生点（根据关卡动态选择地图四角附近）
function getAISpawnPoints(count) {
    const points = [
        { col: 24, row: 1 },
        { col: 12, row: 1 },
        { col: 1, row: 12 },
        { col: 24, row: 12 },
        { col: 12, row: 24 },
        { col: 6, row: 6 },
        { col: 19, row: 19 },
        { col: 6, row: 19 },
        { col: 19, row: 6 },
        { col: 13, row: 13 }
    ];
    return points.slice(0, count);
}
