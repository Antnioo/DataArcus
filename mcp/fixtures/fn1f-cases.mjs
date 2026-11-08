// 0.3.2 FN1F (mcp/work/FN1F.md): the inputs test-0.3.2-fn1f.mjs pins, made up here by fixed rules (a seeded generator,
// never a random source, never data): SVG KPI designs for the compiler, models (model.bim JSON) and option sets for the
// field picker's rank, and create_report inputs for reportBuild. Made-up names only.
//   svgDesigns() -> [[id, design, values[]]]      rankCases() -> [[id, modelJson, nKpis, opt(tables, rels)]]
//   buildRuns(designOf, FIELDS) -> [[id, input]]  (the tiny sales model and its fields: test-0.3.2-fn1f.mjs)

// one fixed generator (Park and Miller), a seed per corpus
export const seeded = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// ---------- the SVG KPI designs ----------
export function svgDesigns() {
  const rnd = seeded(20261106), pick = (a) => a[Math.floor(rnd() * a.length)], n = (lo, hi) => Math.round((lo + rnd() * (hi - lo)) * 10) / 10;
  const hex = () => '#' + Math.floor(rnd() * 0xffffff).toString(16).padStart(6, '0');
  const values = [
    { id: 'sales', label: 'Sales', kind: 'measure', measure: 'Sales' }, { id: 'target', label: 'Target', kind: 'measure', measure: 'Target', format: '0.0%' },
    { id: 'ly', label: 'Sales LY', kind: 'measure', measure: 'Sales LY', percent: true }, { id: 'ach', label: 'Ach', kind: 'ratio', a: 'sales', b: 'target' },
    { id: 'growth', label: 'Growth', kind: 'pct', a: 'sales', b: 'ly' }, { id: 'gap', label: 'Gap', kind: 'diff', a: 'target', b: 'sales' },
    { id: 'name', label: 'Region', kind: 'column', column: "'Geo'[Region]" }, { id: 'cnum', label: 'Units', kind: 'column', column: 'Sales[Units]' },
    { id: 'cdiff', label: 'Unit gap', kind: 'diff', a: 'cnum', b: 'sales' }, { id: 'quoted', label: '"Q" %', kind: 'measure', measure: 'Plain', format: '"%"0' }];
  const ids = values.map((v) => v.id);
  const scale = () => ({ v: pick(ids), d0: pick([0, 0, -1, 0.5, 3]), d1: pick([1, 2, 1000000, 1500000, 3]), r0: pick([0, 0, 5, -4]), r1: pick([n(10, 200), 1, -2]) });
  const rules = () => ({ rules: Array.from({ length: Math.floor(rnd() * 3) }, () => ({ v: pick(ids), op: pick(['<', '<=', '>', '>=', '=', '<>', '~']), t: pick([0, 0.7, 0.9, 1, -0.05, 1000000, undefined]), c: hex() })), other: hex() });
  const show = () => ({ v: pick(ids), op: pick(['<', '<=', '>', '>=', '=', '<>']), t: pick([0, 1, 0.9]) });
  const layer = () => {
    const t = pick(['rect', 'circle', 'line', 'text', 'text', 'ring', 'arrow', 'spark', 'spark']), b = {};
    const l = { type: t, name: pick(['L', '', 'Layer name']), opacity: pick([1, 1, 0.5, undefined]) };
    if (t === 'rect') Object.assign(l, { x: n(0, 100), y: n(0, 40), w: n(1, 100), h: n(1, 40), rx: pick([0, 4, undefined]), fill: hex(), stroke: pick(['none', hex(), undefined]), sw: pick([0, 1, 2, 0.5]) });
    if (t === 'circle') Object.assign(l, { cx: n(0, 100), cy: n(0, 40), r: n(1, 30), fill: hex(), stroke: pick([hex(), undefined]), sw: pick([1, 0]) });
    if (t === 'line') Object.assign(l, { x1: n(0, 100), y1: n(0, 40), x2: n(0, 100), y2: n(0, 40), stroke: pick([hex(), undefined]), sw: pick([n(1, 4), undefined]), cap: pick(['butt', 'round']) });
    if (t === 'text') Object.assign(l, { x: n(0, 100), y: n(10, 40), size: pick([n(8, 30), undefined]), weight: pick([400, 700, 600, undefined]), anchor: pick(['start', 'middle', 'end', 'left', undefined]), fill: hex(), text: pick(['Hi', '50% & up', "<it's>", undefined]) });
    if (t === 'ring') Object.assign(l, { cx: pick([50, 40]), cy: pick([50, 40]), r: pick([n(5, 40), undefined]), sw: pick([n(2, 12), undefined]), track: pick([hex(), undefined]), fill: pick([hex(), undefined]), cap: pick(['butt', 'round']), p: pick([n(0, 1), 1.5, -1, undefined]) });
    if (t === 'arrow') Object.assign(l, { x: n(0, 80), y: n(0, 30), size: pick([n(4, 30), undefined, 2]), goodWhen: pick(['up', 'down', undefined]), good: pick([hex(), undefined]), bad: pick([hex(), undefined]), neutral: pick([hex(), undefined]) });
    if (t === 'spark') Object.assign(l, { x: n(-5, 50), y: n(-5, 30), w: n(10, 150), h: n(5, 40), n: pick([2, 6, 12, 24, 80, 1, undefined]), grain: pick(['month', 'week', 'day', 'year']), end: pick(['data', 'filter']),
      complete: rnd() < 0.5, stroke: pick([hex(), undefined]), sw: pick([n(1, 3), undefined]), area: rnd() < 0.5, areaColor: pick([hex(), undefined]), areaOpacity: pick([n(0, 1), undefined, 3]), dot: rnd() < 0.5, dotR: pick([2, undefined]), dotColor: pick([hex(), undefined]) });
    const numeric = { rect: ['x', 'y', 'w', 'h', 'opacity'], circle: ['cx', 'cy', 'r', 'opacity'], line: ['x1', 'y1', 'x2', 'y2'], text: ['x', 'opacity'], ring: [], arrow: [], spark: [] }[t];
    if (t === 'spark') b.series = { v: pick(ids.concat(['nope'])) };
    numeric.forEach((k) => { if (rnd() < 0.3) b[k] = scale(); });
    if (t === 'ring' && rnd() < 0.8) b.p = { v: pick(ids), d0: 0, d1: pick([1, 2]) };
    if (t === 'arrow' && rnd() < 0.8) b.dir = { v: pick(ids) };
    if (t === 'text' && rnd() < 0.8) b.text = { v: pick(ids), fmt: pick(['auto', 'n0', 'n1', 'n2', 'k1', 'm1', 'p0', 'p1', 'text', undefined]), sign: rnd() < 0.5, prefix: pick(['', 'AED ', '#', '<b>', undefined]), suffix: pick(['', ' %', ' of target', undefined]) };
    if (['rect', 'circle', 'text', 'ring'].includes(t) && rnd() < 0.5) b.fill = rules();
    if (['rect', 'line', 'spark', 'circle'].includes(t) && rnd() < 0.3) b.stroke = rules();
    if (rnd() < 0.25) b.show = show();
    if (Object.keys(b).length) l.bind = b;
    return l;
  };
  const sets = [{ Sales: 1240000, Target: 1500000, 'Sales LY': 1100000, Plain: 3 }, { Sales: 0, Target: 0, 'Sales LY': 0 }, { Target: 5 }, { Sales: -3.5, Target: 7.25, 'Sales LY': -1, Plain: -0.004 }, { Sales: 0.0004, Target: 1, 'Sales LY': 2 }];
  const out = [];
  for (let i = 0; i < 420; i++) {
    const d = { name: pick(['Fuzz ' + i, '', 'Tab\there', undefined]), w: pick([200, 240, 3000, 4, undefined]), h: pick([80, 60, undefined]), bg: rnd() < 0.3 ? hex() : pick([undefined, 'red']), radius: pick([8, 0, undefined]), values,
      hideIfBlank: pick([undefined, undefined, 'sales', 'ach', 'name']), mirror: rnd() < 0.3, dateCol: pick([undefined, undefined, "'Cal'[Day]", 'Bad', "'Da''s'[D]]x]"]), clearDateFilters: pick([undefined, false, true]),
      layers: Array.from({ length: 1 + Math.floor(rnd() * 6) }, layer) };
    out.push(['S' + i, d, sets]);
  }
  // hand-made edges: an unknown value kind and layer type, a control character, an empty measure, a bad column, a
  // value worked out from a column, a percent text inside a small ring and a large one, a scale of an empty range,
  // a deep chain of values
  const deep = Array.from({ length: 24 }, (_, k) => (k ? { id: 'v' + k, label: 'V' + k, kind: 'diff', a: 'v' + (k - 1), b: 'v0' } : { id: 'v0', label: 'V0', kind: 'measure', measure: 'Base' }));
  const edges = [
    { values: [{ id: 'a', kind: 'mystery' }, { id: 'b', label: 'B', kind: 'measure', measure: '' }, { id: 'c', label: 'C', kind: 'column', column: 'nope' }, { id: 'd', label: 'D', kind: 'column', column: 'T[\u0001x]' }, { id: 'e', label: 'E', kind: 'measure', measure: 'M\u0007' }],
      layers: [{ type: 'hexagon' }, { type: 'text', x: 5, y: 10, bind: { text: { v: 'b' } } }, { type: 'rect', x: 0, y: 0, w: 5, h: 5, bind: { w: { v: 'a', d0: 1, d1: 1, r0: 3, r1: 9 } } }] },
    { values: [{ id: 's', label: 'Share', kind: 'measure', measure: 'Share', format: '0.0%' }, { id: 'r', label: 'Ratio', kind: 'ratio', a: 's', b: 's' }],
      layers: [{ type: 'ring', cx: 30, cy: 30, r: 12, sw: 4 }, { type: 'text', x: 30, y: 30, size: 14, weight: 700, bind: { text: { v: 's', fmt: 'auto' } } }, { type: 'ring', cx: 120, cy: 30, r: 40, sw: 4 }, { type: 'text', x: 120, y: 30, size: 12, bind: { text: { v: 'r' } } }, { type: 'text', x: 200, y: 30, size: 12, weight: 600, bind: { text: { v: 'r', fmt: 'n1' } } }] },
    { values: deep.concat([{ id: 'col', label: 'Col', kind: 'column', column: "'T'[C]" }, { id: 'mix', label: 'Mix', kind: 'pct', a: 'v0', b: 'col' }]),
      layers: [{ type: 'spark', x: 0, y: 0, w: 100, h: 20, bind: { series: { v: 'v23' } } }, { type: 'text', x: 1, y: 2, bind: { text: { v: 'mix', fmt: 'n0' } } }, { type: 'text', x: 1, y: 2, bind: { text: { v: 'col', fmt: 'text', sign: true } } }] },
    { mirror: true, w: 300, values: [{ id: 'm', label: 'M', kind: 'measure', measure: 'M' }], layers: [{ type: 'text', x: 10, y: 10, anchor: 'end', bind: { x: { v: 'm', d0: 0, d1: 10, r0: 0, r1: 100 }, text: { v: 'm' } } }, { type: 'text', x: 10, y: 10, text: 'plain' },
      { type: 'arrow', x: 5, y: 5 }, { type: 'line', x1: 0, y1: 0, x2: 9, y2: 9, opacity: 0.3 }, { type: 'spark', x: 0, y: 0, opacity: 0.4, area: true, dot: true, bind: { series: { v: 'm' } } }] },
    { values: [{ id: 'm', label: 'Same', kind: 'measure', measure: 'M' }, { id: 'n', label: 'same', kind: 'measure', measure: 'N' }, { id: 'k', label: '9 lives', kind: 'measure', measure: 'K' }, { id: 'l', label: 'L1 x', kind: 'measure', measure: 'L' }, { id: 'z', label: 'سعر', kind: 'measure', measure: 'Z' }],
      hideIfBlank: 'm', name: 'Names\u0000test', layers: [{ type: 'text', x: 1, y: 1, bind: { text: { v: 'n' }, show: { v: 'k', op: '>', t: 2 } } }, { type: 'circle', cx: 1, cy: 1, r: 1, bind: { r: { v: 'l', d0: 0, d1: 5, r0: -2, r1: 3 } } }, { type: 'text', x: 1, y: 1, bind: { text: { v: 'z', fmt: 'p0' } } }] }
  ];
  // (S14, S27, S99) a sparkline of a value worked out from a refused measure; a bold percent inside a ring that holds
  // it only at 1.05 of its width; a name of control characters only
  edges.push({ name: '\u0001\u0002', values: [{ id: 'e', label: 'E', kind: 'measure', measure: 'M\u0007' }, { id: 'f', label: 'F', kind: 'diff', a: 'e', b: 'e' }, { id: 'p', label: 'P', kind: 'measure', measure: 'P', format: '0%' }],
    layers: [{ type: 'spark', x: 0, y: 0, w: 50, h: 20, bind: { series: { v: 'f' } } }, { type: 'ring', cx: 40, cy: 40, r: 33, sw: 6 }, { type: 'text', x: 40, y: 40, size: 14, weight: 700, bind: { text: { v: 'p' } } }] });
  edges.forEach((d, i) => out.push(['E' + i, d, sets]));
  return out;
}

// ---------- the models for rank ----------
const c = (name, dataType, more) => Object.assign({ name }, dataType ? { dataType } : {}, more || {});
const m = (name, expression, formatString, more) => Object.assign({ name, expression }, formatString != null ? { formatString } : {}, more || {});
const rel = (fromTable, fromColumn, toTable, toColumn, more) => Object.assign({ fromTable, fromColumn, toTable, toColumn }, more || {});
export function rankCases(count = 260) {
  const rnd = seeded(1106), pick = (a) => a[Math.floor(rnd() * a.length)], some = (a, p) => a.filter(() => rnd() < p);
  const FACTS = ['Sales', 'Orders', 'Calls', 'Visits', 'Tickets', 'المبيعات'], CATS = ['Region', 'Product', 'Channel', 'Segment', 'Status', 'Branch', 'Notes', 'Comments', 'Order Id', 'Invoice', 'Latitude', 'Geo Point',
    'Customer Code', 'Email', 'Is Promo', 'المنطقة', 'Region (Arabic)', 'Customer Name', 'Agent', 'Priority', 'City', 'Team'];
  const NUMS = ['Amount', 'Qty', 'Price', 'Cost', 'Units', 'Duration', 'Score'], CAL_COLS = [['Date', 'dateTime'], ['Year', 'int64'], ['Calendar Year', 'int64'], ['Fiscal Year', 'int64'], ['Month Name', 'string'],
    ['Month Short', 'string'], ['Month Number', 'int64'], ['Month', 'string'], ['Month Year', 'string'], ['Year Month', 'string'], ['Year Month Sort', 'int64'], ['Year Month Number', 'unknown'], ['Quarter', 'string'],
    ['Day Name', 'string'], ['Day Short', 'string'], ['Day Name (Arabic)', 'string'], ['Month Name (Arabic)', 'string'], ['Hijri Month Name', 'string'], ['Hijri Month', 'int64'], ['اسم الشهر', 'string'],
    ['Is Ramadan', 'boolean'], ['Ramadan Day', 'int64'], ['Is Festival', 'boolean'], ['Festival Day', 'int64'], ['Is Holiday', 'boolean'], ['Holiday Flag', 'boolean'], ['Holiday Day', 'int64'], ['Timestamp', 'dateTime'], ['السنة', 'int64']];
  const FMTS = ['#,0', '"$"#,0', '0.0%', '#,0 "AED"', undefined, '0.00', '€#,0'];
  const out = [];
  for (let i = 0; i < count; i++) {
    const fact = pick(FACTS), cats = some(CATS, 0.3), nums = some(NUMS, 0.5).concat(['Amount']).filter((x, k, l) => l.indexOf(x) === k);
    const calName = pick(['Date', 'Calendar', 'Gulf Calendar', 'Cal', 'التقويم']), calCols = some(CAL_COLS, 0.45);
    if (!calCols.some(([n]) => n === 'Date') && rnd() < 0.7) calCols.unshift(['Date', 'dateTime']);
    const sortBy = (n) => (/^Month (Name|Short)$/.test(n) && calCols.some(([x]) => x === 'Month Number') ? { sortByColumn: 'Month Number' } : n === 'Month Year' && rnd() < 0.5 ? { sortByColumn: 'Year Month Sort' } : {});
    const dax = calCols.length && rnd() < 0.3 ? { partitions: [{ source: { type: 'calculated', expression: `ADDCOLUMNS ( CALENDAR ( DATE ( ${pick([2022, 2024])}, 1, 1 ), DATE ( ${pick([2024, 2025])}, 12, 31 ) ), "Year", YEAR ( [Date] ) )` } }] } : {};
    const typeless = rnd() < 0.2;
    const cal = calCols.length ? [Object.assign({ name: calName, columns: calCols.map(([n, t]) => c(n, typeless ? undefined : t, sortBy(n))), measures: [] }, rnd() < 0.7 ? { dataCategory: 'Time' } : {}, dax)] : [];
    const meas = [];
    const ref = (x) => '[' + x + ']';
    nums.forEach((n) => meas.push(m(pick(['Total ', 'Sum of ', '', 'Gross ']) + n, `SUM ( '${fact}'[${n}] )`, pick(FMTS))));
    meas.push(m(pick(['Orders', 'Count', 'Rows', 'عدد الطلبات']), `COUNTROWS ( '${fact}' )`, pick(FMTS)));
    const base = meas.map((x) => x.name);
    if (rnd() < 0.5) meas.push(m(pick(['Net Sales', 'Sales', 'Net Revenue']), ref(base[0]) + ' - 0', pick(FMTS)), m(pick(['Gross Sales', 'Sales before Discounts', 'Gross Revenue']), `SUM ( '${fact}'[Amount] )`, pick(FMTS)));
    if (rnd() < 0.5) meas.push(m('Margin %', `DIVIDE ( ${ref(base[0])}, ${ref(base[base.length - 1])} )`, '0.0%'));
    if (rnd() < 0.4) meas.push(m(base[0] + ' PY', `CALCULATE ( ${ref(base[0])}, SAMEPERIODLASTYEAR ( '${calName}'[Date] ) )`, pick(FMTS)));
    if (rnd() < 0.3) meas.push(m('Prev Month', `CALCULATE ( ${ref(base[0])}, PREVIOUSMONTH ( '${calName}'[Date] ) )`));
    if (rnd() < 0.3) meas.push(m('All ' + base[0], `CALCULATE ( ${ref(base[0])}, ALL ( '${fact}' ) )`), m('Gap', `${ref('All ' + base[0])} - ${ref(base[0])}`));
    if (rnd() < 0.3) meas.push(m('Share', `DIVIDE ( ${ref(base[0])}, ${ref('All ' + base[0])} )`));
    if (rnd() < 0.3) meas.push(m('Rows All', `COUNTROWS ( ALLSELECTED ( '${fact}' ) )`));
    if (rnd() < 0.3) meas.push(m('Alias', ref(base[0])), m('Label', `IF ( ${ref(base[0])} > 0, "Up", "Down" )`));
    if (rnd() < 0.2) meas.push(m('Dyn', `SUM ( '${fact}'[Amount] )`, null, { formatStringDefinition: { expression: '"#,0"' } }), m('Plain', `SUM ( '${fact}'[Amount] )`));
    if (rnd() < 0.2) meas.push(m('Sales (old)', `SUM ( '${fact}'[Amount] )`, '#,0'), m('Revenue', `SUMX ( '${fact}', '${fact}'[Qty] * '${fact}'[Price] )`, '"$"#,0'), m('Selected', 'HASONEVALUE ( X[Y] )'));
    if (rnd() < 0.2) meas.push(m('إجمالي المبيعات', `SUM ( '${fact}'[Amount] )`, '#,0'), m('Sales Amount', `SUM ( '${fact}'[Amount] )`, '#,0'));
    const facts = { name: fact, columns: nums.map((n) => c(n, pick(['double', 'int64', 'decimal']), rnd() < 0.2 ? { summarizeBy: 'none' } : {})).concat(cats.map((n) => c(n, /^Is /.test(n) ? 'boolean' : pick(['string', 'string', 'unknown']))),
      [c('Order Date', 'dateTime'), c('Created At', 'dateTime', { formatString: 'General Date' })]), measures: meas };
    const look = rnd() < 0.5 ? [{ name: 'Lookup', columns: [c('Key', 'int64'), c('Group', 'string'), c('Category', 'string'), c('Kind', 'string')], measures: [] }] : [];
    const other = rnd() < 0.3 ? [{ name: 'Targets', columns: [c('Target Date', 'dateTime'), c('Target Group', 'string'), c('Target', 'double')], measures: [m('Target Total', "SUM ( 'Targets'[Target] )", '#,0')] }] : [];
    const measuresTable = rnd() < 0.25 ? [{ name: 'Measures', columns: [c('x', 'string', { isHidden: true })], measures: [m('Calc Total', ref(base[0]) + ' * 1', '#,0'), m('Read Other', "SUM ( 'Targets'[Target] )")] }] : [];
    const tables = [facts].concat(cal, look, other, measuresTable);
    const rels = [];
    if (cal.length && calCols.some(([n]) => n === 'Date') && rnd() < 0.8) rels.push(rel(fact, 'Order Date', calName, 'Date'));
    if (look.length && rnd() < 0.7) rels.push(rel(fact, 'Key', 'Lookup', 'Key'));
    if (other.length && cal.length && rnd() < 0.5) rels.push(rel('Targets', 'Target Date', calName, 'Date'));
    const json = { model: { tables, relationships: rels } };
    const nKpis = pick([0, 1, 2, 3, 4, 4, 5, 6]), lang = pick([undefined, 'en', 'ar', 'en']), withRels = rnd() < 0.7;
    const statsMode = pick([null, null, 'counts', 'one', 'wide']), pinMode = pick([null, null, null, 'kpis', 'cats', 'date', 'noDate', 'slicers', 'main', 'table']);
    const exclude = rnd() < 0.25, axis = rnd() < 0.35, full = rnd() < 0.2, mainOpt = rnd() < 0.2;
    const opt = (T, R) => {
      const o = {}; if (lang) o.lang = lang; if (withRels && R.length) { o.relationships = R; o.modelTables = T; }
      const cols = []; T.forEach((t) => (t.columns || []).forEach((x) => cols.push({ t: t.name, c: x.name, x })));
      const k = (t, n) => "'" + t.replace(/'/g, "''") + "'[" + n.replace(/\]/g, ']]') + ']';
      if (statsMode) { const rows = {}, distinct = {}; T.forEach((t, j) => { rows[t.name] = statsMode === 'wide' ? 9000 : 150 * (j + 1); });
        cols.forEach(({ t, c: n }, j) => { distinct[k(t, n)] = /year$/i.test(n) && !/month/i.test(n) ? (statsMode === 'one' ? 1 : 3) : /month\s*year|year\s*month/i.test(n) ? (statsMode === 'one' ? 12 : 30) : statsMode === 'wide' ? (j % 3 ? 6000 : 8500) : 2 + (j * 7) % 40; });
        rows.Nowhere = 4; distinct['Bad[Half]'] = 1.5; o.stats = { rows, distinct }; }
      const texts = cols.filter((x) => (x.x.dataType || '') === 'string'), ms = []; T.forEach((t) => (t.measures || []).forEach((x) => ms.push({ t: t.name, m: x.name })));
      if (exclude && texts.length) o.excludeColumns = [{ t: texts[0].t, c: texts[0].c }];
      if (axis) o.axisFor = cols.filter((x) => /^(Is |Holiday Flag)/.test(x.c)).map((x) => ({ t: x.t, c: x.c, values: [true] })).concat([{ t: 'X', c: 'Y', values: [true, false] }, null]);
      if (full) o.kpiValues = 'full';
      if (mainOpt && ms.length > 1) o.main = ms[1];
      if (pinMode) { const P = {}; if (pinMode === 'kpis') P.kpis = ms.slice(0, 2); if (pinMode === 'cats' && texts.length) { P.catA = { t: texts[0].t, c: texts[0].c }; if (texts[1]) P.catB = { t: texts[1].t, c: texts[1].c }; }
        if (pinMode === 'date') P.date = cols.find((x) => /date/i.test(x.c)) ? { t: cols.find((x) => /date/i.test(x.c)).t, c: cols.find((x) => /date/i.test(x.c)).c } : null; if (pinMode === 'noDate') P.noDate = true;
        if (pinMode === 'slicers' && texts.length) P.slicers = [{ t: texts[texts.length - 1].t, c: texts[texts.length - 1].c }]; if (pinMode === 'main' && ms.length) P.main = ms[ms.length - 1];
        if (pinMode === 'table') P.table = texts.slice(0, 2).map((x) => ({ t: x.t, c: x.c })); o.pinned = P; }
      return o;
    };
    out.push(['R' + i, json, nKpis, opt]);
  }
  return out;
}

// the edges no generated model sat on (one small model per condition; FN1F's mutants named in the note)
const T1 = (name, columns, measures, more) => Object.assign({ name, columns, measures: measures || [] }, more || {});
const CALT = (name, cols, more) => T1(name, cols.map(([n, t, o]) => c(n, t, o)), [], Object.assign({ dataCategory: 'Time' }, more || {}));
const kk = (t, n) => "'" + t + "'[" + n + ']';
export function rankEdges() {
  const money = '"$"#,0', E = [];
  const add = (id, tables, rels, n, o) => E.push([id, { model: { tables, relationships: rels || [] } }, n, () => o || {}]);
  // a core sum after a measure of the same group with every tie-break word, used by another (the core weight, 3)
  add('E-core', [T1('S', [c('Amount', 'double'), c('Region', 'string')], [m('Total Revenue', "SUM ( 'S'[Amount] ) + 0", money), m('Plain', "SUM ( 'S'[Amount] )", money), m('Use', '[Total Revenue] * 2', money)])], [], 6);
  // two time-dependent measures: a variant and one that only reads it (the variant weight, 4)
  add('E-variant', [T1('S', [c('Amount', 'double'), c('Day', 'dateTime')], [m('Sales', "SUM ( 'S'[Amount] )", money), m('Sales PY', "CALCULATE ( [Sales], SAMEPERIODLASTYEAR ( 'S'[Day] ) )", money), m('Difference', '[Sales] - [Sales PY]', money)])], [], 6);
  // a period measure named with a ] and read through it ([Prev]]Odd]); a cycle of two measures
  add('E-names', [T1('S', [c('Amount', 'double'), c('Day', 'dateTime')], [m('Sales', "SUM ( 'S'[Amount] )", money), m('Prev]Odd', "CALCULATE ( [Sales], PREVIOUSMONTH ( 'S'[Day] ) )", money), m('Uses', '[Prev]]Odd] + 1', money),
    m('Loop A', '[Loop B] + 1', '#,0'), m('Loop B', '[Loop A] + 1', '#,0')])], [], 6);
  // an alias of an alias (the same value: one card); a measure over itself; two widened forms of a hidden value
  add('E-keys', [T1('S', [c('Amount', 'double'), c('Cost', 'double')], [m('Base', "SUM ( 'S'[Amount] )", money), m('Mid', '[Base]', money), m('Top', '[Mid]', money), m('One', 'DIVIDE ( [Base], [Base] )', '0.0%'),
    m('Hidden', "SUM ( 'S'[Cost] )", money, { isHidden: true }), m('All One', "CALCULATE ( [Hidden], ALL ( 'S' ) )", money), m('All Two', "CALCULATE ( [Hidden], ALLSELECTED ( 'S' ) )", money)])], [], 6);
  // self differences with two minus signs
  add('E-diff', [T1('S', [c('Amount', 'double'), c('Cost', 'double')], [m('Sales', "SUM ( 'S'[Amount] )", money), m('Cost', "SUM ( 'S'[Cost] )", money), m('Net', '[Sales] - [Cost]', money), m('D4', '[Sales] - [Cost] - [Net]', money), m('All Sales', "CALCULATE ( [Sales], ALL ( 'S' ) )", money), m('D1', '[Sales] - [Sales] - [Sales]', money), m('D2', '[All Sales] - [Sales] - 0', money), m('D3', '( [All Sales] - [Sales] ) - ( [All Sales] - [Sales] )', money)])], [], 6);
  // the first measure not a card (a value minus its ALL form) and not marked: main is the next one
  add('E-main', [T1('S', [c('Amount', 'double'), c('Region', 'string')], [m('Base', "SUM ( 'S'[Amount] )", money, { isHidden: true }), m('Total Revenue Gap', '[Everything] - [Base]', money),
    m('Everything', "CALCULATE ( [Base], ALL ( 'S' ) )", money), m('Rows', "COUNTROWS ( 'S' )", '#,0')])], [], 2);
  // a hidden label sorted by a visible month code (never the axis)
  add('E-sort', [T1('S', [c('Amount', 'double'), c('Day', 'dateTime')], [m('Sales', "SUM ( 'S'[Amount] )", money)]), CALT('Cal', [['Date', 'dateTime'], ['Month Code', 'string'], ['Month Label', 'string', { isHidden: true, sortByColumn: 'Month Code' }]])], [rel('S', 'Day', 'Cal', 'Date')], 2, null);
  // a month name over two years by the counts (years 2), and over 13 year-months
  const cal = (extra) => CALT('Cal', [['Date', 'dateTime'], ['Month Name', 'string', { sortByColumn: 'Month Number' }], ['Month Number', 'int64']].concat(extra));
  const fact = T1('S', [c('Amount', 'double'), c('Day', 'dateTime'), c('Region', 'string')], [m('Sales', "SUM ( 'S'[Amount] )", money)]);
  add('E-years', [fact, cal([['Year', 'int64'], ['Year Month', 'string']])], [rel('S', 'Day', 'Cal', 'Date')], 2, { stats: { rows: { S: 500, Cal: 730 }, distinct: { [kk('Cal', 'Year')]: 2, [kk('S', 'Region')]: 4 } } });
  add('E-months', [fact, cal([['Year Month', 'string']])], [rel('S', 'Day', 'Cal', 'Date')], 2, { stats: { rows: { S: 500, Cal: 400 }, distinct: { [kk('Cal', 'Year Month')]: 13, [kk('S', 'Region')]: 0 } } });
  // a category of exactly 5,000 values in 100,000 rows
  add('E-wide', [T1('S', [c('Amount', 'double'), c('Customer', 'string'), c('Region', 'string')], [m('Sales', "SUM ( 'S'[Amount] )", money)])], [], 2, { stats: { rows: { S: 100000 }, distinct: { [kk('S', 'Customer')]: 5000, [kk('S', 'Region')]: 89999 } } });
  // no category outside the calendar: the axis a month name, two quarter columns
  add('E-parts', [T1('S', [c('Amount', 'double'), c('Day', 'dateTime')], [m('Sales', "SUM ( 'S'[Amount] )", money)]), cal([['Quarter', 'string'], ['Year Quarter', 'string']])], [rel('S', 'Day', 'Cal', 'Date')], 2);
  // a slicer pinned from another table with the name of a pool column, a slicer a page filter fixes
  add('E-pool', [T1('S', [c('Amount', 'double'), c('Channel', 'string'), c('Region', 'string'), c('Key', 'int64')], [m('Sales', "SUM ( 'S'[Amount] )", money)]), T1('B', [c('Key', 'int64'), c('Segment', 'string'), c('Region', 'string')])],
    [rel('S', 'Key', 'B', 'Key')], 2, { pinned: { slicers: [{ t: 'B', c: 'Region' }] }, excludeColumns: [{ t: 'B', c: 'Segment' }] });
  // a flag that is not always true; Arabic twins: "(Arabic)", a day name's own twin, Hijri and Gregorian month names; a
  // pinned table of calendar columns
  const gulf = CALT('Gulf', [['Date', 'dateTime'], ['Month Short', 'string'], ['Quarter', 'string'], ['Quarter (Arabic)', 'string'], ['Day Name', 'string'], ['اسم اليوم', 'string'], ['اسم الشهر الهجري', 'string'], ['الشهر', 'string'],
    ['Is Festival', 'boolean'], ['Festival Day', 'int64']]);
  const fact2 = T1('S', [c('Amount', 'double'), c('Day', 'dateTime')], [m('Sales', "SUM ( 'S'[Amount] )", money)]);
  add('E-flag', [fact2, gulf], [rel('S', 'Day', 'Gulf', 'Date')], 2, { axisFor: [{ t: 'Gulf', c: 'Is Festival', values: [true, false] }] });
  add('E-twins', [fact2, gulf], [rel('S', 'Day', 'Gulf', 'Date')], 2, { lang: 'ar', relationships: [{ fromTable: 'S', toTable: 'Gulf' }], pinned: { table: [{ t: 'Gulf', c: 'Quarter' }, { t: 'Gulf', c: 'Day Name' }], date: { t: 'Gulf', c: 'Month Short' } } });
  add('E-twins2', [fact2, CALT('Gulf', [['Date', 'dateTime'], ['Month Short', 'string'], ['اسم الشهر الهجري', 'string'], ['الشهر', 'string'], ['Day Name', 'string'], ['اسم اليوم', 'string']])], [rel('S', 'Day', 'Gulf', 'Date')], 2, { lang: 'ar' });
  add('E-twins3', [fact2, CALT('Gulf', [['Date', 'dateTime'], ['Month Short', 'string'], ['Hijri Month Name (Arabic)', 'string'], ['اسم الشهر', 'string']])], [rel('S', 'Day', 'Gulf', 'Date')], 2, { lang: 'ar', pinned: { date: { t: 'Gulf', c: 'Month Short', cal: { kind: 'month', rows: 12, family: 'english' } } } });
  // a measure related to no calendar and no category: five of each elsewhere (the notes name five)
  const far = [1, 2, 3, 4, 5, 6].map((i) => CALT('Cal ' + i, [['Date', 'dateTime'], ['Month Name', 'string']])).concat([1, 2, 3, 4, 5, 6].map((i) => T1('Look ' + i, [c('Key', 'int64'), c('Group ' + i, 'string')])));
  const fact3 = T1('S', [c('Amount', 'double')], [m('Sales', "SUM ( 'S'[Amount] )", money)]);
  add('E-far', [fact3].concat(far), [rel('Look 1', 'Key', 'Look 2', 'Key')], 2, null);
  // a measure left behind that is a card (more cards than others); 21 columns the counts rule out (the why cap);
  // a net amount that two gross forms follow (said once)
  add('E-stale', [T1('S', [c('Amount', 'double')], [m('Sales', "SUM ( 'S'[Amount] )", money), m('Sales (old)', "SUM ( 'S'[Amount] ) * 2", money)])], [], 3);
  const cols = Array.from({ length: 21 }, (_, i) => c('Text ' + i, 'string'));
  add('E-why', [T1('S', [c('Amount', 'double')].concat(cols), [m('Sales', "SUM ( 'S'[Amount] )", money), m('Gross Sales', "SUM ( 'S'[Amount] ) * 1.1", money), m('Sales before Discounts', "SUM ( 'S'[Amount] ) * 1.2", money)])], [], 4,
    { stats: { rows: { S: 50 }, distinct: Object.fromEntries(cols.map((x) => [kk('S', x.name), 1])) } });
  return E.map(([id, json, n, opt]) => [id, json, n, (T, R) => Object.assign(R.length && !/^E-(core|variant|names|keys|diff|main|wide|stale|why)$/.test(id) ? { relationships: R, modelTables: T } : {}, opt())]);
}

// ---------- the create_report inputs for reportBuild (the tiny model of test-0.3.2-fn1f.mjs) ----------
//   (a run's model: the tiny one unless it names 'none' (no measures), 'bare' (one text column), 'nodate' (no date),
//   'big' (seven measures and a table related to nothing) or 'sample' (the sample project); mode 'write': create_report's
//   write with a plan never approved; titles(layout, lang): the slot titles of a layout's pages)
export function buildRuns(designOf, FIELDS, HAND, titles) {
  const noKpi = [{ name: 'No cards', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'bar', x: 24, y: 70, w: 600, h: 300 }, { kind: 'gauge', x: 640, y: 70, w: 300, h: 300 }, { kind: 'line', x: 24, y: 400, w: 600, h: 300 }] }];
  const oneKpi = [{ name: 'One card', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 24, y: 70, w: 300, h: 120, title: 'Only' }, { kind: 'table', x: 24, y: 210, w: 600, h: 300 }, { kind: 'donut', x: 640, y: 210, w: 300, h: 300 }] }];
  const noTable = [{ name: 'No table', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 24, y: 70, w: 300, h: 120 }, { kind: 'bar', x: 24, y: 210, w: 600, h: 300 }] }];
  const sevenKpi = [{ name: 'Seven', width: 1280, height: 720, slots: Array.from({ length: 7 }, (_, i) => Object.assign({ kind: 'kpi', x: i * 150, y: 0, w: 140, h: 80 }, i === 6 ? { title: 'Last card' } : {})) }];
  const tEn = titles('exec', 'en'), tAr = titles('exec', 'ar');
  const sub = Object.fromEntries([[tAr[6], 'From the Arabic key'], [tEn[7], 'Own key'], [tAr[8], 'Both given'], [tEn[8], 'Both given, English'], ['Nowhere', 'Unknown']].filter(([k]) => k));
  const glass = { ui: { text: '#ffffff', card: '#ffffff', background: '#ffffff' } };
  const edges = [
    ['B21', { path: 'u1', name: 'FN1F svg card one past the cards', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, svgCards: [{ card: 4, label: 'Edge', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B22', { path: 'u2', name: 'FN1F hand without a table, svg columns', lang: 'en', pages: noTable, fields: FIELDS, svgColumns: [{ label: 'Pic', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B23', { path: 'u3', name: 'FN1F AR waterfall by month', lang: 'ar', design: designOf({ layout: 'analysis', lang: 'ar' }), fields: Object.assign({}, FIELDS, { category: 'Calendar[Month Name]' }), gallery: ['waterfall'], waterfallRtl: 'mirror' }],
    ['B24', { path: 'u4', name: 'FN1F none on a design', lang: 'en', design: designOf({ layout: 'analysis' }), model: 'none' }],
    ['B25', { path: 'u5', name: 'FN1F none on hand pages', lang: 'en', pages: noKpi.concat(HAND), model: 'none' }],
    ['B26', { path: 'u6', name: 'FN1F hand without cards', lang: 'en', pages: noKpi }],
    ['B27', { path: 'u7', name: 'FN1F one card, bare model', lang: 'en', pages: oneKpi, model: 'bare' }],
    ['B28', { path: 'u8', name: 'FN1F none, one card', lang: 'en', pages: oneKpi, model: 'none' }],
    ['B29', { path: 'u9/Tiny.SemanticModel', name: 'FN1F the model folder itself', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS }],
    ['B30', { path: 'u10', name: 'FN1F jpeg logo', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, logo: 'u10/logo.jpeg' }],
    ['B31', { path: 'u11', name: 'FN1F logo a bit tall', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, logo: 'u11/logo.png' }],
    ['B32', { path: 'u12', name: 'FN1F combo of mixed units', lang: 'en', design: designOf({ layout: 'analysis' }), fields: Object.assign({}, FIELDS, { kpis: ['Sales[Total Sales]', 'Sales[Fill Rate]'], measure: 'Sales[Fill Rate]' }), gallery: ['combo', 'multiples', 'waterfall'], secondPage: true }],
    ['B33', { path: 'u13', name: 'FN1F small page asked', lang: 'en', design: designOf({ layout: 'exec' }), page: { w: 640, h: 360 }, secondPage: true, fields: FIELDS }],
    ['B34', { path: 'u14', name: 'FN1F design values repaired', lang: 'en', design: { font: 'Comic Nope', layout: { kpis: 99 } }, fields: FIELDS }],
    ['B35', { path: 'u15', name: 'FN1F six cards asked', lang: 'en', design: designOf({ layout: 'exec', kpis: 6 }), model: 'big' }],
    ['B36', { path: 'u16', name: 'FN1F no date', lang: 'en', design: designOf({ layout: 'exec' }), model: 'nodate' }],
    ['B37', { path: 'u17', name: 'FN1F glass that fails', lang: 'en', design: glass, fields: FIELDS }],
    ['B38', { path: 'u18', name: 'FN1F hand two heights, our theme', lang: 'en', pages: HAND.concat([{ name: 'Tall', width: 1280, height: 900, slots: [{ kind: 'bar', x: 0, y: 0, w: 600, h: 300 }] }]), theme: 'u18/theme.json' }],
    ['B39', { path: 'u19', name: 'FN1F hand flip cards, a theme without colours', lang: 'en', pages: HAND, theme: 'u19/theme.json', flipCards: true }],
    ['B40', { path: 'u20', name: 'FN1F hand AR icons', lang: 'ar', pages: HAND, fields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], table: ['Sales[Region]', 'Sales[Fill Rate]'] }, statusIcons: [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }] }],
    ['B41', { path: 'u21', name: 'FN1F switcher unrelated', lang: 'en', design: designOf({ layout: 'exec' }), model: 'big', metricSwitcher: ['Sales[Total Sales]', 'Other[Other Total]'] }],
    ['B42', { path: 'u22', name: 'Thirty one characters long xyzw', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS }],
    ['B43', { path: 'u23', name: 'FN1F hand svg card past the cards', lang: 'en', pages: HAND, fields: FIELDS, svgCards: [{ card: 3, label: 'Edge', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B44', { path: 'u24', name: 'FN1F hand seven cards', lang: 'en', pages: sevenKpi, fields: FIELDS }],
    ['B45', { path: 'u25', name: 'FN1F sample AR', lang: 'ar', design: designOf({ layout: 'analysis', lang: 'ar' }), model: 'sample' }],
    ['B46', { path: 'u26', name: 'FN1F sample AR, no calendar script', lang: 'ar', design: designOf({ layout: 'analysis', lang: 'ar' }), model: 'sample', arabicCalendar: false }],
    ['B47', { path: 'u27', name: 'FN1F subtitles keyed in both languages', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, subtitles: sub }],
    ['B48', { path: 'u28', name: 'FN1F write never approved', lang: 'en', design: designOf({ layout: 'exec' }), model: 'big', metricSwitcher: ['Sales[Total Sales]', 'Other[Other Total]'], planId: 'plan-000000000001' }, 'write'],
    ['B49', { path: 'u29', name: 'FN1F hand no theme', lang: 'en', pages: HAND, fields: FIELDS, daxFunctions: ['sparkline', 'kpiCards'] }],
    ['B50', { path: 'u30', name: 'FN1F nothing to count, a design', lang: 'en', design: designOf({ layout: 'analysis' }), model: 'empty' }],
    ['B51', { path: 'u31', name: 'FN1F nothing to count, one card', lang: 'en', pages: oneKpi.concat(noKpi), model: 'empty' }],
    ['B52', { path: 'u32', name: 'FN1F none, no card slots', lang: 'en', pages: noKpi, model: 'none' }],
    ['B53', { path: 'u33', name: 'FN1F hand combo of mixed units', lang: 'en', pages: [{ name: 'Combo', width: 1280, height: 720, slots: [{ kind: 'combo', x: 0, y: 0, w: 900, h: 400, title: 'Sales and fill rate' }, { kind: 'kpi', x: 0, y: 420, w: 200, h: 100 }] }],
      fields: Object.assign({}, FIELDS, { kpis: ['Sales[Total Sales]', 'Sales[Fill Rate]'] }), gallery: ['combo'] }],
    ['B54', { path: 'u34', name: 'FN1F two gallery kinds on two pages', lang: 'en', design: designOf({ layout: 'analysis' }), fields: FIELDS, gallery: ['waterfall', 'multiples'], secondPage: true }],
    ['B56', { path: 'u36', name: 'FN1F one count, two card slots', lang: 'en', pages: HAND, model: 'one' }],
    ['B55', { path: 'u35/Tiny.SemanticModel/model.bim', name: 'FN1F a model file, no project', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS }]
  ];
  const T = Object.assign({}, FIELDS, { table: ['Sales[Region]', 'Sales[Fill Rate]', 'Sales[Total Sales]'] });
  return [
    ['B1', { path: 't1', name: 'FN1F transparent glass', lang: 'en', design: Object.assign({}, designOf({ layout: 'exec' }), { layout: Object.assign({}, designOf({ layout: 'exec' }).layout, { transparent: true }) }), fields: FIELDS, svgCards: [{ card: 2, measure: 'Sales[Total Sales]', label: 'Card pic', design: { w: 120, h: 40, values: [{ id: 'a', label: 'A', kind: 'measure', measure: 'Total Sales' }], layers: [{ type: 'rect', x: 0, y: 0, w: 10, h: 10, fill: '#123456' }] } }] }],
    ['B2', { path: 't2', name: 'FN1F small page with a second page and a panel', lang: 'en', design: designOf({ layout: 'analysis', page: '640x480' }), fields: FIELDS, secondPage: true, slidePanel: true, text: 'Made-up words.' }],
    ['B3', { path: 't3', name: 'FN1F AR subtitles and gallery', lang: 'ar', design: designOf({ layout: 'analysis', lang: 'ar' }), fields: FIELDS, subtitles: { Trend: 'By month', 'الاتجاه': 'حسب الشهر' }, gallery: ['multiples', 'combo', 'bullet'], arabicCalendar: false, noDataMessage: 'لا بيانات' }],
    ['B4', { path: 't4', name: 'FN1F svg columns on a table page', lang: 'en', design: designOf({ layout: 'ops' }), fields: T, svgColumns: [{ page: null, measure: 'Sales[Total Sales]', label: 'Pic', design: { w: 60, h: 20, values: [{ id: 'a', label: 'A', kind: 'measure', measure: 'Total Sales' }], layers: [{ type: 'ring', cx: 10, cy: 10, r: 8 }, { type: 'text', x: 10, y: 10, bind: { text: { v: 'a' } } }] } }] }],
    ['B5', { path: 't5', name: 'FN1F hand, kpis beyond the measures, logo and multiples', lang: 'en', pages: HAND.concat([{ name: 'More', width: 1280, height: 720, slots: [{ kind: 'kpi', x: 0, y: 0, w: 100, h: 50 }, { kind: 'kpi', x: 100, y: 0, w: 100, h: 50 }, { kind: 'kpi', x: 200, y: 0, w: 100, h: 50 },
      { kind: 'kpi', x: 300, y: 0, w: 100, h: 50, title: 'Fourth' }, { kind: 'kpi', x: 400, y: 0, w: 100, h: 50 }, { kind: 'kpi', x: 500, y: 0, w: 100, h: 50 }, { kind: 'kpi', x: 600, y: 0, w: 100, h: 50 }, { kind: 'smallMultiples', x: 0, y: 100, w: 600, h: 300 }, { kind: 'gauge', x: 600, y: 100, w: 300, h: 300 }] }]),
      fields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]', 'Sales[Fill Rate]', 'Sales[Avg Price]'], category: 'Sales[Region]' }, logo: 't5/logo.png', colors: { accent: '#aa3300' }, font: 'Segoe UI' }],
    ['B6', { path: 't6', name: 'FN1F hand pages of two heights with a theme that is not ours', lang: 'en', pages: HAND.concat([{ name: 'Tall', width: 1280, height: 900, background: 't6/bg.png', slots: [{ kind: 'text', x: 0, y: 0, w: 100, h: 50, text: 'Own words' }, { kind: 'line', x: 0, y: 60, w: 600, h: 300 }] }]), theme: 't6/theme.json', text: 'Shared words.' }],
    ['B7', { path: 't7', name: 'FN1F hand with a theme of 1440 and switcher', lang: 'ar', pages: HAND, theme: 't7/theme.json', metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], displayNames: { 'Sales[Orders]': 'الطلبات' }, flipCards: true }],
    ['B8', { path: 't8', name: 'FN1F status icons, DAX functions and a very long report name over thirty', lang: 'en', design: designOf({ layout: 'exec' }), fields: T, statusIcons: [{ measure: 'Sales[Fill Rate]', good: '>= 0.97', bad: '< 0.94' }], daxFunctions: ['sparkline', 'bulletBar', 'storyTitles'] }],
    ['B9', { path: 't9', name: 'FN1F no time axis', lang: 'en', design: designOf({ layout: 'analysis' }), fields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], category: 'Sales[Region]', category2: 'Sales[Product]' }, gallery: ['waterfall'] }],
    ['B10', { path: 't10', name: 'FN1F hand AR with a jpg logo that is tall', lang: 'ar', pages: HAND, logo: 't10/logo.jpg', fields: { kpis: ['Sales[Total Sales]'] }, columnStats: { distinct: { 'Sales[Region]': 4, 'Sales[Product]': 30 } } }],
    ['B11', { path: 't11', name: 'FN1F refused: svg card past the cards', lang: 'en', design: designOf({ layout: 'exec', kpis: 2 }), fields: FIELDS, svgCards: [{ card: 5, measure: 'Sales[Total Sales]', label: 'Too far', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B12', { path: 't12', name: 'FN1F refused: svg columns and no table', lang: 'en', design: designOf({ layout: 'focus' }), fields: FIELDS, svgColumns: [{ measure: 'Sales[Total Sales]', label: 'Pic', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B13', { path: 't13', name: 'FN1F refused: flip cards with dax kpi cards', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, flipCards: true, daxFunctions: ['kpiCards'] }],
    ['B14', { path: 't14', name: 'FN1F refused: a switcher of one', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, metricSwitcher: ['Sales[Total Sales]', 'Nope[Nothing]'] }],
    ['B15', { path: 't15', name: 'FN1F hand gallery kinds with a table and svg column page', lang: 'en', pages: HAND.concat([{ name: 'Matrix', width: 1280, height: 720, slots: [{ kind: 'matrix', x: 0, y: 0, w: 600, h: 300 }, { kind: 'multiples', x: 600, y: 0, w: 600, h: 300 }] }]), fields: T, gallery: ['multiples'],
      svgColumns: [{ page: 2, measure: 'Sales[Total Sales]', label: 'Pic', design: { w: 60, h: 20, values: [{ id: 'a', label: 'A', kind: 'measure', measure: 'Total Sales' }], layers: [{ type: 'ring', cx: 10, cy: 10, r: 8 }, { type: 'text', x: 10, y: 10, bind: { text: { v: 'a' } } }] } }] }],
    ['B16', { path: 't16', name: 'FN1F refused: svg column page without a table', lang: 'en', pages: HAND.concat([{ name: 'Empty', width: 1280, height: 720, slots: [{ kind: 'bar', x: 0, y: 0, w: 600, h: 300 }] }]), fields: FIELDS, svgColumns: [{ page: 2, measure: 'Sales[Total Sales]', label: 'Pic', design: { w: 10, h: 10, values: [], layers: [] } }] }],
    ['B17', { path: 't17', name: 'FN1F refused: a logo that is no picture', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, logo: 't17/logo.gif' }],
    ['B18', { path: 't18', name: 'FN1F refused: shared axes and icons', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, sharedAxes: [{ measures: ['Sales[Nope]', 'Sales[Orders]'], share: true }] }],
    ['B19', { path: 't19', name: 'FN1F refused: icons on a missing measure', lang: 'en', design: designOf({ layout: 'exec' }), fields: FIELDS, statusIcons: [{ measure: 'Sales[Missing]', good: '>= 1', bad: '< 0' }] }],
    ['B20', { path: 't20', name: 'FN1F the plan\'s design with chart colours and a phone layout off', lang: 'en', design: Object.assign({}, designOf({ layout: 'exec', page: '1920x1080' }), { layout: Object.assign({}, designOf({ layout: 'exec', page: '1920x1080' }).layout, { phoneLayout: false }) }), fields: FIELDS, kpiValues: 'full', smoothLines: true, grid: true }]
  ].concat(edges);
}
