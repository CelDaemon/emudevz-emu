const MAGIC = "NES";

const PRG_ROM_SIZE_OFFSET = 4;
const CHR_ROM_SIZE_OFFSET = 5;
const FLAGS_OFFSET = 6;
const MAPPER_LOWER_OFFSET = FLAGS_OFFSET;
const MAPPER_UPPER_OFFSET = 7;

const HEADER_SIZE = 16;

const FLAG_FOUR_SCREEN = 0b1000;
const FLAG_PADDING = 0b100;
const FLAG_PRG_RAM = 0b10;
const FLAG_MIRRORING_VERTICAL = 0b1;


const PRG_PAGE_SIZE = 16384;
const CHR_PAGE_SIZE = 8192;

/**
 * @import { MirroringId } from './ppu/PPU'
 * @import { MapperId } from './mappers/mappers'
 */

/**
 * Get the mirroring id based on flags.
 *
 * @param {number} flags The flags to get the mirroring type from.
 *
 * @returns {MirroringId} The mirroring id.
 */
function getMirroringId(flags) {
  if((flags & FLAG_FOUR_SCREEN) !== 0)
    return 'FOUR_SCREEN';
  if((flags & FLAG_MIRRORING_VERTICAL) !== 0)
    return 'VERTICAL';
  return 'HORIZONTAL';
}


/**
 * Get the PRG ROM start offset.
 *
 * @param {boolean} hasPadding Whether the cartridge has a 512 byte padding.
 */
function getPrgOffset(hasPadding) {
  return HEADER_SIZE + (hasPadding ? 512 : 0);
}


/**
 * Get the size of the PRG ROM.
 *
 * @param {number} pages The amount of PRG pages.
 *
 * @returns {number} The size of the PRG ROM.
 */
function getPrgSize(pages) {
  return pages * PRG_PAGE_SIZE;
}

/**
 * A header of a cartridge containing metadata.
 *
 * @typedef {object} CartridgeHeader
 *
 * @prop {number} prgRomPages The amount of PRG ROM pages.
 * @prop {number} chrRomPages The amount of CHR ROM pages.
 * @prop {boolean} usesChrRam Whether the cartridge CHR memory is writable.
 * @prop {boolean} has512BytePadding Whether the cartrige has a 512 byte padding.
 * @prop {boolean} hasPrgRam Whether the cartridge PRG memory is writable.
 * @prop {MirroringId} mirroringId The type of PPU mirroring the cartridge uses.
 * @prop {number} mapperId The id of the mapper the cartridge uses.
 */

export default class Cartridge {

  /**
   * The header of this cartridge.
   *
   * @type {CartridgeHeader}
   */
  header;

  /**
   * The raw cartridge data.
   *
   * @type {Uint8Array}
   */
  bytes;

  /**
   * @param {Uint8Array} bytes The raw cartridge data.
   */
  constructor(bytes) {
    if(bytes[0] !== MAGIC.charCodeAt(0) ||
       bytes[1] !== MAGIC.charCodeAt(1) ||
       bytes[2] !== MAGIC.charCodeAt(2) ||
       bytes[3] !== 0x1A)
      throw new Error("Invalid ROM");
    
    this.bytes = bytes;
    
    const prgRomPages = bytes[PRG_ROM_SIZE_OFFSET];
    const chrRomPages = bytes[CHR_ROM_SIZE_OFFSET];
    const usesChrRam = chrRomPages === 0;
    
    const flags = bytes[FLAGS_OFFSET];
    
    const has512BytePadding = (flags & FLAG_PADDING) !== 0;
    const hasPrgRam = (flags & FLAG_PRG_RAM) !== 0;
    const mirroringId = getMirroringId(flags);
    
    const mapperId = bytes[MAPPER_UPPER_OFFSET] & 0b11110000 |
      bytes[MAPPER_LOWER_OFFSET] >> 4;
    
    this.header = {
      prgRomPages,
      chrRomPages,
      usesChrRam,
      has512BytePadding,
      hasPrgRam,
      mirroringId,
      mapperId
    };
  }

  /**
   * Get the PRG data for this cartridge.
   *
   * @returns {Uint8Array} The PRG memory as a byte array.
   */
  prg() {
    const offset = getPrgOffset(this.header.has512BytePadding);
    return this.bytes.slice(offset, offset + getPrgSize(this.header.prgRomPages));
  }

  /**
   * Get the CHR data for tihs cartridge.
   *
   * @returns {Uint8Array} The CHR memory as a byte array.
   */
  chr() {
    if(this.header.usesChrRam)
      return new Uint8Array(CHR_PAGE_SIZE);
    const offset = getPrgOffset(this.header.has512BytePadding) + getPrgSize(this.header.prgRomPages);
    return this.bytes.slice(offset, offset + this.header.chrRomPages * CHR_PAGE_SIZE);
  }
}
