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
    return this.c |
      this.z << 1 |
      this.i << 2 |
      this.d << 3 |
      1 << 5 |
      this.v << 6 |
      this.n << 7;
  }

  setValue(value) {
    this.c = (value & 1) != 0;
    this.z = (value >> 1 & 1) != 0;
    this.i = (value >> 2 & 1) != 0;
    this.d = (value >> 3 & 1) != 0;
    this.v = (value >> 6 & 1) != 0;
    this.n = (value >> 7 & 1) != 0;
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
  }
}