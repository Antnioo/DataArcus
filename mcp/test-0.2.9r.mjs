// 0.2.9 picker round 8 (the laptop's re-score, 12 Oct: rc.3 at 6.8, the owner's target 7.5; RESCORE-1's picker items
// N1, N4, N5 with D5, D6, D11, D14, D17). Each fixed at the root by formula, format, data type, metadata and shape,
// never by those models' names; values are never read. Written red first. Synthetic models only.
// test.mjs runs it (import { v029r }); run alone:
//   node test-0.2.9r.mjs
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const req = createRequire(import.meta.url);

export async function v029r({ check }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const B = req('../assets/js/pbip-bind.js');
  const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
  const ms = (name, expression, formatString, extra) => Object.assign({ name, expression }, formatString ? { formatString } : {}, extra || {});
  const model = (tables, relationships) => ({ model: { tables, relationships: relationships || [] } });
  const pick = (json, n, opt) => { const t = B.fromTmsl(json); return B.suggest(t, n, Object.assign({ modelTables: t, relationships: B.relsOfTmsl(json) }, opt || {})); };
  const names = (l) => (l || []).filter(Boolean).map((x) => x.m != null ? x.m : x.c);
  const rel = (from, fc, to, tc) => ({ name: from + to, fromTable: from, fromColumn: fc, toTable: to, toColumn: tc });

  // ---------- N1: a text column of identifiers or contact details is never a chart category or the table's first column
  // when a better category exists: by the model's metadata (a key, a relationship's key, a web or image link, a barcode)
  // and by formula (a calculated column that joins several columns, or breaks lines: a free-text label) ----------
  {
    const j = model([{ name: 'Desk', columns: [col('Agent', 'string'), col('Mail', 'string'), col('Phone', 'string'), col('Team', 'string'),
      col('Agent Card', 'string', { type: 'calculated', expression: 'Desk[Agent] & UNICHAR ( 10 ) & Desk[Mail] & " " & Desk[Phone]' }),
      col('Badge', 'string', { isKey: true }), col('Photo', 'string', { dataCategory: 'ImageUrl' }), col('Profile', 'string', { dataCategory: 'WebUrl' })] },
    { name: 'Calls', columns: [col('Badge', 'string'), col('Seconds', 'double'), col('Outcome', 'string')],
      measures: [ms('Calls Handled', 'COUNTROWS ( Calls )', '#,0'), ms('Talk Time', 'SUM ( Calls[Seconds] )', '#,0')] }],
    [rel('Calls', 'Badge', 'Desk', 'Badge')]);
    const b = pick(j, 2), ch = b.choices || {}, used = [ch.catA, ch.catB].concat(b.table ? [b.table[0]] : []).filter(Boolean).map((x) => x.c);
    const bad = ['Agent Card', 'Badge', 'Photo', 'Profile'];
    chk(() => used.length && used.every((c) => !bad.includes(c)), () => `N1: no key, link or joined free-text column as a category or the table's first column: ${JSON.stringify(used)}`);
    // a join on a readable name alone (the region's table has no other text column) keeps that name a category
    const g = model([{ name: 'Regions', columns: [col('Region', 'string'), col('Target', 'double')] }, { name: 'Sales', columns: [col('Region', 'string'), col('Amount', 'double')],
      measures: [ms('Revenue', 'SUM ( Sales[Amount] )', '\\$#,0')] }], [rel('Sales', 'Region', 'Regions', 'Region')]);
    chk(() => ((pick(g, 1).choices || {}).catA || {}).c === 'Region', () => `N1: a relationship on a readable name alone stays a category: ${JSON.stringify((pick(g, 1).choices || {}).catA)}`);
    // the only text column a joined label: it stays (nothing better), so the chart is not left out
    const k = model([{ name: 'Desk', columns: [col('Agent', 'int64'), col('Agent Card', 'string', { type: 'calculated', expression: 'Desk[First] & " " & Desk[Last]' })],
      measures: [ms('Agents', 'COUNTROWS ( Desk )', '#,0')] }]);
    chk(() => (pick(k, 1).choices || {}).catA && pick(k, 1).choices.catA.c === 'Agent Card', () => `N1: with no better category, the joined label is still one: ${JSON.stringify((pick(k, 1).choices || {}).catA)}`);
  }

  // ---------- N4: the model's placeholder measure (no expression, BLANK (), a literal) is never a card ----------
  {
    const j = model([{ name: 'Cases', columns: [col('Opened', 'dateTime'), col('Kind', 'string')],
      measures: [ms('Measure', '', null), ms('Placeholder', 'BLANK ()', null), ms('Zero', '0', null), ms('Label', '"x"', null), ms('Total Cases', 'COUNTROWS ( Cases )', '#,0'),
        ms('Open Cases', 'CALCULATE ( COUNTROWS ( Cases ), Cases[Kind] = "Open" )', '#,0')] }]);
    const k = names(pick(j, 4).kpis);
    chk(() => !['Measure', 'Placeholder', 'Zero', 'Label'].some((m) => k.includes(m)) && k[0] === 'Total Cases', () => `N4: no placeholder measure on a card: ${JSON.stringify(k)}`);
    chk(() => !['Measure', 'Placeholder', 'Zero'].includes((pick(j, 4).choices || {}).main && pick(j, 4).choices.main.m), () => `N4: no placeholder as the charts' measure: ${JSON.stringify((pick(j, 4).choices || {}).main)}`);
  }

  // ---------- D6 + D14 + N5: never two cards with the same value; never a card that is always 100 % ----------
  {
    const j = model([{ name: 'Visits', columns: [col('Visit Id', 'string'), col('Ward', 'string'), col('Fee', 'double')],
      measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0'), ms('Visit Count', 'COUNT ( Visits[Visit Id] )', '#,0'),
        ms('All Patients', 'CALCULATE ( [Patients], ALL ( Visits ) )', '#,0'), ms('Every Visit', 'CALCULATE ( COUNTROWS ( Visits ), REMOVEFILTERS ( Visits[Ward] ) )', '#,0'),
        ms('Fees', 'SUM ( Visits[Fee] )', '\\$#,0'), ms('Fee %', '[Fees] / CALCULATE ( [Fees], ALL ( Visits ) )', '0%'),
        ms('Fee Share', 'DIVIDE ( SUM ( Visits[Fee] ), CALCULATE ( SUM ( Visits[Fee] ), ALLSELECTED () ) )', '0%'),
        ms('Avg Fee', 'AVERAGE ( Visits[Fee] )', '\\$#,0')] }]);
    const k = names(pick(j, 6).kpis);
    const counts = k.filter((m) => ['Patients', 'Visit Count', 'All Patients', 'Every Visit'].includes(m));
    chk(() => counts.length === 1, () => `D6/N5: one card for the visits' count (COUNTROWS, COUNT of the table, a CALCULATE of it under ALL): ${JSON.stringify(k)}`);
    chk(() => !k.includes('Fee %') && !k.includes('Fee Share'), () => `D14/N5: no card that is always 100 % (a measure over itself under ALL): ${JSON.stringify(k)}`);
  }

  // ---------- D5: a model with currency-formatted amounts shows an amount card first, by format, even when the amount is
  // computed across tables (RELATED) and the counts are plain ----------
  {
    const j = model([{ name: 'Items', columns: [col('Item', 'string'), col('List Price', 'double')] },
      { name: 'Orders', columns: [col('Item', 'string'), col('Qty', 'int64'), col('Channel', 'string')],
        measures: [ms('Order Lines', 'COUNTROWS ( Orders )', '#,0'), ms('Quantity', 'SUM ( Orders[Qty] )', '#,0'),
          ms('Sales Value', 'SUMX ( Orders, Orders[Qty] * RELATED ( Items[List Price] ) )', '\\$#,0.00'), ms('Return Rate', 'DIVIDE ( [Order Lines], [Quantity] )', '0.0%')] }],
    [rel('Orders', 'Item', 'Items', 'Item')]);
    const k = names(pick(j, 4).kpis);
    chk(() => k[0] === 'Sales Value', () => `D5: the currency amount is the first card: ${JSON.stringify(k)}`);
  }

  // ---------- D17: an unformatted amount beside currency cards is told (formatsMixed), as a dynamic-format one ----------
  {
    const j = model([{ name: 'Shop', columns: [col('Net', 'double'), col('Gross', 'double'), col('Store', 'string')],
      measures: [ms('Gross Sales', 'SUM ( Shop[Gross] )', '\\$#,0.00'), ms('Net Sales', 'SUM ( Shop[Net] )', null)] }]);
    const b = pick(j, 2);
    chk(() => names(b.kpis).includes('Net Sales') && (b.formatsMixed || []).some((x) => x.m === 'Net Sales'), () => `D17: an unformatted amount beside a currency card is told: ${JSON.stringify([names(b.kpis), b.formatsMixed])}`);
  }

  // ---------- D11: a category that holds two values (by its formula: one IF or SWITCH whose results are two texts) is
  // never the main chart's category while another exists ----------
  {
    const j = model([{ name: 'Days', columns: [col('Day', 'dateTime'),
      col('Day Kind', 'string', { type: 'calculated', expression: 'SWITCH ( TRUE (), WEEKDAY ( Days[Day], 2 ) > 5, "Weekend", "Weekday" )' }), col('Unit', 'string')],
      measures: [ms('Admissions', 'COUNTROWS ( Days )', '#,0')] }]);
    const ch = pick(j, 1).choices || {};
    chk(() => ch.catA && ch.catA.c === 'Unit', () => `D11: a two-value SWITCH column is not the main category: ${JSON.stringify(ch.catA)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = []; let checks = 0;
  await v029r({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  console.log(problems.length ? `FAIL  v029r  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029r  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
