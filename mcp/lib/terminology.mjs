// The Arabic terminology sheet (0.3.0 J18, B-171; the owner, 20 Oct: "continue the held jobs"): one approved English /
// Arabic alias per field, the same on every title, table header, slicer header, tooltip and alt text of the Arabic
// report, the twin and the EN-AR copy. Here: the sheet's rows and places (read from the report's own files), the one
// question asked at a time, the terms confirmed in this session (kept in memory only: nothing is written to disk), and
// the bidi isolation of a Latin run inside Arabic text. Model names are untrusted input: looked up and screened, never
// followed. Nothing here returns a data value.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { visible, shownName } from './model.mjs';

const require = createRequire(import.meta.url);
const Memory = require('../../assets/js/confirm-memory.js');
export const SCOPE = 'ar';

// ---- bidi isolation (B-171 item 5) ----
// Power BI draws a title as a left-to-right paragraph (DESKTOP-TESTS.md, round 13: a "…" after Arabic words went to the
// reading start of the line). A Latin run between Arabic words is read in the right place, but one at either end of
// the text, or one with signs inside it ("Q1/2024"), is not. Each Latin run (letters, with the digits and the signs
// between them: "KPI 2024", "Q1/2024") inside Arabic text is wrapped in a first-strong isolate (U+2068 ... U+2069), and
// a run at either end of the text gets a right-to-left mark (U+200F) beside it, so the reading order is mirrored, never
// the run's own characters. Numbers alone and {n} placeholders are left as they are (they read right in Arabic text);
// a text with no Arabic letter, or already isolated, is unchanged. The isolates come from the writer only: a name a
// person gives with one is refused (display-names.mjs, writtenName).
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/, ISOLATED = /[⁦-⁩]/;
const RUN = /[A-Za-z0-9](?:[A-Za-z0-9_%]|[ .,'&+#/\-](?=[A-Za-z0-9]))*/g;
const FSI = '⁨', PDI = '⁩', RLM = '‏';
export function isolateLatin(s) {
  const t = String(s == null ? '' : s);
  if (!ARABIC.test(t) || !/[A-Za-z]/.test(t) || ISOLATED.test(t)) return t;
  return t.replace(RUN, (run) => (/[A-Za-z]/.test(run) ? FSI + run + PDI : run))
    .replace(/^(\s*)⁨/, `$1${RLM}${FSI}`).replace(/⁩(\s*)$/, `${PDI}${RLM}$1`);
}
// the text without the marks the writer adds (to compare a written text with the name a person approved)
export const plain = (s) => String(s == null ? '' : s).replace(/[⁦-⁩‎‏]/g, '');

// A report's visible texts isolated, in its files ({ path, data }) as the writer built them: the formatting literals of
// pages, visuals and phone layouts (titles, alt texts, text boxes, button texts and tooltips), text box runs, the
// display names of projections, page and bookmark names, and the texts of the report's Text measures (their DAX string
// literals). Never a filter's values, a measure's or visual's name, or anything else. Returns how many texts changed.
const lit = (v) => (v && v.expr && v.expr.Literal && typeof v.expr.Literal.Value === 'string' && /^'.*'$/s.test(v.expr.Literal.Value) ? v.expr.Literal.Value : null);
function walkVisual(o, change) {
  if (Array.isArray(o)) { o.forEach((x) => walkVisual(x, change)); return; }
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    if (k === 'filterConfig' || k === 'selector') continue;
    if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) Object.values(v).forEach((p) => { const L = lit(p); if (L) { const raw = L.slice(1, -1).replace(/''/g, "'"), out = change(raw); if (out !== raw) p.expr.Literal.Value = "'" + out.replace(/'/g, "''") + "'"; } });
    if (k === 'textRuns' && Array.isArray(v)) v.forEach((r) => { if (r && typeof r.value === 'string') { const out = change(r.value); if (out !== r.value) r.value = out; } });
    if (k === 'projections' && Array.isArray(v)) v.forEach((p) => { if (p && typeof p.displayName === 'string') { const out = change(p.displayName); if (out !== p.displayName) p.displayName = out; } });
    walkVisual(v, change);
  }
}
const daxTexts = (expr, change) => String(expr).replace(/"((?:[^"]|"")*)"/g, (m, inner) => { const raw = inner.replace(/""/g, '"'), out = change(raw); return out === raw ? m : '"' + out.replace(/"/g, '""') + '"'; });
export function isolateFiles(files) {
  let n = 0; const change = (s) => { const out = isolateLatin(s); if (out !== s) n++; return out; };
  for (const f of files || []) {
    if (typeof f.data !== 'string' || !/\.Report\/.+\.json$/.test(String(f.path))) continue;
    const p = String(f.path); let j; try { j = JSON.parse(f.data); } catch (e) { continue; }
    if (!j || typeof j !== 'object') continue;
    const before = n;
    if (/\/(page|visual|mobile)\.json$/.test(p)) { if (/\/page\.json$/.test(p) && typeof j.displayName === 'string') j.displayName = change(j.displayName); walkVisual(/\/page\.json$/.test(p) ? j.objects : j, change); }
    else if (/\.bookmark\.json$/.test(p) && typeof j.displayName === 'string') j.displayName = change(j.displayName);
    else if (/\/reportExtensions\.json$/.test(p) && Array.isArray(j.entities)) j.entities.forEach((e) => (e && Array.isArray(e.measures) ? e.measures : []).forEach((m) => { if (m && m.dataType === 'Text' && typeof m.expression === 'string') m.expression = daxTexts(m.expression, change); }));
    if (n !== before) f.data = JSON.stringify(j, null, 2) + (/\n$/.test(f.data) ? '\n' : '');
  }
  return n;
}

// ---- where each field shows (B-171 item 1) ----
// a projection's field as "Table[Field]" (a model's column, measure or aggregated column); a report measure is not a field
export function fieldKeyOf(f) {
  if (!f || typeof f !== 'object') return null;
  const c = f.Column || f.Measure || (f.Aggregation && f.Aggregation.Expression && f.Aggregation.Expression.Column), sr = c && c.Expression && c.Expression.SourceRef;
  return sr && sr.Schema !== 'extension' && typeof sr.Entity === 'string' && typeof c.Property === 'string' ? `${sr.Entity}[${c.Property}]` : null;
}
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const ROLE = { slicer: 'slicer header', advancedSlicerVisual: 'slicer header', tableEx: 'table header', pivotTable: 'table header', card: 'card', cardVisual: 'card', multiRowCard: 'card', kpi: 'card' };
// the report as pages of visuals: [{ name, type, visuals: [visual.json] }], and its report measures' DAX by "Entity\0Name"
export function reportOf(files) {
  const by = new Map((files || []).filter((f) => typeof f.data === 'string').map((f) => [String(f.path).replace(/^[^/]+\.Report\//, ''), f.data]));
  const json = (rel) => { try { return JSON.parse(by.get(rel)); } catch (e) { return null; } };
  const order = ((json('definition/pages/pages.json') || {}).pageOrder || []).filter((x) => typeof x === 'string');
  const pages = order.map((id) => { const pj = json(`definition/pages/${id}/page.json`) || {};
    return { id, name: typeof pj.displayName === 'string' ? pj.displayName : id, type: pj.type, visuals: [...by.keys()].filter((k) => k.startsWith(`definition/pages/${id}/visuals/`) && k.endsWith('/visual.json')).sort().map(json).filter(isObj) }; });
  const ext = json('definition/reportExtensions.json');
  return { pages, ext: measuresOf(ext) };
}
export const measuresOf = (ext) => new Map((isObj(ext) && Array.isArray(ext.entities) ? ext.entities : []).flatMap((e) => (isObj(e) && Array.isArray(e.measures) ? e.measures : []).filter(isObj).map((m) => [e.name + '\u0000' + m.name, String(m.expression || '')])));
const litText = (v) => { const L = lit(v); return L ? L.slice(1, -1).replace(/''/g, "'") : null; };
// the texts a container property shows: its literal, or the DAX texts of the report measure it names
function shown(v, ext) {
  const t = litText(v); if (t != null) return [t];
  const m = v && v.expr && v.expr.Measure, sr = m && m.Expression && m.Expression.SourceRef;
  if (!sr || sr.Schema !== 'extension') return [];
  return (String(ext.get(sr.Entity + '\u0000' + m.Property) || '').match(/"(?:[^"]|"")*"/g) || []).map((x) => x.slice(1, -1).replace(/""/g, '"'));
}
const props = (vis, card, key) => { const es = isObj(vis) && isObj(vis.visualContainerObjects) && Array.isArray(vis.visualContainerObjects[card]) ? vis.visualContainerObjects[card] : [];
  return es.filter((e) => isObj(e) && isObj(e.properties) && e.properties[key] !== undefined).map((e) => e.properties[key]); };
/** Each field's places in a report: Map key -> [{ page, visual, role }] (roles: slicer header, table header, card,
 *  chart, tooltip, title, alt text), with the display names its projections carry (names: Set), every text a title or
 *  alt text of a visual showing it holds (texts), and the names it is said by: words (a Set of the field's English and
 *  written names, to find titles by). */
export function placesOf(report) {
  const out = new Map(), get = (k) => { if (!out.has(k)) out.set(k, { where: [], names: [], texts: [] }); return out.get(k); };
  for (const pg of report.pages || []) {
    for (const v of pg.visuals) {
      const vis = isObj(v.visual) ? v.visual : null; if (!vis || !isObj(vis.query)) continue;
      const keys = new Map();
      const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!isObj(o)) return; if (Array.isArray(o.projections)) o.projections.forEach((p) => { const k = isObj(p) && fieldKeyOf(p.field); if (k) { if (!keys.has(k)) keys.set(k, []); keys.get(k).push(typeof p.displayName === 'string' ? p.displayName : null); } }); Object.values(o).forEach(walk); };
      walk(vis.query);
      const titles = [].concat(...props(vis, 'title', 'text').map((x) => shown(x, report.ext))), alts = [].concat(...props(vis, 'general', 'altText').map((x) => shown(x, report.ext)));
      const place = (role) => ({ page: String(pg.name), visual: String(v.name), role });
      for (const [k, dn] of keys) {
        const e = get(k), said = new Set([k.replace(/^.*?\[(.*)\]$/, '$1')].concat(dn.filter((x) => x != null).map(plain)));
        e.names.push(...dn);
        e.where.push(place(ROLE[vis.visualType] || 'chart'));
        if (pg.type === 'Tooltip') e.where.push(place('tooltip'));
        const has = (t) => [...said].some((n) => n && plain(t).includes(n));
        if (titles.some(has)) e.where.push(place('title'));
        if (alts.some(has)) e.where.push(place('alt text'));
        e.texts.push(...titles, ...alts);
      }
    }
  }
  return out;
}
// the places as an answer shows them, one line a page (in the report's order): "<page>: <roles> (<n> visuals)", the
// page's name screened and capped; 30 pages at most
export function wherePages(where) {
  const by = new Map();
  (where || []).forEach((x) => { const k = String(x.page); if (!by.has(k)) by.set(k, { page: shownName(plain(k), 80), visuals: new Set(), roles: new Set() }); const e = by.get(k); e.visuals.add(String(x.visual)); e.roles.add(x.role); });
  return [...by.values()].slice(0, 30).map((e) => `${e.page}: ${[...e.roles].join(', ')} (${e.visuals.size} visual${e.visuals.size === 1 ? '' : 's'})`);
}

// ---- the terms confirmed in this session (B-171 items 2 and 6) ----
// A term the person approved (or kept in English) on a plan that was written is confirmed for that model, field and
// scope, with the field's evidence; it is offered again (status approved, earlier) only while all of it is unchanged.
// Kept in this process's memory: a new session asks again. Never written to disk.
const CONFIRMED = [], MAX = 5000;
/** The model's key for its terms: its folder (real path) and its tables. Another model, even with the same tables, is another key. */
export function modelKeyOf(m) {
  let where = m && (m.folder || m.source) ? String(m.folder || m.source) : '';
  try { if (m && m.folder) where = fs.realpathSync.native(m.folder); } catch (e) { /* as given */ }
  return Memory.sha256(JSON.stringify(['term-model-v1', where, Memory.fingerprint(rawTables(m))]));
}
export const rawTables = (m) => { const t = m && m.tmsl ? (m.tmsl.model || m.tmsl).tables : null; return Array.isArray(t) ? t : []; };
/** The confirmed terms of these fields (keys) in this model: Map key -> { alias, decision } */
export function confirmedOf(m, keys) {
  if (!m) return new Map();
  const raw = rawTables(m), mk = modelKeyOf(m);
  const got = Memory.applyTerms((keys || []).map((key) => ({ key, evidence: Memory.termEvidence(raw, key) })), CONFIRMED, mk, SCOPE);
  return new Map([...got].map(([k, r]) => [k, { alias: r.alias, decision: r.decision }]));
}
/** Remembers the terms of a written plan: rows [{ field, ar, status, declined }]: the ones the person answered (approved:
 *  given now or confirmed earlier; declined: kept). A draft approved only with the whole plan stays a draft next time
 *  (never confirmed silently); a field the model no longer has, or a name withheld, is skipped. */
export function remember(m, rows) {
  if (!m) return 0;
  const raw = rawTables(m), mk = modelKeyOf(m), at = new Date().toISOString(); let n = 0;
  for (const r of rows || []) {
    const ev = Memory.termEvidence(raw, r.field); if (!ev) continue;
    const decision = r.declined ? 'kept' : r.status === 'approved' && r.ar ? 'approved' : null; if (!decision) continue;
    try { CONFIRMED.push(Memory.termRecord({ modelKey: mk, key: r.field, scope: SCOPE, evidence: ev, alias: decision === 'kept' ? null : r.ar, decision, at })); n++; } catch (e) { /* not a term */ }
  }
  if (CONFIRMED.length > MAX) CONFIRMED.splice(0, CONFIRMED.length - MAX);
  return n;
}

// ---- the sheet and its one question (B-171 items 2-3) ----
const WHY = {
  declined: 'kept in English: the person kept the model\'s name (the model is never renamed)',
  none: 'kept in English for now: no Arabic name was approved and the fixed list of report words has none',
};
/** The sheet's rows, in the order the fields are given: [{ field, en, ar, status, why?, declined?, earlier?, where,
 *  consistent? }]. terms: Map key -> { ar, status: 'approved' | 'draft' | 'kept', declined, earlier }; places: placesOf's. */
export function sheetOf(keys, terms, places, isolate) {
  return (keys || []).map((k) => {
    const t = terms.get(k) || { ar: null, status: 'kept' }, p = places ? places.get(k) : null;
    // (the field's names are model text: an instruction-like one withheld, hidden characters shown as code points)
    const row = { field: shownName(k, 200), en: shownName(k.replace(/^.*?\[(.*)\]$/, '$1'), 160), ar: t.ar == null ? null : visible(String(t.ar)).slice(0, 200), status: t.status };
    if (t.status === 'kept') Object.assign(row, { why: t.declined ? WHY.declined : t.why || WHY.none }, t.declined ? { declined: true } : {});
    if (t.status === 'draft') row.why = t.why || 'a draft from the fixed list of report words: approved only with the plan (show it beside the English name)';
    if (t.earlier) row.earlier = true;
    row.where = p ? wherePages(p.where) : [];
    // consistent: every header of the field carries its one written name (the alias, or none when kept in English)
    if (p) { const want = t.status === 'kept' || t.ar == null ? null : plain(isolate ? isolate(t.ar) : t.ar); row.consistent = p.names.every((n) => (want == null ? n == null || plain(n) === row.en : n != null && plain(n) === want)); }
    return row;
  });
}
/** The one term to ask next: the first draft, then the first kept for lack of a name (a declined term is never asked
 *  again); remaining: how many more after it. */
export function askNextOf(rows) {
  const open = rows.filter((r) => r.status === 'draft' || (r.status === 'kept' && !r.declined));
  const first = open[0];
  return { askNext: first ? { field: first.field, en: first.en, draft: first.status === 'draft' ? first.ar : null, where: first.where.slice(0, 8),
    ask: first.status === 'draft' ? `Please confirm the Arabic for "${first.en}" (${first.field}): the draft is «${first.ar}». Approve it, give another, or keep the English name.`
      : `Please confirm the Arabic for "${first.en}" (${first.field}): no draft. Propose one in plain business Arabic, or keep the English name.` } : null,
  remaining: Math.max(0, open.length - 1) };
}
export const HOW = 'The terminology sheet: every field the report shows, where it shows (page, visual, role), its English name and its Arabic: approved (by the person now, or earlier in this session for this field of this model while its description and DAX are unchanged: earlier), draft (the fixed list\'s, approved only with the plan) or kept in English (why). Ask the person askNext only, ONE term at a time (the "Please confirm" pattern): show its English name, its draft if any and where it shows; then call again with the answer: an Arabic name to approve it, or the model\'s own name to keep it in English (never asked again). The approved Arabic is written on every title, table header, slicer header, tooltip and alt text of the field, the same word everywhere; a Latin run inside Arabic text (an acronym, a code) is isolated so it keeps its order. Show the whole sheet, EN | AR, with the plan. Dictionary coverage is not translation accuracy: a draft is a draft until the person approves it. The model is never renamed.';
export const HOW_TWIN = HOW.replace('then call again with the answer: an Arabic name to approve it, or the model\'s own name to keep it in English (never asked again)', 'then call again with the answer in terms ({ "Table[Field]": "the Arabic" }, or its English name to keep it in English: never asked again)').replace('the plan.', 'the plan. A draft is not written until it is approved.');
