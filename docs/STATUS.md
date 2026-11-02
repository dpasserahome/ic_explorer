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
| Interaction (clicks, drag-scrub, keyboard) | **not yet verified.** Only static screenshots so far; no automated UI tests |
| Narrow/mobile layout | not checked |

## Next steps (proposed order)

1. **Apply the user's feedback** on the 7408 screen (pending).
2. Click-test the interactions in a real browser: pin toggle, hover tracing, gate focus, truth-table
   row click, scrub, flip, play, presets and keyboard. Fix what breaks.
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

## Session log

- **2026-11-02.** Requirements, Q&A, both decks reviewed, spec, wireframe v1, user's layout
  revision, Focused Gate explained and kept, app scaffolded, 7408 built and checked from
  screenshots, documentation set written (`CLAUDE.md`, `docs/*`, updated `SPEC.md`, `README.md`).
  Git initialized and pushed to https://github.com/dpasserahome/ic_explorer (`main`; public),
  without `Reference docs/`.
