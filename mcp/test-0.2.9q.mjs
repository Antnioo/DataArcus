// 0.2.9 picker fixes from the rc's laptop proof (11 Oct: the rc scored 5.4 on nine real models, three worse than 0.2.8
// mainly by its picks). Each defect fixed at the root by formula, format and shape, never by those models' names.
// Written red first. Synthetic models only (shops, clinics, call desks, projects with ordinary names).
// test.mjs runs it with its own client (import { v029q }); run alone it starts the server itself:
//   node test-0.2.9q.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const req = createRequire(import.meta.url);

export async function v029q({ check }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const B = req('../assets/js/pbip-bind.js');
  const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
  const ms = (name, expression, formatString, extra) => Object.assign({ name, expression }, formatString ? { formatString } : {}, extra || {});
  const model = (tables, relationships) => ({ model: { tables, relationships: relationships || [] } });
  const pick = (json, n, opt) => { const t = B.fromTmsl(json); return B.suggest(t, n, Object.assign({ modelTables: t, relationships: B.relsOfTmsl(json) }, opt || {})); };
  const names = (l) => (l || []).filter(Boolean).map((x) => x.m != null ? x.m : x.c);
  const cal = { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] };
  const rel = (from, fc, to, tc) => ({ name: from + to, fromTable: from, fromColumn: fc, toTable: to, toColumn: tc });

  // ---------- S4: a time-intelligence measure (or one built on it) is never a KPI card: without a period it says "No data" ----------
  {
    const j = model([cal, { name: 'Sales', columns: [col('Amount', 'double'), col('Order Date', 'dateTime'), col('Region', 'string')],
      measures: [ms('Total Revenue', 'SUM ( Sales[Amount] )', '\\$#,0'), ms('Orders', 'COUNTROWS ( Sales )', '#,0'),
        ms('Revenue PY', 'CALCULATE ( [Total Revenue], SAMEPERIODLASTYEAR ( Calendar[Date] ) )', '\\$#,0'),
        ms('Revenue Growth %', 'DIVIDE ( [Total Revenue] - [Revenue PY], [Revenue PY] )', '0.0%')] }], [rel('Sales', 'Order Date', 'Calendar', 'Date')]);
    const k = names(pick(j, 4).kpis);
    chk(() => !k.includes('Revenue PY') && !k.includes('Revenue Growth %') && k.includes('Total Revenue'), () => `S4: no card for a period measure or one built on it: ${JSON.stringify(k)}`);
  }

  // ---------- D4: a what-if parameter's value (the slicer's selection) is never a card ----------
  // ---------- D2: a helper measure (a Top N threshold, a rank) is never a card or a table column ----------
  {
    const j = model([{ name: 'Price Change', columns: [col('Price Change', 'double')], measures: [ms('Price Change Value', 'SELECTEDVALUE ( \'Price Change\'[Price Change], 0 )', '0%')] },
      { name: 'Sales', columns: [col('Amount', 'double'), col('Region', 'string'), col('Item', 'string')],
        measures: [ms('Total Revenue', 'SUM ( Sales[Amount] )', '\\$#,0'), ms('Top 5 Min Revenue', 'MINX ( TOPN ( 5, VALUES ( Sales[Region] ), [Total Revenue] ), [Total Revenue] )', '#,0'),
          ms('Region Rank', 'RANKX ( ALL ( Sales[Region] ), [Total Revenue] )', '0'), ms('Items Sold', 'DISTINCTCOUNT ( Sales[Item] )', '#,0')] }]);
    const b = pick(j, 4), k = names(b.kpis), tb = names(b.table);
    chk(() => !k.includes('Price Change Value'), () => `D4: a what-if parameter's value is no card: ${JSON.stringify(k)}`);
    chk(() => !k.includes('Top 5 Min Revenue') && !k.includes('Region Rank') && !tb.includes('Top 5 Min Revenue') && !tb.includes('Region Rank'), () => `D2: a Top N or rank helper is no card and no table column: ${JSON.stringify({ k, tb })}`);
  }

  // ---------- D5 + D13: the core amounts (money by format, or a sum of a decimal column) come before counts and quantities ----------
  {
    const j = model([{ name: 'Projects', columns: [col('Project', 'string'), col('Budget', 'double'), col('Planned', 'double'), col('Status', 'string')],
      measures: [ms('Total Projects', 'COUNTROWS ( Projects )', '#,0'), ms('Total Statuses', 'DISTINCTCOUNT ( Projects[Status] )', '#,0'),
        ms('Actual Budget', 'SUM ( Projects[Budget] )', '#,0'), ms('Planned Cost', 'SUM ( Projects[Planned] )', '#,0')] }]);
    const k = names(pick(j, 3).kpis);
    chk(() => k[0] === 'Actual Budget' && k[1] === 'Planned Cost', () => `D5/D13: the amounts first, then the counts: ${JSON.stringify(k)}`);
    const s = model([{ name: 'Lines', columns: [col('Qty', 'int64'), col('Price', 'double'), col('Shop', 'string')],
      measures: [ms('Units', 'SUM ( Lines[Qty] )', '#,0'), ms('Line Count', 'COUNTROWS ( Lines )', '#,0'), ms('Revenue', 'SUMX ( Lines, Lines[Qty] * Lines[Price] )', '\\$#,0.00')] }]);
    const k2 = names(pick(s, 2).kpis);
    chk(() => k2[0] === 'Revenue', () => `D5: a currency SUMX (revenue) before a quantity and a count: ${JSON.stringify(k2)}`);
  }

  // ---------- D6 + D14: never two cards with the same value; never a "% of all" card (always 100 % on the page) ----------
  {
    const j = model([{ name: 'Calls', columns: [col('Call ID', 'string'), col('Seconds', 'double'), col('Desk', 'string')],
      measures: [ms('Calls Handled', 'COUNT ( Calls[Call ID] )', '#,0'), ms('Calls Answered', 'COUNTA ( Calls[Call ID] )', '#,0'), ms('Calls', '[Calls Handled]', '#,0'),
        ms('Share of All Calls', 'DIVIDE ( [Calls Handled], CALCULATE ( [Calls Handled], ALL ( Calls ) ) )', '0.0%'), ms('Talk Time', 'SUM ( Calls[Seconds] )', '#,0')] }]);
    const k = names(pick(j, 4).kpis);
    const same = ['Calls Handled', 'Calls Answered', 'Calls'].filter((n) => k.includes(n));
    chk(() => same.length === 1, () => `D6/D14: one card for the same count (the same column, or an alias): ${JSON.stringify(k)}`);
    chk(() => !k.includes('Share of All Calls'), () => `D14: a share of all is no card: ${JSON.stringify(k)}`);
  }

  // ---------- D7: never the same chart twice; D8: never two slicers on the same field name ----------
  {
    const j = model([{ name: 'Desks', columns: [col('Desk', 'string'), col('Desk ID', 'string')] },
      { name: 'Calls', columns: [col('Desk', 'string'), col('Shift', 'string'), col('Seconds', 'double'), col('Desk ID', 'string')], measures: [ms('Talk Time', 'SUM ( Calls[Seconds] )', '#,0')] }],
      [rel('Calls', 'Desk ID', 'Desks', 'Desk ID')]);
    const b = pick(j, 2), c = b.cats;
    chk(() => !(c.bar && c.column && c.bar.c.toLowerCase() === c.column.c.toLowerCase()), () => `D7: the bar and the column chart never by the same field (a field of the same name in two tables reads the same): ${JSON.stringify(c)}`);
    const sl = (b.slicers || []).filter(Boolean).map((x) => x.c.toLowerCase());
    chk(() => new Set(sl).size === sl.length, () => `D8: two slicers never on fields of the same name: ${JSON.stringify(b.slicers)}`);
  }

  // ---------- D9 + D10: a date-time column (time of day) is never the trend's axis or a slicer: its date, or the calendar ----------
  {
    const j = model([{ name: 'Visits', columns: [col('Arrival Date Time', 'dateTime', { formatString: 'General Date' }), col('Arrival Date', 'dateTime', { formatString: 'dd mmm yyyy' }), col('Ward', 'string')],
      measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0')] }]);
    const b = pick(j, 1), sl = (b.slicers || []).filter(Boolean).map((x) => x.c);
    chk(() => b.date && b.date.c === 'Arrival Date' && !sl.includes('Arrival Date Time'), () => `D9/D10: the date, never the time stamp: ${JSON.stringify({ date: b.date, sl })}`);
    const only = model([{ name: 'Visits', columns: [col('Arrival Timestamp', 'dateTime'), col('Ward', 'string')], measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0')] }]);
    const b2 = pick(only, 1), sl2 = (b2.slicers || []).filter(Boolean).map((x) => x.c);
    chk(() => !(b2.date && b2.date.c === 'Arrival Timestamp') && !sl2.includes('Arrival Timestamp'), () => `D9/D10: with a time stamp only, no trend or slicer by it: ${JSON.stringify({ date: b2.date, sl2 })}`);
  }

  // ---------- D11: a two-value category (true/false, or IF returning two words) is never a main chart's category when another exists ----------
  {
    const j = model([{ name: 'Visits', columns: [col('Ward', 'string'), col('Week Part', 'string', { type: 'calculated', expression: 'IF ( WEEKDAY ( Visits[Day], 2 ) > 5, "Weekend", "Weekday" )' }),
      col('Is Urgent', 'boolean'), col('Clinic', 'string'), col('Day', 'dateTime')], measures: [ms('Patients', 'COUNTROWS ( Visits )', '#,0')] }]);
    const c = pick(j, 1).cats, used = [c.bar, c.column].filter(Boolean).map((x) => x.c);
    chk(() => !used.includes('Week Part') && !used.includes('Is Urgent') && used.length >= 1, () => `D11: a two-value category is no main chart's: ${JSON.stringify(used)}`);
  }

  // ---------- S5: a column chart is not by a category with dozens of values (a lookup's own name, a city) when a smaller one exists ----------
  {
    const j = model([{ name: 'Products', columns: [col('Product Key', 'string'), col('Product Name', 'string'), col('Category', 'string')] },
      { name: 'Stores', columns: [col('Store Key', 'string'), col('City', 'string', { dataCategory: 'City' }), col('Region', 'string')] },
      { name: 'Sales', columns: [col('Amount', 'double'), col('Product Key', 'string'), col('Store Key', 'string')], measures: [ms('Revenue', 'SUM ( Sales[Amount] )', '\\$#,0')] }],
      [rel('Sales', 'Product Key', 'Products', 'Product Key'), rel('Sales', 'Store Key', 'Stores', 'Store Key')]);
    const c = pick(j, 1).cats, used = [c.bar, c.column].filter(Boolean).map((x) => x.c);
    chk(() => !used.includes('Product Name') && !used.includes('City') && used.length === 2, () => `S5: the charts by Category and Region, not by Product Name or City: ${JSON.stringify(used)}`);
  }

  // ---------- S8: the trend's month is never a number column: its name column (sorted by it), or the date ----------
  {
    const j = model([{ name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Month', 'int64'), col('Month Label', 'string', { sortByColumn: 'Month' }), col('Year', 'int64')] },
      { name: 'Sales', columns: [col('Amount', 'double'), col('Day', 'dateTime'), col('Region', 'string')], measures: [ms('Revenue', 'SUM ( Sales[Amount] )', '\\$#,0')] }],
      [rel('Sales', 'Day', 'Calendar', 'Date')]);
    const d = pick(j, 1).date;
    chk(() => d && d.c !== 'Month' && (d.c === 'Month Label' || d.c === 'Date'), () => `S8: the month's name column or the date, never the month number: ${JSON.stringify(d)}`);
  }

  // ---------- D17: a dynamic-format measure beside currency cards: after them, and told when it is a card ----------
  {
    const j = model([{ name: 'Sales', columns: [col('Amount', 'double'), col('Cost', 'double'), col('Local', 'double'), col('Region', 'string')],
      measures: [ms('Local Revenue', 'SUM ( Sales[Local] )', null, { formatStringDefinition: { expression: 'SELECTEDVALUE ( Sales[Region] )' } }),
        ms('Revenue', 'SUM ( Sales[Amount] )', '\\$#,0'), ms('Cost', 'SUM ( Sales[Cost] )', '\\$#,0')] }]);
    const k2 = names(pick(j, 2).kpis), b3 = pick(j, 3);
    chk(() => k2.join() === 'Revenue,Cost', () => `D17: the currency cards first: ${JSON.stringify(k2)}`);
    chk(() => names(b3.kpis).includes('Local Revenue') && (b3.formatsMixed || []).some((x) => x.m === 'Local Revenue'), () => `D17: a dynamic-format card beside currency cards is told (formatsMixed): ${JSON.stringify(b3.formatsMixed)}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = []; let checks = 0;
  await v029q({ check: (ok, msg) => { checks++; if (!ok) problems.push(msg); } });
  console.log(problems.length ? `FAIL  v029q  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029q  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
