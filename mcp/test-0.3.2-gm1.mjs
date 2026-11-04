// 0.3.2 GM1 (RD5's builder brief g, the owner's D-1104-01; written red first): add_gulf_calendar's script carries the
// Ramadan and Eid measures (one shared builder, assets/js/gulf-measures.js, the Measure Builder's own), a dated VAT
// standard-rate column for the chosen country, and an off-by-default currency pegs table (KWD a basket, never a rate).
//   B  the shared builder writes exactly what the Measure Builder page wrote on the base (fixtures/gulf-calendar/gm1-measures.json)
//   P  the pairing the script writes, evaluated on the script's own Hijri month starts: right on 379 of 383 Ramadan days
//      (1439-1451), the 4 others day 30 after a 29-day Ramadan; SAMEPERIODLASTYEAR 0 of 383; on flat made-up sales
//      +4.2 % (1445) and 0.0 % (1446), SAMEPERIODLASTYEAR +28.2 % and +24.7 % (RD5 section d)
//   V  the VAT column read back from the script on every day 2017-2026 (RD5's day counts) and the 10 edges
//   N  a name the model has is never taken: the measure is renamed ("... 2") and every reference follows
//   S  the script names no existing table (no ref table), reads back with the repo's TMDL reader, measures on the new table
//   K  pegs: off by default; 6 rows, each the central bank's figure; KWD with no rate
//   R  refusals, nothing written: not a measure, a column, malformed, twice, more than 5, a name a script can't fence
//   A  the tool: the answer names measures and columns only (no DAX, no values); the plan line EN and AR; the write
// Made-up models and made-up sales only.   node test-0.3.2-gm1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { loadModel } from './lib/model.mjs';
import { addGulfCalendar } from './lib/gulf-calendar.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const Cal = require('../assets/js/calendar-generator.js');
const GD = require('../assets/js/gulf-dates.js');
const Gulf = require('../assets/js/gulf-health.js');
const Fix = require('../assets/js/model-health-tmdl.js');
const Tmdl = require('../assets/js/tmdl-model.js');
let GM = null; try { GM = require('../assets/js/gulf-measures.js'); } catch (e) { GM = null; }

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t\n]+/g, ' ');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});

// ---------- made-up models ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-gm1-')));
// each part on its own: one part's throw is its own failure, the others still run
const section = async (fn) => { try { await fn(); } catch (e) { checks++; problems.push('threw: ' + String(e && e.stack || e).slice(0, 400)); } };
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = (dir, tables, rels) => {
  fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: rels || [] } }));
  fs.writeFileSync(path.join(ROOT, dir, 'M.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
  return dir + '/M.SemanticModel';
};
const SALES = (more) => ({ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Date', 'dateTime'), ...(more || [])],
  measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0.00' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }] });
const PLAIN = bim('plain', [SALES()]);
// N: names the model has: a measure and a column named like two of the new measures, a table named like the pegs table
const TAKEN = bim('taken', [Object.assign(SALES([col('Total Sales Eid al-Fitr Window', 'double')]), { measures: SALES().measures.concat([{ name: 'Total Sales Last Ramadan', expression: '1' }]) }),
  { name: 'Gulf Currency Pegs', partitions: mp('P'), columns: [col('Code', 'string')] }]);
// R: a measure name a fenced script can't hold, and one with a line break
const ODD = bim('odd', [Object.assign(SALES(), { measures: [{ name: 'Sales ```x', expression: '1' }, { name: 'Two\nLines', expression: '1' }, { name: "Net ]Sales's", expression: 'SUM ( Sales[Amount] )' }] })]);

// the lib, with a writer that keeps the script in memory (the plan path's shape: nothing on disk)
const build = (p, a) => { let script = null; const m = loadModel(p, { root: ROOT });
  const r = addGulfCalendar(m, Object.assign({ firstYear: 2016, lastYear: 2030, asOf: '2026-11-04' }, a), { Gulf, Fix, scriptDir: ROOT, scriptBase: 'GM1', writeScript: (dir, base, sc) => { script = sc; return path.join(dir, base + '.tmdl'); } });
  return { r, script }; };
const refused = (p, a) => { try { build(p, a); return null; } catch (e) { return String(e && e.message || e); } };

// ---------- script readers ----------
// a measure's DAX as the script holds it (fenced, four tabs in)
const measuresOf = (sc) => { const out = {}; const re = /\n\t\t(?:\/\/\/[^\n]*\n\t\t)*measure ('(?:[^']|'')*'|[^\s=]+) = ```\n([\s\S]*?)\n\t\t\t\t```/g; let x;
  while ((x = re.exec(sc))) out[x[1].replace(/^'|'$/g, '').replace(/''/g, "'")] = x[2].split('\n').map((l) => l.replace(/^\t\t\t\t/, '')).join('\n'); return out; };
const descOf = (sc, name) => { const i = sc.indexOf('measure ' + Fix.name(name) + ' ='); const pre = sc.slice(0, i).split('\n'); const d = []; for (let k = pre.length - 2; k >= 0 && /^\t+\/\/\//.test(pre[k]); k--) d.unshift(pre[k].replace(/^\t+\/\/\/ ?/, '')); return d.join(' '); };
const tablesOf = (sc) => (sc.match(/^\t(?:ref )?table .+$/gm) || []);
const DAY = 864e5, P = Cal.parse;
// the calendar's Hijri dates from the script's own DATATABLE of month starts, the way its DAX finds them
const hijriOfScript = (sc) => { const starts = []; const re = /\{ "(\d{4}-\d{2}-\d{2})", (\d+), (\d+) \}/g; let x; while ((x = re.exec(sc))) starts.push({ t: P(x[1]), y: +x[2], m: +x[3] }); return Cal.hijriFrom(starts.sort((a, b) => a.t - b.t)); };
// the VAT column's expression from the script, evaluated the way DAX reads the nested IF
const vatExprOf = (sc) => { const x = sc.match(/"VAT Standard Rate %", (.+?),?\n/); return x ? x[1] : null; };
const evalVat = (dax, t) => { let s = dax; for (;;) { const m = s.match(/^IF \( \[Date\] >= DATE \( (\d+), (\d+), (\d+) \), (\d+), ([\s\S]*) \)$/); if (!m) return Number(s); if (t >= Date.UTC(+m[1], +m[2] - 1, +m[3])) return Number(m[4]); s = m[5]; } };

try {
  // ---------- B: the shared builder is the page's ----------
  await section(async () => {
    const FIX = JSON.parse(fs.readFileSync(path.join(HERE, '../scripts/tests/fixtures/gulf-calendar/gm1-measures.json'), 'utf8'));
    chk(() => GM && Array.isArray(GM.PATTERNS) && GM.PATTERNS.map((p) => p.id).join() === 'ramLY,ramPct,eidFitr,eidFitrLY,eidFitrPct,eidAdha,eidAdhaLY,eidAdhaPct', () => `B1. assets/js/gulf-measures.js exports the 8 Ramadan and Eid patterns in the page's order: ${GM ? JSON.stringify((GM.PATTERNS || []).map((p) => p.id)) : 'no module'}`);
    [0, 1].forEach((k) => {
      const f = FIX.mb.find((x) => x.lang === 'en' && JSON.stringify(x.saved) === JSON.stringify(FIX.mb.filter((y) => y.lang === 'en')[k].saved)), s = f.saved;
      const base = s.base || 'Total Sales', cal = s.cal || 'Calendar', dc = s.dateCol || 'Date', page = measuresOf('\n' + f.tmdl.replace(/^createOrReplace\n\n\tref table [^\n]+\n/, ''));
      const got = GM ? GM.measuresFor({ base, cal, dateColumn: dc }) : [];
      chk(() => got.length === 8 && got.every((m) => page[m.name] === m.expression), () => `B2-${k}. the shared builder's 8 measures equal the page's base capture (${JSON.stringify(s).slice(0, 80)}): ${got.filter((m) => page[m.name] !== m.expression).map((m) => m.name).join(', ') || got.length}`);
    });
  });

  // ---------- P: the pairing the script writes ----------
  await section(async () => {
    const { r, script } = build(PLAIN, { measures: ['Sales[Total Sales]'] });
    const ms = measuresOf(script), ly = ms['Total Sales Last Ramadan'] || '';
    chk(() => /"Hijri Year", 'Gulf Calendar'\[Hijri Year\] - 1,/.test(ly) && /TREATAS \( _SameDaysLastYear, 'Gulf Calendar'\[Hijri Year\], 'Gulf Calendar'\[Ramadan Day\] \)/.test(ly) && /REMOVEFILTERS \( 'Gulf Calendar' \)/.test(ly) && /\[Total Sales\],/.test(ly),
      () => `P1. Last Ramadan pairs Hijri Year - 1 and Ramadan Day on the new table: ${ly.slice(0, 400)}`);
    const H = hijriOfScript(script), from = P('2016-01-01'), to = P('2030-12-31'), days = [];
    for (let t = from; t <= to; t += DAY) { const h = H(t); days.push({ t, hy: h.year, hm: h.month, hd: h.day }); }
    const byT = new Map(days.map((d) => [d.t, d])), ram = {};
    days.forEach((d) => { if (d.hm === 9) (ram[d.hy] = ram[d.hy] || []).push(d); });
    const gregBack = (t) => { const x = new Date(t); const y = x.getUTCFullYear() - 1, mo = x.getUTCMonth(); let dd = x.getUTCDate(); const last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(); if (dd > last) dd = last; return Date.UTC(y, mo, dd); };
    const pairB = (d) => (ram[d.hy - 1] || []).find((x) => x.hd === d.hd), pairA = (d) => byT.get(gregBack(d.t));
    const right = (d, p) => p && p.hm === 9 && p.hy === d.hy - 1 && p.hd === d.hd;
    let n = 0, b = 0, a = 0, unB = 0, day30 = 0;
    for (let hy = 1439; hy <= 1451; hy++) ram[hy].forEach((d) => { n++; const pb = pairB(d); if (right(d, pb)) b++; if (!pb) { unB++; if (d.hd === 30 && ram[hy - 1].length === 29) day30++; } if (right(d, pairA(d))) a++; });
    chk(() => n === 383 && b === 379 && unB === 4 && day30 === 4, () => `P2. the script's pairing: ${b} of ${n} right, ${unB} unpaired (${day30} day 30 after a 29-day Ramadan); RD5: 379 of 383, 4`);
    chk(() => a === 0, () => `P3. SAMEPERIODLASTYEAR pairs ${a} of ${n} right; RD5: 0`);
    // flat made-up sales, 2023-2025: 1,000 a day, Ramadan x1.5, its last ten x2, Eid days x2.5
    const val = new Map(); for (let t = P('2023-01-01'); t <= P('2025-12-31'); t += DAY) { const d = byT.get(t); let v = 1000; if (d.hm === 9) v *= d.hd >= 21 ? 2 : 1.5; if ((d.hm === 10 && d.hd <= 3) || (d.hm === 12 && d.hd >= 10 && d.hd <= 13)) v *= 2.5; val.set(t, v); }
    const g = (hy, f) => { const now = ram[hy].reduce((s, d) => s + val.get(d.t), 0), last = ram[hy].reduce((s, d) => { const p = f(d); return s + (p && val.has(p.t) ? val.get(p.t) : 0); }, 0); return +(100 * (now - last) / last).toFixed(1); };
    chk(() => g(1445, pairB) === 4.2 && g(1446, pairB) === 0 && g(1445, pairA) === 28.2 && g(1446, pairA) === 24.7,
      () => `P4. growth on flat sales: B ${g(1445, pairB)} / ${g(1446, pairB)} (RD5 4.2 / 0.0), SAMEPERIODLASTYEAR ${g(1445, pairA)} / ${g(1446, pairA)} (RD5 28.2 / 24.7)`);
    chk(() => /day 30/.test(descOf(script, 'Total Sales Last Ramadan')) && /day 30/.test(descOf(script, 'Total Sales vs Last Ramadan %')),
      () => `P5. Last Ramadan and its % say the day-30 rule in their descriptions: ${descOf(script, 'Total Sales Last Ramadan')}`);
    chk(() => r.measures && r.measures.count === 8 && r.measures.names.length === 8 && r.measures.for.join() === 'Sales[Total Sales]', () => `P6. the answer names the 8 measures: ${JSON.stringify(r.measures)}`);
    // the % compares Ramadan days only on its own side; the Eid windows as the page's
    chk(() => /KEEPFILTERS \( 'Gulf Calendar'\[Is Ramadan\] = TRUE \(\) \)/.test(ms['Total Sales vs Last Ramadan %']) && /VAR _LastRamadan = \[Total Sales Last Ramadan\]/.test(ms['Total Sales vs Last Ramadan %'])
      && /VAR _EidDays = 3/.test(ms['Total Sales Eid al-Fitr Window']) && /VAR _EidDays = 4/.test(ms['Total Sales Eid al-Adha Window']) && /ALL \( 'Gulf Calendar'\[Date\] \)/.test(ms['Total Sales Eid al-Adha Window Last Year']),
      () => 'P7. the % and the Eid windows are the page\'s, on the new table');
  });

  // ---------- V: VAT by date ----------
  await section(async () => {
    const WANT = { uae: { 0: 365, 5: 3287 }, ksa: { 0: 365, 5: 912, 15: 2375 }, bhr: { 0: 730, 5: 1096, 10: 1826 }, omn: { 0: 1566, 5: 2086 }, qat: { 0: 3652 }, kwt: { 0: 3652 } };
    const exprs = {};
    for (const c of Object.keys(WANT)) {
      const { r, script } = build(PLAIN, { country: c, vat: true, firstYear: 2017, lastYear: 2026 }), e = vatExprOf(script); exprs[c] = e;
      const at = {}; let wrong = 0;
      for (let t = P('2017-01-01'); t <= P('2026-12-31'); t += DAY) { const v = e == null ? NaN : evalVat(e, t); at[v] = (at[v] || 0) + 1; let want = null; ((GD.vat && GD.vat.rates[c]) || []).forEach((x) => { if (x.from === null || P(x.from) <= t) want = x.rate; }); if (v !== want) wrong++; }
      chk(() => e && JSON.stringify(at) === JSON.stringify(WANT[c]) && wrong === 0, () => `V1 ${c}. the VAT column on every day 2017-2026: ${JSON.stringify(at)} (RD5 ${JSON.stringify(WANT[c])}), ${wrong} days unlike gulf-dates.js; ${e}`);
      chk(() => r.vatColumn && r.vatColumn.name === 'VAT Standard Rate %' && r.vatColumn.country === c && r.columns.includes('VAT Standard Rate %') && /standard rate in force on the date/i.test(r.vatColumn.what) && /not tax advice/i.test(r.vatColumn.what),
        () => `V2 ${c}. the answer names the column and what it is (the standard rate in force on the date; not tax advice): ${JSON.stringify(r.vatColumn)}`);
    }
    const EDGES = [['ksa', '2020-06-30', 5], ['ksa', '2020-07-01', 15], ['bhr', '2021-12-31', 5], ['bhr', '2022-01-01', 10], ['omn', '2021-04-15', 0], ['omn', '2021-04-16', 5], ['uae', '2017-12-31', 0], ['uae', '2018-01-01', 5], ['qat', '2026-11-03', 0], ['kwt', '2026-11-03', 0]];
    const bad = EDGES.filter(([c, d, v]) => !exprs[c] || evalVat(exprs[c], P(d)) !== v);
    chk(() => bad.length === 0, () => `V3. the 10 edges: ${JSON.stringify(bad)}`);
    const { r: off, script: so } = build(PLAIN, {});
    chk(() => !/VAT/.test(so) && !('vatColumn' in off) && !/\n\t\tmeasure /.test(so) && !/Pegs/.test(so), () => 'V4. by default: no VAT column, no measures, no pegs table (the script as before)');
    chk(() => GD.vat && /^\d{4}-\d{2}-\d{2}$/.test(GD.vat.checked) && GD.pegs && /^\d{4}-\d{2}-\d{2}$/.test(GD.pegs.checked), () => 'V5. gulf-dates.js: vat and pegs each with its own checked date');
    const srcs = fs.readFileSync(path.join(HERE, '../scripts/gulf-calendar/DATES-SOURCES.md'), 'utf8');
    chk(() => /## VAT standard rate by date/.test(srcs) && /## Currency pegs/.test(srcs) && srcs.includes(GD.vat.checked) && srcs.includes(GD.pegs.checked), () => 'V6. DATES-SOURCES.md has the VAT and peg tables with their checked dates');
  });

  // ---------- N: names the model has are never taken ----------
  await section(async () => {
    const { r, script } = build(TAKEN, { measures: ['Sales[Total Sales]'], pegs: true });
    const ms = measuresOf(script);
    chk(() => 'Total Sales Last Ramadan 2' in ms && !('Total Sales Last Ramadan' in ms) && /VAR _LastRamadan = \[Total Sales Last Ramadan 2\]/.test(ms['Total Sales vs Last Ramadan %']),
      () => `N1. a measure the model has is renamed, and the % follows: ${Object.keys(ms).join(', ')}`);
    chk(() => 'Total Sales Eid al-Fitr Window 2' in ms && /DIVIDE \( \[Total Sales Eid al-Fitr Window 2\] - \[Total Sales Eid al-Fitr Window Last Year\]/.test(ms['Total Sales Eid al-Fitr Window vs Last Year %']),
      () => `N2. a column's name is not taken either: ${Object.keys(ms).join(', ')}`);
    chk(() => r.pegsTable && r.pegsTable.name === 'Gulf Currency Pegs 2' && tablesOf(script).includes("\ttable 'Gulf Currency Pegs 2'"), () => `N3. the pegs table takes a free name: ${JSON.stringify(r.pegsTable)}`);
    // two bases: 16 measures, no name twice
    const two = build(PLAIN, { measures: ['Sales[Total Sales]', "'Sales'[Orders]"] });
    chk(() => Object.keys(measuresOf(two.script)).length === 16 && two.r.measures.count === 16 && /\[Orders\]/.test(measuresOf(two.script)['Orders Last Ramadan']), () => `N4. two measures: 16 new ones: ${two.r.measures && two.r.measures.count}`);
  });

  // ---------- S: the script ----------
  await section(async () => {
    const { script } = build(PLAIN, { measures: ['Sales[Total Sales]'], vat: true, pegs: true });
    chk(() => JSON.stringify(tablesOf(script)) === JSON.stringify(["\ttable 'Gulf Calendar'", "\ttable 'Gulf Currency Pegs'"]) && !/\bref table\b/.test(script) && /^createOrReplace\n/.test(script),
      () => `S1. the script names only its two new tables, never an existing one: ${JSON.stringify(tablesOf(script))}`);
    const m = Tmdl.fromFiles([{ path: 'definition/script.tmdl', text: script.replace(/^createOrReplace\n/, '').replace(/^\t/gm, '') }]).model;
    const cal = (m.tables || []).find((t) => t.name === 'Gulf Calendar'), pg = (m.tables || []).find((t) => t.name === 'Gulf Currency Pegs');
    chk(() => cal && (cal.measures || []).length === 8 && cal.measures.every((x) => x.description && x.displayFolder === 'Ramadan and Eid') && pg && (pg.columns || []).length === 6,
      () => `S2. reads back: 8 measures with descriptions on the calendar, the pegs table's 6 columns: ${cal && (cal.measures || []).length} ${pg && (pg.columns || []).length}`);
    chk(() => cal.measures.find((x) => x.name === 'Total Sales Last Ramadan').formatString === '#,0.00' && cal.measures.find((x) => x.name === 'Total Sales vs Last Ramadan %').formatString === '0.0%',
      () => 'S3. the values keep the base measure\'s format; the % measures 0.0%');
    const vc = (cal.columns || []).find((c) => c.name === 'VAT Standard Rate %');
    chk(() => vc && /standard rate in force on the date/i.test(vc.description || ''), () => `S4. the VAT column has its description: ${JSON.stringify(vc)}`);
  });

  // ---------- K: pegs ----------
  await section(async () => {
    const { r, script } = build(PLAIN, { pegs: true });
    const body = script.slice(script.indexOf("\ttable 'Gulf Currency Pegs'"));
    const rows = body.match(/\( "[A-Z]{3}", [^\n]+\)/g) || [];
    const rate = (c) => { const x = rows.find((l) => l.startsWith(`( "${c}"`)); return x ? x.split(', ')[1] : null; };
    chk(() => rows.length === 6 && rate('AED') === '3.6725' && rate('SAR') === '3.75' && rate('QAR') === '3.64' && rate('BHD') === '0.376' && rate('OMR') === '0.3845' && rate('KWD') === 'BLANK ()',
      () => `K1. 6 rows, each the bank's figure, KWD with no rate: ${JSON.stringify(rows)}`);
    chk(() => /basket/.test(rows.find((l) => /"KWD"/.test(l)) || '') && Math.abs(1 / 2.6008 - 0.3845) < 5e-5, () => 'K2. KWD said as a basket; OMR 0.3845 is the bank\'s 2.6008 per rial');
    chk(() => r.pegsTable && r.pegsTable.rows === 6 && r.pegsTable.checked === GD.pegs.checked && !/3\.6725|3\.75/.test(JSON.stringify(r)), () => `K3. the answer names the table, not its rates: ${JSON.stringify(r.pegsTable)}`);
  });

  // ---------- R: refusals ----------
  await section(async () => {
    const cases = [[['Sales[Nope]'], /is not a measure of the model/], [['Sales[Amount]'], /is not a measure of the model/], [['Total Sales'], /not written as Table\[Measure\]/],
      [['Sales[Total Sales]', 'sales[total sales]'], /twice/], [['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Total Sales]', 'Sales[Orders]', 'Sales[Total Sales]', 'Sales[Orders]'], /at most 5/]];
    cases.forEach(([ms, re], i) => { const e = refused(PLAIN, { measures: ms }); chk(() => e && re.test(e) && /Nothing was written/.test(e), () => `R${i + 1}. ${JSON.stringify(ms)}: ${e}`); });
    const e1 = refused(ODD, { measures: ['Sales[Sales ```x]'] }), e2 = refused(ODD, { measures: ['Sales[Two\nLines]'] });
    chk(() => e1 && /can't be named in a script/.test(e1) && e2 && /can't be named in a script|not written as/.test(e2), () => `R6. names a fenced script can't hold are refused: ${e1} | ${e2}`);
    const ok = build(ODD, { measures: ["Sales[Net ]Sales's]"] });
    chk(() => /CALCULATE \(\n {8}\[Net \]\]Sales's\],/.test(measuresOf(ok.script)["Net ]Sales's Last Ramadan"] || ''), () => 'R7. a measure with ] and \' is referenced escaped');
  });

  // ---------- A: the tool ----------
  await section(async () => {
    const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
    const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
    const s = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
    try {
      const a = { path: PLAIN, firstYear: 2023, lastYear: 2026, asOf: '2026-11-04', measures: ['Sales[Total Sales]'], vat: true, country: 'ksa', pegs: true };
      const plan = await s.call('add_gulf_calendar', a), t = plan.t || '';
      chk(() => !plan.err && plan.j.measures && plan.j.measures.count === 8 && plan.j.vatColumn && plan.j.pegsTable, () => `A1. the plan names the measures, the VAT column and the pegs table: ${t.slice(0, 400)}`);
      chk(() => !/CALCULATE|TREATAS|DATATABLE|SELECTCOLUMNS|IF \( \[Date\]|3\.6725/.test(t), () => 'A2. the answer holds no DAX and no rate values');
      const w = (plan.j.plan && plan.j.plan.writesAfterGo || []).join(' ');
      chk(() => /8 measures \(Ramadan and Eid, for Sales\[Total Sales\]\)/.test(w) && /"VAT Standard Rate %" \(Saudi Arabia\)/.test(w) && /"Gulf Currency Pegs" \(6 currencies\)/.test(w), () => `A3. the plan line says them: ${w}`);
      const id = plan.j.plan && plan.j.plan.planId;
      const n = links().length; await s.call('approve_plan', { planId: id }); const url = await linkAt(n), html = url ? unesc(await req(url, 'GET')) : '';
      chk(() => /8 measures \(Ramadan and Eid, for Sales\[Total Sales\]\)/.test(html), () => `A4. the approval page shows the line: ${html.slice(0, 300)}`);
      if (url) { await req(url, 'POST', 'decision=approve'); await s.call('approve_plan', { planId: id }); }
      const out = await s.call('add_gulf_calendar', Object.assign({ planId: id }, a)), f = out.j && out.j.scriptFile, sc = f && fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : (f && fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '');
      chk(() => !out.err && Object.keys(measuresOf(sc)).length === 8 && /"VAT Standard Rate %"/.test(sc) && /table 'Gulf Currency Pegs'/.test(sc), () => `A5. the approved write holds them: ${out.t && out.t.slice(0, 300)}`);
      // the Arabic page's line
      const ar = await s.call('add_gulf_calendar', Object.assign({}, a, { lang: 'ar', name: 'Gulf Calendar AR' })), wa = JSON.stringify(ar.j && ar.j.plan);
      const n2 = links().length; await s.call('approve_plan', { planId: ar.j.plan.planId }); const url2 = await linkAt(n2), html2 = url2 ? unesc(await req(url2, 'GET')) : '';
      chk(() => /مقاييس رمضان والعيد/.test(html2) && /VAT Standard Rate %/.test(html2), () => `A6. the Arabic page says the measures and the column: ${wa && wa.slice(0, 200)}`);
      const big = await s.call('add_gulf_calendar', Object.assign({}, a, { measures: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Total Sales]', 'Sales[Orders]', 'Sales[Total Sales]', 'Sales[Orders]'] }));
      chk(() => big.err, () => 'A7. more than 5 measures refused by the input itself');
    } finally { await s.close(); }
  });
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 600)); }
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.2-gm1.mjs cause=${JSON.stringify(problems[0].slice(0, 160))}`); console.log(`FAIL  gm1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  gm1  ${checks} checks`);
