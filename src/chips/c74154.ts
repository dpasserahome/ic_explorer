import { binaryValue, decoder154, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, LogicNode, PinDef } from '../sim/types';
import { addressTerms, bitRows, gate, lowOutputBus, nameOf, not, patternTable, pin, pinList, X, type Cell } from './blocks';

// ~Y0 … ~Y15 on pins 1–11 and 13–17 (GND is pin 12).
const OUTPUTS = Array.from({ length: 16 }, (_, n) => (n <= 10 ? n + 1 : n + 2));

// Pin names follow the 74HC154 datasheet (A0–A3, ~E0 ~E1, ~Y0–~Y15), as the deck's pinout does.
const PINS: PinDef[] = pinList([
  ...OUTPUTS.map((p, n): [number, string, 'output'] => [p, `~Y${n}`, 'output']),
  [12, 'GND', 'gnd'],
  [18, '~E0', 'input'],
  [19, '~E1', 'input'],
  [20, 'A3', 'input'],
  [21, 'A2', 'input'],
  [22, 'A1', 'input'],
  [23, 'A0', 'input'],
  [24, 'VCC', 'vcc'],
]);

const INPUTS = [18, 19, 20, 21, 22, 23]; // ~E0 ~E1 A3 A2 A1 A0

// Datasheet logic diagram: both enables LOW make E; each output is a 5-input NAND of E and the
// address lines, true or inverted to match its number.
const ENABLE: LogicNode = gate('AND', [not(pin(18)), not(pin(19))], 'E');

/** Enables LOW while the address counts 0–15, one step each. */
const counting = (s: number, e1: Bit = 0): Bit[] => [0, e1, ...toBits(s % 16, 4)];

export const c74154: BlockChipDef = {
  kind: 'block',
  part: '74154',
  title: '4-to-16 line decoder',
  subtitle: '1-of-16 decoder · 24-pin DIP',
  overview:
    'Also called a hexadecimal or 1-of-16 decoder. The 4-bit address picks one of sixteen outputs and ' +
    'drives it LOW. Both enables must be LOW; with data on an enable it works as a 1-to-16 demultiplexer.',
  readAs: 'Output n goes LOW when the address equals n',
  formula: '~Yn = 0 when A3 A2 A1 A0 = n',
  blockLabel: '4-to-16 decoder',
  pins: PINS,
  units: [{ label: 'Decoder', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: decoder154,
  functionTable: () =>
    patternTable(PINS, INPUTS, INPUTS, [
      [0, 1, X, X, X, X],
      [1, 0, X, X, X, X],
      [1, 1, X, X, X, X],
      ...Array.from({ length: 16 }, (_, n): Cell[] => [0, 0, ...toBits(n, 4)]),
    ]),
  pinInfo: {
    18: 'Enable ~E0, active LOW: must be LOW for the decoder to work.',
    19: 'Enable ~E1, active LOW: must be LOW for the decoder to work.',
    20: 'Address bit A3, weight 8 (the MSB).',
    21: 'Address bit A2, weight 4.',
    22: 'Address bit A1, weight 2.',
    23: 'Address bit A0, weight 1 (the LSB).',
    ...Object.fromEntries(
      OUTPUTS.map((p, n) => [p, `Output ~Y${n}, active LOW: LOW only when enabled and the address is ${n}.`]),
    ),
  },
  status: ([e0, e1, ...address]) => {
    const off = [e0 === 1 && '~E0 is HIGH', e1 === 1 && '~E1 is HIGH'].filter(Boolean);
    if (off.length) return `Disabled (${off.join(', ')}), so all outputs are HIGH`;
    const n = binaryValue(address);
    return `Enabled. A3 A2 A1 A0 = ${address.join('')} = ${n}, so ~Y${n} (pin ${OUTPUTS[n]}) is LOW`;
  },
  timing: () => ({ inputs: bitRows(PINS, INPUTS), outputs: [lowOutputBus(PINS, OUTPUTS, '~Y')] }),
  logic: () =>
    OUTPUTS.map((out, n) => ({
      tab: nameOf(PINS, out),
      out,
      node: gate('NAND', [ENABLE, ...addressTerms([20, 21, 22, 23], n)]),
    })),
  presets: [
    { id: 'count', label: 'Count 0–15', at: (s) => counting(s) },
    { id: 'enable', label: 'Enable off', at: (s) => counting(s, s >= 6 && s < 10 ? 1 : 0) },
  ],
};
