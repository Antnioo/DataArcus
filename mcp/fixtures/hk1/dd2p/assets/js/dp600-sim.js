/*
 * DataArcus - Microsoft exam practice simulator (DP-600 by default, PL-300 via window.EXAM)
 * Independent practice tool. Not affiliated with or endorsed by Microsoft.
 * Questions are original, written for DataArcus from the public DP-600 skills
 * outline and Microsoft Learn documentation. Progress stays in the browser.
 * This file keeps the exam's settings, the bank's index and the wiring (0.3.2 SP34): grading in exam-grade.js, the timed
 * mock in exam-session.js, the saved progress and study plan in exam-progress.js, every screen in exam-view.js (each loaded
 * before this file). It gives each module its storage (localStorage), clock (Date.now) and random source (Math.random).
 */
document.addEventListener('DOMContentLoaded', () => {
  // Exam settings. DP-600 is the default; another exam page sets window.EXAM before this script.
  const EX = Object.assign({
    data: 'DP600', code: 'DP-600', store: 'dataarcus-dp600-v1', ev: 'dp600',
    outline: '/assets/data/dp600-outline.json',
    page: 'https://dataarcus.com/tools/dp-600-practice-exam.html',
    // each area's `study`: its section of Microsoft's study guide (read 25 Oct 2026: the anchor is the id of the area's
    // heading, whose text is the area's name and weight; the page title is "Study guide for Exam DP-600: ...")
    dom: ((G) => ({
      prep: { en: 'Prepare data', ar: 'تجهيز البيانات', w: '45–50%', wt: 47.5, study: G + '#prepare-data-4550' },
      model: { en: 'Implement and manage semantic models', ar: 'بناء وإدارة النماذج الدلالية', w: '25–30%', wt: 27.5, study: G + '#implement-and-manage-semantic-models-2530' },
      maintain: { en: 'Maintain a data analytics solution', ar: 'صيانة حل التحليلات', w: '25–30%', wt: 27.5, study: G + '#maintain-a-data-analytics-solution-2530' }
    }))('https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600'),
    skill: {
      get: { d: 'prep', en: 'Get data', ar: 'الحصول على البيانات' },
      transform: { d: 'prep', en: 'Transform data', ar: 'تحويل البيانات' },
      query: { d: 'prep', en: 'Query and analyze data', ar: 'الاستعلام والتحليل' },
      design: { d: 'model', en: 'Design and build semantic models', ar: 'تصميم النماذج الدلالية' },
      optimize: { d: 'model', en: 'Optimize enterprise-scale models', ar: 'تحسين النماذج الكبيرة' },
      security: { d: 'maintain', en: 'Security and governance', ar: 'الأمان والحوكمة' },
      lifecycle: { d: 'maintain', en: 'Development lifecycle', ar: 'دورة حياة التطوير' }
    },
    outlineNames: { prep: 'prepare data', model: 'implement and manage semantic models', maintain: 'maintain a data analytics solution' },
    mix: { prep: 0.48, model: 0.26 },
    mixText: ['Questions are drawn by exam weight: about half on preparing data, a quarter each on semantic models and maintenance.', 'الأسئلة موزعة حسب أوزان الاختبار: نحو النصف لتجهيز البيانات، والربع لكل من النماذج الدلالية والصيانة.'],
    // The renewal assessment (Microsoft Learn, "Renewal for Microsoft Certified: Fabric Analytics Engineer Associate", read
    // 22 Oct 2026): its 8 skills as listed there, each with the Learn module of the same name (each address checked: its
    // page title is the skill), and the bank's tags that belong to it. About 45 minutes per Microsoft; 25 is our choice.
    renewal: ((M) => ({
      updated: '2026-07-21', checked: '2026-10-22', n: 25, min: 45,
      url: 'https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/renew/',
      faq: 'https://learn.microsoft.com/en-us/credentials/certifications/renew-your-microsoft-certification-faq',
      topics: [
        { k: 'sec', en: 'Secure data access in Microsoft Fabric', ar: 'تأمين الوصول إلى البيانات في Microsoft Fabric', learn: M + 'secure-data-access-in-fabric/',
          tags: ['Item permissions', 'Workspace roles', 'OneLake security', 'Warehouse RLS', 'Object-level security', 'Column-level security', 'Dynamic data masking', 'Semantic model RLS', 'Direct Lake security'] },
        { k: 'life', en: 'Manage the semantic model development lifecycle', ar: 'إدارة دورة تطوير النموذج الدلالي', learn: M + 'manage-semantic-model-lifecycle/',
          tags: ['Deployment pipelines', 'Git integration', 'Git branches', 'Power BI project (.pbip)', 'Deployment rules', 'XMLA endpoint', 'TMDL', 'PBIR', 'Power BI template (.pbit)', 'Power BI data source (.pbids)', 'Reusable assets', 'Impact analysis', 'Lineage view'] },
        { k: 'lake', en: 'Get started with lakehouses in Microsoft Fabric', ar: 'البدء مع الـ lakehouses في Microsoft Fabric', learn: M + 'get-started-lakehouses/',
          tags: ['Data stores', 'Shortcuts', 'SQL analytics endpoint', 'SQL analytics endpoint views', 'SQL analytics endpoint limits', 'SQL analytics endpoint objects', 'Notebooks', 'Ingest options'] },
        { k: 'onelake', en: 'Discover and connect to data in OneLake', ar: 'اكتشاف البيانات والاتصال بها في OneLake', learn: M + 'discover-data-onelake/',
          tags: ['OneLake catalog', 'Discovery', 'Connections', 'Real-Time hub', 'Endorsement', 'Mirroring', 'Semantic model OneLake integration', 'Shared semantic models'] },
        { k: 'dim', en: 'Design dimensional models for analytics in Microsoft Fabric', ar: 'تصميم النماذج البُعدية للتحليلات في Microsoft Fabric', learn: M + 'design-dimensional-models-fabric/',
          tags: ['Star schema', 'Surrogate keys', 'IDENTITY behavior', 'SCD type 2', 'SCD type 3', 'SCD type 2 load', 'Table constraints', 'Denormalize snowflake', 'Denormalization', 'Role-playing dimensions'] },
        { k: 'rti', en: 'Get started with Real-Time Intelligence in Microsoft Fabric', ar: 'البدء مع Real-Time Intelligence في Microsoft Fabric', learn: M + 'get-started-kusto-fabric/',
          tags: ['Eventstreams', 'Eventhouse OneLake availability', 'KQL summarize bin', 'KQL top', 'KQL render', 'KQL project extend', 'KQL join', 'KQL where', 'KQL query pipeline', 'KQL project'] },
        { k: 'scale', en: 'Design semantic models for scale in Microsoft Fabric', ar: 'تصميم نماذج دلالية قابلة للتوسع في Microsoft Fabric', learn: M + 'design-semantic-models-scale/',
          tags: ['Storage modes', 'Dual storage mode', 'Composite models', 'Relationships', 'Many-to-many relationships', 'Cross-filter direction', 'USERELATIONSHIP', 'Bridge tables', 'Large semantic model storage format', 'Calculation groups', 'Calculation group precedence', 'Dynamic format strings', 'Field parameters', 'DAX variables', 'Iterators', 'Window functions', 'Information functions', 'Information and window functions', 'Incremental refresh', 'Hybrid tables', 'Detect data changes', 'Direct Lake on OneLake', 'Direct Lake on SQL'] },
        { k: 'perf', en: 'Optimize semantic model performance', ar: 'تحسين أداء النموذج الدلالي', learn: M + 'optimize-semantic-model-performance/',
          tags: ['Performance analyzer', 'DAX query view', 'DAX query tools', 'Storage engine', 'Cardinality', 'Model size', 'Aggregations', 'Query reduction', 'Report visuals', 'Filter arguments', 'DIVIDE', 'Context transition', 'KEEPFILTERS', 'REMOVEFILTERS', 'RANKX', 'DirectLakeBehavior', 'Framing', 'Fallback diagnostics', 'V-Order', 'Guardrails', 'Automatic updates'] }
      ]
    }))('https://learn.microsoft.com/en-us/training/modules/'),
    official: [
      ['https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600', 'DP-600 study guide: the skills measured', 'دليل مذاكرة DP-600: المهارات المقاسة'],
      ['https://learn.microsoft.com/en-us/credentials/certifications/exams/dp-600/practice/assessment?assessment-type=practice&assessmentId=90', 'Microsoft\'s free practice assessment', 'التقييم التدريبي المجاني من Microsoft'],
      ['https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/', 'Fabric Analytics Engineer Associate certification page', 'صفحة شهادة Fabric Analytics Engineer Associate'],
      ['https://aka.ms/examdemo', 'Exam sandbox: try the real exam interface', 'بيئة تجربة واجهة الاختبار الحقيقية']
    ]
  }, window.EXAM || {});
  // the renewal data above is DP-600's: another exam has its own or none
  if (window.EXAM && !Object.prototype.hasOwnProperty.call(window.EXAM, 'renewal')) EX.renewal = null;
  const DATA = window[EX.data];
  const root = document.getElementById('dpApp');
  if (!DATA || !root) return;

  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params || {}); };
  const SES = window.DAExamSession;

  // ---------- data ----------
  const QS = DATA.q.slice();
  const CASES = DATA.cases;
  const byId = {};
  QS.forEach((q) => { byId[q.id] = q; });
  CASES.forEach((c) => c.questions.forEach((q) => { q.caseId = c.id; byId[q.id] = q; }));
  const ALL = Object.values(byId);

  const DOM = EX.dom;
  const SKILL = EX.skill;
  // The renewal assessment, for an exam that gives one (EX.renewal: Microsoft's renewal skills, each with the bank's tags)
  const REN = EX.renewal || null;
  const renTopic = {};
  if (REN) REN.topics.forEach((t) => t.tags.forEach((g) => { renTopic[g] = t.k; }));

  // ---------- saved progress and the study plan (exam-progress.js; the storage and the clock passed in) ----------
  const PROG = window.DAExamProgress;
  const LEARN = PROG.learnPages(ALL, SKILL);
  const PR = PROG.create({ storage: { read: () => localStorage.getItem(EX.store), write: (t) => localStorage.setItem(EX.store, t) }, now: () => Date.now(), questions: ALL, domains: DOM, skills: SKILL });
  // the mock in progress: exam-session.js's state machine, saved in the progress through its adapter
  const MK = SES.create({ storage: PR.mockStorage, now: () => Date.now() });

  // ---------- the page (exam-view.js: every screen, the routing, the keys) ----------
  const view = window.DAExamView.mount({ root, EX, QS, CASES, byId, ALL, DOM, SKILL, REN, renTopic, LEARN, PR, MK, SES, G: window.DAExamGrade, track });

  // the weekly outline check (assets/data/dp600-outline.json, refreshed by a GitHub Action): the areas' weights as
  // Microsoft gives them now, then the note under the exam
  if (EX.outline) fetch(EX.outline, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return;
      const names = EX.outlineNames;
      (d.domains || []).forEach((x) => { const k = Object.keys(names).find((n) => names[n] === String(x.name).toLowerCase()); if (k && x.w) DOM[k].w = x.w; });
      view.outline(d);
    })
    .catch(() => { /* opened as a file or offline: keep the built-in weights */ });

  view.start(new URLSearchParams(location.search).get('mode'));
});
