// The design tools' logic: a design (the Theme Generator's saved design) from the tools' inputs, with every value that
// could not be used listed with what was used instead. The engine is the website's own (assets/js/design-engine.js),
// so the MCP and the Theme Generator give the same theme JSON and slot tables byte for byte.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { inside, nothingAt } from './model.mjs';

const require = createRequire(import.meta.url);
export const E = require('../../assets/js/design-engine.js');

const HARMONIES = ['analogous', 'complementary', 'triadic', 'mono'];
// 0.2.9 (the reviewer, 11 Oct: the analogous harmony gave loud colours, #2ce21d, #2635e3, beside the owner's brand): the
// colours beside a brand, calm and told apart by hue; each is darkened (towards the text) or lightened until it stands
// 3:1 on the visuals' background, and one too near the brand's hue is skipped
const CALM = ['#2f6e9e', '#b86e00', '#1f7a70', '#6a4c93', '#b5452f', '#56636f', '#5e7f3a', '#8e5b2e', '#a23b72', '#3d7ea6'];
function calmData(brand, card, text) {
  const hue = (c) => E.hexToHsl(c), near = (a, b) => { const [h1, s1] = hue(a), [h2, s2] = hue(b), d = Math.abs(h1 - h2) % 360; return s1 > 0.15 && s2 > 0.15 && Math.min(d, 360 - d) < 25; };
  const out = [];
  for (const c0 of CALM) {
    if (out.length === 7) break;
    if (near(c0, brand) || out.some((x) => x === c0)) continue;
    let c = c0; for (let t = 0.1; E.contrast(c, card) < 3 && t <= 1; t += 0.1) c = E.mix(c0, text, t);
    if (!out.includes(c) && c !== brand) out.push(c);
  }
  return [brand].concat(out).slice(0, 8);
}
// the light page of a brand theme (0.2.9, O-11): a near-white page, white visuals, dark text; good, neutral and bad
// as the Corporate preset's (the accent is the brand)
const LIGHT_UI = { background: '#f5f7fa', card: '#ffffff', text: '#1f2933', accent: '#1f4e79', good: '#2e7d32', neutral: '#f9a825', bad: '#c62828' };
const UI_KEYS = ['background', 'card', 'text', 'accent', 'good', 'neutral', 'bad'];
const CONTRAST_NAMES = { textOnVisuals: 'Text on visuals', labelsOnVisuals: 'Labels on visuals', textOnPage: 'Text on page', color1OnVisuals: 'Color 1 on visuals' };

// a colour as the website takes it (#abc, abc, #aabbcc; any case), or null
const hex = (v) => (typeof v === 'string' ? E.clampHex(v) : null);

// The engine's own full design with everything given laid over it: the given layout is merged into the engine's
// current layout (so a partial one is never read as an old saved design, and the MCP never names a layout version),
// and the given data colours are used when there are 8 (otherwise the engine would drop the whole design)
// (0.2.9, the reviewer's answer to part 1's question, 11 Oct 2026: the owner chose light with the brand exact, O-11): a
// design without its own colours starts light (the Corporate preset), never the dark DataArcus one
export function withDefaults(given) {
  const base = E.repairState(E.fresh()), g = given ? JSON.parse(JSON.stringify(given)) : {};
  if (!(Array.isArray(g.data) && g.data.length === 8)) { delete g.data; Object.assign(base, { preset: 'Corporate', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui, g.ui && typeof g.ui === 'object' ? g.ui : {}) }); delete g.ui; delete g.preset; }
  return E.repairState(Object.assign(base, g, { layout: Object.assign(base.layout, g.layout && typeof g.layout === 'object' ? g.layout : {}) }));
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
      d.data = h === 'calm' ? calmData(b, d.ui.card, d.ui.text) : E.generate(b, h); d.data[0] = b; d.ui.accent = b; d.preset = null;
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
// website applies them, and the slots in page units. Returns { design, slots, forAuthoring, why }.
export function planLayout(a) {
  const design = withDefaults(a.design), l = design.layout;
  // choosing a layout, as on the website: its own KPI count and filters, and the size sliders back to its defaults
  if (a.layout) { l.preset = a.layout; l.kpis = E.LAYOUTS[a.layout].kpis; l.filters = E.LAYOUTS[a.layout].filters; delete l.kpiH; delete l.mainW; delete l.split; }
  // fewer than 3 KPI cards (the engine's own minimum): the layout keeps its 3 and the page shows kpiCards of them
  if (a.kpis != null) { l.kpis = Math.max(3, a.kpis); if (a.kpis < 3) l.kpiCards = a.kpis; else delete l.kpiCards; }
  if (l.wideTable !== false) l.wideTable = true;   // (a design that says false keeps equal shares) the owner, 6 Oct 2026: on a 4:3 page the table takes the wider share of its row (the design engine, computeSlots)
  if (a.filters != null) { l.filters = a.filters !== 'none'; if (l.filters) l.fpos = a.filters; }
  Object.assign(design.layout, layoutFrom({ page: a.page, header: a.header, dir: a.dir }, l, () => {}));
  // Round 19 (the owner's choice B, 6 Oct 2026; golden task 5 at 640 x 360 in Desktop: cut card values, "Wednes...", a
  // scrolling table): below 800 wide the executive layout's four charts do not fit, so the plan takes the single-focus
  // layout: the KPI cards and one large chart (the text box beside it only when the report is given its text)
  const SMALL_KPI_H = 116;
  let smallPage = null;
  const pw0 = E.page(design.layout).w;
  if (pw0 < 800 && design.layout.preset === 'exec') {
    const L = design.layout; L.preset = 'focus'; L.filters = E.LAYOUTS.focus.filters; delete L.kpiH; delete L.mainW; delete L.split;
    smallPage = { from: 'exec', to: 'focus', say: `The page is ${pw0} wide, under 800: the executive layout's four charts and table would be cut or scroll there, so this plan uses the single-focus layout (the KPI cards and one large chart). Say so in the plan; a page 800 wide or more takes the executive layout.` };
  }
  // Round 22 (the owner's (a) of the night sitting's question 4; golden task 5 at 640 x 360 in Desktop 2.158.1304: the
  // card values touched the card's bottom edge): under 800 wide the single-focus layout's KPI cards are one step
  // taller (SMALL_KPI_H on the 720 grid, the layout's own is 96), unless the design sets its own height
  if (pw0 < 800 && design.layout.preset === 'focus' && design.layout.kpiH == null) design.layout.kpiH = SMALL_KPI_H;
  E.repairState(design);
  const lang = a.lang, nm = (pair) => (lang === 'ar' ? pair[1] : pair[0]), layout = design.layout;
  // one row per visual, as the website's slot table: its name, the suggested visual, and x, y, w, h in page units
  const slots = E.computeSlots(layout, lang).map((s) => Object.assign({ role: nm(s.role), kind: s.kind, visual: nm(E.KINDS[s.kind]) }, E.boxOf(s, layout)));
  // the PBIR visual.json position, in reading order (top to bottom, then along the reading direction: the order
  // pbip-export.js sorts visuals in), z and tabOrder 1000, 2000...
  const right = E.rtl(layout, lang);
  const forAuthoring = slots.slice().sort((p, q) => (p.y - q.y) || (right ? q.x - p.x : p.x - q.x))
    .map((s, i) => ({ role: s.role, kind: s.kind, position: { x: s.x, y: s.y, z: (i + 1) * 1000, width: s.w, height: s.h, tabOrder: (i + 1) * 1000 } }));
  return Object.assign({ design, slots, forAuthoring, why: E.LAYOUTS[layout.preset].why.map(nm) }, smallPage ? { smallPage } : {});
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

// A file inside the DataArcus folder that doesn't exist yet: name.ext, name-2.ext, name-3.ext... (a name held by
// anything, a link included, is skipped)
export function freeFile(folder, base, ext) {
  const dir = inside(folder || '.');
  fs.mkdirSync(dir, { recursive: true });
  for (let n = 1; ; n++) {
    const f = path.join(dir, base + (n > 1 ? '-' + n : '') + ext);
    if (nothingAt(f)) return f;
  }
}
