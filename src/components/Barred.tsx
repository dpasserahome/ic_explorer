// Active-LOW signal names are written "~E1" in chip data and drawn with an overbar, as on the
// datasheets and in the decks.
const TOKEN = /~([A-Za-z0-9]+)/g;

function parts(text: string) {
  const out: { text: string; bar: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), bar: false });
    out.push({ text: m[1], bar: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), bar: false });
  return out;
}

/** Text for screen readers and tooltips: "~E1" becomes "E1-bar". */
export const plainText = (text: string) => text.replace(TOKEN, '$1-bar');

/** HTML text with overbars. */
export function Barred({ text }: { text: string }) {
  return (
    <>
      {parts(text).map((p, i) =>
        p.bar ? (
          <span key={i} className="bar">
            {p.text}
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}

/** SVG text content with overbars. */
export function BarredSvg({ text }: { text: string }) {
  return (
    <>
      {parts(text).map((p, i) => (
        <tspan key={i} textDecoration={p.bar ? 'overline' : undefined}>
          {p.text}
        </tspan>
      ))}
    </>
  );
}
