import Mapper from '/lib/Mapper';


/** @import CPU from '/code/cpu/CPU' */
/** @import PPU from '/code/ppu/PPU' */
/** @import Cartridge from '/code/Cartridge' */

export default class UxROM extends Mapper {

  /**
   * The currently selected PRG page.
   *
   * @type {number}
  */
  page;

  /**
   * @param {CPU} cpu
   * @param {PPU} ppu
   * @param {Cartridge} cartridge
  */
  constructor(cpu, ppu, cartridge) {
    super(cpu, ppu, cartridge);
    this.page = 0;
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
    if(address >= 0x4020 && address <= 0x7FFF)
      return 0;
    if(address >= 0x8000 && address <= 0xBFFF)
      return this.$getPrgPage(this.page)[address - 0x8000];
    if(address >= 0xC000 && address <= 0xFFFF)
      return this.$getPrgPage(this.prgPages.length - 1)[address - 0xC000];
    throw new Error(`Unmapped address: ${address.toString(16)}`);
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
    if(address >= 0x8000 && address <= 0xFFFF) {
      this.page = value;
      return;
    }
    throw new RangeError(`Unmapped CPU memory: ${address.toString(16)}`);
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
    if(address >= 0 && address <= 0x1FFFF)
      return this.$getChrPage(0)[address];
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
    if(this.cartridge.header.usesChrRam && address >= 0 && address <= 0x1FFFF) {
      this.$getChrPage(0)[address] = value;
      return;
    }
    throw new RangeError(`Unmapped PPU memory: ${address.toString(16)}`);
  }

  /**
   * Save state data for the UxROM mapper.
   *
   * @typedef {object} UxROMState
   *
   * @prop {number} [page] The current page.
  */

  /**
   * Returns a snapshot of the current state.
   *
   * @override
   *
   * @returns {any} A snapshot of the current state.
  */
  getSaveState() {
    /** @type {UxROMState} */
    const saveState = {
      page: this.page
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
   * @param {UxROMState} saveState
   *
   * @returns {void}
  */
  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.page != null)
      this.page = saveState.page;
  }
}
