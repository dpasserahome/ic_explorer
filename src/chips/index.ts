import type { ChipDef } from '../sim/types';
import { c7408 } from './c7408';

export interface CatalogEntry {
  part: string;
  title: string;
  /** Undefined until the chip's data is written; listed in the nav as "coming soon". */
  chip?: ChipDef;
}

export const CATALOG: CatalogEntry[] = [
  { part: '7400', title: 'Quad 2-input NAND' },
  { part: '7402', title: 'Quad 2-input NOR' },
  { part: '7404', title: 'Hex inverter' },
  { part: '7408', title: 'Quad 2-input AND', chip: c7408 },
  { part: '7432', title: 'Quad 2-input OR' },
  { part: '7486', title: 'Quad 2-input XOR' },
];
