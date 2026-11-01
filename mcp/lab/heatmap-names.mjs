// 0.3.1 MX1 B (the owner, 1 Nov: "the days name it's on the left"): one project for the laptop to open in Power BI
// Desktop and screenshot at 100%, page by page. A matrix with a column field (a heatmap: weekdays down, hours across)
// keeps its row headers at its left in the twin: no Microsoft property moves them (M1, laptop parts 7 and 8). The lab
// shows the candidates side by side, nothing ships from it (the twin's default for a heatmap is not changed):
//   B1  the twin today (report-mirror.js mirrorVisual of the English heatmap)
//   B2  B1 with its row names at its right (report-mirror.js rowNamesBeside): the matrix's own row header text the colour
//       of its row header background, its row header column given the narrowest width (columnWidth with the row
//       field's queryRef), and a one-column table of the weekday at its right edge (same top, height, title height,
//       header, font, size and row padding; its header text blank: a table's header cannot be turned off)
//   B3  transposed: hours as Rows, days as Columns sorted Descending (Sunday at the right), through the twin's mirror
// Two pages: 1280 x 720 (text 10) and 1920 x 1080 (text 12). The judge: does B2 line up row by row, how narrow the row
// header column gets, and does any of the three scroll.
// Page 3 (the reviewer's add-on, 1 Nov: Fintech page 1), 1280 x 720:
//   C1  a grouped matrix (Rows Department > Project, stepped, 7 values, it scrolls) as the twin writes it today
//   C2  the same written flat as the user may choose (report-mirror.js flatTable, matrixAsTable): Department and Project
//       columns, then the values, reversed by the twin's mirror (the names at the right); its grouping is lost
//   D1  a table wider than its box (its own widths 1,240 in 600) as the twin writes it: its first column behind the scroll
//   D2  the same with its widths scaled to the box (a candidate only: is any value cut?)
// A made-up model of its own, written here (calls by weekday and hour, typed Power Query rows); no employer or client data.
// Microsoft's validator runs on the project; its error count is printed (0 expected).
//   node lab/heatmap-names.mjs <empty folder>            (from mcp/; prints the .pbip to open)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const S = 'https://developer.microsoft.com/json-schemas/fabric/';
const SCHEMA = {
  pbip: S + 'pbip/pbipProperties/1.0.0/schema.json', pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
  platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json', version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
  report: S + 'item/report/definition/report/2.1.0/schema.json', pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
  page: S + 'item/report/definition/page/2.0.0/schema.json', visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
};
const L = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => L("'" + String(s).replace(/'/g, "''") + "'");
const fill = (c) => ({ solid: { color: str(c) } });
const clone = (o) => JSON.parse(JSON.stringify(o));

// ---------- the made-up model ----------
const T = 'Calls';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
function model() {
  const rows = DAYS.flatMap((d, i) => HOURS.map((h, j) => `{"${d}", ${i + 1}, ${h}, ${30 + ((i * 11 + j * 7) % 40) + (j > 2 && j < 7 ? 25 : 0)}}`));
  const m = `let Source = #table(type table [#"Weekday" = text, #"Weekday No" = Int64.Type, #"Hour" = Int64.Type, #"Calls" = Int64.Type], {${rows.join(', ')}}) in Source`;
  return { compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables: [{ name: T, partitions: [{ name: T, mode: 'import', source: { type: 'm', expression: m } }],
    columns: [{ name: 'Weekday', dataType: 'string', sourceColumn: 'Weekday', sortByColumn: 'Weekday No' }, { name: 'Weekday No', dataType: 'int64', sourceColumn: 'Weekday No', summarizeBy: 'none' },
      { name: 'Hour', dataType: 'int64', sourceColumn: 'Hour', summarizeBy: 'none' }, { name: 'Calls', dataType: 'int64', sourceColumn: 'Calls', summarizeBy: 'sum' }],
    measures: [{ name: 'Total Calls', expression: `SUM ( '${T}'[Calls] )`, formatString: '#,0' }] }, projects()] } };
}
// (page 3) made-up projects: 4 departments, 3 projects each
const P2 = 'Projects', DEPTS = ['Compliance', 'Operations', 'Payments', 'Technology'];
const PCOLS = [['Department', 'text', 'string'], ['Project', 'text', 'string'], ['Phase', 'text', 'string'], ['Owner', 'text', 'string'], ['Status', 'text', 'string'], ['Risk Level', 'text', 'string'],
  ['Planned Budget', 'number', 'double'], ['Budget Variance', 'number', 'double'], ['Completion', 'number', 'double'], ['CPI', 'number', 'double'], ['SPI', 'number', 'double']];
function projects() {
  const rows = DEPTS.flatMap((d, i) => [1, 2, 3].map((k) => { const n = i * 3 + k; return [`"${d}"`, `"P${String(n).padStart(3, '0')} - Project ${n}"`, `"${['Plan', 'Build', 'Run'][k - 1]}"`, `"Owner ${n}"`, `"${['On track', 'At risk', 'Late'][n % 3]}"`, `"${['Low', 'Medium', 'High'][(n + 1) % 3]}"`, 100000 + n * 25000, (n % 4) * 5000 - 7000, 0.3 + (n % 7) / 10, 0.85 + (n % 5) / 20, 0.9 + (n % 4) / 25]; }));
  const m = `let Source = #table(type table [${PCOLS.map(([n, t]) => '#"' + n + '" = ' + t).join(', ')}], {${rows.map((r) => '{' + r.join(', ') + '}').join(', ')}}) in Source`;
  return { name: P2, partitions: [{ name: P2, mode: 'import', source: { type: 'm', expression: m } }], columns: PCOLS.map(([n, , dt]) => Object.assign({ name: n, dataType: dt, sourceColumn: n }, dt === 'double' ? { summarizeBy: 'sum' } : {})) };
}

// ---------- the heatmaps ----------
const col = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c });
const MEA = { field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: 'Total Calls' } }, queryRef: T + '.Total Calls', nativeQueryRef: 'Total Calls' };
// the English heatmap as the owner's dashboards have it: weekdays down, hours across, one value shaded by its size
function heatmap(size, transposed) {
  const rows = transposed ? [col('Hour')] : [col('Weekday')], cols = transposed ? [col('Weekday')] : [col('Hour')];
  const v = { visualType: 'pivotTable', query: { queryState: { Rows: { projections: rows }, Columns: { projections: cols }, Values: { projections: [clone(MEA)] } } },
    objects: {
      rowHeaders: [{ properties: { fontSize: L(size + 'D'), backColor: fill('#FFFFFF') } }], columnHeaders: [{ properties: { fontSize: L(size + 'D'), bold: L('true') } }],
      values: [{ properties: { fontSize: L(size + 'D') } }, { properties: { backColor: { solid: { color: { expr: { FillRule: { Input: clone(MEA.field), FillRule: { linearGradient2: {
        min: { color: { Literal: { Value: "'#FFFFFF'" } } }, max: { color: { Literal: { Value: "'#4C7DBF'" } } }, nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
      selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: MEA.queryRef } }],
      grid: [{ properties: { rowPadding: L('4D'), gridHorizontal: L('true') } }],
      subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }] },
    visualContainerObjects: {} };
  // B3: the days Descending, so Monday is at the right once read from the right
  if (transposed) v.query.sortDefinition = { sort: [{ field: clone(col('Weekday').field), direction: 'Descending' }], isDefaultSort: false };
  else v.query.sortDefinition = { sort: [{ field: clone(col('Weekday').field), direction: 'Ascending' }], isDefaultSort: false };
  return v;
}
const titled = (v, text) => { v.visualContainerObjects.title = [{ properties: { show: L('true'), text: str(text), fontSize: L('11D') } }]; return v; };

const PAGES = [{ id: 'p1at1280', name: '1 B1-B3 at 1280', w: 1280, h: 720, size: 10, width: 700 }, { id: 'p2at1920', name: '2 B1-B3 at 1920', w: 1920, h: 1080, size: 12, width: 1050 }];
const PAGE3 = { id: 'p3fintech', name: '3 C1-C2 D1-D2 at 1280', w: 1280, h: 720 };
const pcol = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: P2 } }, Property: c } }, queryRef: P2 + '.' + c, nativeQueryRef: c });
const pagg = (fn, c, name) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: P2 } }, Property: c } }, Function: fn } }, queryRef: `${name}(${P2}.${c})`, nativeQueryRef: c, displayName: c });
function grouped(text) {
  const vals = [pagg(3, 'Status', 'Min'), pagg(3, 'Risk Level', 'Min'), pagg(0, 'Planned Budget', 'Sum'), pagg(0, 'Budget Variance', 'Sum'), pagg(1, 'Completion', 'Avg'), pagg(1, 'CPI', 'Avg'), pagg(1, 'SPI', 'Avg')];
  return titled({ visualType: 'pivotTable', query: { queryState: { Rows: { projections: [pcol('Department'), pcol('Project')] }, Values: { projections: vals } } },
    objects: { rowHeaders: [{ properties: { stepped: L('true'), showExpandCollapseButtons: L('true') } }], subTotals: [{ properties: { rowSubtotals: L('true') } }] }, visualContainerObjects: {} }, text);
}
const ROAD = [['Project', 240], ['Phase', 140], ['Owner', 160], ['Status', 120], ['Risk Level', 120], ['Planned Budget', 150], ['Budget Variance', 150], ['Department', 160]];
function roadmap(text, scale) {
  const ps = ROAD.map(([c]) => (c === 'Planned Budget' || c === 'Budget Variance' ? pagg(0, c, 'Sum') : pcol(c)));
  return titled({ visualType: 'tableEx', query: { queryState: { Values: { projections: ps } } },
    objects: { columnWidth: ROAD.map(([, w], i) => ({ properties: { value: L(Math.max(40, Math.floor(w * scale)) + 'D') }, selector: { metadata: ps[i].queryRef } })) }, visualContainerObjects: {} }, text);
}
const WHAT = { B1: 'B1 the twin today: row headers at the left', B2: 'B2 row names at the right: hidden row headers, a one-column table beside', B3: 'B3 transposed: days across, Descending' };

export function writeLab(out) {
  const ROOT = path.resolve(out), P = 'Heatmap Names Lab', R = P + '.Report', DEF = R + '/definition', SM = 'Lab.SemanticModel';
  if (fs.existsSync(ROOT) && fs.readdirSync(ROOT).length) throw new Error('give an empty folder: ' + ROOT);
  const put = (rel, o) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof o === 'string' ? o : JSON.stringify(o, null, 2) + '\n'); };
  put(SM + '/definition.pbism', { version: '1.0' });
  put(SM + '/model.bim', model());
  put(P + '.pbip', { $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } });
  put(R + '/definition.pbir', { $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../' + SM } } });
  put(R + '/.platform', { $schema: SCHEMA.platform, metadata: { type: 'Report', displayName: P }, config: { version: '2.0', logicalId: '7b1d3e90-4c2a-4f6e-8a15-2e9c0d4b6f31' } });
  put(DEF + '/version.json', { $schema: SCHEMA.version, version: '2.0.0' });
  put(DEF + '/report.json', { $schema: SCHEMA.report, themeCollection: {}, settings: { useStylableVisualContainerHeader: true, defaultDrillFilterOtherVisuals: true, useDefaultAggregateDisplayName: true } });
  put(DEF + '/pages/pages.json', { $schema: SCHEMA.pages, pageOrder: PAGES.map((p) => p.id).concat([PAGE3.id]), activePageName: PAGES[0].id });
  let visuals = 0;
  PAGES.forEach((pg) => {
    put(`${DEF}/pages/${pg.id}/page.json`, { $schema: SCHEMA.page, name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: pg.w, height: pg.h });
    const gap = 16, h = Math.floor((pg.h - gap * 4) / 3), x0 = pg.w - gap - pg.width;   // at the right, as the twin places a heatmap at the left
    const write = (name, j, i) => { const vj = Object.assign({ $schema: SCHEMA.visual }, j, { name }); vj.position = Object.assign({}, vj.position, { tabOrder: (i + 1) * 1000 }); put(`${DEF}/pages/${pg.id}/visuals/${name}/visual.json`, vj); visuals++; };
    // each English heatmap mirrored by the twin's engine on the page, then placed in its row of the lab
    const twin = (v, i) => { const en = { name: 'x', position: { x: gap, y: gap + i * (h + gap), z: (i + 1) * 1000, width: pg.width, height: h }, visual: v }; return Mirror.mirrorVisual(en, pg.w, {}).json; };
    const b1 = twin(titled(heatmap(pg.size, false), WHAT.B1), 0); write('b1m' + pg.id.slice(0, 2), b1, 0);
    const b2 = Mirror.rowNamesBeside(twin(titled(heatmap(pg.size, false), WHAT.B2), 1), { width: Math.round(pg.width / 8) });
    write('b2m' + pg.id.slice(0, 2), b2.matrix, 1); write('b2t' + pg.id.slice(0, 2), b2.table, 2);
    const b3 = twin(titled(heatmap(pg.size, true), WHAT.B3), 2); write('b3m' + pg.id.slice(0, 2), b3, 3);
    if (Math.abs(b1.position.x - x0) > 0.01) throw new Error('the twin placed the heatmap at ' + b1.position.x + ', not ' + x0);
  });
  // page 3: Fintech's grouped matrix (C) and wide table (D), each English visual mirrored by the twin's engine
  {
    const pg = PAGE3, gap = 16, w = Math.floor((pg.w - gap * 3) / 2), h = Math.floor((pg.h - gap * 3) / 2);
    put(`${DEF}/pages/${pg.id}/page.json`, { $schema: SCHEMA.page, name: pg.id, displayName: pg.name, displayOption: 'FitToPage', width: pg.w, height: pg.h });
    const at = (i) => ({ x: gap + (i % 2) * (w + gap), y: gap + Math.floor(i / 2) * (h + gap), z: (i + 1) * 1000, width: w, height: h });
    const put3 = (name, v, i) => { const j = Mirror.mirrorVisual({ name, position: at(i), visual: v }, pg.w, {}).json; j.$schema = SCHEMA.visual; j.position.tabOrder = (i + 1) * 1000; put(`${DEF}/pages/${pg.id}/visuals/${name}/visual.json`, Object.assign({ $schema: SCHEMA.visual }, j)); visuals++; };
    put3('c1grouped', grouped('C1 the grouped matrix as the twin writes it today'), 0);
    const flat = Mirror.flatTable({ name: 'c2flat', position: at(1), visual: grouped('C2 written flat (matrixAsTable): the names at the right') });
    if (!flat.ok) throw new Error('C2: ' + flat.why);
    put3('c2flat', flat.json.visual, 1);
    const sum = ROAD.reduce((n, [, x]) => n + x, 0);
    put3('d1wide', roadmap('D1 a table wider than its box, as the twin writes it', 1), 2);
    put3('d2scaled', roadmap('D2 its widths scaled to the box: is any value cut?', (w - 36) / sum), 3);
  }
  // Microsoft's validator (the version mcp/package.json pins), offline
  const cli = path.join(HERE, '../node_modules/@microsoft/powerbi-report-authoring-cli/dist/cli.js');
  const r = spawnSync(process.execPath, [cli, 'validate', path.join(ROOT, R)], { encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '');
  return { pbip: path.join(ROOT, P + '.pbip'), pages: PAGES.length + 1, visuals, validator: { exit: r.status, text: text.trim().slice(0, 4000) } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) { console.error('node lab/heatmap-names.mjs <empty folder>'); process.exit(2); }
  const r = writeLab(process.argv[2]);
  console.log(`wrote ${r.pages} pages, ${r.visuals} visuals: ${r.pbip}\nvalidator (exit ${r.validator.exit}):\n${r.validator.text}`);
  process.exit(r.validator.exit === 0 ? 0 : 1);
}
