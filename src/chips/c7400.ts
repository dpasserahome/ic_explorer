import type { ChipDef } from '../sim/types';
import { standardQuad2 } from './layouts';

export const c7400: ChipDef = {
  part: '7400',
  title: 'Quad 2-input NAND gate',
  subtitle: '4 independent gates · 14-pin DIP',
  overview:
    'Four separate NAND gates in one package. A NAND is an AND gate with its output inverted: the output ' +
    'is always HIGH unless both inputs go HIGH, and then it goes LOW. Compare its truth table with the ' +
    '7408: every output is flipped.',
  readAs: 'X equals NOT (A AND B)',
  inputLabels: ['A', 'B'],
  outputLabel: 'X',
  ...standardQuad2('NAND'),
};
