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
//   S  the sums the note reports: plans with a hole, the worst hole, the flattest chart
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
// one line a case: "<slicers in the rail> | hole <share>% <w>x<h> | flat <ratio> | low <h>"
const lineOf = (slots, n) => { const r = Mx.pageFill(slots); return `${n} | hole ${r.holeShare}%${r.hole ? ` ${Math.round(r.hole.w)}x${Math.round(r.hole.h)}` : ''} | flat ${r.flat} | low ${Math.round(r.low)}`; };
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
  chk(() => holes === SUMS.holes && worst === SUMS.worst && flat === SUMS.flat, () => `S1. of ${CASES.length} plans, with a hole: ${holes} (pinned ${SUMS.holes}); the worst hole ${worst}% (${SUMS.worst}); the flattest chart ${flat} (${SUMS.flat})`);
  if (process.env.FB1_RECORD) { fs.writeFileSync(PIN_FILE, JSON.stringify({ about: 'test-0.3.3-fb1.mjs: page 1 of each plan, "<slicers> | hole <share of the body>% <w>x<h> | flat <widest chart, w / h> | low <lowest chart>"; FB1_RECORD=1 rewrites it, and every moved number is said in the job\'s note', sums: { plans: CASES.length, holes, worst, flat }, cases: got }, null, 1) + '\n'); console.log('recorded ' + PIN_FILE); }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }
if (problems.length) { console.log(`FAIL script=mcp/test-0.3.3-fb1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 400))); process.exit(1); }
console.log(`PASS  fb1  ${checks} checks`);
