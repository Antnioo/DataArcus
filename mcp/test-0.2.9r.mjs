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

  // ---------- N7 (rc.4, round 9): a column of picture or web addresses with no data category ("Img") is never a category, a
  // slicer or the table's first column while a better one exists: by its name's whole words; a word that only holds those
  // letters ("Pickup", "Logout", "Thumbs Up Count" aside) is no hit ----------
  {
    const j = model([{ name: 'Desk', columns: [col('Img', 'string'), col('Photo URL', 'string'), col('product_image', 'string'), col('LogoLink', 'string'), col('Thumbnail', 'string'),
      col('Pickup Point', 'string'), col('Team', 'string')] },
    { name: 'Calls', columns: [col('Team', 'string'), col('Seconds', 'double')], measures: [ms('Calls Handled', 'COUNTROWS ( Calls )', '#,0')] }]);
    const b = pick(j, 1), ch = b.choices || {}, used = [ch.catA, ch.catB].concat(ch.slicers || [], b.table ? [b.table[0]] : []).filter(Boolean).map((x) => x.c);
    const bad = ['Img', 'Photo URL', 'product_image', 'LogoLink', 'Thumbnail'];
    chk(() => used.length && used.every((c) => !bad.includes(c)) && used.includes('Pickup Point'), () => `N7: no picture or link column as a category, a slicer or the table's first column; "Pickup Point" stays one: ${JSON.stringify(used)}`);
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

  // ---------- N5 + D14 (rc.4, round 9): two more shapes: a row count over ALL of its table, and a share written as one
  // measure over another whose value is the same under ALL ----------
  {
    const j = model([{ name: 'Visits', columns: [col('Ward', 'string'), col('Fee', 'double')],
      measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0'), ms('All Patients', 'COUNTROWS ( ALL ( Visits ) )', '#,0'),
        ms('Revenue', 'SUM ( Visits[Fee] )', '\\$#,0'), ms('Revenue All', 'CALCULATE ( [Revenue], REMOVEFILTERS () )', '\\$#,0'),
        ms('Revenue %', 'DIVIDE ( [Revenue], [Revenue All] )', '0%'), ms('Avg Fee', 'AVERAGE ( Visits[Fee] )', '\\$#,0')] }]);
    const k = names(pick(j, 5).kpis);
    chk(() => k.filter((m) => ['Patients', 'All Patients'].includes(m)).length === 1 && k.filter((m) => ['Revenue', 'Revenue All'].includes(m)).length === 1 && !k.includes('Revenue %'),
      () => `N5/D14: COUNTROWS ( ALL ( T ) ) is the table's count; a measure over its own value under ALL is no card: ${JSON.stringify(k)}`);
  }

  // ---------- SHAPES-RC4 (the laptop's anonymised shapes, round 9) ----------
  {
    // N5: COUNTROWS ( T1 ) and COUNTROWS ( ALLSELECTED ( T1 ) ): the widened one is a denominator, never a card
    // D14: DIVIDE ( [m1], [m2] ), m2 = CALCULATE ( [m1], ALL ( T1[c1] ) ) or ALL ( T2[c2] ): a share of the total, no card
    const j = model([{ name: 'T2', columns: [col('c2', 'string')] }, { name: 'T1', columns: [col('c1', 'string'), col('k', 'string'), col('v', 'double')],
      measures: [ms('m2', 'COUNTROWS ( ALLSELECTED ( T1 ) )', '#,0'), ms('m1', 'COUNTROWS ( T1 )', '#,0'), ms('m4', 'CALCULATE ( [m1], ALL ( T1[c1] ) )', '#,0'),
        ms('m5', 'CALCULATE ( [m1], ALL ( T2[c2] ) )', '#,0'), ms('m3', 'DIVIDE ( [m1], [m4] )', '0.0%'), ms('m6', 'DIVIDE ( [m1], [m5] )', '0.0%'), ms('v sum', 'SUM ( T1[v] )', '#,0')] }],
    [rel('T1', 'k', 'T2', 'c2')]);
    const k = names(pick(j, 6).kpis);
    chk(() => k.includes('m1') && !['m2', 'm4', 'm5', 'm3', 'm6'].some((m) => k.includes(m)), () => `SHAPES N5/D14: only the plain count is a card (no widened copy, no share of the total): ${JSON.stringify(k)}`);
    // N7: a small people dimension: the name (the join key), a three-letter picture column, phone, e-mail, address and a
    // calculated glue column; the name stays the category, the others never are
    const p = model([{ name: 'People', columns: [col('Name', 'string'), col('Img', 'string'), col('Phone', 'string'), col('Email', 'string'), col('Address', 'string'),
      col('Card', 'string', { type: 'calculated', expression: 'People[Name] & " " & People[Phone]' })] },
    { name: 'Calls', columns: [col('Name', 'string'), col('Seconds', 'double')], measures: [ms('Calls', 'COUNTROWS ( Calls )', '#,0')] }],
    [rel('Calls', 'Name', 'People', 'Name')]);
    const b = pick(p, 1), ch = b.choices || {}, used = [ch.catA, ch.catB].concat(ch.slicers || [], b.table ? [b.table[0]] : []).filter(Boolean).map((x) => x.c);
    chk(() => ch.catA && ch.catA.c === 'Name' && !used.some((c) => ['Img', 'Phone', 'Email', 'Address', 'Card'].includes(c)), () => `SHAPES N7: the people's name is the category; no picture, contact or glue column: ${JSON.stringify(used)}`);
  }

  // ---------- round 10 (RESCORE-3 on rc.5, the final round): N10, N12, N5 on a hidden fenced denominator, D11 in ADDCOLUMNS ----------
  {
    // N10: a chart helper: a value only where it equals its own MAX over ALL ( ... ), else BLANK (): "No data" on a card
    const j = model([{ name: 'Cal', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Month', 'string')] },
      { name: 'Visits', columns: [col('Date', 'dateTime'), col('Ward', 'string')], measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0'),
        ms('Patients Max Value', 'VAR cur = [Patients]\nVAR mx = MAXX ( ALL ( Cal[Month] ), [Patients] )\nRETURN IF ( cur = mx, cur, BLANK () )', '#,0'),
        ms('Lowest Month', 'IF ( [Patients] = MINX ( ALLSELECTED ( Cal[Month] ), [Patients] ), [Patients] )', '#,0'), ms('Wards', 'DISTINCTCOUNT ( Visits[Ward] )', '#,0')] }],
    [rel('Visits', 'Date', 'Cal', 'Date')]);
    const k = names(pick(j, 4).kpis);
    chk(() => k.includes('Patients') && !k.includes('Patients Max Value') && !k.includes('Lowest Month'), () => `N10: a value shown only at its own max or min over ALL is no card: ${JSON.stringify(k)}`);
    // N12: a calendar's year (a calculated calendar the files give no types, not marked) is a time level: never a bar-chart
    // category, the table's first column or a default slicer from the categories
    const y = model([{ name: 'DimDate', columns: [col('Date', 'unknown'), col('Year', 'unknown'), col('Quarter', 'unknown'), col('Fiscal Year', 'unknown')] },
      { name: 'Calls', columns: [col('Date', 'unknown'), col('Agent', 'string'), col('Seconds', 'double')], measures: [ms('Calls', 'COUNTROWS ( Calls )', '#,0')] }],
    [rel('Calls', 'Date', 'DimDate', 'Date')]);
    const b = pick(y, 1), ch = b.choices || {}, used = [ch.catA, ch.catB].concat(b.table ? [b.table[0]] : []).filter(Boolean).map((x) => x.c);
    chk(() => ch.catA && ch.catA.c === 'Agent' && !used.some((c) => /year|quarter/i.test(c)), () => `N12: a year or quarter is never the chart's category or the table's first column: ${JSON.stringify(used)}`);
    // N5 (property): the denominator is hidden and written over several lines; the share's DIVIDE too
    const h = model([{ name: 'Rent', columns: [col('Amount', 'double'), col('Unit', 'string')],
      measures: [ms('Revenue', 'SUM ( Rent[Amount] )', '\\$#,0'), ms('Revenue Total', 'CALCULATE (\n    [Revenue],\n    ALL ( Rent )\n)', '\\$#,0', { isHidden: true }),
        ms('Revenue %', 'DIVIDE (\n    [Revenue],\n    [Revenue Total]\n)', '0%'), ms('Revenue Share', 'VAR t = [Revenue Total]\nRETURN\n    DIVIDE ( [Revenue], t )', '0%'),
        ms('Units', 'DISTINCTCOUNT ( Rent[Unit] )', '#,0')] }]);
    const kh = names(pick(h, 4).kpis);
    chk(() => kh.includes('Revenue') && !kh.includes('Revenue %') && !kh.includes('Revenue Share'), () => `N5: a share over a hidden, multi-line denominator (or one held in a VAR) is no card: ${JSON.stringify(kh)}`);
    // D11 (er): a two-value column of a calculated calendar, its IF in the table's ADDCOLUMNS
    const d = { model: { tables: [{ name: 'Days', columns: [col('Date', 'dateTime'), col('Week Type', 'unknown'), col('Day Name', 'unknown')],
      partitions: [{ name: 'Days', source: { type: 'calculated', expression: 'ADDCOLUMNS (\n    CALENDAR ( DATE ( 2024, 1, 1 ), DATE ( 2024, 12, 31 ) ),\n    "Week Type", IF ( WEEKDAY ( [Date], 2 ) > 5, "Weekend", "Weekday" ),\n    "Day Name", FORMAT ( [Date], "dddd" )\n)' } }] }], relationships: [] } };
    const dt = B.fromTmsl(d)[0], wt = B.fieldOf(dt, 'Week Type'), dn = B.fieldOf(dt, 'Day Name');
    chk(() => wt && wt.two === true && dn && !dn.two, () => `D11: a calendar column whose ADDCOLUMNS expression is an IF of two texts is two-valued: ${JSON.stringify([wt, dn])}`);
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
