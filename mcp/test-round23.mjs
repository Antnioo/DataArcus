// Round 23 (the owner's go, 8 Oct 2026: "i wanna fix the word total as well"): the Arabic table's total row says
// «الإجمالي», by way 4 of the sitting of 7-8 Oct (measured in Desktop 2.158.1304, DESKTOP-TESTS.md): the name column
// first in the file at width 0 (hidden), then the numbers, and at the right a report-level text measure that gives the
// row's name on a row and «الإجمالي» on the total row; the automatic column widths left on. Written red first.
// test.mjs runs them with its own client (import { round23 }); run alone they start the server themselves:
//   node test-round23.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { tableProblems, sortProblems, rowLabelProblems } from '../scripts/tests/report-check.mjs';

export async function round23({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"Day"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, tables) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables } })); };
  const filesOf = (x, d) => { const out = {}; if (x.err) return out; const base = path.join(ROOT, d, x.j.report); const walk = (p) => fs.readdirSync(p, { withFileTypes: true }).forEach((f) => { const q = path.join(p, f.name); if (f.isDirectory()) walk(q); else out[path.relative(path.join(ROOT, d), q).split(path.sep).join('/')] = fs.readFileSync(q); }); walk(base); return out; };
  const tables = (x, d) => Object.entries(filesOf(x, d)).filter(([k]) => k.endsWith('/visual.json')).map(([, v]) => JSON.parse(String(v))).filter((v) => v.visual && v.visual.visualType === 'tableEx' && v.visual.query);
  const ext = (x, d) => { const f = x.err ? null : path.join(ROOT, d, x.j.report, 'definition', 'reportExtensions.json'); return f && fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).entities.flatMap((e) => e.measures.map((m) => Object.assign({ entity: e.name }, m))) : []; };
  const refs = (v) => v.visual.query.queryState.Values.projections.map((p) => p.queryRef);
  const width0 = (v) => ((v.visual.objects || {}).columnWidth || []).filter((e) => e.properties.value.expr.Literal.Value === '0D').map((e) => e.selector.metadata);
  const notes = (x) => JSON.stringify(x.err ? x.t : x.j.reportNotes || []);
  const short = (x) => (x.err ? x.t.slice(0, 300) : '');
  const page = (slots) => [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }].concat(slots) }];
  const tableSlot = { kind: 'table', x: 36, y: 100, w: 900, h: 400 };

  const d = 'r23';
  model(d, [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Day Name', 'string'), col('Day of Week', 'int64')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] }]);
  const mk = (name, lang, table, extra) => ask('create_report', Object.assign({ path: d, name, lang, rtl: lang === 'ar', noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table }, pages: page([tableSlot]) }, extra || {}));
  // (round 23 part 5, the review's R1: the label is blank where the row's measures are all blank; ms, the measures in the table's order)
  const LABEL = (t, c, ms) => `IF ( ${ms.map((mm) => `NOT ISBLANK ( '${t}'[${mm}] )`).join(' || ')}, IF ( ISINSCOPE ( '${t}'[${c}] ), SELECTEDVALUE ( '${t}'[${c}] ), "الإجمالي" ) )`;

  // (a hand-placed page is right to left only with rtl: true: create_report's own rule)
  // 1. An Arabic table with a total row: the name column first at width 0, the numbers, and at the right the
  //    report-level measure "Row label: Region" (its header the column's name), right-aligned; the automatic widths on
  {
    const x = await mk('R23 ar', 'ar', ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Orders]']), t = tables(x, d)[0], ms = ext(x, d);
    const ps = t ? t.visual.query.queryState.Values.projections : [], last = ps[ps.length - 1] || {}, ch = ((t || { visual: {} }).visual.objects || {}).columnHeaders;
    chk(() => t && JSON.stringify(refs(t)) === JSON.stringify(['Sales.Region', 'Sales.Orders', 'Sales.Total Sales', 'Sales.Row label: Region'])
      && JSON.stringify(width0(t)) === '["Sales.Region"]' && last.field.Measure.Expression.SourceRef.Schema === 'extension' && last.field.Measure.Expression.SourceRef.Entity === 'Sales'
      && last.displayName === 'Region' && ch[0].properties.autoSizeColumnWidth.expr.Literal.Value === 'true',
      () => `1. the Arabic table: Region first at width 0, the numbers, the row-label measure last with the column's name: ${t ? JSON.stringify(refs(t)) + ' width 0: ' + JSON.stringify(width0(t)) + ' last ' + JSON.stringify(last).slice(0, 300) : 'no table'} ${short(x)}`);
    const m = ms.find((e) => e.name === 'Row label: Region');
    chk(() => m && m.entity === 'Sales' && m.dataType === 'Text' && m.expression === LABEL('Sales', 'Region', ['Orders', 'Total Sales']), () => `1. the measure in reportExtensions.json: ${JSON.stringify(ms).slice(0, 500)}`);
    const files = filesOf(x, d), tp = tableProblems(files, true), rl = rowLabelProblems(files, true);
    chk(() => tp.bad.length === 0 && rl.tables === 1 && rl.bad.length === 0, () => `1. the website's table checks accept it and prove it: ${JSON.stringify(tp.bad)} ${JSON.stringify(rl)}`);
    chk(() => /الإجمالي/.test(notes(x)) && /Row label: Region/.test(notes(x)) && /reportExtensions\.json/.test(notes(x)), () => `1. the notes tell the user (the word, the measure, how to remove it): ${notes(x).slice(0, 1500)}`);
    const cr = x.err ? x : await ask('check_report', { path: d + '/' + x.j.report, lang: 'ar' });
    chk(() => !cr.err && cr.j.validator.errors === 0 && !cr.j.findings.some((f) => /width|hidden|Row label/i.test(f.what)) && cr.j.notChecked.some((n) => /row-label measure/.test(n.why)),
      () => `1. check_report: the validator clean, no finding on the pattern, which it names as intentional: ${cr.err ? cr.t.slice(0, 300) : JSON.stringify(cr.j.findings.map((f) => f.rule + ' ' + f.what)).slice(0, 600) + ' ' + JSON.stringify(cr.j.notChecked).slice(0, 600)}`);
  }
  // 2. Its header is the column's display name: the Arabic name when one is given
  {
    const x = await mk('R23 ar names', 'ar', ['Sales[Region]', 'Sales[Total Sales]'], { displayNames: { 'Sales[Region]': 'المنطقة' } }), t = tables(x, d)[0];
    const ps = t ? t.visual.query.queryState.Values.projections : [];
    chk(() => ps.length === 3 && ps[2].displayName === 'المنطقة' && ps[0].displayName === 'المنطقة', () => `2. the measure's header is the Arabic display name: ${JSON.stringify(ps).slice(0, 600)} ${short(x)}`);
  }
  // 3. A day name without a sort-by column: the calendar order's helper stays (after the hidden column) and the sort is
  //    unchanged (by the helper, ascending)
  {
    const x = await mk('R23 ar day', 'ar', ['Sales[Day Name]', 'Sales[Total Sales]']), t = tables(x, d)[0], sp = sortProblems(filesOf(x, d));
    const sd = t ? t.visual.query.sortDefinition : null;
    chk(() => t && refs(t)[0] === 'Sales.Day Name' && /^Min\(/.test(refs(t)[1]) && refs(t)[refs(t).length - 1] === 'Sales.Row label: Day Name' && sd && sd.sort[0].field.Aggregation && sd.sort[0].direction === 'Ascending' && sp.bad.length === 0,
      () => `3. the day table: hidden Day Name, the helper, the numbers, the row label; sorted by the helper: ${t ? JSON.stringify(refs(t)) + ' ' + JSON.stringify(sd) : 'no table'} ${JSON.stringify(sp.bad)} ${short(x)}`);
  }
  // 4. Names that need escaping: the DAX quotes the table and closes the column's bracket, as the "No data" measures do
  {
    model('r23-esc', [{ name: "Sa'les", partitions: mp("Sa'les"), columns: [col('Amount', 'double'), col('Re]gion', 'string')], measures: [{ name: 'Total', expression: "SUM ( 'Sa''les'[Amount] )", formatString: '#,0' }] }]);
    const x = await ask('create_report', { path: 'r23-esc', name: 'R23 esc', lang: 'ar', rtl: true, noDataMessage: false, fields: { kpis: ["Sa'les[Total]"], measure: "Sa'les[Total]", table: ["Sa'les[Re]gion]", "Sa'les[Total]"] }, pages: page([tableSlot]) });
    const m = ext(x, 'r23-esc').find((e) => /^Row label: /.test(e.name));
    chk(() => m && m.expression === "IF ( NOT ISBLANK ( 'Sa''les'[Total] ), IF ( ISINSCOPE ( 'Sa''les'[Re]]gion] ), SELECTEDVALUE ( 'Sa''les'[Re]]gion] ), \"الإجمالي\" ) )", () => `4. escaped DAX: ${JSON.stringify(m || ext(x, 'r23-esc'))} ${short(x)}`);
  }
  // 5. A name with a control character (AUD-032): no measure may name it, so the table stays as today (the name column
  //    last, no hidden column), told in the notes
  {
    model('r23-cc', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Re\tgion', 'string')], measures: [{ name: 'Total', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const x = await ask('create_report', { path: 'r23-cc', name: 'R23 cc', lang: 'ar', rtl: true, noDataMessage: false, fields: { kpis: ['Sales[Total]'], measure: 'Sales[Total]', table: ['Sales[Re\tgion]', 'Sales[Total]'] }, pages: page([tableSlot]) });
    const t = tables(x, 'r23-cc')[0];
    chk(() => t && JSON.stringify(refs(t)) === JSON.stringify(['Sales.Total', 'Sales.Re\tgion']) && !width0(t).length && !ext(x, 'r23-cc').some((e) => /^Row label/.test(e.name)) && /control character/.test(notes(x)) && /الإجمالي|Total/.test(notes(x)),
      () => `5. a control character keeps today's table, told: ${t ? JSON.stringify(refs(t)) : 'no table'} ${notes(x).slice(0, 800)} ${short(x)}`);
  }
  // 6. Unchanged: an English table (the name first, no measure, no hidden column) and an Arabic table without a total
  //    row (text columns only: the name column last, as today)
  {
    const en = await mk('R23 en', 'en', ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Orders]']), t = tables(en, d)[0];
    chk(() => t && JSON.stringify(refs(t)) === JSON.stringify(['Sales.Region', 'Sales.Total Sales', 'Sales.Orders']) && !width0(t).length && !ext(en, d).some((e) => /^Row label/.test(e.name)) && !/Row label/.test(notes(en)),
      () => `6. the English table is as before: ${t ? JSON.stringify(refs(t)) : 'no table'} ${notes(en).slice(0, 300)} ${short(en)}`);
    const nt = await mk('R23 ar no total', 'ar', ['Sales[Region]', 'Sales[Channel]']), t2 = tables(nt, d)[0];
    chk(() => t2 && JSON.stringify(refs(t2)) === JSON.stringify(['Sales.Channel', 'Sales.Region']) && !width0(t2).length && !ext(nt, d).some((e) => /^Row label/.test(e.name)),
      () => `6. an Arabic table without a total row is as before: ${t2 ? JSON.stringify(refs(t2)) : 'no table'} ${short(nt)}`);
  }

  // ---- Round 23, part 2 (the owner's rule, 8 Oct 2026: "in any model I want to make sure English in English reports
  // and Arabic in Arabic reports"; found in the 0.2.7 install test on the bilingual Marsa Home model: an English report
  // took Sales[المدينة] for its column chart, its table and a slicer beside the City slicer) ----
  const Bn = createRequire(import.meta.url)('../assets/js/pbip-bind.js');
  const AR = /[؀-ۿ]|\((arabic|ar)\)\s*$/i;
  const colsUsed = (x, dir) => { const out = new Set(); Object.entries(filesOf(x, dir)).filter(([k]) => k.endsWith('/visual.json')).forEach(([, v]) => { const re = /"Column":\{"Expression":\{"SourceRef":\{"Entity":"((?:[^"\\]|\\.)*)"\}\},"Property":"((?:[^"\\]|\\.)*)"\}/g; let mm; const t = JSON.stringify(JSON.parse(String(v))); while ((mm = re.exec(t))) out.add(JSON.parse('"' + mm[1] + '"') + '[' + JSON.parse('"' + mm[2] + '"') + ']'); }); return [...out]; };
  const slicerCols = (x, dir) => Object.entries(filesOf(x, dir)).filter(([k]) => k.endsWith('/visual.json')).map(([, v]) => JSON.parse(String(v))).filter((v) => v.visual && v.visual.visualType === 'slicer' && v.visual.query).map((v) => { const c = v.visual.query.queryState.Values.projections[0].field.Column; return c.Expression.SourceRef.Entity + '[' + c.Property + ']'; });
  const rel = (from, fc, to, tc) => ({ name: from + '-' + to, fromTable: from, fromColumn: fc, toTable: to, toColumn: tc });
  const modelR = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
  const CAL = { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Year', 'int64'), col('Month Name', 'string'), col('Month Number', 'int64'), col('Day Name', 'string'), col('Day Name (Arabic)', 'string'), col('Day of Week', 'int64')] };
  const MARSA = [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('City', 'string'), col('المدينة', 'string'), col('Category', 'string'), col('الفئة', 'string'), col('Channel', 'string'), col('القناة', 'string'), col('Amount', 'double')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] }, CAL];
  modelR('r23-marsa', MARSA, [rel('Sales', 'Date', 'Calendar', 'Date')]);
  const auto = async (dir, name, lang, extra) => { const pl = await ask('plan_layout', { layout: 'exec', kpis: 2, filters: 'end', lang }); return ask('create_report', Object.assign({ path: dir, name, lang, design: pl.j.design }, extra || {})); };
  // 7. The Marsa Home shape, an English report: City, Category and Channel only, never an Arabic column (nor the Gulf
  //    calendar's Day Name (Arabic)); no two slicers of one twin pair; the note names what was skipped
  {
    const x = await auto('r23-marsa', 'R23 marsa en', 'en'), used = x.err ? [] : colsUsed(x, 'r23-marsa'), sl = x.err ? [] : slicerCols(x, 'r23-marsa');
    chk(() => !x.err && used.some((c) => /^Sales\[(City|Category|Channel)\]$/.test(c)) && !used.some((c) => AR.test(c)) && sl.length && !sl.some((c) => AR.test(c)) && /المدينة/.test(notes(x)) && /English report/.test(notes(x)),
      () => `7. the English report on the bilingual model uses English columns only and says what it skipped: used ${JSON.stringify(used)} slicers ${JSON.stringify(sl)} ${notes(x).slice(0, 600)} ${short(x)}`);
  }
  // 8. The same model, an Arabic report: the Arabic twins (no City, Category, Channel), the calendar's Day Name (Arabic)
  //    where a day name is shown (round 12b, unchanged); no two slicers of one twin pair
  {
    const x = await auto('r23-marsa', 'R23 marsa ar', 'ar'), used = x.err ? [] : colsUsed(x, 'r23-marsa'), sl = x.err ? [] : slicerCols(x, 'r23-marsa');
    const twins = [['Sales[City]', 'Sales[المدينة]'], ['Sales[Category]', 'Sales[الفئة]'], ['Sales[Channel]', 'Sales[القناة]']];
    chk(() => !x.err && used.some((c) => /^Sales\[(المدينة|الفئة|القناة)\]$/.test(c)) && !used.some((c) => /^Sales\[(City|Category|Channel)\]$/.test(c)) && !used.includes('Calendar[Day Name]') && twins.every(([e, a]) => !(sl.includes(e) && sl.includes(a))),
      () => `8. the Arabic report uses the Arabic twins: used ${JSON.stringify(used)} slicers ${JSON.stringify(sl)} ${short(x)}`);
  }
  // 9. suggest_fields with the report's language; the website's picker (the same engine) the same
  {
    const en = await ask('suggest_fields', { path: 'r23-marsa', kpis: 2, lang: 'en' }), ar = await ask('suggest_fields', { path: 'r23-marsa', kpis: 2, lang: 'ar' });
    const cats = (x) => (x.err ? [] : Object.values(x.j.cats || {}).concat(x.j.slicers || [], x.j.table || []).filter((f) => f && f.c != null).map((f) => f.c));
    chk(() => cats(en).length && !cats(en).some((c) => AR.test(c)) && cats(ar).some((c) => /المدينة|الفئة|القناة/.test(c)) && !cats(ar).some((c) => /^(City|Category|Channel)$/.test(c)),
      () => `9. suggest_fields follows lang: en ${JSON.stringify(cats(en))} ar ${JSON.stringify(cats(ar))} ${short(en)} ${short(ar)}`);
    const T = MARSA.map((t) => ({ name: t.name, date: t.dataCategory === 'Time', columns: t.columns.map((c) => ({ name: c.name, dataType: c.dataType })), measures: (t.measures || []).map((m) => ({ name: m.name, expr: m.expression, formatString: m.formatString })) }));
    const w = (lang) => { const b = Bn.suggest(T, 2, { lang }); return Object.values(b.cats).concat(b.slicers, b.table).filter((f) => f && f.c != null).map((f) => f.c); };
    chk(() => !w('en').some((c) => AR.test(c)) && w('ar').some((c) => /المدينة/.test(c)) && !w('ar').some((c) => /^(City|Category|Channel)$/.test(c)), () => `9. the website's picker follows lang: en ${JSON.stringify(w('en'))} ar ${JSON.stringify(w('ar'))}`);
  }
  // 10. A model with Arabic text columns only: an English report uses them and says so. A model with English columns
  //     only: an Arabic report uses them (names through display names, as today) and has no language note
  {
    modelR('r23-aronly', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('المنطقة', 'string'), col('القناة', 'string')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const x = await auto('r23-aronly', 'R23 aronly en', 'en'), used = x.err ? [] : colsUsed(x, 'r23-aronly');
    chk(() => !x.err && used.some((c) => /المنطقة|القناة/.test(c)) && /used anyway/.test(notes(x)), () => `10. an Arabic-only model in an English report: its Arabic columns, told: ${JSON.stringify(used)} ${notes(x).slice(0, 500)} ${short(x)}`);
    modelR('r23-enonly', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const y = await auto('r23-enonly', 'R23 enonly ar', 'ar'), used2 = y.err ? [] : colsUsed(y, 'r23-enonly');
    chk(() => !y.err && used2.includes('Sales[Region]') && !/report: the columns picked/.test(notes(y)), () => `10. an English-only model in an Arabic report: its columns, no language note: ${JSON.stringify(used2)} ${notes(y).slice(0, 400)} ${short(y)}`);
  }
  // 11. The user's fields always win: an English report naming Sales[المدينة] uses it, told
  {
    const x = await auto('r23-marsa', 'R23 marsa named', 'en', { fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[المدينة]' } }), used = x.err ? [] : colsUsed(x, 'r23-marsa');
    chk(() => !x.err && used.includes('Sales[المدينة]') && /Sales\[المدينة\] is in Arabic/.test(notes(x)), () => `11. a named Arabic field is used in an English report, told: ${JSON.stringify(used)} ${notes(x).slice(0, 600)} ${short(x)}`);
  }

  // ---- Round 23, part 4 (the owner, 8 Oct 2026: "make sure there is nothing critical left in seen not in scope"; the
  // reviewer's routine, items 1 to 8, each written red first) ----
  const visualsOf = (x, dir) => Object.entries(filesOf(x, dir)).filter(([k]) => k.endsWith('/visual.json')).map(([, v]) => JSON.parse(String(v))).filter((v) => v.visual);
  const measuresIn = (v) => { const out = []; JSON.stringify(v.visual.query || {}).replace(/"Measure":\{"Expression":\{"SourceRef":\{(?:"Schema":"extension",)?"Entity":"((?:[^"\\]|\\.)*)"\}\},"Property":"((?:[^"\\]|\\.)*)"/g, (z, t, m) => out.push(m)); return out; };
  // 1. A table's measures all reach its row column's table: a measure of a fact table not related to it (lab 1b,
  //    "Delivered Qty 9,012 on every Hub Zone row"; golden task 10) is left out of that table and named
  {
    modelR('r23-reach', [{ name: 'Hub', partitions: mp('Hub'), columns: [col('Hub Key', 'int64'), col('Hub Zone', 'string')] },
      { name: 'Carrier', partitions: mp('Carrier'), columns: [col('Carrier Key', 'int64'), col('Carrier Group', 'string')] },
      { name: 'Shipments', partitions: mp('Shipments'), columns: [col('Hub Key', 'int64'), col('Amount', 'double')], measures: [{ name: 'Shipments Amount', expression: 'SUM ( Shipments[Amount] )', formatString: '#,0' }] },
      { name: 'Deliveries', partitions: mp('Deliveries'), columns: [col('Carrier Key', 'int64'), col('Qty', 'double')], measures: [{ name: 'Delivered Qty', expression: 'SUM ( Deliveries[Qty] )', formatString: '#,0' }] }],
      [rel('Shipments', 'Hub Key', 'Hub', 'Hub Key'), rel('Deliveries', 'Carrier Key', 'Carrier', 'Carrier Key')]);
    const x = await auto('r23-reach', 'R23 reach', 'en', { noDataMessage: false }), ts = x.err ? [] : visualsOf(x, 'r23-reach').filter((v) => v.visual.visualType === 'tableEx');
    chk(() => ts.length && ts.every((v) => JSON.stringify(v.visual.query).includes('Hub Zone') && !measuresIn(v).includes('Delivered Qty') && measuresIn(v).includes('Shipments Amount')) && /Delivered Qty/.test(notes(x)) && /not related|does not reach/.test(notes(x)),
      () => `1. the table by Hub Zone has no Delivered Qty, told: ${JSON.stringify(ts.map((v) => measuresIn(v)))} ${notes(x).slice(0, 900)} ${short(x)}`);
  }
  // 3. An ID-like text column (Order Id, Invoice No) is never a chart category or a slicer unless named
  {
    modelR('r23-id', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Order Id', 'string'), col('Invoice No', 'string'), col('Customer Code', 'string'), col('Region', 'string'), col('Amount', 'double')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const x = await auto('r23-id', 'R23 id', 'en'), used = x.err ? [] : colsUsed(x, 'r23-id');
    chk(() => !x.err && used.includes('Sales[Region]') && !used.some((c) => /Order Id|Invoice No|Customer Code/.test(c)), () => `3. no ID-like column on a chart, slicer or table: ${JSON.stringify(used)} ${short(x)}`);
    const y = await auto('r23-id', 'R23 id named', 'en', { fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Order Id]' } });
    chk(() => !y.err && colsUsed(y, 'r23-id').includes('Sales[Order Id]'), () => `3. a named ID column is used: ${short(y)}`);
  }
  // 4. A hand-placed page of an Arabic report is right to left without rtl: true (rtl: false still wins)
  {
    const ar = await ask('create_report', { path: d, name: 'R23 hand ar', lang: 'ar', noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const lt = await ask('create_report', { path: d, name: 'R23 hand ar ltr', lang: 'ar', rtl: false, noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const t1 = tables(ar, d)[0], t2 = tables(lt, d)[0];
    chk(() => t1 && refs(t1)[refs(t1).length - 1] === 'Sales.Row label: Region' && t2 && refs(t2)[0] === 'Sales.Region' && !width0(t2).length, () => `4. lang ar hand page right to left by default, rtl false left to right: ${t1 ? refs(t1) : short(ar)} | ${t2 ? refs(t2) : short(lt)}`);
  }
  // 5. A theme made for 1920 x 1080 on a 1280 x 720 hand-placed page: its text sizes follow the page (x 720/1080), as a
  //    plan_layout page's theme does
  {
    const th = await ask('generate_theme', { name: 'R23 big', preset: 'DataArcus', folder: 'r23-themes' });
    const x = th.err ? th : await ask('create_report', { path: d, name: 'R23 theme small', theme: th.j.path, noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const tf = x.err ? null : Object.entries(filesOf(x, d)).find(([k]) => /RegisteredResources\/[^/]+\.json$/.test(k)), T = tf ? JSON.parse(String(tf[1])) : null;
    const size = T ? T.visualStyles.tableEx['*'].values[0].fontSize : null, big = th.err ? null : JSON.parse(fs.readFileSync(path.join(ROOT, th.j.path), 'utf8')).visualStyles.tableEx['*'].values[0].fontSize;
    chk(() => big === 15 && size === 10 && /text sizes/.test(notes(x)), () => `5. the theme's table text 15 at 1920 x 1080 becomes 10 on a 1280 x 720 page, told: ${big} -> ${size} ${notes(x).slice(0, 400)} ${short(x)}`);
  }
  // 6. A measure that reaches no calendar: the line chart is left out with the true reason, and the visual beside it
  //    takes its room (no empty slot)
  {
    modelR('r23-nocal', [{ name: 'Region', partitions: mp('Region'), columns: [col('Region Key', 'int64'), col('Region', 'string')] },
      { name: 'Sales', partitions: mp('Sales'), columns: [col('Region Key', 'int64'), col('Channel', 'string'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] },
      { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Month Name', 'string'), col('Year', 'int64')] }], [rel('Sales', 'Region Key', 'Region', 'Region Key')]);
    const pl = await ask('plan_layout', { layout: 'exec', kpis: 1, filters: 'end', lang: 'en' }), lineSlot = pl.err ? null : pl.j.slots.find((sl) => sl.kind === 'line');
    const x = pl.err ? pl : await ask('create_report', { path: 'r23-nocal', name: 'R23 nocal', lang: 'en', design: pl.j.design, secondPage: false, noDataMessage: false });
    const lo = x.err ? [] : (x.j.leftOutVisuals || []), vs = x.err ? [] : visualsOf(x, 'r23-nocal');
    const covers = lineSlot && vs.some((v) => /Chart$|tableEx/.test(v.visual.visualType) && v.position.x <= lineSlot.x + 1 && v.position.x + v.position.width >= lineSlot.x + lineSlot.w - 1 && Math.abs(v.position.y - lineSlot.y) <= 60);
    chk(() => lineSlot && !vs.some((v) => v.visual.visualType === 'lineChart') && lo.some((l) => /no calendar is related to Sales/.test(l.why)) && covers,
      () => `6. no line chart, the true reason, its room taken: ${JSON.stringify(lo)} slot ${JSON.stringify(lineSlot)} ${JSON.stringify(vs.filter((v) => /Chart$|tableEx/.test(v.visual.visualType)).map((v) => [v.visual.visualType, v.position.x, v.position.y, v.position.width]))} ${short(x)}`);
  }
  // 7. The report measures never take a name the model already has: "No data: Total Sales" and "Row label: Region" exist
  //    in Sales, so the report's get a free name, told
  {
    modelR('r23-names', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Region', 'string'), col('Amount', 'double'), Object.assign(col('Row label: Region', 'string'), { isHidden: true })],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'No data: Total Sales', expression: '1', isHidden: true }] }]);
    const x = await ask('create_report', { path: 'r23-names', name: 'R23 names', lang: 'ar', fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const ms = ext(x, 'r23-names').map((e) => e.name), t = tables(x, 'r23-names')[0];
    chk(() => !x.err && !ms.includes('No data: Total Sales') && !ms.includes('Row label: Region') && ms.some((n) => /^No data: Total Sales \(\d\)$/.test(n)) && ms.some((n) => /^Row label: Region \(\d\)$/.test(n)) && t && /^Sales\.Row label: Region \(\d\)$/.test(refs(t)[refs(t).length - 1]) && rowLabelProblems(filesOf(x, 'r23-names'), true).bad.length === 0 && /already has/.test(notes(x)),
      () => `7. free names for the report measures, told: ${JSON.stringify(ms)} ${t ? refs(t) : ''} ${notes(x).slice(0, 600)} ${short(x)}`);
  }
  // 8. A bar or column chart by a text category is sorted by its measure, largest first (an Arabic column chart from
  //    the right: Ascending, mirrored); a time category (a day name with its number) keeps its own order
  {
    const sortOf = (v) => { const s0 = ((v.visual.query.sortDefinition || {}).sort || [])[0]; return s0 ? (s0.field.Measure ? 'M:' : s0.field.Aggregation ? 'Min:' : 'C:') + s0.direction : 'none'; };
    const charts = (x, dir) => (x.err ? [] : visualsOf(x, dir).filter((v) => /^clustered(Bar|Column)Chart$/.test(v.visual.visualType) && v.visual.query));
    const en = await auto('r23-marsa', 'R23 sort en', 'en'), ar = await auto('r23-marsa', 'R23 sort ar', 'ar');
    const day = await auto('r23-marsa', 'R23 sort day', 'en', { fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[City]', category2: 'Calendar[Day Name]' } });
    const textCat = (v) => !/"Entity":"Calendar"/.test(JSON.stringify(v.visual.query.queryState.Category)), e = charts(en, 'r23-marsa').filter(textCat), a2 = charts(ar, 'r23-marsa').filter(textCat), dd = charts(day, 'r23-marsa').filter((v) => /Day Name/.test(JSON.stringify(v.visual.query.queryState.Category)));
    const want = (v, rtl) => (v.visual.visualType === 'clusteredColumnChart' && rtl ? 'M:Ascending' : 'M:Descending');
    chk(() => e.length >= 2 && e.every((v) => sortOf(v) === want(v, false)) && a2.length >= 2 && a2.every((v) => sortOf(v) === want(v, true)) && dd.length && dd.every((v) => sortOf(v) === 'Min:Ascending') && sortProblems(filesOf(en, 'r23-marsa')).bad.length === 0 && sortProblems(filesOf(ar, 'r23-marsa')).bad.length === 0,
      () => `8. text categories by the measure, largest first; days in order: en ${JSON.stringify(e.map((v) => [v.visual.visualType, sortOf(v)]))} ar ${JSON.stringify(a2.map((v) => [v.visual.visualType, sortOf(v)]))} day ${JSON.stringify(dd.map(sortOf))} ${JSON.stringify(sortProblems(filesOf(en, 'r23-marsa')).bad.slice(0, 2))}`);
  }

  // ---- Round 23, part 5: the reviewer's code review of fix/round-23-total (8 Oct, 09:16 UTC), each red first ----
  // R1. The row label is blank on a row whose measures are all blank (Power BI then drops the row, as in an English
  //     table; before, every row showed with its name and empty numbers, and on an empty page the names showed over
  //     the "No data" card); the total row's word only when a measure has a value
  {
    const x = await mk('R23 R1', 'ar', ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Orders]']), m = ext(x, d).find((e) => e.name === 'Row label: Region');
    const want = `IF ( NOT ISBLANK ( 'Sales'[Orders] ) || NOT ISBLANK ( 'Sales'[Total Sales] ), IF ( ISINSCOPE ( 'Sales'[Region] ), SELECTEDVALUE ( 'Sales'[Region] ), "الإجمالي" ) )`;
    chk(() => m && m.expression === want && rowLabelProblems(filesOf(x, d), true).bad.length === 0, () => `R1. the row label is blank where the row's measures are: ${m && m.expression}`);
  }
  // R3. A relationship that filters both ways is followed both ways: Delivered Qty reaches Hub through a both-directions
  //     relationship from Hub to Deliveries, so it stays in the table by Hub Zone
  {
    modelR('r23-both', [{ name: 'Hub', partitions: mp('Hub'), columns: [col('Hub Key', 'int64'), col('Hub Zone', 'string')] },
      { name: 'Shipments', partitions: mp('Shipments'), columns: [col('Hub Key', 'int64'), col('Amount', 'double')], measures: [{ name: 'Shipments Amount', expression: 'SUM ( Shipments[Amount] )', formatString: '#,0' }] },
      { name: 'Deliveries', partitions: mp('Deliveries'), columns: [col('Hub Key', 'int64'), col('Qty', 'double')], measures: [{ name: 'Delivered Qty', expression: 'SUM ( Deliveries[Qty] )', formatString: '#,0' }] }],
      [rel('Shipments', 'Hub Key', 'Hub', 'Hub Key'), Object.assign(rel('Hub', 'Hub Key', 'Deliveries', 'Hub Key'), { crossFilteringBehavior: 'bothDirections' })]);
    const x = await auto('r23-both', 'R23 both', 'en', { noDataMessage: false }), ts = x.err ? [] : visualsOf(x, 'r23-both').filter((v) => v.visual.visualType === 'tableEx');
    chk(() => ts.length && ts.every((v) => measuresIn(v).includes('Delivered Qty')) && !/Delivered Qty/.test(notes(x)), () => `R3. a both-directions relationship is followed: ${JSON.stringify(ts.map(measuresIn))} ${notes(x).slice(0, 400)} ${short(x)}`);
  }
  // R4. The reach comes before the language: an English report whose only related category is Arabic uses it (told),
  //     rather than an English category of an unrelated table and then none
  {
    modelR('r23-reachlang', [{ name: 'Region', partitions: mp('Region'), columns: [col('Region Key', 'int64'), col('المنطقة', 'string')] },
      { name: 'Carrier', partitions: mp('Carrier'), columns: [col('Carrier Group', 'string')] },
      { name: 'Sales', partitions: mp('Sales'), columns: [col('Region Key', 'int64'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }],
      [rel('Sales', 'Region Key', 'Region', 'Region Key')]);
    const x = await auto('r23-reachlang', 'R23 reachlang', 'en'), used = x.err ? [] : colsUsed(x, 'r23-reachlang');
    chk(() => !x.err && used.includes('Region[المنطقة]') && !used.includes('Carrier[Carrier Group]') && /used anyway/.test(notes(x)), () => `R4. the reached Arabic category, told: ${JSON.stringify(used)} ${notes(x).slice(0, 500)} ${short(x)}`);
  }
  // R5. An adjacent column is a twin only when the table's layout says which (all its Arabic columns after, or all
  //     before, their English one, and not both): [Product, المدينة, City] has no twin; the Marsa shape keeps its three
  {
    const T = (cols) => [{ name: 'S', columns: cols.map((n) => ({ name: n, dataType: 'string' })), measures: [] }];
    const a = Bn.twinsOf(T(['Product', 'المدينة', 'City'])), b = Bn.twinsOf(T(['City', 'المدينة', 'Category', 'الفئة', 'Channel', 'القناة']));
    chk(() => !a['S[المدينة]'] && b['S[المدينة]'] === 'S[City]' && b['S[الفئة]'] === 'S[Category]' && b['S[القناة]'] === 'S[Channel]', () => `R5. adjacent twins only when unambiguous: ${JSON.stringify(a)} ${JSON.stringify(b)}`);
  }
  // R6. A theme the user made (its table text 12pt, not generate_theme's) is never rescaled, only noted
  {
    const th = await ask('generate_theme', { name: 'R23 user base', preset: 'DataArcus', folder: 'r23-themes' });
    const own = th.err ? null : JSON.parse(fs.readFileSync(path.join(ROOT, th.j.path), 'utf8'));
    if (own) { own.visualStyles.tableEx['*'].values[0].fontSize = 12; fs.writeFileSync(path.join(ROOT, 'r23-themes', 'user-own.json'), JSON.stringify(own)); }
    const x = th.err ? th : await ask('create_report', { path: d, name: 'R23 user theme', theme: 'r23-themes/user-own.json', noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const tf = x.err ? null : Object.entries(filesOf(x, d)).find(([k]) => /RegisteredResources\/[^/]+\.json$/.test(k)), Tj = tf ? JSON.parse(String(tf[1])) : null;
    chk(() => Tj && Tj.visualStyles.tableEx['*'].values[0].fontSize === 12 && Tj.visualStyles.card['*'].labels[0].fontSize === own.visualStyles.card['*'].labels[0].fontSize && /not scaled/.test(notes(x)), () => `R6. a user's theme is kept, told: ${Tj && Tj.visualStyles.tableEx['*'].values[0].fontSize} ${notes(x).slice(0, 400)} ${short(x)}`);
  }
  // R7. Two line charts without a time axis: each slot goes to a visual beside it, and no line chart is left stretched
  {
    const { dropLines } = await import('./lib/slots.mjs').catch(() => ({}));
    const slots = [{ kind: 'line', x: 0, y: 0, w: 100, h: 50 }, { kind: 'line', x: 100, y: 0, w: 100, h: 50 }, { kind: 'bar', x: 200, y: 0, w: 100, h: 50 }];
    const out = dropLines ? dropLines(slots) : null;
    chk(() => out && !out.slots.some((x) => x.kind === 'line') && out.dropped.length === 2 && out.slots.find((x) => x.kind === 'bar').w === 300 && out.slots.find((x) => x.kind === 'bar').x === 0, () => `R7. both line slots go to the bar beside them: ${JSON.stringify(out)}`);
  }
  // R8. "AR" as a word in an English name (accounts receivable) is not Arabic; "(AR)", "(Arabic)" and Arabic letters are
  {
    chk(() => Bn.langOf('Aging AR') === 'en' && Bn.langOf('Customer_ar') === 'en' && Bn.langOf('Name (AR)') === 'ar' && Bn.langOf('Day Name (Arabic)') === 'ar' && Bn.langOf('Arabic Name') === 'ar' && Bn.langOf('المدينة') === 'ar',
      () => `R8. the language marks: ${['Aging AR', 'Customer_ar', 'Name (AR)', 'Day Name (Arabic)', 'Arabic Name', 'المدينة'].map((n) => n + '=' + Bn.langOf(n)).join(', ')}`);
  }
  // R9. Time words are whole words ("Holiday Package" is a text category: sorted by the measure); an ID with an Arabic
  //     mark ("Order No (AR)") is still an ID
  {
    modelR('r23-words', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Holiday Package', 'string'), col('Order No (AR)', 'string'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const x = await auto('r23-words', 'R23 words', 'en'), used = x.err ? [] : colsUsed(x, 'r23-words');
    const bars = x.err ? [] : visualsOf(x, 'r23-words').filter((v) => /^clustered(Bar|Column)Chart$/.test(v.visual.visualType) && /Holiday Package/.test(JSON.stringify(v.visual.query.queryState.Category)));
    chk(() => bars.length && bars.every((v) => v.visual.query.sortDefinition && v.visual.query.sortDefinition.sort[0].field.Measure) && !used.includes('Sales[Order No (AR)]'), () => `R9. whole time words; an ID with a mark: ${JSON.stringify(bars.map((v) => v.visual.query.sortDefinition))} ${JSON.stringify(used)} ${short(x)}`);
  }

  // ---- Round 23, part 6: the reviewer's re-review of part 5 (09:42 UTC; the last loop), each red first ----
  // F1. A time column written CamelCase or with "_" (QuarterName, Month_Name) keeps its own order (no sort by value)
  {
    modelR('r23-camel', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('QuarterName', 'string'), col('Month_Name', 'string'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const x = await auto('r23-camel', 'R23 camel', 'en', { fields: { kpis: ['Sales[Total Sales]'], category: 'Sales[QuarterName]', category2: 'Sales[Month_Name]' } });
    const cs = x.err ? [] : visualsOf(x, 'r23-camel').filter((v) => /^clustered(Bar|Column)Chart$/.test(v.visual.visualType) && v.visual.query);
    chk(() => cs.length >= 2 && cs.every((v) => !((v.visual.query.sortDefinition || {}).sort || []).some((z) => z.field.Measure)), () => `F1. CamelCase and "_" time columns are not sorted by value: ${JSON.stringify(cs.map((v) => v.visual.query.sortDefinition))} ${short(x)}`);
  }
  // F2. "City_AR" beside "City" in the same table is City's Arabic twin (English report: City; Arabic report: City_AR);
  //     "Aging AR" alone stays English
  {
    const T = [{ name: 'S', columns: [['City', 'string'], ['City_AR', 'string'], ['Aging AR', 'string'], ['Amount', 'double']].map(([n, t]) => ({ name: n, dataType: t })), measures: [{ name: 'Total', expr: 'SUM ( S[Amount] )' }] }];
    const tw = Bn.twinsOf(T), cat = (lang) => { const b = Bn.suggest(T, 1, { lang }); return Object.values(b.cats).concat(b.slicers, b.table).filter((f) => f && f.c != null).map((f) => f.c); };
    chk(() => tw['S[City_AR]'] === 'S[City]' && !tw['S[Aging AR]'] && !cat('en').includes('City_AR') && cat('ar').includes('City_AR') && !cat('ar').includes('City') && cat('en').includes('City'),
      () => `F2. City_AR is City's twin, Aging AR is not: ${JSON.stringify(tw)} en ${JSON.stringify(cat('en'))} ar ${JSON.stringify(cat('ar'))}`);
  }
  // F3. "Arabic" is a mark only at the end ("Name (Arabic)", "Name Arabic") or the start ("Arabic Name"), not inside
  {
    const L = (n) => Bn.langOf(n);
    chk(() => L('Non-Arabic Customers') === 'en' && L('Is Arabic Speaker') === 'en' && L('Name_Arabic_Short') === 'en' && L('Name Arabic') === 'ar' && L('Arabic Name') === 'ar' && L('Day Name (Arabic)') === 'ar',
      () => `F3. the Arabic mark: ${['Non-Arabic Customers', 'Is Arabic Speaker', 'Name_Arabic_Short', 'Name Arabic', 'Arabic Name', 'Day Name (Arabic)'].map((n) => n + '=' + L(n)).join(', ')}`);
  }
  // F4. generate_theme's own theme for a 1366 x 768 page is known as ours and scaled to a 1280 x 720 hand page
  {
    const th = await ask('generate_theme', { name: 'R23 768', preset: 'DataArcus', folder: 'r23-themes', layout: { page: { w: 1366, h: 768 } } });
    const x = th.err ? th : await ask('create_report', { path: d, name: 'R23 theme 768', theme: th.j.path, noDataMessage: false, fields: { kpis: ['Sales[Total Sales]'], measure: 'Sales[Total Sales]', table: ['Sales[Region]', 'Sales[Total Sales]'] }, pages: page([tableSlot]) });
    const tf = x.err ? null : Object.entries(filesOf(x, d)).find(([k]) => /RegisteredResources\/[^/]+\.json$/.test(k)), Tj = tf ? JSON.parse(String(tf[1])) : null;
    chk(() => Tj && Tj.visualStyles.tableEx['*'].values[0].fontSize === 10 && /were scaled/.test(notes(x)), () => `F4. a 768-high generated theme is ours and scaled: ${Tj && Tj.visualStyles.tableEx['*'].values[0].fontSize} ${notes(x).slice(0, 300)} ${short(x)}`);
  }
  // F5. Two line charts side by side above a table as wide as both: the table takes their whole band (no blank band)
  {
    const { dropLines } = await import('./lib/slots.mjs');
    const out = dropLines([{ kind: 'line', x: 0, y: 0, w: 100, h: 50 }, { kind: 'line', x: 110, y: 0, w: 100, h: 50 }, { kind: 'table', x: 0, y: 60, w: 210, h: 50 }]);
    const t = out.slots.find((z) => z.kind === 'table');
    chk(() => t && t.y === 0 && t.h === 110 && t.w === 210 && !out.slots.some((z) => z.kind === 'line'), () => `F5. the table takes the two lines' band: ${JSON.stringify(out.slots)}`);
  }
  // F6. A column the visual counts (Function 2, a distinct count) is DISTINCTCOUNT in the row label's DAX
  {
    modelR('r23-nomeas', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Order Id', 'int64'), col('Region', 'string'), col('Qty', 'double')] }]);
    const x = await auto('r23-nomeas', 'R23 nomeas', 'ar', { noDataMessage: false }), m = ext(x, 'r23-nomeas').find((e) => /^Row label: /.test(e.name));
    chk(() => m && /DISTINCTCOUNT \( 'Sales'\[Order Id\] \)/.test(m.expression) && !/COUNTA/.test(m.expression), () => `F6. a distinct count is DISTINCTCOUNT: ${m && m.expression} ${short(x)}`);
  }
  // F7. One implementation of the room rule: the server's text slots use lib/slots.mjs's absorb (no copy of its own)
  {
    const srv = fs0.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'server.mjs'), 'utf8');
    chk(() => /absorb\(/.test(srv) && !/const row = near\(/.test(srv), () => 'F7. server.mjs must use slots.mjs absorb for text slots, not its own copy');
  }

  // ---- Round 23, part 7: the laptop's proof (ab28427), findings S1, W1, S2, each red first ----
  // S1. A filter rail with 0, 1, 2 or 3 slicers, English and Arabic, 1280 x 720 and 960 x 720 (the rail fitted to its
  //     slicers became wider than high and was laid out as a strip: two slicers 24 wide side by side, -2 in Arabic): each
  //     slicer the rail's width, stacked; and no visual of any of these reports narrower or lower than 8
  {
    const bad = [];
    const T3 = (n) => [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Date', 'dateTime'), col('Amount', 'double')].concat(['Region', 'Channel', 'Segment'].slice(0, n).map((c) => col(c, 'string'))), measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] },
      { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Year', 'int64')] }];
    for (const n of [0, 1, 2, 3]) {
      modelR('r23-rail' + n, T3(n), [rel('Sales', 'Date', 'Calendar', 'Date')]);
      for (const lang of ['en', 'ar']) for (const pg of ['1280x720', '960x720']) {
        const pl = await ask('plan_layout', { layout: 'exec', kpis: 1, filters: 'end', lang, page: pg }), rail = pl.err ? null : pl.j.slots.find((z) => z.kind === 'slicer');
        const x = pl.err ? pl : await ask('create_report', { path: 'r23-rail' + n, name: `R23 rail ${n} ${lang} ${pg}`, lang, design: pl.j.design, secondPage: false });
        if (x.err || !rail) { bad.push(`${n} ${lang} ${pg}: ${short(x)}`); continue; }
        const vs = Object.entries(filesOf(x, 'r23-rail' + n)).filter(([k]) => k.endsWith('/visual.json')).map(([, v]) => JSON.parse(String(v)));
        const sl = vs.filter((v) => v.visual && v.visual.visualType === 'slicer'), k = 720 / 1080;
        const tiny = vs.filter((v) => v.position.width < 8 || v.position.height < 8);
        if (tiny.length) bad.push(`${n} ${lang} ${pg}: ${tiny.length} visual(s) under 8: ${JSON.stringify(tiny.map((v) => [v.visual ? v.visual.visualType : 'group', v.position.width, v.position.height]))}`);
        if (sl.some((v) => v.position.width < rail.w - 2 * Math.ceil(10 * k) - 2)) bad.push(`${n} ${lang} ${pg}: a slicer narrower than the rail: ${JSON.stringify(sl.map((v) => v.position.width))} rail ${rail.w}`);
        if (new Set(sl.map((v) => v.position.y)).size !== sl.length) bad.push(`${n} ${lang} ${pg}: slicers side by side: ${JSON.stringify(sl.map((v) => [v.position.x, v.position.y]))}`);
      }
    }
    chk(() => bad.length === 0, () => `S1. rails with 0-3 slicers: ${bad.slice(0, 6).join(' | ')}`);
  }
  // W1. The tooltip page's bar chart shows a measure that reaches its category (the second KPI of an unrelated fact
  //     table repeated one total on every Hub Zone bar); else the main measure
  {
    const T = [{ name: 'Hub', columns: [{ name: 'Hub Key', dataType: 'int64' }, { name: 'Hub Zone', dataType: 'string' }], measures: [] },
      { name: 'Carrier', columns: [{ name: 'Carrier Key', dataType: 'int64' }, { name: 'Carrier Group', dataType: 'string' }], measures: [] },
      { name: 'Shipments', columns: [{ name: 'Hub Key', dataType: 'int64' }, { name: 'Amount', dataType: 'double' }], measures: [{ name: 'Shipments Amount', expr: 'SUM ( Shipments[Amount] )' }] },
      { name: 'Deliveries', columns: [{ name: 'Carrier Key', dataType: 'int64' }, { name: 'Qty', dataType: 'double' }], measures: [{ name: 'Delivered Qty', expr: 'SUM ( Deliveries[Qty] )' }] }];
    const rels = [{ fromTable: 'Shipments', toTable: 'Hub' }, { fromTable: 'Deliveries', toTable: 'Carrier' }];
    const b = Bn.suggest(T, 2, { relationships: rels, modelTables: T }), again = Bn.build(Object.assign({}, b.choices));
    chk(() => b.tip && b.tip.cat && b.tip.cat.c === 'Hub Zone' && b.tip.y && b.tip.y.m === 'Shipments Amount' && again.tip.y.m === 'Shipments Amount', () => `W1. the tooltip's bar shows a measure that reaches its category: ${JSON.stringify(b.tip)} | again ${JSON.stringify(again.tip)}`);
  }
  // S2. A line chart left out because the model has no month or date column at all: its slot goes to the visual beside
  //     it too, with that reason
  {
    modelR('r23-nodate', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Region', 'string'), col('Channel', 'string'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] }]);
    const pl = await ask('plan_layout', { layout: 'exec', kpis: 1, filters: 'end', lang: 'en' }), lineSlot = pl.err ? null : pl.j.slots.find((z) => z.kind === 'line');
    const x = pl.err ? pl : await ask('create_report', { path: 'r23-nodate', name: 'R23 nodate', lang: 'en', design: pl.j.design, secondPage: false, noDataMessage: false });
    const lo = x.err ? [] : (x.j.leftOutVisuals || []), vs = x.err ? [] : visualsOf(x, 'r23-nodate');
    const covers = lineSlot && vs.some((v) => /Chart$|tableEx/.test(v.visual.visualType) && v.position.x <= lineSlot.x + 1 && v.position.x + v.position.width >= lineSlot.x + lineSlot.w - 1 && Math.abs(v.position.y - lineSlot.y) <= 60);
    chk(() => lineSlot && !vs.some((v) => v.visual.visualType === 'lineChart') && lo.some((l) => /no month or date column/.test(l.why)) && covers,
      () => `S2. no date column: no line chart, its room taken: ${JSON.stringify(lo)} ${JSON.stringify(vs.filter((v) => /Chart$|tableEx/.test(v.visual.visualType)).map((v) => [v.visual.visualType, v.position.x, v.position.y, v.position.width]))} ${short(x)}`);
  }

  // ---- Round 23, part 8: the reviewer's review of part 7 (11:42 UTC), each red first ----
  // P1. Every chart that opens the category tooltip filters it by its own category: without a trend page every chart
  //     opens it, so the tooltip's measure must reach the second category's table too (Hub), else the main measure
  {
    const T = [{ name: 'Hub', columns: [{ name: 'Hub Key', dataType: 'int64' }, { name: 'Hub Zone', dataType: 'string' }], measures: [] },
      { name: 'Lane', columns: [{ name: 'Lane Key', dataType: 'int64' }, { name: 'Lane Region', dataType: 'string' }], measures: [] },
      { name: 'Shipments', columns: [{ name: 'Hub Key', dataType: 'int64' }, { name: 'Lane Key', dataType: 'int64' }, { name: 'Amount', dataType: 'double' }], measures: [{ name: 'Shipments Amount', expr: 'SUM ( Shipments[Amount] )' }] },
      { name: 'Deliveries', columns: [{ name: 'Lane Key', dataType: 'int64' }, { name: 'Qty', dataType: 'double' }], measures: [{ name: 'Delivered Qty', expr: 'SUM ( Deliveries[Qty] )' }] }];
    const rels = [{ fromTable: 'Shipments', toTable: 'Hub' }, { fromTable: 'Shipments', toTable: 'Lane' }, { fromTable: 'Deliveries', toTable: 'Lane' }];
    const b = Bn.suggest(T, 2, { relationships: rels, modelTables: T });
    chk(() => b.tip && b.tip.cat && b.cats.column && b.tip.cat.t !== b.cats.column.t && b.tip.y && b.tip.y.m === 'Shipments Amount', () => `P1. the tooltip's measure reaches every category that opens it: cat ${JSON.stringify(b.tip && b.tip.cat)} column ${JSON.stringify(b.cats.column)} y ${JSON.stringify(b.tip && b.tip.y)}`);
  }
  // P3. A date column in a table the measure does not reach (no marked calendar): the reason names it ("no date column
  //     is related to Sales"), not "the model has no month or date column"
  {
    modelR('r23-nodaterel', [{ name: 'Region', partitions: mp('Region'), columns: [col('Region Key', 'int64'), col('Region', 'string')] },
      { name: 'Sales', partitions: mp('Sales'), columns: [col('Region Key', 'int64'), col('Channel', 'string'), col('Amount', 'double')], measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }] },
      { name: 'Orders', partitions: mp('Orders'), columns: [col('Order Date', 'dateTime'), col('Qty', 'double')] }], [rel('Sales', 'Region Key', 'Region', 'Region Key')]);
    const pl = await ask('plan_layout', { layout: 'exec', kpis: 1, filters: 'end', lang: 'en' });
    const x = pl.err ? pl : await ask('create_report', { path: 'r23-nodaterel', name: 'R23 nodaterel', lang: 'en', design: pl.j.design, secondPage: false, noDataMessage: false });
    const lo = x.err ? [] : (x.j.leftOutVisuals || []);
    chk(() => lo.some((l) => /^Line chart/.test(l.visual) && /no date column is related to Sales/.test(l.why)), () => `P3. the reason names the unrelated date column: ${JSON.stringify(lo)} ${short(x)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const HERE = path.dirname(fileURLToPath(import.meta.url));
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js'), { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r23-')), problems = []; let checks = 0;
  const client = new Client({ name: 'test-r23', version: '1' });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [path.join(HERE, 'server.mjs')], env: { ...process.env, DATAARCUS_ROOT: ROOT }, stderr: 'ignore' }));
  const call = async (name, args) => { const r = await client.callTool({ name, arguments: args }); const t = r.content[0].text; return { err: !!r.isError, t, j: r.isError ? null : JSON.parse(t) }; };
  await round23({ call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await client.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  round23  ${checks} checks\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  round23  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
