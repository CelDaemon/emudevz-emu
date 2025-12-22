import Emulator from './Emulator';
import Speaker from './Speaker';
import romUrl from '/roms/SuperTiltBro.nes?url';

import './Screen';


/** @import Screen from './Screen' */

/** @type {?Screen} */
const screen = document.querySelector("[is=emu-screen]");

if(screen == null)
  throw new Error("Could not get screen");

const speaker = new Speaker(() => {});

const emulator = new Emulator(data => {
    screen.setBuffer(data);
}, (sample) => { speaker.writeSamples(Float32Array.from([sample])); });

emulator.load(new Uint8Array(await (await fetch(romUrl)).arrayBuffer()));
document.addEventListener("click", () => speaker.start());

function frame() {
    emulator.frame();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

