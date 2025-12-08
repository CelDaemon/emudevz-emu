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
  
  increment() {
    this.wrapper[0]++;
  }
  
  decrement() {
    this.wrapper[0]--;
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
    return this.c << FLAG_CARRY |
      this.z << FLAG_ZERO |
      this.i << FLAG_INTERRUPT |
      this.d << FLAG_DECIMAL |
      0 << FLAG_BREAK |
      1 << FLAG_UNUSED |
      this.v << FLAG_OVERFLOW |
      this.n << FLAG_NEGATIVE;
  }

  setValue(value) {
    this.c = (value >> FLAG_CARRY & 1) != 0;
    this.z = (value >> FLAG_ZERO & 1) != 0;
    this.i = (value >> FLAG_INTERRUPT & 1) != 0;
    this.d = (value >> FLAG_DECIMAL & 1) != 0;
    this.v = (value >> FLAG_OVERFLOW & 1) != 0;
    this.n = (value >> FLAG_NEGATIVE & 1) != 0;
  }

  updateZero(value) {
    this.z = value == 0;
  }

  updateNegative(value) {
    this.n = (value >> 7) != 0;
  }

  updateZeroAndNegative(value) {
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
  push(value) {
    this.memory.write(STACK_ADDRESS + this.sp.getValue(), value);
    this.sp.decrement();
  }
  pop() {
    this.sp.increment();
    return this.memory.read(STACK_ADDRESS + this.sp.getValue());
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