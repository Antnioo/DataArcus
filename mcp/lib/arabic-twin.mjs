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
import { real, nothingAt } from './model.mjs';
// (the reading block's screen, locate, JSON reader, strict file list, inventory and limits: the cross-review's Break 1,
// T3 and R1, 11 Oct; strictFiles refuses a link or a deep folder, never skips it, as a writer must)
import { mustJson, reportPrint, readBytes } from './read-report.mjs';
import { writeTree } from './files.mjs';
import { testEditBeforeWrite } from './write-io.mjs';
import { modelChanged } from './plans.mjs';
// (the fuzz test's F-TP: the plan's own answer within 40,000 characters, whoever calls planTwin)
import { out } from './answer.mjs';
import * as Terms from './terminology.mjs';
import { pathOut, json, bytesAt, isObj, EXT } from './twin-read.mjs';
import { rawLabels, sortKeys, normTerms } from './twin-texts.mjs';
import { modelOf } from './twin-model.mjs';
import { newPlatform } from './twin-copy.mjs';
import { planTwin } from './twin-plan.mjs';
// (0.3.1 S9) the twin is split by step into lib/twin-*.mjs (reading, visuals, texts, model, pages, the EN-AR copy, plan,
// preview, write); this module stays what the server, check_report and the lens import, with the same exports
export { monthOffer } from './twin-model.mjs';
export { COPY_TAG } from './twin-copy.mjs';
export { MATRIX_SAID, twinKey, planTwin } from './twin-plan.mjs';

const require = createRequire(import.meta.url);
const Gallery = require('../../assets/js/visual-gallery.js');

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
/** (0.3.1 V1, the owner, 25 Oct: "in the approval page I couldn't find the preview sketch") the twin's pages as the
 *  approval page draws them: the shared renderer's pages (assets/js/page-preview.js fromFiles, as the report's preview),
 *  read from the plan's own build, the files writeTwin writes (P.built's pages, or the copy's files P.copy). A page hidden
 *  in the tabs is drawn too (the copy hides one language); tooltip pages are not, as on the report's page. Each Arabic
 *  page is drawn right to left (a page kept left to right for its picture stays so), the copy's English pages left to
 *  right. From the plan only: types, positions, sizes, titles, field names, the theme's colours; never a value.
 *  Returns { lang: 'ar', pages, pairs? ([[english, arabic]] indexes into pages, the copy's) } or null. */
export function twinPreview(P) {
  // (the renderer is loaded here, not at the top, to keep this block apart from the lines the twin's writers change)
  const Preview = require('../../assets/js/page-preview.js');
  try {
    const { R, loc } = P, PJ = 'definition/pages/pages.json', files = [];
    const src = (rel) => bytesAt(loc, rel);
    const shown = (rel, data) => { if (!/\/page\.json$/.test(rel)) return data; try { const j = JSON.parse(typeof data === 'string' ? data : data.toString('utf8')); if (isObj(j) && j.visibility === 'HiddenInViewMode') { delete j.visibility; return json(j); } } catch (e) { /* not JSON: as it is */ } return data; };
    if (P.copy) P.copy.files.filter((f) => /^definition\/(pages\/|reportExtensions\.json$)/.test(f.rel)).forEach((f) => files.push({ path: f.rel, data: shown(f.rel, f.data != null ? f.data : src(f.from)) }));
    else {
      P.built.pages.forEach(({ pg, page, visuals }) => { if (isObj(page)) files.push({ path: pg.rel, data: shown(pg.rel, json(page)) }); visuals.forEach((vj, i) => files.push({ path: pg.visuals[i].rel, data: json(vj) })); });
      files.push({ path: PJ, data: R.files.includes(PJ) ? src(PJ) : json({ pageOrder: R.pages.map((pg) => String(pg.id)) }) });
      if (P.built.ext || R.ext) files.push({ path: EXT, data: json(P.built.ext || R.ext) });
    }
    if (R.theme) files.push({ path: 'StaticResources/RegisteredResources/theme.json', data: json(R.theme) });
    const T = R.theme || {}, pg0 = isObj(T.visualStyles) && isObj(T.visualStyles.page) && isObj(T.visualStyles.page['*']) && Array.isArray(T.visualStyles.page['*'].background) ? T.visualStyles.page['*'].background[0] : null;
    const colors = { background: pg0 && pg0.color && pg0.color.solid ? pg0.color.solid.color : undefined, card: T.background, ink: T.foreground, accent: Array.isArray(T.dataColors) ? T.dataColors[0] : undefined };
    const pages = Preview.fromFiles(files, { colors });
    // which pages are Arabic: the twin's all (but those kept left to right), the copy's its pairs' Arabic pages
    const ltrIds = new Set(R.pages.filter((pg) => P.keepLtr(pg)).map((pg) => String(pg.id)));
    const arIds = P.copy ? new Map(P.copy.pairs.map((x) => [String(x.arabic.id), String(x.english.id)])) : null;
    pages.forEach((p) => { p.rtl = arIds ? arIds.has(p.id) && !ltrIds.has(arIds.get(p.id)) : !ltrIds.has(p.id); });
    if (!P.copy) return { lang: 'ar', pages };
    const at = new Map(pages.map((p, i) => [p.id, i]));
    const pairs = P.copy.pairs.filter((x) => at.has(String(x.english.id)) && at.has(String(x.arabic.id))).map((x) => [at.get(String(x.english.id)), at.get(String(x.arabic.id))]);
    return { lang: 'ar', pages, pairs };
  } catch (e) { return null; }   // (a shape not expected: the approval page shows the plan without its pictures)
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
