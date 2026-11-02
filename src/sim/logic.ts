import type { Bit, BlockChipDef, ChipDef, GateKind } from './types';

export function evalGate(kind: GateKind, inputs: Bit[]): Bit {
  const ones = inputs.filter((b) => b === 1).length;
  switch (kind) {
    case 'AND':
      return ones === inputs.length ? 1 : 0;
    case 'OR':
      return ones > 0 ? 1 : 0;
    case 'NAND':
      return ones === inputs.length ? 0 : 1;
    case 'NOR':
      return ones > 0 ? 0 : 1;
    case 'XOR':
      return (ones % 2) as Bit;
    case 'NOT':
      return inputs[0] === 1 ? 0 : 1;
  }
}

/**
 * The chip's independently driven units: one per gate, or a single unit for a block chip. Each
 * unit owns its input pins (in order) and output pins, and gets its own input waveforms.
 */
export function chipUnits(chip: ChipDef): { inputs: number[]; outputs: number[] }[] {
  if (chip.kind === 'block') return [{ inputs: chip.inputs, outputs: chip.outputs }];
  return chip.gates.map((g) => ({ inputs: g.inputs, outputs: [g.output] }));
}

/** Output bits of one unit for the given input bits (in the unit's input order). */
export function evaluateUnit(chip: ChipDef, unit: number, inputs: Bit[]): Bit[] {
  if (chip.kind === 'block') return chip.evaluate(inputs);
  return [evalGate(chip.gates[unit].kind, inputs)];
}

/** Given values on the chip's input pins, returns values for every input and output pin. */
export function evaluateChip(chip: ChipDef, inputs: Record<number, Bit>): Record<number, Bit> {
  const values: Record<number, Bit> = { ...inputs };
  chipUnits(chip).forEach((u, ui) => {
    const outs = evaluateUnit(chip, ui, u.inputs.map((p) => inputs[p] ?? 0));
    u.outputs.forEach((p, i) => (values[p] = outs[i]));
  });
  return values;
}

export interface FunctionRow {
  inputs: (Bit | 'X')[];
  outputs: Bit[];
}

/**
 * A block chip's function table: the datasheet's input patterns with computed outputs. A row's
 * outputs are evaluated with every X at 0; tests check that X really doesn't matter.
 */
export function functionTable(chip: BlockChipDef): FunctionRow[] {
  return chip.functionRows.map((inputs) => ({
    inputs,
    outputs: chip.evaluate(inputs.map((b) => (b === 'X' ? 0 : b))),
  }));
}

/** Whether concrete input bits match a function-table pattern. */
export const matchesRow = (pattern: (Bit | 'X')[], bits: Bit[]) =>
  pattern.every((b, i) => b === 'X' || b === bits[i]);

export interface TruthRow {
  inputs: Bit[];
  output: Bit;
}

/** All 2^n input combinations in binary-count order, first input as the MSB. */
export function truthTable(kind: GateKind, n: number): TruthRow[] {
  return Array.from({ length: 1 << n }, (_, row) => {
    const inputs = Array.from({ length: n }, (_, i) => ((row >> (n - 1 - i)) & 1) as Bit);
    return { inputs, output: evalGate(kind, inputs) };
  });
}

/** Boolean expression in lecture notation, with any terms (labels like "A" or values like "1"). */
export function expression(kind: GateKind, terms: string[]): string {
  switch (kind) {
    case 'AND':
      return terms.join(' · ');
    case 'OR':
      return terms.join(' + ');
    case 'NAND':
      return `(${terms.join(' · ')})′`;
    case 'NOR':
      return `(${terms.join(' + ')})′`;
    case 'XOR':
      return terms.join(' ⊕ ');
    case 'NOT':
      return `${terms[0]}′`;
  }
}

export const levelName = (b: Bit) => (b ? 'HIGH' : 'LOW');
