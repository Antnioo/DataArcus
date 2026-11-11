import './test-env.mjs';
// 0.3.3 FB4 (the owner, 11 Nov, D-1111-17; mcp/work/FB4.md): two things in the layout planner.
//   T  a category chart's topN follows the size fitSlots ends with (it was worked out once, from the designed size): the
//      312-high bar chart of a reflowed page carries 5, not the 9 of its designed 440; every slot of the fb1 guard grid whose
//      size fitSlots changes carries categoryFit of its final size; a slot it leaves alone keeps its topN
//   F  filters "none" and the 3 written slicers: they are the Details page's, by design; the answer says so (the cause is
//      measured in mcp/work/FB4.md), and secondPage false writes none
// Made-up data only.   node test-0.3.3-fb4.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const E = require('../assets/js/design-engine.js'), Mx = require('../assets/js/design-metrics.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x);
const RAIL_ITEMS = (h) => ({ minH: 40 * h / 1080, maxH: 76 * h / 1080, resetH: 40 * h / 1080, pad: 10 * h / 1080, gap: 8 * h / 1080 });
const fitOn = (c, lang, n, noTime) => { const designed = E.projectSlots(c, lang, { noTime }), p = E.page(c);
  return { designed, p, fitted: Mx.fitSlots(designed, { topScale: p.s, dropKinds: [], headerRows: 0, railItems: Object.assign({ n }, RAIL_ITEMS(p.h)) }).slots }; };

// ---------- T ----------
{ const c = { preset: 'exec', page: '1920x1080', header: true, filters: true, fpos: 'start', kpis: 4 };
  const { designed, fitted } = fitOn(c, 'en', 3), bars = fitted.map((s, i) => [designed[i], s]).filter(([d]) => d.kind === 'bar');
  chk(() => bars.some(([d, s]) => d.h === 440 && s.h === 312 && d.topN === 9 && s.topN === 5), () => `T1. the bar chart reflowed from 440 to 312 high carries 5 (was 9): ${J(bars.map(([d, s]) => [d.h, s.h, d.topN, s.topN]))}`);
  chk(() => bars.every(([d, s]) => s.topN === Mx.categoryFit('bar', Math.round(s.w / 1.5), Math.round(s.h / 1.5))), () => 'T2. a bar chart\'s topN is categoryFit of its final size'); }
{ const RI = RAIL_ITEMS; let total = 0, changed = 0, stale = 0, kept = 0, bad = [];
  for (const preset of ['exec', 'analysis', 'ops', 'focus']) for (const fpos of ['start', 'end']) for (const pg of ['1920x1080', '1280x720', '960x720']) for (const n of [1, 2, 3]) for (const kpis of [null, 0]) for (const noTime of [false, true]) for (const lang of ['en', 'ar']) {
    const c = { preset, page: pg, header: true, filters: true, fpos, kpis: kpis == null ? E.LAYOUTS[preset].kpis : kpis }, { designed, p, fitted } = fitOn(c, lang, n, noTime);
    fitted.forEach((s, i) => { const d = designed[i]; if (d.topN == null) return; total++;
      if (s.w !== d.w || s.h !== d.h) { changed++; if (s.topN !== Mx.categoryFit(s.kind, Math.round(s.w / p.s), Math.round(s.h / p.s))) { stale++; bad.length < 3 && bad.push(`${preset} ${fpos} ${pg} ${s.kind} ${d.w}x${d.h}->${s.w}x${s.h} topN ${s.topN}`); } }
      else if (s.topN === d.topN) kept++; }); }
  chk(() => total === 936 && changed === 690, () => `T3. the grid: ${total} category slots (936), ${changed} change size (690)`);
  chk(() => stale === 0, () => `T4. ${stale} slots whose size fitSlots changed carry a topN that is not categoryFit of their final size: ${bad.join('; ')}`);
  chk(() => kept === total - changed, () => `T5. a slot fitSlots leaves alone keeps its topN: ${kept} of ${total - changed}`);
  // without topScale the units are unknown: topN is left as it was
  const c = { preset: 'exec', page: '1920x1080', header: true, filters: true, fpos: 'start', kpis: 4 }, d = E.projectSlots(c, 'en', {}), f = Mx.fitSlots(d, { dropKinds: [], headerRows: 0, railItems: Object.assign({ n: 2 }, RI(1080)) }).slots;
  chk(() => f.every((s, i) => s.topN === d[i].topN), () => 'T6. without topScale fitSlots leaves topN as it was');
  const k = Mx.fitScale({ topScale: 1.5, headerRows: 0 }, 1 / 1.5); chk(() => Math.abs(k.topScale - 1) < 1e-9, () => `T7. fitScale scales topScale with the lengths: ${k.topScale}`); }

// ---------- F ----------
// The cause of "3 written slicers" under filters "none" (measured, mcp/work/FB4.md): not a leak. filters "none" is the first
// page's layout; the Details page of an executive, operations or focus first page is the analysis layout, whose rail is its
// design (secondLayout), so the report writes its 3 slicers there. Decision: kept; the answer says so, and secondPage false
// is the way to no slicers at all.
for (const preset of ['exec', 'ops', 'focus']) {
  const off = E.projectPages({ preset, page: '1920x1080', header: true, filters: false, fpos: 'start', kpis: E.LAYOUTS[preset].kpis }, 'en', { second: true });
  chk(() => off.length === 2 && !off[0].slots.some((x) => x.kind === 'slicer') && off[1].slots.some((x) => x.kind === 'slicer'), () => `F1. ${preset}, filters off: page 1 has no slicer slot and the Details page keeps its rail: ${J(off.map((p) => p.slots.filter((x) => x.kind === 'slicer').length))}`); }
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fb4-')));
const s = await serverClient(ROOT, {});
try {
  const sp = await s.call('plan_layout', { sample: true, lang: 'en' });
  await s.call('approve_plan', { planId: sp.j.plan.planId });
  await s.call('create_report', { path: sp.j.sample.folder, planId: sp.j.plan.planId });
  const plan = (o) => s.call('plan_layout', Object.assign({ path: sp.j.sample.folder, name: 'R', page: '1920x1080', lang: 'en' }, o));
  const exec = await plan({ layout: 'exec', filters: 'none' }), start = await plan({ layout: 'exec', filters: 'start' }), one = await plan({ layout: 'exec', filters: 'none', secondPage: false }), an = await plan({ layout: 'analysis', filters: 'none' });
  chk(() => exec.j.slicers.written.length === 3 && /second page \(Details\) keeps its filter rail/.test(exec.j.slicers.sayInPlan) && /secondPage false/.test(exec.j.slicers.sayInPlan), () => `F2. exec, filters none: the answer says the 3 slicers are on the Details page and how to have none: ${J(exec.j.slicers)}`);
  chk(() => start.j.slicers.written.length === 3 && !/second page \(Details\)/.test(start.j.slicers.sayInPlan), () => `F3. filters start: the 3 slicers, no sentence about the second page: ${J(start.j.slicers)}`);
  chk(() => !one.j.slicers && !(one.j.slots || []).some((x) => x.kind === 'slicer'), () => `F4. filters none and secondPage false: no slicers: ${J(one.j.slicers)}`);
  chk(() => !an.j.slicers, () => `F5. analysis, filters none: its second page is the overview, no slicers: ${J(an.j.slicers)}`);
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-fb4.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 400))); console.log(`FAIL  fb4  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fb4  ${checks} checks`);
