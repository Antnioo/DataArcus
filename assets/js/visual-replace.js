/* DataArcus visual replace: a custom visual's visual.json written as a native Power BI visual (0.2.9, custom visuals,
 * step C; audit 6's "pure replaceVisual(visualJson, mapping) in the writer beside report-mirror").
 * Pure JSON in, JSON out: the caller reads and writes the files, and only after the owner approved the replacement in
 * the plan. The mapping comes from the reading block (mcp/lib/visual-meaning.mjs nativeFor / replacementsOf):
 * { native: '<visualType>', roles: { NativeRole: [queryRef, ...] } }.
 * What it does:
 *  - the visual keeps its name, place, group, hidden state, filters and container formatting (title, background,
 *    border: visualContainerObjects belong to the container, not to the visual's type);
 *  - the type becomes the native one, and each native role gets the original projections named by their queryRef,
 *    copied as they are (fields, queryRef, nativeQueryRef, displayName); a category or rows role with several levels
 *    is a drill hierarchy: its first level is the active one unless one already is;
 *  - the custom visual's own formatting (visual.objects) is dropped and named in `lost`, as are projections no native
 *    role takes; a sort is kept only when its field is still in the query.
 * (0.3.0 J19, B-172) mapping.panels: [{ native, roles, unit }]: the values may not share one axis (axis-units.js), so the
 * visual becomes one native chart per group in its own box, side by side (one above the other in a box taller than
 * wide), the first keeping its name, the others "<name>_2", "_3" (more: [{ name, json }]); each value axis titled with
 * its unit, and a title typed as text followed by it (0.3.1 SQ2: mapping.panels[].titleTag). A combo is never written with a second axis: mapping.secShowOff writes valueAxis.secShow false.
 * (0.3.1 NC3) mapping.format: dropdown, search, headerOff, minHeight (a slicer), sortByValue (a word cloud's bars, largest first).
 * dropUnusedCustomVisuals(report.json, used types): the report stops declaring custom visuals no visual uses any more,
 * so Power BI does not ask to sign in for them. Browser and Node (module.exports / window.DAReplace). */
(function (root) {
  'use strict';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const list = (x) => (Array.isArray(x) ? x : []);
  const plainName = (s) => (typeof s === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(s) ? s : null);
  const DRILL_ROLES = ['Category', 'Rows'];
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const litOf = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  // Power BI's QueryAggregateFunction: Avg 1, Min 3
  const AGG = { Avg: 1, Min: 3 }, AGG_WORD = { Avg: 'Average of', Min: 'First' };
  // (0.3.1 NC2) the heat shading's ends: a pale blue to a mid blue, both light enough for dark text
  const HEAT = { low: '#f3f8fe', high: '#8cc2f5' };

  // What the custom visual showed, from its own format flags (the property names and true/false only, never data):
  // { valueLabels, categoryLabels, trend, thresholds, legend (true, false, or null when not set) }. Weak by nature: a
  // vendor names its flags as it likes; these are the common words (labels, regression, threshold, legend).
  function formatFacts(json) {
    const objs = ((json && json.visual) || {}).objects || {}, out = { valueLabels: false, categoryLabels: false, trend: false, thresholds: false, legend: null };
    const isTrue = (p) => litOf(p) === true || litOf(p) === 'true';
    Object.entries(objs).forEach(([name, entries]) => list(entries).forEach((e) => {
      const props = (e && e.properties) || {}, n = name.toLowerCase();
      Object.entries(props).forEach(([k, v]) => {
        const key = k.toLowerCase();
        if (!isTrue(v)) { if (n === 'legend' && key === 'show' && (litOf(v) === false || litOf(v) === 'false')) out.legend = false; return; }
        if (n === 'legend' && key === 'show') out.legend = true;
        else if (/valuelabelsenabled|^showvaluelabels/.test(key) || (/valuelabel|^labels$|^datalabels$/.test(n) && /^show\d*$/.test(key))) out.valueLabels = true;
        else if (/usecategoryaslabel|^labelenabled$/.test(key) || (/categorylabel|nodelabel/.test(n) && /^show$/.test(key))) out.categoryLabels = true;
        else if (/regression|trend/.test(n) && /^show$/.test(key)) out.trend = true;
        else if (/threshold|constantline|referenceline/.test(n) && /^show/.test(key)) out.thresholds = true;
      });
    }));
    return out;
  }
  // a column projection as an aggregation of it (Azure map's latitude and longitude with a location)
  function aggregated(p, fn) {
    const c = p && p.field && p.field.Column;
    if (!c) return p;
    const ent = ((c.Expression || {}).SourceRef || {}).Entity, prop = c.Property;
    return Object.assign({}, p, { field: { Aggregation: { Expression: { Column: c }, Function: AGG[fn] } }, queryRef: `${fn}(${ent}.${prop})`, nativeQueryRef: `${AGG_WORD[fn]} ${prop}` });
  }

  function replaceVisual(json, mapping) {
    if (!json || typeof json !== 'object' || json.visualGroup || !json.visual) throw new Error('only a visual is replaced (not a group, not a file without a visual)');
    if (!mapping || typeof mapping.native !== 'string' || !mapping.native) throw new Error('the mapping has no native visual type');
    // (0.3.0 J19) a mapping with panels is written as its panels (the first here, the others in more): never one visual
    // with the roles of a chart its values may not share
    if (Array.isArray(mapping.panels) && mapping.panels.length) return replacePanels(json, mapping, []);
    const v = json.visual, st = ((v.query || {}).queryState) || {};
    const byRef = {};
    Object.values(st).forEach((r) => list(r && r.projections).forEach((p) => { if (p && p.queryRef != null && !(p.queryRef in byRef)) byRef[p.queryRef] = p; }));
    // (0.3.1 NC2) columns the native visual adds from the model (the calendar heatmap's year, month and weekday):
    // mapping.add { queryRef: { table, column } }, written as Power BI writes a column; never counted as dropped
    const addedRefs = new Set();
    Object.entries(mapping.add || {}).forEach(([ref, c]) => { if (!(ref in byRef) && c && typeof c.table === 'string' && typeof c.column === 'string') { byRef[ref] = { field: { Column: { Expression: { SourceRef: { Entity: c.table } }, Property: c.column } }, queryRef: ref, nativeQueryRef: c.column }; addedRefs.add(ref); } });
    const qs = {}, used = new Set(), agg = mapping.aggregate || {};
    // (the laptop proof's Z2: one measure may sit in two roles, a map's Size and its Tooltips; Tooltips are written last)
    const order = Object.keys(mapping.roles || {}).sort((a, b) => (a === 'Tooltips') - (b === 'Tooltips'));
    order.forEach((role) => {
      const seen = new Set();
      const ps = list(mapping.roles[role]).map((r) => (r && typeof r === 'object' ? r.queryRef : r)).filter((r) => r in byRef && !seen.has(r)).map((r) => { seen.add(r); used.add(r); return agg[role] ? aggregated(clone(byRef[r]), agg[role]) : clone(byRef[r]); });
      if (!ps.length) return;
      if (DRILL_ROLES.includes(role) && ps.length > 1 && !ps.some((p) => p.active)) ps[0].active = true;
      qs[role] = { projections: ps };
    });
    const dropped = Object.keys(byRef).filter((r) => !used.has(r) && !addedRefs.has(r));
    const fieldsIn = new Set(Object.values(qs).flatMap((r) => r.projections.map((p) => JSON.stringify(p.field))));
    let sort = (v.query || {}).sortDefinition;
    // a sort by a field no role carries (a helper column): Min of it, or the measure itself, goes to Tooltips and the
    // sort follows it (the way measured in Desktop, round 2: a chart sorts by a field only when the field is in it)
    if (sort && list(sort.sort).length && mapping.tooltips && !list(sort.sort).every((s) => fieldsIn.has(JSON.stringify(s.field)))) {
      sort = clone(sort);
      sort.sort.forEach((s) => {
        if (fieldsIn.has(JSON.stringify(s.field))) return;
        const f = s.field || {}, c = f.Column, m = f.Measure || f.Aggregation;
        if (!c && !m) return;
        const ent = c ? ((c.Expression || {}).SourceRef || {}).Entity : null;
        const p = c ? { field: { Aggregation: { Expression: { Column: c }, Function: AGG.Min } }, queryRef: `Min(${ent}.${c.Property})`, nativeQueryRef: `First ${c.Property}` }
          : { field: f, queryRef: 'sort.' + (f.Measure ? f.Measure.Property : 'value'), nativeQueryRef: f.Measure ? String(f.Measure.Property) : 'value' };
        qs.Tooltips = qs.Tooltips || { projections: [] };
        if (!qs.Tooltips.projections.some((x) => JSON.stringify(x.field) === JSON.stringify(p.field))) qs.Tooltips.projections.push(p);
        s.field = p.field; fieldsIn.add(JSON.stringify(p.field));
      });
    }
    const keepSort = sort && list(sort.sort).length && list(sort.sort).every((s) => fieldsIn.has(JSON.stringify(s.field)));
    // (0.3.1 NC3) a word cloud's bars ranked by their value, largest first, when it kept no sort of its own (the writer's
    // own bar charts' form, pbip-query.js: Descending by the value, isDefaultSort; with none Desktop drew them A to Z)
    const fm0 = mapping.format || {}, byValue = !keepSort && fm0.sortByValue && qs.Y && qs.Y.projections[0] ? { sort: [{ field: clone(qs.Y.projections[0].field), direction: 'Descending' }], isDefaultSort: true } : null;
    const visual = Object.assign({ visualType: mapping.native, query: Object.assign({ queryState: qs }, keepSort ? { sortDefinition: clone(sort) } : byValue ? { sortDefinition: byValue } : {}) },
      v.visualContainerObjects ? { visualContainerObjects: clone(v.visualContainerObjects) } : {}, { drillFilterOtherVisuals: v.drillFilterOtherVisuals !== false });
    // the native visual's own settings for what the custom one showed (mapping.format, from formatFacts and the kind)
    const fm = mapping.format || {}, objects = {}, put = (name, props) => { objects[name] = [{ properties: Object.fromEntries(Object.entries(props).map(([k, x]) => [k, lit(x)])) }]; };
    if (fm.valueLabels) put('labels', { show: 'true' });
    if (fm.categoryLabels) put('categoryLabels', { show: 'true' });
    if (fm.trend) put('trend', { show: 'true' });
    if (fm.axisTitles === false) { put('categoryAxis', { showAxisTitle: 'false' }); put('valueAxis', { showAxisTitle: 'false' }); }
    if (fm.legend === false) put('legend', { show: 'false' });
    if (fm.stylePicker === false) put('mapControls', { showStylePicker: 'false' });
    // (0.3.1 NC3) a text search or a row of chips: the slicer as a dropdown (data.mode, measured on 2.158), its search on
    // (general.selfFilterEnabled: Microsoft's capabilities, operations.searchEnabled), its header off in a box too low for it
    if (mapping.native === 'slicer' && fm.dropdown) {
      put('data', { mode: "'Dropdown'" });
      if (fm.search) put('general', { selfFilterEnabled: 'true' });
      if (fm.headerOff) put('header', { show: 'false' });
    }
    // (0.3.1 NC2) a bullet's target on the combo: its line drawn as long-dash markers only (Microsoft's capabilities of
    // lineClusteredColumnComboChart: lineStyles.strokeShow, showMarker, markerShape longDash, markerSize)
    if (fm.targetMarkers && mapping.native === 'lineClusteredColumnComboChart') put('lineStyles', { strokeShow: 'false', showMarker: 'true', markerShape: "'longDash'", markerSize: '12D' });
    if (Object.keys(objects).length) visual.objects = objects;
    // a date hierarchy opened one level down (the level a timeline showed): written per Microsoft's schema, both levels
    // expanded from the root (to be proved in Desktop: no measured example yet)
    if (mapping.expand && qs.Category && qs.Category.projections.length > mapping.expand) {
      // (rc.2b: with only the first level active Desktop opened at years; Microsoft's schema: "active" is the field
      // currently active in the visual, for drill operations: every shown level is active)
      qs.Category.projections.forEach((p, i) => { if (i <= mapping.expand) p.active = true; else delete p.active; });
      visual.expansionStates = [{ roles: ['Category'], levels: qs.Category.projections.slice(0, mapping.expand + 1).map((p) => ({ queryRefs: [p.queryRef], isCollapsed: true, isPinned: true })), root: { isToggled: true } }];
    }
    // (J19) a combo the person confirmed keeps one shared axis: its secondary axis off
    if (mapping.native === 'lineClusteredColumnComboChart') { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.secShow = lit('false'); }
    // (0.3.1 NC2) a calendar heatmap's matrix: each value cell shaded by the value, the background's conditional formatting
    // (values.backColor as a FillRule linearGradient2 on the value, the form measured for a chart's dataPoint.fill in
    // round 13; light ends so the default dark text stays readable on every cell)
    const heatOn = fm.heat && mapping.native === 'pivotTable' && qs.Values ? qs.Values.projections[0] : null;
    if (heatOn) {
      visual.objects = visual.objects || {};
      visual.objects.values = [{ properties: { backColor: { solid: { color: { expr: { FillRule: { Input: clone(heatOn.field), FillRule: { linearGradient2: {
        min: { color: { Literal: { Value: "'" + HEAT.low + "'" } } }, max: { color: { Literal: { Value: "'" + HEAT.high + "'" } } },
        nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
      selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: heatOn.queryRef } }];
    }
    const out = clone(json); out.visual = visual;
    // (0.3.1 NC3) a dropdown never lower than it can be drawn (mapping.format.minHeight: Microsoft's validator's floor)
    if (fm.minHeight && out.position && !(out.position.height >= fm.minHeight)) out.position = Object.assign({}, out.position, { height: fm.minHeight });
    const objs = Object.keys(v.objects || {}), named = objs.map(plainName).filter(Boolean);
    const lost = [];
    if (objs.length) lost.push(`its own format settings (${objs.length}${named.length ? ': ' + named.slice(0, 8).join(', ') + (named.length > 8 ? ', …' : '') : ''})`);
    if (dropped.length) lost.push(`${dropped.length} field(s) no native role takes`);
    if (sort && !keepSort) lost.push('its sort (its field is no longer in the visual)');
    return { json: out, dropped, lost };
  }
  // (0.3.0 J19) the panels of a visual whose values may not share one axis: { json, more: [{ name, json }], dropped, lost }.
  // taken: names already used on the page (a new panel never takes one)
  const GAP = 8;
  const quote = (t) => "'" + String(t).replace(/'/g, "''") + "'";
  function replacePanels(json, mapping, taken) {
    const P = list(mapping.panels), n = P.length, pos = json.position || {}, across = (pos.width || 0) >= (pos.height || 0);
    const w = across ? ((pos.width || 0) - GAP * (n - 1)) / n : pos.width || 0, h = across ? pos.height || 0 : ((pos.height || 0) - GAP * (n - 1)) / n;
    const used = new Set(list(taken).map(String)), base = String(json.name || 'visual').slice(0, 44);
    const nameAt = (i) => { if (!i) return json.name; let k = i + 1, nm = base + '_' + k; while (used.has(nm)) nm = base + '_' + (++k); used.add(nm); return nm; };
    const all = { dropped: new Set(), lost: [] }, outs = P.map((p, i) => {
      // (NC2) a panel draws its own values: no target markers across panels
      const r = replaceVisual(json, Object.assign({}, mapping, { native: p.native, roles: p.roles, panels: undefined, format: Object.assign({}, mapping.format, { targetMarkers: false }) }));
      r.dropped.forEach((d) => all.dropped.add(d)); r.lost.forEach((x) => { if (!all.lost.includes(x)) all.lost.push(x); });
      const j = r.json; j.name = nameAt(i);
      j.position = Object.assign({}, pos, { x: (pos.x || 0) + (across ? i * (w + GAP) : 0), y: (pos.y || 0) + (across ? 0 : i * (h + GAP)), width: Math.floor(w), height: Math.floor(h) },
        pos.z != null ? { z: pos.z + i } : {}, pos.tabOrder != null ? { tabOrder: pos.tabOrder + i } : {});
      if (p.unit) { const o = j.visual.objects = j.visual.objects || {}, va = o.valueAxis || (o.valueAxis = [{ properties: {} }]); Object.assign(va[0].properties, { showAxisTitle: lit('true'), titleText: lit(quote(p.unit)) }); }
      // (0.3.1 SQ2, J19-S5) a title typed as text says the panel's unit (titleTag: with its place when the units are the
      // same), so two panels never show one title twice; a title from a measure, or none (Power BI's own from the
      // panel's fields), is left as it is
      const tag = p.titleTag || p.unit, vco = j.visual.visualContainerObjects;
      if (tag && vco && Array.isArray(vco.title)) vco.title.forEach((e) => { const t = e && !e.selector && e.properties ? litOf(e.properties.text) : undefined;
        if (typeof t === 'string' && /^'[\s\S]*'$/.test(t)) e.properties.text = lit(quote(t.slice(1, -1).replace(/''/g, "'") + ' (' + tag + ')')); });
      return j;
    });
    // a field kept in another panel is not lost
    const kept = new Set(P.flatMap((p) => Object.values(p.roles || {}).flat()));
    const dropped = Array.from(all.dropped).filter((d) => !kept.has(d)), lost = all.lost.filter((x) => !/field\(s\) no native role takes/.test(x));
    if (dropped.length) lost.push(`${dropped.length} field(s) no native role takes`);
    lost.push(`one chart with ${n} groups of values in units that may not share one axis: ${n} separate charts in its box, each with its unit on its axis`);
    return { json: outs[0], more: outs.slice(1).map((j) => ({ name: j.name, json: j })), dropped, lost };
  }

  // report: report.json; usedTypes: every visual type the report still uses after the replacements
  function dropUnusedCustomVisuals(report, usedTypes) {
    const used = new Set(list(usedTypes).map(String)), out = clone(report || {}), dropped = [];
    if (Array.isArray(out.publicCustomVisuals)) out.publicCustomVisuals = out.publicCustomVisuals.filter((t) => (used.has(String(t)) ? true : (dropped.push(String(t)), false)));
    if (Array.isArray(out.organizationCustomVisuals)) out.organizationCustomVisuals = out.organizationCustomVisuals.filter((o) => (!o || used.has(String(o.name)) ? true : (dropped.push(String(o.name)), false)));
    if (Array.isArray(out.resourcePackages)) out.resourcePackages = out.resourcePackages.filter((p) => (!p || p.type !== 'CustomVisual' || used.has(String(p.name)) ? true : (dropped.push(String(p.name)), false)));
    return { json: out, dropped };
  }

  const api = { replaceVisual, replacePanels, dropUnusedCustomVisuals, formatFacts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAReplace = api;
})(typeof self !== 'undefined' ? self : this);
