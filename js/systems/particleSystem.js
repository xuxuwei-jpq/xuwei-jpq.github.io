// 粒子系统 + 屏幕震动
const ParticleSystem = {
    particles: [], max: 300,
    init() { this.particles = []; },
    spawn(o) {
        // 优先复用已死亡的粒子槽位，避免数组无限增长和 shift() 的 O(n) 开销
        for (let i = 0; i < this.particles.length; i++) {
            if (!this.particles[i].active) {
                const p = this.particles[i];
                p.x = o.x; p.y = o.y;
                p.vx = o.vx || 0; p.vy = o.vy || 0;
                p.life = o.life || 600; p.maxLife = p.life;
                p.size = o.size || 3;
                p.color = o.color || '#fff';
                p.gravity = o.gravity !== undefined ? o.gravity : 0.1;
                p.type = o.type || 'circle';
                p.radius = 0;
                p.maxRadius = o.maxRadius || 80;
                p.active = true;
                return;
            }
        }
        // 没有空位则追加（不超过上限）
        if (this.particles.length < this.max) {
            this.particles.push({
                x: o.x, y: o.y, vx: o.vx || 0, vy: o.vy || 0,
                life: o.life || 600, maxLife: o.life || 600,
                size: o.size || 3, color: o.color || '#fff',
                gravity: o.gravity !== undefined ? o.gravity : 0.1,
                type: o.type || 'circle', radius: 0,
                maxRadius: o.maxRadius || 80, active: true
            });
        }
        // 缓冲区满且无死亡粒子，丢弃新粒子（保持上限）
    },
    explosion(x, y, color = '#ff8800') {
        const colors = ['#ff4400','#ff8800','#ffcc00','#ffffff', color];
        for (let i = 0; i < 25; i++) {
            const a = Math.random()*Math.PI*2, s = 2+Math.random()*5;
            this.spawn({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:500+Math.random()*300, size:3+Math.random()*5, color:colors[Math.floor(Math.random()*colors.length)], gravity:0.05 });
        }
        this.spawn({ x, y, type:'shockwave', life:300, color:'#fff', maxRadius:60 });
    },
    spark(x, y, color) {
        for (let i = 0; i < 8; i++) { const a = Math.random()*Math.PI*2, s = 1+Math.random()*3; this.spawn({ x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:300, size:2, color, gravity:0.1 }); }
    },
    update(dt) {
        const d = dt/16.67;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            if (!p.active) continue;
            if (p.type === 'shockwave') { p.radius = p.maxRadius * (1 - p.life/p.maxLife); p.life -= dt; }
            else { p.x += p.vx*d; p.y += p.vy*d; p.vy += p.gravity*d; p.vx *= 0.98; p.life -= dt; }
            if (p.life <= 0) p.active = false;
        }
    },
    render(ctx) {
        // 避免 save/restore 的重复开销，直接管理 globalAlpha
        let prevAlpha = ctx.globalAlpha;
        for (const p of this.particles) {
            if (!p.active) continue;
            const a = Math.max(0, p.life/p.maxLife);
            ctx.globalAlpha = a;
            if (p.type === 'shockwave') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size*a, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = prevAlpha;
    },
    clear() { this.particles = []; }
};

const ScreenShake = {
    intensity: 0, duration: 0, time: 0,
    shake(intensity, duration) { this.intensity = Math.max(this.intensity, intensity); this.duration = Math.max(this.duration, duration); this.time = 0; },
    update(dt) { if (this.time < this.duration) { this.time += dt; if (this.time >= this.duration) this.intensity = 0; } },
    getOffset() { if (this.intensity <= 0) return {x:0,y:0}; return { x:(Math.random()-0.5)*this.intensity*2, y:(Math.random()-0.5)*this.intensity*2 }; }
};
