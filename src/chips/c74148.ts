import { encoder148, toBits } from '../sim/msi';
import type { Bit, BlockChipDef, LogicNode } from '../sim/types';
import { bitRows, gate, lowInputBus, nameOf, not, patternTable, pin, pinList, X, type Cell } from './blocks';

// Pin names follow the 74HC148 datasheet and the deck (~I0–~I7, ~EI, ~A0–~A2, ~GS, ~EO).
const PINS = pinList([
  [1, '~I4', 'input'],
  [2, '~I5', 'input'],
  [3, '~I6', 'input'],
  [4, '~I7', 'input'],
  [5, '~EI', 'input'],
  [6, '~A2', 'output'],
  [7, '~A1', 'output'],
  [8, 'GND', 'gnd'],
  [9, '~A0', 'output'],
  [10, '~I0', 'input'],
  [11, '~I1', 'input'],
  [12, '~I2', 'input'],
  [13, '~I3', 'input'],
  [14, '~GS', 'output'],
  [15, '~EO', 'output'],
  [16, 'VCC', 'vcc'],
]);

const DATA = [10, 11, 12, 13, 1, 2, 3, 4]; // ~I0 … ~I7
const INPUTS = [5, ...DATA]; // ~EI, then ~I0 … ~I7
const OUTPUTS = [14, 9, 7, 6, 15]; // ~GS ~A0 ~A1 ~A2 ~EO (the deck's column order)

// Datasheet logic, with E = ~EI inverted and each input active (inverted) or idle (straight).
const E: LogicNode = gate('NOT', [pin(5)], 'E');
const on = (n: number): LogicNode => not(pin(DATA[n]));
const off = (n: number): LogicNode => pin(DATA[n]);
const LOGIC: LogicNode[] = [
  // ~GS: LOW when enabled and any input is LOW (a NAND of the active-LOW inputs is HIGH then).
  gate('NAND', [E, gate('NAND', DATA.map(pin))]),
  // ~A0 (weight 1): the highest active input is odd.
  gate('NAND', [
    E,
    gate('OR', [
      on(7),
      gate('AND', [on(5), off(6)]),
      gate('AND', [on(3), off(4), off(6)]),
      gate('AND', [on(1), off(2), off(4), off(6)]),
    ]),
  ]),
  // ~A1 (weight 2): input 6 or 7, or 2 or 3 with 4 and 5 idle.
  gate('NAND', [E, gate('OR', [on(7), on(6), gate('AND', [gate('OR', [on(3), on(2)]), off(4), off(5)])])]),
  // ~A2 (weight 4): any of inputs 4–7.
  gate('NAND', [E, gate('OR', [on(4), on(5), on(6), on(7)])]),
  // ~EO: LOW when enabled and every input is idle, to enable the next (lower-priority) encoder.
  gate('NAND', [E, gate('AND', DATA.map(pin))]),
];

/** Enabled, with the listed inputs LOW. */
const pressed = (...keys: number[]): Bit[] => [0, ...DATA.map((_, n): Bit => (keys.includes(n) ? 0 : 1))];

const highest = (data: Bit[]) => {
  for (let n = 7; n >= 0; n--) if (data[n] === 0) return n;
  return -1;
};

export const c74148: BlockChipDef = {
  kind: 'block',
  part: '74148',
  title: '8-to-3 line priority encoder',
  subtitle: 'Octal-to-binary · 16-pin DIP',
  overview:
    'Eight active-LOW inputs become a 3-bit number on active-LOW outputs; the highest LOW input wins. ' +
    '~EI enables it, ~GS flags any input LOW, ~EO enables a lower-priority chip.',
  readAs: 'Outputs give n′ for the highest LOW input ~In',
  formula: '~A2 ~A1 ~A0 = n′',
  blockLabel: 'Priority encoder',
  pins: PINS,
  units: [{ label: 'Encoder', inputs: INPUTS, outputs: OUTPUTS }],
  evaluate: encoder148,
  // The deck's rows: disabled, no input, then ~I7 down to ~I0 as the highest LOW input.
  functionTable: () =>
    patternTable(PINS, INPUTS, INPUTS, [
      [1, ...DATA.map((): Cell => X)],
      [0, ...DATA.map((): Cell => 1)],
      ...[7, 6, 5, 4, 3, 2, 1, 0].map((n): Cell[] => [0, ...DATA.map((_, i): Cell => (i < n ? X : i === n ? 0 : 1))]),
    ]),
  pinInfo: {
    5: 'Enable input ~EI, active LOW: while HIGH, every output is HIGH.',
    ...Object.fromEntries(DATA.map((p, n) => [p, `Input ~I${n}, active LOW. Higher inputs take priority.`])),
    14: 'Group select ~GS, active LOW: LOW when enabled and any input is LOW.',
    9: 'Output ~A0: bit 0 (weight 1) of the highest LOW input’s number, inverted.',
    7: 'Output ~A1: bit 1 (weight 2) of the highest LOW input’s number, inverted.',
    6: 'Output ~A2: bit 2 (weight 4) of the highest LOW input’s number, inverted.',
    15: 'Enable output ~EO, active LOW: LOW when enabled with no input LOW. Feeds ~EI of the next encoder.',
  },
  status: ([ei, ...data], outs) => {
    if (ei === 1) return 'Disabled (~EI is HIGH), so all outputs are HIGH';
    const n = highest(data);
    if (n < 0) return 'Enabled, but no input is LOW: ~GS is HIGH and ~EO is LOW';
    const [, a0, a1, a2] = outs;
    return `~I${n} is the highest LOW input, so ~A2 ~A1 ~A0 = ${a2}${a1}${a0} (${n} = ${toBits(n, 3).join('')}, inverted); ~GS is LOW`;
  },
  timing: () => ({
    inputs: [...bitRows(PINS, [5]), lowInputBus(PINS, DATA, '~I', 'LOW')],
    outputs: bitRows(PINS, [6, 7, 9, 14, 15]),
  }),
  logic: () => OUTPUTS.map((out, k) => ({ tab: nameOf(PINS, out), out, node: LOGIC[k] })),
  presets: [
    { id: 'one', label: 'One input at a time', at: (s) => pressed((s % 9) - 1) },
    { id: 'priority', label: 'Priority', at: (s) => pressed(2, (s % 9) - 1) },
  ],
};
