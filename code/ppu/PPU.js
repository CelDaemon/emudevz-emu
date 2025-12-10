import PPUMemory from './PPUMemory';
import BackgroundRenderer from './BackgroundRenderer';
import SpriteRenderer from './SpriteRenderer';
import VideoRegisters from './VideoRegisters';
import LoopyRegister from '/lib/ppu/LoopyRegister';
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
    this.spriteRenderer = new SpriteRenderer(this);

    this.colorIndexes = new Uint8Array(FB_WIDTH * FB_HEIGHT);

    this.registers = new VideoRegisters(this);

    this.loopy = new LoopyRegister();

    this.cycle = 0;
    this.scanline = -1;
    this.frame = 0;
  }

  onLoad(mapper) {
    this.mapper = mapper;
  }

  plot(x, y, color) {
    this.frameBuffer[y * FB_WIDTH + x] = this.registers.ppuMask.transform(color);
  }

  plotBG(x, y, color, colorIndex) {
    this.colorIndexes[y * FB_WIDTH + x] = colorIndex;
    this.plot(x, y, color);
    if(this.registers.ppuMask.showBackground)
      this.loopy.onPlot(x);
  }

  isBackgroundPixelOpaque(x, y) {
    return this.colorIndexes[y * FB_WIDTH + x] !== 0;
  }
  
  step(onFrame, onInterrupt) {
    if(this.scanline === -1)
      this._onPreLine();
    else if(this.scanline < FB_HEIGHT)
      this._onVisibleLine();
    else if(this.scanline === FB_HEIGHT + 1)
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
    if(!this.registers.ppuMask.isRenderingEnabled())
      return;
    if(this.cycle === 1) {
      this.registers.ppuStatus.isInVBlankInterval = 0;
      this.registers.ppuStatus.spriteOverflow = 0;
      this.registers.ppuStatus.sprite0Hit = 0;
    }
    this.loopy.onPreLine(this.cycle);
    if(this.cycle === 260) this.mapper.tick();
  }

  _onVisibleLine() {
    if(this.cycle === 0) {
      this.backgroundRenderer.renderScanline();
      this.spriteRenderer.renderScanline();
    }
    if(!this.registers.ppuMask.isRenderingEnabled())
      return;

    this.loopy.onVisibleLine(this.cycle);
    if(this.cycle === 260) this.mapper.tick();
  }

  _onVBlankLine(onInterrupt) {
    if(this.cycle === 1) {
      this.registers.ppuStatus.isInVBlankInterval = 1;
      if(this.registers.ppuCtrl.generateNMIOnVBlank)
        onInterrupt(interrupts.NMI);
    }
      
  }
}
