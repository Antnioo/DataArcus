// 0.3.1 CS1 (the owner, 26 Oct: a hand-made report, "making sure all are identical not one visual have a font and the
// other not"): each visual's own text settings (lib/text-format.mjs), check_report's FORMAT_MIXED, and the redesign's
// consistentText (lib/redesign.mjs): every listed visual's own font family, size, bold and italic removed so the theme
// governs, the theme's textClasses given the text set (a theme file added when the report has none), keepPositions.
// Written red first (0cbb017: no inventory, no option, no FORMAT_MIXED). The report: mcp/lab/consistency-lab.mjs (made
// up, Microsoft's validator 0 errors); the plan, the removals and the expected numbers: mcp/work/CS1.md.
//   T1  the inventory: a visual's own settings, by class, object and property; a selector or an expression is kept
//   T2  FORMAT_MIXED: one note per mixed page and one for the report, the counts; none on a report without overrides
//   T3  the plan (consistentText "report"): the text set (most visuals' value), 37 removals listed per visual, untouched
//       visuals with why (text box, shape, the group's visual)
//   T4  the write: the overrides gone, nothing else of them; the theme added (no theme file) and registered; every
//       other file byte-identical; the original byte-identical
//   T5  positions: the grid by default; keepPositions: no position changes at all
//   T6  a report with its own theme: only its visual styles' role font and size change (CS2; textClasses before), no
//       file added
//   T7  consistentText "theme": no theme write; the removals the same
//   T8  a visual type CS1 does not know: untouched (byte-identical) and listed
//   T9  verifyCopy refuses: a removal outside the allowlist, one not in the plan, report.json changed (not added), an
//       added file the plan does not add
//   T10 metadata only: no title, text box text or value in any answer; the approval page lists the text set and removals
//   T11 the gate: create_report without the plan's consistentText writes nothing
//   node test-0.3.1-cs1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { serverClient } from './test-0.2.9.mjs';
import { writeLab } from './lab/consistency-lab.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rels = (d) => tree(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const print = (d) => rels(d).map((r) => r + ':' + sha(fs.readFileSync(path.join(d, r)))).join('\n');
const get = (url) => new Promise((resolve) => { http.get(url, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }).on('error', () => resolve('')); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diff = (a, b, at = '') => {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a === undefined && b && typeof b === 'object') return Object.keys(b).flatMap((k) => diff(undefined, b[k], at + '/' + k));
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) return [...new Set(Object.keys(a).concat(Object.keys(b)))].flatMap((k) => diff(a[k], b[k], at + '/' + k));
  return [at];
};
const P1 = 'a1b2c3d4e5f6a7b8c9d0', P2 = 'b2c3d4e5f6a7b8c9d0e1', MODEL = 'Gulf Retail.SemanticModel', FROM = 'Store Ops.pbip';
const vfile = (rep, pg, v) => path.join(rep, 'definition/pages', pg, 'visuals', v, 'visual.json');
// the texts a person typed in the lab report (titles, the text box): never in an answer
const TYPED = ['Sales by branch', 'Sales by month', 'Total sales', 'Average basket', 'Units by product', 'Sales by channel', 'Store operations', 'Units sold'];
// the lab's own settings (lab/consistency-lab.mjs): 24 on Overview, 13 on Details (counted by hand, CS1.md)
const REMOVALS = 37;

const ROOTS = [];
const lab = async (opts) => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cs1-')); ROOTS.push(d); fs.rmSync(d, { recursive: true }); return writeLab(d, opts); };
const answers = [];
let T = null, lib = null;
try { T = await import('./lib/text-format.mjs'); lib = await import('./lib/redesign.mjs'); } catch (e) { T = null; }
try {
  // ---------- T1: the inventory ----------
  const L = await lab();
  const REP = path.join(L.root, 'Store Ops.Report'), ORIG = print(REP);
  chk(() => T && typeof T.visualText === 'function', () => 'T1. lib/text-format.mjs reads a visual\'s own text settings (visualText)');
  if (T) {
    const col = T.visualText(rd(vfile(REP, P1, 'colBranch'))), at = (o) => `${o.cls} ${o.object} ${o.property} ${o.value}`;
    chk(() => JSON.stringify(col.overrides.map(at).sort()) === JSON.stringify(['largeTitle title bold true', 'largeTitle title fontFamily Segoe UI Semibold', 'largeTitle title fontSize 14', 'lightLabel categoryAxis fontSize 11', 'lightLabel legend fontSize 9']),
      () => `T1. the column chart's own settings, by class, object, property and value: ${JSON.stringify(col.overrides.map(at))}`);
    chk(() => col.overrides.every((o) => o.pointer.startsWith('/visual/') && /\/properties\/(fontSize|fontFamily|bold)$/.test(o.pointer)), () => `T1. each by its pointer: ${JSON.stringify(col.overrides.map((o) => o.pointer))}`);
    const sl = T.visualText(rd(vfile(REP, P1, 'slBranch')));
    chk(() => JSON.stringify(sl.overrides.map(at).sort()) === JSON.stringify(['lightLabel items textSize 10', 'title header fontFamily Segoe UI Bold', 'title header textSize 12']), () => `T1. the slicer: header (title class, textSize) and items: ${JSON.stringify(sl.overrides.map(at))}`);
    const j = rd(vfile(REP, P1, 'cardSales')); j.visual.objects.labels.push({ selector: { metadata: 'Sales.Total Sales' }, properties: { fontSize: { expr: { Literal: { Value: '30D' } } } } });
    j.visual.objects.categoryLabels[0].properties.fontFamily = { expr: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } } };
    const cs = T.visualText(j);
    chk(() => cs.kept.length === 2 && cs.kept.some((k) => /selector/.test(k.why)) && cs.kept.some((k) => /expression/.test(k.why)) && cs.overrides.length === 3, () => `T1. a setting for one field (a selector) and one from an expression are kept, not removed: ${JSON.stringify(cs)}`);
    // (the full run's fuzz case 161: a visual's properties that are not an object crashed check_report)
    chk(() => [{ visual: { visualType: 'card', objects: { labels: [{ properties: 'x' }, null, 7, { properties: [1] }], categoryLabels: 'y' }, visualContainerObjects: { title: [{ properties: { fontSize: 'z' } }] } } }, { visual: 'v' }, null, 3]
      .every((j) => { const t = T.visualText(j); return Array.isArray(t.overrides) && t.overrides.length === 0; }) && T.mixedOf(T.countsOf([{ json: { visual: { visualType: 'card', objects: { labels: [{ properties: 5 }] } } } }], { textClasses: 'x', visualStyles: 3 })).length === 0,
      () => 'T1. a visual whose settings are not objects (a broken file) is read without a crash, nothing taken from it');
    chk(() => T.visualText(rd(vfile(REP, P1, 'header'))).overrides.length === 0 && T.KNOWN_TYPES.has('pivotTable') && !T.KNOWN_TYPES.has('textbox') && !T.KNOWN_TYPES.has('cardVisual'), () => 'T1. a text box has no roles; the known types are the native ones of the table');
  }

  // ---------- T2: FORMAT_MIXED ----------
  const s = await serverClient(L.root, {});
  const call = async (srv, name, args) => { const r = await srv.call(name, args); answers.push(r.t); return r; };
  try {
    const ck = await call(s, 'check_report', { path: FROM });
    const fm = ((ck.j || {}).findings || []).filter((f) => f.rule === 'FORMAT_MIXED');
    chk(() => fm.length === 3 && fm.filter((f) => f.page).length === 2 && fm.every((f) => f.severity === 'note' && f.impact === 'dataarcusRule'), () => `T2. one FORMAT_MIXED note per mixed page and one for the report: ${JSON.stringify(fm)}`);
    const rep = fm.find((f) => !f.page) || {};
    chk(() => /visual titles: 4 at 14pt, 3 at the theme's, 2 at 11pt, 1 at 12pt; 8 in the theme's, 2 in Segoe UI Semibold/.test(rep.what) && /3 visuals set bold or italic of their own/.test(rep.what) && /1 in Arial/.test(rep.what),
      () => `T2. the report's counts (titles: 4 at 14pt, 3 the theme's, 2 at 11pt, 1 at 12pt; 2 in Segoe UI Semibold; Arial once; 3 bold or italic): ${rep.what}`);
    chk(() => /consistentText/.test(rep.fix || '') && (ck.j.counts.byRule.FORMAT_MIXED === 3), () => `T2. the fix names consistentText: ${rep.fix}`);
    const tw = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-cs1-twin-')); ROOTS.push(tw);
    fs.cpSync(new URL('./fixtures/twin-project', import.meta.url), tw, { recursive: true });
    const s2 = await serverClient(tw, {});
    try { const c2 = await call(s2, 'check_report', { path: 'Twin Sales.pbip' }); chk(() => !c2.err && !(c2.j.counts.byRule || {}).FORMAT_MIXED, () => `T2. none on a report whose visuals set no font or size of their own: ${JSON.stringify(c2.j && c2.j.counts)}`); }
    finally { await s2.close(); }

    // ---------- T3: the plan ----------
    const pl = await call(s, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report' });
    const R = (pl.j && pl.j.redesign) || {}, X = R.text || {}, set = Object.fromEntries((X.set || []).map((x) => [x.class, x]));
    chk(() => !pl.err && pl.j.plan && pl.j.plan.planId, () => `T3. a plan id: ${short(pl)}`);
    chk(() => X.mode === 'report' && set.largeTitle.size === '14pt' && set.largeTitle.font === 'the theme\'s' && set.label.size === '10pt' && set.callout.size === 'the theme\'s', () => `T3. the text set: titles 14pt (4 of 10 show it), table text 10pt (tie with 11: the smaller), card values the theme's: ${JSON.stringify(X.set)}`);
    chk(() => X.removed === REMOVALS, () => `T3. ${REMOVALS} settings removed: ${X.removed}`);
    const listed = (R.pages || []).flatMap((p) => p.changes).flatMap((c) => (c.text || []).map((t) => [c.visual, t.class, t.property, t.from, t.to].join(' ')));
    chk(() => listed.length === REMOVALS && listed.includes('cardOrders largeTitle fontSize 11pt 14pt') && listed.includes('lineMonth lightLabel fontFamily Arial the theme\'s') && listed.includes('tblProducts label bold bold the theme\'s'),
      () => `T3. every removal listed with its visual (class, property, from -> to): ${listed.length} ${JSON.stringify(listed.slice(0, 8))}`);
    chk(() => (X.untouched || []).some((u) => u.visual === 'header' && /text box/.test(u.why)) && (X.untouched || []).some((u) => u.visual === 'band' && /shape/.test(u.why)) && (X.untouched || []).some((u) => u.visual === 'cardUnits' && /group/.test(u.why)),
      () => `T3. the text box, the shape and the group's card are untouched, with why: ${JSON.stringify(X.untouched)}`);
    chk(() => /adds DataArcusText\.json/.test(X.theme) && R.checks && R.checks.filesAdded === 1 && R.checks.onlyAllowlisted, () => `T3. no theme file: the copy adds one (checked at the plan): ${X.theme} ${JSON.stringify(R.checks)}`);

    // ---------- T4: the write ----------
    await call(s, 'approve_plan', { planId: pl.j.plan.planId });
    const w = await call(s, 'create_report', { path: MODEL, redesignFrom: FROM, planId: pl.j.plan.planId, consistentText: 'report' });
    const OUT = path.join(L.root, 'Store Ops redesigned.Report');
    chk(() => !w.err && w.j.written === true, () => `T4. the copy is written: ${short(w)}`);
    chk(() => print(REP) === ORIG, () => 'T4. the original is byte-identical');
    if (T && fs.existsSync(OUT)) {
      const eligible = [[P1, 'cardSales'], [P1, 'cardOrders'], [P1, 'cardBasket'], [P1, 'slBranch'], [P1, 'colBranch'], [P1, 'lineMonth'], [P1, 'tblProducts'], [P2, 'mxBranch'], [P2, 'barProduct'], [P2, 'donutChannel']];
      chk(() => eligible.every(([pg, v]) => T.visualText(rd(vfile(OUT, pg, v))).overrides.length === 0), () => `T4. no listed visual keeps a font, size, bold or italic of its own: ${eligible.filter(([pg, v]) => T.visualText(rd(vfile(OUT, pg, v))).overrides.length).map(([, v]) => v)}`);
      // nothing else in them changed but the removed properties and the position
      const off = eligible.flatMap(([pg, v]) => diff(rd(vfile(REP, pg, v)), rd(vfile(OUT, pg, v))).filter((p) => !/^\/position\/(x|y|width|height)$/.test(p) && !T.TEXT_POINTER.test(p)).map((p) => v + p));
      chk(() => off.length === 0, () => `T4. nothing else in the visuals changed: ${JSON.stringify(off)}`);
      chk(() => rd(vfile(OUT, P1, 'lineMonth')).visual.objects.labels[0].properties.show && rd(vfile(OUT, P1, 'colBranch')).visual.visualContainerObjects.title[0].properties.text, () => 'T4. a removed font leaves its object\'s other settings (labels shown, the title\'s text)');
      const th = path.join(OUT, 'StaticResources/RegisteredResources/DataArcusText.json'), rj = rd(path.join(OUT, 'definition/report.json'));
      // (CS2: the text set is written as visual styles, where Desktop draws it; no text classes: test-0.3.1-cs2.mjs)
      chk(() => fs.existsSync(th) && JSON.stringify(rd(th).visualStyles.card['*'].title) === '[{"fontSize":14}]' && JSON.stringify(rd(th).visualStyles.tableEx['*'].values) === '[{"fontSize":10}]' && Object.keys(rd(th)).join() === 'name,visualStyles',
        () => `T4. the added theme holds the text set alone: ${fs.existsSync(th) ? fs.readFileSync(th, 'utf8') : 'missing'}`);
      chk(() => rj.themeCollection.customTheme.name === 'DataArcusText.json' && rj.themeCollection.customTheme.type === 'RegisteredResources' && rj.resourcePackages.some((p) => p.type === 'RegisteredResources' && p.items.some((i) => i.name === 'DataArcusText.json' && i.type === 'CustomTheme')),
        () => `T4. report.json names it: ${JSON.stringify(rj)}`);
      const same = rels(REP).filter((r) => !/visual\.json$/.test(r) && r !== 'definition/report.json' && r !== '.platform');
      chk(() => same.every((r) => fs.readFileSync(path.join(REP, r)).equals(fs.readFileSync(path.join(OUT, r)))) && ['header', 'band'].every((v) => fs.readFileSync(vfile(REP, P1, v)).equals(fs.readFileSync(vfile(OUT, P1, v)))) && ['grpNote', 'cardUnits'].every((v) => fs.readFileSync(vfile(REP, P2, v)).equals(fs.readFileSync(vfile(OUT, P2, v)))),
        () => 'T4. every other file byte-identical: the pages, the model\'s pbir, the text box, the shape, the group and its card');
      chk(() => JSON.stringify(rels(OUT)) === JSON.stringify(rels(REP).concat('StaticResources/RegisteredResources/DataArcusText.json').sort()), () => `T4. the copy has every file of the original and the theme: ${rels(OUT)}`);
      // ---------- T5: positions (the grid by default) ----------
      chk(() => diff(rd(vfile(REP, P1, 'colBranch')).position, rd(vfile(OUT, P1, 'colBranch')).position).length > 0, () => 'T5. by default the visuals are placed on the grid, as a redesign does');
    }
    const ck2 = await call(s, 'check_report', { path: 'Store Ops redesigned.pbip', checks: ['validator', 'theme'] });
    chk(() => !ck2.err && ck2.j.validator.errors === 0 && !(ck2.j.counts.byRule || {}).FORMAT_MIXED, () => `T4. the copy: Microsoft's validator 0 errors, no FORMAT_MIXED: ${JSON.stringify(ck2.j && [ck2.j.validator, ck2.j.counts])}`);

    // ---------- T11: the gate ----------
    const L2 = await lab(), s3 = await serverClient(L2.root, {});
    try {
      const p2 = await call(s3, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report', keepPositions: true });
      await call(s3, 'approve_plan', { planId: p2.j.plan.planId });
      const no = await call(s3, 'create_report', { path: MODEL, redesignFrom: FROM, planId: p2.j.plan.planId });
      chk(() => no.err && /Nothing was written/.test(no.t) && !fs.existsSync(path.join(L2.root, 'Store Ops redesigned.Report')), () => `T11. create_report without the plan's consistentText writes nothing: ${short(no)}`);
      // ---------- T5: keepPositions ----------
      const pk = (p2.j.redesign.patches || []);
      chk(() => !pk.some((x) => /^\/position\//.test(x.pointer || '')) && (p2.j.redesign.pages || []).every((p) => p.changes.every((c) => !c.from)) && p2.j.redesign.text.removed === REMOVALS,
        () => `T5. keepPositions: no position patch, no move; the same ${REMOVALS} removals: ${JSON.stringify(pk.filter((x) => /position/.test(x.pointer || '')).slice(0, 3))}`);
      const p3 = await call(s3, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report', keepPositions: true });
      await call(s3, 'approve_plan', { planId: p3.j.plan.planId });
      const w3 = await call(s3, 'create_report', { path: MODEL, redesignFrom: FROM, planId: p3.j.plan.planId, consistentText: 'report', keepPositions: true });
      const R2 = path.join(L2.root, 'Store Ops.Report'), O2 = path.join(L2.root, 'Store Ops redesigned.Report');
      chk(() => !w3.err && rels(R2).filter((r) => /visual\.json$/.test(r)).every((r) => JSON.stringify(rd(path.join(R2, r)).position) === JSON.stringify(rd(path.join(O2, r)).position)), () => `T5. keepPositions writes every position as it was: ${short(w3)}`);
      // ---------- T7: consistentText "theme" ----------
      const L3 = await lab(), s4 = await serverClient(L3.root, {});
      try {
        const p4 = await call(s4, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'theme', keepPositions: true });
        const X4 = (p4.j && p4.j.redesign && p4.j.redesign.text) || {};
        chk(() => p4.j.plan && X4.removed === REMOVALS && X4.set.every((x) => x.font === 'the theme\'s' && x.size === 'the theme\'s') && /not changed/.test(X4.theme) && !p4.j.redesign.patches.some((x) => x.op === 'add' || /report\.json|textClasses/.test(String(x.file) + x.pointer)),
          () => `T7. "theme": the same removals, no theme write, no file added: ${JSON.stringify([X4.set, X4.theme, X4.removed])}`);
        // ---------- T8: a visual type CS1 does not know ----------
        const f = vfile(path.join(L3.root, 'Store Ops.Report'), P1, 'cardBasket'), j = rd(f);
        j.visual.visualType = 'cardVisual'; j.visual.visualContainerObjects = { title: [{ properties: { fontSize: { expr: { Literal: { Value: '15D' } } } } }] }; fs.writeFileSync(f, JSON.stringify(j, null, 2));
        const p5 = await call(s4, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report', keepPositions: true });
        const u = ((p5.j.redesign.text || {}).untouched || []).find((x) => x.visual === 'cardBasket');
        chk(() => p5.j.plan && u && /does not know/.test(u.why) && /cardVisual/.test(u.why) && !p5.j.redesign.patches.some((x) => x.visual === 'cardBasket'), () => `T8. an unknown visual type: untouched and listed: ${JSON.stringify(u)}`);
        await call(s4, 'approve_plan', { planId: p5.j.plan.planId });
        await call(s4, 'create_report', { path: MODEL, redesignFrom: FROM, planId: p5.j.plan.planId, consistentText: 'report', keepPositions: true });
        chk(() => fs.readFileSync(f).equals(fs.readFileSync(vfile(path.join(L3.root, 'Store Ops redesigned.Report'), P1, 'cardBasket'))), () => 'T8. its file is byte-identical in the copy');
      } finally { await s4.close(); }
    } finally { await s3.close(); }

    // ---------- T6: a report with its own theme ----------
    const L4 = await lab({ theme: true }), s5 = await serverClient(L4.root, {});
    try {
      const p6 = await call(s5, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report' });
      await call(s5, 'approve_plan', { planId: p6.j.plan.planId });
      const w6 = await call(s5, 'create_report', { path: MODEL, redesignFrom: FROM, planId: p6.j.plan.planId, consistentText: 'report' });
      const TR = 'StaticResources/RegisteredResources/store-ops-theme.json', A = path.join(L4.root, 'Store Ops.Report'), B = path.join(L4.root, 'Store Ops redesigned.Report');
      const d6 = fs.existsSync(path.join(B, TR)) ? diff(rd(path.join(A, TR)), rd(path.join(B, TR))) : ['missing'];
      chk(() => !w6.err && d6.length && d6.every((p) => lib.THEME_STYLE_AT.test(p)) && d6.includes('/visualStyles/card/*/title/0/fontSize'), () => `T6. the report's theme: only its visual styles' font and size (CS2): ${JSON.stringify(d6)} ${short(w6)}`);
      chk(() => fs.readFileSync(path.join(A, 'definition/report.json')).equals(fs.readFileSync(path.join(B, 'definition/report.json'))) && !fs.existsSync(path.join(B, 'StaticResources/RegisteredResources/DataArcusText.json')) && /store-ops-theme\.json: the text set is written as its visual styles/.test(p6.j.redesign.text.theme),
        () => 'T6. report.json byte-identical, no file added');
    } finally { await s5.close(); }

    // ---------- T10: the approval page ----------
    const log = path.join(L.root, 'links.txt'), wsrv = await serverClient(L.root, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
    try {
      fs.rmSync(path.join(L.root, 'Store Ops redesigned.Report'), { recursive: true, force: true }); fs.rmSync(path.join(L.root, 'Store Ops redesigned.pbip'), { force: true });
      const pw = await call(wsrv, 'plan_layout', { path: MODEL, redesignFrom: FROM, consistentText: 'report' });
      await call(wsrv, 'approve_plan', { planId: pw.j.plan.planId });
      let link = ''; for (let k = 0; k < 100 && !link; k++) { await sleep(50); link = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean)[0] || '' : ''; }
      const page = await get(link); answers.push(page);
      chk(() => /Text set/.test(page) && /visual titles/.test(page) && /14pt/.test(page) && /Settings removed/.test(page) && /37/.test(page), () => `T10. the approval page shows the text set and the count removed: ${page.slice(0, 600)}`);
      chk(() => /its own text settings removed/.test(page) && /largeTitle fontSize 11pt -&gt; 14pt|largeTitle fontSize 11pt -> 14pt/.test(page) && /DataArcusText\.json/.test(page), () => 'T10. each removal listed with its visual (largeTitle fontSize 11pt -> 14pt), and the theme added');
    } finally { await wsrv.close(); }
  } finally { await s.close(); }

  // ---------- T9: verifyCopy refuses ----------
  if (lib) {
    const src = { 'definition/pages/p/visuals/v/visual.json': Buffer.from(JSON.stringify({ name: 'v', position: { x: 0, y: 0, width: 10, height: 10 }, visual: { visualType: 'clusteredColumnChart', objects: { dataPoint: [{ properties: { fill: { solid: { color: '#000' } } } }], legend: [{ properties: { fontSize: { expr: { Literal: { Value: '9D' } } } } }] } } })),
      'definition/report.json': Buffer.from(JSON.stringify({ themeCollection: { customTheme: { name: 'a.json', type: 'RegisteredResources' } } })), 'StaticResources/RegisteredResources/a.json': Buffer.from('{"name":"a"}') };
    const V = 'definition/pages/p/visuals/v/visual.json', J = (x) => JSON.parse(Buffer.from(x).toString()), B = (j) => Buffer.from(JSON.stringify(j, null, 2));
    const refuse = (out, patches, re) => { try { lib.verifyCopy(src, out, patches); return false; } catch (e) { return re.test(e.message); } };
    { const j = J(src[V]); delete j.visual.objects.dataPoint[0].properties.fill; chk(() => refuse(Object.assign({}, src, { [V]: B(j) }), [{ op: 'remove', file: V, pointer: '/visual/objects/dataPoint/0/properties/fill' }], /outside the allowlist/), () => 'T9. a removal outside the text allowlist (a data point\'s colour) is refused'); }
    { const j = J(src[V]); delete j.visual.objects.legend[0].properties.fontSize; chk(() => refuse(Object.assign({}, src, { [V]: B(j) }), [], /not one of the plan's patches/), () => 'T9. a text setting removed without a patch is refused');
      chk(() => { try { return lib.verifyCopy(src, Object.assign({}, src, { [V]: B(j) }), [{ op: 'remove', file: V, pointer: '/visual/objects/legend/0/properties/fontSize' }]).onlyAllowlisted; } catch (e) { return false; } }, () => 'T9. the same removal, planned: accepted'); }
    { const r = J(src['definition/report.json']); r.themeCollection.customTheme.name = 'b.json'; chk(() => refuse(Object.assign({}, src, { 'definition/report.json': B(r) }), [{ file: 'definition/report.json', pointer: '/themeCollection/customTheme', to: r.themeCollection.customTheme }], /already in the original|dangling/), () => 'T9. report.json\'s own theme changed (not added): refused'); }
    chk(() => refuse(Object.assign({}, src, { 'StaticResources/RegisteredResources/x.json': Buffer.from('{}') }), [], /not in the original/), () => 'T9. a file the plan does not add: refused');
  }
  // ---------- T10: metadata only ----------
  chk(() => answers.length > 5 && answers.every((t) => TYPED.every((x) => !String(t).includes(x))), () => `T10. no title or text box text in any answer: ${TYPED.filter((x) => answers.some((t) => String(t).includes(x)))}`);
} catch (e) { checks++; problems.push('stopped: ' + String(e && e.stack || e).slice(0, 400)); }
finally { ROOTS.forEach((d) => fs.rmSync(d, { recursive: true, force: true })); }
if (problems.length) { console.log(`FAIL script=test-0.3.1-cs1.mjs cause=${problems[0].slice(0, 160)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  cs1  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  cs1  ${checks} checks`);
