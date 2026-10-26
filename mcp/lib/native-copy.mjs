// 0.2.9, custom visuals, step C (the MCP tools' adapter): a report's custom visuals replaced by native Power BI visuals,
// in a NEW report "<name> native" next to the original, as the Arabic twin writes "<name> AR". The original is only read.
// plan_layout (customVisualsFrom) lists each replacement with what it loses; the user approves that plan; create_report
// (the same customVisualsFrom and the approved planId) writes exactly the approved replacements, and refuses when the
// report changed since the plan. Blocks: the meaning and the mapping are the reading block's (visual-meaning.mjs:
// replacementsOf, typeOfModel); the visual.json is the writer's (assets/js/visual-replace.js); this file only reads the
// report through the reading block and writes through the one writer (files.mjs). A network has no native visual: it is
// listed, never written here (an HTML/SVG measure is step D).
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { real, nothingAt, ROOT } from './model.mjs';
import { safeName, mustJson, readBytes, isFile, locate as readerLocate, strictFiles, notCopiedOf, inventory, diskSource } from './read-report.mjs';
import { replacementsOf, replacementLine, typeOfModel, wordsOf, CONFIDENCE_LEVELS } from './visual-meaning.mjs';
import { rulesInput, filledLanguages } from './check-report.mjs';
import { newPlatform } from './twin-copy.mjs';
import { writeTree } from './files.mjs';
import { digestOf } from './artifact.mjs';

const require = createRequire(import.meta.url);
const Replace = require('../../assets/js/visual-replace.js');
const json = (o) => JSON.stringify(o, null, 2) + '\n';
const relRoot = (f) => path.relative(ROOT, f).split(path.sep).join('/');
const pathOut = (f) => relRoot(f).split('/').map((seg) => (seg === '..' || seg === '.' ? seg : safeName(seg))).join('/');
const SUFFIX = ' native';

function locate(p) {
  const loc = readerLocate(p, 'plan_layout'), dir = loc.reportDir;
  if (!/\.Report$/i.test(dir)) throw new Error(`"${p}" is a folder holding a definition folder, not a .Report folder: give the report's .pbip file or its .Report folder (customVisualsFrom), so the native copy can be named after it. Nothing was written.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  let pbip = loc.pbipPath;
  if (!pbip) { const beside = path.join(path.dirname(dir), base + '.pbip'); if (isFile(beside)) pbip = beside; }
  return { dir, base, pbip, project: path.dirname(dir), outDir: path.join(path.dirname(dir), base + SUFFIX + '.Report'), outPbip: path.join(path.dirname(dir), base + SUFFIX + '.pbip') };
}
// the model's formats, for the percentage rule: a measure's own, an aggregated column's
function formatOfModel(tables) {
  const map = new Map();
  (tables || []).forEach((t) => { (t.measures || []).forEach((x) => map.set(`m:${x.name}`, x.formatString)); (t.columns || []).forEach((c) => map.set(`c:${t.name}[${c.name}]`, c.formatString)); });
  return (f) => (!f ? undefined : f.kind === 'measure' ? map.get(`m:${f.name}`) : map.get(`c:${f.table}[${f.name}]`));
}
// (0.3.1 NC2) the calendar heatmap's matrix: in the date column's own table, a year, a month and a weekday column the
// model sorts (a name with its sort-by column, or a number); matched by their names' words, never shown or followed
function calendarOfModel(tables) {
  const NAMES = { month: [['month'], ['month', 'name'], ['month', 'number'], ['month', 'no']], weekday: [['weekday'], ['weekday', 'name'], ['day', 'name'], ['day', 'of', 'week'], ['weekday', 'number'], ['day', 'of', 'week', 'number']], year: [['year'], ['year', 'number']] };
  const is = (c, k) => { const w = wordsOf(c.name).filter((x) => !/\d/.test(x)); return NAMES[k].some((l) => l.length === w.length && l.every((x) => w.includes(x))); };
  const ord = (c) => (c.dataType === 'string' && c.sortBy) || /^int64$/i.test(String(c.dataType));
  return (f) => {
    const t = (tables || []).find((x) => x && x.name === (f && f.table)), cols = ((t && t.columns) || []).filter((c) => c && !c.isHidden && c.name !== f.name);
    const pickOne = (k) => { const l = cols.filter((c) => is(c, k) && ord(c)); return l.find((c) => c.dataType === 'string') || l[0] || null; };
    const fieldOf = (c) => (c ? { kind: 'column', table: t.name, name: c.name, queryRef: `${t.name}.${c.name}` } : null);
    const month = pickOne('month'), weekday = pickOne('weekday'), year = cols.find((c) => is(c, 'year') && /^int64$/i.test(String(c.dataType)));
    return month && weekday ? { year: fieldOf(year), month: fieldOf(month), weekday: fieldOf(weekday) } : null;
  };
}
// the plan's lead line: how many replacements, at each level of confidence, and how many are guesses
function leadOf(replace) {
  const k = replace.length, at = (l) => replace.filter((e) => e.confidence === l).length, g = replace.filter((e) => e.guess).length;
  return `${k} replacement${k === 1 ? '' : 's'}: ${at('high')} high, ${at('medium')} medium, ${at('low')} low; ${g} of ${k} are guesses${g ? ' (the report holds no package for them: matched by their fields\' kinds, their role names and their ids\' words)' : ''}.`;
}
/** (NC2) the approval page's rows of a native copy: the lead line first, then each replacement with its confidence,
 *  evidence, losses and second option (plan_layout's customVisualsShown). */
export function shownOf(answer) {
  const a = answer || {}, reps = Array.isArray(a.replacements) ? a.replacements : [];
  return (a.confidence && a.confidence.lead ? [{ lead: a.confidence.lead, levels: a.confidence.levels }] : []).concat(reps.map((x) => Object.assign({ line: x.line, lost: x.lost || [], confidence: x.confidence, evidence: x.evidence }, x.second ? { second: x.second } : {})));
}
// what the gate pins and the write compares: each entry's visual, native type and roles (by queryRef)
// (0.3.0 J19) and its panels, when its values may not share one axis
const keyOf = (entries) => JSON.stringify(entries.map((e) => ({ visual: e.visual, native: e.native, roles: e.roles, panels: e.panels || null })));

// model: loadModel's answer for the report's model (its tables: data types and formats); axes (0.3.0 J19): the model's
// measures and the person's answers on shared axes ({ tables, confirmed }, axis-units.js)
// (NC2) opts: { second: the keys of customVisualsSecond }
export function planNative(reportPath, model, axes, opts) {
  const loc = locate(reportPath);
  const left = []; strictFiles(loc.dir, { files: 20000, tail: ' Nothing was written.', left });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  // (0.3.1 SQ2, J19-S1) each page's language, as check_report tells it: an Arabic page's panels say their units in Arabic
  const langs = filledLanguages(inv, rulesInput(inv).R).pages, langOf = (p) => (langs[p.id] === 'ar' ? 'ar' : 'en');
  const second = ((opts && opts.second) || []).map(String);
  const entries = replacementsOf(inv, { typeOf: typeOfModel(model && model.tables), formatOf: formatOfModel(model && model.tables), factsOf: Replace.formatFacts, axes, langOf, second, calendarOf: calendarOfModel(model && model.tables) });
  const replace = entries.filter((e) => e.native), keep = entries.filter((e) => !e.native);
  const free = nothingAt(loc.outDir) && nothingAt(loc.outPbip);
  const answer = {
    report: pathOut(loc.dir), nativeReport: pathOut(loc.outDir), original: 'only read: never changed',
    ...(replace.length ? { confidence: { lead: leadOf(replace), levels: CONFIDENCE_LEVELS } } : {}),
    replacements: replace.map((e) => Object.assign({ line: replacementLine(e), page: e.page, place: e.place, from: e.from, native: e.native, confidence: e.confidence, evidence: e.evidence, guess: e.guess, lost: e.lost, tell: e.tell }, e.axes ? { axes: e.axes } : {},
      e.second ? { second: { pick: e.second.pick, native: e.second.native, label: e.second.label, chosen: e.second.chosen, lost: e.second.lost, how: e.second.chosen ? 'written as the second option (customVisualsSecond); leave its key out to write the first' : `to write this instead: customVisualsSecond ["${e.second.pick}"], the user's own choice` } } : {})),
    notReplaced: keep.map((e) => ({ line: replacementLine(e), why: e.htmlNeeded ? 'no native visual draws it: an HTML/SVG measure (a later step) or a table of its links; it stays the custom visual in the copy' : 'no native visual takes its fields: it stays the custom visual in the copy' })),
    ...notCopiedOf(left),
    ...(isFile(path.join(loc.dir, '.platform')) ? {} : { platform: 'The original has no .platform (Power BI\'s validator calls that a "can break"): the copy gets its own, with its name and a new logical id.' }),
    sayInPlan: 'Start with confidence.lead; show the user every replacement line, its confidence and evidence, and what it loses (lost), before their go: nothing is replaced silently. Where a replacement has a second option, offer it: customVisualsSecond with its key, only the user\'s own choice. The original report is not changed; the native copy is a new report next to it. A replacement marked a guess was matched by its fields\' kinds only.'
  };
  const unknown = second.filter((k) => !replace.some((e) => e.second && e.second.pick === k));
  if (unknown.length) answer.secondUnknown = `customVisualsSecond names ${unknown.length} key(s) no replacement offers a second option for (${unknown.slice(0, 5).map((k) => JSON.stringify(k.slice(0, 20))).join(', ')}): use the keys of the plan's second options.`;
  if (!entries.length) answer.none = 'This report has no custom visual: nothing to replace.';
  if (!free) answer.taken = `"${path.basename(loc.outDir)}" or its .pbip is already there: DataArcus never writes over a file; rename or move it before create_report.`;
  return { loc, entries: replace, answer, ask: replace.flatMap((e) => e.ask || []), writes: replace.length ? [`the report "${safeName(loc.base + SUFFIX)}.Report" and its "${safeName(loc.base + SUFFIX)}.pbip" next to "${safeName(loc.base)}": a copy with ${replace.length} custom visual(s) replaced by native ones (create_report with customVisualsFrom)`] : [] };
}

// (0.3.1 AF2, the release audit's F08, as K2 did for the twin) every file the write writes, built from the report as it
// is now: the approved replacements, the report's other files, .platform with the logical id chosen at plan time, the
// .pbip; with their digest. The plan keeps these files; the write builds them again only to compare, and writes the kept
export function nativeTree(loc, approved, logicalId) {
  const files = strictFiles(loc.dir, { files: 20000, tail: ' Nothing was written.' });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  const byId = new Map(); inv.pages.forEach((p) => p.visuals.forEach((v) => byId.set(v.id, v)));
  const out = new Map(), lost = [];
  approved.forEach((e) => {
    const v = byId.get(e.visual);
    if (!v || !v.file || !v.json) throw new Error('Nothing was written: a visual of the approved plan could not be read again.');
    // (0.3.0 J19) values that may not share one axis: one native chart per group, in new folders beside it
    const page = inv.pages.find((pg) => pg.visuals.some((x) => x.id === v.id)), taken = page ? page.visuals.map((x) => x.id) : [];
    const r = e.panels ? Replace.replacePanels(v.json, e, taken) : Replace.replaceVisual(v.json, e);
    out.set(v.file, json(r.json));
    (r.more || []).forEach((x) => { const f = v.file.replace(/[^/]+\/visual\.json$/, x.name + '/visual.json'); if (files.includes(f) || out.has(f)) throw new Error('Nothing was written: a panel\'s folder is already in the report.'); out.set(f, json(x.json)); });
    lost.push({ line: replacementLine(e), lost: e.lost.concat(r.lost) });
  });
  // the report stops declaring the custom visuals no visual uses any more (no sign-in prompt for them)
  const used = []; inv.pages.forEach((p) => p.visuals.forEach((v) => { const e = approved.find((x) => x.visual === v.id); used.push(e ? e.native : v.type); }));
  let dropped = [];
  if (files.includes('definition/report.json')) { const rj = mustJson(path.join(loc.dir, 'definition', 'report.json'), 'definition/report.json'); const d = Replace.dropUnusedCustomVisuals(rj, used); dropped = d.dropped; out.set('definition/report.json', json(d.json)); }
  if (files.includes('.platform')) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + SUFFIX }); pl.config = Object.assign({}, pl.config, { logicalId }); out.set('.platform', json(pl)); }
  // (0.3.1 SQ2, A1-S4) a report without .platform (the validator's PBIR_PLATFORM_MISSING, a "can break"): the copy gets
  // its own, as the twin's (newPlatform), with the logical id chosen at the plan
  else out.set('.platform', newPlatform(loc.base + SUFFIX, logicalId));
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(loc.outDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { const o = mustJson(loc.pbip, path.basename(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(loc.outDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(loc.outDir) } }); pbip = o; }
  // a private custom visual's own package folder stays in the copy only while a visual still uses it
  const tree = files.filter((rel) => { const m = /^CustomVisuals\/([^/]+)\//.exec(rel); return !(m && dropped.includes(m[1])); })
    .map((rel) => ({ path: path.basename(loc.outDir) + '/' + rel, data: out.has(rel) ? out.get(rel) : readBytes(path.join(loc.dir, ...rel.split('/'))) }));
  // (0.3.0 J19) the panels' new visual folders
  out.forEach((data, rel) => { if (!files.includes(rel)) tree.push({ path: path.basename(loc.outDir) + '/' + rel, data }); });
  tree.push({ path: path.basename(loc.outPbip), data: json(pbip) });
  return { files: tree, digest: digestOf(tree), lost, dropped };
}
/** (AF2) The native copy's exact artifact for its plan: the files, their digest and the logical id chosen now. */
export function nativeArtifact(P) { const logicalId = crypto.randomUUID(), T = nativeTree(P.loc, P.entries, logicalId); return { files: T.files, digest: T.digest, logicalId, copy: 'native' }; }

// plan: the approved plan (its data.customVisuals: the entries the user approved); art: the files its plan kept (AF2)
export function writeNative(reportPath, model, plan, axes, art, opts) {
  const approved = ((plan && plan.data) || {}).customVisuals;
  if (!Array.isArray(approved)) throw new Error('Nothing was written: the approved plan holds no custom-visual replacements. Call plan_layout with customVisualsFrom, show the user the replacements and wait for their go.');
  const P = planNative(reportPath, model, axes, opts), { loc } = P;
  if (keyOf(P.entries) !== keyOf(approved)) throw new Error('Nothing was written: the report\'s custom visuals are not what the approved plan replaces (the report changed since the plan). Make the plan again with plan_layout, show it and wait for the user\'s go.');
  if (!approved.length) throw new Error('Nothing was written: the approved plan replaces no custom visual.');
  if (!nothingAt(loc.outDir) || !nothingAt(loc.outPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(loc.outDir) ? loc.outPbip : loc.outDir)}" is already there. DataArcus never writes over a file: rename or move it, then ask again.`);
  real(loc.outDir); real(loc.outPbip);
  if (!art || !Array.isArray(art.files)) throw new Error('Nothing was written: the files kept for this plan are gone (DataArcus keeps a plan\'s exact files in this session of the server only). Make the plan again with plan_layout, show it to the user and wait for their go.');
  // (AF2) the kept files are the approved ones (their digest), and the copy built again now gives the same files
  const T = nativeTree(loc, approved, art.logicalId);
  if (digestOf(art.files) !== art.digest || T.digest !== art.digest) throw new Error('Nothing was written: the native copy built again now is not the one that was approved (something it is made from changed since the go, such as the .pbip next to the report). Make the plan again with plan_layout, show it to the user and wait for their go.');
  writeTree(loc.project, art.files);
  return { written: true, report: pathOut(loc.outDir), pbip: pathOut(loc.outPbip), replaced: T.lost.length, lost: T.lost, customVisualsNoLongerDeclared: T.dropped.map(safeName), original: 'only read: not changed',
    exact: { digest: art.digest, files: art.files.length, note: 'These are the files the plan built before the go, written byte for byte (the digest is the plan\'s).' },
    nextSteps: `Open "${path.basename(loc.outPbip)}" in Power BI Desktop (the original stays as it was), look at each replaced visual, and check the report with check_report. Tell the user what each replacement lost (lost).` };
}
