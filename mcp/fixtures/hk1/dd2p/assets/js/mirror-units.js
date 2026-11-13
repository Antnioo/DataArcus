/* DataArcus mirror units: the Arabic twin's group and badge geometry (0.3.2 SP39, from report-mirror.js; the Codex
 * split map, B-280). Which visuals on a page are mirrored as one (a badge on its tile, a bar list with its names
 * beside it), the width a visual is placed in (its page's, or its parent group's: PBIR positions in a group are
 * relative to it), and where each member of a unit goes in the twin. What a box draws inside (its left-to-right
 * content) is never read or changed here: only boxes, names and kinds.
 * Interface (every function pure: the page's visuals in, an answer out; nothing changed, no state between calls; the
 * kinds are mirror-policy.js's):
 *  - unitsOf(visuals) -> { on: [{ visual, host }], bars: [{ bars, names }] } (names: the visuals' names)
 *  - byNameOf(visuals) -> { name: visual.json }
 *  - frameWidth(page, byName, visual) -> the width it is placed in: its parent group's when the group's box is valid,
 *    else the page's when finite and > 0, else undefined (0.3.2 DD1C: the one home; widthOf is the same function)
 *  - placesOf(units, byName, page) -> { at: { name: x in the twin }, keepBars: Set of the bar lists that keep their
 *    direction }
 *  - boxOf(visual) -> { x, y, w, h, z } or null; nameOf(visual) -> its name as text, or null; round(v): to 0.01
 * Browser and Node (module.exports / window.DAMirrorUnits). */
(function (root) {
  'use strict';
  const P = typeof module !== 'undefined' && module.exports ? require('./mirror-policy.js') : root.DAMirrorPolicy;
  const { isObj, lit, entries, projections, first, kindOf } = P;
  // a position rounded to 0.01 (floating point gave x = -1e-13 and the validator's PBIR_LAYOUT_NEGATIVE_X)
  const round = (v) => { const r = Math.round(v * 100) / 100; return r === 0 ? 0 : r; };


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
  // a field's key (Table.Field) for a column, a measure or a hierarchy level, or null
  const fieldKey = (f) => { const c = isObj(f) ? (f.Column || f.Measure || f.HierarchyLevel) : null, src = isObj(c) && isObj(c.Expression) && isObj(c.Expression.SourceRef) ? c.Expression.SourceRef.Entity : null;
    return c && typeof c.Property === 'string' ? (src == null ? '' : String(src)) + '.' + c.Property : c && typeof c.Level === 'string' ? 'level.' + c.Level : null; };
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
      // (0.3.1 MP1b, laptop part 6: "Calls by Department" beside a ratings table of other fields was kept as one block in
      // its English order, the two then lying on each other's place) a visual of fields is the bars' names only when it
      // shows the bars' own category field; a text box (no fields) still can be
      const cat = fieldKey((first(projections(v.visual.query, 'Category')) || {}).field);
      const namesOf = (n) => { const qs = isObj(n.visual.query) && isObj(n.visual.query.queryState) ? n.visual.query.queryState : {}, keys = [];
        Object.keys(qs).forEach((r) => (projections(n.visual.query, r) || []).forEach((x) => { if (isObj(x)) keys.push(fieldKey(x.field)); })); return keys; };
      const sameField = (n) => { const ks = namesOf(n); return !ks.length || (cat != null && ks.includes(cat)); };
      const near = list.filter((n) => n !== v && parentOf(n) === parentOf(v) && showsNames(n) && !taken.has(nameOf(n)) && sameField(n)).map((n) => {
        const b = boxOf(n), gap = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w)), shared = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        return { n, gap, ok: gap >= -2 && gap <= 24 && shared >= Math.min(a.h, b.h) / 2 };
      }).filter((c) => c.ok).sort((x, y) => x.gap - y.gap);
      if (near.length) { bars.push({ bars: nameOf(v), names: nameOf(near[0].n) }); taken.add(nameOf(v)); taken.add(nameOf(near[0].n)); }
    });
    return { on: onKept, bars };
  }

  // ---- the page's frame: each visual by name, and the width it is placed in ----
  const byNameOf = (list) => { const byName = {};
    list.forEach((v) => { if (isObj(v) && (typeof v.name === 'string' || typeof v.name === 'number')) byName[v.name] = v; });
    return byName; };
  // (0.3.2 DD1C, D-1104-12: the one home of this rule; the twin's geometry and fitting call it) the frame a visual is
  // placed in: its parent group's width when that group's box is valid (boxOf), else the page's width when it is a
  // finite number > 0, else undefined (the frame is unknown: a caller never mirrors with a guess)
  const frameWidth = (page, byName, v) => {
    const key = isObj(v) && (typeof v.parentGroupName === 'string' || typeof v.parentGroupName === 'number') ? v.parentGroupName : null;
    const g = key != null && isObj(byName) && Object.prototype.hasOwnProperty.call(byName, key) ? boxOf(byName[key]) : null;
    if (g) return g.w;
    const w = isObj(page) ? page.width : undefined;
    return Number.isFinite(w) && w > 0 ? w : undefined; };
  const widthOf = frameWidth;
  // where each member of a unit goes (its x in the twin), and the bars that keep their direction
  function placesOf(units, byName, page) {
    const at = {}, keepBars = new Set(), widthIn = (v) => frameWidth(page, byName, v);
    units.bars.forEach((u) => {
      const a = boxOf(byName[u.bars]), b = boxOf(byName[u.names]), W = widthIn(byName[u.bars]); if (!Number.isFinite(W)) return;
      const left = Math.min(a.x, b.x), right = Math.max(a.x + a.w, b.x + b.w), left2 = W - right;
      at[u.bars] = round(left2 + a.x - left); at[u.names] = round(left2 + b.x - left); keepBars.add(u.bars);
    });
    units.on.forEach((u) => {
      const a = boxOf(byName[u.visual]), h = boxOf(byName[u.host]), W = widthIn(byName[u.host]); if (!Number.isFinite(W)) return;
      const hx = at[u.host] != null ? at[u.host] : W - h.x - h.w;
      at[u.visual] = round(hx + a.x - h.x);
    });
    return { at, keepBars };
  }

  const api = Object.freeze({ unitsOf, byNameOf, frameWidth, widthOf, placesOf, boxOf, nameOf, round, BADGE });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAMirrorUnits = api;
})(typeof self !== 'undefined' ? self : this);
