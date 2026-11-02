import { binaryValue, decoder138, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, PinDef } from '../sim/types';

// Pin names follow the 74HC138 datasheet (A0–A2, ~E1 ~E2 E3, ~Y0–~Y7), as the deck does.
const PINS: PinDef[] = [
  { num: 1, name: 'A0', role: 'input' },
  { num: 2, name: 'A1', role: 'input' },
  { num: 3, name: 'A2', role: 'input' },
  { num: 4, name: '~E1', role: 'input' },
  { num: 5, name: '~E2', role: 'input' },
  { num: 6, name: 'E3', role: 'input' },
  { num: 7, name: '~Y7', role: 'output' },
  { num: 8, name: 'GND', role: 'gnd' },
  { num: 9, name: '~Y6', role: 'output' },
  { num: 10, name: '~Y5', role: 'output' },
  { num: 11, name: '~Y4', role: 'output' },
  { num: 12, name: '~Y3', role: 'output' },
  { num: 13, name: '~Y2', role: 'output' },
  { num: 14, name: '~Y1', role: 'output' },
  { num: 15, name: '~Y0', role: 'output' },
  { num: 16, name: 'VCC', role: 'vcc' },
];

// ~Y0 … ~Y7
const OUTPUTS = [15, 14, 13, 12, 11, 10, 9, 7];
const X = 'X' as const;

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
  inputs: [4, 5, 6, 3, 2, 1],
  outputs: OUTPUTS,
  evaluate: decoder138,
  functionRows: [
    [1, X, X, X, X, X],
    [X, 1, X, X, X, X],
    [X, X, 0, X, X, X],
    ...Array.from({ length: 8 }, (_, n): (Bit | 'X')[] => [0, 0, 1, ...toBits(n, 3)]),
  ],
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
    const low = outs.indexOf(0);
    return `Enabled. A2 A1 A0 = ${a2}${a1}${a0} = ${n}, so ~Y${low} (pin ${OUTPUTS[low]}) is LOW`;
  },
  outputBus: {
    label: '~Y',
    sub: 'LOW',
    format: (outs) => {
      const low = outs.indexOf(0);
      return low < 0 ? 'none' : `~Y${low}`;
    },
  },
  presets: [
    { id: 'count', label: 'Count 0–7', at: (s) => counting(s) },
    { id: 'enable', label: 'Enable off', at: (s) => counting(s, s >= 6 && s < 10 ? 0 : 1) },
  ],
};
