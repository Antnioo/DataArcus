// 0.3.1 CS1 (the owner, 26 Oct: a hand-made report "making sure all are identical not one visual have a font and the
// other not"): each visual's OWN text formatting, the settings in its visual.json that override the theme (font family,
// size, bold, italic), by the theme's text class that would govern it without them. Read by check_report (FORMAT_MIXED)
// and the redesign (redesign.mjs: consistentText removes them so the theme governs, and writes the theme's text set).
// Metadata only: property names, sizes in points, font names, true or false; never a text, a title or a value.
// Sources (mcp/work/CS1.md, "The text roles"): which text class formats what, Microsoft Learn "Create custom report
// themes in Power BI Desktop", "Set formatted text defaults"; the objects and property names per visual type, Microsoft's
// report theme schema reportThemeSchema-2.149.json (every pair below is there for every type listed, checked 26 Oct). A
// theme's text class holds fontFace, fontSize, fontWeight and color (the same schema's textClass): no bold or italic.

const AXIS = ['clusteredColumnChart', 'clusteredBarChart', 'columnChart', 'barChart', 'hundredPercentStackedColumnChart', 'hundredPercentStackedBarChart',
  'lineChart', 'areaChart', 'stackedAreaChart', 'lineClusteredColumnComboChart', 'lineStackedColumnComboChart', 'ribbonChart', 'waterfallChart'];
const F = { family: 'fontFamily', size: 'fontSize', bold: 'bold', italic: 'italic' };
const T = { family: 'titleFontFamily', size: 'titleFontSize', bold: 'titleBold', italic: 'titleItalic' };
const S = { family: 'fontFamily', size: 'textSize', bold: 'bold', italic: 'italic' };
// what each class formats, in words (the plan and FORMAT_MIXED say it)
export const CLASSES = {
  largeTitle: 'visual titles', title: 'axis titles, multi-row card titles and slicer headers', label: 'table and matrix headers and values',
  boldLabel: 'table and matrix totals', lightLabel: 'legends, category axis labels, slicer items and other light labels', largeLightLabel: 'card category labels and gauge labels',
  smallLightLabel: 'data labels and value axis labels', callout: 'card values and KPI indicators', largeLabel: 'multi-row card values'
};
// [class, types, container, object, property names]
const R = (cls, types, at, object, props) => ({ cls, types, at, object, props });
export const ROLES = [
  R('title', AXIS.concat('scatterChart'), 'objects', 'categoryAxis', T), R('title', AXIS.concat('scatterChart'), 'objects', 'valueAxis', T),
  R('title', ['multiRowCard'], 'objects', 'cardTitle', F), R('title', ['slicer'], 'objects', 'header', S),
  R('label', ['tableEx', 'pivotTable'], 'objects', 'columnHeaders', F), R('label', ['tableEx', 'pivotTable'], 'objects', 'values', F), R('label', ['pivotTable'], 'objects', 'rowHeaders', F),
  R('boldLabel', ['tableEx', 'pivotTable'], 'objects', 'total', F), R('boldLabel', ['pivotTable'], 'objects', 'subTotals', F), R('boldLabel', ['pivotTable'], 'objects', 'columnTotal', F), R('boldLabel', ['pivotTable'], 'objects', 'rowTotal', F),
  R('lightLabel', AXIS.concat('pieChart', 'donutChart', 'scatterChart', 'treemap', 'map', 'filledMap'), 'objects', 'legend', F),
  R('lightLabel', AXIS.concat('scatterChart', 'funnel'), 'objects', 'categoryAxis', F), R('lightLabel', ['funnel'], 'objects', 'labels', F), R('lightLabel', ['gauge'], 'objects', 'target', F),
  R('lightLabel', ['scatterChart'], 'objects', 'categoryLabels', F), R('lightLabel', ['slicer'], 'objects', 'items', S),
  R('largeLightLabel', ['card', 'multiRowCard'], 'objects', 'categoryLabels', F), R('largeLightLabel', ['gauge'], 'objects', 'labels', F),
  R('smallLightLabel', AXIS.concat('pieChart', 'donutChart', 'treemap'), 'objects', 'labels', F), R('smallLightLabel', AXIS.concat('scatterChart'), 'objects', 'valueAxis', F),
  R('callout', ['card'], 'objects', 'labels', F), R('callout', ['kpi'], 'objects', 'indicator', F), R('largeLabel', ['multiRowCard'], 'objects', 'dataLabels', F)
];
// the native types CS1 knows; every one has a visual title (largeTitle)
export const KNOWN_TYPES = new Set(ROLES.flatMap((r) => r.types));
ROLES.unshift(R('largeTitle', [...KNOWN_TYPES], 'visualContainerObjects', 'title', F));
export const PROPS = ['family', 'size', 'bold', 'italic'];
// the pointers a consistent copy may remove: one per role's object and property (redesign.mjs's allowlist)
export const TEXT_POINTER = new RegExp(`^/visual/(?:${[...new Set(ROLES.map((r) => `${r.at}/${r.object}`))].map((x) => x.replace('/', '\\/')).join('|')})/\\d+/properties/(?:${[...new Set(ROLES.flatMap((r) => Object.values(r.props)))].join('|')})$`);
export const rolesOf = (type) => ROLES.filter((r) => r.types.includes(type));

// ---- a Literal's value: a font's first family, a size in points, true or false ----
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);
const lit = (p) => (p && p.expr && p.expr.Literal && typeof p.expr.Literal.Value === 'string' ? p.expr.Literal.Value : null);
// "'''Segoe UI Semibold'', wf_segoe-ui_semibold, helvetica'" or "'Arial'": the face as a theme writes it (the list, the
// outer quotes taken off) and its first family's name
export function fontOf(raw) {
  const m = /^'([\s\S]*)'$/.exec(String(raw).trim()); if (!m) return null;
  const face = m[1].replace(/''/g, "'"), name = face.split(',')[0].trim().replace(/^['"]|['"]$/g, '').trim();
  return name && name.length <= 80 && !/[\p{Cc}\p{Cf}]/u.test(name) ? { face, name } : null;
}
export function sizeOf(raw) { const m = /^(\d{1,3}(?:\.\d{1,2})?)[DLM]?$/.exec(String(raw).trim()); const n = m ? +m[1] : NaN; return n > 0 && n <= 400 ? n : null; }
const boolOf = (raw) => (raw === 'true' ? true : raw === 'false' ? false : null);
const valueOf = (prop, raw) => (prop === 'family' ? (fontOf(raw) || {}).name || null : prop === 'size' ? sizeOf(raw) : boolOf(raw));
export const shownValue = (prop, v) => (v == null ? 'the theme\'s' : prop === 'size' ? `${v}pt` : prop === 'family' ? String(v) : v ? prop : `not ${prop}`);

// ---- one visual's own text settings ----
// json: the visual.json; returns { overrides: [{ cls, object, at, index, prop, property, pointer, raw, value }],
// kept: [{ cls, object, property, why }] } (kept: a setting that is not a plain value of the whole visual)
export function visualText(json) {
  // (a broken file: anything that is not the shape is read as nothing, never a crash: the fuzz test)
  const v = obj(obj(json) && json.visual) || {}, type = v.visualType, out = { overrides: [], kept: [] };
  rolesOf(type).forEach((r) => {
    const arr = (obj(v[r.at]) || {})[r.object];
    if (!Array.isArray(arr)) return;
    arr.forEach((e, i) => {
      if (!obj(e)) return;
      const ps = obj(e.properties) || {};
      PROPS.forEach((prop) => {
        const property = r.props[prop]; if (!(property in ps)) return;
        const raw = lit(ps[property]), value = raw == null ? null : valueOf(prop, raw);
        if (e.selector) out.kept.push({ cls: r.cls, object: r.object, property, why: 'set for one series or field (a selector): kept' });
        else if (value == null) out.kept.push({ cls: r.cls, object: r.object, property, why: raw == null ? 'set from an expression (a measure or a rule): kept' : 'a value DataArcus does not read: kept' });
        else out.overrides.push({ cls: r.cls, object: r.object, at: r.at, index: i, prop, property, pointer: `/visual/${r.at}/${r.object}/${i}/properties/${property}`, raw, value });
      });
    });
  });
  return out;
}

// ---- the theme's value for a class and property (null: Power BI's base theme, not read) ----
// theme: the report's custom theme JSON or null; a visual style of the theme for that type and object comes first
export function themeValue(theme, cls, prop, type, object, props) {
  const th = obj(theme) || {};
  const vs = ((obj((obj(th.visualStyles) || {})[type]) || {})['*'] || {})[object], e = Array.isArray(vs) ? obj(vs[0]) : null, own = e && props ? e[props[prop]] : undefined;
  if (own !== undefined && (typeof own === 'string' || typeof own === 'number' || typeof own === 'boolean')) return { value: prop === 'family' ? String(own).split(',')[0].replace(/['"]/g, '').trim() : own, style: `${type} ${object}` };
  const tc = obj((obj(th.textClasses) || {})[cls]) || {};
  if (prop === 'family' && typeof tc.fontFace === 'string') return { value: tc.fontFace.split(',')[0].replace(/['"]/g, '').trim() };
  if (prop === 'size' && typeof tc.fontSize === 'number') return { value: tc.fontSize };
  return { value: null };
}

// ---- the counts: per class and property, the values the listed visuals show (a visual without its own: the theme's) ----
// items: [{ page, visual, type, json }]; returns { [cls]: { [prop]: Map(value or null -> count) } } over each visual's
// objects of that class (a chart's legend and category axis labels are two places of lightLabel)
export function countsOf(items, theme) {
  const out = {};
  items.forEach((it) => {
    const t = visualText(it.json), type = (obj(obj(it.json) && it.json.visual) || {}).visualType;
    rolesOf(type).forEach((r) => PROPS.filter((p) => p === 'family' || p === 'size').forEach((prop) => {
      const own = t.overrides.find((o) => o.cls === r.cls && o.object === r.object && o.at === r.at && o.prop === prop);
      if (!own && t.kept.some((k) => k.object === r.object && k.property === r.props[prop])) return;
      const v = own ? own.value : themeValue(theme, r.cls, prop, type, r.object, r.props).value;
      const c = (out[r.cls] = out[r.cls] || {}), m = (c[prop] = c[prop] || new Map());
      m.set(v, (m.get(v) || 0) + 1);
    }));
  });
  return out;
}
// the classes that show more than one font or size, in words: "visual titles: 7 at 14pt, 2 at 11pt; 8 in Segoe UI,
// 1 in Segoe UI Bold"
export function mixedOf(counts) {
  const out = [];
  Object.keys(CLASSES).forEach((cls) => {
    const c = counts[cls]; if (!c) return;
    const parts = [];
    if (c.size && c.size.size > 1) parts.push([...c.size].sort((a, b) => b[1] - a[1]).map(([v, n]) => `${n} at ${shownValue('size', v)}`).join(', '));
    if (c.family && c.family.size > 1) parts.push([...c.family].sort((a, b) => b[1] - a[1]).map(([v, n]) => `${n} in ${shownValue('family', v)}`).join(', '));
    if (parts.length) out.push({ cls, what: CLASSES[cls], sizes: c.size ? c.size.size : 0, fonts: c.family ? c.family.size : 0, said: `${CLASSES[cls]}: ${parts.join('; ')}` });
  });
  return out;
}
// the visuals with any bold or italic of their own, counted: "3 visuals set bold or italic of their own"
export const boldItalicOf = (items) => items.filter((it) => visualText(it.json).overrides.some((o) => o.prop === 'bold' || o.prop === 'italic')).length;

// ---- the text set: per class, the font and size most of the report already shows ("report"), or the theme's ("theme") ----
// counts: countsOf; faces: the fonts' faces as the visuals write them; returns { [cls]: { family, face, size, shownBy } }
export function textSetOf(counts, mode, faces) {
  const set = {};
  Object.keys(CLASSES).forEach((cls) => {
    const c = counts[cls]; if (!c) return;
    const pick = (m) => { if (!m) return { value: null, n: 0 }; const best = [...m].sort((a, b) => b[1] - a[1] || (a[0] == null ? -1 : b[0] == null ? 1 : typeof a[0] === 'number' && typeof b[0] === 'number' ? a[0] - b[0] : String(a[0]).localeCompare(String(b[0]))))[0]; return { value: best[0], n: best[1] }; };
    const fam = mode === 'report' ? pick(c.family) : { value: null, n: 0 }, size = mode === 'report' ? pick(c.size) : { value: null, n: 0 };
    set[cls] = { family: fam.value, face: fam.value == null ? null : (faces && faces.get(fam.value)) || fam.value, size: size.value,
      shownBy: { family: fam.value == null ? null : fam.n, size: size.value == null ? null : size.n } };
  });
  return set;
}
// the faces seen, by font name: the one most visuals write for that name
export function facesOf(items) {
  const seen = new Map();
  items.forEach((it) => visualText(it.json).overrides.filter((o) => o.prop === 'family').forEach((o) => { const f = fontOf(o.raw); if (!f) return; const m = seen.get(f.name) || new Map(); m.set(f.face, (m.get(f.face) || 0) + 1); seen.set(f.name, m); }));
  return new Map([...seen].map(([n, m]) => [n, [...m].sort((a, b) => b[1] - a[1])[0][0]]));
}
