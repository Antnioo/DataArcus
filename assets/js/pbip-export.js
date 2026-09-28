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
    visual: S + 'item/report/definition/visualContainer/2.1.0/schema.json'
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

  // what each slot becomes in Power BI, and the sample fields it shows
  const TYPES = { kpi: 'card', card: 'card', line: 'lineChart', bar: 'clusteredBarChart', column: 'clusteredColumnChart', donut: 'donutChart', table: 'tableEx',
    gauge: 'gauge', funnel: 'funnel', treemap: 'treemap', map: 'map', text: 'textbox', slicer: 'slicer', title: 'textbox', logo: 'image' };
  function sampleQuery(kind, t, kpiIndex) {
    const tb = t.table, m = t.m, rev = fieldMea(tb, m.rev);
    const kpis = [m.rev, m.ord, m.aov, m.mar, m.cus, m.rpc];
    switch (kind) {
      case 'kpi': return q({ Values: [fieldMea(tb, kpis[kpiIndex % kpis.length])] });
      case 'card': return q({ Values: [rev] });
      case 'line': return q({ Category: [fieldCol(tb, t.month)], Y: [rev] });
      case 'bar': return q({ Category: [fieldCol(tb, t.category)], Y: [rev] });
      case 'column': return q({ Category: [fieldCol(tb, t.region)], Y: [rev] });
      case 'donut': return q({ Category: [fieldCol(tb, t.category)], Y: [rev] });
      case 'table': return q({ Values: [fieldCol(tb, t.region), rev, fieldMea(tb, m.ord), fieldMea(tb, m.mar)] });
      case 'gauge': return q({ Y: [fieldMea(tb, m.mar)] });
      case 'funnel': return q({ Category: [fieldCol(tb, t.category)], Y: [fieldMea(tb, m.ord)] });
      case 'treemap': return q({ Group: [fieldCol(tb, t.category)], Values: [rev] });
      case 'map': return q({ Category: [fieldCol(tb, t.region)], Size: [rev] });
      default: return null;
    }
  }

  // ---------- the project ----------
  // o: { name, lang, rtl, font, ui, page:{w,h}, slots:[{kind,title,x,y,w,h,rail}] in page units, theme, png (Uint8Array),
  //      logo: { bytes, ext } or null, sample: true|false, texts: {...} }
  function build(o) {
    const lang = o.lang === 'ar' ? 'ar' : 'en', t = T[lang], rtl = !!o.rtl, u = o.ui, font = o.font || 'Segoe UI';
    const W = o.texts || {};
    const base = (o.name || 'Power BI Report').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Power BI Report';
    const slug = base.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'report';
    const R = base + '.Report', M = base + '.SemanticModel', D = R + '/definition';
    const themeFile = slug + '-theme.json', bgFile = slug + '-background.png', logoFile = o.logo ? slug + '-logo.' + o.logo.ext : null;
    const files = [];
    const add = (path, data) => files.push({ path: base + '/' + path, data });
    const align = rtl ? 'right' : 'left';
    const edge = mixHex(u.text, u.card, 0.85);

    // project shortcut, report pointer, semantic model
    add(base + '.pbip', json({ $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } }));
    add(R + '/definition.pbir', json({ $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: '../' + M } } }));
    add(M + '/definition.pbism', json({ $schema: SCHEMA.pbism, version: '4.0', settings: {} }));
    const culture = 'en-US';   // data and names can be Arabic; en-US keeps number and date parsing predictable
    add(M + '/model.bim', json({
      compatibilityLevel: 1567,
      model: {
        culture, dataAccessOptions: { legacyRedirects: true, returnErrorValuesAsNull: true }, defaultPowerBIDataSourceVersion: 'powerBI_V3', sourceQueryCulture: culture,
        tables: o.sample ? [sampleModel(t)] : [],
        annotations: [{ name: '__PBI_TimeIntelligenceEnabled', value: '0' }, { name: 'PBI_ProTooling', value: '["DevMode"]' }]
      }
    }));

    // resources: the theme, the background, the logo
    add(R + '/StaticResources/RegisteredResources/' + themeFile, json(o.theme));
    add(R + '/StaticResources/RegisteredResources/' + bgFile, o.png);
    if (logoFile) add(R + '/StaticResources/RegisteredResources/' + logoFile, o.logo.bytes);
    const items = [{ name: themeFile, path: themeFile, type: 'CustomTheme' }, { name: bgFile, path: bgFile, type: 'Image' }];
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
    const mainName = rnd(), tipName = rnd(), tipBinding = rnd();
    add(D + '/pages/pages.json', json({ $schema: SCHEMA.pages, pageOrder: [mainName, tipName], activePageName: mainName }));

    // filter pane in the theme's colors, so it matches the page
    const paneObjects = {
      outspacePane: obj({ backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }),
      filterCard: [
        { properties: { backgroundColor: color(mixHex(u.card, u.background, 0.4)), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Applied' } },
        { properties: { backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Available' } }
      ]
    };
    add(D + '/pages/' + mainName + '/page.json', json({
      $schema: SCHEMA.page, name: mainName, displayName: o.pageName || base, displayOption: 'FitToPage', width: o.page.w, height: o.page.h,
      objects: Object.assign({
        background: obj({ image: { image: { name: str(bgFile), url: resource(bgFile), scaling: str('Fit') } }, transparency: num(0) }),
        outspace: obj({ color: color(u.background) }),
        displayArea: obj({ verticalAlignment: str('Middle') })
      }, paneObjects)
    }));

    // visuals, in reading order: z and tab order follow it, so keyboard users move through the page the way it reads
    const visuals = [];
    // a visual inside a group stores its position relative to the group's top-left corner, not the page
    const origin = {};
    const container = (spec) => {
      const o0 = spec.parent ? origin[spec.parent] : { x: 0, y: 0 };
      const v = { $schema: SCHEMA.visual, name: spec.name || rnd(), position: { x: spec.x - o0.x, y: spec.y - o0.y, z: spec.z, height: spec.h, width: spec.w, tabOrder: spec.z } };
      if (spec.group) origin[v.name] = { x: spec.x, y: spec.y };
      if (spec.group) v.visualGroup = spec.group; else v.visual = spec.visual;
      if (spec.parent) v.parentGroupName = spec.parent;
      if (spec.annotations) v.annotations = spec.annotations;
      visuals.push(v); return v;
    };
    const frame = (title, alt, extra) => Object.assign({
      title: obj(title ? { show: bool(true), text: str(title), alignment: str(align) } : { show: bool(false) }),
      background: obj({ show: bool(false) }),
      border: obj({ show: bool(false) }),
      dropShadow: obj({ show: bool(false) }),
      general: obj({ altText: str(alt || title || '') })
    }, extra || {});
    const textbox = (text, size, bold, colr) => ({ general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: font, fontSize: size + 'pt', fontWeight: bold ? 'bold' : 'normal', color: colr } }], horizontalTextAlignment: align }] }) });

    const sorted = o.slots.slice().sort((a, b) => (a.y - b.y) || (rtl ? b.x - a.x : a.x - b.x));
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
      container({ name: G.name, x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0, z: G.z, group: { displayName: GROUP_NAMES[g], groupMode: 'ScaleMode' } }); });

    sorted.forEach((s) => {
      const g = groupOf(s.kind), parent = g ? groups[g].name : null, type = TYPES[s.kind] || 'card';
      if (s.kind === 'slicer') {
        // the filter panel holds several dropdown slicers: stacked in a side panel, side by side in a top strip
        const fields = o.sample ? [t.region, t.category, t.month] : [null, null, null], pad = 10, gap = 8, n = fields.length;
        const across = s.w > s.h;
        const sw = across ? (s.w - 2 * pad - gap * (n - 1)) / n : s.w - 2 * pad, sh = across ? s.h - 2 * pad : Math.min(76, (s.h - 2 * pad - gap * (n - 1)) / n);
        fields.forEach((f, i) => {
          // in a right-to-left report the first slicer is the rightmost one, so tab order follows the reading
          const x = across ? (rtl ? s.x + s.w - pad - sw - i * (sw + gap) : s.x + pad + i * (sw + gap)) : s.x + pad, y = across ? s.y + pad : s.y + pad + i * (sh + gap);
          const title = f || (W.slicer || 'Slicer') + ' ' + (i + 1);
          container({ x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(sh), z: z, parent,
            visual: { $schema: undefined, visualType: 'slicer', query: f ? q({ Values: [fieldCol(t.table, f)] }) : undefined,
              objects: { data: obj({ mode: str('Dropdown') }), header: obj({ show: bool(true), fontFamily: str(font) }) },
              visualContainerObjects: frame(null, title), drillFilterOtherVisuals: true } });
          z += 1000;
        });
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
        const query = o.sample ? sampleQuery(s.kind, t, kpiIndex) : null;
        let title = s.title;
        const extra = {};
        if (s.kind === 'kpi') { if (o.sample) title = [t.m.rev, t.m.ord, t.m.aov, t.m.mar, t.m.cus, t.m.rpc][kpiIndex % 6]; kpiIndex++; }
        // KPI names read as labels: semibold, so the number below stays the hero
        if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(title), alignment: str(align), bold: bool(true) });
        visual = { visualType: type, visualContainerObjects: frame(title, title, extra), drillFilterOtherVisuals: true };
        if (query) visual.query = query;
        // the title already names the KPI, so the card's own label under the number is not repeated
        if (s.kind === 'kpi' || s.kind === 'card') visual.objects = { categoryLabels: obj({ show: bool(false) }) };
      }
      const v = container({ x: s.x, y: s.y, w: s.w, h: s.h, z, parent, visual });
      if (!mainChart && ['line', 'column', 'bar'].includes(s.kind)) mainChart = v;
      z += 1000;
    });

    // the main chart shows the tooltip page when you hover it
    if (mainChart) mainChart.visual.visualContainerObjects.visualTooltip = obj({ show: bool(true), type: str('ReportPage'), section: str(tipName) });
    visuals.forEach((v) => { if (v.visual) delete v.visual.$schema; add(D + '/pages/' + mainName + '/visuals/' + v.name + '/visual.json', json(v)); });

    // tooltip page: small, hidden in view mode, ready for custom tooltips
    add(D + '/pages/' + tipName + '/page.json', json({
      $schema: SCHEMA.page, name: tipName, displayName: W.tooltipPage || 'Tooltip', displayOption: 'FitToPage', width: 320, height: 240,
      type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: tipBinding, type: 'Tooltip' },
      objects: { background: obj({ color: color(u.card), transparency: num(0) }), outspace: obj({ color: color(u.card) }) }
    }));
    const tipVisuals = o.sample
      ? [{ x: 12, y: 8, w: 296, h: 76, visual: { visualType: 'card', query: q({ Values: [fieldMea(t.table, t.m.rev)] }), objects: { categoryLabels: obj({ show: bool(false) }) }, visualContainerObjects: frame(t.m.rev, t.m.rev) } },
        { x: 12, y: 92, w: 296, h: 140, visual: { visualType: 'clusteredColumnChart', query: q({ Category: [fieldCol(t.table, t.category)], Y: [fieldMea(t.table, t.m.ord)] }), visualContainerObjects: frame(t.m.ord, t.m.ord) } }]
      : [{ x: 12, y: 12, w: 296, h: 216, visual: { visualType: 'textbox', objects: textbox(W.tooltipHere || 'Tooltip page: add a card or a small chart here.', 11, false, u.text), visualContainerObjects: frame(null, W.tooltipPage || 'Tooltip') } }];
    tipVisuals.forEach((s, i) => {
      const v = { $schema: SCHEMA.visual, name: rnd(), position: { x: s.x, y: s.y, z: (i + 1) * 1000, height: s.h, width: s.w, tabOrder: (i + 1) * 1000 }, visual: s.visual };
      add(D + '/pages/' + tipName + '/visuals/' + v.name + '/visual.json', json(v));
    });

    // git: keep local and cached files out of source control
    add('.gitignore', '**/.pbi/localSettings.json\n**/.pbi/cache.abf\n');
    add('README.md', (W.readme || '').replace(/\{name\}/g, base));
    return { base, files, zip: () => zip(files) };
  }

  const api = { build, zip, crc32 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbip = api;
})(typeof self !== 'undefined' ? self : this);
