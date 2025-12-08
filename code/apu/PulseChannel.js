import byte from "/lib/byte";
import PulseOscillator from '/lib/apu/PulseOscillator';
import LengthCounter from 'LengthCounter';
import VolumeEnvelope from 'VolumeEnvelope';

const CPU_FREQ = 1789773;

export default class PulseChannel {
  constructor(apu, id, enableFlagName) {
    this.apu = apu;

    this.id = id;
    this.enableFlagName = enableFlagName;

    this.timer = 0;
    this.registers = this.apu.registers.pulses[this.id];

    this.oscillator = new PulseOscillator();
    this.lengthCounter = new LengthCounter();
    this.volumeEnvelope = new VolumeEnvelope();

    this.previousSample = 0;
  }

  sample() {
    if(!this.isEnabled() || !this.lengthCounter.isActive())
      return this.previousSample;
    this.oscillator.frequency = CPU_FREQ / (16 * (this.timer + 1));
    this.oscillator.dutyCycle = this.apu.registers.pulses[this.id].control.dutyCycleId;
    this.oscillator.volume = this.apu.registers.pulses[this.id].control.constantVolume ?
      this.apu.registers.pulses[this.id].control.volumeOrEnvelopePeriod :
      this.volumeEnvelope.volume;
    this.previousSample = this.oscillator.sample();
    return this.previousSample;
  }

  updateTimer() {
    this.timer = byte.buildU16(
      this.registers.timerHighLCL.timerHigh,
      this.registers.timerLow.value
    );
  }

  step() {
    this.updateTimer();
  }

  isEnabled() {
    return !!this.apu.registers.apuControl[this.enableFlagName];
  }

  quarterFrame() {
    const pulseControl = this.apu.registers.pulses[this.id].control;
    this.volumeEnvelope.clock(pulseControl.volumeOrEnvelopePeriod, pulseControl.envelopeLoopOrLengthCounterHalt);
  }

  halfFrame() {
    this.lengthCounter.clock(this.isEnabled(), this.apu.registers.pulses[this.id].control.envelopeLoopOrLengthCounterHalt);
  }
}
