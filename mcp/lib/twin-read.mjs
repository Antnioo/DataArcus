// The Arabic twin, step 1: reading the original report strictly through the reading block (its folder, its files, in
// memory for the EN-AR copy of a report not yet written), and the small helpers every step uses.
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import path from 'node:path';
import { ROOT } from './model.mjs';
import { REPORT_LIMITS, safeName, locate as readerLocate, isFile, readBytes, readJson, strictFiles, inventory, memorySource, diskSource } from './read-report.mjs';

// the limits check_report reads a report within (the reading block's: 8 MB a file, 12 levels), and a count
export const MB = 1024 * 1024, LIMITS = { file: REPORT_LIMITS.file, depth: REPORT_LIMITS.depth, files: 20000 }, TEXT_CAP = 200, TEXTS_MAX = 400;
export const relRoot = (f) => path.relative(ROOT, f).split(path.sep).join('/');
// a path for an answer: each folder or file name screened as the reading block screens names (instruction-like
// withheld, hidden characters as code points, 60 characters at most): the fuzz test's F-TP (a model path from
// definition.pbir with planted text, isolates, 200,000 characters went raw into the plan)
export const pathOut = (f) => relRoot(f).split('/').map((seg) => (seg === '..' || seg === '.' ? seg : safeName(seg))).join('/');
export const json = (o) => JSON.stringify(o, null, 2) + '\n';

// ---- the original: the reading block's locate (a .pbip, a .Report folder, a folder holding exactly one), named ----
export function locate(p) {
  const loc = readerLocate(p, 'create_arabic_twin'), dir = loc.reportDir;
  if (!/\.Report$/i.test(dir)) throw new Error(`"${p}" is a folder holding a definition folder, not a .Report folder: give the report's .pbip file or its .Report folder, so the twin can be named after it. Nothing was written.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  if (/\sAR$/i.test(base)) throw new Error(`"${path.basename(dir)}" is already an Arabic twin (its name ends in " AR"): make the twin of the original report instead. Nothing was written.`);
  if (/\s\(EN-AR\)$/i.test(base)) throw new Error(`"${path.basename(dir)}" already holds English and Arabic pages (its name ends in " (EN-AR)"): make it from the original report instead. Nothing was written.`);
  let pbip = loc.pbipPath;
  if (!pbip) { const beside = path.join(path.dirname(dir), base + '.pbip'); if (isFile(beside)) pbip = beside; }
  return { dir, base, pbip, project: path.dirname(dir) };
}

// (0.3.1 X2) the original in memory: the English report create_report's plan builds (its files as the writer gives
// them, '<base>.Report/...'), read by the same reader through the reading block's memorySource; nothing on disk
export function memoryLoc(mem) {
  const pre = String(mem.base) + '.Report/', map = new Map();
  (mem.files || []).forEach((f) => { if (String(f.path).startsWith(pre)) map.set(String(f.path).slice(pre.length), f.data); });
  return { dir: path.join(mem.projectDir, String(mem.base) + '.Report'), base: String(mem.base), pbip: null, project: mem.projectDir, mem: map };
}
// a file of the original by its path in the report folder: its bytes, or its JSON (on disk: the reading block's reader)
export const bytesAt = (loc, rel) => { if (!loc.mem) return readBytes(path.join(loc.dir, ...rel.split('/'))); const d = loc.mem.get(rel); if (d == null) throw new Error('missing'); return typeof d === 'string' ? Buffer.from(d, 'utf8') : Buffer.from(d); };
export const jsonAt = (loc, rel) => (loc.mem ? JSON.parse(bytesAt(loc, rel).toString('utf8')) : readJson(path.join(loc.dir, ...rel.split('/'))));

// ---- the report read, strictly, through the reading block (R1, the cross-review: the twin had its own locate, walker,
// reader and limits): every file listed by strictFiles (a link, a folder too deep, too many files or a file over 8 MB
// stops it, nothing written); pages in order, their visuals (in file order) and bookmarks from inventory() ----
export function readOriginal(loc) {
  const left = [], files = loc.mem ? [...loc.mem.keys()].sort() : strictFiles(loc.dir, { files: LIMITS.files, tail: ' Nothing was written.', left });
  const inv = inventory(loc.mem ? memorySource([...loc.mem].map(([p, data]) => ({ path: p, data }))) : diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  const unreadable = inv.unreadableFiles.slice();
  // (the fuzz test's F-T4 and its crash in modelOf: any file can hold any JSON; what is not the shape expected is left
  // out here and copied as it is)
  let pbir = {}; try { const j = jsonAt(loc, 'definition.pbir'); pbir = isObj(j) ? j : {}; } catch (e) { if (files.includes('definition.pbir')) unreadable.push('definition.pbir'); }
  const pages = inv.pages.filter((pg) => files.includes(pg.file)).map((pg) => ({ id: pg.id, rel: pg.file, page: pg.raw,
    visuals: pg.visuals.filter((x) => x.json && x.json.name != null && x.file.split('/').length === 6).sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0)).map((x) => ({ rel: x.file, json: x.json, mobile: mobileOf(loc, files, x.file) })) }));
  const bookmarks = inv.bookmarks.filter((b) => isObj(b.raw) && (typeof b.raw.name === 'string' || typeof b.raw.name === 'number')).map((b) => ({ rel: b.file, json: b.raw }));
  // (rc.24) the report's own measures (definition/reportExtensions.json), for the title measures; and the theme's text
  // sizes, for what the Arabic texts need
  let ext = null; if (files.includes(EXT)) { try { const j = jsonAt(loc, EXT); ext = isObj(j) && Array.isArray(j.entities) ? j : null; } catch (e) { ext = null; } }
  return { files, left, pages, bookmarks, pbir, unreadable, ext, theme: isObj(inv.themeJson) ? inv.themeJson : null, phone: files.some((f) => /\/mobile\.json$/.test(f)), hasPlatform: files.includes('.platform') };
}

export const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
// (0.3.0 D3: the twin copied the phone layout as it was) a visual's mobile.json beside its visual.json: { rel, json }, or
// null (none, or not a JSON object: then it is copied as it is)
function mobileOf(loc, files, rel) {
  const m = rel.replace(/visual\.json$/, 'mobile.json'); if (m === rel || !files.includes(m)) return null;
  try { const j = jsonAt(loc, m); return isObj(j) ? { rel: m, json: j } : null; } catch (e) { return null; }
}
export const EXT = 'definition/reportExtensions.json';
// definition.pbir's model folder, when it names one: { path } or null
export const byPathOf = (pbir) => { const d = isObj(pbir) && isObj(pbir.datasetReference) ? pbir.datasetReference : null, b = d && isObj(d.byPath) ? d.byPath : null; return b && typeof b.path === 'string' && b.path ? b : null; };
export const pageOf = (pg) => (isObj(pg.page) ? pg.page : {});
// a page's size as numbers, never the file's own text (P3, P4 of the fuzz test: a width holding text went raw into the plan)
export const sizeOf = (pg) => { const w = pageOf(pg).width, h = pageOf(pg).height; return Number.isFinite(w) && Number.isFinite(h) ? `${w} x ${h}` : 'not a number in page.json'; };
