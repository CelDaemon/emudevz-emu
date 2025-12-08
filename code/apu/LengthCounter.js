export default class LengthCounter {
  constructor() {
    this.reset();
  }
  reset() {
    this.counter = 0;
  }
  isActive() {
    return this.counter > 0;
  }
  clock(isEnabled, isHalted) {
    if(!isEnabled) {
      this.reset();
      return;
    }
    if(!this.isActive() || isHalted)
      return;
    this.counter--;
  }
}