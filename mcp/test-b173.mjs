// 0.2.9.1, B-173: the Arabic twin listed a table header as cut that Power BI Desktop draws whole, and check_report said
// nothing about a header Desktop does cut. Measured on the laptop (19 Oct 2026, Power BI Desktop 2.159, the golden twin
// "Teal Exec" on a made-up model, 1920 x 1080): our measure gave both Arabic headers 275 at the summary table's 10pt and
// 400 at the details table's 15pt; Desktop drew "Total Value" whole in 208 and 292, and cut "Total Score" in 181 and 260.
//   H-1: one measure of a table header (report-rules.js headerNeed: the bold text + 24 a page of 1080 high, as the writer's
//        cellRoom), with the band Desktop showed: under the share of it Desktop has drawn an Arabic header whole in, the
//        header is cut; from there up to the measure it MAY be cut (the cause of the gap is not known yet)
//   H-2: check_report warns on a cut header (TABLE_HEADER_CUT, as BUTTON_ONE_LINE for buttons) and notes a header that
//        may be cut; it never quotes the header
//   H-3: the twin's plan says "cut" (headersCut) and "may be cut" (headersMayBeCut) by the same function, and
//        check_report on the written twin agrees with it, visual by visual
//   node test-b173.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const Rules = require('../assets/js/report-rules.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lit = (v) => ({ expr: { Literal: { Value: v } } });

// two made-up Arabic headers our measure gives exactly the laptop's numbers: 275 at 10pt, 400 at 15pt (Segoe UI, 1080)
const TV = 'القيمة الإجمالية لطلبات المتاجر', TS = 'مجموعة النقاط الإجمالية للمتاجر';
const AR = /[؀-ۿﭐ-﻿]/;

// a table as the twin writes it: set column widths, headers at t pt, on a 1920 x 1080 page
const tableR = (t, widths, extra) => {
  const ps = [['Web Orders.Total Score', TS], ['Web Orders.Total Value', TV]].map(([q, d]) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Web Orders' } }, Property: q.split('.')[1] } }, queryRef: q, nativeQueryRef: q.split('.')[1], displayName: d }));
  const json = { name: 'tbl', position: { x: 0, y: 0, width: 1000, height: 400 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: ps } } },
    objects: { columnHeaders: [{ properties: Object.assign({ fontSize: lit(t + 'D'), autoSizeColumnWidth: lit('false') }, extra || {}) }],
      columnWidth: ps.map((p, i) => ({ properties: { value: lit(widths[i] + 'D') }, selector: { metadata: p.queryRef } })) } } };
  const x = { name: 'tbl', type: 'tableEx', file: 'definition/pages/p1/visuals/tbl/visual.json', json, page: { id: 'p1', name: 'p1' }, x: 0, y: 0, w: 1000, h: 400 };
  return { pages: [{ id: 'p1', name: 'p1', w: 1920, h: 1080, visuals: [x] }], visuals: [x], textSize: 12, labelSize: 10, slicerSize: 10, font: 'Segoe UI', theme: null, hasPlatform: true };
};
const found = (R) => Rules.check(R, { groups: ['sizes'] }).findings.filter((f) => f.rule === 'TABLE_HEADER_CUT');

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-b173-'));
fs.cpSync(path.join(REPO, 'mcp/test-models/large-synthetic/Large Synthetic.SemanticModel'), path.join(ROOT, 'large/Large Synthetic.SemanticModel'), { recursive: true });
const s = await serverClient(ROOT, {});

try {
  // ---------- H-1: one measure, with the band Desktop showed ----------
  chk(() => typeof Rules.headerNeed === 'function', () => 'H-1. report-rules.js has headerNeed, the one measure of a table header (the twin and check_report)');
  const hn = (...a) => (typeof Rules.headerNeed === 'function' ? Rules.headerNeed(...a) : {}), n10 = hn(TS, 10, 'Segoe UI', 1), n15 = hn(TV, 15, 'Segoe UI', 1);
  chk(() => n10.needW === 275 && hn(TV, 10, 'Segoe UI', 1).needW === 275 && n15.needW === 400, () => `H-1. the measure is the writer's (bold text + 24 at 1080): 275 at 10pt, 400 at 15pt, as the laptop read: ${JSON.stringify([n10, n15])}`);
  // the band's lower edge: the laptop's whole headers (208 of 275, 292 of 400) are not called cut; its cut ones (181, 260) are
  chk(() => n10.lowW <= 208 && n10.lowW > 181 && n15.lowW <= 292 && n15.lowW > 260, () => `H-1. Desktop drew an Arabic header whole in 208 (of 275) and 292 (of 400), and cut one in 181 and 260: the "cut" edge lies between: ${JSON.stringify([n10, n15])}`);
  chk(() => { const l = hn('Total Value', 10, 'Segoe UI', 1); return l.needW > 0 && l.lowW === l.needW; }, () => 'H-1. a Latin header has no band (its letters were measured on the safe side): cut below its measure');

  // ---------- H-2: check_report warns on a cut header, notes one that may be cut ----------
  for (const [t, cut, may] of [[10, 181, 208], [15, 260, 292]]) {
    const f = found(tableR(t, [cut, may]));
    const w = f.filter((x) => x.severity === 'warning'), nt = f.filter((x) => x.severity === 'note');
    chk(() => w.length === 1 && new RegExp(`\\b${cut}\\b`).test(w[0].what) && new RegExp(`\\b${t === 10 ? 275 : 400}\\b`).test(w[0].what) && /cut/i.test(w[0].fix), () => `H-2. ${t}pt: the header in ${cut} wide is a TABLE_HEADER_CUT warning (its width, its need, the fix): ${JSON.stringify(f)}`);
    chk(() => nt.length === 1 && new RegExp(`\\b${may}\\b`).test(nt[0].what) && /may be cut/i.test(nt[0].what) && /Desktop/.test(nt[0].what), () => `H-2. ${t}pt: the header in ${may} wide is a note that it may be cut, with the reason (what Desktop drew): ${JSON.stringify(f)}`);
    chk(() => f.every((x) => !AR.test(x.what + x.fix)), () => `H-2. a finding never quotes the header: ${JSON.stringify(f)}`);
  }
  chk(() => !found(tableR(10, [275, 300])).length, () => `H-2. a column as wide as its header's measure: nothing to say: ${JSON.stringify(found(tableR(10, [275, 300])))}`);
  chk(() => !found(tableR(10, [181, 208], { wordWrap: lit('true') })).length, () => 'H-2. headers set to wrap (columnHeaders.wordWrap true) are not cut: nothing to say');

  // ---------- H-3: the twin's plan and check_report on the twin, by the same measure ----------
  const pl = await s.call('plan_layout', { path: 'large', focus: 'Web Orders', name: 'Golden', layout: 'exec' });
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const made = await s.call('create_report', { path: 'large', focus: 'Web Orders', name: 'Golden', planId: pl.j.plan.planId, design: pl.j.design });
  chk(() => !made.err, () => `setup. the golden report is written: ${short(made)}`);
  const ck0 = await s.call('check_report', { path: 'large/Golden.Report' });
  chk(() => !ck0.err && !(ck0.j.findings || []).some((f) => f.rule === 'TABLE_HEADER_CUT'), () => `H-3. the English golden report: no header cut (the writer gives each column its header): ${ck0.err ? ck0.t : JSON.stringify((ck0.j.findings || []).filter((f) => f.rule === 'TABLE_HEADER_CUT'))}`);
  const p0 = await s.call('create_arabic_twin', { path: 'large/Golden.Report' });
  const labels = Object.fromEntries(((p0.j && p0.j.texts) || []).filter((t) => t.text != null).map((t) => [t.id, /Total Score/.test(t.text) ? TS : /Total Value/.test(t.text) ? TV : t.draftArabic || 'نص']));
  const p1 = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels });
  const F = (!p1.err && p1.j.fitted) || {}, cut = F.headersCut || [], may = F.headersMayBeCut || [];
  chk(() => cut.length + may.length >= 1, () => `H-3 setup. the twin's plan lists headers it can't widen enough: ${p1.err ? p1.t : JSON.stringify(F)}`);
  chk(() => cut.every((h) => h.lowW != null && h.width < h.lowW && /cuts/.test(h.why)) && may.every((h) => h.width >= h.lowW && h.width < h.needs && /may cut/.test(h.why) && /Desktop/.test(h.why)), () => `H-3. the plan's "cut" are under the band, its "may be cut" in it, each with why: ${JSON.stringify({ cut, may })}`);
  await s.call('approve_plan', { planId: p1.j.plan.planId });
  const tw = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels, planId: p1.j.plan.planId });
  chk(() => !tw.err && tw.j.written, () => `setup. the twin is written: ${short(tw)}`);
  const ck = await s.call('check_report', { path: 'large/Golden AR.Report' });
  const hf = (!ck.err && (ck.j.findings || []).filter((f) => f.rule === 'TABLE_HEADER_CUT')) || [];
  const key = (page, visual) => page + '/' + visual;
  const planW = cut.map((h) => key(h.page, h.visual)).sort(), planN = may.map((h) => key(h.page, h.visual)).sort();
  const ckW = hf.filter((f) => f.severity === 'warning').map((f) => key(f.page.id, f.visual.name)).sort(), ckN = hf.filter((f) => f.severity === 'note').map((f) => key(f.page.id, f.visual.name)).sort();
  chk(() => JSON.stringify(planW) === JSON.stringify(ckW) && JSON.stringify(planN) === JSON.stringify(ckN), () => `H-3. check_report on the twin says what the plan said, header by header (warnings = headersCut, notes = headersMayBeCut): plan ${JSON.stringify({ planW, planN })} | check_report ${JSON.stringify({ ckW, ckN })}`);

  // H-2 through the tool, at the laptop's exact widths: a copy of the twin whose summary table has its headers at 10pt,
  // "Total Score" in 181 and "Total Value" in 208
  {
    fs.cpSync(path.join(ROOT, 'large/Golden AR.Report'), path.join(ROOT, 'large/Exact.Report'), { recursive: true });
    fs.writeFileSync(path.join(ROOT, 'large/Exact.pbip'), fs.readFileSync(path.join(ROOT, 'large/Golden AR.pbip'), 'utf8'));
    const pages = rd(path.join(ROOT, 'large/Exact.Report/definition/pages/pages.json')).pageOrder;
    const vf = tree(path.join(ROOT, 'large/Exact.Report/definition/pages', pages[0])).find((f) => /visual\.json$/.test(f) && rd(f).visual && rd(f).visual.visualType === 'tableEx');
    const v = rd(vf), o = v.visual.objects, ps = v.visual.query.queryState.Values.projections;
    o.columnHeaders = [{ properties: { fontSize: lit('10D'), autoSizeColumnWidth: lit('false') } }];
    const setW = (ref, w) => { const e = o.columnWidth.find((x) => x.selector && x.selector.metadata === ref); e.properties.value = lit(w + 'D'); };
    ps.forEach((p) => { if (/Total Score/.test(p.queryRef)) { p.displayName = TS; setW(p.queryRef, 181); } else if (/Total Value/.test(p.queryRef)) { p.displayName = TV; setW(p.queryRef, 208); } else setW(p.queryRef, 400); });
    fs.writeFileSync(vf, JSON.stringify(v, null, 2));
    const ce = await s.call('check_report', { path: 'large/Exact.Report' });
    const mine = (!ce.err && (ce.j.findings || []).filter((f) => f.rule === 'TABLE_HEADER_CUT' && f.visual && f.visual.name === v.name)) || [];
    chk(() => mine.filter((f) => f.severity === 'warning').length === 1 && /\b181\b/.test(mine.find((f) => f.severity === 'warning').what), () => `H-2. check_report: the header in 181 is a warning: ${ce.err ? ce.t : JSON.stringify(mine)}`);
    chk(() => mine.filter((f) => f.severity === 'note').length === 1 && /\b208\b/.test(mine.find((f) => f.severity === 'note').what) && /may be cut/.test(mine.find((f) => f.severity === 'note').what), () => `H-2. check_report: the header in 208 may be cut (a note): ${ce.err ? ce.t : JSON.stringify(mine)}`);
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

console.log(problems.length ? `FAIL  b173  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  b173  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
