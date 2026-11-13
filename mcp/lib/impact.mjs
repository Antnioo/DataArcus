// 0.3.3 HX2 (the owner, 11 Nov, D-1111-13; mcp/work/HX2.md): the Impact check, HX1's stages 2 and 3. The reading glue
// around lib/lineage.mjs (pure): the models and the reports read through the reading block, then two answers.
//   impactCheck(path, against, againstModel)   check_report's option againstModel: the report read on an earlier model
//                                              (a backup's or a git checkout's) and on its own; which visuals can show
//                                              another number, each with its chain of names (section impactCheck)
//   likeForLike(path, opts, read)              check_report's option likeForLike (0.3.3 IX2, IX1's stage 2): the report
//                                              read on its own model; which visuals compare with the same Gregorian dates
//                                              and in which months of a year that is not like for like in the Gulf
//                                              (like-for-like.mjs; section likeForLike)
//   readOnModel(path, option, shared)          the one reading the sections share: the report and its own model
//                                              (0.3.3 OX2: check_report's own reading and model, when it gives them)
//   briefCheck(read, brief)                    (0.3.3 OX2, OX1's stage 2) the section briefCheck: brief.mjs on that reading
//   reach(modelPath, what)                     read_model's option reach: the pages and visuals of every report beside
//                                              the model that a measure, a column or a table reaches, by tier
// Never a value: the lineage compares definitions and filters by hash and returns names (safeName) and words only; this
// file adds counts, the reports' and pages' names and the caps. Read-only: models through loadModel (inside the working
// folder, every file measured before it is read), reports through locate, diskSource and inventory.
import path from 'node:path';
import { loadModel } from './model.mjs';
import { locate, diskSource, jsonOpt, inventory, safeName } from './read-report.mjs';
import { lineageOf, compareLineage, reachOf, LISTED_MAX, PROVES, NOT_PROVED } from './lineage.mjs';
import { likeForLike as lflOf } from './like-for-like.mjs';
import { checkVisuals, checkBrief, PROVES as BRIEF_PROVES, NOT_PROVED as BRIEF_NOT_PROVED } from './brief.mjs';

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
// each section's share of its tool's answer (the tools' answers stay under 40,000 characters): the list is cut, never
// the counts, and the cut said in notListed
export const SECTION_MAX = 16000;
export const REACH_NOT_PROVED = 'From the files only: the reports saved beside the model (their definition.pbir names this model folder). A report elsewhere that uses the model (another folder, the Power BI service) is not seen; the data, row-level security, a custom visual\'s own logic and what a DAX text builds at run time are outside it. Which relationships count for a visual is a rule from Microsoft\'s documented filter propagation, not measured in Power BI Desktop.';

// ---- one report, read once through the reading block, in the shape lineageOf takes ({ files: [{ path, json }] }) ----
// (0.3.3 OX2) shared: check_report's own reading ({ loc, src, inv, sk }), so the report is read once for every section
function reportOf(p, shared) {
  const loc = shared ? shared.loc : locate(p, 'check_report'), sk = shared ? shared.sk : { big: [], deep: 0 }, src = shared ? shared.src : diskSource(loc, sk);
  const inv = shared ? shared.inv : inventory(src, path.basename(loc.reportDir));
  const opt = (rel) => jsonOpt(src, rel);
  const pbir = opt('definition.pbir'), by = isObj(pbir) && isObj(pbir.datasetReference) && isObj(pbir.datasetReference.byPath) ? pbir.datasetReference.byPath.path : null;
  return { loc, files: filesOf(inv, opt), model: typeof by === 'string' && by ? path.resolve(loc.reportDir, by) : null, unread: inv.unreadableFiles.length + sk.big.length + sk.deep + (sk.links || []).length + (sk.capped ? 1 : 0) };
}
// (0.3.3 OX2) a report's files in the shape lineageOf takes, from the reading block's inventory (the one builder)
export function filesOf(inv, opt) {
  const files = [];
  ['definition/report.json', 'definition/reportExtensions.json'].forEach((rel) => { const j = opt(rel); if (j) files.push({ path: rel, json: j }); });
  arr(inv.pages).forEach((pg) => { files.push({ path: pg.file, json: isObj(pg.raw) ? pg.raw : {} }); arr(pg.visuals).forEach((x) => { if (x && x.file && isObj(x.json)) files.push({ path: x.file, json: x.json }); }); });
  return files;
}

// (0.3.3 IX2) the report (path) and its own model, read once: againstModel and likeForLike share it (one reading)
// (0.3.3 OX2) shared: check_report's reading ({ loc, src, inv, sk }) and its model loader (modelAt, one load a call)
export function readOnModel(p, option, shared) {
  const after = reportOf(p, shared && shared.inv ? shared : null);
  if (!after.model) throw new Error(`check_report's ${option} reads "${safeName(p)}" on its own model, and its definition.pbir names no model folder (byPath): give a report saved with its model (a .pbip project). Nothing was ${option === 'brief' ? 'checked' : 'compared'}.`);
  return { after, now: shared && shared.modelAt ? shared.modelAt(after.model) : loadModel(after.model) };
}
const unreadOf = (...models) => models.reduce((n, m) => n + arr(m.skipped).length + (m.partsSkipped || 0), 0);

// after: the report check_report checks (path) on its own model; before: against (or path) on againstModel
// (0.3.3 LX1) againstRead: check_report's reading of against (read-report.mjs's reading), shared with sameQuestion
export function impactCheck(p, against, againstModel, read, againstRead) {
  const { after, now } = read || readOnModel(p, 'againstModel'), before = against != null ? reportOf(against, againstRead || null) : after;
  const then = loadModel(againstModel);
  const c = compareLineage(lineageOf(then.tmsl, { files: before.files }), lineageOf(now.tmsl, { files: after.files }));
  const unreadModel = unreadOf(now, then);
  const section = Object.assign({ said: c.said, models: { before: then.source, after: now.source } }, c);
  delete section.tiers; delete section.proves; delete section.notProved;
  // in doubt, more: a model file not read fully means what it defines was not compared, so no visual is said unchanged
  if (unreadModel) {
    section.question += section.same; section.same = 0;
    section.said = `Not every definition file of the two models could be read fully (${unreadModel}), so no visual is counted as unchanged: ${section.question} of ${section.withQuery} visuals can show other numbers (${section.differ.length} listed).`;
  }
  const unread = after.unread + (before === after ? 0 : before.unread);
  if (unread) section.unread = { files: unread, note: 'report files the reading block could not read (too big, too deep, a link, not JSON): their visuals are not compared' };
  Object.assign(section, { tiers: c.tiers, proves: PROVES, notProved: NOT_PROVED });
  // its share of check_report's answer
  const all = section.differ.length + (section.notListed || 0);
  while (JSON.stringify(section).length > SECTION_MAX && section.differ.length > 1) { section.differ = section.differ.slice(0, Math.floor(section.differ.length * 0.8)); section.notListed = all - section.differ.length; }
  return section;
}

// (0.3.3 IX2) likeForLike: { year, country } (gulf-compare.js's); read: readOnModel's, when againstModel read it already
export function likeForLike(p, opts, read) {
  const { after, now } = read || readOnModel(p, 'likeForLike');
  const section = lflOf(now.tmsl, { files: after.files }, opts);
  // what was not read is said: a measure or a visual in it is not counted (the count can only be higher)
  const unread = { model: unreadOf(now), report: after.unread };
  if (unread.model || unread.report) section.unread = Object.assign(unread, { note: 'model or report files that could not be read fully: a comparison or a visual in them is not counted, so more visuals can compare than said' });
  // its share of check_report's answer: the visuals listed cut, the counts kept
  const all = section.compared;
  while (JSON.stringify(section).length > SECTION_MAX && section.list.length > 1) { section.list = section.list.slice(0, Math.floor(section.list.length * 0.8)); section.notListed = all - section.list.length; }
  return section;
}

// (0.3.3 OX2, OX1's stage 2) briefCheck: read is readOnModel's; brief: [{ id, measure, by: [names] }] or null (the
// visuals alone). Each name read by parseReach (one reader): "[Revenue]" or "Revenue" a measure, "Sales[Revenue]" a
// measure written with its table (as reach reads it); "Calendar[Month]" or "'Store'[Region]" a column to group by.
export function briefCheck(read, brief) {
  const { after, now } = read, report = { files: after.files };
  const v = checkVisuals(now.tmsl, report);
  const visuals = { visuals: v.visuals, withNumbers: v.withNumbers, pairs: v.pairs.length, moves: v.moves, oneValue: v.oneValue, constant: v.constant, cannotTell: v.cannotTell, findings: v.findings };
  if (v.notListed) visuals.notListed = v.notListed;
  if (v.notInModel.length) visuals.notInModel = v.notInModel;
  if (v.notInModelNotListed) visuals.notInModelNotListed = v.notInModelNotListed;
  const section = { said: v.said, visuals };
  if (Array.isArray(brief)) {
    const questions = brief.map((q, i) => {
      const w = parseReach(q && q.measure), measure = w.measure != null ? w.measure : w.column != null ? w.column : w.table;
      // a "by" name that is not Table[Column] stays as it is, so the library answers it "not read"
      const by = arr(q && q.by).map((b) => { const x = parseReach(b); return x.column != null ? { table: x.table, column: x.column } : { name: String(b) }; });
      return Object.assign({ id: q && q.id != null ? q.id : 'q' + (i + 1), measure }, { by });
    });
    const b = checkBrief(now.tmsl, report, questions);
    delete b.proves; delete b.notProved;
    section.said += ' ' + b.said;
    section.questions = b;
  }
  const unread = { model: unreadOf(now), report: after.unread };
  if (unread.model || unread.report) section.unread = Object.assign(unread, { note: 'model or report files that could not be read fully: a visual or a measure in them is not judged, so a finding can be missing' });
  Object.assign(section, { proves: BRIEF_PROVES, notProved: BRIEF_NOT_PROVED });
  // its share of check_report's answer: the lists cut, the counts kept
  const allF = v.oneValue, allQ = section.questions ? section.questions.questions : 0;
  while (JSON.stringify(section).length > SECTION_MAX && (visuals.findings.length > 1 || (section.questions && section.questions.results.length > 1))) {
    if (visuals.findings.length > 1) { visuals.findings = visuals.findings.slice(0, Math.floor(visuals.findings.length * 0.8)); visuals.notListed = allF - visuals.findings.length; }
    else { const q = section.questions; q.results = q.results.slice(0, Math.floor(q.results.length * 0.8)); q.notListed = allQ - q.results.length; }
  }
  return section;
}

// ---- reach: "[Measure]", "Table[Column]", "'Table name'[Column]", "Table" or "'Table name'" ----
export function parseReach(what) {
  const s = String(what == null ? '' : what).trim(), unq = (x) => x.replace(/''/g, "'");
  let m = /^\[(.+)\]$/.exec(s); if (m) return { measure: m[1].replace(/\]\]/g, ']') };
  m = /^(?:'((?:[^']|'')+)'|([^[\]']+?))\s*\[(.+)\]$/.exec(s); if (m) return { table: m[1] != null ? unq(m[1]) : m[2].trim(), column: m[3].replace(/\]\]/g, ']') };
  m = /^'((?:[^']|'')+)'$/.exec(s); if (m) return { table: unq(m[1]) };
  return { table: s };
}
const KIND = (w) => (w.measure != null ? 'measure' : w.column != null ? 'column' : 'table');

export function reach(modelPath, what) {
  const m = loadModel(modelPath), want = parseReach(what);
  // the model's own reports, as loadModel read them for the health check (each file measured, links never followed),
  // grouped by report folder
  const groups = new Map();
  arr(m.report && m.report.files).forEach((f) => { const g = /(?:^|\/)([^/]+)\.Report\/(definition\/.+)$/i.exec(String(f.path)); if (!g) return; if (!groups.has(g[1])) groups.set(g[1], []); groups.get(g[1]).push({ path: g[2], json: f.json }); });
  const reports = [];
  let found = false, name = null, kind = KIND(want), total = 0, pages = 0, listed = 0;
  // a model with no report beside it still says whether the name is in the model
  const lineages = groups.size ? [...groups.entries()].map(([n, files]) => [n, lineageOf(m.tmsl, { files })]) : [[null, lineageOf(m.tmsl, { files: [] })]];
  lineages.forEach(([rname, lin]) => {
    // (0.3.3 LX1) reachOf lists what is left of the answer's LISTED_MAX, the strongest tier first, and counts every visual
    const room = LISTED_MAX - listed;
    let w = want, r = reachOf(lin, w, room);
    // "Sales[Total Sales]": a measure written with its table
    if (!r.found && w.column != null) { const alt = reachOf(lin, { measure: w.column }, room); if (alt.found) { w = { measure: w.column }; r = alt; kind = 'measure'; } }
    if (r.found) { found = true; name = r.name; }
    if (rname == null) return;
    total += r.count; pages += r.pages; listed += r.visuals.length;
    // the pages in the report's order, each page's visuals as reachOf ordered them (the strongest tier first)
    const order = [...new Set(lin.visuals.map((v) => v.page))], out = { report: safeName(rname), visuals: r.count, pages: [] };
    order.forEach((page) => { const vs = r.visuals.filter((v) => v.page === page); if (vs.length) out.pages.push({ page, visuals: vs.map((v) => ({ visual: v.visual, type: v.type, tier: v.tier })) }); });
    reports.push(out);
  });
  const R = reports.length;
  const said = !found ? `${KIND(want) === 'measure' ? 'This measure' : KIND(want) === 'column' ? 'This column' : 'This table'} is not in the model: no ${KIND(want)} of that name, so it reaches no visual.`
    : `${name} reaches ${total} visual${total === 1 ? '' : 's'} on ${pages} page${pages === 1 ? '' : 's'} of ${R} report${R === 1 ? '' : 's'} beside the model${listed < total ? ` (${listed} listed)` : ''}.`;
  const seen = m.reportsSeen || {};
  const answer = Object.assign({ said, found, name, kind, visuals: total, listed }, listed < total ? { notListed: total - listed } : {}, { reports },
    arr(seen.notRead).length || arr(seen.skipped).length ? { notRead: { reports: arr(seen.notRead).slice(0, 10), files: arr(seen.skipped).length, note: 'reports or report files that could not be read: the visuals in them are not counted' } } : {},
    { tiers: 'question: the numbers can differ when it changes; display: the same numbers shown otherwise; order: the same numbers in another order', notProved: REACH_NOT_PROVED });
  // its share of read_model's answer: the visuals listed cut, the counts kept
  while (JSON.stringify(answer).length > SECTION_MAX && answer.listed > 1) {
    let keep = Math.floor(answer.listed * 0.8); answer.reports.forEach((rp) => { rp.pages = rp.pages.map((pg) => { const v = pg.visuals.slice(0, keep); keep -= v.length; return Object.assign({}, pg, { visuals: v }); }).filter((pg) => pg.visuals.length); });
    answer.listed = answer.reports.reduce((n, rp) => n + rp.pages.reduce((k, pg) => k + pg.visuals.length, 0), 0); answer.notListed = total - answer.listed;
  }
  return answer;
}
