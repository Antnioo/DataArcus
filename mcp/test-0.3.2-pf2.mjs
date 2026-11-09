// 0.3.2 PF2 (B-383, PF1's "Seen, not in scope"; the laptop's look032 C, 5 Nov): plan_layout with kpis 0 and no
// planFields.kpis, approve_plan, create_report: the written report held 2 cards showing Total Sales the plan never named.
// Measured on b8063087: no report page gets a card with kpis 0 (kpis is honoured); the 2 cards are the two tooltip
// pages' own cards (one each, written whatever kpis is), and plan_layout's answer named no card on any page. The owner's
// rule: the plan the person approves says what the click writes. Now plan_layout's answer has cardsWritten: every page,
// every card by the measure it shows (lib/plan-lint.mjs pagesWritten -> cardsWritten, the approval page's own list).
//   C1  the pinned input (L-1105-09, the lab driver's JSON as pf1 holds it): exec, kpis 0, no filters, planFields
//       measure, timeAxis, category, category2, no planFields.kpis: no card on a report page, one Sales[Total Sales]
//       card on each tooltip page (as before)
//   C2  the plan names them: cardsWritten lists every written page that holds a card and, on it, exactly the written
//       cards; said with a plan id (red on b8063087)
//   C3  the approval page's data (pagesWritten, read from the written files) holds the same cards, page by page
//   C4  kpis 3 (unchanged): the first page's top row and the designed second page keep their cards, said in the plan
//   C5  another layout (analysis, kpis 0): the same; the answer is never cut (truncated)
// Fixture: fixtures/time-lab.mjs (pf1's made-up model, no employer data), in a temporary folder.   node test-0.3.2-pf2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';
import { timeLab } from './fixtures/time-lab.mjs';
import { pagesWritten } from './lib/plan-lint.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x);

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pf2-')));
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
// the written report read here, apart from the tools: each page in order, its name, whether a tooltip page, and each
// card by the model measures it shows (a card of report measures only is a "no data" message: counted apart)
const written = (dir) => { const pd = path.join(ROOT, dir, 'TL.Report/definition/pages');
  return rd(path.join(pd, 'pages.json')).pageOrder.map((id) => { const pj = rd(path.join(pd, id, 'page.json')), cards = []; let messages = 0;
    walk(path.join(pd, id, 'visuals')).filter((f) => /visual\.json$/.test(f)).map(rd).filter((v) => v.visual && /^(cardVisual|card|multiRowCard|kpi)$/.test(v.visual.visualType))
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x).forEach((v) => {
        const ms = Object.values((v.visual.query || {}).queryState || {}).flatMap((r) => r.projections || []).map((p) => p.field.Measure).filter(Boolean);
        const own = ms.filter((m) => !m.Expression.SourceRef.Schema).map((m) => `${m.Expression.SourceRef.Entity}[${m.Property}]`);
        if (own.length) cards.push([...new Set(own)].join(', ')); else if (ms.length) messages++; });
    return { page: pj.displayName, tooltip: pj.type === 'Tooltip', cards, messages }; }); };
const s = await serverClient(ROOT, {});
const run = async (dir, args) => { timeLab(ROOT, dir);
  const pl = await s.call('plan_layout', Object.assign({ path: dir, name: 'TL' }, args)), id = !pl.err && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, w: [] };
  await s.call('approve_plan', { planId: id });
  const made = await s.call('create_report', { path: dir, planId: id });
  return { pl, made, w: made.err ? [] : written(dir) }; };
// C2: the plan's cardsWritten is the written report, page by page
// (each page that holds a card, in the report's order; a page with no card visual is not listed)
const samePages = (label, pl, w) => { const cw = !pl.err && pl.j.cardsWritten, held = w.filter((x) => x.cards.length);
  chk(() => cw && Array.isArray(cw.pages) && cw.pages.length === held.length && held.every((x, i) => cw.pages[i].page === x.page && !!cw.pages[i].tooltip === x.tooltip && J(cw.pages[i].cards) === J(x.cards)),
    () => `C2 ${label}: the plan's cardsWritten names every page and its cards as written: plan ${J(cw || null).slice(0, 900)}, written ${J(w)}`);
  return cw; };
// C3: the approval page's list (pagesWritten), read back from the written files
const approvalPages = (dir) => { const top = path.join(ROOT, dir);
  return pagesWritten(walk(path.join(top, 'TL.Report')).map((f) => ({ path: path.relative(top, f).split(path.sep).join('/'), data: fs.readFileSync(f, 'utf8') }))); };
const sameApproval = (label, dir, w) => { const PW = approvalPages(dir);
  chk(() => PW.length === w.length && w.every((x, i) => J((PW[i].cards || []).map((c) => c.shows.join(', '))) === J(x.cards) && (PW[i].messageCards || 0) === x.messages),
    () => `C3 ${label}: the approval page's list holds the written cards, page by page: ${J(PW.map((p) => [p.name, p.cards, p.messageCards]))} vs ${J(w)}`); };
try {
  const PF = { measure: 'Sales[Total Sales]', timeAxis: 'Sales[FiscalYear]', category: 'Sales[Qtr]', category2: 'المبيعات[شهر]' };
  // ---------- C1-C3: the pinned input ----------
  {
    const { pl, made, w } = await run('c1', { layout: 'exec', kpis: 0, planFields: PF });
    chk(() => made && !made.err && w.length === 4, () => `C1 setup: planned, approved and written, 4 pages: ${J(made || pl).slice(0, 400)}`);
    const report = w.filter((x) => !x.tooltip), tips = w.filter((x) => x.tooltip);
    console.log(`  the pinned input: ${w.map((x) => `${x.page}${x.tooltip ? ' (tooltip)' : ''} ${x.cards.length} cards`).join('; ')}`);
    chk(() => report.length === 2 && report.every((x) => !x.cards.length), () => `C1 kpis 0: no card on the first page's top row or the designed second page: ${J(report)}`);
    chk(() => tips.length === 2 && tips.every((x) => J(x.cards) === J(['Sales[Total Sales]'])), () => `C1 each tooltip page holds its own card, Sales[Total Sales] (as before): ${J(tips)}`);
    const cw = samePages('the pinned input', pl, w);
    chk(() => cw && cw.kpis === 0 && /kpis 0 writes no KPI card on the report pages/.test(cw.sayInPlan) && /each tooltip page's own card shows the measure at the point a reader hovers, whatever kpis is/.test(cw.sayInPlan),
      () => `C2 the pinned input: sayInPlan says no KPI card and each tooltip page's own card: ${cw && cw.sayInPlan}`);
    sameApproval('the pinned input', 'c1', w);
    chk(() => !/"truncated"/.test(pl.t || ''), () => 'C5 the pinned input: the plan answer is not cut');
  }
  // ---------- C4: kpis 3 (unchanged) ----------
  {
    const { pl, made, w } = await run('c4', { layout: 'exec', kpis: 3, planFields: PF });
    const report = w.filter((x) => !x.tooltip), tips = w.filter((x) => x.tooltip), two = ['Sales[Total Sales]', 'المبيعات[إجمالي المبيعات]'];
    chk(() => made && !made.err && report.length === 2 && report.every((x) => J(x.cards) === J(two)), () => `C4 kpis 3: the first page's top row and the second page each show the model's 2 measures (as before): ${J(report)}`);
    chk(() => tips.length === 2 && tips.every((x) => J(x.cards) === J(['Sales[Total Sales]'])), () => `C4 kpis 3: each tooltip page keeps its own card: ${J(tips)}`);
    const cw = samePages('kpis 3', pl, w);
    chk(() => cw && cw.kpis === 3 && /the KPI cards/.test(cw.sayInPlan) && !/no KPI card/.test(cw.sayInPlan), () => `C4 kpis 3: sayInPlan says the KPI cards: ${cw && cw.sayInPlan}`);
    sameApproval('kpis 3', 'c4', w);
  }
  // ---------- C5: another layout, kpis 0 ----------
  {
    const { pl, made, w } = await run('c5', { layout: 'analysis', kpis: 0, planFields: PF });
    chk(() => made && !made.err && w.filter((x) => !x.tooltip).every((x) => !x.cards.length) && w.filter((x) => x.tooltip).length === 2, () => `C5 analysis, kpis 0: no card on a report page, the 2 tooltip pages: ${J(w)}`);
    samePages('analysis, kpis 0', pl, w);
    chk(() => !/"truncated"/.test(pl.t || ''), () => 'C5 analysis: the plan answer is not cut');
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.2-pf2.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1500))); console.log(`FAIL  pf2  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  pf2  ${checks} checks`);
