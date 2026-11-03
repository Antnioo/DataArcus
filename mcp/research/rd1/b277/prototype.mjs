// B-277 research prototype: an Arabic field parameter for the twin. Made-up model only ("Sales" with two measures,
// a "Metric Selection" field parameter). Writes four variants of the model's TMDL into a fresh temp folder (baseline,
// option A: a second Arabic parameter table, option B: a 4th tuple element in the same table, option C: a culture's
// translations), reads each back with the repo's own readers and prints what they find. Removes the folder at the end.
// Run: node mcp/research/rd1/b277/prototype.mjs (from the repo root)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadModel, modelOf } from '../../../lib/model.mjs';
import { titleProblems, fieldParametersOf } from '../../../lib/metric-switcher.mjs';
import { shadowModel } from '../../../lib/shadow-model.mjs';

const require = createRequire(import.meta.url);
const Tmdl = require('../../../../assets/js/tmdl-model.js');
const Health = require('../../../../assets/js/model-health-engine.js');

const T = '\t';
const tag = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
// the made-up rows: English label, measure, and the Arabic the person approved (drafts for this prototype only)
const ROWS = [
  { en: 'Total Customers', m: 'Total Customers', ar: 'إجمالي العملاء' },
  { en: 'Revenue per Customer', m: 'Revenue per Customer', ar: 'الإيراد لكل عميل' },
];
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const nameof = (m) => `NAMEOF('Sales'[${m}])`;

const SALES = ['table Sales', `${T}lineageTag: ${tag(1)}`, '',
  `${T}measure 'Total Customers' = DISTINCTCOUNT ( Sales[CustomerKey] )`, `${T}${T}formatString: #,0`, `${T}${T}lineageTag: ${tag(2)}`, '',
  `${T}measure 'Revenue per Customer' = DIVIDE ( SUM ( Sales[Amount] ), [Total Customers] )`, `${T}${T}formatString: #,0.00`, `${T}${T}lineageTag: ${tag(3)}`, '',
  `${T}column CustomerKey`, `${T}${T}dataType: int64`, `${T}${T}lineageTag: ${tag(4)}`, `${T}${T}summarizeBy: none`, `${T}${T}sourceColumn: CustomerKey`, '',
  `${T}column Amount`, `${T}${T}dataType: double`, `${T}${T}lineageTag: ${tag(5)}`, `${T}${T}summarizeBy: sum`, `${T}${T}sourceColumn: Amount`, '',
  `${T}partition Sales = m`, `${T}${T}mode: import`, `${T}${T}source =`, `${T}${T}${T}${T}let`, `${T}${T}${T}${T}    Source = #table(type table [CustomerKey = Int64.Type, Amount = number], {})`, `${T}${T}${T}${T}in`, `${T}${T}${T}${T}    Source`, ''].join('\n');

// a field parameter table as Power BI Desktop saves one (the shape metric-switcher.mjs writes, without its title measure)
// extra: { col, label (row => text) } a 4th tuple element and its column (option B)
function paramTable(name, label, tagBase, extra) {
  const D = name, F = name + ' Fields', O = name + ' Order';
  const lines = [`table '${name}'`, `${T}lineageTag: ${tag(tagBase)}`, '',
    `${T}column '${D}'`, `${T}${T}lineageTag: ${tag(tagBase + 1)}`, `${T}${T}summarizeBy: none`, `${T}${T}sourceColumn: [Value1]`, `${T}${T}sortByColumn: '${O}'`, '',
    `${T}${T}relatedColumnDetails`, `${T}${T}${T}groupByColumn: '${F}'`, '', `${T}${T}annotation SummarizationSetBy = Automatic`, '',
    `${T}column '${F}'`, `${T}${T}isHidden`, `${T}${T}lineageTag: ${tag(tagBase + 2)}`, `${T}${T}summarizeBy: none`, `${T}${T}sourceColumn: [Value2]`, `${T}${T}sortByColumn: '${O}'`, '',
    `${T}${T}extendedProperty ParameterMetadata =`, `${T}${T}${T}${T}{`, `${T}${T}${T}${T}  "version": 3,`, `${T}${T}${T}${T}  "kind": 2`, `${T}${T}${T}${T}}`, '', `${T}${T}annotation SummarizationSetBy = Automatic`, '',
    `${T}column '${O}'`, `${T}${T}isHidden`, `${T}${T}formatString: 0`, `${T}${T}lineageTag: ${tag(tagBase + 3)}`, `${T}${T}summarizeBy: sum`, `${T}${T}sourceColumn: [Value3]`, '', `${T}${T}annotation SummarizationSetBy = Automatic`, ''];
  if (extra) lines.push(`${T}column '${extra.col}'`, `${T}${T}lineageTag: ${tag(tagBase + 4)}`, `${T}${T}summarizeBy: none`, `${T}${T}sourceColumn: [Value4]`, `${T}${T}sortByColumn: '${O}'`, '',
    `${T}${T}relatedColumnDetails`, `${T}${T}${T}groupByColumn: '${F}'`, '', `${T}${T}annotation SummarizationSetBy = Automatic`, '');
  lines.push(`${T}partition '${name}' = calculated`, `${T}${T}mode: import`, `${T}${T}source =`, `${T}${T}${T}${T}{`,
    ...ROWS.map((r, i) => `${T}${T}${T}${T}    (${q(label(r))}, ${nameof(r.m)}, ${i}${extra ? ', ' + q(extra.label(r)) : ''})${i < ROWS.length - 1 ? ',' : ''}`), `${T}${T}${T}${T}}`, '',
    `${T}annotation PBI_Id = 0000000000000000000000000000000${tagBase % 10}`, '');
  return lines.join('\n');
}
const EN = paramTable('Metric Selection', (r) => r.en, 10);
const AR_A = paramTable('Metric Selection (Arabic)', (r) => r.ar, 20);
const EN_B = paramTable('Metric Selection', (r) => r.en, 10, { col: 'Metric Selection (Arabic)', label: (r) => r.ar });
// option C: a culture's translations (Microsoft Learn, TMDL Reference "Translations in TMDL"): captions of objects only
const CULTURE_C = ['cultureInfo ar-SA', '', `${T}linguisticMetadata =`, `${T}${T}${T}{`, `${T}${T}${T}  "Version": "1.0.0",`, `${T}${T}${T}  "Language": "ar-SA"`, `${T}${T}${T}}`, `${T}${T}contentType: json`, '',
  `${T}translations`, '', `${T}${T}model Model`, '', `${T}${T}${T}table Sales`, `${T}${T}${T}${T}measure 'Total Customers'`, `${T}${T}${T}${T}${T}caption: ${ROWS[0].ar}`, `${T}${T}${T}${T}measure 'Revenue per Customer'`, `${T}${T}${T}${T}${T}caption: ${ROWS[1].ar}`, '',
  `${T}${T}${T}table 'Metric Selection'`, `${T}${T}${T}${T}column 'Metric Selection'`, `${T}${T}${T}${T}${T}caption: المؤشر`, ''].join('\n');

const script = (table) => 'createOrReplace\n\n' + table.split('\n').map((l) => (l ? T + l : l)).join('\n');
// the repo's script read-back (test-0.3.0-metric-switcher.mjs readScript): createOrReplace dropped, one tab less
const readScript = (text) => { const body = String(text).replace(/^createOrReplace\s*\n/, '').split('\n').map((l) => l.replace(/^\t/, '')).join('\n');
  return Tmdl.read([{ path: 'definition/tables/x.tmdl', text: body }], { lineageTags: true }); };

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'b277-'));
const MODEL = ['model Model', `${T}culture: en-US`, `${T}defaultPowerBIDataSourceVersion: powerBI_V3`, '', 'ref table Sales', "ref table 'Metric Selection'"];
const write = (dir, files) => { const sm = path.join(root, dir, 'Made Up.SemanticModel');
  Object.entries(Object.assign({ 'definition/database.tmdl': 'database\n\tcompatibilityLevel: 1601\n', 'definition/tables/Sales.tmdl': SALES }, files)).forEach(([p, text]) => {
    fs.mkdirSync(path.dirname(path.join(sm, p)), { recursive: true }); fs.writeFileSync(path.join(sm, p), text); });
  fs.writeFileSync(path.join(sm, 'definition.pbism'), '{"version":"4.0","settings":{}}\n'); return sm; };

const variants = {
  baseline: { 'definition/model.tmdl': MODEL.join('\n') + '\n', 'definition/tables/Metric Selection.tmdl': EN },
  A: { 'definition/model.tmdl': MODEL.concat("ref table 'Metric Selection (Arabic)'").join('\n') + '\n', 'definition/tables/Metric Selection.tmdl': EN, 'definition/tables/Metric Selection (Arabic).tmdl': AR_A },
  B: { 'definition/model.tmdl': MODEL.join('\n') + '\n', 'definition/tables/Metric Selection.tmdl': EN_B },
  C: { 'definition/model.tmdl': MODEL.concat('', 'ref cultureInfo ar-SA').join('\n') + '\n', 'definition/tables/Metric Selection.tmdl': EN, 'definition/cultures/ar-SA.tmdl': CULTURE_C },
};
const lineDiff = (a, b) => { const A = String(a).split('\n'), B = String(b).split('\n'), count = (xs) => xs.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
  const ca = count(A), cb = count(B); let added = 0, removed = 0; cb.forEach((n, k) => { added += Math.max(0, n - (ca.get(k) || 0)); }); ca.forEach((n, k) => { removed += Math.max(0, n - (cb.get(k) || 0)); }); return { added, removed }; };
const bytes = (s) => Buffer.byteLength(String(s), 'utf8');

const out = {};
try {
  for (const [k, files] of Object.entries(variants)) {
    const sm = write(k, files), m = loadModel(sm, { root }), tm = modelOf(m.tmsl);
    const tp = titleProblems(tm), shadow = shadowModel(m.tmsl), health = Health.analyze(m.tmsl, null);
    const fpNames = new Set(tp.params.map((p) => p.table));
    const findingsOnParams = (health.findings || []).filter((f) => [...fpNames].some((t) => JSON.stringify(f).includes(t))).map((f) => f.id);
    const enFile = files['definition/tables/Metric Selection.tmdl'];
    out[k] = {
      unreadable: m.skipped.length,
      tables: (tm.tables || []).map((t) => `${t.name}: ${(t.columns || []).length} cols, ${(t.partitions || []).length} partition (${(t.partitions || []).map((p) => p.source && p.source.type).join(',')})`),
      parametersRecognised: tp.params.map((p) => `${p.table} (display ${p.display})`),
      groupByOnColumns: (tm.tables || []).flatMap((t) => (t.columns || []).filter((c) => c.relatedColumnDetails).map((c) => `${t.name}[${c.name}]`)),
      pickerTables: m.tables.map((t) => `${t.name}: ${t.columns.length} cols${t.hidden ? ' hidden' : ''}`),
      shadowKept: shadow.tables.filter((t) => t.kept).map((t) => `${t.name}: ${t.kept}`),
      cultures: (tm.cultures || []).map((c) => c.name),
      healthFindings: (health.findings || []).length, healthFindingsNamingParams: findingsOnParams,
      englishTableFile: { bytes: bytes(enFile), lines: enFile.split('\n').length, vsBaseline: { bytesDelta: bytes(enFile) - bytes(EN), ...lineDiff(EN, enFile) } },
      allDefinitionBytesDelta: Object.values(files).reduce((s, x) => s + bytes(x), 0) - Object.values(variants.baseline).reduce((s, x) => s + bytes(x), 0),
    };
  }
  // the scripts the person would paste in TMDL view, read back as the repo's tests read the metric switcher's
  const sA = script(AR_A), sB = script(EN_B), rA = readScript(sA), rB = readScript(sB);
  out.scripts = {
    A: { bytes: bytes(sA), lines: sA.split('\n').length, readBack: rA.skipped.length ? rA.skipped : 'ok', tables: rA.model.model.tables.map((t) => t.name), recognised: titleProblems(rA.model.model).params.length, replacesEnglishTable: false },
    B: { bytes: bytes(sB), lines: sB.split('\n').length, readBack: rB.skipped.length ? rB.skipped : 'ok', tables: rB.model.model.tables.map((t) => t.name), recognised: titleProblems(rB.model.model).params.length, replacesEnglishTable: true },
  };
  // the twin's reading of a slicer and a chart bound to the parameter (fieldParametersOf, as twin-plan.mjs:234 calls it)
  const chart = { name: 'c1', visual: { visualType: 'lineChart', query: { queryState: { Y: { projections: [{ field: { Measure: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: 'Total Customers' } } }],
    fieldParameters: [{ parameterExpr: { Column: { Expression: { SourceRef: { Entity: 'Metric Selection' } }, Property: 'Metric Selection' } }, index: 0, length: 1 }] } } } } };
  out.twinReads = fieldParametersOf([{ file: 'p/c1', json: chart }]);
  // what a returned answer would hold if it named the rows: the display strings live in the partition's DAX only
  const part = (out.baseline && loadModel(path.join(root, 'baseline', 'Made Up.SemanticModel'), { root })).tmsl.model.tables.find((t) => t.name === 'Metric Selection').partitions[0];
  out.displayStringsWhere = { partitionType: part.source.type, inExpressionOnly: ROWS.every((r) => String(part.source.expression).includes(q(r.en))), inAnyColumnName: false };
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
out.tempRemoved = !fs.existsSync(root);
console.log(JSON.stringify(out, null, 1));
