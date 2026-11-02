import type { Bit, BlockChipDef, ChipDef, FunctionRowDef, GateKind, LogicNode } from './types';

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
    case 'XNOR':
      return (1 - (ones % 2)) as Bit;
    case 'NOT':
      return inputs[0] === 1 ? 0 : 1;
  }
}

/**
 * The chip's units: one per gate, or a block chip's units (usually one). A unit lists its input
 * pins (in order) and output pins. Block-chip units may share input pins.
 */
export function chipUnits(chip: ChipDef): { inputs: number[]; outputs: number[] }[] {
  if (chip.kind === 'block') return chip.units;
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

/** n bits of value, MSB first. */
export const toBits = (value: number, n: number): Bit[] =>
  Array.from({ length: n }, (_, i) => ((value >> (n - 1 - i)) & 1) as Bit);

export interface FunctionRow {
  def: FunctionRowDef;
  /**
   * One cell per output: "1"/"0" when the row fixes it, or the input it follows, such as "I5" or
   * "I5′" (as the 74151's datasheet writes it). "?" would mean the row doesn't determine it; tests
   * check that never happens.
   */
  outputs: string[];
}

const tableCache = new WeakMap<BlockChipDef, FunctionRow[][]>();

/**
 * A unit's function table with computed output cells, found by evaluating every input combination
 * that falls under each row.
 */
export function functionTable(chip: BlockChipDef, unit: number): FunctionRow[] {
  let perUnit = tableCache.get(chip);
  if (!perUnit) tableCache.set(chip, (perUnit = []));
  if (perUnit[unit]) return perUnit[unit];

  const { inputs, outputs } = chip.units[unit];
  const n = inputs.length;
  const name = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const combos = Array.from({ length: 1 << n }, (_, c) => {
    const bits = toBits(c, n);
    return { bits, outs: chip.evaluate(bits) };
  });

  const rows = chip.functionTable(unit).rows.map((def) => {
    const matching = combos.filter((c) => def.match(c.bits));
    const cells = outputs.map((_, k) => {
      const vals = matching.map((c) => c.outs[k]);
      if (vals.length && vals.every((v) => v === vals[0])) return String(vals[0]);
      for (let i = 0; i < n; i++) {
        if (vals.length && matching.every((c, j) => vals[j] === c.bits[i])) return name(inputs[i]);
        if (vals.length && matching.every((c, j) => vals[j] !== c.bits[i])) return `${name(inputs[i])}′`;
      }
      return '?';
    });
    return { def, outputs: cells };
  });
  perUnit[unit] = rows;
  return rows;
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
    case 'XNOR':
      return `(${terms.join(' ⊕ ')})′`;
    case 'NOT':
      return `${terms[0]}′`;
  }
}

/** Value of a gate-level path, given pin values. */
export function evalLogic(node: LogicNode, values: Record<number, Bit>): Bit {
  if ('pin' in node) return values[node.pin] ?? 0;
  return evalGate(node.kind, node.inputs.map((n) => evalLogic(n, values)));
}

/**
 * Lecture-notation expression for a gate-level path. Below the root, a sub-gate for which `sub`
 * returns text (by default its label, e.g. the enable "E") is written as that text.
 */
export function logicExpression(
  node: LogicNode,
  term: (pin: number) => string,
  sub: (node: LogicNode) => string | undefined = (n) => ('kind' in n ? n.label : undefined),
  root = true,
): string {
  if ('pin' in node) return term(node.pin);
  const short = root ? undefined : sub(node);
  if (short !== undefined) return short;
  return expression(node.kind, node.inputs.map((n) => logicExpression(n, term, sub, false)));
}

export const levelName = (b: Bit) => (b ? 'HIGH' : 'LOW');
