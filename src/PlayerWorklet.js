import RingBuffer from './RingBuffer';

const AUDIO_BUFFER_SIZE = 4 * 1024;


class PlayerWorklet extends AudioWorkletProcessor {
    /**
     * @type {RingBuffer}
     */
    buffer;
    constructor() {
        super();

        this.buffer = new RingBuffer(AUDIO_BUFFER_SIZE);
        this.port.onmessage = (event) => {
            this.buffer.enqueue(event.data);
        };
    }
    /**
     * @param {Float32Array[][]} _inputs
     * @param {Float32Array[][]} outputs
     */
    process(_inputs, outputs) {
        const output = outputs[0][0];
        const size = output.length;
        
        const samples = this.buffer.dequeue(size);
        output.set(samples);

        this.port.postMessage({
            need: size,
            have: this.buffer.size,
            target: AUDIO_BUFFER_SIZE / 2,
        });

        return true;
    }
}

registerProcessor("player-worklet", PlayerWorklet);
