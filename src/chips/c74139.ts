import { binaryValue, decoder139, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, BlockUnit } from '../sim/types';
import { addressTerms, bitRows, gate, lowOutputBus, nameOf, not, patternTable, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the 74HC139 datasheet (n~E, nA0, nA1, n~Y0–n~Y3); the deck writes the same
// signals as ~Ea, A0a, 0a and so on.
const PINS = pinList([
  [1, '1~E', 'input'],
  [2, '1A0', 'input'],
  [3, '1A1', 'input'],
  [4, '1~Y0', 'output'],
  [5, '1~Y1', 'output'],
  [6, '1~Y2', 'output'],
  [7, '1~Y3', 'output'],
  [8, 'GND', 'gnd'],
  [9, '2~Y3', 'output'],
  [10, '2~Y2', 'output'],
  [11, '2~Y1', 'output'],
  [12, '2~Y0', 'output'],
  [13, '2A1', 'input'],
  [14, '2A0', 'input'],
  [15, '2~E', 'input'],
  [16, 'VCC', 'vcc'],
]);

// Each decoder: inputs ~E, A1, A0; outputs ~Y0 … ~Y3.
const UNITS: BlockUnit[] = [
  { label: 'Decoder 1', inputs: [1, 3, 2], outputs: [4, 5, 6, 7] },
  { label: 'Decoder 2', inputs: [15, 13, 14], outputs: [12, 11, 10, 9] },
];

/** Enable held LOW while the address counts 0–3, two steps each. */
const counting = (s: number, e: Bit = 0): Bit[] => [e, ...toBits(Math.floor(s / 2) % 4, 2)];

export const c74139: BlockChipDef = {
  kind: 'block',
  part: '74139',
  title: 'Dual 2-to-4 line decoder',
  subtitle: 'Decoder / demultiplexer · 16-pin DIP',
  overview:
    'Two independent 1-of-4 decoders, each with its own address A1 A0 and active-LOW enable ~E. ' +
    'As a demultiplexer, data on ~E is routed to whichever output the address selects.',
  readAs: 'Output k goes LOW when the address equals k',
  formula: 'n~Yk = 0 when nA1 nA0 = k',
  blockLabel: 'Dual 2-to-4 decoder',
  pins: PINS,
  units: UNITS,
  evaluate: decoder139,
  functionTable: (u) =>
    patternTable(PINS, UNITS[u].inputs, UNITS[u].inputs, [
      [1, X, X],
      ...Array.from({ length: 4 }, (_, n): Cell[] => [0, ...toBits(n, 2)]),
    ]),
  pinInfo: Object.fromEntries(
    UNITS.flatMap((u, d) => [
      [u.inputs[0], `Enable for decoder ${d + 1}, active LOW: must be LOW for it to work. As a demultiplexer, this is the data input.`],
      [u.inputs[1], `Address bit A1 of decoder ${d + 1}, weight 2.`],
      [u.inputs[2], `Address bit A0 of decoder ${d + 1}, weight 1.`],
      ...u.outputs.map((p, k) => [
        p,
        `Output ${k} of decoder ${d + 1}, active LOW: LOW only when that decoder is enabled and its address is ${k}.`,
      ]),
    ]),
  ),
  status: ([e, a1, a0], _outs, u) => {
    const d = u + 1;
    if (e === 1) return `Disabled (${d}~E is HIGH), so all of decoder ${d}’s outputs are HIGH`;
    const n = binaryValue([a1, a0]);
    const out = UNITS[u].outputs[n];
    return `Enabled. ${d}A1 ${d}A0 = ${a1}${a0} = ${n}, so ${nameOf(PINS, out)} (pin ${out}) is LOW`;
  },
  timing: (u) => ({
    inputs: bitRows(PINS, UNITS[u].inputs),
    outputs: [lowOutputBus(PINS, UNITS[u].outputs, `${u + 1}~Y`)],
  }),
  logic: (u) => {
    const [e, a1, a0] = UNITS[u].inputs;
    return UNITS[u].outputs.map((out, n) => ({
      tab: nameOf(PINS, out),
      out,
      node: gate('NAND', [not(pin(e)), ...addressTerms([a1, a0], n)]),
    }));
  },
  presets: [
    { id: 'count', label: 'Count 0–3', at: (s) => counting(s) },
    { id: 'enable', label: 'Enable off', at: (s) => counting(s, s >= 6 && s < 10 ? 1 : 0) },
  ],
};
