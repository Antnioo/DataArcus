/*! DataArcus page preview | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// A picture of a planned report page (0.3.0 step 1, "Preview before Approve", the owner's go of 18 Oct 2026): the MCP's
// approval window shows it above Approve, and the lab page shows it for its download. One renderer for both. Browser and
// Node (module.exports / window.DAPagePreview).
// The privacy promise: the picture is drawn from the PLAN only (visual types, positions, sizes, titles, field names,
// theme colours). It never shows a data value and never makes one up: each visual gets a grey placeholder shape (bars,
// a line, a ring, rows), with no text and no number in it, and the page is labelled "preview".
// A page: { name, w, h, rtl, colors: { background, card, ink, accent }, visuals: [{ type (Power BI's visualType),
// x, y, w, h (page units, as the page places them: a right-to-left page is already mirrored), z, title }] }.
(function (root) {
  'use strict';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // (control and format characters out of a name: they could reorder what the picture shows)
  const clean = (s) => String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩﻿]/g, '').trim();
  const n = (v) => String(Math.round((+v || 0) * 10) / 10);
  const hex = (c, d) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c) : d);

  // Power BI's visual types, by the shape the preview draws for them
  const KIND = [
    [/^(barChart|clusteredBarChart|stackedBarChart|hundredPercentStackedBarChart)$/, 'bar'],
    [/^(columnChart|clusteredColumnChart|stackedColumnChart|hundredPercentStackedColumnChart|waterfallChart|ribbonChart)$/, 'column'],
    [/^(lineChart|areaChart|stackedAreaChart|hundredPercentStackedAreaChart|lineClusteredColumnComboChart|lineStackedColumnComboChart)$/, 'line'],
    [/^(donutChart|pieChart)$/, 'donut'],
    [/^(card|cardVisual|multiRowCard|kpi)$/, 'card'],
    [/^(tableEx|pivotTable)$/, 'table'],
    [/^(slicer|advancedSlicerVisual|listSlicer|textSlicer)$/, 'slicer'],
    [/^textbox$/, 'text'],
    [/^image$/, 'image'],
    [/^(actionButton|pageNavigator|bookmarkNavigator)$/, 'button'],
    [/^(shape|basicShape)$/, 'shape'],
    [/^(map|filledMap|azureMap|shapeMap)$/, 'map'],
    [/^(gauge|treemap|funnel|scatterChart|decompositionTreeVisual|keyDriversVisual)$/, 'chart']
  ];
  const kindOf = (v) => (v && v.panel ? 'panel' : (KIND.find(([re]) => re.test(String(v && v.type || ''))) || [0, 'other'])[1]);
  const DATA = new Set(['bar', 'column', 'line', 'donut', 'card', 'table', 'slicer', 'map', 'chart']);
  const CHARTS = new Set(['bar', 'column', 'line', 'donut', 'table', 'map', 'chart']);

  // The layout check's own geometric flags. The numbers: OVERLAP and COVER as the MCP's design lint has them
  // (mcp/lib/design-lint.mjs, chosen, not measured); the smallest sizes are CHOSEN, NOT MEASURED: below them a chart, a card
  // or a slicer is worth a look (on the 720 grid; scaled with the page's height)
  const LIMITS = {
    PAGE_SLACK: { value: 1, source: 'chosen: a box this far past the page edge is still on the page (rounding), as the design lint' },
    OVERLAP_SHARE: { value: 0.1, source: 'chosen, not measured: an overlap above this share of the smaller visual, as the design lint' },
    COVER_NEAR: { value: 3, source: 'chosen, not measured: a card within this of another visual\'s box lies over it on purpose (a "no data" message), as the design lint' },
    MIN_CHART: { value: [140, 100], source: 'chosen, not measured: a chart or table narrower or lower than this (720 grid) is too small to read' },
    MIN_CARD: { value: [70, 40], source: 'chosen, not measured: a card smaller than this (720 grid)' },
    MIN_SLICER: { value: [70, 28], source: 'chosen, not measured: a slicer smaller than this (720 grid)' }
  };
  // J12 (19 Oct 2026, the laptop's comparison with Desktop's PDF export of the same written reports): what Desktop draws
  // that the picture must show too. The title's line height was measured there (~36 a line at 18pt = 24); the slant rule
  // is the laptop's rough one; the room for a title and a table's columns are the report writer's own (pbip-page.js) and
  // the Arabic twin's (rc.24, fitHeaders), on the 1080 grid, scaled with the page's height
  Object.assign(LIMITS, {
    TITLE_LINE: { value: 1.5, source: 'measured (the laptop, Desktop\'s PDF export, 19 Oct): a title line takes about 36 at 18pt (24), 1.5 x its size' },
    TITLE_SIDE: { value: 16, source: 'the report writer\'s room for a chart\'s title: the box less 16 a side (1080 grid)' },
    TITLE_TOP: { value: 10, source: 'chosen, not measured: the room above a title where the visual sets none (1080 grid)' },
    TABLE_COLUMN: { value: 24, source: 'the Arabic twin\'s header room (rc.24 fitHeaders): a column needs its header\'s width (bold) and 24 (1080 grid)' },
    TABLE_SIDE: { value: 36, source: 'the Arabic twin\'s (rc.24 fitHeaders): a table\'s columns have its width less 36 (1080 grid)' },
    SLANT: { value: [40, 8.5, 15], source: 'the laptop\'s rough rule (Desktop 2.158, 19 Oct): category labels slant when the room a category has is under 40 + 8.5 a letter, at 15pt (scaled with the label size)' },
    // a category's labels, where their count and longest length are known from the column's name: months, quarters and
    // weekdays; a full name is never taken as shorter than "September" / "Wednesday" (9), a quarter as "Quarter 1" (9)
    LABELS: { value: { month: [12, 3, 9, 2], quarter: [4, 2, 9, 1], weekday: [7, 3, 9, 1] }, source: 'known lengths: [count, short name, full name, number]; anything else is unknown (never assumed to fit)' }
  });
  const V = (k) => LIMITS[k].value;
  // the report writer's own text measure (text-measure.js: the browser loads it before the writer, so before a preview of
  // its download); without it, an estimate on the wide side
  const measure = () => (typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure);
  const tw = (s, pt, bold, font) => { const M = measure(); return M && M.textWidth ? M.textWidth(s, pt, bold, font) : String(s).length * pt * 4 / 3 * 0.62 * (bold ? 1.09 : 1); };
  // D5 (19 Oct 2026, the laptop's proof of rc.2: «مقطوع» on titles Desktop drew whole): what is cut is said by the
  // measures the writer and check_report use, never by one of the preview's own: the writer's titleFit and wrapLines
  // (pbip-sizing.js; the browser loads it with the writer) and check_report's table header measure (report-rules.js
  // headerNeed, TABLE_HEADER_CUT's). Without them nothing is called cut (the preview never guesses a cut).
  const node = typeof module !== 'undefined' && module.exports;
  const shared = (load, name) => { try { return node ? load() : root[name]; } catch (e) { return null; } };   // load: a literal require, so packaging can name the file
  const fitters = new Map();
  const sizing = (font) => { const f = String(font || 'Segoe UI'); if (!fitters.has(f)) { const Z = shared(() => require('./pbip-sizing.js'), 'DAPbipSizing'); fitters.set(f, Z && Z.make ? Z.make({ font: f, LABEL: 10 }) : null); } return fitters.get(f); };
  const rules = () => shared(() => require('./report-rules.js'), 'DARules');
  // the room the writer fits a chart's or table's title to: the box less 16 a side on the 1080 grid (pbip-page.js)
  const titleRoom = (w, kk) => w - 2 * Math.round(16 * kk);
  // the writer's verdict on a title: { mode: 'one' | 'wrapped' | 'shortened' }, or null without the writer's sizes
  const titleVerdict = (text, pt, room, font) => { const Z = sizing(font); return Z ? Z.titleFit(text, pt, room) : null; };
  // a title the writer shortened: it wrote the shortened text, with its "…" (and a right-to-left mark after Arabic)
  const shortened = (shown, full) => /…\u200F?$/.test(String(shown || '')) && full != null && String(full) !== String(shown);
  // words split into lines that fit the room (as the writer's wrapLines: a word longer than the room keeps its own line)
  const wrap = (text, pt, room, bold, font) => { const Z = bold !== false ? sizing(font) : null; if (Z && Z.wrapLines) return Z.wrapLines(text, pt, room); const out = []; let cur = ''; String(text).split(/\s+/).filter(Boolean).forEach((w) => { const t = cur ? cur + ' ' + w : w; if (!cur || tw(t, pt, bold, font) <= room) cur = t; else { out.push(cur); cur = w; } }); if (cur) out.push(cur); return out; };
  // the known labels of a category, from its column's name: { what, count, len } or null (unknown)
  function labelsOf(name) {
    const s = String(name == null ? '' : name).toLowerCase(), L = V('LABELS');
    if (!s || /\b(year|yr|fy)\b|\d{4}|سنة|عام/.test(s)) return null;   // (with the year: the count is the data's)
    const what = /\bmonths?\b|\bmon\b|شهر/.test(s) ? 'month' : /\bquarters?\b|\bqtr\b|ربع/.test(s) ? 'quarter' : /\bweek\s*days?\b|\bday\s*(of\s*(the\s*)?week|name)\b|\bdow\b|يوم/.test(s) ? 'weekday' : null;
    if (!what) return null;
    const [count, short, full, num] = L[what], len = /\b(number|num|no|index)\b|رقم/.test(s) ? num : /\b(short|abbr|abbrev|abbreviation|mmm|ddd)\b|^(mon|qtr|dow)$|مختصر/.test(s) ? short : full;
    return /\b(key|sort|id)\b/.test(s) ? null : { what, count, len };
  }

  /** The flags of a page's layout: [{ i (the visual's index), kind: 'cut' | 'overlap' | 'small', other?, why? }]. */
  function check(page) {
    const W = +page.w || 0, H = +page.h || 0, s = H ? H / 720 : 1, kk = H ? H / 1080 : 1, out = [], vs = page.visuals || [];
    const add = (i, kind, other, why) => { if (!out.some((f) => f.i === i && f.kind === kind)) out.push(Object.assign({ i, kind }, other == null ? {} : { other }, why ? { why } : {})); };
    vs.forEach((v, i) => {
      const k = kindOf(v), sl = V('PAGE_SLACK');
      if (k !== 'panel' && W && H && (v.x < -sl || v.y < -sl || v.x + v.w > W + sl || v.y + v.h > H + sl)) add(i, 'cut', null, 'off the page');
      const min = CHARTS.has(k) ? V('MIN_CHART') : k === 'card' ? V('MIN_CARD') : k === 'slicer' ? V('MIN_SLICER') : null;
      if (min && (v.w < min[0] * s || v.h < min[1] * s)) add(i, 'small');
      // D5: a title is cut when the writer shortened it, or when the writer's titleFit can't hold it on two lines (a
      // title the writer did not fit); a slicer's header when the writer shortened it
      if (v.titleCut || v.headerCut) add(i, 'cut', null, v.titleCut ? 'title shortened by the writer' : 'slicer header shortened by the writer');
      else if (CHARTS.has(k) && clean(v.title)) {
        const f = titleVerdict(clean(v.title), +v.titleSize || 12, titleRoom(+v.w || 0, kk), v.font);
        if (f && f.mode === 'shortened') add(i, 'cut', null, 'title: the writer\'s measure fits it on no two lines');
      }
      // D5: a table's column is cut by check_report's own measure (TABLE_HEADER_CUT: a column with a set width, its
      // header on one line; "may be cut" is check_report's note, not a cut); a wrapping header is not judged, as there
      const Rr = rules();
      if (k === 'table' && Array.isArray(v.columns) && !v.headerWrap && Rr && Rr.headerNeed) {
        const cut = v.columns.filter((c) => +c.width > 1 && +c.width + 0.5 < Rr.headerNeed(String(c.name || ''), +v.headerSize || 10, v.headerFont || v.font || 'Segoe UI', kk).lowW);
        if (cut.length) add(i, 'cut', null, `table columns: ${cut.length} header${cut.length === 1 ? '' : 's'} wider than ${cut.length === 1 ? 'its column' : 'their columns'} (check_report's measure)`);
      }
    });
    const data = vs.map((v, i) => ({ v, i, k: kindOf(v) })).filter((x) => DATA.has(x.k));
    const near = (a, b) => Math.abs(a - b) <= V('COVER_NEAR');
    for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) {
      const A = data[a].v, B = data[b].v;
      const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
      if (ox <= 2 || oy <= 2) continue;
      // (a card on another visual at the same place is a "no data" message, or a table's panel: meant, not an overlap)
      if ((data[a].k === 'card' || data[b].k === 'card') && near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w)) continue;
      if (ox * oy / Math.max(1, Math.min(A.w * A.h, B.w * B.h)) > V('OVERLAP_SHARE')) { add(data[a].i, 'overlap', data[b].i); add(data[b].i, 'overlap', data[a].i); }
    }
    return out;
  }

  /** What the picture can't tell (J12): [{ i, kind: 'labels' }], a column or line chart whose category's labels have no
   *  known length (their count and length are the data's): said, never a flag and never assumed to fit. */
  // D5: labels that may slant (J12's rough rule, kept as a note: slanted labels are not cut, and check_report has no such
  // finding), [{ i, kind: 'slant', why }]
  function notes(page) {
    const kk = +page.h ? +page.h / 1080 : 1, out = [];
    (page.visuals || []).forEach((v, i) => {
      const k = kindOf(v); if (!((k === 'column' || k === 'line') && v.category)) return;
      const L = labelsOf(v.category);
      if (!L) { out.push({ i, kind: 'labels' }); return; }
      const [b0, per, at] = V('SLANT'), room = v.w / L.count, need = (b0 + per * L.len) * (+v.labelSize || 9) / at;
      if (room < need) out.push({ i, kind: 'slant', why: `labels may slant: ${Math.round(room)} a ${L.what}, ${Math.round(need)} needed` });
    });
    return out;
  }

  const WORDS = {
    en: { preview: 'preview', cut: 'cut off', overlap: 'overlap', small: 'too small', page: 'Preview of the page', visuals: 'visuals', flags: 'to check', labels: 'label length unknown', slant: 'labels may slant' },
    ar: { preview: 'معاينة', cut: 'مقطوع', overlap: 'تداخل', small: 'صغير جدًا', page: 'معاينة الصفحة', visuals: 'عناصر', flags: 'للمراجعة', labels: 'طول التسميات غير معروف', slant: 'قد تميل التسميات' }
  };
  const GREY = '#A3ACBB', WARN = '#B7791F';

  // a placeholder shape inside a box (local 0..1 coordinates mapped to the box; mirrored right to left): never text
  // (L1) the cubic segments of a monotone curve through points [x, y] (x increasing): Fritsch-Carlson's tangents, as d3's
  // monotoneX that Power BI's 'monotoneX' names; each segment [p0, c1, c2, p1], every control point between its two points
  function monotone(pts) {
    const k = pts.length, h = [], sl = [], m = [];
    for (let i = 0; i < k - 1; i++) { h[i] = pts[i + 1][0] - pts[i][0]; sl[i] = h[i] ? (pts[i + 1][1] - pts[i][1]) / h[i] : 0; }
    for (let i = 1; i < k - 1; i++) { const p = (sl[i - 1] * h[i] + sl[i] * h[i - 1]) / (h[i - 1] + h[i]); m[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (Math.sign(sl[i - 1]) + Math.sign(sl[i])) * Math.min(Math.abs(sl[i - 1]), Math.abs(sl[i]), 0.5 * Math.abs(p)); }
    m[0] = k > 2 ? (3 * sl[0] - m[1]) / 2 : sl[0]; m[k - 1] = k > 2 ? (3 * sl[k - 2] - m[k - 2]) / 2 : sl[0];
    return pts.slice(0, -1).map((p0, i) => { const p1 = pts[i + 1], d = h[i] / 3; return [p0, [p0[0] + d, p0[1] + m[i] * d], [p1[0] - d, p1[1] - m[i + 1] * d], p1]; });
  }
  function shape(k, b, rtl, c, u, v) {
    const X = (f) => (rtl ? b.x + b.w * (1 - f) : b.x + b.w * f), Y = (f) => b.y + b.h * f;
    const R = (f0, g0, fw, gh, fill, op) => { const x0 = rtl ? X(f0 + fw) : X(f0); return `<rect x="${n(x0)}" y="${n(Y(g0))}" width="${n(b.w * fw)}" height="${n(b.h * gh)}" rx="${n(Math.min(b.w * fw, b.h * gh, 24 * u) * 0.2)}" fill="${fill || GREY}"${op ? ` opacity="${op}"` : ''}/>`; };
    switch (k) {
      case 'bar': return [0.86, 0.7, 0.56, 0.42, 0.3].map((f, i) => R(0.06, 0.08 + i * 0.18, f * 0.88, 0.11)).join('');
      case 'column': return [0.5, 0.78, 0.6, 0.9, 0.66, 0.8].map((f, i) => R(0.07 + i * 0.145, 0.95 - f * 0.88, 0.1, f * 0.88)).join('');
      case 'line': {
        // (L1) as the file draws it: smooth (monotone, as Power BI's monotoneX: the curve never swings past a point) with a
        // dot on each point, or straight (v.smooth, v.markers: read from the line chart's lineStyles)
        const D = [[0, 0.7], [0.17, 0.52], [0.33, 0.6], [0.5, 0.36], [0.67, 0.45], [0.83, 0.24], [1, 0.32]], P = (f, g) => [X(0.04 + f * 0.92), Y(0.05 + g * 0.85)];
        const sw = Math.max(2, b.h * 0.035), at = (p) => `${n(p[0])},${n(p[1])}`;
        const curve = v && v.smooth ? `<path class="ln" d="${monotone(D).map((sg, i) => (i ? '' : `M${at(P(...sg[0]))}`) + ` C${at(P(...sg[1]))} ${at(P(...sg[2]))} ${at(P(...sg[3]))}`).join('')}" fill="none" stroke="${GREY}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`
          : `<polyline points="${D.map((d) => at(P(...d))).join(' ')}" fill="none" stroke="${GREY}" stroke-width="${n(sw)}" stroke-linejoin="round" stroke-linecap="round"/>`;
        const dots = v && v.markers ? D.map((d) => { const p = P(...d); return `<circle class="mk" cx="${n(p[0])}" cy="${n(p[1])}" r="${n(sw * 1.1)}" fill="${GREY}"/>`; }).join('') : '';
        return `${curve}${dots}<line x1="${n(X(0.04))}" y1="${n(Y(0.96))}" x2="${n(X(0.96))}" y2="${n(Y(0.96))}" stroke="${GREY}" stroke-width="${n(Math.max(1, b.h * 0.008))}" opacity=".6"/>`;
      }
      case 'donut': { const r = Math.min(b.w, b.h) * 0.36; return `<circle cx="${n(b.x + b.w / 2)}" cy="${n(b.y + b.h / 2)}" r="${n(r)}" fill="none" stroke="${GREY}" stroke-width="${n(r * 0.42)}"/>`; }
      case 'card': return R(0.06, 0.25, 0.46, 0.4);
      case 'table': {
        // (L5) a small round marker before each row's value where a status icon goes (its column by its place)
        const ic = v && Array.isArray(v.iconCols) && v.iconOf ? v.iconCols : [], r = Math.max(1.5, Math.min(b.h * 0.03, 6 * u));
        const marks = ic.map((i) => [0.24, 0.42, 0.6, 0.78].map((g) => `<circle data-icon="status" cx="${n(X((i + 0.12) / v.iconOf))}" cy="${n(Y(g + 0.035))}" r="${n(r)}" fill="${c.accent}"/>`).join('')).join('');
        return R(0, 0, 1, 0.13, GREY, '.9') + [0.24, 0.42, 0.6, 0.78].map((g) => R(0, g, 1, 0.07, GREY, '.45')).join('') + marks;
      }
      case 'slicer': {
        // (drop-downs of a fixed height, as many as the box holds, up to 3: a filter panel's slicers)
        const dh = Math.min(b.h, 26 * u), k2 = Math.max(1, Math.min(3, Math.floor(b.h / (dh * 1.6))));
        return Array.from({ length: k2 }, (x, j) => { const y = b.y + j * dh * 1.6, bw = b.w * 0.5, bx = rtl ? b.x + b.w - 6 * u - bw : b.x + 6 * u;
          return `<rect x="${n(b.x)}" y="${n(y)}" width="${n(b.w)}" height="${n(dh)}" rx="${n(4 * u)}" fill="none" stroke="${GREY}" stroke-width="${n(u)}"/><rect x="${n(bx)}" y="${n(y + dh * 0.36)}" width="${n(bw)}" height="${n(dh * 0.28)}" rx="${n(dh * 0.1)}" fill="${GREY}"/>`; }).join('');
      }
      case 'text': return R(0, 0.2, 0.7, 0.22) + R(0, 0.58, 0.45, 0.22);
      case 'image': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="none" stroke="${GREY}" stroke-dasharray="${n(Math.max(3, b.h * 0.08))}"/>`;
      case 'button': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" rx="${n(b.h / 2)}" fill="none" stroke="${GREY}" stroke-width="${n(Math.max(1, b.h * 0.06))}"/>`;
      case 'shape': return `<rect x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="${c.accent}" opacity=".55"/>`;
      case 'map': return `<ellipse cx="${n(b.x + b.w / 2)}" cy="${n(b.y + b.h / 2)}" rx="${n(b.w * 0.34)}" ry="${n(b.h * 0.3)}" fill="${GREY}" opacity=".6"/>`;
      case 'panel': return '';
      default: return R(0.3, 0.3, 0.4, 0.4, GREY, '.5');
    }
  }

  /** The SVG picture of a page. opts: { lang: 'en' | 'ar', width (display width, px; default 800), flags (more flags,
   *  [{ i, kind }], from the layout check; a page's own flags are drawn too) }. Deterministic: the same page and options give the same string. */
  function render(page, opts) {
    const o = opts || {}, lang = o.lang === 'ar' ? 'ar' : 'en', T = WORDS[lang], W = Math.max(1, +page.w || 1280), H = Math.max(1, +page.h || 720), rtl = !!page.rtl;
    const width = Math.max(160, Math.round(+o.width || 800)), height = Math.round(width * H / W), u = W / width;   // u: page units per pixel
    const c = Object.assign({ background: '#F4F6FA', card: '#FFFFFF', ink: '#14213D', accent: '#0F7C90' }, page.colors || {});
    const col = { background: hex(c.background, '#F4F6FA'), card: hex(c.card, '#FFFFFF'), ink: hex(c.ink, '#14213D'), accent: hex(c.accent, '#0F7C90') };
    const fs = 11 * u, pad = 8 * u, vs = page.visuals || [], kk = H / 1080;
    const flags = check(page);
    (page.flags || []).concat(o.flags || []).forEach((f) => { if (f && vs[f.i] && /^(cut|overlap|small)$/.test(f.kind) && !flags.some((g) => g.i === f.i && g.kind === f.kind)) flags.push({ i: f.i, kind: f.kind }); });
    // (one line of a title that may not wrap, shortened with "…" by the writer's measure: a picture, not a measurement)
    const fit = (t, pt, room, bold, f) => { if (tw(t, pt, bold, f) <= room) return t; let k = t.length; while (k > 1 && tw(t.slice(0, k) + '…', pt, bold, f) > room) k--; return t.slice(0, k) + '…'; };
    const order = vs.map((v, i) => i).sort((a, b) => ((+vs[a].z || 0) - (+vs[b].z || 0)) || a - b);
    const font = `font-family="'Segoe UI', Tahoma, Arial, sans-serif"`;
    const anchor = (al) => (al === 'center' ? 'middle' : al === 'right' ? 'end' : 'start');
    const at = (al, b, l, r) => (al === 'center' ? b.x + b.w / 2 : al === 'right' ? b.x + b.w - r : b.x + l);
    const side = (al) => (/^(left|right|center)$/.test(String(al || '')) ? al : rtl ? 'right' : 'left');
    // (J12: the writer's thin bar under a page button is Desktop's underline of the current page)
    const barUnder = (v) => vs.some((q) => kindOf(q) === 'shape' && +q.h <= 6 && q.y >= v.y + v.h - 4 && q.y <= v.y + v.h + 12 && q.x < v.x + v.w && q.x + q.w > v.x);
    const body = order.map((i) => {
      const v = vs[i], k = kindOf(v), b = { x: +v.x || 0, y: +v.y || 0, w: Math.max(0, +v.w || 0), h: Math.max(0, +v.h || 0) };
      const title = clean(v.title), boxed = !/^(text|image|button|shape)$/.test(k);
      const panel = boxed ? `<rect class="box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" rx="${n(6 * u)}" fill="${col.card}" stroke="${GREY}" stroke-opacity=".35" stroke-width="${n(u)}"/>`
        : `<rect class="box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="none"/>`;
      const end = '</g><!--/v-->';
      if (k === 'panel') return `<g class="v" data-i="${i}" data-kind="panel">${panel}${end}`;
      // a text box (the report's title) and a button (a page's name): their own text at their own size, never a value
      if (k === 'text' || k === 'button') {
        const raw = clean(k === 'button' ? (v.text != null ? v.text : v.title) : v.title), pt = +(k === 'button' ? v.textSize : v.textSize) || 12, px = pt * 4 / 3, bold = !!v.textBold;
        const al = k === 'button' ? (/^(left|right|center)$/.test(String(v.textAlign || '')) ? v.textAlign : 'center') : side(v.textAlign);
        const sp = k === 'button' ? (v.nav ? 4 * kk : b.h * 0.4) : 0, room = Math.max(1, b.w - 2 * sp), shown = raw ? fit(raw, pt, room, bold, v.font) : '';
        // (a text box is top-aligned: its text's middle about 1.2 x pt below its top, measured in round 1; a button's middle)
        const mid = k === 'text' ? b.y + 1.2 * pt : b.y + b.h / 2, x = at(al, b, sp, sp), y = mid + px * 0.35;
        const t = shown ? `<text class="t" x="${n(x)}" y="${n(y)}" ${font} font-size="${n(px)}" font-weight="${bold ? 'bold' : 'normal'}" fill="${col.ink}" text-anchor="${anchor(al)}">${esc(shown)}</text>` : '';
        let line = '';
        const cur = !!(v.current || (k === 'button' && v.nav && page.id && v.nav === page.id));
        if (k === 'button' && cur && shown && !barUnder(v)) {
          const lw = Math.min(room, tw(shown, pt, bold, v.font)), x0 = al === 'center' ? x - lw / 2 : al === 'right' ? x - lw : x;
          line = `<line class="u" x1="${n(x0)}" y1="${n(y + px * 0.25)}" x2="${n(x0 + lw)}" y2="${n(y + px * 0.25)}" stroke="${col.accent}" stroke-width="${n(Math.max(2 * kk, u))}"/>`;
        }
        const outline = k === 'button' && !v.nav ? shape(k, b, rtl, col, u) : '';
        return `<g class="v" data-i="${i}" data-kind="${k}"${cur ? ' data-current="1"' : ''}>${panel}${outline ? `<g class="ph">${outline}</g>` : ''}${t}${line}${end}`;
      }
      // D5: a slicer's header (its own text, or the field's name; off when the file says so), on one line above its
      // dropdown box, at its own size: Desktop draws it, the slicer's title stays off
      if (k === 'slicer' && v.header != null) {
        const hpt = +v.headerSize || 10, hpx = hpt * 4 / 3, side8 = Math.round(8 * kk), al = side(null), head = clean(v.header);
        const shown = head ? fit(head, hpt, Math.max(1, b.w - 2 * side8), false, v.headerFont || v.font) : '';
        const band = shown ? Math.min(b.h * 0.5, hpx * 1.6) : 0, x = at(al, b, side8 / 2, side8 / 2), y = b.y + 1.2 * hpt + hpx * 0.35;
        const t = shown ? `<text class="t" x="${n(x)}" y="${n(y)}" ${font} font-size="${n(hpx)}" font-weight="normal" fill="${col.ink}" text-anchor="${anchor(al)}">${esc(shown)}</text>` : '';
        const db = { x: b.x, y: b.y + band, w: b.w, h: Math.max(0, b.h - band) }, bw = db.w * 0.5, bx = rtl ? db.x + db.w - 6 * kk - bw : db.x + 6 * kk;
        const box = db.h > 0 ? `<rect x="${n(db.x)}" y="${n(db.y)}" width="${n(db.w)}" height="${n(db.h)}" rx="${n(8 * kk)}" fill="none" stroke="${GREY}" stroke-width="${n(u)}"/><rect x="${n(bx)}" y="${n(db.y + db.h * 0.36)}" width="${n(bw)}" height="${n(db.h * 0.28)}" rx="${n(db.h * 0.1)}" fill="${GREY}"/>` : '';
        return `<g class="v" data-i="${i}" data-kind="${k}"><rect class="box" x="${n(b.x)}" y="${n(b.y)}" width="${n(b.w)}" height="${n(b.h)}" fill="none"/>${box ? `<g class="ph">${box}</g>` : ''}${t}${end}`;
      }
      // the title: at the visual's own size (pt; the theme's where the visual sets none), wrapped at the box's inner width
      // by the writer's measure (bold, as the writer measures it), on as many lines as the box holds
      const pt = +v.titleSize || 12, px = pt * 4 / 3, lh = px * V('TITLE_LINE'), bold = v.titleBold !== false;
      const pd = v.pad || {}, pl = pd.left != null ? +pd.left : Math.round(V('TITLE_SIDE') * kk), pr = pd.right != null ? +pd.right : Math.round(V('TITLE_SIDE') * kk), pt0 = pd.top != null ? +pd.top : V('TITLE_TOP') * kk;
      const room = Math.max(1, b.w - pl - pr), fits = Math.max(0, Math.floor((b.h - pt0) / lh));
      let lines = title && fits && b.w >= px * 2 ? (v.titleWrap === false ? [fit(title, pt, room, bold, v.font)] : wrap(title, pt, room, bold, v.font)) : [];
      if (lines.length > fits) lines = lines.slice(0, fits).map((l, j, all) => (j === all.length - 1 ? fit(l + '…', pt, room, bold, v.font) : l));
      const al = side(v.titleAlign), tx = at(al, b, pl, pr), head = pt0 + lines.length * lh;
      const t = lines.map((l, j) => `<text class="t" x="${n(tx)}" y="${n(b.y + pt0 + j * lh + (lh + px * 0.7) / 2)}" ${font} font-size="${n(px)}" font-weight="600" fill="${col.ink}" text-anchor="${anchor(al)}">${esc(l)}</text>`).join('');
      // (the placeholder below the title's lines, inside the box's padding: it shrinks by the lines the title takes)
      const ib = { x: b.x + pl, y: b.y + head + (lines.length ? 4 * kk : pad * 0.5), w: Math.max(0, b.w - pl - pr), h: Math.max(0, b.h - head - (lines.length ? 4 * kk : pad * 0.5) - pad) };
      let inner;
      if (k === 'card') {
        // a card's value where its file aligns it (J12: the writer writes 'right' on an Arabic page, as the Arabic twin
        // does from rc.24, PR #55); a page from the slots has none: the reading start
        const va = /^(left|right|center)$/.test(String(v.valueAlign || '')) ? v.valueAlign : rtl ? 'right' : 'left';
        const vh = Math.min(ib.h * 0.8, v.valueSize ? +v.valueSize * 4 / 3 * 0.8 : ib.h * 0.45), vw = ib.w * 0.46;
        const vx = va === 'right' ? ib.x + ib.w - vw : va === 'center' ? ib.x + (ib.w - vw) / 2 : ib.x, vy = ib.y + Math.max(0, (ib.h - vh) * 0.35);
        inner = vh > 0 && vw > 0 ? `<rect class="kv" x="${n(vx)}" y="${n(vy)}" width="${n(vw)}" height="${n(vh)}" rx="${n(Math.min(vw, vh, 24 * u) * 0.2)}" fill="${GREY}"/>` : '';
      } else if (k === 'slicer' && v.pills) {
        // (L2) pills: rounded buttons on one row under the title, the first (at the reading start) in the accent
        const nP = v.pills, gap = 6 * kk, ph = Math.min(ib.h, 30 * kk), pw = Math.max(1, (ib.w - gap * (nP - 1)) / nP);
        inner = Array.from({ length: nP }, (x, j) => { const px0 = rtl ? ib.x + ib.w - pw - j * (pw + gap) : ib.x + j * (pw + gap);
          return `<rect class="pill" x="${n(px0)}" y="${n(ib.y)}" width="${n(pw)}" height="${n(ph)}" rx="${n(ph / 2)}" fill="${j ? 'none' : col.accent}" stroke="${j ? GREY : col.accent}" stroke-width="${n(u)}"/>`; }).join('');
      } else inner = (v.grid === 'dotted' && /^(bar|column|line)$/.test(k) ? [0.25, 0.5, 0.75].map((g) => (k === 'bar'
        ? `<line class="grid" x1="${n(ib.x + ib.w * g)}" y1="${n(ib.y)}" x2="${n(ib.x + ib.w * g)}" y2="${n(ib.y + ib.h)}"`
        : `<line class="grid" x1="${n(ib.x)}" y1="${n(ib.y + ib.h * g)}" x2="${n(ib.x + ib.w)}" y2="${n(ib.y + ib.h * g)}"`) + ` stroke="${GREY}" stroke-width="${n(u)}" stroke-dasharray="${n(u)} ${n(3 * u)}" opacity=".7"/>`).join('') : '')
        + (k === 'image' || k === 'shape' ? shape(k, b, rtl, col, u) : shape(k, ib, rtl, col, u, v));
      return `<g class="v" data-i="${i}" data-kind="${k}">${panel}${inner ? `<g class="ph">${inner}</g>` : ''}${t}${end}`;
    }).join('');
    // the flags: a dashed outline in a calm amber and the flag's word in a small tag at the box's top corner (inside the page)
    const marks = flags.map((f) => {
      const v = vs[f.i], word = T[f.kind], tw = word.length * fs * 0.58 + 2 * pad * 0.7, th = fs * 1.5;
      const bx = Math.min(Math.max(0, +v.x), W - tw), by = Math.min(Math.max(0, +v.y), H - th);
      const x0 = rtl ? bx : Math.min(W - tw, Math.max(0, +v.x + +v.w - tw)), stack = flags.filter((g) => g.i === f.i).indexOf(f) * (th + 2 * u);
      return `<g class="flag" data-i="${f.i}" data-flag="${f.kind}"><rect x="${n(v.x)}" y="${n(v.y)}" width="${n(v.w)}" height="${n(v.h)}" rx="${n(6 * u)}" fill="none" stroke="${WARN}" stroke-width="${n(2 * u)}" stroke-dasharray="${n(6 * u)} ${n(4 * u)}"/>`
        + `<rect x="${n(x0)}" y="${n(by + stack)}" width="${n(tw)}" height="${n(th)}" rx="${n(th / 2)}" fill="#FFF7E6" stroke="${WARN}" stroke-width="${n(u)}"/>`
        + `<text x="${n(x0 + tw / 2)}" y="${n(by + stack + th * 0.7)}" ${font} font-size="${n(fs * 0.9)}" fill="#7A4E00" text-anchor="middle">${esc(word)}</text></g>`;
    }).join('');
    // the notes (J12): what can't be told from the plan, in a quiet grey tag at the box's bottom corner (not a flag)
    const said = notes(page).map((f) => {
      const v = vs[f.i], word = T[f.kind], tw2 = word.length * fs * 0.52 + 2 * pad * 0.7, th = fs * 1.4;
      const x0 = rtl ? Math.min(W - tw2, Math.max(0, +v.x + 4 * u)) : Math.min(W - tw2, Math.max(0, +v.x + +v.w - tw2 - 4 * u)), y0 = Math.min(H - th, Math.max(0, +v.y + +v.h - th - 4 * u));
      return `<g class="note" data-i="${f.i}" data-note="${f.kind}"><rect x="${n(x0)}" y="${n(y0)}" width="${n(tw2)}" height="${n(th)}" rx="${n(th / 2)}" fill="#F1F3F6" stroke="${GREY}" stroke-width="${n(u)}"/>`
        + `<text x="${n(x0 + tw2 / 2)}" y="${n(y0 + th * 0.7)}" ${font} font-size="${n(fs * 0.85)}" fill="#5B6472" text-anchor="middle">${esc(word)}</text></g>`;
    }).join('');
    const tag = `<text class="pv" x="${n(rtl ? 6 * u : W - 6 * u)}" y="${n(H - 6 * u)}" ${font} font-size="${n(fs)}" fill="${GREY}" text-anchor="${rtl ? 'start' : 'end'}" font-style="italic">${esc(T.preview)}</text>`;
    const label = `${T.page} ${clean(page.name)}: ${vs.filter((v) => kindOf(v) !== 'panel').length} ${T.visuals}${flags.length ? `, ${flags.length} ${T.flags}` : ''}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(W)} ${n(H)}" width="${width}" height="${height}" role="img" aria-label="${esc(label)}">`
      + `<rect class="page" x="0" y="0" width="${n(W)}" height="${n(H)}" fill="${col.background}" stroke="${GREY}" stroke-opacity=".5" stroke-width="${n(u)}"/>${body}${marks}${said}${tag}</svg>`;
  }

  // ---- the pages, from what the report writer writes or from the design engine's slots ----
  const txt = (d) => (typeof d === 'string' ? d : new TextDecoder().decode(d));
  const lit = (p) => { const v = p && p.expr && p.expr.Literal && p.expr.Literal.Value; return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  // a visual's title as Desktop shows it: its text, or what the report measure a Top N title is made by shows when every
  // category shows (D5: the measure's NAME is made unique, "Title: X (2)"; its DAX returns "X": the writer's
  // IF ( _s = _n, "<title>", ... )); a measure we can't read keeps the name's title
  const shownBy = (expr) => { const m = /\bIF \( _s = _n, "((?:[^"]|"")*)"/.exec(String(expr || '')); return m ? m[1].replace(/""/g, '"') : null; };
  const titleOf = (j, ext) => {
    const t = ((((j.visual || {}).visualContainerObjects || {}).title) || []).find((e) => e && !e.selector && e.properties) || {}, p = t.properties || {};
    if (p.show && p.show.expr && p.show.expr.Literal && String(p.show.expr.Literal.Value) === 'false') return '';
    const l = lit(p.text); if (l != null) return l;
    const m = p.text && p.text.expr && p.text.expr.Measure; if (!(m && /^Title: /.test(String(m.Property || '')))) return '';
    const by = ext && ext.get(String(m.Property)); return by != null ? by : String(m.Property).slice(7);
  };
  const textOf = (j) => ((((j.visual || {}).objects || {}).general || [])[0] || { properties: {} }).properties.paragraphs ? j.visual.objects.general[0].properties.paragraphs.map((p) => (p.textRuns || []).map((r) => String(r.value || '')).join('')).join(' ') : '';
  // J12: what Desktop draws from a visual's own settings (else the theme's): its title's size, font, weight, side, wrap and
  // padding; a text box's and a button's text and size; a card's value side; a table's columns and header size; a
  // chart's category and label size. Settings only, never a value.
  const litOf = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const numOf = (p) => { const v = litOf(p); const x = parseFloat(String(v == null ? '' : v).replace(/[DLM]$/, '')); return Number.isFinite(x) ? x : null; };
  const strOf = (p) => { const v = litOf(p); return typeof v === 'string' && /^'.*'$/s.test(v) ? v.slice(1, -1).replace(/''/g, "'") : null; };
  const boolOf = (p) => { const v = litOf(p); return v === 'true' || v === true ? true : v === 'false' || v === false ? false : null; };
  // the properties of a card's entries with no selector (or the default one), merged
  const props = (list, def) => (Array.isArray(list) ? list : []).filter((e) => e && e.properties && (!e.selector || (def && e.selector.id === 'default'))).reduce((a, e) => Object.assign(a, e.properties), {});
  const th1 = (theme, type, card, key) => { const vs = (theme && theme.visualStyles) || {}, f = (t) => (((vs[t] || {})['*'] || {})[card] || [])[0]; const e = f(type) || f('*'); return e && e[key] != null ? e[key] : null; };
  const nameOfProj = (x) => String(x.displayName != null ? x.displayName : x.nativeQueryRef != null ? x.nativeQueryRef : (((x.field || {}).Column || (x.field || {}).Measure || {}).Property) || '');
  const altOf = (j) => strOf(props(((j.visual || {}).visualContainerObjects || {}).general).altText);
  function settingsOf(j, type, theme, pageId) {
    const vis = j.visual || {}, vco = vis.visualContainerObjects || {}, ob = vis.objects || {}, tc = (theme && theme.textClasses) || {}, out = {};
    const tp = props(vco.title), pad = props(vco.padding);
    out.titleSize = numOf(tp.fontSize) || +th1(theme, type, 'title', 'fontSize') || +(tc.title || {}).fontSize || 12;
    out.font = strOf(tp.fontFamily) || (tc.title || {}).fontFace || 'Segoe UI';
    if (boolOf(tp.bold) === false) out.titleBold = false;
    if (boolOf(tp.titleWrap) != null) out.titleWrap = boolOf(tp.titleWrap);
    if (strOf(tp.alignment)) out.titleAlign = strOf(tp.alignment);
    if (['left', 'right', 'top'].some((k) => numOf(pad[k]) != null)) out.pad = { left: numOf(pad.left), right: numOf(pad.right), top: numOf(pad.top) };
    if (out.pad) Object.keys(out.pad).forEach((k) => { if (out.pad[k] == null) delete out.pad[k]; });
    if (type === 'textbox') {
      const para = ((((ob.general || [])[0] || {}).properties || {}).paragraphs || [])[0] || {}, run = (para.textRuns || []).find((r) => r && String(r.value || '').trim()) || {}, st = run.textStyle || {};
      const sz = parseFloat(String(st.fontSize || '')); if (Number.isFinite(sz)) out.textSize = sz;
      if (/bold|^[6-9]00$/.test(String(st.fontWeight || ''))) out.textBold = true;
      if (para.horizontalTextAlignment) out.textAlign = String(para.horizontalTextAlignment);
      if (st.fontFamily) out.font = String(st.fontFamily);
    }
    if (type === 'actionButton') {
      const t = props(ob.text, true), link = props(vco.visualLink);
      if (strOf(t.text) != null) out.text = strOf(t.text);
      out.textSize = numOf(t.fontSize) || 12; if (boolOf(t.bold)) out.textBold = true; if (strOf(t.horizontalAlignment)) out.textAlign = strOf(t.horizontalAlignment);
      if (strOf(t.fontFamily)) out.font = strOf(t.fontFamily);
      if (strOf(link.type) === 'PageNavigation' && strOf(link.navigationSection)) { out.nav = strOf(link.navigationSection); if (out.nav === pageId) out.current = true; }
    }
    if (/^(card|cardVisual)$/.test(type)) { const vp = props(ob.value, true); out.valueAlign = strOf(vp.horizontalAlignment) || 'center'; if (numOf(vp.fontSize)) out.valueSize = numOf(vp.fontSize); }
    const qs = (vis.query || {}).queryState || {};
    if (type === 'tableEx') {
      const hp = props(ob.columnHeaders), cw = Array.isArray(ob.columnWidth) ? ob.columnWidth : [];
      out.columns = (((qs.Values || {}).projections) || []).filter((x) => x && x.field).map((x) => { const e = cw.find((y) => y && y.selector && y.selector.metadata === x.queryRef); return Object.assign({ name: nameOfProj(x) }, e ? { width: numOf((e.properties || {}).value) } : {}); });
      out.headerSize = numOf(hp.fontSize) || +th1(theme, 'tableEx', 'columnHeaders', 'fontSize') || +th1(theme, 'tableEx', 'values', 'fontSize') || 10;
      out.headerFont = strOf(hp.fontFamily) || (tc.label || {}).fontFace || out.font;
      if (boolOf(hp.wordWrap) === true) out.headerWrap = true;
    }
    // (0.3.0 L5) the value columns that carry a status icon (conditional formatting with an icon), by their place
    if (type === 'tableEx' || type === 'pivotTable') {
      const vp = (((qs.Values || {}).projections) || []).filter((x) => x && x.field), ic = (Array.isArray(ob.values) ? ob.values : []).filter((e) => e && e.selector && e.properties && e.properties.icon).map((e) => e.selector.metadata);
      if (ic.length) { out.iconCols = vp.map((x, i) => (ic.includes(x.queryRef) ? i : -1)).filter((i) => i >= 0); out.iconOf = vp.length; }
    }
    // D5: a slicer's header (Desktop draws it; its title is off): its text, else the field's display name, its size
    if (type === 'slicer') {
      const hp = props(ob.header), first = (((qs.Values || {}).projections) || []).find((x) => x && x.field);
      if (boolOf(hp.show) !== false) {
        const full = first ? nameOfProj(first) : '', own = strOf(hp.text);
        out.header = own != null ? own : full;
        out.headerSize = numOf(hp.textSize) || +th1(theme, 'slicer', 'header', 'textSize') || 10;
        if (strOf(hp.fontFamily)) out.headerFont = strOf(hp.fontFamily);
        if (own != null && shortened(own, altOf(j) || full)) out.headerCut = true;
      } else out.header = '';
    }
    // (0.3.0 L2) the button slicer's buttons (its one row's columns, else 3) and a chart's dotted or hidden gridlines
    if (type === 'advancedSlicerVisual') out.pills = Math.max(1, Math.min(8, numOf(props(ob.layout).columnCount) || 3));
    { const va = props(ob.valueAxis); if (boolOf(va.gridlineShow) === false) out.grid = 'none'; else if (strOf(va.gridlineStyle) === 'dotted') out.grid = 'dotted'; }
    // (L1) a line's look as written: smooth, and a dot on each point (lineStyles, the entry with no selector)
    if (/^(lineChart|areaChart|stackedAreaChart|lineClusteredColumnComboChart|lineStackedColumnComboChart)$/.test(type)) { const st = props(ob.lineStyles); if (strOf(st.lineChartType) === 'smooth') out.smooth = true; if (boolOf(st.showMarker) === true) out.markers = true; }
    if (/^(columnChart|clusteredColumnChart|stackedColumnChart|hundredPercentStackedColumnChart|lineChart|areaChart|stackedAreaChart|lineClusteredColumnComboChart|lineStackedColumnComboChart)$/.test(type)) {
      const c = (((qs.Category || {}).projections) || []).find((x) => x && x.field);
      if (c) { out.category = nameOfProj(c); out.labelSize = numOf(props(ob.categoryAxis).fontSize) || +th1(theme, type, 'categoryAxis', 'fontSize') || +(tc.label || {}).fontSize || 9; }
    }
    return out;
  }
  const hasFields = (j) => Object.values(((j.visual || {}).query || {}).queryState || {}).some((r) => r && Array.isArray(r.projections) && r.projections.length);

  /** The pages a report shows, from the files the report writer gives ([{ path, data }], PBIR): page order, size,
   *  every shown visual at its page position (inside groups too); the tooltip and hidden pages and hidden visuals left
   *  out. A card with no field and no title, or a text box with no text, is a panel (the writer's panel behind a chart,
   *  the header band, the filter rail). The visuals in their drawing
   *  order (z, then place: the writer's names are random, so they never decide it). opts: { rtl, colors }. */
  function fromFiles(files, opts) {
    const o = opts || {}, by = new Map(), res = [];
    (files || []).forEach((f) => { const m = /(?:^|\/)definition\/pages\/(.+)$/.exec(String(f.path || '')); if (m) by.set(m[1], f.data); else if (/(?:^|\/)StaticResources\/RegisteredResources\/[^/]+\.json$/.test(String(f.path || '')) || /(?:^|\/)definition\/(report|reportExtensions)\.json$/.test(String(f.path || ''))) res.push(f); });
    const json = (rel) => { try { return by.has(rel) ? JSON.parse(txt(by.get(rel))) : null; } catch (e) { return null; } };
    const parse = (f) => { try { return JSON.parse(txt(f.data)); } catch (e) { return null; } };
    // the report's theme (the one report.json names, else any registered theme with text classes): its sizes
    const rep = res.find((f) => /definition\/report\.json$/.test(f.path)), rj = rep ? parse(rep) : null;
    // the report's own measures: what a Top N title measure shows (D5)
    const xf = res.find((f) => /definition\/reportExtensions\.json$/.test(f.path)), xj = xf ? parse(xf) : null, ext = new Map();
    ((xj && xj.entities) || []).forEach((e) => ((e && e.measures) || []).forEach((m) => { const t = m && shownBy(m.expression); if (t != null) ext.set(String(m.name), t); }));
    const want = rj && rj.themeCollection && rj.themeCollection.customTheme ? String(rj.themeCollection.customTheme.name || '') : '';
    const themes = res.filter((f) => f !== rep && f !== xf).map((f) => ({ f, j: parse(f) })).filter((x) => x.j && x.j.textClasses);
    const theme = ((want && themes.find((x) => x.f.path.endsWith('/' + want))) || themes[0] || {}).j || null;
    const order = ((json('pages.json') || {}).pageOrder || []).map(String);
    return order.map((id) => ({ id, pj: json(`${id}/page.json`) })).filter((p) => p.pj && p.pj.type !== 'Tooltip' && p.pj.visibility !== 'HiddenInViewMode').map(({ id, pj }) => {
      const list = [...by.keys()].filter((k) => k.startsWith(id + '/visuals/') && /\/visual\.json$/.test(k)).map((k) => json(k)).filter(Boolean)
        .sort((a, b) => ((+(a.position || {}).z || 0) - (+(b.position || {}).z || 0)) || (+(a.position || {}).y || 0) - (+(b.position || {}).y || 0) || (+(a.position || {}).x || 0) - (+(b.position || {}).x || 0));
      const byName = new Map(list.map((j) => [String(j.name), j]));
      const at = (j) => { let x = +(j.position || {}).x || 0, y = +(j.position || {}).y || 0, g = j.parentGroupName, hid = !!j.isHidden, d = 0; while (g && byName.has(g) && d++ < 10) { const q = byName.get(g); x += +(q.position || {}).x || 0; y += +(q.position || {}).y || 0; hid = hid || !!q.isHidden; g = q.parentGroupName; } return { x, y, hid }; };
      // (0.3.0 L4) a flip card is drawn as the card its front shows (the title kept on the front's hidden title); its
      // backdrop, an image in the same box, is not drawn; its back starts hidden
      const linkOf = (j) => { const e = ((((j.visual || {}).visualContainerObjects || {}).visualLink) || []).find((x) => x && !x.selector && x.properties); return e ? lit(e.properties.type) : null; };
      const boxOf = (j) => [j.parentGroupName || '', ...['x', 'y', 'width', 'height'].map((k) => +(j.position || {})[k] || 0)].join('|');
      const fronts = list.filter((j) => j.visual && j.visual.visualType === 'image' && !j.isHidden && linkOf(j) === 'Bookmark');
      const flipTitle = (j) => { const t = ((((j.visual || {}).visualContainerObjects || {}).title) || []).find((e) => e && !e.selector && e.properties) || {}; return lit((t.properties || {}).text) || ''; };
      const visuals = list.filter((j) => !j.visualGroup && j.visual && !(j.visual.visualType === 'image' && !linkOf(j) && fronts.some((f) => boxOf(f) === boxOf(j)))).map((j) => {
        const front = fronts.includes(j), p = at(j), type = front ? 'cardVisual' : String(j.visual.visualType || 'unknown'), title = front ? flipTitle(j) : type === 'textbox' ? textOf(j) : titleOf(j, ext);
        return p.hid ? null : Object.assign({ type, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, w: +(j.position || {}).width || 0, h: +(j.position || {}).height || 0, z: +(j.position || {}).z || 0, title }, settingsOf(j, type, theme, id),
          type !== 'textbox' && shortened(title, altOf(j)) ? { titleCut: true } : {},
          (/^(card|cardVisual|multiRowCard)$/.test(type) && !hasFields(j) || type === 'textbox') && !title ? { panel: true } : {});
      }).filter(Boolean);
      return { id, name: String(pj.displayName || id), w: +pj.width || 0, h: +pj.height || 0, rtl: !!o.rtl, colors: o.colors || null, visuals };
    });
  }

  // the design engine's slot kinds, as Power BI's visual types
  const SLOT = { kpi: 'cardVisual', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx', slicer: 'slicer', filters: 'slicer', text: 'textbox', title: 'textbox', logo: 'image' };
  /** A page from the design engine's slots ({ kind, role, x, y, w, h }), the plan before the writer lays it out. */
  function fromSlots(slots, page, opts) {
    const o = opts || {};
    return { name: String(o.name || ''), w: +(page || {}).w || 1280, h: +(page || {}).h || 720, rtl: !!o.rtl, colors: o.colors || null,
      visuals: (slots || []).map((s) => ({ type: SLOT[s.kind] || String(s.kind || 'unknown'), x: +s.x || 0, y: +s.y || 0, w: +s.w || 0, h: +s.h || 0, title: s.title || s.role || '' })) };
  }

  const api = { render, check, notes, fromFiles, fromSlots, kindOf, labelsOf, LIMITS, WORDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPagePreview = api;
})(typeof self !== 'undefined' ? self : this);
