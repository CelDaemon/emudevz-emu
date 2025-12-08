const FB_WIDTH = 256;
const FB_HEIGHT = 240;

export default class PPU {
  constructor(cpu) {
    this.cpu = cpu;

    this.frameBuffer = new Uint32Array(FB_WIDTH * FB_HEIGHT);

    this.cycle = 0;
    this.scanline = -1;
    this.frame = 0;
  }

  plot(x, y, color) {
    this.frameBuffer[y * FB_WIDTH + x] = color;
  }
  
  step(onFrame) {
    this.cycle++;
    if(this.cycle >= FB_WIDTH + 85) {
      this.cycle = 0;
      this.scanline++;
    }
    if(this.scanline >= FB_HEIGHT + 21) {
      this.scanline = -1;
      this.frame++;
      for(let x = 0; x < FB_WIDTH; x++) {
        for(let y = 0; y < FB_HEIGHT; y++) {
          this.plot(x, y, 0xFF000000 | this.frame % 256);
        }
      }
      // for(let x = 0; x < FB_WIDTH; x++) {
      //   for(let y = 0; y < FB_HEIGHT; y++) {
      //     this.plot(x, y, 0x00000000);
      //   }
      // }
      // const mx = FB_WIDTH / 2;
      // const my = FB_HEIGHT / 2;
      // for(let x = 20; x < FB_WIDTH - 20; x++) {
      //   for(let y = 20; y < FB_HEIGHT - 20; y++) {
      //     const dx = x - mx;
      //     const dy = y - my;
      //     const r = Math.max(255 - Math.sqrt(dx * dx + dy * dy) * 3, 0);
      //     this.plot(x, y, 0x000000FF | ((r & 0xFF) << 24));
      //   }
      // }
      onFrame(this.frameBuffer);
    }
  }
}
