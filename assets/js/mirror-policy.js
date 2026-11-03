/* DataArcus mirror policy: the Arabic twin's named rules (0.3.2 SP10, from report-mirror.js; the Codex split map,
 * B-280). Which family a visual is, which category axis is time, and which content keeps left to right inside its
 * mirrored box: each a pure predicate, a visual's JSON and the model's facts in, a named answer out. Nothing here
 * changes its input or writes anything; the transforms that act on these answers are report-mirror.js's (chartRtl,
 * mirrorVisual, mirrorPage). One home for each rule: report-mirror.js, and through it the MCP and the website, read
 * them here (the owner, D-1016-01).
 * Browser and Node (module.exports / window.DAMirrorPolicy). */
(function (root) {
  'use strict';
  // ---- the PBIR readers (one copy: report-mirror.js takes them from here) ----
  // (the fuzz test's F-T1..F-T3, 11 Oct: a report from anyone can hold any shape. Every read checks the shape it touches)
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const strOf = (p) => { const v = lit(p); return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  // the entries of a formatting card that are objects (an odd one is skipped, never changed)
  const entries = (bag, name) => (isObj(bag) && Array.isArray(bag[name]) ? bag[name].filter((e) => isObj(e) && (e.properties === undefined || isObj(e.properties))) : null);
  const projections = (query, role) => (isObj(query) && isObj(query.queryState) && isObj(query.queryState[role]) && Array.isArray(query.queryState[role].projections) ? query.queryState[role].projections : null);
  const first = (ps) => (ps && isObj(ps[0]) ? ps[0] : null);

  // ---- the families ----
  const COLUMN = Object.freeze(['columnChart', 'clusteredColumnChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'ribbonChart']);
  // (a waterfall's steps follow its category order: the sort reverses them; its category axis has no invertAxis)
  const WATERFALL = Object.freeze(['waterfallChart']);
  const BAR = Object.freeze(['barChart', 'clusteredBarChart', 'hundredPercentStackedBarChart']);
  const SLICER = Object.freeze(['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer']);
  // visuals with nothing that has a side (the labs and round 13: they move only). Any other Power BI visual (a scatter
  // chart, a decomposition tree...) is 'other': it moves only too, but the plan says no setting is proven
  // for it (the cross-review's T6), instead of claiming it has no side
  const SIDELESS = Object.freeze(['card', 'multiRowCard', 'kpi', 'gauge', 'donutChart', 'pieChart', 'funnel', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'image', 'shape', 'basicShape']);
  // a custom visual: the shared catalog's test (visual-types.js; the reading block uses the same one). A visual with no
  // type at all is treated as custom too: moved only
  const VT = typeof module !== 'undefined' && module.exports ? require('./visual-types.js') : root.DAVisualTypes;
  const isCustom = (type) => !type || VT.isCustom(type);
  // json: a visual.json. Its kind, the name every rule of the twin is keyed by
  function kindOf(json) {
    if (!isObj(json)) return 'unreadable';
    if (isObj(json.visualGroup)) return 'group';
    if (!isObj(json.visual)) return 'unreadable';
    const t = json.visual.visualType;
    if (isCustom(t)) return 'custom';
    if (COLUMN.includes(t)) return 'column';
    if (BAR.includes(t)) return 'bar';
    if (WATERFALL.includes(t)) return 'waterfall';
    if (t === 'tableEx') return 'table';
    if (t === 'pivotTable') return 'matrix';
    if (t === 'cardVisual') return 'newCard';
    if (t === 'textbox') return 'textbox';
    if (t === 'actionButton') return 'button';
    if (t === 'pageNavigator') return 'navigator';
    if (SLICER.includes(t)) return 'slicer';
    return SIDELESS.includes(t) ? 'plain' : 'other';
  }

  // ---- the time axis ----
  // a time category: a hierarchy level, a column of a date table, or a column named like a date part
  // (B-282: pbip-query.js's isTime splits a name into its words first, FiscalYear -> Fiscal Year; this one tests the
  // raw name, so FiscalYear outside a date table is not time here. Kept as it is: one rule for both is B-282's job)
  const TIME_NAME = /\b(date|month|year|quarter|week|day|weekday|period)s?\b|التاريخ|الشهر|السنة|الربع|الأسبوع|اليوم/i;
  function isTime(field, dateTables) {
    if (!isObj(field)) return false;
    if (field.HierarchyLevel) return true;
    const c = field.Column; if (!isObj(c)) return false;
    const ent = isObj(c.Expression) && isObj(c.Expression.SourceRef) ? c.Expression.SourceRef.Entity : null;
    return (dateTables || []).includes(ent) || TIME_NAME.test(String(c.Property || ''));
  }
  // visual: a visual.json's "visual". Whether its first Category field is time
  const categoryIsTime = (visual, dateTables) => isTime((first(projections(isObj(visual) ? visual.query : null, 'Category')) || {}).field, dateTables);
  // (0.3.1 MP1e) a date table's column whose name reads as a date (its type unknown to the model read): RepeatIQ's
  // StartOfMonth, "Start of Month", "Order Date", "Month Start", "Day"
  const DATE_LIKE = /(?:^|[\s_])(?:date|day)$|^date|start ?of ?[a-z]+$|startof[a-z]*$|(?:^|[\s_])[a-z]* ?start$/i;
  // (T-2 of the laptop's rc.2 twins: a continuous date axis ignores the sort, so time stayed left to right; on such an
  // axis categoryAxis.invertAxis is honoured: round 13, "2027 at the left, 2022 at the right". Continuous: the category
  // is a date column of the model (o.dateColumns, "Table.Column") and the axis is not set Categorical)
  // (0.3.1 MP1e, laptop part 8: RepeatIQ's Monthly Sales on DateTable.StartOfMonth, a column the model read did not
  // type a date, stayed left to right) any time category: a date table's column not typed text, or a date hierarchy
  // level (isTime); Desktop ignores invertAxis on a categorical axis (T-2), where the sort turns it
  // (o.textColumns: the model's text columns, a month name: categorical, turned by the sort alone)
  // (only where the model's text columns are known, as in the twin: create_report's writer keeps its rule)
  // a column by a name that reads as a date (StartOfMonth, Date, Month Start), not a month name or a year-month)
  // visual: a column-family chart's "visual"; o: { dateColumns, dateTables, textColumns, timeRightToLeft }. Whether the
  // twin inverts its category axis (time read from the right)
  function invertsTimeAxis(visual, o0) {
    const o = o0 || {}, v = isObj(visual) ? visual : {};
    const c0 = first(projections(v.query, 'Category'));
    const cf = c0 && isObj(c0.field) && isObj(c0.field.Column) ? c0.field.Column : null;
    const cref = cf && isObj(cf.Expression) && isObj(cf.Expression.SourceRef) ? cf.Expression.SourceRef.Entity + '.' + cf.Property : null;
    const axisType = (entries(v.objects, 'categoryAxis') || []).map((e) => strOf((e.properties || {}).axisType)).find((x) => x != null);
    const timeCat = Array.isArray(o.textColumns) && c0 && isTime(c0.field, o.dateTables) && (!cf || (DATE_LIKE.test(String(cf.Property || '')) && !o.textColumns.includes(cref)));
    return !!(((cref && (o.dateColumns || []).includes(cref)) || timeCat) && axisType !== 'Categorical' && o.timeRightToLeft !== false);
  }

  // ---- the content's direction inside a mirrored box ----
  // kinds the twin only moves (and casts their shadow to the other side): their inside is left exactly as it is
  const MOVES_ONLY = Object.freeze(['custom', 'group', 'unreadable']);
  const movesOnly = (kind) => MOVES_ONLY.includes(kind);
  // a waterfall's way. o.mode: the twin's setting as visual-gallery.js waterfallRtlOf reads it ('native': Power BI's
  // own waterfall, left to right, D7; 'mirror': the right-to-left chart, D1). Time kept left to right on request
  // (o.timeRightToLeft false): a waterfall over time stays one, its order as it is. 'waterfall': the right-to-left chart
  // is tried (report-mirror.js keeps it a waterfall, 'waterfallKept', when its running total can't follow it)
  const waterfallKind = (visual, o0) => { const o = o0 || {};
    if (o.mode === 'native') return 'waterfallNative';
    if (o.timeRightToLeft === false && categoryIsTime(visual, o.dateTables)) return 'waterfallTime';
    return 'waterfall'; };
  // (0.3.1 MP1e) a button slicer no higher than this holds one row of buttons (Call Center's months: 50)
  const ONE_ROW_H = 64;
  // (0.3.0 L2) a button slicer on one row (the writer's pills): its buttons read from the right; one of several rows
  // moves only. (0.3.1 MP1e, laptop part 8: Call Center's months, a 3 x 3 grid 50 px high, kept Jan at the left) one row
  // of buttons: rowCount 1, or a layout too low for a second row (ONE_ROW_H). visual: the slicer's "visual"; height: its box's
  const oneRowButtons = (visual, height) => {
    const v = isObj(visual) ? visual : {};
    if (v.visualType !== 'advancedSlicerVisual') return false;
    const lay = (entries(v.objects, 'layout') || []).find((e) => !e.selector && isObj(e.properties)), f0 = first(projections(v.query, 'Values'));
    const oneRow = lay && (String(lit(lay.properties.rowCount)) === '1L' || (Number.isFinite(height) && height <= ONE_ROW_H));
    return !!(oneRow && f0 && isObj(f0.field) && isObj(v.query));
  };
  // (0.3.1 MP1e, laptop part 8: Fintech's four status lines, orientation "1D", came out bottom to top) a new card's
  // values that run down (a vertical list, "1D") keep their order; only values that run left to right are reversed
  const verticalValues = (visual) => {
    const v = isObj(visual) ? visual : {};
    const lay = (entries(v.objects, 'layout') || []).find((e) => !e.selector && isObj(e.properties) && e.properties.orientation !== undefined);
    return !!lay && String(lit(lay.properties.orientation)) === '1D';
  };
  // the kinds whose title is set right even when they have none (their default title is drawn at the left); visuals
  // that only move get nothing unless they have a title of their own
  const TITLED = Object.freeze(['column', 'bar', 'table', 'matrix', 'matrixAsTable', 'newCard']);
  const titled = (kind) => TITLED.includes(kind);
  // (0.3.1 MP1c, MP1d: laptop parts 7 and 8) a matrix keeps its row headers at its left, and Desktop keeps a table's
  // columns at its left edge in the twin: both stay left to right inside their mirrored box. (B-284: the one home of
  // this rule; mcp/lib/twin-pages.mjs staysLtr and mcp/lib/page-picture.mjs TABLES still hold their own copies)
  const keepsGridLtr = (json) => { const k = kindOf(json); return k === 'matrix' || k === 'table'; };

  const api = Object.freeze({ isObj, lit, strOf, entries, projections, first,
    COLUMN, BAR, WATERFALL, SLICER, SIDELESS, isCustom, kindOf,
    TIME_NAME, DATE_LIKE, isTime, categoryIsTime, invertsTimeAxis,
    MOVES_ONLY, movesOnly, waterfallKind, ONE_ROW_H, oneRowButtons, verticalValues, TITLED, titled, keepsGridLtr });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirrorPolicy = api;
})(typeof self !== 'undefined' ? self : this);
