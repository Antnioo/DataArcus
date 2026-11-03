// AF2 (0.3.1; the critical release audit of 25 Oct, re-checked by the reviewer on 1fdf031; written red first): what is
// written after the go is exactly what the plan showed, or nothing is written.
//   AF-N  create_report's native copy (customVisualsFrom): the plan keeps the exact files with their digest; the written
//         tree is the plan's digest, its .platform logical id the plan's; the .pbip next to the report (which no print
//         sees when the path given is the .Report folder) changed after the go: nothing written
//   AF-R  the same for the redesign (redesignFrom)
//   AF-H  check_model_health: the plan names the free name (the plain one taken); that name taken after the go: nothing
//         written, the other file untouched. And the model changed right before the write: nothing written
//   AF-G  add_gulf_calendar, the full calendar: the same two; AF-A its Arabic columns: the name taken after the go
//   AF-T  generate_theme: the free name at the plan; taken after the go: nothing written
//   AF-C  create_report's format script: in the plan's digest; its name taken after the go: nothing written; written
//         with the same plan once the name is free again, the written tree the plan's digest
//   AF-F  the answers file's temp: replaced by another file before a forced failure, that file survives
// In process: the tools' own handlers and the gate (lib/plans.mjs), the approval given as the window's click gives it.
// Fixtures: mcp/fixtures/twin-project, mcp/fixtures/health-project (made up).   node test-0.3.1-audit-writes.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);

// the working folder first: the library modules read DATAARCUS_ROOT when they are loaded
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-af2-')));
process.env.DATAARCUS_ROOT = ROOT;
const fresh = (name, fixture) => { fs.rmSync(path.join(ROOT, name), { recursive: true, force: true }); fs.cpSync(path.join(HERE, 'fixtures', fixture), path.join(ROOT, name), { recursive: true }); return path.join(ROOT, name); };

const Plans = await import('./lib/plans.mjs');
const { digestOf } = await import('./lib/artifact.mjs');
const { LIMITS } = await import('./lib/tool-limits.mjs');
const { readAnswers, writeAnswers } = await import('./lib/answers.mjs');
const { setIo } = await import('./lib/write-io.mjs');
const H = {};
for (const t of ['plan_layout', 'create_report', 'check_model_health', 'add_gulf_calendar', 'generate_theme']) {
  const { register } = await import(`./tools/${t}.mjs`);
  register({ registerTool: (name, def, h) => { H[name] = h; } }, { LIMITS });
}
const call = async (tool, a) => { const r = await H[tool](a), t = (r.content || []).map((c) => c.text).join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* a refusal's words */ } return { err: !!r.isError, t, j }; };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const idOf = (p) => p.j && p.j.plan && p.j.plan.planId;
const approve = (id) => Plans.approve(id, 'user-in-browser');
// the files written into a folder, as digestOf reads a tree: paths from that folder, '/' between parts
const onDisk = (dir, names) => names.flatMap((n) => { const f = path.join(dir, n); return fs.existsSync(f) && fs.statSync(f).isDirectory() ? tree(f) : fs.existsSync(f) ? [f] : []; })
  .map((f) => ({ path: path.relative(dir, f).split(path.sep).join('/'), data: fs.readFileSync(f) }));
const listing = (dir) => tree(dir).map((f) => path.relative(dir, f)).sort().join('\n');
const logicalId = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).config.logicalId; } catch (e) { return null; } };
const editPbip = (f) => { const j = JSON.parse(fs.readFileSync(f, 'utf8')); j.settings = Object.assign({}, j.settings, { enableAutoRecovery: false }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); };
const OTHER = '// someone else\'s file\n';
const withEdit = async (rel, fn) => { process.env.DATAARCUS_TEST_EDIT_BEFORE_WRITE = rel; try { return await fn(); } finally { delete process.env.DATAARCUS_TEST_EDIT_BEFORE_WRITE; } };

try {
  // AF-N, AF-R: the two copies of an existing report
  for (const [tag, dir, mode, out] of [['AF-N', 'n', 'customVisualsFrom', 'Twin Sales native'], ['AF-R', 'r', 'redesignFrom', 'Twin Sales redesigned']]) {
    const args = (d) => ({ path: mode === 'redesignFrom' ? `${d}/Twin Sales.SemanticModel` : d, [mode]: `${d}/Twin Sales.Report` });
    // the written copy
    const D = fresh(dir, 'twin-project');
    const p = await call('plan_layout', args(dir)), id = idOf(p), art = id ? Plans.artifactOf(id) : null;
    const said = p.j && (mode === 'redesignFrom' ? p.j.redesign : p.j.customVisuals);
    chk(() => id && art && /^[0-9a-f]{64}$/.test(art.digest) && said && said.exact && said.exact.digest === art.digest, () => `${tag}1. the plan keeps the exact files and says their digest: ${short(p)}`);
    approve(id);
    const w = await call('create_report', Object.assign(args(dir), { planId: id })), disk = onDisk(D, [out + '.Report', out + '.pbip']);
    chk(() => !w.err && disk.length === art.files.length && digestOf(disk) === art.digest, () => `${tag}2. the written tree is the plan's digest: ${short(w)}; ${disk.length} files on disk, ${art && art.files.length} kept`);
    chk(() => art.logicalId && logicalId(path.join(D, out + '.Report/.platform')) === art.logicalId, () => `${tag}3. the written .platform's logical id is the plan's`);
    // the .pbip next to the report changed after the go (the print of a .Report path does not read it)
    const E = fresh(dir + '2', 'twin-project'), before = listing(E);
    const p2 = await call('plan_layout', args(dir + '2')), id2 = idOf(p2);
    approve(id2);
    editPbip(path.join(E, 'Twin Sales.pbip'));
    const w2 = await call('create_report', Object.assign(args(dir + '2'), { planId: id2 }));
    chk(() => w2.err && /^Nothing was written/.test(w2.t), () => `${tag}4. a file the prints don't see, changed after the go: refused: ${short(w2)}`);
    chk(() => listing(E) === before && !fs.existsSync(path.join(E, out + '.Report')), () => `${tag}5. nothing was written`);
  }

  // AF-H: check_model_health's scripts
  {
    const D = fresh('h1', 'health-project'), plain = path.join(D, 'Health Test - fix sort order.tmdl'), next = path.join(D, 'Health Test - fix sort order 2.tmdl');
    fs.writeFileSync(plain, OTHER);
    const p = await call('check_model_health', { path: 'h1/Health Test.SemanticModel' }), id = idOf(p);
    chk(() => id && p.j.fixes.MONTH_SORT.scriptAfterGo === 'Health Test - fix sort order 2.tmdl' && p.j.plan.writesAfterGo.some((x) => x.includes('"Health Test - fix sort order 2.tmdl"')), () => `AF-H1. the plan names the free name it will write: ${short(p)} ${JSON.stringify(p.j && p.j.fixes && p.j.fixes.MONTH_SORT && p.j.fixes.MONTH_SORT.scriptAfterGo)}`);
    approve(id);
    fs.writeFileSync(next, OTHER);
    const before = listing(D), w = await call('check_model_health', { path: 'h1/Health Test.SemanticModel', planId: id });
    chk(() => w.err && /^Nothing was written: "Health Test - fix sort order 2\.tmdl" is already there/.test(w.t) && /plan again/.test(w.t), () => `AF-H2. the shown name taken after the go: refused: ${short(w)}`);
    chk(() => listing(D) === before && fs.readFileSync(next, 'utf8') === OTHER, () => `AF-H3. nothing was written, the other file untouched: ${listing(D).split('\n').filter((f) => /\.tmdl$/.test(f)).join(', ')}`);
  }
  {
    const D = fresh('h2', 'health-project'), before = listing(D);
    const p = await call('check_model_health', { path: 'h2/Health Test.SemanticModel' }), id = idOf(p);
    approve(id);
    const w = await withEdit('h2/Health Test.SemanticModel/model.bim', () => call('check_model_health', { path: 'h2/Health Test.SemanticModel', planId: id }));
    chk(() => w.err && /^Nothing was written: the model changed after you approved/.test(w.t), () => `AF-H4. the model changed after the gate, before the write: refused: ${short(w)}`);
    chk(() => listing(D) === before, () => `AF-H5. nothing was written: ${listing(D).split('\n').filter((f) => /\.tmdl$/.test(f)).join(', ')}`);
  }

  // AF-G: add_gulf_calendar, the full calendar
  {
    const D = fresh('g1', 'health-project'), A = { path: 'g1/Health Test.SemanticModel', firstYear: 2024, lastYear: 2025 };
    fs.writeFileSync(path.join(D, 'Health Test - add Gulf calendar.tmdl'), OTHER);
    const p = await call('add_gulf_calendar', A), id = idOf(p), next = path.join(D, 'Health Test - add Gulf calendar 2.tmdl');
    chk(() => id && p.j.scriptAfterGo === 'Health Test - add Gulf calendar 2.tmdl', () => `AF-G1. the plan names the free name: ${short(p)}`);
    approve(id);
    fs.writeFileSync(next, OTHER);
    const before = listing(D), w = await call('add_gulf_calendar', Object.assign({ planId: id }, A));
    chk(() => w.err && /^Nothing was written: "Health Test - add Gulf calendar 2\.tmdl" is already there/.test(w.t), () => `AF-G2. the shown name taken after the go: refused: ${short(w)}`);
    chk(() => listing(D) === before && fs.readFileSync(next, 'utf8') === OTHER, () => `AF-G3. nothing was written, the other file untouched: ${listing(D).split('\n').filter((f) => /\.tmdl$/.test(f)).join(', ')}`);
  }
  {
    const D = fresh('g2', 'health-project'), A = { path: 'g2/Health Test.SemanticModel', firstYear: 2024, lastYear: 2025 }, before = listing(D);
    const p = await call('add_gulf_calendar', A), id = idOf(p);
    approve(id);
    const w = await withEdit('g2/Health Test.SemanticModel/model.bim', () => call('add_gulf_calendar', Object.assign({ planId: id }, A)));
    chk(() => w.err && /^Nothing was written: the model changed after you approved/.test(w.t), () => `AF-G4. the model changed after the gate, before the write: refused: ${short(w)}`);
    chk(() => listing(D) === before, () => `AF-G5. nothing was written: ${listing(D).split('\n').filter((f) => /\.tmdl$/.test(f)).join(', ')}`);
  }
  // AF-A: the Arabic calendar columns
  {
    const D = fresh('g3', 'health-project'), A = { path: 'g3/Health Test.SemanticModel', arabicColumnsOnly: true };
    const p = await call('add_gulf_calendar', A), id = idOf(p), shown = path.join(D, p.j && p.j.scriptAfterGo || 'none');
    approve(id);
    fs.writeFileSync(shown, OTHER);
    const before = listing(D), w = await call('add_gulf_calendar', Object.assign({ planId: id }, A));
    chk(() => w.err && /^Nothing was written: "Health Test - Arabic calendar\.tmdl" is already there/.test(w.t), () => `AF-A1. the shown name taken after the go: refused: ${short(w)}`);
    chk(() => listing(D) === before && fs.readFileSync(shown, 'utf8') === OTHER, () => `AF-A2. nothing was written, the other file untouched: ${listing(D).split('\n').filter((f) => /\.tmdl$/.test(f)).join(', ')}`);
  }

  // AF-T: generate_theme's file
  {
    const D = path.join(ROOT, 'themes'); fs.mkdirSync(D, { recursive: true });
    fs.writeFileSync(path.join(D, 'brand.json'), OTHER);
    const p = await call('generate_theme', { name: 'Brand', folder: 'themes' }), id = idOf(p);
    chk(() => id && p.j.fileAfterGo === 'brand-2.json' && p.j.plan.writesAfterGo.some((x) => x.includes('"brand-2.json"')), () => `AF-T1. the plan names the free name: ${short(p)}`);
    approve(id);
    fs.writeFileSync(path.join(D, 'brand-2.json'), OTHER);
    const before = listing(D), w = await call('generate_theme', { name: 'Brand', folder: 'themes', planId: id });
    chk(() => w.err && /^Nothing was written: "brand-2\.json" is already there/.test(w.t), () => `AF-T2. the shown name taken after the go: refused: ${short(w)}`);
    chk(() => listing(D) === before && fs.readFileSync(path.join(D, 'brand-2.json'), 'utf8') === OTHER, () => `AF-T3. nothing was written, the other file untouched: ${listing(D)}`);
  }

  // AF-C: create_report's format script, inside the plan's digest
  {
    const D = fresh('c1', 'health-project'), A = { path: 'c1', name: 'Fmt', layout: 'exec' };
    // (a measure with no format: the plan's format script sets it, as in the approval-disclosure suite)
    { const f = path.join(D, 'Health Test.SemanticModel/model.bim'), j = JSON.parse(fs.readFileSync(f, 'utf8')); j.model.tables.find((x) => x.name === '_Measures').measures.push({ name: 'Margin %', expression: 'DIVIDE ( [Total], [Total] + 1 )' }); fs.writeFileSync(f, JSON.stringify(j, null, 2)); }
    const p = await call('plan_layout', A), id = idOf(p), art = id ? Plans.artifactOf(id) : null, script = 'Health Test - fix formats.tmdl';
    chk(() => art && p.j.formats && p.j.formats.scriptAfterGo === script && art.files.some((f) => f.path === script), () => `AF-C1. the format script the plan names is one of the plan's exact files: ${short(p)} ${JSON.stringify(art && art.files.filter((f) => !/\//.test(f.path)).map((f) => f.path))}`);
    approve(id);
    fs.writeFileSync(path.join(D, script), OTHER);
    const before = listing(D), w = await call('create_report', Object.assign({ planId: id, design: p.j.design }, A));
    chk(() => w.err && /^Nothing was written/.test(w.t) && listing(D) === before && fs.readFileSync(path.join(D, script), 'utf8') === OTHER, () => `AF-C2. its name taken after the go: refused, nothing written: ${short(w)}`);
    fs.rmSync(path.join(D, script));
    const w2 = await call('create_report', Object.assign({ planId: id, design: p.j.design }, A)), disk = onDisk(D, ['Fmt.Report', 'Fmt.pbip'].concat(art ? art.files.filter((f) => !/\//.test(f.path) && !/\.pbip$/.test(f.path)).map((f) => f.path) : []));
    chk(() => !w2.err && digestOf(disk) === art.digest, () => `AF-C3. the same plan writes once the name is free, the written files the plan's digest: ${short(w2)}`);
  }

  // AF-F: the answers file's temp, replaced by another program before a failure: that file is left
  {
    const D = path.join(ROOT, 'f'); fs.mkdirSync(D);
    writeAnswers(D, 'M', [], readAnswers(D, 'M'));
    const was = fs.readFileSync(path.join(D, 'M.dataarcus-answers.json'), 'utf8');
    let tmp = null;
    setIo({ renameSync: (a) => { tmp = a; fs.unlinkSync(a); fs.writeFileSync(a, OTHER); const e = new Error('EIO: the rename failed (a test)'); e.code = 'EIO'; throw e; } });
    let threw = false; try { writeAnswers(D, 'M', [], readAnswers(D, 'M')); } catch (e) { threw = true; } finally { setIo(); }
    chk(() => threw && tmp && fs.existsSync(tmp) && fs.readFileSync(tmp, 'utf8') === OTHER, () => `AF-F1. the file put at the temp's name survives the clean-up: ${tmp} ${tmp && fs.existsSync(tmp)}`);
    chk(() => fs.readFileSync(path.join(D, 'M.dataarcus-answers.json'), 'utf8') === was, () => 'AF-F2. the answers file is as it was');
  }
} finally {
  fs.rmSync(ROOT, { recursive: true, force: true });
}
if (problems.length) { problems.forEach((p) => console.log('  x ' + p)); console.log(`FAIL  audit-writes  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  audit-writes  ${checks} checks`);
