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
  // Every font in the list is built into Power BI, but only these have Arabic letters
  const AR_FONTS = ['Segoe UI', 'Segoe UI Semibold', 'Arial', 'Tahoma'];
  // The theme's name when none is given (the name box shows it to new visitors): the theme JSON and every file use it,
  // so an empty or blank name gives one name everywhere. A name with text is kept exactly as typed.
  const DEFAULT_NAME = 'My Brand Theme';
  const themeName = (name) => (name && String(name).trim() ? name : DEFAULT_NAME);

  // ---------- color math ----------
  // #1a2b3c, 1a2b3c or the short #abc form, spaces around allowed; anything else is not a color (null)
  const clampHex = (v) => { v = (v || '').trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-fA-F]{3}$/.test(v)) v = '#' + [...v.slice(1)].map((c) => c + c).join(''); return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null; };
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
  const KINDS = { kpi: ['Card', 'بطاقة'], line: ['Line chart', 'مخطط خطي'], bar: ['Bar chart', 'مخطط شريطي'], column: ['Column chart', 'مخطط أعمدة'], donut: ['Donut chart', 'مخطط دائري'], table: ['Table or matrix', 'جدول أو مصفوفة'], text: ['Text box or narrative', 'مربع نص أو سرد'], slicer: ['Slicers', 'مقسمات (Slicers)'], title: ['Text box (page title)', 'مربع نص (عنوان الصفحة)'], logo: ['Image (logo)', 'صورة (الشعار)'] };
  const LAYOUTS = {
    exec: { name: ['Executive summary', 'ملخص تنفيذي'], kpis: 4, kpiH: 96, filters: false, flex: [1.3, 1],
      rows: [[[2, 'line', ['Main trend', 'الاتجاه الرئيسي']], [1, 'bar', ['Breakdown', 'التوزيع']]], [[1, 'column', ['Comparison', 'المقارنة']], [1, 'table', ['Detail', 'التفاصيل']]]],
      why: [['Key numbers first, where the eye starts', 'الأرقام الأهم أولًا حيث تبدأ العين'], ['One screen, no scrolling', 'شاشة واحدة بدون تمرير'], ['8 visuals at most', '8 عناصر كحد أقصى']] },
    analysis: { name: ['Analysis', 'تحليل'], kpis: 3, kpiH: 84, filters: true, flex: [1, 1.25],
      rows: [[[1, 'column', ['Main chart', 'المخطط الرئيسي']]], [[1, 'table', ['Detail table', 'جدول التفاصيل']]]],
      why: [['All filters in one place', 'كل الفلاتر في مكان واحد'], ['Overview on top, detail below', 'النظرة العامة في الأعلى والتفاصيل في الأسفل'], ['A wide table that is easy to read', 'جدول عريض سهل القراءة']] },
    ops: { name: ['Operations monitor', 'مراقبة العمليات'], kpis: 6, kpiH: 84, filters: false, flex: [1, 1],
      rows: [[[1, 'line', ['Trend', 'الاتجاه']], [1, 'bar', ['Ranking', 'الترتيب']], [1, 'donut', ['Mix', 'التركيبة']]], [[1, 'column', ['Volume', 'الحجم']], [1, 'bar', ['Exceptions', 'الاستثناءات']], [1, 'table', ['Watch list', 'قائمة المتابعة']]]],
      why: [['Equal tiles for equal importance', 'مربعات متساوية لأهمية متساوية'], ['Dense but on one grid', 'كثيف لكن على شبكة واحدة'], ['Made for a daily check or a wall screen', 'مصمم للمتابعة اليومية أو شاشة العرض']] },
    focus: { name: ['Single focus', 'رسالة واحدة'], kpis: 3, kpiH: 96, filters: false, flex: [1],
      rows: [[[2.2, 'line', ['Hero chart', 'المخطط الرئيسي']], [1, 'text', ['What it means', 'ماذا يعني']]]],
      why: [['One message per page', 'رسالة واحدة لكل صفحة'], ['A short text explains the chart', 'نص قصير يشرح المخطط'], ['Generous white space', 'مساحة بيضاء مريحة']] }
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
  // Reading direction: the layout's own, or the page's language when none is chosen
  const rtl = (c, lang) => (c.dir ? c.dir === 'rtl' : lang === 'ar');

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
      kpiH: n('kpiH', P.kpiH), mainW: n('mainW', 100 * P.rows[0][0][0] / w0), split: n('split', P.flex.length === 2 ? 100 * P.flex[0] / (P.flex[0] + P.flex[1]) : 50) };
  }

  // The slots of a layout, on the 720-tall design grid (boxOf turns one into page units). lang: the page's language,
  // which sets the reading direction when the layout has none.
  function computeSlots(c, lang) {
    const PW = pw(c), PH = 720;
    const P = LAYOUTS[c.preset], z = sizes(c, PW), slots = [];
    let top = c.header ? z.hh + 14 : M;
    if (c.header) {
      const th = z.hh - 24, lx = PW - M - 8 - z.logoW;
      slots.push({ kind: 'title', role: ['Page title', 'عنوان الصفحة'], x: M + 8, y: 12, w: Math.min(560, lx - 24 - (M + 8)), h: th });
      slots.push({ kind: 'logo', role: ['Logo', 'الشعار'], x: lx, y: 12, w: z.logoW, h: th });
    }
    let x0 = M, cw = PW - 2 * M;
    if (c.filters && z.fpos === 'top') { slots.push({ kind: 'slicer', role: ['Filters', 'الفلاتر'], x: M, y: top, w: cw, h: z.fh, rail: true }); top += z.fh + G; }
    else if (c.filters) {
      const fx = z.fpos === 'end' ? PW - M - z.fw : M;
      slots.push({ kind: 'slicer', role: ['Filters', 'الفلاتر'], x: fx, y: top, w: z.fw, h: PH - M - top, rail: true });
      cw = PW - 2 * M - z.fw - G; if (z.fpos !== 'end') x0 = M + z.fw + G;
    }
    // the first chart row: the main chart takes its share, the others split the rest by their weights
    const first = P.rows[0].map((col, i) => col.slice());
    if (hasMain(P)) { const rest = first.slice(1).reduce((a, col) => a + col[0], 0); first[0][0] = rest * z.mainW / (100 - z.mainW); }
    const flex = hasSplit(P) ? [z.split, 100 - z.split] : P.flex.slice();
    const flexSum = flex.reduce((a, b) => a + b, 0), free = PH - M - top - G * P.rows.length - z.kpiH;
    // no chart row shorter than 90: move the split back if needed
    if (hasSplit(P) && free >= 180) { const h0 = free * flex[0] / flexSum; if (h0 < 90) flex[0] = flexSum * 90 / free; else if (free - h0 < 90) flex[0] = flexSum * (free - 90) / free; flex[1] = flexSum - flex[0]; }
    const rows = [{ fixed: z.kpiH, cols: Array.from({ length: c.kpis }, (_, i) => [1, 'kpi', [`KPI ${i + 1}`, `مؤشر ${i + 1}`]]) }]
      .concat([first].concat(P.rows.slice(1)).map((cols, i) => ({ flex: flex[i], cols })));
    let y = top;
    rows.forEach((r, ri) => {
      const h = r.fixed || (ri === rows.length - 1 ? PH - M - y : Math.round(free * r.flex / flexSum));
      const wsum = r.cols.reduce((a, col) => a + col[0], 0), avail = cw - G * (r.cols.length - 1);
      let x = x0;
      r.cols.forEach((col, ci) => {
        const w = ci === r.cols.length - 1 ? x0 + cw - x : Math.round(avail * col[0] / wsum);
        slots.push({ kind: col[1], role: col[2], x, y, w, h }); x += w + G;
      });
      y += h + G;
    });
    // Arabic reports read from the right: mirror the whole page so KPI 1 and the title start there
    if (rtl(c, lang)) slots.forEach((s) => { s.x = PW - s.x - s.w; });
    return slots;
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
  const borderStyle = (u, l) => (l && l.transparent
    ? [{ show: false }]
    : [{ show: true, color: { solid: { color: u.card } }, width: 1, radius: toPage(+l.radius || 0, l) }]);
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
      const g = c.grid === 'off' ? { gridlineShow: false } : { gridlineShow: true, gridlineStyle: 'dotted', gridlineColor: { solid: { color: mix(u.text, u.card, 0.8) } } };
      add(AXIS_CHARTS.concat('scatterChart'), 'valueAxis', g);
      // waterfall has no category gridlines in the schema; Power BI draws none there anyway
      if (c.grid === 'off') add(AXIS_CHARTS.concat('scatterChart').filter((t) => t !== 'waterfallChart'), 'categoryAxis', { gridlineShow: false });
    }
    // "Side" is stored as Right; in a right-to-left design it goes to the left, mirrored like the rest of the layout
    if (c.legend !== 'auto') add(AXIS_CHARTS.concat('scatterChart', 'pieChart', 'donutChart', 'treemap'), 'legend', c.legend === 'off' ? { show: false }
      : { show: true, position: c.legend === 'Right' && rtl(d.layout, lang) ? 'Left' : c.legend });
    if (c.axis === 'off') ['valueAxis', 'categoryAxis'].forEach((a) => add(AXIS_CHARTS.concat('scatterChart'), a, { showAxisTitle: false }));
    if (c.table !== 'auto') {
      const line = { solid: { color: mix(u.text, u.card, 0.85) } };
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
  // direction when the layout has none (the legend's side follows it)
  const buildTheme = (d, lang) => {
    const u = d.ui, l = d.layout, sec = mix(u.text, u.card, 0.35), ter = mix(u.text, u.card, 0.6), f = d.font;
    return {
      name: themeName(d.name),
      dataColors: d.data,
      foreground: u.text,
      foregroundNeutralSecondary: sec,
      foregroundNeutralTertiary: ter,
      background: u.card,
      backgroundLight: mix(u.card, u.background, 0.5),
      backgroundNeutral: mix(u.text, u.card, 0.8),
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
        ...Object.fromEntries(VISUAL_TYPES.map((t) => [t, { '*': { border: borderStyle(u, l), dropShadow: shadowStyle(l) } }])),
        // visuals with their own text sizes, which do not follow the text classes above
        ...textSizes(d)
      }, u, d, lang)
    };
  };

  // ---------- readability ----------
  // WCAG contrast of the theme's main pairs (4.5:1 for text, 3:1 for the first data colour, which carries the main
  // series), and the data colours that almost disappear on the visual background (below 1.6:1). d: the design
  const contrastChecks = (d) => {
    const u = d.ui, sec = mix(u.text, u.card, 0.35);
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
  const barColor = (d, k, i) => { const v = d.layout[k], u = d.ui; return v === 'data' ? d.data[i % d.data.length] : (u[v] || u.accent); };
  const c0 = (c) => (c.kpiBar === 'start' ? barW('kpiBarW', c) + 8 : 0); // KPI text sits after a side bar

  // The PNG matches the table to the pixel. In Power BI, with Image fit: Stretch, each panel lands exactly under
  // its visual (checked with calibration backgrounds on 1920 × 1080 and 1280 × 720 pages).
  // opt: { w, h } the image size, preview (the page's layout preview), overlay(slots) the preview's own marks
  function bgSvg(d, slots, opt, lang) {
    const u = d.ui, c = d.layout, right = rtl(c, lang), light = lum(u.background) > 0.45, PW = pw(c), PH = 720;
    const edge = mix(u.text, u.card, light ? 0.86 : 0.9), rail = mix(u.card, u.background, 0.35), r = +c.radius;
    let s = `<rect width="${PW}" height="${PH}" fill="${u.background}"/>`;
    if (c.header) {
      const hh = sizes(c, PW).hh;
      s += `<rect width="${PW}" height="${hh}" fill="${mix(u.card, u.background, 0.25)}"/><rect y="${hh - 1}" width="${PW}" height="1" fill="${edge}"/>`
        + (c.headLine === 'none' ? '' : (() => { const t = barW('headLineW', c), col = barColor(d, 'headLineC', 0);
          return c.headLine === 'full' ? `<rect class="hl" y="${hh - t}" width="${PW}" height="${t}" fill="${col}"/>`
            : `<rect class="hl" x="${right ? PW - M - 8 - 40 : M + 8}" y="${hh - 6 - t}" width="40" height="${t}" rx="${t / 2}" fill="${col}"/>`; })());
    }
    let clips = '';
    slots.forEach((p, i) => {
      if (p.kind === 'title' || p.kind === 'logo') return;
      s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}" fill="${p.rail ? rail : u.card}"${c.shadow ? ' filter="url(#sh)"' : ''}${light || !c.shadow ? ` stroke="${edge}" stroke-width="1"` : ''}/>`;
      if (p.kind !== 'kpi' || !c.kpiBar || c.kpiBar === 'none') return;
      const t = barW('kpiBarW', c), col = barColor(d, 'kpiBarC', +p.role[0].split(' ')[1] - 1);
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
  // A page's slots for the report: kind, name in lang, filter rail or not, and the box in page units
  const projectSlots = (c, lang) => computeSlots(c, lang).map((s) => Object.assign({ kind: s.kind, title: lang === 'ar' ? s.role[1] : s.role[0], rail: !!s.rail }, boxOf(s, c)));
  // a second page in a complementary layout: an analysis page (filters, a main chart, a wide table) after an
  // overview, or an executive overview after an analysis page
  const secondLayout = (c) => Object.assign({}, c, c.preset === 'analysis' ? { preset: 'exec', kpis: 4, filters: false } : { preset: 'analysis', kpis: 3, filters: true, fpos: 'start' }, { kpiH: null, mainW: null, split: null });
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
  // opts: { second, panel }. Each page: { layout (for its background), name, page { w, h }, slots, panel }
  const projectPages = (c, lang, opts) => {
    const nm = (pair) => (lang === 'ar' ? pair[1] : pair[0]), o = opts || {};
    const specs = [{ c, name: nm(LAYOUTS[c.preset].name) }].concat(o.second ? [{ c: secondLayout(c), name: nm(c.preset === 'analysis' ? ['Overview', 'نظرة عامة'] : ['Details', 'التفاصيل']) }] : []);
    return specs.map((sp) => {
      const sl = o.panel ? slidePanel(sp.c, lang) : null, layout = sl ? sl.layout : sp.c, p = page(layout);
      return { layout, name: sp.name, page: { w: p.w, h: p.h }, slots: projectSlots(layout, lang), panel: sl ? sl.panel : null };
    });
  };

  // ---------- saved designs ----------
  const fresh = () => ({ preset: 'DataArcus', name: DEFAULT_NAME, font: 'Segoe UI', data: PRESETS.DataArcus.data.slice(), ui: { ...PRESETS.DataArcus.ui } });
  // A saved design (or none) made safe to use, the way the generator repairs it on load: an old or hand-edited save may
  // be partial, so each value that is not valid falls back to its default, and older layouts are upgraded.
  // Changes the design in place and returns it (or a fresh one when there is nothing usable).
  function repairState(state) {
    if (!state || typeof state !== 'object' || !Array.isArray(state.data) || state.data.length !== 8) state = fresh();
    {
      const d = fresh(), hex = (v) => (typeof v === 'string' ? clampHex(v) : null), ui = state.ui && typeof state.ui === 'object' ? state.ui : {};
      state.data = state.data.map((c, i) => hex(c) || d.data[i]);
      state.ui = Object.fromEntries(Object.keys(d.ui).map((k) => [k, hex(ui[k]) || d.ui[k]]));
      if (typeof state.name !== 'string') state.name = d.name;
      if (!FONTS.some((f) => f === state.font)) state.font = d.font;
      if (state.preset != null && !PRESETS[state.preset]) state.preset = null;
    }
    // saved chart choices: only the ones the page offers
    if (state.chart) state.chart = Object.fromEntries(Object.keys(CHART_OPTIONS).filter((k) => CHART_OPTIONS[k].some((o) => o === state.chart[k])).map((k) => [k, state.chart[k]]));
    state.layout = Object.assign({ v: 3, page: '1920x1080', preset: 'exec', kpis: 4, filters: false, dir: '', radius: 8, shadow: true, header: true, kpiBar: 'start', headLine: 'short', samples: true, transparent: false }, upgrade(state.layout) || {});
    if (!LAYOUTS[state.layout.preset]) state.layout.preset = 'exec';
    // saved layout values outside the choices the page offers fall back to the defaults
    {
      const l = state.layout, one = (k, list, d) => { if (!list.includes(l[k])) l[k] = d; };
      one('kpis', [3, 4, 5, 6], LAYOUTS[l.preset].kpis); one('dir', ['', 'ltr', 'rtl'], '');
      if (!(+l.radius >= 0 && +l.radius <= 24)) l.radius = 8;
      one('kpiBar', ['start', 'top', 'bottom', 'none'], 'start'); one('headLine', ['short', 'full', 'none'], 'short');
      if (!PAGES[l.page] && l.page !== 'custom') l.page = '1920x1080';
      ['filters', 'shadow', 'header', 'samples', 'transparent'].forEach((k) => { if (typeof l[k] !== 'boolean') l[k] = k !== 'filters' && k !== 'transparent'; });
      ['hh', 'logoW', 'fw', 'fh', 'kpiH', 'mainW', 'split', 'kpiBarW', 'headLineW', 'pageW', 'pageH'].forEach((k) => { if (l[k] != null && !isFinite(+l[k])) delete l[k]; });
    }
    return state;
  }
  // every download is named after the theme: letters of any script are kept (Arabic, café), other symbols dropped;
  // a name of only symbols leaves nothing, so its files are power-bi-theme
  const fileBase = (name) => themeName(name).replace(/[^\p{L}\p{M}\p{N}_\- ]+/gu, '').trim().replace(/\s+/g, '-').toLowerCase() || 'power-bi-theme';

  const api = {
    PRESETS, FONTS, CHART_OPTIONS, AR_FONTS, DEFAULT_NAME, themeName, VISUAL_TYPES, CHART_DEFAULTS, AXIS_CHARTS, KINDS, LAYOUTS, PAGES, LIM, RANGE, M, G, HH,
    clampHex, hexToRgb, rgbToHex, mix, lum, contrast, hexToHsl, hslToHex, generate,
    within, fitCustom, page, pw, toPage, boxOf, upgrade, rtl, rangeOf, clampTo, hasMain, hasSplit, sizes, computeSlots, pngSize,
    fs, chart, buildTheme, contrastChecks, REPORT_TEXTS, projectSlots, secondLayout, slidePanel, projectPages, barW, barColor, c0, bgSvg, fresh, repairState, fileBase
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAEngine = api;
})(typeof self !== 'undefined' ? self : this);
