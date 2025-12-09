import LengthCounter from './LengthCounter';
import VolumeEnvelope from './VolumeEnvelope';
import noisePeriods from '/lib/apu/noisePeriods';
import byte from '/lib/byte';

export default class NoiseChannel {
  constructor(apu) {
    this.apu = apu;

    this.registers = this.apu.registers.noise;

    this.shift = 1;
    this.dividerCount = 0;

    this.lengthCounter = new LengthCounter();
    this.volumeEnvelope = new VolumeEnvelope();
  }

  sample() {
    if (!this.isEnabled() || !this.lengthCounter.isActive() || (this.shift & 1)) return 0;

    const volume = this.registers.control.constantVolume ? this.registers.control.volumeOrEnvelopePeriod : this.volumeEnvelope.volume;

    return volume;
  }

  step() {
    this.dividerCount++;
    if(this.dividerCount < noisePeriods[this.registers.form.periodId])
      return;
    this.dividerCount = 0;
    const feedback = byte.getBit(this.shift, 0) ^ byte.getBit(this.shift, this.registers.form.mode ? 6 : 1);
    this.shift >>= 1;
    this.shift = byte.setBit(this.shift, 14, feedback);
  }

  quarterFrame() {
    this.volumeEnvelope.clock(this.registers.control.volumeOrEnvelopePeriod, this.registers.control.envelopeLoopOrLengthCounterHalt);
  }

  halfFrame() {
    this.lengthCounter.clock(
      this.isEnabled(),
      this.registers.control.envelopeLoopOrLengthCounterHalt
    );
  }

  isEnabled() {
    return !!this.apu.registers.apuControl.enableNoise;
  }

  random() {
		if (this.s == null) this.s = 0x9e3779b9;
		this.s = (this.s * 1664525 + 1013904223) >>> 0;
		return this.s / 4294967296;
	}
}
