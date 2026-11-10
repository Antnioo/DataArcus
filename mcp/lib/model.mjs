// @ts-check
// Reading a user's Power BI model from disk, for the MCP tools.
// Same engines as the website (assets/js), so the MCP and the tools on dataarcus.com give the same answers.
// (0.3.2 SP22) the output-name policy (the untrusted-text screen, shown names) and the metadata adaptation (column
// types, KPIs) are pure and live in model-names.mjs and model-metadata.mjs; this module keeps the disk and re-exports them.
// (0.3.2 SP42) which model a path or a name means is found in model-discovery.mjs, by listing folders only; every path
// it gives comes back here and goes through the containment (realIn) before any stat or read. The containment and the
// capped byte reads stay together in this module.
import { visible, screenWhy, LONG_NAME, nameWhy, readsLikeInstruction, WITHHELD, shownPath, shownName, NAME_OUT, nameOut, NAMES_NOTE, marked, withNamesNote } from './model-names.mjs';
import { modelOf, applyColumnTypes, kpiTarget, KPI_LIST, kpisOf } from './model-metadata.mjs';
import { ReadError, walk, byName, noModelAt, modelFolders, nearestModel } from './model-discovery.mjs';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
export { visible, screenWhy, LONG_NAME, nameWhy, readsLikeInstruction, WITHHELD, shownPath, shownName, NAME_OUT, nameOut, NAMES_NOTE, marked, withNamesNote };
export { modelOf, applyColumnTypes, kpiTarget, KPI_LIST, kpisOf };
export { ReadError };

const require = createRequire(import.meta.url);
// (A1-10, the audit of the reading block: this module exports reading only; each consumer requires its own engines.
// The readers it uses: pbip-bind's fromTmsl (the fields of a model's JSON) and tmdl-model.js (TMDL into that JSON).)
const Bind = require('../../assets/js/pbip-bind.js');
const Tmdl = require('../../assets/js/tmdl-model.js');
// (0.3.2 DD2D) a model file's bytes to text and the size limits: assets/js/model-file.js's, the website's readers' too
const ModelFile = require('../../assets/js/model-file.js');

// (0.3.3 TC1, the type-checking pilot) The types below are JSDoc comments, checked by `npx tsc -p tsconfig.tc1.json`
// (mcp/tsconfig.tc1.json); they change no runtime line. Shapes used by more than one function:
/** @typedef {typeof ModelFile.LIMITS} PbitLimits the .pbit size limits (assets/js/model-file.js LIMITS) */
/** @typedef {{ size: number, at: (start: number, n: number) => Buffer }} ZipReader a zip read by offsets: its size and a reader of n bytes at start */
/** @typedef {{ file: string, why: string }} SkippedFile a definition or report file that could not be read, named (screened) with why */
// Every path the tools read or write must sit inside the working folder, DATAARCUS_ROOT. Not set, empty, blank or
// still a placeholder ("${user_config.working_folder}": what an app's settings leave when nothing was chosen) means
// no working folder: the server never falls back to the folder it happens to start in, every tool refuses instead.
// A developer who wants the current folder sets DATAARCUS_ROOT=. on purpose.
const rawRoot = process.env.DATAARCUS_ROOT;
export const ROOT = rawRoot == null || !String(rawRoot).trim() || /\$\{[^}]*\}/.test(String(rawRoot)) ? null : path.resolve(String(rawRoot).trim());
/** @param {string} p @returns {boolean} */
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } };
// On start: a working folder that doesn't exist yet is made when the folder above it exists (the app's default,
// Documents\DataArcus, on a new machine). Never a chain of folders: a mistyped path is not created.
export function prepareRoot() {
  if (ROOT && !fs.existsSync(ROOT) && isDir(path.dirname(ROOT))) { try { fs.mkdirSync(ROOT); } catch (e) { /* told by rootProblem */ } }
}
// Why no tool can work, in words for the user; null when the working folder is there
export function rootProblem() {
  if (!ROOT) return 'No working folder is set, so DataArcus reads and writes nothing. Choose the working folder in the DataArcus settings of your AI app (the setting DATAARCUS_ROOT): the folder that holds your Power BI projects (.pbip). DataArcus then works only inside that folder.';
  if (!isDir(ROOT)) return `Your working folder ${ROOT} doesn't exist yet: create it and put a Power BI project (.pbip) in it.`;
  return null;
}
// A working folder that is there but can't be used yet (empty), as a message for the user: a normal answer, not an error
export class Notice extends Error {
  /**
   * @param {string} state
   * @param {string} message
   */
  constructor(state, message) { super(message); this.state = state; } }
// A name is free only when nothing at all is there. lstat, not existsSync: a link whose target is missing "doesn't
// exist" to existsSync, and writing at its name would create the target, outside the working folder (audit AUD-005)
/** @param {string} f @returns {boolean} */
export const nothingAt = (f) => { try { fs.lstatSync(f); return false; } catch (e) { return e.code === 'ENOENT'; } };
// A new file, never over or through anything (a link included); 0.3, B-153: written under a temporary name in the same
// folder and then put in place, so a write cut off part-way (a full disk) leaves nothing at the name (write-io.mjs)
// (imported here, beside its one use, rather than at the top: this module is otherwise the reading block's)
import { writeFileNew } from './write-io.mjs';
/** @param {string} f @param {string|Uint8Array} data */
export const writeNew = (f, data) => writeFileNew(f, data);
// (0.3.2 WN1, F01) inside or outside: the one rule, path-rules.mjs (a folder named "..draft" is inside)
import { within, sameOnDisk } from './path-rules.mjs';
/** @param {string} p @returns {ReadError} */
const linkError = (p) => new ReadError('OUTSIDE_LINK', { path: p }, `"${p}" leads outside the working folder ${ROOT} through a link (a symbolic link or a junction). DataArcus reads and writes only inside the working folder.`);
/** @param {string} p @returns {boolean} */
const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch (e) { return false; } };
// Where a path really is: the real path of its deepest part that exists (links followed), plus the part that
// doesn't exist yet. A link whose target is missing counts as leading outside.
/** @param {string} full @returns {string|null} */
function realOf(full) {
  let cur = full; const rest = [];
  while (!fs.existsSync(cur)) {
    if (isLink(cur)) return null;
    const up = path.dirname(cur); if (up === cur) break;
    rest.unshift(path.basename(cur)); cur = up;
  }
  return path.join(fs.realpathSync.native(cur), ...rest);
}
// A path given to a tool as the full path under root, or null when it is outside: inside by name, or by real path
// (0.3.1 P1: a working folder given through a link, macOS's /var to /private/var or a Windows junction, takes an
// absolute path in its real form, read as the same path under root). The real-path check of real() still follows.
/** @param {string} root @param {string|null|undefined} p @returns {string|null} */
function underRoot(root, p) {
  const full = path.resolve(root, String(p || '.'));
  if (within(root, full)) return full;
  let r, realRoot; try { r = realOf(full); realRoot = fs.realpathSync.native(root); } catch (e) { return null; }
  return r && within(realRoot, r) ? path.join(root, path.relative(realRoot, r)) : null;
}
// A full path that is, by name, inside the working folder: refused when a link on the way leads outside it
/** @param {string} full @param {string|null} [shown] @returns {string} */
export function real(full, shown) {
  const r = realOf(full);
  // @ts-expect-error ROOT is null only when no working folder is set; callers check rootProblem() first (real() itself does not)
  if (!r || !within(fs.realpathSync.native(ROOT), r)) throw linkError(shown == null ? path.relative(ROOT, full) || full : shown);
  return full;
}
/** @param {string} p @returns {string} the full path, inside the working folder */
export function inside(p) {
  const problem = rootProblem(); if (problem) throw new Error(problem);
  // @ts-expect-error ROOT is not null here: rootProblem() returned nothing above (the checker does not follow that)
  const full = underRoot(ROOT, p);
  if (full == null) throw new Error(`"${p}" is outside the allowed folder ${ROOT}`);
  return real(full, p);
}

// a file's bytes (a Buffer) -> its text: model-file.js decodeText (UTF-16LE or UTF-8, a byte order mark or none)
/** @param {Buffer|Uint8Array} buf @returns {string} */
export const decode = (buf) => ModelFile.decodeText(new Uint8Array(buf));
/** @param {Buffer|Uint8Array} buf @returns {any} */
const json = (buf) => JSON.parse(decode(buf));

// A .pbit is a zip, and a zip can be built to unpack to far more than it weighs (a "zip bomb"). So the reader reads
// the zip's directory first and unpacks ONLY the parts the tools use (the model: DataModelSchema or a model.bim; the
// report: Report/Layout or the PBIR definition files), never images, themes or anything else; and it refuses, in
// plain words and before unpacking, a file, a part or a total above these limits. inflateRawSync gets the part's
// declared size as maxOutputLength, so a directory that lies about a size is caught while unpacking.
// The limits come from what real templates hold (written down in mcp/WORK.md, "The .pbit limits"): the largest
// model part we have is 52,620 bytes (Ramadan Test.pbit), the 300-table test model is about 1.2 MB as Desktop's
// UTF-16 model file, and the website's Health Check already says "a template without data is usually under 20 MB"
// and refuses files over 300 MB. The numbers live in one place, assets/js/model-file.js LIMITS (0.3.2 DD2D), which the
// website's worker (assets/js/model-health-worker.js) and model import read too; PBIT_LIMITS is that same object.
const MB = 1024 * 1024;
export const PBIT_LIMITS = ModelFile.LIMITS;
/** @param {number} n @returns {string} */
const mb = (n) => (n >= MB / 10 ? (n / MB >= 10 ? Math.round(n / MB) : Math.round(n / MB * 10) / 10) + ' MB' : Math.ceil(n / 1024) + ' KB');
/** @param {string} what @returns {ReadError} */
const refuse = (what) => new ReadError('TOO_BIG', { what }, `This file was not read: ${what}. A Power BI template without data is usually under 20 MB; nothing in this file was used.`);
/** @param {string} n @returns {boolean} */
const isModelPart = (n) => n === 'DataModelSchema' || /(^|\/)model\.bim$/i.test(n);
/** @param {string} n @returns {boolean} */
const isReportPart = (n) => n === 'Report/Layout' || (/(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i.test(n) && !/StaticResources|CustomVisuals/i.test(n));
// buf: the zip (a Buffer, or a reader { size, at(start, n) }: the .pbit's descriptor, SQ6); lim: the limits
// (PBIT_LIMITS, or smaller ones in a test). Returns { name: bytes } of the needed parts.
// (SQ6, 0.2.9-reader-S12: the .pbit route read the whole file, up to 300 MB, into memory before picking its parts. Now
// only the directory's end, the directory and each needed part are read, at their offsets.)
/** @param {Buffer} b @returns {ZipReader} */
const bufReader = (b) => ({ size: b.length, at: (start, n) => b.subarray(Math.max(0, start), Math.max(0, Math.min(b.length, start + n))) });
/** @param {Buffer|ZipReader} buf @param {PbitLimits} [lim] @returns {Record<string, Buffer>} the needed parts by name */
export function unzipNeeded(buf, lim) {
  const L = lim || PBIT_LIMITS, R = Buffer.isBuffer(buf) ? bufReader(buf) : buf, size = R.size;
  if (size > L.file) throw refuse(`it is ${mb(size)}, above the ${mb(L.file)} DataArcus reads`);
  const tailAt = Math.max(0, size - 65557), tail = R.at(tailAt, size - tailAt);
  let eocd = -1;
  for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not a zip file');
  const count = tail.readUInt16LE(eocd + 10);
  if (count > L.entries) throw refuse(`it lists ${count} parts, above the ${L.entries} DataArcus reads`);
  // the directory: names, methods and sizes, nothing unpacked yet (read from its start to the end record: what the
  // whole-file read walked, at most the file)
  const dirAt = tail.readUInt32LE(eocd + 16), dir = dirAt < size ? R.at(dirAt, tailAt + eocd - dirAt) : Buffer.alloc(0);
  const want = []; let p = 0;
  for (let n = count; n > 0 && p + 46 <= dir.length && dir.readUInt32LE(p) === 0x02014b50; n--) {
    const method = dir.readUInt16LE(p + 10), csize = dir.readUInt32LE(p + 20), usize = dir.readUInt32LE(p + 24), nlen = dir.readUInt16LE(p + 28), xlen = dir.readUInt16LE(p + 30), clen = dir.readUInt16LE(p + 32);
    const name = dir.toString('utf8', p + 46, p + 46 + nlen), lho = dir.readUInt32LE(p + 42);
    if (isModelPart(name) || isReportPart(name)) want.push({ name, method, csize, usize, lho, model: isModelPart(name) });
    p += 46 + nlen + xlen + clen;
  }
  // refused before anything is unpacked: a part or the total declared above the limits
  let total = 0;
  for (const e of want) {
    const cap = e.model ? L.model : L.entry;
    if (e.usize > cap) throw refuse(`its ${e.model ? 'model' : 'report'} part would unpack to ${mb(e.usize)}, above the ${mb(cap)} DataArcus reads`);
    // (SQ6) and its packed size: deflate never grows a part by more than a few bytes per 16 KB, so a part packed above
    // its cap and 1 MB is a directory that lies (read part by part, it would be read whole)
    if (e.csize > cap + MB) throw refuse(`its ${e.model ? 'model' : 'report'} part is ${mb(e.csize)} packed, above the ${mb(cap)} DataArcus reads`);
    total += e.usize;
  }
  if (total > L.total) throw refuse(`the parts it needs would unpack to ${mb(total)} in total, above the ${mb(L.total)} DataArcus reads`);
  /** @type {Record<string, Buffer>} */
  const out = {};
  for (const e of want) {
    const h = R.at(e.lho, 30);
    if (e.lho + 30 > size || h.length < 30 || h.readUInt32LE(0) !== 0x04034b50) throw refuse('its directory points outside the file');
    // (what is read of a part: its packed size, checked against its cap above, and never past the file)
    const start = e.lho + 30 + h.readUInt16LE(26) + h.readUInt16LE(28), raw = R.at(start, Math.min(e.csize, size));
    if (e.method === 0) { out[e.name] = raw.subarray(0, e.usize); continue; }
    if (e.method !== 8) continue;
    // the declared size is the most a part may unpack to: a directory that lies is caught here
    try { out[e.name] = zlib.inflateRawSync(raw, { maxOutputLength: Math.max(1, e.usize) }); }
    catch (err) { throw refuse(`one of its parts unpacks to more than the ${mb(e.usize)} its directory declares, or is damaged`); }
  }
  return out;
}
// JSON from a part of the file; a part that is not JSON is told in words, never with its text (an error message from
// JSON.parse quotes the start of the text). A parsed model nested deeper than 256 levels is refused too (the outside
// review's B-02): JSON.parse takes it, but the code that walks it afterwards would run out of stack. Real models are
// 8 or 9 levels deep, reports 12 to 15 (measured on the test models and the sample .pbit files, 2026-10-05).
const MAX_DEPTH = 256;
/** @param {any} o @returns {boolean} */
// @ts-expect-error st.pop() is possibly undefined to the checker; while (st.length) makes it safe
const tooDeep = (o) => { const st = [[o, 1]]; while (st.length) { const [v, d] = st.pop(); if (d > MAX_DEPTH) return true; if (v && typeof v === 'object') for (const k in v) st.push([v[k], d + 1]); } return false; };
/** @param {Buffer|Uint8Array} buf @param {string} what @returns {any} the parsed JSON */
const partJson = (buf, what) => {
  // (SQ6, 0.2.9-reader-S15: coded, as the reader's other errors, so a caller reads the code, never the words)
  let j; try { j = json(buf); } catch (e) { throw new ReadError('BAD_JSON', { what }, `The ${what} in this file is not valid JSON, so it was not read.`); }
  if (tooDeep(j)) throw new ReadError('TOO_DEEP', { what, max: MAX_DEPTH }, `The ${what} is nested more than ${MAX_DEPTH} levels deep (a real model is about 10), so it was not read.`);
  return j;
};
// A file of the model read from disk (model.bim, a TMDL file, a report's JSON): measured before it is read (B-02), the
// same limits as the parts of a .pbit: a model file 64 MB, any other file 32 MB, all the TMDL files together 128 MB.
// The largest TMDL file we have is 46,099 bytes (the 300-table test model's relationships), the largest model.bim
// about 600 KB as JSON.
// (A1-3, the audit of the reading block: the size was measured with lstat and the file read by name afterwards, so a
// link was measured as the link and its target read whole, a 70 MB file behind a model.bim link. Now one descriptor:
// a link is refused, the file is opened without following links, measured with fstat (a regular file within the
// cap) and read to at most cap + 1 bytes, so a file that grows in between is refused too.)
/** @param {string} what @returns {Error} */
const linkRefused = (what) => new Error(`This file was not read: its ${what} is a link (a symbolic link or a junction), and DataArcus never follows links. Nothing in it was used.`);
/** @param {string} f @param {number} cap @param {string} what @returns {Buffer} */
export function readCapped(f, cap, what) {
  if (isLink(f)) throw linkRefused(what);
  let fd;
  try { fd = fs.openSync(f, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0)); } catch (e) { if (e.code === 'ELOOP') throw linkRefused(what); throw e; }
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) throw new Error(`This file was not read: its ${what} is not a regular file.`);
    if (st.size > cap) throw refuse(`its ${what} is ${mb(st.size)}, above the ${mb(cap)} DataArcus reads`);
    const buf = Buffer.alloc(st.size + 1 > cap + 1 ? cap + 1 : st.size + 1);
    let n = 0, r;
    while (n < buf.length && (r = fs.readSync(fd, buf, n, buf.length - n, null)) > 0) n += r;
    if (n > cap) throw refuse(`its ${what} is above the ${mb(cap)} DataArcus reads`);
    return buf.subarray(0, n);
  } finally { fs.closeSync(fd); }
}

// (rc.23, F1, an outside audit of 0.2.9: a .pbix was read whole into memory, its data cache included, and refused only
// then with "No model in this file". Nothing was decoded or returned, but PRIVACY.md says it never opens the data cache.)
// A .pbix and data files are refused by their name, before they are opened; a .json is read as a model's JSON.
const PBIX_WHY = 'A .pbix holds Power BI\'s data cache (your data), so DataArcus never opens it. Export a .pbit (File > Export > Power BI template), or save the report as a Power BI project (File > Save as, .pbip), and point at that.';
const DATA_FILE = /\.(csv|tsv|xlsx|xlsm|xls|parquet)$/i;
/** @param {string} full @returns {void} */
function notAModelFile(full) {
  if (/\.pbix$/i.test(full)) throw new ReadError('PBIX_FILE', {}, `This file was not opened: ${PBIX_WHY}`);
  const ext = (full.match(DATA_FILE) || [])[0];
  if (ext) throw new ReadError('DATA_FILE', { ext: ext.toLowerCase() }, `This file was not opened: a ${ext.toLowerCase()} is a data file, not a Power BI model, and DataArcus opens no data files. Point at a project folder, a model.bim or a .pbit (File > Export > Power BI template).`);
}
// A zip's directory, read alone: the end-of-central-directory record (the last 22 bytes; a zip with a comment after it:
// the last 64 KB, where the format puts it), then the directory itself, bounded by the limits. Nothing else of the file.
// Throws when the directory lists a DataModel and no DataModelSchema (a .pbix by another name). A zip it can't make
// sense of is left to unzipNeeded, which says why in its own words.
/** @param {number} fd @param {number} size @param {number} start @param {number} n @returns {Buffer} */
function readAt(fd, size, start, n) { const b = Buffer.alloc(Math.max(0, Math.min(n, size - start))); let got = 0, r; while (got < b.length && (r = fs.readSync(fd, b, got, b.length - got, start + got)) > 0) got += r; return b.subarray(0, got); }
// (SQ6, 0.2.9-reader-S12) a .pbit read by its parts: one descriptor (a link refused, never followed; a regular file
// within the cap, as readCapped), the print hashed in 1 MB chunks (the same SHA-256 of the whole file, never held whole),
// then the directory and the needed parts at their offsets. A file whose size is not the one measured before it was
// opened, or that changed while it was read, is refused: the print and the parts are of one file.
const changedWhileRead = () => new ReadError('CHANGED', {}, 'This file was not read: it changed while it was read (it is being saved or copied?). Wait until it is saved, then ask again; nothing in it was used.');
/** @param {string} f @param {number} cap @param {number} size0 @returns {{ print: string, z: Record<string, Buffer> }} */
function zipParts(f, cap, size0) {
  if (isLink(f)) throw linkRefused('file');
  let fd;
  try { fd = fs.openSync(f, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0)); } catch (e) { if (e.code === 'ELOOP') throw linkRefused('file'); throw e; }
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) throw new Error('This file was not read: its file is not a regular file.');
    if (st.size > cap) throw refuse(`its file is ${mb(st.size)}, above the ${mb(cap)} DataArcus reads`);
    const h = crypto.createHash('sha256'), chunk = Buffer.alloc(MB);
    let n = 0, r;
    while ((r = fs.readSync(fd, chunk, 0, chunk.length, n)) > 0) { h.update(chunk.subarray(0, r)); n += r; if (n > cap) throw refuse(`its file is above the ${mb(cap)} DataArcus reads`); }
    const z = unzipNeeded({ size: n, at: (start, len) => readAt(fd, n, start, len) }), after = fs.fstatSync(fd);
    if (n !== size0 || st.size !== size0 || after.size !== st.size || after.mtimeMs !== st.mtimeMs) throw changedWhileRead();
    return { print: h.digest('hex'), z };
  } finally { fs.closeSync(fd); }
}
/** @param {string} full @param {number} size @returns {void} */
function zipDirectoryCheck(full, size) {
  let fd;
  try { fd = fs.openSync(full, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0)); } catch (e) { return; }
  try {
    let tail = readAt(fd, size, Math.max(0, size - 22), 22), at = tail.length === 22 && tail.readUInt32LE(0) === 0x06054b50 ? 0 : -1;
    if (at < 0) {
      const from = Math.max(0, size - 65557); tail = readAt(fd, size, from, size - from);
      for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { at = i; break; }
      if (at < 0) return;
    }
    const count = tail.readUInt16LE(at + 10), dirSize = tail.readUInt32LE(at + 12), dirAt = tail.readUInt32LE(at + 16);
    if (count > PBIT_LIMITS.entries || dirSize > PBIT_LIMITS.entry || dirAt + dirSize > size) return;
    const dir = readAt(fd, size, dirAt, dirSize), names = new Set();
    for (let p = 0, n = count; n > 0 && p + 46 <= dir.length && dir.readUInt32LE(p) === 0x02014b50; n--) {
      const nlen = dir.readUInt16LE(p + 28); names.add(dir.toString('utf8', p + 46, p + 46 + nlen));
      p += 46 + nlen + dir.readUInt16LE(p + 30) + dir.readUInt16LE(p + 32);
    }
    if (names.has('DataModel') && !names.has('DataModelSchema')) throw new ReadError('PBIX_FILE', {}, `This file was not read: its list of parts shows a DataModel and no model schema, so it is a .pbix by another name. ${PBIX_WHY}`);
  } finally { fs.closeSync(fd); }
}

// The model a path points at: a project folder (nearest .SemanticModel or older .Dataset), a model folder,
// a model.bim or a .pbit. Returns { source, folder, tables (field-picker shape), tmsl (full model JSON, built from the TMDL files when there is no model.bim),
// report (for the health check, when the file has one) }. Which model a name or a folder means: model-discovery.mjs.
/**
 * What loadModel reads: one shape for every route (A1-5, the audit of the reading block).
 * @typedef {Object} ModelRead
 * @property {string} source  the model's place, relative to the working folder (screened)
 * @property {string|null} folder  the model folder (null for a model.bim or .pbit given as a file)
 * @property {string|null} projectDir  the project folder beside the model folder, when it is inside the working folder
 * @property {Object} tmsl  the whole model in model.bim form (modelOf(tmsl) unwraps it)
 * @property {Array<{name:string, hidden:boolean, date:boolean, columns:Array<any>, measures:Array<any>}>} tables  the fields, read
 *   from tmsl (fromTmsl), without Power BI's hidden automatic date tables
 * @property {{format:string, files:Array<{path:string, json:Object}>}|null} report  the model's own reports, for the health check
 * @property {{counted:string[], notCounted:Array<any>, notRead?:Array<any>, skipped?:Array<{file:string, why:string}>, partial?:string}|null} reportsSeen
 * @property {string|null} print  the model's fingerprint, a sha256 of the definition files read (B-154; was missing from this list)
 * @property {number} partsSkipped  model parts left out because they were not lists of objects (F-M2)
 * @property {Array<{file:string, why:string}>} skipped  definition files that could not be read fully (AU47), named
 *   relative to the project (screened), never their text; empty when every file was read
 */
/**
 * What modelRead takes: a ModelRead's fields before the tables are derived from tmsl.
 * @typedef {{ source: string, tmsl: any, folder?: string|null, projectDir?: string|null, report?: ModelRead['report'], reportsSeen?: ModelRead['reportsSeen'], print?: string|null, skipped?: SkippedFile[] }} ModelIn
 */
// (F-M2, the fuzz test: a model.bim or .pbit whose tables, columns, measures, partitions or relationships were not lists of
// objects crashed in the field picker's catalog. The shape is checked here, where the model comes in: a list that is
// not a list becomes empty and an entry that is not an object is left out, both counted in partsSkipped; both views,
// the model's JSON and the reader's tables, then read the same checked model)
/** @param {any} x @returns {x is Record<string, any>} */
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
/** @param {any} tmsl @returns {{ tmsl: any, skipped: number }} */
function shapeChecked(tmsl) {
  let skipped = 0;
  const root = isObj(tmsl) ? tmsl : (skipped++, { model: {} });
  if (root.model !== undefined && !isObj(root.model)) { root.model = {}; skipped++; }
  const m = isObj(root.model) ? root.model : root;   // a model.bim's JSON, or a model given without its wrapper (modelOf)
  /** @param {Record<string, any>} o @param {string} k */
  const list = (o, k) => { if (o[k] === undefined) return; if (!Array.isArray(o[k])) { o[k] = []; skipped++; return; } const n = o[k].length; o[k] = o[k].filter(isObj); skipped += n - o[k].length; };
  list(m, 'tables'); list(m, 'relationships');
  (m.tables || []).forEach(/** @param {any} t */ (t) => ['columns', 'measures', 'partitions', 'hierarchies'].forEach((k) => list(t, k)));
  return { tmsl: root, skipped };
}
/** @param {ModelIn} o0 @returns {ModelRead} */
const modelRead = (o0) => { const c = shapeChecked(o0.tmsl), o = Object.assign({}, o0, { tmsl: c.tmsl }); return ({ source: o.source, folder: o.folder || null, projectDir: o.projectDir || null, tmsl: o.tmsl, partsSkipped: c.skipped,
  tables: Bind.fromTmsl(o.tmsl).filter(/** @param {any} t */ (t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name)), report: o.report || null, reportsSeen: o.reportsSeen || null, print: o.print || null, skipped: o.skipped || [] }); };
// (AU47, the night audit's AUD-047) a model with a definition file that could not be read fully: the answer's first key
// (read_model, check_model_health), and the planning tools' refusal (nothing is planned on part of a model)
/** @param {ModelRead|null|undefined} m @returns {{ unreadable?: { message: string, skipped: SkippedFile[] } }} */
export const unreadableOf = (m) => (m && m.skipped && m.skipped.length ? { unreadable: { message: Tmdl.unreadableSaid(m.skipped, 'en'), skipped: m.skipped } } : {});
/** @template {ModelRead|null|undefined} T @param {T} m @returns {T} */
export function refuseUnreadable(m) {
  if (m && m.skipped && m.skipped.length) throw new ReadError('MODEL_UNREADABLE', { skipped: m.skipped }, Tmdl.unreadableSaid(m.skipped, 'en') + ' Nothing was planned or written: DataArcus does not plan on a model it could read only in part.');
  return m;
}
// (0.3, B-154, an outside audit of 0.2.9: an approval pinned the inputs, not the model) the model's fingerprint: a sha256 of
// the definition files this read already read (model.bim, or each TMDL file by its path; a .pbit or model.bim file's own
// bytes), never another file of the folder (Power BI's .pbi/cache.abf holds data). A plan pins it; the write reads the
// model again and refuses one that changed since the go (plans.mjs)
/** @param {Buffer|string} b @returns {string} */
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// a report file that could not be read: said, never dropped silently (A1-4)
/** @param {any} e @returns {string} */
const skippedOf = (e) => (e && e.code === 'BAD_JSON' ? 'not valid JSON' : e && e.code === 'TOO_DEEP' ? 'nested too deep' : /above the/.test(String(e && e.message)) ? 'too big' : /link/i.test(String(e && e.message)) ? 'a link (never followed)' : 'could not be read');
const PARTIAL = 'Some report files could not be read (skipped): the findings about fields "not used anywhere" are partial, since those files may use them.';

// opts.root: the working folder to read in (default: DATAARCUS_ROOT). Returns a ModelRead; throws a ReadError (or a
// Notice for an empty working folder).
/** @param {string} p @param {{ root?: string }} [opts] @returns {ModelRead} */
export function loadModel(p, opts) {
  /** @type {string} */
  // @ts-expect-error root is null only when ROOT is null and no opts.root is given; rootProblem() throws on the next line then
  const root = opts && opts.root ? path.resolve(String(opts.root)) : ROOT;
  if (!(opts && opts.root)) { const problem = rootProblem(); if (problem) throw new Error(problem); }
  /** @param {string} full @param {string|null} [shown] @returns {string} */
  const realIn = (full, shown) => { const r = realOf(full); if (!r || !within(fs.realpathSync.native(root), r)) throw linkError(shown == null ? path.relative(root, full) || full : shown); return full; };
  let full = underRoot(root, p);
  if (full == null) throw new ReadError('OUTSIDE', { path: p }, `"${p}" is outside the allowed folder ${root}`);
  realIn(full, p);
  // not a path that exists, and written without a slash: a model's name
  // (A1-1, the audit of the reading block: every path picked here goes through real() before any stat or read, as the
  // path given does; a .pbip's model folder that is a link leading outside was read)
  if (!fs.existsSync(full) && !/[\\/]/.test(String(p))) full = realIn(byName(p, root), p);
  // a .pbip file is the project's shortcut, not a model: the model folder of its name beside it, else its folder
  else if (/\.pbip$/i.test(full) && fs.existsSync(full) && fs.statSync(full).isFile()) { const beside = full.replace(/\.pbip$/i, '.SemanticModel'); full = realIn(nothingAt(beside) ? path.dirname(full) : beside, p); }
  else if (!fs.existsSync(full)) throw noModelAt(p, root);
  const st = fs.statSync(full);
  if (st.isFile()) {
    // (rc.23, F1, an outside audit of 0.2.9) a .pbix holds Power BI's data cache and a data file holds data: both are
    // refused by their name, before the file is opened (PRIVACY.md section 3)
    notAModelFile(full);
    // a file above the limit is refused before it is read into memory (a .pbit 300 MB; a model.bim given as a file 64 MB)
    const isZip = (() => { try { const fd = fs.openSync(full, 'r'), b = Buffer.alloc(2); fs.readSync(fd, b, 0, 2, 0); fs.closeSync(fd); return b[0] === 0x50 && b[1] === 0x4b; } catch (e) { return false; } })();
    const cap = isZip ? PBIT_LIMITS.file : PBIT_LIMITS.model;
    if (st.size > cap) throw refuse(`it is ${mb(st.size)}, above the ${mb(cap)} DataArcus reads${isZip ? '' : ' for a model file'}`);
    // (rc.23, F1) a zip accepted by its name (.pbit, no extension): its directory first, and a .pbix by another name (a
    // DataModel, Power BI's data cache, and no DataModelSchema) is refused before the rest of the file is read
    if (isZip) zipDirectoryCheck(full, st.size);
    const source = shownName(path.basename(full), 80);
    if (isZip) {
      const { z, print } = zipParts(full, cap, st.size), dms = z.DataModelSchema || Object.entries(z).find(([n]) => /(^|\/)model\.bim$/i.test(n))?.[1];
      if (!dms) throw new ReadError('NO_MODEL_IN_FILE', {}, 'No model in this file. Use a .pbit (File > Export > Power BI template), a model.bim, or a project folder.');
      // the report: the legacy Report/Layout file, or PBIR files (same choice as the website's worker)
      const tmsl = partJson(dms, 'model part'), layout = z['Report/Layout'], /** @type {SkippedFile[]} */ skipped = [];
      const pbir = Object.keys(z).filter((n) => /(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i.test(n) && !/StaticResources|CustomVisuals/i.test(n));
      const report = layout ? { format: 'legacy', files: [{ path: 'Report/Layout', json: partJson(layout, 'report part') }] }
        : pbir.length ? { format: 'pbir', files: pbir.map((n) => { try { return { path: n, json: partJson(z[n], 'report part') }; } catch (e) { skipped.push({ file: shownPath(n), why: skippedOf(e) }); return null; } }).filter(Boolean) } : null;
      // @ts-expect-error the .filter(Boolean) drops the nulls at run time; the checker keeps them in the type
      return modelRead({ source, tmsl, report, print, reportsSeen: skipped.length ? { counted: [], notCounted: [], skipped, partial: PARTIAL } : null });
    }
    const buf = readCapped(full, cap, 'model file');
    return modelRead({ source, tmsl: partJson(buf, 'model file'), print: sha(buf) });
  }
  // a folder: the model folder nearest to the top wins (a backup copy deeper down never does)
  /** @type {string[]} */
  const links = [];
  const dirs = modelFolders(full, links);
  if (!dirs.length) {
    // a model folder that is a link is not followed: say so when it leads outside the working folder
    const linked = links.find((l) => /\.(SemanticModel|Dataset)$/i.test(l));
    if (linked) realIn(linked);
    if (path.resolve(full) === root && !fs.readdirSync(root).length) throw new Notice('empty', `Your working folder ${root} is empty: put a Power BI project (a .pbip file with its folders, saved from Power BI Desktop) in it. No project yet? DataArcus can write a made-up sample to try: plan_layout with sample true.`);
    throw new ReadError('NO_MODEL_FOLDER', { path: p }, `No .SemanticModel folder in ${p}. Point at a Power BI project folder saved from Desktop.`);
  }
  const folder = realIn(nearestModel(dirs, root, p)), bim = path.join(folder, 'model.bim');
  if (isLink(bim)) realIn(bim);
  let tmsl = null, print = null, skipped = [];
  if (fs.existsSync(bim)) { const b = readCapped(bim, PBIT_LIMITS.model, 'model.bim'); print = sha(b); tmsl = partJson(b, 'model.bim'); }
  else {
    const tdir = path.join(folder, 'definition', 'tables');
    if (!fs.existsSync(tdir)) throw new ReadError('NO_MODEL_FILES', { folder: shownPath(path.relative(root, folder)) }, `No model.bim and no definition/tables in ${shownPath(path.relative(root, folder))}`);
    if (isLink(path.join(folder, 'definition'))) realIn(path.join(folder, 'definition'));
    if (isLink(tdir)) realIn(tdir);
    // every TMDL file measured first, one by one and all together, before any is read
    const def = path.join(folder, 'definition'), tfiles = walk(def).filter(/** @param {string} f */ (f) => /\.tmdl$/i.test(f));
    let total = 0;
    for (const f of tfiles) { const size = fs.lstatSync(f).size; if (size > PBIT_LIMITS.entry) throw refuse(`one of its TMDL files is ${mb(size)}, above the ${mb(PBIT_LIMITS.entry)} DataArcus reads`); total += size; }
    if (total > PBIT_LIMITS.total) throw refuse(`its TMDL files are ${mb(total)} together, above the ${mb(PBIT_LIMITS.total)} DataArcus reads`);
    /** @type {string[]} */
    const lines = [];
    const text = new Map(tfiles.map(/** @param {string} f */ (f) => { const b = readCapped(f, PBIT_LIMITS.entry, 'TMDL file'); lines.push(path.relative(folder, f).split(path.sep).join('/') + '\0' + sha(b) + '\n'); return [f, decode(b)]; }));
    print = sha(lines.sort().join(''));
    // (A1-8: one parse: the model's JSON from tmdl-model.js, the picker's fields from that JSON, as for a model.bim)
    // the whole model (expressions, relationships, roles...) in model.bim form, for the health check
    // (lineage tags kept: the fix scripts write each object back with its own tag, so Desktop doesn't give it a new one)
    const got = Tmdl.read(tfiles.map(/** @param {string} f */ (f) => ({ path: path.relative(folder, f).replace(/\\/g, '/'), text: text.get(f) })), { lineageTags: true });
    tmsl = got.model;
    // (AU47) a definition file that could not be read fully: named relative to the project (screened), with why
    skipped = got.skipped.map(/** @param {any} x */ (x) => ({ file: shownPath(path.basename(folder) + '/' + x.path), why: Tmdl.whyOf(x, 'en') }));
  }
  // the project's own reports (PBIR), for the health check and for choosing a report name that is free
  // (A3-1's calendars are marked by fromTmsl, which every model now goes through)
  // When the working folder is the model folder itself, the project folder is outside it: nothing there is read
  // (no reports) and create_report refuses (projectDir null).
  const projectDir = within(root, path.dirname(folder)) ? path.dirname(folder) : null;
  const beside = projectDir ? fs.readdirSync(projectDir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink()).map((e) => e.name) : [];
  // (0.2.9 item 13, the 0.2.8 beta's folder bug) only the reports of this model: their definition.pbir points at this
  // model folder. Another project's reports in the same folder were counted as this model's broken reports, and the chat
  // then suggested deleting good reports. Every other report is named with why, and never read.
  const all = beside.filter((n) => /\.Report$/i.test(n)), /** @type {Array<{report: string, why: string}>} */ notCounted = [];
  // @ts-expect-error projectDir is null only when beside is empty, so this callback never runs with null (checker loses the link)
  const reports = all.filter((r) => { const why = notThisModel(projectDir, r, folder); if (why) notCounted.push({ report: shownName(r.replace(/\.Report$/i, ''), 80), why }); return !why; });
  // (rc.22, B-144: a report of this model with no pages to read was "counted" and the answer said reportRead false with no
  // reason) each counted report whose files can't be read is named with why: the columns it uses are then unknown
  /** @type {Array<{report: string, why: string}>} */
  const notRead = [];
  // @ts-expect-error projectDir is non-null whenever reports is non-empty (checker loses the link)
  const pbir = reports.flatMap((r) => { const d = path.join(projectDir, r, 'definition'); const files = !isLink(d) && fs.existsSync(d) ? walk(d).filter(/** @param {string} f */ (f) => f.endsWith('.json')) : [];
    // @ts-expect-error same: projectDir non-null whenever a report is read
    if (!files.length) notRead.push({ report: shownName(r.replace(/\.Report$/i, ''), 80), why: isLink(d) ? 'its definition folder is a link (never followed)' : fs.existsSync(d) ? 'its definition folder has no report files' : fs.existsSync(path.join(projectDir, r, 'report.json')) ? 'it is saved in the older report format (report.json), which this check does not read yet: save it again in Power BI Desktop with the PBIR format' : 'it has no definition folder (no pages or visuals saved): only its definition.pbir is there' });
    return files; });
  // (round 17, the outside review's G-05: each report file was capped, but not all of them together) every report JSON
  // file measured first, all together, before any is read, as the TMDL files above
  { let total = 0; for (const f of pbir) total += fs.lstatSync(f).size;
    if (total > PBIT_LIMITS.total) throw refuse(`the JSON files of its reports are ${mb(total)} together, above the ${mb(PBIT_LIMITS.total)} DataArcus reads`); }
  // (A1-4: a file that cannot be read is listed as skipped with why, and the "unused" findings are said to be partial)
  /** @type {SkippedFile[]} */
  const reportSkipped = [];
  // @ts-expect-error same: projectDir non-null whenever pbir is non-empty
  const report = pbir.length ? { format: 'pbir', files: pbir.map((f) => { try { return { path: f.replace(/\\/g, '/'), json: partJson(readCapped(f, PBIT_LIMITS.entry, 'report file'), 'report file') }; } catch (e) { reportSkipped.push({ file: shownPath(path.relative(projectDir, f)), why: skippedOf(e) }); return null; } }).filter(Boolean) } : null;
  const reportsSeen = projectDir ? Object.assign({ counted: reports.map((r) => shownName(r.replace(/\.Report$/i, ''), 80)), notCounted }, notRead.length ? { notRead } : {}, reportSkipped.length ? { skipped: reportSkipped, partial: PARTIAL } : {}) : null;
  // @ts-expect-error the .filter(Boolean) drops the nulls at run time; the checker keeps them in the type
  return modelRead({ source: shownPath(path.relative(root, folder)) || shownName(path.basename(folder), 80), folder, projectDir, tmsl, report, reportsSeen, print, skipped });
}

// why a report beside the model is not this model's (null when it is): its definition.pbir must name this model folder
// by path. A report connected to a published model (byConnection), or with no readable definition.pbir, is not counted.
/** @param {string} projectDir @param {string} r @param {string} folder @returns {string|null} */
function notThisModel(projectDir, r, folder) {
  const f = path.join(projectDir, r, 'definition.pbir');
  let j;
  try { if (isLink(path.join(projectDir, r)) || isLink(f) || !fs.existsSync(f)) return 'it has no definition.pbir, so the model it uses is not known'; j = partJson(readCapped(f, PBIT_LIMITS.entry, 'definition.pbir'), 'definition.pbir'); }
  catch (e) { return 'its definition.pbir could not be read, so the model it uses is not known'; }
  const ref = (j && j.datasetReference) || {};
  if (ref.byConnection) return 'it connects to a published model, not to this model folder';
  const to = ref.byPath && typeof ref.byPath.path === 'string' ? path.resolve(projectDir, r, ref.byPath.path.replace(/\\/g, '/')) : null;
  if (!to) return 'its definition.pbir names no model, so the model it uses is not known';
  const same = sameOnDisk(to, folder);   // (0.3.2 WN1, F02: the one comparison, path-rules.mjs)
  return same ? null : `it belongs to another model (${shownName(path.basename(to), 80)}), not to ${shownName(path.basename(folder), 80)}`;
}

// Short, readable summary of a model for the agent
/** @param {ModelRead} m */
export function summary(m) {
  return m.tables.map((t) => Object.assign({
    table: nameOut(t.name) }, readsLikeInstruction(t.name) ? { suspicious: true } : {}, { hidden: !!t.hidden, dateTable: !!t.date,
    columns: t.columns.filter((c) => !c.isHidden).map((c) => marked(`${nameOut(c.name)} (${nameOut(c.dataType || 'unknown')})`, c.name, c.dataType)),
    hiddenColumns: t.columns.filter((c) => c.isHidden).length,
    measures: t.measures.filter((x) => !x.isHidden).map((x) => marked(nameOut(x.name) + (x.formatString ? ` [${nameOut(x.formatString)}]` : ''), x.name, x.formatString))
  }));
}
