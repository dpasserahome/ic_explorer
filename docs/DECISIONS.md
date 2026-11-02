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
  printed as 1/0 too.
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
