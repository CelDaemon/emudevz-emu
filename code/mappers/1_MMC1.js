import Mapper from '/lib/Mapper';
import byte from '/lib/byte';

function getMirroringId(value) {
  switch(value) {
    case 0:
      return "ONE_SCREEN_LOWER_BANK";
    case 1:
      return "ONE_SCREEN_UPPER_BANK";
    case 2:
      return "VERTICAL";
    case 3:
      return "HORIZONTAL";
    default:
      throw new RangeError(`Unknown mirroring id: ${value}`);
  }
}
// HIIHI
export default class MMC1 extends Mapper {
  onLoad() {
    this.control = 0;
    this.prgBank = 0;
    this.chrBank0 = 0;
    this.chrBank1 = 0;
    this.prgRam = new Uint8Array(0x2000);
    this._reset();
  }

  _prgPage(isHigh) {
    const bankMode = byte.getBits(this.control, 2, 2);

    if(bankMode <= 1)
      return (this.prgBank & ~0x1) + isHigh;
    
    if(!isHigh) 
      return bankMode == 2 ? 0 : this.prgBank;
    else
      return bankMode == 3 ? this.prgPages.length - 1 : this.prgBank;
  }
  
  _chrPage(isHigh) {
    const bankMode = byte.getBit(this.control, 4);

    if(bankMode == 0) {
      const ret = (this.chrBank0 & ~0x1) + isHigh;
      return ret;
    }
    return !isHigh ? this.chrBank0 : this.chrBank1;
  }

  _pushShift(bit) {
    console.assert(this.loadWriteCounter < 5, "Shift register full");
    this.loadShiftRegister = byte.setBit(this.loadShiftRegister, this.loadWriteCounter++, bit);
  }
  
  _resetShift() {
    this.loadShiftRegister = 0;
    this.loadWriteCounter = 0;
  }

  _reset() {
    this._resetShift();
    this.control = byte.setBits(this.control, 2, 2, 3);
  }

  _registerWrite(address, value) {
    if(address >= 0x8000 && address <= 0x9FFF) {
      this.ppu.memory.changeNameTableMirroringTo(getMirroringId(byte.getBits(value, 0, 2)));
      return this.control = value;
    } else if(address >= 0xA000 && address <= 0xBFFF) {
      this.chrBank0 = value;
      return;
    } else if(address >= 0xC000 && address <= 0xDFFF) {
      this.chrBank1 = value;
      return;
    } else if(address >= 0xE000 && address <= 0xFFFF) {
      this.prgBank = byte.getBits(value, 0, 4);
      return;
    }
    throw new RangeError(`Unmapped MMC1 register: ${address.toString(16)}`);
  }
  
  cpuRead(address) {
    if(this.cartridge.header.hasPrgRam && address >= 0x6000 && address <= 0x7FFF) {
      return this.prgRam[address - 0x6000];
    } else if(address >= 0x8000 && address <= 0xBFFF) {
      return this.$getPrgPage(this._prgPage(false))[address - 0x8000]; // TODO switching banks
    } else if(address >= 0xC000 && address <= 0xFFFF) {
      return this.$getPrgPage(this._prgPage(true))[address - 0xC000];
    }
    throw new RangeError(`Unmapped CPU memory: ${address}`);
  }

  cpuWrite(address, value) {
    if(this.cartridge.header.hasPrgRam && address >= 0x6000 && address <= 0x7FFF) {
      return this.prgRam[address - 0x6000] = value;
    } else if(address >= 0x8000 && address <= 0xFFFF) {
      this._pushShift(byte.getBit(value, 0));
      if(byte.getFlag(value, 7)) {
        this._reset();
        return;
      }
      if(this.loadWriteCounter != 5)
        return;
      this._registerWrite(address, this.loadShiftRegister);
      this._resetShift();
      return;
    }
    throw new Error(`Unmapped CPU memory: ${address}`);
  }

  ppuRead(address) {
    if(address >= 0x0000 && address <= 0x0FFF)
      return this.$getChrPage(this._chrPage(false))[address];
    else if(address >= 0x1000 && address <= 0x1FFF)
      return this.$getChrPage(this._chrPage(true))[address - 0x1000];
    
    throw new RangeError(`Unmapped PPU memory: ${address}`);
  }

  ppuWrite(address, value) {
    if(this.cartridge.header.usesChrRam) {
      if(address >= 0x0000 && address <= 0x0FFF)
        return this.$getChrPage(this._chrPage(false))[address] = value;
      else if(address >= 0x1000 && address <= 0x1FFF)
        return this.$getChrPage(this._chrPage(true))[address - 0x1000] = value;
    }
    throw new RangeError(`Unmapped PPU memory: ${address}`);
  }

  chrRomPageSize() {
    return 4 * 1024;
  }
  
  getSaveState() {
    return {
      ...super.getSaveState(),
      loadShiftRegister: this.loadShiftRegister,
      loadWriteCounter: this.loadWriteCounter,
      control: this.control,
      prgBank: this.prgBank,
      chrBank0: this.chrBank0,
      chrBank1: this.chrBank1
    };
  }

  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.page != null)
      this.page = saveState.page;
    if(saveState.shiftRegister != null)
      this.loadShiftRegister = saveState.loadShiftRegister;
    if(saveState.loadWriteCounter != null)
      this.loadWriteCounter = saveState.loadWriteCounter;
    if(saveState.control != null)
      this.control = saveState.control;
    if(saveState.prgBank != null)
      this.prgBank = saveState.prgBank;
    if(saveState.chrBank0 != null)
      this.chrBank0 = saveState.chrBank0;
    if(saveState.chrBank1 != null)
      this.chrBank1 = saveState.chrBank1;
  }
}