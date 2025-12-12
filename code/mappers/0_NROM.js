import Mapper from "/lib/Mapper";

export default class NROM extends Mapper {

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
    if (address >= 0x8000 && address <= 0xbfff) {
      return this.$getPrgPage(0)[address - 0x8000];
    } else if (address >= 0xc000 && address <= 0xffff) {
      return this.$getPrgPage(1)[address - 0xc000];
    }
    throw new RangeError(`Unmapped CPU memory: ${address.toString(16)}`);
  }

  /**
   * Maps a CPU write operation (`address` is in CPU range $4020-$FFFF).
   *
   * @override
   *
   * @returns {void}
  */
  cpuWrite() {
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

}
