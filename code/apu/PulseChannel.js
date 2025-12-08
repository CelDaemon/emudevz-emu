import byte from "/lib/byte";
import PulseOscillator from '/lib/apu/PulseOscillator';
import LengthCounter from 'LengthCounter';
import VolumeEnvelope from 'VolumeEnvelope';
import FrequencySweep from 'FrequencySweep';

const CPU_FREQ = 1789773;

export default class PulseChannel {
  constructor(apu, id, enableFlagName) {
    this.apu = apu;

    this.id = id;
    this.enableFlagName = enableFlagName;

    this.timer = 0;
    this.registers = this.apu.registers.pulses[this.id];
    this.previousSample = 0;

    this.oscillator = new PulseOscillator();
    this.lengthCounter = new LengthCounter();
    this.volumeEnvelope = new VolumeEnvelope();
    this.frequencySweep = new FrequencySweep(this);

    
  }

  sample() {
    if(this.frequencySweep.mute || !this.isEnabled() || !this.lengthCounter.isActive())
      return this.previousSample; // TODO: Documentation suggests 0 should be returned, rectify this?
    this.oscillator.frequency = CPU_FREQ / (16 * (this.timer + 1));
    this.oscillator.dutyCycle = this.registers.control.dutyCycleId;
    this.oscillator.volume = this.registers.control.constantVolume ?
      this.registers.control.volumeOrEnvelopePeriod :
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
    this.frequencySweep.muteIfNeeded();
    if(!this.registers.sweep.enabledFlag)
      this.updateTimer();
  }

  isEnabled() {
    return !!this.apu.registers.apuControl[this.enableFlagName];
  }

  quarterFrame() {
    this.volumeEnvelope.clock(this.registers.control.volumeOrEnvelopePeriod, this.registers.control.envelopeLoopOrLengthCounterHalt);
  }

  halfFrame() {
    this.lengthCounter.clock(this.isEnabled(), this.registers.control.envelopeLoopOrLengthCounterHalt);
    this.frequencySweep.clock();
  }
}
