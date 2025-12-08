import Tile from 'Tile';

const NAME_TABLE_SIZE = 1024;
const NAME_TABLE_BASE = 0x2000;

const FB_WIDTH = 256;
const FB_HEIGHT = 240;

const TILE_SIZE = 8;

const PALETTE = [0xFF000000, 0xFF555555, 0xFFAAAAAA, 0xFFFFFFFF];

export default class BackgroundRenderer {
  constructor(ppu) {
    this.ppu = ppu;
  }

  renderScanline() {
    const nameTableAddress = NAME_TABLE_BASE + this.ppu.registers.ppuCtrl.nameTableId * NAME_TABLE_SIZE;
    const patternTableId = this.ppu.registers.ppuCtrl.backgroundPatternTableId;
    const y = this.ppu.scanline;
    const tileY = Math.floor(y / TILE_SIZE);
    console.assert(tileY < 30, tileY);
    for(let tileX = 0; tileX < FB_WIDTH / TILE_SIZE; tileX++) {
      console.assert(tileX < 32, tileX);
      const tileId = this.ppu.memory.read(nameTableAddress + tileX + tileY * FB_WIDTH / TILE_SIZE);
      const tile = new Tile(this.ppu, patternTableId, tileId, y % TILE_SIZE);
      for(let offsetX = 0; offsetX < TILE_SIZE; offsetX++) {
        const x = tileX * TILE_SIZE + offsetX;
        this.ppu.plot(x, y, PALETTE[tile.getColorIndex(offsetX)]);
      }
    }
  }
}