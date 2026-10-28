/* DataArcus report mirror: the right-to-left twin of any PBIR report's pages and visuals (0.3.0, the Arabic twin; the
 * owner's plan of 11 Oct 2026). Pure JSON in, JSON out: the caller reads the original's files and writes the twin's
 * (mcp/lib/arabic-twin.mjs); this engine never touches a file.
 * What it does is what Power BI Desktop 2.158 was seen to honour (the laptop's Arabic twin labs of 10 Oct 2026, and
 * scripts/tests/DESKTOP-TESTS.md round 0, 11 and 13), nothing else:
 *  - every visual's place: x' = W - x - width, W the page's width, or the parent group's width for a visual inside a
 *    group (PBIR positions in a group are relative to it); rounded to 0.01 (floating point gave x = -1e-13 and the
 *    validator's PBIR_LAYOUT_NEGATIVE_X);
 *  - bar charts: the category axis at the right, the value axis inverted (bars grow from the right);
 *  - column, line, area and combo charts: the value axis at the right, and the category order reversed BY THE SORT
 *    (an existing sort flipped, else Descending by the category). categoryAxis.invertAxis is never written: on a
 *    categorical axis Desktop ignored it. Mirroring time is the owner's choice (opts.timeRightToLeft, default true);
 *  - waterfall charts (D1; R3's Descending sort was seen in Desktop 2.159 to reverse time, not the direction: Power BI
 *    accumulates a waterfall left to right and has no setting to invert its category axis): written as a stacked
 *    column chart drawn as a waterfall from the twin's own report measures (visual-gallery.js rtlWaterfall; the
 *    caller writes them, opts.waterfall), the first period at the right; one the measures can't order is kept a
 *    waterfall, left to right, with its value axis at the right (kind 'waterfallKept');
 *  - legends: left and right swapped, TopRight when none is set; titles right-aligned (centred kept); text boxes
 *    right-aligned (centred kept); tables: columns reversed, text columns right-aligned; a matrix's values reversed;
 *    a new card's values reversed and right-aligned (a single value too, its inner margins swapped); buttons: a left text or icon goes right;
 *  - everything else (cards, slicers, the page navigator, maps, images, shapes, custom visuals) moves only.
 *  - the phone layout (mobile.json; 0.3.0 D3): every box mirrored on the 323-wide phone canvas, text boxes right-aligned.
 * Names, ids, navigation targets and bookmark references are never changed. Texts are replaced only by the labels
 * the caller passes (the user's approved Arabic), keyed by the ids textsOf gives. A report's text is untrusted input:
 * it is only copied or replaced, never interpreted.
 * Browser and Node (module.exports / window.DAMirror). */
(function (root) {
  'use strict';
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const mk = (v) => ({ expr: { Literal: { Value: v } } });
  const strOf = (p) => { const v = lit(p); return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  const str = (s) => mk("'" + String(s).replace(/'/g, "''") + "'");
  // (the fuzz test's F-T1..F-T3, 11 Oct: a report from anyone can hold any shape. Every read and write below checks the
  // shape it touches; a part of an unexpected shape is left exactly as it is, never written into or thrown on)
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

  // ---- the kinds ----
  const COLUMN = ['columnChart', 'clusteredColumnChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'ribbonChart'];
  // (a waterfall's steps follow its category order: the sort reverses them; its category axis has no invertAxis)
  const WATERFALL = ['waterfallChart'];
  const BAR = ['barChart', 'clusteredBarChart', 'hundredPercentStackedBarChart'];
  const SLICER = ['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer'];
  // visuals with nothing that has a side (the labs and round 13: they move only). Any other Power BI visual (a scatter
  // chart, a decomposition tree...) is 'other': it moves only too, but the plan says no setting is proven
  // for it (the cross-review's T6), instead of claiming it has no side
  const SIDELESS = ['card', 'multiRowCard', 'kpi', 'gauge', 'donutChart', 'pieChart', 'funnel', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'image', 'shape', 'basicShape'];
  // a custom visual: the shared catalog's test (visual-types.js; the reading block uses the same one). A visual with no
  // type at all is treated as custom too: moved only
  const VT = typeof module !== 'undefined' && module.exports ? require('./visual-types.js') : root.DAVisualTypes;
  const isCustom = (type) => !type || VT.isCustom(type);
  // the right-to-left waterfall's builder, shared with the report writer (D1)
  const Gallery = () => (typeof module !== 'undefined' && module.exports ? require('./visual-gallery.js') : root.DAGallery || null);
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
  const KIND_WHAT = {
    column: 'column, line, area and combo charts: value axis at the right, categories right to left by the sort',
    waterfall: 'waterfall charts: no Total column in Arabic: the last step on the left ends at the total, with no total label either (Power BI 2.159 does not draw it); every step\'s tooltip gives the running total. Power BI draws a waterfall left to right only and its axis holds only the model\'s members, so each is written as a stacked column chart drawn as a waterfall (an invisible base under each step, from the twin\'s own report measures): the running total in the original\'s order, the first period at the right and each step rising or falling from the one at its right, the value axis at the right, labels on the steps (a fall shown negative), the original waterfall\'s increase and decrease colours, no legend (a stacked column chart\'s legend would list the invisible base); hovering the empty space under a step shows its base in the tooltip. The series are named in Arabic: القاعدة، ارتفاع، انخفاض، ارتفاع تحت الصفر، انخفاض تحت الصفر، الإجمالي الجاري، الإجمالي',
    // (D7) waterfallRtl "native": Power BI's own waterfall, kept as it is
    waterfallNative: 'waterfall charts: the waterfall reads left to right, as Power BI draws it',
    waterfallTime: 'waterfall charts over time, kept left to right as asked (timeRightToLeft false): still waterfalls, their order as it is, the value axis at the right',
    waterfallKept: 'waterfall charts the running total can\'t follow (a breakdown, a sort by the value, a text category with no order): A waterfall reads left to right in Power BI: its order is not mirrored (kept a waterfall, left to right, the value axis at the right)',
    bar: 'bar charts: names at the right, bars growing from the right',
    table: 'tables: columns in reverse order (the first at the right), text columns right-aligned; one led by a text column says «الإجمالي» on its total row, as create_report\'s (a "Row label" measure)',
    matrix: 'matrices: values in reverse order (rows keep their order)',
    newCard: 'new cards: values in reverse order, right-aligned (one value too), their inner margins swapped',
    textbox: 'text boxes: right-aligned (centred kept)',
    button: 'buttons: a left-aligned text or icon goes right; links unchanged',
    navigator: 'page navigators: moved only',
    slicer: 'slicers: moved only (their items keep Power BI\'s own alignment)',
    pills: 'button slicers on one row: their buttons read from the right (sorted descending by their field)',
    custom: 'custom visuals: moved only, their settings left as they are',
    group: 'groups: mirrored with their visuals inside',
    plain: 'cards, gauges, donuts, funnels, treemaps, maps, images and shapes: moved only (nothing in them has a side)',
    other: 'other visuals (scatter...): moved only; no right-to-left setting is proven for them',
    unreadable: 'visuals whose file has an unexpected shape: copied as they are, not mirrored'
  };

  // ---- small helpers ----
  const round = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? 0 : r; };
  // the entries of a formatting card that are objects (an odd one is skipped, never changed)
  const entries = (bag, name) => (isObj(bag) && Array.isArray(bag[name]) ? bag[name].filter((e) => isObj(e) && (e.properties === undefined || isObj(e.properties))) : null);
  // the entry without a selector (made when missing), where axis and legend switches go; when the card or the entry has
  // an unexpected shape, a detached entry is returned: what is set on it goes nowhere, and the original stays as it is
  const detached = () => ({ properties: {} });
  const plainEntry = (bag, name) => {
    if (!isObj(bag)) return detached();
    if (bag[name] === undefined) bag[name] = [];
    const es = bag[name]; if (!Array.isArray(es)) return detached();
    let e = es.find((x) => isObj(x) && !x.selector); if (!e) { e = { properties: {} }; es.unshift(e); }
    if (e.properties === undefined) e.properties = {};
    return isObj(e.properties) ? e : detached();
  };
  // a list inside an object, made when missing; null when something else is there
  const listIn = (bag, name) => { if (!isObj(bag)) return null; if (bag[name] === undefined) bag[name] = []; return Array.isArray(bag[name]) ? bag[name] : null; };
  const projections = (query, role) => (isObj(query) && isObj(query.queryState) && isObj(query.queryState[role]) && Array.isArray(query.queryState[role].projections) ? query.queryState[role].projections : null);
  const first = (ps) => (ps && isObj(ps[0]) ? ps[0] : null);
  const sameField = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // (0.3.1 FX2, the laptop's H-1: "TopRight" was mirrored to "TopLeft", a value Power BI does not have, PBIR_FORMATTING_ENUM_INVALID)
  // a legend's positions as Microsoft's catalog has them (@microsoft/powerbi-core-visual-schema, every chart's
  // legend.position): Top is top left, Bottom bottom left, Left and Right their tops; the centred ones stay. A value
  // outside the catalog is kept as it is and said (kept)
  const LEGEND = { Top: 'TopRight', TopRight: 'Top', Bottom: 'BottomRight', BottomRight: 'Bottom', Left: 'Right', Right: 'Left', LeftCenter: 'RightCenter', RightCenter: 'LeftCenter', TopCenter: 'TopCenter', BottomCenter: 'BottomCenter' };
  // a time category: a hierarchy level, a column of a date table, or a column named like a date part
  const TIME_NAME = /\b(date|month|year|quarter|week|day|weekday|period)s?\b|التاريخ|الشهر|السنة|الربع|الأسبوع|اليوم/i;
  function isTime(field, dateTables) {
    if (!isObj(field)) return false;
    if (field.HierarchyLevel) return true;
    const c = field.Column; if (!isObj(c)) return false;
    const ent = isObj(c.Expression) && isObj(c.Expression.SourceRef) ? c.Expression.SourceRef.Entity : null;
    return (dateTables || []).includes(ent) || TIME_NAME.test(String(c.Property || ''));
  }

  // a text box's paragraphs that are objects, and a paragraph's text runs that are objects
  const paragraphsOf = (v) => (entries(isObj(v) ? v.objects : null, 'general') || []).flatMap((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).map((para, i) => (isObj(para) ? Object.assign(para, {}) : null)).filter(Boolean));
  const runsOf = (para) => (Array.isArray(para.textRuns) ? para.textRuns : []);

  // ---- the charts' right-to-left rules: one place, for the twin (mirrorVisual) and create_report's writer (mirrorChart;
  // 0.3.1 M1, the owner: "make sure the AR and twin are using the same engine"). v: the visual (visual.json's "visual"),
  // kind: kindOf's ('bar', 'column', 'waterfallKept' or 'waterfallTime': a waterfall that stays one gets its value axis at
  // the right). Changes v in place; what it changed is pushed to changes ----
  function chartRtl(v, kind, o, changes, kept0) {
    const kept = kept0 || [];
    const objects = () => (v.objects === undefined ? (v.objects = {}) : isObj(v.objects) ? v.objects : {});
    if (kind === 'waterfallKept' || kind === 'waterfallTime') { plainEntry(objects(), 'valueAxis').properties.switchAxisPosition = mk('true'); changes.push('value axis'); }
    if (kind === 'bar') {
      plainEntry(objects(), 'categoryAxis').properties.switchAxisPosition = mk('true');
      plainEntry(objects(), 'valueAxis').properties.invertAxis = mk('true');
      changes.push('axes');
    }
    if (kind === 'column') {
      plainEntry(objects(), 'valueAxis').properties.switchAxisPosition = mk('true');
      changes.push('value axis');
      const q = v.query, c0 = first(projections(q, 'Category'));
      const sd = isObj(q) && isObj(q.sortDefinition) && Array.isArray(q.sortDefinition.sort) && isObj(q.sortDefinition.sort[0]) ? q.sortDefinition : null;
      const time = c0 && isTime(c0.field, o.dateTables), keepTime = o.timeRightToLeft === false && time;
      if (sd) {
        // (0.3.0 S1, B-180) a sort by the category's own order key counts as a sort by the category: a helper of the
        // category's table in the visual's Tooltips role (the writer's Min of the month number, round 2; its "Month
        // start (sort)" report measure, O-13). Kept with time left to right, as a sort by the category itself is
        const s = sd.sort[0], entityOf = (f) => (isObj(f) && isObj(f.Column) ? f.Column : isObj(f) && isObj(f.Measure) ? f.Measure : isObj(f) && isObj(f.Aggregation) && isObj(f.Aggregation.Expression) ? f.Aggregation.Expression.Column : null);
        const ref = (f) => { const x = entityOf(f); return isObj(x) && isObj(x.Expression) && isObj(x.Expression.SourceRef) ? x.Expression.SourceRef.Entity : null; };
        const orderKey = c0 && ref(s.field) != null && ref(s.field) === ref(c0.field) && (projections(q, 'Tooltips') || []).some((t) => isObj(t) && sameField(t.field, s.field));
        const byCategory = c0 && (sameField(s.field, c0.field) || orderKey);
        if (!(keepTime && byCategory)) { s.direction = s.direction === 'Descending' ? 'Ascending' : 'Descending'; changes.push('sort'); }
      } else if (c0 && c0.field !== undefined && !keepTime && (q.sortDefinition === undefined)) {
        q.sortDefinition = { sort: [{ field: clone(c0.field), direction: 'Descending' }], isDefaultSort: true };
        changes.push('sort');
      }
      // (T-2 of the laptop's rc.2 twins: a continuous date axis ignores the sort, so time stayed left to right; on such
      // an axis categoryAxis.invertAxis is honoured: round 13, "2027 at the left, 2022 at the right". Continuous: the
      // category is a date column of the model (opts.dateColumns, "Table.Column") and the axis is not set Categorical)
      const cf = c0 && isObj(c0.field) && isObj(c0.field.Column) ? c0.field.Column : null;
      const cref = cf && isObj(cf.Expression) && isObj(cf.Expression.SourceRef) ? cf.Expression.SourceRef.Entity + '.' + cf.Property : null;
      const axisType = (entries(v.objects, 'categoryAxis') || []).map((e) => strOf((e.properties || {}).axisType)).find((x) => x != null);
      if (cref && (o.dateColumns || []).includes(cref) && axisType !== 'Categorical' && o.timeRightToLeft !== false) { plainEntry(objects(), 'categoryAxis').properties.invertAxis = mk('true'); changes.push('time axis'); }
    }
    // legends: a legend entry, or a legend role (Series, Legend) in the query
    // (charts only: the labs saw it there; a donut's or a map's legend is left as it is)
    if (kind === 'column' || kind === 'bar') {
      const legend = entries(v.objects, 'legend'), hasRole = !!(projections(v.query, 'Series') || projections(v.query, 'Legend'));
      if (legend || hasRole) {
        const e = plainEntry(objects(), 'legend'), cur = strOf(e.properties.position);
        const next = cur == null ? 'TopRight' : LEGEND[cur] || cur;
        if (next !== cur) { e.properties.position = str(next); changes.push('legend'); }
        else if (!LEGEND[cur]) kept.push({ what: 'legend position', value: cur });
      }
    }
  }

  // ---- one visual ----
  // json: visual.json of the original; W: the width it is placed in (the page's, or its parent group's)
  // opts: { timeRightToLeft (default true), dateTables: [names], waterfallRtl ('native' | 'mirror', D7), waterfall, matrixRtl
  // (MATRIX_RTL: the lab's switch, M1) }. Returns { json (a new object), kind, changes }
  // (0.3.1 CX2, TW1 Seen 2; the owner, D-1027-12 "twin identical") a container's shadow cast to one side is cast to the
  // other: its preset's Left and Right swap (BottomRight -> BottomLeft); Top, Bottom and Center stay. A Custom angle is
  // kept as it is (which way Desktop measures the angle is not measured yet). Any visual's container, custom ones too.
  // (0.3.1 FX2: the presets as Microsoft's catalog has them, dropShadow.preset: the middle ones are CenterLeft and
  // CenterRight; a value outside the catalog is kept and said.) Returns whether a preset turned
  const SHADOW_SIDE = { CenterLeft: 'CenterRight', CenterRight: 'CenterLeft', TopLeft: 'TopRight', TopRight: 'TopLeft', BottomLeft: 'BottomRight', BottomRight: 'BottomLeft' };
  const SHADOW_STAY = ['Top', 'Bottom', 'Center', 'Custom'];
  function mirrorShadow(bag, kept) {
    let n = 0;
    (entries(bag, 'dropShadow') || []).forEach((e) => { const p = isObj(e) ? strOf((e.properties || {}).preset) : null;
      if (p != null && SHADOW_SIDE[p]) { e.properties.preset = str(SHADOW_SIDE[p]); n++; } else if (p != null && kept && !SHADOW_STAY.includes(p)) kept.push({ what: 'shadow preset', value: p }); });
    return n > 0;
  }
  function mirrorVisual(json0, W, opts) {
    const o = opts || {};
    if (!isObj(json0)) return { json: json0, kind: 'unreadable', changes: [] };
    const json = clone(json0), changes = [], kept = [];
    let kind = kindOf(json), measures = null, why = null;
    const p = isObj(json.position) ? json.position : {};
    if (Number.isFinite(p.x) && Number.isFinite(p.width) && Number.isFinite(W)) { p.x = round(W - p.x - p.width); changes.push('position'); }
    const v = json.visual;
    if (isObj(v) && mirrorShadow(v.visualContainerObjects, kept)) changes.push('shadow');
    if (!isObj(v) || kind === 'custom' || kind === 'group' || kind === 'unreadable') return { json, kind, changes };
    // the visual's formatting cards: made when missing; an unexpected shape there gets a detached bag (nothing written)
    const bagOf = (name) => (v[name] === undefined ? (v[name] = {}) : isObj(v[name]) ? v[name] : {});
    const objects = () => bagOf('objects');
    const vco = () => bagOf('visualContainerObjects');
    // charts: the bar, column, line, area, combo charts' rules (chartRtl, shared with create_report's writer: mirrorChart)
    // (o.keepDirection: a bar list mirrored as one block with its names beside it, T-6: its bars keep growing toward them)
    // (D7) opts.waterfallRtl "native" (visual-gallery.js WATERFALL_RTL_DEFAULT): Power BI's own waterfall kept as the
    // original has it, left to right (only its place is mirrored); "mirror": the stacked column chart below
    if (kind === 'waterfall' && (Gallery() ? Gallery().waterfallRtlOf(o.waterfallRtl) : 'native') === 'native') kind = 'waterfallNative';
    // (D1) a waterfall: the stacked column chart that reads from the right, or kept left to right
    // (time kept left to right on request, opts.timeRightToLeft false: a waterfall over time stays one, its order as it is)
    if (kind === 'waterfall' && o.timeRightToLeft === false && isTime((first(projections(v.query, 'Category')) || {}).field, o.dateTables)) kind = 'waterfallTime';
    if (kind === 'waterfall') {
      const wo = o.waterfall || {}, G = Gallery(), sc = (entries(v.objects, 'sentimentColors') || []).find((e) => !e.selector && isObj(e.properties)), th = isObj(wo.theme) ? wo.theme : {};
      const fill = (k, hex) => (sc && isObj(sc.properties[k]) ? clone(sc.properties[k]) : G && G.fillOf(hex));
      const y0 = first(projections(v.query, 'Y')), ym = y0 && isObj(y0.field) && isObj(y0.field.Measure) ? y0.field.Measure : null;
      let wf;
      try {
        wf = G ? G.rtlWaterfall(v.query, { extMeasure: wo.extMeasure || ((t, want) => want), sortByOf: wo.sortByOf, lang: 'ar',
          typeOf: (t, c) => (wo.typeOf && wo.typeOf(t, c)) || ((o.dateColumns || []).includes(t + '.' + c) ? 'dateTime' : null), colours: { rise: fill('increaseFill', G.sentimentOf(th, 'good')), fall: fill('decreaseFill', G.sentimentOf(th, 'bad')) },
          formatString: ym && wo.formatOf && isObj(ym.Expression) && isObj(ym.Expression.SourceRef) ? wo.formatOf(ym.Expression.SourceRef.Entity, ym.Property) : null }) : { ok: false, why: 'the visual gallery is not loaded' };
      } catch (e) { wf = { ok: false, why: 'its query has a shape not expected' }; }
      if (wf.ok) {
        // the original's own axes and plot area kept (their properties are the column chart's too); its legend, labels,
        // sentiment colours and breakdown are the waterfall's own: replaced
        const kept = {}; ['general', 'categoryAxis', 'valueAxis', 'plotArea', 'y1AxisReferenceLine'].forEach((k) => { if (isObj(v.objects) && Array.isArray(v.objects[k])) kept[k] = v.objects[k]; });
        // (the original's axis entries keep their properties; the builder's go into their plain entry)
        v.visualType = wf.visualType; v.query = wf.query; v.objects = Object.assign({}, kept, wf.objects);
        ['valueAxis', 'categoryAxis'].forEach((k) => { if (kept[k] && wf.objects[k]) { v.objects[k] = kept[k]; Object.assign(plainEntry(v.objects, k).properties, wf.objects[k][0].properties); } });
        measures = wf.measures; changes.push('waterfall', 'value axis', 'sort');
      } else { kind = 'waterfallKept'; why = wf.why; }
    }
    if (kind === 'bar' && o.keepDirection) { /* its bars keep their direction */ } else chartRtl(v, kind, o, changes, kept);
    // (0.3.0 L2) a button slicer on one row (the writer's pills): its buttons read from the right, by a descending sort on
    // its field (a sort it already has is turned round); one of several rows moves only
    if (kind === 'slicer' && v.visualType === 'advancedSlicerVisual') {
      const lay = (entries(v.objects, 'layout') || []).find((e) => !e.selector && isObj(e.properties)), f0 = first(projections(v.query, 'Values'));
      if (lay && String(lit(lay.properties.rowCount)) === '1L' && f0 && isObj(f0.field) && isObj(v.query)) {
        const sd = isObj(v.query.sortDefinition) && Array.isArray(v.query.sortDefinition.sort) && isObj(v.query.sortDefinition.sort[0]) ? v.query.sortDefinition.sort[0] : null;
        if (sd) sd.direction = sd.direction === 'Descending' ? 'Ascending' : 'Descending'; else v.query.sortDefinition = { sort: [{ field: clone(f0.field), direction: 'Descending' }] };
        kind = 'pills'; changes.push('order');
      }
    }
    // tables, matrices, new cards
    if (kind === 'table') {
      // (0.3.0 F1) a status icon right of its value ('After', English) goes left of it ('Before'), where an Arabic reader ends
      const ob = isObj(v.objects) ? v.objects : null, vals = ob && Array.isArray(ob.values) ? ob.values : null;
      (vals || []).forEach((e) => { const ic = isObj(e) && isObj(e.properties) && isObj(e.properties.icon) ? e.properties.icon : null; if (ic && strOf(ic.layout) === 'After') { ic.layout = str('Before'); changes.push('status icons'); } });
      const ps = projections(v.query, 'Values');
      if (ps && ps.length > 1) { ps.reverse(); changes.push('columns'); }
      (ps || []).filter((x) => isObj(x) && isObj(x.field) && x.field.Column && typeof x.queryRef === 'string').forEach((x) => {
        const cf = listIn(objects(), 'columnFormatting'); if (!cf) return;
        let e = cf.find((y) => isObj(y) && isObj(y.selector) && y.selector.metadata === x.queryRef);
        if (!e) { e = { properties: {}, selector: { metadata: x.queryRef } }; cf.push(e); }
        if (e.properties === undefined) e.properties = {};
        if (!isObj(e.properties)) return;
        const a = strOf(e.properties.alignment);
        if (a !== 'Center' && a !== 'Right') {
          e.properties.alignment = str('Right');
          ['styleHeader', 'styleValues', 'styleTotal'].forEach((k) => { if (e.properties[k] === undefined) e.properties[k] = mk('true'); });
          changes.push('alignment');
        }
      });
    }
    if (kind === 'matrix') matrixRtl(v, o.matrixRtl, changes);
    if (kind === 'newCard') {
      const ps = projections(v.query, 'Data');
      if (ps && ps.length > 1) {
        ps.reverse();
        const es = listIn(objects(), 'value');
        let e = es ? es.find((y) => isObj(y) && isObj(y.selector) && y.selector.id === 'default') : null;
        if (es && !e) { e = { properties: {}, selector: { id: 'default' } }; es.push(e); }
        if (e && e.properties === undefined) e.properties = {};
        if (e && isObj(e.properties)) e.properties.horizontalAlignment = str('right');
        changes.push('values');
      }
      // (rc.24, the laptop's proof of rc.23: a card with one value, as DataArcus writes its KPI cards, kept its value
      // left-aligned under its right-aligned title) a value aligned left goes right (centred kept), and the card's inner
      // left and right margins (its padding card, as the writer sets them) swap sides with it
      (entries(v.objects, 'value') || []).forEach((e) => { if (strOf((e.properties || {}).horizontalAlignment) === 'left') { e.properties.horizontalAlignment = str('right'); changes.push('value'); } });
      (entries(v.objects, 'padding') || []).forEach((e) => {
        if (!isObj(e.properties) || (e.properties.leftMargin === undefined && e.properties.rightMargin === undefined)) return;
        const l = e.properties.leftMargin, r = e.properties.rightMargin;
        if (r === undefined) delete e.properties.leftMargin; else e.properties.leftMargin = r;
        if (l === undefined) delete e.properties.rightMargin; else e.properties.rightMargin = l;
        changes.push('margins');
      });
    }
    // text
    if (kind === 'textbox') {
      paragraphsOf(v).forEach((para) => { if (para.horizontalTextAlignment !== 'center') { para.horizontalTextAlignment = 'right'; changes.push('text'); } });
    }
    if (kind === 'button') {
      (entries(v.objects, 'text') || []).forEach((e) => { if (strOf((e.properties || {}).horizontalAlignment) === 'left') { e.properties.horizontalAlignment = str('right'); changes.push('text'); } });
      (entries(v.objects, 'icon') || []).forEach((e) => { if (strOf((e.properties || {}).placement) === 'left') { e.properties.placement = str('right'); changes.push('icon'); } });
    }
    // (T-3 of the laptop's rc.2 twins: a text kept clear of an icon by its container's padding on one side ran under the
    // icon once mirrored) the container's left and right padding swap sides with everything else
    (entries(v.visualContainerObjects, 'padding') || []).forEach((e) => {
      if (!isObj(e.properties) || (e.properties.left === undefined && e.properties.right === undefined)) return;
      const l = e.properties.left, r = e.properties.right;
      if (r === undefined) delete e.properties.left; else e.properties.left = r;
      if (l === undefined) delete e.properties.right; else e.properties.right = l;
      changes.push('padding');
    });
    // titles: an existing one right-aligned unless centred; a chart or table without one gets the alignment (its
    // default title is drawn at the left); visuals that only move get nothing
    const titles = entries(v.visualContainerObjects, 'title');
    if (titles || ['column', 'bar', 'table', 'matrix', 'newCard'].includes(kind)) {
      const e = plainEntry(vco(), 'title'), a = strOf(e.properties.alignment);
      if (a !== 'center' && a !== 'right') { e.properties.alignment = str('right'); changes.push('title'); }
    }
    return Object.assign({ json, kind, changes }, measures ? { measures } : {}, why ? { why } : {}, kept.length ? { kept } : {});
  }

  // ---- the matrix (0.3.1 M1: the owner opened an Arabic copy whose months-across matrix was not mirrored at all) ----
  // Microsoft's capabilities give a matrix (pivotTable) no direction or right-to-left property; what could make it read
  // from the right is measured in Power BI Desktop by the lab (mcp/lab/matrix-mirror.mjs, mcp/work/M1.md). Until the
  // laptop proves one, every path keeps today's: 'values' (its measures reversed; its row headers stay left, its columns
  // left to right). The other values are the lab's candidates, written by the engine so the lab shows exactly what a
  // path would write; no path sets one (test-0.3.1-mirror-parity.mjs E5):
  //   'none': moved only; 'columnsDescending': sorted Descending by each column field (the last month first, at the left;
  //   read from the right it runs oldest to newest); 'alignRight': row headers, column headers and every measure's column
  //   right-aligned (rowHeaders.alignment, columnHeaders.alignment and titleAlignment, columnFormatting.alignment per
  //   measure with its header, values, subtotals and total); 'columnsDescendingAlignRight': both. Each but 'none' also
  //   reverses the measures
  const MATRIX_RTL = ['values', 'none', 'columnsDescending', 'alignRight', 'columnsDescendingAlignRight'], MATRIX_RTL_DEFAULT = 'values';
  function matrixRtl(v, mode0, changes) {
    const mode = MATRIX_RTL.includes(mode0) ? mode0 : MATRIX_RTL_DEFAULT;
    if (mode === 'none') return;
    const objects = () => (v.objects === undefined ? (v.objects = {}) : isObj(v.objects) ? v.objects : {});
    const ps = projections(v.query, 'Values');
    if (ps && ps.length > 1) { ps.reverse(); changes.push('values'); }
    if (/^columnsDescending/.test(mode)) {
      const cs = (projections(v.query, 'Columns') || []).filter((x) => isObj(x) && isObj(x.field)), q = v.query;
      if (cs.length && isObj(q)) {
        if (q.sortDefinition === undefined) q.sortDefinition = { sort: [] };
        const sd = q.sortDefinition, list = isObj(sd) && Array.isArray(sd.sort) ? sd.sort : null;
        if (list) {
          cs.forEach((c) => { const e = list.find((x) => isObj(x) && sameField(x.field, c.field)); if (e) e.direction = 'Descending'; else list.push({ field: clone(c.field), direction: 'Descending' }); });
          if (isObj(sd)) sd.isDefaultSort = false;
          changes.push('columns');
        }
      }
    }
    if (/AlignRight$|^alignRight$/.test(mode)) {
      ['rowHeaders', 'columnHeaders'].forEach((k) => { const e = plainEntry(objects(), k); e.properties.alignment = str('Right'); if (k === 'columnHeaders') e.properties.titleAlignment = str('Right'); });
      (ps || []).filter((x) => isObj(x) && typeof x.queryRef === 'string').forEach((x) => {
        const cf = listIn(objects(), 'columnFormatting'); if (!cf) return;
        let e = cf.find((y) => isObj(y) && isObj(y.selector) && y.selector.metadata === x.queryRef);
        if (!e) { e = { properties: {}, selector: { metadata: x.queryRef } }; cf.push(e); }
        if (e.properties === undefined) e.properties = {};
        if (!isObj(e.properties)) return;
        e.properties.alignment = str('Right');
        ['styleHeader', 'styleValues', 'styleSubtotals', 'styleTotal'].forEach((k) => { if (e.properties[k] === undefined) e.properties[k] = mk('true'); });
      });
      changes.push('alignment');
    }
  }

  // ---- create_report's writer: a chart it writes for a right-to-left report, by the twin's rules (chartRtl) ----
  // visual: the visual's "visual" object (visualType, query, objects), changed in place and returned; opts as
  // mirrorVisual's (dateColumns: the model's date columns, "Table.Column", for a continuous time axis). A waterfall here is
  // one kept a waterfall (its value axis at the right); a kind with no chart rule is returned as it is
  function mirrorChart(visual, opts) {
    if (!isObj(visual)) return visual;
    let kind = kindOf({ visual });
    if (kind === 'waterfall') kind = 'waterfallKept';
    if (['bar', 'column', 'waterfallKept'].includes(kind)) chartRtl(visual, kind, opts || {}, []);
    return visual;
  }

  // ---- one page: every visual mirrored, W from its parent group ----
  // visuals: [visual.json]; opts as mirrorVisual's. Returns { visuals: [json] in the same order, kinds: { kind: n }, custom: [names] }
  // ---- visuals mirrored as one (the laptop's rc.5 twins, T-3 and T-6) ----
  // Mirroring every box on its own broke two kinds of pair:
  //  - on: a small visual drawn ON a bigger one (a growth badge on a tile, an icon at the end of a card's title). What
  //    the bigger one draws inside (a picture, a text) does not flip with it, so the reflected badge landed on the
  //    tile's icon and the icon on the title's last letters. It now moves WITH its host: same offset from the host's
  //    left edge. On: at least 3/4 of its area inside the host, above it (a higher z), at most a third of the host's
  //    width, 0.6 of its height and a tenth of its area, a badge's kind (a card, a text box, an image or shape, a new
  //    card, a button), and the host carries at most 3 such (more: the host is a panel, its visuals mirror one by one);
  //  - bars: a bar list with its names hidden and the names in the visual beside it (a table, a text box, a slicer, a
  //    card; never a shape or an image), side by side (a gap of at most 24, half their heights shared). The two are mirrored as one block and keep
  //    their order inside it; the bars keep growing toward their names (no axis is switched or inverted).
  // Same parent only (positions in a group are relative to it). Returns { on: [{ visual, host }], bars: [{ bars, names }] }.
  const BADGE = ['plain', 'textbox', 'newCard', 'button'];
  // (the names: a visual that shows text; a shape or an image beside the bars is not their names)
  const showsNames = (v) => ['table', 'matrix', 'textbox', 'slicer', 'newCard'].includes(kindOf(v)) || ['card', 'multiRowCard'].includes(v.visual.visualType);
  const nameOf = (v) => (isObj(v) && (typeof v.name === 'string' || typeof v.name === 'number') ? String(v.name) : null);
  const boxOf = (v) => { const p = isObj(v) && isObj(v.position) ? v.position : null; return p && [p.x, p.y, p.width, p.height].every(Number.isFinite) && p.width > 0 && p.height > 0 ? { x: p.x, y: p.y, w: p.width, h: p.height, z: Number.isFinite(p.z) ? p.z : null } : null; };
  const parentOf = (v) => (isObj(v) && v.parentGroupName != null ? String(v.parentGroupName) : '');
  const axisHidden = (v) => (entries(isObj(v.visual) ? v.visual.objects : null, 'categoryAxis') || []).some((e) => !e.selector && isObj(e.properties) && lit(e.properties.show) === 'false');
  function unitsOf(visuals) {
    const list = (Array.isArray(visuals) ? visuals : []).filter((v) => nameOf(v) != null && boxOf(v) && kindOf(v) !== 'group' && kindOf(v) !== 'unreadable');
    const inside = (a, b) => { const w = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)), h = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)); return (w * h) / (a.w * a.h); };
    const on = [];
    list.forEach((v) => {
      if (!BADGE.includes(kindOf(v))) return;
      const a = boxOf(v);
      const hosts = list.filter((h) => h !== v && parentOf(h) === parentOf(v)).map((h) => [h, boxOf(h)]).filter(([, b]) => inside(a, b) >= 0.75 && a.w <= b.w / 3 && a.h <= b.h * 0.6 && a.w * a.h <= b.w * b.h / 10 && a.z != null && b.z != null && a.z > b.z);
      if (hosts.length) { hosts.sort((x, y) => x[1].w * x[1].h - y[1].w * y[1].h); on.push({ visual: nameOf(v), host: nameOf(hosts[0][0]) }); }
    });
    const count = {}; on.forEach((o) => { count[o.host] = (count[o.host] || 0) + 1; });
    const onKept = on.filter((o) => count[o.host] <= 3 && !on.some((x) => x.visual === o.host));
    const taken = new Set(onKept.map((o) => o.visual)), bars = [];
    list.forEach((v) => {
      if (kindOf(v) !== 'bar' || !axisHidden(v) || taken.has(nameOf(v))) return;
      const a = boxOf(v);
      const near = list.filter((n) => n !== v && parentOf(n) === parentOf(v) && showsNames(n) && !taken.has(nameOf(n))).map((n) => {
        const b = boxOf(n), gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), shared = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        return { n, gap, ok: gap >= -2 && gap <= 24 && shared >= Math.min(a.h, b.h) / 2 };
      }).filter((c) => c.ok).sort((x, y) => x.gap - y.gap);
      if (near.length) { bars.push({ bars: nameOf(v), names: nameOf(near[0].n) }); taken.add(nameOf(v)); taken.add(nameOf(near[0].n)); }
    });
    return { on: onKept, bars };
  }

  function mirrorPage(page, visuals, opts) {
    const list = Array.isArray(visuals) ? visuals : [], byName = {};
    list.forEach((v) => { if (isObj(v) && (typeof v.name === 'string' || typeof v.name === 'number')) byName[v.name] = v; });
    const widthOf = (v) => { const parent = isObj(v) && (typeof v.parentGroupName === 'string' || typeof v.parentGroupName === 'number') ? byName[v.parentGroupName] : null; return parent && isObj(parent.position) ? parent.position.width : isObj(page) ? page.width : undefined; };
    let units; try { units = unitsOf(list); } catch (e) { units = { on: [], bars: [] }; }
    // where each member of a unit goes (its x in the twin), and the bars that keep their direction
    const at = {}, keepBars = new Set();
    units.bars.forEach((u) => {
      const a = boxOf(byName[u.bars]), b = boxOf(byName[u.names]), W = widthOf(byName[u.bars]); if (!Number.isFinite(W)) return;
      const left = Math.min(a.x, b.x), right = Math.max(a.x + a.w, b.x + b.w), left2 = W - right;
      at[u.bars] = round(left2 + a.x - left); at[u.names] = round(left2 + b.x - left); keepBars.add(u.bars);
    });
    units.on.forEach((u) => {
      const a = boxOf(byName[u.visual]), h = boxOf(byName[u.host]), W = widthOf(byName[u.host]); if (!Number.isFinite(W)) return;
      const hx = at[u.host] != null ? at[u.host] : W - h.x - h.w;
      at[u.visual] = round(hx + a.x - h.x);
    });
    const kinds = {}, custom = [], unreadable = [], measures = [], waterfallsKept = [], kept = [], out = list.map((v) => {
      const W = widthOf(v), n = nameOf(v);
      // (the backstop: whatever the file holds, a visual that can't be mirrored is copied as it is and listed)
      let r; try { r = mirrorVisual(v, W, keepBars.has(n) ? Object.assign({}, opts, { keepDirection: true }) : opts); } catch (e) { r = { json: v, kind: 'unreadable', changes: [] }; }
      if (n != null && at[n] != null && isObj(r.json) && isObj(r.json.position)) r.json.position.x = at[n];
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      if (r.kind === 'custom') custom.push(String(v.name));
      if (r.kind === 'unreadable') unreadable.push(isObj(v) && v.name != null ? String(v.name) : '(no name)');
      if (r.measures) measures.push(...r.measures);
      if (r.kind === 'waterfallKept') waterfallsKept.push({ name: String(v.name), why: r.why });
      (r.kept || []).forEach((x) => kept.push(Object.assign({ name: String(v.name) }, x)));
      return r.json;
    });
    return { visuals: out, kinds, custom, unreadable, units, measures, waterfallsKept, kept };
  }

  // ---- texts: what a reader sees that the report itself says (the model's data values are not here) ----
  // ids: page:<page>, title:<page>/<visual>, textbox:<page>/<visual>/<paragraph>.<run>, button:<page>/<visual>,
  // field:<queryRef> (one per field across the report), bookmark:<name>
  const eachProjection = (v, fn) => { const qs = isObj(v.query) && v.query.queryState; if (isObj(qs)) Object.keys(qs).forEach((r) => (projections(v.query, r) || []).forEach((x) => { if (isObj(x)) fn(x); })); };
  // a text box's runs with their paragraph and run numbers as the file has them (the ids' numbers)
  const eachRun = (v, fn) => (entries(v.objects, 'general') || []).forEach((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).forEach((para, i) => {
    if (isObj(para)) runsOf(para).forEach((run, j) => { if (isObj(run)) fn(run, i, j); });
  }));
  function textsOfVisual(pageId, json) {
    const out = [];
    if (!isObj(json) || !isObj(json.visual)) return out;
    const v = json.visual, where = pageId + '/' + json.name;
    const t = (entries(v.visualContainerObjects, 'title') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null);
    if (t != null && kindOf(json) !== 'button') out.push({ id: 'title:' + where, kind: 'title', text: t });
    if (kindOf(json) === 'textbox') eachRun(v, (run, i, j) => {
      if (typeof run.value === 'string' && run.value.trim()) out.push({ id: `textbox:${where}/${i}.${j}`, kind: 'textbox', text: run.value });
    });
    if (kindOf(json) === 'button') { const b = (entries(v.objects, 'text') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null); if (b != null) out.push({ id: 'button:' + where, kind: 'button', text: b }); }
    eachProjection(v, (x) => { if (typeof x.queryRef === 'string' && x.queryRef) out.push({ id: 'field:' + x.queryRef, kind: 'field', text: String(x.displayName != null ? x.displayName : (x.nativeQueryRef || x.queryRef)) }); });
    eachTextProp(json, (p) => out.push({ id: 'text:' + where + '/' + p.key, kind: TEXT_KIND[p.prop] || 'text', text: p.text }));
    return out;
  }
  // (0.3.0 D3, the laptop's proof of rc.2: the twin left 15 alt texts, the cards' "No data" and a button's tooltip in
  // English) every other text of a visual's formatting a viewer meets: its alt text (read aloud, and in the selection
  // pane), a card's text for a blank value, a button's tooltips, a subtitle... one id per property:
  // text:<page>/<visual>/<o (objects) | c (container)>.<card>.<entry>.<property>. The title and a button's text keep their ids
  const TEXT_PROPS = ['altText', 'showBlankAs', 'enabledTooltip', 'disabledTooltip', 'tooltip', 'text', 'titleText', 'subTitleText', 'placeholderText', 'labelText', 'headerText', 'tooltipText'];
  const TEXT_KIND = { altText: 'altText', showBlankAs: 'blankText', enabledTooltip: 'buttonTooltip', disabledTooltip: 'buttonTooltip', tooltip: 'buttonTooltip' };
  function eachTextProp(json, fn) {
    const v = json.visual, button = kindOf(json) === 'button';
    [['o', v.objects], ['c', v.visualContainerObjects]].forEach(([w, bag]) => { if (!isObj(bag)) return; Object.keys(bag).forEach((card) => {
      (Array.isArray(bag[card]) ? bag[card] : []).forEach((e, i) => { if (!isObj(e) || !isObj(e.properties)) return; TEXT_PROPS.forEach((prop) => {
        // (0.3.0 A3) a button's own title (the visual's title card: off by default, still the name a screen reader may
        // read, and shown when switched on) is listed with the other texts, so it takes the button's approved Arabic
        if (prop === 'text' && ((w === 'c' && card === 'title' && !button) || (w === 'o' && card === 'text' && button))) return;
        const s = strOf(e.properties[prop]); if (s != null && /\p{L}/u.test(s)) fn({ key: `${w}.${card}.${i}.${prop}`, prop, entry: e, text: s });
      }); });
    }); });
  }
  // labels: { id: text } (the user's approved texts). Returns how many were applied
  function labelVisual(pageId, json, labels) {
    if (!isObj(json) || !isObj(json.visual) || !labels) return 0;
    const v = json.visual, where = pageId + '/' + json.name; let n = 0;
    const has = (id) => Object.prototype.hasOwnProperty.call(labels, id);
    if (has('title:' + where)) (entries(v.visualContainerObjects, 'title') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['title:' + where]); n++; } });
    if (kindOf(json) === 'textbox') eachRun(v, (run, i, j) => { const id = `textbox:${where}/${i}.${j}`; if (has(id)) { run.value = String(labels[id]); n++; } });
    if (kindOf(json) === 'button' && has('button:' + where)) (entries(v.objects, 'text') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['button:' + where]); n++; } });
    eachProjection(v, (x) => { if (typeof x.queryRef === 'string' && has('field:' + x.queryRef)) { x.displayName = String(labels['field:' + x.queryRef]); n++; } });
    eachTextProp(json, (p) => { const id = 'text:' + where + '/' + p.key; if (has(id)) { p.entry.properties[p.prop] = str(labels[id]); n++; } });
    return n;
  }

  // ---- the phone layout (0.3.0 D3: the twin copied mobile.json as it was: English texts, the KPI row left to right) ----
  // A visual's mobile.json holds its phone position and its own formatting (sizes, and texts the writer shortened or
  // wrapped for the phone). Its texts are read as the visual's, with the visual's type, and take the ids 'phone:' + the
  // visual's id for that text; the phone canvas is 323 wide (report-rules.js MEASURED.PHONE_W), and every position in
  // mobile.json is a page position, grouped or not (DESKTOP-TESTS.md, round 1): x' = 323 - x - width for every box
  const PHONE_W = 323;
  const phoneView = (json, mobile) => ({ name: json.name, visual: { visualType: json.visual.visualType, objects: mobile.objects, visualContainerObjects: mobile.visualContainerObjects } });
  function textsOfMobile(pageId, json, mobile) {
    if (!isObj(json) || !isObj(json.visual) || !isObj(mobile)) return [];
    return textsOfVisual(pageId, phoneView(json, mobile)).filter((t) => t.kind !== 'field').map((t) => Object.assign(t, { id: 'phone:' + t.id }));
  }
  // labels: { id: text } with the 'phone:' ids. Returns how many were applied (mobile is changed in place)
  // (SQ4, D3-S1: the phone header kept the English title's 14pt, and a longer Arabic title was cut) a text box's
  // paragraph of one run, relabelled, takes the writer's phone title size for its new text in its phone box
  // (pbip-sizing.js phoneTitleSize), never larger than it was; a paragraph of several runs keeps its sizes
  const Sizing = () => (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing || null);
  const MARKS = /[\u200e\u200f\u2066-\u2069]/g;
  // (0.3.1 TW1, SQ4-S2: the twin kept the English phone card title's wrap for a longer Arabic one) a new card on the
  // phone as the writer lays it (its value and title sizes in mobile.json) takes the writer's rule for its Arabic title
  // (pbip-sizing.js phoneCardFit): its full name (the alt text, else the title, as the writer reads it) on one line, or
  // on two (titleWrap) with the two-line card fit; one too long for two lines stays on one line, which Power BI ends
  // with "…" (the approved text is never shortened here). Only where that name is not the original's (was). o: { font, was }
  const textAt = (v, bag, key) => { const e = (entries(isObj(v) && isObj(v.visual) ? v.visual.visualContainerObjects : null, bag) || []).find((x) => isObj(x.properties) && !x.selector); return e ? strOf(e.properties[key]) : null; };
  const fullName = (v) => { const a = textAt(v, 'general', 'altText'); return a != null && a.trim() ? a : textAt(v, 'title', 'text'); };
  function phoneCard(json, mobile, o) {
    const Z = Sizing(), p = mobile.position, vco = isObj(mobile.visualContainerObjects) ? mobile.visualContainerObjects : null;
    const tl = vco && Array.isArray(vco.title) && isObj(vco.title[0]) && isObj(vco.title[0].properties) ? vco.title[0].properties : null;
    const val = (entries(mobile.objects, 'value') || []).find((e) => isObj(e.properties) && e.properties.fontSize !== undefined);
    if (!Z || !Z.make || json.visual.visualType !== 'cardVisual' || !tl || !val || !isObj(p) || !Number.isFinite(p.width) || !Number.isFinite(p.height)) return;
    const full = fullName(json); if (full == null || !full.trim() || (o.was && full === fullName(o.was))) return;
    const size = parseFloat(lit(tl.fontSize)) || 10, value = parseFloat(lit(val.properties.fontSize)) || 20;
    const f = Z.make({ font: o.font || 'Segoe UI', LABEL: 10 }).phoneCardFit(full.replace(MARKS, ''), p.width, p.height, size, Math.max(20, value));
    if (f.mode === 'wrap') { tl.text = str(full); tl.titleWrap = mk('true'); } else delete tl.titleWrap;
    val.properties.fontSize = mk(f.c.V + 'D');
    (entries(mobile.objects, 'padding') || []).forEach((e) => { if (isObj(e.properties) && e.properties.paddingUniform !== undefined) e.properties.paddingUniform = mk(f.c.I + 'D'); });
    (entries(vco, 'padding') || []).forEach((e) => { if (isObj(e.properties)) ['top', 'bottom', 'left', 'right'].forEach((k) => { if (e.properties[k] !== undefined) e.properties[k] = mk(f.c.P + 'D'); }); });
  }
  function labelMobile(pageId, json, mobile, labels, o) {
    if (!isObj(json) || !isObj(json.visual) || !isObj(mobile) || !labels) return 0;
    const sub = {}; Object.keys(labels).forEach((k) => { if (k.startsWith('phone:')) sub[k.slice(6)] = labels[k]; });
    const view = phoneView(json, mobile), was = new Map();
    if (kindOf(json) === 'textbox') eachRun(view.visual, (run, i, j) => { if (Object.prototype.hasOwnProperty.call(sub, `textbox:${pageId}/${json.name}/${i}.${j}`)) was.set(run, run.value); });
    const n = labelVisual(pageId, view, sub), Z = Sizing(), p = mobile.position, w = isObj(p) && Number.isFinite(p.width) ? p.width : NaN;
    if (Z && Z.phoneTitleSize && Number.isFinite(w)) (entries(mobile.objects, 'general') || []).forEach((e) => (isObj(e.properties) && Array.isArray(e.properties.paragraphs) ? e.properties.paragraphs : []).forEach((para) => {
      const rs = isObj(para) ? runsOf(para) : []; if (rs.length !== 1 || !isObj(rs[0]) || !was.has(rs[0]) || rs[0].value === was.get(rs[0])) return;
      const st = rs[0].textStyle, m = isObj(st) && /^(\d+(?:\.\d+)?)pt$/.exec(String(st.fontSize || '')); if (!m) return;
      const size = Z.phoneTitleSize(String(rs[0].value).replace(MARKS, ''), w, +m[1]); if (size < +m[1]) st.fontSize = size + 'pt';
    }));
    phoneCard(json, mobile, o || {});
    return n;
  }
  // the phone box mirrored on the 323-wide canvas, a text box's paragraphs to the right (centred kept), as on the page.
  // Returns a new object; a mobile.json of an unexpected shape is returned as it is
  function mirrorMobile(json, mobile0) {
    if (!isObj(mobile0)) return mobile0;
    const mobile = clone(mobile0), p = mobile.position;
    if (isObj(p) && Number.isFinite(p.x) && Number.isFinite(p.width)) p.x = Math.max(0, round(PHONE_W - p.x - p.width));
    mirrorShadow(mobile.visualContainerObjects);
    if (isObj(json) && kindOf(json) === 'textbox') paragraphsOf(mobile).forEach((para) => { if (para.horizontalTextAlignment !== 'center') para.horizontalTextAlignment = 'right'; });
    return mobile;
  }

  // DataArcus's own page background when no picture is given: a fully transparent 1 x 1 PNG (create_report writes it so
  // the theme's page colour shows). Base64, the one copy: the MCP writes it from here
  const BLANK_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4AWMAAQAABQABNtCI3QAAAABJRU5ErkJggg==';
  // the image names a page's background and wallpaper use ('x.png'), as written in its objects
  const pageImages = (page) => (isObj(page) && isObj(page.objects) ? ['background', 'wallpaper'].flatMap((k) => (entries(page.objects, k) || []).filter((e) => isObj(e.properties) && e.properties.image !== undefined)
    .map((e) => { const im = e.properties.image, n = isObj(im) && isObj(im.image) ? im.image.name : null, v = n && n.expr && n.expr.Literal ? String(n.expr.Literal.Value).replace(/^'|'$/g, '') : null; return v; })) : []);
  // a page drawn on a picture (T-1): Power BI has no setting that mirrors a page's background image. (rc.22, B-137: the
  // twin of a report DataArcus wrote kept its pages left to right: their background is the transparent placeholder, not a
  // picture.) opts.blank(name): true for an image that is the placeholder (the twin checks its bytes); such a page has no picture
  const pageHasPicture = (page, opts) => { const names = pageImages(page), blank = opts && opts.blank; return names.length > 0 && names.some((n) => !(blank && n != null && blank(n))); };
  const api = { kindOf, isCustom, KIND_WHAT, mirrorVisual, mirrorChart, MATRIX_RTL, MATRIX_RTL_DEFAULT, mirrorPage, unitsOf, textsOfVisual, labelVisual, textsOfMobile, labelMobile, mirrorMobile, PHONE_W, round, pageHasPicture, pageImages, BLANK_PNG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirror = api;
})(typeof self !== 'undefined' ? self : this);
