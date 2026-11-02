import { evalLogic, logicExpression } from '../sim/logic';
import type { Bit, BlockChipDef, LogicNode, LogicViewDef } from '../sim/types';
import { Barred, BarredSvg, plainText } from './Barred';
import { GateBody, gateGeom, type GateGeom } from './GateSymbol';
import { noPointerFocus } from './noPointerFocus';

// Drawing units; the SVG scales uniformly to fit. Inputs (switches, or boxes for collapsed
// sub-paths) are stacked on the left, gates sit in columns by depth, the output lamp is on the right.
const LEAF_PITCH = 42;
const PAD = 8;
const SWITCH_X = 8;
/** Narrowest input switch; wider for long names such as IA=B. */
const SWITCH_W = 112;
/** Rough width of one character of a switch's name, to size the switch. */
const NAME_CHAR_W = 12;
const BOX_W = 132;
const SWITCH_H = 34;
/** Space between the inputs and the first gate column. */
const GATE_GAP_X = 56;
const COL_W = 118;
const GATE_GAP = 10;
/** Widest spacing between neighbouring wire lanes; narrower when many share a gap. */
const LANE_PITCH = 14;
const LAMP_R = 26;
/** Equations longer than this go on two lines. */
const LONG_EQUATION = 58;

type Gate = Extract<LogicNode, { kind: string }>;

interface Placed {
  node: LogicNode;
  key: string;
  y: number;
  /** Right-hand end of this node's output (switch/box edge or gate output). */
  outX: number;
  leaf?: { pin?: number; box?: string };
  gate?: { x: number; h: number; geom: GateGeom; children: Placed[]; column: number };
}

const keyOf = (n: LogicNode): string =>
  'pin' in n ? `p${n.pin}` : `${n.kind}(${n.inputs.map(keyOf).join(',')})${n.label ?? ''}${n.collapsed ? '#' : ''}`;
const isLeaf = (n: LogicNode) => 'pin' in n || !!n.collapsed;
const heightOf = (n: LogicNode): number => (isLeaf(n) ? 0 : 1 + Math.max(...(n as Gate).inputs.map(heightOf)));

/** Lays out a gate tree, drawing identical sub-paths once (they fan out to every gate that uses them). */
function place(root: LogicNode, switchW: number) {
  const x0 = SWITCH_X + switchW + GATE_GAP_X;
  const placed = new Map<string, Placed>();
  const leaves: Placed[] = [];
  const gates: Placed[] = [];

  const visit = (node: LogicNode): Placed => {
    const key = keyOf(node);
    const seen = placed.get(key);
    if (seen) return seen;
    let p: Placed;
    if (isLeaf(node)) {
      const box = 'pin' in node ? undefined : node.collapsed;
      p = {
        node,
        key,
        y: PAD + leaves.length * LEAF_PITCH + LEAF_PITCH / 2,
        outX: SWITCH_X + (box ? BOX_W : switchW),
        leaf: 'pin' in node ? { pin: node.pin } : { box },
      };
      leaves.push(p);
    } else {
      const g = node as Gate;
      const children = g.inputs.map(visit);
      const h = g.kind === 'NOT' ? 26 : Math.max(44, g.inputs.length * 22);
      const column = heightOf(node) - 1;
      const geom = gateGeom(g.kind, h);
      p = { node, key, y: 0, outX: 0, gate: { x: x0 + column * COL_W, h, geom, children, column } };
      gates.push(p);
    }
    placed.set(key, p);
    return p;
  };
  const top = visit(root);

  // Column by column, left to right: each gate sits at the mean height of its inputs, then gates
  // in the column are pushed apart so none overlap.
  const columns = Math.max(0, ...gates.map((g) => g.gate!.column)) + 1;
  for (let c = 0; c < columns; c++) {
    const col = gates.filter((g) => g.gate!.column === c);
    col.forEach((g) => (g.y = g.gate!.children.reduce((a, ch) => a + ch.y, 0) / g.gate!.children.length));
    col.sort((a, b) => a.y - b.y);
    for (let i = 1; i < col.length; i++) {
      const min = col[i - 1].y + col[i - 1].gate!.h / 2 + GATE_GAP + col[i].gate!.h / 2;
      if (col[i].y < min) col[i].y = min;
    }
    col.forEach((g) => (g.outX = g.gate!.x + g.gate!.geom.outX));
  }

  const bottom = Math.max(PAD + leaves.length * LEAF_PITCH, ...gates.map((g) => g.y + g.gate!.h / 2 + PAD));
  const topEdge = Math.min(0, ...gates.map((g) => g.y - g.gate!.h / 2 - PAD));
  const lampX = top.outX + 56;
  return { top, leaves, gates, x0, lampX, width: lampX + LAMP_R + 24, y0: topEdge, height: bottom - topEdge };
}

/**
 * Wires into each gate column. Every source gets its own vertical lane in front of the column (one
 * lane even when it fans out to several gates), so different signals never share a vertical. Lanes
 * are ordered so wires don't cross: for wires heading down, the higher source turns furthest right;
 * for wires heading up, the lower one does.
 */
function wires(gates: Placed[], x0: number) {
  const out: { key: string; node: LogicNode; d: string }[] = [];
  // A lane sits in the gap just before its gate's column. A wire that skips a column and would run
  // straight through a gate there (an input used both directly and through an inverter) turns in
  // the gap after its source instead.
  const blocked = (y: number, from: number, to: number) =>
    gates.some((g) => g.gate!.column >= from && g.gate!.column < to && Math.abs(g.y - y) < g.gate!.h / 2 + 6);
  const gaps = new Map<number, Map<string, { src: Placed; ends: { y: number; x: number }[] }>>();
  for (const g of gates) {
    const { h, geom, children } = g.gate!;
    const order = children.map((_, i) => i).sort((a, b) => children[a].y - children[b].y);
    children.forEach((ch, i) => {
      const next = ch.gate ? ch.gate.column + 1 : 0;
      const gap = blocked(ch.y, next, g.gate!.column) ? next : g.gate!.column;
      const lanes = gaps.get(gap) ?? new Map();
      gaps.set(gap, lanes);
      const localY = (h * (2 * order.indexOf(i) + 1)) / (2 * children.length);
      const lane = lanes.get(ch.key) ?? { src: ch, ends: [] };
      lane.ends.push({ y: g.y - h / 2 + localY, x: g.gate!.x + geom.inputX(localY) });
      lanes.set(ch.key, lane);
    });
  }
  for (const [c, lanes] of gaps) {
    const gateX = x0 + c * COL_W;
    const all = [...lanes.values()];
    const turning = all.filter((l) => l.ends.some((e) => Math.abs(e.y - l.src.y) > 0.5));
    const down = (l: (typeof all)[number]) => l.ends.reduce((a, e) => a + e.y, 0) / l.ends.length > l.src.y;
    // Left to right: upward lanes, highest source first; then downward lanes, lowest source first.
    turning.sort((a, b) => {
      if (down(a) !== down(b)) return down(a) ? 1 : -1;
      return down(a) ? b.src.y - a.src.y : a.src.y - b.src.y;
    });
    // Lanes whose verticals don't overlap can't touch, so they share an x. Pack from the right:
    // each lane sits just left of every overlapping lane ordered after it.
    const span = (l: (typeof all)[number]) => {
      const ys = [l.src.y, ...l.ends.map((e) => e.y)];
      return [Math.min(...ys) - 2, Math.max(...ys) + 2];
    };
    const slot: number[] = [];
    for (let i = turning.length - 1; i >= 0; i--) {
      const [a0, a1] = span(turning[i]);
      slot[i] = 0;
      for (let j = i + 1; j < turning.length; j++) {
        const [b0, b1] = span(turning[j]);
        if (a0 < b1 && b0 < a1) slot[i] = Math.max(slot[i], slot[j] + 1);
      }
    }
    const right = gateX - 12;
    const left = Math.max(0, ...turning.map((l) => l.src.outX)) + 8;
    const most = Math.max(0, ...slot);
    const pitch = most ? Math.min(LANE_PITCH, Math.max(3, (right - left) / most)) : 0;
    const laneX = new Map(turning.map((l, i) => [l, right - slot[i] * pitch]));
    for (const l of all) {
      const x = laneX.get(l) ?? right;
      l.ends.forEach((e, k) =>
        out.push({ key: `${c}-${l.src.key}-${k}`, node: l.src.node, d: `M${l.src.outX},${l.src.y} H${x} V${e.y} H${e.x}` }),
      );
    }
  }
  return out;
}

/** Input pins drawn as switches (not those inside collapsed boxes). */
const pinsOf = (node: LogicNode): number[] =>
  'pin' in node ? [node.pin] : node.collapsed ? [] : node.inputs.flatMap(pinsOf);

/** Labelled sub-gates (such as the enable "E") that aren't collapsed, each once. */
function labelled(node: LogicNode, out: Gate[] = []): Gate[] {
  if ('pin' in node || node.collapsed) return out;
  if (node.label && !out.some((g) => g.label === node.label)) out.push(node);
  node.inputs.forEach((n) => labelled(n, out));
  return out;
}

interface Props {
  chip: BlockChipDef;
  values: Record<number, Bit>;
  view: LogicViewDef;
  onTogglePin: (pin: number) => void;
}

/** The gates that drive one output of a block chip, live, with its equations. */
export function LogicView({ chip, values, view, onTogglePin }: Props) {
  const root = view.node;
  const name = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const longest = Math.max(0, ...pinsOf(root).map((p) => name(p).replace(/~/g, '').length));
  const switchW = Math.max(SWITCH_W, 88 + longest * NAME_CHAR_W);
  const { top, leaves, gates, x0, lampX, width, y0, height } = place(root, switchW);
  const val = (n: LogicNode) => evalLogic(n, values);
  const lv = (b: Bit) => (b ? 'hi' : 'lo');
  const out = val(root);

  const valueTerm = (p: number) => String(values[p] ?? 0);
  const valueSub = (n: LogicNode) => ('kind' in n && n.label ? String(val(n)) : undefined);
  const lines = [
    ...labelled(root)
      .filter((g) => g !== root)
      .map((g) => ({ lhs: g.label!, node: g as LogicNode })),
    { lhs: name(view.out), node: root },
  ];

  return (
    <div className="logic-view">
      <svg
        viewBox={`0 ${y0} ${width} ${height}`}
        className="logic-svg"
        role="group"
        aria-label={`Logic for ${plainText(name(view.out))}`}
      >
        {/* Wires: each input into its slot on the gate, slots in vertical order so wires don't cross */}
        {wires(gates, x0).map((w) => (
          <path key={w.key} d={w.d} className={`wire ${lv(val(w.node))}`} />
        ))}
        <path d={`M${top.outX},${top.y} H${lampX - LAMP_R}`} className={`wire ${lv(out)}`} />

        {gates.map((g) => {
          const { x, h, geom } = g.gate!;
          const node = g.node as Gate;
          return (
            <g key={g.key}>
              <g transform={`translate(${x},${g.y - h / 2})`}>
                <GateBody geom={geom} />
              </g>
              {node.kind !== 'NOT' && h >= 44 && (
                <text x={x + h * 0.42} y={g.y + 5} className="logic-kind">
                  {node.kind}
                </text>
              )}
              {node.label && g !== top && (
                <text x={g.outX + 6} y={g.y - 8} className="logic-label">
                  {node.label}
                </text>
              )}
            </g>
          );
        })}

        {leaves.map((leaf) => {
          const b = val(leaf.node);
          if (leaf.leaf!.box) {
            return (
              <g key={leaf.key}>
                <rect
                  x={SWITCH_X}
                  y={leaf.y - SWITCH_H / 2}
                  width={BOX_W}
                  height={SWITCH_H}
                  rx={8}
                  className={`switch-box collapsed ${lv(b)}`}
                />
                <text x={SWITCH_X + 10} y={leaf.y + 5} className="logic-box-label">
                  <BarredSvg text={leaf.leaf!.box} />
                </text>
                <text x={SWITCH_X + BOX_W - 14} y={leaf.y + 8} className={`logic-switch-value ${lv(b)}`}>
                  {b}
                </text>
              </g>
            );
          }
          const p = leaf.leaf!.pin!;
          const toggle = () => onTogglePin(p);
          return (
            <g
              key={leaf.key}
              className="switch"
              role="switch"
              aria-checked={b === 1}
              aria-label={`Input ${plainText(name(p))}, pin ${p}`}
              tabIndex={0}
              onMouseDown={noPointerFocus}
              onClick={toggle}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggle();
                }
              }}
            >
              <rect
                x={SWITCH_X}
                y={leaf.y - SWITCH_H / 2}
                width={switchW}
                height={SWITCH_H}
                rx={8}
                className={`switch-box ${lv(b)}`}
              />
              <text x={SWITCH_X + 10} y={leaf.y + 6} className="logic-switch-label">
                <BarredSvg text={name(p)} />
              </text>
              <text x={SWITCH_X + switchW - 34} y={leaf.y + 5} className="switch-pin" textAnchor="end">
                pin {p}
              </text>
              <text x={SWITCH_X + switchW - 14} y={leaf.y + 8} className={`logic-switch-value ${lv(b)}`}>
                {b}
              </text>
            </g>
          );
        })}

        <circle cx={lampX} cy={top.y} r={LAMP_R} className={`lamp ${lv(out)}`} />
        <text x={lampX} y={top.y + 9} className={`logic-lamp-value ${lv(out)}`}>
          {out}
        </text>
        <text x={lampX} y={top.y - LAMP_R - 10} className="logic-lamp-label">
          <BarredSvg text={name(view.out)} />
        </text>
        <text x={lampX} y={top.y + LAMP_R + 18} className="switch-pin" textAnchor="middle">
          pin {view.out}
        </text>
      </svg>

      <div className="logic-equations" aria-live="polite">
        {lines.flatMap(({ lhs, node }) => {
          const expr = `${lhs} = ${logicExpression(node, name)}`;
          const vals = `= ${logicExpression(node, valueTerm, valueSub)} = `;
          const result = <span className={`eq-out ${lv(val(node))}`}>{val(node)}</span>;
          return expr.length + vals.length > LONG_EQUATION
            ? [
                <div key={`${lhs}-a`}>
                  <Barred text={expr} />
                </div>,
                <div key={`${lhs}-b`}>
                  <Barred text={vals} />
                  {result}
                </div>,
              ]
            : [
                <div key={lhs}>
                  <Barred text={`${expr} ${vals}`} />
                  {result}
                </div>,
              ];
        })}
      </div>
    </div>
  );
}
