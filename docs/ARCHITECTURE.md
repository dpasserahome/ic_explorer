# Architecture

_Last updated 2026-11-02 (session 4). Describes the code as it stands: all six basic-gate chips, with
the Untitled UI-style restyle (D21, D22), plus the first MSI "block" chip, the 74138 (D24)._

## Stack

| Piece | Version | Notes |
|-------|---------|-------|
| React | 18.3 | Function components and hooks. `StrictMode` is on. |
| TypeScript | 5.6 | `strict`, `noUnusedLocals`, `noUnusedParameters`. Type-checked by `npm run build` (`tsc --noEmit`). |
| Vite | 5.4 | `base: './'`, so `dist/` works from any host path. |
| Vitest | 2.1 | Config lives in `vite.config.ts` (imports `defineConfig` from `vitest/config`). |

The only other runtime dependency is **`@fontsource/inter`**, which bundles the Inter font
(weights 400–700, imported in `main.tsx`) so it works offline. There's no state library, UI kit
or charting library. Untitled UI is a *visual reference* only (D22): its look is recreated in
`styles.css`, and none of its code or components are used. All diagrams are hand-built SVG.

## Directory layout

```
src/
  main.tsx               React root; imports the Inter weights and styles.css
  App.tsx                App = side nav (+ collapsed state) + chip selection; Explorer = page layout + keyboard shortcuts
  styles.css             All styles; color tokens on :root with a dark-mode override
  sim/
    types.ts             Bit, GateKind, PinRole, PinDef, GateDef, GateChipDef, BlockChipDef, ChipDef
    logic.ts             evalGate, chipUnits, evaluateUnit, evaluateChip, truthTable, functionTable, expression, levelName
    msi.ts               MSI chip logic: decoders (138, 139, 154, 42), encoders (147, 148), muxes (151, 157), comparator85
    describe.ts          Plain-language pin/gate descriptions for the pin inspector (gate and block chips)
    logic.test.ts        Truth tables, notation, every chip's datasheet pinout, MSI references, function tables, logic views
  chips/
    index.ts             CATALOG: every chip in the nav; `chip` is undefined until built
    layouts.ts           fromGroups() pinout builder; standardQuad2(kind), norQuad2(), hexInverter()
    c7400.ts … c7486.ts  One GateChipDef per chip: content + a layouts.ts pinout
    blocks.ts            Helpers for block-chip data: pinList, patternTable, logic-tree builders, timing rows
    c74138.ts … c7485.ts One BlockChipDef per MSI chip: pins, units, function table, logic views, timing rows, presets
  state/
    useExplorer.ts       The single source of truth (waveforms + cursor) and all actions
  hooks/
    useElementSize.ts    ResizeObserver hook (used by the timing diagram)
  components/
    SideNav.tsx          Chip list; collapsible to a rail (state in App, saved in localStorage)
    Icon.tsx             Small inline line icons (chevrons, play/pause, info, chip)
    ChipHeader.tsx       Part number, title, subtitle badges, equation, read-as, overview
    ChipView.tsx         DIP package with internal gates, pin tracing, pin inspector
    BlockView.tsx        Block chips: package with one function block, active-LOW bubbles, pin inspector
    FunctionTable.tsx    Block chips: right-hand panel with Logic / Function table tabs; the table + live status line
    LogicView.tsx        Block chips: the focused output's gate tree (switches, gates, lamp) + live equations
    Barred.tsx           Draws "~E1"-style active-LOW names with an overbar (HTML and SVG)
    FocusedGate.tsx      Large single-gate view: switches, gate, lamp, live equation
    TruthTable.tsx       Computed truth table, current-row highlight, click to set inputs
    TimingDiagram.tsx    Waveforms, scrub cursor, flip-to-edit, play/step, presets
    GateSymbol.tsx       ANSI gate outline geometry (gateGeom) + <GateBody>
    noPointerFocus.ts    onMouseDown helper: mouse clicks don't focus custom controls
    pinShape.ts          pinRadius(): square input pins, round output pins (D27)
```

## Data model (`src/sim/types.ts`)

```ts
type Bit = 0 | 1;
type GateKind = 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'NOT';  // XNOR: block chips only

interface PinDef  { num: number; name: string; role: 'input' | 'output' | 'vcc' | 'gnd' | 'nc' }
interface GateDef { id: number; kind: GateKind; inputs: number[]; output: number }
interface ChipDef {
  part; title; subtitle; overview; readAs;   // content shown in the header
                                              // subtitle: phrases joined by ' · ', shown as badges
  inputLabels: string[];                      // lecture notation, e.g. ['A', 'B']
  outputLabel: string;                        // 'X'
  pins: PinDef[];                             // all pins, sorted by number
  gates: GateDef[];                           // in datasheet order
}
```

- `GateDef.id` is the 1-based datasheet number (Gate 1 = pins 1A/1B/1Y). `inputs` are in A, B
  order and hold **pin numbers**.
- Elsewhere, "gate index" (`focus`, `gi`) is the **0-based** index into `chip.gates`. The UI shows
  `gate.id`.
- The Boolean equation is not stored. It's generated by `expression(kind, terms)`, both for the
  header (`['A', 'B']`) and for the live equation (`['1', '0']`). The header uses `gates[0].kind`
  because every gate on these chips is the same kind.

## Block chips (MSI, Lecture 8; D24–D26)

`ChipDef = GateChipDef | BlockChipDef`. Gate chips have no `kind` (or `'gates'`); block chips have
`kind: 'block'`. Components switch on `kind`, never on part numbers.

```ts
interface BlockChipDef {
  kind: 'block';
  part; title; subtitle; overview; readAs; pins;
  formula: string;                  // header formula; "~Yn" is drawn Y̅n
  blockLabel: string;               // text inside the package's block
  units: BlockUnit[];               // { label, inputs, outputs }: one per decoder / mux section
  evaluate(inputs: Bit[]): Bit[];   // ONE unit, from src/sim/msi.ts
  functionTable(unit): FunctionTableDef;           // { columns, rows: { cells, match, apply }[] }
  pinInfo: Record<number, string>;  // what each signal pin does
  status(inputs, outputs, unit): string;           // live line under the function table
  timing(unit): { inputs: TimingRowDef[]; outputs: TimingRowDef[] };  // rows: one pin, or a bus
  logic(unit): LogicViewDef[];      // Logic-tab views: { tab, out, node, pin? }
  presets: { id; label; at(step): Bit[] }[];       // per-unit input patterns (+ Random, Clear)
}
type LogicNode = { pin } | { kind: GateKind; inputs: LogicNode[]; label?: string; collapsed?: string };
```

- **Active-LOW names** are written with a leading `~` (`~E1`, `~Y5`) everywhere: pin names,
  formula, overview, pin phrases, status, timing labels, tab names. `Barred` / `BarredSvg` draw the
  overbar; `plainText` gives "E1-bar" for aria labels. Wrap `<Barred>` in a `<span>` inside a
  button: buttons are flex boxes with a gap, so "1" and "~Y0" would be spaced apart.
- **Units.** `chipUnits(chip)` gives the independently driven units: one per gate, or
  `chip.units`. Units can **share pins** (the 74157's S and ~E), which is why `useExplorer` keeps
  waveforms per pin (see State model). `evaluateChip` evaluates every unit; shared inputs are read
  once.
- **Pin roles:** `input`, `output`, `vcc`, `gnd`, and `nc` (not connected; the 74147's pin 15),
  which `BlockView` draws like a power pin.
- **Function table.** Chip data builds the rows: `patternTable(pins, unitInputs, columns,
  patterns)` in `src/chips/blocks.ts` for 1/0/X rows (columns can be a subset of the unit's
  inputs; the rest are don't-care), or hand-written `match`/`apply` rows for conditions (7485:
  "A3>B3"). `functionTable(chip, unit)` in `logic.ts` **computes each output cell** by enumerating
  every input combination the row matches: `'1'`/`'0'` if fixed, else the input it follows (`"I5"`)
  or its complement (`"I5′"`), else `'?'` (a test checks there are none). Cached per chip and unit.
  Clicking a row calls `apply` on the current inputs. The highlighted row is the first that matches.
  Tables with more than 16 columns use `.dense` cells; long tables scroll with a sticky header,
  and the current row is scrolled into view.
- **Layout.** `.explorer.block`: header, then `.block-body` = `BlockView` (4fr) and `.block-right`
  (8fr), split 55/45 between the tabbed panel and `TimingDiagram`. At 1280×720 the timing SVG is
  183 px in a 187 px area on every MSI chip: no slack.
- **BlockView geometry:** `W` 440, `PITCH` 62, height from the pin count (`pins.length / 2` per
  side), so 24-pin packages just get taller (then height-bound; `.chip-svg-wrap` has 22 px top
  padding so pin 1 clears the absolutely positioned title). Wires run straight from each pin to
  the block edge; an active-LOW pin gets a bubble at the edge.
- **Panel tabs (D25).** `App` holds `tab` ('logic' | 'table', default 'logic') and `view` (index
  into `chip.logic(focus)`). `FunctionTable` renders both panes in one grid cell (`.tab-stack`).
  Its title row: Logic / Function table, unit tabs (more than one unit), view tabs (Logic tab;
  with more than 10 views the shared prefix is printed once and the tabs show suffixes).
  **Clicking a pin** in `BlockView`: focuses the pin's unit (unless the pin is shared) and opens the
  view whose `pin ?? out` is that pin (74151 data pins open their I-view), else one whose `out` is.
- **Logic tab (`LogicView`).** `evalLogic` evaluates a node; `logicExpression` writes lecture
  notation (labelled sub-gates such as `E` become their label and get their own equation line;
  collapsed nodes are written as their label). Layout (`place`):
  - Leaves (pins → switches, collapsed nodes → dashed boxes) stack on the left in first-visit order.
    Identical sub-trees are keyed (`keyOf`) and placed once, so shared inverters fan out.
  - Each gate sits in a column by height in the tree, at the mean y of its inputs; gates in a
    column are pushed apart so none overlap. Switch width grows with the longest name (IA=B).
  - Wires (`wires`): each source gets one vertical **lane** in the gap before its gate column,
    shared by all its fan-out. Lanes are ordered so wires don't cross (downward wires: higher
    source further right; upward: lower source further right) and lanes whose vertical spans don't
    overlap share an x. A wire that skips a column turns in the gap after its source **if** a gate
    in between sits in its row (the 74157's S, used raw and through an inverter).
  - The SVG viewBox fits the drawing; equations over 58 characters split onto two lines.
- **TimingDiagram** for block chips: rows come from `chip.timing(focus)`. Values per step come
  from `evaluateChip` over every pin's waveform, so a row can show any pins. One-pin rows are
  waveforms (input rows are flip targets); multi-pin rows are **buses**, a hexagon per run of equal
  `format(bits)` text, the text hidden when the run is too narrow. The label column shows the bus
  value at the cursor only if it fits beside the row's sub-label. Row minimum 22 px. Multi-unit
  chips title it "Timing diagram: decoder 2".

### How to add a block chip
1. Put its logic in `src/sim/msi.ts` (reuse `decodeActiveLow`, `binaryValue`, `toBits`).
2. Write `src/chips/cXXXX.ts` as a `BlockChipDef`, pin names from the datasheet (D20), with `~` for
   active-LOW. Helpers in `src/chips/blocks.ts`: `pinList`, `patternTable`, `pin`/`not`/`gate`/
   `collapsed` for logic trees, `addressTerms`, `bitRows`, `lowOutputBus`, `lowInputBus`.
   Keep the header to 88 px at 1280×720: `overview` about 150 characters and `readAs` short, since
   the formula is wider than on gate chips.
3. At most 7 timing rows; group inputs into buses if needed. Keep the two pattern labels short
   (about 25 characters together) so the controls stay on one line.
4. Register it in `CATALOG`. Add it to the per-chip tables in `logic.test.ts`: `MSI_PINOUTS`
   (datasheet), `REFERENCE` (an independent formula, checked over every input combination) and,
   where the datasheet has one, `TABLE_OUTPUTS`. The generic MSI tests then check unit wiring, the
   function table (no '?', every row clickable), every Logic view against `evaluate`, presets and
   timing rows.
5. Screenshot at 1280×720 and measure: header height, timing SVG vs. its area, controls height.

## Simulation (`src/sim/logic.ts`)

- `evalGate(kind, inputs)` is combinational and works for any number of inputs. XOR is odd parity.
- `evaluateChip(chip, inputPinValues)` returns values for every input and output pin.
- `truthTable(kind, n)` gives 2^n rows in binary-count order, with the first input as the MSB
  (matching the decks).
- `expression(kind, terms)` produces lecture notation: `A · B`, `A + B`, `(A · B)′`, `(A + B)′`,
  `A ⊕ B`, `A′`.

Everything shown (outputs, truth tables, timing outputs, inspector text) is computed here. Nothing
is hand-entered.

## State model (`src/state/useExplorer.ts`): the single source of truth

```
pinWaves[pin][step] : Bit                    // every input pin's waveform; STEPS = 16
cursor : step (0..15)
focus  : unit index (gate, or block-chip unit)
playing: boolean
patterns[unit] : Preset | null               // which input pattern each unit shows; null = edited
```

Waveforms are kept **per pin** so block-chip units can share pins (the 74157's S and ~E). The
hook also returns `waves[unit][input][step]`, read from `pinWaves`, for per-unit views. Editing a
pin marks every unit that uses it as edited (`markEdited`); a preset applied to one unit marks
other units sharing its pins as edited.

- **Derived:** `inputs` (pin → Bit) is the waves read at `cursor`, and `values` is
  `evaluateChip(chip, inputs)`. No component stores its own copy of pin values.
- **`pattern`** (returned) is `patterns[focus]`, the focused gate's pattern. The timing
  diagram's input-pattern control uses it to show the active pattern, or an "Edited" badge when
  it's `null`. `applyPreset` sets it. `flip` and `togglePin` clear it to `null`, and so does
  `setGateInputs`, but only if the bits actually change the waves at the cursor. It's a label
  only: it never feeds back into the waves.
- **Actions:**
  - `setFocus`
  - `setCursor(s)` and `step(±1)`, both wrapping around
  - `setPlaying`
  - `flip(gi, ii, s)`
  - `togglePin(pin)`: flips that input at the cursor; ignored for non-input pins
  - `setGateInputs(gi, bits)`: at the cursor
  - `applyPreset(preset)`: focused gate only
- **Presets:**
  - `sweep`: each combination held for 2 steps
  - `enable`: input 0 is a clock (`s % 2`); input 1 is HIGH for steps 4–11
  - `random`: uses `Math.random`, so it's not deterministic
  - `clear`
- **Initial state:** every gate gets `sweep`, offset by its gate index so the gates show different
  values at step 0. Every gate's `pattern` starts as `'sweep'`.
- **Play** advances one step every 700 ms (`PLAY_INTERVAL_MS`) and loops.
- `Explorer` is keyed by part number, so switching chips resets all state.

Why this model: toggling anything edits "the input at the current time". That keeps the timing
diagram consistent with the pins, switches and truth table without any syncing code.

## Components

**SideNav.** The chip list. The collapsed state lives in `App` (`navCollapsed`), which puts
`.nav-collapsed` on `.app`. CSS then narrows the grid column (200 px → 68 px) and hides the brand
name, group label and chip titles, leaving a rail of part numbers (each gets a `title` tooltip).
The state is saved in `localStorage` under `ic-explorer.nav-collapsed`. Reads and writes are
wrapped in try/catch so blocked storage just means it isn't remembered. The collapse control is
at the bottom of the nav and is hidden in the stacked narrow layout.

**ChipHeader.** `subtitle` is split on `' · '` and each part rendered as a `.badge`. The formula
and `readAs` sit in a tinted `.equation-block`.

**ChipView.** A fixed SVG `viewBox` (600×456) scales uniformly to fit its panel. The panel is
height-bound, so the drawing leaves its top-left corner empty, and the "Pin diagram" title is
positioned absolutely over that corner instead of taking a row. SVG font sizes are in viewBox
units and scale with the drawing (16 units ≈ 10.8 px at 1280×720).
- **Pin positions:** pins 1–7 run down the left and 14–8 down the right (`pinY`, `pinSide`; uses
  `pins.length / 2`). The constants `Y0`, `PITCH`, `PKG_*`, `GATE_*`, `BEND_X` and `OUT_X` define
  the geometry.
- **Gate routing** (`layoutGate`):
  - The gate's side comes from its first input pin.
  - The gate is centered vertically on the mean of its input pin positions.
  - Input wires run pin → `BEND_X` → the gate's input slot. Slots are assigned in pin vertical
    order so wires never cross.
  - The output wire runs gate → `OUT_X` → the output pin's y → the pin.
  - Right-side gates are mirrored with `mx()` and `scale(-1,1)`.
- **Tracing:** the hovered pin or gate decides the traced gate, and the others get `.dim`. A power
  pin traces nothing (`-1`), so nothing is dimmed.
- **Inspector:** a slim strip (top border, info icon) under the drawing. It shows the hovered
  pin, else the hovered gate, else the selected pin, else a muted usage hint. Text comes from
  `describe.ts`, with the title inline. It's deliberately **not a tooltip** (D21): a clicked pin's
  text stays put during a lecture. The strip has a **fixed 3-line height**: if hover text changed
  its height, the chip SVG above would rescale and move pins under the pointer.
- **Pin shapes (D27):** `pinRadius(role)` (`pinShape.ts`, shared with `BlockView`) makes input
  pins square and output pins round. The `pin-group` gets the pin's role as a class; CSS makes
  inputs raised (`--pin-edge` ledge via `drop-shadow`) with a hover state, outputs flat.
- **Clicks:** clicking a pin selects it, toggles it if it's an input, and focuses its gate.
  Clicking a gate's hit area focuses that gate and clears the selection.
- **Selection** is stored as `{ pin, focus }` and only shown while `focus` is unchanged, so
  switching gates by any route (tab, gate, truth table) drops a stale pin highlight.

**FocusedGate.** A fixed SVG `viewBox` (460×240) holding the switches (`role="switch"`), the
gate (`gateGeom` at h=120), the lamp, and the HTML live equation below. G1–Gn tabs (`role="tab"`,
in a `.segmented` group that wraps for the 7404's six) switch focus.

**TruthTable.** An HTML table. Rows are clickable and keyboard-activatable, and call
`setGateInputs`.

**TimingDiagram.** Drawn at its **measured pixel size** (`useElementSize`), not a scaled viewBox,
so text stays crisp and doesn't stretch.
- **Layout:** `LABEL_W` 120, `RULER_H` 24. The rows are the focused gate's inputs plus the output.
  `rowH = max(26, available / rows)`. At 1280×720 that's 28 px, with no slack.
- **Cursor:** a thin accent line through the middle of the current step, plus a pill on its
  ruler number (`headW = min(slotW - 4, 30)`).
- **Title row:** the title and, on the right, the usage hint with `<kbd>` key caps. The hint
  lives here rather than under the controls so the controls stay on one line.
- **Controls:** ‹ / › icon buttons, Play/Pause (the page's one `.primary` button), the step
  readout, and the input patterns. The patterns are a `.segmented` `radiogroup` whose checked
  item is `ex.pattern`, followed by an "Edited" badge when `ex.pattern` is `null`.
- **Pointer handling:** any pointerdown moves the cursor to that step and starts a scrub with
  pointer capture. On pointerup, if the press never left its starting step and began on a
  `[data-flip]` rect (input rows; the attribute holds the input index), that step is flipped. So
  dragging anywhere scrubs, and a click on an input step flips it.
- **Output row:** computed per step with `evalGate`. This is combinational; see "Extending to
  sequential chips".

**GateSymbol.** `gateGeom(kind, h)` returns:
- the body path
- `extra` (the second back curve for XOR)
- `bubble` (for NAND, NOR and NOT)
- `inputX(y)`, where an input wire meets the back curve
- `outX`

All six kinds have been checked rendered, in both the chip view and the focused gate.

**Icon.** `<Icon name size>` draws a small inline line icon on a 24 px grid using `currentColor`:
`chevron-left/right`, `chevrons-left/right`, `info` and `chip` are stroked; `play` and `pause`
are filled. The paths are hand-drawn in Untitled UI's line style. Add new icons to the `PATHS` or
`FILLED` maps rather than using Unicode glyphs.

## Styling

The visual reference is **Untitled UI** (D22): its gray scale, shadows, radii and component
patterns, recreated in plain CSS. Everything is in `src/styles.css`.

- **Tokens** are on `:root`, with a `prefers-color-scheme: dark` override (Untitled UI's dark
  grays). Use them; don't write raw colors.

  | Token | Use |
  |-------|-----|
  | `--bg`, `--panel`, `--nav-bg` | page, cards, side nav |
  | `--track`, `--hover` | segmented-control track, badges, active nav item; hover fills |
  | `--border`, `--border-strong` | card/divider hairlines; button and selected-segment borders |
  | `--ink`, `--ink-2`, `--muted`, `--faint` | text: primary (and printed 0s), button text, body/secondary, captions and labels |
  | `--hi`, `--hi-soft` | HIGH / 1: wires, printed 1s, HIGH fills |
  | `--lo` | LOW wires and strokes only (gray text read as "disabled", D21) |
  | `--accent`, `--accent-soft` | orange: focus ring, cursor, selection (focused gate, pin, current truth-table row) |
  | `--wave` | input waveform stroke (off-white in dark mode, so it doesn't glare) |
  | `--pin-bg`, `--vcc`, `--on-ink` | pin box fill, VCC stroke, text on `--ink` fills |
  | `--shadow-xs`, `--shadow-sm` | cards and buttons; selected segment |
  | `--radius` (12), `--radius-sm` (8) | cards; controls |

- **Shared component classes:** `button` is the secondary style by default, and `.primary`
  (dark fill) is used once, for Play. Also `.icon-btn`, `.segmented` (a gray track; the `.on`
  child is white with a border and shadow), `.badge`, `kbd`, `.panel` and `.panel-title` (with
  `.row` for a right-aligned extra). Reuse these rather than adding one-off styles.
- **Font:** Inter. `font-variant-numeric: tabular-nums` is applied only to `.truth-table`,
  `.timing-svg` and `.step-readout`. Applied to `body`, Inter's tabular "2" puts visible gaps
  in "2-input".
- **Layout:** the `.app` grid is side nav (200 px; 68 px with `.nav-collapsed`) + `.explorer`.
  `.explorer` has three rows (header, middle, timing) at `100vh`. `.middle` is chip view (7fr) +
  right column (5fr). In the right column, the focused gate takes the free space and the truth
  table takes its natural height. `.chip-header` has a `min-height` so panels don't shift between
  chips.
- **Compact mode:** `@media (min-width: 901px) and (max-height: 820px)` shrinks the header,
  truth table, panel padding, buttons and segmented controls. This keeps the focused gate large
  and **all three timing rows visible at 1280×720, which has no height to spare**. Re-measure
  the timing rows after touching any of these sizes (see `docs/STATUS.md` → Known gaps).
- **Narrow mode:** `@media (max-width: 900px)` stacks everything (a basic layout, not polished)
  and hides the nav collapse control.

## Keyboard & accessibility

- ← → step through time everywhere except text inputs. Space plays/pauses unless focus is on a
  button or another focusable control, where it activates that control instead.
- Pins, switches and truth-table rows use `noPointerFocus` on mousedown: a mouse click doesn't
  focus them (and blurs whatever was focused), so Space still means play/pause after clicking one.
  Tab still reaches them, and Space/Enter activate them when focused from the keyboard.
- Pins are `role="button"`, switches are `role="switch"` with `aria-checked`, gate selectors are
  `role="tab"`, and truth-table rows are focusable. The input patterns are a `radiogroup` of
  `role="radio"` buttons with `aria-checked`. The nav collapse button has `aria-expanded` and an
  `aria-label`. The inspector and live equation are `aria-live="polite"`. Icons are
  `aria-hidden`.
- Values are always printed as 1/0 as well as colored: 1 in `--hi` green, 0 in `--ink`.
- Known contrast gaps (green text, the cursor pill's number) are listed under bug #6 in
  `docs/STATUS.md`.

## How to add a chip

1. Create `src/chips/cXXXX.ts` exporting a `ChipDef`. Write the content (`title`, `subtitle`,
   `overview`, `readAs`) from the deck (see `docs/CONTENT-MAP.md`) in the same voice as the
   existing chips. Write `subtitle` as short phrases joined by `' · '` (each becomes a header
   badge). Keep `overview` within the existing 200–280 characters, so the header stays at its
   fixed height at 1280×720. For the pinout, add a helper to `layouts.ts` that calls
   `fromGroups(kind, [{ inputs: [pinA, pinB], y: pinY }, ...])`, one group per gate in datasheet
   order. It names pins `1A`, `1B`, `1Y`, … and adds GND (7) and VCC (14). **The datasheet
   is the authority for pinouts and pin names** (D20). The decks often have errors; the 7402 and
   7486 slides do.
2. Set `chip:` on its entry in `CATALOG` (`src/chips/index.ts`).
3. Add the chip's datasheet pin map to `PINOUTS` in `logic.test.ts`. The `describe.each` block
   then checks its pinout, gate wiring and per-gate evaluation.
4. Run `npm test` and `npm run build`, then screenshot (see `CLAUDE.md`). Visually check the gate
   shape, the ChipView routing, and that the header doesn't grow at 1280×720.
5. Update `docs/STATUS.md`.

## Extending to sequential chips (Lecture 9)

The current code is combinational-only. Known changes needed for flip-flops and registers:

- **State in the engine.** Add a per-unit `next(state, inputs) → { state, outputs }` and
  simulate the waveforms as a fold from step 0. The values at the cursor are then the simulated
  state at that step, not a pure function of the inputs at that step. `useExplorer.values` and
  the timing diagram's output row must both use this simulation. Clock edges fall naturally
  between consecutive steps.
- **Hi-Z.** Tri-state parts (74125, 74365, 74LS244) need `Level = 0 | 1 | 'Z'`, plus a third color
  and inspector wording.
- **Units, not just gates.** Generalize `GateDef` to a "unit" (gate, latch, flip-flop) with named
  inputs (D, CLK, CLR̅, PR̅) and optionally an internal netlist. The internal netlist drives the
  Focused Unit view (gate-level internals such as cross-coupled NANDs and edge detectors).
- **Active-low and clock pins:** overbar names and clock-triangle symbols.
- **Larger packages:** the 74165 and 74194 are 16-pin; the 74HCT273 and 74LS244 are 20-pin.
  `ChipView` constants and `pinY` must take the pin count into account. Complex chips likely need
  a block-level chip view with drill-down rather than every gate drawn.
- **Timing:** more rows (clock plus several outputs), possibly more than 16 steps, and per-unit
  input lists.
