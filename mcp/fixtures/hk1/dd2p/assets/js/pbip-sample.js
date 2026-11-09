/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's sample model (0.3.2 SP5, moved from pbip-export.js unchanged): a small sales table so a report made
// without a model of its own opens looking finished, in English or Arabic. The language is given, never read elsewhere:
//   model(lang)  the sample table as model.bim holds it (columns, its DATATABLE partition, six measures)
//   bind(lang)   which of its fields each kind of visual shows (pbip-export.js's Bind)
//   TEXTS        the table's, columns' and measures' names, the months, categories and regions per language
// It never reads a person's model (the example model stays apart from production model reading). It reads pbip-query.js
// (daxNames, AR_MONTHS): in Node required here; in the browser loaded before this file (BUILDER): DAPbipSample.
(function (root) {
  'use strict';
  const Query = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery);
  const { AR_MONTHS, daxNames } = Query;

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
  const pick = (lang) => T[lang === 'ar' ? 'ar' : 'en'];

  const api = { TEXTS: T, model: (lang) => sampleModel(pick(lang)), bind: (lang) => sampleBind(pick(lang)) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipSample = api;
})(typeof self !== 'undefined' ? self : this);
