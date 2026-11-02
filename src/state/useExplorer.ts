import { useCallback, useEffect, useMemo, useState } from 'react';
import { evaluateChip } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';

export const STEPS = 16;
const PLAY_INTERVAL_MS = 700;

export type Preset = 'sweep' | 'enable' | 'random' | 'clear';

/** waves[input][step] for one gate. */
type GateWaves = Bit[][];

function presetWaves(preset: Preset, nInputs: number, offset = 0): GateWaves {
  return Array.from({ length: nInputs }, (_, i) =>
    Array.from({ length: STEPS }, (_, s): Bit => {
      switch (preset) {
        case 'sweep': {
          // Each input combination held for 2 steps, counting 00, 01, 10, 11, ...
          const combo = (Math.floor(s / 2) + offset) % (1 << nInputs);
          return ((combo >> (nInputs - 1 - i)) & 1) as Bit;
        }
        case 'enable':
          // Input A is a clock; input B is an enable/control held HIGH mid-way through.
          if (i === 0) return (s % 2) as Bit;
          return s >= 4 && s < 12 ? 1 : 0;
        case 'random':
          return Math.random() < 0.5 ? 0 : 1;
        case 'clear':
          return 0;
      }
    }),
  );
}

/**
 * Single source of truth for the explorer: every gate's input waveforms plus a time cursor.
 * Pin values at any moment are the waveforms read at the cursor, so the pinout, focused gate,
 * truth table and timing diagram can never disagree. Toggling an input anywhere edits the
 * waveform at the current step.
 */
export function useExplorer(chip: ChipDef) {
  const [focus, setFocus] = useState(0);
  const [cursor, setCursorRaw] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waves, setWaves] = useState<GateWaves[]>(() =>
    chip.gates.map((g, gi) => presetWaves('sweep', g.inputs.length, gi)),
  );

  const setCursor = useCallback((s: number) => setCursorRaw(((s % STEPS) + STEPS) % STEPS), []);
  const step = useCallback((d: number) => setCursorRaw((c) => (((c + d) % STEPS) + STEPS) % STEPS), []);

  const inputs = useMemo(() => {
    const m: Record<number, Bit> = {};
    chip.gates.forEach((g, gi) => g.inputs.forEach((p, i) => (m[p] = waves[gi][i][cursor])));
    return m;
  }, [chip, waves, cursor]);

  const values = useMemo(() => evaluateChip(chip, inputs), [chip, inputs]);

  const flip = useCallback((gi: number, ii: number, s: number) => {
    setWaves((w) =>
      w.map((gw, g) =>
        g !== gi ? gw : gw.map((row, i) => (i !== ii ? row : row.map((b, k) => (k === s ? ((1 - b) as Bit) : b)))),
      ),
    );
  }, []);

  const togglePin = useCallback(
    (pin: number) => {
      const gi = chip.gates.findIndex((g) => g.inputs.includes(pin));
      if (gi < 0) return;
      flip(gi, chip.gates[gi].inputs.indexOf(pin), cursor);
    },
    [chip, cursor, flip],
  );

  const setGateInputs = useCallback(
    (gi: number, bits: Bit[]) => {
      setWaves((w) =>
        w.map((gw, g) => (g !== gi ? gw : gw.map((row, i) => row.map((b, k) => (k === cursor ? bits[i] : b))))),
      );
    },
    [cursor],
  );

  const applyPreset = useCallback(
    (p: Preset) => setWaves((w) => w.map((gw, g) => (g === focus ? presetWaves(p, gw.length) : gw))),
    [focus],
  );

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => step(1), PLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [playing, step]);

  return {
    focus,
    setFocus,
    cursor,
    setCursor,
    step,
    playing,
    setPlaying,
    waves,
    values,
    flip,
    togglePin,
    setGateInputs,
    applyPreset,
  };
}

export type Explorer = ReturnType<typeof useExplorer>;
