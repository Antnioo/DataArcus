// 0.3.2 SP30 (the split, finish: B-280, B-286; mcp/work/SP30.md). A characterisation suite: everything the field
// picker's engine (assets/js/pbip-bind.js, split into field-catalog.js and field-suggest.js) gives for 15 made-up models
// is what it gave on the base (integration/0.3.2 258f509, before the split). In process, no browser. Each model is read
// the way its callers read it (a folder through fromFolder on file-like objects, as the page does; a made-up model.bim
// through fromTmsl and relsOfTmsl, as the MCP does), then recorded in fixtures/sp30-catalog.json, one hash per answer:
// suggest with 6 option sets (EN and AR with the relationships, none, 6 cards, the model's counts with excluded columns,
// axisFor and full card values, pinned fields with a named main measure), counts (2), langsOf, twinsOf, every column's
// fieldOf, sortColumnFor, dateColumnFor, langOf and nameLike, every measure's measureOf, measureCard, isPercent, exprOf
// and readTables, every table's isDateTable, reachTable on the suggested table, statsOf, build again on the choices,
// mapFields, and the reader's tables and relationships. SP30_RECORD=1 records again (only on the base, never to make a
// run pass). Made-up models only; nothing random is read (the engine has no random source).
//   C1-C15  one model each: every answer above, hash for hash
//   after commit A: K1 pbip-bind re-exports field-catalog's functions (the same ones) and holds no catalog code;
//     K2 field-catalog.js reads no file, DOM or network and requires field-meaning.js only; K3 theme-generator.js's
//     loadBind loads field-catalog.min.js once, after field-meaning and before pbip-bind
//   after commit B: K4 suggest is build(rank(...).choices) + notes, pbip-bind holds no ranking code; K5 field-suggest.js
//     requires field-catalog.js only, no DOM, file, network or build; K6 loadBind loads field-suggest.min.js once, after
//     field-catalog and before pbip-bind
//   node test-0.3.2-sp30.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { pureSharedFiles, asSibling } from './ledger-places.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(Buffer.from(String(t), 'utf8')).digest('hex').slice(0, 24);
const GOLD = path.join(HERE, 'fixtures', 'sp30-catalog.json');
const RECORD = process.env.SP30_RECORD === '1';
const Bind = require('../assets/js/pbip-bind.js');

// ---------- the folders (sp8's 8 models and Large Synthetic), read as the page reads a chosen folder ----------
const FOLDERS = [
  ['births', 'mcp/fixtures/fx4/fx4-births/model.bim', 'Births.SemanticModel'],
  ['retail', 'mcp/fixtures/fx4/fx4-retail/model.bim', 'Retail.SemanticModel'],
  ['financial', 'mcp/fixtures/fx4/fx4-financial/model.bim', 'Financial.SemanticModel'],
  ['twin', 'mcp/fixtures/twin-project/Twin Sales.SemanticModel', 'Twin Sales.SemanticModel'],
  ['health', 'mcp/fixtures/health-project/Health Test.SemanticModel', 'Health Test.SemanticModel'],
  ['no-measures', 'mcp/test-models/no-measures/Plain Orders.SemanticModel', 'Plain Orders.SemanticModel'],
  ['service', 'mcp/test-models/service-orders/Service Orders.SemanticModel', 'Service Orders.SemanticModel'],
  ['arabic-long', 'mcp/test-models/arabic-long-names/Arabic Long Names.SemanticModel', 'Arabic Long Names.SemanticModel'],
  ['large', 'mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'Large Synthetic.SemanticModel']
];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)).map((p) => d.name + '/' + p) : [d.name]));
const fileOf = (abs, rel) => { const b = fs.readFileSync(abs); return { name: path.basename(abs), webkitRelativePath: rel, size: b.length, arrayBuffer: async () => b.buffer.slice(b.byteOffset, b.byteOffset + b.length) }; };
const filesOf = (src, folder) => { const abs = path.join(REPO, src);
  return /\.bim$/.test(src) ? [fileOf(abs, folder + '/model.bim')] : walk(abs).map((p) => fileOf(path.join(abs, p), folder + '/' + p)); };

// ---------- the made-up edge models (model.bim JSON), for the ranking's high-risk rules ----------
const c = (name, dataType, more) => Object.assign({ name, dataType }, more || {});
const m = (name, expression, formatString, more) => Object.assign({ name, expression }, formatString != null ? { formatString } : {}, more || {});
const rel = (fromTable, fromColumn, toTable, toColumn, more) => Object.assign({ fromTable, fromColumn, toTable, toColumn }, more || {});
const CAL = (name, more) => Object.assign({ name, dataCategory: 'Time', columns: [c('Date', 'dateTime'), c('Month Name', 'string', { sortByColumn: 'Month Number' }), c('Month Number', 'int64'), c('Year', 'int64'),
  c('Day Name', 'string'), c('Day Short', 'string'), c('Day of Week', 'int64'), c('Quarter', 'string'), c('Month Short', 'string', { sortByColumn: 'Month Number' })], measures: [] }, more || {});
const EDGE = [
  // E1: equal scores, net before gross, stale, variants, text, share of all, a self difference, placeholders, aliases,
  // period measures, what-if values, helpers, a dynamic format, padded and glued formats
  ['e1-ranking', { model: { tables: [
    { name: 'Sales', columns: [c('Amount', 'double'), c('Qty', 'int64'), c('Price', 'double'), c('Weight', 'double'), c('Region', 'string'), c('Channel', 'string'), c('Product Name', 'string'), c('Order Id', 'string'),
      c('Notes', 'string'), c('Order Date', 'dateTime'), c('Status', 'string', { expression: 'IF ( Sales[Qty] > 3, "Big", "Small" )' }), c('Tier', 'string', { expression: 'SWITCH ( TRUE (), Sales[Qty] > 9, "Gold", Sales[Qty] > 5, "Silver", "Bronze" )' }),
      c('Is Promo', 'boolean'), c('Hidden Key', 'int64', { isHidden: true })],
    measures: [m('Gross Sales', 'SUM ( Sales[Amount] )', '"$"#,0'), m('Sales', 'SUMX ( Sales, Sales[Qty] * Sales[Price] )', '"$"#,0'), m('Net Sales', '[Sales] - 0', '"$"#,0'),
      m('Total Qty', 'SUM ( Sales[Qty] )', '#,0'), m('Orders', 'COUNTROWS ( Sales )'), m('Order Count', 'COUNT ( Sales[Order Id] )', '#,0'), m('Alias Orders', '[Orders]'),
      m('Tie A', 'SUM ( Sales[Price] )'), m('Tie B', 'SUM ( Sales[Weight] )'), m('Margin %', 'DIVIDE ( [Sales], [Gross Sales] )', '0.0%'), m('Share', 'DIVIDE ( [Sales], CALCULATE ( [Sales], ALL ( Sales ) ) )'),
      m('Sales PY', 'CALCULATE ( [Sales], SAMEPERIODLASTYEAR ( \'Date\'[Date] ) )', '"$"#,0'), m('Sales YoY %', 'DIVIDE ( [Sales] - [Sales PY], [Sales PY] )', '0.00%'), m('Sales (old)', 'SUM ( Sales[Amount] )', '#,0'),
      m('Status Text', 'IF ( [Sales] > 0, "Up", "Down" )'), m('Yes No', '[Orders] > 0', '"Yes";"Yes";"No"'), m('Placeholder', 'BLANK ()'), m('Constant', '42'), m('Prev Month', 'CALCULATE ( [Sales], PREVIOUSMONTH ( \'Date\'[Date] ) )'),
      m('Selected', 'SELECTEDVALUE ( Param[Value] )'), m('Rank', 'RANKX ( ALL ( Sales[Region] ), [Sales] )'), m('All Sales', 'CALCULATE ( [Sales], ALL ( Sales ) )'), m('Dummy', '[All Sales] - [Sales]'),
      m('Peak', 'VAR mx = MAXX ( ALL ( Sales[Region] ), [Sales] ) RETURN IF ( [Sales] = mx, [Sales] )'), m('Dyn', 'SUM ( Sales[Amount] )', null, { formatStringDefinition: { expression: '"#,0"' } }),
      m('Average Order', 'DIVIDE ( [Sales], [Orders] )', '"$"#,0.00'), m('Shipped Weight', 'SUM ( Sales[Weight] )', '#,0 "kg"'), m('Revenue AED', 'SUM ( Sales[Amount] )', '#,0 "AED";-#,0 "AED"'),
      m('Padded', 'SUM ( Sales[Amount] )', '€#,##0,000;-€#,##0,000;€0'), m('Precise', 'SUM ( Sales[Amount] )', '$#,0.####'), m('Hidden Base', 'SUM ( Sales[Qty] )', '#,0', { isHidden: true }),
      m('Exchange Rate', 'AVERAGE ( Sales[Price] )'), m('Corporate Revenue', 'SUM ( Sales[Amount] )'), m('Rows All', 'COUNTROWS ( ALLSELECTED ( Sales ) )')] },
    CAL('Date'),
    { name: 'Param', columns: [c('Value', 'int64')], measures: [] }],
  relationships: [rel('Sales', 'Order Date', 'Date', 'Date', { toCardinality: 'one' })] } }],
  // E2: a French model with Arabic and bilingual columns: twins by name, "_AR", "(Arabic)", data category, place
  ['e2-languages', { model: { tables: [
    { name: 'Ventes', columns: [c('Montant', 'double'), c('Commande', 'string'), c('City', 'string'), c('City_AR', 'string'), c('Product', 'string'), c('Product (Arabic)', 'string'), c('المنطقة', 'string', { dataCategory: 'StateOrProvince' }),
      c('Region', 'string', { dataCategory: 'StateOrProvince' }), c('Aging AR', 'string'), c('Segment', 'string'), c('القناة', 'string'), c('Name_Arabic_Short', 'string'), c('Date', 'dateTime')],
    measures: [m('Panier moyen', 'DIVIDE ( [Chiffre d\'affaires], [Nombre de commandes] )', '#,0.00'), m('Chiffre d\'affaires', 'SUM ( Ventes[Montant] )', '"EUR" #,0'),
      m('Nombre de commandes', 'DISTINCTCOUNT ( Ventes[Commande] )', '#,0'), m('إجمالي المبيعات', 'SUM ( Ventes[Montant] )', '#,0'), m('Total Sales', 'SUM ( Ventes[Montant] )', '#,0.00')] },
    { name: 'التقويم', dataCategory: 'Time', columns: [c('Date', 'dateTime'), c('اسم الشهر', 'string', { sortByColumn: 'رقم الشهر' }), c('رقم الشهر', 'int64'), c('Month Name', 'string', { sortByColumn: 'رقم الشهر' }),
      c('Day Name', 'string'), c('Day Name (Arabic)', 'string'), c('Is Holiday', 'boolean'), c('Is Holiday (Arabic)', 'string'), c('Hijri Month Name', 'string', { sortByColumn: 'Hijri Month' }), c('Hijri Month', 'int64'), c('السنة', 'int64')], measures: [] }],
  relationships: [rel('Ventes', 'Date', 'التقويم', 'Date')] } }],
  // E3: two calendars, a measures table, a both-way relationship, a fact table related to nothing, an inactive relationship
  ['e3-reach', { model: { tables: [
    { name: 'Orders', columns: [c('Order Key', 'int64'), c('Customer Key', 'int64'), c('Order Date', 'dateTime'), c('Amount', 'double')], measures: [m('Total Orders', 'COUNTROWS ( Orders )', '#,0'), m('Order Amount', 'SUM ( Orders[Amount] )', '"$"#,0')] },
    { name: 'Shipments', columns: [c('Lane Key', 'int64'), c('Ship Date', 'dateTime'), c('Qty', 'int64')], measures: [m('Shipped', 'SUM ( Shipments[Qty] )', '#,0')] },
    { name: 'Customers', columns: [c('Customer Key', 'int64'), c('Customer Code', 'string'), c('Customer Name', 'string'), c('Segment', 'string'), c('Email', 'string')], measures: [] },
    { name: 'Lanes', columns: [c('Lane Key', 'int64'), c('Lane Region', 'string'), c('Hub Zone', 'string')], measures: [] },
    CAL('Order Calendar'), CAL('Ship Calendar'),
    { name: 'Targets', columns: [c('Target Date', 'dateTime'), c('Target Group', 'string'), c('Target', 'double')], measures: [m('Target Total', 'SUM ( Targets[Target] )', '#,0')] },
    { name: 'Measures', columns: [c('Dummy', 'string', { isHidden: true })], measures: [m('Orders per Shipment', 'DIVIDE ( [Total Orders], [Shipped] )', '0.00'), m('Big Orders', 'CALCULATE ( [Total Orders], \'Orders\' [Amount] > 100 )', '#,0'),
      m('Lane Count', 'COUNTROWS ( Lanes )'), m('Order Amount Copy', 'CALCULATE ( [Order Amount], REMOVEFILTERS ( Customers ) )', '"$"#,0')] }],
  relationships: [rel('Orders', 'Customer Key', 'Customers', 'Customer Key'), rel('Orders', 'Order Date', 'Order Calendar', 'Date'), rel('Shipments', 'Lane Key', 'Lanes', 'Lane Key', { crossFilteringBehavior: 'bothDirections' }),
    rel('Shipments', 'Ship Date', 'Ship Calendar', 'Date'), rel('Orders', 'Order Date', 'Ship Calendar', 'Date', { isActive: false })] } }],
  // E4: a Gulf-style calendar: Hijri names, a month-year label and its sort number, flags with their day columns, years
  ['e4-calendar', { model: { tables: [
    { name: 'Visits', columns: [c('Visit Date', 'dateTime'), c('Branch', 'string'), c('Visitors', 'int64')], measures: [m('Total Visitors', 'SUM ( Visits[Visitors] )', '#,0'), m('Visits', 'COUNTROWS ( Visits )', '#,0')] },
    { name: 'Gulf Calendar', columns: [c('Date', 'dateTime'), c('Year', 'int64'), c('Calendar Year', 'int64'), c('Month Name', 'string'), c('Month Number', 'int64'), c('Month Year', 'string'), c('Year Month Sort', 'int64'),
      c('Hijri Month Name', 'string'), c('Hijri Month Number', 'int64'), c('Day Name', 'string'), c('Day Short', 'string'), c('Weekday Number', 'int64'), c('Is Ramadan', 'boolean'), c('Ramadan Day', 'int64'),
      c('Is Festival', 'boolean'), c('Festival Day', 'int64'), c('Fiscal Month Name', 'string'), c('Fiscal Month Number', 'int64'), c('Quarter Name', 'string'), c('Day Name (Arabic)', 'string'), c('Month Name (Arabic)', 'string')], measures: [] }],
  relationships: [rel('Visits', 'Visit Date', 'Gulf Calendar', 'Date', { toCardinality: 'one' })] } }],
  // E5: a DAX calendar (CALENDAR with its years, ADDCOLUMNS with typeless columns) and a calculated column's text pair
  ['e5-dax-calendar', { model: { tables: [
    { name: 'Calls', columns: [c('Call Date', 'dateTime'), c('Agent', 'string'), c('Duration', 'double', { summarizeBy: 'sum' }), c('Week Type'), c('Score', 'unknown')], measures: [m('Calls', 'COUNTROWS ( Calls )'), m('Talk Time', 'SUM ( Calls[Duration] )', '#,0.0')] },
    { name: 'Cal', partitions: [{ source: { type: 'calculated', expression: 'ADDCOLUMNS ( CALENDAR ( DATE ( 2022, 1, 1 ), DATE ( 2024, 12, 31 ) ), "Year", YEAR ( [Date] ), "Month Name", FORMAT ( [Date], "MMMM" ), "Year Month", FORMAT ( [Date], "YYYY-MM" ), "Year Month Number", YEAR ( [Date] ) * 100 + MONTH ( [Date] ), "Week Type", IF ( WEEKDAY ( [Date], 2 ) > 5, "Weekend", "Weekday" ) )' } }],
      columns: [c('Date'), c('Year'), c('Month Name'), c('Year Month'), c('Year Month Number'), c('Week Type')], measures: [] }],
  relationships: [rel('Calls', 'Call Date', 'Cal', 'Date')] } }],
  // E6: no date table: a month column, time stamps, coordinates, invoices, links, contact columns, names with ] and quotes
  ['e6-names', { model: { tables: [
    { name: 'Tickets', columns: [c('Ticket No', 'string'), c('Opened At', 'dateTime', { formatString: 'General Date' }), c('Closed', 'dateTime'), c('Month', 'string'), c('Latitude', 'string'), c('Geo Point', 'string'),
      c('Invoice', 'string'), c('Photo URL', 'string'), c('Phone', 'string'), c('Priority', 'string'), c('Team]Name', 'string'), c('Agent\'s Group', 'string'), c('Label', 'string', { expression: 'Tickets[Priority] & ", " & Tickets[Phone]' }), c('Amount', 'decimal')],
    measures: [m('Tickets]Open', 'COUNTROWS ( Tickets )', '#,0'), m('Avg Amount', 'AVERAGE ( Tickets[Amount] )', '#,0.00'), m('Total Amount', 'SUM ( Tickets[Amount] )'), m('Test margin', 'SUM ( Tickets[Amount] )'), m('Generated Leads', 'COUNTROWS ( Tickets )')] },
    { name: 'Agents', columns: [c('Agent Id', 'int64'), c('Agent', 'string'), c('Img', 'string'), c('Email', 'string')], measures: [] }],
  relationships: [rel('Tickets', 'Agent\'s Group', 'Agents', 'Agent')] } }]
];

// the model's counts, made up by a fixed rule from the names (never data): rows per table, distinct per column; a
// one-valued year, a mostly unique text column, a name the model does not have and a count that is no whole number
const hash = (s) => [...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
const statsFor = (tables) => { const rows = {}, distinct = {};
  tables.forEach((t, i) => { rows[t.name] = 150 * (i + 1); (t.columns || []).forEach((col) => { const k = "'" + t.name.replace(/'/g, "''") + "'[" + col.name.replace(/\]/g, ']]') + ']';
    distinct[k] = /^year$/i.test(col.name) ? (i % 2 ? 1 : 3) : /month\s*year|year\s*month/i.test(col.name) ? 30 : hash(col.name) % 3 === 0 ? 150 * (i + 1) : 2 + hash(col.name) % 40; }); });
  rows['No Such Table'] = 5; distinct['Nowhere[Nothing]'] = 3; rows[(tables[0] || {}).name || 'x'] = rows[(tables[0] || {}).name || 'x'] || 1; distinct['Bad[Half]'] = 1.5;
  return { rows, distinct }; };

const gold = RECORD ? {} : JSON.parse(fs.readFileSync(GOLD, 'utf8'));
const got = {};
const J = (x) => JSON.stringify(x === undefined ? null : x);

// every answer the engine gives for one model, each hashed
function answers(tables, rels) {
  const out = {}, put = (k, f) => { let v; try { v = J(f()); } catch (e) { v = 'threw: ' + String(e && e.message); } out[k] = sha(v); };
  const R = rels.length ? { relationships: rels, modelTables: tables } : {};
  const textCols = [], boolCols = [];
  tables.forEach((t) => (t.columns || []).forEach((col) => { if (/^string$/i.test(col.dataType || '')) textCols.push({ t: t.name, c: col.name }); if (/^boolean$/i.test(col.dataType || '')) boolCols.push({ t: t.name, c: col.name }); }));
  const meas = []; tables.forEach((t) => (t.measures || []).forEach((x) => meas.push([t, x])));
  const sets = {
    o1: [4, Object.assign({ lang: 'en' }, R)], o2: [4, Object.assign({ lang: 'ar' }, R)], o3: [1, undefined], o4: [6, { lang: 'en' }],
    o5: [3, Object.assign({ lang: 'en', kpiValues: 'full', stats: statsFor(tables), excludeColumns: textCols.slice(0, 1), axisFor: boolCols.map((b) => Object.assign({ values: [true] }, b)) }, R)],
    o6: [4, Object.assign({ lang: 'ar', pinned: Object.assign({}, textCols[1] ? { catA: Bind.fieldOf(tables.find((t) => t.name === textCols[1].t), textCols[1].c) } : {},
      meas.length ? { kpis: meas.slice(0, 2).map(([t, x]) => Bind.measureOf(t, x.name, tables)) } : {}, textCols[2] ? { slicers: [{ t: textCols[2].t, c: textCols[2].c }] } : {}) },
    meas[1] ? { main: { t: meas[1][0].name, m: meas[1][1].name } } : {}, R)]
  };
  let first = null;
  Object.entries(sets).forEach(([k, [n, o]]) => put('suggest.' + k, () => { const b = Bind.suggest(tables, n, o); if (k === 'o1') first = b; return b; }));
  put('counts.en', () => Bind.counts(tables, undefined, { lang: 'en' }));
  put('counts.ar', () => Bind.counts(tables, { count: (x) => 'عدد ' + x, sum: (x) => 'مجموع ' + x }, { lang: 'ar' }));
  put('langsOf', () => Bind.langsOf(tables)); put('twinsOf', () => Bind.twinsOf(tables));
  put('columns', () => tables.map((t) => [Bind.isDateTable(t), (t.columns || []).map((col) => [Bind.fieldOf(t, col.name), Bind.sortColumnFor(t.columns, col.name), Bind.dateColumnFor(t.columns, col.name, col.dataType, t),
    Bind.langOf(col.name), Bind.nameLike(col.name), Bind.fieldKey(t.name, col.name)])]));
  put('measures', () => meas.map(([t, x]) => [Bind.measureOf(t, x.name, tables), Bind.measureCard(x, tables), Bind.isPercent(x.name, x.formatString, Bind.exprOf(x)), Bind.exprOf(x), Bind.readTables(tables, { t: t.name, m: x.name })]));
  put('reachTable', () => first && first.choices && first.choices.reach ? Bind.reachTable(first.table, first.choices.reach) : Bind.reachTable(first && first.table, R));
  put('statsOf', () => { const s = Bind.statsOf(tables, statsFor(tables)); return [s.given, s.notInModel, tables.map((t) => [s.rows(t.name), (t.columns || []).map((col) => s.distinct(t.name, col.name))])]; });
  put('build', () => Bind.build(first.choices));
  put('mapFields', () => Bind.mapFields(first, (x) => Object.assign({}, x, { name: (x.m != null ? x.m : x.c) + '!' })));
  put('tables', () => tables); put('rels', () => rels);
  return out;
}

try {
  let n = 0;
  for (const [name, src, folder] of FOLDERS) {
    const res = await Bind.fromFolder(filesOf(src, folder));
    const id = 'C' + (++n), now = answers(res.tables, res.relationships || []);
    got[id] = Object.assign({ model: name }, now);
    const g = gold[id] || {};
    chk(() => RECORD || J(got[id]) === J(g), () => `${id} ${name}: differs from the base in ${Object.keys(now).filter((k) => now[k] !== g[k]).join(', ')}`);
  }
  for (const [name, json] of EDGE) {
    const tables = Bind.fromTmsl(JSON.parse(JSON.stringify(json))).filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name)), rels = Bind.relsOfTmsl(json);
    const id = 'C' + (++n), now = answers(tables, rels);
    got[id] = Object.assign({ model: name }, now);
    const g = gold[id] || {};
    chk(() => RECORD || J(got[id]) === J(g), () => `${id} ${name}: differs from the base in ${Object.keys(now).filter((k) => now[k] !== g[k]).join(', ')}`);
  }

  // ---------- after commit A (SP30): the catalog is field-catalog.js's; pbip-bind re-exports it ----------
  const read = (f) => fs.readFileSync(path.join(REPO, 'assets', 'js', f), 'utf8'), code = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const Cat = require('../assets/js/field-catalog.js'), bindSrc = code(read('pbip-bind.js')), catSrc = code(read('field-catalog.js'));
  const CAT_NAMES = ['fromTmsl', 'relsOfTmsl', 'markCalendars', 'fieldOf', 'measureOf', 'measureCard', 'isPercent', 'dateColumnFor', 'sortColumnFor', 'isDateTable', 'nameLike', 'langOf', 'langsOf', 'twinsOf', 'fieldKey', 'exprOf', 'reachTable', 'readTables'];
  chk(() => CAT_NAMES.every((k) => typeof Cat[k] === 'function' && Bind[k] === Cat[k]) && !/function (catalog|fromTmsl|fieldOf|measureField|reached|reachTable|markCalendars|pairTwins)\s*\(|new WeakMap|@typedef/.test(bindSrc + read('pbip-bind.js')),
    () => `K1 pbip-bind.js must re-export field-catalog.js's functions (the same ones) and hold no catalog code: ${CAT_NAMES.filter((k) => Bind[k] !== Cat[k]).join(', ')}`);
  // (0.3.2 DD1H: and the pure sort-column rule, sort-column.js, its one home; mcp/work/DD1H.md; DD1F: and the pure
  // Arabic letter test, arabic-script.js, its one home; mcp/work/DD1F.md)
  const catReqs = (catSrc.match(/require\(['"][^'"]+['"]\)/g) || []).map((x) => x.slice(9, -2)), CAT_OWN = ['./field-meaning.js', './sort-column.js', './arabic-script.js'];
  // (0.3.3 SG2: and any pure shared file the CONTRACTS.md ledger names as a one place, read by ledger-places.mjs)
  chk(() => CAT_OWN.every((r) => catReqs.includes(r)) && catReqs.every((r) => CAT_OWN.includes(r) || [...pureSharedFiles()].map(asSibling).includes(r)) && !/document\.|window\.|fetch\(|XMLHttpRequest|FileReader|arrayBuffer|localStorage|postMessage|importScripts|suggest\(|function build|EVALUATE/.test(catSrc),
    () => 'K2 field-catalog.js must read no file, page or network, run no query, and require field-meaning.js, sort-column.js and arabic-script.js only');
  const tg = read('theme-generator.js'), at = (f) => tg.indexOf('/assets/js/' + f + '.min.js?v='), once = (f) => tg.split('/assets/js/' + f + '.min.js?v=').length === 2;
  chk(() => once('field-catalog') && once('pbip-bind') && at('field-meaning') < at('field-catalog') && at('field-catalog') < at('pbip-bind') && at('field-catalog') > tg.indexOf('const loadBind'),
    () => 'K3 theme-generator.js\'s loadBind must load field-catalog.min.js once, after field-meaning and before pbip-bind.min.js');

  // ---------- after commit B (SP30): the ranking is field-suggest.js's; suggest is build of its choices ----------
  const Sug = require('../assets/js/field-suggest.js'), sugSrc = code(read('field-suggest.js'));
  let ranked = 0; const realRank = Sug.rank;
  try { Sug.rank = (...a) => { ranked++; return realRank(...a); }; Bind.suggest([{ name: 'T', columns: [{ name: 'C', dataType: 'string' }], measures: [{ name: 'M', expression: '1' }] }], 1); } finally { Sug.rank = realRank; }
  chk(() => ranked === 1 && Bind.counts === Sug.counts && Bind.statsOf === Sug.statsOf && Object.keys(Sug).join() === 'rank,counts,statsOf'
    && !/function (rank|counts|statsOf|byLang)\s*\(|TIEBREAK_WORDS|NOT_CAT|DATE_PARTS|grossBase|NEEDS_PERIOD/.test(bindSrc + code(read('pbip-bind.js'))),
    () => `K4 pbip-bind.js's suggest must be build of field-suggest.js's rank (called ${ranked} times), counts and statsOf the same functions, and pbip-bind hold no ranking code`);
  chk(() => (sugSrc.match(/require\(['"][^'"]+['"]\)/g) || []).join() === "require('./field-catalog.js')" && !/document\.|window\.|fetch\(|XMLHttpRequest|FileReader|arrayBuffer|localStorage|postMessage|importScripts|Math\.random|Date\.now|new Date|function build|build\(|EVALUATE|new WeakMap/.test(sugSrc),
    () => 'K5 field-suggest.js must require field-catalog.js only: no file, page, network, query, random source, clock, META of its own or build');
  chk(() => once('field-suggest') && at('field-catalog') < at('field-suggest') && at('field-suggest') < at('pbip-bind'),
    () => 'K6 theme-generator.js\'s loadBind must load field-suggest.min.js once, after field-catalog and before pbip-bind.min.js');

  if (RECORD) fs.writeFileSync(GOLD, JSON.stringify(got, null, 1) + '\n');
} catch (e) { problems.push('crashed: ' + String(e && e.stack || e).slice(0, 400)); }

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp30.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp30  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp30  ${checks} checks${RECORD ? ' (recorded)' : ''}`);
