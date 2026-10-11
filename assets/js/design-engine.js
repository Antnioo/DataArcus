/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design engine: the Theme & Layout Generator's theme and layout logic, with no page.
 * Colours and harmonies, the theme JSON Power BI imports, page sizes, the layout slots in page units and the
 * background drawing (SVG). Pure JavaScript: the generator page and the DataArcus MCP use the same code, in the
 * browser and in Node. Every input is explicit: a design { name, font, data, ui, chart, layout } and the language.
 * Moved from theme-generator.js as it was, so both give the same result byte for byte (tests: design-engine).
 */
(function (root) {
  const PRESETS = {
    'DataArcus': { data: ['#00d4ff', '#6c5ce7', '#00cec9', '#fd79a8', '#0084ff', '#a29bfe', '#fdcb6e', '#40f3ff'], ui: { background: '#0a0f1c', card: '#1a1f2e', text: '#f8fafc', accent: '#00d4ff', good: '#00b894', neutral: '#fdcb6e', bad: '#e17055' } },
    'Corporate': { data: ['#1f4e79', '#2e75b6', '#f4b183', '#c55a11', '#548235', '#9dc3e6', '#a9d18e', '#7f7f7f'], ui: { background: '#f3f5f8', card: '#ffffff', text: '#1f2933', accent: '#1f4e79', good: '#2e7d32', neutral: '#f9a825', bad: '#c62828' } },
    'Colorblind safe': { data: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9', '#d55e00', '#f0e442', '#000000'], ui: { background: '#f5f5f5', card: '#ffffff', text: '#222222', accent: '#0072b2', good: '#009e73', neutral: '#e69f00', bad: '#d55e00' } },
    'Desert Gulf': { data: ['#0f4c5c', '#c8963e', '#e36414', '#2a9d8f', '#5f0f40', '#fb8b24', '#9a031e', '#6c757d'], ui: { background: '#faf6ef', card: '#ffffff', text: '#2b2118', accent: '#0f4c5c', good: '#2a9d8f', neutral: '#c8963e', bad: '#9a031e' } },
    'Midnight': { data: ['#4cc9f0', '#f72585', '#ffd166', '#4361ee', '#b5179e', '#90e0ef', '#7209b7', '#06d6a0'], ui: { background: '#0b0d17', card: '#15182a', text: '#e8eaf6', accent: '#4cc9f0', good: '#06d6a0', neutral: '#ffd166', bad: '#ef476f' } },
    'Earthy': { data: ['#6b705c', '#cb997e', '#3f4238', '#e9c46a', '#8a5a44', '#a5a58d', '#264653', '#ddbea9'], ui: { background: '#f7f4ef', card: '#ffffff', text: '#2d2a26', accent: '#6b705c', good: '#588157', neutral: '#e9c46a', bad: '#bc4749' } }
  };
  // The fonts and chart choices the generator offers (its <select> lists; a test keeps both the same)
  const FONTS = ['Segoe UI', 'Segoe UI Semibold', 'DIN', 'Arial', 'Calibri', 'Tahoma', 'Verdana', 'Georgia'];
  const CHART_OPTIONS = { labels: ['auto', 'on', 'off'], grid: ['auto', 'dotted', 'off'], legend: ['auto', 'Top', 'TopCenter', 'Bottom', 'Right', 'off'], axis: ['auto', 'off'], table: ['auto', 'minimal', 'banded'] };
  // The fonts text sizes were measured in, in Power BI Desktop (the header and rail heights of minOf, the table's need
  // of TABLE_NEED, the writer's text widths): Segoe UI and Tahoma only. The others are offered; a wider one (Verdana)
  // may need more room than measured until the laptop proof "A2-11" in DESKTOP-TESTS.md (0.2.9, the audit's A2-11)
  const MEASURED_FONTS = ['Segoe UI', 'Tahoma'];
  // Every font in the list is built into Power BI, but only these have Arabic letters
  const AR_FONTS = ['Segoe UI', 'Segoe UI Semibold', 'Arial', 'Tahoma'];
  // The theme's name when none is given (the name box shows it to new visitors): the theme JSON and every file use it,
  // so an empty or blank name gives one name everywhere. A name with text is kept exactly as typed.
  const DEFAULT_NAME = 'My Brand Theme';
  // The longest theme name, as the name box takes it (maxlength 60) and generate_theme: repairState cuts a longer one
  // (0.2.9, the audit's A2-12: a 5,000-character name reached the theme, the file names and the tools' answers)
  const NAME_MAX = 60;
  const themeName = (name) => (name && String(name).trim() ? name : DEFAULT_NAME);

  // ---------- color math ----------
  // #1a2b3c, 1a2b3c or the short #abc form, spaces around allowed; anything else is not a color (null)
  const clampHex = (v) => { v = (v || '').trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{3}$/.test(v)) v = '#' + [...v.slice(1)].map((c) => c + c).join(''); return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null; };
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
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => { const c = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hexToHsl = (h) => {
    let [r, g, b] = hexToRgb(h).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let hh = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [hh, s, l];
  };
  const hslToHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
  };
  const generate = (base, mode) => {
    const [h, s0, l0] = hexToHsl(base); const s = Math.max(0.45, s0), l = Math.min(0.55, Math.max(0.4, l0));
    const plans = {
      analogous: [[0, 0], [30, 0.05], [-30, 0.05], [60, 0.12], [-60, 0.1], [0, 0.2], [30, -0.12], [-30, -0.12]],
      complementary: [[0, 0], [180, 0], [0, 0.18], [180, 0.18], [0, -0.14], [180, -0.14], [30, 0.1], [210, 0.1]],
      triadic: [[0, 0], [120, 0], [240, 0], [0, 0.18], [120, 0.18], [240, 0.18], [60, 0.05], [180, 0.05]],
      mono: [[0, -0.2], [0, -0.1], [0, 0], [0, 0.1], [0, 0.18], [0, 0.26], [0, 0.32], [0, 0.38]]
    };
    // The 0.15 floor is never reached today: the base lightness is held at 0.4-0.55 and no step above goes down more
    // than 0.2, so the darkest colour is 0.2. It stays as a safety limit in case the steps change.
    return plans[mode].map(([dh, dl]) => hslToHex(h + dh, s, Math.min(0.85, Math.max(0.15, l + dl))));
  };
  // A calm palette beside a brand colour (0.2.9, the reviewer of 11 Oct: the analogous harmony gave loud colours beside
  // the owner's brand; moved here from the MCP by the cross-review's G7, so the website and the MCP give the same one):
  // the brand exactly, then up to 7 calm colours told apart by hue (one within 25 degrees of the brand's is skipped), each
  // mixed towards the text colour until it stands 3:1 on the visuals' background (card)
  const CALM = ['#2f6e9e', '#b86e00', '#1f7a70', '#6a4c93', '#b5452f', '#56636f', '#5e7f3a', '#8e5b2e', '#a23b72', '#3d7ea6'];
  const calmPalette = (brand, card, text) => {
    const near = (a, b) => { const [h1, s1] = hexToHsl(a), [h2, s2] = hexToHsl(b), d = Math.abs(h1 - h2) % 360; return s1 > 0.15 && s2 > 0.15 && Math.min(d, 360 - d) < 25; };
    const out = [];
    for (const c0 of CALM) {
      if (out.length === 7) break;
      if (near(c0, brand)) continue;
      let c = c0; for (let t = 0.1; contrast(c, card) < 3 && t <= 1; t += 0.1) c = mix(c0, text, t);
      if (!out.includes(c) && c !== brand) out.push(c);
    }
    return [brand].concat(out).slice(0, 8);
  };

  // ---------- page layout: a full background with a place for every visual ----------
  // Power BI's default page is 1280 × 720, so every slot is in those units and can be typed straight
  // into Format › General › Properties. The PNG is drawn at 1.5× (1920 × 1080) so it stays sharp.
  const M = 16, G = 12, HH = 56;
  // Page sizes: the layout is designed on a grid 720 units tall and converted to the page's own units,
  // so the table, CSV and sliders always show the numbers to type into Power BI for that page.
  const PAGES = { '1280x720': [1280, 720], '1920x1080': [1920, 1080], '960x720': [960, 720] };
  // Custom page: whole numbers, 640-3840 wide, 360-2160 tall, shaped between 4:3 and 2.4:1 so the layout grid still works
  const LIM = { w: [640, 3840], h: [360, 2160], r: [4 / 3, 2.4] };
  const within = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));
  function fitCustom(w, h) {
    w = within(Math.round(+w) || 1280, LIM.w); h = within(Math.round(+h) || 720, LIM.h);
    if (w / h < LIM.r[0]) h = Math.round(w / LIM.r[0]);
    if (w / h > LIM.r[1]) h = Math.round(w / LIM.r[1]);
    if (h < LIM.h[0]) { h = LIM.h[0]; w = Math.max(w, Math.round(h * LIM.r[0])); }
    return [w, h];
  }
  // c: the layout
  const page = (c) => { const [w, h] = c.page === 'custom' ? fitCustom(c.pageW, c.pageH) : PAGES[c.page] || PAGES['1920x1080']; return { w, h, s: h / 720 }; };
  // the page's width on the 720-tall design grid (the page itself calls it PW)
  const pw = (c) => { const p = page(c); return Math.round(p.w / p.s); };
  const toPage = (v, c) => Math.round(v * page(c).s);
  // a box in page units: its edges are rounded, not its size, so equal margins and gaps stay equal after rounding
  const boxOf = (s, c) => { const x = toPage(s.x, c), y = toPage(s.y, c); return { x, y, w: toPage(s.x + s.w, c) - x, h: toPage(s.y + s.h, c) - y }; };
  // Labels keyed by language, with an English fallback (0.2.9, the audit's A2-9: every label was an [en, ar] pair, so a
  // third language meant editing each one). T makes one; label(x, lang) reads one in a language (an older [en, ar] pair
  // is read too).
  const T = (en, ar) => ({ en, ar });
  const baseLang = (lang) => String(lang || '').toLowerCase().split(/[-_]/)[0];
  const label = (x, lang) => (Array.isArray(x) ? (baseLang(lang) === 'ar' ? x[1] : x[0]) : x && typeof x === 'object' ? (x[baseLang(lang)] != null ? x[baseLang(lang)] : x.en) : x);
  const KINDS = { kpi: T('Card', 'بطاقة'), line: T('Line chart', 'مخطط خطي'), bar: T('Bar chart', 'مخطط شريطي'), column: T('Column chart', 'مخطط أعمدة'), donut: T('Donut chart', 'مخطط دائري'), table: T('Table or matrix', 'جدول أو مصفوفة'), text: T('Text box or narrative', 'مربع نص أو سرد'), slicer: T('Slicers', 'مقسمات (Slicers)'), title: T('Text box (page title)', 'مربع نص (عنوان الصفحة)'), logo: T('Image (logo)', 'صورة (الشعار)') };
  const LAYOUTS = {
    exec: { name: T('Executive summary', 'ملخص تنفيذي'), kpis: 4, kpiH: 96, filters: false, flex: [1.3, 1],
      rows: [[[2, 'line', T('Main trend', 'الاتجاه الرئيسي')], [1, 'bar', T('Breakdown', 'التوزيع')]], [[1, 'column', T('Comparison', 'المقارنة')], [1, 'table', T('Detail', 'التفاصيل')]]],
      why: [T('Key numbers first, where the eye starts', 'الأرقام الأهم أولًا حيث تبدأ العين'), T('One screen, no scrolling', 'شاشة واحدة بدون تمرير'), T('8 visuals at most', '8 عناصر كحد أقصى')] },
    analysis: { name: T('Analysis', 'تحليل'), kpis: 3, kpiH: 84, filters: true, flex: [1, 1.25],
      rows: [[[1, 'column', T('Main chart', 'المخطط الرئيسي')]], [[1, 'table', T('Detail table', 'جدول التفاصيل')]]],
      why: [T('All filters in one place', 'كل الفلاتر في مكان واحد'), T('Overview on top, detail below', 'النظرة العامة في الأعلى والتفاصيل في الأسفل'), T('A wide table that is easy to read', 'جدول عريض سهل القراءة')] },
    ops: { name: T('Operations monitor', 'مراقبة العمليات'), kpis: 6, kpiH: 84, filters: false, flex: [1, 1],
      rows: [[[1, 'line', T('Trend', 'الاتجاه')], [1, 'bar', T('Ranking', 'الترتيب')], [1, 'donut', T('Mix', 'التركيبة')]], [[1, 'column', T('Volume', 'الحجم')], [1, 'bar', T('Exceptions', 'الاستثناءات')], [1, 'table', T('Watch list', 'قائمة المتابعة')]]],
      why: [T('Equal tiles for equal importance', 'مربعات متساوية لأهمية متساوية'), T('Dense but on one grid', 'كثيف لكن على شبكة واحدة'), T('Made for a daily check or a wall screen', 'مصمم للمتابعة اليومية أو شاشة العرض')] },
    focus: { name: T('Single focus', 'رسالة واحدة'), kpis: 3, kpiH: 96, filters: false, flex: [1],
      rows: [[[2.2, 'line', T('Hero chart', 'المخطط الرئيسي')], [1, 'text', T('What it means', 'ماذا يعني')]]],
      why: [T('One message per page', 'رسالة واحدة لكل صفحة'), T('A short text explains the chart', 'نص قصير يشرح المخطط'), T('Generous white space', 'مساحة بيضاء مريحة')] }
  };
  // v2: corners 0/8/16, and the KPI accent bar became a choice of side (from the old on/off accentBar)
  const upgrade = (l) => {
    if (l && !l.v) {
      if (+l.radius === 12) l.radius = 8; else if (+l.radius === 14) l.radius = 16;
      if (!l.kpiBar) l.kpiBar = l.accentBar === false ? 'none' : 'start';
      delete l.accentBar; l.v = 2;
    }
    // v3: the default page became 1920 x 1080; older saved designs keep the 1280 x 720 they were made on
    if (l && l.v < 3) { if (!l.page) l.page = '1280x720'; l.v = 3; }
    return l;
  };
  // Reading direction: the layout's own, or the page's language when none is chosen: a language written right to left
  // (0.2.9, A2-9: a set, not only Arabic; a region like ar-AE counts as its language)
  const RTL_LANGS = ['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi'];
  const rtl = (c, lang) => (c.dir ? c.dir === 'rtl' : RTL_LANGS.includes(baseLang(lang)));

  // Small pages (0.2.9, the audit's A2-1: the rule moved here from the MCP's design.mjs, so the website and the MCP lay
  // out the same page). Under 800 wide the executive layout's four charts and table do not fit (cut card values,
  // "Wednes...", a scrolling table), so such a page takes the single-focus layout, without a second page, and the
  // single-focus KPI cards are one step taller (116 on the 720 grid; the layout's own is 96) unless the design sets its
  // own height. Measured at ONE size only: 640 x 360 (golden task 5, Desktop 2.158.1304, DESKTOP-TESTS.md "2026-10-07";
  // rounds 19 and 22). Nothing was measured between 640 and 800: the laptop proof "A2-1" in DESKTOP-TESTS.md checks
  // 700-800 wide before these values are trusted there.
  const SMALL_PAGE = { w: 800, kpiH: 116, measured: 'one size only: 640 x 360 (golden task 5, Power BI Desktop 2.158.1304, 2026-10-07); 700-800 wide not measured yet (laptop proof A2-1)' };
  // null, or how a small page's layout is changed: { w (the page width), from, to }
  const smallPage = (c) => { const w = page(c).w; return w < SMALL_PAGE.w && c.preset === 'exec' ? { w, from: 'exec', to: 'focus' } : null; };
  const isSmall = (c) => page(c).w < SMALL_PAGE.w;
  // the layout a page really gets: on a small page the executive layout becomes the single-focus one, its filters and
  // its size sliders back to that layout's defaults (as choosing a layout does)
  const fitLayout = (c) => (smallPage(c) ? Object.assign({}, c, { preset: 'focus', filters: LAYOUTS.focus.filters, kpiH: null, mainW: null, split: null }) : c);

  // A table beside a chart on a narrow page (narrower than 3:2 on the design grid) takes a wider share of its row
  // (wideTable, on by default; a design that says false keeps equal shares), by its need (0.2.9, the audit's A2-5: one
  // default, here; the share from the table's fields). Measured once, in Power BI Desktop 2.158 on the night of 6-7 Oct
  // 2026 (mcp/WORK.md, "Block C" item 3; the owner's answer 3a): a table of a day column and three measures (4 fields)
  // needs 463 in Segoe UI and 483 in Tahoma at 8pt, and half of a 960 x 720 page's row is 458; the table took 1.5 times
  // its neighbour's weight (three fifths), which Desktop showed whole (golden task 4, DESKTOP-TESTS.md 2026-10-07). Its
  // need grows with its fields (about 121 a field in the wider font), so each field past 4 adds a quarter of that weight,
  // up to 3 (the chart beside keeps a quarter of the row); fewer fields keep 1.5. Past 4 fields this is a GUESS until
  // the laptop proof "A2-5" in DESKTOP-TESTS.md measures 5 and 6 fields.
  const TABLE_NEED = { fields: 4, weight: 1.5, max: 3, measured: '4 fields (a day column and three measures) need 463 in Segoe UI and 483 in Tahoma at 8pt; half of a 960 x 720 row is 458 (Power BI Desktop 2.158, 6-7 Oct 2026, mcp/WORK.md Block C 3); 5 or more fields not measured (laptop proof A2-5)' };
  const tableWeight = (n) => Math.min(TABLE_NEED.max, TABLE_NEED.weight * Math.max(TABLE_NEED.fields, Math.floor(+n) || TABLE_NEED.fields) / TABLE_NEED.fields);

  // Adjustable sizes, each kept inside a safe range so every visual stays usable
  const RANGE = { hh: [44, 96], logoW: [100, 360], fw: [160, 320], fh: [56, 120], kpiH: [64, 160], mainW: [40, 75], split: [30, 70], radius: [0, 24], kpiBarW: [2, 8], headLineW: [2, 8] };
  // on a narrow (4:3) page the side filter panel is capped at a quarter of the width (PW: the page's width, see pw)
  // c (the layout, optional): on a small page the header and the top filter rail start higher, so their text fits:
  // heights measured in Power BI Desktop 2.157 (scripts/tests/DESKTOP-TESTS.md, 2026-10-01), in page units: the header
  // title box (hh - 24) holds an 8pt line (25), the top rail fh a dropdown slicer at the theme's slicer text size
  // (16 + 4 x pt) and the report's padding (10 above and below on 1920 x 1080, scaled with the page)
  const minOf = (k, c) => {
    if (!c || (k !== 'hh' && k !== 'fh')) return 0;
    const s = page(c).s;
    return k === 'hh' ? Math.ceil(24 + 25 / s) : Math.ceil((16 + 4 * fs(10, c) + 20 * s / 1.5) / s);
  };
  const rangeOf = (k, PW, c) => {
    const r = k === 'fw' ? [160, Math.min(320, Math.round(PW / 4))] : RANGE[k];
    return [Math.min(r[1], Math.max(r[0], minOf(k, c))), r[1]];
  };
  const clampTo = (k, v, PW, c) => Math.max(rangeOf(k, PW, c)[0], Math.min(rangeOf(k, PW, c)[1], Math.round(+v)));
  const hasMain = (P) => P.rows[0].length > 1 && P.rows[0][0][0] > P.rows[0][1][0];   // a wider first chart
  const hasSplit = (P) => P.rows.length === 2;
  function sizes(c, PW) {
    const P = LAYOUTS[c.preset], n = (k, d) => clampTo(k, c[k] == null || !isFinite(+c[k]) ? d : c[k], PW, c);
    const w0 = P.rows[0].reduce((a, col) => a + col[0], 0);
    return { hh: n('hh', HH), logoW: n('logoW', 150), fpos: ['start', 'end', 'top'].includes(c.fpos) ? c.fpos : 'start', fw: n('fw', 196), fh: n('fh', 72),
      kpiH: n('kpiH', c.preset === 'focus' && isSmall(c) ? SMALL_PAGE.kpiH : P.kpiH), mainW: n('mainW', 100 * P.rows[0][0][0] / w0), split: n('split', P.flex.length === 2 ? 100 * P.flex[0] / (P.flex[0] + P.flex[1]) : 50) };
  }

  // The slots of a layout, on the 720-tall design grid (boxOf turns one into page units). lang: the page's language,
  // which sets the reading direction when the layout has none.
  // opt.logoRatio (width / height of an attached logo, see imageSize): the logo slot keeps the designed height and takes
  // the logo's own width (no minimum; at most the logo width range's 360), its far edge where it is; the title and the
  // page buttons get the room that is left. Without it the slot is the designed logo width, as before.
  // opt.tableFields (the number of fields the report's table shows): its share of a narrow row (TABLE_NEED); 4 when not given.
  // A small page gets its own layout first (fitLayout, see SMALL_PAGE).
  function computeSlots(c, lang, opt) {
    c = fitLayout(c);
    const PW = pw(c), PH = 720;
    const P = LAYOUTS[c.preset], z = sizes(c, PW), slots = [];
    let top = c.header ? z.hh + 14 : M;
    if (c.header) {
      const th = z.hh - 24, ratio = opt && +opt.logoRatio > 0 ? +opt.logoRatio : 0;
      const logoW = ratio ? Math.max(1, Math.min(RANGE.logoW[1], Math.round(th * ratio))) : z.logoW, lx = PW - M - 8 - logoW;
      slots.push({ kind: 'title', role: T('Page title', 'عنوان الصفحة'), x: M + 8, y: 12, w: Math.min(560, lx - 24 - (M + 8)), h: th });
      slots.push({ kind: 'logo', role: T('Logo', 'الشعار'), x: lx, y: 12, w: logoW, h: th });
    }
    let x0 = M, cw = PW - 2 * M;
    if (c.filters && z.fpos === 'top') { slots.push({ kind: 'slicer', role: T('Filters', 'الفلاتر'), x: M, y: top, w: cw, h: z.fh, rail: true }); top += z.fh + G; }
    else if (c.filters) {
      const fx = z.fpos === 'end' ? PW - M - z.fw : M;
      slots.push({ kind: 'slicer', role: T('Filters', 'الفلاتر'), x: fx, y: top, w: z.fw, h: PH - M - top, rail: true });
      cw = PW - 2 * M - z.fw - G; if (z.fpos !== 'end') x0 = M + z.fw + G;
    }
    // the first chart row: the main chart takes its share, the others split the rest by their weights
    const first = P.rows[0].map((col, i) => col.slice());
    if (hasMain(P)) { const rest = first.slice(1).reduce((a, col) => a + col[0], 0); first[0][0] = rest * z.mainW / (100 - z.mainW); }
    const flex = hasSplit(P) ? [z.split, 100 - z.split] : P.flex.slice();
    // KPI cards: the layout's count, 0-6 (0.2.9, the audit's A2-4: one value; the MCP's kpiCards is gone): 0 leaves the
    // KPI row out and the charts take its room
    const nK = Math.max(0, Math.min(6, Math.floor(+c.kpis) || 0));
    const flexSum = flex.reduce((a, b) => a + b, 0), free = nK ? PH - M - top - G * P.rows.length - z.kpiH : PH - M - top - G * (P.rows.length - 1);
    // no chart row shorter than 90: move the split back if needed
    if (hasSplit(P) && free >= 180) { const h0 = free * flex[0] / flexSum; if (h0 < 90) flex[0] = flexSum * 90 / free; else if (free - h0 < 90) flex[0] = flexSum * (free - 90) / free; flex[1] = flexSum - flex[0]; }
    // (the owner, 6 Oct 2026) One card (a model with one measure) takes a quarter of the row at the reading start, not
    // the whole row (quarter). Two or three cards still share the row.
    // (the owner, 6 Oct 2026; round 20: the website and the MCP alike) on a narrow page a table beside a chart takes the
    // wider share of its row, by its need (TABLE_NEED); a design that says wideTable false keeps equal shares
    const narrow = c.wideTable !== false && PW < 1080, tw = tableWeight(opt && opt.tableFields), share = (cols) => (narrow && cols.length > 1 ? cols.map((col) => (col[1] === 'table' ? [col[0] * tw, col[1], col[2]] : col)) : cols);
    const rows = (nK ? [{ fixed: z.kpiH, quarter: nK === 1, cols: Array.from({ length: nK }, (_, i) => [1, 'kpi', T(`KPI ${i + 1}`, `مؤشر ${i + 1}`)]) }] : [])
      .concat([first].concat(P.rows.slice(1)).map((cols, i) => ({ flex: flex[i], cols: share(cols) })));
    let y = top;
    rows.forEach((r, ri) => {
      const h = r.fixed || (ri === rows.length - 1 ? PH - M - y : Math.round(free * r.flex / flexSum));
      const wsum = r.cols.reduce((a, col) => a + col[0], 0), avail = cw - G * (r.cols.length - 1);
      let x = x0;
      r.cols.forEach((col, ci) => {
        const w = r.quarter ? Math.round((cw - 3 * G) / 4) : ci === r.cols.length - 1 ? x0 + cw - x : Math.round(avail * col[0] / wsum);
        slots.push({ kind: col[1], role: col[2], x, y, w, h }); x += w + G;
      });
      y += h + G;
    });
    // Arabic reports read from the right: mirror the whole page so KPI 1 and the title start there
    if (rtl(c, lang)) slots.forEach((s) => { s.x = PW - s.x - s.w; });
    // each slot carries its index among the slots of its kind (KPI 1 is 0), so nothing reads it from the role's text
    // (0.2.9, the audit's A2-6: the KPI bar's data colour came from parsing "KPI n")
    const seen = {};
    slots.forEach((s) => { s.index = seen[s.kind] = s.kind in seen ? seen[s.kind] + 1 : 0; });
    return slots;
  }
  // An image's size in pixels, read from its bytes (a Uint8Array): PNG (the IHDR chunk) or JPG (the frame header);
  // null for anything else. Used for an attached logo, so its box can take the logo's own shape.
  function imageSize(b) {
    if (!b || b.length < 24) return null;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
      const u = (i) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0, w = u(16), h = u(20);
      return w && h ? { w, h } : null;
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      for (let i = 2; i + 9 < b.length;) {
        if (b[i] !== 0xff) { i++; continue; }
        const m = b[i + 1];
        if (m === 0xff) { i++; continue; }
        // a frame header (SOF0-SOF15, but not the Huffman table, JPG extension or arithmetic conditioning markers)
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { const h = (b[i + 5] << 8) | b[i + 6], w = (b[i + 7] << 8) | b[i + 8]; return w && h ? { w, h } : null; }
        if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }   // markers without a length
        i += 2 + ((b[i + 2] << 8) | b[i + 3]);
      }
    }
    return null;
  }
  // The background PNG's size in pixels: the page's own size, drawn at least 1920 wide so it stays sharp
  const pngSize = (c) => { const p = page(c), k = Math.max(1, 1920 / p.w); return [Math.round(p.w * k), Math.round(p.h * k)]; };

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
  // Power BI's default text sizes (title 12, label 10, callout 28) are made for a 1280 × 720 page. On a bigger page
  // everything looks small, so every size grows with the page: × 1.5 on 1920 × 1080, unchanged on 1280 × 720.
  // Power BI rejects the whole theme when one font size is outside 8-60 (tested in Desktop), so very big or small pages stop there
  const fs = (n, l) => Math.min(60, Math.max(8, Math.round(n * page(l).s * 2) / 2));
  const textSizes = (d) => {
    const l = d.layout, f = (n) => fs(n, l);
    const merge = (t, extra) => ({ [t]: { '*': Object.assign({ border: borderStyle(d.ui, l), dropShadow: shadowStyle(l) }, extra) } });
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
  const CHART_DEFAULTS = { labels: 'auto', grid: 'auto', legend: 'auto', axis: 'auto', table: 'auto' };
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
      add(['tableEx', 'pivotTable'], 'values', { backColorPrimary: { solid: { color: u.card } }, backColorSecondary: { solid: { color: c.table === 'banded' ? mix(u.card, u.accent, 0.08) : u.card } } });
    }
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
  // d: the design { name, font, data, ui, chart, layout }; lang: the page's language ('ar' or 'en'), for the reading
  // direction when the layout has none
  const buildTheme = (d0, lang) => {
    const cc = colours(d0), d = Object.assign({}, d0, { ui: cc.ui, data: cc.data }), u = d.ui, l = d.layout, R = roles(u), sec = R.secondary, ter = R.tertiary, f = d.font;
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
      hyperlink: d.data[0], visitedHyperlink: mix(d.data[0], u.text, 0.3),
      textClasses: {
        callout: { fontSize: fs(28, l), fontFace: f, color: u.text },
        title: { fontSize: fs(12, l), fontFace: f, color: u.text },
        header: { fontSize: fs(12, l), fontFace: f, color: u.text },
        label: { fontSize: fs(10, l), fontFace: f, color: sec }
      },
      visualStyles: withChartStyles({
        '*': { '*': {
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
        ...Object.fromEntries(VISUAL_TYPES.map((t) => [t, { '*': { border: borderStyle(u, l, t), dropShadow: shadowStyle(l) } }])),
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
    ].map(([id, ratio, min]) => ({ id, ratio, min, pass: ratio >= min }));
    const weak = d.data.map((c, i) => [i + 1, contrast(c, u.card)]).filter(([, r]) => r < 1.6).map(([i]) => i);
    return { checks, weak };
  };

  // ---------- the background drawing ----------
  // accent bars: side, thickness and color (Advanced options)
  const barW = (k, c) => clampTo(k, c[k] == null ? (k === 'kpiBarW' ? 4 : 3) : c[k]);
  // (0.2.9, the audit's A2-7: the engine never trusts its caller to have run repairState: a colour key is looked up as
  // the design's own key only, and every colour drawn or written is a hex colour, else the default's)
  const barColor = (d, k, i) => { const v = d.layout[k], { ui: u, data } = colours(d), n = Number.isInteger(i) && i >= 0 ? i : 0;
    return v === 'data' ? data[n % data.length] : (BAR_COLORS.includes(v) && v !== 'data' && Object.prototype.hasOwnProperty.call(u, v) ? u[v] : u.accent); };
  const c0 = (c) => (c.kpiBar === 'start' ? barW('kpiBarW', c) + 8 : 0); // KPI text sits after a side bar
  // Where a KPI card's title can start beside the side accent bar, in page units from the card's reading-start edge: the
  // bar's far edge (it is drawn 10 in, see bgSvg) plus round(5k), k = page height / 1080 (measured in Power BI Desktop
  // 2.158: 26 on 1920 x 1080 and 17 on 1280 x 720 leave a clear gap; less and the title is drawn over the bar).
  // 0 without a side bar. The report uses it as the card's padding on that side.
  const kpiInset = (c) => (c.kpiBar === 'start' ? toPage(10 + barW('kpiBarW', c), c) + Math.round(5 * page(c).h / 1080) : 0);

  // The PNG matches the table to the pixel. In Power BI, with Image fit: Stretch, each panel lands exactly under
  // its visual (checked with calibration backgrounds on 1920 × 1080 and 1280 × 720 pages).
  // opt: { w, h } the image size, preview (the page's layout preview), overlay(slots) the preview's own marks
  function bgSvg(d0, slots, opt, lang) {
    const cc = colours(d0), d = Object.assign({}, d0, { ui: cc.ui, data: cc.data }), u = d.ui, c = d.layout, right = rtl(c, lang), R = roles(u), light = R.light, PW = pw(c), PH = 720;
    const edge = R.edge, rail = R.rail, r = +c.radius;
    let s = `<rect width="${PW}" height="${PH}" fill="${u.background}"/>`;
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
  // A page's slots for the report: kind, name in lang, filter rail or not, and the box in page units
  const projectSlots = (c, lang, opt) => computeSlots(c, lang, opt).map((s) => Object.assign({ kind: s.kind, title: label(s.role, lang), rail: !!s.rail }, boxOf(s, c)));
  // a second page in a complementary layout: an analysis page (filters, a main chart, a wide table) after an
  // overview, or an executive overview after an analysis page. The filters stay on the side the user chose for the
  // first page (O-1 of the owner's test of 0.2.8, 10 Oct 2026: "filters right" gave a second page with them at the left)
  // A first page with fewer KPI cards than its layout plans (a report with fewer measures) keeps the second page at that
  // count (0.2.9, A2-4: this was the MCP's kpiCards, which capped every page).
  const secondLayout = (c) => { const to = c.preset === 'analysis' ? 'exec' : 'analysis', own = LAYOUTS[to].kpis, k = +c.kpis < LAYOUTS[c.preset].kpis ? Math.min(own, +c.kpis) : own;
    return Object.assign({}, c, to === 'exec' ? { preset: 'exec', kpis: k, filters: false } : { preset: 'analysis', kpis: k, filters: true, fpos: ['start', 'end', 'top'].includes(c.fpos) ? c.fpos : 'start' }, { kpiH: null, mainW: null, split: null }); };
  // Filters as a slide-in panel: the page without its filter rail, and the panel's box (null when the page has no
  // filters or no header). The panel opens under the Filters button, at the end of the header (right in English, left in Arabic)
  const slidePanel = (cc, lang) => {
    if (!cc.filters || !cc.header) return null;
    const open = Object.assign({}, cc, { filters: false });
    const PW = pw(cc), PH = 720, z = sizes(cc, PW), w = Math.max(240, Math.min(320, z.fw + 40)), top = z.hh + 14;
    const r = { x: rtl(cc, lang) ? M : PW - M - w, y: top, w, h: PH - M - top };
    return { layout: open, panel: boxOf(r, cc) };
  };
  // The report's pages for a layout: this page, the second page when asked, each with the slide-in panel when asked.
  // opts: { second, panel, logoRatio (an attached logo's width / height, see computeSlots), tableFields (see
  // computeSlots), maxKpis (the most KPI cards
  // the report can fill, its measures: every page has at most that many) }.
  // A small page (SMALL_PAGE) has its own layout and no second page.
  // Each page: { layout (for its background), name, page { w, h }, slots, panel }
  const projectPages = (given, lang, opts) => {
    const nm = (x) => label(x, lang), o = opts || {}, c = fitLayout(given);
    const specs = [{ c, name: nm(LAYOUTS[c.preset].name) }].concat(o.second && !isSmall(c) ? [{ c: secondLayout(c), name: nm(c.preset === 'analysis' ? T('Overview', 'نظرة عامة') : T('Details', 'التفاصيل')) }] : []);
    const cap = (l) => (o.maxKpis != null && +o.maxKpis >= 0 && +o.maxKpis < +l.kpis ? Object.assign({}, l, { kpis: Math.floor(+o.maxKpis) }) : l);
    return specs.map((sp) => {
      const sl = o.panel ? slidePanel(cap(sp.c), lang) : null, layout = sl ? sl.layout : cap(sp.c), p = page(layout);
      return { layout, name: sp.name, page: { w: p.w, h: p.h }, slots: projectSlots(layout, lang, { logoRatio: o.logoRatio, tableFields: o.tableFields }), panel: sl ? sl.panel : null };
    });
  };

  // ---------- saved designs ----------
  // The design's written schema (0.2.9, the audit's A2-7: it lived only in the MCP server's key lists). Every key the
  // engine reads, what it means and the values it takes; repairState checks each one. DESIGN_KEYS and LAYOUT_KEYS are
  // its keys (the MCP names any other key of a given design as ignored).
  const SCHEMA = {
    preset: { about: 'the preset the colours came from, or null', values: Object.keys(PRESETS).concat([null]) },
    name: { about: 'the theme name (the theme JSON and the file names); at most NAME_MAX (60) characters', type: 'text' },
    font: { about: 'the font of every text', values: FONTS },
    data: { about: 'the 8 data colours', type: '8 hex colours' },
    ui: { about: 'the page colours: background, card (the visuals), text, accent, good, neutral, bad', type: 'hex colours' },
    chart: { about: 'chart style defaults; auto writes nothing', values: CHART_OPTIONS },
    layout: {
      v: { about: 'the saved layout\'s version (3)', type: 'number' },
      page: { about: 'the page size', values: Object.keys(PAGES).concat('custom') },
      pageW: { about: 'a custom page\'s width (640-3840; fitted to 4:3-2.4:1)', type: 'number' },
      pageH: { about: 'a custom page\'s height (360-2160)', type: 'number' },
      preset: { about: 'the layout', values: Object.keys(LAYOUTS) },
      kpis: { about: 'the KPI cards in the top row (0 leaves the row out)', values: [0, 1, 2, 3, 4, 5, 6] },
      filters: { about: 'a filter panel', type: 'boolean' },
      fpos: { about: 'where the filter panel sits (start and end follow the reading direction)', values: ['start', 'end', 'top'] },
      dir: { about: 'the reading direction; empty: the language decides', values: ['', 'ltr', 'rtl'] },
      radius: { about: 'the corners, on the 720 grid', range: [0, 24] },
      shadow: { about: 'soft shadows', type: 'boolean' },
      header: { about: 'a header band with the title and the logo', type: 'boolean' },
      samples: { about: 'sample visuals in the preview (the website only)', type: 'boolean' },
      transparent: { about: 'transparent visuals over panels drawn in the background image', type: 'boolean' },
      wideTable: { about: 'on a narrow page a table takes the wider share of its row (default on)', type: 'boolean' },
      kpiBar: { about: 'the KPI cards\' accent bar', values: ['start', 'top', 'bottom', 'none'] },
      kpiBarC: { about: 'the KPI bar\'s colour (default accent)', values: BAR_COLORS },
      kpiBarW: { about: 'the KPI bar\'s thickness', range: RANGE.kpiBarW },
      headLine: { about: 'the line under the header', values: ['short', 'full', 'none'] },
      headLineC: { about: 'the header line\'s colour (default accent)', values: BAR_COLORS },
      headLineW: { about: 'the header line\'s thickness', range: RANGE.headLineW },
      hh: { about: 'the header\'s height', range: RANGE.hh },
      logoW: { about: 'the logo\'s width', range: RANGE.logoW },
      fw: { about: 'the side filter panel\'s width', range: RANGE.fw },
      fh: { about: 'the top filter strip\'s height', range: RANGE.fh },
      kpiH: { about: 'the KPI row\'s height', range: RANGE.kpiH },
      mainW: { about: 'the main chart\'s share of its row, in %', range: RANGE.mainW },
      split: { about: 'the first chart row\'s share of the chart rows, in %', range: RANGE.split }
    }
  };
  const DESIGN_KEYS = Object.keys(SCHEMA), LAYOUT_KEYS = Object.keys(SCHEMA.layout);
  // keys of older saved designs the repair still reads (accentBar: v1; kpiCards: the MCP before 0.2.9)
  const OLD_LAYOUT_KEYS = ['accentBar', 'kpiCards'];
  const fresh = () => ({ preset: 'DataArcus', name: DEFAULT_NAME, font: 'Segoe UI', data: PRESETS.DataArcus.data.slice(), ui: { ...PRESETS.DataArcus.ui } });
  // A saved design (or none) made safe to use, the way the generator repairs it on load: an old or hand-edited save may
  // be partial, so each value that is not valid falls back to its default, and older layouts are upgraded.
  // Changes the design in place and returns it (or a fresh one when there is nothing usable).
  // report (optional): called with { field, given, used, why } for each value that was not used as given (0.2.9, the
  // audit's A2-4/A2-7: nothing is reset without a word; the MCP lists them, the website repairs quietly as before).
  function repairState(state, report) {
    const say = (field, given, used, why) => { if (report) report({ field, given, used, why }); };
    if (!state || typeof state !== 'object' || !Array.isArray(state.data) || state.data.length !== 8) state = fresh();
    {
      const d = fresh(), hex = (v) => (typeof v === 'string' ? clampHex(v) : null), ui = state.ui && typeof state.ui === 'object' ? state.ui : {};
      state.data = state.data.map((c, i) => { const h = hex(c); if (!h) say(`data[${i}]`, c, d.data[i], 'not a hex colour'); return h || d.data[i]; });
      state.ui = Object.fromEntries(Object.keys(d.ui).map((k) => { const h = hex(ui[k]); if (!h && ui[k] != null) say('ui.' + k, ui[k], d.ui[k], 'not a hex colour'); return [k, h || d.ui[k]]; }));
      if (typeof state.name !== 'string') { if (state.name != null) say('name', state.name, d.name, 'not a text'); state.name = d.name; }
      if ([...state.name].length > NAME_MAX) { const cut = [...state.name].slice(0, NAME_MAX).join(''); say('name', `${[...state.name].length} characters`, cut, `a theme name is ${NAME_MAX} characters at most`); state.name = cut; }
      if (!FONTS.some((f) => f === state.font)) { if (state.font != null) say('font', state.font, d.font, `use one of ${FONTS.join(', ')}`); state.font = d.font; }
      if (state.preset != null && !PRESETS[state.preset]) { say('preset', state.preset, null, `not a preset; use one of ${Object.keys(PRESETS).join(', ')}`); state.preset = null; }
    }
    // saved chart choices: only the ones the page offers
    if (state.chart) {
      if (typeof state.chart === 'object') Object.keys(state.chart).filter((k) => !(CHART_OPTIONS[k] || []).some((o) => o === state.chart[k])).forEach((k) => say('chart.' + k, state.chart[k], null, CHART_OPTIONS[k] ? `use one of ${CHART_OPTIONS[k].join(', ')}` : `not a chart setting; use ${Object.keys(CHART_OPTIONS).join(', ')}`));
      state.chart = Object.fromEntries(Object.keys(CHART_OPTIONS).filter((k) => CHART_OPTIONS[k].some((o) => o === state.chart[k])).map((k) => [k, state.chart[k]]));
    }
    state.layout = Object.assign({ v: 3, page: '1920x1080', preset: 'exec', kpis: 4, filters: false, dir: '', radius: 8, shadow: true, header: true, kpiBar: 'start', headLine: 'short', samples: true, transparent: false }, upgrade(state.layout) || {});
    if (!LAYOUTS[state.layout.preset]) { say('layout.preset', state.layout.preset, 'exec', `use one of ${Object.keys(LAYOUTS).join(', ')}`); state.layout.preset = 'exec'; }
    // saved layout values outside the choices the page offers fall back to the defaults
    {
      const l = state.layout, one = (k, list, d) => { if (!list.includes(l[k])) { say('layout.' + k, l[k], d, `use one of ${list.map((x) => JSON.stringify(x)).join(', ')}`); l[k] = d; } };
      // an older MCP design's kpiCards (fewer cards than the layout's kpis) is its kpis now
      if ('kpiCards' in l) { const n = Math.floor(+l.kpiCards); if (l.kpiCards != null && n >= 0 && n < +l.kpis) l.kpis = n; say('layout.kpiCards', l.kpiCards, null, `not a layout key any more: kpis (0-6) is the number of KPI cards; kpis ${l.kpis} used`); delete l.kpiCards; }
      one('kpis', [0, 1, 2, 3, 4, 5, 6], LAYOUTS[l.preset].kpis); one('dir', ['', 'ltr', 'rtl'], '');
      if (!(+l.radius >= 0 && +l.radius <= 24)) { say('layout.radius', l.radius, 8, 'corners are 0 to 24'); l.radius = 8; }
      one('kpiBar', ['start', 'top', 'bottom', 'none'], 'start'); one('headLine', ['short', 'full', 'none'], 'short');
      if (!PAGES[l.page] && l.page !== 'custom') { say('layout.page', l.page, '1920x1080', `use ${Object.keys(PAGES).join(', ')} or custom`); l.page = '1920x1080'; }
      ['filters', 'shadow', 'header', 'samples', 'transparent'].forEach((k) => { if (typeof l[k] !== 'boolean') { const d = k !== 'filters' && k !== 'transparent'; say('layout.' + k, l[k], d, 'true or false'); l[k] = d; } });
      ['hh', 'logoW', 'fw', 'fh', 'kpiH', 'mainW', 'split', 'kpiBarW', 'headLineW', 'pageW', 'pageH'].forEach((k) => { if (l[k] != null && !isFinite(+l[k])) { say('layout.' + k, l[k], null, 'not a number; the default is used'); delete l[k]; } });
      // the optional choices (0.2.9, the audit's A2-7: every layout key is checked, not only the ones the page offers):
      // a value outside its choices is dropped (its default is used) and said
      const opt = (k, ok, why) => { if (l[k] !== undefined && !ok(l[k])) { say('layout.' + k, l[k], null, why); delete l[k]; } };
      opt('kpiBarC', (v) => BAR_COLORS.includes(v), `use one of ${BAR_COLORS.join(', ')}`); opt('headLineC', (v) => BAR_COLORS.includes(v), `use one of ${BAR_COLORS.join(', ')}`);
      opt('fpos', (v) => ['start', 'end', 'top'].includes(v), 'use start, end or top');
      opt('wideTable', (v) => typeof v === 'boolean', 'true or false');
    }
    return state;
  }
  // every download is named after the theme: letters of any script are kept (Arabic, café), other symbols dropped;
  // a name of only symbols leaves nothing, so its files are power-bi-theme
  const fileBase = (name) => themeName(name).replace(/[^\p{L}\p{M}\p{N}_\- ]+/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'power-bi-theme';

  const api = {
    PRESETS, NAME_MAX, FONTS, MEASURED_FONTS, CHART_OPTIONS, AR_FONTS, DEFAULT_NAME, themeName, VISUAL_TYPES, CHART_DEFAULTS, AXIS_CHARTS, T, label, RTL_LANGS, KINDS, LAYOUTS, PAGES, LIM, RANGE, M, G, HH,
    clampHex, hexToRgb, rgbToHex, mix, lum, contrast, hexToHsl, hslToHex, generate, calmPalette,
    within, fitCustom, page, pw, toPage, boxOf, upgrade, rtl, SMALL_PAGE, smallPage, isSmall, fitLayout, TABLE_NEED, tableWeight, rangeOf, clampTo, hasMain, hasSplit, sizes, computeSlots, pngSize, imageSize, kpiInset,
    fs, chart, colours, roles, BAR_COLORS, SCHEMA, DESIGN_KEYS, LAYOUT_KEYS, OLD_LAYOUT_KEYS, buildTheme, contrastChecks, REPORT_TEXTS, texts, projectSlots, secondLayout, slidePanel, projectPages, barW, barColor, c0, bgSvg, fresh, repairState, fileBase
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAEngine = api;
})(typeof self !== 'undefined' ? self : this);
