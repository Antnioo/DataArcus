// Writes "Service Orders.Report" and "Service Orders.pbip" next to the made-up model "Service Orders.SemanticModel"
// (0.3.1 R1): the shape of a real user's English report of 23 Oct, described by shape only, nothing of its data or names.
// A facility maintenance domain on purpose. Made up from nothing: no employer or client data.
// Run again only to change the fixture (node test-models/service-orders/make-report.mjs from mcp/); the tests read the
// committed files.
//   The report is the user's own, not DataArcus's: a light theme of their own (every visual on a white panel, radius 12,
//   with a shadow; a button with a white border and a shadow), no page buttons, title and subtitle as text boxes left to
//   the theme, tables and matrices at 14pt with their values set to wrap, tab stops in English reading order.
//   Overview (1280 x 720): title, subtitle, 2 dropdown slicers top right, 4 cards, 3 bar charts (open orders by
//   technician; labour and materials stacked by technician; open orders by status), a matrix (technician x 17 months,
//   Average Cost, background colour by value, totals).
//   Detail (1280 x 720): title, subtitle, 3 dropdown slicers, a column chart by age band, a bar chart by department, a
//   table of 9 fields (order id, department, technician, status, created, Avg days open, labour, materials, Avg Cost)
//   sorted oldest first, its total row.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const A11y = require('../../../assets/js/report-a11y.js');
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json', version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
  report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
};
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'");
const bool = (b) => lit(b ? 'true' : 'false');
const num = (n) => lit(n + 'D');
const obj = (props, selector) => [selector ? { properties: props, selector } : { properties: props }];
const W = 'Work Orders', D = 'Dim Date', AB = 'Dim Age Bucket';
const col = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const q = (roles, sort) => Object.assign({ queryState: Object.fromEntries(Object.entries(roles).map(([r, ps]) => [r, { projections: ps }])) }, sort ? { sortDefinition: { sort, isDefaultSort: true } } : {});
const title = (text) => ({ title: obj({ show: bool(true), text: str(text) }) });
const textbox = (text, size, bold) => ({ visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: size + 'pt', fontWeight: bold ? 'bold' : 'normal' } }], horizontalTextAlignment: 'left' }] }) } });
const slicer = (t, c) => ({ visualType: 'slicer', query: q({ Values: [col(t, c)] }), objects: { data: obj({ mode: str('Dropdown') }) }, visualContainerObjects: title(c) });
const card = (m) => ({ visualType: 'card', query: q({ Values: [mea(W, m)] }), visualContainerObjects: title(m) });
const chart = (type, cat, ys, text, sort) => ({ visualType: type, query: q({ Category: [cat], Y: ys }, sort), visualContainerObjects: title(text) });
// the user's own large table text, values set to wrap
const BIG = 14;
const gradient = (m) => ({ properties: { backColor: { solid: { color: { expr: { FillRule: { Input: mea(W, m).field, FillRule: { linearGradient2: {
  min: { color: { Literal: { Value: "'#FFFFFF'" } } }, max: { color: { Literal: { Value: "'#2B7BB9'" } } }, nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
  selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: W + '.' + m } });

const PAGES = [
  { name: 'overview0001', displayName: 'Overview', visuals: [
    { name: 'ovTitle', x: 24, y: 12, w: 420, h: 54, visual: textbox('Open Work Orders', 24, true) },
    { name: 'ovSubtitle', x: 24, y: 66, w: 700, h: 34, visual: textbox('Open: every order not done and billed. Days open: days since it was logged.', 11, false) },
    { name: 'ovSlDept', x: 860, y: 6, w: 190, h: 76, visual: slicer(W, 'Department') },
    { name: 'ovSlStatus', x: 1066, y: 6, w: 190, h: 76, visual: slicer(W, 'Status') },
    ...['Open Orders', 'Total Cost', 'Average Cost', 'Total Labour'].map((m, i) => ({ name: 'ovCard' + (i + 1), x: 24 + i * 312, y: 110, w: 296, h: 100, visual: card(m) })),
    { name: 'ovBarTech', x: 24, y: 226, w: 400, h: 230, visual: chart('clusteredBarChart', col(W, 'Technician'), [mea(W, 'Open Orders')], 'Open orders by technician', [{ field: mea(W, 'Open Orders').field, direction: 'Descending' }]) },
    { name: 'ovStackTech', x: 440, y: 226, w: 400, h: 230, visual: chart('barChart', col(W, 'Technician'), [mea(W, 'Total Labour'), mea(W, 'Total Materials')], 'Labour and materials by technician') },
    { name: 'ovBarStatus', x: 856, y: 226, w: 400, h: 230, visual: chart('clusteredBarChart', col(W, 'Status'), [mea(W, 'Open Orders')], 'Open orders by status') },
    { name: 'ovMatrix', x: 24, y: 472, w: 1232, h: 232, visual: { visualType: 'pivotTable', query: q({ Rows: [col(W, 'Technician')], Columns: [col(D, 'Month')], Values: [mea(W, 'Average Cost')] }),
      objects: { values: [{ properties: { fontSize: num(BIG) } }, gradient('Average Cost')], columnHeaders: obj({ fontSize: num(BIG) }), rowHeaders: obj({ fontSize: num(BIG) }), total: obj({ fontSize: num(BIG) }) },
      visualContainerObjects: title('Average cost by technician and month') } }
  ] },
  { name: 'detail000002', displayName: 'Detail', order: ['dtTitle', 'dtSlDept', 'dtSlTech', 'dtSlStatus', 'dtSubtitle', 'dtColAge', 'dtBarDept', 'dtTable'], visuals: [
    { name: 'dtTitle', x: 24, y: 12, w: 520, h: 54, visual: textbox('Open Work Orders: Detail', 24, true) },
    { name: 'dtSubtitle', x: 24, y: 66, w: 600, h: 34, visual: textbox('One row per order, oldest first.', 11, false) },
    { name: 'dtSlDept', x: 652, y: 6, w: 190, h: 76, visual: slicer(W, 'Department') },
    { name: 'dtSlTech', x: 858, y: 6, w: 190, h: 76, visual: slicer(W, 'Technician') },
    { name: 'dtSlStatus', x: 1066, y: 6, w: 190, h: 76, visual: slicer(W, 'Status') },
    { name: 'dtColAge', x: 24, y: 110, w: 400, h: 260, visual: chart('clusteredColumnChart', col(AB, 'Age Bucket'), [mea(W, 'Open Orders')], 'Open orders by age') },
    { name: 'dtBarDept', x: 24, y: 386, w: 400, h: 318, visual: chart('clusteredBarChart', col(W, 'Department'), [mea(W, 'Open Orders')], 'Open orders by department') },
    { name: 'dtTable', x: 440, y: 110, w: 816, h: 594, visual: { visualType: 'tableEx',
      query: q({ Values: [col(W, 'Order Id'), col(W, 'Department'), col(W, 'Technician'), col(W, 'Status'), col(W, 'Created'), mea(W, 'Avg days open'), mea(W, 'Total Labour'), mea(W, 'Total Materials'), mea(W, 'Avg Cost')] }, [{ field: col(W, 'Created').field, direction: 'Ascending' }]),
      objects: { values: obj({ fontSize: num(BIG), wordWrap: bool(true) }), columnHeaders: obj({ fontSize: num(BIG) }), total: obj({ fontSize: num(BIG) }) },
      visualContainerObjects: title('Open work orders') } }
  ] }
];
const THEME = { name: 'service-theme.json', dataColors: ['#2B7BB9', '#E07A1F', '#4C9F70', '#8C5BB5', '#C8463D', '#3A8FA3'], background: '#FFFFFF', foreground: '#252423', tableAccent: '#2B7BB9',
  visualStyles: {
    '*': { '*': { background: [{ show: true, color: { solid: { color: '#FFFFFF' } }, transparency: 0 }], border: [{ show: true, color: { solid: { color: '#FFFFFF' } }, radius: 12 }], dropShadow: [{ show: true }] } },
    actionButton: { '*': { border: [{ show: true, color: { solid: { color: '#FFFFFF' } } }], dropShadow: [{ show: true }] } },
    page: { '*': { background: [{ color: { solid: { color: '#F3F2F1' } }, transparency: 0 }] } }
  } };

const OUT = HERE, R = 'Service Orders.Report', DEF = R + '/definition';
fs.rmSync(path.join(OUT, R), { recursive: true, force: true });
const put = (rel, o) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n'); };
put('Service Orders.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../Service Orders.SemanticModel' } } });
put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: 'Service Orders' }, config: { version: '2.0', logicalId: '7d1c2a40-5e3b-4f6a-9c21-3b8e0f4d6a57' } });
put(R + '/StaticResources/RegisteredResources/service-theme.json', THEME);
put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: { customTheme: { name: 'service-theme.json', reportVersionAtImport: '5.61', type: 'RegisteredResources' } },
  resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: 'service-theme.json', path: 'service-theme.json', type: 'CustomTheme' }] }],
  settings: { useStylableVisualContainerHeader: true, useEnhancedTooltips: true, defaultDrillFilterOtherVisuals: true, allowChangeFilterTypes: true, useDefaultAggregateDisplayName: true } });
put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: PAGES.map((p) => p.name), activePageName: PAGES[0].name });
PAGES.forEach((p) => {
  put(`${DEF}/pages/${p.name}/page.json`, { $schema: SCHEMA.page, name: p.name, displayName: p.displayName, displayOption: 'FitToPage', width: 1280, height: 720 });
  // tab stops in English reading order: the writer's rule (report-a11y.js readingOrder), except where check_report's
  // count (A11Y_TAB_ORDER) reads the page otherwise: the Detail page's two charts, one under the other beside the tall
  // table, come before it
  let order = A11y.readingOrder(p.visuals.map((v) => ({ x: v.x, y: v.y, w: v.w, h: v.h, v })), 'ltr').map((b) => b.v);
  if (p.order) order = p.order.map((n) => p.visuals.find((v) => v.name === n));
  p.visuals.forEach((v, i) => {
    put(`${DEF}/pages/${p.name}/visuals/${v.name}/visual.json`, { $schema: SCHEMA.visual, name: v.name, position: { x: v.x, y: v.y, z: (i + 1) * 1000, height: v.h, width: v.w, tabOrder: order.indexOf(v) * 1000 }, visual: v.visual });
  });
});
console.log('wrote', path.join(OUT, R));
