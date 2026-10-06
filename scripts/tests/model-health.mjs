// Model Health Check: the engine sees every real use of a column (placeholder columns of measure tables,
// field parameters, DAX functions, aggregation tables), and the fix plan never gives a step that breaks
// the next refresh: nothing it removes is still needed by something that stays, including its own quick fixes.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, visitor } from './lib.mjs';

// the engine and the TMDL builder exactly as the browser loads them (minified)
const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };

// a PBIR report with one table visual showing these fields: [kind, table, field]
const report = (refs) => ({ format: 'pbir', files: [{ path: 'definition/pages/p1/page.json', json: { displayName: 'P1' } },
  { path: 'definition/pages/p1/visuals/v1/visual.json', json: { visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: refs.map(([k, e, p]) => ({ field: { [k]: { Expression: { SourceRef: { Entity: e } }, Property: p } } })) } } } } } }] });
const mpart = (n) => [{ name: n, source: { type: 'm', expression: 'let Source = Sql.Database(Server, Db) in Source' } }];
const sales = () => ({ name: 'Sales', columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }, { name: 'Key', dataType: 'int64', sourceColumn: 'Key' }], partitions: mpart('Sales') });
const enterData = 'let Source = Table.FromRows(Json.Document(Binary.Decompress(Binary.FromText("i44FAA==", BinaryEncoding.Base64), Compression.Deflate)), let _t = ((type nullable text) meta [Serialized.Text = true]) in type table [Column1 = _t]) in Source';

// The model the fix plan is checked on: every way an unused column can still be needed
const planModel = () => ({ name: 'x', compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'DateKey', dataType: 'dateTime', sourceColumn: 'DateKey', isHidden: true },
    { name: 'Note', dataType: 'string', sourceColumn: 'Note' }, { name: 'Qty', dataType: 'int64', sourceColumn: 'Qty' }, { name: 'Code', dataType: 'string', sourceColumn: 'Code' },
    { name: 'Flag', type: 'calculated', dataType: 'string', expression: 'Sales[Note] & "x"' }],
  hierarchies: [{ name: 'Codes', levels: [{ name: 'Code', column: 'Code' }] }], partitions: mpart('Sales') },
  { name: '_Measures', columns: [{ name: 'Column1', dataType: 'string', isHidden: true, sourceColumn: 'Column1' }],
    measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '#,0' }, { name: 'Unused Qty', expression: 'SUM(Sales[Qty]) // ```', formatString: '0' }],
    partitions: [{ name: 'm', source: { type: 'm', expression: enterData } }] },
  { name: 'Calendar', columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }, { name: 'Month Year', dataType: 'string', sourceColumn: 'Month Year' },
    { name: 'Month Name', dataType: 'string', sourceColumn: 'Month Name' }, { name: 'Month Number', dataType: 'int64', sourceColumn: 'Month Number', summarizeBy: 'none' },
    { name: 'Year Month', dataType: 'int64', sourceColumn: 'Year Month', summarizeBy: 'none' }], partitions: mpart('Calendar') },
  { name: 'Old', columns: [{ name: 'A', dataType: 'string', sourceColumn: 'A' }, { name: 'B', dataType: 'string', sourceColumn: 'B' }], partitions: mpart('Old') }],
relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'DateKey', toTable: 'Calendar', toColumn: 'Date' }] } });
const planLayout = { sections: [{ name: 's1', displayName: 'Page 1', filters: '[]', visualContainers: [{ config: JSON.stringify({ name: 'v1', singleVisual: { visualType: 'tableEx', prototypeQuery: { Version: 2,
  From: [{ Name: 'm', Entity: '_Measures', Type: 0 }, { Name: 'c', Entity: 'Calendar', Type: 0 }],
  Select: [{ Measure: { Expression: { SourceRef: { Source: 'm' } }, Property: 'Total' } }, { Column: { Expression: { SourceRef: { Source: 'c' } }, Property: 'Month Year' } },
    { Column: { Expression: { SourceRef: { Source: 'c' } }, Property: 'Month Name' } }] } } }), filters: '[]' }] }], config: '{}' };

// A small stored .pbit (UTF-16 files, like Power BI writes them)
function pbit(files) {
  const parts = [], dir = []; let off = 0;
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]), nb = Buffer.from(name), crc = zlib.crc32(data);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(data.length, 22); h.writeUInt16LE(nb.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(data.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
    parts.push(h, nb, data); dir.push(c, nb); off += 30 + nb.length + data.length;
  }
  const cd = Buffer.concat(dir), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(dir.length / 2, 8); e.writeUInt16LE(dir.length / 2, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, e]);
}

export default async function ({ browser, url }) {
  const problems = []; let checks = 0;
  const check = (ok, msg) => { checks++; if (!ok) problems.push(msg); };
  const E = load('model-health-engine.min.js');
  const col = (r, t, c) => (r.tables.find((x) => x.name === t) || { columns: [] }).columns.find((x) => x.name === c) || {};
  const unusedCols = (r) => ((r.findings.find((f) => f.id === 'UNUSED_COL') || {}).items || []).map((i) => i.obj);

  // ---- engine ----
  {
    // the "Enter data" placeholder column of a measures table is needed while its measures are
    const m = { model: { tables: [sales(), { name: '_Measures', columns: [{ name: 'Column1', dataType: 'string', isHidden: true, sourceColumn: 'Column1' }],
      measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '0' }], partitions: [{ name: 'x', source: { type: 'm', expression: enterData } }] }] } };
    const r = E.analyze(m, report([['Measure', '_Measures', 'Total']]));
    check(col(r, '_Measures', 'Column1').used === true, `placeholder column of a measures table: used = ${col(r, '_Measures', 'Column1').used}`);
    check(!unusedCols(r).includes('_Measures[Column1]'), 'placeholder column of a measures table reported unused');
  }

  {
    // field parameter: the visual shows Parameter, which groups by the hidden Parameter Fields column
    const m = { model: { tables: [sales(), { name: 'Parameter', columns: [
      { type: 'calculatedTableColumn', name: 'Parameter', dataType: 'string', isNameInferred: true, sourceColumn: '[Value1]', sortByColumn: 'Parameter Order', relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Parameter Fields' }] } },
      { type: 'calculatedTableColumn', name: 'Parameter Fields', dataType: 'string', isHidden: true, sourceColumn: '[Value2]', extendedProperties: [{ type: 'json', name: 'ParameterMetadata', value: { version: 3, kind: 2 } }] },
      { type: 'calculatedTableColumn', name: 'Parameter Order', dataType: 'int64', isHidden: true, sourceColumn: '[Value3]' }],
    partitions: [{ name: 'Parameter', source: { type: 'calculated', expression: '{ ("Amount", NAMEOF(\'Sales\'[Amount]), 0), ("Qty", NAMEOF(\'Sales\'[Qty]), 1) }' } }] }] } };
    const r = E.analyze(m, report([['Column', 'Parameter', 'Parameter']]));
    check(col(r, 'Parameter', 'Parameter Fields').used === true, 'field parameter: the "Parameter Fields" column is reported unused');
  }

  {
    // DAX user-defined functions: a used measure calls a function, which calls another that reads Sales[Amount]
    const m = { model: { tables: [Object.assign(sales(), { measures: [{ name: 'M', expression: 'Fn.Total ( )', formatString: '0' }] })],
      functions: [{ name: 'Fn.Total', expression: '() => Fn.Sum ( )' }, { name: 'Fn.Sum', expression: '() => SUM ( Sales[Amount] )' }, { name: 'Fn.Unused', expression: '() => SUM ( Sales[Qty] )' }] } };
    const r = E.analyze(m, report([['Measure', 'Sales', 'M']]));
    check(col(r, 'Sales', 'Amount').used === true, 'DAX function: a column read only inside a function the report uses is reported unused');
    check(col(r, 'Sales', 'Qty').used === false, 'DAX function: a column read only by a function nobody calls counts as used');
  }

  for (const [form, base] of [['object', { table: 'Sales', column: 'Amount' }], ['text', "'Sales'[Amount]"]]) {
    // aggregation table: a visual on Sales[Amount] is answered from the hidden Sales Agg table
    const m = { model: { tables: [sales(), { name: 'Sales Agg', isHidden: true, columns: [{ name: 'SumAmount', dataType: 'double', sourceColumn: 'SumAmount', alternateOf: { baseColumn: base, summarization: 'sum' } },
      { name: 'Rows', dataType: 'int64', sourceColumn: 'Rows', alternateOf: { baseTable: 'Sales', summarization: 'countTableRows' } }], partitions: mpart('Sales Agg') }] } };
    const r = E.analyze(m, report([['Column', 'Sales', 'Amount']]));
    check(col(r, 'Sales Agg', 'SumAmount').used === true && col(r, 'Sales Agg', 'Rows').used === true, `aggregation table (${form} baseColumn): its columns are reported unused`);
    check(!r.findings.some((f) => f.id === 'UNUSED_TABLE' && f.items.some((i) => i.obj === 'Sales Agg')), `aggregation table (${form} baseColumn): reported as a table nobody uses`);
  }

  {
    // "/" inside a column name is not a division; a real one still is
    const m = { model: { tables: [Object.assign(sales(), { columns: sales().columns.concat({ name: 'Qty/Box', dataType: 'int64', sourceColumn: 'Qty/Box' }),
      measures: [{ name: 'Boxes', expression: "SUM ( Sales[Qty/Box] ) + SUM ( 'Sales'[Qty/Box] )", formatString: '0' }, { name: 'Per Box', expression: 'SUM ( Sales[Amount] ) / SUM ( Sales[Qty/Box] )', formatString: '0' }] })] } };
    const div = ((E.analyze(m, null).findings.find((f) => f.id === 'DIVISION') || {}).items || []).map((i) => i.obj);
    check(JSON.stringify(div) === '["[Per Box]"]', `division check: flags ${JSON.stringify(div)}, expected only [Per Box]`);
  }

  {
    // calendar tables named in Arabic are found like English ones
    const cal = (name) => ({ name, columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }], partitions: mpart(name) });
    const m = { model: { tables: [sales(), cal('تقويم'), cal('التقويم'), cal('Calendar'), cal('تقويمات قديمة'), cal('Calendar2')] } };
    const found = ((E.analyze(m, null).findings.find((f) => f.id === 'DATE_NOT_MARKED') || {}).items || []).map((i) => i.obj).sort();
    check(JSON.stringify(found) === JSON.stringify(['Calendar', 'التقويم', 'تقويم'].sort()), `calendar tables: found ${JSON.stringify(found)}`);
  }

  {
    // TMDL: property values with double quotes (or edge spaces) are quoted with inner quotes doubled, as the TMDL spec says
    const T = load('model-health-tmdl.min.js');
    const raw = [{ name: 'Sales', measures: [{ name: 'Flag', expression: '[X] > 0', formatString: '"Yes";"Yes";"No"' }, { name: 'Amt', expression: 'SUM ( Sales[Amount] )', formatString: '"AED "#,0', displayFolder: 'Money ' }, { name: 'Plain', expression: '1', formatString: '#,0' }] }];
    const s = (T.moveMeasures(raw, ['Flag', 'Amt', 'Plain'], 'Review').script || '').split('\n');
    for (const want of ['\t\t\tformatString: """Yes"";""Yes"";""No"""', '\t\t\tformatString: """AED ""#,0"', '\t\t\tdisplayFolder: "Review\\Money "', '\t\t\tformatString: #,0'])
      check(s.includes(want), `TMDL: no line ${JSON.stringify(want)}`);
  }

  {
    // round 2: sort order and number formats as ready TMDL scripts (model-health-tmdl.js, shared with the MCP)
    const T = load('model-health-tmdl.min.js');
    const dcol = (name, dataType) => ({ name, dataType, sourceColumn: name });
    const cal = { name: 'Calendar', columns: [dcol('Date', 'dateTime'), dcol('Month Name', 'string'), dcol('Month Number', 'int64'), dcol('Day Name', 'string'), dcol('Hijri Month Name', 'string'), dcol('Fiscal Month Number', 'int64')], partitions: mpart('Calendar') };
    const xcol = (name) => ({ type: 'calculatedTableColumn', name, isNameInferred: true, isDataTypeInferred: true, sourceColumn: '[' + name + ']' });
    const dax = { name: 'DaxCal', columns: [xcol('Date'), xcol('Month Name'), xcol('Month Number'), xcol('Day Name')], partitions: [{ name: 'DaxCal', source: { type: 'calculated', expression: 'CALENDAR ( DATE ( 2024, 1, 1 ), DATE ( 2024, 12, 31 ) )' } }] };
    const items = [{ table: 'Calendar', column: 'Month Name' }, { table: 'Calendar', column: 'Day Name' }, { table: 'Calendar', column: 'Hijri Month Name' }, { table: 'DaxCal', column: 'Month Name' }, { table: 'DaxCal', column: 'Day Name' }];
    const s = typeof T.sortFixes === 'function' ? T.sortFixes([cal, dax], items) : { script: '', sorts: [], byHand: [] }, lines = (s.script || '').split('\n');
    // the month name is sorted by the month number that is there (never by the fiscal one); the day name gets a new
    // weekday number made from the date, Sunday first by default
    check(lines.includes("\t\tcolumn 'Month Name'") && lines.includes("\t\t\tsortByColumn: 'Month Number'") && !/Fiscal/.test(s.script || ''), `sort script: Month Name not sorted by Month Number: ${(s.script || '').slice(0, 300)}`);
    check(lines.includes("\t\tcolumn 'Day of Week Number' = ```") && lines.includes("\t\t\t\tWEEKDAY ( 'Calendar'[Date], 1 )") && lines.includes("\t\t\tsortByColumn: 'Day of Week Number'") && s.weekStart === 'sunday', `sort script: no weekday number from the date, Sunday first: ${(s.script || '').slice(0, 600)}`);
    check(JSON.stringify(s.sorts) === JSON.stringify([{ column: 'Calendar[Month Name]', by: 'Calendar[Month Number]', added: false }, { column: 'Calendar[Day Name]', by: 'Calendar[Day of Week Number]', added: true }]), `sort script: sorts ${JSON.stringify(s.sorts)}`);
    // by hand, with the steps: a Hijri name without a Hijri number; columns of a DAX table (never rewritten by a script)
    const hand = Object.fromEntries((s.byHand || []).map((h) => [h.column, h]));
    check(Object.keys(hand).sort().join() === 'Calendar[Hijri Month Name],DaxCal[Day Name],DaxCal[Month Name]' && /Sort by column > Month Number/.test(hand['DaxCal[Month Name]'].steps) && /DAX table/.test(hand['DaxCal[Month Name]'].why) && !/DaxCal/.test(s.script || ''),
      `sort script: by hand ${JSON.stringify(s.byHand).slice(0, 400)}`);
    // a column that is itself the number another name is sorted by ("Day of Week" for "Day Name", untyped in a DAX
    // table so the check can't tell) is never told to get a sort column of its own
    const dax2 = { name: 'DaxCal2', columns: [xcol('Date'), xcol('Day Name'), xcol('Day of Week')], partitions: dax.partitions };
    const s2 = typeof T.sortFixes === 'function' ? T.sortFixes([dax2], [{ table: 'DaxCal2', column: 'Day of Week' }, { table: 'DaxCal2', column: 'Day Name' }]) : { byHand: [] };
    check(s2.byHand.length === 1 && s2.byHand[0].column === 'DaxCal2[Day Name]' && /Sort by column > Day of Week\.$/.test(s2.byHand[0].steps), `sort script: the number column itself: ${JSON.stringify(s2.byHand).slice(0, 300)}`);
    // the week start: Monday and Saturday differ from Sunday in the weekday expression only
    for (const [ws, want] of [['monday', "WEEKDAY ( 'Calendar'[Date], 2 )"], ['saturday', "MOD ( WEEKDAY ( 'Calendar'[Date], 1 ), 7 ) + 1"]]) {
      const o = typeof T.sortFixes === 'function' ? T.sortFixes([cal, dax], items, { weekStart: ws }) : { script: '' }, ol = (o.script || '').split('\n');
      const diff = ol.map((l, i) => [l, lines[i]]).filter(([a, b]) => a !== b);
      check(ol.length === lines.length && diff.length === 1 && diff[0][0].trim() === want, `sort script, week starting ${ws}: ${diff.length} lines differ from Sunday's: ${JSON.stringify(diff).slice(0, 200)}`);
    }
    // formats: a suggestion per measure with its reason; a measure that has a format is never in the script
    const st = Object.assign(sales(), { measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Units', expression: "SUM ( 'Sales'[Qty] )" }, { name: 'Orders', expression: 'COUNTROWS ( Sales )' },
      { name: 'Margin %', expression: 'DIVIDE ( [Total Sales] - 1, [Total Sales] )' }, { name: 'نسبة النمو', expression: 'DIVIDE ( 1, 2 )' }, { name: 'Has Format', expression: 'SUM ( Sales[Amount] )', formatString: '0' }] });
    const f = typeof T.formatFixes === 'function' ? T.formatFixes([st], ['Total Sales', 'Units', 'Orders', 'Margin %', 'نسبة النمو', 'Has Format']) : { suggested: [], script: '' };
    check(JSON.stringify(f.suggested.map((x) => [x.measure, x.format])) === JSON.stringify([['[Total Sales]', '#,0'] /* (round 14, the laptop's proof on 6 Oct: an unformatted SUM shows no decimals, #,0; was #,0.00) */, ['[Units]', '#,0'], ['[Orders]', '#,0'], ['[Margin %]', '0.0%'], ['[نسبة النمو]', '0.0%']]) && f.suggested.every((x) => x.reason),
      `format script: suggestions ${JSON.stringify(f.suggested)}`);
    check(f.count === 5 && !/Has Format/.test(f.script || '') && (f.script || '').split('\n').includes('\t\t\tformatString: 0.0%') && (f.script || '').split('\n').includes('\t\t\tformatString: #,0') /* (round 14, the laptop's proof on 6 Oct: an unformatted SUM shows no decimals, #,0; was #,0.00) */, `format script: ${(f.script || '').slice(0, 300)}`);
    const pf = typeof T.formatFixes === 'function' ? T.formatFixes([Object.assign(sales(), { measures: [{ name: 'Return Rate', expression: 'DIVIDE ( 1, 2 )', formatString: '0.00' }] })], ['Return Rate'], { percent: true }) : { suggested: [] };
    check(pf.count === 1 && pf.suggested[0].format === '0.0%' && /formatString: 0\.0%/.test(pf.script), `format script, a rate formatted as a number: ${JSON.stringify(pf.suggested)}`);
    // the engine finds Arabic month and day name columns too
    const am = { model: { tables: [sales(), { name: 'التقويم', columns: [dcol('Date', 'dateTime'), dcol('اسم الشهر', 'string'), dcol('اسم اليوم', 'string'), dcol('رقم الشهر', 'int64')], partitions: mpart('التقويم') }] } };
    const found = ((E.analyze(am, null).findings.find((x) => x.id === 'MONTH_SORT') || {}).items || []).map((i) => i.obj).sort();
    check(JSON.stringify(found) === JSON.stringify(['التقويم[اسم الشهر]', 'التقويم[اسم اليوم]'].sort()), `Arabic month and day names without a sort column: found ${JSON.stringify(found)}`);
    // round 3: a broken field used inside a bookmark is told as that bookmark; a report's own filter stays "report filter"
    const gone = (p) => ({ Column: { Expression: { SourceRef: { Entity: 'Sales' } }, Property: p } }), bm = (name) => ({ name: 'b1', displayName: name, explorationState: { filters: { byExpr: [{ name: 'f', expression: gone('Gone In Bookmark') }] } } });
    const detail = (rep) => Object.fromEntries(((E.analyze({ model: { tables: [sales()] } }, rep).findings.find((x) => x.id === 'BROKEN_REF') || {}).items || []).map((i) => [i.obj, i.detail]));
    const pbir = detail({ format: 'pbir', files: [{ path: 'X.Report/definition/pages/p1/page.json', json: { name: 'p1', displayName: 'Page 1' } }, { path: 'X.Report/definition/report.json', json: { filterConfig: { filters: [{ name: 'rf', field: gone('Gone In Filter') }] } } },
      { path: 'X.Report/definition/bookmarks/b1.bookmark.json', json: bm('Q1 view') }, { path: 'X.Report/definition/bookmarks/bookmarks.json', json: { items: [{ name: 'b1' }] } }] });
    check(pbir['Sales[Gone In Bookmark]'] === 'bookmark "Q1 view"' && pbir['Sales[Gone In Filter]'] === 'report filter', `a broken field in a bookmark (PBIR): ${JSON.stringify(pbir)}`);
    const legacy = detail({ format: 'legacy', files: [{ path: 'Report/Layout', json: { sections: [{ name: 's1', displayName: 'Page 1', visualContainers: [] }], filters: JSON.stringify([{ expression: gone('Gone In Filter') }]),
      config: JSON.stringify({ version: '5.1', bookmarks: [{ displayName: 'Group', name: 'g', children: [bm('Old view')] }] }) } }] });
    check(legacy['Sales[Gone In Bookmark]'] === 'bookmark "Old view"' && legacy['Sales[Gone In Filter]'] === 'report filter', `a broken field in a bookmark (older report format): ${JSON.stringify(legacy)}`);
  }

  {
    // "Fix these first": the points on each button are what the score really gains when that check is fixed
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('.mh-quick button', { timeout: 20000 });
    const ids = await v.pg.$$eval('.mh-quick button', (bs) => bs.map((b) => b.dataset.jump));
    for (const id of ids) {
      const before = await v.pg.evaluate((id) => ({ score: +document.querySelector('.mh-scorecard .mh-ring b').textContent, badge: +((document.querySelector(`.mh-quick [data-jump="${id}"] b`) || {}).textContent || '0').replace('+', '') }), id);
      await v.pg.click(`[data-jump="${id}"]`);
      await v.pg.click(`[data-ign="${id}"]`);
      const after = +(await v.pg.$eval('.mh-scorecard .mh-ring b', (b) => b.textContent));
      check(after - before.score === before.badge, `Fix these first: ${id} shows +${before.badge}, fixing it gains ${after - before.score}`);
      await v.pg.click(`[data-ign="${id}"]`); // count it again
    }
    if (v.errs.length) problems.push(`Fix these first: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  {
    // score history keeps the 30 most recently checked files: re-checking a file keeps it, a new file drops the oldest
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.evaluate(() => { const h = { 'legacy.pbit': [{ d: '2026-09-01', s: 40 }] }; for (let i = 0; i < 29; i++) h['f' + i + '.pbit'] = [{ d: '2026-09-02', s: 50 }]; localStorage.setItem('dataarcus-mh-history', JSON.stringify(h)); });
    const legacy = fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/model-health/legacy.pbit'));
    for (const name of ['legacy.pbit', 'new.pbit']) {
      await v.pg.evaluate(() => { const b = document.getElementById('mhNew'); if (b) b.click(); });
      await v.pg.setInputFiles('#mhFile', { name, mimeType: 'application/octet-stream', buffer: legacy });
      await v.pg.waitForSelector('#mhTab', { timeout: 20000 });
    }
    const keys = await v.pg.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('dataarcus-mh-history'))));
    check(keys.length === 30 && keys.includes('legacy.pbit') && keys.includes('new.pbit') && !keys.includes('f0.pbit'), `score history: re-checked file dropped (${keys.length} files, legacy.pbit ${keys.includes('legacy.pbit')}, f0.pbit ${keys.includes('f0.pbit')})`);
    await v.ctx.close();
  }

  // ---- fix plan in the page ----
  for (const [name, file] of [['legacy.pbit', fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/model-health/legacy.pbit'))],
    ['plan.pbit', pbit({ DataModelSchema: JSON.stringify(planModel()), 'Report/Layout': JSON.stringify(planLayout), Version: '1.28' })]]) {
    const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.setInputFiles('#mhFile', { name, mimeType: 'application/octet-stream', buffer: file });
    await v.pg.waitForSelector('#mhTab', { timeout: 20000 });
    await v.pg.click('[data-tab=unused]');
    const unusedTab = await v.pg.$eval('#mhTab', (e) => e.innerText);
    await v.pg.click('[data-tab=fix]');
    const plan = await v.pg.evaluate(() => ({
      steps: [...document.querySelectorAll('[data-step]')].map((c) => c.dataset.step),
      pq: [...document.querySelectorAll('.mh-script')].map((s) => [s.querySelector('.mh-sh b').textContent, [...s.querySelector('pre').textContent.matchAll(/"((?:[^"]|"")*)"/g)].map((x) => x[1]).filter((x) => x !== 'Previous step')]),
      quick: (document.querySelector('.mh-qf') || {}).textContent || '',
      kept: [...document.querySelectorAll('.mh-kept li')].map((li) => li.textContent),
      calc: [...document.querySelectorAll('.mh-clean .mh-tags code')].map((c) => c.textContent),
      formats: [...document.querySelectorAll('.mh-formats li')].map((li) => li.textContent), formatsBtn: !!document.querySelector('[data-script="tmdl:formats"]')
    }));
    const removed = plan.pq.flatMap(([t, cols]) => cols.map((c) => t + '[' + c + ']'));
    const sorts = [...plan.quick.matchAll(/Columns\["([^"]+)"\]\.SortByColumn = Model\.Tables\["([^"]+)"\]\.Columns\["([^"]+)"\]/g)].map((x) => ({ col: x[1], table: x[2], by: x[3] }));
    const tag = `fix plan (${name})`;
    // the quick fixes and the cleanup never disagree: nothing the script sorts by is removed
    sorts.forEach((s) => check(!removed.includes(s.table + '[' + s.by + ']'), `${tag}: sorts ${s.col} by ${s.by}, then removes ${s.by} in Power Query`));
    check(!sorts.some((s) => /month.*year|year.*month/i.test(s.col) && /^month\s*(no|num|number)?$/i.test(s.by)), `${tag}: sorts a month-year column by the month number 1-12`);
    check(!removed.includes('_Measures[Column1]') && !/Column1/.test(unusedTab), `${tag}: the only column of _Measures is listed as unused or removed`);
    if (plan.steps.includes('calc') && plan.steps.includes('columns')) check(plan.steps.indexOf('calc') < plan.steps.indexOf('columns'), `${tag}: Power Query columns are removed before the calculated columns that read them`);
    if (name === 'plan.pbit') {
      // formats fixed at the source (owner 2026-10-06): the page lists the same fixes as the shared rule (and the MCP)
      const FR = load('model-health-tmdl.min.js').formatReview((planModel().model || planModel()).tables), fr = FR.items.concat(FR.byHand).map((i) => i.object + ': ' + (i.from || 'no format') + ' → ' + i.to);
      check(fr.length > 0 && JSON.stringify(plan.formats) === JSON.stringify(fr.slice(0, 50)) && plan.formatsBtn === !!FR.script, `${tag}: the formats listed (${JSON.stringify(plan.formats)}) are not the shared rule's (${JSON.stringify(fr)})`);
      check(JSON.stringify(removed) === JSON.stringify(['Sales[Note]']), `${tag}: removes ${JSON.stringify(removed)}, expected only Sales[Note]`);
      check(sorts.some((s) => s.col === 'Month Year' && s.by === 'Year Month') && sorts.some((s) => s.col === 'Month Name' && s.by === 'Month Number'), `${tag}: sorts ${JSON.stringify(sorts)}`);
      for (const k of ['Sales[Qty]', 'Sales[Code]', 'Calendar[Month Number]', 'Calendar[Year Month]', 'Old[A]']) check(plan.kept.some((x) => x.startsWith(k)), `${tag}: ${k} is not listed as kept`);
      check(plan.calc.includes('Sales[Flag]'), `${tag}: the unused calculated column Sales[Flag] is not listed`);
      // Markdown documentation: same content as the HTML one, and DAX containing ``` stays inside its code block
      await v.pg.click('[data-tab=docs]');
      const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('[data-doc="md"]')]);
      const md = fs.readFileSync(await dl.path(), 'utf8');
      check(md.includes('````dax\nSUM(Sales[Qty]) // ```\n````'), `${tag}: Markdown: DAX containing \`\`\` breaks its code block`);
      check(md.includes('**Sales[Flag]**\n\n```dax\nSales[Note] & "x"\n```'), `${tag}: Markdown: no DAX for the calculated column Sales[Flag]`);
      check(md.includes('Depends on: Sales[Amount]') && md.includes('**Data sources:** Sql.Database'), `${tag}: Markdown: no "Depends on" or data sources`);
    }
    if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }

  // ---- zipped PBIP projects saved as TMDL (Power BI Desktop's default; audit AUD-003) ----
  // each of the repository's TMDL models, zipped the way a project folder is (Name.SemanticModel/definition/...,
  // UTF-8 files, deflated), gives in the page the result the engine gives for the same files read by tmdl-model.js,
  // the MCP's reader
  {
    const T = load('tmdl-model.js');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const zipOf = (files) => {   // [[name, Buffer]], deflated like Windows' "Compress to ZIP"
      const parts = [], dir = []; let off = 0;
      for (const [name, raw] of files) {
        const data = zlib.deflateRawSync(raw), nb = Buffer.from(name), crc = zlib.crc32(raw);
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(crc, 14); h.writeUInt32LE(data.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(nb.length, 26);
        const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(crc, 16); c.writeUInt32LE(data.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
        parts.push(h, nb, data); dir.push(c, nb); off += 30 + nb.length + data.length;
      }
      const cd = Buffer.concat(dir), e = Buffer.alloc(22);
      e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(files.length, 8); e.writeUInt16LE(files.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
      return Buffer.concat([...parts, cd, e]);
    };
    const MODELS = [['tmdl-ramadan', 'scripts/tests/fixtures/model-health/tmdl-ramadan'], ['tmdl-health', 'scripts/tests/fixtures/model-health/tmdl-health'],
      ['bridge-project', 'scripts/tests/fixtures/bridge-project/Sales.SemanticModel'], ['arabic-long-names', 'mcp/test-models/arabic-long-names/Arabic Long Names.SemanticModel'],
      ['no-measures', 'mcp/test-models/no-measures/Plain Orders.SemanticModel'], ['large-synthetic', 'mcp/test-models/large-synthetic/Large Synthetic.SemanticModel']];
    for (const [name, dirRel] of MODELS) {
      const dir = path.join(ROOT, dirRel), files = walk(dir).filter((f) => /\.tmdl$/i.test(f));
      const rel = (f) => `${name}.SemanticModel/` + path.relative(dir, f).split(path.sep).join('/');
      const want = E.analyze(T.fromFiles(files.map((f) => ({ path: rel(f), text: fs.readFileSync(f, 'utf8').replace(/^﻿/, '') })), { lineageTags: true }), null);
      const zip = zipOf([[`${name}.pbip`, Buffer.from('{"version":"1.0"}')], ...files.map((f) => [rel(f), fs.readFileSync(f)])]);
      const v = await visitor(browser, { viewport: [1440, 900] });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
      await v.pg.setInputFiles('#mhFile', { name: `${name}.zip`, mimeType: 'application/zip', buffer: zip });
      const got = await v.pg.waitForSelector('#mhTab, .mh-error', { timeout: 30000 }).then(() => v.pg.evaluate(() => ({
        error: (document.querySelector('.mh-error b') || {}).textContent || '', score: +((document.querySelector('.mh-scorecard .mh-ring b') || {}).textContent || NaN) }))).catch((e) => ({ error: 'timeout ' + e.message.slice(0, 60) }));
      check(!got.error && got.score === want.score.overall, `TMDL project ${name}: ${got.error || `score ${got.score}`}, want score ${want.score.overall} (${want.stats.tables} tables, ${want.stats.measures} measures)`);
      if (v.errs.length) problems.push(`TMDL project ${name}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
    // the drop zone says what really works
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    const drop = await v.pg.$eval('#mhDrop small', (e) => e.textContent);
    check(/TMDL/.test(drop) && /model\.bim/.test(drop) && /PBIP/.test(drop), `drop zone: "${drop}" doesn't say a zipped PBIP project works in TMDL and model.bim`);
    await v.ctx.close();
  }
  // ---- .pbit limits (5 Oct 2026, the outside review's F-02): only the parts the check uses are unpacked, a part
  //      declared above the limit is refused before unpacking, a part that unpacks to more than it declares is
  //      stopped, and a bomb in a part nobody reads changes nothing. Same limits as the MCP's reader.
  {
    const zipOf = (entries) => {
      const parts = [], dir = []; let off = 0;
      for (const e of entries) {
        const raw = zlib.deflateRawSync(e.data), nb = Buffer.from(e.name), size = e.declared != null ? e.declared : e.data.length;
        const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(8, 8); h.writeUInt32LE(raw.length, 18); h.writeUInt32LE(size, 22); h.writeUInt16LE(nb.length, 26);
        const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(8, 10); c.writeUInt32LE(raw.length, 20); c.writeUInt32LE(size, 24); c.writeUInt16LE(nb.length, 28); c.writeUInt32LE(off, 42);
        parts.push(h, nb, raw); dir.push(c, nb); off += 30 + nb.length + raw.length;
      }
      const cd = Buffer.concat(dir), end = Buffer.alloc(22);
      end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
      return Buffer.concat([...parts, cd, end]);
    };
    const schema = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(JSON.stringify(planModel()), 'utf16le')]), zeros = Buffer.alloc(80 * 1024 * 1024);
    const cases = [
      ['declared', zipOf([{ name: 'DataModelSchema', data: Buffer.from('{}'), declared: 2000 * 1024 * 1024 }]), 'limit'],
      ['lying', zipOf([{ name: 'DataModelSchema', data: zeros, declared: 1000 }]), 'limit'],
      ['bomb', zipOf([{ name: 'DataModelSchema', data: zeros }]), 'limit'],
      ['unused', zipOf([{ name: 'DataModelSchema', data: schema }, { name: 'Report/StaticResources/SharedResources/BaseThemes/Big.json', data: zeros, declared: 1000 }]), 'ok']];
    for (const [name, file, want] of cases) {
      const v = await visitor(browser, { viewport: [1280, 900] });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
      const t0 = Date.now();
      await v.pg.setInputFiles('#mhFile', { name: name + '.pbit', mimeType: 'application/octet-stream', buffer: file });
      const got = await v.pg.waitForSelector('#mhTab, .mh-error', { timeout: 30000 }).then(() => v.pg.evaluate(() => ({ error: (document.querySelector('.mh-error b') || {}).textContent || '', ok: !!document.querySelector('#mhTab') }))).catch((e) => ({ error: 'timeout ' + e.message, ok: false }));
      const ms = Date.now() - t0;
      if (want === 'limit') check(!got.ok && /unpacks to more than the check reads/.test(got.error) && ms < 15000, `.pbit limits (${name}): must be refused with the limit message, got ${JSON.stringify(got)} in ${ms} ms`);
      else check(got.ok && !got.error, `.pbit limits (${name}): a bomb in a part the check never reads must change nothing, got ${JSON.stringify(got)}`);
      await v.ctx.close();
    }
  }

  return { checks, problems };
}
