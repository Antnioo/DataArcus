import './test-env.mjs';
// Working folders as users name them, on every platform CI runs (Linux, Windows, macOS; 0.3.1 P1): an Arabic folder
// name, a name with spaces, a path over 300 characters, the same name in NFC and NFD, and files with CRLF line ends.
// read_model, create_report and create_arabic_twin work there and write only inside their folder. Then how paths are
// compared: a working folder given through a link (macOS's /var is a link to /private/var; a Windows junction) takes
// an absolute path in its real form, and a name in the other Unicode form is what the file system says it is: the same
// folder on macOS, another folder on Linux and Windows (read there, refused here, never the other folder's files).
// The projects are copies of made-up fixtures (fixtures/twin-project, test-models/no-measures).
//   node test-platform-paths.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TWIN = path.join(HERE, 'fixtures/twin-project'), PLAIN = path.join(HERE, 'test-models/no-measures');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? x.t.slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));

// a copy of a fixture; crlf: every text file's line ends made CRLF
const copy = (from, to, crlf) => {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) copy(a, b, crlf);
    else if (crlf && /\.(json|pbip|pbir|pbism|bim|tmdl)$/i.test(e.name)) fs.writeFileSync(b, fs.readFileSync(a, 'utf8').replace(/\r?\n/g, '\r\n'));
    else fs.copyFileSync(a, b);
  }
};
const files = (dir) => { const out = []; const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else out.push(f); } }; walk(dir); return out; };
const tablesOf = (r) => (r.j && (r.j.tables || []).map((t) => t.table || t.name)) || [];

// the working folder: the real path of a new temp folder (a test for the link case comes at the end)
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-paths-')));
const NFC = 'Café Nord', NFD = 'Café Nord';
const LONG = Array.from({ length: 6 }, (_, i) => `Level ${i + 1} of a long folder name for the path test`).join('/');
const FOLDERS = [
  ['arabic', 'تقارير المبيعات/الربع الرابع'], ['spaces', 'My Sales Reports 2026/Q4 review copy'],
  ['long', 'long/' + LONG], ['nfc', 'nf/' + NFC], ['crlf', 'crlf/Twin Sales'],
];
for (const [k, rel] of FOLDERS) copy(TWIN, path.join(ROOT, rel), k === 'crlf');
copy(PLAIN, path.join(ROOT, 'crlf-tmdl'), true);
const longPbip = path.join(ROOT, 'long', LONG, 'Twin Sales.pbip');

const servers = []; let fsSays = '';
const start = async (root) => { const s = await serverClient(root); servers.push(s); return s; };
try {
  const w = await start(ROOT);
  // ---------- each folder: read, a new report, the Arabic twin, nothing outside it ----------
  if (longPbip.length <= 300) throw new Error(`setup: the long project path is ${longPbip.length} characters, not over 300`);
  for (const [k, rel] of FOLDERS) {
    const dir = path.join(ROOT, rel), before = new Set(files(ROOT));
    const rm = await w.call('read_model', { path: rel + '/Twin Sales.pbip' });
    chk(() => !rm.err && tablesOf(rm).includes('Sales'), () => `${k}. read_model reads the project in "${rel}": ${short(rm)}`);
    const pl = await w.call('plan_layout', { path: rel, layout: 'exec', name: 'Paths' });
    const pid = pl.j && pl.j.plan && pl.j.plan.planId;
    if (pid) await w.call('approve_plan', { planId: pid });
    const cr = pid ? await w.call('create_report', { path: rel, name: 'Paths', planId: pid, design: pl.j.design }) : pl;
    chk(() => !cr.err && fs.existsSync(path.join(dir, 'Paths.pbip')), () => `${k}. create_report writes "Paths" in "${rel}": ${short(cr)}`);
    const tp = await w.call('create_arabic_twin', { path: rel + '/Twin Sales.pbip' });
    const tid = tp.j && tp.j.plan && tp.j.plan.planId;
    if (tid) await w.call('approve_plan', { planId: tid });
    const tw = tid ? await w.call('create_arabic_twin', { path: rel + '/Twin Sales.pbip', planId: tid }) : tp;
    chk(() => !tw.err && fs.readdirSync(dir).some((f) => /AR\.pbip$/.test(f)), () => `${k}. create_arabic_twin writes the twin in "${rel}": ${short(tw)}`);
    const realDir = fs.realpathSync.native(dir) + path.sep, added = files(ROOT).filter((f) => !before.has(f));
    const outside = added.filter((f) => !fs.realpathSync.native(f).startsWith(realDir));
    chk(() => added.length > 20 && !outside.length, () => `${k}. every file written is inside "${rel}" (${added.length} written): outside ${JSON.stringify(outside.slice(0, 3))}`);
  }
  const tm = await w.call('read_model', { path: 'crlf-tmdl' });
  chk(() => !tm.err && ['Orders', 'Dates'].every((t) => tablesOf(tm).includes(t)), () => `crlf. read_model reads a TMDL project with CRLF line ends: ${short(tm)}`);

  // ---------- the same name in NFC and NFD: what the file system says ----------
  const nfc = path.join(ROOT, 'nf', NFC), nfd = path.join(ROOT, 'nf', NFD);
  const oneFolder = fs.existsSync(nfd); // macOS: one folder, two spellings; Linux and Windows: no such folder yet
  fsSays = `NFC and NFD: ${oneFolder ? 'one folder' : 'two folders'} on ${process.platform}`;
  if (!oneFolder) copy(PLAIN, nfd); // another project under the other spelling: it must never be taken for the first
  const ino = (p) => fs.statSync(p, { bigint: true }).ino;
  chk(() => (ino(nfc) === ino(nfd)) === oneFolder, () => `nf-1. NFC and NFD are ${oneFolder ? 'one folder' : 'two folders'} on this file system (${process.platform})`);
  const r1 = await w.call('read_model', { path: `nf/${NFD}/Twin Sales.pbip` });
  chk(() => (oneFolder ? !r1.err && tablesOf(r1).includes('Sales') : r1.err), () => `nf-2. the project by its other spelling: ${oneFolder ? 'read (one folder)' : 'not found (the other folder has none)'}: ${short(r1)}`);
  const wc = await start(nfc);
  const r2 = await wc.call('read_model', { path: path.join(nfd, oneFolder ? 'Twin Sales.pbip' : 'Plain Orders.SemanticModel') });
  chk(() => (oneFolder ? !r2.err && tablesOf(r2).includes('Sales') : r2.err && !tablesOf(r2).length), () => `nf-3. working folder in NFC, an absolute path in NFD: ${oneFolder ? 'inside (one folder)' : 'refused (another folder)'}: ${short(r2)}`);
  const wd = await start(nfd);
  const r3 = await wd.call('read_model', { path: 'Twin Sales.pbip' });
  chk(() => (oneFolder ? !r3.err && tablesOf(r3).includes('Sales') : r3.err), () => `nf-4. working folder in NFD: ${oneFolder ? 'the same project' : 'never the NFC folder\'s project'}: ${short(r3)}`);

  // ---------- a working folder given through a link ----------
  const real = path.join(ROOT, 'linked-real'), link = path.join(ROOT, 'linked');
  copy(TWIN, real);
  fs.symlinkSync(real, link, process.platform === 'win32' ? 'junction' : 'dir');
  const wl = await start(link);
  const l1 = await wl.call('read_model', { path: 'Twin Sales.pbip' });
  chk(() => !l1.err && tablesOf(l1).includes('Sales'), () => `link-1. working folder through a link, a relative path: ${short(l1)}`);
  const l2 = await wl.call('read_model', { path: path.join(fs.realpathSync.native(real), 'Twin Sales.pbip') });
  chk(() => !l2.err && tablesOf(l2).includes('Sales'), () => `link-2. working folder through a link, an absolute path in its real form is inside: ${short(l2)}`);

  // ---------- a folder link inside the working folder that leads outside it (0.3.1 T1, the mutation suite: real()'s check
  // could be taken out and no test failed: every link test went through loadModel's own check; link-4 and link-5 guard
  // underRoot and realOf in this fast suite, which only test.mjs's slower parts did) ----------
  const outside = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-paths-out-')));
  try {
    fs.writeFileSync(path.join(outside, 'theme.json'), JSON.stringify({ name: 'outside-theme-T1' }));
    const wk = path.join(ROOT, 'with-link'); fs.mkdirSync(wk);
    fs.symlinkSync(outside, path.join(wk, 'out'), process.platform === 'win32' ? 'junction' : 'dir');
    let fileLink = true; try { fs.symlinkSync(path.join(outside, 'missing.json'), path.join(wk, 'gone.json')); } catch (e) { fileLink = false; /* no file links here (Windows without the right) */ }
    const script = `const M = await import(${JSON.stringify(pathToFileURL(path.join(HERE, 'lib/model.mjs')).href)}), F = await import(${JSON.stringify(pathToFileURL(path.join(HERE, 'lib/files.mjs')).href)});
      const t = (fn) => { try { return { ok: JSON.stringify(fn()).slice(0, 200) }; } catch (e) { return { err: String(e.message).slice(0, 200) }; } };
      console.log(JSON.stringify({ inside: t(() => M.inside('out/theme.json')), read: t(() => F.readUserFile('out/theme.json', { kind: 'theme', json: true })), free: t(() => F.freeFile('out', 'Theme', '.json')),
        abs: t(() => M.inside(${JSON.stringify(path.join(outside, 'theme.json'))})), model: t(() => M.loadModel(${JSON.stringify(outside)})), gone: t(() => M.inside('gone.json')) }));`;
    const r = spawnSync(process.execPath, ['--input-type=module', '-e', script], { env: { ...process.env, DATAARCUS_ROOT: wk }, encoding: 'utf8' });
    let o = {}; try { o = JSON.parse(r.stdout.trim().split('\n').pop()); } catch (e) { o = { none: r.stderr.slice(0, 300) }; }
    chk(() => o.inside.err && /through a link/.test(o.inside.err) && o.read.err && !/outside-theme-T1/.test(JSON.stringify(o)) && o.free.err && /through a link/.test(o.free.err),
      () => `link-3. a path through a folder link leading outside is refused by inside(), readUserFile and freeFile, and nothing of the outside file comes back: ${JSON.stringify(o)}`);
    chk(() => o.abs.err && /outside the allowed folder/.test(o.abs.err) && o.model.err && /outside the allowed folder/.test(o.model.err),
      () => `link-4. an absolute path outside the working folder is "outside the allowed folder" for inside() and loadModel: ${JSON.stringify(o)}`);
    chk(() => !fileLink || (o.gone.err && /through a link/.test(o.gone.err)), () => `link-5. a link whose target is missing counts as leading outside: ${JSON.stringify(o.gone)}`);
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
} finally {
  for (const s of servers) { try { await s.close(); } catch (e) { /* closed */ } }
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-platform-paths  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-platform-paths  ${checks} checks (${fsSays})`);
