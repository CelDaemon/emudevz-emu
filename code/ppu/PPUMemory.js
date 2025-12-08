import mirroringTypes from '/lib/ppu/mirroringTypes';

const ADDRESS_MASK = 0xE000;

const VRAM_ADDRESS = 0x2000;
const VRAM_ADDRESS_MASK = 0x0FFF;
const VRAM_TABLE_SIZE = 1024;
const VRAM_SIZE = VRAM_TABLE_SIZE * 4;

const PALETTE_RAM_MASK = 0xFF00;
const PALETTE_RAM_TRANSPARENT_MASK = 0x0003;
const PALETTE_RAM_ADDRESS = 0x3F00;
const PALETTE_RAM_ADDRESS_MASK = 0x001F;
const PALETTE_RAM_ADDRESS_TRANSPARENT_MASK = 0x000F;
const PALETTE_RAM_SIZE = 32;

const OAM_SIZE = 256;

export default class PPUMemory {
  constructor() {
    this.vram = new Uint8Array(VRAM_SIZE);
    this.paletteRam = new Uint8Array(PALETTE_RAM_SIZE);
    this.oamRam = new Uint8Array(OAM_SIZE);
  }

  onLoad(cartridge, mapper) {
    this.cartridge = cartridge;
    this.mapper = mapper;
    this.changeNameTableMirroringTo(this.cartridge.header.mirroringId);
  }

  read(address) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuRead(address);

    if((address & PALETTE_RAM_MASK) == PALETTE_RAM_ADDRESS) {
      if((address & PALETTE_RAM_TRANSPARENT_MASK) == 0) 
        return this.paletteRam[address & PALETTE_RAM_ADDRESS_TRANSPARENT_MASK];
      return this.paletteRam[address & PALETTE_RAM_ADDRESS_MASK];
    }

    if((address & ADDRESS_MASK) == VRAM_ADDRESS) {
      const relativeAddress = address & VRAM_ADDRESS_MASK;
      const tableAddress = Math.floor(relativeAddress / VRAM_TABLE_SIZE) * VRAM_TABLE_SIZE;
      const tablePhysicalAddress = this._mirroring[`$${(VRAM_ADDRESS + tableAddress).toString(16).toUpperCase()}`];
      console.assert(tablePhysicalAddress != null, "Unknown table base address");

      return this.vram[tablePhysicalAddress + (relativeAddress % VRAM_TABLE_SIZE)];
    }

    return 0;
  }

  write(address, value) {
    if((address & ADDRESS_MASK) == 0)
      return this.mapper.ppuWrite(address, value);

    if((address & PALETTE_RAM_MASK) == PALETTE_RAM_ADDRESS) {
      if((address & PALETTE_RAM_TRANSPARENT_MASK) == 0) 
        return this.paletteRam[address & PALETTE_RAM_ADDRESS_TRANSPARENT_MASK] = value;
      return this.paletteRam[address & PALETTE_RAM_ADDRESS_MASK] = value;
    }
    
    if((address & ADDRESS_MASK) == VRAM_ADDRESS) {
      const relativeAddress = address & VRAM_ADDRESS_MASK;
      const tableAddress = Math.floor(relativeAddress / VRAM_TABLE_SIZE) * VRAM_TABLE_SIZE;
      const tablePhysicalAddress = this._mirroring[`$${(VRAM_ADDRESS + tableAddress).toString(16).toUpperCase()}`];
      console.assert(tablePhysicalAddress != null, "Unknown table base address");
    
      return this.vram[tablePhysicalAddress + (relativeAddress % VRAM_TABLE_SIZE)] = value;
    }
  }

  changeNameTableMirroringTo(mirroringId) {
    if(this.cartridge.header.mirroringId == "FOUR_SCREEN")
      mirroringId = "FOUR_SCREEN";
    this.mirroringId = mirroringId;
    this._mirroring = mirroringTypes[mirroringId];
    console.log(this.mirroringId);
  }
}
