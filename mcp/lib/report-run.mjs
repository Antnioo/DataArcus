// One report's build, for create_report and plan_layout alike (reportRun: the plan builds and checks exactly what the
// write writes): one engine, kept whole.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { loadModel, inside, modelOf, nothingAt, refuseUnreadable } from './model.mjs';
import { planLayout, absorb, imageSize, isSmall, projectPages, designRtl, buildTheme, texts, themeName, themeScaleOf, scaleTheme, textScale, isGlass, glassPng } from './design.mjs';
import { scopeOf } from './scope.mjs';
import { resolveSwitch, switchReach, addSwitch, switchSaid, SWITCH_MIN, SWITCH_MAX } from './metric-switcher.mjs';
import { takenNames } from './report-names.mjs';
import { checkSummary, checkFiles } from './plan-lint.mjs';
import { modelPrintOf } from './artifact.mjs';
import { applyFlip } from './flip-cards.mjs';
import { resolveIcons, applyIcons, iconsSaid } from './status-icons.mjs';
import { daxOption, resolveDax, applyDax, daxSaid } from './dax-functions.mjs';
import * as Plans from './plans.mjs';
import * as Terms from './terminology.mjs';
import { monthOffer as calendarOffer } from './arabic-twin.mjs';
import { withPlan, readUserFile, writeTree } from './files.mjs';
import { modelRef, sameModelBeforeWrite } from './plan-keys.mjs';
import { formatsAnswer, formatsScriptOf } from './fix-scripts.mjs';
import { reportAnswer } from './report-result.mjs';
import { fieldsDesign, fieldBinding, givenNames, namedFields, fieldsOf, keyOf } from './report-bind.mjs';
import { relsOf, resolveFields, resolvePageFilters, resolveSvgColumns, slicersOf, axesProblems, axesOf } from './report-fields.mjs';
import { unknownKeys, THEME_MAX, LOGO_MAX, BACKGROUND_MAX, reportPin } from './report-inputs.mjs';
import { flipAnswer, barSaid } from './report-said.mjs';
import { sampleCounts } from './sample-counts.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');
const Pbip = require('../../assets/js/pbip-export.js');
const Mirror = require('../../assets/js/report-mirror.js');
const Gallery = require('../../assets/js/visual-gallery.js');
const Svg = require('../../assets/js/svg-kpi-compiler.js');

export const BLANK_PNG_BYTES = Buffer.from(Mirror.BLANK_PNG, 'base64');   // (0.3.0 T1, T-6: the blank page background, known by its bytes)

// A theme's own colours (DataArcus theme generator and Power BI themes): text, visual and page background, accent,
// so the title, buttons and filter pane match the theme instead of the defaults
const themeColors = (t) => {
  const page = t && t.visualStyles && t.visualStyles.page && t.visualStyles.page['*'] && t.visualStyles.page['*'].background;
  const out = { text: t && t.foreground, card: t && t.background, accent: t && t.tableAccent, background: page && page[0] && page[0].color && page[0].color.solid && page[0].color.solid.color };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)));
};
const themeOf = (p) => readUserFile(p, { kind: 'theme', max: THEME_MAX, json: true });
// fieldsDesign and planBinding (create_report's and plan-lint's one page-and-binding rule): lib/report-bind.mjs (0.3.2 SP4)
export { fieldsDesign, planBinding } from './report-bind.mjs';
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
  // (0.3.2 SP4) the binding (the measures a card can show, the columns counted without measures, the picker's binding
  // with every pinned field, the cards' and the table's formats, the picker's notes): lib/report-bind.mjs, here as before
  const FULL = a.kpiValues === 'full';
  const { usable, COUNTS, nValues, nCards, bindFor, cardNote, listFormats, cardFormats, tableFormats, slicersDropped, byFlagDay, englishNames } = fieldBinding({ m, pickFrom, lang: a.lang, F, PF, full: FULL, sc });
  let kpiCards = null;
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
  const given = givenNames(a.displayNames);
  // the display names given, as copies of the bound fields (A3-2: never set on the picker's fields in place); a calendar
  // name the picker swapped for its Arabic column keeps the name given for the English one
  // (0.3.2 SP4) the names given, put on copies of the bound fields: lib/report-bind.mjs
  const named = (b) => namedFields(b, given);
  // the logo, as the website takes it: a PNG or JPG, 2 MB at most; its size is read so its box can take its shape
  const reportNotes = [];
  // (0.3.1 FX5b, the owner's D-1028-06) the distinct counts a bar or column chart's thickness follows: columnStats' (the
  // model's own, read in Desktop; counts only, never a value), then the sample project's own (DataArcus's made-up rows,
  // lib/sample-counts.mjs); names matched as DAX does (pbip-bind.js statsOf)
  const givenStats = a.columnStats ? Bind.statsOf(m.tables, a.columnStats) : null, sampleOwn = sampleCounts(m), sampleStats = sampleOwn ? Bind.statsOf(m.tables, { distinct: sampleOwn }) : null;
  const countOf = (t, c) => (givenStats && givenStats.distinct(t, c)) || (sampleStats && sampleStats.distinct(t, c)) || 0;
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
      theme: (written = buildTheme(design, a.lang)), ui: design.ui, model: { byPath: path.basename(m.folder), taken: takenNames(m.projectDir), names: modelNames, columns: modelColumns, counts: countOf }, bind: (bind = B0), gallery: galleryOn(pages), pageFilters: PF, svgColumns: svgFor(pages, bind), svgCards: svgCardsFor(kpisOf(pages)), kpiValues: a.kpiValues, noDataMessage: a.noDataMessage, smoothLines: a.smoothLines, slicerStyle: a.slicerStyle, grid: a.grid, phoneLayout: design.layout.phoneLayout !== false, subtitles, chartColors: a.chartColors || 'gradient', chartAxes: a.chartAxes || 'mirrored', waterfallRtl: a.waterfallRtl, logoPlaceholder: false, quietGrid: true,
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
    // layout.page, 1920 x 1080 by default: 10pt x the engine's textScale of the page's height, as plan_layout's pages are), and a smaller
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
      // (0.3.1 TS1, the owner's x 1.25 on 1920 x 1080: text grows by the engine's textScale, no longer with the page's
      // height, so the ratio is the two pages' text factors; a 1080 theme from before 0.3.1, x 1.5, reads as made for
      // about 1440 and its text takes the new sizes, said)
      const ratio = ours && hs.length === 1 ? textScale(hs[0]) / sc.f : null;
      if (ratio && Math.abs(ratio - 1) > 0.01) {
        theme = scaleTheme(theme, ratio);
        const was = Math.abs(themeH - 1440) <= 20 ? ' (or a 1920 x 1080 theme made before DataArcus 0.3.1, when text grew x 1.5 with the page; it grows x 1.25 now)' : '';
        reportNotes.push(`The theme's text sizes were made for a page about ${themeH} high${was}; they were scaled to these ${hs[0]}-high pages (x ${ratio.toFixed(2)}, within 8-60), as a planned page's theme is. The theme file itself was not changed.`);
      } else if (t10 > 0 && !ours) reportNotes.push(`The theme's text sizes were not scaled to the pages: it is not a theme generate_theme made, so its sizes are kept as its author set them. If they look too large or too small on these ${hs.join(' and ')}-high pages, change the theme, or make one with generate_theme (layout.page).`);
      else if (!ratio && t10 > 0 && hs.length > 1) reportNotes.push(`The theme's text sizes are made for a page about ${themeH} high and were not scaled: the pages have different heights (${hs.join(', ')}). Use one page size, or a theme made for it (generate_theme's layout.page).`);
    }
    written = theme;
    look = { ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}), font: a.font, rtl: rtlHand };
    r = Pbip.build({
      name: a.name, title: a.title || a.name, lang: a.lang, rtl: rtlHand, font: a.font, sample: false, logo, theme,
      ui: Object.assign({ text: '#1f2937', card: '#ffffff', background: '#f3f4f6', accent: '#0f6cbd' }, themeColors(theme), a.colors || {}),
      model: { byPath: path.basename(m.folder), taken: takenNames(m.projectDir), names: modelNames, columns: modelColumns, counts: countOf }, bind: (bind = withSplit(listFormats(named(bindFor(kpisOf(a.pages)))), a.pages)), gallery: galleryOn(a.pages), pageFilters: PF, svgColumns: svgFor(a.pages, bind), svgCards: svgCardsFor(kpisOf(a.pages)), kpiValues: a.kpiValues, noDataMessage: a.noDataMessage, smoothLines: a.smoothLines, slicerStyle: a.slicerStyle, grid: a.grid, subtitles: a.subtitles, chartColors: a.chartColors || 'solid', chartAxes: a.chartAxes || 'mirrored', waterfallRtl: a.waterfallRtl, logoPlaceholder: false, quietGrid: true,
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
  // (0.3.1 FX5b) each chart given thinner bars, said in the plan and the answer (EN and AR)
  const barThickness = barSaid(r.barBands);
  const finish = (planId) => {   // (the body keeps its indentation: the write and the answer, as before J14)
  // (0.3, B-153: the plan is used the moment the tree is in place, or left unused when a failed write left nothing)
  // (0.3.0 R4, F06: the format script the plan lists is written in the same write, after the report)
  // (R6, F07: the model read again right before the first write)
  let fmt = null;
  withPlan(planId, 'create_report', () => { sameModelBeforeWrite(planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(m)); writeTree(m.projectDir, r.files); fmt = formatsAnswer(m, a.path, new Set(fieldsOf(bind).filter((f) => f.agg == null).map(keyOf)), undefined, true, '', () => { if (!FS || (!fsInTree && nothingAt(FS.file))) throw new Error('the script is not one of this write\'s files'); return FS.file; }); });
  // (0.3.2 SP3) the answer and its notes: lib/report-result.mjs, from the build's values as they are now
  return reportAnswer({ a, m, r, bind, given, written, fmt, projectCheck, extra, unknown, sc, designRepaired, reportNotes, kpiCards, leftOutVisuals, textLeftOut, PF, SV, SC, boundPages, smallPageNote, tinyPage, subKeys, ringNumbers, FULL, cardFormats, tableFormats, flip, icons, daxR, englishNames, textKpis, slicersDropped, byFlagDay, modelNames, F, galleryList, SW, CO, barThickness, fieldsOf });
  };
  // (0.3.0 F7) the fields the report binds, the keys of its formats script (the plan lists exactly these)
  return { formatKeys: [...new Set(fieldsOf(bind).filter((f) => f.agg == null).map(keyOf))], files: r.files, finish, m, barThickness, slicers: slicersOf(r.bound), a11y: r.a11y || null, gallery: galleryList, waterfallRtl: r.waterfallRtl || null, metricSwitcher: SW, flip: flip ? Object.assign(flipAnswer(flip), { pending: flip.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: flip.scriptFile }) : null,
    icons: icons ? Object.assign(iconsSaid(icons), { pending: icons.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: icons.scriptFile }) : null,
    dax: daxR ? Object.assign(daxSaid(daxR), { pending: daxR.measures.map((x) => ({ t: x.t, name: x.name })), scriptAfterGo: daxR.scriptFile }) : null };
}
