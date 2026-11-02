# Decision log

Newest entries at the bottom. **Who** marks each decision:
- **User:** stated by the user.
- **Agent → accepted:** proposed by an agent and explicitly or implicitly accepted by the user.
- **Agent (unreviewed):** an implementation choice the user hasn't weighed in on yet. Fine to
  revisit.

Quotes are the user's own words.

---

### D1 · Product goal and original requirements (2026-11-02 · User)
An interactive educational tool to explore a variety of ICs. For each chip: name, brief
description (what it is, what it's typically used for), pin-out diagram, boolean gate diagram,
truth table and timing diagram. "The point of the content above is to show the user
comprehensively how this chip works in all ways." Interactive features include scrubbing through
the timing diagram to see input/output values at each time, and changing inputs in the boolean
diagram to see results propagate. Preferably built for a web browser.
The source material is the user's lecture decks in `Reference docs/`.

### D2 · Audience: both live lecture and self-study (2026-11-02 · User)
Answer: "Both". **Implication:** projector-first sizing (fits 1280×720, large type) *and*
self-explanatory UI (inspector text, hints).

### D3 · v1 scope: basic gates first (2026-11-02 · User)
"Let's actually go with the basic gates first." This replaced the agent's suggestion of the
Lecture 9 flip-flop/register chips. The six-chip list (7400, 7402, 7404, 7408, 7432, 7486) was
confirmed: "Six-chip list is correct." The other chips in the Lecture 2 deck (74266, 7407, 74125,
74365, 74280, 7427) are deferred.

### D4 · Pin-level signal tracing is a must-have (2026-11-02 · User)
"Pin level interaction is something I'd like. Doesn't have to be like an actual breadboard, just
if I send a signal to pin x, what happens to that signal? Where is it interpreted, where does it
come out, etc." Implemented as hover tracing, click-to-toggle and the pin inspector.
These extras were offered and **not** selected for v1, so they're parked in Future ideas: concept
pages, application circuits, quiz/predict mode.

### D5 · Delivery: static web app, React + TypeScript + Vite (2026-11-02 · User)
Chosen from these options: static web app (recommended), single HTML file, or a shareable
claude.ai page.

### D6 · Idealized timing; note the delay for later (2026-11-02 · User)
"Idealized for now. Make a note of the delay, and we may do something with it visually later, but
keep it simple for now." Recorded in `SPEC.md` → "Deferred: propagation delay".

### D7 · Purely logical, no electrical detail (2026-11-02 · User)
"Purely logical for now." No voltage levels, TTL/CMOS families or floating inputs.

### D8 · One simulation model drives every view (2026-11-02 · Agent → accepted)
Each chip is defined once as data (pins + gates). The truth table, timing output and diagrams are
all computed from it, so they can't disagree. It was part of the approved spec.

### D9 · Spec approved (2026-11-02 · User)
"Looks fine for now."

### D10 · UI hierarchy: P1/P2/P3 and the projector fold (2026-11-02 · Agent → accepted)
The user asked for the most important information to be big and readable. The agent's wireframe
v1 ranked:
- **P1:** header (part number + equation), chip view, focused gate
- **P2:** truth table, timing diagram
- **P3:** overview, applications, pin table, notes, all below the fold

The pin diagram and internal gate diagram were **merged into one chip view**, because pin tracing
needs both together. The user kept this merge in their revision.

### D11 · Layout revision (2026-11-02 · User)
The user edited wireframe v1 (`wireframes/wireframe-v2-user-revision.png`):
- "Removed Pin Reference Table (role can be filled by pin diagram and focused gate)."
- "Removed applications (not necessary)." Typical uses now live in the overview text.
- "Moved overview to header."
- "Moved chip selection/nav to side nav." This also removed the top bar, including its ANSI/IEC
  toggle, presenter mode and reset placeholders.
- "Removed Rule." The plain-language rule line is gone.

### D12 · Keep the Focused Gate section as is (2026-11-02 · User)
After the agent explained it (a large single-gate view that bridges pins to logic and later becomes
the gate-level "focused unit" for flip-flops), the user chose "Keep as is" over shrinking or
removing it.

### D13 · Build the 7408 first, end to end (2026-11-02 · User)
"Do a first pass of this screen with the and chip." The agent had originally proposed the 7400.

### D14 · Implementation choices made during the 7408 build (2026-11-02 · Agent, unreviewed)
The user responded "Good" to the result but hasn't given detailed comments yet, so any of these
may change:
- Time is **16 discrete steps**. Pin values are the waveforms at the cursor, and toggling any
  input edits the waveform at the current step (this is how all views stay in sync).
- The truth table and timing diagram follow **one focused gate**. Clicking a pin or gate in the
  chip view focuses it.
- Default inputs: every gate gets the all-combinations sweep, **offset per gate**, so the chip
  isn't uniform at step 0.
- Timing presets: All combinations, Clock + enable (from the deck's enable/disable slides),
  Random, Clear.
- Colors: **HIGH green, LOW gray, orange only for focus/cursor/selection**. Values are always
  printed as 1/0 too. (D21 changed printed 0s from gray to the normal text color. D22 moved the
  palette to Untitled UI's.)
- A **compact mode** for screens ≤ 820 px tall keeps the focused gate large on 720p projectors.
- Keyboard: ← → step, Space plays/pauses (when focus isn't on a control).
- Play speed: 700 ms per step, looping.
- Nav shows not-yet-built chips as disabled "soon" items.
- Light and dark themes follow the OS setting.

### D15 · Document everything for future agents (2026-11-02 · User)
"Make sure this is fully documented - goals, status, approach, everything - for any future
agents." This produced `CLAUDE.md` (entry point) and `docs/STATUS.md`, `docs/ARCHITECTURE.md`,
`docs/DECISIONS.md` and `docs/CONTENT-MAP.md`. **Standing rule:** keep these current as work
continues.

### D16 · Repository on GitHub (2026-11-02 · User)
"Please put the repo here: https://github.com/dpasserahome/ic_explorer.git". The repo is
**public**; the default branch is `main`.

### D17 · Keep `Reference docs/` out of the public repo (2026-11-02 · Agent, unreviewed)
The lecture decks are course material that probably includes textbook figures, and anything
pushed to a public repo is effectively permanent. The folder is gitignored until the user says
otherwise. `docs/CONTENT-MAP.md` gives agents without the files a summary of the decks.

### D18 · Interaction fixes from the pre-UI review (2026-11-02 · User asked; details Agent, unreviewed)
The user asked to "document all bugs and fix 1-4" from the review (bug list in `docs/STATUS.md`).
The behavior choices were the agent's:
- **Fixed-height pin inspector** (3 lines, title inline) so hovering never rescales the chip view.
- **Mouse clicks don't focus pins, switches or truth-table rows.** Space after a click means
  play/pause, as the lecture shortcut promises. Keyboard users still Tab to them.
- **Pin selection follows gate focus.** It clears when another gate is focused or a gate is
  clicked. Hovering a gate always explains that gate.
- **Timing diagram: drag anywhere scrubs, a click on an input step flips it.** Previously input
  rows (two thirds of the diagram) only flipped on click and ignored drags.

### D19 · Remaining five chips built (2026-11-02 · User asked; content Agent, unreviewed)
"Commit and then proceed with remaining basic chips." The agent added the 7400, 7402, 7404, 7432
and 7486. Choices the user hasn't reviewed:
- **Pinouts follow the TI datasheets where the deck disagrees.** The 7402 slide's labels
  (1A/1B/1Y on pins 1–3) contradict its own wiring; the 7486 slide swaps A/B on the upper pins.
- **`readAs`** for chips the deck gives no phrasing for: "X equals NOT (A AND B)", "X equals NOT
  (A OR B)", "X equals NOT A", "X equals A XOR B". The OR phrasing is "X equals A OR B", matching
  the 7408's style rather than the deck's "X = A or B".
- **Overviews** stick to deck statements: NAND/NOR as inverted AND/OR (slides 23, 26, 80), OR as
  a disable gate (19), the inverter complementing a signal (20), XOR for parity, comparison and
  controlled inversion (44, 82). The 7402 overview points out its outputs-first pinout. The 7404
  title is "Hex inverter (NOT gate)".
- **Gate tabs wrap** onto a second row when they don't fit (the 7404's six tabs at 1024×768).

### D20 · Datasheets are authoritative, not the decks (2026-11-02 · User)
"The app should always follow data sheets. There are frequently errors in the decks." For any
technical fact (pinouts, pin names, chip behavior), the manufacturer's datasheet wins over the
lecture slides. The decks still set notation, phrasing and teaching content (D19's choices for the
7402 and 7486 are confirmed by this). Where a deck disagrees with a datasheet, follow the datasheet
and note the slide error in `docs/CONTENT-MAP.md`. There's no need to ask the user each time.

### D21 · Visual polish pass (2026-11-02 · User approved agent's proposals)
"Recommend how we can make it feel a little more polished, professional, modern. I do not want to
overcomplicate it or make it too much. It should remain educational, clear, usable." The agent
proposed eight changes, and the user approved them with one change to the nav ("Maintain the
content, but make it look a little tighter and turn it into an expandable/collapsible bar"). The
user asked whether the pin inspector would become a tooltip. The agent recommended keeping it in
place as a strip (reasons below), and the user didn't object.
- **Bigger chip view.** SVG labels enlarged; the pin inspector became a slim, borderless strip
  (still fixed at 3 lines, still in place, not a tooltip, so a clicked pin's text stays put on a
  projector); the "Pin diagram" title sits over the drawing's empty top-left corner.
- **Less orange.** Truth-table row: soft tint with a 4px accent bar. Timing cursor: thin line with
  a pill on the step number. Nav and gate tabs: a small accent marker, not an orange outline.
- **0 is ink, not gray.** Gray zeros read as "disabled". 1 stays green; 0 is normal text. Wires
  keep gray for LOW.
- **IBM Plex Sans** (bundled via `@fontsource`, works offline), tabular figures. Panel titles in
  sentence case.
- **Header:** formula and "read as" in a tinted box; header has a min-height so panels don't shift.
  The full overview is kept (2 lines would need shorter copy; not done without the user).
- **Controls:** Play is the one filled button; input presets and gate tabs are segmented groups.
- **Side nav (user's revision):** same content, tighter, and **collapsible** to a rail of part
  numbers. The state is remembered per browser (`localStorage`). The gate-icon idea was dropped.
- **Spacing/radii/borders:** 10px panels, 6px controls, softer borders; dark-mode input waveforms
  are off-white (`--wave`).

**Superseded in part by D22:** Inter replaced Plex Sans, radii became 12/8 px, the nav's active
item lost its orange bar (gray fill instead), and the gate tabs' selected segment became white
with a border instead of an orange underline.

### D22 · Untitled UI as the visual reference; input pattern shows its active state (2026-11-02 · User; details Agent → accepted)
After D21 the user said the app still looked like "something a software engineer would whip up"
and asked to "look at Untitled UI or similar production UI system for basic design look-and-feel
and UX reference." Also: "Inputs bar options in timing diagram need an active state."
- **Tokens follow Untitled UI:** its gray scale (light and dark), success green for HIGH, orange
  accent, white cards with a hairline border and `shadow-xs`, 12px card / 8px control radii.
  **Inter** replaces Plex Sans (bundled). Tabular figures only where numbers line up (tables,
  timing, step readout), since Inter's tabular "2" spaces out "2-input".
- **Buttons:** secondary (white, border, shadow) by default; Play is the one primary (dark) button.
  Line icons (`Icon.tsx`) replace the ◀ ▶ ❚❚ characters.
- **Segmented controls** (input patterns, gate tabs): gray track, selected segment is white with a
  border and shadow.
- **Active input pattern (agent's design):** tracked per gate in `useExplorer` (`pattern`). It
  starts as All combinations; flipping a step, toggling a pin or picking a different truth-table
  row clears it and shows an "Edited" badge.
- **Side nav:** logo mark, gray active item, collapse control at the bottom.
- **Header:** subtitle shown as badges. Timing hint moved into the panel's title row with key caps,
  so the controls fit on one line at 1280×720.

The user's response to the result: "Great." **Trade-off to revisit:** Untitled UI's success
green (`#079455`) is lower in contrast than the old green (3.9:1 vs 4.4:1 on white) and below
4.5:1 for the ~16 px pin values at 720p. Using success-700 (`#067647`, 5.7:1) for text is the
likely fix (`docs/STATUS.md`, bug #6).

### D23 · Add the Lecture 8 chips, one chip first (2026-11-02 · User)
"Look at the lecture 8 docs. Add the ICs from that doc." Asked which ICs and how to roll out, the
user chose: the core MSI set (74138, 74139, 74147, 74148, 74151, 7485, 7442), plus the 74154
(24-pin) and the 74157 (quad 2-to-1 mux, from the deck's Table 8-6). Not chosen: 7447, 74184,
4051. Rollout: **generalize the engine and UI, build the 74138 end to end, show screenshots, then
add the rest after review** (the same flow as the 7408).

### D24 · MSI chips as "block" chips (2026-11-02 · Agent, awaiting user review)
- **Model.** A `BlockChipDef` (`kind: 'block'`) is one function block: input and output pins in
  function-table order, an `evaluate` function in `src/sim/msi.ts`, the datasheet's function-table
  input patterns (outputs are computed), per-pin phrases, a status line, an output bus for the
  timing diagram, and its own input patterns. Gate chips are unchanged. Shared pins (e.g. the
  74157's select and enable) are why it's one block, not several units. _(Superseded by D26:
  block chips now have units, and waveforms are kept per pin so units can share pins.)_
- **Layout.** Pin diagram on the left (4fr), function table above timing on the right (8fr). The
  focused-gate panel is dropped for block chips; the function table plus status line does its job.
  This was the only arrangement found that keeps all timing rows visible at 1280×720.
- **Pin names: the 74HC138 datasheet's** (A0–A2, E̅1 E̅2 E3, Y̅0–Y̅7), which are also the deck's.
  TI's SN74LS138 uses A B C / G1 G2A G2B instead. Both are manufacturer datasheets, so D20 holds.
  Active-LOW names are written `~E1` in data and drawn with an overbar.
- **Function table columns: A2 A1 A0 (MSB first),** where the deck's table lists A0 A1 A2. Rows
  then read as binary numbers, like every other table in the app. Values are 1/0/X rather than the
  datasheet's H/L/X, matching the rest of the app (invariant 6).
- **Timing outputs as one bus row** ("which Y̅ is LOW") instead of eight rows: eight output rows
  don't fit at 720p.
- **Input patterns for the 74138:** "Count 0–7" (enabled, address counts, two steps each) and
  "Enable off" (same, with E3 LOW for steps 6–9), plus the shared Random and Clear.
- **Nav:** a second section, "MSI functions", lists all nine chips; unbuilt ones show "soon".

### D25 · MSI chips show the focused output's internal logic, tabbed with the function table (2026-11-02 · User; details Agent)
The user's review of the 74138: "you haven't shown the focused logic for the selected pin. The chip
is a black box." Offered two places for it (inside the pin diagram, or a separate panel tabbed with
the function table), the user chose: "Let's tab it with the Function Table section for now."
- **Logic tab** (default) and **Function table** tab share the right-hand panel. Both stay mounted in
  one grid cell, so the panel keeps the table's height and the timing diagram doesn't move.
- The Logic tab draws **one output's gate path** from the datasheet logic diagram (deck slide 23c):
  input switches → inverters → enable AND ("E") → that output's NAND → lamp, with live wire colors
  and two live equations (`E = E̅1′ · E̅2′ · E3 = …` and `Y̅5 = (E · A2 · A1′ · A0)′ = … = 0`). Drawing
  all eight NANDs was judged too dense for a projector.
- Choose the output with Y̅0–Y̅7 tabs, or by **clicking an output pin** (which also switches to the
  Logic tab). The focused output's pin is outlined in orange. It starts at Y̅0.
- The gates are chip data (`outputLogic`, a small gate tree per output), not drawn per part; a test
  checks each tree against `evaluate` for all 64 input combinations.
- **Side fix:** on MSI pages at short heights the step readout ("Step 0 of 15") is hidden. With
  the narrower timing panel, the "Edited" badge otherwise wrapped the controls and clipped the
  timing rows. The ruler's cursor pill already shows the step.


### D26 · The other eight Lecture 8 chips, and a general block-chip model (2026-11-02 · User asked; details Agent, awaiting review)
"Please continue with the rest of the chips in this section." Built the 74139, 74154, 7442, 74147,
74148, 74151, 74157 and 7485 on the D24/D25 pattern. What they needed from the model:
- **Units.** A block chip has one or more identical **units** (`BlockUnit`: label, input and output
  pins). The 74139 has two decoders and the 74157 four muxes, chosen with unit tabs ("Decoder 1",
  "Mux 3"). The other seven have one. Units may **share pins** (the 74157's S and E̅), so
  `useExplorer` keeps one waveform **per pin**. Editing a shared pin, or applying a pattern that
  moves one, marks every unit using it as "Edited".
- **Function tables are chip data, not bit patterns.** A row can hold a condition ("A3>B3",
  7485) as well as 1/0/X, with its own `match` and `apply`. Output cells are still computed: each
  is 1 or 0 when the row fixes it, or the input it follows ("I5" on the 74151, "I5′" for Y̅).
  A test checks there's no case the computation can't name.
- **Timing rows are chip data.** Chips with many inputs group them into **bus rows**: the 74151's
  data inputs as "I 7…0" (the 8-bit word), the 7485's A and B as numbers, the encoders' inputs as
  "which Ī is LOW", and the encoders' outputs as the code n. Every chip has at most 7 rows, which
  is what fits at 1280×720.
- **Logic tab.** Views are per output (or, on the 74151, per data input: the 8-input OR is drawn
  as one term plus a dashed "rest: other 7" box). Big sub-circuits can be **collapsed** into a
  dashed labelled box: the 7485's A>B view shows "GT: A > B" and "EQ: A = B" boxes. The 7485's
  A=B view uses **XNOR** gates (added to the gate kinds). Identical sub-paths are drawn once and
  fan out. With more than 10 outputs (74154) the tabs print the shared name once ("Y̅") and then
  0–15.
- **Pin names follow the datasheets (D20):** NXP 74HC names, which match the deck, for the
  74138/139/154/151/157 and 7442. Exceptions: the **74147** uses the deck's A̅0–A̅3 for outputs
  (TI calls them A–D); the **7485** uses TI's and the deck's A>B, A=B, A<B and IA>B, IA<B, IA=B
  (NXP prefixes them with Q). The **74157** isn't in the deck's pinouts, only Table 8-6, so it
  follows the NXP datasheet alone. The 74147's pin 15 is **NC** (a new pin role, drawn like a
  power pin).
- **7485 cascade inputs** follow TI's function table exactly when A = B, including the odd rows:
  IA>B and IA<B both HIGH with IA=B LOW gives all outputs LOW, and all three LOW gives A>B and A<B
  both HIGH.
- **Input patterns (agent's choice),** two per chip plus Random and Clear: 74139 "Count 0–3" /
  "Enable off"; 74154 "Count 0–15" / "Enable off"; 7442 "Count 0–9" / "Count 0–15"; 74147
  "One key at a time" / "Priority" (~I3 held while the others are pressed); 74148 "One input at a
  time" / "Priority" (~I2 held); 74151 "Select I0–I7" / "Watch I5"; 74157 "Switch S" / "Enable
  off"; 7485 "A counts, B = 5" / "A = B, cascade".
- **Fitting 720p.** Header copy was shortened where it pushed the header past 88 px (74147,
  74148, 7485), and pattern labels kept short so the timing controls stay on one line.

### D27 · Output pins look different from input pins (2026-11-02 · User; design Agent)
Twice the user clicked an output pin (74138 pin 7, then 7485 pin 7) expecting it to toggle. The
user: "Please make the outputs visually distinct. Look at how Untitled UI or other might indicate
a driven output."
- **References.** Untitled UI shows controls as raised (white fill, border, shadow, hover state)
  and read-only values as flat. Logic simulators (Logisim, Digital, Falstad) draw inputs as square
  switches and outputs as round lamps, as the app's Focused gate and Logic tab already do.
- **Inputs:** square boxes (5 px corners), raised with a 2 px ledge, a hover state and a pointer
  cursor. **Outputs:** round pills, flat, no hover state. On gate chips they get the default cursor;
  on MSI chips they keep the pointer because clicking one opens its Logic view. Power and NC pins
  are unchanged.
- The inspector's hint now explains it: "Square pins are inputs: click one to toggle it. Round
  pins are outputs, driven by the chip (gates)…".
- New tokens `--pin-edge` (stronger in dark mode, where the border token was nearly invisible) and
  `--hi-soft-hover`.
