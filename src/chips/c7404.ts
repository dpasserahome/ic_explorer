import type { ChipDef } from '../sim/types';
import { hexInverter } from './layouts';

export const c7404: ChipDef = {
  part: '7404',
  title: 'Hex inverter (NOT gate)',
  subtitle: '6 independent gates · 14-pin DIP',
  overview:
    'Six separate inverters in one package (“hex” means six). Each output is the complement of its ' +
    'input: when A is HIGH, X is LOW, and when A is LOW, X is HIGH. Used to complement (invert) a ' +
    'digital signal.',
  readAs: 'X equals NOT A',
  inputLabels: ['A'],
  outputLabel: 'X',
  ...hexInverter(),
};
