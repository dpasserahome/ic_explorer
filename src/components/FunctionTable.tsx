import { useEffect, useRef } from 'react';
import { functionTable } from '../sim/logic';
import type { Bit, BlockChipDef } from '../sim/types';
import { Barred, plainText } from './Barred';
import { LogicView } from './LogicView';
import { noPointerFocus } from './noPointerFocus';

export type BlockTab = 'logic' | 'table';

/** Tables wider than this many columns get narrower cells (the 74154 has 22). */
const DENSE_COLUMNS = 16;
/** More output tabs than this are labelled by their shared name once, then just the suffixes. */
const MAX_TABS = 10;

function commonPrefix(names: string[]) {
  let n = 0;
  while (names.every((s) => s.length > n && s[n] === names[0][n])) n++;
  // Keep whole digits: "~Y1" and "~Y10" share "~Y1", but the prefix is "~Y".
  return names[0].slice(0, n).replace(/\d+$/, '');
}

interface Props {
  chip: BlockChipDef;
  values: Record<number, Bit>;
  /** Focused unit. */
  focus: number;
  onFocus: (unit: number) => void;
  onSetInputs: (unit: number, bits: Bit[]) => void;
  tab: BlockTab;
  onTab: (tab: BlockTab) => void;
  /** Focused Logic-tab view, an index into chip.logic(focus). */
  view: number;
  onView: (view: number) => void;
  onTogglePin: (pin: number) => void;
}

/**
 * Block chips' right-hand panel, in two tabs for the focused unit: the gate-level logic of one
 * output, and the datasheet's function table with computed outputs and the live state. Both panes
 * share one grid cell, so switching tabs never moves the timing diagram below.
 */
export function FunctionTable(props: Props) {
  const { chip, values, focus, onFocus, onSetInputs, tab, onTab, view, onView, onTogglePin } = props;
  const unit = chip.units[focus];
  const table = chip.functionTable(focus);
  const rows = functionTable(chip, focus);
  const views = chip.logic(focus);
  const current = unit.inputs.map((p): Bit => values[p] ?? 0);
  const outs = unit.outputs.map((p): Bit => values[p] ?? 0);
  // Several rows can match (overlapping don't-cares); highlight the first, as the datasheet is read.
  const on = rows.findIndex((r) => r.def.match(current));
  const name = (p: number) => chip.pins.find((x) => x.num === p)!.name;
  const apply = (r: number) => onSetInputs(focus, rows[r].def.apply(current));
  const dense = table.columns.length + unit.outputs.length > DENSE_COLUMNS;
  // Too many output tabs for one row (the 74154's sixteen): print the shared name once, tabs 0–15.
  const prefix = views.length > MAX_TABS ? commonPrefix(views.map((v) => v.tab)) : '';

  // Long tables (the 74154's 19 rows) scroll; keep the current row in view.
  const onRef = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    onRef.current?.scrollIntoView({ block: 'nearest' });
  }, [on, focus, tab]);

  return (
    <section className="panel truth function">
      <div className="panel-title row">
        <span className="segmented view-tabs" role="tablist" aria-label="View">
          {(
            [
              ['logic', 'Logic'],
              ['table', 'Function table'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              className={tab === id ? 'tab on' : 'tab'}
              onClick={() => onTab(id)}
            >
              {label}
            </button>
          ))}
        </span>
        <span className="title-controls">
          {chip.units.length > 1 && (
            <span className="segmented gate-tabs" role="tablist" aria-label="Choose unit">
              {chip.units.map((u, k) => (
                <button
                  key={u.label}
                  role="tab"
                  aria-selected={k === focus}
                  className={k === focus ? 'tab on' : 'tab'}
                  onClick={() => onFocus(k)}
                >
                  {u.label}
                </button>
              ))}
            </span>
          )}
          {tab === 'logic' && views.length > 1 && (
            <>
              {prefix && (
                <span className="control-label">
                  <Barred text={prefix} />
                </span>
              )}
              <span className={prefix ? 'segmented gate-tabs narrow' : 'segmented gate-tabs'} role="tablist" aria-label="Choose output">
                {views.map((v, k) => (
                  <button
                    key={v.tab}
                    role="tab"
                    aria-selected={k === view}
                    aria-label={prefix ? plainText(v.tab) : undefined}
                    className={k === view ? 'tab on' : 'tab'}
                    onClick={() => onView(k)}
                  >
                    {/* One span: buttons are flex boxes, so "1" and "~Y0" would sit a gap apart */}
                    <span>
                      <Barred text={v.tab.slice(prefix.length)} />
                    </span>
                  </button>
                ))}
              </span>
            </>
          )}
          {tab === 'table' && chip.units.length === 1 && (
            <span className="hint">X = don’t care · click a row to set the inputs</span>
          )}
        </span>
      </div>
      <div className="tab-stack">
        <div className={tab === 'logic' ? 'tab-pane logic-pane' : 'tab-pane logic-pane hidden'}>
          <LogicView
            chip={chip}
            values={values}
            view={views[Math.min(view, views.length - 1)]}
            onTogglePin={onTogglePin}
          />
        </div>
        <div className={tab === 'table' ? 'tab-pane table-pane' : 'tab-pane table-pane hidden'}>
          <div className="table-scroll">
            <table className={dense ? 'truth-table function-table dense' : 'truth-table function-table'}>
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th key={c}>
                      <Barred text={c} />
                    </th>
                  ))}
                  {unit.outputs.map((p, i) => (
                    <th key={p} className={i === 0 ? 'out-col' : undefined}>
                      <Barred text={name(p)} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, r) => (
                  <tr
                    key={r}
                    ref={r === on ? onRef : undefined}
                    className={r === on ? 'on' : undefined}
                    onMouseDown={noPointerFocus}
                    onClick={() => apply(r)}
                    tabIndex={0}
                    aria-current={r === on ? 'true' : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        apply(r);
                      }
                    }}
                  >
                    {row.def.cells.map((c, i) => (
                      <td key={i} className={c === 'X' ? 'dc' : c.length > 1 ? 'cond' : undefined}>
                        {c}
                      </td>
                    ))}
                    {row.outputs.map((c, i) => (
                      <td
                        key={`o${i}`}
                        className={`${i === 0 ? 'out-col ' : ''}${c === '1' ? 'hi' : c === '0' ? 'lo' : 'sym'}`}
                      >
                        <Barred text={c} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="status-line" aria-live="polite">
            <Barred text={chip.status(current, outs, focus)} />
          </div>
        </div>
      </div>
    </section>
  );
}
