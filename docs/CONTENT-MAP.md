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
| **7402 pinout** | 28 | Labels under pins 1–6 say 1A 1B 1Y 2A 2B 2Y, but the drawn wiring (and the datasheet) is 1Y 1A 1B 2Y 2A 2B |
| Reverse problem | 29 | Given X, find input B (a predict-mode idea) |
| Waveform generation (Johnson counter) | 30–34 | Problems 2–4 |
| Hex ICs ("six gates") | 35 | |
| Troubleshooting: logic probe/pulser | 36–39 | HIGH / LOW / floating; Problem 5 = probe table for a hex inverter |
| Common IC logic gates | 40 | |
| IEEE/IEC symbols | 41 | Source for the planned symbol toggle |
| Discussion; 7427 probe problem | 42–43 | |
| **XOR** | 44–46 | 45 = XOR built from basic gates; 46 symbol + equation |
| **7486 pinout** | 47 | Labeled A1/B1/F1 style; pins 9/10 and 12/13 have A and B swapped compared with the datasheet (no logical difference for XOR) |
| Combinational example | 48 | `X = (A + ((AB) ⊕ C))′` |
| XNOR (equality gate) | 49, 51–53 | 74266 pinout on 50 |
| Parity generator/checker | 54–61 | 74280 on 60 |
| Binary comparator; controlled inverter | 62–63, 66–67 | |
| Discussion | 64–65 | |
| Buffer; 7407 | 68–69 | |
| Tri-state buffers | 70–75 | 74125 on 72; truth table titled "74129" on 73 (probably meant 74125); 74365 on 74–75 |
| Summary | 76–83 | |

## Lecture 8: Code Converters, Multiplexers and Demultiplexers (`Lecture8_ ELN133 Code Converters, Multiplexers and Demultiplexers.pptx`, 89 slides) · MSI source

| Topic | Slides | Notes |
|-------|--------|-------|
| Objectives | 2–3 | |
| Equality comparators (XNOR) | 4–9 | 6 = 2-bit equality logic diagram |
| **7485** 4-bit magnitude comparator | 10–15 | 10 outputs A=B, A>B, A<B; 11 logic symbols; 12 cascading to 8 bits; 13–15 examples |
| Decoding basics | 16–21 | 18 decoder kinds; 20 truth tables; 21 complete octal decoder (active-LOW outputs) |
| **74138** 3-to-8 decoder | 22–24 | 23 = pin configuration, logic symbol, logic diagram, function table. **Slide error:** in the logic diagram (c), pin 10 is labeled 3̅; it's 5̅ (datasheet: pin 10 = Y̅5). The function table lists A0 A1 A2 (LSB first); the app shows A2 A1 A0 (D24) |
| **7442** BCD-to-decimal | 25 | Pin configuration, logic symbol |
| **74154** 4-to-16 decoder | 26–27 | 26 = pin configuration, logic symbol, logic diagram, function table. **Slide inconsistency:** the pinout (a) names the enables E̅0 (pin 18) and E̅1 (pin 19), but the function table (d) heads them E̅1 E̅2; the app uses E̅0 E̅1 (pinout and NXP datasheet). 27 = 5-bit decoder from two 74HC154s |
| 7-segment display; **74HC47** | 28–31, 54 | Not chosen for the app (D23) |
| Encoding basics | 32–37 | 34 = 74HC147 figure; 35 keyboard encoder |
| **74147** decimal-to-BCD priority encoder | 38–40 | 39 = logic symbol, function table; 40 example. The app uses the deck's output names A̅0–A̅3 (TI: A–D); pin 15 is NC |
| **74148** octal-to-binary priority encoder | 41–43 | 42 = logic symbol, function table; 43 example with E̅I |
| Encoder vs decoder discussion | 44 | |
| Code converters, **74184** BCD-to-binary | 45–53 | Not chosen (D23) |
| Gray code | 55–62 | 62 = binary ↔ Gray with XOR gates |
| Multiplexer basics | 63–67 | 67 = four-line mux logic diagram |
| TTL/CMOS mux table (**74157**, 74153, 74151, 74150) | 68 | Table 8-6, image only. The 74157 has no pinout slide; the app follows the NXP 74HC157 datasheet |
| **74151** 8-to-1 multiplexer | 69–74 | 69 symbol; 70 logic diagram; 71–74 mux as a logic-function generator |
| Demultiplexer basics | 75–76 | |
| **74139** dual 2-to-4 decoder/demux | 77–78 | 78 = routing to output 2a |
| 74154 as a demultiplexer | 79 | |
| 4051 analog mux/demux | 80–81, 84 | Not chosen (analog) |
| Applications: 74138 address decoder, 74148 alarm encoder, multiplexed display | 82–86 | |
| Summary | 87–89 | |

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
