// 0.3.2 HR1 (B-293): the plan answer's headroom. bilingual-report's B5 plan (a bilingual plan with every 0.3.0 option
// on, the large fixture) answered 39,632 characters from a short folder and over 40,000 on CI's longer checkout path:
// the answer repeated the absolute project path in many fields. It now names the folder once (root) and every other
// file relative to it, so its size no longer grows with the path.
//   H1  the B5 plan from a long temporary folder (a 120-character folder name): at most 95% of ANSWER_MAX
//   H2  its length differs by at most 200 characters between a short and a long folder
//   H3  no field of the long-folder answer repeats the folder more than once (root names it)
//   H4  check_report and create_arabic_twin's plan from the long folder: the same, at most one mention of the folder
// Fixture: the golden model (mcp/test-models/large-synthetic, made up).   node test-0.3.2-hr1.mjs  (HR1_SHOW=1 lists
// every field that mentions the folder)
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { ANSWER_MAX } from './lib/answer.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const uniq = (a) => [...new Set(a)];
const WORDS = ['المبيعات', 'الطلبات', 'القيمة', 'المنطقة', 'الخطة', 'الشهر', 'المتوسط', 'العدد', 'الهدف', 'الربح', 'الدرجة', 'العميل'];

// the person of bilingual-report's planBilingual: the Gulf date and shared-axes answers, an Arabic name for every field
// but one, an Arabic text for every text the terms do not give (deterministic: the same words in each folder)
async function planBilingual(c, a0) {
  let made = 0; const arName = () => { const w = WORDS[made % WORDS.length], n = Math.floor(made / WORDS.length); made++; return n ? `${w} ${n + 1}` : w; };
  let args = Object.assign({}, a0), pl = await c.call('plan_layout', args), declined = null;
  for (let i = 0; i < 6 && !pl.err; i++) {
    const j = pl.j || {}, more = {};
    const gd = j.gulfDates && j.gulfDates.askNext;
    if (gd && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    const sa = j.sharedAxes && j.sharedAxes.ask;
    if (sa && sa.length && !args.sharedAxes) more.sharedAxes = sa.map((q, k) => ({ measures: q.measures, answer: k % 2 ? 'separate' : 'comparable' }));
    const B = j.bilingual;
    if (B && !args.arabicTerms && B.terminology && (B.terminology.sheet || []).length) {
      const fields = uniq(B.terminology.sheet.map((x) => x.field).filter(Boolean)), t = {};
      fields.forEach((f, k) => { t[f] = k === fields.length - 1 ? (B.terminology.sheet.find((x) => x.field === f) || {}).en : arName(); });
      declined = t[fields[fields.length - 1]]; more.arabicTerms = t;
    } else if (B && args.arabicTerms && !args.arabicTexts) {
      const at = {}; (B.texts || []).filter((x) => x.text != null && x.arabic == null && !x.field && x.text !== declined).forEach((x) => { at[x.text] = x.draftArabic || (/\{1\}/.test(x.text) ? `أعلى {1} من {2}: ${arName()}` : arName()); });
      more.arabicTexts = at;
    }
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await c.call('plan_layout', args);
  }
  return pl;
}

// every string field (its path) that mentions the folder, and how many times
const mentions = (j, root) => {
  const out = [], alt = root.split(path.sep).join('/');
  const walk = (x, p) => {
    if (typeof x === 'string') { const n = x.split(root).length - 1 + (alt !== root ? x.split(alt).length - 1 : 0); if (n) out.push({ p: p.replace(/\[\d+\]/g, '[]'), n }); }
    else if (Array.isArray(x)) x.forEach((y, i) => walk(y, p + '[' + i + ']'));
    else if (x && typeof x === 'object') Object.entries(x).forEach(([k, v]) => walk(v, p ? p + '.' + k : k));
  };
  walk(j, ''); return out;
};
const byField = (m) => { const o = {}; m.forEach((x) => { o[x.p] = (o[x.p] || 0) + x.n; }); return o; };

async function run(parent) {
  const ROOT = fs.realpathSync.native(parent);
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic'), path.join(ROOT, 'large'), { recursive: true });
  const s = await serverClient(ROOT, {});
  const res = { ROOT };
  try {
    const base = { path: 'large/Large Synthetic.SemanticModel', focus: 'Web Orders', lang: 'en', layout: 'exec', secondPage: true };
    const opt = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', flipCards: true, statusIcons: true, waterfallRtl: 'native', filters: 'top',
      metricSwitcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]', 'Web Orders[Web Orders Total Value]'], pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }],
      planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] } };
    res.plan = await planBilingual(s, Object.assign({ name: 'Orders All', languages: 'en+ar' }, base, opt));
    // a small English report to check and to twin (written through the gate, as the person would)
    const q = await s.call('plan_layout', Object.assign({ name: 'Small EN' }, base)), id = q.j && q.j.plan && q.j.plan.planId;
    if (id) { await s.call('approve_plan', { planId: id }); await s.call('create_report', { path: base.path, planId: id }); }
    res.check = await s.call('check_report', { path: 'large/Small EN.pbip' });
    res.twin = await s.call('create_arabic_twin', { path: 'large/Small EN.pbip', into: 'same' });
  } finally { await s.close(); }
  return res;
}

const SHORT = fs.mkdtempSync(path.join(os.tmpdir(), 'hr1-'));
const LONGP = fs.mkdtempSync(path.join(os.tmpdir(), 'hr1-')); const LONG = path.join(LONGP, 'a'.repeat(120)); fs.mkdirSync(LONG);
try {
  const a = await run(SHORT), b = await run(LONG);
  const la = String(a.plan.t).length, lb = String(b.plan.t).length;
  if (process.env.HR1_SHOW) {
    console.log(`plan_layout B5: short ${la} (${a.ROOT.length}-character folder), long ${lb} (${b.ROOT.length})`);
    ['plan', 'check', 'twin'].forEach((k) => console.log(k, String(a[k].t).length, '->', String(b[k].t).length, JSON.stringify(byField(mentions(b[k].j, b.ROOT)), null, 1)));
  }
  chk(() => b.plan.j && b.plan.j.plan && b.plan.j.plan.planId && !b.plan.j.truncated && lb <= 0.95 * ANSWER_MAX,
    () => `H1. the B5 plan from a ${b.ROOT.length}-character folder at most ${0.95 * ANSWER_MAX} characters, not cut: ${lb}${b.plan.j && b.plan.j.truncated ? ' cut: ' + JSON.stringify(b.plan.j.truncated.cut) : ''}`);
  chk(() => Math.abs(lb - la) <= 200, () => `H2. the B5 plan's length does not grow with the folder: ${la} (${a.ROOT.length}) -> ${lb} (${b.ROOT.length})`);
  const mp = mentions(b.plan.j, b.ROOT);
  chk(() => mp.reduce((n, x) => n + x.n, 0) <= 1, () => `H3. the B5 plan names the folder once: ${JSON.stringify(byField(mp))}`);
  ['check', 'twin'].forEach((k) => {
    const m = mentions(b[k].j, b.ROOT), d = String(b[k].t).length - String(a[k].t).length;
    chk(() => !b[k].err && m.reduce((n, x) => n + x.n, 0) <= 1 && Math.abs(d) <= 200, () => `H4. ${k === 'check' ? 'check_report' : "create_arabic_twin's plan"} names the folder once and does not grow with it (${d}): ${b[k].err ? String(b[k].t).slice(0, 300) : JSON.stringify(byField(m))}`);
  });
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
fs.rmSync(SHORT, { recursive: true, force: true }); fs.rmSync(LONGP, { recursive: true, force: true });

if (problems.length) { console.log(`FAIL  hr1  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  hr1  ${checks} checks`);
