import './test-env.mjs';
// 0.3.1 LR1 (the owner's laptop run of 26 Oct, Power BI Desktop 2.159, on integration/0.3.1 0f7f6e83): the items found
// there, each at its cause; written red first (mcp/work/LR1.md). Made-up models and names only: no employer or client data.
//   A  "Last 12 months" drew 13: the date-column branch of lastMonths kept the month n back (its last day is after
//      EDATE of the last date); exactly n months, the last month with data counted, both branches, n = 12 and 3
//   B  the plan names every slicer it writes, and says the one added to fill the design's slots (English and Arabic)
//   C  a field's Arabic draft never joins date words word for word: "Year Month" is «الشهر والسنة»
//   (item 4, the Arabic sample page's rows: in test-0.3.1-sq3.mjs; item 5: test-0.3.1-arabic-lens.mjs's L1_DUMP folder)
//   node test-0.3.1-lr1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { keepEnglish } from './test-plan.mjs';
import * as Approval from './lib/approval-window.mjs';
import { proposeArabic, draftText } from './lib/arabic-names.mjs';

const require = createRequire(import.meta.url), Q = require('../assets/js/pbip-query.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));

// ---------- A: the last n months, evaluated as the DAX does ----------
{
  // DAX's own date functions (UTC dates): EDATE keeps the day, clamped to the month's end; EOMONTH is the month's last day
  const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d)), endOf = (y, m) => D(y, m + 1, 0);
  const EDATE = (x, k) => { const y = x.getUTCFullYear(), m = x.getUTCMonth() + 1 + k, last = endOf(y, m).getUTCDate(); return D(y, m, Math.min(x.getUTCDate(), last)); };
  const EOMONTH = (x, k) => endOf(x.getUTCFullYear(), x.getUTCMonth() + 1 + k);
  const FN = { EDATE, EOMONTH };
  const helper = (f, n) => { const timeExt = [], X = Q.measures({ freeExt: (t, want) => want, timeExt }); X.lastMonths(f, { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } }, n); return timeExt[timeExt.length - 1]; };
  // the months a helper keeps: its RETURN clause's comparison read from the DAX, over 36 months to the last one with data;
  // the date branch compares a month's MAX date (its last day; the last month's: its last day too, a full date table),
  // the label branch the month's first day (DATEVALUE of the label), _last as each branch computes it
  const kept = (f, n, last) => {
    const m = helper(f, n), e = m && m.expression, rx = / > (EDATE|EOMONTH) \( _last, -(\d+) \)/.exec(e || '');
    if (!rx || Number(rx[2]) !== n) return { error: e };
    const label = !f.dateOf, ly = last.getUTCFullYear(), lm = last.getUTCMonth() + 1, lastV = label ? D(ly, lm, 1) : last, cut = FN[rx[1]](lastV, -n);
    const months = Array.from({ length: 36 }, (_, i) => { const k = lm - 35 + i; return { y: ly + Math.floor((k - 1) / 12), m: ((k - 1) % 12 + 12) % 12 + 1 }; });
    const keep = months.filter((x) => (label ? D(x.y, x.m, 1) : endOf(x.y, x.m)) > cut);
    return { n: keep.length, first: keep[0], last: keep[keep.length - 1], fn: rx[1] };
  };
  const BRANCH = { date: { t: 'Calendar', c: 'Year Month', dateOf: { t: 'Calendar', c: 'Date' } }, label: { t: 'Calendar', c: 'Year Month' } };
  for (const [tag, last] of [['mid-month (15 Jun 2026)', D(2026, 6, 15)], ['a month\'s last day (30 Jun 2026)', D(2026, 6, 30)]])
    for (const br of ['date', 'label']) for (const n of [12, 3]) {
      const k = kept(BRANCH[br], n, last);
      chk(() => k.n === n && k.last.y === 2026 && k.last.m === 6, () => `A. the ${br} branch, data ending ${tag}, last ${n} months: exactly ${n}, June 2026 the last: ${JSON.stringify(k)}`);
    }
}

// ---------- C: date words in a field's Arabic draft ----------
{
  const want = [['Year Month', 'الشهر والسنة'], ['Month Year', 'الشهر والسنة'], ['Year Quarter', 'الربع والسنة'], ['Quarter Year', 'الربع والسنة'], ['Year Week', 'الأسبوع والسنة'],
    ['Month Day', 'اليوم والشهر'], ['Hijri Year', 'السنة الهجرية'], ['Hijri Month', 'الشهر الهجري'], ['Year Month Name', 'اسم الشهر والسنة']];
  const got = want.map(([en]) => [en, proposeArabic(en)]);
  chk(() => got.every(([en, ar], i) => ar === want[i][1]), () => `C1. a compound date name's draft reads as Arabic, never word for word: ${got.filter(([, ar], i) => ar !== want[i][1]).map(([en, ar]) => `${en} -> ${ar}`).join('; ')}`);
  chk(() => draftText('Total Sales by Year Month') === 'إجمالي المبيعات حسب الشهر والسنة', () => `C2. a title on a "Year Month" axis: ${draftText('Total Sales by Year Month')}`);
  // any other run of date words: no draft (the assistant proposes one, as for any name the list doesn't hold)
  const other = ['Date Year', 'Week Day', 'Quarter Month', 'Hijri Month Year', 'Year Hijri'].map((en) => [en, proposeArabic(en), draftText(en)]);
  chk(() => other.every(([, p, d]) => p === null && d === null), () => `C3. any other run of date words gets no draft: ${JSON.stringify(other)}`);
  chk(() => proposeArabic('Total Sales') === 'إجمالي المبيعات' && proposeArabic('Month Name') === 'اسم الشهر' && proposeArabic('Year') === 'السنة' && proposeArabic('Hijri Date') === 'التاريخ الهجري',
    () => `C4. guard: one date word, and names around one, unchanged: ${['Total Sales', 'Month Name', 'Year', 'Hijri Date'].map(proposeArabic).join(' | ')}`);
}

// ---------- B: the plan names every slicer it writes ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-lr1-')));
process.env.DATAARCUS_ROOT = ROOT;
const S = await import('./lib/sample-project.mjs');
S.sampleFiles(S.SAMPLE_FOLDER).forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
const w = await serverClient(ROOT, {});
try {
  const first = S.tour(S.SAMPLE_FOLDER, 'en')[0].call.args, asked = first.planFields.slicers;
  // (0.3.1 CX1, F01: an Arabic plan whose titles would be English gets no plan id) the sample's two fields with no Arabic
  // name are kept English on purpose: these checks are about the slicers and the approval page, not the names
  const KEPT = keepEnglish('Sales[Units Sold]', 'Sales[Average Basket]');
  for (const lang of ['en', 'ar']) {
    const x = await w.call('plan_layout', Object.assign({}, first, { lang }, lang === 'ar' ? { displayNames: KEPT } : {})), sl = (x.j && x.j.slicers) || {}, written = sl.written || [], added = sl.added || [];
    chk(() => !x.err && x.j.plan && x.j.plan.planId && written.length === 3 && added.length === 1 && written.length === asked.length + added.length && !asked.some((f) => added.includes(f)),
      () => `B1 ${lang}. the plan lists the 3 slicers it writes, the tour's 2 and the 1 added: ${JSON.stringify(sl)} ${short(x)}`);
    const say = lang === 'ar' ? sl.sayInPlanAr : sl.sayInPlan;
    chk(() => typeof say === 'string' && written.every((f) => say.includes(f)) && (lang === 'ar' ? /[؀-ۿ]/.test(say) && /أضاف/.test(say) : /added/.test(say)),
      () => `B2 ${lang}. the plan's text names each slicer and says the one added to fill the design's slots${lang === 'ar' ? ', in Arabic' : ''}: ${JSON.stringify(say)}`);
  }
  // the approval page's Fields row names the added slicer too (English page; the Arabic page: Arabic, the English under it)
  const fields = (lang) => { const s = Approval.summary('report', { pins: { create_report: { name: 'R', lang, fields: { slicers: ['Sales[Channel]', 'Calendar[Year]'] } } }, slicersAdded: ['Branches[Country]'] });
    return ((s.sections.find((x) => x.heading === 'Fields') || { rows: [] }).rows.find((r) => r[0] === 'Slicers' || (r[0] && r[0].en === 'Slicers')) || [])[1]; };
  const fe = fields('en'), fa = fields('ar'), txt = (v) => (Array.isArray(v) ? v : [v]).map((y) => (y && typeof y === 'object' ? `${y.ar} / ${y.en}` : String(y))).join(' | ');
  chk(() => /Branches\[Country\]/.test(txt(fe)) && /added/.test(txt(fe)) && /Sales\[Channel\]/.test(txt(fe)), () => `B3. the approval page's Slicers row names the added slicer: ${txt(fe)}`);
  chk(() => /Branches\[Country\]/.test(txt(fa)) && /أضاف/.test(txt(fa)), () => `B4. on an Arabic page, in Arabic with the English under it: ${txt(fa)}`);
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-lr1.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  lr1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  lr1  ${checks} checks`);
