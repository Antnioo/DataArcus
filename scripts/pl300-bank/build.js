// Run: node scripts/pl300-bank/build.js  (validates every question, then rewrites assets/data/pl300-questions.js)
//      node scripts/pl300-bank/build.js --check  (CI: fails when the committed file is not what the source builds)
// Assembles and validates the PL-300 bank, then writes assets/data/pl300-questions.js
const fs = require('fs');
const L = 'https://learn.microsoft.com/en-us/';
const R = {
  gw: ['What is an on-premises data gateway?', 'power-bi/connect-data/service-gateway-onprem'],
  gwp: ['Use a personal gateway in Power BI', 'power-bi/connect-data/service-gateway-personal-mode'],
  privacy: ['Power BI Desktop privacy levels', 'power-bi/enterprise/desktop-privacy-levels'],
  pqprivacy: ['Privacy levels (Power Query)', 'power-query/privacy-levels'],
  modes: ['Semantic model modes in the Power BI service', 'power-bi/connect-data/service-dataset-modes-understand'],
  storage: ['Table storage mode in Power BI semantic models', 'power-bi/transform-model/desktop-storage-mode'],
  dl: ['Direct Lake overview', 'fabric/fundamentals/direct-lake-overview'],
  dq: ['Use DirectQuery in Power BI Desktop', 'power-bi/connect-data/desktop-directquery-about'],
  composite: ['Use composite models in Power BI Desktop', 'power-bi/transform-model/desktop-composite-models'],
  params: ['Parameters (Power Query)', 'power-query/power-query-query-parameters'],
  profile: ['Using the data profiling tools', 'power-query/data-profiling-tools'],
  errors: ['Dealing with errors in Power Query', 'power-query/dealing-with-errors'],
  types: ['Data types in Power Query', 'power-query/data-types'],
  groupby: ['Grouping or summarizing rows', 'power-query/group-by'],
  unpivot: ['Unpivot columns', 'power-query/unpivot-column'],
  pivot: ['Pivot columns', 'power-query/pivot-columns'],
  merge: ['Merge queries overview', 'power-query/merge-queries-overview'],
  append: ['Append queries', 'power-query/append-queries'],
  folding: ['Query folding guidance in Power BI Desktop', 'power-bi/guidance/power-query-folding'],
  pqbest: ['Best practices when working with Power Query', 'power-query/best-practices'],
  refq: ['Clean, transform, and load data in Power BI (training)', 'training/modules/clean-data-power-bi/'],
  columnfromex: ['Add a column from examples', 'power-query/column-from-example'],
  json: ['JSON (Power Query connector)', 'power-query/connectors/json'],
  star: ['Understand star schema and the importance for Power BI', 'power-bi/guidance/star-schema'],
  rel: ['Model relationships in Power BI Desktop', 'power-bi/transform-model/desktop-relationships-understand'],
  bidi: ['Bi-directional relationship guidance', 'power-bi/guidance/relationships-bidirectional-filtering'],
  m2m: ['Apply many-to-many relationships in Power BI Desktop', 'power-bi/transform-model/desktop-many-to-many-relationships'],
  datetbl: ['Date table guidance for Power BI Desktop', 'power-bi/guidance/model-date-tables'],
  markdate: ['Set and use date tables in Power BI Desktop', 'power-bi/transform-model/desktop-date-tables'],
  autodt: ['Auto date/time guidance in Power BI Desktop', 'power-bi/guidance/auto-date-time'],
  sortby: ['Sort one column by another column in Power BI', 'power-bi/create-reports/desktop-sort-by-column'],
  hier: ['Work with Model explorer', 'power-bi/transform-model/model-explorer'],
  calcopts: ['Use calculation options in Power BI Desktop', 'power-bi/transform-model/desktop-calculations-options'],
  calcgrp: ['Create calculation groups', 'power-bi/transform-model/calculation-groups'],
  selmeasure: ['SELECTEDMEASURE function (DAX)', 'dax/selectedmeasure-function-dax'],
  visualcalc: ['Visual calculations', 'power-bi/transform-model/desktop-visual-calculations-overview'],
  quickm: ['Use quick measures for common calculations', 'power-bi/transform-model/desktop-quick-measures'],
  calculate: ['CALCULATE function (DAX)', 'dax/calculate-function-dax'],
  ti: ['Time intelligence functions (DAX)', 'dax/time-intelligence-functions-dax'],
  userel: ['USERELATIONSHIP function (DAX)', 'dax/userelationship-function-dax'],
  divide: ['DIVIDE function (DAX)', 'dax/divide-function-dax'],
  closing: ['CLOSINGBALANCEMONTH function (DAX)', 'dax/closingbalancemonth-function-dax'],
  lastnb: ['LASTNONBLANK function (DAX)', 'dax/lastnonblank-function-dax'],
  stat: ['Statistical functions (DAX)', 'dax/statistical-functions-dax'],
  perfan: ['Use Performance Analyzer to examine report element performance', 'power-bi/create-reports/desktop-performance-analyzer'],
  daxqv: ['Work with DAX query view', 'power-bi/transform-model/dax-query-view'],
  datared: ['Data reduction techniques for Import modeling', 'power-bi/guidance/import-modeling-data-reduction'],
  incr: ['Incremental refresh and real-time data for semantic models', 'power-bi/connect-data/incremental-refresh-overview'],
  visuals: ['Visualization types in Power BI', 'power-bi/visuals/power-bi-visualization-types-for-reports-and-q-and-a'],
  themes: ['Use report themes in Power BI Desktop', 'power-bi/create-reports/desktop-report-themes'],
  condfmt: ['Apply conditional table formatting in Power BI', 'power-bi/create-reports/desktop-conditional-table-formatting'],
  copilotnarr: ['Create a narrative visual with Copilot for Power BI', 'power-bi/create-reports/copilot-create-narrative'],
  copilotrep: ['Create and edit Power BI reports with Copilot', 'power-bi/create-reports/copilot-create-reports'],
  copilotov: ['Use Copilot with Power BI reports and semantic models', 'power-bi/create-reports/copilot-reports-overview'],
  copilotreq: ['Copilot for Power BI overview', 'power-bi/create-reports/copilot-introduction'],
  paginated: ['What are paginated reports in Power BI?', 'power-bi/paginated-reports/paginated-reports-report-builder-power-bi'],
  reportsettings: ['Change settings for Power BI reports', 'power-bi/create-reports/power-bi-report-settings'],
  export: ['Export data from a Power BI visualization', 'power-bi/visuals/power-bi-visualization-export-data'],
  personalize: ['Let users personalize visuals in a report', 'power-bi/create-reports/power-bi-personalize-visuals'],
  apr: ['Automatic page refresh in Power BI', 'power-bi/create-reports/desktop-automatic-page-refresh'],
  mobile: ['Create mobile-optimized Power BI reports', 'power-bi/create-reports/power-bi-create-mobile-optimized-report-about'],
  bookmarks: ['Create report bookmarks in Power BI', 'power-bi/create-reports/desktop-bookmarks'],
  tooltips: ['Create tooltips based on report pages', 'power-bi/create-reports/desktop-tooltips'],
  interactions: ['Change how visuals interact in a Power BI report', 'power-bi/create-reports/service-reports-visual-interactions'],
  drill: ['Set up drillthrough in Power BI reports', 'power-bi/create-reports/desktop-drillthrough'],
  buttons: ['Create buttons in Power BI reports', 'power-bi/create-reports/desktop-buttons'],
  slicers: ['Slicers in Power BI', 'power-bi/visuals/power-bi-visualization-slicers'],
  access: ['Design Power BI reports for accessibility', 'power-bi/create-reports/desktop-accessibility-overview'],
  fieldparams: ['Let report readers use field parameters to change visuals', 'power-bi/create-reports/power-bi-field-parameters'],
  insights: ['Apply insights to explain fluctuations in visuals', 'power-bi/create-reports/desktop-insights'],
  grouping: ['Use grouping and binning in Power BI Desktop', 'power-bi/create-reports/desktop-grouping-and-binning'],
  keyinf: ['Create key influencers visualizations', 'power-bi/visuals/power-bi-visualization-influencers'],
  decomp: ['Create and view decomposition tree visuals', 'power-bi/visuals/power-bi-visualization-decomposition-tree'],
  anomaly: ['Anomaly detection', 'power-bi/visuals/power-bi-visualization-anomaly-detection'],
  analytics: ['Use the Analytics pane in Power BI Desktop', 'power-bi/transform-model/desktop-analytics-pane'],
  roles: ['Roles in workspaces in Power BI', 'power-bi/collaborate-share/service-roles-new-workspaces'],
  createws: ['Create a workspace in Power BI', 'power-bi/collaborate-share/service-create-the-new-workspaces'],
  apps: ['Publish an app in Power BI', 'power-bi/collaborate-share/service-create-distribute-apps'],
  share: ['Share Power BI reports and dashboards', 'power-bi/collaborate-share/service-share-dashboards'],
  publish: ['Publish semantic models and reports from Power BI Desktop', 'power-bi/create-reports/desktop-upload-desktop-files'],
  livecon: ['Connect to semantic models in the Power BI service from Power BI Desktop', 'power-bi/connect-data/desktop-report-lifecycle-datasets'],
  sharedds: ['Intro to semantic models across workspaces', 'power-bi/connect-data/service-datasets-across-workspaces'],
  dash: ['Create a Power BI dashboard from a report', 'power-bi/create-reports/service-dashboard-create'],
  alerts: ['Set data alerts in the Power BI service', 'power-bi/create-reports/service-set-data-alerts'],
  subs: ['Email subscriptions for reports and dashboards', 'power-bi/collaborate-share/end-user-subscribe'],
  endorse: ['Promote and certify Power BI content with endorsement', 'power-bi/collaborate-share/service-endorsement-overview'],
  sched: ['Configure scheduled refresh', 'power-bi/connect-data/refresh-scheduled-refresh'],
  refresh: ['Data refresh in Power BI', 'power-bi/connect-data/refresh-data'],
  rls: ['Row-level security (RLS) with Power BI', 'fabric/security/service-admin-row-level-security'],
  rlsg: ['Row-level security (RLS) guidance in Power BI Desktop', 'power-bi/guidance/rls-guidance'],
  ols: ['Object-level security', 'analysis-services/tabular-models/object-level-security'],
  labels: ['Sensitivity labels in Power BI', 'fabric/enterprise/powerbi/service-security-sensitivity-label-overview'],
  build: ['Build permission for shared semantic models', 'power-bi/connect-data/service-datasets-build-permissions']
};
const SK = { get: 'prep', clean: 'prep', transform: 'prep', design: 'model', dax: 'model', perf: 'model', reports: 'viz', usability: 'viz', patterns: 'viz', workspace: 'manage', security: 'manage' };
const CODE = { get: 'GET', clean: 'CLN', transform: 'TRF', design: 'DES', dax: 'DAX', perf: 'PRF', reports: 'REP', usability: 'USE', patterns: 'PAT', workspace: 'WSP', security: 'SEC' };
const errs = [], warn = [];
const all = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].flatMap((k) => require('./q-' + k + '.js'));
const cases = require('./cases.js');
const seenQ = new Set(), used = new Set();
function check(q, where) {
  const t = where + ' [' + q.q.slice(0, 50) + ']';
  if (!SK[q.s]) errs.push(t + ' bad skill ' + q.s);
  if (!['single', 'multi', 'yesno', 'order'].includes(q.type)) errs.push(t + ' bad type');
  if (q.why.length !== q.opts.length) errs.push(t + ' why/opts length ' + q.why.length + '/' + q.opts.length);
  if (q.type === 'single' && !(Number.isInteger(q.ans) && q.ans >= 0 && q.ans < q.opts.length)) errs.push(t + ' bad single ans');
  if (q.type === 'single' && q.why[q.ans] !== '') warn.push(t + ' correct why not empty');
  if (q.type === 'multi' && (!Array.isArray(q.ans) || q.ans.length < 2 || new Set(q.ans).size !== q.ans.length || q.ans.some((i) => i >= q.opts.length) || q.n !== q.ans.length)) errs.push(t + ' bad multi');
  if (q.type === 'multi' && !new RegExp('Select ' + ['', '', 'TWO', 'THREE'][q.ans.length]).test(q.q)) errs.push(t + ' multi prompt count');
  if (q.type === 'yesno' && (q.ans.length !== q.opts.length || q.ans.some((v) => typeof v !== 'boolean'))) errs.push(t + ' bad yesno');
  if (q.type === 'order' && (!Array.isArray(q.ans) || q.ans.some((i) => i >= q.opts.length) || new Set(q.ans).size !== q.ans.length)) errs.push(t + ' bad order');
  if (!q.exp || !q.ar || !/[؀-ۿ]/.test(q.ar)) errs.push(t + ' missing exp/ar');
  if (!q.refs || !q.refs.length) errs.push(t + ' no refs');
  (q.refs || []).forEach((r) => { if (!R[r]) errs.push(t + ' unknown ref ' + r); used.add(r); });
  if (seenQ.has(q.q)) errs.push(t + ' duplicate'); seenQ.add(q.q);
  const txt = [q.q, q.exp, q.ar, ...q.opts.map(String), ...q.why].join(' ');
  if (/—/.test(txt)) errs.push(t + ' em dash');
  if (/ - [a-z]/.test(txt.replace(/<pre>[\s\S]*?<\/pre>/g, ''))) warn.push(t + ' spaced hyphen');
}
const out = { v: '2026-04-20', q: [], cases: [] };
const counters = {};
all.forEach((q, i) => {
  check(q, 'q' + i);
  counters[q.s] = (counters[q.s] || 0) + 1;
  out.q.push({ id: 'PL-' + CODE[q.s] + '-' + String(counters[q.s]).padStart(3, '0'), d: SK[q.s], s: q.s, type: q.type, ...(q.n ? { n: q.n } : {}), diff: q.diff, tag: q.tag, q: q.q, opts: q.opts, ans: q.ans, exp: q.exp, why: q.why, ar: q.ar, ref: q.refs.map((k) => ({ t: R[k][0], u: L + R[k][1] })) });
});
cases.forEach((c, ci) => {
  const qs = c.questions.map((q, i) => { check(q, c.id + '-' + i); return { id: c.id + '-' + String(i + 1).padStart(2, '0'), d: SK[q.s], s: q.s, type: q.type, ...(q.n ? { n: q.n } : {}), diff: q.diff, tag: q.tag, q: q.q, opts: q.opts, ans: q.ans, exp: q.exp, why: q.why, ar: q.ar, ref: q.refs.map((k) => ({ t: R[k][0], u: L + R[k][1] })) }; });
  out.cases.push({ id: c.id, title: c.title, scenario: c.scenario.replace(/\n/g, ''), questions: qs });
});
Object.keys(R).forEach((k) => { if (!used.has(k)) warn.push('unused ref ' + k); });
const byD = {}, byT = {};
out.q.forEach((q) => { byD[q.d] = (byD[q.d] || 0) + 1; byT[q.type] = (byT[q.type] || 0) + 1; });
console.log('questions', out.q.length, 'cases', out.cases.length, 'case qs', out.cases.reduce((a, c) => a + c.questions.length, 0));
console.log('by skill', JSON.stringify(counters)); console.log('by domain', JSON.stringify(byD)); console.log('by type', JSON.stringify(byT));
console.log('ERRORS', errs.length); errs.forEach((e) => console.log('  ' + e));
console.log('warnings', warn.length); warn.forEach((e) => console.log('  ' + e));
if (errs.length) process.exit(1);
// The renewal assessment (Microsoft Learn, "Renewal for Microsoft Certified: Power BI Data Analyst Associate", read
// 22 Oct 2026): its 9 skills as listed there, each with the Learn module of the same name, and the bank's tags that
// belong to it. Microsoft says about 45 minutes and doesn't publish the number of questions: 25 is our choice.
const M = 'https://learn.microsoft.com/en-us/training/modules/';
const RENEWAL = {
  updated: '2025-10-30', checked: '2026-10-22', n: 25, min: 45,
  url: 'https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/renew/',
  faq: 'https://learn.microsoft.com/en-us/credentials/certifications/renew-your-microsoft-certification-faq',
  topics: [
    { k: 'clean', en: 'Clean, transform, and load data in Power BI', ar: 'تنظيف البيانات وتحويلها وتحميلها في Power BI', learn: M + 'clean-data-power-bi/',
      tags: ['Profiling', 'Data quality', 'Errors', 'Unpivot', 'Pivot', 'Transpose', 'Semi-structured', 'Merge', 'Append', 'Merge and append', 'Group by', 'Data types', 'Columns', 'Reference vs duplicate', 'Query folding', 'Nulls', 'Clean text', 'Import errors', 'Unexpected values', 'Loading', 'Keys'] },
    { k: 'model', en: 'Configure a semantic model', ar: 'إعداد النموذج الدلالي', learn: M + 'configure-semantic-model-power-bi/',
      tags: ['Properties', 'Relationships', 'Cross-filter direction', 'Hierarchies', 'Quick measures', 'Field parameters', 'Many-to-many', 'Role-playing dimension', 'Date table', 'Star schema', 'Dimensions', 'Calculated tables', 'Calculated columns'] },
    { k: 'time', en: 'Use DAX time intelligence functions in semantic models', ar: 'دوال الذكاء الزمني في DAX', learn: M + 'dax-power-bi-time-intelligence/',
      tags: ['Time intelligence', 'Semi-additive'] },
    { k: 'filter', en: 'Modify DAX filter context in semantic models', ar: 'تعديل سياق الفلترة في DAX', learn: M + 'dax-power-bi-modify-filter/',
      tags: ['CALCULATE', 'Filter functions', 'Iterators', 'Calculated column vs measure', 'Measures', 'Calculation groups'] },
    { k: 'perf', en: 'Optimize a model for performance in Power BI', ar: 'تحسين أداء النموذج في Power BI', learn: M + 'optimize-model-power-bi/',
      tags: ['Reduce data', 'Performance Analyzer', 'Storage mode', 'Aggregation', 'DAX query view', 'Variables', 'Composite model'] },
    { k: 'viscalc', en: 'Create visual calculations in Power BI Desktop', ar: 'إنشاء visual calculations في Power BI Desktop', learn: M + 'power-bi-visual-calculations/',
      tags: ['Visual calculations'] },
    { k: 'ux', en: 'Enhance Power BI report designs for the user experience', ar: 'تحسين تصميم التقارير لتجربة المستخدم', learn: M + 'power-bi-effective-user-experience/',
      tags: ['Bookmarks', 'Drillthrough', 'Mobile', 'Tooltips', 'Selection pane', 'Interactions', 'Navigation', 'Sync slicers', 'Accessibility', 'Conditional formatting', 'Sorting', 'Personalization'] },
    { k: 'ws', en: 'Manage workspaces in Power BI service', ar: 'إدارة مساحات العمل في خدمة Power BI', learn: M + 'manage-workspaces-power-bi-service/',
      tags: ['Workspaces', 'Workspace roles', 'Apps', 'Publishing', 'Distribution', 'Subscriptions', 'Alerts', 'Dashboards'] },
    { k: 'sec', en: 'Secure data access in Power BI', ar: 'تأمين الوصول إلى البيانات في Power BI', learn: M + 'row-level-security-power-bi/',
      tags: ['RLS', 'Object-level security', 'Semantic model access', 'Item access'] }
  ]
};
{
  // every renewal tag is a tag of the bank, no tag is in two topics, and every topic can fill its share of a check
  const bankTags = new Set(out.q.map((q) => q.tag)), seenT = new Set();
  RENEWAL.topics.forEach((t) => {
    t.tags.forEach((g) => { if (!bankTags.has(g)) errs.push('renewal ' + t.k + ': no question has the tag ' + g); if (seenT.has(g)) errs.push('renewal: tag in two topics ' + g); seenT.add(g); });
    const n = out.q.filter((q) => t.tags.includes(q.tag)).length;
    if (n < 6) errs.push('renewal ' + t.k + ': only ' + n + ' questions (6 or more, so two checks in a row differ)');
    console.log('renewal', t.k, n);
  });
  if (errs.length) { errs.forEach((e) => console.log('  ' + e)); process.exit(1); }
}
const EXAM = {
  renewal: RENEWAL,
  data: 'PL300', code: 'PL-300', store: 'dataarcus-pl300-v1', ev: 'pl300', outline: '/assets/data/pl300-outline.json',
  page: 'https://dataarcus.com/tools/pl-300-practice-exam.html',
  // each area's `study`: its section of Microsoft's study guide (read 25 Oct 2026: the anchor is the id of the area's
  // heading, whose text is the area's name and weight; the page title is "Study guide for Exam PL-300: ...")
  dom: ((G) => ({
    prep: { en: 'Prepare the data', ar: 'تجهيز البيانات', w: '25–30%', wt: 27.5, study: G + '#prepare-the-data-2530' },
    model: { en: 'Model the data', ar: 'نمذجة البيانات', w: '25–30%', wt: 27.5, study: G + '#model-the-data-2530' },
    viz: { en: 'Visualize and analyze the data', ar: 'التصور والتحليل', w: '25–30%', wt: 27.5, study: G + '#visualize-and-analyze-the-data-2530' },
    manage: { en: 'Manage and secure Power BI', ar: 'إدارة Power BI وتأمينه', w: '15–20%', wt: 17.5, study: G + '#manage-and-secure-power-bi-1520' }
  }))('https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300'),
  skill: {
    get: { d: 'prep', en: 'Get or connect to data', ar: 'الحصول على البيانات والاتصال بها' },
    clean: { d: 'prep', en: 'Profile and clean the data', ar: 'فحص البيانات وتنظيفها' },
    transform: { d: 'prep', en: 'Transform and load the data', ar: 'تحويل البيانات وتحميلها' },
    design: { d: 'model', en: 'Design and implement a data model', ar: 'تصميم نموذج البيانات' },
    dax: { d: 'model', en: 'Create model calculations with DAX', ar: 'حسابات النموذج بـ DAX' },
    perf: { d: 'model', en: 'Optimize model performance', ar: 'تحسين أداء النموذج' },
    reports: { d: 'viz', en: 'Create reports', ar: 'إنشاء التقارير' },
    usability: { d: 'viz', en: 'Usability and storytelling', ar: 'سهولة الاستخدام وسرد القصة' },
    patterns: { d: 'viz', en: 'Identify patterns and trends', ar: 'اكتشاف الأنماط والاتجاهات' },
    workspace: { d: 'manage', en: 'Workspaces and assets', ar: 'مساحات العمل والمحتوى' },
    security: { d: 'manage', en: 'Secure and govern Power BI items', ar: 'تأمين وحوكمة عناصر Power BI' }
  },
  outlineNames: { prep: 'prepare the data', model: 'model the data', viz: 'visualize and analyze the data', manage: 'manage and secure power bi' }, mix: null,
  mixText: ['Questions are drawn by exam weight: about a quarter each on preparing, modeling and visualizing data, and the rest on managing and securing Power BI.', 'الأسئلة موزعة حسب أوزان الاختبار: نحو الربع لكل من تجهيز البيانات ونمذجتها والتصور والتحليل، والباقي لإدارة Power BI وتأمينه.'],
  official: [
    ['https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300', 'PL-300 study guide: the skills measured', 'دليل مذاكرة PL-300: المهارات المقاسة'],
    ['https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/practice/assessment?assessment-type=practice&assessmentId=48', "Microsoft's free practice assessment", 'التقييم التدريبي المجاني من Microsoft'],
    ['https://learn.microsoft.com/en-us/credentials/certifications/power-bi-data-analyst-associate/', 'Power BI Data Analyst Associate certification page', 'صفحة شهادة Power BI Data Analyst Associate'],
    ['https://learn.microsoft.com/en-us/credentials/certifications/renew-your-microsoft-certification', 'Renew your certification (free online assessment)', 'تجديد الشهادة (تقييم مجاني عبر الإنترنت)'],
    ['https://aka.ms/examdemo', 'Exam sandbox: try the real exam interface', 'بيئة تجربة واجهة الاختبار الحقيقية']
  ]
};
const js = '/* DataArcus PL-300 practice questions. Original questions written from the public PL-300 skills outline (20 Apr 2026) and Microsoft Learn. Not affiliated with Microsoft. */\n'
  + 'window.EXAM=' + JSON.stringify(EXAM) + ';\nwindow.PL300=' + JSON.stringify(out) + ';\n';
const OUT = require('path').join(__dirname, '../../assets/data/pl300-questions.js');
// --check (CI): the committed file must be exactly what the source builds. 22 Oct 2026: 22 audit fixes had been made in
// the built file only, and the next build would have quietly undone them.
if (process.argv.includes('--check')) {
  const same = fs.existsSync(OUT) && fs.readFileSync(OUT, 'utf8') === js;
  console.log(same ? 'PASS  pl300-bank  assets/data/pl300-questions.js is what the source builds' : 'FAIL  pl300-bank  assets/data/pl300-questions.js differs from the source: edit scripts/pl300-bank/, then run node scripts/pl300-bank/build.js');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, js);
console.log('written', js.length, 'bytes');
