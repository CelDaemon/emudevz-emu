export default class PPU {
  constructor(cpu) {
    this.cpu = cpu;

    this.cycle = 0;
    this.scanline = -1;
    this.frame = 0;
  }

  step() {
    this.cycle++;
    if(this.cycle >= 341) {
      this.cycle = 0;
      this.scanline++;
    }
    if(this.scanline >= 261) {
      this.scanline = -1;
      this.frame++;
    }
  }
}
