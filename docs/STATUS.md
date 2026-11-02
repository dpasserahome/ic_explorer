# Status

_Last updated 2026-11-02 (end of session 4)._

## Where we are

**Phase:** Lecture 8 MSI chips (D23). All six basic-gate chips are built, and the UI has the
Untitled UI restyle (D22). **The first MSI chip, the 74138 3-to-8 decoder, is built end to end
and waiting for the user's review** before the other eight are added.

**Last thing that happened:** the user asked to add the ICs from Lecture 8. They chose the core
MSI set plus the 74154 and 74157, rolled out one chip first (D23). The agent generalized the engine
and UI to "block" chips (D24) and built the 74138. Screenshots:
`docs/img/2026-11-02-74138-first-pass-1280x720.png` and `…-dark-1280x720.png`.

**Committed and pushed** as `ae80f0f` (session 3's restyle plus session 4's MSI work).

**Start the next session by:**
1. getting the user's review of the 74138 page (layout, function table, bus row, wording);
2. then building the remaining Lecture 8 chips (Next steps).

## Done

- [x] Requirements gathered. Questions asked and answered (see `docs/DECISIONS.md`).
- [x] Both lecture decks read. The slide map is in `docs/CONTENT-MAP.md`.
- [x] `SPEC.md` written and approved ("Looks fine for now"), then updated with the user's layout
      revisions.
- [x] Wireframe v1 (`wireframes/wireframe-v1.html`), then the user's revision
      (`wireframes/wireframe-v2-user-revision.png`), which is the approved layout.
- [x] Project scaffold: Vite + React + TypeScript + Vitest. Static build with a relative base.
- [x] Simulation engine (`src/sim/`): all six gate kinds, chip evaluation, truth tables, lecture
      notation, plain-language pin descriptions.
- [x] Chip data model and the shared `standardQuad2` pinout helper.
- [x] **7408 end to end:** side nav, header, chip view with pin tracing and inspector, focused
      gate, truth table, and timing diagram (scrub, flip, play/step, presets, keyboard).
- [x] Light and dark themes. Compact layout for 720p projectors. Basic stacked layout for narrow
      screens.
- [x] **7400, 7402, 7404, 7432, 7486.** Pinouts checked against the deck's slides (16, 18, 22,
      25, 28, 47) and the TI datasheets. Content written from Lecture 2. `layouts.ts` builds every
      pinout from per-gate pin groups (`standardQuad2`, `norQuad2`, `hexInverter`).
- [x] **Visual polish (D21).** Bigger chip view, a slim inspector strip under the chip (not a
      tooltip), less orange, printed 0s in normal text color instead of gray, sentence-case panel
      titles, the formula in a tinted box, a fixed header height, and a collapsible side nav.
- [x] **Untitled UI restyle (D22).**
  - Untitled UI's gray scale and shadows, with Inter as the font.
  - Secondary and primary buttons, segmented controls and badges, with line icons replacing
    ◀ ▶ ❚❚.
  - **The input pattern shows its active state**, and an "Edited" badge appears after a manual
    change.
  - The timing hint moved into the panel's title row, with key caps for ← →.

- [x] **Lecture 8 read** and mapped in `docs/CONTENT-MAP.md`.
- [x] **Block-chip support (D24):** `BlockChipDef`, units in `useExplorer`, `BlockView`,
      `FunctionTable`, timing bus rows, overbar names (`Barred`), nav sections.
- [x] **74138** end to end: datasheet pinout (74HC138 names), function table, status line,
      presets "Count 0–7" and "Enable off". 7 new tests.

## Verification so far

Session 3 checks were done after the D22 restyle unless noted.

| Check | Result |
|-------|--------|
| Session 4 (74138) | `npm test`: 31 pass (adds 74138 pinout, function table vs datasheet, X really don't-care, exhaustive 64-combination check, presets; catalog). `npm run build` passes. Measured over DevTools: **1280×720** header 88 px, timing SVG 191 px in a 195 px area (7 rows ≈ 24 px), controls on one line, no page scroll, package 188×363 px, pin names ≈11.6 px; **1440×810** fits with room to spare; dark mode checked. Interactions driven: pin click toggles (E3 → "Disabled" status, row 3 highlighted, "Edited" badge), table row click sets inputs (address 5 → Y̅5 LOW), → steps, "Enable off" preset, hovering an output pin explains it. 7408 page checked after the refactor: unchanged. **1024×768 fails** for the 74138 (see Known gaps). |
| `npm test` (session 3) | 24 tests pass: truth tables for all kinds, notation, and for each of the six chips its datasheet pinout, gate-to-pin wiring and per-gate evaluation; catalog |
| `npm run build` | passes (type-check + bundle; Inter's `.woff2` files are bundled into `dist/assets/`) |
| Screenshots (session 3) | 1280×720, 1440×810 and 1024×768 light, plus 1280×720 dark and the collapsed nav: no page scrolling at any size. **Only the 7408 was screenshotted after D22.** The 7404 (six tabs) was checked after D21 but not after D22. The other four chips weren't re-checked after the restyle, which only changed CSS and components and no chip data. |
| Rendered sizes (measured over the DevTools protocol, session 3) | **1280×720:** package 257×289 px (was 219×246); pin names, pin numbers and gate labels ≈10.8 px (were 7–10 px); focused-gate SVG 405×140; timing SVG 108 px with all three rows visible. **1440×810:** package 315×355 px, labels ≈13.3 px. **1024×768:** package 242×273 px, labels ≈10.2 px, header 141 px tall. |
| Interaction (session 3) | Driven over the DevTools protocol at 1280×720: hovering a pin fills the inspector strip; clicking an input pin toggles it and shows the "Edited" badge; choosing a preset highlights it; collapsing the nav survives a reload; the 7404 shows six gate tabs. **Not re-run this session:** a click-through of every pin on every chip, drag-scrub and keyboard shortcuts. Their code didn't change apart from the `pattern` tracking. |
| Interaction (session 2) | Pin toggle, hover tracing, gate focus, truth-table row click, ← →, scrub, flip and Play/Pause all worked at 1024×768, 1280×720 and 1440×810 after review bugs #1–4 were fixed. Every input pin on every chip was clicked; each drives only its own gate's output, with the right logic. |
| Narrow/mobile layout | not checked |

There are still **no automated UI tests**. The DevTools-protocol scripts live in session
scratchpads, not the repo. `CLAUDE.md` → "Verifying UI changes" explains how to recreate them.

## Next steps (proposed order)

1. **User review of the 74138 page** (D24 is the agent's design).
2. **The other Lecture 8 chips**, simplest first: 74139 (two decoders; probably two units or a
   shared block), 7442 (1-of-10), 74154 (24-pin; check the taller package fits), 74147 and 74148
   (priority encoders; the 74148 has EI/EO/GS), 74157 (shared select/enable), 74151 (12 inputs) and
   7485 (11 inputs). The last two need **input buses** in the timing diagram (e.g. D7–D0 as one
   row), since one row per input won't fit.
3. Contrast fixes (bug #6), content review (D19), 1024×768 (bug #7), IEEE/IEC toggle, hosting:
   unchanged from session 3.

## Open questions for the user

- **74138 page (D24):** is the layout right? In particular: no focused-gate panel for MSI chips;
  outputs as one bus row in the timing diagram; function-table columns A2 A1 A0 (the deck lists
  A0 A1 A2); 1/0/X instead of H/L/X; 74HC138 pin names (the deck's) rather than TI's A B C / G1
  G2A G2B.

- **`readAs` for NAND/NOR/NOT/XOR.** The deck only gives "read as" phrasing for AND and OR. The
  agent chose "X equals NOT (A AND B)", "X equals NOT (A OR B)", "X equals NOT A" and "X equals A
  XOR B". The user may prefer the phrasing they use in lecture (e.g. "A-bar").
- **Shorter overviews?** In D21 the agent proposed cutting the header overview to 2 lines. That
  needs shorter copy (the overviews are 200–280 characters), so the full text was kept and the
  agent offered to draft 2-line versions. The user didn't reply.
- **IEEE/IEC symbol toggle placement.** It was in the top bar, which the user removed. Options:
  the side nav footer (which now holds the collapse control, so a second control fits naturally),
  the header, or the focused-gate panel title.
- **Presenter mode.** It was in wireframe v1's top bar and dropped with it. Is it still wanted?
- **Timing diagram size/prominence.** Asked during wireframe review and never explicitly
  answered. The current size has been accepted so far.
- **Projector resolution.** Are 4:3 (1024×768) projectors in use? This decides bug #7.
- **Hosting target.** GitHub Pages is now the easy option, since the repo is on GitHub.
- **Reference decks in the repo?** They're kept out for now (gitignored) because the repo is
  public. Waiting on the user to confirm.

## Known gaps & limitations

- **74138 at 1024×768:** the header grows to 246 px (four header columns squeeze the overview)
  and the timing diagram is clipped. Depends on the 4:3 question (bug #7).
- **Nav at 720p is full:** 15 entries fill the side nav exactly at 1280×720. More chips will make
  it scroll; unbuilt entries truncate their titles ("8-to-3 priority enco…").
- The block chip view has no signal tracing (there's one block, so nothing to dim).

- `ChipView` (gate chips) is fixed for 14-pin DIPs where each gate's pins are all on one side.
  `BlockView` (MSI chips) handles any pin count.
- The engine is combinational only (no state, clock or Hi-Z). See `docs/ARCHITECTURE.md` →
  "Extending to sequential chips".
- **The 720p layout has no spare height.** At 1280×720 the timing SVG gets 108 px for 24 px of
  ruler plus three 28 px rows. Anything that makes the timing title, the controls or the header
  taller clips the X row. D22's 36 px buttons did, and the fix was the compact-mode overrides in
  `styles.css`. Re-measure after any change there.
- The header has a min-height, so panels don't shift between chips at 1280×720 and up. At
  1024×768 the 7408's overview wraps to 6 lines and that chip's header grows to 141 px.
- The timing hint in the panel's title row truncates with "…" when the panel is narrow (it fits
  at 1024 px and wider).
- The "Edited" badge appears and disappears next to the input pattern, so that row's width
  changes. At 1024×768 this wraps the controls (bug #7).
- The icons in `Icon.tsx` are hand-drawn in Untitled UI's line style; they aren't taken from
  Untitled UI's icon set.
- The `Random` preset isn't deterministic (`Math.random`).
- Switching chips resets all state, including each gate's input pattern (by design: `Explorer`
  is keyed by part).
- The narrow-screen layout is a simple stack and hasn't been designed or checked.

### UI bugs found in the 2026-11-02 review

Numbered as reported to the user. Found by driving headless Chrome over the DevTools protocol at
1024×768, 1280×720 and 1440×810.

| # | Bug | Status |
|---|-----|--------|
| 1 | **Hover made the chip diagram jump.** Hovering a pin grew the inspector from 1–2 lines to 3, so the chip SVG shrank about 7% and the pins moved under the pointer. At 1024×768 a pin click could miss. | **Fixed** (session 2). The inspector has a fixed 3-line height, and its title runs inline with the text. Since D21 it's a borderless strip, still a fixed 3 lines. |
| 2 | **Space didn't play/pause after a click on a pin, switch or truth-table row.** Those took focus on click, so Space activated them again (a clicked pin flipped back). | **Fixed.** A mouse click no longer focuses them (`noPointerFocus`). Tab still reaches them, and Space/Enter still activate them when focused from the keyboard. |
| 3 | **Sticky pin selection.** A clicked pin kept its orange outline and the inspector kept describing it after another gate was focused. While a pin was selected, hovering a gate never showed the gate's description. | **Fixed.** A selection lasts only while the gate focus it was made under is unchanged. Clicking a gate clears it. Hovering a gate always shows the gate's description. |
| 4 | **Dragging over the A/B rows did nothing.** Scrubbing only worked from the ruler and X row. A drag starting on an input row neither scrubbed nor flipped. | **Fixed.** A press anywhere moves the cursor and dragging scrubs. A click that ends on the same step it started on, over an input row, flips that step. |
| 5 | **Small text at 1280×720.** The package rendered about 219×246 px, with pin names around 7–8 px and pin numbers around 10 px. The focused-gate SVG was about 140 px tall. | **Improved (D21), still open.** The package is now 257×289 px and the labels about 10.8 px (measured). The labels are still small for the back of a room, and the focused-gate SVG is still about 140 px tall at 720p. The chip panel is height-bound, so more size has to come from vertical space. |
| 6 | **Contrast.** Printed 0s used `--lo` (2.4:1). White on the orange current-row highlight was about 2.3:1 in dark mode. `#fff` was hard-coded. | **Partly fixed (D21/D22).** Printed 0s use `--ink` (17.8:1). The current truth-table row is ink on a light tint (15.9:1 light, 12.7:1 dark). **Still open:** (a) **green 1s** use Untitled's success-600 `#079455`, which is 3.9:1 on white. That passes only for large text, and pin values render about 16 px at 720p. The old `#2b8a3e` was 4.4:1; Untitled's success-700 `#067647` would be 5.7:1. (b) The **white step number on the orange cursor pill** is 3.2:1 in light mode and 2.5:1 in dark mode, and `#fff` is still hard-coded in `.ruler-num.on`. (c) LOW wires (`--lo` `#98a2b3`) are 2.6:1 on white. They're graphics, not text, and the gray is deliberate for LOW, but WCAG asks 3:1 for graphics. |
| 7 | **1024×768: X row clipped.** The timing controls wrap to two lines, leaving too little height for the SVG. | **Open, narrower.** With a fresh page, the controls fit on one line at 1024×768 and all rows show (measured). Once the "Edited" badge appears, the controls wrap and the X row is clipped. Collapsing the side nav avoids it. Depends on the user's projector resolution. |

**Screenshot caveat (tooling, not an app bug).** The CLI `--screenshot` recipe in `CLAUDE.md` can
capture the timing diagram before its ResizeObserver re-renders: rows stay at their minimum
height, with a gap above the controls at 1440×810 and 1920×1080. A capture over the DevTools
protocol doesn't show this. Also, passing `--user-data-dir` to the CLI `--screenshot` recipe made
Chrome hang in session 3.

## Session log

- **2026-11-02.** Requirements, Q&A, both decks reviewed, spec, wireframe v1, user's layout
  revision, Focused Gate explained and kept, app scaffolded, 7408 built and checked from
  screenshots, documentation set written (`CLAUDE.md`, `docs/*`, updated `SPEC.md`, `README.md`).
  Git initialized and pushed to https://github.com/dpasserahome/ic_explorer (`main`; public),
  without `Reference docs/`.
- **2026-11-02 (session 2).** Reviewed the project before UI work. Tests and build pass.
  Interactions click-tested over the DevTools protocol, and seven UI bugs logged under "Known gaps
  & limitations". At the user's request, fixed #1–4 (inspector height, Space after a click, sticky
  pin selection, drag to scrub over input rows). Re-verified with 18 scripted checks at 1024×768,
  1280×720, 1440×810 and in dark mode, all passing. Committed (`f5bf1ab`). Then added the
  other five chips (7400, 7402, 7404, 7432, 7486), fixed six gate tabs overflowing at 1024×768,
  and fixed "pins 1" wording for single-input gates. Committed (`2673b71`).
- **2026-11-02 (session 3).** The user asked how to make the UI feel more polished without
  overcomplicating it. The agent proposed eight changes; the user approved them, asked that the
  side nav be tightened and made collapsible, and asked whether the pin inspector would become a
  tooltip (no: it stays in place as a slim strip). Built as D21 (IBM Plex Sans at that point).
  The user then asked for an active state on the input patterns and for Untitled UI as the
  look-and-feel reference. Built as D22: Inter, Untitled UI tokens, buttons, segmented controls,
  badges, icons, and `pattern` tracking in `useExplorer`. Twice the timing X row got clipped at
  720p and was fixed with compact-mode overrides. The user replied "Great." Docs brought up to
  date, with measured sizes and contrast for bugs #5–7. **Not committed.**
- **2026-11-02 (session 4).** The user asked to start the server and add the ICs from Lecture 8.
  The deck was read and mapped. The user chose the chips and a one-chip-first rollout (D23). The
  agent added block-chip support (D24) and built the 74138, verified with tests, measurements
  and scripted interactions at 1280×720, 1440×810 and in dark mode. Committed and pushed (`ae80f0f`).
