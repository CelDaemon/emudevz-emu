export default class CPU {
  constructor(memory) {
    this.memory = memory;
    this.cycle = 0;
    this.extraCycles = 0;
  }
}