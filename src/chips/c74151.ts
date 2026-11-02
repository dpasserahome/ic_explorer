import { binaryValue, mux151, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, LogicNode } from '../sim/types';
import { addressTerms, bitRows, collapsed, gate, patternTable, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the 74HC151 datasheet and the deck (I0–I7, S0–S2, ~E, Y, ~Y); TI's SN74151
// calls them D0–D7, A B C, ~G, Y, W.
const PINS = pinList([
  [1, 'I3', 'input'],
  [2, 'I2', 'input'],
  [3, 'I1', 'input'],
  [4, 'I0', 'input'],
  [5, 'Y', 'output'],
  [6, '~Y', 'output'],
  [7, '~E', 'input'],
  [8, 'GND', 'gnd'],
  [9, 'S2', 'input'],
  [10, 'S1', 'input'],
  [11, 'S0', 'input'],
  [12, 'I7', 'input'],
  [13, 'I6', 'input'],
  [14, 'I5', 'input'],
  [15, 'I4', 'input'],
  [16, 'VCC', 'vcc'],
]);

const SELECT = [9, 10, 11]; // S2 S1 S0
const DATA = [4, 3, 2, 1, 15, 14, 13, 12]; // I0 … I7
const INPUTS = [7, ...SELECT, ...DATA];
const OUTPUTS = [5, 6]; // Y, ~Y

// Datasheet logic diagram: each data input has an AND gate that passes it when the select lines
// equal its number and the chip is enabled; an OR of all eight makes Y. The Logic tab shows one
// input's path and draws the other seven AND gates as one box.
const E: LogicNode = gate('NOT', [pin(7)], 'E');
const term = (n: number): LogicNode => gate('AND', [E, ...addressTerms(SELECT, n), pin(DATA[n])]);
const yFor = (n: number): LogicNode =>
  gate('OR', [
    term(n),
    collapsed(
      'OR',
      DATA.flatMap((_, k) => (k === n ? [] : [term(k)])),
      'rest',
      'rest: other 7',
    ),
  ]);

/** A fixed data word on I0–I7, so stepping the select lines spells it out on Y. */
const WORD: Bit[] = [1, 0, 1, 1, 0, 0, 1, 0];

export const c74151: BlockChipDef = {
  kind: 'block',
  part: '74151',
  title: '8-to-1 line multiplexer',
  subtitle: 'Data selector · 16-pin DIP',
  overview:
    'Routes one of eight data inputs I0–I7 to the output, like a railroad switch; the select inputs ' +
    'S2 S1 S0 choose which. ~Y is the complement of Y. ~E must be LOW, or Y stays LOW.',
  readAs: 'Y equals the data input that S2 S1 S0 select',
  formula: 'Y = In when S2 S1 S0 = n',
  blockLabel: '8-to-1 multiplexer',
  pins: PINS,
  units: [{ label: 'Multiplexer', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: mux151,
  // As on the datasheet, the data inputs aren't columns: the output cells name the one Y follows.
  functionTable: () =>
    patternTable(PINS, INPUTS, [7, ...SELECT], [
      [1, X, X, X],
      ...Array.from({ length: 8 }, (_, n): Cell[] => [0, ...toBits(n, 3)]),
    ]),
  pinInfo: {
    7: 'Enable ~E, active LOW: while HIGH, Y is held LOW.',
    9: 'Select input S2, weight 4 (the MSB).',
    10: 'Select input S1, weight 2.',
    11: 'Select input S0, weight 1 (the LSB).',
    ...Object.fromEntries(
      DATA.map((p, n) => [p, `Data input I${n}: reaches Y when S2 S1 S0 = ${toBits(n, 3).join('')}.`]),
    ),
    5: 'Output Y: the selected data input.',
    6: 'Output ~Y: the complement of Y.',
  },
  status: ([e, s2, s1, s0], [y, yn]) => {
    if (e === 1) return 'Disabled (~E is HIGH), so Y = 0 and ~Y = 1';
    const n = binaryValue([s2, s1, s0]);
    return `S2 S1 S0 = ${s2}${s1}${s0} = ${n}, so Y = I${n} = ${y} and ~Y = ${yn}`;
  },
  timing: () => ({
    inputs: [
      ...bitRows(PINS, [7, ...SELECT]),
      { label: 'I', sub: '7…0', pins: [...DATA].reverse(), format: (bits) => bits.join('') },
    ],
    outputs: bitRows(PINS, OUTPUTS),
  }),
  logic: () => DATA.map((p, n) => ({ tab: `I${n}`, out: 5, node: yFor(n), pin: p })),
  presets: [
    { id: 'select', label: 'Select I0–I7', at: (s) => [0, ...toBits(Math.floor(s / 2) % 8, 3), ...WORD] },
    {
      id: 'watch',
      label: 'Watch I5',
      at: (s) => [s >= 12 && s < 14 ? 1 : 0, 1, 0, 1, ...WORD.map((b, n): Bit => (n === 5 ? (((s >> 1) & 1) as Bit) : b))],
    },
  ],
};
