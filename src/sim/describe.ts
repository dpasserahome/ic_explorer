import { expression, levelName } from './logic';
import type { Bit, BlockChipDef, GateChipDef } from './types';

/** "pin 1" or "pins 1 and 2". */
const pinsPhrase = (pins: number[]) => (pins.length === 1 ? `pin ${pins[0]}` : `pins ${pins.join(' and ')}`);

export interface Description {
  title: string;
  body: string;
}

/** Plain-language explanation of a pin: what it is, its value, and where its signal goes. */
export function describePin(chip: GateChipDef, pin: number, values: Record<number, Bit>): Description {
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

  const pinList = pinsPhrase(gate.inputs);
  return {
    title,
    body:
      `Output of Gate ${gate.id}: ${chip.outputLabel} = ` +
      `${expression(gate.kind, chip.inputLabels.slice(0, gate.inputs.length))} = ` +
      `${expression(gate.kind, gate.inputs.map((p) => String(v(p))))} = ${v(gate.output)}. ` +
      `The chip drives this pin, so you can't set it directly. Change ${pinList} instead.`,
  };
}

export function describeGate(chip: GateChipDef, gateIndex: number): Description {
  const gate = chip.gates[gateIndex];
  return {
    title: `Gate ${gate.id} · ${gate.kind}`,
    body: `${gate.inputs.length === 1 ? 'Input' : 'Inputs'} on ${pinsPhrase(gate.inputs)}, output on pin ${gate.output}. Click to focus this gate.`,
  };
}

/** Pin explanation for a block chip: what the pin does (from the chip data) and its value now. */
export function describeBlockPin(chip: BlockChipDef, pin: number, values: Record<number, Bit>): Description {
  const def = chip.pins.find((p) => p.num === pin)!;
  const title = `Pin ${pin} · ${def.name}`;
  const v = values[pin] ?? 0;
  if (def.role === 'vcc') return { title, body: 'Power supply (+5 V) for the whole chip.' };
  if (def.role === 'gnd') return { title, body: 'Ground (0 V), the common return path for the whole chip.' };
  const now = `Currently ${v} (${levelName(v)}).`;
  if (def.role === 'input') return { title, body: `${chip.pinInfo[pin]} ${now} Click to toggle.` };
  return { title, body: `${chip.pinInfo[pin]} ${now} Driven by the chip, so change the inputs instead.` };
}
