import playerWorklet from "./PlayerWorklet?worker&url";

const WORKLET_NAME = "player-worklet";
const APU_SAMPLE_RATE = 44100;
const CHANNELS = 1;

/**
 * @callback AudioRequestedCallback
 *
 * @param {object} data
 *
 * @returns {void}
 */

export default class Speaker {
  /**
   * @type {AudioRequestedCallback}
   */
  #onAudioRequested;

  /**
   * @type {?AudioContext}
   */
  #context;

  /**
   * @type {?AudioWorkletNode}
   */
  #playerWorklet;
  /**
   * @param {AudioRequestedCallback} onAudioRequested
   */
  constructor(onAudioRequested) {
    this.#onAudioRequested = onAudioRequested;
    this.#context = null;
    this.#playerWorklet = null;
  }

  async start() {
    if(this.#context || !("AudioContext" in window))
      return;

    this.#context = new AudioContext({
      sampleRate: APU_SAMPLE_RATE
    });

    await this.#context.audioWorklet.addModule(playerWorklet);

    // TODO: Wouldn't this have crashed already??
    if(this.#context == null) {
      this.stop();
      return;
    }

    console.log("Meow?");

    this.#playerWorklet = new AudioWorkletNode(this.#context, WORKLET_NAME, {
      outputChannelCount: [CHANNELS]
    });
    this.#playerWorklet.connect(this.#context.destination);
    this.#playerWorklet.port.onmessage = (event) => {
      this.#onAudioRequested(event.data);
    };
  }

  /**
   * @param {Float32Array} samples
   */
  writeSamples(samples) {
    this.#playerWorklet?.port.postMessage(samples);
  }

  stop() {
    this.#playerWorklet?.port.close();
    this.#playerWorklet?.disconnect();
    this.#playerWorklet = null;

    this.#context?.close().catch(console.error);
    this.#context = null;
  }
}
