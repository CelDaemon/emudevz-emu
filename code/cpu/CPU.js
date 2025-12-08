import { isByteNegative, isByte, isShort, isFlagSet, buildShort, getFlagMask } from '../bit';
import defineOperations from '/lib/cpu/defineOperations';
import instructions from 'instructions';
import addressingModes from 'addressingModes';

import { FlagsRegister, Register8Bit, Register16Bit } from 'registers';

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

    this.operations = defineOperations(instructions, addressingModes);

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
