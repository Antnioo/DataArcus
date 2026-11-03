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
//          (0.3.1 CX1, Codex's F08: the scripts all or none, a failed batch an error: H1-H3 changed on purpose)
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
// (0.3.1 T1, the mutation suite) S1b: writeFileNew: the file is in place, then its folder is moved outside the working
// folder and a link to it put at its name: the file is the very one this call wrote (same identity, same size), but its
// real folder is outside, so the rollback leaves it (removeOurs' "inside the working folder" check; no other check sees it)
{
  const D = fresh('s1b'), f = path.join(D, 'Theme.json'), moved = path.join(OUT, 's1b-moved'); let once = false, linked = false;
  W.setIo({ unlinkSync(p) { if (!once && /\.dataarcus-tmp-/.test(String(p))) { once = true; fs.renameSync(D, moved); try { dirLink(moved, D); linked = true; } catch (x) { /* no links here */ } throw errOf('EIO'); } return fs.unlinkSync(p); } });
  const e = threw(() => W.writeFileNew(f, data));
  W.setIo();
  chk(() => !linked || (e && fs.existsSync(path.join(moved, 'Theme.json')) && e.left.foreign.includes(f)), () => `S1b. a file whose folder now leads outside the working folder is left and named: ${JSON.stringify(fs.existsSync(moved) ? tree(moved) : [])} ${e && e.message}`);
  chk(() => linked, () => 'S1b. (a folder link could be made here)');
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
// S2c. writeTree: another program appends to a file this call wrote (the same file, the same identity): its size tells it
// changed, and it survives. (S2's replacement may reuse the inode number, so S2 alone can't pin the size check)
{
  const D = fresh('s2c'), mine = path.join(D, 'R.Report/definition/report.json');
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { fs.appendFileSync(mine, ' theirs'); throw new Error('simulated failure'); } } }));
  chk(() => e && fs.existsSync(mine) && / theirs$/.test(fs.readFileSync(mine, 'utf8')) && e.left.foreign.includes(mine), () => `S2c. a file of the tree another program appended to survives the rollback, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// (0.3.1 RB, T1's "Seen, not in scope" 1: dev + ino + size can't tell a file from the one another program wrote after
// deleting it, when the file system gives the new file the freed inode number) S2d-S2g: only the content hash taken at
// the write tells them apart, and theirs survives.
// S2d. writeTree: a file of the tree is deleted and one of as many bytes, other content, written at its name (on ext4
// the inode number is reused at once: the real case; where it is not, dev + ino already tell)
{
  const D = fresh('s2d'), mine = path.join(D, 'R.Report/definition/report.json'); let reused = null;
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { const was = ino(mine), n = fs.statSync(mine).size; fs.unlinkSync(mine); fs.writeFileSync(mine, 'T'.repeat(n)); reused = ino(mine) === was; throw new Error('simulated failure'); } } }));
  chk(() => e && fs.existsSync(mine) && /^T+$/.test(fs.readFileSync(mine, 'utf8')) && e.left.foreign.includes(mine) && JSON.stringify(tree(D)) === JSON.stringify(['R.Report/', 'R.Report/definition/', 'R.Report/definition/report.json']),
    () => `S2d. a tree file deleted and written again by another program, as many bytes (inode number ${reused ? 'reused' : 'not reused'} here), survives the rollback with its folders, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// S2h. writeTree: a folder of the tree is moved away with all it holds and another program makes an empty folder at its
// name: the folder's identity (dev + ino) is all that tells it is not ours (a folder holds no bytes to hash; since RB a
// file's own identity is compared again through the handle its hash is read from, so this is the folders' check)
{
  const D = fresh('s2h'), top = path.join(D, 'R.Report'); let theirs = null;
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { fs.renameSync(top, path.join(D, 'moved')); fs.mkdirSync(top); theirs = ino(top); throw new Error('simulated failure'); } } }));
  chk(() => e && theirs && fs.existsSync(top) && ino(top) === theirs && e.left.foreign.includes(top), () => `S2h. an empty folder another program made at the name of a folder of the tree survives the rollback, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// S2e. writeTree: a file of the tree rewritten in place by another program, as many bytes: the same dev, ino and size on
// every file system (the identity inode reuse gives, without relying on the file system to reuse it)
{
  const D = fresh('s2e'), mine = path.join(D, 'R.Report/definition/report.json');
  const e = threw(() => F.writeTree(D, files, { beforePlace: (t) => { if (t === 'R.pbip') { const n = fs.statSync(mine).size, fd = fs.openSync(mine, 'r+'); fs.writeSync(fd, 'U'.repeat(n), 0); fs.closeSync(fd); throw new Error('simulated failure'); } } }));
  chk(() => e && fs.existsSync(mine) && /^U+$/.test(fs.readFileSync(mine, 'utf8')) && e.left.foreign.includes(mine), () => `S2e. a tree file rewritten in place with as many bytes survives the rollback, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
}
// S2f. writeFileNew: the file is in place, then rewritten in place with as many bytes before the rollback: theirs survives
{
  const D = fresh('s2f'), f = path.join(D, 'Theme.json'); let once = false;
  W.setIo({ unlinkSync(p) { if (!once && /\.dataarcus-tmp-/.test(String(p))) { once = true; const fd = fs.openSync(f, 'r+'); fs.writeSync(fd, 'V'.repeat(Buffer.byteLength(data)), 0); fs.closeSync(fd); throw errOf('EIO'); } return fs.unlinkSync(p); } });
  const e = threw(() => W.writeFileNew(f, data));
  W.setIo();
  chk(() => e && fs.existsSync(f) && /^V+$/.test(fs.readFileSync(f, 'utf8')) && e.left.foreign.includes(f), () => `S2f. a placed file rewritten in place with as many bytes survives the rollback, named: ${fs.existsSync(f) ? fs.readFileSync(f, 'utf8').slice(0, 20) : 'gone'} ${e && e.message}`);
}
// S2g. a write the disk cut off part-way, whose half another program rewrites in place before the clean-up (as many
// bytes as landed): theirs survives (the hash covers the bytes that landed, not only a complete file)
{
  const D = fresh('s2g'), f = path.join(D, 'Theme.json'); let tmp = null; const fds = new Map();
  W.setIo({
    openSync(p, flags, mode) { const fd = fs.openSync(p, flags, mode); fds.set(fd, String(p)); return fd; },
    writeFileSync(fd, d) { tmp = fds.get(fd); const b = Buffer.from(d), half = b.subarray(0, Math.floor(b.length / 2)); fs.writeFileSync(fd, half); const o = fs.openSync(tmp, 'r+'); fs.writeSync(o, 'W'.repeat(half.length), 0); fs.closeSync(o); throw errOf('ENOSPC'); }
  });
  const e = threw(() => W.writeFileNew(f, data));
  W.setIo();
  chk(() => e && tmp && fs.existsSync(tmp) && /^W+$/.test(fs.readFileSync(tmp, 'utf8')) && e.left.foreign.includes(tmp) && !fs.existsSync(f), () => `S2g. a half-written file another program rewrote in place survives the clean-up, named: ${JSON.stringify(tree(D))} ${e && e.message}`);
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
// S3d. writeTree into a folder that is a link leading outside the working folder: refused, nothing written there
{
  const D = fresh('s3d'), theirs = path.join(OUT, 's3d'); fs.mkdirSync(theirs); let linked = false;
  try { dirLink(theirs, path.join(D, 'out')); linked = true; } catch (x) { /* no links here */ }
  const e = linked ? threw(() => F.writeTree(path.join(D, 'out'), files)) : null;
  chk(() => !linked || (e && /through a link/.test(e.message) && !fs.readdirSync(theirs).length), () => `S3d. writeTree refuses a folder that leads outside through a link: ${JSON.stringify(tree(theirs))} ${e && e.message}`);
}
// S3e. writeTree where one of its names is already there: refused before anything is made, the name said
{
  const D = fresh('s3e'); fs.writeFileSync(path.join(D, 'R.pbip'), 'theirs');
  const e = threw(() => F.writeTree(D, files));
  chk(() => e && /already there/.test(e.message) && /R\.pbip/.test(e.message) && JSON.stringify(tree(D)) === '["R.pbip"]' && fs.readFileSync(path.join(D, 'R.pbip'), 'utf8') === 'theirs', () => `S3e. a taken name is refused before anything is written, and said: ${JSON.stringify(tree(D))} ${e && e.message}`);
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

// H1. check_model_health, one script, its write fails cleanly: nothing on disk, the answer an error, the plan NOT used; the
// same plan writes it
{
  model('h1', '#,0');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  const id = await health(s, 'h1'), before = tree(path.join(ROOT, 'h1'));
  const x = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => x.err && /Nothing was written/.test(x.t) && NOT_USED.test(x.t), () => `H1. a script whose write failed cleanly: an error that says so, and the plan not used: ${short(x)}`);
  chk(() => JSON.stringify(tree(path.join(ROOT, 'h1'))) === JSON.stringify(before), () => `H1. nothing is left: ${tree(path.join(ROOT, 'h1')).filter((f) => !before.includes(f))}`);
  const y = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => !y.err && fx(y).FORMATS && fx(y).FORMATS.fixScriptFile && fs.existsSync(path.resolve(ROOT, fx(y).FORMATS.fixScriptFile)) && !y.j.planUse, () => `H1. the same plan writes the script on a retry: ${short(y)}`);
  const z = await s.call('check_model_health', { path: 'h1', planId: id });
  chk(() => z.err && /already used for check_model_health/.test(z.t), () => `H1. and is then used: ${short(z)}`);
  await s.close();
}
// H2. one script, its half file can't be removed: an error naming exactly that file, the plan is used
{
  model('h2', '#,0');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:partial:1+stuck' });
  const id = await health(s, 'h2'), before = tree(path.join(ROOT, 'h2'));
  const x = await s.call('check_model_health', { path: 'h2', planId: id });
  const added = tree(path.join(ROOT, 'h2')).filter((f) => !before.includes(f));
  chk(() => x.err && added.length === 1 && /^\.dataarcus-tmp-[0-9a-f]{10}$/.test(added[0]) && x.t.includes('"h2/' + added[0] + '"'), () => `H2. the half script left on disk is named exactly: ${JSON.stringify(added)} ${short(x)}`);
  chk(() => USED.test(x.t), () => `H2. the plan is used, and the answer says so: ${short(x)}`);
  const y = await s.call('check_model_health', { path: 'h2', planId: id });
  chk(() => y.err && /already used for check_model_health/.test(y.t), () => `H2. the same plan is refused on a retry: ${short(y)}`);
  await s.close();
}
// H3. two scripts, the first fails cleanly: the second is not written either (CX1: all or none), the answer an error, the
// plan NOT used; the same plan writes both once the cause is gone
{
  model('h3');
  const s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: 'ENOSPC:open:1' });
  const id = await health(s, 'h3'), before = tree(path.join(ROOT, 'h3'));
  const x = await s.call('check_model_health', { path: 'h3', planId: id });
  const added = tree(path.join(ROOT, 'h3')).filter((f) => !before.includes(f));
  chk(() => x.err && /Nothing was written/.test(x.t) && added.length === 0, () => `H3. one script failed: neither is on disk, an error says nothing was written: ${JSON.stringify(added)} ${short(x)}`);
  chk(() => NOT_USED.test(x.t), () => `H3. the plan is not used (the disk is as approved), and said: ${short(x)}`);
  const y = await s.call('check_model_health', { path: 'h3', planId: id });
  chk(() => !y.err && fx(y).THOUSANDS.fixScriptFile && fx(y).FORMATS.fixScriptFile && tree(path.join(ROOT, 'h3')).filter((f) => !before.includes(f)).length === 2, () => `H3. the same plan writes both scripts on a retry: ${short(y)}`);
  await s.close();
}
// C1/C2. create_report: the format script is written in the plan's write; its leftovers named exactly. (0.3.1 AF2: the
// script is one of the report's files now, inside the plan's digest and the one writeTree, before the .pbip: the stuck
// failure is aimed at it, file N - 1 of N, so the report's files are removed and only the stuck script is left, named)
{
  const ms = [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' }];
  model('c0', null, ms); model('c1', null, ms); model('c2', null, ms);
  const plan = async (s, dir) => { const pl = await s.call('plan_layout', { path: dir, layout: 'exec', name: 'R4 Report', noDataMessage: false }), id = pl.j && pl.j.plan && pl.j.plan.planId; await s.call('approve_plan', { planId: id }); return { id, design: pl.j && pl.j.design }; };
  const make = (s, dir, p) => s.call('create_report', { path: dir, name: 'R4 Report', planId: p.id, design: p.design, noDataMessage: false });
  let s = await serverClient(ROOT); const n = (await make(s, 'c0', await plan(s, 'c0'))).j; await s.close();
  const N = n && n.written;
  chk(() => N > 3 && n.formats && n.formats.fixScriptFile, () => `C0. a report on this model writes ${N} files and a format script: ${JSON.stringify(n).slice(0, 300)}`);
  s = await serverClient(ROOT, { DATAARCUS_TEST_WRITE_FAIL: `ENOSPC:partial:${N - 1}+stuck` });
  let p = await plan(s, 'c1'), before = tree(path.join(ROOT, 'c1'));
  const x = await make(s, 'c1', p), added = tree(path.join(ROOT, 'c1')).filter((f) => !before.includes(f) && !/^R4 Report\.(Report\/|pbip$)/.test(f));
  chk(() => x.err && added.length === 1 && added[0] === 'M - fix formats.tmdl' && x.t.includes('"c1/' + added[0] + '"'), () => `C1. the format script's half file is named exactly: ${JSON.stringify(added)} ${short(x)}`);
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
