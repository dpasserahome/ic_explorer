import type { Bit, ChipDef, GateKind } from './types';

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

/** Given values on the chip's input pins, returns values for every input and output pin. */
export function evaluateChip(chip: ChipDef, inputs: Record<number, Bit>): Record<number, Bit> {
  const values: Record<number, Bit> = { ...inputs };
  for (const gate of chip.gates) {
    values[gate.output] = evalGate(
      gate.kind,
      gate.inputs.map((p) => inputs[p] ?? 0),
    );
  }
  return values;
}

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
