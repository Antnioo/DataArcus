// S2, for the laptop (mcp/work/S2.md, "For the laptop"): renders one fixture's report in Power BI Desktop through the
// render driver (lib/desktop-render.mjs + lib/desktop-render.ps1), as render_report does, and saves each page's capture
// and the timings into a NEW folder. Windows with Power BI Desktop only. Not part of the server or the tests.
//   node research/render-try.mjs --fixture twin|arabic|health --out <new folder> [--literals stub|keep] [--pages 1,2]
// twin: the fixture's own report (English). arabic, health: the report create_report would write for the exec (arabic,
// Arabic) or analysis (health, English) layout, built in memory by the shared writer.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), MCP = path.join(HERE, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const fixture = arg('fixture', 'twin'), out = arg('out'), literals = arg('literals', 'keep'), pages = arg('pages') ? arg('pages').split(',').map(Number) : undefined;
if (!out) { console.error('--out <new folder> is needed'); process.exit(2); }
if (fs.existsSync(out)) { console.error(`${out} exists: give a new folder (nothing is written over)`); process.exit(2); }
const SRC = { twin: 'fixtures/twin-project', arabic: 'test-models/arabic-long-names', health: 'fixtures/health-project' }[fixture];
if (!SRC) { console.error('--fixture twin, arabic or health'); process.exit(2); }

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-render-try-'));
try {
  fs.cpSync(path.join(MCP, SRC), path.join(ROOT, fixture), { recursive: true });
  process.env.DATAARCUS_ROOT = ROOT;
  const { loadModel } = await import('../lib/model.mjs');
  const { renderProject } = await import('../lib/shadow-model.mjs');
  const { render, helperCommand } = await import('../lib/desktop-render.mjs');
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
    const built = plannedReport({ m, tables: m.tables, design, lang }, { second: true, title: 'Render ' + fixture });
    report = built.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }));
  }
  const pj = renderProject(m.tmsl, report, { name: 'DataArcus render', literals, pages });
  console.log(`pages to capture: ${pj.pages.map((p) => `${p.n} "${p.name}" (${p.id})`).join(', ')}; DAX constants: ${pj.literals.length}`);
  const r = await render(pj, { helper: helperCommand() });
  fs.mkdirSync(out, { recursive: true });
  r.pages.forEach((p) => { if (p.png) fs.writeFileSync(path.join(out, `page-${p.n}.png`), p.png); });
  const times = { fixture, openSeconds: r.openSeconds, totalSeconds: r.totalSeconds, pid: r.pid, pages: r.pages.map((p) => ({ n: p.n, name: p.name, settled: p.settled, seconds: p.seconds, error: p.error })), notClosed: r.notClosed, leftBehind: r.leftBehind };
  fs.writeFileSync(path.join(out, 'timings.json'), JSON.stringify(times, null, 2) + '\n');
  console.log(JSON.stringify(times, null, 2));
  console.log(`images in ${out}`);
} catch (e) {
  console.error((e && e.refused ? 'REFUSED: ' : 'FAILED: ') + (e && e.message || e));
  process.exitCode = 1;
} finally { fs.rmSync(ROOT, { recursive: true, force: true }); }
