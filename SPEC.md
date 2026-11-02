# IC Explorer — Product Spec

_Last updated 2026-11-02. For the reasoning behind each item see `docs/DECISIONS.md`; for build
status see `docs/STATUS.md`._

## Goal

An interactive, browser-based educational tool for exploring 74xx-series ICs. For each chip it
shows **comprehensively how the chip works**:
- what it is and what it's used for
- its pin diagram
- its internal gate diagram
- its truth table
- its timing diagram

The learner can interact with every view, for example by driving pins and scrubbing through time,
and see the effects spread through all of them.

**Core principle:** every view of a chip comes from one simulation model, so all views always
agree and stay in sync as the user interacts.

Source material:
- `Reference docs/Lecture 2 Basic_Gates.pptx`: the v1 content.
- `Reference docs/Lecture 9_ Flip-Flops and Registers.pptx`: future content.

See `docs/CONTENT-MAP.md` for slide numbers.

## Audience

Both **an instructor demoing live in lecture** and **students self-studying**.

- **Projector-first:** the whole page fits one 16:9 screen (1280×720) with no scrolling. It uses
  large type, high contrast, thick wires and clear HIGH/LOW colors.
- **Self-explanatory:** short inline explanations, and every interactive element tells you what it
  does (hover/inspector text, hints).

## Scope (v1: basic gates)

| Chip | Function | Gates/chip | Boolean (deck notation) | Pinout family |
|------|----------|------------|-------------------------|---------------|
| 7400 | Quad 2-input NAND  | 4 | X = (A · B)′ | standard quad |
| 7402 | Quad 2-input NOR   | 4 | X = (A + B)′ | **own layout: outputs first** |
| 7404 | Hex inverter (NOT) | 6 | X = A′       | own layout (hex) |
| 7408 | Quad 2-input AND   | 4 | X = A · B    | standard quad |
| 7432 | Quad 2-input OR    | 4 | X = A + B    | standard quad |
| 7486 | Quad 2-input XOR   | 4 | X = A ⊕ B    | standard quad |

All are 14-pin DIP, with VCC on pin 14 and GND on pin 7.

**Modeling assumptions (v1):**
- **Purely logical.** Signals are 0/1 only. No voltage levels, TTL vs CMOS, fan-out, or floating
  inputs.
- **Idealized timing.** Outputs change instantly with inputs. See "Deferred: propagation delay".

## Screen layout

The user approved this layout (`wireframes/wireframe-v2-user-revision.png`). The 7408
implementation matches it (`docs/img/2026-11-02-7408-first-pass-1280x720.png`).

```
┌──────────┬────────────────────────────────────────────────────────────────────┐
│          │ HEADER: 7408 │ Quad 2-input AND gate │ X = A · B      │ Overview    │
│ SIDE NAV │         (part)  4 gates · 14-pin DIP   "X equals A AND B" (what it  │
│          │                                                         is + uses)  │
│ 7400     ├──────────────────────────────────────┬─────────────────────────────┤
│ 7402     │ CHIP VIEW                            │ FOCUSED GATE   [G1 G2 G3 G4]│
│ 7404     │  DIP package, pins 1–14, internal    │  [A=1]──┐                   │
│ 7408 ◀   │  gates wired to their pins, live     │         AND )──── (X=1)     │
│ 7432     │  values beside each pin              │  [B=1]──┘                   │
│ 7486     │                                      │  X = A · B = 1 · 1 = 1      │
│          │ ┌ pin inspector (plain language) ┐   ├─────────────────────────────┤
│          │ └────────────────────────────────┘   │ TRUTH TABLE (current row)   │
│          ├──────────────────────────────────────┴─────────────────────────────┤
│          │ TIMING DIAGRAM  A / B / X over 16 steps, scrub cursor               │
│          │ ◀ ▶ Play · presets: All combinations · Clock + enable · Random · Clear│
└──────────┴────────────────────────────────────────────────────────────────────┘
```

Size priority. P1 sections must be big and always visible; P2 sections are always visible but can
be smaller.
- **P1:** header (part number and equation are the largest text), chip view, focused gate.
- **P2:** truth table, timing diagram.

The user removed these from the earlier wireframe:
- the pin reference table (the chip view and focused gate cover it)
- the applications section (a couple of typical uses go in the overview instead)
- the plain-language "rule" line
- the top bar (chip tabs went to the side nav)
- all below-the-fold content

## Sections

### Side nav
- The v1 chips in a "Basic gates" group, with the part number and short title. Chips not built
  yet are listed but disabled ("soon").
- Selecting a chip loads its page with fresh state.

### Header
- Part number (largest text on the page), title, subtitle ("4 independent gates · 14-pin DIP").
- Boolean equation, plus the deck's "read as" phrasing.
- **Overview:** two or three sentences on what the chip is, how it behaves and what it's
  typically used for, using the deck's application examples (e.g. AND as an enable gate, the
  bank-alarm example).

### Chip view (pin diagram + internal gates)
- Top-down DIP package (notch at top), pins 1–7 down the left and 14–8 up the right. Each pin
  shows its number, its datasheet name (1A, 1B, 1Y, VCC, GND) and its live value (1/0) outside the
  package.
- The internal gates are drawn inside the package and wired to their pins, like the datasheet
  connection diagrams in the deck. Wires are colored by value.
- **Pin-level signal tracing** (a must-have). Hovering a pin highlights its signal path (pin →
  gate → output pin) and dims the other gates. Clicking an input pin toggles it. Clicking any pin
  or gate makes that gate the focused gate.
- **Pin inspector** (below the package) explains the hovered or selected pin in plain language:
  - input: which gate reads it, its value, and which output pin it affects
  - output: the gate's equation with live values, and that outputs can't be set directly
  - VCC/GND: shared by every gate, and the chip does nothing without power
- It teaches that the gates on one chip are independent apart from shared power, and that pinouts
  differ between chips (on the 7402 the outputs come first).

### Focused gate
- One gate drawn large: big A/B switches (labeled with their pin numbers), the gate symbol, and a
  lamp for X. Wires are colored by value.
- A live equation fills in the current values, e.g. `X = A · B = 1 · 1 = 1`.
- Tabs (G1–G4) switch the focused gate. The truth table and timing diagram follow the focused
  gate.
- Future: for flip-flops and registers this becomes a "focused unit" showing that unit's
  internal gate-level circuit (the "boolean gate diagram" from the original requirements).

### Truth table
- 2^N rows in binary-count order (A is the MSB), as the deck teaches.
- The row matching the focused gate's current inputs is highlighted.
- Clicking a row sets those inputs everywhere.

### Timing diagram
- Rows A, B (inputs) and X (output) for the focused gate, over **16 discrete time steps**.
- **Scrubbing.** Pressing anywhere in the diagram moves the cursor column there, and dragging
  scrubs it. The pinout, focused gate and
  truth table all show the values at that step.
- **Editing.** Clicking an input row at a step (without dragging off it) flips that input at
  that step. The output
  recomputes, and the cursor jumps there.
- **Controls:** ◀ ▶ step, Play/Pause (loops), ← → keys, and Space to play/pause.
- **Presets** (apply to the focused gate):
  - All combinations: 00, 01, 10, 11, each held for 2 steps
  - Clock + enable: A is a clock, B is HIGH for steps 4–11 (the deck's enable/disable examples)
  - Random
  - Clear

## Shared state & sync

The state is each gate's input waveforms plus one time cursor. Pin values at any moment are those
waveforms read at the cursor. Toggling an input from any view (pin, switch, truth-table row)
changes that input **at the current step**. Because of this, every view always agrees, and Play
animates the whole chip.

## Technical approach

- React + TypeScript + Vite, built as a static site with a relative base, so it can be hosted
  anywhere (GitHub Pages, Netlify, an LMS). No backend.
- SVG for all diagrams.
- Chips are data files.
- The simulation engine computes everything (outputs, truth tables, timing).
- Vitest checks truth tables and datasheet pinouts.

Details: `docs/ARCHITECTURE.md`.

## Planned for v1, not yet built

- **IEEE/IEC (rectangular) symbol toggle** for the gate drawings (deck slide 41). Where the toggle
  goes is an open question, because the top bar that held it was removed.

## Deferred: propagation delay

Real gates switch a few nanoseconds after their inputs change (on the order of ~10 ns for 74LS
parts; per-chip tPLH/tPHL values to be taken from datasheets). v1 shows idealized (instant) timing,
as the user decided. Possible later addition: a "real timing" toggle that zooms the timing diagram
to show the tPLH/tPHL offset on output edges.

## Future ideas (not v1)

- **More chips from the basic-gates deck:**
  - 74266 (XNOR)
  - 7407 (buffer)
  - 74125/74365 (tri-state; needs Hi-Z)
  - 74280 (parity generator)
  - 7427 (3-input NOR)
- **Lecture 9 chips:** 7474, 7475, 7476/74LS76, 74HCT273, 74164, 74165, 74194, 74LS244, 74LS121.
- **Predict mode:** "sketch the output waveform" exercises, plus the reverse ("find the input B
  that produces this X").
- **Troubleshooting mode:** a fault (dead gate, stuck output) is injected and the user finds it
  with a virtual logic probe/pulser (deck slides 36–39, 43).
- **Application circuits:** parity generator/checker, 4-bit comparator, controlled inverter,
  Johnson-counter waveform generation.
- **Concept pages:** XOR built from basic gates, NAND/NOR universality, combinational-logic
  examples (slides 48, 53).
- **Presenter mode / "real timing" zoom:** mentioned during design, not yet requested.
