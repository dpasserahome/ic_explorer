# Content map: lecture decks

Where each chip and topic appears in `Reference docs/`. Slide numbers are **positions in the
deck** (1-based), which match the `ppt/slides/slideN.xml` file numbers. They are **not** the page
numbers printed in slide footers, which differ.

To read a deck without `python-pptx`, unzip it into the scratchpad and extract the `<a:t>` text
from each `ppt/slides/slideN.xml`. Images (pinouts, timing diagrams) are in `ppt/media/`. Many
slides are image-only, so their content has to be viewed, not text-extracted.

## Lecture 2: Basic Logic Gates (`Lecture 2 Basic_Gates.pptx`, 83 slides) · v1 source

| Topic | Slides | Notes |
|-------|--------|-------|
| Objectives | 2–5 | |
| **AND** | 6–10 | 6 definition; 7 truth table ordering; 8 Boolean `X = A•B`, read as "X equals A AND B", 2^N combinations; 9 bank-alarm application (key K, door D); 10 timing analysis |
| OR waveform example | 11 | "Sketch the output waveform" |
| **OR** | 12–14 | Boolean `X = A + B`, read as "X = A or B" |
| AND as enable | 15 | |
| **7408 pinout** | 16 | |
| IC enable/disable wiring | 17 | |
| **7432 pinout** | 18 | Slide title says "7432 AND Gate", a typo in the deck (it's OR) |
| OR as disable | 19 | |
| **NOT / inverter** | 20–21 | `X = A̅` (inversion bar) |
| **7404 pinout** | 22 | |
| **NAND** | 23–24 | "Output is always HIGH unless all inputs go HIGH" |
| **7400 pinout** | 25 | |
| **NOR** | 26–27 | |
| **7402 pinout** | 28 | |
| Reverse problem | 29 | Given X, find input B (a predict-mode idea) |
| Waveform generation (Johnson counter) | 30–34 | Problems 2–4 |
| Hex ICs ("six gates") | 35 | |
| Troubleshooting: logic probe/pulser | 36–39 | HIGH / LOW / floating; Problem 5 = probe table for a hex inverter |
| Common IC logic gates | 40 | |
| IEEE/IEC symbols | 41 | Source for the planned symbol toggle |
| Discussion; 7427 probe problem | 42–43 | |
| **XOR** | 44–46 | 45 = XOR built from basic gates; 46 symbol + equation |
| **7486 pinout** | 47 | |
| Combinational example | 48 | `X = (A + ((AB) ⊕ C))′` |
| XNOR (equality gate) | 49, 51–53 | 74266 pinout on 50 |
| Parity generator/checker | 54–61 | 74280 on 60 |
| Binary comparator; controlled inverter | 62–63, 66–67 | |
| Discussion | 64–65 | |
| Buffer; 7407 | 68–69 | |
| Tri-state buffers | 70–75 | 74125 on 72; truth table titled "74129" on 73 (probably meant 74125); 74365 on 74–75 |
| Summary | 76–83 | |

## Lecture 9: Flip-Flops and Registers (`Lecture 9_ Flip-Flops and Registers.pptx`, 96 slides) · future source

| Topic | Slides | Notes |
|-------|--------|-------|
| Objectives | 2–3 | |
| S-R flip-flop | 4–10 | NOR (4–5) and NAND (6–7) cross-coupled, symbols 8, timing 9, application 10 |
| Gated S-R, gated D | 11–14 | 13 is image-only |
| **7475** D latch | 16–17 | Pin config + function table |
| **7474** D flip-flop | 18, 20–24 | Edge detection 21; sync/async inputs + setup time 23. Example 10-7 on 25; 26–27 image-only |
| Latch vs flip-flop table | 19 | |
| Master-slave J-K | 28–34 | Toggle, function table, ones catching, pulse- vs level-triggered (33) |
| Edge-triggered J-K | 35–38 | |
| **7476 / 74LS76** J-K | 39–43 | J-K as D (44), as T (45) |
| **74HCT273** octal D | 46–47 | |
| Security system | 48, 77 | 77 = VHDL/Verilog |
| **74LS121** one-shot | 49–50 | |
| Shift-register basics (SISO, SIPO, PISO, PIPO) | 51–57, 66 | 54 time-delay application |
| **74164** SIPO | 56 | |
| **74165** PISO | 58 | |
| **74194** universal | 59–63 | Mode-select table 60–61, timing waveforms 62 |
| Ring counter / traffic light | 64–65, 75–76 | |
| Serial ↔ parallel conversion | 67–69 | |
| UART | 70–71 | |
| Johnson counter | 73–74 | |
| Three-state outputs; **74LS244** | 78–79 | |
| Key terms; quiz + answers | 80–91 | |
| Summary | 92–96 | |
