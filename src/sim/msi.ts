import type { Bit } from './types';

export { toBits } from './logic';

/** Binary value of bits given MSB first. */
export const binaryValue = (bits: Bit[]) => bits.reduce<number>((n, b) => n * 2 + b, 0);

const inv = (b: Bit): Bit => (b ? 0 : 1);

/**
 * 1-of-2^n decoder with active-LOW outputs: output `address` is LOW while enabled, every other
 * output is HIGH. Disabled, all outputs are HIGH.
 */
export function decodeActiveLow(enabled: boolean, address: Bit[]): Bit[] {
  const a = binaryValue(address);
  return Array.from({ length: 1 << address.length }, (_, i): Bit => (enabled && i === a ? 0 : 1));
}

/** 74138 3-to-8 decoder. Inputs ~E1, ~E2, E3, A2, A1, A0. Outputs ~Y0 … ~Y7. */
export function decoder138([e1, e2, e3, a2, a1, a0]: Bit[]): Bit[] {
  return decodeActiveLow(e1 === 0 && e2 === 0 && e3 === 1, [a2, a1, a0]);
}

/** One half of the 74139 dual 2-to-4 decoder. Inputs ~E, A1, A0. Outputs ~Y0 … ~Y3. */
export function decoder139([e, a1, a0]: Bit[]): Bit[] {
  return decodeActiveLow(e === 0, [a1, a0]);
}

/** 74154 4-to-16 decoder. Inputs ~E0, ~E1, A3, A2, A1, A0. Outputs ~Y0 … ~Y15. */
export function decoder154([e0, e1, ...address]: Bit[]): Bit[] {
  return decodeActiveLow(e0 === 0 && e1 === 0, address);
}

/**
 * 7442 BCD-to-decimal decoder. Inputs A3, A2, A1, A0. Outputs ~Y0 … ~Y9: output n is LOW for BCD
 * input n. Inputs 10–15 aren't valid BCD and leave every output HIGH.
 */
export function decoder42(address: Bit[]): Bit[] {
  return decodeActiveLow(true, address).slice(0, 10);
}

/** Highest n whose active-LOW input is LOW, from inputs listed for n = first, first+1, …; else -1. */
function highestLow(inputs: Bit[], first: number): number {
  for (let i = inputs.length - 1; i >= 0; i--) if (inputs[i] === 0) return i + first;
  return -1;
}

/**
 * 74147 decimal-to-BCD priority encoder. Inputs ~I1 … ~I9 (active LOW). Outputs ~A3, ~A2, ~A1,
 * ~A0: the BCD code of the highest LOW input, inverted. No input LOW encodes 0 (all HIGH).
 */
export function encoder147(inputs: Bit[]): Bit[] {
  const n = Math.max(0, highestLow(inputs, 1));
  return [3, 2, 1, 0].map((k) => inv(((n >> k) & 1) as Bit));
}

/**
 * 74148 8-to-3 priority encoder. Inputs ~EI, ~I0 … ~I7. Outputs ~GS, ~A0, ~A1, ~A2, ~EO (the
 * deck's column order). Disabled (~EI HIGH): all HIGH. Enabled with no input LOW: only ~EO LOW.
 * Otherwise the highest LOW input's number, inverted, with ~GS LOW.
 */
export function encoder148([ei, ...inputs]: Bit[]): Bit[] {
  if (ei === 1) return [1, 1, 1, 1, 1];
  const n = highestLow(inputs, 0);
  if (n < 0) return [1, 1, 1, 1, 0];
  return [0, inv((n & 1) as Bit), inv(((n >> 1) & 1) as Bit), inv(((n >> 2) & 1) as Bit), 1];
}

/**
 * 74151 8-to-1 multiplexer. Inputs ~E, S2, S1, S0, I0 … I7. Outputs Y and ~Y. Y is the selected
 * data input while ~E is LOW, and LOW otherwise.
 */
export function mux151([e, s2, s1, s0, ...data]: Bit[]): Bit[] {
  const y: Bit = e === 1 ? 0 : data[binaryValue([s2, s1, s0])];
  return [y, inv(y)];
}

/** One section of the 74157 quad 2-to-1 multiplexer. Inputs ~E, S, I0, I1. Output Y. */
export function mux157([e, s, i0, i1]: Bit[]): Bit[] {
  return [e === 1 ? 0 : s ? i1 : i0];
}

/**
 * 7485 4-bit magnitude comparator. Inputs A3–A0, B3–B0, then the cascading inputs IA>B, IA<B,
 * IA=B. Outputs A>B, A=B, A<B. When A = B, the cascading inputs decide, following the datasheet's
 * function table (including its two odd rows: IA>B and IA<B both HIGH gives all LOW; all three
 * LOW gives A>B and A<B both HIGH).
 */
export function comparator85(inputs: Bit[]): Bit[] {
  const a = binaryValue(inputs.slice(0, 4));
  const b = binaryValue(inputs.slice(4, 8));
  const [gt, lt, eq] = inputs.slice(8);
  if (a > b) return [1, 0, 0];
  if (a < b) return [0, 0, 1];
  if (eq) return [0, 1, 0];
  return [inv(lt), 0, inv(gt)];
}
