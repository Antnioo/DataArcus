// 0.3.2 SM2 (B-330; made-up model "Tiny": sales by region, a calendar with a month name): the two branches of
// lib/plan-artifact.mjs's exactArtifact that no earlier suite reached, run in a clean process (test-0.3.1-fx2.mjs, S1-S4).
//   node fixtures/sm2-artifact.mjs overlap|clear|month  -> one JSON line on stdout
//   overlap: the design's first page with its first chart moved over the first rows of its table (what C23 was; the
//            engine no longer makes it, so the page list is changed in this process before the libraries load)
//   clear:   the same design, the page list as the engine makes it
//   month:   a "languages: en+ar" plan's twin plan, and the plain twin's plan of the same English report, each one's month offer
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), M = pathToFileURL(path.join(HERE, '..')).href + '/', req = createRequire(import.meta.url);
const mode = process.argv[2];
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-sm2-')));
process.env.DATAARCUS_ROOT = ROOT;
if (mode === 'overlap') {
  const E = req('../../assets/js/design-engine.js'), was = E.projectPages;
  E.projectPages = (...a) => { const pages = was(...a), s = pages[0].slots, chart = s.find((x) => ['bar', 'line', 'column'].includes(x.kind)), table = s.find((x) => x.kind === 'table');
    if (chart && table) Object.assign(chart, { x: table.x + 8, y: table.y + 8, w: Math.round(table.w / 2), h: Math.round(table.h / 3) });
    return pages; };
}
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
const bim = { compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Product', 'string'), col('Date', 'dateTime')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }, { name: 'Margin', expression: 'SUM ( Sales[Amount] )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
fs.mkdirSync(path.join(ROOT, 't', 'Tiny.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 't', 'Tiny.SemanticModel', 'model.bim'), JSON.stringify(bim));
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Product]', table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]'] };
const { exactArtifact } = await import(M + 'lib/plan-artifact.mjs'), { withLookDefaults } = await import(M + 'lib/report-inputs.mjs'), { planLayout } = await import(M + 'lib/design.mjs');
const design = planLayout({ lang: 'en', layout: 'exec' }).design;
const ab = withLookDefaults({ path: 't', name: 'SM2', lang: 'en', design, fields: FIELDS, languages: mode === 'month' ? 'en+ar' : undefined });
let out;
try {
  const r = await exactArtifact(ab, 'pin', 'en');
  if (mode === 'month') {
    const { planTwin } = await import(M + 'lib/arabic-twin.mjs'), { reportRun } = await import(M + 'lib/report-run.mjs');
    const built = reportRun(withLookDefaults(Object.assign({}, ab, { languages: undefined })), 'build'), rep = built.files.find((f) => /^[^/]+\.Report\//.test(f.path)), base = rep.path.split('/')[0].replace(/\.Report$/, '');
    const plain = planTwin({ inMemory: { files: built.files, base, projectDir: built.m.projectDir }, into: 'same', waterfallRtl: ab.waterfallRtl });
    out = { copy: r && r.bilingual && r.bilingual.P.month, plain: plain.month };
  } else out = { status: r && r.check && r.check.status, byRule: r && r.check && r.check.byRule, blocking: r && r.check && (r.check.blocking || []).map((b) => b.rule) };
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
console.log(JSON.stringify(out));
