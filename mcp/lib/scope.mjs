// Large models: a summary first, details on request (owner 2026-10-03), and the part of a model a request is about.
// A model is "large" when its full read_model answer would pass LIMIT characters: about 10,000 tokens, where Claude
// Code starts warning, and far below Claude Desktop's limit. Small models answer exactly as before.
import { summary } from './model.mjs';

export const LIMIT = 40000;
const size = (o) => JSON.stringify(o, null, 2).length;
const lc = (s) => String(s == null ? '' : s).toLowerCase();
const raw = (m) => ((m.tmsl && (m.tmsl.model || m.tmsl)) || {});

// read_model's full answer, as it has always been
export const fullAnswer = (m) => ({ source: m.source, existingReports: m.taken || [], tables: summary(m) });
export const isLarge = (m) => { if (m.large == null) m.large = size(fullAnswer(m)) > LIMIT; return m.large; };

// the tables related to a table (either side of a relationship)
function relatedOf(m) {
  const out = new Map(), add = (a, b) => { if (!out.has(a)) out.set(a, new Set()); out.get(a).add(b); };
  (raw(m).relationships || []).forEach((r) => { if (r.fromTable && r.toTable) { add(r.fromTable, r.toTable); add(r.toTable, r.fromTable); } });
  return out;
}
// the model's areas: the top display folder of its measures, with the tables that have measures there. It is what a
// user would name ("logistics"); a model without display folders has none.
export function areasOf(m) {
  const by = new Map();
  (raw(m).tables || []).forEach((t) => (t.measures || []).forEach((ms) => {
    const folder = String(ms.displayFolder || '').split(/[\\/;]/)[0].trim(); if (!folder) return;
    if (!by.has(folder)) by.set(folder, { area: folder, measures: 0, tables: [] });
    const a = by.get(folder); a.measures++; if (!a.tables.includes(t.name)) a.tables.push(t.name);
  }));
  return [...by.values()].sort((a, b) => b.measures - a.measures);
}

// read_model on a large model: counts, the date tables, the areas, every table with measures (how many measures,
// visible columns and related tables), the other tables' names, and how to ask for details
export function largeSummary(m) {
  const all = summary(m), rel = relatedOf(m), full = size(fullAnswer(m));
  const withMeasures = all.filter((t) => t.measures.length);
  return {
    source: m.source, existingReports: m.taken || [], summary: true,
    why: `This model is large: the full list of its tables, columns and measures would be ${full.toLocaleString('en-US')} characters, more than an AI app reads well in one answer. This is a summary; ask for the tables you need.`,
    counts: { tables: all.length, columns: m.tables.reduce((n, t) => n + t.columns.length, 0), measures: m.tables.reduce((n, t) => n + t.measures.length, 0), relationships: (raw(m).relationships || []).length },
    dateTables: all.filter((t) => t.dateTable).map((t) => t.table),
    areas: areasOf(m),
    tablesWithMeasures: withMeasures.map((t) => ({ table: t.table, measures: t.measures.length, columns: t.columns.length, relatedTables: (rel.get(t.table) || new Set()).size })),
    otherTables: all.filter((t) => !t.measures.length).map((t) => t.table),
    details: 'Call read_model again with tables: ["Table name", ...] to get those tables in full (columns with types, measures with formats). For field picks on one part of the model, call suggest_fields with focus: "<an area or a word from table names>" or with tables.'
  };
}

// read_model with tables: exactly the named tables, in full; names that don't exist are listed back; an answer that
// would pass LIMIT stops at a table and names the tables left out
export function namedTables(m, names) {
  const all = summary(m), by = new Map(all.map((t) => [lc(t.table), t]));
  const found = [], notFound = [];
  [...new Set((names || []).map((n) => String(n)))].forEach((n) => { const t = by.get(lc(n.trim())); if (t) { if (!found.includes(t)) found.push(t); } else notFound.push(n); });
  const out = { source: m.source, existingReports: m.taken || [], tables: [] }, notShown = [];
  if (notFound.length) out.notFound = notFound;
  for (const t of found) {
    out.tables.push(t);
    if (size(out) > LIMIT - 400 && out.tables.length > 1) { out.tables.pop(); notShown.push(t.table); }
  }
  if (notShown.length) { out.notShown = notShown; out.note = `The answer is kept under 40,000 characters: ${out.tables.length} of ${found.length} tables are shown. Call read_model again with the tables in notShown.`; }
  return out;
}

// The part of the model a request is about. opts: { focus: a word the user said, tables: [names] }.
// Returns { tables (the picker's tables, in the model's own order), scope } when there is a scope, { tables: all }
// for a small model without one, or { needsFocus, why, areas, tablesWithMeasures } when nothing can be picked:
// a large model without a focus, or a focus that matches nothing.
export function scopeOf(m, opts) {
  const focus = opts && opts.focus != null ? String(opts.focus).trim() : '', names = (opts && opts.tables) || null;
  const rawTables = raw(m).tables || [], order = new Map(rawTables.map((t, i) => [t.name, i]));
  const ask = (why) => ({ needsFocus: true, why, areas: areasOf(m).map((a) => ({ area: a.area, measures: a.measures, tables: a.tables })),
    tablesWithMeasures: m.tables.filter((t) => t.measures.length).map((t) => t.name).slice(0, 80),
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
    rawTables.forEach((t) => { if ((t.measures || []).some((ms) => lc(ms.displayFolder).includes(f))) folderHit.add(t.name); });
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
