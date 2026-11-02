// 0.3.1 FX2: the laptop part 3's finds on 0.3.1-rc.2 (blocks A, C and H; Desktop 2.159.883.0), each written red first.
// On made-up fields only (the sample project's Gulf retail, test-models/no-measures, the writer's own build).
//   H1-H7 the twin's mirror against Microsoft's catalog (@microsoft/powerbi-core-visual-schema, as mcp/package.json pins
//         it): every legend position and shadow preset turns into a value the catalog has (H-1: "TopRight" became
//         "TopLeft", PBIR_FORMATTING_ENUM_INVALID); one outside it is kept and said; every enum the mirror writes on a
//         report is a catalog value; Microsoft's validator 0 errors on a twin of a line chart at each legend position
//   C1-C5 C23 (960 x 720, exec, 0 KPIs, a rail, pills, flip cards): no two data visuals overlap (the rail's row ends
//         together), on the other sizes and layouts the sweep found too; the exact check blocks an overlap in a
//         report DataArcus lays out (C5: pages placed by hand keep it a finding)
//   F1    C03 (ar, 1920 x 1080, focus, 0 KPIs, a rail, the metric switcher): the chart starts at the rail's top
//   A1-A4 A-1 (no measures, lang ar): the columns counted or summed are drafted like the other fields, no plan id until
//         they are, the plan lists each title's Arabic draft, and the titles are «عدد ...», «مجموع ...»
//   T1    TOOLS.md names flipCards, statusIcons, metricSwitcher and gallery, each with what it writes and its limits
//   node test-0.3.1-fx2.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const req = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };

const Px = req('../assets/js/pbip-export.js'), E = req('../assets/js/design-engine.js'), Mirror = req('../assets/js/report-mirror.js');
const SCHEMA = path.join(HERE, 'node_modules/@microsoft/powerbi-core-visual-schema/data');
const CAPS = JSON.parse(fs.readFileSync(path.join(SCHEMA, 'capabilities.json'), 'utf8')), VCO = JSON.parse(fs.readFileSync(path.join(SCHEMA, 'vco-capabilities.json'), 'utf8'));
const members = (t) => (t && t.enumeration && Array.isArray(t.enumeration.allMembers) ? t.enumeration.allMembers.map((x) => x.value) : null);
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const valOf = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' ? p.expr.Literal.Value : undefined);
const unq = (s) => (typeof s === 'string' && /^'.*'$/.test(s) ? s.slice(1, -1) : s);

// ---------- H: the mirror against the catalog ----------
const LEGEND = members(CAPS.lineChart.objects.legend.properties.position.type), SHADOW = members(VCO.dropShadow.properties.preset.type);
const T = 'Sales', col = (c) => ({ Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }), mea = (m) => ({ Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } });
const line = (name, pos) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.4.0/schema.json', name, position: { x: 20, y: 20, z: 0, width: 400, height: 240, tabOrder: 0 },
  visual: { visualType: 'lineChart', query: { queryState: { Category: { projections: [{ field: col('City'), queryRef: T + '.City', nativeQueryRef: 'City', active: true }] }, Y: { projections: [{ field: mea('Total Sales'), queryRef: T + '.Total Sales', nativeQueryRef: 'Total Sales' }] } } },
    objects: { legend: [{ properties: Object.assign({ show: lit('true') }, pos ? { position: lit(`'${pos}'`) } : {}) }] } } });
const legendOut = (pos) => unq(valOf(((Mirror.mirrorVisual(line('l', pos), 1280, {}).json.visual.objects.legend || [])[0] || { properties: {} }).properties.position));
chk(() => LEGEND.length >= 8 && LEGEND.includes('TopRight') && !LEGEND.includes('TopLeft'), () => `H0: the catalog's legend positions read: ${JSON.stringify(LEGEND)}`);
{
  const got = [null].concat(LEGEND).map((p) => [p, legendOut(p)]);
  chk(() => got.every(([, o]) => LEGEND.includes(o)), () => `H1: every legend position mirrors into a value the catalog has: ${JSON.stringify(got)}`);
  const want = { Top: 'TopRight', TopRight: 'Top', Bottom: 'BottomRight', BottomRight: 'Bottom', Left: 'Right', Right: 'Left', LeftCenter: 'RightCenter', RightCenter: 'LeftCenter', TopCenter: 'TopCenter', BottomCenter: 'BottomCenter' };
  chk(() => Object.entries(want).every(([a, b]) => legendOut(a) === b) && legendOut(null) === 'TopRight', () => `H2: left and right swap (Top is top left), the centred ones stay, none set goes TopRight: ${JSON.stringify(got)}`);
  const r = Mirror.mirrorVisual(line('l', 'TopLeft'), 1280, {});
  chk(() => legendOut('TopLeft') === 'TopLeft' && (r.kept || []).some((k) => k.what === 'legend position' && k.value === 'TopLeft'), () => `H3: a position outside the catalog is kept and said: ${legendOut('TopLeft')} ${JSON.stringify(r.kept)}`);
}
{
  const shadowed = (preset) => ({ name: 's', position: { x: 0, y: 0, width: 100, height: 60 }, visual: { visualType: 'card', visualContainerObjects: { dropShadow: [{ properties: { show: lit('true'), preset: lit(`'${preset}'`) } }] } } });
  const out = (p) => unq(valOf(Mirror.mirrorVisual(shadowed(p), 1280, {}).json.visual.visualContainerObjects.dropShadow[0].properties.preset));
  const got = SHADOW.map((p) => [p, out(p)]);
  chk(() => got.every(([, o]) => SHADOW.includes(o)) && out('CenterLeft') === 'CenterRight' && out('CenterRight') === 'CenterLeft' && out('BottomRight') === 'BottomLeft' && out('Top') === 'Top',
    () => `H4: every shadow preset in the catalog turns into one (CenterLeft <-> CenterRight, the catalog's middle presets): ${JSON.stringify(got)}`);
}
// the writer's own report (every kind it writes on a design page) and the line charts at each legend position, mirrored
const AED = { t: T, m: 'Total Sales', cardFormat: '"AED" #,0' }, MONTH = { t: T, c: 'Month Name', kind: 'month', sortBy: { t: T, c: 'Month Number' } };
const B = { kpis: [AED], measure: AED, date: MONTH, cats: { bar: { t: T, c: 'City' }, column: MONTH, donut: { t: T, c: 'Channel' } }, y: {}, table: [{ t: T, c: 'City' }, AED], slicers: [{ t: T, c: 'City' }, null, null], tip: { card: AED, cat: { t: T, c: 'City' }, y: AED } };
const EN = (() => { try { const d = E.fresh(); E.repairState(d);
  return Px.build({ name: 'FX2', title: 'FX2', pageName: 'P', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' }, bind: B, texts: E.REPORT_TEXTS.en, gallery: false,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, panel: null, hand: true, png: new Uint8Array([1]), slots: [{ kind: 'kpi', x: 20, y: 20, w: 300, h: 100 }, { kind: 'line', x: 340, y: 20, w: 600, h: 300 }, { kind: 'bar', x: 960, y: 20, w: 300, h: 300 },
      { kind: 'column', x: 20, y: 340, w: 400, h: 300 }, { kind: 'donut', x: 440, y: 340, w: 300, h: 300 }, { kind: 'table', x: 760, y: 340, w: 500, h: 300 }, { kind: 'slicer', x: 20, y: 140, w: 300, h: 90 }] }] }); } catch (e) { return { threw: String(e && e.message || e) }; } })();
chk(() => EN.files && EN.files.length > 5, () => `H: the writer's report was built: ${EN.threw || ''}`);
const visualFiles = (EN.files || []).filter((f) => /\/visuals\/[^/]+\/visual\.json$/.test(f.path));
const pageDir = visualFiles.length ? visualFiles[0].path.replace(/visuals\/[^/]+\/visual\.json$/, '') : '';
const legendFiles = [null].concat(LEGEND).map((p, i) => ({ path: `${pageDir}visuals/fx2legend${i}/visual.json`, data: JSON.stringify(line('fx2legend' + i, p), null, 2) }));
const twinFiles = (EN.files || []).concat(legendFiles).map((f) => (/\/visuals\/[^/]+\/visual\.json$/.test(f.path) ? Object.assign({}, f, { data: JSON.stringify(Mirror.mirrorVisual(JSON.parse(String(f.data)), 1280, {}).json, null, 2) }) : f));
{
  // every enumerated property the twin's visuals hold, in visual.objects (the visual type's capabilities) and in
  // visualContainerObjects (the container's catalog): a member of its enumeration
  const bad = [];
  twinFiles.filter((f) => /visual\.json$/.test(f.path)).forEach((f) => { const v = JSON.parse(String(f.data)).visual; if (!v) return;
    const look = (bag, cat) => Object.entries(bag || {}).forEach(([o, es]) => (Array.isArray(es) ? es : []).forEach((e) => Object.entries((e && e.properties) || {}).forEach(([p, x]) => {
      const en = members(cat[o] && cat[o].properties && cat[o].properties[p] && cat[o].properties[p].type), s = unq(valOf(x));
      if (en && s !== undefined && !en.includes(s)) bad.push(`${v.visualType}.${o}.${p} = ${s}`); })));
    look(v.objects, (CAPS[v.visualType] || {}).objects || {}); look(v.visualContainerObjects, VCO); });
  chk(() => bad.length === 0, () => `H5: every enumerated value the twin writes is one the catalog lists: ${JSON.stringify(bad.slice(0, 12))}`);
  const pg = Mirror.mirrorPage({ width: 1280 }, legendFiles.map((f) => JSON.parse(f.data)).concat(line('fx2odd', 'TopLeft')), {});
  chk(() => (pg.kept || []).length === 1 && pg.kept[0].name === 'fx2odd' && pg.kept[0].value === 'TopLeft', () => `H6: the page says the one legend it kept (outside the catalog), by its visual: ${JSON.stringify(pg.kept)}`);
}
{
  const cli = path.join(HERE, 'node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx2-'));
  twinFiles.forEach((f) => { const p = path.join(TMP, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
  const rd = path.join(TMP, fs.readdirSync(TMP).find((d) => /\.Report$/.test(d)) || ''), pv = spawnSync(process.execPath, [cli, 'validate', rd], { encoding: 'utf8' });
  let vd = null; try { vd = JSON.parse(pv.stdout).data; } catch (e) { vd = null; }
  chk(() => vd && vd.errorCount === 0, () => `H7: Microsoft's validator: 0 errors on the twin of a line chart at each legend position: ${vd ? JSON.stringify(Object.entries(vd.diagnostics || {}).filter(([, d]) => d.severity === 'error').map(([k, d]) => k + ': ' + String(d.items[0].message).slice(0, 160))) : String(pv.stdout || pv.stderr).slice(0, 300)}`);
  fs.rmSync(TMP, { recursive: true, force: true });
}

// ---------- C, F: the layouts on the sample project; A: the model with no measures ----------
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fx2-root-')));
process.env.DATAARCUS_ROOT = ROOT;   // (lib/report-run.mjs, imported below, reads the working folder)
const { sampleFiles } = await import('./lib/sample-project.mjs');
sampleFiles('S').forEach((f) => { const p = path.join(ROOT, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
fs.cpSync(path.join(HERE, 'test-models', 'no-measures'), path.join(ROOT, 'NM'), { recursive: true });
const SAMPLE = path.join('S', fs.readdirSync(path.join(ROOT, 'S')).find((x) => /\.pbip$/.test(x)));
const s = await serverClient(ROOT, {});
const plan = async (a) => { const r = await s.call('plan_layout', Object.assign({ name: 'FX2' }, a)); return r.j || { err: r.t }; };
const DATA = (x) => !['title', 'logo'].includes(x.kind);
const overlaps = (sl) => { const d = (sl || []).filter(DATA), out = [];
  for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) { const A = d[i], Bx = d[j];
    if (Math.min(A.x + A.w, Bx.x + Bx.w) - Math.max(A.x, Bx.x) > 0 && Math.min(A.y + A.h, Bx.y + Bx.h) - Math.max(A.y, Bx.y) > 0) out.push(`${A.kind} ${A.x},${A.y} ${A.w}x${A.h} / ${Bx.kind} ${Bx.x},${Bx.y} ${Bx.w}x${Bx.h}`); }
  return out; };
{
  const c23 = await plan({ path: SAMPLE, page: '960x720', layout: 'exec', kpis: 0, filters: 'start', slicerStyle: 'pills', flipCards: true, lang: 'en' });
  chk(() => c23.slots && overlaps(c23.slots).length === 0, () => `C1 (C23): no two data visuals overlap: ${JSON.stringify(overlaps(c23.slots))} ${c23.err || ''}`);
  chk(() => c23.exactCheck && c23.exactCheck.status === 'pass' && !(c23.exactCheck.byRule || {}).OVERLAP && c23.plan && c23.plan.planId, () => `C2 (C23): the exact build has no OVERLAP and the plan its id: ${JSON.stringify(c23.exactCheck && c23.exactCheck.byRule)}`);
  // the same defect on the other sizes and layouts the sweep found (a rail beside a row of two charts)
  const more = [{ page: '1920x1080', layout: 'exec', kpis: 0, filters: 'end' }, { page: '1280x720', layout: 'exec', kpis: 0, filters: 'start' }, { page: '960x720', layout: 'ops', kpis: 3, filters: 'start' }, { page: '960x720', layout: 'ops', kpis: 0, filters: 'end' }];
  const seen = [];
  for (const a of more) { const r = await plan(Object.assign({ path: SAMPLE, lang: 'en' }, a)); seen.push([JSON.stringify(a), overlaps(r.slots), (r.exactCheck || {}).byRule && r.exactCheck.byRule.OVERLAP]); }
  chk(() => seen.every(([, o, n]) => o.length === 0 && !n), () => `C3: no overlap on the other pages with a rail beside a row: ${JSON.stringify(seen.filter(([, o, n]) => o.length || n))}`);
}
{
  // the check: two charts of a planned report overlapping block it (the lint's OVERLAP)
  const { checkArtifact } = await import('./lib/artifact.mjs');
  const d = E.fresh(); E.repairState(d);
  const R = Px.build({ name: 'Over', title: 'Over', pageName: 'P', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' }, bind: B, texts: E.REPORT_TEXTS.en, gallery: false,
    pages: [{ name: 'P', page: { w: 1280, h: 720 }, panel: null, hand: true, png: new Uint8Array([1]), slots: [{ kind: 'bar', x: 20, y: 20, w: 600, h: 400 }, { kind: 'table', x: 300, y: 200, w: 600, h: 400 }] }] });
  const c = await checkArtifact(R.files, [], 'en', { skip: ['validator', 'references', 'rules'], blockOverlap: true }), hand = await checkArtifact(R.files, [], 'en', { skip: ['validator', 'references', 'rules'] });
  chk(() => c.status === 'blocked' && (c.blocking || []).some((b) => b.rule === 'OVERLAP'), () => `C4: the exact check blocks a bar chart over a table: ${c.status} ${JSON.stringify(c.blocking)} ${JSON.stringify(c.byRule)}`);
  chk(() => hand.status !== 'blocked' && hand.byRule.OVERLAP > 0, () => `C5: pages placed by hand keep an overlap as a finding, never a refusal: ${hand.status} ${JSON.stringify(hand.byRule)}`);
}
{
  const c03 = await plan({ path: SAMPLE, page: '1920x1080', layout: 'focus', kpis: 0, filters: 'start', slicerStyle: 'dropdown', metricSwitcher: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Units Sold]'], lang: 'ar' });
  const rail = (c03.slots || []).find((x) => x.kind === 'slicer'), ch = (c03.slots || []).find((x) => x.kind === 'line');
  chk(() => rail && ch && ch.y === rail.y && overlaps(c03.slots).length === 0, () => `F1 (C03): the chart starts at the rail's top, no band above it: ${JSON.stringify(c03.slots || c03.err)}`);
}
{
  const p1 = await plan({ path: 'NM', lang: 'ar' }), n1 = p1.arabicNames || {};
  const counted = ['Orders[Order Id]', 'Orders[Amount]', 'Orders[Quantity]'];
  chk(() => (n1.proposeYourself || []).includes('Orders[Order Id]') && ((n1.titlesInEnglish || {}).fields || []).includes('Orders[Order Id]') && counted.slice(1).every((k) => (n1.suggestedDisplayNames || {})[k]),
    () => `A1: the counted and summed columns are drafted (the fixed list's, else proposeYourself): ${JSON.stringify({ propose: n1.proposeYourself, suggested: n1.suggestedDisplayNames, english: n1.titlesInEnglish })}`);
  chk(() => !(p1.plan && p1.plan.planId) && (p1.planProblems || []).some((x) => /Orders\[Order Id\]/.test(x)), () => `A2: no plan id until Order Id has an approved Arabic name: ${JSON.stringify(p1.plan && p1.plan.planId)} ${JSON.stringify(p1.planProblems)}`);
  const ct = ((n1.countedTitles || {}).titles || []), by = Object.fromEntries(ct.map((x) => [x.field, x]));
  chk(() => by['Orders[Order Id]'] && by['Orders[Order Id]'].en === 'Count of Order Id' && by['Orders[Order Id]'].ar === null && by['Orders[Amount]'] && by['Orders[Amount]'].ar === 'مجموع المبلغ' && /«عدد»/.test(n1.countedTitles.sayInPlan),
    () => `A3: the plan lists each count and sum title with its Arabic draft for approval: ${JSON.stringify(n1.countedTitles)}`);
  const names = { 'Orders[Order Id]': 'رقم الطلب' };
  const p2 = await plan({ path: 'NM', lang: 'ar', displayNames: names });
  const { reportRun } = await import('./lib/report-run.mjs');
  let titles = [];
  try { const b = reportRun({ path: 'NM', name: 'FX2', lang: 'ar', design: p2.design, displayNames: Object.assign({}, (p2.arabicNames || {}).inThePlan || {}, names) }, 'build');
    titles = b.files.filter((f) => /visual\.json$/.test(f.path)).map((f) => JSON.parse(String(f.data)).visual).filter((v) => v && !/textbox|actionButton|slicer|image|shape/i.test(v.visualType))
      .map((v) => { const t = (((v.visualContainerObjects || {}).title || [])[0] || {}).properties || {}; return valOf(t.text) !== undefined ? unq(valOf(t.text)) : JSON.stringify(t.text || null); }); } catch (e) { titles = ['threw: ' + String(e && e.message || e).slice(0, 200)]; }
  const plainT = titles.map((t) => String(t).replace(/[⁦-⁩‎‏]/g, ''));
  chk(() => p2.plan && p2.plan.planId && plainT.includes('عدد رقم الطلب') && plainT.includes('مجموع المبلغ') && plainT.some((t) => t.startsWith('عدد رقم الطلب حسب')),
    () => `A4: with the names approved, the titles are «عدد رقم الطلب», «مجموع المبلغ» (the plan has its id): ${JSON.stringify(p2.plan && p2.plan.planId)} ${JSON.stringify(plainT.slice(0, 12))}`);
  chk(() => plainT.length > 5 && plainT.every((t) => (t.startsWith('{') ? /"Property":"Title: (عدد|مجموع) /.test(t) : t !== 'null' && !/[A-Za-z]/.test(t))), () => `A5: every visual's own title is written, wholly Arabic (never Power BI's English auto-title): ${JSON.stringify(plainT)}`);
}
await s.close();
fs.rmSync(ROOT, { recursive: true, force: true });

// ---------- T: TOOLS.md ----------
{
  const tools = fs.readFileSync(path.join(HERE, 'TOOLS.md'), 'utf8'), row = (k) => tools.split('\n').find((l) => l.startsWith('| **' + k + '** |')) || '';
  chk(() => ['flipCards', 'statusIcons', 'metricSwitcher', 'gallery'].every((k) => row(k).split('|').length >= 5)
    && /notFlipped/.test(row('flipCards')) && /1-8/.test(row('statusIcons')) && /2 to 5/.test(row('metricSwitcher')) && /2-12/.test(row('gallery')),
  () => 'T1: TOOLS.md has a row for each of flipCards, statusIcons, metricSwitcher and gallery, with what it writes and its limits');
}

if (problems.length) { console.log(`FAIL script=test-0.3.1-fx2.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((p) => console.log('      - ' + p)); console.log(`FAIL  fx2  ${checks} checks, ${problems.length} failed`); process.exit(1); }
console.log(`PASS  fx2  ${checks} checks`);
