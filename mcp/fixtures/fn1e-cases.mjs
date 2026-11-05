// 0.3.2 FN1E (mcp/work/FN1E.md): made-up inputs for test-0.3.2-fn1e.mjs. Pure data, no I/O: the approval page's plan
// data for every kind and every section summaryOf writes (D), and the visuals meaningOf reads (M), each with the edges
// of its conditions (a field at 0, an empty string, a value at a rounding edge). Made-up names only.

// ---------- D: the approval page (approval-disclosure.mjs summary) ----------
const O = (...a) => Object.assign({}, ...a);
// a report plan's data with every section (each key a part of summaryOf's report branch)
export function reportData() {
  return {
    pins: { create_report: {
      name: 'Retail Sales', title: 'Sales "today"', lang: 'en', page: { width: 1280, height: 720 }, customVisualsFrom: 'Old Retail',
      design: { layout: { preset: 'exec', kpis: 4, filters: 'left', header: false, page: '16:9' }, data: ['#112233', '#445566', '#112233'] },
      secondPage: false,
      fields: { kpis: ['Total Sales', 'Orders'], measure: 'Total Sales', timeAxis: 'Date[Month]', category: 'Region', category2: 'Status', table: ['Region', 'Total Sales'], slicers: ['Year', 'Channel'] },
      displayNames: { 'Total Sales': 'Sales', Orders: 'Order count' }, focus: 'Total Sales', tables: ['Sales'],
      gallery: ['combo', 'waterfall'], theme: 'brand.json', logo: 'logo.png', colors: { brand: '#0055aa', accent: '#ff8800' }, chartAxes: true,
      kpiValues: 'auto', noDataMessage: 'Nothing yet', slidePanel: true, smoothLines: false, slicerStyle: 'pills', grid: 'dotted',
      flipCards: [1], waterfallRtl: 'mirror', statusIcons: ['Margin %'], daxFunctions: true,
      sharedAxes: [{ measures: ['Sales', 'Target'], answer: 'comparable' }, { measures: ['Orders', 'Margin'], answer: 'separate' }],
      font: 'Segoe UI', rtl: false, dir: 'ltr', pageFilters: ['Year'], text: 'A short sentence', subtitles: true, svgColumns: false, svgCards: ['Sales']
    } },
    outputs: ['Sales/Retail Sales - New.pbip', 'Sales/Retail Sales - New.Report/definition/pages/a1/page.json', 'Sales/Retail Sales - New.Report/definition/pages/a1/visuals/v1/visual.json',
      'Sales/Retail Sales - New.Report/definition/pages/a1/visuals/v2/visual.json', 'Sales/Retail Sales - New.Report/StaticResources/RegisteredResources/bg.png',
      'Sales/Retail Sales - New.Report/StaticResources/RegisteredResources/glass.png', 'Sales/Retail Sales - New.Report/StaticResources/RegisteredResources/theme.json',
      'Sales/Retail Sales - New - metric switcher.tmdl', 'Sales/Retail Sales - New - status icons.tmdl', 'Sales/Retail Sales - New - DAX functions 2.tmdl',
      'Sales/Retail Sales - New - flip cards.tmdl', 'Sales/other.tmdl', 'Sales/Retail Sales - New.Report/definition/bookmarks/b1.bookmark.json'],
    blankImages: ['Sales/Retail Sales - New.Report/StaticResources/RegisteredResources/bg.png'],
    glassImages: ['Sales/Retail Sales - New.Report/StaticResources/RegisteredResources/glass.png'],
    bilingual: { copy: { report: 'Retail Sales (EN-AR)', project: 'Retail Sales (EN-AR).pbip' }, pairs: [{ english: { name: 'Overview' }, arabic: { name: 'نظرة', hidden: true } }, { english: { name: 'Tip' }, arabic: { name: 'تلميح' }, tooltip: true }],
      buttons: [{ on: 'English', page: 'Overview', placed: true, text: 'العربية', at: 'top right' }, { on: 'Arabic', page: 'نظرة', placed: false }], syncGroups: [{ page: 'Overview', slicer: 's1', arabicSlicer: 's1ar', group: 'g1' }],
      tabs: { shown: 'English', hidden: 'Arabic', tooltipPages: 'hidden' }, bookmarks: 'none', measures: [{ arabic: 'المبيعات', measure: 'Sales' }],
      notFullyArabic: { en: 'Two titles stay English', ar: 'عنوانان بالإنجليزية' } },
    preview: { pages: [{ name: 'Overview' }] },
    daxFunctions: { compatibility: { raises: true, sayFirst: 'It goes to 1702.', sayFirstAr: 'يرتفع إلى 1702.' },
      functions: [{ name: 'Spark', params: 'v' }, { name: 'Bullet', params: 'a, b', inScript: false }],
      measures: [{ measure: 'Sales Spark', use: 'sparkline', of: 'Sales' }, { measure: 'Sales Bullet', use: 'bulletBar', of: 'Sales' }, { measure: 'Sales Card', use: 'kpiCards', of: 'Sales' }, { measure: 'Title', use: 'storyTitles', of: 'Sales' }, { measure: 'Odd', use: 'other', of: 'Sales' }],
      colours: 'the theme', modelChange: 'adds 5 measures', status: 'preview feature', notUsed: [{ use: 'sparkline', page: 'Detail page', why: 'no table' }, { use: 'bullet', why: 'no target' }] },
    kinds: [{ role: 'Sales by Region', from: 'bar', to: 'column', said: 'the names fit' }, { from: 'column', to: 'donut' }, { role: 'Trend', from: 'line', to: 'bar', why: 'few points' }, { from: 'zz', to: 'yy' }],
    pagesWritten: [{ n: 1, name: 'Tip page', tooltip: true, hidden: true, visuals: 1, usedBy: ['Overview chart'] }, { n: 2, name: 'Overview', visuals: 5, slicers: ['Year', 'Channel'],
      buttons: [{ to: 'page', name: 'Detail' }, { to: 'bookmark', name: 'Reset' }, { to: 'other' }], kinds: [{ type: 'clusteredBarChart', count: 2, by: ['Region', 'Status'] }, { type: 'card', count: 1 }, { type: 'zzNew', count: 3 }] },
      { n: 3, name: 'Hidden one', hidden: true, visuals: 0 }, { n: 4, name: 'Tip two', tooltip: true, visuals: 2 }],
    terminology: [{ en: 'Sales', field: 'Sales[Amount]', ar: 'المبيعات', status: 'approved', earlier: true }, { en: 'Orders', field: 'Sales[Orders]', ar: 'الطلبات', status: 'approved' },
      { en: 'Region', field: 'Geo[Region]', ar: 'المنطقة', status: 'draft' }, { en: 'SKU', field: 'P[SKU]', status: 'kept', why: 'kept in English for now: a code' }, { en: 'Code', field: 'P[Code]', status: 'kept' }],
    gulfDates: [['Date', 'Calendar[Date]'], ['Grain', 'day']],
    notTranslated: [{ field: 'SKU', why: 'a code' }, { field: 'Zone' }],
    waterfallRtl: [{ page: 'Overview', title: 'Bridge', written: 'mirror', what: 'a stacked column chart', why: 'right to left' }, { page: 'Detail', written: 'native', what: 'Power BI\'s own' }],
    waterfalls: 2,
    flipCards: { cards: [{ page: 'Overview', card: 1, title: 'Sales', back: { description: 'All sales', value: '10', yearOnYear: '+2%' } }, { page: 'Overview', card: 2 }], bookmarks: 4, newMeasures: 2, scriptAfterGo: 'Retail - flip cards.tmdl', notFlipped: [{ card: 3, why: 'no measure' }] },
    statusIcons: { columns: [{ page: 'Detail', visual: 'matrix', measure: 'Margin %', way: 'rules', thresholds: { good: 0.3, bad: 0.1 } }, { page: 'Detail', visual: 'table', measure: 'Growth', statusMeasure: 'Growth Status', target: 'Growth Target' }],
      icons: 'circles', placement: 'left', modelChange: 'one measure', themeAdded: 'icon colours', notShown: [{ measure: 'Cost', why: 'no target' }], none: 'two rates' },
    colours: { changed: [{ from: '#112233', to: '#3366AA', contrast: 2.1 }], card: '#ffffff' },
    look: { look: 'glass', chosenBy: 'default' },
    metricSwitcher: { page: 'Overview', measures: [{ field: 'Sales', label: 'Sales' }, { field: 'Orders', label: 'Orders' }], charts: [{ kind: 'bar', by: 'Region' }, { kind: 'line', by: 'Month' }, { kind: 'pie', by: 'X' }],
      notSwitched: ['Card 1'], leftOut: [{ field: 'Stock', why: 'its table is not related' }], fallbackTitle: 'Sales', modelChange: 'a field parameter', script: 'Retail - metric switcher.tmdl', beforeApplied: 'blank', savedSelection: 'Sales' },
    barThickness: { said: { en: '2 charts, bars 40 px at most', ar: 'مخططان' } },
    gallery: [{ kind: 'combo', title: 'Sales and margin', written: 'combo', why: 'two measures' }, { kind: 'waterfall', written: 'columnChart', why: 'no breakdown' }, { kind: 'zz', written: 'zz' }],
    alreadyThere: ['Sales/Retail - status icons.tmdl'],
    customVisualsShown: [{ lead: '2 replaced', levels: { high: '1', medium: '1' } }, { line: 'Gantt -> table', confidence: 'medium', evidence: 'its roles', lost: ['the bars: no native visual'], needs: ['tooltips'],
      second: { chosen: true, label: 'Matrix', native: 'pivotTable', pick: 'matrix', lost: ['the order: kept', 'x'], needs: ['totals'] } }, { line: 'Bullet -> gauge' }],
    exact: { notChecked: [{ check: 'validator', why: 'not installed' }, { check: 'zz', why: '' }], pages: 3 },
    writesAr: ['يكتب التقرير'], outputsAt: 'Sales'
  };
}
const del = (o, path) => { const k = path.split('.'), last = k.pop(); let x = o; for (const s of k) x = x[s]; delete x[last]; return o; };
const set = (o, path, v) => { const k = path.split('.'), last = k.pop(); let x = o; for (const s of k) x = x[s]; x[last] = v; return o; };
// every key of the report's data and of its create_report pins, left out once
const REPORT_KEYS = Object.keys(reportData()).filter((k) => k !== 'pins').concat(Object.keys(reportData().pins.create_report).map((k) => 'pins.create_report.' + k));
// [name, path, value] changes to the full report, each alone, then each again on an Arabic report
const REPORT_EDITS = [
  ['name the same as written', 'pins.create_report.name', 'Retail Sales - New'], ['no title, a name', 'pins.create_report.title', ''],
  ['no page, layout page', 'pins.create_report.page', undefined], ['customVisualsFrom empty', 'pins.create_report.customVisualsFrom', ''],
  ['header undefined', 'pins.create_report.design.layout.header', undefined], ['filters none', 'pins.create_report.design.layout.filters', ''],
  ['preset unknown', 'pins.create_report.design.layout.preset', 'zz'], ['kpis undefined', 'pins.create_report.design.layout.kpis', undefined],
  ['secondPage true', 'pins.create_report.secondPage', true], ['fields all seven', 'pins.create_report.fields', { kpis: ['A'], measure: 'M', timeAxis: 'T', category: 'C', category2: 'C2', table: ['A'], slicers: ['S'] }],
  ['fields none', 'pins.create_report.fields', {}], ['displayNames empty', 'pins.create_report.displayNames', {}],
  ['pages by hand', 'pins.create_report.pages', [{ name: 'One', slots: [{ kind: 'card', title: 'Sales', text: 'x'.repeat(130) }, { kind: 'bar' }], background: 'bg.png' }, { name: 'Two' }]],
  ['chartColors solid', 'pins.create_report.chartColors', 'solid'], ['chartColors gradient', 'pins.create_report.chartColors', 'gradient'],
  ['gallery true', 'pins.create_report.gallery', true], ['gallery false', 'pins.create_report.gallery', false], ['smoothLines true', 'pins.create_report.smoothLines', true],
  ['slicerStyle dropdown', 'pins.create_report.slicerStyle', 'dropdown'], ['grid solid', 'pins.create_report.grid', 'solid'], ['grid other', 'pins.create_report.grid', 'zz'],
  ['flipCards true', 'pins.create_report.flipCards', true], ['flipCards two', 'pins.create_report.flipCards', [1, 2]], ['flipCards false', 'pins.create_report.flipCards', false],
  ['statusIcons true', 'pins.create_report.statusIcons', true], ['statusIcons two', 'pins.create_report.statusIcons', ['A', 'B']], ['statusIcons false', 'pins.create_report.statusIcons', false],
  ['kpiValues full', 'pins.create_report.kpiValues', 'full'], ['colors text', 'pins.create_report.colors', 'brand'], ['sharedAxes text', 'pins.create_report.sharedAxes', 'ask'],
  ['rtl true', 'pins.create_report.rtl', true], ['dir rtl', 'pins.create_report.dir', 'rtl'], ['waterfallRtl native', 'pins.create_report.waterfallRtl', 'native'],
  ['waterfallRtl list empty', 'waterfallRtl', []], ['waterfalls 0', 'waterfalls', 0], ['waterfalls 1', 'waterfalls', 1],
  ['bilingual true', 'bilingual', true], ['preview with pairs', 'preview', { pages: [{ name: 'Overview' }], pairs: [] }], ['preview no pages', 'preview', {}],
  ['DF not raised', 'daxFunctions.compatibility', { raises: false, sayFirst: 'Already 1702.' }], ['DF no compatibility', 'daxFunctions.compatibility', null],
  ['DF empty', 'daxFunctions', { compatibility: { raises: true } }],
  ['kinds said with saidAr', 'kinds', [{ role: 'R', from: 'bar', to: 'column', said: 'the names fit', saidAr: 'تتسع الأسماء' }, { from: 'bar', to: 'donut', said: 'the names fit' }]],
  ['kinds bar only', 'kinds', [{ from: 'bar', to: 'bar', why: 'w' }]], ['kinds none', 'kinds', []],
  ['pagesWritten tooltips only', 'pagesWritten', [{ n: 1, name: 'T', tooltip: true, visuals: 1 }]], ['pagesWritten empty', 'pagesWritten', []],
  ['pagesWritten one visual', 'pagesWritten', [{ n: 1, name: 'x'.repeat(90), visuals: 1, slicers: ['A'], buttons: [{ to: 'page', name: 'B' }], kinds: [{ type: 'card', count: 1, by: [] }, { type: 'card' }] }]],
  ['slicersAdded', 'slicersAdded', ['Store', 'City']], ['colours changed second', 'colours', { changed: [{ from: '#445566', to: '#556677', contrast: 2.5 }], card: 'white' }],
  ['colours card odd', 'colours', { changed: [{ from: '#AABBCC', to: '#abcdef', contrast: 1.9 }, { from: '#112233', to: 'navy', contrast: 2 }], card: '#000000' }],
  ['look glass asked', 'look', { look: 'glass', chosenBy: 'user' }], ['look plain failed', 'look', { look: 'plain', glassFailed: [{ check: 'text', ratio: 4.46, min: 4.5 }, { check: 'cards', ratio: 0, min: 3 }, { check: 'kpi' }] }],
  ['look plain asked', 'look', { look: 'plain' }], ['look not object', 'look', 'glass'],
  ['metricSwitcher bare', 'metricSwitcher', { page: '' }], ['metricSwitcher long', 'metricSwitcher', { page: 'P', measures: [{ field: 'f'.repeat(130), label: 'l'.repeat(110) }], leftOut: [{ field: 'f'.repeat(130), why: 'w'.repeat(310) }] }],
  ['barThickness text', 'barThickness', { said: 'two' }], ['barThickness no ar', 'barThickness', { said: { en: 'x' } }],
  ['gallery long title', 'gallery', [{ kind: 'smallMultiples', title: 't'.repeat(90), written: 'smallMultiples', why: 'w' }]],
  ['notFullyArabic no ar', 'bilingual.notFullyArabic', { en: 'One title' }], ['notFullyArabic no en', 'bilingual.notFullyArabic', { ar: 'x' }],
  ['customVisualsShown none', 'customVisualsShown', undefined], ['customVisuals', 'customVisuals', [{ from: 'Gantt', to: 'table' }]],
  ['customVisualsShown no lead', 'customVisualsShown', [{ line: 'A -> B', confidence: 'high', lost: [], second: { native: 'card', pick: 'c' } }, { lead: 'one', levels: null }]],
  ['exact no pages', 'exact', { notChecked: [{ check: 'rules', why: 'no model' }, { check: 'references' }, { check: 'lint' }] }],
  ['flipCards none', 'flipCards', { cards: [] }], ['flip no pbip', 'outputs', ['a.json', 'Retail - flip cards.tmdl', 'x.png']],
  ['statusIcons bare', 'statusIcons', { columns: [{ page: 'p'.repeat(70), measure: 'm'.repeat(130), way: 'target' }] }],
  ['terminology empty', 'terminology', []], ['gulfDates empty', 'gulfDates', []], ['notTranslated empty', 'notTranslated', []], ['alreadyThere empty', 'alreadyThere', []],
  ['waterfallRtl long', 'waterfallRtl', [{ page: 'p'.repeat(70), title: 't'.repeat(90), written: 'mirror', what: 'w' }]]
];
export function disclosureCases() {
  const C = [];
  C.push(['report full', 'report', reportData()]);
  REPORT_KEYS.forEach((k) => C.push([`report without ${k}`, 'report', del(reportData(), k)]));
  const ar = () => set(reportData(), 'pins.create_report.lang', 'ar');
  C.push(['report Arabic', 'report', ar()]);
  REPORT_KEYS.forEach((k) => C.push([`report Arabic without ${k}`, 'report', del(ar(), k)]));
  REPORT_EDITS.forEach(([n, p, v]) => { C.push([`report ${n}`, 'report', set(reportData(), p, v)]); C.push([`report Arabic ${n}`, 'report', set(ar(), p, v)]); });
  C.push(['report empty', 'report', {}], ['report null', 'report', null], ['report name only', 'report', { pins: { create_report: { name: 'Only' } } }],
    ['report design only', 'report', { pins: { create_report: { design: { layout: {} } } } }], ['report pages only', 'report', { pins: { create_report: { pages: [] } } }]);
  // the redesign
  const shown = () => ({ original: 'Old.Report', newReport: 'Old - New design.Report',
    pages: [{ page: 'Overview', changes: [
      { visual: 'v1', type: 'clusteredBarChart', fields: ['Region', 'Sales'], place: 'top left', from: { x: 10, y: 20, w: 300, h: 200 }, to: { x: 40.4, y: 5, w: 280, h: 260.6 }, narrower: 'its labels fit', title: { to: 'Sales by Region' } },
      { visual: 'v2', type: 'custom aBulletChart', from: { x: 0, y: 0, w: 10, h: 10 }, to: { x: 0, y: 0, w: 10, h: 10 }, title: 'kept', overlays: [{ visual: 'o1', type: 'card', fields: ['Sales'], from: { x: 1 }, to: { x: 1, y: 2, w: 3, h: 4 } }, { visual: 'o2', type: 'shape' }] },
      { visual: 'v3', type: 'tableEx', text: [{ class: 'title', property: 'fontFamily', from: 'Arial', to: 'Segoe UI' }, { class: 'label', property: 'fontSize', from: '9', to: 'the theme\'s' }, { class: 'zz', property: 'bold', from: 'true', to: 'true' },
        { class: 'zz', property: 'italic', from: 'x', to: 'x' }, { class: 'header', property: 'other', from: 'a', to: 'b' }], overlays: [{ visual: 'o3', type: 'card' }] },
      { visual: 'v4', type: 'lineChart', from: { x: 50, y: 50, w: 100, h: 100 }, to: { x: 20, y: 80, w: 90, h: 90 }, text: [{ class: 'title', property: 'fontSize', from: '12', to: '12' }] },
      { visual: 'v5', type: 'pieChart', from: { x: 5, y: 5, w: 5, h: 5 }, to: { x: 5, y: 5, w: 5, h: 50 } }],
    notChanged: [{ visual: 'n1', type: 'image', why: 'a picture' }, { visual: 'n2', type: 'card', why: 'on a tooltip page', overlays: [{ visual: 'o4', type: 'shape', from: { x: 1 }, to: { x: 2, y: 2, w: 2, h: 2 } }] }] },
    { page: 'Tips', why: 'a tooltip page', notChanged: [{ visual: 'n3', type: 'card', why: 'a tooltip page' }, { visual: 'n4', type: 'card', why: 'its own' }] }, { page: 'Empty' }],
    theme: { file: 'theme.json', tokens: { dataColors: ['#111111', '#222222'], foreground: '#333333', tableAccent: 'blue', zz: 5 } },
    text: { set: [{ what: 'Titles', font: 'Segoe UI', size: '12pt' }, { class: 'title', font: 'Arial', size: '9' }, { class: 'zz', font: 'f', size: 's' }], mode: 'theme', boldItalic: 'kept', theme: 'Retail', removed: 3,
      kept: [{ page: 'Overview', visual: 'v9', property: 'titleFontFamily', why: 'a choice' }, { page: 'Overview', visual: 'v9', property: 'fontSize', why: 'w' }, { page: 'O', visual: 'v', property: 'bold', why: 'w' },
        { page: 'O', visual: 'v', property: 'italic', why: 'w' }, { page: 'O', visual: 'v', property: 'titleBold', why: 'w' }, { page: 'O', visual: 'v', property: 'titleZz', why: 'w' }, { page: 'O', visual: 'v', property: 'zz', why: 'w' }],
      untouched: [{ page: 'Overview', visual: 'v8', type: 'custom zz', why: 'a custom visual' }], themeStyles: 'kept' },
    keptAsIs: { pages: 3, bookmarks: 1, buttons: 2, reportFilters: 1, pageFilters: 0, visualFilters: 4, slicerSelections: 1, tooltipLinks: 2, tooltipPages: 1, drillthroughPages: 1, interactions: 5, groups: 1, customVisuals: 2, phoneLayouts: 1, resources: 3 } });
  const RD = () => ({ shown: shown(), outputs: ['x/Old - New design.Report/StaticResources/RegisteredResources/theme.json', 'x/Old - New design.Report/StaticResources/RegisteredResources/pic.jpg', 'x/Old - New design.Report/definition/pages/p/page.json'], copied: 40 });
  C.push(['redesign full', 'redesign', RD()]);
  [['no theme', 'shown.theme', undefined], ['theme no tokens', 'shown.theme', { file: 't.json', tokens: {} }], ['text mode most', 'shown.text.mode', 'most'], ['no text', 'shown.text', undefined],
    ['text set not a list', 'shown.text.set', 'x'], ['no kept list', 'shown.text.kept', undefined], ['no themeStyles', 'shown.text.themeStyles', ''], ['not copied', 'copied', 0], ['no outputs', 'outputs', undefined],
    ['no pages', 'shown.pages', 'x'], ['keptAsIs ones', 'shown.keptAsIs', { pages: 1, bookmarks: 1, buttons: 1, reportFilters: 1, pageFilters: 1, visualFilters: 1, slicerSelections: 1, tooltipLinks: 1, tooltipPages: 1, drillthroughPages: 1, interactions: 1, groups: 1, customVisuals: 1, phoneLayouts: 1, resources: 1 }],
    ['no original', 'shown.original', undefined]].forEach(([n, p, v]) => C.push([`redesign ${n}`, 'redesign', set(RD(), p, v)]));
  C.push(['redesign empty', 'redesign', {}]);
  // the sample project
  const SM = () => ({ pins: { create_report: { lang: 'ar' } }, sample: { what: 'A shop', madeUp: 'all of it', folder: 'Sample Shop', project: 'Sample.pbip', dateTable: 'Calendar', report: 'empty', relationships: 0, rows: '1,000',
    tables: [{ table: 'Sales', rows: 1000, columns: 5, measures: 3 }, { table: 'Calendar', rows: 365, columns: 4, measures: 0 }] },
  sampleAr: { what: 'متجر', madeUp: '', project: 'Sample.pbip', relationships: 'لا', tables: ['المبيعات', 'التقويم'] }, outputs: ['Sample Shop/Sample.pbip', 'Sample Shop/Sample.SemanticModel/definition/tables/Sales.tmdl', 'Sample Shop/Sample.Report/definition/report.json', 'Sample Shop/x.txt'] });
  C.push(['sample Arabic', 'sample', SM()]);
  [['English', 'pins.create_report.lang', 'en'], ['tables differ', 'sampleAr.tables', ['x']], ['no sampleAr', 'sampleAr', undefined], ['sampleAr text', 'sampleAr', 'x'], ['no folder', 'sample.folder', ''],
    ['relationships null', 'sample.relationships', null], ['relationships 2', 'sample.relationships', 2], ['no outputs', 'outputs', undefined], ['no tables', 'sample.tables', undefined]].forEach(([n, p, v]) => C.push([`sample ${n}`, 'sample', set(SM(), p, v)]));
  C.push(['sample empty', 'sample', {}]);
  // the Arabic twin
  const TW = () => ({ labels: { t1: 'المبيعات', t2: 'الطلبات', t3: 'نص' }, names: { t1: 'Title "Sales"', t2: 'Card Orders' }, namesAr: { t1: 'العنوان' }, timeRightToLeft: true, arabicMonth: true,
    picturePages: 2, mirrorPicturePages: false, waterfalls: 1, waterfallRtl: 'native', matrixAsTable: Array.from({ length: 32 }, (_, i) => 'M' + i), matrices: 'kept as they are',
    terminology: [{ en: 'Sales', field: 'S[A]', ar: 'المبيعات', status: 'approved' }], notTranslated: [{ field: 'SKU', why: 'a code', whyAr: 'رمز' }, { field: 'Zone' }],
    preview: { pages: [{ name: 'p' }], asTables: Array.from({ length: 31 }, (_, i) => (i === 0 ? { page: 'P', pageAr: 'ص', title: 'T', titleAr: 'ع', visual: 'v0' } : i === 1 ? { page: 'P', title: 'T', visual: 'v1' } : { page: 'P', visual: 'v' + i })) },
    added: Array.from({ length: 31 }, (_, i) => ({ page: 'P', name: 'weekdays ' + i, beside: 'heat ' + i })),
    orderCalculations: { visuals: Array.from({ length: 31 }, (_, i) => ({ visual: 'oc' + i, functions: i === 0 ? { RUNNINGSUM: 2, PREVIOUS: 1, zz: 3 } : i === 1 ? null : { RANK: 1, INDEX: 0 } })), count: 40, notListed: 9 },
    notFullyArabic: { en: 'A title stays English', ar: 'عنوان بالإنجليزية' }, outputs: ['x/Twin - Arabic calendar.tmdl', 'x/Twin.Report/definition/pages/p/page.json'] });
  C.push(['twin full', 'twin', TW()]);
  [['time left to right', 'timeRightToLeft', false], ['no month', 'arabicMonth', false], ['pictures', 'pictures', [{ page: 'Cover', en: 'flipped', ar: 'معكوسة' }, { page: 'Map' }]], ['picture pages 0', 'picturePages', 0],
    ['picture pages mirrored', 'mirrorPicturePages', true], ['picture pages unknown', 'picturePages', undefined], ['waterfalls 0', 'waterfalls', 0], ['waterfall mirror', 'waterfallRtl', 'mirror'], ['no matrices', 'matrices', ''],
    ['matrixAsTable empty', 'matrixAsTable', []], ['no labels', 'labels', undefined], ['no names', 'names', undefined], ['no terminology', 'terminology', []], ['no notTranslated', 'notTranslated', []],
    ['preview null', 'preview', null], ['preview no pages', 'preview', { pages: [] }], ['no preview', 'preview', undefined], ['oc none listed', 'orderCalculations', { visuals: [{ visual: 'a', functions: { NEXT: 1 } }] }],
    ['oc not a list', 'orderCalculations', { visuals: 'x' }], ['oc empty', 'orderCalculations', { visuals: [] }], ['no added', 'added', undefined], ['nf no ar', 'notFullyArabic', { en: 'x' }], ['nf no en', 'notFullyArabic', { ar: 'x' }],
    ['languages', 'languages', reportData().bilingual], ['no outputs', 'outputs', undefined]].forEach(([n, p, v]) => C.push([`twin ${n}`, 'twin', set(TW(), p, v)]));
  C.push(['twin empty', 'twin', {}]);
  // a theme, the fix scripts, the calendar, another kind
  const TH = () => ({ pins: { generate_theme: { brand: '#0055aa', mode: 'dark', name: 'Brand', lang: 'en' } }, colours: { data: ['#111111', '#222222'], page: '#ffffff', visuals: '#fafafa', text: '#000000', accent: '#ff0000', mode: 'dark', modeAsked: 'light' },
    source: { from: 'visuals', report: 'Old', theme: 'old.json' }, outputs: ['Brand.json', 'x.png'] });
  C.push(['theme full', 'theme', TH()]);
  [['from theme', 'source.from', 'theme'], ['from theme and visuals', 'source.from', 'theme and visuals'], ['no source', 'source', undefined], ['mode light asked light', 'colours', { data: 'x', mode: 'light', modeAsked: 'light' }],
    ['mode asked other', 'colours.modeAsked', 'auto'], ['mode same', 'colours.modeAsked', 'dark'], ['no mode', 'colours.mode', undefined], ['Arabic', 'pins.generate_theme.lang', 'ar'], ['no colours', 'colours', undefined],
    ['no outputs', 'outputs', undefined]].forEach(([n, p, v]) => C.push([`theme ${n}`, 'theme', set(TH(), p, v)]));
  const IN = { path: 'Sales.SemanticModel', maxItems: 15, weekStart: 'sunday', country: 'ksa', asOf: '2026-11-05', only: ['dates', 'names'], forgetAnswers: true, columnTypes: { a: 1, b: 2 },
    firstYear: 2020, lastYear: 2030, name: 'Calendar', folder: 'Out', announced: true, weekend: 'fri-sat', lang: 'en', arabicNames: false, fiscalStart: 4, relateTo: ['Sales[Date]', 'Stock[Date]'],
    arabicColumnsOnly: false, brand: '#123456', mode: 'light', answers: [{ object: 'x' }], zz: 'unknown', nothing: null, missing: undefined };
  C.push(['scripts', 'scripts', { pins: { check_model_health: O(IN) }, answersShown: [{ object: 'Sales[Amount]', answer: 'mistake', question: 'is it?' }, { object: 'Stock', answer: 'intended' }, {}], outputs: ['m - fix formats.tmdl', 'm.tmdl'] }]);
  C.push(['scripts no answers shown', 'scripts', { pins: { check_model_health: O(IN, { columnTypes: { a: 1 }, forgetAnswers: false }) }, outputs: ['m - fix formats.tmdl'] }]);
  C.push(['scripts answers shown empty', 'scripts', { pins: { check_model_health: O(IN) }, answersShown: [] }]);
  C.push(['calendar', 'calendar', { pins: { add_gulf_calendar: O(IN, { country: 'uae', weekend: 'zz', announced: false }) }, outputs: ['m - Gulf calendar.tmdl'] }]);
  C.push(['calendar Arabic', 'calendar', { pins: { add_gulf_calendar: O(IN, { lang: 'ar', weekend: 'country', country: 'zz', weekStart: 'monday' }) } }]);
  C.push(['calendar columns only', 'calendar', { pins: { add_gulf_calendar: O(IN, { arabicColumnsOnly: true }) }, outputs: ['m - Arabic calendar.tmdl'] }]);
  C.push(['calendar columns only Arabic', 'calendar', { pins: { add_gulf_calendar: O(IN, { arabicColumnsOnly: true, lang: 'ar' }) } }]);
  C.push(['theme inputs Arabic', 'theme', { pins: { generate_theme: { brand: '#123456', mode: 'dark', lang: 'ar' } } }]);
  C.push(['another kind', 'zz', { pins: { other: { path: 'x', maxItems: 1 } }, outputs: ['a.json'] }], ['another kind empty', 'zz', {}], ['scripts no pins', 'scripts', { pins: {} }]);
  return C;
}

// ---------- M: the visuals (visual-meaning.mjs meaningOf) ----------
const col = (table, name, extra) => O({ kind: 'column', table, name }, extra);
const mea = (table, name, extra) => O({ kind: 'measure', table, name }, extra);
const agg = (table, name, a, extra) => O({ kind: 'aggregation', table, name, agg: a }, extra);
const DATE = col('Cal', 'Date'), MONTH = col('Cal', 'Month', { level: 'Month' }), YEAR = col('Cal', 'Year', { level: 'Year' });
const REGION = col('Geo', 'Region'), CITY = col('Geo', 'City'), SALES = mea('S', 'Sales'), COST = mea('S', 'Cost'), PCT = mea('S', 'Margin %'), TGT = mea('S', 'Target');
const typeOf = (f) => (f.name === 'Date' || f.name === 'Start' || f.name === 'End' ? 'dateTime' : f.name === 'Boom' ? (() => { throw new Error('x'); })() : 'string');
const formatOf = (f) => (f.name === 'Margin %' ? '0.0%' : f.name === 'Quoted' ? '"%" 0' : f.name === 'Sales' || f.name === 'Cost' || f.name === 'Target' ? '#,0' : f.name === 'Bad' ? (() => { throw new Error('x'); })() : undefined);
const V = (type, fields, extra) => O({ type, fields }, extra);
export function meaningCases() {
  const T = { typeOf, formatOf }, C = [];
  const add = (n, v, o) => C.push([n, v, o === undefined ? T : o]);
  // Power BI's own visuals and a group
  add('group', V('group', {}));
  add('native bar', V('clusteredBarChart', { Category: [REGION, CITY], Y: [SALES], Series: [col('P', 'Kind')] }));
  add('native matrix rows', V('pivotTable', { Rows: [REGION], Values: [SALES, null] }));
  add('native unknown', V('zzzNative', { Values: [SALES] }), O(T, { declared: new Set() }));
  add('native no fields', V('card', undefined));
  add('declared custom', V('card', { Values: [SALES] }), O(T, { declared: new Set(['card']) }));
  // custom visuals by their roles
  const cv = (fields, extra) => V('aCustomVisual0123456789', fields, extra);
  add('no live roles', cv({ Tooltips: [SALES] }));
  add('no fields', cv({}));
  add('schedule', cv({ startDate: [col('T', 'Start')], endDate: [col('T', 'End')], task: [col('T', 'Task')] }));
  add('start only', cv({ startDate: [col('T', 'Start')], values: [SALES] }));
  add('end only value', cv({ endDate: [agg('T', 'End', 'Max')], category: [REGION] }));
  add('network', cv({ source: [col('N', 'From')], target: [col('N', 'To')], weight: [SALES] }));
  add('network nodes', cv({ nodes: [col('N', 'Node')], values: [SALES] }));
  add('map lat lon', cv({ latitude: [col('G', 'Lat')], longitude: [col('G', 'Lon')], size: [SALES], legend: [col('G', 'Kind')] }));
  add('map location', cv({ location: [CITY], category: [REGION], values: [SALES] }));
  add('map name category', cv({ latitude: [col('G', 'Lat')], longitude: [col('G', 'Lon')], labels: [CITY] }));
  add('map category only', cv({ latitude: [col('G', 'Lat')], category: [REGION] }));
  add('map lat only', cv({ latitude: [col('G', 'Lat')], values: [SALES], series: [REGION] }));
  add('scatter', cv({ x: [SALES], y: [COST], size: [PCT], category: [REGION], series: [CITY] }));
  add('scatter value', cv({ x: [SALES], values: [COST], details: [REGION] }));
  add('scatter pair', cv({ sourceNodes: [SALES], targetNodes: [COST], category: [REGION] }));
  add('matrix', cv({ rows: [REGION, CITY], columns: [YEAR], values: [SALES] }));
  add('matrix by category', cv({ columns: [YEAR], category: [REGION], values: [SALES] }));
  add('mixed', cv({ data: [REGION, SALES] }));
  add('gauge', cv({ values: [SALES], target: [TGT], minimum: [COST], maximum: [PCT] }));
  add('gauge min only', cv({ indicator: [SALES], min: [COST] }));
  add('start value alone', cv({ from: [SALES] }));
  add('card', cv({ values: [SALES, COST] }));
  add('card one', cv({ measure7: [SALES] }));
  add('slicer', cv({ field: [REGION, CITY] }));
  add('slicer one', cv({ field: [REGION] }));
  add('table cols', cv({ field: [REGION], other: [CITY] }));
  add('kpi', cv({ indicator: [SALES], trend: [DATE], goal: [TGT] }));
  add('kpi two dates', cv({ indicator: [SALES], trend: [DATE, MONTH], goal: [TGT] }));
  add('chart combo', cv({ category: [REGION], bars: [SALES], lines: [PCT] }));
  add('chart percent', cv({ category: [REGION, CITY], values: [SALES, PCT] }));
  add('chart percent quoted', cv({ category: [REGION], values: [SALES, mea('S', 'Quoted')] }));
  add('chart unknown format', cv({ category: [REGION], values: [SALES, mea('S', 'Other')] }));
  add('chart format throws', cv({ category: [REGION], values: [SALES, mea('S', 'Bad')] }));
  add('chart time', cv({ axis: [DATE], values: [SALES] }));
  add('chart time levels', cv({ time: [YEAR, MONTH], values: [SALES] }));
  add('chart time level no type', cv({ time: [col('Cal', 'Quarter', { level: 'Quarter' })], values: [SALES] }));
  add('chart time level other language', cv({ time: [col('Cal', 'Monat', { level: 'Monat' })], values: [SALES] }));
  add('chart waterfall', cv({ category: [REGION], values: [SALES], breakdown: [CITY] }));
  add('chart series one', cv({ category: [REGION], values: [SALES], legend: [CITY] }));
  add('chart series many', cv({ category: [REGION], values: [SALES, COST], legend: [CITY] }));
  add('chart second category', cv({ category: [REGION], details: [], axis: [CITY], values: [SALES] }));
  add('chart kpi value', cv({ category: [REGION], values: [SALES], indicator: [COST] }));
  add('chart kpi value only', cv({ category: [REGION], indicator: [COST] }));
  add('chart goal no time', cv({ category: [REGION], values: [SALES], goal: [TGT] }));
  add('chart colour rule', cv({ category: [REGION], values: [SALES], colorRule: [COST] }));
  add('chart colour value', cv({ category: [REGION], values: [SALES], colors: [COST], series: [] }));
  add('chart time helper', cv({ category: [REGION], values: [SALES], time: [agg('Cal', 'Date', 'Min')] }));
  add('chart anon', cv({ measureRole7: [SALES], columnRole3: [REGION] }));
  add('chart anon display names', cv({ measureRole7: [SALES], columnRole3: [REGION] }), O(T, { customRoles: [{ name: 'measureRole7', displayName: 'Values' }, { name: 'columnRole3', displayName: 'Category' }, null, { name: '' }] }));
  add('chart typeOf throws', cv({ category: [col('X', 'Boom')], values: [SALES] }));
  add('chart combo series', cv({ category: [REGION], bars: [SALES], lines: [PCT], legend: [CITY] }));
  add('chart combo two bars series', cv({ category: [REGION], bars: [SALES, COST], lines: [PCT], legend: [CITY] }));
  add('chart combo series rows drill', cv({ category: [REGION, CITY], bars: [SALES], lines: [PCT] }));
  // the hints: the id's words and the format objects
  const hv = (id, fields, extra) => V(id, fields, extra);
  add('hint pie fits', hv('pieChartCustom0001', { category: [REGION], values: [SALES] }));
  add('hint pie unfit', hv('pieChartCustom0001', { category: [REGION], values: [SALES, COST] }));
  add('hint donut', hv('donutVisual99', { category: [REGION], values: [SALES] }));
  add('hint combo known no line', hv('comboBarChartX', { category: [REGION], values: [SALES, COST] }));
  add('hint combo known no line time', hv('comboChartX', { axis: [DATE], values: [SALES, COST] }));
  add('hint combo not known', hv('comboChartX', { category: [REGION], values: [SALES, mea('S', 'Other')], legend: [CITY] }));
  add('hint combo y2', hv('comboBarChartX', { category: [REGION], bars: [SALES], lines: [PCT] }));
  add('hint combo one value', hv('comboChartX', { category: [REGION], values: [SALES] }));
  add('hint time', hv('timelineVisualX', { axis: [DATE], values: [SALES] }));
  add('hint time combo', hv('timelineVisualX', { axis: [DATE], bars: [SALES], lines: [PCT] }));
  add('hint time no axis', hv('timelineVisualX', { category: [REGION], values: [SALES] }));
  add('hint waterfall', hv('waterfallX', { category: [REGION], values: [SALES] }));
  add('hint line', hv('lineChartPro', { category: [REGION], values: [SALES] }));
  add('hint bar on map', hv('barMapX', { location: [CITY], values: [SALES] }));
  add('hint map', hv('mapVisualX', { location: [CITY], values: [SALES] }));
  add('hint kpi gauge', hv('kpiVisualX', { values: [SALES], target: [TGT] }));
  add('hint kpi', hv('kpiVisualX', { indicator: [SALES], trend: [DATE], goal: [TGT] }));
  add('hint gauge', hv('gaugeX', { values: [SALES], target: [TGT] }));
  add('hint card', hv('cardX', { values: [SALES] }));
  add('hint table', hv('tableX', { data: [REGION, SALES] }));
  add('hint matrix', hv('matrixX', { rows: [REGION], values: [SALES] }));
  add('hint slicer', hv('slicerX', { field: [REGION] }));
  add('hint network', hv('networkX', { source: [col('N', 'A')], target: [col('N', 'B')] }));
  add('hint scatter', hv('scatterX', { x: [SALES], y: [COST], category: [REGION] }));
  add('hint area', hv('areaX', { category: [REGION], values: [SALES], lines: [PCT] }));
  add('hint column', hv('columnX', { category: [REGION], values: [SALES] }));
  add('object hint', hv('aCustomVisual0123456789', { category: [REGION], values: [SALES] }), O(T, { customObjects: ['donut', 'labels'] }));
  add('object hint on visual', hv('aCustomVisual0123456789', { category: [REGION], values: [SALES] }, { customObjects: ['pie'] }));
  add('object and id hint', hv('barChartX', { category: [REGION], values: [SALES] }, { customObjects: ['line'] }));
  add('hint combo bar drill', hv('comboBarChartX', { category: [REGION, CITY], bars: [SALES], lines: [PCT] }));
  add('drill matrix', hv('matrixX', { rows: [REGION, CITY, col('G', 'Street')], values: [SALES] }));
  add('no opts', cv({ category: [REGION], values: [SALES] }), null);
  add('null visual', null, T);
  return C;
}
