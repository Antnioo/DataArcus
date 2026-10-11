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

  function replaceVisual(json, mapping) {
    if (!json || typeof json !== 'object' || json.visualGroup || !json.visual) throw new Error('only a visual is replaced (not a group, not a file without a visual)');
    if (!mapping || typeof mapping.native !== 'string' || !mapping.native) throw new Error('the mapping has no native visual type');
    const v = json.visual, st = ((v.query || {}).queryState) || {};
    const byRef = {};
    Object.values(st).forEach((r) => list(r && r.projections).forEach((p) => { if (p && p.queryRef != null && !(p.queryRef in byRef)) byRef[p.queryRef] = p; }));
    const qs = {}, used = new Set();
    Object.entries(mapping.roles || {}).forEach(([role, refs]) => {
      const ps = list(refs).map((r) => (r && typeof r === 'object' ? r.queryRef : r)).filter((r) => r in byRef && !used.has(r)).map((r) => { used.add(r); return clone(byRef[r]); });
      if (!ps.length) return;
      if (DRILL_ROLES.includes(role) && ps.length > 1 && !ps.some((p) => p.active)) ps[0].active = true;
      qs[role] = { projections: ps };
    });
    const dropped = Object.keys(byRef).filter((r) => !used.has(r));
    const fieldsIn = new Set(Object.values(qs).flatMap((r) => r.projections.map((p) => JSON.stringify(p.field))));
    const sort = (v.query || {}).sortDefinition;
    const keepSort = sort && list(sort.sort).length && list(sort.sort).every((s) => fieldsIn.has(JSON.stringify(s.field)));
    const visual = Object.assign({ visualType: mapping.native, query: Object.assign({ queryState: qs }, keepSort ? { sortDefinition: clone(sort) } : {}) },
      v.visualContainerObjects ? { visualContainerObjects: clone(v.visualContainerObjects) } : {}, { drillFilterOtherVisuals: v.drillFilterOtherVisuals !== false });
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

  const api = { replaceVisual, dropUnusedCustomVisuals };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAReplace = api;
})(typeof self !== 'undefined' ? self : this);
