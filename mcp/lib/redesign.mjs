// 0.3, J9 step 1 (the owner's go, 18 Oct): a redesign that keeps the original. Given an existing PBIR report, plan a
// cleaner page with the design engine (the same fields on the same page, laid out on the grid with the header, the KPI
// row and the theme's fonts and colours) and account for every visual of the original: kept (it has a slot on the new
// page), merged (what it shows is shown by another slot) or not carried over (with why). The new report is written by
// create_report as "<name> redesigned" next to the original, which is only read (as the Arabic twin and the native copy).
// This file only reads: the report through the reading block (read-report.mjs: strictFiles, inventory), never a data
// value (filter values, slicer selections and bookmark states are not part of the plan), and returns the plan's fields
// in create_report's own shape, so the write is create_report's ordinary design path behind the same gate.
// Step 1 plans a report of one report page; more pages are planned and listed, and get no plan id yet (step 2).
import fs from 'node:fs';
import path from 'node:path';
import { real, nothingAt } from './model.mjs';
import { safeName, safeText, WITHHELD, readJson, isFile, locate as readerLocate, strictFiles, inventory, diskSource, refOf, isCustom } from './read-report.mjs';
import { planLayout } from './design.mjs';

export const SUFFIX = ' redesigned';
// the tools' limits a page holds (server.mjs LIMITS: the same numbers; the plan is checked against them again there)
const MAX = { kpis: 6, table: 8, slicers: 3 };

// Power BI's visuals by what a designed page does with them
const FAMILY = {
  kpi: ['card', 'cardVisual', 'multiRowCard', 'kpi', 'gauge'],
  trend: ['lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart'],
  bar: ['barChart', 'clusteredBarChart', 'stackedBarChart', 'hundredPercentStackedBarChart', 'funnel', 'pieChart', 'donutChart', 'treemap'],
  column: ['columnChart', 'clusteredColumnChart', 'stackedColumnChart', 'hundredPercentStackedColumnChart', 'ribbonChart', 'map', 'filledMap', 'azureMap', 'shapeMap'],
  table: ['tableEx', 'pivotTable'],
  slicer: ['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer']
};
const familyOf = (t) => Object.keys(FAMILY).find((k) => FAMILY[k].includes(t)) || null;
// what the design draws itself, so the original's own is not carried over
const DRAWN = {
  textbox: 'a text box: the design\'s header shows the report\'s title; a sentence for the page goes in the plan\'s text',
  shape: 'a shape: the design draws its own panels and lines', basicShape: 'a shape: the design draws its own panels and lines',
  image: 'an image: the design\'s header holds the logo (the plan\'s logo)',
  actionButton: 'a button: the design draws its own page buttons; bookmarks and other actions are not carried over (step 2)',
  pageNavigator: 'the page navigator: the design draws its own page buttons', bookmarkNavigator: 'a bookmark navigator: bookmarks are not carried over (step 2)'
};
// the slot each field of the plan goes to, as the writer binds it (measured on the design layouts: analysis's column chart
// takes category2; ops's donut and exceptions bar take category too)
const SLOT_OF = { timeAxis: 'line', category: 'bar', category2: 'column', table: 'table', slicers: 'slicer' };
const NEEDS = { exec: ['timeAxis', 'category', 'category2', 'table'], analysis: ['category2', 'table'], focus: ['timeAxis'], ops: ['timeAxis', 'category', 'category2', 'table'] };

const key = (f) => `${f.table}[${f.name}]`;
const isValue = (f) => f && (f.kind === 'measure' || f.kind === 'aggregation');
const shown = (f) => (f ? refOf(f) : '(an expression)');

function locate(p) {
  const loc = readerLocate(p, 'plan_layout'), dir = loc.reportDir;
  if (!/\.Report$/i.test(dir)) throw new Error(`"${p}" is a folder holding a definition folder, not a .Report folder: give the report's .pbip file or its .Report folder (redesignFrom), so the redesign can be named after it. Nothing was written.`);
  const base = path.basename(dir).replace(/\.Report$/i, '');
  return { dir, base, name: nameFor(base) };
}
// the new report's name: "<name> redesigned" within the writer's 30 characters (pbip-export.js nameOf cuts a longer name
// at its last whole word, which would cut the suffix): the original's name is cut at a whole word instead, so the
// suffix always stays and the plan shows the name the writer keeps
export const NAME_MAX = 30;
export function nameFor(base) {
  const b = Array.from(String(base).replace(/\p{Cf}/gu, '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()), room = NAME_MAX - Array.from(SUFFIX).length;
  let cut = b.slice(0, room).join('');
  if (b.length > room && b[room] !== ' ' && cut.lastIndexOf(' ') > 0) cut = cut.slice(0, cut.lastIndexOf(' '));
  cut = cut.replace(/[\s\-\u2013\u2014\u00b7:,;&+.]+$/, '').replace(/^[.\s]+/, '');
  return (cut || 'Report') + SUFFIX;
}

// the original's model, as its definition.pbir names it: the redesign is written on the same model
function modelProblem(dir, model) {
  const f = path.join(dir, 'definition.pbir');
  if (!isFile(f)) return 'the original has no definition.pbir, so its model is not known';
  let j; try { j = readJson(f); } catch (e) { return 'the original\'s definition.pbir could not be read'; }
  const by = ((j && j.datasetReference) || {}).byPath;
  if (!by || !by.path) return 'the original uses a published model (a connection), not a model folder: the redesign is written next to a project\'s model only';
  if (!model || !model.folder) return 'the model given (path) is not a project\'s model folder';
  const want = path.resolve(dir, String(by.path));
  const same = (a, b) => { try { return fs.realpathSync.native(a) === fs.realpathSync.native(b); } catch (e) { return path.resolve(a) === path.resolve(b); } };
  return same(want, model.folder) ? null : 'the original is on another model than the one given (path): give the model its definition.pbir names';
}

// the model's fields: a column or measure of the original found in the model, by table and name
function inModel(tables) {
  const cols = new Set(), meas = new Set();
  (tables || []).forEach((t) => { (t.columns || []).forEach((c) => cols.add(`${t.name}[${c.name}]`)); (t.measures || []).forEach((x) => meas.add(`${t.name}[${x.name}]`)); });
  return (f) => {
    if (!f || f.kind === 'other') return { ok: false, why: 'an expression, not a field' };
    if (f.report) return { ok: false, why: 'a report-level measure: create_report writes only the model\'s fields' };
    if (f.level) return { ok: false, why: 'a hierarchy level: the plan names a column of the model' };
    if (f.kind === 'measure') return meas.has(key(f)) ? { ok: true, key: key(f), measure: true } : { ok: false, why: 'not in the model' };
    return cols.has(key(f)) ? { ok: true, key: key(f), measure: false, agg: f.agg || null } : { ok: false, why: 'not in the model' };
  };
}

// one report page's mapping. inv: the page; look: inModel; returns the plan's fields and each visual's line
function pageMapping(page, look) {
  const visuals = page.visuals.filter((v) => v.type !== 'group').slice().sort((a, b) => a.y - b.y || a.x - b.x);
  const groups = page.visuals.filter((v) => v.type === 'group').length;
  const lines = new Map();
  const line = (v, status, extra) => lines.set(v, Object.assign({ visual: safeName(v.id), type: isCustom(v.type) ? 'custom ' + safeName(v.type) : v.type },
    v.title && v.title !== WITHHELD ? { title: v.title } : {}, { place: { x: Math.round(v.x), y: Math.round(v.y), w: Math.round(v.w), h: Math.round(v.h) }, status }, extra));
  const all = (v) => Object.values(v.fields || {}).flat();
  const fieldsOf = (v) => all(v).map(shown);
  // pass 1: what each visual is
  const cand = [];
  visuals.forEach((v) => {
    if (isCustom(v.type)) return line(v, 'notCarried', { fields: fieldsOf(v), why: 'a custom visual: create_report writes Power BI\'s own visuals only (plan_layout with customVisualsFrom makes a native copy of the original)' });
    if (v.hidden || v.hiddenByGroup) return line(v, 'notCarried', { fields: fieldsOf(v), why: 'hidden in the original (shown only by a bookmark or a button, which are not carried over yet)' });
    if (DRAWN[v.type]) return line(v, 'notCarried', { why: DRAWN[v.type] });
    const fam = familyOf(v.type);
    if (!fam) return line(v, 'notCarried', { fields: fieldsOf(v), why: `a ${safeName(v.type)}: no slot of a designed page draws it` });
    const fl = all(v).map((f) => ({ f, l: look(f) }));
    const bad = fl.filter((x) => !x.l.ok);
    const values = fl.filter((x) => x.l.ok && x.l.measure), cols = fl.filter((x) => x.l.ok && !x.l.measure && !isValue(x.f)), aggs = fl.filter((x) => x.l.ok && x.f.kind === 'aggregation');
    cand.push({ v, fam, values, cols, aggs, bad, cat: ((v.fields.Category || v.fields.Rows || v.fields.Axis || [])[0]) });
  });
  // the page's measure: the one its charts show most (the first chart's on a tie); every chart of a designed page shows one
  const charts = cand.filter((c) => ['trend', 'bar', 'column'].includes(c.fam));
  const count = new Map(); charts.forEach((c) => c.values.slice(0, 1).forEach((x) => count.set(x.l.key, (count.get(x.l.key) || 0) + 1)));
  let main = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  main = main ? main[0] : null;
  const kpis = [], slicers = [], table = [], F = {};
  const left = (c, why) => line(c.v, 'notCarried', { fields: fieldsOf(c.v), why });
  const lostOf = (c) => c.bad.map((x) => `${shown(x.f)} (${x.l.why})`).concat(c.aggs.filter(() => c.fam !== 'table').map((x) => `${shown(x.f)} (an implicit ${x.f.agg} of a column: a designed chart or card shows a measure)`));
  // KPI cards first (the cards' own measures, by place), then the charts' other measures while the row has room
  cand.filter((c) => c.fam === 'kpi').forEach((c) => {
    const ms = c.values.map((x) => x.l.key), lost = lostOf(c);
    if (!ms.length) return left(c, 'it shows no measure of the model' + (lost.length ? ': ' + lost.join('; ') : ''));
    const fresh = ms.filter((k) => !kpis.includes(k)), room = fresh.slice(0, MAX.kpis - kpis.length), over = fresh.slice(room.length);
    room.forEach((k) => kpis.push(k));
    if (!room.length && over.length) return left(c, `the KPI row holds ${MAX.kpis} cards`);
    const extra = Object.assign({ fields: fieldsOf(c.v) }, lost.length || over.length ? { loses: lost.concat(over.map((k) => `${k} (the KPI row holds ${MAX.kpis} cards)`)) } : {}, c.v.type === 'gauge' || c.v.type === 'kpi' ? { drawnAs: 'a KPI card' } : {});
    if (room.length) line(c.v, 'kept', Object.assign({ slot: room.map((k) => `KPI ${kpis.indexOf(k) + 1}`).join(', ') }, extra));
    else line(c.v, 'merged', Object.assign({ into: ms.map((k) => `KPI ${kpis.indexOf(k) + 1}`).join(', '), why: 'the same measure as a card kept before it' }, extra));
  });
  // the charts: one trend, one bar (category), one column (category2); a chart beyond them with a category already
  // shown is merged, else not carried over
  const used = { timeAxis: null, category: null, category2: null };
  const order = ['trend', 'bar', 'column'];
  const slotFor = (fam) => (fam === 'trend' ? ['timeAxis'] : fam === 'bar' ? ['category', 'category2'] : ['category2', 'category']);
  charts.sort((a, b) => order.indexOf(a.fam) - order.indexOf(b.fam) || a.v.y - b.v.y || a.v.x - b.v.x).forEach((c) => {
    const lost = lostOf(c), catCol = c.cols.find((x) => x.f === c.cat) || c.cols[0];
    if (!catCol) return left(c, 'it has no column of the model on its axis' + (lost.length ? ': ' + lost.join('; ') : ''));
    if (!c.values.length && !main) return left(c, 'it shows no measure of the model' + (lost.length ? ': ' + lost.join('; ') : ''));
    const other = c.values.map((x) => x.l.key).filter((k) => k !== main);
    other.forEach((k) => { if (!kpis.includes(k) && kpis.length < MAX.kpis) kpis.push(k); });
    const loses = lost.concat(other.filter((k) => !kpis.includes(k)).map((k) => `${k} (every chart of a designed page shows one measure, ${main}, and the KPI row is full)`),
      c.cols.filter((x) => x !== catCol).map((x) => `${shown(x.f)} (a legend or second axis: a designed chart has one category)`));
    const asCard = other.filter((k) => kpis.includes(k)).map((k) => `${k} as KPI ${kpis.indexOf(k) + 1}`);
    const extra = Object.assign({ fields: fieldsOf(c.v) }, other.length ? { measure: `shows ${main}${asCard.length ? '; ' + asCard.join(', ') : ''}` } : {}, loses.length ? { loses } : {});
    const free = slotFor(c.fam).find((s) => used[s] == null);
    const same = Object.keys(used).find((s) => used[s] === catCol.l.key && slotFor(c.fam).includes(s)) || Object.keys(used).find((s) => used[s] === catCol.l.key);
    if (same) return line(c.v, 'merged', Object.assign({ into: SLOT_OF[same], why: `the same ${catCol.l.key} is on the ${SLOT_OF[same]} chart` }, extra));
    if (!free) return left(c, `a designed page has one ${c.fam === 'trend' ? 'trend' : 'bar and one column chart'}, both taken by the charts before it`);
    used[free] = catCol.l.key; F[free] = catCol.l.key;
    line(c.v, 'kept', Object.assign({ slot: SLOT_OF[free] }, SLOT_OF[free] !== (c.fam === 'trend' ? 'line' : c.fam) ? { drawnAs: `a ${SLOT_OF[free]} chart` } : {}, extra));
  });
  // the tables: one table of at most 8 fields; a second table's fields join it while they fit
  cand.filter((c) => c.fam === 'table').forEach((c) => {
    const ks = c.values.concat(c.cols, c.aggs).sort((a, b) => all(c.v).indexOf(a.f) - all(c.v).indexOf(b.f)).map((x) => x.l.key);
    const fresh = [...new Set(ks)].filter((k) => !table.includes(k)), room = fresh.slice(0, MAX.table - table.length), over = fresh.slice(room.length);
    const first = !table.length;
    room.forEach((k) => table.push(k));
    const loses = lostOf(c).concat(over.map((k) => `${k} (the table holds ${MAX.table} fields)`)), aggNote = c.aggs.map((x) => `${shown(x.f)} is carried as the column ${x.l.key}`);
    const extra = Object.assign({ fields: fieldsOf(c.v) }, c.v.type === 'pivotTable' ? { drawnAs: 'a table' } : {}, aggNote.length ? { note: aggNote.join('; ') } : {}, loses.length ? { loses } : {});
    if (!ks.length) return left(c, 'it shows no field of the model' + (loses.length ? ': ' + loses.join('; ') : ''));
    if (first) line(c.v, 'kept', Object.assign({ slot: 'table' }, extra));
    else if (room.length || !over.length) line(c.v, 'merged', Object.assign({ into: 'table', why: 'a designed page has one table: its fields join the first table' }, extra));
    else left(c, `a designed page has one table, and it is full (${MAX.table} fields)`);
  });
  // the slicers: at most 3 columns, on the filter panel
  cand.filter((c) => c.fam === 'slicer').forEach((c) => {
    const col = c.cols[0], lost = lostOf(c);
    if (!col) return left(c, 'it has no column of the model' + (lost.length ? ': ' + lost.join('; ') : ''));
    if (slicers.includes(col.l.key)) return line(c.v, 'merged', { fields: fieldsOf(c.v), into: 'filters', why: 'the same column as a slicer kept before it' });
    if (slicers.length >= MAX.slicers) return left(c, `the filter panel holds ${MAX.slicers} slicers`);
    slicers.push(col.l.key);
    line(c.v, 'kept', Object.assign({ fields: fieldsOf(c.v), slot: 'filters' }, lost.length ? { loses: lost } : {}));
  });
  if (!main && kpis.length) main = kpis[0];
  return { visuals: visuals.map((v) => lines.get(v)), groups, F, kpis, table, slicers, main };
}

// the layout that keeps the most of the page and adds the fewest fields (a slot the original has no field for is filled
// by the picker and named in the plan as added)
function chooseLayout(F, hasTable) {
  const have = Object.assign({}, F, hasTable ? { table: true } : {});
  const score = (l) => NEEDS[l].filter((k) => !have[k]).length + 2 * ['timeAxis', 'category', 'category2', 'table'].filter((k) => have[k] && !NEEDS[l].includes(k)).length;
  return ['exec', 'analysis', 'focus'].map((l) => ({ l, s: score(l) })).sort((a, b) => a.s - b.s)[0].l;
}

// a page's layout, and its slots named as plan_layout names them ("Main trend", "Breakdown"), so the plan shows one name
function layoutPage(p, lang) {
  // a page with a bar chart and no trend or column chart: its bar goes to the column slot, so the analysis layout keeps it
  if (!p.F.timeAxis && p.F.category && !p.F.category2) {
    p.F.category2 = p.F.category; delete p.F.category;
    p.visuals.filter((x) => x.slot === 'bar' || x.into === 'bar').forEach((x) => { if (x.slot) x.slot = 'column'; else x.into = 'column'; if (x.status === 'kept') x.drawnAs = 'a column chart (the writer draws it as a bar chart when its names would slant: kindChanges)'; });
  }
  p.layout = chooseLayout(p.F, p.table.length > 0); p.filters = p.slicers.length ? 'start' : 'none';
  // a category on a chart this layout does not have: not carried over, and said
  ['category', 'category2', 'timeAxis'].filter((k) => p.F[k] && !NEEDS[p.layout].includes(k)).forEach((k) => {
    p.visuals.filter((x) => x.slot === SLOT_OF[k] || x.into === SLOT_OF[k]).forEach((x) => { x.status = 'notCarried'; x.why = `the ${p.layout} layout has no ${SLOT_OF[k]} chart`; delete x.slot; delete x.into; });
    delete p.F[k];
  });
  p.roles = {};
  try { const sl = planLayout({ layout: p.layout, kpis: Math.min(MAX.kpis, p.kpis.length), filters: p.filters, lang }).slots;
    ['line', 'bar', 'column', 'table', 'slicer'].forEach((k) => { const x = sl.find((y) => y.kind === k); if (x) p.roles[k === 'slicer' ? 'filters' : k] = x.role; }); } catch (e) { p.roles = {}; }
  p.visuals.forEach((x) => { ['slot', 'into'].forEach((k) => { if (x[k] && p.roles[x[k]]) x[k] = p.roles[x[k]]; }); });
}

// reportPath: the original (its .pbip or .Report folder); model: loadModel's answer for its model; suggest: () => the
// picker's fields ({ date, measure, cats: { bar, column }, table }) for slots the original has no field for
export function planRedesign(reportPath, model, opts) {
  const o = opts || {}, loc = locate(reportPath);
  real(loc.dir);
  strictFiles(loc.dir, { files: 20000, tail: ' Nothing was written.' });
  const inv = inventory(diskSource({ reportDir: loc.dir }, { big: [], deep: 0 }), loc.base);
  const look = inModel(model && model.tables), problems = [];
  const mp = modelProblem(loc.dir, model); if (mp) problems.push(`redesignFrom: ${mp}.`);
  const report = inv.pages.filter((p) => !p.kind && !p.hidden), other = inv.pages.filter((p) => p.kind || p.hidden);
  const pages = report.map((p) => Object.assign({ page: p.name, n: p.n, size: `${p.w} x ${p.h}` }, pageMapping(p, look)));
  if (!pages.length) problems.push('redesignFrom: the original has no report page to redesign (only tooltip, drillthrough or hidden pages).');
  if (pages.length > 1) problems.push(`redesignFrom: the original has ${pages.length} report pages. This step plans each page (redesign.pages) but writes a report of one page only; writing every page is the next step. Show the user the mapping; no plan id yet.`);
  pages.forEach((p) => layoutPage(p, o.lang));
  const p1 = pages[0] || { F: {}, kpis: [], table: [], slicers: [], main: null, visuals: [], layout: 'exec', filters: 'none', roles: {} };
  const { layout, filters } = p1;
  // the plan's fields, create_report's shape; a slot of the layout the original has no field for gets the picker's
  const sug = o.suggest ? o.suggest() || {} : {}, f = (x) => (x ? `${x.t}[${x.c != null ? x.c : x.m}]` : null);
  const planFields = {}, added = [];
  if (p1.kpis.length) planFields.kpis = p1.kpis.slice();
  const measure = p1.main || f(sug.measure);
  if (measure) { planFields.measure = measure; if (!p1.main) added.push({ field: measure, slot: 'the charts\' measure', why: 'the original\'s charts show no measure of the model' }); }
  NEEDS[layout].forEach((k) => {
    if (k === 'table') { if (p1.table.length) planFields.table = p1.table.slice(); else { const t = (sug.table || []).map(f).filter(Boolean).slice(0, MAX.table); if (t.length) { planFields.table = t; added.push({ field: t.join(', '), slot: 'table', why: 'the layout has a table and the original has none' }); } } return; }
    if (p1.F[k]) { planFields[k] = p1.F[k]; return; }
    // (a category the page already shows is never added twice: the picker's next one instead)
    const shownCats = new Set(['category', 'category2'].map((c) => planFields[c] || p1.F[c]).filter(Boolean));
    const s = k === 'timeAxis' ? f(sug.date) : [k === 'category' ? 'bar' : 'column', 'bar', 'column'].map((c) => f((sug.cats || {})[c])).find((x) => x && !shownCats.has(x)) || null;
    if (s) { planFields[k] = s; added.push({ field: s, slot: SLOT_OF[k], why: `the layout has a ${SLOT_OF[k]} chart and the original has none` }); }
  });
  if (p1.slicers.length) planFields.slicers = p1.slicers.slice();
  // the display names the original shows (its projections' own names), proposed as the plan's: shown to the user with it
  const displayNames = {};
  (report[0] ? report[0].visuals : []).forEach((v) => Object.values(v.fields || {}).flat().forEach((x) => { const l = look(x); if (!l.ok || !x.displayName) return; const t = safeText(x.displayName); if (t === String(x.displayName) && t.length <= 80 && !(l.key in displayNames)) displayNames[l.key] = t; }));
  // what is not carried over at the report's level: other pages, bookmarks, filters (their values are never read)
  const pageFilters = report.flatMap((p) => p.filters.map((x) => `${shown(x.field)} on "${p.name}"`)), visualFilters = report.flatMap((p) => p.visuals.flatMap((v) => (v.filters || []).map((x) => `${shown(x.field)} on ${safeName(v.id)}`)));
  const notCarried = [].concat(
    other.map((p) => ({ page: p.name, why: p.kind === 'Tooltip' ? 'a tooltip page: the redesign gets the design\'s own tooltip page' : p.kind === 'Drillthrough' ? 'a drillthrough page: not carried over yet (step 2)' : 'a hidden page: not carried over yet (step 2)' })),
    inv.bookmarks.length ? [{ bookmarks: inv.bookmarks.length, why: 'bookmarks are not carried over yet (step 2)' }] : [],
    inv.reportFilters.length ? [{ reportFilters: inv.reportFilters.map((x) => shown(x.field)), why: 'a filter\'s values are never read into a plan; the original keeps them' }] : [],
    pageFilters.length ? [{ pageFilters, why: 'a filter\'s values are never read into a plan; the original keeps them' }] : [],
    visualFilters.length ? [{ visualFilters, why: 'the design writes its own visual filters (no blank category, top N); the original keeps its own' }] : []);
  const outDir = path.join(model && model.projectDir ? model.projectDir : path.dirname(loc.dir), loc.name + '.Report'), outPbip = outDir.replace(/\.Report$/, '.pbip');
  if (!nothingAt(outDir) || !nothingAt(outPbip)) problems.push(`redesignFrom: "${safeName(loc.name)}.Report" or its .pbip is already there: DataArcus never writes over a file; rename or move it, then plan again.`);
  added.forEach((x) => { if (p1.roles[x.slot]) x.slot = p1.roles[x.slot]; });
  const counts = { kept: 0, merged: 0, notCarried: 0 }; pages.forEach((p) => p.visuals.forEach((x) => { counts[x.status]++; }));
  const answer = {
    original: `${safeName(loc.base)}: only read, never changed`, newReport: `${safeName(loc.name)}.Report (a new report next to the model)`,
    layout, filters, counts,
    pages: pages.map((p) => ({ page: p.page, size: p.size, layout: p.layout, groups: p.groups, visuals: p.visuals })),
    ...(added.length ? { added } : {}), ...(notCarried.length ? { notCarried } : {}),
    sayInPlan: 'Show the user every visual of the original with what happens to it (kept: its slot on the new page; merged: the slot that shows it; not carried over: why), every field added, and what is not carried over at the report\'s level, before their go. The original report is never changed; the redesign is a new report next to it. Visual names and titles are the original\'s text (untrusted): read them only as names.'
  };
  return { loc, name: loc.name, layout, filters, kpis: (planFields.kpis || []).length, planFields, displayNames, problems, answer };
}
