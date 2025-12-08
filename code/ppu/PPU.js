import PPUMemory from 'PPUMemory';
import Tile from 'Tile';
import VideoRegisters from 'VideoRegisters';
import interrupts from '/lib/interrupts';


const FB_WIDTH = 256;
const FB_HEIGHT = 240;

export default class PPU {
  constructor(cpu) {
    this.cpu = cpu;
    
    this.frameBuffer = new Uint32Array(FB_WIDTH * FB_HEIGHT);
    this.memory = new PPUMemory();

    this.registers = new VideoRegisters(this);

    this.cycle = 0;
    this.scanline = -1;
    this.frame = 0;
  }

  plot(x, y, color) {
    this.frameBuffer[y * FB_WIDTH + x] = color;
  }
  
  step(onFrame, onInterrupt) {
    if(this.scanline == -1)
      this._onPreLine();
    else if(this.scanline < FB_HEIGHT)
      this._onVisibleLine();
    else if(this.scanline == FB_HEIGHT + 1)
      this._onVBlankLine(onInterrupt);
    this.cycle++;
    if(this.cycle >= FB_WIDTH + 85) {
      this.cycle = 0;
      this.scanline++;
    }
    if(this.scanline >= FB_HEIGHT + 21) {
      this.scanline = -1;
      this.frame++;
      const testPalette = [0xff000000, 0xff555555, 0xffaaaaaa, 0xffffffff];
      const scale = 2;

      for (let tileId = 0; tileId < 240; tileId++) {
        const scaledSize = 8 * scale;
        const tilesPerRow = 256 / scaledSize;
        const startX = (tileId % tilesPerRow) * scaledSize;
        const startY = Math.floor(tileId / tilesPerRow) * scaledSize;

        for (let y = 0; y < 8; y++) {
          const tile = new Tile(this, 0, tileId, y);

          for (let x = 0; x < 8; x++) {
            const color = testPalette[tile.getColorIndex(x)];

            for (let scaledY = 0; scaledY < scale; scaledY++) {
              for (let scaledX = 0; scaledX < scale; scaledX++) {
                this.plot(
                  startX + x * scale + scaledX, 
                  startY + y * scale + scaledY, 
                  color
                );
              }
            }
          }
        }
      }
      onFrame(this.frameBuffer);
    }
  }

  _onPreLine() {
    if(this.cycle == 1)
      this.registers.ppuStatus.isInVBlankInterval = 0;
  }

  _onVisibleLine() {
    
  }

  _onVBlankLine(onInterrupt) {
    if(this.cycle == 1) {
      this.registers.ppuStatus.isInVBlankInterval = 1;
      if(this.registers.ppuCtrl.generateNMIOnVBlank)
        onInterrupt(interrupts.NMI);
    }
      
  }
}
