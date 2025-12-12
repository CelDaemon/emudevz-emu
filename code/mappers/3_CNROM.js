import Mapper from "/lib/Mapper";

/** @import CPU from '/code/cpu/CPU' */
/** @import PPU from '/code/ppu/PPU' */
/** @import Cartridge from '/code/Cartridge' */

export default class CNROM extends Mapper {


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
   * Returns the PRG ROM page size (in bytes).
   *
   * @override
   *
   * @returns {number} The CHR ROM page size in bytes.
  */
  prgRomPageSize() {
    return 32 * 1024;
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
    if(address >= 0x8000 && address <= 0xFFFF)
      return this.$getPrgPage(0)[address - 0x8000];
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
    if(address >= 0x8000 && address <= 0xFFFF) {
      this.page = value & 0x3;
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
    if(address >= 0x0000 && address <= 0x1FFF)
      return this.$getChrPage(this.page)[address];
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
    if(this.cartridge.header.usesChrRam && address >= 0x0000 && address <= 0x1FFF) {
      this.$getChrPage(this.page)[address] = value;
      return;
    }
    throw new RangeError(`Unmapped PPU memory: ${address.toString(16)}`);
  }

  /**
   * Save state data for the CNROM mapper.
   *
   * @typedef {object} CNROMState
   *
   * @prop {number} [page] The currently selected page.
  */

  /**
   * Returns a snapshot of the current state.
   *
   * @override
   *
   * @returns {any} A snapshot of the current state.
  */
  getSaveState() {
    /** @type {CNROMState} */
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
   * @param {CNROMState} saveState
   *
   * @returns {void}
  */
  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.page != null)
      this.page = saveState.page;
  }
}
