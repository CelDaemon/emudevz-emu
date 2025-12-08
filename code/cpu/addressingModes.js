import { isByte, isShort, toSignedByte, toByte, toShort, getShortHighByte, buildShort } from "../bit";

const unsupported = () => { throw new Error("Unsupported.") };
function read(cpu, argument, hasPageCrossPenalty) {
  return cpu.memory.read(this.getAddress(cpu, argument, hasPageCrossPenalty));
}

const addressingModes = {
  IMPLICIT: {
    inputSize: 0,
    getAddress: () => null,
    getValue: unsupported
  },

  IMMEDIATE: {
    inputSize: 1,
    getAddress: unsupported,
    getValue: (cpu, value) => value
  },

  ABSOLUTE: {
    inputSize: 2,
    getAddress: (cpu, address) => address,
    getValue: read
  },

  ZERO_PAGE: {
    inputSize: 1,
    getAddress: (cpu, zeroPageAddress) => zeroPageAddress,
    getValue: read
  },

  RELATIVE: {
    inputSize: 1,
    getAddress: (cpu, offset, hasPageCrossPenalty) => {
      const pc = cpu.pc.getValue();
      const output = toShort(pc + toSignedByte(toByte(offset)));
      if(hasPageCrossPenalty && getShortHighByte(pc) != getShortHighByte(output))
        cpu.extraCycles += 2;
      return output;
    },
    getValue: unsupported
  },

  INDIRECT: {
    inputSize: 2,
    getAddress: (cpu, absoluteAddress) => {
      console.assert(isShort(absoluteAddress), absoluteAddress);
      return cpu.memory.read16(absoluteAddress);
    },
    getValue: unsupported
  },

  INDEXED_ZERO_PAGE_X: {
    inputSize: 1,
    getAddress: (cpu, zeroPageAddress) => {
      console.assert(isByte(zeroPageAddress), zeroPageAddress);
      return toByte(zeroPageAddress + cpu.x.getValue());
    },
    getValue: read
  },

  INDEXED_ZERO_PAGE_Y: {
    inputSize: 1,
    getAddress: (cpu, zeroPageAddress) => {
      console.assert(isByte(zeroPageAddress), zeroPageAddress);
      return toByte(zeroPageAddress + cpu.y.getValue());
    },
    getValue: read
  },

  INDEXED_ABSOLUTE_X: {
    inputSize: 2,
    getAddress: (cpu, absoluteAddress, hasPageCrossPenalty) => {
      console.assert(isShort(absoluteAddress), absoluteAddress);
      const output = toShort(absoluteAddress + cpu.x.getValue());
      if(hasPageCrossPenalty && getShortHighByte(absoluteAddress) != getShortHighByte(output))
        cpu.extraCycles += 1;
      return output;
    },
    getValue: read
  },

  INDEXED_ABSOLUTE_Y: {
    inputSize: 2,
    getAddress: (cpu, absoluteAddress, hasPageCrossPenalty) => {
      console.assert(isShort(absoluteAddress), absoluteAddress);
      const output = toShort(absoluteAddress + cpu.y.getValue());
      if(hasPageCrossPenalty && getShortHighByte(absoluteAddress) != getShortHighByte(output))
        cpu.extraCycles += 1;
      return output;
    },
    getValue: read
  },

  INDEXED_INDIRECT: {
    inputSize: 1,
    getAddress: (cpu, zeroPageAddress) => {
      console.assert(isByte(zeroPageAddress), zeroPageAddress);
      const address = toByte(zeroPageAddress + cpu.x.getValue());
      return buildShort(cpu.memory.read(toByte(address + 1)), cpu.memory.read(address));
    },
    getValue: read
  },

  INDIRECT_INDEXED: {
    inputSize: 1,
    getAddress: (cpu, zeroPageAddress, hasPageCrossPenalty) => {
      console.assert(isByte(zeroPageAddress), zeroPageAddress);
      const base = buildShort(cpu.memory.read(toByte(zeroPageAddress + 1)), cpu.memory.read(zeroPageAddress));
      const output = toShort(base + cpu.y.getValue());
      if(hasPageCrossPenalty && getShortHighByte(base) != getShortHighByte(output))
        cpu.extraCycles += 1;
      return output;
    },
    getValue: read
  },
};

for (let key in addressingModes) {
  addressingModes[key].id = key;
}

export default addressingModes;
