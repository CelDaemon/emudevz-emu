import AudioRegisters from 'AudioRegisters';
import PulseChannel from 'PulseChannel';
import FrameSequencer from 'FrameSequencer';
import TriangleChannel from 'TriangleChannel';

export default class APU {
  constructor(cpu) {
    this.cpu = cpu;

    this.registers = new AudioRegisters(this);
    this.channels = {
      pulses: [
        new PulseChannel(this, 0, "enablePulse1"),
        new PulseChannel(this, 1, "enablePulse2")
      ],
      triangle: new TriangleChannel(this, "enableTriangle")
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
    const triangle = this.channels.triangle.sample();
    this.sample = (pulse1 + pulse2 + triangle) * 0.01;
    onSample(this.sample, pulse1, pulse2, triangle);
  }

  onQuarterFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.quarterFrame();
    this.channels.triangle.quarterFrame();
  }
  onHalfFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.halfFrame();
    this.channels.triangle.halfFrame();
  }
}
