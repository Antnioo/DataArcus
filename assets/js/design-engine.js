/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design engine: the Theme & Layout Generator's theme and layout logic, with no page.
 * Colours and harmonies, the theme JSON Power BI imports, page sizes, the layout slots in page units and the
 * background drawing (SVG). Pure JavaScript: the generator page and the DataArcus MCP use the same code, in the
 * browser and in Node. Every input is explicit: a design { name, font, data, ui, chart, layout } and the language.
 * Moved from theme-generator.js as it was, so both give the same result byte for byte (tests: design-engine).
 * (0.3.2 SP6, SP29) The parts live in their own files, which this one loads and re-exports as DAEngine, the facade:
 * design-colours.js (the colour math), design-glass.js (the glass look), design-metrics.js (the layout geometry and the
 * text sizes), design-state.js (the saved designs: their version, upgrade and repair). Kept here: the presets and
 * defaults, a design's colours and roles, the PNG writer, the theme JSON, the readability checks, the background
 * drawing, the report's labels and the file names.
 */
(function (root) {
  // text-measure.js: the font catalog, the measured heights and Power BI's 8-60 text sizes, one place (0.3.2 OP1; the
  // generator pages load it before this file)
  const TM = typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure;
  // design-colours.js: the colour math (0.3.2 SP6; the generator pages load it before this file)
  const C = typeof module !== 'undefined' && module.exports ? require('./design-colours.js') : root.DAColours;
  const { clampHex, hexToRgb, rgbToHex, mix, lum, contrast, hexToHsl, hslToHex, toContrast, secondColour, statusHue, fadeEnds, generate, calmPalette, CALM, rgbToLab, hexToLab, deltaE, simulateCvd, logoColours } = C;
  // design-metrics.js: the layout geometry and the typography (0.3.2 SP29; the generator pages load it before this file)
  const Mx = typeof module !== 'undefined' && module.exports ? require('./design-metrics.js') : root.DAMetrics;
  const { M, G, HH, PAGES, DEFAULT_PAGE, LIM, within, fitCustom, page, pw, toPage, boxOf, T, baseLang, label, LAYOUTS, RTL_LANGS, rtl, SMALL_PAGE, smallPage, isSmall, fitLayout, TABLE_NEED, tableWeight, RANGE, rangeOf, clampTo, CATEGORY_KINDS, CATEGORY_FIT, categoryFit, noTimeOf, LAYOUT_PREVIEW, isPreview, hasMain, hasSplit, sizes, computeSlots, imageSize, pngSize, FHD_TEXT, textScale, sizeAt, fs, TEXT_BASES, themeScaleOf, scaleTheme, barW, c0, kpiInset, projectSlots, secondLayout, slidePanel, absorb, SLOT_GAP, REFLOW_KEEP, fitSlots, fitScale, projectPages } = Mx;
  const PRESETS = {
    'DataArcus': { data: ['#00d4ff', '#6c5ce7', '#00cec9', '#fd79a8', '#0084ff', '#a29bfe', '#fdcb6e', '#40f3ff'], ui: { background: '#0a0f1c', card: '#1a1f2e', text: '#f8fafc', accent: '#00d4ff', good: '#00b894', neutral: '#fdcb6e', bad: '#e17055' } },
    'Corporate': { data: ['#1f4e79', '#2e75b6', '#f4b183', '#c55a11', '#548235', '#9dc3e6', '#a9d18e', '#7f7f7f'], ui: { background: '#f3f5f8', card: '#ffffff', text: '#1f2933', accent: '#1f4e79', good: '#2e7d32', neutral: '#f9a825', bad: '#c62828' } },
    'Colorblind safe': { data: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9', '#d55e00', '#f0e442', '#000000'], ui: { background: '#f5f5f5', card: '#ffffff', text: '#222222', accent: '#0072b2', good: '#009e73', neutral: '#e69f00', bad: '#d55e00' } },
    'Desert Gulf': { data: ['#0f4c5c', '#c8963e', '#e36414', '#2a9d8f', '#5f0f40', '#fb8b24', '#9a031e', '#6c757d'], ui: { background: '#faf6ef', card: '#ffffff', text: '#2b2118', accent: '#0f4c5c', good: '#2a9d8f', neutral: '#c8963e', bad: '#9a031e' } },
    'Midnight': { data: ['#4cc9f0', '#f72585', '#ffd166', '#4361ee', '#b5179e', '#90e0ef', '#7209b7', '#06d6a0'], ui: { background: '#0b0d17', card: '#15182a', text: '#e8eaf6', accent: '#4cc9f0', good: '#06d6a0', neutral: '#ffd166', bad: '#ef476f' } },
    'Earthy': { data: ['#6b705c', '#cb997e', '#3f4238', '#e9c46a', '#8a5a44', '#a5a58d', '#264653', '#ddbea9'], ui: { background: '#f7f4ef', card: '#ffffff', text: '#2d2a26', accent: '#6b705c', good: '#588157', neutral: '#e9c46a', bad: '#bc4749' } }
  };
  // The fonts the generator offers (its font list is drawn from them, theme-generator.js) and its chart choices (a test
  // keeps the page's lists the same): the fonts are text-measure.js's catalog
  const FONTS = TM.FONTS;
  // (0.3.1 GL1) look: the cards' look, Power BI's own (auto) or glass (see GLASS below)
  const CHART_OPTIONS = { labels: ['auto', 'on', 'off'], grid: ['auto', 'dotted', 'off'], legend: ['auto', 'Top', 'TopCenter', 'Bottom', 'Right', 'off'], axis: ['auto', 'off'], table: ['auto', 'minimal', 'banded'], look: ['auto', 'glass'] };
  // The fonts text sizes were measured in, in Power BI Desktop (the header and rail heights of minOf, the table's need
  // of TABLE_NEED, the writer's text widths): Segoe UI and Tahoma only. The others are offered; a wider one (Verdana)
  // may need more room than measured until the laptop proof "A2-11" in DESKTOP-TESTS.md (0.2.9, the audit's A2-11)
  const MEASURED_FONTS = TM.MEASURED_FONTS;
  // Every font in the list is built into Power BI, but only these have Arabic letters
  const AR_FONTS = TM.AR_FONTS;
  // The theme's name when none is given (the name box shows it to new visitors): the theme JSON and every file use it,
  // so an empty or blank name gives one name everywhere. A name with text is kept exactly as typed.
  const DEFAULT_NAME = 'My Brand Theme';
  // The longest theme name, as the name box takes it (maxlength 60) and generate_theme: repairState cuts a longer one
  // (0.2.9, the audit's A2-12: a 5,000-character name reached the theme, the file names and the tools' answers)
  const NAME_MAX = 60;
  const themeName = (name) => (name && String(name).trim() ? name : DEFAULT_NAME);

  // ---------- color math ----------
  // A design's colours as the engine draws and writes them: each a hex colour, else the default design's (fresh); never
  // a caller's text (0.2.9, the audit's A2-7: an unrepaired ui.background reached the background SVG the website sets
  // as innerHTML). d: the design
  const colours = (d) => {
    const D = PRESETS.DataArcus, u = d && d.ui && typeof d.ui === 'object' ? d.ui : {}, data = d && Array.isArray(d.data) && d.data.length ? d.data : D.data;
    const ok = (v, f) => (typeof v === 'string' && clampHex(v)) || f;
    return { ui: Object.fromEntries(Object.keys(D.ui).map((k) => [k, ok(u[k], D.ui[k])])), data: data.map((c, i) => ok(c, D.data[i % D.data.length])) };
  };
  // The colours a theme derives from its page colours (0.2.9, the audit's A2-10: they were mixed in five places, so a
  // change to one was missed in the preview or the contrast check): secondary text (labels), tertiary text, the dotted
  // gridline and the theme's neutral background, the table's lines, the light background, the header band, the filter
  // rail and the panels' edge (lighter on a light page). ui: the design's ui
  const roles = (ui) => {
    const u = colours({ ui }).ui, light = lum(u.background) > 0.45;
    return { secondary: mix(u.text, u.card, 0.35), tertiary: mix(u.text, u.card, 0.6), gridline: mix(u.text, u.card, 0.8), grid: mix(u.text, u.card, 0.85),
      backgroundLight: mix(u.card, u.background, 0.5), band: mix(u.card, u.background, 0.25), rail: mix(u.card, u.background, 0.35), edge: mix(u.text, u.card, light ? 0.86 : 0.9), light };
  };
  // The colours a KPI bar or the header line can take (the page's choices)
  const BAR_COLORS = ['accent', 'good', 'neutral', 'data'];
  // The palette from a logo's colours (design-colours.js logoTheme), on the design's page colours repaired (o.ui)
  const logoTheme = (brand, o) => C.logoTheme(brand, o, colours({ ui: (o || {}).ui }).ui);

  // ---------- labels ----------
  // The visuals' kinds by name, in each language (T and label: design-metrics.js)
  const KINDS = { kpi: T('Card', 'بطاقة'), line: T('Line chart', 'مخطط خطي'), bar: T('Bar chart', 'مخطط شريطي'), column: T('Column chart', 'مخطط أعمدة'), donut: T('Donut chart', 'مخطط دائري'), table: T('Table or matrix', 'جدول أو مصفوفة'), text: T('Text box or narrative', 'مربع نص أو سرد'), slicer: T('Slicers', 'مقسمات (Slicers)'), title: T('Text box (page title)', 'مربع نص (عنوان الصفحة)'), logo: T('Image (logo)', 'صورة (الشعار)') };
  // ---------- the theme JSON ----------
  // Every visual type in Power BI's theme schema (2.157). The Fluent 2 base theme sets rounded corners per
  // visual type, which outranks a theme's "every visual" (*) value, so the radius is also written per type.
  const VISUAL_TYPES = ['group', 'actionButton', 'bookmarkNavigator', 'textbox', 'pageNavigator', 'shape', 'barChart', 'columnChart', 'clusteredBarChart',
    'clusteredColumnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart',
    'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'lineClusteredColumnComboChart', 'ribbonChart', 'waterfallChart', 'funnel',
    'scatterChart', 'pieChart', 'donutChart', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'gauge', 'cardVisual', 'card', 'multiRowCard', 'kpi',
    'slicer', 'tableEx', 'pivotTable', 'scriptVisual', 'pythonVisual', 'keyDriversVisual', 'decompositionTreeVisual', 'qnaVisual', 'aiNarratives',
    'scorecard', 'rdlVisual', 'advancedSlicerVisual', 'textSlicer', 'listSlicer', 'image'];
  // Corners: Power BI only rounds a visual when its border is on. Solid visuals get a 1px border in their own
  // background color (invisible, only the rounded shape shows); transparent visuals sit on the PNG panels, no border.
  // t: the visual type. The card visual gets no "radius": inside a theme its "border" is the card's own border, which
  // has none (Microsoft's validator: "Unknown theme property border.radius for cardVisual"), and Desktop 2.158 draws
  // the card's corners the same with or without it (scripts/tests/DESKTOP-TESTS.md, 2026-10-01).
  const borderStyle = (u, l, t) => (l && l.transparent
    ? [{ show: false }]
    : [Object.assign({ show: true, color: { solid: { color: u.card } }, width: 1 }, t === 'cardVisual' ? {} : { radius: toPage(+l.radius || 0, l) })]);
  // Power BI's own visual shadow (on by default in Fluent 2) is a square box: with the PNG it would show around
  // the rounded panels, so transparent visuals never get it; solid visuals follow the Soft shadows option
  const shadowStyle = (l) => [{ show: !!(l && !l.transparent && l.shadow) }];
  // The visual types with text sizes of their own (the sizes from design-metrics.js's fs), each with the look's border
  // and shadow
  const textSizes = (d) => {
    const l = d.layout, f = (n) => fs(n, l), g = isGlass(d) ? glassLook(d) : null;
    const merge = (t, extra) => ({ [t]: { '*': Object.assign(g ? { border: glassCards(d.ui, l, g, t).border, dropShadow: glassCards(d.ui, l, g, t).dropShadow } : { border: borderStyle(d.ui, l), dropShadow: shadowStyle(l) }, extra) } });
    const grid = { values: [{ fontSize: f(10) }], columnHeaders: [{ fontSize: f(10) }], total: [{ fontSize: f(10) }] };
    return Object.assign({},
      merge('tableEx', grid),
      merge('pivotTable', Object.assign({ rowHeaders: [{ fontSize: f(10) }] }, grid)),
      merge('slicer', { header: [{ textSize: f(10) }], items: [{ textSize: f(10) }] }),
      merge('card', { labels: [{ fontSize: f(28) }], categoryLabels: [{ fontSize: f(10) }] }),
      merge('multiRowCard', { cardTitle: [{ fontSize: f(12) }], dataLabels: [{ fontSize: f(18) }], categoryLabels: [{ fontSize: f(10) }] }));
  };
  // Chart style: theme-wide defaults, written only to the visual types whose theme schema (2.157) has that
  // setting, because Power BI rejects the whole theme when one property is unknown. "auto" writes nothing.
  const CHART_DEFAULTS = { labels: 'auto', grid: 'auto', legend: 'auto', axis: 'auto', table: 'auto', look: 'auto' };
  const chart = (d) => Object.assign({}, CHART_DEFAULTS, d.chart);
  const AXIS_CHARTS = ['barChart', 'columnChart', 'clusteredBarChart', 'clusteredColumnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart',
    'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'lineClusteredColumnComboChart', 'ribbonChart', 'waterfallChart'];
  // lang: the page's language, which sets the reading direction when the layout has none
  const chartStyles = (u, d, lang) => {
    const c = chart(d), out = {};
    const add = (types, card, props) => types.forEach((t) => {
      const v = ((out[t] = out[t] || { '*': {} })['*']);
      v[card] = [Object.assign((v[card] || [{}])[0], props)];
    });
    if (c.labels !== 'auto') add(AXIS_CHARTS, 'labels', { show: c.labels === 'on' });
    // (polish round P1, the owner's go, 12 Oct; B-72: axes and gridlines in Power BI's own default grey under a coloured
    // theme) the axis labels take the secondary grey mixed from the theme's own text colour (roles); the gridlines get
    // theirs from the report writer's quiet grid (text mixed 0.85 towards the card), which a gridline colour in the
    // theme would switch off, so none is written here unless a grid is asked (below). Only with a chart style chosen:
    // "Power BI default" (every setting auto) writes no chart settings, as the website promises
    if (Object.keys(CHART_DEFAULTS).some((k) => c[k] !== 'auto')) { const sec = c.look === 'glass' ? glassLook(d).labels : roles(u).secondary; add(AXIS_CHARTS.concat('scatterChart'), 'categoryAxis', { labelColor: { solid: { color: sec } } });
      add(AXIS_CHARTS.concat('scatterChart'), 'valueAxis', { labelColor: { solid: { color: sec } } }); }
    if (c.grid !== 'auto') {
      const g = c.grid === 'off' ? { gridlineShow: false } : { gridlineShow: true, gridlineStyle: 'dotted', gridlineColor: { solid: { color: roles(u).gridline } } };
      add(AXIS_CHARTS.concat('scatterChart'), 'valueAxis', g);
      // waterfall has no category gridlines in the schema; Power BI draws none there anyway
      if (c.grid === 'off') add(AXIS_CHARTS.concat('scatterChart').filter((t) => t !== 'waterfallChart'), 'categoryAxis', { gridlineShow: false });
    }
    // "Side" is stored as Right; in a right-to-left design it goes to the left, mirrored like the rest of the layout
    if (c.legend !== 'auto') add(AXIS_CHARTS.concat('scatterChart', 'pieChart', 'donutChart', 'treemap'), 'legend', c.legend === 'off' ? { show: false }
      // (round 15, the owner's go on round 13's recommendation 2c: a side legend sits at the right in Arabic too; it
      // went to the left in a right-to-left design before)
      : { show: true, position: c.legend });
    if (c.axis === 'off') ['valueAxis', 'categoryAxis'].forEach((a) => add(AXIS_CHARTS.concat('scatterChart'), a, { showAxisTitle: false }));
    if (c.table !== 'auto') {
      const line = { solid: { color: roles(u).grid } };
      add(['tableEx', 'pivotTable'], 'grid', { gridVertical: false, gridHorizontal: c.table === 'minimal', gridHorizontalColor: line });
      // (GL1) glass cards keep their table cells see-through: no back colour, which would be solid
      if (c.look !== 'glass') add(['tableEx', 'pivotTable'], 'values', { backColorPrimary: { solid: { color: u.card } }, backColorSecondary: { solid: { color: c.table === 'banded' ? mix(u.card, u.accent, 0.08) : u.card } } });
    }
    if (c.look === 'glass') glassTables(glassLook(d).table).forEach(([types, card, props]) => add(types, card, props));
    return out;
  };
  // Adds the chart style cards into the per-visual entries built above (tables already carry text sizes there)
  const withChartStyles = (vs, u, d, lang) => {
    Object.entries(chartStyles(u, d, lang)).forEach(([t, v]) => {
      const cur = ((vs[t] = vs[t] || { '*': {} })['*']);
      Object.entries(v['*']).forEach(([card, arr]) => { cur[card] = [Object.assign({}, (cur[card] || [{}])[0], arr[0])]; });
    });
    return vs;
  };
  // (0.3.0 L5, the theme-icons lab of 10 Oct, Desktop 2.158.1304) DataArcus's three status icons, at the theme's top level
  // ("icons", a root key Microsoft's validator knows), for conditional formatting: unused until a rule or a measure names
  // them. They differ in shape as well as colour (a tick in a circle, a triangle with "!", a cross in a rounded square), so
  // they read without colour. Each in the theme's good / neutral / bad taken to 3:1 on the visuals' background (WCAG 1.4.11,
  // hue kept), its mark white or near black, whichever stands higher on it. Inside a data URI a colour is rgb(): a
  // bare "#" ends the URI. ui: the design's ui
  const ICON_NAMES = { good: 'daGood', neutral: 'daWarn', bad: 'daBad' };
  const statusIcons = (ui) => {
    const u = colours({ ui }).ui, rgb = (h) => 'rgb(' + hexToRgb(h).join(',') + ')';
    const svg = (body) => "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'>" + body + '</svg>';
    const line = (d, m) => `<path d='${d}' fill='none' stroke='${m}' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/>`;
    const one = (k) => { const f = toContrast(u[k], u.card, 3), m = contrast('#ffffff', f) >= contrast('#1f2329', f) ? '#ffffff' : '#1f2329'; return { f: rgb(f), m: rgb(m) }; };
    const g = one('good'), n = one('neutral'), b = one('bad');
    return {
      daGood: { description: 'DataArcus good', url: svg(`<circle cx='8' cy='8' r='7' fill='${g.f}'/>` + line('M4.5 8.2l2.3 2.3 4.7-4.9', g.m)) },
      daWarn: { description: 'DataArcus warning', url: svg(`<path d='M8 1.2L15.2 14.3H0.8Z' fill='${n.f}' stroke='${n.f}' stroke-width='1' stroke-linejoin='round'/>` + line('M8 5.8v4', n.m) + `<circle cx='8' cy='12.2' r='1' fill='${n.m}'/>`) },
      daBad: { description: 'DataArcus bad', url: svg(`<rect x='1.5' y='1.5' width='13' height='13' rx='3' fill='${b.f}'/>` + line('M5.5 5.5l5 5M10.5 5.5l-5 5', b.m)) }
    };
  };
  // (0.3.1 GD1, the owner, 27 Oct: "i want to make the glassy dashboard default") the look a new design starts in: the
  // Theme Generator's first visit, generate_theme and every new report without a look asked. A saved design without a
  // look keeps the look it was made with (CHART_DEFAULTS: "auto", plain); the redesign, the twin and the EN-AR copy keep
  // the original report's
  const DEFAULT_LOOK = 'glass';
  // ---- a PNG without a canvas, so the website and the MCP write the same pixels (the browser deflates in JavaScript, Node by node:zlib, LC1) ----
  // RGB, 8 bits; each row filtered with the PNG filter of the smallest sum (None, Sub, Up, Average, Paeth: PNG's own
  // advice); LZ77 matches in one deflate block with its own Huffman codes (RFC 1951), in a zlib stream (RFC 1950)
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (b) => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258], LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577], DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const rev = (c, n) => { let r = 0; for (let i = 0; i < n; i++) { r = (r << 1) | (c & 1); c >>= 1; } return r; };
  const codeOf = (base, v) => { let i = base.length - 1; while (base[i] > v) i--; return i; };
  const LEN_CODE = Uint8Array.from({ length: 259 }, (_, v) => (v < 3 ? 0 : codeOf(LEN_BASE, v)));
  // Huffman code lengths for counts, none over max (the counts halved until they fit); deterministic ties
  const huffLengths = (counts, max) => {
    let f = counts.slice();
    for (;;) {
      const len = new Array(f.length).fill(0), used = f.map((c, i) => [c, i]).filter(([c]) => c > 0);
      if (used.length === 1) { len[used[0][1]] = 1; return len; }
      let nodes = used.map(([c, i]) => ({ c, i, leaf: true }));
      while (nodes.length > 1) { nodes.sort((a, b) => a.c - b.c || (a.i - b.i)); const [a, b] = nodes.splice(0, 2); nodes.push({ c: a.c + b.c, i: Math.min(a.i, b.i) + f.length, kids: [a, b] }); }
      let deep = 0; const walk = (n, d) => { if (n.leaf) { len[n.i] = d; deep = Math.max(deep, d); } else n.kids.forEach((k) => walk(k, d + 1)); }; walk(nodes[0], 0);
      if (deep <= max) return len;
      f = f.map((c) => (c ? (c >> 1) | 1 : 0));
    }
  };
  const canon = (len) => { const max = Math.max(...len), bl = new Array(max + 1).fill(0); len.forEach((l) => { if (l) bl[l]++; });
    const next = [0]; for (let b = 1, code = 0; b <= max; b++) { code = (code + bl[b - 1]) << 1; next[b] = code; } bl[0] = 0;
    return len.map((l) => (l ? rev(next[l]++, l) : 0)); };
  const deflate = (data) => {
    // the matches: a token per literal (its byte) or match (256 + its length, then its distance)
    const n = data.length, tok = new Int32Array(n + 1), WIN = 32768, HS = 1 << 15, head = new Int32Array(HS).fill(-1), prev = new Int32Array(WIN);
    const lc = new Array(286).fill(0), dcnt = new Array(30).fill(0); let nt = 0;
    const hash = (i) => ((data[i] << 10) ^ (data[i + 1] << 5) ^ data[i + 2]) & (HS - 1);
    const insert = (i) => { if (i + 2 < n) { const h = hash(i); prev[i & (WIN - 1)] = head[h]; head[h] = i; } };
    for (let i = 0; i < n;) {
      let best = 0, dist = 0;
      if (i + 2 < n) {
        let j = head[hash(i)], chain = 48;
        while (j >= 0 && i - j <= WIN && chain-- > 0) {
          if (data[j + best] === data[i + best]) { let k = 0; while (k < 258 && i + k < n && data[j + k] === data[i + k]) k++; if (k > best) { best = k; dist = i - j; if (k === 258) break; } }
          j = prev[j & (WIN - 1)];
        }
      }
      if (best >= 3) { tok[nt++] = (best << 16) | dist; lc[257 + LEN_CODE[best]]++; dcnt[codeOf(DIST_BASE, dist)]++; for (let k = 0; k < best; k++) insert(i + k); i += best; }
      else { tok[nt++] = -1 - data[i]; lc[data[i]]++; insert(i); i++; }
    }
    lc[256] = 1; if (!dcnt.some(Boolean)) dcnt[0] = 1;
    const LL = huffLengths(lc, 15), DL = huffLengths(dcnt, 15), LC = canon(LL), DC = canon(DL);
    let nl = 286; while (nl > 257 && !LL[nl - 1]) nl--; let nd = 30; while (nd > 1 && !DL[nd - 1]) nd--;
    // the code lengths, run-length coded (16: the last length again 3-6 times, 17: 3-10 zeros, 18: 11-138 zeros)
    const all = LL.slice(0, nl).concat(DL.slice(0, nd)), rl = [], ccnt = new Array(19).fill(0);
    for (let i = 0; i < all.length;) {
      const v = all[i]; let r = 1; while (i + r < all.length && all[i + r] === v) r++;
      if (v === 0 && r >= 3) { const k = Math.min(r, 138); rl.push(k >= 11 ? [18, k - 11, 7] : [17, k - 3, 3]); i += k; }
      else if (v && r >= 4) { rl.push([v, 0, 0]); const k = Math.min(r - 1, 6); rl.push([16, k - 3, 2]); i += 1 + k; }
      else { rl.push([v, 0, 0]); i++; }
    }
    rl.forEach(([c]) => ccnt[c]++);
    const CL = huffLengths(ccnt, 7), CC = canon(CL), ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
    let nc = 19; while (nc > 4 && !CL[ORDER[nc - 1]]) nc--;
    let out = new Uint8Array(Math.max(1024, n >> 3)), o = 0, buf = 0, nb = 0;
    const put = (v, k) => { buf |= v << nb; nb += k; while (nb >= 8) { if (o === out.length) { const x = new Uint8Array(out.length * 2); x.set(out); out = x; } out[o++] = buf & 255; buf >>>= 8; nb -= 8; } };
    put(1, 1); put(2, 2); put(nl - 257, 5); put(nd - 1, 5); put(nc - 4, 4);   // the last block, its own codes
    for (let i = 0; i < nc; i++) put(CL[ORDER[i]], 3);
    rl.forEach(([c, x, xb]) => { put(CC[c], CL[c]); if (xb) put(x, xb); });
    for (let t = 0; t < nt; t++) {
      const v = tok[t];
      if (v < 0) { const b = -1 - v; put(LC[b], LL[b]); continue; }
      const len = v >>> 16, dist = v & 0xffff || 65536, c = LEN_CODE[len], dc = codeOf(DIST_BASE, dist);
      put(LC[257 + c], LL[257 + c]); if (LEN_EXTRA[c]) put(len - LEN_BASE[c], LEN_EXTRA[c]);
      put(DC[dc], DL[dc]); if (DIST_EXTRA[dc]) put(dist - DIST_BASE[dc], DIST_EXTRA[dc]);
    }
    put(LC[256], LL[256]); if (nb) put(0, 8 - nb);
    return out.subarray(0, o);
  };
  // text: an optional tEXt chunk (keyword Comment) right after the header, as glassPng marks its picture
  // (0.3.1 LC1, PF1's Seen 1: the JavaScript deflate took 0.6 s a picture, 8.5 s under coverage) in Node the rows are
  // deflated by node:zlib (the same filtered rows, the same chunks, the mark right after IHDR: the same pixels, other
  // bytes); the browser keeps the JavaScript deflate. opt.deflate 'js': the JavaScript one in Node too (its test)
  const ZLIB = (() => { try { return typeof module !== 'undefined' && module.exports && typeof require === 'function' ? require('zlib') : null; } catch (e) { return null; } })();
  const encodePng = (w, h, rgb, text, opt) => {
    const row = w * 3, raw = new Uint8Array(h * (row + 1)), line = new Uint8Array(row), js = !ZLIB || (opt && opt.deflate === 'js');
    // node:zlib: every row but the first filtered Up (as glass-picture.mjs, PF1: the choice per row cost more than it
    // saved), in a plain loop; the pixels the same
    if (!js) {
      for (let y = 0; y < h; y++) { const p = y * row, q = y * (row + 1); raw[q] = y ? 2 : 0;
        if (y) for (let x = 0; x < row; x++) raw[q + 1 + x] = (rgb[p + x] - rgb[p + x - row]) & 255; else raw.set(rgb.subarray(0, row), 1); }
      return pngOf(w, h, new Uint8Array(ZLIB.deflateSync(raw)), text);
    }
    const pred = (f, p, x, y) => { const a = x >= 3 ? rgb[p + x - 3] : 0, b = y ? rgb[p + x - row] : 0, c = x >= 3 && y ? rgb[p + x - row - 3] : 0;
      if (f === 1) return a; if (f === 2) return b; if (f === 3) return (a + b) >> 1;
      if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      return 0; };
    for (let y = 0; y < h; y++) {
      const p = y * row, q = y * (row + 1); let best = 0, bs = Infinity;
      for (let f = 0; f < 5; f++) { let sum = 0; for (let x = 0; x < row && sum < bs; x++) { const v = (rgb[p + x] - pred(f, p, x, y)) & 255; sum += v < 128 ? v : 256 - v; } if (sum < bs) { bs = sum; best = f; } }
      for (let x = 0; x < row; x++) line[x] = (rgb[p + x] - pred(best, p, x, y)) & 255;
      raw[q] = best; raw.set(line, q + 1);
    }
    let a = 1, b = 0; for (let i = 0; i < raw.length; i++) { a = (a + raw[i]) % 65521; b = (b + a) % 65521; }
    const z = deflate(raw), idat = new Uint8Array(z.length + 6); idat.set([0x78, 0x01]); idat.set(z, 2);
    const ad = ((b << 16) | a) >>> 0; idat.set([ad >>> 24, (ad >>> 16) & 255, (ad >>> 8) & 255, ad & 255], z.length + 2);
    return pngOf(w, h, idat, text);
  };
  // the PNG's chunks around its zlib stream: signature, IHDR (RGB, 8 bits), the tEXt comment right after it, IDAT, IEND
  const pngOf = (w, h, idat, text) => {
    const u32 = (v) => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
    const chunk = (type, body) => { const c = new Uint8Array(12 + body.length); c.set(u32(body.length)); c.set([...type].map((ch) => ch.charCodeAt(0)), 4); c.set(body, 8); c.set(u32(crc32(c.subarray(4, 8 + body.length))), 8 + body.length); return c; };
    const parts = [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', Uint8Array.from(u32(w).concat(u32(h), [8, 2, 0, 0, 0])))]
      .concat(text ? [chunk('tEXt', Uint8Array.from([...('Comment\0' + text)].map((ch) => ch.charCodeAt(0) & 255)))] : [], [chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))]);
    const png = new Uint8Array(parts.reduce((x, pt) => x + pt.length, 0)); let at = 0; parts.forEach((pt) => { png.set(pt, at); at += pt.length; });
    return png;
  };
  // (0.3.2 SP6) the glass look, design-glass.js: given the engine's colours, page units and PNG writer explicitly
  const Glass = typeof module !== 'undefined' && module.exports ? require('./design-glass.js') : root.DAGlass;
  const { GLASS, isGlass, GLASS_MARK, isGlassPng, glassTables } = Glass;
  const { glassLook, glassFit, glassPixels, withGlassPicture, glassPng, glassCards } = Glass.make({ colours, roles, page, toPage, encodePng });
  // d: the design { name, font, data, ui, chart, layout }; lang: the page's language ('ar' or 'en'), for the reading
  // direction when the layout has none
  const buildTheme = (d0, lang) => {
    const cc = colours(d0), d = Object.assign({}, d0, { ui: cc.ui, data: cc.data }), u = d.ui, l = d.layout, R = roles(u), ter = R.tertiary, f = d.font;
    // (GL1) the glass look: every visual's background, border and shadow are the look's (glassCards), the labels its own
    const g = isGlass(d) ? glassLook(d) : null, gc = (t) => glassCards(u, l, g, t), sec = g ? g.labels : R.secondary;
    return {
      name: themeName(d.name),
      dataColors: d.data,
      foreground: u.text,
      foregroundNeutralSecondary: sec,
      foregroundNeutralTertiary: ter,
      background: u.card,
      backgroundLight: R.backgroundLight,
      backgroundNeutral: R.gridline,
      tableAccent: u.accent,
      good: u.good, neutral: u.neutral, bad: u.bad,
      maximum: u.good, center: u.neutral, minimum: u.bad,
      icons: statusIcons(u),
      hyperlink: d.data[0], visitedHyperlink: mix(d.data[0], u.text, 0.3),
      textClasses: {
        callout: { fontSize: fs(28, l), fontFace: f, color: u.text },
        title: { fontSize: fs(12, l), fontFace: f, color: u.text },
        header: { fontSize: fs(12, l), fontFace: f, color: u.text },
        label: { fontSize: fs(10, l), fontFace: f, color: sec }
      },
      visualStyles: withChartStyles({
        '*': { '*': g ? gc('*') : {
          // with a layout background the panels are drawn in the image, so visuals go transparent
          background: l && l.transparent ? [{ show: false }] : [{ show: true, color: { solid: { color: u.card } }, transparency: 0 }],
          // same corners as the panels in the background PNG, in page units
          border: borderStyle(u, l),
          dropShadow: shadowStyle(l)
        } },
        page: { '*': {
          background: [{ color: { solid: { color: u.background } }, transparency: 0 }],
          outspace: [{ color: { solid: { color: u.background } } }]
        } },
        ...Object.fromEntries(VISUAL_TYPES.map((t) => [t, { '*': g ? { border: gc(t).border, dropShadow: gc(t).dropShadow } : { border: borderStyle(u, l, t), dropShadow: shadowStyle(l) } }])),
        // visuals with their own text sizes, which do not follow the text classes above
        ...textSizes(d)
      }, u, d, lang)
    };
  };

  // ---------- readability ----------
  // WCAG contrast of the theme's main pairs (4.5:1 for text, 3:1 for the first data colour, which carries the main
  // series), and the data colours that almost disappear on the visual background (below 1.6:1). d: the design
  const contrastChecks = (d) => {
    const u = colours(d).ui, sec = roles(u).secondary;
    const checks = [
      ['textOnVisuals', contrast(u.text, u.card), 4.5],
      ['labelsOnVisuals', contrast(sec, u.card), 4.5],
      ['textOnPage', contrast(u.text, u.background), 4.5],
      ['color1OnVisuals', contrast(d.data[0], u.card), 3]
    ].map(([id, ratio, min]) => ({ id, ratio, min, pass: ratio >= min }))
      // (GL1) with the glass look, the worst cases over its picture (glassLook)
      .concat(isGlass(d) ? glassLook(d).checks.map((x) => ({ id: x.id, ratio: x.ratio, min: x.min, pass: x.pass })) : []);
    const weak = d.data.map((c, i) => [i + 1, contrast(c, u.card)]).filter(([, r]) => r < 1.6).map(([i]) => i);
    return { checks, weak };
  };

  // ---------- the background drawing ----------
  // (0.2.9, the audit's A2-7: the engine never trusts its caller to have run repairState: a colour key is looked up as
  // the design's own key only, and every colour drawn or written is a hex colour, else the default's)
  const barColor = (d, k, i) => { const v = d.layout[k], { ui: u, data } = colours(d), n = Number.isInteger(i) && i >= 0 ? i : 0;
    return v === 'data' ? data[n % data.length] : (BAR_COLORS.includes(v) && v !== 'data' && Object.prototype.hasOwnProperty.call(u, v) ? u[v] : u.accent); };

  // The PNG matches the table to the pixel. In Power BI, with Image fit: Stretch, each panel lands exactly under
  // its visual (checked with calibration backgrounds on 1920 × 1080 and 1280 × 720 pages).
  // opt: { w, h } the image size, preview (the page's layout preview), overlay(slots) the preview's own marks
  // opt.glass ({ t, rim, url }: the glass look's preview, GL1): the look's picture (url: its PNG as a data URL, made by
  // glassPng) under see-through panels with the look's rim, as Power BI draws them; no header band and no accent bars
  // (the report's picture has none)
  function bgSvg(d0, slots, opt, lang) {
    const cc = colours(d0), d = Object.assign({}, d0, { ui: cc.ui, data: cc.data }), u = d.ui, c = d.layout, right = rtl(c, lang), R = roles(u), light = R.light, PW = pw(c), PH = 720;
    const edge = R.edge, rail = R.rail, r = +c.radius, gl = opt.glass && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(String(opt.glass.url)) ? opt.glass : null;
    let s = gl ? `<rect width="${PW}" height="${PH}" fill="${u.background}"/><image href="${gl.url}" width="${PW}" height="${PH}" preserveAspectRatio="none"/>` : `<rect width="${PW}" height="${PH}" fill="${u.background}"/>`;
    if (gl) {
      slots.forEach((p) => { if (p.kind !== 'title' && p.kind !== 'logo') s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}" fill="${u.card}" fill-opacity="${(100 - (+gl.t || 0)) / 100}" stroke="${clampHex(gl.rim || '') || edge}" stroke-width="1"/>`; });
      if (opt.preview && opt.overlay) s += opt.overlay(slots);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${opt.w || PW}" height="${opt.h || PH}"${opt.preview ? ' role="img" aria-label="Page layout preview"' : ''}>${s}</svg>`;
    }
    if (c.header) {
      const hh = sizes(c, PW).hh;
      s += `<rect width="${PW}" height="${hh}" fill="${R.band}"/><rect y="${hh - 1}" width="${PW}" height="1" fill="${edge}"/>`
        + (c.headLine === 'none' ? '' : (() => { const t = barW('headLineW', c), col = barColor(d, 'headLineC', 0);
          return c.headLine === 'full' ? `<rect class="hl" y="${hh - t}" width="${PW}" height="${t}" fill="${col}"/>`
            : `<rect class="hl" x="${right ? PW - M - 8 - 40 : M + 8}" y="${hh - 6 - t}" width="40" height="${t}" rx="${t / 2}" fill="${col}"/>`; })());
    }
    let clips = '', k = -1;
    slots.forEach((p, i) => {
      if (p.kind === 'title' || p.kind === 'logo') return;
      s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}" fill="${p.rail ? rail : u.card}"${c.shadow ? ' filter="url(#sh)"' : ''}${light || !c.shadow ? ` stroke="${edge}" stroke-width="1"` : ''}/>`;
      if (p.kind === 'kpi') k++;
      if (p.kind !== 'kpi' || !c.kpiBar || c.kpiBar === 'none') return;
      const t = barW('kpiBarW', c), col = barColor(d, 'kpiBarC', Number.isInteger(p.index) ? p.index : k);
      if (c.kpiBar === 'start') s += `<rect class="kb" x="${right ? p.x + p.w - 10 - t : p.x + 10}" y="${p.y + 16}" width="${t}" height="${p.h - 32}" rx="${t / 2}" fill="${col}"/>`;
      else { // a strip along the top or bottom edge, clipped to the card's corners
        clips += `<clipPath id="kc${i}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}"/></clipPath>`;
        s += `<rect class="kb" x="${p.x}" y="${c.kpiBar === 'top' ? p.y : p.y + p.h - t}" width="${p.w}" height="${t}" fill="${col}" clip-path="url(#kc${i})"/>`;
      }
    });
    if (opt.preview && opt.overlay) s += opt.overlay(slots);
    const defs = c.shadow || clips ? `<defs>${c.shadow ? `<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="${light ? 4 : 6}" flood-color="#000" flood-opacity="${light ? 0.1 : 0.35}"/></filter>` : ''}${clips}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${opt.w || PW}" height="${opt.h || PH}"${opt.preview ? ' role="img" aria-label="Page layout preview"' : ''}>${defs}${s}</svg>`;
  }

  // ---------- the Power BI project download ----------
  // The labels the report shows (buttons, groups, placeholders), in each language
  const REPORT_TEXTS = {
    en: { reset: 'Reset filters', pages: 'Pages', close: 'Close', filterPanel: 'Filter panel', openFilters: 'Open the filter panel', closeFilters: 'Close the filter panel',
      filtersOpen: 'Filters open', filtersClosed: 'Filters closed', header: 'Header', kpis: 'KPI cards', filters: 'Filters', slicer: 'Slicer',
      logo: 'Logo', logoHere: 'Your logo', textHere: 'Explain what the main chart shows and what to do about it.', by: 'by', newDesign: 'New design',
      tooltipPage: 'Tooltip', tooltipHere: 'Tooltip page: add a card or a small chart here.' },
    ar: { reset: 'إعادة ضبط الفلاتر', pages: 'الصفحات', close: 'إغلاق', filterPanel: 'لوحة الفلاتر', openFilters: 'افتح لوحة الفلاتر', closeFilters: 'أغلق لوحة الفلاتر',
      filtersOpen: 'الفلاتر مفتوحة', filtersClosed: 'الفلاتر مغلقة', header: 'الشريط العلوي', kpis: 'بطاقات المؤشرات', filters: 'الفلاتر', slicer: 'مقسم',
      logo: 'الشعار', logoHere: 'شعارك', textHere: 'اشرح ما يعرضه المخطط الرئيسي وما الإجراء المطلوب.', by: 'حسب', newDesign: 'تصميم جديد',
      tooltipPage: 'تلميح', tooltipHere: 'صفحة التلميح: أضف بطاقة أو مخططًا صغيرًا هنا.' }
  };
  // The report's labels in a language, English when it has none of its own
  const texts = (lang) => REPORT_TEXTS[baseLang(lang)] || REPORT_TEXTS.en;

  // ---------- saved designs ----------
  // design-state.js (0.3.2 SP29): the saved layout's version and upgrade, the schema, fresh and repairState, given the
  // default configuration above explicitly
  const State = typeof module !== 'undefined' && module.exports ? require('./design-state.js') : root.DAState;
  const { upgrade, OLD_LAYOUT_KEYS } = State;
  const { SCHEMA, DESIGN_KEYS, LAYOUT_KEYS, fresh, repairState } = State.make({ PRESETS, FONTS, CHART_OPTIONS, BAR_COLORS, DEFAULT_NAME, NAME_MAX });
  // every download is named after the theme: letters of any script are kept (Arabic, café), other symbols dropped;
  // a name of only symbols leaves nothing, so its files are power-bi-theme
  // (night audit AUD-035) a Windows device name (CON, PRN, AUX, NUL, COM1-9, LPT1-9) is no file name on Windows, even
  // with an extension ("con.json" is the device CON): it gets "_" after it. pbip-export.js's report names do the same
  const fileBase = (name) => (themeName(name).replace(/[^\p{L}\p{M}\p{N}_\- ]+/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'power-bi-theme')
    .replace(/^(con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3])$/i, '$1_');

  const api = {
    PRESETS, NAME_MAX, FONTS, MEASURED_FONTS, CHART_OPTIONS, AR_FONTS, DEFAULT_NAME, themeName, VISUAL_TYPES, CHART_DEFAULTS, AXIS_CHARTS, T, label, RTL_LANGS, KINDS, LAYOUTS, PAGES, DEFAULT_PAGE, LIM, RANGE, M, G, HH,
    clampHex, hexToRgb, rgbToHex, mix, lum, contrast, hexToHsl, hslToHex, toContrast, secondColour, statusHue, fadeEnds, generate, calmPalette, CALM, rgbToLab, hexToLab, deltaE, simulateCvd, logoColours, logoTheme,
    within, fitCustom, page, pw, toPage, boxOf, upgrade, rtl, SMALL_PAGE, smallPage, isSmall, fitLayout, TABLE_NEED, tableWeight, rangeOf, clampTo, hasMain, hasSplit, sizes, computeSlots, pngSize, imageSize, kpiInset,
    GLASS, DEFAULT_LOOK, glassFit, GLASS_MARK, isGlassPng, withGlassPicture, isGlass, glassLook, glassTables, glassPixels, glassPng, encodePng, fs, sizeAt, FHD_TEXT, textScale, TEXT_BASES, LAYOUT_PREVIEW, isPreview, noTimeOf, CATEGORY_KINDS, CATEGORY_FIT, categoryFit, absorb, fitSlots, fitScale, SLOT_GAP, REFLOW_KEEP, themeScaleOf, scaleTheme, chart, colours, roles, BAR_COLORS, SCHEMA, DESIGN_KEYS, LAYOUT_KEYS, OLD_LAYOUT_KEYS, buildTheme, statusIcons, ICON_NAMES, contrastChecks, REPORT_TEXTS, texts, projectSlots, secondLayout, slidePanel, projectPages, barW, barColor, c0, bgSvg, fresh, repairState, fileBase
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAEngine = api;
})(typeof self !== 'undefined' ? self : this);
