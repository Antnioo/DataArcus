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
  // (the fuzz test's F-T1..F-T3, 11 Oct: a report from anyone can hold any shape. Every read and write below checks the
  // shape it touches; a part of an unexpected shape is left exactly as it is, never written into or thrown on)
  const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const clone = (o) => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

  // ---- the kinds ----
  const COLUMN = ['columnChart', 'clusteredColumnChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'ribbonChart'];
  const BAR = ['barChart', 'clusteredBarChart', 'hundredPercentStackedBarChart'];
  const SLICER = ['slicer', 'advancedSlicerVisual', 'listSlicer', 'textSlicer'];
  // visuals with nothing that has a side (the labs and round 13: they move only). Any other Power BI visual (a waterfall,
  // a scatter chart, a decomposition tree...) is 'other': it moves only too, but the plan says no setting is proven
  // for it (the cross-review's T6), instead of claiming it has no side
  const SIDELESS = ['card', 'multiRowCard', 'kpi', 'gauge', 'donutChart', 'pieChart', 'funnel', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'image', 'shape', 'basicShape'];
  // a custom visual: the shared catalog's test (visual-types.js; the reading block uses the same one). A visual with no
  // type at all is treated as custom too: moved only
  const VT = typeof module !== 'undefined' && module.exports ? require('./visual-types.js') : root.DAVisualTypes;
  const isCustom = (type) => !type || VT.isCustom(type);
  function kindOf(json) {
    if (!isObj(json)) return 'unreadable';
    if (isObj(json.visualGroup)) return 'group';
    if (!isObj(json.visual)) return 'unreadable';
    const t = json.visual.visualType;
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
    other: 'other visuals (waterfall, scatter...): moved only; no right-to-left setting is proven for them',
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
  const LEGEND = { Top: 'TopRight', TopLeft: 'TopRight', TopRight: 'TopLeft', Bottom: 'BottomRight', BottomLeft: 'BottomRight', BottomRight: 'BottomLeft', Left: 'Right', Right: 'Left', LeftCenter: 'RightCenter', RightCenter: 'LeftCenter' };
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

  // ---- one visual ----
  // json: visual.json of the original; W: the width it is placed in (the page's, or its parent group's)
  // opts: { timeRightToLeft (default true), dateTables: [names] }. Returns { json (a new object), kind, changes }
  function mirrorVisual(json0, W, opts) {
    const o = opts || {};
    if (!isObj(json0)) return { json: json0, kind: 'unreadable', changes: [] };
    const json = clone(json0), kind = kindOf(json), changes = [];
    const p = isObj(json.position) ? json.position : {};
    if (Number.isFinite(p.x) && Number.isFinite(p.width) && Number.isFinite(W)) { p.x = round(W - p.x - p.width); changes.push('position'); }
    const v = json.visual;
    if (!isObj(v) || kind === 'custom' || kind === 'group' || kind === 'unreadable') return { json, kind, changes };
    // the visual's formatting cards: made when missing; an unexpected shape there gets a detached bag (nothing written)
    const bagOf = (name) => (v[name] === undefined ? (v[name] = {}) : isObj(v[name]) ? v[name] : {});
    const objects = () => bagOf('objects');
    const vco = () => bagOf('visualContainerObjects');
    // charts
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
        const s = sd.sort[0], byCategory = c0 && sameField(s.field, c0.field);
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
      }
    }
    // tables, matrices, new cards
    if (kind === 'table') {
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
    if (kind === 'matrix') { const ps = projections(v.query, 'Values'); if (ps && ps.length > 1) { ps.reverse(); changes.push('values'); } }
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
    return { json, kind, changes };
  }

  // ---- one page: every visual mirrored, W from its parent group ----
  // visuals: [visual.json]; opts as mirrorVisual's. Returns { visuals: [json] in the same order, kinds: { kind: n }, custom: [names] }
  function mirrorPage(page, visuals, opts) {
    const list = Array.isArray(visuals) ? visuals : [], byName = {};
    list.forEach((v) => { if (isObj(v) && (typeof v.name === 'string' || typeof v.name === 'number')) byName[v.name] = v; });
    const kinds = {}, custom = [], unreadable = [], out = list.map((v) => {
      const parent = isObj(v) && (typeof v.parentGroupName === 'string' || typeof v.parentGroupName === 'number') ? byName[v.parentGroupName] : null;
      const W = parent && isObj(parent.position) ? parent.position.width : isObj(page) ? page.width : undefined;
      // (the backstop: whatever the file holds, a visual that can't be mirrored is copied as it is and listed)
      let r; try { r = mirrorVisual(v, W, opts); } catch (e) { r = { json: v, kind: 'unreadable', changes: [] }; }
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      if (r.kind === 'custom') custom.push(String(v.name));
      if (r.kind === 'unreadable') unreadable.push(isObj(v) && v.name != null ? String(v.name) : '(no name)');
      return r.json;
    });
    return { visuals: out, kinds, custom, unreadable };
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
    return out;
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
    return n;
  }

  // a page drawn on a picture (T-1): Power BI has no setting that mirrors a page's background image
  const pageHasPicture = (page) => isObj(page) && isObj(page.objects) && ['background', 'wallpaper'].some((k) => (entries(page.objects, k) || []).some((e) => isObj(e.properties) && e.properties.image !== undefined));
  const api = { kindOf, isCustom, KIND_WHAT, mirrorVisual, mirrorPage, textsOfVisual, labelVisual, round, pageHasPicture };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirror = api;
})(typeof self !== 'undefined' ? self : this);
