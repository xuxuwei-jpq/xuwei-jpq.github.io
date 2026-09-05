// 开始场景：背景动画
const StartScene = {
    time: 0,
    tanks: [],
    init() {
        this.time = 0;
        this.tanks = [];
        const colors = ['#ff4444', '#4488ff', '#44ff44', '#aa44ff'];
        for (let i = 0; i < 4; i++) {
            this.tanks.push({
                x: Math.random() * CONSTANTS.CANVAS_WIDTH,
                y: Math.random() * CONSTANTS.CANVAS_HEIGHT,
                angle: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                color: colors[i],
                size: 20
            });
        }
    },
    update(dt) {
        this.time += dt;
        const d = dt / 16.67;
        for (const t of this.tanks) {
            t.x += Math.cos(t.angle) * t.speed * d;
            t.y += Math.sin(t.angle) * t.speed * d;
            if (t.x < 20 || t.x > CONSTANTS.CANVAS_WIDTH - 20) t.angle = Math.PI - t.angle;
            if (t.y < 20 || t.y > CONSTANTS.CANVAS_HEIGHT - 20) t.angle = -t.angle;
            if (Math.random() < 0.01) t.angle += (Math.random() - 0.5) * 0.5;
        }
    },
    render(ctx) {
        // 背景
        const grad = ctx.createLinearGradient(0, 0, 0, CONSTANTS.CANVAS_HEIGHT);
        grad.addColorStop(0, '#0d1b2a');
        grad.addColorStop(1, '#0a1520');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);

        // 网格
        ctx.strokeStyle = 'rgba(78, 201, 176, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= CONSTANTS.MAP_COLS; i++) {
            const p = i * CONSTANTS.TILE_SIZE;
            ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, CONSTANTS.CANVAS_HEIGHT); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(CONSTANTS.CANVAS_WIDTH, p); ctx.stroke();
        }

        // 装饰坦克
        for (const t of this.tanks) {
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = t.color;
            ctx.fillRect(-t.size/2, -t.size/2, t.size, t.size);
            ctx.fillStyle = '#333';
            ctx.fillRect(0, -2, t.size/2 + 4, 4);
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
};
