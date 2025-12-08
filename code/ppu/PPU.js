import PPUMemory from 'PPUMemory';
import BackgroundRenderer from 'BackgroundRenderer';
import Tile from 'Tile';
import VideoRegisters from 'VideoRegisters';
import interrupts from '/lib/interrupts';
import masterPalette from '/lib/ppu/masterPalette';


const FB_WIDTH = 256;
const FB_HEIGHT = 240;
const PALETTE_RAM_ADDRESS = 0x3F00;

export default class PPU {
  constructor(cpu) {
    this.cpu = cpu;
    
    this.frameBuffer = new Uint32Array(FB_WIDTH * FB_HEIGHT);
    this.memory = new PPUMemory();
    this.backgroundRenderer = new BackgroundRenderer(this);

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
      if(this.scanline >= FB_HEIGHT + 21) {
        this.scanline = -1;
        this.frame++;
        onFrame(this.frameBuffer);
      }
    }
  }

  getColor(paletteId, colorIndex) {
    console.assert(paletteId >= 0 && paletteId <= 8, paletteId);
    console.assert(colorIndex >= 0 && colorIndex <= 4, colorIndex);
    const startAddress = PALETTE_RAM_ADDRESS + paletteId * 4;
    const masterColorIndex = this.memory.read(startAddress + colorIndex);
    return masterPalette[masterColorIndex];
  }

  _onPreLine() {
    if(this.cycle == 1)
      this.registers.ppuStatus.isInVBlankInterval = 0;
  }

  _onVisibleLine() {
    if(this.cycle == 0) {
      this.backgroundRenderer.renderScanline();
    }
  }

  _onVBlankLine(onInterrupt) {
    if(this.cycle == 1) {
      this.registers.ppuStatus.isInVBlankInterval = 1;
      if(this.registers.ppuCtrl.generateNMIOnVBlank)
        onInterrupt(interrupts.NMI);
    }
      
  }
}
