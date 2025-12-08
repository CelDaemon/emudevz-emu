import InMemoryRegister from "/lib/InMemoryRegister";

import { buildShort, getShortHighByte, toByte, toShort, isByte } from '../bit';

class PPUCtrl extends InMemoryRegister.PPU {
  onLoad() {
    this.addField("nameTableId", 0, 2)
      .addField("vramAddressIncrement32", 2)
      .addField("sprite8x8PatternTableId", 3)
      .addField("backgroundPatternTableId", 4)
      .addField("spriteSize", 5)
      .addField("generateNMIOnVBlank", 7);
  }

  onWrite(value) {
    this.setValue(value);
  }
}

class PPUMask extends InMemoryRegister.PPU {
  onLoad() {
    // TODO
  }

  onWrite(value) {
    this.setValue(value);
  }
}

class PPUStatus extends InMemoryRegister.PPU {
  onLoad() {
    this.addWritableField("spriteOverflow", 5)
      .addWritableField("sprite0Hit", 6)
      .addWritableField("isInVBlankInterval", 7);

    this.setValue(0b10000000);
  }

  onRead() {
    const value = this.value;
    this.isInVBlankInterval = false;
    this.ppu.registers.ppuAddr.latch = false;
    return value;
  }
}

class OAMAddr extends InMemoryRegister.PPU {
  onWrite(value) {
    this.setValue(value);
  }
}

class OAMData extends InMemoryRegister.PPU {
  onRead() {
    /* TODO: IMPLEMENT */
  }

  onWrite(value) {
    /* TODO: IMPLEMENT */
  }
}

class PPUScroll extends InMemoryRegister.PPU {
  onLoad() {
    /* TODO: IMPLEMENT */
  }

  onWrite(value) {
    /* TODO: IMPLEMENT */
  }
}

class PPUAddr extends InMemoryRegister.PPU {
  onLoad() {
    this.latch = false;
    this.address = 0;
  }

  onWrite(value) {
    if(this.latch)
      this.address = buildShort(getShortHighByte(this.address), value);
    else
      this.address = buildShort(value, toByte(this.address));
    this.latch = !this.latch;
  }
}

const PALETTE_RAM_MASK = 0xFF00;
const PALETTE_RAM_ADDRESS = 0x3F00;

class PPUData extends InMemoryRegister.PPU {
  onLoad() {
    /* TODO: IMPLEMENT */
    this.buffer = 0;
  }

  onRead() {
    /* TODO: IMPLEMENT */
    let data = this.buffer;
    const address = this.ppu.registers.ppuAddr.address;
    this.buffer = this.ppu.memory.read(address);
    if((address & PALETTE_RAM_MASK) == PALETTE_RAM_ADDRESS)
      data = this.buffer;
    this._incrementAddress();
    return data;
  }

  

  onWrite(value) {
    this.ppu.memory.write(this.ppu.registers.ppuAddr.address, value);
    this._incrementAddress();
  }

  _incrementAddress() {
    const increment = 
      this.ppu.registers.ppuCtrl.vramAddressIncrement32 ? 32 : 1;
    this.ppu.registers.ppuAddr.address = toShort(this.ppu.registers.ppuAddr.address + increment);
  }
}

class OAMDMA extends InMemoryRegister.PPU {
  onWrite(value) {
    /* TODO: IMPLEMENT */
  }
}

export default class VideoRegisters {
  constructor(ppu) {
    this.ppuCtrl = new PPUCtrl(ppu); //     $2000
    this.ppuMask = new PPUMask(ppu); //     $2001
    this.ppuStatus = new PPUStatus(ppu); // $2002
    this.oamAddr = new OAMAddr(ppu); //     $2003
    this.oamData = new OAMData(ppu); //     $2004
    this.ppuScroll = new PPUScroll(ppu); // $2005
    this.ppuAddr = new PPUAddr(ppu); //     $2006
    this.ppuData = new PPUData(ppu); //     $2007
    this.oamDma = new OAMDMA(ppu); //       $4014
  }

  read(address) {
    return this._getRegister(address)?.onRead();
  }

  write(address, value) {
    this._getRegister(address)?.onWrite(value);
  }

  _getRegister(address) {
    switch (address) {
      case 0x2000:
        return this.ppuCtrl;
      case 0x2001:
        return this.ppuMask;
      case 0x2002:
        return this.ppuStatus;
      case 0x2003:
        return this.oamAddr;
      case 0x2004:
        return this.oamData;
      case 0x2005:
        return this.ppuScroll;
      case 0x2006:
        return this.ppuAddr;
      case 0x2007:
        return this.ppuData;
      case 0x4014:
        return this.oamDma;
      default:
    }
  }
}
