// 0.2.9 audit fixes, the field picker's block (the owner: every audit finding fixed before the beta; builder 7's
// audits mcp/work/audit-3-picker-writer.md and audit-6-mcp-tools.md on fix/0.2.9-checks). Written red first, in
// batches, one commit per item. Ordinary names (retail, HR, French), none of the portfolio's.
// test.mjs runs it with its own client (import { v029p }); run alone it starts the server itself:
//   node test-0.2.9p.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

export async function v029p({ call, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args) => { try { return await call(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
  const ms = (name, expression, formatString) => Object.assign({ name, expression }, formatString ? { formatString } : {});
  const model = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
  const B = req('../assets/js/pbip-bind.js');
  const tablesOf = (tables) => B.fromTmsl({ model: { tables } });

  // ---------- A6-15: a month column without a sort column is noted, by the picker's facts, not a word list ----------
  model('p-news', [
    { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Month Announced', 'string'), col('Year', 'int64')] },
    { name: 'Releases', partitions: mp('Releases'), columns: [col('Released', 'dateTime'), col('Channel', 'string')], measures: [ms('Releases', 'COUNTROWS ( Releases )', '#,0')] }],
    [{ name: 'r', fromTable: 'Releases', fromColumn: 'Released', toTable: 'Calendar', toColumn: 'Date' }]);
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 'p-news' });
    const x = await ask('create_report', { path: 'p-news', name: 'P news', design: pl.j && pl.j.design, fields: { kpis: ['Releases[Releases]'], measure: 'Releases[Releases]', timeAxis: 'Calendar[Month Announced]', category: 'Releases[Channel]' }, noDataMessage: false, secondPage: false });
    chk(() => !x.err && (x.j.modelNotes || []).some((n) => n.field === 'Calendar[Month Announced]'), () => `A6-15: "Month Announced" (a month text with no sort-by column) must be noted: ${JSON.stringify(x.j && x.j.modelNotes)} ${short(x)}`);
  }

  // ---------- A3-5: a time variant is never a headline before a base measure; an average is no variant ----------
  {
    const t = tablesOf([{ name: 'Sales', columns: [col('Amount', 'double'), col('Order', 'string'), col('Region', 'string')],
      measures: [ms('Sales LY', 'CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( Sales[Date] ) )', '#,0'), ms('Average Order Value', 'DIVIDE ( [Total Sales], [Total Orders] )', '#,0.00'),
        ms('Total Sales', 'SUM ( Sales[Amount] )', '#,0'), ms('Total Orders', 'DISTINCTCOUNT ( Sales[Order] )', '#,0')] }]);
    const k = B.suggest(t, 3).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k.length === 3 && !k.includes('Sales LY') && k.includes('Average Order Value'), () => `A3-5: 3 cards must be the base measures (Average Order Value is no variant), never Sales LY first: ${JSON.stringify(k)}`);
    const k4 = B.suggest(t, 4).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k4[3] === 'Sales LY', () => `A3-5: a variant comes after every base measure: ${JSON.stringify(k4)}`);
  }

  // ---------- A3-6: the rank by shape first, in any language; a measure the others build on ranks higher ----------
  {
    const t = tablesOf([{ name: 'Ventes', columns: [col('Montant', 'double'), col('Commande', 'string'), col('Ville', 'string')],
      measures: [ms('Indice de satisfaction', 'AVERAGE ( Ventes[Montant] ) / 10', '0.0'), ms('Taux de conversion', 'DIVIDE ( [Nombre de commandes], 1000 )', '0.0%'),
        ms('Panier moyen', 'DIVIDE ( [Chiffre d\'affaires], [Nombre de commandes] )', '#,0.00'),
        ms('Chiffre d\'affaires', 'SUM ( Ventes[Montant] )', '"EUR" #,0'), ms('Nombre de commandes', 'DISTINCTCOUNT ( Ventes[Commande] )', '#,0')] }]);
    const k = B.suggest(t, 3).kpis.filter(Boolean).map((x) => x.m);
    chk(() => k[0] === 'Chiffre d\'affaires' && k[1] === 'Nombre de commandes', () => `A3-6: a French model: the plain sum and count first (no English word helps): ${JSON.stringify(k)}`);
    const src = fs.readFileSync(path.join(REPO, 'assets/js/pbip-bind.js'), 'utf8');
    chk(() => /const TIEBREAK_WORDS = /.test(src) && !/const MAIN = /.test(src), () => 'A3-6: the name words are one named tie-break list (TIEBREAK_WORDS), not a main rank');
  }

  // ---------- A3-8 + A3-7 (picker side): each category says whether it is time, and a calendar's kind, rows and family ----------
  {
    const t = tablesOf([
      { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Day Name', 'string'), col('Day of Week', 'int64'),
        col('Hijri Month Name', 'string', { sortByColumn: 'Hijri Month' }), col('Hijri Month', 'int64'), col('Quarter', 'string'), col('Day Type', 'string')] },
      { name: 'Sales', columns: [col('Amount', 'double'), col('Order Date', 'dateTime'), col('Region', 'string'), col('Period Status', 'string')], measures: [ms('Total Sales', 'SUM ( Sales[Amount] )', '#,0')] }]);
    const pool = {}; B.suggest(t, 1).catPool.concat(Object.values(B.suggest(t, 1).cats || {})).filter(Boolean).forEach((f) => { pool[f.c] = f; });
    const fo = (tn, c) => B.fieldOf(t.find((x) => x.name === tn), c);
    chk(() => fo('Calendar', 'Month Name').time === true && fo('Calendar', 'Day Type').time === true && fo('Sales', 'Region').time === false && fo('Sales', 'Period Status').time === false,
      () => `A3-8: a category of the date table, or one sorted by a number, is time; a fact table's text is not, whatever its name ("Period Status"): ${JSON.stringify(['Month Name', 'Day Type'].map((c) => fo('Calendar', c)).concat(['Region', 'Period Status'].map((c) => fo('Sales', c))))}`);
    const cal = (c) => (fo('Calendar', c) || {}).cal || {};
    chk(() => cal('Month Name').kind === 'month' && cal('Month Name').rows === 12 && cal('Month Name').family === 'english' && cal('Day Name').kind === 'day' && cal('Day Name').rows === 7
      && cal('Hijri Month Name').family === 'hijri' && cal('Hijri Month Name').rows === 12 && cal('Quarter').kind === 'quarter' && cal('Quarter').rows === 4,
      () => `A3-7: the calendar's kind, rows and family: ${JSON.stringify(['Month Name', 'Day Name', 'Hijri Month Name', 'Quarter'].map(cal))}`);
    const ar = tablesOf([{ name: 'التقويم', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('اسم الشهر', 'string', { sortByColumn: 'رقم الشهر' }), col('رقم الشهر', 'int64')] }]);
    chk(() => (B.fieldOf(ar[0], 'اسم الشهر').cal || {}).family === 'arabic', () => `A3-7: an Arabic month name's family is arabic: ${JSON.stringify(B.fieldOf(ar[0], 'اسم الشهر'))}`);
    const built = B.suggest(t, 1), axis = built.date;
    chk(() => axis && axis.time === true && axis.cal && axis.cal.rows === 12, () => `A3-7/A3-8: the bound fields carry the marks: ${JSON.stringify(axis)}`);
  }

  // ---------- A3-9: one documented field shape, no hidden properties, no cache on the caller's options ----------
  {
    const src = fs.readFileSync(path.join(REPO, 'assets/js/pbip-bind.js'), 'utf8');
    chk(() => /@typedef \{Object\} Field/.test(src) && !/Object\.defineProperty\(|Object\.defineProperties\(/.test(src), () => 'A3-9: a JSDoc typedef for the field, and no hidden (non-enumerable) properties: a side table (WeakMap) instead');
    const t = tablesOf([{ name: 'Sales', columns: [col('Amount', 'double'), col('Region', 'string')], measures: [ms('Total Sales', 'SUM ( Sales[Amount] )', '#,0')] }]);
    const opt = { relationships: [{ fromTable: 'Sales', toTable: 'Sales' }], modelTables: t };
    B.suggest(t, 1, opt);
    chk(() => Object.getOwnPropertyNames(opt).sort().join() === 'modelTables,relationships', () => `A3-9: the picker leaves the caller's options as they were: ${Object.getOwnPropertyNames(opt)}`);
    chk(() => typeof B.exprOf === 'function' && /SUM/.test(B.exprOf(t[0].measures[0])) && !JSON.stringify(t).includes('SUM ('), () => 'A3-9: a measure\'s DAX is read through exprOf, never a property a copy keeps or loses');
  }

  // ---------- Seen, not in scope (picker): names with "]" keep their own keys ----------
  {
    const t = tablesOf([{ name: 'Sales', columns: [col('City', 'string'), col('City (Arabic)', 'string'), col('A]B', 'string'), col('A', 'string')], measures: [ms('Total', 'SUM ( Sales[x] )', '#,0')] }]);
    const lk = B.langsOf(t), keys = Object.keys(lk);
    chk(() => typeof B.fieldKey === 'function' && B.fieldKey('Sales', 'A]B') !== B.fieldKey('Sales]A', 'B') && keys.includes(B.fieldKey('Sales', 'A]B')), () => `the field keys must be unambiguous for a name with "]": ${JSON.stringify(keys)}`);
  }

  // ---------- A3-3: one format rule (field-meaning.js formatOf), which the picker's card and table formats come from ----------
  {
    const FM = req('../assets/js/field-meaning.js'), Fix = req('../assets/js/model-health-tmdl.js');
    const src = (f) => fs.readFileSync(path.join(REPO, f), 'utf8');
    chk(() => typeof FM.formatOf === 'function' && typeof FM.reportFormatOf === 'function' && Fix.formatOf === FM.formatOf && !/function formatOf\(/.test(src('assets/js/model-health-tmdl.js')),
      () => 'A3-3: formatOf (and the report\'s reportFormatOf) live in field-meaning.js; the health engine uses that one');
    const s = src('mcp/server.mjs');
    chk(() => !/withRightFormats|cardFormatOf|function reportFormatOf|const rightOf/.test(s), () => 'A3-3: the server keeps no format rule of its own (withRightFormats, cardFormatOf, reportFormatOf, rightOf)');
    // a model the website's picker reads: the formats it gives are the rule's, with no server after it
    const t = tablesOf([{ name: 'Visits', columns: [col('Visit', 'string'), col('Visited', 'dateTime'), col('Pages', 'int64'), col('Clinic', 'string')],
      measures: [ms('Visit Count', 'COUNTROWS ( Visits )', '#,0.00'), ms('Return Rate', 'DIVIDE ( [Returns], [Visit Count] )'), ms('Returns', 'CALCULATE ( [Visit Count], Visits[Clinic] = "x" )', '#,0'),
        ms('Total Margin', 'SUM ( Visits[Pages] )'), ms('Wait Share', 'DIVIDE ( 1, 2 )', '0.00%')] }]);
    const card = (b, n) => (b.kpis || []).concat(b.table || []).find((k) => k && k.m === n) || {};
    const b = B.suggest(t, 5);
    chk(() => card(b, 'Visit Count').wholeFormat === '#,0' && !card(b, 'Visit Count').pct && card(b, 'Return Rate').pct === true && card(b, 'Return Rate').pctFormat === '0.0%'
      && !card(b, 'Total Margin').pct && card(b, 'Wait Share').pctFormat === '0.0%',
      () => `A3-3: the cards' formats by the one rule (a count with decimals shows whole, a rate without a format 0.0%, "Total Margin" = SUM no percent, 0.00% shown 0.0%): ${JSON.stringify(b.kpis)}`);
    const full = B.suggest(t, 5, { kpiValues: 'full' }), plain = full.kpis.find((k) => k && k.m === 'Total Margin');
    chk(() => plain && plain.cardFormat === '#,0' && !(b.kpis.find((k) => k && k.m === 'Total Margin') || {}).cardFormat && !(full.kpis.find((k) => k && k.m === 'Return Rate') || {}).cardFormat,
      () => `A3-3: with kpiValues "full" a card carries the rule's number format (never on a percent; none without "full"): ${JSON.stringify(full.kpis)}`);
    const tb = typeof B.measureOf === 'function' ? B.build(Object.assign({}, b.choices, { table: [B.fieldOf(t[0], 'Visited'), B.measureOf(t[0], 'Visit Count', t), B.measureOf(t[0], 'Wait Share', t)] })) : { table: [] };
    const tf = (x) => (tb.table.find((f) => f.c === x || f.m === x) || {}).tableFormat;
    chk(() => tf('Visited') === 'dd mmm yyyy' && tf('Visit Count') === '#,0' && tf('Wait Share') === '0.0%',
      () => `A3-3: a table's fields carry the rule's format (a date without a format dd mmm yyyy, a count #,0, 0.00% as 0.0%), pinned with the picker's own field builders (fieldOf, measureOf): ${JSON.stringify(tb.table)}`);
  }

  // ---------- A3-2: the server's picker rules in the picker: suggest(tables, n, { pinned, excludeColumns, lang, axisFor }) ----------
  {
    const t = tablesOf([
      { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Year', 'int64'), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'),
        col('Month Name (Arabic)', 'string', { sortByColumn: 'Month Number' }), col('Day Name', 'string'), col('Day of Week', 'int64'), col('Day Short', 'string', { sortByColumn: 'Day of Week' }),
        col('Day Name (Arabic)', 'string'), col('Hijri Month Name', 'string', { sortByColumn: 'Hijri Month' }), col('Hijri Month', 'int64'), col('Is Festival', 'boolean'), col('Festival Day', 'int64')] },
      { name: 'Bookings', columns: [col('Booked', 'dateTime'), col('Venue', 'string'), col('Channel', 'string'), col('Guests', 'int64')], measures: [ms('Total Guests', 'SUM ( Bookings[Guests] )', '#,0'), ms('Bookings', 'COUNTROWS ( Bookings )', '#,0')] }]);
    const cal = t.find((x) => x.name === 'Calendar'), bk = t.find((x) => x.name === 'Bookings');
    const keys = (l) => (l || []).filter(Boolean).map((f) => `${f.t}[${f.c != null ? f.c : f.m}]`);
    // a page filter keeps a flag true: the time axis runs by the flag's own day column ("Festival Day"), found by the flag's word, not a fixed name
    const fest = B.suggest(t, 2, { axisFor: [{ t: 'Calendar', c: 'Is Festival', values: [true] }], excludeColumns: [{ t: 'Calendar', c: 'Year' }] });
    chk(() => fest.date && fest.date.c === 'Festival Day' && fest.axisBy && fest.axisBy.c === 'Festival Day',
      () => `A3-2: a flag kept true by a page filter: the axis by its day column (Is Festival -> Festival Day): ${JSON.stringify({ date: fest.date, axisBy: fest.axisBy })}`);
    chk(() => !keys(fest.slicers).includes('Calendar[Year]') && keys(fest.excluded).includes('Calendar[Year]') && fest.slicers.filter(Boolean).length === 3,
      () => `A3-2: no slicer on a column a page filter fixes, the next column in its place, and the column named: ${JSON.stringify({ slicers: keys(fest.slicers), excluded: fest.excluded })}`);
    const pinnedAxis = B.suggest(t, 2, { axisFor: [{ t: 'Calendar', c: 'Is Festival', values: [true] }], pinned: { date: B.fieldOf(cal, 'Month Name') } });
    chk(() => pinnedAxis.date && pinnedAxis.date.c === 'Month Name' && !pinnedAxis.axisBy, () => `A3-2: an axis the plan names stays: ${JSON.stringify(pinnedAxis.date)}`);
    // pinned fields: kept as named, through the picker's own builder (a table's measures keep their formats)
    const pin = B.suggest(t, 2, { pinned: { kpis: [B.measureOf(bk, 'Bookings', t)], catA: B.fieldOf(cal, 'Day Name'), table: [B.fieldOf(bk, 'Venue'), B.measureOf(bk, 'Bookings', t)] } });
    chk(() => keys(pin.kpis).join() === 'Bookings[Bookings]' && pin.cats.bar.c === 'Day Name' && keys(pin.table).join() === 'Bookings[Venue],Bookings[Bookings]' && pin.table[1].wholeFormat === '#,0' && !pin.catPool,
      () => `A3-2: pinned KPIs, category and table kept as named, with their formats; no other category on the charts: ${JSON.stringify({ kpis: pin.kpis, bar: pin.cats.bar, table: pin.table, catPool: pin.catPool })}`);
    // Day Short: the day name's short twin of the same family, found by shape (a short day name of the same calendar)
    chk(() => pin.cats.bar.short && pin.cats.bar.short.c === 'Day Short' && pin.cats.bar.short.ordered === true,
      () => `A3-2: a day-name category carries its calendar's short day name, sorted as the calendar sorts it: ${JSON.stringify(pin.cats.bar)}`);
    // Arabic: the calendar's Arabic name columns in place of the English ones, pinned or picked, with their own sort
    const ar = B.suggest(t, 2, { lang: 'ar', pinned: { catA: B.fieldOf(cal, 'Day Name'), slicers: [B.fieldOf(cal, 'Hijri Month Name')] } });
    chk(() => ar.date && ar.date.c === 'Month Name (Arabic)' && ar.cats.bar.c === 'Day Name (Arabic)' && ar.cats.bar.sortBy && ar.cats.bar.sortBy.c === 'Day of Week' && !ar.cats.bar.short,
      () => `A3-2: an Arabic report takes the calendar's Arabic names (axis and the plan's category), sorted by the calendar's number; no English short name: ${JSON.stringify({ date: ar.date, bar: ar.cats.bar })}`);
    chk(() => keys(ar.calendarNames).includes('Calendar[Hijri Month Name]'), () => `A3-2: a calendar name with no Arabic column is named (calendarNames): ${JSON.stringify(ar.calendarNames)}`);
    // the server and the plan's lint keep no picker rule of their own
    const s = fs.readFileSync(path.join(REPO, 'mcp/server.mjs'), 'utf8'), pl = fs.readFileSync(path.join(REPO, 'mcp/lib/plan-lint.mjs'), 'utf8');
    chk(() => !/Day Short|ARABIC_OF|ramadan\\s\*day|F\.table\.map/.test(s) && !/F\.table\.map|Bind\.build\(/.test(pl) && /countBind = [^\n]*\n?[^\n]*Bind\.build\(/.test(s),
      () => 'A3-2: no Gulf-calendar names or Ramadan rule in the server, no copy of build\'s field mapper in the server or the plan\'s lint, and the counted binding goes through build');
    // the picker's field map keeps shared fields shared and changes no field of the binding it maps
    const b0 = B.suggest(t, 2), mapped = typeof B.mapFields === 'function' ? B.mapFields(b0, (f) => Object.assign({}, f, { name: 'x' })) : null;
    chk(() => mapped && mapped.cats.bar.name === 'x' && mapped.cats.bar === mapped.cats.donut && b0.cats.bar.name === undefined && b0.kpis.every((k) => !k || k.name === undefined),
      () => 'A3-2: mapFields (the server\'s display names) gives copies, shared where the binding shares a field, and never changes the picker\'s fields');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029p-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029p({ call: withPlans(s.call), check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029p  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029p  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
