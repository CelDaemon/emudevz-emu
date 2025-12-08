import Sprite from '/lib/ppu/Sprite';

const SPRITE_SIZE = 4;

const SPRITE_Y = 0;
const SPRITE_TILE_ID = 1;
const SPRITE_ATTRIBUTES = 2;
const SPRITE_X = 3;

export default class SpriteRenderer {
  constructor(ppu) {
    this.ppu = ppu;
  }

  _evaluate() {
    const sprites = [];
    for(let i = 0; i < 64; i++) {
      const sprite = this._createSprite(i);
      if(!sprite.shouldRenderInScanline(this.ppu.scanline))
        continue;
      if(sprites.length >= 8) {
        this.ppu.registers.ppuStatus.spriteOverflow = 1;
        break;
      }
      sprites.push(sprite);
    }

    return sprites.reverse();
    
  }

  _createSprite(id) {
    const ppuCtrl = this.ppu.registers.ppuCtrl;
    const oamRam = this.ppu.memory.oamRam;
    
    const address = id * SPRITE_SIZE;
    const y = oamRam[address + SPRITE_Y] + 1;
    
    const attributes = oamRam[address + SPRITE_ATTRIBUTES];
    const x = oamRam[address + SPRITE_X];

    const isLarge = ppuCtrl.spriteSize == 1;

    const tileId = oamRam[address + SPRITE_TILE_ID] & 
      (isLarge ? 0xFE : 0xFF);

    const patternTableId = 
      isLarge ? oamRam[address + SPRITE_TILE_ID] & 0x1 : ppuCtrl.sprite8x8PatternTableId;
    
    return new Sprite(id, x, y, this.ppu.registers.ppuCtrl.spriteSize == 1, patternTableId, tileId, attributes);
  }
}