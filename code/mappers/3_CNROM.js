import Mapper from "/lib/Mapper";

export default class CNROM extends Mapper {
  onLoad() {
    this.page = 0;
  }

  prgRomPageSize() {
    return 32 * 1024;
  }
  
  cpuRead(address) {
    if(address <= 0x7FFF)
      return 0;
    return this.$getPrgPage(0)[address - 0x8000];
  }

  cpuWrite(address, value) {
    if(address <= 0x7FFF)
      return;
    this.page = value & 0x3;
  }

  ppuRead(address) {
    return this.$getChrPage(this.page)[address];
  }

  ppuWrite(address, value) {
    if(!this.cartridge.header.usesChrRam)
      return;
    return this.$getChrPage(this.page)[address] = value;
  }

  getSaveState() {
    return {
      ...super.getSaveState(),
      page: this.page
    };
  }

  setSaveState(saveState) {
    console.log(saveState);
    super.setSaveState(saveState);
    if(saveState.page != null)
      this.page = saveState.page;
  }
}