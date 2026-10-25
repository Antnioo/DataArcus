// Model Health Check: the engine sees every real use of a column (placeholder columns of measure tables,
// field parameters, DAX functions, aggregation tables), and the fix plan never gives a step that breaks
// the next refresh: nothing it removes is still needed by something that stays, including its own quick fixes.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, visitor } from './lib.mjs';

// the engine and the TMDL builder exactly as the browser loads them (minified)
const load = (file) => { const m = { exports: {} }; new Function('module', 'exports', 'self', fs.readFileSync(path.join(ROOT, 'assets/js', file), 'utf8'))(m, m.exports, undefined); return m.exports; };
// (0.2.9: the page loads field-meaning.min.js first, the rule the TMDL builder reads; so does this test)
globalThis.DataArcusFieldMeaning = load('field-meaning.min.js');

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

// the model inside a .pbit (stored and deflate entries; Power BI writes it as UTF-16LE), as JSON text
function readPbitModel(buf) {
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--;
  let p = buf.readUInt32LE(e + 16);
  for (let n = buf.readUInt16LE(e + 10); n > 0; n--) {
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nlen = buf.readUInt16LE(p + 28), lho = buf.readUInt32LE(p + 42);
    if (buf.toString('utf8', p + 46, p + 46 + nlen) === 'DataModelSchema') {
      const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28), raw = buf.subarray(start, start + size), u8 = method === 8 ? zlib.inflateRawSync(raw) : raw;
      const b = Buffer.from(u8), bom = b[0] === 0xff && b[1] === 0xfe;
      return bom || (b.length > 1 && b[1] === 0) ? b.subarray(bom ? 2 : 0).toString('utf16le') : b.toString('utf8').replace(/^\uFEFF/, '');
    }
    p += 46 + nlen + buf.readUInt16LE(p + 30) + buf.readUInt16LE(p + 32);
  }
  throw new Error('no DataModelSchema');
}

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
    // (a Year column since 15 Oct: a table whose only column is a date and that has no relationship is a date picker,
    // not a calendar, Phase 1b+ class 8)
    const cal = (name) => ({ name, columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }, { name: 'Year', dataType: 'int64', sourceColumn: 'Year' }], partitions: mpart(name) });
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

  // ---- Health Check 2, phase 1 ("trust", 15 Oct 2026): every rule names its source, and Microsoft's documented
  //      exceptions are not findings ----
  {
    // every rule carries a source: Microsoft Learn (a learn.microsoft.com page), a Best Practice Analyzer rule of
    // Microsoft's (its id, the rules folder), or our own rule (no link, a reason); what it says in English and Arabic
    const BPA = 'https://github.com/microsoft/Analysis-Services/tree/master/BestPracticeRules';
    const ar = /[؀-ۿ]/;
    for (const [id, R] of Object.entries(E.RULES)) {
      const s = R.source || {};
      const ok = ['microsoft', 'bpa', 'dataarcus'].includes(s.kind) && s.title && s.says && s.says.en && ar.test(s.says.ar || '') &&
        (s.kind === 'microsoft' ? /^https:\/\/learn\.microsoft\.com\/[a-z]/.test(s.url || '') : s.kind === 'bpa' ? s.url === BPA && /^[A-Z0-9_()/-]+$/.test(s.title) : s.url == null);
      check(ok, `source of ${id}: ${JSON.stringify(s)}`);
    }
    check(!!E.RULES.FILTER_MEASURE && !!E.RULES.BIDI_BRIDGE, `the new rules FILTER_MEASURE and BIDI_BRIDGE: ${!!E.RULES.FILTER_MEASURE}, ${!!E.RULES.BIDI_BRIDGE}`);
  }

  {
    // relationships: one-to-one must be bi-directional (Microsoft: it can't be configured otherwise); a many-to-many
    // dimension bridge needs one bi-directional relationship; a fact table filtering both ways is still flagged
    const t = (name, cols, extra) => Object.assign({ name, columns: cols.map(([n, ty]) => ({ name: n, dataType: ty || 'int64', sourceColumn: n })), partitions: mpart(name) }, extra || {});
    const rel = (f, fc, to, tc, x) => Object.assign({ name: f + fc + to, fromTable: f, fromColumn: fc, toTable: to, toColumn: tc }, x || {});
    const ids = (m) => { const r = E.analyze(m, null); return Object.fromEntries(r.findings.map((f) => [f.id, f.items.map((i) => i.obj)])); };
    const one = ids({ model: { tables: [t('Employee', [['EmployeeID'], ['Name', 'string']]), t('Employee Salary', [['EmployeeID'], ['Salary', 'decimal']])],
      relationships: [rel('Employee Salary', 'EmployeeID', 'Employee', 'EmployeeID', { fromCardinality: 'one', toCardinality: 'one', crossFilteringBehavior: 'bothDirections' })] } });
    check(!one.BIDI && !one.BIDI_BRIDGE, `one-to-one: flagged ${JSON.stringify(one.BIDI || one.BIDI_BRIDGE)}, expected no finding`);
    // Microsoft's bank example: Account, Customer, the AccountCustomer bridge (identifier columns only), Transaction
    const bank = (bridgeCols) => ({ model: { tables: [t('Account', [['AccountID'], ['Account', 'string']]), t('Customer', [['CustomerID'], ['Customer', 'string']]),
      t('AccountCustomer', bridgeCols), t('Transaction', [['AccountID'], ['Date', 'dateTime'], ['Amount', 'decimal']])],
    relationships: [rel('AccountCustomer', 'AccountID', 'Account', 'AccountID', { crossFilteringBehavior: 'bothDirections' }), rel('AccountCustomer', 'CustomerID', 'Customer', 'CustomerID'),
      rel('Transaction', 'AccountID', 'Account', 'AccountID')] } });
    const br = ids(bank([['AccountID'], ['CustomerID']]));
    check(!br.BIDI && JSON.stringify(br.BIDI_BRIDGE) === JSON.stringify(['AccountCustomer[AccountID] ↔ Account[AccountID]']), `bridge: BIDI ${JSON.stringify(br.BIDI)}, BIDI_BRIDGE ${JSON.stringify(br.BIDI_BRIDGE)}, expected the bridge wording only`);
    check(/many-to-many bridge/.test(E.RULES.BIDI_BRIDGE ? E.RULES.BIDI_BRIDGE.en[2] : '') && /if so,? it is needed/i.test(E.RULES.BIDI_BRIDGE ? E.RULES.BIDI_BRIDGE.en[2] : ''), 'bridge: the advice says to check it is the many-to-many bridge, and that it is needed then');
    // a fact table on the many side of several relationships is not a bridge: it has other columns (Microsoft's
    // dimension-to-dimension case advises CROSSFILTER in a measure instead), so it keeps today's finding
    const fact = ids({ model: { tables: [t('Product', [['ProductKey'], ['Color', 'string']]), t('Customer', [['CustomerKey'], ['Country', 'string']]), t('Sales', [['ProductKey'], ['CustomerKey'], ['Quantity']])],
      relationships: [rel('Sales', 'ProductKey', 'Product', 'ProductKey', { crossFilteringBehavior: 'bothDirections' }), rel('Sales', 'CustomerKey', 'Customer', 'CustomerKey')] } });
    check(JSON.stringify(fact.BIDI) === JSON.stringify(['Sales[ProductKey] ↔ Product[ProductKey]']) && !fact.BIDI_BRIDGE, `fact table filtering both ways: BIDI ${JSON.stringify(fact.BIDI)}, BIDI_BRIDGE ${JSON.stringify(fact.BIDI_BRIDGE)}`);
  }

  {
    // FILTER inside CALCULATE: a column predicate can be a Boolean filter (FILTER_TABLE); a predicate with a measure
    // can't (Microsoft: a Boolean filter cannot reference a measure), so it needs FILTER, over a column (FILTER_MEASURE);
    // FILTER over VALUES of a column is Microsoft's own advice (no finding)
    const ms = { M1: 'CALCULATE([Total], FILTER(Sales, Sales[Channel] = "Online"))', M2: 'CALCULATE([Total], FILTER(VALUES(Sales[Month]), [Profit] > 0))',
      M3: 'CALCULATE([Total], FILTER(Sales, [Profit] > 0))', M4: 'CALCULATE([Total], FILTER(ALL(Sales), [Profit] > 0))' };
    const m = { model: { tables: [{ name: 'Sales', columns: [{ name: 'Channel', dataType: 'string', sourceColumn: 'Channel' }, { name: 'Month', dataType: 'string', sourceColumn: 'Month' }, { name: 'Amount', dataType: 'decimal', sourceColumn: 'Amount' }, { name: 'Cost', dataType: 'decimal', sourceColumn: 'Cost' }],
      partitions: mpart('Sales'), measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])' }, { name: 'Profit', expression: '[Total] - SUM(Sales[Cost])' }].concat(Object.entries(ms).map(([name, expression]) => ({ name, expression }))) }] } };
    const r = E.analyze(m, null), of = (id) => ((r.findings.find((f) => f.id === id) || {}).items || []).map((i) => i.obj);
    check(JSON.stringify(of('FILTER_TABLE')) === '["[M1]"]', `FILTER_TABLE flags ${JSON.stringify(of('FILTER_TABLE'))}, expected only [M1] (the column predicate)`);
    check(JSON.stringify(of('FILTER_MEASURE')) === '["[M3]","[M4]"]', `FILTER_MEASURE flags ${JSON.stringify(of('FILTER_MEASURE'))}, expected [M3] and [M4] (a measure in the predicate, over a whole table)`);
    check(/VALUES\(/.test(E.RULES.FILTER_MEASURE ? E.RULES.FILTER_MEASURE.en[2] : '') && /VALUES\(/.test(E.RULES.FILTER_MEASURE ? E.RULES.FILTER_MEASURE.ar[2] : ''), 'FILTER_MEASURE: the advice (English and Arabic) is FILTER over VALUES of the column');
  }

  {
    // Microsoft's other documented exceptions: "/" by a constant is the right choice (no DIVISION); a role-playing date
    // whose inactive relationship a measure turns on with USERELATIONSHIP is in use (no INACTIVE_UNUSED)
    const m = (withUse) => ({ model: { tables: [{ name: 'Sales', columns: [{ name: 'OrderDate', dataType: 'dateTime', sourceColumn: 'OrderDate' }, { name: 'ShipDate', dataType: 'dateTime', sourceColumn: 'ShipDate' }, { name: 'Amount', dataType: 'decimal', sourceColumn: 'Amount' }],
      partitions: mpart('Sales'), measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])' }, { name: 'Total K', expression: '[Total] / 1000' }, { name: 'Per Month', expression: 'SUM ( Sales[Amount] ) / 12.5' }]
        .concat(withUse ? [{ name: 'Shipped', expression: "CALCULATE([Total], USERELATIONSHIP(Sales[ShipDate], 'Date'[Date]))" }] : []) },
    { name: 'Date', columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }], partitions: mpart('Date') }],
    relationships: [{ name: 'o', fromTable: 'Sales', fromColumn: 'OrderDate', toTable: 'Date', toColumn: 'Date' }, { name: 's', fromTable: 'Sales', fromColumn: 'ShipDate', toTable: 'Date', toColumn: 'Date', isActive: false }] } });
    const ids = (x) => E.analyze(x, null).findings.map((f) => f.id);
    check(!ids(m(true)).includes('DIVISION'), 'a constant denominator ([Total] / 1000, SUM(...) / 12.5) is flagged DIVISION');
    check(!ids(m(true)).includes('INACTIVE_UNUSED'), 'a role-playing date activated with USERELATIONSHIP is flagged INACTIVE_UNUSED');
    check(ids(m(false)).includes('INACTIVE_UNUSED'), 'the same inactive relationship without the USERELATIONSHIP measure is not flagged');
  }

  // ---- Phase 1b+ (15 Oct 2026): the false positives a benchmark on public models found, one class per check,
  //      each with a control that must stay flagged ----
  {
    const col = (n, ty) => ({ name: n, dataType: ty || 'int64', sourceColumn: n });
    const tbl = (name, cols, extra) => Object.assign({ name, columns: cols, partitions: mpart(name) }, extra || {});
    const items = (r, id) => ((r.findings.find((f) => f.id === id) || {}).items || []).map((i) => i.obj);
    const ms = (name, expression, x) => Object.assign({ name, expression }, x || {});

    // 1. BIDI on an inactive relationship: it filters nothing until USERELATIONSHIP turns it on; INACTIVE_UNUSED reports it
    {
      const m = { model: { tables: [tbl('Sales', [col('ProductKey'), col('AltKey'), col('Qty')]), tbl('Product', [col('ProductKey'), col('Color', 'string')])],
        relationships: [{ name: 'a', fromTable: 'Sales', fromColumn: 'ProductKey', toTable: 'Product', toColumn: 'ProductKey', crossFilteringBehavior: 'bothDirections' },
          { name: 'b', fromTable: 'Sales', fromColumn: 'AltKey', toTable: 'Product', toColumn: 'ProductKey', crossFilteringBehavior: 'bothDirections', isActive: false }] } };
      const r = E.analyze(m, null);
      check(JSON.stringify(items(r, 'BIDI')) === '["Sales[ProductKey] ↔ Product[ProductKey]"]' && JSON.stringify(items(r, 'INACTIVE_UNUSED')) === '["Sales[AltKey] → Product[ProductKey]"]',
        `1b+ class 1, BIDI on an inactive relationship: BIDI ${JSON.stringify(items(r, 'BIDI'))}, INACTIVE_UNUSED ${JSON.stringify(items(r, 'INACTIVE_UNUSED'))}`);
    }

    // 2. NO_FORMAT on a measure that returns text (a number format can't apply); unclear results keep the finding
    {
      const text = { T1: '"Sales report"', T2: '"https://example.com/r?id=" & [Total]', T3: 'VAR v = [Total]\nVAR svg = "data:image/svg+xml;utf8,<svg></svg>"\nRETURN svg',
        T4: 'IF([Total] >= 0, "#16a34a", "#dc2626")', T5: 'SELECTEDVALUE(Product[Name])', T6: 'FORMAT([Total], "0.0")', T7: 'CONCATENATEX(Product, Product[Name], ", ")',
        T8: 'UNICHAR(9650)', T9: 'MAX(Product[Name])', T10: 'VAR x = 1 RETURN CONCATENATE("v", "1.2")', T11: 'SWITCH(TRUE(), [Total] > 0, "Up", "Down")' };
      const kept = { N1: 'SUM(Sales[Amount])', N2: 'SELECTEDVALUE(Sales[Amount])', N3: 'IF([Total] > 0, 1, "none")', N4: 'VAR t = "a" RETURN [Total]', N5: 'MAX(Sales[Amount])' };
      const m = { model: { tables: [tbl('Sales', [col('Amount', 'decimal')], { measures: [ms('Total', 'SUM(Sales[Amount])', { formatString: '#,0' })]
        .concat(Object.entries(Object.assign({}, text, kept)).map(([n, e]) => ms(n, e))) }), tbl('Product', [col('Name', 'string')])] } };
      const got = items(E.analyze(m, null), 'NO_FORMAT').sort();
      check(JSON.stringify(got) === JSON.stringify(Object.keys(kept).map((k) => `[${k}]`).sort()), `1b+ class 2, NO_FORMAT on text measures: flags ${JSON.stringify(got)}, expected only ${Object.keys(kept)}`);
    }

    // 3. NO_FORMAT on a hidden measure (or one in a hidden table) that no visual uses (BPA's rule is for visible
    //    measures); a hidden measure a visual uses keeps it
    {
      const m = { model: { tables: [tbl('Sales', [col('Amount', 'decimal')], { measures: [ms('V', 'SUM(Sales[Amount])'), ms('H1', 'SUM(Sales[Amount]) * 2', { isHidden: true }), ms('H2', 'SUM(Sales[Amount]) * 3', { isHidden: true })] }),
        tbl('Helpers', [col('X')], { isHidden: true, measures: [ms('H3', 'SUM(Sales[Amount]) * 4')] })] } };
      const got = items(E.analyze(m, report([['Measure', 'Sales', 'V'], ['Measure', 'Sales', 'H2']])), 'NO_FORMAT').sort();
      check(JSON.stringify(got) === '["[H2]","[V]"]', `1b+ class 3, NO_FORMAT on hidden measures: flags ${JSON.stringify(got)}, expected [H2] (hidden, in a visual) and [V]`);
    }

    // 4. NO_DESC on a hidden measure (the reason is the field-list tooltip; BPA's rule is for visible objects), and
    //    the share is of visible measures
    {
      const m = { model: { tables: [tbl('Sales', [col('Amount', 'decimal')], { measures: [ms('A', 'SUM(Sales[Amount])'), ms('B', 'SUM(Sales[Amount]) * 2'), ms('C', 'SUM(Sales[Amount]) * 3', { description: 'Three times' }),
        ms('H', 'SUM(Sales[Amount]) * 4', { isHidden: true })] })] } };
      const got = items(E.analyze(m, null), 'NO_DESC').sort();
      check(JSON.stringify(got) === '["[A]","[B]"]', `1b+ class 4, NO_DESC on a hidden measure: flags ${JSON.stringify(got)}, expected [A] and [B]`);
      // 2 of 4 visible lack one (50%, not over half), however many hidden ones do: no finding
      const m2 = { model: { tables: [tbl('Sales', [col('Amount', 'decimal')], { measures: ['A', 'B', 'C', 'D'].map((n, i) => ms(n, `SUM(Sales[Amount]) * ${i + 1}`, i < 2 ? { description: 'x' } : {}))
        .concat(['H1', 'H2', 'H3'].map((n, i) => ms(n, `SUM(Sales[Amount]) * ${i + 10}`, { isHidden: true }))) })] } };
      check(!items(E.analyze(m2, null), 'NO_DESC').length, `1b+ class 4, NO_DESC share of visible measures: flags ${JSON.stringify(items(E.analyze(m2, null), 'NO_DESC'))}`);
    }

    // 5. NO_FOLDERS on a hidden measure; the 20-measure floor and the 30% share count visible measures only
    {
      const many = (vis, visNoFolder, hidden) => ({ model: { tables: [tbl('Sales', [col('Amount', 'decimal')], { measures:
        Array.from({ length: vis }, (_, i) => ms('V' + i, `SUM(Sales[Amount]) * ${i + 1}`, i < visNoFolder ? {} : { displayFolder: 'Sales' }))
          .concat(Array.from({ length: hidden }, (_, i) => ms('H' + i, `SUM(Sales[Amount]) * ${i + 100}`, { isHidden: true }))) })] } });
      const a = items(E.analyze(many(20, 7, 3), null), 'NO_FOLDERS');
      check(a.length === 7 && a.every((x) => /^\[V/.test(x)), `1b+ class 5, NO_FOLDERS: flags ${JSON.stringify(a)}, expected the 7 visible measures only`);
      check(!items(E.analyze(many(20, 5, 10), null), 'NO_FOLDERS').length, '1b+ class 5, NO_FOLDERS: 5 of 20 visible without a folder (25%) is flagged because of 10 hidden ones');
      check(!items(E.analyze(many(15, 10, 10), null), 'NO_FOLDERS').length, '1b+ class 5, NO_FOLDERS: 15 visible measures (under 20) is flagged because of 10 hidden ones');
    }

    // 6. CALC_COLS on a column Microsoft says belongs in DAX (parent-child paths, a measure, context transition,
    //    RANKX or EARLIER, an aggregate over another table); plain row arithmetic and RELATED keep the finding
    {
      const cc = (name, expression) => ({ name, expression, type: 'calculated', dataType: 'int64' });
      const m = { model: { tables: [
        tbl('Employee', [col('ID'), col('Parent'), cc('Path', 'PATH(Employee[ID], Employee[Parent])'), cc('Level 2', 'PATHITEM(Employee[Path], 2, INTEGER)'), cc('Depth', 'PATHLENGTH(Employee[Path])'), cc('Under 7', 'PATHCONTAINS(Employee[Path], 7)')]),
        tbl('Sales', [col('Key'), col('ProductKey'), col('Amount', 'decimal'), cc('M', '[Total]'), cc('C', 'CALCULATE(SUM(Returns[Qty]))'), cc('R', 'RANKX(ALL(Sales), Sales[Amount])'),
          cc('E', 'COUNTROWS(FILTER(Sales, Sales[Amount] > EARLIER(Sales[Amount])))'), cc('A1', 'SUMX(RELATEDTABLE(Returns), Returns[Qty])'), cc('A2', 'SUMX(FILTER(Returns, Returns[Key] = Sales[Key]), Returns[Qty])'),
          cc('A3', 'COUNTROWS(FILTER(ALL(Returns), Returns[Key] = Sales[Key]))'),
          cc('K1', 'Sales[Amount] * 2'), cc('K2', 'RELATED(Product[Color])'), cc('K3', 'IF(Sales[Amount] > 100, "Big", "Small")')], { measures: [ms('Total', 'SUM(Sales[Amount])', { formatString: '0' })] }),
        tbl('Returns', [col('Key'), col('Qty')]), tbl('Product', [col('ProductKey'), col('Color', 'string')])],
      relationships: [{ name: 'r', fromTable: 'Returns', fromColumn: 'Key', toTable: 'Sales', toColumn: 'Key' }, { name: 'p', fromTable: 'Sales', fromColumn: 'ProductKey', toTable: 'Product', toColumn: 'ProductKey' }] } };
      const got = items(E.analyze(m, null), 'CALC_COLS').sort();
      check(JSON.stringify(got) === '["Sales[K1]","Sales[K2]","Sales[K3]"]', `1b+ class 6, CALC_COLS: flags ${JSON.stringify(got)}, expected only Sales[K1], Sales[K2], Sales[K3]`);
    }

    // 7. DUP_MEASURE: the same text in two home tables sums two different columns; the same qualified DAX is a duplicate
    {
      const m = { model: { tables: [tbl('Internet', [col('SalesAmount', 'decimal')], { measures: [ms('Internet Total', 'SUM([SalesAmount])'), ms('Same A', 'SUM(Internet[SalesAmount]) * 1.05')] }),
        tbl('Reseller', [col('SalesAmount', 'decimal')], { measures: [ms('Reseller Total', 'SUM([SalesAmount])'), ms('Same B', 'SUM(Internet[SalesAmount]) * 1.05')] })] } };
      const got = items(E.analyze(m, null), 'DUP_MEASURE');
      check(JSON.stringify(got) === '["[Same A] = [Same B]"]', `1b+ class 7, DUP_MEASURE: flags ${JSON.stringify(got)}, expected only [Same A] = [Same B]`);
    }

    // 8. DATE_NOT_MARKED on a date picker (a table whose only column is a date, with no relationship); a calendar
    //    with a relationship, or with other columns, keeps it; the text says calendar-based time intelligence needs no mark
    {
      const d = (name, cols) => tbl(name, cols || [col('Date', 'dateTime')]);
      const m = { model: { tables: [tbl('Sales', [col('OrderDate', 'dateTime'), col('Qty')]), d('Date Picker'), d('Dates'), d('Calendar'), d('Date', [col('Date', 'dateTime'), col('Year')])],
        relationships: [{ name: 'c', fromTable: 'Sales', fromColumn: 'OrderDate', toTable: 'Calendar', toColumn: 'Date' }] } };
      const got = items(E.analyze(m, null), 'DATE_NOT_MARKED').sort();
      check(JSON.stringify(got) === '["Calendar","Date"]', `1b+ class 8, DATE_NOT_MARKED on date pickers: flags ${JSON.stringify(got)}, expected Calendar (related) and Date (has a Year column)`);
      check(/calendar-based time intelligence/i.test(E.RULES.DATE_NOT_MARKED.en[1]) && /Calendar-based time intelligence|calendar-based/i.test(E.RULES.DATE_NOT_MARKED.ar[1]),
        `1b+ class 8, DATE_NOT_MARKED's text says calendar-based time intelligence needs no mark: ${E.RULES.DATE_NOT_MARKED.en[1]}`);
    }

    // 9. HARDCODED_PATH on a template placeholder ({{NAME}}); a literal server keeps it
    {
      const q = (name, e) => tbl(name, [col('A')], { partitions: [{ name, source: { type: 'm', expression: e } }] });
      const m = { model: { tables: [q('T1', 'let Source = Sql.Database("{{SERVER}}", "{{DATABASE}}") in Source'), q('T2', 'let Source = Sql.Database("{{Server}}.database.windows.net", "Sales") in Source'),
        q('T3', 'let Source = Csv.Document(File.Contents("{{DATA_FOLDER}}\\\\sales.csv")) in Source'), q('K1', 'let Source = Sql.Database("contoso-sql01.database.windows.net", "DW") in Source'),
        q('K2', 'let Source = Csv.Document(File.Contents("C:\\\\Users\\\\me\\\\sales.csv")) in Source')] } };
      const got = items(E.analyze(m, null), 'HARDCODED_PATH').sort();
      check(JSON.stringify(got) === '["K1","K2"]', `1b+ class 9, HARDCODED_PATH on placeholders: flags ${JSON.stringify(got)}, expected only K1 and K2`);
    }

    // 10. FILTER over a table whose predicate compares with another table or an aggregate: still FILTER_TABLE, with
    //     its own advice (put the value in a variable first, then a Boolean column filter works)
    {
      const m = { model: { tables: [tbl('Customer', [col('Key'), col('Since', 'dateTime'), col('City', 'string')], { measures: [ms('Total', 'COUNTROWS(Customer)'),
        ms('New', "CALCULATE([Total], FILTER(Customer, Customer[Since] >= MIN('Calendar'[Date])))"), ms('Big', 'CALCULATE([Total], FILTER(Customer, Customer[Key] > MAXX(ALL(Customer), Customer[Key]) / 2))'),
        ms('Dubai', 'CALCULATE([Total], FILTER(Customer, Customer[City] = "Dubai"))')] }), tbl('Calendar', [col('Date', 'dateTime')])] } };
      const r = E.analyze(m, null), f = r.findings.find((x) => x.id === 'FILTER_TABLE') || { items: [] };
      const by = Object.fromEntries(f.items.map((i) => [i.obj, i]));
      check(f.items.length === 3 && by['[New]'] && by['[New]'].variant === 'VAR' && by['[Big]'] && by['[Big]'].variant === 'VAR' && by['[Dubai]'] && !by['[Dubai]'].variant,
        `1b+ class 10, FILTER_TABLE advice per item: ${JSON.stringify(f.items)}`);
      const v = (E.RULES.FILTER_TABLE.variants || {}).VAR || {};
      check(/VAR /.test(v.en || '') && /VAR /.test(v.ar || '') && /[\u0600-\u06FF]/.test(v.ar || '') && by['[New]'] && by['[New]'].detail === v.en, `1b+ class 10, the variable advice (English and Arabic, and as the item's detail): ${JSON.stringify(v)}`);
    }
  }

  // ---- Phase 1b++ (15 Oct 2026): the last text-returning measures the benchmark found under NO_FORMAT ----
  {
    const text = {
      // 1. a composite model's remote measure, typed as text in its own declaration
      X1: 'EXTERNALMEASURE("Name", STRING, "DirectQuery to AS - Model")',
      // 2. CALCULATE of MIN / MAX / SELECTEDVALUE of a text column
      C1: 'CALCULATE(MIN(Cap[displayName]), Cap[displayName] <> "")', C2: 'CALCULATE(SELECTEDVALUE(Cap[displayName]))', C3: 'CALCULATE ( MAX ( Cap[displayName] ), ALL ( Cap ) )',
      // 3. IF / SWITCH nested deeper, inside VAR ... RETURN, or returning a measure that returns text
      I1: 'IF([Total] > 0, IF([Total] > 10, "big", IF([Total] > 5, "mid", "small")), "none")',
      I2: 'VAR n = [Total]\nRETURN IF(n > 0, SWITCH(TRUE(), n > 10, "big", n > 5, "mid", "small"), "none")',
      I3: 'IF(ISBLANK([Admin Name]), "None", [Admin Name])', 'Admin Name': 'CALCULATE(MIN(Cap[displayName]), ALL(Cap))'
    };
    const kept = { XN: 'EXTERNALMEASURE("Amount", DOUBLE, "DirectQuery to AS - Model")', XI: 'EXTERNALMEASURE("Count", INTEGER, "DirectQuery to AS - Model")',
      CN: 'CALCULATE(MAX(Sales[Amount]), ALL(Sales))', IN: 'IF([Total] > 0, IF([Total] > 10, "big", 1), "none")', IM: 'IF(ISBLANK([Total]), "None", [Total])' };
    const m = { model: { tables: [{ name: 'Sales', columns: [{ name: 'Amount', dataType: 'decimal', sourceColumn: 'Amount' }], partitions: mpart('Sales'),
      measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '#,0' }].concat(Object.entries(Object.assign({}, text, kept)).map(([name, expression]) => ({ name, expression }))) },
    { name: 'Cap', columns: [{ name: 'displayName', dataType: 'string', sourceColumn: 'displayName' }], partitions: mpart('Cap') }] } };
    const got = ((E.analyze(m, null).findings.find((f) => f.id === 'NO_FORMAT') || {}).items || []).map((i) => i.obj).sort();
    const groups = { 'EXTERNALMEASURE declared STRING': ['X1'], 'CALCULATE of MIN/MAX/SELECTEDVALUE of a text column': ['C1', 'C2', 'C3', 'Admin Name'],
      'nested IF/SWITCH, VAR ... RETURN, a text measure returned': ['I1', 'I2', 'I3'], 'controls (numeric or mixed: stay flagged)': [] };
    for (const [what, names] of Object.entries(groups)) {
      const wrong = names.length ? names.filter((n) => got.includes(`[${n}]`)) : Object.keys(kept).filter((n) => !got.includes(`[${n}]`));
      check(!wrong.length, `1b++ NO_FORMAT, ${what}: ${names.length ? 'still flagged' : 'no longer flagged'} ${JSON.stringify(wrong)}`);
    }
  }

  // ---- Health Check 3 (18 Oct 2026), part A: four scored rules made precise, each with a case that stays flagged ----
  {
    const col = (n, ty, x) => Object.assign({ name: n, dataType: ty || 'int64', sourceColumn: n }, x || {});
    const ms = (name, expression, x) => Object.assign({ name, expression }, x || {});
    const items = (r, id) => ((r.findings.find((f) => f.id === id) || {}).items || []).map((i) => i.obj).sort();
    const model = (cols, measures, extra) => ({ model: Object.assign({ tables: [{ name: 'Sales', columns: cols, partitions: mpart('Sales'), measures },
      { name: 'Product', columns: [col('Name', 'string'), col('Key')], partitions: mpart('Product') }] }, extra || {}) });
    const base = [col('Amount', 'decimal'), col('Cost', 'decimal'), col('Qty')];

    // A1. PCT_FORMAT: a ratio formatted 0.00 is a multiple (Current Ratio, Quick Ratio), and a count is a whole number
    //     however it is named; a percentage-like measure formatted 0.00 stays flagged
    {
      const r = E.analyze(model(base, [ms('Current Ratio', 'DIVIDE(SUM(Sales[Amount]), SUM(Sales[Cost]))', { formatString: '0.00' }),
        ms('Quick Ratio', 'DIVIDE(SUM(Sales[Amount]) - SUM(Sales[Qty]), SUM(Sales[Cost]))', { formatString: '0.00' }),
        ms('Asset Turnover', 'DIVIDE(SUM(Sales[Amount]), SUM(Sales[Cost]))', { formatString: '0.00' }),
        ms('Rate Count', 'COUNTROWS(Sales)', { formatString: '0' }), ms('Rate Lines', 'DISTINCTCOUNT(Sales[Qty])', { formatString: '#,0' }),
        ms('Share of Orders Count', 'DIVIDE(SUM(Sales[Qty]), 2)', { formatString: '0' }),
        ms('Margin %', 'DIVIDE(SUM(Sales[Amount]) - SUM(Sales[Cost]), SUM(Sales[Amount]))', { formatString: '0.00' }),
        ms('Return Rate', 'DIVIDE(SUM(Sales[Qty]), SUM(Sales[Amount]))', { formatString: '0.00' })]), null);
      check(JSON.stringify(items(r, 'PCT_FORMAT')) === '["[Margin %]","[Return Rate]"]', `HC3 A1, PCT_FORMAT: flags ${JSON.stringify(items(r, 'PCT_FORMAT'))}, expected only [Margin %] and [Return Rate]`);
    }

    // A2. DIVISION: a divisor that is a VAR bound to a nonzero number is a constant; a VAR bound to a measure, or to 0, is not
    {
      const r = E.analyze(model(base, [ms('Minutes', 'VAR _TotalTicks = 60\nRETURN SUM(Sales[Qty]) / _TotalTicks', { formatString: '0' }),
        ms('Thousands', 'VAR k = 1e3 VAR n = SUM(Sales[Amount]) RETURN n / k', { formatString: '0' }),
        ms('Per Unit', 'VAR d = SUM(Sales[Qty])\nRETURN SUM(Sales[Amount]) / d', { formatString: '0' }),
        ms('By Zero', 'VAR z = 0 RETURN SUM(Sales[Amount]) / z', { formatString: '0' })]), null);
      check(JSON.stringify(items(r, 'DIVISION')) === '["[By Zero]","[Per Unit]"]', `HC3 A2, DIVISION: flags ${JSON.stringify(items(r, 'DIVISION'))}, expected only [By Zero] and [Per Unit]`);
    }

    // A3. DOUBLE: map coordinates (dataCategory Latitude / Longitude) need a decimal type; other doubles stay flagged
    {
      const r = E.analyze(model(base.concat([col('Lat', 'double', { dataCategory: 'Latitude' }), col('Lon', 'double', { dataCategory: 'Longitude' }), col('Weight', 'double')]), []), null);
      check(JSON.stringify(items(r, 'DOUBLE')) === '["Sales[Weight]"]', `HC3 A3, DOUBLE: flags ${JSON.stringify(items(r, 'DOUBLE'))}, expected only Sales[Weight]`);
    }

    // A4. NO_FORMAT: text returned through FIRSTNONBLANK / LASTNONBLANK (and their VALUE forms) or MINX / MAXX over
    //     ALLSELECTED of a text column, also inside IF branches; the same over a number column stays flagged
    {
      const text = { F1: 'FIRSTNONBLANK(Product[Name], 1)', F2: 'LASTNONBLANK(Product[Name], [Total])', F3: 'IF(HASONEVALUE(Product[Name]), FIRSTNONBLANK(Product[Name], 1), "Several")',
        F4: 'MAXX(ALLSELECTED(Product[Name]), Product[Name])', F5: 'IF([Total] > 0, MINX(ALLSELECTED(Product), Product[Name]), BLANK())', F6: 'LASTNONBLANKVALUE(Product[Key], MAX(Product[Name]))' };
      const kept = { K1: 'FIRSTNONBLANK(Sales[Amount], 1)', K2: 'MAXX(ALLSELECTED(Sales), Sales[Amount])', K3: 'LASTNONBLANKVALUE(Product[Name], SUM(Sales[Amount]))' };
      const r = E.analyze(model(base, [ms('Total', 'SUM(Sales[Amount])', { formatString: '#,0' })].concat(Object.entries(Object.assign({}, text, kept)).map(([n, e]) => ms(n, e)))), null);
      check(JSON.stringify(items(r, 'NO_FORMAT')) === JSON.stringify(Object.keys(kept).map((k) => `[${k}]`).sort()), `HC3 A4, NO_FORMAT on text through FIRSTNONBLANK and ALLSELECTED: flags ${JSON.stringify(items(r, 'NO_FORMAT'))}, expected only ${Object.keys(kept)}`);
    }
  }

  // ---- Health Check 3, part B: the "Please confirm" questions. Never a finding, never in the score; the evidence is
  //      an exact piece of the measure's DAX, or the relationship's own columns ----
  {
    const col = (n, ty) => ({ name: n, dataType: ty || 'int64', sourceColumn: n });
    const ms = (name, expression) => ({ name, expression, formatString: '#,0' });
    const measures = {
      'Total Sales Overall': 'CALCULATE(SUM(Sales[Amount]), Sales[Category] <> "Test")',
      'Sales Excl Test': 'CALCULATE(SUM(Sales[Amount]), Sales[Category] <> "Test")',
      'Total A': 'CALCULATE(SUM(Sales[Amount]), Sales[Category] = "A")',
      'Units Doubled': 'SUM(Sales[Qty]) + SUM(Sales[Qty])',
      'Units Mixed': 'SUM(Sales[Qty]) + SUM(Sales[Cases])',
      'Total Deaths': 'SUM ( Sales[Cases] )',
      'Total Cases': 'SUM(Sales[Cases])',
      'Latest Date': 'MAX(Sales[OrderDate]) - 1',
      'Current Sales': 'CALCULATE(SUM(Sales[Amount]), DATEADD(Sales[OrderDate], -1, DAY))',
      'Previous Day Sales': 'CALCULATE(SUM(Sales[Amount]), DATEADD(Sales[OrderDate], -1, DAY))',
      'Latest Order': 'MAX(Sales[OrderDate])'
    };
    const m = (names) => ({ model: { tables: [
      { name: 'Sales', columns: [col('OrderID'), col('CustomerKey'), col('ProductKey'), col('Amount', 'decimal'), col('Qty'), col('Cases'), col('Category', 'string'), col('OrderDate', 'dateTime'), col('RefId')],
        partitions: mpart('Sales'), measures: names.map((n) => ms(n, measures[n])) },
      { name: 'Product', columns: [col('ProductKey'), col('Color', 'string')], partitions: mpart('Product') },
      { name: 'Ref', columns: [col('Id'), col('RefId'), col('Label', 'string')], partitions: mpart('Ref') }],
    relationships: [{ name: 'p', fromTable: 'Sales', fromColumn: 'CustomerKey', toTable: 'Product', toColumn: 'ProductKey' },
      { name: 'g', fromTable: 'Sales', fromColumn: 'OrderID', toTable: 'Ref', toColumn: 'Id' }] } });
    const r = E.analyze(m(Object.keys(measures)), null);
    const conf = r.confirm || [];
    const got = conf.map((c) => c.id + ' ' + c.obj).sort();
    const want = ['duplicateAggregate [Units Doubled]', 'shiftedCurrentDate [Current Sales]', 'shiftedCurrentDate [Latest Date]', 'totalFilter [Total Sales Overall]', 'wrongColumn [Total Deaths]',
      'wrongRelationshipKey Sales[CustomerKey] → Product[ProductKey]'].sort();
    check(JSON.stringify(got) === JSON.stringify(want), `HC3 B, the questions: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    // the evidence: an exact substring of the measure's DAX (never rewritten), or no DAX for a relationship
    for (const c of conf) {
      const expr = measures[String(c.obj).replace(/^\[|\]$/g, '')];
      if (c.relationship) check(c.evidence === '' && c.relationship.fromColumn === 'CustomerKey' && c.relationship.candidateColumn === 'ProductKey', `HC3 B, ${c.id}: structural evidence only: ${JSON.stringify(c)}`);
      else check(!!c.evidence && expr.includes(c.evidence), `HC3 B, ${c.id} on ${c.obj}: the evidence "${c.evidence}" is not an exact piece of its DAX`);
      check(/\?$/.test(c.message.en) && /[؀-ۿ]/.test(c.message.ar) && /؟$/.test(c.message.ar), `HC3 B, ${c.id}: a question in English and Arabic: ${JSON.stringify(c.message)}`);
    }
    const dup = conf.find((c) => c.id === 'duplicateAggregate') || {}, tf = conf.find((c) => c.id === 'totalFilter') || {}, wc = conf.find((c) => c.id === 'wrongColumn') || {};
    check(dup.evidence === 'SUM(Sales[Qty]) + SUM(Sales[Qty])' && tf.evidence === 'Sales[Category] <> "Test"' && wc.evidence === 'SUM ( Sales[Cases] )', `HC3 B, evidence pieces: ${JSON.stringify([dup.evidence, tf.evidence, wc.evidence])}`);
    // never a finding and never in the score: the same model without the measures that raise questions scores the same
    const quiet = E.analyze(m(['Sales Excl Test', 'Total A', 'Units Mixed', 'Total Cases', 'Previous Day Sales', 'Latest Order']), null);
    check(!r.findings.some((f) => conf.some((c) => c.id === f.id)) && ['overall', 'perf', 'maint', 'bp'].every((k) => r.score[k] === E.scoreFrom(r.findings)[k]), 'HC3 B, a question is counted as a finding or in the score');
    check(JSON.stringify(r.findings.filter((f) => !/^(UNUSED|DUP_MEASURE|NO_DESC|NO_FOLDERS)/.test(f.id)).map((f) => f.id)) === JSON.stringify(quiet.findings.filter((f) => !/^(UNUSED|DUP_MEASURE|NO_DESC|NO_FOLDERS)/.test(f.id)).map((f) => f.id)),
      `HC3 B, the questions changed the findings: ${r.findings.map((f) => f.id)} vs ${quiet.findings.map((f) => f.id)}`);
    // a clean Microsoft sample raises no question
    const covid = E.analyze(JSON.parse(readPbitModel(fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/microsoft/COVID-19 US Tracking Sample.pbit')))), null);
    check(Array.isArray(covid.confirm) && covid.confirm.length === 0, `HC3 B, questions on Microsoft's COVID-19 sample: ${JSON.stringify(covid.confirm)}`);
  }

  // ---- B-143 (the owner's rc.21 test): a date table or a fact table that no relationship touches is a "Please
  //      confirm" question, never a finding; tables meant to stand alone are never asked about ----
  {
    // the bridge project (Calendar, Customer and Sales, no relationship): Calendar (read only by SAMEPERIODLASTYEAR, which
    // filters nothing through it) and Sales (its CustomerKey is Customer's key); Customer, a dimension, is not asked about
    const T = load('tmdl-model.js'), dir = path.join(ROOT, 'scripts/tests/fixtures/bridge-project/Sales.SemanticModel');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    const bridge = E.analyze(T.fromFiles(walk(dir).filter((f) => /\.tmdl$/.test(f)).map((f) => ({ path: path.relative(dir, f).split(path.sep).join('/'), text: fs.readFileSync(f, 'utf8') }))), null);
    const q = (r) => (r.confirm || []).filter((c) => c.id === 'unrelatedTable');
    check(JSON.stringify(q(bridge).map((c) => c.obj + ' ' + c.table.looksLike).sort()) === '["Calendar date","Sales fact"]' && q(bridge).find((c) => c.obj === 'Sales').table.otherTable === 'Customer',
      `B-143, the bridge project: ${JSON.stringify(q(bridge))}`);
    for (const c of q(bridge)) check(/\?$/.test(c.message.en) && /[؀-ۿ]/.test(c.message.ar) && /؟$/.test(c.message.ar) && c.evidence === '', `B-143, ${c.obj}: a question in English and Arabic, no DAX: ${JSON.stringify(c)}`);
    // never a finding and never in the score: the same model with the relationships scores the same, without the questions
    const col = (n, ty, x) => Object.assign({ name: n, dataType: ty || 'int64', sourceColumn: n }, x || {});
    const base = (rels, extra) => ({ model: { tables: [
      { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Year')], partitions: mpart('Calendar') },
      { name: 'Customer', columns: [col('CustomerKey'), col('City', 'string')], partitions: mpart('Customer') },
      { name: 'Sales', columns: [col('CustomerKey'), col('OrderDate', 'dateTime'), col('Amount', 'decimal')], partitions: mpart('Sales'),
        measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '#,0' }] }].concat(extra || []), relationships: rels } });
    const linked = [{ name: 'c', fromTable: 'Sales', fromColumn: 'CustomerKey', toTable: 'Customer', toColumn: 'CustomerKey' }, { name: 'd', fromTable: 'Sales', fromColumn: 'OrderDate', toTable: 'Calendar', toColumn: 'Date' }];
    const loose = E.analyze(base([]), null), tied = E.analyze(base(linked), null);
    check(JSON.stringify(q(loose).map((c) => c.obj).sort()) === '["Calendar","Sales"]' && q(tied).length === 0, `B-143, unrelated vs related: ${JSON.stringify([q(loose).map((c) => c.obj), q(tied).map((c) => c.obj)])}`);
    check(!loose.findings.some((f) => f.id === 'unrelatedTable') && ['overall', 'perf', 'maint', 'bp'].every((k) => loose.score[k] === E.scoreFrom(loose.findings)[k]) && !E.RULES.unrelatedTable,
      'B-143: the question is counted as a finding, in the score, or as a rule');
    // tables meant to stand alone, beside a related model: a measure table, a field parameter, a what-if parameter, a
    // calculation group, a hidden table, a one-column list, a disconnected date slicer read by MAX, a second log that
    // shares an operation id with a fact, and a fact whose key is linked in DAX (TREATAS): no question
    const standAlone = [
      { name: '_Measures', columns: [col('Column1', 'string', { isHidden: true })], measures: [{ name: 'Avg', expression: 'AVERAGE(Sales[Amount])', formatString: '#,0' }], partitions: mpart('_Measures') },
      { name: 'Metric', columns: [col('Metric', 'string', { relatedColumnDetails: { groupByColumns: [{ groupingColumn: 'Metric Fields' }] } }), col('Metric Fields', 'string', { isHidden: true }), col('Metric Order')],
        partitions: [{ name: 'p', source: { type: 'calculated', expression: '{ ("Total", NAMEOF([Total]), 0) }' } }] },
      { name: 'Discount', columns: [col('Discount', 'decimal'), col('Step')], measures: [{ name: 'Discount Value', expression: 'SELECTEDVALUE(Discount[Discount], 0)', formatString: '0%' }],
        partitions: [{ name: 'p', source: { type: 'calculated', expression: 'GENERATESERIES(0, 0.5, 0.05)' } }] },
      { name: 'Time Calc', calculationGroup: { calculationItems: [{ name: 'YTD', expression: 'TOTALYTD(SELECTEDMEASURE(), Calendar[Date])' }] }, columns: [col('Name', 'string'), col('Ordinal')], partitions: [{ name: 'p', source: { type: 'calculationGroup' } }] },
      { name: 'Staging', isHidden: true, columns: [col('CustomerKey'), col('Amount', 'decimal'), col('Note', 'string')], partitions: mpart('Staging') },
      { name: 'Region List', columns: [col('Region', 'string')], partitions: mpart('Region List') },
      { name: 'Date Compare', columns: [col('Date', 'dateTime'), col('Year')], partitions: mpart('Date Compare'),
        measures: [{ name: 'Sales To Date', expression: 'CALCULATE([Total], FILTER(ALL(Sales[OrderDate]), Sales[OrderDate] <= MAX(\'Date Compare\'[Date])))', formatString: '#,0' }] },
      { name: 'Errors', columns: [col('OperationId'), col('Message', 'string'), col('Code', 'string')], partitions: mpart('Errors') },
      { name: 'Commits', columns: [col('OperationId'), col('Duration', 'double'), col('Rows')], partitions: mpart('Commits') },
      { name: 'Budget', columns: [col('CustomerKey'), col('Target', 'decimal'), col('Year')], partitions: mpart('Budget'),
        measures: [{ name: 'Budget', expression: 'CALCULATE(SUM(Budget[Target]), TREATAS(VALUES(Customer[CustomerKey]), Budget[CustomerKey]))', formatString: '#,0' }] }];
    const quiet = E.analyze(base(linked, standAlone), null);
    check(q(quiet).length === 0, `B-143, tables meant to stand alone were asked about: ${JSON.stringify(q(quiet).map((c) => c.obj))}`);
    // red before green: the same fact without its TREATAS, and the same calendar unread by DAX, are asked about
    const shown = E.analyze(base(linked, [{ name: 'Budget', columns: [col('CustomerKey'), col('Target', 'decimal'), col('Year')], partitions: mpart('Budget') },
      { name: 'Date Compare', columns: [col('Date', 'dateTime'), col('Year')], partitions: mpart('Date Compare') }]), null);
    check(JSON.stringify(q(shown).map((c) => c.obj).sort()) === '["Budget","Date Compare"]', `B-143, a fact and a calendar nothing links: ${JSON.stringify(q(shown).map((c) => c.obj))}`);
    // one table only: nothing to relate it to
    check(q(E.analyze({ model: { tables: [{ name: 'Sales', columns: [col('CustomerKey'), col('Amount', 'decimal'), col('OrderDate', 'dateTime')], partitions: mpart('Sales') }] } }, null)).length === 0, 'B-143: a one-table model was asked about');
  }

  // ---- B-147 (0.3): a format that may not show what the measure means is a "Please confirm" question, never a finding,
  //      never in the score: a ratio or multiple shown as a percentage, a value multiplied by 100 and then formatted as a
  //      percentage again, a value divided by 1,000 or 1,000,000 shown as a plain number ----
  {
    const col = (n, ty) => ({ name: n, dataType: ty || 'decimal', sourceColumn: n });
    const ms = (name, expression, formatString) => ({ name, expression, formatString });
    const asked = { // name: [expression, format, the question's id]
      'Current Ratio': ['DIVIDE(SUM(BS[Current Assets]), SUM(BS[Current Liabilities]))', '0.0%', 'ratioAsPercent'],
      'Asset Turnover': ['DIVIDE(SUM(Sales[Amount]), SUM(BS[Total Assets]))', '0%', 'ratioAsPercent'],
      'Debt to Equity': ['DIVIDE(SUM(BS[Debt]), SUM(BS[Equity]))', '0.00%', 'ratioAsPercent'],
      'Margin Pct': ['DIVIDE(SUM(Sales[Profit]), SUM(Sales[Amount])) * 100', '0.0%', 'percentTwice'],
      'Compete Share': ['INT(DIVIDE(SUM(Sales[Units]), SUM(Sales[Market Units])) * 100)', '0%;-0%;0%', 'percentTwice'],
      'Revenue': ['DIVIDE(SUM(Sales[Amount]), 1000)', '#,0.0', 'thousandsPlain'],
      'Total Cost': ['SUM(Sales[Cost]) / 1000000', '#,0', 'thousandsPlain']
    };
    const quietOnes = { // the same shapes that mean what they show: no question
      'Gross Margin Ratio': ['DIVIDE(SUM(Sales[Profit]), SUM(Sales[Amount]))', '0.0%'],
      'Employee Turnover': ['DIVIDE(SUM(HR[Leavers]), SUM(HR[Headcount]))', '0.0%'],
      'Quick Ratio': ['DIVIDE(SUM(BS[Current Assets]), SUM(BS[Current Liabilities]))', '0.00"x"'],
      'Margin Points': ['DIVIDE(SUM(Sales[Profit]), SUM(Sales[Amount])) * 100', '0.0'],
      'Margin Literal': ['DIVIDE(SUM(Sales[Profit]), SUM(Sales[Amount])) * 100', '0.0"%"'],
      'Margin Escaped': ['DIVIDE(SUM(Sales[Profit]), SUM(Sales[Amount])) * 100', '0.0\\%'],
      'Revenue K': ['DIVIDE(SUM(Sales[Amount]), 1000)', '#,0'],
      'Revenue (thousands)': ['DIVIDE(SUM(Sales[Amount]), 1000)', '#,0'],
      'Revenue Shown': ['DIVIDE(SUM(Sales[Amount]), 1000)', '#,0.0"K"'],
      'Duration (s)': ['DIVIDE(SUM(Log[DurationMs]), 1000)', '0.0'],
      'Query Seconds': ['SUM(Log[DurationMs]) / 1000', '#,0.0'],
      'Data Size': ['DIVIDE(SUM(Log[Bytes]), 1024)', '#,0'],
      'Sales Amount': ['SUM(Sales[Amount])', '#,0']
    };
    const all = Object.assign({}, asked, quietOnes);
    const model = (names) => ({ model: { tables: [
      { name: 'Sales', columns: [col('Amount'), col('Profit'), col('Cost'), col('Units'), col('Market Units')], partitions: mpart('Sales'), measures: names.map((n) => ms(n, all[n][0], all[n][1])) },
      { name: 'BS', columns: [col('Current Assets'), col('Current Liabilities'), col('Total Assets'), col('Debt'), col('Equity')], partitions: mpart('BS') },
      { name: 'HR', columns: [col('Leavers'), col('Headcount')], partitions: mpart('HR') },
      { name: 'Log', columns: [col('DurationMs'), col('Bytes')], partitions: mpart('Log') }] } });
    const r = E.analyze(model(Object.keys(all)), null);
    const fmtIds = ['ratioAsPercent', 'percentTwice', 'thousandsPlain'], conf = (r.confirm || []).filter((c) => fmtIds.includes(c.id));
    const got = conf.map((c) => c.id + ' ' + c.obj).sort(), want = Object.entries(asked).map(([n, v]) => v[2] + ' [' + n + ']').sort();
    check(JSON.stringify(got) === JSON.stringify(want), `B-147, the format questions: ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    for (const c of conf) {
      check(/\?$/.test(c.message.en) && /[؀-ۿ]/.test(c.message.ar) && /؟$/.test(c.message.ar) && c.format === all[c.obj.slice(1, -1)][1], `B-147, ${c.id} on ${c.obj}: a question in English and Arabic, with the format: ${JSON.stringify(c)}`);
      check(c.evidence === '' || all[c.obj.slice(1, -1)][0].includes(c.evidence), `B-147, ${c.id} on ${c.obj}: the evidence "${c.evidence}" is not an exact piece of its DAX`);
    }
    const p2 = conf.find((c) => c.obj === '[Margin Pct]') || {}, t2 = conf.find((c) => c.obj === '[Total Cost]') || {};
    check(p2.evidence === '* 100' && t2.evidence === '/ 1000000', `B-147, evidence pieces: ${JSON.stringify([p2.evidence, t2.evidence])}`);
    // never a finding, never a rule, never in the score: the same model without the asked measures scores the same
    const quiet = E.analyze(model(Object.keys(quietOnes)), null);
    check(!fmtIds.some((id) => E.RULES[id] || r.findings.some((f) => f.id === id)) && ['overall', 'perf', 'maint', 'bp'].every((k) => r.score[k] === E.scoreFrom(r.findings)[k])
      && (quiet.confirm || []).filter((c) => fmtIds.includes(c.id)).length === 0, `B-147: a format question is a rule, a finding or in the score, or a quiet one was asked: ${JSON.stringify((quiet.confirm || []).filter((c) => fmtIds.includes(c.id)))}`);
  }

  {
    // the page shows each finding's source (English and Arabic), and the CSV and the HTML and Markdown documentation carry it
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900], downloads: true });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      await v.pg.click('#mhSample');
      await v.pg.waitForSelector('.mh-issue', { timeout: 20000 });
      const src = await v.pg.evaluate(() => Object.fromEntries([...document.querySelectorAll('.mh-issue')].map((d) => { const s = d.querySelector('.mh-src'); const a = s && s.querySelector('a');
        return [d.dataset.rule, s ? { text: s.textContent.replace(/\s+/g, ' ').trim(), href: a ? a.href : null, rel: a ? a.rel : null, target: a ? a.target : null } : null]; })));
      const want = lang === 'en' ? { ms: 'Microsoft guidance', bpa: 'Microsoft Best Practice Analyzer', own: 'DataArcus rule' } : { ms: 'إرشادات Microsoft', bpa: 'Best Practice Analyzer', own: 'قاعدة من DataArcus' };
      const b = src.BIDI, d = src.DOUBLE, n = src.NAMING;
      check(b && b.text.includes(want.ms) && /^https:\/\/learn\.microsoft\.com\//.test(b.href) && /noopener/.test(b.rel) && b.target === '_blank', `source on the page (${lang}), BIDI: ${JSON.stringify(b)}`);
      check(d && d.text.includes(want.bpa) && d.text.includes('AVOID_FLOATING_POINT_DATA_TYPES') && /BestPracticeRules$/.test(d.href), `source on the page (${lang}), DOUBLE: ${JSON.stringify(d)}`);
      check(n && n.text.includes(want.own) && !n.href && n.text.length > want.own.length + 10, `source on the page (${lang}), NAMING: ${JSON.stringify(n)}`);
      check(Object.values(src).every(Boolean), `source on the page (${lang}): findings without one: ${Object.keys(src).filter((k) => !src[k]).join(', ')}`);
      // 1b+ class 10: the sample's [New Customers] compares with the calendar, so its item gives the variable advice in the page's language
      const nc = await v.pg.evaluate(() => { const li = [...document.querySelectorAll('[data-rule="FILTER_TABLE"] .mh-items li')].find((x) => x.querySelector('code').textContent === '[New Customers]'); return li ? li.textContent : ''; });
      check(/VAR d = MIN/.test(nc) && (lang === 'en' ? /variable/.test(nc) : /متغير/.test(nc)), `FILTER_TABLE's variable advice on the page (${lang}): "${nc}"`);
      if (lang === 'en') {
        const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#mhCsv')]);
        const csv = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '').split('\r\n');
        check(csv[0] === '"Severity","Category","Rule","Object","Detail","Source"' && csv.some((l) => l.includes('Relationships that filter in both directions') && l.endsWith('"https://learn.microsoft.com/power-bi/guidance/relationships-bidirectional-filtering"'))
          && csv.some((l) => l.includes('Mixed table naming styles') && l.endsWith('"DataArcus rule"')), `findings CSV: no Source column: ${csv.slice(0, 2).join(' / ')}`);
        await v.pg.click('[data-tab=docs]');
        const [dh] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('[data-doc="html"]')]);
        const html = fs.readFileSync(await dh.path(), 'utf8');
        check(/<th>Source<\/th>/.test(html) && html.includes('href="https://learn.microsoft.com/power-bi/guidance/relationships-bidirectional-filtering"') && html.includes('BPA AVOID_FLOATING_POINT_DATA_TYPES'), 'HTML documentation: no source per finding');
        const [dm] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('[data-doc="md"]')]);
        const md = fs.readFileSync(await dm.path(), 'utf8');
        check(md.includes('| Severity | Finding | Count | How to fix | Source |') && md.includes('[Microsoft guidance](https://learn.microsoft.com/power-bi/guidance/relationships-bidirectional-filtering)') && md.includes('DataArcus rule'), 'Markdown documentation: no source per finding');
      }
      if (v.errs.length) problems.push(`source on the page (${lang}): ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  {
    // Published results follow the tool (16 Oct 2026: Health Check 2 moved Microsoft's COVID-19 sample from 84 to 85
    // and every page kept saying 84). The page checks Microsoft's own file, as a visitor would; every place that
    // publishes its result must say the same score, and the article's counts must match the findings
    const file = fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/microsoft/COVID-19 US Tracking Sample.pbit'));
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=en`, { waitUntil: 'networkidle' });
    await v.pg.setInputFiles('#mhFile', { name: 'COVID-19 US Tracking Sample.pbit', mimeType: 'application/octet-stream', buffer: file });
    await v.pg.waitForSelector('.mh-scorecard .mh-ring b', { timeout: 30000 });
    const got = await v.pg.evaluate(() => {
      const n = (rule) => { const c = document.querySelector(`.mh-issue[data-rule="${rule}"]`); return c ? +((c.querySelector('.mh-count') || {}).textContent || '0').replace(/\D/g, '') : 0; };
      return { score: +document.querySelector('.mh-scorecard .mh-ring b').textContent, calc: n('CALC_COLS'), unused: n('UNUSED_COL') };
    });
    await v.ctx.close();
    // every form a score is published in: "Scored 85", "scored <strong>85 out of 100</strong>", "85 من 100", the
    // share image's ring(85, ...): any casing (16 Oct: the intro's lowercase "scored 84" slipped past "Scored")
    const RE = /scored (?:<strong>)?(\d+)|(\d+) out of 100|(\d+) من 100|ring\((\d+), /gi;
    const SCORE = ['articles/article-power-bi-model-health-check.html', 'assets/js/translations/article-power-bi-model-health-check.js',
      'blog.html', 'assets/js/translations/blog.js', 'assets/js/translations/homepage.js', 'go/health/index.html', 'go/health-page/index.html',
      'scripts/make-share-images.mjs'].map((f) => [f, RE]);
    const said = [];
    for (const [f, re] of SCORE) {
      const all = [...fs.readFileSync(path.join(ROOT, f), 'utf8').matchAll(re)].map((m) => +(m[1] || m[2] || m[3] || m[4]));
      check(all.length > 0, `published score: ${f} no longer states the sample's score (update this test's list with the page)`);
      for (const x of all) if (x !== got.score) said.push(`${f} says ${x}`);
    }
    check(got.score > 0 && !said.length, `published score: the Health Check gives Microsoft's COVID-19 sample ${got.score}, but ${said.slice(0, 4).join('; ')}`);
    const art = fs.readFileSync(path.join(ROOT, 'articles/article-power-bi-model-health-check.html'), 'utf8'), img = fs.readFileSync(path.join(ROOT, 'scripts/make-share-images.mjs'), 'utf8');
    check(art.includes(`<strong>${got.calc} calculated columns on imported tables</strong>`) && img.includes(`['${got.calc}', 'calculated columns on imported tables']`), `published counts: the tool finds ${got.calc} calculated columns on imported tables; the article or the share image says otherwise`);
    check(art.includes(`<strong>${got.unused} of 16 columns`) && img.includes(`(${got.unused} of 16)`), `published counts: the tool finds ${got.unused} unused columns; the article or the share image says otherwise`);
  }

  {
    // AUD-037 (night audit 15 Oct): at phone width nothing inside a finding card runs past the card, in English and
    // Arabic. A long word with no break (the BPA rule id INACTIVE_RELATIONSHIPS_THAT_ARE_NEVER_ACTIVATED, a long table or
    // measure name) wraps inside the card: the rule is on the card (.mh-issue), so every line in it is covered
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [390, 844] });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      await v.pg.click('#mhSample');
      await v.pg.waitForSelector('.mh-issue', { timeout: 20000 });
      await v.pg.$$eval('.mh-issue', (ds) => ds.forEach((d) => { d.open = true; }));
      const out = await v.pg.evaluate(() => {
        const bad = [];
        for (const card of document.querySelectorAll('.mh-issue')) {
          const c = card.getBoundingClientRect();
          for (const el of card.querySelectorAll('p, li, b, a, bdi, span, code, small')) {
            if (el.closest('.mh-tscroll, pre')) continue;   // tables and code scroll inside their own box
            const r = el.getBoundingClientRect();
            if (r.width && (r.right > c.right + 1 || r.left < c.left - 1)) bad.push(`${(card.dataset.rule || '?')}: ${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}" ${Math.round(r.left)}-${Math.round(r.right)} in ${Math.round(c.left)}-${Math.round(c.right)}`);
          }
        }
        return { bad, cards: document.querySelectorAll('.mh-issue').length, page: document.documentElement.scrollWidth };
      });
      check(out.cards > 10 && !out.bad.length && out.page <= 390, `AUD-037 ${lang} at 390 px: ${out.cards} cards, page ${out.page} px wide, past their card: ${out.bad.slice(0, 4).join('; ')}`);
      if (v.errs.length) problems.push(`AUD-037 ${lang}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  {
    // HC3 part B on the page: "Please confirm" below the findings, in English and Arabic (right to left), each question
    // with its object and its exact DAX, dismissible for the session, no horizontal scroll at phone width; the CSV and
    // the documentation list them as questions, not findings
    const c = (n, ty) => ({ name: n, dataType: ty || 'int64', sourceColumn: n });
    const qModel = { name: 'q', compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
      { name: 'Sales', columns: [c('CustomerKey'), c('ProductKey'), c('Amount', 'decimal'), c('Qty'), c('Cases'), c('Category', 'string')], partitions: mpart('Sales'),
        measures: [{ name: 'Units Doubled', expression: 'SUM(Sales[Qty]) + SUM(Sales[Qty])', formatString: '#,0' },
          { name: 'Total Sales Excluding Category Placeholder With A Very Long Name', expression: 'CALCULATE(SUM(Sales[Amount]), Sales[Category] <> "Internal transfers between our own regional warehouses")', formatString: '#,0' }] },
      { name: 'Product', columns: [c('ProductKey'), c('Color', 'string')], partitions: mpart('Product') }],
    relationships: [{ name: 'p', fromTable: 'Sales', fromColumn: 'CustomerKey', toTable: 'Product', toColumn: 'ProductKey' }] } };
    const file = pbit({ DataModelSchema: JSON.stringify(qModel), Version: '1.28' });
    for (const [lang, w] of [['en', 1440], ['ar', 1440], ['en', 390], ['ar', 390]]) {
      const v = await visitor(browser, { viewport: [w, 900], downloads: true });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      await v.pg.setInputFiles('#mhFile', { name: 'questions.pbit', mimeType: 'application/octet-stream', buffer: file });
      await v.pg.waitForSelector('.mh-scorecard .mh-ring b', { timeout: 30000 });
      const got = await v.pg.evaluate(() => {
        const sec = document.querySelector('#mhConfirm'), last = [...document.querySelectorAll('#mhTab > *')].pop();
        return { title: sec ? sec.querySelector('h3').textContent : '', note: sec ? sec.querySelector('.mh-note').textContent : '', afterFindings: last === sec,
          qs: [...document.querySelectorAll('.mh-q')].map((q) => ({ obj: q.querySelector('code').textContent, text: q.querySelector('p').textContent, dax: (q.querySelector('pre') || {}).textContent || '', bdi: q.querySelectorAll('p bdi').length })),
          page: document.documentElement.scrollWidth, dir: document.documentElement.dir,
          over: [...document.querySelectorAll('.mh-q, .mh-q *')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length };
      });
      const tag = `HC3 page (${lang}, ${w} px)`;
      check(got.title.includes(lang === 'en' ? 'Please confirm' : 'يرجى التأكيد') && got.afterFindings && (lang === 'en' ? /don't affect the score/.test(got.note) && /asks about some common calculation mistakes/.test(got.note) : /لا تؤثر في التقييم/.test(got.note)),
        `${tag}: the section and its note: ${JSON.stringify([got.title, got.note, got.afterFindings])}`);
      check(got.qs.length === 3 && got.qs.some((q) => q.obj === '[Units Doubled]' && q.dax === 'SUM(Sales[Qty]) + SUM(Sales[Qty])' && (lang === 'en' ? /intentional\?$/.test(q.text) : /؟$/.test(q.text)))
        && got.qs.some((q) => /CustomerKey/.test(q.obj) && !q.dax && (lang === 'en' || q.bdi > 0)), `${tag}: the questions: ${JSON.stringify(got.qs)}`);
      check(got.page <= w && !got.over && (lang === 'ar' ? got.dir === 'rtl' : true), `${tag}: ${got.page} px wide, ${got.over} element(s) past the screen, dir ${got.dir}`);
      if (lang === 'en' && w === 1440) {
        // dismissed for the session: gone after a reload of the result, back in a new session
        await v.pg.click('.mh-q[data-q^="duplicateAggregate"] [data-qdismiss]');
        const left = await v.pg.$$eval('.mh-q', (qs) => qs.length);
        await v.pg.click('[data-tab=fix]'); await v.pg.click('[data-tab=issues]');
        const after = await v.pg.$$eval('.mh-q', (qs) => qs.map((q) => q.dataset.q));
        check(left === 2 && after.length === 2 && !after.some((k) => k.startsWith('duplicateAggregate')), `${tag}: dismiss: ${left} left, then ${JSON.stringify(after)}`);
        const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#mhCsv')]);
        const csv = fs.readFileSync(await dl.path(), 'utf8');
        check(csv.split('\r\n').filter((l) => l.startsWith('"question","Please confirm"')).length === 3 && csv.includes('"SUM(Sales[Qty]) + SUM(Sales[Qty])"'), 'HC3 CSV: the questions as "question" rows');
        await v.pg.click('[data-tab=docs]');
        const [dh] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('[data-doc="html"]')]);
        const html = fs.readFileSync(await dh.path(), 'utf8');
        const [dm] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('[data-doc="md"]')]);
        const md = fs.readFileSync(await dm.path(), 'utf8');
        check(/<h2>Please confirm \(questions, not findings\)<\/h2>/.test(html) && (html.match(/<td>question<\/td>/g) || []).length === 3, 'HC3 HTML documentation: the questions section');
        check(md.includes('## Please confirm (questions, not findings)') && (md.match(/^\| question \|/gm) || []).length === 3, 'HC3 Markdown documentation: the questions section');
      }
      if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  {
    // B-148 (0.3): an answer to a "Please confirm" question is kept in this browser only (localStorage, per model), reused
    // while the measure is unchanged, asked again when its DAX changes, and forgotten with "Forget my answers"; no request
    // is made while answering or forgetting, and nothing of the DAX is stored
    const c = (n, ty) => ({ name: n, dataType: ty || 'int64', sourceColumn: n });
    const aModel = (expr) => ({ name: 'a', compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
      { name: 'Sales', columns: [c('Qty'), c('Amount', 'decimal')], partitions: mpart('Sales'),
        measures: [{ name: 'Units Doubled', expression: expr, formatString: '#,0' }, { name: 'Amount Doubled', expression: 'SUM(Sales[Amount]) + SUM(Sales[Amount])', formatString: '#,0' }] }] } });
    const f1 = pbit({ DataModelSchema: JSON.stringify(aModel('SUM(Sales[Qty]) + SUM(Sales[Qty])')), Version: '1.28' });
    const f2 = pbit({ DataModelSchema: JSON.stringify(aModel('SUM(Sales[Qty]) + SUM(Sales[Qty]) + 0')), Version: '1.28' });
    for (const [lang, w] of [['en', 1440], ['ar', 390]]) {
      const v = await visitor(browser, { viewport: [w, 900] });
      const tag = `B-148 page (${lang}, ${w} px)`;
      const open = async (file) => { await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' }); await v.pg.setInputFiles('#mhFile', { name: 'answers.pbit', mimeType: 'application/octet-stream', buffer: file }); await v.pg.waitForSelector('.mh-scorecard .mh-ring b', { timeout: 30000 }); };
      const qs = () => v.pg.$$eval('.mh-q', (x) => x.map((q) => q.querySelector('code').textContent));
      await open(f1);
      const requests = []; const onReq = (rq) => requests.push(rq.url()); v.pg.on('request', onReq);
      const labels = await v.pg.$$eval('.mh-q[data-q*="Units Doubled"] [data-qanswer]', (b) => b.map((x) => x.dataset.qanswer + ':' + x.textContent.trim()));
      await v.pg.click('.mh-q[data-q*="Units Doubled"] [data-qanswer="intended"]');
      const after = await qs(), answered = await v.pg.$$eval('#mhAnswered li', (x) => x.map((l) => l.textContent));
      check(labels.length === 2 && (lang === 'en' ? labels.includes('intended:Yes, intended') && labels.includes('mistake:No, a mistake') : labels.includes('intended:نعم، مقصود') && labels.includes('mistake:لا، خطأ'))
        && !after.includes('[Units Doubled]') && after.includes('[Amount Doubled]') && answered.length === 1 && answered[0].includes('[Units Doubled]'), `${tag}: answered: ${JSON.stringify({ labels, after, answered })}`);
      const stored = await v.pg.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dataarcus-mh-answers:')).map((k) => [k, localStorage.getItem(k)]));
      check(stored.length === 1 && /^dataarcus-mh-answers:[0-9a-f]{64}$/.test(stored[0][0]) && !/SUM|Qty|Sales|Units Doubled|duplicateAggregate/.test(stored[0][1]) && JSON.parse(stored[0][1]).length === 1 && JSON.parse(stored[0][1])[0].by === 'user',
        `${tag}: stored per model, hashes and the answer only: ${JSON.stringify(stored)}`);
      v.pg.off('request', onReq);
      // the same model again (a new page): not asked again; the DAX changed: asked again, the old answer kept and marked
      // as no longer applying (R5, F12: nothing is deleted without the click on "Forget my answers")
      await open(f1);
      const again = await qs();
      await open(f2);
      const changed = await qs(), kept = await v.pg.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dataarcus-mh-answers:')).map((k) => JSON.parse(localStorage.getItem(k)).length));
      const staleNote = await v.pg.$eval('#mhStale', (x) => x.textContent).catch(() => '');
      check(!again.includes('[Units Doubled]') && again.includes('[Amount Doubled]') && changed.includes('[Units Doubled]') && JSON.stringify(kept) === '[1]'
        && (lang === 'en' ? /1 earlier answer no longer applies.*Forget my answers/.test(staleNote) : /لم تعد تنطبق.*انسَ إجاباتي/.test(staleNote)), `${tag}: reused, then asked again after the DAX changed, the old answer kept and marked: ${JSON.stringify({ again, changed, kept, staleNote })}`);
      // the DAX back as it was: the kept answer applies again
      await open(f1);
      const restored = await qs();
      check(!restored.includes('[Units Doubled]'), `${tag}: the DAX back as it was: the kept answer applies again: ${JSON.stringify(restored)}`);
      // forget: every answer this browser holds is gone, the question is back
      await open(f2);
      v.pg.on('request', onReq);
      await v.pg.click('.mh-q[data-q*="Units Doubled"] [data-qanswer="mistake"]');
      const mistake = await v.pg.$$eval('#mhAnswered li', (x) => x.map((l) => l.textContent));
      const noOverflow = await v.pg.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
      await v.pg.click('#mhForget');
      const back = await qs(), left = await v.pg.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('dataarcus-mh-answers:')).length);
      v.pg.off('request', onReq);
      check(mistake.length === 1 && (lang === 'en' ? /mistake/.test(mistake[0]) : /خطأ/.test(mistake[0])) && back.includes('[Units Doubled]') && left === 0 && noOverflow, `${tag}: a mistake answer, then forget: ${JSON.stringify({ mistake, back, left, noOverflow })}`);
      check(requests.length === 0, `${tag}: requests while answering or forgetting: ${JSON.stringify(requests.slice(0, 5))}`);
      if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
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
    // the check time: a check under 0.1 s reads "under 0.1 s", never "0.0 s" (as if nothing ran). The worker's clock
    // is stopped, so the check takes 0 ms on any machine
    for (const lang of ['en', 'ar']) {
      const v = await visitor(browser, { viewport: [1440, 900] });
      await v.ctx.route(/model-health-worker\.min\.js/, async (rt) => { const r = await rt.fetch(); await rt.fulfill({ response: r, body: 'Date.now = () => 1e12;\n' + await r.text() }); });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      await v.pg.click('#mhSample');
      await v.pg.waitForSelector('.mh-filebar', { timeout: 20000 });
      const bar = await v.pg.$eval('.mh-filebar span', (s) => s.textContent.trim());
      const want = lang === 'en' ? 'checked in under 0.1 s' : 'تم الفحص في أقل من 0.1 ث';
      check(bar.endsWith(want) && !/0\.0/.test(bar), `check time (${lang}): "${bar}", expected it to end with "${want}"`);
      if (v.errs.length) problems.push(`check time (${lang}): ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
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

  // I-1 (0.3.1 wave 3, the owner's "Yes" 22 Oct): "Download score card" beside the documentation exports: one PNG,
  // 1200 x 630, drawn in the browser. It holds the score, the size line, the top 5 findings by rule name and object name
  // only (never DAX, a description, M or any other model text), "Hide object names" leaves the rule names only, and the
  // footer is the tool's address; English and Arabic (right to left, names isolated); one health_card_download event per
  // download; no request leaves the page. The model is made up (a garden centre) with planted DAX, descriptions and M.
  {
    const { PNG } = await import('pngjs');
    const PLANT = ['ZQX_PLANTED_DAX_STRING', 'ZQX planted description', 'ZQX_PLANTED_M', 'ZQX table note'];
    const mq = (n) => [{ name: n, source: { type: 'm', expression: 'let Source = Csv.Document(File.Contents("C:\\\\ZQX_PLANTED_M.csv")) in Source' } }];
    const c = (n, ty, extra) => Object.assign({ name: n, dataType: ty || 'int64', sourceColumn: n }, extra || {});
    const garden = { name: 'garden', compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
      { name: 'Orders', description: 'ZQX table note', columns: [c('PlantKey'), c('OrderDate', 'dateTime'), c('Qty'), c('Price', 'double'), c('Note', 'string', { description: 'ZQX planted description on a column' })], partitions: mq('Orders'),
        measures: [{ name: 'Total Qty', expression: 'SUM(Orders[Qty])', formatString: '#,0' },
          { name: 'Red Qty', expression: 'CALCULATE(SUM(Orders[Qty]), FILTER(Plants, Plants[Colour] = "ZQX_PLANTED_DAX_STRING"))', description: 'ZQX planted description on a measure' },
          { name: 'Spare Price', expression: 'SUM(Orders[Price]) + LEN("ZQX_PLANTED_DAX_STRING")' }] },
      { name: 'Plants', columns: [c('PlantKey'), c('Colour', 'string'), c('Family', 'string')], partitions: mq('Plants') },
      { name: 'المشاتل', columns: [c('Nursery', 'string'), c('Region', 'string')], partitions: mq('Nurseries') }],
    relationships: [{ name: 'r1', fromTable: 'Orders', fromColumn: 'PlantKey', toTable: 'Plants', toColumn: 'PlantKey', crossFilteringBehavior: 'bothDirections' }] } };
    const layout = { sections: [{ name: 's1', displayName: 'Page 1', filters: '[]', visualContainers: [{ config: JSON.stringify({ name: 'v1', singleVisual: { visualType: 'tableEx', prototypeQuery: { Version: 2,
      From: [{ Name: 'o', Entity: 'Orders', Type: 0 }], Select: [{ Measure: { Expression: { SourceRef: { Source: 'o' } }, Property: 'Total Qty' } }] } } }), filters: '[]' }] }], config: '{}' };
    const file = pbit({ DataModelSchema: JSON.stringify(garden), 'Report/Layout': JSON.stringify(layout), Version: '1.28' });
    for (const [lang, w] of [['en', 1440], ['ar', 1440], ['en', 390], ['ar', 390]]) {
      const tag = `I-1 score card (${lang}, ${w} px)`;
      const v = await visitor(browser, { viewport: [w, 900], downloads: true });
      const sent = [];
      v.pg.on('request', (r) => { if (!r.url().startsWith(url) && !/^(data|blob):/.test(r.url()) && !(r.method() === 'GET' && /^https:\/\/(fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net)\//.test(r.url()))) sent.push(r.method() + ' ' + r.url()); });
      await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=${lang}`, { waitUntil: 'networkidle' });
      sent.length = 0;   // from here on: reading the file, the tabs and the downloads
      await v.pg.setInputFiles('#mhFile', { name: 'garden.pbit', mimeType: 'application/octet-stream', buffer: file });
      await v.pg.waitForSelector('.mh-scorecard .mh-ring b', { timeout: 30000 });
      const issues = await v.pg.$$eval('.mh-issue', (ds) => ds.map((d) => d.dataset.rule));
      await v.pg.click('[data-tab=docs]');
      const panel = await v.pg.evaluate(() => { const b = document.getElementById('mhCard'), s = document.getElementById('mhCardHide'), p = b && b.closest('.mh-panel');
        const r = p ? p.getBoundingClientRect() : null; return { button: !!b, sw: !!s && s.getAttribute('role') === 'switch' && !s.checked, inside: r && r.left >= 0 && r.right <= document.documentElement.clientWidth + 1, page: document.documentElement.scrollWidth,
          beside: !!p && !!p.closest('.row') && !!p.closest('.row').querySelector('[data-doc="csv"]') }; });
      check(panel.button && panel.sw && panel.inside && panel.beside && panel.page <= w, `${tag}: the button and the "Hide object names" switch (off) beside the exports, on the screen: ${JSON.stringify(panel)}`);
      if (w !== 1440) { if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`); await v.ctx.close(); continue; }
      await v.pg.evaluate(() => { window.__ev = []; window.dataArcusTrack = (n, p) => window.__ev.push([n, p]); });
      const card = async () => {
        const [dl] = await Promise.all([v.pg.waitForEvent('download'), v.pg.click('#mhCard')]);
        const buf = fs.readFileSync(await dl.path());
        const png = PNG.sync.read(buf);
        const lines = await v.pg.$$eval('#mhCardText li', (ls) => ls.map((l) => l.textContent));
        const dir = await v.pg.$eval('#mhCardText', (e) => e.getAttribute('dir'));
        return { name: dl.suggestedFilename(), w: png.width, h: png.height, buf, lines, text: lines.join('\n'), dir };
      };
      const a = await card();
      const L = (en, ar) => (lang === 'en' ? en : ar);
      check(a.w === 1200 && a.h === 630 && /\.png$/.test(a.name), `${tag}: the card is a 1200 x 630 PNG: ${a.w} x ${a.h} ${a.name}`);
      const score = await v.pg.$eval('.mh-scorecard .mh-ring b', (b) => b.textContent);
      check(a.text.includes(score) && a.text.includes(L('3 tables', '3 جداول')) && a.text.includes(L('3 measures', '3 مقاييس')) && a.text.includes(L('1 visual', '1 عناصر مرئية'))
        && a.lines[a.lines.length - 1] === 'dataarcus.com/tools/power-bi-model-health-check', `${tag}: score ${score}, the size line and the footer: ${JSON.stringify(a.lines)}`);
      const finds = a.lines.filter((l) => /^\d\. /.test(l));
      check(finds.length === Math.min(5, issues.length) && finds.every((l) => (lang === 'en' ? /[A-Za-z]/ : /[\u0600-\u06FF]/).test(l)), `${tag}: the top ${Math.min(5, issues.length)} findings by rule name in the page's language: ${JSON.stringify(finds)}`);
      check(PLANT.every((p) => !a.text.includes(p) && !a.buf.includes(p)) && !/CALCULATE\(|SUM\(|FILTER\(|LEN\(|Csv\.Document/.test(a.text), `${tag}: no DAX, description or M on the card: ${JSON.stringify(a.lines)}`);
      check(/\u2068[^\u2069]+\u2069/.test(a.text) && a.dir === L('ltr', 'rtl'), `${tag}: object names isolated (FSI ... PDI), card direction ${a.dir}: ${JSON.stringify(finds)}`);
      const names = [...a.text.matchAll(/\u2068([^\u2069]+)\u2069/g)].map((m) => m[1]);
      await v.pg.click('#mhCardHide');
      const b = await card();
      const bf = b.lines.filter((l) => /^\d\. /.test(l));
      check(b.w === 1200 && b.h === 630 && bf.length === finds.length && !/[\u2068\u2069]/.test(b.text) && names.every((n) => !b.text.includes(n)), `${tag}: names hidden: rule names only: ${JSON.stringify(bf)} (names were ${JSON.stringify(names)})`);
      const ev = await v.pg.evaluate(() => window.__ev);
      check(ev.length === 2 && ev.every((e) => e[0] === 'health_card_download') && ev[0][1].names_hidden === false && ev[1][1].names_hidden === true, `${tag}: one health_card_download per download: ${JSON.stringify(ev)}`);
      check(!sent.length, `${tag}: requests left the page: ${sent.join(' | ')}`);
      if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
      await v.ctx.close();
    }
  }

  // B-149: the stats row under the score (tables, columns, measures, relationships, pages, visuals) is all Arabic on the
  // Arabic page, the sample model included (it has report pages, so the pages and visuals pills show)
  {
    const v = await visitor(browser, { viewport: [1440, 900] });
    await v.pg.goto(`${url}/tools/power-bi-model-health-check.html?lang=ar`, { waitUntil: 'networkidle' });
    await v.pg.click('#mhSample');
    await v.pg.waitForSelector('.mh-scorecard .mh-ring b', { timeout: 30000 });
    const pills = await v.pg.$$eval('.mh-pill', (ps) => ps.map((p) => [...p.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim()));
    check(pills.length === 6 && pills.every((t) => t && !/[A-Za-z]/.test(t)), `B-149: the Arabic stats row has English labels: ${JSON.stringify(pills)}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
