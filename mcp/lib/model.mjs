// Reading a user's Power BI model from disk, for the MCP tools.
// Same engines as the website (assets/js), so the MCP and the tools on dataarcus.com give the same answers.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const Bind = require('../../assets/js/pbip-bind.js');
export const Health = require('../../assets/js/model-health-engine.js');
export const Pbip = require('../../assets/js/pbip-export.js');
const Tmdl = require('../../assets/js/tmdl-model.js');
export const Fix = require('../../assets/js/model-health-tmdl.js');
export const Svg = require('../../assets/js/svg-kpi-compiler.js');
export const Gulf = require('../../assets/js/gulf-health.js');

// Every path the tools read or write must sit inside the working folder, DATAARCUS_ROOT. Not set, empty, blank or
// still a placeholder ("${user_config.working_folder}": what an app's settings leave when nothing was chosen) means
// no working folder: the server never falls back to the folder it happens to start in, every tool refuses instead.
// A developer who wants the current folder sets DATAARCUS_ROOT=. on purpose.
const rawRoot = process.env.DATAARCUS_ROOT;
export const ROOT = rawRoot == null || !String(rawRoot).trim() || /\$\{[^}]*\}/.test(String(rawRoot)) ? null : path.resolve(String(rawRoot).trim());
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
export class Notice extends Error { constructor(state, message) { super(message); this.state = state; } }
// A name is free only when nothing at all is there. lstat, not existsSync: a link whose target is missing "doesn't
// exist" to existsSync, and writing at its name would create the target, outside the working folder (audit AUD-005)
export const nothingAt = (f) => { try { fs.lstatSync(f); return false; } catch (e) { return e.code === 'ENOENT'; } };
// A new file: 'wx' fails when anything is at the name (a link included), so nothing is ever written over or through
export const writeNew = (f, data) => { fs.writeFileSync(f, data, { flag: 'wx' }); };
const within = (root, p) => { const rel = path.relative(root, p); return !(rel.startsWith('..') || path.isAbsolute(rel)); };
const linkError = (p) => new Error(`"${p}" leads outside the working folder ${ROOT} through a link (a symbolic link or a junction). DataArcus reads and writes only inside the working folder.`);
const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch (e) { return false; } };
// Where a path really is: the real path of its deepest part that exists (links followed), plus the part that
// doesn't exist yet. A link whose target is missing counts as leading outside.
function realOf(full) {
  let cur = full; const rest = [];
  while (!fs.existsSync(cur)) {
    if (isLink(cur)) return null;
    const up = path.dirname(cur); if (up === cur) break;
    rest.unshift(path.basename(cur)); cur = up;
  }
  return path.join(fs.realpathSync.native(cur), ...rest);
}
// A full path that is, by name, inside the working folder: refused when a link on the way leads outside it
export function real(full, shown) {
  const r = realOf(full);
  if (!r || !within(fs.realpathSync.native(ROOT), r)) throw linkError(shown == null ? path.relative(ROOT, full) || full : shown);
  return full;
}
export function inside(p) {
  const problem = rootProblem(); if (problem) throw new Error(problem);
  const full = path.resolve(ROOT, String(p || '.'));
  if (!within(ROOT, full)) throw new Error(`"${p}" is outside the allowed folder ${ROOT}`);
  return real(full, p);
}

const decode = (buf) => {
  const u8 = new Uint8Array(buf);
  if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
  if (u8.length > 1 && u8[1] === 0) return new TextDecoder('utf-16le').decode(u8);
  return new TextDecoder('utf-8').decode(u8);
};
const json = (buf) => JSON.parse(decode(buf));

// A .pbit is a zip, and a zip can be built to unpack to far more than it weighs (a "zip bomb"). So the reader reads
// the zip's directory first and unpacks ONLY the parts the tools use (the model: DataModelSchema or a model.bim; the
// report: Report/Layout or the PBIR definition files), never images, themes or anything else; and it refuses, in
// plain words and before unpacking, a file, a part or a total above these limits. inflateRawSync gets the part's
// declared size as maxOutputLength, so a directory that lies about a size is caught while unpacking.
// The limits come from what real templates hold (written down in mcp/WORK.md, "The .pbit limits"): the largest
// model part we have is 52,620 bytes (Ramadan Test.pbit), the 300-table test model is about 1.2 MB as Desktop's
// UTF-16 model file, and the website's Health Check already says "a template without data is usually under 20 MB"
// and refuses files over 300 MB. The website's worker (assets/js/model-health-worker.js) carries the same numbers.
const MB = 1024 * 1024;
export const PBIT_LIMITS = { model: 64 * MB, entry: 32 * MB, total: 128 * MB, file: 300 * MB, entries: 20000 };
const mb = (n) => (n >= MB / 10 ? (n / MB >= 10 ? Math.round(n / MB) : Math.round(n / MB * 10) / 10) + ' MB' : Math.ceil(n / 1024) + ' KB');
const refuse = (what) => new Error(`This file was not read: ${what}. A Power BI template without data is usually under 20 MB; nothing in this file was used.`);
const isModelPart = (n) => n === 'DataModelSchema' || /(^|\/)model\.bim$/i.test(n);
const isReportPart = (n) => n === 'Report/Layout' || (/(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i.test(n) && !/StaticResources|CustomVisuals/i.test(n));
// buf: the zip; lim: the limits (PBIT_LIMITS, or smaller ones in a test). Returns { name: bytes } of the needed parts.
export function unzipNeeded(buf, lim) {
  const L = lim || PBIT_LIMITS;
  if (buf.length > L.file) throw refuse(`it is ${mb(buf.length)}, above the ${mb(L.file)} DataArcus reads`);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  if (count > L.entries) throw refuse(`it lists ${count} parts, above the ${L.entries} DataArcus reads`);
  // the directory: names, methods and sizes, nothing unpacked yet
  const want = []; let p = buf.readUInt32LE(eocd + 16);
  for (let n = count; n > 0 && p + 46 <= buf.length && buf.readUInt32LE(p) === 0x02014b50; n--) {
    const method = buf.readUInt16LE(p + 10), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24), nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen), lho = buf.readUInt32LE(p + 42);
    if (isModelPart(name) || isReportPart(name)) want.push({ name, method, csize, usize, lho, model: isModelPart(name) });
    p += 46 + nlen + xlen + clen;
  }
  // refused before anything is unpacked: a part or the total declared above the limits
  let total = 0;
  for (const e of want) {
    const cap = e.model ? L.model : L.entry;
    if (e.usize > cap) throw refuse(`its ${e.model ? 'model' : 'report'} part would unpack to ${mb(e.usize)}, above the ${mb(cap)} DataArcus reads`);
    total += e.usize;
  }
  if (total > L.total) throw refuse(`the parts it needs would unpack to ${mb(total)} in total, above the ${mb(L.total)} DataArcus reads`);
  const out = {};
  for (const e of want) {
    if (e.lho + 30 > buf.length || buf.readUInt32LE(e.lho) !== 0x04034b50) throw refuse('its directory points outside the file');
    const start = e.lho + 30 + buf.readUInt16LE(e.lho + 26) + buf.readUInt16LE(e.lho + 28), raw = buf.subarray(start, start + e.csize);
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
const tooDeep = (o) => { const st = [[o, 1]]; while (st.length) { const [v, d] = st.pop(); if (d > MAX_DEPTH) return true; if (v && typeof v === 'object') for (const k in v) st.push([v[k], d + 1]); } return false; };
const partJson = (buf, what) => {
  let j; try { j = json(buf); } catch (e) { throw new Error(`The ${what} in this file is not valid JSON, so it was not read.`); }
  if (tooDeep(j)) throw new Error(`The ${what} is nested more than ${MAX_DEPTH} levels deep (a real model is about 10), so it was not read.`);
  return j;
};
// A file of the model read from disk (model.bim, a TMDL file, a report's JSON): measured before it is read (B-02), the
// same limits as the parts of a .pbit: a model file 64 MB, any other file 32 MB, all the TMDL files together 128 MB.
// The largest TMDL file we have is 46,099 bytes (the 300-table test model's relationships), the largest model.bim
// about 600 KB as JSON.
const readCapped = (f, cap, what) => {
  const size = fs.lstatSync(f).size;
  if (size > cap) throw refuse(`its ${what} is ${mb(size)}, above the ${mb(cap)} DataArcus reads`);
  return fs.readFileSync(f);
};

// Links (symbolic links, junctions) are never followed: they are left out, and listed in `links` when given
const walk = (dir, depth = 0, links = null) => (depth > 4 ? [] : fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = path.join(dir, e.name);
  if (e.name === 'node_modules' || e.name === '.git') return [];
  if (e.isSymbolicLink()) { if (links) links.push(full); return []; }
  return e.isDirectory() ? [full, ...walk(full, depth + 1, links)] : [full];
}));

// The model a path points at: a project folder (nearest .SemanticModel or older .Dataset), a model folder,
// a model.bim or a .pbit. Returns { source, folder, tables (field-picker shape), tmsl (full model JSON, built from the TMDL files when there is no model.bim),
// report (for the health check, when the file has one) }.
// A model asked for by its plain name ("Ramadan Test", "Ramadan Test.pbip"), when no file or folder of that path
// exists: the one model folder, .pbip or project folder of that name inside the working folder (any letter case;
// links are not followed). None, or more than one: an error that says what is there, never a guess.
function byName(p) {
  const strip = (n) => String(n).replace(/\.(pbip|SemanticModel|Dataset)$/i, ''), want = strip(p).trim().toLowerCase(), isModel = (n) => /\.(SemanticModel|Dataset)$/i.test(n);
  const hits = new Set(), models = [];
  const visit = (dir, depth) => { let list = []; try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of list) {
      if (e.isSymbolicLink() || e.name === 'node_modules' || e.name === '.git') continue;
      const full = path.join(dir, e.name), same = strip(e.name).toLowerCase() === want;
      if (e.isDirectory() && isModel(e.name)) { models.push(full); if (same) hits.add(full); continue; }
      if (e.isDirectory() && /\.Report$/i.test(e.name)) continue;
      // a .pbip: the model folder of the same name beside it, else its folder (the nearest model in it)
      if (!e.isDirectory() && /\.pbip$/i.test(e.name) && same) { const m = list.find((x) => x.isDirectory() && isModel(x.name) && strip(x.name).toLowerCase() === want); hits.add(m ? path.join(dir, m.name) : dir); }
      if (e.isDirectory()) { if (same && fs.readdirSync(full).some((n) => isModel(n))) hits.add(full); if (depth < 3) visit(full, depth + 1); }
    } };
  visit(ROOT, 0);
  const rel = (f) => path.relative(ROOT, f) || '.';
  if (hits.size === 1) return [...hits][0];
  if (hits.size > 1) throw new Error(`More than one model in the working folder is named "${p}": ${[...hits].map(rel).join('; ')}. Give read_model the path of the one you mean.`);
  throw new Error(`No model named "${p}" in the working folder ${ROOT}. ${models.length ? 'Models there: ' + models.slice(0, 12).map(rel).join('; ') + (models.length > 12 ? '; and ' + (models.length - 12) + ' more' : '') + '. Give read_model one of these paths, or "." for the working folder itself.' : 'Give read_model the path of a project folder, or "." for the working folder itself.'}`);
}
export function loadModel(p) {
  let full = inside(p);
  // not a path that exists, and written without a slash: a model's name
  if (!fs.existsSync(full) && !/[\\/]/.test(String(p))) full = byName(p);
  // a .pbip file is the project's shortcut, not a model: the model folder of its name beside it, else its folder
  else if (/\.pbip$/i.test(full) && fs.existsSync(full) && fs.statSync(full).isFile()) { const beside = full.replace(/\.pbip$/i, '.SemanticModel'); full = fs.existsSync(beside) ? beside : path.dirname(full); }
  const st = fs.statSync(full);
  if (st.isFile()) {
    // a file above the limit is refused before it is read into memory (a .pbit 300 MB; a model.bim given as a file 64 MB)
    const isZip = (() => { try { const fd = fs.openSync(full, 'r'), b = Buffer.alloc(2); fs.readSync(fd, b, 0, 2, 0); fs.closeSync(fd); return b[0] === 0x50 && b[1] === 0x4b; } catch (e) { return false; } })();
    const cap = isZip ? PBIT_LIMITS.file : PBIT_LIMITS.model;
    if (st.size > cap) throw refuse(`it is ${mb(st.size)}, above the ${mb(cap)} DataArcus reads${isZip ? '' : ' for a model file'}`);
    const buf = fs.readFileSync(full);
    if (buf[0] === 0x50 && buf[1] === 0x4b) {
      const z = unzipNeeded(buf), dms = z.DataModelSchema || Object.entries(z).find(([n]) => /(^|\/)model\.bim$/i.test(n))?.[1];
      if (!dms) throw new Error('No model in this file. Use a .pbit (File > Export > Power BI template), a model.bim, or a project folder.');
      // the report: the legacy Report/Layout file, or PBIR files (same choice as the website's worker)
      const tmsl = partJson(dms, 'model part'), layout = z['Report/Layout'];
      const pbir = Object.keys(z).filter((n) => /(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i.test(n) && !/StaticResources|CustomVisuals/i.test(n));
      const report = layout ? { format: 'legacy', files: [{ path: 'Report/Layout', json: partJson(layout, 'report part') }] }
        : pbir.length ? { format: 'pbir', files: pbir.map((n) => { try { return { path: n, json: partJson(z[n], 'report part') }; } catch (e) { return null; } }).filter(Boolean) } : null;
      return { source: path.basename(full), folder: null, tmsl, tables: Bind.fromTmsl(tmsl), report };
    }
    const tmsl = partJson(buf, 'model file');
    return { source: path.basename(full), folder: null, tmsl, tables: Bind.fromTmsl(tmsl), report: null };
  }
  // a folder: the model folder nearest to the top wins (a backup copy deeper down never does)
  const links = [];
  const dirs = [full, ...walk(full, 0, links).filter((f) => fs.statSync(f).isDirectory())].filter((d) => /\.(SemanticModel|Dataset)$/i.test(d));
  if (!dirs.length) {
    // a model folder that is a link is not followed: say so when it leads outside the working folder
    const linked = links.find((l) => /\.(SemanticModel|Dataset)$/i.test(l));
    if (linked) real(linked);
    if (path.resolve(full) === ROOT && !fs.readdirSync(ROOT).length) throw new Notice('empty', `Your working folder ${ROOT} is empty: put a Power BI project (a .pbip file with its folders, saved from Power BI Desktop) in it.`);
    throw new Error(`No .SemanticModel folder in ${p}. Point at a Power BI project folder saved from Desktop.`);
  }
  dirs.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
  const folder = dirs[0], bim = path.join(folder, 'model.bim');
  if (isLink(bim)) real(bim);
  let tmsl = null, tables;
  if (fs.existsSync(bim)) { tmsl = partJson(readCapped(bim, PBIT_LIMITS.model, 'model.bim'), 'model.bim'); tables = Bind.fromTmsl(tmsl); }
  else {
    const tdir = path.join(folder, 'definition', 'tables');
    if (!fs.existsSync(tdir)) throw new Error(`No model.bim and no definition/tables in ${folder}`);
    if (isLink(path.join(folder, 'definition'))) real(path.join(folder, 'definition'));
    if (isLink(tdir)) real(tdir);
    // every TMDL file measured first, one by one and all together, before any is read
    const def = path.join(folder, 'definition'), tfiles = walk(def).filter((f) => /\.tmdl$/i.test(f));
    let total = 0;
    for (const f of tfiles) { const size = fs.lstatSync(f).size; if (size > PBIT_LIMITS.entry) throw refuse(`one of its TMDL files is ${mb(size)}, above the ${mb(PBIT_LIMITS.entry)} DataArcus reads`); total += size; }
    if (total > PBIT_LIMITS.total) throw refuse(`its TMDL files are ${mb(total)} together, above the ${mb(PBIT_LIMITS.total)} DataArcus reads`);
    const text = new Map(tfiles.map((f) => [f, decode(fs.readFileSync(f))]));
    tables = fs.readdirSync(tdir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink() && /\.tmdl$/i.test(e.name)).flatMap((e) => { const f = path.join(tdir, e.name); return Bind.parseTmdl(text.has(f) ? text.get(f) : decode(readCapped(f, PBIT_LIMITS.entry, 'TMDL file'))); });
    // the whole model (expressions, relationships, roles...) in model.bim form, for the health check
    // (lineage tags kept: the fix scripts write each object back with its own tag, so Desktop doesn't give it a new one)
    tmsl = Tmdl.fromFiles(tfiles.map((f) => ({ path: path.relative(folder, f).replace(/\\/g, '/'), text: text.get(f) })), { lineageTags: true });
  }
  tables = tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));
  // the project's own reports (PBIR), for the health check and for choosing a report name that is free
  // When the working folder is the model folder itself, the project folder is outside it: nothing there is read
  // (no reports, no names in use) and create_report refuses (projectDir null).
  const projectDir = within(ROOT, path.dirname(folder)) ? path.dirname(folder) : null;
  const beside = projectDir ? fs.readdirSync(projectDir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink()).map((e) => e.name) : [];
  const reports = beside.filter((n) => /\.Report$/i.test(n));
  const pbir = reports.flatMap((r) => { const d = path.join(projectDir, r, 'definition'); return !isLink(d) && fs.existsSync(d) ? walk(d).filter((f) => f.endsWith('.json')) : []; });
  // (round 17, the outside review's G-05: each report file was capped, but not all of them together) every report JSON
  // file measured first, all together, before any is read, as the TMDL files above
  { let total = 0; for (const f of pbir) total += fs.lstatSync(f).size;
    if (total > PBIT_LIMITS.total) throw refuse(`the JSON files of its reports are ${mb(total)} together, above the ${mb(PBIT_LIMITS.total)} DataArcus reads`); }
  const report = pbir.length ? { format: 'pbir', files: pbir.map((f) => { try { return { path: f.replace(/\\/g, '/'), json: partJson(readCapped(f, PBIT_LIMITS.entry, 'report file'), 'report file') }; } catch (e) { return null; } }).filter(Boolean) } : null;
  // report names in use: an X.Report folder and its X.pbip count once
  const taken = [...new Set((projectDir ? fs.readdirSync(projectDir) : []).filter((n) => /\.(Report|pbip)$/i.test(n)).map((n) => n.replace(/\.(Report|pbip)$/i, '')))];
  return { source: path.relative(ROOT, folder) || folder, folder, projectDir, taken, tmsl, tables, report };
}

// Column types read from the model open in Power BI Desktop (INFO.COLUMNS() through Microsoft's Power BI Authoring MCP),
// for the columns a TMDL project leaves without one. Keys are Table[Column] ('Quoted Table'[Col]]x] as in DAX, any case);
// values are model.bim names or the Tabular DataType numbers INFO.COLUMNS returns (also as text). A type the files
// already give is never replaced. Returns what was used and what was not, so nothing is dropped silently.
const TYPE_NUMBERS = { 2: 'string', 6: 'int64', 8: 'double', 9: 'dateTime', 10: 'decimal', 11: 'boolean' };
const TYPE_NAMES = Object.fromEntries(Object.values(TYPE_NUMBERS).map((n) => [n.toLowerCase(), n]));
function typeName(v) {
  const s = String(v).trim();
  return /^\d+$/.test(s) ? TYPE_NUMBERS[s] : TYPE_NAMES[s.toLowerCase()];
}
function columnKey(k) {
  const m = String(k).trim().match(/^(?:'((?:[^']|'')+)'|([^'[\]]+?))\s*\[((?:[^\]]|\]\])+)\]$/);
  return m ? [(m[1] || m[2]).replace(/''/g, "'").trim(), m[3].replace(/]]/g, ']')] : null;
}
export function applyColumnTypes(tmsl, types) {
  const out = { applied: 0, alreadyTyped: [], notInModel: [], badType: [] };
  const tables = ((tmsl && (tmsl.model || tmsl)) || {}).tables || [];
  Object.entries(types || {}).forEach(([key, value]) => {
    const ref = columnKey(key), t = ref && tables.find((x) => String(x.name).toLowerCase() === ref[0].toLowerCase());
    const c = t && (t.columns || []).find((x) => x.type !== 'rowNumber' && String(x.name).toLowerCase() === ref[1].toLowerCase());
    if (!c) return out.notInModel.push(key);
    const type = typeName(value);
    if (!type) return out.badType.push({ column: key, type: value });
    if (c.dataType && c.dataType !== 'unknown') return out.alreadyTyped.push(key);
    c.dataType = type; out.applied++;
  });
  return out;
}

// Short, readable summary of a model for the agent
export function summary(m) {
  return m.tables.map((t) => ({
    table: t.name, hidden: !!t.hidden, dateTable: !!t.date,
    columns: t.columns.filter((c) => !c.isHidden).map((c) => `${c.name} (${c.dataType || 'string'})`),
    hiddenColumns: t.columns.filter((c) => c.isHidden).length,
    measures: t.measures.filter((x) => !x.isHidden).map((x) => x.name + (x.formatString ? ` [${x.formatString}]` : ''))
  }));
}
