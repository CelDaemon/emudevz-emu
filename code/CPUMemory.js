

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
    
    return 0;
  }
  write(address, value) {
    if(address < 0)
      throw new Error("Invalid Address");
    if((address & WRAM_MASK) == 0)
      this.ram[address & WRAM_MEMORY_MASK] = value;
  }
}