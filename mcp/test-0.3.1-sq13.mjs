// SQ13 (0.3.1, the night run of the "Seen, not in scope" queue; mcp/work/SQ13.md): the design engine and the previews.
// Written red first, one block per item of mcp/work/SEEN-QUEUE.md:
//   0.2.9-writer-S1        the plan's slots get the header growth the writer gives two rows of page tabs
//   0.2.9-writer-S10       the gap beside a shortened rail, pinned as measured (not fixed: SQ13.md, the stop rule)
//   R1-see-the-result-S3   the plan's preview never draws the design engine's slots (a layout never written)
//   V1-S2                  the labels note in plain words, never "unknown"
//   V1-S4                  a chart over time shows which way time runs (previews only; the written files unchanged)
//   L2-S1                  a SWITCH's compared texts are not counted as its values (few, two, the pills' texts)
//   0.2.9-reader-S13       a column given with no type is unknown, never text
//   0.2.9-design-S2        the plan's lint builds the table's share from the plan's table fields
// Made-up models only (written here, the fixture health-project): no employer data.
//   node test-0.3.1-sq13.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.message || e).slice(0, 300) }; } };
const E = require('../assets/js/design-engine.js'), Pbip = require('../assets/js/pbip-export.js'), Bind = require('../assets/js/pbip-bind.js'), P = require('../assets/js/page-preview.js');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sq13-')));
process.env.DATAARCUS_ROOT = ROOT;
fs.cpSync(path.join(HERE, 'fixtures/health-project'), path.join(ROOT, 'hp'), { recursive: true });
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const modelAt = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
const salesCols = [col('Amount', 'double'), col('Price', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Product', 'string'), col('Segment', 'string'), col('Order Date', 'dateTime')];
const salesMeasures = [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }, { name: 'Avg Price', expression: 'DIVIDE ( SUM ( Sales[Price] ), COUNTROWS ( Sales ) )', formatString: '#,0.00' }];
const calendar = { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), col('Month', 'string'), Object.assign(col('Month Number', 'int64'), {}), col('Year', 'int64')] };
calendar.columns[1].sortByColumn = 'Month Number';
modelAt('cal', [{ name: 'Sales', partitions: mp('Sales'), columns: salesCols, measures: salesMeasures }, calendar], [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }]);
modelAt('nom', [{ name: 'Sales', partitions: mp('Sales'), columns: salesCols, measures: [] }]);
const { loadModel } = await import('./lib/model.mjs');
const { planLayout } = await import('./lib/design.mjs');
const PL = await import('./lib/plan-lint.mjs');
const { fieldsAndProblems } = await import('./lib/report-fields.mjs');
const boxes = (files) => P.fromFiles(files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data })), {});

// ---------- 0.2.9-writer-S1: the plan's slots grow with the header, as the writer's ----------
const LONG = 'Quarterly Revenue and Customer Retention Overview for the Northern';
const w = await serverClient(ROOT, {});
try {
  const plan = async (extra) => w.call('plan_layout', Object.assign({ path: 'hp/Health Test.SemanticModel', name: 'Growth', title: LONG, page: '960x720', layout: 'exec', lang: 'en' }, extra || {}));
  for (const lang of ['en', 'ar']) {
    const two = await plan({ lang }), one = await plan({ lang, secondPage: false });
    const sl = (r) => (r.j && r.j.slots) || [], by = (r, k) => sl(r).find((s) => s.kind === k) || {};
    // the writer's own measure for these pages: fitOptions on the report's two pages and its title (pbip-page fitOf)
    const d = two.j && two.j.design, specs = d ? E.projectPages(d.layout, lang, { second: true }) : [];
    const fo = d ? Pbip.fitOptions({ lang, rtl: E.rtl(d.layout, lang), font: d.font, theme: E.buildTheme(d, lang), model: { byPath: 'M.SemanticModel' }, title: LONG, bind: { date: null, slicers: [] }, pages: specs.map((p) => ({ name: p.name, page: p.page, slots: p.slots, grow: true })) })[0] : {};
    const grow = +fo.headerRows || 0;
    chk(() => grow > 0, () => `S1a ${lang}. guard: the writer grows the header for this title's two rows of page tabs (headerRows ${grow})`);
    chk(() => by(two, 'title').h === by(one, 'title').h + grow && by(two, 'logo').h === by(one, 'logo').h + grow, () => `S1b ${lang}. the plan's title and logo grow by the writer's ${grow}: ${JSON.stringify([by(two, 'title'), by(one, 'title')])}`);
    const k2 = sl(two).filter((s) => s.kind === 'kpi'), k1 = sl(one).filter((s) => s.kind === 'kpi');
    chk(() => k2.length && k2.length === k1.length && k2.every((s, i) => s.y === k1[i].y + grow && s.x === k1[i].x && s.h === k1[i].h), () => `S1c ${lang}. the KPI cards move down by ${grow}: ${JSON.stringify(k2.map((s) => [s.x, s.y, s.h]))} vs ${JSON.stringify(k1.map((s) => [s.x, s.y, s.h]))}`);
    const fa = two.j && two.j.forAuthoring, k = fa && fa.find((x) => x.kind === 'kpi');
    chk(() => k && k.position.y === k2[0].y || (k && k2.some((s) => s.y === k.position.y)), () => `S1d ${lang}. forAuthoring gives the same positions: ${JSON.stringify(k)}`);
    // and the written pages (create_report's build, in memory) put the cards there
    const m = loadModel('hp/Health Test.SemanticModel', { root: ROOT });
    const built = d ? PL.plannedReport({ m, tables: m.tables, design: d, lang }, { second: true, title: LONG }) : null, pg = built && built.files ? boxes(built.files)[0] : null;
    const cards = pg ? pg.visuals.filter((v) => v.type === 'cardVisual' && !v.panel) : [];
    chk(() => cards.length && k2.every((s) => cards.some((v) => Math.abs(v.y - s.y) <= 1)), () => `S1e ${lang}. the written cards are where the plan says: written y ${JSON.stringify(cards.map((v) => v.y))}, planned ${JSON.stringify(k2.map((s) => s.y))}`);
    chk(() => by(one, 'title').h === 32 && by(one, 'title').y === 12, () => `S1f ${lang}. guard: one page (no tabs): the title as before: ${JSON.stringify(by(one, 'title'))}`);
  }
} finally { await w.close(); }

// ---------- 0.2.9-writer-S10: the gap beside a shortened rail, as measured (not changed here) ----------
{
  const gapOf = (preset, n, k) => {
    const l0 = { preset, kpis: E.LAYOUTS[preset].kpis, filters: true, fpos: 'start', header: true, page: '1920x1080' }, pages = E.projectPages(l0, 'en', { second: true });
    const slicers = [{ t: 'S', c: 'A', type: 'string' }, { t: 'S', c: 'B', type: 'string' }, { t: 'S', c: 'C', type: 'string' }].slice(0, n);
    const fo = Pbip.fitOptions({ lang: 'en', font: 'Segoe UI', theme: E.buildTheme({ layout: l0 }, 'en'), model: { byPath: 'M.SemanticModel' }, bind: { date: { t: 'D', c: 'Date', type: 'dateTime' }, slicers }, pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, grow: true })) });
    const f = E.fitSlots(pages[k].slots, fo[k]).slots, rail = f.find((s) => s.kind === 'slicer' && s.stack), B = rail.y + rail.h;
    const under = f.filter((s) => s !== rail && s.x < rail.x + rail.w && s.x + s.w > rail.x && s.y >= B).map((s) => s.y);
    return Math.round((under.length ? Math.min(...under) : 1080) - B);
  };
  const got = [gapOf('exec', 2, 0), gapOf('exec', 3, 0), gapOf('ops', 2, 0), gapOf('ops', 3, 0), gapOf('exec', 3, 1)];
  chk(() => JSON.stringify(got) === JSON.stringify([392, 308, 329, 245, 197]), () => `S10. the gaps under a shortened rail beside a row, as measured in SQ13.md (exec 2 and 3 slicers, ops 2 and 3, a second page): ${JSON.stringify(got)}`);
}

// ---------- R1-see-the-result-S3: no picture of slots the writer doesn't write ----------
{
  const m = loadModel('nom/M.SemanticModel', { root: ROOT }), design = planLayout({ layout: 'exec', lang: 'en' }).design;
  const pv = get(() => PL.planPreview({ m, tables: m.tables, design, lang: 'en', second: true }));
  chk(() => pv && pv.from !== 'slots' && Array.isArray(pv.pages) && pv.pages.length === 0, () => `R1-S3a. a plan whose report can't be built in memory draws no slots: ${JSON.stringify(pv && { from: pv.from, pages: (pv.pages || []).length })}`);
  chk(() => pv && /not|no /i.test(String(pv.why || '')), () => `R1-S3b. and says why: ${JSON.stringify(pv && pv.why)}`);
  const m2 = loadModel('cal/M.SemanticModel', { root: ROOT }), ok = get(() => PL.planPreview({ m: m2, tables: m2.tables, design, lang: 'en', second: true }));
  chk(() => ok && ok.pages && ok.pages.length === 2 && ok.from !== 'none', () => `R1-S3c. guard: a model with measures keeps its two written pages: ${JSON.stringify(ok && { from: ok.from, n: (ok.pages || []).length })}`);
}

// ---------- V1-S2: the labels note in plain words ----------
{
  chk(() => !/unknown/i.test(P.WORDS.en.labels) && !/غير معروف/.test(P.WORDS.ar.labels), () => `V1-S2a. the note names nothing "unknown": ${JSON.stringify([P.WORDS.en.labels, P.WORDS.ar.labels])}`);
  chk(() => /data/i.test(P.WORDS.en.labels) && /بيانات/.test(P.WORDS.ar.labels), () => `V1-S2b. it says the labels come from the data, in both languages: ${JSON.stringify([P.WORDS.en.labels, P.WORDS.ar.labels])}`);
  const svg = P.render({ w: 1280, h: 720, visuals: [{ type: 'lineChart', x: 10, y: 10, w: 600, h: 300, title: 'Sales', category: 'Period' }] }, { lang: 'ar' });
  chk(() => svg.includes('data-note="labels"') && svg.includes(P.WORDS.ar.labels), () => 'V1-S2c. guard: the note is still drawn, in the page\'s language');
}

// ---------- V1-S4: which way time runs, on a chart over time ----------
{
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const colRef = (t, c) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: c } });
  const visual = (name, type, cat, extra) => ({ name, position: { x: 20, y: 20, z: 1, width: 600, height: 300 }, visual: Object.assign({ visualType: type, query: { queryState: { Category: { projections: [{ field: colRef(cat[0], cat[1]), queryRef: cat.join('.') }] }, Y: { projections: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } }, queryRef: 'Sales.Total Sales' }] } } } }, extra || {}) });
  const files = (v) => [{ path: 'definition/pages/pages.json', data: JSON.stringify({ pageOrder: ['p1'] }) }, { path: 'definition/pages/p1/page.json', data: JSON.stringify({ name: 'p1', displayName: 'One', width: 1280, height: 720 }) },
    { path: 'definition/pages/p1/visuals/v1/visual.json', data: JSON.stringify(v) }];
  const one = (v, rtl) => (P.fromFiles(files(v), { rtl })[0] || { visuals: [] }).visuals[0] || {};
  const sortBy = (f, dir) => ({ sortDefinition: { sort: [{ field: f, direction: dir }], isDefaultSort: true } });
  const plainLine = visual('a', 'lineChart', ['Calendar', 'Month']);
  const descLine = visual('b', 'lineChart', ['Calendar', 'Month']); descLine.visual.query = Object.assign(descLine.visual.query, sortBy(colRef('Calendar', 'Month'), 'Descending'));
  const invLine = visual('c', 'lineChart', ['Calendar', 'Date'], { objects: { categoryAxis: [{ properties: { invertAxis: lit('true') } }] } });
  const catInv = visual('d', 'lineChart', ['Calendar', 'Month'], { objects: { categoryAxis: [{ properties: { invertAxis: lit('true'), axisType: lit("'Categorical'") } }] } });
  const byRegion = visual('e', 'clusteredColumnChart', ['Sales', 'Region']); byRegion.visual.query = Object.assign(byRegion.visual.query, sortBy({ Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Sales' } }, 'Descending'));
  const colMonths = visual('f', 'clusteredColumnChart', ['Calendar', 'Month']); colMonths.visual.query = Object.assign(colMonths.visual.query, sortBy(colRef('Calendar', 'Month'), 'Descending'));
  const got = [one(plainLine).timeDir, one(descLine, true).timeDir, one(invLine, true).timeDir, one(catInv).timeDir, one(byRegion).timeDir, one(colMonths, true).timeDir];
  chk(() => JSON.stringify(got) === JSON.stringify(['ltr', 'rtl', 'rtl', 'ltr', undefined, 'rtl']), () => `V1-S4a. the direction read from the chart's settings (by month ascending, sorted descending, invertAxis on a continuous axis, invertAxis on a categorical axis (ignored), a column chart by region, by month descending): ${JSON.stringify(got)}`);
  const svgOf = (v, rtl) => P.render(P.fromFiles(files(v), { rtl })[0], { lang: rtl ? 'ar' : 'en' });
  const arrow = (svg) => (/<path class="td" data-time="(ltr|rtl)" d="M([\d.]+),([\d.]+) L([\d.]+),([\d.]+)/.exec(svg) || []).slice(1);
  const a1 = arrow(svgOf(plainLine)), a2 = arrow(svgOf(descLine, true));
  chk(() => a1[0] === 'ltr' && +a1[3] > +a1[1] && a2[0] === 'rtl' && +a2[3] < +a2[1], () => `V1-S4b. an arrow on the axis points toward later time (left to right in English, right to left on the Arabic page): ${JSON.stringify([a1, a2])}`);
  chk(() => !/class="td"/.test(svgOf(byRegion)) && !/class="td"/.test(P.render(P.fromSlots([{ kind: 'line', x: 0, y: 0, w: 400, h: 300 }], { w: 1280, h: 720 }))), () => 'V1-S4c. no arrow on a chart by a category that is not time, nor on a page drawn from slots (nothing says how its time runs)');
  // the report's own pages: create_report's build in English and Arabic (its charts over time as the writer turns them)
  const { reportRun } = await import('./lib/report-run.mjs'), { withLookDefaults } = await import('./lib/report-inputs.mjs');
  for (const [lang, want] of [['en', 'ltr'], ['ar', 'rtl']]) {
    const design = planLayout({ layout: 'exec', lang }).design, built = get(() => reportRun(withLookDefaults({ path: 'cal/M.SemanticModel', name: 'Time', lang, design, secondPage: false }), 'build'));
    const files0 = built.files ? built.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data })) : [];
    const pg = P.fromFiles(files0, { rtl: lang === 'ar' })[0], line = pg ? pg.visuals.find((v) => v.type === 'lineChart') : null;
    chk(() => line && line.timeDir === want, () => `V1-S4d ${lang}. the written line chart over time reads ${want}: ${JSON.stringify(line && { cat: line.category, t: line.timeDir })}`);
    chk(() => !files0.some((f) => /"timeDir"|data-time/.test(typeof f.data === 'string' ? f.data : new TextDecoder().decode(f.data))), () => `V1-S4e ${lang}. nothing of the cue is in the written files`);
  }
}

// ---------- L2-S1: a SWITCH's results, not its compared texts ----------
{
  const t = (expression) => ({ name: 'T', columns: [{ name: 'Band', dataType: 'string', expression }] });
  const f = (e) => Bind.fieldOf(t(e), 'Band') || {};
  const sw4 = f('SWITCH ( [Code], "A", "Alpha", "B", "Beta" )'), sw3 = f('SWITCH ( [Code], "A", "Alpha", "B", "Beta", "Other" )');
  chk(() => sw4.two === true && !sw4.few && JSON.stringify(sw4.texts) === '["Alpha","Beta"]', () => `L2-S1a. SWITCH comparing two texts with two results: two values (Alpha, Beta), not few 4: ${JSON.stringify(sw4)}`);
  chk(() => sw3.few === 3 && !sw3.two && JSON.stringify(sw3.texts) === '["Alpha","Beta","Other"]', () => `L2-S1b. with an else: three values: ${JSON.stringify(sw3)}`);
  const ifs = f('IF ( [Code] = "A", "Alpha", IF ( [Code] = "B", "Beta", "Gamma" ) )');
  chk(() => ifs.few === 3 && JSON.stringify(ifs.texts) === '["Alpha","Beta","Gamma"]', () => `L2-S1c. nested IFs: their branches only, the compared texts not counted: ${JSON.stringify(ifs)}`);
  const tr = f('SWITCH ( TRUE (), [Amount] > 100, "High", [Amount] > 10, "Mid", "Low" )');
  chk(() => tr.few === 3 && JSON.stringify(tr.texts) === '["High","Mid","Low"]', () => `L2-S1d. SWITCH ( TRUE (), ... ) as before: ${JSON.stringify(tr)}`);
  const open = f('SWITCH ( [Code], "A", "Alpha", "B", [Other], "Gamma" )');
  chk(() => !open.few && !open.two && !open.texts, () => `L2-S1e. a result that is not a text (a column): its values are not known, no count: ${JSON.stringify(open)}`);
  const quoted = f('IF ( [Flag], "Say ""yes""", "No, thanks" )');
  chk(() => quoted.two === true && JSON.stringify(quoted.texts) === '["Say \\"yes\\"","No, thanks"]', () => `L2-S1f. a comma and doubled quotes inside a text: ${JSON.stringify(quoted)}`);
  const plain = f('IF ( [Flag], "Yes", "No" )');
  chk(() => plain.two === true && !plain.few, () => `L2-S1g. guard: IF of two texts is two values: ${JSON.stringify(plain)}`);
}

// ---------- 0.2.9-reader-S13: no type is unknown, never text ----------
{
  const T = { name: 'T', columns: [{ name: 'Month Name' }, { name: 'Month Number' }, { name: 'Code' }] };
  const fo = Bind.fieldOf(T, 'Code') || {};
  chk(() => fo.type === 'unknown', () => `R-S13a. a column given with no type is unknown in fieldOf: ${JSON.stringify(fo)}`);
  const sb = Bind.sortColumnFor(T.columns, 'Month Name');
  chk(() => sb && sb.name === 'Month Number', () => `R-S13b. "Month Number" with no type is read by its name (a number), so it sorts "Month Name", as a DAX table's: ${JSON.stringify(sb)}`);
  const src = fs.readFileSync(path.join(HERE, '../assets/js/pbip-bind.js'), 'utf8');
  chk(() => !/dataType \|\| 'string'|type \|\| 'string'/.test(src), () => 'R-S13c. pbip-bind.js has no "|| \'string\'" type fallback left');
}

// ---------- 0.2.9-design-S2: the plan's lint, with the plan's table fields ----------
{
  const m = loadModel('cal/M.SemanticModel', { root: ROOT }), design = planLayout({ layout: 'exec', lang: 'en', page: '960x720' }).design;
  const table = ['Sales[Region]', 'Sales[Channel]', 'Sales[Product]', 'Sales[Segment]', 'Sales[Total Sales]', 'Sales[Orders]'];
  const F = fieldsAndProblems(m.tables, { table }).out, built = PL.plannedReport({ m, tables: m.tables, design, lang: 'en', F }, { second: false });
  const tw = (sl) => (sl.find((s) => s.kind === 'table') || {}).w;
  const want = tw(E.projectPages(Object.assign({}, design.layout, { wideTable: true }), 'en', { tableFields: 6 })[0].slots), old = tw(E.projectPages(Object.assign({}, design.layout, { wideTable: true }), 'en', {})[0].slots);
  chk(() => want > old, () => `S2a. guard: 6 fields take a wider share than 4 on a 960-wide row: ${want} vs ${old}`);
  chk(() => built.pages && tw(built.pages[0].slots) === want, () => `S2b. the linted page's table is ${want} wide (6 fields), as create_report's: ${built.pages ? tw(built.pages[0].slots) : JSON.stringify(built)}`);
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.1-sq13.mjs cause=${problems.length} of ${checks} checks`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sq13  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sq13  ${checks} checks`);
