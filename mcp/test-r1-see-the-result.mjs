// R1 (20 Oct 2026, research "see the result"; written red first): the two prototypes of mcp/research/SEE-THE-RESULT.md.
//   S-1..S-14  lib/shadow-model.mjs: a throwaway copy of a model with the same tables, columns, types, relationships,
//              hierarchies and measures, and MADE-UP typed rows (Power Query #table with a typed row set: the owner's
//              measured rule, an untyped one loads every column as text), on every fixture model and on a made-up model
//              with the hard cases (DAX-table columns with no type, a date table with sort-by columns, a 1:1 and a
//              many-to-many relationship, a field parameter, roles, translations, descriptions)
//   B-1..B-9   lib/box-diff.mjs: a box-level comparison of two drawings of a page (what a calibrated renderer would be
//              scored by against Desktop's captures), on hand-made pages and on the fixtures' planned reports
//   node test-r1-see-the-result.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const Tmdl = req('../assets/js/tmdl-model.js');
const P = req('../assets/js/page-preview.js');
let S = null, B = null;
try { S = await import('./lib/shadow-model.mjs'); } catch (e) { S = null; }
try { B = await import('./lib/box-diff.mjs'); } catch (e) { B = null; }
chk(() => S && typeof S.shadowModel === 'function' && typeof S.shadowProject === 'function', () => 'S-1. lib/shadow-model.mjs exports shadowModel and shadowProject');
chk(() => B && typeof B.compare === 'function' && typeof B.boxesOfSvg === 'function' && typeof B.boxesOfPage === 'function', () => 'B-1. lib/box-diff.mjs exports compare, boxesOfSvg and boxesOfPage');

// ---------- reading the shadow's Power Query rows, on its own (not through the lib) ----------
// #table(type table [#"A" = T, ...], { { v, ... }, ... }): the column types and the rows, every literal parsed
function readTable(m) {
  const s = String(m); let i = s.indexOf('#table(');
  if (i < 0) return null;
  i += 7;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const eat = (t) => { ws(); if (s.slice(i, i + t.length) !== t) throw new Error(`expected ${t} at ${i}: ${s.slice(i, i + 30)}`); i += t.length; };
  const str = () => { eat('"'); let o = ''; for (;;) { if (s[i] === '"') { if (s[i + 1] === '"') { o += '"'; i += 2; } else { i++; return o; } } else o += s[i++]; } };
  const ident = () => { ws(); if (s[i] === '#' && s[i + 1] === '"') { i++; return str(); } const m2 = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(s.slice(i)); i += m2[0].length; return m2[0]; };
  eat('type'); eat('table'); eat('[');
  const types = [];
  for (;;) { ws(); if (s[i] === ']') { i++; break; } const name = ident(); eat('='); const t = ident(); types.push({ name, type: t }); ws(); if (s[i] === ',') i++; }
  eat(','); eat('{');
  const value = () => {
    ws();
    if (s[i] === '"') return { kind: 'text', v: str() };
    if (s.startsWith('#datetime(', i)) { i += 10; const close = s.indexOf(')', i), parts = s.slice(i, close).split(',').map((x) => +x.trim()); i = close + 1; return { kind: 'datetime', v: parts }; }
    if (s.startsWith('true', i)) { i += 4; return { kind: 'logical', v: true }; }
    if (s.startsWith('false', i)) { i += 5; return { kind: 'logical', v: false }; }
    if (s.startsWith('null', i)) { i += 4; return { kind: 'null', v: null }; }
    const m2 = /^-?\d+(\.\d+)?/.exec(s.slice(i)); if (!m2) throw new Error('bad literal at ' + s.slice(i, i + 20)); i += m2[0].length; return { kind: m2[1] ? 'decimal' : 'integer', v: +m2[0] };
  };
  const rows = [];
  for (;;) {
    ws(); if (s[i] === '}') { i++; break; }
    eat('{'); const row = [];
    for (;;) { ws(); if (s[i] === '}') { i++; break; } row.push(value()); ws(); if (s[i] === ',') i++; }
    rows.push(row); ws(); if (s[i] === ',') i++;
  }
  return { types, rows };
}
const M_OF = { int64: 'Int64.Type', double: 'number', decimal: 'Currency.Type', dateTime: 'datetime', string: 'text', boolean: 'logical' };
const fits = (val, t) => (t === 'Int64.Type' ? val.kind === 'integer' : t === 'number' || t === 'Currency.Type' ? val.kind === 'integer' || val.kind === 'decimal'
  : t === 'datetime' ? val.kind === 'datetime' && val.v.length === 6 && !Number.isNaN(Date.UTC(val.v[0], val.v[1] - 1, val.v[2])) && new Date(Date.UTC(val.v[0], val.v[1] - 1, val.v[2])).getUTCDate() === val.v[2]
    : t === 'text' ? val.kind === 'text' : t === 'logical' ? val.kind === 'logical' : false);
const keyOf = (val) => (val.kind === 'datetime' ? val.v.join('-') : String(val.v));
const filesOf = (dir) => { const out = []; const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else out.push(f); }); rec(dir); return out; };

// ---------- the shadow of one model, checked against the model ----------
function checkShadow(label, tmsl, opts) {
  const o = opts || {}, src = tmsl.model || tmsl;
  let sh = null;
  chk(() => { sh = S.shadowModel(tmsl); return sh && Array.isArray(sh.files) && sh.files.length >= 3; }, () => `S-2 ${label}. shadowModel gives the TMDL files of the copy`);
  if (!sh) return null;
  const tm = sh.files.filter((f) => /\.tmdl$/.test(f.path));
  let back = null;
  chk(() => { back = Tmdl.fromFiles(tm.map((f) => ({ path: f.path, text: f.text }))).model; return back && Array.isArray(back.tables); }, () => `S-2 ${label}. the copy's TMDL parses with the repo's reader (tmdl-model.js)`);
  if (!back) return null;
  const T = (m, n) => m.tables.find((t) => t.name === n);
  // same tables, columns, measures, hierarchies
  chk(() => JSON.stringify(back.tables.map((t) => t.name).sort()) === JSON.stringify(src.tables.map((t) => t.name).sort()), () => `S-3 ${label}. same tables: ${back.tables.map((t) => t.name).filter((n) => !T(src, n)).concat(src.tables.map((t) => t.name).filter((n) => !T(back, n))).slice(0, 5).join(', ')}`);
  const colDiff = [], measDiff = [], hierDiff = [], typeDiff = [], fmtDiff = [];
  src.tables.forEach((t) => {
    const b = T(back, t.name); if (!b) return;
    const cn = (x) => (x.columns || []).filter((c) => c.type !== 'rowNumber').map((c) => c.name).join('|');
    if (cn(t) !== cn(b)) colDiff.push(`${t.name}: ${cn(t)} -> ${cn(b)}`);
    const mn = (x) => (x.measures || []).map((m) => m.name + '=' + String(Array.isArray(m.expression) ? m.expression.join('\n') : m.expression).trim()).join('|');
    if (mn(t) !== mn(b)) measDiff.push(t.name);
    const hn = (x) => JSON.stringify((x.hierarchies || []).map((h) => [h.name, (h.levels || []).map((l) => [l.name, l.column])]));
    if (hn(t) !== hn(b)) hierDiff.push(`${t.name}: ${hn(t)} -> ${hn(b)}`);
    (t.columns || []).forEach((c) => {
      const bc = (b.columns || []).find((x) => x.name === c.name); if (!bc) return;
      const want = c.dataType && c.dataType !== 'unknown' ? c.dataType : ((sh.guessed || []).find((g) => g.table === t.name && g.column === c.name) || {}).as;
      if (!want || (bc.dataType !== want && !(c.type === 'calculated' && bc.dataType === 'unknown' && (!c.dataType || c.dataType === 'unknown')))) typeDiff.push(`${t.name}[${c.name}] ${c.dataType} -> ${bc.dataType} (guess ${want})`);
      ['formatString', 'sortByColumn', 'isHidden', 'summarizeBy', 'dataCategory'].forEach((k) => { if ((c[k] == null ? null : String(c[k])) !== (bc[k] == null ? null : String(bc[k]))) fmtDiff.push(`${t.name}[${c.name}].${k}: ${c[k]} -> ${bc[k]}`); });
    });
  });
  chk(() => !colDiff.length, () => `S-3 ${label}. same columns in the same order: ${colDiff.slice(0, 3).join('; ')}`);
  chk(() => !measDiff.length, () => `S-3 ${label}. same measures, their DAX kept: ${measDiff.slice(0, 5).join(', ')}`);
  chk(() => !hierDiff.length, () => `S-3 ${label}. same hierarchies: ${hierDiff.slice(0, 3).join('; ')}`);
  chk(() => !typeDiff.length, () => `S-4 ${label}. every column keeps its type (a column with none gets a listed guess): ${typeDiff.slice(0, 5).join('; ')}`);
  chk(() => !fmtDiff.length, () => `S-4 ${label}. format, sort-by, hidden, summarize-by and category kept: ${fmtDiff.slice(0, 5).join('; ')}`);
  const rk = (r) => [r.fromTable, r.fromColumn, r.toTable, r.toColumn, r.fromCardinality || 'many', r.toCardinality || 'one', r.crossFilteringBehavior || 'oneDirection', r.isActive === false ? 'off' : 'on'].join('|');
  chk(() => JSON.stringify((back.relationships || []).map(rk).sort()) === JSON.stringify((src.relationships || []).map(rk).sort()), () => `S-5 ${label}. same relationships (columns, cardinality, direction, active)`);

  // the rows: one Power Query partition a table with a typed #table, or a kept field parameter
  const rows = new Map(), partBad = [], typeBad = [], valBad = [], sizeBad = [];
  back.tables.forEach((t) => {
    const parts = t.partitions || [];
    const fp = parts.length === 1 && parts[0].source && parts[0].source.type === 'calculated' && /\bNAMEOF\b/.test(String(parts[0].source.expression || ''));
    if (fp) { if (!(o.fieldParams || []).includes(t.name)) partBad.push(`${t.name}: a DAX partition kept but not a field parameter`); return; }
    if (parts.length !== 1 || parts[0].source.type !== 'm' || (parts[0].mode && parts[0].mode !== 'import')) { partBad.push(`${t.name}: ${parts.map((p) => p.source && p.source.type).join()}`); return; }
    let tb = null; try { tb = readTable(parts[0].source.expression); } catch (e) { tb = null; partBad.push(`${t.name}: ${e.message}`); return; }
    if (!tb) { partBad.push(`${t.name}: no #table`); return; }
    const data = (t.columns || []).filter((c) => c.type !== 'calculated');
    if (tb.types.map((x) => x.name).join('|') !== data.map((c) => c.sourceColumn || c.name).join('|')) typeBad.push(`${t.name}: the typed columns ${tb.types.map((x) => x.name).join()} are not the data columns ${data.map((c) => c.name).join()}`);
    data.forEach((c, k) => { const ty = tb.types[k]; if (ty && ty.type !== M_OF[c.dataType]) typeBad.push(`${t.name}[${c.name}] ${c.dataType} typed ${ty.type}`); });
    tb.rows.forEach((r, ri) => { if (r.length !== tb.types.length) valBad.push(`${t.name} row ${ri}: ${r.length} values`); else r.forEach((v, k) => { if (!fits(v, tb.types[k].type)) valBad.push(`${t.name}[${tb.types[k].name}] row ${ri}: ${JSON.stringify(v)} is not ${tb.types[k].type}`); }); });
    if (!tb.rows.length || tb.rows.length > 400) sizeBad.push(`${t.name}: ${tb.rows.length} rows`);
    const byCol = new Map(); tb.types.forEach((x, k) => byCol.set(x.name, tb.rows.map((r) => r[k])));
    rows.set(t.name, byCol);
  });
  chk(() => !partBad.length, () => `S-6 ${label}. every table has one import Power Query partition (a field parameter keeps its DAX): ${partBad.slice(0, 4).join('; ')}`);
  chk(() => !typeBad.length, () => `S-6 ${label}. the #table's types are the columns' types; no number, date or true/false typed as text: ${typeBad.slice(0, 4).join('; ')}`);
  chk(() => !valBad.length, () => `S-7 ${label}. every made-up value is a value of its column's type: ${valBad.slice(0, 4).join('; ')}`);
  chk(() => !sizeBad.length, () => `S-8 ${label}. every table has made-up rows, at most 400: ${sizeBad.slice(0, 4).join('; ')}`);
  // relationship keys: the "one" side unique, every "many" value on the "one" side
  const relBad = [];
  (back.relationships || []).forEach((r) => {
    const f = rows.get(r.fromTable) && rows.get(r.fromTable).get(r.fromColumn), t = rows.get(r.toTable) && rows.get(r.toTable).get(r.toColumn);
    if (!f || !t) { relBad.push(`${r.fromTable}[${r.fromColumn}] -> ${r.toTable}[${r.toColumn}]: a side has no made-up rows`); return; }
    const fv = f.map(keyOf), tv = t.map(keyOf), fs1 = new Set(fv), ts1 = new Set(tv);
    const oneF = r.fromCardinality === 'one', oneT = (r.toCardinality || 'one') === 'one';
    if (oneT && ts1.size !== tv.length) relBad.push(`${r.toTable}[${r.toColumn}] (one side) not unique`);
    if (oneF && fs1.size !== fv.length) relBad.push(`${r.fromTable}[${r.fromColumn}] (one side) not unique`);
    if (oneT && !oneF && fv.some((v) => !ts1.has(v))) relBad.push(`${r.fromTable}[${r.fromColumn}] has values missing from ${r.toTable}[${r.toColumn}]`);
    if (oneT && oneF) { const [small, big] = fs1.size <= ts1.size ? [fs1, ts1] : [ts1, fs1]; if ([...small].some((v) => !big.has(v))) relBad.push(`1:1 ${r.fromTable}-${r.toTable}: the smaller side's keys not all on the other`); }
    if (!oneT && !oneF && ![...fs1].some((v) => ts1.has(v))) relBad.push(`many-to-many ${r.fromTable}-${r.toTable}: no key in common`);
    if (f.some((v) => v.kind === 'null') || t.some((v) => v.kind === 'null')) relBad.push(`${r.fromTable}-${r.toTable}: a blank key`);
  });
  chk(() => !relBad.length, () => `S-9 ${label}. relationship keys match: ${relBad.slice(0, 4).join('; ')}`);
  // sort-by: one sort value per value
  const sortBad = [];
  back.tables.forEach((t) => (t.columns || []).filter((c) => c.sortByColumn).forEach((c) => {
    const cols = rows.get(t.name); if (!cols) return;
    const a = cols.get(c.sourceColumn || c.name), b = cols.get(((t.columns || []).find((x) => x.name === c.sortByColumn) || {}).sourceColumn || c.sortByColumn);
    if (!a || !b) { if (cols.size) sortBad.push(`${t.name}[${c.name}] by ${c.sortByColumn}: a side has no made-up rows`); return; }
    const seen = new Map(); a.forEach((v, k) => { const kk = keyOf(v), s = keyOf(b[k]); if (seen.has(kk) && seen.get(kk) !== s) sortBad.push(`${t.name}[${c.name}] "${kk}" sorts by ${seen.get(kk)} and ${s}`); seen.set(kk, s); });
  }));
  chk(() => !sortBad.length, () => `S-10 ${label}. every sort-by column gives one sort value per value: ${[...new Set(sortBad)].slice(0, 4).join('; ')}`);
  // the date tables: contiguous days
  const dateBad = [];
  (o.dateTables || []).forEach(([tn, cn]) => {
    const d = rows.get(tn) && rows.get(tn).get(cn); if (!d) { dateBad.push(`${tn}[${cn}] has no rows`); return; }
    const ms = d.map((v) => Date.UTC(v.v[0], v.v[1] - 1, v.v[2])).sort((x, y) => x - y);
    if (ms.length < 365 || ms.some((x, k) => k && x - ms[k - 1] !== 86400000)) dateBad.push(`${tn}[${cn}]: ${ms.length} days, not one after another`);
  });
  chk(() => !dateBad.length, () => `S-11 ${label}. a date table has a year of days, one after another: ${dateBad.join('; ')}`);
  // same model, same bytes
  chk(() => JSON.stringify(S.shadowModel(tmsl).files) === JSON.stringify(sh.files), () => `S-12 ${label}. the same model gives the same copy, byte for byte`);
  // nothing of the model's own row values, sources or descriptions
  const all = sh.files.map((f) => f.text).join('\n');
  const own = new Set();
  src.tables.forEach((t) => (t.partitions || []).forEach((p) => { const e = String(Array.isArray(p.source && p.source.expression) ? p.source.expression.join('\n') : (p.source && p.source.expression) || ''); if (/\bNAMEOF\b/.test(e)) return; [...e.matchAll(/"((?:[^"]|"")*)"/g)].map((x) => x[1]).filter((x) => x.length >= 4 && !/^\d{4}-\d{2}-\d{2}$/.test(x)).forEach((x) => own.add(x)); }));
  // (the names of columns are in a DATATABLE's header, and a date table's month and day names are made from its made-up
  // dates: neither is a row value of the model)
  src.tables.forEach((t) => (t.columns || []).forEach((c) => own.delete(c.name)));
  ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach((w) => own.delete(w));
  const leaked = [...own].filter((w) => all.includes('"' + w + '"'));
  chk(() => !leaked.length && !/\bDATATABLE\b/.test(all), () => `S-13 ${label}. no row value or source text of the model's own partitions in the copy: ${leaked.slice(0, 5).join(', ')}`);
  chk(() => !/^\s*(lineageTag|sourceLineageTag)\s*:/m.test(all) && !/^\s*\/\/\//m.test(all) && !/^\s*annotation\s/m.test(all), () => `S-13 ${label}. no lineage tags, descriptions or annotations in the copy`);
  return { sh, back, rows };
}

// ---------- the fixture models ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r1-'));
try {
  const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
  cp('test-models/arabic-long-names', 'arabic'); cp('test-models/no-measures', 'plain'); cp('fixtures/health-project', 'health'); cp('fixtures/twin-project', 'twin');
  cp('test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('./lib/model.mjs');
  const models = {};
  for (const k of ['plain', 'arabic', 'large', 'health', 'twin']) models[k] = loadModel(k, { root: ROOT });
  const dates = { plain: [['Dates', 'Date']], twin: [['Calendar', 'Date']], arabic: [['التقويم', 'التاريخ']] };
  if (S) {
    for (const [k, m] of Object.entries(models)) {
      chk(() => m && m.tmsl && (m.tmsl.model || m.tmsl).tables.length, () => `S-2 ${k}. the fixture loads`);
      const r = checkShadow(k, m.tmsl, { dateTables: dates[k] || [] });
      if (k === 'arabic' && r) {
        // Arabic names get Arabic words (a right-to-left page shows right-to-left labels)
        const tx = [...r.rows.values()].flatMap((c) => [...c.values()]).flat().filter((v) => v.kind === 'text').map((v) => v.v);
        chk(() => tx.some((v) => /[\u0600-\u06FF]/.test(v)), () => 'S-14 arabic. text columns with Arabic names get Arabic made-up words');
      }
      if (k === 'large' && r) chk(() => r.sh.files.reduce((a, f) => a + f.text.length, 0) < 4e6, () => 'S-8 large. the 300-table copy stays small (under 4 MB of TMDL)');
    }
    // the project the laptop opens: the shadow model and the written report pointed at it
    const twinDir = path.join(ROOT, 'twin', 'Twin Sales.Report'), rep = filesOf(twinDir).map((f) => ({ path: path.relative(twinDir, f).split(path.sep).join('/'), data: fs.readFileSync(f) }));
    let pj = null;
    chk(() => { pj = S.shadowProject(models.twin.tmsl, { name: 'Shadow', report: rep }); return pj && Array.isArray(pj.files); }, () => 'S-15. shadowProject gives the project the laptop opens');
    if (pj) {
      const at = (p) => pj.files.find((f) => f.path === p);
      chk(() => at('Shadow.pbip') && JSON.parse(at('Shadow.pbip').text).artifacts[0].report.path === 'Shadow.Report', () => 'S-15. a .pbip that opens Shadow.Report');
      chk(() => at('Shadow.Report/definition.pbir') && JSON.parse(at('Shadow.Report/definition.pbir').text).datasetReference.byPath.path === '../Shadow.SemanticModel', () => 'S-15. the report points at the shadow model (definition.pbir byPath)');
      chk(() => at('Shadow.SemanticModel/definition.pbism') && at('Shadow.SemanticModel/definition/model.tmdl'), () => 'S-15. the shadow model\'s folder (definition.pbism, definition/*.tmdl)');
      const same = rep.filter((f) => f.path !== 'definition.pbir').every((f) => { const g = at('Shadow.Report/' + f.path); return g && Buffer.from(g.data != null ? g.data : g.text).equals(Buffer.from(f.data)); });
      chk(() => same && pj.files.filter((f) => f.path.startsWith('Shadow.Report/')).length === rep.length, () => 'S-15. every other report file copied unchanged, nothing added to the report');
      chk(() => pj.files.every((f) => !/\.\.|^\/|\\/.test(f.path)), () => 'S-15. every path stays inside the project folder');
    }
  }

  // ---------- a made-up model with the hard cases ----------
  const made = { model: { culture: 'en-US', tables: [
    { name: 'Sales', columns: [
      { name: 'Sale Id', dataType: 'int64', sourceColumn: 'Sale Id', summarizeBy: 'none', lineageTag: 'a1' },
      { name: 'Sale Date', dataType: 'dateTime', sourceColumn: 'Sale Date', formatString: 'Short Date' },
      { name: 'Customer Key', dataType: 'string', sourceColumn: 'Customer Key' },
      { name: 'Amount', dataType: 'decimal', sourceColumn: 'Amount', formatString: '#,0.00', description: 'net of returns' },
      { name: 'Margin %', dataType: 'double', sourceColumn: 'Margin %', formatString: '0.0%' },
      { name: 'Is Online', dataType: 'boolean', sourceColumn: 'Is Online' },
      { name: 'Amount Doubled', type: 'calculated', dataType: 'double', expression: '[Amount] * 2' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Avg Margin', expression: ['AVERAGE (', '    Sales[Margin %]', ')'], formatString: '0.0%' }],
    partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = Sql.Database("prod-sql-01", "SalesDb"), T = Source{[Name="FactSales"]}[Data] in T' } }] },
    { name: 'Customer', columns: [
      { name: 'Customer Key', dataType: 'string', sourceColumn: 'Customer Key', isKey: true },
      { name: 'Customer Name', dataType: 'string', sourceColumn: 'Customer Name' },
      { name: 'Segment', dataType: 'string', sourceColumn: 'Segment', sortByColumn: 'Segment Order' },
      { name: 'Segment Order', dataType: 'int64', sourceColumn: 'Segment Order', isHidden: true }],
    partitions: [{ name: 'Customer', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [#"Customer Key" = text], {{"CUST-SECRET-ACME"}}) in Source' } }] },
    { name: 'Customer Extra', columns: [
      { name: 'Customer Key', dataType: 'string', sourceColumn: 'Customer Key' },
      { name: 'Credit Limit', dataType: 'double', sourceColumn: 'Credit Limit' }],
    partitions: [{ name: 'Customer Extra', mode: 'import', source: { type: 'm', expression: 'let S = Excel.Workbook(File.Contents("C:\\\\finance\\\\limits.xlsx")) in S' } }] },
    { name: 'Budget', columns: [
      { name: 'Segment', dataType: 'string', sourceColumn: 'Segment' },
      { name: 'Budget Amount', dataType: 'double', sourceColumn: 'Budget Amount' }],
    partitions: [{ name: 'Budget', mode: 'import', source: { type: 'calculated', expression: 'DATATABLE ( "Segment", STRING, "Budget Amount", DOUBLE, { { "Platinum Secret Tier", 990000 } } )' } }] },
    { name: 'Calendar', dataCategory: 'Time', columns: [
      { name: 'Date', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Date]', isKey: true },
      { name: 'Year', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Year]' },
      { name: 'Quarter', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Quarter]' },
      { name: 'Month Number', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Number]' },
      { name: 'Month Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Name]', sortByColumn: 'Month Number' },
      { name: 'Day Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day Name]', sortByColumn: 'Day of Week' },
      { name: 'Day of Week', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day of Week]' },
      { name: 'Is Weekend', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Is Weekend]' }],
    hierarchies: [{ name: 'Year-Month', levels: [{ name: 'Year', ordinal: 0, column: 'Year' }, { name: 'Month', ordinal: 1, column: 'Month Name' }] }],
    partitions: [{ name: 'Calendar', mode: 'import', source: { type: 'calculated', expression: 'ADDCOLUMNS ( CALENDAR ( DATE ( 2024, 1, 1 ), DATE ( 2024, 12, 31 ) ), "Year", YEAR ( [Date] ) )' } }] },
    { name: 'Pick a measure', columns: [
      { name: 'Pick a measure', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value1]', sortByColumn: 'Pick a measure Order', relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Pick a measure Fields' }] } },
      { name: 'Pick a measure Fields', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value2]', isHidden: true, extendedProperties: [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }] },
      { name: 'Pick a measure Order', type: 'calculatedTableColumn', dataType: 'int64', sourceColumn: '[Value3]', isHidden: true }],
    partitions: [{ name: 'Pick a measure', mode: 'import', source: { type: 'calculated', expression: '{ ("Total Sales", NAMEOF(\'Sales\'[Total Sales]), 0), ("Avg Margin", NAMEOF(\'Sales\'[Avg Margin]), 1) }' } }] }],
  relationships: [
    { name: 'r1', fromTable: 'Sales', fromColumn: 'Sale Date', toTable: 'Calendar', toColumn: 'Date' },
    { name: 'r2', fromTable: 'Sales', fromColumn: 'Customer Key', toTable: 'Customer', toColumn: 'Customer Key' },
    { name: 'r3', fromTable: 'Customer Extra', fromColumn: 'Customer Key', toTable: 'Customer', toColumn: 'Customer Key', fromCardinality: 'one', toCardinality: 'one', crossFilteringBehavior: 'bothDirections' },
    { name: 'r4', fromTable: 'Budget', fromColumn: 'Segment', toTable: 'Customer', toColumn: 'Segment', fromCardinality: 'many', toCardinality: 'many', isActive: false }],
  roles: [{ name: 'North only', modelPermission: 'read', tablePermissions: [{ name: 'Customer', filterExpression: '[Segment] = "Platinum Secret Tier"' }] }],
  cultures: [{ name: 'ar-AE', translations: {} }],
  expressions: [{ name: 'ServerName', kind: 'm', expression: '"prod-sql-01" meta [IsParameterQuery=true]' }] } };
  if (S) {
    const r = checkShadow('made-up', made, { dateTables: [['Calendar', 'Date']], fieldParams: ['Pick a measure'] });
    if (r) {
      const g = (c) => ((r.sh.guessed || []).find((x) => x.table === 'Calendar' && x.column === c) || {}).as;
      chk(() => g('Date') === 'dateTime' && g('Year') === 'int64' && g('Month Number') === 'int64' && g('Day of Week') === 'int64' && g('Month Name') === 'string' && g('Quarter') === 'string' && g('Is Weekend') === 'boolean',
        () => `S-4 made-up. a DAX table's untyped columns get a type by their name, listed: ${JSON.stringify(r.sh.guessed)}`);
      const cal = r.rows.get('Calendar');
      chk(() => { const d = cal.get('Date'), mn = cal.get('Month Name'), y = cal.get('Year'); return d.every((v, k) => mn[k].v === ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][v.v[1] - 1] && y[k].v === v.v[0]); },
        () => 'S-11 made-up. the date table\'s Year and Month Name follow its Date');
      const all = r.sh.files.map((f) => f.text).join('\n');
      chk(() => !/prod-sql-01|SalesDb|limits\.xlsx|Platinum Secret Tier|CUST-SECRET-ACME|net of returns/.test(all), () => 'S-13 made-up. no source, server, file, row value, role filter or description of the model in the copy');
      chk(() => !/^\s*role\s/m.test(all) && !/^\s*cultureInfo\s/m.test(all) && !/^\s*expression\s/m.test(all), () => 'S-13 made-up. roles, translations and shared expressions are not in the copy');
      chk(() => ['roles', 'cultures', 'expressions'].every((k) => (r.sh.notes || []).some((n) => n.includes(k))), () => `S-13 made-up. what is left out is said in the notes: ${JSON.stringify(r.sh.notes)}`);
      const calc = (r.back.tables.find((t) => t.name === 'Sales').columns || []).find((c) => c.name === 'Amount Doubled');
      chk(() => calc && calc.type === 'calculated' && /\[Amount\] \* 2/.test(calc.expression), () => 'S-3 made-up. a calculated column keeps its DAX');
      const fp = r.back.tables.find((t) => t.name === 'Pick a measure'), fpc = fp && fp.columns.find((c) => c.name === 'Pick a measure Fields');
      chk(() => fpc && fpc.extendedProperties.length === 1 && fpc.extendedProperties[0].name === 'ParameterMetadata' && fpc.extendedProperties[0].type === 'json' && JSON.stringify(fpc.extendedProperties[0].value) === JSON.stringify({ version: 3, kind: 2 }) && fp.columns[0].relatedColumnDetails, () => 'S-6 made-up. a field parameter keeps its DAX, ParameterMetadata and its group-by column');
      const amt = r.rows.get('Sales').get('Margin %');
      chk(() => amt.every((v) => v.v >= 0 && v.v <= 1), () => 'S-7 made-up. a % column gets values between 0 and 1');
    }
  }

  // ---------- S-16: the DAX form (a DATATABLE a table: Desktop computes it on open, no refresh needed) ----------
  if (S) {
    const DT = { int64: 'INTEGER', double: 'DOUBLE', decimal: 'CURRENCY', dateTime: 'DATETIME', string: 'STRING', boolean: 'BOOLEAN' };
    for (const [label, tm, fp] of [['twin', models.twin.tmsl, []], ['arabic', models.arabic.tmsl, []], ['made-up', made, ['Pick a measure']]]) {
      let sh = null, back = null;
      chk(() => { sh = S.shadowModel(tm, { form: 'dax' }); back = Tmdl.fromFiles(sh.files.filter((f) => /\.tmdl$/.test(f.path)).map((f) => ({ path: f.path, text: f.text }))).model; return back.tables.length === (tm.model || tm).tables.length; }, () => `S-16 ${label}. the DAX form parses with the repo's reader`);
      if (!back) continue;
      const bad = [], keys = new Map();
      back.tables.filter((t) => !fp.includes(t.name)).forEach((t) => {
        const e = String(((t.partitions || [])[0] || { source: {} }).source.expression || ''), head = [...e.slice(0, e.indexOf('{')).matchAll(/"((?:[^"]|"")*)"\s*,\s*([A-Z]+)/g)].map((m) => [m[1].replace(/""/g, '"'), m[2]]);
        if (!/^\s*DATATABLE\s*\(/.test(e) || t.partitions[0].source.type !== 'calculated') { bad.push(`${t.name}: not a DATATABLE`); return; }
        const data = (t.columns || []).filter((c) => c.type !== 'calculated');
        if (head.map((h) => h[0]).join('|') !== data.map((c) => c.name).join('|')) bad.push(`${t.name}: header ${head.map((h) => h[0])} is not the columns`);
        data.forEach((c, k) => { if (head[k] && head[k][1] !== DT[c.dataType]) bad.push(`${t.name}[${c.name}] ${c.dataType} declared ${head[k][1]}`); });
        const rows = [...e.slice(e.indexOf('{') + 1).matchAll(/\{([^{}]*)\}/g)].map((m) => [...m[1].matchAll(/"((?:[^"]|"")*)"|(-?\d+(?:\.\d+)?)|\b(TRUE|FALSE)\b/g)].map((v) => (v[1] != null ? v[1] : v[2] != null ? v[2] : v[3])));
        if (!rows.length || rows.some((r) => r.length !== head.length)) bad.push(`${t.name}: ${rows.length} rows, not all of ${head.length} values`);
        data.forEach((c, k) => { keys.set(t.name + '\0' + c.name, rows.map((r) => r[k])); if (DT[c.dataType] === 'DATETIME' && rows.some((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r[k]))) bad.push(`${t.name}[${c.name}]: a date not written yyyy-mm-dd`); });
      });
      chk(() => !bad.length, () => `S-16 ${label}. every table is a DATATABLE with the columns' own types and full rows: ${bad.slice(0, 4).join('; ')}`);
      const rb = [];
      (back.relationships || []).filter((r) => (r.toCardinality || 'one') === 'one' && r.fromCardinality !== 'one').forEach((r) => { const f = keys.get(r.fromTable + '\0' + r.fromColumn), t = new Set(keys.get(r.toTable + '\0' + r.toColumn) || []); if (!f || f.some((v) => !t.has(v))) rb.push(`${r.fromTable}[${r.fromColumn}]`); });
      chk(() => !rb.length, () => `S-16 ${label}. the DAX form's keys match too: ${rb.join(', ')}`);
    }
  }

  // ---------- B: the box-level comparison ----------
  if (B) {
    const page = { name: 'Overview', w: 1280, h: 720, rtl: false, visuals: [
      { type: 'textbox', x: 16, y: 12, w: 600, h: 40, title: 'Sales report' },
      { type: 'cardVisual', x: 16, y: 70, w: 300, h: 96, title: 'Total Sales', valueSize: 28 },
      { type: 'lineChart', x: 16, y: 184, w: 820, h: 300, title: 'Total Sales by Month', titleSize: 14 },
      { type: 'clusteredBarChart', x: 852, y: 184, w: 412, h: 300, title: 'Total Sales by Region' },
      { type: 'clusteredBarChart', x: 852, y: 500, w: 412, h: 204, title: 'Total Sales by Channel' },
      { type: 'tableEx', x: 16, y: 500, w: 820, h: 204, title: 'Detail' }] };
    const a = B.boxesOfPage(page), same = B.compare(a, B.boxesOfPage(JSON.parse(JSON.stringify(page))));
    chk(() => same.score === 1 && same.missing.length === 0 && same.extra.length === 0 && same.pairs.every((p) => p.frame.iou === 1 && p.frame.gap === 0), () => `B-2. a page against itself scores 1: ${JSON.stringify(same).slice(0, 300)}`);
    const moved = JSON.parse(JSON.stringify(page)); moved.visuals[3].x += 4;
    const mv = B.compare(a, B.boxesOfPage(moved)), p3 = mv.pairs.find((p) => p.a === 3);
    chk(() => p3 && p3.b === 3 && p3.frame.gap === 4 && p3.frame.iou < 1 && p3.frame.iou > 0.97 && mv.score < 1 && mv.within(4) === mv.pairs.length && mv.within(3) === mv.pairs.length - 1, () => `B-3. a visual 4 units off: gap 4, IoU just under 1, within 4 all, within 3 all but it: ${JSON.stringify(p3)}`);
    const less = JSON.parse(JSON.stringify(page)); less.visuals.splice(5, 1);
    const ls = B.compare(a, B.boxesOfPage(less));
    chk(() => ls.extra.length === 1 && ls.extra[0] === 5 && ls.missing.length === 0 && Math.abs(ls.score - 5 / 6) < 1e-9, () => `B-4. a visual the other drawing lacks: one extra, score 5/6: ${JSON.stringify({ e: ls.extra, m: ls.missing, s: ls.score })}`);
    const more = B.compare(B.boxesOfPage(less), a);
    chk(() => more.missing.length === 1 && more.missing[0] === 5 && more.extra.length === 0, () => 'B-4. and the other way round: one missing');
    const swapped = JSON.parse(JSON.stringify(page)); [swapped.visuals[3], swapped.visuals[4]] = [swapped.visuals[4], swapped.visuals[3]];
    const sw = B.compare(a, B.boxesOfPage(swapped));
    chk(() => sw.score === 1 && sw.pairs.find((p) => p.a === 3).b === 4 && sw.pairs.find((p) => p.a === 4).b === 3, () => 'B-5. two bar charts listed the other way round are matched by place');
    const kind = JSON.parse(JSON.stringify(page)); kind.visuals[3].type = 'clusteredColumnChart';
    const kd = B.compare(a, B.boxesOfPage(kind));
    chk(() => kd.missing.length === 1 && kd.extra.length === 1, () => 'B-6. a column chart where a bar chart was is not the same visual (one missing, one extra)');
    // the preview's drawing, read back: frame, title band, the part under the title, a card's value
    const svg = P.render(page), drawn = B.boxesOfSvg(svg);
    chk(() => drawn.length === 6 && drawn.every((d, i) => d.frame.x === page.visuals[i].x && d.frame.y === page.visuals[i].y && d.frame.w === page.visuals[i].w && d.frame.h === page.visuals[i].h), () => `B-7. the drawing's frames are the page's boxes: ${JSON.stringify(drawn.map((d) => d.frame))}`);
    chk(() => drawn[2].title && drawn[2].title.y > 184 && drawn[2].title.y + drawn[2].title.h < 184 + 60 && drawn[2].content.y >= drawn[2].title.y + drawn[2].title.h && drawn[2].content.y + drawn[2].content.h <= 484, () => `B-7. a chart's title band at its top, the part under it below: ${JSON.stringify(drawn[2])}`);
    chk(() => drawn[1].value && drawn[1].value.x >= 16 && drawn[1].value.y >= 70 && drawn[1].value.y + drawn[1].value.h <= 166, () => `B-7. a card's value box inside the card: ${JSON.stringify(drawn[1])}`);
    const bigger = JSON.parse(JSON.stringify(page)); bigger.visuals[2].titleSize = 24;
    const tb = B.compare(drawn, B.boxesOfSvg(P.render(bigger))), t2 = tb.pairs.find((p) => p.a === 2);
    chk(() => t2 && t2.frame.iou === 1 && t2.title && t2.title.iou < 0.9 && t2.content.iou < 1, () => `B-8. a bigger title: same frame, the title band and the part under it differ: ${JSON.stringify(t2)}`);

    // the fixtures' planned reports: the preview's drawing against the written files' boxes
    const { planLayout, E } = await import('./lib/design.mjs');
    const { scopeOf } = await import('./lib/scope.mjs');
    const { planPreview } = await import('./lib/plan-lint.mjs');
    const cases = [{ model: 'arabic', lang: 'ar', layout: 'exec' }, { model: 'health', lang: 'en', layout: 'analysis' }, { model: 'large', lang: 'en', layout: 'ops', focus: 'logistics' }, { model: 'twin', lang: 'en', layout: 'exec' }];
    const table = [];
    for (const c of cases) {
      const m = models[c.model], sc = scopeOf(m, c.focus ? { focus: c.focus } : {}), design = planLayout({ layout: c.layout, lang: c.lang }).design;
      const pv = planPreview({ m, tables: sc.tables, design, lang: c.lang, second: true });
      const specs = E.projectPages(design.layout, c.lang, { second: true });
      pv.pages.forEach((pg, k) => {
        const res = B.compare(B.boxesOfSvg(P.render(pg, { lang: c.lang })), B.boxesOfPage(pg));
        chk(() => res.score === 1 && res.missing.length === 0 && res.extra.length === 0, () => `B-9 ${c.model} page ${k + 1}. the preview draws every written visual at its box: ${JSON.stringify({ s: res.score, m: res.missing, e: res.extra })}`);
        const sp = specs[k]; if (!sp) return;
        const slots = P.fromSlots(sp.slots.filter((s) => !(s.kind === 'text' && !s.text)), sp.page, { rtl: pg.rtl });
        const vs = B.compare(B.boxesOfPage(slots), B.boxesOfPage(pg));
        chk(() => vs.score >= 0 && vs.score <= 1 && Number.isFinite(vs.score), () => `B-9 ${c.model} page ${k + 1}. the plan's slots against the written report give a score`);
        table.push(`${c.model}/${c.lang} p${k + 1}: slots vs written ${vs.score.toFixed(2)} (matched ${vs.pairs.length}, within 4: ${vs.within(4)}, slots not written ${vs.extra.length}, written not in slots ${vs.missing.length})`);
      });
    }
    if (process.env.R1_PRINT) console.log(table.join('\n'));
  }
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }

console.log(problems.length ? `FAIL  r1-see-the-result  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  r1-see-the-result  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
