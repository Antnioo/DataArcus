// (0.3, B-153) A write that fails half-way (a full disk) leaves nothing half-written at a name the user sees. One new
// file is written under a temporary name in its own folder, then linked into place (a link fails when the name is taken,
// so nothing is ever replaced); on any failure everything this call created is removed, and what could not be removed is
// named exactly. Every path is recorded BEFORE the call that creates it, so a file cut off part-way is removed too.
// The fs calls that write go through `io`, so a test can make one fail part-way (setIo in-process, or
// DATAARCUS_TEST_WRITE_FAIL in a server it starts). writeTree (files.mjs) uses the same io and the same wording.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const REAL = { writeFileSync: fs.writeFileSync, mkdirSync: fs.mkdirSync, linkSync: fs.linkSync, renameSync: fs.renameSync, unlinkSync: fs.unlinkSync, rmdirSync: fs.rmdirSync };
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
  let k = 0, bad = null;
  return {
    writeFileSync(f, data, opts) {
      if (++k !== n) return REAL.writeFileSync(f, data, opts);
      bad = path.resolve(String(f));
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

// a file moved into place, never over anything: a hard link fails with EEXIST when the name is taken. A drive without
// hard links (FAT32, exFAT, some network shares) gets a rename, checked just before (the only window, and only there)
const NO_LINKS = new Set(['EPERM', 'ENOTSUP', 'EOPNOTSUPP', 'ENOSYS', 'EXDEV']);
export function placeFile(from, to) {
  try { io.linkSync(from, to); return 'link'; } catch (e) {
    if (!NO_LINKS.has(e && e.code)) throw e;
    try { fs.lstatSync(to); const x = new Error(`EEXIST: "${path.basename(to)}" is already there`); x.code = 'EEXIST'; throw x; } catch (x) { if (x.code !== 'ENOENT') throw x; }
    io.renameSync(from, to); return 'rename';
  }
}

/**
 * Writes one new file at f, never over anything: data goes to a temporary name in f's folder ('wx'), which is then put in
 * place. opts.madeDirs: folders the caller created for this file (freeFile's), removed again on a failure when empty.
 * On any failure everything this call created is removed and the error (writeFailed) says what is left, if anything.
 */
export function writeFileNew(f, data, opts) {
  const tmp = path.join(path.dirname(f), `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}`);
  const made = [];   // what this call created, recorded before the call that creates it
  let placed = null;
  try {
    made.push(tmp);
    try { io.writeFileSync(tmp, data, { flag: 'wx' }); } catch (e) { if (e && e.code === 'EEXIST') made.pop(); throw e; }   // (taken: not ours)
    placed = placeFile(tmp, f);
    if (placed === 'link') { made.push(f); io.unlinkSync(tmp); }
    made.length = 0;
  } catch (e) {
    const ours = [];
    // (placed by a rename: the temporary name is gone and f is complete, so only the link's second name is undone)
    for (const x of made.slice().reverse()) { try { io.unlinkSync(x); } catch (y) { if (y.code !== 'ENOENT') ours.push(x); } }
    for (const d of ((opts && opts.madeDirs) || []).slice().reverse()) { try { io.rmdirSync(d); } catch (y) { if (y.code !== 'ENOENT') ours.push(d); } }
    if (e && e.code === 'EEXIST' && !ours.length) { const x = new Error(`EEXIST: "${path.basename(f)}" is already there`); x.code = 'EEXIST'; x.left = { ours: [], foreign: [] }; throw x; }
    throw writeFailed(e, `the file "${shownWritePath(f)}"`, ours, []);
  }
}
