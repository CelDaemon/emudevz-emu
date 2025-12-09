import InMemoryRegister from "/lib/InMemoryRegister";

import { buildShort, toByte, toShort } from '../bit';

class PPUCtrl extends InMemoryRegister.PPU {
  onLoad() {
    this.addField("vramAddressIncrement32", 2)
      .addField("sprite8x8PatternTableId", 3)
      .addField("backgroundPatternTableId", 4)
      .addField("spriteSize", 5)
      .addField("generateNMIOnVBlank", 7);
  }

  onWrite(value) {
    this.setValue(value);
    this.ppu.loopy.onPPUCtrlWrite(value);
  }
}

class PPUMask extends InMemoryRegister.PPU {
  onLoad() {
    this.addField("grayscale", 0, 1)
      .addField("showBackgroundInFirst8Pixels", 1, 1)
      .addField("showSpritesInFirst8Pixels", 2, 1)
      .addField("showBackground", 3, 1)
      .addField("showSprites", 4, 1)
      .addField("emphasizeRed", 5, 1)
      .addField("emphasizeGreen", 6, 1)
      .addField("emphasizeBlue", 7, 1);
  }

  onWrite(value) {
    this.setValue(value);
  }

  isRenderingEnabled() {
    return this.showBackground || this.showSprites;
  }

  _transformGrayscale(r, g, b) {
    if(!this.grayscale)
      return [r, g, b];
    const gray = Math.floor((r + g + b) / 3);
    return [gray, gray, gray];
  }

  _transformEmphasize(r, g, b) {
    if(!this.emphasizeRed && !this.emphasizeGreen && !this.emphasizeBlue)
      return [r, g, b];

    const all = this.emphasizeRed && this.emphasizeGreen && this.emphasizeBlue;

    const tr = (all || !this.emphasizeRed) ? Math.floor(r * 0.75) : r;
    const tg = (all || !this.emphasizeGreen) ? Math.floor(g * 0.75) : g;
    const tb = (all || !this.emphasizeBlue) ? Math.floor(b * 0.75) : b;

    return [tr, tg, tb];
  }

  transform(color) {
    let r = toByte(color);
    let g = toByte(color >> 8);
    let b = toByte(color >> 16);
    [r, g, b] = this._transformGrayscale(r, g, b);
    [r, g, b] = this._transformEmphasize(r, g, b);
    

    return 0xFF000000 | r | (g << 8) | (b << 16);
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
    this.ppu.loopy.onPPUStatusRead();
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
    const oamAddress = this.ppu.registers.oamAddr.value;
    return this.ppu.memory.oamRam[oamAddress];
  }

  onWrite(value) {
    const oamAddress = this.ppu.registers.oamAddr.value;
    this.ppu.memory.oamRam[oamAddress] = value;
    this.ppu.registers.oamAddr.setValue(oamAddress + 1);
  }
}

class PPUScroll extends InMemoryRegister.PPU {
  onWrite(value) {
    this.ppu.loopy.onPPUScrollWrite(value);
  }
}

class PPUAddr extends InMemoryRegister.PPU {
  onWrite(value) {
    this.ppu.loopy.onPPUAddrWrite(value);
  }

  get address() {
    return this.ppu.loopy.vAddress.getValue();
  }

  set address(value) {
    this.ppu.loopy.vAddress.setValue(value);
  }
}

const PALETTE_RAM_MASK = 0xFF00;
const PALETTE_RAM_ADDRESS = 0x3F00;

class PPUData extends InMemoryRegister.PPU {
  onLoad() {
    this.buffer = 0;
  }

  onRead() {
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
  onWrite(page) {
    for(let i = 0; i < 256; i++) {
      const address = buildShort(page, i);
      const value = this.ppu.cpu.memory.read(address);
      this.ppu.memory.oamRam[i] = value;
    }
    this.ppu.cpu.extraCycles += 513;
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
