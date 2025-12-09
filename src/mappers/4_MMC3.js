import Mapper from '/lib/Mapper';
import byte from '/lib/byte';
import interrupts from '/lib/interrupts';

/**
 * @import CPU from '/code/cpu/CPU'
 * @import PPU from '/code/ppu/PPU'
 * @import Cartridge from '/code/Cartridge'
 */

export default class MMC3 extends Mapper {

  /**
   * The bank registers for this mapper.
   *
   * @type {Uint8Array}
   */
  bankData;

  /**
   * The bank bank select register.
   *
   * @type {number}
   */
  bankSelect;

  /**
   * The IRQ countdown register.
   *
   * @type {number}
   */
  irqCountdown;

  /**
   * Whether the IRQ is enabled.
   *
   * @type {boolean}
   */
  irqEnabled;

  /**
   * The IRQ latch register.
   *
   * @type {number}
   */
  irqLatch;

  /**
   * The PRG ram for the current cartridge.
   *
   * @type {Uint8Array}
  */
  prgRam;

  /**
   * The active CHR banks.
   *
   * @type {Uint8Array[]}
   */
  _chrBanks;

  /**
   * @param {CPU} cpu
   * @param {PPU} ppu
   * @param {Cartridge} cartridge
   */
  constructor(cpu, ppu, cartridge) {
    super(cpu, ppu, cartridge);
    this.bankData = new Uint8Array(8);
    this.bankSelect = 0;
    this.irqCountdown = 0;
    this.irqEnabled = false;
    this.irqLatch = 0;
    this.prgRam = new Uint8Array(0x2000);
    this._chrBanks = [];
    this._reloadChrBanks();
  }

  /**
   * Reload CHR banks based on bank selection.
   */
  _reloadChrBanks() {
    const chrInverted = byte.getFlag(this.bankSelect, 7);
    const chrBank0 = this.bankData[0] & ~0x1;
    const chrBank1 = this.bankData[1] & ~0x1;
    if(!chrInverted) {
      this._chrBanks[0] = this.$getChrPage(chrBank0);
      this._chrBanks[1] = this.$getChrPage(chrBank0 + 1);
      this._chrBanks[2] = this.$getChrPage(chrBank1);
      this._chrBanks[3] = this.$getChrPage(chrBank1 + 1);
      this._chrBanks[4] = this.$getChrPage(this.bankData[2]);
      this._chrBanks[5] = this.$getChrPage(this.bankData[3]);
      this._chrBanks[6] = this.$getChrPage(this.bankData[4]);
      this._chrBanks[7] = this.$getChrPage(this.bankData[5]);
    } else {
      this._chrBanks[0] = this.$getChrPage(this.bankData[2]);
      this._chrBanks[1] = this.$getChrPage(this.bankData[3]);
      this._chrBanks[2] = this.$getChrPage(this.bankData[4]);
      this._chrBanks[3] = this.$getChrPage(this.bankData[5]);
      this._chrBanks[4] = this.$getChrPage(chrBank0);
      this._chrBanks[5] = this.$getChrPage(chrBank0 + 1);
      this._chrBanks[6] = this.$getChrPage(chrBank1);
      this._chrBanks[7] = this.$getChrPage(chrBank1 + 1);
    }
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
    const prgMode = byte.getFlag(this.bankSelect, 6);
    const fixed = this.prgPages.length - 2;
    const switchable = this.bankData[6];
    const swap0 = prgMode ? fixed : switchable;
    const swap1 = prgMode ? switchable : fixed;
    if(/* this.cartridge.header.hasPrgRam && */ address >= 0x6000 && address <= 0x7FFF) // Used even though cartridge PRG RAM is off?
      return this.prgRam[address - 0x6000];
    else if(address >= 0x8000 && address <= 0x9FFF)
      return this.$getPrgPage(swap0)[address - 0x8000];
    else if(address >= 0xA000 && address <= 0xBFFF)
      return this.$getPrgPage(this.bankData[7])[address - 0xA000];
    else if(address >= 0xC000 && address <= 0xDFFF)
      return this.$getPrgPage(swap1)[address - 0xC000];
    else if(address >= 0xE000 && address <= 0xFFFF)
      return this.$getPrgPage(this.prgPages.length - 1)[address - 0xE000];
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
    const isEven = address % 2 === 0;
    if(/* this.cartridge.header.hasPrgRam && */ address >= 0x6000 && address <= 0x7FFF) { // Used even though cartridge PRG RAM is off?
      this.prgRam[address - 0x6000] = value;
      return;
    } else if(address >= 0x8000 && address <= 0x9FFF) {
      if(isEven) {
        this.bankSelect = value;
      } else {
        this.bankData[byte.getBits(this.bankSelect, 0, 3)] = value;
        this._reloadChrBanks();
      }
      return;
    } else if(address >= 0xA000 && address <= 0xBFFF) {
      if(isEven)
        this.ppu.memory.changeNameTableMirroringTo(byte.getFlag(value, 0) ? "HORIZONTAL" : "VERTICAL");
      return;
    } else if(address >= 0xC000 && address <= 0xDFFF) {
      if(isEven)
        this.irqLatch = value;
      else
        this.irqCountdown = 0;
      return;
    } else if(address >= 0xE000 && address <= 0xEFFF) {
      this.irqEnabled = !isEven;
      return;
    }
    throw new Error(`Unmapped address: ${address.toString(16)}`);
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
      return this._chrBanks[Math.floor(address / 0x0400)][address % 0x0400];
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
      if(address >= 0x0000 && address <= 0x1FFF) {
        this._chrBanks[Math.floor(address / 0x0400)][address % 0x0400] = value;
        return;
      }
    }
    throw new RangeError(`Unmapped PPU memory: ${address.toString(16)}`);
  }

  /**
   * Runs at cycle 260 of every scanline (including preline).
   *
   * @override
   *
   * @returns {void}
   */
  tick() {
    if(this.irqCountdown === 0) {
      this.irqCountdown = this.irqLatch;
      return;
    }
    if(--this.irqCountdown === 0 && this.irqEnabled) {
      this.cpu.interrupt(interrupts.IRQ);
    }
  }

  /**
   * Returns the CHR ROM page size (in bytes).
   *
   * @override
   *
   * @returns {number} The CHR ROM page size in bytes.
  */
  chrRomPageSize() {
    return 1 * 1024;
  }


  /**
   * Returns the PRG ROM page size (in bytes).
   *
   * @override
   *
   * @returns {number} The PRG ROM page size in bytes.
  */
  prgRomPageSize() {
    return 8 * 1024;
  }

  /**
   * Save state data for the MMC3 mapper.
   *
   * @typedef {object} MMC3State
   *
   * @prop {number[]} [bankData] The current value of the bank registers.
   * @prop {number} [bankSelect] The current value of the bank select register.
   * @prop {number} [irqCountdown] The currrent value of the IRQ countdown.
   * @prop {boolean} [irqEnabled] Whether the IRQ is currently enabled.
   * @prop {number} [irqLatch] The current value of the IRQ latch.
  */

  /**
   * Returns a snapshot of the current state.
   *
   * @override
   *
   * @returns {any} A snapshot of the current state.
  */
  getSaveState() {
    /** @type {MMC3State} */
    const saveState = {
      bankData: Array.from(this.bankData),
      bankSelect: this.bankSelect,
      irqCountdown: this.irqCountdown,
      irqEnabled: this.irqEnabled,
      irqLatch: this.irqLatch
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
   * @param {MMC3State} saveState
   *
   * @returns {void}
  */
  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.bankData != null)
      this.bankData = Uint8Array.from(saveState.bankData);
    if(saveState.bankSelect != null)
      this.bankSelect = saveState.bankSelect;
    if(saveState.irqCountdown != null)
      this.irqCountdown = saveState.irqCountdown;
    if(saveState.irqEnabled != null)
      this.irqEnabled = saveState.irqEnabled;
    if(saveState.irqLatch != null)
      this.irqLatch = saveState.irqLatch;
    this._reloadChrBanks();
  }
}
