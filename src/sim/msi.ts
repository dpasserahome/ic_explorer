import type { Bit } from './types';

/** Binary value of bits given MSB first. */
export const binaryValue = (bits: Bit[]) => bits.reduce<number>((n, b) => n * 2 + b, 0);

/** n bits of value, MSB first. */
export const toBits = (value: number, n: number): Bit[] =>
  Array.from({ length: n }, (_, i) => ((value >> (n - 1 - i)) & 1) as Bit);

/**
 * 1-of-2^n decoder with active-LOW outputs: output `address` is LOW while enabled, every other
 * output is HIGH. Disabled, all outputs are HIGH.
 */
export function decodeActiveLow(enabled: boolean, address: Bit[]): Bit[] {
  const a = binaryValue(address);
  return Array.from({ length: 1 << address.length }, (_, i): Bit => (enabled && i === a ? 0 : 1));
}

/**
 * 74138 3-to-8 line decoder. Inputs in order ~E1, ~E2, E3, A2, A1, A0. Enabled only when ~E1
 * and ~E2 are LOW and E3 is HIGH. Outputs ~Y0 … ~Y7.
 */
export function decoder138([e1, e2, e3, a2, a1, a0]: Bit[]): Bit[] {
  return decodeActiveLow(e1 === 0 && e2 === 0 && e3 === 1, [a2, a1, a0]);
}
