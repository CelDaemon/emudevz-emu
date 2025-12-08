const MAGIC = "NES";

const PRG_ROM_SIZE_OFFSET = 4;
const CHR_ROM_SIZE_OFFSET = 5;
const FLAGS_OFFSET = 6;
const MAPPER_LOWER_OFFSET = FLAGS_OFFSET;
const MAPPER_UPPER_OFFSET = 7;

const HEADER_SIZE = 16;

const FLAG_FOUR_SCREEN = 0b1000;
const FLAG_PADDING = 0b100;
const FLAG_PRG_RAM = 0b10;
const FLAG_MIRRORING_VERTICAL = 0b1;


const MIRRORING_VERTICAL = "VERTICAL";
const MIRRORING_HORIZONTAL = "HORIZONTAL";
const MIRRORING_FOUR_SCREEN = "FOUR_SCREEN";

const PRG_PAGE_SIZE = 16384;
const CHR_PAGE_SIZE = 8192;

function getMirroringId(flags) {
  if((flags & FLAG_FOUR_SCREEN) != 0)
    return MIRRORING_FOUR_SCREEN;
  if((flags & FLAG_MIRRORING_VERTICAL) != 0)
    return MIRRORING_VERTICAL;
  return MIRRORING_HORIZONTAL;
}

function getPrgOffset(header) {
  return HEADER_SIZE + (header.has512BytePadding ? 512 : 0);
}

function getPrgSize(header) {
  return header.prgRomPages * PRG_PAGE_SIZE;
}

function getChrOffset(header) {
  return getPrgOffset(header) + getPrgSize(header);
}

export default class Cartridge {
  constructor(bytes) {
    if(bytes[0] !== MAGIC.charCodeAt(0) ||
       bytes[1] !== MAGIC.charCodeAt(1) ||
       bytes[2] !== MAGIC.charCodeAt(2) ||
       bytes[3] !== 0x1A)
      throw new Error("Invalid ROM");
    
    this.bytes = bytes;
    
    const prgRomPages = bytes[PRG_ROM_SIZE_OFFSET];
    const chrRomPages = bytes[CHR_ROM_SIZE_OFFSET];
    const usesChrRam = chrRomPages === 0;
    
    const flags = bytes[FLAGS_OFFSET];
    
    const has512BytePadding = (flags & FLAG_PADDING) != 0;
    const hasPrgRam = (flags & FLAG_PRG_RAM) != 0;
    const mirroringId = getMirroringId(flags);
    
    const mapperId = bytes[MAPPER_UPPER_OFFSET] & 0b11110000 |
      bytes[MAPPER_LOWER_OFFSET] >> 4;
    
    this.header = {
      prgRomPages,
      chrRomPages,
      usesChrRam,
      has512BytePadding,
      hasPrgRam,
      mirroringId,
      mapperId
    };
  }

  prg() {
    const offset = getPrgOffset(this.header);
    return this.bytes.slice(offset, offset + getPrgSize(this.header));
  }

  chr() {
    if(this.header.usesChrRam)
      return new Uint8Array(CHR_PAGE_SIZE);
    const offset = getChrOffset(this.header);
    return this.bytes.slice(offset, offset + this.header.chrRomPages * CHR_PAGE_SIZE);
  }
}