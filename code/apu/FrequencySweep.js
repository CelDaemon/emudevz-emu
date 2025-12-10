export default class FrequencySweep {
  constructor(channel) {
    this.channel = channel;
    this.startFlag = false;
    this.dividerCount = 0;
    this.mute = false;
  }

  clock() {
    if(this.channel.registers.sweep.enabledFlag && 
       this.channel.registers.sweep.shiftCount > 0 &&
       this.dividerCount === 0 &&
       !this.mute) {
      const sweepDelta = this.channel.timer >> this.channel.registers.sweep.shiftCount;
      this.channel.timer += sweepDelta * (this.channel.registers.sweep.negateFlag ? -1 : 1);
    }
    if(this.dividerCount === 0 || this.startFlag) {
      this.dividerCount = this.channel.registers.sweep.dividerPeriodMinusOne;
      this.startFlag = false;
      return;
    }
    this.dividerCount--;
  }

  muteIfNeeded() {
    this.mute = this.channel.timer < 8 || this.channel.timer > 0x7FF;
  }
}
