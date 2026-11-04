// LAYER reading (0.2.9 item 10): what a PBIR report holds, read from its files and never changed. One reader for the
// tools that look at a report: read_report (the compact inventory Claude reads before a redesign), check_report's
// design lint, and plan_layout's lint of the planned page (a report the writer builds in memory, read the same way).
// The layers above take the inventory as it is: they never open a report file themselves.
// (0.3.2 SP42) this file is the one read boundary (IO, limits, containment, the sources); the semantic inventory is worked
// out in report-inventory.mjs from a source this file gives, and re-exported here.
// A report's text is untrusted input: titles and text boxes are given only when short and plain (long or
// instruction-like text is withheld, with its length), names have their invisible characters written as code points,
// and filter values, slicer selections and bookmark states are never read into an answer. No network, no data.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { decode, inside, readCapped, readsLikeInstruction, real, ROOT, shownName, shownPath, visible, WITHHELD } from './model.mjs';
import { answerOf } from './report-answer.mjs';
import { identityOf } from './report-identity.mjs';
import { inventory } from './report-inventory.mjs';
export { answerOf, READ_CAP } from './report-answer.mjs';
export { reportTheme, paintedColours } from './report-identity.mjs';
export { inventory, refOf, keyOf, filterText, typeName, isCustom, customNameOf, isDecor } from './report-inventory.mjs';

// ---- untrusted text (check_report's rules, one copy) ----
// (A1-13: the one screen is model.mjs's; INSTRUCTION keeps its name and its test() for the callers)
export const INSTRUCTION = { test: (s) => readsLikeInstruction(s) };
export { WITHHELD };
export const cleanName = (s) => { const v = visible(s); return v.length > 60 ? v.slice(0, 60) + '…' : v; };
export const safeName = (s) => shownName(s, 60);
// a title's or a text box's text: given when it is plain and at most 120 characters (cut at 60, as names are); a longer
// one is withheld with its length, as check_report's suspiciousNames counts it
export const LONG_TEXT = 120;
export const safeText = (s) => { const t = String(s == null ? '' : s); if (INSTRUCTION.test(t)) return WITHHELD; if (t.length > LONG_TEXT) return `(withheld: ${t.length} characters)`; return cleanName(t); };

// ---- the files (links are not followed; every file is measured before it is read; folders walked to a depth) ----
// The largest report files we have are about 7 KB (visual.json) and 22 KB (a theme); a report's SVG measures can reach
// 32,000 characters each in reportExtensions.json. 8 MB is hundreds of times those and still small to hold; a PBIR
// report is 6 levels deep at most (definition/pages/<page>/visuals/<visual>/visual.json), so 12 is twice that.
export const MB = 1024 * 1024;
// (A5-9, audit 5: a file count too, as check_report's walk and the twin have: 20,000)
export const REPORT_LIMITS = Object.freeze({ file: 8 * MB, depth: 12, files: 20000 });
export class TooBig extends Error { constructor(size) { super('too big'); this.size = size; } }
// (A5-12: one decoder, model.mjs's: UTF-8 with or without a byte order mark, and UTF-16)
const parse = (b) => JSON.parse(decode(b));
// (R6, the cross-review: readJson measured with lstat and read by name, with no file check, so a page.json or theme
// that is a link was followed outside the working folder. Now a link is refused (Linked), and the file is read through
// the reading block's one-descriptor reader, model.mjs's readCapped, within the cap.)
export class Linked extends Error { constructor() { super('a link: not followed'); } }
export const readJson = (f) => {
  const st = fs.lstatSync(f);
  if (st.isSymbolicLink()) throw new Linked();
  if (!st.isFile()) throw new Error('not a file');
  if (st.size > REPORT_LIMITS.file) throw new TooBig(st.size);
  return parse(readCapped(f, REPORT_LIMITS.file, 'report file'));
};
// a project file a copy must carry over changed (the native copy, the twin): read, or the write is refused (the outside
// review of rc.12, R-02: never copied as it is, nor replaced by a default, when it can't be read)
export const mustJson = (f, name) => { try { return readJson(f); } catch (e) { throw new Error(`Nothing was written: the original's ${name} could not be read (${e instanceof Linked ? 'it is a link' : 'not valid JSON, or too big'}). Open the original in Power BI Desktop and save it, then ask again.`); } };
export const isFile = (f) => { try { return fs.lstatSync(f).isFile(); } catch (e) { return false; } };
export const isDir = (f) => { try { return fs.lstatSync(f).isDirectory(); } catch (e) { return false; } };
// files left unread for their size, and folders past the depth, go to sk = { big, deep } (one record per call)
export function walk(d, out, cap, depth, sk) {
  const level = depth || 0;
  if (level > REPORT_LIMITS.depth) { if (sk) sk.deep++; return out; }
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (out.length >= cap) return out;
    const f = path.join(d, e.name);
    // (A4-4, audit 4: a link is never followed, and counted, so check_report can say it and hold back its validator)
    if (e.isSymbolicLink()) { if (sk) (sk.links = sk.links || []).push(f); continue; }
    if (e.isDirectory()) walk(f, out, cap, level + 1, sk); else if (e.isFile()) out.push(f);
  }
  return out;
}

// ---- strict reading, for a tool that writes from what it reads (the Arabic twin) ----
// (0.3, B-152, an outside audit of 0.2.9: every file of the folder was hashed and copied, a stray .csv or .xlsx too) the
// report's own file types only, by their place in the folder (Microsoft's "Power BI Desktop project report folder"):
// definition.pbir, .platform, semanticModelDiagramLayout.json, mobileState.json, the definition folder's JSON, the
// StaticResources' images, themes and visual packages, a private custom visual's own files. Anything else is not the
// report's: never opened, hashed or copied (its name only is seen, and the plan names it). .pbi/localSettings.json is the
// user's own settings on this computer (Git leaves it out too).
const IMAGE = 'png|jpe?g|gif|svg|bmp|webp|ico|tiff?';
const REPORT_FILE = [/^(definition\.pbir|\.platform|semanticModelDiagramLayout\.json|mobileState\.json)$/i, /^definition\/.+\.json$/i,
  new RegExp(`^StaticResources/.+\\.(json|pbiviz|${IMAGE})$`, 'i'), new RegExp(`^CustomVisuals/[^/]+/.+\\.(json|js|css|pbiviz|${IMAGE})$`, 'i')];
export const isReportFile = (rel) => REPORT_FILE.some((re) => re.test(rel));
// what a plan says of the files left out (o.left of strictFiles): their count and names (shown, at most 20)
export const notCopiedOf = (left) => (left && left.length ? { notCopied: { count: left.length, files: left.slice(0, 20).map(shownPath), note: 'not the report\'s own files (only their names were seen): not read, not copied, not part of the plan' } } : {});
// Every file of the report listed; a link, a folder past the depth, more than `files` files or a file over the cap stops
// the read with the reason (tail: the caller's own words, "Nothing was written."). Read files through readBytes/readText.
// o.left: an array that gets the files that are not the report's (B-152), by their paths in the folder
export function strictFiles(dir, opts) {
  const o = opts || {}, tail = o.tail || '', max = o.files || 20000, out = [], left = o.left || [];
  const go = (d, depth) => {
    if (depth > REPORT_LIMITS.depth) throw new Error(`The report has folders deeper than ${REPORT_LIMITS.depth} levels (a PBIR report is 6 levels deep): not read.${tail}`);
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isSymbolicLink()) throw new Error(`The report holds a link (a symbolic link or a junction) at "${shownPath(path.relative(dir, f))}": DataArcus never follows links.${tail}`);
      if (e.isDirectory()) go(f, depth + 1);
      else if (e.isFile()) {
        if (out.length + left.length >= max) throw new Error(`The report has more than ${max} files: not read.${tail}`);
        const r = path.relative(dir, f).split(path.sep).join('/');
        if (!isReportFile(r)) { left.push(r); continue; }
        const size = fs.lstatSync(f).size;
        if (size > REPORT_LIMITS.file) throw new Error(`A report file is ${Math.round(size / MB)} MB, above the ${REPORT_LIMITS.file / MB} MB DataArcus reads (the largest report files are well under 1 MB).${tail}`);
        out.push(r);
      }
    }
  };
  go(dir, 0);
  left.sort();
  return out.sort();
}
// a file's bytes and text through the one-descriptor reader (links refused, within the cap)
export const readBytes = (f) => readCapped(f, REPORT_LIMITS.file, 'report file');
export const readText = (f) => { const b = readBytes(f); return (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3) : b).toString('utf8'); };

// the report folder of a path: a .pbip file (its .Report beside it), a .Report folder, or a folder holding definition/
// or exactly one .Report folder
// tool: the caller's name, for its own messages (R9: the reading block names no tool of its own)
// A report's contents in one sha256 (the follow-up review of rc.15, B-02): every file of its .Report folder (its own files:
// B-152), by its path
// and its bytes, read the reading block's way (no links, capped), plus its .pbip. A plan that writes from a report
// (the native copy, the Arabic twin) pins this; the write computes it again and refuses a report changed since the go.
// A report that can't be read gives 'unreadable' (the write's own reading then says why).
export function reportPrint(p) {
  try {
    const loc = locate(p, 'this tool'), h = crypto.createHash('sha256'), dir = loc.reportDir;
    for (const rel of strictFiles(dir, { files: 20000 }).slice().sort()) h.update(rel + '\0').update(crypto.createHash('sha256').update(readBytes(path.join(dir, ...rel.split('/')))).digest('hex') + '\n');
    const full = inside(p); if (isFile(full) && /\.pbip$/i.test(full)) h.update('pbip\0').update(readBytes(full));
    return h.digest('hex');
  } catch (e) { return 'unreadable'; }
}

// (0.3.0 T1, the simulated beta testers' T-2: ""Twin Sales.pbip" is not a report" when it sat in Sales/; the agent then
// asked the person for a path they did not know) the reports of the working folder near a path that misses: names only
// (folders and .pbip files, never a file's contents), inside DATAARCUS_ROOT, links not followed, 4 levels deep and
// 4,000 entries at most. Returns { hits (named like the path), all } as paths relative to the working folder, screened.
export const NEAR = { depth: 4, entries: 4000, shown: 8 };
export function reportsNear(p) {
  if (!ROOT) return { hits: [], all: [] };
  const strip = (n) => String(n).replace(/\.(pbip|Report)$/i, '').trim().toLowerCase(), want = strip(path.basename(String(p).replace(/[\\/]+$/, '')));
  const found = []; let seen = 0;
  const visit = (dir, depth) => {
    let list; try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of list) {
      if (++seen > NEAR.entries) return;
      if (e.isSymbolicLink() || e.name === 'node_modules' || e.name === '.git') continue;
      const full = path.join(dir, e.name);
      if (!e.isDirectory()) { if (/\.pbip$/i.test(e.name)) found.push(full); continue; }
      // a .Report folder counts when no .pbip of its name stands beside it (that one is named instead)
      if (/\.Report$/i.test(e.name)) { if (!list.some((x) => !x.isDirectory() && /\.pbip$/i.test(x.name) && strip(x.name) === strip(e.name))) found.push(full); continue; }
      if (!/\.(SemanticModel|Dataset)$/i.test(e.name) && depth < NEAR.depth) visit(full, depth + 1);
    }
  };
  visit(ROOT, 0);
  const rel = (f) => shownPath(path.relative(ROOT, f).split(path.sep).join('/'));
  return { hits: found.filter((f) => strip(path.basename(f)) === want).map(rel), all: found.map(rel) };
}
// the message for a path that is not a report: where the report of that name is, so the agent retries alone
function missSaid(p, why) {
  const n = reportsNear(p), q = (x) => `"${x}"`, list = (xs) => xs.slice(0, NEAR.shown).map(q).join('; ') + (xs.length > NEAR.shown ? `; and ${xs.length - NEAR.shown} more` : '');
  const name = shownPath(path.basename(String(p).replace(/[\\/]+$/, '')).replace(/\.(pbip|Report)$/i, ''));
  if (n.hits.length === 1) return `"${p}" is not a report at that path. Did you mean ${q(n.hits[0])}? Call the tool again with that path (paths are relative to the working folder).`;
  if (n.hits.length) return `"${p}" is not a report at that path. Reports named "${name}" in the working folder: ${list(n.hits)}. Call the tool again with one of these paths.`;
  if (n.all.length) return `No report named "${name}" at "${p}" or elsewhere in the working folder. Reports there: ${list(n.all)}. Call the tool again with one of these paths.`;
  return why + ' No report was found in the working folder either.';
}

export function locate(p, tool) {
  const who = tool || 'this tool';
  const full = inside(p);
  let dir = null;
  if (isFile(full) && /\.pbip$/i.test(full)) {
    let target = full.replace(/\.pbip$/i, '.Report');
    try { const a = readJson(full); const r = ((a.artifacts || []).find((x) => x && x.report) || {}).report; if (r && r.path) target = path.resolve(path.dirname(full), String(r.path)); } catch (e) { /* the default name */ }
    dir = target;
  } else if (isDir(full)) {
    if (isDir(path.join(full, 'definition')) || isFile(path.join(full, 'report.json')) || /\.Report$/i.test(full)) dir = full;
    else { const reps = fs.readdirSync(full).filter((n) => /\.Report$/i.test(n) && isDir(path.join(full, n))); if (reps.length === 1) dir = path.join(full, reps[0]); else throw new Error(reps.length ? `"${p}" holds ${reps.length} reports: name one of them (the .pbip file or the .Report folder).` : missSaid(p, `"${p}" holds no report: give a .pbip file, a .Report folder, or a folder holding definition/.`)); }
  } else throw new Error(missSaid(p, `"${p}" is not a report: give a .pbip file, a .Report folder, or a folder holding definition/.`));
  real(dir, p);
  if (!isDir(dir)) throw new Error(`The report folder of "${p}" is not there.`);
  const def = path.join(dir, 'definition');
  if (!isDir(def)) {
    if (isFile(path.join(dir, 'report.json'))) throw new Error(`This report is in the older PBIR-Legacy format (a single report.json), which ${who} does not read. Save it once in Power BI Desktop: Power BI converts a PBIR-Legacy report to PBIR when it is edited and saved. Then check it again. Nothing was read beyond that file's name.`);
    throw new Error(`"${p}" has no definition folder: it is not a PBIR report.`);
  }
  return { reportDir: dir, defDir: def, pbipPath: isFile(full) ? full : null };
}

// ---- where the files come from: the disk (a located report) or memory (the writer's files, for a planned page) ----
// A source answers by paths relative to the report folder ('definition/pages/<id>/page.json'):
// dirs(rel) the folder names inside, files(rel) the file names inside, json(rel) the parsed file (TooBig past the limit)
export function diskSource(loc, sk) {
  // (AF1, the release audit's F05: readJson refuses a link at the file only, so a theme was read through a linked
  // StaticResources or RegisteredResources folder from outside the working folder) every file and folder this source
  // opens sits, by its real path, inside the report folder: each folder on the way from the report folder is looked at
  // (lstat: a link or a junction is refused as a linked file is, Linked), and the deepest one's real path must be inside
  // the report folder's real path. A part that is not there is not read either way.
  let top = null;
  const at = (rel) => {
    const parts = String(rel).split('/').filter(Boolean);
    let cur = loc.reportDir;
    for (const p of parts.slice(0, -1)) {
      cur = path.join(cur, p);
      let st; try { st = fs.lstatSync(cur); } catch (e) { return path.join(loc.reportDir, ...parts); }
      if (st.isSymbolicLink()) throw new Linked();
    }
    top = top || fs.realpathSync.native(loc.reportDir);
    const r = path.relative(top, fs.realpathSync.native(cur));
    if (r.startsWith('..') || path.isAbsolute(r)) throw new Linked();
    return path.join(loc.reportDir, ...parts);
  };
  const linked = (r) => { if (sk && !(sk.links = sk.links || []).includes(r)) sk.links.push(r); };
  // (A5-8, audit 5: a linked file or folder is left out and counted, never skipped silently)
  // (a folder is checked as the folder of a name inside it: the folder itself and every folder on the way)
  const list = (rel, want) => { let d; try { d = path.dirname(at((rel ? rel + '/' : '') + 'x')); } catch (e) { if (e instanceof Linked) { linked(rel); return []; } throw e; } if (!isDir(d)) return []; return fs.readdirSync(d, { withFileTypes: true }).filter((e) => { if (e.isSymbolicLink()) { linked((rel ? rel + '/' : '') + e.name); return false; } return want === 'dir' ? e.isDirectory() : e.isFile(); }).map((e) => e.name); };
  return { dirs: (rel) => list(rel, 'dir'), files: (rel) => list(rel, 'file'), has: (rel) => { try { fs.lstatSync(at(rel)); return true; } catch (e) { return false; } }, json: (rel) => readJson(at(rel)), sk };
}
// files: the report writer's [{ path: '<Name>.Report/definition/...', data }]; only the .Report folder's files are read
// files: [{ path (relative to the report folder: 'definition/...'), data }]; the caller strips its own prefix (A5-12)
export function memorySource(files) {
  const map = new Map();
  (files || []).forEach((f) => map.set(String(f.path), f.data));
  const under = (rel) => { const pre = rel ? String(rel).replace(/\/$/, '') + '/' : ''; return [...map.keys()].filter((k) => k.startsWith(pre)).map((k) => k.slice(pre.length)); };
  return {
    dirs: (rel) => [...new Set(under(rel).filter((k) => k.includes('/')).map((k) => k.split('/')[0]))],
    files: (rel) => under(rel).filter((k) => !k.includes('/')),
    has: (rel) => map.has(rel),
    json: (rel) => { const d = map.get(rel); if (d == null) throw new Error('missing'); const b = typeof d === 'string' ? Buffer.from(d, 'utf8') : Buffer.from(d); if (b.length > REPORT_LIMITS.file) throw new TooBig(b.length); return parse(b); },
    sk: { big: [], deep: 0 }
  };
}


// ---- Microsoft's catalog of Power BI's own visuals (A5-7, audit 5): each role's name in Desktop and its kind ----
// (loaded once, at the module's start; without it the roles are listed by their keys alone, as before)
let VS = null;
try { VS = await import('@microsoft/powerbi-core-visual-schema'); } catch (e) { VS = null; }
// (0.3.1 X2) a visual kind that Power BI can keep in sync across pages (View > Sync slicers), as Microsoft's catalog
// says it (supportsSynchronizingFilterState): the slicer, the button slicer, the list slicer, the text slicer
export const canSync = (type) => { try { const c = VS && VS.getCapabilities(String(type)); return !!(c && c.supportsSynchronizingFilterState === true); } catch (e) { return false; } };
const ROLE_CACHE = new Map();
export const rolesOf = (type) => {
  if (!ROLE_CACHE.has(type)) { let roles = {}; try { roles = Object.fromEntries(((VS && VS.getCapabilities(String(type))) || { dataRoles: [] }).dataRoles.map((d) => [d.name, { name: String(d.displayName || d.name), kind: String(d.kind || '') }])); } catch (e) { roles = {}; } ROLE_CACHE.set(type, roles); }
  return ROLE_CACHE.get(type);
};
// a role as the answers write it: its key screened (a custom visual's keys are free text: A5-1), then Desktop's name and
// "measure" when the catalog knows them ("Category (Y-axis)", "Y (X-axis, measure)")
export const roleLabel = (type, role) => { const k = safeName(role), d = rolesOf(type)[role], kind = d && d.kind === 'Measure' ? 'measure' : '';
  if (!d) return k; const parts = [d.name !== role ? d.name : '', kind].filter(Boolean); return parts.length ? `${k} (${parts.join(', ')})` : k; };

// ---- the semantic inventory: lib/report-inventory.mjs (SP42), from a source this file gives (diskSource, memorySource) ----

// ---- an existing report's identity (0.2.9, KEEP THE DASHBOARD'S IDENTITY): lib/report-identity.mjs (SP21) ----
// read here, through this file's one read boundary; the colours and styles are worked out there, from the inventory
// a report's identity: { name (the theme's, or null), themeColours, painted (data colours written on it, by how often,
// neither the base's nor the theme's), text, ...reportTheme's other colours and styles } | null when it has none
export function reportIdentity(src, reportName) { return identityOf(inventory(src, reportName)); }
// Which report: one of the model's own reports (those the model loader counted: their definition.pbir points at this
// model folder, inside the working folder; another model's report, or one outside, is never read), never one DataArcus
// wrote itself (its report.json's generatedBy). Several: the one a .pbip opens, then the one named as the model, then by
// name; the others are named, and want (themeFrom: a report's name) picks one. Returns { report (its name, screened),
// theme (reportIdentity's identity, or null: nothing of its own), others: [names] } | null.
export function existingTheme(m, want) {
  if (!m || !m.projectDir || !m.folder || !m.report || !Array.isArray(m.report.files)) return null;
  const root = path.resolve(m.projectDir), model = path.basename(m.folder).replace(/\.SemanticModel$/i, '');
  const dirs = [...new Set(m.report.files.map((f) => path.relative(root, path.resolve(String(f.path))).split(path.sep)[0]).filter((n) => /\.Report$/i.test(n) && !n.startsWith('..')))];
  const base = (n) => n.replace(/\.Report$/i, '');
  const opened = (n) => { const f = path.join(root, base(n) + '.pbip'); try { if (!isFile(f)) return false; const a = readJson(f); const r = ((Array.isArray(a.artifacts) ? a.artifacts : []).find((x) => x && x.report) || {}).report; return path.resolve(root, String((r && r.path) || n)) === path.join(root, n); } catch (e) { return false; } };
  const read = (n) => { try { const dir = path.join(root, n); return reportIdentity(diskSource({ reportDir: dir, defDir: path.join(dir, 'definition') }, { big: [], deep: 0 }), base(n)); } catch (e) { return { ours: false, identity: null }; } };
  const all = dirs.map((n) => Object.assign({ n }, read(n))), human = all.filter((x) => !x.ours);
  const rank = (x) => (opened(x.n) ? 0 : 2) + (base(x.n) === model ? 0 : 1);
  const asked = want != null && String(want).trim() ? all.find((x) => base(x.n).toLowerCase() === String(want).trim().replace(/\.Report$/i, '').toLowerCase()) : null;
  const pick = asked || human.slice().sort((a, b) => rank(a) - rank(b) || (a.n < b.n ? -1 : a.n > b.n ? 1 : 0))[0];
  if (!pick) return null;
  return { report: safeName(base(pick.n)), theme: pick.identity, others: human.filter((x) => x !== pick).map((x) => safeName(base(x.n))) };
}

// ---- read_report's answer: lib/report-answer.mjs (SP21), from the inventory read here ----

// the tool: a path inside the working folder (.pbip, .Report folder, or a folder holding definition/)
export function readReport(p, opts) {
  const loc = locate(p, 'read_report');
  return answerOf(inventory(diskSource(loc, { big: [], deep: 0 }), path.basename(loc.reportDir), { pages: opts && opts.pages }), opts);
}
