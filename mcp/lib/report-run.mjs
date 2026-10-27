// One report's build, for create_report and plan_layout alike (reportRun: the plan builds and checks exactly what the
// write writes): one engine, kept whole.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { loadModel, visible, inside, modelOf, nothingAt, refuseUnreadable } from './model.mjs';
import { planLayout, absorb, imageSize, isSmall, projectPages, designRtl, buildTheme, texts, themeName, themeScaleOf, scaleTheme, isGlass, glassPng } from './design.mjs';
import { scopeOf } from './scope.mjs';
import { writtenName } from './display-names.mjs';
import { resolveSwitch, switchReach, addSwitch, switchSaid, SWITCH_MIN, SWITCH_MAX } from './metric-switcher.mjs';
import { takenNames } from './report-names.mjs';
import { checkSummary, checkFiles } from './plan-lint.mjs';
import { modelPrintOf } from './artifact.mjs';
import { applyFlip, flipHow } from './flip-cards.mjs';
import { resolveIcons, applyIcons, iconsSaid, iconsHow } from './status-icons.mjs';
import { daxOption, resolveDax, applyDax, daxSaid, daxHow } from './dax-functions.mjs';
import * as Plans from './plans.mjs';
import * as Terms from './terminology.mjs';
import { monthOffer as calendarOffer } from './arabic-twin.mjs';
import { withPlan, readUserFile, writeTree } from './files.mjs';
import { modelRef, sameModelBeforeWrite } from './plan-keys.mjs';
import { formatsAnswer, formatsScriptOf } from './fix-scripts.mjs';
import { hiddenOf } from './hidden-names.mjs';
import { relsOf, resolveFields, resolvePageFilters, SVG_STATUS, resolveSvgColumns, boundOf, slicersOf, axesProblems, axesOf } from './report-fields.mjs';
import { unknownKeys, THEME_MAX, LOGO_MAX, BACKGROUND_MAX, reportPin } from './report-inputs.mjs';
import { flipAnswer, topSaid, CARD_RULE, modelNotes, phoneAnswer, calendarSaid, tableSmallerSaid, rowLabelSaid, rowLabelSkippedSaid, extRenamedSaid, uniqueFields } from './report-said.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');
const Pbip = require('../../assets/js/pbip-export.js');
const Mirror = require('../../assets/js/report-mirror.js');
const Gallery = require('../../assets/js/visual-gallery.js');
const Svg = require('../../assets/js/svg-kpi-compiler.js');
const Fix = require('../../assets/js/model-health-tmdl.js');

export const BLANK_PNG_BYTES = Buffer.from(Mirror.BLANK_PNG, 'base64');   // (0.3.0 T1, T-6: the blank page background, known by its bytes)

// A theme's own colours (DataArcus theme generator and Power BI themes): text, visual and page background, accent,
// so the title, buttons and filter pane match the theme instead of the defaults
const themeColors = (t) => {
  const page = t && t.visualStyles && t.visualStyles.page && t.visualStyles.page['*'] && t.visualStyles.page['*'].background;
  const out = { text: t && t.foreground, card: t && t.background, accent: t && t.tableAccent, background: page && page[0] && page[0].color && page[0].color.solid && page[0].color.solid.color };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)));
};
const themeOf = (p) => readUserFile(p, { kind: 'theme', max: THEME_MAX, json: true });
// (SQ15b, 0.2.9-reader-S8: plan-lint's binding was a hand copy of this one) the page and the binding of a plan's fields,
// create_report's and plan-lint's one rule. fieldsDesign: fields.kpis decides the number of cards (the design block's
// A2-4: 0-6), and the plan's table fields the table's share of a narrow row (SQ13, 0.2.9-design-S2).
export function fieldsDesign(design, F) {
  return { design: F && F.kpis ? Object.assign({}, design, { layout: Object.assign({}, design.layout, { kpis: Math.min(6, F.kpis.length) }) }) : design,
    tableFields: F && F.table ? F.table.length : undefined };
}
// planBinding: the binding for n KPI cards, the picker's, with every field the plan names pinned (builder 7's audit A3-2:
// the picker's rules are its own, so the website's download gets them too); the plan's measure, where it names one,
// decides what is related (round 22b, the reviewer's second review, item 4). o: { m, pickFrom, lang, F, design?, full
// (kpiValues "full"), more (create_report's page filters' options) }; with design, its fieldsDesign too.
export function planBinding(o) {
  const { m, pickFrom, lang, F } = o;
  const pinned = F ? Object.fromEntries([['kpis', F.kpis], ['main', F.measure], ['date', F.timeAxis], ['catA', F.category], ['catB', F.category2], ['slicers', F.slicers], ['table', F.table]].filter(([, v]) => v)) : null;
  const pickOpts = () => Object.assign(relsOf(m, lang), F && F.measure ? { main: F.measure } : {}, o.full ? { kpiValues: 'full' } : {}, pinned ? { pinned } : {}, o.more || {});
  return Object.assign(o.design ? fieldsDesign(o.design, F) : {}, { pinned, pickOpts, bindFor: (n) => Bind.suggest(pickFrom, n, pickOpts()) });
}
// create_report's one build (J14): plan_layout runs it with the plan's inputs (mode 'build': no gate; it returns the
// files and finish, which writes them and makes the answer), create_report without an approved artifact (mode 'write':
// its refusals as before, then "make the plan again" where it would write)
export function reportRun(a, mode) {
  const building = mode === 'build';
  // rc.22, B-134 (the owner's rc.21 test: a missing input was told before the plan's approval): a plan that can't be used
  // yet (not approved, refused, expired, unknown) is said first, with the input problem when there is one too
  const notReady = building ? null : Plans.approvalProblem('create_report', a.planId);
  const input = (ok, msg) => { if (!ok) throw new Error(notReady ? `${notReady} Also: ${msg}` : msg); };
  input(!a.pages !== !a.design, 'Give create_report pages or a design, not both and not neither: pages with hand-placed slots, or the design from generate_theme or plan_layout.');
  input(!!a.name, 'Give create_report a name for the new report (Report name).');
  const m = refuseUnreadable(loadModel(a.path));   // (AU47) nothing is planned on part of a model
  input(!!m.folder, 'create_report needs a project folder with a .SemanticModel (save the .pbix as a Power BI project first).');
  // the gate (0.2.9, P-1): nothing is written without an approved plan for this model, whatever the AI app asks before a tool
  // (the gate: below, once the inputs themselves are checked: a refused input is told as itself, and nothing is written either way)
  // (the cross-review's G5, then audit 6's A6-1: the fields and every other pinned input are the approved plan's: the gate above)
  // the part of the model the report is about: on a large model a focus (or tables) is needed, as in suggest_fields
  const sc = scopeOf(m, { focus: a.focus, tables: a.tables });
  input(!sc.needsFocus, sc.needsFocus ? `Nothing was written. ${sc.why} ${sc.how} Areas in this model: ${sc.areas.map((x) => x.area).join(', ') || 'none (no measure display folders)'}.` : '');
  const pickFrom = sc.tables;
  // KPI cards: never more than the measures a card can show (no card is ever written without a field)
  // the approved plan's fields (a.fields): each name checked against the model, then bound as given
  let F; try { F = resolveFields(m.tables, a.fields); } catch (e) { input(false, String(e && e.message || e)); }
  // (design round 8, the re-score's S6: the plan shows readable display names as its default, and pins them; a call
  // writes the plan's, which the user approved with it, under the names it gives itself, which the gate then checks)
  { const pn = a.planId != null ? Plans.pinned(a.planId, 'create_report', 'displayNames') : undefined;
    if (pn) a = Object.assign({}, a, { displayNames: Object.assign({}, pn, a.displayNames || {}) }); }
  // the gate (0.2.9, P-1; audit 6, A6-1): nothing is written without an approved plan for this model, whose pinned inputs
  // (design, page, language, fields, filters, names, texts, SVG designs) are these
  if (!building) Plans.gate('create_report', a.planId, modelRef(m, a.path), reportPin(a, a.fields));
  // Round 12 (#26): a measure that shows text ("Yes", a date) is never a KPI card, even when the plan names it: left out, and told
  const textKpis = F && F.kpis ? F.kpis.filter((k) => k.text) : [];
  if (textKpis.length) F.kpis = F.kpis.filter((k) => !k.text);
  // the page filters: each column checked against the model, each value typed by its column
  const PF = resolvePageFilters(m.tables, a.pageFilters);
  // a filter that keeps the true rows of a Ramadan flag keeps every Ramadan (measured in Desktop, D14): without a
  // filter on a Hijri-year column the answer says so and names that column; the year itself comes from the user
  if (PF) {
    const isHijriYear = (c) => /hijri/i.test(c) && /year/i.test(c);
    // (0.3.1 SQ10, J17-S2) the plan's own Hijri-year column first (a.hijriYear: declared by the calendar or confirmed by
    // the person in gulfDates, from plan_layout's date questions), else one found by its name
    const known = a.hijriYear && m.tables.find((x) => x.name === a.hijriYear.t && x.columns.some((c) => c.name === a.hijriYear.c));
    PF.filter((f) => /ramadan/i.test(f.c) && f.values.length && f.values.every((v) => v === true)).forEach((f) => {
      if (PF.some((g) => isHijriYear(g.c) || (known && g.t === known.name && g.c === a.hijriYear.c))) return;
      const own = m.tables.find((t) => t.name === f.t), t = known || [own].concat(m.tables).filter(Boolean).find((x) => x.columns.some((c) => isHijriYear(c.name))), c = t && (known ? t.columns.find((x) => x.name === a.hijriYear.c) : t.columns.find((x) => isHijriYear(x.name)));
      f.note = `${f.key} is true keeps every Ramadan of the calendar, not one. For one Ramadan ("this Ramadan") add a second page filter on the Hijri year${c ? ` (${t.name}[${c.name}])` : ' (no Hijri year column was found by name in this model: ask the user which column holds it)'}, with the year the user gives: ask the user which Hijri year, because the tools never return data values.`;
    });
  }
  // SVG columns: each design checked against the model and compiled (nothing is written when one can't be used)
  // (a right-to-left report mirrors a design, unless the design says mirror: false; a text keeps its direction)
  // (round 23: a hand-placed Arabic page is right to left unless rtl: false is given; before, only with rtl: true)
  const rtlHand = a.rtl == null ? a.lang === 'ar' : !!a.rtl;
  const rtlReport = a.pages ? rtlHand : a.dir ? a.dir === 'rtl' : a.lang === 'ar', svgLabels = new Set();
  // The colours an SVG design takes from the report's theme (round 13; seen in Desktop 2.158, 6 Oct: a design without
  // colours was drawn in the compiler's own, a near-black ring and cyan on a white Corporate card): the design's own
  // colours as the report will have them, or the theme file's and the colours given with hand-placed pages.
  const svgPalette = (() => {
    if (!(a.svgColumns || []).length && !(a.svgCards || []).length) return null;
    if (a.design) { const d = planLayout({ design: a.design, layout: a.layout, kpis: a.kpis, filters: a.filters, header: a.header, page: a.page, dir: a.dir, lang: a.lang }).design; return Svg.themePalette(d.ui, d.data); }
    const t = a.theme ? themeOf(a.theme) : {};
    return Svg.themePalette(Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd', good: t.good, bad: t.bad, neutral: t.neutral }, themeColors(t), a.colors || {}), t.dataColors);
  })();
  const SV = resolveSvgColumns(m.tables, a.svgColumns, { mirror: rtlReport, what: 'svgColumns', taken: svgLabels, palette: svgPalette });
  const ringNumbers = [];
  const SC = resolveSvgColumns(m.tables, a.svgCards, { mirror: rtlReport, what: 'svgCards', taken: svgLabels, palette: svgPalette, ringNumbers });
  const svgCardsFor = (n) => { if (!SC) return undefined;
    SC.forEach((c, i) => { if (c.card > n) throw new Error(`Nothing was written. svgCards[${i}]: the report has ${n} KPI card${n === 1 ? '' : 's'}, so there is no card ${c.card}.`); });
    return SC.map((c) => ({ card: c.card - 1, t: c.t, m: c.label, expression: c.expression, w: c.w, h: c.h })); };
  // the page (by its place in the report) whose first table takes each SVG column: the one asked for, or the first with a table
  const svgFor = (pages, b) => {
    if (!SV) return undefined;
    const hasTable = pages.map((p) => p.slots.some((s) => s.kind === 'table' || s.kind === 'matrix') && (b.table || []).filter(Boolean).length > 0), first = hasTable.indexOf(true);
    if (first < 0) throw new Error('Nothing was written. svgColumns need a table, and this report has no table on any page: use a layout with a table (plan_layout shows the slots), or hand-placed pages with a table slot.');
    return SV.map((c, i) => { if (c.page != null && !hasTable[c.page - 1]) throw new Error(`Nothing was written. svgColumns[${i}]: page ${c.page} has no table (pages with a table: ${hasTable.map((h, k) => (h ? k + 1 : 0)).filter(Boolean).join(', ')}).`);
      return (c.at = Object.assign({ page: c.page != null ? c.page - 1 : first, t: c.t, m: c.label, expression: c.expression, w: c.w, h: c.h }, c.expressionNoNumber ? { expressionNoNumber: c.expressionNoNumber } : {})); });
  };
  // Round 10: the cards show automatic units with 2 decimals by default (kpiValues "auto"), so a card's own format is
  // written only with kpiValues "full" (and then on the tooltip's card too). A table's measure column gets the same
  // format on its projection in both modes (measured in Desktop: "format" on the projection, 13857 -> 13,857).
  // (A3-3: the formats themselves are the picker's, by the one rule: cardFormat with kpiValues "full", tableFormat on a
  // table's fields; here they are only listed for the answer)
  // (round 13, seen in Desktop on 6 Oct: a card said 33.8% and the table's column of the same measure 0.34: a measure's
  // table column carries the percent format its card shows: the picker's tableFormat)
  const FULL = a.kpiValues === 'full', cardFormats = [], tableFormats = [];
  // (SQ10, audit-3-picker-writer-S2: each measure once by its table and name, never by its "T[c]" text)
  const listed = new Set(), listFormats = (b) => {
    const list = (to, f, code) => { const id = f && JSON.stringify([to === cardFormats, String(f.t), String(f.m)]); if (f && f.m != null && code && !listed.has(id)) { listed.add(id); to.push({ field: keyOf(f), format: code }); } };
    (b.kpis || []).forEach((f) => list(cardFormats, f, f && f.cardFormat)); (b.table || []).forEach((f) => list(tableFormats, f, f && f.tableFormat));
    return b;
  };
  const usable = F && F.kpis ? F.kpis.map((k) => k.m) : Bind.suggest(pickFrom, 8, relsOf(m, a.lang)).kpis.filter(Boolean).map((k) => k.m);
  // Round 12 (#25): a model without measures gets its numbers from its columns, counted or summed by the visuals
  // (Bind.counts), so the report has cards, charts and a table instead of a page four fifths empty
  // (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) «عدد X» only for an Arabic column; an English
  // one is "Count of X" in an Arabic report too (the mixed «عدد Order Id» made mixed titles)
  const AR_COL = /[\u0600-\u06FF]/, arName = (word, en) => (c) => (AR_COL.test(c) ? word + ' ' + c : en + ' ' + c);
  const COUNTS = usable.length ? [] : Bind.counts(pickFrom, a.lang === 'ar' ? { count: arName('عدد', 'Count of'), sum: arName('مجموع', 'Sum of') } : null, { lang: a.lang });
  const nValues = usable.length || COUNTS.length;
  // (round 16, design finding #14: "Count of Region" made a weak KPI): the cards take counts of ID-like columns and sums
  // only; a count of a category column still feeds a chart or the table, never a card: fewer cards, and told
  const KPI_COUNTS = COUNTS.filter((c) => !c.category), nCards = usable.length || KPI_COUNTS.length;
  // The binding for n KPI cards: the picker's, with every given field in its place (builder 7's audit A3-2, 11 Oct: the
  // picker's rules, the fixed slicers, the flag's day axis, the Arabic calendar names and the short day names, are the
  // picker's own, so the website's download gets them too; the server passes options)
  // (SQ15b, 0.2.9-reader-S8: planBinding below, the one function plan-lint calls too)
  const PB = planBinding({ m, pickFrom, lang: a.lang, F, full: FULL,
    more: PF ? { excludeColumns: PF.map((f) => ({ t: f.t, c: f.c })), axisFor: PF.map((f) => ({ t: f.t, c: f.c, values: f.values })) } : null });
  // what the picker did for the page filters and the Arabic report, for the notes
  const noted = (b) => { (b.excluded || []).forEach((x) => slicersDropped.push(`${x.t}[${x.c}]`)); if (b.axisBy) byFlagDay.push(b.axisBy); (b.calendarNames || []).forEach((x) => englishNames.add(`${x.t}[${x.c}]`));
    // (kept as before A3-2, an open item: with fields or page filters the binding had no category pool, so the charts
    // of a page take the plan's categories only)
    if (F || PF) delete b.catPool;
    return b; };
  // a model without measures: the same binding, its numbers the columns the visuals count or sum (through build, so the
  // table's and the tooltip's rules are the picker's)
  const countBind = (n) => { const b = PB.bindFor(n), C = COUNTS, ch = b.choices;
    const nb = Bind.build(Object.assign({}, ch, { kpis: Array.from({ length: n }, (_, i) => KPI_COUNTS[i] || null), main: C[0], table: [ch.catB || ch.catA, C[0], C[1]].filter((x, i, l) => x && l.indexOf(x) === i) }));
    delete b.notReached; return noted(Object.assign({}, b, nb)); };
  const bindFor = (n) => (COUNTS.length ? countBind(n) : noted(PB.bindFor(n)));
  const cardNote = (asked, built, leftOut) => (COUNTS.length ? Object.assign({ asked, built, counted: KPI_COUNTS.slice(0, built).map((f) => f.name),
    why: `The model has no measures, so the KPI cards, the charts and the table show counts and sums of its columns, made by the visuals themselves (${COUNTS.slice(0, 4).map((f) => f.name).join(', ')}); the model is not changed.${built < asked && COUNTS.some((c) => c.category) ? ` Fewer cards than asked: a count of a category column (${COUNTS.filter((c) => c.category).slice(0, 3).map((f) => f.name).join(', ')}) is not a KPI, so it is shown in a chart or the table, never on a card.` : ''} For real KPIs, propose measures with their format strings to the user; when they are in the model (added in Power BI Desktop), create the report again.` }, leftOut ? { leftOut } : {})
    : built >= asked ? null : Object.assign({ asked, built, measures: usable.slice(0, built),
    why: usable.length ? `The model has ${usable.length} measure${usable.length === 1 ? '' : 's'} a KPI card can show${sc.scope ? ' in this part of the model' : ''}, so ${built} of ${asked} KPI cards were built. Add measures to the model (in Power BI Desktop) for more cards, then create the report again.`
      : 'The model has no measures, so no KPI card was built, and the charts were left out too (they have no value to show; see leftOutVisuals). The report has its header, filters and table only. Propose measures with their format strings to the user; when they are in the model (added in Power BI Desktop), create the report again.' }, leftOut ? { leftOut } : {}));
  let kpiCards = null;
  const slicersDropped = [], byFlagDay = [];
  const modelNames = Object.fromEntries(m.tables.map((t) => [t.name, (t.columns || []).map((c) => c.name).concat((t.measures || []).map((x) => x.name))]));
  // (D1: a right-to-left waterfall's running total follows its category's order: the model's sort-by columns and types)
  const modelColumns = Object.fromEntries(m.tables.map((t) => [t.name, Object.fromEntries((t.columns || []).map((c) => [c.name, Object.assign({ type: c.dataType || null }, c.sortBy ? { sortBy: String(c.sortBy) } : {})]))]));   // (round 23: for the report measures' free names)   // (round 23: line charts whose slot went to the visual beside them)
  // Round 12 (#20; seen in Desktop 2.158, golden task 3: "What it means" shipped its placeholder sentence): a text
  // slot holds the plan's sentence (a.text, or a hand-placed slot's own text), or is left out. In a design the visual
  // beside it (the same row, else the same column) takes its room; hand-placed positions are the caller's.
  const textLeftOut = [];
  const withText = (slots, own) => {
    const ts = slots.filter((x) => x.kind === 'text'); if (!ts.length) return slots;
    let out = slots.filter((x) => x.kind !== 'text' || x.text || a.text).map((x) => (x.kind === 'text' && !x.text ? Object.assign({}, x, { text: a.text }) : x));
    ts.filter((t) => !t.text && !a.text).forEach((t) => {
      textLeftOut.push(t.title || 'Text');
      if (own) return;
      out = absorb(out, t);   // (round 23 part 6, the re-review's 7: one rule for the room, the design engine's since 0.2.9 A2-3)
    });
    return out;
  };
  // a model with no measures at all: the visuals that need one (charts, gauges, cards) are left out too, and named:
  // no visual is ever written without its fields
  const NEEDS_MEASURE = ['kpi', 'card', 'line', 'bar', 'column', 'donut', 'gauge', 'funnel', 'treemap', 'map'], leftOutVisuals = [];
  const withValues = (slots) => (nValues ? slots : slots.filter((s) => { if (!NEEDS_MEASURE.includes(s.kind)) return true; if (s.kind !== 'kpi') leftOutVisuals.push(s.title || s.kind); return false; }));
  // a report is written next to its model; when the working folder is the model folder, that is outside it
  if (!m.projectDir) throw new Error(`Nothing was written: the working folder is the model folder itself (${path.basename(m.folder)}). A report is written next to its model, which would be outside the working folder. Choose the project folder (the folder that holds ${path.basename(m.folder)}) as the working folder, then ask again.`);
  // no background image given: a fully transparent pixel, so the page colour from the theme shows
  const png1 = BLANK_PNG_BYTES;   // (the one copy: report-mirror.js; the twin knows it by its bytes)
  // (0.3.1 GL1) a design with the glass look gets the engine's soft picture instead, at each page's size (glassPng)
  const kpisOf = (pages) => pages.reduce((n, p) => Math.max(n, p.slots.filter((s) => s.kind === 'kpi').length), 0) || 1;
  // display names: checked first, then put on the bound fields (the report writer shows a field's name when it has one)
  const given = new Map();
  for (const [k, v] of Object.entries(a.displayNames || {})) {
    const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/), name = writtenName(v, `displayNames: ${visible(String(k)).slice(0, 160)}`);
    if (!mk) throw new Error(`displayNames: "${k}" is not written as Table[Field]`);
    if (!name || name.length > 80) throw new Error(`displayNames: the display name for ${k} is empty or longer than 80 characters`);
    given.set(Bind.fieldKey(mk[1], mk[2]), { name, key: String(k), used: false });
  }
  const fieldsOf = (b) => (b ? [b.date, b.measure, ...(b.kpis || []), ...Object.values(b.cats || {}), ...Object.values(b.y || {}), ...(b.table || []), ...(b.slicers || []), ...Object.values(b.tip || {})].filter(Boolean) : []);
  const keyOf = (f) => `${f.t}[${f.c != null ? f.c : f.m}]`;
  // the display names given, as copies of the bound fields (A3-2: never set on the picker's fields in place); a calendar
  // name the picker swapped for its Arabic column keeps the name given for the English one
  const englishNames = new Set();
  const named = (b) => { const from = new Map(((b && b.calendarSwaps) || []).map((w) => [Bind.fieldKey(w.to.t, w.to.c), Bind.fieldKey(w.from.t, w.from.c)]));
    return Bind.mapFields(b, (f) => { const k = Bind.fieldKey(f.t, f.c != null ? f.c : f.m), g = given.get(k) || given.get(from.get(k)); if (!g) return f; g.used = true; return Object.assign({}, f, { name: g.name }); }); };
  // the logo, as the website takes it: a PNG or JPG, 2 MB at most; its size is read so its box can take its shape
  const reportNotes = [];
  // Power BI's own words can't be set by a report (measured: no slicer property holds "All")
  if (a.lang === 'ar') reportNotes.push('Power BI\'s own words in the report ("All" in a slicer, "Select all", "Search") follow each viewer\'s Power BI language, not the report: nothing in the report files can change them.');
  let logo = null, logoRatio;
  if (a.logo) {
    const file = inside(a.logo), ext = /\.png$/i.test(file) ? 'png' : /\.jpe?g$/i.test(file) ? 'jpg' : null;
    if (!ext) throw new Error(`The logo must be a PNG or JPG file: ${a.logo}`);
    // (audit 6, A6-7: the one reader: a regular file, never a link, 2 MB at most, measured before it is read)
    const bytes = new Uint8Array(readUserFile(a.logo, { kind: 'logo', max: LOGO_MAX })), size = imageSize(bytes);
    if (!size) throw new Error(`The logo must be a PNG or JPG file: ${a.logo} could not be read as one`);
    logo = { bytes, ext }; logoRatio = size.w / size.h;
    if (size.h > size.w) reportNotes.push('This logo is tall; a horizontal version will read much better in the header.');
  }
  // (0.3.0 D2) the visual gallery: on when the user asked (gallery, or a slot of a gallery kind); small multiples take the
  // bar chart's category for their panels when the plan names no other (the writer's rules decide whether it fits)
  const galleryOn = (pages) => !!a.gallery || pages.some((p) => (p.slots || []).some((s) => Gallery.isKind(s.kind)));
  // (and the measures' units from the model's formats, for the combo's one-unit rule)
  // (0.3.0 J19) and the model's measures with the person's answers on shared axes (sharedAxes), as the confirmation
  // memory's records, for the one rule of axis-units.js
  const withSplit = (b, pages) => { if (!b || !galleryOn(pages)) return b; const u = Object.assign(Gallery.withUnits(b, m.tables), { axes: axesOf(m, a.sharedAxes) });
    return !(u.cats || {}).split && (u.cats || {}).bar ? Object.assign({}, u, { cats: Object.assign({}, u.cats, { split: u.cats.bar }) }) : u; };
  // what the plan and the answer say of each gallery slot: its kind, what is written (the kind, two panels, or the slot's
  // own kind) and why, by the writer's own rule on the bound fields
  const galleryOf = (pages, b) => { const out = [];
    pages.forEach((p) => (p.slots || []).filter((s) => Gallery.isKind(s.kind)).forEach((s) => { const f = Gallery.fits(s.kind, b);
      out.push(Object.assign({ page: p.name, kind: Gallery.toTool(s.kind) }, s.role ? { role: s.role } : {}, s.title ? { title: s.title } : {}, s.plain ? { insteadOf: s.plain } : {},
        { written: f.fits ? Gallery.toTool(s.kind) : f.split ? 'two panels (two line charts)' : s.plain || Gallery.KINDS[s.kind].fallback, why: f.why }, f.whyAr ? { whyAr: f.whyAr } : {}, f.ask && f.ask.length ? { ask: f.ask } : {})); }));
    // (a design: each kind asked for that no page took, with why: its fields don't suit, or no page had its chart left)
    if (a.design && a.gallery) Gallery.askedKinds(a.gallery).filter((k) => !out.some((g) => g.kind === Gallery.toTool(k))).forEach((k) => { const f = Gallery.fits(k, b);
      out.push({ page: null, kind: Gallery.toTool(k), written: 'not placed', why: f.fits ? 'every page\'s chart it can take was given to another gallery visual (one a page)' : f.why + (f.split ? ' (on a designed page a combo is placed only where its units match)' : '') }); });
    return out; };
  let r, bind, extra = {}, written, boundPages = null, look = null;   // (look: the colours, font and direction the cards are written with, L4)
  let tinyPage = false, smallPageNote = null, designRepaired = null, switchAt = null;
  const subKeys = {};   // round 22: a subtitle key given in the other language -> the slot's role in the report's language
  const unknown = a.design ? unknownKeys(a.design) : null;
  if (a.design) {
    // the website's project download for this design: its pages (second page, slide-in panel), labels and theme
    const planned = planLayout({ design: a.design, layout: a.layout, kpis: a.kpis, filters: a.filters, header: a.header, page: a.page, dir: a.dir, lang: a.lang, colors: a.colors, theme: a.theme });
    let design = planned.design;
    // (the audit's A2-2: the note comes from the plan's own smallPage, the design engine's rule)
    if (planned.smallPage) smallPageNote = planned.smallPage;
    if (planned.repaired) designRepaired = planned.repaired;   // (A2-4/A2-7: a design value the engine could not use is said)
    const themeChanged = [];
    if (design.layout.transparent) {
      themeChanged.push({ setting: 'layout.transparent', from: true, to: false,
        why: 'Transparent visuals are meant to sit on panels drawn in a background image. This report has no background image, so its theme has solid visuals instead: each KPI card, chart and table shows on its own panel (the card colour, rounded corners, a shadow when the design has one).' });
      design = Object.assign({}, design, { layout: Object.assign({}, design.layout, { transparent: false }) });
    }
    // fields.kpis decides the number of cards (one per measure given)
    // (the owner, 6 Oct 2026: on a 4:3 page the table takes the wider share of its row: the design engine's default,
    // by the table's fields, tableFields below; the design block's A2-5)
    // (the design block's A2-4: kpis is the card count, 0-6; the report's measures cap every page through maxKpis)
    // (the table's share of a narrow row is by its fields: tableFields)
    const FD = fieldsDesign(design, F), tableFields = FD.tableFields;
    design = FD.design;
    const askedCards = design.layout.kpis, maxKpis = Math.min(F && F.kpis ? F.kpis.length : 6, nCards);
    kpiCards = cardNote(askedCards, Math.min(askedCards, nCards));
    // (round 22, the owner's (a) for pages under 800 wide; golden task 5's second page in Desktop: cut card values and a
    // scrolling table) such a page gets no second page
    tinyPage = isSmall(design.layout);
    // (the laptop's sweep of rc.1, D16: a model with no time axis gets the layout made for it, the design engine's noTime;
    // the binding is made first, on the pages' KPI count, which noTime doesn't change)
    const bound = bindFor(kpisOf(projectPages(design.layout, a.lang, { second: a.secondPage && !tinyPage, panel: a.slidePanel, logoRatio, maxKpis, tableFields }))), noTime = !bound.date;
    let pages = projectPages(design.layout, a.lang, { second: a.secondPage && !tinyPage, panel: a.slidePanel, logoRatio, maxKpis, tableFields, noTime }).map((p) => Object.assign({}, p, { slots: withText(withValues(p.slots)) }));
    // (0.3.0 D2; the reviewer's decision of 19 Oct) the gallery kinds the user asked for, on every designed page: at most
    // one a page, only where the bound fields suit it, a kind not used on an earlier page first (the tooltip pages, which
    // the writer makes, keep their plain kinds)
    const B0 = withSplit(listFormats(named(bound)), pages);
    if (a.gallery) { const used = new Set(); pages = pages.map((p) => { const sl = Gallery.assign(p.slots, a.gallery, { B: B0, avoid: used }); sl.forEach((x) => { if (Gallery.isKind(x.kind)) used.add(x.kind); }); return Object.assign({}, p, { slots: sl }); }); }
    // (round 22, the code review's c) a slot's role is matched in English or Arabic whatever the report's language:
    // the same pages in the other language give each role's other name
    if (a.subtitles) { const o1 = { second: a.secondPage && !tinyPage, panel: a.slidePanel, logoRatio, maxKpis, tableFields, noTime }, mine = projectPages(design.layout, a.lang, o1), other = projectPages(design.layout, a.lang === 'ar' ? 'en' : 'ar', o1);
      other.forEach((p, i) => p.slots.forEach((s, j) => { const q = mine[i] && mine[i].slots[j]; if (q && q.kind === s.kind && s.title && q.title && !(q.title in a.subtitles)) subKeys[s.title] = q.title; })); }
    const subtitles = a.subtitles && Object.fromEntries(Object.entries(a.subtitles).map(([k, v]) => [subKeys[k] || k, v]));
    look = { ui: design.ui, font: design.font, rtl: designRtl(design.layout, a.lang) };
    r = Pbip.build({
      name: a.name, title: a.title || a.name, pageName: pages[0].name, lang: a.lang, rtl: designRtl(design.layout, a.lang), font: design.font, sample: false, logo,
      theme: (written = buildTheme(design, a.lang)), ui: design.ui, model: { byPath: path.basename(m.folder), taken: takenNames(m.projectDir), names: modelNames, columns: modelColumns }, bind: (bind = B0), gallery: galleryOn(pages), pageFilters: PF, svgColumns: svgFor(pages, bind), svgCards: svgCardsFor(kpisOf(pages)), kpiValues: a.kpiValues, noDataMessage: a.noDataMessage, smoothLines: a.smoothLines, slicerStyle: a.slicerStyle, grid: a.grid, phoneLayout: design.layout.phoneLayout !== false, subtitles, chartColors: a.chartColors || 'gradient', chartAxes: a.chartAxes || 'mirrored', waterfallRtl: a.waterfallRtl, logoPlaceholder: false, quietGrid: true,
      texts: texts(a.lang), pages: pages.map((p) => ({ name: p.name, page: p.page, slots: p.slots, png: isGlass(design) ? glassPng(design, p.page.w, p.page.h) : png1, panel: p.panel, grow: true }))
    });
    boundPages = pages; switchAt = { rtl: designRtl(design.layout, a.lang), page: pages[0].page };
    // (D16) the line charts the layout leaves out on a model without a time axis are named, with the reason, as before
    if (noTime) projectPages(design.layout, a.lang, { second: a.secondPage && !tinyPage, panel: a.slidePanel, logoRatio, maxKpis, tableFields })
      .forEach((p) => p.slots.filter((x) => x.kind === 'line').forEach((x) => (r.leftOut = r.leftOut || []).push({ page: p.name, kind: 'line', title: x.title || null, noTime: true })));
    extra = { pages: pages.map((p) => ({ name: p.name, width: p.page.w, height: p.page.h, slots: p.slots.length, slideInPanel: !!p.panel })), theme: themeName(design.name),
      // (0.3.1 GD1) the cards' look written: glass by default, plain where glass can't keep the text readable, or as asked
      look: Object.assign({ look: planned.look.look, chosenBy: planned.look.chosenBy }, planned.look.glassFailed ? { glassFailed: planned.look.glassFailed } : {}),
      ...(themeChanged.length ? { themeChanged } : {}) };
  } else {
    // hand-placed pages: KPI slots beyond the measures are left out, and named
    const leftOut = [];
    a.pages = a.pages.map((p) => { let k = 0; return Object.assign({}, p, { slots: p.slots.filter((s) => { if (s.kind !== 'kpi') return true; k++; if (k <= nCards) return true; leftOut.push(s.title || `KPI ${k}`); return false; }) }); });
    a.pages = a.pages.map((p) => Object.assign({}, p, { slots: withText(withValues(p.slots.map((s) => (s.kind === 'smallMultiples' ? Object.assign({}, s, { kind: 'multiples' }) : s))), true) }));
    if (COUNTS.length && !leftOut.length) kpiCards = cardNote(kpisOf(a.pages), kpisOf(a.pages));
    if (leftOut.length) { const asked = kpisOf(a.pages) === 1 && !usable.length ? leftOut.length : Math.max(...a.pages.map((p) => p.slots.filter((s) => s.kind === 'kpi').length)) + leftOut.length; kpiCards = cardNote(asked, asked - leftOut.length, leftOut); }
    let theme = a.theme ? themeOf(a.theme) : { name: a.name };   // (let: the design block's A2 scales it to the page below)
    // Round 23 (the owner's "nothing critical left"): a theme's text sizes are made for its page (generate_theme's
    // layout.page, 1920 x 1080 by default: 10pt x the page's height / 720, as plan_layout's pages are), and a smaller
    // hand-placed page drew them too large. Our theme says its scale through its table text (10 x scale); every text
    // size in it follows the pages' height, within Power BI's 8-60. Pages of different heights, or a theme without that
    // mark, keep the theme as it is, told.
    if (a.theme) {
      const t10 = +((((((theme.visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0] || {}).fontSize), hs = [...new Set(a.pages.map((p) => +p.height || 1080))];
      // (round 23 part 5, the reviewer's code review, item 6: a theme the user made, with a 12pt table, was scaled as
      // ours. Ours is known by its sizes: every size generate_theme writes is its base x one page scale (design-engine's
      // textSizes: the table and slicer 10, the card 28, the multi-row card's title 12 and values 18); any other theme is
      // never rescaled, only noted)
      // (part 6, the re-review's 4: the scale is not read back from the rounded table size, which missed generate_theme's
      // own themes for pages like 768 high: every page height generate_theme can make is tried with the engine's own
      // rounding, and the theme is ours when one gives all its sizes; no mark is written into the theme, as Desktop may
      // refuse a theme with a key it does not know)
      // (the tools audit's A6-10: the engine finds the theme's page and scales it; nothing of its sizes is copied here)
      const sc = themeScaleOf(theme), themeH = sc ? sc.h : null;
      const ours = !!themeH;
      const ratio = ours && hs.length === 1 ? hs[0] / themeH : null;
      if (ratio && Math.abs(ratio - 1) > 0.01) {
        theme = scaleTheme(theme, ratio);
        reportNotes.push(`The theme's text sizes were made for a page about ${themeH} high; they were scaled to these ${hs[0]}-high pages (x ${ratio.toFixed(2)}, within 8-60), as a planned page's theme is. The theme file itself was not changed.`);
      } else if (t10 > 0 && !ours) reportNotes.push(`The theme's text sizes were not scaled to the pages: it is not a theme generate_theme made, so its sizes are kept as its author set them. If they look too large or too small on these ${hs.join(' and ')}-high pages, change the theme, or make one with generate_theme (layout.page).`);
      else if (!ratio && t10 > 0 && hs.length > 1) reportNotes.push(`The theme's text sizes are made for a page ${Math.round(720 * t10 / 10)} high and were not scaled: the pages have different heights (${hs.join(', ')}). Use one page size, or a theme made for it (generate_theme's layout.page).`);
    }
    written = theme;
    look = { ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}), font: a.font, rtl: rtlHand };
    r = Pbip.build({
      name: a.name, title: a.title || a.name, lang: a.lang, rtl: rtlHand, font: a.font, sample: false, logo, theme,
      ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}),
      model: { byPath: path.basename(m.folder), taken: takenNames(m.projectDir), names: modelNames, columns: modelColumns }, bind: (bind = withSplit(listFormats(named(bindFor(kpisOf(a.pages)))), a.pages)), gallery: galleryOn(a.pages), pageFilters: PF, svgColumns: svgFor(a.pages, bind), svgCards: svgCardsFor(kpisOf(a.pages)), kpiValues: a.kpiValues, noDataMessage: a.noDataMessage, smoothLines: a.smoothLines, slicerStyle: a.slicerStyle, grid: a.grid, subtitles: a.subtitles, chartColors: a.chartColors || 'solid', chartAxes: a.chartAxes || 'mirrored', waterfallRtl: a.waterfallRtl, logoPlaceholder: false, quietGrid: true,
      // (round 12, #13 and #14: a hand-placed Arabic report gets the Arabic texts too: "شعارك", the tooltip pages' names)
      texts: texts(a.lang),
      pages: a.pages.map((p) => ({ name: p.name, page: { w: p.width, h: p.height }, slots: p.slots, panel: null, hand: true, png: p.background ? readUserFile(p.background, { kind: 'background image', max: BACKGROUND_MAX }) : png1 }))
    });
    switchAt = { rtl: rtlHand, page: { w: a.pages[0].width, h: a.pages[0].height } };
  }
  if (!boundPages) boundPages = a.pages;
  // (L3) the metric switcher: its page and its TMDL script join the built files (one write, one digest); the labels are
  // the display names the plan shows for the measures (the user's, or the plan's Arabic or readable ones)
  let SW = null;
  if (a.metricSwitcher) {
    const rs = resolveSwitch(m.tables, a.metricSwitcher);
    input(!rs.problems.length, `Nothing was written. ${rs.problems.join(' ')}`);
    // (SQ15b, L3-S2) only the measures the charts' axes are related to (the model's relationships, metadata only)
    const rr = switchReach(rs.measures, bind, relsOf(m));
    input(rr.measures.length >= SWITCH_MIN, `Nothing was written. metricSwitcher takes ${SWITCH_MIN} to ${SWITCH_MAX} measures the Metric page's charts can show; ${rr.measures.length} of the ${rs.measures.length} named ${rr.measures.length === 1 ? 'is' : 'are'} related to their axes: ${rr.leftOut.map((x) => `${JSON.stringify(x.field)} ${x.why}`).join(' ')} Name measures of tables related to the chart's category and month.`);
    rs.measures = rr.measures;
    const labels = Object.fromEntries(rs.measures.map((x) => { const g = given.get(Bind.fieldKey(x.t, x.m)); if (g) g.used = true; return [`${x.t}[${x.m}]`, g ? g.name : x.m]; }));
    SW = addSwitch(r, { raw: modelOf(m.tmsl).tables || [], measures: rs.measures, labels, bind, lang: a.lang, rtl: switchAt.rtl, smooth: a.smoothLines, page: switchAt.page,
      seed: modelPrintOf(m) + '\0' + r.base + '\0' + JSON.stringify(rs.measures), leftOut: rr.leftOut });
    reportNotes.push(`The metric switcher is on its own page, ${JSON.stringify(SW.page)}: its field parameter is a TMDL script, "${SW.scriptFile}", next to the project (metricSwitcher.howToApply). ${switchSaid(SW).beforeApplied}`);
  }
  // (0.3.0 C1, the owner, 21 Oct) an Arabic report: the Arabic calendar columns its date table lacks, as a TMDL script next
  // to the project that joins the built files (never applied by DataArcus). Until it is applied the report binds the
  // English calendar columns (it always works); planned again after it, it binds the Arabic ones
  const CO = a.lang === 'ar' && a.arabicCalendar !== false ? calendarOffer({ m }, null, r.base) : null;
  if (CO && CO.offered) r.files.splice(r.files.findIndex((f) => /\.pbip$/.test(f.path)), 0, { path: CO.scriptAfterGo, data: CO.script });
  // (0.3.0 L4) the chosen KPI cards as flip cards, on the built files (create_report's one build: the plan's artifact holds
  // them); their measures as a TMDL script next to the project joins the files, as the metric switcher's (model-script.mjs)
  const radius = +((((((written || {}).visualStyles || {})['*'] || {})['*'] || {}).border || [{}])[0] || {}).radius;
  const flip = applyFlip(r.files, { flip: a.flipCards, lang: a.lang, rtl: look && look.rtl, ui: look && look.ui, font: look && look.font, radius: Number.isFinite(radius) ? radius : 8, tmsl: m.tmsl,
    base: r.base, seed: modelPrintOf(m) + '\0' + r.base + '\0flip' });
  // (0.3.0 L5) the status icons on the built tables and matrices (the plan's artifact holds them); a status measure goes
  // into its own TMDL script next to the project (model-script.mjs), rules need none
  if (Array.isArray(a.statusIcons)) { const ri = resolveIcons(modelOf(m.tmsl).tables || [], a.statusIcons); input(!ri.problems.length, `Nothing was written. ${ri.problems.join(' ')}`); }
  if (a.sharedAxes) { const ap = axesProblems(m, a.sharedAxes); input(!ap.length, `Nothing was written. ${ap.join(' ')}`); }
  const icons = applyIcons(r.files, { opt: a.statusIcons, raw: modelOf(m.tmsl).tables || [], base: r.base, seed: modelPrintOf(m) + '\0' + r.base + '\0icons', ui: look && look.ui, rtl: !!(look && look.rtl) });
  // (0.3.1 L6) the DAX function library: its uses on the built files, the library and its measures as ONE TMDL script
  // next to the project (model-script.mjs, a file of this one write); the compatibility step is said first wherever it shows
  let daxR = null;
  if (daxOption(a.daxFunctions)) {
    const rd = resolveDax(m.tmsl);
    input(!rd.problems.length, `Nothing was written. ${rd.problems.join(' ')}`);
    input(!(a.flipCards && daxOption(a.daxFunctions).includes('kpiCards')), 'Nothing was written. daxFunctions "kpiCards" and flipCards both turn the KPI cards into pictures: choose one (daxFunctions without "kpiCards", or flipCards false).');
    daxR = applyDax(r.files, { opt: a.daxFunctions, tmsl: m.tmsl, lang: a.lang, ui: look && look.ui, base: r.base, seed: modelPrintOf(m) + '\0' + r.base + '\0dax', font: look && look.font, rtl: look && look.rtl });
  }
  const galleryList = galleryOn(boundPages) ? galleryOf(boundPages, bind) : null;
  // (0.3.0 J18, B-171 item 5; F1: every mixed text) an Arabic report's texts: each Latin run inside Arabic text (an
  // acronym, a code, a model name kept in English) isolated wherever the report shows it, in the files the plan checks
  // and writes
  if (a.lang === 'ar') Terms.isolateFiles(r.files, [...given.values()].map((g) => g.name), { all: true });
  // the name as written: a long one is shortened at a whole word (the report writer), and the user is told
  if (Array.from(String(a.name).trim()).length > 30) reportNotes.push(`The report name was shortened to "${r.base}": a report name is 30 characters at most (Windows limits the length of a path), cut at a whole word.`);
  // write next to the model; refuse to replace anything that already exists
  // (anything at a name counts, a link whose target is missing included; each file is created with 'wx')
  // (audit 6, A6-4: one writer, all or nothing, the .pbip last (0.3.0 R4: written in place, each folder by its own mkdir);
  // anything at a name refuses the whole write, a link whose target is missing included)
  // 0.3.0 step 2, "Check before write" (the owner's go, 18 Oct): the shared check on the project in memory, before it is
  // written (the measured rules and the layout check; structure only, never data). It reports; it never writes or approves
  // (0.3.1 AF2, the release audit's F09) the format script the plan names joins the built files, under the free name chosen
  // now: inside the plan's digest, and written by the one writeTree, all or nothing (a name taken at the write: nothing is written).
  // Already there with exactly this script: named again, not written twice
  const FS = m.projectDir ? formatsScriptOf(m, a.path, new Set(fieldsOf(bind).filter((f) => f.agg == null).map(keyOf))) : null;
  const fsInTree = !!FS && path.resolve(FS.scriptDir) === path.resolve(m.projectDir) && nothingAt(FS.file);
  if (fsInTree) r.files.splice(r.files.findIndex((f) => /\.pbip$/.test(f.path)), 0, { path: path.basename(FS.file), data: FS.script });
  let projectCheck = null;
  try { projectCheck = checkSummary(checkFiles(r.files.filter((f) => /^[^/]+\.Report\//.test(f.path)), m, a.lang)); }
  catch (e) { projectCheck = { notChecked: 'the check could not read this project: ' + String(e && e.message || e).slice(0, 160) }; }
  // (J14: the build ends here; the write and the answer run from the approved artifact, writeApproved)
  if (!building) throw new Error(`Nothing was written: plan ${a.planId} holds no checked report to write (plan_layout builds and checks the report before the go, and create_report writes exactly that). Make the plan again with plan_layout and the same inputs, show it to the user and wait for their go.`);
  const finish = (planId) => {   // (the body keeps its indentation: the write and the answer, as before J14)
  // (0.3, B-153: the plan is used the moment the tree is in place, or left unused when a failed write left nothing)
  // (0.3.0 R4, F06: the format script the plan lists is written in the same write, after the report)
  // (R6, F07: the model read again right before the first write)
  let fmt = null;
  withPlan(planId, 'create_report', () => { sameModelBeforeWrite(planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(m)); writeTree(m.projectDir, r.files); fmt = formatsAnswer(m, a.path, new Set(fieldsOf(bind).filter((f) => f.agg == null).map(keyOf)), undefined, true, '', () => { if (!FS || (!fsInTree && nothingAt(FS.file))) throw new Error('the script is not one of this write\'s files'); return FS.file; }); });
  // what the report shows behind its visuals (read from the theme that was written, as the report writer reads it)
  const solid = !!((((((written.visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show);
  const panels = solid
    ? 'Each KPI card, chart and table has its own panel, drawn by the theme (solid visuals in the card colour, with the design\'s corners and shadow); the header and the filter rail are bands. There is no background picture: each page\'s background file is blank and see-through (listed with the report\'s files), so the page shows the theme\'s colour.'
    : 'The visuals have no panels of their own (the theme\'s visuals are transparent): they show on the page\'s background image where one is given, otherwise straight on the page. For panels, use a design or a theme with solid visuals.';
  if (kpiCards && leftOutVisuals.length) kpiCards.leftOutVisuals = leftOutVisuals;
  if (kpiCards) reportNotes.push(`KPI cards: ${kpiCards.built} of ${kpiCards.asked} built. ${kpiCards.why}`);
  if (textLeftOut.length) reportNotes.push(`The text box${textLeftOut.length === 1 ? '' : 'es'} ${[...new Set(textLeftOut)].map((x) => `"${x}"`).join(', ')} ${textLeftOut.length === 1 ? 'was' : 'were'} left out: create_report was given no text for ${textLeftOut.length === 1 ? 'it' : 'them'}, and a placeholder is never written${a.design ? '; the chart beside it takes its room' : ''}. For the box, pass the plan's sentence in "text" (what the main chart shows and what to do about it, in the report's language).`);
  // chart and table titles too long for one line (round 12, #24): wrapped to two, or shortened at the end with "…"
  const TT = r.titles || { wrapped: [], shortened: [], slicers: [] };
  if (TT.shortened.length || TT.slicers.length) reportNotes.push(`${TT.shortened.length + TT.slicers.length} title${TT.shortened.length + TT.slicers.length === 1 ? ' was' : 's were'} shortened at the end with "…" to fit (the full name stays the visual's alt text): ${[...new Set(TT.shortened.map((x) => `"${x.title}" as "${x.shown}"`).concat(TT.slicers.map((x) => `the slicer "${x.field}" as "${x.shown}"`)))].slice(0, 8).join('; ')}. Shorter display names (displayNames, from the user) read better.`);
  // the page filters, in words: the user must see that the pages show part of the data
  const shownValue = (v) => (typeof v === 'string' ? `"${v}"` : String(v));
  if (PF) reportNotes.push(`${PF.length === 1 ? 'A page filter is' : PF.length + ' page filters are'} set on every page of the report: ${PF.map((f) => `${f.key} is ${f.values.map(shownValue).join(' or ')}`).join('; ')}. Every visual shows only that part of the data. The user sees, changes or clears ${PF.length === 1 ? 'it' : 'them'} in the Filters pane of Power BI.`);
  const notes = modelNotes(m.tmsl, bind);
  // numbers the report shows whose format in the model has no thousand separator (or that have no format): Power BI
  // takes the format of a table cell, a tooltip and an unscaled card from the model, so the report can't add it
  const noSep = (() => {
    const model = modelOf(m.tmsl), out = [];
    // (measures wherever they are shown; number columns only in the table, and never an identifier or a date part)
    // (SQ10, audit-3-picker-writer-S2: each field once by its table and name)
    uniqueFields(fieldsOf(bind).filter((f) => f.m != null).concat((bind.table || []).filter((f) => f && f.c != null && f.num && !Fix.notAQuantity(f.c)))).forEach(({ key: k, f }) => {
      const t = (model.tables || []).find((x) => x.name === f.t), o = t && (f.m != null ? (t.measures || []).find((x) => x.name === f.m) : f.num ? (t.columns || []).find((x) => x.name === f.c) : null);
      if (!o || o.formatStringDefinition) return;
      if (f.m != null && Bind.isPercent(f.m, o.formatString, o.expression)) return;
      if (!o.formatString || Fix.lacksSeparator(o.formatString)) out.push(k);
    });
    return out;
  })();
  const numberFormats = noSep.length ? { numberFormats: { noThousandSeparator: noSep,
    ...(cardFormats.length ? { cards: { formatted: cardFormats, note: 'The KPI cards of these measures carry a number format of their own in the report (the measure\'s format with the thousand separator), so a card shows the full number with the separator, like 101,914, not a scaled one like 101.914K. The model is not changed.' } } : {}),
    ...(tableFormats.length ? { tables: { formatted: tableFormats, note: 'The tables of the report carry a number format of their own for these measures (the measure\'s format with the thousand separator), so a table shows 13,857, not 13857. The model is not changed.' } } : {}),
    charts: 'Chart labels and axes are not formatted by the report: they show scaled numbers (65K), which a format does not change.',
    why: 'These fields have no format with a thousand separator in the model. Wherever Power BI takes the format from the model (a visual added by hand, Excel, another report) they show 13857, not 13,857.',
    fix: 'check_model_health writes ready scripts that add the formats (fixes.NO_FORMAT for measures without a format, fixes.THOUSANDS for formats without a separator), or in Power BI Desktop select each measure, then Measure tools > the thousands separator button.' } } : {};
  if (PF) PF.filter((f) => f.note).forEach((f) => reportNotes.push(f.note));
  const svgList = (SV || []).map((c) => Object.assign({ label: c.label, entity: c.t, page: boundPages[c.at.page].name, shownAs: 'a column of that page\'s table, after its own columns (in a right-to-left report after its text column)', characters: c.expression.length, status: SVG_STATUS }, (r.svgSizes || {})[c.at.page] ? { imageWidth: r.svgSizes[c.at.page].w, imageHeight: r.svgSizes[c.at.page].h } : {}))
    .concat((SC || []).map((c) => ({ label: c.label, entity: c.t, shownAs: `the image of KPI card ${c.card} on every page`, characters: c.expression.length, status: SVG_STATUS })));
  const svgMeasures = svgList.length ? { svgMeasures: svgList } : {};
  // pictures narrowed so the table fits its box (never a scrollbar or a cut header)
  Object.entries(r.svgSizes || {}).filter(([, z]) => z.capped).forEach(([pi, z]) => reportNotes.push(`The SVG pictures in the table on "${boundPages[pi].name}" were narrowed to ${z.w} x ${z.h} (the widest design is ${z.design}) so the table fits its box. For the design's own size, give the table more room or fewer columns.`));
  // round 19 (the owner's choice B): a page under 800 wide takes the single-focus layout (the design engine's rule):
  // said when this call switched it (a design already planned as single focus was told so by plan_layout)
  if (smallPageNote) reportNotes.push(`The page is ${smallPageNote.w} wide, under 800, so it uses the single-focus layout (the KPI cards and one large chart): the executive layout's four charts and table would be cut or scroll on it.`);
  if (tinyPage && a.secondPage) reportNotes.push('The page is under 800 wide: the report has one page. A second page (details) would cut its card values and scroll its table at this size; ask for a page 800 wide or more for two pages.');
  if (a.subtitles) { const used = new Set(r.subtitlesUsed || []), un = Object.keys(a.subtitles).filter((k) => !used.has(subKeys[k] || k));
    if (un.length) reportNotes.push(`No subtitle was written for ${un.map((k) => '"' + k + '"').join(', ')}: a subtitle goes under the title of a chart or a table, found by its slot's role as plan_layout names it (in English or Arabic) or by a hand-placed slot's title. A KPI card never gets one (its value would be pushed down and cut).`); }
  if ((r.blankKept || []).length) reportNotes.push(`${r.blankKept.length === 1 ? 'A KPI card keeps' : r.blankKept.length + ' KPI cards keep'} "--" when there is no data (${r.blankKept.map((x) => `${x.title ? '"' + x.title + '"' : 'a card'} on "${x.page}", ${x.w} wide, needs ${x.need}`).join('; ')}): the "No data" text, at the value's own size, does not fit, and the value keeps its size.`);
  if ((r.barCharts || []).length) reportNotes.push(`The chart${r.barCharts.length === 1 ? '' : 's'} by ${[...new Set(r.barCharts.map((x) => x.field))].join(', ')} on ${[...new Set(r.barCharts.map((x) => `"${x.page}"`))].join(', ')} ${r.barCharts.length === 1 ? 'is a bar chart' : 'are bar charts'} instead of a column chart: the names would not fit side by side and would slant; as bars they read level. A short day name column in the model (Sun ... Sat, as the Gulf calendar's) keeps a column chart.`);
  if ((r.shortDays || []).length) { const sh = Object.values((bind && bind.cats) || {}).find((f) => f && f.short), shortCol = sh ? visible(sh.short.c) : 'the short day names', fullCol = sh ? visible(sh.c) : 'the day names'; reportNotes.push(`The column chart${r.shortDays.length === 1 ? '' : 's'} by day on ${[...new Set(r.shortDays.map((x) => `"${x.page}"`))].join(', ')} ${r.shortDays.length === 1 ? 'shows' : 'show'} ${shortCol} (Sun ... Sat), in the calendar's order: the full day names would not fit side by side and would slant. Tables and slicers keep ${fullCol}.`); }
  if ((r.ringsSmall || []).length) reportNotes.push(`The ring${r.ringsSmall.length === 1 ? '' : 's'} in the table (${[...new Set(r.ringsSmall.map((x) => x.label))].join(', ')}) ${r.ringsSmall.length === 1 ? 'is' : 'are'} drawn ${Math.max(...r.ringsSmall.map((x) => x.h))} high, too small for a number to be read, so ${r.ringsSmall.length === 1 ? 'it has' : 'they have'} no number inside: the measure's own column in the table carries the value (add it to fields.table where the table does not have it).`);   // (night of 6-7 Oct, seen in Desktop: a table without that column showed the value nowhere, and the note said it did)
  if (ringNumbers.length) reportNotes.push(`The ring${ringNumbers.length === 1 ? '' : 's'} on the KPI card${ringNumbers.length === 1 ? '' : 's'} (${ringNumbers.join(', ')}) ${ringNumbers.length === 1 ? 'has' : 'have'} no number inside: the card already shows the value, and two numbers read as two facts. A table picture keeps its number.`);
  if (svgList.length) reportNotes.push(`${svgList.length === 1 ? 'An SVG picture was' : svgList.length + ' SVG pictures were'} added (${svgList.map((c) => c.label).join(', ')}): each is a measure that exists only in this report (definition/reportExtensions.json); the model was not changed. This is ${SVG_STATUS}.`);
  // how the KPI cards show their numbers
  const kpiValues = { kpiValues: FULL
    ? { mode: 'full', note: 'The KPI cards show Power BI\'s own default, and the full number with thousand separators (101,914) where the measure\'s format has none; the value is smaller on narrow cards so nine digits fit.' }
    : { mode: 'auto', note: CARD_RULE + ' For full numbers with separators on every card (101,914) pass kpiValues: "full".' } };
  // the bars' colours (round 13): what was written, and why not when a gradient was asked and the colour cannot fade
  const CC = r.chartColors || {};
  // polish round P1 (B-71), P1+ (LAB-POLISH) and P3 (RESCORE-6 N25-N27): the fade's strong end is the chart's colour itself
  // (never past it), the weak end its tint; the second colour is chosen (never a red or status colour); a chart's colour is
  // keyed to its category field, so one field keeps one colour on every page
  const soft = (e) => (e && e.soft ? ' (the colour stands near 3:1 on the visuals, so its tint stands under 3:1)' : '');
  const second = CC.ends && CC.charts && CC.second && CC.ends2 ? { second: { charts: CC.second, colour: CC.base2, low: CC.ends2.low, high: CC.ends2.high, note: `A chart's colour follows its category field, the same on every page: the first field takes the theme's colour, the next ${CC.base2}, chosen from the palette (another hue, never a red or status colour, 3:1 on the visuals), and so on in turn. Its bars fade the same way, from its tint (${CC.ends2.low}) up to ${CC.ends2.high}${soft(CC.ends2)}.` } } : {};
  const chartColors = { chartColors: CC.ends && CC.charts
    ? Object.assign({ mode: 'gradient', charts: CC.charts, low: CC.ends.low, high: CC.ends.high }, CC.ends.soft ? { soft: true } : {}, { note: `The bars of the bar and column charts fade by their value: the smallest value shown is its tint towards the panel (${CC.ends.low}), the largest exactly the chart's colour (${CC.ends.high}), never darker${soft(CC.ends)} (conditional formatting on the data colour, a gradient by the chart's measure). The colours are written into each chart: after a change of theme, set them again or pass chartColors: "solid".` }, second)
    : Object.assign({ mode: 'solid' }, CC.asked && !CC.ends ? { why: `The bars' colour (${CC.base}) cannot fade and still stand 3:1 (contrast) off the panel behind it, so every bar keeps that one colour.` } : {}) };
  // a right-to-left report's charts (round 13): mirrored, or left as they are when asked
  const CA = r.chartAxes || {};
  const chartAxes = CA.rtl ? { chartAxes: CA.asked === 'mirrored'
    ? { mode: 'mirrored', charts: CA.charts, note: 'Power BI does not mirror charts in a right-to-left report, so the report does: column and line charts have the value axis at the right and their categories and dates run from the right (the chart is sorted by its category, descending, and a date axis is inverted); bar charts grow from the right with their names at the right; a waterfall (gallery) is Power BI\'s own, left to right as in English, with waterfallRtl "native" (the default: Power BI cannot draw its waterfall design right to left), and with waterfallRtl "mirror" a waterfall (gallery) is written as a stacked column chart drawn as a waterfall, read from the right (Power BI draws a waterfall left to right only; waterfallRtl in reportNotes says what each became). For charts left to right pass chartAxes: "standard".' }
    : { mode: 'standard', note: 'The charts run left to right, as Power BI draws them.' } } : {};
  // (0.3.0 L2) the slicers' style asked, and what each slicer was written as with why; the gridlines asked
  const looks = Object.assign(r.slicerStyle ? { slicerStyle: r.slicerStyle } : {}, r.grid ? { grid: r.grid } : {});
  // (L4) the flip cards: which cards, their bookmarks, the script and how to apply it first
  if (flip) looks.flipCards = Object.assign(flipAnswer(flip), flip.scriptFile ? { scriptFile: flip.scriptFile, howToApply: flipHow(flip.scriptFile, m.projectDir) } : {});
  // (L5) the status icons: each column, its way and rule, the script and how to apply it first
  if (icons) looks.statusIcons = Object.assign(iconsSaid(icons), icons.scriptFile ? { scriptFile: icons.scriptFile, howToApply: iconsHow(icons.scriptFile, m.projectDir) } : {});
  // (L6) the DAX function library: said FIRST in the answer (its compatibility step), with the script and how to apply it
  const daxFirst = daxR ? { daxFunctions: Object.assign(daxSaid(daxR), { scriptFile: daxR.scriptFile, howToApply: daxHow(daxR.scriptFile, daxR.compat, m.projectDir) }) } : {};
  // (D1) a right-to-left report's waterfalls: what each was written as (the plan says it too, waterfallRtl)
  (r.waterfallRtl || []).forEach((x) => reportNotes.push(`The waterfall${x.title ? ` "${visible(x.title)}"` : ''} on "${visible(x.page)}": ${x.written === 'columnChart' ? x.what : x.what + (x.why ? ` (${x.why})` : '')}.`));
  if (englishNames.size) reportNotes.push(`${[...englishNames].join(', ')} ${englishNames.size === 1 ? 'shows' : 'show'} the calendar's own names, English unless the calendar was made in Arabic: add the Gulf calendar's Arabic name columns to show Arabic day and month names (add_gulf_calendar writes them, as does the Calendar Generator's "Add Arabic name columns"), then create the report again.`);
  reportNotes.push('How the KPI cards show their numbers: ' + CARD_RULE + (textKpis.length ? '' : ''));
  // 0.2.9 part 2 (the owner's own test of 0.2.8): what the report does to its axes, tables and tooltips, said once
  (r.timeAxes || []).forEach((x) => reportNotes.push(`The line chart by ${visible(x.field)} on "${x.page}" is in time order by the month's first date (a report-level measure, "Month start (sort)", from ${visible(x.by)}; the model's column has no sort column)${x.last ? `, and shows the last ${x.last} months with data (a visual filter: clear it in the Filters pane for the whole history)` : ''}.`));
  // (the cross-review's G13: said only where a chart got the filter)
  // (the design block's S5/D19) the category charts kept to the Top N their slot can show. (0.2.9.1, B-174: the plan said
  // "Top 5" and Desktop showed 6: the writer's Keep: measure shows every category when there are at most allUpTo)
  if (r.topCharts && r.topCharts.length) reportNotes.push(`Bar and column charts by a category show the categories their place on the page can hold, by their measure: ${[...new Set(r.topCharts.map(topSaid))].join('; ')} (a visual filter${r.topCharts.some((x) => x.allUpTo > x.top) ? ' by a report-level "Keep:" measure' : ''}${r.topCharts.some((x) => !(x.allUpTo > x.top)) ? `${r.topCharts.some((x) => x.allUpTo > x.top) ? ' or' : ''} a Top N filter` : ''}, which can be cleared in the Filters pane; the rest are left out, with no "Other" bar). Only when a chart leaves categories out does its title say so, "${`Top ${r.topCharts[0].top} of`}" and the number of its categories, counted in the report under the page's filters; otherwise it shows its plain title (a report-level measure, the model untouched).`);
  if (r.blankFiltered) reportNotes.push('Charts leave out a blank category ("(Blank)"): each has a visual filter "is not blank" on its category, which can be cleared in the Filters pane.');
  if (boundPages && boundPages.some((p) => (p.slots || []).some((x) => x.kind === 'table'))) reportNotes.push('Tables have set column widths, and long text wraps.');
  // (0.3, J7) Power BI's accessibility basics: the data colours stepped to 3:1 on the card are told, from and to
  const A1 = r.a11y || {};
  if ((A1.colours || []).length) reportNotes.push(`${A1.colours.length === 1 ? 'A data colour of the theme was' : A1.colours.length + ' data colours of the theme were'} under 3:1 on the visuals' background ${A1.card} and ${A1.colours.length === 1 ? 'was' : 'were'} made darker or lighter to 3:1, hue kept (Power BI's accessibility basics): ${A1.colours.map((c) => `${c.from} (${c.contrast}:1) -> ${c.to}`).join(', ')}.`);
  if (r.tooltipLimits && (r.tooltipLimits.top || r.tooltipLimits.months)) reportNotes.push(`The tooltip pages show ${[r.tooltipLimits.top ? `the Top ${r.tooltipLimits.top} by the measure (said in the title)` : '', r.tooltipLimits.months ? `the last ${r.tooltipLimits.months} months, newest first` : ''].filter(Boolean).join(' and ')}, so no bar is lost behind a scrollbar a tooltip can't use.`);
  if (textKpis.length) reportNotes.push(`${textKpis.length === 1 ? 'A KPI card was' : textKpis.length + ' KPI cards were'} left out: ${textKpis.map((k) => `${k.t}[${k.m}]`).join(', ')} ${textKpis.length === 1 ? 'shows' : 'show'} text, not a number (a format of words only, a date format, or DAX that returns text), and a KPI card would show that text. Pick a measure that returns a number for the card.`);
  if (slicersDropped.length) reportNotes.push(`No slicer on ${[...new Set(slicersDropped)].join(', ')}: a page filter already keeps one value of ${new Set(slicersDropped).size === 1 ? 'it' : 'each'}, so a slicer would only show the choice already made. The next columns took the rail's places.`);
  // (the rc's laptop proof, D17: a card whose format the model sets by DAX, beside cards in a currency)
  // (round 8: an amount with no format in the model is told the same way: its card shows no currency either)
  if (bind && (bind.formatsMixed || []).length) { const fm = bind.formatsMixed, dyn = fm.filter((x) => !x.unformatted), unf = fm.filter((x) => x.unformatted), ns = (l) => l.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ');
    reportNotes.push(`${[dyn.length ? `${ns(dyn)} ${dyn.length === 1 ? 'takes its' : 'take their'} format from a DAX expression in the model` : null, unf.length ? `${ns(unf)} ${unf.length === 1 ? 'has' : 'have'} no format in the model` : null].filter(Boolean).join('; ')}, so ${fm.length === 1 ? 'its card' : 'their cards'} may show no currency beside the cards that do: say so in the plan, give ${fm.length === 1 ? 'it' : 'them'} the currency format in the model, or name other measures in "fields".`); }
  if (byFlagDay.length) { const x = byFlagDay[0]; reportNotes.push(`The line chart runs by ${x.t}[${x.c}] (its days), not by month: the page filter keeps ${x.flag.t}[${x.flag.c}] true, and one such period by month is a line of two or three points.`); }
  // tables given a smaller text so more of their fields fit (round 12, recommendation 5)
  if ((r.tableSmaller || []).length) reportNotes.push(tableSmallerSaid(r.tableSmaller, r.tableColumns));
  // round 23 (the owner's go, 8 Oct 2026): the right-to-left table's total row says «الإجمالي» (way 4, measured in Desktop); "Total" in an English report
  if ((r.rowLabels || []).length) reportNotes.push(rowLabelSaid(r.rowLabels, a.lang));
  if ((r.rowLabelSkipped || []).length) reportNotes.push(rowLabelSkippedSaid(r.rowLabelSkipped, a.lang));
  // (round 22b, the outside review's X-05) a measure whose name holds a control character gets no "No data" card
  if ((r.noDataSkipped || []).length) reportNotes.push(`No data message for ${r.noDataSkipped.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ')}: not written, the name holds a control character (a tab or a line break) that no DAX may name. Rename it in Power BI Desktop (remove the hidden character) and create the report again for the message.`);
  // (round 22b, the review of round 22, item 8) a table whose name column and first measure need more than its width even at 8pt
  if ((r.tableWide || []).length) reportNotes.push(`${r.tableWide.map((x) => `The table on "${x.page}" needs about ${x.need} for its name column and first measure, wider than the table (${Math.round(x.width)}) even at 8pt`).join('; ')}: it scrolls sideways in Power BI. Make the table wider, or give those two fields shorter display names (displayNames, from the user).`);
  // a header that grew one row so the page names fit as tabs (round 12)
  if ((r.headerGrew || []).length) reportNotes.push(`The header is ${r.headerGrew[0].by} taller on ${r.headerGrew.map((x) => `"${x.page}"`).join(', ')}, so the page names fit as two rows of tabs; the visuals under it moved down and the last row is that much shorter.`);
  // tables whose known rows don't fit even with tight rows (round 12, #23)
  (r.tableRows || []).forEach((x) => reportNotes.push(`The table of ${x.field} on "${x.page}" needs about ${x.need} to show its ${x.rows} rows, a header and a total, even with tight rows, and has ${x.h}: its last rows will scroll. A taller table slot, fewer fields or a larger page shows them all.`));
  // days and months put in calendar order in a table by a helper column (round 12, #17)
  if ((r.tableOrder || []).length) reportNotes.push(`${[...new Set(r.tableOrder.map((x) => x.field))].join(', ')} ${r.tableOrder.length === 1 ? 'is' : 'are'} in calendar order in the table${r.tableOrder.length === 1 ? '' : 's'} too (by ${[...new Set(r.tableOrder.map((x) => x.by))].join(', ')}, the same order as the charts): the model gives ${r.tableOrder.length === 1 ? 'it' : 'them'} no sort-by column, so each table carries the number in a narrow column with no header, in the card colour. Setting the sort-by column in the model (check_model_health, fixes.MONTH_SORT) orders slicers too.`);
  // visuals left out because the model has no field for them (never written empty)
  const WHY = { funnel: 'a funnel shows an amount, and the model has no measure that is not a ratio or a percent', slicer: 'the model has no more text columns a slicer can use', line: bind && !bind.measure ? 'the model has no measure for it' : bind && bind.noRelatedCalendar ? (bind.noRelatedCalendar.kind === 'date' ? `no date column is related to ${visible(bind.noRelatedCalendar.measure.t)}: the date column${bind.noRelatedCalendar.tables.length === 1 ? '' : 's'} of ${bind.noRelatedCalendar.tables.map(visible).join(', ')} ${bind.noRelatedCalendar.tables.length === 1 ? 'is' : 'are'} not reached from ${visible(bind.noRelatedCalendar.measure.t)}[${visible(bind.noRelatedCalendar.measure.m)}]; add a calendar related to ${visible(bind.noRelatedCalendar.measure.t)} (add_gulf_calendar writes one) for a trend` : `no calendar is related to ${visible(bind.noRelatedCalendar.measure.t)}: the model's calendar${bind.noRelatedCalendar.tables.length === 1 ? '' : 's'} (${bind.noRelatedCalendar.tables.map(visible).join(', ')}) ${bind.noRelatedCalendar.tables.length === 1 ? 'is' : 'are'} not reached from ${visible(bind.noRelatedCalendar.measure.t)}[${visible(bind.noRelatedCalendar.measure.m)}]; add the relationship (a date column of ${visible(bind.noRelatedCalendar.measure.t)} to the calendar's date) for a trend`): 'the model has no month or date column for its axis', table: 'no field was found for it', matrix: 'it needs a text column and a measure', gauge: 'the model has no measure for it', card: 'the model has no measure for it' };
  const KIND = { slicer: 'Slicer', line: 'Line chart', bar: 'Bar chart', column: 'Column chart', donut: 'Donut chart', funnel: 'Funnel', treemap: 'Treemap', map: 'Map', table: 'Table', matrix: 'Matrix', gauge: 'Gauge', card: 'Card' };
  // (round 22b, the outside review's X-04) no category is related to the main measure: the charts that need one are left out
  // round 23 (the owner's rule, 8 Oct 2026: English in English reports, Arabic in Arabic reports): which columns the
  // picker left for the report's language, and the named fields in the other language (the user's names always win)
  if (bind && bind.language) { const L = bind.language, sk = L.skipped || [], fb = L.fallback || [];
    reportNotes.push(`${a.lang === 'ar' ? 'Arabic' : 'English'} report: the columns picked are in ${a.lang === 'ar' ? 'Arabic where the model has an Arabic column for the same thing (the others keep their names, shown through display names)' : 'English'}${sk.length ? `; ${sk.map(visible).join(', ')} ${sk.length === 1 ? 'was' : 'were'} not used: ${a.lang === 'ar' ? 'the English column of an Arabic twin' : 'Arabic columns, with English ones beside them'}` : ''}${fb.length ? `; ${fb.map(visible).join(', ')} ${fb.length === 1 ? 'is' : 'are'} Arabic and used anyway: the model has no English column for ${fb.length === 1 ? 'it' : 'them'}` : ''}. To use another column, name it in "fields".`); }
  if (F) { const tw = Bind.twinsOf(m.tables), cl = Bind.langsOf(m.tables), named = [].concat(F.kpis || [], [F.measure, F.timeAxis, F.category, F.category2], F.table || [], F.slicers || []).filter(Boolean);
    const off = [...new Set(named.filter((f) => { const n = f.c != null ? f.c : f.m, l = f.c != null && cl[Bind.fieldKey(f.t, f.c)] ? cl[Bind.fieldKey(f.t, f.c)] : Bind.langOf(n); return a.lang === 'ar' ? l === 'en' && f.c != null && tw[Bind.fieldKey(f.t, f.c)] : l === 'ar'; }).map((f) => `${visible(f.t)}[${visible(f.c != null ? f.c : f.m)}]`))];
    if (off.length) reportNotes.push(`${off.join(', ')} ${off.length === 1 ? 'is' : 'are'} in ${a.lang === 'ar' ? 'English (the model has an Arabic column beside it)' : 'Arabic'}, and the report is ${a.lang === 'ar' ? 'Arabic' : 'English'}: used as named in "fields".`); }
  // round 23: a report measure renamed because its name is taken (by the model or another report measure: said by its cause)
  if ((r.extRenamed || []).length) reportNotes.push(extRenamedSaid(r.extRenamed, modelNames));
  // round 23: a table's measures that do not reach its rows were left out of it (they would repeat one total on every row)
  if (bind && (bind.notReached || []).length) { const nr = bind.notReached; reportNotes.push(`${nr.map((x) => `${visible(x.t)}[${visible(x.m)}]`).join(', ')} ${nr.length === 1 ? 'was' : 'were'} left out of the table by ${visible(nr[0].row.t)}[${visible(nr[0].row.c)}]: ${[...new Set(nr.map((x) => visible(x.t)))].join(', ')} ${nr.length === 1 ? 'is' : 'are'} not related to ${visible(nr[0].row.t)}, so ${nr.length === 1 ? 'it' : 'each'} would repeat one total on every row. Add the relationship in the model, or name the table's fields in "fields".`); }
  if (bind && bind.noRelatedCategory) { const n = bind.noRelatedCategory; reportNotes.push(`No category is related to ${visible(n.measure.t)}[${visible(n.measure.m)}]: the text columns of ${n.tables.map((t) => visible(t)).join(', ')} are in tables the measure's table does not reach through a relationship, so a chart by them would show the same total on every bar. The charts that need a category are left out. Add a relationship from ${visible(n.measure.t)} to one of those tables, or pick a category of a related table in "fields".`); }
  // (0.3.1 SQ1, M1-S4) narrow: a slicer or the Reset button left out of a filter slot too narrow for it (the shared writer's)
  const NARROW = 'its filter slot is too narrow: a slicer narrower than 24 is drawn as a sliver or not at all, so the Reset button goes first, then slicers from the last';
  // (0.3.1 TW1, SQ1-S2) short: left out of a stacked filter slot too short for it
  const SHORT = 'its filter slot is too short: stacked, each slicer needs the height a dropdown needs, so the Reset button goes first, then slicers from the last';
  const leftOutList = (r.leftOut || []).map((x) => ({ visual: x.kind === 'slicer' || x.kind === 'reset' ? (x.title || 'Slicer') : `${KIND[x.kind] || x.kind}${x.title ? ` "${x.title}"` : ''}`, page: x.page, why: x.narrow ? (x.short ? SHORT : NARROW) : (WHY[x.kind] || 'the model has no text column (a category) or no measure for it') + (x.gave ? ' (the visual beside it takes its room)' : x.noTime ? ' (the page has the layout made for a model without a time axis: the charts by category share its rows)' : ''), narrow: !!x.narrow }));   // (round 23: gave, the shared writer's)
  const noField = leftOutList.filter((x) => !x.narrow), narrow = leftOutList.filter((x) => x.narrow);
  if (noField.length) reportNotes.push(`${noField.length} visual${noField.length === 1 ? ' was' : 's were'} left out, because a visual is never written without its field: ${noField.map((x) => `${x.visual} on "${x.page}" (${x.why})`).join('; ')}.`);
  const tight = (list, how, why, fix) => { if (list.length) reportNotes.push(`Left out of a filter slot too ${how} for ${list.length === 1 ? 'it' : 'them'}: ${list.map((x) => `${x.visual} on "${x.page}"`).join('; ')} (${why}). For all of them: a ${fix} slicer slot, or fewer slicers in fields.slicers.`); };
  tight(narrow.filter((x) => x.why === NARROW), 'narrow', NARROW, 'wider'); tight(narrow.filter((x) => x.why === SHORT), 'short', SHORT, 'taller');
  leftOutList.forEach((x) => { delete x.narrow; });
  // tables that hold fewer fields than given, for lack of room (round 11): named, and boundFields lists what each shows
  const TC = r.tableColumns || [], fkey = (f) => `${f.t}[${f.c != null ? f.c : f.m}]`;
  const tableColumns = TC.length ? { tableColumns: TC.map((c) => ({ page: c.page, shown: c.kept.length, leftOut: c.leftOut.map(fkey) })) } : {};
  if (TC.length) reportNotes.push(`Fields were left out of the table on ${TC.map((c) => `"${c.page}" (${c.leftOut.map(fkey).join(', ')})`).join('; ')}: at this page size the table has room for ${[...new Set(TC.map((c) => c.kept.length))].join(' or ')} columns, and a table wider than its box hides columns behind a scrollbar. For the fields left out: a wider table slot, a larger page, shorter display names, or fewer fields in fields.table.`);
  // page tabs in two rows (round 16, the owner's yes on design finding #13)
  if ((r.chartTops || []).length) reportNotes.push(`${r.chartTops.length === 1 ? 'A chart shows' : `${r.chartTops.length} charts show`} the top ${[...new Set(r.chartTops.map((x) => x.top))].join(' or ')} of ${[...new Set(r.chartTops.map((x) => visible(x.field)))].join(', ')} by the measure, as the title says: the chart holds that many; the rest is in the table, the slicers and the filter pane.`);
  if ((r.tabRows || []).length) reportNotes.push(`The page tabs take ${[...new Set(r.tabRows.map((x) => x.rows))].join(' or ')} rows at ${[...new Set(r.tabRows.map((x) => x.size + 'pt'))].join(' or ')} on ${r.tabRows.length === 1 ? 'one page' : r.tabRows.length + ' pages'}: the page names fit one row only at a smaller size, and two rows read better; nothing is cut.`);
  // page buttons that did not fit the header (round 11): never written cut, and never left out without saying so
  const NPB = (r.noPageButtons || []).map((x) => x.page);
  const pageButtons = NPB.length ? { pageButtons: { leftOutOn: NPB, why: 'The page names do not fit the room between the title and the logo, even at 8pt on as many rows as the header is high. A cut name is worse than no button, so these pages have no page buttons; readers still change pages with Power BI\'s own page tabs.' } } : {};
  if (NPB.length) reportNotes.push(`${NPB.length === 1 ? 'One page has' : NPB.length + ' pages have'} no page buttons in the header: the page names do not fit the room between the title and the logo, even at 8pt. Readers still change pages with Power BI's own page tabs. For page buttons in the report: shorter page names, fewer pages, or a taller title slot (two rows of names need a title about 44 high).`);
  // KPI titles too long for one line at the 8pt minimum: wrapped to two lines, or shortened with the full name kept
  const KT = r.kpiTitles || { wrapped: [], shortened: [] };
  const chartTitles = TT.wrapped.length || TT.shortened.length || TT.slicers.length ? { chartTitles: { wrapped: TT.wrapped, shortened: TT.shortened, slicerHeaders: TT.slicers,
    note: 'A chart\'s or table\'s title never shows cut at its start: one too long for one line wraps to two lines, and one too long for two is shortened at its end with "…", so it still begins with the measure\'s name; a slicer\'s header is shortened the same way on one line. The full names stay the visuals\' alt text.' } } : {};
  const kpiTitles = KT.wrapped.length || KT.shortened.length ? { kpiTitles: { wrapped: KT.wrapped, shortened: KT.shortened,
    note: 'A KPI title never shows cut: one too long for its card at 8pt wraps to two lines where the card is high enough, otherwise it is shortened at a word with "…" (the full name stays the card\'s alt text and its tooltip). A shorter display name (displayNames, from the user) reads better on a small card.' } } : {};
  if (KT.shortened.length) reportNotes.push(`${KT.shortened.length} KPI title${KT.shortened.length === 1 ? ' was' : 's were'} shortened to fit their cards: ${[...new Set(KT.shortened.map((x) => `"${x.title}" as "${x.shown}"`))].join('; ')}. Ask the user for shorter display names if these read badly.`);
  // what was done with the display names; and in an Arabic report, the fields it shows under a model name that has no
  // Arabic letter (no name is ever made up for them)
  const shown = uniqueFields(fieldsOf(bind)).map((x) => x.key);   // (SQ10: each field once by its table and name)
  const names = given.size ? { displayNames: { used: [...given.values()].filter((g) => g.used).length, notUsed: [...given.values()].filter((g) => !g.used).map((g) => g.key) } } : {};
  const missing = a.lang === 'ar' ? uniqueFields(fieldsOf(bind).filter((f) => !f.name && !/[\u0600-\u06FF]/.test(f.c != null ? f.c : f.m))).map((x) => x.key) : null;
  const arabic = a.lang === 'ar' ? { arabicNames: { shownFields: shown.length, missing,
    how: missing.length ? 'These fields show under their model names. To show Arabic names, call create_report again with displayNames: { "Table[Field]": "الاسم" } for each (propose names, show them to the user, and pass only the ones they approve or edit: never show a name the user has not approved). The model is not renamed.' : 'Every field the report shows has an Arabic name.' } } : {};
  // formats fixed at the source: said first, with the script (the report already shows the right formats)
  const formats = fmt ? { formats: Object.assign({ sayFirst: `Tell the user first: ${fmt.fields.length} of the report's fields ${fmt.fields.length === 1 ? 'has' : 'have'} no right format in the model (listed with the format each should have). The report already shows them right: the cards, the tooltip's card and the tables carry the right format of their own. Applying the script sets them in the model too, so every other visual, Excel and other reports show them right.` }, fmt) } : {};
  return Object.assign(daxFirst, formats, { written: r.files.length, open: path.join(m.projectDir, r.base + '.pbip'), report: r.base + '.Report', model: path.basename(m.folder) }, projectCheck ? { check: Object.assign({ tellUser: 'Checked before it was written (the measured rules of what Power BI Desktop draws, and the layout check). Tell the user the summary; when it lists problems, say each one with its fix.' }, projectCheck) } : {}, extra, { panels },
    // (0.3.0) the phone layout: written for every page unless the design says phoneLayout false
    { phone: phoneAnswer(r.files.some((f) => /\/mobile\.json$/.test(f.path))) },
    { boundFields: boundOf(r.bound) }, PF ? { pageFilters: PF.map((f) => Object.assign({ field: f.key, values: f.values, type: f.type }, f.typedBy ? { typedBy: f.typedBy } : {}, f.note ? { note: f.note } : {})) } : {}, svgMeasures, kpiValues, chartColors, chartAxes, looks, kpiTitles, chartTitles, pageButtons, tableColumns, leftOutList.length ? { leftOutVisuals: leftOutList } : {}, unknown ? { ignored: unknown } : {}, hiddenOf(m),
    sc.scope ? { scope: sc.scope } : {}, kpiCards ? { kpiCards } : {}, designRepaired ? { repaired: designRepaired } : {}, names, arabic, notes.length ? { modelNotes: notes } : {}, numberFormats, reportNotes.length ? { reportNotes } : {},
    galleryList ? { gallery: { slots: galleryList } } : {}, SW ? { metricSwitcher: switchSaid(SW) } : {}, CO && CO.offered ? { calendarArabic: calendarSaid(CO, shown, { scriptFile: CO.scriptAfterGo, howToApply: CO.howToApply }) } : CO && CO.leftOut ? { calendarArabic: { offered: false, why: CO.why, leftOut: CO.leftOut } } : {});
  };
  // (0.3.0 F7) the fields the report binds, the keys of its formats script (the plan lists exactly these)
  return { formatKeys: [...new Set(fieldsOf(bind).filter((f) => f.agg == null).map(keyOf))], files: r.files, finish, m, slicers: slicersOf(r.bound), a11y: r.a11y || null, gallery: galleryList, waterfallRtl: r.waterfallRtl || null, metricSwitcher: SW, flip: flip ? Object.assign(flipAnswer(flip), { pending: flip.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: flip.scriptFile }) : null,
    icons: icons ? Object.assign(iconsSaid(icons), { pending: icons.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: icons.scriptFile }) : null,
    dax: daxR ? Object.assign(daxSaid(daxR), { pending: daxR.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: daxR.scriptFile }) : null };
}
