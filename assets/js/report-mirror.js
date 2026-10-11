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
 *  - legends: left and right swapped, TopRight when none is set; titles right-aligned (centred kept); text boxes
 *    right-aligned (centred kept); tables: columns reversed, text columns right-aligned; a matrix's values reversed;
 *    a new card's values reversed and right-aligned; buttons: a left text or icon goes right;
 *  - everything else (cards, slicers, the page navigator, maps, images, shapes, custom visuals) moves only.
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
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // ---- the kinds ----
  const COLUMN = ['columnChart', 'clusteredColumnChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'ribbonChart'];
  const BAR = ['barChart', 'clusteredBarChart', 'hundredPercentStackedBarChart'];
  const SLICER = ['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer'];
  // visuals with nothing that has a side (the labs and round 13: they move only). Any other Power BI visual (a waterfall,
  // a scatter chart, a decomposition tree...) is 'other': it moves only too, but the plan says no setting is proven
  // for it (the cross-review's T6), instead of claiming it has no side
  const SIDELESS = ['card', 'multiRowCard', 'kpi', 'gauge', 'donutChart', 'pieChart', 'funnel', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'image', 'shape', 'basicShape'];
  // a custom visual's type carries its id (letters and digits, like "ChicletSlicer1448559807354"); Power BI's own
  // types are plain words (the same test as check_report's)
  const isCustom = (type) => !/^[a-z][A-Za-z]*$/.test(String(type || ''));
  function kindOf(json) {
    if (json.visualGroup) return 'group';
    const t = (json.visual || {}).visualType;
    if (isCustom(t)) return 'custom';
    if (COLUMN.includes(t)) return 'column';
    if (BAR.includes(t)) return 'bar';
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
    bar: 'bar charts: names at the right, bars growing from the right',
    table: 'tables: columns in reverse order (the first at the right), text columns right-aligned',
    matrix: 'matrices: values in reverse order (rows keep their order)',
    newCard: 'new cards: values in reverse order, right-aligned',
    textbox: 'text boxes: right-aligned (centred kept)',
    button: 'buttons: a left-aligned text or icon goes right; links unchanged',
    navigator: 'page navigators: moved only',
    slicer: 'slicers: moved only (their items keep Power BI\'s own alignment)',
    custom: 'custom visuals: moved only, their settings left as they are',
    group: 'groups: mirrored with their visuals inside',
    plain: 'cards, gauges, donuts, funnels, treemaps, maps, images and shapes: moved only (nothing in them has a side)',
    other: 'other visuals (waterfall, scatter...): moved only; no right-to-left setting is proven for them'
  };

  // ---- small helpers ----
  const round = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? 0 : r; };
  const entries = (bag, name) => (bag && Array.isArray(bag[name]) ? bag[name] : null);
  // the entry without a selector (made when missing), where axis and legend switches go
  const plainEntry = (bag, name) => { const es = bag[name] || (bag[name] = []); let e = es.find((x) => !x.selector); if (!e) { e = { properties: {} }; es.unshift(e); } e.properties = e.properties || {}; return e; };
  const projections = (query, role) => (query && query.queryState && query.queryState[role] && Array.isArray(query.queryState[role].projections) ? query.queryState[role].projections : null);
  const sameField = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const LEGEND = { Top: 'TopRight', TopLeft: 'TopRight', TopRight: 'TopLeft', Bottom: 'BottomRight', BottomLeft: 'BottomRight', BottomRight: 'BottomLeft', Left: 'Right', Right: 'Left', LeftCenter: 'RightCenter', RightCenter: 'LeftCenter' };
  // a time category: a hierarchy level, a column of a date table, or a column named like a date part
  const TIME_NAME = /\b(date|month|year|quarter|week|day|weekday|period)s?\b|التاريخ|الشهر|السنة|الربع|الأسبوع|اليوم/i;
  function isTime(field, dateTables) {
    if (!field) return false;
    if (field.HierarchyLevel) return true;
    const c = field.Column; if (!c) return false;
    const ent = c.Expression && c.Expression.SourceRef && c.Expression.SourceRef.Entity;
    return (dateTables || []).includes(ent) || TIME_NAME.test(String(c.Property || ''));
  }

  // ---- one visual ----
  // json: visual.json of the original; W: the width it is placed in (the page's, or its parent group's)
  // opts: { timeRightToLeft (default true), dateTables: [names] }. Returns { json (a new object), kind, changes }
  function mirrorVisual(json0, W, opts) {
    const o = opts || {}, json = clone(json0), kind = kindOf(json), changes = [];
    const p = json.position || {};
    if (typeof p.x === 'number' && typeof p.width === 'number' && typeof W === 'number') { p.x = round(W - p.x - p.width); changes.push('position'); }
    const v = json.visual;
    if (!v || kind === 'custom' || kind === 'group') return { json, kind, changes };
    const objects = () => (v.objects = v.objects || {});
    const vco = () => (v.visualContainerObjects = v.visualContainerObjects || {});
    // charts
    if (kind === 'bar') {
      plainEntry(objects(), 'categoryAxis').properties.switchAxisPosition = mk('true');
      plainEntry(objects(), 'valueAxis').properties.invertAxis = mk('true');
      changes.push('axes');
    }
    if (kind === 'column') {
      plainEntry(objects(), 'valueAxis').properties.switchAxisPosition = mk('true');
      changes.push('value axis');
      const q = v.query, cat = projections(q, 'Category'), sd = q && q.sortDefinition && Array.isArray(q.sortDefinition.sort) && q.sortDefinition.sort[0] ? q.sortDefinition : null;
      const time = cat && cat[0] && isTime(cat[0].field, o.dateTables), keepTime = o.timeRightToLeft === false && time;
      if (sd) {
        const s = sd.sort[0], byCategory = cat && cat[0] && sameField(s.field, cat[0].field);
        if (!(keepTime && byCategory)) { s.direction = s.direction === 'Descending' ? 'Ascending' : 'Descending'; changes.push('sort'); }
      } else if (cat && cat[0] && !keepTime) {
        q.sortDefinition = { sort: [{ field: clone(cat[0].field), direction: 'Descending' }], isDefaultSort: true };
        changes.push('sort');
      }
    }
    // legends: a legend entry, or a legend role (Series, Legend) in the query
    // (charts only: the labs saw it there; a donut's or a map's legend is left as it is)
    if (kind === 'column' || kind === 'bar') {
      const legend = entries(v.objects, 'legend'), hasRole = !!(projections(v.query, 'Series') || projections(v.query, 'Legend'));
      if (legend || hasRole) {
        const e = plainEntry(objects(), 'legend'), cur = strOf(e.properties.position);
        const next = cur == null ? 'TopRight' : LEGEND[cur] || cur;
        if (next !== cur) { e.properties.position = str(next); changes.push('legend'); }
      }
    }
    // tables, matrices, new cards
    if (kind === 'table') {
      const ps = projections(v.query, 'Values');
      if (ps && ps.length > 1) { ps.reverse(); changes.push('columns'); }
      (ps || []).filter((x) => x.field && x.field.Column).forEach((x) => {
        const cf = objects().columnFormatting = objects().columnFormatting || [];
        let e = cf.find((y) => y.selector && y.selector.metadata === x.queryRef);
        if (!e) { e = { properties: {}, selector: { metadata: x.queryRef } }; cf.push(e); }
        const a = strOf(e.properties.alignment);
        if (a !== 'Center' && a !== 'Right') {
          e.properties.alignment = str('Right');
          ['styleHeader', 'styleValues', 'styleTotal'].forEach((k) => { if (e.properties[k] === undefined) e.properties[k] = mk('true'); });
          changes.push('alignment');
        }
      });
    }
    if (kind === 'matrix') { const ps = projections(v.query, 'Values'); if (ps && ps.length > 1) { ps.reverse(); changes.push('values'); } }
    if (kind === 'newCard') {
      const ps = projections(v.query, 'Data');
      if (ps && ps.length > 1) {
        ps.reverse();
        const es = objects().value = objects().value || [];
        let e = es.find((y) => y.selector && y.selector.id === 'default');
        if (!e) { e = { properties: {}, selector: { id: 'default' } }; es.push(e); }
        e.properties.horizontalAlignment = str('right');
        changes.push('values');
      }
    }
    // text
    if (kind === 'textbox') {
      ((entries(v.objects, 'general') || []).forEach((e) => ((e.properties || {}).paragraphs || []).forEach((para) => {
        if (para.horizontalTextAlignment !== 'center') { para.horizontalTextAlignment = 'right'; changes.push('text'); }
      })));
    }
    if (kind === 'button') {
      (entries(v.objects, 'text') || []).forEach((e) => { if (strOf((e.properties || {}).horizontalAlignment) === 'left') { e.properties.horizontalAlignment = str('right'); changes.push('text'); } });
      (entries(v.objects, 'icon') || []).forEach((e) => { if (strOf((e.properties || {}).placement) === 'left') { e.properties.placement = str('right'); changes.push('icon'); } });
    }
    // titles: an existing one right-aligned unless centred; a chart or table without one gets the alignment (its
    // default title is drawn at the left); visuals that only move get nothing
    const titles = entries(v.visualContainerObjects, 'title');
    if (titles || ['column', 'bar', 'table', 'matrix', 'newCard'].includes(kind)) {
      const e = plainEntry(vco(), 'title'), a = strOf(e.properties.alignment);
      if (a !== 'center' && a !== 'right') { e.properties.alignment = str('right'); changes.push('title'); }
    }
    return { json, kind, changes };
  }

  // ---- one page: every visual mirrored, W from its parent group ----
  // visuals: [visual.json]; opts as mirrorVisual's. Returns { visuals: [json] in the same order, kinds: { kind: n }, custom: [names] }
  function mirrorPage(page, visuals, opts) {
    const byName = {}; visuals.forEach((v) => { if (v && v.name != null) byName[v.name] = v; });
    const kinds = {}, custom = [], out = visuals.map((v) => {
      const parent = v.parentGroupName != null ? byName[v.parentGroupName] : null;
      const W = parent && parent.position ? parent.position.width : page.width;
      const r = mirrorVisual(v, W, opts);
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      if (r.kind === 'custom') custom.push(String(v.name));
      return r.json;
    });
    return { visuals: out, kinds, custom };
  }

  // ---- texts: what a reader sees that the report itself says (the model's data values are not here) ----
  // ids: page:<page>, title:<page>/<visual>, textbox:<page>/<visual>/<paragraph>.<run>, button:<page>/<visual>,
  // field:<queryRef> (one per field across the report), bookmark:<name>
  const eachProjection = (v, fn) => { const qs = v.query && v.query.queryState; if (qs) Object.keys(qs).forEach((r) => (projections(v.query, r) || []).forEach(fn)); };
  function textsOfVisual(pageId, json) {
    const out = [], v = json.visual, where = pageId + '/' + json.name;
    if (!v) return out;
    const t = (entries(v.visualContainerObjects, 'title') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null);
    if (t != null && kindOf(json) !== 'button') out.push({ id: 'title:' + where, kind: 'title', text: t });
    if (kindOf(json) === 'textbox') (entries(v.objects, 'general') || []).forEach((e) => ((e.properties || {}).paragraphs || []).forEach((para, i) => (para.textRuns || []).forEach((run, j) => {
      if (typeof run.value === 'string' && run.value.trim()) out.push({ id: `textbox:${where}/${i}.${j}`, kind: 'textbox', text: run.value });
    })));
    if (kindOf(json) === 'button') { const b = (entries(v.objects, 'text') || []).map((e) => strOf((e.properties || {}).text)).find((x) => x != null); if (b != null) out.push({ id: 'button:' + where, kind: 'button', text: b }); }
    eachProjection(v, (x) => { if (x.queryRef) out.push({ id: 'field:' + x.queryRef, kind: 'field', text: x.displayName != null ? x.displayName : (x.nativeQueryRef || x.queryRef) }); });
    return out;
  }
  // labels: { id: text } (the user's approved texts). Returns how many were applied
  function labelVisual(pageId, json, labels) {
    const v = json.visual, where = pageId + '/' + json.name; let n = 0;
    if (!v || !labels) return 0;
    const has = (id) => Object.prototype.hasOwnProperty.call(labels, id);
    if (has('title:' + where)) (entries(v.visualContainerObjects, 'title') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['title:' + where]); n++; } });
    if (kindOf(json) === 'textbox') (entries(v.objects, 'general') || []).forEach((e) => ((e.properties || {}).paragraphs || []).forEach((para, i) => (para.textRuns || []).forEach((run, j) => {
      const id = `textbox:${where}/${i}.${j}`; if (has(id)) { run.value = String(labels[id]); n++; }
    })));
    if (kindOf(json) === 'button' && has('button:' + where)) (entries(v.objects, 'text') || []).forEach((e) => { if (e.properties && e.properties.text) { e.properties.text = str(labels['button:' + where]); n++; } });
    eachProjection(v, (x) => { if (x.queryRef && has('field:' + x.queryRef)) { x.displayName = String(labels['field:' + x.queryRef]); n++; } });
    return n;
  }

  const api = { kindOf, isCustom, KIND_WHAT, mirrorVisual, mirrorPage, textsOfVisual, labelVisual, round };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirror = api;
})(typeof self !== 'undefined' ? self : this);
