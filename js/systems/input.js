// 输入系统：3玩家键盘+鼠标
const InputSystem = {
    keys: {},
    mouse: { x: 312, y: 312, down: false, clicked: false },
    canvas: null,

    init(canvas) {
        this.canvas = canvas;
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            // 阻止方向键和空格滚动
            if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const sx = canvas.width / rect.width;
            const sy = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * sx;
            this.mouse.y = (e.clientY - rect.top) * sy;
        });
        canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { this.mouse.down = true; this.mouse.clicked = true; } });
        canvas.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    },

    // P1: WASD + H
    getP1() {
        return { up: this.keys['w'], down: this.keys['s'], left: this.keys['a'], right: this.keys['d'], fire: this.keys['h'] };
    },
    // P2: 方向键 + 数字5
    getP2() {
        return { up: this.keys['arrowup'], down: this.keys['arrowdown'], left: this.keys['arrowleft'], right: this.keys['arrowright'], fire: this.keys['5'] };
    },
    // P3: 鼠标
    getP3() {
        return { mouseX: this.mouse.x, mouseY: this.mouse.y, fire: this.mouse.down, clicked: this.mouse.clicked };
    },

    endFrame() { this.mouse.clicked = false; }
};
