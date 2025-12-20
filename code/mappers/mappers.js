import NROM from './0_NROM';
import MMC1 from './1_MMC1';
import UxROM from './2_UxROM';
import CNROM from './3_CNROM';
import MMC3 from "./4_MMC3";


/** @import CPU from "../cpu/CPU" */
/** @import PPU from "../ppu/PPU" */
/** @import Cartridge from "../Cartridge" */

/** @import Mapper from "/lib/Mapper" */


/** @type {Partial<Record<number, typeof Mapper>>} */
const mappers = {
  0: NROM,
  1: MMC1,
  2: UxROM,
  3: CNROM,
  4: MMC3,
};

/**
 * Create a mapper based on the current mapper id.
 *
 * @param {CPU} cpu
 * @param {PPU} ppu
 * @param {Cartridge} cartridge
 *
 * @return {Mapper} The created mapper.
 *
 * @throws {RangeError} Mapper must be known.
*/
export function createMapper(cpu, ppu, cartridge) {
  const mapperId = cartridge.header.mapperId;
  const mapper = mappers[mapperId];
  if (!mapper) throw new RangeError(`Unknown mapper: ${mapperId}`);
  return new mapper(cpu, ppu, cartridge);
}

