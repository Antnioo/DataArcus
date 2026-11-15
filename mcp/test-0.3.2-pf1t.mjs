// 0.3.2 PF1 (B-380, the laptop's look032 C, 5 Nov; written red first): create_arabic_twin with timeRightToLeft false
// answered, for column and line charts over time, "value axis at the right, categories right to left by the sort"
// (mirrors[kind column]) while Power BI Desktop drew those categories left to right (PASS x3 on the files). The
// sentence said what the default writes, not what this choice writes. Now assets/js/mirror-charts.js chartsOf names a
// column-family chart whose time order is kept "columnTime", and assets/js/report-mirror.js KIND_WHAT.columnTime says
// its periods stay left to right. Time is the one time test (mirror-policy.js categoryIsTime, DD1A's isTimeName).
//   T1  a made-up page (column and line charts over FiscalYear and Qtr, a column chart by Region, a column chart over
//       FiscalYear sorted by its value): with timeRightToLeft false the charts over time are "columnTime", said left to
//       right; the one by Region and the one sorted by value stay "column" (they do turn right to left)
//   T2  with the default (time right to left) every one is "column", as before, the files byte for byte as before
//   T3  with timeRightToLeft false the written files are as before (only the kind and its sentence change)
//   T4  end to end: create_arabic_twin on a report create_report wrote for the made-up Time Lab model: its answer's
//       mirrors for both choices; the plan's answer within 95% of the answer limit (L-1102-06)
// Fixture: made up (no employer data).   node test-0.3.2-pf1t.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { ANSWER_MAX } from './lib/answer.mjs';
const require = createRequire(import.meta.url);
const Mirror = require('../assets/js/report-mirror.js');

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));
const sha = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

// ---------- T1-T3: a made-up page ----------
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const vc = (name, x, type, cat, sort) => ({ name, position: { x, y: 20, z: 1, width: 300, height: 200 }, visual: Object.assign({ visualType: type, query: Object.assign({ queryState: { Category: { projections: [col('Sales', cat)] }, Y: { projections: [mea('Sales', 'Total Sales')] } } }, sort ? { sortDefinition: { sort: [{ field: sort === 'value' ? mea('Sales', 'Total Sales').field : col('Sales', cat).field, direction: 'Ascending' }] } } : {}) }) });
const PAGE = [vc('colYear', 20, 'clusteredColumnChart', 'FiscalYear'), vc('lineQtr', 340, 'lineChart', 'Qtr', 'category'), vc('colRegion', 660, 'clusteredColumnChart', 'Region'), vc('colYearByValue', 980, 'clusteredColumnChart', 'FiscalYear', 'value')];
const page = { width: 1280, height: 720 };
const kindsOf = (opts) => { const r = Mirror.mirrorPage(page, JSON.parse(JSON.stringify(PAGE)), opts); return { kinds: r.kinds, each: Object.fromEntries(PAGE.map((v) => [v.name, Mirror.mirrorVisual(JSON.parse(JSON.stringify(v)), page.width, opts).kind])), files: sha(r.visuals) }; };
const kept = kindsOf({ timeRightToLeft: false }), def = kindsOf({ timeRightToLeft: true });
chk(() => kept.each.colYear === 'columnTime' && kept.each.lineQtr === 'columnTime', () => `T1. a column and a line chart over time kept left to right are said as kept: ${JSON.stringify(kept.each)}`);
chk(() => kept.each.colRegion === 'column' && kept.each.colYearByValue === 'column', () => `T1. a column chart by a non-time category, and one over time sorted by its value (turned), stay "column": ${JSON.stringify(kept.each)}`);
chk(() => kept.kinds.columnTime === 2 && kept.kinds.column === 2, () => `T1. the page counts 2 kept and 2 turned: ${JSON.stringify(kept.kinds)}`);
const W = Mirror.KIND_WHAT || {};
chk(() => typeof W.columnTime === 'string' && /left to right/.test(W.columnTime) && /timeRightToLeft false/.test(W.columnTime) && !/right to left/.test(W.columnTime.replace(/timeRightToLeft/g, '')), () => `T1. the sentence for the kept charts says their periods stay left to right: ${W.columnTime}`);
chk(() => /categories right to left/.test(W.column), () => `T1. the sentence for the turned charts is as before: ${W.column}`);
chk(() => Object.values(def.each).every((k) => k === 'column') && def.kinds.column === 4 && !def.kinds.columnTime, () => `T2. with the default every chart is "column", as before: ${JSON.stringify(def)}`);
// the files: what each choice writes is the base's (recorded on 12d9d30c, the base of PF1)
const BASE = { kept: '2ae316e4', def: '9b12985a' };
console.log(`  the files' digests: kept ${kept.files.slice(0, 8)}, default ${def.files.slice(0, 8)}`);
chk(() => kept.files.slice(0, 8) === BASE.kept && def.files.slice(0, 8) === BASE.def, () => `T3. the written files are the base's for both choices: ${kept.files.slice(0, 8)} ${def.files.slice(0, 8)} (base ${JSON.stringify(BASE)})`);

// ---------- T4: end to end, the Time Lab report ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pf1t-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const c = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
fs.mkdirSync(path.join(ROOT, 'lab/Time Lab.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'lab/Time Lab.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [c('FiscalYear', 'string'), c('Qtr', 'string'), c('Region', 'string'), c('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } }));
const s = await serverClient(ROOT, {});
try {
  const pl = await s.call('plan_layout', { path: 'lab', layout: 'exec', kpis: 0, name: 'TL', planFields: { kpis: [], measure: 'Sales[Total Sales]', timeAxis: 'Sales[FiscalYear]', category: 'Sales[Qtr]', category2: 'Sales[Region]' } });
  const id = !pl.err && pl.j.plan && pl.j.plan.planId;
  if (id) await s.call('approve_plan', { planId: id });
  const made = id ? await s.call('create_report', { path: 'lab', planId: id }) : pl;
  chk(() => !made.err && made.j.written > 0, () => `T4 setup. the Time Lab report is written: ${short(made)}`);
  const first = await s.call('create_arabic_twin', { path: 'lab/TL.Report' });
  let k = 0; const labels = {}; ((!first.err && first.j.texts) || []).filter((t) => t.text != null).forEach((t) => { labels[t.id] = t.draftArabic || (/\{1\}/.test(t.text) ? `أعلى {1} من أصل {2}: نص ${++k}` : `نص ${++k}`); });
  let turned = -1;
  for (const [choice, trl] of [['the default', true], ['kept left to right', false]]) {
    const p = await s.call('create_arabic_twin', { path: 'lab/TL.Report', labels, timeRightToLeft: trl });
    const mirrors = (!p.err && p.j.mirrors) || [], size = p.err ? -1 : JSON.stringify(p.j).length;
    const col0 = mirrors.find((x) => x.kind === 'column'), colT = mirrors.find((x) => x.kind === 'columnTime');
    console.log(`  ${choice}: mirrors ${JSON.stringify(mirrors.map((x) => [x.kind, x.count]))}; the plan's answer ${size} characters (limit ${ANSWER_MAX})`);
    if (trl === false) {
      chk(() => colT && colT.count >= 1 && colT.what === W.columnTime, () => `T4 ${choice}: the trend over FiscalYear is said kept left to right: ${JSON.stringify(mirrors)}`);
      chk(() => colT && (col0 ? col0.count : 0) + colT.count === turned, () => `T4 ${choice}: the same ${turned} charts, those over time now said kept, no chart over time said "categories right to left": ${JSON.stringify(mirrors)}`);
    } else { turned = col0 ? col0.count : 0; chk(() => col0 && !colT, () => `T4 ${choice}: every column-family chart is said right to left, as before: ${JSON.stringify(mirrors)}`); }
    chk(() => !p.err && p.j.plan && p.j.plan.planId && size > 0 && size <= 0.95 * ANSWER_MAX && !p.j.truncated, () => `T4 ${choice}: the plan's answer within 95% of the limit, uncut (L-1102-06, L-1103-03): ${size} ${short(p)}`);
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.2-pf1t.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1500))); console.log(`FAIL  pf1t  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  pf1t  ${checks} checks`);
