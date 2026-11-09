// 0.3.2 HR2 (B-295): the bilingual step before the Arabic texts never cuts the texts the person labels. bilingual-report's
// B5 (a bilingual plan with every 0.3.0 option on, the large fixture), after the Gulf date answer and before the Arabic
// names and texts are given (no plan id yet), answered 42,710 characters before the cap, so capAnswer cut
// bilingual.notTranslated to 25 of 50: the texts that stay English unless the person labels them. Past AIM, the answer
// now says its repeats once (lib/plan-headroom.mjs fitRepeats, the owner's choice of 3 Nov: "Remove repeats"):
//   G1  that step from HR1's long temporary folder: not cut, at most AIM (38,000)
//   G2  notTranslated whole: 50 texts, each with its where and its why (grouped by why), none left unlisted
//   G3  the other repeats said once: the terminology sheet's why per status, forAuthoring by its slot's position
//   U1-U4  fitRepeats on made-up answers: under AIM the same object; every text, where and why kept in the groups;
//       a row whose why differs keeps it; forAuthoring stays as it is when a position is not its slot's
// Fixture: the golden model (mcp/test-models/large-synthetic, made up).   node test-0.3.2-hr2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';
import { fitRepeats, AIM } from './lib/plan-headroom.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const NT = 50;

// the person of bilingual-report's planBilingual, up to the step that first lists the bilingual texts: the Gulf date and
// shared-axes answers given, no Arabic name or text yet
async function stepBeforeTexts(c, a0) {
  let args = Object.assign({}, a0), pl = await c.call('plan_layout', args);
  for (let i = 0; i < 4 && !pl.err && !(pl.j && pl.j.bilingual); i++) {
    const j = pl.j || {}, more = {};
    if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
    const sa = j.sharedAxes && j.sharedAxes.ask;
    if (sa && sa.length && !args.sharedAxes) more.sharedAxes = sa.map((q, k) => ({ measures: q.measures, answer: k % 2 ? 'separate' : 'comparable' }));
    if (!Object.keys(more).length) break;
    args = Object.assign(args, more); pl = await c.call('plan_layout', args);
  }
  return pl;
}

// (0.3.2 WN1, F05) on Windows a folder name of 50: with 120 the project's deepest file passes Windows' 259 characters and
// the plan is refused before the approval; elsewhere 120 as before
const LONGP = fs.mkdtempSync(path.join(os.tmpdir(), 'hr2-')); const ROOT0 = path.join(LONGP, 'a'.repeat(process.platform === 'win32' ? 50 : 120)); fs.mkdirSync(ROOT0);
try {
  const ROOT = fs.realpathSync.native(ROOT0);
  fs.cpSync(path.join(HERE, 'test-models/large-synthetic'), path.join(ROOT, 'large'), { recursive: true });
  const s = await serverClient(ROOT, {});
  let pl;
  try {
    const opt = { gallery: true, smoothLines: true, slicerStyle: 'pills', grid: 'dotted', flipCards: true, statusIcons: true, waterfallRtl: 'native', filters: 'top',
      metricSwitcher: ['Web Orders[Web Orders Total Score]', 'Web Orders[Web Orders Count]', 'Web Orders[Web Orders Total Value]'], pageFilters: [{ field: 'Calendar[Is Ramadan]', values: [true] }],
      planFields: { slicers: ['Calendar[Is Weekend]', 'Coupon[Coupon Region]'] } };
    pl = await stepBeforeTexts(s, Object.assign({ name: 'Orders All', languages: 'en+ar', path: 'large/Large Synthetic.SemanticModel', focus: 'Web Orders', lang: 'en', layout: 'exec', secondPage: true }, opt));
  } finally { await s.close(); }
  const J = pl.j || {}, B = J.bilingual || {}, n = String(pl.t).length;
  if (process.env.HR2_SHOW) console.log(`the step: ${n} characters${J.truncated ? ', cut ' + JSON.stringify(J.truncated.cut) : ''}`);
  chk(() => B.terminology && !(J.plan && J.plan.planId) && !J.truncated && n <= AIM,
    () => `G1. the B5 step before the Arabic texts from a ${ROOT.length}-character folder: not cut, at most ${AIM}: ${n}${J.truncated ? ' cut: ' + JSON.stringify(J.truncated.cut) : ''}`);
  const groups = Array.isArray(B.notTranslated) ? B.notTranslated : [], texts = groups.flatMap((g) => (g.texts || []).map((t) => Object.assign({ why: g.why }, t)));
  chk(() => texts.length === NT && texts.every((t) => t.text && t.where && t.why) && !B.notTranslatedNotListed && !B.moreNotTranslated && groups.length === new Set(groups.map((g) => g.why + '|' + (g.whyAr || ''))).size,
    () => `G2. notTranslated whole: ${NT} texts, each with its where and why: ${texts.length} in ${groups.length} groups ${JSON.stringify(groups.map((g) => [g.why, (g.texts || []).length]))}`);
  const T = B.terminology || {}, FA = J.forAuthoring || [];
  chk(() => T.whyByStatus && T.whyByStatus.kept && (T.sheet || []).some((r) => r.status === 'kept') && T.sheet.filter((r) => r.status === 'kept').every((r) => !('why' in r))
    && FA.length && J.forAuthoringPosition && FA.every((f) => f.role && f.kind && f.z != null && !('position' in f)),
  () => `G3. the other repeats said once: ${JSON.stringify({ whyByStatus: T.whyByStatus, sheet: (T.sheet || []).slice(0, 2), forAuthoring: FA.slice(0, 2), rule: J.forAuthoringPosition }).slice(0, 700)}`);
} catch (e) { problems.push('threw: ' + String(e && e.stack || e).slice(0, 800)); }
fs.rmSync(LONGP, { recursive: true, force: true });

// ---------- U: fitRepeats on made-up answers ----------
try {
  const pad = 'x'.repeat(AIM), A = 'no Arabic was approved for it', F = 'a field name with no Arabic given';
  const nt = [{ text: 'Sales', where: 'title', why: A }, { text: 'Region', where: 'field name', why: F }, { text: 'Total', where: 'title (2)', why: A, whyAr: 'عربي' }, { text: 'Month', where: 'alt text', why: A }];
  const sheet = [{ field: 'S[Region]', status: 'kept', why: 'kept K' }, { field: 'S[Month]', status: 'kept', why: 'kept K' }, { field: 'S[Year]', status: 'kept', why: 'other' }, { field: 'S[Day]', status: 'draft', why: 'draft D' }];
  const slots = [{ role: 'Title', kind: 'title', x: 1, y: 2, w: 3, h: 4 }, { role: 'Main', kind: 'line', x: 5, y: 6, w: 7, h: 8 }];
  const fa = [{ role: 'Title', kind: 'title', position: { x: 1, y: 2, z: 1000, width: 3, height: 4, tabOrder: 1000 } }, { role: 'Main', kind: 'line', position: { x: 5, y: 6, z: 2000, width: 7, height: 8, tabOrder: 2000 } }];
  const big = { pad, slots, forAuthoring: fa, bilingual: { notTranslated: nt, terminology: { sheet } } }, copy = JSON.stringify(big);
  const small = { slots, forAuthoring: fa, bilingual: { notTranslated: nt, terminology: { sheet } } };
  chk(() => fitRepeats(small) === small, () => 'U1. an answer under AIM is returned as it is');
  const f = fitRepeats(big), g = f.bilingual.notTranslated, back = g.flatMap((x) => x.texts.map((t) => Object.assign({ text: t.text, where: t.where, why: x.why }, x.whyAr ? { whyAr: x.whyAr } : {})));
  const key = (x) => JSON.stringify([x.text, x.where, x.why, x.whyAr || null]);
  chk(() => JSON.stringify(big) === copy && g.length === 3 && back.length === nt.length && nt.every((x) => back.some((y) => key(y) === key(x))),
    () => `U2. every text, where and why kept, each reason once, the input unchanged: ${JSON.stringify(g)}`);
  const sh = f.bilingual.terminology.sheet;
  chk(() => f.bilingual.terminology.whyByStatus.kept === 'kept K' && !('why' in sh[0]) && !('why' in sh[1]) && sh[2].why === 'other' && sh[3].why === 'draft D' && !('draft' in f.bilingual.terminology.whyByStatus),
    () => `U3. a status's why once; a row whose why differs (or a status of one row) keeps its own: ${JSON.stringify(f.bilingual.terminology)}`);
  const off = fitRepeats(Object.assign({}, big, { forAuthoring: [fa[0], { role: 'Main', kind: 'line', position: Object.assign({}, fa[1].position, { x: 9 }) }] }));
  chk(() => f.forAuthoring.every((x) => !('position' in x) && x.z) && f.forAuthoringPosition && off.forAuthoring[1].position.x === 9 && !('forAuthoringPosition' in off),
    () => `U4. forAuthoring by its slot only when every position is its slot's: ${JSON.stringify({ f: f.forAuthoring, off: off.forAuthoring })}`);
} catch (e) { problems.push('U threw: ' + String(e && e.stack || e).slice(0, 400)); }

if (problems.length) { console.log(`FAIL  hr2  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  hr2  ${checks} checks`);
