// Model Health Check: the engine sees every real use of a column (placeholder columns of measure tables,
// field parameters, DAX functions, aggregation tables), and the fix plan never gives a step that breaks
// the next refresh: nothing it removes is still needed by something that stays, including its own quick fixes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

// the engine and the TMDL builder exactly as the browser loads them (minified)
const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };

// a PBIR report with one table visual showing these fields: [kind, table, field]
const report = (refs) => ({ format: 'pbir', files: [{ path: 'definition/pages/p1/page.json', json: { displayName: 'P1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: refs.map(([k, e, p]) => ({ field: { [k]: { Expression: { SourceRef: { Entity: e } }, Property: p } } })) } } } } } }] });
const mpart = (n) => [{ name: n, source: { type: 'm', expression: 'let Source = Sql.Database(Server, Db) in Source' } }];
const sales = () => ({ name: 'Sales', columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }, { name: 'Key', dataType: 'int64', sourceColumn: 'Key' }], partitions: mpart('Sales') });
const enterData = 'let Source = Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("i44FAA==", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [Column1 = _t]) in Source';

export default async function () {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const E = load('model-health-engine.min.js');
  const col = (r, t, c) => (r.tables.find((x) => x.name === t) || { columns: [] }).columns.find((x) => x.name === c) || {};
  const unusedCols = (r) => ((r.findings.find((f) => f.id === 'UNUSED_COL') || {}).items || []).map((i) => i.obj);

  // ---- engine ----
  {
    // the "Enter data" placeholder column of a measures table is needed while its measures are
    const m = { model: { tables: [sales(), { name: '_Measures', columns: [{ name: 'Column1', dataType: 'string', isHidden: true, sourceColumn: 'Column1' }],
      measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '0' }], partitions: [{ name: 'x', source: { type: 'm', expression: enterData } }] }] } };
    const r = E.analyze(m, report([['Measure', '_Measures', 'Total']]));
    check(col(r, '_Measures', 'Column1').used === true, `placeholder column of a measures table: used = ${col(r, '_Measures', 'Column1').used}`);
    check(!unusedCols(r).includes('_Measures[Column1]'), 'placeholder column of a measures table reported unused');
  }

  return { checks, problems };
}
