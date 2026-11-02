export type Bit = 0 | 1;

export type GateKind = 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'NOT';

export type PinRole = 'input' | 'output' | 'vcc' | 'gnd';

export interface PinDef {
  num: number;
  /** Datasheet name, e.g. "1A", "1Y", "VCC". A leading "~" marks an active-LOW name (drawn with an overbar). */
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

interface ChipContent {
  part: string;
  title: string;
  subtitle: string;
  overview: string;
  /** The deck's "read as" phrasing, e.g. "X equals A AND B". */
  readAs: string;
  pins: PinDef[];
}

/** SSI chip: several independent gates (Lecture 2). */
export interface GateChipDef extends ChipContent {
  kind?: 'gates';
  /** Lecture notation for one gate's inputs and output. */
  inputLabels: string[];
  outputLabel: string;
  gates: GateDef[];
}

/** One step of an input pattern: the value of every input pin, in `inputs` order. */
export interface BlockPreset {
  id: string;
  label: string;
  at: (step: number) => Bit[];
}

/**
 * MSI chip: one function block (decoder, encoder, multiplexer, comparator) whose outputs depend on
 * all of its inputs together (Lecture 8).
 */
export interface BlockChipDef extends ChipContent {
  kind: 'block';
  /** Header formula; "~" marks active-LOW names. */
  formula: string;
  /** Drawn inside the package, e.g. "3-to-8 decoder". */
  blockLabel: string;
  /** Input pins in function-table column order. */
  inputs: number[];
  /** Output pins in function-table column order. */
  outputs: number[];
  /** Output bits for input bits in `inputs` order. Lives in src/sim. */
  evaluate: (inputs: Bit[]) => Bit[];
  /** The datasheet function table's input patterns ('X' = don't care). Outputs are computed. */
  functionRows: (Bit | 'X')[][];
  /** What each input/output pin does, in a phrase. */
  pinInfo: Record<number, string>;
  /** One line describing the chip's state, e.g. "Enabled: address 5, so ~Y5 is LOW". */
  status: (inputs: Bit[], outputs: Bit[]) => string;
  /** The timing diagram's output row: all outputs summarized as one bus, labelled per step. */
  outputBus: { label: string; sub: string; format: (outputs: Bit[]) => string };
  presets: BlockPreset[];
}

export type ChipDef = GateChipDef | BlockChipDef;
