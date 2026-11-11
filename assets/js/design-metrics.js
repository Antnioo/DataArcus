/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Design metrics: the layout geometry and the typography, moved from design-engine.js as they were (0.3.2
 * SP29). Pure: every function reads only its arguments and the constants here (no page, no storage, no clock, no
 * language from the browser, no state between calls); the generator pages load this file after text-measure.js and
 * before design-engine.js (browser global DAMetrics), Node requires it. design-engine.js (DAEngine) re-exports every
 * name, so DAEngine.computeSlots === DAMetrics.computeSlots.
 * The interface (in: a layout c, the design's saved layout { page, pageW, pageH, preset, kpis, filters, fpos, dir,
 * header, sizes...; a language lang, which only sets the reading direction and the labels' language; out: numbers,
 * boxes and slots, new objects, the inputs never changed):
 *   pages and units  PAGES, DEFAULT_PAGE, LIM, within, fitCustom(w, h), page(c) { w, h, s }, pw(c), toPage(v, c),
 *                    boxOf(slot, c), pngSize(c), imageSize(bytes) { w, h } or null
 *   labels           T(en, ar), baseLang(lang), label(x, lang)
 *   the layouts      LAYOUTS, RTL_LANGS, rtl(c, lang), SMALL_PAGE, smallPage(c), isSmall(c), fitLayout(c), TABLE_NEED,
 *                    tableWeight(n), RANGE, rangeOf(k, PW, c), clampTo(k, v, PW, c), CATEGORY_KINDS, CATEGORY_FIT,
 *                    categoryFit(kind, w, h), noTimeOf(P), LAYOUT_PREVIEW, isPreview(c), hasMain(P), hasSplit(P),
 *                    sizes(c, PW), computeSlots(c, lang, opt) (on the 720 grid), M, G, HH
 *   the KPI bars     barW(k, c), c0(c), kpiInset(c)
 *   the report       projectSlots(c, lang, opt) (page units), secondLayout(c), slidePanel(c, lang), projectPages(c, lang,
 *                    opts), absorb(out, t), fitSlots(slots, opt) { slots, dropped }, fitScale(opt, k), SLOT_GAP, REFLOW_KEEP,
 *                    pageFill(slots) { hole, holeArea, holeShare, gutter, charts, flat, low, rows, balance } (0.3.3 FB1, FB3)
 *   text sizes       FHD_TEXT, textScale(h), sizeAt(n, h), fs(n, c), TEXT_BASES, themeScaleOf(theme) { h, f } or null,
 *                    scaleTheme(theme, r) (a copy)
 */
(function (root) {
  // text-measure.js: the font catalog, the measured heights and Power BI's 8-60 text sizes, one place (0.3.2 OP1)
  const TM = typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure;
  // png-bytes.js: the big-endian four bytes, one place (0.3.2 DD2U; the generator pages load it before this file)
  const { u32 } = typeof module !== 'undefined' && module.exports ? require('./png-bytes.js') : root.DAPngBytes;

  // ---------- page layout: a full background with a place for every visual ----------
  // Power BI's default page is 1280 × 720, so every slot is in those units and can be typed straight
  // into Format › General › Properties. The PNG is drawn at 1.5× (1920 × 1080) so it stays sharp.
  const M = 16, G = 12, HH = 56;
  // Page sizes: the layout is designed on a grid 720 units tall and converted to the page's own units,
  // so the table, CSV and sliders always show the numbers to type into Power BI for that page.
  const PAGES = { '1280x720': [1280, 720], '1920x1080': [1920, 1080], '960x720': [960, 720] };
  // The page a new design gets (Power BI's own default), the one place it is set (0.3.2 OP1): the generator page, the
  // MCP's inputs and the approval page read it. 1280 x 720 stays the page of a design saved before v3 (upgrade)
  const DEFAULT_PAGE = '1920x1080';
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
  const page = (c) => { const [w, h] = c.page === 'custom' ? fitCustom(c.pageW, c.pageH) : PAGES[c.page] || PAGES[DEFAULT_PAGE]; return { w, h, s: h / 720 }; };
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
    return k === 'hh' ? Math.ceil(24 + 25 / s) : Math.ceil((TM.slicerH(fs(10, c)) + 20 * s / 1.5) / s);
  };
  const rangeOf = (k, PW, c) => {
    const r = k === 'fw' ? [160, Math.min(320, Math.round(PW / 4))] : RANGE[k];
    return [Math.min(r[1], Math.max(r[0], minOf(k, c))), r[1]];
  };
  const clampTo = (k, v, PW, c) => Math.max(rangeOf(k, PW, c)[0], Math.min(rangeOf(k, PW, c)[1], Math.round(+v)));
  // A layout for a model with no time axis (0.2.9, the laptop's sweep of rc.1, D16: the line chart's room went to the bar
  // chart beside it, four bars across the whole page): its line chart is left out and its row re-formed. A row left with
  // one category chart takes the next row's category chart beside it (exec: the bar and column charts share the first
  // row, the table has the second); a line chart alone with a text box (the single focus) becomes a bar chart. The
  // writer's fitSlots does nothing more then (no line slot to give away).
  const CATEGORY_KINDS = ['bar', 'column', 'donut'];
  // How many categories a chart's slot can show (0.2.9, the laptop's sweep of rc.1, S5 and D19: a category with dozens
  // of values gave cut vertical labels and a scrollbar). The report keeps that many, its Top N by the chart's measure,
  // and the plan says so. On the 720 grid (positions scale h / 720; the rows below were measured at 10pt on 720 and are
  // kept as measured on a 1080 page, whose text is now x 1.25, not x 1.5: a row there has room to spare, never less).
  //  bar: measured, Desktop 2.158 (night of 6-7 Oct, DESKTOP-TESTS.md; mcp/docs/RULES-POWERBI.md): 22.2 a row at the theme's 10pt,
  //    45 above the first row, 8 under the last and 38 for the value axis;
  //  column: a GUESS until the laptop proof "S5" in DESKTOP-TESTS.md: horizontal labels need about 64 a column (a label
  //    of about 8 characters at 10pt) after 60 for the value axis, at most 12 (12 month names fit, round 1, measured)
  const CATEGORY_FIT = { bar: 'measured: 22.2 a row at 10pt, 45 above, 8 below, 38 for the value axis (Desktop 2.158, 6-7 Oct 2026)',
    column: 'GUESS until the laptop proof S5: about 64 a column after 60 for the value axis, at most 12 (12 month names fit, round 1)' };
  const categoryFit = (kind, w, h) => (kind === 'bar' ? Math.max(1, Math.floor((h - 45 - 8 - 38) / 22.2))
    : kind === 'column' ? Math.max(3, Math.min(12, Math.floor((w - 60) / 64))) : null);
  const noTimeOf = (P) => {
    const alone = (r) => r.some((col) => col[1] === 'line') && !r.some((col) => col[1] !== 'line' && col[1] !== 'text');
    const rows = P.rows.map((r) => (alone(r) ? r.map((col) => (col[1] === 'line' ? [col[0], 'bar', T('Main breakdown', 'التوزيع الرئيسي')] : col)) : r.filter((col) => col[1] !== 'line')))
      .map((r) => r.map((col) => col.slice()));
    for (let i = 0; i < rows.length - 1; i++) if (rows[i].length === 1 && CATEGORY_KINDS.includes(rows[i][0][1])) {
      const j = rows[i + 1].findIndex((col) => CATEGORY_KINDS.includes(col[1]));
      if (j >= 0 && rows[i + 1].length > 1) { rows[i][0][0] = 1; rows[i].push(Object.assign(rows[i + 1].splice(j, 1)[0], { 0: 1 })); }
    }
    const keep = rows.map((r, i) => (r.length ? i : -1)).filter((i) => i >= 0);
    return Object.assign({}, P, { rows: keep.map((i) => rows[i]), flex: keep.map((i) => P.flex[i] != null ? P.flex[i] : 1) });
  };
  // the layout's rows as this page gets them (c.noTime: projectPages' opts.noTime, carried by the page's layout)
  // (design round 9, the re-score's S7 on all 9 reports: page 2's side rail shrank to its dropdowns and the page stayed
  // empty under it, and its full-width table, of rows no one can count before the data, left half its panel empty) the
  // details page keeps the filter side the user asked for (the owner's O-1) and its rail kept to its contents (#18);
  // its rows are the main chart, then the table beside a bar chart, so a short table leaves half a row, not half a
  // page, and fitSlots reflows the rows beside and under a shortened rail
  const DETAIL_ROWS = [[[1, 'column', T('Main chart', 'المخطط الرئيسي')]], [[1, 'table', T('Detail table', 'جدول التفاصيل')], [1, 'bar', T('Breakdown', 'التوزيع')]]];
  // (the owner's decision, 12 Oct, after the laptop's LAYOUT-SWEEP-RC6: the executive and single-focus layouts ship as
  // tested; the operations monitor, analysis as the first page and a page under 1920 wide with filters on top ship as
  // preview, said in the plan in one plain line; nothing else changes)
  const LAYOUT_PREVIEW = T('Preview: this layout is still being tuned on real dashboards; the executive and single-focus layouts are the tested ones.',
    'معاينة: ما زال هذا التخطيط قيد الضبط على لوحات معلومات حقيقية، وتخطيطا «ملخص تنفيذي» و«رسالة واحدة» هما المختبران.');
  const isPreview = (c) => c.preset === 'ops' || c.preset === 'analysis' || (!!c.filters && c.fpos === 'top' && page(c).w < 1920);
  const layoutOf = (c) => { const L = c.detail ? Object.assign({}, LAYOUTS[c.preset], { rows: DETAIL_ROWS }) : LAYOUTS[c.preset]; return c.noTime ? noTimeOf(L) : L; };
  const hasMain = (P) => P.rows[0].length > 1 && P.rows[0][0][0] > P.rows[0][1][0];   // a wider first chart
  const hasSplit = (P) => P.rows.length === 2;
  function sizes(c, PW) {
    const P = layoutOf(c), n = (k, d) => clampTo(k, c[k] == null || !isFinite(+c[k]) ? d : c[k], PW, c);
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
  // opt.noTime (the report's model has no time axis): the layout made for it (noTimeOf); the same as c.noTime.
  function computeSlots(c, lang, opt) {
    c = fitLayout(c);
    if (opt && opt.noTime && !c.noTime) c = Object.assign({}, c, { noTime: true });
    const PW = pw(c), PH = 720;
    const P = layoutOf(c), z = sizes(c, PW), slots = [];
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
    // (S5) the categories a bar or column chart's slot can show: its Top N
    slots.forEach((s) => { const n = categoryFit(s.kind, s.w, s.h); if (n) s.topN = n; });
    return slots;
  }
  // An image's size in pixels, read from its bytes (a Uint8Array): PNG (the IHDR chunk) or JPG (the frame header);
  // null for anything else. Used for an attached logo, so its box can take the logo's own shape.
  function imageSize(b) {
    if (!b || b.length < 24) return null;
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
      const w = u32(b, 16), h = u32(b, 20);
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

  // ---------- text sizes ----------
  // Power BI's default text sizes (title 12, label 10, callout 28) are made for a 1280 × 720 page. On a bigger page
  // everything looks small, so every size grows with the page: × 1.25 on 1920 × 1080, unchanged on 1280 × 720.
  // FHD_TEXT: the text factor on 1920 × 1080, the ONE place it is set (the owner's decision of 27 Oct, D-1027-16: "no go
  // for 1.25 in 0.3.1"; from Codex's text-sizes review, dataarcus-exchange results/2026-10-26-text-sizes: × 1.5 kept the
  // 720 page's apparent size at Fit to page, × 1.25 is its role-based profile: body 12.5, visual title 15, KPI 35).
  // Up to 0.3.0 it was 1.5 (the page's own factor, h / 720). textScale: the factor on a page h high, a straight line
  // through 1 at 720 and FHD_TEXT at 1080 (2 at 2160, 0.75 at 360). Only text follows it: a box the laptop measured
  // keeps its measured minimum (the pills, pbip-sizing.js pillH; the KPI title gap, kpiInset), and positions stay h / 720.
  // Power BI rejects the whole theme when one font size is outside 8-60 (tested in Desktop), so very big or small pages stop there
  // sizeAt: a base size on a page h high (the grid is 720 high), in half points within 8-60 (Power BI takes half points)
  const FHD_TEXT = 1.25;
  const textScale = (h) => 1 + (h / 720 - 1) * (FHD_TEXT - 1) / (1080 / 720 - 1);
  const sizeAt = (n, h) => TM.sizeIn(Math.round(n * textScale(h) * 2) / 2);
  const fs = (n, l) => sizeAt(n, page(l).h);
  // The visual text sizes textSizes writes, each its base on the 720 grid: a theme is the engine's when every one of
  // them is its base at one page height (0.2.9, the tools audit's A6-10: the MCP server copied these sizes and the
  // rounding to find a theme's page; an engine change would have broken it without a word)
  const TEXT_BASES = [['tableEx', 'values', 'fontSize', 10], ['slicer', 'header', 'textSize', 10], ['card', 'labels', 'fontSize', 28], ['multiRowCard', 'cardTitle', 'fontSize', 12], ['multiRowCard', 'dataLabels', 'fontSize', 18], ['pivotTable', 'rowHeaders', 'fontSize', 10]];
  // The page height a theme's text sizes were made for: { h, f } (h the middle of the heights that give all its sizes, f
  // its text factor, textScale(h): a rescale to another page is textScale(there) / f), or null for a theme the engine
  // did not make (its sizes are its author's). (TS1) A 1920 × 1080 theme made before 0.3.1 (× 1.5) reads as one made
  // for a page about 1440 high: its sizes are exactly those
  const themeScaleOf = (theme) => {
    const vs = (theme && theme.visualStyles) || {}, at = (v, k, prop) => +((((vs[v] || {})['*'] || {})[k] || [{}])[0] || {})[prop];
    const got = TEXT_BASES.map(([v, k, prop]) => at(v, k, prop));
    if (!(got[0] > 0)) return null;
    const fits = (h) => TEXT_BASES.every(([, , , n], i) => got[i] === sizeAt(n, h));
    const hs = []; for (let h = 200; h <= 4400; h++) if (fits(h)) hs.push(h);
    const h = hs[Math.floor(hs.length / 2)];
    return hs.length ? { h, f: textScale(h) } : null;
  };
  // A copy of a theme with every text size times r, in half points within 8-60 (the theme given is not changed)
  const scaleTheme = (theme, r) => {
    const walk = (o) => (Array.isArray(o) ? o.map(walk) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, (k === 'fontSize' || k === 'textSize') && typeof v === 'number' ? TM.sizeIn(Math.round(v * r * 2) / 2) : walk(v)])) : o);
    return walk(theme);
  };

  // ---------- the KPI cards' accent bars ----------
  // accent bars: side, thickness and color (Advanced options)
  const barW = (k, c) => clampTo(k, c[k] == null ? (k === 'kpiBarW' ? 4 : 3) : c[k]);
  const c0 = (c) => (c.kpiBar === 'start' ? barW('kpiBarW', c) + 8 : 0); // KPI text sits after a side bar
  // Where a KPI card's title can start beside the side accent bar, in page units from the card's reading-start edge: the
  // bar's far edge (it is drawn 10 in, see bgSvg) plus round(5k), k = page height / 1080 (measured in Power BI Desktop
  // 2.158: 26 on 1920 x 1080 and 17 on 1280 x 720 leave a clear gap; less and the title is drawn over the bar).
  // 0 without a side bar. The report uses it as the card's padding on that side.
  const kpiInset = (c) => (c.kpiBar === 'start' ? toPage(10 + barW('kpiBarW', c), c) + Math.round(5 * page(c).h / 1080) : 0);

  // ---------- the report's pages ----------
  // A page's slots for the report: kind, name in lang, filter rail or not, and the box in page units
  const projectSlots = (c, lang, opt) => computeSlots(c, lang, opt).map((s) => Object.assign({ kind: s.kind, title: label(s.role, lang), rail: !!s.rail }, boxOf(s, c), s.topN ? { topN: s.topN } : {}));
  // a second page in a complementary layout: an analysis page (filters, a main chart, a wide table) after an
  // overview, or an executive overview after an analysis page. The filters stay on the side the user chose for the
  // first page (O-1 of the owner's test of 0.2.8, 10 Oct 2026: "filters right" gave a second page with them at the left)
  // A first page with fewer KPI cards than its layout plans (a report with fewer measures) keeps the second page at that
  // count (0.2.9, A2-4: this was the MCP's kpiCards, which capped every page).
  const secondLayout = (c) => { const to = c.preset === 'analysis' ? 'exec' : 'analysis', own = LAYOUTS[to].kpis, k = +c.kpis < LAYOUTS[c.preset].kpis ? Math.min(own, +c.kpis) : own;
    return Object.assign({}, c, to === 'exec' ? { preset: 'exec', kpis: k, filters: false } : { preset: 'analysis', kpis: k, filters: true, fpos: ['start', 'end', 'top'].includes(c.fpos) ? c.fpos : 'start', detail: true }, { kpiH: null, mainW: null, split: null }); };
  // Filters as a slide-in panel: the page without its filter rail, and the panel's box (null when the page has no
  // filters or no header). The panel opens under the Filters button, at the end of the header (right in English, left in Arabic)
  const slidePanel = (cc, lang) => {
    if (!cc.filters || !cc.header) return null;
    const open = Object.assign({}, cc, { filters: false });
    const PW = pw(cc), PH = 720, z = sizes(cc, PW), w = Math.max(240, Math.min(320, z.fw + 40)), top = z.hh + 14;
    const r = { x: rtl(cc, lang) ? M : PW - M - w, y: top, w, h: PH - M - top };
    return { layout: open, panel: boxOf(r, cc) };
  };
  // ---------- the slots a report really gets (0.2.9, audit 2's A2-3) ----------
  // The report writer used to move the engine's slots itself after plan_layout had given them (absorb, dropLines, its
  // header growth and its rail fit), and the website's background replayed only part of it. One pure rule here instead,
  // which the writer, plan_layout and the background all call; the writer measures (its page tabs, its slicers and Reset)
  // and passes the numbers. Units: the slots' own (page units for a report, the 720 grid for the background), the
  // options' lengths in the same units.
  // Round 23 (the owner's "nothing critical left"; the reviewer's part 7 review, 2): a slot whose visual cannot be written
  // gives its room to the visual beside it (the same row and height, else the same column and width), as a text box
  // without its sentence does. absorb(out, t): out the slots left, t the one that goes; nothing beside it: the room stays
  // empty. Touching slots of a dropped kind are merged first (within SLOT_GAP), so two side by side leave no blank band.
  const OWN_SLOTS = ['title', 'logo', 'text'];
  const nearSlot = (list, t) => list.slice().sort((p, q) => Math.abs(p.x - t.x) + Math.abs(p.y - t.y) - Math.abs(q.x - t.x) - Math.abs(q.y - t.y))[0];
  function absorb(out, t) {
    const row = nearSlot(out.filter((x) => !OWN_SLOTS.includes(x.kind) && Math.abs(x.y - t.y) <= 1 && Math.abs(x.h - t.h) <= 1), t);
    const colm = row ? null : nearSlot(out.filter((x) => !OWN_SLOTS.includes(x.kind) && Math.abs(x.x - t.x) <= 1 && Math.abs(x.w - t.w) <= 1), t);
    if (row) { const x0 = Math.min(row.x, t.x), x1 = Math.max(row.x + row.w, t.x + t.w); return out.map((x) => (x === row ? Object.assign({}, x, { x: x0, w: x1 - x0 }) : x)); }
    if (colm) { const y0 = Math.min(colm.y, t.y), y1 = Math.max(colm.y + colm.h, t.y + t.h); return out.map((x) => (x === colm ? Object.assign({}, x, { y: y0, h: y1 - y0 }) : x)); }
    return out;
  }
  // ---------- how well a page is filled (0.3.3 FB1) ----------
  // pageFill(slots): what a page's slots leave empty and how flat its charts are, measured, so a layout rule is chosen and
  // pinned by a number instead of a case by case patch (the rail's gaps came back five times: 0.2.9 rounds 8, 9 and 12,
  // FX2's C03, SQ13's S10). Units: the slots' own; the header's slots (title, logo) are not part of the body.
  //  hole: the largest empty rectangle inside the body (the box around every other slot) whose two sides are both wider
  //    than two of the page's own gutters (the smallest gap between two rows), or null; holeArea its area, holeShare its
  //    share of the body in percent (one decimal); gutter: that smallest row gap (the slots' own G)
  //  flat: the widest chart, its width / height (one decimal); low: the lowest chart's height; charts: how many (a chart:
  //    any slot that is not a card, a slicer, a table, a text box or the header's)
  //  (0.3.3 FB3) rows: the heights of the rows of charts and tables, top to bottom (slots with one top, within 1; the
  //    row's highest slot); balance: the first row's height over the highest row's under it (two decimals), null with
  //    fewer than two rows: under 1, the page's first charts are the junior row
  const NOT_CHART = ['kpi', 'slicer', 'table', 'text', 'title', 'logo'];
  function pageFill(slots) {
    const body = (slots || []).filter((s) => !OWN_SLOTS.includes(s.kind) || s.kind === 'text'), charts = body.filter((s) => !NOT_CHART.includes(s.kind));
    const r1 = (v) => Math.round(v * 10) / 10;
    const out = { hole: null, holeArea: 0, holeShare: 0, gutter: 0, charts: charts.length, flat: charts.length ? r1(Math.max(...charts.map((s) => s.w / Math.max(1, s.h)))) : 0, low: charts.length ? Math.min(...charts.map((s) => s.h)) : 0 };
    const tops = [];
    body.filter((s) => !['kpi', 'slicer', 'text'].includes(s.kind)).sort((p, q) => p.y - q.y).forEach((s) => { const r = tops[tops.length - 1]; if (r && Math.abs(r.y - s.y) <= 1) r.h = Math.max(r.h, s.h); else tops.push({ y: s.y, h: s.h }); });
    out.rows = tops.map((r) => r.h); out.balance = tops.length > 1 ? Math.round(100 * tops[0].h / Math.max(...out.rows.slice(1))) / 100 : null;
    if (!body.length) return out;
    const x0 = Math.min(...body.map((s) => s.x)), y0 = Math.min(...body.map((s) => s.y)), x1 = Math.max(...body.map((s) => s.x + s.w)), y1 = Math.max(...body.map((s) => s.y + s.h));
    const gaps = body.flatMap((a) => body.filter((b) => b.y >= a.y + a.h && b.x < a.x + a.w && b.x + b.w > a.x).map((b) => b.y - (a.y + a.h))).filter((g) => g > 0);
    const side = 2 * (out.gutter = gaps.length ? Math.min(...gaps) : 0);
    const uniq = (l) => [...new Set(l)].sort((a, b) => a - b), xs = uniq(body.flatMap((s) => [s.x, s.x + s.w])), ys = uniq(body.flatMap((s) => [s.y, s.y + s.h]));
    // the grid of the slots' own edges: a cell is free when no slot covers it; the largest free rectangle, by its area
    const free = ys.slice(0, -1).map((y, j) => xs.slice(0, -1).map((x, i) => !body.some((s) => s.x <= x && s.x + s.w >= xs[i + 1] && s.y <= y && s.y + s.h >= ys[j + 1])));
    for (let j0 = 0; j0 < ys.length - 1; j0++) {
      const open = xs.slice(0, -1).map(() => true);
      for (let j1 = j0; j1 < ys.length - 1; j1++) {
        free[j1].forEach((f, i) => { if (!f) open[i] = false; });
        for (let i0 = 0; i0 < open.length; i0++) { if (!open[i0]) continue; let i1 = i0; while (i1 + 1 < open.length && open[i1 + 1]) i1++;
          const w = xs[i1 + 1] - xs[i0], h = ys[j1 + 1] - ys[j0];
          if (w > side && h > side && w * h > out.holeArea) { out.hole = { x: xs[i0], y: ys[j0], w, h }; out.holeArea = w * h; }
          i0 = i1; }
      }
    }
    out.holeShare = r1(100 * out.holeArea / Math.max(1, (x1 - x0) * (y1 - y0)));
    return out;
  }

  const SLOT_GAP = 40;
  const REFLOW_KEEP = 0.45;   // (round 8, S7; round 9: 0.6 -> 0.5, so two dropdowns reflow too; 0.3.1 TS1, the owner's yes of 26 Oct to 0.2.9-writer-S10, SQ13's option (a): 0.5 -> 0.45, so a second page's chart keeps 168 of 347 and the 197 gap under the rail closes) a chart beside the rail keeps this share of its height at least when the page reflows
  const slotsTouch = (a, b) => (Math.abs(a.y - b.y) <= 1 && Math.abs(a.h - b.h) <= 1 && Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w) <= SLOT_GAP)
    || (Math.abs(a.x - b.x) <= 1 && Math.abs(a.w - b.w) <= 1 && Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h) <= SLOT_GAP);
  // (0.3.3 FB1) liftCards(slots, rail): the page with its row of KPI cards across the rail's column too and the rail
  // (already kept to its contents) moved under that row, a row's gap below it: { slots, rail } (new objects), or null
  // where the page has no such row (no cards, cards not level with the rail's top or not beside it, nothing under them,
  // or the rail would pass the page's bottom). The cards keep their order, their gap and equal widths (edges rounded,
  // as boxOf does); one card alone keeps its width (the owner's quarter, 6 Oct) and moves to the page's edge when it
  // stood against the rail.
  function liftCards(slots, rail) {
    const kp = slots.filter((s) => s.kind === 'kpi').sort((p, q) => p.x - q.x), body = slots.filter((s) => !OWN_SLOTS.includes(s.kind) && s.kind !== 'kpi' && s !== rail);
    if (!kp.length || !body.length || kp.some((s) => Math.abs(s.y - rail.y) > 1 || Math.abs(s.h - kp[0].h) > 1 || (s.x < rail.x + rail.w && s.x + s.w > rail.x))) return null;
    const kb = kp[0].y + kp[0].h, under = body.filter((s) => s.y >= kb).map((s) => s.y - kb);
    if (!under.length) return null;
    const y = kb + Math.min(...under), bottom = Math.max(...body.map((s) => s.y + s.h).concat(rail.y + rail.h));
    if (y + rail.h > bottom + 1) return null;
    const x0 = Math.min(rail.x, kp[0].x), x1 = Math.max(rail.x + rail.w, ...kp.map((s) => s.x + s.w)), n = kp.length, moved = new Map();
    if (n === 1) {
      const s = kp[0], after = s.x - (rail.x + rail.w), before = rail.x - (s.x + s.w);
      moved.set(s, after >= 0 && after <= SLOT_GAP ? { x: rail.x } : before >= 0 && before <= SLOT_GAP ? { x: rail.x + rail.w - s.w } : {});
    } else {
      const g = kp[1].x - (kp[0].x + kp[0].w), step = (x1 - x0 + g) / n;
      kp.forEach((s, i) => { const x = x0 + Math.round(i * step); moved.set(s, { x, w: (i === n - 1 ? x1 : x0 + Math.round((i + 1) * step) - g) - x }); });
    }
    const r2 = Object.assign({}, rail, { y });
    return { slots: slots.map((s) => (s === rail ? r2 : moved.has(s) ? Object.assign({}, s, moved.get(s)) : s)), rail: r2 };
  }
  // (0.3.3 FB3; the focus page's hole, FB1's "Seen" 2: the row beside the rail holds the chart and the text box, so it
  // can neither end at the rail's bottom, 312 of 789, nor move under it) tuckText(slots, rail): the page with the text
  // box of the row beside the rail moved under the rail, into the rail's own column, a row's gap below it and down to
  // its row's bottom, and the row's other slots sharing the row's whole width in their own proportions (edges rounded,
  // as boxOf does): new objects, or null where there is no such row (no text box that runs past the rail's bottom,
  // no other slot in its row, the row not beside the rail, the rail's column not free under it, or the text box
  // would keep less than TUCK_KEEP of its width or of its height). A text box is the one kind that reads in a narrow
  // column (it is 219 wide on a 960 x 720 focus page as designed).
  const TUCK_KEEP = 0.5;
  function tuckText(slots, rail) {
    const B = rail.y + rail.h, t = slots.find((s) => s.kind === 'text' && s.y < B && s.y + s.h > B);
    if (!t) return null;
    const row = slots.filter((s) => s !== t && s !== rail && !OWN_SLOTS.includes(s.kind) && s.kind !== 'kpi' && Math.abs(s.y - t.y) <= 1 && Math.abs(s.h - t.h) <= 1).sort((p, q) => p.x - q.x);
    const side = row.concat(t).map((s) => Math.max(s.x - (rail.x + rail.w), rail.x - (s.x + s.w))).filter((d) => d >= 0 && d <= SLOT_GAP);
    if (!row.length || !side.length) return null;
    const g = Math.min(...side), y = B + g, bottom = t.y + t.h, h = bottom - y;
    if (rail.w < TUCK_KEEP * t.w || h < TUCK_KEEP * t.h) return null;
    if (slots.some((s) => s !== rail && s.kind !== 'title' && s.kind !== 'logo' && s.x < rail.x + rail.w && s.x + s.w > rail.x && s.y < bottom && s.y + s.h > B)) return null;
    const all = row.concat(t), x0 = Math.min(...all.map((s) => s.x)), x1 = Math.max(...all.map((s) => s.x + s.w)), n = row.length;
    const sum = row.reduce((a, s) => a + s.w, 0), avail = x1 - x0 - g * (n - 1), moved = new Map([[t, { x: rail.x, y, w: rail.w, h }]]);
    let acc = 0;
    row.forEach((s, i) => { const x = x0 + Math.round(avail * acc / sum) + g * i; acc += s.w; moved.set(s, { x, w: (i === n - 1 ? x1 : x0 + Math.round(avail * acc / sum) + g * i) - x }); });
    return slots.map((s) => (moved.has(s) ? Object.assign({}, s, moved.get(s)) : s));
  }
  // fitSlots(slots, { dropKinds, headerRows, railItems }): { slots, dropped }; the slots given are never changed
  //  dropKinds: the kinds whose visual cannot be written (a line chart on a model with no time axis)
  //  headerRows: how much the header grows for its extra row of page tabs (Round 12, the owner's go on round 11's
  //    recommendation 2): the title and logo grow (textH keeps their first height), every other slot moves down, and
  //    those that reach the page's bottom (the last row, the filter rail) give that height up
  //  railItems: { n, minH, maxH, resetH, pad, gap } (Round 12, #18; seen in Desktop 2.158, round 11: three dropdowns at the
  //    top of the rail, Reset at its very bottom and 300 page units of empty panel between them): a rail (a slicer slot
  //    higher than wide) is only as high as its n dropdowns (each minH to maxH) and its Reset (resetH), pad around them
  //    and gap after each; it stays a column, stack (round 23, the laptop's S1); the slots wholly below it take its
  //    column (0.2.9, the laptop's sweep S7)
  function fitSlots(slots, opt) {
    const o = opt || {}, kinds = o.dropKinds || [];
    let out = slots.slice(), dropped = [];
    kinds.forEach((kind) => {
      const gone = out.filter((x) => x.kind === kind), boxes = gone.map((x) => ({ x: x.x, y: x.y, w: x.w, h: x.h }));
      for (let merged = true; merged;) {
        merged = false;
        for (let i = 0; i < boxes.length && !merged; i++) for (let j = i + 1; j < boxes.length && !merged; j++) if (slotsTouch(boxes[i], boxes[j])) {
          const a = boxes[i], b = boxes[j], x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
          boxes.splice(j, 1); boxes[i] = { x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0 }; merged = true;
        }
      }
      out = out.filter((x) => x.kind !== kind);
      boxes.forEach((t) => { out = absorb(out, t); });
      dropped = dropped.concat(gone);
    });
    const extra = +o.headerRows || 0;
    if (extra) {
      const head = (x) => x.kind === 'title' || x.kind === 'logo', bottom = Math.max(...out.filter((x) => !head(x)).map((x) => x.y + x.h));
      out = out.map((x) => (head(x) ? Object.assign({}, x, { h: x.h + extra, textH: x.h }) : Object.assign({}, x, { y: x.y + extra }, x.y + x.h >= bottom - 1 ? { h: x.h - extra } : {})));
    }
    const R = o.railItems;
    if (R) out = out.map((s) => {
      if (s.kind !== 'slicer' || s.w > s.h) return s;
      const n = Math.max(1, R.n), sh = Math.max(R.minH, Math.min(R.maxH, (s.h - 2 * R.pad - R.resetH - R.gap * n) / n));
      return Object.assign({}, s, { h: Math.min(s.h, Math.ceil(2 * R.pad + n * sh + R.gap * n + R.resetH)), stack: true });
    });
    // (the laptop's sweep of rc.1, S7: under the shortened rail the page stayed empty to its bottom) a slot wholly below
    // the rail's new bottom, beside the rail (within SLOT_GAP), takes the rail's column: the row reaches the page's edge
    const rail = R && out.find((s) => s.kind === 'slicer' && s.stack);
    // (design round 8, the re-score's S7: on page 2 the rail shrank beside a chart that runs lower, and the visual under
    // both starts after that chart, so the page stayed empty under the rail) the content reflows, the rail kept to its
    // contents (the owner's round-12 rule #18): the slots beside the rail that run past its bottom end there, and the
    // slots under them and under the rail move up by as much, keeping their bottoms (they grow). Only where every chart
    // beside keeps half its height at least (REFLOW_KEEP); otherwise the page is left as it is.
    // (0.3.3 FB1) the page under a shortened rail, settled: the reflow and the rail's column, as before, on the slots
    // and the rail given; the cards' row is tried over the rail too (liftCards) and the better filled page is kept
    const column = (out, rail) => out.map((s) => {
      if (s === rail || s.y < rail.y + rail.h || OWN_SLOTS.includes(s.kind)) return s;
      const gapStart = s.x - (rail.x + rail.w), gapEnd = rail.x - (s.x + s.w);
      if (gapStart >= 0 && gapStart <= SLOT_GAP) return Object.assign({}, s, { x: rail.x, w: s.x + s.w - rail.x });
      if (gapEnd >= 0 && gapEnd <= SLOT_GAP) return Object.assign({}, s, { w: rail.x + rail.w - s.x });
      return s;
    });
    const settle = (out, rail) => {
      const B = rail.y + rail.h, beside = out.filter((s) => s !== rail && !OWN_SLOTS.includes(s.kind) && s.y < B && s.y + s.h > B
        && ((s.x - (rail.x + rail.w) >= 0 && s.x - (rail.x + rail.w) <= SLOT_GAP) || (rail.x - (s.x + s.w) >= 0 && rail.x - (s.x + s.w) <= SLOT_GAP)));
      const cut = beside.length ? Math.min(...beside.map((s) => s.y + s.h)) - B : 0;
      // (0.3.1 FX2, the laptop's C23: "the bar chart draws below its panel, over the table's first rows") the slots in
      // the same row as one beside the rail (its top and bottom) end there too: the row stays one line, and the slots
      // moved up under it never go under a chart of that row that kept its height
      const row = beside.length ? out.filter((s) => s !== rail && !beside.includes(s) && !OWN_SLOTS.includes(s.kind) && beside.some((b) => Math.abs(s.y - b.y) <= 1 && Math.abs(s.y + s.h - b.y - b.h) <= 1)) : [];
      const ends = beside.concat(row);
      if (cut > 0 && ends.every((s) => s.y + s.h === B + cut && B - s.y >= REFLOW_KEEP * s.h)) {
        const under = (s) => s.y >= B + cut && s.x < Math.max(...ends.map((q) => q.x + q.w).concat(rail.x + rail.w)) && s.x + s.w > Math.min(...ends.map((q) => q.x).concat(rail.x));
        out = out.map((s) => (ends.includes(s) ? Object.assign({}, s, { h: B - s.y }) : !OWN_SLOTS.includes(s.kind) && s !== rail && under(s) ? Object.assign({}, s, { y: s.y - cut, h: s.h + cut }) : s));
      } else if (beside.length === 1 && !out.some((q) => q !== beside[0] && q !== rail && !OWN_SLOTS.includes(q.kind) && q.kind !== 'kpi' && q.y < beside[0].y + beside[0].h && q.y + q.h > beside[0].y)) {
        // (only a chart alone in its row: moving one chart of a row would break the row's line)
        // (design round 9, S7 with one or two dropdowns: the chart beside would keep too little of its height) the one
        // chart beside starts under the rail, a row's gap below it, and takes the rail's column: where it keeps its share
        const s0 = beside[0], next = out.filter((q) => q.y >= s0.y + s0.h && q.x < s0.x + s0.w && q.x + q.w > s0.x).map((q) => q.y - (s0.y + s0.h)), g = next.length ? Math.min(...next) : SLOT_GAP / 2;
        const y = B + g, h = s0.y + s0.h - y, x0 = Math.min(s0.x, rail.x), x1 = Math.max(s0.x + s0.w, rail.x + rail.w);
        // (0.3.1 FX2, the laptop's C03: "a large empty band above the chart, left of the rail", a focus page with no KPI
        // cards) a chart that starts at the rail's own top (nothing above it beside the rail) moves only where the room it
        // fills under the rail is at least the band it would leave empty above it; one under a KPI row moves as before
        const band = (y - s0.y) * s0.w, fills = (x1 - x0 - s0.w) * h, atTop = s0.y <= rail.y + 1;
        if (h >= REFLOW_KEEP * s0.h && (!atTop || fills >= band)) out = out.map((s) => (s === s0 ? Object.assign({}, s, { x: x0, y, w: x1 - x0, h }) : s));
      }
      return column(out, rail);
    };
    if (rail) {
      // (0.3.3 FB1; SQ13's S10, open since 12 Oct: beside a rail kept to its dropdowns the cards' row left the charts
      // too little of the rail's height to end at its bottom, so the room under the rail stayed empty, 312 x 308 on the
      // executive page, or the one chart was pressed to 168 of 347) the same page with the cards' row across the whole
      // width and the rail under it, beside the charts, is settled too, and kept where pageFill measures it better: a
      // smaller hole, or the same hole and a higher lowest chart. Nothing else changes: the same slots, the rail still
      // kept to its contents on the side the person chose, every chart still keeping REFLOW_KEEP of its height.
      const a = settle(out, rail), up = liftCards(out, rail), b = up ? settle(up.slots, up.rail) : null;
      const fa = pageFill(a), fb = b ? pageFill(b) : null;
      const better = (fp, fq) => fq.holeArea < fp.holeArea - 1 || (fq.holeArea <= fp.holeArea + 1 && fq.low > fp.low);
      const settled = fb && better(fa, fb) ? b : a;
      // (0.3.3 FB3) each of the two with its text box under the rail (tuckText), a tucked page not reflowed again (its
      // row keeps its height): kept only where pageFill measures a smaller hole than the settled page's; of the two
      // tucked pages the cards' row over the rail (the owner's D-1111-01) unless the other measures better
      const ta0 = tuckText(out, rail), ta = ta0 && column(ta0, rail), tb0 = up && tuckText(up.slots, up.rail), tb = tb0 && column(tb0, up.rail);
      const tucked = ta && tb ? (better(pageFill(tb), pageFill(ta)) ? ta : tb) : tb || ta;
      out = tucked && pageFill(tucked).holeArea < pageFill(settled).holeArea - 1 ? tucked : settled;
    }
    // (0.3.3 FB4, FB3's "Seen" 3: a bar chart 312 high after the reflow still carried the count of 440) a category chart's
    // Top N follows the size it ends with: the one place that works it out is categoryFit, on the 720 grid it was measured
    // on (topScale: the units of the slots per grid unit; without it the slots are not in a known unit and keep theirs)
    const ts = +o.topScale;
    if (ts > 0) out = out.map((s) => { if (s.topN == null) return s; const n = categoryFit(s.kind, Math.round(s.w / ts), Math.round(s.h / ts)); return n && n !== s.topN ? Object.assign({}, s, { topN: n }) : s; });
    return { slots: out, dropped };
  }
  // fitSlots' options in other units (k: the units wanted per unit given; the background's 720 grid from page units is
  // 1 / page(c).s): the lengths scaled, the kinds and the count kept
  const fitScale = (opt, k) => { const o = opt || {}, R = o.railItems;
    return Object.assign({}, o, { headerRows: (+o.headerRows || 0) * k }, o.topScale ? { topScale: o.topScale * k } : {}, R ? { railItems: Object.assign({}, R, { minH: R.minH * k, maxH: R.maxH * k, resetH: R.resetH * k, pad: R.pad * k, gap: R.gap * k }) } : {}); };

  // The report's pages for a layout: this page, the second page when asked, each with the slide-in panel when asked.
  // opts: { second, panel, logoRatio (an attached logo's width / height, see computeSlots), tableFields (see
  // computeSlots), noTime (the model has no time axis: the layout made for it, see noTimeOf), maxKpis (the most KPI cards
  // the report can fill, its measures: every page has at most that many) }.
  // A small page (SMALL_PAGE) has its own layout and no second page.
  // Each page: { layout (for its background), name, page { w, h }, slots, panel }
  const projectPages = (given, lang, opts) => {
    const nm = (x) => label(x, lang), o = opts || {}, c = fitLayout(given);
    const specs = [{ c, name: nm(LAYOUTS[c.preset].name) }].concat(o.second && !isSmall(c) ? [{ c: secondLayout(c), name: nm(c.preset === 'analysis' ? T('Overview', 'نظرة عامة') : T('Details', 'التفاصيل')) }] : []);
    const cap = (l) => (o.maxKpis != null && +o.maxKpis >= 0 && +o.maxKpis < +l.kpis ? Object.assign({}, l, { kpis: Math.floor(+o.maxKpis) }) : l);
    return specs.map((sp) => {
      const c1 = o.noTime ? Object.assign({}, cap(sp.c), { noTime: true }) : cap(sp.c);   // (D16: the page's layout carries it, so its background is drawn the same)
      const sl = o.panel ? slidePanel(c1, lang) : null, layout = sl ? sl.layout : c1, p = page(layout);
      return { layout, name: sp.name, page: { w: p.w, h: p.h }, slots: projectSlots(layout, lang, { logoRatio: o.logoRatio, tableFields: o.tableFields }), panel: sl ? sl.panel : null };
    });
  };

  const api = {
    M, G, HH, PAGES, DEFAULT_PAGE, LIM, within, fitCustom, page, pw, toPage, boxOf, T, baseLang, label, LAYOUTS, RTL_LANGS, rtl, SMALL_PAGE, smallPage, isSmall, fitLayout, TABLE_NEED, tableWeight, RANGE, rangeOf, clampTo, CATEGORY_KINDS, CATEGORY_FIT, categoryFit, noTimeOf, LAYOUT_PREVIEW, isPreview, hasMain, hasSplit, sizes, computeSlots, imageSize, pngSize,
    FHD_TEXT, textScale, sizeAt, fs, TEXT_BASES, themeScaleOf, scaleTheme, barW, c0, kpiInset, projectSlots, secondLayout, slidePanel, absorb, SLOT_GAP, REFLOW_KEEP, fitSlots, fitScale, projectPages, pageFill
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAMetrics = api;
})(typeof self !== 'undefined' ? self : this);
