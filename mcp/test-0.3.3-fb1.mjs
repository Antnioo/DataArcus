import './test-env.mjs';
// 0.3.3 FB1 (the owner, 10 Nov: "tackle our toughest challenge"; mcp/work/FB1.md). How well a planned page is filled,
// as a number: the design engine's pageFill (assets/js/design-metrics.js) on the slots a plan promises. The rail's gaps
// came back five times (0.2.9 rounds 8, 9 and 12, FX2's C03, SQ13's S10: 392, 308, 329, 245 still open), each patched
// by its own case in fitSlots with no number that says whether the page got better. This suite is that number.
//   M  the measure itself, on slots made by hand: no hole, a hole under a rail, a gutter is never a hole, the header
//      is not the body, flat and low read the charts only, the given slots are not changed
//   E  the facade: DAEngine.pageFill is DAMetrics' own
//   P  through the real server (plan_layout, nothing written): every layout x filter side x page size on four made-up
//      models (the sample: 3 slicers; "two": a date and one text column, 2 slicers; "notime": two text columns and no
//      date, so the layouts made for no time axis; "single": one text column, no date), page 1's slots as the plan answers them:
//      the largest hole (its share of the body and its size), the flattest chart (width / height) and the lowest
//      chart, each pinned in fixtures/fb1-pins.json. A number that moves fails here by its case, base and new value.
//   A  an Arabic plan's hole is the English plan's, mirrored
//   S  the sums the note reports: plans with a hole, the worst hole, the flattest chart, and (FB3) the plans whose
//      first row of charts is lower than a row under it, and the lowest such ratio
//   T  (0.3.3 FB3, mcp/work/FB3.md) the focus page's hole: the text box of the row beside the rail goes under the rail
//      (fitSlots' tuckText), every box of the page pinned, start, end and Arabic; where it does not measure better
//      (one dropdown) the page stays as it is
//   G  (FB3; L-1101-02, L-1102-07) guards on the engine itself, every layout x rail side x page x 1 to 3 dropdowns x
//      cards or none x a model with or without a time axis x English and Arabic: no two slots overlap, every slot is
//      on the page, no slot's width or height drops under REFLOW_KEEP of the designed one (under half on a page whose
//      text box moved), a text box under the rail shares the rail's two side edges and its row's bottom (1 px), the
//      slots given are not changed
// Record: FB1_RECORD=1 node test-0.3.3-fb1.mjs rewrites fixtures/fb1-pins.json (then say each moved number in the note).
// Made-up models only; temporary folders under os.tmpdir().   node test-0.3.3-fb1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url), HERE = path.dirname(fileURLToPath(import.meta.url));
const E = require('../assets/js/design-engine.js'), Mx = require('../assets/js/design-metrics.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const J = (x) => JSON.stringify(x);

// ---------- M: the measure on slots made by hand ----------
const pf = (s) => Mx.pageFill(s);
const GRID = { pages: 720, tucked: 132 };   // the guards' grid (G0): the pages it fits, and those whose text box is under the rail
const FULL = [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'kpi', x: 24, y: 105, w: 1872, h: 144 }, { kind: 'line', x: 24, y: 267, w: 1242, h: 440 }, { kind: 'bar', x: 1284, y: 267, w: 612, h: 440 },
  { kind: 'column', x: 24, y: 725, w: 927, h: 331 }, { kind: 'table', x: 969, y: 725, w: 927, h: 331 }];
const RAIL = [{ kind: 'slicer', x: 24, y: 105, w: 294, h: 312 }, { kind: 'kpi', x: 336, y: 105, w: 1560, h: 144 }, { kind: 'line', x: 336, y: 267, w: 1560, h: 440 }, { kind: 'table', x: 24, y: 725, w: 1872, h: 331 }];
chk(() => typeof Mx.pageFill === 'function', () => 'M1. design-metrics.js has no pageFill');
chk(() => { const r = pf(FULL); return r.hole === null && r.holeArea === 0 && r.holeShare === 0 && r.gutter === 18; }, () => `M2. a page tiled to its gutters has no hole: ${J(pf(FULL))}`);
chk(() => { const r = pf(RAIL); return J(r.hole) === J({ x: 24, y: 417, w: 312, h: 308 }) && r.holeArea === 312 * 308 && r.holeShare === 5.4; }, () => `M3. the room under a short rail is the hole (312 x 308 from 24,417, 5.4% of the body): ${J(pf(RAIL))}`);
chk(() => { const r = pf(FULL); return r.charts === 3 && r.flat === 2.8 && r.low === 331; }, () => `M4. flat and low read the charts only (3 charts, 927 / 331 = 2.8, low 331): ${J(pf(FULL))}`);
chk(() => { const r = pf(FULL.filter((s) => s.kind !== 'title').concat([{ kind: 'title', x: 0, y: 0, w: 10, h: 10 }, { kind: 'logo', x: 3000, y: 0, w: 10, h: 10 }])); return r.hole === null; }, () => 'M5. the header\'s slots are not part of the body');
chk(() => { const r = pf([]); return r.hole === null && r.charts === 0 && r.flat === 0 && r.low === 0; }, () => `M6. no slots: zeros, no throw: ${J(pf([]))}`);
chk(() => { const before = J(RAIL); pf(RAIL); return J(RAIL) === before; }, () => 'M7. pageFill changed the slots it was given');
chk(() => { const r = pf(RAIL.map((s) => (s.kind === 'line' ? Object.assign({}, s, { h: 150 }) : s.kind === 'table' ? Object.assign({}, s, { y: 435, h: 621 }) : s))); return r.hole === null && r.flat === 10.4 && r.low === 150; },
  () => 'M8. a chart ending at the rail\'s bottom: no hole, and the chart is flat (1560 / 150 = 10.4)');
chk(() => { const s = RAIL.map((x) => ({ kind: x.kind, x: x.x / 1.5, y: x.y / 1.5, w: x.w / 1.5, h: x.h / 1.5 })), r = pf(s); return r.holeShare === 5.4 && r.gutter === 12 && r.flat === 3.5; }, () => 'M9. the same page in other units gives the same share (the 720 grid)');
chk(() => { const r = pf(FULL), q = pf(RAIL); return J(r.rows) === J([440, 331]) && r.balance === 1.33 && J(q.rows) === J([440, 331]) && q.balance === 1.33; }, () => `M10. rows and balance: the chart rows' heights and the first over the highest under it (440 / 331 = 1.33; cards, the rail and a text box are no row): ${J(pf(FULL).rows)} ${pf(FULL).balance}`);
chk(() => { const r = pf(FULL.filter((s) => s.y < 700).concat([{ kind: 'text', x: 24, y: 725, w: 1872, h: 331 }])), q = pf(FULL.map((s) => (s.y === 267 ? Object.assign({}, s, { h: 228 }) : s.y === 725 ? Object.assign({}, s, { y: 513, h: 543 }) : s))); return r.balance === null && J(r.rows) === J([440]) && q.balance === 0.42; },
  () => 'M11. one row of charts: balance null (a text box is no row); a first row of 228 over 543: 0.42');
// ---------- T, G: the text box under the rail, and the guards (FB3) ----------
const RAIL_ITEMS = (h) => ({ minH: 40 * h / 1080, maxH: 76 * h / 1080, resetH: 40 * h / 1080, pad: 10 * h / 1080, gap: 8 * h / 1080 });
const fitOn = (c, lang, n, noTime) => { const designed = E.projectSlots(c, lang, { noTime }), before = J(designed), p = E.page(c);
  return { designed, before, p, fitted: Mx.fitSlots(designed, { dropKinds: [], headerRows: 0, railItems: Object.assign({ n }, RAIL_ITEMS(p.h)) }).slots }; };
const boxes = (l) => l.filter((s) => s.kind !== 'title' && s.kind !== 'logo').map((s) => `${s.kind} ${s.x},${s.y} ${s.w}x${s.h}`).join(' | ');
const FOCUS = { preset: 'focus', page: '1920x1080', header: true, filters: true, fpos: 'start', kpis: 3 };
chk(() => boxes(fitOn(FOCUS, 'en', 3).fitted) === 'slicer 24,267 294x312 | kpi 24,105 612x144 | kpi 654,105 612x144 | kpi 1284,105 612x144 | line 336,267 1560x789 | text 24,597 294x459',
  () => `T1. a focus page, three dropdowns at the start: the cards across, the rail, the text box under it, the chart beside both: ${boxes(fitOn(FOCUS, 'en', 3).fitted)}`);
chk(() => boxes(fitOn(Object.assign({}, FOCUS, { fpos: 'end' }), 'en', 3).fitted) === 'slicer 1602,267 294x312 | kpi 24,105 612x144 | kpi 654,105 612x144 | kpi 1284,105 612x144 | line 24,267 1560x789 | text 1602,597 294x459',
  () => `T2. the rail at the end: the same page mirrored about the chart: ${boxes(fitOn(Object.assign({}, FOCUS, { fpos: 'end' }), 'en', 3).fitted)}`);
chk(() => { const en = fitOn(FOCUS, 'en', 2).fitted, ar = fitOn(FOCUS, 'ar', 2).fitted, key = (s) => `${s.kind} ${s.x},${s.y} ${s.w}x${s.h}`; return J(ar.map(key).sort()) === J(en.map((s) => key(Object.assign({}, s, { x: 1920 - s.x - s.w }))).sort()) && Mx.pageFill(ar).hole === null && Mx.pageFill(en).hole === null; },
  () => `T3. Arabic, two dropdowns: the English page mirrored, no hole: ${boxes(fitOn(FOCUS, 'ar', 2).fitted)}`);
chk(() => boxes(fitOn(FOCUS, 'en', 1).fitted) === 'slicer 24,105 294x144 | kpi 336,105 509x144 | kpi 863,105 508x144 | kpi 1389,105 507x144 | line 24,267 1376x789 | text 1418,267 478x789',
  () => `T4. one dropdown: the page has no hole, so it stays as it was (the text box at the end of the row): ${boxes(fitOn(FOCUS, 'en', 1).fitted)}`);
chk(() => { const f = fitOn(Object.assign({}, FOCUS, { kpis: 0 }), 'en', 3).fitted, t = f.find((s) => s.kind === 'text'), r = f.find((s) => s.kind === 'slicer'), l = f.find((s) => s.kind === 'line'); return Mx.pageFill(f).hole === null && t.x === r.x && t.w === r.w && t.y === r.y + r.h + 18 && t.y + t.h === l.y + l.h; },
  () => `T5. no cards: the text box still goes under the rail and the hole closes: ${boxes(fitOn(Object.assign({}, FOCUS, { kpis: 0 }), 'en', 3).fitted)}`);
{ const bad = { overlap: [], off: [], small: [], edge: [], changed: [] }; let cases = 0, tucked = 0;
  const near = (a, b) => Math.abs(a - b) <= 1;
  for (const preset of ['exec', 'analysis', 'ops', 'focus']) for (const fpos of ['start', 'end']) for (const pg of ['1920x1080', '1280x720', '960x720']) for (const n of [1, 2, 3]) for (const kpis of [null, 0]) for (const noTime of [false, true]) for (const lang of ['en', 'ar']) for (const detail of [false, true]) {
    if (detail && preset !== 'analysis') continue;
    const c = Object.assign({ preset, page: pg, header: true, filters: true, fpos, kpis: kpis == null ? E.LAYOUTS[preset].kpis : kpis }, detail ? { detail: true } : {}), name = `${preset}${detail ? ' (details)' : ''} ${fpos} ${pg} n${n} kpis ${c.kpis}${noTime ? ' no time' : ''} ${lang}`;
    const { designed, before, p, fitted } = fitOn(c, lang, n, noTime); cases++;
    if (J(designed) !== before) bad.changed.push(name);
    const body = fitted.filter((s) => s.kind !== 'title' && s.kind !== 'logo'), rail = body.find((s) => s.kind === 'slicer'), text = body.find((s) => s.kind === 'text');
    const isTucked = !!(rail && text && near(text.x, rail.x) && text.y >= rail.y + rail.h); if (isTucked) tucked++;
    body.forEach((a, i) => { body.slice(i + 1).forEach((b) => { if (a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1) bad.overlap.push(`${name}: ${a.kind} over ${b.kind}`); });
      if (a.x < 0 || a.y < 0 || a.x + a.w > p.w + 1 || a.y + a.h > p.h + 1 || !(a.w > 0) || !(a.h > 0)) bad.off.push(`${name}: ${a.kind} ${a.x},${a.y} ${a.w}x${a.h}`); });
    fitted.forEach((s, i) => { const d = designed[i], keep = isTucked ? 0.5 : Mx.REFLOW_KEEP; if (s.kind !== d.kind) bad.small.push(`${name}: slot ${i} is a ${s.kind}, was a ${d.kind}`); else if (s.kind !== 'slicer' && (s.w < keep * d.w - 1 || s.h < keep * d.h - 1)) bad.small.push(`${name}: ${s.kind} ${d.w}x${d.h} -> ${s.w}x${s.h}`); });
    if (isTucked) { const row = body.filter((s) => s !== rail && s !== text && s.kind !== 'kpi'), bottom = Math.max(...row.map((s) => s.y + s.h));
      if (!(near(text.x, rail.x) && near(text.x + text.w, rail.x + rail.w) && near(text.y + text.h, bottom) && text.y - (rail.y + rail.h) > 0 && text.y - (rail.y + rail.h) <= 18 && Mx.pageFill(fitted).hole === null)) bad.edge.push(`${name}: ${boxes(fitted)}`); }
  }
  chk(() => cases === GRID.pages && tucked === GRID.tucked, () => `G0. the grid: ${cases} pages fitted (${GRID.pages}), the text box under the rail on ${tucked} (${GRID.tucked})`);
  chk(() => !bad.overlap.length, () => `G1. ${bad.overlap.length} pairs of slots overlap by more than 1: ${bad.overlap.slice(0, 3).join('; ')}`);
  chk(() => !bad.off.length, () => `G2. ${bad.off.length} slots are off the page or empty: ${bad.off.slice(0, 3).join('; ')}`);
  chk(() => !bad.small.length, () => `G3. ${bad.small.length} slots lost more than the rule allows of their designed width or height (REFLOW_KEEP; half where the text box moved): ${bad.small.slice(0, 3).join('; ')}`);
  chk(() => !bad.edge.length, () => `G4. ${bad.edge.length} text boxes under the rail do not share its side edges and their row's bottom within 1, or leave a hole: ${bad.edge.slice(0, 2).join('; ')}`);
  chk(() => !bad.changed.length, () => `G5. fitSlots changed the slots it was given on ${bad.changed.length} pages: ${bad.changed.slice(0, 3).join('; ')}`); }
// ---------- E: the facade ----------
chk(() => E.pageFill === Mx.pageFill, () => 'E1. DAEngine.pageFill is not DAMetrics\' own');

// ---------- P: through the server ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fb1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const MEASURES = [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }, { name: 'Units', expression: 'SUM ( Sales[Qty] )' }, { name: 'Average Sale', expression: 'AVERAGE ( Sales[Amount] )' }];
const bim = (folder, texts, date) => { fs.mkdirSync(path.join(ROOT, folder, 'Shop.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, folder, 'Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [{ name: 'Sales', partitions: mp('Sales'),
    columns: [col('Amount', 'double'), col('Qty', 'int64')].concat(date ? [col('Order Date', 'dateTime')] : []).concat(texts.map((t) => col(t, 'string'))), measures: MEASURES }] } })); };
bim('two', ['Region'], true); bim('notime', ['Region', 'Product'], false); bim('single', ['Region'], false);
const PAGES = ['1920x1080', '1280x720'], LAYOUTS = ['exec', 'analysis', 'ops', 'focus'];
const CASES = [];
for (const m of ['sample', 'two', 'notime', 'single']) for (const layout of LAYOUTS) for (const page of PAGES) for (const filters of ['start', 'top']) CASES.push({ m, layout, page, filters });
for (const layout of LAYOUTS) { CASES.push({ m: 'sample', layout, page: '1920x1080', filters: 'end' }, { m: 'sample', layout, page: '1920x1080', filters: 'none' }, { m: 'sample', layout, page: '960x720', filters: 'start' }, { m: 'sample', layout, page: '960x720', filters: 'top' }); }
const keyOf = (c) => `${c.m} ${c.layout} ${c.page} ${c.filters}`;
// one line a case: "<slicers in the rail> | hole <share>% <w>x<h> | flat <ratio> | low <h> | bal <first row / the highest under it>"
const lineOf = (slots, n) => { const r = Mx.pageFill(slots); return `${n} | hole ${r.holeShare}%${r.hole ? ` ${Math.round(r.hole.w)}x${Math.round(r.hole.h)}` : ''} | flat ${r.flat} | low ${Math.round(r.low)} | bal ${r.balance == null ? '-' : r.balance}`; };
const PIN_FILE = path.join(HERE, 'fixtures', 'fb1-pins.json'), { cases: PINS, sums: SUMS } = JSON.parse(fs.readFileSync(PIN_FILE, 'utf8'));
const s = await serverClient(ROOT, {});
const got = {}, slotsBy = {};
try {
  const sp = await s.call('plan_layout', { sample: true, lang: 'en' });
  await s.call('approve_plan', { planId: sp.j.plan.planId });
  const sw = await s.call('create_report', { path: sp.j.sample.folder, planId: sp.j.plan.planId });
  chk(() => !sw.err && sw.j.written === true, () => 'P0. the sample project was not written: ' + String(sw.t).slice(0, 200));
  const folder = { sample: sp.j.sample.folder, two: 'two', notime: 'notime', single: 'single' };
  for (const c of CASES) {
    const pl = await s.call('plan_layout', { path: folder[c.m], name: 'R', layout: c.layout, page: c.page, filters: c.filters, lang: 'en' });
    const slots = pl.j && pl.j.slots;
    if (!Array.isArray(slots)) { got[keyOf(c)] = 'no slots: ' + String(pl.t).slice(0, 120); continue; }
    slotsBy[keyOf(c)] = slots;
    got[keyOf(c)] = lineOf(slots, ((pl.j.slicers || {}).written || []).length);
  }
  chk(() => Object.keys(PINS).length === CASES.length && CASES.every((c) => keyOf(c) in PINS), () => `P1. the pins hold ${Object.keys(PINS).length} cases, the suite plans ${CASES.length}`);
  for (const c of CASES) { const k = keyOf(c); chk(() => got[k] === PINS[k], () => `P2. ${k}: pinned "${PINS[k]}", now "${got[k]}"`); }
  // ---------- A: Arabic, mirrored ----------
  { const k = 'sample exec 1920x1080 start', en = slotsBy[k];
    const ar = await s.call('plan_layout', { path: folder.sample, name: 'R', layout: 'exec', page: '1920x1080', filters: 'start', lang: 'ar' });
    const sl = (ar.j && ar.j.slots) || (ar.j && ar.j.planProblems && ar.j.slots) || null;
    chk(() => { const a = Mx.pageFill(sl), e = Mx.pageFill(en); return a.holeArea === e.holeArea && a.flat === e.flat && a.low === e.low && (!e.hole || Math.abs(a.hole.x - (1920 - e.hole.x - e.hole.w)) <= 1); },
      () => `A1. the Arabic plan's page is not the English one mirrored: ${sl ? J(Mx.pageFill(sl)) : String(ar.t).slice(0, 200)} vs ${J(Mx.pageFill(en))}`); }
  // ---------- S: the sums the note reports ----------
  const all = CASES.map((c) => Mx.pageFill(slotsBy[keyOf(c)] || [])), holes = all.filter((r) => r.hole).length, worst = Math.max(...all.map((r) => r.holeShare)), flat = Math.max(...all.map((r) => r.flat));
  const bals = all.map((r) => r.balance).filter((b) => b != null), junior = bals.filter((b) => b < 1).length, lowest = Math.min(...bals);
  chk(() => holes === SUMS.holes && worst === SUMS.worst && flat === SUMS.flat, () => `S1. of ${CASES.length} plans, with a hole: ${holes} (pinned ${SUMS.holes}); the worst hole ${worst}% (${SUMS.worst}); the flattest chart ${flat} (${SUMS.flat})`);
  chk(() => junior === SUMS.junior && lowest === SUMS.lowest, () => `S2. plans whose first row is lower than a row under it: ${junior} (pinned ${SUMS.junior}); the lowest first row over the row under it ${lowest} (${SUMS.lowest})`);
  if (process.env.FB1_RECORD) { fs.writeFileSync(PIN_FILE, JSON.stringify({ about: 'test-0.3.3-fb1.mjs: page 1 of each plan, "<slicers> | hole <share of the body>% <w>x<h> | flat <widest chart, w / h> | low <lowest chart> | bal <the first row of charts over the highest row under it>"; FB1_RECORD=1 rewrites it, and every moved number is said in the job\'s note', sums: { plans: CASES.length, holes, worst, flat, junior, lowest }, cases: got }, null, 1) + '\n'); console.log('recorded ' + PIN_FILE); }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-fb1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 400))); console.log(`FAIL  fb1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  fb1  ${checks} checks`);
