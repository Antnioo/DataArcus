// The one writer of new files (audit 6, A6-4 and A6-7; the twin's T8): every tool that writes a new tree of files
// (create_report, create_arabic_twin) writes it here, all or nothing, never over anything; and the one reader of a file
// the user names (a theme, a background, a logo), measured before it is read; and where a tool may write one new file
// (freeFile: 0.2.9, the audit's A2-8, moved here from the design adapter, which reads and writes no file).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { nothingAt, real, inside } from './model.mjs';

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
export function writeTree(dir, files) {
  const tops = [...new Set(files.map((f) => String(f.path).split('/')[0]))];
  const taken = tops.filter((t) => !nothingAt(path.join(dir, t)));
  if (taken.length) throw new Error(`Nothing was written: ${taken.length === 1 ? `"${taken[0]}" is` : `${taken.length} names are`} already there (e.g. "${taken[0]}"). DataArcus never writes over anything: choose another name, or rename or move the old one.`);
  const tmp = path.join(dir, `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}`);
  real(tmp);
  tops.forEach((t) => real(path.join(dir, t)));
  const fail = testFailure(), placed = [];
  let made = false;
  try {
    fs.mkdirSync(tmp); made = true;
    let n = 0;
    for (const f of files) {
      const out = path.join(tmp, ...String(f.path).split('/'));
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, f.data, { flag: 'wx' });
      if (fail && ++n >= fail.after) { const e = new Error(`${fail.code}: the write failed after ${n} files (a test, DATAARCUS_TEST_WRITE_FAIL)`); e.code = fail.code; throw e; }
    }
    const isDir = (t) => fs.lstatSync(path.join(tmp, t)).isDirectory();
    const order = tops.filter(isDir).concat(tops.filter((t) => !isDir(t) && !/\.pbip$/i.test(t)), tops.filter((t) => !isDir(t) && /\.pbip$/i.test(t)));
    for (const t of order) {
      const from = path.join(tmp, t), to = path.join(dir, t);
      if (isDir(t)) { if (!nothingAt(to)) throw new Error(`"${t}" appeared while writing`); fs.renameSync(from, to); }
      else { fs.linkSync(from, to); fs.unlinkSync(from); }   // link: fails with EEXIST rather than replace a file
      placed.push(t); noteWritten(to);
    }
    fs.rmSync(tmp, { recursive: true, force: true }); made = false;
    return placed;
  } catch (e) {
    for (const t of placed) { try { fs.rmSync(path.join(dir, t), { recursive: true, force: true }); } catch (x) { /* already gone */ } }
    if (placed.length) WRITTEN.splice(WRITTEN.length - placed.length, placed.length);   // (removed again: not written)
    if (made) { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (x) { /* already gone */ } }
    const why = e && e.code === 'ENOSPC' ? 'the disk is full (ENOSPC)' : String(e && e.message || e).slice(0, 200);
    const err = new Error(`Nothing was written: the files could not be written (${why}). What this call had written was removed; nothing else was touched.`);
    err.code = e && e.code;
    throw err;
  }
}

/**
 * Reads a file the user names (audit 6, A6-7): inside the working folder, a regular file, at most max bytes; measured
 * before it is read. kind: what it is for the message ('theme', 'background image', 'logo'). json: parse it, and a
 * file that is not JSON is refused without quoting it (a file's text is untrusted and goes to the AI app).
 * Returns a Buffer, or the parsed JSON with json: true.
 */
export function readUserFile(p, { kind = 'file', max = 2 * 1024 * 1024, json = false } = {}) {
  const full = inside(p);
  let st;
  try { st = fs.lstatSync(full); } catch (e) { throw new Error(`The ${kind} "${path.basename(String(p))}" was not found inside the working folder. Nothing was written.`); }
  if (!st.isFile()) throw new Error(`The ${kind} "${path.basename(String(p))}" is not a file${st.isSymbolicLink() ? ' (a link: DataArcus never follows links)' : ''}. Nothing was written.`);
  if (st.size > max) throw new Error(`The ${kind} file is ${Math.round(st.size / 1024 / 1024 * 10) / 10} MB, above the ${Math.round(max / 1024 / 1024 * 10) / 10} MB DataArcus reads for a ${kind}: it was not read. Nothing was written.`);
  const buf = fs.readFileSync(full);
  if (!json) return buf;
  const t = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf ? buf.subarray(3).toString('utf8') : buf.toString('utf8');
  try { return JSON.parse(t); } catch (e) { throw new Error(`The ${kind} file is not valid JSON (its text is not shown: a file's text is not passed on). Use a theme file saved from Power BI or the DataArcus Theme Generator. Nothing was written.`); }
}

// A file inside the DataArcus folder that doesn't exist yet: name.ext, name-2.ext, name-3.ext... (a name held by
// anything, a link included, is skipped)
export function freeFile(folder, base, ext) {
  const dir = inside(folder || '.');
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (nothingAt(f)) return f;
  }
}
