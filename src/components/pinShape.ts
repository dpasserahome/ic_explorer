import type { PinRole } from '../sim/types';

/**
 * Corner radius of a pin box. Inputs are square, like switches; outputs are round, like lamps (the
 * convention in logic simulators, and how the Logic tab draws them). The styles in styles.css
 * add the rest: inputs are raised and react to hover, outputs are flat.
 */
export const pinRadius = (role: PinRole, h: number) => (role === 'output' ? h / 2 : role === 'input' ? 5 : 3);
