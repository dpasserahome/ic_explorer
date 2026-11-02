import type { ChipDef } from '../sim/types';
import { standardQuad2 } from './layouts';

export const c7486: ChipDef = {
  part: '7486',
  title: 'Quad 2-input XOR gate',
  subtitle: '4 independent gates · 14-pin DIP',
  overview:
    'Four separate exclusive-OR gates in one package. Each output is HIGH if one input or the other is ' +
    'HIGH, but not both. Used for parity checking, binary comparison (X is LOW when A and B are equal) ' +
    'and as a controlled inverter: with B HIGH, X is the complement of A.',
  readAs: 'X equals A XOR B',
  inputLabels: ['A', 'B'],
  outputLabel: 'X',
  ...standardQuad2('XOR'),
};
