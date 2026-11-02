import { expression, levelName } from './logic';
import type { Bit, ChipDef } from './types';

export interface Description {
  title: string;
  body: string;
}

/** Plain-language explanation of a pin: what it is, its value, and where its signal goes. */
export function describePin(chip: ChipDef, pin: number, values: Record<number, Bit>): Description {
  const def = chip.pins.find((p) => p.num === pin)!;
  const title = `Pin ${pin} · ${def.name}`;
  const v = (p: number) => values[p] ?? 0;

  if (def.role === 'vcc') {
    return {
      title,
      body: `Power supply (+5 V). Shared by all ${chip.gates.length} gates. Without power, none of them work.`,
    };
  }
  if (def.role === 'gnd') {
    return {
      title,
      body: `Ground (0 V). The common return path shared by all ${chip.gates.length} gates.`,
    };
  }

  const gate = chip.gates.find((g) => g.inputs.includes(pin) || g.output === pin)!;
  const outName = chip.pins.find((p) => p.num === gate.output)!.name;

  if (def.role === 'input') {
    const label = chip.inputLabels[gate.inputs.indexOf(pin)];
    return {
      title,
      body:
        `Input ${label} of Gate ${gate.id} (${gate.kind}), currently ${v(pin)} (${levelName(v(pin))}). ` +
        `Gate ${gate.id} drives pin ${gate.output} (${outName}), which is now ${v(gate.output)}. ` +
        `Click to toggle.`,
    };
  }

  const pinList = gate.inputs.join(' and ');
  return {
    title,
    body:
      `Output of Gate ${gate.id}: ${chip.outputLabel} = ` +
      `${expression(gate.kind, chip.inputLabels.slice(0, gate.inputs.length))} = ` +
      `${expression(gate.kind, gate.inputs.map((p) => String(v(p))))} = ${v(gate.output)}. ` +
      `The chip drives this pin, so you can't set it directly. Change pins ${pinList} instead.`,
  };
}

export function describeGate(chip: ChipDef, gateIndex: number): Description {
  const gate = chip.gates[gateIndex];
  return {
    title: `Gate ${gate.id} · ${gate.kind}`,
    body: `Inputs on pins ${gate.inputs.join(' and ')}, output on pin ${gate.output}. Click to focus this gate.`,
  };
}
