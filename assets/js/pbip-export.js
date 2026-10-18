/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// Builds a Power BI project (PBIP) with the report in the PBIR format: theme applied, page background set,
// and a visual placed in every slot of the layout. Everything runs in the browser; nothing is uploaded.
// The result is a zip (stored, no compression) that the visitor unzips and opens in Power BI Desktop.
// 0.2.9, audit 3's A3-12: build puts together the writer's modules: pbip-query.js (fields, queries, DAX), pbip-sizing.js
// (measured sizes), pbip-page.js (the pages and their visuals) and pbip-notes.js (what it tells its caller).
(function (root) {
  'use strict';
  // the writer's modules (0.2.9, audit 3's A3-12): in Node required here, in the browser loaded before this file
  const Query = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery), Sizing = (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const Engine = (typeof module !== 'undefined' && module.exports ? require('./design-engine.js') : root.DAEngine);
  // (0.3, J7: Power BI's accessibility basics on every report written: report-a11y.js, loaded before this file on the website)
  const A11y = (typeof module !== 'undefined' && module.exports ? require('./report-a11y.js') : root.DAA11y);
  const Notes = (typeof module !== 'undefined' && module.exports ? require('./pbip-notes.js') : root.DAPbipNotes), Page = (typeof module !== 'undefined' && module.exports ? require('./pbip-page.js') : root.DAPbipPage);
  const {
    AR_MONTHS, HEX6, PF_KINDS, SCHEMA, TYPES, bool, daxNames, gradientEnds, guid, hasControl, isTime, json,
    mixHex, obj, pageFilterOf, pfLiteral, rnd, timeAxisPlan
  } = Query;
  const { barNameShare, cellRoom, columnRoom, textWidth } = Sizing;
  // the full font string for a bold total (N21-LAB.md: the family alone falls back to a serif face)
  const BOLD_TOTAL = "'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif";


  // ---------- zip (stored) ----------
  const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = CRC[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    let offset = 0;
    const d = new Date(), time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach((f) => {
      const name = enc.encode(f.path), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    const size = central.reduce((a, p) => a + p.length, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    const all = parts.concat(central, [new Uint8Array(e.buffer)]), out = new Uint8Array(all.reduce((a, p) => a + p.length, 0));
    let at = 0; all.forEach((p) => { out.set(p, at); at += p.length; });
    return out;
  }

  // ---------- sample data: a small sales table so the report opens looking finished ----------
  const T = {
    en: { table: 'Sample Data', month: 'Month', monthNo: 'Month No', category: 'Category', region: 'Region', revenue: 'Revenue', cost: 'Cost', orders: 'Orders', customers: 'Customers',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], cats: ['Electronics', 'Home', 'Fashion', 'Sports'], regions: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
      m: { rev: 'Total Revenue', ord: 'Total Orders', aov: 'Avg Order Value', mar: 'Margin %', cus: 'Total Customers', rpc: 'Revenue per Customer' } },
    ar: { table: 'بيانات تجريبية', month: 'الشهر', monthNo: 'رقم الشهر', category: 'الفئة', region: 'المنطقة', revenue: 'الإيرادات', cost: 'التكلفة', orders: 'الطلبات', customers: 'العملاء',
      months: AR_MONTHS, cats: ['إلكترونيات', 'المنزل', 'أزياء', 'رياضة'], regions: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان'],
      m: { rev: 'إجمالي الإيرادات', ord: 'إجمالي الطلبات', aov: 'متوسط قيمة الطلب', mar: 'هامش الربح %', cus: 'إجمالي العملاء', rpc: 'الإيراد لكل عميل' } }
  };
  function sampleModel(t) {
    const rows = [];
    t.months.forEach((mo, mi) => t.cats.forEach((ca, ci) => {
      const base = 42000 + ci * 9000 + mi * 1800 + ((mi * 7 + ci * 13) % 9) * 1500, orders = Math.round(base / (180 + ci * 35));
      rows.push('{' + [daxNames.string(mo), mi + 1, daxNames.string(ca), daxNames.string(t.regions[(mi + ci) % 4]), base, Math.round(base * (0.58 + ci * 0.04)), orders, Math.round(orders * 0.72)].join(', ') + '}');
    }));
    const tb = t.table, col = (name, dataType, extra) => Object.assign({ type: 'calculatedTableColumn', name, dataType, isNameInferred: true, isDataTypeInferred: true, sourceColumn: '[' + name + ']' }, extra || {});
    const expr = 'DATATABLE(' + [t.month, 'STRING', t.monthNo, 'INTEGER', t.category, 'STRING', t.region, 'STRING', t.revenue, 'DOUBLE', t.cost, 'DOUBLE', t.orders, 'INTEGER', t.customers, 'INTEGER'].map((x, i) => (i % 2 ? x : daxNames.string(x))).join(', ') + ', {' + rows.join(', ') + '})';
    const R = daxNames.column(tb, t.revenue), m = t.m;
    return {
      name: tb,
      columns: [
        col(t.month, 'string', { sortByColumn: t.monthNo, summarizeBy: 'none' }),
        col(t.monthNo, 'int64', { isHidden: true, summarizeBy: 'none' }),
        col(t.category, 'string', { summarizeBy: 'none' }),
        col(t.region, 'string', { summarizeBy: 'none', dataCategory: 'City' }),
        col(t.revenue, 'double', { isHidden: true, summarizeBy: 'sum', formatString: '#,0' }),
        col(t.cost, 'double', { isHidden: true, summarizeBy: 'sum', formatString: '#,0' }),
        col(t.orders, 'int64', { isHidden: true, summarizeBy: 'sum', formatString: '#,0' }),
        col(t.customers, 'int64', { isHidden: true, summarizeBy: 'sum', formatString: '#,0' })
      ],
      partitions: [{ name: tb, mode: 'import', source: { type: 'calculated', expression: expr } }],
      measures: [
        { name: m.rev, expression: 'SUM(' + R + ')', formatString: '#,0' },
        { name: m.ord, expression: 'SUM(' + daxNames.column(tb, t.orders) + ')', formatString: '#,0' },
        { name: m.aov, expression: 'DIVIDE([' + m.rev + '], [' + m.ord + '])', formatString: '#,0.0' },
        { name: m.mar, expression: 'DIVIDE(SUM(' + R + ') - SUM(' + daxNames.column(tb, t.cost) + '), SUM(' + R + '))', formatString: '0.0%' },
        { name: m.cus, expression: 'SUM(' + daxNames.column(tb, t.customers) + ')', formatString: '#,0' },
        { name: m.rpc, expression: 'DIVIDE([' + m.rev + '], [' + m.cus + '])', formatString: '#,0' }
      ]
    };
  }
  // Which fields each kind of visual shows. The sample data and a user's own model both come in this shape:
  // { kpis: [f], measure: f, date: f, cats: { bar, column, donut, funnel, treemap, map }, y: { funnel, gauge },
  //   table: [f], slicers: [f], tip: { card, cat, y, date } }, where f is a bound field (see proj above); tip.date is the
  // month field for the tooltip's trend (optional: without it the report has the one tooltip page by category)
  function sampleBind(t) {
    const C = (c) => ({ t: t.table, c }), Me = (m) => ({ t: t.table, m }), m = t.m;
    return {
      // (the margin is a percent, formatted 0.0% in the sample model: its card shows that format, see cardObjects; round
      // 12, the owner's rule: the "#,0" measures show their whole numbers, the "#,0.0" average automatic units)
      kpis: [m.rev, m.ord, m.aov, m.mar, m.cus, m.rpc].map((x) => Object.assign(Me(x), x === m.mar ? { pct: true, pctFormat: '0.0%' } : x === m.aov ? {} : { wholeFormat: '#,0' })), measure: Me(m.rev), date: C(t.month),
      cats: { bar: C(t.category), column: C(t.region), donut: C(t.category), funnel: C(t.category), treemap: C(t.category), map: C(t.region) },
      y: { funnel: Me(m.ord), gauge: Me(m.mar) },
      table: [C(t.region), Me(m.rev), Me(m.ord), Me(m.mar)],
      slicers: [C(t.region), C(t.category), C(t.month)],
      tip: { card: Object.assign(Me(m.rev), { wholeFormat: '#,0' }), cat: C(t.category), y: Me(m.ord), date: C(t.month) }
    };
  }
  /**
   * 0.2.9, audit 3's A3-9: build's contract, written down and checked at its top (checkBuild). The writer reads nothing
   * else from its caller. Sizes are page units (the page's own width and height).
   *
   * @typedef {Object} Field  a bound field: a column, a measure, or a column the visual sums or counts
   * @property {string} t  its table
   * @property {string} [c]  a column's name (a field has c or m)
   * @property {string} [m]  a measure's name
   * @property {number} [agg]  with c: the visual's aggregation (0 Sum, 2 Distinct count, 5 Count; Microsoft's QueryAggregateFunction)
   * @property {string} [name]  the display name shown for it (titles, headers, axis); the model is not renamed
   * @property {string} [type]  the column's data type as the model gives it (int64, double, string, dateTime...)
   * @property {boolean} [num]  a number column
   * @property {{t: string, c: string}} [sortBy]  the number column that puts a day or month name in order (no sort-by in the model)
   * @property {boolean} [ordered]  the model sorts this name itself
   * @property {{t: string, c: string}} [dateOf]  a month label's date column (its month start orders it, see timeAxisPlan)
   * @property {string} [kind]  the picker's kind of a category (day, month, quarter, year, date, period...; A3-7, A3-8)
   * @property {number} [rows]  the picker's known number of values of a category (7 days, 12 months...)
   * @property {string} [family]  the picker's family of the names (hijri, fiscal...)
   * @property {boolean} [time]  the picker's mark: a time category keeps its own order
   * @property {Field} [short]  a day name's short column (Day Short), used where the full names do not fit
   * @property {boolean} [pct]  a percent measure; pctFormat: its card format ("0.0%")
   * @property {string} [pctFormat]
   * @property {string} [wholeFormat]  a whole-number card format ("#,0")
   * @property {string} [cardFormat]  the card's format with kpiValues "full"
   * @property {string} [tableFormat]  a table column's format
   *
   * @typedef {Object} Bind  the fields of each visual (sampleBind gives the sample's)
   * @property {Field[]} [kpis]  one per KPI card, in order
   * @property {Field} [measure]  the main measure (line chart, cards, table titles)
   * @property {Field} [date]  the line chart's time axis (null: the line charts give their room away, fitSlots)
   * @property {Object<string, Field>} [cats]  the category of each chart kind: bar, column, donut, funnel, treemap, map
   * @property {Object<string, Field>} [y]  a chart kind's own measure: funnel, gauge
   * @property {Field[]} [table]  the table's (and matrix's) fields, in order
   * @property {Field[]} [slicers]  up to three slicers (null where the model has none)
   * @property {{card: Field, cat: Field, y: Field, date: Field}} [tip]  the tooltip pages' card, bar chart and trend
   * @property {Field[]} [catPool]  more categories, so the charts of a page show different ones
   *
   * @typedef {Object} Slot  a visual's place: kind (title, logo, text, kpi, card, line, bar, column, donut, funnel, treemap,
   *   map, gauge, table, matrix, slicer), its box x, y, w, h, and title (the layout's role name)
   * @property {string} kind
   * @property {number} x
   * @property {number} y
   * @property {number} w
   * @property {number} h
   * @property {string} [title]
   * @property {string} [text]  a text slot's sentence
   * @property {string|string[]} [role]  the design engine's role names (subtitles are keyed by them)
   * @property {boolean} [rail]  a filter rail's slot
   *
   * @typedef {Object} Page
   * @property {string} [name]  the page's name (the report's name when absent)
   * @property {{w: number, h: number}} page  its size
   * @property {Slot[]} slots
   * @property {Uint8Array} png  its background image
   * @property {{x: number, y: number, w: number, h: number}} [panel]  a slide-in filter panel's box
   * @property {number} [kpiInset]  where KPI titles start beside a side accent bar (the design engine's kpiInset)
   * @property {boolean} [grow]  a designed page: the writer may grow its header for a second row of page tabs
   * @property {boolean} [hand]  hand-placed slots: the writer never moves them
   *
   * @typedef {Object} BuildInput
   * @property {string} [name]  the report's name (its folder and files; cut to 30 characters at a word)
   * @property {string} [title]  the header's title (the name when absent)
   * @property {string} [lang]  'en' or 'ar' (the writer's own words and sample data)
   * @property {boolean} [rtl]  right to left
   * @property {string} [font]  the report's font ('Segoe UI' when absent)
   * @property {{text: string, card: string, background: string, accent: string}} ui  the colours (#rrggbb)
   * @property {Object} [theme]  the report theme (Power BI's theme JSON)
   * @property {Page[]} [pages]  the pages; or one page from page, pageName, slots and png
   * @property {{w: number, h: number}} [page]
   * @property {string} [pageName]
   * @property {Slot[]} [slots]
   * @property {Uint8Array} [png]
   * @property {{bytes: Uint8Array, ext: string}|null} [logo]  a png or jpg
   * @property {boolean} [sample]  the sample model and data (without model)
   * @property {{byPath: string, byConnection: string, names: Object<string, string[]>, taken: string[]}} [model]  the user's
   *   model: byPath (its .SemanticModel folder) or byConnection; names: each table's column and measure names (the
   *   report's own measures never take one); taken: report and .pbip names already in the folder
   * @property {Bind} [bind]  the fields (the sample's own with sample)
   * @property {Object<string, string>} [texts]  the report's words (design-engine REPORT_TEXTS): reset, resetTip, pages,
   *   close, filterPanel, openFilters, closeFilters, filtersOpen, filtersClosed, header, kpis, filters, slicer, logo,
   *   logoHere, textHere, by, detail, newDesign, noDataName, top6, tooltipPage, tooltipHere, readme ({name} is the report's)
   * @property {Array<{page: number, t: string, m: string, expression: string, expressionNoNumber: string, w: number, h: number}>} [svgColumns]
   *   report measures drawn as pictures in a page's first table
   * @property {Array<{card: number, t: string, m: string, expression: string, w: number, h: number}>} [svgCards]  a picture on the nth KPI card
   * @property {Object<string, string>} [subtitles]  a slot's role or title -> its subtitle
   * @property {string} [chartColors]  'gradient': bars fade by value
   * @property {string} [chartAxes]  'mirrored': right-to-left charts are mirrored
   * @property {boolean} [quietGrid]  quiet gridlines
   * @property {Array<{t: string, c: string, type: string, values: Array<boolean|string|number>, literals: string[]}>} [pageFilters]
   *   "is one of" filters on every report page: typed values (the writer writes Power BI's literals; type is the column's
   *   data type: boolean, string, int64 or double), or literals already written as Power BI writes them (checked)
   * @property {string} [kpiValues]  'full': the cards show the full number
   * @property {boolean} [noDataMessage]  false: no "No data" cards (on by default on a user's model)
   * @property {boolean} [smoothLines]  true: smooth (monotone) line charts; straight by default (P2)
   * @property {boolean} [logoPlaceholder]  false: no "Your logo" text without a logo
   *
   * @typedef {Object} BuildResult  the files, and what the writer did that its caller should tell (each a list of
   *   { page, ... } entries unless said)
   * @property {string} base  the report's name as written
   * @property {Array<{path: string, data: string|Uint8Array}>} files
   * @property {function(): Uint8Array} zip  the files as a zip
   * @property {Array} leftOut  visuals not written (no field for them, or a line chart's room given away: gave)
   * @property {{wrapped: Array, shortened: Array}} kpiTitles
   * @property {{wrapped: Array, shortened: Array, slicers: Array}} titles
   * @property {Array} tableOrder  tables put in calendar order by a helper column
   * @property {Array} tableRows  tables whose known rows don't fit
   * @property {Array} headerGrew  headers grown for a second row of tabs
   * @property {Array} tableSmaller  tables given a smaller text
   * @property {Array} tableWide  tables wider than their box even at 8pt
   * @property {Array} noDataSkipped  measures with no "No data" card (a control character)
   * @property {Object} svgSizes  each page's table picture size
   * @property {Array} noPageButtons  pages without page buttons (no room)
   * @property {Array} tableColumns  tables that hold fewer fields than given
   * @property {Array} rowLabels  the Arabic tables' row-label measures
   * @property {Array} rowLabelSkipped
   * @property {Array} extRenamed  report measures renamed because the model has the name
   * @property {Object} chartColors
   * @property {Object} chartAxes
   * @property {Array} tabRows  pages whose tabs take two or three rows
   * @property {Array} ringsSmall  ring pictures drawn without their number
   * @property {Array} shortDays  column charts that show Day Short
   * @property {Array} barCharts  column charts written as bar charts
   * @property {Array} kindChanges  every slot written as another kind than planned { page, pageIndex, role, from, to, topN } (rc.22, B-140)
   * @property {Array} blankKept  cards too narrow for the "No data" text
   * @property {string[]} subtitlesUsed
   * @property {Array} timeAxes  time axes ordered by their month start
   * @property {number} blankFiltered  charts given the "is not blank" filter
   * @property {{top: number, months: number}} tooltipLimits
   * @property {Array<{page: string, visuals: Array<{kind: string, fields: string[]}>}>} bound  what each written visual shows,
   *   page by page (A6-12): its fields as Table[Field] or Sum(Table[Field]), the helpers left out
   * @property {Array<{page: string, field: string, top: number}>} chartTops  category charts cut to their top N (rc1)
   */
  const KIND_NAMES = Object.keys(TYPES);
  const PBI_LITERAL = /^(true|false|null|'(?:[^']|'')*'|-?\d+L|-?\d+(\.\d+)?D)$/;
  // build's input checked against the contract above; every problem named at once (a TypeError)
  function checkBuild(o) {
    const bad = [], isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x), num = (x) => typeof x === 'number' && Number.isFinite(x);
    const opt = (k, test, what) => { if (o[k] != null && !test(o[k])) bad.push(k + ' must be ' + what); };
    if (!isObj(o)) throw new TypeError('build(o): o must be an object');
    ['name', 'title', 'font', 'pageName'].forEach((k) => opt(k, (x) => typeof x === 'string', 'a text'));
    opt('lang', (x) => x === 'en' || x === 'ar', "'en' or 'ar'");
    if (!isObj(o.ui) || !['text', 'card', 'background'].every((k) => HEX6.test(String(o.ui[k])))) bad.push('ui must hold the colours text, card and background as #rrggbb');
    opt('theme', isObj, 'an object (a Power BI theme)');
    opt('texts', (x) => isObj(x) && Object.values(x).every((v) => typeof v === 'string'), 'an object of texts');
    opt('subtitles', (x) => isObj(x) && Object.values(x).every((v) => typeof v === 'string'), 'an object of texts');
    opt('logo', (x) => isObj(x) && x.bytes instanceof Uint8Array && /^(png|jpe?g)$/i.test(String(x.ext)), 'null or { bytes, ext: png or jpg }');
    opt('model', (x) => isObj(x) && (typeof x.byPath === 'string' || typeof x.byConnection === 'string'), '{ byPath } or { byConnection }');
    opt('bind', isObj, 'an object of fields');
    const box = (x) => isObj(x) && num(x.x) && num(x.y) && num(x.w) && num(x.h);
    const pages = o.pages && o.pages.length ? o.pages : [{ page: o.page, slots: o.slots, png: o.png }], where = o.pages && o.pages.length ? (i) => 'pages[' + i + ']' : () => 'the page';
    if (o.pages != null && !Array.isArray(o.pages)) bad.push('pages must be a list');
    else pages.forEach((pg, i) => {
      if (!isObj(pg)) return void bad.push(where(i) + ' must be an object');
      if (!isObj(pg.page) || !(pg.page.w > 0) || !(pg.page.h > 0)) bad.push(where(i) + ': page must be { w, h }' + (o.pages ? '' : ' (or give pages)'));
      if (!Array.isArray(pg.slots)) bad.push(where(i) + ': slots must be a list');
      else pg.slots.forEach((s, j) => { if (!box(s) || !KIND_NAMES.includes(s.kind)) bad.push(where(i) + ': slots[' + j + '] must be { kind, x, y, w, h } with a kind of ' + KIND_NAMES.join(', ') + ' (' + JSON.stringify(isObj(s) ? s.kind : s) + ')'); });
      if (pg.png != null && !(pg.png instanceof Uint8Array) && typeof pg.png !== 'string') bad.push(where(i) + ': png must be the image\'s bytes');
      if (pg.panel != null && !box(pg.panel)) bad.push(where(i) + ': panel must be { x, y, w, h }');
    });
    (['svgColumns', 'svgCards']).forEach((k) => opt(k, (x) => Array.isArray(x) && x.every((c) => isObj(c) && typeof c.t === 'string' && typeof c.m === 'string' && typeof c.expression === 'string'), 'a list of { t, m, expression }'));
    if (o.pageFilters != null) {
      if (!Array.isArray(o.pageFilters)) bad.push('pageFilters must be a list');
      else o.pageFilters.forEach((f, i) => {
        const at = 'pageFilters[' + i + ']';
        if (!isObj(f) || typeof f.t !== 'string' || typeof f.c !== 'string') return void bad.push(at + ' must be { t, c, values }');
        if (Array.isArray(f.values)) { if (!f.values.length || f.values.some((v) => pfLiteral(v, f.type) == null)) bad.push(at + ': every value must be ' + ({ boolean: 'true or false', text: 'a text', whole: 'a whole number', decimal: 'a plain number' }[PF_KINDS[String(f.type || '').toLowerCase()]] || 'true, false, a text or a plain number') + ' (' + JSON.stringify(f.values).slice(0, 80) + ')'); }
        else if (Array.isArray(f.literals)) { if (!f.literals.length || f.literals.some((v) => typeof v !== 'string' || !PBI_LITERAL.test(v))) bad.push(at + ': a literal must be written as Power BI writes one (true, \'text\', 5L, 5.5D): ' + JSON.stringify(f.literals).slice(0, 80)); }
        else bad.push(at + ' must have values');
      });
    }
    if (bad.length) throw new TypeError('build(o): ' + bad.join('; '));
  }
  // The report's name as written (its folder and files) and the user's model folder's name (theirs), from o.name: the
  // same for build and fitOptions
  function nameOf(o, W) {
  // (a name over the limit ends at its last whole word: cut at the last space before the limit, and a dash or
  // other joining mark left at the end goes too; one word longer than the limit is cut at the limit)
  // cut by characters, not UTF-16 units, so an emoji at the cut is never split into a broken file name; at most 30,
  // because the name appears up to three times in a path and Windows limits paths to 260 characters
  // no dots or spaces at either end: ".." would climb out of the folder, and Windows drops a trailing dot or space
  const tidy = (s) => s.replace(/^[.\s]+|[.\s]+$/g, '');
  // format characters first (Unicode category Cf: direction overrides and marks, zero-width characters, the byte
  // order mark): nobody sees them, and one can make a file name read as another ("Report" + U+202E + "xcod.exe"
  // shows as "Reportexe.docx"). They are taken out of the name before anything else.
  const whole = Array.from(tidy(String(o.name || 'Power BI Report').replace(/\p{Cf}/gu, '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ')));
  let cut = whole.slice(0, 30).join('');
  if (whole.length > 30 && whole[30] !== ' ' && cut.lastIndexOf(' ') > 0) cut = cut.slice(0, cut.lastIndexOf(' '));
  if (whole.length > 30) cut = cut.replace(/[\s\-\u2013\u2014\u00b7:,;&+]+$/, '');
  // (night audit AUD-035) a Windows device name (CON, PRN, AUX, NUL, COM1-9, LPT1-9) before the first dot is no file
  // name on Windows ("CON.pbip", "nul.tar.Report" are the device): it gets "_" after it, as design-engine.js's themes
  let base = (tidy(cut) || 'Power BI Report').replace(/^(con|prn|aux|nul|com[0-9\u00b9\u00b2\u00b3]|lpt[0-9\u00b9\u00b2\u00b3])(?=\.|\s*$)/i, '$1_');
  // next to someone's project: never the name of a report already there (o.model.taken: their X.Report folders and
  // X.pbip files), nor the model's own name, which their first report usually has
  const theirs = o.model && o.model.byPath ? String(o.model.byPath).replace(/^.*\//, '').replace(/\.(SemanticModel|Dataset)$/i, '') : null;
  if (theirs) {
    const taken = new Set([theirs].concat(o.model.taken || []).map((n) => String(n).toLowerCase())), b0 = base;
    for (let n = 1; taken.has(base.toLowerCase()); n++) base = b0 + ' - ' + (W.newDesign || 'New design') + (n > 1 ? ' ' + n : '');
  }
    return { base, theirs };
  }
  // 0.2.9, audit 2's A2-3: the options of the design engine's fitSlots for each page of a report, as build fits them
  // (pbip-page.js fitOf; pure): the website draws its background from them and plan_layout plans with them, so both show
  // the slots the report gets. o: build's input (the pages' png not needed)
  function fitOptions(o) {
    const lang = o.lang === 'ar' ? 'ar' : 'en', rtl = !!o.rtl, font = o.font || 'Segoe UI', W = o.texts || {};
    const own = !!(o.model && (o.model.byPath || o.model.byConnection)), sample = !!o.sample && !own, B = own ? (o.bind || null) : sample ? sampleBind(T[lang]) : null;
    const PAGES = o.pages && o.pages.length ? o.pages : [{ name: o.pageName, page: o.page, slots: o.slots }], { base } = nameOf(o, W);
    const ts = Page.themeSizes(o), c = Object.assign({ o, B, own, PAGES, base, rtl, font, W }, ts, Sizing.make({ font, LABEL: ts.LABEL }));
    return PAGES.map((pg) => Page.fitOf(c, pg));
  }
  /** @param {BuildInput} o @returns {BuildResult} */
  function build(o) {
    checkBuild(o);
    // (0.3, J7) the report theme's data colours at 3:1 on the card before anything reads them (design-engine toContrast;
    // a colour already at 3:1 is kept exactly): every chart, fade and second colour below is chosen from these
    const themeCard = ((((((((o.theme || {}).visualStyles || {})['*'] || {})['*'] || {}).background || [])[0] || {}).color || {}).solid || {}).color;
    const readable = A11y.readable(o.theme, ((o.ui || {}).card) || themeCard);
    if (readable.changed.length) o = Object.assign({}, o, { theme: readable.theme });
    const lang = o.lang === 'ar' ? 'ar' : 'en', t = T[lang], rtl = !!o.rtl, u = o.ui, font = o.font || 'Segoe UI';
    const W = o.texts || {};
    // the data: the sample table, the user's own model (o.model: { byPath } or { byConnection }), or none
    const own = !!(o.model && (o.model.byPath || o.model.byConnection));
    const sample = !!o.sample && !own;
    const B = own ? (o.bind || null) : sample ? sampleBind(t) : null;
    // the notes: what the writer did that its caller should tell (pbip-notes.js)
    const n = Notes.make(o), { noData, rowLabels, timeExt } = n;
    // bars that fade by value (o.chartColors 'gradient', round 13): the two ends, or null when the colour cannot fade
    const barBase = ((o.theme || {}).dataColors || [])[0] || (u || {}).accent, GRAD = o.chartColors === 'gradient' && u ? Engine.fadeEnds(barBase, u.card) : null;   // (P3, N25: the strong end is the colour itself, never past it)
    // (polish round P1, RESCORE-5: bank's deep teal, its colour 2, never appeared) the second bar or column chart of a
    // page fades in colour 2, the third in colour 1 again (pbip-page.js counts them in reading order)
    // (P1+, LAB-POLISH section 5) the second chart's colour is chosen, a distinct hue at 3:1 on the card (secondColour)
    // (P3, N26: never a red or status colour, the design's good/neutral/bad included)
    const bar2 = GRAD ? Engine.secondColour([barBase].concat(((o.theme || {}).dataColors || []).slice(1)), u.card, u) : null, GRAD2 = GRAD && bar2 && String(bar2).toLowerCase() !== String(barBase).toLowerCase() ? Engine.fadeEnds(bar2, u.card) : null;
    const chartColors = { asked: o.chartColors === 'gradient', ends: GRAD, base: barBase, charts: 0, ends2: GRAD2, base2: GRAD2 ? bar2 : null, second: 0, keys: {} };
    // charts mirrored for a right-to-left report (o.chartAxes 'mirrored', round 13; see mirrorChart)
    const MIRROR = rtl && o.chartAxes === 'mirrored', chartAxes = { asked: o.chartAxes || null, rtl, charts: 0 };
    // Quiet gridlines (o.quietGrid, round 13; seen in Desktop 2.158 on 6 Oct, "GE EN dark": on a dark design the value
    // axis's gridlines were near-white lines across the panel, louder than the data; with valueAxis.gridlineColor written
    // on the chart they are quiet): the text colour mixed 85% into the card, on the report's line, bar and column
    // charts, unless the theme sets its own gridlines (its chart style "dotted" or "off").
    const themeGrid = ['lineChart', 'clusteredBarChart', 'clusteredColumnChart'].some((t) => { const va = (((((o.theme || {}).visualStyles || {})[t] || {})['*'] || {}).valueAxis || [])[0]; return !!va && ('gridlineShow' in va || 'gridlineColor' in va); });
    const GRID = o.quietGrid && u && HEX6.test(String(u.text)) && HEX6.test(String(u.card)) && !themeGrid ? mixHex(u.text, u.card, 0.85) : null;
    const NODATA = own && o.noDataMessage !== false;   // on by default since round 22 (the owner's rule: every part passed in Desktop on the night of 6-7 Oct); noDataMessage: false leaves it out
    const { base, theirs } = nameOf(o, W);
    const slug = base.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'report';
    const R = base + '.Report', M = base + '.SemanticModel', D = R + '/definition';
    const themeFile = slug + '-theme.json', logoFile = o.logo ? slug + '-logo.' + o.logo.ext : null;
    // pages: the main page first; each has its own layout and background image
    const PAGES = (o.pages && o.pages.length ? o.pages : [{ name: o.pageName, page: o.page, slots: o.slots, png: o.png }])
      .map((pg, i) => Object.assign({}, pg, { id: rnd(), bgFile: slug + '-background' + (i ? '-' + (i + 1) : '') + '.png' }));
    const files = [];
    // a report for a local model is unzipped into the user's project folder, so it has no folder of its own
    const add = (path, data) => files.push({ path: (theirs ? '' : base + '/') + path, data });
    const align = rtl ? 'right' : 'left';
    const edge = mixHex(u.text, u.card, 0.85);

    // project shortcut, report pointer, semantic model
    add(base + '.pbip', json({ $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } }));
    const datasetRef = own ? (o.model.byPath ? { byPath: { path: '../' + String(o.model.byPath).replace(/^.*\//, '') } } : { byConnection: { connectionString: o.model.byConnection } })
      : { byPath: { path: '../' + M } };
    add(R + '/definition.pbir', json({ $schema: SCHEMA.pbir, version: '4.0', datasetReference: datasetRef }));
    // the item metadata Power BI Desktop and Fabric keep next to each item (as Microsoft's own scaffold writes it)
    const platform = (type) => json({ $schema: SCHEMA.platform, metadata: { type, displayName: base }, config: { version: '2.0', logicalId: guid() } });
    add(R + '/.platform', platform('Report'));
    if (!own) add(M + '/.platform', platform('SemanticModel'));
    if (!own) add(M + '/definition.pbism', json({ $schema: SCHEMA.pbism, version: '4.0', settings: {} }));
    const culture = 'en-US';   // data and names can be Arabic; en-US keeps number and date parsing predictable
    if (!own) add(M + '/model.bim', json({
      compatibilityLevel: 1567,
      model: {
        culture, dataAccessOptions: { legacyRedirects: true, returnErrorValuesAsNull: true }, defaultPowerBIDataSourceVersion: 'powerBI_V3', sourceQueryCulture: culture,
        tables: sample ? [sampleModel(t)] : [],
        annotations: [{ name: '__PBI_TimeIntelligenceEnabled', value: '0' }, { name: 'PBI_ProTooling', value: '["DevMode"]' }]
      }
    }));

    // resources: the theme, the background, the logo
    // inside a project the theme carries the name report.json references, its file name with .json (Microsoft's
    // theming reference: customTheme.name, the registered item's name and path and the theme's own "name" must be equal)
    // P3-3 (N21, C5; measured in Desktop 2.158, N21-LAB.md): with a Segoe UI Semibold theme a table or matrix total was not
    // bold (Power BI's bold label takes the label's face, a bold weight of Semibold). "Segoe UI Bold" alone draws bold in a
    // serif fallback; the full font string draws true Segoe UI Bold on screen and in the PDF, and survives Save. One line in
    // the theme's boldLabel covers every total; a theme's own boldLabel is kept. Bold does not move the rows (N21-LAB).
    const tc = (o.theme && o.theme.textClasses) || {}, semibold = /semibold/i.test(String((tc.label || {}).fontFace || o.font || ''));
    const themeOut = semibold && !tc.boldLabel ? Object.assign({}, o.theme, { textClasses: Object.assign({}, tc, { boldLabel: { fontFace: BOLD_TOTAL } }) }) : o.theme;
    add(R + '/StaticResources/RegisteredResources/' + themeFile, json(Object.assign({}, themeOut, { name: themeFile })));
    PAGES.forEach((pg) => add(R + '/StaticResources/RegisteredResources/' + pg.bgFile, pg.png));
    if (logoFile) add(R + '/StaticResources/RegisteredResources/' + logoFile, o.logo.bytes);
    const items = [{ name: themeFile, path: themeFile, type: 'CustomTheme' }].concat(PAGES.map((pg) => ({ name: pg.bgFile, path: pg.bgFile, type: 'Image' })));
    if (logoFile) items.push({ name: logoFile, path: logoFile, type: 'Image' });

    add(D + '/version.json', json({ $schema: SCHEMA.version, version: '2.0.0' }));
    add(D + '/report.json', json({
      $schema: SCHEMA.report,
      themeCollection: { customTheme: { name: themeFile, reportVersionAtImport: '5.61', type: 'RegisteredResources' } },
      objects: { outspacePane: obj({ expanded: bool(true), visible: bool(true) }) },
      resourcePackages: [{ name: 'RegisteredResources', type: 'RegisteredResources', items }],
      settings: {
        useStylableVisualContainerHeader: true, useEnhancedTooltips: true, defaultDrillFilterOtherVisuals: true, allowChangeFilterTypes: true,
        useDefaultAggregateDisplayName: true, isPersistentUserStateDisabled: false, exportDataMode: 'AllowSummarized'
      },
      annotations: [{ name: 'generatedBy', value: 'DataArcus Power BI Theme & Layout Generator (dataarcus.com)' }]
    }));

    // pages
    const tipName = rnd(), tipBinding = rnd(), bookmarks = [];
    // Two tooltip pages when the bind has a month (tip.date): the trend page shows the hovered item's measure by month,
    // and is linked from every chart that is not itself by that month; a chart by month (the line chart) keeps the page
    // with the bar chart by category, where a monthly trend would be a single bar.
    const tip = B && B.tip && B.tip.card && B.tip.cat && B.tip.y ? B.tip : null;
    const trend = tip && tip.date ? { name: rnd(), binding: rnd() } : null;
    const same = (a, b) => !!a && !!b && a.t === b.t && a.c != null && a.c === b.c;
    // (the laptop's second sweep of rc.1, T4 and T5: one tooltip page showed the picker's second measure under the hovered
    // chart's, and a chart by the tooltip's own category got a "Top 6" of one bar.) A tooltip page is made for each
    // measure a chart shows and each category it is shown by: the card and the bars are the hovered chart's own measure,
    // the bars by a category other than the chart's own (or by month, the trend). tipFor gives the page, made once; the
    // first of each kind keeps the names tipName and trend.name. The pages are written by Page.tooltips.
    const sameField = (a, b) => !!a && !!b && a.t === b.t && a.c === b.c && a.m === b.m && (a.agg || null) === (b.agg || null);
    const tipPages = [];
    const tipFor = (kind, m, cat) => { let t = tipPages.find((x) => x.kind === kind && sameField(x.m, m) && sameField(x.cat, cat));
      if (!t) { const first = !tipPages.some((x) => x.kind === kind);
        t = { kind, m, cat, name: first ? (kind === 'trend' ? trend.name : tipName) : rnd(), binding: first ? (kind === 'trend' ? trend.binding : tipBinding) : rnd() };
        tipPages.push(t); }
      return t; };
    add(D + '/pages/pages.json', '');
    const pagesFile = files[files.length - 1];

    // 0.2.9, audit 3's A3-12: the context the writer's modules share (pbip-query.js, pbip-sizing.js, pbip-page.js): this
    // report's settings, its files, and its notes; then the report's own measures and the visuals' look
    const c = Object.assign({
      B, D, GRAD, GRAD2, GRID, MIRROR, NODATA, PAGES, W, add, align, base, bookmarks,
      chartAxes, chartColors, edge, font, lang, logoFile, o, own, rtl, same, sameField, tip, tipBinding,
      tipFor, tipName, tipPages, trend, u, n
    }, n);
    Object.assign(c, Query.measures(c));
    Object.assign(c, Page.kit(c));

    // Report-level measures (o.svgColumns: [{ page, t, m, expression }]): definition/reportExtensions.json, in the shape
    // Desktop accepted in D-P1: one entity per model table, each measure a text with the data category Image URL.
    // The model is not touched: these measures exist only in the report.
    const svgDone = {};
    let extFile = null;   // reportExtensions.json, written again after the pages when a ring picture drops its number (round 18)
    if ((o.svgColumns || []).length || (o.svgCards || []).length) {
      const entities = [];
      (o.svgColumns || []).concat(o.svgCards || []).forEach((c) => { let e = entities.find((x) => x.name === c.t); if (!e) entities.push(e = { name: c.t, measures: [] }); e.measures.push({ name: c.m, dataType: 'Text', dataCategory: 'ImageUrl', expression: c.expression }); });
      add(D + '/reportExtensions.json', json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities }));
      extFile = { entry: files[files.length - 1], entities };
    }
    Object.assign(c, { svgDone, extFile });

    // the report's pages (pbip-page.js)
    PAGES.forEach((pg, pageIndex) => Page.write(c, pg, pageIndex));

    // Reset buttons: one data-only bookmark per page that brings that page's slicers back to "All"
    if (bookmarks.length) {
      bookmarks.forEach((b) => add(D + '/bookmarks/' + b.name + '.bookmark.json', json(b.group
        ? { $schema: SCHEMA.bookmark, displayName: b.label, name: b.name,
            options: { targetVisualNames: b.targets, applyOnlyToTargetVisuals: true, suppressData: true, suppressActiveSection: true },
            explorationState: { version: '1.3', activeSection: b.page, sections: { [b.page]: {
              visualContainers: Object.fromEntries(b.targets.filter((n) => n !== b.group).map((n) => [n, {}])),
              visualContainerGroups: { [b.group]: { isHidden: b.hidden } } } } } }
        : { $schema: SCHEMA.bookmark, displayName: b.label, name: b.name,
            options: { targetVisualNames: b.targets, applyOnlyToTargetVisuals: true, suppressDisplay: true, suppressActiveSection: true },
            explorationState: { version: '1.3', activeSection: b.page, sections: { [b.page]: { visualContainers: Object.fromEntries(b.targets.map((n) => [n, {}])) } } } })));
      add(D + '/bookmarks/bookmarks.json', json({ $schema: SCHEMA.bookmarks, items: bookmarks.map((b) => ({ name: b.name })) }));
    }

    // the tooltip pages (pbip-page.js); six: the trend kept to its last 6 months
    const six = Page.tooltips(c);
    pagesFile.data = json({ $schema: SCHEMA.pages, pageOrder: PAGES.map((pg) => pg.id).concat(tip ? tipPages.filter((t) => t.kind === 'cat').concat(tipPages.filter((t) => t.kind === 'trend')).map((t) => t.name) : [tipName]), activePageName: PAGES[0].id });

    // the "No data" measures (round 19): into the report's extensions, beside the SVG measures where there are some
    // (round 23: and the tables' row-label measures after them)
    // (0.2.9 part 2: and the time axes' measures, DateTime and Integer; written after the tooltip pages, which add some)
    if (noData.length || rowLabels.length || timeExt.length) {
      const ents = extFile ? extFile.entities : [];
      noData.concat(rowLabels, timeExt).forEach((c) => { let e = ents.find((x) => x.name === c.t); if (!e) ents.push(e = { name: c.t, measures: [] }); e.measures.push({ name: c.m, dataType: c.dataType || 'Text', expression: c.expression }); });
      if (extFile) extFile.changed = true; else add(D + '/reportExtensions.json', json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: ents }));
    }
    if (extFile && extFile.changed) extFile.entry.data = json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: extFile.entities });

    // git: keep local and cached files out of source control
    // in someone's project folder these would replace their own files, so they are left out there
    if (!theirs) {
      add('.gitignore', '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n');
      add('README.md', (W.readme || '').replace(/\{name\}/g, base));
    }
    // (0.3, J7) alt text from each data visual's role and fields, tab stops in reading order, decorative parts out of it
    const a11y = Object.assign(A11y.apply(files.filter((f) => typeof f.data === 'string'), { lang, rtl }), { colours: readable.changed, card: readable.card || null });
    return Notes.result(n, { a11y, base, files, zip: () => zip(files), chartColors, chartAxes, tooltipLimits: { top: tip && tipPages.some((t) => t.kind === 'cat' && t.cat.c != null && t.cat.agg == null && !isTime(t.cat)) ? 6 : null, months: six ? 6 : null } });
  }


  // AR_MONTHS: the one Arabic month list (the cross-review's duplicates: the twin uses it too)
  const api = { build, zip, crc32, textWidth, columnRoom, cellRoom, hasControl, daxNames, pageFilterOf, fitOptions, timeAxisPlan, barNameShare, AR_MONTHS: T.ar.months.slice() };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbip = api;
})(typeof self !== 'undefined' ? self : this);
