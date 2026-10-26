// 0.3.1 NC1 (the owner, 26 Oct: "i have a report of 5 pages having custom visuals can dataarcus reads the report
// replaces all custom visuals with native ones and clean up the clutter"): one hand-made-looking report for the laptop to
// run through the tools unattended (mcp/lab/CUSTOM-VISUALS-LAB.md): plan_layout customVisualsFrom -> approve ->
// create_report ("<name> native"), then the redesign of the native copy, and all three opened in Desktop.
// A made-up Gulf retail model of its own, written here (Sales, Branches, Products, Calendar as typed Power Query rows:
// the night of 6-7 Oct fact, untyped rows load as text); no employer or client data, no real company names.
// Every page mixes native visuals and custom visuals of the kinds people use most, declared as a hand report declares
// them (report.json publicCustomVisuals, visual.json visualType the id); their roles named as the public visuals name
// them where known, else plausibly. The ids are made up in AppSource's shape (a name and a 13-digit number). NO .pbiviz
// package bytes are written (AppSource packages are not ours to ship): Desktop shows "can't display this visual" on each
// custom visual of the original; the checks are on the native copy and the redesign.
// The clutter a hand report has: uneven gaps, one visual a few px off its row, titles in three sizes and three fonts, a
// text box and a shape.
//   node lab/custom-visuals-lab.mjs <empty folder>     (from mcp/; prints the .pbip and the validator's count)
//   node lab/custom-visuals-lab.mjs --list             prints the custom visuals table (mcp/work/NC1.md)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json', version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
  report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
};
const L = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => L("'" + String(s).replace(/'/g, "''") + "'");
const bool = (b) => L(b ? 'true' : 'false');
export const NAME = 'Gulf Retail';

// ---------- the made-up model ----------
const BRANCHES = [['B01', 'Marina Walk', 'Dubai', 'UAE'], ['B02', 'Old Souk', 'Dubai', 'UAE'], ['B03', 'Corniche', 'Abu Dhabi', 'UAE'], ['B04', 'Al Qasba', 'Sharjah', 'UAE'],
  ['B05', 'Olaya', 'Riyadh', 'KSA'], ['B06', 'Tahlia', 'Jeddah', 'KSA'], ['B07', 'West Bay', 'Doha', 'Qatar'], ['B08', 'Seef', 'Manama', 'Bahrain']];
const PRODUCTS = [['P01', 'Dates Gift Box', 'Food'], ['P02', 'Arabic Coffee 500g', 'Food'], ['P03', 'Saffron Tin', 'Food'], ['P04', 'Oud Perfume', 'Beauty'],
  ['P05', 'Rose Water', 'Beauty'], ['P06', 'Bakhoor Set', 'Beauty'], ['P07', 'Prayer Mat', 'Home'], ['P08', 'Brass Lantern', 'Home'],
  ['P09', 'Dallah Pot', 'Home'], ['P10', 'Kandura Fabric', 'Apparel'], ['P11', 'Embroidered Abaya', 'Apparel'], ['P12', 'Silk Shayla', 'Apparel']];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
// every day from 1 January 2025 to 31 October 2026
const DATES = (() => { const out = []; for (let t = Date.UTC(2025, 0, 1); t <= Date.UTC(2026, 9, 31); t += 864e5) out.push(new Date(t)); return out; })();
const q2 = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const dt = (d) => `#datetime(${d.getUTCFullYear()}, ${d.getUTCMonth() + 1}, ${d.getUTCDate()}, 0, 0, 0)`;
const mTable = (cols, rows) => `let Source = #table(type table [${cols.map(([n, t]) => '#"' + n + '" = ' + t).join(', ')}], {${rows.map((r) => '{' + r.join(', ') + '}').join(', ')}}) in Source`;
const TABLES = {
  Sales: { cols: [['Date', 'datetime', 'dateTime'], ['Branch ID', 'text', 'string'], ['Product ID', 'text', 'string'], ['Units', 'Int64.Type', 'int64'],
    ['Amount', 'number', 'double'], ['Amount LY', 'number', 'double'], ['Target', 'number', 'double']],
  rows: () => DATES.filter((d, i) => i % 2 === 0).flatMap((d, i) => [0, 1, 2].map((k) => {
    const b = (i + k * 3) % 8, p = (i * 5 + k * 7) % 12, units = 1 + ((i * 3 + k * 5 + b) % 9), price = 35 + p * 22, amount = units * price;
    return [dt(d), q2(BRANCHES[b][0]), q2(PRODUCTS[p][0]), units, amount, Math.round(amount * (0.82 + ((i + b) % 7) * 0.04)), Math.round(amount * 1.08)];
  })) },
  Branches: { cols: [['Branch ID', 'text', 'string'], ['Branch', 'text', 'string'], ['City', 'text', 'string'], ['Country', 'text', 'string']], rows: () => BRANCHES.map((b) => b.map(q2)) },
  Products: { cols: [['Product ID', 'text', 'string'], ['Product', 'text', 'string'], ['Category', 'text', 'string']], rows: () => PRODUCTS.map((p) => p.map(q2)) },
  Calendar: { cols: [['Date', 'datetime', 'dateTime'], ['Year', 'Int64.Type', 'int64'], ['Month', 'text', 'string'], ['Month Number', 'Int64.Type', 'int64'],
    ['Month Start', 'datetime', 'dateTime'], ['Weekday', 'text', 'string'], ['Weekday Number', 'Int64.Type', 'int64']],
  rows: () => DATES.map((d) => [dt(d), d.getUTCFullYear(), q2(MONTHS[d.getUTCMonth()]), d.getUTCMonth() + 1, dt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))), q2(DAYS[d.getUTCDay()]), d.getUTCDay() + 1]) }
};
const SORT_BY = { Calendar: { Month: 'Month Number', Weekday: 'Weekday Number' } };
const AED = '"AED "#,0';
const MEASURES = [['Total Sales', "SUM ( Sales[Amount] )", AED], ['Sales LY', "SUM ( Sales[Amount LY] )", AED], ['Sales Target', "SUM ( Sales[Target] )", AED],
  ['Sales Max', "[Sales Target] * 1.25", AED], ['Units Sold', "SUM ( Sales[Units] )", '#,0'], ['Orders', "COUNTROWS ( Sales )", '#,0']];
export function model() {
  const tables = Object.entries(TABLES).map(([name, t]) => ({ name, partitions: [{ name, mode: 'import', source: { type: 'm', expression: mTable(t.cols, t.rows()) } }],
    columns: t.cols.map(([n, , type]) => Object.assign({ name: n, dataType: type, sourceColumn: n }, (SORT_BY[name] || {})[n] ? { sortByColumn: SORT_BY[name][n] } : {},
      type === 'int64' || type === 'double' ? { summarizeBy: /Units|Amount|Target/.test(n) ? 'sum' : 'none' } : {})),
    ...(name === 'Sales' ? { measures: MEASURES.map(([m, e, f]) => ({ name: m, expression: e, formatString: f })) } : {}) }));
  const rel = (n, ft, fc, tt, tc) => ({ name: n, fromTable: ft, fromColumn: fc, toTable: tt, toColumn: tc });
  return { compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables,
    relationships: [rel('r-branch', 'Sales', 'Branch ID', 'Branches', 'Branch ID'), rel('r-product', 'Sales', 'Product ID', 'Products', 'Product ID'), rel('r-date', 'Sales', 'Date', 'Calendar', 'Date')] } };
}

// ---------- the fields as PBIR writes them ----------
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: `${t}.${c}`, nativeQueryRef: c });
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: m } }, queryRef: `Sales.${m}`, nativeQueryRef: m });

// ---------- the custom visuals (made-up ids in AppSource's shape; role names as the public visual names them) ----------
const id = (word, n) => word + String(1600000000000 + n);
export const CUSTOM = {
  kpiTile: id('kpiTile', 11), dialGauge: id('dialGauge', 12), drillBar: id('drillBarChart', 13), chip: id('chipSlicer', 21), bullet: id('bulletChart', 22),
  grid: id('dataGrid', 23), cloud: id('wordCloud', 31), tornado: id('tornadoChart', 32), multiCard: id('multiInfoCard', 33), heat: id('calendarHeatmap', 41),
  smooth: id('smoothLineChart', 42), sankey: id('sankeyDiagram', 51), graph: id('forceGraph', 52)
};
// each: page, the visual's name, its type, its roles, what the plan should give (native visualType, or null: not replaced),
// and the custom visual's own format objects (names only matter: the copy drops them and says so)
export const VISUALS_CUSTOM = [
  { page: 1, name: 'cvKpiTile', type: CUSTOM.kpiTile, roles: { Indicator: [mea('Total Sales')], TrendAxis: [col('Calendar', 'Month Start')], Goal: [mea('Sales Target')] }, expect: 'kpi', objects: { indicator: { fontSize: '28D' } } },
  { page: 1, name: 'cvDialGauge', type: CUSTOM.dialGauge, roles: { Value: [mea('Total Sales')], TargetValue: [mea('Sales Target')], Minimum: [mea('Sales LY')], Maximum: [mea('Sales Max')] }, expect: 'gauge', objects: { needle: { show: 'true' } } },
  { page: 1, name: 'cvDrillBar', type: CUSTOM.drillBar, roles: { Category: [col('Branches', 'City'), col('Branches', 'Branch')], Values: [mea('Total Sales')] }, expect: 'clusteredBarChart', objects: { dataLabels: { show: 'true' } } },
  { page: 2, name: 'cvChipSlicer', type: CUSTOM.chip, roles: { Category: [col('Branches', 'Country')] }, expect: 'slicer', objects: { general: { columns: '4D' } } },
  { page: 2, name: 'cvBullet', type: CUSTOM.bullet, roles: { Category: [col('Branches', 'Branch')], Value: [mea('Total Sales')], TargetValue: [mea('Sales Target')] }, expect: 'clusteredBarChart', objects: { labels: { show: 'true' } } },
  { page: 2, name: 'cvDataGrid', type: CUSTOM.grid, roles: { Values: [col('Branches', 'Branch'), col('Branches', 'City'), mea('Total Sales'), mea('Orders')] }, expect: 'tableEx', objects: { grid: { rowPadding: '4D' } } },
  { page: 3, name: 'cvWordCloud', type: CUSTOM.cloud, roles: { Category: [col('Products', 'Product')], Values: [mea('Units Sold')] }, expect: 'clusteredBarChart', objects: { general: { maxNumberOfWords: '100D' } } },
  { page: 3, name: 'cvTornado', type: CUSTOM.tornado, roles: { Category: [col('Products', 'Category')], Values: [mea('Total Sales'), mea('Sales LY')] }, expect: 'clusteredBarChart', objects: { labels: { show: 'true' } } },
  { page: 3, name: 'cvMultiCard', type: CUSTOM.multiCard, roles: { Values: [mea('Total Sales'), mea('Units Sold'), mea('Orders')] }, expect: 'cardVisual', objects: { cardTitle: { show: 'true' } } },
  { page: 4, name: 'cvCalendarHeat', type: CUSTOM.heat, roles: { Date: [col('Calendar', 'Date')], Values: [mea('Total Sales')] }, expect: 'lineChart', objects: { calendar: { weekStartDay: '0D' } } },
  { page: 4, name: 'cvSmoothLine', type: CUSTOM.smooth, roles: { Axis: [col('Calendar', 'Month Start')], Values: [mea('Total Sales'), mea('Sales LY')] }, expect: 'lineChart', objects: { lineStyle: { smooth: 'true' } } },
  { page: 5, name: 'cvSankey', type: CUSTOM.sankey, roles: { Source: [col('Branches', 'City')], Destination: [col('Products', 'Category')], Weight: [mea('Total Sales')] }, expect: null, objects: { links: { show: 'true' } } },
  { page: 5, name: 'cvForceGraph', type: CUSTOM.graph, roles: { Source: [col('Branches', 'Country')], Target: [col('Products', 'Product')], Weight: [mea('Units Sold')] }, expect: null, objects: { nodes: { showLabels: 'true' } } }
];
// the native visuals beside them
const NATIVE_VISUALS = [
  { page: 1, name: 'cardSales', type: 'card', roles: { Values: [mea('Total Sales')] } },
  { page: 1, name: 'cardOrders', type: 'card', roles: { Values: [mea('Orders')] } },
  { page: 1, name: 'lineMonth', type: 'lineChart', roles: { Category: [col('Calendar', 'Month Start')], Y: [mea('Total Sales')] } },
  { page: 2, name: 'colCity', type: 'clusteredColumnChart', roles: { Category: [col('Branches', 'City')], Y: [mea('Total Sales')] } },
  { page: 2, name: 'slYear', type: 'slicer', roles: { Values: [col('Calendar', 'Year')] } },
  { page: 3, name: 'donutCat', type: 'donutChart', roles: { Category: [col('Products', 'Category')], Y: [mea('Total Sales')] } },
  { page: 3, name: 'tblProducts', type: 'tableEx', roles: { Values: [col('Products', 'Product'), col('Products', 'Category'), mea('Units Sold'), mea('Total Sales')] } },
  { page: 4, name: 'colWeekday', type: 'clusteredColumnChart', roles: { Category: [col('Calendar', 'Weekday')], Y: [mea('Orders')] } },
  { page: 4, name: 'slMonth', type: 'slicer', roles: { Values: [col('Calendar', 'Month')] } },
  { page: 5, name: 'mxCityCat', type: 'pivotTable', roles: { Rows: [col('Branches', 'City')], Columns: [col('Products', 'Category')], Values: [mea('Total Sales')] } }
];
// the clutter: hand-placed boxes (uneven gaps 8 to 31 px, one visual 5 px off its row), titles in three sizes and fonts
const TITLE_STYLES = [['Segoe UI', '14D'], ['Arial', '11D'], ['Georgia', '16D'], ['Segoe UI', '12D'], ['Arial', '16D']];
const TITLES = { cvKpiTile: 'Sales vs target', cvDialGauge: 'Target progress', cvDrillBar: 'Sales by city and branch', cardSales: null, cardOrders: null, lineMonth: 'Monthly sales',
  cvChipSlicer: 'Country', cvBullet: 'Branch sales against target', cvDataGrid: 'Branch detail', colCity: 'Sales by city', slYear: 'Year',
  cvWordCloud: 'Units by product', cvTornado: 'This year vs last year by category', cvMultiCard: 'Headline numbers', donutCat: 'Category share', tblProducts: 'Products',
  cvCalendarHeat: 'Daily sales calendar', cvSmoothLine: 'Sales trend vs last year', colWeekday: 'Orders by weekday', slMonth: 'Month',
  cvSankey: 'From city to category', cvForceGraph: 'Country and product links', mxCityCat: 'City by category' };
export const PAGES = [
  { id: 'p1overview', name: 'Overview', boxes: { cvKpiTile: [24, 92, 290, 140], cardSales: [327, 92, 250, 140], cardOrders: [598, 97, 250, 140], cvDialGauge: [871, 92, 385, 140],
    lineMonth: [24, 251, 640, 445], cvDrillBar: [692, 251, 564, 445] }, text: 'Gulf Retail: overview', shape: [0, 70, 1280, 6] },
  { id: 'p2branches', name: 'Branches', boxes: { cvChipSlicer: [24, 84, 700, 64], slYear: [740, 84, 516, 64], cvBullet: [24, 172, 600, 260], colCity: [655, 172, 601, 260],
    cvDataGrid: [24, 448, 1232, 248] }, text: 'Branches', shape: [0, 70, 1280, 4] },
  { id: 'p3products', name: 'Products', boxes: { cvMultiCard: [24, 84, 1232, 110], cvWordCloud: [24, 210, 400, 486], cvTornado: [440, 210, 420, 240], donutCat: [884, 210, 372, 240],
    tblProducts: [440, 466, 816, 230] }, text: 'Products', shape: [16, 72, 1248, 3] },
  { id: 'p4calendar', name: 'Calendar', boxes: { slMonth: [24, 84, 300, 60], cvCalendarHeat: [24, 160, 760, 300], colWeekday: [800, 160, 456, 300], cvSmoothLine: [24, 491, 1232, 205] },
    text: 'Calendar', shape: [0, 70, 1280, 5] },
  { id: 'p5flows', name: 'Flows', boxes: { cvSankey: [24, 84, 610, 380], cvForceGraph: [658, 84, 598, 380], mxCityCat: [24, 480, 1232, 216] }, text: 'Flows between cities, countries and products', shape: [0, 70, 1280, 4] }
];
const OFF_ROW = 'cardOrders'; // 5 px below its row (y 97 against 92)

const queryOf = (roles) => ({ queryState: Object.fromEntries(Object.entries(roles).map(([r, p]) => [r, { projections: p }])) });
const objectsOf = (o) => Object.fromEntries(Object.entries(o || {}).map(([card, props]) => [card, [{ properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, L(v)])) }]]));
function visualJson(v, box, i, style) {
  const [x, y, w, h] = box, title = TITLES[v.name];
  const vco = title ? { title: [{ properties: { show: bool(true), text: str(title), fontFamily: str(style[0]), fontSize: L(style[1]) } }] } : {};
  return { $schema: SCHEMA.visual, name: v.name, position: { x, y, z: (i + 1) * 1000, height: h, width: w, tabOrder: (i + 1) * 1000 },
    visual: Object.assign({ visualType: v.type, query: queryOf(v.roles) }, v.objects ? { objects: objectsOf(v.objects) } : {}, Object.keys(vco).length ? { visualContainerObjects: vco } : {}, { drillFilterOtherVisuals: true }) };
}
const textbox = (name, text, i, size, font) => ({ $schema: SCHEMA.visual, name, position: { x: 24, y: 16, z: (i + 1) * 1000, height: 52, width: 900, tabOrder: (i + 1) * 1000 },
  visual: { visualType: 'textbox', objects: { general: [{ properties: { paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: font, fontSize: size, fontWeight: 'bold' } }], horizontalTextAlignment: 'left' }] } }] } } });
const shape = (name, [x, y, w, h], i) => ({ $schema: SCHEMA.visual, name, position: { x, y, z: (i + 1) * 1000, height: h, width: w, tabOrder: (i + 1) * 1000 },
  visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: str('rectangle') } }], fill: [{ properties: { show: bool(true), fillColor: { solid: { color: str('#1f6f8b') } }, transparency: L('0D') } }], outline: [{ properties: { show: bool(false) } }] } } });

export function customTable() {
  return ['| Page | Visual | Custom id | Roles | Expected native |', '|---|---|---|---|---|'].concat(VISUALS_CUSTOM.map((v) => `| ${v.page} | ${v.name} | ${v.type} | ${Object.entries(v.roles).map(([r, l]) => `${r} (${l.length})`).join(', ')} | ${v.expect || 'not replaced'} |`)).join('\n');
}

export function writeLab(out) {
  const ROOT = path.resolve(out), R = NAME + '.Report', DEF = R + '/definition', SM = NAME + '.SemanticModel';
  if (fs.existsSync(ROOT) && fs.readdirSync(ROOT).length) throw new Error('give an empty folder: ' + ROOT);
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n'); };
  put(SM + '/definition.pbism', { version: '1.0' });
  put(SM + '/model.bim', model());
  put(SM + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'SemanticModel', displayName: NAME }, config: { version: '2.0', logicalId: '5b2d8e41-7c3a-4f19-a6e2-91c4d0b7f3a8' } });
  put(NAME + '.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../' + SM } } });
  put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: NAME }, config: { version: '2.0', logicalId: '8e6f1a27-3d4b-4c85-b0e9-2f7a6c1d5e93' } });
  put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
  // as a hand report declares its AppSource visuals: their ids in publicCustomVisuals (no package bytes beside them)
  put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: {}, publicCustomVisuals: Object.values(CUSTOM),
    settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true, useDefaultAggregateDisplayName: true } });
  put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: PAGES.map((p) => p.id), activePageName: PAGES[0].id });
  const all = VISUALS_CUSTOM.concat(NATIVE_VISUALS);
  let k = 0;
  PAGES.forEach((pg, n) => {
    put(`${DEF}/pages/${pg.id}/page.json`, { $schema: SCHEMA.page, name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: 1280, height: 720 });
    // the page's own title as a text box (its size and font change from page to page, as a hand report's do) and a band
    put(`${DEF}/pages/${pg.id}/visuals/pageTitle/visual.json`, textbox('pageTitle', pg.text, 0, ['20pt', '18pt', '22pt', '20pt', '16pt'][n], ['Segoe UI', 'Arial', 'Segoe UI Semibold', 'Georgia', 'Segoe UI'][n]));
    put(`${DEF}/pages/${pg.id}/visuals/band/visual.json`, shape('band', pg.shape, 1));
    Object.entries(pg.boxes).forEach(([name, box], i) => {
      const v = all.find((x) => x.name === name);
      if (!v || v.page !== n + 1) throw new Error('the lab\'s page ' + (n + 1) + ' names ' + name + ', not one of its visuals');
      put(`${DEF}/pages/${pg.id}/visuals/${name}/visual.json`, visualJson(v, box, i + 2, TITLE_STYLES[(k++) % TITLE_STYLES.length]));
    });
  });
  const placed = PAGES.flatMap((p) => Object.keys(p.boxes));
  const missing = all.filter((v) => !placed.includes(v.name)).map((v) => v.name);
  if (missing.length) throw new Error('not placed: ' + missing.join(', '));
  return { root: ROOT, pbip: path.join(ROOT, NAME + '.pbip'), report: path.join(ROOT, R), pages: PAGES.length, custom: VISUALS_CUSTOM.length, native: NATIVE_VISUALS.length, offRow: OFF_ROW };
}

// Microsoft's validator (the version mcp/package.json pins), offline: its exit, its text, its errors (the ones about a
// custom visual's type apart: Desktop needs the package for those, the lab ships none)
export function validate(reportDir) {
  const cli = path.join(HERE, '../node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const r = spawnSync(process.execPath, [cli, 'validate', reportDir, '--format', 'json'], { encoding: 'utf8' });
  let j = null; try { j = JSON.parse(r.stdout); } catch (e) { j = null; }
  return { exit: r.status, json: j, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--list') { console.log(customTable()); process.exit(0); }
  if (!process.argv[2]) { console.error('node lab/custom-visuals-lab.mjs <empty folder>'); process.exit(2); }
  const r = writeLab(process.argv[2]), v = validate(r.report);
  console.log(`wrote ${r.pages} pages, ${r.custom} custom visuals and ${r.native} native ones (with a text box and a shape on each page): ${r.pbip}\nvalidator (exit ${v.exit}):\n${v.text.slice(0, 4000)}`);
}
