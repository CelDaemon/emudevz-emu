import Emulator from './Emulator';
import romUrl from '/roms/SuperTiltBro.nes?url';

import './Screen';

const screen = document.querySelector("[is=emu-screen]");

const emulator = new Emulator(data => {
    screen.setBuffer(data);
}, () => {});

emulator.load(new Uint8Array(await (await fetch(romUrl)).arrayBuffer()));

function frame() {
    emulator.frame();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// const canvas = document.querySelector("canvas#emu");
// const ctx = canvas.getContext('2d');


//
// window.emulator = new Emulator(data => {
//     const imgData = new ImageData(new Uint8ClampedArray(data.buffer), 256, 240);
//     ctx.putImageData(imgData, 0, 0);
// }, () => {});
// window.emulator.load(romData);
//
// function frame() {
//     window.emulator.frame();
//     requestAnimationFrame(frame);
// }
//
// requestAnimationFrame(frame);
