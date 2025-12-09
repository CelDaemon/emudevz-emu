import LengthCounter from './LengthCounter';
import LinearLengthCounter from './LinearLengthCounter';
import TriangleOscillator from '/lib/apu/TriangleOscillator';
import byte from '/lib/byte';

const CPU_FREQ = 1789773;

export default class TriangleChannel {
  constructor(apu) {
    this.apu = apu;
    this.registers = this.apu.registers.triangle;

    this.previousSample = 0;

    this.oscillator = new TriangleOscillator();
    this.lengthCounter = new LengthCounter();
    this.linearLengthCounter = new LinearLengthCounter();
  }

  sample() {
    if(!this.isEnabled() || !this.lengthCounter.isActive() || !this.linearLengthCounter.isActive())
      return this.previousSample;
    const timer = byte.buildU16(
      this.registers.timerHighLCL.timerHigh,
      this.registers.timerLow.value
    );
    if(timer < 2 || timer > 0x7FF)
      return this.previousSample = 0;
    this.oscillator.frequency = CPU_FREQ / (16 * (timer + 1)) / 2;
    return this.previousSample = this.oscillator.sample();
  }

  isEnabled() {
    return !!this.apu.registers.apuControl.enableTriangle;
  }

  quarterFrame() {
    this.linearLengthCounter.clock(this.isEnabled(), this.registers.lengthControl.halt);
  }

  halfFrame() {
    this.lengthCounter.clock(this.isEnabled(), this.registers.lengthControl.halt);
  }
}
