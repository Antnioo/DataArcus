// The plans test-0.3.2-fn1j.mjs pins (0.3.2 FN1J, mcp/work/FN1J.md): made-up models written into a working folder, and
// one plan_layout input per condition of its handler's parts (the limits, the Gulf date questions, the month order,
// custom visuals, the switcher, status icons, the DAX library, shared axes, the lint's names, the exact artifact and
// the path limit, the titles, the preview, the kinds, what is said and written, the terminology sheet, the proposal).
// Made-up names only (no employer data); the models hold no rows except the sample project's made-up ones.
//   await writeModels(root, here) writes them (DATAARCUS_ROOT set first: the lab's modules read it when they load); CASES: [name, args, env?] (env: variables set for that call only)
import fs from 'node:fs';
import path from 'node:path';
import { sampleFiles } from '../lib/sample-project.mjs';
import { timeLab } from './time-lab.mjs';

const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const put = (f, x) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, typeof x === 'string' ? x : JSON.stringify(x)); };
// CI's Windows checkout writes the fixtures' text files with CRLF: the copies get LF, as the repository holds them
const lf = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) return lf(f);
  const b = fs.readFileSync(f); if (!b.includes(0) && b.includes(13)) fs.writeFileSync(f, b.toString('utf8').replace(/\r\n/g, '\n')); });

// sp1's tiny model: sales by region and month, an Arabic column, a measure with a dynamic format; and its variants
const tiny = () => ({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Region', 'string'), col('المنطقة', 'string'), col('Product', 'string'), col('Date', 'dateTime'), col('Share', 'double')],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Margin', expression: 'SUM ( Sales[Amount] ) - SUM ( Sales[Cost] )', formatString: '#,0', formatStringDefinition: { expression: 'IF ( ABS ( SELECTEDMEASURE () ) >= 1000000, "#,0.0,,\\"M\\"", "#,0" )' } },
      { name: 'Sales Target', expression: 'SUM ( Sales[Cost] ) * 1.2', formatString: '#,0' }, { name: 'Margin %', expression: 'DIVIDE ( [Margin], [Total Sales] )', formatString: '0.0%' },
      { name: 'Raw Total', expression: 'SUM ( Sales[Cost] )' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [Object.assign(col('Date', 'dateTime'), { isKey: true }), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'),
    col('Month Label', 'string'), col('Month Text', 'string')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } });
// no measures: the report counts and sums the columns itself (an Arabic plan drafts «عدد», «مجموع» titles)
const noMeasures = () => { const m = tiny(); m.model.tables[0].measures = []; m.model.tables[0].columns.push(col('Qty', 'int64', { summarizeBy: 'sum' })); return m; };
// no date at all: the layout made for no time axis
const noTime = () => ({ compatibilityLevel: 1567, model: { tables: [{ name: 'Shop', partitions: mp('Shop'), columns: [col('Store', 'string'), col('Item', 'string'), col('Value', 'double')],
  measures: [{ name: 'Revenue', expression: 'SUM ( Shop[Value] )', formatString: '#,0' }, { name: 'Lines', expression: 'COUNTROWS ( Shop )' }] }] } });
// a large model: an area first (display folders give the areas)
const big = () => ({ compatibilityLevel: 1567, model: { tables: Array.from({ length: 140 }, (_, i) => ({ name: `Area ${String(i).padStart(3, '0')} Facts`, partitions: mp('T' + i),
  columns: Array.from({ length: 9 }, (__, j) => col(`Attribute Number ${j} Of Table ${i}`, j ? 'string' : 'double')),
  measures: [{ name: `Measure Of Table ${i}`, expression: `SUM ( 'Area ${String(i).padStart(3, '0')} Facts'[Attribute Number 0 Of Table ${i}] )`, displayFolder: i % 2 ? 'Finance' : 'Operations' }] })) } });
// an odd measure no fixed list names (sp1's P10)
const odd = () => { const m = tiny(); m.model.tables[0].measures.push({ name: 'Qzx Flux', expression: 'SUM ( Sales[Cost] )', formatString: '#,0' }); return m; };

export async function writeModels(root, here) {
  const Lab = await import('../lab/custom-visuals-lab.mjs');
  Lab.writeLab(path.join(root, 'lab'));
  fs.cpSync(path.join(here, 'fixtures', 'twin-project'), path.join(root, 'twin'), { recursive: true });
  fs.cpSync(path.join(here, 'fixtures', 'health-project'), path.join(root, 'health'), { recursive: true });
  lf(path.join(root, 'twin')); lf(path.join(root, 'health'));
  put(path.join(root, 'tiny/Tiny.SemanticModel/model.bim'), tiny());
  put(path.join(root, 'odd/Odd.SemanticModel/model.bim'), odd());
  put(path.join(root, 'nom/Nom.SemanticModel/model.bim'), noMeasures());
  put(path.join(root, 'notime/Shop.SemanticModel/model.bim'), noTime());
  put(path.join(root, 'big/Big.SemanticModel/model.bim'), big());
  put(path.join(root, 'f5/Deep.SemanticModel/model.bim'), tiny());
  sampleFiles('gulf').forEach((f) => put(path.join(root, ...f.path.split('/')), f.data));
  timeLab(root, 'tl');
}

const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[المنطقة]', category2: 'Sales[Product]', table: ['Sales[المنطقة]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]'], slicers: ['Sales[Product]'] };
const EN_FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]', 'Sales[Margin]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Product]' };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Sales[Margin]': 'الهامش', 'Sales[Product]': 'المنتج', 'Sales[Region]': 'المنطقة' };
const GULF = { kpis: ['Sales[Total Sales]', 'Sales[Order Count]', 'Sales[Units Sold]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Year Month]', category: 'Sales[Branch]', category2: 'Products[Category]' };
const GPATH = 'gulf/Gulf Retail.SemanticModel';
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i));

export const CASES = [
  // the exits: the sample, the redesign (its refusal and its plan)
  ['A01 sample', { sample: true }],
  ['A02 sample in Arabic', { sample: true, lang: 'ar' }],
  ['A03 redesign refused (a new report option)', { path: 'twin', redesignFrom: 'twin/Twin Sales.pbip', layout: 'exec' }],
  ['A04 redesign', { path: 'twin', redesignFrom: 'twin/Twin Sales.pbip', consistentText: 'report', keepPositions: true }],
  // the model read, its names
  ['B01 layout only, a page size', { layout: 'ops', kpis: 5, filters: 'end', page: '1280x720' }],
  ['B02 English, readable names', { path: 'twin', name: 'FN1J English', layout: 'analysis', kpis: 3, filters: 'start', themeFrom: 'Twin Sales' }],
  ['B03 English, a name given', { path: 'tiny', name: 'FN1J given', layout: 'exec', planFields: EN_FIELDS, displayNames: { 'Sales[Margin]': 'Gross Margin' } }],
  ['B04 a name that cannot be written', { path: 'tiny', name: 'FN1J bad', displayNames: { 'Sales[Margin]': 'Gross\u200bMargin' } }],
  ['B05 Arabic, names approved', { path: 'tiny', name: 'FN1J Arabic', layout: 'analysis', kpis: 3, filters: 'start', lang: 'ar', displayNames: AR_NAMES, planFields: FIELDS, pageFilters: [{ field: 'Sales[Region]', values: ['North'] }], secondPage: true }],
  ['B06 Arabic, no names', { path: 'twin', name: 'FN1J Arabic bare', lang: 'ar' }],
  ['B07 Arabic, an odd measure', { path: 'odd', name: 'FN1J odd', lang: 'ar', layout: 'exec', kpis: 3, planFields: { kpis: ['Sales[Qzx Flux]', 'Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Qzx Flux]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' } }],
  ['B08 Arabic, kept English on purpose', { path: 'odd', name: 'FN1J kept', lang: 'ar', layout: 'exec', kpis: 3, displayNames: Object.assign({}, AR_NAMES, { 'Sales[Qzx Flux]': 'Qzx Flux' }), planFields: { kpis: ['Sales[Qzx Flux]', 'Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Qzx Flux]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' } }],
  ['B09 Arabic, no measures (counted titles)', { path: 'nom', name: 'FN1J counted', lang: 'ar', layout: 'exec' }],
  ['B10 Arabic, no measures, a name given', { path: 'nom', name: 'FN1J counted 2', lang: 'ar', layout: 'exec', displayNames: { 'Sales[Amount]': 'المبلغ', 'Sales[Qty]': 'الكمية' } }],
  ['B11 Arabic, many counted titles', { path: 'nom', name: 'FN1J counted 3', lang: 'ar', layout: 'ops', kpis: 6 }],
  ['B12 English, no measures', { path: 'nom', name: 'FN1J counts', layout: 'exec' }],
  ['B13 English, fields given', { path: 'tiny', name: 'FN1J fields', fields: ['Sales[Total Sales]', "'Sales'[Region]", 'Calendar[Month Name]'] }],
  ['B14 English, kpis 2 and no fields', { path: 'health', name: 'FN1J health', kpis: 2 }],
  // the layout and its fit
  ['C01 no time axis asked', { path: 'tiny', name: 'FN1J no time', layout: 'exec', planFields: { kpis: ['Sales[Total Sales]'], timeAxis: 'none', category: 'Sales[Region]' } }],
  ['C02 a model with no date', { path: 'notime', name: 'FN1J shop', layout: 'analysis' }],
  ['C03 table fields set the row', { path: 'tiny', name: 'FN1J table', layout: 'analysis', filters: 'start', planFields: { kpis: ['Sales[Total Sales]'], table: ['Sales[Region]', 'Sales[Product]', 'Sales[Total Sales]', 'Sales[Margin]', 'Sales[Orders]', 'Sales[Amount]'] } }],
  ['C04 hand-placed pages', { path: 'health', name: 'FN1J hand', pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }] }] }],
  ['C05 a design given, plain', { path: 'tiny', name: 'FN1J design', design: { layout: { layout: 'focus', kpis: 2, filters: 'none' } }, colors: { accent: '#7A3E9D' } }],
  ['C06 a second page off, a slide panel', { path: 'tiny', name: 'FN1J panel', layout: 'exec', secondPage: false, slidePanel: true, planFields: EN_FIELDS }],
  // the limits
  ['D01 over every limit', { path: 'tiny', name: 'FN1J over', planFields: { kpis: many(7, () => 'Sales[Total Sales]'), table: many(13, () => 'Sales[Region]'), slicers: many(5, () => 'Sales[Product]') } }],
  ['D02 a large model, no area', { path: 'big', name: 'FN1J big' }],
  ['D03 a large model, an area', { path: 'big', name: 'FN1J big area', focus: 'Finance' }],
  ['D04 en+ar in Arabic, its inputs alone', { path: 'tiny', name: 'FN1J both', languages: 'en+ar', lang: 'ar', tabsShown: 'ar' }],
  ['D05 bilingual inputs without en+ar', { path: 'tiny', name: 'FN1J texts', arabicTexts: { Sales: 'المبيعات' } }],
  ['D06 redesign options on a new report', { path: 'tiny', name: 'FN1J restyle', consistentText: 'theme', keepPositions: true }],
  ['D07 en+ar with custom visuals', { path: 'gulf/Gulf Retail.SemanticModel', name: 'FN1J cvboth', languages: 'en+ar', customVisualsFrom: 'gulf/Gulf Retail.Report', restyle: { mode: 'dark' } }],
  ['D08 slicers with no filter area', { path: 'tiny', name: 'FN1J slicers', layout: 'exec', filters: 'none', planFields: { kpis: ['Sales[Total Sales]'], slicers: ['Sales[Product]'] } }],
  ['D09 fields the model lacks', { path: 'tiny', name: 'FN1J missing', planFields: { kpis: ['Sales[Nope]'], category: 'Ghost[Region]' } }],
  ['D10 fields without a model', { layout: 'exec', planFields: { kpis: ['Sales[Total Sales]'] } }],
  // the Gulf date questions, the month order
  ['E01 Gulf dates asked', { path: GPATH, name: 'FN1J gulf', planFields: GULF, gulfDates: { grain: 'hijri' } }],
  ['E02 Gulf dates answered', { path: GPATH, name: 'FN1J gulf 2', planFields: GULF, gulfDates: { dateRole: 'Sales[Date]', grain: 'gregorian', scope: 'all' } }],
  ['E03 Gulf dates, the picker\'s axis', { path: GPATH, name: 'FN1J gulf 3', gulfDates: { grain: 'seasonDay', scope: 'year', year: 1446 } }],
  ['E04 month order: a sort-by column', { path: 'tiny', name: 'FN1J month', planFields: { kpis: ['Sales[Total Sales]'], timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' } }],
  ['E05 month order: a label', { path: 'tiny', name: 'FN1J label', planFields: { kpis: ['Sales[Total Sales]'], timeAxis: 'Calendar[Month Label]', category: 'Sales[Region]' } }],
  ['E06 month order: Time Lab', { path: 'tl', name: 'FN1J time lab', planFields: { kpis: ['Sales[Total Sales]'], timeAxis: 'Sales[Qtr]', category: 'Sales[FiscalYear]' } }],
  ['E07 month order: Time Lab in Arabic', { path: 'tl', name: 'FN1J time lab ar', lang: 'ar', planFields: { kpis: ['المبيعات[إجمالي المبيعات]'], timeAxis: 'المبيعات[شهر]' }, displayNames: { 'المبيعات[إجمالي المبيعات]': 'إجمالي المبيعات' } }],
  ['E08 month order: the picker\'s date', { path: GPATH, name: 'FN1J gulf month', layout: 'exec' }],
  ['E09 month order: a date column', { path: 'tiny', name: 'FN1J date', planFields: { kpis: ['Sales[Total Sales]'], timeAxis: 'Sales[Date]', category: 'Sales[Region]' } }],
  // custom visuals, the switcher, status icons, the DAX library, shared axes
  ['F01 custom visuals without a model', { customVisualsFrom: 'lab/Gulf Retail.Report' }],
  ['F02 custom visuals', { path: 'lab', customVisualsFrom: 'lab/Gulf Retail.Report' }],
  ['F03 custom visuals, axes answered, a second', { path: 'lab', customVisualsFrom: 'lab/Gulf Retail.Report', sharedAxes: [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }], customVisualsSecond: ['9:9,9'] }],
  ['F04 custom visuals, none to replace', { path: GPATH, customVisualsFrom: 'gulf/Gulf Retail.Report' }],
  ['F05 options on a native copy', { path: 'lab', customVisualsFrom: 'lab/Gulf Retail.Report', metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'], statusIcons: true, daxFunctions: true }],
  ['F06 options without a model', { layout: 'exec', metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'], statusIcons: true, daxFunctions: true, sharedAxes: [{ measures: ['Sales[Total Sales]', 'Sales[Orders]'], answer: 'comparable' }] }],
  ['F07 switcher, flip cards, icons', { path: 'tiny', name: 'FN1J options', layout: 'exec', kpis: 3, planFields: { kpis: EN_FIELDS.kpis, measure: EN_FIELDS.measure, timeAxis: EN_FIELDS.timeAxis, category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Total Sales]', 'Sales[Margin %]'] }, flipCards: true, metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'], statusIcons: [{ measure: 'Sales[Margin %]', good: '>= 0.3', bad: '< 0.1' }] }],
  ['F08 switcher and icons refused', { path: 'tiny', name: 'FN1J refused', metricSwitcher: ['Sales[Nope]', 'Sales[Orders]'], statusIcons: [{ measure: 'Sales[Nope]', good: '> 1' }], sharedAxes: [{ measures: ['Sales[Nope]', 'Sales[Orders]'], answer: 'comparable' }] }],
  ['F09 DAX library, flip cards both', { path: 'tiny', name: 'FN1J dax both', flipCards: true, daxFunctions: ['kpiCards'] }],
  ['F10 DAX library', { path: 'tiny', name: 'FN1J dax', layout: 'exec', planFields: EN_FIELDS, daxFunctions: true }],
  ['F11 DAX library in Arabic', { path: 'tiny', name: 'FN1J dax ar', lang: 'ar', layout: 'exec', displayNames: AR_NAMES, planFields: EN_FIELDS, daxFunctions: true }],
  ['F12 Arabic switcher, no names', { path: 'tiny', name: 'FN1J switch ar', lang: 'ar', layout: 'exec', displayNames: { 'Sales[Region]': 'المنطقة' }, planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]', timeAxis: 'Calendar[Month Name]' }, metricSwitcher: ['Sales[Total Sales]', 'Sales[Sales Target]'] }],
  ['F13 Arabic flip cards and icons', { path: 'tiny', name: 'FN1J flip ar', lang: 'ar', layout: 'exec', displayNames: Object.assign({ 'Sales[Margin %]': 'نسبة الهامش' }, AR_NAMES), planFields: { kpis: EN_FIELDS.kpis, category: 'Sales[Region]', timeAxis: 'Calendar[Month Name]', table: ['Sales[Region]', 'Sales[Margin %]'] }, flipCards: true, statusIcons: true, metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'] }],
  ['F15 Arabic switcher, a measure with no name', { path: 'odd', name: 'FN1J switch odd', lang: 'ar', layout: 'exec', displayNames: AR_NAMES, planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]', timeAxis: 'Calendar[Month Name]' }, metricSwitcher: ['Sales[Total Sales]', 'Sales[Qzx Flux]'] }],
  ['F14 shared axes asked', { path: 'tiny', name: 'FN1J axes', gallery: ['combo'], planFields: EN_FIELDS, sharedAxes: [{ measures: ['Sales[Total Sales]', 'Sales[Sales Target]'], answer: 'comparable' }] }],
  // the gallery, the kinds, waterfalls, the calendar, the bilingual report
  ['G01 gallery kinds', { path: 'tiny', name: 'FN1J gallery', layout: 'analysis', planFields: EN_FIELDS, gallery: ['waterfall', 'combo', 'smallMultiples'] }],
  ['G02 gallery in Arabic, waterfall native', { path: 'tiny', name: 'FN1J gallery ar', lang: 'ar', layout: 'analysis', displayNames: AR_NAMES, planFields: EN_FIELDS, gallery: ['waterfall'], waterfallRtl: 'native' }],
  ['G03 gallery in Arabic, waterfall mirror', { path: 'tiny', name: 'FN1J gallery mirror', lang: 'ar', layout: 'analysis', displayNames: AR_NAMES, planFields: EN_FIELDS, gallery: ['waterfall'], waterfallRtl: 'mirror' }],
  ['G04 Gulf in Arabic (the calendar)', { path: GPATH, name: 'FN1J gulf ar', lang: 'ar', planFields: GULF, displayNames: { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Order Count]': 'عدد الطلبات', 'Sales[Units Sold]': 'الوحدات المباعة', 'Sales[Branch]': 'الفرع', 'Products[Category]': 'الفئة', 'Calendar[Year Month]': 'الشهر' } }],
  ['G05 bilingual', { path: 'twin', name: 'FN1J both', languages: 'en+ar', layout: 'exec' }],
  ['G06 bilingual, tabs in Arabic, texts', { path: 'tiny', name: 'FN1J both 2', languages: 'en+ar', tabsShown: 'ar', layout: 'exec', planFields: EN_FIELDS, arabicTerms: AR_NAMES, arabicTexts: { 'Total Sales': 'إجمالي المبيعات' } }],
  ['G07 bilingual on the sample model', { path: GPATH, name: 'FN1J both gulf', languages: 'en+ar', layout: 'analysis', filters: 'start', planFields: Object.assign({ slicers: ['Branches[City]'] }, GULF) }],
  ['G08 slicers asked, one added', { path: GPATH, name: 'FN1J slicers', layout: 'analysis', filters: 'start', planFields: Object.assign({ slicers: ['Branches[City]'] }, GULF) }],
  ['G09 slicers in Arabic, chosen', { path: GPATH, name: 'FN1J slicers ar', lang: 'ar', layout: 'analysis', filters: 'start' }],
  ['G10 many categories, thinner bars', { path: GPATH, name: 'FN1J bars', layout: 'analysis', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Product]', category2: 'Branches[City]' }, columnStats: { distinct: { 'Sales[Product]': 12, 'Branches[City]': 5 } } }],
  ['G11 formats the model lacks', { path: 'tiny', name: 'FN1J formats', layout: 'exec', planFields: { kpis: ['Sales[Raw Total]', 'Sales[Margin %]'], category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Share]', 'Sales[Raw Total]'] } }],
  ['G12 the path limit', { path: 'f5', layout: 'exec', name: 'Long Path Report', planFields: { kpis: ['Sales[Total Sales]'], category: 'Sales[Region]' }, secondPage: false }, { PATH_MAX: 60 }],
  ['G13 ops, six cards in Arabic', { path: 'twin', name: 'FN1J ops ar', lang: 'ar', layout: 'ops', kpis: 6 }],
  ['G14 hand-placed pages in Arabic', { path: 'tiny', name: 'FN1J hand ar', lang: 'ar', displayNames: AR_NAMES, pages: [{ name: 'الصفحة', width: 1280, height: 720, slots: [{ kind: 'card', field: 'Sales[Total Sales]', x: 24, y: 12, w: 300, h: 120 }, { kind: 'bar', measure: 'Sales[Total Sales]', category: 'Sales[Region]', x: 24, y: 140, w: 600, h: 400 }] }] }]
];
