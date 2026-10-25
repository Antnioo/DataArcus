// check_report's Arabic lens (0.3.1 L1): "Is this report ready for Arabic?" for any PBIR report, whoever built it. Per
// page, what goes wrong when the report is read in Arabic, each finding with its fix in DataArcus's words: a DataArcus
// call and its options (create_arabic_twin, add_gulf_calendar arabicColumnsOnly), a Power BI setting the person changes
// in Desktop, or "Power BI has no setting for this: say so". Read-only and metadata only: the report's texts are read
// to count and to tell their script, never returned; nothing is written; no data value is read.
// One source for each rule: this file only selects and words what exists elsewhere.
//   - each page's language, who built the report and the route of its fixes: check-report.mjs (S1)
//   - a title aligned left and the page navigator: report-rules.js RTL_MIRROR; the Tab order: report-a11y.js
//     A11Y_TAB_ORDER (both run here with every page read right to left)
//   - an Arabic text with a Latin run not isolated: terminology.mjs isolateLatin (the writer's own rule)
//   - what the twin does per kind of visual, and whether a chart's category is time: report-mirror.js (kindOf,
//     KIND_WHAT; mirrorVisual run in memory with time right to left and left to right)
//   - what Power BI's matrix cannot do: arabic-twin.mjs MATRIX_SAID; the Arabic calendar columns: arabic-calendar.js
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadModel, ROOT, visible } from './model.mjs';
import { AIM } from './scope.mjs';
import { safeName, readJson, locate, inventory, diskSource } from './read-report.mjs';
import { rulesInput, pageLanguages, builtByOf, fixRoutesOf } from './check-report.mjs';
import { isolateLatin } from './terminology.mjs';
import { MATRIX_SAID } from './arabic-twin.mjs';
import { NO_DIRECT_EDITS } from './agent-text.mjs';

const require = createRequire(import.meta.url);
const Rules = require('../../assets/js/report-rules.js');
const Mirror = require('../../assets/js/report-mirror.js');
const ArabicCal = require('../../assets/js/arabic-calendar.js');

// ---- reading a visual (literals only; a report's text is counted and told by its script, never returned) ----
const arr = (v) => (Array.isArray(v) ? v : []);
const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const litOf = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const strOf = (p) => { const v = litOf(p); return v == null ? null : String(v).replace(/^'|'$/g, '').replace(/''/g, "'"); };
const plainOf = (list) => arr(list).filter((e) => isObj(e) && !e.selector && isObj(e.properties)).reduce((a, e) => Object.assign(a, e.properties), {});
const lookOf = (list) => { const d = arr(list).filter((e) => isObj(e) && isObj(e.selector) && e.selector.id === 'default' && isObj(e.properties)).reduce((a, e) => Object.assign(a, e.properties), {}); return Object.keys(d).length ? d : plainOf(list); };
const vis = (x) => (isObj(x.json) && isObj(x.json.visual) ? x.json.visual : {});
const objs = (x) => (isObj(vis(x).objects) ? vis(x).objects : {});
const vco = (x) => (isObj(vis(x).visualContainerObjects) ? vis(x).visualContainerObjects : {});
const projections = (x, role) => { const q = vis(x).query, s = isObj(q) && isObj(q.queryState) ? q.queryState : {}; return role ? arr((s[role] || {}).projections) : Object.values(s).flatMap((r) => arr(r && r.projections)); };
const AR = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/, LAT = /[A-Za-z]/;
const arabic = (t) => AR.test(String(t || '')), latinOnly = (t) => LAT.test(String(t || '')) && !arabic(t);
const shownTitle = (x) => { const t = plainOf(vco(x).title); return strOf(t.show) === 'true' && typeof litOf(t.text) === 'string' ? strOf(t.text) : null; };
const buttonText = (x) => (x.type === 'actionButton' ? strOf(lookOf(objs(x).text).text) : null);
const paragraphs = (x) => arr(plainOf(objs(x).general).paragraphs).filter(isObj);
const boxText = (x) => paragraphs(x).map((p) => arr(p.textRuns).map((r) => (isObj(r) ? String(r.value || '') : '')).join('')).join('\n');
const linkOf = (x) => { const l = plainOf(vco(x).visualLink); return strOf(l.type) === 'PageNavigation' ? strOf(l.navigationSection) : null; };
const fieldName = (p) => { const f = isObj(p) && isObj(p.field) ? p.field : {}, c = f.Column || f.Measure || (isObj(f.Aggregation) && isObj(f.Aggregation.Expression) ? f.Aggregation.Expression.Column : null);
  return isObj(c) && isObj(c.Expression) && isObj(c.Expression.SourceRef) ? { table: String(c.Expression.SourceRef.Entity || ''), name: String(c.Property || ''), column: !!f.Column || !!f.Aggregation, measure: !!f.Measure } : null; };
const shownField = (p) => (isObj(p) && typeof p.displayName === 'string' ? p.displayName : (fieldName(p) || {}).name || '');

// ---- the fixes, in DataArcus's words ----
const TWIN = 'create_arabic_twin';
// what a finding's fix is on each kind of page: an English page is made Arabic by the twin; an Arabic page of a report
// DataArcus built by making it again (S1's route); an Arabic page of anyone else's report by a setting in Desktop
function fixer(ctx) {
  return (page, desktopHow, twinHow, extra) => {
    const ar = ctx.isRtl(page);
    if (!ar) return Object.assign({ kind: 'twin', tool: TWIN, options: Object.assign({ path: ctx.reportPath }, extra || {}), how: twinHow });
    if (ctx.route) return Object.assign({ kind: 'twin', tool: ctx.route.tool, options: Object.assign({}, ctx.route.options, extra || {}), how: `${twinHow} DataArcus built this report: make it again (${ctx.routeKey}): ${ctx.route.how}` });
    return { kind: 'desktop', how: desktopHow };
  };
}
const NONE = (how, alt) => Object.assign({ kind: 'none', how: 'Power BI has no setting for this: say so. ' + how }, alt || {});

// rank of each rule for the summary's three (what a reader of Arabic meets first, then what reads wrong)
const WEIGHT = { READING_DIRECTION: 10, TEXT_ENGLISH: 9, TEXT_MIXED: 8, TAB_ORDER: 7, TIME_AXIS: 7, TITLES_LEFT: 6, TEXT_LEFT: 6, BAR_LTR: 6, TABLE_COLUMNS: 6, CALENDAR_VALUES: 6,
  FIELD_NAMES: 5, COLUMN_LTR: 5, PILLS_ORDER: 5, PAGE_BUTTONS: 5, WATERFALL: 4, MATRIX: 3, PAGE_NAVIGATOR: 3, PILLS_ALIGN: 3, SLICER_ITEMS: 2 };
const TOPIC = { READING_DIRECTION: 'reading direction', TAB_ORDER: 'Tab order', TITLES_LEFT: 'titles aligned left', TEXT_MIXED: 'Arabic and Latin mixed without isolation', TEXT_LEFT: 'Arabic text aligned left',
  TEXT_ENGLISH: 'English texts', FIELD_NAMES: 'English field names', BAR_LTR: 'bar charts', COLUMN_LTR: 'column charts', TIME_AXIS: 'time axes left to right', WATERFALL: 'waterfalls', TABLE_COLUMNS: 'table column order',
  MATRIX: 'matrices', CALENDAR_VALUES: 'month and day names in English', SLICER_ITEMS: 'slicer items', PILLS_ORDER: 'pill slicers\' order', PILLS_ALIGN: 'pill values not centred', PAGE_NAVIGATOR: 'the page navigator', PAGE_BUTTONS: 'page buttons\' order' };

// the model's date tables and their English calendar columns (month, day, quarter, Hijri names): "Table.Column" -> the
// name of its Arabic twin as DataArcus writes it ("Month Name (Arabic)" for a plain Month, else "<name> (Arabic)")
function calendarColumns(tables) {
  const out = {};
  arr(tables).filter((t) => t && (t.date || /date|calendar|تقويم|تاريخ/i.test(String(t.name)))).forEach((t) => arr(t.columns).forEach((c) => {
    const n = String(c.name || ''), k = ArabicCal.kindOf(n);
    if (/\(Arabic\)\s*$/i.test(n) || arabic(n)) return;
    if (k && k !== 'flag') out[t.name + '.' + n] = ArabicCal.arabicOf(n);
    else if (/^(month|day|weekday|day of week name|month year)$/i.test(n)) out[t.name + '.' + n] = /^month$/i.test(n) ? 'Month Name (Arabic)' : ArabicCal.arabicOf(n);
  }));
  return out;
}

// p: a report inside the working folder. Returns the lens's answer (never writes)
export function arabicLens(p) {
  const loc = locate(p, 'check_report'), sk = { big: [], deep: 0 };
  const inv = inventory(diskSource(loc, sk), path.basename(loc.reportDir));
  const { R } = rulesInput(inv);
  Rules.normalize(R);
  const relOut = (f) => path.relative(ROOT, f).split(path.sep).map(safeName).join('/');
  const reportPath = relOut(loc.pbipPath || loc.reportDir);
  // each page's language (S1): told by its buttons, the pages that reach it or its own texts; a page none of these tell
  // takes the language most pages have, else English
  const PL = pageLanguages(inv, R, null), told = Object.values(PL.pages), most = told.filter((l) => l === 'ar' || l === 'he').length > told.length / 2 ? 'ar' : 'en';
  R.pages.forEach((pg) => { if (!PL.pages[pg.id]) PL.pages[pg.id] = most; });
  const isRtl = (pg) => PL.pages[pg.id] === 'ar' || PL.pages[pg.id] === 'he';
  const B = builtByOf(loc, PL), routes = fixRoutesOf(B, loc) || {}, routeKey = routes.arabicCopy ? 'arabicCopy' : null;
  const fix = fixer({ isRtl, reportPath, route: routeKey ? routes.arabicCopy : null, routeKey });
  // the model the report names (definition.pbir): its date tables for the calendar columns
  let tables = null, modelPath = null;
  try { const pbir = readJson(path.join(loc.reportDir, 'definition.pbir')), by = pbir && pbir.datasetReference && pbir.datasetReference.byPath && pbir.datasetReference.byPath.path;
    if (by) { const mp = path.resolve(loc.reportDir, String(by)); tables = loadModel(mp).tables; modelPath = relOut(mp); } } catch (e) { tables = null; }
  const CAL = calendarColumns(tables), dateTables = arr(tables).filter((t) => t && t.date).map((t) => t.name);

  // the existing rules, every page read right to left: RTL_MIRROR (titles, the page navigator), A11Y_TAB_ORDER
  const Rrtl = Object.assign({}, R, { dir: 'rtl', lang: 'ar' }); delete Rrtl.pageDir;
  const ruled = Rules.check(Rrtl, { groups: ['rtl', 'a11y'] }).findings.filter((f) => f.rule === 'RTL_MIRROR' || (f.rule === 'A11Y_TAB_ORDER' && !f.visual));

  const findings = [], pageOut = [];
  const add = (pg, rule, what, fx, extra) => findings.push(Object.assign({ rule, page: { id: safeName(pg.id), name: pg.name }, visual: null }, extra || {}, { what, fix: fx }));
  R.pages.forEach((pg) => {
    const ar = isRtl(pg), W = pg.w || 1280, H = pg.h || 720, live = pg.visuals.filter((x) => x.type !== 'group');
    const before = findings.length;
    const mine = (rule, test) => ruled.filter((f) => f.rule === rule && f.page && f.page.id === pg.id && (!test || test(f)));
    // 1. reading direction: the page's heading (its top text box with text, else nothing to judge on an Arabic page)
    const heads = live.filter((x) => x.type === 'textbox' && boxText(x).trim() && x.y < H * 0.25).sort((a, b) => a.y - b.y || a.x - b.x), head = heads[0];
    const headLeft = head && (head.x + head.w / 2 < W / 2 || !/^(right|center)$/i.test(String(paragraphs(head)[0] && paragraphs(head)[0].horizontalTextAlignment || 'left')));
    if (!ar) add(pg, 'READING_DIRECTION', `the page is laid out for reading from the left: ${head ? 'its heading at the left, ' : ''}its ${live.length} visual${live.length === 1 ? '' : 's'} placed and ordered left to right`, fix(pg, '', `The twin mirrors every visual's place (x from the right), right-aligns titles and text boxes and keeps the Tab order, which then reads right to left (${Mirror.KIND_WHAT.textbox}).`));
    else if (headLeft) add(pg, 'READING_DIRECTION', 'a page meant for Arabic laid out for reading from the left: its heading starts at the left', fix(pg, 'Power BI has no setting that mirrors a page: move the heading, the KPI row and the slicers by hand in Power BI Desktop so the page starts at the right (x from the right edge), or make the Arabic pages from the English original with create_arabic_twin, which mirrors every place.', 'The twin mirrors every visual\'s place.'), { visual: { name: safeName(head.name), type: 'textbox' } });
    // 2. tab order (A11Y_TAB_ORDER, right to left)
    mine('A11Y_TAB_ORDER').forEach((f) => add(pg, 'TAB_ORDER', ar ? f.what.replace(/^on a page, /, '') : `${f.what.replace(/^on a page, /, '')}: the page's Tab order is its English reading order`, fix(pg, 'Set the tab order right to left, top to bottom (View > Selection > Tab order).', 'The twin keeps each stop\'s order on the mirrored places, so the stops read right to left.'), { from: 'A11Y_TAB_ORDER' }));
    // 3. texts: a title aligned left (RTL_MIRROR), an Arabic text with a Latin run not isolated, an Arabic text box aligned
    // left, English texts on a page meant for Arabic (or, on an English page, the texts the twin's labels translate)
    const titlesLeft = mine('RTL_MIRROR', (f) => f.visual && f.visual.type !== 'pageNavigator');
    if (titlesLeft.length) add(pg, 'TITLES_LEFT', `${titlesLeft.length} visual title${titlesLeft.length === 1 ? ' is' : 's are'} aligned left (Power BI's default), where an Arabic reader does not start`, fix(pg, 'Align each title right (Format > General > Title > Horizontal alignment: Right); Power BI does not mirror titles by itself.', 'The twin aligns every title right (centred kept).'), { count: titlesLeft.length, from: 'RTL_MIRROR' });
    const texts = [];
    live.forEach((x) => { const t = shownTitle(x), b = buttonText(x), tx = x.type === 'textbox' ? boxText(x) : null; [t, b, tx].forEach((s) => { if (s && s.trim()) texts.push({ x, s }); }); });
    texts.push({ x: null, s: pg.rawName || '' });
    const mixed = texts.filter((t) => isolateLatin(t.s) !== t.s);
    if (mixed.length) add(pg, 'TEXT_MIXED', `${mixed.length} Arabic text${mixed.length === 1 ? ' holds' : 's hold'} a Latin run (a name, a code, a unit) without direction isolation: Power BI draws a title as a left-to-right paragraph, so a run at an end, or one with signs inside it, reads in the wrong place`,
      fix(pg, 'Power BI has no setting that isolates a run: retype the text with the Latin run between U+2068 and U+2069 (a first-strong isolate) and a right-to-left mark U+200F beside a run at the start or end, or reword it so the run sits between Arabic words.', 'The twin writes every mixed Arabic and Latin text with each Latin run isolated (U+2068 ... U+2069).'), { count: mixed.length });
    const leftBoxes = live.filter((x) => x.type === 'textbox' && paragraphs(x).some((pp) => arabic(arr(pp.textRuns).map((r) => (isObj(r) ? r.value : '')).join('')) && !/^(right|center)$/i.test(String(pp.horizontalTextAlignment || 'left'))));
    if (leftBoxes.length) add(pg, 'TEXT_LEFT', `${leftBoxes.length} Arabic text box${leftBoxes.length === 1 ? ' is' : 'es are'} aligned left`, fix(pg, 'Select the text box and align its paragraphs right (the text box\'s toolbar: Align right).', 'The twin right-aligns text boxes (centred kept).'), { count: leftBoxes.length });
    const english = texts.filter((t) => t.s && latinOnly(t.s));
    if (english.length) add(pg, 'TEXT_ENGLISH', ar ? `${english.length} text${english.length === 1 ? ' is' : 's are'} in English only (titles, text boxes, buttons, the page's name) on a page meant for Arabic` : `${english.length} English text${english.length === 1 ? '' : 's'} (titles, text boxes, buttons, the page's name) to be read in Arabic`,
      fix(pg, 'Write each in Arabic in Power BI Desktop (Format > General > Title > Text; the text box; the button\'s text; the page\'s name).', 'The twin writes each text in the Arabic the user approves (its plan lists them, with drafts from a fixed glossary); a text without an approved Arabic stays as it is.'), { count: english.length });
    const fields = new Set(); live.filter((x) => x.type !== 'textbox' && x.type !== 'actionButton').forEach((x) => projections(x).forEach((pp) => { const s = shownField(pp); if (s && latinOnly(s)) fields.add(s); }));
    if (fields.size) add(pg, 'FIELD_NAMES', `${fields.size} field name${fields.size === 1 ? '' : 's'} shown in English (axis titles, table headers, legends, slicer headers)${ar ? ' on a page meant for Arabic' : ''}`, fix(pg, 'Rename the field for each visual (double-click it in the visual\'s field well): Power BI shows that name everywhere the visual shows the field; the model is not renamed.', 'The twin names each field in the Arabic the user approves (the plan\'s field texts), for the visual only; the model is not renamed.'), { count: fields.size });
    // 4. charts and tables
    const ofKind = (k) => live.filter((x) => Mirror.kindOf(x.json) === k);
    const bars = ofKind('bar').filter((x) => strOf(plainOf(objs(x).categoryAxis).switchAxisPosition) !== 'true');
    if (bars.length) add(pg, 'BAR_LTR', `${bars.length} bar chart${bars.length === 1 ? ' has its' : 's have their'} names at the left and bars growing to the right`, fix(pg, 'For each bar chart: the category axis\'s Switch axis position on (names at the right) and the value axis\'s Invert range on (bars grow from the right), the two settings the twin writes.', `The twin mirrors them (${Mirror.KIND_WHAT.bar}).`), { count: bars.length });
    const cols = ofKind('column').filter((x) => strOf(plainOf(objs(x).valueAxis).switchAxisPosition) !== 'true');
    const isTime = (x) => { const m = (o) => JSON.stringify((Mirror.mirrorVisual(x.json, W, Object.assign({ dateTables }, o)).json.visual || {}).query); return m({ timeRightToLeft: true }) !== m({ timeRightToLeft: false }); };
    const timeCols = cols.filter(isTime), otherCols = cols.filter((x) => !timeCols.includes(x));
    if (timeCols.length) add(pg, 'TIME_AXIS', `${timeCols.length} chart${timeCols.length === 1 ? '' : 's'} over time (line, column, area or combo) ${timeCols.length === 1 ? 'runs' : 'run'} left to right: the first period at the left, the value axis at the left`,
      fix(pg, 'Sort each by its time field descending (More options > Sort axis: the time field, then Sort descending) so the first period is at the right, and switch the value axis\'s position on (at the right).', `The twin runs time right to left with timeRightToLeft true (the default; false keeps time left to right, the user's choice): ${Mirror.KIND_WHAT.column}.`, { timeRightToLeft: true }), { count: timeCols.length });
    if (otherCols.length) add(pg, 'COLUMN_LTR', `${otherCols.length} column, line or combo chart${otherCols.length === 1 ? ' reads' : 's read'} left to right: the first category at the left, the value axis at the left`, fix(pg, 'Sort each descending by its category (More options > Sort axis) and switch the value axis\'s position on.', `The twin mirrors them: ${Mirror.KIND_WHAT.column}.`), { count: otherCols.length });
    const wfs = ofKind('waterfall');
    if (wfs.length) add(pg, 'WATERFALL', `${wfs.length} waterfall${wfs.length === 1 ? '' : 's'}: Power BI accumulates a waterfall left to right`, NONE(`Power BI cannot draw its own waterfall right to left. DataArcus can draw a waterfall that reads from the right as a stacked column chart (no Total column and no total label): create_arabic_twin with waterfallRtl "mirror", from the report's English original${ar && !routeKey ? ' (pass its path)' : ''}; "native" keeps Power BI's own waterfall, left to right.`, { tool: TWIN, options: Object.assign(ar && !routeKey ? {} : { path: routeKey ? routes.arabicCopy.options.path : reportPath }, { waterfallRtl: 'mirror' }) }), { count: wfs.length });
    const tablesLtr = ofKind('table').filter((x) => { const ps = projections(x, 'Values'), f0 = fieldName(ps[0]); return ps.length > 1 && f0 && !f0.measure && ps.slice(1).some((pp) => (fieldName(pp) || {}).measure); });
    if (tablesLtr.length) add(pg, 'TABLE_COLUMNS', `${tablesLtr.length} table${tablesLtr.length === 1 ? ' starts' : 's start'} with its name column at the left and its numbers to the right`, fix(pg, 'Drag the columns in the Values well into the reverse order (the first column at the right) and align the text columns right.', `The twin can: ${Mirror.KIND_WHAT.table}.`), { count: tablesLtr.length });
    const matrices = ofKind('matrix');
    if (matrices.length) add(pg, 'MATRIX', `${matrices.length} matri${matrices.length === 1 ? 'x keeps its' : 'ces keep their'} row headers at the left and ${matrices.length === 1 ? 'its' : 'their'} columns running left to right: Power BI's matrix has no right-to-left setting`, NONE(MATRIX_SAID), { count: matrices.length });
    // 5. calendar values: a date table's month, day, quarter or Hijri names in English
    const cal = live.map((x) => ({ x, cs: projections(x).map(fieldName).filter((f) => f && f.column && CAL[f.table + '.' + f.name]) })).filter((v) => v.cs.length);
    if (cal.length) { const names = [...new Set(cal.flatMap((v) => v.cs.map((f) => f.table + '.' + f.name)))];
      add(pg, 'CALENDAR_VALUES', `${cal.length} visual${cal.length === 1 ? ' shows' : 's show'} calendar names from the model in English (${names.slice(0, 4).map((k) => { const i = k.indexOf('.'); return `${visible(k.slice(0, i)).slice(0, 40)}[${visible(k.slice(i + 1)).slice(0, 40)}]`; }).join(', ')}): they are the model's data, no report setting changes them`,
        { kind: 'model', tool: 'add_gulf_calendar', options: Object.assign(modelPath ? { path: modelPath } : {}, { arabicColumnsOnly: true }),
          how: `add_gulf_calendar with arabicColumnsOnly writes a TMDL script that adds the Arabic calendar columns to the model's date table (${[...new Set(names.map((k) => CAL[k]))].slice(0, 4).map((n) => visible(n)).join(', ')}, each sorted like its English column); the user applies it in TMDL view (DataArcus never changes the model). Then show those columns in place of the English ones (in Desktop, or by making the Arabic pages again with create_arabic_twin, whose arabicMonth offers the same script).` }, { count: cal.length }); }
    // 6. slicers: items (no setting), pills (one row of buttons: the order and P7's centred values)
    const slicers = ofKind('slicer'), pill = (x) => x.type === 'advancedSlicerVisual' && String(litOf(plainOf(objs(x).layout).rowCount)) === '1L';
    const items = slicers.filter((x) => !pill(x));
    if (items.length) add(pg, 'SLICER_ITEMS', `${items.length} slicer${items.length === 1 ? '' : 's'} (dropdown or list): ${items.length === 1 ? 'its' : 'their'} items and the dropdown's text keep Power BI's own alignment and direction`, NONE(`Say so: ${Mirror.KIND_WHAT.slicer}.`), { count: items.length });
    const pills = slicers.filter(pill), sortDir = (x) => { const q = vis(x).query, s = isObj(q) && isObj(q.sortDefinition) ? arr(q.sortDefinition.sort)[0] : null; return s && s.direction; };
    const pillsLtr = pills.filter((x) => sortDir(x) !== 'Descending');
    if (pillsLtr.length) add(pg, 'PILLS_ORDER', `${pillsLtr.length} pill slicer${pillsLtr.length === 1 ? ' reads' : 's read'} left to right (the first value at the left)`, fix(pg, 'Sort the slicer descending (More options > Sort: Descending): its buttons follow the sort, so the first value is at the right (Power BI has no direction setting for them).', `The twin can: ${Mirror.KIND_WHAT.pills}.`), { count: pillsLtr.length });
    const offCentre = pills.filter((x) => strOf(lookOf(objs(x).value).horizontalAlignment) !== 'center');
    if (offCentre.length) add(pg, 'PILLS_ALIGN', `${offCentre.length} pill slicer${offCentre.length === 1 ? '\'s values are' : 's\' values are'} not centred in their pills`, routeKey && ar ? fix(pg, '', 'The twin keeps the slicer\'s alignment.') : { kind: 'desktop', how: 'Centre each value in its pill (Format > Values > Horizontal alignment: Center), as DataArcus\'s pills are in both languages; a value aligned to one side reads from the wrong side in the other language.' }, { count: offCentre.length });
    // 7. navigation: the page navigator (RTL_MIRROR), a row of page buttons in page order from the left
    mine('RTL_MIRROR', (f) => f.visual && f.visual.type === 'pageNavigator').forEach((f) => add(pg, 'PAGE_NAVIGATOR', f.what.replace(/ in a right-to-left report/, ''), NONE(`Power BI's page navigator has no order setting: the first page stays at the left (the twin moves it only). ${f.fix}`), { visual: { name: safeName(f.visual.name), type: 'pageNavigator' }, from: 'RTL_MIRROR' }));
    const order = R.pages.map((x) => String(x.id)), btns = live.filter((x) => x.type === 'actionButton' && linkOf(x) && order.includes(linkOf(x)) && !x.parent).sort((a, b) => a.x - b.x);
    const band = btns.filter((x) => btns.some((y) => y !== x && Math.abs(y.y - x.y) < Math.max(4, x.h / 2)));
    if (band.length >= 2) { const idx = band.map((x) => order.indexOf(linkOf(x))), up = idx.every((v, i) => !i || v > idx[i - 1]);
      if (up) add(pg, 'PAGE_BUTTONS', `${band.length} page buttons run in page order from the left`, fix(pg, 'Move the buttons so the first page\'s button is at the right.', 'The twin mirrors their places, so the first page\'s button is at the right.'), { count: band.length }); }
    pageOut.push({ id: safeName(pg.id), name: pg.name, lang: PL.pages[pg.id], tooltip: !!pg.tooltip, findings: findings.length - before });
  });
  findings.forEach((f, i) => { f.id = i + 1; });

  // ---- the summary first: N findings over M pages, the three that matter most, the one call that fixes most ----
  const arPages = pageOut.filter((x) => x.lang === 'ar' || x.lang === 'he').length, enPages = pageOut.length - arPages;
  const byRule = {}; findings.forEach((f) => { (byRule[f.rule] = byRule[f.rule] || []).push(f); });
  const top = Object.keys(byRule).sort((a, b) => (WEIGHT[b] || 0) - (WEIGHT[a] || 0) || byRule[b].length - byRule[a].length).slice(0, 3).map((r) => {
    const fs = byRule[r], f0 = fs[0].fix, n = new Set(fs.map((f) => f.page.id)).size;
    return `${TOPIC[r] || r}: ${n} page${n === 1 ? '' : 's'} (${f0.tool ? f0.tool : f0.kind === 'desktop' ? 'a setting in Power BI Desktop' : 'no Power BI setting: say so'})`;
  });
  const calls = {}; findings.filter((f) => f.fix.tool && f.fix.kind !== 'none').forEach((f) => { const k = f.fix.tool; (calls[k] = calls[k] || []).push(f); });
  // (a call that fixes fewer than a third of the findings is not "the one call that fixes most": the calls are then
  // counted in the sentence beside the settings and the lines Power BI has no setting for)
  const best = Object.keys(calls).sort((a, b) => calls[b].length - calls[a].length).find((k) => calls[k].length * 3 >= findings.length);
  const oneCall = best ? { tool: best, options: Object.assign({}, ...calls[best].map((f) => f.fix.options)), fixes: calls[best].length, of: findings.length,
    how: best === TWIN ? 'One plan through approval: create_arabic_twin with these options (into "same" for one report holding both languages) proposes the Arabic pages; show the plan and its Arabic texts, wait for the user\'s go.' : 'One script through approval: show the plan, wait for the user\'s go.' } : null;
  const noArabic = !arPages;
  const say = [`${findings.length} finding${findings.length === 1 ? '' : 's'} over ${pageOut.length} page${pageOut.length === 1 ? '' : 's'} (${arPages} Arabic, ${enPages} English).`,
    noArabic ? 'No Arabic pages yet: create_arabic_twin makes them (a separate twin, or with into "same" one report holding both languages); the findings say what it changes and what Power BI cannot.' : '',
    top.length ? `Most: ${top.map((t, i) => `${i + 1}) ${t}`).join('; ')}.` : '',
    oneCall ? `One call fixes ${oneCall.fixes} of ${findings.length}: ${oneCall.tool}.` : findings.length ? `No one DataArcus call fixes most of these: ${[...Object.keys(calls).map((k) => `${k} ${calls[k].length}`), `settings in Power BI Desktop ${findings.filter((f) => f.fix.kind === 'desktop').length}`, `lines Power BI has no setting for ${findings.filter((f) => f.fix.kind === 'none').length}`].join(', ')}.` : 'Nothing found that reads wrong in Arabic.'].filter(Boolean).join(' ');
  const answer = {
    lens: 'arabic', question: 'Is this report ready for Arabic?',
    summary: { say, findings: findings.length, pages: pageOut.length, arabicPages: arPages, englishPages: enPages, top, oneCall, noArabicPages: noArabic },
    tellUser: 'Tell the user the summary first (a screenful), then the findings page by page. Each fix is DataArcus\'s call through a plan the user approves, a setting in Power BI Desktop the user changes, or a line Power BI has no setting for: say it plainly.',
    pages: pageOut, findings, builtBy: B.said,
    pageLanguages: { counts: { ar: arPages, en: enPages }, by: PL.by },
    notJudged: ['data values: category names, legend entries and slicer items are the model\'s data (only the calendar names are named, with their Arabic columns)',
      'Power BI\'s own words ("All", "Total", "(Blank)", menus, number and date formats) follow the viewer\'s Power BI language, not the report',
      'custom visuals and pages drawn on a background picture: what is inside them is not read'],
    changes: NO_DIRECT_EDITS,
    readOnly: 'Nothing was changed: check_report only reads the report.'
  };
  // within the answer cap: the findings are cut, the summary keeps every count
  const size = () => JSON.stringify(answer).length;
  while (size() > AIM && answer.findings.length > 1) answer.findings = answer.findings.slice(0, Math.max(1, Math.floor(answer.findings.length * 0.7)));
  if (answer.findings.length < findings.length) Object.assign(answer, { findingsNotListed: findings.length - answer.findings.length });
  return answer;
}
