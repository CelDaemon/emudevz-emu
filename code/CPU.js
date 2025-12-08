class Register {
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


class Register8Bit extends Register {
  constructor() {
    super(new Uint8Array(1));
  }
  
}

class Register16Bit extends Register {
  constructor() {
    super(new Uint16Array(1));
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
  }
}