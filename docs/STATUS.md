# Status

_Last updated 2026-11-02._

## Where we are

**Phase:** v1, basic gates. **1 of 6 chips built (7408).**

**Current step:** the 7408 first pass is built, and the user has seen it ("Good"). **The user's
detailed comments on the 7408 screen are pending.** They asked for full documentation before
giving them. The next session should start by collecting and applying that feedback.

Current look: `docs/img/2026-11-02-7408-first-pass-1280x720.png`.

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

## Verification so far

| Check | Result |
|-------|--------|
| `npm test` | 7 tests pass (truth tables for all kinds, notation, 7408 pinout, 7408 evaluation, catalog) |
| `npm run build` | passes (type-check + bundle) |
| Screenshots 1440×810, 1280×720, dark mode | look correct after two fixes (truth table clipping; timing label overlap) |
| Interaction (clicks, drag-scrub, keyboard) | Click-tested 2026-11-02 by driving headless Chrome over the DevTools protocol at 1024×768, 1280×720 and 1440×810. Pin toggle, hover tracing, gate focus, truth-table row click, ← →, scrub, flip and Play/Pause work after fixing review bugs #1–4 (see below). The test script isn't in the repo, so there are still no automated UI tests |
| 1024×768 (4:3 projector) | timing diagram's X row is clipped; see below |
| Narrow/mobile layout | not checked |

## Next steps (proposed order)

1. **Apply the user's feedback** on the 7408 screen (pending).
2. Fix the remaining review bugs (#5–7 under "Known gaps & limitations"), together with the
   user's feedback.
3. Add **7400, 7432, 7486**. They share `standardQuad2`, so the main work is content (overview,
   read-as) from Lecture 2 and visually checking the NAND/OR/XOR shapes, which haven't been seen
   rendered yet.
4. Add **7402** (outputs-first pinout) and **7404** (hex inverter: 6 single-input gates). Verify
   the pinouts against deck slides 28 and 22, and check ChipView routing visually.
5. **IEEE/IEC symbol toggle.** It's in the spec; where it goes is an open question (below).
6. Decide hosting (GitHub Pages / Netlify / LMS) and deploy.

## Open questions for the user

- **IEEE/IEC symbol toggle placement.** It was in the top bar, which the user removed. Options:
  side nav footer, header, or the focused-gate panel title.
- **Presenter mode.** It was in wireframe v1's top bar and dropped with it. Is it still wanted?
- **Timing diagram size/prominence.** Asked during wireframe review and never explicitly
  answered. The current size has been accepted so far.
- **Hosting target.** GitHub Pages is now the easy option, since the repo is on GitHub.
- **Reference decks in the repo?** They're kept out for now (gitignored) because the repo is
  public. Waiting on the user to confirm.

## Known gaps & limitations

- `ChipView` geometry is fixed for 14-pin DIPs where each gate's pins are all on one side (fine
  for all v1 chips; not for Lecture 9).
- The engine is combinational only (no state, clock or Hi-Z). See `docs/ARCHITECTURE.md` →
  "Extending to sequential chips".
- The OR/NOR/XOR/NAND/NOT gate shapes are implemented but haven't been seen rendered.
- The `Random` preset isn't deterministic (`Math.random`).
- Switching chips resets all state (by design: `Explorer` is keyed by part).
- The narrow-screen layout is a simple stack and hasn't been designed or checked.

### UI bugs found in the 2026-11-02 review

Numbered as reported to the user. Found by driving headless Chrome over the DevTools protocol at
1024×768, 1280×720 and 1440×810.

| # | Bug | Status |
|---|-----|--------|
| 1 | **Hover made the chip diagram jump.** Hovering a pin grew the inspector from 1–2 lines to 3, so the chip SVG shrank about 7% and the pins moved under the pointer. At 1024×768 a pin click could miss. | **Fixed.** The inspector has a fixed 3-line height, and its title now runs inline with the text. Side effect: at 1280×720 the package always renders at the smaller size (219×246 px instead of 235×265 px); see #5. |
| 2 | **Space didn't play/pause after a click on a pin, switch or truth-table row.** Those took focus on click, so Space activated them again (a clicked pin flipped back). | **Fixed.** A mouse click no longer focuses them (`noPointerFocus`). Tab still reaches them, and Space/Enter still activate them when focused from the keyboard. |
| 3 | **Sticky pin selection.** A clicked pin kept its orange outline and the inspector kept describing it after another gate was focused. While a pin was selected, hovering a gate never showed the gate's description. | **Fixed.** A selection lasts only while the gate focus it was made under is unchanged. Clicking a gate clears it. Hovering a gate always shows the gate's description. |
| 4 | **Dragging over the A/B rows did nothing.** Scrubbing only worked from the ruler and X row. A drag starting on an input row neither scrubbed nor flipped. | **Fixed.** A press anywhere moves the cursor and dragging scrubs. A click that ends on the same step it started on, over an input row, flips that step. |
| 5 | **Small text at 1280×720.** The package renders about 219×246 px, with pin names around 7–8 px and pin numbers around 10 px. The chip drawing leaves wide empty margins in its panel. The focused-gate SVG is about 140 px tall. | Open. Waiting on the user's 7408 feedback. |
| 6 | **Contrast.** `--lo` (#a3a8ae) on white is about 2.4:1, and every printed 0 uses it. In dark mode, white on the orange current-row highlight is about 2.3:1. `#fff` is hard-coded in `.truth-table tbody tr.on` and `.ruler-num.on` instead of a token. | Open. Waiting on the user's 7408 feedback. |
| 7 | **1024×768: X row clipped.** The timing controls wrap to two lines, leaving 101 px for 114 px of SVG. | Open. Depends on the user's projector resolution. |

**Screenshot caveat (tooling, not an app bug).** The CLI `--screenshot` recipe in `CLAUDE.md` can
capture the timing diagram before its ResizeObserver re-renders: rows stay at the 30 px minimum,
with a gap above the controls at 1440×810 and 1920×1080. A capture over the DevTools protocol
doesn't show this.

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
  1280×720, 1440×810 and in dark mode, all passing.
