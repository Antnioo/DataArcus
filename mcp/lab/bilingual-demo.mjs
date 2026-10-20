// 0.3.1 X2 (the owner, 20 Oct: a website demo and a video of the bilingual report): a made-up Gulf retail report in
// English and Arabic, written through the tools as a person would (plan_layout languages "en+ar" -> the Arabic names and
// texts approved -> approve_plan -> create_report), for the laptop to open in Power BI Desktop and capture. The model is
// made up (no employer or client data): a shop chain in the seven emirates, two years of typed rows, amounts in AED.
// The Arabic below stands for what a person approves in the plan; a text with no Arabic here keeps the fixed list's
// draft, or stays English and is listed (notTranslated, printed). Microsoft's validator and check_report run on it.
//   node lab/bilingual-demo.mjs <empty folder>      (from mcp/; prints the .pbip to open)
import '../test-env.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serverClient } from '../test-0.2.9.mjs';

// the rows: every month of 2025 and 2026, each emirate, branch, category and channel (made up, deterministic)
const EMIRATES = [['Dubai', 'Dubai Mall'], ['Abu Dhabi', 'Yas Mall'], ['Sharjah', 'Sahara Centre'], ['Ajman', 'City Centre Ajman'], ['Ras Al Khaimah', 'Manar Mall'], ['Fujairah', 'Fujairah Mall'], ['Umm Al Quwain', 'UAQ Mall']];
const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Grocery'], CHANNELS = ['Store', 'Online'];
function rows() {
  const out = []; let k = 0;
  for (const y of [2025, 2026]) for (let mo = 1; mo <= 12; mo++) EMIRATES.forEach(([em, br], e) => CATEGORIES.forEach((c, ci) => {
    const ch = CHANNELS[(e + ci + mo) % 2], base = 9000 + 2500 * (6 - e) + 1800 * ci + 650 * mo + (y === 2026 ? 2100 : 0) + (mo === 3 || mo === 4 ? 4200 : 0);
    const amount = Math.round(base * (1 + ((k++ * 37) % 23) / 100)), units = Math.max(1, Math.round(amount / (60 + 25 * ci))), orders = Math.max(1, Math.round(units / 3));
    out.push(`{#datetime(${y}, ${mo}, ${1 + ((e * 3 + ci) % 27)}, 0, 0, 0), "${em}", "${br}", "${c}", "${ch}", ${amount}, ${units}, ${orders}}`);
  }));
  return out;
}
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function writeModel(dir) {
  const sales = `let Source = #table(type table [Date = datetime, Emirate = text, Branch = text, Category = text, Channel = text, Amount = number, Units = number, Orders = number], {${rows().join(', ')}}) in Source`;
  const days = []; for (const y of [2025, 2026]) for (let mo = 1; mo <= 12; mo++) for (let d = 1; d <= 28; d++) days.push(`{#datetime(${y}, ${mo}, ${d}, 0, 0, 0), "${MONTHS[mo - 1]}", ${mo}, ${y}}`);
  const cal = `let Source = #table(type table [Date = datetime, #"Month Name" = text, #"Month Number" = Int64.Type, Year = Int64.Type], {${days.join(', ')}}) in Source`;
  const mp = (expression) => [{ name: 'p', mode: 'import', source: { type: 'm', expression } }];
  const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
  fs.mkdirSync(path.join(dir, 'Gulf Retail.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'Gulf Retail.SemanticModel/definition.pbism'), JSON.stringify({ version: '1.0' }, null, 2));
  fs.writeFileSync(path.join(dir, 'Gulf Retail.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { culture: 'en-US', defaultPowerBIDataSourceVersion: 'powerBI_V3', tables: [
    { name: 'Sales', partitions: mp(sales), columns: [col('Date', 'dateTime'), col('Emirate', 'string'), col('Branch', 'string'), col('Category', 'string'), col('Channel', 'string'), col('Amount', 'double'), col('Units', 'double'), col('Orders', 'double')],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '"AED" #,0' }, { name: 'Order Count', expression: 'SUM ( Sales[Orders] )', formatString: '#,0' },
        { name: 'Units Sold', expression: 'SUM ( Sales[Units] )', formatString: '#,0' }, { name: 'Average Basket', expression: 'DIVIDE ( [Total Sales], [Order Count] )', formatString: '"AED" #,0.00' }] },
    { name: 'Calendar', dataCategory: 'Time', partitions: mp(cal), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] }],
    relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }, null, 1));
}
// the Arabic a person approves: every field, and the texts the fixed list has no draft for
const TERMS = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Units Sold]': 'الوحدات المباعة', 'Sales[Average Basket]': 'متوسط السلة',
  'Sales[Emirate]': 'الإمارة', 'Sales[Branch]': 'الفرع', 'Sales[Category]': 'الفئة', 'Sales[Channel]': 'القناة', 'Calendar[Month Name]': 'الشهر', 'Calendar[Year]': 'السنة', 'Calendar[Date]': 'التاريخ' };
const TEXTS = { 'Gulf Retail': 'تجزئة الخليج', 'Gulf Retail · UAE': 'تجزئة الخليج · الإمارات' };
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Units Sold]', 'Sales[Average Basket]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Emirate]', category2: 'Sales[Category]', slicers: ['Sales[Channel]', 'Calendar[Year]'], table: ['Sales[Branch]', 'Sales[Emirate]', 'Sales[Total Sales]', 'Sales[Order Count]'] };

export async function writeDemo(out) {
  fs.mkdirSync(out, { recursive: true });
  const ROOT = fs.realpathSync.native(path.resolve(out));
  if (fs.readdirSync(ROOT).length) throw new Error(`${ROOT} is not empty: give an empty folder`);
  writeModel(path.join(ROOT, 'retail'));
  const s = await serverClient(ROOT, {});
  try {
    let args = { path: 'retail/Gulf Retail.SemanticModel', lang: 'en', layout: 'exec', filters: 'top', secondPage: true, name: 'Gulf Retail Sales', title: 'Gulf Retail · UAE', languages: 'en+ar', slicerStyle: 'pills', planFields: FIELDS };
    let pl = await s.call('plan_layout', args);
    for (let i = 0; i < 5 && !pl.err; i++) {
      const j = pl.j || {}, more = {};
      if (j.gulfDates && j.gulfDates.askNext && !args.gulfDates && ((j.gulfDates.candidates || [])[0] || {}).field) more.gulfDates = { dateRole: j.gulfDates.candidates[0].field, grain: 'gregorian', scope: 'all' };
      if (j.sharedAxes && (j.sharedAxes.ask || []).length && !args.sharedAxes) more.sharedAxes = j.sharedAxes.ask.map((q) => ({ measures: q.measures, answer: 'separate' }));
      const B = j.bilingual;
      if (B && !args.arabicTerms) { const t = {}; ((B.terminology || {}).sheet || []).forEach((r) => { if (TERMS[r.field]) t[r.field] = TERMS[r.field]; }); more.arabicTerms = t; }
      else if (B && !args.arabicTexts) { const t = {}; (B.texts || []).filter((x) => !x.field && x.arabic == null).forEach((x) => { const a = TEXTS[x.text] || x.draftArabic; if (a) t[x.text] = a; }); more.arabicTexts = t; }
      if (!Object.keys(more).length) break;
      args = Object.assign(args, more); pl = await s.call('plan_layout', args);
    }
    const id = pl.j && pl.j.plan && pl.j.plan.planId;
    if (!id) throw new Error('no plan: ' + JSON.stringify((pl.j || {}).planProblems || pl.t).slice(0, 600));
    await s.call('approve_plan', { planId: id });
    const send = Object.assign({}, args, { planId: id, design: pl.j.design, fields: FIELDS }); delete send.planFields;
    const r = await s.call('create_report', send);
    if (r.err) throw new Error('not written: ' + r.t.slice(0, 400));
    // (the report gets a free name next to the model: its .pbip as create_report's answer gives it)
    const open = r.j.open, c = await s.call('check_report', { path: open }), cj = c.j || {};
    if (c.err) throw new Error('check_report: ' + c.t.slice(0, 300));
    const B = pl.j.bilingual;
    return { pbip: path.join(ROOT, ...open.split('/')), bilingual: r.j.bilingual, validator: cj.validator && cj.validator.errors, canBreak: cj.impact && cj.impact.kinds.canBreak.count,
      keptEnglish: (B.notTranslated || []).map((x) => `${x.text} (${x.where}): ${x.why}`) };
  } finally { await s.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const out = process.argv[2];
  if (!out) { console.error('Give an empty folder: node lab/bilingual-demo.mjs <folder>'); process.exit(2); }
  writeDemo(out).then((x) => {
    console.log(`Open in Power BI Desktop: ${x.pbip}`);
    console.log(`Pages: ${x.bilingual.pairs} English + ${x.bilingual.pairs} Arabic; language buttons ${x.bilingual.languageButtons} (phone ${x.bilingual.phoneButtons}); slicer pairs in sync ${x.bilingual.syncGroups}; tabs shown: ${x.bilingual.tabsShown}`);
    console.log(`Microsoft's validator errors: ${x.validator}; check_report "can break": ${x.canBreak}`);
    console.log(`Kept in English (listed in the plan): ${x.keptEnglish.length ? '\n  ' + x.keptEnglish.join('\n  ') : 'none'}`);
  }).catch((e) => { console.error('FAIL  ' + (e && e.message || e)); process.exit(1); });
}
