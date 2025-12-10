import AudioRegisters from './AudioRegisters';
import PulseChannel from './PulseChannel';
import FrameSequencer from './FrameSequencer';
import TriangleChannel from './TriangleChannel';
import NoiseChannel from './NoiseChannel';
import DMCChannel from './DMCChannel';

export default class APU {
  constructor(cpu) {
    this.cpu = cpu;

    this.registers = new AudioRegisters(this);
    this.channels = {
      pulses: [
        new PulseChannel(this, 0, "enablePulse1"),
        new PulseChannel(this, 1, "enablePulse2")
      ],
      triangle: new TriangleChannel(this, "enableTriangle"),
      noise: new NoiseChannel(this, "enableNoise"),
      dmc: new DMCChannel(this, this.cpu)
    };

    this.frameSequencer = new FrameSequencer(this);

    this.sampleCounter = 0;
    this.sample = 0;
  }

  step(onSample) {
    for(const pulse of this.channels.pulses)
      pulse.step();
    this.frameSequencer.step();
    this.channels.noise.step();
    this.channels.dmc.step();
    this.sampleCounter++;
    if(this.sampleCounter !== 20)
      return;
    this.sampleCounter = 0;
    const pulse1 = this.channels.pulses[0].sample();
    const pulse2 = this.channels.pulses[1].sample();
    const triangle = this.channels.triangle.sample();
    const noise = this.channels.noise.sample();
    const dmc = this.channels.dmc.sample();
    this.sample = 
      0.00752 * (pulse1 + pulse2) +
      0.00851 * triangle +
      0.00494 * noise +
      0.00335 * dmc;
    onSample(this.sample, pulse1, pulse2, triangle, noise, dmc);
  }

  onQuarterFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.quarterFrame();
    this.channels.triangle.quarterFrame();
    this.channels.noise.quarterFrame();
  }
  onHalfFrameClock() {
    for(const pulse of this.channels.pulses)
      pulse.halfFrame();
    this.channels.triangle.halfFrame();
    this.channels.noise.halfFrame();
  }
}
