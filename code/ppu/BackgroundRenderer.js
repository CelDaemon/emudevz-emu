import Tile from 'Tile';

const NAME_TABLE_SIZE = 1024;
const NAME_TABLE_BASE = 0x2000;

const ATTRIBUTE_TABLE_OFFSET = 960;

const FB_WIDTH = 256;
const FB_HEIGHT = 240;

const TILE_SIZE = 8;

const ATTRIBUTE_BLOCK_SIZE = 2;

const META_BLOCK_SIZE = 4;

export default class BackgroundRenderer {
  constructor(ppu) {
    this.ppu = ppu;
  }

  renderScanline() {
    const nameTableId = this.ppu.registers.ppuCtrl.nameTableId;
    const nameTableAddress = NAME_TABLE_BASE + nameTableId * NAME_TABLE_SIZE;
    const patternTableId = this.ppu.registers.ppuCtrl.backgroundPatternTableId;
    const y = this.ppu.scanline;
    const tileY = Math.floor(y / TILE_SIZE);
    console.assert(tileY < 30, tileY);
    for(let tileX = 0; tileX < FB_WIDTH / TILE_SIZE; tileX++) {
      console.assert(tileX < 32, tileX);
      const paletteId = this._getBackgroundPaletteId(nameTableAddress, tileX, tileY);
      
      const tileId = this.ppu.memory.read(nameTableAddress + tileX + tileY * FB_WIDTH / TILE_SIZE);
      const tile = new Tile(this.ppu, patternTableId, tileId, y % TILE_SIZE);
      for(let offsetX = 0; offsetX < TILE_SIZE; offsetX++) {
        const x = tileX * TILE_SIZE + offsetX;
        const colorIndex = tile.getColorIndex(offsetX);
        const color = colorIndex != 0 ? this.ppu.getColor(paletteId, colorIndex) : this.ppu.getColor(0, 0);
        this.ppu.plotBG(x, y, color, colorIndex);
      }
    }
  }

  _getBackgroundPaletteId(nameTableAddress, tileX, tileY) {
    const attributeTableAddress = nameTableAddress + ATTRIBUTE_TABLE_OFFSET;
    const metaBlockX = Math.floor(tileX / META_BLOCK_SIZE);
    const metaBlockY = Math.floor(tileY / META_BLOCK_SIZE);
    
    const attributes = this.ppu.memory.read(attributeTableAddress + metaBlockX + metaBlockY * (FB_WIDTH / TILE_SIZE / META_BLOCK_SIZE));

    const attributeX = Math.floor((tileX % META_BLOCK_SIZE) / ATTRIBUTE_BLOCK_SIZE);
    const attributeY = Math.floor((tileY % META_BLOCK_SIZE) / ATTRIBUTE_BLOCK_SIZE);
    
    const offset = ((attributeX == 1 ? 1 : 0) + (attributeY == 1 ? 2 : 0)) * 2;
    return (attributes >> offset) & 0b11;
  }
}