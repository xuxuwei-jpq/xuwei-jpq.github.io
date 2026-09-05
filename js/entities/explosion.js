// 爆炸特效（简化版，主要使用ParticleSystem）
const Explosion = {
    create(x, y, color = '#ff8800', big = false) {
        ParticleSystem.explosion(x, y, color);
        if (big) {
            ScreenShake.shake(12, 400);
            // 额外粒子
            for (let i = 0; i < 15; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 3 + Math.random() * 6;
                ParticleSystem.spawn({
                    x, y,
                    vx: Math.cos(a) * s, vy: Math.sin(a) * s,
                    life: 600 + Math.random() * 400,
                    size: 4 + Math.random() * 6,
                    color: ['#ff4400','#ff8800','#ffcc00'][Math.floor(Math.random()*3)],
                    gravity: 0.08
                });
            }
        }
        AudioSystem.explode();
    }
};
