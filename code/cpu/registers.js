import { getFlagMask, isByte, isByteNegative, isFlagSet } from '../bit';

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


export class Register8Bit extends ArrayRegister {
  constructor() {
    super(new Uint8Array(1));
  }

}

export class Register16Bit extends ArrayRegister {
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

export class FlagsRegister {
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