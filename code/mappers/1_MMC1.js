import Mapper from '/lib/Mapper';
import byte from '/lib/byte';


/** @import { MirroringId } from '../ppu/PPU' */

/**
 * Get the mirroring type from a value.
 *
 * @param {number} value The id to get the mirroring type from.
 *
 * @returns {MirroringId} The mirroring id.
*/
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

/** @import CPU from '/code/cpu/CPU' */
/** @import PPU from '/code/ppu/PPU' */
/** @import Cartridge from '/code/Cartridge' */


export default class MMC1 extends Mapper {

  /**
   * The current value of the load shift register.
   *
   * @type {number}
  */
  loadShiftRegister;

  /**
   * The current value of the load write counter.
   *
   * @type {number}
  */
  loadWriteCounter;

  /**
   * The current value of the control register.
   *
   * @type {number}
  */
  control;

  /**
   * The currently selected PRG bank.
   *
   * @type {number}
  */
  prgBank;

  /**
   * The currently selected low CHR bank.
   *
   * @type {number}
  */
  chrBank0;

  /**
   * The currently selected high CHR bank.
   *
   * @type {number}
  */
  chrBank1;

  /**
   * The PRG ram for the current cartridge.
   *
   * @type {Uint8Array}
  */
  prgRam;

  /**
   * @param {CPU} cpu
   * @param {PPU} ppu
   * @param {Cartridge} cartridge
  */
  constructor(cpu, ppu, cartridge) {
    super(cpu, ppu, cartridge);
    this.loadShiftRegister = 0;
    this.loadWriteCounter = 0;
    this.control = 0;
    this.prgBank = 0;
    this.chrBank0 = 0;
    this.chrBank1 = 0;
    this.prgRam = new Uint8Array(0x2000);
  }

  /**
   * Called when instantiating the mapper.
   *
   * @override
   *
   * @returns {void}
  */
  onLoad() {
    this._reset();
  }

  /**
   * Get the selected PRG page.
   *
   * @param {boolean} isHigh Whether currently selecting the high bank.
   *
   * @return {number} The selected PRG page index.
  */
  _prgPage(isHigh) {
    const bankMode = byte.getBits(this.control, 2, 2);

    if(bankMode <= 1)
      return (this.prgBank & ~0x1) + (isHigh ? 1 : 0);

    if(!isHigh) 
      return bankMode === 2 ? 0 : this.prgBank;
    else
      return bankMode === 3 ? this.prgPages.length - 1 : this.prgBank;
  }


  /**
   * Get the selected CHR page.
   *
   * @param {boolean} isHigh Whether currently selecting the high bank.
   *
   * @return {number} The selected PRG page index.
  */
  _chrPage(isHigh) {
    const bankMode = byte.getBit(this.control, 4);

    if(bankMode === 0) {
      const ret = (this.chrBank0 & ~0x1) + (isHigh ? 1 : 0);
      return ret;
    }
    return !isHigh ? this.chrBank0 : this.chrBank1;
  }

  /**
   * Push bit to load shift register.
   *
   * @param {number} bit The value to push.
   *
   * @returns {void}
  */
  _pushShift(bit) {
    if(this.loadWriteCounter >= 5)
      throw new Error("Shift register full");
    this.loadShiftRegister = byte.setBit(this.loadShiftRegister, this.loadWriteCounter++, bit);
  }

  /**
   * Reset the load shift register.
   *
   * @returns {void}
  */
  _resetShift() {
    this.loadShiftRegister = 0;
    this.loadWriteCounter = 0;
  }

  /**
   * Reset the mapper.
   *
   * @returns {void}
  */
  _reset() {
    this._resetShift();
    this.control = byte.setBits(this.control, 2, 2, 3);
  }

  /**
   * Write to an internal register.
   *
   * @param {number} address The register address to write to.
   * @param {number} value The value to write to the register.
   *
   * @returns {void}
   *
   * @throws {RangeError} The address must be a valid register.
  */
  _registerWrite(address, value) {
    if(address >= 0x8000 && address <= 0x9FFF) {
      this.ppu.memory.changeNameTableMirroringTo(getMirroringId(byte.getBits(value, 0, 2)));
      this.control = value;
      return;
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

  /**
   * Maps a CPU read operation (`address` is in CPU range $4020-$FFFF).
   *
   * @override
   *
   * @param {number} address The address to read from.
   *
   * @returns {number} The read value.
   *
   * @throws {RangeError} The address must be mapped.
  */
  cpuRead(address) {
    if(this.cartridge.header.hasPrgRam && address >= 0x6000 && address <= 0x7FFF) {
      return this.prgRam[address - 0x6000];
    } else if(address >= 0x8000 && address <= 0xBFFF) {
      return this.$getPrgPage(this._prgPage(false))[address - 0x8000];
    } else if(address >= 0xC000 && address <= 0xFFFF) {
      return this.$getPrgPage(this._prgPage(true))[address - 0xC000];
    }
    throw new RangeError(`Unmapped CPU memory: ${address.toString(16)}`);
  }

  /**
   * Maps a CPU write operation (`address` is in CPU range $4020-$FFFF).
   *
   * @override
   *
   * @param {number} address The address to write to.
   * @param {number} value The value to write.
   *
   * @returns {void}
   *
   * @throws {RangeError} The address must be mapped.
  */
  cpuWrite(address, value) {
    if(this.cartridge.header.hasPrgRam && address >= 0x6000 && address <= 0x7FFF) {
      this.prgRam[address - 0x6000] = value;
      return;
    } else if(address >= 0x8000 && address <= 0xFFFF) {
      this._pushShift(byte.getBit(value, 0));
      if(byte.getFlag(value, 7)) {
        this._reset();
        return;
      }
      if(this.loadWriteCounter !== 5)
        return;
      this._registerWrite(address, this.loadShiftRegister);
      this._resetShift();
      return;
    }
    throw new Error(`Unmapped CPU memory: ${address.toString(16)}`);
  }

  /**
   * Maps a PPU read operation (`address` is in PPU range $0000-$1FFF).
   *
   * @override
   *
   * @param {number} address The address to read from.
   *
   * @returns {number} The read value.
   *
   * @throws {RangeError} The address must be mapped.
  */
  ppuRead(address) {
    if(address >= 0x0000 && address <= 0x0FFF)
      return this.$getChrPage(this._chrPage(false))[address];
    else if(address >= 0x1000 && address <= 0x1FFF)
      return this.$getChrPage(this._chrPage(true))[address - 0x1000];

    throw new RangeError(`Unmapped PPU memory: ${address.toString(16)}`);
  }

  /**
   * Maps a PPU write operation (`address` is in PPU range $0000-$1FFF).
   *
   * @override
   *
   * @param {number} address The address to write to.
   * @param {number} value The value to write.
   *
   * @returns {void}
   *
   * @throws {RangeError} The address must be mapped.
  */
  ppuWrite(address, value) {
    if(this.cartridge.header.usesChrRam) {
      if(address >= 0x0000 && address <= 0x0FFF) {
        this.$getChrPage(this._chrPage(false))[address] = value;
        return;
      } else if(address >= 0x1000 && address <= 0x1FFF) {
        this.$getChrPage(this._chrPage(true))[address - 0x1000] = value;
        return;
      }
    }
    throw new RangeError(`Unmapped PPU memory: ${address.toString(16)}`);
  }

  /**
   * Returns the CHR ROM page size (in bytes).
   *
   * @override
   *
   * @returns {number} The CHR ROM page size in bytes.
  */
  chrRomPageSize() {
    return 4 * 1024;
  }


  /**
   * Save state data for the MMC1 mapper.
   * 
   * @typedef {object} MMC1State
   * 
   * @prop {number} [loadShiftRegister] The current value of the load shift register.
   * @prop {number} [loadWriteCounter] The current value of the load write counter.
   * @prop {number} [control] The current value of the control register.
   * @prop {number} [prgBank] The currently selected PRG bank.
   * @prop {number} [chrBank0] The currently selected low CHR bank.
   * @prop {number} [chrBank1] The currently selected high CHR bank.
  */

  /**
   * Returns a snapshot of the current state.
   *
   * @override
   *
   * @returns {any} A snapshot of the current state.
  */
  getSaveState() {
    /** @type {MMC1State} */
    const saveState = {
      loadShiftRegister: this.loadShiftRegister,
      loadWriteCounter: this.loadWriteCounter,
      control: this.control,
      prgBank: this.prgBank,
      chrBank0: this.chrBank0,
      chrBank1: this.chrBank1
    };
    return {
      ...super.getSaveState(),
      ...saveState
    };
  }


  /**
   * Restores state from a snapshot.
   *
   * @override
   *
   * @param {MMC1State} saveState
   *
   * @returns {void}
  */
  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.loadShiftRegister != null)
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
