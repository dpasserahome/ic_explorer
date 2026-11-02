import { binaryValue, decoder42, toBits } from '../sim/msi';
import type { BlockChipDef } from '../sim/types';
import { addressTerms, bitRows, gate, lowOutputBus, nameOf, patternTable, pinList } from './blocks';

// Pin names follow the 74HC42 datasheet (A0–A3, ~Y0–~Y9), as the deck does.
const PINS = pinList([
  [1, '~Y0', 'output'],
  [2, '~Y1', 'output'],
  [3, '~Y2', 'output'],
  [4, '~Y3', 'output'],
  [5, '~Y4', 'output'],
  [6, '~Y5', 'output'],
  [7, '~Y6', 'output'],
  [8, 'GND', 'gnd'],
  [9, '~Y7', 'output'],
  [10, '~Y8', 'output'],
  [11, '~Y9', 'output'],
  [12, 'A3', 'input'],
  [13, 'A2', 'input'],
  [14, 'A1', 'input'],
  [15, 'A0', 'input'],
  [16, 'VCC', 'vcc'],
]);

const INPUTS = [12, 13, 14, 15]; // A3 A2 A1 A0
const OUTPUTS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11]; // ~Y0 … ~Y9

export const c7442: BlockChipDef = {
  kind: 'block',
  part: '7442',
  title: 'BCD-to-decimal decoder',
  subtitle: '1-of-10 decoder · 16-pin DIP',
  overview:
    'Also called a 1-of-10 decoder. A 4-bit BCD digit picks one of ten outputs and drives it LOW. ' +
    'Codes 10–15 aren’t valid BCD, so every output stays HIGH. There are no enable inputs.',
  readAs: 'Output n goes LOW when the BCD input equals n',
  formula: '~Yn = 0 when A3 A2 A1 A0 = n',
  blockLabel: 'BCD-to-decimal',
  pins: PINS,
  units: [{ label: 'Decoder', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: decoder42,
  functionTable: () => patternTable(PINS, INPUTS, INPUTS, Array.from({ length: 16 }, (_, n) => toBits(n, 4))),
  pinInfo: {
    12: 'BCD input A3, weight 8 (the MSB).',
    13: 'BCD input A2, weight 4.',
    14: 'BCD input A1, weight 2.',
    15: 'BCD input A0, weight 1 (the LSB).',
    ...Object.fromEntries(OUTPUTS.map((p, n) => [p, `Output ~Y${n}, active LOW: LOW only when the BCD input is ${n}.`])),
  },
  status: (address) => {
    const n = binaryValue(address);
    const bits = address.join('');
    if (n > 9) return `A3 A2 A1 A0 = ${bits} = ${n}, not a BCD digit, so all outputs are HIGH`;
    return `A3 A2 A1 A0 = ${bits} = ${n}, so ~Y${n} (pin ${OUTPUTS[n]}) is LOW`;
  },
  timing: () => ({ inputs: bitRows(PINS, INPUTS), outputs: [lowOutputBus(PINS, OUTPUTS, '~Y')] }),
  // Datasheet logic diagram: each output is a 4-input NAND of the inputs, true or inverted.
  logic: () =>
    OUTPUTS.map((out, n) => ({ tab: nameOf(PINS, out), out, node: gate('NAND', addressTerms(INPUTS, n)) })),
  presets: [
    { id: 'bcd', label: 'Count 0–9', at: (s) => toBits(s % 10, 4) },
    { id: 'all', label: 'Count 0–15', at: (s) => toBits(s, 4) },
  ],
};
