// A*寻路算法（性能优化版）
const Pathfinding = {
    findPath(map, startCol, startRow, endCol, endRow) {
        const S = CONSTANTS.MAP_COLS;
        if (startCol === endCol && startRow === endRow) return [];
        if (endCol < 0 || endCol >= S || endRow < 0 || endRow >= S) return null;

        const isWalkable = (c, r) => {
            if (c < 0 || c >= S || r < 0 || r >= S) return false;
            const t = map[r][c];
            return t === 0 || t === 3 || t === 5; // 空地/草丛/冰面可走
        };

        const key = (c, r) => r * S + c;
        // open 用数组存储节点（索引访问比 Map.values() 迭代快）
        const open = [];
        const openMap = new Map(); // 仅用于 O(1) 查找已存在的节点
        const closed = new Set();
        const start = { c: startCol, r: startRow, g: 0, h: Math.abs(startCol-endCol)+Math.abs(startRow-endRow), f: 0, parent: null };
        start.f = start.g + start.h;
        open.push(start);
        openMap.set(key(startCol, startRow), start);

        while (open.length > 0) {
            // 找f值最小的节点（数组索引遍历）
            let minIdx = 0, minF = open[0].f;
            for (let i = 1; i < open.length; i++) {
                if (open[i].f < minF) { minF = open[i].f; minIdx = i; }
            }
            const current = open[minIdx];

            if (current.c === endCol && current.r === endRow) {
                // 回溯路径
                const path = [];
                let n = current;
                while (n.parent) { path.unshift({ c: n.c, r: n.r }); n = n.parent; }
                return path;
            }

            // 从 open 移除：用末尾交换 + pop，O(1) 替代 splice 的 O(n)
            open[minIdx] = open[open.length - 1];
            open.pop();
            openMap.delete(key(current.c, current.r));
            closed.add(key(current.c, current.r));

            // 4方向邻居
            for (const [dc, dr] of [[0,-1],[1,0],[0,1],[-1,0]]) {
                const nc = current.c + dc, nr = current.r + dr;
                if (!isWalkable(nc, nr)) continue;
                if (closed.has(key(nc, nr))) continue;

                const g = current.g + 1;
                const h = Math.abs(nc-endCol) + Math.abs(nr-endRow);
                const f = g + h;
                const k = key(nc, nr);
                const existing = openMap.get(k);
                if (existing && existing.f <= f) continue;
                if (existing) {
                    // 更新已有节点
                    existing.g = g; existing.h = h; existing.f = f; existing.parent = current;
                } else {
                    const node = { c: nc, r: nr, g, h, f, parent: current };
                    open.push(node);
                    openMap.set(k, node);
                }
            }
        }
        return null; // 无路径
    },

    // 获取下一步方向
    getNextStep(map, startCol, startRow, endCol, endRow) {
        const path = this.findPath(map, startCol, startRow, endCol, endRow);
        if (!path || path.length === 0) return null;
        return path[0]; // {c, r}
    }
};
