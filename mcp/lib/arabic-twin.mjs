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
import { inside, real, nothingAt, writeNew, visible, loadModel, ROOT } from './model.mjs';
// (the reading block's screen, locate, JSON reader, strict file list, inventory and limits: the cross-review's Break 1,
// T3 and R1, 11 Oct; strictFiles refuses a link or a deep folder, never skips it, as a writer must)
import { INSTRUCTION, WITHHELD, safeName, REPORT_LIMITS, readJson, mustJson, reportPrint, readBytes, isFile, isDir, locate as readerLocate, strictFiles, notCopiedOf, inventory, diskSource } from './read-report.mjs';
import { proposeArabic } from './arabic-names.mjs';
import { writeTree } from './files.mjs';
import { modelChanged } from './plans.mjs';
// (the fuzz test's F-TP: the plan's own answer within 40,000 characters, whoever calls planTwin)
import { capAnswer } from './answer.mjs';
import { writtenName } from './display-names.mjs';

const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
// (rc.24, 0.2.9.1) check_report's own measurements of a button's text and of a table header: the twin widens what its Arabic cuts
const Rules = require('../../assets/js/report-rules.js');

// the limits check_report reads a report within (the reading block's: 8 MB a file, 12 levels), and a count
const MB = 1024 * 1024, LIMITS = { file: REPORT_LIMITS.file, depth: REPORT_LIMITS.depth, files: 20000 }, TEXT_CAP = 200, TEXTS_MAX = 400;
const relRoot = (f) => path.relative(ROOT, f).split(path.sep).join('/');
// a path for an answer: each folder or file name screened as the reading block screens names (instruction-like
// withheld, hidden characters as code points, 60 characters at most): the fuzz test's F-TP (a model path from
// definition.pbir with planted text, isolates, 200,000 characters went raw into the plan)
const pathOut = (f) => relRoot(f).split('/').map((seg) => (seg === '..' || seg === '.' ? seg : safeName(seg))).join('/');
const json = (o) => JSON.stringify(o, null, 2) + '\n';
// (the one Arabic month list, the writer's: the cross-review's duplicates, 11 Oct)
const MONTHS_AR = require('../../assets/js/pbip-export.js').AR_MONTHS;
const MONTH_COLUMN = 'Month Name (Arabic)', MONTH_SORT = 'Month Number (AR sort)';

// ---- the original: the reading block's locate (a .pbip, a .Report folder, a folder holding exactly one), named ----
function locate(p) {
  const loc = readerLocate(p, 'create_arabic_twin'), dir = loc.reportDir;
  if (!/\.Report$/i.test(dir)) throw new Error(`"${p}" is a folder holding a definition folder, not a .Report folder: give the report's .pbip file or its .Report folder, so the twin can be named after it. Nothing was written.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  if (/\sAR$/i.test(base)) throw new Error(`"${path.basename(dir)}" is already an Arabic twin (its name ends in " AR"): make the twin of the original report instead. Nothing was written.`);
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
    visuals: pg.visuals.filter((x) => x.json && x.json.name != null && x.file.split('/').length === 6).sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0)).map((x) => ({ rel: x.file, json: x.json })) }));
  const bookmarks = inv.bookmarks.filter((b) => isObj(b.raw) && (typeof b.raw.name === 'string' || typeof b.raw.name === 'number')).map((b) => ({ rel: b.file, json: b.raw }));
  // (rc.24) the report's own measures (definition/reportExtensions.json), for the title measures; and the theme's text
  // sizes, for what the Arabic texts need
  let ext = null; if (files.includes(EXT)) { try { const j = readJson(path.join(loc.dir, ...EXT.split('/'))); ext = isObj(j) && Array.isArray(j.entities) ? j : null; } catch (e) { ext = null; } }
  return { files, left, pages, bookmarks, pbir, unreadable, ext, theme: isObj(inv.themeJson) ? inv.themeJson : null, phone: files.some((f) => /\/mobile\.json$/.test(f)), hasPlatform: files.includes('.platform') };
}

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
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
function parseTitleDax(expr0) {
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
    return /\p{L}/u.test(out.template) ? out : null;
  };
  if (/^IF\s*\(/i.test(expr.slice(b0, b1)) && expr[b1 - 1] === ')') {
    const open = expr.indexOf('(', b0), d = sc.top.find((t) => t.i === open).depth;
    const commas = sc.top.filter((t) => t.i > open && t.i < b1 - 1 && t.c === ',' && t.depth === d).map((t) => t.i);
    const close = sc.top.find((t) => t.i > open && t.c === ')' && t.depth === d - 1);
    if (commas.length !== 2 || !close || close.i !== b1 - 1) return { why: NOT_READ };
    if (sc.lits.some((l) => l.start > open && l.start < commas[0])) return { why: 'its condition compares texts: ' + NOT_READ };
    const A = branch(commas[0] + 1, commas[1]), B = branch(commas[1] + 1, b1 - 1);
    if (!A || !B) return { why: NOT_READ };
    return { prefix, ret: ret >= 0, cond: expr.slice(open + 1, commas[0]).trim(), branches: [A, B] };
  }
  const A = branch(b0, b1);
  return A ? { prefix, ret: ret >= 0, cond: null, branches: [A] } : { why: NOT_READ };
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
  });
  R.bookmarks.forEach((b) => add({ id: 'bookmark:' + b.json.name, kind: 'bookmark', text: typeof b.json.displayName === 'string' ? b.json.displayName : '' }, {}));
  // (rc.24) each visible text of the report's title measures, one per text across the report (the measures listed)
  titleMeasuresOf(R).filter((x) => x.pd.branches).forEach((x) => x.pd.branches.forEach((b) => {
    const id = 'titleText:' + b.template, had = all.find((t) => t.id === id), m = safeName(x.entity + '[' + x.name + ']');
    if (had) { if (!had.measures.includes(m)) had.measures.push(m); return; }
    add({ id, kind: 'titleMeasure', text: b.template, what: 'Chart title (from a title measure)' + (b.vars.length ? `: keep ${b.vars.map((v, i) => '{' + (i + 1) + '}').join(' and ')}, the numbers the report counts` : ''), measures: [m] }, {});
  }));
  return all.map((t) => {
    const raw = String(t.text);
    const out = Object.assign({ id: safeId(t.id), kind: t.kind, rawId: t.id }, t.goesTo ? { goesTo: safeId(t.goesTo) } : {}, t.what ? { what: t.what, measures: t.measures.slice(0, 30) } : {});
    if (t.page) out.page = safeName(t.page);
    if (t.visual) out.visual = safeName(t.visual);
    if (INSTRUCTION.test(raw)) return Object.assign(out, { text: null, withheld: `reads like an instruction to an AI assistant (${raw.length} characters): not shown, kept as it is unless the user gives its Arabic`, draftArabic: null });
    const text = visible(raw);
    return Object.assign(out, { text: text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) + '…' : text }, text.length > TEXT_CAP ? { long: raw.length } : {}, { draftArabic: proposeArabic(raw) });
  });
}
// the labels by the ids the answer gave, as the mirror engine's ids (the report's own names)
const rawLabels = (texts, labels) => { const by = new Map(texts.map((t) => [t.id, t.rawId])), out = {}; Object.keys(labels || {}).forEach((k) => { if (by.has(k)) out[by.get(k)] = labels[k]; }); return out; };

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
function monthOffer(model, loc) {
  if (!model.m) return { offered: false, why: model.why };
  const m = model.m, isDate = isDateCol;
  // (T-5: by shape; when several, the one marked as the date table, then the one built with CALENDAR)
  const shapes = dateTableShapes(m);
  let pick = shapes; if (pick.length > 1 && pick.some((x) => x.marked)) pick = pick.filter((x) => x.marked); if (pick.length > 1 && pick.some((x) => x.calendar)) pick = pick.filter((x) => x.calendar);
  const cands = pick.map((x) => Object.assign({}, (m.tables || []).find((t) => t.name === x.name), { shapeDates: x.dates }));
  if (cands.length !== 1) return { offered: false, why: cands.length ? `the model has ${cands.length} date tables: say which one, and the column is a model step done by hand` : 'the model has no date table (a table with a date column and month and year columns; built with CALENDAR or CALENDARAUTO, or imported; its name and its mark do not matter)' };
  const t = cands[0], cols = t.columns || [];
  const has = (re) => cols.find((c) => re.test(String(c.name)));
  if (has(/^month name \(arabic\)$/i) || cols.some((c) => /(arabic|عربي|\bAR\b)/i.test(c.name) && /(month|شهر)/i.test(c.name)) || has(/^(اسم\s*)?الشهر$/)) return { offered: false, why: `the date table "${visible(t.name)}" has an Arabic month column already` };
  const raw = ((m.tmsl && m.tmsl.model && m.tmsl.model.tables) || []).find((x) => x.name === t.name) || {};
  const date = (raw.columns || []).find((c) => c.name && isDate(c) && c.isKey) || cols.find(isDate) || cols.find((c) => (t.shapeDates || []).includes(c.name));
  // the month number to sort by: an integer column named like one (an untyped DAX column of that name counts: its DAX makes it a number)
  const typedRaw = (c) => { const x = (raw.columns || []).find((y) => y && y.name === c.name); return untyped(x ? x.dataType : c.dataType); };
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
  const lines = ['createOrReplace', '', '\tref table ' + tmdlName(t.name), ''];
  if (!num) lines.push(`\t\tcolumn ${tmdlName(MONTH_SORT)} = MONTH ( ${daxCol(t.name, date.name)} )`, '\t\t\tdataType: int64', '\t\t\tisHidden', '\t\t\tsummarizeBy: none', '');
  lines.push(`\t\tcolumn ${tmdlName(MONTH_COLUMN)} = SWITCH ( MONTH ( ${daxCol(t.name, date.name)} ), ${MONTHS_AR.map((n, i) => `${i + 1}, "${n}"`).join(', ')} )`,
    '\t\t\tdataType: string', '\t\t\tsummarizeBy: none', `\t\t\tsortByColumn: ${tmdlName(num ? num.name : MONTH_SORT)}`, '');
  return { offered: true, table: visible(t.name), dateColumn: visible(date.name), column: MONTH_COLUMN, sortBy: num ? visible(num.name) : MONTH_SORT + ' (written with it, hidden)',
    ...(calculated ? { note: 'the date table is a DAX (calculated) table: the lab added the column to its formula; adding it as a calculated column is not yet proven in Desktop through TMDL view: check Preview before Apply' } : {}),
    scriptAfterGo: `${loc.base} AR - Arabic month.tmdl`, script: lines.join('\n') + '\n',
    howToApply: 'Save a copy of the Power BI file first. Open the script file in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview (one column is added to the date table, sorted by its month number), then Apply. DataArcus never applies it: the model is changed only when the user applies it. Then a chart or table can show the Arabic month names (يناير، فبراير...) by using that column.' };
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

// ---- the twin's pages, built in memory (the plan shows what they fit; the write writes exactly them) ----
// labels: by the mirror engine's ids (the report's own names). Returns { pages: [{ rel, page, visuals: [json] }],
// applied, ext (the twin's reportExtensions.json or null), titleMeasures, fitted }
function buildTwin(P, labels) {
  const { R } = P, opts = { timeRightToLeft: P.timeRightToLeft !== false, dateTables: P.dateTables, dateColumns: P.dateColumns };
  const TC = P.R.theme && isObj(P.R.theme.textClasses) ? P.R.theme.textClasses : {}, lab = isObj(TC.label) ? TC.label : {};
  const ctx = { text: { labelSize: +lab.fontSize || 10, font: lab.fontFace || 'Segoe UI' }, theme: R.theme };
  let applied = 0;
  // the title measures: the twin's own Arabic ones, named "Title AR: ...", beside the original's (which stay as they are)
  const tms = titleMeasuresOf(R), ext = R.ext ? JSON.parse(JSON.stringify(R.ext)) : null, rename = new Map(), written = [];
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
  const fitted = { buttons: [], buttonsCut: [], headers: [], headersCut: [] };
  const pages = R.pages.map((pg) => {
    let page = pg.page;
    if (isObj(pg.page)) { page = JSON.parse(JSON.stringify(pg.page)); if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; } }
    // (T-1: a page drawn on a picture is copied left to right unless asked; its texts still take the approved labels)
    const r = P.keepLtr(pg) ? { visuals: pg.visuals.map((v) => JSON.parse(JSON.stringify(v.json))) } : Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    r.visuals.forEach((vj) => {
      applied += Mirror.labelVisual(pg.id, vj, labels);
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
    return { pg, page, visuals: r.visuals };
  });
  const notTranslated = tms.filter((x) => !x.pd.branches).map((x) => ({ what: 'Chart title (from a title measure)', measure: safeName(x.entity + '[' + x.name + ']'), why: x.pd.why }));
  return { pages, applied, ext: written.length ? ext : null, fitted, titleMeasures: tms.length ? { measures: tms.length, translated: written.length, written, notTranslated } : null };
}

// ---- the plan ----
const sortKeys = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, String(o[k])]));
const cleanLabel = (s, id) => writtenName(s, `labels: ${visible(id).slice(0, 160)}`).slice(0, TEXT_CAP);
export function twinKey(p) { const { dir } = locate(p); try { return fs.realpathSync.native(dir); } catch (e) { return dir; } }

export function planTwin(a) {
  const loc = locate(a.path), R = readOriginal(loc);
  const twinDir = path.join(loc.project, loc.base + ' AR.Report'), twinPbip = path.join(loc.project, loc.base + ' AR.pbip');
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
  // (rc.22, B-138) a page button with no label of its own takes the approved Arabic name of the page it goes to, shown in
  // the plan (labelFrom) and written with it; a label given for the button wins
  texts.forEach((t) => { if (t.kind === 'button' && t.goesTo && labels[t.id] == null && labels[t.goesTo] != null) { labels[t.id] = labels[t.goesTo]; t.labelFrom = 'the approved Arabic name of the page it goes to'; } });
  // (rc.24) a title measure's text keeps each {n} it has, once: else it is not taken, and the plan says why
  const problems = [];
  texts.forEach((t) => { if (t.kind === 'titleMeasure' && labels[t.id] != null) { const why = placeholderProblem(String(t.rawId).slice('titleText:'.length), labels[t.id]); if (why) { delete labels[t.id]; problems.push({ id: t.id, why }); } } });
  texts.forEach((t) => { if (labels[t.id] != null) t.label = labels[t.id]; });
  // what mirrors, counted per kind, and what cannot
  const kinds = {}, where = { custom: [], navigator: [], slicer: [], matrix: [], other: [] }, together = { on: [], bars: [] };
  const pages = R.pages.map((pg) => {
    if (keepLtr(pg)) return { id: safeName(pg.id), name: safeName(typeof pageOf(pg).displayName === 'string' ? pageOf(pg).displayName : ''), size: sizeOf(pg), tooltip: pageOf(pg).type === 'Tooltip', visuals: pg.visuals.length, leftToRight: 'drawn on a background picture: kept left to right' };
    const r = Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), { timeRightToLeft: a.timeRightToLeft !== false, dateTables, dateColumns });
    Object.entries(r.kinds).forEach(([k, n]) => { kinds[k] = (kinds[k] || 0) + n; });
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
  if (where.other.length) cannot.push({ what: 'other visuals (waterfall, scatter and kinds without a proven setting)', why: 'moved only: no right-to-left setting is proven for these, so nothing inside them is changed; look at them in the twin', where: where.other.slice(0, 30) });
  if (where.matrix.length) cannot.push({ what: 'matrix rows', why: 'a matrix keeps its row headers at the left (a hierarchy keeps its order); only its values are reversed', where: where.matrix.slice(0, 30) });
  if (pictureIds.size) cannot.push({ what: 'pages drawn on a background picture', why: mirrorPictures ? 'mirrored as asked (mirrorPicturePages), but the picture is not: its panels stay where they are, so the visuals no longer sit on them' : 'kept left to right: Power BI has no setting that mirrors a page picture, and the visuals would leave its panels. To mirror them anyway (the picture stays as it is), ask again with mirrorPicturePages true', where: [...pictureIds].map((x) => safeName(x)).slice(0, 30) });
  // (T-4: data bars inside a table or a matrix have no proven direction setting)
  if (R.pages.some((pg) => pg.visuals.some((v) => ['table', 'matrix'].includes(Mirror.kindOf(v.json))))) cannot.push({ what: 'data bars inside tables and matrices', why: 'they keep their direction (no right-to-left setting is proven for them); the columns themselves are reversed' });
  cannot.push({ what: 'Power BI\'s own words', why: '"All", "Select all", "Total", "(Blank)", the visual header menu, the filter pane, date and number formats follow the viewer\'s Power BI language and regional settings, not the report: an Arabic viewer sees them in Arabic' });
  cannot.push({ what: 'data values', why: 'category names, legend entries, slicer items and month names come from the model: Arabic columns are a model step (see arabicMonth)' });
  cannot.push({ what: 'the phone layout', why: R.phone ? 'copied as it is (a phone shows one column; the phone layout is not mirrored)' : 'the report has none' });
  const checkInTwin = [];
  const offAxis = (v) => { const vis = isObj(v.json) && isObj(v.json.visual) ? v.json.visual : {}, es = isObj(vis.objects) && Array.isArray(vis.objects.categoryAxis) ? vis.objects.categoryAxis : []; return es.some((e) => isObj(e) && isObj(e.properties) && isObj(e.properties.show) && isObj(e.properties.show.expr) && isObj(e.properties.show.expr.Literal) && e.properties.show.expr.Literal.Value === 'false'); };
  const paired = new Set(together.bars.map((w) => w.split(' with ')[0]));
  const pairs = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'bar' && offAxis(v)).map((v) => safeName(pg.id) + '/' + safeName(v.json.name))).filter((w) => !paired.has(w));
  if (pairs.length) checkInTwin.push({ what: 'bar lists with their names hidden, no names found beside them', why: 'the names may be another visual further away; the bars are mirrored on their own and grow from the right: look that each list still reads with its names in the twin', where: pairs.slice(0, 30) });
  const keptTogether = [];
  if (together.bars.length) keptTogether.push({ what: 'bar lists with their names beside them', why: 'mirrored as one block in their original order, the bars still growing toward their names (mirrored one by one, the bars and names came apart)', where: together.bars.slice(0, 30) });
  if (together.on.length) keptTogether.push({ what: 'small visuals on a bigger visual (badges, icons)', why: 'they move with the visual they sit on, at the same place on it (what that visual draws inside does not flip, so mirrored on their own they covered its icon or text)', where: together.on.slice(0, 30) });
  if (!model.m) { const t = R.pages.filter((pg) => !keepLtr(pg)).flatMap((pg) => pg.visuals.filter((v) => Mirror.kindOf(v.json) === 'column').map((v) => safeName(pg.id) + '/' + safeName(v.json.name))); if (t.length) checkInTwin.push({ what: 'charts whose axis may be a date', why: 'the model could not be read, so a continuous date axis can\'t be told from a category: such a chart may stay left to right', where: t.slice(0, 30) }); }
  const month = a.arabicMonth === false ? { offered: false, why: 'not asked (arabicMonth false)' } : monthOffer(model, loc);
  const { script, howToApply, ...monthShown } = month;
  const ref = byPathOf(R.pbir);
  // (rc.24) the twin built in memory with the labels: its title measures and what its Arabic texts need
  const built = buildTwin({ R, model: model.m, keepLtr, dateTables, dateColumns, timeRightToLeft: a.timeRightToLeft }, rawLabels(texts, labels));
  if (built.titleMeasures && built.titleMeasures.notTranslated.length) cannot.push({ what: 'chart titles from title measures that build their text another way', why: 'their DAX is not only fixed texts and the numbers the report counts, so DataArcus can\'t translate it without guessing: the title stays as it is (titleMeasures.notTranslated says why for each)', where: built.titleMeasures.notTranslated.map((x) => x.measure).slice(0, 30) });
  const F = built.fitted, fitted = F.buttons.length || F.buttonsCut.length || F.headers.length || F.headersCut.length ? { fitted: Object.assign({}, ...['buttons', 'buttonsCut', 'headers', 'headersCut'].filter((k) => F[k].length).map((k) => ({ [k]: F[k].slice(0, 60) })), { sayInPlan: 'The Arabic texts are longer than the English: the twin widens each button to its text (the visuals beside it in its row move with it) and each table column to its Arabic header, within the page and the table. Say each one in the plan, and every buttonsCut and headersCut: their Arabic text needs a shorter version, or Power BI cuts it (a headersCut with cut "may be cut": Power BI may cut it, to be looked at in Desktop).' }) } : {};
  // (0.3, B-154) the model's fingerprint, pinned by the plan (null: no model read)
  return { loc, R, labels, texts, month, dateTables, dateColumns, pictureIds, keepLtr, built, modelPrint: model.m ? model.m.print : null, answer: capAnswer({
    written: false,
    original: { report: pathOut(loc.dir), pbip: loc.pbip ? pathOut(loc.pbip) : null, readOnly: 'only read: never changed' },
    twin: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: pathOut(loc.project) || '.', model: ref && ref.path ? pathOut(path.resolve(loc.dir, String(ref.path))) : 'the same model as the original (definition.pbir copied as it is)', nameFree: free },
    pages, mirrors, cannot, ...(keptTogether.length ? { keptTogether } : {}), ...(checkInTwin.length ? { checkInTwin } : {}), ...fitted,
    ...(built.titleMeasures ? { titleMeasures: Object.assign({}, built.titleMeasures, { notTranslated: built.titleMeasures.notTranslated.slice(0, 30), written: built.titleMeasures.written.slice(0, 30), how: 'A chart title given by a measure of the report: each of its texts is listed above (kind titleMeasure). The twin writes its own measures "Title AR: ..." with the approved Arabic texts, in its own reportExtensions.json, and its charts use them; the original report and the model are not changed.' }) } : {}),
    ...(pictureIds.size ? { picturePages: [...pictureIds].map((x) => ({ page: safeName(x), what: mirrorPictures ? 'mirrored as asked; its picture is not' : 'kept left to right (its background picture can\'t be mirrored); mirrorPicturePages true mirrors it anyway' })) } : {}),
    keptForNavigation: 'Page ids, visual names, bookmark names, page and bookmark links are kept: navigation and bookmarks work in the twin without rewiring.',
    timeRightToLeft: a.timeRightToLeft !== false ? 'yes: charts over time run right to left like the rest of the page (the user can choose false: time stays left to right)' : 'no: charts over time keep left to right (the user\'s choice)',
    texts: texts.slice(0, TEXTS_MAX).map(({ rawId, ...t }) => t), ...(texts.length > TEXTS_MAX ? { textsNotListed: texts.length - TEXTS_MAX } : {}),
    labels: Object.assign({ given: Object.keys(labels).length, unknown, withoutLabel: texts.filter((t) => labels[t.id] == null).length }, problems.length ? { problems } : {}),
    arabicMonth: month.offered ? Object.assign(monthShown, { howToApplyAfterGo: howToApply }) : monthShown,
    ...notCopiedOf(R.left),
    ...(R.unreadable.length ? { unreadable: { count: R.unreadable.length, note: 'files that are not JSON: copied as they are, not mirrored' } } : {}),
    sayFirst: 'Nothing was written. Show the user this plan: the twin\'s name and place, the pages, what mirrors, what cannot, and the Arabic texts. draftArabic comes from a fixed glossary; for every other text draft the Arabic yourself in modern, simple Standard Arabic (Western digits, product names in Latin letters, short and natural, not a word-for-word translation) and show each one to the user as a DRAFT. Never translate silently and never write a text the user has not approved: a text without an approved label stays as it is. Call this tool again with the approved texts as labels ({ id: text }) to get a plan id for exactly those, show it, and after the user\'s go call approve_plan, then this tool with planId.'
  }, (x) => JSON.stringify(x).length) };
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
export function writeTwin(a, plan) {
  const d = plan.data || {};
  // (B-02) the original as it was when the plan was approved: changed since, nothing is written
  if (d.source && reportPrint(a.path) !== d.source) throw new Error('Nothing was written: the original report changed after the plan was approved. Make the plan again (call this tool without planId), show it to the user and wait for their go.');
  const asked = a.labels ? sortKeys(planTwin(Object.assign({}, a, { labels: a.labels })).labels) : null;
  if (asked && JSON.stringify(asked) !== JSON.stringify(sortKeys(d.labels))) throw new Error('Nothing was written: these labels differ from the labels of the approved plan. Show the user the new labels, get a new plan id for them (call this tool without planId), and wait for the user\'s go.');
  const P = planTwin({ path: a.path, labels: d.labels || {}, timeRightToLeft: d.timeRightToLeft, arabicMonth: d.arabicMonth, mirrorPicturePages: d.mirrorPicturePages });
  // (B-154) the model the plan read (for the month column and the dates), as it was at the go
  if ('modelPrint' in d && (P.modelPrint || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id));
  const { loc, R } = P;
  const twinDir = path.join(loc.project, loc.base + ' AR.Report'), twinPbip = path.join(loc.project, loc.base + ' AR.pbip');
  if (!nothingAt(twinDir) || !nothingAt(twinPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(twinDir) ? twinPbip : twinDir)}" is already there. DataArcus never writes over a file: rename or move the old twin, then ask again.`);
  real(twinDir); real(twinPbip);
  // everything is built in memory first (the plan's own build: buildTwin); then written, each file new
  const out = new Map(), labels = rawLabels(P.texts, P.labels);
  let applied = P.built.applied;
  P.built.pages.forEach(({ pg, page, visuals }) => {
    // (a page.json that is not an object is copied as it is: there is nothing to label or mirror in it)
    if (isObj(page)) out.set(pg.rel, json(page));
    visuals.forEach((vj, i) => out.set(pg.visuals[i].rel, json(vj)));
  });
  if (P.built.ext) out.set(EXT, json(P.built.ext));
  R.bookmarks.forEach((b) => { if (labels['bookmark:' + b.json.name] != null) { out.set(b.rel, json(Object.assign({}, b.json, { displayName: labels['bookmark:' + b.json.name] }))); applied++; } });
  if (R.hasPlatform) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + ' AR' }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); out.set('.platform', json(pl)); }
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(twinDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { const o = mustJson(loc.pbip, path.basename(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(twinDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(twinDir) } }); pbip = o; }
  // the cross-review's T8 and audit 6's A6-4: the one writer (lib/files.mjs), all or nothing: the twin's folder, the month
  // script (when offered and not already there with the same text) and the .pbip last; on any failure nothing is left
  const tree = R.files.map((rel) => ({ path: path.basename(twinDir) + '/' + rel, data: out.has(rel) ? out.get(rel) : readBytes(path.join(loc.dir, ...rel.split('/'))) }));
  let month = { written: false, why: P.month.why };
  if (P.month.offered) {
    const f = scriptName(loc.project, `${loc.base} AR - Arabic month`, P.month.script);
    if (f.free) tree.push({ path: path.basename(f.file), data: P.month.script });
    month = { scriptFile: pathOut(f.file), column: P.month.column, table: P.month.table, howToApply: P.month.howToApply };
  }
  tree.push({ path: path.basename(twinPbip), data: json(pbip) });
  writeTree(loc.project, tree);
  return { written: true, report: pathOut(twinDir), pbip: pathOut(twinPbip), files: R.files.length + 1, pages: P.answer.pages.length, mirrors: P.answer.mirrors, cannot: P.answer.cannot,
    labelsApplied: applied, textsWithoutLabel: P.answer.labels.withoutLabel, original: 'only read: not changed', arabicMonth: month,
    ...(P.answer.fitted ? { fitted: P.answer.fitted } : {}), ...(P.answer.titleMeasures ? { titleMeasures: P.answer.titleMeasures } : {}),
    nextSteps: `Open "${path.basename(twinPbip)}" in Power BI Desktop (the original stays as it was), look at every page, and check it with check_report. Tell the user what cannot be mirrored (cannot)${P.month.offered ? ' and how to apply the month script' : ''}.` };
}
