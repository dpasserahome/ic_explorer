import { useCallback, useEffect, useMemo, useState } from 'react';
import { chipUnits, evaluateChip } from '../sim/logic';
import type { Bit, ChipDef } from '../sim/types';

export const STEPS = 16;
const PLAY_INTERVAL_MS = 700;

/** Input-pattern id: 'sweep' | 'enable' | 'random' | 'clear' for gates, or a block chip's own presets. */
export type Preset = string;

export const GATE_PRESETS: { id: Preset; label: string }[] = [
  { id: 'sweep', label: 'All combinations' },
  { id: 'enable', label: 'Clock + enable' },
  { id: 'random', label: 'Random' },
  { id: 'clear', label: 'Clear' },
];

/** The input patterns offered for a chip: a block chip's own, then Random and Clear. */
export function chipPresets(chip: ChipDef): { id: Preset; label: string }[] {
  if (chip.kind !== 'block') return GATE_PRESETS;
  return [...chip.presets.map(({ id, label }) => ({ id, label })), ...GATE_PRESETS.slice(2)];
}

/** waves[input][step] for one unit (a gate, or a block chip's whole function block). */
type GateWaves = Bit[][];

function presetWaves(chip: ChipDef, preset: Preset, nInputs: number, offset = 0): GateWaves {
  const own = chip.kind === 'block' ? chip.presets.find((p) => p.id === preset) : undefined;
  if (own) {
    const steps = Array.from({ length: STEPS }, (_, s) => own.at(s));
    return Array.from({ length: nInputs }, (_, i) => steps.map((bits) => bits[i]));
  }
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
        default:
          return 0;
      }
    }),
  );
}

/** Pin → waveform. */
type PinWaves = Record<number, Bit[]>;

/** Writes a unit's per-input waveforms onto its pins. */
const withUnitWaves = (w: PinWaves, pins: number[], unitWaves: GateWaves): PinWaves => {
  const next = { ...w };
  pins.forEach((p, i) => (next[p] = unitWaves[i]));
  return next;
};

/**
 * Single source of truth for the explorer: every input pin's waveform plus a time cursor. Pin
 * values at any moment are the waveforms read at the cursor, so the pinout, focused gate, tables
 * and timing diagram can never disagree. Toggling an input anywhere edits the waveform at the
 * current step. Waveforms are kept per pin (not per unit) because block-chip units can share pins
 * (the 74157's S and ~E).
 */
export function useExplorer(chip: ChipDef) {
  const units = useMemo(() => chipUnits(chip), [chip]);
  const initialPreset = chip.kind === 'block' ? chip.presets[0].id : 'sweep';
  const [focus, setFocus] = useState(0);
  const [cursor, setCursorRaw] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pinWaves, setPinWaves] = useState<PinWaves>(() =>
    units.reduce<PinWaves>(
      (w, u, gi) => withUnitWaves(w, u.inputs, presetWaves(chip, initialPreset, u.inputs.length, gi)),
      {},
    ),
  );
  // Which input pattern each unit is showing; null once the learner has edited its waveforms.
  const [patterns, setPatterns] = useState<(Preset | null)[]>(() => units.map(() => initialPreset));
  // Editing a pin edits every unit that uses it.
  const markEdited = useCallback(
    (pin: number) => setPatterns((p) => p.map((x, g) => (units[g].inputs.includes(pin) ? null : x))),
    [units],
  );

  const setCursor = useCallback((s: number) => setCursorRaw(((s % STEPS) + STEPS) % STEPS), []);
  const step = useCallback((d: number) => setCursorRaw((c) => (((c + d) % STEPS) + STEPS) % STEPS), []);

  /** waves[unit][input][step], read from the pin waveforms. */
  const waves = useMemo(() => units.map((u) => u.inputs.map((p) => pinWaves[p])), [units, pinWaves]);

  const inputs = useMemo(() => {
    const m: Record<number, Bit> = {};
    for (const [p, w] of Object.entries(pinWaves)) m[Number(p)] = w[cursor];
    return m;
  }, [pinWaves, cursor]);

  const values = useMemo(() => evaluateChip(chip, inputs), [chip, inputs]);

  const flipPin = useCallback(
    (pin: number, s: number) => {
      markEdited(pin);
      setPinWaves((w) => ({ ...w, [pin]: w[pin].map((b, k) => (k === s ? ((1 - b) as Bit) : b)) }));
    },
    [markEdited],
  );

  const flip = useCallback((gi: number, ii: number, s: number) => flipPin(units[gi].inputs[ii], s), [units, flipPin]);

  const togglePin = useCallback(
    (pin: number) => {
      if (pin in pinWaves) flipPin(pin, cursor);
    },
    [pinWaves, cursor, flipPin],
  );

  const setGateInputs = useCallback(
    (gi: number, bits: Bit[]) => {
      const pins = units[gi].inputs;
      pins.forEach((p, i) => pinWaves[p][cursor] !== bits[i] && markEdited(p));
      setPinWaves((w) => {
        const next = { ...w };
        pins.forEach((p, i) => (next[p] = w[p].map((b, k) => (k === cursor ? bits[i] : b))));
        return next;
      });
    },
    [units, cursor, pinWaves, markEdited],
  );

  const applyPreset = useCallback(
    (p: Preset) => {
      const pins = units[focus].inputs;
      // A preset on one unit also moves pins it shares, so other units sharing them show as edited.
      setPatterns((ps) =>
        ps.map((x, g) => (g === focus ? p : units[g].inputs.some((q) => pins.includes(q)) ? null : x)),
      );
      setPinWaves((w) => withUnitWaves(w, pins, presetWaves(chip, p, pins.length)));
    },
    [chip, units, focus],
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
    pinWaves,
    pattern: patterns[focus],
    values,
    flip,
    togglePin,
    setGateInputs,
    applyPreset,
  };
}

export type Explorer = ReturnType<typeof useExplorer>;
