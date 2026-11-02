# IC Explorer

An interactive, browser-based tool for learning how 74xx-series logic ICs work. For each chip it
shows the pin diagram, internal gates, truth table and timing diagram. All of them are live and in
sync: toggle a pin, scrub through time, and watch the signal travel through the chip.

Built for both live lecture demos (it fits a 1280×720 projector screen) and student self-study.

**Status:** v1 in progress, covering the basic gates. The 7408 (quad AND) is built; the 7400,
7402, 7404, 7432 and 7486 are next. See `docs/STATUS.md`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build    # static site in dist/; host anywhere
```

## Docs

- `SPEC.md`: what it does and why
- `docs/STATUS.md`: progress and next steps
- `docs/ARCHITECTURE.md`: how the code works, and how to add a chip
- `docs/DECISIONS.md`: decision log
- `docs/CONTENT-MAP.md`: where each topic lives in the lecture decks
- `CLAUDE.md`: guide for AI coding agents working on this project
