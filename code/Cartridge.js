const MAGIC = "NES";


export default class Cartridge {
  /** @type {Uint8Array} */
  bytes;
  constructor(bytes) {
    if(bytes[0] != MAGIC.charCodeAt(0) ||
       bytes[1] != MAGIC.charCodeAt(1) ||
       bytes[2] != MAGIC.charCodeAt(2) ||
       bytes[3] != 0x1A)
      throw new Error("Invalid ROM");
    this.bytes = bytes;
  }
}