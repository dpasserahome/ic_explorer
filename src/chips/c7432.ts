import type { ChipDef } from '../sim/types';
import { standardQuad2 } from './layouts';

export const c7432: ChipDef = {
  part: '7432',
  title: 'Quad 2-input OR gate',
  subtitle: '4 independent gates · 14-pin DIP',
  overview:
    'Four separate OR gates in one package. Each output is HIGH whenever input A or input B is HIGH, or ' +
    'both, and LOW only when both are LOW. Typically used as a disable gate: while the control input is ' +
    'HIGH the output is stuck HIGH and the other signal can’t pass.',
  readAs: 'X equals A OR B',
  inputLabels: ['A', 'B'],
  outputLabel: 'X',
  ...standardQuad2('OR'),
};
