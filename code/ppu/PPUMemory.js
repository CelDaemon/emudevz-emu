const ADDRESS_MASK = 0xE000;

const VRAM_ADDRESS = 0x2000;
const VRAM_ADDRESS_MASK = 0x0FFF;
const VRAM_SIZE = 4096;

const PALETTE_RAM_MASK = 0xFF00;
const PALETTE_RAM_ADDRESS = 0x3F00;
const PALETTE_RAM_ADDRESS_MASK = 0x001F;
const PALETTE_RAM_SIZE = 32;

export default class PPUMemory {
  constructor() {
    this.vram = new Uint8Array(VRAM_SIZE);
    this.paletteRam = new Uint8Array(PALETTE_RAM_SIZE);
  }

  onLoad(cartridge, mapper) {
    this.cartridge = cartridge;
    this.mapper = mapper;
  }

  read(address) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuRead(address);

    

    if((address & PALETTE_RAM_MASK) == PALETTE_RAM_ADDRESS)
      return this.paletteRam[address & PALETTE_RAM_ADDRESS_MASK];
      
    
    if((address & ADDRESS_MASK) == VRAM_ADDRESS)
      return this.vram[address & VRAM_ADDRESS_MASK];

    return 0;
  }

  write(address, value) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuWrite(address, value);

    if((address & PALETTE_RAM_MASK) == PALETTE_RAM_ADDRESS)
      return this.paletteRam[address & PALETTE_RAM_ADDRESS_MASK] = value;
    
    if((address & ADDRESS_MASK) == VRAM_ADDRESS)
      return this.vram[address & VRAM_ADDRESS_MASK] = value;
  }
}
