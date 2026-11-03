// RD1 B-275 prototype: a reversed table (the twin's) whose columns end at its box's right edge.
// Writes made-up PBIR (one page, one tableEx on a made-up "Sales" table) into a fresh folder under os.tmpdir(), one
// report per candidate, runs Microsoft's validator as mcp/lib/check-report.mjs:362-363 does (runReportValidation with
// getMetadataProvider, skipSchema: true), and prints the validator's errors and warnings per candidate, then the widths
// worked out from the header texts only (report-rules.js headerNeed: bold text width + 24 a page of 1080 high) against
// the box's room (twin-pages.mjs:218: the box less 20 and a 12 scrollbar), English vs Arabic. Never reads data.
// Run: node mcp/research/rd1/b275/prototype.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MCP = path.resolve(HERE, '../../..');
const require = createRequire(path.join(MCP, 'package.json'));
const Rules = require('../assets/js/report-rules.js');
const { runReportValidation, getMetadataProvider } = await import('@microsoft/powerbi-report-authoring-cli');

const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const S = (v) => L(`'${v}'`);
const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const BOX_ROOM = 20, SCROLLBAR_W = 12;   // twin-pages.mjs:218 (measured in Desktop, MX3 and MX5)

// the made-up table: three fields (and a spacer measure for candidate C6)
const FIELDS = [
  { ref: 'Sales.Region', native: 'Region', ar: 'المنطقة', field: { Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Region' } } },
  { ref: 'Sales.Revenue', native: 'Revenue', ar: 'الإيرادات', field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Revenue' } } },
  { ref: 'Sales.Customers', native: 'Customers', ar: 'العملاء', field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Customers' } } },
];
const SPACER = { ref: 'Sales.Spacer', native: 'Spacer', ar: ' ', field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Spacer' } } };

const PAGE = { width: 1920, height: 1080 }, sc = PAGE.height / 1080, T = 10, FONT = 'Segoe UI';
const BOX = { x: 1000, y: 100, width: 800, height: 400 };
const need = (text) => Rules.headerNeed(text, T, FONT, sc).needW;
const room = (w) => w - (BOX_ROOM + SCROLLBAR_W) * sc;

// header widths, the twin's order (reversed: the first English column at the right), the slack to the leftmost
function headerWidths(fields, lang, boxW) {
  const rev = fields.slice().reverse(), w = rev.map((f) => need(lang === 'ar' ? f.ar : f.native)), used = w.reduce((a, b) => a + b, 0);
  const slack = room(boxW) - 1 - used;   // keepView's rule (twin-pages.mjs:236): the slack to the leftmost, the room less 1
  if (slack > 0) w[0] += slack;
  return { order: rev.map((f) => f.native), widths: w.map((x) => Math.round(x * 100) / 100), used, slack };
}

function visual(c) {
  const fields = (c.spacer ? [SPACER] : []).concat(FIELDS.slice().reverse());
  const projections = fields.map((f) => ({ field: f.field, queryRef: f.ref, nativeQueryRef: f.native, displayName: f === SPACER ? ' ' : f.ar }));
  const objects = {};
  const ch = {};
  if (c.adjust) ch.columnAdjustment = S(c.adjust);
  if (c.autoSize != null) ch.autoSizeColumnWidth = L(c.autoSize);
  if (c.defaultWidth) ch.defaultColumnWidth = L(c.defaultWidth + 'D');
  if (Object.keys(ch).length) objects.columnHeaders = [{ properties: ch }];
  if (c.widths) objects.columnWidth = c.widths.map(([ref, w]) => ({ properties: { value: L(w + 'D') }, selector: { metadata: ref } }));
  if (c.wrap) objects.values = [{ properties: { wordWrap: L('true') } }];
  objects.columnFormatting = [{ properties: { alignment: S('Right'), styleHeader: L('true'), styleValues: L('true'), styleTotal: L('true') }, selector: { metadata: 'Sales.Region' } }];
  return { $schema: VS, name: 'tblSales', position: Object.assign({ z: 1000, tabOrder: 1000 }, BOX),
    visual: { visualType: 'tableEx', query: { queryState: { Values: { projections } } }, objects } };
}

const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
function writeReport(root, name, v) {
  const R = path.join(root, name, 'B275.Report'), D = path.join(R, 'definition'), M = path.join(root, name, 'B275.SemanticModel');
  wr(path.join(root, name, 'B275.pbip'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: 'B275.Report' } }], settings: { enableAutoRecovery: true } });
  wr(path.join(M, 'definition.pbism'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/semanticModel/definitionProperties/1.0.0/schema.json', version: '4.0', settings: {} });
  wr(path.join(M, 'model.bim'), { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Sales',
    partitions: [{ name: 'Sales', mode: 'import', source: { type: 'm', expression: 'let Source = #table(type table [Region = text, Amount = number], {}) in Source' } }],
    columns: [{ name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }],
    measures: [{ name: 'Revenue', expression: 'SUM(Sales[Amount])' }, { name: 'Customers', expression: 'COUNTROWS(Sales)' }, { name: 'Spacer', expression: 'BLANK()' }] }] } });
  const plat = (type) => ({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json', metadata: { type, displayName: 'B275' }, config: { version: '2.0', logicalId: type === 'Report' ? '00000000-0000-4000-8000-000000000275' : '00000000-0000-4000-8000-000000000276' } });
  wr(path.join(R, '.platform'), plat('Report'));
  wr(path.join(M, '.platform'), plat('SemanticModel'));
  wr(path.join(R, 'definition.pbir'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json', version: '4.0', datasetReference: { byPath: { path: '../B275.SemanticModel' } } });
  wr(path.join(D, 'version.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/versionMetadata/1.0.0/schema.json', version: '2.0.0' });
  wr(path.join(D, 'report.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/report/2.1.0/schema.json', themeCollection: {}, settings: { useStylableVisualContainerHeader: true } });
  wr(path.join(D, 'pages/pages.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.0.0/schema.json', pageOrder: ['p1'], activePageName: 'p1' });
  wr(path.join(D, 'pages/p1/page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: 'p1', displayName: 'P1', displayOption: 'FitToPage', width: PAGE.width, height: PAGE.height });
  wr(path.join(D, 'pages/p1/visuals/tblSales/visual.json'), v);
  return R;
}

const hw = headerWidths(FIELDS, 'ar', BOX.width), refs = FIELDS.slice().reverse().map((f) => f.ref);
const fixed = refs.map((r, i) => [r, hw.widths[i]]);
const spacerW = Math.round((room(BOX.width) - 1 - hw.used) * 100) / 100;
const CANDIDATES = [
  { id: 'C0', what: 'today: reversed, no width setting (Power BI fits to content from the left)' },
  { id: 'C1', what: 'columnAdjustment growToFit', adjust: 'growToFit' },
  { id: 'C2', what: 'growToFit + autoSizeColumnWidth true (the writer, pbip-page.js:886)', adjust: 'growToFit', autoSize: 'true' },
  { id: 'C3', what: 'columnWidth per field from Arabic headers, slack to leftmost, autoSize false', autoSize: 'false', widths: fixed },
  { id: 'C4', what: 'C3 + values.wordWrap true', autoSize: 'false', widths: fixed, wrap: true },
  { id: 'C5', what: 'fixedWidth + defaultColumnWidth + columnWidth per field', adjust: 'fixedWidth', defaultWidth: 100, widths: fixed },
  { id: 'C6', what: 'leading spacer measure (blank header) at the left, its width the slack', autoSize: 'false', spacer: true, widths: [[SPACER.ref, spacerW]].concat(FIELDS.slice().reverse().map((f, i) => [f.ref, Math.round(need(f.ar))])) },
  { id: 'X1', what: 'control: columnAdjustment "stretch" (not in the enum)', adjust: 'stretch' },
  { id: 'X2', what: 'control: columnWidth on a queryRef not in the visual', autoSize: 'false', widths: [['Sales.Nothing', 120]] },
];

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b275-'));
try {
  const provider = await getMetadataProvider();
  console.log('## Validator per candidate (Microsoft powerbi-report-authoring-cli, skipSchema: true)');
  console.log('| id | candidate | errors | warnings | codes |');
  console.log('|---|---|---|---|---|');
  for (const c of CANDIDATES) {
    const R = writeReport(root, c.id, visual(c));
    const s = await runReportValidation({ reportDir: R, defDir: path.join(R, 'definition'), provider, skipSchema: true });
    const codes = Object.entries(s.diagnostics || {}).filter(([, d]) => (d.items || []).length).map(([k, d]) => `${k}(${d.severity},${d.items.length})`);
    console.log(`| ${c.id} | ${c.what} | ${s.errorCount} | ${s.warningCount} | ${codes.join(' ') || '-'} |`);
  }
  console.log('\n## Header-only widths at 10pt Segoe UI bold + 24 (headerNeed), page 1920 x 1080');
  console.log('| box | lang | headers (twin order, left to right) | need each | sum | room (box - 32) | slack | C3 widths |');
  console.log('|---|---|---|---|---|---|---|---|');
  const LONG = FIELDS.concat([{ ref: 'Sales.AOV', native: 'Average Order Value', ar: 'متوسط قيمة الطلب' }]);
  for (const set of [FIELDS, LONG]) for (const bw of [300, 500, 800]) for (const lang of ['en', 'ar']) {
    const h = headerWidths(set, lang, bw), names = set.slice().reverse().map((f) => (lang === 'ar' ? f.ar : f.native));
    const each = names.map(need);
    console.log(`| ${bw} | ${lang} | ${names.join(' / ')} | ${each.join(', ')} | ${h.used} | ${room(bw)} | ${Math.round(h.slack * 100) / 100} | ${h.slack > 0 ? h.widths.join(', ') : 'does not fit: no widths set'} |`);
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
