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

  // what each slot becomes in Power BI, and the sample fields it shows
  const TYPES = { kpi: 'card', card: 'card', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx',
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
  function bindQuery(kind, B, kpiIndex) {
    const cat = (B.cats || {})[kind], y = (B.y || {})[kind] || B.measure, need = (...fs) => fs.every(Boolean);
    // one field per card: a card past the end of the list stays empty rather than repeating the first KPI
    const kpi = (B.kpis || [])[kpiIndex] || null;
    switch (kind) {
      case 'kpi': return kpi ? q({ Values: [proj(kpi)] }) : null;
      case 'card': return need(B.measure) ? q({ Values: [proj(B.measure)] }) : null;
      case 'line': return need(B.date, B.measure) ? q({ Category: [proj(B.date)], Y: [proj(B.measure)] }) : null;
      case 'bar': case 'column': case 'donut': case 'funnel': return need(cat, y) ? q({ Category: [proj(cat)], Y: [proj(y)] }) : null;
      case 'table': { const fs = (B.table || []).filter(Boolean); return fs.length ? q({ Values: fs.map(proj) }) : null; }
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
    // cut by characters, not UTF-16 units, so an emoji at the cut is never split into a broken file name
    let base = Array.from((o.name || 'Power BI Report').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, 60).join('').trim() || 'Power BI Report';
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
    const def = (props) => [{ properties: props, selector: { id: 'default' } }];

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
      const panel = pg.panel && title && logo ? pg.panel : null;
      if (title && logo) {
        const gap = 24;
        let x0 = rtl ? logo.x + logo.w + gap : title.x + title.w + gap, x1 = rtl ? title.x - gap : logo.x - gap;
        // slide-in filters: the Filters button sits next to the logo, the page buttons use what is left
        if (panel) { const bw = Math.round(Math.min(180, Math.max(120, title.h * 3))); openBtn = { x: rtl ? x0 : x1 - bw, y: title.y, w: bw, h: title.h }; if (rtl) x0 += bw + 16; else x1 -= bw + 16; }
        if (PAGES.length > 1 && x1 - x0 >= 220) { const w = Math.min(x1 - x0, 140 * PAGES.length + 40); nav = { x: rtl ? x0 : x1 - w, y: title.y, w, h: title.h }; }
      }

      sorted.forEach((s) => {
        const g = groupOf(s.kind), parent = g ? groups[g].name : null, type = TYPES[s.kind] || 'card';
        if (s.kind === 'slicer') {
          // the filter panel holds several dropdown slicers and a Reset button:
          // stacked in a side panel, side by side in a top strip
          const fields = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), pad = 10, gap = 8, n = fields.length;
          const across = s.w > s.h, bw = across ? Math.min(160, Math.round(s.w * 0.14)) : s.w - 2 * pad, bh = across ? s.h - 2 * pad : 40;
          const room = across ? s.w - 2 * pad - bw - gap : s.w - 2 * pad;
          const sw = across ? (room - gap * (n - 1)) / n : room, sh = across ? s.h - 2 * pad : Math.min(76, (s.h - 2 * pad - bh - gap * n) / n);
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
              objects: { icon: def({ shapeType: str('reset'), lineColor: color(u.accent || u.text) }), text: def({ show: bool(true), text: str(W.reset || 'Reset filters'), fontColor: color(u.text), fontFamily: str(font) }),
                fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
              visualContainerObjects: Object.assign(frame(null, W.reset || 'Reset filters'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(bm) }) }) } });
          z += 1000;
          bookmarks.push({ name: bm, page: pageName, targets: slicerNames.slice(), label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
          return;
        }
        let visual;
        if (s.kind === 'title') {
          const size = Math.max(12, Math.min(28, Math.round(s.h * 0.42)));
          visual = { visualType: 'textbox', objects: textbox(o.title || base, size, true, u.text), visualContainerObjects: frame(null, o.title || base) };
        } else if (s.kind === 'logo') {
          visual = logoFile
            ? { visualType: 'image', objects: { general: obj({ imageUrl: resource(logoFile) }), imageScaling: obj({ imageScalingType: str('Fit') }) }, visualContainerObjects: frame(null, W.logo || 'Logo') }
            : { visualType: 'textbox', objects: textbox(W.logoHere || 'Your logo', 10, false, mixHex(u.text, u.card, 0.5)), visualContainerObjects: frame(null, W.logo || 'Logo') };
        } else if (s.kind === 'text') {
          visual = { visualType: 'textbox', objects: textbox(W.textHere || 'Explain what the main chart shows and what to do about it.', 11, false, u.text), visualContainerObjects: frame(s.title, s.title) };
        } else {
          const query = B ? bindQuery(s.kind, B, kpiIndex) : null;
          let ttl = s.title;
          const extra = {};
          if (own && B && query) ttl = bindTitle(s.kind, B, W.by || 'by') || ttl;
          if (s.kind === 'kpi') { if (B && query) ttl = label(B.kpis[kpiIndex]); kpiIndex++; }
          // KPI names read as labels: semibold, so the number below stays the hero
          if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(ttl), alignment: str(align), bold: bool(true) });
          visual = { visualType: type, visualContainerObjects: frame(ttl, ttl, extra), drillFilterOtherVisuals: true };
          if (query) visual.query = query;
          // the title already names the KPI, so the card's own label under the number is not repeated
          if (s.kind === 'kpi' || s.kind === 'card') visual.objects = { categoryLabels: obj({ show: bool(false) }) };
        }
        const v = container({ x: s.x, y: s.y, w: s.w, h: s.h, z, parent, visual, kind: s.kind });
        if (!mainChart && ['line', 'column', 'bar'].includes(s.kind)) mainChart = v;
        z += 1000;
        // the page navigator follows the title in the reading order
        if (s.kind === 'title' && nav) {
          container({ x: Math.round(nav.x), y: nav.y, w: Math.round(nav.w), h: nav.h, z, parent: groups.header.name, kind: 'nav',
            visual: { visualType: 'pageNavigator', visualContainerObjects: frame(null, W.pages || 'Pages') } });
          z += 1000;
        }
        if (s.kind === 'title' && openBtn) {
          pg.openBm = rnd(); pg.closeBm = rnd();
          container({ x: openBtn.x, y: openBtn.y, w: openBtn.w, h: openBtn.h, z, parent: groups.header.name, kind: 'button', noPhone: true,
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str('\u2630  ' + (W.filters || 'Filters')), fontColor: color(u.text), fontFamily: str(font) }),
                fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
              visualContainerObjects: Object.assign(frame(null, W.openFilters || 'Open the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.openBm) }) }) } });
          z += 1000;
        }
      });

      // slide-in filter panel: one hidden group over the page (card, slicers, Reset, Close); two display-only
      // bookmarks show and hide it, so the user's slicer selections stay when it opens and closes
      if (panel && pg.openBm) {
        const P = panel, gname = rnd(), kids = [], pad = 16, head = 44, bh = 40, gap = 10;
        const fields = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null);
        z = Math.max(z, 900000);
        container({ name: gname, x: P.x, y: P.y, w: P.w, h: P.h, z, hidden: true, kind: 'group', groupKey: 'panel', group: { displayName: W.filterPanel || 'Filter panel', groupMode: 'ScaleMode' } });
        z += 1000;
        const add1 = (spec) => { const v = container(Object.assign({ parent: gname, z, noPhone: true }, spec)); kids.push(v.name); z += 1000; return v; };
        // the card: an empty text box with the container background, border and shadow
        add1({ x: P.x, y: P.y, w: P.w, h: P.h, kind: 'text', visual: { visualType: 'textbox', objects: textbox(W.filters || 'Filters', 14, true, u.text),
          visualContainerObjects: Object.assign(frame(null, W.filterPanel || 'Filter panel'), {
            background: obj({ show: bool(true), color: color(u.card), transparency: num(0) }),
            border: obj({ show: bool(true), color: color(edge), radius: num(12) }),
            dropShadow: obj({ show: bool(true) }),
            padding: obj({ top: num(14), left: num(16), right: num(16), bottom: num(12) }) }) } });
        // Close, in the panel's top corner at the end of the reading line
        const cw = 96, cx = rtl ? P.x + pad : P.x + P.w - pad - cw;
        add1({ x: cx, y: P.y + 10, w: cw, h: 32, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str('\u2715  ' + (W.close || 'Close')), fontColor: color(u.text), fontFamily: str(font) }), fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
          visualContainerObjects: Object.assign(frame(null, W.closeFilters || 'Close the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.closeBm) }) }) } });
        // slicers stacked, then Reset at the bottom
        const sw = P.w - 2 * pad, sh = Math.min(76, (P.h - head - pad - bh - gap * (fields.length + 1)) / fields.length), names = [];
        fields.forEach((f, i) => {
          const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
          const v = add1({ x: P.x + pad, y: Math.round(P.y + head + 8 + i * (sh + gap)), w: sw, h: Math.round(sh), kind: 'slicer',
            visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
              objects: { data: obj({ mode: str('Dropdown') }), header: obj({ show: bool(true), fontFamily: str(font) }) },
              visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
          names.push(v.name);
        });
        const rb = rnd();
        add1({ x: P.x + pad, y: P.y + P.h - pad - bh, w: sw, h: bh, kind: 'button', visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('reset'), lineColor: color(u.accent || u.text) }), text: def({ show: bool(true), text: str(W.reset || 'Reset filters'), fontColor: color(u.text), fontFamily: str(font) }),
            fill: def({ show: bool(true), fillColor: color(mixHex(u.card, u.text, 0.06)), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(edge) }) },
          visualContainerObjects: Object.assign(frame(null, W.reset || 'Reset filters'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(rb) }) }) } });
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
      // groups wrap their children on the phone as well; children are placed relative to the group
      Object.keys(groups).forEach((g) => {
        const kids = mob.filter((m) => m.parent === groups[g].name && pos[m.v.name]);
        if (!kids.length) return;
        const x0 = Math.min(...kids.map((m) => pos[m.v.name].x)), y0 = Math.min(...kids.map((m) => pos[m.v.name].y));
        const x1 = Math.max(...kids.map((m) => pos[m.v.name].x + pos[m.v.name].w)), y1 = Math.max(...kids.map((m) => pos[m.v.name].y + pos[m.v.name].h));
        pos[groups[g].name] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0, origin: true };
        kids.forEach((m) => { const p = pos[m.v.name]; p.x -= x0; p.y -= y0; });
      });
      visuals.forEach((v) => {
        add(D + '/pages/' + pageName + '/visuals/' + v.name + '/visual.json', json(v));
        const p = pos[v.name];
        if (p) add(D + '/pages/' + pageName + '/visuals/' + v.name + '/mobile.json', json({ $schema: SCHEMA.mobile,
          position: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: v.position.z, width: +p.w.toFixed(1), height: +p.h.toFixed(1), tabOrder: v.position.tabOrder } }));
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
    const tipVisuals = tip
      ? [{ x: 12, y: 8, w: 296, h: 76, visual: { visualType: 'card', query: q({ Values: [proj(tip.card)] }), objects: { categoryLabels: obj({ show: bool(false) }) }, visualContainerObjects: frame(label(tip.card), label(tip.card)) } },
        { x: 12, y: 92, w: 296, h: 140, visual: { visualType: 'clusteredColumnChart', query: q({ Category: [proj(tip.cat)], Y: [proj(tip.y)] }), visualContainerObjects: frame(label(tip.y), label(tip.y)) } }]
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
