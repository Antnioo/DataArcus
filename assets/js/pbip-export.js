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
    bookmarks: S + 'item/report/definition/bookmarksMetadata/1.0.0/schema.json'
  };

  // ---------- small helpers ----------
  const lit = (v) => ({ expr: { Literal: { Value: v } } });
  const str = (s) => lit("'" + String(s).replace(/'/g, "''") + "'");
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
  // a bound field: { t: table, c: column } or { t: table, m: measure }
  const proj = (f) => (f.m != null ? fieldMea(f.t, f.m) : fieldCol(f.t, f.c));
  const label = (f) => (f ? (f.m != null ? f.m : f.c) : null);

  // what each slot becomes in Power BI, and the sample fields it shows; cards are the card visual (cardVisual): Microsoft
  // deprecates the legacy "card"
  const TYPES = { kpi: 'cardVisual', card: 'cardVisual', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx',
    gauge: 'gauge', funnel: 'funnel', treemap: 'treemap', map: 'map', text: 'textbox', slicer: 'slicer', title: 'textbox', logo: 'image' };
  // Which fields each kind of visual shows. The sample data and a user's own model both come in this shape:
  // { kpis: [f], measure: f, date: f, cats: { bar, column, donut, funnel, treemap, map }, y: { funnel, gauge },
  //   table: [f], slicers: [f], tip: { card, cat, y } }, where f is a bound field (see proj above)
  function sampleBind(t) {
    const C = (c) => ({ t: t.table, c }), Me = (m) => ({ t: t.table, m }), m = t.m;
    return {
      kpis: [m.rev, m.ord, m.aov, m.mar, m.cus, m.rpc].map(Me), measure: Me(m.rev), date: C(t.month),
      cats: { bar: C(t.category), column: C(t.region), donut: C(t.category), funnel: C(t.category), treemap: C(t.category), map: C(t.region) },
      y: { funnel: Me(m.ord), gauge: Me(m.mar) },
      table: [C(t.region), Me(m.rev), Me(m.ord), Me(m.mar)],
      slicers: [C(t.region), C(t.category), C(t.month)],
      tip: { card: Me(m.rev), cat: C(t.category), y: Me(m.ord) }
    };
  }
  // the query of one visual, or null when a field it needs is not bound
  // rtl: a right-to-left report reverses a table's columns, so its first column (the category) sits on the right,
  // where an Arabic reader starts; Power BI doesn't mirror tables itself
  function bindQuery(kind, B, kpiIndex, rtl) {
    const cat = (B.cats || {})[kind], y = (B.y || {})[kind] || B.measure, need = (...fs) => fs.every(Boolean);
    // one field per card: a card past the end of the list stays empty rather than repeating the first KPI
    const kpi = (B.kpis || [])[kpiIndex] || null;
    switch (kind) {
      // the card visual's field role is Data (with Values or Fields it stays empty)
      case 'kpi': return kpi ? q({ Data: [proj(kpi)] }) : null;
      case 'card': return need(B.measure) ? q({ Data: [proj(B.measure)] }) : null;
      case 'line': return need(B.date, B.measure) ? q({ Category: [proj(B.date)], Y: [proj(B.measure)] }) : null;
      case 'bar': case 'column': case 'donut': case 'funnel': return need(cat, y) ? q({ Category: [proj(cat)], Y: [proj(y)] }) : null;
      case 'table': { const fs = (B.table || []).filter(Boolean); if (rtl) fs.reverse(); return fs.length ? q({ Values: fs.map(proj) }) : null; }
      case 'gauge': return need(y) ? q({ Y: [proj(y)] }) : null;
      case 'treemap': return need(cat, y) ? q({ Group: [proj(cat)], Values: [proj(y)] }) : null;
      case 'map': return need(cat, y) ? q({ Category: [proj(cat)], Size: [proj(y)] }) : null;
      default: return null;
    }
  }
  // chart title for a user's own fields: "Sales by Region"
  function bindTitle(kind, B, by) {
    const cat = (B.cats || {})[kind], y = (B.y || {})[kind] || B.measure;
    if (kind === 'line' && B.date && B.measure) return label(B.measure) + ' ' + by + ' ' + label(B.date);
    if (['bar', 'column', 'donut', 'funnel', 'treemap', 'map'].includes(kind) && cat && y) return label(y) + ' ' + by + ' ' + label(cat);
    if ((kind === 'gauge' || kind === 'card') && y) return label(y);
    return null;
  }

  // ---------- the project ----------
  // o: { name, lang, rtl, font, ui, page:{w,h}, slots:[{kind,title,x,y,w,h,rail}] in page units, theme, png (Uint8Array),
  //      logo: { bytes, ext } or null, sample: true|false, texts: {...},
  //      model: { byPath: 'Their.SemanticModel' } or { byConnection: 'Data Source=...' } for the user's own model,
  //      bind: their fields for each visual (see sampleBind) }
  function build(o) {
    const lang = o.lang === 'ar' ? 'ar' : 'en', t = T[lang], rtl = !!o.rtl, u = o.ui, font = o.font || 'Segoe UI';
    const W = o.texts || {};
    // the data: the sample table, the user's own model (o.model: { byPath } or { byConnection }), or none
    const own = !!(o.model && (o.model.byPath || o.model.byConnection));
    const sample = !!o.sample && !own;
    const B = own ? (o.bind || null) : sample ? sampleBind(t) : null;
    // cut by characters, not UTF-16 units, so an emoji at the cut is never split into a broken file name; at most 30,
    // because the name appears up to three times in a path and Windows limits paths to 260 characters
    // no dots or spaces at either end: ".." would climb out of the folder, and Windows drops a trailing dot or space
    const tidy = (s) => s.replace(/^[.\s]+|[.\s]+$/g, '');
    let base = tidy(Array.from(tidy((o.name || 'Power BI Report').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' '))).slice(0, 30).join('')) || 'Power BI Report';
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
    add(R + '/StaticResources/RegisteredResources/' + themeFile, json(o.theme));
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
    add(D + '/pages/pages.json', json({ $schema: SCHEMA.pages, pageOrder: PAGES.map((pg) => pg.id).concat([tipName]), activePageName: PAGES[0].id }));

    // filter pane in the theme's colors, so it matches the page
    const paneObjects = {
      outspacePane: obj({ backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }),
      filterCard: [
        { properties: { backgroundColor: color(mixHex(u.card, u.background, 0.4)), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Applied' } },
        { properties: { backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Available' } }
      ]
    };
    const frame = (title, alt, extra) => Object.assign({
      title: obj(title ? { show: bool(true), text: str(title), alignment: str(align) } : { show: bool(false) }),
      background: obj({ show: bool(false) }),
      border: obj({ show: bool(false) }),
      dropShadow: obj({ show: bool(false) }),
      general: obj({ altText: str(alt || title || '') })
    }, extra || {});
    const textbox = (text, size, bold, colr) => ({ general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: font, fontSize: size + 'pt', fontWeight: bold ? 'bold' : 'normal', color: colr } }], horizontalTextAlignment: align }] }) });
    // Card visuals: sized so the title and the number fit the box, from Microsoft's card sizing (a line of text takes
    // 1.5 x its size; the card's own label under the number stays hidden, the title already names the KPI). s: the page's
    // scale (height / 720); title, callout: the title and value sizes the card would have. The padding is 8 on a
    // 1920 x 1080 page, as in Microsoft's recipe, and scales with the page. The value keeps the callout size unless the
    // box is too short, or too narrow for 7 characters ("101.91K"); below 8 the inner padding goes first.
    const TH = (o.theme && o.theme.textClasses) || {}, TITLE = +(TH.title || {}).fontSize || 12, CALLOUT = +(TH.callout || {}).fontSize || 28;
    // the theme's text sizes are made for the report's full page; the 320 x 240 tooltip page and the phone get their own
    const TIP_VALUE = 20, TIP_TITLE = 10;
    const cardFit = (w, h, s, title, callout) => {
      const P = Math.round(8 * s / 1.5), line = (f) => Math.ceil(f * 1.5);
      const fit = (I) => Math.min(callout, Math.floor((h - 2 * P - 2 * I - line(title)) / 1.5), Math.floor((w - 2 * P - 2 * I) / (7 * 0.55 * 4 / 3)));
      let I = P, V = fit(I);
      if (V < 8) { I = 0; V = Math.max(8, fit(0)); }
      return { P, I, V };
    };
    // Sizes of the header, page buttons, filter rail and slide-in panel were made on a 1920 x 1080 page: they scale with
    // the page (k = page height / 1080), as cardFit does, and text follows the page within Power BI's limits (8-60pt).
    // Where the 8pt minimum makes a text bigger than its scaled box (small pages), the box grows to fit the text.
    // fitText(text, t, w, maxLines): how a text of size t fits a width w, with Microsoft's card rule (a line takes 1.5 x
    // the size) and 0.55 em per character as in cardFit: the lines it needs (at most maxLines), their height, and
    // whether it fits in them. pt(t): a text size within Power BI's limits. LABEL: button text, the theme's label size.
    const pt = (t) => Math.max(8, Math.min(60, Math.round(t))), lineOf = (t) => Math.ceil(t * 1.5), charW = (t) => t * 0.55 * 4 / 3;
    const fitText = (text, t, w, maxLines) => {
      const need = Math.ceil(charW(t) * String(text).length / Math.max(1, w)), lines = Math.min(maxLines || 1, Math.max(1, need));
      return { lines, h: lines * lineOf(t), fits: need <= lines };
    };
    const LABEL = +(TH.label || {}).fontSize || 10;
    const SLICER_TEXT = +((((((o.theme || {}).visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize) || LABEL;
    // Every card formatting object needs the "default" selector, or Power BI ignores it; the number stays centred, like
    // the legacy card's, in both reading directions; the inner outline would draw a box inside the panel
    const DEF = { id: 'default' };
    const cardObjects = (c) => ({
      value: obj({ fontSize: num(c.V), horizontalAlignment: str('center') }, DEF),
      label: obj({ show: bool(false) }, DEF),
      padding: obj({ paddingUniform: num(c.I) }, DEF),
      layout: obj({ paddingUniform: num(0) }, DEF),
      outline: obj({ show: bool(false) }, DEF)
    });
    // the container: its padding set on the visual (Power BI resets it when other container settings are set), no gap
    // under the title; title: the title's size, written so the height worked out above doesn't depend on the theme
    const cardFrame = (f, c, title) => {
      if (f.title && f.title[0].properties.show && f.title[0].properties.show.expr.Literal.Value === 'true') f.title[0].properties.fontSize = num(title);
      f.padding = obj({ top: num(c.P), bottom: num(c.P), left: num(c.P), right: num(c.P) }, DEF);
      f.spacing = obj({ customizeSpacing: bool(true), spaceBelowTitleArea: num(0), verticalSpacing: num(2) }, DEF);
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

    PAGES.forEach((pg, pageIndex) => {
      const pageName = pg.id;
      add(D + '/pages/' + pageName + '/page.json', json({
        $schema: SCHEMA.page, name: pageName, displayName: pg.name || base, displayOption: 'FitToPage', width: pg.page.w, height: pg.page.h,
        objects: Object.assign({
          background: obj({ image: { image: { name: str(pg.bgFile), url: resource(pg.bgFile), scaling: str('Fit') } }, transparency: num(0) }),
          outspace: obj({ color: color(u.background) }),
          displayArea: obj({ verticalAlignment: str('Middle') })
        }, paneObjects)
      }));

      // visuals, in reading order: z and tab order follow it, so keyboard users move through the page the way it reads
      const visuals = [], mob = [], slicerNames = [];
      // a visual inside a group stores its position relative to the group's top-left corner, not the page
      const origin = {};
      const container = (spec) => {
        const o0 = spec.parent ? origin[spec.parent] : { x: 0, y: 0 };
        const v = { $schema: SCHEMA.visual, name: spec.name || rnd(), position: { x: spec.x - o0.x, y: spec.y - o0.y, z: spec.z, height: spec.h, width: spec.w, tabOrder: spec.z } };
        if (spec.group) origin[v.name] = { x: spec.x, y: spec.y };
        if (spec.group) v.visualGroup = spec.group; else v.visual = spec.visual;
        if (spec.parent) v.parentGroupName = spec.parent;
        if (spec.hidden) v.isHidden = true;
        visuals.push(v); mob.push({ v, kind: spec.kind, parent: spec.parent, group: spec.groupKey, noPhone: spec.noPhone });
        return v;
      };

      const sorted = pg.slots.slice().sort((a, b) => (a.y - b.y) || (rtl ? b.x - a.x : a.x - b.x));
      const groups = {};
      const groupOf = (kind) => (kind === 'title' || kind === 'logo' ? 'header' : kind === 'kpi' ? 'kpis' : kind === 'slicer' ? 'filters' : null);
      const GROUP_NAMES = { header: W.header || 'Header', kpis: W.kpis || 'KPI cards', filters: W.filters || 'Filters' };
      let z = 1000, kpiIndex = 0, mainChart = null;
      sorted.forEach((s) => {
        const g = groupOf(s.kind);
        if (g && !groups[g]) groups[g] = { name: rnd(), x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h, z: 0 };
        if (g) { const G = groups[g]; G.x0 = Math.min(G.x0, s.x); G.y0 = Math.min(G.y0, s.y); G.x1 = Math.max(G.x1, s.x + s.w); G.y1 = Math.max(G.y1, s.y + s.h); }
      });
      // groups sit under their visuals in the layer order
      Object.keys(groups).forEach((g) => { const G = groups[g]; G.z = z; z += 1000;
        container({ name: G.name, x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0, z: G.z, group: { displayName: GROUP_NAMES[g], groupMode: 'ScaleMode' }, kind: 'group', groupKey: g }); });

      // page navigation between the title and the logo, when the report has more than one page
      const title = pg.slots.find((s) => s.kind === 'title'), logo = pg.slots.find((s) => s.kind === 'logo');
      let nav = null, openBtn = null;
      const panel = pg.panel && title && logo ? pg.panel : null, k = pg.page.h / 1080;
      if (title && logo) {
        const gap = 24 * k, openText = '☰  ' + (W.filters || 'Filters');
        let x0 = rtl ? logo.x + logo.w + gap : title.x + title.w + gap, x1 = rtl ? title.x - gap : logo.x - gap;
        // slide-in filters: the Filters button sits next to the logo, the page buttons use what is left
        if (panel) {
          const bw = Math.round(Math.max(Math.min(180 * k, Math.max(120 * k, title.h * 3)), charW(LABEL) * openText.length + 16 * k));
          openBtn = { x: Math.round(rtl ? x0 : x1 - bw), y: title.y, w: bw, h: title.h, text: openText };
          if (rtl) x0 += bw + 16 * k; else x1 -= bw + 16 * k;
        }
        // page buttons: 140 each on 1920 x 1080, or what the longest page name needs (two lines when the header holds
        // them); squeezed into the room left, with smaller text if needed; left out when even 8pt doesn't fit
        if (PAGES.length > 1) {
          const n = PAGES.length, longest = Math.max(...PAGES.map((p) => String(p.name || base).length));
          const need = (t) => { const L = Math.min(2, Math.max(1, Math.floor(title.h / lineOf(t)))); return Math.ceil(charW(t) * Math.ceil(longest / L)) + 16 * k; };
          let t = pt(title.h * 0.3);
          const w = Math.min(x1 - x0, n * Math.max(140 * k, need(t)) + 40 * k);
          while (t > 8 && (need(t) > (w - 40 * k) / n || lineOf(t) > title.h)) t--;
          if (need(t) <= (w - 40 * k) / n && lineOf(t) <= title.h) nav = { x: rtl ? x0 : x1 - w, y: title.y, w, h: title.h, t };
        }
      }

      sorted.forEach((s) => {
        const g = groupOf(s.kind), parent = g ? groups[g].name : null, type = TYPES[s.kind] || 'cardVisual';
        if (s.kind === 'slicer') {
          // the filter panel holds several dropdown slicers and a Reset button:
          // stacked in a side panel, side by side in a top strip
          // (sizes from 1920 x 1080 scaled by k; Reset as wide or as high as its text needs, slicers two lines of theirs)
          const fields = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), pad = 10 * k, gap = 8 * k, n = fields.length;
          const resetText = W.reset || 'Reset filters', across = s.w > s.h;
          const bw = across ? Math.max(Math.min(160 * k, Math.round(s.w * 0.14)), Math.ceil(charW(LABEL) * resetText.length) + lineOf(LABEL) + 24 * k) : s.w - 2 * pad;
          const bh = across ? s.h - 2 * pad : Math.max(40 * k, fitText(resetText, LABEL, bw - lineOf(LABEL) - 24 * k, 2).h + 12 * k);
          const room = across ? s.w - 2 * pad - bw - gap : s.w - 2 * pad;
          const sw = across ? (room - gap * (n - 1)) / n : room;
          const sh = across ? s.h - 2 * pad : Math.max(2 * lineOf(SLICER_TEXT) + 8 * k, Math.min(76 * k, (s.h - 2 * pad - bh - gap * n) / n));
          fields.forEach((f, i) => {
            // in a right-to-left report the first slicer is the rightmost one, so tab order follows the reading
            const x = across ? (rtl ? s.x + s.w - pad - sw - i * (sw + gap) : s.x + pad + i * (sw + gap)) : s.x + pad, y = across ? s.y + pad : s.y + pad + i * (sh + gap);
            const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
            const v = container({ x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(sh), z: z, parent, kind: 'slicer',
              visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
                objects: { data: obj({ mode: str('Dropdown') }), header: obj({ show: bool(true), fontFamily: str(font) }) },
                visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
            slicerNames.push(v.name);
            z += 1000;
          });
          // Reset button: applies a bookmark that clears these slicers
          const bm = rnd(), bx = across ? (rtl ? s.x + pad : s.x + s.w - pad - bw) : s.x + pad, by = across ? s.y + pad : s.y + s.h - pad - bh;
          container({ x: Math.round(bx), y: Math.round(by), w: Math.round(bw), h: Math.round(bh), z, parent, kind: 'button',
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('reset'), lineColor: color(u.accent || u.text) }), text: def({ show: bool(true), text: str(resetText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
                fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
              visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(bm) }) }) } });
          z += 1000;
          bookmarks.push({ name: bm, page: pageName, targets: slicerNames.slice(), label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
          return;
        }
        let visual;
        if (s.kind === 'title') {
          // the title and the logo text follow the header's height (within 8-60pt), and stay on one line in it
          const size = Math.min(pt(s.h * 0.42), Math.max(8, Math.floor(s.h / 1.5)));
          visual = { visualType: 'textbox', objects: textbox(o.title || base, size, true, u.text), visualContainerObjects: frame(null, o.title || base) };
        } else if (s.kind === 'logo') {
          visual = logoFile
            ? { visualType: 'image', objects: { general: obj({ imageUrl: resource(logoFile) }), imageScaling: obj({ imageScalingType: str('Fit') }) }, visualContainerObjects: frame(null, W.logo || 'Logo') }
            // the placeholder until a logo is added: sized to the header slot, in the secondary text colour so it reads
            : { visualType: 'textbox', objects: textbox(W.logoHere || 'Your logo', Math.min(pt(s.h * 0.3), Math.max(8, Math.floor(s.h / 1.5))), false, mixHex(u.text, u.card, 0.3)), visualContainerObjects: frame(null, W.logo || 'Logo') };
        } else if (s.kind === 'text') {
          visual = { visualType: 'textbox', objects: textbox(W.textHere || 'Explain what the main chart shows and what to do about it.', 11, false, u.text), visualContainerObjects: frame(s.title, s.title) };
        } else {
          const query = B ? bindQuery(s.kind, B, kpiIndex, rtl) : null;
          let ttl = s.title;
          const extra = {};
          if (own && B && query) ttl = bindTitle(s.kind, B, W.by || 'by') || ttl;
          if (s.kind === 'kpi') { if (B && query) ttl = label(B.kpis[kpiIndex]); kpiIndex++; }
          // KPI names read as labels: semibold, so the number below stays the hero
          if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(ttl), alignment: str(align), bold: bool(true) });
          visual = { visualType: type, visualContainerObjects: frame(ttl, ttl, extra), drillFilterOtherVisuals: true };
          if (query) visual.query = query;
          // the title already names the KPI, so the card's own label under the number is not repeated
          if (type === 'cardVisual') { const c = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT); visual.objects = cardObjects(c); cardFrame(visual.visualContainerObjects, c, TITLE); }
          // tables fill their visual (grow to fit), instead of shrinking to their content and leaving the rest empty
          // (on a right-to-left page the title sat on the right and the table on the left)
          if (s.kind === 'table') visual.objects = { columnHeaders: obj({ columnAdjustment: str('growToFit'), autoSizeColumnWidth: bool(true) }) };
        }
        const v = container({ x: s.x, y: s.y, w: s.w, h: s.h, z, parent, visual, kind: s.kind });
        if (!mainChart && ['line', 'column', 'bar'].includes(s.kind)) mainChart = v;
        z += 1000;
        // the page navigator follows the title in the reading order
        if (s.kind === 'title' && nav) {
          container({ x: Math.round(nav.x), y: nav.y, w: Math.round(nav.w), h: nav.h, z, parent: groups.header.name, kind: 'nav',
            visual: { visualType: 'pageNavigator', objects: { text: def({ fontSize: num(nav.t) }) }, visualContainerObjects: frame(null, W.pages || 'Pages') } });
          z += 1000;
        }
        if (s.kind === 'title' && openBtn) {
          pg.openBm = rnd(); pg.closeBm = rnd();
          container({ x: openBtn.x, y: openBtn.y, w: openBtn.w, h: openBtn.h, z, parent: groups.header.name, kind: 'button', noPhone: true,
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(openBtn.text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
                fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
              visualContainerObjects: Object.assign(frame(null, W.openFilters || 'Open the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.openBm) }) }) } });
          z += 1000;
        }
      });

      // slide-in filter panel: one hidden group over the page (card, slicers, Reset, Close); two display-only
      // bookmarks show and hide it, so the user's slicer selections stay when it opens and closes
      if (panel && pg.openBm) {
        // (sizes from 1920 x 1080 scaled by k; Close and Reset as big as their text needs, slicers two lines of theirs)
        const P = panel, gname = rnd(), kids = [], pad = 16 * k, head = 44 * k, gap = 10 * k, sw = P.w - 2 * pad;
        const resetText = W.reset || 'Reset filters', closeText = '✕  ' + (W.close || 'Close');
        const bh = Math.round(Math.max(40 * k, fitText(resetText, LABEL, sw - lineOf(LABEL) - 24 * k, 2).h + 12 * k));
        const fields = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null);
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
        const cw = Math.round(Math.max(96 * k, charW(LABEL) * closeText.length + 16 * k)), ch = Math.round(Math.max(32 * k, lineOf(LABEL) + 8 * k));
        const cx = Math.round(rtl ? P.x + pad : P.x + P.w - pad - cw);
        add1({ x: cx, y: Math.round(P.y + 10 * k), w: cw, h: ch, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(closeText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }), fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
          visualContainerObjects: Object.assign(frame(null, W.closeFilters || 'Close the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.closeBm) }) }) } });
        // slicers stacked, then Reset at the bottom
        const sh = Math.max(2 * lineOf(SLICER_TEXT) + 8 * k, Math.min(76 * k, (P.h - head - pad - bh - gap * (fields.length + 1)) / fields.length)), names = [];
        fields.forEach((f, i) => {
          const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
          const v = add1({ x: Math.round(P.x + pad), y: Math.round(P.y + head + 8 * k + i * (sh + gap)), w: Math.round(sw), h: Math.round(sh), kind: 'slicer',
            visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
              objects: { data: obj({ mode: str('Dropdown') }), header: obj({ show: bool(true), fontFamily: str(font) }) },
              visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
          names.push(v.name);
        });
        const rb = rnd();
        add1({ x: Math.round(P.x + pad), y: Math.round(P.y + P.h - pad - bh), w: Math.round(sw), h: bh, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('reset'), lineColor: color(u.accent || u.text) }), text: def({ show: bool(true), text: str(resetText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
            fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
          visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(rb) }) }) } });
        bookmarks.push({ name: rb, page: pageName, targets: names, label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
        const suffix = PAGES.length > 1 ? ' · ' + (pg.name || '') : '';
        bookmarks.push({ name: pg.openBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: false, label: (W.filtersOpen || 'Filters open') + suffix });
        bookmarks.push({ name: pg.closeBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: true, label: (W.filtersClosed || 'Filters closed') + suffix });
      }

      // the main chart of the first page shows the tooltip page when you hover it
      if (mainChart && pageIndex === 0) mainChart.visual.visualContainerObjects.visualTooltip = obj({ show: bool(true), type: str('ReportPage'), section: str(tipName) });

      // phone layout: Power BI's phone canvas is 323 points wide. Cards go two per row (158 x 100), charts and
      // tables full width, slicers and buttons as short full-width rows, in the reading order of the page.
      const PW = 323, GAP = 8, SIZE = { title: 56, nav: 44, logo: 56, kpi: 100, card: 100, slicer: 64, button: 40, text: 120, table: 270, gauge: 180, donut: 220, map: 220, treemap: 220 };
      const pos = {}, bottom = {};
      let y = 0, col = 0;
      const place = (m) => {
        const k = m.kind, half = k === 'kpi' || k === 'card';
        const h = SIZE[k] || 190;
        if (half) {
          const x = col ? PW - 157.5 : 0; pos[m.v.name] = { x: rtl ? PW - 157.5 - x : x, y, w: 157.5, h };
          if (col) { y += h + GAP; col = 0; } else col = 1;
        } else {
          if (col) { y += 100 + GAP; col = 0; }
          pos[m.v.name] = { x: 0, y, w: PW, h }; y += h + GAP;
        }
      };
      const order = ['header', 'filters', 'kpis', null];
      order.forEach((g) => mob.filter((m) => m.kind !== 'group' && !m.noPhone && (g ? m.parent === (groups[g] || {}).name : !m.parent) && m.kind !== 'logo').forEach(place));
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
      visuals.forEach((v) => {
        add(D + '/pages/' + pageName + '/visuals/' + v.name + '/visual.json', json(v));
        const p = pos[v.name];
        // a card on the phone (157.5 x 100) gets its own sizes, as on the small tooltip page: the page's 42 would not fit
        const phoneCard = v.visual && v.visual.visualType === 'cardVisual' ? cardFit(p ? p.w : 0, p ? p.h : 0, 1, TIP_TITLE, TIP_VALUE) : null;
        if (p) add(D + '/pages/' + pageName + '/visuals/' + v.name + '/mobile.json', json(Object.assign({ $schema: SCHEMA.mobile,
          position: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: v.position.z, width: +p.w.toFixed(1), height: +p.h.toFixed(1), tabOrder: v.position.tabOrder } },
          phoneCard ? { objects: { value: obj({ fontSize: num(phoneCard.V) }, DEF), padding: obj({ paddingUniform: num(phoneCard.I) }, DEF) },
            visualContainerObjects: { title: obj({ fontSize: num(TIP_TITLE) }), padding: obj({ top: num(phoneCard.P), bottom: num(phoneCard.P), left: num(phoneCard.P), right: num(phoneCard.P) }, DEF) } } : {})));
      });
    });

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

    // tooltip page: small, hidden in view mode, ready for custom tooltips
    add(D + '/pages/' + tipName + '/page.json', json({
      $schema: SCHEMA.page, name: tipName, displayName: W.tooltipPage || 'Tooltip', displayOption: 'FitToPage', width: 320, height: 240,
      type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: tipBinding, type: 'Tooltip' },
      objects: { background: obj({ color: color(u.card), transparency: num(0) }), outspace: obj({ color: color(u.card) }) }
    }));
    const tip = B && B.tip && B.tip.card && B.tip.cat && B.tip.y ? B.tip : null;
    const tipCard = cardFit(296, 76, 1, TIP_TITLE, TIP_VALUE);
    const tipFrame = (t) => { const f = frame(t, t); f.title = obj({ show: bool(true), text: str(t), alignment: str(align), fontSize: num(TIP_TITLE) }); return f; };
    const tipVisuals = tip
      // the theme's text sizes are made for the report's full page; on this 320 x 240 page the card value and the
      // titles get their own, so the value isn't cut off and the titles fit
      ? [{ x: 12, y: 8, w: 296, h: 76, visual: { visualType: 'cardVisual', query: q({ Data: [proj(tip.card)] }), objects: cardObjects(tipCard), visualContainerObjects: cardFrame(tipFrame(label(tip.card)), tipCard, TIP_TITLE) } },
        { x: 12, y: 92, w: 296, h: 140, visual: { visualType: 'clusteredColumnChart', query: q({ Category: [proj(tip.cat)], Y: [proj(tip.y)] }), visualContainerObjects: tipFrame(label(tip.y)) } }]
      : [{ x: 12, y: 12, w: 296, h: 216, visual: { visualType: 'textbox', objects: textbox(W.tooltipHere || 'Tooltip page: add a card or a small chart here.', 11, false, u.text), visualContainerObjects: frame(null, W.tooltipPage || 'Tooltip') } }];
    tipVisuals.forEach((s, i) => {
      const v = { $schema: SCHEMA.visual, name: rnd(), position: { x: s.x, y: s.y, z: (i + 1) * 1000, height: s.h, width: s.w, tabOrder: (i + 1) * 1000 }, visual: s.visual };
      add(D + '/pages/' + tipName + '/visuals/' + v.name + '/visual.json', json(v));
    });

    // git: keep local and cached files out of source control
    // in someone's project folder these would replace their own files, so they are left out there
    if (!theirs) {
      add('.gitignore', '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n');
      add('README.md', (W.readme || '').replace(/\{name\}/g, base));
    }
    return { base, files, zip: () => zip(files) };
  }

  const api = { build, zip, crc32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbip = api;
})(typeof self !== 'undefined' ? self : this);
