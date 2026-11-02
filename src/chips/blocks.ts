import type { Bit, FunctionTableDef, GateKind, LogicNode, PinDef, PinRole, TimingRowDef } from '../sim/types';

// Building blocks for MSI chip definitions (see c74138.ts for a complete example).

export const X = 'X' as const;
export type Cell = Bit | typeof X;

/** Pins from [num, name, role] triples, sorted by number. */
export const pinList = (list: [number, string, PinRole][]): PinDef[] =>
  list.map(([num, name, role]) => ({ num, name, role })).sort((p, q) => p.num - q.num);

export const nameOf = (pins: PinDef[], num: number) => pins.find((p) => p.num === num)!.name;

/**
 * A function table from bit patterns ('X' = don't care), one per row, over `columns` (pins). Inputs
 * of the unit that aren't columns are don't-care in every row (the 74151's data inputs).
 */
export function patternTable(pins: PinDef[], unitInputs: number[], columns: number[], patterns: Cell[][]): FunctionTableDef {
  const idx = columns.map((p) => unitInputs.indexOf(p));
  return {
    columns: columns.map((p) => nameOf(pins, p)),
    rows: patterns.map((pattern) => ({
      cells: pattern.map(String),
      match: (bits) => pattern.every((b, j) => b === X || bits[idx[j]] === b),
      apply: (bits) => {
        const out = [...bits];
        pattern.forEach((b, j) => b !== X && (out[idx[j]] = b));
        return out;
      },
    })),
  };
}

// Gate-level paths for the Logic tab.
export const pin = (num: number): LogicNode => ({ pin: num });
export const not = (n: LogicNode): LogicNode => ({ kind: 'NOT', inputs: [n] });
export const gate = (kind: GateKind, inputs: LogicNode[], label?: string): LogicNode => ({ kind, inputs, label });
/** A sub-path drawn as one box: `label` in equations, `caption` in the box. */
export const collapsed = (kind: GateKind, inputs: LogicNode[], label: string, caption: string): LogicNode => ({
  kind,
  inputs,
  label,
  collapsed: caption,
});

/** Address lines (MSB first), each true or inverted so that the AND of them is HIGH only for n. */
export const addressTerms = (address: number[], n: number): LogicNode[] =>
  address.map((p, i) => ((n >> (address.length - 1 - i)) & 1 ? pin(p) : not(pin(p))));

/** One timing row per pin, labelled with the pin's name. */
export const bitRows = (pins: PinDef[], nums: number[]): TimingRowDef[] =>
  nums.map((p) => ({ label: nameOf(pins, p), sub: `pin ${p}`, pins: [p] }));

/** A bus row over active-LOW outputs, labelled with whichever output is LOW. */
export const lowOutputBus = (pins: PinDef[], outputs: number[], label: string): TimingRowDef => ({
  label,
  sub: 'LOW',
  pins: outputs,
  format: (bits) => {
    const low = outputs.filter((_, k) => bits[k] === 0).map((p) => nameOf(pins, p));
    return low.length ? low.join(' ') : 'none';
  },
});

/** A bus row over active-LOW inputs, labelled with whichever inputs are LOW. */
export const lowInputBus = (pins: PinDef[], inputs: number[], label: string, sub: string): TimingRowDef => ({
  label,
  sub,
  pins: inputs,
  format: (bits) => {
    const low = inputs.filter((_, k) => bits[k] === 0).map((p) => nameOf(pins, p).replace(/^~I/, ''));
    return low.length ? low.join(' ') : 'none';
  },
});

/** Number of the pin with this name. */
export const pinOf = (pins: PinDef[], name: string) => pins.find((p) => p.name === name)!.num;

/** Input bits for a unit from a map of pin → bit (pins not listed are 0). */
export const unitBits = (inputs: number[], set: Record<number, Bit>): Bit[] => inputs.map((p) => set[p] ?? 0);
