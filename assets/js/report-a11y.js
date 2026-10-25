/*! DataArcus report accessibility | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// Power BI's accessibility basics for a PBIR report (0.3, J7), after Microsoft's guidance ("Design Power BI reports for
// accessibility", GUIDE below): alt text on every visual that shows data, a tab order in reading order (right to left
// in a right-to-left report), titles on, data colours at 3:1 against what they are drawn on, and no information by
// colour alone where a legend is needed.
// Two halves, one set of rules:
//   - the writer's (pbip-export.js): readable(o) steps the report theme's first data colour to 3:1 on the card before the
//     pages are written; apply(files, opts) gives every data visual without alt text one from its role and fields, puts each
//     page's tab stops in reading order and takes the decorative ones (an empty text box, a shape or an image without
//     alt text) out of the tab order (seen in Desktop 2.158 on 6-7 Oct: a visual without tabOrder is no Tab stop).
//   - check_report's rule family "a11y" (RULES, run by report-rules.js), on any report: the findings say what is
//     missing in numbers and kinds, never the report's own text (a report's text is untrusted input).
// An alt text names fields only (metadata), never a value: the tools never read the data. The writer's alt text is the
// visual's full title, made from its fields ("Total Sales by Region"); where a data visual has none, describe() says what
// it shows, in the report's language: "Total Sales by Region, one bar per Region." «إجمالي المبيعات حسب المنطقة، شريط لكل
// المنطقة.» (A screen reader reads the type and the title before the alt text (GUIDE): a sentence of its own instead
// of the title is the owner's decision, J7's "Decisions I made".)
// With the story titles (story-titles.js, 0.3 J4) loaded, a measure's name is said as its title says it (its time
// intelligence in words, "Sales last year"): the alt text and the title then name each field the same way.
// Browser and Node (module.exports / window.DAA11y). The rules never write anything; apply() changes only the files
// it is given, in memory.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Engine = node ? require('./design-engine.js') : root.DAEngine;
  // the story titles are optional: on a branch without them the model's names are used as they are
  const ST = (() => { if (!node) return root.DAStoryTitles || null; try { return require('./story-titles.js'); } catch (e) { return null; } })();

  const GUIDE = {
    title: 'Design Power BI reports for accessibility (Microsoft Learn)',
    url: 'https://learn.microsoft.com/power-bi/create-reports/desktop-accessibility-creating-reports',
    alt: '#alt-text', tab: '#tab-order', titles: '#titles-and-labels', themes: '#report-themes', checklist: '#report-accessibility-checklist'
  };
  const ALT_MAX = 250;   // the Alt text box's limit (GUIDE#alt-text)
  const MIN_CONTRAST = 3;   // a graphical object against what it is drawn on (WCAG 1.4.11; GUIDE#report-themes)

  // ---- reading a visual.json ----
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const strOf = (p) => { const v = lit(p); return v == null ? '' : String(v).replace(/^'|'$/g, '').replace(/''/g, "'"); };
  const entries = (l) => (Array.isArray(l) ? l : []);
  const plain = (l) => entries(l).filter((e) => e && !e.selector).reduce((a, e) => Object.assign(a, e && e.properties && typeof e.properties === 'object' ? e.properties : {}), {});
  const shown = (x) => String(x).replace(/(?![‌‍])\p{Cf}/gu, '').replace(/\s+/g, ' ').trim();
  const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
  const hex6 = (c) => { const s = String(c || '').trim().replace(/^'|'$/g, ''); if (!HEX.test(s)) return null; return s.length === 4 ? '#' + s.slice(1).split('').map((ch) => ch + ch).join('') : s.toLowerCase(); };

  // what a visual type shows its categories as (the noun of "one bar per Region")
  const SHAPE = {
    clusteredBarChart: 'bar', stackedBarChart: 'bar', hundredPercentStackedBarChart: 'bar', funnel: 'bar',
    clusteredColumnChart: 'column', stackedColumnChart: 'column', hundredPercentStackedColumnChart: 'column', ribbonChart: 'column', waterfallChart: 'column',
    lineClusteredColumnComboChart: 'column', lineStackedColumnComboChart: 'column',
    lineChart: 'line', areaChart: 'line', stackedAreaChart: 'line', hundredPercentStackedAreaChart: 'line',
    pieChart: 'slice', donutChart: 'slice', treemap: 'box', scatterChart: 'point', map: 'place', filledMap: 'place', azureMap: 'place', shapeMap: 'place'
  };
  const CARDS = /^(card|cardVisual|multiRowCard|kpi|gauge)$/;
  const TABLES = /^(tableEx|table)$/;
  const MATRIX = /^(pivotTable|matrix)$/;
  const SLICERS = /^(slicer|advancedSlicerVisual|listSlicer|textSlicer)$/;
  // a chart: a visual whose colour draws its data (contrast and legend rules)
  const isChart = (type) => Object.prototype.hasOwnProperty.call(SHAPE, type);
  const DECORATIVE = /^(shape|basicShape|image|actionButton)$/;

  // the visual's projections by role, the helpers the writer adds left out: a blank display name (a sort helper,
  // "Min of Month Number" shown as " ") and the Tooltips role (not drawn)
  function roles(v) {
    const qs = (((v || {}).query || {}).queryState) || {}, out = {};
    if (!qs || typeof qs !== 'object') return out;
    Object.keys(qs).forEach((r) => {
      if (r === 'Tooltips') return;
      const ps = entries(qs[r] && qs[r].projections).filter((p) => p && typeof p === 'object' && !(typeof p.displayName === 'string' && !p.displayName.trim()));
      if (ps.length) out[r] = ps;
    });
    return out;
  }
  const isValueProj = (p) => !!(p && p.field && (p.field.Measure || p.field.Aggregation));
  // a projection's name as Power BI shows it: the display name, else the native name ("Sum of Amount"), else the field's
  // own; a measure's time intelligence in words when the story titles are loaded (as its title says it)
  function nameOf(p, ar) {
    if (!p) return '';
    if (typeof p.displayName === 'string' && p.displayName.trim()) return shown(p.displayName);
    const f = p.field || {}, m = f.Measure, raw = p.nativeQueryRef || (m && m.Property) || (f.Column && f.Column.Property) || ((f.Aggregation || {}).Expression || {}).Column && f.Aggregation.Expression.Column.Property || '';
    const s = shown(raw);
    return m && ST && ST.timeWords ? ST.timeWords(s, ar) : s;   // (ar: an Arabic report keeps an English name as it is, R2)
  }
  const uniq = (list) => list.filter((x, i) => x && list.indexOf(x) === i);
  const and = (list, ar) => (list.length < 2 ? list[0] || '' : ar ? list.join(' و') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]);

  // the sentences (EN and AR): every Arabic sentence is listed for the owner in the PR (0.3 J7)
  const PER = {
    en: { bar: 'one bar per', column: 'one column per', line: 'one point per', slice: 'one slice per', box: 'one box per', point: 'one point per', place: 'one place per' },
    ar: { bar: 'شريط لكل', column: 'عمود لكل', line: 'نقطة لكل', slice: 'شريحة لكل', box: 'مربع لكل', point: 'نقطة لكل', place: 'موقع لكل' }
  };
  const SAY = {
    en: { by: (m, c) => `${m} by ${c}`, over: (m, c) => `${m} over ${c}`, share: (m, c) => `Share of ${m} by ${c}`,
      series: (s) => `One colour per ${s}, named in the legend.`, card: (m) => `${m} for the filters on the page.`,
      rows: (c, m) => (m ? `One row per ${c}, with ${m}.` : `One row per ${c}.`), totals: (m) => `Totals of ${m}.`,
      matrix: (r, c, m) => [r && `Rows by ${r}`, c && `columns by ${c}`, m && `values: ${m}`].filter(Boolean).join('; ') + '.',
      slicer: (c) => `Filters the page by ${c}.`, shows: (x) => `Shows ${x}.` },
    ar: { by: (m, c) => `${m} حسب ${c}`, over: (m, c) => `${m} على مدى ${c}`, share: (m, c) => `حصة ${m} حسب ${c}`,
      series: (s) => `لون لكل ${s}، كما في وسيلة الإيضاح.`, card: (m) => `${m} حسب الفلاتر في الصفحة.`,
      rows: (c, m) => (m ? `صف لكل ${c}، مع ${m}.` : `صف لكل ${c}.`), totals: (m) => `إجماليات ${m}.`,
      matrix: (r, c, m) => [r && `الصفوف حسب ${r}`, c && `الأعمدة حسب ${c}`, m && `القيم: ${m}`].filter(Boolean).join('؛ ') + '.',
      slicer: (c) => `يصفّي الصفحة حسب ${c}.`, shows: (x) => `يعرض ${x}.` }
  };
  // at most 250 characters: the legend sentence goes first, then the "one bar per" part, then the text is cut at a word
  function capped(parts) {
    const join = (p) => p.filter(Boolean).join(' ');
    let t = join(parts);
    if (t.length > ALT_MAX && parts[2]) t = join(parts.slice(0, 2));
    if (t.length > ALT_MAX && parts[1]) t = join([parts[0].replace(/[,،]$/, '.')]);
    if (t.length > ALT_MAX) { const cut = t.slice(0, ALT_MAX - 1); t = (cut.lastIndexOf(' ') > 40 ? cut.slice(0, cut.lastIndexOf(' ')) : cut) + '…'; }
    return t;
  }

  // The alt text of a visual that shows data, from its type and its fields; null for one without fields.
  // v: visual.json's "visual"; lang: 'en' | 'ar' (the report's language)
  function describe(v, lang) {
    if (!v || typeof v !== 'object') return null;
    const ar = lang === 'ar', S = ar ? SAY.ar : SAY.en, type = String(v.visualType || ''), R = roles(v);
    const all = [].concat(...Object.values(R));
    if (!all.length) return null;
    const names = (ps) => uniq(ps.map((p) => nameOf(p, ar)));
    const values = names(all.filter(isValueProj)), cols = names(all.filter((p) => !isValueProj(p)));
    if (SLICERS.test(type)) return capped([S.slicer(and(names(all), ar))]);
    if (CARDS.test(type)) return values.length || cols.length ? capped([S.card(and(values.length ? values : cols, ar))]) : null;
    if (TABLES.test(type)) {
      // (a right-to-left table's row label is a report measure named as its column: one name, said once)
      const c = cols.filter((x) => !values.includes(x)), m = values.filter((x) => !c.includes(x));
      if (c.length) return capped([S.rows(and(c, ar), m.length ? and(m, ar) : '')]);
      return capped([S.totals(and(m, ar))]);
    }
    if (MATRIX.test(type)) return capped([S.matrix(and(names(R.Rows || []), ar), and(names(R.Columns || []), ar), and(names(R.Values || []), ar))]);
    const shape = SHAPE[type];
    if (shape) {
      const cat = names([].concat(R.Category || [], R.Axis || [], R.Location || [], R.Details || [], R.Group || []).filter((p) => !isValueProj(p)));
      const m = names([].concat(R.Y || [], R.Values || [], R.Size || [], R.X || [], R.ColumnY || [], R.LineY || []).filter(isValueProj));
      const ser = names([].concat(R.Series || [], R.Legend || []));
      const M = and(m.length ? m : values, ar), C = and(cat, ar);
      if (!M) return capped([S.shows(and(names(all), ar))]);
      if (!C) return capped([M + '.', '', ser.length ? S.series(and(ser, ar)) : '']);
      const lead = shape === 'line' ? S.over(M, C) : shape === 'slice' ? S.share(M, C) : S.by(M, C);
      return capped([lead + (ar ? '،' : ','), (ar ? PER.ar : PER.en)[shape] + ' ' + C + '.', ser.length ? S.series(and(ser, ar)) : '']);
    }
    return capped([S.shows(and(names(all), ar))]);
  }

  // ---- reading order ----
  // boxes { x, y, w, h } in page units: rows top to bottom (a box joins the row while its top is above the row's
  // shortest bottom), each row left to right, or right to left (by the right edge) in a right-to-left report
  function readingOrder(boxes, dir) {
    const rtl = dir === 'rtl', across = (a, b) => (rtl ? (b.x + b.w) - (a.x + a.w) : a.x - b.x) || a.y - b.y;
    const rows = [];
    boxes.slice().sort((a, b) => a.y - b.y || across(a, b)).forEach((b) => {
      const row = rows[rows.length - 1];
      if (row && b.y < row.bottom - 0.5) { row.items.push(b); row.bottom = Math.min(row.bottom, b.y + b.h); } else rows.push({ items: [b], bottom: b.y + b.h });
    });
    return [].concat(...rows.map((r) => r.items.sort(across)));
  }
  // in tab order, the pairs a reader would meet the other way round: the later stop wholly above the earlier one, or
  // beside it in the same band (their heights overlap by half the smaller) and wholly before it in the reading direction
  function inversions(ordered, dir) {
    const rtl = dir === 'rtl'; let n = 0;
    for (let i = 0; i < ordered.length; i++) for (let j = i + 1; j < ordered.length; j++) {
      const a = ordered[i], b = ordered[j];
      if (b.y + b.h <= a.y + 0.5) { n++; continue; }
      const ov = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ov >= 0.5 * Math.min(a.h, b.h) && (rtl ? b.x + 0.5 >= a.x + a.w : b.x + b.w <= a.x + 0.5)) n++;
    }
    return n;
  }

  // ---- colours ----
  // the report theme's data colours at 3:1 on the card they are drawn on, each stepped by the design engine's
  // toContrast (its hue and saturation kept; darker on a light card, lighter on a dark one)
  function readable(theme, card) {
    const bg = hex6(card) || '#ffffff';
    const list = theme && Array.isArray(theme.dataColors) ? theme.dataColors : null;
    if (!list) return { theme, changed: [] };
    const changed = [];
    // (only the first: the colour every one-measure chart draws; the others are drawn only by a legend or slices, and
    // the designed theme stays the plan's: test.mjs holds the written theme to the design's, and the second chart's
    // colour is chosen at 3:1 already, design-engine secondColour)
    const dataColors = list.map((c, i) => { const x = hex6(c); if (!x || i > 0) return c; const y = Engine.toContrast(x, bg, MIN_CONTRAST); if (y !== x) changed.push({ from: x, to: y, contrast: +Engine.contrast(x, bg).toFixed(2) }); return y === x ? c : y; });
    return { theme: changed.length ? Object.assign({}, theme, { dataColors }) : theme, changed, card: bg };
  }

  // ---- the writer's pass ----
  const VISUAL = /(?:^|\/)definition\/pages\/([^/]+)\/visuals\/([^/]+)\/visual\.json$/, PAGE = /(?:^|\/)definition\/pages\/([^/]+)\/page\.json$/;
  const textOf = (vis) => entries(plain(((vis.objects) || {}).general).paragraphs).map((p) => entries(p && p.textRuns).map((r) => String((r && r.value) || '')).join('')).join(' ');
  const altOf = (holder) => { const g = plain(((holder || {}).visualContainerObjects || {}).general); return g.altText; };
  const setAlt = (vis, text) => {
    const vco = vis.visualContainerObjects = vis.visualContainerObjects || {};
    const g = entries(vco.general).find((e) => e && !e.selector);
    const p = { expr: { Literal: { Value: "'" + String(text).replace(/'/g, "''") + "'" } } };
    if (g) { g.properties = g.properties || {}; g.properties.altText = p; } else vco.general = entries(vco.general).concat([{ properties: { altText: p } }]);
  };
  // files: the writer's [{ path, data (JSON text) }]; opts: { lang, rtl }. Returns what it did, counted.
  function apply(files, opts) {
    const o = opts || {}, lang = o.lang === 'ar' ? 'ar' : 'en', dir = o.rtl ? 'rtl' : 'ltr';
    const pages = {}, done = { alt: 0, untabbed: 0, reordered: 0 };
    files.forEach((f) => {
      let m = PAGE.exec(f.path); if (m) { (pages[m[1]] = pages[m[1]] || { visuals: [] }).file = f; return; }
      m = VISUAL.exec(f.path); if (m) (pages[m[1]] = pages[m[1]] || { visuals: [] }).visuals.push(f);
    });
    Object.values(pages).forEach((pg) => {
      let pj = null; try { pj = pg.file ? JSON.parse(pg.file.data) : null; } catch (e) { pj = null; }
      if (!pj || pj.type === 'Tooltip') return;   // a report page tooltip is never a Tab stop (GUIDE#tooltips)
      const vs = pg.visuals.map((f) => ({ f, j: JSON.parse(f.data), changed: false }));
      const byName = new Map(vs.map((x) => [x.j.name, x]));
      vs.forEach((x) => {
        const vis = x.j.visual, pos = x.j.position || {};
        if (!vis || pos.tabOrder == null) return;
        const type = String(vis.visualType || '');
        if (type === 'textbox') {
          const t = shown(textOf(vis));
          if (!t) { delete pos.tabOrder; x.changed = true; done.untabbed++; return; }   // an empty text box is a panel
          if (!strOf(altOf(vis))) { setAlt(vis, t.length > ALT_MAX ? t.slice(0, ALT_MAX - 1) + '…' : t); x.changed = true; done.alt++; }
          return;
        }
        if (DECORATIVE.test(type) && type !== 'actionButton' && !strOf(altOf(vis))) { delete pos.tabOrder; x.changed = true; done.untabbed++; return; }
        // (a visual's alt text is its full title where the writer gave one: "Total Sales by Region", made from its
        // fields, and the reference the writer's own title fit and the tests read; the sentence fills only a missing one)
        const alt = strOf(altOf(vis)).trim() ? null : describe(vis, lang);
        if (alt) { setAlt(vis, alt); x.changed = true; done.alt++; }
      });
      // the tab stops of each group (and of the page) in reading order, keeping the numbers they had
      const abs = (x, seen) => { const p = x.j.position || {}, par = x.j.parentGroupName && byName.get(x.j.parentGroupName);
        const base = par && !(seen || []).includes(par) ? abs(par, (seen || []).concat([x])) : { x: 0, y: 0 };
        return { x: base.x + (+p.x || 0), y: base.y + (+p.y || 0) }; };
      const sibs = {};
      vs.forEach((x) => { const p = x.j.position || {}; if (p.tabOrder == null) return; (sibs[x.j.parentGroupName || ''] = sibs[x.j.parentGroupName || ''] || []).push(x); });
      Object.values(sibs).forEach((list) => {
        const boxes = list.map((x) => { const a = abs(x); return { x: a.x, y: a.y, w: +x.j.position.width || 0, h: +x.j.position.height || 0, v: x }; });
        const nums = list.map((x) => +x.j.position.tabOrder).sort((a, b) => a - b);
        readingOrder(boxes, dir).forEach((b, i) => { if (+b.v.j.position.tabOrder !== nums[i]) { b.v.j.position.tabOrder = nums[i]; b.v.changed = true; done.reordered++; } });
      });
      vs.forEach((x) => { if (x.changed) x.f.data = JSON.stringify(x.j, null, 2); });
    });
    return done;
  }

  // ---- check_report's rules (group "a11y"; report-rules.js runs them) ----
  // R: report-rules.js's parsed report; x: one visual { type, json, page, parent, x, y, w, h }
  const SRC = (anchor, section) => ({ guide: true, url: GUIDE.url + anchor, title: GUIDE.title, section });
  const hidden = (x) => !!(x.json && x.json.isHidden);
  const tabStop = (x) => x.json && x.json.position && x.json.position.tabOrder != null;
  const shows = (x) => !!(x.json && x.json.visual) && Object.keys(roles(x.json.visual)).length > 0;
  const mainPages = (R) => (R.pages || []).filter((p) => !p.tooltip);
  const altText = (x) => { const a = altOf(x.json.visual || x.json.visualGroup); return a && a.expr && !a.expr.Literal ? 'conditional' : strOf(a).trim(); };
  // a visual laid over another one that is a Tab stop, at least 80% of its box on the other's (the writer's "No data"
  // message over its chart, whose slot is taller than a table cut to its rows): its information is the other's, so it
  // need not be a stop of its own
  const OVER = 0.8;
  const covered = (a, b) => { const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); return w > 0 && h > 0 && a.w * a.h > 0 && (w * h) / (a.w * a.h) >= OVER; };
  const over = (x, list) => list.some((y) => y !== x && tabStop(y) && covered(x, y));
  // the theme's own setting for a visual type: visualStyles[type]['*'][card], else visualStyles['*']['*'][card]
  const themeCard = (R, type, card) => { const vs = ((R.theme || {}).json || {}).visualStyles || {}; const one = (t) => (((vs[t] || {})['*'] || {})[card] || [])[0]; return one(type) || one('*') || null; };
  const solidColour = (c) => { if (!c) return null; if (typeof c === 'string') return hex6(c); const s = c.solid ? c.solid.color : c.color; return typeof s === 'string' ? hex6(s) : hex6(lit(s)); };
  const show = (props) => { const s = props ? (props.show && typeof props.show === 'object' ? lit(props.show) : props.show) : undefined; return s === undefined ? undefined : String(s) !== 'false'; };
  // the colour a visual's data is drawn on: its own background, else the theme's for visuals, else (switched off or
  // more than half transparent) the page's; null when that is a picture (not judged)
  function backgroundOf(R, x, pg) {
    const own = plain(((x.json.visual || {}).visualContainerObjects || {}).background), th = themeCard(R, x.type, 'background') || {};
    const tr = (p) => { const t = p && typeof p === 'object' && p.expr ? +String(lit(p)).replace(/D$/, '') : +p; return Number.isFinite(t) ? t : 0; };
    const on = show(own) !== undefined ? show(own) : show(th) !== undefined ? show(th) : true;
    const col = solidColour(own.color) || solidColour(th.color) || hex6(((R.theme || {}).json || {}).background) || (R.theme ? null : '#ffffff');
    const transparency = own.transparency !== undefined ? tr(own.transparency) : tr(th.transparency);
    if (on && col && transparency < 50) return col;
    const pj = (pg && pg.json) || {}, pb = plain(((pj.objects) || {}).background), tp = (((((R.theme || {}).json || {}).visualStyles || {}).page || {})['*'] || {}).background;
    const tpb = (tp || [])[0] || {};
    if (pb.image || tpb.image || plain(((pj.objects) || {}).wallpaper).image) return null;
    return solidColour(pb.color) || solidColour(tpb.color) || '#ffffff';
  }
  const RULES = [
    { id: 'A11Y_ALT_TEXT', group: 'a11y', severity: 'warning', source: SRC(GUIDE.alt, 'Alt text'),
      about: 'every visual that shows data and is a Tab stop has alt text (a screen reader reads its type, its title, then its alt text); a text box with text has it too (the checklist)',
      run(R, out) {
        mainPages(R).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !tabStop(x) || altText(x)) return;
          if (shows(x)) out(x, 'a visual that shows data has no alt text', 'Add alt text that says what it shows, by its fields (Format > General > Alt text; at most 250 characters); never a value, which changes with the data.');
          else if (x.type === 'textbox' && shown(textOf(x.json.visual)).length) out(x, 'a text box with text has no alt text', 'Put its text in its alt text, as Microsoft\'s checklist asks, so every screen reader reads it.', { severity: 'note' });
        }));
      } },
    { id: 'A11Y_DECORATIVE', group: 'a11y', severity: 'note', source: SRC(GUIDE.tab, 'Tab order'),
      about: 'a decorative part (an empty text box, a shape or an image without alt text) is out of the tab order, so a screen reader does not stop on it',
      run(R, out) {
        mainPages(R).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !tabStop(x) || altText(x) || !x.json.visual) return;
          if ((/^(shape|basicShape|image)$/.test(x.type)) || (x.type === 'textbox' && !shown(textOf(x.json.visual)).length)) out(x, `a ${x.type === 'textbox' ? 'text box without text' : x.type === 'image' ? 'picture without alt text' : 'shape without alt text'} is a Tab stop`, 'Hide it from the tab order (View > Selection > Tab order: select its number), or give it alt text if it means something.');
        }));
      } },
    // (0.3.1 S1, byDir: in a report holding both languages each page is judged in its own reading direction)
    { id: 'A11Y_TAB_ORDER', group: 'a11y', severity: 'warning', source: SRC(GUIDE.tab, 'Tab order'), byDir: true,
      about: 'the Tab stops of a page (and of each group) follow the reading order: top to bottom, then left to right, or right to left in a right-to-left report; a visual that shows data is a Tab stop',
      run(R, out) {
        const dir = R.dir || (R.lang === 'ar' || R.lang === 'he' ? 'rtl' : 'ltr');
        mainPages(R).forEach((pg) => {
          const live = pg.visuals.filter((x) => !hidden(x));
          if (!live.some(tabStop)) return;   // a page without tabOrder: Desktop's own order, not judged
          const sibs = {};
          live.filter(tabStop).forEach((x) => { (sibs[x.parent || ''] = sibs[x.parent || ''] || []).push(x); });
          const pairs = Object.values(sibs).reduce((n, list) => n + inversions(list.slice().sort((a, b) => +a.json.position.tabOrder - +b.json.position.tabOrder), dir), 0);
          if (pairs) out(null, `on a page, ${pairs} pair${pairs === 1 ? '' : 's'} of Tab stops ${pairs === 1 ? 'is' : 'are'} met against the reading order (${dir === 'rtl' ? 'right to left' : 'left to right'}, top to bottom)`, 'Set the tab order in reading order (View > Selection > Tab order).', { file: `definition/pages/${pg.id}/page.json`, page: { id: pg.id, name: pg.name } });
          live.filter((x) => shows(x) && !tabStop(x) && !over(x, live)).forEach((x) => out(x, 'a visual that shows data is not a Tab stop: a keyboard user cannot reach it', 'Give it a place in the tab order (View > Selection > Tab order).'));
        });
      } },
    { id: 'A11Y_TITLE', group: 'a11y', severity: 'warning', source: SRC(GUIDE.titles, 'Titles and labels'),
      about: 'a chart, table or matrix that is a Tab stop shows its title (the reference a screen reader reads first)',
      run(R, out) {
        mainPages(R).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !tabStop(x) || !shows(x) || !(isChart(x.type) || TABLES.test(x.type) || MATRIX.test(x.type))) return;
          const own = show(plain(((x.json.visual || {}).visualContainerObjects || {}).title)), th = show(themeCard(R, x.type, 'title'));
          if (own === false || (own === undefined && th === false)) out(x, 'its title is switched off', 'Switch the title on and say in it what the visual shows (no acronyms).');
        }));
      } },
    { id: 'A11Y_CONTRAST', group: 'a11y', severity: 'warning', source: SRC(GUIDE.themes, 'Report themes'),
      about: 'the colours a chart draws its data in stand 3:1 against what they are drawn on (the theme\'s data colours a chart uses, and its own fixed colours)',
      run(R, out) {
        const palette = (((R.theme || {}).json || {}).dataColors || []).map(hex6).filter(Boolean);
        (R.pages || []).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !isChart(x.type) || !shows(x)) return;
          const bg = backgroundOf(R, x, pg); if (!bg) return;
          const v = x.json.visual, rl = roles(v), dp = entries((v.objects || {}).dataPoint);
          const fixed = dp.map((e) => solidColour(((e && e.properties) || {}).fill)).filter(Boolean);
          const own = dp.some((e) => e && !e.selector && solidColour(((e.properties) || {}).fill));
          const many = rl.Series || rl.Legend || SHAPE[x.type] === 'slice' || x.type === 'treemap';
          const used = own ? fixed : fixed.concat(palette.slice(0, many ? 8 : Math.max(1, (rl.Y || []).length)));
          const low = uniq(used).map((c) => ({ c, k: Engine.contrast(c, bg) })).filter((u) => u.k < MIN_CONTRAST);
          if (low.length) out(x, `${low.length} of the colours it draws in stand under 3:1 against ${bg} (${low.map((u) => `${u.c} ${u.k.toFixed(1)}:1`).join(', ')})`, 'Use data colours of 3:1 or more against the visual\'s background (in the theme, or on the visual), so every bar, line or slice can be seen.');
        }));
      } },
    { id: 'A11Y_COLOUR_ONLY', group: 'a11y', severity: 'warning', source: SRC(GUIDE.checklist, 'Report accessibility checklist'),
      about: 'a chart that tells its series apart by colour (a legend field, two measures or more, or slices) shows its legend or labels the parts: colour is never the only means',
      run(R, out) {
        mainPages(R).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !isChart(x.type) || !shows(x)) return;
          const v = x.json.visual, rl = roles(v), o = v.objects || {};
          const parts = rl.Series || rl.Legend || (rl.Y || []).length > 1 || SHAPE[x.type] === 'slice';
          if (!parts) return;
          const legend = show(plain(o.legend)), thLegend = show(themeCard(R, x.type, 'legend'));
          const legendOff = legend === false || (legend === undefined && thLegend === false);
          const labels = show(plain(o.labels)), cat = /Category/i.test(strOf(plain(o.labels).labelStyle));
          if (legendOff && !(SHAPE[x.type] === 'slice' && labels !== false && (cat || !strOf(plain(o.labels).labelStyle))))
            out(x, 'its parts are told apart by colour alone: the legend is off', 'Switch the legend on, or label each part by its name (data labels with the category).');
        }));
      } }
    ,
    // (0.3.0 L5) status icons on a table or matrix: the theme's icons that a rule names, or the theme's DataArcus icons
    // when a measure names them, are told apart by their shape as well as their colour (a note), or by colour alone (two
    // that differ only in colour: a warning). An icon the theme does not carry (Power BI's own sets) is not judged
    { id: 'A11Y_ICON_SHAPES', group: 'a11y', severity: 'note', source: SRC(GUIDE.checklist, 'Report accessibility checklist'),
      about: 'status icons on a table or matrix differ in shape as well as colour, so colour is never the only signal',
      run(R, out) {
        const ic = (((R.theme || {}).json || {}).icons) || {};
        const shape = (n) => { const u = ic[n] && typeof ic[n].url === 'string' ? ic[n].url : null; return u == null ? null : u.replace(/rgba?\([^)]*\)|%23[0-9a-f]{3,8}|#[0-9a-f]{3,8}|\b(fill|stroke)='[a-z]+'/gi, 'C'); };
        const own = ['daGood', 'daWarn', 'daBad'];
        mainPages(R).forEach((pg) => pg.visuals.forEach((x) => {
          if (hidden(x) || !(TABLES.test(x.type) || MATRIX.test(x.type))) return;
          const icons = entries(((x.json.visual || {}).objects || {}).values).map((e) => e && e.properties && e.properties.icon).filter(Boolean);
          if (!icons.length) return;
          const names = new Set();
          let byMeasure = false;
          icons.forEach((i) => { const ex = i.value && i.value.expr; if (!ex) return; if (ex.Measure) byMeasure = true;
            entries(ex.Conditional && ex.Conditional.Cases).forEach((c) => { const v = c && c.Value && c.Value.Literal ? String(c.Value.Literal.Value).replace(/^'|'$/g, '') : null; if (v) names.add(v); });
            if (ex.Literal) names.add(String(ex.Literal.Value).replace(/^'|'$/g, '')); });
          if (byMeasure && own.every((n) => shape(n))) own.forEach((n) => names.add(n));
          const mine = [...names].filter((n) => shape(n) != null);
          if (mine.length < 2) return;
          const kinds = new Set(mine.map(shape));
          if (kinds.size === mine.length) out(x, `its ${mine.length} status icons differ in shape as well as colour, so colour is not the only signal`, 'Nothing to change; keep the shapes when the theme changes (a legend in the title or a text box helps first-time readers).');
          else out(x, `${mine.length - kinds.size + 1} of its status icons differ only in colour`, 'Use icons that differ in shape too (DataArcus\'s theme icons: a tick in a circle, a triangle, a cross in a square), so colour is not the only signal.', { severity: 'warning' });
        }));
      } }
  ];

  const api = { GUIDE, ALT_MAX, MIN_CONTRAST, describe, readingOrder, inversions, readable, apply, RULES, roles, nameOf, backgroundOf, SAY, PER };
  if (node) module.exports = api; else root.DAA11y = api;
})(typeof self !== 'undefined' ? self : this);
