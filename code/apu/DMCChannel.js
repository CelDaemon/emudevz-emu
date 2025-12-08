import DPCM from '/lib/apu/DPCM';

export default class DMCChannel {
  constructor(apu, cpu) {
    this.apu = apu;
    this.cpu = cpu;

    this.registers = this.apu.registers.dmc;

    this.outputSample = 0;

    this.dpcm = new DPCM(this);
  }

  sample() {
    return this.outputSample;
  }

  step() {
    this.dpcm.update();
  }
}
