// The design tools' logic: a design (the Theme Generator's saved design) from the tools' inputs, with every value that
// could not be used listed with what was used instead. The engine is the website's own (assets/js/design-engine.js),
// so the MCP and the Theme Generator give the same theme JSON and slot tables byte for byte.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { inside } from './model.mjs';

const require = createRequire(import.meta.url);
export const E = require('../../assets/js/design-engine.js');

const HARMONIES = ['analogous', 'complementary', 'triadic', 'mono'];
const UI_KEYS = ['background', 'card', 'text', 'accent', 'good', 'neutral', 'bad'];
const CONTRAST_NAMES = { textOnVisuals: 'Text on visuals', labelsOnVisuals: 'Labels on visuals', textOnPage: 'Text on page', color1OnVisuals: 'Color 1 on visuals' };

// a colour as the website takes it (#abc, abc, #aabbcc; any case), or null
const hex = (v) => (typeof v === 'string' ? E.clampHex(v) : null);

// The engine's own full design with everything given laid over it: the given layout is merged into the engine's
// current layout (so a partial one is never read as an old saved design, and the MCP never names a layout version),
// and the given data colours are used when there are 8 (otherwise the engine would drop the whole design)
export function withDefaults(given) {
  const base = E.repairState(E.fresh()), g = given ? JSON.parse(JSON.stringify(given)) : {};
  if (!(Array.isArray(g.data) && g.data.length === 8)) delete g.data;
  return E.repairState(Object.assign(base, g, { layout: Object.assign(base.layout, g.layout && typeof g.layout === 'object' ? g.layout : {}) }));
}

// The design for generate_theme's inputs (see server.mjs): the colours from palette, brand + harmony or preset (in that
// order), then name, font, chart and the page choices that change the theme. Returns { design, repaired, notes }.
export function themeDesign(a) {
  const repaired = [], notes = [];
  const fix = (field, given, used, why) => repaired.push({ field, given, used, why });
  const d = E.fresh();
  // the preset: the colours when nothing else is given, and good/neutral/bad for a palette that leaves them out
  let preset = 'DataArcus';
  if (a.preset != null) {
    if (E.PRESETS[a.preset]) preset = a.preset;
    else fix('preset', a.preset, preset, `not a preset; use one of ${Object.keys(E.PRESETS).join(', ')}`);
  }
  d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = { ...E.PRESETS[preset].ui };
  if (a.palette) {
    const p = a.palette;
    (p.data || []).forEach((c, i) => { const h = hex(c); if (h) d.data[i] = h; else fix(`palette.data[${i}]`, c, d.data[i], 'not a hex colour; kept the preset\'s'); });
    UI_KEYS.forEach((k) => {
      const given = p.ui ? p.ui[k] : undefined, h = hex(given);
      if (h) d.ui[k] = h;
      else fix(`palette.ui.${k}`, given, d.ui[k], given == null ? `not given; from the ${preset} preset` : 'not a hex colour; kept the preset\'s');
    });
    d.preset = null;
    if (a.brand != null) fix('brand', a.brand, null, 'not used: a palette was given');
  } else if (a.brand != null) {
    const b = hex(a.brand);
    let h = a.harmony == null ? 'analogous' : a.harmony;
    if (!HARMONIES.includes(h)) { fix('harmony', a.harmony, 'analogous', `not a harmony; use one of ${HARMONIES.join(', ')}`); h = 'analogous'; }
    else if (a.harmony == null) notes.push('No harmony given: analogous.');
    if (!b) fix('brand', a.brand, null, 'not a hex colour; kept the preset\'s colours');
    else { d.data = E.generate(b, h); d.ui.accent = d.data[0]; d.preset = null; }   // as the website's Generate button
  } else if (a.harmony != null) fix('harmony', a.harmony, null, 'not used: no brand colour given');
  if (a.name != null) d.name = String(a.name);
  if (a.font != null) {
    if (E.FONTS.includes(a.font)) d.font = a.font;
    else fix('font', a.font, d.font, `not a Power BI font the generator offers; use one of ${E.FONTS.join(', ')}`);
  }
  if (a.chart) {
    const c = {};
    Object.entries(a.chart).forEach(([k, v]) => {
      if (!E.CHART_OPTIONS[k]) fix(`chart.${k}`, v, null, `not a chart setting; use ${Object.keys(E.CHART_OPTIONS).join(', ')}`);
      else if (!E.CHART_OPTIONS[k].includes(v)) fix(`chart.${k}`, v, 'auto', `use one of ${E.CHART_OPTIONS[k].join(', ')}`);
      else c[k] = v;
    });
    d.chart = c;
  }
  // the page and style choices on top of the engine's full current layout (its version, 1920 x 1080 and defaults)
  d.layout = layoutFrom(a.layout || {}, withDefaults().layout, fix);
  const design = E.repairState(d);
  return { design, repaired, notes };
}

// Page and style choices into a saved layout. base: a layout to change (plan_layout), fix: records what can't be used
export function layoutFrom(l, base, fix) {
  const out = Object.assign({}, base);
  if (l.page != null) {
    if (typeof l.page === 'object') Object.assign(out, { page: 'custom', pageW: l.page.w, pageH: l.page.h });
    else if (E.PAGES[l.page]) out.page = l.page;
    else fix('layout.page', l.page, out.page || '1920x1080', `use ${Object.keys(E.PAGES).join(', ')} or { w, h }`);
  }
  if (l.radius != null) { if (+l.radius >= 0 && +l.radius <= 24) out.radius = +l.radius; else fix('layout.radius', l.radius, out.radius == null ? 8 : out.radius, 'corners are 0 to 24'); }
  ['shadow', 'transparent', 'header'].forEach((k) => { if (l[k] != null) out[k] = !!l[k]; });
  if (l.dir != null) out.dir = l.dir;
  return out;
}

// plan_layout: the design (from generate_theme, or a fresh one) with the tool's layout choices applied the way the
// website applies them, and the slots in page units. Returns { design, slots, forAuthoring, why }.
export function planLayout(a) {
  const design = withDefaults(a.design), l = design.layout;
  // choosing a layout, as on the website: its own KPI count and filters, and the size sliders back to its defaults
  if (a.layout) { l.preset = a.layout; l.kpis = E.LAYOUTS[a.layout].kpis; l.filters = E.LAYOUTS[a.layout].filters; delete l.kpiH; delete l.mainW; delete l.split; }
  if (a.kpis != null) l.kpis = a.kpis;
  if (a.filters != null) { l.filters = a.filters !== 'none'; if (l.filters) l.fpos = a.filters; }
  Object.assign(design.layout, layoutFrom({ page: a.page, header: a.header, dir: a.dir }, l, () => {}));
  E.repairState(design);
  const lang = a.lang, nm = (pair) => (lang === 'ar' ? pair[1] : pair[0]), layout = design.layout;
  // one row per visual, as the website's slot table: its name, the suggested visual, and x, y, w, h in page units
  const slots = E.computeSlots(layout, lang).map((s) => Object.assign({ role: nm(s.role), kind: s.kind, visual: nm(E.KINDS[s.kind]) }, E.boxOf(s, layout)));
  // the PBIR visual.json position, in reading order (top to bottom, then along the reading direction: the order
  // pbip-export.js sorts visuals in), z and tabOrder 1000, 2000...
  const right = E.rtl(layout, lang);
  const forAuthoring = slots.slice().sort((p, q) => (p.y - q.y) || (right ? q.x - p.x : p.x - q.x))
    .map((s, i) => ({ role: s.role, kind: s.kind, position: { x: s.x, y: s.y, z: (i + 1) * 1000, width: s.w, height: s.h, tabOrder: (i + 1) * 1000 } }));
  return { design, slots, forAuthoring, why: E.LAYOUTS[layout.preset].why.map(nm) };
}

// The page size a layout really gets, and whether a custom size had to be fitted (as the website does)
export function pageOf(layout) {
  const p = E.page(layout), asked = layout.page === 'custom' ? { w: Math.round(+layout.pageW) || null, h: Math.round(+layout.pageH) || null } : null;
  return { page: { w: p.w, h: p.h }, fitted: asked && (asked.w !== p.w || asked.h !== p.h) ? { asked } : null };
}

// The contrast checks with a warning for each failing one, and for data colours that almost disappear
export function contrastReport(design) {
  const c = E.contrastChecks(design), warnings = [];
  c.checks.filter((x) => !x.pass).forEach((x) => warnings.push(`${CONTRAST_NAMES[x.id]}: ${(Math.floor(x.ratio * 10) / 10).toFixed(1)}:1, aim for ${x.min}:1`));
  if (c.weak.length) warnings.push(`Data colour ${c.weak.join(', ')} almost disappears on the visual background (below 1.6:1).`);
  return { contrast: c, warnings };
}

// A file inside the DataArcus folder that doesn't exist yet: name.ext, name-2.ext, name-3.ext...
export function freeFile(folder, base, ext) {
  const dir = inside(folder || '.');
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (!fs.existsSync(f)) return f;
  }
}
