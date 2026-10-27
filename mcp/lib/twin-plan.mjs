// The Arabic twin, step 6: the plan (what the twin or the copy will be, built in memory, the answer's room).
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { nothingAt, visible } from './model.mjs';
import { safeName, notCopiedOf } from './read-report.mjs';
import { capAnswer, fitLists, out } from './answer.mjs';
import { AIM } from './scope.mjs';
import * as Terms from './terminology.mjs';
import { fieldParametersOf } from './metric-switcher.mjs';
import { DAX_MEASURE } from './dax-functions.mjs';
import { TEXTS_MAX, pathOut, locate, memoryLoc, bytesAt, readOriginal, isObj, byPathOf, pageOf, sizeOf } from './twin-read.mjs';
import { litStr } from './twin-visuals.mjs';
import { placeholderProblem, textsOf, rawLabels, cleanLabel, sameTextLabels, notTranslatedOf, termsOf } from './twin-texts.mjs';
import { modelOf, dateTablesOf, dateColumnsOf, monthOffer, waterfallFacts } from './twin-model.mjs';
import { COPY_TAG, LANG, languageCopy } from './twin-copy.mjs';
import { buildTwin } from './twin-pages.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Mirror = require('../../assets/js/report-mirror.js');
const Gallery = require('../../assets/js/visual-gallery.js');
const { isGlassPng } = require('../../assets/js/design-engine.js');   // (GD1: the glass picture, known by its mark)
import { flipGlassPng } from './glass-picture.mjs';   // (GD2: the Arabic page's picture, the English page's flipped)

// (0.3.1 R1) what the plan, the write and the approval page say of a matrix in the twin
export const MATRIX_SAID = 'Power BI\'s matrix has no right-to-left setting: its row headers stay at the left and its columns (such as months) run left to right. The twin moves it to its mirrored place and reverses the order of its measures only; it fakes nothing. To read it from the right, show the same numbers as a table or a chart, which the twin mirrors; or keep it as it is.';
// (0.3.1 K2, the outside review's point 5: say plainly what stays English or unmirrored) one short line, in English and
// Arabic, of what applies to THIS report, from what the plan already found (cannot) and whether a visual shows a column
// of the model (its own values: category names, slicer items, legends); null when nothing applies
const NOT_FULLY = [
  ['model', 'texts that come from the model (category names, slicer items, legends: the model\'s own values)', 'النصوص التي تأتي من النموذج (أسماء الفئات، عناصر المقسم، وسائل الإيضاح: قيم النموذج نفسها)'],
  ['matrices', 'a matrix\'s months across (they stay left to right: only its measures\' order changes)', 'أشهر المصفوفة عبر الأعمدة (تبقى من اليسار إلى اليمين: يتغير ترتيب مقاييسها فقط)'],
  ['the metric switcher\'s choices', 'the field parameter\'s choices (as the model\'s table names them)', 'خيارات معلمة الحقول (كما يسميها جدول النموذج)'],
  ['the DAX function library\'s pictures and titles', 'the DAX function library\'s pictures and titles', 'صور مكتبة دوال DAX وعناوينها'],
  ['flip cards\' faces', 'the flip cards\' faces', 'وجوه البطاقات القابلة للقلب'],
  ['custom visuals', 'inside custom visuals (moved, not mirrored)', 'ما بداخل المرئيات المخصصة (تُنقل ولا تُعكس)']];
const showsColumn = (o) => (Array.isArray(o) ? o.some(showsColumn) : isObj(o) && (isObj(o.Column) || isObj(o.HierarchyLevel) || Object.values(o).some(showsColumn)));
function notFullyArabicOf(cannot, R) {
  const has = new Set(cannot.map((c) => c.what));
  const model = R.pages.some((pg) => pg.visuals.some((v) => isObj(v.json) && isObj(v.json.visual) && showsColumn(v.json.visual.query)));
  const on = NOT_FULLY.filter(([k]) => (k === 'model' ? model : has.has(k)));
  return on.length ? { en: `Not fully Arabic: ${on.map((x) => x[1]).join('; ')}.`, ar: `ليست عربية بالكامل: ${on.map((x) => x[2]).join('؛ ')}.` } : null;
}
export function twinKey(p) { const { dir } = locate(p); try { return fs.realpathSync.native(dir); } catch (e) { return dir; } }

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
  // (0.3.1 X2) inMemory: { files, base, projectDir }: the English report create_report's plan builds, made one report
  // with its Arabic pages under its own name (into "same"); nothing of it is on disk yet
  const loc = a.inMemory ? memoryLoc(a.inMemory) : locate(a.path), R = readOriginal(loc), textsFrom = Math.max(0, Math.floor(Number(a.textsFrom) || 0));
  // (0.3.0 X1) into "same": one report holding both languages, "<name> (EN-AR)"; the default, the separate twin "<name> AR"
  const same = a.into === 'same' || !!a.inMemory, outBase = a.inMemory ? loc.base : loc.base + (same ? COPY_TAG : ' AR');
  const twinDir = path.join(loc.project, outBase + '.Report'), twinPbip = path.join(loc.project, outBase + '.pbip');
  const free = a.inMemory ? true : nothingAt(twinDir) && nothingAt(twinPbip);
  const texts = textsOf(R), ids = new Set(texts.map((t) => t.id)), model = modelOf(R, loc), dateTables = dateTablesOf(model.m), dateColumns = dateColumnsOf(model.m);
  // (T-1: Power BI has no setting that mirrors a page's background picture, so a page drawn on one stays left to right
  // unless the user asks to mirror it anyway: its visuals would leave the picture's panels)
  // (rc.22, B-137: an image that is DataArcus's own transparent placeholder, byte for byte, is no picture)
  const blankBytes = Buffer.from(Mirror.BLANK_PNG, 'base64');
  // (0.3.1 GD1: glass is the default of a new report) DataArcus's own glass picture (the engine's mark in the PNG) has
  // soft colour fields and no panels, so its page is mirrored as a page without a picture
  const blank = (n) => { const rel = 'StaticResources/RegisteredResources/' + n; if (!R.files.includes(rel)) return false; try { const b = bytesAt(loc, rel); return b.equals(blankBytes) || isGlassPng(b); } catch (e) { return false; } };
  const pictureIds = new Set(R.pages.filter((pg) => Mirror.pageHasPicture(pg.page, { blank })).map((pg) => pg.id)), mirrorPictures = a.mirrorPicturePages === true;
  const keepLtr = (pg) => pictureIds.has(pg.id) && !mirrorPictures;
  const given = a.labels || {}, labels = {}, unknown = [];
  Object.keys(given).forEach((k) => { if (ids.has(k)) labels[k] = cleanLabel(given[k], k); else unknown.push(visible(k).slice(0, 160)); });
  // (0.3.1 X2) the Arabic of a text by the text itself, as the plan shows it (a report built again draws new ids): every
  // text of those words takes it, unless a label was given for its id
  const byText = isObj(a.textLabels) ? a.textLabels : {}, textsUsed = new Set();
  // (0.3.1 R4A, the laptop's rc.1 run: the approved Arabic of "Reset filters" was not used, the button's text starts with
  // two spaces) matched trimmed: the exact words first, else the same words without spaces at either end; such a text
  // says so in the plan (spaces)
  const trimOf = (x) => String(x).trim(), byTrim = new Map(Object.keys(byText).map((k) => [trimOf(k), k]));
  const keyOf = (t) => (Object.prototype.hasOwnProperty.call(byText, t.text) ? t.text : byTrim.has(trimOf(t.text)) ? byTrim.get(trimOf(t.text)) : null);
  // (the spaces kept around the Arabic, as the draft keeps them: they make room for the button's icon)
  const padOf = (t, ar) => { const m = /^(\s*)[\s\S]*?(\s*)$/.exec(String(t.text)); return String(ar).trim() ? m[1] + String(ar).trim() + m[2] : ar; };
  texts.forEach((t) => { if (t.text != null && labels[t.id] == null) { const k = keyOf(t); if (k != null) { const v = cleanLabel(byText[k], t.id); labels[t.id] = k === t.text || v == null ? v : padOf(t, v); textsUsed.add(k); } } });
  texts.forEach((t) => { if (t.text != null && String(t.text) !== trimOf(t.text)) t.spaces = 'its text in the report starts or ends with spaces: its Arabic is matched without them and written with the same spaces (say it in the plan)'; });
  // (SQ4) the labels this call gave that a text takes (by id or by its words): labels.given; the texts that take another's
  // Arabic (a page button, an alt text under its title, a term) are counted in labels.arabic with them
  const givenIds = new Set(Object.keys(labels));
  const textsUnknown = Object.keys(byText).filter((k) => !textsUsed.has(k) && !texts.some((t) => t.text != null && trimOf(t.text) === trimOf(k))).map((k) => visible(k).slice(0, 160));
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
  // (0.3.1 R1: a real user's Arabic matrix read left to right, its first column at the left) said plainly, nothing faked
  if (where.matrix.length) cannot.push({ what: 'matrices', why: MATRIX_SAID, where: where.matrix.slice(0, 30) });
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
  // (0.3.1 L6) the DAX function library's pictures and titles are measures of the model (its DAX functions script, made
  // for the English report): the twin shows them as those measures draw them
  const daxShown = R.pages.flatMap((pg) => pg.visuals.filter((v) => { const hit = []; const seek = (o) => { if (!isObj(o) && !Array.isArray(o)) return; if (isObj(o) && isObj(o.Measure) && typeof o.Measure.Property === 'string' && DAX_MEASURE.test(o.Measure.Property)) hit.push(1); Object.values(o).forEach(seek); };
    seek(isObj(v.json) ? v.json.visual : null); return hit.length; }).map((v) => safeName(pg.id) + '/' + safeName(v.json.name)));
  if (daxShown.length) cannot.push({ what: 'the DAX function library\'s pictures and titles', why: 'the KPI card pictures, the table\'s trend and target columns and the story titles are drawn by measures of the model (the DAX functions script made for the English report, in English): the twin shows them as those measures draw them; for Arabic ones, make the report in Arabic with create_report and daxFunctions', where: daxShown.slice(0, 30) });
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
  if (monthShown.scriptAfterGo) monthShown.scriptAfterGo = safeName(monthShown.scriptAfterGo);
  const ref = byPathOf(R.pbir);
  // (rc.24) the twin built in memory with the labels: its title measures and what its Arabic texts need
  const built = buildTwin({ R, model: model.m, keepLtr, dateTables, dateColumns, timeRightToLeft: a.timeRightToLeft, waterfallRtl: a.waterfallRtl, same }, rawLabels(texts, labels));
  // (0.3.1 GD2, the owner, 27 Oct: "i want the twin to be identical") a mirrored page drawn on DataArcus's glass picture
  // gets that picture flipped left to right, pixel by pixel (built.pictures: its file -> the flipped bytes); the twin
  // writes it under the same name, the copy holding both languages as a picture of the Arabic page's own
  built.pictures = new Map();
  R.pages.filter((pg) => !keepLtr(pg)).forEach((pg) => Mirror.pageImages(pg.page).forEach((n) => {
    const rel = 'StaticResources/RegisteredResources/' + n;
    if (n == null || built.pictures.has(rel) || !R.files.includes(rel)) return;
    let b = null; try { b = flipGlassPng(new Uint8Array(bytesAt(loc, rel))); } catch (e) { b = null; }
    if (b) built.pictures.set(rel, Buffer.from(b));
  }));
  // (X1) the copy, built in memory from the twin's pages: the plan shows it, the write writes exactly it
  // (0.3.1 K2) the .platform logical id, chosen once here (the write builds again with the plan's: the approved bytes hold it)
  const logicalId = typeof a.logicalId === 'string' && a.logicalId ? a.logicalId : crypto.randomUUID();
  const copy = same ? languageCopy({ R, loc, tabsShown: a.tabsShown, keepLtr, name: a.inMemory ? loc.base : null, logicalId }, built, rawLabels(texts, labels)) : null;
  // (AF1, the release audit's F11: the twin's names come from the report folder's name, untrusted input like any name:
  // screened in the answer, as pathOut screens every folder; the write builds them from P.outBase, the real name)
  const twinShown = { report: safeName(path.basename(twinDir)), pbip: safeName(path.basename(twinPbip)) };
  const languages = copy ? { copy: { report: twinShown.report, pbip: twinShown.pbip, folder: pathOut(loc.project) || '.' },
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
  const FK = ['buttons', 'buttonsCut', 'headers', 'headersCut', 'textboxes', 'textboxesCut'];
  const F = built.fitted, fitted = FK.some((k) => F[k].length) ? { fitted: Object.assign({}, ...FK.filter((k) => F[k].length).map((k) => ({ [k]: F[k].slice(0, 60) })), { sayInPlan: 'The Arabic texts are longer than the English: the twin widens each button to its text (the visuals beside it in its row move with it), each table column to its Arabic header, within the page and the table, and each text box to its Arabic lines (wider into the free room beside it, then taller into the free room under it; nothing beside it moves). Say each one in the plan, and every buttonsCut, headersCut and textboxesCut: their Arabic text needs a shorter version, or Power BI cuts it (a headersCut with cut "may be cut": Power BI may cut it, to be looked at in Desktop).' }) } : {};
  const notFullyArabic = notFullyArabicOf(cannot, R);
  // (SQ4, Q1-S7: a two-page report listed 42 alt texts that repeat a title, and took 2-3 calls to list) an alt text with
  // its visual's title's words, neither with an Arabic yet, is listed under that title (altTextToo), not alone: it takes
  // the title's Arabic (sameTextLabels). Once one of them has its Arabic, it is listed as before (the plan shows it)
  const titleAt = new Map(texts.filter((t) => t.kind === 'title' && !t.phone && t.text != null).map((t) => [t.rawId.slice('title:'.length), t])), altUnder = new Map();
  texts.forEach((t) => { const m = t.kind === 'altText' && !t.phone && t.text != null ? /^text:(.+)\/c\.general\.\d+\.altText$/.exec(t.rawId) : null, ti = m ? titleAt.get(m[1]) : null;
    if (ti && !altUnder.has(ti.id) && ti.raw.trim() === t.raw.trim() && labels[t.id] == null && labels[ti.id] == null) altUnder.set(ti.id, t.id); });
  const under = new Set(altUnder.values()), listed = texts.filter((t) => !under.has(t.id)).map((t) => (altUnder.has(t.id) ? Object.assign({}, t, { altTextToo: altUnder.get(t.id) }) : t));
  // (0.3, B-154) the model's fingerprint, pinned by the plan (null: no model read)
  return { loc, R, logicalId, labels, texts, textsUnknown, notTranslated, month, dateTables, dateColumns, pictureIds, keepLtr, built, copy, same, outBase, modelPrint: model.m ? model.m.print : null, model: model.m, terms: T.given, termRows, answer: capAnswer(twinFit({
    written: false,
    original: { report: pathOut(loc.dir), pbip: loc.pbip ? pathOut(loc.pbip) : null, readOnly: 'only read: never changed' },
    twin: { report: twinShown.report, pbip: twinShown.pbip, folder: pathOut(loc.project) || '.', model: ref && ref.path ? pathOut(path.resolve(loc.dir, String(ref.path))) : 'the same model as the original (definition.pbir copied as it is)', nameFree: free },
    pages, mirrors, cannot, ...(notFullyArabic ? { notFullyArabic } : {}), phone, ...(keptTogether.length ? { keptTogether } : {}), ...(checkInTwin.length ? { checkInTwin } : {}), ...fitted,
    ...(built.titleMeasures ? { titleMeasures: Object.assign({}, built.titleMeasures, { notTranslated: built.titleMeasures.notTranslated.slice(0, 30), written: built.titleMeasures.written.slice(0, 30), how: 'A chart title given by a measure of the report: each of its texts is listed above (kind titleMeasure). The twin writes its own measures "Title AR: ..." with the approved Arabic texts, in its own reportExtensions.json, and its charts use them; the original report and the model are not changed.' }) } : {}),
    ...(pictureIds.size ? { picturePages: [...pictureIds].map((x) => ({ page: safeName(x), what: mirrorPictures ? 'mirrored as asked; its picture is not' : 'kept left to right (its background picture can\'t be mirrored); mirrorPicturePages true mirrors it anyway' })) } : {}),
    keptForNavigation: same ? 'The English pages keep their page ids, visual names and bookmarks; the Arabic pages get their own (new ids), and their page, tooltip and bookmark links go to the Arabic pages.' : 'Page ids, visual names, bookmark names, page and bookmark links are kept: navigation and bookmarks work in the twin without rewiring.',
    timeRightToLeft: a.timeRightToLeft !== false ? 'yes: charts over time run right to left like the rest of the page (the user can choose false: time stays left to right)' : 'no: charts over time keep left to right (the user\'s choice)',
    // (D7) the waterfalls: Power BI's own, left to right ("native", the default), or the look-alike read from the right
    waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl) === 'native' ? `native: ${Gallery.WF_WHAT.native} (the user can choose "mirror": a stacked column chart read from the right, with no Total column and no legend)` : 'mirror: each waterfall is a stacked column chart drawn as a waterfall, read from the right; no Total column, no legend (the user can choose "native": Power BI\'s own waterfall, left to right)',
    // (0.3.0 Q1) from textsFrom on: the server cuts the list to fit one answer and says where the rest starts (moreTexts)
    texts: listed.slice(textsFrom, textsFrom + TEXTS_MAX).map(({ rawId, raw, fieldKey, ...t }) => t), ...(listed.length > textsFrom + TEXTS_MAX ? { textsNotListed: listed.length - textsFrom - TEXTS_MAX } : {}),
    ...(textsFrom ? { textsFrom: Math.min(textsFrom, listed.length) } : {}),
    labels: Object.assign({ given: [...givenIds].filter((k) => labels[k] != null).length, arabic: Object.keys(labels).length, unknown, withoutLabel: texts.filter((t) => labels[t.id] == null).length }, problems.length ? { problems } : {}),
    notTranslated: notTranslated.slice(0, TEXTS_MAX).map(({ ids, ...r }) => r), ...(notTranslated.length > TEXTS_MAX ? { notTranslatedNotListed: notTranslated.length - TEXTS_MAX } : {}),
    ...(built.notShown.length ? { notShown: built.notShown.slice(0, 60) } : {}),
    ...(languages ? { languages } : {}),
    terminology: Object.assign({ sheet: termRows }, Terms.askNextOf(termRows), { how: Terms.HOW_TWIN }, T.unknown.length ? { unknownTerms: T.unknown } : {}, T.notUsing.length ? { labelsNotUsingTerm: T.notUsing.slice(0, 60) } : {}),
    sayInPlan: 'Before the go, show the user notTranslated: every text that stays English in the twin, with why (each text the user approved no Arabic for, such as a field name kept as the model names it). A text with labelFrom takes the approved Arabic of the same text (a page button its page\'s name, an alt text or a phone copy the visual\'s title): show those too. altTextToo: the visual\'s alt text says the title\'s words and takes the title\'s Arabic (one label for both; a label for its id gives it its own). notShown: the original\'s title measures the twin\'s charts no longer use (kept in its file, shown nowhere).',
    arabicMonth: month.offered ? Object.assign(monthShown, { howToApplyAfterGo: howToApply }) : monthShown,
    ...notCopiedOf(R.left),
    ...(R.unreadable.length ? { unreadable: { count: R.unreadable.length, note: 'files that are not JSON: copied as they are, not mirrored' } } : {}),
    sayFirst: 'Nothing was written. Show the user this plan: the twin\'s name and place, the pages, what mirrors, what cannot, and the Arabic texts. draftArabic comes from a fixed glossary; for every other text draft the Arabic yourself in modern, simple Standard Arabic (Western digits, product names in Latin letters, short and natural, not a word-for-word translation) and show each one to the user as a DRAFT. Never translate silently and never write a text the user has not approved: a text without an approved label stays as it is. Call this tool again with the approved texts as labels ({ id: text }) to get a plan id for exactly those, show it, and after the user\'s go call approve_plan, then this tool with planId.'
  }, textsFrom), (x) => JSON.stringify(x).length, { last: ['texts'] }) };   // (A3: the texts cut last)
}
