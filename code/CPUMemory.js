const WRAM_MASK = 0xE000;
const WRAM_MEMORY_MASK = 0x7FF;

const WRAM_SIZE = WRAM_MEMORY_MASK + 1;

const CONTROLLER_ADDRESS = 0x4016;

const APU_ADDRESS = 0x4017;

export default class CPUMemory {
  constructor() {
    this.ram = new Uint8Array(WRAM_SIZE);
  }

  read(address) {
    if(address < 0)
      throw new Error("Invalid Address");
    if((address & WRAM_MASK) == 0)
      return this.ram[address & WRAM_MEMORY_MASK];

    if((address & ~0x1) == CONTROLLER_ADDRESS)
      return this.controllers[address & 0x1].onRead();
    
    return this.mapper.cpuRead(address);
  }

  read16(address) {
    return this.read(address + 1) << 8 | this.read(address);
  }
  
  write(address, value) {
    if(address < 0)
      throw new Error("Invalid Address");
    
    if((address & WRAM_MASK) == 0)
      return this.ram[address & WRAM_MEMORY_MASK] = value;
    
    if(address == CONTROLLER_ADDRESS)
      return this.controllers[0].onWrite(value);

    if(address == APU_ADDRESS)
      return;
    
    return this.mapper.cpuWrite(address, value);
  }

  onLoad(ppu, apu, mapper, controllers) {
    this.ppu = ppu;
    this.apu = apu;
    this.mapper = mapper;
    this.controllers = controllers;
  }
}