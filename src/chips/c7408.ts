import type { ChipDef } from '../sim/types';
import { standardQuad2 } from './layouts';

export const c7408: ChipDef = {
  part: '7408',
  title: 'Quad 2-input AND gate',
  subtitle: '4 independent gates · 14-pin DIP',
  overview:
    'Four separate AND gates in one package. Each output is HIGH only when both of its inputs are HIGH. ' +
    'Typically used to combine conditions (an alarm that sounds only when the key is on AND the door is ' +
    'open) or as an enable gate that passes a signal only while a control input is HIGH.',
  readAs: 'X equals A AND B',
  inputLabels: ['A', 'B'],
  outputLabel: 'X',
  ...standardQuad2('AND'),
};
