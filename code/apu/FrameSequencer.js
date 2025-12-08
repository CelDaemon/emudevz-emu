export default class FrameSequencer {
  constructor(apu) {
    this.apu = apu;
    this.reset();
  }
  reset() {
    this.counter = 0;
  }
  step() {
    this.counter++;
    const isEnd = this.counter == (this.apu.registers.apuFrameCounter.use5StepSequencer ? 
                                   18641 : 14916);
    if(isEnd || this.counter == 7457) {
      if(isEnd)
        this.counter = 0;
      this.apu.onQuarterFrameClock();
      this.apu.onHalfFrameClock();
      
      return;
    }
    if(this.counter != 3729 && this.counter != 11186)
      return;
    this.apu.onQuarterFrameClock();
  }
}