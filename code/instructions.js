import { isByteNegative, toByte, isBit, isByte, isShort, isFlagSet, getFlagMask } from './bit.js';
import { FLAG_BREAK } from './CPU.js';

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
  },
  CLC: {
    argument: 'no',
    run(cpu) {
      cpu.flags.c = false;
    }
  },
  CLD: {
    argument: 'no',
    run(cpu) {
      cpu.flags.d = false;
    }
  },
  CLI: {
    argument: 'no',
    run(cpu) {
      cpu.flags.i = false;
    }
  },
  CLV: {
    argument: 'no',
    run(cpu) {
      cpu.flags.v = false;
    }
  },
  LDA: {
    argument: 'value',
    run(cpu, value) {
      console.assert(isByte(value), value);
      cpu.a.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  LDX: {
    argument: 'value',
    run(cpu, value) {
      console.assert(isByte(value), value);
      cpu.x.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  LDY: {
    argument: 'value',
    run(cpu, value) {
      console.assert(isByte(value), value);
      cpu.y.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  PHA: {
    argument: 'no',
    run(cpu) {
      cpu.stack.push(cpu.a.getValue());
    }
  },
  PHP: {
    argument: 'no',
    run(cpu) {
      cpu.stack.push(cpu.flags.getValue() | getFlagMask(FLAG_BREAK, true));
    }
  },
  PLA: {
    argument: 'no',
    run(cpu) {
      const value = cpu.stack.pop();
      cpu.a.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  PLP: {
    argument: 'no',
    run(cpu) {
      cpu.flags.setValue(cpu.stack.pop());
    }
  },
  SEC: {
    argument: 'no',
    run(cpu) {
      cpu.flags.c = true;
    }
  },
  SED: {
    argument: 'no',
    run(cpu) {
      cpu.flags.d = true;
    }
  },
  SEI: {
    argument: 'no',
    run(cpu) {
      cpu.flags.i = true;
    }
  },
  STA: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, cpu.a.getValue());
    }
  },
  STX: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, cpu.x.getValue());
    }
  },
  STY: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.memory.write(address, cpu.y.getValue());
    }
  },
  TAX: {
    argument: 'no',
    run(cpu) {
      const value = cpu.a.getValue();
      cpu.x.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  TAY: {
    argument: 'no',
    run(cpu) {
      const value = cpu.a.getValue();
      cpu.y.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  TSX: {
    argument: 'no',
    run(cpu) {
      const value = cpu.sp.getValue();
      cpu.x.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  TXA: {
    argument: 'no',
    run(cpu) {
      const value = cpu.x.getValue();
      cpu.a.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  TXS: {
    argument: 'no',
    run(cpu) {
      const value = cpu.x.getValue();
      cpu.sp.setValue(value);
    }
  },
  TYA: {
    argument: 'no',
    run(cpu) {
      const value = cpu.y.getValue();
      cpu.a.setValue(value);
      cpu.flags.updateZeroAndNegative(value);
    }
  },
  BIT: {
    argument: 'value',
    run(cpu, mask) {
      console.assert(isByte(mask), mask);
      const value = cpu.a.getValue();
      const newValue = toByte(value & mask);
      cpu.a.setValue(newValue);
      cpu.flags.n = isFlagSet(mask, 7);
      cpu.flags.v = isFlagSet(mask, 6);
      cpu.flags.z = newValue == 0;
    }
  },
  CMP: {
    argument: 'value',
    run(cpu, operand) {
      console.assert(isByte(operand), operand);
      const output = cpu.a.getValue() - operand;
      cpu.flags.c = output >= 0;
      cpu.flags.updateZeroAndNegative(toByte(output));
    }
  },
  CPX: {
    argument: 'value',
    run(cpu, operand) {
      console.assert(isByte(operand), operand);
      const output = cpu.x.getValue() - operand;
      cpu.flags.c = output >= 0;
      cpu.flags.updateZeroAndNegative(toByte(output));
    }
  },
  CPY: {
    argument: 'value',
    run(cpu, operand) {
      console.assert(isByte(operand), operand);
      const output = cpu.y.getValue() - operand;
      cpu.flags.c = output >= 0;
      cpu.flags.updateZeroAndNegative(toByte(output));
    }
  },
  AND: {
    argument: 'value',
    run(cpu, mask) {
      console.assert(isByte(mask), mask);
      const output = cpu.a.getValue() & mask;
      cpu.a.setValue(output);
      cpu.flags.updateZeroAndNegative(output);
    }
  },
  EOR: {
    argument: 'value',
    run(cpu, mask) {
      console.assert(isByte(mask), mask);
      const output = cpu.a.getValue() ^ mask;
      cpu.a.setValue(output);
      cpu.flags.updateZeroAndNegative(output);
    }
  },
  ORA: {
    argument: 'value',
    run(cpu, mask) {
      console.assert(isByte(mask), mask);
      const output = cpu.a.getValue() | mask;
      cpu.a.setValue(output);
      cpu.flags.updateZeroAndNegative(output);
    }
  },
  BCC: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(cpu.flags.c) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BNE: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(cpu.flags.z) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BPL: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(cpu.flags.n) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BVC: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(cpu.flags.v) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BCS: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(!cpu.flags.c) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BEQ: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(!cpu.flags.z) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BMI: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(!cpu.flags.n) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  BVS: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      if(!cpu.flags.v) {
        cpu.extraCycles = 0;
        return;
      }
      cpu.extraCycles++;
      cpu.pc.setValue(address);
    }
  },
  JMP: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.pc.setValue(address);
    }
  },
  JSR: {
    argument: 'address',
    run(cpu, address) {
      console.assert(isShort(address), address);
      cpu.stack.push16(cpu.pc.getValue() - 1);
      cpu.pc.setValue(address);
    }
  },
  RTI: {
    argument: 'no',
    run(cpu) {
      instructions.PLP.run(cpu);
      cpu.pc.setValue(cpu.stack.pop16());
    }
  },
  RTS: {
    argument: 'no',
    run(cpu) {
      cpu.pc.setValue(cpu.stack.pop16() + 1);
    }
  }
};

for(const [id, instruction] of Object.entries(instructions)) {
  instruction.id = id;
}

export default instructions;
