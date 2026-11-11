// A made-up model and report written as a .pbip project on disk (0.3.3 OX2: IX2's helper, one place for the suites
// that check a report through the real server): <root>/<name>/Souq.SemanticModel/model.bim and
// <root>/<name>/Souq.Report/definition/... from a TMSL model and a { files: [{ path, json }] } report (hx1-souq.mjs's
// shape). opts.noModel: definition.pbir names a connection, not a model folder. Made-up data only: no rows.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TWIN = path.join(path.dirname(fileURLToPath(import.meta.url)), 'twin-project');
export function project(root, name, model, report, opts) {
  const o = opts || {}, d = path.join(root, name), sm = path.join(d, 'Souq.SemanticModel'), rp = path.join(d, 'Souq.Report');
  fs.mkdirSync(sm, { recursive: true }); fs.mkdirSync(path.join(rp, 'definition/pages'), { recursive: true });
  fs.copyFileSync(path.join(TWIN, 'Twin Sales.SemanticModel/definition.pbism'), path.join(sm, 'definition.pbism'));
  fs.writeFileSync(path.join(sm, 'model.bim'), JSON.stringify(model, null, 2));
  fs.writeFileSync(path.join(d, 'Souq.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'Souq.Report' } }], settings: {} }, null, 2));
  fs.writeFileSync(path.join(rp, 'definition.pbir'), JSON.stringify(o.noModel ? { version: '4.0', datasetReference: { byConnection: { connectionString: 'Data Source=x' } } } : { version: '4.0', datasetReference: { byPath: { path: '../Souq.SemanticModel' } } }, null, 2));
  fs.copyFileSync(path.join(TWIN, 'Twin Sales.Report/definition/version.json'), path.join(rp, 'definition/version.json'));
  const pages = [];
  report.files.forEach((f) => { const p = path.join(rp, f.path); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(f.json, null, 2)); const g = /^definition\/pages\/([^/]+)\/page\.json$/.exec(f.path); if (g) pages.push(g[1]); });
  fs.writeFileSync(path.join(rp, 'definition/pages/pages.json'), JSON.stringify({ pageOrder: pages, activePageName: pages[0] }, null, 2));
  return { dir: d, report: path.relative(root, path.join(d, 'Souq.pbip')).split(path.sep).join('/'), model: path.relative(root, sm).split(path.sep).join('/'), bim: path.join(sm, 'model.bim') };
}
