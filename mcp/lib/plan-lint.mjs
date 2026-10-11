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
import { E } from './design.mjs';
import { absorb } from './slots.mjs';
import { inventory, memorySource } from './read-report.mjs';
import { lint } from './design-lint.mjs';
import { takenNames } from './report-names.mjs';

const relsOf = (m, lang) => ({ ...(lang ? { lang } : {}), modelTables: m.tables, relationships: Bind.relsOfTmsl(m.tmsl) });
const PNG1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==', 'base64');

// a: { m (the model, from loadModel), tables (the part of the model to pick from), design (plan_layout's), lang,
//      F (the plan's fields, resolved: create_report's shapes) }
// Returns lint()'s answer for the first page, with the page's name, or { skipped: why } when nothing can be built.
export function planLint(a) {
  const { m, design: d0, lang, F } = a, pickFrom = a.tables || m.tables;
  // (the two settings create_report itself forces on a design: solid visuals when there is no background image, and the
  // wider table share unless the design says otherwise; the page is built as create_report will write it, nothing tuned)
  let design = Object.assign({}, d0, { layout: Object.assign({}, d0.layout, { transparent: false, wideTable: d0.layout.wideTable !== false }) });
  if (F && F.kpis) design.layout = Object.assign({}, design.layout, { kpis: Math.min(6, F.kpis.length) });   // (the design block's A2-4: kpis is the card count, 0-6)
  // the binding: the picker's, with every field the plan names in its place (create_report's bindFor, without page filters)
  const n = Math.max(1, ...E.projectPages(design.layout, lang, { second: false }).map((p) => p.slots.filter((s) => s.kind === 'kpi').length));
  const b = Bind.suggest(pickFrom, n, Object.assign(relsOf(m, lang), F && F.measure ? { main: F.measure } : {}));
  if (!(b.kpis || []).filter(Boolean).length && !(F && F.kpis && F.kpis.length)) return { skipped: 'the model has no measure a card or a chart can show, so the planned page was not linted (create_report counts its columns instead)' };
  let bind = b;
  if (F) {
    const ch = Object.assign({}, b.choices);
    if (F.kpis) ch.kpis = F.kpis;
    if (F.measure) ch.main = F.measure;
    if (F.timeAxis) ch.date = F.timeAxis;
    if (F.category) ch.catA = F.category;
    if (F.category2) ch.catB = F.category2;
    if (F.slicers) { const same = (x, y) => x && y && x.t === y.t && x.c === y.c; ch.slicers = F.slicers.concat((ch.slicers || []).filter((s) => s && !F.slicers.some((g) => same(g, s)))).slice(0, 3); while (ch.slicers.length < 3) ch.slicers.push(null); }
    bind = Bind.build(ch);
    if (F.table) bind.table = F.table.map((x) => (x.m != null ? { t: x.t, m: x.m } : Object.assign(/^(int64|double|decimal|number)$/.test(x.type || '') ? { t: x.t, c: x.c, num: true } : { t: x.t, c: x.c }, x.sortBy ? { sortBy: x.sortBy } : {}, x.ordered ? { ordered: true } : {})));
  }
  // a text slot without a text is left out by create_report and its room given to the visual beside it
  const pages = E.projectPages(design.layout, lang, { second: false }).slice(0, 1).map((p) => {
    let slots = p.slots; p.slots.filter((s) => s.kind === 'text' && !s.text).forEach((t) => { slots = absorb(slots.filter((s) => s !== t), t); });
    return { name: p.name, page: p.page, slots, png: PNG1, panel: p.panel, grow: true };
  });
  const r = Pbip.build({ name: 'Plan', title: 'Plan', pageName: pages[0].name, lang, rtl: E.rtl(design.layout, lang), font: design.font, sample: false,
    theme: E.buildTheme(design, lang), ui: design.ui, model: { byPath: 'Model.SemanticModel', taken: takenNames(m.projectDir), names: {} }, bind,
    logoPlaceholder: false, texts: E.REPORT_TEXTS[lang === 'ar' ? 'ar' : 'en'], pages });
  // (the writer's paths start with its .Report folder; the reading block takes paths inside the report: A5-12)
  const inv = inventory(memorySource(r.files.filter((f) => /^[^/]+\.Report\//.test(f.path)).map((f) => ({ path: f.path.replace(/^[^/]+\.Report\//, ''), data: f.data }))), 'the planned report');
  const out = lint(inv, m.tables, null, { pages: [1] });
  return Object.assign({ page: inv.pages[0] ? inv.pages[0].name : null }, out);
}
