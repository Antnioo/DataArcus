// FN1H's inputs (mcp/work/FN1H.md): made-up build states for create_report's answer (lib/report-result.mjs reportAnswer,
// which is pure: it reads only what it is given), one with every note's condition on and one variant per condition
// (off, one item, many items), so a pin over the whole answer sits at each edge. Made-up names only, no data values.
import { fieldsOf } from '../lib/report-bind.mjs';

const T = 'Sales', M = (m, x) => Object.assign({ t: T, m }, x || {}), C = (c, x, t) => Object.assign({ t: t || T, c }, x || {});
// the made-up model the notes read (modelNotes and the thousand separators: formats, a month and a day name without a
// sort column, a percent without a format)
const tmsl = () => ({ model: { tables: [
  { name: T, columns: [{ name: 'City', dataType: 'string' }, { name: 'Month Name', dataType: 'string' }, { name: 'Day Name', dataType: 'string' }, { name: 'Amount', dataType: 'double' }, { name: 'Units', dataType: 'int64', formatString: '#,0' }, { name: 'المدينة', dataType: 'string' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )' }, { name: 'Margin %', expression: 'DIVIDE ( 1, 2 )' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' },
      { name: 'Avg Price', expression: '1', formatString: '0.00' }, { name: 'Dyn', expression: '1', formatStringDefinition: { expression: '"0"' } }, { name: 'الطلبات', expression: '1' }] },
  { name: 'Calendar', columns: [{ name: 'Date', dataType: 'dateTime' }, { name: 'Month Number', dataType: 'int64' }] }] } });
const tables = () => [{ name: T, columns: [{ name: 'City' }, { name: 'المدينة' }, { name: 'Month Name' }], measures: [{ name: 'Total Sales' }] }, { name: 'Calendar', columns: [{ name: 'Date' }], measures: [] }];
const bindOf = () => ({ kpis: [M('Total Sales'), M('Margin %'), M('Orders')], measure: M('Total Sales'), date: C('Month Name', { sortBy: { t: 'Calendar', c: 'Month Number' } }),
  cats: { bar: C('City'), column: C('Day Name', { short: C('Day Short') }) }, y: { gauge: M('Margin %') }, table: [C('City'), M('Avg Price'), C('Amount', { num: true }), C('Units', { num: true }), M('Dyn')],
  slicers: [C('City')], formatsMixed: [{ t: T, m: 'Dyn' }, { t: T, m: 'Total Sales', unformatted: true }], language: { skipped: ['City (AR)'], fallback: ['المدينة'] },
  notReached: [{ t: 'Budget', m: 'Target', row: { t: T, c: 'City' } }], noRelatedCategory: { measure: { t: T, m: 'Total Sales' }, tables: ['Product'] },
  noRelatedCalendar: { kind: 'date', measure: { t: T, m: 'Total Sales' }, tables: ['Calendar'] } });
const page = (name, kinds) => ({ name, slots: kinds.map((kind) => ({ kind })) });
// the writer's result (r): every list a note reads, each with two items where the note counts them
const resultOf = () => ({ files: [{ path: 'R.Report/definition/pages/p1/page.json' }, { path: 'R.Report/definition/pages/p1/mobile.json' }], base: 'R',
  bound: [{ page: 'Overview', visuals: [{ kind: 'kpi', fields: ['Sales[Total Sales]'] }, { kind: 'slicer', fields: ['Sales[City]'] }] }],
  titles: { wrapped: [{ page: 'Overview', title: 'Total Sales by City' }], shortened: [{ page: 'Overview', title: 'Total Sales by City Long', shown: 'Total Sales by…' }, { page: 'Details', title: 'Orders by Day', shown: 'Orders…' }], slicers: [{ field: 'City', shown: 'Ci…' }] },
  svgSizes: { 0: { w: 120, h: 20, capped: true, design: '160 x 24' }, 1: { w: 160, h: 24 } }, subtitlesUsed: ['mix'],
  blankKept: [{ title: 'Orders', page: 'Overview', w: 90, need: 120 }, { page: 'Details', w: 60, need: 120 }], barCharts: [{ field: 'Product Name', page: 'Overview' }, { field: 'City', page: 'Details' }],
  shortDays: [{ page: 'Overview' }, { page: 'Details' }], ringsSmall: [{ label: 'Ring A', h: 12 }, { label: 'Ring B', h: 14 }],
  chartColors: { ends: { low: '#C0D0E0', high: '#1060A0', soft: true }, charts: 3, second: 2, base2: '#A05010', ends2: { low: '#E0C0A0', high: '#A05010' }, asked: true, base: '#1060A0' },
  chartAxes: { rtl: true, asked: 'mirrored', charts: 4 }, slicerStyle: { asked: 'pills', written: [{ field: 'City', as: 'pills' }] }, grid: 'dotted',
  waterfallRtl: [{ title: 'Bridge', page: 'Overview', written: 'columnChart', what: 'a stacked column chart drawn as a waterfall' }, { page: 'Details', written: 'waterfallChart', what: 'Power BI\'s waterfall', why: 'native' }],
  timeAxes: [{ field: 'Month Name', page: 'Overview', by: 'Calendar[Date]', last: 12 }, { field: 'Month Name', page: 'Details', by: 'Calendar[Date]' }],
  topCharts: [{ top: 5, allUpTo: 6 }, { top: 7 }], blankFiltered: 2, a11y: { card: '#FFFFFF', colours: [{ from: '#F0F080', contrast: 1.3, to: '#8A8A20' }, { from: '#80F0F0', contrast: 1.4, to: '#208A8A' }] },
  tooltipLimits: { top: 6, months: 12 }, tableSmaller: [{ size: 9, from: 10, page: 'Details', rows: true }], tableColumns: [{ page: 'Details', kept: [1, 2, 3], leftOut: [C('Region'), M('Discount')] }],
  rowLabels: [{ t: T, m: 'Row label' }], rowLabelSkipped: [{ t: T, c: 'Ci\tty' }], noDataSkipped: [{ t: T, m: 'Sa\nles' }, { t: 'Other', m: 'X\ty' }],
  tableWide: [{ page: 'Details', need: 700, width: 512.4 }], headerGrew: [{ page: 'Overview', by: 20 }, { page: 'Details', by: 20 }], tableRows: [{ field: 'City', page: 'Details', need: 400, rows: 30, h: 300 }],
  tableOrder: [{ field: 'Month Name', by: 'Month Number' }, { field: 'Day Name', by: 'Day Number' }], extRenamed: [{ t: T, from: 'Total Sales', to: 'Total Sales (2)' }, { t: 'Other', from: 'Keep', to: 'Keep (2)' }],
  leftOut: [{ kind: 'funnel', page: 'Overview', title: 'Stages' }, { kind: 'line', page: 'Overview' }, { kind: 'slicer', page: 'Overview', narrow: true }, { kind: 'reset', page: 'Details', narrow: true, short: true, title: 'Reset' },
    { kind: 'map', page: 'Details', gave: true }, { kind: 'bar', page: 'Details', noTime: true }, { kind: 'slicer', page: 'Details' }],
  chartTops: [{ top: 6, field: 'City' }, { top: 8, field: 'Product' }], tabRows: [{ rows: 2, size: 9 }, { rows: 2, size: 10 }], noPageButtons: [{ page: 'Overview' }, { page: 'Details' }],
  kpiTitles: { wrapped: [{ page: 'Overview', title: 'Orders' }], shortened: [{ title: 'Total Sales Last Year', shown: 'Total Sales…' }, { title: 'Margin', shown: 'Mar…' }] } });
const given = () => new Map([['Sales[City]', { key: 'Sales[City]', name: 'المدينة', used: true }], ['Sales[Orders]', { key: 'Sales[Orders]', name: 'الطلبات', used: false }]]);

/** The full build state: every condition on. Fresh objects each call (the answer adds to reportNotes and kpiCards). */
export const fullState = () => ({
  a: { lang: 'en', design: true, secondPage: true, subtitles: { mix: 'Products by sales', 'Margin gauge': 'Against the target', Other: 'Not used' } },
  m: { tmsl: tmsl(), tables: tables(), projectDir: 'Project', folder: 'Project/M.SemanticModel' }, r: resultOf(), bind: bindOf(), given: given(),
  written: { visualStyles: { '*': { '*': { background: [{ show: true }] } } } },
  fmt: { fields: [{ field: 'Sales[Total Sales]', format: '#,0' }, { field: 'Sales[Margin %]', format: '0.0%' }], scriptFile: 'M - fix formats.tmdl' },
  projectCheck: { summary: 'No problems.' }, extra: { design: { preset: 'exec' } }, unknown: ['colour'], sc: { scope: { pages: 1 } }, designRepaired: ['layout.kpis'],
  reportNotes: ['The build said this first.'], kpiCards: { built: 3, asked: 4, why: 'One measure shows text.' }, leftOutVisuals: [{ kind: 'gauge' }], textLeftOut: ['Notes', 'Notes', 'Summary'],
  PF: [{ key: 'Sales[Region]', values: ['North', 'South'], type: 'text', typedBy: 'the model', note: 'A page filter note.' }, { key: 'Sales[Year]', values: [2025], type: 'number' }],
  SV: [{ label: 'Bar pic', t: T, at: { page: 0 }, expression: '"<svg/>"' }, { label: 'Ring pic', t: T, at: { page: 1 }, expression: '"<svg r/>"' }], SC: [{ label: 'Ring card', t: T, card: 1, expression: '"<svg/>"' }],
  boundPages: [{ name: 'Overview', slots: [{ kind: 'kpi' }, { kind: 'table' }] }, { name: 'Details', slots: [{ kind: 'bar' }] }],
  smallPageNote: { w: 640 }, tinyPage: true, subKeys: { mix: 'mix' }, ringNumbers: ['Ring card', 'Other ring'], FULL: true, cardFormats: ['Sales[Total Sales]'], tableFormats: ['Sales[Avg Price]'],
  flip: null, icons: null, daxR: null, englishNames: new Set(['Calendar[Month Name]', 'Calendar[Day Name]']), textKpis: [{ t: T, m: 'Label' }, { t: T, m: 'Note' }], slicersDropped: ['Sales[Region]', 'Sales[Region]'],
  byFlagDay: [{ t: 'Calendar', c: 'Date', flag: { t: 'Calendar', c: 'Is Ramadan' } }], modelNames: { [T]: ['Total Sales'], Other: ['keep'] },
  F: { kpis: [M('Total Sales'), M('الطلبات')], measure: M('Total Sales'), category: C('المدينة'), table: [C('City')], slicers: [C('المدينة')] },
  galleryList: [{ kind: 'combo', page: 'Overview' }], SW: null, CO: null, barThickness: { charts: 1 }, fieldsOf });

// one variant per condition: [name, change]; each change edits a fresh full state
const one = (k) => (s) => { s.r[k] = s.r[k].slice(0, 1); }, none = (k) => (s) => { s.r[k] = []; }, drop = (k) => (s) => { delete s.r[k]; };
export const VARIANTS = [
  ['full', () => {}],
  ['transparent theme', (s) => { s.written = {}; }], ['no KPI cards', (s) => { s.kpiCards = null; }], ['no visuals left out of the cards', (s) => { s.leftOutVisuals = []; }],
  ['one text box', (s) => { s.textLeftOut = ['Notes']; }], ['no text box', (s) => { s.textLeftOut = []; }], ['no design', (s) => { s.a.design = false; }],
  ['no titles at all', (s) => { delete s.r.titles; }], ['titles: none shortened, a slicer', (s) => { s.r.titles.shortened = []; }], ['titles: shortened only', (s) => { s.r.titles.slicers = []; }],
  ['titles: one shortened', (s) => { s.r.titles.shortened = s.r.titles.shortened.slice(0, 1); s.r.titles.slicers = []; }], ['titles: wrapped only', (s) => { s.r.titles.shortened = []; s.r.titles.slicers = []; }],
  ['titles: nine shortened', (s) => { s.r.titles.shortened = Array.from({ length: 9 }, (_, i) => ({ title: 'Title ' + i, shown: 'T' + i })); }],
  ['one page filter', (s) => { s.PF = s.PF.slice(0, 1); }], ['no page filters', (s) => { s.PF = null; }], ['a page filter without its note', (s) => { s.PF.forEach((f) => { delete f.note; delete f.typedBy; }); }],
  ['no table in the bind', (s) => { delete s.bind.table; }], ['no card formats', (s) => { s.cardFormats = []; }], ['no table formats', (s) => { s.tableFormats = []; }],
  ['every format with a separator', (s) => { s.m.tmsl.model.tables[0].measures.forEach((x) => { x.formatString = '#,0'; }); s.m.tmsl.model.tables[0].columns.forEach((x) => { x.formatString = '#,0'; }); }],
  ['no SVG columns', (s) => { s.SV = null; }], ['no SVG cards', (s) => { s.SC = null; }], ['no SVG at all', (s) => { s.SV = []; s.SC = []; }], ['one SVG', (s) => { s.SV = s.SV.slice(0, 1); s.SC = []; }],
  ['no SVG sizes', drop('svgSizes')], ['no SVG size capped', (s) => { s.r.svgSizes[0].capped = false; }], ['no small page', (s) => { s.smallPageNote = null; }],
  ['a tiny page with one page', (s) => { s.a.secondPage = false; }], ['not a tiny page', (s) => { s.tinyPage = false; }], ['no subtitles asked', (s) => { delete s.a.subtitles; }],
  ['every subtitle used', (s) => { s.r.subtitlesUsed = ['mix', 'Margin gauge', 'Other']; }], ['a subtitle key mapped', (s) => { s.subKeys = { Other: 'mix' }; }], ['no subtitles used', drop('subtitlesUsed')],
  ['one blank card', one('blankKept')], ['no blank card', none('blankKept')], ['one bar chart', one('barCharts')], ['no bar charts', drop('barCharts')],
  ['one short day', one('shortDays')], ['short days without a short column', (s) => { delete s.bind.cats.column.short; }], ['no short days', none('shortDays')],
  ['one small ring', one('ringsSmall')], ['no small rings', none('ringsSmall')], ['one ring number', (s) => { s.ringNumbers = ['Ring card']; }], ['no ring numbers', (s) => { s.ringNumbers = []; }],
  ['values auto', (s) => { s.FULL = false; }], ['colours: not soft', (s) => { delete s.r.chartColors.ends.soft; }], ['colours: second soft', (s) => { s.r.chartColors.ends2.soft = true; }],
  ['colours: no second', (s) => { delete s.r.chartColors.second; }], ['colours: no second ends', (s) => { delete s.r.chartColors.ends2; }], ['colours: no charts', (s) => { s.r.chartColors.charts = 0; }],
  ['colours: asked, cannot fade', (s) => { s.r.chartColors = { asked: true, base: '#EEEEEE' }; }], ['colours: solid, not asked', (s) => { s.r.chartColors = { base: '#1060A0' }; }], ['no colours', drop('chartColors')],
  ['axes standard', (s) => { s.r.chartAxes.asked = 'standard'; }], ['axes left to right', (s) => { s.r.chartAxes.rtl = false; }], ['no axes', drop('chartAxes')],
  ['no slicer style', drop('slicerStyle')], ['no grid', drop('grid')], ['no waterfalls', drop('waterfallRtl')], ['one waterfall, no why', (s) => { s.r.waterfallRtl = [{ page: 'P', written: 'waterfallChart', what: 'native' }]; }],
  ['one English name', (s) => { s.englishNames = new Set(['Calendar[Month Name]']); }], ['no English names', (s) => { s.englishNames = new Set(); }],
  ['no text KPIs', (s) => { s.textKpis = []; }], ['one text KPI', (s) => { s.textKpis = s.textKpis.slice(0, 1); }], ['one time axis', one('timeAxes')], ['no time axes', drop('timeAxes')],
  ['one top chart, kept all', (s) => { s.r.topCharts = [{ top: 5, allUpTo: 6 }]; }], ['one top chart, Top N', (s) => { s.r.topCharts = [{ top: 5 }]; }], ['no top charts', none('topCharts')],
  ['nothing blank filtered', (s) => { s.r.blankFiltered = 0; }], ['no table on the pages', (s) => { s.boundPages.forEach((p) => { p.slots = p.slots.filter((x) => x.kind !== 'table'); }); }], ['no bound pages', (s) => { s.boundPages = null; s.SV = []; s.r.svgSizes = {}; }],
  ['one colour stepped', (s) => { s.r.a11y.colours = s.r.a11y.colours.slice(0, 1); }], ['no colours stepped', drop('a11y')],
  ['tooltip: top only', (s) => { s.r.tooltipLimits = { top: 6 }; }], ['tooltip: months only', (s) => { s.r.tooltipLimits = { months: 12 }; }], ['tooltip: neither', (s) => { s.r.tooltipLimits = {}; }], ['no tooltip limits', drop('tooltipLimits')],
  ['one slicer dropped', (s) => { s.slicersDropped = ['Sales[Region]']; }], ['two slicers dropped', (s) => { s.slicersDropped = ['Sales[Region]', 'Sales[Year]']; }], ['no slicer dropped', (s) => { s.slicersDropped = []; }],
  ['formats mixed: dynamic only', (s) => { s.bind.formatsMixed = s.bind.formatsMixed.slice(0, 1); }], ['formats mixed: unformatted only', (s) => { s.bind.formatsMixed = s.bind.formatsMixed.slice(1); }], ['no formats mixed', (s) => { delete s.bind.formatsMixed; }],
  ['no flag day', (s) => { s.byFlagDay = []; }], ['table smaller without rows, cut', (s) => { s.r.tableSmaller = [{ size: 9, from: 10, page: 'Details' }]; }], ['table smaller, not cut', (s) => { s.r.tableSmaller[0].page = 'Overview'; }], ['no table smaller', drop('tableSmaller')],
  ['row labels in Arabic', (s) => { s.a.lang = 'ar'; }], ['no row labels', drop('rowLabels')], ['no row label skipped', drop('rowLabelSkipped')], ['no data skipped: none', drop('noDataSkipped')],
  ['no wide table', drop('tableWide')], ['no header grew', drop('headerGrew')], ['one header grew', one('headerGrew')], ['no table rows', drop('tableRows')], ['one table order', one('tableOrder')], ['no table order', drop('tableOrder')],
  ['no language', (s) => { delete s.bind.language; }], ['language: nothing skipped', (s) => { s.bind.language = {}; }], ['language: one each', (s) => { s.bind.language = { skipped: ['A'], fallback: ['ب'] }; }],
  ['no fields named', (s) => { s.F = null; }], ['fields named, all English', (s) => { s.F = { measure: M('Total Sales'), table: [C('City')] }; }],
  ['no renamed', drop('extRenamed')], ['no not reached', (s) => { delete s.bind.notReached; }], ['one not reached of two tables', (s) => { s.bind.notReached = [{ t: 'Budget', m: 'Target', row: { t: T, c: 'City' } }, { t: 'Plan', m: 'Goal', row: { t: T, c: 'City' } }]; }],
  ['no category unrelated', (s) => { delete s.bind.noRelatedCategory; }], ['calendar unrelated', (s) => { s.bind.noRelatedCalendar = { kind: 'calendar', measure: { t: T, m: 'Total Sales' }, tables: ['Calendar', 'Dates'] }; }],
  ['no measure for the line', (s) => { delete s.bind.measure; delete s.bind.noRelatedCalendar; }], ['no calendar reason', (s) => { delete s.bind.noRelatedCalendar; }],
  ['nothing left out', drop('leftOut')], ['only narrow left out', (s) => { s.r.leftOut = s.r.leftOut.filter((x) => x.narrow); }], ['one left out', (s) => { s.r.leftOut = s.r.leftOut.slice(0, 1); }],
  ['one narrow, one short', (s) => { s.r.leftOut = s.r.leftOut.filter((x) => x.narrow).concat([{ kind: 'slicer', page: 'P', narrow: true, short: true }]); }], ['no table columns', drop('tableColumns')],
  ['two tables cut', (s) => { s.r.tableColumns.push({ page: 'Overview', kept: [1, 2], leftOut: [C('Region')] }); }], ['one chart top', one('chartTops')], ['no chart tops', drop('chartTops')],
  ['one tab row page', one('tabRows')], ['no tab rows', drop('tabRows')], ['one page without buttons', one('noPageButtons')], ['no page buttons left out', drop('noPageButtons')],
  ['no KPI titles', drop('kpiTitles')], ['KPI titles wrapped only', (s) => { s.r.kpiTitles.shortened = []; }], ['one KPI title shortened', (s) => { s.r.kpiTitles = { wrapped: [], shortened: s.r.kpiTitles.shortened.slice(0, 1) }; }],
  ['no display names', (s) => { s.given = new Map(); }], ['Arabic', (s) => { s.a.lang = 'ar'; }], ['Arabic, every field named', (s) => { s.a.lang = 'ar'; fieldsOf(s.bind).forEach((f) => { f.name = 'اسم'; }); }],
  ['no formats script', (s) => { s.fmt = null; }], ['one format', (s) => { s.fmt.fields = s.fmt.fields.slice(0, 1); }], ['no project check', (s) => { s.projectCheck = null; }],
  ['no phone layout', (s) => { s.r.files = s.r.files.slice(0, 1); }], ['no scope', (s) => { s.sc = {}; }], ['not repaired', (s) => { s.designRepaired = null; }], ['nothing ignored', (s) => { s.unknown = null; }],
  ['no gallery', (s) => { s.galleryList = null; }], ['no bar thickness', (s) => { s.barThickness = null; }], ['no notes before', (s) => { s.reportNotes = []; }],
  ['hidden names in the model', (s) => { s.m.tables.push({ name: 'Hid​den', columns: [{ name: 'A​b' }], measures: [] }); }],
  ['the calendar offered', (s) => { s.CO = { offered: true, table: 'Calendar', columns: ['اسم الشهر'], englishData: ['Sales[City]', 'Sales[Zone]'], englishDataWhy: 'why', howToSwitch: 'how', scriptAfterGo: 'C.tmdl', howToApply: 'apply' }; }],
  ['the calendar left out', (s) => { s.CO = { leftOut: ['Calendar'], why: 'no calendar' }; }],
];
