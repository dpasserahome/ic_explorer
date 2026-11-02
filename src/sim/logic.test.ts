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
  });
});

describe('7408 pinout', () => {
  it('matches the datasheet connection diagram', () => {
    const byNum = Object.fromEntries(c7408.pins.map((p) => [p.num, p.name]));
    expect(byNum).toEqual({
      1: '1A', 2: '1B', 3: '1Y', 4: '2A', 5: '2B', 6: '2Y', 7: 'GND',
      8: '3Y', 9: '3A', 10: '3B', 11: '4Y', 12: '4A', 13: '4B', 14: 'VCC',
    });
  });

  it('drives each output from its own gate only', () => {
    const values = evaluateChip(c7408, { 1: 1, 2: 1, 4: 1, 5: 0, 9: 0, 10: 0, 12: 0, 13: 1 });
    expect([values[3], values[6], values[8], values[11]]).toEqual([1, 0, 0, 0]);
  });
});

describe('catalog', () => {
  it('lists the six v1 chips', () => {
    expect(CATALOG.map((c) => c.part)).toEqual(['7400', '7402', '7404', '7408', '7432', '7486']);
  });
});
