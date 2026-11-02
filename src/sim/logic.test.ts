import { describe, expect, it } from 'vitest';
import { CATALOG } from '../chips';
import { c7408 } from '../chips/c7408';
import { evalGate, evaluateChip, expression, truthTable } from './logic';

describe('evalGate', () => {
  const rows = (kind: Parameters<typeof evalGate>[0]) =>
    truthTable(kind, 2).map((r) => r.output);

  it('matches the standard 2-input truth tables (rows 00, 01, 10, 11)', () => {
    expect(rows('AND')).toEqual([0, 0, 0, 1]);
    expect(rows('OR')).toEqual([0, 1, 1, 1]);
    expect(rows('NAND')).toEqual([1, 1, 1, 0]);
    expect(rows('NOR')).toEqual([1, 0, 0, 0]);
    expect(rows('XOR')).toEqual([0, 1, 1, 0]);
  });

  it('inverts for NOT', () => {
    expect(truthTable('NOT', 1).map((r) => r.output)).toEqual([1, 0]);
  });

  it('orders truth-table rows in binary count with A as MSB', () => {
    expect(truthTable('AND', 2).map((r) => r.inputs)).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
  });
});

describe('expression', () => {
  it('uses lecture notation', () => {
    expect(expression('AND', ['A', 'B'])).toBe('A · B');
    expect(expression('NAND', ['A', 'B'])).toBe('(A · B)′');
    expect(expression('NOT', ['A'])).toBe('A′');
    expect(expression('OR', ['A', 'B'])).toBe('A + B');
    expect(expression('NOR', ['A', 'B'])).toBe('(A + B)′');
    expect(expression('XOR', ['A', 'B'])).toBe('A ⊕ B');
  });
});

// Datasheet connection diagrams (TI SN74xx). The deck's 7402 slide labels pins 1–3 as 1A/1B/1Y,
// but its own wiring (and every datasheet) puts the output first: 1Y/1A/1B.
const PINOUTS: Record<string, Record<number, string>> = {
  '7400': { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' },
  '7402': { 1: '1Y', 2: '1A', 3: '1B', 4: '2Y', 5: '2A', 6: '2B', 7: 'GND', 8: '3A', 9: '3B', 10: '3Y', 11: '4A', 12: '4B', 13: '4Y', 14: 'VCC' },
  '7404': { 1: '1A', 2: '1Y', 3: '2A', 4: '2Y', 5: '3A', 6: '3Y', 7: 'GND', 8: '4Y', 9: '4A', 10: '5Y', 11: '5A', 12: '6Y', 13: '6A', 14: 'VCC' },
  '7408': { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' },
  '7432': { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' },
  '7486': { 1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND', 8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC' },
};

const chipOf = (part: string) => CATALOG.find((c) => c.part === part)!.chip!;

describe.each(Object.keys(PINOUTS))('%s', (part) => {
  const chip = chipOf(part);

  it('matches the datasheet connection diagram', () => {
    expect(Object.fromEntries(chip.pins.map((p) => [p.num, p.name]))).toEqual(PINOUTS[part]);
  });

  it('wires every gate to its own numbered pins', () => {
    const byName = Object.fromEntries(chip.pins.map((p) => [p.name, p.num]));
    for (const g of chip.gates) {
      expect(g.inputs).toEqual(chip.inputLabels.map((l) => byName[`${g.id}${l}`]));
      expect(g.output).toBe(byName[`${g.id}Y`]);
    }
  });

  it('drives each output from its own gate only', () => {
    // Give each gate a different input pattern and check every output against evalGate.
    const inputs: Record<number, 0 | 1> = {};
    chip.gates.forEach((g, gi) => g.inputs.forEach((p, i) => (inputs[p] = ((gi >> i) & 1) as 0 | 1)));
    const values = evaluateChip(chip, inputs);
    for (const g of chip.gates) {
      expect(values[g.output]).toBe(evalGate(g.kind, g.inputs.map((p) => inputs[p])));
    }
  });
});

it('7408 sample evaluation', () => {
  const values = evaluateChip(c7408, { 1: 1, 2: 1, 4: 1, 5: 0, 9: 0, 10: 0, 12: 0, 13: 1 });
  expect([values[3], values[6], values[8], values[11]]).toEqual([1, 0, 0, 0]);
});

describe('catalog', () => {
  it('lists the six v1 chips, all built', () => {
    expect(CATALOG.map((c) => c.part)).toEqual(['7400', '7402', '7404', '7408', '7432', '7486']);
    expect(CATALOG.every((c) => c.chip?.part === c.part)).toBe(true);
  });
});
