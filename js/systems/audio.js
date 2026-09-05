// 音频系统
const AudioSystem = {
    enabled: true, ctx: null, bgmTimer: null, currentBgm: null,
    bgmVolume: 0.3, sfxVolume: 0.5,
    init() {
        const onGesture = () => {
            if (this.ctx) return;
            try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { this.enabled = false; }
            document.removeEventListener('click', onGesture);
            document.removeEventListener('keydown', onGesture);
        };
        document.addEventListener('click', onGesture);
        document.addEventListener('keydown', onGesture);
    },
    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(freq, dur, type = 'sine', vol = 1) {
        if (!this.enabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.ctx.destination);
        osc.type = type; osc.frequency.value = freq;
        g.gain.setValueAtTime(vol * this.sfxVolume, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.start(); osc.stop(this.ctx.currentTime + dur);
    },
    fire() { this.tone(200, 0.08, 'square', 0.12); },
    bounce() { this.tone(800, 0.04, 'sine', 0.08); },
    explode() {
        if (!this.enabled || !this.ctx) return;
        const dur = 0.3, sr = this.ctx.sampleRate, buf = this.ctx.createBuffer(1, sr*dur, sr);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
        const n = this.ctx.createBufferSource(); n.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(this.sfxVolume*0.5, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        n.connect(f); f.connect(g); g.connect(this.ctx.destination); n.start();
    },
    item() { this.tone(600, 0.08, 'sine', 0.12); setTimeout(()=>this.tone(900, 0.1, 'sine', 0.12), 60); },
    hit() { this.tone(150, 0.1, 'sawtooth', 0.15); },
    victory() { [523,659,784,1047].forEach((n,i)=>setTimeout(()=>this.tone(n,0.2,'sine',0.15), i*120)); },
    defeat() { [400,350,300,250].forEach((n,i)=>setTimeout(()=>this.tone(n,0.3,'sawtooth',0.15), i*150)); },
    playBGM(type) {
        if (!this.enabled || !this.ctx) return;
        this.stopBGM(); this.currentBgm = type;
        const loop = () => {
            if (this.currentBgm !== type) return;
            const t = this.ctx.currentTime;
            const note = (f, time, d, ty='sine', v=0.12) => {
                const o = this.ctx.createOscillator(), g = this.ctx.createGain();
                o.connect(g); g.connect(this.ctx.destination);
                o.type = ty; o.frequency.value = f;
                g.gain.setValueAtTime(v*this.bgmVolume, time);
                g.gain.exponentialRampToValueAtTime(0.001, time+d);
                o.start(time); o.stop(time+d);
            };
            if (type === 'menu') { [262,330,392,523,392,330].forEach((n,i)=>note(n, t+i*0.4, 0.35, 'sine', 0.15)); this.bgmTimer = setTimeout(loop, 2400); }
            else { [196,196,247,196].forEach((n,i)=>note(n, t+i*0.5, 0.45, 'triangle', 0.1)); [392,494,587,494,392,330,392,494].forEach((n,i)=>note(n, t+i*0.25, 0.2, 'square', 0.05)); this.bgmTimer = setTimeout(loop, 2000); }
        };
        loop();
    },
    stopBGM() { this.currentBgm = null; if (this.bgmTimer) { clearTimeout(this.bgmTimer); this.bgmTimer = null; } }
};
