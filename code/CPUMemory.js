

const WRAM_MASK = 0xE000;
const WRAM_MEMORY_MASK = 0x7FF;

const WRAM_SIZE = 2048;

export default class CPUMemory {
  constructor() {
    this.ram = new Uint8Array(WRAM_SIZE);
  }

  read(address) {
    if(address < 0)
      throw new Error("Invalid Address");
    if((address & WRAM_MASK) == 0)
      return this.ram[address & WRAM_MEMORY_MASK];
    
    return this.mapper.cpuRead(address);
  }
  write(address, value) {
    if(address < 0)
      throw new Error("Invalid Address");
    
    if((address & WRAM_MASK) == 0)
      return this.ram[address & WRAM_MEMORY_MASK] = value;
    
    return this.mapper.cpuWrite(address, value);
  }

  onLoad(ppu, apu, mapper, controllers) {
    this.ppu = ppu;
    this.apu = apu;
    this.mapper = mapper;
    this.controllers = controllers;
  }
}