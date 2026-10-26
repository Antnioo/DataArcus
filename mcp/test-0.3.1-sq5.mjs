// 0.3.1 SQ5 (the owner, 25 Oct, the night run: every "Seen, not in scope" item fixed; written red first): check_report's
// rules, mcp/work/SQ5.md.
//   S12  TOOLTIP_SCROLL counts a tooltip bar chart's rows by the measurement in force (Desktop 2.158, the night of 6-7 Oct:
//        22.2 a row, 45 above the first, 8 under the last, 38 more for the value axis), never round 0's 22 + 46
//   R2   the Tab-order count (report-a11y.js inversions) never counts the writer's own reading order (readingOrder): a
//        tall visual beside two stacked ones; a stop met against the reading order both ways is still counted
//   T7   each finding of the layout check has a plain place (its kind and its third of the page), and the "worth a look"
//        lines use it, never the type and box ("clusteredBarChart at 12,92 296x320") nor a title (R5)
// Made-up boxes and a made-up project in memory only.
//   node test-0.3.1-sq5.mjs
import './test-env.mjs';
import { createRequire } from 'node:module';
import { checkSummary } from './lib/plan-lint.mjs';

const req = createRequire(import.meta.url);
const Rules = req('../assets/js/report-rules.js'), A11y = req('../assets/js/report-a11y.js'), LC = req('../assets/js/layout-check.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const Lv = (v) => ({ expr: { Literal: { Value: v } } });
const col = (t, c) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }), mea = (t, m) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } });

// ---------- S12: a tooltip bar chart's rows ----------
{
  const M = Rules.MEASURED;
  chk(() => M.TIP_ROWS(230) === 7 && M.TIP_ROWS(320) === 12 && M.TIP_ROWS(187) === 6, () => `S12-1. rows without the value axis: floor((h - 45 - 8) / 22.2): 230 -> 7, 320 -> 12, 187 -> 6: ${[M.TIP_ROWS(230), M.TIP_ROWS(320), M.TIP_ROWS(187)]}`);
  chk(() => M.TIP_ROWS(320, true) === 10, () => `S12-2. with the value axis, 38 more (measured): 320 -> 10: ${M.TIP_ROWS(320, true)}`);
  const tipR = (h, opts) => {
    const o = opts || {}, objects = { valueAxis: [{ properties: { show: Lv(o.axis ? 'true' : 'false') } }] };
    if (o.pt) objects.categoryAxis = [{ properties: { fontSize: Lv(o.pt + 'D') } }];
    const filters = o.top ? [{ type: 'TopN', filter: { From: [{ Expression: { Subquery: { Query: { Top: o.top } } } }] } }] : [];
    const x = { name: 'b', type: 'clusteredBarChart', file: 'definition/pages/tip/visuals/b/visual.json', page: { id: 'tip', name: 'tip' }, x: 0, y: 0, w: 320, h,
      json: { name: 'b', position: { x: 0, y: 0, width: 320, height: h }, visual: { visualType: 'clusteredBarChart', objects }, filterConfig: { filters } } };
    return { pages: [{ id: 'tip', name: 'tip', w: 320, h: 400, tooltip: true, visuals: [x] }], visuals: [x], textSize: 12, labelSize: 10, slicerSize: 10, font: 'Segoe UI', theme: null, hasPlatform: true };
  };
  const scroll = (R) => Rules.check(R, { groups: ['tooltips'] }).findings.filter((f) => f.rule === 'TOOLTIP_SCROLL');
  const f8 = scroll(tipR(230, { top: 8 }));
  chk(() => f8.length === 1 && /about 7 rows fit/.test(f8[0].what) && !/\(an estimate/.test(f8[0].what), () => `S12-3. a 230-high tooltip bar chart kept to a Top 8 holds 7 rows: a note (was none: 22 a row + 46 gave 8): ${JSON.stringify(f8)}`);
  chk(() => !scroll(tipR(230, { top: 7 })).length, () => 'S12-4 (guard). kept to a Top 7 it fits: nothing to say');
  const fa = scroll(tipR(320, { axis: true, top: 11 }));
  chk(() => fa.length === 1 && /about 10 rows fit/.test(fa[0].what) && fa[0].severity === 'note' && !/estimate/.test(fa[0].what), () => `S12-5. the value axis on: its 38 measured, not an estimate: ${JSON.stringify(fa)}`);
  const fp = scroll(tipR(230, { pt: 12, top: 8 }));
  chk(() => fp.length === 1 && /an estimate/.test(fp[0].what) && /12pt/.test(fp[0].fix) && /10pt/.test(fp[0].fix), () => `S12-6. labels at another size than the measured 10pt: an estimate that says so: ${JSON.stringify(fp)}`);
  chk(() => f8[0] && /22\.2 a row/.test(f8[0].fix) && !/22 a row \+ 46/.test(f8[0].fix + f8[0].what) && /2026-10-06/.test(f8[0].source) && /laptop sitting/.test(f8[0].source),
    () => `S12-7. its text and source: 22.2 a row + 45 + 8, the night of 6-7 Oct: ${JSON.stringify(f8[0])}`);
  const rule = Rules.RULES.find((r) => r.id === 'TOOLTIP_SCROLL');
  chk(() => /22\.2 a row/.test(rule.about) && /38/.test(rule.about) && !/22 a row plus 46/.test(rule.about), () => `S12-8. the rule's about says the measurement in force: ${rule.about}`);
}

// ---------- R2: the writer's reading order is never a Tab-order finding ----------
{
  const A = { x: 0, y: 0, w: 400, h: 200 }, T = { x: 420, y: 0, w: 400, h: 500 }, B = { x: 0, y: 220, w: 400, h: 200 };
  const ro = A11y.readingOrder([B, T, A], 'ltr');
  chk(() => ro[0] === A && ro[1] === T && ro[2] === B, () => `R2 setup. the writer's order: A, T (the tall one joins A's row), B: ${JSON.stringify(ro)}`);
  chk(() => A11y.inversions([A, T, B], 'ltr') === 0, () => `R2-1. the writer's order A, T, B counts no pair (was 1): ${A11y.inversions([A, T, B], 'ltr')}`);
  chk(() => A11y.inversions([A, B, T], 'ltr') === 0, () => `R2-2 (guard). the left column first, A, B, T: no pair either: ${A11y.inversions([A, B, T], 'ltr')}`);
  // (T, B, A: T before A and B before A are counted; T before B is the writer's own order, as in A, T, B)
  chk(() => A11y.inversions([B, A, T], 'ltr') === 1 && A11y.inversions([T, B, A], 'ltr') === 2, () => `R2-3 (guard). a stop wholly below met first is still counted: B, A, T 1; T, B, A 2: ${[A11y.inversions([B, A, T], 'ltr'), A11y.inversions([T, B, A], 'ltr')]}`);
  // right to left: the same page mirrored (1280 wide)
  const m = (b) => ({ x: 1280 - b.x - b.w, y: b.y, w: b.w, h: b.h }), Am = m(A), Tm = m(T), Bm = m(B);
  const rr = A11y.readingOrder([Bm, Tm, Am], 'rtl');
  chk(() => rr[0] === Am && rr[1] === Tm && A11y.inversions(rr, 'rtl') === 0 && A11y.inversions([Bm, Am, Tm], 'rtl') === 1, () => `R2-4. right to left, mirrored: the writer's order 0, B first 1: ${[A11y.inversions(rr, 'rtl'), A11y.inversions([Bm, Am, Tm], 'rtl')]}`);
  // through check_report's rule: a page whose Tab stops are the writer's order
  const vis = (name, b, tab) => ({ name, type: name === 'T' ? 'tableEx' : 'clusteredColumnChart', file: `definition/pages/p/visuals/${name}/visual.json`, page: { id: 'p', name: 'p' }, parent: null, x: b.x, y: b.y, w: b.w, h: b.h,
    json: { name, position: { x: b.x, y: b.y, width: b.w, height: b.h, tabOrder: tab }, visual: { visualType: name === 'T' ? 'tableEx' : 'clusteredColumnChart', query: { queryState: { Category: { projections: [{ field: col('T', 'C'), queryRef: 'T.C' }] }, Y: { projections: [{ field: mea('T', 'M'), queryRef: 'T.M' }] } } } } } });
  const page = (order) => { const v = order.map(([n, b], i) => vis(n, b, i)); return { pages: [{ id: 'p', name: 'p', w: 1280, h: 720, visuals: v, json: {} }], visuals: v, textSize: 12, labelSize: 10, slicerSize: 10, font: 'Segoe UI', theme: null, hasPlatform: true, lang: 'en', dir: 'ltr' }; };
  const tab = (R) => Rules.check(R, { groups: ['a11y'] }).findings.filter((f) => f.rule === 'A11Y_TAB_ORDER' && /pairs? of Tab stops/.test(f.what));
  chk(() => !tab(page([['A', A], ['T', T], ['B', B]])).length, () => `R2-5. A11Y_TAB_ORDER on the writer's order: no finding (was 1 pair): ${JSON.stringify(tab(page([['A', A], ['T', T], ['B', B]])))}`);
  chk(() => tab(page([['B', B], ['A', A], ['T', T]])).length === 1, () => 'R2-6 (guard). B before A on that page: the finding stays');
}

// ---------- T7: a plain place for each finding ----------
{
  const J = (o) => JSON.stringify(o);
  const files = [
    { path: 'R.Report/definition/report.json', data: J({}) },
    { path: 'R.Report/definition/pages/pages.json', data: J({ pageOrder: ['p1', 'tip'] }) },
    { path: 'R.Report/definition/pages/p1/page.json', data: J({ name: 'p1', displayName: 'One', width: 1280, height: 720 }) },
    { path: 'R.Report/definition/pages/p1/visuals/v1/visual.json', data: J({ name: 'v1', position: { x: 20, y: 20, width: 400, height: 200 }, visual: { visualType: 'lineChart',
      query: { queryState: { Category: { projections: [{ field: col('Sales', 'Month'), queryRef: 'Sales.Month' }] }, Y: { projections: [{ field: mea('Sales', 'Total'), queryRef: 'Sales.Total' }] } } },
      visualContainerObjects: { title: [{ properties: { show: Lv('true'), text: Lv("'Planted title words'") } }] } } }) },
    { path: 'R.Report/definition/pages/tip/page.json', data: J({ name: 'tip', displayName: 'Tip', width: 320, height: 240, type: 'Tooltip' }) },
    { path: 'R.Report/definition/pages/tip/visuals/b/visual.json', data: J({ name: 'b', position: { x: 0, y: 5, width: 320, height: 230 }, visual: { visualType: 'clusteredBarChart',
      query: { queryState: { Category: { projections: [{ field: col('Sales', 'Region'), queryRef: 'Sales.Region' }] }, Y: { projections: [{ field: mea('Sales', 'Total'), queryRef: 'Sales.Total' }] } } },
      objects: { valueAxis: [{ properties: { show: Lv('false') } }] } } }) }
  ];
  const c = LC.checkProject(files, {}), all = c.problems.concat(c.worthALook);
  const lint = all.find((f) => f.rule === 'AXIS_TIME_UNKNOWN'), rule = all.find((f) => f.rule === 'TOOLTIP_SCROLL');
  chk(() => lint && lint.place === 'the line chart, top left of the page', () => `T7-1. a lint finding's place: its kind and its third of the page: ${J(lint)}`);
  chk(() => rule && rule.place === 'the bar chart, in the middle of the page', () => `T7-2. a rule finding's place: ${J(rule)}`);
  chk(() => lint && / at 20,20 400x200$/.test(lint.visual) && rule && / at 0,5 320x230$/.test(rule.visual), () => `T7-3 (guard). "visual" keeps its type and box (plan-lint finds its flags by it): ${J([lint && lint.visual, rule && rule.visual])}`);
  const s = checkSummary(c, 8), lines = s.worthALookItems || [];
  chk(() => lines.length >= 2 && lines.some((l) => /^Page 1: the line chart, top left of the page: /.test(l)) && lines.some((l) => /^Page 2: the bar chart, in the middle of the page: /.test(l)),
    () => `T7-4. each worth-a-look line names the visual by its place: ${J(lines)}`);
  chk(() => lines.length && lines.every((l) => !/ at -?\d+,-?\d+ \d+x\d+/.test(l) && !/clusteredBarChart|lineChart/.test(l)), () => `T7-5. no line carries a type name or a box: ${J(lines)}`);
  chk(() => !J(all.map((f) => f.place)).includes('Planted'), () => 'T7-6. a place never quotes a title (R5)');
  const P = LC.placeOf;
  chk(() => P && P({ type: 'someCustomVisual1234', x: 900, y: 600, w: 300, h: 100 }, { w: 1280, h: 720 }) === 'a visual, bottom right of the page'
    && P({ type: 'tableEx', x: 500, y: 10, w: 280, h: 100 }, { w: 1280, h: 720 }) === 'the table, top centre of the page'
    && P({ type: 'cardVisual', x: 0, y: 0, w: 10, h: 10 }, null) === 'the card',
    () => `T7-7. a custom or unknown type is "a visual"; without the page's size, the kind alone: ${P && [P({ type: 'someCustomVisual1234', x: 900, y: 600, w: 300, h: 100 }, { w: 1280, h: 720 }), P({ type: 'tableEx', x: 500, y: 10, w: 280, h: 100 }, { w: 1280, h: 720 }), P({ type: 'cardVisual', x: 0, y: 0, w: 10, h: 10 }, null)]}`);
}

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.1-sq5.mjs cause=${JSON.stringify(problems[0]).slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq5  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq5  ${checks} checks`);
