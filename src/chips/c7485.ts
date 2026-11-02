import { binaryValue, comparator85, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, FunctionRowDef, LogicNode } from '../sim/types';
import { bitRows, collapsed, gate, nameOf, not, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the deck and the SN7485 datasheet: A3–A0, B3–B0, cascading inputs IA>B, IA=B,
// IA<B, outputs A>B, A=B, A<B. (The 74HC85 datasheet prefixes the outputs with Q.)
const PINS = pinList([
  [1, 'B3', 'input'],
  [2, 'IA<B', 'input'],
  [3, 'IA=B', 'input'],
  [4, 'IA>B', 'input'],
  [5, 'A>B', 'output'],
  [6, 'A=B', 'output'],
  [7, 'A<B', 'output'],
  [8, 'GND', 'gnd'],
  [9, 'B0', 'input'],
  [10, 'A0', 'input'],
  [11, 'B1', 'input'],
  [12, 'A1', 'input'],
  [13, 'A2', 'input'],
  [14, 'B2', 'input'],
  [15, 'A3', 'input'],
  [16, 'VCC', 'vcc'],
]);

const A = [10, 12, 13, 15]; // A0 … A3, so A[i] is bit i
const B = [9, 11, 14, 1];
const CASCADE = [4, 2, 3]; // IA>B IA<B IA=B
const INPUTS = [15, 13, 12, 10, 1, 14, 11, 9, ...CASCADE]; // A3–A0, B3–B0, cascade
const OUTPUTS = [5, 6, 7]; // A>B A=B A<B

// Positions in the input bits of Ai and Bi.
const ai = (i: number) => 3 - i;
const bi = (i: number) => 7 - i;
const BITS = [3, 2, 1, 0];

// The datasheet's function table: rows decided by the highest unequal bit pair, then the
// cascading inputs when all four pairs are equal.
const CASCADE_ROWS: Cell[][] = [
  [1, 0, 0],
  [0, 1, 0],
  [X, X, 1],
  [1, 1, 0],
  [0, 0, 0],
];
const sameAbove = (bits: Bit[], i: number) => BITS.every((j) => j <= i || bits[ai(j)] === bits[bi(j)]);
const copyAbove = (out: Bit[], i: number) => BITS.forEach((j) => j > i && (out[bi(j)] = out[ai(j)]));
const ROWS: FunctionRowDef[] = [
  ...BITS.flatMap((i) =>
    (['>', '<'] as const).map((rel) => ({
      cells: [...BITS.map((j) => (j > i ? `A${j}=B${j}` : j === i ? `A${j}${rel}B${j}` : X)), X, X, X],
      match: (bits: Bit[]) =>
        sameAbove(bits, i) && (rel === '>' ? bits[ai(i)] > bits[bi(i)] : bits[ai(i)] < bits[bi(i)]),
      apply: (bits: Bit[]) => {
        const out = [...bits];
        copyAbove(out, i);
        out[ai(i)] = rel === '>' ? 1 : 0;
        out[bi(i)] = rel === '>' ? 0 : 1;
        return out;
      },
    })),
  ),
  ...CASCADE_ROWS.map((pattern) => ({
    cells: [...BITS.map((j) => `A${j}=B${j}`), ...pattern.map(String)],
    match: (bits: Bit[]) => sameAbove(bits, -1) && pattern.every((b, k) => b === X || bits[8 + k] === b),
    apply: (bits: Bit[]) => {
      const out = [...bits];
      copyAbove(out, -1);
      pattern.forEach((b, k) => b !== X && (out[8 + k] = b));
      return out;
    },
  })),
];

// Logic: bit pair i is equal when XNOR(Ai, Bi) is HIGH (the deck's equality comparator). The A>B
// and A<B views draw the 4-bit comparisons as boxes; the A=B view draws every gate.
const eq = (i: number): LogicNode => gate('XNOR', [pin(A[i]), pin(B[i])]);
const greater = (x: number[], y: number[]) =>
  BITS.map((i) => gate('AND', [...BITS.filter((j) => j > i).map(eq), pin(x[i]), not(pin(y[i]))]));
const EQ = () => collapsed('AND', BITS.map(eq), 'EQ', 'EQ: A = B');
const LOGIC: LogicNode[] = [
  gate('OR', [collapsed('OR', greater(A, B), 'GT', 'GT: A > B'), gate('AND', [EQ(), not(pin(3)), not(pin(2))])]),
  gate('AND', [...BITS.map(eq), pin(3)]),
  gate('OR', [collapsed('OR', greater(B, A), 'LT', 'LT: A < B'), gate('AND', [EQ(), not(pin(3)), not(pin(4))])]),
];

const CASCADE_STEPS: Bit[][] = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [0, 0, 0],
];

export const c7485: BlockChipDef = {
  kind: 'block',
  part: '7485',
  title: '4-bit magnitude comparator',
  subtitle: 'Cascadable · 16-pin DIP',
  overview:
    'Compares two 4-bit numbers; one of A>B, A=B or A<B goes HIGH. If A = B, the cascading ' +
    'inputs decide, so chips chain. Alone, tie IA=B HIGH.',
  readAs: 'A equals B when every bit pair is equal',
  formula: 'A=B = (A3 ⊕ B3)′ · … · (A0 ⊕ B0)′',
  blockLabel: '4-bit comparator',
  pins: PINS,
  units: [{ label: 'Comparator', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: comparator85,
  functionTable: () => ({ columns: ['A3, B3', 'A2, B2', 'A1, B1', 'A0, B0', 'IA>B', 'IA<B', 'IA=B'], rows: ROWS }),
  pinInfo: {
    ...Object.fromEntries(BITS.map((i) => [A[i], `Bit A${i} of number A, weight ${1 << i}.`])),
    ...Object.fromEntries(BITS.map((i) => [B[i], `Bit B${i} of number B, weight ${1 << i}.`])),
    4: 'Cascading input IA>B: from the A>B output of the next-lower chip. Only used when A = B.',
    2: 'Cascading input IA<B: from the A<B output of the next-lower chip. Only used when A = B.',
    3: 'Cascading input IA=B: from the A=B output of the next-lower chip; tie HIGH on a single chip.',
    5: 'Output A>B: HIGH when A is greater than B.',
    6: 'Output A=B: HIGH when A equals B (and IA=B is HIGH).',
    7: 'Output A<B: HIGH when A is less than B.',
  },
  status: (inputs, outs) => {
    const a = binaryValue(inputs.slice(0, 4));
    const b = binaryValue(inputs.slice(4, 8));
    const ab = `A = ${inputs.slice(0, 4).join('')} (${a}), B = ${inputs.slice(4, 8).join('')} (${b})`;
    if (a > b) return `${ab}: A > B, so A>B is HIGH`;
    if (a < b) return `${ab}: A < B, so A<B is HIGH`;
    const high = OUTPUTS.filter((_, k) => outs[k] === 1).map((p) => nameOf(PINS, p));
    const result =
      high.length === 0 ? 'all outputs are LOW' : high.length === 1 ? `${high[0]} is HIGH` : `${high.join(' and ')} are both HIGH`;
    return `A = B = ${a}, so the cascading inputs decide: ${result}`;
  },
  timing: () => ({
    inputs: [
      { label: 'A', sub: 'A3–A0', pins: [15, 13, 12, 10], format: (bits) => String(binaryValue(bits)) },
      { label: 'B', sub: 'B3–B0', pins: [1, 14, 11, 9], format: (bits) => String(binaryValue(bits)) },
      ...bitRows(PINS, CASCADE),
    ],
    outputs: [
      {
        label: 'Out',
        sub: 'HIGH',
        pins: OUTPUTS,
        format: (bits) => OUTPUTS.filter((_, k) => bits[k] === 1).map((p) => nameOf(PINS, p)).join(' ') || 'none',
      },
    ],
  }),
  logic: () => OUTPUTS.map((out, k) => ({ tab: nameOf(PINS, out), out, node: LOGIC[k] })),
  presets: [
    { id: 'sweep', label: 'A counts, B = 5', at: (s) => [...toBits(s, 4), ...toBits(5, 4), 0, 0, 1] },
    {
      id: 'cascade',
      label: 'A = B, cascade',
      at: (s) => [...toBits(9, 4), ...toBits(9, 4), ...CASCADE_STEPS[Math.floor(s / 3) % 5]],
    },
  ],
};
