// (0.3, B-153) A write that fails half-way (a full disk) leaves nothing half-written at a name the user sees. One new
// file is written under a temporary name in its own folder, then linked into place (a link fails when the name is taken,
// so nothing is ever replaced); on any failure everything this call created is removed, and what could not be removed is
// named exactly. Every path is recorded BEFORE the call that creates it, so a file cut off part-way is removed too.
// (0.3.0 R4, the outside audit's F01-F03) The clean-up removes a path only while it is still what this call created: each
// file's identity (dev + ino) is read from the handle it was written through, each folder's right after its own mkdir,
// and a path is removed only when it, and every folder this call made on the way to it, still has its identity, and its
// real folder is inside the working folder. Anything else (a file another program put at one of these names, a link put
// on the way) is left and named. Nothing is ever renamed over a name.
// The fs calls that write go through `io`, so a test can make one fail part-way (setIo in-process, or
// DATAARCUS_TEST_WRITE_FAIL in a server it starts). writeTree (files.mjs) uses the same io and the same wording.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REAL = { writeFileSync: fs.writeFileSync, mkdirSync: fs.mkdirSync, linkSync: fs.linkSync, renameSync: fs.renameSync, unlinkSync: fs.unlinkSync, rmdirSync: fs.rmdirSync, openSync: fs.openSync, closeSync: fs.closeSync };
export const io = Object.assign({}, REAL);
/** tests only: replaces some of the writing calls (missing ones are the real ones); setIo() puts them all back */
export function setIo(stub) { Object.assign(io, REAL, stub || {}); }

const errOf = (code, what) => { const e = new Error(`${code}: ${what} (a test, DATAARCUS_TEST_WRITE_FAIL)`); e.code = code; return e; };
/**
 * tests only: a stub that makes the n-th file write of this process fail, once. how: 'partial' writes the first half of
 * the bytes and then throws (a disk that fills up during the write), 'open' throws before any byte (after its folder was
 * made); '+stuck': that file can't be removed afterwards either (EBUSY), so the clean-up is incomplete.
 * It can only make a write fail, never make one succeed.
 */
export function failingIo({ code, how, n, stuck }) {
  let k = 0, bad = null; const fds = new Map();   // (a file is written through its handle: the handle's path)
  return {
    openSync(f, flags, mode) { const fd = REAL.openSync(f, flags, mode); fds.set(fd, path.resolve(String(f))); return fd; },
    closeSync(fd) { fds.delete(fd); return REAL.closeSync(fd); },
    writeFileSync(f, data, opts) {
      if (++k !== n) return REAL.writeFileSync(f, data, opts);
      bad = typeof f === 'number' ? fds.get(f) : path.resolve(String(f));
      if (how === 'partial') { const b = Buffer.from(data); REAL.writeFileSync(f, b.subarray(0, Math.floor(b.length / 2)), opts); throw errOf(code, `the disk filled after ${Math.floor(b.length / 2)} of ${b.length} bytes`); }
      throw errOf(code, 'the file could not be created');
    },
    unlinkSync(f) { if (stuck && bad && path.resolve(String(f)) === bad) throw errOf('EBUSY', 'the file is in use'); return REAL.unlinkSync(f); }
  };
}
{ // a server started by a test: DATAARCUS_TEST_WRITE_FAIL="<CODE>:<partial|open>:<n>[+stuck]" (the older "<CODE>:<n>" is writeTree's own)
  const m = /^([A-Z]{2,12}):(partial|open):(\d{1,5})(\+stuck)?$/.exec(String(process.env.DATAARCUS_TEST_WRITE_FAIL || ''));
  if (m) setIo(failingIo({ code: m[1], how: m[2], n: +m[3], stuck: !!m[4] }));
}

/**
 * tests only (R6, F07): DATAARCUS_TEST_EDIT_BEFORE_WRITE="<file inside the working folder>" appends a line break to that
 * file each time a writer re-reads its model before its first write: an edit after the last read, for the re-read to
 * catch. It can only make a write be refused, never make one succeed.
 */
export function testEditBeforeWrite() {
  const rel = process.env.DATAARCUS_TEST_EDIT_BEFORE_WRITE, root = process.env.DATAARCUS_ROOT;
  if (!rel || !root) return;
  const f = path.resolve(root, rel);
  if (path.relative(path.resolve(root), f).startsWith('..')) return;
  REAL.writeFileSync(f, '\n', { flag: 'a' });
}

/** A path as the user sees it: relative to the working folder, '/' between parts. */
export const shownWritePath = (f) => path.relative(process.env.DATAARCUS_ROOT ? path.resolve(process.env.DATAARCUS_ROOT) : '.', String(f)).split(path.sep).join('/');
const whyOf = (e) => (e && e.code === 'ENOSPC' ? 'the disk is full (ENOSPC)' : String(e && e.message || e).slice(0, 200));
const list = (xs) => xs.slice(0, 20).map((f) => `"${shownWritePath(f)}"`).join(', ') + (xs.length > 20 ? `, and ${xs.length - 20} more` : '');

/**
 * The error of a write that failed, after its clean-up. what: 'the file "x"' or 'the files'; ours: paths this call created
 * and could not remove; foreign: paths found inside a folder this call created that it did not create (never removed).
 * e.left = { ours, foreign } (absolute paths): files.mjs's withPlan reads it to say whether the plan was used.
 * A complete clean-up says "Nothing was written" (the error keeps its code); an incomplete one has code PARTIAL_WRITE.
 */
export function writeFailed(e, what, ours, foreign) {
  const why = whyOf(e), err = ours.length
    ? new Error(`The write stopped part-way: ${what} could not be written (${why}), and DataArcus could not remove all it had created. Still on disk from this call: ${list(ours)}. Delete ${ours.length === 1 ? 'it' : 'them'} before writing again (DataArcus never removes anything it did not create).`)
    : new Error(`Nothing was written: ${what} could not be written (${why}). What this call had written was removed.`);
  if (foreign.length) err.message += ` Left as found, not created by this call (not removed): ${list(foreign)}; the folder holding them stays.`;
  else if (!ours.length) err.message += ' Nothing else was touched.';
  err.code = ours.length ? 'PARTIAL_WRITE' : e && e.code;
  err.left = { ours: ours.slice(), foreign: foreign.slice() };
  return err;
}

// ---------- what this call created, and its removal (R4) ----------
const idOf = (st) => ({ dev: st.dev, ino: st.ino });
const lstatOf = (p) => { try { return fs.lstatSync(p, { bigint: true }); } catch (e) { if (e && e.code === 'ENOENT') return null; throw e; } };
const rootReal = () => { const r = String(process.env.DATAARCUS_ROOT || '').trim(); return r ? fs.realpathSync.native(path.resolve(r)) : null; };
const within = (root, p) => { const rel = path.relative(root, p); return !(rel.startsWith('..') || path.isAbsolute(rel)); };
/**
 * Creates the new file e.path ('wx': never over anything) and writes data through that handle. e = { path } is recorded
 * by the caller BEFORE this call; it gets the file's identity as soon as the file exists (e.id), and its size once the
 * data is all written (e.size).
 */
const NEW_FILE = { flag: 'wx' };   // (fails when anything is at the name: never over anything, never through a link)
export function createFile(e, data) {
  const fd = io.openSync(e.path, NEW_FILE.flag);
  try { e.id = idOf(fs.fstatSync(fd, { bigint: true })); io.writeFileSync(fd, data); e.size = fs.fstatSync(fd, { bigint: true }).size; }
  finally { io.closeSync(fd); }
}
/** Makes the one folder p (never a recursive mkdir; EEXIST: it is not ours) and returns its record { path, id, dir }. */
export function makeDir(p) { io.mkdirSync(p); return { path: p, dir: true, id: idOf(fs.lstatSync(p, { bigint: true })) }; }
/**
 * Removes e (a record of createFile or makeDir; e.via: the folders this call made on the way to it) only while it is what
 * this call created. Returns 'gone' (nothing there), 'removed', or 'changed' (left as it is: not ours any more); throws
 * the removal's own error (EBUSY, ENOTEMPTY).
 */
export function removeOurs(e) {
  const st = lstatOf(e.path);
  if (!st) return 'gone';
  if (!e.id || st.dev !== e.id.dev || st.ino !== e.id.ino || st.isSymbolicLink() || st.isDirectory() !== !!e.dir || (e.size != null && st.size !== e.size)) return 'changed';
  for (const v of e.via || []) { const s = lstatOf(v.path); if (!s || !s.isDirectory() || s.dev !== v.id.dev || s.ino !== v.id.ino) return 'changed'; }
  const root = rootReal(); if (root && !within(root, fs.realpathSync.native(path.dirname(e.path)))) return 'changed';
  (e.dir ? io.rmdirSync : io.unlinkSync)(e.path);
  return 'removed';
}
/**
 * The clean-up of a failed write: records (createFile's and makeDir's, in the order they were made) removed newest first.
 * Returns { ours: what this call created and could not remove, foreign: what it left because it is not (or no longer)
 * what this call created, and what it found inside its folders } (absolute paths, each once).
 */
export function rollBack(records) {
  const ours = [], foreign = [], mine = new Set(records.map((r) => r.path));
  for (const r of records.slice().reverse()) {
    try { if (removeOurs(r) === 'changed') foreign.push(r.path); } catch (x) {
      ours.push(r.path);
      if (r.dir && (x.code === 'ENOTEMPTY' || x.code === 'EEXIST')) { try { fs.readdirSync(r.path).forEach((n) => { const f = path.join(r.path, n); if (!mine.has(f)) foreign.push(f); }); } catch (y) { /* the folder is named */ } }
    }
  }
  return { ours: [...new Set(ours)], foreign: [...new Set(foreign)] };
}
// the folders freeFile made (their records, by path), for writeFileNew's madeDirs
const DIRS = new Map();
export const noteDir = (r) => { DIRS.set(r.path, r); };

// a drive without hard links (FAT32, exFAT, some network shares): the file is written straight to its name, 'wx'
const NO_LINKS = new Set(['EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS', 'EXDEV']);

/**
 * Writes one new file at f, never over anything: data goes to a temporary name in f's folder ('wx'), which is then linked
 * into place; with no hard links it is written straight to f ('wx') instead (never a rename: R4, F03). opts.madeDirs:
 * folders the caller created for this file (freeFile's), removed again on a failure while empty and still theirs.
 * On any failure everything this call created is removed and the error (writeFailed) says what is left, if anything.
 */
export function writeFileNew(f, data, opts) {
  const tmp = path.join(path.dirname(f), `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}`);
  const dirs = ((opts && opts.madeDirs) || []).map((d) => DIRS.get(d) || { path: d, dir: true, id: null });
  const made = dirs.slice();   // what this call created, each recorded before the call that creates it
  const create = (p) => { const e = { path: p, via: dirs }; made.push(e); try { createFile(e, data); } catch (x) { if (x && x.code === 'EEXIST') made.pop(); throw x; } return e; };   // (taken: not ours)
  try {
    const t = create(tmp);
    let linked = false;
    try { io.linkSync(tmp, f); linked = true; } catch (x) { if (!NO_LINKS.has(x && x.code)) throw x; }
    if (linked) { made.push({ path: f, id: t.id, size: t.size, via: dirs }); io.unlinkSync(tmp); }
    else { if (removeOurs(t) !== 'changed') made.splice(made.indexOf(t), 1); create(f); }
    dirs.forEach((d) => DIRS.delete(d.path));
  } catch (e) {
    const { ours, foreign } = rollBack(made);
    dirs.forEach((d) => DIRS.delete(d.path));
    if (e && e.code === 'EEXIST' && !ours.length && !foreign.length) { const x = new Error(`EEXIST: "${path.basename(f)}" is already there`); x.code = 'EEXIST'; x.left = { ours: [], foreign: [] }; throw x; }
    throw writeFailed(e, `the file "${shownWritePath(f)}"`, ours, foreign);
  }
}
