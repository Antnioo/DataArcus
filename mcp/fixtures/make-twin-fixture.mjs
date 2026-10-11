// Writes mcp/fixtures/twin-project: a small made-up PBIR report ("Twin Sales") for create_arabic_twin's tests (0.3.0).
// Made up from nothing: no employer or client data. Readable names and ids on purpose, so a failing check names the
// visual. Run again only to change the fixture (node fixtures/make-twin-fixture.mjs from mcp/); the tests read the
// committed files.
//   Pages: Overview (1280 x 720), Details (1920 x 1080), a tooltip page (320 x 240).
//   Overview: a title text box, a page navigator, a group holding a card and a nested group (a card inside), a slicer,
//   a column chart with a legend, a line chart sorted by the month name, a page button and a bookmark button.
//   Details: a table (a column, a sum and a measure), a bar chart sorted by its measure, a custom visual, a back
//   button and a centred text box.
//   Bookmarks: one data-only on the slicer, one on the Details page.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'twin-project');
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  pbism: S + 'item/semanticModel/definitionProperties/1.0.0/schema.json', platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json',
  version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json', report: S + 'item/report/definition/report/2.1.0/schema.json',
  pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json', page: S + 'item/report/definition/page/2.0.0/schema.json',
  visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json', mobile: S + 'item/report/definition/visualContainerMobileState/2.1.0/schema.json',
  bookmark: S + 'item/report/definition/bookmark/1.4.0/schema.json', bookmarks: S + 'item/report/definition/bookmarksMetadata/1.0.0/schema.json'
};
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'");
const bool = (b) => lit(b ? 'true' : 'false');
const obj = (props, selector) => [selector ? { properties: props, selector } : { properties: props }];
const col = (t, c, name) => Object.assign({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c }, name ? { displayName: name } : {});
const mea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
const sum = (t, c) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, Function: 0 } }, queryRef: 'Sum(' + t + '.' + c + ')', nativeQueryRef: 'Sum of ' + c });
const q = (roles, sort) => Object.assign({ queryState: Object.fromEntries(Object.entries(roles).map(([r, ps]) => [r, { projections: ps }])) }, sort ? { sortDefinition: { sort, isDefaultSort: true } } : {});
const title = (text, align) => ({ title: obj(Object.assign({ show: bool(true), text: str(text) }, align ? { alignment: str(align) } : {})) });
const textbox = (text, align) => ({ general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: 'Segoe UI', fontSize: '20pt', fontWeight: 'bold' } }], horizontalTextAlignment: align }] }) });
const button = (text, link, align) => ({ visualType: 'actionButton', objects: { icon: obj({ show: bool(true), shapeType: str('rightArrow'), placement: str('left') }), text: obj({ show: bool(true) }).concat(obj({ text: str(text), horizontalAlignment: str(align || 'left') }, { id: 'default' })) },
  visualContainerObjects: { visualLink: obj(link), title: obj({ text: str(text) }) } });

const PAGES = [
  { name: 'p1overview', displayName: 'Overview', width: 1280, height: 720, visuals: [
    { name: 'title', x: 40, y: 20, w: 600, h: 50, visual: { visualType: 'textbox', objects: textbox('Sales overview', 'left') } },
    { name: 'nav', x: 880, y: 20, w: 360, h: 40, visual: { visualType: 'pageNavigator', visualContainerObjects: title('Pages') } },
    { name: 'grpKpi', x: 40, y: 90, w: 700, h: 140, group: { displayName: 'KPI row', groupMode: 'ScaleMode' } },
    { name: 'cardSales', parent: 'grpKpi', x: 0, y: 0, w: 300, h: 140, visual: { visualType: 'card', query: q({ Values: [mea('Sales', 'Total Sales')] }), visualContainerObjects: title('Total Sales', 'left') } },
    { name: 'grpInner', parent: 'grpKpi', x: 320, y: 0, w: 380, h: 140, group: { displayName: 'Orders block', groupMode: 'ScaleMode' } },
    { name: 'cardOrders', parent: 'grpInner', x: 20, y: 10, w: 200, h: 120, visual: { visualType: 'card', query: q({ Values: [mea('Sales', 'Orders')] }) } },
    { name: 'slRegion', x: 760, y: 90, w: 220, h: 140, visual: { visualType: 'slicer', query: q({ Values: [col('Sales', 'Region')] }), objects: { data: obj({ mode: str('Basic') }) } } },
    { name: 'btnDetails', x: 1000, y: 90, w: 240, h: 40, visual: button('Go to details', { show: bool(true), type: str('PageNavigation'), navigationSection: str('p2details') }) },
    { name: 'btnReset', x: 1000, y: 150, w: 240, h: 40, visual: button('Reset', { show: bool(true), type: str('Bookmark'), bookmark: str('bmReset') }, 'center') },
    { name: 'colRegion', x: 40, y: 250, w: 600, h: 430, visual: { visualType: 'clusteredColumnChart', query: q({ Category: [col('Sales', 'Region')], Series: [col('Sales', 'Product')], Y: [mea('Sales', 'Total Sales')] }),
      objects: { legend: obj({ show: bool(true), position: str('Top') }) }, visualContainerObjects: title('Sales by Region', 'left') } },
    { name: 'lineMonth', x: 660, y: 250, w: 580, h: 430, visual: { visualType: 'lineChart', query: q({ Category: [col('Calendar', 'Month Name')], Y: [mea('Sales', 'Total Sales')] }, [{ field: col('Calendar', 'Month Name').field, direction: 'Ascending' }]),
      visualContainerObjects: Object.assign(title('Sales by Month'), { padding: obj({ left: lit('4D'), right: lit('12D') }) }) } }
  ] },
  { name: 'p2details', displayName: 'Details', width: 1920, height: 1080, visuals: [
    { name: 'note2', x: 60, y: 30, w: 1800, h: 60, visual: { visualType: 'textbox', objects: textbox('Product details', 'center') } },
    { name: 'tblProducts', x: 60, y: 120, w: 900, h: 900, visual: { visualType: 'tableEx', query: q({ Values: [col('Sales', 'Product', 'Product'), sum('Sales', 'Amount'), mea('Sales', 'Total Sales')] }),
      objects: { columnFormatting: obj({ alignment: str('Left'), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) }, { metadata: 'Sales.Product' }) }, visualContainerObjects: title('Products', 'left') } },
    { name: 'barProduct', x: 1000, y: 120, w: 860, h: 500, visual: { visualType: 'clusteredBarChart', query: q({ Category: [col('Sales', 'Product')], Y: [mea('Sales', 'Total Sales')] }, [{ field: mea('Sales', 'Total Sales').field, direction: 'Descending' }]),
      visualContainerObjects: title('Sales by Product', 'left') } },
    { name: 'customGauge', x: 1000, y: 660, w: 400, h: 360, visual: { visualType: 'twinCustomGauge0123456789ABCDEF', query: q({ Values: [mea('Sales', 'Total Sales')] }), objects: { general: obj({ side: str('left') }) } } },
    { name: 'btnBack', x: 1460, y: 960, w: 400, h: 60, visual: button('Back to overview', { show: bool(true), type: str('PageNavigation'), navigationSection: str('p1overview') }) }
  ] },
  { name: 'p3tooltip', displayName: 'Tooltip', width: 320, height: 240, tooltip: true, visuals: [
    { name: 'tipCard', x: 12, y: 12, w: 200, h: 100, visual: { visualType: 'card', query: q({ Values: [mea('Sales', 'Total Sales')] }) } }
  ] }
];
const BOOKMARKS = [
  { $schema: SCHEMA.bookmark, displayName: 'Reset filters', name: 'bmReset', options: { targetVisualNames: ['slRegion'], applyOnlyToTargetVisuals: true, suppressDisplay: true, suppressActiveSection: true },
    explorationState: { version: '1.3', activeSection: 'p1overview', sections: { p1overview: { visualContainers: { slRegion: {} } } } } },
  { $schema: SCHEMA.bookmark, displayName: 'Details view', name: 'bmDetails', explorationState: { version: '1.3', activeSection: 'p2details', sections: { p2details: { visualContainers: { barProduct: {}, tblProducts: {} } } } } }
];
const MODEL = { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [#"Order Date" = datetime, Region = text, Product = text, Amount = number], {}) in Source' } }],
    columns: [{ name: 'Order Date', dataType: 'dateTime', sourceColumn: 'Order Date' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Product', dataType: 'string', sourceColumn: 'Product' }, { name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: [{ name: 'Calendar', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [Date = datetime, #"Month Number" = Int64.Type, #"Month Name" = text, Year = Int64.Type], {}) in Source' } }],
    columns: [{ name: 'Date', dataType: 'dateTime', isKey: true, sourceColumn: 'Date' }, { name: 'Month Number', dataType: 'int64', sourceColumn: 'Month Number' }, { name: 'Month Name', dataType: 'string', sourceColumn: 'Month Name', sortByColumn: 'Month Number' }, { name: 'Year', dataType: 'int64', sourceColumn: 'Year' }] }
], relationships: [{ name: 'rel-sales-calendar', fromTable: 'Sales', fromColumn: 'Order Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const THEME = { name: 'twin-theme.json', dataColors: ['#0F766E', '#2563EB', '#D97706', '#7C3AED', '#DC2626', '#059669'], background: '#FFFFFF', foreground: '#1F2937', tableAccent: '#0F766E' };

fs.rmSync(OUT, { recursive: true, force: true });
const put = (rel, o) => { const f = path.join(OUT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n'); };
const R = 'Twin Sales.Report', D = R + '/definition';
put('Twin Sales.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../Twin Sales.SemanticModel' } } });
put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: 'Twin Sales' }, config: { version: '2.0', logicalId: '11111111-2222-4333-8444-555555555555' } });
put(R + '/StaticResources/RegisteredResources/twin-theme.json', THEME);
put(D + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
put(D + '/report.json', { $schema: SCHEMA.report, themeCollection: { customTheme: { name: 'twin-theme.json', reportVersionAtImport: '5.61', type: 'RegisteredResources' } },
  resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: 'twin-theme.json', path: 'twin-theme.json', type: 'CustomTheme' }] }],
  publicCustomVisuals: ['twinCustomGauge0123456789ABCDEF'],
  settings: { useStylableVisualContainerHeader: true, useEnhancedTooltips: true, defaultDrillFilterOtherVisuals: true, allowChangeFilterTypes: true, useDefaultAggregateDisplayName: true } });
put(D + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: PAGES.map((p) => p.name), activePageName: PAGES[0].name });
PAGES.forEach((p) => {
  put(`${D}/pages/${p.name}/page.json`, Object.assign({ $schema: SCHEMA.page, name: p.name, displayName: p.displayName, displayOption: 'FitToPage', width: p.width, height: p.height },
    p.tooltip ? { type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: 'tipbinding01', type: 'Tooltip' } } : {}));
  p.visuals.forEach((v, i) => {
    const z = (i + 1) * 1000;
    put(`${D}/pages/${p.name}/visuals/${v.name}/visual.json`, Object.assign({ $schema: SCHEMA.visual, name: v.name, position: { x: v.x, y: v.y, z, height: v.h, width: v.w, tabOrder: z } },
      v.group ? { visualGroup: v.group } : { visual: v.visual }, v.parent ? { parentGroupName: v.parent } : {}));
  });
});
// a phone layout for one visual, to prove it is copied as it is
put(`${D}/pages/p1overview/visuals/cardSales/mobile.json`, { $schema: SCHEMA.mobile, position: { x: 0, y: 0, z: 1000, width: 320, height: 140, tabOrder: 1000 } });
BOOKMARKS.forEach((b) => put(`${D}/bookmarks/${b.name}.bookmark.json`, b));
put(D + '/bookmarks/bookmarks.json', { $schema: SCHEMA.bookmarks, items: BOOKMARKS.map((b) => ({ name: b.name })) });
put('Twin Sales.SemanticModel/definition.pbism', { $schema: SCHEMA.pbism, version: '4.0', settings: {} });
put('Twin Sales.SemanticModel/model.bim', MODEL);
console.log('wrote', OUT);
