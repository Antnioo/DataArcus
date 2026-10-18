// LAYER checks (0.2.9 item 11): the design lint of the page plan_layout plans, before the plan is shown. The page is
// built by the shared report writer (assets/js/pbip-export.js) in memory, as create_report would write it for the
// same design and fields, then read by the reading layer (lib/read-report.mjs) from memory and linted with the model
// (lib/design-lint.mjs). Nothing is written. Each layer is used as a black box: when the writer changes (the report
// writer's own fixes for O-3, O-4, O-6, O-13, O-14), the lint of the plan follows without a change here.
// What is not the same as create_report's report: number formats, Arabic display names, SVG measures and page filters
// are left out (no lint rule reads them); the first page is the one linted (the page the plan shows).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js'), Pbip = require('../../assets/js/pbip-export.js');
import { E, absorb } from './design.mjs';   // (A2-3: the slot rules are the design engine's)
import { inventory, memorySource } from './read-report.mjs';
import { lint } from './design-lint.mjs';
import { takenNames } from './report-names.mjs';
const Preview = require('../../assets/js/page-preview.js');

const relsOf = (m, lang) => ({ ...(lang ? { lang } : {}), modelTables: m.tables, relationships: Bind.relsOfTmsl(m.tmsl) });
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==', 'base64');

// The writer's report of the plan, in memory (nothing is written): the pages create_report writes for the design and the
// plan's fields. o.second: the second page with its page buttons (the lint builds the first page alone, as before);
// o.title: the report's title in its header (the lint's page keeps "Plan"); o.names: the plan's display names.
// Returns { r (the writer's answer), pages } or { skipped: why }.
function build(a, o) {
  const { m, design: d0, lang, F } = a, pickFrom = a.tables || m.tables;
  // (the two settings create_report itself forces on a design: solid visuals when there is no background image, and the
  // wider table share unless the design says otherwise; the page is built as create_report will write it, nothing tuned)
  let design = Object.assign({}, d0, { layout: Object.assign({}, d0.layout, { transparent: false, wideTable: d0.layout.wideTable !== false }) });
  if (F && F.kpis) design.layout = Object.assign({}, design.layout, { kpis: Math.min(6, F.kpis.length) });   // (the design block's A2-4: kpis is the card count, 0-6)
  const specs = E.projectPages(design.layout, lang, { second: !!o.second, panel: !!o.panel });
  // the binding: the picker's, with every field the plan names pinned (create_report's options, without page filters;
  // A3-2: the picker keeps them, so nothing is rebuilt here)
  const n = Math.max(1, ...specs.map((p) => p.slots.filter((s) => s.kind === 'kpi').length));
  const pinned = F ? Object.fromEntries([['kpis', F.kpis], ['main', F.measure], ['date', F.timeAxis], ['catA', F.category], ['catB', F.category2], ['slicers', F.slicers], ['table', F.table]].filter(([, v]) => v)) : null;
  let bind = Bind.suggest(pickFrom, n, Object.assign(relsOf(m, lang), F && F.measure ? { main: F.measure } : {}, pinned ? { pinned } : {}));
  if (!(bind.kpis || []).filter(Boolean).length) return { skipped: 'the model has no measure a card or a chart can show', design, specs };
  if (F) delete bind.catPool;   // (as create_report's binding with the plan's fields)
  // (o.names: the plan's display names on the bound fields, as create_report puts them; the lint's page reads none)
  const names = new Map(Object.entries(o.names || {}).map(([k, v]) => { const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? [Bind.fieldKey(mk[1], mk[2]), String(v)] : null; }).filter(Boolean));
  if (names.size) bind = Bind.mapFields(bind, (f) => { const k = Bind.fieldKey(f.t, f.c != null ? f.c : f.m); return names.has(k) ? Object.assign({}, f, { name: names.get(k) }) : f; });
  // a text slot without a text is left out by create_report and its room given to the visual beside it
  const pages = (o.second ? specs : specs.slice(0, 1)).map((p) => {
    let slots = p.slots; p.slots.filter((s) => s.kind === 'text' && !s.text).forEach((t) => { slots = absorb(slots.filter((s) => s !== t), t); });
    return { name: p.name, page: p.page, slots, png: PNG1, panel: p.panel, grow: true };
  });
  const r = Pbip.build({ name: 'Plan', title: o.title || 'Plan', pageName: pages[0].name, lang, rtl: E.rtl(design.layout, lang), font: design.font, sample: false,
    theme: E.buildTheme(design, lang), ui: design.ui, model: { byPath: 'Model.SemanticModel', taken: takenNames(m.projectDir), names: {} }, bind,
    logoPlaceholder: false, texts: E.REPORT_TEXTS[lang === 'ar' ? 'ar' : 'en'], pages });
  return { r, pages, design };
}
const inReport = (r) => r.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }));

// a: { m (the model, from loadModel), tables (the part of the model to pick from), design (plan_layout's), lang,
//      F (the plan's fields, resolved: create_report's shapes) }
// Returns lint()'s answer for the first page, with the page's name, or { skipped: why } when nothing can be built.
export function planLint(a) {
  const b = build(a, { second: false });
  if (b.skipped) return { skipped: b.skipped + ', so the planned page was not linted (create_report counts its columns instead)' };
  // (the writer's paths start with its .Report folder; the reading block takes paths inside the report: A5-12)
  const inv = inventory(memorySource(inReport(b.r)), 'the planned report');
  const out = lint(inv, a.m.tables, null, { pages: [1] });
  return Object.assign({ page: inv.pages[0] ? inv.pages[0].name : null }, out);
}

// 0.3.0 step 1, "Preview before Approve" (the owner's go, 18 Oct): the pages of the plan as the shared renderer draws
// them (assets/js/page-preview.js), read from the writer's own files, with the layout check's flags of each page (the
// design lint above: overlap, off the page, labels or columns that may be cut) on the visuals they name. From the plan
// only: types, positions, sizes, titles, field names, theme colours; never a value. a: planLint's, and second (the
// second page, as create_report writes it), panel (the slide-in filter panel), title (the report's title), displayNames
// (the plan's: the names the report shows).
// Returns { pages: [page] } (page: the renderer's, with flags), from the design engine's slots when the writer can't
// build the report (a model with no measure: create_report counts its columns then).
const FLAG_OF = { OVERLAP: 'overlap', OFF_PAGE: 'cut', BAR_LABELS_MAY_BE_CUT: 'cut', TABLE_GROW_TO_FIT: 'cut', TABLE_WIDTHS_TOO_WIDE: 'cut' };
export function planPreview(a) {
  const lang = a.lang === 'ar' ? 'ar' : 'en', b = build(a, { second: a.second !== false, panel: !!a.panel, title: a.title, names: a.displayNames }), design = b.design, rtl = E.rtl(design.layout, lang);
  const ui = design.ui || {}, colors = { background: ui.background, card: ui.card, ink: ui.text, accent: ui.accent };
  if (b.skipped) return { pages: (a.second !== false ? b.specs : b.specs.slice(0, 1)).map((p) => {
    let slots = p.slots; p.slots.filter((s) => s.kind === 'text' && !s.text).forEach((t) => { slots = absorb(slots.filter((s) => s !== t), t); });
    return Preview.fromSlots(slots, p.page, { name: p.name, rtl, colors }); }), from: 'slots' };
  const files = inReport(b.r), pages = Preview.fromFiles(files, { rtl, colors });
  const inv = inventory(memorySource(files), 'the planned report'), shown = inv.pages.filter((p) => p.kind !== 'Tooltip' && !p.hidden);
  pages.forEach((p, k) => {
    const ip = shown[k]; if (!ip) return;
    const found = lint(inv, a.m.tables, null, { pages: [ip.n] }).findings.filter((f) => FLAG_OF[f.rule]), flags = [];
    // (a finding names its visuals by place and size: "at x,y wxh", rounded)
    found.forEach((f) => [...String(f.visual || '').concat(' ', f.why || '').matchAll(/ at (-?\d+),(-?\d+) (\d+)x(\d+)/g)].forEach((mm) => {
      const i = p.visuals.findIndex((v) => Math.round(v.x) === +mm[1] && Math.round(v.y) === +mm[2] && Math.round(v.w) === +mm[3] && Math.round(v.h) === +mm[4] && !v.panel);
      if (i >= 0 && !flags.some((g) => g.i === i && g.kind === FLAG_OF[f.rule])) flags.push({ i, kind: FLAG_OF[f.rule], rule: f.rule });
    }));
    p.flags = flags;
  });
  return { pages, from: 'writer' };
}
