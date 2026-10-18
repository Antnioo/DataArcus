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
export const { PRESETS, FONTS, AR_FONTS, CHART_OPTIONS, REPORT_TEXTS, texts, clampHex, lum, buildTheme, themeScaleOf, scaleTheme, projectPages, themeName, fileBase, imageSize, isSmall } = E;
// (0.2.9, audit 2's A2-3: the slot rules are the engine's: absorb for a text slot without its sentence, fitSlots for the rest)
export const { absorb, fitSlots } = E;
export const designRtl = E.rtl;

const HARMONIES = ['analogous', 'complementary', 'triadic', 'mono'];
// the light page of a brand theme (0.2.9, O-11): the Corporate preset's (the cross-review's G7: one light page, the
// design engine's; the brand is the accent)
const LIGHT_UI = E.PRESETS.Corporate.ui;
const UI_KEYS = ['background', 'card', 'text', 'accent', 'good', 'neutral', 'bad'];
const CONTRAST_NAMES = { textOnVisuals: 'Text on visuals', labelsOnVisuals: 'Labels on visuals', textOnPage: 'Text on page', color1OnVisuals: 'Color 1 on visuals' };

// a colour as the website takes it (#abc, abc, #aabbcc; any case), or null
const hex = (v) => (typeof v === 'string' ? E.clampHex(v) : null);

// ---- the default colours: an existing report's own theme (0.2.9, KEEP THE DASHBOARD'S IDENTITY: the owner's go, 12 Oct) ----
// Every new report got the plain Corporate preset when the chat named no colours, even when the model already had a
// designed report. Now, when a call names no colours (no preset, brand, palette or design colours) and one of the
// model's reports has a custom theme (lib/read-report.mjs: existingTheme), the design starts from that theme's colours.
// A base theme only, or no report: today's default, unchanged. An explicit colour request always wins.
// the line the plan and the answers say, English and Arabic (the engine's label pairs, as the plan's other words), by
// the source of the colours: the theme, the theme and the colours on the visuals, or those colours alone
export const THEME_LINE = (name) => [`Colours from your report's theme "${name}" (you can ask for a preset or your brand colours instead).`,
  `الألوان من سمة تقريرك "${name}" (يمكنك طلب نمط جاهز أو ألوان علامتك التجارية بدلاً منها).`];
const SOURCE_LINE = {
  'theme and visuals': (r, n) => [`Colours from your report "${r}": its theme "${n}" and the colours on its visuals (you can ask for a preset or your brand colours instead).`,
    `الألوان من تقريرك "${r}": سمته "${n}" والألوان المكتوبة على عناصره المرئية (يمكنك طلب نمط جاهز أو ألوان علامتك التجارية بدلاً منها).`],
  visuals: (r) => [`Colours from the colours on your report "${r}"'s visuals (it has no theme colours of its own; you can ask for a preset or your brand colours instead).`,
    `الألوان من الألوان المكتوبة على عناصر تقريرك "${r}" المرئية (ليس له ألوان سمة خاصة به؛ يمكنك طلب نمط جاهز أو ألوان علامتك التجارية بدلاً منها).`]
};
// does a design name its own colours (a design from generate_theme always does: its preset or its palette)
export const namesColours = (d) => !!(d && typeof d === 'object' && ((Array.isArray(d.data) && d.data.length) || (d.ui && typeof d.ui === 'object' && Object.keys(d.ui).length) || d.preset != null));
// rt: existingTheme's { report, theme (the report's identity), others }. The design's 8 data colours: the theme's own
// (those that differ from the base theme), then the colours written on the visuals by how often, then the engine's own
// analogous harmony from the first; a dark page (the theme's, else its visuals', darker than 0.45) gives a dark design
// (the DataArcus preset's page colours where the report sets none), a light one the Corporate preset's. Visuals the
// theme makes see-through (made for a page picture the new report will not have) stay solid. Colours that are exactly
// a preset's keep that preset's name. The page size is never taken: only colours, and the font, corner radius and
// shadow when the report's theme sets them.
// Returns { data, ui, preset, style { font, radius, shadow }, info } (info: what the plan says, in the plan's language).
// (polish round P1, the owner's go, 12 Oct; RESCORE-5, B-71/B-72: inspection's whole report turned red, the only colours
// on its visuals being a red and a green used as bad and good) a status colour is never the lead: the theme's own good,
// neutral or bad, or a red, green or amber found on the visuals. Status colours leave the data palette and, where the
// theme sets none, become its bad, good or neutral; with only status colours found the lead is the preset's, said in
// the plan. Hue bands (degrees): red under 15 or 345 and over, amber 35 to 55, green 90 to 150, with saturation 0.35 and
// over (a grey or a muted brand colour is never a status colour).
const statusOf = (c, t) => {
  const x = String(c).toLowerCase(), own = ['good', 'neutral', 'bad'].find((k) => t[k] && String(t[k]).toLowerCase() === x);
  if (own) return own;
  return E.statusHue(c);   // (the hue bands are the engine's, shared with the second colour's choice)
};
// a lead under 3:1 on the card is darkened, its hue kept (E.toContrast; P1, RESCORE-5)
const toContrast = E.toContrast;
// (P1+, LAB-POLISH section 5; P3, RESCORE-6 N28: on the default path too) a light design's near-white page becomes a 6% tint
// of the lead, the cards as they are; never on a dark design. Returns the tint, or null when it does not apply
const pageTint = (ui, lead) => (hex(ui.background) && hex(ui.card) && hex(lead) && E.lum(ui.background) > 0.45 && E.lum(ui.card) > 0.45 ? E.mix(hex(ui.card), hex(lead), 0.06) : null);
const TINT_LINE = (t) => `The page is a 6% tint of the lead colour (${t}), so the white visuals stand off it. Say it in the plan.`;
export function themeColours(rt, lang, opts) {
  const t = rt.theme, lumOf = (c) => E.lum(c), own = t.themeColours || [], painted = t.painted || [];
  const found = [...new Set(own.concat(painted))], status = found.filter((c) => statusOf(c, t)), lead1 = found.find((c) => !statusOf(c, t));
  // a status colour stays a data colour, only never the lead: the first other colour leads, the rest keep their order
  const palette = (lead1 ? [lead1] : []).concat(found.filter((c) => c !== lead1 && lead1)).slice(0, 8);
  const usedPainted = palette.some((c) => !own.includes(c));
  const source = own.length ? (usedPainted || !palette.length ? 'theme and visuals' : 'theme') : 'visuals';
  const dark = t.background ? lumOf(t.background) < 0.45 : t.card ? lumOf(t.card) < 0.45 : t.text ? lumOf(t.text) > 0.6 : false;
  const basis = dark ? 'DataArcus' : 'Corporate', base = E.PRESETS[basis];
  const statusOnly = !palette.length && status.length > 0;
  if (statusOnly) palette.push(base.data[0], ...status.slice(0, 7));
  const card = t.card || base.ui.card, lead0 = palette[0], lead = palette.length ? toContrast(lead0, card, 3) : lead0;
  if (lead !== lead0) palette[0] = lead;
  const fill = E.generate(palette[0], 'analogous');
  const data = Array.from({ length: 8 }, (_, i) => palette[i] || fill[i]);
  const byStatus = (k) => status.find((c) => statusOf(c, t) === k);
  const ui = { background: t.background || base.ui.background, card, text: t.text || base.ui.text, accent: t.accent && !statusOf(t.accent, t) && t.accent !== lead0 ? t.accent : palette[0],
    good: t.good || byStatus('good') || base.ui.good, neutral: t.neutral || byStatus('neutral') || base.ui.neutral, bad: t.bad || byStatus('bad') || base.ui.bad };
  const changes = [].concat(found.length && statusOf(found[0], t) ? [statusOnly
    ? `The report's only colours (${status.join(', ')}) are status colours (good, neutral, bad): they stay for good and bad, and the lead colour is the ${basis} preset's (${palette[0]}), so the report does not read as an alarm. You can ask for a brand colour instead.`
    : `${status.join(', ')} ${status.length === 1 ? 'is a status colour' : 'are status colours'} (good, neutral, bad): never the lead colour; the lead is ${palette[0]}.`] : [],
    lead !== lead0 ? [`Colour 1 ${lead0} is ${E.contrast(lead0, card).toFixed(1)}:1 on the cards (${card}): for lines, bars and accents it is ${lead}, the same hue ${dark ? 'lighter' : 'darker'}, at 3:1; the bars fade from a light tint of it up to ${lead} itself, never past it.`] : []);
  // (P3, N28) the page: the theme's own page colour is kept (identity); a theme without one gets the default's 6% tint
  const tint = !t.background && !dark && !(opts && opts.pageTint === false) ? pageTint(ui, data[0]) : null;
  if (tint) { ui.background = tint; changes.push(TINT_LINE(tint)); }
  const preset = Object.keys(E.PRESETS).find((k) => E.PRESETS[k].data.join() === data.join() && UI_KEYS.every((u) => E.PRESETS[k].ui[u] === ui[u])) || null;
  const filled = palette.length < 8 ? Array.from({ length: 8 - palette.length }, (_, i) => palette.length + i + 1) : [];
  const fromBase = UI_KEYS.filter((k) => !(k === 'accent' ? t.accent || palette[0] : t[k]));
  const style = Object.assign({}, t.font && E.FONTS.includes(t.font) ? { font: t.font } : {}, t.radius != null ? { radius: t.radius } : {}, t.shadow ? { shadow: true } : {});
  const line = source === 'theme' ? THEME_LINE(t.name) : SOURCE_LINE[source](rt.report, t.name);
  const info = Object.assign({ from: 'report theme', source, report: rt.report, theme: t.name, mode: dark ? 'dark' : 'light', sayInPlan: E.label(line, lang) },
    usedPainted ? { fromVisuals: palette.filter((c) => !own.includes(c)) } : {},
    filled.length ? { filled, how: `The report gives ${palette.length} data colour${palette.length === 1 ? '' : 's'}: colours ${filled[0]}-8 come from the engine's analogous harmony from the first (${palette[0]}).` } : {},
    changes.length ? { changes, sayInPlan2: 'Say each of these colour changes in the plan.' } : {},
    t.cardTransparent ? { solidVisuals: `The theme's visuals are ${t.cardTransparent}% transparent, made to sit on a page picture the new report will not have: the new visuals are solid (${ui.card}). Say it in the plan.` } : {},
    fromBase.length ? { fromPreset: { colours: fromBase, preset: basis, why: 'the report does not set them' } } : {},
    Object.keys(style).length ? { style } : {},
    rt.others && rt.others.length ? { otherReports: rt.others, pick: `This model has other reports of the user's too (${rt.others.join(', ')}): say so in the plan; to keep another one's colours, call again with themeFrom: "<report>".` } : {});
  return { data, ui, preset, style, info };
}

// The engine's own full design with everything given laid over it: the given layout is merged into the engine's
// current layout (so a partial one is never read as an old saved design, and the MCP never names a layout version),
// and the given data colours are used when there are 8 (otherwise the engine would drop the whole design)
// (0.2.9, the reviewer's answer to part 1's question, 11 Oct 2026: the owner chose light with the brand exact, O-11): a
// design without its own colours starts light (the Corporate preset), never the dark DataArcus one
// report (optional): told each value of the given design the engine could not use (E.repairState's report)
export function withDefaults(given, report) {
  const base = E.repairState(E.fresh()), g = given ? JSON.parse(JSON.stringify(given)) : {};
  if (!(Array.isArray(g.data) && g.data.length === 8)) { const gu = g.ui && typeof g.ui === 'object' ? g.ui : {}; delete g.data; Object.assign(base, { preset: 'Corporate', data: E.PRESETS.Corporate.data.slice(), ui: Object.assign({}, E.PRESETS.Corporate.ui, gu) }); delete g.ui; delete g.preset;
    // (P3, RESCORE-6 N28) the default's near-white page takes the 6% tint of the lead, unless a page colour was given
    const tint = gu.background == null ? pageTint(base.ui, base.data[0]) : null; if (tint) base.ui.background = tint; }
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
    if (Object.hasOwn(E.PRESETS, a.preset)) preset = a.preset;
    else fix('preset', a.preset, preset, `not a preset; use one of ${Object.keys(E.PRESETS).join(', ')}`);
  }
  // (keep the dashboard's identity) no colours asked (no preset, palette, brand or mode) and the model's report has its
  // own theme: the design starts from it
  const own = a.reportTheme && a.reportTheme.theme && a.preset == null && !a.palette && a.brand == null && a.mode == null ? themeColours(a.reportTheme, a.lang, { pageTint: a.pageTint }) : null;
  if (!own && a.preset == null && !a.palette && a.brand == null) notes.push(dark ? 'No colours asked: the DataArcus preset (dark, as asked).' : 'No colours asked: the Corporate preset, light. Dark only when the user asks for it (mode "dark").');
  d.preset = preset; d.data = E.PRESETS[preset].data.slice(); d.ui = { ...E.PRESETS[preset].ui };
  if (own) { d.data = own.data; d.ui = own.ui; d.preset = own.preset; if (own.style.font && a.font == null) d.font = own.style.font; notes.push(own.info.sayInPlan); }
  // a preset whose page is not what the user asked for (mode): the preset's data colours and accent on the asked page
  if (a.preset != null && Object.hasOwn(E.PRESETS, a.preset) && a.mode && !a.palette && a.brand == null && (E.lum(d.ui.background) > 0.45) === dark) {
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
    else { d.ui = Object.assign({}, a.mode ? (dark ? E.PRESETS.DataArcus.ui : LIGHT_UI) : a.preset != null && Object.hasOwn(E.PRESETS, a.preset) ? E.PRESETS[a.preset].ui : LIGHT_UI);
      d.data = h === 'calm' ? E.calmPalette(b, d.ui.card, d.ui.text) : E.generate(b, h); d.data[0] = b; d.ui.accent = b; d.preset = null;
      notes.push(`The brand colour ${b} is used exactly as given: the first data colour and the accent. The other 7 data colours come from ${h === 'calm' ? 'the calm set' : 'the ' + h + ' harmony'}.`); }
  } else if (a.harmony != null) fix('harmony', a.harmony, null, 'not used: no brand colour given');
  if (a.name != null) d.name = String(a.name);
  if (a.font != null) {
    if (E.FONTS.includes(a.font)) { d.font = a.font; if (!E.MEASURED_FONTS.includes(a.font)) notes.push(`${a.font}: the text room of the cards, header, filters and tables was measured in Power BI Desktop in ${E.MEASURED_FONTS.join(' and ')} only; ${a.font} is not measured yet, so a long title or value may be cut. Say so in the plan, or offer ${E.MEASURED_FONTS.join(' or ')}.`); }
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
  d.layout = layoutFrom(Object.assign({}, own && own.style.radius != null ? { radius: own.style.radius } : {}, own && own.style.shadow ? { shadow: true } : {}, a.layout || {}), withDefaults().layout, fix);
  // (P1+, the laptop's LAB-POLISH section 5, measured in Desktop on 12 Oct: white panels on a white page lifted half a
  // point with it) a light design's page is a 6% tint of the lead colour, the cards as they are; never on a dark design or
  // over a background the user asked for (palette.ui.background); off with pageTint: false
  // (a report's own theme is tinted, or not, by themeColours: its own page colour is kept, P3 N28)
  if (a.pageTint !== false && !dark && !own && !(a.palette && a.palette.ui && hex(a.palette.ui.background))) {
    const tint = pageTint(d.ui, d.data[0]);
    if (tint && tint !== d.ui.background) { d.ui.background = tint; notes.push(TINT_LINE(tint).replace(' Say it', ' pageTint: false keeps the plain page. Say it')); }
  }
  const design = E.repairState(d);
  return Object.assign({ design, repaired, notes }, own ? { fromReport: Object.assign(own.info, { contrastWarnings: contrastReport(design).warnings }) } : {});
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
// (0.2.9, A2-3: a.fit(design, slots), when given, returns the engine's fitSlots options for the page, the report writer's
// measures (Pbip.fitOptions): the slots are those the report will have, and z and tabOrder follow them)
// (repaired: each value of the given design that could not be used, with what was used instead)
export function planLayout(a) {
  const repaired = [], fix = (r) => repaired.push(r);
  // (keep the dashboard's identity) a design without its own colours starts from the model's report's theme (a.reportTheme:
  // existingTheme's); a design from generate_theme made without the model keeps its colours, and the plan says how to
  // keep the report's theme instead
  const rt = a.reportTheme && a.reportTheme.theme ? a.reportTheme : null;
  let given = a.design, colours = null;
  // rc.22, B-132 (the owner's rc.21 test: colors { accent } kept the Corporate preset's navy data colours; O-11: the brand
  // colour is exact by default): an accent given with no theme file and no design of its own colours (or the plain
  // default one) makes the data colours as generate_theme does from a brand colour: the accent first and exact, the
  // others from its calm set; text, card and page colours given are kept
  const acc = a.colors && typeof a.colors === 'object' ? hex(a.colors.accent) : null;
  const plainDesign = !namesColours(a.design) || (a.design.preset === 'Corporate' && Array.isArray(a.design.data) && a.design.data.join() === E.PRESETS.Corporate.data.join());
  if (acc && !a.theme && plainDesign) {
    const td = themeDesign({ brand: acc, lang: a.lang }).design, own = Object.fromEntries(['text', 'card', 'background'].map((k) => [k, hex(a.colors[k])]).filter(([, v]) => v));
    given = Object.assign({}, a.design || {}, { data: td.data.slice(), ui: Object.assign({}, td.ui, own, { accent: acc }), preset: null });
    colours = { from: 'accent', accent: acc, data: td.data.slice(), sayInPlan: `The colours come from the accent ${acc}, used exactly: it is the first data colour and the accent; the other 7 data colours are its calm set (as generate_theme makes them from a brand colour). Show them in the plan.` };
  }
  else if (rt && !namesColours(a.design)) {
    const c = themeColours(rt, a.lang), g0 = a.design || {}, gl = g0.layout && typeof g0.layout === 'object' ? g0.layout : {};
    // (the font, corners and shadow of a rich theme, where the design has those settings and does not set them itself)
    given = Object.assign({}, g0, { data: c.data, ui: c.ui, preset: c.preset }, c.style.font && g0.font == null ? { font: c.style.font } : {},
      { layout: Object.assign({}, c.style.radius != null && gl.radius == null ? { radius: c.style.radius } : {}, c.style.shadow && gl.shadow == null ? { shadow: true } : {}, gl) });
    colours = c.info;
  }
  else if (rt && a.design && a.design.preset === 'Corporate' && Array.isArray(a.design.data) && a.design.data.join() === E.PRESETS.Corporate.data.join())
    colours = { from: 'design', note: `The model's report "${rt.report}" has its own theme "${rt.theme.name}"; this design has the Corporate preset (generate_theme was called without the model). If the user asked for no colours, call generate_theme again with path (the model) to keep the report's theme, then plan again; otherwise say the colours are the Corporate preset.` };
  const design = withDefaults(given, fix), l = design.layout;
  // (P3, N28) the default design's page is the 6% tint (withDefaults): said in the plan
  const tinted = !namesColours(given) && !(given && given.ui && given.ui.background != null) ? { pageTint: TINT_LINE(design.ui.background) } : null;
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
  const planned = E.computeSlots(layout, lang, { tableFields: a.tableFields, noTime: a.noTime }).map((s) => Object.assign({ role: nm(s.role), kind: s.kind, visual: nm(E.KINDS[s.kind]) }, E.boxOf(s, layout), s.topN ? { topN: s.topN } : {}));   // (D16: a.noTime; S5: each category chart's topN)
  const slots = a.fit ? E.fitSlots(planned, a.fit(design, planned)).slots : planned;
  // the PBIR visual.json position, in reading order (top to bottom, then along the reading direction: the order
  // pbip-export.js sorts visuals in), z and tabOrder 1000, 2000...
  const right = E.rtl(layout, lang);
  const forAuthoring = slots.slice().sort((p, q) => (p.y - q.y) || (right ? q.x - p.x : p.x - q.x))
    .map((s, i) => ({ role: s.role, kind: s.kind, position: { x: s.x, y: s.y, z: (i + 1) * 1000, width: s.w, height: s.h, tabOrder: (i + 1) * 1000 } }));
  if (colours && colours.from === 'report theme') colours.contrastWarnings = contrastReport(design).warnings;
  // (the owner's decision on layouts, 12 Oct: a setup that ships as preview says so in one plain line, E.isPreview)
  return Object.assign({ design, slots, forAuthoring, why: E.LAYOUTS[layout.preset].why.map(nm) }, E.isPreview(layout) ? { preview: nm(E.LAYOUT_PREVIEW) } : {}, tinted || {}, smallPage ? { smallPage } : {}, repaired.length ? { repaired } : {}, colours ? { colours } : {});
}

// (rc.22, B-140) a slot kind's visual, in the plan's language (the slots' "visual")
export const kindLabel = (kind, lang) => E.label(E.KINDS[kind], lang);

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

