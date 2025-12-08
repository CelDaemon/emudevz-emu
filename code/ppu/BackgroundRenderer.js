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
    const transparentColor = this.ppu.getColor(0, 0);
    
    const y = this.ppu.scanline;

    if(!this.ppu.registers.ppuMask.showBackground) {
      for(let x = 0; x < FB_WIDTH; x++)
        this.ppu.plotBG(x, y, transparentColor, 0);
      return;
    }
    const scrollX = this.ppu.registers.ppuScroll.x;
    const scrollY = this.ppu.registers.ppuScroll.y;

    const baseNameTableId = this.ppu.registers.ppuCtrl.nameTableId;
    const patternTableId = this.ppu.registers.ppuCtrl.backgroundPatternTableId;

    const scrolledY = y + scrollY;
    const nameTableY = scrolledY % FB_HEIGHT;

    const tileY = Math.floor(nameTableY / TILE_SIZE);
    const tileOffsetY = nameTableY % TILE_SIZE;

    let x = 0;
    if(!this.ppu.registers.ppuMask.showBackgroundInFirst8Pixels) {
      for(; x < 8; x++) {
        this.ppu.plotBG(x, y, transparentColor, 0);
      }
    }
    for(; x < FB_WIDTH;) {
      const scrolledX = x + scrollX;
      const nameTableX = scrolledX % FB_WIDTH;
      const tileX = Math.floor(nameTableX / TILE_SIZE);
      const tileStartOffsetX = nameTableX % TILE_SIZE;

      const nameTableId = (baseNameTableId + 
                           (scrolledX >= FB_WIDTH ? 1 : 0) + 
                           (scrolledY >= FB_HEIGHT ? 2 : 0)) % 4;

      const nameTableAddress = NAME_TABLE_BASE + nameTableId * NAME_TABLE_SIZE;

      const paletteId = this._getBackgroundPaletteId(nameTableAddress, tileX, tileY);

      const tileId = this.ppu.memory.read(nameTableAddress + tileX + tileY * FB_WIDTH / TILE_SIZE);

      const tile = new Tile(this.ppu, patternTableId, tileId, tileOffsetY);

      const tilePixels = Math.min(
        TILE_SIZE - tileStartOffsetX,
        FB_WIDTH - nameTableX
      );
      console.assert(tilePixels > 0 && tilePixels <= 8);

      for(let tileOffsetX = 0; tileOffsetX < tilePixels; tileOffsetX++) {
        const colorIndex = tile.getColorIndex(tileStartOffsetX + tileOffsetX);

        const color = colorIndex != 0 ? this.ppu.getColor(paletteId, colorIndex) : transparentColor;

        this.ppu.plotBG(x + tileOffsetX, y, color, colorIndex);
      }
      x += tilePixels;
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
