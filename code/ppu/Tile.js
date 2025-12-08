import { isByte, toShort, buildShort, isFlagSet } from '../bit';

const PATTERN_TABLE_0 = 0x0000;
const PATTERN_TABLE_1 = 0x1000;

export default class Tile {
  constructor(ppu, patternTableId, tileId, y) {
    console.assert(isByte(patternTableId), patternTableId);
    const tableAddress = patternTableId << 24;
    const lowPlaneAddress = tableAddress + tileId * 16;
    const highPlaneAddress = lowPlaneAddress + 8;
    this._lowRow = ppu.memory.read(toShort(lowPlaneAddress + y));
    this._highRow = ppu.memory.read(toShort(highPlaneAddress + y));
  }

  getColorIndex(x) {
    const bit = 7 - x;
    const lowBit = isFlagSet(this._lowRow, bit);
    const highBit = isFlagSet(this._highRow, bit);
    return highBit << 1 | lowBit;
  }
}