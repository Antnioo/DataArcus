import './test-env.mjs';
// 0.3.1 FX4 (the owner's laptop part 3, block H, H-3; D-1028-04; mcp/work/FX4.md). Written red first.
// suggest_fields' picks on unknown models, on three made-up models shaped like the laptop's public datasets
// (mcp/fixtures/fx4: model files and counts only, never a data value):
//   C1-C9   a column of one value, a mostly unique text column, invoice numbers or coordinates are never a category
//           (chart axis, slicer, table group, slicer pool); with no counts, the name rules alone and said (countsNote)
//   T1-T6   a month name on the time axis across more than one year gives way to the year-month column (the counts or
//           the calendar's own DAX say the range); one year, or a range not known: the month name stays
//   G1-G4   gross before net: the net measure is the headline KPI, the gross one follows
//   W1-W3   every rule says itself in why (one line per field), capped
//   I1-I2   columnStats takes counts only (whole numbers): a value is refused by the input
//   node test-0.3.1-fx4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

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
  chk(() => !d2.err && key(d2.j.date) === 'Calendar[Year Month]', () => `T4. A calendar whose own DAX runs 2013 to 2014: the year-month axis: ${short(d2)}`);
  chk(() => !d1.err && key(d1.j.date) === 'Calendar[Month Name]', () => `T5. (guard) a calendar of one year: the month name stays: ${short(d1)}`);
  chk(() => (f.j.tip || {}).date == null || key(f.j.tip.date) === 'Calendar[Year Month]', () => `T6. The tooltip's trend follows the axis: ${JSON.stringify(f.j.tip)}`);

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
