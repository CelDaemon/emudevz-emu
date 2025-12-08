export function isByteNegative(value) {
  console.assert(isByte(value), value);
  return (value >> 7 & 1) != 0;
}

export function isFlagSet(value, flag) {
  return (value >> flag & 1) != 0;
}

export function getFlagMask(flag, state) {
  console.assert(isBit(state), state);
  return state << flag;
}

export function getShortHighByte(value) {
  console.assert(isShort(value), value);
  return value >> 8;
}

const BYTE_MASK = 0xFF;
const SHORT_MASK = 0xFFFF;

export function toByte(value) {
  return value & BYTE_MASK;
}

export function toSignedByte(value) {
  console.assert(isByte(value), value);
  return (value << 24) >> 24;
}

export function toShort(value) {
  return value & SHORT_MASK;
}

export function isByte(value) {
  return (value & ~BYTE_MASK) == 0;
}

export function isShort(value) {
  return (value & ~SHORT_MASK) == 0;
}

export function isBit(value) {
  return (value & ~1) == 0;
}