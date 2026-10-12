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
    const v = json.visual, st = ((v.query || {}).queryState) || {};
    const byRef = {};
    Object.values(st).forEach((r) => list(r && r.projections).forEach((p) => { if (p && p.queryRef != null && !(p.queryRef in byRef)) byRef[p.queryRef] = p; }));
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
    const dropped = Object.keys(byRef).filter((r) => !used.has(r));
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
    const visual = Object.assign({ visualType: mapping.native, query: Object.assign({ queryState: qs }, keepSort ? { sortDefinition: clone(sort) } : {}) },
      v.visualContainerObjects ? { visualContainerObjects: clone(v.visualContainerObjects) } : {}, { drillFilterOtherVisuals: v.drillFilterOtherVisuals !== false });
    // the native visual's own settings for what the custom one showed (mapping.format, from formatFacts and the kind)
    const fm = mapping.format || {}, objects = {}, put = (name, props) => { objects[name] = [{ properties: Object.fromEntries(Object.entries(props).map(([k, x]) => [k, lit(x)])) }]; };
    if (fm.valueLabels) put('labels', { show: 'true' });
    if (fm.categoryLabels) put('categoryLabels', { show: 'true' });
    if (fm.trend) put('trend', { show: 'true' });
    if (fm.axisTitles === false) { put('categoryAxis', { showAxisTitle: 'false' }); put('valueAxis', { showAxisTitle: 'false' }); }
    if (fm.legend === false) put('legend', { show: 'false' });
    if (fm.stylePicker === false) put('mapControls', { showStylePicker: 'false' });
    if (Object.keys(objects).length) visual.objects = objects;
    // a date hierarchy opened one level down (the level a timeline showed): written per Microsoft's schema, both levels
    // expanded from the root (to be proved in Desktop: no measured example yet)
    if (mapping.expand && qs.Category && qs.Category.projections.length > mapping.expand) {
      // (rc.2b: with only the first level active Desktop opened at years; Microsoft's schema: "active" is the field
      // currently active in the visual, for drill operations: every shown level is active)
      qs.Category.projections.forEach((p, i) => { if (i <= mapping.expand) p.active = true; else delete p.active; });
      visual.expansionStates = [{ roles: ['Category'], levels: qs.Category.projections.slice(0, mapping.expand + 1).map((p) => ({ queryRefs: [p.queryRef], isCollapsed: true, isPinned: true })), root: { isToggled: true } }];
    }
    const out = clone(json); out.visual = visual;
    const objs = Object.keys(v.objects || {}), named = objs.map(plainName).filter(Boolean);
    const lost = [];
    if (objs.length) lost.push(`its own format settings (${objs.length}${named.length ? ': ' + named.slice(0, 8).join(', ') + (named.length > 8 ? ', …' : '') : ''})`);
    if (dropped.length) lost.push(`${dropped.length} field(s) no native role takes`);
    if (sort && !keepSort) lost.push('its sort (its field is no longer in the visual)');
    return { json: out, dropped, lost };
  }

  // report: report.json; usedTypes: every visual type the report still uses after the replacements
  function dropUnusedCustomVisuals(report, usedTypes) {
    const used = new Set(list(usedTypes).map(String)), out = clone(report || {}), dropped = [];
    if (Array.isArray(out.publicCustomVisuals)) out.publicCustomVisuals = out.publicCustomVisuals.filter((t) => (used.has(String(t)) ? true : (dropped.push(String(t)), false)));
    if (Array.isArray(out.organizationCustomVisuals)) out.organizationCustomVisuals = out.organizationCustomVisuals.filter((o) => (!o || used.has(String(o.name)) ? true : (dropped.push(String(o.name)), false)));
    if (Array.isArray(out.resourcePackages)) out.resourcePackages = out.resourcePackages.filter((p) => (!p || p.type !== 'CustomVisual' || used.has(String(p.name)) ? true : (dropped.push(String(p.name)), false)));
    return { json: out, dropped };
  }

  const api = { replaceVisual, dropUnusedCustomVisuals, formatFacts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAReplace = api;
})(typeof self !== 'undefined' ? self : this);
