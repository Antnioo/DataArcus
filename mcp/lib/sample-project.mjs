// 0.3.1 C (time to first value): the sample project a new user with no model can try DataArcus on. A made-up Gulf retail
// chain: a PBIP project with a TMDL model (four tables of typed rows, the labs' way: Desktop shows the data after one
// Refresh; X2's demo model, lab/bilingual-demo.mjs, widened) and an empty report. plan_layout with sample true proposes
// it (a plan of its own kind), create_report with sample true writes it after the person's approval, and its answer is
// the tour: the next requests, each one real DataArcus call on the sample.
// Every name and number is made up: no real company, mall, person or vehicle trade (test-0.3.1-sample-project C18).
// The rows are written into the model's files only; no answer holds them (the MCP never returns data values).
import crypto from 'node:crypto';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, nothingAt } from './model.mjs';
import { writeTree } from './files.mjs';

const { SCHEMA } = createRequire(import.meta.url)('../../assets/js/pbip-query.js');
export const SAMPLE_FOLDER = 'Gulf Retail Sample', SAMPLE_NAME = 'Gulf Retail', SAMPLE_REPORT = 'Gulf Retail Sales';
const FIRST = [2025, 1], MONTHS = 18;   // January 2025 to June 2026

// ---------- the made-up rows ----------
const BRANCHES = [['Pearl Bay', 'Dubai', 'United Arab Emirates'], ['Falcon Square', 'Abu Dhabi', 'United Arab Emirates'], ['Palm Grove', 'Sharjah', 'United Arab Emirates'],
  ['Oasis Point', 'Riyadh', 'Saudi Arabia'], ['Dune Gate', 'Doha', 'Qatar'], ['Coral Walk', 'Muscat', 'Oman']];
// [product, category, price in AED]: generic words, no brand
const PRODUCTS = [['Dates Gift Box', 'Grocery', 85], ['Arabic Coffee 500g', 'Grocery', 42], ['Saffron 5g', 'Grocery', 60], ['Majlis Cushion Set', 'Home', 320], ['Incense Burner', 'Home', 140],
  ['Air Fryer', 'Home', 390], ['Abaya Classic', 'Fashion', 450], ['Kandura Cotton', 'Fashion', 210], ['Oud Perfume 50ml', 'Beauty', 280], ['Rose Water 250ml', 'Beauty', 25],
  ['Wireless Earbuds', 'Electronics', 260], ['Smart Watch', 'Electronics', 690]];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const months = () => Array.from({ length: MONTHS }, (_, i) => { const n = FIRST[1] - 1 + i; return [FIRST[0] + Math.floor(n / 12), (n % 12) + 1]; });
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
// each month, each branch sells 6 of the 12 products (rotating), one row each; more in the Ramadan and Eid months
function salesRows() {
  const out = [];
  months().forEach(([y, mo], mi) => BRANCHES.forEach(([branch], b) => { for (let k = 0; k < 6; k++) {
    const [product, , price] = PRODUCTS[(mi + b + 2 * k) % 12], season = (y === 2025 && (mo === 3 || mo === 6)) || (y === 2026 && (mo === 2 || mo === 3)) ? 1.6 : 1;
    const units = Math.round((4 + ((b * 7 + k * 11 + mi * 5) % 21)) * season * (1 + mi / 40)), amount = Math.round(units * price * (0.9 + ((b + k + mi) % 5) / 50) * 100) / 100;
    out.push(`{#date(${y}, ${mo}, ${1 + ((b * 5 + k * 3 + mi) % 28)}), ${q(branch)}, ${q(product)}, ${q((b + k + mi) % 3 ? 'Store' : 'Online')}, ${amount}, ${units}, ${Math.max(1, Math.round(units / 2))}}`);
  } }));
  return out;
}
function calendarRows() {
  const out = [], [y0, m0] = FIRST, start = Date.UTC(y0, m0 - 1, 1), [yl, ml] = months()[MONTHS - 1], end = Date.UTC(yl, ml, 0);
  for (let t = start; t <= end; t += 86400000) {
    const d = new Date(t), y = d.getUTCFullYear(), mo = d.getUTCMonth() + 1;
    out.push(`{#date(${y}, ${mo}, ${d.getUTCDate()}), ${y}, ${q('Q' + Math.ceil(mo / 3))}, ${mo}, ${q(MONTH_NAMES[mo - 1])}, ${q(MONTH_NAMES[mo - 1].slice(0, 3) + ' ' + y)}, ${y * 100 + mo}}`);
  }
  return out;
}

// ---------- the TMDL ----------
const name = (s) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : `'${s.replace(/'/g, "''")}'`);
const col = (c, type, more) => [`\tcolumn ${name(c)}`, `\t\tdataType: ${type}`].concat(more || [], [`\t\tsourceColumn: ${c}`, '']);
// an import partition of typed rows (M's #table with a type: untyped, every column loads as text on Refresh)
const partition = (t, typeRow, rows) => [`\tpartition ${name(t)} = m`, '\t\tmode: import', '\t\tsource = ```', '\t\t\t\tlet',
  `\t\t\t\t    Source = #table(type table [${typeRow}], {`].concat(rows.map((r, i) => `\t\t\t\t        ${r}${i < rows.length - 1 ? ',' : ''}`), ['\t\t\t\t    })', '\t\t\t\tin', '\t\t\t\t    Source', '\t\t\t\t```', '']);
const MADE_UP = '/// Made up by DataArcus for its sample project: no real company, place of business or person.';
function tables() {
  const sales = [MADE_UP, 'table Sales', '',
    '\t/// The sales amount in AED', '\tmeasure \'Total Sales\' = SUM ( Sales[Amount] )', '\t\tformatString: #,0', '',
    '\tmeasure \'Order Count\' = SUM ( Sales[Orders] )', '\t\tformatString: #,0', '',
    '\tmeasure \'Units Sold\' = SUM ( Sales[Units] )', '\t\tformatString: #,0', '',
    '\t/// The average sale per order in AED', '\tmeasure \'Average Basket\' = DIVIDE ( [Total Sales], [Order Count] )', '\t\tformatString: #,0.00', '']
    .concat(col('Date', 'dateTime', ['\t\tformatString: Short Date', '\t\tsummarizeBy: none']), col('Branch', 'string', ['\t\tsummarizeBy: none']), col('Product', 'string', ['\t\tsummarizeBy: none']),
      col('Channel', 'string', ['\t\tsummarizeBy: none']), col('Amount', 'double', ['\t\tformatString: #,0.00', '\t\tsummarizeBy: sum']), col('Units', 'int64', ['\t\tformatString: 0', '\t\tsummarizeBy: sum']),
      col('Orders', 'int64', ['\t\tformatString: 0', '\t\tsummarizeBy: sum']),
      partition('Sales', 'Date = date, Branch = text, Product = text, Channel = text, Amount = number, Units = Int64.Type, Orders = Int64.Type', salesRows()));
  const branches = [MADE_UP, 'table Branches', ''].concat(col('Branch', 'string', ['\t\tsummarizeBy: none']), col('City', 'string', ['\t\tsummarizeBy: none']), col('Country', 'string', ['\t\tsummarizeBy: none']),
    partition('Branches', 'Branch = text, City = text, Country = text', BRANCHES.map((r) => `{${r.map(q).join(', ')}}`)));
  const products = [MADE_UP, 'table Products', ''].concat(col('Product', 'string', ['\t\tsummarizeBy: none']), col('Category', 'string', ['\t\tsummarizeBy: none']),
    partition('Products', 'Product = text, Category = text', PRODUCTS.map(([p, c]) => `{${q(p)}, ${q(c)}}`)));
  const calendar = ['/// Every day of the sample\'s 18 months, marked as the date table.', 'table Calendar', '\tdataCategory: Time', '']
    .concat(col('Date', 'dateTime', ['\t\tisKey', '\t\tformatString: Short Date', '\t\tsummarizeBy: none']), col('Year', 'int64', ['\t\tformatString: 0', '\t\tsummarizeBy: none']), col('Quarter', 'string', ['\t\tsummarizeBy: none']),
      col('Month Number', 'int64', ['\t\tformatString: 0', '\t\tsummarizeBy: none']), col('Month Name', 'string', ['\t\tsortByColumn: \'Month Number\'', '\t\tsummarizeBy: none']),
      col('Year Month', 'string', ['\t\tsortByColumn: \'Year Month Key\'', '\t\tsummarizeBy: none']), col('Year Month Key', 'int64', ['\t\tformatString: 0', '\t\tsummarizeBy: none']),
      partition('Calendar', 'Date = date, Year = Int64.Type, Quarter = text, #"Month Number" = Int64.Type, #"Month Name" = text, #"Year Month" = text, #"Year Month Key" = Int64.Type', calendarRows()));
  return { Sales: sales, Branches: branches, Products: products, Calendar: calendar };
}
const RELATIONSHIPS = [['sales_calendar', 'Sales', 'Date', 'Calendar', 'Date'], ['sales_branches', 'Sales', 'Branch', 'Branches', 'Branch'], ['sales_products', 'Sales', 'Product', 'Products', 'Product']];

// ---------- the project's files ----------
// (ids from the folder's name: the files the write writes are the ones the plan was made from, byte for byte)
const idOf = (folder, what) => { const h = crypto.createHash('sha256').update(folder + '\0' + what).digest('hex'); return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`; };
const json = (o) => JSON.stringify(o, null, 2) + '\n';
export function sampleFiles(folder) {
  const M = `${SAMPLE_NAME}.SemanticModel`, R = `${SAMPLE_NAME}.Report`, at = (f) => `${folder}/${f}`, page = crypto.createHash('sha256').update(folder + '\0page').digest('hex').slice(0, 20);
  const platform = (type) => json({ $schema: SCHEMA.platform, metadata: { type, displayName: SAMPLE_NAME }, config: { version: '2.0', logicalId: idOf(folder, type) } });
  const T = tables(), files = [
    [`${SAMPLE_NAME}.pbip`, json({ $schema: SCHEMA.pbip, version: '1.0', artifacts: [{ report: { path: R } }], settings: { enableAutoRecovery: true } })],
    [`${M}/.platform`, platform('SemanticModel')],
    [`${M}/definition.pbism`, json({ $schema: SCHEMA.pbism, version: '4.0', settings: {} })],
    [`${M}/definition/database.tmdl`, 'database\n\tcompatibilityLevel: 1606\n'],
    [`${M}/definition/model.tmdl`, ['model Model', '\tculture: en-US', '\tdefaultPowerBIDataSourceVersion: powerBI_V3', ''].concat(Object.keys(T).map((t) => `ref table ${t}`), ['']).join('\n')],
    [`${M}/definition/relationships.tmdl`, RELATIONSHIPS.map(([n, ft, fc, tt, tc]) => `relationship ${n}\n\tfromColumn: ${name(ft)}.${name(fc)}\n\ttoColumn: ${name(tt)}.${name(tc)}\n`).join('\n')]
  ].concat(Object.entries(T).map(([t, lines]) => [`${M}/definition/tables/${t}.tmdl`, lines.join('\n')]), [
    // the empty report: one blank page, so the project opens in Desktop with the model's fields ready
    [`${R}/.platform`, platform('Report')],
    [`${R}/definition.pbir`, json({ $schema: SCHEMA.pbir, version: '4.0', datasetReference: { byPath: { path: `../${M}` } } })],
    [`${R}/definition/version.json`, json({ $schema: SCHEMA.version, version: '2.0.0' })],
    [`${R}/definition/report.json`, json({ $schema: SCHEMA.report, themeCollection: {}, annotations: [{ name: 'generatedBy', value: 'DataArcus sample project (made-up data)' }] })],
    [`${R}/definition/pages/pages.json`, json({ $schema: SCHEMA.pages, pageOrder: [page], activePageName: page })],
    [`${R}/definition/pages/${page}/page.json`, json({ $schema: SCHEMA.page, name: page, displayName: 'Page 1', displayOption: 'FitToPage', width: 1280, height: 720 })]]);
  return files.map(([f, data]) => ({ path: at(f), data }));
}

// ---------- the plan and the write ----------
/** The first free folder name in the working folder: "Gulf Retail Sample", then "Gulf Retail Sample 2", 3... */
export function freeFolder() {
  for (let k = 1; k < 1000; k++) { const f = k === 1 ? SAMPLE_FOLDER : `${SAMPLE_FOLDER} ${k}`; if (nothingAt(path.join(ROOT, f))) return f; }
  throw new Error('Nothing was written: 999 sample folders are already in the working folder. Move or delete some, then ask again.');
}
/** What the sample holds, for the plan's answer and the approval page: names, counts and what is made up; never a row */
export function sampleSaid(folder) {
  const T = tables(), cols = (t) => T[t].filter((l) => /^\tcolumn /.test(l)).length, meas = (t) => T[t].filter((l) => /^\tmeasure /.test(l)).length;
  const rows = { Sales: salesRows().length, Branches: BRANCHES.length, Products: PRODUCTS.length, Calendar: calendarRows().length };
  const [yl, ml] = months()[MONTHS - 1];
  return { folder, project: `${folder}/${SAMPLE_NAME}.pbip`, model: `${folder}/${SAMPLE_NAME}.SemanticModel`,
    what: `A made-up Gulf retail chain: ${BRANCHES.length} branches in ${new Set(BRANCHES.map((b) => b[1])).size} Gulf cities, ${PRODUCTS.length} products in ${new Set(PRODUCTS.map((p) => p[1])).size} categories, ${MONTHS} months of sales in AED (January ${FIRST[0]} to ${MONTH_NAMES[ml - 1]} ${yl}).`,
    tables: Object.keys(T).map((t) => ({ table: t, rows: rows[t], columns: cols(t), measures: meas(t) })), relationships: RELATIONSHIPS.length,
    dateTable: `Calendar (marked as the date table: every day from ${FIRST[0]}-01-01 to ${yl}-${String(ml).padStart(2, '0')}-${new Date(Date.UTC(yl, ml, 0)).getUTCDate()})`,
    report: `${SAMPLE_NAME}.Report: an empty report (one blank page) on the model, to open the project in Power BI Desktop`,
    madeUp: 'Every name and number in it is made up: no real company, mall, place of business or person.',
    rows: 'The rows are written into the model\'s files only: no answer holds them. Power BI Desktop loads them when the user clicks Refresh.' };
}
export const sampleWrites = (folder, n) => [`the new folder "${folder}" in the working folder: a made-up Gulf retail project, the model "${SAMPLE_NAME}" (4 tables of made-up rows, 4 measures, 3 relationships, a date table) and an empty report, ${n} new files; nothing else is touched`];
/** create_report's write of the approved sample: the files the plan listed, new, in their own new folder */
export function writeSample(folder) { const files = sampleFiles(folder); writeTree(ROOT, files); return files.length; }

// ---------- the tour: the next requests, each a real DataArcus call on the sample ----------
const PLAN_FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Units Sold]', 'Sales[Average Basket]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Year Month]',
  category: 'Branches[City]', category2: 'Products[Category]', slicers: ['Sales[Channel]', 'Calendar[Year]'], table: ['Branches[Branch]', 'Branches[City]', 'Sales[Total Sales]', 'Sales[Order Count]'] };
const ASKS = {
  en: ['Design my first report on the sample: an executive summary of sales by month, city and category.', 'Make that report in English and Arabic: one report, with a language button on every page.',
    'Add the Gulf calendar to the sample: Hijri months, Ramadan and Eid, and the UAE weekend.', 'Is the report ready for Arabic? Check it page by page.'],
  ar: ['صمّم أول تقرير على المثال: ملخص تنفيذي للمبيعات حسب الشهر والمدينة والفئة.', 'اجعل هذا التقرير بالإنجليزية والعربية: تقرير واحد، مع زر للغة في كل صفحة.',
    'أضف تقويم الخليج إلى المثال: الأشهر الهجرية ورمضان والعيد وعطلة نهاية الأسبوع في الإمارات.', 'هل التقرير جاهز للعربية؟ افحصه صفحة صفحة.']
};
const THEN = ['plan_layout shows the plan; after the user\'s go: approve_plan, then create_report with the planId and the plan\'s fields.', 'The same plan with languages "en+ar": the Arabic names and texts are approved in the plan.',
  'add_gulf_calendar answers what it would write; after the go it writes a script the user applies in TMDL view.', 'Read-only: the report from step 1, page by page, each finding with its fix.'];
export function tour(folder, lang) {
  const model = `${folder}/${SAMPLE_NAME}.SemanticModel`, first = { path: model, layout: 'exec', filters: 'top', name: SAMPLE_REPORT, planFields: PLAN_FIELDS }, A = ASKS[lang === 'ar' ? 'ar' : 'en'];
  const calls = [{ tool: 'plan_layout', args: first }, { tool: 'plan_layout', args: Object.assign({}, first, { languages: 'en+ar' }) },
    { tool: 'add_gulf_calendar', args: { path: model, firstYear: FIRST[0], lastYear: months()[MONTHS - 1][0] } }, { tool: 'check_report', args: { path: `${folder}/${SAMPLE_REPORT}.pbip`, lens: 'arabic' } }];
  return calls.map((call, i) => ({ step: i + 1, ask: A[i], call, then: THEN[i] }));
}
export function writtenSaid(folder, n, lang) {
  const ar = lang === 'ar', open = `${folder}/${SAMPLE_NAME}.pbip`;
  return { written: true, sample: { folder, files: n, model: `${folder}/${SAMPLE_NAME}.SemanticModel` }, open,
    sayFirst: ar ? `كُتب مشروع المثال: ${open}. افتحه في Power BI Desktop (الإصدار 2.159 أو أحدث) ثم انقر Refresh لتحميل الصفوف. كل الأسماء والأرقام فيه مختلَقة. ثم جرّب الجولة: أربعة طلبات تالية، واحدًا تلو الآخر.`
      : `The sample project is written: ${open}. Open it in Power BI Desktop (2.159 or later) and click Refresh to load its rows. Every name and number in it is made up. Then try the tour: 4 next requests, one at a time.`,
    tour: tour(folder, lang),
    tourNote: 'Offer the tour\'s asks in the user\'s words, one at a time; each runs as its call says, with the usual plan and approval before any write.' };
}
