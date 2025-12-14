import CPUMemory from "./CPUMemory";
import Cartridge from "./Cartridge";
import Controller from "./Controller";
import APU from "./apu/APU";
import CPU from "./cpu/CPU";
import { createMapper } from "./mappers/mappers";
import PPU from "./ppu/PPU";
import saveStates from "./saveStates";

const PPU_STEPS_PER_CPU_CYCLE = 3;
const APU_STEPS_PER_CPU_CYCLE = 0.5;

/** @import Mapper from '/lib/Mapper' */
/** @import { Button } from "./Controller" */

/**
 * A callback containing a drawn frame.
 *
 * @callback FrameCallback
 *
 * @param {Uint32Array} framebuffer The newly drawn frame.
 *
 * @returns {void}
 */

/**
 * A callback containing a generated sample.
 *
 * @callback SampleCallback
 *
 * @param {number} sample The final mixed sample.
 * @param {number} pulse1 Sample from the 1st pulse channel.
 * @param {number} pulse2 Sample from the 2nd pulse channel.
 * @param {number} triangle Sample from the triangle channel.
 * @param {number} noise Sample from the noise channel.
 * @param {number} dmc Sample from the DMC channel.
 *
 * @returns {void}
 */

// TODO: Better type the InterruptCallback

/**
 * A callback to trigger a CPU interrupt.
 *
 * @callback InterruptCallback
 *
 * @param {object} interrupt The interrupt to trigger.
 * 
 * @returns {void}
 */

/**
 * @typedef {object} EmulatorContext
 *
 * @prop {Cartridge} cartridge The currently loaded cartridge.
 * @prop {Mapper} mapper The currently active mapper.
 * @prop {[controller1: Controller, controller2: Controller]}
 *     controllers The active controllers.
 */


export default class Emulator {

  /**
   * A callback that is executed when a new frame has finished drawing.
   *
   * @type {FrameCallback}
   */
  onFrame;

  /**
   * A callback that is executed when a new sample is generated.
   *
   * @type {SampleCallback}
   */
  onSample;

  /**
   * The CPU memory bus.
   *
   * @type {CPUMemory}
   */
  cpuMemory;

  /**
   * The central processing unit.
   *
   * @type {CPU}
   */
  cpu;

  /**
   * The pixel processing unit.
   *
   * @type {PPU}
   */
  ppu;

  /**
   * The audio processing unit.
   *
   * @type {APU}
   */
  apu;

  /**
   * The current sample count.
   *
   * @type {number}
   */
  sampleCount;

  /**
   * Amount of extra cycles to run the next time the PPU is clocked.
   */
  pendingPPUCycles;

  /**
   * Amount of extra cycles to run the next time the APU is clocked.
   */
  pendingAPUCycles;

  /**
   * Callback that is executed when a scanline is processed.
   * 
   * @type {?() => void}
   */
  onScanline;

  /**
   * The currently active context.
   *
   * @type {?EmulatorContext}
   */
  context;

  /**
   * @param {FrameCallback} onFrame
   * @param {SampleCallback} onSample
   */
  constructor(onFrame, onSample) {
    this.onFrame = onFrame;
    this.onSample = (sample, pulse1, pulse2, triangle, noise, dmc) => {
      this.sampleCount++;
      onSample(sample, pulse1, pulse2, triangle, noise, dmc);
    };

    this.cpuMemory = new CPUMemory();
    this.cpu = new CPU(this.cpuMemory);
    this.ppu = new PPU(this.cpu);
    this.apu = new APU(this.cpu);

    this.sampleCount = 0;
    this.pendingPPUCycles = 0;
    this.pendingAPUCycles = 0;

    this.onScanline = null;

    this.context = null;
  }

  /**
   * Loads a ROM file.
   *
   * @param {Uint8Array} bytes The raw ROM data.
   * @param {?Uint8Array} saveFileBytes The raw save file data.
   *
   * @returns {void}
   */
  load(bytes, saveFileBytes = null) {
    const cartridge = new Cartridge(bytes);
    const mapper = createMapper(this.cpu, this.ppu, cartridge);

    const controller1 = new Controller(1);
    const controller2 = new Controller(2);
    controller1.other = controller2;
    controller2.other = controller1;
    /** @type {[Controller, Controller]} */
    const controllers = [controller1, controller2];

    this.cpu.memory.onLoad(this.ppu, this.apu, mapper, controllers);
    this.ppu.onLoad(mapper);
    this.ppu.memory.onLoad(cartridge, mapper);

    this.pendingPPUCycles = 0;
    this.pendingAPUCycles = 0;
    this.context = {
      cartridge,
      mapper,
      controllers,
    };

    this.cpu.interrupt({
      id: "RESET",
      vector: 0xfffc,
    });

    this._setSaveFile(saveFileBytes);
  }

  /**
   * Updates a button's state.
   *
   * @param {1 | 2} playerId The player to update the button for.
   * @param {Button} button The button to update.
   * @param {boolean} isPressed Whether the button is pressed.
   *
   * @returns {void}
   */
  setButton(playerId, button, isPressed) {
    if (!this.context) return;
    if (playerId !== 1 && playerId !== 2)
      throw new Error(`Invalid player: ${playerId}.`);

    this.context.controllers[playerId - 1].update(button, isPressed);
  }

  /**
   * Runs the emulation for a whole frame.
   * Used when "SYNC TO VIDEO" is active.
   *
   * @returns {void}
   */
  frame() {
    if (!this.context) return;

    const currentFrame = this.ppu.frame;
    while (this.ppu.frame === currentFrame) {
      this.step();
    }
  }

  /**
   * Runs the emulation for `n` audio samples.
   * Used when "SYNC TO AUDIO" is active.
   *
   * @param {number} n The amount of samples to run for.
   *
   * @returns {void}
   */
  samples(n) {
    if (!this.context) return;

    this.sampleCount = 0;
    while (this.sampleCount < n) {
      this.step();
    }
  }

  /** 
   * Runs the emulation until the next scanline.
   *
   * @param {boolean} [debug] Whether to draw the scanline marker.
   *
   * @returns {void}
   */
  scanline(debug = false) {
    if (!this.context) return;

    const currentScanline = this.ppu.scanline;
    while (this.ppu.scanline === currentScanline) {
      this.step();
    }

    let oldFrameBuffer;
    if (debug) {
      oldFrameBuffer = Uint32Array.from(this.ppu.frameBuffer);

      // plot red line
      for (let i = 0; i < 256; i++)
        this.ppu.plot(i, this.ppu.scanline, 0xff0000ff);
    }

    this.onFrame(this.ppu.frameBuffer);

    if (debug) {
      this.ppu.frameBuffer.set(
        /** @type {NonNullable<typeof oldFrameBuffer>} */ (oldFrameBuffer), 0);
    }
  }

  /** 
   * Executes a step in the emulation (1 CPU instruction).
   *
   * @returns {void}
   */
  step() {
    let cpuCycles = this.cpu.step();
    cpuCycles = this._clockPPU(cpuCycles);
    this._clockAPU(cpuCycles);
  }

  /**
   * Returns an array with the save file bytes,
   * or null if the game doesn't have a save file.
   *
   * @returns {?number[]} The save file in the form of a number array.
   */
  getSaveFile() {
    if (!this.context) return null;
    const { prgRam } = this.context.mapper;
    if (!prgRam) return null;

    return Array.from(prgRam);
  }


   /**
   * Returns an object with a snapshot of the current state.
   *
   * @returns {?object} The created snapshot.
   */
  getSaveState() {
    if (!this.context) return null;

    return saveStates.getSaveState(this);
  }

  // TODO: Further type the save state.

  /**
   * Restores the current state from a snapshot.
   *
   * @param {object} saveState The snapshot to load.
   *
   * @returns {void}
   */
  setSaveState(saveState) {
    if (!this.context) return;

    
    // TODO: Improve save state typing.
    const clonedSaveState = /** @type { { saveFile: ?Uint8Array } } */ (structuredClone(saveState));

    saveStates.setSaveState(this, clonedSaveState);
    this._setSaveFile(clonedSaveState.saveFile);
  }

  /**
   * Clock the PPU for a specific amount of CPU cycles.
   *
   * @param {number} cpuCycles The amount of CPU cycles to run for.
   *
   * @returns {number} The number of CPU cycles that were ran.
   */
  _clockPPU(cpuCycles) {
    const scanline = this.ppu.scanline;

    let unitCycles =
      this.pendingPPUCycles + cpuCycles * PPU_STEPS_PER_CPU_CYCLE;
    this.pendingPPUCycles = 0;

    /** @type {InterruptCallback} */
    const onIntr = (interrupt) => {
      const newCPUCycles = this.cpu.interrupt(interrupt);
      cpuCycles += newCPUCycles;
      unitCycles += newCPUCycles * PPU_STEPS_PER_CPU_CYCLE;
    };

    for (let i = 0; i < unitCycles; i++) {
      // <optimization>
      if (
        (this.ppu.cycle > 1 && this.ppu.cycle < 256) ||
        (this.ppu.cycle > 260 && this.ppu.cycle < 304) ||
        (this.ppu.cycle > 304 && this.ppu.cycle < 340)
      ) {
        this.ppu.cycle++;
        continue;
      }
      // </optimization>

      this.ppu.step(this.onFrame, onIntr);
    }

    if (this.ppu.scanline !== scanline && this.onScanline != null)
      this.onScanline();

    return cpuCycles;
  }

  /**
   * Clock the APU for a specific amount of CPU cycles.
   *
   * @param {number} cpuCycles The amount of CPU cycles to run for.
   *
   * @returns {void}
   */
  _clockAPU(cpuCycles) {
    let unitCycles =
      this.pendingAPUCycles + cpuCycles * APU_STEPS_PER_CPU_CYCLE;

    // /** @type {InterruptCallback} */
    // const onIntr = (interrupt) => {
    //   const newCPUCycles = this.cpu.interrupt(interrupt);
    //   unitCycles += newCPUCycles * APU_STEPS_PER_CPU_CYCLE;
    //   this.pendingPPUCycles += newCPUCycles * PPU_STEPS_PER_CPU_CYCLE;
    // };

    while (unitCycles >= 1) {
      // TODO: Implement APU IRQ.
      this.apu.step(this.onSample); // onIntr;
      unitCycles--;
    }

    this.pendingAPUCycles = unitCycles;
  }

  /**
   * Load save data into PRG RAM.
   *
   * @param {?Uint8Array} prgRamBytes The save file data to load.
   *
   * @returns {void}
   */
  _setSaveFile(prgRamBytes) {
    if (!this.context) 
      return;
    const { prgRam } = 
      this.context.mapper;
    if (!prgRam || !prgRamBytes) return;

    prgRam.set(prgRamBytes, 0);
  }
}
