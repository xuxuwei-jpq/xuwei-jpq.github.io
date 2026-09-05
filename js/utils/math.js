// 数学工具
const MathUtils = {
    rand(min, max) { return Math.random() * (max - min) + min; },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },
    distance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
    distanceSq(x1, y1, x2, y2) { const dx=x2-x1, dy=y2-y1; return dx*dx+dy*dy; },
    angle(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1); },
    lerp(a, b, t) { return a + (b - a) * t; },
    normalizeAngle(a) { while(a < 0) a += Math.PI*2; while(a >= Math.PI*2) a -= Math.PI*2; return a; },
    angleDiff(a, b) { let d = this.normalizeAngle(b) - this.normalizeAngle(a); if (d > Math.PI) d -= Math.PI*2; if (d < -Math.PI) d += Math.PI*2; return d; },
    // AABB碰撞
    aabb(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) { return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1; },
    // 圆与矩形碰撞
    circleRect(cx, cy, cr, rx, ry, rw, rh) {
        const closestX = MathUtils.clamp(cx, rx, rx + rw);
        const closestY = MathUtils.clamp(cy, ry, ry + rh);
        return MathUtils.distanceSq(cx, cy, closestX, closestY) <= cr * cr;
    },
    // 线段与圆相交
    lineCircle(x1, y1, x2, y2, cx, cy, r) {
        const dx = x2-x1, dy = y2-y1, lenSq = dx*dx+dy*dy;
        if (lenSq === 0) return Math.hypot(x1-cx, y1-cy) <= r;
        let t = ((cx-x1)*dx + (cy-y1)*dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return MathUtils.distanceSq(x1+t*dx, y1+t*dy, cx, cy) <= r*r;
    }
};
