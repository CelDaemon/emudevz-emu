import { isByteNegative, isByte, isShort, getFlagMask, isFlagSet, buildShort } from '../bit';

class ArrayRegister {
  constructor(wrapper) {
    this.wrapper = wrapper;
  }
  
  getValue() {
    return this.wrapper[0];
  }
  
  setValue(value) {
    this.wrapper[0] = value;
  }
  
  increment(value = 1) {
    this.wrapper[0] += value;
  }
  
  decrement(value = 1) {
    this.wrapper[0] -= value;
  }
}


class Register8Bit extends ArrayRegister {
  constructor() {
    super(new Uint8Array(1));
  }
  
}

class Register16Bit extends ArrayRegister {
  constructor() {
    super(new Uint16Array(1));
  }
}

export const FLAG_CARRY = 0;
export const FLAG_ZERO = 1;
export const FLAG_INTERRUPT = 2;
export const FLAG_DECIMAL = 3;
export const FLAG_BREAK = 4;
export const FLAG_UNUSED = 5;
export const FLAG_OVERFLOW = 6;
export const FLAG_NEGATIVE = 7;

class FlagsRegister {
  constructor() {
    this.c = false;
    this.z = false;
    this.i = false;
    this.d = false;
    this.v = false;
    this.n = false;
  }

  getValue() {
    let value = 0;
    return getFlagMask(FLAG_CARRY, this.c) |
      getFlagMask(FLAG_ZERO, this.z) |
      getFlagMask(FLAG_INTERRUPT, this.i) |
      getFlagMask(FLAG_DECIMAL, this.d) |
      getFlagMask(FLAG_BREAK, 0) |
      getFlagMask(FLAG_UNUSED, 1) |
      getFlagMask(FLAG_OVERFLOW, this.v) |
      getFlagMask(FLAG_NEGATIVE, this.n);
  }

  setValue(value) {
    console.assert(isByte(value), value);
    this.c = isFlagSet(value, FLAG_CARRY);
    this.z = isFlagSet(value, FLAG_ZERO);
    this.i = isFlagSet(value, FLAG_INTERRUPT);
    this.d = isFlagSet(value, FLAG_DECIMAL);
    this.v = isFlagSet(value, FLAG_OVERFLOW);
    this.n = isFlagSet(value, FLAG_NEGATIVE);
  }

  updateZero(value) {
    console.assert(isByte(value), value);
    this.z = value == 0;
  }

  updateNegative(value) {
    console.assert(isByte(value), value);
    this.n = isByteNegative(value);
  }

  updateZeroAndNegative(value) {
    console.assert(isByte(value), value);
    this.updateZero(value);
    this.updateNegative(value);
  }
}

const STACK_ADDRESS = 0x0100;

class Stack {
  constructor(memory, sp) {
    this.memory = memory;
    this.sp = sp;
  }

  getCurrentAddress() {
    return STACK_ADDRESS + this.sp.getValue();
  }
  
  push(value) {
    console.assert(isByte(value), value);
    this.memory.write(this.getCurrentAddress(), value);
    this.sp.decrement();
  }

  push16(value) {
    console.assert(isShort(value), value);
    this.push(value >> 8);
    this.push(value & 0xFF);
  }
  
  pop() {
    this.sp.increment();
    return this.memory.read(this.getCurrentAddress());
  }

  pop16() {
    const low = this.pop();
    const high = this.pop();
    return buildShort(high, low);
  }
}

export default class CPU {
  constructor(memory) {
    this.memory = memory;
    this.cycle = 0;
    this.extraCycles = 0;

    this.a = new Register8Bit();
    this.x = new Register8Bit();
    this.y = new Register8Bit();

    this.sp = new Register8Bit();
    
    this.pc = new Register16Bit();

    this.flags = new FlagsRegister();

    this.stack = new Stack(this.memory, this.sp);
  }

  interrupt(interrupt, withBFlag = false) {
    if(this.flags.i && interrupt.id === "IRQ")
      return 0;
    this.stack.push16(this.pc.getValue());
    this.stack.push(this.flags.getValue() | getFlagMask(4, withBFlag));
    this.cycle += 7;
    this.flags.i = true;
    this.pc.setValue(this.memory.read16(interrupt.vector));
    return 7;
  }
}
