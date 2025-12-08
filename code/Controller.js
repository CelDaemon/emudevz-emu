const BUTTONS = [
  "BUTTON_A",
  "BUTTON_B",
  "BUTTON_SELECT",
  "BUTTON_START",
  "BUTTON_UP",
  "BUTTON_DOWN",
  "BUTTON_LEFT",
  "BUTTON_RIGHT"
];

export default class Controller {
  constructor(player) {
    this.strobe = false;
    this.cursor = 0;
    this.other = null;

    this._player = player;
    this._buttons = [false, false, false, false, false, false, false, false];
  }

  update(button, isPressed) {
    this._buttons[BUTTONS.indexOf(button)] = isPressed;
  }

  isStrobe() {
    if(this._player == 1)
      return this.strobe;
    return this.other.strobe;
  }

  onRead() {
    if(this.cursor >= this._buttons.length) return 1;
    if(this.isStrobe()) return this._buttons[0] ? 1 : 0;
    return this._buttons[this.cursor++] ? 1 : 0;
  }

  onWrite(value) {
    this.strobe = (value & 0x1) != 0;
    if(!this.strobe)
      return;
    this.cursor = 0;
    this.other.cursor = 0;
  }
}

