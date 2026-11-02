// Large models: a summary first, details on request (owner 2026-10-03), and the part of a model a request is about.
// A model is "large" when its full read_model answer would pass LIMIT characters: about 10,000 tokens, where Claude
// Code starts warning, and far below Claude Desktop's limit. Small models answer exactly as before.
import { marked, modelOf, nameOut, shownName, summary, withNamesNote } from './model.mjs';
import { takenNames } from './report-names.mjs';

export const LIMIT = 40000;
// (0.3.0 Q1) where an answer that lists objects cuts its own lists: 15% under LIMIT, so the last backstop (answer.mjs
// capAnswer, which halves whatever list is longest) never has to cut it, and a growth of the parts not cut stays under
export const AIM = 34000;
const size = (o) => JSON.stringify(o, null, 2).length;
const lc = (s) => String(s == null ? '' : s).toLowerCase();
const raw = (m) => modelOf(m.tmsl);

// read_model's full answer, as it has always been
export const fullAnswer = (m) => withNamesNote({ source: m.source, existingReports: takenNames(m.projectDir), tables: summary(m) });
export const isLarge = (m) => { if (m.large == null) m.large = size(fullAnswer(m)) > LIMIT; return m.large; };

// the tables related to a table (either side of a relationship)
function relatedOf(m) {
  const out = new Map(), add = (a, b) => { if (!out.has(a)) out.set(a, new Set()); out.get(a).add(b); };
  (raw(m).relationships || []).forEach((r) => { if (r.fromTable && r.toTable) { add(r.fromTable, r.toTable); add(r.toTable, r.fromTable); } });
  return out;
}
// the model's areas: the top display folder of its measures, with the tables that have measures there. It is what a
// user would name ("logistics"); a model without display folders has none.
// (A1-7, the audit of the reading block: the folders come from the reader's shape, never from the raw model, and a
// folder's name is screened before it is returned: one that reads like an instruction is withheld)
export function areasOf(m) {
  const by = new Map();
  (m.tables || []).forEach((t) => (t.measures || []).forEach((ms) => {
    const folder = String(ms.displayFolder || '').split(/[\\/;]/)[0].trim(); if (!folder) return;
    if (!by.has(folder)) by.set(folder, { area: shownName(folder, 80), measures: 0, tables: [] });
    const a = by.get(folder); a.measures++; if (!a.tables.some((x) => (x.name || x) === nameOut(t.name))) a.tables.push(marked(nameOut(t.name), t.name));
  }));
  return [...by.values()].sort((a, b) => b.measures - a.measures);
}

// The summary has a ceiling too (audit AUD-016: about 93 characters per table with measures, 281,000 at 3,000 tables):
// at most TOP tables with measures are listed, the ones with the most measures; an area names at most AREA_TABLES of
// its tables; the rest are counted, by area. What is still too long is cut in this order until the answer is under
// LIMIT: the other tables' names, then the areas' table names. Nothing is cut on a model that fits (the 300-table
// golden model: 65 tables with measures).
const TOP = 100, AREA_TABLES = 15;
const short = (areas, n) => areas.map((a) => (a.tables.length > n ? { area: a.area, measures: a.measures, tables: a.tables.slice(0, n), moreTables: a.tables.length - n } : a));
// read_model on a large model: counts, the date tables, the areas, the tables with measures (how many measures,
// visible columns and related tables), the other tables' names, and how to ask for details
export function largeSummary(m) {
  // (SQ6, 0.2.9-reader-S24) a row's raw table name, by its place in m.tables (summary keeps the order): the maps below
  // are keyed by the raw name, the rows carry the shown one (cut past NAME_OUT, cleaned)
  const all = summary(m), rel = relatedOf(m), full = size(fullAnswer(m)), rawOf = new Map(all.map((t, i) => [t, m.tables[i].name]));
  let withMeasures = all.filter((t) => t.measures.length), notListed = null;
  if (withMeasures.length > TOP) {
    const order = new Map(withMeasures.map((t, i) => [t, i]));
    const ranked = withMeasures.slice().sort((a, b) => b.measures.length - a.measures.length || order.get(a) - order.get(b));
    const rest = ranked.slice(TOP), areaOf = new Map();
    (m.tables || []).forEach((t) => { const ms = (t.measures || []).find((x) => x.displayFolder); areaOf.set(t.name, ms ? shownName(String(ms.displayFolder).split(/[\\/;]/)[0].trim(), 80) : ''); });
    const by = new Map(); rest.forEach((t) => { const a = areaOf.get(rawOf.get(t)) || '(no display folder)'; by.set(a, (by.get(a) || 0) + 1); });
    withMeasures = ranked.slice(0, TOP);
    notListed = { tablesWithMeasures: rest.length, byArea: [...by.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([area, tables]) => ({ area, tables })),
      how: `Only the ${TOP} tables with the most measures are listed. The other ${rest.length} are reached with a focus (suggest_fields and create_report: focus: "<an area or a word from a table's name>") or by name (read_model with tables: ["Table name", ...]).` };
  }
  const out = largeBody(m, all, rel, full, withMeasures, notListed, rawOf);
  // still too long (thousands of tables): the other tables' names go first, then the areas' table names
  const fits = () => JSON.stringify(out).length <= LIMIT - 1000;
  if (!fits()) {
    const names = out.otherTables; let keep = names.length;
    while (keep > 0 && !fits()) { keep = Math.floor(keep / 2); out.otherTables = names.slice(0, keep); out.otherTablesNotListed = names.length - keep; }
    for (const n of [8, 3, 0]) { if (fits()) break; out.areas = short(areasOf(m), n); }
    if (!fits()) out.areas = out.areas.slice(0, 40);
  }
  return withNamesNote(out);
}
// a table's name as a list gives it: marked when its row is (F-MP P3)
const tableOut = (t) => (t.suspicious ? { name: t.table, suspicious: true } : t.table);
function largeBody(m, all, rel, full, withMeasures, notListed, rawOf) {
  return Object.assign({
    source: m.source, existingReports: takenNames(m.projectDir), summary: true,
    why: `This model is large: the full list of its tables, columns and measures would be ${full.toLocaleString('en-US')} characters, more than an AI app reads well in one answer. This is a summary; ask for the tables you need.`,
    counts: { tables: all.length, columns: m.tables.reduce((n, t) => n + t.columns.length, 0), measures: m.tables.reduce((n, t) => n + t.measures.length, 0), relationships: (raw(m).relationships || []).length },
    dateTables: all.filter((t) => t.dateTable).map(tableOut),
    areas: short(areasOf(m), AREA_TABLES),
    tablesWithMeasures: withMeasures.map((t) => ({ table: t.table, ...(t.suspicious ? { suspicious: true } : {}), measures: t.measures.length, columns: t.columns.length, relatedTables: (rel.get(rawOf.get(t)) || new Set()).size })),
    otherTables: all.filter((t) => !t.measures.length).map(tableOut) }, notListed ? { notListed } : {}, {
    details: 'Call read_model again with tables: ["Table name", ...] to get those tables in full (columns with types, measures with formats). For field picks on one part of the model, call suggest_fields with focus: "<an area or a word from table names>" or with tables.'
  });
}

// read_model with tables: exactly the named tables, in full; names that don't exist are listed back; an answer that
// would pass LIMIT stops at a table and names the tables left out
export function namedTables(m, names, extra) {
  // (the user's names are matched against the model's own, the answer gives them as nameOut writes them)
  const all = summary(m), by = new Map(all.map((t, i) => [lc(m.tables[i].name), t]));
  const found = [], notFound = [];
  [...new Set((names || []).map((n) => String(n)))].forEach((n) => { const t = by.get(lc(n.trim())); if (t) { if (!found.includes(t)) found.push(t); } else notFound.push(n); });
  const out = { source: m.source, existingReports: takenNames(m.projectDir), tables: [] }, notShown = [];
  if (notFound.length) out.notFound = notFound;
  for (const t of found) {
    out.tables.push(t);
    // (0.3.0 Q1: the names note the server adds (extra) counted too: without it a 100-table call passed LIMIT and the
    // backstop halved the tables, 40 to 20, with no notShown for them)
    if (size(Object.assign({}, out, extra || {})) > AIM - 400 && out.tables.length > 1) { out.tables.pop(); notShown.push(t.table); }
  }
  const tell = () => { out.notShown = notShown.map((n) => marked(n, n)); out.note = `The answer is kept under ${LIMIT.toLocaleString('en-US')} characters: ${out.tables.length} of ${found.length} tables are shown. Call read_model again with the tables in notShown.`; };
  if (notShown.length) tell();
  // (Q1) the list of the tables not shown is counted too
  while (notShown.length && size(Object.assign({}, out, extra || {})) > AIM && out.tables.length > 1) { notShown.unshift(out.tables.pop().table); tell(); }
  return withNamesNote(out);
}

// The part of the model a request is about. opts: { focus: a word the user said, tables: [names] }.
// Returns { tables (the picker's tables, in the model's own order), scope } when there is a scope, { tables: all }
// for a small model without one, or { needsFocus, why, areas, tablesWithMeasures } when nothing can be picked:
// a large model without a focus, or a focus that matches nothing.
export function scopeOf(m, opts) {
  const focus = opts && opts.focus != null ? String(opts.focus).trim() : '', names = (opts && opts.tables) || null;
  const rawTables = raw(m).tables || [], order = new Map(rawTables.map((t, i) => [t.name, i]));
  const ask = (why) => withNamesNote({ needsFocus: true, why, areas: short(areasOf(m), AREA_TABLES),
    tablesWithMeasures: m.tables.filter((t) => t.measures.length).map((t) => marked(nameOut(t.name), t.name)).slice(0, 80),
    how: 'Ask the user which part of the model the report is about, then call again with focus: "<area or word>" or tables: ["<table>", ...].' });
  if (!focus && !(names && names.length)) {
    if (!isLarge(m)) return { tables: m.tables };
    return ask(`This model is large (${m.tables.length} tables, ${m.tables.filter((t) => t.measures.length).length} of them with measures): the picks need a focus. Without one, the first tables by name would be picked, which is not what the user asked about.`);
  }
  let core;
  if (names && names.length) {
    const by = new Map(m.tables.map((t) => [lc(t.name), t])), missing = names.filter((n) => !by.has(lc(String(n).trim())));
    if (missing.length) throw new Error(`tables: not in the model: ${missing.join(', ')}. read_model lists the tables.`);
    core = names.map((n) => by.get(lc(String(n).trim())).name);
  } else {
    const f = lc(focus), folderHit = new Set();
    m.tables.forEach((t) => { if ((t.measures || []).some((ms) => lc(ms.displayFolder).includes(f))) folderHit.add(t.name); });
    const hit = m.tables.filter((t) => lc(t.name).includes(f) || folderHit.has(t.name));
    // the tables with measures are what the user means by an area; lookups that only share the word come in when
    // they are related, and alone only when no table with measures matches
    const facts = hit.filter((t) => t.measures.length);
    core = (facts.length ? facts : hit).map((t) => t.name);
    if (!core.length) return ask(`Nothing in the model matches the focus "${focus}": no table name and no measure display folder contains it.`);
  }
  const rel = relatedOf(m), inScope = new Set(core);
  core.forEach((n) => (rel.get(n) || []).forEach((x) => inScope.add(x)));
  m.tables.forEach((t) => { if (t.date) inScope.add(t.name); });
  const tables = m.tables.filter((t) => inScope.has(t.name)).sort((a, b) => (order.has(a.name) ? order.get(a.name) : 1e9) - (order.has(b.name) ? order.get(b.name) : 1e9));
  return { tables, scope: Object.assign(focus ? { focus } : {}, { tables: tables.length, picksFrom: core.slice().sort((a, b) => (order.get(a) || 0) - (order.get(b) || 0)) }) };
}
