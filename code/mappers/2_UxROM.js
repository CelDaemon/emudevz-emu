import Mapper from '/lib/Mapper';

export default class UxROM extends Mapper {
  onLoad() {
    this.page = 0;
  }

  cpuRead(address) {
    if(address >= 0x4020 && address <= 0x7FFF)
      return 0;
    if(address >= 0x8000 && address <= 0xBFFF)
      return this.$getPrgPage(this.page)[address - 0x8000];
    if(address >= 0xC000 && address <= 0xFFFF)
      return this.$getPrgPage(this.prgPages.length - 1)[address - 0xC000];
    throw new Error(`Unmapped address: ${address.toString(16)}`);
  }

  cpuWrite(address, value) {
    if(address >= 0x8000)
      this.page = value;
  }

  ppuRead(address) {
    return this.$getChrPage(0)[address];
  }

  ppuWrite(address, value) {
    if(!this.cartridge.header.usesChrRam)
      return;
    this.$getChrPage(0)[address] = value;
  }

  getSaveState() {
    return {
      ...super.getSaveState(),
      page: this.page
    };
  }

  setSaveState(saveState) {
    super.setSaveState(saveState);
    if(saveState.page != null)
      this.page = saveState.page;
  }
}