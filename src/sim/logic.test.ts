import { describe, expect, it } from 'vitest';
import { CATALOG } from '../chips';
import { c7408 } from '../chips/c7408';
import { c74138 } from '../chips/c74138';
import { evalGate, evaluateChip, expression, functionTable, truthTable } from './logic';
import { decoder138, toBits } from './msi';
import type { Bit, GateChipDef } from './types';

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

const chipOf = (part: string) => CATALOG.find((c) => c.part === part)!.chip as GateChipDef;

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
  it('lists the six gate chips, all built, and the Lecture 8 chips', () => {
    const gates = CATALOG.filter((c) => c.group === 'Basic gates');
    expect(gates.map((c) => c.part)).toEqual(['7400', '7402', '7404', '7408', '7432', '7486']);
    expect(gates.every((c) => c.chip?.part === c.part)).toBe(true);
    expect(CATALOG.filter((c) => c.group !== 'Basic gates').map((c) => c.part)).toEqual([
      '74138', '74139', '74154', '7442', '74147', '74148', '74151', '74157', '7485',
    ]);
  });

  it('gives every built chip the part number it is listed under', () => {
    for (const c of CATALOG) if (c.chip) expect(c.chip.part).toBe(c.part);
  });
});

describe('74138', () => {
  it('matches the 74HC138 datasheet connection diagram', () => {
    expect(Object.fromEntries(c74138.pins.map((p) => [p.num, p.name]))).toEqual({
      1: 'A0', 2: 'A1', 3: 'A2', 4: '~E1', 5: '~E2', 6: 'E3', 7: '~Y7', 8: 'GND',
      9: '~Y6', 10: '~Y5', 11: '~Y4', 12: '~Y3', 13: '~Y2', 14: '~Y1', 15: '~Y0', 16: 'VCC',
    });
  });

  it('lists inputs and outputs by name in function-table order', () => {
    const name = (p: number) => c74138.pins.find((x) => x.num === p)!.name;
    expect(c74138.inputs.map(name)).toEqual(['~E1', '~E2', 'E3', 'A2', 'A1', 'A0']);
    expect(c74138.outputs.map(name)).toEqual(['~Y0', '~Y1', '~Y2', '~Y3', '~Y4', '~Y5', '~Y6', '~Y7']);
  });

  it('reproduces the datasheet function table', () => {
    const rows = functionTable(c74138).map((r) => r.outputs.join(''));
    expect(rows).toEqual([
      '11111111', '11111111', '11111111',
      '01111111', '10111111', '11011111', '11101111',
      '11110111', '11111011', '11111101', '11111110',
    ]);
  });

  it('gives the same outputs whatever the X inputs are', () => {
    for (const row of c74138.functionRows) {
      const want = functionTable({ ...c74138, functionRows: [row] })[0].outputs;
      for (let n = 0; n < 64; n++) {
        const bits = toBits(n, 6);
        if (row.every((b, i) => b === 'X' || b === bits[i])) expect(decoder138(bits)).toEqual(want);
      }
    }
  });

  it('drives exactly the addressed output LOW when enabled, and none otherwise', () => {
    for (let n = 0; n < 64; n++) {
      const [e1, e2, e3, a2, a1, a0] = toBits(n, 6);
      const values = evaluateChip(c74138, Object.fromEntries(c74138.inputs.map((p, i) => [p, toBits(n, 6)[i]])));
      const outs = c74138.outputs.map((p) => values[p]);
      const enabled = e1 === 0 && e2 === 0 && e3 === 1;
      const want = Array.from({ length: 8 }, (_, k): Bit => (enabled && k === a2 * 4 + a1 * 2 + a0 ? 0 : 1));
      expect(outs).toEqual(want);
    }
  });

  it('has presets that set every input', () => {
    for (const p of c74138.presets) {
      for (let s = 0; s < 16; s++) expect(p.at(s)).toHaveLength(c74138.inputs.length);
    }
  });
});
