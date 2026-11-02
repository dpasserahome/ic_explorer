export type Bit = 0 | 1;

export type GateKind = 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'NOT';

export type PinRole = 'input' | 'output' | 'vcc' | 'gnd';

export interface PinDef {
  num: number;
  /** Datasheet name, e.g. "1A", "1Y", "VCC". */
  name: string;
  role: PinRole;
}

export interface GateDef {
  /** 1-based gate number as printed on the datasheet (Gate 1 uses pins 1A/1B/1Y). */
  id: number;
  kind: GateKind;
  /** Input pin numbers, in A, B, ... order. */
  inputs: number[];
  output: number;
}

export interface ChipDef {
  part: string;
  title: string;
  subtitle: string;
  overview: string;
  /** The deck's "read as" phrasing, e.g. "X equals A AND B". */
  readAs: string;
  /** Lecture notation for one gate's inputs and output. */
  inputLabels: string[];
  outputLabel: string;
  pins: PinDef[];
  gates: GateDef[];
}
