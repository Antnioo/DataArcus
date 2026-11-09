// One report's build, for create_report and plan_layout alike (reportRun: the plan builds and checks exactly what the
// write writes): one engine, kept whole.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
// (0.3.2, the split: B-280, B-286) the facade: the inputs checked, the gate, the fields, filters, SVG designs and the
// binding (report-bind.mjs), then the build (report-build.mjs), the check, the mode boundary and the write with its
// answer (report-result.mjs). reportRun(a, mode) -> { formatKeys, files, finish, m, ... } (mode 'build': plan_layout's
// exact artifact; 'write': create_report without one, refused where it would write)
import { loadModel, nothingAt, refuseUnreadable } from './model.mjs';
import { planLayout } from './design.mjs';
import { scopeOf } from './scope.mjs';
import { checkSummary, checkFiles } from './plan-lint.mjs';
import { modelPrintOf } from './artifact.mjs';
import { iconsSaid } from './status-icons.mjs';
import { daxSaid } from './dax-functions.mjs';
import * as Plans from './plans.mjs';
import { withPlan, writeTree } from './files.mjs';
import { modelRef, sameModelBeforeWrite } from './plan-keys.mjs';
import { formatsAnswer } from './fix-scripts.mjs';
import { reportAnswer } from './report-result.mjs';
import { fieldBinding, fieldsOf, keyOf } from './report-bind.mjs';
import { resolveFields, resolvePageFilters, resolveSvgColumns, slicersOf } from './report-fields.mjs';
import { reportPin } from './report-inputs.mjs';
import { flipAnswer, barSaid } from './report-said.mjs';
import { reportBuild, themeColors, themeOf } from './report-build.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Svg = require('../../assets/js/svg-kpi-compiler.js');

// the blank page background (0.3.0 T1), the build's: lib/report-build.mjs (0.3.2 SP43); plan_layout reads it here
export { BLANK_PNG_BYTES } from './report-build.mjs';
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
  // (0.3.2 SP4) the binding (the measures a card can show, the columns counted without measures, the picker's binding
  // with every pinned field, the cards' and the table's formats, the picker's notes): lib/report-bind.mjs, here as before
  const FULL = a.kpiValues === 'full';
  const { usable, COUNTS, nValues, nCards, bindFor, cardNote, listFormats, cardFormats, tableFormats, slicersDropped, byFlagDay, englishNames } = fieldBinding({ m, pickFrom, lang: a.lang, F, PF, full: FULL, sc });
  // (0.3.2 SP43) the build: the SVG pages, the designed or hand-placed pages written, the scripts offered, the isolation,
  // the format script: lib/report-build.mjs, from the binding and the design; nothing is written there
  const { warnings: { reportNotes, textLeftOut, leftOutVisuals, kpiCards, smallPageNote, tinyPage, designRepaired, unknown },
    scripts: { SW, CO, flip, icons, daxR, FS, fsInTree }, built: { r, bind, given, written, extra, boundPages, subKeys, modelNames, galleryList } }
    = reportBuild({ a, m, notReady, F, PF, SV, SC, rtlHand, binding: { usable, COUNTS, nValues, nCards, bindFor, cardNote, listFormats } });
  // write next to the model; refuse to replace anything that already exists
  // (anything at a name counts, a link whose target is missing included; each file is created with 'wx')
  // (audit 6, A6-4: one writer, all or nothing, the .pbip last (0.3.0 R4: written in place, each folder by its own mkdir);
  // anything at a name refuses the whole write, a link whose target is missing included)
  // 0.3.0 step 2, "Check before write" (the owner's go, 18 Oct): the shared check on the project in memory, before it is
  // written (the measured rules and the layout check; structure only, never data). It reports; it never writes or approves
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
