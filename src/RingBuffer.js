export default class RingBuffer {

    /**
     * @type {Float32Array} 
     */
    #buffer;

    /**
     * @type {number}
     */
    #read = 0;

    /**
     * @type {number}
     */
    #write = 0;

    /**
     * @param {number} size The size of the ring buffer, must be a power of 2 and be less than half of the UINT32 max number.
     */
    constructor(size) {
        this.#buffer = new Float32Array(size);
    }

    get size() {
        return (this.#write - this.#read) >>> 0;
    }

    get full() {
        return this.free === 0;
    }

    get empty() {
        return this.#read === this.#write;
    }

    get free() {
        return this.#buffer.length - this.size;
    }

    /**
     * @param {Float32Array} data
     */
    enqueue(data) {
        const free = this.free;
        if(free < data.length) {
            console.warn(`Buffer full, need: ${data.length}, have: ${free}`);
            data = data.slice(0, free);
        }
        for(let i = 0; i < data.length; i++) {
            this.#buffer[this.#write % this.#buffer.length] = data[i];
            this.#write = (this.#write + 1) >>> 0;
        }
    }

    /**
     * @param {number} size
     *
     * @returns {Float32Array}
     */
    dequeue(size) {
        size = Math.min(size, this.size);
        const data = new Float32Array(size);
        for(let i = 0; i < size; i++) {
            data[i] = this.#buffer[this.#read % this.#buffer.length];
            this.#read = (this.#read + 1) >>> 0;
        }
        return data;
    }
}
