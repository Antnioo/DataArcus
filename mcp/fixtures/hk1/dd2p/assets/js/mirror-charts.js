/* DataArcus mirror charts: the Arabic twin's chart transforms (0.3.2 SP39, from report-mirror.js; the Codex split map,
 * B-280). One place for the right-to-left rules of every chart, for the twin (report-mirror.js mirrorVisual) and
 * create_report's writer (mirrorChart; 0.3.1 M1, the owner: "make sure the AR and twin are using the same engine"),
 * and the PBIR writers they share (one copy: report-mirror.js and mirror-text.js take them from here, D-1016-01).
 * Interface (each function changes only the visual it is given, in place, and returns what it changed; no state is
 * kept between calls; the policy's answers are mirror-policy.js's, the waterfall's builder visual-gallery.js's):
 *  - chartsOf({ visual, kind, dateTables, dateColumns, textColumns, timeRightToLeft, waterfallRtl, waterfall,
 *    keepDirection }) -> { kind, changes, kept, measures, why }: a visual's chart transforms, in their order: a donut's
 *    legend order, a waterfall's way (native, kept over time, or the stacked column chart that reads from the right),
 *    then chartRtl. kind: kindOf's answer in, the kind the twin says out ('waterfallNative', 'waterfallKept'...);
 *    changes: what changed, in order; kept: values kept as they are (a legend position outside the catalog);
 *    measures: the waterfall's report measures (the caller writes them), else null; why: why a waterfall was kept
 *  - chartRtl(v, kind, o, changes, kept): the bar, column and kept waterfall's axes, sort and legend
 *  - mirrorChart(visual, opts) -> visual: create_report's writer, a chart it writes for a right-to-left report
 *  - matrixRtl(v, mode, changes): the matrix's lab switch (MATRIX_RTL, MATRIX_RTL_DEFAULT)
 *  - the writers: mk(value), str(text) (a PBIR literal), clone(json), plainEntry(bag, card), listIn(bag, name),
 *    sameField(a, b); LEGEND (a legend position and its mirror)
 * Browser and Node (module.exports / window.DAMirrorCharts). */
(function (root) {
  'use strict';
  const P = typeof module !== 'undefined' && module.exports ? require('./mirror-policy.js') : root.DAMirrorPolicy;
  const { isObj, strOf, lit, entries, projections, first, kindOf } = P;
  const mk = (v) => ({ expr: { Literal: { Value: v } } });
  const str = (s) => mk("'" + String(s).replace(/'/g, "''") + "'");
  // (the fuzz test's F-T1..F-T3, 11 Oct: a report from anyone can hold any shape. Every read and write below checks the
  // shape it touches; a part of an unexpected shape is left exactly as it is, never written into or thrown on)
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));
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
  const sameField = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // the right-to-left waterfall's builder, shared with the report writer (D1)
  const Gallery = () => (typeof module !== 'undefined' && module.exports ? require('./visual-gallery.js') : root.DAGallery || null);

  // (0.3.1 FX2, the laptop's H-1: "TopRight" was mirrored to "TopLeft", a value Power BI does not have, PBIR_FORMATTING_ENUM_INVALID)
  // a legend's positions as Microsoft's catalog has them (@microsoft/powerbi-core-visual-schema, every chart's
  // legend.position): Top is top left, Bottom bottom left, Left and Right their tops; the centred ones stay. A value
  // outside the catalog is kept as it is and said (kept)
  const LEGEND = { Top: 'TopRight', TopRight: 'Top', Bottom: 'BottomRight', BottomRight: 'Bottom', Left: 'Right', Right: 'Left', LeftCenter: 'RightCenter', RightCenter: 'LeftCenter', TopCenter: 'TopCenter', BottomCenter: 'BottomCenter' };

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
      const time = P.categoryIsTime(v, o.dateTables), keepTime = o.timeRightToLeft === false && time;
      if (sd) {
        // (0.3.0 S1, B-180) a sort by the category's own order key counts as a sort by the category: a helper of the
        // category's table in the visual's Tooltips role (the writer's Min of the month number, round 2; its "Month
        // start (sort)" report measure, O-13). Kept with time left to right, as a sort by the category itself is
        const s = sd.sort[0], entityOf = (f) => (isObj(f) && isObj(f.Column) ? f.Column : isObj(f) && isObj(f.Measure) ? f.Measure : isObj(f) && isObj(f.Aggregation) && isObj(f.Aggregation.Expression) ? f.Aggregation.Expression.Column : null);
        const ref = (f) => { const x = entityOf(f); return isObj(x) && isObj(x.Expression) && isObj(x.Expression.SourceRef) ? x.Expression.SourceRef.Entity : null; };
        const orderKey = c0 && ref(s.field) != null && ref(s.field) === ref(c0.field) && (projections(q, 'Tooltips') || []).some((t) => isObj(t) && sameField(t.field, s.field));
        const byCategory = c0 && (sameField(s.field, c0.field) || orderKey);
        if (!(keepTime && byCategory)) {
          s.direction = s.direction === 'Descending' ? 'Ascending' : 'Descending';
          // (0.3.1 MP1e, laptop part 8: AdventureWorks' lines on a 4-level date hierarchy kept the months inside a year
          // left to right) every further sort key that is a category level turns with the first
          const cats = projections(q, 'Category') || [];
          sd.sort.slice(1).forEach((x) => { if (isObj(x) && cats.some((c) => isObj(c) && sameField(c.field, x.field))) x.direction = x.direction === 'Descending' ? 'Ascending' : 'Descending'; });
          changes.push('sort');
        }
      } else if (c0 && c0.field !== undefined && !keepTime && (q.sortDefinition === undefined)) {
        // (MP1e: Consumer Complaints' Year and Month, sorted by the year alone) every level of the category descending
        const levels = (projections(q, 'Category') || []).filter((c) => isObj(c) && c.field !== undefined && isObj(c.field.HierarchyLevel));
        q.sortDefinition = { sort: (levels.length > 1 ? levels : [c0]).map((c) => ({ field: clone(c.field), direction: 'Descending' })), isDefaultSort: true };
        changes.push('sort');
      }
      // a continuous time axis (a date column, or a time category the model does not type text, not set Categorical):
      // inverted, time read from the right (mirror-policy.js invertsTimeAxis, T-2 and MP1e)
      if (P.invertsTimeAxis(v, o)) { plainEntry(objects(), 'categoryAxis').properties.invertAxis = mk('true'); changes.push('time axis'); }
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

  // ---- a visual's chart transforms (report-mirror.js mirrorVisual calls this after the place and the shadow, before
  // the pills, tables and cards; the order inside is the twin's since 0.3.0) ----
  function chartsOf(input) {
    const o = input, v = input.visual, changes = [], kept = [];
    let kind = input.kind, measures = null, why = null;
    const objects = () => (v.objects === undefined ? (v.objects = {}) : isObj(v.objects) ? v.objects : {});
    // (0.3.1 MP1f, laptop part 9: Call Center's legend donut, two measures and no category, read «● مُجابة ● غير مُجابة»
    // left to right while the mirrored value cards put the answered value at the right) a donut or pie whose legend lists
    // its measures (two or more in Y, no category) and is shown: the measures in reverse order, so the first stands at
    // the right, where the page now reads from; its slices, clockwise in reverse order, are the English ring in a mirror
    if (kind === 'plain' && ['donutChart', 'pieChart'].includes(v.visualType) && !projections(v.query, 'Category')) {
      const ys = projections(v.query, 'Y'), lg = entries(v.objects, 'legend'), hidden = (lg || []).some((e) => isObj(e.properties) && String(lit(e.properties.show)) === 'false');
      // (0.3.1 MX4, laptop part 10: «غير مُجابة»'s legend dot navy while its arc is orange) each measure keeps its colour:
      // one with no fill of its own took the theme's colour of its English place; that colour is written with it before
      // the order turns (ThemeDataColor ColorId 2 + its place: 0 and 1 are the background and foreground, the data colours
      // follow; part 9's evidence: Answered's own ColorId 2 and Unanswered's place 2 both the theme's first two colours)
      if (ys && ys.length > 1 && lg && !hidden) {
        const dp = listIn(objects(), 'dataPoint');
        if (dp) ys.forEach((y, i) => { if (!isObj(y) || typeof y.queryRef !== 'string' || i > 7) return;
          const own = dp.some((e) => isObj(e) && isObj(e.selector) && e.selector.metadata === y.queryRef && Object.keys(e.selector).length === 1 && isObj(e.properties) && e.properties.fill !== undefined);
          if (!own) dp.push({ properties: { fill: { solid: { color: { expr: { ThemeDataColor: { ColorId: 2 + i, Percent: 0 } } } } } }, selector: { metadata: y.queryRef } }); });
        ys.reverse(); changes.push('legend order');
      }
    }
    // charts: the bar, column, line, area, combo charts' rules (chartRtl, shared with create_report's writer: mirrorChart)
    // (o.keepDirection: a bar list mirrored as one block with its names beside it, T-6: its bars keep growing toward them)
    // (D7) opts.waterfallRtl "native" (visual-gallery.js WATERFALL_RTL_DEFAULT): Power BI's own waterfall kept as the
    // original has it, left to right (only its place is mirrored); "mirror": the stacked column chart below
    if (kind === 'waterfall') kind = P.waterfallKind(v, { mode: Gallery() ? Gallery().waterfallRtlOf(o.waterfallRtl) : 'native', timeRightToLeft: o.timeRightToLeft, dateTables: o.dateTables });
    // (D1) a waterfall: the stacked column chart that reads from the right, or kept left to right
    // (time kept left to right on request, opts.timeRightToLeft false: a waterfall over time stays one, its order as it is)
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
    return { kind, changes, kept, measures, why };
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

  const api = Object.freeze({ chartsOf, chartRtl, mirrorChart, matrixRtl, MATRIX_RTL, MATRIX_RTL_DEFAULT, LEGEND, mk, str, clone, plainEntry, listIn, sameField });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirrorCharts = api;
})(typeof self !== 'undefined' ? self : this);
