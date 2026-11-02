import { binaryValue, decoder138, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, LogicNode } from '../sim/types';
import { addressTerms, bitRows, gate, lowOutputBus, nameOf, not, patternTable, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the 74HC138 datasheet (A0–A2, ~E1 ~E2 E3, ~Y0–~Y7), as the deck does.
const PINS = pinList([
  [1, 'A0', 'input'],
  [2, 'A1', 'input'],
  [3, 'A2', 'input'],
  [4, '~E1', 'input'],
  [5, '~E2', 'input'],
  [6, 'E3', 'input'],
  [7, '~Y7', 'output'],
  [8, 'GND', 'gnd'],
  [9, '~Y6', 'output'],
  [10, '~Y5', 'output'],
  [11, '~Y4', 'output'],
  [12, '~Y3', 'output'],
  [13, '~Y2', 'output'],
  [14, '~Y1', 'output'],
  [15, '~Y0', 'output'],
  [16, 'VCC', 'vcc'],
]);

const INPUTS = [4, 5, 6, 3, 2, 1]; // ~E1 ~E2 E3 A2 A1 A0
const OUTPUTS = [15, 14, 13, 12, 11, 10, 9, 7]; // ~Y0 … ~Y7

// Datasheet logic diagram: the enables meet in one AND gate (E), and each output is a 4-input NAND
// of E and the address lines, each taken true or inverted to match that output's number.
const ENABLE: LogicNode = gate('AND', [not(pin(4)), not(pin(5)), pin(6)], 'E');

/** Enables held active (~E1, ~E2 LOW; E3 HIGH) while the address counts 0–7, two steps each. */
const counting = (s: number, e3: Bit = 1): Bit[] => [0, 0, e3, ...toBits(Math.floor(s / 2) % 8, 3)];

export const c74138: BlockChipDef = {
  kind: 'block',
  part: '74138',
  title: '3-to-8 line decoder',
  subtitle: '1-of-8 decoder · 16-pin DIP',
  overview:
    'Also called a 1-of-8 or octal decoder. The 3-bit address A2 A1 A0 picks one of eight outputs and ' +
    'drives it LOW; the rest stay HIGH. If any enable is inactive, all eight outputs stay HIGH.',
  readAs: 'Output n goes LOW when the address equals n',
  formula: '~Yn = 0 when A2 A1 A0 = n',
  blockLabel: '3-to-8 decoder',
  pins: PINS,
  units: [{ label: 'Decoder', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: decoder138,
  functionTable: () =>
    patternTable(PINS, INPUTS, INPUTS, [
      [1, X, X, X, X, X],
      [X, 1, X, X, X, X],
      [X, X, 0, X, X, X],
      ...Array.from({ length: 8 }, (_, n): Cell[] => [0, 0, 1, ...toBits(n, 3)]),
    ]),
  pinInfo: {
    1: 'Address bit A0, weight 1 (the LSB).',
    2: 'Address bit A1, weight 2.',
    3: 'Address bit A2, weight 4 (the MSB).',
    4: 'Enable ~E1, active LOW: must be LOW for the decoder to work.',
    5: 'Enable ~E2, active LOW: must be LOW for the decoder to work.',
    6: 'Enable E3, active HIGH: must be HIGH for the decoder to work.',
    ...Object.fromEntries(
      OUTPUTS.map((p, n) => [p, `Output ~Y${n}, active LOW: LOW only when enabled and the address is ${n}.`]),
    ),
  },
  status: ([e1, e2, e3, a2, a1, a0], outs) => {
    const off = [e1 === 1 && '~E1 is HIGH', e2 === 1 && '~E2 is HIGH', e3 === 0 && 'E3 is LOW'].filter(Boolean);
    if (off.length) return `Disabled (${off.join(', ')}), so all outputs are HIGH`;
    const n = binaryValue([a2, a1, a0]);
    return `Enabled. A2 A1 A0 = ${a2}${a1}${a0} = ${n}, so ~Y${n} (pin ${OUTPUTS[outs.indexOf(0)]}) is LOW`;
  },
  timing: () => ({ inputs: bitRows(PINS, INPUTS), outputs: [lowOutputBus(PINS, OUTPUTS, '~Y')] }),
  logic: () =>
    OUTPUTS.map((out, n) => ({
      tab: nameOf(PINS, out),
      out,
      node: gate('NAND', [ENABLE, ...addressTerms([3, 2, 1], n)]),
    })),
  presets: [
    { id: 'count', label: 'Count 0–7', at: (s) => counting(s) },
    { id: 'enable', label: 'Enable off', at: (s) => counting(s, s >= 6 && s < 10 ? 0 : 1) },
  ],
};
