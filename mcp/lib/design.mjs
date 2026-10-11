// The design tools' logic: a design (the Theme Generator's saved design) from the tools' inputs, with every value that
// could not be used listed with what was used instead. The engine is the website's own (assets/js/design-engine.js),
// so the MCP and the Theme Generator give the same theme JSON and slot tables byte for byte.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const E = require('../../assets/js/design-engine.js');
// the design's keys and its written schema are the engine's (the audit's A2-7)
export const { DESIGN_KEYS, LAYOUT_KEYS, OLD_LAYOUT_KEYS, SCHEMA } = E;
// The engine's parts the MCP tools use (the audit's A2-8: server.mjs reaches the engine only through this adapter; the
// adapter itself reads and writes no file)
export const { PRESETS, FONTS, AR_FONTS, CHART_OPTIONS, REPORT_TEXTS, texts, clampHex, lum, buildTheme, projectPages, themeName, fileBase, imageSize, isSmall } = E;
export const designRtl = E.rtl;

const HARMONIES = ['analogous', 'complementary', 'triadic', 'mono'];
// the light page of a brand theme (0.2.9, O-11): the Corporate preset's (the cross-review's G7: one light page, the
// design engine's; the brand is the accent)
const LIGHT_UI = E.PRESETS.Corporate.ui;
const UI_KEYS = ['background', 'card', 'text', 'accent', 'good', 'neutral', 'bad'];
const CONTRAST_NAMES = { textOnVisuals: 'Text on visuals', labelsOnVisuals: 'Labels on visuals', textOnPage: 'Text on page', color1OnVisuals: 'Color 1 on visuals' };

// a colour as the website takes it (#abc, abc, #aabbcc; any case), or null
const hex = (v) => (typeof v === 'string' ? E.clampHex(v) : null);

// The engine's own full design with everything given laid over it: the given layout is merged into the engine's
// current layout (so a partial one is never read as an old saved design, and the MCP never names a layout version),
// and the given data colours are used when there are 8 (otherwise the engine would drop the whole design)
// (0.2.9, the reviewer's answer to part 1's question, 11 Oct 2026: the owner chose light with the brand exact, O-11): a
// design without its own colours starts light (the Corporate preset), never the dark DataArcus one
// report (optional): told each value of the given design the engine could not use (E.repairState's report)
export function withDefaults(given, report) {
  const base = E.repairState(E.fresh()), g = given ? JSON.parse(JSON.stringify(given)) : {};
  if (!(Array.isArray(g.data) && g.data.length === 8)) { delete g.data; Object.assign(base, { preset: 'Corporate', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui, g.ui && typeof g.ui === 'object' ? g.ui : {}) }); delete g.ui; delete g.preset; }
  return E.repairState(Object.assign(base, g, { layout: Object.assign(base.layout, g.layout && typeof g.layout === 'object' ? g.layout : {}) }), report);
}

// The design for generate_theme's inputs (see server.mjs): the colours from palette, brand + harmony or preset (in that
// order), then name, font, chart and the page choices that change the theme. Returns { design, repaired, notes }.
export function themeDesign(a) {
  const repaired = [], notes = [];
  const fix = (field, given, used, why) => repaired.push({ field, given, used, why });
  const d = E.fresh();
  // 0.2.9 (O-11 of the owner's test of 0.2.8: asked for a theme in #0F766E, he got a dark page and the colour lightened
  // to #17b5a9): a theme is light unless the user asks for dark (mode), and a brand colour is used exactly as given
  const dark = a.mode === 'dark';
  // the preset: the colours when nothing else is given, and good/neutral/bad for a palette that leaves them out
  // (nothing asked: Corporate, light; DataArcus, the dark one, only when dark is asked)
  let preset = dark ? 'DataArcus' : 'Corporate';
  if (a.preset != null) {
    if (E.PRESETS[a.preset]) preset = a.preset;
    else fix('preset', a.preset, preset, `not a preset; use one of ${Object.keys(E.PRESETS).join(', ')}`);
  } else if (!a.palette && a.brand == null) notes.push(dark ? 'No colours asked: the DataArcus preset (dark, as asked).' : 'No colours asked: the Corporate preset, light. Dark only when the user asks for it (mode "dark").');
  d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = { ...E.PRESETS[preset].ui };
  // a preset whose page is not what the user asked for (mode): the preset's data colours and accent on the asked page
  if (a.preset != null && E.PRESETS[a.preset] && a.mode && !a.palette && a.brand == null && (E.lum(d.ui.background) > 0.45) === dark) {
    d.ui = Object.assign({}, dark ? E.PRESETS.DataArcus.ui : LIGHT_UI, { accent: d.ui.accent }); d.preset = null;
    notes.push(`The ${preset} preset's colours on a ${dark ? 'dark' : 'light'} page, as asked.`); }
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
    let h = a.harmony == null ? 'calm' : a.harmony;
    if (!HARMONIES.includes(h) && h !== 'calm') { fix('harmony', a.harmony, 'analogous', `not a harmony; use one of ${HARMONIES.join(', ')}`); h = 'analogous'; }
    else if (a.harmony == null) notes.push('No harmony asked: a calm set of 7 colours beside the brand, each at least 3:1 on the visuals\' background (a harmony gives the generator\'s brighter colours).');
    if (!b) fix('brand', a.brand, null, 'not a hex colour; kept the preset\'s colours');
    // the website's Generate button makes the 8 colours from the brand (and keeps its lightness between 0.4 and 0.55);
    // here the brand itself is the first data colour and the accent, exactly, on a light page (dark only when asked:
    // mode "dark", or a dark preset chosen with the brand)
    else { d.ui = Object.assign({}, a.mode ? (dark ? E.PRESETS.DataArcus.ui : LIGHT_UI) : a.preset != null && E.PRESETS[a.preset] ? E.PRESETS[a.preset].ui : LIGHT_UI);
      d.data = h === 'calm' ? E.calmPalette(b, d.ui.card, d.ui.text) : E.generate(b, h); d.data[0] = b; d.ui.accent = b; d.preset = null;
      notes.push(`The brand colour ${b} is used exactly as given: the first data colour and the accent. The other 7 data colours come from ${h === 'calm' ? 'the calm set' : 'the ' + h + ' harmony'}.`); }
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
// website applies them, and the slots in page units. Returns { design, slots, forAuthoring, why, smallPage?, repaired? }
// (repaired: each value of the given design that could not be used, with what was used instead)
export function planLayout(a) {
  const repaired = [], fix = (r) => repaired.push(r);
  const design = withDefaults(a.design, fix), l = design.layout;
  // choosing a layout, as on the website: its own KPI count and filters, and the size sliders back to its defaults
  if (a.layout) { l.preset = a.layout; l.kpis = E.LAYOUTS[a.layout].kpis; l.filters = E.LAYOUTS[a.layout].filters; delete l.kpiH; delete l.mainW; delete l.split; }
  // the KPI cards, 0-6: the engine's own count (0.2.9, A2-4: no kpiCards)
  if (a.kpis != null) l.kpis = a.kpis;
  if (a.filters != null) { l.filters = a.filters !== 'none'; if (l.filters) l.fpos = a.filters; }
  Object.assign(design.layout, layoutFrom({ page: a.page, header: a.header, dir: a.dir }, l, () => {}));
  // Round 19 and 22 (golden task 5 at 640 x 360 in Desktop): a page under 800 wide takes the single-focus layout and
  // its taller KPI cards. The rule is the design engine's (E.SMALL_PAGE, E.fitLayout; the audit's A2-1), so the website
  // lays out the same page; the plan shows the layout the page really gets
  const sp = E.smallPage(design.layout);
  let smallPage = null;
  if (sp) {
    design.layout = E.fitLayout(design.layout); ['kpiH', 'mainW', 'split'].forEach((k) => { if (design.layout[k] == null) delete design.layout[k]; });
    smallPage = Object.assign({}, sp, { say: `The page is ${sp.w} wide, under ${E.SMALL_PAGE.w}: the executive layout's four charts and table would be cut or scroll there, so this plan uses the single-focus layout (the KPI cards and one large chart). Say so in the plan; a page ${E.SMALL_PAGE.w} wide or more takes the executive layout.` });
  }
  E.repairState(design, fix);
  const lang = a.lang, nm = (x) => E.label(x, lang), layout = design.layout;   // (A2-9: labels keyed by language)
  // one row per visual, as the website's slot table: its name, the suggested visual, and x, y, w, h in page units
  const slots = E.computeSlots(layout, lang, { tableFields: a.tableFields }).map((s) => Object.assign({ role: nm(s.role), kind: s.kind, visual: nm(E.KINDS[s.kind]) }, E.boxOf(s, layout)));
  // the PBIR visual.json position, in reading order (top to bottom, then along the reading direction: the order
  // pbip-export.js sorts visuals in), z and tabOrder 1000, 2000...
  const right = E.rtl(layout, lang);
  const forAuthoring = slots.slice().sort((p, q) => (p.y - q.y) || (right ? q.x - p.x : p.x - q.x))
    .map((s, i) => ({ role: s.role, kind: s.kind, position: { x: s.x, y: s.y, z: (i + 1) * 1000, width: s.w, height: s.h, tabOrder: (i + 1) * 1000 } }));
  return Object.assign({ design, slots, forAuthoring, why: E.LAYOUTS[layout.preset].why.map(nm) }, smallPage ? { smallPage } : {}, repaired.length ? { repaired } : {});
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

