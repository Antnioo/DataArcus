/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// Builds a Power BI project (PBIP) with the report in the PBIR format: theme applied, page background set,
// and a visual placed in every slot of the layout. Everything runs in the browser; nothing is uploaded.
// The result is a zip (stored, no compression) that the visitor unzips and opens in Power BI Desktop.
(function (root) {
  'use strict';

  // Schema versions from mid-2025, so the project also opens in Power BI Desktop builds that are about a year old
  const S = 'https://developer.microsoft.com/json-schemas/fabric/';
  const SCHEMA = {
    pbip: S + 'pbip/pbipProperties/1.0.0/schema.json',
    pbir: S + 'item/report/definitionProperties/2.0.0/schema.json',
    pbism: S + 'item/semanticModel/definitionProperties/1.0.0/schema.json',
    version: S + 'item/report/definition/versionMetadata/1.0.0/schema.json',
    report: S + 'item/report/definition/report/2.1.0/schema.json',
    pages: S + 'item/report/definition/pagesMetadata/1.0.0/schema.json',
    page: S + 'item/report/definition/page/2.0.0/schema.json',
    visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json',
    mobile: S + 'item/report/definition/visualContainerMobileState/2.1.0/schema.json',
    bookmark: S + 'item/report/definition/bookmark/1.4.0/schema.json',
    bookmarks: S + 'item/report/definition/bookmarksMetadata/1.0.0/schema.json',
    platform: S + 'gitIntegration/platformProperties/2.0.0/schema.json'
  };

  // ---------- small helpers ----------
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'");
  const S0 = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : '');
  const bool = (b) => lit(b ? 'true' : 'false');
  const num = (n) => lit(n + 'D');
  const color = (hex) => ({ solid: { color: str(hex) } });
  const obj = (props, selector) => (selector ? [{ properties: props, selector }] : [{ properties: props }]);
  const resource = (item) => ({ expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: item } } });
  const json = (o) => JSON.stringify(o, null, 2);
  const rnd = () => {
    const b = new Uint8Array(10);
    if (root.crypto && root.crypto.getRandomValues) root.crypto.getRandomValues(b); else for (let i = 0; i < 10; i++) b[i] = Math.floor(Math.random() * 256);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  };
  // a random GUID (version 4), for a .platform file's logicalId
  const guid = () => {
    const h = (rnd() + rnd()).slice(0, 32).split('');
    h[12] = '4'; h[16] = '89ab'[parseInt(h[16], 16) % 4];
    return [h.slice(0, 8), h.slice(8, 12), h.slice(12, 16), h.slice(16, 20), h.slice(20, 32)].map((p) => p.join('')).join('-');
  };
  // The width of one line of text in page units (measured in Power BI Desktop 2.158, DESKTOP-TESTS.md round 10): the
  // width depends on the letters, not on their count ("Executive summary" 0.49 em a character, "Reset filters" 0.38),
  // so Latin text is added up from Segoe UI's letter widths (within 5% of the measured widths, on the safe side), bold
  // is 1.09 x, and an Arabic letter counts 0.55 em (0.62 bold; Tahoma measured 0.53 and up to 0.60). 3% is added.
  const LETTER = { a: 0.51, b: 0.59, c: 0.46, d: 0.59, e: 0.52, f: 0.31, g: 0.59, h: 0.57, i: 0.24, j: 0.24, k: 0.5, l: 0.24, m: 0.86, n: 0.57, o: 0.59, p: 0.59, q: 0.59, r: 0.35, s: 0.42, t: 0.34, u: 0.57, v: 0.48, w: 0.72, x: 0.46, y: 0.48, z: 0.45,
    A: 0.65, B: 0.57, C: 0.62, D: 0.7, E: 0.51, F: 0.49, G: 0.69, H: 0.71, I: 0.27, J: 0.36, K: 0.58, L: 0.47, M: 0.9, N: 0.75, O: 0.75, P: 0.56, Q: 0.75, R: 0.6, S: 0.53, T: 0.52, U: 0.69, V: 0.62, W: 0.93, X: 0.59, Y: 0.55, Z: 0.57,
    ' ': 0.27, '.': 0.22, ',': 0.22, ':': 0.22, ';': 0.22, '\'': 0.2, '!': 0.28, '|': 0.24, '-': 0.4, '(': 0.3, ')': 0.3, '/': 0.39, '&': 0.8, '%': 0.82, '+': 0.68, '·': 0.22 };
  // Round 13 (measured in Desktop 2.158, 6 Oct 2026, "R12 CI AR 1080": bold 17pt titles in Tahoma, ink in page units):
  // Latin text in Tahoma is wider than the Segoe UI table gives ("Total Sales" 123.7 for 119.4 worked out, "Conversion
  // Rate" 185.2 for 183.0), and "Growth vs Last Year", worked out at 219.9 for a room of 220, was cut by Desktop. So
  // Latin letters, digits and marks count 6% more in Tahoma (TAHOMA_LATIN); Arabic letters were measured in Tahoma.
  const TAHOMA_LATIN = 1.06;
  function textWidth(text, t, bold, font) {
    let em = 0;
    const wide = /tahoma/i.test(String(font || '')) ? TAHOMA_LATIN : 1;
    for (const ch of String(text == null ? '' : text)) {
      const c = ch.codePointAt(0);
      if (c === 0x200E || c === 0x200F) continue;   // direction marks have no width
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB50 && c <= 0xFEFF)) em += bold ? 0.62 : 0.55;
      else if (c >= 0x30 && c <= 0x39) em += 0.54 * (bold ? 1.09 : 1) * wide;
      else if (LETTER[ch] != null) em += LETTER[ch] * (bold ? 1.09 : 1) * wide;
      else em += (c < 0x2000 ? 0.62 : 1) * (bold ? 1.09 : 1) * wide;
    }
    return em * t * 4 / 3 * 1.03;
  }
  // A text shortened with "…" (KPI, chart and table titles, slicer headers). Round 13 (seen in Desktop 2.158, 6 Oct
  // 2026, "G6 Long AR" on round 12's titles): after Arabic words the "…" was drawn at the right end of the line, the
  // reading start, so the title looked cut at its beginning (a visual's title is a left-to-right paragraph, and a
  // closing mark with no direction of its own goes to that paragraph's end). With a right-to-left mark (U+200F)
  // after it the "…" was drawn at the left, where the Arabic line ends. Latin text gets none.
  const cutAt = (s) => s + '…' + (/[\u0590-\u08FF\uFB1D-\uFEFC]/.test(s) ? '\u200F' : '');
  // contrast of two colours (WCAG): the page's marks keep the accent colour only where it can be read on the card
  const lum = (hex) => { const v = [1, 3, 5].map((i) => parseInt(String(hex).slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4))); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mixHex = (a, b, t) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const A = p(a), B = p(b);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
  };

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
      months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'], cats: ['إلكترونيات', 'المنزل', 'أزياء', 'رياضة'], regions: ['دبي', 'أبوظبي', 'الشارقة', 'عجمان'],
      m: { rev: 'إجمالي الإيرادات', ord: 'إجمالي الطلبات', aov: 'متوسط قيمة الطلب', mar: 'هامش الربح %', cus: 'إجمالي العملاء', rpc: 'الإيراد لكل عميل' } }
  };
  const dq = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const ref = (t, c) => "'" + t.replace(/'/g, "''") + "'[" + c.replace(/]/g, ']]') + ']';
  function sampleModel(t) {
    const rows = [];
    t.months.forEach((mo, mi) => t.cats.forEach((ca, ci) => {
      const base = 42000 + ci * 9000 + mi * 1800 + ((mi * 7 + ci * 13) % 9) * 1500, orders = Math.round(base / (180 + ci * 35));
      rows.push('{' + [dq(mo), mi + 1, dq(ca), dq(t.regions[(mi + ci) % 4]), base, Math.round(base * (0.58 + ci * 0.04)), orders, Math.round(orders * 0.72)].join(', ') + '}');
    }));
    const tb = t.table, col = (name, dataType, extra) => Object.assign({ type: 'calculatedTableColumn', name, dataType, isNameInferred: true, isDataTypeInferred: true, sourceColumn: '[' + name + ']' }, extra || {});
    const expr = 'DATATABLE(' + [dq(t.month), 'STRING', dq(t.monthNo), 'INTEGER', dq(t.category), 'STRING', dq(t.region), 'STRING', dq(t.revenue), 'DOUBLE', dq(t.cost), 'DOUBLE', dq(t.orders), 'INTEGER', dq(t.customers), 'INTEGER'].join(', ') + ', {' + rows.join(', ') + '})';
    const R = ref(tb, t.revenue), m = t.m;
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
        { name: m.ord, expression: 'SUM(' + ref(tb, t.orders) + ')', formatString: '#,0' },
        { name: m.aov, expression: 'DIVIDE([' + m.rev + '], [' + m.ord + '])', formatString: '#,0.0' },
        { name: m.mar, expression: 'DIVIDE(SUM(' + R + ') - SUM(' + ref(tb, t.cost) + '), SUM(' + R + '))', formatString: '0.0%' },
        { name: m.cus, expression: 'SUM(' + ref(tb, t.customers) + ')', formatString: '#,0' },
        { name: m.rpc, expression: 'DIVIDE([' + m.rev + '], [' + m.cus + '])', formatString: '#,0' }
      ]
    };
  }

  // field references for visual queries
  const fieldCol = (t, c) => ({ field: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, queryRef: t + '.' + c, nativeQueryRef: c });
  const fieldMea = (t, m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m });
  const q = (roles) => { const st = {}; Object.keys(roles).forEach((r) => { st[r] = { projections: roles[r] }; }); return { queryState: st }; };
  // a bound field: { t: table, c: column } or { t: table, m: measure }, with an optional display name (name): the
  // report then shows that name wherever it shows the field (legend, axis titles, table headers, slicer headers:
  // the projection's displayName; measured in Desktop 2.158, DESKTOP-TESTS.md round 2) and in the titles written
  // here. The model is not renamed, and queryRef stays the field's own.
  const fname = (f) => (f.m != null ? f.m : f.c);
  // Round 12 (#25): a model without measures still gets numbers: a column counted or summed by the visual itself (what
  // Desktop writes when a column is dropped on a value well), f.agg being Microsoft's QueryAggregateFunction (semantic
  // query schema: 0 Sum, 2 Distinct count, 5 Count of the non-null values). Such a field is a value, like a measure.
  const AGG = { 0: ['Sum', 'Sum of '], 2: ['Count', 'Count of '], 5: ['CountNonNull', 'Count of '] };
  const fieldAgg = (t, c, fn) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: t } }, Property: c } }, Function: fn } },
    queryRef: (AGG[fn] || ['Agg'])[0] + '(' + t + '.' + c + ')', nativeQueryRef: (AGG[fn] || ['', ''])[1] + c });
  const isValue = (f) => !!f && (f.m != null || f.agg != null);
  const proj = (f) => Object.assign(f.agg != null ? fieldAgg(f.t, f.c, f.agg) : f.m != null ? fieldMea(f.t, f.m) : fieldCol(f.t, f.c), f.name ? { displayName: String(f.name) } : {});
  const tproj = (f) => Object.assign(proj(f), f.tableFormat ? { format: String(f.tableFormat) } : {});
  const label = (f) => (f ? (f.name ? String(f.name) : fname(f)) : null);
  // The room a table column takes beside SVG pictures, in page units, at the table's text size t: its header (bold) or
  // its widest value, + 10 (a cell's padding is not measured yet: the measured button rule, 5 a side, stands in). A
  // measure's widest value is taken as nine digits with separators ("888,888,888", 0.54 em a digit and 0.21 a
  // separator, measured in round 10); a column's values are not known to the writer, so 12 letters at 0.55 em.
  const columnRoom = (p, t, font) => {
    const head = textWidth(p.displayName || p.nativeQueryRef || '', t, true, font);
    const value = p.field && (p.field.Measure || p.field.Aggregation) ? (9 * 0.54 + 2 * 0.21) * t * 4 / 3 : 12 * 0.55 * t * 4 / 3;
    return Math.ceil(Math.max(head, value) + 10);
  };

  // what each slot becomes in Power BI, and the sample fields it shows; cards are the card visual (cardVisual): Microsoft
  // deprecates the legacy "card"
  const TYPES = { kpi: 'cardVisual', card: 'cardVisual', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx',
    gauge: 'gauge', funnel: 'funnel', treemap: 'treemap', map: 'map', text: 'textbox', slicer: 'slicer', title: 'textbox', logo: 'image', matrix: 'pivotTable' };
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
  // the kinds of slot that are charts (they show the tooltip page on hover)
  const CHARTS = ['line', 'bar', 'column', 'donut', 'funnel', 'treemap', 'map'];
  // Months and weekdays in order (round 2; measured in Desktop 2.158, DESKTOP-TESTS.md round 2): a category whose bound
  // field says which number column puts it in order (f.sortBy, from the field picker: a month or day name without a
  // sort-by column in the model) gets Min of that column in the chart's Tooltips role and a sort by it. A chart only
  // sorts by a field that is in it, and our charts show a report page tooltip, so the number is never seen. The model
  // is not touched; tables and slicers can't do this and follow the model.
  const sorted = (query, f) => {
    if (!query || !f || !f.sortBy) return query;
    const field = { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: f.sortBy.t } }, Property: f.sortBy.c } }, Function: 3 } };
    query.queryState.Tooltips = { projections: [{ field, queryRef: 'Min(' + f.sortBy.t + '.' + f.sortBy.c + ')', nativeQueryRef: 'Min of ' + f.sortBy.c }] };
    query.sortDefinition = { sort: [{ field, direction: 'Ascending' }], isDefaultSort: true };
    return query;
  };
  // Round 13 (the owner's ask, 6 Oct 2026; measured in Desktop 2.158, DESKTOP-TESTS.md "round 13, item 1"): the bars of
  // a bar or column chart fade by their value. It is the data colour's conditional formatting: dataPoint.fill as a
  // FillRule (linearGradient2) on the chart's own measure, for every data point. Desktop drew the smallest bar exactly
  // the low colour and the largest exactly the high one, in English and Arabic alike. The ends are written as colours,
  // not as ThemeDataColor: "60% lighter" there goes towards white, so on a dark design the smallest bar came out the
  // brightest. The high end is the bars' colour today (the theme's first data colour); the low end is that colour
  // mixed towards the card as far as it still stands 3:1 off the card (60% at most), so the smallest bar never fades
  // into its panel. A colour that cannot fade by 15% and keep 3:1 gets no rule (null). A bar has no gradient fill of
  // its own in Desktop 2.158 (dataPoint holds fill, fillRule, fillTransparency and the border only).
  const HEX6 = /^#[0-9a-f]{6}$/i;
  // Round 15 (the owner's go on round 13's recommendation 3, 6 Oct 2026): a colour too close to its card to fade
  // towards it (golden task 1: #0F6CBD on the dark DataArcus card, 3.2:1) fades the other way: the smallest bar is the
  // colour itself and the largest a brighter tint of it, mixed 40% towards the text colour (further off the card), so
  // every bar still stands 3:1 off the card (reversed: true). A colour under 3:1 itself gets no rule (null).
  const gradientEnds = (base, card, text) => {
    if (!HEX6.test(String(base)) || !HEX6.test(String(card))) return null;
    for (let n = 12; n >= 3; n--) { const low = mixHex(base, card, n / 20); if (contrast(low, card) >= 3) return { low, high: String(base).toLowerCase() }; }
    if (HEX6.test(String(text)) && contrast(base, card) >= 3) { const high = mixHex(base, text, 0.4); if (contrast(high, card) > contrast(base, card)) return { low: String(base).toLowerCase(), high, reversed: true }; }
    return null;
  };
  const gradientFill = (input, ends) => [{
    properties: { fill: { solid: { color: { expr: { FillRule: { Input: input, FillRule: { linearGradient2: {
      min: { color: { Literal: { Value: "'" + ends.low + "'" } } }, max: { color: { Literal: { Value: "'" + ends.high + "'" } } },
      nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } } } } } } } } } },
    selector: { data: [{ dataViewWildcard: { matchingOption: 1 } }] } }];
  // Round 13 (the owner's ask, 5 Oct 2026; measured in Desktop 2.158, DESKTOP-TESTS.md "round 13, item 3"): Desktop does
  // not mirror a chart in a right-to-left report, so the writer does what Desktop honours.
  // A column or line chart: the value axis at the right (valueAxis.switchAxisPosition), and the categories from the
  // right. A categorical axis ignores categoryAxis.invertAxis (January stayed at the left) and follows the sort, so the
  // chart is sorted by its category, Descending: by the Min-of-number field of "sorted" where the category has one, else
  // by the category's own column (which follows the model's sort-by column). A continuous axis (a date, a number)
  // ignores the sort and honours invertAxis: both are written, and Desktop reversed such an axis once.
  // A bar chart: the bars grow from the right (valueAxis.invertAxis) and the category names sit at the right
  // (categoryAxis.switchAxisPosition); its top-to-bottom order stays.
  const mirrorChart = (visual, kind) => {
    const put = (object, props) => { visual.objects = visual.objects || {}; const e = visual.objects[object] || (visual.objects[object] = [{ properties: {} }]); Object.assign(e[0].properties, props); };
    if (kind === 'bar') { put('valueAxis', { invertAxis: bool(true) }); put('categoryAxis', { switchAxisPosition: bool(true) }); return visual; }
    put('valueAxis', { switchAxisPosition: bool(true) }); put('categoryAxis', { invertAxis: bool(true) });
    const query = visual.query, sd = query.sortDefinition;
    if (sd && sd.sort && sd.sort[0]) sd.sort[0].direction = 'Descending';
    else query.sortDefinition = { sort: [{ field: query.queryState.Category.projections[0].field, direction: 'Descending' }], isDefaultSort: true };
    return visual;
  };
  // Round 12, the owner's ask (#17; seen in Desktop 2.158, round 11: the chart ran Sunday to Saturday, the table beside
  // it Friday, Monday, Saturday): days and months in calendar order in tables too. A day or month name that the model
  // gives no sort-by column (f.sortBy, from the field picker: the number column that orders it) is followed by a helper
  // column, the minimum of that number (as the charts carry it in their tooltips), and the table is sorted by it
  // ascending; the helper is written without a header, as narrow as Desktop draws a column, in the card colour, so it
  // does not show (see the table's objects). A name the model sorts itself (f.ordered) gets a sort by itself. The week
  // starts where the model's day number starts. (A table sorts only by a field it holds, as a chart does: round 2.)
  const orderHelper = (f) => ({ field: { Aggregation: { Expression: { Column: { Expression: { SourceRef: { Entity: f.sortBy.t } }, Property: f.sortBy.c } }, Function: 3 } },
    queryRef: 'Min(' + f.sortBy.t + '.' + f.sortBy.c + ')', nativeQueryRef: 'Min of ' + f.sortBy.c, displayName: ' ' });
  const orderedBy = (fs) => fs.find((f) => isTextField(f) && (f.sortBy || f.ordered)) || null;
  const inOrder = (query, fs, rtl) => {
    const f = orderedBy(fs); if (!f) return query;
    // (round 14: in a right-to-left table the helper goes at the left end, away from the text column at the right)
    if (f.sortBy) { const h = orderHelper(f); query.queryState.Values.projections[rtl ? 'unshift' : 'push'](h); query.sortDefinition = { sort: [{ field: h.field, direction: 'Ascending' }], isDefaultSort: true }; }
    else query.sortDefinition = { sort: [{ field: proj(f).field, direction: 'Ascending' }], isDefaultSort: true };
    return query;
  };
  // a table's fields in the order they are shown (see bindQuery). Right to left: reversed (Power BI doesn't mirror
  // tables), but the first text column stays first (the owner's design choice 5, 5 Oct 2026): Power BI writes the total
  // row's "Total" only in the first projection's column and only when that is a column of text (measured in Desktop
  // 2.158, 4 Oct: with a measure first there was no "Total"), so the category sits at the left end and "Total" shows.
  const isTextField = (f) => f.c != null && !f.num && f.agg == null;
  const Bind_nameLike = (name) => /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|^(اسم\s*)?(الشهر|اليوم)$/i.test(String(name).replace(/\s*\((arabic|عربي)\)\s*$/i, '').replace(/hijri|fiscal|هجري|مالي/i, '').trim());
  // Round 14, the owner's ask (6 Oct 2026; his capture "GM AR dark 720" had Day Name at the left of an Arabic table):
  // the text column is the LAST projection in a right-to-left report, so Desktop draws it at the right edge, and the
  // measures sit to its left in reading order. This replaces design choice 5 (text first, for the total row's "Total",
  // which Power BI writes only in the first projection's column when it is text): the reading order comes first.
  const tableFields = (B, rtl) => {
    const fs = (B.table || []).filter(Boolean);
    if (!rtl) return fs;
    const r = fs.slice().reverse(), first = fs.find(isTextField);
    return first ? r.filter((f) => f !== first).concat([first]) : r;
  };
  // Round 11 (seen in Desktop 2.158, 5 Oct 2026: on a 960 x 720 page a table of a text column and three measures was
  // wider than its box, a header cut and a column off the box behind a scrollbar; at 1920 x 1080 too with four long
  // measure names). A table holds only the fields its width has room for, by the rule its pictures already follow
  // (columnRoom): the first text column and the first measure always, then the others in their order while they fit;
  // the first that does not fit and every field after it are left out of that table (and told: tableColumns).
  const tableFit = (fields, width, t, font) => {
    const fs = (fields || []).filter(Boolean);
    if (fs.length <= 2) return { kept: fs, leftOut: [] };
    const room = (f) => columnRoom(tproj(f), t, font), must = [fs.find(isTextField), fs.find(isValue)].filter(Boolean);
    let used = must.reduce((a, f) => a + room(f), 0), full = false;
    const kept = [], leftOut = [];
    fs.forEach((f) => { if (must.includes(f)) return void kept.push(f); if (!full && used + room(f) <= width) { used += room(f); kept.push(f); } else { full = true; leftOut.push(f); } });
    return { kept, leftOut };
  };
  // the query of one visual, or null when a field it needs is not bound
  // rtl: a right-to-left report reverses a table's columns, so its first column (the category) sits on the right,
  // where an Arabic reader starts; Power BI doesn't mirror tables itself
  const CAT_KINDS = ['bar', 'column', 'donut', 'funnel', 'treemap', 'map'];
  function bindQuery(kind, B, kpiIndex, rtl) {
    const cat = (B.cats || {})[kind], y = kind === 'funnel' && B.y && 'funnel' in B.y ? B.y.funnel : (B.y || {})[kind] || B.measure, need = (...fs) => fs.every(Boolean);
    // one field per card: a card past the end of the list stays empty rather than repeating the first KPI
    const kpi = (B.kpis || [])[kpiIndex] || null;
    switch (kind) {
      // the card visual's field role is Data (with Values or Fields it stays empty)
      case 'kpi': return kpi ? q({ Data: [proj(kpi)] }) : null;
      case 'card': return need(B.measure) ? q({ Data: [proj(B.measure)] }) : null;
      case 'line': return need(B.date, B.measure) ? sorted(q({ Category: [proj(B.date)], Y: [proj(B.measure)] }), B.date) : null;
      case 'bar': case 'column': return need(cat, y) ? sorted(q({ Category: [proj(cat)], Y: [proj(y)] }), cat) : null;
      case 'donut': case 'funnel': return need(cat, y) ? q({ Category: [proj(cat)], Y: [proj(y)] }) : null;
      // a table column's number format on the report side is "format" on its projection (measured in Desktop 2.158,
      // third sitting of 2026-10-04: 13857 became 13,857); the field carries it as tableFormat
      case 'table': { const fs = tableFields(B, rtl); return fs.length ? inOrder(q({ Values: fs.map(tproj) }), fs, rtl) : null; }
      // a matrix: rows by the table's first text column, its measures as the values
      // (round 16, design finding #15: a hand-placed matrix showed days A to Z: it is put in calendar order as a table is,
      // by the helper column or the model's own sort)
      case 'matrix': { const fs = (B.table || []).filter(Boolean), row = fs.find(isTextField), vals = fs.filter(isValue); return row && vals.length ? inOrder(q({ Rows: [proj(row)], Values: vals.map(tproj) }), fs, false) : null; }
      // (round 16, design finding #16: a gauge on a percent measure read 0.34 between 0.00 and 0.68; it shows the card's
      // percent format through its projection's format, as tables do)
      case 'gauge': return need(y) ? q({ Y: [Object.assign(proj(y), y.pctFormat ? { format: String(y.pctFormat) } : {})] }) : null;
      case 'treemap': return need(cat, y) ? q({ Group: [proj(cat)], Values: [proj(y)] }) : null;
      case 'map': return need(cat, y) ? q({ Category: [proj(cat)], Size: [proj(y)] }) : null;
      default: return null;
    }
  }
  // chart title for a user's own fields: "Sales by Region"
  // Round 14, the owner's ask (6 Oct 2026): a title is never half Arabic, half English. "A by B" joins two names of the
  // same script with that script's word ("إجمالي المبيعات حسب اسم اليوم", "Total Sales by Day Name"); when only one of
  // the two names is Arabic, the title is the measure's name alone (plan_layout proposes Arabic names to approve).
  const AR_LETTERS = /[\u0600-\u06FF]/;
  const byTitle = (a, by, b) => {
    if (!a || !b) return a || null;
    const ar = AR_LETTERS.test(a);
    if (ar !== AR_LETTERS.test(b)) return a;
    return a + ' ' + (ar ? (AR_LETTERS.test(by) ? by : 'حسب') : (AR_LETTERS.test(by) ? 'by' : by)) + ' ' + b;
  };
  function bindTitle(kind, B, by) {
    const cat = (B.cats || {})[kind], y = kind === 'funnel' && B.y && 'funnel' in B.y ? B.y.funnel : (B.y || {})[kind] || B.measure;
    if (kind === 'line' && B.date && B.measure) return byTitle(label(B.measure), by, label(B.date));
    if (['bar', 'column', 'donut', 'funnel', 'treemap', 'map'].includes(kind) && cat && y) return byTitle(label(y), by, label(cat));
    if ((kind === 'gauge' || kind === 'card') && y) return label(y);
    // a table or matrix by its content (the owner's design choice 3, 5 Oct 2026): its first measure by its first text
    // column, "Total Sales by Region"; the other columns are named by their headers
    if (kind === 'table' || kind === 'matrix') {
      const fs = (B.table || []).filter(Boolean), m = fs.find(isValue), c = fs.find(isTextField);
      return m && c ? byTitle(label(m), by, label(c)) : m ? label(m) : null;
    }
    return null;
  }

  // ---------- the project ----------
  // o: { name, lang, rtl, font, ui, page:{w,h}, slots:[{kind,title,x,y,w,h,rail}] in page units, theme, png (Uint8Array),
  //      logo: { bytes, ext } or null, sample: true|false, texts: {...},
  //      pages: [{ name, page, slots, png, panel, kpiInset }] (kpiInset: the design engine's, where KPI titles start
  //      beside a side accent bar drawn in the background image; 0 or absent without one),
  //      model: { byPath: 'Their.SemanticModel' } or { byConnection: 'Data Source=...' } for the user's own model,
  //      bind: their fields for each visual (see sampleBind) }
  function build(o) {
    const lang = o.lang === 'ar' ? 'ar' : 'en', t = T[lang], rtl = !!o.rtl, u = o.ui, font = o.font || 'Segoe UI';
    const W = o.texts || {};
    // the data: the sample table, the user's own model (o.model: { byPath } or { byConnection }), or none
    const own = !!(o.model && (o.model.byPath || o.model.byConnection));
    const sample = !!o.sample && !own;
    const B = own ? (o.bind || null) : sample ? sampleBind(t) : null;
    const tableColumns = [];   // tables that hold fewer fields than given, for lack of room: { page, pageIndex, x, y, kept, leftOut } (round 11)
    const tabRows = [];   // pages whose page tabs take two or three rows: { page, rows, size } (round 16)
    const noPageButtons = [];   // pages whose header has no room for the page names even at 8pt: { page } (round 11)
    const leftOut = [];   // data visuals not written because the model has no field for them: { page, kind, title }
    const kpiTitles = { wrapped: [], shortened: [] };
    // bars that fade by value (o.chartColors 'gradient', round 13): the two ends, or null when the colour cannot fade
    const barBase = ((o.theme || {}).dataColors || [])[0] || (u || {}).accent, GRAD = o.chartColors === 'gradient' && u ? gradientEnds(barBase, u.card, u.text) : null;
    const chartColors = { asked: o.chartColors === 'gradient', ends: GRAD, base: barBase, charts: 0 };
    // charts mirrored for a right-to-left report (o.chartAxes 'mirrored', round 13; see mirrorChart)
    const MIRROR = rtl && o.chartAxes === 'mirrored', chartAxes = { asked: o.chartAxes || null, rtl, charts: 0 };
    // Quiet gridlines (o.quietGrid, round 13; seen in Desktop 2.158 on 6 Oct, "GE EN dark": on a dark design the value
    // axis's gridlines were near-white lines across the panel, louder than the data; with valueAxis.gridlineColor written
    // on the chart they are quiet): the text colour mixed 85% into the card, on the report's line, bar and column
    // charts, unless the theme sets its own gridlines (its chart style "dotted" or "off").
    const themeGrid = ['lineChart', 'clusteredBarChart', 'clusteredColumnChart'].some((t) => { const va = (((((o.theme || {}).visualStyles || {})[t] || {})['*'] || {}).valueAxis || [])[0]; return !!va && ('gridlineShow' in va || 'gridlineColor' in va); });
    const GRID = o.quietGrid && u && HEX6.test(String(u.text)) && HEX6.test(String(u.card)) && !themeGrid ? mixHex(u.text, u.card, 0.85) : null;
    const titles = { wrapped: [], shortened: [], slicers: [] };   // chart and table titles, slicer headers (round 12, #24)
    const tableOrder = [];   // tables put in calendar order by a helper column (round 12, #17)
    const tableRows = [];   // tables whose known rows don't fit even with tight rows (round 12, #23)
    const headerGrew = [];   // pages whose header grew one row of tabs (round 12)
    const tableSmaller = [];   // tables given a smaller text so more fields fit (round 12)
    const subtitlesUsed = new Set();   // round 22: the subtitle keys that found their visual
    const blankKept = [];   // round 21: KPI cards too narrow for the blank text at the value's size
    const noData = [];   // round 19: the "No data" measures, { t, m, expression }
    const NODATA = own && o.noDataMessage !== false;   // on by default since round 22 (the owner's rule: every part passed in Desktop on the night of 6-7 Oct); noDataMessage: false leaves it out
    const barCharts = [];   // round 19: column charts by day or month names written as bar charts
    const shortDays = [];   // round 18, S3: column charts that show Day Short
    const ringsSmall = [];   // round 18: ring pictures drawn under 40 high, written without their number
    const svgSizes = {};   // the SVG pictures' size in each page's table: { w, h, design (the widest), capped }   // KPI titles too long for one line at 8pt (see kpiTitleFit)
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
    let base = tidy(cut) || 'Power BI Report';
    // next to someone's project: never the name of a report already there (o.model.taken: their X.Report folders and
    // X.pbip files), nor the model's own name, which their first report usually has
    const theirs = o.model && o.model.byPath ? String(o.model.byPath).replace(/^.*\//, '').replace(/\.(SemanticModel|Dataset)$/i, '') : null;
    if (theirs) {
      const taken = new Set([theirs].concat(o.model.taken || []).map((n) => String(n).toLowerCase())), b0 = base;
      for (let n = 1; taken.has(base.toLowerCase()); n++) base = b0 + ' - ' + (W.newDesign || 'New design') + (n > 1 ? ' ' + n : '');
    }
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
    const ref = own ? (o.model.byPath ? { byPath: { path: '../' + String(o.model.byPath).replace(/^.*\//, '') } } : { byConnection: { connectionString: o.model.byConnection } })
      : { byPath: { path: '../' + M } };
    add(R + '/definition.pbir', json({ $schema: SCHEMA.pbir, version: '4.0', datasetReference: ref }));
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
    add(R + '/StaticResources/RegisteredResources/' + themeFile, json(Object.assign({}, o.theme, { name: themeFile })));
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
    add(D + '/pages/pages.json', json({ $schema: SCHEMA.pages, pageOrder: PAGES.map((pg) => pg.id).concat(trend ? [tipName, trend.name] : [tipName]), activePageName: PAGES[0].id }));

    // filter pane in the theme's colors, so it matches the page
    const paneObjects = {
      outspacePane: obj({ backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }),
      filterCard: [
        { properties: { backgroundColor: color(mixHex(u.card, u.background, 0.4)), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Applied' } },
        { properties: { backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Available' } }
      ]
    };
    // Who draws the panel behind a visual. A transparent design has them in the page's background image, so every
    // visual's own background, border and shadow are switched off here (visual.json outranks the theme). A solid design
    // has no such image: its theme gives each visual a background in the card colour, rounded corners and a shadow, so
    // the visuals that sit on a panel (KPI cards, charts, tables, text slots: panel = true) are left to the theme and
    // nothing is written for them. Solid is read from the theme itself: its "*" visuals have a background.
    // Header title, logo, page buttons, slicers, buttons and the tooltip page's visuals stay off in both.
    const SOLID = !!((((((o.theme || {}).visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show;
    // Round 21 (the capabilities lab's #4, Desktop 2.158, 7 Oct 2026: accepted and kept, nothing to see): every shown
    // visual title carries a heading level for screen readers, 'Heading3' (the page title is a text box, not a title).
    // Round 22 (the code review's j): one rule, read from the title's own show value, called where each page's visuals
    // are written. Titles are made in four places (frame, the KPI card's own, the tooltip pages' two), so it is not
    // set in frame(): tried, and five of eight titles lost their heading
    const headed = (vis) => { const t = vis && ((vis.visualContainerObjects || {}).title || [])[0], sh = t && t.properties && t.properties.show;
      if (sh && sh.expr && sh.expr.Literal && sh.expr.Literal.Value === 'true') t.properties.heading = str('Heading3'); };
    const frame = (title, alt, extra, panel) => Object.assign({
      title: obj(title ? { show: bool(true), text: str(title), alignment: str(align) } : { show: bool(false) })
    }, panel && SOLID ? {} : {
      background: obj({ show: bool(false) }),
      border: obj({ show: bool(false) }),
      dropShadow: obj({ show: bool(false) })
    }, {
      general: obj({ altText: str(alt || title || '') })
    }, extra || {});
    const textbox = (text, size, bold, colr, side) => ({ general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: font, fontSize: size + 'pt', fontWeight: bold ? 'bold' : 'normal', color: colr } }], horizontalTextAlignment: side || align }] }) });
    // Card visuals: sized so the title and the number fit the box, from Microsoft's card sizing (a line of text takes
    // 1.5 x its size; the card's own label under the number stays hidden, the title already names the KPI). s: the page's
    // scale (height / 720); title, callout: the title and value sizes the card would have. The padding is 8 on a
    // 1920 x 1080 page, as in Microsoft's recipe, and scales with the page. The value keeps the callout size unless the
    // box is too short, or too narrow for 7 characters ("101.91K"); below 8 the inner padding goes first.
    const TH = (o.theme && o.theme.textClasses) || {}, TITLE = +(TH.title || {}).fontSize || 12, CALLOUT = +(TH.callout || {}).fontSize || 28;
    // the theme's text sizes are made for the report's full page; the 320 x 240 tooltip page and the phone get their own
    const TIP_VALUE = 20, TIP_TITLE = 10;
    // m (KPI cards on a page): { top, side }, the margin above the title (round(12k), k = page height / 1080: measured
    // in Desktop 2.158 as the smallest that looks right) and the padding on the reading-start side that keeps the title
    // clear of a side accent bar (the page's kpiInset from the design engine). Both are reserved here, so the number
    // still fits; the top margin gives way to P when even an 8pt number would not fit under it. On a solid design, where
    // the theme draws the card's panel with rounded corners and no accent bar, the side is round(16k): at P the title
    // touches the panel's corner (measured in Desktop 2.158, DESKTOP-TESTS.md round 2).
    // em: the width of the widest text the value can show, in em (round 10, measured: a digit 0.54, a separator 0.21,
    // "-888.88bn" 4.4). An automatic value (units and 2 decimals) is 4.4 em at most; a full number is sized for nine
    // digits with its separators and decimals (valueEm). Before round 10 this was 7 x 0.55 = 3.85, and "74,675.00" was cut.
    const AUTO_EM = 4.4, FULL = o.kpiValues === 'full';
    const valueEm = (f) => (FULL && f && f.cardFormat ? 9 * 0.54 + 2 * 0.21 + (/\./.test(f.cardFormat) ? 0.21 + 2 * 0.54 : 0) : !FULL && f && f.wholeFormat ? 9 * 0.54 + 2 * 0.21 : AUTO_EM);
    // n: the title's lines (1, or 2 for a KPI title that wraps, see kpiTitleFit); img: the width an image beside the value takes
    const cardFit = (w, h, s, title, callout, m, em, n, img) => {
      const P = Math.round(8 * s / 1.5), line = (f) => Math.ceil(f * 1.5) * (n || 1), S = (m && m.side) || P;
      const T = m && m.top > P && Math.floor((h - m.top - P - line(title)) / 1.5) >= 8 ? m.top : P;
      const fit = (I) => Math.min(callout, Math.floor((h - T - P - 2 * I - line(title)) / 1.5), Math.floor((w - S - P - 2 * I - (img || 0)) / ((em || AUTO_EM) * 4 / 3)));
      let I = P, V = fit(I);
      if (V < 8) { I = 0; V = Math.max(8, fit(0)); }
      return { P, I, V, T, S };
    };
    // Sizes of the header, page buttons, filter rail and slide-in panel were made on a 1920 x 1080 page: they scale with
    // the page (k = page height / 1080), as cardFit does, and text follows the page within Power BI's limits (8-60pt).
    // Where the 8pt minimum makes a text bigger than its scaled box (small pages), the box grows to fit the text.
    // Heights measured in Power BI Desktop 2.157 (scripts/tests/DESKTOP-TESTS.md, 2026-10-01), in page units (a point
    // size takes the same page units on any page): a text box needs 10 + 1.8 x pt per line (points to pixels 4/3, a line
    // about 1.35 of that, padding about 5 above and below), button text 2 + 1.6 x pt per line, the Reset icon 2.25 x pt,
    // a dropdown slicer (title and box) 16 + 4 x pt. Width: 0.55 em per character, in pixels (charW).
    // Buttons (measured on 2.158): Power BI never wraps a button's text, and its icon grows with the button's height
    // (about as wide as the button is high) and is drawn at the start. resetFit(text, w, k): a Reset button w wide is one
    // line high, max(40k, 6 + 1.6 x pt) (Arabic text needs 4 more than English: 19 at 8pt, 30 at 15pt), and keeps its icon only where the text (0.45 em per character, measured 0.40-0.41)
    // and the icon fit side by side; otherwise the icon is left out rather than drawn over the text.
    // pt(t): a size within 8-60pt. LABEL: button text, the theme's label size.
    const pt = (t) => Math.max(8, Math.min(60, Math.round(t))), charW = (t) => t * 0.55 * 4 / 3;
    const boxH = (t, n) => Math.ceil(10 + 1.8 * t * (n || 1)), buttonH = (t, n) => Math.ceil(2 + 1.6 * t * (n || 1));
    const iconH = (t) => Math.ceil(2.25 * t), slicerH = (t) => Math.ceil(16 + 4 * t);
    // Round 10: the text's width is taken from its letters (textWidth), and the button needs the text + 10 beside the icon.
    // Round 13 (seen in Desktop 2.158, 6 Oct 2026, on round 12's buttons: with icon.placement written Desktop draws the
    // arrow at its own small size, tight against the text, in English too). Measured by hand on a 40-high button:
    // iconSize is honoured (30 drew the arrow as large as before round 12); the icon's and the text's margins did
    // nothing (8L, 20L and 20D tried); two no-break spaces before the text give the gap the old button had. So the
    // arrow is three quarters of the button's height and the shown text starts with RESET_GAP (the button is as wide
    // as that text needs); the tooltip, the alt text and the bookmark keep the plain words.
    const RESET_GAP = '  ';
    const resetFit = (text, w, k) => {
      const h = Math.ceil(Math.max(40 * k, 6 + 1.6 * LABEL));
      return { h, icon: textWidth(RESET_GAP + text, LABEL, false, font) + 10 + h <= w };
    };
    // Reset is only as wide as its icon and its text (the owner's design choice 7, 5 Oct 2026; Desktop showed the icon at
    // one end of a 274-wide rail button and the text at the other): the icon as wide as the button is high, the text
    // + 10 (measured, M3), within the room it has
    const resetW = (text, k, room) => Math.min(room, Math.ceil(textWidth(RESET_GAP + text, LABEL, false, font) + 10 + Math.ceil(Math.max(40 * k, 6 + 1.6 * LABEL))));
    // Reset is an icon button without a box (round 10, to match the navigator): no outline, no fill until it is hovered
    // (a light tint of the accent colour), the reset icon in the accent colour, and a tooltip that says what it does.
    const resetFill = () => [{ properties: { show: bool(true) } }, { properties: { fillColor: color(u.accent || u.text), transparency: num(100) }, selector: { id: 'default' } }, { properties: { fillColor: color(u.accent || u.text), transparency: num(88) }, selector: { id: 'hover' } }];
    // Round 12 (seen in Desktop 2.158, round 10: in Arabic the Reset's arrow and its text were at opposite ends): the icon
    // at the reading start (placement, in Microsoft's theme schema) and the text aligned to the same side, so they sit
    // together in a button only as wide as both
    const resetIcon = (r) => Object.assign({ shapeType: str(r.icon ? 'reset' : 'blank'), lineColor: color(u.accent || u.text), placement: str(rtl ? 'right' : 'left') }, r.icon ? { iconSize: num(Math.round(0.75 * r.h)) } : {});
    // (round 22, seen in Desktop on every Arabic report since round 14: the arrow touched the text's last letter. The
    // gap goes on the arrow's side: before the text in English, after it in a right-to-left report, where the arrow is
    // at the right and no-break spaces before Arabic text fall at its far end)
    const resetLook = (text, r) => ({ show: bool(true), text: str(r && r.icon ? (rtl ? text + RESET_GAP : RESET_GAP + text) : text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL), horizontalAlignment: str(rtl ? 'right' : 'left') });
    // (the Arabic tooltip is the button's own words, "إعادة ضبط الفلاتر": the owner's design choice 6, 5 Oct 2026)
    const resetTip = W.resetTip || (o.lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Clear the filters on this page');
    // the largest text size within 8-60 whose one line fits a text box h high (8 at least)
    const boxFit = (h) => Math.max(8, Math.floor((h - 10) / 1.8));
    // A text box is top-aligned and has no vertical alignment: the middle of its text is about 1.2 x pt below the box's
    // top (measured in Desktop 2.158, DESKTOP-TESTS.md round 1: Segoe UI 3 + 1.19 x pt, Tahoma 1.12 x pt). centred(s, t):
    // the slot's y and height with the box moved down so the text's middle is the slot's, as far as the text's own height
    // allows; unchanged when the text is already there (the title at 0.42 x its box).
    // (round 6: the font's own number, not one rule for both. With 1.2 x pt for every font the header's text sat about 3
    // below the middle in Segoe UI and up to 3 above it in Tahoma: the logo placeholder "drifted downwards". A font that
    // was not measured keeps 1.2 x pt.)
    const textMid = (t) => (/^segoe ui/i.test(font) ? 3 + 1.19 * t : /^tahoma/i.test(font) ? 1.12 * t : 1.2 * t);
    const centred = (s, t) => { const d = Math.min(Math.round(s.h / 2 - textMid(t)), s.h - boxH(t)); return d > 0 ? { y: s.y + d, h: s.h - d } : { y: s.y, h: s.h }; };
    const LABEL = +(TH.label || {}).fontSize || 10;
    const SLICER_TEXT = +((((((o.theme || {}).visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize) || LABEL;
    // The card's value, label, padding, layout and outline need the "default" selector, or Power BI ignores them; the
    // number stays centred, like the legacy card's, in both reading directions; the inner outline would draw a box inside
    // the panel. The card's own fill (on by default, in the theme's background colour) is switched off, so the panel and
    // its accent bar show: that switch works only WITHOUT a selector (measured in Desktop 2.158, DESKTOP-TESTS.md round 0;
    // with "default" it is ignored).
    const DEF = { id: 'default' };
    // The value: automatic units with 2 decimals ("3.43M", "14.81K", "231.50"), one setting for every card: Desktop's
    // "Value decimal places" is labelPrecision, and it works in the card's default entry (measured in Desktop 2.158,
    // round 10). With o.kpiValues "full" the cards keep Power BI's own default and a card whose measure carries
    // cardFormat gets the full number with separators (round 9's entry) instead.
    // (the owner's design choices 1 and 2, 5 Oct 2026: a KPI card's value sits at the reading start under its title,
    // side = align; other cards stay centred. A percent card (f.pct) shows the model's own format, 35.4% for 0.0%: no
    // "Value decimal places" on it.)
    // Round 12, the owner's ask (6 Oct 2026): a percent shows as a percent without useless decimals (f.pctFormat: the
    // model's percent format with one decimal or none, else "0.0%"), a number whose format has no decimals as its whole
    // number with separators (f.wholeFormat: "179", "101,914"; not with kpiValues "full", which has its own), the rest
    // with automatic units and 2 decimals. The format is a second entry of "value", selected by the field's query
    // reference, with Desktop's "Custom" display units (measured in Desktop 2.158, D8, for the full number).
    const cardCode = (f) => (f ? f.pctFormat || (!FULL && f.wholeFormat) || null : null);
    const cardObjects = (c, side, f) => ({
      value: obj(Object.assign({ fontSize: num(c.V), horizontalAlignment: str(side || 'center') }, FULL || (f && (f.pct || cardCode(f))) ? {} : { labelPrecision: lit('2L') }), DEF)
        .concat(cardCode(f) ? [{ properties: { labelDisplayUnits: num(-1), customFormatString: str(cardCode(f)) }, selector: { metadata: proj(f).queryRef } }] : []),
      label: obj({ show: bool(false) }, DEF),
      padding: obj({ paddingUniform: num(c.I) }, DEF),
      layout: obj({ paddingUniform: num(0) }, DEF),
      outline: obj({ show: bool(false) }, DEF),
      fillCustom: obj({ show: bool(false) })
    });
    // the container: its padding set on the visual (Power BI resets it when other container settings are set), no gap
    // under the title; title: the title's size, written so the height worked out above doesn't depend on the theme.
    // Padding and spacing are written WITHOUT a selector: with "default" Desktop 2.158 ignores both and the title sits
    // on the panel's top edge (measured, DESKTOP-TESTS.md round 0). c.T: the top, c.S: the reading-start side.
    // Round 10 (the design pass): a KPI title that would be cut ("Total Sales Last R...") gets the largest size, down to
    // 8pt, at which its bold text fits the card's width (text, w given); a title that fits keeps the theme's size.
    const cardFrame = (f, c, title, text, w) => {
      let size = title;
      if (text != null && w) { const avail = w - c.S - c.P; while (size > 8 && textWidth(text, size, true, font) > avail) size--; }
      if (f.title && f.title[0].properties.show && f.title[0].properties.show.expr.Literal.Value === 'true') f.title[0].properties.fontSize = num(size);
      f.padding = obj({ top: num(c.T), bottom: num(c.P), left: num(rtl ? c.P : c.S), right: num(rtl ? c.S : c.P) });
      f.spacing = obj({ customizeSpacing: bool(true), spaceBelowTitleArea: num(0), verticalSpacing: num(2) });
      return f;
    };
    // a button's formatting card: the on/off switch ("show") on its own, the look for the default state after it, the
    // way Power BI Desktop saves buttons (a "show" inside the state selector is ignored, and the text, fill or outline
    // stays hidden)
    const def = (props) => {
      const { show, ...look } = props, out = [];
      if (show !== undefined) out.push({ properties: { show } });
      if (Object.keys(look).length) out.push({ properties: look, selector: { id: 'default' } });
      return out;
    };

    // Page filters (o.pageFilters: [{ t, c, literals }], the literals already written as Power BI writes them: true,
    // 'text', 5L, 5.5D). Each is a basic filter (Categorical, "is one of") on a column, in the shape Microsoft's report
    // authoring reference gives: the field by its table, the condition by the alias of From. Written on every report
    // page, each with its own name; not on the tooltip pages. The user sees and clears them in the Filters pane.
    const pageFilters = () => (o.pageFilters || []).map((f) => {
      const alias = (/^[A-Za-z]/.test(f.t) ? f.t[0] : 't').toLowerCase();
      return {
        name: 'Filter' + rnd() + rnd().slice(0, 4),
        field: { Column: { Expression: { SourceRef: { Entity: f.t } }, Property: f.c } },
        type: 'Categorical',
        filter: { Version: 2, From: [{ Name: alias, Entity: f.t, Type: 0 }],
          Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: alias } }, Property: f.c } }], Values: f.literals.map((v) => [{ Literal: { Value: v } }]) } } }] },
        howCreated: 'User'
      };
    });

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

    PAGES.forEach((pg, pageIndex) => {
      const pageName = pg.id, filters = pageFilters();
      add(D + '/pages/' + pageName + '/page.json', json(Object.assign({
        $schema: SCHEMA.page, name: pageName, displayName: pg.name || base, displayOption: 'FitToPage', width: pg.page.w, height: pg.page.h,
        objects: Object.assign({
          background: obj({ image: { image: { name: str(pg.bgFile), url: resource(pg.bgFile), scaling: str('Fit') } }, transparency: num(0) }),
          outspace: obj({ color: color(u.background) }),
          displayArea: obj({ verticalAlignment: str('Middle') })
        }, paneObjects)
      }, filters.length ? { filterConfig: { filters } } : {})));

      // visuals, in reading order: z and tab order follow it, so keyboard users move through the page the way it reads
      const visuals = [], mob = [], slicerNames = [];
      // a visual inside a group stores its position relative to the group's top-left corner, not the page
      const origin = {};
      const container = (spec) => {
        const o0 = spec.parent ? origin[spec.parent] : { x: 0, y: 0 };
        const v = { $schema: SCHEMA.visual, name: spec.name || rnd(), position: Object.assign({ x: spec.x - o0.x, y: spec.y - o0.y, z: spec.z, height: spec.h, width: spec.w }, spec.kind === 'nodata' ? {} : { tabOrder: spec.z }) };   // (a "No data" message card is no tab stop: seen in Desktop, 6-7 Oct, a card with a tabOrder was an unnamed stop before its chart)
        if (spec.group) origin[v.name] = { x: spec.x, y: spec.y };
        if (spec.group) v.visualGroup = spec.group; else v.visual = spec.visual;
        if (spec.parent) v.parentGroupName = spec.parent;
        if (spec.hidden) v.isHidden = true;
        visuals.push(v); mob.push({ v, kind: spec.kind, parent: spec.parent, group: spec.groupKey, noPhone: spec.noPhone, of: spec.of });
        return v;
      };

      // The page buttons as tabs: their size and rows in the room between the end of the title's text and the logo (or
      // the Filters button: x0, x1), within a header H high; null when they don't fit even at 8pt. (Taken out of the
      // header's code in round 12 so the header can be tried one row taller first: see grown below.) The title's text
      // size comes from the slot's height before any growth (textH).
      const tabsLayout = (title, logo, x0, x1, H) => {
        const kk = pg.page.h / 1080, gap = 24 * kk, th = title.textH || title.h;
        const names = PAGES.map((p) => String(p.name || base)), titleSize = Math.min(pt(th * 0.42), boxFit(th));
        const titleNeed = Math.min(title.w, Math.ceil(textWidth(o.title || base, titleSize, true, font) + 24 * kk));
        // the room: between the end of the title's text and the logo (or the Filters button). The title's text is at the
        // reading start of its box, so room inside the box is taken only where the box's free end faces the logo
        const titleLeft = title.x < logo.x;
        const a0 = titleLeft ? (rtl ? title.x + title.w + gap : title.x + titleNeed + gap) : (rtl ? x0 : logo.x + logo.w + gap);
        const a1 = titleLeft ? (rtl ? logo.x - gap : x1) : (rtl ? title.x + title.w - titleNeed - gap : title.x - gap);
        const room = a1 - a0, padX = 8 * kk, gapB = Math.round(12 * kk), lineH = Math.max(2, Math.round(3 * kk));
        const rowH = (t) => Math.ceil(6 + 1.6 * t) + (/^segoe ui/i.test(font) ? 0 : 4) + lineH;
        const lay = (t, maxRows) => {
          const ws = names.map((nm) => Math.ceil(textWidth(nm, t, true, font) + 10 + 2 * padX));
          if (ws.some((w) => w > room)) return null;
          let row = [], used = 0; const rows = [row];
          ws.forEach((w, i) => { const need = (row.length ? gapB : 0) + w; if (row.length && used + need > room) { row = [i]; rows.push(row); used = w; } else { row.push(i); used += need; } });
          return rows.length <= maxRows && rows.length * rowH(t) <= H ? { t, ws, rows } : null;
        };
        let out = null;
        for (const maxRows of [1, 2, 3]) { for (let t = pt(th * 0.3); t >= 8 && !out; t--) out = lay(t, maxRows); if (out) break; }
        // Round 16 (the owner's yes, 6 Oct 2026, design finding #13: eight names at 8pt on one row beside a large title):
        // names that fit one row only at 8pt take two balanced rows, in reading order, at the largest size both rows
        // hold (by the measured widths), where the header is high enough; otherwise the one row stays
        if (out && out.rows.length === 1 && out.t <= 8 && names.length > 2) {
          for (let t = pt(th * 0.3); t > out.t; t--) {
            if (2 * rowH(t) > H) continue;
            const ws = names.map((nm) => Math.ceil(textWidth(nm, t, true, font) + 10 + 2 * padX)), sum = (a, b) => ws.slice(a, b).reduce((x, w) => x + w, 0) + gapB * (b - a - 1);
            let best = null;
            for (let cut = 1; cut < names.length; cut++) { const w = Math.max(sum(0, cut), sum(cut, names.length)); if (!best || w < best.w) best = { cut, w }; }
            if (best.w <= room) { out = { t, ws, rows: [names.slice(0, best.cut).map((_, i) => i), names.slice(best.cut).map((_, i) => best.cut + i)] }; break; }
          }
        }
        return out ? Object.assign(out, { a0, a1, gapB, lineH, rowH: rowH(out.t), toLogo: titleLeft ? 'right' : 'left' }) : null;
      };
      // Round 12 (the owner's go on round 11's recommendation 2): in a designed layout (pg.grow: the engine owns the
      // positions) a header whose page names don't fit one row of tabs grows by the height of the second row, where two
      // rows then fit; the page's other slots move down by as much, and those that reach the page's bottom (the last
      // row, the filter rail) give up that height. Hand-placed pages are the caller's: their header never grows.
      const grown = (slots) => {
        const t0 = slots.find((x) => x.kind === 'title'), l0 = slots.find((x) => x.kind === 'logo');
        if (!pg.grow || PAGES.length < 2 || !t0 || !l0 || pg.panel) return slots;
        const kk = pg.page.h / 1080, gap = 24 * kk, x0 = rtl ? l0.x + l0.w + gap : t0.x + t0.w + gap, x1 = rtl ? t0.x - gap : l0.x - gap;
        if (tabsLayout(t0, l0, x0, x1, t0.h)) return slots;
        let extra = 0;
        for (let d = 1; d <= Math.ceil(30 * kk) + 25 && !extra; d++) { const tl = tabsLayout(t0, l0, x0, x1, t0.h + d); if (tl && tl.rows.length === 2 && d <= tl.rowH) extra = d; }
        if (!extra) return slots;
        const head = (x) => x.kind === 'title' || x.kind === 'logo', bottom = Math.max(...slots.filter((x) => !head(x)).map((x) => x.y + x.h));
        headerGrew.push({ page: pg.name || base, by: extra });
        return slots.map((x) => (head(x) ? Object.assign({}, x, { h: x.h + extra, textH: x.h }) : Object.assign({}, x, { y: x.y + extra }, x.y + x.h >= bottom - 1 ? { h: x.h - extra } : {})));
      };
      // Round 12 (#18; seen in Desktop 2.158, round 11: three dropdowns at the top of the filter rail, Reset at its very
      // bottom and 300 page units of empty panel between them): a rail is only as high as its slicers and its Reset, so
      // Reset sits right under the last slicer and the rail's panel ends there.
      const railFit = (s) => {
        if (s.kind !== 'slicer' || s.w > s.h) return s;
        const kk = pg.page.h / 1080, pad = 10 * kk, gap = 8 * kk, all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), n = Math.max(1, (B && own ? all3.filter(Boolean) : all3).length);
        const resetText = W.reset || 'Reset filters', bh = resetFit(resetText, resetW(resetText, kk, s.w - 2 * pad), kk).h;
        const sh = Math.max(slicerH(SLICER_TEXT), Math.min(76 * kk, (s.h - 2 * pad - bh - gap * n) / n));
        return Object.assign({}, s, { h: Math.min(s.h, Math.ceil(2 * pad + n * sh + gap * n + bh)) });
      };
      pg = Object.assign({}, pg, { slots: grown(pg.slots) });
      // Round 19 (seen in Desktop, golden tasks 1 and 4:3: day names slant on the column charts of models without a short
      // day column): a column chart by day or month names whose widest name, at the label size, is wider than its share
      // of the plot (as S3 works it out) is written as a bar chart, whose names are level, where the slot holds one bar
      // per name (22 each + 46, measured in round 0 at 1280 x 720, scaled with the page). A model's "Day Short"
      // (round 18) is used first, so such a chart stays a column chart.
      const NAMES = { day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
      const asBar = (s) => {
        const f = B && s.kind === 'column' && (B.cats || {}).column;
        if (!f || f.short || f.c == null) return s;
        const list = /(^|\s)(day|weekday)\s*name|اسم اليوم/i.test(f.c) ? NAMES.day : /(^|\s)month\s*name|اسم الشهر/i.test(f.c) ? NAMES.month : null;
        if (!list) return s;
        const k = pg.page.h / 720, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / list.length, widest = Math.max(...list.map((d) => textWidth(d, LABEL, false, font)));
        // (night sitting 6-7 Oct, measured in Desktop 2.158 on a 221-high slot at 1280 x 720, names at the theme's 10pt: a
        // row is 22.2, the first starts 45 under the box's top and 8 stay under the last; the value axis and its room
        // take 38 more, and with it Saturday went behind a scrollbar. So: 23 a row + 54, and where the axis's 38 do not
        // fit as well the chart is written without its value axis, each bar's value beside it (rows, below).)
        if (widest + 6 <= room || s.h < (list.length * 23 + 54) * k) return s;
        barCharts.push({ page: pg.name || base, field: label(f) });
        return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows: list.length });
      };
      const sorted = pg.slots.map(railFit).map(asBar).sort((a, b) => (a.y - b.y) || (rtl ? b.x - a.x : a.x - b.x));
      const groups = {};
      const groupOf = (kind) => (kind === 'title' || kind === 'logo' ? 'header' : kind === 'kpi' ? 'kpis' : kind === 'slicer' ? 'filters' : null);
      const GROUP_NAMES = { header: W.header || 'Header', kpis: W.kpis || 'KPI cards', filters: W.filters || 'Filters' };
      let z = 1000, kpiIndex = 0;
      // The KPI titles of a page share one size (seen in Desktop on 2026-10-05: 12pt beside 8pt in one row looked
      // wrong): the largest, down to 8pt, at which the longest title of the row fits its card.
      let kpiTitle = TITLE;
      sorted.filter((s) => s.kind === 'kpi').forEach((s, i) => {
        const f = B && B.kpis ? B.kpis[i] : null, text = f ? label(f) : s.title;
        const c = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, { top: Math.round(12 * pg.page.h / 1080), side: pg.kpiInset || (SOLID ? Math.round(16 * pg.page.h / 1080) : 0) }, valueEm(f));
        while (kpiTitle > 8 && text != null && textWidth(text, kpiTitle, true, font) > s.w - c.S - c.P) kpiTitle--;
      });
      // An SVG design on a card's image (o.svgCards): the image area is a percent of the card's inner width, which was
      // 0.8 of the card's width on the two cards measured (163 and 165 wide, 1280 x 720). The design is shown at its own
      // width where that is 10 to 25 percent, and the value is fitted to the width left (take: the area and a gap of 8).
      // Round 12 (the owner's go on round 11's recommendation 3, and #8): the image area is a percent of the card's width
      // less its padding, measured in Desktop 2.158 (round 11) as 25 a side at 1920 x 1080 and 17 at 1280 x 720 (25 x the
      // page's scale), not of 0.8 x the card; and one percent for the row, from its narrowest card, so the images are equal.
      const kpiSlots = sorted.filter((s) => s.kind === 'kpi'), rowMinW = kpiSlots.length ? Math.min(...kpiSlots.map((s) => s.w)) : 0, imgPad = 50 * pg.page.h / 1080;
      const imgOf = (s, i) => { const sc = (o.svgCards || []).find((x) => x.card === i); if (!sc) return null;
        // Round 13 (seen in Desktop 2.158, 6 Oct 2026, "SC EN light 720": a 64 x 64 ring on a 96-high card, sized by the
        // width alone, was drawn 54.6 high and its top was cut by the card): the picture is never taller than the
        // room under the card's title (the card less its top and bottom padding, the title's lines, the value's own
        // padding and the 2 between them: imgRoom), on the row's widest card; 5 percent at least.
        const byWidth = Math.max(10, Math.min(25, Math.round(100 * (+sc.w || 48) / Math.max(1, rowMinW - imgPad))));
        const byHeight = Math.floor(100 * imgRoom(s) * ((+sc.w || 48) / (+sc.h || 48)) / Math.max(1, rowMaxW - imgPad));
        const pct = Math.max(5, Math.min(byWidth, byHeight)); return { sc, pct, take: Math.ceil((s.w - imgPad) * pct / 100) + 8 }; };
      // (the title takes one line at the theme's size or two at 8pt, whichever is higher, so the room holds in both)
      const rowMaxW = kpiSlots.length ? Math.max(...kpiSlots.map((s) => s.w)) : 0;
      const imgRoom = (s) => { const c0 = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, KPI_M, AUTO_EM); return s.h - c0.T - c0.P - 2 * c0.I - Math.max(Math.ceil(TITLE * 1.5), 2 * Math.ceil(8 * 1.5)) - 2; };
      const KPI_M = { top: Math.round(12 * pg.page.h / 1080), side: pg.kpiInset || (SOLID ? Math.round(16 * pg.page.h / 1080) : 0) };
      // one KPI card's fit: on one title line (c), on two (two), its image, and how its title is shown (fit)
      const kpiFits = (s, i, text, f) => { const im = imgOf(s, i), take = im ? im.take : 0, c = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, KPI_M, valueEm(f), 1, take), two = cardFit(s.w, s.h, pg.page.h / 720, kpiTitle, CALLOUT, KPI_M, valueEm(f), 2, take);
        return { c, two, im, fit: kpiTitleFit(text, kpiTitle, s.w - c.S - c.P, c, two) }; };
      // #9 (seen in Desktop 2.158, round 11: one 15pt value among 14pt ones): one value size for the row, the smallest
      // that fits every card
      let rowV = null;
      const rowValue = () => (rowV == null ? (rowV = Math.min(...kpiSlots.map((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? label(f) : s.title, f).c.V; }))) : rowV);
      let rowWrap = null;
      const rowWraps = () => (rowWrap == null ? (rowWrap = sorted.filter((s) => s.kind === 'kpi').some((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? label(f) : s.title, f).fit.mode === 'wrapped'; })) : rowWrap);
      // "Never cut" for a KPI title (the owner's rule, 5 Oct 2026). A title that doesn't fit one line even at the 8pt
      // minimum wraps to two lines (titleWrap) where the card has the height for both lines and its value at the size
      // the row's other cards have (a line is 1.5 x the size, Microsoft's card sizing, as in cardFit); otherwise it is shortened at a word, with
      // "…", and the full name stays the card's alt text and Power BI's own tooltip on the card (the field's name).
      // Wrapping is preferred: the reader sees the whole name. Both are told in kpiTitles. (The wrap itself and the
      // tooltip are to be proven in Desktop; titleWrap is the title's "Text wrap", in Microsoft's default theme.)
      const wrapLines = (text, size, avail) => { const out = []; let cur = ''; String(text).split(' ').forEach((w) => { const t = cur ? cur + ' ' + w : w; if (!cur || textWidth(t, size, true, font) <= avail) cur = t; else { out.push(cur); cur = w; } }); out.push(cur); return out; };
      const kpiTitleFit = (text, size, avail, c, two) => {
        if (text == null || textWidth(text, size, true, font) <= avail) return { mode: 'one' };
        const ls = wrapLines(text, size, avail);
        if (size === 8 && ls.length === 2 && ls.every((l) => textWidth(l, size, true, font) <= avail) && two && two.V >= c.V) return { mode: 'wrapped', c: Object.assign({}, two, { V: c.V }) };
        const words = String(text).split(' ');
        let shown = '';
        for (let n = words.length - 1; n >= 1 && !shown; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (textWidth(t, size, true, font) <= avail) shown = t; }
        if (!shown) { const ch = [...String(text)]; for (let n = ch.length - 1; n >= 1 && !shown; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) shown = t; } }
        return { mode: 'shortened', shown: shown || '…' };
      };
      // Round 12 (#24; seen in Desktop 2.158, 5 Oct 2026: long Arabic chart titles and a slicer header were cut at their
      // start, "...عات حسب اسم الفرع التجاري الرئيسي", so the measure's name was lost). A chart's or table's title too
      // long for one line wraps to two (titleWrap, as a KPI title does), and one too long for two lines is shortened at a
      // word with "…" at its end, so it still begins with the measure's name; the full title stays the alt text. The
      // room: the visual's width less 16 a side (1920 x 1080, scaled); the theme's title size, measured as bold.
      const fitted = new Map();   // round 22: each chart's full title and the room it was fitted to
      const titleFit = (text, size, avail) => {
        if (text == null || textWidth(text, size, true, font) <= avail) return { mode: 'one', shown: text };
        const two = (t) => { const ls = wrapLines(t, size, avail); return ls.length <= 2 && ls.every((l) => textWidth(l, size, true, font) <= avail); };
        if (two(text)) return { mode: 'wrapped', shown: text };
        const words = String(text).split(' ');
        for (let n = words.length - 1; n >= 1; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (two(t)) return { mode: 'shortened', shown: t }; }
        const ch = [...String(text)];
        for (let n = ch.length - 1; n >= 1; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) return { mode: 'shortened', shown: t, one: true }; }
        return { mode: 'shortened', shown: '…', one: true };
      };
      // one line only, shortened at its end (a slicer's header, a phone title that two lines don't hold)
      const oneLine = (text, size, avail) => {
        if (text == null || textWidth(text, size, true, font) <= avail) return text;
        const words = String(text).split(' ');
        for (let n = words.length - 1; n >= 1; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (textWidth(t, size, true, font) <= avail) return t; }
        const ch = [...String(text)];
        for (let n = ch.length - 1; n >= 1; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) return t; }
        return '…';
      };
      // a slicer's header, shortened to the slicer's width: the header's own text (header.text, in Microsoft's theme
      // schema), so the field keeps its name everywhere else; the full name stays the slicer's alt text
      const slicerHeader = (f, w) => { const out = { show: bool(true), fontFamily: str(font) }; if (!f) return obj(out); const full = label(f), shown = oneLine(full, SLICER_TEXT, w - 2 * Math.round(8 * k));
        if (shown !== full) { titles.slicers.push({ page: pg.name || base, field: full, shown }); out.text = str(shown); } return obj(out); };
      // Round 12 (#15; seen in Desktop 2.158, round 11: "Total Sales by Day Name" twice on one page): a table whose title
      // is a chart's title on the same page is titled by what it adds, "...: detail"
      const pageCats = new Set();   // the categories this page's charts already show (round 16, #18)
      let catPlan = null;   // each categorical chart slot's category, given out once for the page (round 18)
      const chartTitles = new Set(B ? sorted.filter((s) => CHARTS.includes(s.kind)).map((s) => bindTitle(s.wasColumn ? 'column' : s.kind, B, W.by || 'by')).filter(Boolean) : []);   // (wasColumn: a column chart written as a bar chart keeps its own title)
      const charts = [];
      sorted.forEach((s) => {
        const g = groupOf(s.kind);
        if (g && !groups[g]) groups[g] = { name: rnd(), x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h, z: 0 };
        if (g) { const G = groups[g]; G.x0 = Math.min(G.x0, s.x); G.y0 = Math.min(G.y0, s.y); G.x1 = Math.max(G.x1, s.x + s.w); G.y1 = Math.max(G.y1, s.y + s.h); }
      });
      // groups sit under their visuals in the layer order
      Object.keys(groups).forEach((g) => { const G = groups[g]; G.z = z; z += 1000;
        // in a solid design the theme would draw a band behind the whole group, square and without a shadow (a group
        // has neither a border nor a shadow), so no group draws one: the KPI cards each have their own panel, and the
        // header and the filter rail get a panel behind them (below)
        container({ name: G.name, x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0, z: G.z, kind: 'group', groupKey: g,
          group: Object.assign({ displayName: GROUP_NAMES[g], groupMode: 'ScaleMode' }, SOLID ? { objects: { background: obj({ show: bool(false) }) } } : {}) });
        // The header's and the filter rail's panel on a solid design: an empty text box left to the theme, under the
        // group in the layer order. Nothing is written for its background, border or shadow, so the theme draws the
        // same panel as behind the cards (measured in Desktop 2.158, DESKTOP-TESTS.md round 1; a shape with its own
        // rounded fill is not drawn rounded). The rail's is the group's box; the header's is grown by 12k at each side
        // and 6k above and below, which lines it up with the rail and the cards. Not in the phone layout.
        if (SOLID && g !== 'kpis') {
          const kk = pg.page.h / 1080, dx = g === 'header' ? Math.round(12 * kk) : 0, dy = g === 'header' ? Math.round(6 * kk) : 0;
          const bx = Math.max(0, G.x0 - dx), by = Math.max(0, G.y0 - dy);
          container({ x: bx, y: by, w: G.x1 + dx - bx, h: G.y1 + dy - by, z: G.z - 500, kind: 'band', noPhone: true,
            visual: { visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: '' }] }] }) }, visualContainerObjects: { title: obj({ show: bool(false) }) } } });
        } });

      // page navigation between the title and the logo, when the report has more than one page
      const title = pg.slots.find((s) => s.kind === 'title'), logo = pg.slots.find((s) => s.kind === 'logo');
      let nav = null, openBtn = null, tabs = null;
      const panel = pg.panel && title && logo ? pg.panel : null, k = pg.page.h / 1080;
      if (title && logo) {
        // (round 18, seen in Desktop on 6 Oct 2026: with the ☰ written first, an Arabic button drew it at the left of the
        // word, the reading end; written after the word, the left-to-right button draws it at the right)
        const gap = 24 * k, openText = rtl ? (W.filters || 'Filters') + '  ☰' : '☰  ' + (W.filters || 'Filters');
        let x0 = rtl ? logo.x + logo.w + gap : title.x + title.w + gap, x1 = rtl ? title.x - gap : logo.x - gap;
        // slide-in filters: the Filters button sits next to the logo, the page buttons use what is left
        if (panel) {
          const bw = Math.round(Math.max(Math.min(180 * k, Math.max(120 * k, (title.textH || title.h) * 3)), charW(LABEL) * openText.length + 16 * k));
          openBtn = { x: Math.round(rtl ? x0 : x1 - bw), y: title.y, w: bw, h: title.h, text: openText };
          if (rtl) x0 += bw + 16 * k; else x1 -= bw + 16 * k;
        }
        // page buttons: 140 each on 1920 x 1080, or what the longest page name needs (two lines when the header holds
        // them); squeezed into the room left, with smaller text if needed; left out when even 8pt doesn't fit
        // Round 10 (the owner's design note; looks and widths measured in Desktop 2.158, DESKTOP-TESTS.md round 10):
        // the navigator is tabs without boxes, one button per page in both directions: the current page's name bold in
        // the accent colour with a line under it, the others in a quieter text colour. Each button is as wide as its
        // own name needs (a button cuts its text when it is narrower than the text + 10), so no name is cut; they sit
        // at the logo's side of the room between the end of the title's text and the logo, at the largest size (down
        // to 8pt) that fits on one row, then on two or three rows if the header is high enough. Only when even that
        // does not fit does the page keep Power BI's own navigator (below), which cuts names.
        if (PAGES.length > 1) tabs = tabsLayout(title, logo, x0, x1, title.h);
        if (PAGES.length > 1 && !tabs) {
          const n = PAGES.length, longest = Math.max(...PAGES.map((p) => String(p.name || base).length));
          // (a page button puts a long name on two lines only when two lines fit its height, 3.5 x pt in Segoe UI and
          // 3.2 x pt in Tahoma, and cuts it with "..." otherwise: measured in Desktop 2.158, DESKTOP-TESTS.md round 1)
          const need = (t) => { const L = Math.min(2, Math.max(1, Math.floor(title.h / (1.8 * t)))); return Math.ceil(charW(t) * Math.ceil(longest / L) + 16 * k); };
          let t = pt(title.h * 0.3);
          const w = Math.min(x1 - x0, n * Math.max(140 * k, need(t)) + 40 * k);
          while (t > 8 && (need(t) > (w - 40 * k) / n || buttonH(t) > title.h)) t--;
          if (need(t) <= (w - 40 * k) / n && buttonH(t) <= title.h) nav = { x: rtl ? x0 : x1 - w, y: title.y, w, h: title.h, t };
          // Right to left: the page navigator has no setting for its order and always puts the first page on the
          // left, so the page buttons are single buttons, the first page's rightmost (measured in Desktop 2.158,
          // DESKTOP-TESTS.md round 2). A button never wraps its text, which is 0.45 em a character at most (measured
          // 0.38-0.42), and needs 6 + 1.6 x pt in height: the same box
          // rule with one line; where the header is too low or too narrow for that even at 8pt, the navigator stays.
          if (rtl) {
            const need1 = (t1) => Math.ceil(0.45 * 4 / 3 * t1 * longest + 16 * k), fits = (t1, w1) => need1(t1) <= (w1 - 40 * k) / n && Math.ceil(6 + 1.6 * t1) <= title.h;
            let t1 = pt(title.h * 0.3);
            const w1 = Math.min(x1 - x0, n * Math.max(140 * k, need1(t1)) + 40 * k);
            while (t1 > 8 && !fits(t1, w1)) t1--;
            if (fits(t1, w1)) nav = { x: x0, y: title.y, w: w1, h: title.h, t: t1, buttons: true };
          }
        }
        // Round 11 (seen in Desktop, 5 Oct: eight long names on a 1280 x 720 page with a 32-high header): when the names
        // fit neither as tabs nor in the navigator, the page gets no page buttons (a cut name is worse). That is told.
        if (PAGES.length > 1 && !tabs && !nav) noPageButtons.push({ page: pg.name || base });
      }

      sorted.forEach((s) => {
        const g = groupOf(s.kind), parent = g ? groups[g].name : null, type = TYPES[s.kind] || 'cardVisual';
        if (s.kind === 'slicer') {
          // the filter panel holds several dropdown slicers and a Reset button:
          // stacked in a side panel, side by side in a top strip
          // (sizes from 1920 x 1080 scaled by k; Reset as wide or as high as its text needs, slicers the height a dropdown needs)
          // (on a user's own model a slicer the model has no column for is left out and told, and the others share the room)
          const all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), fields = B && own ? all3.filter(Boolean) : all3, pad = 10 * k, gap = 8 * k, n = Math.max(1, fields.length);
          all3.forEach((f, i) => { if (B && own && !f) leftOut.push({ page: pg.name || base, kind: 'slicer', title: (W.slicer || 'Slicer') + ' ' + (i + 1) }); });
          const resetText = W.reset || 'Reset filters';
          const bw = resetW(resetText, k, s.w - 2 * pad);
          const reset = resetFit(resetText, bw, k), bh = reset.h;
          // Round 13 (seen in Desktop 2.158, 6 Oct 2026, "AK EN light": a hand-placed 444 x 310 slot, wider than high,
          // held three dropdowns 100 wide beside Reset, their headers cut to "Q…", "Da…"): the slot is a strip only when
          // each dropdown gets 160k at least; a slot too narrow for that stacks them like a rail where its height holds
          // them (a slot that holds them neither way stays a strip, as before).
          const stripW = (s.w - 2 * pad - bw - gap - gap * (n - 1)) / n, stackH = n * slicerH(SLICER_TEXT) + gap * n + bh + 2 * pad;
          const across = s.w > s.h && (stripW >= 160 * k || stackH > s.h);
          const room = across ? s.w - 2 * pad - bw - gap : s.w - 2 * pad;
          const sw = across ? (room - gap * (n - 1)) / n : room;
          const sh = across ? s.h - 2 * pad : Math.max(slicerH(SLICER_TEXT), Math.min(76 * k, (s.h - 2 * pad - bh - gap * n) / n));
          fields.forEach((f, i) => {
            // in a right-to-left report the first slicer is the rightmost one, so tab order follows the reading
            const x = across ? (rtl ? s.x + s.w - pad - sw - i * (sw + gap) : s.x + pad + i * (sw + gap)) : s.x + pad, y = across ? s.y + pad : s.y + pad + i * (sh + gap);
            const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
            const v = container({ x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(sh), z: z, parent, kind: 'slicer',
              visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
                objects: { data: obj({ mode: str('Dropdown') }), header: slicerHeader(f, Math.round(sw)) },
                visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
            slicerNames.push(v.name);
            z += 1000;
          });
          // Reset button: applies a bookmark that clears these slicers
          // (across: at the end of the strip; in a rail: at the reading start, lined up with the slicers)
          const bm = rnd(), bx = across ? (rtl ? s.x + pad : s.x + s.w - pad - bw) : (rtl ? s.x + s.w - pad - bw : s.x + pad), by = across ? s.y + (s.h - bh) / 2 : s.y + s.h - pad - bh;
          container({ x: Math.round(bx), y: Math.round(by), w: Math.round(bw), h: Math.round(bh), z, parent, kind: 'button',
            visual: { visualType: 'actionButton',
              objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
                fill: resetFill(), outline: def({ show: bool(false) }) },
              visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: str(bm) }) }) } });
          z += 1000;
          bookmarks.push({ name: bm, page: pageName, targets: slicerNames.slice(), label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
          return;
        }
        let visual, box = s;
        if (s.kind === 'title') {
          // the title and the logo text follow the header's height (within 8-60pt), and stay on one line in it, with
          // the text's middle at the header's (see centred)
          const size = Math.min(pt((s.textH || s.h) * 0.42), boxFit(s.textH || s.h));
          box = centred(s, size);
          visual = { visualType: 'textbox', objects: textbox(o.title || base, size, true, u.text), visualContainerObjects: frame(null, o.title || base) };
        } else if (s.kind === 'logo') {
          // image.fit 'Fit' keeps the logo's own ratio and shows it whole; the old imageScaling 'Fit' stretched it to the
          // box (measured in Desktop 2.158). The box itself has the logo's shape (the design engine, logoRatio).
          const size = Math.min(pt((s.textH || s.h) * 0.3), boxFit(s.textH || s.h));
          // (round 12, #30: the Tahoma placeholder sat 2.6 to 3.4 below the header's middle, measured in Desktop 2.158,
          // round 11 (D15): it is drawn 3 higher)
          if (!logoFile) { box = centred(s, size); if (/^tahoma/i.test(font) && box.y > s.y) { const up = Math.min(3, box.y - s.y); box = { y: box.y - up, h: box.h + up }; } }
          visual = logoFile
            ? { visualType: 'image', objects: { general: obj({ imageUrl: resource(logoFile) }), image: obj({ fit: str('Fit') }) }, visualContainerObjects: frame(null, W.logo || 'Logo') }
            // the placeholder until a logo is added: sized to the header slot, in the secondary text colour so it reads
            // (round 12, #30: aligned to the page's edge, the side the logo will take: right in English, left in Arabic;
            // "شعارك" started 150 in from the edge, seen in Desktop 2.158, round 11)
            : { visualType: 'textbox', objects: textbox(W.logoHere || 'Your logo', size, false, mixHex(u.text, u.card, 0.3), rtl ? 'left' : 'right'), visualContainerObjects: frame(null, W.logo || 'Logo') };
        } else if (s.kind === 'text') {
          // (round 13, seen in Desktop on 6 Oct, "R12 text EN": the sentence at 11pt on a 1920 x 1080 page read like a
          // footnote at the top of a tall panel: a given text is written at the theme's label size for the page, 11 at least)
          // (round 12, #20: the slot's own text when the caller gives one, s.text; the placeholder is for the website's
          // template download only: create_report leaves the box out when it has no text for it)
          visual = { visualType: 'textbox', objects: textbox(s.text != null ? String(s.text) : W.textHere || 'Explain what the main chart shows and what to do about it.', s.text != null ? Math.max(11, LABEL) : 11, false, u.text), visualContainerObjects: frame(s.title, s.title, null, true) };
        } else {
          // a table keeps only the fields its width has room for (tableFit); Bt is the bind this table is written from
          let Bt = B, tableText = null, smallEntry = null;
          if (B && (s.kind === 'table' || s.kind === 'matrix')) {   // (a matrix too: round 16, #15)
            // Round 12 (the owner's go on round 11's recommendation 5): a table too narrow for its fields first takes a
            // smaller text, down to 8pt: the largest size that keeps the most fields; a field is left out only where even
            // that doesn't hold it. The size is written on the table (values, headers, total) and told.
            const T0 = +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
            let tf = tableFit(B.table, s.w, T0, font);
            if (tf.leftOut.length) { for (let t2 = Math.ceil(T0) - 1; t2 >= 8; t2--) { const f2 = tableFit(B.table, s.w, t2, font); if (f2.kept.length > tf.kept.length) { tf = f2; tableText = t2; } if (!f2.leftOut.length) break; } }
            if (tableText) tableSmaller.push(smallEntry = { page: pg.name || base, size: tableText, from: T0 });
            if (tf.leftOut.length) { Bt = Object.assign({}, B, { table: tf.kept }); tableColumns.push({ page: pg.name || base, pageIndex, x: s.x, y: s.y, kept: tf.kept, leftOut: tf.leftOut }); }
          }
          // Round 16 (design finding #18): each chart of a page by a category not used on the page yet, from the picker's
          // pool (B.catPool), where the model has more than one; the same category only when it has no other
          // Round 18 (seen in Desktop, 6 Oct 2026: on a model with three text columns the operations layout's two bar
          // charts were both by the first one, because the column chart, earlier in the reading order, had taken the
          // third): the page's categories are given out once, the bar charts and the donut first in reading order,
          // then the column chart and the map; a chart repeats a category only when the pool has no unused one.
          // (night sitting 6-7 Oct, seen in Desktop: a column chart written as a bar chart, round 19, took the bar chart's
          // category: the page showed the same chart twice. It keeps the column chart's own: kindOf.)
          const kindOf = (x) => (x.wasColumn ? 'column' : x.kind);
          if (B && CAT_KINDS.includes(s.kind) && (B.cats || {})[kindOf(s)]) {
            const k0 = (f) => f.t + '\u0001' + f.c;
            if (!catPlan) { catPlan = new Map(); const last = (x) => kindOf(x) === 'column' || x.kind === 'map', all = sorted.filter((x) => CAT_KINDS.includes(x.kind) && (B.cats || {})[kindOf(x)]);
              all.filter((x) => !last(x)).concat(all.filter(last)).forEach((x) => { let c = B.cats[kindOf(x)]; if (pageCats.has(k0(c))) { const alt = (B.catPool || []).find((f) => !pageCats.has(k0(f))); if (alt) c = alt; } pageCats.add(k0(c)); catPlan.set(x, c); }); }
            const c = catPlan.get(s); if (c && c !== B.cats[s.kind]) Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { [s.kind]: c }) });
          }
          // Round 18, S3 (the owner's yes, 6 Oct 2026; seen in Desktop: the day names slant on the 1920 x 1080 column
          // charts): a column chart by Day Name takes the calendar's Day Short where the model has it (c.short) and the
          // full names, at the label size, are wider than a seventh of the chart's plot (the value axis about 40)
          if (B && s.kind === 'column' && ((Bt.cats || {}).column || {}).short) {
            const c0 = Bt.cats.column, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / 7;
            const widest = Math.max(...['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => textWidth(d, LABEL, false, font)));
            if (widest + 6 > room) { Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { column: Object.assign({}, c0.short, { name: label(c0) }) }) }); shortDays.push({ page: pg.name || base }); }
          }
          const query = B ? bindQuery(s.kind, Bt, kpiIndex, rtl) : null;
          let ttl = s.title;
          const extra = {};
          // (round 10: the sample download names its charts by their fields too, "Total Revenue by Month", as a report on a
          // user's model does; before, it kept the layout's role names, "Main trend")
          if (B && query) ttl = bindTitle(s.kind, Bt, W.by || 'by') || ttl;
          if ((s.kind === 'table' || s.kind === 'matrix') && ttl && chartTitles.has(ttl)) ttl = ttl + ': ' + (AR_LETTERS.test(ttl) ? (W.detail && AR_LETTERS.test(W.detail) ? W.detail : 'التفاصيل') : (W.detail && !AR_LETTERS.test(W.detail) ? W.detail : 'detail'));   // (round 14: in the title's own script)
          if (s.kind === 'kpi') { if (B && query) ttl = label(B.kpis[kpiIndex]); kpiIndex++; }
          // KPI names read as labels: semibold, so the number below stays the hero
          if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(ttl), alignment: str(align), bold: bool(true) });
          // a visual that shows data is never written without its fields (Microsoft's validator: PBIR_QUERY_STATE_MISSING;
          // Desktop shows an empty box): on a user's own model it is left out and told (leftOut). The KPI cards are
          // counted by the caller.
          if (B && own && !query && (CHARTS.includes(s.kind) || ['table', 'matrix', 'gauge', 'card'].includes(s.kind))) { leftOut.push({ page: pg.name || base, kind: s.kind, title: s.title || null }); return; }
          visual = { visualType: type, visualContainerObjects: frame(ttl, ttl, extra, true), drillFilterOtherVisuals: true };
          if (query) visual.query = query;
          // bars that fade by value (gradientFill above): the report's own bar and column charts, never the tooltip pages'
          if (GRAD && query && (s.kind === 'bar' || s.kind === 'column')) { visual.objects = { dataPoint: gradientFill(query.queryState.Y.projections[0].field, GRAD) }; chartColors.charts++; }
          if (MIRROR && query && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line')) { mirrorChart(visual, s.kind); chartAxes.charts++; }
          // Round 21 (the capabilities lab's #6, Desktop 2.158, 7 Oct 2026: "77.7K" above the columns, kept on Save): a column
          // chart with few columns shows its values above them: labels at 'OutsideEnd', automatic units (0, K or M by the
          // values' size, as the KPI cards) with one decimal (a percent measure keeps its own format). Only where the
          // number of columns is known from the model's names: a quarter (4); other columns could have any number
          if (query && s.kind === 'column') { const cf = query.queryState.Category.projections[0], cn = String(cf.nativeQueryRef || cf.queryRef || '');
            // (round 22, the code review's f: "Year Quarter" and "Fiscal Year Quarter" end the same way and hold 8 to 40 values:
            // a name with a year in it is never taken for four columns)
            const four = (n) => /(^|\s|\.)quarter$|الربع/i.test(n) && !/year|سنة|السنة|عام/i.test(n);
            if (four(cn) || four(String(((Bt.cats || {}).column || {}).c || ''))) {
              const yf = ((Bt.y || {}).column || Bt.measure || {}), pct = !!yf.pct;
              visual.objects = visual.objects || {};
              visual.objects.labels = obj(Object.assign({ show: bool(true), labelPosition: str('OutsideEnd'), labelDisplayUnits: num(0) }, pct ? {} : { labelPrecision: lit('1L') }));
            } }
          if (GRID && query && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line')) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.gridlineColor = color(GRID); }
          // a column chart written as a bar chart (asBar) in a slot too low for its rows and a value axis: no value axis,
          // each bar's value beside it (the tooltip pages' bar chart, measured in round 0)
          if (s.wasColumn && query && s.h < (s.rows * 23 + 92) * (pg.page.h / 720)) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.show = bool(false); visual.objects.labels = obj({ show: bool(true) }); }
          // Round 21 (the capabilities lab's #2, Desktop 2.158, 7 Oct 2026: one small line under the title, shaped right in
          // Arabic, kept on Save): a subtitle from the approved plan only (o.subtitles: a slot's plan role, English or
          // Arabic, or a hand-placed slot's title -> its text); the writer never makes one up
          // (round 22, the code review's b, measured in Desktop 2.158.1304 on 7 Oct: on a planned KPI card the subtitle's line
          // pushes the value down and cuts it in half, the card is sized for a title and a value: never on a card. The keys
          // used are reported, subtitlesUsed, so the caller can say which were not)
          if (o.subtitles && ttl && visual.visualContainerObjects && s.kind !== 'kpi' && s.kind !== 'card') { const key = [].concat(s.role || [], s.title || []).find((k) => typeof o.subtitles[k] === 'string' && o.subtitles[k].trim());
            if (key != null) { visual.visualContainerObjects.subTitle = obj({ show: bool(true), text: str(o.subtitles[key].trim()) }); subtitlesUsed.add(key); } }
          if (s.kind !== 'kpi' && s.kind !== 'card' && ttl) {
            const tf = titleFit(ttl, TITLE, s.w - 2 * Math.round(16 * pg.page.h / 1080)), tp = visual.visualContainerObjects.title[0].properties;
            fitted.set(visual, { ttl, avail: s.w - 2 * Math.round(16 * pg.page.h / 1080), page: pg.name || base });
            if (tf.mode !== 'one') { tp.text = str(tf.shown); if (!tf.one) tp.titleWrap = bool(true); titles[tf.mode].push({ page: pg.name || base, title: ttl, shown: tf.shown }); }
          }
          // the title already names the KPI, so the card's own label under the number is not repeated
          if (type === 'cardVisual') {
            const cf0 = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex - 1] : B.measure) : null;
            const kf = s.kind === 'kpi' ? kpiFits(s, kpiIndex - 1, ttl, cf0) : null;
            const c = kf ? kf.c : cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, { top: Math.round(12 * pg.page.h / 1080), side: SOLID ? Math.round(16 * pg.page.h / 1080) : 0 }, valueEm(cf0));
            let cc = c;
            if (s.kind === 'kpi') {
              const fit = kf.fit;
              const tp = visual.visualContainerObjects.title[0].properties;
              if (fit.mode === 'wrapped') { cc = fit.c; tp.titleWrap = bool(true); kpiTitles.wrapped.push({ page: pg.name || base, title: ttl }); }
              // a one-line title in a row where another title wraps: the second line's height stays free above it, so
              // every value of the row sits at the same height (seen in Desktop 2.158, 2026-10-05: 6 apart without it)
              else if (rowWraps() && kf.two.V >= c.V) cc = Object.assign({}, kf.two, { V: c.V, T: kf.two.T + Math.ceil(kpiTitle * 1.5) });
              if (fit.mode === 'shortened') { tp.text = str(fit.shown); kpiTitles.shortened.push({ page: pg.name || base, title: ttl, shown: fit.shown }); }
            }
            if (s.kind === 'kpi') cc = Object.assign({}, cc, { V: Math.min(cc.V, rowValue()) });
            visual.objects = cardObjects(cc, s.kind === 'kpi' ? align : null, cf0); cardFrame(visual.visualContainerObjects, cc, s.kind === 'kpi' ? kpiTitle : TITLE);
            // Round 21 (the capabilities lab's #1, measured in Desktop 2.158 on 7 Oct 2026; the owner's go): with the "No data"
            // option a card says "No data" (Arabic: لا توجد بيانات) instead of "--": value.showBlankAs in the default entry.
            // The owner (7 Oct, "Keep numbers big"): the value keeps its size. The blank text is drawn at the value's size, so
            // it is written only where it fits there: the lab's anchor (the Arabic text whole on a card 300 wide at 30pt, cut
            // at 240) scaled by our letter widths; a narrower card keeps "--" (told: blankKept).
            if (NODATA && (s.kind === 'kpi' || s.kind === 'card')) {
              const ve = visual.objects.value.find((e) => e.selector && e.selector.id === 'default'), bt = lang === 'ar' ? 'لا توجد بيانات' : 'No data';
              const need = 300 * textWidth(bt, cc.V, false, font) / textWidth('لا توجد بيانات', 30, false, 'Segoe UI');
              if (ve && s.w >= need) ve.properties.showBlankAs = str(bt);
              else if (ve) blankKept.push({ page: pg.name || base, title: ttl || null, w: s.w, need: Math.ceil(need) });
            }
            // #7 (seen in Desktop 2.158, round 11: the value 9 to the right of its title's first letter): a KPI card's inner
            // padding is 0 at the reading start, so the value starts at its title's edge (paddingIndividual and the
            // margins, in Microsoft's theme schema for the card visual)
            if (s.kind === 'kpi') visual.objects.padding = obj({ paddingUniform: num(cc.I), paddingIndividual: bool(true), topMargin: num(cc.I), bottomMargin: num(cc.I), leftMargin: num(rtl ? cc.I : 0), rightMargin: num(rtl ? 0 : cc.I) }, DEF);
            // an SVG design on the card's image (o.svgCards; the JSON Desktop writes for "Select from data", measured in
            // Desktop 2.158, third sitting of 2026-10-04): the nth KPI card of every page
            // Its size (Desktop 2.158, 2026-10-05): without one the image was drawn 65 wide on a 163-wide card and the value
            // was cut; "Image area size" with fixedSize false sizes it (25 drew 32 wide, 30 drew 40): see imgOf.
            // Its side (Desktop 2.158, round 11, 2026-10-05): the card draws the image at the right by default, which in a
            // right-to-left report is the reading start, between the card's edge and the value (a 42pt value touched it);
            // position 'Left' puts it at the far end, and the value sits at the right under its title.
            const sc = kf && kf.im ? kf.im.sc : null;
            if (sc) visual.objects.image = [{ properties: Object.assign({ show: bool(true), imageType: str('imageData'), fixedSize: bool(false), imageAreaSize: num(kf.im.pct) }, rtl ? { position: str('Left') } : {}, { imageData: { expr: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: sc.t } }, Property: sc.m } } } }), selector: { id: 'default' } }];
            // A number format on the report side (measured in Desktop 2.158, D8, 2026-10-04): where the bound measure
            // carries cardFormat (the server sets it for a measure whose model format has no thousand separator),
            // the card gets the entry Desktop itself writes for Display units "Custom" with a format code: a second
            // entry of "value", selected by the field's query reference. Only cards: tables and tooltips not measured.
            const cf = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex - 1] : B.measure) : null;
            if (FULL && cf && cf.m != null && cf.cardFormat && !cardCode(cf)) visual.objects.value.push({ properties: { labelDisplayUnits: num(-1), customFormatString: str(cf.cardFormat) }, selector: { metadata: cf.t + '.' + cf.m } });
          }
          // tables fill their visual (grow to fit), instead of shrinking to their content and leaving the rest empty
          // (on a right-to-left page the title sat on the right and the table on the left)
          if (s.kind === 'table') visual.objects = { columnHeaders: obj(Object.assign({ columnAdjustment: str('growToFit'), autoSizeColumnWidth: bool(true) }, tableText ? { fontSize: num(tableText) } : {})) };
          if (s.kind === 'table' && tableText) Object.assign(visual.objects, { values: obj({ fontSize: num(tableText) }), total: obj({ fontSize: num(tableText) }) });
          // Round 18 (seen in Desktop, 6 Oct 2026, "P7 hand EN": a 420 x 220 matrix of Day Name and four long measures had
          // a horizontal scrollbar and showed three of seven days): the fit had chosen a smaller text and counted the rows
          // at it, but only a table was given that size, so the matrix drew at the theme's. A matrix gets it on its values,
          // headers, row headers and total.
          if (s.kind === 'matrix' && tableText) visual.objects = Object.assign(visual.objects || {}, { values: obj({ fontSize: num(tableText) }), columnHeaders: obj({ fontSize: num(tableText) }), rowHeaders: obj({ fontSize: num(tableText) }), total: obj({ fontSize: num(tableText) }) });
          // each column's header sits over its own values: text on the reading-start side, numbers (measures, and columns
          // the model types as numbers) right-aligned in both directions; "Apply to header" (styleHeader) makes the header
          // follow. (Round 12, #12; seen in Desktop 2.158, 5 Oct 2026: in a right-to-left table with left-aligned numbers,
          // "Friday", right-aligned at the left end, and its first number were 9 apart and read as one text, while 430
          // separated the two measures. Right-aligned, a number ends at its column's far edge, as in English.)
          if (s.kind === 'table' && query) visual.objects.columnFormatting = tableFields(Bt, rtl).map((f) => ({
            properties: { alignment: str(isValue(f) || f.num ? 'Right' : (rtl ? 'Right' : 'Left')), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) },
            selector: { metadata: proj(f).queryRef } }));
          // Round 12 (#23, #32; seen in Desktop 2.158, round 11: six of seven days and a scrollbar): a table whose rows are
          // known (a day, month or quarter name: 7, 12 or 4 rows, a header and a total) gets its rows tighter where they
          // would not fit (grid.rowPadding 0); one that still does not fit is told. Measured (round 11): a row's pitch is
          // 1.415 x the text's height + 2 x rowPadding (1 when none is written), the header 7 more; the title 1.5 x its
          // size; 16 for the visual's own padding.
          if ((s.kind === 'table' || s.kind === 'matrix') && query) {   // (a matrix too: round 16, #15)
            const tf = tableFields(Bt, rtl).find(isTextField), n = tf ? (/(^|\s)(day|weekday)|اليوم/i.test(tf.c) && Bind_nameLike(tf.c) ? 7 : /quarter|الربع/i.test(tf.c) ? 4 : /month|الشهر/i.test(tf.c) && Bind_nameLike(tf.c) ? 12 : 0) : 0;
            if (n) {
              let T = tableText || +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
              const need = (pad, t = T) => { const pitch = 1.415 * t * 4 / 3 + 2 * pad; return 1.5 * TITLE * 4 / 3 + pitch + 7 + (n + 1) * pitch + 16; };
              // Round 18 (FAIL 12: a 420 x 220 matrix at 1920 x 1080 showed three of seven days): a matrix whose rows do not
              // fit even tight takes the largest smaller text, down to Power BI's 8pt, that holds them (and told,
              // tableSmaller); only where even 8pt does not is it told that its last rows scroll (tableRows)
              // (round 19, item 10: a table too, with the same limits; its header keeps its grow-to-fit, the size is merged in)
              if (need(0) > s.h) {
                let t2 = Math.ceil(T) - 1; while (t2 > 8 && need(0, t2) > s.h) t2--;
                if (t2 >= 8 && need(0, t2) <= s.h) { const from = T; T = t2; (s.kind === 'matrix' ? ['values', 'columnHeaders', 'rowHeaders', 'total'] : ['values', 'columnHeaders', 'total']).forEach((k) => { visual.objects = visual.objects || {}; const e = (visual.objects[k] || [])[0]; if (e && e.properties) e.properties.fontSize = num(t2); else visual.objects[k] = obj({ fontSize: num(t2) }); });
                  if (smallEntry) Object.assign(smallEntry, { size: t2, rows: true }); else tableSmaller.push({ page: pg.name || base, size: t2, from, rows: true }); }
              }
              if (need(1) > s.h) { visual.objects = visual.objects || {}; visual.objects.grid = [{ properties: { rowPadding: num(0) } }]; if (need(0) > s.h) tableRows.push({ page: pg.name || base, field: label(tf), rows: n, need: Math.ceil(need(0)), h: s.h }); }
            }
          }
          // the calendar order's helper column (see inOrder): its text in the card colour and as narrow as Desktop allows
          const oh = (s.kind === 'table' || s.kind === 'matrix') && query ? orderedBy(s.kind === 'matrix' ? (Bt.table || []).filter(Boolean) : tableFields(Bt, rtl)) : null;
          if (oh && oh.sortBy && s.kind === 'matrix') { visual.objects = visual.objects || {}; visual.objects.columnFormatting = visual.objects.columnFormatting || []; }
          if (oh && oh.sortBy) { const ref = orderHelper(oh).queryRef;
            visual.objects.columnFormatting.push({ properties: { fontColor: color(u.card), alignment: str('Right'), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) }, selector: { metadata: ref } });
            visual.objects.columnWidth = [{ properties: { value: num(1) }, selector: { metadata: ref } }];
            tableOrder.push({ page: pg.name || base, field: oh.t + '[' + oh.c + ']', by: oh.sortBy.t + '[' + oh.sortBy.c + ']' }); }
          // SVG columns (experimental; measured in Desktop 2.158, D-P1, 2026-10-04): report-level measures of
          // reportExtensions.json, shown as the last columns of the page's first table (the reading end: on a
          // right-to-left page that is the left, where the table's first projection sits)
          // Round 10 (measured in Desktop 2.158, third sitting of 2026-10-04): a picture is never the first projection.
          // Power BI writes the total row's "Total" in the first projection's column, and only when that is a column of
          // text, so in a right-to-left table with pictures the text column comes first, then the pictures, then the
          // measures. The picture's size is the table's grid.imageHeight and imageWidth (75 x 75 by default, which made
          // a 160 x 24 bar 11 tall in a row 77 tall): the tallest and the widest design, within Power BI's 8 to 512.
          if ((s.kind === 'table' || s.kind === 'matrix') && query && !svgDone[pageIndex]) {
            const mine = (o.svgColumns || []).filter((c) => c.page === pageIndex);
            const cols = mine.map((c) => ({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: c.t } }, Property: c.m } }, queryRef: c.t + '.' + c.m, nativeQueryRef: c.m }));
            if (cols.length) {
              const ps = query.queryState.Values.projections;
              // (round 14: a right-to-left table ends with its text column, so the pictures, the reading end, go at the
              // left, after the order's helper column where there is one)
              if (rtl && s.kind === 'table') { const lead = ps.length && /^Min\(/.test(ps[0].queryRef) && ps[0].displayName === ' ' ? 1 : 0; query.queryState.Values.projections = ps.slice(0, lead).concat(cols.slice().reverse(), ps.slice(lead)); }
              else query.queryState.Values.projections = ps.concat(cols);
              // The pictures never push the table past its box (Desktop showed a scrollbar and a cut header with three
              // fields and pictures of 160 and 180 in a 553-wide table, 5 Oct 2026): every other column keeps its room
              // (columnRoom) and the pictures share what is left, each with + 10 like a column; their width is capped by
              // that, 8 at least, and the height follows the designs' ratio. With room, the designs' own size is kept.
              const wide = Math.max(...mine.map((c) => +c.w || 0)) || 75, tt = +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
              const others = query.queryState.Values.projections.filter((p) => !(p.field.Measure && p.field.Measure.Expression.SourceRef.Schema) && p.displayName !== ' ').reduce((a, p) => a + columnRoom(p, tt, font), 0);
              const W = Math.max(8, Math.min(512, wide, Math.floor((s.w - others) / cols.length) - 10));
              const H0 = Math.max(8, Math.min(512, Math.round(Math.max(...mine.map((c) => (+c.h || 75) * Math.min(1, W / (+c.w || 75)))))));
              // Round 18 (measured in Desktop 2.158, 6 Oct 2026, "P4 ring EN": a 64-high picture in a 221-high table at
              // 1280 x 720: the rows 66 apart (the picture + 2), the first 68 under the table's top; one and a half rows
              // showed): a table picture is no taller than lets four rows and the total show, 24 at least.
              const H = Math.min(H0, Math.max(24, Math.floor((s.h - 68 * pg.page.h / 720) / 5) - 2));
              visual.objects = Object.assign(visual.objects || {}, { grid: [{ properties: { imageHeight: num(H), imageWidth: num(W) } }] });
              svgSizes[pageIndex] = { w: W, h: H, design: wide, capped: W < wide };
              // Round 18 (the owner's answer, 6 Oct 2026: "yes drop the number under 40"; a 28-high ring's number could not
              // be read in Desktop): a ring drawn under 40 high takes its version without the number inside (the server's
              // expressionNoNumber); the table's value column carries the number
              if (H < 40 && extFile) mine.forEach((c) => { if (!c.expressionNoNumber) return; const e = extFile.entities.find((x) => x.name === c.t), me = e && e.measures.find((x) => x.name === c.m); if (me) { me.expression = c.expressionNoNumber; extFile.changed = true; ringsSmall.push({ page: pg.name || base, label: c.m, h: H }); } });
              svgDone[pageIndex] = true;
            }
          }
        }
        // Round 19 (the owner's idea, 6 Oct 2026): "No data for this selection" where the visual's measure is blank. A
        // report-level measure (reportExtensions.json, the model untouched) gives the text only when the measure is blank,
        // and "" otherwise; a card shows it in the same box one layer below (a lower z), with the panel's look (the theme's
        // card style), its tooltip off and not on the phone; the visual above it is see-through, so the card's panel is
        // what shows, and its message only when the visual is empty. Charts and tables with a measure of the model.
        if (NODATA && visual && visual.query && ['bar', 'column', 'line', 'donut', 'table'].includes(s.kind)) {
          const st = visual.query.queryState, pr = [].concat((st.Y || {}).projections || [], (st.Values || {}).projections || []).find((p) => p.field && p.field.Measure && !p.field.Measure.Expression.SourceRef.Schema);
          if (pr) {
            const ent = pr.field.Measure.Expression.SourceRef.Entity, mm = pr.field.Measure.Property, nm = (W.noDataName || 'No data: ') + mm;
            if (!noData.some((x) => x.t === ent && x.m === nm)) noData.push({ t: ent, m: nm, expression: 'IF ( ISBLANK ( ' + "'" + ent.replace(/'/g, "''") + "'" + '[' + mm.replace(/\]/g, ']]') + '] ), "' + (lang === 'ar' ? 'لا توجد بيانات لهذا الاختيار' : 'No data for this selection').replace(/"/g, '""') + '", "" )' });
            container({ x: s.x, y: box.y, w: s.w, h: box.h, z: z - 500, parent, kind: 'nodata', noPhone: true, visual: { visualType: 'cardVisual',
              query: q({ Data: [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: ent } }, Property: nm } }, queryRef: ent + '.' + nm, nativeQueryRef: nm }] }),
              objects: { value: [{ properties: { fontSize: num(LABEL), fontColor: color(mixHex(u.text, u.card, 0.3)), horizontalAlignment: str('center') }, selector: { id: 'default' } }], label: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], outline: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], fillCustom: [{ properties: { show: bool(false) } }] },
              visualContainerObjects: { title: obj({ show: bool(false) }), visualTooltip: obj({ show: bool(false) }), general: obj({ altText: str('') }), dropShadow: obj({ show: bool(false) }) } } });
            // Night sitting 6-7 Oct (seen in Desktop 2.158): the card's own inner outline drew a grey box inside every chart,
            // and a chart whose border and shadow were switched off drew about 5 nearer its box's edges than without the
            // option. So the card has no outline, its text centred, and no shadow of its own; the chart keeps the theme's
            // border and shadow and only its background is off (with data the page then differs from one without the option
            // by the panels' edge pixels only, at most 19 of 255).
            visual.visualContainerObjects.background = obj({ show: bool(false) });
          }
        }
        const v = container({ x: s.x, y: box.y, w: s.w, h: box.h, z, parent, visual, kind: s.kind });
        if (CHARTS.includes(s.kind)) charts.push({ v, byMonth: !!trend && same(s.kind === 'line' ? B.date : (B.cats || {})[s.kind], tip.date) });
        z += 1000;
        // the page navigator follows the title in the reading order; its text size is set for the default, hover and
        // selected states (the current page's button is the selected one, and would otherwise show Power BI's own size)
        if (s.kind === 'title' && tabs) {
          const total = tabs.rows.length * tabs.rowH, y0 = title.y + (title.h - total) / 2, accent = u.accent || u.text;
          // the mark keeps the accent colour only where it can be read on the card (3:1 for bold text and a line)
          const mark = contrast(accent, u.card) >= 3 ? accent : u.text, muted = mixHex(u.text, u.card, 0.3);
          // (round 12, #6; seen in Desktop 2.158, round 11: two rows both ending at the logo's side did not line up):
          // the rows share one block, as wide as the widest row, at the logo's side; every row starts at its reading start
          const rowW = (row) => row.reduce((a, i) => a + tabs.ws[i], 0) + tabs.gapB * (row.length - 1), maxW = Math.max(...tabs.rows.map(rowW));
          if (tabs.rows.length > 1 && !tabRows.some((x) => x.page === (pg.name || base))) tabRows.push({ page: pg.name || base, rows: tabs.rows.length, size: tabs.t });
          tabs.rows.forEach((row, r) => {
            // the block sits at the logo's side of the room; in it the first page is at the reading start: leftmost in
            // English, rightmost in Arabic
            const left = tabs.toLogo === 'right' ? tabs.a1 - maxW : tabs.a0;
            let x = rtl ? left + maxW : left;
            row.forEach((i) => {
              const p = PAGES[i], bw = tabs.ws[i], bx = Math.round(rtl ? x - bw : x), current = i === pageIndex, name = String(p.name || base), by = Math.round(y0 + r * tabs.rowH), bh = tabs.rowH - tabs.lineH;
              const tabBtn = container({ x: bx, y: by, w: bw, h: bh, z, parent: groups.header.name, kind: 'navbtn',
                visual: { visualType: 'actionButton',
                  objects: { icon: def({ shapeType: str('blank') }),
                    text: def({ show: bool(true), text: str(name), fontColor: color(current ? mark : muted), fontFamily: str(font), fontSize: num(tabs.t), bold: bool(current) }).concat(current ? [] : [{ properties: { fontColor: color(mark) }, selector: { id: 'hover' } }]),
                    fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
                  visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
              z += 1000;
              if (current) {
                container({ x: Math.round(bx + 4 * k), y: by + bh, w: Math.max(4, Math.round(bw - 8 * k)), h: tabs.lineH, z, parent: groups.header.name, kind: 'navline', of: tabBtn.name,
                  visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: str('rectangle') } }], fill: def({ show: bool(true), fillColor: color(mark), transparency: num(0) }), outline: def({ show: bool(false) }) },
                    visualContainerObjects: frame(null, '') } });
                z += 1000;
              }
              x = rtl ? x - bw - tabs.gapB : x + bw + tabs.gapB;
            });
          });
        } else if (s.kind === 'title' && nav && nav.buttons) {
          // one button per page, in the navigator's box, first page at the right; the current page's filled in the text
          // colour with bold text in the card colour, the others outlined (the navigator's own look)
          const n = PAGES.length, gap = 8 * k, bw = (nav.w - gap * (n - 1)) / n;
          PAGES.forEach((p, i) => {
            const current = i === pageIndex, name = String(p.name || base);
            container({ x: Math.round(nav.x + nav.w - (i + 1) * bw - i * gap), y: nav.y, w: Math.round(bw), h: nav.h, z, parent: groups.header.name, kind: 'navbtn',
              visual: { visualType: 'actionButton',
                objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(name), fontColor: color(current ? u.card : u.text), fontFamily: str(font), fontSize: num(nav.t), bold: bool(current) }),
                  fill: def({ show: bool(true), fillColor: color(current ? u.text : u.card), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(u.text) }) },
                visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
            z += 1000;
          });
        } else if (s.kind === 'title' && nav) {
          container({ x: Math.round(nav.x), y: nav.y, w: Math.round(nav.w), h: nav.h, z, parent: groups.header.name, kind: 'nav',
            visual: { visualType: 'pageNavigator', objects: { text: ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(nav.t) }, selector: { id } })) }, visualContainerObjects: frame(null, W.pages || 'Pages') } });
          z += 1000;
        }
        if (s.kind === 'title' && openBtn) {
          pg.openBm = rnd(); pg.closeBm = rnd();
          container({ x: openBtn.x, y: openBtn.y, w: openBtn.w, h: openBtn.h, z, parent: groups.header.name, kind: 'button', noPhone: true,
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(openBtn.text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
                // (round 16, design finding #23: it was the only boxed control in a header of boxless tabs: no box, no outline;
                // the icon and the word in the text colour, as the tabs)
                fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
              visualContainerObjects: Object.assign(frame(null, W.openFilters || 'Open the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.openBm) }) }) } });
          z += 1000;
        }
      });

      // slide-in filter panel: one hidden group over the page (card, slicers, Reset, Close); two display-only
      // bookmarks show and hide it, so the user's slicer selections stay when it opens and closes
      if (panel && pg.openBm) {
        // (sizes from 1920 x 1080 scaled by k; Close and Reset as big as their text needs, slicers the height a dropdown needs)
        const P = panel, gname = rnd(), kids = [], pad = 16 * k, gap = 10 * k, sw = P.w - 2 * pad;
        // Close is as high as a button's text needs (Arabic: 6 + 1.6 x pt), and the panel's header holds it above the slicers
        const ch = Math.ceil(Math.max(32 * k, 6 + 1.6 * LABEL)), head = Math.max(44 * k, 12 * k + ch);
        const resetText = W.reset || 'Reset filters', closeText = '✕  ' + (W.close || 'Close');
        const rw = resetW(resetText, k, Math.round(sw)), reset = resetFit(resetText, rw, k), bh = reset.h;
        // (round 12, round 9's seen-not-in-scope: on a user's own model a slicer the model has no column for is left out
        // of the panel and told, as in the rail; the panel wrote all three before, the extra ones without a field)
        const all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), fields = B && own ? all3.filter(Boolean) : all3;
        all3.forEach((f, i) => { if (B && own && !f) leftOut.push({ page: pg.name || base, kind: 'slicer', title: (W.slicer || 'Slicer') + ' ' + (i + 1) }); });
        z = Math.max(z, 900000);
        container({ name: gname, x: P.x, y: P.y, w: P.w, h: P.h, z, hidden: true, kind: 'group', groupKey: 'panel', group: { displayName: W.filterPanel || 'Filter panel', groupMode: 'ScaleMode' } });
        z += 1000;
        const add1 = (spec) => { const v = container(Object.assign({ parent: gname, z, noPhone: true }, spec)); kids.push(v.name); z += 1000; return v; };
        // the card: an empty text box with the container background, border and shadow
        add1({ x: P.x, y: P.y, w: P.w, h: P.h, kind: 'text', visual: { visualType: 'textbox', objects: textbox(W.filters || 'Filters', pt(14 * k), true, u.text),
          visualContainerObjects: Object.assign(frame(null, W.filterPanel || 'Filter panel'), {
            background: obj({ show: bool(true), color: color(u.card), transparency: num(0) }),
            border: obj({ show: bool(true), color: color(edge), radius: num(Math.round(12 * k)) }),
            dropShadow: obj({ show: bool(true) }),
            padding: obj({ top: num(Math.round(14 * k)), left: num(Math.round(16 * k)), right: num(Math.round(16 * k)), bottom: num(Math.round(12 * k)) }) }) } });
        // Close, in the panel's top corner at the end of the reading line
        const cw = Math.round(Math.max(96 * k, charW(LABEL) * closeText.length + 16 * k));
        const cx = Math.round(rtl ? P.x + pad : P.x + P.w - pad - cw);
        add1({ x: cx, y: Math.round(P.y + 10 * k), w: cw, h: ch, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(closeText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }), fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
          visualContainerObjects: Object.assign(frame(null, W.closeFilters || 'Close the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.closeBm) }) }) } });
        // slicers stacked, then Reset at the bottom
        const sh = Math.max(slicerH(SLICER_TEXT), Math.min(76 * k, (P.h - head - pad - bh - gap * (fields.length + 1)) / Math.max(1, fields.length))), names = [];
        fields.forEach((f, i) => {
          const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
          const v = add1({ x: Math.round(P.x + pad), y: Math.round(P.y + head + 8 * k + i * (sh + gap)), w: Math.round(sw), h: Math.round(sh), kind: 'slicer',
            visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
              objects: { data: obj({ mode: str('Dropdown') }), header: slicerHeader(f, Math.round(sw)) },
              visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
          names.push(v.name);
        });
        const rb = rnd();
        add1({ x: Math.round(rtl ? P.x + pad + sw - rw : P.x + pad), y: Math.round(P.y + P.h - pad - bh), w: rw, h: bh, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
            fill: resetFill(), outline: def({ show: bool(false) }) },
          visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: str(rb) }) }) } });
        bookmarks.push({ name: rb, page: pageName, targets: names, label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
        const suffix = PAGES.length > 1 ? ' · ' + (pg.name || '') : '';
        bookmarks.push({ name: pg.openBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: false, label: (W.filtersOpen || 'Filters open') + suffix });
        bookmarks.push({ name: pg.closeBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: true, label: (W.filtersClosed || 'Filters closed') + suffix });
      }

      // every chart shows the tooltip page when you hover it: type 'Canvas' is Power BI's name for a report page tooltip
      // ('ReportPage' is not a value: Desktop then shows its default tooltip; measured in Desktop 2.158)
      charts.forEach((c) => { c.v.visual.visualContainerObjects.visualTooltip = obj({ show: bool(true), type: str('Canvas'), section: str(trend && !c.byMonth ? trend.name : tipName) }); });

      // phone layout: Power BI's phone canvas is 323 points wide. Cards go two per row (158 x 100), charts and
      // tables full width, slicers and buttons as short full-width rows, in the reading order of the page.
      const PW = 323, GAP = 8, SIZE = { title: 56, nav: 44, logo: 56, kpi: 100, card: 100, slicer: 64, button: 40, text: 120, table: 270, gauge: 180, donut: 220, map: 220, treemap: 220 };
      const pos = {}, bottom = {};
      let y = 0, col = 0;
      const navBtns = mob.filter((m) => m.kind === 'navbtn');
      const place = (m) => {
        const k = m.kind, half = k === 'kpi' || k === 'card';
        const h = SIZE[k] || 190;
        if (k === 'navbtn') {
          // the page buttons: rows of the 323-wide canvas, each button at least as wide as its name needs at the phone's
          // text size (so two pages share one row, and many pages wrap instead of being cut), the rest of a row shared
          // equally; the first page at the reading start
          const i = navBtns.indexOf(m);
          if (i === 0) {
            if (col) { y += 100 + GAP; col = 0; }
            const need = navBtns.map((b) => Math.min(PW, Math.ceil(textWidth(String(b.v.visual.objects.text[1].properties.text.expr.Literal.Value).slice(1, -1), 10, true, font) + 10)));
            let row = [], used = 0; const rows = [row];
            need.forEach((w, j) => { const add = (row.length ? GAP : 0) + w; if (row.length && used + add > PW) { row = [j]; rows.push(row); used = w; } else { row.push(j); used += add; } });
            // (round 12, #2; seen in Desktop 2.158, round 11: names centred in stretched buttons looked scattered): each
            // button as wide as its name, from the reading start, a fixed gap between them
            rows.forEach((r) => { let x = 0;
              r.forEach((j) => { const w = need[j]; pos[navBtns[j].v.name] = { x: rtl ? PW - x - w : x, y, w, h: SIZE.nav }; x += w + GAP; });
              y += SIZE.nav + GAP; });
          }
          return;
        }
        if (half) {
          const x = col ? PW - 157.5 : 0; pos[m.v.name] = { x: rtl ? PW - 157.5 - x : x, y, w: 157.5, h };
          if (col) { y += h + GAP; col = 0; } else col = 1;
        } else {
          if (col) { y += 100 + GAP; col = 0; }
          pos[m.v.name] = { x: 0, y, w: PW, h }; y += h + GAP;
        }
      };
      const order = ['header', 'filters', 'kpis', null];
      order.forEach((g) => mob.filter((m) => m.kind !== 'group' && !m.noPhone && m.kind !== 'navline' && (g ? m.parent === (groups[g] || {}).name : !m.parent) && m.kind !== 'logo').forEach(place));
      // #5 (round 12; seen in Desktop 2.158, round 11: on the phone the current page was only bold): the line under the
      // current tab on the phone too, 2 high, right under its button (in the gap before the next row)
      mob.filter((m) => m.kind === 'navline' && m.of && pos[m.of]).forEach((m) => { const b = pos[m.of]; pos[m.v.name] = { x: b.x + 4, y: b.y + b.h, w: Math.max(4, b.w - 8), h: 2 }; });
      if (col) { y += 100 + GAP; col = 0; }
      // groups wrap their children on the phone as well; the children keep their page positions: in mobile.json Power BI
      // Desktop reads a grouped visual's position as a page position, not relative to its group as in visual.json
      Object.keys(groups).forEach((g) => {
        const kids = mob.filter((m) => m.parent === groups[g].name && pos[m.v.name]);
        if (!kids.length) return;
        const x0 = Math.min(...kids.map((m) => pos[m.v.name].x)), y0 = Math.min(...kids.map((m) => pos[m.v.name].y));
        const x1 = Math.max(...kids.map((m) => pos[m.v.name].x + pos[m.v.name].w)), y1 = Math.max(...kids.map((m) => pos[m.v.name].y + pos[m.v.name].h));
        pos[groups[g].name] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      });
      // Text on the phone. The page's text sizes are made for the page: on the 323-wide phone canvas they are cut (15pt
      // slicers on 1080, everything on 2160), so each visual gets its own sizes in mobile.json, the same on every page
      // size. A size there is used only when it is written with the selector that property needs on the page (measured
      // in Desktop 2.158, DESKTOP-TESTS.md round 1): none for a text box's paragraph, a slicer's header and items, a
      // container title, a chart's axes, a table's text and the card's container padding (under "default" Desktop
      // ignores it and the page's padding, with its accent-bar side, stays); "default" for a button's text; each state
      // for page buttons. Not covered (not measured): data labels, legends and the text inside donut, funnel, treemap,
      // map and gauge.
      const PHONE = { title: 14, nav: 10, slicer: 10, button: 10, heading: 12, axis: 8, table: 8 };
      const kindOf = {}; mob.forEach((m) => { kindOf[m.v.name] = m.kind; });
      const phoneLook = (v, p) => {
        const vis = v.visual, t = vis.visualType, objects = {}, vco = {};
        const ttl = (vis.visualContainerObjects || {}).title, shown = !!(ttl && ttl[0].properties.show && ttl[0].properties.show.expr.Literal.Value === 'true');
        if (t === 'cardVisual') {
          // a card on the phone (157.5 x 100) gets its own sizes, as on the small tooltip page: the page's 42 would not fit
          // Round 12 (#1; seen in Desktop 2.158, round 11: "Total Sales Last Rama..." on every phone page): a title too
          // long for one line at 10pt wraps to two (titleWrap, as on the page) where two lines and the value fit the card,
          // otherwise it is shortened at a word with "…"; the phone shows the full name where the page shortened it.
          let c = cardFit(p.w, p.h, 1, TIP_TITLE, TIP_VALUE);
          const tl = { fontSize: num(TIP_TITLE), fontColor: color(u.text) }, full = S0(((vis.visualContainerObjects || {}).general || [{ properties: {} }])[0].properties.altText), room = p.w - 2 * c.P;
          if (shown && full && textWidth(full, TIP_TITLE, true, font) > room) {
            const ls = wrapLines(full, TIP_TITLE, room), two = cardFit(p.w, p.h, 1, TIP_TITLE, TIP_VALUE, null, undefined, 2);
            if (ls.length <= 2 && ls.every((l) => textWidth(l, TIP_TITLE, true, font) <= room) && two.V >= 8) { c = two; Object.assign(tl, { text: str(full), titleWrap: bool(true) }); }
            else tl.text = str(oneLine(full, TIP_TITLE, room));
          }
          return { objects: { value: obj({ fontSize: num(c.V) }, DEF), padding: obj({ paddingUniform: num(c.I) }, DEF) },
            visualContainerObjects: { title: obj(tl), padding: obj({ top: num(c.P), bottom: num(c.P), left: num(c.P), right: num(c.P) }) } };
        }
        // (round 12, #4; seen in Desktop 2.158, round 11: pale grey titles on the phone) the title in the text colour
        if (shown) vco.title = obj({ fontSize: num(PHONE.heading), fontColor: color(u.text) });
        if (t === 'textbox' && kindOf[v.name] === 'title') {
          // the header title: 14pt, or the largest size down to 8 whose one line fits the phone's width
          const para = vis.objects.general[0].properties.paragraphs[0], run = para.textRuns[0];
          const size = Math.max(8, Math.min(PHONE.title, Math.floor(p.w / (charW(1) * Math.max(1, String(run.value).length)))));
          objects.general = obj({ paragraphs: [Object.assign({}, para, { textRuns: [Object.assign({}, run, { textStyle: Object.assign({}, run.textStyle, { fontSize: size + 'pt' }) })] })] });
        } else if (t === 'pageNavigator') objects.text = ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(PHONE.nav) }, selector: { id } }));
        else if (t === 'slicer') { objects.header = obj({ textSize: num(PHONE.slicer) }); objects.items = obj({ textSize: num(PHONE.slicer) }); }
        else if (t === 'actionButton') objects.text = obj({ fontSize: num(PHONE.button) }, DEF);
        else if (t === 'lineChart' || t === 'clusteredBarChart' || t === 'clusteredColumnChart') { objects.categoryAxis = obj({ fontSize: num(PHONE.axis) }); objects.valueAxis = obj({ fontSize: num(PHONE.axis) }); }
        else if (t === 'tableEx') { objects.columnHeaders = obj({ fontSize: num(PHONE.table) }); objects.values = obj({ fontSize: num(PHONE.table) }); objects.total = obj({ fontSize: num(PHONE.table) });
          // Round 12 (#29; seen in Desktop 2.158, round 11: the phone table with pictures was wider than the canvas): the
          // pictures' size on the phone, capped by what the other columns leave of the 323 at the phone's 8pt (as on the
          // page, columnRoom), less the visual's padding (16)
          const g = vis.objects && vis.objects.grid && vis.objects.grid[0].properties;
          if (g && g.imageWidth) {
            const ps = vis.query.queryState.Values.projections, pics = ps.filter((x) => x.field.Measure && x.field.Measure.Expression.SourceRef.Schema);
            const others = ps.filter((x) => !pics.includes(x)).reduce((a, x) => a + columnRoom(x, PHONE.table, font), 0);
            const w0 = parseFloat(g.imageWidth.expr.Literal.Value), h0 = parseFloat(g.imageHeight.expr.Literal.Value), w1 = Math.max(8, Math.min(w0, Math.floor((p.w - 16 - others) / Math.max(1, pics.length)) - 10));
            objects.grid = obj({ imageWidth: num(w1), imageHeight: num(Math.max(8, Math.round(h0 * w1 / w0))) });
          } }
        return Object.assign({}, Object.keys(objects).length ? { objects } : {}, Object.keys(vco).length ? { visualContainerObjects: vco } : {});
      };
      // Round 20 (golden task 7, the owner's (a), 7 Oct 2026: on the Arabic page of a model without measures three charts
      // were all titled "عدد Order Id"): charts of a page whose titles would be the same each get their grouping column
      // in brackets, "عدد Order Id (Region)", English and Arabic alike; a title that is already its own is not changed
      {
        const tOf = (v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0], x = t && t.properties && t.properties.text; return x && x.expr && x.expr.Literal ? String(x.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null; };
        // (round 22, the code review's e and h, and seen in Desktop on 7 Oct, "Total Sales by City (City)" twice: the
        // titles are compared in full, not as shortened; charts by the same column are left alone, a bracket would only
        // repeat itself; the new title is fitted like any title, and the alt text carries the same name)
        const same = {}, full = (v) => (fitted.get(v.visual) || {}).ttl || tOf(v), colOf = (v) => { const p = v.visual.query.queryState.Category.projections[0]; return p.displayName || p.nativeQueryRef; };
        visuals.filter((v) => v.visual && v.visual.query && v.visual.query.queryState.Category && tOf(v)).forEach((v) => { (same[full(v)] = same[full(v)] || []).push(v); });
        Object.keys(same).filter((k) => new Set(same[k].map(colOf)).size > 1).forEach((k) => same[k].forEach((v) => { const c = colOf(v);
          // (never a script the title does not have already: round 14's rule keeps an Arabic title free of English names;
          // "عدد Order Id" holds Latin letters already, so "(Region)" may follow it)
          const lat = /[A-Za-z]/, adds = (x) => (AR_LETTERS.test(c) && !AR_LETTERS.test(x)) || (lat.test(c) && !lat.test(x));
          if (!c || adds(k)) return;
          const name = k + ' (' + c + ')', f = fitted.get(v.visual), tp = v.visual.visualContainerObjects.title[0].properties, g = (v.visual.visualContainerObjects.general || [])[0];
          const tf = f ? titleFit(name, TITLE, f.avail) : { mode: 'one', shown: name };
          tp.text = str(tf.shown); if (tf.mode !== 'one' && !tf.one) tp.titleWrap = bool(true); else delete tp.titleWrap;
          if (g && g.properties && g.properties.altText) g.properties.altText = str(name);
          if (f) { ['wrapped', 'shortened'].forEach((m) => { const i = titles[m].findIndex((x) => x.page === f.page && x.title === k); if (i >= 0) titles[m].splice(i, 1); });
            if (tf.mode !== 'one') titles[tf.mode].push({ page: f.page, title: name, shown: tf.shown }); } }));
      }
      visuals.forEach((v) => { headed(v.visual);
        add(D + '/pages/' + pageName + '/visuals/' + v.name + '/visual.json', json(v));
        const p = pos[v.name];
        if (p) add(D + '/pages/' + pageName + '/visuals/' + v.name + '/mobile.json', json(Object.assign({ $schema: SCHEMA.mobile,
          position: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: v.position.z, width: +p.w.toFixed(1), height: +p.h.toFixed(1), tabOrder: v.position.tabOrder } },
          v.visual ? phoneLook(v, p) : {})));
      });
    });

    // the "No data" measures (round 19): into the report's extensions, beside the SVG measures where there are some
    if (noData.length) {
      const ents = extFile ? extFile.entities : [];
      noData.forEach((c) => { let e = ents.find((x) => x.name === c.t); if (!e) ents.push(e = { name: c.t, measures: [] }); e.measures.push({ name: c.m, dataType: 'Text', expression: c.expression }); });
      if (extFile) extFile.changed = true; else add(D + '/reportExtensions.json', json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: ents }));
    }
    if (extFile && extFile.changed) extFile.entry.data = json({ $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/reportExtension/1.0.0/schema.json', name: 'extension', entities: extFile.entities });

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

    // tooltip page: small, hidden in view mode, shown when a chart is hovered. 320 x 284: the card, and a bar chart 184
    // high, which holds 6 rows (measured in Desktop 2.158: a bar row takes 22 and the title and padding 46; a tooltip
    // can't be scrolled, so rows past the last one would be lost behind a scrollbar)
    const tipPage = (name, binding, displayName, visuals, height) => {
      add(D + '/pages/' + name + '/page.json', json({
        $schema: SCHEMA.page, name, displayName, displayOption: 'FitToPage', width: 320, height: height || 284,
        type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: binding, type: 'Tooltip' },
        objects: { background: obj({ color: color(u.card), transparency: num(0) }), outspace: obj({ color: color(u.card) }) }
      }));
      visuals.forEach((s, i) => {
        const v = { $schema: SCHEMA.visual, name: rnd(), position: { x: s.x, y: s.y, z: (i + 1) * 1000, height: s.h, width: s.w, tabOrder: (i + 1) * 1000 }, visual: s.visual };
        headed(s.visual);
        add(D + '/pages/' + name + '/visuals/' + v.name + '/visual.json', json(v));
      });
    };
    const tipCard = cardFit(296, 76, 1, TIP_TITLE, TIP_VALUE);
    const tipFrame = (t) => { const f = frame(t, t); f.title = obj({ show: bool(true), text: str(t), alignment: str(align), fontSize: num(TIP_TITLE) }); return f; };
    // the theme's text sizes are made for the report's full page; on this small page the card value and the titles get
    // their own, so the value isn't cut off and the titles fit
    // (the tooltip's card follows the KPI cards: automatic units with 2 decimals, or the full number with kpiValues "full")
    const tipCardVisual = () => { const objects = cardObjects(tipCard, null, tip.card);
      if (FULL && tip.card && tip.card.m != null && tip.card.cardFormat && !cardCode(tip.card)) objects.value.push({ properties: { labelDisplayUnits: num(-1), customFormatString: str(tip.card.cardFormat) }, selector: { metadata: tip.card.t + '.' + tip.card.m } });
      return { x: 12, y: 8, w: 296, h: 76, visual: { visualType: 'cardVisual', query: q({ Data: [proj(tip.card)] }), objects, visualContainerObjects: cardFrame(tipFrame(label(tip.card)), tipCard, TIP_TITLE) } }; };
    // (the tooltip pages' bars grow from the right in a mirrored report too)
    const tipBar = (vis) => (MIRROR ? mirrorChart(vis, 'bar') : vis);
    tipPage(tipName, tipBinding, W.tooltipPage || 'Tooltip', tip
      ? [tipCardVisual(),
        // a bar chart writes its category names horizontally (a column chart slants or cuts them); its own sizes, as
        // the card has: axis text 8pt, 40% of the width for the names (a 20-character name is whole), no value axis and
        // each bar's value beside it instead, which leaves room for one more row
        { x: 12, y: 92, w: 296, h: 184, visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(tip.cat)], Y: [proj(tip.y)] }), tip.cat),
          objects: { categoryAxis: obj({ fontSize: num(8), maxMarginFactor: lit('40L'), showAxisTitle: bool(false) }), valueAxis: obj({ show: bool(false) }), labels: obj({ show: bool(true), fontSize: num(8) }) },
          visualContainerObjects: tipFrame(tip.y.m === tip.card.m && tip.y.t === tip.card.t ? byTitle(label(tip.y), W.by || 'by', label(tip.cat)) : label(tip.y)) }) }]
      : [{ x: 12, y: 12, w: 296, h: 260, visual: { visualType: 'textbox', objects: textbox(W.tooltipHere || 'Tooltip page: add a card or a small chart here.', 11, false, u.text), visualContainerObjects: frame(null, W.tooltipPage || 'Tooltip') } }]);
    // the trend: the card's measure by month, as a bar chart with the same settings, 310 high on a 320 x 410 page: 12
    // rows (22 a row and 46 for the title and padding), so every month's name is whole and horizontal with its value
    // beside the bar, whatever the measure. Measured in Desktop 2.158 (DESKTOP-TESTS.md, "round 1 built"): at this width
    // a column or line chart loses the last month behind a scrollbar as soon as the value axis's labels are wide
    // ("100K", "0.4M"), and without that axis the first month's name is cut. The owner's choice, 2026-10-03.
    if (trend) tipPage(trend.name, trend.binding, (W.tooltipPage || 'Tooltip') + ' \u00b7 ' + label(tip.date), [tipCardVisual(),
      { x: 12, y: 92, w: 296, h: 310, visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(tip.date)], Y: [proj(tip.card)] }), tip.date),
        objects: { categoryAxis: obj({ fontSize: num(8), maxMarginFactor: lit('40L'), showAxisTitle: bool(false) }), valueAxis: obj({ show: bool(false) }), labels: obj({ show: bool(true), fontSize: num(8) }) },
        visualContainerObjects: tipFrame(byTitle(label(tip.card), W.by || 'by', label(tip.date))) }) }], 410);

    // git: keep local and cached files out of source control
    // in someone's project folder these would replace their own files, so they are left out there
    if (!theirs) {
      add('.gitignore', '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n');
      add('README.md', (W.readme || '').replace(/\{name\}/g, base));
    }
    return { base, files, zip: () => zip(files), leftOut, kpiTitles, titles, tableOrder, tableRows, headerGrew, tableSmaller, svgSizes, noPageButtons, tableColumns, chartColors, chartAxes, tabRows, ringsSmall, shortDays, barCharts, blankKept, subtitlesUsed: [...subtitlesUsed] };
  }

  const api = { build, zip, crc32, textWidth, columnRoom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbip = api;
})(typeof self !== 'undefined' ? self : this);
