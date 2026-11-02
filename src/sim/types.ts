export type Bit = 0 | 1;

export type GateKind = 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'NOT';

/** 'nc' = not connected (the 74147's pin 15). */
export type PinRole = 'input' | 'output' | 'vcc' | 'gnd' | 'nc';

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

/**
 * A gate-level signal path inside a block chip: a pin, or a gate over sub-paths. A `collapsed`
 * gate is drawn as one labelled box (its value still comes from its inputs), for parts of a chip
 * too big to draw gate by gate. Identical sub-paths are drawn once and fan out.
 */
export type LogicNode =
  | { pin: number }
  | { kind: GateKind; inputs: LogicNode[]; label?: string; collapsed?: string };

/** One of a block chip's identical units (a decoder, a mux section). Most chips have one. */
export interface BlockUnit {
  /** Tab label, e.g. "Decoder 1". */
  label: string;
  /** Input pins in `evaluate` order. A pin may be shared by several units (the 74157's S). */
  inputs: number[];
  /** Output pins in `evaluate` order. */
  outputs: number[];
}

/** One row of a datasheet function table, over a unit's input bits (in unit order). */
export interface FunctionRowDef {
  /** Text in each input column: "1", "0", "X", or a condition such as "A3>B3". */
  cells: string[];
  /** Whether input bits fall under this row. */
  match: (inputs: Bit[]) => boolean;
  /** Input bits for this row, starting from the current ones (clicking a row applies it). */
  apply: (inputs: Bit[]) => Bit[];
}

export interface FunctionTableDef {
  /** Input column headings; "~" marks active-LOW names. */
  columns: string[];
  rows: FunctionRowDef[];
}

/** A timing-diagram row: one pin (a waveform), or several pins drawn as a bus with a text label. */
export interface TimingRowDef {
  label: string;
  sub: string;
  pins: number[];
  /** Bus text for the pins' values (pins order). Required when there's more than one pin. */
  format?: (bits: Bit[]) => string;
}

/** One Logic-tab view: the gates driving output pin `out`. */
export interface LogicViewDef {
  /** Tab label, e.g. "~Y5" or "I3". */
  tab: string;
  out: number;
  node: LogicNode;
  /** Clicking this pin in the pin diagram opens the view (defaults to `out`). */
  pin?: number;
}

/** An input pattern for one unit: the unit's input bits at each step. */
export interface BlockPreset {
  id: string;
  label: string;
  at: (step: number) => Bit[];
}

/**
 * MSI chip: function blocks (decoder, encoder, multiplexer, comparator) whose outputs depend on
 * all of their inputs together (Lecture 8). Everything shown is computed from `evaluate`.
 */
export interface BlockChipDef extends ChipContent {
  kind: 'block';
  /** Header formula; "~" marks active-LOW names. */
  formula: string;
  /** Drawn inside the package, e.g. "3-to-8 decoder". */
  blockLabel: string;
  units: BlockUnit[];
  /** One unit's output bits for its input bits. Lives in src/sim/msi.ts. */
  evaluate: (inputs: Bit[]) => Bit[];
  /** The datasheet's function table for a unit. Output cells are computed. */
  functionTable: (unit: number) => FunctionTableDef;
  /** What each signal pin does, in a sentence. */
  pinInfo: Record<number, string>;
  /** One line describing a unit's state, e.g. "Enabled. A2 A1 A0 = 101 = 5, so ~Y5 is LOW". */
  status: (inputs: Bit[], outputs: Bit[], unit: number) => string;
  /** Timing-diagram rows for a unit. */
  timing: (unit: number) => { inputs: TimingRowDef[]; outputs: TimingRowDef[] };
  /** Logic-tab views for a unit, from the datasheet's logic diagram. Tests check them against `evaluate`. */
  logic: (unit: number) => LogicViewDef[];
  presets: BlockPreset[];
}

export type ChipDef = GateChipDef | BlockChipDef;
