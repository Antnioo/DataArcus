// 0.3.1 CS1 (the owner, 26 Oct: a hand-made report whose visuals do not share one font): a project for the laptop to
// open the original and "<name> redesigned" side by side in Power BI Desktop. The model is the sample project's made-up
// Gulf retail model (lib/sample-project.mjs: typed Power Query rows, Desktop shows the data after one Refresh); the
// report, "Store Ops", is laid out by hand the way hand reports are: positions a few units off each other, and visuals
// that mix fonts and sizes (titles at 14, 12 and 11pt, one in Segoe UI Semibold and bold, an axis in Arial, cards at 28
// and 24pt, a slicer header in Segoe UI Bold, table headers bold), a text box, a shape and a group (which stay as they
// are). The report has only Power BI's base theme (no theme file), as a new Desktop report does: the consistent copy adds
// one. Every name and number is made up. Microsoft's validator runs on the original.
//   node lab/consistency-lab.mjs <empty folder>          (from mcp/; prints the .pbip to open and the next calls)
//   node lab/consistency-lab.mjs <empty folder> --theme  (the report with a theme file of its own)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const LAB_NAME = 'Store Ops';
const Lv = (v) => ({ expr: { Literal: { Value: v } } }), Ls = (t) => Lv("'" + String(t).replace(/'/g, "''") + "'");
const font = (f) => Ls(f), size = (n) => Lv(n + 'D'), on = Lv('true');
const VC = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const col = (e, p) => ({ field: { Column: { Expression: { SourceRef: { Entity: e } }, Property: p } }, queryRef: `${e}.${p}`, nativeQueryRef: p });
const mea = (e, p) => ({ field: { Measure: { Expression: { SourceRef: { Entity: e } }, Property: p } }, queryRef: `${e}.${p}`, nativeQueryRef: p });
const title = (text, more) => ({ title: [{ properties: Object.assign({ show: on, text: Ls(text) }, more || {}) }] });
const SEGOE_SEMI = "'Segoe UI Semibold', wf_segoe-ui_semibold, helvetica, arial, sans-serif";

// the visuals, page by page: [name, type, x, y, w, h, query, objects, visualContainerObjects, extra]
function pages() {
  const overview = [
    ['header', 'textbox', 20, 6, 900, 50, null, { general: [{ properties: { paragraphs: [{ textRuns: [{ value: 'Store operations', textStyle: { fontFamily: 'Segoe UI Semibold', fontSize: '20pt' } }] }] } }] }, {}],
    ['band', 'shape', 0, 62, 1280, 4, null, { shape: [{ properties: { tileShape: Ls('rectangle') } }] }, {}],
    ['cardSales', 'card', 22, 78, 300, 120, { Values: { projections: [mea('Sales', 'Total Sales')] } },
      { labels: [{ properties: { fontSize: size(28), fontFamily: font('Segoe UI') } }], categoryLabels: [{ properties: { fontSize: size(12) } }] }, title('Total sales')],
    ['cardOrders', 'card', 335, 81, 296, 117, { Values: { projections: [mea('Sales', 'Order Count')] } },
      { labels: [{ properties: { fontSize: size(24), fontFamily: font("'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif") } }] }, title('Orders', { fontSize: size(11) })],
    ['cardBasket', 'card', 645, 78, 302, 121, { Values: { projections: [mea('Sales', 'Average Basket')] } }, {}, title('Average basket')],
    ['slBranch', 'slicer', 962, 76, 296, 124, { Values: { projections: [col('Branches', 'Branch')] } },
      { header: [{ properties: { fontFamily: font("'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif"), textSize: size(12) } }], items: [{ properties: { textSize: size(10) } }] }, {}],
    ['colBranch', 'clusteredColumnChart', 20, 214, 610, 236, { Category: { projections: [col('Sales', 'Branch')] }, Y: { projections: [mea('Sales', 'Total Sales')] } },
      { categoryAxis: [{ properties: { fontSize: size(11) } }], legend: [{ properties: { fontSize: size(9) } }] }, title('Sales by branch', { fontSize: size(14), fontFamily: font(SEGOE_SEMI), bold: on })],
    ['lineMonth', 'lineChart', 645, 216, 613, 234, { Category: { projections: [col('Calendar', 'Year Month')] }, Y: { projections: [mea('Sales', 'Total Sales')] } },
      { categoryAxis: [{ properties: { fontSize: size(10), fontFamily: font('Arial') } }], valueAxis: [{ properties: { fontSize: size(10) } }], labels: [{ properties: { show: on, fontSize: size(9) } }] },
      title('Sales by month', { fontSize: size(14) })],
    ['tblProducts', 'tableEx', 22, 465, 1236, 238, { Values: { projections: [col('Sales', 'Product'), mea('Sales', 'Units Sold'), mea('Sales', 'Total Sales')] } },
      { columnHeaders: [{ properties: { fontSize: size(11), bold: on } }], values: [{ properties: { fontSize: size(10) } }], total: [{ properties: { bold: on } }] }, title('Products', { fontSize: size(12) })]
  ];
  const details = [
    ['mxBranch', 'pivotTable', 20, 20, 820, 380, { Rows: { projections: [col('Branches', 'Country'), col('Branches', 'Branch')] }, Values: { projections: [mea('Sales', 'Total Sales'), mea('Sales', 'Order Count')] } },
      { columnHeaders: [{ properties: { fontSize: size(12), fontFamily: font('Segoe UI') } }], rowHeaders: [{ properties: { fontSize: size(11) } }], values: [{ properties: { fontSize: size(10) } }] }, title('Branches', { fontSize: size(11) })],
    ['barProduct', 'clusteredBarChart', 857, 22, 403, 378, { Category: { projections: [col('Sales', 'Product')] }, Y: { projections: [mea('Sales', 'Units Sold')] } },
      { labels: [{ properties: { show: on, fontSize: size(9), fontFamily: font('Segoe UI') } }] }, title('Units by product', { fontSize: size(14), italic: on })],
    ['donutChannel', 'donutChart', 20, 416, 600, 284, { Category: { projections: [col('Sales', 'Channel')] }, Y: { projections: [mea('Sales', 'Total Sales')] } },
      { legend: [{ properties: { show: on, fontSize: size(10) } }], labels: [{ properties: { fontSize: size(9) } }] }, title('Sales by channel', { fontSize: size(14), fontFamily: font(SEGOE_SEMI) })],
    ['grpNote', 'group', 640, 416, 620, 284, null, null, null, { visualGroup: { displayName: 'Units note', groupMode: 'ScaleMode' } }],
    ['cardUnits', 'card', 0, 0, 620, 284, { Values: { projections: [mea('Sales', 'Units Sold')] } }, { labels: [{ properties: { fontSize: size(32) } }] }, title('Units sold', { fontSize: size(18) }), { parentGroupName: 'grpNote' }]
  ];
  return [['a1b2c3d4e5f6a7b8c9d0', 'Overview', overview], ['b2c3d4e5f6a7b8c9d0e1', 'Details', details]];
}

export async function writeLab(out, opts) {
  const o = opts || {};
  fs.mkdirSync(out, { recursive: true });
  if (fs.readdirSync(out).length) throw new Error(`${out} is not empty: give an empty folder`);
  const ROOT = fs.realpathSync.native(path.resolve(out));
  const { sampleFiles, SAMPLE_NAME } = await import('../lib/sample-project.mjs');
  // the model (and its .platform, definition.pbism) from the sample; the sample's own empty report is left out
  const M = `${SAMPLE_NAME}.SemanticModel`, Rp = `${LAB_NAME}.Report`;
  sampleFiles('lab').filter((f) => f.path.startsWith(`lab/${M}/`)).forEach((f) => { const p = path.join(ROOT, f.path.slice(4)); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data); });
  const { SCHEMA } = createRequire(import.meta.url)('../../assets/js/pbip-query.js');
  const put = (rel, j) => { const p = path.join(ROOT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof j === 'string' ? j : JSON.stringify(j, null, 2) + '\n'); };
  put(`${LAB_NAME}.pbip`, { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: Rp } }], settings: { enableAutoRecovery: true } });
  put(`${Rp}/.platform`, { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: LAB_NAME }, config: { version: '2.0', logicalId: '0c51d0a5-4b1e-4c4a-9d7e-5a0b7c3e2f10' } });
  put(`${Rp}/definition.pbir`, { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: `../${M}` } } });
  put(`${Rp}/definition/version.json`, { $schema: SCHEMA.version, version: '2.0.0' });
  const THEME = 'store-ops-theme.json';
  put(`${Rp}/definition/report.json`, Object.assign({ $schema: SCHEMA.report }, o.theme
    ? { themeCollection: { customTheme: { name: THEME, reportVersionAtImport: '5.61', type: 'RegisteredResources' } }, resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: THEME, path: THEME, type: 'CustomTheme' }] }] }
    : { themeCollection: {} }));
  if (o.theme) put(`${Rp}/StaticResources/RegisteredResources/${THEME}`, { name: THEME, dataColors: ['#1F6F8B', '#99A8B2', '#E6A400', '#5B8C5A', '#C8553D', '#6C4F77'], foreground: '#1F2937', background: '#FFFFFF', tableAccent: '#1F6F8B' });
  const P = pages();
  put(`${Rp}/definition/pages/pages.json`, { $schema: SCHEMA.pages, pageOrder: P.map((p) => p[0]), activePageName: P[0][0] });
  P.forEach(([id, name, vs]) => {
    put(`${Rp}/definition/pages/${id}/page.json`, { $schema: SCHEMA.page, name: id, displayName: name, displayOption: 'FitToPage', width: 1280, height: 720 });
    vs.forEach(([vn, type, x, y, w, h, query, objects, vco, extra], i) => {
      const pos = { x, y, z: 1000 + i * 1000, height: h, width: w, tabOrder: 1000 + i * 1000 };
      const j = type === 'group' ? Object.assign({ $schema: VC, name: vn, position: pos }, extra)
        : Object.assign({ $schema: VC, name: vn, position: pos, visual: Object.assign({ visualType: type }, query ? { query: { queryState: query } } : {}, objects && Object.keys(objects).length ? { objects } : {}, vco && Object.keys(vco).length ? { visualContainerObjects: vco } : {}) }, extra || {});
      put(`${Rp}/definition/pages/${id}/visuals/${vn}/visual.json`, j);
    });
  });
  return { root: ROOT, pbip: path.join(ROOT, `${LAB_NAME}.pbip`), model: M, report: Rp };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('usage: node lab/consistency-lab.mjs <empty folder> [--theme]'); process.exit(2); }
  writeLab(out, { theme: process.argv.includes('--theme') }).then(async (r) => {
    const { serverClient } = await import('../test-0.2.9.mjs');
    const s = await serverClient(r.root, {});
    try {
      const ck = await s.call('check_report', { path: `${LAB_NAME}.pbip`, checks: ['validator', 'theme'] });
      console.log(JSON.stringify({ open: r.pbip, validator: ck.j ? ck.j.validator : ck.t, formatMixed: ck.j ? ck.j.findings.filter((f) => f.rule === 'FORMAT_MIXED').map((f) => f.what) : null,
        next: `In this folder (DATAARCUS_ROOT): plan_layout { path: "${r.model}", redesignFrom: "${LAB_NAME}.pbip", consistentText: "report" }, approve_plan, then create_report with the same and the planId; open "${LAB_NAME} redesigned.pbip" beside "${LAB_NAME}.pbip".` }, null, 2));
    } finally { await s.close(); }
  }).catch((e) => { console.error(String(e && e.stack || e)); process.exit(1); });
}
