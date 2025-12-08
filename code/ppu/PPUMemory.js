const ADDRESS_MASK = 0xE000;

const VRAM_ADDRESS = 0x2000;

const VRAM_SIZE = 4096;

const VRAM_ADDRESS_MASK = 0x0FFF;

export default class PPUMemory {
  constructor() {
    this.vram = new Uint8Array(VRAM_SIZE);
  }

  onLoad(cartridge, mapper) {
    this.cartridge = cartridge;
    this.mapper = mapper;
  }

  read(address) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuRead(address);
    
    
    if((address & ADDRESS_MASK) == VRAM_ADDRESS)
      return this.vram[address & VRAM_ADDRESS_MASK];

    // 🎨 Palette RAM
    /* TODO: IMPLEMENT */

    // 🚽 Mirrors of $3F00-$3F1F
    if (address >= 0x3f20 && address <= 0x3fff)
      return this.read(0x3f00 + ((address - 0x3f20) % 0x0020));

    return 0;
  }

  write(address, value) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuWrite(address, value);

    
    if((address & ADDRESS_MASK) == VRAM_ADDRESS)
      return this.vram[address & VRAM_ADDRESS_MASK] = value;

    // 🚽 Mirrors of $2000-$2EFF
    if (address >= 0x3000 && address <= 0x3eff)
      return this.write(0x2000 + ((address - 0x3000) % 0x1000), value);

    // 🎨 Palette RAM
    /* TODO: IMPLEMENT */

    // 🚽 Mirrors of $3F00-$3F1F
    if (address >= 0x3f20 && address <= 0x3fff)
      return this.write(0x3f00 + ((address - 0x3f20) % 0x0020), value);
  }
}
