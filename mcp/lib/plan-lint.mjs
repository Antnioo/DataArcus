// LAYER checks (0.2.9 item 11): the design lint of the page plan_layout plans, before the plan is shown. The page is
// built by the shared report writer (assets/js/pbip-export.js) in memory, as create_report would write it for the
// same design and fields, then read by the reading layer (lib/read-report.mjs) from memory and linted with the model
// (lib/design-lint.mjs). Nothing is written. Each layer is used as a black box: when the writer changes (the report
// writer's own fixes for O-3, O-4, O-6, O-13, O-14), the lint of the plan follows without a change here.
// What is not the same as create_report's report: number formats, Arabic display names, SVG measures and page filters
// are left out (no lint rule reads them); the first page is the one linted (the page the plan shows).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js'), Pbip = require('../../assets/js/pbip-export.js'), Agg = require('../../assets/js/aggregation.js');
import { modelOf } from './model.mjs';
import { E, absorb } from './design.mjs';   // (A2-3: the slot rules are the design engine's)
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
  // the binding: the picker's, with every field the plan names pinned (create_report's options, without page filters;
  // A3-2: the picker keeps them, so nothing is rebuilt here)
  const n = Math.max(1, ...E.projectPages(design.layout, lang, { second: false }).map((p) => p.slots.filter((s) => s.kind === 'kpi').length));
  const pinned = F ? Object.fromEntries([['kpis', F.kpis], ['main', F.measure], ['date', F.timeAxis], ['catA', F.category], ['catB', F.category2], ['slicers', F.slicers], ['table', F.table]].filter(([, v]) => v)) : null;
  const bind = Bind.suggest(pickFrom, n, Object.assign(relsOf(m, lang), F && F.measure ? { main: F.measure } : {}, pinned ? { pinned } : {}));
  if (!(bind.kpis || []).filter(Boolean).length) return { skipped: 'the model has no measure a card or a chart can show, so the planned page was not linted (create_report counts its columns instead)' };
  if (F) delete bind.catPool;   // (as create_report's binding with the plan's fields)
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
  // (rc.22, B-140) the kinds the writer gave the plan's slots, where they differ (a column chart whose category names
  // can't stand level is a bar chart; a two-valued category a donut): kept off the answer (not enumerable), the plan
  // shows them on its slots
  // (B-146) the aggregation guard on the same page: which values are not additive, which snapshots are summed over time
  // (assets/js/aggregation.js; metadata only); kept off the answer like the kinds, plan_layout says it in its own words
  const mt = modelOf(m.tmsl).tables || [];
  const measures = mt.flatMap((t) => (t.measures || []).map((x) => ({ table: t.name, name: x.name, expression: x.expression, formatString: x.formatString })));
  const aggregation = Agg.guard(inv.pages[0] || { visuals: [] }, { measures, tables: mt });
  // (0.2.9.1, B-174) and the category charts the writer kept to their top N, by their planned slot (from, nth, as kinds),
  // with the most categories each still shows all of (allUpTo): the plan says what is written, not the slot's N alone
  return Object.defineProperties(Object.assign({ page: inv.pages[0] ? inv.pages[0].name : null }, out), {
    kinds: { value: (r.kindChanges || []).filter((k) => k.pageIndex === 0).map(({ nth, from, to, topN }) => ({ nth, from, to, topN })), enumerable: false },
    tops: { value: (r.topCharts || []).filter((t) => t.pageIndex === 0).map(({ from, nth, top, allUpTo }) => ({ from, nth, top, allUpTo })), enumerable: false },
    aggregation: { value: aggregation, enumerable: false } });
}

// (B-146) plan_layout's `aggregation`, in the plan's language: what is not additive and where, and one question per
// snapshot summed over time. Never a piece of the DAX (PRIVACY.md section 3): what a value is, in words.
export function aggregationAnswer(g, lang) {
  const ar = lang === 'ar', out = {}, list = (xs) => xs.map((x) => `"${x.name}"`).join(ar ? ' و' : ', ');
  if (g.nonAdditive.length) {
    const na = g.nonAdditive, inTable = na.filter((x) => x.in.some((w) => w === 'table' || w === 'matrix'));
    out.nonAdditive = na.map((x) => ({ field: x.field, is: ar ? Agg.whyAr(x.why) : x.why, in: x.in, confidence: x.confidence }));
    const en = `${list(na)} ${na.length > 1 ? 'are' : 'is'} not additive (${[...new Set(na.map((x) => x.why))].join(', ')}): the report never stacks or sums ${na.length > 1 ? 'them' : 'it'}; each card and chart shows the measure as the model calculates it.`
      + (inTable.length ? ` A table's total row is Power BI's own total, which recalculates ${list(inTable)} for all the rows: it is not the sum of the rows.` : '');
    const arText = `${list(na)} ${na.length > 1 ? 'قيم لا تُجمع' : 'قيمة لا تُجمع'} (${[...new Set(na.map((x) => Agg.whyAr(x.why)))].join('، ')}): لا يكدّسها التقرير ولا يجمعها، وتعرض كل بطاقة وكل مخطط القيمة كما يحسبها النموذج.`
      + (inTable.length ? ` وسطر الإجمالي في الجدول هو إجمالي Power BI نفسه، يعيد حساب ${list(inTable)} لكل الصفوف، وليس مجموع الصفوف.` : '');
    out.text = ar ? arText : en;
    out.sayInPlan = 'Say this sentence in the plan (text), in the plan\'s language: ' + en;
  }
  if (g.questions.length) {
    out.pleaseConfirm = g.questions.map((q) => ({ field: q.field, in: q.in, question: ar ? q.ar : q.en,
      why: ar ? 'اسمها يدل على رصيد في لحظة (رصيد، عدد موظفين، مخزون، إجمالي حتى تاريخه)، ولا شيء في صيغتها يأخذ نهاية الفترة، فيجمعها Power BI عبر التواريخ على محور الزمن وفي البطاقة.'
        : 'Its name reads as a snapshot (a balance, a headcount, an inventory, a to-date total) and nothing in its DAX takes the period end, so on a time axis and on a card Power BI adds it up over the dates.' }));
    out.askFirst = 'Ask the user each pleaseConfirm question before the plan is approved, as a question, not a finding. The report is written as planned either way: when the answer is yes, the measure needs period-end logic in the model (for example CLOSINGBALANCEMONTH, or CALCULATE with LASTDATE), which DataArcus does not write or change.';
  }
  return out;
}
