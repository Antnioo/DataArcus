// The Arabic twin, step 8: the write, exactly the plan's build, after the user's go (0.3.1 K2: the files the plan kept).
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import fs from 'node:fs';
import path from 'node:path';
import { nothingAt, real } from './model.mjs';
import { readBytes, reportPrint, mustJson } from './read-report.mjs';
import { writeTree } from './files.mjs';
import { testEditBeforeWrite } from './write-io.mjs';
import { modelChanged } from './plans.mjs';
import { out } from './answer.mjs';
import * as Terms from './terminology.mjs';
import { pathOut, json, isObj, EXT } from './twin-read.mjs';
import { rawLabels, sortKeys, normTerms } from './twin-texts.mjs';
import { modelOf } from './twin-model.mjs';
import { digestOf } from './artifact.mjs';
import { newPlatform } from './twin-copy.mjs';
import { planTwin } from './twin-plan.mjs';
import { createRequire } from 'node:module';
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
/** (0.3.1 K2, an outside architecture review of 25 Oct: the write built the twin again and wrote that rebuild, with a
 *  .platform logical id of its own) the exact files the twin writes, built once from a plan's P, as create_report's plan
 *  keeps its own (tools/plan_layout.mjs: exactArtifact): the copied report's files (the original's unchanged files read
 *  now), its own reportExtensions.json when the original has none, .platform with the logical id the plan chose
 *  (P.logicalId), the month script when offered and not already there, and the .pbip last; paths from the project
 *  folder. Returns { files, digest (lib/artifact.mjs: digestOf), logicalId, applied, month }. */
export function twinTree(P) {
  const { loc, R } = P;
  const twinDir = path.join(loc.project, P.outBase + '.Report'), twinPbip = path.join(loc.project, P.outBase + '.pbip');
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
  if (R.hasPlatform) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + ' AR' }); pl.config = Object.assign({}, pl.config, { logicalId: P.logicalId }); out.set('.platform', json(pl)); }
  // (0.3.0 A1) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the twin writes its own, as create_report does
  else out.set('.platform', newPlatform(loc.base + ' AR', P.logicalId));
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
  return { files: tree, digest: digestOf(tree), logicalId: P.logicalId, applied, month };
}
/** (D6, the laptop proof of rc.2: the twin's approval page said one sentence) every file the twin writes, by its path in
 *  the folder it is written in: the paths of the plan's exact files (twinTree) */
export function twinOutputs(P, T) { return (T || twinTree(P)).files.map((f) => f.path); }
/** The write of an approved plan: art is the exact files the plan kept (twinTree's, lib/plans.mjs: artifactOf); they are
 *  written byte for byte, or nothing is. */
export function writeTwin(a, plan, art) {
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
  // (K2) the plan's exact files: kept in this session only (a restart, or more than the newest 64 plans, drops them)
  if (!art || !Array.isArray(art.files)) throw new Error('Nothing was written: the files kept for this plan are gone (DataArcus keeps a plan\'s exact files in this session of the server only). Make the plan again (call this tool without planId), show it to the user and wait for their go.');
  // (K2) built again with the plan's inputs and its logical id, for comparison only: what is written is the kept files
  const P = planTwin({ path: a.path, labels: d.labels || {}, terms: d.terms || {}, memory: false, timeRightToLeft: d.timeRightToLeft, waterfallRtl: d.waterfallRtl, arabicMonth: d.arabicMonth, mirrorPicturePages: d.mirrorPicturePages, into: d.into, tabsShown: d.tabsShown, logicalId: art.logicalId });
  // (B-154) the model the plan read (for the month column and the dates), as it was at the go
  if ('modelPrint' in d && (P.modelPrint || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id));
  const { loc, R } = P;
  const twinDir = path.join(loc.project, P.outBase + '.Report'), twinPbip = path.join(loc.project, P.outBase + '.pbip');
  if (!nothingAt(twinDir) || !nothingAt(twinPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(twinDir) ? twinPbip : twinDir)}" is already there. DataArcus never writes over a file: rename or move the old ${P.same ? 'copy' : 'twin'}, then ask again.`);
  real(twinDir); real(twinPbip);
  // (K2) the kept files are the ones approved (their digest), and the twin built again now gives the same files: else
  // something it is made from changed that neither print sees (a file next to the report), and nothing is written
  if (digestOf(art.files) !== art.digest || twinTree(P).digest !== art.digest) throw new Error('Nothing was written: the twin built again now is not the one that was approved (something it is made from changed since the go, such as a file next to the report). Make the plan again (call this tool without planId), show it to the user and wait for their go.');
  // (0.3.0 S1, B-182, as R6's F07 for create_report) the model read again right before the first write (no folder is made
  // yet): its print the approved one, or nothing is written (the read above can be seconds older than the write)
  if ('modelPrint' in d) { testEditBeforeWrite(); const now = modelOf(R, loc).m; if (((now && now.print) || null) !== (d.modelPrint || null)) throw new Error(modelChanged(plan.id)); }
  writeTree(loc.project, art.files);
  // (0.3.0 J18) the terms of the written plan are confirmed for this model (this session only)
  if (Array.isArray(d.terminology)) Terms.remember(P.model, d.terminology);
  const extAdded = !P.copy && !!P.built.ext && !R.files.includes(EXT), month = art.month;
  return { written: true, report: pathOut(twinDir), pbip: pathOut(twinPbip), files: P.copy ? P.copy.files.length + 1 : R.files.length + 1 + (extAdded ? 1 : 0) + (R.hasPlatform ? 0 : 1), pages: P.copy ? P.copy.pairs.length * 2 : P.answer.pages.length,
    ...(P.answer.languages ? { languages: P.answer.languages } : {}), mirrors: P.answer.mirrors, cannot: P.answer.cannot, ...(P.answer.notFullyArabic ? { notFullyArabic: P.answer.notFullyArabic } : {}),
    labelsApplied: art.applied, textsWithoutLabel: P.answer.labels.withoutLabel, notTranslated: P.answer.notTranslated, phone: P.answer.phone, original: 'only read: not changed', arabicMonth: month,
    ...(P.answer.fitted ? { fitted: P.answer.fitted } : {}), ...(P.answer.titleMeasures ? { titleMeasures: P.answer.titleMeasures } : {}),
    exact: { digest: art.digest, files: art.files.length, note: 'These are the files the plan built before the go, written byte for byte (the digest is the plan\'s).' },
    nextSteps: `Open "${path.basename(twinPbip)}" in Power BI Desktop (the original stays as it was), look at every page, and check it with check_report. Tell the user what cannot be mirrored (cannot)${P.month.offered ? ' and how to apply the month script' : ''}.` };
}
