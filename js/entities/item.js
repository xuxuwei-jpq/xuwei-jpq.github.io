// 道具类
class Item {
    constructor(type, x, y) {
        const data = ITEM_DATA[type];
        this.type = type;
        this.data = data;
        this.x = x;
        this.y = y;
        this.radius = 14;
        this.active = true;
        this.life = CONSTANTS.ITEM_LIFETIME;
        this.time = 0;
    }

    update(deltaTime) {
        if (!this.active) return;
        this.time += deltaTime;
        this.life -= deltaTime;
        if (this.life <= 0) this.active = false;
    }

    checkPickup(tank) {
        if (!this.active || !tank.alive) return false;
        return MathUtils.distance(this.x, this.y, tank.x, tank.y) < this.radius + tank.size / 2;
    }

    collect() { this.active = false; }

    render(ctx) {
        if (!this.active) return;
        const pulse = 0.6 + Math.sin(this.time * 0.005) * 0.4;
        const fadeOut = this.life < 3000 ? Math.sin(this.time * 0.01) * 0.5 + 0.5 : 1;
        const prevAlpha = ctx.globalAlpha;

        ctx.save();
        ctx.globalAlpha = fadeOut;
        ctx.translate(this.x, this.y);

        // 光环（移除昂贵的 shadowBlur，用脉动环模拟发光）
        ctx.strokeStyle = this.data.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * (1 + pulse * 0.2), 0, Math.PI * 2);
        ctx.stroke();

        // 内圈：用纯色 + 透明度替代每帧创建 createRadialGradient
        ctx.globalAlpha = fadeOut * 0.5 * pulse;
        ctx.fillStyle = this.data.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fadeOut;

        // 图标
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.data.emoji, 0, 0);

        ctx.restore();
        ctx.globalAlpha = prevAlpha;
    }
}
