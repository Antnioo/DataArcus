// R1, for the laptop (mcp/research/SEE-THE-RESULT.md, "For the laptop"): writes the shadow project of one fixture into a
// NEW folder, to open by hand in Power BI Desktop. Research only: not part of the server or the tests.
//   node research/shadow-try.mjs --fixture twin|arabic|health --form m|dax --out <new folder>
// twin: the fixture's own report (Twin Sales.Report, English). arabic, health: the report create_report would write for
// the exec (arabic, Arabic) or analysis (health, English) layout, built in memory by the shared writer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fixture = arg('fixture', 'twin'), form = arg('form', 'm'), out = arg('out');
if (!out) { console.error('--out <new folder> is needed'); process.exit(2); }
if (fs.existsSync(out)) { console.error(`${out} exists: give a new folder (nothing is written over)`); process.exit(2); }
const SRC = { twin: 'fixtures/twin-project', arabic: 'test-models/arabic-long-names', health: 'fixtures/health-project' }[fixture];
if (!SRC) { console.error('--fixture twin, arabic or health'); process.exit(2); }

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-shadow-try-'));
try {
  fs.cpSync(path.join(MCP, SRC), path.join(ROOT, fixture), { recursive: true });
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('../lib/model.mjs');
  const { shadowProject } = await import('../lib/shadow-model.mjs');
  const m = loadModel(fixture, { root: ROOT });
  let report;
  if (fixture === 'twin') {
    const dir = path.join(ROOT, fixture, 'Twin Sales.Report'), files = [];
    const rec = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) rec(f); else files.push({ path: path.relative(dir, f).split(path.sep).join('/'), data: fs.readFileSync(f) }); });
    rec(dir); report = files;
  } else {
    const { plannedReport } = await import('../lib/plan-lint.mjs');
    const { planLayout } = await import('../lib/design.mjs');
    const lang = fixture === 'arabic' ? 'ar' : 'en', design = planLayout({ layout: fixture === 'arabic' ? 'exec' : 'analysis', lang }).design;
    const built = plannedReport({ m, tables: m.tables, design, lang }, { second: true, title: 'Shadow ' + fixture });
    report = built.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }));
  }
  const pj = shadowProject(m.tmsl, { name: 'Shadow ' + fixture, report, form });
  pj.files.forEach((f) => { const p = path.join(out, ...f.path.split('/')); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, f.data != null ? f.data : f.text); });
  console.log(`wrote ${pj.files.length} files to ${out}: open "${path.join(out, 'Shadow ' + fixture + '.pbip')}"`);
  console.log(`tables: ${pj.tables.map((t) => `${t.name} ${t.rows == null ? t.kept : t.rows + ' rows'}`).join(', ')}`);
  if (pj.guessed.length) console.log('types guessed: ' + pj.guessed.map((g) => `${g.table}[${g.column}] ${g.as}`).join(', '));
  if (pj.notes.length) console.log('notes: ' + pj.notes.join('; '));
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
