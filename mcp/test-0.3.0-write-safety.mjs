import './test-env.mjs';
// 0.3.0 R4 (the outside audit of 19 Oct, F01-F03 and F06): the rollback of a failed write removes only what this call
// created, never what another program put at one of its names; folders are made one level at a time; no file is ever
// renamed over a name; check_model_health's scripts and create_report's format script follow the plan policy.
// Written red first.
//   S1-S3  F01: a file or folder this call created and another program replaced (or a link put on the way) survives the rollback
//   S4-S5  F02: a folder another program made while freeFile made its folders survives; a mkdir that fails half-way leaves nothing
//   S6-S7  F03: with no hard links, nothing is renamed over a name; a tree's folder that appears mid-write is never replaced
//   S8     F01 for writeFileNew's madeDirs: a folder made by freeFile and replaced before the rollback survives
//   H1-H3  F06: check_model_health's scripts: the plan is used only when the disk is not as approved; leftovers named exactly
//   C1-C2  F06: create_report's format script is written inside the plan's write; its leftovers named exactly
//   node test-0.3.0-write-safety.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 600) : JSON.stringify(x.j).slice(0, 600));
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r4-')));
const OUT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r4-out-')));   // outside the working folder
process.env.DATAARCUS_ROOT = ROOT;
const tree = (d) => { const out = []; const walk = (x) => { if (!fs.existsSync(x)) return; for (const e of fs.readdirSync(x, { withFileTypes: true })) { const f = path.join(x, e.name), r = path.relative(d, f).split(path.sep).join('/'); if (e.isDirectory()) { out.push(r + '/'); walk(f); } else out.push(r + (e.isSymbolicLink() ? '@' : '')); } }; walk(d); return out.sort(); };
const threw = (fn) => { try { fn(); return null; } catch (e) { return e; } };
const ino = (p) => { const s = fs.lstatSync(p, { bigint: true }); return s.dev + ':' + s.ino; };
const errOf = (code) => Object.assign(new Error(code + ': a test'), { code });
const dirLink = (target, at) => fs.symlinkSync(target, at, process.platform === 'win32' ? 'junction' : 'dir');

const W = await import('./lib/write-io.mjs');
const F = await import('./lib/files.mjs');
const data = JSON.stringify({ name: 'x'.repeat(2000) });
const files = [{ path: 'R.Report/definition/report.json', data }, { path: 'R.Report/definition/pages/p1/page.json', data }, { path: 'R.Report/definition.pbir', data }, { path: 'R.pbip', data }];
const fresh = (n) => { const d = path.join(ROOT, n); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d); return d; };

// S1. writeFileNew: the file is in place, then another program replaces it before the rollback: theirs survives, named
{
  const D = fresh('s1'), f = path.join(D, 'Theme.json'); let once = false;
  W.setIo({ unlinkSync(p) { if (!once && /\.dataarcus-tmp-/.test(String(p))) { once = true; fs.unlinkSync(f); fs.writeFileSync(f, 'theirs'); throw errOf('EIO'); } return fs.unlinkSync(p); } });
  const e = threw(() => W.writeFileNew(f, data));
  W.setIo();
  chk(() => e && fs.readFileSync(f, 'utf8') === 'theirs', () => `S1. a file another program put at the name after placement survives the rollback: ${fs.existsSync(f) ? fs.readFileSync(f, 'utf8').slice(0, 20) : 'gone'} ${e && e.message}`);
  chk(() => e && e.left && e.left.foreign.includes(f) && e.message.includes('"s1/Theme.json"'), () => `S1. it is named as left, not created by this call: ${e && e.message}`);
  chk(() => tree(D).join('|') === 'Theme.json', () => `S1. the temporary file is still removed: ${tree(D)}`);
}
// S2. writeTree: a file of the tree is replaced by another program before the rollback: theirs survives, the rest is removed
{
  const D = fresh('s2'), mine = path.join(D, 'R.Report/definition/report.json');
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { fs.unlinkSync(mine); fs.writeFileSync(mine, 'theirs'); throw new Error('simulated failure'); } } }));
  chk(() => e && fs.existsSync(mine) && fs.readFileSync(mine, 'utf8') === 'theirs', () => `S2. a tree file replaced by another program survives the rollback: ${tree(D)} ${e && e.message}`);
  chk(() => JSON.stringify(tree(D)) === JSON.stringify(['R.Report/', 'R.Report/definition/', 'R.Report/definition/report.json']) && e.left.foreign.includes(mine), () => `S2. everything else of the call is removed, theirs named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// S3. writeTree: a folder of the tree is swapped for a link to a folder outside the working folder before the rollback:
// nothing outside the created tree is removed
{
  const D = fresh('s3'), theirs = path.join(OUT, 's3'); fs.mkdirSync(path.join(theirs, 'pages', 'p1'), { recursive: true });
  fs.writeFileSync(path.join(theirs, 'report.json'), 'theirs'); fs.writeFileSync(path.join(theirs, 'pages', 'p1', 'page.json'), 'theirs');
  let linked = false;
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { const d = path.join(D, 'R.Report', 'definition'); fs.renameSync(d, path.join(D, 'moved')); try { dirLink(theirs, d); linked = true; } catch (x) { /* no links here */ } throw new Error('simulated failure'); } } }));
  chk(() => !linked || (fs.readFileSync(path.join(theirs, 'report.json'), 'utf8') === 'theirs' && fs.readFileSync(path.join(theirs, 'pages', 'p1', 'page.json'), 'utf8') === 'theirs'), () => `S3. no file behind a link swapped in is removed: ${JSON.stringify(tree(theirs))} ${e && e.message}`);
  chk(() => !linked || (e && e.left && e.left.foreign.concat(e.left.ours).includes(path.join(D, 'R.Report', 'definition')) && fs.lstatSync(path.join(D, 'R.Report', 'definition')).isSymbolicLink()), () => `S3. the link is left where it is and named: ${e && e.message}`);
  chk(() => linked, () => 'S3. (a folder link could be made here)');
}
// (0.3.1 T1, the mutation suite: S2 and S3 still passed with the identity check or the folders-on-the-way check taken
// out of removeOurs, since the size or the link told the change first) S2b-S3c close that:
// S2b. writeTree: a file of the tree is moved away by another program and a file of as many bytes put at its name: only
// its identity (dev + ino) tells it is not ours, and it survives. (Moved, not deleted: a deleted file's inode number can be
// given to the next new file at once, and then nothing tells the two apart: T1.md, "Seen, not in scope")
{
  const D = fresh('s2b'), mine = path.join(D, 'R.Report/definition/report.json');
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { const n = fs.statSync(mine).size; fs.renameSync(mine, path.join(D, 'kept.json')); fs.writeFileSync(mine, 'T'.repeat(n)); throw new Error('simulated failure'); } } }));
  chk(() => e && fs.existsSync(mine) && /^T+$/.test(fs.readFileSync(mine, 'utf8')) && e.left.foreign.includes(mine), () => `S2b. a tree file replaced by one of the same size survives the rollback, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// S3b. writeTree: a folder of the tree is moved away and another folder put at its name, holding the very file this call
// wrote (a hard link: same identity, same size): the folder on the way is not ours, so the file is left
{
  const D = fresh('s3b'), d = path.join(D, 'R.Report', 'definition'); let linked = false;
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { fs.renameSync(d, path.join(D, 'moved')); fs.mkdirSync(d); try { fs.linkSync(path.join(D, 'moved', 'report.json'), path.join(d, 'report.json')); linked = true; } catch (x) { /* no hard links here */ } throw new Error('simulated failure'); } } }));
  chk(() => !linked || (e && fs.existsSync(path.join(d, 'report.json')) && e.left.foreign.includes(path.join(d, 'report.json'))), () => `S3b. a file reached through a folder that is not ours any more is left and named: ${JSON.stringify(tree(D))} ${e && e.message}`);
  chk(() => linked, () => 'S3b. (a hard link could be made here)');
}
// S3c. freeFile: a name held by a link whose target is missing is taken (AUD-005: lstat, not stat), so the next name is given
{
  const D = fresh('s3c'); let linked = false;
  try { fs.symlinkSync(path.join(OUT, 'missing-target.json'), path.join(D, 'Theme.json')); linked = true; } catch (x) { /* no file links here (Windows without the right) */ }
  const f = linked ? F.freeFile('s3c', 'Theme', '.json') : null;
  chk(() => !linked || path.basename(f) === 'Theme-2.json', () => `S3c. a dangling link's name is skipped: ${f}`);
}
// S4. freeFile: another program makes a missing folder between the look and the mkdir: that folder survives a failed write
{
  const D = fresh('s4'), theirs = path.join(D, 'themes'), mk0 = fs.mkdirSync;
  const race = (p, o) => { if (!fs.existsSync(theirs) && path.resolve(String(p)).startsWith(theirs)) mk0(theirs); return mk0(p, o); };
  fs.mkdirSync = race; W.setIo({ mkdirSync: race });
  const made = []; let f = null;
  try { f = F.freeFile('s4/themes/new', 'T', '.json', made); } finally { fs.mkdirSync = mk0; W.setIo(); }
  W.setIo(W.failingIo({ code: 'ENOSPC', how: 'open', n: 1 }));
  const e = threw(() => W.writeFileNew(f, data, { madeDirs: made }));
  W.setIo();
  chk(() => e && fs.existsSync(theirs) && !fs.existsSync(path.join(theirs, 'new')), () => `S4. the folder another program made survives; the one this call made is removed: ${JSON.stringify(tree(D))} made ${JSON.stringify(made)} ${e && e.message}`);
  chk(() => made.length === 1 && made[0] === path.join(theirs, 'new'), () => `S4. freeFile tells only the folders its own mkdir made: ${JSON.stringify(made)}`);
}
// S5. freeFile: the second folder can't be made (a full disk): the first is removed again, nothing is left
{
  const D = fresh('s5'), leaf = path.join(D, 'a', 'b'), mk0 = fs.mkdirSync;
  const bad = (p, o) => { const t = path.resolve(String(p)); if (t === leaf) { if (o && o.recursive) mk0(path.dirname(leaf)); throw errOf('ENOSPC'); } return mk0(p, o); };
  fs.mkdirSync = bad; W.setIo({ mkdirSync: bad });
  const made = [], e = threw(() => F.freeFile('s5/a/b', 'T', '.json', made));
  fs.mkdirSync = mk0; W.setIo();
  chk(() => e && tree(D).length === 0, () => `S5. a mkdir that fails half-way leaves no folder: ${JSON.stringify(tree(D))} ${e && e.message}`);
  chk(() => e && /^Nothing was written/.test(e.message) && e.left && e.left.ours.length === 0, () => `S5. and says nothing was written: ${e && e.message}`);
}
// S6. writeFileNew on a drive without hard links: never a rename over a name
{
  const D = fresh('s6'), f = path.join(D, 'A.json'); let renamed = 0;
  W.setIo({ linkSync() { throw errOf('ENOTSUP'); }, renameSync(a, b) { renamed++; if (path.resolve(String(b)) === f && !fs.existsSync(f)) fs.writeFileSync(f, 'theirs'); return fs.renameSync(a, b); } });
  const e = threw(() => W.writeFileNew(f, data));
  W.setIo();
  chk(() => renamed === 0 && fs.existsSync(f) && fs.readFileSync(f, 'utf8') !== 'theirs', () => `S6. with no hard links nothing is renamed over a name (renames ${renamed}, file ${fs.existsSync(f) ? fs.readFileSync(f, 'utf8').slice(0, 10) : 'gone'}) ${e && e.message}`);
  chk(() => !e && fs.readFileSync(f, 'utf8') === data && tree(D).join('|') === 'A.json', () => `S6. the file is written whole at its name, no temporary file: ${tree(D)} ${e && e.message}`);
  const g = path.join(D, 'B.json');
  W.setIo({ linkSync() { fs.writeFileSync(g, 'theirs'); throw errOf('ENOTSUP'); } });
  const e2 = threw(() => W.writeFileNew(g, data));
  W.setIo();
  chk(() => e2 && e2.code === 'EEXIST' && fs.readFileSync(g, 'utf8') === 'theirs' && tree(D).join('|') === 'A.json|B.json', () => `S6. a name taken after the link failed is refused, theirs untouched, nothing left: ${tree(D)} ${e2 && e2.message}`);
}
// S7. writeTree: the report folder appears (another program's, empty) after the name was found free: never replaced
{
  const D = fresh('s7'), top = path.join(D, 'R.Report'); let theirs = null;
  const appear = () => { if (!theirs) { fs.mkdirSync(top); theirs = ino(top); } };
  W.setIo({ renameSync(a, b) { if (path.resolve(String(b)) === top) appear(); return fs.renameSync(a, b); }, mkdirSync(p, o) { if (path.resolve(String(p)) === top) appear(); return fs.mkdirSync(p, o); } });
  const e = threw(() => F.writeTree(D, files));
  W.setIo();
  chk(() => e && theirs && fs.existsSync(top) && ino(top) === theirs && fs.readdirSync(top).length === 0, () => `S7. a folder that appeared mid-write is never replaced or filled: ${JSON.stringify(tree(D))} ${e ? e.message : 'no error'}`);
  chk(() => JSON.stringify(tree(D)) === JSON.stringify(['R.Report/']), () => `S7. nothing else is left: ${JSON.stringify(tree(D))}`);
}
// S8. a folder freeFile made is replaced by another program's before the rollback: theirs survives
{
  const D = fresh('s8'), made = [], f = F.freeFile('s8/new', 'T', '.json', made);
  fs.renameSync(path.join(D, 'new'), path.join(D, 'kept')); fs.mkdirSync(path.join(D, 'new')); const theirs = ino(path.join(D, 'new'));   // (kept: so its inode is not reused)
  W.setIo(W.failingIo({ code: 'ENOSPC', how: 'open', n: 1 }));
  const e = threw(() => W.writeFileNew(f, data, { madeDirs: made }));
  W.setIo();
  chk(() => e && fs.existsSync(path.join(D, 'new')) && ino(path.join(D, 'new')) === theirs, () => `S8. a folder replaced after freeFile made it survives the rollback: ${JSON.stringify(tree(D))} ${e && e.message}`);
}

// ---------- the tools ----------
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
// one fix script (formats) when amountFormat is given; two (thousand separators, formats) without it
const model = (dir, amountFormat, ms) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [Object.assign(col('Amount', 'double'), amountFormat ? { formatString: amountFormat } : {}), col('Region', 'string'), col('Channel', 'string'), col('Order Date', 'dateTime')],
    measures: ms || [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }] } })); };
const NOT_USED = /The plan plan-[0-9a-f]{12} was not used: once the cause is fixed \(for a full disk: free some space\), call this tool again with the same planId\./;
const USED = /The plan plan-[0-9a-f]{12} is now used: part of this write is still on disk, so the approval can't be used for another try\. Delete what is named above, then make a new plan, show it to the user and wait for their go\./;
const health = async (s, dir) => { const p = await s.call('check_model_health', { path: dir }), id = p.j && p.j.plan && p.j.plan.planId; await s.call('approve_plan', { planId: id }); return id; };
const fx = (x) => (x.j && x.j.fixes) || {};

// H1. check_model_health, one script, its write fails cleanly: nothing on disk, the plan NOT used; the same plan writes it
{
  model('h1', '#,0');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  const id = await health(s, 'h1'), before = tree(path.join(ROOT, 'h1'));
  const x = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => !x.err && fx(x).FORMATS && /Nothing was written/.test(fx(x).FORMATS.scriptNotWritten) && NOT_USED.test(x.j.planUse), () => `H1. a script whose write failed cleanly: said, and the plan not used: ${short(x)}`);
  chk(() => JSON.stringify(tree(path.join(ROOT, 'h1'))) === JSON.stringify(before), () => `H1. nothing is left: ${tree(path.join(ROOT, 'h1')).filter((f) => !before.includes(f))}`);
  const y = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => !y.err && fx(y).FORMATS && fx(y).FORMATS.fixScriptFile && fs.existsSync(path.resolve(ROOT, fx(y).FORMATS.fixScriptFile)) && !y.j.planUse, () => `H1. the same plan writes the script on a retry: ${short(y)}`);
  const z = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => z.err && /already used for check_model_health/.test(z.t), () => `H1. and is then used: ${short(z)}`);
  await s.close();
}
// H2. one script, its half file can't be removed: exactly that file is named, the plan is used
{
  model('h2', '#,0');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1+stuck' });
  const id = await health(s, 'h2'), before = tree(path.join(ROOT, 'h2'));
  const x = await s.call('check_model_health', { path: 'h2', planId: id });
  const added = tree(path.join(ROOT, 'h2')).filter((f) => !before.includes(f));
  chk(() => !x.err && added.length === 1 && /^\.dataarcus-tmp-[0-9a-f]{10}$/.test(added[0]) && fx(x).FORMATS.scriptNotWritten.includes('"h2/' + added[0] + '"'), () => `H2. the half script left on disk is named exactly: ${JSON.stringify(added)} ${short(x)}`);
  chk(() => USED.test(x.j.planUse), () => `H2. the plan is used, and the answer says so: ${short(x)}`);
  const y = await s.call('check_model_health', { path: 'h2', planId: id });
  chk(() => y.err && /already used for check_model_health/.test(y.t), () => `H2. the same plan is refused on a retry: ${short(y)}`);
  await s.close();
}
// H3. two scripts, the first fails cleanly and the second is written: the disk holds part of the write, the plan is used
{
  model('h3');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  const id = await health(s, 'h3'), before = tree(path.join(ROOT, 'h3'));
  const x = await s.call('check_model_health', { path: 'h3', planId: id });
  const added = tree(path.join(ROOT, 'h3')).filter((f) => !before.includes(f));
  chk(() => !x.err && /Nothing was written/.test(fx(x).THOUSANDS.scriptNotWritten) && fx(x).FORMATS.fixScriptFile && JSON.stringify(added) === JSON.stringify(['M - fix formats.tmdl']), () => `H3. one script failed, the other written, nothing else on disk: ${JSON.stringify(added)} ${short(x)}`);
  chk(() => /is now used/.test(x.j.planUse) && /M - fix formats\.tmdl/.test(x.j.planUse), () => `H3. the plan is used (part of the write is on disk), and the answer names what was written: ${short(x)}`);
  await s.close();
}
// C1/C2. create_report: the format script is written in the plan's write, after the report; its leftovers named exactly
{
  const ms = [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }];
  model('c0', null, ms); model('c1', null, ms); model('c2', null, ms);
  const plan = async (s, dir) => { const pl = await s.call('plan_layout', { path: dir, layout: 'exec', name: 'R4 Report', noDataMessage: false }), id = pl.j && pl.j.plan && pl.j.plan.planId; await s.call('approve_plan', { planId: id }); return { id, design: pl.j && pl.j.design }; };
  const make = (s, dir, p) => s.call('create_report', { path: dir, name: 'R4 Report', planId: p.id, design: p.design, noDataMessage: false });
  let s = await serverClient(ROOT); const n = (await make(s, 'c0', await plan(s, 'c0'))).j; await s.close();
  const N = n && n.written;
  chk(() => N > 3 && n.formats && n.formats.fixScriptFile, () => `C0. a report on this model writes ${N} files and a format script: ${JSON.stringify(n).slice(0, 300)}`);
  s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: `ENOSPC:partial:${N + 1}+stuck` });
  let p = await plan(s, 'c1'), before = tree(path.join(ROOT, 'c1'));
  const x = await make(s, 'c1', p), added = tree(path.join(ROOT, 'c1')).filter((f) => !before.includes(f) && !/^R4 Report\.(Report\/|pbip$)/.test(f));
  chk(() => !x.err && x.j.formats && added.length === 1 && /^\.dataarcus-tmp-[0-9a-f]{10}$/.test(added[0]) && x.j.formats.scriptNotWritten.includes('"c1/' + added[0] + '"'), () => `C1. the format script's half file is named exactly: ${JSON.stringify(added)} ${short(x)}`);
  const y = await make(s, 'c1', p);
  chk(() => y.err && /already used for create_report/.test(y.t), () => `C1. the plan is used (the report is on disk): ${short(y)}`);
  await s.close();
  s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  p = await plan(s, 'c2'); before = tree(path.join(ROOT, 'c2'));
  const z = await make(s, 'c2', p);
  chk(() => z.err && NOT_USED.test(z.t) && JSON.stringify(tree(path.join(ROOT, 'c2'))) === JSON.stringify(before), () => `C2. the report's write fails cleanly: no format script either, the plan not used: ${short(z)}`);
  const w = await make(s, 'c2', p);
  chk(() => !w.err && w.j.formats && w.j.formats.fixScriptFile && fs.existsSync(path.resolve(ROOT, w.j.formats.fixScriptFile)), () => `C2. the same plan writes the report and the format script on a retry: ${w.err ? w.t.slice(0, 300) : JSON.stringify(Object.keys(w.j.formats || {})) + " " + (w.j.formats || {}).fixScriptFile}`);
  await s.close();
}

fs.rmSync(ROOT, { recursive: true, force: true }); fs.rmSync(OUT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  r4-write-safety  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  r4-write-safety  ${checks} checks`);
