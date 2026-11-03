// The reader of A3's Arabic sweep (moved here from test-0.3.0-arabic-sweep.mjs for X2, no behaviour change): every
// text a viewer sees in a written report's files, the texts of the TMDL scripts whose measures draw text on a page, and
// the Latin-letter runs of a text. Used by the sweep and by test-0.3.1-bilingual-report.mjs. Not a test of its own.
import fs from 'node:fs';
import path from 'node:path';

const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const ISO = /[⁦-⁩‎‏]/g;

// ---------------------------------------------------------------- the reader: every text a viewer sees ----------------
// the formatting properties whose quoted literal is a text a person reads
export const TEXT_PROPS = new Set(['text', 'altText', 'showBlankAs', 'titleText', 'subTitleText', 'tooltipText', 'placeholderText', 'labelText', 'headerText',
  'enabledTooltip', 'disabledTooltip', 'tooltip', 'customLabel', 'legendText', 'calloutText', 'displayName']);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' && /^'.*'$/s.test(p.expr.Literal.Value) ? p.expr.Literal.Value.slice(1, -1).replace(/''/g, "'") : null);
// the report measures a visual uses ("Entity\0Name"): only those of reportExtensions.json are shown
const usedMeasures = (files) => { const used = new Set(); const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!o || typeof o !== 'object') return;
  if (o.Measure && o.Measure.Expression && o.Measure.Expression.SourceRef && o.Measure.Expression.SourceRef.Schema === 'extension') used.add(o.Measure.Expression.SourceRef.Entity + '\u0000' + o.Measure.Property);
  Object.values(o).forEach(walk); }; Object.entries(files).filter(([f]) => /visual\.json$/.test(f)).forEach(([, j]) => walk(j)); return used; };
// a DAX string literal that is a format string (FORMAT's second argument), never shown as such
const isFormat = (t) => /^[#0.,%;+\-\s()$€£¥:/\\EeHhMmSsDdYyAPap"]*$/.test(t) && /[#0]|^(d{1,4}|m{1,4}|y{2,4}|[dmy ]+|hh?:nn?(:ss)?)$/i.test(t.replace(/[\s/:.-]/g, ''));
// the visible words of a DAX text: an SVG picture's text nodes, else the literal as it is
const svgText = (s) => { let t = s; try { t = decodeURIComponent(s.replace(/%(?![0-9A-Fa-f]{2})/g, '%25')); } catch (e) { /* as it is */ }
  if (!/^data:image\/svg|<svg|<\/div>|<div/.test(t)) return [t];
  return t.replace(/^data:image\/svg\+xml;utf8,/, '').replace(/<style>[\s\S]*?<\/style>/g, ' ').split(/<[^>]*>/).map((x) => x.trim()).filter(Boolean); };
const daxStrings = (expr) => (String(expr).match(/"(?:[^"]|"")*"/g) || []).map((s) => s.slice(1, -1).replace(/""/g, '"'));
const daxTexts = (expr) => daxStrings(expr).filter((t) => !isFormat(t) && !/^&[a-z]+;$/.test(t)).flatMap(svgText).filter((t) => /\p{L}/u.test(t));

// texts: [{ where, what, s }]; pages: the page ids whose visuals count (null: all); keys: every other literal property
// that holds Latin letters (to prove no text property is missed: printed with A3_DUMP)
export function shownTexts(files, pages) {
  const out = [], other = [], used = usedMeasures(files);
  const onPage = (f) => { if (!pages) return true; const m = f.match(/^definition\/pages\/([^/]+)\//); return !!m && pages.has(m[1]); };
  const walk = (o, where, obj) => {
    if (Array.isArray(o)) { o.forEach((x) => walk(x, where, obj)); return; }
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)) {
      if (k === 'properties' && v && typeof v === 'object') Object.entries(v).forEach(([pk, pv]) => { const s = lit(pv); if (s == null) return; if (TEXT_PROPS.has(pk)) { if (/\p{L}/u.test(s)) out.push({ where, what: `${obj}.${pk}`, s }); } else if (/[A-Za-z]/.test(s)) other.push({ where, what: `${obj}.${pk}`, s }); });
      if (k === 'textRuns' && Array.isArray(v)) v.forEach((t) => t && typeof t.value === 'string' && t.value.trim() && out.push({ where, what: 'text box', s: t.value }));
      if (k === 'projections' && Array.isArray(v)) v.forEach((p) => p && typeof p.displayName === 'string' && p.displayName.trim() && out.push({ where, what: 'field header', s: p.displayName }));
      walk(v, where, k === 'properties' ? obj : k);
    }
  };
  for (const [f, j] of Object.entries(files)) {
    if (/page\.json$/.test(f) && onPage(f) && j.displayName) out.push({ where: f, what: 'page name', s: j.displayName });
    if (/\.bookmark\.json$/.test(f) && j.displayName && (!pages || pages.has(((j.explorationState || {}).activeSection) || ''))) out.push({ where: f, what: 'bookmark name', s: j.displayName });
    if (/(visual|mobile|page)\.json$/.test(f) && onPage(f)) walk(j, f, '');
  }
  // the report measures the counted pages' visuals show
  const usedHere = usedMeasures(Object.fromEntries(Object.entries(files).filter(([f]) => onPage(f))));
  const ext = files['definition/reportExtensions.json'];
  if (ext) (ext.entities || []).forEach((e) => (e.measures || []).forEach((m) => { if (usedHere.has(e.name + '\u0000' + m.name) && typeof m.expression === 'string') daxTexts(m.expression).forEach((t) => out.push({ where: 'reportExtensions ' + m.name, what: 'measure text', s: t })); }));
  void used;
  return { texts: out, other };
}
// the TMDL scripts written next to the project whose measures put text on a page: the switcher's labels (its
// partition's rows) and its title measure, the flip cards' faces (picture measures)
export function scriptTexts(file) {
  const t = fs.readFileSync(file, 'utf8'), out = [], base = path.basename(file);
  if (/metric switcher\.tmdl$/.test(base)) {
    const part = t.match(/partition [\s\S]*?source =([\s\S]*?)\n\s*\}/); if (part) (part[1].match(/\(\s*"(?:[^"]|"")*"/g) || []).forEach((x) => out.push({ where: base, what: 'switcher label', s: x.replace(/^\(\s*"/, '').slice(0, -1).replace(/""/g, '"') }));
    (t.match(/measure '[^']*Title[^']*' = .*/g) || []).forEach((m) => daxTexts(m).forEach((s) => out.push({ where: base, what: 'switcher title', s })));
  }
  if (/flip cards\.tmdl$/.test(base)) {
    const ms = t.split(/\n\t\tmeasure /).slice(1);
    ms.forEach((m) => { const name = (m.match(/^'([^']*)'/) || [])[1] || '?'; const body = (m.match(/```([\s\S]*?)```/) || [])[1] || m.split('\n')[0];
      daxTexts(body).forEach((s) => out.push({ where: `${base} ${name}`, what: 'flip face', s })); });
  }
  return out;
}
export const readReport = (dir) => { const out = {}; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else if (f.endsWith('.json')) { try { out[path.relative(dir, f).split(path.sep).join('/')] = rd(f); } catch (x) { /* not JSON */ } } }); rec(dir); return out; };
// Latin-letter runs of a text: words of Latin letters (digits and marks inside a run kept with it)
export const latinRuns = (s) => (String(s).replace(ISO, '').match(/[A-Za-z][A-Za-z0-9'’&._%-]*(?:[  ]+[A-Za-z0-9][A-Za-z0-9'’&._%-]*)*/g) || []);
// Power BI's own words (not ours: they follow the viewer's Power BI language)
export const POWERBI_WORDS = new Set(['All', 'Select all', '(Blank)']);
