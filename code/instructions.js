import { isByteNegative, toByte, isBit, isByte, isShort, isFlagSet, getFlagMask } from './bit.js';

function shiftLeft(cpu, value, carry) {
  console.assert(isByte(value), value);
  console.assert(isBit(carry), carry);
  cpu.flags.c = isFlagSet(value, 7);
  const output = toByte(value << 1) | getFlagMask(0, carry);
  cpu.flags.updateZeroAndNegative(output);
  return output;
}

function shiftRight(cpu, value, carry) {
  console.assert(isByte(value), value);
  console.assert(isBit(carry), carry);
  cpu.flags.c = isFlagSet(value, 0);
  const output = toByte(value >> 1) | getFlagMask(7, carry);
  cpu.flags.updateZeroAndNegative(output);
  return output;
}

const instructions = {
  INX: {
    argument: 'no',
    run(cpu) {
      cpu.x.increment();
      cpu.flags.updateZeroAndNegative(cpu.x.getValue());
    }
  },
  INC: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      const newValue = toByte(cpu.memory.read(address) + 1);
      cpu.memory.write(address, newValue);
      cpu.flags.updateZeroAndNegative(newValue);
    }
  },
  ADC: {
    argument: 'value',
    run(cpu, addend) {
      console.assert(isByte(addend), addend);
      const oldValue = cpu.a.getValue();
      const result = oldValue + addend + cpu.flags.c;
      const newValue = toByte(result);
      cpu.a.setValue(newValue);
      cpu.flags.updateZeroAndNegative(newValue);
      cpu.flags.c = !isByte(result);
      const addendNegative = isByteNegative(addend);
      cpu.flags.v = addendNegative == isByteNegative(oldValue) && addendNegative != isByteNegative(newValue);
    }
  },
  ASL: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, shiftLeft(cpu, cpu.memory.read(address), 0));
    }
  },
  ASLa: {
    argument: 'no',
    run(cpu) {
      cpu.a.setValue(shiftLeft(cpu, cpu.a.getValue(), 0));
    }
  },
  DEC: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      const newValue = toByte(cpu.memory.read(address) - 1);
      cpu.memory.write(address, newValue);
      cpu.flags.updateZeroAndNegative(newValue);
    }
  },
  DEX: {
    argument: 'no',
    run(cpu) {
      cpu.x.decrement();
      cpu.flags.updateZeroAndNegative(cpu.x.getValue());
    }
  },
  DEY: {
    argument: 'no',
    run(cpu) {
      cpu.y.decrement();
      cpu.flags.updateZeroAndNegative(cpu.y.getValue());
    }
  },
  INY: {
    argument: 'no',
    run(cpu) {
      cpu.y.increment();
      cpu.flags.updateZeroAndNegative(cpu.y.getValue());
    }
  },
  LSR: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, shiftRight(cpu, cpu.memory.read(address), 0));
    }
  },
  LSRa: {
    argument: 'no',
    run(cpu) {
      cpu.a.setValue(shiftRight(cpu, cpu.a.getValue(), 0));
    }
  },
  ROL: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, shiftLeft(cpu, cpu.memory.read(address), cpu.flags.c));
    }
  },
  ROLa: {
    argument: 'no',
    run(cpu) {
      cpu.a.setValue(shiftLeft(cpu, cpu.a.getValue(), cpu.flags.c));
    }
  },
  ROR: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, shiftRight(cpu, cpu.memory.read(address), cpu.flags.c));
    }
  },
  RORa: {
    argument: 'no',
    run(cpu) {
      cpu.a.setValue(shiftRight(cpu, cpu.a.getValue(), cpu.flags.c));
    }
  },
  SBC: {
    argument: 'value',
    run(cpu, subtrahend) {
      console.assert(isByte(subtrahend), subtrahend);
      instructions.ADC.run(cpu, 255 - subtrahend);
    }
  }
};

for(const [id, instruction] of Object.entries(instructions)) {
  instruction.id = id;
}

export default instructions;
