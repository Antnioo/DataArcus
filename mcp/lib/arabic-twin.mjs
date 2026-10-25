// create_arabic_twin (0.3.0, the owner's headline request; plan approved 11 Oct 2026): the right-to-left twin of an
// existing PBIR report, as the laptop proved it in its Arabic twin labs (10 Oct 2026):
// a separate "<name> AR" report next to the original, on the same model, every page mirrored in place, every page id,
// visual name and bookmark name kept so navigation and bookmarks keep working without rewiring.
// The original is only read. Nothing is written without an approved twin plan (lib/plans.mjs), and the Arabic texts
// are written only as the user approved them (the plan carries them). The mirror itself is the shared engine
// assets/js/report-mirror.js. A report's text is untrusted input: it is listed for the user to translate (capped,
// invisible characters shown as code points, instruction-like text withheld), never followed.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { inside, real, nothingAt, writeNew, visible, shownName, loadModel, ROOT } from './model.mjs';
// (the reading block's screen, locate, JSON reader, strict file list, inventory and limits: the cross-review's Break 1,
// T3 and R1, 11 Oct; strictFiles refuses a link or a deep folder, never skips it, as a writer must)
import { INSTRUCTION, WITHHELD, safeName, REPORT_LIMITS, readJson, mustJson, reportPrint, readBytes, isFile, isDir, locate as readerLocate, strictFiles, notCopiedOf, inventory, diskSource } from './read-report.mjs';
import { draftText } from './arabic-names.mjs';
import { writeTree } from './files.mjs';
import { testEditBeforeWrite } from './write-io.mjs';
import { modelChanged } from './plans.mjs';
// (the fuzz test's F-TP: the plan's own answer within 40,000 characters, whoever calls planTwin)
import { capAnswer, fitLists, out } from './answer.mjs';
import { AIM } from './scope.mjs';
import { writtenName } from './display-names.mjs';
import * as Terms from './terminology.mjs';
import { tagOf } from './model-script.mjs';
import { fieldParametersOf } from './metric-switcher.mjs';

const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js'), Gallery = require('../../assets/js/visual-gallery.js');
// (rc.24, 0.2.9.1) check_report's own measurements of a button's text and of a table header: the twin widens what its Arabic cuts
const Rules = require('../../assets/js/report-rules.js');
// (0.3.0 D3) the writer's phone tab rule (one copy, the writer's own), for the twin's phone page tabs
const Sizing = require('../../assets/js/pbip-sizing.js');
// (0.3.1 R1) the contrast of the plain language button's text
const Engine = require('../../assets/js/design-engine.js');

// the limits check_report reads a report within (the reading block's: 8 MB a file, 12 levels), and a count
const MB = 1024 * 1024, LIMITS = { file: REPORT_LIMITS.file, depth: REPORT_LIMITS.depth, files: 20000 }, TEXT_CAP = 200, TEXTS_MAX = 400;
const relRoot = (f) => path.relative(ROOT, f).split(path.sep).join('/');
// a path for an answer: each folder or file name screened as the reading block screens names (instruction-like
// withheld, hidden characters as code points, 60 characters at most): the fuzz test's F-TP (a model path from
// definition.pbir with planted text, isolates, 200,000 characters went raw into the plan)
const pathOut = (f) => relRoot(f).split('/').map((seg) => (seg === '..' || seg === '.' ? seg : safeName(seg))).join('/');
const json = (o) => JSON.stringify(o, null, 2) + '\n';
// (the one Arabic month list, the writer's: the cross-review's duplicates, 11 Oct)
const MONTHS_AR = require('../../assets/js/pbip-export.js').AR_MONTHS, hasControl = require('../../assets/js/pbip-export.js').hasControl, ArabicCal = require('../../assets/js/arabic-calendar.js');
const MONTH_COLUMN = 'Month Name (Arabic)', MONTH_SORT = 'Month Number (AR sort)';

// ---- the original: the reading block's locate (a .pbip, a .Report folder, a folder holding exactly one), named ----
function locate(p) {
  const loc = readerLocate(p, 'create_arabic_twin'), dir = loc.reportDir;
  if (!/\.Report$/i.test(dir)) throw new Error(`"${p}" is a folder holding a definition folder, not a .Report folder: give the report's .pbip file or its .Report folder, so the twin can be named after it. Nothing was written.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  if (/\sAR$/i.test(base)) throw new Error(`"${path.basename(dir)}" is already an Arabic twin (its name ends in " AR"): make the twin of the original report instead. Nothing was written.`);
  if (/\s\(EN-AR\)$/i.test(base)) throw new Error(`"${path.basename(dir)}" already holds English and Arabic pages (its name ends in " (EN-AR)"): make it from the original report instead. Nothing was written.`);
  let pbip = loc.pbipPath;
  if (!pbip) { const beside = path.join(path.dirname(dir), base + '.pbip'); if (isFile(beside)) pbip = beside; }
  return { dir, base, pbip, project: path.dirname(dir) };
}

// ---- the report read, strictly, through the reading block (R1, the cross-review: the twin had its own locate, walker,
// reader and limits): every file listed by strictFiles (a link, a folder too deep, too many files or a file over 8 MB
// stops it, nothing written); pages in order, their visuals (in file order) and bookmarks from inventory() ----
function readOriginal(loc) {
  const left = [], files = strictFiles(loc.dir, { files: LIMITS.files, tail: ' Nothing was written.', left });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  const unreadable = inv.unreadableFiles.slice();
  // (the fuzz test's F-T4 and its crash in modelOf: any file can hold any JSON; what is not the shape expected is left
  // out here and copied as it is)
  let pbir = {}; try { const j = readJson(path.join(loc.dir, 'definition.pbir')); pbir = isObj(j) ? j : {}; } catch (e) { if (files.includes('definition.pbir')) unreadable.push('definition.pbir'); }
  const pages = inv.pages.filter((pg) => files.includes(pg.file)).map((pg) => ({ id: pg.id, rel: pg.file, page: pg.raw,
    visuals: pg.visuals.filter((x) => x.json && x.json.name != null && x.file.split('/').length === 6).sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0)).map((x) => ({ rel: x.file, json: x.json, mobile: mobileOf(loc, files, x.file) })) }));
  const bookmarks = inv.bookmarks.filter((b) => isObj(b.raw) && (typeof b.raw.name === 'string' || typeof b.raw.name === 'number')).map((b) => ({ rel: b.file, json: b.raw }));
  // (rc.24) the report's own measures (definition/reportExtensions.json), for the title measures; and the theme's text
  // sizes, for what the Arabic texts need
  let ext = null; if (files.includes(EXT)) { try { const j = readJson(path.join(loc.dir, ...EXT.split('/'))); ext = isObj(j) && Array.isArray(j.entities) ? j : null; } catch (e) { ext = null; } }
  return { files, left, pages, bookmarks, pbir, unreadable, ext, theme: isObj(inv.themeJson) ? inv.themeJson : null, phone: files.some((f) => /\/mobile\.json$/.test(f)), hasPlatform: files.includes('.platform') };
}

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
// (0.3.0 D3: the twin copied the phone layout as it was) a visual's mobile.json beside its visual.json: { rel, json }, or
// null (none, or not a JSON object: then it is copied as it is)
function mobileOf(loc, files, rel) {
  const m = rel.replace(/visual\.json$/, 'mobile.json'); if (m === rel || !files.includes(m)) return null;
  try { const j = readJson(path.join(loc.dir, ...m.split('/'))); return isObj(j) ? { rel: m, json: j } : null; } catch (e) { return null; }
}
const EXT = 'definition/reportExtensions.json';
// definition.pbir's model folder, when it names one: { path } or null
const byPathOf = (pbir) => { const d = isObj(pbir) && isObj(pbir.datasetReference) ? pbir.datasetReference : null, b = d && isObj(d.byPath) ? d.byPath : null; return b && typeof b.path === 'string' && b.path ? b : null; };
const pageOf = (pg) => (isObj(pg.page) ? pg.page : {});
// a page's size as numbers, never the file's own text (P3, P4 of the fuzz test: a width holding text went raw into the plan)
const sizeOf = (pg) => { const w = pageOf(pg).width, h = pageOf(pg).height; return Number.isFinite(w) && Number.isFinite(h) ? `${w} x ${h}` : 'not a number in page.json'; };

// ---- title measures (rc.24, the laptop's proof of rc.23: 4 chart titles stayed English in the twin) ----
// A chart's "fx" title is a measure; one of the report's own (reportExtensions.json, as DataArcus writes "Title: ..." for a
// chart cut to its Top N) is read, never run: its DAX is translated only when its text is fixed texts and the numbers
// it counts, of the shape  [VARs, no text in them] RETURN IF ( <a condition, no text>, A, B )  or  A, each of A and B
// texts and variables joined by &. Each branch is offered as one text, its variables as {1}, {2}: "Top {1} of {2}: Web
// Orders Total Score by Coupon Region". Any other shape (a value of the model, FORMAT, a text in a variable, a measure of
// the model) is listed as not translated, with why: it is never guessed.
// the DAX read token by token: its string literals, names ('Table', [Column]) and comments, so a sign inside them is not code
function daxScan(expr) {
  const lits = []; let i = 0, depth = 0; const top = [];   // top: [index, char] of the top-level , & ( ) outside literals and names
  while (i < expr.length) {
    const c = expr[i];
    if (c === '"') { let j = i + 1, t = ''; for (;;) { if (j >= expr.length) return null; if (expr[j] === '"') { if (expr[j + 1] === '"') { t += '"'; j += 2; continue; } break; } t += expr[j++]; } lits.push({ start: i, end: j + 1, text: t }); i = j + 1; continue; }
    if (c === "'") { const j = expr.indexOf("'", i + 1); if (j < 0) return null; i = j + 1; while (expr[i] === "'") { const k = expr.indexOf("'", i + 1); if (k < 0) return null; i = k + 1; } continue; }
    if (c === '[') { let j = i + 1; for (;;) { j = expr.indexOf(']', j); if (j < 0) return null; if (expr[j + 1] === ']') { j += 2; continue; } break; } i = j + 1; continue; }
    if ((c === '/' && (expr[i + 1] === '/' || expr[i + 1] === '*')) || (c === '-' && expr[i + 1] === '-')) return { comment: true };
    if (c === '(') depth++;
    if (c === ')') depth--;
    top.push({ i, c, depth });
    i++;
  }
  return { lits, top };
}
const NOT_READ = 'its DAX builds the text in a way DataArcus does not read (only fixed texts and the numbers the report counts are translated)';
function parseTitleDax(expr0, o) {
  const allowEmpty = !!(o && o.allowEmpty);
  const expr = String(expr0 == null ? '' : expr0), sc = daxScan(expr);
  if (!sc) return { why: 'its DAX could not be read (an unclosed text or name)' };
  if (sc.comment) return { why: 'its DAX has comments: ' + NOT_READ };
  const inLit = (i) => sc.lits.some((l) => i >= l.start && i < l.end);
  // the last RETURN outside literals and names
  let ret = -1; const re = /\bRETURN\b/gi; let m; while ((m = re.exec(expr))) { if (!inLit(m.index) && sc.top.some((t) => t.i === m.index)) ret = m.index; }
  const bodyAt = ret >= 0 ? ret + 6 : 0, prefix = ret >= 0 ? expr.slice(0, ret) : '';
  if (sc.lits.some((l) => l.start < bodyAt)) return { why: 'a text of it is kept in a variable: ' + NOT_READ };
  const vars = new Set([...prefix.matchAll(/\bVAR\s+([A-Za-z_][A-Za-z0-9_]*)\s*=/gi)].map((x) => x[1]));
  const body = expr.slice(bodyAt), lead = body.length - body.trimStart().length, b0 = bodyAt + lead, b1 = bodyAt + body.trimEnd().length;
  // a branch: literals and variables joined by & (top level, depth of the branch)
  const branch = (from, to) => {
    const parts = [], cuts = sc.top.filter((t) => t.i >= from && t.i < to && t.c === '&' && t.depth === sc.top.filter((x) => x.i < from).reduce((d, x) => d + (x.c === '(' ? 1 : x.c === ')' ? -1 : 0), 0)).map((t) => t.i);
    let at = from; [...cuts, to].forEach((c) => { parts.push([at, c]); at = c + 1; });
    const out = { template: '', vars: [] };
    for (const [a, z] of parts) {
      const raw = expr.slice(a, z), t = raw.trim(), start = a + raw.indexOf(t);
      const l = sc.lits.find((x) => x.start === start && x.end === start + t.length);
      if (l) { if (/[{}]/.test(l.text)) return null; out.template += l.text; continue; }
      if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t) && vars.has(t)) { out.vars.push(t); out.template += '{' + out.vars.length + '}'; continue; }
      return null;
    }
    return /\p{L}/u.test(out.template) || (allowEmpty && out.template === '' && !out.vars.length) ? out : null;
  };
  const some = (bs) => bs.some((b) => /\p{L}/u.test(b.template));
  if (/^IF\s*\(/i.test(expr.slice(b0, b1)) && expr[b1 - 1] === ')') {
    const open = expr.indexOf('(', b0), d = sc.top.find((t) => t.i === open).depth;
    const commas = sc.top.filter((t) => t.i > open && t.i < b1 - 1 && t.c === ',' && t.depth === d).map((t) => t.i);
    const close = sc.top.find((t) => t.i > open && t.c === ')' && t.depth === d - 1);
    if (commas.length !== 2 || !close || close.i !== b1 - 1) return { why: NOT_READ };
    if (sc.lits.some((l) => l.start > open && l.start < commas[0])) return { why: 'its condition compares texts: ' + NOT_READ };
    const A = branch(commas[0] + 1, commas[1]), B = branch(commas[1] + 1, b1 - 1);
    if (!A || !B || !some([A, B])) return { why: NOT_READ };
    return { prefix, ret: ret >= 0, cond: expr.slice(open + 1, commas[0]).trim(), branches: [A, B] };
  }
  const A = branch(b0, b1);
  return A && some([A]) ? { prefix, ret: ret >= 0, cond: null, branches: [A] } : { why: NOT_READ };
}
// the measure's DAX with the Arabic texts (one per branch, its {n} the branch's variables); a branch without a label keeps its own
const daxText = (t) => '"' + String(t).replace(/"/g, '""') + '"';
function arabicDax(pd, labels) {
  const one = (b, label) => { if (label == null) label = b.template; const out = []; String(label).split(/(\{\d+\})/).forEach((x) => { const v = /^\{(\d+)\}$/.exec(x); if (v) out.push(b.vars[+v[1] - 1]); else if (x) out.push(daxText(x)); }); return out.length ? out.join(' & ') : '""'; };
  const bs = pd.branches.map((b, i) => one(b, labels[i]));
  return (pd.ret ? pd.prefix + 'RETURN ' : '') + (pd.cond != null ? `IF ( ${pd.cond}, ${bs[0]}, ${bs[1]} )` : bs[0]);
}
// a label of a branch must keep each {n} of the branch once, and add none
function placeholderProblem(template, label) {
  const want = (template.match(/\{\d+\}/g) || []).sort(), got = (String(label).match(/\{\d+\}/g) || []).sort();
  return JSON.stringify(want) === JSON.stringify(got) ? null : `the Arabic text must keep ${want.length ? want.join(' and ') + ' once each (the numbers the report counts)' : 'no {n}'}, and add none: not taken`;
}
// every title of the report given by a measure: the report's own (parsed), or the model's
const extMeasureOf = (R, entity, name) => { const e = R.ext ? R.ext.entities.find((x) => isObj(x) && x.name === entity) : null; return e && Array.isArray(e.measures) ? e.measures.find((x) => isObj(x) && x.name === name) || null : null; };
function titleMeasuresOf(R) {
  const seen = new Map();
  R.pages.forEach((pg) => pg.visuals.forEach((v) => {
    const vco = isObj(v.json) && isObj(v.json.visual) && isObj(v.json.visual.visualContainerObjects) ? v.json.visual.visualContainerObjects : {};
    (Array.isArray(vco.title) ? vco.title : []).forEach((e) => {
      const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null;
      const src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
      if (!src || typeof ms.Property !== 'string' || typeof src.Entity !== 'string') return;
      const key = (src.Schema === 'extension' ? 'ext' : 'model') + '\u0000' + src.Entity + '\u0000' + ms.Property;
      if (seen.has(key)) return;
      const own = src.Schema === 'extension', m = own ? extMeasureOf(R, src.Entity, ms.Property) : null;
      const pd = !own ? { why: 'a measure of the model: the twin never changes the model, so this title stays as the model gives it' } : !m ? { why: 'the report\'s measure is not in its reportExtensions.json' } : typeof m.expression !== 'string' ? { why: 'its DAX is not a text in reportExtensions.json' } : parseTitleDax(m.expression);
      seen.set(key, { entity: src.Entity, name: ms.Property, own, measure: m, pd });
    });
  }));
  return [...seen.values()];
}

// (0.3.0 D3: the empty state's "No data for this selection" stayed English in the twin) a measure of the report that a
// visual shows (in its fields, as the writer's "No data: ..." card does), its text read as a title measure's is (fixed
// texts and the numbers the report counts; one branch may be the empty text ""), never run. The title measures are
// above; a measure of the model is the model's (never changed)
function textMeasuresOf(R) {
  const seen = new Map(), titles = new Set(titleMeasuresOf(R).filter((x) => x.own).map((x) => x.entity + '\u0000' + x.name));
  const walk = (o) => { if (Array.isArray(o)) { o.forEach(walk); return; } if (!isObj(o)) return;
    const ms = isObj(o.Measure) ? o.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
    if (src && src.Schema === 'extension' && typeof src.Entity === 'string' && typeof ms.Property === 'string') {
      const key = src.Entity + '\u0000' + ms.Property, m = extMeasureOf(R, src.Entity, ms.Property);
      if (!seen.has(key) && !titles.has(key) && m && typeof m.expression === 'string' && /"(?:[^"]|"")*\p{L}/u.test(m.expression)) seen.set(key, { entity: src.Entity, name: ms.Property, measure: m, pd: parseTitleDax(m.expression, { allowEmpty: true }) });
    }
    Object.values(o).forEach(walk); };
  R.pages.forEach((pg) => pg.visuals.forEach((v) => walk(isObj(v.json) && isObj(v.json.visual) ? v.json.visual.query : null)));
  return [...seen.values()];
}

// ---- the texts a reader sees, for the user's Arabic (cleaned, capped, instruction-like withheld) ----
// An id holds report names (a page, a visual, a field's queryRef). An id that reads like an instruction, holds an
// invisible character or is longer than 160 is replaced by an opaque one ("h:" and 16 hex digits of its hash), which
// the server maps back: no such name reaches the answer (the cross-review's T5)
const safeId = (raw) => (!INSTRUCTION.test(raw) && visible(raw) === raw && raw.length <= 160 ? raw : 'h:' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16));
function textsOf(R) {
  const all = [], seen = new Set();
  const add = (t, where) => { if (seen.has(t.id)) return; seen.add(t.id); all.push(Object.assign(t, where)); };
  R.pages.forEach((pg) => {
    add({ id: 'page:' + pg.id, kind: 'page', text: typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : '' }, { page: pg.id });
    // (rc.22, B-138: a page button kept its English text in the twin) a button that goes to a page knows that page
    const goesTo = (j) => { const l = ((((j || {}).visual || {}).visualContainerObjects || {}).visualLink || []).find((e) => e && e.properties) || {}, p = l.properties || {}, lit = (x) => (x && x.expr && x.expr.Literal ? String(x.expr.Literal.Value).replace(/^'|'$/g, '') : null);
      return /PageNavigation/i.test(String(lit(p.type))) ? lit(p.navigationSection) : null; };
    pg.visuals.forEach((v) => Mirror.textsOfVisual(pg.id, v.json).forEach((t) => add(Object.assign(t, t.kind === 'button' && goesTo(v.json) ? { goesTo: 'page:' + goesTo(v.json) } : {}), t.kind === 'field' ? {} : { page: pg.id, visual: String(v.json.name) })));
    // (0.3.0 D3) the phone layout's own texts: the header text box, a card's full title the writer wrapped for the phone
    pg.visuals.forEach((v) => { if (v.mobile) Mirror.textsOfMobile(pg.id, v.json, v.mobile.json).forEach((t) => add(Object.assign(t, { phone: true }), { page: pg.id, visual: String(v.json.name) })); });
  });
  R.bookmarks.forEach((b) => add({ id: 'bookmark:' + b.json.name, kind: 'bookmark', text: typeof b.json.displayName === 'string' ? b.json.displayName : '' }, {}));
  // (rc.24) each visible text of the report's title measures, one per text across the report (the measures listed)
  titleMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => x.pd.branches.forEach((b) => {
    const id = 'titleText:' + b.template, had = all.find((t) => t.id === id), m = safeName(x.entity + '[' + x.name + ']');
    if (had) { if (!had.measures.includes(m)) had.measures.push(m); return; }
    add({ id, kind: 'titleMeasure', text: b.template, what: 'Chart title (from a title measure)' + (b.vars.length ? `: keep ${b.vars.map((v, i) => '{' + (i + 1) + '}').join(' and ')}, the numbers the report counts` : ''), measures: [m] }, {});
  }));
  // (0.3.0 D3) each visible text of the report's other text measures a visual shows (the empty state), one per text
  textMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => x.pd.branches.filter((b) => b.template).forEach((b) => {
    const id = 'measureText:' + b.template, had = all.find((t) => t.id === id), m = safeName(x.entity + '[' + x.name + ']');
    if (had) { if (!had.measures.includes(m)) had.measures.push(m); return; }
    add({ id, kind: 'measureText', text: b.template, what: 'Text a report measure shows (such as the empty state\'s message)' + (b.vars.length ? `: keep ${b.vars.map((v, i) => '{' + (i + 1) + '}').join(' and ')}, the numbers the report counts` : ''), measures: [m] }, {});
  }));
  return all.map((t) => {
    const raw = String(t.text);
    const out = Object.assign({ id: safeId(t.id), kind: t.kind, rawId: t.id, raw }, t.phone ? { phone: true } : {}, t.goesTo ? { goesTo: safeId(t.goesTo) } : {}, t.what ? { what: t.what, measures: t.measures.slice(0, 30) } : {});
    // (0.3.0 D3: twice the texts in the same answer) the page and the visual are said apart only when the id can't say them
    if (t.page && out.id !== t.id) out.page = safeName(t.page);
    if (t.visual && out.id !== t.id) out.visual = safeName(t.visual);
    if (INSTRUCTION.test(raw)) return Object.assign(out, { text: null, withheld: `reads like an instruction to an AI assistant (${raw.length} characters): not shown, kept as it is unless the user gives its Arabic`, draftArabic: null });
    const text = visible(raw);
    return Object.assign(out, { text: text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) + '…' : text }, text.length > TEXT_CAP ? { long: raw.length } : {}, { draftArabic: draftText(raw) });
  });
}
// the labels by the ids the answer gave, as the mirror engine's ids (the report's own names); (0.3.0 J18) each as it is
// written: a Latin run inside Arabic text isolated (terminology.mjs)
const rawLabels = (texts, labels) => { const by = new Map(texts.map((t) => [t.id, t.rawId])), out = {}; Object.keys(labels || {}).forEach((k) => { if (by.has(k)) out[by.get(k)] = Terms.isolateLatin(labels[k]); }); return out; };

// ---- the model next to the report: its date tables (for time left to right, T2) and the month offer ----
function modelOf(R, loc) {
  const ref = byPathOf(R.pbir);
  if (!ref || !ref.path) return { m: null, why: 'the report is connected to a published model (not a model folder next to it): the column is a model step for the model\'s owner' };
  try { return { m: loadModel(relRoot(path.resolve(loc.dir, String(ref.path)))) }; } catch (e) { return { m: null, why: 'the model that definition.pbir names next to the report could not be read (a model folder saved from Power BI Desktop is needed there; the error is not repeated: it holds the file\'s own path)' }; }
}
const isDateCol = (c) => /^date(time)?$/i.test(String(c.dataType || ''));
// (T-5 of the laptop's rc.2 twins: "the model has no date table" on a table spelled "Calender" and on one named
// "Calendar" but not marked: the date table was found by its name and mark, and a DAX table's columns carry no type)
// A date table by its SHAPE, never its name: a date column (typed date, or untyped in a table built with CALENDAR or
// CALENDARAUTO, which gives one row a day) and a month and a year column (by their DAX, or their names). Read from the
// model's own definitions (m.tmsl), where an untyped column is undefined, not guessed.
const untyped = (t) => (t == null || /^unknown$/i.test(String(t)) ? '' : String(t));
const MONTHISH = /\bmonth|الشهر|شهر/i, YEARISH = /\byear|السنة|سنة/i;
function dateTableShapes(m) {
  if (!m) return [];
  const raw = (m.tmsl && m.tmsl.model && Array.isArray(m.tmsl.model.tables)) ? m.tmsl.model.tables : [];
  return (m.tables || []).map((t) => {
    const r = raw.find((x) => x && x.name === t.name) || {}, rc = Array.isArray(r.columns) ? r.columns : [];
    const expr = (Array.isArray(r.partitions) ? r.partitions : []).map((p) => (p && p.source && typeof p.source.expression === 'string' ? p.source.expression : Array.isArray(p && p.source && p.source.expression) ? p.source.expression.join('\n') : '')).join('\n');
    const calendar = /\bCALENDAR(AUTO)?\s*\(/i.test(expr);
    // (rc.5: the TMDL reader marks an untyped DAX column 'unknown': untyped, as an empty type)
    const typeOf = (c) => { const x = rc.find((y) => y && y.name === c.name); return untyped(x ? x.dataType : c.dataType); };
    const dates = (t.columns || []).filter((c) => /^date(time)?$/i.test(typeOf(c)) || (calendar && !typeOf(c) && /^\[?date\]?$/i.test(String((rc.find((y) => y && y.name === c.name) || {}).sourceColumn || c.name))));
    const text = expr + ' ' + (t.columns || []).map((c) => c.name).join(' ');
    const shaped = dates.length && MONTHISH.test(text) && YEARISH.test(text);
    return shaped ? { name: t.name, marked: !!t.date, calendar, dates: dates.map((c) => c.name) } : null;
  }).filter(Boolean);
}
// the date tables (by shape) and every date column of the model, "Table.Column" (a continuous axis: T-2)
const dateTablesOf = (m) => dateTableShapes(m).map((t) => t.name);
const dateColumnsOf = (m) => (m ? [...new Set([].concat(...(m.tables || []).map((t) => (t.columns || []).filter(isDateCol).map((c) => t.name + '.' + c.name)), ...dateTableShapes(m).map((t) => t.dates.map((c) => t.name + '.' + c))))] : []);

// ---- the Arabic month column: a TMDL script offered when the model has one date table and no Arabic month ----
const tmdlName = (n) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'");
const daxCol = (t, c) => "'" + String(t).replace(/'/g, "''") + "'[" + String(c).replace(/]/g, ']]') + ']';
// (0.3.0 C1, the owner, 21 Oct) the full set of Arabic calendar columns (the shared builder, arabic-calendar.js): the
// Arabic twins of what the date table has (months, days, quarters, fiscal year and quarter, Hijri months, the flags'
// labels), each sorted by its English column's own sort column, else by the month number found here, else by a hidden
// number written with it. The month column stays first and as before (arabicMonth's own fields); the rest beside it
export function monthOffer(model, loc, outBase) {
  if (!model.m) return { offered: false, why: model.why };
  const m = model.m, isDate = isDateCol;
  // (T-5: by shape; when several, the one marked as the date table, then the one built with CALENDAR)
  const shapes = dateTableShapes(m);
  let pick = shapes; if (pick.length > 1 && pick.some((x) => x.marked)) pick = pick.filter((x) => x.marked); if (pick.length > 1 && pick.some((x) => x.calendar)) pick = pick.filter((x) => x.calendar);
  const cands = pick.map((x) => Object.assign({}, (m.tables || []).find((t) => t.name === x.name), { shapeDates: x.dates }));
  if (cands.length !== 1) return { offered: false, why: cands.length ? `the model has ${cands.length} date tables: say which one, and the columns are a model step done by hand` : 'the model has no date table (a table with a date column and month and year columns; built with CALENDAR or CALENDARAUTO, or marked as the date table)' };
  // (0.3.0 F7, the red team's F-2; AUD-032: a name with a control character, a tab or a line break, is never written raw
  // into a script) the date table, its date column or a column with one is left out and named, with why; a bidi or
  // zero-width name stays (inside its quotes, as every script writes it)
  const CC = 'its name holds a control character (a tab or a line break): no script names it; rename it in Power BI Desktop, then ask again';
  if (hasControl(cands[0].name)) return { offered: false, why: `the date table "${visible(cands[0].name)}": ${CC}`, leftOut: [{ table: visible(cands[0].name), why: CC }] };
  const t = cands[0], ccCols = (t.columns || []).filter((c) => hasControl(c.name)), cols = (t.columns || []).filter((c) => !hasControl(c.name));
  const ccLeft = ccCols.map((c) => ({ column: visible(c.name), why: CC }));
  const has = (re) => cols.find((c) => re.test(String(c.name)));
  const arabicMonthThere = !!(has(/^month name \(arabic\)$/i) || cols.some((c) => /(arabic|عربي|\bAR\b)/i.test(c.name) && /(month|شهر)/i.test(c.name)) || has(/^(اسم\s*)?الشهر$/));
  const raw = ((m.tmsl && m.tmsl.model && m.tmsl.model.tables) || []).find((x) => x.name === t.name) || {};
  const date = (raw.columns || []).find((c) => c.name && !hasControl(c.name) && isDate(c) && c.isKey) || cols.find(isDate) || cols.find((c) => (t.shapeDates || []).includes(c.name));
  // the month number to sort by: an integer column named like one (an untyped DAX column of that name counts: its DAX makes it a number)
  const typedRaw = (c) => { const x = (raw.columns || []).find((y) => y && y.name === c.name); return untyped(x ? x.dataType : c.dataType); };
  if (!date) return { offered: false, why: `the date table "${visible(t.name)}" has no date column a script can name`, ...(ccLeft.length ? { leftOut: ccLeft } : {}) };
  // (rc.5: an untyped column of a calculated calendar is a number only when its DAX there is MONTH ( ... ): a plain
  // "Month" there was FORMAT ( [Date], "MMM" ), a text, and sorting by it puts the months in alphabetical order)
  const calcExpr = (raw.partitions || []).filter((p) => p && p.source && p.source.type === 'calculated').map((p) => (Array.isArray(p.source.expression) ? p.source.expression.join('\n') : String(p.source.expression || ''))).join('\n');
  const daxFn = (c) => { const r = new RegExp('"' + String(c.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '""') + '"\\s*,\\s*([A-Za-z.]+)\\s*\\(', 'i').exec(calcExpr); return r ? r[1].toUpperCase() : null; };
  const isMonthNo = (c) => { const ty = typedRaw(c), fn = ty ? null : daxFn(c), name = String(c.name).trim();
    if (ty) return /^int64$/i.test(ty) && /^(month\s*(number|no\.?|num|nr|of year|index)|monthnum(ber)?|month)$/i.test(name);
    if (fn) return fn === 'MONTH';
    return /^(month\s*(number|no\.?|num|nr|of year|index)|monthnum(ber)?)$/i.test(name); };
  const num = cols.find(isMonthNo);
  const calculated = (raw.partitions || []).some((p) => p.source && p.source.type === 'calculated');
  const ref = (c) => daxCol(t.name, c), dref = ref(date.name), col = (re) => cols.find((c) => re.test(String(c.name).trim()));
  const sortOf = (c) => { const x = (raw.columns || []).find((y) => y && y.name === c.name); return x && x.sortByColumn && !hasControl(x.sortByColumn) ? String(x.sortByColumn) : null; };
  const fyc = col(/^fiscal year$/i), fmc = col(/^fiscal month number$/i), fqc = col(/^fiscal quarter$/i), hmc = col(/^hijri month number$/i);
  const strip = (c, words) => words.reduce((e, w) => `SUBSTITUTE ( ${e}, "${w}", "" )`, ref(c.name));
  const list = cols.map((c) => ({ name: String(c.name), type: typedRaw(c) || '', sortBy: sortOf(c) }));
  // (as before C1: the month column even when the table names its months otherwise, "Month" or none)
  if (!arabicMonthThere && !list.some((c) => /^month name$/i.test(c.name))) list.unshift({ name: 'Month Name', type: 'string', sortBy: null });
  const built = ArabicCal.columnsFor({ columns: list.filter((c) => !(arabicMonthThere && /^month (name|short)$/i.test(c.name))),
    src: { month: `MONTH ( ${dref} )`, weekday: `WEEKDAY ( ${dref}, 1 )`, quarter: `QUARTER ( ${dref} )`, year: `YEAR ( ${dref} )`, hijriMonth: hmc ? ref(hmc.name) : null,
      fiscalMonth: fmc ? ref(fmc.name) : null, fiscalYearNo: fyc && /^int64$/i.test(typedRaw(fyc) || '') ? ref(fyc.name) : null,
      fiscalYearText: fyc && !/^int64$/i.test(typedRaw(fyc) || '') ? `TRIM ( ${strip(fyc, ['FY', 'fy'])} )` : null,
      fiscalQuarterText: fqc ? `TRIM ( ${strip(fqc, ['FQ', 'fq', 'Q', 'q'])} )` : null, flag: (n) => { const c = cols.find((x) => x.name === n); return c ? ref(c.name) : null; } },
    sorts: { month: num ? num.name : null, day: null, hijri: hmc ? hmc.name : null } });
  // the month column's sort as before: its English column's own, else the month number found, else a hidden one
  built.columns.filter((c) => c.kind === 'month').forEach((c) => { const en = list.find((x) => x.name === c.of); if (!(en && en.sortBy) && num) { c.sortBy = num.name; delete c.sortNew; } else if (!(en && en.sortBy) && !num) { c.sortBy = MONTH_SORT; c.sortNew = { name: MONTH_SORT, dax: `MONTH ( ${dref} )` }; } });
  built.skipped = ccLeft.map((x) => ({ of: x.column, why: x.why })).concat(built.skipped);
  if (!built.columns.length) return { offered: false, why: `the date table "${visible(t.name)}" has its Arabic calendar columns already${built.skipped.length ? ` (left out: ${built.skipped.map((x) => `${visible(x.of)}: ${x.why}`).join('; ')})` : ''}` };
  const seed = 'arabic-calendar\0' + t.name, tag = (n) => tagOf(seed, n), lines = ['createOrReplace', '', '\tref table ' + tmdlName(t.name), ''], made = new Set();
  built.columns.forEach((c) => { if (c.sortNew && !made.has(c.sortNew.name)) { made.add(c.sortNew.name); lines.push(`\t\tcolumn ${tmdlName(c.sortNew.name)} = ${c.sortNew.dax}`, '\t\t\tdataType: int64', '\t\t\tisHidden', `\t\t\tlineageTag: ${tag(c.sortNew.name)}`, '\t\t\tsummarizeBy: none', ''); } });
  built.columns.forEach((c) => lines.push(`\t\tcolumn ${tmdlName(c.name)} = ${c.dax}`, '\t\t\tdataType: string', `\t\t\tlineageTag: ${tag(c.name)}`, '\t\t\tsummarizeBy: none', ...(c.sortBy ? [`\t\t\tsortByColumn: ${tmdlName(c.sortBy)}`] : []), ''));
  const mc = built.columns.find((c) => c.name === MONTH_COLUMN);
  return { offered: true, table: visible(t.name), dateColumn: visible(date.name), column: mc ? MONTH_COLUMN : built.columns[0].name, sortBy: mc ? (mc.sortNew ? mc.sortBy + ' (written with it, hidden)' : visible(mc.sortBy)) : null,
    // (kept short: a twin's plan answer has one size budget, its texts first)
    columns: built.columns.map((c) => (c.sortBy ? { name: c.name, sortBy: visible(c.sortBy) } : { name: c.name })),
    englishData: built.columns.filter((c) => cols.some((x) => x.name === c.of)).map((c) => `${visible(t.name)}[${visible(c.of)}]`),
    englishDataWhy: 'their values are the model\'s own English data: an Arabic page shows them as they are until the script adds their "(Arabic)" twins',
    ...(built.skipped.length ? { leftOut: built.skipped.map((x) => ({ column: visible(x.of), why: x.why })) } : {}),
    ...(calculated ? { note: 'the date table is a DAX (calculated) table: the lab added the column to its formula; adding it as a calculated column is not yet proven in Desktop through TMDL view: check Preview before Apply' } : {}),
    scriptAfterGo: `${outBase} - Arabic calendar.tmdl`, script: lines.join('\n') + '\n',
    howToApply: `Save a copy of the Power BI file first. Open the script file in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview (${built.columns.length} Arabic column${built.columns.length === 1 ? ' is' : 's are'} added to the date table, each sorted like its English column), then Apply. DataArcus never applies it: the model is changed only when the user applies it. Then ask for the Arabic report again (plan, approve, write): it binds the Arabic columns (يناير، الأحد، الربع 1، عطلة نهاية الأسبوع...) in place of the English ones.`,
    howToSwitch: 'Until the script is applied the Arabic report binds the English calendar columns (it always works) and shows their English values. To switch: apply the script in TMDL view, then plan the report again (plan_layout, approve, create_report): the Arabic columns are bound automatically.' };
}


// ---- what the Arabic texts need (rc.24, the laptop's proof of rc.23): buttons and table headers cut in the twin ----
const num = (p) => (p && p.expr && p.expr.Literal ? parseFloat(p.expr.Literal.Value) : NaN);
const posOf = (v) => (isObj(v) && isObj(v.position) && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(v.position[k])) ? v.position : null);
const typeOf = (v) => (isObj(v) && isObj(v.visual) ? String(v.visual.visualType || '') : isObj(v) && isObj(v.visualGroup) ? 'group' : '');
// A button narrower than its Arabic text (check_report's buttonNeed) is widened: first toward its end (its left in the
// twin), the visuals beside it in its row moving with it, then toward its start; inside its page or group, never over a
// visual it did not overlap. A shape just under or over it (the page's underline) follows it. What can't fit is said.
function fitButtons(page, visuals, ctx, at) {
  const out = { buttons: [], buttonsCut: [] }, byName = {};
  visuals.forEach((v) => { if (isObj(v) && v.name != null) byName[v.name] = v; });
  const parentOf = (v) => (v.parentGroupName != null ? String(v.parentGroupName) : '');
  const widthOf = (v) => { const g = v.parentGroupName != null ? byName[v.parentGroupName] : null; return g ? (posOf(g) || {}).width : isObj(page) ? page.width : NaN; };
  const vOver = (a, b) => a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
  const attachedTo = (v) => { const p = posOf(v); return visuals.filter((s) => s !== v && /^(shape|basicShape)$/.test(typeOf(s)) && parentOf(s) === parentOf(v) && posOf(s)).filter((s) => { const q = posOf(s);
    return !vOver(p, q) && q.x >= p.x - 2 && q.x + q.width <= p.x + p.width + 2 && q.width <= p.width && Math.min(Math.abs(q.y - (p.y + p.height)), Math.abs(p.y - (q.y + q.height))) <= 8; }); };
  const shift = (v, d) => { posOf(v).x = Mirror.round(posOf(v).x + d); attachedTo(v).forEach((s) => { posOf(s).x = Mirror.round(posOf(s).x + d); }); };
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'actionButton' || !p) return;
    let b; try { b = Rules.buttonNeed({ json: v, type: 'actionButton', h: p.height, w: p.width }, ctx.text); } catch (e) { b = null; }
    if (!b || p.width + 0.5 >= b.needW) return;
    const W = widthOf(v); if (!Number.isFinite(W)) return;
    const grow = Math.ceil(b.needW - p.width), lines = attachedTo(v);
    // the room: the container, or a panel it sits on (a sibling holding it whole); the row: siblings beside it
    const sibs = visuals.filter((x) => x !== v && posOf(x) && parentOf(x) === parentOf(v) && !lines.includes(x));
    const holds = sibs.filter((x) => { const q = posOf(x); return q.x <= p.x + 0.5 && q.x + q.width >= p.x + p.width - 0.5 && q.y <= p.y + 0.5 && q.y + q.height >= p.y + p.height - 0.5; });
    const lo = Math.max(0, ...holds.map((x) => posOf(x).x)), hi = Math.min(W, ...holds.map((x) => posOf(x).x + posOf(x).width));
    const row = sibs.filter((x) => !holds.includes(x) && vOver(p, posOf(x)));
    const left = row.filter((x) => posOf(x).x + posOf(x).width <= p.x + 0.5), right = row.filter((x) => posOf(x).x >= p.x + p.width - 0.5);
    const roomL = Math.max(0, (left.length ? Math.min(...left.map((x) => posOf(x).x)) : p.x) - lo), roomR = Math.max(0, hi - (right.length ? Math.max(...right.map((x) => posOf(x).x + posOf(x).width)) : p.x + p.width));
    const firstL = ctx.rtl, a1 = Math.min(grow, Math.floor(firstL ? roomL : roomR)), a2 = Math.min(grow - a1, Math.floor(firstL ? roomR : roomL));
    const dl = firstL ? a1 : a2, dr = firstL ? a2 : a1;
    left.forEach((x) => shift(x, -dl)); right.forEach((x) => shift(x, dr));
    p.x = Mirror.round(p.x - dl); p.width = Mirror.round(p.width + dl + dr);
    lines.forEach((s) => { const q = posOf(s); q.x = Mirror.round(q.x - dl); q.width = Mirror.round(q.width + dl + dr); });
    const what = { page: safeName(at), visual: safeName(String(v.name)), kind: b.page ? 'page button' : 'button', needs: b.needW, width: p.width };
    const moved = (dl ? left.length : 0) + (dr ? right.length : 0);
    if (dl + dr > 0) out.buttons.push(Object.assign({}, what, moved ? { moved } : {}));
    if (p.width + 0.5 < b.needW) out.buttonsCut.push(Object.assign({}, what, { room: p.width, why: `its Arabic text needs ${b.needW} wide; its ${v.parentGroupName != null ? 'group' : 'page'} and the visuals beside it leave ${p.width}: give a shorter Arabic text, or Power BI cuts it` }));
  });
  return out;
}
// A table column with a set width (DataArcus's tables) narrower than its Arabic header (check_report's own measure,
// report-rules.js headerNeed: bold, + 24 a page of 1080 high, the writer's cellRoom) takes the table's spare width, then
// width from its text columns down to their own need; a number column is never narrowed. What can't fit is said in
// headersCut: cut: 'cut' under the share of the measure Desktop has drawn an Arabic header whole in, else 'may be cut'
// (0.2.9.1, B-173: Desktop 2.159 drew one whole that the measure called cut). Headers set to wrap: none.
function fitHeaders(page, visuals, origByName, ctx, at) {
  const out = { headers: [], headersCut: [] }, sc = isObj(page) && Number.isFinite(page.height) ? page.height / 1080 : 1;
  visuals.forEach((v) => {
    const p = posOf(v); if (typeOf(v) !== 'tableEx' || !p || !isObj(v.visual.objects) || !Array.isArray(v.visual.objects.columnWidth)) return;
    const o = v.visual.objects, H = Rules.tableHeaders(v, ctx.theme, ctx.text.font, sc), T = H.t, font = H.font;
    if (!H.cols.length) return;
    const entry = (ref) => o.columnWidth.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === ref && isObj(e.properties) && Number.isFinite(num(e.properties.value)));
    const widthOf = (ref) => { const e = entry(ref); return e ? num(e.properties.value) : null; };
    const setW = (ref, w) => { entry(ref).properties.value = { expr: { Literal: { Value: w + 'D' } } }; };
    const head = (x) => String(x.displayName != null ? x.displayName : x.nativeQueryRef || '');
    const m = (x) => Rules.headerNeed(head(x), T, font, sc), need = (x) => m(x).needW;
    // a text column: a column of the model left-aligned in the original (DataArcus aligns its numbers right)
    const ov = origByName[v.name], oAlign = (ref) => { const cf = ov && isObj(ov.visual) && isObj(ov.visual.objects) && Array.isArray(ov.visual.objects.columnFormatting) ? ov.visual.objects.columnFormatting : [], e = cf.find((y) => isObj(y) && isObj(y.selector) && y.selector.metadata === ref && isObj(y.properties));
      return e && e.properties.alignment && e.properties.alignment.expr ? String(e.properties.alignment.expr.Literal.Value).replace(/^'|'$/g, '') : null; };
    const isText = (x) => isObj(x.field) && !!x.field.Column && !/^(Right|Center)$/i.test(String(oAlign(x.queryRef) || ''));
    const cols = H.cols.map((c) => c.p);
    const ownNeed = (x) => Math.max(need(x), Math.ceil(12 * 0.55 * T * 4 / 3 + 24 * sc));
    let spare = Math.floor(p.width - 36 * sc - o.columnWidth.filter((e) => isObj(e) && isObj(e.properties)).reduce((a, e) => a + (num(e.properties.value) || 0), 0));
    cols.filter((x) => widthOf(x.queryRef) + 0.5 < need(x)).forEach((x) => {
      let short = need(x) - Math.floor(widthOf(x.queryRef)), got = 0;
      const take = Math.min(short, Math.max(0, spare)); spare -= take; got += take; short -= take;
      cols.filter((d) => d !== x && isText(d)).forEach((d) => { if (short <= 0) return; const give = Math.min(short, Math.floor(widthOf(d.queryRef) - ownNeed(d))); if (give > 0) { setW(d.queryRef, Math.floor(widthOf(d.queryRef)) - give); got += give; short -= give; } });
      if (got) setW(x.queryRef, Math.floor(widthOf(x.queryRef)) + got);
      const w = widthOf(x.queryRef), what = { page: safeName(at), visual: safeName(String(v.name)), column: safeName(x.queryRef), needs: need(x), width: w };
      if (got) out.headers.push(what);
      if (short <= 0) return;
      if (w + 0.5 >= m(x).lowW) out.headersCut.push(Object.assign({}, what, { cut: 'may be cut', lowW: m(x).lowW, why: `its Arabic header needs ${need(x)} wide by our measure, and the table's other columns can give no more (numbers are never narrowed); Desktop 2.159 drew Arabic headers whole in about 0.7 of our measure (from ${m(x).lowW} here), so Power BI may cut it: look at it in Desktop, or give a shorter Arabic name` }));
      else out.headersCut.push(Object.assign({}, what, { cut: 'cut', lowW: m(x).lowW, why: `its Arabic header needs ${need(x)} wide; the table's other columns can give no more (numbers are never narrowed): give a shorter Arabic name, or Power BI cuts the header` }));
    });
  });
  return out;
}

// (0.3.0 D3, the laptop's proof of rc.2: «التفاصيل» kept the English tab's 55 wide on the phone and wrapped, "التفاصيـ / ل")
// The page tabs of a phone row (page buttons with the same phone top), already mirrored: each as wide as its Arabic name
// by the writer's phone rule (pbip-sizing.js phoneTabWidth: one line, bold, at the phone's 10pt), laid from the row's
// right end (the mirror of where the original's row started) with the writer's gap, the first page at the right; the
// line under a tab (a shape under it, 3 high at most) follows it with its own margins; a group holding them grows to
// hold them. A row whose names can't all fit is shared in proportion, and said (tabsCut).
function fitPhoneTabs(pg, visuals, mobiles, ctx, out) {
  const W = Mirror.PHONE_W, G = Sizing.PHONE_TAB.gap, box = (m) => (m && isObj(m.position) && ['x', 'y', 'width', 'height'].every((k) => Number.isFinite(m.position[k])) ? m.position : null);
  const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
  const isTab = (v) => typeOf(v) === 'actionButton' && /PageNavigation/i.test(String(lit((((v.visual.visualContainerObjects || {}).visualLink || []).find((e) => isObj(e) && isObj(e.properties)) || { properties: {} }).properties.type)));
  const textOf = (v) => { const es = isObj(v.visual.objects) && Array.isArray(v.visual.objects.text) ? v.visual.objects.text.filter((e) => isObj(e) && isObj(e.properties)) : [], t = es.map((e) => lit(e.properties.text)).find((x) => x != null), f = es.map((e) => lit(e.properties.fontFamily)).find((x) => x != null); return { text: t, font: f || ctx.text.font }; };
  const tabs = visuals.map((v, i) => ({ v, m: mobiles[i], i })).filter((x) => isObj(x.v) && isObj(x.v.visual) && isTab(x.v) && box(x.m) && textOf(x.v).text != null);
  const orig = (x) => box(pg.visuals[x.i].mobile.json);
  const rows = [];
  tabs.forEach((x) => { const row = rows.find((r) => Math.abs(orig(r[0]).y - orig(x).y) < 0.5); if (row) row.push(x); else rows.push([x]); });
  rows.forEach((row) => {
    row.sort((a, b) => orig(a).x - orig(b).x);   // the original's reading order: from its row's start
    // the lines under the tabs, found on the original's phone layout
    const lines = row.map((x) => { const o = orig(x); const j = pg.visuals.findIndex((v, k) => { const q = box(v.mobile && v.mobile.json); return q && k !== x.i && /^(shape|basicShape)$/.test(typeOf(v.json)) && q.height <= 3 && Math.abs(q.y - (o.y + o.height)) <= 1 && q.x >= o.x - 0.5 && q.x + q.width <= o.x + o.width + 0.5; }); return j < 0 ? null : { j, l: box(pg.visuals[j].mobile.json).x - orig(x).x, r: orig(x).x + orig(x).width - (box(pg.visuals[j].mobile.json).x + box(pg.visuals[j].mobile.json).width) }; });
    const end = W - Math.min(...row.map((x) => orig(x).x)), need = row.map((x) => Sizing.phoneTabWidth(textOf(x.v).text, textOf(x.v).font));
    const room = end - G * (row.length - 1), sum = need.reduce((a, b) => a + b, 0), k = sum > room ? room / sum : 1;
    let at = end;
    row.forEach((x, n) => {
      const p = box(x.m), w = k < 1 ? Math.floor(need[n] * k) : need[n];
      p.width = w; p.x = Mirror.round(Math.max(0, at - w)); at = p.x - G;
      const ln = lines[n]; if (ln && mobiles[ln.j] && box(mobiles[ln.j])) { const q = box(mobiles[ln.j]); q.x = Mirror.round(p.x + ln.r); q.width = Mirror.round(Math.max(4, w - ln.l - ln.r)); }
      const what = { page: safeName(pg.id), visual: safeName(String(x.v.name)), needs: need[n], width: w };
      out.tabs.push(what);
      if (w < need[n]) out.tabsCut.push(Object.assign({}, what, { why: `its Arabic name needs ${need[n]} wide on the phone; the row's ${row.length} tabs share ${Math.floor(end)}: give shorter Arabic page names, or the phone wraps or cuts it` }));
    });
  });
  // a group's phone box holds its children (in mobile.json a grouped visual's position is a page position)
  visuals.forEach((g, i) => { const gb = box(mobiles[i]); if (!gb || typeOf(g) !== 'group') return;
    const kids = visuals.map((v, k) => (isObj(v) && v.parentGroupName != null && String(v.parentGroupName) === String(g.name) ? box(mobiles[k]) : null)).filter(Boolean); if (!kids.length) return;
    const x0 = Math.min(gb.x, ...kids.map((q) => q.x)), x1 = Math.max(gb.x + gb.width, ...kids.map((q) => q.x + q.width));
    gb.x = Mirror.round(x0); gb.width = Mirror.round(x1 - x0); });
}
// ---- the right-to-left waterfall's facts from the model (D1): a column's sort-by column and type, a measure's format ----
const waterfallFacts = (m) => {
  const tab = (t) => (m && Array.isArray(m.tables) ? m.tables.find((x) => x && x.name === t) : null);
  const colOf = (t, c) => { const x = tab(t); return x && Array.isArray(x.columns) ? x.columns.find((y) => y && y.name === c) : null; };
  return { sortByOf: (t, c) => { const x = colOf(t, c); return x && x.sortBy ? String(x.sortBy) : null; }, typeOf: (t, c) => { const x = colOf(t, c); return x && x.dataType ? String(x.dataType) : null; },
    formatOf: (t, n) => { const x = tab(t), me = x && Array.isArray(x.measures) ? x.measures.find((y) => y && y.name === n) : null; return me && typeof me.formatString === 'string' && me.formatString ? me.formatString : null; } };
};
const EXT_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json';

// (0.3.0 X1) a visual of the Arabic pages moved to the Arabic copy of a report measure (rename: "Entity\0name" -> the
// copy's name): the field, its queryRef and every selector naming it, and its nativeQueryRef, as Power BI names a
// measure's projection ("Entity.Name", "Name")
function rewireMeasures(vj, rename) {
  const refs = new Map();
  rename.forEach((to, k) => { const [entity, from] = k.split('\u0000'); refs.set(entity + '.' + from, { ref: entity + '.' + to, from, to }); });
  const walk = (o) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!isObj(o)) return;
    const ms = isObj(o.Measure) ? o.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
    if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) ms.Property = rename.get(src.Entity + '\u0000' + ms.Property);
    const r = typeof o.queryRef === 'string' ? refs.get(o.queryRef) : null;
    if (r && o.nativeQueryRef === r.from) o.nativeQueryRef = r.to;
    Object.keys(o).forEach((k) => { if (typeof o[k] === 'string' && refs.has(o[k])) o[k] = refs.get(o[k]).ref; else walk(o[k]); });
  };
  walk(vj);
}

// ---- the twin's pages, built in memory (the plan shows what they fit; the write writes exactly them) ----
// labels: by the mirror engine's ids (the report's own names). Returns { pages: [{ rel, page, visuals: [json] }],
// applied, ext (the twin's reportExtensions.json or null), titleMeasures, fitted }
function buildTwin(P, labels) {
  const { R } = P, opts = { timeRightToLeft: P.timeRightToLeft !== false, waterfallRtl: P.waterfallRtl, dateTables: P.dateTables, dateColumns: P.dateColumns };
  // (D1) a waterfall's measures go into the twin's own reportExtensions.json (the original's copied, or a new one), each
  // name free of the model's and the report's; the same DAX in the same table is one measure
  const wfWritten = [];
  opts.waterfall = Object.assign(waterfallFacts(P.model), { theme: R.theme, extMeasure: (t, want, expression, dataType, formatString) => {
    if (!ext) ext = { $schema: EXT_SCHEMA, name: 'extension', entities: [] };
    let e = ext.entities.find((x) => isObj(x) && x.name === t); if (!e) ext.entities.push(e = { name: t, measures: [] }); if (!Array.isArray(e.measures)) e.measures = [];
    const had = wfWritten.find((x) => x.t === t && x.expression === expression); if (had) return had.m;
    const names = takenAnywhere(); let m = want; for (let k = 2; names.has(m.toLowerCase()); k++) m = want + ' (' + k + ')';
    e.measures.push(Object.assign({ name: m, dataType, expression }, formatString ? { formatString } : {})); wfWritten.push({ t, m, expression }); return m; } });
  const TC = P.R.theme && isObj(P.R.theme.textClasses) ? P.R.theme.textClasses : {}, lab = isObj(TC.label) ? TC.label : {};
  const ctx = { text: { labelSize: +lab.fontSize || 10, font: lab.fontFace || 'Segoe UI' }, theme: R.theme };
  let applied = 0;
  // the title measures: the twin's own Arabic ones, named "Title AR: ...", beside the original's (which stay as they are)
  const tms = titleMeasuresOf(R), rename = new Map(), written = [];
  let ext = R.ext ? JSON.parse(JSON.stringify(R.ext)) : null;
  // (D1: a measure's name is unique across the whole model, report measures included, without case (writer P3): the
  // waterfall's names are checked against every table's and every report measure's)
  const takenAnywhere = () => new Set([].concat(...((ext && ext.entities) || []).map((e) => (isObj(e) && Array.isArray(e.measures) ? e.measures.map((x) => (isObj(x) ? x.name : '')) : [])),
    ...((P.model && P.model.tables) || []).map((t) => (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)))).map((n) => String(n).toLowerCase()));
  const taken = (entity) => { const e = ext.entities.find((x) => isObj(x) && x.name === entity), t = P.model && (P.model.tables || []).find((x) => x.name === entity);
    return new Set([].concat((e && Array.isArray(e.measures) ? e.measures : []).map((x) => isObj(x) ? x.name : ''), t ? (t.columns || []).map((c) => c.name).concat((t.measures || []).map((c) => c.name)) : []).map((n) => String(n).toLowerCase())); };
  tms.filter((x) => x.pd.branches && ext).forEach((x) => {
    const ls = x.pd.branches.map((b) => (labels['titleText:' + b.template] != null ? labels['titleText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), base = /^Title: /.test(x.name) ? 'Title AR: ' + x.name.slice(7) : 'Title AR: ' + x.name, names = taken(x.entity);
    let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
    e.measures.push(Object.assign(JSON.parse(JSON.stringify(x.measure)), { name, expression: arabicDax(x.pd, ls) }));
    rename.set(x.entity + '\u0000' + x.name, name); written.push(safeName(x.entity + '[' + name + ']'));
  });
  // (0.3.0 D3) the report's other text measures a visual shows (the empty state): rewritten in the twin's own copy of
  // reportExtensions.json (the original's file is only read), each text as approved
  let rewritten = 0;
  // (0.3.0 X1) both languages in one report: the English pages keep the measure as it is, the Arabic pages get their own
  // ("No data AR: ..."), each name free as the waterfall's are, and their visuals are moved to it (textRename)
  const textRename = new Map();
  if (ext) textMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => {
    const ls = x.pd.branches.map((b) => (b.template && labels['measureText:' + b.template] != null ? labels['measureText:' + b.template] : null));
    if (ls.every((l) => l == null)) return;
    const e = ext.entities.find((y) => isObj(y) && y.name === x.entity), m = e && Array.isArray(e.measures) ? e.measures.find((y) => isObj(y) && y.name === x.name) : null;
    if (!m) return;
    if (P.same) {
      const base = /^No data: /.test(x.name) ? 'No data AR: ' + x.name.slice(9) : x.name + ' AR', names = takenAnywhere();
      let name = base; for (let k = 2; names.has(name.toLowerCase()); k++) name = base + ' (' + k + ')';
      e.measures.push(Object.assign(JSON.parse(JSON.stringify(m)), { name, expression: arabicDax(x.pd, ls) }));
      textRename.set(x.entity + '\u0000' + x.name, name);
    } else m.expression = arabicDax(x.pd, ls);
    rewritten++; applied++;
  });
  const fitted = { buttons: [], buttonsCut: [], headers: [], headersCut: [] }, phone = { tabs: [], tabsCut: [], pages: 0 };
  const pages = R.pages.map((pg) => {
    let page = pg.page;
    if (isObj(pg.page)) { page = JSON.parse(JSON.stringify(pg.page)); if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; } }
    // (T-1: a page drawn on a picture is copied left to right unless asked; its texts still take the approved labels)
    const r = P.keepLtr(pg) ? { visuals: pg.visuals.map((v) => JSON.parse(JSON.stringify(v.json))) } : Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    r.visuals.forEach((vj) => {
      applied += Mirror.labelVisual(pg.id, vj, labels);
      if (textRename.size) rewireMeasures(vj, textRename);
      const t = isObj(vj) && isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) && Array.isArray(vj.visual.visualContainerObjects.title) ? vj.visual.visualContainerObjects.title : [];
      t.forEach((e) => { const ms = isObj(e) && isObj(e.properties) && isObj(e.properties.text) && isObj(e.properties.text.expr) && isObj(e.properties.text.expr.Measure) ? e.properties.text.expr.Measure : null, src = ms && isObj(ms.Expression) && isObj(ms.Expression.SourceRef) ? ms.Expression.SourceRef : null;
        if (src && src.Schema === 'extension' && rename.has(src.Entity + '\u0000' + ms.Property)) { ms.Property = rename.get(src.Entity + '\u0000' + ms.Property); applied++; } });
    });
    // (the fitting reads and changes only the twin's copies)
    if (isObj(page)) {
      const c = Object.assign({}, ctx, { rtl: !P.keepLtr(pg) }), origByName = Object.fromEntries(pg.visuals.map((v) => [v.json.name, v.json]));
      try { const b = fitButtons(page, r.visuals, c, pg.id); fitted.buttons.push(...b.buttons); fitted.buttonsCut.push(...b.buttonsCut); } catch (e) { /* a shape not expected: left as it is */ }
      try { const h = fitHeaders(page, r.visuals, origByName, c, pg.id); fitted.headers.push(...h.headers); fitted.headersCut.push(...h.headersCut); } catch (e) { /* a shape not expected: left as it is */ }
    }
    // (0.3.0 D3) the phone layout: mirrored as the page is (a page kept left to right keeps its phone layout too), its
    // texts as approved, each page tab as wide as its Arabic name by the writer's own rule
    const mobiles = pg.visuals.map((v, i) => { if (!v.mobile) return null;
      const m = P.keepLtr(pg) ? JSON.parse(JSON.stringify(v.mobile.json)) : Mirror.mirrorMobile(v.json, v.mobile.json);
      applied += Mirror.labelMobile(pg.id, r.visuals[i], m, labels); return m; });
    if (mobiles.some(Boolean)) { phone.pages++; if (!P.keepLtr(pg)) { try { fitPhoneTabs(pg, r.visuals, mobiles, ctx, phone); } catch (e) { /* a shape not expected: left as it is */ } } }
    return { pg, page, visuals: r.visuals, mobiles };
  });
  const notTranslated = tms.filter((x) => !x.pd.branches).map((x) => ({ what: 'Chart title (from a title measure)', measure: safeName(x.entity + '[' + x.name + ']'), why: x.pd.why }));
  // (0.3.0 D3) the original's own title measures the twin's charts no longer use: left in the twin's file as they are
  // (X1: in one report the English pages still show them)
  const notShown = P.same ? [] : [...rename.keys()].map((k) => { const [entity, name] = k.split('\u0000'); return { measure: safeName(entity + '[' + name + ']'), now: safeName(entity + '[' + rename.get(k) + ']'), why: 'the original\'s title measure: the twin\'s charts use their own Arabic one instead; left in the twin\'s reportExtensions.json as it is, and no visual of the twin shows it' }; });
  return { pages, applied, phone, notShown, ext: written.length || rewritten || wfWritten.length ? ext : null, fitted, titleMeasures: tms.length ? { measures: tms.length, translated: written.length, written, notTranslated } : null, waterfallMeasures: wfWritten.map((x) => safeName(x.t + '[' + x.m + ']')), textMeasures: [...textRename].map(([k, to]) => ({ measure: safeName(k.split('\u0000')[0] + '[' + k.split('\u0000')[1] + ']'), arabic: safeName(k.split('\u0000')[0] + '[' + to + ']') })) };
}

// ---- (0.3.0 X1, the owner, 19 Oct: "add the toggle") English and Arabic in ONE report: the copy "<name> (EN-AR)" ----
// The copy holds the original's files as they are (the English pages), and beside them each page's Arabic page exactly as
// the twin builds it (buildTwin). The Arabic pages get new page ids, visual names and bookmark names (hashes of the
// original's, so the plan and the write give the same; never one the report has), and every link of theirs (page buttons,
// tooltip pages, drillthrough, bookmarks) goes to the Arabic one. Each page gets a language button to its counterpart; each
// slicer pair one sync group (visual.syncGroup, the visualConfiguration schema's VisualSyncGroup); the counterpart
// language's pages are hidden from the tabs (HiddenInViewMode). The original is only read.
// a report's .platform as create_report writes it (pbip-export.js): its type, its name, a new logical id
const newPlatform = (name) => json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/gitIntegration/platformProperties/2.0.0/schema.json', metadata: { type: 'Report', displayName: name }, config: { version: '2.0', logicalId: crypto.randomUUID() } });
export const COPY_TAG = ' (EN-AR)';
const LANG = { en: { text: 'العربية', alt: 'Show this page in Arabic', on: 'English' }, ar: { text: 'English', alt: 'اعرض هذه الصفحة بالإنجليزية', on: 'Arabic' } };
const VC_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
const MOBILE_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainerMobileState/2.1.0/schema.json';
const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
const litStr = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const Lv = (v) => ({ expr: { Literal: { Value: v } } }), Ls = (t) => Lv("'" + String(t).replace(/'/g, "''") + "'");
const linkOf = (v) => { const vco = isObj(v) && isObj(v.visual) && isObj(v.visual.visualContainerObjects) ? v.visual.visualContainerObjects : {}; return (Array.isArray(vco.visualLink) ? vco.visualLink : []).find((e) => isObj(e) && isObj(e.properties) && !e.selector) || null; };
const isPageBtn = (v) => typeOf(v) === 'actionButton' && litStr((linkOf(v) || { properties: {} }).properties.type) === 'PageNavigation';
const overlaps = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
const holdsBox = (a, b) => a.x <= b.x + 0.5 && a.x + a.width >= b.x + b.width - 0.5 && a.y <= b.y + 0.5 && a.y + a.height >= b.y + b.height - 0.5;
// a visual's box on the page (a grouped visual's position is relative to its group, groups inside groups too)
const absBox = (visuals, v) => { const p = posOf(v); if (!p) return null; let x = p.x, y = p.y, g = v; for (let n = 0; g && g.parentGroupName != null && n < 20; n++) { g = visuals.find((u) => isObj(u) && u.name === g.parentGroupName); const q = g && posOf(g); if (!q) break; x += q.x; y += q.y; } return { x, y, width: p.width, height: p.height }; };
// new names: 20 hex digits of a hash of what they stand for, never one already taken (the same names at the plan and the write)
function idMaker(taken) { const used = new Set([...taken].map((x) => String(x).toLowerCase())); return (seed) => { for (let k = 0; ; k++) { const id = crypto.createHash('sha256').update('dataarcus-en-ar\u0000' + seed + (k ? '\u0000' + k : '')).digest('hex').slice(0, 20); if (!used.has(id)) { used.add(id); return id; } } }; }
const textLook = (v) => { const es = isObj(v) && isObj(v.visual) && isObj(v.visual.objects) && Array.isArray(v.visual.objects.text) ? v.visual.objects.text.filter((e) => isObj(e) && isObj(e.properties)) : [];
  const d = es.find((e) => isObj(e.selector) && e.selector.id === 'default') || es.find((e) => !e.selector) || { properties: {} };
  return { size: parseFloat(litStr(d.properties.fontSize)), font: litStr(d.properties.fontFamily), bold: litStr(d.properties.bold) === 'true' }; };

// The language button of a page: its look is the page's own page tab's (one not bold, the tabs' other pages), else a plain
// button; its text on one line by the measured rules (the larger of 0.45 em a character and the page button's letter by
// letter measure: report-rules.js, as check_report measures it), as high as the tab; the show switch of each card in its
// own entry with no selector, the look with selector default (mcp/CLAUDE.md). It goes where it covers no visual (a visual
// holding it whole, the header's band, is its panel): the tabs' group (else the top of the page), from its end, the right on
// an English page, the left on an Arabic page. On the phone (when the page has a phone layout): the tabs' row, as wide as
// the writer's phone tab rule (phoneTabWidth), from the same end. Returns { json, mobile, phone, why } or { json: null, why }
// (0.3.1 R1: a real user's report without page tabs drew its 4 language buttons as empty white boxes) the plain button
// sets what every button DataArcus writes sets (pbip-page.js: the tabs, Reset, Open and Close filters): its text colour,
// and its container's background, border and shadow off. Left unset, the text took Power BI's own button colour (a theme
// default: Microsoft's "Create custom report themes", structural colours) over the theme's white visual panel. The text
// is the theme's own text colour, at 4.5:1 against the page behind the button (else Power BI's dark or white text,
// whichever reads); the outline the same colour. No text margins: Desktop ignored them (round 13, DESKTOP-TESTS.md)
const HEX = /^#[0-9a-f]{6}$/i, hexOf = (c) => (typeof c === 'string' && HEX.test(c) ? c : isObj(c) && isObj(c.solid) ? hexOf(typeof c.solid.color === 'string' ? c.solid.color : litStr(c.solid.color)) : null);
function plainLook(page, theme) {
  const th = isObj(theme) ? theme : {}, tc = isObj(th.textClasses) && isObj(th.textClasses.label) ? th.textClasses.label : {};
  const pageBg = (() => { const o = isObj(page) && isObj(page.objects) && Array.isArray(page.objects.background) ? page.objects.background.find((e) => isObj(e) && isObj(e.properties) && !e.selector) : null; return o ? hexOf(o.properties.color) : null; })();
  const vs = isObj(th.visualStyles) && isObj(th.visualStyles.page) && isObj(th.visualStyles.page['*']) && Array.isArray(th.visualStyles.page['*'].background) ? th.visualStyles.page['*'].background[0] : null;
  const bg = pageBg || (isObj(vs) ? hexOf(vs.color) : null) || hexOf(th.background) || '#FFFFFF';
  const want = hexOf(th.foreground) || hexOf(th.firstLevelElements) || hexOf(tc.color) || '#252423';
  const text = Engine.contrast(want, bg) >= 4.5 ? want : (Engine.contrast('#252423', bg) >= Engine.contrast('#FFFFFF', bg) ? '#252423' : '#FFFFFF');
  return { text, bg };
}
const solid = (c) => ({ solid: { color: Lv("'" + c + "'") } });
function langButton(page, visuals, mobiles, lang, target, name, theme) {
  const W = LANG[lang], pw = isObj(page) && Number.isFinite(page.width) ? page.width : 1280, ph = isObj(page) && Number.isFinite(page.height) ? page.height : 720;
  const tabs = visuals.filter((v) => isObj(v) && isObj(v.visual) && isPageBtn(v) && posOf(v));
  const tpl = tabs.find((v) => !textLook(v).bold) || tabs[0] || null, look = tpl ? textLook(tpl) : {};
  const t = Number.isFinite(look.size) ? look.size : Math.max(8, Math.round(14 * ph / 1080)), font = look.font || 'Segoe UI';
  let btn;
  if (tpl) {
    btn = clone(tpl); delete btn.parentGroupName; delete btn.filterConfig;
    const o = btn.visual.objects;
    // the show switch alone, without a selector; no show inside a selector (Desktop ignores it there)
    o.text = (Array.isArray(o.text) ? o.text : []).filter((e) => isObj(e) && isObj(e.properties));
    o.text.forEach((e) => { if (e.selector) delete e.properties.show; });
    o.text = o.text.filter((e) => Object.keys(e.properties).length);
    if (!o.text.some((e) => !e.selector && 'show' in e.properties)) o.text.unshift({ properties: { show: Lv('true') } });
    let d = o.text.find((e) => isObj(e.selector) && e.selector.id === 'default'); if (!d) o.text.push(d = { properties: {}, selector: { id: 'default' } });
    Object.assign(d.properties, { text: Ls(W.text), bold: Lv('false') });
  } else {
    const c = plainLook(page, theme).text, offs = { background: [{ properties: { show: Lv('false') } }], border: [{ properties: { show: Lv('false') } }], dropShadow: [{ properties: { show: Lv('false') } }] };
    btn = { $schema: VC_SCHEMA, name, position: {}, visual: { visualType: 'actionButton', objects: { icon: [{ properties: { shapeType: Ls('blank') }, selector: { id: 'default' } }],
      text: [{ properties: { show: Lv('true') } }, { properties: { text: Ls(W.text), fontColor: solid(c), fontFamily: Ls(font), fontSize: Lv(t + 'D') }, selector: { id: 'default' } }],
      fill: [{ properties: { show: Lv('false') } }], outline: [{ properties: { show: Lv('true') } }, { properties: { lineColor: solid(c) }, selector: { id: 'default' } }] }, visualContainerObjects: Object.assign({ title: [{ properties: { show: Lv('false') } }] }, offs) } };
  }
  btn.name = name;
  const vco = btn.visual.visualContainerObjects = isObj(btn.visual.visualContainerObjects) ? btn.visual.visualContainerObjects : {};
  vco.general = [{ properties: { altText: Ls(W.alt) } }];
  vco.visualLink = [{ properties: { show: Lv('true'), type: Ls('PageNavigation'), navigationSection: Ls(target) } }];
  delete vco.visualTooltip;
  const need = Rules.buttonNeed({ json: btn, type: 'actionButton', h: 0, w: 0 }, { labelSize: t, font });
  const w = Math.max(need ? need.one : 0, Math.ceil(Rules.MEASURED.BTN_TW(t, [...W.text].length))), h = Math.max(tpl ? posOf(tpl).height : 0, need ? need.needH : Rules.MEASURED.BTN_H(t));
  // where: the tabs' group (else the page), at the tabs' height (else near the top), from its end
  const g = tpl && tpl.parentGroupName != null ? visuals.find((v) => isObj(v) && v.name === tpl.parentGroupName && posOf(v)) : null;
  const room = g ? posOf(g).width : pw, y = tpl ? posOf(tpl).y : Math.round(8 * ph / 720), off = g ? absBox(visuals, g) : { x: 0, y: 0 };
  const obst = visuals.filter((v) => isObj(v) && !isObj(v.visualGroup) && posOf(v)).map((v) => absBox(visuals, v)).filter(Boolean);
  const free = (x) => { const A = { x: off.x + x, y: off.y + y, width: w, height: h }; return A.x >= -0.5 && A.x + w <= pw + 0.5 && A.y >= -0.5 && A.y + h <= ph + 0.5 && !obst.some((b) => overlaps(b, A) && !holdsBox(b, A)); };
  const xs = []; for (let x = Math.floor(room - w); x >= 0; x--) xs.push(x); if (lang === 'ar') xs.reverse();
  const x = xs.find(free);
  if (x == null) return { json: null, why: `no free place ${w} x ${h} at the ${lang === 'ar' ? 'left' : 'right'} end of ${g ? 'the header (the page tabs\' group)' : 'the top of the page'}: the page is written without it; add the button by hand` };
  const zs = visuals.filter((v) => posOf(v)).map((v) => posOf(v)), top = (k) => Math.max(0, ...zs.map((p) => (Number.isFinite(p[k]) ? p[k] : 0)));
  btn.position = { x, y, z: top('z') + 1000, height: h, width: w, tabOrder: top('tabOrder') + 1000 };
  if (g) btn.parentGroupName = g.name;
  const at = g ? `the ${lang === 'ar' ? 'left' : 'right'} end of the header, beside the page tabs` : `the top ${lang === 'ar' ? 'left' : 'right'} of the page`;
  // the phone
  if (!mobiles.some(Boolean)) return { json: btn, mobile: null, phone: false, at, why: 'the page has no phone layout' };
  const ptabs = tabs.map((v) => mobiles[visuals.indexOf(v)]).filter((m) => m && posOf(m)), mt = (tpl && mobiles[visuals.indexOf(tpl)] && posOf(mobiles[visuals.indexOf(tpl)])) ? mobiles[visuals.indexOf(tpl)] : ptabs[0];
  if (!mt) return { json: btn, mobile: null, phone: false, at, why: 'the phone layout has no page tabs to sit beside: the button is on the page only' };
  const PW = Mirror.PHONE_W, my = posOf(mt).y, mh = posOf(mt).height, mw = Math.min(PW, Sizing.phoneTabWidth(W.text, font));
  const mob = visuals.map((v, i) => (isObj(v) && !isObj(v.visualGroup) && mobiles[i] && posOf(mobiles[i]) ? posOf(mobiles[i]) : null)).filter(Boolean);
  const mfree = (x0) => { const A = { x: x0, y: my, width: mw, height: mh }; return !mob.some((b) => overlaps(b, A)); };
  const mxs = []; for (let x0 = Math.floor(PW - mw); x0 >= 0; x0--) mxs.push(x0); if (lang === 'ar') mxs.reverse();
  const mx = mxs.find(mfree);
  if (mx == null) return { json: btn, mobile: null, phone: false, at, why: `no free place ${mw} wide in the phone layout's tab row: the button is on the page only` };
  const mz = mobiles.filter((m) => m && posOf(m)).map(posOf), mtop = (k) => Math.max(0, ...mz.map((p) => (Number.isFinite(p[k]) ? p[k] : 0)));
  const mobile = Object.assign(clone(mt), { position: { x: mx, y: my, z: mtop('z') + 1000, width: mw, height: mh, tabOrder: mtop('tabOrder') + 1000 } });
  if (!mobile.$schema) mobile.$schema = MOBILE_SCHEMA;
  // the group's phone box holds what is in it (a grouped visual's phone position is a page position)
  if (g) { const gi = visuals.indexOf(g), gb = mobiles[gi] && posOf(mobiles[gi]); if (gb) { const x0 = Math.min(gb.x, mx), x1 = Math.max(gb.x + gb.width, mx + mw), y0 = Math.min(gb.y, my), y1 = Math.max(gb.y + gb.height, my + mh); Object.assign(gb, { x: x0, width: x1 - x0, y: y0, height: y1 - y0 }); } }
  return { json: btn, mobile, phone: true, at };
}

// P: the plan's own (R, keepLtr, tabsShown); built: buildTwin's; labels: by the mirror engine's ids. Returns the copy as
// a list of files { rel, data } (data: the bytes to write, or from: the original's file copied as it is), and what the
// plan says: pairs, buttons, syncGroups, bookmarks, tabs
function languageCopy(P, built, labels) {
  const { R, loc } = P, tabsShown = P.tabsShown === 'ar' ? 'ar' : 'en', hidden = 'HiddenInViewMode';
  const newId = idMaker([].concat(R.pages.map((pg) => pg.id), ...R.pages.map((pg) => pg.visuals.map((v) => v.json.name)), R.bookmarks.map((b) => b.json.name)));
  const arOf = new Map(R.pages.map((pg) => [String(pg.id), newId('page\u0000' + pg.id)])), names = new Map();
  R.pages.forEach((pg) => names.set(String(pg.id), new Map(pg.visuals.map((v) => [String(v.json.name), newId('visual\u0000' + arOf.get(String(pg.id)) + '\u0000' + v.json.name)]))));
  const bmOf = new Map(R.bookmarks.map((b) => [String(b.json.name), newId('bookmark\u0000' + b.json.name)]));
  const changed = new Map(), added = [], pairs = [], buttons = [], syncGroups = [];
  const jsonEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // an Arabic visual's names and links: its own name and group, its page links, tooltip pages, drillthrough and bookmarks
  // (Microsoft's validator, PBIR_FILTER_NAME_DUPLICATE_GLOBAL: a filter's name is unique across the report) each filter of
  // an Arabic page or visual gets its own name, by page (fm: old name -> new), which its bookmarks follow
  const filtersOf = new Map();
  const renameFilters = (o, arId, owner) => { const fs0 = isObj(o) && isObj(o.filterConfig) && Array.isArray(o.filterConfig.filters) ? o.filterConfig.filters : [];
    if (!filtersOf.has(arId)) filtersOf.set(arId, new Map()); const fm = filtersOf.get(arId);
    fs0.forEach((f) => { if (isObj(f) && f.name != null) { const to = newId('filter\u0000' + arId + '\u0000' + owner + '\u0000' + f.name); fm.set(String(f.name), to); f.name = to; } }); };
  const remap = (vj, nm) => {
    if (!isObj(vj)) return;
    if (vj.name != null && nm.has(String(vj.name))) vj.name = nm.get(String(vj.name));
    if (vj.parentGroupName != null && nm.has(String(vj.parentGroupName))) vj.parentGroupName = nm.get(String(vj.parentGroupName));
    const vco = isObj(vj.visual) && isObj(vj.visual.visualContainerObjects) ? vj.visual.visualContainerObjects : null;
    if (vco) ['visualLink', 'visualTooltip'].forEach((k) => (Array.isArray(vco[k]) ? vco[k] : []).forEach((e) => {
      if (!isObj(e) || !isObj(e.properties)) return;
      ['navigationSection', 'section', 'drillthroughSection'].forEach((p) => { const v = litStr(e.properties[p]); if (v != null && arOf.has(v)) e.properties[p] = Ls(arOf.get(v)); });
      const b = litStr(e.properties.bookmark); if (b != null && bmOf.has(b)) e.properties.bookmark = Ls(bmOf.get(b));
    }));
  };
  let n = 0;
  built.pages.forEach(({ pg, page, visuals, mobiles }) => {
    const id = String(pg.id), arId = arOf.get(id), nm = names.get(id), folder = pg.rel.slice(0, pg.rel.lastIndexOf('/') + 1), arFolder = 'definition/pages/' + arId + '/';
    const P0 = pageOf(pg), tooltip = P0.type === 'Tooltip', drill = isObj(P0.pageBinding) && /drillthrough/i.test(String(P0.pageBinding.type || ''));
    // the English page: the original's, its page hidden when the Arabic tabs are the ones shown
    const enPage = isObj(pg.page) ? clone(pg.page) : pg.page, enV = pg.visuals.map((v) => clone(v.json)), enM = pg.visuals.map((v) => (v.mobile ? clone(v.mobile.json) : null));
    if (isObj(enPage) && tabsShown === 'ar') enPage.visibility = hidden;
    // the Arabic page: the twin's, under its new id, hidden when the English tabs are shown
    const arPage = isObj(page) ? clone(page) : page, arV = visuals.map((v) => clone(v)), arM = (mobiles || []).map((m) => clone(m || null));
    if (isObj(arPage)) {
      arPage.name = arId;
      if (isObj(arPage.pageBinding) && arPage.pageBinding.name != null) arPage.pageBinding.name = newId('binding\u0000' + arId);
      if (tabsShown === 'en') arPage.visibility = hidden;
      if (Array.isArray(arPage.visualInteractions)) arPage.visualInteractions.forEach((x) => { if (isObj(x)) ['source', 'target'].forEach((k) => { if (x[k] != null && nm.has(String(x[k]))) x[k] = nm.get(String(x[k])); }); });
    }
    arV.forEach((v, i) => { renameFilters(v, arId, String(pg.visuals[i] ? pg.visuals[i].json.name : i)); remap(v, nm); });
    if (isObj(arPage)) renameFilters(arPage, arId, '');
    // each slicer pair in one sync group: a group the English slicer has already, else its own
    pg.visuals.forEach((v, i) => {
      if (typeOf(enV[i]) !== 'slicer' || !isObj(arV[i]) || !isObj(arV[i].visual)) return;
      const has = isObj(enV[i].visual.syncGroup) && typeof enV[i].visual.syncGroup.groupName === 'string' && enV[i].visual.syncGroup.groupName;
      const ps = isObj(enV[i].visual.query) && isObj(enV[i].visual.query.queryState) ? Object.values(enV[i].visual.query.queryState).flatMap((r) => (isObj(r) && Array.isArray(r.projections) ? r.projections : [])) : [];
      const q = ps.map((p) => (isObj(p) && typeof p.queryRef === 'string' ? p.queryRef : '')).find(Boolean) || 'Slicer';
      if (!has) enV[i].visual.syncGroup = { groupName: `${q.slice(0, 80)} (EN-AR ${++n})`, fieldChanges: true, filterChanges: true };
      arV[i].visual.syncGroup = clone(enV[i].visual.syncGroup);
      syncGroups.push({ page: safeName(typeof P0.displayName === 'string' ? P0.displayName : id), slicer: safeName(String(v.json.name)), arabicSlicer: nm.get(String(v.json.name)), group: safeName(enV[i].visual.syncGroup.groupName), ...(has ? { kept: 'the English slicer\'s own sync group: its Arabic copy joins it' } : {}) });
    });
    // the language buttons (a tooltip or drillthrough page is reached by its visual, not by the tabs: none)
    const say = (lang, r, pageName, target) => buttons.push(Object.assign({ page: safeName(pageName), on: LANG[lang].on, text: LANG[lang].text, goesTo: target, placed: !!r.json }, r.json ? { at: r.at, phone: r.phone } : {}, r.why ? { why: r.why } : {}));
    if (!tooltip && !drill) {
      const en = langButton(enPage, enV, enM, 'en', arId, newId('button\u0000' + id), R.theme);
      if (en.json) { enV.push(en.json); enM.push(en.mobile); added.push({ rel: folder + 'visuals/' + en.json.name + '/visual.json', data: json(en.json) }); if (en.mobile) added.push({ rel: folder + 'visuals/' + en.json.name + '/mobile.json', data: json(en.mobile) }); }
      say('en', en, typeof P0.displayName === 'string' ? P0.displayName : id, arId);
      const ar = langButton(arPage, arV, arM, 'ar', id, newId('button\u0000' + arId), R.theme);
      if (ar.json) { arV.push(ar.json); arM.push(ar.mobile); added.push({ rel: arFolder + 'visuals/' + ar.json.name + '/visual.json', data: json(ar.json) }); if (ar.mobile) added.push({ rel: arFolder + 'visuals/' + ar.json.name + '/mobile.json', data: json(ar.mobile) }); }
      say('ar', ar, isObj(arPage) && typeof arPage.displayName === 'string' ? arPage.displayName : arId, id);
    }
    // the English files that changed (the slicers' sync group, a group's phone box grown, the page hidden)
    if (isObj(enPage) && !jsonEq(enPage, pg.page)) changed.set(pg.rel, json(enPage));
    pg.visuals.forEach((v, i) => { if (!jsonEq(enV[i], v.json)) changed.set(v.rel, json(enV[i])); if (v.mobile && !jsonEq(enM[i], v.mobile.json)) changed.set(v.mobile.rel, json(enM[i])); });
    // the Arabic page's files: every file of the English page's folder, under the new page id and visual names
    const folderOf = new Map(pg.visuals.map((v, i) => [v.rel.split('/')[4], i]));
    R.files.filter((f) => f.startsWith(folder)).forEach((f) => {
      const segs = f.split('/'), i = segs[3] === 'visuals' && folderOf.has(segs[4]) ? folderOf.get(segs[4]) : -1;
      segs[2] = arId; if (i >= 0) segs[4] = nm.get(String(pg.visuals[i].json.name));
      const rel = segs.join('/');
      if (f === pg.rel && isObj(arPage)) added.push({ rel, data: json(arPage) });
      else if (i >= 0 && f === pg.visuals[i].rel) added.push({ rel, data: json(arV[i]) });
      else if (i >= 0 && pg.visuals[i].mobile && f === pg.visuals[i].mobile.rel && arM[i]) added.push({ rel, data: json(arM[i]) });
      else added.push({ rel, from: f });
    });
    const shown = (pgj) => !(isObj(pgj) && pgj.visibility === hidden);
    pairs.push(Object.assign({ english: { id: safeName(id), name: safeName(typeof P0.displayName === 'string' ? P0.displayName : ''), hidden: !shown(enPage) },
      arabic: { id: arId, name: safeName(isObj(arPage) && typeof arPage.displayName === 'string' ? arPage.displayName : ''), hidden: !shown(arPage) } }, tooltip ? { tooltip: true } : {}, drill ? { drillthrough: true } : {}));
  });
  // the bookmarks: an Arabic copy of each (its pages and visuals the Arabic ones, its name as approved), listed after the English
  const BM = 'definition/bookmarks/bookmarks.json';
  R.bookmarks.forEach((b) => {
    const j = clone(b.json), key = String(b.json.name), es = isObj(j.explorationState) ? j.explorationState : null, act = es && es.activeSection != null ? String(es.activeSection) : '';
    if (labels['bookmark:' + key] != null) j.displayName = labels['bookmark:' + key];
    j.name = bmOf.get(key);
    if (es) {
      if (arOf.has(act)) es.activeSection = arOf.get(act);
      // the filters it names (by name, in "byName" lists) are the Arabic page's own
      const byName = (o, fm) => { if (Array.isArray(o)) { o.forEach((x) => byName(x, fm)); return; } if (!isObj(o)) return; Object.keys(o).forEach((k) => { if (k === 'byName' && isObj(o[k])) o[k] = Object.fromEntries(Object.entries(o[k]).map(([fn, v]) => [fm.has(fn) ? fm.get(fn) : fn, v])); byName(o[k], fm); }); };
      if (isObj(es.sections)) Object.entries(es.sections).forEach(([k, sec]) => { if (arOf.has(k)) byName(sec, filtersOf.get(arOf.get(k)) || new Map()); });
      if (isObj(es.sections)) es.sections = Object.fromEntries(Object.entries(es.sections).map(([k, sec]) => { const m = names.get(k) || new Map();
        if (isObj(sec)) ['visualContainers', 'visualContainerGroups'].forEach((x) => { if (isObj(sec[x])) sec[x] = Object.fromEntries(Object.entries(sec[x]).map(([vn, v]) => [m.has(vn) ? m.get(vn) : vn, v])); });
        return [arOf.has(k) ? arOf.get(k) : k, sec]; }));
    }
    if (isObj(j.options) && Array.isArray(j.options.targetVisualNames)) { const m = names.get(act) || new Map(); j.options.targetVisualNames = j.options.targetVisualNames.map((x) => (m.has(String(x)) ? m.get(String(x)) : x)); }
    added.push({ rel: b.rel.replace(/[^/]+$/, j.name + '.bookmark.json'), data: json(j) });
  });
  if (R.bookmarks.length && R.files.includes(BM)) { try { const j = readJson(path.join(loc.dir, ...BM.split('/'))); if (isObj(j) && Array.isArray(j.items)) {
    const item = (it) => (!isObj(it) ? it : Array.isArray(it.children) ? Object.assign(clone(it), { name: newId('bookmarkGroup\u0000' + it.name), children: it.children.map((c) => bmOf.get(String(c)) || c) }) : Object.assign(clone(it), { name: bmOf.get(String(it.name)) || it.name }));
    j.items = j.items.concat(j.items.map(item)); changed.set(BM, json(j)); } } catch (e) { /* not JSON: copied as it is */ } }
  // pages.json: the English pages, then the Arabic ones in the same order; the first page opened in the language shown
  const PJ = 'definition/pages/pages.json';
  let activePage = null;
  if (R.files.includes(PJ)) { try { const j = readJson(path.join(loc.dir, ...PJ.split('/'))); if (isObj(j)) {
    const order = Array.isArray(j.pageOrder) ? j.pageOrder.map(String) : R.pages.map((pg) => String(pg.id));
    j.pageOrder = order.concat(order.filter((x) => arOf.has(x)).map((x) => arOf.get(x)));
    const first = j.activePageName != null && arOf.has(String(j.activePageName)) ? String(j.activePageName) : order.find((x) => arOf.has(x) && !(pairs.find((p) => p.english.id === safeName(x)) || {}).tooltip);
    if (tabsShown === 'ar' && first) j.activePageName = arOf.get(first);
    activePage = j.activePageName != null ? safeName(String(j.activePageName)) : null;
    changed.set(PJ, json(j)); } } catch (e) { /* not JSON: copied as it is */ } }
  if (built.ext) changed.set(EXT, json(built.ext));
  if (R.hasPlatform) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + COPY_TAG }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); changed.set('.platform', json(pl)); }
  // (0.3.0 A1) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the twin writes its own, as create_report does
  else changed.set('.platform', newPlatform(loc.base + COPY_TAG));
  const files = R.files.map((rel) => (changed.has(rel) ? { rel, data: changed.get(rel) } : { rel, from: rel })).concat(R.hasPlatform ? [] : [{ rel: '.platform', data: changed.get('.platform') }], built.ext && !R.files.includes(EXT) ? [{ rel: EXT, data: json(built.ext) }] : [], added);
  const anyNav = R.pages.some((pg) => pg.visuals.some((v) => Mirror.kindOf(v.json) === 'navigator')), anyBmNav = R.pages.some((pg) => pg.visuals.some((v) => typeOf(v.json) === 'bookmarkNavigator'));
  const notes = [].concat(anyNav ? ['A page navigator lists the pages shown in the tabs only: on an Arabic page it lists the English pages (use page buttons there)'] : [], anyBmNav ? ['A bookmark navigator lists every bookmark: the English and the Arabic ones'] : [],
    R.bookmarks.length ? ['A bookmark group keeps its name in its Arabic copy (bookmarks.json)'] : []);
  const EN = LANG.en.text;
  const tabs = tabsShown === 'en'
    ? { shown: 'the English pages, as in the original', hidden: `the Arabic pages (hidden in the tabs): each English page's «${EN}» button opens its Arabic page, whose "English" button goes back`, tooltipPages: 'stay hidden in both languages',
      service: `In the Power BI service (and Desktop's reading view) a reader sees one tab per English page; the Arabic pages are not in the page list and are reached by the «${EN}» button, and "English" brings the reader back. In Desktop's editing view every page is listed, the hidden ones marked hidden.` }
    : { shown: 'the Arabic pages (the report opens on the first Arabic page)', hidden: `the English pages (hidden in the tabs): each Arabic page's "English" button opens its English page, whose «${EN}» button goes back`, tooltipPages: 'stay hidden in both languages',
      service: `In the Power BI service (and Desktop's reading view) a reader sees one tab per Arabic page; the English pages are not in the page list and are reached by the "English" button, and «${EN}» brings the reader back. In Desktop's editing view every page is listed, the hidden ones marked hidden.` };
  return { files, pairs, buttons, syncGroups, bookmarks: R.bookmarks.length, activePage, tabs, notes, tabsShown };
}

// ---- the plan ----
const sortKeys = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, String(o[k])]));
// (0.3.0 J18) terms as a plan pins them: keys as Table[Field], each name as written (writtenName)
const normTerms = (t) => sortKeys(Object.fromEntries(Object.entries(t || {}).map(([k, v]) => { const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? [`${mk[1]}[${mk[2]}]`, cleanLabel(v, `terms: ${String(k)}`)] : null; }).filter(Boolean)));
const cleanLabel = (s, id) => writtenName(s, `labels: ${visible(id).slice(0, 160)}`).slice(0, TEXT_CAP);
export function twinKey(p) { const { dir } = locate(p); try { return fs.realpathSync.native(dir); } catch (e) { return dir; } }

// (0.3.0 D3) a text of the new kinds with no label of its own takes the approved Arabic of the same text, shown in the
// plan (labelFrom) and pinned with it, as a page button takes its page's (B-138): a phone copy the label of the page's
// same text on the same visual, an alt text, a card's blank text or a tooltip that of any listed text with exactly
// its words (a chart's alt text is its title). A label given for it wins; a text with {n} is never shared
const SHARED = new Set(['altText', 'blankText', 'buttonTooltip', 'text']);
const KIND_SAID = { page: 'page name', title: 'title', textbox: 'text box', button: 'button', field: 'field name', bookmark: 'bookmark', titleMeasure: 'chart title', measureText: 'measure text', altText: 'alt text', blankText: 'text for no data', buttonTooltip: 'button tooltip', text: 'text' };
function sameTextLabels(texts, labels) {
  const key = (t) => (t.text != null && !/\{\d+\}/.test(t.raw) ? t.raw.trim() : null), byText = new Map();
  const learn = (t) => { const k = key(t); if (k && labels[t.id] != null && !byText.has(k)) byText.set(k, t); };
  texts.forEach(learn);
  const take = (t, from, said) => { labels[t.id] = labels[from.id]; t.labelFrom = said; learn(t); };
  texts.filter((t) => !t.phone && SHARED.has(t.kind) && labels[t.id] == null && key(t)).forEach((t) => { const f = byText.get(key(t)); if (f && f !== t) take(t, f, `the approved Arabic of the same text (${KIND_SAID[f.kind] || f.kind})`); });
  texts.filter((t) => t.phone && labels[t.id] == null && key(t)).forEach((t) => {
    const own = texts.find((x) => x.rawId === t.rawId.slice('phone:'.length));
    if (own && labels[own.id] != null && own.raw === t.raw) return take(t, own, 'the approved Arabic of the same text on the page');
    const f = byText.get(key(t)); if (f && f !== t) take(t, f, `the approved Arabic of the same text (${KIND_SAID[f.kind] || f.kind})`);
  });
}
// every listed text with Latin letters that the twin writes as it is (no approved Arabic), with why: one row per text
// (the same words on several visuals, a field and the alt text that repeats it, are one row: where says each kind and
// count; ids name them in texts), the why of its strongest reason
function notTranslatedOf(texts, labels, problems) {
  const rows = new Map(), RANK = ['withheld', 'problem', 'field', 'other'];
  texts.filter((t) => labels[t.id] == null && /[A-Za-z]/.test(t.raw)).forEach((t) => {
    const p = problems.find((x) => x.id === t.id);
    const [rank, why] = t.text == null ? ['withheld', 'reads like an instruction to an AI assistant: kept as it is, unless the user gives its Arabic']
      : p ? ['problem', 'its Arabic was not taken: ' + p.why]
      : t.kind === 'field' ? ['field', 'a field name with no Arabic given: Power BI shows it as the model names it (the person kept it; the model is never renamed)']
      : ['other', 'no Arabic was approved for it: the twin shows it as it is'];
    const k = t.text == null ? '\u0000' + t.id : t.text, what = (t.phone ? 'phone layout: ' : '') + (KIND_SAID[t.kind] || t.kind);
    if (!rows.has(k)) rows.set(k, { text: t.text, where: {}, ids: [], rank, why });
    const r = rows.get(k); r.where[what] = (r.where[what] || 0) + 1; r.ids.push(t.id);
    if (RANK.indexOf(rank) < RANK.indexOf(r.rank)) Object.assign(r, { rank, why });
  });
  return [...rows.values()].map((r) => ({ text: r.text, where: Object.entries(r.where).map(([w, n]) => (n > 1 ? `${w} (${n})` : w)).join(', '), why: r.why, ids: r.ids }));
}

// (0.3.0 J18, B-171) the terminology sheet of the twin: each field text's field ("Table[Field]", from the projections that
// show it), the terms the person gave (terms: { "Table[Field]": Arabic }, or the English name to keep it) or confirmed
// earlier in this session for this field of this model, unchanged since (a.memory false: none, the write's own plan).
// A term labels every header of its field (a label given for one that says it otherwise is not used: notUsing) and every
// text made of its English name ("A by B", "Top {1} of {2}: A by B", "A (B)", "A: detail", "No data: A"), the same word
// everywhere; an English name two fields share with two terms derives nothing. labels: changed in place.
function termsOf(R, texts, labels, a, m) {
  const keyOfRef = new Map();
  const walk = (o) => { if (Array.isArray(o)) return o.forEach(walk); if (!isObj(o)) return; if (Array.isArray(o.projections)) o.projections.forEach((p) => { const k = isObj(p) && typeof p.queryRef === 'string' ? Terms.fieldKeyOf(p.field) : null; if (k && !keyOfRef.has(p.queryRef)) keyOfRef.set(p.queryRef, k); }); Object.values(o).forEach(walk); };
  R.pages.forEach((pg) => pg.visuals.forEach((v) => walk(isObj(v.json) && isObj(v.json.visual) ? v.json.visual.query : null)));
  texts.forEach((t) => { if (t.kind !== 'field') return; const k = keyOfRef.get(String(t.rawId).slice('field:'.length)); if (k) { t.fieldKey = k; t.field = shownName(k, 200); } });
  const keys = [...new Set(texts.filter((t) => t.fieldKey).map((t) => t.fieldKey))];
  const enOf = (k) => new Set([k.replace(/^.*?\[(.*)\]$/, '$1')].concat(texts.filter((t) => t.fieldKey === k).map((t) => t.raw.trim())));
  const given = {}, unknown = [], term = new Map(), notUsing = [];
  Object.entries(a.terms || {}).forEach(([k, v]) => { const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/), n = mk ? `${mk[1]}[${mk[2]}]` : null; const c = cleanLabel(v, `terms: ${String(k)}`);
    if (n) given[n] = c; if (!n || !keys.includes(n)) unknown.push(visible(String(k)).slice(0, 160)); });
  const conf = a.memory === false ? new Map() : Terms.confirmedOf(m, keys.filter((k) => given[k] == null));
  keys.forEach((k) => {
    if (given[k] != null) term.set(k, enOf(k).has(given[k].trim()) ? { ar: null, status: 'kept', declined: true } : { ar: given[k], status: 'approved' });
    else if (conf.has(k)) { const c = conf.get(k); term.set(k, c.decision === 'kept' ? { ar: null, status: 'kept', declined: true, earlier: true } : { ar: c.alias, status: 'approved', earlier: true }); }
  });
  const said = () => 'the terminology sheet';
  texts.filter((t) => t.fieldKey && term.has(t.fieldKey) && term.get(t.fieldKey).ar != null).forEach((t) => {
    const ar = term.get(t.fieldKey).ar;
    if (labels[t.id] != null && labels[t.id] !== ar) notUsing.push({ id: t.id, why: 'a field\'s header takes the field\'s term: the label given for it was not used' });
    labels[t.id] = ar; t.labelFrom = said(t.fieldKey);
  });
  // the texts made of the fields' English names
  const byName = new Map(), clash = new Set();
  term.forEach((x, k) => { if (x.ar == null) return; enOf(k).forEach((n) => { const l = n.toLowerCase(); if (byName.has(l) && byName.get(l) !== x.ar) clash.add(l); else byName.set(l, x.ar); }); });
  clash.forEach((l) => byName.delete(l));
  if (byName.size) texts.forEach((t) => {
    if (t.fieldKey || t.text == null) return;
    const used = [], d = draftText(t.raw, { names: byName, used }); if (!d || !used.length) return;
    if (labels[t.id] == null) { labels[t.id] = d; t.labelFrom = said(); }
    else if (labels[t.id] !== d) notUsing.push({ id: t.id, why: `its label says the field otherwise than the sheet («${visible(d).slice(0, 120)}»): kept as the person gave it` });
  });
  // every other field's status: a label given for its header (approved), its fixed list draft (not written until it is
  // approved), or none (kept in English)
  const statuses = () => keys.forEach((k) => { if (term.has(k)) return; const ts = texts.filter((t) => t.fieldKey === k), lab = ts.map((t) => labels[t.id]).find((x) => x != null);
    if (lab != null) return term.set(k, { ar: lab, status: 'approved' });
    const dr = ts.map((t) => t.draftArabic).find(Boolean);
    term.set(k, dr ? { ar: dr, status: 'draft', why: 'a draft from the fixed list of report words: not written until the person approves it (terms)' } : { ar: null, status: 'kept' }); });
  return { keys, term, given: sortKeys(given), unknown, notUsing, statuses };
}

// (0.3.0 Q1) the twin's plan on a large report: 46,660 characters (52,412 into "same") for a two-page report with every
// option on, and the backstop halved its texts with no way to get the rest. The texts are cut to fit, from textsFrom, with
// where the rest starts (moreTexts); notTranslated (said in the plan before the go) is cut only when the texts alone can't
// make room, with its count (the approval window always shows it whole). The room left for the plan the server adds: PLAN_ROOM
const PLAN_ROOM = 2500;
function twinFit(a, from) {
  const size = (x) => JSON.stringify(out(x)).length, before = { texts: a.textsNotListed || 0, notTranslated: a.notTranslatedNotListed || 0 }, all = a.texts;
  const t = fitLists(a, () => [[a, 'texts']], size, AIM - PLAN_ROOM), t2 = t && t.k === 0 ? (a.texts = all, fitLists(a, () => [[a, 'texts'], [a, 'notTranslated']], size, AIM - PLAN_ROOM)) : null;
  // (the lists the twin's plan already stopped at TEXTS_MAX keep that count too)
  const keep = (k, n) => { const v = (a[k + 'NotListed'] || 0) + n; if (v) a[k + 'NotListed'] = v; else delete a[k + 'NotListed']; };
  if (t) keep('texts', before.texts);
  if (t2) keep('notTranslated', before.notTranslated);
  const left = (a.texts || []).length, rest = a.textsNotListed || 0;
  if (rest) a.moreTexts = { listed: left, from: from + left, notListed: rest, how: `Only ${left} texts (from ${from}) fit in one answer. Call create_arabic_twin again with the same inputs and textsFrom: ${from + left} for the next ones, and draft them too; then give all the approved labels together in one call, which proposes the plan to approve. Nothing is written without the approved plan.` };
  if (a.notTranslatedNotListed) a.moreNotTranslated = { listed: (a.notTranslated || []).length, notListed: a.notTranslatedNotListed, how: 'The rest of the texts that stay English are shown in DataArcus\'s approval window, with the plan, before the person approves: tell the user that this list is shortened. A label for one makes it Arabic.' };
  return a;
}

export function planTwin(a) {
  const loc = locate(a.path), R = readOriginal(loc), textsFrom = Math.max(0, Math.floor(Number(a.textsFrom) || 0));
  // (0.3.0 X1) into "same": one report holding both languages, "<name> (EN-AR)"; the default, the separate twin "<name> AR"
  const same = a.into === 'same', outBase = loc.base + (same ? COPY_TAG : ' AR');
  const twinDir = path.join(loc.project, outBase + '.Report'), twinPbip = path.join(loc.project, outBase + '.pbip');
  const free = nothingAt(twinDir) && nothingAt(twinPbip);
  const texts = textsOf(R), ids = new Set(texts.map((t) => t.id)), model = modelOf(R, loc), dateTables = dateTablesOf(model.m), dateColumns = dateColumnsOf(model.m);
  // (T-1: Power BI has no setting that mirrors a page's background picture, so a page drawn on one stays left to right
  // unless the user asks to mirror it anyway: its visuals would leave the picture's panels)
  // (rc.22, B-137: an image that is DataArcus's own transparent placeholder, byte for byte, is no picture)
  const blankBytes = Buffer.from(Mirror.BLANK_PNG, 'base64');
  const blank = (n) => { const rel = 'StaticResources/RegisteredResources/' + n; if (!R.files.includes(rel)) return false; try { return readBytes(path.join(loc.dir, ...rel.split('/'))).equals(blankBytes); } catch (e) { return false; } };
  const pictureIds = new Set(R.pages.filter((pg) => Mirror.pageHasPicture(pg.page, { blank })).map((pg) => pg.id)), mirrorPictures = a.mirrorPicturePages === true;
  const keepLtr = (pg) => pictureIds.has(pg.id) && !mirrorPictures;
  const given = a.labels || {}, labels = {}, unknown = [];
  Object.keys(given).forEach((k) => { if (ids.has(k)) labels[k] = cleanLabel(given[k], k); else unknown.push(visible(k).slice(0, 160)); });
  const T = termsOf(R, texts, labels, a, model.m);
  // (rc.22, B-138) a page button with no label of its own takes the approved Arabic name of the page it goes to, shown in
  // the plan (labelFrom) and written with it; a label given for the button wins
  texts.forEach((t) => { if (t.kind === 'button' && t.goesTo && labels[t.id] == null && labels[t.goesTo] != null) { labels[t.id] = labels[t.goesTo]; t.labelFrom = 'the approved Arabic name of the page it goes to'; } });
  // (rc.24) a title measure's text keeps each {n} it has, once: else it is not taken, and the plan says why
  const problems = [];
  texts.forEach((t) => { if ((t.kind === 'titleMeasure' || t.kind === 'measureText') && labels[t.id] != null) { const why = placeholderProblem(String(t.rawId).replace(/^(titleText|measureText):/, ''), labels[t.id]); if (why) { delete labels[t.id]; problems.push({ id: t.id, why }); } } });
  sameTextLabels(texts, labels);
  T.statuses();
  texts.forEach((t) => { if (labels[t.id] != null) t.label = labels[t.id]; });
  // what mirrors, counted per kind, and what cannot
  const kinds = {}, where = { custom: [], navigator: [], slicer: [], matrix: [], other: [], waterfallKept: [] }, together = { on: [], bars: [] };
  const pages = R.pages.map((pg) => {
    if (keepLtr(pg)) return { id: safeName(pg.id), name: safeName(typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : ''), size: sizeOf(pg), tooltip: pageOf(pg).type === 'Tooltip', visuals: pg.visuals.length, leftToRight: 'drawn on a background picture: kept left to right' };
    const r = Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), { timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: a.waterfallRtl, dateTables, dateColumns, waterfall: Object.assign(waterfallFacts(model.m), { theme: R.theme }) });
    Object.entries(r.kinds).forEach(([k, n]) => { kinds[k] = (kinds[k] || 0) + n; });
    (r.waterfallsKept || []).forEach((x) => where.waterfallKept.push(safeName(pg.id) + '/' + safeName(x.name) + ' (' + x.why + ')'));
    // (T-3, T-6 of rc.5: the pairs mirrored as one)
    const u = r.units || { on: [], bars: [] }, at = (n) => safeName(pg.id) + '/' + safeName(n);
    u.on.forEach((x) => together.on.push(at(x.visual) + ' on ' + safeName(x.host)));
    u.bars.forEach((x) => together.bars.push(at(x.bars) + ' with ' + safeName(x.names)));
    pg.visuals.forEach((v) => { const k = Mirror.kindOf(v.json); if (where[k]) where[k].push(safeName(pg.id) + '/' + safeName(v.json.name) + (k === 'other' ? ' (' + safeName(v.json.visual.visualType) + ')' : '')); });
    return { id: safeName(pg.id), name: safeName(typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : ''), size: sizeOf(pg), tooltip: pageOf(pg).type === 'Tooltip', visuals: pg.visuals.length };
  });
  const mirrors = Object.keys(kinds).map((k) => ({ kind: k, what: Mirror.KIND_WHAT[k], count: kinds[k] }));
  const cannot = [];
  if (where.custom.length) cannot.push({ what: 'custom visuals', why: 'moved only: no report setting reaches inside a custom visual (its labels, sides and menus stay as they are; a licensed one may ask for a sign-in when its page opens)', where: where.custom.slice(0, 30) });
  if (where.navigator.length) cannot.push({ what: 'the page navigator\'s order', why: 'Power BI has no order setting: the first page stays at the left. It lists the twin\'s own pages by their (Arabic) names and keeps working', where: where.navigator.slice(0, 30) });
  if (where.slicer.length) cannot.push({ what: 'slicer items', why: 'moved only: the items keep Power BI\'s own alignment (no setting was proven)', where: where.slicer.slice(0, 30) });
  if (where.other.length) cannot.push({ what: 'other visuals (scatter and kinds without a proven setting)', why: 'moved only: no right-to-left setting is proven for these, so nothing inside them is changed; look at them in the twin', where: where.other.slice(0, 30) });
  if (where.waterfallKept.length) cannot.push({ what: 'waterfall charts the running total can\'t follow', why: Mirror.KIND_WHAT.waterfallKept, where: where.waterfallKept.slice(0, 30) });
  if (where.matrix.length) cannot.push({ what: 'matrix rows', why: 'a matrix keeps its row headers at the left (a hierarchy keeps its order); only its values are reversed', where: where.matrix.slice(0, 30) });
  if (pictureIds.size) cannot.push({ what: 'pages drawn on a background picture', why: mirrorPictures ? 'mirrored as asked (mirrorPicturePages), but the picture is not: its panels stay where they are, so the visuals no longer sit on them' : 'kept left to right: Power BI has no setting that mirrors a page picture, and the visuals would leave its panels. To mirror them anyway (the picture stays as it is), ask again with mirrorPicturePages true', where: [...pictureIds].map((x) => safeName(x)).slice(0, 30) });
  // (T-4: data bars inside a table or a matrix have no proven direction setting)
  if (R.pages.some((pg) => pg.visuals.some((v) => ['table', 'matrix'].includes(Mirror.kindOf(v.json))))) cannot.push({ what: 'data bars inside tables and matrices', why: 'they keep their direction (no right-to-left setting is proven for them); the columns themselves are reversed' });
  cannot.push({ what: 'Power BI\'s own words', why: '"All", "Select all", "Total", "(Blank)", the visual header menu, the filter pane, date and number formats follow the viewer\'s Power BI language and regional settings, not the report: an Arabic viewer sees them in Arabic' });
  cannot.push({ what: 'data values', why: 'category names, legend entries, slicer items and month names come from the model: Arabic columns are a model step (see arabicMonth)' });
  // (0.3.0 L4) a flip card's faces are picture measures of the model (its flip cards script): mirrored as one box, still
  // turning by their bookmarks, and drawn as those measures draw them
  const flipFaces = R.pages.flatMap((pg) => pg.visuals.filter((v) => { const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : {}, vco = isObj(vis.visualContainerObjects) ? vis.visualContainerObjects : {};
    return vis.visualType === 'image' && Array.isArray(vco.visualLink) && vco.visualLink.some((e) => isObj(e) && isObj(e.properties) && litStr(e.properties.type) === 'Bookmark'); }).map((v) => safeName(pg.id) + '/' + safeName(v.json.name)));
  // (0.3.0 A3) the metric switcher's choices are the rows of a field parameter table of the model (its script, made for
  // the English report, names them): the twin's slicer still switches, and its choices read as that table names them
  const switchers = fieldParametersOf(R.pages.flatMap((pg) => pg.visuals.map((v) => ({ file: safeName(pg.id) + '/' + safeName(isObj(v.json) ? v.json.name : ''), json: v.json }))));
  if (switchers.length) cannot.push({ what: 'the metric switcher\'s choices', why: `they are the rows of the field parameter table ${[...new Set(switchers.map((x) => JSON.stringify(safeName(x.table))))].join(', ')} of the model (the metric switcher script made for the English report names them in English): the twin's slicer and charts still switch, but the choices read as that table names them; for Arabic choices, make the report in Arabic with create_report and metricSwitcher`, where: [...new Set(switchers.map((x) => x.file))].slice(0, 30) });
  if (flipFaces.length) cannot.push({ what: 'flip cards\' faces', why: 'their text is drawn by picture measures of the model (the flip cards script made for the English report): the twin\'s cards are mirrored as one box and still turn, but their faces read as those measures draw them; for Arabic faces, make the report in Arabic with create_report and flipCards', where: flipFaces.slice(0, 30) });
  const checkInTwin = [];
  const offAxis = (v) => { const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : {}, es = isObj(vis.objects) && Array.isArray(vis.objects.categoryAxis) ? vis.objects.categoryAxis : []; return es.some((e) => isObj(e) && isObj(e.properties) && isObj(e.properties.show) && isObj(e.properties.show.expr) && isObj(e.properties.show.expr.Literal) && e.properties.show.expr.Literal.Value === 'false'); };
  const paired = new Set(together.bars.map((w) => w.split(' with ')[0]));
  const pairs = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'bar' && offAxis(v)).map((v) => safeName(pg.id) + '/' + safeName(v.json.name))).filter((w) => !paired.has(w));
  if (pairs.length) checkInTwin.push({ what: 'bar lists with their names hidden, no names found beside them', why: 'the names may be another visual further away; the bars are mirrored on their own and grow from the right: look that each list still reads with its names in the twin', where: pairs.slice(0, 30) });
  const keptTogether = [];
  if (together.bars.length) keptTogether.push({ what: 'bar lists with their names beside them', why: 'mirrored as one block in their original order, the bars still growing toward their names (mirrored one by one, the bars and names came apart)', where: together.bars.slice(0, 30) });
  if (together.on.length) keptTogether.push({ what: 'small visuals on a bigger visual (badges, icons)', why: 'they move with the visual they sit on, at the same place on it (what that visual draws inside does not flip, so mirrored on their own they covered its icon or text)', where: together.on.slice(0, 30) });
  if (!model.m) { const t = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'column').map((v) => safeName(pg.id) + '/' + safeName(v.json.name))); if (t.length) checkInTwin.push({ what: 'charts whose axis may be a date', why: 'the model could not be read, so a continuous date axis can\'t be told from a category: such a chart may stay left to right', where: t.slice(0, 30) }); }
  const month = a.arabicMonth === false ? { offered: false, why: 'not asked (arabicMonth false)' } : monthOffer(model, loc, outBase);
  const { script, howToApply, ...monthShown } = month;
  const ref = byPathOf(R.pbir);
  // (rc.24) the twin built in memory with the labels: its title measures and what its Arabic texts need
  const built = buildTwin({ R, model: model.m, keepLtr, dateTables, dateColumns, timeRightToLeft: a.timeRightToLeft, waterfallRtl: a.waterfallRtl, same }, rawLabels(texts, labels));
  // (X1) the copy, built in memory from the twin's pages: the plan shows it, the write writes exactly it
  const copy = same ? languageCopy({ R, loc, tabsShown: a.tabsShown }, built, rawLabels(texts, labels)) : null;
  const languages = copy ? { copy: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: pathOut(loc.project) || '.' },
    how: 'One report holding both languages: the original\'s English pages as they are, and after them each page\'s Arabic page, mirrored as the twin is (the same Arabic texts, phone layout, waterfalls and empty state). Every page has a small language button to its counterpart; the slicers of each page pair are kept in sync; the Arabic pages\' links (page tabs, tooltip pages, bookmarks) go to Arabic pages.',
    pairs: copy.pairs, buttons: copy.buttons, syncGroups: copy.syncGroups, tabs: copy.tabs, activePage: copy.activePage,
    bookmarks: copy.bookmarks ? `${copy.bookmarks} bookmark${copy.bookmarks === 1 ? '' : 's'} copied for the Arabic pages (their pages and visuals the Arabic ones, their names as approved); the English ones as they are` : 'none',
    ...(built.textMeasures.length ? { measures: built.textMeasures.map((x) => Object.assign({}, x, { why: 'the English pages keep the original measure; the Arabic pages use this copy with the approved Arabic text' })) } : {}),
    ...(copy.notes.length ? { notes: copy.notes } : {}),
    sayInPlan: 'Show the user the copy\'s name, every page pair, the language buttons (and any not placed, with why), the slicers kept in sync and which tabs are shown (tabs.service: what a reader in the Power BI service sees). tabsShown "ar" shows the Arabic pages instead.' } : null;
  if (built.titleMeasures && built.titleMeasures.notTranslated.length) cannot.push({ what: 'chart titles from title measures that build their text another way', why: 'their DAX is not only fixed texts and the numbers the report counts, so DataArcus can\'t translate it without guessing: the title stays as it is (titleMeasures.notTranslated says why for each)', where: built.titleMeasures.notTranslated.map((x) => x.measure).slice(0, 30) });
  // (0.3.0 D3) what stays English in the twin, and why, said before the go (as create_report's plan does: R2, #75)
  const notTranslated = notTranslatedOf(texts, labels, problems);
  // (0.3.0 A3) the copy's language button on each Arabic page reads "English": listed with why, as every kept text is
  const toEnglish = copy ? copy.buttons.filter((b) => b.placed && b.on === LANG.ar.on).length : 0;
  if (toEnglish) notTranslated.push({ text: LANG.ar.text, where: `language button (${toEnglish})`, why: 'the button on each Arabic page that opens its English page: a language switch names the language it opens in that language, as the English pages\' button reads «العربية»', ids: [] });
  // (0.3.0 J18) the terminology sheet: each field's places on the twin's own pages, as built
  const termRows = Terms.sheetOf(T.keys, T.term, Terms.placesOf({ pages: built.pages.filter((x) => isObj(x.page)).map((x) => ({ name: Terms.plain(typeof x.page.displayName === 'string' ? x.page.displayName : x.pg.id), type: x.page.type, visuals: x.visuals })), ext: Terms.measuresOf(built.ext || R.ext) }), Terms.isolateLatin);
  const PH = built.phone, phone = R.phone ? { mirrored: pictureIds.size && !mirrorPictures ? 'mirrored like its page (a page kept left to right keeps its phone layout as it is)' : true, pages: PH.pages,
    how: 'The phone layout (mobile.json) is mirrored like the pages: every box on the 323-wide phone canvas, the KPI cards\' order reversed, text boxes to the right, and its texts are the approved Arabic. Each page tab there is as wide as its Arabic name on one line (the writer\'s phone rule), the first page at the right.',
    ...(PH.tabs.length ? { tabs: PH.tabs.slice(0, 60) } : {}), ...(PH.tabsCut.length ? { tabsCut: PH.tabsCut.slice(0, 60) } : {}) } : { mirrored: false, why: 'the report has none' };
  const F = built.fitted, fitted = F.buttons.length || F.buttonsCut.length || F.headers.length || F.headersCut.length ? { fitted: Object.assign({}, ...['buttons', 'buttonsCut', 'headers', 'headersCut'].filter((k) => F[k].length).map((k) => ({ [k]: F[k].slice(0, 60) })), { sayInPlan: 'The Arabic texts are longer than the English: the twin widens each button to its text (the visuals beside it in its row move with it) and each table column to its Arabic header, within the page and the table. Say each one in the plan, and every buttonsCut and headersCut: their Arabic text needs a shorter version, or Power BI cuts it (a headersCut with cut "may be cut": Power BI may cut it, to be looked at in Desktop).' }) } : {};
  // (0.3, B-154) the model's fingerprint, pinned by the plan (null: no model read)
  return { loc, R, labels, texts, notTranslated, month, dateTables, dateColumns, pictureIds, keepLtr, built, copy, same, outBase, modelPrint: model.m ? model.m.print : null, model: model.m, terms: T.given, termRows, answer: capAnswer(twinFit({
    written: false,
    original: { report: pathOut(loc.dir), pbip: loc.pbip ? pathOut(loc.pbip) : null, readOnly: 'only read: never changed' },
    twin: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: pathOut(loc.project) || '.', model: ref && ref.path ? pathOut(path.resolve(loc.dir, String(ref.path))) : 'the same model as the original (definition.pbir copied as it is)', nameFree: free },
    pages, mirrors, cannot, phone, ...(keptTogether.length ? { keptTogether } : {}), ...(checkInTwin.length ? { checkInTwin } : {}), ...fitted,
    ...(built.titleMeasures ? { titleMeasures: Object.assign({}, built.titleMeasures, { notTranslated: built.titleMeasures.notTranslated.slice(0, 30), written: built.titleMeasures.written.slice(0, 30), how: 'A chart title given by a measure of the report: each of its texts is listed above (kind titleMeasure). The twin writes its own measures "Title AR: ..." with the approved Arabic texts, in its own reportExtensions.json, and its charts use them; the original report and the model are not changed.' }) } : {}),
    ...(pictureIds.size ? { picturePages: [...pictureIds].map((x) => ({ page: safeName(x), what: mirrorPictures ? 'mirrored as asked; its picture is not' : 'kept left to right (its background picture can\'t be mirrored); mirrorPicturePages true mirrors it anyway' })) } : {}),
    keptForNavigation: same ? 'The English pages keep their page ids, visual names and bookmarks; the Arabic pages get their own (new ids), and their page, tooltip and bookmark links go to the Arabic pages.' : 'Page ids, visual names, bookmark names, page and bookmark links are kept: navigation and bookmarks work in the twin without rewiring.',
    timeRightToLeft: a.timeRightToLeft !== false ? 'yes: charts over time run right to left like the rest of the page (the user can choose false: time stays left to right)' : 'no: charts over time keep left to right (the user\'s choice)',
    // (D7) the waterfalls: Power BI's own, left to right ("native", the default), or the look-alike read from the right
    waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl) === 'native' ? `native: ${Gallery.WF_WHAT.native} (the user can choose "mirror": a stacked column chart read from the right, with no Total column and no legend)` : 'mirror: each waterfall is a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend (the user can choose "native": Power BI\'s own waterfall, left to right)',
    // (0.3.0 Q1) from textsFrom on: the server cuts the list to fit one answer and says where the rest starts (moreTexts)
    texts: texts.slice(textsFrom, textsFrom + TEXTS_MAX).map(({ rawId, raw, fieldKey, ...t }) => t), ...(texts.length > textsFrom + TEXTS_MAX ? { textsNotListed: texts.length - textsFrom - TEXTS_MAX } : {}),
    ...(textsFrom ? { textsFrom: Math.min(textsFrom, texts.length) } : {}),
    labels: Object.assign({ given: Object.keys(labels).length, unknown, withoutLabel: texts.filter((t) => labels[t.id] == null).length }, problems.length ? { problems } : {}),
    notTranslated: notTranslated.slice(0, TEXTS_MAX).map(({ ids, ...r }) => r), ...(notTranslated.length > TEXTS_MAX ? { notTranslatedNotListed: notTranslated.length - TEXTS_MAX } : {}),
    ...(built.notShown.length ? { notShown: built.notShown.slice(0, 60) } : {}),
    ...(languages ? { languages } : {}),
    terminology: Object.assign({ sheet: termRows }, Terms.askNextOf(termRows), { how: Terms.HOW_TWIN }, T.unknown.length ? { unknownTerms: T.unknown } : {}, T.notUsing.length ? { labelsNotUsingTerm: T.notUsing.slice(0, 60) } : {}),
    sayInPlan: 'Before the go, show the user notTranslated: every text that stays English in the twin, with why (each text the user approved no Arabic for, such as a field name kept as the model names it). A text with labelFrom takes the approved Arabic of the same text (a page button its page\'s name, an alt text or a phone copy the visual\'s title): show those too. notShown: the original\'s title measures the twin\'s charts no longer use (kept in its file, shown nowhere).',
    arabicMonth: month.offered ? Object.assign(monthShown, { howToApplyAfterGo: howToApply }) : monthShown,
    ...notCopiedOf(R.left),
    ...(R.unreadable.length ? { unreadable: { count: R.unreadable.length, note: 'files that are not JSON: copied as they are, not mirrored' } } : {}),
    sayFirst: 'Nothing was written. Show the user this plan: the twin\'s name and place, the pages, what mirrors, what cannot, and the Arabic texts. draftArabic comes from a fixed glossary; for every other text draft the Arabic yourself in modern, simple Standard Arabic (Western digits, product names in Latin letters, short and natural, not a word-for-word translation) and show each one to the user as a DRAFT. Never translate silently and never write a text the user has not approved: a text without an approved label stays as it is. Call this tool again with the approved texts as labels ({ id: text }) to get a plan id for exactly those, show it, and after the user\'s go call approve_plan, then this tool with planId.'
  }, textsFrom), (x) => JSON.stringify(x).length, { last: ['texts'] }) };   // (A3: the texts cut last)
}

// ---- the write ----
// the month script's name: the first free one, or the file that already holds exactly this script (written once)
function scriptName(dir, base, text) {
  for (let n = 1; n < 1000; n++) {
    const f = path.join(dir, base + (n > 1 ? ' ' + n : '') + '.tmdl');
    if (nothingAt(f)) return { file: f, free: true };
    try { if (fs.lstatSync(f).isFile() && readBytes(f).toString('utf8') === text) return { file: f, free: false }; } catch (e) { /* the next name */ }
  }
  throw new Error('no free file name for the month script');
}
/** (D6, the laptop proof of rc.2: the twin's approval page said one sentence) every file the twin writes, by its path in
 *  the folder it is written in, as writeTwin writes them: the copied report's files, its own reportExtensions.json when
 *  the original has none, the month script when offered and not already there, and the .pbip */
export function twinOutputs(P) {
  const { loc, R } = P, dir = P.outBase + '.Report', out = P.copy ? P.copy.files.map((f) => dir + '/' + f.rel) : R.files.map((rel) => dir + '/' + rel);
  if (!P.copy && P.built.ext && !R.files.includes(EXT)) out.push(dir + '/' + EXT);
  if (!P.copy && !R.hasPlatform) out.push(dir + '/.platform');
  if (P.month.offered) { const f = scriptName(loc.project, `${P.outBase} - Arabic calendar`, P.month.script); if (f.free) out.push(path.basename(f.file)); }
  return out.concat([P.outBase + '.pbip']);
}
export function writeTwin(a, plan) {
  const d = plan.data || {};
  // (B-02) the original as it was when the plan was approved: changed since, nothing is written
  if (d.source && reportPrint(a.path) !== d.source) throw new Error('Nothing was written: the original report changed after the plan was approved. Make the plan again (call this tool without planId), show it to the user and wait for their go.');
  const asked = a.labels ? sortKeys(planTwin(Object.assign({}, a, { labels: a.labels })).labels) : null;
  if (asked && JSON.stringify(asked) !== JSON.stringify(sortKeys(d.labels))) throw new Error('Nothing was written: these labels differ from the labels of the approved plan. Show the user the new labels, get a new plan id for them (call this tool without planId), and wait for the user\'s go.');
  // (X1) the plan's own options: a call with planId that names other ones is refused, never written another way
  if ((a.into != null && (a.into === 'same') !== (d.into === 'same')) || (a.tabsShown != null && d.into === 'same' && a.tabsShown !== (d.tabsShown || 'en'))) throw new Error('Nothing was written: into or tabsShown differ from the approved plan\'s. Make the plan again with the options the user wants, show it and wait for their go.');
  // (D7) the waterfall's choice is the plan's too
  if (a.waterfallRtl != null && Gallery.waterfallRtlOf(a.waterfallRtl) !== Gallery.waterfallRtlOf(d.waterfallRtl)) throw new Error('Nothing was written: waterfallRtl differs from the approved plan\'s. Make the plan again with the waterfall the user wants, show it and wait for their go.');
  // (0.3.0 J18) the plan's terms: a call with planId that gives other ones is refused
  if (a.terms && JSON.stringify(normTerms(a.terms)) !== JSON.stringify(d.terms || {})) throw new Error('Nothing was written: these terms differ from the terms of the approved plan. Show the user the new terminology sheet, get a new plan id for it (call this tool without planId), and wait for the user\'s go.');
  const P = planTwin({ path: a.path, labels: d.labels || {}, terms: d.terms || {}, memory: false, timeRightToLeft: d.timeRightToLeft, waterfallRtl: d.waterfallRtl, arabicMonth: d.arabicMonth, mirrorPicturePages: d.mirrorPicturePages, into: d.into, tabsShown: d.tabsShown });
  // (B-154) the model the plan read (for the month column and the dates), as it was at the go
  if ('modelPrint' in d && (P.modelPrint || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id));
  const { loc, R } = P;
  const twinDir = path.join(loc.project, P.outBase + '.Report'), twinPbip = path.join(loc.project, P.outBase + '.pbip');
  if (!nothingAt(twinDir) || !nothingAt(twinPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(twinDir) ? twinPbip : twinDir)}" is already there. DataArcus never writes over a file: rename or move the old ${P.same ? 'copy' : 'twin'}, then ask again.`);
  real(twinDir); real(twinPbip);
  // everything is built in memory first (the plan's own build: buildTwin); then written, each file new
  const out = new Map(), labels = rawLabels(P.texts, P.labels);
  let applied = P.built.applied;
  P.built.pages.forEach(({ pg, page, visuals, mobiles }) => {
    // (a page.json that is not an object is copied as it is: there is nothing to label or mirror in it)
    if (isObj(page)) out.set(pg.rel, json(page));
    visuals.forEach((vj, i) => out.set(pg.visuals[i].rel, json(vj)));
    (mobiles || []).forEach((m, i) => { if (m) out.set(pg.visuals[i].mobile.rel, json(m)); });
  });
  if (P.built.ext) out.set(EXT, json(P.built.ext));
  R.bookmarks.forEach((b) => { if (labels['bookmark:' + b.json.name] != null) { out.set(b.rel, json(Object.assign({}, b.json, { displayName: labels['bookmark:' + b.json.name] }))); applied++; } });
  if (R.hasPlatform) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + ' AR' }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); out.set('.platform', json(pl)); }
  // (0.3.0 A1) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the twin writes its own, as create_report does
  else out.set('.platform', newPlatform(loc.base + ' AR'));
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(twinDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { const o = mustJson(loc.pbip, path.basename(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(twinDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(twinDir) } }); pbip = o; }
  // the cross-review's T8 and audit 6's A6-4: the one writer (lib/files.mjs), all or nothing: the twin's folder, the month
  // script (when offered and not already there with the same text) and the .pbip last; on any failure nothing is left
  // (X1) the copy holding both languages: its files as the plan built them (the original's copied as they are)
  const tree = P.copy ? P.copy.files.map((f) => ({ path: path.basename(twinDir) + '/' + f.rel, data: f.data != null ? f.data : readBytes(path.join(loc.dir, ...f.from.split('/'))) }))
    : R.files.map((rel) => ({ path: path.basename(twinDir) + '/' + rel, data: out.has(rel) ? out.get(rel) : readBytes(path.join(loc.dir, ...rel.split('/'))) }));
  // (D1: the waterfall's measures, in a reportExtensions.json of the twin's own when the original has none)
  if (!P.copy && out.has(EXT) && !R.files.includes(EXT)) tree.push({ path: path.basename(twinDir) + '/' + EXT, data: out.get(EXT) });
  if (!P.copy && !R.hasPlatform) tree.push({ path: path.basename(twinDir) + '/.platform', data: out.get('.platform') });
  let month = { written: false, why: P.month.why };
  if (P.month.offered) {
    const f = scriptName(loc.project, `${P.outBase} - Arabic calendar`, P.month.script);
    if (f.free) tree.push({ path: path.basename(f.file), data: P.month.script });
    month = { scriptFile: pathOut(f.file), column: P.month.column, table: P.month.table, howToApply: P.month.howToApply };
  }
  tree.push({ path: path.basename(twinPbip), data: json(pbip) });
  // (0.3.0 S1, B-182, as R6's F07 for create_report) the model read again right before the first write (no folder is made
  // yet): its print the approved one, or nothing is written (the read above can be seconds older than the write)
  if ('modelPrint' in d) { testEditBeforeWrite(); const now = modelOf(R, loc).m; if (((now && now.print) || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id)); }
  writeTree(loc.project, tree);
  // (0.3.0 J18) the terms of the written plan are confirmed for this model (this session only)
  if (Array.isArray(d.terminology)) Terms.remember(P.model, d.terminology);
  return { written: true, report: pathOut(twinDir), pbip: pathOut(twinPbip), files: P.copy ? P.copy.files.length + 1 : R.files.length + 1 + (out.has(EXT) && !R.files.includes(EXT) ? 1 : 0) + (R.hasPlatform ? 0 : 1), pages: P.copy ? P.copy.pairs.length * 2 : P.answer.pages.length,
    ...(P.answer.languages ? { languages: P.answer.languages } : {}), mirrors: P.answer.mirrors, cannot: P.answer.cannot,
    labelsApplied: applied, textsWithoutLabel: P.answer.labels.withoutLabel, notTranslated: P.answer.notTranslated, phone: P.answer.phone, original: 'only read: not changed', arabicMonth: month,
    ...(P.answer.fitted ? { fitted: P.answer.fitted } : {}), ...(P.answer.titleMeasures ? { titleMeasures: P.answer.titleMeasures } : {}),
    nextSteps: `Open "${path.basename(twinPbip)}" in Power BI Desktop (the original stays as it was), look at every page, and check it with check_report. Tell the user what cannot be mirrored (cannot)${P.month.offered ? ' and how to apply the month script' : ''}.` };
}
