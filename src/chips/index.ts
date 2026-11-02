import type { ChipDef } from '../sim/types';
import { c7400 } from './c7400';
import { c7402 } from './c7402';
import { c7404 } from './c7404';
import { c7408 } from './c7408';
import { c7432 } from './c7432';
import { c7486 } from './c7486';
import { c7442 } from './c7442';
import { c7485 } from './c7485';
import { c74138 } from './c74138';
import { c74139 } from './c74139';
import { c74147 } from './c74147';
import { c74148 } from './c74148';
import { c74151 } from './c74151';
import { c74154 } from './c74154';
import { c74157 } from './c74157';

export interface CatalogEntry {
  part: string;
  /** Nav section heading. */
  group: string;
  title: string;
  /** Undefined until the chip's data is written; listed in the nav as "coming soon". */
  chip?: ChipDef;
}

const GATES = 'Basic gates';
const MSI = 'MSI functions';

export const CATALOG: CatalogEntry[] = [
  { group: GATES, part: '7400', title: 'Quad 2-input NAND', chip: c7400 },
  { group: GATES, part: '7402', title: 'Quad 2-input NOR', chip: c7402 },
  { group: GATES, part: '7404', title: 'Hex inverter', chip: c7404 },
  { group: GATES, part: '7408', title: 'Quad 2-input AND', chip: c7408 },
  { group: GATES, part: '7432', title: 'Quad 2-input OR', chip: c7432 },
  { group: GATES, part: '7486', title: 'Quad 2-input XOR', chip: c7486 },
  { group: MSI, part: '74138', title: '3-to-8 decoder', chip: c74138 },
  { group: MSI, part: '74139', title: 'Dual 2-to-4 decoder', chip: c74139 },
  { group: MSI, part: '74154', title: '4-to-16 decoder', chip: c74154 },
  { group: MSI, part: '7442', title: 'BCD-to-decimal', chip: c7442 },
  { group: MSI, part: '74147', title: '10-to-4 priority encoder', chip: c74147 },
  { group: MSI, part: '74148', title: '8-to-3 priority encoder', chip: c74148 },
  { group: MSI, part: '74151', title: '8-to-1 multiplexer', chip: c74151 },
  { group: MSI, part: '74157', title: 'Quad 2-to-1 multiplexer', chip: c74157 },
  { group: MSI, part: '7485', title: '4-bit comparator', chip: c7485 },
];
