export default class APU {
  constructor(cpu) {
    this.cpu = cpu;

    this.sampleCounter = 0;
    this.sample = 0;
  }

  step(onSample) {
    if(++this.sampleCounter != 20)
      return;
    this.sampleCounter = 0;
    onSample(this.sample);
  }
}
