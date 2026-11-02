import type { ChipDef } from '../sim/types';
import { c7400 } from './c7400';
import { c7402 } from './c7402';
import { c7404 } from './c7404';
import { c7408 } from './c7408';
import { c7432 } from './c7432';
import { c7486 } from './c7486';

export interface CatalogEntry {
  part: string;
  title: string;
  /** Undefined until the chip's data is written; listed in the nav as "coming soon". */
  chip?: ChipDef;
}

export const CATALOG: CatalogEntry[] = [
  { part: '7400', title: 'Quad 2-input NAND', chip: c7400 },
  { part: '7402', title: 'Quad 2-input NOR', chip: c7402 },
  { part: '7404', title: 'Hex inverter', chip: c7404 },
  { part: '7408', title: 'Quad 2-input AND', chip: c7408 },
  { part: '7432', title: 'Quad 2-input OR', chip: c7432 },
  { part: '7486', title: 'Quad 2-input XOR', chip: c7486 },
];
