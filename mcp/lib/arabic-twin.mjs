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
// (the untrusted-text screen lives in the reading block: the cross-review's Break 1, 11 Oct)
import { INSTRUCTION } from './read-report.mjs';
import { proposeArabic } from './arabic-names.mjs';

const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');

// the limits check_report reads a report within (8 MB a file, 12 levels), and a count
const MB = 1024 * 1024, LIMITS = { file: 8 * MB, depth: 12, files: 20000 }, TEXT_CAP = 200, TEXTS_MAX = 400;
const isFile = (f) => { try { return fs.lstatSync(f).isFile(); } catch (e) { return false; } };
const isDir = (f) => { try { return fs.lstatSync(f).isDirectory(); } catch (e) { return false; } };
const relRoot = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const readText = (f) => { const b = fs.readFileSync(f); return b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf ? b.subarray(3).toString('utf8') : b.toString('utf8'); };
const json = (o) => JSON.stringify(o, null, 2) + '\n';
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTH_COLUMN = 'Month Name (Arabic)', MONTH_SORT = 'Month Number (AR sort)';

// ---- the original: a .pbip, a .Report folder, or a folder holding exactly one .Report ----
function locate(p) {
  const full = inside(p);
  let dir = null, pbip = null;
  if (isFile(full) && /\.pbip$/i.test(full)) {
    pbip = full; dir = full.replace(/\.pbip$/i, '.Report');
    try { if (fs.lstatSync(full).size < MB) { const a = JSON.parse(readText(full)), r = ((a.artifacts || []).find((x) => x && x.report) || {}).report; if (r && r.path) dir = path.resolve(path.dirname(full), String(r.path)); } } catch (e) { /* the default name */ }
  } else if (isDir(full) && /\.Report$/i.test(full)) dir = full;
  else if (isDir(full)) {
    const reps = fs.readdirSync(full).filter((n) => /\.Report$/i.test(n) && isDir(path.join(full, n)));
    if (reps.length !== 1) throw new Error(reps.length ? `"${p}" holds ${reps.length} reports: name one of them (its .pbip file or its .Report folder).` : `"${p}" holds no report: give the report's .pbip file or its .Report folder.`);
    dir = path.join(full, reps[0]);
  } else throw new Error(`"${p}" is not a report: give the report's .pbip file or its .Report folder.`);
  real(dir, p);
  if (!isDir(dir)) throw new Error(`The report folder of "${p}" is not there.`);
  if (!isDir(path.join(dir, 'definition'))) throw new Error(isFile(path.join(dir, 'report.json'))
    ? 'This report is in the older PBIR-Legacy format (one report.json). Save it once in Power BI Desktop (it then converts to PBIR), then ask again. Nothing was read beyond that file\'s name.'
    : `"${p}" has no definition folder: it is not a PBIR report.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  if (/\sAR$/i.test(base)) throw new Error(`"${path.basename(dir)}" is already an Arabic twin (its name ends in " AR"): make the twin of the original report instead. Nothing was written.`);
  if (!pbip) { const beside = path.join(path.dirname(dir), base + '.pbip'); if (isFile(beside)) pbip = beside; }
  return { dir, base, pbip, project: path.dirname(dir) };
}

// ---- every file of the report, measured; links are refused, never followed ----
function filesOf(dir) {
  const out = [];
  const walk = (d, depth) => {
    if (depth > LIMITS.depth) throw new Error(`The report has folders deeper than ${LIMITS.depth} levels (a PBIR report is 6 levels deep): not read. Nothing was written.`);
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, e.name);
      if (e.isSymbolicLink()) throw new Error(`The report holds a link (a symbolic link or a junction) at "${visible(path.relative(dir, f)).slice(0, 120)}": DataArcus never follows links. Nothing was written.`);
      if (e.isDirectory()) walk(f, depth + 1);
      else if (e.isFile()) {
        if (out.length >= LIMITS.files) throw new Error(`The report has more than ${LIMITS.files} files: not read. Nothing was written.`);
        const size = fs.lstatSync(f).size;
        if (size > LIMITS.file) throw new Error(`A report file is ${Math.round(size / MB)} MB, above the 8 MB DataArcus reads (the largest report files are well under 1 MB). Nothing was written.`);
        out.push(path.relative(dir, f).split(path.sep).join('/'));
      }
    }
  };
  walk(dir, 0);
  return out.sort();
}

// ---- the report read: pages in order, their visuals, bookmarks ----
function readReport(loc) {
  const files = filesOf(loc.dir), J = {}, unreadable = [];
  const parse = (rel) => { if (rel in J) return J[rel]; try { J[rel] = JSON.parse(readText(path.join(loc.dir, rel))); } catch (e) { J[rel] = null; unreadable.push(rel); } return J[rel]; };
  const pageIds = [...new Set(files.map((f) => (f.match(/^definition\/pages\/([^/]+)\/page\.json$/) || [])[1]).filter(Boolean))];
  const order = ((parse('definition/pages/pages.json') || {}).pageOrder || []).map(String);
  const ids = order.filter((id) => pageIds.includes(id)).concat(pageIds.filter((id) => !order.includes(id)));
  const pages = ids.map((id) => {
    const page = parse(`definition/pages/${id}/page.json`) || {};
    const visuals = files.filter((f) => f.startsWith(`definition/pages/${id}/visuals/`) && /\/visual\.json$/.test(f) && f.split('/').length === 6)
      .map((rel) => ({ rel, json: parse(rel) })).filter((v) => v.json && v.json.name != null);
    return { id, rel: `definition/pages/${id}/page.json`, page, visuals };
  });
  const bookmarks = files.filter((f) => /^definition\/bookmarks\/[^/]+\.bookmark\.json$/.test(f)).map((rel) => ({ rel, json: parse(rel) })).filter((b) => b.json);
  const pbir = parse('definition.pbir') || {};
  return { files, pages, bookmarks, pbir, unreadable, phone: files.some((f) => /\/mobile\.json$/.test(f)), hasPlatform: files.includes('.platform') };
}

// ---- the texts a reader sees, for the user's Arabic (cleaned, capped, instruction-like withheld) ----
function textsOf(R) {
  const all = [], seen = new Set();
  const add = (t, where) => { if (seen.has(t.id)) return; seen.add(t.id); all.push(Object.assign(t, where)); };
  R.pages.forEach((pg) => {
    add({ id: 'page:' + pg.id, kind: 'page', text: String(pg.page.displayName || '') }, { page: pg.id });
    pg.visuals.forEach((v) => Mirror.textsOfVisual(pg.id, v.json).forEach((t) => add(t, t.kind === 'field' ? {} : { page: pg.id, visual: String(v.json.name) })));
  });
  R.bookmarks.forEach((b) => add({ id: 'bookmark:' + b.json.name, kind: 'bookmark', text: String(b.json.displayName || '') }, {}));
  return all.map((t) => {
    const raw = String(t.text);
    const out = { id: visible(t.id).slice(0, 160), kind: t.kind };
    if (t.page) out.page = visible(t.page).slice(0, 60);
    if (t.visual) out.visual = visible(t.visual).slice(0, 60);
    if (INSTRUCTION.test(raw)) return Object.assign(out, { text: null, withheld: `reads like an instruction to an AI assistant (${raw.length} characters): not shown, kept as it is unless the user gives its Arabic`, draftArabic: null });
    const text = visible(raw);
    return Object.assign(out, { text: text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) + '…' : text }, text.length > TEXT_CAP ? { long: raw.length } : {}, { draftArabic: proposeArabic(raw) });
  });
}

// ---- the Arabic month column: a TMDL script offered when the model has one date table and no Arabic month ----
const tmdlName = (n) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'");
const daxCol = (t, c) => "'" + String(t).replace(/'/g, "''") + "'[" + String(c).replace(/]/g, ']]') + ']';
function monthOffer(R, loc) {
  const ref = (R.pbir.datasetReference || {}).byPath;
  if (!ref || !ref.path) return { offered: false, why: 'the report is connected to a published model (not a model folder next to it): the column is a model step for the model\'s owner' };
  let m;
  try { m = loadModel(relRoot(path.resolve(loc.dir, String(ref.path)))); } catch (e) { return { offered: false, why: 'the model next to the report could not be read: ' + String(e && e.message || e).slice(0, 160) }; }
  const isDate = (c) => /^date(time)?$/i.test(String(c.dataType || ''));
  let cands = (m.tables || []).filter((t) => t.date && (t.columns || []).some(isDate));
  if (!cands.length) cands = (m.tables || []).filter((t) => /calendar|date|تقويم|تاريخ/i.test(t.name) && (t.columns || []).some(isDate));
  if (cands.length !== 1) return { offered: false, why: cands.length ? `the model has ${cands.length} date tables: say which one, and the column is a model step done by hand` : 'the model has no date table (a table marked as date table, or named like a calendar, with a date column)' };
  const t = cands[0], cols = t.columns || [];
  const has = (re) => cols.find((c) => re.test(String(c.name)));
  if (has(/^month name \(arabic\)$/i) || cols.some((c) => /(arabic|عربي|\bAR\b)/i.test(c.name) && /(month|شهر)/i.test(c.name)) || has(/^(اسم\s*)?الشهر$/)) return { offered: false, why: `the date table "${visible(t.name)}" has an Arabic month column already` };
  const raw = ((m.tmsl && m.tmsl.model && m.tmsl.model.tables) || []).find((x) => x.name === t.name) || {};
  const date = (raw.columns || []).find((c) => c.name && isDate(c) && c.isKey) || cols.find(isDate);
  const num = cols.find((c) => /^int64$/i.test(String(c.dataType || '')) && /^(month\s*(number|no\.?|num|nr|of year|index)|monthnum(ber)?|month)$/i.test(String(c.name).trim()));
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

// ---- the plan ----
const sortKeys = (o) => Object.fromEntries(Object.keys(o || {}).sort().map((k) => [k, String(o[k])]));
const cleanLabel = (s) => String(s).replace(/[\p{Cc}]/gu, ' ').trim().slice(0, TEXT_CAP);
export function twinKey(p) { const { dir } = locate(p); try { return fs.realpathSync.native(dir); } catch (e) { return dir; } }

export function planTwin(a) {
  const loc = locate(a.path), R = readReport(loc);
  const twinDir = path.join(loc.project, loc.base + ' AR.Report'), twinPbip = path.join(loc.project, loc.base + ' AR.pbip');
  const free = nothingAt(twinDir) && nothingAt(twinPbip);
  const texts = textsOf(R), ids = new Set(texts.map((t) => t.id));
  const given = a.labels || {}, labels = {}, unknown = [];
  Object.keys(given).forEach((k) => { if (ids.has(k)) labels[k] = cleanLabel(given[k]); else unknown.push(visible(k).slice(0, 160)); });
  texts.forEach((t) => { if (labels[t.id] != null) t.label = labels[t.id]; });
  // what mirrors, counted per kind, and what cannot
  const kinds = {}, where = { custom: [], navigator: [], slicer: [], matrix: [] };
  const pages = R.pages.map((pg) => {
    const r = Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), { timeRightToLeft: a.timeRightToLeft !== false });
    Object.entries(r.kinds).forEach(([k, n]) => { kinds[k] = (kinds[k] || 0) + n; });
    pg.visuals.forEach((v) => { const k = Mirror.kindOf(v.json); if (where[k]) where[k].push(visible(pg.id + '/' + v.json.name).slice(0, 120)); });
    return { id: visible(pg.id).slice(0, 60), name: INSTRUCTION.test(String(pg.page.displayName || '')) ? '(withheld)' : visible(String(pg.page.displayName || '')).slice(0, 60), size: `${pg.page.width} x ${pg.page.height}`, tooltip: pg.page.type === 'Tooltip', visuals: pg.visuals.length };
  });
  const mirrors = Object.keys(kinds).map((k) => ({ kind: k, what: Mirror.KIND_WHAT[k], count: kinds[k] }));
  const cannot = [];
  if (where.custom.length) cannot.push({ what: 'custom visuals', why: 'moved only: no report setting reaches inside a custom visual (its labels, sides and menus stay as they are; a licensed one may ask for a sign-in when its page opens)', where: where.custom.slice(0, 30) });
  if (where.navigator.length) cannot.push({ what: 'the page navigator\'s order', why: 'Power BI has no order setting: the first page stays at the left. It lists the twin\'s own pages by their (Arabic) names and keeps working', where: where.navigator.slice(0, 30) });
  if (where.slicer.length) cannot.push({ what: 'slicer items', why: 'moved only: the items keep Power BI\'s own alignment (no setting was proven)', where: where.slicer.slice(0, 30) });
  if (where.matrix.length) cannot.push({ what: 'matrix rows', why: 'a matrix keeps its row headers at the left (a hierarchy keeps its order); only its values are reversed', where: where.matrix.slice(0, 30) });
  cannot.push({ what: 'Power BI\'s own words', why: '"All", "Select all", "Total", "(Blank)", the visual header menu, the filter pane, date and number formats follow the viewer\'s Power BI language and regional settings, not the report: an Arabic viewer sees them in Arabic' });
  cannot.push({ what: 'data values', why: 'category names, legend entries, slicer items and month names come from the model: Arabic columns are a model step (see arabicMonth)' });
  cannot.push({ what: 'the phone layout', why: R.phone ? 'copied as it is (a phone shows one column; the phone layout is not mirrored)' : 'the report has none' });
  const month = a.arabicMonth === false ? { offered: false, why: 'not asked (arabicMonth false)' } : monthOffer(R, loc);
  const { script, howToApply, ...monthShown } = month;
  const ref = (R.pbir.datasetReference || {}).byPath;
  return { loc, R, labels, texts, month, answer: {
    written: false,
    original: { report: relRoot(loc.dir), pbip: loc.pbip ? relRoot(loc.pbip) : null, readOnly: 'only read: never changed' },
    twin: { report: path.basename(twinDir), pbip: path.basename(twinPbip), folder: relRoot(loc.project) || '.', model: ref && ref.path ? relRoot(path.resolve(loc.dir, String(ref.path))) : 'the same model as the original (definition.pbir copied as it is)', nameFree: free },
    pages, mirrors, cannot,
    keptForNavigation: 'Page ids, visual names, bookmark names, page and bookmark links are kept: navigation and bookmarks work in the twin without rewiring.',
    timeRightToLeft: a.timeRightToLeft !== false ? 'yes: charts over time run right to left like the rest of the page (the user can choose false: time stays left to right)' : 'no: charts over time keep left to right (the user\'s choice)',
    texts: texts.slice(0, TEXTS_MAX), ...(texts.length > TEXTS_MAX ? { textsNotListed: texts.length - TEXTS_MAX } : {}),
    labels: { given: Object.keys(labels).length, unknown, withoutLabel: texts.filter((t) => labels[t.id] == null).length },
    arabicMonth: month.offered ? Object.assign(monthShown, { howToApplyAfterGo: howToApply }) : monthShown,
    ...(R.unreadable.length ? { unreadable: { count: R.unreadable.length, note: 'files that are not JSON: copied as they are, not mirrored' } } : {}),
    sayFirst: 'Nothing was written. Show the user this plan: the twin\'s name and place, the pages, what mirrors, what cannot, and the Arabic texts. draftArabic comes from a fixed glossary; for every other text draft the Arabic yourself in modern, simple Standard Arabic (Western digits, product names in Latin letters, short and natural, not a word-for-word translation) and show each one to the user as a DRAFT. Never translate silently and never write a text the user has not approved: a text without an approved label stays as it is. Call this tool again with the approved texts as labels ({ id: text }) to get a plan id for exactly those, show it, and after the user\'s go call approve_plan, then this tool with planId.'
  } };
}

// ---- the write ----
function freeScript(dir, base, text) {
  for (let n = 1; n < 1000; n++) {
    const f = path.join(dir, base + (n > 1 ? ' ' + n : '') + '.tmdl');
    if (nothingAt(f)) { writeNew(f, text); return f; }
    try { if (fs.lstatSync(f).isFile() && fs.readFileSync(f, 'utf8') === text) return f; } catch (e) { /* the next name */ }
  }
  throw new Error('no free file name for the month script');
}
export function writeTwin(a, plan) {
  const d = plan.data || {};
  const asked = a.labels ? sortKeys(planTwin(Object.assign({}, a, { labels: a.labels })).labels) : null;
  if (asked && JSON.stringify(asked) !== JSON.stringify(sortKeys(d.labels))) throw new Error('Nothing was written: these labels differ from the labels of the approved plan. Show the user the new labels, get a new plan id for them (call this tool without planId), and wait for the user\'s go.');
  const P = planTwin({ path: a.path, labels: d.labels || {}, timeRightToLeft: d.timeRightToLeft, arabicMonth: d.arabicMonth });
  const { loc, R, labels } = P;
  const twinDir = path.join(loc.project, loc.base + ' AR.Report'), twinPbip = path.join(loc.project, loc.base + ' AR.pbip');
  if (!nothingAt(twinDir) || !nothingAt(twinPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(twinDir) ? twinPbip : twinDir)}" is already there. DataArcus never writes over a file: rename or move the old twin, then ask again.`);
  real(twinDir); real(twinPbip);
  // everything is built in memory first; then written, each file new
  const out = new Map(), opts = { timeRightToLeft: d.timeRightToLeft !== false };
  let applied = 0;
  R.pages.forEach((pg) => {
    const page = JSON.parse(JSON.stringify(pg.page));
    if (labels['page:' + pg.id] != null) { page.displayName = labels['page:' + pg.id]; applied++; }
    out.set(pg.rel, json(page));
    const r = Mirror.mirrorPage(pg.page, pg.visuals.map((v) => v.json), opts);
    r.visuals.forEach((vj, i) => { applied += Mirror.labelVisual(pg.id, vj, labels); out.set(pg.visuals[i].rel, json(vj)); });
  });
  R.bookmarks.forEach((b) => { if (labels['bookmark:' + b.json.name] != null) { out.set(b.rel, json(Object.assign({}, b.json, { displayName: labels['bookmark:' + b.json.name] }))); applied++; } });
  if (R.hasPlatform) { try { const pl = JSON.parse(readText(path.join(loc.dir, '.platform'))); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + ' AR' }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); out.set('.platform', json(pl)); } catch (e) { /* copied as it is */ } }
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(twinDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { try { const o = JSON.parse(readText(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(twinDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(twinDir) } }); pbip = o; } catch (e) { /* the default above */ } }
  fs.mkdirSync(twinDir);
  for (const rel of R.files) {
    const f = path.join(twinDir, ...rel.split('/'));
    fs.mkdirSync(path.dirname(f), { recursive: true });
    writeNew(f, out.has(rel) ? out.get(rel) : fs.readFileSync(path.join(loc.dir, ...rel.split('/'))));
  }
  writeNew(twinPbip, json(pbip));
  const month = P.month.offered ? { scriptFile: relRoot(freeScript(loc.project, `${loc.base} AR - Arabic month`, P.month.script)), column: P.month.column, table: P.month.table, howToApply: P.month.howToApply } : { written: false, why: P.month.why };
  return { written: true, report: relRoot(twinDir), pbip: relRoot(twinPbip), files: R.files.length + 1, pages: P.answer.pages.length, mirrors: P.answer.mirrors, cannot: P.answer.cannot,
    labelsApplied: applied, textsWithoutLabel: P.answer.labels.withoutLabel, original: 'only read: not changed', arabicMonth: month,
    nextSteps: `Open "${path.basename(twinPbip)}" in Power BI Desktop (the original stays as it was), look at every page, and check it with check_report. Tell the user what cannot be mirrored (cannot)${P.month.offered ? ' and how to apply the month script' : ''}.` };
}
