// The one writer of new files (audit 6, A6-4 and A6-7; the twin's T8): every tool that writes a new tree of files
// (create_report, create_arabic_twin) writes it here, all or nothing, never over anything (and its clean-up never
// removes what it did not create: 0.3.0 R4); and the one reader of a file
// the user names (a theme, a background, a logo), measured before it is read; and where a tool may write one new file
// (freeFile: 0.2.9, the audit's A2-8, moved here from the design adapter, which reads and writes no file).
import path from 'node:path';
import { nothingAt, real, inside, readCapped } from './model.mjs';
import { createFile, makeDir, noteDir, rollBack, shownWritePath, writeFailed, writeFileNew } from './write-io.mjs';
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
 * to dir, '/' between parts). Every file and folder is created in place and never over anything (0.3.0 R4, the outside
 * audit's F03: a temporary folder moved into place was a check, then a rename, which could replace a folder made in
 * between): each folder by its own mkdir (one level at a time; a name taken in between fails), each file with 'wx';
 * folders first and .pbip files last (Power BI Desktop opens a project by its .pbip). On any failure everything this call
 * created and still finds as it made it is removed (write-io.mjs rollBack), and the error says "Nothing was written" or
 * names exactly what is left. Returns the top-level entries written, in order.
 */
export function writeTree(dir, files, opts) {
  const tops = [...new Set(files.map((f) => String(f.path).split('/')[0]))];
  const taken = tops.filter((t) => !nothingAt(path.join(dir, t)));
  if (taken.length) throw new Error(`Nothing was written: ${taken.length === 1 ? `"${taken[0]}" is` : `${taken.length} names are`} already there (e.g. "${taken[0]}"). DataArcus never writes over anything: choose another name, or rename or move the old one.`);
  real(dir);
  tops.forEach((t) => real(path.join(dir, t)));
  const fail = testFailure(), beforePlace = opts && typeof opts.beforePlace === 'function' ? opts.beforePlace : null;
  // (Z-04, the outside review: the rollback removed placed folders whole, with anything another program had put there.
  // Now every file and folder this call creates is recorded, and only those are removed: files first, then the
  // folders, each only when empty; R4: each only while it is still what this call created; anything else is left and named)
  const made = [], dirs = new Map();
  const isDir = (t) => files.some((f) => String(f.path).startsWith(t + '/'));
  const order = tops.filter(isDir).concat(tops.filter((t) => !isDir(t) && !/\.pbip$/i.test(t)), tops.filter((t) => !isDir(t) && /\.pbip$/i.test(t)));
  const ensureDir = (relDir) => {
    const parts = relDir ? relDir.split('/') : [];
    for (let k = 1; k <= parts.length; k++) {
      const rel = parts.slice(0, k).join('/');
      if (dirs.has(rel)) continue;
      const via = parts.slice(0, k - 1).map((_, j) => dirs.get(parts.slice(0, j + 1).join('/')));
      let r; try { r = makeDir(path.join(dir, ...parts.slice(0, k))); } catch (x) { if (x && x.code === 'EEXIST') { const e = new Error(`"${rel}" appeared while writing`); e.code = 'EEXIST'; throw e; } throw x; }
      r.via = via; made.push(r); dirs.set(rel, r);
    }
  };
  let placed = 0;
  try {
    let n = 0;
    for (const t of order) {
      if (beforePlace) beforePlace(t);   // (tests only: something happening between two top-level entries)
      for (const f of files.filter((x) => String(x.path).split('/')[0] === t)) {
        const rel = String(f.path), parts = rel.split('/'), relDir = parts.slice(0, -1).join('/');
        ensureDir(relDir);
        // (0.3, B-153: recorded BEFORE the write, so a file the disk cut off part-way is removed too; 'wx' refuses a taken
        // name, which is then not ours)
        const e = { path: path.join(dir, ...parts), via: parts.slice(0, -1).map((_, j) => dirs.get(parts.slice(0, j + 1).join('/'))) };
        made.push(e);
        try { createFile(e, f.data); } catch (x) { if (x && x.code === 'EEXIST') made.pop(); throw x; }
        if (fail && ++n >= fail.after) { const x = new Error(`${fail.code}: the write failed after ${n} files (a test, DATAARCUS_TEST_WRITE_FAIL)`); x.code = fail.code; throw x; }
      }
      noteWritten(path.join(dir, t)); placed++;
    }
    return order;
  } catch (e) {
    // what this call created and could not remove (ours), and what it found and left (foreign): both named exactly
    // (B-153: the folder that holds a file still there is still there too, and named)
    const { ours, foreign } = rollBack(made);
    if (placed) WRITTEN.splice(WRITTEN.length - placed, placed);   // (removed again: not written)
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
 * (0.3.0 R4, the outside audit's F06) withPlan's policy for a tool whose writes end as fields of its answer, not as its
 * error (check_model_health's scripts and answers file): each write runs through step(), which passes its error on to
 * the caller; done() then marks the plan used, except when a write failed and the disk is exactly as approved (every
 * failed write removed all it had created, and nothing was written): the same planId writes once the cause is fixed. It
 * returns what to tell the user about the plan when a write failed (null when every write succeeded).
 */
export function planWrites(planId, tool) {
  const mark = writtenSince(); let failed = false, left = false, unknown = false;
  return {
    step(write) { try { return write(); } catch (e) { failed = true; if (!e || !e.left) unknown = true; else if (e.left.ours.length) left = true; throw e; } },
    done() {
      const wrote = writtenSince(mark);
      if (failed && !left && !unknown && !wrote.length) return `The plan ${planId} was not used: once the cause is fixed (for a full disk: free some space), call this tool again with the same planId.`;
      consume(planId, tool);
      if (!failed) return null;
      const named = wrote.length ? ` Written: ${wrote.map((f) => `"${f}"`).join(', ')}.` : '';
      if (left) return `The plan ${planId} is now used: part of this write is still on disk, so the approval can't be used for another try. Delete what is named above, then make a new plan, show it to the user and wait for their go.` + named;
      if (unknown) return `The plan ${planId} is now used: a write failed without saying what it left, so the approval can't be used for another try. Look at the folder next to the project, then make a new plan, show it to the user and wait for their go.` + named;
      return `The plan ${planId} is now used: part of this write is on disk, so the approval can't be used for another try.${named} For what was not written, make a new plan once the cause is fixed, show it to the user and wait for their go.`;
    }
  };
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
// that fails can remove them again (writeFileNew's madeDirs). R4 (the outside audit's F02): the folders are made one level
// at a time, and only those its own mkdir made are told (a folder another program made in between is not ours); a mkdir
// that fails half-way removes what it made and says so (writeFailed).
export function freeFile(folder, base, ext, made) {
  const dir = inside(folder || '.');
  // (the folders missing before, found by walking up from dir to the first one that is there, never by comparing a
  // path with mkdirSync's answer: on Windows the two can spell one folder differently, a short name like RUNNER~1)
  const missing = []; for (let d = dir; nothingAt(d) && path.dirname(d) !== d; d = path.dirname(d)) missing.unshift(d);
  const mine = [];
  try {
    for (const d of missing) { try { mine.push(makeDir(d)); } catch (e) { if (!(e && e.code === 'EEXIST')) throw e; } }
    real(dir);   // (still inside the working folder, now that every folder is there)
  } catch (e) {
    const { ours, foreign } = rollBack(mine);
    throw writeFailed(e, `the folder "${shownWritePath(dir)}"`, ours, foreign);
  }
  mine.forEach(noteDir);
  if (Array.isArray(made)) made.push(...mine.map((r) => r.path));
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (nothingAt(f)) return f;
  }
}
