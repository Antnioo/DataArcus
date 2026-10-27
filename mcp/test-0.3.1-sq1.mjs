import './test-env.mjs';
// 0.3.1 SQ1 (the owner's night run, 25 Oct: every "Seen, not in scope" item fixed): the written report's numbers and
// text, five items of mcp/work/SEEN-QUEUE.md, each at its cause in the shared writer (assets/js). Written red first.
// Made-up models and names only (a facility maintenance model, a made-up sales model): no employer or client data.
//   A  0.2.9-writer-S14 a quarter chart's column labels: a measure the cards show whole keeps its format ("8.0Kkg")
//   B  M1-S4 a narrow hand-placed slicer slot: no slicer narrower than Desktop draws; what is left out is told
//   C  0.2.9-writer-S4 a control character in a model's name never reaches a shown text (titles, display names)
//   D  S1-S9 the hidden "Last N months" helper is named in one script
//   E  0.2.9-writer-S6 the dead iconH and the tooltip page's size in a comment
//   node test-0.3.1-sq1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { elicitClient } from './test-audit6.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..'), require = createRequire(import.meta.url);
const Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js'), Q = require('../assets/js/pbip-query.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
// one script: no name that holds Latin letters beside letters of another script
const oneScript = (s) => !(/\p{Script=Latin}/u.test(s) && /[^\P{L}\p{Script=Latin}]/u.test(s));

// ---------- the writer alone (pbip-export.js build, the engine create_report and the website call) ----------
const T = 'Work Orders', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x) => Object.assign({ t: T, c }, x || {});
const QUARTER = { t: 'Dim Date', c: 'Quarter', kind: 'quarter' };
const bindOf = (y) => ({ kpis: [y], measure: y, cats: { column: QUARTER, bar: C('Technician') }, y: {}, table: [C('Technician'), y], slicers: [C('Department'), C('Status'), null] });
// (0.3.1 TS1: these slots were measured with the theme's 15pt text, 1920 x 1080's up to 0.3.0; 1080 is 12.5 now, x 1.25,
// so the theme is made for a 2560 x 1440 page, whose sizes are those, x 1.5; every number below as it was)
const build = (lang, slots, bind) => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d); Object.assign(d.layout, { page: 'custom', pageW: 2560, pageH: 1440 });
  return Px.build({ name: 'SQ1', title: 'Work orders', pageName: 'Overview', lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false,
    model: { byPath: 'Service Orders.SemanticModel' }, bind, texts: E.REPORT_TEXTS[lang], pages: [{ name: 'Overview', page: { w: 1280, h: 720 }, slots, panel: null, hand: true }] }); };
const visuals = (r) => r.files.filter((f) => /\/visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data))).filter((v) => v.visual);
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value) : undefined);

// ---------- A: 0.2.9-writer-S14, the quarter chart's column labels ----------
{
  const labelsOf = (y) => { const r = build('en', [{ kind: 'column', x: 20, y: 20, w: 600, h: 300 }], bindOf(y)); const v = visuals(r).find((x) => x.visual.visualType === 'clusteredColumnChart'); return ((v.visual.objects || {}).labels || [])[0].properties; };
  const kg = get(() => labelsOf(M('Total Weight', { pct: false, wholeFormat: '#,0 "kg"' })));
  chk(() => lit(kg.labelDisplayUnits) === '1D' && kg.labelPrecision === undefined, () => `A1. a quarter chart of a measure the cards show whole (#,0 "kg") keeps its format on the labels (display units None, no forced decimal), never "8.0Kkg": ${JSON.stringify(kg)}`);
  const plain = get(() => labelsOf(M('Total Cost', { pct: false })));
  chk(() => lit(plain.labelDisplayUnits) === '0D' && lit(plain.labelPrecision) === '1L', () => `A2. guard: a measure without a whole format keeps automatic units with one decimal ("77.7K"): ${JSON.stringify(plain)}`);
  const pct = get(() => labelsOf(M('On Time %', { pct: true })));
  chk(() => lit(pct.labelDisplayUnits) === '0D' && pct.labelPrecision === undefined, () => `A3. guard: a percent keeps its own format: ${JSON.stringify(pct)}`);
}

// ---------- B: M1-S4, a narrow hand-placed slicer slot ----------
{
  const FLOOR = 24;   // the narrowest slicer Desktop was seen to draw (a sliver; a negative width is not drawn: DESKTOP-TESTS.md)
  const row = (lang, w, h) => { const r = build(lang, [{ kind: 'slicer', x: 20, y: 20, w, h }], bindOf(M('Total Cost'))), vs = visuals(r);
    return { r, slicers: vs.filter((v) => v.visual.visualType === 'slicer').map((v) => v.position), reset: vs.filter((v) => v.visual.visualType === 'actionButton').map((v) => v.position) }; };
  const narrowOf = (r, kind) => (r.leftOut || []).filter((x) => x.narrow && x.kind === kind);
  const ar = get(() => row('ar', 240, 80)), en = get(() => row('en', 240, 80));
  chk(() => ar.slicers.length === 2 && ar.slicers.every((p) => p.width >= FLOOR) && new Set(ar.slicers.map((p) => p.x)).size === 2, () => `B1. Arabic, a 240 x 80 slot with two slicers: each slicer ${FLOOR} wide or more, side by side (was -5, both at one x): ${JSON.stringify(ar.slicers || ar)}`);
  chk(() => !ar.reset.length && narrowOf(ar.r, 'reset').length === 1, () => `B2. Arabic: the Reset button (227 wide) is left out and told as too narrow: ${JSON.stringify(ar.reset)} ${JSON.stringify(ar.r && ar.r.leftOut)}`);
  chk(() => en.slicers.length === 2 && en.slicers.every((p) => p.width >= FLOOR) && !en.reset.length && narrowOf(en.r, 'reset').length === 1, () => `B3. English, the same slot: slicers ${FLOOR} wide or more (were 22), the Reset left out and told: ${JSON.stringify(en.slicers || en)} ${JSON.stringify(en.r && en.r.leftOut)}`);
  const wide = { en: get(() => row('en', 620, 100)), ar: get(() => row('ar', 620, 100)) };
  chk(() => JSON.stringify(wide.en.slicers.map((p) => p.width)) === '[213,213]' && JSON.stringify(wide.en.reset.map((p) => p.width)) === '[171]' && JSON.stringify(wide.ar.slicers.map((p) => p.width)) === '[174,174]' && JSON.stringify(wide.ar.reset.map((p) => p.width)) === '[249]' && !narrowOf(wide.en.r, 'reset').length && !narrowOf(wide.ar.r, 'reset').length,
    () => `B4. guard: a 620 x 100 slot is as before (English 213, 213 and Reset 171; Arabic 174, 174 and Reset 249), nothing told: ${JSON.stringify([wide.en.slicers, wide.en.reset, wide.ar.slicers, wide.ar.reset])}`);
  const tiny = get(() => row('en', 60, 40));
  chk(() => tiny.slicers.length === 1 && tiny.slicers[0].width >= FLOOR && !tiny.reset.length && narrowOf(tiny.r, 'slicer').length === 1 && narrowOf(tiny.r, 'reset').length === 1, () => `B5. a 60 x 40 slot: one slicer kept (${FLOOR} wide or more), the second and the Reset left out and told: ${JSON.stringify(tiny.slicers || tiny)} ${JSON.stringify(tiny.r && tiny.r.leftOut)}`);
}

// ---------- C: 0.2.9-writer-S4, control characters in shown names ----------
{
  chk(() => Q.shown('Total\tSales') === 'Total Sales' && Q.shown('Total\r\nSales') === 'Total Sales', () => `C1. a tab or a line break in a name is shown as one space: ${JSON.stringify([Q.shown('Total\tSales'), Q.shown('Total\r\nSales')])}`);
  const y = M('Total\tCost', { pct: false }), r = get(() => build('en', [{ kind: 'kpi', x: 20, y: 20, w: 600, h: 100 }, { kind: 'bar', x: 20, y: 140, w: 600, h: 300 }], Object.assign(bindOf(y), { cats: { bar: C('Technician') } })));
  // every shown text the writer wrote: titles, alt texts, display names, text runs
  const texts = []; const walk = (o, k) => { if (Array.isArray(o)) o.forEach((x) => walk(x, k)); else if (o && typeof o === 'object') Object.entries(o).forEach(([kk, v]) => walk(v, kk)); else if (typeof o === 'string' && ['displayName', 'value', 'Value'].includes(k)) texts.push(o); };
  (r.files || []).filter((f) => /\/visual\.json$/.test(f.path)).forEach((f) => walk(JSON.parse(String(f.data))));
  chk(() => texts.some((t) => /Total Cost/.test(t)) && !texts.some((t) => /\p{Cc}/u.test(t)), () => `C2. a report on a measure named "Total<tab>Cost" shows "Total Cost" and no control character in any title or display name: ${JSON.stringify(texts.filter((t) => /Total/.test(t)).slice(0, 6))} ${r.threw || ''}`);
  chk(() => Q.shown('می‌خواهم') === 'می‌خواهم', () => 'C3. guard: the zero-width non-joiner (U+200C) stays');
  chk(() => Q.shown('Total‮Sales') === 'TotalSales', () => `C4. guard: a right-to-left override (U+202E) is still dropped: ${JSON.stringify(Q.shown('Total‮Sales'))}`);
}

// ---------- D: S1-S9, the "Last N months" helper's name ----------
{
  const lastName = (f, t, m) => { const timeExt = [], X = Q.measures({ freeExt: (tt, want) => want, timeExt }); X.lastMonths(f, { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, 12); return (timeExt[timeExt.length - 1] || {}).m; };
  const d1 = lastName({ t: 'التقويم', c: 'الشهر', dateOf: { t: 'التقويم', c: 'التاريخ' } }, 'المبيعات', 'إجمالي المبيعات');
  chk(() => /^Last 12 months/.test(d1) && oneScript(d1), () => `D1. an Arabic measure: the hidden helper is plain English, one script: ${d1}`);
  const d2 = lastName({ t: 'Calendar', c: 'Month Year', dateOf: { t: 'Calendar', c: 'Date' } }, 'Sales', 'Total Sales');
  chk(() => d2 === 'Last 12 months: Total Sales', () => `D2. guard: an English report keeps its helper's name: ${d2}`);
  const d3 = lastName({ t: 'Cal', c: 'Month Year' }, 'المبيعات', 'إجمالي المبيعات');
  chk(() => /^Last 12 months/.test(d3) && oneScript(d3), () => `D3. a month label without its date table: one script too: ${d3}`);
}

// ---------- E: 0.2.9-writer-S6, iconH and the tooltip page's size ----------
{
  const src = (f) => fs.readFileSync(path.join(REPO, 'assets/js', f), 'utf8');
  chk(() => !/iconH/.test(src('pbip-sizing.js')) && !/iconH/.test(src('pbip-page.js')), () => 'E1. iconH (never called) is gone from pbip-sizing.js and pbip-page.js');
  chk(() => !/320 x 240/.test(src('pbip-page.js')) && /320 x 284 tooltip page/.test(src('pbip-page.js')), () => 'E2. pbip-page.js names the tooltip page as written, 320 x 284 (never 320 x 240)');
}

// ---------- B6: the write's answer says it (plan_layout, the click, create_report, on a made-up model) ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq1-')));
{
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  fs.mkdirSync(path.join(ROOT, 'sq1', 'M.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'sq1', 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
  const s = await elicitClient(ROOT, () => ({ action: 'accept', content: { approve: true } }));
  try {
    const args = { path: 'sq1', name: 'SQ1 narrow', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'slicer', x: 20, y: 20, w: 160, h: 80 }] }] };   // (two slicers of 6 beside a 124 Reset, as written before)
    const pl = await s.call('plan_layout', args), planId = pl.j && pl.j.plan && pl.j.plan.planId;
    await s.call('approve_plan', { planId });
    const x = await s.call('create_report', Object.assign({ planId }, args)), said = JSON.stringify(x.j || x.t);
    chk(() => !x.err && /too narrow for it: Reset filters on/.test(said) && /"visual":"Reset filters"/.test(said), () => `B6. create_report says the Reset button was left out of the too narrow slot (its notes and leftOutVisuals): ${said.slice(0, 600)}`);
  } finally { await s.close(); }
}
fs.rmSync(ROOT, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL script=test-0.3.1-sq1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq1  ${checks} checks`);
