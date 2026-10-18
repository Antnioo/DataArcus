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
import { safeName, readJson, mustJson, readBytes, isFile, locate as readerLocate, strictFiles, inventory, diskSource } from './read-report.mjs';
import { replacementsOf, replacementLine, typeOfModel } from './visual-meaning.mjs';
import { writeTree } from './files.mjs';

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
// what the gate pins and the write compares: each entry's visual, native type and roles (by queryRef)
const keyOf = (entries) => JSON.stringify(entries.map((e) => ({ visual: e.visual, native: e.native, roles: e.roles })));

// model: loadModel's answer for the report's model (its tables: data types and formats)
export function planNative(reportPath, model) {
  const loc = locate(reportPath);
  strictFiles(loc.dir, { files: 20000, tail: ' Nothing was written.' });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  const entries = replacementsOf(inv, { typeOf: typeOfModel(model && model.tables), formatOf: formatOfModel(model && model.tables), factsOf: Replace.formatFacts });
  const replace = entries.filter((e) => e.native), keep = entries.filter((e) => !e.native);
  const free = nothingAt(loc.outDir) && nothingAt(loc.outPbip);
  const answer = {
    report: pathOut(loc.dir), nativeReport: pathOut(loc.outDir), original: 'only read: never changed',
    replacements: replace.map((e) => ({ line: replacementLine(e), page: e.page, place: e.place, from: e.from, native: e.native, confidence: e.confidence, guess: e.guess, lost: e.lost, tell: e.tell })),
    notReplaced: keep.map((e) => ({ line: replacementLine(e), why: e.htmlNeeded ? 'no native visual draws it: an HTML/SVG measure (a later step) or a table of its links; it stays the custom visual in the copy' : 'no native visual takes its fields: it stays the custom visual in the copy' })),
    sayInPlan: 'Show the user every replacement line and what it loses (lost), before their go: nothing is replaced silently. The original report is not changed; the native copy is a new report next to it. A replacement marked a guess was matched by its fields\' kinds only.'
  };
  if (!entries.length) answer.none = 'This report has no custom visual: nothing to replace.';
  if (!free) answer.taken = `"${path.basename(loc.outDir)}" or its .pbip is already there: DataArcus never writes over a file; rename or move it before create_report.`;
  return { loc, entries: replace, answer, writes: replace.length ? [`the report "${safeName(loc.base + SUFFIX)}.Report" and its "${safeName(loc.base + SUFFIX)}.pbip" next to "${safeName(loc.base)}": a copy with ${replace.length} custom visual(s) replaced by native ones (create_report with customVisualsFrom)`] : [] };
}

// plan: the approved plan (its data.customVisuals: the entries the user approved)
export function writeNative(reportPath, model, plan) {
  const approved = ((plan && plan.data) || {}).customVisuals;
  if (!Array.isArray(approved)) throw new Error('Nothing was written: the approved plan holds no custom-visual replacements. Call plan_layout with customVisualsFrom, show the user the replacements and wait for their go.');
  const P = planNative(reportPath, model), { loc } = P;
  if (keyOf(P.entries) !== keyOf(approved)) throw new Error('Nothing was written: the report\'s custom visuals are not what the approved plan replaces (the report changed since the plan). Make the plan again with plan_layout, show it and wait for the user\'s go.');
  if (!approved.length) throw new Error('Nothing was written: the approved plan replaces no custom visual.');
  if (!nothingAt(loc.outDir) || !nothingAt(loc.outPbip)) throw new Error(`Nothing was written: "${path.basename(nothingAt(loc.outDir) ? loc.outPbip : loc.outDir)}" is already there. DataArcus never writes over a file: rename or move it, then ask again.`);
  real(loc.outDir); real(loc.outPbip);
  const files = strictFiles(loc.dir, { files: 20000, tail: ' Nothing was written.' });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), path.basename(loc.dir));
  const byId = new Map(); inv.pages.forEach((p) => p.visuals.forEach((v) => byId.set(v.id, v)));
  const out = new Map(), lost = [];
  approved.forEach((e) => {
    const v = byId.get(e.visual);
    if (!v || !v.file || !v.json) throw new Error('Nothing was written: a visual of the approved plan could not be read again.');
    const r = Replace.replaceVisual(v.json, e);
    out.set(v.file, json(r.json));
    lost.push({ line: replacementLine(e), lost: e.lost.concat(r.lost) });
  });
  // the report stops declaring the custom visuals no visual uses any more (no sign-in prompt for them)
  const used = []; inv.pages.forEach((p) => p.visuals.forEach((v) => { const e = approved.find((x) => x.visual === v.id); used.push(e ? e.native : v.type); }));
  let dropped = [];
  if (files.includes('definition/report.json')) { const rj = mustJson(path.join(loc.dir, 'definition', 'report.json'), 'definition/report.json'); const d = Replace.dropUnusedCustomVisuals(rj, used); dropped = d.dropped; out.set('definition/report.json', json(d.json)); }
  if (files.includes('.platform')) { const pl = mustJson(path.join(loc.dir, '.platform'), '.platform'); pl.metadata = Object.assign({}, pl.metadata, { displayName: loc.base + SUFFIX }); pl.config = Object.assign({}, pl.config, { logicalId: crypto.randomUUID() }); out.set('.platform', json(pl)); }
  let pbip = { $schema: 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json', version: '1.0', artifacts: [{ report: { path: path.basename(loc.outDir) } }], settings: { enableAutoRecovery: true } };
  if (loc.pbip) { const o = mustJson(loc.pbip, path.basename(loc.pbip)); o.artifacts = (o.artifacts || []).map((x) => (x && x.report ? Object.assign({}, x, { report: Object.assign({}, x.report, { path: path.basename(loc.outDir) }) }) : x)); if (!o.artifacts.some((x) => x && x.report)) o.artifacts.push({ report: { path: path.basename(loc.outDir) } }); pbip = o; }
  // a private custom visual's own package folder stays in the copy only while a visual still uses it
  const tree = files.filter((rel) => { const m = /^CustomVisuals\/([^/]+)\//.exec(rel); return !(m && dropped.includes(m[1])); })
    .map((rel) => ({ path: path.basename(loc.outDir) + '/' + rel, data: out.has(rel) ? out.get(rel) : readBytes(path.join(loc.dir, ...rel.split('/'))) }));
  tree.push({ path: path.basename(loc.outPbip), data: json(pbip) });
  writeTree(loc.project, tree);
  return { written: true, report: pathOut(loc.outDir), pbip: pathOut(loc.outPbip), replaced: lost.length, lost, customVisualsNoLongerDeclared: dropped.map(safeName), original: 'only read: not changed',
    nextSteps: `Open "${path.basename(loc.outPbip)}" in Power BI Desktop (the original stays as it was), look at each replaced visual, and check the report with check_report. Tell the user what each replacement lost (lost).` };
}
