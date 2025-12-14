import { isByte, isFlagSet } from './bit';


/** @typedef {'BUTTON_LEFT'   |
 *            'BUTTON_RIGHT'  |
 *            'BUTTON_UP'     |
 *            'BUTTON_DOWN'   |
 *            'BUTTON_A'      |
 *            'BUTTON_B'      |
 *            'BUTTON_X'      |
 *            'BUTTON_Y'      |
 *            'BUTTON_START'  |
 *            'BUTTON_SELECT'
 *            } Button
 */


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

const FLAG_STROBE = 0;

export default class Controller {

  /**
   * Whether the shift register should be reloaded.
   *
   * @type {boolean}
   */
  strobe;

  /**
   * The current position in the shift register.
   *
   * @type {number}
   */
  cursor;

  /**
   * The controller of the other player.
   *
   * @type {?Controller}
   */
  other;

  /**
   * The player this controller is associated with.
   *
   * @type {1 | 2}
   */
  _player;

  /**
   * The current button state.
   *
   * @type {[a: boolean, b: boolean, select: boolean, start: boolean, up: boolean,
         down: boolean, left: boolean, right: boolean]}
   */
  _buttons;

  /**
   * @param {1 | 2} player The player this controller is associated with.
   */
  constructor(player) {
    this.strobe = false;
    this.cursor = 0;
    this.other = null;

    this._player = player;
    this._buttons = [false, false, false, false, false, false, false, false];
  }

  /**
   * Update a button's state.
   *
   * @param {Button} button The button to update the state for.
   * @param {boolean} isPressed Whether the button is pressed.
   *
   * @returns {void}
   */
  update(button, isPressed) {
    this._buttons[BUTTONS.indexOf(button)] = isPressed;
  }

  /**
   * Whether the player 1 controller has the strobe active.
   *
   * @returns {boolean}
   */
  isStrobe() {
    if(this._player === 1)
      return this.strobe;
    const other = /** @type {NonNullable<typeof this.other>} */ (this.other);
    return other.strobe;
  }

  /**
   * Read a button state from the current shift register position.
   *
   * @returns {1 | 0} The read button state in the form of a single bit.
   */
  onRead() {
    if(this.cursor >= this._buttons.length) return 1;
    if(this.isStrobe()) return this._buttons[0] ? 1 : 0;
    return this._buttons[this.cursor++] ? 1 : 0;
  }

  /**
   * Write a value to this controller, allowing for toggling the strobe register.
   *
   * @param {number} value The value to write.
   *
   * @returns {void}
   */
  onWrite(value) {
    console.assert(isByte(value), value);
    this.strobe = isFlagSet(value, FLAG_STROBE);
    if(!this.strobe)
      return;
    this.cursor = 0;
    const other = /** @type {NonNullable<typeof this.other>} */ (this.other);
    other.cursor = 0;
  }
}

