import LengthCounter from './LengthCounter';

export default class LinearLengthCounter extends LengthCounter {
  constructor() {
    super();
    this.reload = 0;
    this.reloadFlag = false;
  }
  fullReset() {
    this.reset();
    this.reload = 0;
    this.reloadFlag = false;
  }

  clock(isEnabled, isHalted) {
    if(!isEnabled) {
      this.reset();
      return;
    }

    if(this.reloadFlag)
      this.counter = this.reload;
    else
      super.clock(isEnabled, false);

    if(!isHalted)
      this.reloadFlag = false;
  }
}