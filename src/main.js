import Emulator from './Emulator';
import Speaker from './Speaker';
import romUrl from '/roms/SuperTiltBro.nes?url';

import './Screen';


/** @import Screen from './Screen' */

/** @type {?Screen} */
const screen = document.querySelector("[is=emu-screen]");

if(screen == null)
  throw new Error("Could not get screen");


const samples = new Float32Array(8 * 1024);
let sampleCursor = 0;

const emulator = new Emulator(data => {
  screen.setBuffer(data);
}, (sample) => { samples[sampleCursor++] = sample; });


const speaker = new Speaker(({need, have, target}) => {
  if(have > target + 64) need--;
  else if(have < target - 64) need++;
  emulator.samples(need);
  speaker.writeSamples(samples.subarray(0, sampleCursor));
  sampleCursor = 0;
});

emulator.load(new Uint8Array(await (await fetch(romUrl)).arrayBuffer()));
document.addEventListener("click", () => speaker.start());
window.addEventListener("blur", () => speaker.pause());
window.addEventListener("focus", () => speaker.resume());

