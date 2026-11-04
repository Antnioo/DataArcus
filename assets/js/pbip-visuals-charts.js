/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's charts (0.3.2 SP28, from pbip-page.js through pbip-visuals.js; what they write unchanged): each step
// takes the slot builder's read-only input x (pbip-visuals.js visual: { theme, look, metrics, binding, slot, plan,
// kpiIndex, page, direction, known, measures }) and the step's own state, and returns its result; notes and counts go
// to the builder's sink ({ out, note, count }). Nothing is kept between calls; no visual is named, no file written.
//   topCount(c, s, pg, f), knownCount(f, o), catOf(Bt, query), BAND_TYPES, BAR_TYPES   the charts' counts and kinds
//   slotKind({ look: { LABEL }, theme: { font, base }, binding: { B, own }, page: { pg }, slot }) -> { slot, notes }
//   categoryPlan({ binding: { B }, slots }) -> Map(slot -> category)
//   prepare(x, { Bt }, sink) -> Bt;  hover(kind, B, Bt) -> { m, cat } | null
//   format(x, { visual, query, Bt, ttl }, sink) -> toMirror;  fix(x, { visual, Bt }, sink) -> filters;  mirror(x, { visual }, sink)
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Q = (node ? require('./pbip-query.js') : root.DAPbipQuery), Z = (node ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const {
    CAT_KINDS, CHARTS, catKind, color, gradientFill, isTextField, isTime, label, lineStyle, lit, mirrorChart, mixHex, namesOf, bool, num, obj, str, timeAxisPlan
  } = Q;
  const { barBand, barNameShare, barSpan, textWidth } = Z;
  // the visual gallery (0.3, J8; visual-gallery.js): optional in the browser. A gallery slot reaches here only when the
  // design's flag is on and its fields fit (pbip-export.js resolves the others to their plain kind first)
  const G = (node ? require('./visual-gallery.js') : root.DAGallery || null);
  const isGallery = (kind) => !!(G && G.isKind(kind));
  // (0.3, J11: B-140 option B) a column chart's labels by the measured limits (label-limits.js): optional in the browser;
  // without it, and outside the measured table, the writer's own rule below
  const LL = (node ? require('./label-limits.js') : root.DALabelLimits || null);

  // 0.2.9 rc1 (the laptop's PERF-COMPARE S5, D15, D19 and Task 1: a column chart of products or cities drew dozens of
  // vertical labels, cut, with a scrollbar; on a page narrowed by the filter rail the department labels were slanted and
  // cut): a bar or column chart by a text category (not a time category, nor one whose values the writer knows: days,
  // months, quarters) shows its top N by its measure, N the categories its slot holds, said in its title. A bar chart: its
  // rows, 22.2 a row with 45 above, 8 under and 38 for the value axis (measured at 10pt, 1280 x 720, scaled with the page);
  // a column chart: a column for a 12-character label at the label size (a GUESS, to be measured), so the names stay level
  // (integration round 7: on a designed page N is the design engine's, s.topN from its categoryFit, the design block's
  // S5; the writer's rc1 conditions stay: the sample's categories are never cut, nor a time or known category)
  // (c: { own, LABEL, font })
  const topCount = (c, s, pg, f) => {
    if (!c.own || !f || !isTextField(f) || isTime(f) || catKind(f) || f.sortBy || f.ordered || f.dateOf || (s.kind !== 'bar' && s.kind !== 'column')) return 0;
    if (s.topN) return s.topN;   // a designed page: the design engine's N
    // a hand-placed page (no design computed one): the writer's measured count. A bar chart: its rows, 22.2 a row with 45
    // above, 8 under and 38 for the value axis (measured at 10pt, 1280 x 720, scaled with the page); a column chart: a
    // column for a 12-character label at the label size (a GUESS, to be measured)
    if (s.kind === 'bar') return Math.max(3, Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2));
    const plot = s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40, need = textWidth('n'.repeat(12), c.LABEL, false, c.font) + 6;
    return Math.max(3, Math.floor(plot / need));
  };
  // the category field a chart's query shows (after the page's own choice of categories)
  // 0.3.1 FX5: the bar and column kinds the writer writes with a category axis (Microsoft's catalog gives each
  // categoryAxis innerPadding and outerPadding), the horizontal ones, and the count of categories a field is known to have
  // from the model's metadata alone (a day, month or quarter axis; two values; a few known texts; a calendar's rows)
  const BAND_TYPES = /^(clusteredBarChart|barChart|hundredPercentStackedBarChart|clusteredColumnChart|columnChart|hundredPercentStackedColumnChart|lineClusteredColumnComboChart|lineStackedColumnComboChart)$/;
  const BAR_TYPES = /^(clusteredBarChart|barChart|hundredPercentStackedBarChart)$/;
  // (0.3.1 FX5b) and the model's own count where the caller has it: o.model.counts(t, c), create_report's columnStats
  // (Cardinality read in Desktop, counts only) or the sample project's own made-up rows; the fewest of what is known
  const knownCount = (f, o) => { if (!f) return 0; const k = isTextField(f) && catKind(f), m = (o && o.model) || {};
    const given = typeof m.counts === 'function' && f.c != null ? +m.counts(f.t, f.c) : 0;
    const ns = [(k && k.rows) || (f.two ? 2 : 0) || (f.cal && +f.cal.rows) || +f.few || 0, given].filter((x) => x > 0);
    return ns.length ? Math.min(...ns) : 0; };
  const catOf = (Bt, query) => { const p = ((query.queryState.Category || {}).projections || [])[0], col = p && p.field.Column;
    return col ? Object.values(Bt.cats || {}).find((x) => x && x.t === col.Expression.SourceRef.Entity && x.c === col.Property) || null : null; };

  // The kind a slot is written as: a column chart by names its columns can't hold is a bar chart (asBar), a chart by a
  // two-valued category a donut, a column chart by many names a bar chart (byField). -> { slot, notes }
  function slotKind(x) {
    const { look: { LABEL }, theme: { font, base }, binding: { B, own }, page: { pg }, slot } = x, notes = [], note = (key, e) => notes.push([key, e]);
    // Round 19 (seen in Desktop, golden tasks 1 and 4:3: day names slant on the column charts of models without a short
    // day column): a column chart by day or month names whose widest name, at the label size, is wider than its share
    // of the plot (as S3 works it out) is written as a bar chart, whose names are level, where the slot holds one bar
    // per name (22 each + 46, measured in round 0 at 1280 x 720, scaled with the page). A model's "Day Short"
    // (round 18) is used first, so such a chart stays a column chart.
    // (0.2.9, A3-7: the names are measured in their own family, NAMES and namesOf: an Arabic month name by the Arabic
    // names, a Hijri one by the Hijri names; a category the picker gives a kind is taken by that kind)
    const asBar = (s) => {
      const f = B && s.kind === 'column' && (B.cats || {}).column;
      if (!f || f.short || f.c == null) return s;
      const kind = f.kind ? (['day', 'month'].includes(String(f.kind)) ? String(f.kind) : null) : /(^|\s)(day|weekday)\s*name|اسم اليوم/i.test(f.c) ? 'day' : /(^|\s)month\s*name|اسم الشهر/i.test(f.c) ? 'month' : null;
      const list = kind && namesOf(f, kind);
      // writer round 9 (RESCORE-2 D15: bank's "Debtconsolidation" slanted and cut, 6 columns on a designed page): a text
      // category whose names the writer can't measure (no values read) takes the writer's stand-in for a name, 12 letters at
      // the label size, as its tables do; where its columns (the design's N, else as many as hold that name) can't each
      // hold it, it is written as a bar chart, names level (the share of barNameShare), where the slot holds 3 rows (22.2 a
      // row + 45 + 8 + 38, measured); in a slot too low for that it keeps its columns, as many as hold the name
      // (0.3, J11) first the limits measured in Desktop 2.159 (label-limits.js: names that may wrap to 2 lines, never cut
      // or slanted); a kept column chart or a bar chart says why (kindWhy, in the plan); outside the measured table the
      // writer's rule as before
      const limits = (o) => (LL ? LL.decide(Object.assign({ width: s.w, pageWidth: pg.page.w, labelPt: LABEL }, o)) : { kind: null });
      // (0.3.1 R4A) the person's words beside the measured why (kindSaid, kindSaidAr: no pixels or letter widths)
      const barSaid = (d, n, noun, nounAr) => (d.kind ? { kindSaid: d.said, kindSaidAr: d.saidAr } : { kindSaid: `A bar chart, not columns: ${n} ${noun} would be cut or slanted under columns.`, kindSaidAr: `مخطط شريطي أفقي لا أعمدة: أسماء ${nounAr} (${n}) ستُقص أو تميل تحت الأعمدة.` });
      if (!list) {
        if (!own || !isTextField(f) || isTime(f) || catKind(f) || f.sortBy || f.ordered || f.dateOf) return s;
        const plot = s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40, need = textWidth('n'.repeat(12), LABEL, false, font) + 6, fit = Math.max(3, Math.floor(plot / need));
        const n = s.topN || fit, d = limits({ count: n, lang: null });
        if (d.kind === 'column' || (!d.kind && plot / n >= need)) return s;
        const rows = Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2);
        if (rows < 3) return Object.assign({}, s, { topN: fit });
        note('barCharts', { page: pg.name || base, field: label(f) });
        return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows, topN: rows, kindWhy: d.kind ? d.why : `bar: ${n} categories at ${Math.round(s.w * 1920 / pg.page.w)} px, a 12-letter name wider than a column (outside the measured limits: the writer's own widths)` }, barSaid(d, n, 'names', 'الفئات'));
      }
      const k = pg.page.h / 720, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / list.length, widest = Math.max(...list.map((d) => textWidth(d, LABEL, false, font)));
      // (a month column the model names short, "Month Short", shows Jan to Dec; Arabic and Hijri names have no short form)
      const names = kind === 'month' && LL && list[0] === 'January' && /short|abbr|mmm/i.test(String(f.c)) ? LL.NAMES.monthShort.en : list;
      const d = limits({ names, count: names.length, noun: kind === 'day' ? 'weekdays' : 'months' });
      // (night sitting 6-7 Oct, measured in Desktop 2.158 on a 221-high slot at 1280 x 720, names at the theme's 10pt: a
      // row is 22.2, the first starts 45 under the box's top and 8 stay under the last; the value axis and its room
      // take 38 more, and with it Saturday went behind a scrollbar. So: 23 a row + 54, and where the axis's 38 do not
      // fit as well the chart is written without its value axis, each bar's value beside it (rows, below).)
      if (d.kind === 'column' || (!d.kind && widest + 6 <= room) || s.h < (list.length * 23 + 54) * k) return s;
      note('barCharts', { page: pg.name || base, field: label(f) });
      return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows: list.length, kindWhy: d.kind ? d.why : `bar: ${list.length} ${kind === 'day' ? 'weekdays' : 'months'} at ${Math.round(s.w * 1920 / pg.page.w)} px, the widest name wider than a column (outside the measured limits: the writer's own widths)` }, barSaid(d, list.length, kind === 'day' ? 'weekdays' : 'months', kind === 'day' ? 'الأيام' : 'الأشهر'));
    };
    // (design round 9, the re-score's D11: two bars across a wide slot on four reports) a bar or column chart by a
    // category the picker marks two-valued (true/false, an IF of two words) is a donut: two shares read at a glance.
    // (D19: product names cut on a column chart, 6 of 8) a column chart by a many-valued category (a lookup table's name,
    // a city) is a bar chart, its names level; its rows are the bar rows its slot holds (the measured 22.2 a row).
    // A slot keeps the kind it was planned as (was): its category and its title are that kind's.
    const byField = (s) => {
      const f = B && (s.kind === 'bar' || s.kind === 'column') && (B.cats || {})[s.kind];
      if (!f || f.c == null) return s;
      if (f.two) return Object.assign({}, s, { kind: 'donut', was: s.kind, topN: null, kindWhy: 'donut: a category with two values', kindSaid: 'A donut chart: the category has two values.', kindSaidAr: 'مخطط حلقي: للفئة قيمتان.' });
      if (s.kind === 'column' && f.wide && !s.wasColumn) { const rows = Math.max(1, Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2));
        note('barCharts', { page: pg.name || base, field: label(f) }); return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows, topN: s.topN ? rows : s.topN, kindWhy: 'bar: a category with many values (a lookup table\'s names), names level', kindSaid: 'A bar chart, not columns: a category with many names reads with its names level.', kindSaidAr: 'مخطط شريطي أفقي لا أعمدة: فئة بأسماء كثيرة تُقرأ وأسماؤها مستقيمة.' }); }
      return s;
    };
    return { slot: byField(asBar(slot)), notes };
  }

  // Round 16 (design finding #18) and round 18: each chart of a page by a category not used on the page yet, from the
  // picker's pool (B.catPool), given out once for the page: the bar charts and the donut first in reading order, then the
  // column chart and the map; a chart repeats a category only when the pool has no unused one (see visual)
  function categoryPlan(x) {
    const { binding: { B }, slots: sorted } = x, catPlan = new Map(), pageCats = new Set();
    if (!B) return catPlan;
    const kindOf = (s) => s.was || (s.wasColumn ? 'column' : s.kind), k0 = (f) => f.t + '\u0001' + f.c;
    const last = (x) => kindOf(x) === 'column' || x.kind === 'map', all = sorted.filter((x) => CAT_KINDS.includes(x.kind) && (B.cats || {})[kindOf(x)]);
    all.filter((x) => !last(x)).concat(all.filter(last)).forEach((x) => { let c = B.cats[kindOf(x)]; if (pageCats.has(k0(c))) { const alt = (B.catPool || []).find((f) => !pageCats.has(k0(f))); if (alt) c = alt; } pageCats.add(k0(c)); catPlan.set(x, c); });
    return catPlan;
  }

  // A chart's binding (Bt): its category given out once for the page (planned), a column chart written as a bar chart
  // keeping its own measure, Day Short where the day names don't fit, a combo's panel with its own measure and axis
  function prepare(x, st, sink) {
    const { theme: { font, base }, look: { LABEL }, binding: { B, planned }, slot: s, page: { pg } } = x, { note } = sink;
    let Bt = st.Bt;
    // Round 16 (design finding #18): each chart of a page by a category not used on the page yet, from the picker's
    // pool (B.catPool), where the model has more than one; the same category only when it has no other
    // Round 18 (seen in Desktop, 6 Oct 2026: on a model with three text columns the operations layout's two bar
    // charts were both by the first one, because the column chart, earlier in the reading order, had taken the
    // third): the page's categories are given out once, the bar charts and the donut first in reading order,
    // then the column chart and the map; a chart repeats a category only when the pool has no unused one.
    // (night sitting 6-7 Oct, seen in Desktop: a column chart written as a bar chart, round 19, took the bar chart's
    // category: the page showed the same chart twice. It keeps the column chart's own: kindOf.)
    const kindOf = (x) => x.was || (x.wasColumn ? 'column' : x.kind);
    if (B && CAT_KINDS.includes(s.kind) && (B.cats || {})[kindOf(s)]) {
      const c = planned; if (c && c !== B.cats[s.kind]) Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { [s.kind]: c }) });
    }
    // (writer round 9: a column chart written as a bar chart keeps the column chart's own measure, as it keeps its
    // category and title; it took the bar chart's, so a page could show one measure twice)
    if (B && s.wasColumn) Bt = Object.assign({}, Bt, { y: Object.assign({}, Bt.y, { bar: (Bt.y || {}).column }) });
    // Round 18, S3 (the owner's yes, 6 Oct 2026; seen in Desktop: the day names slant on the 1920 x 1080 column
    // charts): a column chart by Day Name takes the calendar's Day Short where the model has it (c.short) and the
    // full names, at the label size, are wider than a seventh of the chart's plot (the value axis about 40)
    if (B && s.kind === 'column' && ((Bt.cats || {}).column || {}).short) {
      const c0 = Bt.cats.column, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / 7;
      const widest = Math.max(...namesOf(c0, 'day').map((d) => textWidth(d, LABEL, false, font)));   // (A3-7: the day names of its own family)
      if (widest + 6 > room) { Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { column: Object.assign({}, c0.short, { name: label(c0) }) }) }); note('shortDays', { page: pg.name || base }); }
    }
    // (0.3.0 D2) a combo in two units is two panels: each line chart carries its own measure and axis (visual-gallery.js split)
    if (B && s.bind) Bt = Object.assign({}, Bt, s.bind.measure ? { measure: s.bind.measure } : {}, s.bind.date ? { date: s.bind.date } : {});
    return Bt;
  }
  // a chart's own measure and category, for its tooltip page (the second sweep's T4 and T5)
  const hover = (k, B, Bt) => (B && CHARTS.includes(k) ? { m: k === 'line' ? Bt.measure : k === 'funnel' && Bt.y && 'funnel' in Bt.y ? Bt.y.funnel : (Bt.y || {})[k] || Bt.measure, cat: k === 'line' ? Bt.date : (Bt.cats || {})[k] } : null);

  // A chart's own formatting, once its query and title are written: the bars' fade and colour, a quarter's labels, the
  // line's style, the gallery's objects and a right-to-left waterfall, a panel's unit, the donut's ring, the gridlines,
  // a bar chart without its value axis. -> whether a mirrored report turns it (toMirror)
  function format(x, st, sink) {
    const { theme: { o, u, base, lang, GRAD, GRAD2, GRID }, slot: s, page: { pg }, direction: { MIRROR }, known: { colourKeys }, measures: { extMeasure } } = x, { visual, query, Bt, ttl } = st, { note, count, out } = sink;
    // (P3, N27) a bar or column chart's colour index, keyed to its category field (else its measure) across the report:
    // the report's keys read here, the new key returned (colourKey) for the assembly to keep
    const colourOf = (query) => { const qs = query.queryState, p = ((qs.Category || qs.Y || {}).projections || [])[0], k = JSON.stringify(p ? p.field : null), K = colourKeys;
      out.colourKey = k; return k in K ? K[k] : Object.keys(K).length % 2; };
    // bars that fade by value (gradientFill above): the report's own bar and column charts, never the tooltip pages';
    // the second of a page fades from a chosen second colour (polish round P1, B-71: colour 2 was never used; P1+: secondColour);
    // P3 (RESCORE-6 N27: the same chart swapped colours between pages 1 and 2): a chart's colour is keyed to its category
    // field, report-wide (chartColors.keys): the first field met takes colour 1, the next colour 2, and so on in turn
    if (GRAD && query && (s.kind === 'bar' || s.kind === 'column')) { const g2 = colourOf(query) && GRAD2; visual.objects = { dataPoint: gradientFill(query.queryState.Y.projections[0].field, g2 || GRAD) }; count('chartColors.charts'); if (g2) count('chartColors.second'); }
    // Round 21 (the capabilities lab's #6, Desktop 2.158, 7 Oct 2026: "77.7K" above the columns, kept on Save): a column
    // chart with few columns shows its values above them: labels at 'OutsideEnd', automatic units (0, K or M by the
    // values' size, as the KPI cards) with one decimal (a percent measure keeps its own format). Only where the
    // number of columns is known from the model's names: a quarter (4); other columns could have any number.
    // (0.3.1 SQ1, 0.2.9-writer-S14: "8.0Kkg") a measure the cards show whole (wholeFormat: a unit, a count) keeps its own
    // format there, display units None and no decimal added, as on its card and its tooltip's bars (T10, tipLook)
    if (query && s.kind === 'column') { const cf = query.queryState.Category.projections[0], cn = String(cf.nativeQueryRef || cf.queryRef || '');
      // (round 22, the code review's f: "Year Quarter" and "Fiscal Year Quarter" end the same way and hold 8 to 40 values:
      // a name with a year in it is never taken for four columns)
      const four = (n) => /(^|\s|\.)quarter$|الربع/i.test(n) && !/year|سنة|السنة|عام/i.test(n);
      const cf0 = (Bt.cats || {}).column || {};   // (A3-7: the picker's kind and count first, where it gives them)
      if (cf0.kind ? String(cf0.kind) === 'quarter' && (catKind(cf0) || {}).rows === 4 : four(cn) || four(String(cf0.c || ''))) {
        const yf = ((Bt.y || {}).column || Bt.measure || {}), pct = !!yf.pct;
        visual.objects = visual.objects || {};
        const whole = !pct && !!yf.wholeFormat;
        visual.objects.labels = obj(Object.assign({ show: bool(true), labelPosition: str('OutsideEnd'), labelDisplayUnits: num(whole ? 1 : 0) }, pct || whole ? {} : { labelPrecision: lit('1L') }));
      } }
    // P2, the owner's polish (LAB-POLISH, measured in Desktop 2.158): a line chart's line 3 wide (1 px was the weakest mark
    // on every page); L1: smooth with a dot on each point unless the design's smoothLines is false (pbip-query.js lineStyle)
    const SMOOTH = o.smoothLines !== false;
    if (query && s.kind === 'line') { visual.objects = visual.objects || {}; visual.objects.lineStyles = [{ properties: lineStyle(SMOOTH) }]; }
    // P2: every donut's ring at 68 (65 to 70 looked right; 60 too heavy, 80 too thin)
    // (0.3, J8) a gallery visual's own formatting: the combo's secondary axis only when its units differ, its line 3
    // wide; the quiet gridlines and a right-to-left report's mirrored axes as the other charts (visual-gallery.js)
    // (D1, the owner's must-fix 2: R3's Descending waterfall was seen in Desktop 2.159 to reverse time, not the
    // direction: Power BI accumulates a waterfall left to right) a mirrored right-to-left report's waterfall is a
    // stacked column chart drawn as a waterfall from the report's own measures, read from the right
    // (visual-gallery.js rtlWaterfall); one the measures can't order stays a waterfall, left to right, and is told
    // (D7) o.waterfallRtl "native" (the default, G.WATERFALL_RTL_DEFAULT): Power BI's own waterfall, left to right, written
    // exactly as in English; "mirror": the stacked column chart above
    const WF_NATIVE = MIRROR && s.kind === 'waterfall' && G.waterfallRtlOf(o.waterfallRtl) === 'native';
    const wf = query && MIRROR && s.kind === 'waterfall' && !WF_NATIVE ? G.rtlWaterfall(query, { extMeasure, lang, grid: GRID, azText: !!G.fieldsOf('waterfall', Bt).cat && isTime(G.fieldsOf('waterfall', Bt).cat), formatString: (G.fieldsOf('waterfall', Bt).y || {}).tableFormat || null,
      // (the model's sort-by column and type, o.model.columns from the MCP; else the bound field's own type)
      sortByOf: (t, cn) => ((((o.model || {}).columns || {})[t] || {})[cn] || {}).sortBy || null,
      typeOf: (t, cn) => { const f = G.fieldsOf('waterfall', Bt).cat, m = ((((o.model || {}).columns || {})[t] || {})[cn] || {}).type; return m || (f && f.t === t && f.c === cn ? (f.num ? 'double' : f.type || null) : null); }, colours: { rise: G.fillOf(G.sentimentOf(o.theme, 'good', u)), fall: G.fillOf(G.sentimentOf(o.theme, 'bad', u)) } }) : null;   // (D7: the written theme's, as the English waterfall's)
    if (wf && wf.ok) { visual.visualType = wf.visualType; visual.query = wf.query; visual.objects = Object.assign(visual.objects || {}, wf.objects); count('chartAxes.charts');
      note('waterfallRtl', { page: pg.name || base, title: ttl || null, written: 'columnChart', what: G.WF_WHAT.columnChart, measures: wf.measures.map((x) => x.m) }); }
    else if (query && isGallery(s.kind)) { const go = G.objects(s.kind, Bt, { grid: GRID, smooth: SMOOTH, lang }); if (Object.keys(go).length) visual.objects = Object.assign(visual.objects || {}, go);
      if (WF_NATIVE) note('waterfallRtl', { page: pg.name || base, title: ttl || null, written: 'waterfallChart', what: G.WF_WHAT.native, native: true });
      else if (MIRROR && s.kind === 'waterfall') note('waterfallRtl', { page: pg.name || base, title: ttl || null, written: 'waterfallChart', what: G.WF_WHAT.waterfallChart, why: wf ? wf.why : null }); }
    // (0.3.1 M1) the charts a mirrored report turns: by the twin's rules (report-mirror.js), once the chart's own sort and
    // fixes are written (below, after fixVisual); a waterfall kept a waterfall gets its value axis at the right; Power
    // BI's own waterfall (WF_NATIVE) and the drawn one (wf.ok) are as written
    const toMirror = MIRROR && query && (['bar', 'column', 'line'].includes(s.kind) || (isGallery(s.kind) && !WF_NATIVE && !(wf && wf.ok)));
    // (0.3.0 J19) a panel split from a combo shows its unit as its value axis's title (AED, %; isolated in Arabic)
    if (query && s.unitLabel && s.kind === 'line') { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]);
      Object.assign(va[0].properties, { showAxisTitle: bool(true), titleText: str(lang === 'ar' ? s.unitLabel.ar : s.unitLabel.en) }); }
    if (query && s.kind === 'donut') { visual.objects = visual.objects || {}; visual.objects.slices = [{ properties: { innerRadiusRatio: lit('68L') } }]; }
    if (GRID && query && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line')) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.gridlineColor = color(GRID); }
    // (0.3.0 L2, the lab's "keep as option") o.grid 'dotted': the value axis's gridlines dotted, in the quiet grey (also
    // where the theme sets its own); 'none': no gridlines; 'solid' (the default) writes nothing more
    if (query && (o.grid === 'dotted' || o.grid === 'none') && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line' || isGallery(s.kind))) {
      visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]);
      if (o.grid === 'none') va[0].properties.gridlineShow = bool(false);
      else Object.assign(va[0].properties, { gridlineShow: bool(true), gridlineStyle: str('dotted'), gridlineColor: color(GRID || mixHex(u.text, u.card, 0.85)) });
      count('gridCharts.n'); }
    // a column chart written as a bar chart (asBar) in a slot too low for its rows and a value axis: no value axis,
    // each bar's value beside it (the tooltip pages' bar chart, measured in round 0). (0.2.9.1, from draft #69: only a bar:
    // a two-valued category makes it a donut after, which has no value axis; Microsoft's validator refused the object)
    if (s.wasColumn && s.kind === 'bar' && query && s.h < (s.rows * 23 + 92) * (pg.page.h / 720)) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.show = bool(false); visual.objects.labels = obj({ show: bool(true) }); }
    return toMirror;
  }
  // (0.3.1 M1) a mirrored report's chart, turned by the twin's rules (report-mirror.js), once its own sort and fixes are written
  const mirror = (x, st, sink) => { mirrorChart(st.visual, x.slot.kind, { dateColumns: x.direction.CONTINUOUS }); sink.count('chartAxes.charts'); };

  // The fixes on a chart, after its fields and objects are written (Bt: its binding): its filters (not blank, Top N, the
  // last 12 months), its names' room, its bars' thickness, its month order; the notes and the band count to the sink
  function fix(x, state, sink) {
    const { theme: { o, base, font }, look: { LABEL }, binding: { own }, slot: s, plan, page: { pg }, measures: { notBlank, topSet, topN, lastMonths, byMonthStart } } = x, { visual, Bt } = state, { note, count, out } = sink, c = { own, LABEL, font };
    const st = visual.query.queryState, cat = st.Category && st.Category.projections[0], col = cat && cat.field.Column, filters = [];
    const put = (object, props) => { visual.objects = visual.objects || {}; const e = visual.objects[object] || (visual.objects[object] = [{ properties: {} }]); Object.assign(e[0].properties, props); };
    if (col && CHARTS.includes(s.kind)) { filters.push(notBlank(col)); count('n.blankFiltered'); }
    // (the design block's S5/D19, from the laptop's sweep of rc.1: a category with dozens of values gave cut vertical
    // labels and a scrollbar) a bar or column chart keeps the Top N categories its slot can show (s.topN, the design
    // engine's categoryFit), by its measure; never on a time axis or an ordered category, whose order would be lost;
    // said in its title (the writer's rc1 rule, topCount, with the design's N)
    const top = col && st.Y && st.Y.projections[0] ? topCount(c, s, pg, catOf(Bt, visual.query)) : 0;
    // (design round 10, N14: kept by a report measure, every category where they are at most 2 more than its rows, the
    // fixed Top N filter only where the DAX can't name the fields)
    // (0.2.9.1, B-174: the plan said "Top 5" over a chart that showed its 6 categories) allUpTo: the most categories it
    // still shows all of (top + 2 with the Keep: measure, top with the fixed Top N filter), so the plan says what is kept
    const keep = top ? topSet(catOf(Bt, visual.query), st.Y.projections[0].field, top, 2) : null;
    if (top) { filters.push(keep ? keep.keep() : topN(col, st.Y.projections[0].field, top)); note('topCharts', Object.assign({ page: pg.name || base, kind: s.kind, field: col.Expression.SourceRef.Entity + '[' + col.Property + ']', top, allUpTo: keep ? top + 2 : top }, plan || {})); }
    // O-4: a bar chart's names get 40% of its width, 50% on a narrow chart (under 560 on the 720-high page); the default 25 cut them at about 10 characters
    // (design round 9, D19: a many-valued category's names, product names, get room for 25 characters where 40% of the
    // chart holds them, else 50%: measured, REPORT-FIXES-LAB B1/B2, 40% of 508 held about 20 characters, 50% about 25,
    // 10.2 page units a character on a 1080-high page)
    if (visual.visualType === 'clusteredBarChart') { const cf = catOf(Bt, visual.query), need = 25 * 10.2 * pg.page.h / 1080;
      // (design round 10, D19 on one more chart: names a chart is cut to the Top N of are names it has many of)
      put('categoryAxis', { maxMarginFactor: lit(Math.max(barNameShare(s.w, pg.page.h), cf && (cf.wide || top) && 0.4 * s.w < need ? 50 : 0) + 'L') }); }
    // 0.3.1 FX5 (the owner, 28 Oct, D-1028-06: three bars drawn about 70 thick, a few columns each very wide): where the
    // count of categories is known (the chart's Top N, a day, month or quarter axis, a field of two or a few known texts,
    // a calendar's rows; the fewer of the two), a bar or column is never thicker than the measured maximum (pbip-sizing.js barBand): the gaps
    // grow, inner and outer padding alike, so the bars stay centred; the value axis is never touched (equal values stay
    // equal). Count not known: nothing written, Desktop's default as before. (small multiples share the width by panel;
    // the gallery's waterfall, a column chart of steps, keeps its own look)
    const nCat = col && BAND_TYPES.test(visual.visualType) && s.kind !== 'multiples' && s.kind !== 'waterfall' ? Math.min(top || Infinity, knownCount(catOf(Bt, visual.query), o) || Infinity) : 0;
    const box = visual.position || {}, horizontal = BAR_TYPES.test(visual.visualType);
    const band = nCat < Infinity ? barBand(nCat, barSpan(horizontal, +box.width || s.w, +box.height || s.h, pg.page.h), pg.page.h) : null;
    if (band) { put('categoryAxis', { innerPadding: lit(band.pct + 'L'), outerPadding: lit(band.pct + 'L') }); out.bands = nCat;
      // (FX5b) said in the plan: where, which kind, how many categories, the padding and the thickness (never a name)
      note('barBands', { page: pg.name || base, kind: s.kind, visualType: visual.visualType, categories: nCat, padding: band.pct, thickness: Math.round(band.bar * 10) / 10, max: Math.round(band.max * 10) / 10 }); }
    // O-13: the line chart's month label
    if (s.kind === 'line' && col && Bt.date && ['monthStart', 'monthLabel'].includes((timeAxisPlan(Bt.date) || {}).order) && col.Property === Bt.date.c) {
      byMonthStart(visual.query, Bt.date, 'Ascending');   // (a mirrored report's: turned round by the engine, after this)
      const lf = st.Y && lastMonths(Bt.date, st.Y.projections[0].field, 12); if (lf) filters.push(lf);
      note('timeAxes', { page: pg.name || base, field: Bt.date.t + '[' + Bt.date.c + ']', by: Bt.date.dateOf ? Bt.date.dateOf.t + '[' + Bt.date.dateOf.c + ']' : 'the label read as a date', last: lf ? 12 : null });
    }
    return filters;
  }


  const api = { topCount, knownCount, catOf, BAND_TYPES, BAR_TYPES, slotKind, categoryPlan, prepare, hover, format, fix, mirror };
  if (node) module.exports = api; else root.DAPbipVisualCharts = api;
})(typeof self !== 'undefined' ? self : this);
