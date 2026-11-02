import type { ChipDef } from '../sim/types';
import { norQuad2 } from './layouts';

export const c7402: ChipDef = {
  part: '7402',
  title: 'Quad 2-input NOR gate',
  subtitle: '4 independent gates · 14-pin DIP',
  overview:
    'Four separate NOR gates in one package. A NOR is an OR gate with its output inverted: the output is ' +
    'HIGH only when both inputs are LOW. Watch the pinout: unlike the 7400, 7408 and 7432, each gate’s ' +
    'output pin comes before its two inputs.',
  readAs: 'X equals NOT (A OR B)',
  inputLabels: ['A', 'B'],
  outputLabel: 'X',
  ...norQuad2(),
};
