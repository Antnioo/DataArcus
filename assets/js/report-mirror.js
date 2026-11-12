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
 * Its parts (0.3.2 SP10 and SP39, the Codex split map): the named rules in mirror-policy.js, the chart transforms in
 * mirror-charts.js, the text runs and literals in mirror-text.js, the group and badge geometry in mirror-units.js; this
 * file is the page orchestration: each visual's transforms in their order (mirrorVisual), each page (mirrorPage), the
 * tables and matrices it writes, the phone layout's boxes, the page pictures, and the one api the MCP and the website read.
 * Browser and Node (module.exports / window.DAMirror). */
(function (root) {
  'use strict';
  // the named rules (which family a visual is, which axis is time, which content keeps left to right) and the PBIR
  // readers they use: mirror-policy.js (0.3.2 SP10), one home for each
  const P = typeof module !== 'undefined' && module.exports ? require('./mirror-policy.js') : root.DAMirrorPolicy;
  const { isObj, lit, strOf, entries, projections, first, kindOf, isCustom } = P;
  // the chart transforms and the PBIR writers they share: mirror-charts.js (0.3.2 SP39), one home for each
  const Charts = typeof module !== 'undefined' && module.exports ? require('./mirror-charts.js') : root.DAMirrorCharts;
  const { mk, str, clone, plainEntry, listIn, sameField, mirrorChart, MATRIX_RTL, MATRIX_RTL_DEFAULT } = Charts;
  // the text runs and literals (what a reader sees, its ids and the approved Arabic): mirror-text.js (0.3.2 SP39)
  const Text = typeof module !== 'undefined' && module.exports ? require('./mirror-text.js') : root.DAMirrorText;
  const { paragraphsOf, textsOfVisual, labelVisual, textsOfMobile, labelMobile } = Text;
  // the group and badge geometry (the units mirrored as one, the width a visual is placed in): mirror-units.js (0.3.2 SP39)
  const Units = typeof module !== 'undefined' && module.exports ? require('./mirror-units.js') : root.DAMirrorUnits;
  const { unitsOf, nameOf, round } = Units;
  const KIND_WHAT = {
    column: 'column, line, area and combo charts: value axis at the right, categories right to left by the sort',
    // (0.3.2 PF1, B-380) the same charts over time with timeRightToLeft false (mirror-charts.js chartsOf)
    columnTime: 'column, line, area and combo charts over time, kept left to right as asked (timeRightToLeft false): value axis at the right, their periods in the original\'s order from the left',
    waterfall: 'waterfall charts: no Total column in Arabic: the last step on the left ends at the total, with no total label either (Power BI 2.159 does not draw it); every step\'s tooltip gives the running total. Power BI draws a waterfall left to right only and its axis holds only the model\'s members, so each is written as a stacked column chart drawn as a waterfall (an invisible base under each step, from the twin\'s own report measures): the running total in the original\'s order, the first period at the right and each step rising or falling from the one at its right, the value axis at the right, labels on the steps (a fall shown negative), the original waterfall\'s increase and decrease colours, no legend (a stacked column chart\'s legend would list the invisible base); hovering the empty space under a step shows its base in the tooltip. The series are named in Arabic: القاعدة، ارتفاع، انخفاض، ارتفاع تحت الصفر، انخفاض تحت الصفر، الإجمالي الجاري، الإجمالي',
    // (D7) waterfallRtl "native": Power BI's own waterfall, kept as it is
    waterfallNative: 'waterfall charts: the waterfall reads left to right, as Power BI draws it',
    waterfallTime: 'waterfall charts over time, kept left to right as asked (timeRightToLeft false): still waterfalls, their order as it is, the value axis at the right',
    waterfallKept: 'waterfall charts the running total can\'t follow (a breakdown, a sort by the value, a text category with no order): A waterfall reads left to right in Power BI: its order is not mirrored (kept a waterfall, left to right, the value axis at the right)',
    bar: 'bar charts: names at the right, bars growing from the right',
    table: 'tables: columns in reverse order (the first at the right), text columns right-aligned; one led by a text column says «الإجمالي» on its total row, as create_report\'s (a "Row label" measure)',
    matrix: 'matrices: values in reverse order (rows keep their order)',
    // (0.3.1 MX3) a heatmap whose rows are the days of the week, all in its box
    heatmapNames: 'heatmaps by weekday whose 7 rows all fit their box and whose row headers English sets a width for: their weekday names written beside the grid, at its right, in that width (a one-column table lined up row by row with the matrix, whose own row headers are hidden); Power BI\'s matrix has no right-to-left setting',
    // (0.3.1 MX1 C) a matrix the user chose to write flat (matrixAsTable): mcp/lib/twin-plan.mjs counts these
    matrixFlattened: 'matrices you chose to write flat (matrixAsTable): a table, one column per row level (the upper levels repeated on each row), then the values, its columns in reverse order so the names read at the right. Lost: its +/- grouping, its group subtotal rows and its blank rows between groups (a grand total the matrix shows is kept, at the bottom)',
    // (0.3.1 MX1) a matrix with one row field and no column field
    matrixAsTable: 'matrices with one row field and no column field: written as a table so its first column reads on the right: Power BI\'s matrix has no right-to-left setting. The table keeps the matrix\'s fields, names, widths, colours, sort, totals and styles, its columns in reverse order (the row field at the right)',
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
  // (0.3.1 FX6, Codex's D04: a shadow the visual takes from its theme, with no preset of its own, kept its side) the
  // theme's preset for the visual (visualStyles <type> then "*", state "*": the first dropShadow entry that gives one), of
  // a side, becomes the visual's own preset, mirrored. Only the visuals mirrored here (the Arabic pages); the theme and
  // the English pages are not changed. Returns whether one was written
  const themePreset = (theme, type) => { const vs = isObj(theme) && isObj(theme.visualStyles) ? theme.visualStyles : null; if (!vs) return null;
    for (const t of [type, '*']) { const st = typeof t === 'string' && isObj(vs[t]) && isObj(vs[t]['*']) ? vs[t]['*'] : null, e = st && Array.isArray(st.dropShadow) ? st.dropShadow.find((x) => isObj(x) && typeof x.preset === 'string') : null; if (e) return e.preset; }
    return null; };
  function themeShadow(v, theme) {
    if (!isObj(v) || (v.visualContainerObjects !== undefined && !isObj(v.visualContainerObjects))) return false;
    const ds = v.visualContainerObjects ? v.visualContainerObjects.dropShadow : undefined; if (ds !== undefined && !Array.isArray(ds)) return false;
    const own = (ds || []).filter((e) => isObj(e) && !e.selector); if (own.some((e) => isObj(e.properties) && e.properties.preset !== undefined)) return false;
    const p = themePreset(theme, v.visualType); if (!p || !SHADOW_SIDE[p]) return false;
    if (own.length && isObj(own[0].properties)) own[0].properties.preset = str(SHADOW_SIDE[p]);
    else { if (!v.visualContainerObjects) v.visualContainerObjects = {}; (v.visualContainerObjects.dropShadow = ds || []).unshift({ properties: { preset: str(SHADOW_SIDE[p]) } }); }
    return true;
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
    else if (isObj(v) && themeShadow(v, isObj(o.theme) ? o.theme : isObj(o.waterfall) ? o.waterfall.theme : null)) changes.push('shadow');
    if (!isObj(v) || P.movesOnly(kind)) return { json, kind, changes };
    // the visual's formatting cards: made when missing; an unexpected shape there gets a detached bag (nothing written)
    const bagOf = (name) => (v[name] === undefined ? (v[name] = {}) : isObj(v[name]) ? v[name] : {});
    const objects = () => bagOf('objects');
    const vco = () => bagOf('visualContainerObjects');
    // charts (mirror-charts.js chartsOf, 0.3.2 SP39): a donut's legend order, the waterfall, then the bar, column,
    // line, area and combo charts' rules (chartRtl, shared with create_report's writer: mirrorChart)
    const ch = Charts.chartsOf(Object.assign({}, o, { visual: v, kind }));
    kind = ch.kind; changes.push(...ch.changes); kept.push(...ch.kept); measures = ch.measures; why = ch.why;
    // (0.3.2 PF1, B-380) a chart over time kept left to right is said as itself (KIND_WHAT.columnTime) once mirrored
    const said = (k) => (ch.timeKept && k === 'column' ? 'columnTime' : k);
    // (0.3.0 L2) a button slicer on one row (the writer's pills): its buttons read from the right, by a descending sort on
    // its field (a sort it already has is turned round); one of several rows moves only
    // (one row: mirror-policy.js oneRowButtons)
    if (kind === 'slicer' && P.oneRowButtons(v, p.height)) {
      const f0 = first(projections(v.query, 'Values'));
      const sd = isObj(v.query.sortDefinition) && Array.isArray(v.query.sortDefinition.sort) && isObj(v.query.sortDefinition.sort[0]) ? v.query.sortDefinition.sort[0] : null;
      if (sd) sd.direction = sd.direction === 'Descending' ? 'Ascending' : 'Descending'; else v.query.sortDefinition = { sort: [{ field: clone(f0.field), direction: 'Descending' }] };
      kind = 'pills'; changes.push('order');
    }
    // tables, matrices, new cards
    // (0.3.1 MX1, the owner 1 Nov: "the patient id in page 2 in er still shows it on the left") a flat matrix (one row
    // field, no column field) is written as a table, whose columns the twin reverses: its row field at the right
    if (kind === 'matrix' && o.matrixAsTable !== false) { const t = tableOf(v); if (t.ok) { Object.keys(v).forEach((k) => { delete v[k]; }); Object.assign(v, t.visual); kind = 'matrixAsTable'; changes.push('matrix as table'); } }
    if (kind === 'table' || kind === 'matrixAsTable') {
      // (0.3.0 F1) a status icon right of its value ('After', English) goes left of it ('Before'), where an Arabic reader ends
      const ob = isObj(v.objects) ? v.objects : null, vals = ob && Array.isArray(ob.values) ? ob.values : null;
      (vals || []).forEach((e) => { const ic = isObj(e) && isObj(e.properties) && isObj(e.properties.icon) ? e.properties.icon : null; if (ic && strOf(ic.layout) === 'After') { ic.layout = str('Before'); changes.push('status icons'); } });
      const ps = projections(v.query, 'Values');
      if (ps && ps.length > 1) { ps.reverse(); changes.push('columns'); }
      // (0.3.1 MX4, laptop part 10: ER p2 flat, Full Name and Department read left-aligned while the plan said right) a
      // flat matrix's Min or Max of a text column (the model's text columns, o.textColumns) is a text column too
      const textAgg = (f) => { const a = isObj(f.Aggregation) ? f.Aggregation : null, c = a && isObj(a.Expression) && isObj(a.Expression.Column) ? a.Expression.Column : null;
        return !!c && (a.Function === 3 || a.Function === 4) && isObj(c.Expression) && isObj(c.Expression.SourceRef) && Array.isArray(o.textColumns) && o.textColumns.includes(c.Expression.SourceRef.Entity + '.' + c.Property); };
      (ps || []).filter((x) => isObj(x) && isObj(x.field) && (x.field.Column || textAgg(x.field)) && typeof x.queryRef === 'string').forEach((x) => {
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
    if (kind === 'matrix') Charts.matrixRtl(v, o.matrixRtl, changes);
    if (kind === 'newCard') {
      const ps = projections(v.query, 'Data');
      // (0.3.1 MP1e, laptop part 8: Fintech's four status lines, orientation "1D", came out bottom to top) only values
      // that run left to right are reversed: a vertical list ("1D") keeps its order
      const vertical = P.verticalValues(v);
      if (ps && ps.length > 1) {
        if (!vertical) ps.reverse();
        const es = listIn(objects(), 'value');
        let e = es ? es.find((y) => isObj(y) && isObj(y.selector) && y.selector.id === 'default') : null;
        if (es && !e) { e = { properties: {}, selector: { id: 'default' } }; es.push(e); }
        if (e && e.properties === undefined) e.properties = {};
        // (MP1e: RepeatIQ's centred KPI values were set right and their first letter cut; Consumer Complaints' text values
        // kept their own entries, left) every value entry right-aligned, a centred one kept centred
        // (0.3.1 MP1f, laptop part 9: RepeatIQ p4's refund rate and Fintech p2's 54 and 44.4% went right: their own entries,
        // with no alignment, take the centred default) under a centred default, an entry with no alignment of its own stays so
        const centred = !!e && strOf(e.properties.horizontalAlignment) === 'center';
        (es || []).forEach((y) => { if (!isObj(y) || !isObj(y.properties)) return; const a = strOf(y.properties.horizontalAlignment); if (a === 'center' || (a == null && centred && y !== e)) return; y.properties.horizontalAlignment = str('right'); });
        changes.push('values');
      }
      // (MP1e, laptop part 8: Call Center's agent cards, one card visual of small multiples, kept each photo and name at
      // the left) the card image and the small multiples' header go to the other side
      let toRight = false;
      (entries(v.objects, 'image') || []).forEach((y) => { const q = isObj(y.properties) ? strOf(y.properties.position) : null; if (q === 'Left' || q === 'Right') { y.properties.position = str(q === 'Left' ? 'Right' : 'Left'); toRight = toRight || q === 'Left'; changes.push('image'); } });
      // (0.3.1 MP1f, laptop part 9: Call Center p2's agent name, the card's value, stood at the card's far left, its photo
      // now at the right) a card whose image goes right: its value with no alignment set beside it, right (centred kept)
      if (toRight && !(ps && ps.length > 1)) {
        const es = listIn(objects(), 'value');
        let e = es ? es.find((y) => isObj(y) && isObj(y.selector) && y.selector.id === 'default') : null;
        if (es && !e) { e = { properties: {}, selector: { id: 'default' } }; es.push(e); }
        if (e && !isObj(e.properties)) e.properties = {};
        if (e && strOf(e.properties.horizontalAlignment) == null) { e.properties.horizontalAlignment = str('right'); changes.push('value'); }
      }
      (entries(v.objects, 'smallMultiplesLayout') || []).forEach((y) => { const q = isObj(y.properties) ? strOf(y.properties.headerPosition) : null; if (q === 'Left' || q === 'Right') { y.properties.headerPosition = str(q === 'Left' ? 'Right' : 'Left'); changes.push('header'); } });
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
    if (titles || P.titled(kind)) {
      const e = plainEntry(vco(), 'title'), a = strOf(e.properties.alignment);
      if (a !== 'center' && a !== 'right') { e.properties.alignment = str('right'); changes.push('title'); }
    }
    return Object.assign({ json, kind: said(kind), changes }, measures ? { measures } : {}, why ? { why } : {}, kept.length ? { kept } : {});
  }


  // ---- (0.3.1 MX1) a flat matrix written as a table ----
  // The owner, 1 Nov: a matrix's row headers stay at its left in the twin (no Microsoft property moves them: M1, laptop
  // parts 7 and 8). A matrix that shows exactly what a table shows (one row field, no column field) is written as a
  // table (tableEx), the row field its first column, then the values; the table's own mirror then reverses them.
  // What carries over, compared property by property in Microsoft's capabilities (@microsoft/powerbi-core-visual-schema
  // 0.1.3, data/capabilities.json, pivotTable and tableEx objects): every card both have, as it is, less the matrix-only
  // properties (TABLE_DROP); subTotals.rowSubtotals -> total.totals; the style of the matrix's total, subTotals and
  // rowTotal cards (in that order) -> total; the row headers' font and background colours and alignment -> the row
  // field's columnFormatting (its values only); rowHeaders' layout properties and columnTotal dropped (one level, no
  // column field). Anything a table cannot show the same way keeps the matrix a matrix, with why (tableOf().why).
  // Two or more row levels stay a matrix: whether Desktop shows them flat (stepped layout, expand state, repeated
  // headers) is not measured.
  const TABLE_CARDS = ['general', 'grid', 'columnHeaders', 'values', 'total', 'columnFormatting', 'columnWidth', 'sparklines', 'accessibility'];
  const TABLE_DROP = { general: ['layout'], columnHeaders: ['titleAlignment', 'urlIcon', 'customColumnWidthGranularView', 'showExpandCollapseButtons', 'expandCollapseButtonsColor', 'expandCollapseButtonsSize', 'autoExpand'],
    values: ['bandedRowHeaders', 'valuesOnRow'], total: ['applyToHeaders'], columnFormatting: ['styleSubtotals'] };
  const TOTAL_STYLE = ['fontFamily', 'fontSize', 'bold', 'italic', 'underline', 'fontColor', 'backColor'];
  // a table styles all its values alike: the row headers' own font must be the values' (or neither sets it)
  // (MX2, RepeatIQ p4 and p5: row headers not wrapped) the row headers' wordWrap is dropped, not a reason to keep a
  // matrix: the table's values keep their own (a long name then wraps as the values do)
  const ROW_FONT = ['fontFamily', 'fontSize', 'bold', 'italic', 'underline'];
  const MATRIX_ONLY_DROP = ['columnTotal', 'blankRows'];
  // (MX1 C, the reviewer's add-on of 1 Nov: Fintech's grouped matrix) o.levels: two or more row levels too, written flat,
  // one column per level (the user's choice, matrixAsTable: its +/- grouping and group subtotal rows are lost; its per-level
  // subtotal settings dropped, the grand total kept as the matrix shows it)
  function tableOf(v0, o0) {
    const lv = !!(o0 && o0.levels), no = (why) => ({ ok: false, why });
    if (!isObj(v0) || v0.visualType !== 'pivotTable' || !isObj(v0.query) || !isObj(v0.query.queryState)) return no('its query has a shape not expected');
    const qs = v0.query.queryState, rows = projections(v0.query, 'Rows'), cols = projections(v0.query, 'Columns'), vals = qs.Values === undefined ? [] : projections(v0.query, 'Values');
    if (cols && cols.length) return no('a Columns field: its row headers cannot move');
    if (!rows || !rows.length) return no('no row field');
    if (rows.length > 1 && !lv) return no('two or more row levels: whether Desktop shows them flat (stepped layout, expand state, repeated headers) is not measured');
    if (!vals || ![rows, vals].every((ps) => ps.every((x) => isObj(x) && isObj(x.field) && typeof x.queryRef === 'string'))) return no('its query has a shape not expected');
    if (Object.keys(qs).some((r) => !['Rows', 'Columns', 'Values'].includes(r))) return no('a role a table does not have');
    if (v0.objects !== undefined && !isObj(v0.objects)) return no('its formatting has a shape not expected');
    const ob = isObj(v0.objects) ? v0.objects : {};
    if (Object.keys(ob).some((k) => !Array.isArray(ob[k]) || ob[k].some((e) => !isObj(e) || (e.properties !== undefined && !isObj(e.properties))))) return no('its formatting has a shape not expected');
    const plain = (k) => (ob[k] || []).filter((e) => !e.selector).reduce((a, e) => Object.assign(a, e.properties || {}), {});
    const own = Object.keys(ob).filter((k) => !TABLE_CARDS.includes(k) && !['rowHeaders', 'subTotals', 'rowTotal', 'total'].concat(MATRIX_ONLY_DROP).includes(k));
    if (own.length) return no(`a matrix-only setting (${own.slice(0, 3).join(', ')})`);
    if ((ob.values || []).some((e) => lit((e.properties || {}).valuesOnRow) === 'true')) return no('values shown on rows');
    if (!lv && (ob.blankRows || []).some((e) => lit((e.properties || {}).showBlankRows) === 'true')) return no('blank rows shown');
    // (MX2, Fintech p3: per-level total entries, and a style entry for the rows' totals, under row subtotals off: they
    // show nothing, so they keep no matrix)
    const totalsOff = lit(plain('subTotals').rowSubtotals) === 'false';
    if ((lv || totalsOff ? ['rowHeaders', 'rowTotal', 'total'] : ['rowHeaders', 'subTotals', 'rowTotal', 'total']).some((k) => (ob[k] || []).some((e) => e.selector))) return no('its row headers or totals are set per field or level');
    const rh = plain('rowHeaders'), st = plain('subTotals'), vp = plain('values');
    const apart = ROW_FONT.filter((p) => rh[p] !== undefined && JSON.stringify(rh[p]) !== JSON.stringify(vp[p]));
    // (MX3, ER p2: its row headers at their own size) in the chosen flat form they take the values' font (FLAT_LOST)
    if (apart.length && !lv) return no(`its row headers are styled apart from its values (${apart.join(', ')}): a table styles its values alike`);
    if (!lv && lit(st.rowSubtotals) !== 'false' && strOf(st.rowSubtotalsPosition) === 'Top') return no('its total row is at the top: a table\'s is at the bottom');
    if (!lv && !totalsOff && ['rowSubtotalsLabel', 'levelSubtotalLabel'].some((p) => st[p] !== undefined)) return no('its total row has a name of its own');
    // the table
    const v = clone(v0), o = {};
    v.visualType = 'tableEx';
    const levels = rows.map((x) => { const c = clone(x); delete c.active; return c; });
    v.query.queryState = { Values: { projections: levels.concat(clone(vals)) } };
    delete v.expansionStates;
    Object.keys(ob).filter((k) => TABLE_CARDS.includes(k) && k !== 'total').forEach((k) => {
      o[k] = clone(ob[k]).map((e) => { const drop = TABLE_DROP[k] || []; if (isObj(e.properties)) drop.forEach((p) => { delete e.properties[p]; }); return e; })
        .filter((e) => !(e.properties && !Object.keys(e.properties).length && !e.selector && (TABLE_DROP[k] || []).length && (ob[k] || []).length > 1));
    });
    // the totals: shown as the row subtotals were (one level: its total row), styled as the matrix styled them
    const tot = {};
    ['total', 'subTotals', 'rowTotal'].forEach((k) => { const p = plain(k); TOTAL_STYLE.forEach((x) => { if (p[x] !== undefined) tot[x] = clone(p[x]); }); });
    if (st.rowSubtotals !== undefined) tot.totals = clone(st.rowSubtotals);
    if (Object.keys(tot).length) o.total = [{ properties: tot }];
    // the row headers' colours and alignment: the row field's column (its values; its header is a column header)
    const cf = {}; ['fontColor', 'backColor', 'alignment'].forEach((p) => { if (rh[p] !== undefined) cf[p] = clone(rh[p]); });
    if (Object.keys(cf).length) levels.forEach((lev) => {
      if (!o.columnFormatting) o.columnFormatting = [];
      const e = o.columnFormatting.find((x) => isObj(x.selector) && x.selector.metadata === lev.queryRef);
      const props = Object.assign({}, clone(cf), { styleHeader: mk('false'), styleValues: mk('true'), styleTotal: mk('false') });
      if (e) e.properties = Object.assign(props, e.properties || {}); else o.columnFormatting.push({ properties: props, selector: { metadata: lev.queryRef } });
    });
    if (Object.keys(o).length) v.objects = o; else delete v.objects;
    return { ok: true, visual: v };
  }
  // (MX1) the twin's "Row label" column of a table led by a text column (mcp/lib/twin-pages.mjs rowLabelTable: the text
  // column first at width 0, a measure showing it last) takes that column's own colours and where they apply (a flat
  // matrix's row headers: its values only), so the column a reader sees keeps them. Returns whether it changed one
  function rowLabelStyle(json) {
    const v = isObj(json) && isObj(json.visual) ? json.visual : null, ps = v ? projections(v.query, 'Values') : null;
    if (!ps || ps.length < 2 || !isObj(v.objects) || !Array.isArray(v.objects.columnFormatting)) return false;
    const a = ps[0], b = ps[ps.length - 1], m = isObj(b) && isObj(b.field) && isObj(b.field.Measure) ? b.field.Measure : null;
    if (!isObj(a) || !isObj(a.field) || !a.field.Column || !m || !isObj(m.Expression) || !isObj(m.Expression.SourceRef) || m.Expression.SourceRef.Schema !== 'extension') return false;
    const at = (r) => v.objects.columnFormatting.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === r && isObj(e.properties));
    const src = at(a.queryRef), dst = at(b.queryRef);
    if (!src || !dst || (src.properties.fontColor === undefined && src.properties.backColor === undefined)) return false;
    ['fontColor', 'backColor', 'styleHeader', 'styleValues', 'styleTotal'].forEach((k) => { if (src.properties[k] !== undefined) dst.properties[k] = clone(src.properties[k]); });
    return true;
  }
  // (MX1, lab only: mcp/lab/heatmap-names.mjs B2; wired to no path until the laptop says it lines up) a matrix with a
  // column field keeps its row headers at its left; its row names shown at its right instead: the matrix's own row
  // header text the colour of its row header background, its row header column given the narrowest width
  // (columnWidth with the row field's queryRef: o.rowHeaderWidth, default 1), and a one-column table of the row field
  // at its right edge (o.width wide, default 90), same top, height, title height, header, font, size and row padding,
  // its header text blank (a table's header cannot be turned off: tableEx has no columnHeaders.show), right-aligned.
  // json: the matrix's visual.json (as the twin wrote it). Returns { matrix, table } (two visual.json) or null
  const VISUAL_SCHEMA = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  function rowNamesBeside(json, opts) {
    const o = opts || {}, W = Number.isFinite(o.width) ? o.width : 90, bg = typeof o.background === 'string' ? o.background : '#FFFFFF';
    if (kindOf(json) !== 'matrix' || !isObj(json.position) || !Number.isFinite(json.position.width) || json.position.width <= W * 2) return null;
    const m = clone(json), v = m.visual, rows = projections(v.query, 'Rows'), row = rows && rows.length === 1 && isObj(rows[0]) && typeof rows[0].queryRef === 'string' ? rows[0] : null;
    if (!row) return null;
    if (!isObj(v.objects)) v.objects = {};
    const fill = (c) => ({ solid: { color: str(c) } });
    const rh = plainEntry(v.objects, 'rowHeaders').properties;
    if (rh.backColor === undefined) rh.backColor = fill(bg);
    rh.fontColor = clone(rh.backColor);
    const cw = listIn(v.objects, 'columnWidth') || [], had = cw.find((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === row.queryRef);
    const narrow = mk((Number.isFinite(o.rowHeaderWidth) ? o.rowHeaderWidth : 1) + 'D');
    if (had) had.properties = { value: narrow }; else cw.push({ properties: { value: narrow }, selector: { metadata: row.queryRef } });
    m.position.width = round(m.position.width - W);
    const pick = (card, keys) => { const p = ((isObj(v.objects) && Array.isArray(v.objects[card]) ? v.objects[card] : []).find((e) => isObj(e) && !e.selector && isObj(e.properties)) || {}).properties || {}; const out = {}; keys.forEach((k) => { if (p[k] !== undefined) out[k] = clone(p[k]); }); return out; };
    const font = ['fontFamily', 'fontSize', 'bold', 'italic', 'underline'];
    const vals = Object.assign(pick('values', font), pick('rowHeaders', font)), head = pick('columnHeaders', font.concat(['backColor', 'wordWrap'])), grid = pick('grid', ['rowPadding', 'textSize', 'gridHorizontal', 'gridHorizontalColor', 'gridHorizontalWeight', 'gridVertical']);
    const sub = pick('subTotals', ['rowSubtotals']);
    const vco = clone(isObj(v.visualContainerObjects) ? v.visualContainerObjects : {});
    // the same title height (its text the background's colour), no border of its own
    (Array.isArray(vco.title) ? vco.title : []).forEach((e) => { if (isObj(e) && isObj(e.properties)) e.properties.fontColor = fill(bg); });
    vco.border = [{ properties: { show: mk('false') } }];
    const field = Object.assign(clone(row), { displayName: ' ' }); delete field.active;
    const sd = isObj(v.query.sortDefinition) && Array.isArray(v.query.sortDefinition.sort) ? v.query.sortDefinition.sort.filter((x) => isObj(x) && sameField(x.field, row.field)) : [];
    // (0.3.1 MX4, laptop part 10: Desktop refused the whole report, "Failed to load the report.", the validator's
    // PBIR_JSON_FILE_NO_SCHEMA on this file) the one visual built here rather than cloned: the matrix's own $schema
    const table = { $schema: typeof json.$schema === 'string' ? json.$schema : VISUAL_SCHEMA, name: String(json.name) + 'Names', position: Object.assign(clone(json.position), { x: round(m.position.x + m.position.width), width: W, z: (Number.isFinite(json.position.z) ? json.position.z : 0) + 1 }),
      visual: { visualType: 'tableEx', query: Object.assign({ queryState: { Values: { projections: [field] } } }, sd.length ? { sortDefinition: { sort: clone(sd), isDefaultSort: false } } : {}),
        objects: { values: [{ properties: Object.assign(vals, { backColorPrimary: clone(rh.backColor), backColorSecondary: clone(rh.backColor) }) }], columnHeaders: [{ properties: Object.assign(head, { fontColor: clone(head.backColor || fill(bg)) }) }],
          grid: [{ properties: grid }], total: [{ properties: { totals: sub.rowSubtotals !== undefined ? sub.rowSubtotals : mk('true') } }],
          columnFormatting: [{ properties: { alignment: str('Right'), styleHeader: mk('true'), styleValues: mk('true'), styleTotal: mk('true') }, selector: { metadata: row.queryRef } }] },
        visualContainerObjects: vco } };
    return { matrix: m, table };
  }
  // (MX1 C) a matrix written flat as the user chose (matrixAsTable): its visual.json with the table in place of the matrix
  // (not mirrored), or { why } when a table cannot show it. Returns { ok, json } or { ok: false, why }
  const FLAT_LOST = 'its +/- grouping, its group subtotal rows and its blank rows between groups (a grand total the matrix shows is kept, at the bottom), and a font its row headers have of their own (its size, family or weight: a table has no per-column font, so they take the values\' font)';
  function flatTable(json) {
    if (kindOf(json) !== 'matrix') return { ok: false, why: 'not a matrix' };
    let t; try { t = tableOf(json.visual, { levels: true }); } catch (e) { t = { ok: false, why: 'its query has a shape not expected' }; }
    if (!t.ok) return t;
    const j = clone(json); j.visual = t.visual; return { ok: true, json: j };
  }
  // (0.3.1 MX3, laptop part 9: B2 lined up row by row in Desktop at 1280 and 1920) a heatmap's weekday names beside its
  // grid, the twin's choice when its rows are the 7 days of the week and they all fit its box without a scroll: told
  // from the row field's name (Weekday, Day Name, Day of Week) and the box's height, never from the data. A row is
  // its text size in points x 4/3 x 1.5, plus 2 (measured: Call Center p1's 7 days and its header shown whole at 10 in
  // 188); the header is one row more, a total one more, a shown title 1.6 rows, the box's own margins 10.
  // (0.3.1 MX4, laptop part 10: the matrix narrowed by 95 for the names, the grid behind a horizontal scroll) the grid
  // keeps its English cells' width: the names take only the room the English row headers had (R: their own width when
  // set, else the longest weekday name, English or Arabic, at the text size + 12, a cell's padding of 5 to 6 a side,
  // measured in DESKTOP-TESTS "Item 3, the table"), less the 1 the twin's hidden row headers keep. Names that need more
  // than that room (a row header set narrower): B1, said.
  // (0.3.1 MX5, laptop part 11: Call Center's weekdays are "Mon".."Sun", English's row headers about 36, so names 82 wide
  // left the grid 42 short: hours 17-18 behind a scroll, the hour chart off its hours) the strip is English's own, read
  // from the file: the row field's columnWidth. The names table takes it less the 1 the hidden row headers keep, so the
  // grid is English's exactly (the box less its padding less the strip). Not set (Desktop sizes it from the data, which
  // the twin never reads): B1, said. The rows (ER p1 f2c68e52: 7 rows whole in 188, where the old estimate said about
  // 202; Call Center p1: 7 and a header whole in 188 at 10): a row is the line of its text, 1.887 x pt (15.1 at 8pt,
  // DESKTOP-TESTS "Item 3, the table"), + 2 of padding; the header one row, a total one, a title 1.6 rows, the box's own
  // margins 6 (ER p1: 8 rows of 11pt are 182 and were whole in 188, so the margins are at most 6).
  // (0.3.1 MX7, laptop part 12: the names table at the strip less 1, no column width, no word wrap setting: Desktop wrapped
  // «Mon» as «M / on», the rows grew off the grid's and the table drew its own scrollbar) a table cell's padding is
  // wider than a matrix row header's (5 to 6 a side, DESKTOP-TESTS "Item 3, the table"), so the names table takes the
  // strip less 1 plus TABLE_PAD_MORE, from the box's slack: the matrix's own padding beside its grid (English's right,
  // the twin's left: o.mirrored), which the twin's matrix gives up, so its grid keeps English's width. Less padding
  // there than that: B1, said.
  // Returns { ok: true, textSize, width (the names table's), slack } or { ok: false, why }
  // (0.3.3 AU2, B-402) the rows are the days of the week by their name ("Weekday", «يوم الأسبوع»): time-names.js
  // isWeekdayName, its one home (D-1104-15, D-1104-12)
  const TN = typeof module !== 'undefined' && module.exports ? require('./time-names.js') : root.DATimeNames;
  const ROW_LINE = 15.1 / 8, ROW_PAD = 2, ROW_TITLE = 1.6, ROW_MARGINS = 6, TABLE_PAD_MORE = 6, TABLE_EDGES = 4;
  const padOf = (json, side) => { const e = (entries(json.visual.visualContainerObjects, 'padding') || []).find((x) => !x.selector && isObj(x.properties) && x.properties[side] !== undefined); const n = e ? parseFloat(String(lit(e.properties[side])).replace(/D$/, '')) : 0; return Number.isFinite(n) ? n : 0; };
  function heatmapBeside(json, opts) {
    if (kindOf(json) !== 'matrix' || !isObj(json.position) || !Number.isFinite(json.position.height)) return { ok: false, why: 'not a matrix' };
    const v = json.visual, rows = projections(v.query, 'Rows'), cols = projections(v.query, 'Columns');
    if (!cols || !cols.length) return { ok: false, why: 'no Columns field' };
    const f = rows && rows.length === 1 && isObj(rows[0]) && isObj(rows[0].field) ? rows[0].field : null, name = f && isObj(f.Column) ? f.Column.Property : null;
    if (typeof name !== 'string' || !TN.isWeekdayName(name)) return { ok: false, why: 'its rows are not the days of the week (told from the row field\'s name)' };
    const ob = isObj(v.objects) ? v.objects : {}, pv = (k, x) => { const e = (Array.isArray(ob[k]) ? ob[k] : []).find((y) => isObj(y) && !y.selector && isObj(y.properties) && y.properties[x] !== undefined); return e ? e.properties[x] : undefined; };
    const pt = parseFloat(String(lit(pv('grid', 'textSize')) || lit(pv('values', 'fontSize')) || lit(pv('rowHeaders', 'fontSize')) || '10').replace(/D$/, '')) || 10;
    // (0.3.2 HM1, B-299: Codex F1-1, rowPadding 6 at 10pt in a box 190 passed: its 8 rows are 269) a row counts the
    // matrix's grid.rowPadding, above and below its text
    const rp = parseFloat(String(lit(pv('grid', 'rowPadding'))).replace(/D$/, ''));
    const rowH = ROW_LINE * pt + ROW_PAD + (Number.isFinite(rp) && rp > 0 ? 2 * rp : 0), total = lit(pv('subTotals', 'rowSubtotals')) !== 'false' ? 1 : 0;
    const t = (entries(v.visualContainerObjects, 'title') || []).find((e) => !e.selector && isObj(e.properties)), titled = !!(t && lit(t.properties.show) === 'true');
    const need = (7 + 1 + total) * rowH + (titled ? rowH * ROW_TITLE : 0) + ROW_MARGINS;
    if (need > json.position.height + 0.5) return { ok: false, why: `its 7 rows may not all fit its box (about ${Math.round(need)} high, its box ${Math.round(json.position.height)}): names beside it could not follow a scroll` };
    const rq = rows[0].queryRef, set = (entries(ob, 'columnWidth') || []).find((e) => isObj(e.selector) && e.selector.metadata === rq && isObj(e.properties) && e.properties.value !== undefined);
    const R = set ? parseFloat(String(lit(set.properties.value)).replace(/D$/, '')) : NaN;
    if (!set) return { ok: false, why: 'its row header\'s width is not set in English (Desktop sizes it from the data, never read): names beside it could not keep English\'s grid width' };
    if (!Number.isFinite(R) || R < 2) return { ok: false, why: 'its row header\'s width in English is not a width the names can take' };
    const slack = padOf(json, opts && opts.mirrored ? 'left' : 'right');
    if (slack < TABLE_PAD_MORE - 0.01) return { ok: false, why: `its box has no room beside its grid for the names table's cell padding (${TABLE_PAD_MORE} more than a row header's; its padding there ${round(slack)}): names beside it would wrap` };
    if (json.position.width <= (R - 1 + TABLE_PAD_MORE) * 2) return { ok: false, why: 'its box is too narrow for the names beside its grid' };
    return { ok: true, textSize: pt, width: round(R - 1 + TABLE_PAD_MORE), slack: TABLE_PAD_MORE, rowHeight: rowH, need };
  }
  // the twin's heatmap (mirrored) and its names table: the names table in the room of the English row headers (no padding
  // of its own at its sides, so its column is all of it), the matrix the rest of the box, its grid filling it
  // (columnHeaders.columnAdjustment "growToFit", Microsoft's capabilities 0.1.3), so the names stand at its right edge.
  // Returns { matrix, table } or null
  // (MX7) json: the twin's (mirrored) matrix; its left padding gives the names table the cell padding's room. The names
  // table: its column set to its width, word wrap off on its values and header (tableEx values.wordWrap,
  // columnHeaders.wordWrap, Microsoft's capabilities), the matrix's text size and row padding, so its rows are the grid's
  function heatmapNames(json, o) {
    const h = heatmapBeside(json, { mirrored: true }); if (!h.ok) return null;
    const r = rowNamesBeside(json, Object.assign({}, o || {}, { width: h.width })); if (!r) return null;
    plainEntry(r.matrix.visual.objects, 'columnHeaders').properties.columnAdjustment = str('growToFit');
    const mp = plainEntry(r.matrix.visual.visualContainerObjects, 'padding').properties;
    mp.left = mk(round(padOf(json, 'left') - h.slack) + 'D');
    const vco = r.table.visual.visualContainerObjects, pe = plainEntry(vco, 'padding').properties;
    pe.left = mk('0D'); pe.right = mk('0D');
    const to = r.table.visual.objects, rq = to.columnFormatting[0].selector.metadata;
    // (0.3.2 HM1, B-300, laptop part 14, Desktop 2.159: its one column 43.06 in its 43.1 box drew a horizontal scrollbar
    // thumb under the last name: the table's own edges count) its column TABLE_EDGES narrower than its box: 1 px of the
    // table's edge line a side, and 1 a side for Desktop's rounding to device pixels; still wider than English's strip
    to.columnWidth = [{ properties: { value: mk(round(h.width - TABLE_EDGES) + 'D') }, selector: { metadata: rq } }];
    to.values[0].properties.wordWrap = mk('false');
    Object.assign(to.columnHeaders[0].properties, { wordWrap: mk('false'), autoSizeColumnWidth: mk('false') });
    const g = to.grid[0].properties; if (g.textSize === undefined) g.textSize = mk(h.textSize + 'D');
    // (0.3.1 MX8, laptop part 13: the names table's 7 rows and its blank header drew a few px taller than the 188.3 the
    // matrix's header and 7 rows fit in: a vertical scrollbar over «Mor», «Wec», then a horizontal one half over «Sun»)
    // Microsoft's capabilities give a tableEx no header switch (columnHeaders has no show) and no row height (a row is
    // grid.textSize and grid.rowPadding, both the matrix's above): its blank header takes the matrix's column header
    // outline (a table draws a line under its header by default) and its values the row headers' outline (the names
    // stand for them); its box one row of the matrix's text taller (same top, so its rows stay level with the grid's; until 0.3.2 HM1, below),
    // kept inside its page or group (o.bottom: the room under the box's top there)
    const mo = isObj(json.visual.objects) ? json.visual.objects : {}, OUT = ['outlineStyle', 'outlineWeight', 'outlineColor'];
    const plainOf = (card) => ((Array.isArray(mo[card]) ? mo[card] : []).find((e) => isObj(e) && !e.selector && isObj(e.properties)) || {}).properties || {};
    const ch = plainOf('columnHeaders'), rh = plainOf('rowHeaders');
    OUT.forEach((k) => { if (ch[k] !== undefined) to.columnHeaders[0].properties[k] = clone(ch[k]); if (rh[k] !== undefined) to.values[0].properties[k] = clone(rh[k]); });
    // (0.3.2 HM1, B-300, laptop part 14: the box one row taller, 209.2 against the matrix's 188.3) the box exactly the
    // matrix's (rowNamesBeside's: same y, same height), so it never leaves the page or group the matrix is in
    // (o.bottom no longer read); its header and rows, rowPadding counted (B-299), fit it by heatmapBeside's own check
    return r;
  }
  // json: a visual.json; { ok: true } when the twin writes it as a table, else { ok: false, why }
  function flatMatrix(json) {
    if (kindOf(json) !== 'matrix') return { ok: false, why: 'not a matrix' };
    try { const t = tableOf(json.visual); return t.ok ? { ok: true } : t; } catch (e) { return { ok: false, why: 'its query has a shape not expected' }; }
  }


  // ---- one page: every visual mirrored, W from its parent group ----
  // visuals: [visual.json]; opts as mirrorVisual's. Returns { visuals: [json] in the same order, kinds: { kind: n }, custom: [names] }
  function mirrorPage(page, visuals, opts) {
    // (mirror-units.js, 0.3.2 SP39) the visuals by name, the width each is placed in, the units and where each member goes
    const list = Array.isArray(visuals) ? visuals : [], byName = Units.byNameOf(list);
    const widthOf = (v) => Units.frameWidth(page, byName, v);
    let units; try { units = unitsOf(list); } catch (e) { units = { on: [], bars: [] }; }
    const { at, keepBars } = Units.placesOf(units, byName, page);
    const kinds = {}, custom = [], unreadable = [], measures = [], waterfallsKept = [], kept = [], asTables = [], out = list.map((v) => {
      const W = widthOf(v), n = nameOf(v);
      // (the backstop: whatever the file holds, a visual that can't be mirrored is copied as it is and listed)
      let r; try { r = mirrorVisual(v, W, keepBars.has(n) ? Object.assign({}, opts, { keepDirection: true }) : opts); } catch (e) { r = { json: v, kind: 'unreadable', changes: [] }; }
      if (n != null && at[n] != null && isObj(r.json) && isObj(r.json.position)) r.json.position.x = at[n];
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      if (r.kind === 'custom') custom.push(String(v.name));
      if (r.kind === 'unreadable') unreadable.push(isObj(v) && v.name != null ? String(v.name) : '(no name)');
      if (r.measures) measures.push(...r.measures);
      if (r.kind === 'waterfallKept') waterfallsKept.push({ name: String(v.name), why: r.why });
      if (r.kind === 'matrixAsTable') asTables.push(String(v.name));
      (r.kept || []).forEach((x) => kept.push(Object.assign({ name: String(v.name) }, x)));
      return r.json;
    });
    return { visuals: out, kinds, custom, unreadable, units, measures, waterfallsKept, kept, asTables };
  }

  // ---- texts: mirror-text.js (0.3.2 SP39): textsOfVisual, labelVisual, textsOfMobile, labelMobile ----

  // ---- the phone layout (0.3.0 D3: the twin copied mobile.json as it was: English texts, the KPI row left to right) ----
  // A visual's mobile.json holds its phone position and its own formatting (sizes, and texts the writer shortened or
  // wrapped for the phone). Its texts are read as the visual's, with the visual's type, and take the ids 'phone:' + the
  // visual's id for that text; the phone canvas is 323 wide (report-rules.js MEASURED.PHONE_W), and every position in
  // mobile.json is a page position, grouped or not (DESKTOP-TESTS.md, round 1): x' = 323 - x - width for every box
  const PHONE_W = 323;
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
  const api = { kindOf, isCustom, KIND_WHAT, mirrorVisual, mirrorChart, MATRIX_RTL, MATRIX_RTL_DEFAULT, flatMatrix, flatTable, FLAT_LOST, rowLabelStyle, rowNamesBeside, heatmapBeside, heatmapNames, mirrorPage, unitsOf, textsOfVisual, labelVisual, textsOfMobile, labelMobile, mirrorMobile, PHONE_W, round, pageHasPicture, pageImages, BLANK_PNG };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirror = api;
})(typeof self !== 'undefined' ? self : this);
