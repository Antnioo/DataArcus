// FN1C (0.3.2): three writer and twin functions split into named steps, behaviour identical. The parts no other suite
// turned red under a mutant, pinned to their output on ca3a1b73 (red there under each part's mutant first):
//   H1-H3  lib/shadow-model.mjs shadowModel: the files, tables, guesses and notes of the shadow of five fixture models
//          and two made-up ones with the hard cases (a calculation group, a field parameter, a true/false key, a 1:1 and
//          a many-to-many relationship, sort-by columns, a calculated column a relationship needs, an Arabic model,
//          what is left out; a second one: an Arabic culture with English names, text sorted by text and by a key,
//          names that make the same file name), in both forms (m, dax) and with other row counts, byte for byte (fixtures/fn1c-shadow.json)
//   P1-P3  lib/twin-plan.mjs planTwin: the whole plan (its answer, texts, labels, what stays English, the terminology
//          sheet) of five runs over a made-up project with the shapes the plan says a line for (fixtures/fn1c-twin.mjs):
//          matrices chosen flat or refused, the kinds that cannot mirror, a card grid, a flip card, a field parameter's
//          slicer, bar lists, a badge, legends, a running calculation, wide tables, a picture page, labels by id and by
//          words, the copy in both languages, and no model; byte for byte as on ca3a1b73 (fixtures/fn1c-plans.json)
//   W1-W2  assets/js/pbip-page.js write: every file and the whole result of ten builds of the shared writer (as sp28
//          builds), with what no other build has: a designed header grown by a second row of page tabs, two pages of one
//          name with their tabs in two rows, report texts without the groups' names,
//          four charts coloured each by its own category, two measures that differ only by a direction mark, charts
//          of a model without measures whose titles would be the same (English, Arabic; more
//          of them than the sentences for one column; one fixed title over two columns); byte for byte as on ca3a1b73
//          (fixtures/fn1c-builds.json)
//   node test-0.3.2-fn1c.mjs            (--record writes the fixture: only on the base, never to make a split pass)
import './fixtures/sp1/seeded-random.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url)), FIX = path.join(HERE, 'fixtures', 'fn1c-shadow.json'), FIX2 = path.join(HERE, 'fixtures', 'fn1c-plans.json'), FIX3 = path.join(HERE, 'fixtures', 'fn1c-builds.json');
const RECORD = process.argv.includes('--record');
const problems = []; let checks = 0;
const chk = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
const digest = (x) => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');

// a made-up model with the hard cases (made-up names only)
const made = { compatibilityLevel: 1550, model: { culture: 'ar-AE', discourageImplicitMeasures: true, tables: [
  { name: 'Orders', columns: [
    { name: 'Order Id', dataType: 'int64', sourceColumn: 'Order Id', summarizeBy: 'none' },
    { name: 'Order Date', dataType: 'dateTime', sourceColumn: 'Order Date', formatString: 'Short Date' },
    { name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code' },
    { name: 'Is Gift', sourceColumn: 'Is Gift' },
    { name: 'Net', dataType: 'decimal', sourceColumn: 'Net', formatString: '#,0.00', description: 'made up' },
    { name: 'Discount Rate', dataType: 'double', sourceColumn: 'Discount Rate', formatString: '0.0%' },
    { name: 'Order Year', dataType: 'int64', sourceColumn: 'Order Year' },
    { name: 'Channel', dataType: 'string', sourceColumn: 'Channel', sortByColumn: 'Channel Order', displayFolder: 'Sales' },
    { name: 'Channel Order', dataType: 'int64', sourceColumn: 'Channel Order', isHidden: true },
    { name: 'Region Key', type: 'calculated', dataType: 'string', expression: 'LEFT ( [Shop Code], 2 )' },
    { name: 'Net x2', type: 'calculated', dataType: 'double', expression: '[Net] * 2' },
    { name: 'Odd', dataType: 'binary', sourceColumn: 'Odd' },
    { name: 'rowNumber', type: 'rowNumber' }],
  measures: [{ name: 'Total Net', expression: 'SUM ( Orders[Net] )', formatString: '#,0', isHidden: false, displayFolder: 'KPIs' },
    { name: 'Net Fmt', expression: ['SUM (', '    Orders[Net]', ')'], formatStringDefinition: { expression: '"#,0"' } }],
  partitions: [{ name: 'Orders', mode: 'import', source: { type: 'm', expression: 'let S = 1 in S' } }] },
  { name: 'Shops', isHidden: true, columns: [
    { name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code', isKey: true },
    { name: 'Shop Name', dataType: 'string', sourceColumn: 'Shop Name' },
    { name: 'Opened', dataType: 'dateTime', sourceColumn: 'Opened' }],
  partitions: [{ name: 'Shops', mode: 'import', source: { type: 'm', expression: 'let S = 1 in S' } }] },
  { name: 'Regions', columns: [
    { name: 'Region Key', sourceColumn: 'Region Key', isKey: true },
    { name: 'اسم المنطقة', dataType: 'string', sourceColumn: 'اسم المنطقة' }] },
  { name: 'Gift Flags', columns: [{ name: 'Is Gift', dataType: 'boolean', sourceColumn: 'Is Gift' }, { name: 'Label', dataType: 'string', sourceColumn: 'Label' }] },
  { name: 'Shop Extra', columns: [{ name: 'Shop Code', dataType: 'string', sourceColumn: 'Shop Code' }, { name: 'Floor Area', dataType: 'double', sourceColumn: 'Floor Area' }] },
  { name: 'Targets', columns: [{ name: 'Channel', dataType: 'string', sourceColumn: 'Channel' }, { name: 'Target', dataType: 'double', sourceColumn: 'Target' }] },
  { name: 'التقويم', dataCategory: 'Time', columns: [
    { name: 'التاريخ', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Date]', isKey: true },
    { name: 'Year', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Year]' },
    { name: 'Month Number', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Number]' },
    { name: 'Month Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Month Name]', sortByColumn: 'Month Number' },
    { name: 'Day Name', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day Name]', sortByColumn: 'Day of Week' },
    { name: 'Day of Week', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Day of Week]' },
    { name: 'Is Weekend', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Is Weekend]' },
    { name: 'Week', type: 'calculatedTableColumn', dataType: 'unknown', sourceColumn: '[Week]' }],
  hierarchies: [{ name: 'Calendar', isHidden: true, levels: [{ name: 'Month', ordinal: 1, column: 'Month Name' }, { name: 'Year', ordinal: 0, column: 'Year' }] }],
  partitions: [{ name: 'التقويم', mode: 'import', source: { type: 'calculated', expression: 'CALENDARAUTO ()' } }] },
  { name: 'Time Calc', calculationGroup: { precedence: 2, calculationItems: [{ name: 'Current', expression: 'SELECTEDMEASURE ()', ordinal: 0 },
    { name: 'YTD', expression: ['CALCULATE (', '    SELECTEDMEASURE (),', '    DATESYTD ( \'التقويم\'[التاريخ] )', ')'], ordinal: 1, formatStringDefinition: { expression: '"0.0"' } }] },
  columns: [{ name: 'Time Calc', dataType: 'string', sourceColumn: 'Name' }], partitions: [{ name: 'Time Calc part', source: { type: 'calculationGroup' } }] },
  { name: 'Pick', columns: [
    { name: 'Pick', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value1]', sortByColumn: 'Pick Order', relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Pick Fields' }] } },
    { name: 'Pick Fields', type: 'calculatedTableColumn', dataType: 'string', sourceColumn: '[Value2]', isHidden: true, extendedProperties: [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }, { type: 'string', name: 'Other', value: 'x' }] },
    { name: 'Pick Order', type: 'calculatedTableColumn', dataType: 'int64', sourceColumn: '[Value3]', isHidden: true }],
  partitions: [{ name: 'Pick', mode: 'import', source: { type: 'calculated', expression: '{ ("Total Net", NAMEOF(\'Orders\'[Total Net]), 0) }' } }] }],
relationships: [
  { name: 'o-cal', fromTable: 'Orders', fromColumn: 'Order Date', toTable: 'التقويم', toColumn: 'التاريخ' },
  { fromTable: 'Orders', fromColumn: 'Shop Code', toTable: 'Shops', toColumn: 'Shop Code' },
  { fromTable: 'Orders', fromColumn: 'Region Key', toTable: 'Regions', toColumn: 'Region Key' },
  { fromTable: 'Orders', fromColumn: 'Is Gift', toTable: 'Gift Flags', toColumn: 'Is Gift' },
  { name: 'one-one', fromTable: 'Shop Extra', fromColumn: 'Shop Code', toTable: 'Shops', toColumn: 'Shop Code', fromCardinality: 'one', toCardinality: 'one', crossFilteringBehavior: 'bothDirections' },
  { name: 'many-many', fromTable: 'Targets', fromColumn: 'Channel', toTable: 'Orders', toColumn: 'Channel', fromCardinality: 'many', toCardinality: 'many', isActive: false },
  { name: 'gone', fromTable: 'Orders', fromColumn: 'Order Id', toTable: 'Nowhere', toColumn: 'Id' }],
roles: [{ name: 'r' }], perspectives: [{ name: 'p' }], cultures: [{ name: 'ar-AE' }], expressions: [{ name: 'e' }], dataSources: [{ name: 'd' }], functions: [{ name: 'f' }] } };

// a second made-up model: an Arabic culture with English names (the weekend Friday and Saturday), a text sorted by
// a text, a text sorted by a key column, and table names that make the same file name
const made2 = { model: { culture: 'ar-SA', tables: [
  { name: 'Calendar', dataCategory: 'Time', columns: [
    { name: 'Date', dataType: 'dateTime', sourceColumn: 'Date', isKey: true },
    { name: 'Day Name', dataType: 'string', sourceColumn: 'Day Name', sortByColumn: 'Day Number' },
    { name: 'Day Number', dataType: 'int64', sourceColumn: 'Day Number' },
    { name: 'Is Weekend', dataType: 'boolean', sourceColumn: 'Is Weekend' }] },
  { name: 'Items', columns: [
    { name: 'Item Key', dataType: 'string', sourceColumn: 'Item Key' },
    { name: 'Size', dataType: 'string', sourceColumn: 'Size', sortByColumn: 'Size Code' },
    { name: 'Size Code', dataType: 'string', sourceColumn: 'Size Code' },
    { name: 'Item Label', dataType: 'string', sourceColumn: 'Item Label', sortByColumn: 'Item Key' }] },
  { name: 'Item Stock', columns: [{ name: 'Item Key', dataType: 'string', sourceColumn: 'Item Key', isKey: true }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }] },
  { name: 'Moves', columns: [{ name: 'Day', dataType: 'dateTime', sourceColumn: 'Day' }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }] },
  { name: 'Notes/One', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'Notes_One', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'notes_one', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] },
  { name: 'Trail.', columns: [{ name: 'Text', dataType: 'string', sourceColumn: 'Text' }] }],
relationships: [
  { name: 'stock', fromTable: 'Items', fromColumn: 'Item Key', toTable: 'Item Stock', toColumn: 'Item Key' },
  { name: 'moves', fromTable: 'Moves', fromColumn: 'Day', toTable: 'Calendar', toColumn: 'Date' }] } };

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-fn1c-')));
const got = {};
try {
  const cp = (from, to) => fs.cpSync(path.join(HERE, from), path.join(ROOT, to), { recursive: true });
  cp('test-models/arabic-long-names', 'arabic'); cp('test-models/no-measures', 'plain'); cp('fixtures/health-project', 'health'); cp('fixtures/twin-project', 'twin');
  cp('test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('./lib/model.mjs');
  const { shadowModel } = await import('./lib/shadow-model.mjs');
  const models = { made, made2 };
  for (const k of ['plain', 'arabic', 'large', 'health', 'twin']) models[k] = loadModel(k, { root: ROOT }).tmsl;
  const OPTS = { m: undefined, dax: { form: 'dax' }, rows: { rows: { dim: 3, fact: 17, date: 40, alone: 5 } }, daxRows: { form: 'dax', rows: { dim: 2, date: 31 } } };
  for (const [k, tm] of Object.entries(models)) for (const [o, opts] of Object.entries(OPTS)) {
    if (k === 'large' && o !== 'm') continue;
    const sh = shadowModel(tm, opts);
    got[k + '/' + o] = { files: digest(sh.files), tables: digest(sh.tables), guessed: digest(sh.guessed), notes: digest(sh.notes), n: sh.files.length };
  }
} catch (e) { fs.rmSync(ROOT, { recursive: true, force: true }); throw e; }

// ---- the twin's plan: five runs over the made-up project ----
const plans = {};
const ROOT2 = fs.realpathSync.native(ROOT);   // (the working folder the model reader took first)
try {
  const F = await import('./fixtures/fn1c-twin.mjs');
  const { planTwin } = await import('./lib/twin-plan.mjs');
  const norm = (x) => JSON.stringify(x, (k, v) => (Buffer.isBuffer(v) || v instanceof Uint8Array ? 'bytes:' + digest(Buffer.from(v).toString('base64')) : v instanceof Map ? [...v] : v instanceof Set ? [...v] : typeof v === 'function' ? 'fn' : v))
    .split(JSON.stringify(ROOT2).slice(1, -1)).join('<ROOT>').split(ROOT2).join('<ROOT>').split('\\\\').join('/');   // (a Windows path's separators, as sp11's norm)
  const one = (P) => ({ answer: norm(P.answer), texts: norm(P.texts), labels: norm(P.labels), rest: norm({ mixedTitles: P.mixedTitles, textsUnknown: P.textsUnknown, notTranslated: P.notTranslated, termRows: P.termRows, addedVisuals: P.addedVisuals, same: P.same, outBase: P.outBase, month: P.month, names: P.names, terms: P.terms, modelPrint: P.modelPrint }) });
  const ID = '00000000-0000-4000-8000-0000000000f1', pb = (d) => path.join(d, 'Twin Sales.pbip');
  const a = F.makeProject(path.join(ROOT2, 'twin-a')), b = F.noModel(F.makeProject(path.join(ROOT2, 'twin-b')));
  const r1 = planTwin({ path: pb(a), logicalId: ID, matrixAsTable: ['mGrouped', 'p4more/mCols', 'nothere'] });
  // labels: every text an Arabic of its own but the page buttons (they take their page's) and the titles that change
  // with the selection (one given by a column is then mixed), and a text by its words
  const labels = {}; r1.texts.forEach((t, i) => { if (t.kind !== 'button' && t.kind !== 'dynamicTitle' && i % 5 !== 4) labels[t.id] = 'نص عربي ' + (i + 1); }); labels.unknownId = 'x';
  const runs = {
    r1,
    r2: planTwin({ path: pb(a), logicalId: ID, into: 'same', timeRightToLeft: false, waterfallRtl: 'mirror', arabicMonth: false }),
    r3: planTwin({ path: pb(a), logicalId: ID, labels, textLabels: { 'Back to start': 'العودة إلى البداية', 'Not a text here': 'لا' }, textsFrom: 3, termsFrom: 1 }),
    r4: planTwin({ path: pb(b), logicalId: ID, mirrorPicturePages: true }),
    r5: planTwin({ path: pb(a), logicalId: ID, labels, into: 'same', tabsShown: 'ar', flipPictures: true }),
  };
  Object.entries(runs).forEach(([k, P]) => { plans[k] = Object.fromEntries(Object.entries(one(P)).map(([x, t]) => [x, digest(t)])); plans[k].size = one(P).answer.length; });
} finally { fs.rmSync(ROOT2, { recursive: true, force: true }); }

// ---- the report page writer: four builds (sp28's way, a made-up model) ----
const builds = {};
{
  const require = createRequire(import.meta.url), Px = require('../assets/js/pbip-export.js'), E = require('../assets/js/design-engine.js');
  const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
  const bind = { kpis: [M('Total Sales', { wholeFormat: '#,0' }), M('Orders'), M('Margin %', { pct: true, pctFormat: '0.0%' })], measure: M('Total Sales'), date: C('Month Name', { sortBy: { t: 'Calendar', c: 'Month Number' } }, 'Calendar'),
    cats: { bar: C('City'), column: C('Channel'), donut: C('Segment'), funnel: C('Stage'), treemap: C('Product'), map: C('City') }, catPool: [C('City'), C('Channel'), C('Segment')],
    table: [C('City'), M('Total Sales'), M('Orders')], slicers: [C('City'), C('Channel'), C('Segment')], tip: { card: M('Total Sales'), cat: C('Segment'), y: M('Orders') } };
  // names: six designed pages, long names (two of them the same), so the tabs take two rows and the header grows
  const NAMES = ['Executive summary of the year', 'Regional performance by city', 'Regional performance by city', 'Channel and segment detail', 'Products and their returns', 'Notes and definitions'];
  const run = (lang, o) => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; d.layout = Object.assign({}, d.layout, o.layout || {}); E.repairState(d);
    const sp = E.projectPages(d.layout, lang, { second: false, panel: !!o.panel })[0];
    const pages = (o.names || NAMES).map((name) => ({ name, page: sp.page, slots: sp.slots, panel: sp.panel, png: new Uint8Array([1, 2]), grow: true }));
    const texts = Object.assign({}, E.REPORT_TEXTS[lang], o.texts || {});
    return Px.build(Object.assign({ name: 'FN1C', title: 'FN1C', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false, model: { byPath: 'M.SemanticModel' }, bind, texts, pages }, o.more || {})); };
  const RUNS = { w1: () => run('en', {}), w2: () => run('ar', { panel: true, names: NAMES.map((n, i) => 'صفحة التقرير الطويلة رقم ' + (i % 5 + 1)) }),
    w3: () => run('en', { texts: { kpis: '', header: '', filters: '' }, layout: { filters: true, fpos: 'start' } }), w4: () => run('en', { layout: { preset: 'analysis', page: '1920x1080' }, names: NAMES.slice(0, 4) }),
    // w5: hand-placed, charts coloured by their category (three keys and more), two measures that differ only by a
    // direction mark (a "No data" measure each, the second "(2)")
    w5: () => { const d = E.fresh(); E.repairState(d); const Sl = (kind, x, y, w, h) => ({ kind, x, y, w, h }), RLO = '\u202E';
      const b5 = Object.assign({}, bind, { kpis: [M('Sales'), M('Sales' + RLO)], measure: M('Sales'), y: { bar: M('Sales' + RLO) } });
      const pages = [{ name: 'Hand', page: { w: 1280, h: 720 }, hand: true, panel: null, png: new Uint8Array([3]), slots: [Sl('title', 24, 12, 400, 56), Sl('logo', 1136, 12, 120, 56), Sl('kpi', 24, 80, 300, 90), Sl('kpi', 340, 80, 300, 90),
        Sl('column', 24, 190, 400, 250), Sl('bar', 440, 190, 400, 250), Sl('column', 856, 190, 400, 250), Sl('bar', 24, 456, 400, 250), Sl('donut', 440, 456, 400, 250), Sl('line', 856, 456, 400, 250)] }];
      return Px.build({ name: 'FN1C hand', title: 'FN1C hand', pageName: 'Hand', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' }, bind: b5, texts: E.REPORT_TEXTS.en, pages, chartColors: 'gradient' }); },
    // w6: four bar and column charts, each by its own category, coloured by it (the report's colour keys, four of them)
    w6: () => { const d = E.fresh(); E.repairState(d); const Sl = (kind, x, y, w, h) => ({ kind, x, y, w, h });
      const pages = [{ name: 'Colours', page: { w: 1280, h: 720 }, hand: true, panel: null, png: new Uint8Array([4]), slots: [Sl('title', 24, 12, 400, 56), Sl('logo', 1136, 12, 120, 56),
        Sl('column', 24, 190, 400, 250), Sl('bar', 440, 190, 400, 250), Sl('column', 856, 190, 400, 250), Sl('bar', 24, 456, 400, 250)] }];
      return Px.build({ name: 'FN1C colours', title: 'FN1C colours', pageName: 'Colours', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' },
        bind: Object.assign({}, bind, { catPool: [C('City'), C('Channel'), C('Segment'), C('Product')] }), texts: E.REPORT_TEXTS.en, pages, chartColors: 'gradient' }); },
    // w7, w8: a model without measures (a count of a column, Function 5), several charts by the same column and by two
    // columns, English and Arabic: titles that would be the same, told apart (a number, the column, another sentence)
    ...Object.fromEntries(['en', 'ar'].map((lang, i) => ['w' + (7 + i), () => { const d = E.fresh(); if (lang === 'ar') d.font = 'Tahoma'; E.repairState(d); const Sl = (kind, x, y, w, h, more) => Object.assign({ kind, x, y, w, h }, more || {});
      const cnt = { t: T, c: 'Order Id', agg: 5 }, R0 = C('Region'), R1 = C('Channel');
      const b = { kpis: [cnt], measure: cnt, cats: { bar: R0, column: R0, donut: R1, funnel: R0, treemap: R0, map: R0 }, catPool: [R0, R1], table: [R0, cnt], slicers: [R0] };
      const pages = [{ name: lang === 'ar' ? 'المكرر' : 'Same', page: { w: 1280, h: 720 }, hand: true, panel: null, png: new Uint8Array([5]), slots: [Sl('title', 24, 12, 400, 56), Sl('logo', 1136, 12, 120, 56),
        Sl('column', 24, 90, 400, 300), Sl('column', 440, 90, 400, 300), Sl('column', 856, 90, 400, 300), Sl('bar', 24, 400, 400, 300), Sl('bar', 440, 400, 400, 300), Sl('table', 856, 400, 400, 300)] }];
      return Px.build({ name: 'FN1C same', title: 'FN1C same', pageName: pages[0].name, lang, rtl: lang === 'ar', font: d.font, ui: d.ui, theme: E.buildTheme(d, lang), sample: false, model: { byPath: 'M.SemanticModel' }, bind: b, texts: E.REPORT_TEXTS[lang], pages }); }])),
    // w9: more charts by one column (a long name, not cut to a Top N) than its sentences (numbered); w10: one fixed title over twelve charts
    // by two columns (the column said, numbered once its sentences run out)
    ...Object.fromEntries([['w9', 7, null, [C('Fiscal quarter of the order as the finance calendar names it', { cal: { rows: 4, kind: 'quarter' } })]], ['w10', 12, 'Mix', [C('Region'), C('Channel')]]].map(([k, n, ttl, pool]) => [k, () => { const d = E.fresh(); E.repairState(d);
      const cnt = { t: T, c: 'Order Id', agg: 5 }, b = { kpis: [cnt], measure: cnt, cats: { bar: pool[0], column: pool[pool.length - 1], donut: pool[0], funnel: pool[0], treemap: pool[0], map: pool[0] }, catPool: pool, table: [pool[0], cnt], slicers: [pool[0]] };
      const slots = [{ kind: 'title', x: 24, y: 12, w: 400, h: 56 }, { kind: 'logo', x: 1136, y: 12, w: 120, h: 56 }].concat(Array.from({ length: n }, (z, j) => Object.assign({ kind: j % 2 ? 'bar' : 'column', x: 24 + (j % 4) * 310, y: 90 + Math.floor(j / 4) * 205, w: 300, h: 200 }, ttl ? { title: ttl } : {})));
      return Px.build({ name: 'FN1C ' + k, title: 'FN1C ' + k, pageName: 'Many', lang: 'en', rtl: false, font: d.font, ui: d.ui, theme: E.buildTheme(d, 'en'), sample: false, model: { byPath: 'M.SemanticModel' }, bind: b, texts: E.REPORT_TEXTS.en,
        pages: [{ name: 'Many', page: { w: 1280, h: 720 }, hand: true, panel: null, png: new Uint8Array([6]), slots }] }); }])) };
  for (const [k, f] of Object.entries(RUNS)) {
    let r; try { r = f(); } catch (e) { r = { threw: String(e && e.message || e) }; }
    const files = (r.files || []).map((x) => x.path + '\0' + digest(typeof x.data === 'string' ? x.data : Buffer.from(x.data || []).toString('base64'))).join('\n'), rest = Object.assign({}, r); delete rest.files; delete rest.zip;
    builds[k] = { files: digest(files), n: (r.files || []).length, result: digest(JSON.stringify(rest)), tabRows: (r.tabRows || []).length, headerGrew: (r.headerGrew || []).length };
  }
}

if (RECORD) { fs.writeFileSync(FIX, JSON.stringify(got, null, 1) + '\n'); fs.writeFileSync(FIX2, JSON.stringify(plans, null, 1) + '\n'); fs.writeFileSync(FIX3, JSON.stringify(builds, null, 1) + '\n'); console.log('recorded ' + Object.keys(got).length + ' shadows, ' + Object.keys(plans).length + ' plans'); process.exit(0); }
const want = JSON.parse(fs.readFileSync(FIX, 'utf8'));
chk(Object.keys(got).length === Object.keys(want).length && Object.keys(want).length === 25, `H1. the 25 recorded cases are made (got ${Object.keys(got).length})`);
for (const c of Object.keys(want)) {
  const g = got[c] || {};
  chk(g.files === want[c].files && g.n === want[c].n, `H2 ${c}. the shadow's files, byte for byte as on ca3a1b73`);
  chk(g.tables === want[c].tables && g.guessed === want[c].guessed && g.notes === want[c].notes, `H3 ${c}. its tables, guesses and notes as on ca3a1b73`);
}
const wantP = JSON.parse(fs.readFileSync(FIX2, 'utf8'));
chk(Object.keys(plans).length === 5 && Object.keys(wantP).length === 5, `P1. the 5 recorded plans are made (got ${Object.keys(plans).length})`);
for (const k of Object.keys(wantP)) {
  const g = plans[k] || {};
  chk(g.answer === wantP[k].answer && g.size === wantP[k].size, `P2 ${k}. the plan's answer, byte for byte as on ca3a1b73 (${g.size} characters, recorded ${wantP[k].size})`);
  chk(g.texts === wantP[k].texts && g.labels === wantP[k].labels && g.rest === wantP[k].rest, `P3 ${k}. its texts, labels, what stays English and the terminology sheet as on ca3a1b73`);
}
const wantB = JSON.parse(fs.readFileSync(FIX3, 'utf8'));
chk(Object.keys(builds).length === 10 && Object.keys(wantB).length === 10 && wantB.w1.headerGrew > 0 && wantB.w1.tabRows > 0, `W1. the 10 recorded builds are made, a header grown and tabs in two rows among them (got ${JSON.stringify(builds.w1)})`);
for (const k of Object.keys(wantB)) {
  const g = builds[k] || {};
  chk(g.files === wantB[k].files && g.n === wantB[k].n && g.result === wantB[k].result, `W2 ${k}. every file and the whole result of the build, byte for byte as on ca3a1b73`);
}
console.log(problems.length ? `FAIL  fn1c  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  fn1c  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
