// The Arabic twin, step 2: the texts a reader sees (titles, title measures' DAX, table headers by row), the user's
// Arabic labels and terms, and what is not translated.
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import crypto from 'node:crypto';
import { visible, shownName } from './model.mjs';
import { INSTRUCTION, safeName } from './read-report.mjs';
import { draftText } from './arabic-names.mjs';
import { writtenName } from './display-names.mjs';
import * as Terms from './terminology.mjs';
import { TEXT_CAP, isObj, pageOf } from './twin-read.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Rules = require('../../assets/js/report-rules.js');

// ---- title measures (rc.24, the laptop's proof of rc.23: 4 chart titles stayed English in the twin) ----
// A chart's "fx" title is a measure; one of the report's own (reportExtensions.json, as DataArcus writes "Title: ..." for a
// chart cut to its Top N) is read, never run: its DAX is translated only when its text is fixed texts and the numbers
// it counts, of the shape  [VARs, no text in them] RETURN IF ( <a condition, no text>, A, B )  or  A, each of A and B
// texts and variables joined by &. Each branch is offered as one text, its variables as {1}, {2}: "Top {1} of {2}: Web
// Orders Total Score by Coupon Region". Any other shape (a value of the model, FORMAT, a text in a variable, a measure of
// the model) is listed as not translated, with why: it is never guessed.
// the DAX read token by token: its string literals, names ('Table', [Column]) and comments, so a sign inside them is not code
function daxScan(expr) {
  const lits = []; let i = 0, depth = 0; const top = [];   // top: [index, char] of the top-level , & ( ) outside literals and names
  while (i < expr.length) {
    const c = expr[i];
    if (c === '"') { let j = i + 1, t = ''; for (;;) { if (j >= expr.length) return null; if (expr[j] === '"') { if (expr[j + 1] === '"') { t += '"'; j += 2; continue; } break; } t += expr[j++]; } lits.push({ start: i, end: j + 1, text: t }); i = j + 1; continue; }
    if (c === "'") { const j = expr.indexOf("'", i + 1); if (j < 0) return null; i = j + 1; while (expr[i] === "'") { const k = expr.indexOf("'", i + 1); if (k < 0) return null; i = k + 1; } continue; }
    if (c === '[') { let j = i + 1; for (;;) { j = expr.indexOf(']', j); if (j < 0) return null; if (expr[j + 1] === ']') { j += 2; continue; } break; } i = j + 1; continue; }
    if ((c === '/' && (expr[i + 1] === '/' || expr[i + 1] === '*')) || (c === '-' && expr[i + 1] === '-')) return { comment: true };
    if (c === '(') depth++;
    if (c === ')') depth--;
    top.push({ i, c, depth });
    i++;
  }
  return { lits, top };
}
const NOT_READ = 'its DAX builds the text in a way DataArcus does not read (only fixed texts and the numbers the report counts are translated)';
function parseTitleDax(expr0, o) {
  const allowEmpty = !!(o && o.allowEmpty);
  const expr = String(expr0 == null ? '' : expr0), sc = daxScan(expr);
  if (!sc) return { why: 'its DAX could not be read (an unclosed text or name)' };
  if (sc.comment) return { why: 'its DAX has comments: ' + NOT_READ };
  const inLit = (i) => sc.lits.some((l) => i >= l.start && i < l.end);
  // the last RETURN outside literals and names
  let ret = -1; const re = /\bRETURN\b/gi; let m; while ((m = re.exec(expr))) { if (!inLit(m.index) && sc.top.some((t) => t.i === m.index)) ret = m.index; }
  const bodyAt = ret >= 0 ? ret + 6 : 0, prefix = ret >= 0 ? expr.slice(0, ret) : '';
  if (sc.lits.some((l) => l.start < bodyAt)) return { why: 'a text of it is kept in a variable: ' + NOT_READ };
  const vars = new Set([...prefix.matchAll(/\bVAR\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/gi)].map((x) => x[1]));
  const body = expr.slice(bodyAt), lead = body.length - body.trimStart().length, b0 = bodyAt + lead, b1 = bodyAt + body.trimEnd().length;
  // a branch: literals and variables joined by & (top level, depth of the branch)
  const branch = (from, to) => {
    const parts = [], cuts = sc.top.filter((t) => t.i >= from && t.i < to && t.c === '&' && t.depth === sc.top.filter((x) => x.i < from).reduce((d, x) => d + (x.c === '(' ? 1 : x.c === ')' ? -1 : 0), 0)).map((t) => t.i);
    let at = from; [...cuts, to].forEach((c) => { parts.push([at, c]); at = c + 1; });
    const out = { template: '', vars: [] };
    for (const [a, z] of parts) {
      const raw = expr.slice(a, z), t = raw.trim(), start = a + raw.indexOf(t);
      const l = sc.lits.find((x) => x.start === start && x.end === start + t.length);
      if (l) { if (/[{}]/.test(l.text)) return null; out.template += l.text; continue; }
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t) && vars.has(t)) { out.vars.push(t); out.template += '{' + out.vars.length + '}'; continue; }
      return null;
    }
    return /\p{L}/u.test(out.template) || (allowEmpty && out.template === '' && !out.vars.length) ? out : null;
  };
  const some = (bs) => bs.some((b) => /\p{L}/u.test(b.template));
  if (/^IF\s*\(/i.test(expr.slice(b0, b1)) && expr[b1 - 1] === ')') {
    const open = expr.indexOf('(', b0), d = sc.top.find((t) => t.i === open).depth;
    const commas = sc.top.filter((t) => t.i > open && t.i < b1 - 1 && t.c === ',' && t.depth === d).map((t) => t.i);
    const close = sc.top.find((t) => t.i > open && t.c === ')' && t.depth === d - 1);
    if (commas.length !== 2 || !close || close.i !== b1 - 1) return { why: NOT_READ };
    if (sc.lits.some((l) => l.start > open && l.start < commas[0])) return { why: 'its condition compares texts: ' + NOT_READ };
    const A = branch(commas[0] + 1, commas[1]), B = branch(commas[1] + 1, b1 - 1);
    if (!A || !B || !some([A, B])) return { why: NOT_READ };
    return { prefix, ret: ret >= 0, cond: expr.slice(open + 1, commas[0]).trim(), branches: [A, B] };
  }
  const A = branch(b0, b1);
  return A && some([A]) ? { prefix, ret: ret >= 0, cond: null, branches: [A] } : { why: NOT_READ };
}
// the measure's DAX with the Arabic texts (one per branch, its {n} the branch's variables); a branch without a label keeps its own
const daxText = (t) => '"' + String(t).replace(/"/g, '""') + '"';
export function arabicDax(pd, labels) {
  const one = (b, label) => { if (label == null) label = b.template; const out = []; String(label).split(/(\{\d+\})/).forEach((x) => { const v = /^\{(\d+)\}$/.exec(x); if (v) out.push(b.vars[+v[1] - 1]); else if (x) out.push(daxText(x)); }); return out.length ? out.join(' & ') : '""'; };
  const bs = pd.branches.map((b, i) => one(b, labels[i]));
  return (pd.ret ? pd.prefix + 'RETURN ' : '') + (pd.cond != null ? `IF ( ${pd.cond}, ${bs[0]}, ${bs[1]} )` : bs[0]);
}
// a label of a branch must keep each {n} of the branch once, and add none
export function placeholderProblem(template, label) {
  const want = (template.match(/\{\d+\}/g) || []).sort(), got = (String(label).match(/\{\d+\}/g) || []).sort();
  return JSON.stringify(want) === JSON.stringify(got) ? null : `the Arabic text must keep ${want.length ? want.join(' and ') + ' once each (the numbers the report counts)' : 'no {n}'}, and add none: not taken`;
}
// every title of the report given by a measure: the report's own (parsed), or the model's
const extMeasureOf = (R, entity, name) => { const e = R.ext ? R.ext.entities.find((x) => isObj(x) && x.name === entity) : null; return e && Array.isArray(e.measures) ? e.measures.find((x) => isObj(x) && x.name === name) || null : null; };
export function titleMeasuresOf(R) {
  const seen = new Map();
  R.pages.forEach((pg) => pg.visuals.forEach((v) => {
    const vco = isObj(v.json) && isObj(v.json.visual) && isObj(v.json.visual.visualContainerObjects) ? v.json.visual.visualContainerObjects : {};
    (Array.isArray(vco.title) ? vco.title : []).forEach((e) => {
      const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null;
      const src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
      if (!src || typeof ms.Property !== 'string' || typeof src.Entity !== 'string') return;
      const key = (src.Schema === 'extension' ? 'ext' : 'model') + '\u0000' + src.Entity + '\u0000' + ms.Property;
      if (seen.has(key)) return;
      const own = src.Schema === 'extension', m = own ? extMeasureOf(R, src.Entity, ms.Property) : null;
      const pd = !own ? { why: 'a measure of the model: the twin never changes the model, so this title stays as the model gives it' } : !m ? { why: 'the report\'s measure is not in its reportExtensions.json' } : typeof m.expression !== 'string' ? { why: 'its DAX is not a text in reportExtensions.json' } : parseTitleDax(m.expression);
      seen.set(key, { entity: src.Entity, name: ms.Property, own, measure: m, pd });
    });
  }));
  return [...seen.values()];
}

// (0.3.0 D3: the empty state's "No data for this selection" stayed English in the twin) a measure of the report that a
// visual shows (in its fields, as the writer's "No data: ..." card does), its text read as a title measure's is (fixed
// texts and the numbers the report counts; one branch may be the empty text ""), never run. The title measures are
// above; a measure of the model is the model's (never changed)
export function textMeasuresOf(R) {
  const seen = new Map(), titles = new Set(titleMeasuresOf(R).filter((x) => x.own).map((x) => x.entity + '\u0000' + x.name));
  const walk = (o) => { if (Array.isArray(o)) { o.forEach(walk); return; } if (!isObj(o)) return;
    const ms = isObj(o.Measure) ? o.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
    if (src && src.Schema === 'extension' && typeof src.Entity === 'string' && typeof ms.Property === 'string') {
      const key = src.Entity + '\u0000' + ms.Property, m = extMeasureOf(R, src.Entity, ms.Property);
      if (!seen.has(key) && !titles.has(key) && m && typeof m.expression === 'string' && /"(?:[^"]|"")*\p{L}/u.test(m.expression)) seen.set(key, { entity: src.Entity, name: ms.Property, measure: m, pd: parseTitleDax(m.expression, { allowEmpty: true }) });
    }
    Object.values(o).forEach(walk); };
  R.pages.forEach((pg) => pg.visuals.forEach((v) => walk(isObj(v.json) && isObj(v.json.visual) ? v.json.visual.query : null)));
  return [...seen.values()];
}

// ---- the texts a reader sees, for the user's Arabic (cleaned, capped, instruction-like withheld) ----
// An id holds report names (a page, a visual, a field's queryRef). An id that reads like an instruction, holds an
// invisible character or is longer than 160 is replaced by an opaque one ("h:" and 16 hex digits of its hash), which
// the server maps back: no such name reaches the answer (the cross-review's T5)
const safeId = (raw) => (!INSTRUCTION.test(raw) && visible(raw) === raw && raw.length <= 160 ? raw : 'h:' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16));
// (0.3.1 FX3, the laptop part 3's A1: the twin of a report whose charts use Power BI's automatic subtitles showed
// «الشريحة by إجمالي الربح», Desktop composing it from the approved Arabic field names with its own English "by") a data
// visual's title or subtitle switched on with no text of its own is Power BI's to compose, from the field names. Each is
// a text of the twin: its English as Power BI composes it from the original's names ("Total Profit by Segment"), its
// draft one Arabic sentence from the approved Arabic field names («إجمالي الربح حسب الشريحة»); the twin writes it as the
// visual's own text (its approved Arabic, else that English), so Desktop never composes a mixed one.
// [{ key: 'title' | 'subTitle', i (the entry), id (the text's id, as an explicit one's), vals, cats: [{ ref, name }] }]
const AUTO_CATS = new Set(['Category', 'Series', 'Legend', 'Rows', 'Columns', 'Axis', 'Group', 'Details']), AUTO_SKIP = new Set(['Tooltips']);
const AUTO_KINDS = new Set(['button', 'textbox', 'shape', 'image', 'group', 'unreadable']);
const isOn = (p) => isObj(p) && isObj(p.expr) && isObj(p.expr.Literal) && String(p.expr.Literal.Value) === 'true';
const hasText = (p) => p !== undefined && p !== null && !(isObj(p) && isObj(p.expr) && isObj(p.expr.Literal) && /^'\s*'$/.test(String(p.expr.Literal.Value)));
export function autoTitlesOf(pageId, json) {
  if (!isObj(json) || !isObj(json.visual) || AUTO_KINDS.has(Mirror.kindOf(json))) return [];
  const qs = isObj(json.visual.query) && isObj(json.visual.query.queryState) ? json.visual.query.queryState : {}, vals = [], cats = [];
  Object.keys(qs).filter((role) => !AUTO_SKIP.has(role)).forEach((role) => (isObj(qs[role]) && Array.isArray(qs[role].projections) ? qs[role].projections : []).forEach((x) => {
    if (!isObj(x) || typeof x.queryRef !== 'string' || !x.queryRef) return;
    const name = String(x.displayName != null ? x.displayName : (x.nativeQueryRef || x.queryRef.replace(/^.*?\./, '')));
    (AUTO_CATS.has(role) ? cats : vals).push({ ref: x.queryRef, name }); }));
  if (vals.length + cats.length < 2) return [];   // (one field: its own name, no "by" to compose)
  const vco = isObj(json.visual.visualContainerObjects) ? json.visual.visualContainerObjects : {}, where = pageId + '/' + json.name, out = [];
  ['title', 'subTitle'].forEach((key) => (Array.isArray(vco[key]) ? vco[key] : []).forEach((e, i) => {
    if (!isObj(e) || e.selector || !isObj(e.properties) || !isOn(e.properties.show) || hasText(e.properties.text)) return;
    out.push({ key, i, id: key === 'title' ? 'title:' + where : `text:${where}/c.subTitle.${i}.text`, vals, cats });
  }));
  // (0.3.1 FX3b, the owner's hand-made charts: no title card at all) no "show" set and no text: the type's default title
  // (Microsoft's catalog, report-rules.js defaultTitle) is Power BI's to compose when it is on. i: the entry the text
  // goes in (-1: none yet); only the text is ever written, never "show". A subtitle is off unless switched on
  const own = (Array.isArray(vco.title) ? vco.title : []).map((e, i) => [e, i]).filter(([e]) => isObj(e) && !e.selector && isObj(e.properties));
  if (!out.some((a) => a.key === 'title') && !own.some(([e]) => e.properties.show !== undefined || hasText(e.properties.text)) && Rules.defaultTitle(json.visual.visualType) === 'on')
    out.push({ key: 'title', i: own.length ? own[0][1] : -1, id: 'title:' + where, vals, cats, byDefault: true });
  return out;
}
// the sentence: the values "and", then "by" the categories (Power BI's own words); Arabic: «و» and «حسب»
export const autoSentence = (a, names, ar) => { const v = a.vals.map(names), c = a.cats.map(names), and = ar ? ' و' : ' and ';
  if (v.some((x) => x == null) || c.some((x) => x == null)) return null;
  return v.length ? v.join(and) + (c.length ? (ar ? ' حسب ' : ' by ') + c.join(and) : '') : c.join(and); };
export function textsOf(R) {
  const all = [], seen = new Set();
  const add = (t, where) => { if (seen.has(t.id)) return; seen.add(t.id); all.push(Object.assign(t, where)); };
  R.pages.forEach((pg) => {
    add({ id: 'page:' + pg.id, kind: 'page', text: typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : '' }, { page: pg.id });
    // (rc.22, B-138: a page button kept its English text in the twin) a button that goes to a page knows that page
    const goesTo = (j) => { const l = ((((j || {}).visual || {}).visualContainerObjects || {}).visualLink || []).find((e) => e && e.properties) || {}, p = l.properties || {}, lit = (x) => (x && x.expr && x.expr.Literal ? String(x.expr.Literal.Value).replace(/^'|'$/g, '') : null);
      return /PageNavigation/i.test(String(lit(p.type))) ? lit(p.navigationSection) : null; };
    pg.visuals.forEach((v) => Mirror.textsOfVisual(pg.id, v.json).forEach((t) => add(Object.assign(t, t.kind === 'button' && goesTo(v.json) ? { goesTo: 'page:' + goesTo(v.json) } : {}), t.kind === 'field' ? {} : { page: pg.id, visual: String(v.json.name) })));
    // (FX3) Power BI's automatic titles and subtitles: listed with the visual's texts, their English as Power BI composes it
    pg.visuals.forEach((v) => autoTitlesOf(pg.id, v.json).forEach((a) => add({ id: a.id, kind: a.key === 'title' ? 'title' : 'text', text: autoSentence(a, (x) => x.name), automatic: a.key,
      autoRefs: a.vals.concat(a.cats).map((x) => x.ref), auto: a }, { page: pg.id, visual: String(v.json.name) })));
    // (0.3.0 D3) the phone layout's own texts: the header text box, a card's full title the writer wrapped for the phone
    pg.visuals.forEach((v) => { if (v.mobile) Mirror.textsOfMobile(pg.id, v.json, v.mobile.json).forEach((t) => add(Object.assign(t, { phone: true }), { page: pg.id, visual: String(v.json.name) })); });
  });
  R.bookmarks.forEach((b) => add({ id: 'bookmark:' + b.json.name, kind: 'bookmark', text: typeof b.json.displayName === 'string' ? b.json.displayName : '' }, {}));
  // (SQ4, X1-S2) a bookmark group's name (bookmarks.json), shown in the Bookmarks pane above its bookmarks
  (R.bookmarkGroups || []).forEach((g) => add({ id: 'bookmarkGroup:' + g.name, kind: 'bookmarkGroup', text: g.displayName }, {}));
  // (rc.24) each visible text of the report's title measures, one per text across the report (the measures listed)
  titleMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => x.pd.branches.forEach((b) => {
    const id = 'titleText:' + b.template, had = all.find((t) => t.id === id), m = safeName(x.entity + '[' + x.name + ']');
    if (had) { if (!had.measures.includes(m)) had.measures.push(m); return; }
    add({ id, kind: 'titleMeasure', text: b.template, what: 'Chart title (from a title measure)' + (b.vars.length ? `: keep ${b.vars.map((v, i) => '{' + (i + 1) + '}').join(' and ')}, the numbers the report counts` : ''), measures: [m] }, {});
  }));
  // (0.3.0 D3) each visible text of the report's other text measures a visual shows (the empty state), one per text
  textMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => x.pd.branches.filter((b) => b.template).forEach((b) => {
    const id = 'measureText:' + b.template, had = all.find((t) => t.id === id), m = safeName(x.entity + '[' + x.name + ']');
    if (had) { if (!had.measures.includes(m)) had.measures.push(m); return; }
    add({ id, kind: 'measureText', text: b.template, what: 'Text a report measure shows (such as the empty state\'s message)' + (b.vars.length ? `: keep ${b.vars.map((v, i) => '{' + (i + 1) + '}').join(' and ')}, the numbers the report counts` : ''), measures: [m] }, {});
  }));
  const rowShown = rowFieldsOf(R);
  return all.map((t) => {
    const raw = String(t.text);
    const out = Object.assign({ id: safeId(t.id), kind: t.kind, rawId: t.id, raw }, t.automatic ? { automatic: t.automatic === 'title' ? 'title' : 'subtitle', what: AUTO_WHAT, auto: t.auto } : {}, t.phone ? { phone: true } : {}, t.goesTo ? { goesTo: safeId(t.goesTo) } : {}, t.what ? { what: t.what, measures: t.measures.slice(0, 30) } : {});
    // (0.3.0 D3: twice the texts in the same answer) the page and the visual are said apart only when the id can't say them
    if (t.page && out.id !== t.id) out.page = safeName(t.page);
    if (t.visual && out.id !== t.id) out.visual = safeName(t.visual);
    if (INSTRUCTION.test(raw)) return Object.assign(out, { text: null, withheld: `reads like an instruction to an AI assistant (${raw.length} characters): not shown, kept as it is unless the user gives its Arabic`, draftArabic: null });
    const text = visible(raw);
    const row = t.kind === 'field' ? rowShown.get(String(t.id).slice('field:'.length)) : null;
    if (row) out.what = row.only ? ROW_WHAT : ROW_AND_MORE;
    return Object.assign(out, { text: text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) + '…' : text }, text.length > TEXT_CAP ? { long: raw.length } : {}, { draftArabic: row && row.only ? draftText(raw.replace(AVG, '$1')) : draftText(raw) });
  });
}
// (0.3.1 R1: a real user's per-row "Days open" column, a measure named "Avg days open", was drafted «متوسط أيام الفتح») A
// measure (or a field's sum) in a table whose rows are items (the table lists a column of the model) shows, on each row,
// that one item's value: its header names what one row shows, not the average or total over the rows (the Total row is
// Power BI's own). Such a field says it (what), and, shown only in such tables, its draft leaves out "Avg" / "Average"
// (the glossary's draft of the rest, else none). Shown elsewhere too (a card, a chart, a matrix), one name serves both:
// its draft is kept and both are said. queryRef -> { only }
const AVG = /^\s*(?:avg\.?|average)\s+(.+)$/i;
const AUTO_WHAT = 'Power BI\'s automatic title (switched on, or its type\'s default title, with no text of its own): the twin writes it as the visual\'s own text, its approved Arabic or else this English, so Power BI never composes it from Arabic field names with its English "by". Draft it as one Arabic sentence from the fields\' approved Arabic names («A حسب B»)';
const ROW_WHAT = 'Table column header: each row of the table is one item, so name what ONE row shows (a measure named "Avg ..." gives that item\'s own value on its row; the Total row is Power BI\'s own)';
const ROW_AND_MORE = 'Shown as a table column (each row one item: that item\'s own value) and elsewhere (over many items): one Arabic name serves both';
function rowFieldsOf(R) {
  const seen = new Map();
  R.pages.forEach((pg) => pg.visuals.forEach((v) => {
    const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : null, qs = vis && isObj(vis.query) && isObj(vis.query.queryState) ? vis.query.queryState : null;
    if (!qs) return;
    const ps = Object.values(qs).flatMap((r) => (isObj(r) && Array.isArray(r.projections) ? r.projections.filter((x) => isObj(x) && isObj(x.field) && typeof x.queryRef === 'string') : []));
    const items = vis.visualType === 'tableEx' && ps.some((x) => isObj(x.field.Column));
    ps.forEach((x) => { const agg = isObj(x.field.Measure) || isObj(x.field.Aggregation), e = seen.get(x.queryRef) || { inItems: false, other: false };
      if (items && agg) e.inItems = true; else e.other = true; seen.set(x.queryRef, e); });
  }));
  return new Map([...seen].filter(([, e]) => e.inItems).map(([k, e]) => [k, { only: !e.other }]));
}
// the labels by the ids the answer gave, as the mirror engine's ids (the report's own names); (0.3.0 J18) each as it is
// written: a Latin run inside Arabic text isolated (terminology.mjs)
export const rawLabels = (texts, labels) => { const by = new Map(texts.map((t) => [t.id, t.rawId])), out = {}; Object.keys(labels || {}).forEach((k) => { if (by.has(k)) out[by.get(k)] = Terms.isolateLatin(labels[k]); }); return out; };

// ---- the plan ----
export const sortKeys = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, String(o[k])]));
// (0.3.0 J18) terms as a plan pins them: keys as Table[Field], each name as written (writtenName)
export const normTerms = (t) => sortKeys(Object.fromEntries(Object.entries(t || {}).map(([k, v]) => { const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? [`${mk[1]}[${mk[2]}]`, cleanLabel(v, `terms: ${String(k)}`)] : null; }).filter(Boolean)));
export const cleanLabel = (s, id) => writtenName(s, `labels: ${visible(id).slice(0, 160)}`).slice(0, TEXT_CAP);

// (0.3.0 D3) a text of the new kinds with no label of its own takes the approved Arabic of the same text, shown in the
// plan (labelFrom) and pinned with it, as a page button takes its page's (B-138): a phone copy the label of the page's
// same text on the same visual, an alt text, a card's blank text or a tooltip that of any listed text with exactly
// its words (a chart's alt text is its title). A label given for it wins; a text with {n} is never shared
const SHARED = new Set(['altText', 'blankText', 'buttonTooltip', 'text']);
const KIND_SAID = { page: 'page name', title: 'title', textbox: 'text box', button: 'button', field: 'field name', bookmark: 'bookmark', bookmarkGroup: 'bookmark group', titleMeasure: 'chart title', measureText: 'measure text', altText: 'alt text', blankText: 'text for no data', buttonTooltip: 'button tooltip', text: 'text' };
export function sameTextLabels(texts, labels) {
  const key = (t) => (t.text != null && !/\{\d+\}/.test(t.raw) ? t.raw.trim() : null), byText = new Map();
  const learn = (t) => { const k = key(t); if (k && labels[t.id] != null && !byText.has(k)) byText.set(k, t); };
  texts.forEach(learn);
  const take = (t, from, said) => { labels[t.id] = labels[from.id]; t.labelFrom = said; learn(t); };
  texts.filter((t) => !t.phone && SHARED.has(t.kind) && labels[t.id] == null && key(t)).forEach((t) => { const f = byText.get(key(t)); if (f && f !== t) take(t, f, `the approved Arabic of the same text (${KIND_SAID[f.kind] || f.kind})`); });
  texts.filter((t) => t.phone && labels[t.id] == null && key(t)).forEach((t) => {
    const own = texts.find((x) => x.rawId === t.rawId.slice('phone:'.length));
    if (own && labels[own.id] != null && own.raw === t.raw) return take(t, own, 'the approved Arabic of the same text on the page');
    const f = byText.get(key(t)); if (f && f !== t) take(t, f, `the approved Arabic of the same text (${KIND_SAID[f.kind] || f.kind})`);
  });
}
// every listed text with Latin letters that the twin writes as it is (no approved Arabic), with why: one row per text
// (the same words on several visuals, a field and the alt text that repeats it, are one row: where says each kind and
// count; ids name them in texts), the why of its strongest reason
export function notTranslatedOf(texts, labels, problems) {
  const rows = new Map(), RANK = ['withheld', 'problem', 'field', 'auto', 'other'];   // (FX3b: an automatic title's reason before a plain text's)
  texts.filter((t) => labels[t.id] == null && /[A-Za-z]/.test(t.raw)).forEach((t) => {
    const p = problems.find((x) => x.id === t.id);
    const [rank, why] = t.text == null ? ['withheld', 'reads like an instruction to an AI assistant: kept as it is, unless the user gives its Arabic']
      : p ? ['problem', 'its Arabic was not taken: ' + p.why]
      : t.kind === 'field' ? ['field', 'a field name with no Arabic given: Power BI shows it as the model names it (the person kept it; the model is never renamed)']
      : t.automatic ? ['auto', 'Power BI\'s automatic title, with no Arabic approved: the twin writes this English text as the visual\'s own (wholly English), so Power BI never composes it from Arabic field names with its English "by"']
      : ['other', 'no Arabic was approved for it: the twin shows it as it is'];
    const k = t.text == null ? '\u0000' + t.id : t.text, what = (t.phone ? 'phone layout: ' : '') + (KIND_SAID[t.kind] || t.kind);
    if (!rows.has(k)) rows.set(k, { text: t.text, where: {}, ids: [], rank, why });
    const r = rows.get(k); r.where[what] = (r.where[what] || 0) + 1; r.ids.push(t.id);
    if (RANK.indexOf(rank) < RANK.indexOf(r.rank)) Object.assign(r, { rank, why });
  });
  return [...rows.values()].map((r) => ({ text: r.text, where: Object.entries(r.where).map(([w, n]) => (n > 1 ? `${w} (${n})` : w)).join(', '), why: r.why, ids: r.ids }));
}

// (0.3.0 J18, B-171) the terminology sheet of the twin: each field text's field ("Table[Field]", from the projections that
// show it), the terms the person gave (terms: { "Table[Field]": Arabic }, or the English name to keep it) or confirmed
// earlier in this session for this field of this model, unchanged since (a.memory false: none, the write's own plan).
// A term labels every header of its field (a label given for one that says it otherwise is not used: notUsing) and every
// text made of its English name ("A by B", "Top {1} of {2}: A by B", "A (B)", "A: detail", "No data: A"), the same word
// everywhere; an English name two fields share with two terms derives nothing. labels: changed in place.
export function termsOf(R, texts, labels, a, m) {
  const keyOfRef = new Map();
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!isObj(o)) return; if (Array.isArray(o.projections)) o.projections.forEach((p) => { const k = isObj(p) && typeof p.queryRef === 'string' ? Terms.fieldKeyOf(p.field) : null; if (k && !keyOfRef.has(p.queryRef)) keyOfRef.set(p.queryRef, k); }); Object.values(o).forEach(walk); };
  R.pages.forEach((pg) => pg.visuals.forEach((v) => walk(isObj(v.json) && isObj(v.json.visual) ? v.json.visual.query : null)));
  texts.forEach((t) => { if (t.kind !== 'field') return; const k = keyOfRef.get(String(t.rawId).slice('field:'.length)); if (k) { t.fieldKey = k; t.field = shownName(k, 200); } });
  const keys = [...new Set(texts.filter((t) => t.fieldKey).map((t) => t.fieldKey))];
  const enOf = (k) => new Set([k.replace(/^.*?\[(.*)\]$/, '$1')].concat(texts.filter((t) => t.fieldKey === k).map((t) => t.raw.trim())));
  const given = {}, unknown = [], term = new Map(), notUsing = [];
  Object.entries(a.terms || {}).forEach(([k, v]) => { const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/), n = mk ? `${mk[1]}[${mk[2]}]` : null; const c = cleanLabel(v, `terms: ${String(k)}`);
    if (n) given[n] = c; if (!n || !keys.includes(n)) unknown.push(visible(String(k)).slice(0, 160)); });
  const conf = a.memory === false ? new Map() : Terms.confirmedOf(m, keys.filter((k) => given[k] == null));
  keys.forEach((k) => {
    if (given[k] != null) term.set(k, enOf(k).has(given[k].trim()) ? { ar: null, status: 'kept', declined: true } : { ar: given[k], status: 'approved' });
    else if (conf.has(k)) { const c = conf.get(k); term.set(k, c.decision === 'kept' ? { ar: null, status: 'kept', declined: true, earlier: true } : { ar: c.alias, status: 'approved', earlier: true }); }
  });
  const said = () => 'the terminology sheet';
  texts.filter((t) => t.fieldKey && term.has(t.fieldKey) && term.get(t.fieldKey).ar != null).forEach((t) => {
    const ar = term.get(t.fieldKey).ar;
    if (labels[t.id] != null && labels[t.id] !== ar) notUsing.push({ id: t.id, why: 'a field\'s header takes the field\'s term: the label given for it was not used' });
    labels[t.id] = ar; t.labelFrom = said(t.fieldKey);
  });
  // the texts made of the fields' English names
  const byName = new Map(), clash = new Set();
  term.forEach((x, k) => { if (x.ar == null) return; enOf(k).forEach((n) => { const l = n.toLowerCase(); if (byName.has(l) && byName.get(l) !== x.ar) clash.add(l); else byName.set(l, x.ar); }); });
  clash.forEach((l) => byName.delete(l));
  if (byName.size) texts.forEach((t) => {
    if (t.fieldKey || t.text == null) return;
    const used = [], d = draftText(t.raw, { names: byName, used }); if (!d || !used.length) return;
    if (labels[t.id] == null) { labels[t.id] = d; t.labelFrom = said(); }
    else if (labels[t.id] !== d) notUsing.push({ id: t.id, why: `its label says the field otherwise than the sheet («${visible(d).slice(0, 120)}»): kept as the person gave it` });
  });
  // every other field's status: a label given for its header (approved), its fixed list draft (not written until it is
  // approved), or none (kept in English)
  const statuses = () => keys.forEach((k) => { if (term.has(k)) return; const ts = texts.filter((t) => t.fieldKey === k), lab = ts.map((t) => labels[t.id]).find((x) => x != null);
    if (lab != null) return term.set(k, { ar: lab, status: 'approved' });
    const dr = ts.map((t) => t.draftArabic).find(Boolean);
    term.set(k, dr ? { ar: dr, status: 'draft', why: 'a draft from the fixed list of report words: not written until the person approves it (terms)' } : { ar: null, status: 'kept' }); });
  return { keys, term, given: sortKeys(given), unknown, notUsing, statuses };
}
