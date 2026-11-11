// 0.3.3 IX1 (mcp/work/IX1.md): "Souq Gulf", HX1's made-up retail model and report (fixtures/hx1-souq.mjs) with the
// comparisons a Gulf analyst meets, in memory, for the like-for-like suite (test-0.3.3-ix1.mjs) and its demo
// (lab/ix1-like-for-like-demo.mjs). Made up from nothing: no employer or client data; no rows.
//   The model: Souq's 12 measures and 7 more: [Revenue PM] (DATEADD, a month back), [Units PY] (PARALLELPERIOD, 12
//   months back), [Cost LY] and [Revenue Prev Day] (comparisons no visual shows), [Revenue YTD] (time intelligence, no
//   comparison), [Revenue Last Ramadan] (the DAX Measure Builder's own Hijri pairing), [Label] (a string and a comment
//   that hold a function's name).
//   The report: Souq's 11 visuals and 6 more (a card on [Growth %], a card on a report measure with
//   SAMEPERIODLASTYEAR, a table by month with [Revenue PM] and [Units PY], cards on [Revenue YTD], [Revenue Last
//   Ramadan] and [Label]): 17 visuals, 16 with a query. 4 of them reach a comparison with the same Gregorian dates.
// gulfModel() and gulfReport() give a fresh copy each call, so a test changes its own.
import { createRequire } from 'node:module';
import { souqModel, souqReport, tableOf, colRef, msrRef, visual } from './hx1-souq.mjs';

const GM = createRequire(import.meta.url)('../../assets/js/gulf-measures.js');
// the Measure Builder's own 8 Ramadan and Eid measures for [Revenue] on Souq's calendar (never a comparison by Gregorian dates)
export const ramadanMeasures = () => GM.measuresFor({ base: 'Revenue', cal: 'Calendar' });

export function gulfModel() {
  const model = souqModel(), add = (name, expression, formatString) => tableOf(model, '_Measures').measures.push({ name, expression, formatString: formatString || '#,0' });
  add('Revenue PM', "CALCULATE ( [Revenue], DATEADD ( 'Calendar'[Date], -1, MONTH ) )");
  add('Units PY', 'CALCULATE ( [Units], PARALLELPERIOD ( Calendar[Date], -12, MONTH ) )');
  add('Cost LY', "CALCULATE ( [Cost], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )");
  add('Revenue Prev Day', "CALCULATE ( [Revenue], DATEADD ( 'Calendar'[Date], -1, DAY ) )");
  add('Revenue YTD', "TOTALYTD ( [Revenue], 'Calendar'[Date] )");
  add('Revenue Last Ramadan', ramadanMeasures().find((x) => x.id === 'ramLY').expression);
  add('Label', 'IF ( [Revenue] > 0, "SAMEPERIODLASTYEAR ( x )", "" ) // DATEADD ( Calendar[Date], -1, YEAR )\n/* PREVIOUSYEAR ( Calendar[Date] ) */', '');
  return model;
}

export function gulfReport() {
  const report = souqReport();
  report.files.push(
    { path: 'definition/reportExtensions.json', json: { name: 'extension', entities: [{ name: '_Measures', measures: [
      { name: 'Units LY (report)', dataType: 'Integer', expression: "CALCULATE ( [Units], SAMEPERIODLASTYEAR ( 'Calendar'[Date] ) )", formatString: '#,0' }] }] } },
    visual('overview', 'card-growth', 'card', { Values: [msrRef('Growth %')] }),
    visual('overview', 'card-units-ly-report', 'card', { Values: [msrRef('Units LY (report)')] }),
    visual('details', 'table-month-compare', 'tableEx', { Values: [colRef('Calendar', 'Month'), msrRef('Revenue'), msrRef('Revenue PM'), msrRef('Units PY')] }),
    visual('details', 'card-ytd', 'card', { Values: [msrRef('Revenue YTD')] }),
    visual('details', 'card-last-ramadan', 'card', { Values: [msrRef('Revenue Last Ramadan')] }),
    visual('details', 'card-label', 'card', { Values: [msrRef('Label')] })
  );
  return report;
}
