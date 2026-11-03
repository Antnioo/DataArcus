// 0.3.2 SP14 (the split: B-280, B-286; mcp/work/SP14.md). A characterisation suite: the website's model input (pbip-bind.js
// fromFolder and fromFile, moved to assets/js/model-import-browser.js) gives the same answers and the same refusals as on
// the base (integration/0.3.2 29fc44b, before the move). In process, no browser: a chosen folder is file-like objects
// (webkitRelativePath, size, arrayBuffer) made from the made-up models in mcp/fixtures and mcp/test-models, in a fixed
// order; a .pbit goes through the Model Health Check's own worker (assets/js/model-health-worker.js) run in a Node vm.
// Recorded in fixtures/sp14-import.json: the answer's folder, path, others, reports, table and relationship counts, a
// hash of the whole answer and of suggest's binding on it (which reads the expressions the reader keeps aside), or the
// error's code. SP14_RECORD=1 records again (only on the base, never to make a run pass). No data values are read.
//   F1-F10  fromFolder: a project, the model folder itself, a .Dataset, a backup copy, two reports, UTF-16, refusals
//   G1-G7   fromFile: a model.bim, two .pbit through the worker, a .pbix, two over their limits, one at its limit
//   after the move: M1 pbip-bind.js forwards and holds no reading code;  M2 model-import-browser.js holds no parser copy
//   and its limits are PBIT_LIMITS';  M3 theme-generator.js loads model-import-browser before pbip-bind, once each
//   node test-0.3.2-sp14.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PBIT_LIMITS } from './lib/model.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(Buffer.from(t, 'utf8')).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp14-import.json');
const RECORD = process.env.SP14_RECORD === '1';
const Bind = require('../assets/js/pbip-bind.js');
const MB = 1024 * 1024;

// ---------- file-like objects, as the page's inputs give them ----------
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)).map((p) => d.name + '/' + p) : [d.name]));
const ab = (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.length);
// size: the size the browser says (a refusal is decided on it before anything is read)
const fileOf = (bytes, rel, size) => ({ name: rel.replace(/^.*\//, ''), webkitRelativePath: rel, size: size == null ? bytes.length : size, arrayBuffer: async () => ab(bytes) });
const dirOf = (src, prefix) => { const abs = path.join(REPO, src); return walk(abs).map((p) => fileOf(fs.readFileSync(path.join(abs, p)), prefix + '/' + p)); };
const bimOf = (src) => fs.readFileSync(path.join(REPO, src));
const text = (t) => Buffer.from(t, 'utf8');

const FOLDERS = [
  // F1 a project folder: its model (a model.bim), its report and .pbip
  ['F1 project', () => dirOf('mcp/fixtures/twin-project', 'twin-project')],
  // F2 the .SemanticModel folder itself, a TMDL model
  ['F2 model folder', () => dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Plain Orders.SemanticModel')],
  // F3 the older name, .Dataset, a TMDL model in a project folder with its report
  ['F3 dataset', () => dirOf('mcp/test-models/service-orders', 'service-orders').filter((f) => !/\.mjs$/.test(f.name)).map((f) => Object.assign(f, { webkitRelativePath: f.webkitRelativePath.replace('Service Orders.SemanticModel/', 'Service Orders.Dataset/') }))],
  // F4 a backup copy in a subfolder (another model) loses to the one at the top
  ['F4 backup', () => [...dirOf('mcp/fixtures/health-project', 'proj'), ...dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'proj/backup/Health Test.SemanticModel')]],
  // F5 two reports next to the model (a .Report folder and a .pbip), one deeper that is not counted
  ['F5 two reports', () => [...dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'p/Plain Orders.SemanticModel'),
    fileOf(text('{"version":"4.0","datasetReference":{"byPath":{"path":"../Plain Orders.SemanticModel"}}}'), 'p/Orders A.Report/definition.pbir'),
    fileOf(text('{"version":"1.0","artifacts":[{"report":{"path":"Orders B.Report"}}]}'), 'p/Orders B.pbip'),
    fileOf(text('{}'), 'p/old/Orders C.Report/definition.pbir')]],
  // F6 a model.bim saved as UTF-16 with its byte order mark
  ['F6 utf-16', () => [fileOf(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(bimOf('mcp/fixtures/fx4/fx4-financial/model.bim').toString('utf8'), 'utf16le')]), 'Financial.SemanticModel/model.bim')]],
  // F7 a folder with no model in it
  ['F7 no model', () => dirOf('mcp/fixtures/health-project/Health Test Report.Report', 'Health Test Report.Report')],
  // F8 a model folder with no tables
  ['F8 no tables', () => dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Empty.SemanticModel').filter((f) => !/\/tables\//.test(f.webkitRelativePath))],
  // F9 one TMDL file one byte over the 32 MB a file may be
  ['F9 tmdl too big', () => dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Plain Orders.SemanticModel').map((f) => (/Orders\.tmdl$/.test(f.name) ? Object.assign(f, { size: 32 * MB + 1 }) : f))],
  // F10 a model.bim one byte over the 64 MB
  ['F10 bim too big', () => [fileOf(bimOf('mcp/fixtures/fx4/fx4-retail/model.bim'), 'Retail.SemanticModel/model.bim', 64 * MB + 1)]]
];
const FILES = [
  ['G1 model.bim', () => fileOf(bimOf('mcp/fixtures/fx4/fx4-births/model.bim'), 'model.bim')],
  ['G2 legacy pbit', () => fileOf(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/model-health/legacy.pbit')), 'legacy.pbit')],
  ['G3 tmdl pbit', () => fileOf(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/model-health/tmdl-health/Health Test.pbit')), 'Health Test.pbit')],
  ['G4 pbix', () => fileOf(text('PK not read'), 'Sales.pbix')],
  ['G5 bim too big', () => fileOf(bimOf('mcp/fixtures/fx4/fx4-births/model.bim'), 'model.bim', 64 * MB + 1)],
  ['G6 pbit too big', () => fileOf(fs.readFileSync(path.join(REPO, 'scripts/tests/fixtures/model-health/legacy.pbit')), 'legacy.pbit', 300 * MB + 1)],
  ['G7 bim at the limit', () => fileOf(bimOf('mcp/fixtures/fx4/fx4-retail/model.bim'), 'model.bim', 64 * MB)]
];

// ---------- the Model Health Check's worker, run in a vm (its importScripts read the engines' sources) ----------
let workers = 0;
class VmWorker {
  constructor(url) {
    workers++; this.url = url; this.onmessage = null; this.onerror = null; this.done = false;
    const ctx = { console, TextDecoder, TextEncoder, Blob, DecompressionStream, Response, setTimeout, clearTimeout };
    ctx.self = ctx; vm.createContext(ctx);
    ctx.importScripts = (...names) => names.forEach((n) => { const f = n.replace(/\?.*$/, '').replace(/\.min\.js$/, '.js'); vm.runInContext(fs.readFileSync(path.join(REPO, 'assets/js', f), 'utf8'), ctx, { filename: f }); });
    ctx.postMessage = (d) => { if (!this.done && this.onmessage) this.onmessage({ data: JSON.parse(JSON.stringify(d)) }); };
    vm.runInContext(fs.readFileSync(path.join(REPO, 'assets/js/model-health-worker.js'), 'utf8'), ctx, { filename: 'model-health-worker.js' });
    this.ctx = ctx;
  }
  postMessage(msg) { Promise.resolve().then(() => this.ctx.onmessage({ data: msg })).catch(() => { if (this.onerror) this.onerror(new Error('worker')); }); }
  terminate() { this.done = true; }
}
globalThis.Worker = VmWorker;
const WORKER_URL = '/assets/js/model-health-worker.min.js?v=20261026a';

// the answer as recorded: its shape in plain sight, the rest as hashes
const shapeOf = (res) => ({
  folder: res.folder, path: res.path, others: res.others, reports: res.reports,
  tables: res.tables.length, names: res.tables.map((t) => t.name).join('|'), rels: (res.relationships || []).length,
  all: sha(JSON.stringify(res)),
  bind: sha(JSON.stringify(Bind.suggest(res.tables, 4, Object.assign({ lang: 'en' }, (res.relationships || []).length ? { relationships: res.relationships, modelTables: res.tables } : {}))))
});
const answer = (p) => p.then(shapeOf, (e) => ({ error: String(e && e.message || e) }));

const gold = RECORD ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const got = {};
const same = (id, now) => {
  got[id] = now; const g = gold[id] || {};
  chk(() => RECORD || JSON.stringify(now) === JSON.stringify(g),
    () => `${id}: the answer differs: ${Object.keys(Object.assign({}, g, now)).filter((k) => JSON.stringify(now[k]) !== JSON.stringify(g[k])).map((k) => k + ' ' + JSON.stringify(now[k]).slice(0, 40) + ' (recorded ' + JSON.stringify(g[k]).slice(0, 40) + ')').join(', ')}`);
};

try {
  for (const [id, files] of FOLDERS) same(id, await answer(Promise.resolve().then(() => Bind.fromFolder(files()))));
  for (const [id, file] of FILES) same(id, await answer(Promise.resolve().then(() => Bind.fromFile(file(), WORKER_URL))));
  // (part of G2 and G3, not a check of its own: the worker is started for the two .pbit files only)
  if (workers !== 2) problems.push(`G2/G3 the worker must be started for the two .pbit files only (started ${workers} times)`);

  // ---------- after the move (SP14): the input is model-import-browser.js's; pbip-bind forwards ----------
  if (!RECORD && process.env.SP14_BASE !== '1') {
    const read = (f) => fs.readFileSync(path.join(REPO, 'assets', 'js', f), 'utf8');
    const bindSrc = read('pbip-bind.js'), imp = read('model-import-browser.js'), Imp = require('../assets/js/model-import-browser.js');
    let calls = 0; const real = Imp.fromFolder;
    try { Imp.fromFolder = (...a) => { calls++; return real(...a); }; await Bind.fromFolder(dirOf('mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Plain Orders.SemanticModel')); } finally { Imp.fromFolder = real; }
    chk(() => calls === 1 && !/webkitRelativePath|new Worker|decodeText|LIMITS|TOO_BIG|PBIX|arrayBuffer|TextDecoder/.test(bindSrc),
      () => `M1 pbip-bind.js's fromFolder must forward to model-import-browser.js (called ${calls} times) and hold no reading code of its own`);
    const L = Imp.LIMITS;
    chk(() => !/function fromTmsl|relsOfTmsl\s*=|LocalDateTable_|require\(['"]\.\/pbip-bind/.test(imp) && !/dataType:|measures:\s*\(/.test(imp)
      && /mcp\/lib\/model\.mjs PBIT_LIMITS/.test(imp) && L.model === PBIT_LIMITS.model && L.entry === PBIT_LIMITS.entry && L.total === PBIT_LIMITS.total && L.file === PBIT_LIMITS.file,
      () => `M2 model-import-browser.js must call pbip-bind's parsers (no copy of them) and keep the MCP's limits, with the comment that ties them: ${JSON.stringify(L)}`);
    const tg = read('theme-generator.js'), at = (f) => tg.indexOf('/assets/js/' + f + '.min.js?v='), once = (f) => tg.split('/assets/js/' + f + '.min.js?v=').length === 2;
    chk(() => once('model-import-browser') && once('pbip-bind') && at('model-import-browser') < at('pbip-bind') && at('model-import-browser') > tg.indexOf('const loadBind'),
      () => 'M3 theme-generator.js\'s loadBind must load model-import-browser.min.js once, before pbip-bind.min.js');
  }

  if (RECORD) fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n');
} catch (e) { problems.push('crashed: ' + String(e && e.stack || e).slice(0, 400)); }

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp14.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp14  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp14  ${checks} checks${RECORD ? ' (recorded)' : ''}`);
