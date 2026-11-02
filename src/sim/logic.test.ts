import { describe, expect, it } from 'vitest';
import { CATALOG } from '../chips';
import { c7408 } from '../chips/c7408';
import { c74138 } from '../chips/c74138';
import { evalGate, evalLogic, evaluateChip, expression, functionTable, logicExpression, toBits, truthTable } from './logic';
import { binaryValue } from './msi';
import type { Bit, BlockChipDef, GateChipDef } from './types';

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
    expect(expression('XNOR', ['A', 'B'])).toBe('(A ⊕ B)′');
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

// ---------- MSI (block) chips ----------

const block = (part: string) => CATALOG.find((c) => c.part === part)!.chip as BlockChipDef;
const MSI = CATALOG.filter((c) => c.chip?.kind === 'block').map((c) => c.part);

// Datasheet connection diagrams (NXP 74HC series names, which the deck uses; "~" = overbar).
const range = (from: number, names: string[]) => Object.fromEntries(names.map((n, i) => [from + i, n]));
const MSI_PINOUTS: Record<string, Record<number, string>> = {
  '74138': { ...range(1, ['A0', 'A1', 'A2', '~E1', '~E2', 'E3', '~Y7', 'GND']), ...range(9, ['~Y6', '~Y5', '~Y4', '~Y3', '~Y2', '~Y1', '~Y0', 'VCC']) },
  '74139': { ...range(1, ['1~E', '1A0', '1A1', '1~Y0', '1~Y1', '1~Y2', '1~Y3', 'GND']), ...range(9, ['2~Y3', '2~Y2', '2~Y1', '2~Y0', '2A1', '2A0', '2~E', 'VCC']) },
  '74154': {
    ...range(1, ['~Y0', '~Y1', '~Y2', '~Y3', '~Y4', '~Y5', '~Y6', '~Y7', '~Y8', '~Y9', '~Y10', 'GND']),
    ...range(13, ['~Y11', '~Y12', '~Y13', '~Y14', '~Y15', '~E0', '~E1', 'A3', 'A2', 'A1', 'A0', 'VCC']),
  },
  '7442': { ...range(1, ['~Y0', '~Y1', '~Y2', '~Y3', '~Y4', '~Y5', '~Y6', 'GND']), ...range(9, ['~Y7', '~Y8', '~Y9', 'A3', 'A2', 'A1', 'A0', 'VCC']) },
  '74147': { ...range(1, ['~I4', '~I5', '~I6', '~I7', '~I8', '~A2', '~A1', 'GND']), ...range(9, ['~A0', '~I9', '~I1', '~I2', '~I3', '~A3', 'NC', 'VCC']) },
  '74148': { ...range(1, ['~I4', '~I5', '~I6', '~I7', '~EI', '~A2', '~A1', 'GND']), ...range(9, ['~A0', '~I0', '~I1', '~I2', '~I3', '~GS', '~EO', 'VCC']) },
  '74151': { ...range(1, ['I3', 'I2', 'I1', 'I0', 'Y', '~Y', '~E', 'GND']), ...range(9, ['S2', 'S1', 'S0', 'I7', 'I6', 'I5', 'I4', 'VCC']) },
  '74157': { ...range(1, ['S', '1I0', '1I1', '1Y', '2I0', '2I1', '2Y', 'GND']), ...range(9, ['3Y', '3I1', '3I0', '4Y', '4I1', '4I0', '~E', 'VCC']) },
  '7485': { ...range(1, ['B3', 'IA<B', 'IA=B', 'IA>B', 'A>B', 'A=B', 'A<B', 'GND']), ...range(9, ['B0', 'A0', 'B1', 'A1', 'A2', 'B2', 'A3', 'VCC']) },
};

/** Each unit's outputs for its input bits, from an independent formula (not the chip's evaluate). */
const REFERENCE: Record<string, (bits: Bit[]) => Bit[]> = {
  '74138': ([e1, e2, e3, ...a]) => Array.from({ length: 8 }, (_, k) => (!e1 && !e2 && e3 && k === binaryValue(a) ? 0 : 1)),
  '74139': ([e, ...a]) => Array.from({ length: 4 }, (_, k) => (!e && k === binaryValue(a) ? 0 : 1)),
  '74154': ([e0, e1, ...a]) => Array.from({ length: 16 }, (_, k) => (!e0 && !e1 && k === binaryValue(a) ? 0 : 1)),
  '7442': (a) => Array.from({ length: 10 }, (_, k) => (k === binaryValue(a) ? 0 : 1)),
  '74147': (ins) => {
    const n = Math.max(0, ...ins.map((b, i) => (b === 0 ? i + 1 : 0)));
    return toBits(15 - n, 4);
  },
  '74148': ([ei, ...ins]) => {
    if (ei) return [1, 1, 1, 1, 1];
    const n = Math.max(-1, ...ins.map((b, i) => (b === 0 ? i : -1)));
    if (n < 0) return [1, 1, 1, 1, 0];
    const [a2, a1, a0] = toBits(7 - n, 3);
    return [0, a0, a1, a2, 1];
  },
  '74151': ([e, s2, s1, s0, ...d]) => {
    const y: Bit = e ? 0 : d[s2 * 4 + s1 * 2 + s0];
    return [y, (1 - y) as Bit];
  },
  '74157': ([e, s, i0, i1]) => [e ? 0 : s ? i1 : i0],
  '7485': (ins) => {
    const a = binaryValue(ins.slice(0, 4));
    const b = binaryValue(ins.slice(4, 8));
    const [gt, lt, eq] = ins.slice(8);
    if (a !== b) return a > b ? [1, 0, 0] : [0, 0, 1];
    // The datasheet's cascading rows: X X H → =; H L L → >; L H L → <; H H L → none; L L L → > and <.
    if (eq) return [0, 1, 0];
    return [lt ? 0 : 1, 0, gt ? 0 : 1];
  },
};

// Function-table output cells as printed on the datasheets (or deck), row by row.
const TABLE_OUTPUTS: Record<string, string[][]> = {
  '74138': [
    '11111111', '11111111', '11111111', '01111111', '10111111', '11011111', '11101111', '11110111', '11111011', '11111101', '11111110',
  ].map((r) => [...r]),
  '74147': ['1111', '0110', '0111', '1000', '1001', '1010', '1011', '1100', '1101', '1110'].map((r) => [...r]),
  '74148': ['11111', '11110', '00001', '01001', '00101', '01101', '00011', '01011', '00111', '01111'].map((r) => [...r]),
  '74151': [['0', '1'], ...Array.from({ length: 8 }, (_, n) => [`I${n}`, `I${n}′`])],
  '74157': [['0'], ['1I0'], ['1I1']],
  '7485': [...Array.from({ length: 4 }, () => [['1', '0', '0'], ['0', '0', '1']]).flat(), ['1', '0', '0'], ['0', '0', '1'], ['0', '1', '0'], ['0', '0', '0'], ['1', '0', '1']],
};

it('lists every MSI chip as built', () => {
  expect(MSI).toEqual(['74138', '74139', '74154', '7442', '74147', '74148', '74151', '74157', '7485']);
});

describe.each(MSI)('%s', (part) => {
  const chip = block(part);
  const name = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const signal = chip.pins.filter((p) => p.role === 'input' || p.role === 'output').map((p) => p.num);

  it('matches the datasheet connection diagram', () => {
    expect(Object.fromEntries(chip.pins.map((p) => [p.num, p.name]))).toEqual(MSI_PINOUTS[part]);
  });

  it('wires every signal pin to a unit, inputs as inputs and outputs as outputs', () => {
    const role = (p: number) => chip.pins.find((x) => x.num === p)!.role;
    for (const u of chip.units) {
      expect(u.inputs.every((p) => role(p) === 'input')).toBe(true);
      expect(u.outputs.every((p) => role(p) === 'output')).toBe(true);
    }
    const used = new Set(chip.units.flatMap((u) => [...u.inputs, ...u.outputs]));
    expect(signal.every((p) => used.has(p))).toBe(true);
    expect(signal.every((p) => chip.pinInfo[p])).toBe(true);
  });

  chip.units.forEach((unit, u) => {
    const n = unit.inputs.length;
    const combos = Array.from({ length: 1 << n }, (_, c) => toBits(c, n));
    const valuesFor = (bits: Bit[]) => evaluateChip(chip, Object.fromEntries(unit.inputs.map((p, i) => [p, bits[i]])));

    it(`${unit.label}: matches an independent formula for all ${1 << n} input combinations`, () => {
      for (const bits of combos) {
        const values = valuesFor(bits);
        expect(unit.outputs.map((p) => values[p])).toEqual(REFERENCE[part](bits));
      }
    });

    it(`${unit.label}: function table rows are all determined and clickable`, () => {
      const rows = functionTable(chip, u);
      for (const row of rows) {
        expect(row.outputs).not.toContain('?');
        expect(combos.some((bits) => row.def.match(bits))).toBe(true);
        for (const bits of combos.filter((_, c) => c % 7 === 0)) expect(row.def.match(row.def.apply(bits))).toBe(true);
      }
    });

    it(`${unit.label}: every Logic view matches the chip`, () => {
      for (const view of chip.logic(u)) {
        for (const bits of combos) expect(evalLogic(view.node, valuesFor(bits))).toBe(valuesFor(bits)[view.out]);
      }
    });

    it(`${unit.label}: presets and timing rows fit the unit`, () => {
      for (const p of chip.presets) for (let s = 0; s < 16; s++) expect(p.at(s)).toHaveLength(n);
      const { inputs, outputs } = chip.timing(u);
      expect(inputs.length + outputs.length).toBeLessThanOrEqual(7);
      for (const row of [...inputs, ...outputs]) {
        expect(row.pins.every((p) => signal.includes(p))).toBe(true);
        if (row.pins.length > 1) expect(row.format).toBeDefined();
      }
    });
  });

  if (TABLE_OUTPUTS[part]) {
    it('reproduces the datasheet function table outputs', () => {
      expect(functionTable(chip, 0).map((r) => r.outputs)).toEqual(TABLE_OUTPUTS[part]);
    });
  }

  it('names outputs and inputs consistently in the Logic tab', () => {
    for (let u = 0; u < chip.units.length; u++) for (const v of chip.logic(u)) expect(name(v.out)).toBeDefined();
  });
});

describe('74138 Logic view', () => {
  it('writes the logic path in lecture notation', () => {
    const name = (p: number) => c74138.pins.find((x) => x.num === p)!.name;
    const y5 = c74138.logic(0)[5].node;
    expect(logicExpression(y5, name)).toBe('(E · A2 · A1′ · A0)′');
    expect('inputs' in y5 && logicExpression(y5.inputs[0], name)).toBe('~E1′ · ~E2′ · E3');
  });
});
