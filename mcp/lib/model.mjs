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

// minimal zip reader (stored and deflate entries), enough for .pbit files
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('Not a zip file');
  const out = {}; let p = buf.readUInt32LE(eocd + 16);
  for (let n = buf.readUInt16LE(eocd + 10); n > 0 && buf.readUInt32LE(p) === 0x02014b50; n--) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), xlen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen), lho = buf.readUInt32LE(p + 42);
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28), raw = buf.subarray(start, start + size);
    out[name] = method === 8 ? zlib.inflateRawSync(raw) : raw;
    p += 46 + nlen + xlen + clen;
  }
  return out;
}

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
export function loadModel(p) {
  const full = inside(p), st = fs.statSync(full);
  if (st.isFile()) {
    const buf = fs.readFileSync(full);
    if (buf[0] === 0x50 && buf[1] === 0x4b) {
      const z = unzip(buf), dms = z.DataModelSchema || Object.entries(z).find(([n]) => /(^|\/)model\.bim$/i.test(n))?.[1];
      if (!dms) throw new Error('No model in this file. Use a .pbit (File > Export > Power BI template), a model.bim, or a project folder.');
      // the report: the legacy Report/Layout file, or PBIR files (same choice as the website's worker)
      const tmsl = json(dms), layout = z['Report/Layout'];
      const pbir = Object.keys(z).filter((n) => /(^|\/)definition\/(report\.json|reportExtensions\.json|pages\/.*\.json|bookmarks\/.*\.json)$/i.test(n) && !/StaticResources|CustomVisuals/i.test(n));
      const report = layout ? { format: 'legacy', files: [{ path: 'Report/Layout', json: json(layout) }] }
        : pbir.length ? { format: 'pbir', files: pbir.map((n) => { try { return { path: n, json: json(z[n]) }; } catch (e) { return null; } }).filter(Boolean) } : null;
      return { source: path.basename(full), folder: null, tmsl, tables: Bind.fromTmsl(tmsl), report };
    }
    const tmsl = json(buf);
    return { source: path.basename(full), folder: null, tmsl, tables: Bind.fromTmsl(tmsl), report: null };
  }
  // a folder: the model folder nearest to the top wins (a backup copy deeper down never does)
  const links = [];
  const dirs = [full, ...walk(full, 0, links).filter((f) => fs.statSync(f).isDirectory())].filter((d) => /\.(SemanticModel|Dataset)$/i.test(d));
  if (!dirs.length) {
    // a model folder that is a link is not followed: say so when it leads outside the working folder
    const linked = links.find((l) => /\.(SemanticModel|Dataset)$/i.test(l));
    if (linked) real(linked);
    if (full === ROOT && !fs.readdirSync(ROOT).length) throw new Error(`Your working folder ${ROOT} is empty: put a Power BI project (a .pbip file with its folders, saved from Power BI Desktop) in it.`);
    throw new Error(`No .SemanticModel folder in ${p}. Point at a Power BI project folder saved from Desktop.`);
  }
  dirs.sort((a, b) => a.split(path.sep).length - b.split(path.sep).length);
  const folder = dirs[0], bim = path.join(folder, 'model.bim');
  if (isLink(bim)) real(bim);
  let tmsl = null, tables;
  if (fs.existsSync(bim)) { tmsl = json(fs.readFileSync(bim)); tables = Bind.fromTmsl(tmsl); }
  else {
    const tdir = path.join(folder, 'definition', 'tables');
    if (!fs.existsSync(tdir)) throw new Error(`No model.bim and no definition/tables in ${folder}`);
    if (isLink(path.join(folder, 'definition'))) real(path.join(folder, 'definition'));
    if (isLink(tdir)) real(tdir);
    tables = fs.readdirSync(tdir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink() && /\.tmdl$/i.test(e.name)).flatMap((e) => Bind.parseTmdl(decode(fs.readFileSync(path.join(tdir, e.name)))));
    // the whole model (expressions, relationships, roles...) in model.bim form, for the health check
    const def = path.join(folder, 'definition');
    // (lineage tags kept: the fix scripts write each object back with its own tag, so Desktop doesn't give it a new one)
    tmsl = Tmdl.fromFiles(walk(def).filter((f) => /\.tmdl$/i.test(f)).map((f) => ({ path: path.relative(folder, f).replace(/\\/g, '/'), text: decode(fs.readFileSync(f)) })), { lineageTags: true });
  }
  tables = tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));
  // the project's own reports (PBIR), for the health check and for choosing a report name that is free
  // When the working folder is the model folder itself, the project folder is outside it: nothing there is read
  // (no reports, no names in use) and create_report refuses (projectDir null).
  const projectDir = within(ROOT, path.dirname(folder)) ? path.dirname(folder) : null;
  const beside = projectDir ? fs.readdirSync(projectDir, { withFileTypes: true }).filter((e) => !e.isSymbolicLink()).map((e) => e.name) : [];
  const reports = beside.filter((n) => /\.Report$/i.test(n));
  const pbir = reports.flatMap((r) => { const d = path.join(projectDir, r, 'definition'); return !isLink(d) && fs.existsSync(d) ? walk(d).filter((f) => f.endsWith('.json')) : []; });
  const report = pbir.length ? { format: 'pbir', files: pbir.map((f) => { try { return { path: f.replace(/\\/g, '/'), json: json(fs.readFileSync(f)) }; } catch (e) { return null; } }).filter(Boolean) } : null;
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
