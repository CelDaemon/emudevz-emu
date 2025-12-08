import { isByteNegative, isByte, isShort, getFlagMask, isFlagSet } from './bit.js';

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

const FLAG_CARRY = 0;
const FLAG_ZERO = 1;
const FLAG_INTERRUPT = 2;
const FLAG_DECIMAL = 3;
const FLAG_BREAK = 4;
const FLAG_UNUSED = 5;
const FLAG_OVERFLOW = 6;
const FLAG_NEGATIVE = 7;

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
    return this.pop() | this.pop() << 8;
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
}