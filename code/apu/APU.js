import AudioRegisters from 'AudioRegisters';
import PulseChannel from 'PulseChannel';
import FrameSequencer from 'FrameSequencer';

export default class APU {
  constructor(cpu) {
    this.cpu = cpu;

    this.registers = new AudioRegisters(this);
    this.channels = {
      pulses: [
        new PulseChannel(this, 0, "enablePulse1"),
        new PulseChannel(this, 1, "enablePulse2")
      ]
    };

    this.frameSequencer = new FrameSequencer(this);

    this.sampleCounter = 0;
    this.sample = 0;
  }

  step(onSample) {
    for(const pulse of this.channels.pulses)
      pulse.step();
    this.sampleCounter++;
    this.frameSequencer.step();
    if(this.sampleCounter != 20)
      return;
    this.sampleCounter = 0;
    const pulse1 = this.channels.pulses[0].sample();
    const pulse2 = this.channels.pulses[1].sample();
    this.sample = (pulse1 + pulse2) * 0.01;
    onSample(this.sample, pulse1, pulse2);
  }

  onQuarterFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.quarterFrame();
  }
  onHalfFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.halfFrame();
  }
}
