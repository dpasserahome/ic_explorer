# IC Explorer — agent guide

An interactive, browser-based educational tool for exploring 74xx-series logic ICs. Each chip page
shows its pin diagram, internal gates, truth table and timing diagram, all live and in sync, so a
learner can see completely how the chip works. Content comes from the user's lecture decks in
`Reference docs/`.

Read this file first, then whichever doc below answers your question.

## Docs map

| File | Answers |
|------|---------|
| `SPEC.md` | **What** we're building: goals, audience, scope, screen layout, behavior |
| `docs/STATUS.md` | **Where things stand**: what's done, what's next, open questions, known gaps |
| `docs/ARCHITECTURE.md` | **How** the code works, how to add a chip, and how to extend to flip-flops |
| `docs/DECISIONS.md` | **Why**: every decision so far, who made it (user vs. agent) and its rationale |
| `docs/CONTENT-MAP.md` | Where each chip/topic lives in the lecture decks (slide numbers) |
| `wireframes/` | Layout history. `wireframe-v2-user-revision.png` is the user-approved layout |
| `docs/img/` | Dated screenshots of the app |

**Keep these current.** This project is worked on across many sessions and agents. When you finish
something, update `docs/STATUS.md`. When the user makes or changes a decision, log it in
`docs/DECISIONS.md` (and update `SPEC.md` if the product changes). When you change how the code
works, update `docs/ARCHITECTURE.md`.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # vitest: simulation engine + pinout checks
npm run build     # tsc --noEmit, then vite build → dist/ (static, relative base)
npm run preview   # serve dist/
```

## How the user likes to work

- **Iterative and review-driven.** So far the flow has been: requirements → questions → spec →
  wireframe → user edits wireframe → build one chip end to end → user review. Propose, show
  (screenshots), then wait for feedback before big scope jumps. Ask when a decision is genuinely
  theirs; otherwise pick a sensible default and say so.
- **Feedback arrives as annotated screenshots** of wireframes/builds, plus short lists of changes.
- **Follow the decks.** Match their notation and phrasing: inputs A, B, output X; `′` for complement;
  `·`, `+`, `⊕` operators; "read as" phrasing like "X equals A AND B"; HIGH/LOW and 1/0.
- **Keep v1 simple.** Don't add electrical detail, propagation delay, or new features unless asked.
  Park ideas in `SPEC.md` → "Future ideas".

## Invariants: don't break these

1. **One source of truth.** All views derive from `useExplorer` (per-gate input waveforms plus a
   time cursor). Pin values are always the waveforms read at the cursor. Never keep a separate copy
   of input/pin values in a component.
2. **Computed, never hand-entered.** Truth tables, outputs and timing outputs come from
   `src/sim/logic.ts`. Tests check them against known truth tables and datasheet pinouts.
3. **Chips are data.** A chip is a `ChipDef` in `src/chips/`. Components must not branch on
   part numbers.
4. **v1 modeling:** purely logical (0/1 only) and idealized timing (instant). No voltages,
   TTL/CMOS differences, floating inputs, or delays.
5. **Projector-first.** The whole page must fit one 1280×720 screen with no scrolling, and stay
   readable from the back of a room. Check light and dark themes.
6. **Not color alone.** Every signal value is also shown as text (1/0).

## Verifying UI changes

The unit tests don't cover rendering or interaction. After any UI change, run the dev server and
look at screenshots from headless Chrome. Check at least 1280×720 (projector), 1440×810, and dark
mode:

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1280,720 \
  --virtual-time-budget=3000 --screenshot=<scratchpad>/shot.png http://localhost:5173/
# dark mode: add --force-dark-mode --blink-settings=preferredColorScheme=0
```

Save screenshots to the session scratchpad, not the repo. Only add one to `docs/img/` (dated)
when it records a milestone.

## Conventions

- TypeScript strict, React function components and hooks. No state library, no UI kit.
- All diagrams are hand-built SVG. Styling is plain CSS in `src/styles.css`, with color tokens on
  `:root` and a `prefers-color-scheme: dark` override. Use the tokens, not raw colors.
- Signal colors: `--hi` (green) = 1/HIGH, `--lo` (gray) = 0/LOW, `--accent` (orange) =
  focus/cursor/selection only.
- Code style: 2-space indent, single quotes, semicolons, trailing commas. Comments are sparse and
  explain *why*.

## Gotchas

- **Repo:** https://github.com/dpasserahome/ic_explorer (**public**), branch `main`. Commit and push
  only when the user asks.
- **`Reference docs/` is gitignored** and exists only on the user's machine. The decks are course
  material and the repo is public. A fresh clone won't have the folder. Use
  `docs/CONTENT-MAP.md` for what's in the decks, and ask the user for the files if you need the
  slides themselves. Never commit them without the user's explicit OK.
- `Reference docs/bd706501-…png` (local only) is not project material. Ignore it.
- `python-pptx` isn't installed. To read a deck, unzip the `.pptx` into the scratchpad and pull
  the `<a:t>` text from `ppt/slides/slideN.xml`. Images are in `ppt/media/`. In both decks the
  `slideN.xml` numbers match the presentation order.
- `ChipView` geometry assumes a 14-pin DIP where each gate's pins are all on one side. See
  `docs/ARCHITECTURE.md` before adding 16-pin chips.
