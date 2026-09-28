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
    measures: [{ name: 'Total', expression: 'SUM(Sales[Amount])', formatString: '#,0' }, { name: 'Unused Qty', expression: 'SUM(Sales[Qty])', formatString: '0' }],
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

  // ---- fix plan in the page ----
  for (const [name, file] of [['legacy.pbit', fs.readFileSync(path.join(ROOT, 'scripts/tests/fixtures/model-health/legacy.pbit'))],
    ['plan.pbit', pbit({ DataModelSchema: JSON.stringify(planModel()), 'Report/Layout': JSON.stringify(planLayout), Version: '1.28' })]]) {
    const v = await visitor(browser, { viewport: [1440, 900] });
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
      calc: [...document.querySelectorAll('.mh-clean .mh-tags code')].map((c) => c.textContent)
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
      check(JSON.stringify(removed) === JSON.stringify(['Sales[Note]']), `${tag}: removes ${JSON.stringify(removed)}, expected only Sales[Note]`);
      check(sorts.some((s) => s.col === 'Month Year' && s.by === 'Year Month') && sorts.some((s) => s.col === 'Month Name' && s.by === 'Month Number'), `${tag}: sorts ${JSON.stringify(sorts)}`);
      for (const k of ['Sales[Qty]', 'Sales[Code]', 'Calendar[Month Number]', 'Calendar[Year Month]', 'Old[A]']) check(plan.kept.some((x) => x.startsWith(k)), `${tag}: ${k} is not listed as kept`);
      check(plan.calc.includes('Sales[Flag]'), `${tag}: the unused calculated column Sales[Flag] is not listed`);
    }
    if (v.errs.length) problems.push(`${tag}: ${v.errs.join(' | ')}`);
    await v.ctx.close();
  }
  return { checks, problems };
}
