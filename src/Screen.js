const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 240;


export default class Screen extends HTMLCanvasElement {
    constructor() {
        super();
        this.context = this.getContext('2d');
        this.imageData = this.context.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        console.assert(this.imageData.data.length === SCREEN_WIDTH * SCREEN_HEIGHT * 4, this.imageData.data.length, SCREEN_WIDTH * SCREEN_HEIGHT * 4);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.buf32 = new Uint32Array(this.buf);
    }

    setBuffer(buffer) {
        this.buf32.set(buffer);
        this.imageData.data.set(this.buf8);
        this.context.putImageData(this.imageData, 0, 0);
    }

    clear() {
        this.context.clearRect(0, 0, this.width, this.height);
    }
}

customElements.define("emu-screen", Screen, { extends: "canvas" });
