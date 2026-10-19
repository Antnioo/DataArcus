// The one writer of new files (audit 6, A6-4 and A6-7; the twin's T8): every tool that writes a new tree of files
// (create_report, create_arabic_twin) writes it here, all or nothing, never over anything; and the one reader of a file
// the user names (a theme, a background, a logo), measured before it is read; and where a tool may write one new file
// (freeFile: 0.2.9, the audit's A2-8, moved here from the design adapter, which reads and writes no file).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { nothingAt, real, inside, readCapped } from './model.mjs';
import { io, placeFile, writeFailed, writeFileNew } from './write-io.mjs';
import { consume } from './plans.mjs';
export { writeFileNew };   // (B-153: the one writer of one new file, for the tools; writeNew in model.mjs is the same)

// what was written in this server's life, in order (audit 6, A6-17): a tool that fails says what it had written
const WRITTEN = [];
export const noteWritten = (f) => { WRITTEN.push(String(f)); };
/** With no mark: the current mark. With a mark: what was written since, as paths relative to the working folder. */
export function writtenSince(mark) { if (mark === undefined) return WRITTEN.length; return WRITTEN.slice(mark).map((f) => path.relative(process.env.DATAARCUS_ROOT ? path.resolve(process.env.DATAARCUS_ROOT) : '.', f).split(path.sep).join('/')); }

// tests only: DATAARCUS_TEST_WRITE_FAIL="<code>:<n>" makes the write fail with that error code after n files (a full
// disk, ENOSPC; an I/O error, EIO), to prove the clean-up. It can only make a write fail, never make one succeed.
function testFailure() {
  const m = /^([A-Z]{2,12}):(\d{1,5})$/.exec(String(process.env.DATAARCUS_TEST_WRITE_FAIL || ''));
  return m ? { code: m[1], after: +m[2] } : null;
}

/**
 * Writes files into dir as one new tree. files: [{ path: 'Name.Report/definition/report.json', data }] (paths relative
 * to dir, '/' between parts). Every file goes first into a new temporary folder in dir (each created with 'wx'); when
 * all are there, each top-level entry is moved into place, folders first and .pbip files last, and never over anything
 * (a file is linked into place, which fails when the name is taken; a folder's name is checked just before). On any
 * failure everything this call created is removed and the error says "Nothing was written". Returns the top-level
 * entries written, in order.
 */
export function writeTree(dir, files, opts) {
  const tops = [...new Set(files.map((f) => String(f.path).split('/')[0]))];
  const taken = tops.filter((t) => !nothingAt(path.join(dir, t)));
  if (taken.length) throw new Error(`Nothing was written: ${taken.length === 1 ? `"${taken[0]}" is` : `${taken.length} names are`} already there (e.g. "${taken[0]}"). DataArcus never writes over anything: choose another name, or rename or move the old one.`);
  const tmp = path.join(dir, `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}`);
  real(tmp);
  tops.forEach((t) => real(path.join(dir, t)));
  const fail = testFailure(), beforePlace = opts && typeof opts.beforePlace === 'function' ? opts.beforePlace : null;
  // (Z-04, the outside review: the rollback removed placed folders whole, with anything another program had put there.
  // Now every file and folder this call creates is recorded, and only those are removed: files first, then the
  // folders, each only when empty; anything else found is left where it is and named)
  const createdFiles = [], createdDirs = [], placed = new Set();
  const where = (rel) => (placed.has(rel.split('/')[0]) ? path.join(dir, ...rel.split('/')) : path.join(tmp, ...rel.split('/')));
  const ensureDir = (relDir) => { const parts = relDir ? relDir.split('/') : []; for (let k = 1; k <= parts.length; k++) { const rel = parts.slice(0, k).join('/'); const f = path.join(tmp, ...rel.split('/')); if (nothingAt(f)) { io.mkdirSync(f); createdDirs.push(rel); } } };
  let madeTmp = false;
  try {
    io.mkdirSync(tmp); madeTmp = true;
    let n = 0;
    for (const f of files) {
      const rel = String(f.path), relDir = rel.split('/').slice(0, -1).join('/');
      ensureDir(relDir);
      // (0.3, B-153: recorded BEFORE the write, so a file the disk cut off part-way is removed too; 'wx' refuses a taken
      // name, which is then not ours)
      createdFiles.push(rel);
      try { io.writeFileSync(path.join(tmp, ...rel.split('/')), f.data, { flag: 'wx' }); } catch (x) { if (x && x.code === 'EEXIST') createdFiles.pop(); throw x; }
      if (fail && ++n >= fail.after) { const e = new Error(`${fail.code}: the write failed after ${n} files (a test, DATAARCUS_TEST_WRITE_FAIL)`); e.code = fail.code; throw e; }
    }
    const isDir = (t) => fs.lstatSync(path.join(tmp, t)).isDirectory();
    const order = tops.filter(isDir).concat(tops.filter((t) => !isDir(t) && !/\.pbip$/i.test(t)), tops.filter((t) => !isDir(t) && /\.pbip$/i.test(t)));
    for (const t of order) {
      if (beforePlace) beforePlace(t);   // (tests only: something happening between two moves)
      const from = path.join(tmp, t), to = path.join(dir, t);
      if (isDir(t)) { if (!nothingAt(to)) throw new Error(`"${t}" appeared while writing`); io.renameSync(from, to); placed.add(t); }
      else { const how = placeFile(from, to); placed.add(t); if (how === 'link') io.unlinkSync(from); }   // link: fails with EEXIST rather than replace a file
      noteWritten(to);
    }
    io.rmdirSync(tmp); madeTmp = false;
    return order;
  } catch (e) {
    // what this call created and could not remove (ours), and what it found in its folders and left (foreign): both
    // named exactly (B-153: the folder that holds a file still there is still there too, and named)
    const ours = [], foreign = [];
    for (const rel of createdFiles.slice().reverse()) { try { io.unlinkSync(where(rel)); } catch (x) { if (x.code !== 'ENOENT') ours.push(where(rel)); } }
    // (a top-level file linked into place also had its temporary name: gone already, or removed here)
    for (const t of placed) if (!createdDirs.includes(t)) { try { io.unlinkSync(path.join(tmp, t)); } catch (x) { /* moved */ } }
    for (const rel of createdDirs.slice().reverse()) {
      const d = where(rel);
      try { io.rmdirSync(d); } catch (x) {
        if (x.code === 'ENOENT') continue;
        ours.push(d);
        if (x.code === 'ENOTEMPTY' || x.code === 'EEXIST') { try { fs.readdirSync(d).forEach((name) => { const r = rel + '/' + name; if (!createdDirs.includes(r) && !createdFiles.includes(r)) foreign.push(path.join(d, name)); }); } catch (y) { /* the folder is named */ } }
      }
    }
    if (madeTmp) { try { io.rmdirSync(tmp); } catch (x) { if (x.code !== 'ENOENT') ours.push(tmp); } }
    const gone = placed.size; if (gone) WRITTEN.splice(WRITTEN.length - gone, gone);   // (removed again: not written)
    throw writeFailed(e, 'the files', ours.sort(), foreign.sort());
  }
}

/**
 * (0.3, B-153) A write with an approved plan. The plan is marked used the moment the write is complete (before the
 * answer is built, so an error after it can't leave the plan open with the files on disk). When the write fails:
 * - everything it had created was removed (e.left.ours empty): the plan is NOT used. Nothing on disk differs from what
 *   the person approved, so the same planId can write once the cause is fixed (a full disk: free some space); the
 *   approval was for these files, written once, and they were not written.
 * - something it created is still there: the plan IS used. The folder now holds part of this write, which the person
 *   did not approve; they see what is left (named exactly) and approve again after deleting it.
 * Either way the answer says which. An error that is not a write's (e.left absent) is passed on as it is: the plan is
 * used when files were placed before it (writtenSince), and as it was otherwise (a refusal before the write).
 */
export function withPlan(planId, tool, write) {
  let r; const mark = writtenSince();
  try { r = write(); } catch (e) {
    // (an error after the files were placed, a twin's answer for one: the files are on disk, so the plan wrote)
    if (!e || !e.left) { if (writtenSince(mark).length) consume(planId, tool); throw e; }
    if (e.left.ours.length) { consume(planId, tool); e.message += ` The plan ${planId} is now used: part of this write is still on disk, so the approval can't be used for another try. Delete what is named above, then make a new plan, show it to the user and wait for their go.`; }
    else e.message += ` The plan ${planId} was not used: once the cause is fixed (for a full disk: free some space), call this tool again with the same planId.`;
    throw e;
  }
  consume(planId, tool);
  return r;
}

/**
 * Reads a file the user names (audit 6, A6-7): inside the working folder, a regular file, at most max bytes; measured
 * before it is read. kind: what it is for the message ('theme', 'background image', 'logo'). json: parse it, and a
 * file that is not JSON is refused without quoting it (a file's text is untrusted and goes to the AI app).
 * Returns a Buffer, or the parsed JSON with json: true.
 */
export function readUserFile(p, { kind = 'file', max = 2 * 1024 * 1024, json = false } = {}) {
  const full = inside(p), name = path.basename(String(p));
  // (Z-03, the outside review: measured by name, then read by name, so a swap in between was read through a link. Now
  // the reading block's readCapped: opened once without following links, measured with fstat, read from that handle)
  let buf;
  try { buf = readCapped(full, max, kind); } catch (e) {
    if (e && e.code === 'ENOENT') throw new Error(`The ${kind} "${name}" was not found inside the working folder. Nothing was written.`);
    if (/not a regular file/.test(String(e && e.message))) throw new Error(`The ${kind} "${name}" is not a file. Nothing was written.`);
    throw new Error(`The ${kind} file "${name}" was not read: ${String(e && e.message || e).replace(/^This file was not read: /, '')} Nothing was written.`);
  }
  if (!json) return buf;
  const t = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? buf.subarray(3).toString('utf8') : buf.toString('utf8');
  try { return JSON.parse(t); } catch (e) { throw new Error(`The ${kind} file is not valid JSON (its text is not shown: a file's text is not passed on). Use a theme file saved from Power BI or the DataArcus Theme Generator. Nothing was written.`); }
}

// A file inside the DataArcus folder that doesn't exist yet: name.ext, name-2.ext, name-3.ext... (a name held by
// anything, a link included, is skipped). made (B-153): gets the folders this call created, outermost first, so a write
// that fails can remove them again (writeFileNew's madeDirs)
export function freeFile(folder, base, ext, made) {
  const dir = inside(folder || '.');
  // (the folders missing before, found by walking up from dir to the first one that is there, never by comparing a
  // path with mkdirSync's answer: on Windows the two can spell one folder differently, a short name like RUNNER~1)
  const missing = []; for (let d = dir; nothingAt(d) && path.dirname(d) !== d; d = path.dirname(d)) missing.unshift(d);
  fs.mkdirSync(dir, { recursive: true });
  if (Array.isArray(made)) made.push(...missing);
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (nothingAt(f)) return f;
  }
}
