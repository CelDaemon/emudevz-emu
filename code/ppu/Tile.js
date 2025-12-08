import { isByte, isBit, toShort, isFlagSet } from '../bit';

export default class Tile {
  constructor(ppu, patternTableId, tileId, y) {
    console.assert(isBit(patternTableId), patternTableId);
    console.assert(isByte(tileId), tileId);
    const tableAddress = patternTableId << 12;
    const lowPlaneAddress = tableAddress + tileId * 16;
    const highPlaneAddress = lowPlaneAddress + 8;
    this._lowRow = ppu.memory.read(toShort(lowPlaneAddress + y));
    this._highRow = ppu.memory.read(toShort(highPlaneAddress + y));
  }

  getColorIndex(x) {
    console.assert(x < 8 && x >= 0, x);
    const bit = 7 - x;
    const lowBit = isFlagSet(this._lowRow, bit);
    const highBit = isFlagSet(this._highRow, bit);
    return highBit << 1 | lowBit;
  }
}