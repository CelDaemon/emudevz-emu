import TriangleOscillator from '/lib/apu/TriangleOscillator';
import byte from '/lib/byte';

const CPU_FREQ = 1789773;

export default class TriangleChannel {
  constructor(apu) {
    this.apu = apu;
    this.registers = this.apu.registers.triangle;

    this.oscillator = new TriangleOscillator();

    this.timer = 0;
  }

  sample() {
    const timer = byte.buildU16(
      this.registers.timerHighLCL.timerHigh,
      this.registers.timerLow.value
    );
    if(timer < 2 || timer > 0x7FF)
      return 0;
    this.oscillator.frequency = CPU_FREQ / (16 * (timer + 1)) / 2;
    return this.oscillator.sample();
  }
}