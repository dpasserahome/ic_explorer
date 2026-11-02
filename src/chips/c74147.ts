import { binaryValue, encoder147, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, LogicNode } from '../sim/types';
import { bitRows, gate, lowInputBus, not, patternTable, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the deck (~I1–~I9, ~A0–~A3); TI's SN74147 calls the outputs ~A ~B ~C ~D.
// Pin 15 is not connected.
const PINS = pinList([
  [1, '~I4', 'input'],
  [2, '~I5', 'input'],
  [3, '~I6', 'input'],
  [4, '~I7', 'input'],
  [5, '~I8', 'input'],
  [6, '~A2', 'output'],
  [7, '~A1', 'output'],
  [8, 'GND', 'gnd'],
  [9, '~A0', 'output'],
  [10, '~I9', 'input'],
  [11, '~I1', 'input'],
  [12, '~I2', 'input'],
  [13, '~I3', 'input'],
  [14, '~A3', 'output'],
  [15, 'NC', 'nc'],
  [16, 'VCC', 'vcc'],
]);

const INPUTS = [11, 12, 13, 1, 2, 3, 4, 5, 10]; // ~I1 … ~I9
const OUTPUTS = [14, 6, 7, 9]; // ~A3 ~A2 ~A1 ~A0
const I = (n: number) => INPUTS[n - 1];

// Priority logic, written with each input active (LOW pulled through an inverter) or idle (HIGH,
// straight from the pin). Each output is LOW when its BCD bit of the highest active input is 1.
const on = (n: number): LogicNode => not(pin(I(n)));
const off = (n: number): LogicNode => pin(I(n));
const LOGIC: LogicNode[] = [
  // ~A3 (weight 8): input 8 or 9.
  gate('NOR', [on(8), on(9)]),
  // ~A2 (weight 4): input 4–7, and not 8 or 9.
  gate('NAND', [gate('OR', [on(4), on(5), on(6), on(7)]), off(8), off(9)]),
  // ~A1 (weight 2): input 6 or 7, or 2 or 3 with 4 and 5 idle; and not 8 or 9.
  gate('NAND', [gate('OR', [on(7), on(6), gate('AND', [gate('OR', [on(2), on(3)]), off(4), off(5)])]), off(8), off(9)]),
  // ~A0 (weight 1): the highest active input is odd.
  gate('NOR', [
    on(9),
    gate('AND', [on(7), off(8)]),
    gate('AND', [on(5), off(6), off(8)]),
    gate('AND', [on(3), off(4), off(6), off(8)]),
    gate('AND', [on(1), off(2), off(4), off(6), off(8)]),
  ]),
];

/** Inputs with the listed numbers LOW (active), the rest HIGH. */
const pressed = (...keys: number[]): Bit[] => INPUTS.map((_, i) => (keys.includes(i + 1) ? 0 : 1));

const highest = (inputs: Bit[]) => {
  for (let n = 9; n >= 1; n--) if (inputs[n - 1] === 0) return n;
  return 0;
};

export const c74147: BlockChipDef = {
  kind: 'block',
  part: '74147',
  title: '10-to-4 line priority encoder',
  subtitle: 'Decimal-to-BCD · 16-pin DIP',
  overview:
    'Encodes a keypad: nine active-LOW inputs become a BCD digit on active-LOW outputs. The highest ' +
    'LOW input wins; with none LOW the outputs encode 0.',
  readAs: 'Outputs give n′ for the highest LOW input ~In',
  formula: '~A3 ~A2 ~A1 ~A0 = n′',
  blockLabel: 'Priority encoder',
  pins: PINS,
  units: [{ label: 'Encoder', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: encoder147,
  // The deck's row order: no input, then ~I9 down to ~I1 as the highest LOW input.
  functionTable: () =>
    patternTable(PINS, INPUTS, INPUTS, [
      INPUTS.map(() => 1),
      ...[9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => INPUTS.map((_, i): Cell => (i + 1 < n ? X : i + 1 === n ? 0 : 1))),
    ]),
  pinInfo: {
    ...Object.fromEntries(
      INPUTS.map((p, i) => [p, `Input ~I${i + 1}, active LOW: pull it LOW to enter ${i + 1}. Higher inputs take priority.`]),
    ),
    14: 'Output ~A3: bit 3 (weight 8) of the code, inverted.',
    6: 'Output ~A2: bit 2 (weight 4) of the code, inverted.',
    7: 'Output ~A1: bit 1 (weight 2) of the code, inverted.',
    9: 'Output ~A0: bit 0 (weight 1) of the code, inverted.',
  },
  status: (inputs, outs) => {
    const n = highest(inputs);
    if (n === 0) return 'No input is LOW, so the outputs are 1111 (0 = 0000, inverted)';
    return `~I${n} is the highest LOW input, so ~A3 ~A2 ~A1 ~A0 = ${outs.join('')} (${n} = ${toBits(n, 4).join('')}, inverted)`;
  },
  timing: () => ({
    inputs: [lowInputBus(PINS, INPUTS, '~I', 'LOW')],
    outputs: [
      ...bitRows(PINS, OUTPUTS),
      { label: 'n', sub: 'code', pins: OUTPUTS, format: (bits) => String(binaryValue(bits.map((b) => (1 - b) as Bit))) },
    ],
  }),
  logic: () => OUTPUTS.map((out, k) => ({ tab: PINS.find((p) => p.num === out)!.name, out, node: LOGIC[k] })),
  presets: [
    { id: 'one', label: 'One key at a time', at: (s) => pressed(s % 10) },
    { id: 'priority', label: 'Priority', at: (s) => pressed(3, s % 10) },
  ],
};
