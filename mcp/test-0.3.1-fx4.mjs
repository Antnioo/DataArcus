import './test-env.mjs';
// 0.3.1 FX4 (the owner's laptop part 3, block H, H-3; D-1028-04; mcp/work/FX4.md). Written red first.
// suggest_fields' picks on unknown models, on three made-up models shaped like the laptop's public datasets
// (mcp/fixtures/fx4: model files and counts only, never a data value):
//   C1-C9   a column of one value, a mostly unique text column, invoice numbers or coordinates are never a category
//           (chart axis, slicer, table group, slicer pool); with no counts, the name rules alone and said (countsNote)
//   T1-T7   a month name on the time axis across more than one year gives way to the year-month column (the counts say the
//           range); one year, or a range not known (no counts): the month name stays, and why says so
//   O1-O5   (FX4b, D-1028-07) the order: a report written on a two-year made-up calendar whose Year Month labels read
//           "Jan 2022" (A to Z they would start with Apr 2022): its line chart is by Year Month, sorted ascending by the
//           report measure "Month start (sort)", MIN of the calendar's own date; that measure over the calendar's dates
//           (made up here, 2022-01-01 to 2023-12-31) puts the 24 labels in time order; the repo's sortProblems finds
//           nothing (O6). Twice: the calendar's columns typed, and untyped (a DAX calendar's TMDL before a refresh: its
//           own Date column still orders the label, never the label read as a date). Files only, not Desktop
//   G1-G4   gross before net: the net measure is the headline KPI, the gross one follows
//   W1-W3   every rule says itself in why (one line per field), capped
//   I1-I2   columnStats takes counts only (whole numbers): a value is refused by the input
//   node test-0.3.1-fx4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 600));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx4-')));
fs.cpSync(path.join(HERE, 'fixtures', 'fx4'), ROOT, { recursive: true });
const statsOf = (d) => { const s = JSON.parse(fs.readFileSync(path.join(ROOT, d, 'column-stats.json'), 'utf8')); return { rows: s.rows, distinct: s.distinct }; };
// a variant of the financial model: its calendar a DAX table over the years given, no counts
const daxCalendar = (name, y1, y2) => { const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'fx4-financial', 'model.bim'), 'utf8')), cal = j.model.tables.find((t) => t.name === 'Calendar');
  cal.partitions = [{ name: 'Calendar', mode: 'import', source: { type: 'calculated', expression: `CALENDAR ( DATE ( ${y1}, 1, 1 ), DATE ( ${y2}, 12, 31 ) )` } }];
  fs.mkdirSync(path.join(ROOT, name), { recursive: true }); fs.writeFileSync(path.join(ROOT, name, 'model.bim'), JSON.stringify(j, null, 2)); return name + '/model.bim'; };

// (FX4b) the order model: a sales table and a DAX calendar of two years, its Month Name first (as the Ramadan calendar's)
// and its Year Month a text label with no sort-by column
// (typed false: no column of the calendar has a type, as a DAX calendar's TMDL files before a refresh)
const orderModel = (name, typed) => { const col = (n, dataType, x) => Object.assign({ name: n, sourceColumn: n }, typed || !x || !x.cal ? { dataType } : {}, x ? Object.assign({}, x, { cal: undefined }) : {});
  const model = { tables: [
    { name: 'Sales', columns: [col('Region', 'string'), col('Amount', 'double', { summarizeBy: 'sum' }), col('Date', 'dateTime')],
      measures: [{ name: 'Total Amount', expression: "SUM ( 'Sales'[Amount] )", formatString: '#,0.00' }], partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }] },
    { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime', { isKey: true, cal: 1 }), col('Year', 'int64', { summarizeBy: 'none', cal: 1 }), col('Month Name', 'string', { sortByColumn: 'Month Number', cal: 1 }), col('Month Number', 'int64', { summarizeBy: 'none', cal: 1 }), col('Year Month', 'string', { cal: 1 })],
      partitions: [{ name: 'Calendar', mode: 'import', source: { type: 'calculated', expression: 'ADDCOLUMNS ( CALENDAR ( DATE ( 2022, 1, 1 ), DATE ( 2023, 12, 31 ) ), "Year", YEAR ( [Date] ), "Year Month", FORMAT ( [Date], "mmm yyyy" ), "Month Name", FORMAT ( [Date], "mmmm" ), "Month Number", MONTH ( [Date] ) )' } }] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] };
  const sm = path.join(ROOT, name, 'Order.SemanticModel'); fs.mkdirSync(sm, { recursive: true });
  fs.writeFileSync(path.join(sm, 'model.bim'), JSON.stringify(JSON.parse(JSON.stringify({ name: 'Order', compatibilityLevel: 1567, model })), null, 2)); fs.writeFileSync(path.join(sm, 'definition.pbism'), '{ "version": "4.0", "settings": {} }');
  return name; };
const walkFiles = (dir, out = []) => { if (!fs.existsSync(dir)) return out; fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => { const f = path.join(dir, e.name); if (e.isDirectory()) walkFiles(f, out); else out.push(f); }); return out; };
const w = await serverClient(ROOT), call = async (n, a) => { try { return await w.call(n, a); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
const ask = (d, counts, extra) => call('suggest_fields', Object.assign({ path: d + '/model.bim', kpis: 4 }, counts ? { columnStats: statsOf(d) } : {}, extra || {}));
const key = (x) => (x && x.c != null ? `${x.t}[${x.c}]` : null);
// every place a column is picked as a category: the charts' categories, the slicers, the table's group, the slicer pool
const catFields = (j) => [].concat(Object.values((j && j.cats) || {}), (j && j.slicers) || [], ((j && j.table) || []).filter((x) => x && x.c != null), (j && j.slicerPool) || []).map(key).filter(Boolean);
const whyOf = (j, field) => ((j && j.why) || []).filter((x) => x && x.field === field).map((x) => x.line).join(' | ');

try {
  // ---------- rule 1: never a category ----------
  const b = await ask('fx4-births', true), b0 = await ask('fx4-births', false);
  chk(() => !b.err && !catFields(b.j).includes('Births[Country]'), () => `C1. A column the counts give one value (Births[Country]) is never a category, slicer or table group: ${JSON.stringify(catFields(b.j))}`);
  chk(() => !catFields(b.j).includes('Births[Unit]'), () => `C2. Births[Unit] (one value) is never a category either: ${JSON.stringify(catFields(b.j))}`);
  chk(() => !catFields(b.j).includes('Births[Geo Point]') && !b0.err && !catFields(b0.j).includes('Births[Geo Point]'), () => `C3. A text column named as coordinates (Geo Point) is never a category, with or without counts: ${JSON.stringify(catFields(b.j))} / ${JSON.stringify(catFields(b0.j))}`);
  chk(() => key(b.j.cats.bar) === 'Births[Emirate]' && catFields(b.j).includes('Births[Gender]'), () => `C4. (guard) a real category stays: the bar is Births[Emirate]: ${short(b)}`);
  const r = await ask('fx4-retail', true), r0 = await ask('fx4-retail', false);
  chk(() => !r.err && !catFields(r.j).includes('Online Retail[Invoice]') && !r0.err && !catFields(r0.j).includes('Online Retail[Invoice]'), () => `C5. Invoice numbers (Online Retail[Invoice]) are never a category, with or without counts: ${JSON.stringify(catFields(r.j))} / ${JSON.stringify(catFields(r0.j))}`);
  chk(() => !catFields(r.j).includes('Online Retail[Basket Label]'), () => `C6. A text column whose distinct count is close to its rows (Basket Label, 1,031,200 of 1,067,371) is never a category: ${JSON.stringify(catFields(r.j))}`);
  chk(() => !catFields(r.j).includes('Online Retail[Description]'), () => `C7. A text column of over 5,000 values (Description, 5,698) is no category: ${JSON.stringify(catFields(r.j))}`);
  chk(() => key(r.j.cats.bar) === 'Online Retail[Country]' && key(r0.j.cats.bar) === 'Online Retail[Country]', () => `C8. (guard) Online Retail[Country] stays the bar's category: ${short(r)}`);
  chk(() => /not available/i.test(String(b0.j.countsNote)) && /not available/i.test(String(r0.j.countsNote)) && b.j.countsNote === undefined && r.j.countsNote === undefined,
    () => `C9. With no counts the answer says counts were not available (countsNote), and only then: ${JSON.stringify([b0.j.countsNote, b.j.countsNote])}`);

  // ---------- rule 2: a year-month axis over a month name across years ----------
  const f = await ask('fx4-financial', true), f0 = await ask('fx4-financial', false);
  chk(() => !f.err && key(f.j.date) === 'Calendar[Year Month]', () => `T1. Two years by the counts (Calendar[Year] has 2 values): the time axis is Calendar[Year Month], not the month name: ${JSON.stringify(f.j && f.j.date)}`);
  chk(() => /Month Name/.test(whyOf(f.j, 'Calendar[Year Month]')) && /year/i.test(whyOf(f.j, 'Calendar[Year Month]')), () => `T2. why says the switch (from the month name, across years): ${JSON.stringify(f.j && f.j.why)}`);
  chk(() => !f0.err && key(f0.j.date) === 'Calendar[Month Name]', () => `T3. (guard) no counts and no DAX calendar: the range is not known, the month name stays: ${JSON.stringify(f0.j && f0.j.date)}`);
  const d2 = await call('suggest_fields', { path: daxCalendar('fx4-dax-2y', 2013, 2014), kpis: 4 }), d1 = await call('suggest_fields', { path: daxCalendar('fx4-dax-1y', 2014, 2014), kpis: 4 });
  // (FX4b, the owner's D-1028-07: T4 back to its first meaning, red on 5b60a4e and on dd25902 first)
  chk(() => !d2.err && key(d2.j.date) === 'Calendar[Year Month]' && /2013 to 2014/.test(whyOf(d2.j, 'Calendar[Year Month]')) && /calendar's own/.test(whyOf(d2.j, 'Calendar[Year Month]')), () => `T4. A calendar whose own DAX runs 2013 to 2014: the year-month axis, and why says it acted on the calendar's own range: ${short(d2)}`);
  chk(() => !d1.err && key(d1.j.date) === 'Calendar[Month Name]', () => `T5. (guard) a calendar of one year: the month name stays: ${short(d1)}`);
  const f1 = await call('suggest_fields', { path: 'fx4-financial/model.bim', kpis: 4, columnStats: { distinct: { 'Calendar[Year]': 1 } } });
  chk(() => !f1.err && key(f1.j.date) === 'Calendar[Month Name]' && !catFields(f1.j).includes('Calendar[Year]'), () => `T7. (guard) one year by the counts: the month name stays, and the year (one value) is no slicer: ${short(f1)}`);
  chk(() => (f.j.tip || {}).date == null || key(f.j.tip.date) === 'Calendar[Year Month]', () => `T6. The tooltip's trend follows the axis: ${JSON.stringify(f.j.tip)}`);

  // ---------- (FX4b) the order of a Year Month axis, from the written files ----------
  const { sortProblems } = await import('../scripts/tests/report-check.mjs');
  const P = withPlans(call), th = await P('generate_theme', { name: 'FX4b Order', brand: '#0F6CBD', lang: 'en', folder: 'themes' });
  const pl = await call('plan_layout', { design: th.j && th.j.design, layout: 'exec', kpis: 2, page: '1920x1080', lang: 'en' });
  // the measure over the calendar's rows: each label's first date (made-up dates, as the calendar's DAX makes them)
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], first = new Map();
  for (let d = new Date(Date.UTC(2022, 0, 1)); d <= new Date(Date.UTC(2023, 11, 31)); d = new Date(d.getTime() + 864e5)) { const lab = MON[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); if (!first.has(lab) || d < first.get(lab)) first.set(lab, d); }
  const bySort = [...first.keys()].sort((a, b) => first.get(a) - first.get(b)), timeOrder = [2022, 2023].flatMap((y) => MON.map((m) => m + ' ' + y));
  for (const [tag, typed] of [['typed', true], ['untyped', false]]) {
    const mp = orderModel('fx4b-order-' + tag, typed), before = new Set(walkFiles(ROOT)), rep = await P('create_report', { path: mp, name: 'FX4b Order', design: pl.j && pl.j.design, lang: 'en' });
    const written = walkFiles(ROOT).filter((f) => !before.has(f)), visuals = written.filter((f) => /visual\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
    const lines = visuals.filter((v) => v.visual && v.visual.visualType === 'lineChart');
    const catOf = (v) => (((v.visual.query.queryState.Category || {}).projections || [])[0] || {}).queryRef, sortOf = (v) => ((v.visual.query.sortDefinition || {}).sort || [])[0];
    const line = lines.find((v) => catOf(v) === 'Calendar.Year Month'), s0 = line && sortOf(line);
    chk(() => !rep.err && line, () => `O1 ${tag}. The report on a two-year DAX calendar has a line chart by Calendar[Year Month]: ${rep.err ? rep.t.slice(0, 300) : JSON.stringify(lines.map(catOf))}`);
    chk(() => s0 && s0.direction === 'Ascending' && s0.field.Measure && s0.field.Measure.Expression.SourceRef.Schema === 'extension' && s0.field.Measure.Expression.SourceRef.Entity === 'Calendar', () => `O2 ${tag}. Its sort is ascending by a report measure of the calendar: ${JSON.stringify(s0)}`);
    const extFile = written.find((f) => /reportExtensions\.json$/.test(f)), ext = extFile ? JSON.parse(fs.readFileSync(extFile, 'utf8')) : {};
    const sm = s0 && s0.field.Measure && ((ext.entities || []).find((e) => e.name === 'Calendar') || { measures: [] }).measures.find((m) => m.name === s0.field.Measure.Property);
    chk(() => sm && /^MIN\s*\(\s*'?Calendar'?\[Date\]\s*\)$/.test(String(sm.expression).trim()), () => `O3 ${tag}. That measure is the month's first date, MIN of the calendar's own date (never the label read as a date): ${JSON.stringify(sm)}`);
    chk(() => sm && JSON.stringify(bySort) === JSON.stringify(timeOrder), () => `O4 ${tag}. Sorted by that measure the 24 labels run Jan 2022 .. Dec 2023 in time order: ${bySort.slice(0, 4)}`);
    // the repo's own check of a written sort (scripts/tests/report-check.mjs, the rules measured in Desktop) finds nothing
    const rd = extFile && path.dirname(path.dirname(extFile)), files = {}; if (rd) walkFiles(rd).forEach((f) => { files[path.relative(rd, f).split(path.sep).join('/')] = fs.readFileSync(f); });
    const sp = rd ? sortProblems(files) : { bad: ['no report'], sorted: [] };
    chk(() => !sp.bad.length && sp.sorted.some((x) => x.type === 'lineChart' && x.category === 'Calendar.Year Month'), () => `O6 ${tag}. sortProblems finds nothing wrong and sees the line chart in order: ${JSON.stringify(sp).slice(0, 400)}`);
  }
  chk(() => JSON.stringify([...first.keys()].sort()) !== JSON.stringify(timeOrder) && [...first.keys()].sort()[0] === 'Apr 2022', () => `O5. (guard) the labels A to Z are not in time order (Apr 2022 first), so the order comes from the measure`);

  // ---------- rule 3: net before gross ----------
  const head = (j) => j && j.measure && j.measure.m, cards = (j) => ((j && j.kpis) || []).filter(Boolean).map((k) => k.m);
  chk(() => head(f.j) === 'Sales' && cards(f.j)[0] === 'Sales', () => `G1. Gross Sales and Sales: the headline KPI is the net one, Sales: ${JSON.stringify([head(f.j), cards(f.j)])}`);
  chk(() => cards(f.j).includes('Gross Sales') && cards(f.j).indexOf('Gross Sales') > cards(f.j).indexOf('Sales'), () => `G2. The gross one may follow: ${JSON.stringify(cards(f.j))}`);
  chk(() => head(f0.j) === 'Sales', () => `G3. The same without counts (a name rule): ${head(f0.j)}`);
  chk(() => /gross/i.test(whyOf(f.j, 'Financials[Sales]')) && /net/i.test(whyOf(f.j, 'Financials[Sales]')), () => `G4. why says it: ${JSON.stringify(f.j && f.j.why)}`);

  // ---------- rule 4: why ----------
  chk(() => /one value/i.test(whyOf(b.j, 'Births[Country]')) && /coordinates/i.test(whyOf(b.j, 'Births[Geo Point]')), () => `W1. why names each column left out and its rule: ${JSON.stringify(b.j && b.j.why)}`);
  chk(() => /distinct|unique/i.test(whyOf(r.j, 'Online Retail[Basket Label]')) && /invoice/i.test(whyOf(r.j, 'Online Retail[Invoice]')), () => `W2. ${JSON.stringify(r.j && r.j.why)}`);
  chk(() => [b, b0, r, r0, f, f0, d2].every((x) => Array.isArray(x.j.why) && x.j.why.length <= 20 && x.j.why.every((y) => typeof y.line === 'string' && !/\n/.test(y.line) && y.line.length <= 300)), () => `W3. why is a list of one-line entries, capped at 20`);

  // ---------- the input: counts only ----------
  const bad = await call('suggest_fields', { path: 'fx4-births/model.bim', columnStats: { distinct: { 'Births[Country]': 'United Arab Emirates' } } });
  chk(() => bad.err, () => `I1. columnStats refuses a text where a count goes (no value can be passed): ${short(bad)}`);
  const unknown = await call('suggest_fields', { path: 'fx4-births/model.bim', columnStats: { distinct: { 'Nowhere[X]': 1 } } });
  chk(() => !unknown.err && JSON.stringify(unknown.j.statsNotInModel || []).includes('Nowhere[X]'), () => `I2. A count for a column the model does not have is named, never dropped silently: ${short(unknown)}`);
} finally { await w.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=test-0.3.1-fx4.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  fx4  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fx4  ${checks} checks`);
