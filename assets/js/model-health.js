/*
 * DataArcus Power BI Model Health Check: page UI.
 * The file is read in the browser and analysed in a Web Worker. Nothing is uploaded.
 * (c) DataArcus. All rights reserved.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const root = $('mhApp');
  if (!root) return;
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params || {}); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => new Intl.NumberFormat(isAr() ? 'ar-u-nu-latn' : 'en-US').format(n);
  const bdi = (x) => '<bdi dir="ltr">' + esc(x) + '</bdi>';
  const RULES = () => (window.MHEngine && window.MHEngine.RULES) || {};

  let R = null;          // analysis result
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const ignored = new Set(store.get('dataarcus-mh-ignored', []));
  const saveIgnored = () => store.set('dataarcus-mh-ignored', Array.from(ignored));
  const score = () => (window.MHEngine && window.MHEngine.scoreFrom ? window.MHEngine.scoreFrom(R.findings, ignored) : R.score);
  let prev = null; // previous check of the same file
  let tab = 'issues';
  let filt = { cat: 'all' };
  let msQuery = '', msFilter = 'all', msOpen = null;

  const CAT = {
    perf: { en: 'Performance', ar: 'الأداء', icon: 'bi-lightning-charge' },
    maint: { en: 'Maintainability', ar: 'سهولة الصيانة', icon: 'bi-tools' },
    bp: { en: 'Best practice', ar: 'أفضل الممارسات', icon: 'bi-patch-check' }
  };
  const SEVL = { high: ['High', 'عالية'], medium: ['Medium', 'متوسطة'], low: ['Low', 'منخفضة'], info: ['Info', 'معلومة'] };
  const grade = (s) => (s >= 85 ? [L('Excellent', 'ممتاز'), '#22c55e'] : s >= 70 ? [L('Good', 'جيد'), '#84cc16'] : s >= 50 ? [L('Needs work', 'يحتاج تحسين'), '#f59e0b'] : [L('At risk', 'في خطر'), '#ef4444']);
  const rt = (id) => { const r = RULES()[id]; return r ? (isAr() ? r.ar : r.en) : [id, '', '']; };

  // ---------- file input ----------
  function pick(file) {
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) return showError('TOO_BIG');
    if (/\.pbix$/i.test(file.name)) return showError('PBIX');
    loading(file.name);
    const reader = new FileReader();
    reader.onload = () => run(reader.result, file.name, file.size);
    reader.onerror = () => showError('READ');
    reader.readAsArrayBuffer(file);
  }
  let worker = null;
  function run(buffer, fileName, size) {
    if (worker) worker.terminate();
    try { worker = new Worker('../assets/js/model-health-worker.min.js'); } catch (e) { return showError('WORKER'); }
    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'progress') setStep(d.step);
      else if (d.type === 'error') { showError(d.code, d.message); worker.terminate(); worker = null; }
      else if (d.type === 'done') {
        R = d.result; tab = 'issues'; filt = { cat: 'all' }; msOpen = null; msQuery = ''; msFilter = 'all';
        const hist = store.get('dataarcus-mh-history', {});
        const key = String(fileName).toLowerCase();
        prev = hist[key] && hist[key].length ? hist[key][hist[key].length - 1] : null;
        hist[key] = (hist[key] || []).concat({ d: new Date().toISOString().slice(0, 10), s: score().overall }).slice(-10);
        const keys = Object.keys(hist); if (keys.length > 30) delete hist[keys[0]];
        store.set('dataarcus-mh-history', hist);
        worker.terminate(); worker = null;
        render();
        const top = root.getBoundingClientRect().top + window.scrollY - 90; window.scrollTo({ top, behavior: 'smooth' });
        track('mh_analyze', { source: R.meta.source, tables: R.stats.tables, measures: R.stats.measures, score: R.score.overall, has_report: R.meta.hasReport, size_kb: Math.round((size || 0) / 1024), sample: fileName === 'Contoso-Sales-Demo.pbit' });
      }
    };
    worker.onerror = () => showError('PARSE');
    worker.postMessage({ buffer, fileName }, [buffer]);
  }
  function loading(name) {
    root.innerHTML = '<div class="mh-panel mh-loading"><div class="mh-spin"></div><div><b>' + esc(name) + '</b><div class="mh-note" id="mhStep">' + L('Reading the file in your browser…', 'قراءة الملف داخل متصفحك…') + '</div></div></div>';
  }
  function setStep(step) {
    const el = $('mhStep'); if (!el) return;
    el.textContent = { model: L('Reading the model…', 'قراءة النموذج…'), report: L('Reading report pages and visuals…', 'قراءة صفحات التقرير والـ visuals…'), analyze: L('Checking the rules…', 'فحص القواعد…') }[step] || '';
  }
  function showError(code, msg) {
    const T = {
      PBIX: [L('This is a .pbix file', 'هذا ملف ‎.pbix'), L('A .pbix holds your data in a compressed format that browsers cannot read. Export a template instead: in Power BI Desktop, File > Export > Power BI template. It takes a few seconds and contains no data.', 'ملف pbix يحتوي بياناتك بصيغة مضغوطة لا يقرأها المتصفح. صدّر قالبًا بدلًا منه: في Power BI Desktop اختر File > Export > Power BI template. يستغرق ثوانٍ ولا يحتوي أي بيانات.')],
      TMDL_ONLY: [L('TMDL project found', 'تم العثور على مشروع TMDL'), L('This project saves the model as TMDL files, which this version does not read yet. Open it in Power BI Desktop and export a .pbit, or save the project with the model.bim format.', 'هذا المشروع يحفظ النموذج كملفات TMDL ولا يدعمها هذا الإصدار بعد. افتحه في Power BI Desktop وصدّر ملف .pbit.')],
      NO_MODEL: [L('No model found in this file', 'لم يتم العثور على نموذج في هذا الملف'), L('Use a .pbit (File > Export > Power BI template), a model.bim, or a zipped PBIP project folder.', 'استخدم ملف .pbit أو model.bim أو مجلد مشروع PBIP مضغوط.')],
      NOT_ZIP: [L('Could not open this file', 'تعذر فتح الملف'), L('It does not look like a Power BI template. Try exporting it again.', 'لا يبدو كقالب Power BI. جرّب تصديره مرة أخرى.')],
      TOO_BIG: [L('This file is very large', 'الملف كبير جدًا'), L('A template without data is usually under 20 MB. If this is a .pbix, export a .pbit instead.', 'القالب بدون بيانات عادة أقل من 20 ميجابايت. إن كان ملف pbix فصدّر .pbit بدلًا منه.')],
      WORKER: [L('Your browser blocked the analysis', 'المتصفح منع التحليل'), L('Please open the page from dataarcus.com in an up-to-date Chrome, Edge, Firefox or Safari.', 'افتح الصفحة من dataarcus.com في متصفح حديث.')]
    }[code] || [L('Something went wrong', 'حدث خطأ'), L('The file could not be analysed. If it opens in Power BI Desktop, try exporting a fresh .pbit.', 'تعذر تحليل الملف. إن كان يفتح في Power BI Desktop فجرّب تصدير .pbit جديد.')];
    track('mh_error', { code });
    root.innerHTML = '<div class="mh-panel mh-error"><i class="bi bi-exclamation-triangle"></i><div><b>' + T[0] + '</b><p>' + T[1] + '</p>' + (msg && code === 'PARSE' ? '<code>' + esc(msg).slice(0, 200) + '</code>' : '') + '<button type="button" class="tg-btn2 btn-sm mt-2" id="mhAgain">' + L('Try another file', 'جرّب ملفًا آخر') + '</button></div></div>';
    $('mhAgain').onclick = () => { R = null; render(); };
  }

  // ---------- views ----------
  function render() {
    if (!R) return renderDrop();
    renderResult();
  }
  function renderDrop() {
    root.innerHTML =
      '<div class="mh-drop" id="mhDrop" tabindex="0" role="button" aria-label="' + L('Choose a Power BI file', 'اختر ملف Power BI') + '">' +
      '<i class="bi bi-cloud-arrow-up"></i><b>' + L('Drop your .pbit here', 'أسقط ملف .pbit هنا') + '</b>' +
      '<span>' + L('or click to choose a file', 'أو اضغط لاختيار ملف') + '</span>' +
      '<small>' + L('Also works with model.bim or a zipped PBIP project', 'يعمل أيضًا مع model.bim أو مشروع PBIP مضغوط') + '</small>' +
      '<input type="file" id="mhFile" accept=".pbit,.bim,.json,.zip" hidden></div>' +
      '<div class="mh-under"><button type="button" class="tg-btn2 btn-sm" id="mhSample"><i class="bi bi-play-circle"></i> ' + L('Try it with a sample model', 'جرّب على نموذج تجريبي') + '</button>' +
      '<span class="mh-note"><i class="bi bi-shield-lock"></i> ' + L('Your file never leaves your computer. It is read and checked inside this browser tab.', 'ملفك لا يغادر جهازك أبدًا. تتم قراءته وفحصه داخل هذه الصفحة فقط.') + '</span></div>' +
      '<div class="mh-how"><b>' + L('How to get a .pbit (10 seconds)', 'كيف تحصل على ملف .pbit (10 ثوانٍ)') + '</b><ol><li>' + L('Open your report in Power BI Desktop.', 'افتح التقرير في Power BI Desktop.') + '</li><li>' + L('File > Export > Power BI template.', 'File > Export > Power BI template.') + '</li><li>' + L('Save it and drop it above. A template has your model and report layout, but no data.', 'احفظه وأسقطه في الأعلى. القالب يحتوي النموذج وتصميم التقرير بدون أي بيانات.') + '</li></ol></div>';
    const drop = $('mhDrop'), inp = $('mhFile');
    drop.onclick = () => inp.click();
    drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
    inp.onchange = () => pick(inp.files[0]);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => pick(e.dataTransfer.files[0]));
    $('mhSample').onclick = () => {
      loading('Contoso-Sales-Demo.pbit');
      track('mh_sample');
      fetch('../assets/data/model-health-sample.pbit').then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then((b) => run(b, 'Contoso-Sales-Demo.pbit', b.byteLength)).catch(() => showError('READ'));
    };
  }

  const ring = (score, size) => {
    const [g, col] = grade(score), r = 44, c = 2 * Math.PI * r;
    return '<div class="mh-ring" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + r + '" class="bg"/><circle cx="50" cy="50" r="' + r + '" class="fg" style="stroke:' + col + ';stroke-dasharray:' + c + ';stroke-dashoffset:' + c * (1 - score / 100) + '"/></svg><div><b>' + score + '</b><span>' + g + '</span></div></div>';
  };
  const bar = (v, col) => '<div class="mh-bar"><span style="width:' + Math.max(2, v) + '%;background:' + (col || grade(v)[1]) + '"></span></div>';

  function renderResult() {
    const s = R.stats, sc = score(), rep = R.meta.hasReport;
    const counts = { issues: R.findings.length };
    const pill = (icon, v, lab) => '<span class="mh-pill"><i class="bi ' + icon + '"></i><b>' + v + '</b> ' + lab + '</span>';
    const quick = R.findings.filter((f) => f.penalty > 0 && !ignored.has(f.id)).slice(0, 3);
    root.innerHTML =
      '<div class="mh-filebar"><span><i class="bi bi-file-earmark-bar-graph"></i> <b>' + bdi(R.meta.fileName) + '</b> · ' + L('checked in ', 'تم الفحص في ') + (R.meta.ms / 1000).toFixed(1) + L(' s', ' ث') + '</span><button type="button" class="tg-btn2 btn-sm" id="mhNew"><i class="bi bi-arrow-repeat"></i> ' + L('Check another file', 'افحص ملفًا آخر') + '</button></div>' +
      '<div class="row g-4">' +
      '<div class="col-lg-4"><div class="mh-panel mh-scorecard text-center">' + ring(sc.overall, 170) +
      (prev ? (() => { const dlt = sc.overall - prev.s; return '<div class="mh-delta ' + (dlt > 0 ? 'up' : dlt < 0 ? 'down' : '') + '">' + (dlt > 0 ? '▲ +' + dlt : dlt < 0 ? '▼ ' + dlt : '=') + ' ' + L('since your last check (' + prev.d + ')', 'منذ آخر فحص (' + prev.d + ')') + '</div>'; })() : '') +
      (ignored.size && R.findings.some((f) => ignored.has(f.id)) ? '<div class="mh-note mt-1">' + L(num(R.findings.filter((f) => ignored.has(f.id)).length) + ' check(s) ignored', 'تم تجاهل ' + num(R.findings.filter((f) => ignored.has(f.id)).length) + ' فحص') + '</div>' : '') +
      '<div class="mh-cats">' + Object.keys(CAT).map((k) => '<div><span><i class="bi ' + CAT[k].icon + '"></i> ' + L(CAT[k].en, CAT[k].ar) + '</span><b>' + sc[k] + '</b>' + bar(sc[k]) + '</div>').join('') + '</div>' +
      '<button type="button" class="mh-share" id="mhShare"><i class="bi bi-linkedin"></i> ' + L('Share my score', 'شارك نتيجتي') + '</button></div></div>' +
      '<div class="col-lg-8"><div class="mh-panel"><div class="mh-pills">' +
      pill('bi-table', num(s.tables), L('tables', 'جداول')) + pill('bi-layout-three-columns', num(s.columns), L('columns', 'أعمدة')) + pill('bi-calculator', num(s.measures), L('measures', 'مقاييس')) +
      pill('bi-diagram-3', num(s.relationships), L('relationships', 'علاقات')) + (rep ? pill('bi-file-earmark-richtext', num(s.pages), L('pages', 'صفحات')) + pill('bi-bar-chart', num(s.visuals), L('visuals', 'visuals')) : '') +
      '</div>' +
      (rep ? '<div class="mh-unusedsum"><div><b>' + num(s.unusedColumns) + '</b><span>' + L('columns nobody uses', 'عمود غير مستخدم') + '</span></div><div><b>' + num(s.unusedMeasures) + '</b><span>' + L('measures nobody uses', 'مقياس غير مستخدم') + '</span></div><div><b>' + num(s.calcColumns) + '</b><span>' + L('calculated columns', 'عمود محسوب') + '</span></div></div>'
        : '<div class="mh-warn"><i class="bi bi-info-circle"></i> ' + L('This file has no report pages, so unused columns and measures could not be checked. Use a .pbit to include them.', 'الملف لا يحتوي صفحات تقرير، لذلك لم يتم فحص الأعمدة والمقاييس غير المستخدمة. استخدم ملف .pbit لتضمينها.') + '</div>') +
      (quick.length ? '<span class="tg-label mt-3">' + L('Fix these first', 'ابدأ بإصلاح هذه') + '</span><div class="mh-quick">' + quick.map((f) => '<button type="button" data-jump="' + f.id + '"><span class="mh-sev ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span><span>' + rt(f.id)[0] + ' <small>(' + num(f.items.length) + ')</small></span><b title="' + L('Points added to the overall score', 'نقاط تضاف للتقييم العام') + '">+' + Math.max(1, Math.round(f.penalty * (f.cat === 'perf' ? 0.4 : 0.3))) + '</b></button>').join('') + '</div>' : '') +
      '</div></div></div>' +
      '<div class="mh-tabs" role="tablist">' + [['issues', L('Issues', 'المشاكل'), counts.issues], ['fix', L('Fix plan', 'خطة الإصلاح'), null], ['unused', L('Unused', 'غير المستخدم'), rep ? s.unusedColumns + s.unusedMeasures : null], ['measures', L('Measures', 'المقاييس'), s.measures], ['tables', L('Tables', 'الجداول'), s.tables], ['rels', L('Relationships', 'العلاقات'), s.relationships], ['docs', L('Documentation', 'التوثيق'), null]]
        .map((t) => '<button type="button" role="tab" data-tab="' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '" aria-selected="' + (tab === t[0]) + '">' + t[1] + (t[2] != null ? ' <small>' + num(t[2]) + '</small>' : '') + '</button>').join('') + '</div>' +
      '<div id="mhTab"></div>';
    $('mhNew').onclick = () => { R = null; render(); };
    $('mhShare').onclick = () => {
      track('mh_share', { score: sc.overall });
      window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent('https://dataarcus.com/tools/power-bi-model-health-check.html?utm_source=linkedin&utm_medium=social&utm_campaign=mh_share'), '_blank', 'noopener');
    };
    root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { tab = b.dataset.tab; track('mh_tab', { tab }); renderResult(); });
    root.querySelectorAll('[data-jump]').forEach((b) => b.onclick = () => { tab = 'issues'; filt.cat = 'all'; renderResult(); const el = document.querySelector('[data-rule="' + b.dataset.jump + '"]'); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    ({ issues: tIssues, fix: tFix, unused: tUnused, measures: tMeasures, tables: tTables, rels: tRels, docs: tDocs })[tab]();
  }

  const itemList = (items, limit) => {
    const lim = limit || 25;
    return '<ul class="mh-items">' + items.slice(0, lim).map((i) => '<li><code>' + esc(i.obj) + '</code>' + (i.detail ? ' <small>' + esc(i.detail) + '</small>' : '') + '</li>').join('') + '</ul>' +
      (items.length > lim ? '<button type="button" class="mh-more" data-more>' + L('Show all ' + num(items.length), 'عرض الكل (' + num(items.length) + ')') + '</button>' : '');
  };

  function tIssues() {
    const el = $('mhTab');
    const list = R.findings.filter((f) => filt.cat === 'all' || f.cat === filt.cat);
    el.innerHTML = '<div class="mh-chips">' + [['all', L('All', 'الكل')]].concat(Object.keys(CAT).map((k) => [k, L(CAT[k].en, CAT[k].ar)]))
      .map((c) => '<button type="button" class="tg-preset' + (filt.cat === c[0] ? ' active' : '') + '" data-cat="' + c[0] + '">' + c[1] + ' <small>' + num(c[0] === 'all' ? R.findings.length : R.findings.filter((f) => f.cat === c[0]).length) + '</small></button>').join('') +
      '<button type="button" class="tg-btn2 btn-sm ms-auto" id="mhCsv"><i class="bi bi-download"></i> CSV</button></div>' +
      (list.length ? list.map((f) => {
        const [title, why, fix] = rt(f.id);
        const ign = ignored.has(f.id);
        const kind = QUICK.has(f.id) ? 'quick' : EXPERT.has(f.id) ? 'expert' : '';
        const badge = kind === 'quick' ? '<span class="mh-kind quick" title="' + L('The Fix plan tab has a ready script or step for this', 'تبويب خطة الإصلاح فيه سكربت أو خطوة جاهزة لهذا') + '"><i class="bi bi-lightning-charge-fill"></i> ' + L('Quick fix', 'إصلاح سريع') + '</span>' : kind === 'expert' ? '<span class="mh-kind expert" title="' + L('Needs design decisions and testing, not a script', 'يحتاج قرارات تصميم واختبار وليس سكربتًا') + '"><i class="bi bi-person-gear"></i> ' + L('Expert', 'خبير') + '</span>' : '';
        const extra = kind === 'quick' ? '<button type="button" class="tg-btn2 btn-sm mt-1 mb-2" data-gofix><i class="bi bi-list-check"></i> ' + L('Open the fix plan', 'افتح خطة الإصلاح') + '</button>'
          : kind === 'expert' ? '<div class="mh-expert"><i class="bi bi-person-gear"></i><div><b>' + L('Want this fixed for you?', 'تريد من يصلحها لك؟') + '</b><span>' + L('This one needs design decisions and testing, not just a script. DataArcus reviews and fixes models like this.', 'هذه تحتاج قرارات تصميم واختبار وليس مجرد سكربت. DataArcus تراجع وتصلح نماذج كهذه.') + '</span></div><a href="../index.html#contact" class="btn btn-accent btn-sm" data-expert="' + f.id + '">' + L('Book a free call', 'احجز مكالمة مجانية') + '</a></div>' : '';
        return '<details class="mh-issue' + (ign ? ' ignored' : '') + '" data-rule="' + f.id + '"><summary><span class="mh-sev ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span><b>' + title + '</b>' + badge + '<span class="mh-count">' + num(f.items.length) + '</span>' + (f.penalty ? '<span class="mh-pen">−' + f.penalty + '</span>' : '') + '<i class="bi bi-chevron-down"></i></summary>' +
          '<div class="mh-ibody"><p><b>' + L('Why it matters', 'لماذا يهم') + ':</b> ' + why + '</p><p class="mh-fix"><i class="bi bi-wrench-adjustable"></i> <b>' + L('How to fix', 'طريقة الإصلاح') + ':</b> ' + fix + '</p>' + extra +
          '<div class="mh-cat"><i class="bi ' + CAT[f.cat].icon + '"></i> ' + L(CAT[f.cat].en, CAT[f.cat].ar) + (f.share != null ? ' · ' + L(f.share + '% of objects', f.share + '% من العناصر') : '') + '<button type="button" class="mh-ign" data-ign="' + f.id + '">' + (ign ? '<i class="bi bi-eye"></i> ' + L('Count it again', 'احسبه مرة أخرى') : '<i class="bi bi-eye-slash"></i> ' + L('Ignore this check', 'تجاهل هذا الفحص')) + '</button></div>' + itemList(f.items) + '</div></details>';
      }).join('') : '<div class="mh-panel mh-note">' + L('No issues in this group. Nice work.', 'لا توجد مشاكل في هذه المجموعة. عمل ممتاز.') + '</div>');
    el.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { filt.cat = b.dataset.cat; tIssues(); });
    el.querySelectorAll('[data-gofix]').forEach((b) => b.onclick = () => { tab = 'fix'; renderResult(); const t = document.getElementById('mhTab'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    el.querySelectorAll('[data-expert]').forEach((a) => a.addEventListener('click', () => track('mh_expert_click', { rule: a.dataset.expert, score: score().overall })));
    el.querySelectorAll('.mh-issue').forEach((d) => d.addEventListener('toggle', () => { if (d.open) track('mh_issue_open', { rule: d.dataset.rule }); }));
    el.querySelectorAll('[data-ign]').forEach((b) => b.onclick = (e) => {
      e.preventDefault(); const id = b.dataset.ign;
      if (ignored.has(id)) ignored.delete(id); else ignored.add(id);
      saveIgnored(); track('mh_ignore', { rule: id, on: ignored.has(id) });
      const y = window.scrollY; renderResult(); const d = document.querySelector('[data-rule="' + id + '"]'); if (d) d.open = true; window.scrollTo(0, y);
    });
    el.querySelectorAll('[data-more]').forEach((b) => b.onclick = () => { const d = b.closest('.mh-issue'); const f = R.findings.find((x) => x.id === d.dataset.rule); b.previousElementSibling.outerHTML = itemList(f.items, 100000).replace(/<button[\s\S]*$/, ''); b.remove(); });
    $('mhCsv').onclick = () => {
      const rows = [['Severity', 'Category', 'Rule', 'Object', 'Detail']];
      R.findings.forEach((f) => f.items.forEach((i) => rows.push([f.sev, CAT[f.cat].en, RULES()[f.id].en[0], i.obj, i.detail || ''])));
      download('model-health-findings.csv', '﻿' + rows.map((r) => r.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv');
      track('mh_download', { kind: 'csv' });
    };
  }

  function tUnused() {
    const el = $('mhTab');
    if (!R.meta.hasReport) { el.innerHTML = '<div class="mh-panel mh-note">' + L('Unused items need the report pages. Use a .pbit file.', 'فحص العناصر غير المستخدمة يحتاج صفحات التقرير. استخدم ملف .pbit.') + '</div>'; return; }
    const cols = [], tablesUnused = [];
    R.tables.filter((t) => !t.auto).forEach((t) => {
      const u = t.columns.filter((c) => c.used === false);
      if (u.length) cols.push({ t, u });
      if (t.used === false) tablesUnused.push(t);
    });
    const ms = R.measures.filter((m) => m.used === false);
    const byFolder = {};
    ms.forEach((m) => { const k = m.folder || L('(no folder)', '(بدون مجلد)'); (byFolder[k] = byFolder[k] || []).push(m); });
    el.innerHTML = '<div class="mh-panel mh-caution"><i class="bi bi-info-circle"></i> ' + L('"Unused" means not used by any visual, filter, measure, relationship, sort or security rule in this file. If other reports connect to the same model, check them before deleting.', '"غير مستخدم" تعني غير مستخدم في أي visual أو فلتر أو مقياس أو علاقة أو ترتيب أو قاعدة أمان في هذا الملف. إن كانت تقارير أخرى متصلة بنفس النموذج فراجعها قبل الحذف.') + '</div>' +
      '<div class="row g-4 mt-1"><div class="col-lg-6"><div class="mh-panel"><div class="mh-h"><b>' + L('Columns', 'الأعمدة') + '</b> <span class="mh-count">' + num(cols.reduce((a, x) => a + x.u.length, 0)) + '</span><button type="button" class="mh-copy ms-auto" data-copy="cols"><i class="bi bi-clipboard"></i> ' + L('Copy list', 'نسخ القائمة') + '</button></div>' +
      (tablesUnused.length ? '<div class="mh-tunused"><b>' + L('Whole tables unused', 'جداول غير مستخدمة بالكامل') + ':</b> ' + tablesUnused.map((t) => '<code>' + esc(t.name) + '</code>').join(' ') + '</div>' : '') +
      cols.map((x) => '<div class="mh-group"><div class="mh-gh">' + bdi(x.t.name) + ' <small>' + num(x.u.length) + ' / ' + num(x.t.columns.length) + '</small></div><div class="mh-tags">' + x.u.map((c) => '<code' + (c.kind === 'calculated' ? ' class="calc" title="' + L('Calculated column', 'عمود محسوب') + '"' : '') + '>' + esc(c.name) + '</code>').join('') + '</div></div>').join('') + '</div></div>' +
      '<div class="col-lg-6"><div class="mh-panel"><div class="mh-h"><b>' + L('Measures', 'المقاييس') + '</b> <span class="mh-count">' + num(ms.length) + '</span><button type="button" class="mh-copy ms-auto" data-copy="ms"><i class="bi bi-clipboard"></i> ' + L('Copy list', 'نسخ القائمة') + '</button></div>' +
      Object.keys(byFolder).sort().map((k) => '<div class="mh-group"><div class="mh-gh"><i class="bi bi-folder2"></i> ' + bdi(k) + ' <small>' + num(byFolder[k].length) + '</small></div><div class="mh-tags">' + byFolder[k].map((m) => '<code class="ms" data-ms="' + esc(m.name) + '">' + esc(m.name) + '</code>').join('') + '</div></div>').join('') + '</div></div></div>';
    el.insertAdjacentHTML('beforeend', '<div class="mh-panel mt-4 d-flex flex-wrap align-items-center gap-3"><i class="bi bi-magic text-accent fs-4"></i><div class="flex-grow-1"><b>' + L('Ready-made cleanup scripts', 'سكربتات تنظيف جاهزة') + '</b><div class="mh-note">' + L('Power Query steps for these columns and a Tabular Editor script for these measures are in the Fix plan.', 'خطوات Power Query لهذه الأعمدة وسكربت Tabular Editor لهذه المقاييس موجودة في خطة الإصلاح.') + '</div></div><button type="button" class="btn btn-accent btn-sm" data-gofix>' + L('Open the fix plan', 'افتح خطة الإصلاح') + '</button></div>');
    el.querySelectorAll('[data-gofix]').forEach((b) => b.onclick = () => { tab = 'fix'; renderResult(); });
    el.querySelectorAll('[data-ms]').forEach((c) => c.onclick = () => { tab = 'measures'; msOpen = c.dataset.ms; renderResult(); });
    el.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => {
      const txt = b.dataset.copy === 'cols' ? cols.map((x) => x.u.map((c) => "'" + x.t.name + "'[" + c.name + ']').join('\n')).join('\n') : ms.map((m) => '[' + m.name + ']').join('\n');
      copy(txt); track('mh_copy', { list: b.dataset.copy });
    });
  }

  // ---------- Fix plan: safe order, quick-fixes script, cleanup scripts, expert items ----------
  const QUICK = new Set(['DATE_NOT_MARKED', 'MONTH_SORT', 'SUMMARIZE_KEYS', 'FK_VISIBLE', 'UNUSED_COL', 'UNUSED_MEASURE']);
  const EXPERT = new Set(['FILTER_TABLE', 'BIDI', 'M2M', 'DEEP_CHAIN', 'LONG_MEASURE', 'CALC_COLS', 'STRING_KEYS', 'LONG_M', 'HARDCODED_PATH', 'NO_RLS']);
  const unusedData = () => {
    const cols = [];
    R.tables.filter((t) => !t.auto).forEach((t) => { const u = t.columns.filter((c) => c.used === false); if (u.length) cols.push({ t, u }); });
    return { cols, ms: R.measures.filter((m) => m.used === false) };
  };
  const splitObj = (o) => { const m = String(o).match(/^(.*)\[(.*)\]$/); return m ? [m[1], m[2]] : null; };
  const findingOf = (id) => (ignored.has(id) ? null : R.findings.find((f) => f.id === id));
  function quickFixScript() {
    const lines = [];
    const q = (x) => csStr(x);
    const col = (t, c) => 'Model.Tables[' + q(t) + '].Columns[' + q(c) + ']';
    const has = (t, c) => 'Model.Tables.Contains(' + q(t) + ') && Model.Tables[' + q(t) + '].Columns.Contains(' + q(c) + ')';
    let count = 0;
    const dt = findingOf('DATE_NOT_MARKED');
    if (dt) {
      lines.push('', '// 1. Mark calendar tables as date tables');
      dt.items.forEach((i) => {
        const t = R.tables.find((x) => x.name === i.obj); if (!t) return;
        const target = R.relationships.find((r) => r.toTable === t.name && t.columns.some((c) => c.name === r.toColumn && c.dataType === 'dateTime'));
        const dcol = (target && target.toColumn) || (t.columns.find((c) => /^date$/i.test(c.name) && c.dataType === 'dateTime') || t.columns.find((c) => c.dataType === 'dateTime') || {}).name;
        if (!dcol) return;
        lines.push('if (' + has(t.name, dcol) + ') { Model.Tables[' + q(t.name) + '].DataCategory = "Time"; ' + col(t.name, dcol) + '.IsKey = true; n++; }'); count++;
      });
    }
    const ms = findingOf('MONTH_SORT');
    if (ms) {
      const out = [];
      ms.items.forEach((i) => {
        const p = splitObj(i.obj); if (!p) return;
        const t = R.tables.find((x) => x.name === p[0]); if (!t) return;
        const isDay = /day|week/i.test(p[1]);
        const sortCol = t.columns.find((c) => /int64|double|decimal/.test(c.dataType) && (isDay ? /(weekday|day\s*of\s*week)\s*(no|num|number|index)?$|^weekday$/i : /month\s*(no|num|number|index)$|^month$|month\s*of\s*year/i).test(c.name.trim()));
        if (sortCol) { out.push('if (' + has(t.name, p[1]) + ' && Model.Tables[' + q(t.name) + '].Columns.Contains(' + q(sortCol.name) + ')) { ' + col(t.name, p[1]) + '.SortByColumn = ' + col(t.name, sortCol.name) + '; n++; }'); count++; }
        else out.push('// ' + t.name + '[' + p[1] + ']: no ' + (isDay ? 'weekday' : 'month') + ' number column found. Add one, then sort by it.');
      });
      if (out.length) lines.push('', '// 2. Sort month and day names by their number'), lines.push.apply(lines, out);
    }
    const sk = findingOf('SUMMARIZE_KEYS');
    if (sk) {
      lines.push('', '// 3. IDs, years and codes: do not summarize');
      sk.items.forEach((i) => { const p = splitObj(i.obj); if (p) { lines.push('if (' + has(p[0], p[1]) + ') { ' + col(p[0], p[1]) + '.SummarizeBy = AggregateFunction.None; n++; }'); count++; } });
    }
    const fk = findingOf('FK_VISIBLE');
    if (fk) {
      lines.push('', '// 4. Hide key columns on the many side of relationships');
      fk.items.forEach((i) => { const p = splitObj(i.obj); if (p) { lines.push('if (' + has(p[0], p[1]) + ') { ' + col(p[0], p[1]) + '.IsHidden = true; n++; }'); count++; } });
    }
    if (!count) return null;
    return { count, code: '// DataArcus Model Health Check: quick fixes (' + count + ' changes). Save a copy of your file first.\n// Tabular Editor: C# Script tab, paste, run (F5), then save (Ctrl+S).\nint n = 0;' + lines.join('\n') + '\n\nInfo(n + " quick fixes applied. Save the model to keep them.");' };
  }
  function tFix() {
    const el = $('mhTab');
    const key = String(R.meta.fileName).toLowerCase();
    const plans = store.get('dataarcus-mh-plan', {});
    const done = new Set(plans[key] || []);
    const { cols, ms } = R.meta.hasReport ? unusedData() : { cols: [], ms: [] };
    const broken = findingOf('BROKEN_REF');
    const qf = quickFixScript();
    const pqCount = cols.filter((x) => x.t.fromM && x.u.some((c) => c.kind === 'data')).length;
    const calcCount = cols.reduce((a, x) => a + x.u.filter((c) => c.kind === 'calculated').length, 0);
    const steps = [['copy', L('Save a copy of your .pbix', 'احفظ نسخة من ملف ‎.pbix'), L('Every step below changes the model. Keep a copy so you can go back.', 'كل خطوة بالأسفل تغيّر النموذج، فاحتفظ بنسخة للرجوع إليها.')]];
    if (broken) steps.push(['broken', L('Fix ' + num(broken.items.length) + ' broken fields in visuals', 'أصلح ' + num(broken.items.length) + ' حقلًا مكسورًا في الـ visuals'), L('Open each page listed in the Issues tab and replace or remove the missing field. Users see these errors today.', 'افتح كل صفحة مذكورة في تبويب المشاكل واستبدل الحقل المفقود أو احذفه، فالمستخدمون يرون هذه الأخطاء الآن.')]);
    if (qf) steps.push(['quick', L('Run the quick-fixes script (' + num(qf.count) + ' changes)', 'شغّل سكربت الإصلاحات السريعة (' + num(qf.count) + ' تعديل)'), L('Date tables, month sorting, summarization and hidden keys. Safe, mechanical changes.', 'جداول التاريخ وترتيب الشهور والتجميع وإخفاء المفاتيح. تعديلات آمنة وآلية.')]);
    if (ms.length) steps.push(['measures', L('Move ' + num(ms.length) + ' unused measures to a review folder', 'انقل ' + num(ms.length) + ' مقياسًا غير مستخدم إلى مجلد مراجعة'), L('Nothing is deleted. Look through the folder, then delete it when you are sure.', 'لا يُحذف شيء. راجع المجلد ثم احذفه عندما تتأكد.')]);
    if (pqCount) steps.push(['columns', L('Remove unused columns in Power Query (' + num(pqCount) + ' tables)', 'احذف الأعمدة غير المستخدمة في Power Query (' + num(pqCount) + ' جدول)'), L('Paste one line per table. Hiding is not enough: hidden columns still load.', 'الصق سطرًا واحدًا لكل جدول. الإخفاء لا يكفي فالأعمدة المخفية ما زالت تُحمَّل.')]);
    if (calcCount) steps.push(['calc', L('Delete ' + num(calcCount) + ' unused calculated columns', 'احذف ' + num(calcCount) + ' عمودًا محسوبًا غير مستخدم'), L('Listed at the bottom of this page.', 'موجودة في أسفل هذه الصفحة.')]);
    steps.push(['recheck', L('Refresh, export a new .pbit and check again', 'حدّث النموذج وصدّر .pbit جديدًا وافحصه مرة أخرى'), L('Your score history shows how many points you gained.', 'سجل التقييم يوضح كم نقطة كسبت.')]);
    const nDone = steps.filter((x) => done.has(x[0])).length;
    const experts = R.findings.filter((f) => EXPERT.has(f.id) && !ignored.has(f.id) && f.sev !== 'info');
    el.innerHTML = '<div class="row g-4"><div class="col-lg-5"><div class="mh-panel mh-plan"><div class="mh-h"><b><i class="bi bi-list-check"></i> ' + L('Safe order', 'الترتيب الآمن') + '</b><span class="ms-auto mh-note">' + L(num(nDone) + ' of ' + num(steps.length) + ' done', 'تم ' + num(nDone) + ' من ' + num(steps.length)) + '</span></div>' +
      '<div class="mh-bar mb-3"><span style="width:' + Math.round(nDone / steps.length * 100) + '%;background:#22c55e"></span></div>' +
      steps.map((x, i) => '<label class="mh-step' + (done.has(x[0]) ? ' done' : '') + '"><input type="checkbox" data-step="' + x[0] + '"' + (done.has(x[0]) ? ' checked' : '') + '><span><b>' + (i + 1) + '. ' + x[1] + '</b><small>' + x[2] + '</small></span></label>').join('') + '</div>' +
      (experts.length ? '<div class="mh-panel mt-4 mh-expertbox"><div class="mh-h"><b><i class="bi bi-person-gear"></i> ' + L('Needs an expert', 'يحتاج خبيرًا') + '</b></div><p class="mh-note">' + L('These need design decisions and testing against your data, not a script. Getting them wrong can change the numbers in your reports.', 'هذه تحتاج قرارات تصميم واختبارًا على بياناتك وليس سكربتًا، والخطأ فيها قد يغيّر أرقام تقاريرك.') + '</p><ul class="mh-elist">' + experts.map((f) => '<li><span class="mh-sev ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span> ' + rt(f.id)[0] + ' <small>(' + num(f.items.length) + ')</small></li>').join('') + '</ul><a href="../index.html#contact" class="btn btn-accent btn-sm" data-expert="plan"><i class="bi bi-calendar3"></i> ' + L('Book a free call', 'احجز مكالمة مجانية') + '</a></div>' : '') +
      '</div><div class="col-lg-7">' +
      (qf ? '<div class="mh-panel mh-clean"><div class="mh-h"><b><i class="bi bi-lightning-charge-fill text-warning"></i> ' + L('Quick-fixes script', 'سكربت الإصلاحات السريعة') + '</b><span class="mh-count">' + num(qf.count) + '</span><button type="button" class="mh-copy ms-auto" data-script="te:quick"><i class="bi bi-clipboard"></i> ' + L('Copy', 'نسخ') + '</button></div><p class="mh-note">' + L('One Tabular Editor script for the mechanical fixes. External tools > Tabular Editor > C# Script, paste, run, save. If Power BI Desktop blocks one change, do that one by hand.', 'سكربت Tabular Editor واحد للإصلاحات الآلية. من External tools افتح Tabular Editor ثم C# Script والصق وشغّل واحفظ. إن منع Power BI Desktop تعديلًا فنفّذه يدويًا.') + '</p><pre class="mh-dax mh-qf">' + esc(qf.code) + '</pre></div>' : '') +
      (R.meta.hasReport ? cleanupHtml(cols, ms) : '<div class="mh-panel mh-note">' + L('Cleanup scripts for unused columns and measures need the report pages. Use a .pbit.', 'سكربتات تنظيف الأعمدة والمقاييس غير المستخدمة تحتاج صفحات التقرير. استخدم ملف .pbit.') + '</div>') +
      '</div></div>';
    if (qf) scripts['te:quick'] = qf.code;
    el.querySelectorAll('[data-step]').forEach((c) => c.onchange = () => {
      if (c.checked) done.add(c.dataset.step); else done.delete(c.dataset.step);
      plans[key] = Array.from(done); store.set('dataarcus-mh-plan', plans);
      track('mh_plan_step', { step: c.dataset.step, done: c.checked });
      const y = window.scrollY; tFix(); window.scrollTo(0, y);
    });
    el.querySelectorAll('[data-script]').forEach((b) => b.onclick = () => { copy(scripts[b.dataset.script]); track('mh_copy', { list: 'script_' + b.dataset.script.split(':')[1] }); });
    el.querySelectorAll('[data-expert]').forEach((a) => a.addEventListener('click', () => track('mh_expert_click', { rule: a.dataset.expert, score: score().overall })));
  }

  // Ready-to-paste cleanup: Power Query steps for unused source columns, Tabular Editor scripts for unused measures
  const scripts = {};
  const csStr = (x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const mStr = (x) => '"' + String(x).replace(/"/g, '""') + '"';
  function cleanupHtml(cols, ms) {
    const pq = cols.filter((x) => x.t.fromM).map((x) => ({ t: x.t, names: x.u.filter((c) => c.kind === 'data' || c.kind === 'calculatedTableColumn' ? c.kind === 'data' : false).map((c) => c.sourceColumn || c.name) })).filter((x) => x.names.length);
    const calc = cols.reduce((a, x) => a.concat(x.u.filter((c) => c.kind === 'calculated').map((c) => ({ t: x.t.name, c: c.name }))), []);
    let html = '<div class="mh-panel mt-4 mh-clean"><div class="mh-h"><b><i class="bi bi-magic"></i> ' + L('Cleanup scripts', 'سكربتات التنظيف') + '</b></div><p class="mh-note">' + L('Save a copy of your file first. Then use these to remove what nobody uses.', 'احفظ نسخة من ملفك أولًا، ثم استخدم هذه السكربتات لحذف ما لا يستخدمه أحد.') + '</p>';
    if (pq.length) {
      html += '<span class="tg-label mt-2">' + L('Power Query: remove unused source columns', 'Power Query: حذف أعمدة المصدر غير المستخدمة') + '</span><p class="mh-note">' + L('In Power Query, select the table, click fx to add a step, and paste the line. Replace #"Previous step" with the name Power Query shows in the formula bar.', 'في Power Query اختر الجدول واضغط fx لإضافة خطوة والصق السطر. استبدل #"Previous step" بالاسم الذي يظهره Power Query في شريط الصيغة.') + '</p>';
      pq.forEach((x, i) => {
        const code = '= Table.RemoveColumns(#"Previous step", {' + x.names.map(mStr).join(', ') + '}, MissingField.Ignore)';
        scripts['pq:' + i] = code;
        html += '<div class="mh-script"><div class="mh-sh"><b>' + bdi(x.t.name) + '</b> <small>' + L(num(x.names.length) + ' columns', num(x.names.length) + ' عمود') + '</small><button type="button" class="mh-copy ms-auto" data-script="pq:' + i + '"><i class="bi bi-clipboard"></i> ' + L('Copy', 'نسخ') + '</button></div><pre class="mh-dax">' + esc(code) + '</pre></div>';
      });
    }
    if (ms.length) {
      const list = 'var names = new[] {\n    ' + ms.map((m) => csStr(m.name)).join(',\n    ') + '\n};\n';
      scripts['te:move'] = '// DataArcus Model Health Check: move measures no visual uses into a review folder (safe, nothing is deleted)\n' + list + 'foreach (var n in names) {\n    var m = Model.AllMeasures.FirstOrDefault(x => x.Name == n);\n    if (m != null) m.DisplayFolder = "_Unused (review)";\n}';
      scripts['te:delete'] = '// DataArcus Model Health Check: delete measures no visual uses. Save a copy of your file first.\n' + list + 'foreach (var n in names) {\n    var m = Model.AllMeasures.FirstOrDefault(x => x.Name == n);\n    if (m != null) m.Delete();\n}';
      html += '<span class="tg-label mt-3">' + L('Tabular Editor: ' + num(ms.length) + ' unused measures', 'Tabular Editor: ' + num(ms.length) + ' مقياس غير مستخدم') + '</span><p class="mh-note">' + L('Open the model in Tabular Editor (External tools), then C# Script, paste and run, then save. Start with "move to folder": it hides nothing and deletes nothing, so you can review first.', 'افتح النموذج في Tabular Editor من External tools ثم C# Script والصق وشغّل ثم احفظ. ابدأ بـ "نقل لمجلد": لا يحذف شيئًا، فتراجع أولًا.') + '</p>' +
        '<div class="mh-sbtns"><button type="button" class="tg-btn2 btn-sm" data-script="te:move"><i class="bi bi-folder-symlink"></i> ' + L('Copy: move to a review folder', 'نسخ: نقل إلى مجلد مراجعة') + '</button><button type="button" class="tg-btn2 btn-sm mh-danger" data-script="te:delete"><i class="bi bi-trash3"></i> ' + L('Copy: delete them', 'نسخ: حذفها') + '</button></div>';
    }
    if (calc.length) html += '<span class="tg-label mt-3">' + L('Calculated columns to delete by hand', 'أعمدة محسوبة تُحذف يدويًا') + '</span><div class="mh-tags">' + calc.map((x) => '<code>' + esc(x.t) + '[' + esc(x.c) + ']</code>').join('') + '</div>';
    return html + '</div>';
  }

  // Measure dependency tree (measures only), capped so huge models stay readable
  function chainTree(name) {
    const byName = new Map(R.measures.map((m) => [m.name.toLowerCase(), m]));
    let count = 0; const shown = new Set();
    const node = (n, lvl, path) => {
      const m = byName.get(n.toLowerCase()); if (!m) return '';
      count++;
      const kids = m.dependsOn.filter((d) => d.type === 'measure');
      const cols = m.dependsOn.filter((d) => d.type === 'column').length;
      const again = shown.has(n.toLowerCase()); shown.add(n.toLowerCase());
      let h = '<li><button type="button" class="mh-tnode" data-ms="' + esc(m.name) + '">' + bdi('[' + m.name + ']') + '</button>' +
        '<small>' + (cols ? L(num(cols) + ' col', num(cols) + ' عمود') : '') + (m.used === false ? ' · <span class="mh-badge off">' + L('unused', 'غير مستخدم') + '</span>' : '') + (again && kids.length ? ' · ' + L('shown above', 'مذكور بالأعلى') : '') + '</small>';
      if (kids.length && !again && lvl < 12 && count < 120 && !path.has(n.toLowerCase())) {
        const p2 = new Set(path); p2.add(n.toLowerCase());
        h += '<ul>' + kids.map((k) => node(k.name, lvl + 1, p2)).join('') + '</ul>';
      }
      return h + '</li>';
    };
    return '<ul class="mh-tree" dir="ltr">' + node(name, 0, new Set()) + '</ul>' + (count >= 120 ? '<p class="mh-help">' + L('Showing the first 120 measures of the chain.', 'يتم عرض أول 120 مقياسًا من السلسلة.') + '</p>' : '');
  }

  function tMeasures() {
    const el = $('mhTab');
    const q = msQuery.toLowerCase();
    let list = R.measures.filter((m) => (!q || m.name.toLowerCase().includes(q) || (m.folder || '').toLowerCase().includes(q) || m.expr.toLowerCase().includes(q)));
    if (msFilter === 'unused') list = list.filter((m) => m.used === false);
    if (msFilter === 'visual') list = list.filter((m) => m.visuals > 0);
    list.sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name));
    const sel = msOpen ? R.measures.find((m) => m.name === msOpen) : null;
    const chip = (d) => '<button type="button" class="mh-dep ' + (d.type === 'table' ? 'tbl' : d.type) + '" ' + (d.type === 'measure' ? 'data-ms="' + esc(d.name) + '"' : '') + '><i class="bi ' + (d.type === 'measure' ? 'bi-calculator' : d.type === 'column' ? 'bi-layout-three-columns' : 'bi-table') + '"></i> ' + (d.type === 'column' ? esc(d.table) + '[' + esc(d.name) + ']' : d.type === 'measure' ? '[' + esc(d.name) + ']' : esc(d.name)) + '</button>';
    el.innerHTML = '<div class="row g-4"><div class="col-lg-5"><div class="mh-panel mh-mlist"><div class="mh-search"><i class="bi bi-search"></i><input type="search" id="mhQ" value="' + esc(msQuery) + '" placeholder="' + L('Search name, folder or DAX', 'ابحث بالاسم أو المجلد أو DAX') + '"></div>' +
      '<div class="mb-seg mb-2">' + [['all', L('All', 'الكل')], ['visual', L('In visuals', 'في visuals')], ['unused', L('Unused', 'غير مستخدم')]].map((x) => '<button type="button" data-mf="' + x[0] + '" class="' + (msFilter === x[0] ? 'active' : '') + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div class="mh-note mb-1">' + num(list.length) + ' ' + L('measures', 'مقياس') + '</div><div class="mh-mscroll">' +
      list.slice(0, 400).map((m) => '<button type="button" class="mh-mrow' + (sel && sel.name === m.name ? ' on' : '') + '" data-ms="' + esc(m.name) + '"><span><b>' + bdi(m.name) + '</b><small>' + bdi(m.folder || '') + '</small></span>' + (m.used === false ? '<span class="mh-badge off">' + L('unused', 'غير مستخدم') + '</span>' : m.visuals ? '<span class="mh-badge">' + num(m.visuals) + ' <i class="bi bi-bar-chart"></i></span>' : '') + '</button>').join('') +
      (list.length > 400 ? '<div class="mh-note p-2">' + L('Showing 400. Refine the search to see more.', 'يتم عرض 400. استخدم البحث لرؤية المزيد.') + '</div>' : '') + '</div></div></div>' +
      '<div class="col-lg-7"><div class="mh-panel mh-mdetail">' + (sel ?
        '<div class="mh-h"><b>' + bdi('[' + sel.name + ']') + '</b>' + (sel.used === false ? '<span class="mh-badge off ms-2">' + L('unused', 'غير مستخدم') + '</span>' : '') + '</div>' +
        '<div class="mh-meta">' + (sel.folder ? '<span><i class="bi bi-folder2"></i> ' + bdi(sel.folder) + '</span>' : '') + '<span><i class="bi bi-table"></i> ' + bdi(sel.table) + '</span>' + (sel.formatString ? '<span><i class="bi bi-hash"></i> ' + bdi(sel.formatString) + '</span>' : '') + '<span title="' + esc(sel.pages.join(', ')) + '"><i class="bi bi-bar-chart"></i> ' + (sel.visuals ? L('in ' + num(sel.visuals) + ' visual' + (sel.visuals > 1 ? 's' : '') + ' on ' + num(sel.pages.length) + ' page' + (sel.pages.length > 1 ? 's' : ''), 'في ' + num(sel.visuals) + ' visual على ' + num(sel.pages.length) + ' صفحة') : (sel.refs ? L('in page or report filters', 'في فلاتر الصفحة أو التقرير') : L('in no visual', 'غير موجود في أي visual'))) + '</span><span title="' + L('How many levels of other measures sit under this one. 0 means it reads columns directly. Higher means more places a wrong number can come from.', 'عدد مستويات المقاييس الأخرى التي يعتمد عليها هذا المقياس. 0 يعني أنه يقرأ الأعمدة مباشرة، والرقم الأعلى يعني أماكن أكثر قد يأتي منها رقم خاطئ.') + '"><i class="bi bi-layers"></i> ' + (sel.depth ? L(num(sel.depth) + ' measure layer' + (sel.depth > 1 ? 's' : '') + ' below', num(sel.depth) + ' مستوى مقاييس تحته') : L('reads columns directly', 'يقرأ الأعمدة مباشرة')) + ' <i class="bi bi-info-circle mh-dim"></i></span></div>' +
        (sel.description ? '<p class="mh-note" dir="auto">' + esc(sel.description) + '</p>' : '') +
        (sel.pages.length ? '<div class="mh-pages" title="' + L('Pages that show this measure', 'الصفحات التي تعرض هذا المقياس') + '"><i class="bi bi-file-earmark-richtext"></i>' + sel.pages.map((pg, i) => '<span' + (i >= 6 ? ' hidden' : '') + ' title="' + esc(pg) + '">' + bdi(pg) + '</span>').join('') + (sel.pages.length > 6 ? '<button type="button" data-allpages>+' + num(sel.pages.length - 6) + ' ' + L('more', 'أخرى') + '</button>' : '') + '</div>' : '') +
        '<pre class="mh-dax">' + esc(sel.expr.trim()) + '</pre>' +
        '<span class="tg-label">' + L('Depends on', 'يعتمد على') + ' (' + num(sel.dependsOn.length) + ')</span><p class="mh-help">' + L('Measures, columns and tables this formula reads directly. Click a measure to open it.', 'المقاييس والأعمدة والجداول التي تقرأها هذه الصيغة مباشرة. اضغط على مقياس لفتحه.') + '</p><div class="mh-deps">' + (sel.dependsOn.map(chip).join('') || '<span class="mh-note">·</span>') + '</div>' +
        (sel.depth ? '<details class="mh-chain"><summary><i class="bi bi-diagram-3"></i> ' + L('Show the full chain', 'اعرض السلسلة كاملة') + '</summary><p class="mh-help">' + L('Every measure under this one, level by level. If a number looks wrong, check from the bottom up.', 'كل المقاييس تحت هذا المقياس مستوى بمستوى. إن بدا رقم خاطئًا فافحص من الأسفل للأعلى.') + '</p>' + chainTree(sel.name) + '</details>' : '') +
        '<span class="tg-label mt-3">' + L('Used by', 'يستخدمه') + ' (' + num(sel.usedBy.length) + ')</span><p class="mh-help">' + L('Measures, calculated columns and tables whose DAX reads this measure. Visuals are listed in the pages line above.', 'المقاييس والأعمدة والجداول المحسوبة التي تقرأ صيغتها هذا المقياس. الـ visuals مذكورة في سطر الصفحات بالأعلى.') + '</p><div class="mh-deps">' + (sel.usedBy.map(chip).join('') || '<span class="mh-note">' + L('No other measure uses it.', 'لا يستخدمه أي مقياس آخر.') + '</span>') + '</div>'
        : '<div class="mh-empty"><i class="bi bi-diagram-2"></i><p>' + L('Pick a measure to see its DAX, what it depends on and what uses it.', 'اختر مقياسًا لترى صيغة DAX وما يعتمد عليه وما يستخدمه.') + '</p></div>') + '</div></div></div>';
    const qi = $('mhQ');
    qi.oninput = () => { msQuery = qi.value; const pos = qi.selectionStart; tMeasures(); const n = $('mhQ'); n.focus(); n.setSelectionRange(pos, pos); };
    el.querySelectorAll('[data-mf]').forEach((b) => b.onclick = () => { msFilter = b.dataset.mf; tMeasures(); });
    const ap = el.querySelector('[data-allpages]'); if (ap) ap.onclick = () => { ap.parentElement.querySelectorAll('span[hidden]').forEach((x) => { x.hidden = false; }); ap.remove(); };
    el.querySelectorAll('[data-ms]').forEach((b) => b.onclick = () => { msOpen = b.dataset.ms; tMeasures(); if (window.innerWidth < 992) { const d = el.querySelector('.mh-mdetail'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    const on = el.querySelector('.mh-mrow.on'); if (on) on.scrollIntoView({ block: 'nearest' });
  }

  function tTables() {
    const el = $('mhTab');
    const modeL = (t) => (t.auto ? L('Auto date', 'تاريخ تلقائي') : t.isCalcTable ? L('DAX table', 'جدول DAX') : (t.mode === 'directLake' ? 'Direct Lake' : t.mode === 'directQuery' ? 'DirectQuery' : t.mode === 'dual' ? 'Dual' : 'Import'));
    el.innerHTML = '<div class="mh-panel"><div class="mh-tscroll"><table class="mh-table"><thead><tr><th>' + L('Table', 'الجدول') + '</th><th>' + L('Type', 'النوع') + '</th><th>' + L('Columns', 'الأعمدة') + '</th><th>' + L('Measures', 'المقاييس') + '</th>' + (R.meta.hasReport ? '<th>' + L('Unused columns', 'أعمدة غير مستخدمة') + '</th>' : '') + '</tr></thead><tbody>' +
      R.tables.filter((t) => !t.auto).map((t) => '<tr data-t="' + esc(t.name) + '"><td><b>' + bdi(t.name) + '</b>' + (t.hidden ? ' <i class="bi bi-eye-slash mh-dim"></i>' : '') + (t.markedDate ? ' <span class="mh-badge">' + L('date table', 'جدول تاريخ') + '</span>' : '') + (t.used === false ? ' <span class="mh-badge off">' + L('unused', 'غير مستخدم') + '</span>' : '') + '</td><td>' + modeL(t) + '</td><td>' + num(t.columns.length) + '</td><td>' + num(t.measures) + '</td>' + (R.meta.hasReport ? '<td>' + (() => { const u = t.columns.filter((c) => c.used === false).length; return u ? '<span class="mh-unum">' + num(u) + '</span>' : '0'; })() + '</td>' : '') + '</tr>' +
        '<tr class="mh-cols" hidden><td colspan="5"><div class="mh-tags">' + t.columns.map((c) => '<code class="' + (c.used === false ? 'off' : '') + (c.kind === 'calculated' ? ' calc' : '') + '" title="' + esc(c.dataType + (c.kind === 'calculated' ? ' · calculated' : '') + (c.hidden ? ' · hidden' : '')) + '">' + esc(c.name) + ' <small>' + esc(c.dataType) + '</small></code>').join('') + '</div></td></tr>').join('') +
      '</tbody></table></div><p class="mh-note mt-2">' + L('Click a table to see its columns. Faded = unused, dashed = calculated column.', 'اضغط على جدول لرؤية أعمدته. الباهت = غير مستخدم، والمنقط = عمود محسوب.') + '</p></div>';
    el.querySelectorAll('tr[data-t]').forEach((tr) => tr.onclick = () => { const n = tr.nextElementSibling; n.hidden = !n.hidden; tr.classList.toggle('open', !n.hidden); });
  }

  function tRels() {
    const el = $('mhTab');
    el.innerHTML = '<div class="mh-panel"><div class="mh-tscroll"><table class="mh-table"><thead><tr><th>' + L('From (many side)', 'من (جهة many)') + '</th><th></th><th>' + L('To (one side)', 'إلى (جهة one)') + '</th><th>' + L('Cardinality', 'نوع العلاقة') + '</th><th>' + L('Filter', 'الفلترة') + '</th><th>' + L('Active', 'نشطة') + '</th></tr></thead><tbody>' +
      R.relationships.map((r) => {
        const card = (r.fromCard === 'many' ? '*' : '1') + ':' + (r.toCard === 'many' ? '*' : '1');
        return '<tr class="' + (r.active ? '' : 'mh-dimrow') + '"><td dir="ltr"><code>' + esc(r.fromTable) + '[' + esc(r.fromColumn) + ']</code></td><td>' + (r.cross === 'bothDirections' ? '<i class="bi bi-arrow-left-right text-warning"></i>' : '<i class="bi bi-arrow-left"></i>') + '</td><td dir="ltr"><code>' + esc(r.toTable) + '[' + esc(r.toColumn) + ']</code></td><td>' + (card === '*:*' ? '<span class="mh-badge off">*:*</span>' : card) + '</td><td>' + (r.cross === 'bothDirections' ? '<span class="text-warning">' + L('Both', 'اتجاهين') + '</span>' : L('Single', 'اتجاه واحد')) + '</td><td>' + (r.active ? '<i class="bi bi-check-lg text-success"></i>' : '<span class="mh-dim">' + L('inactive', 'غير نشطة') + '</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div></div>';
  }

  function tDocs() {
    const el = $('mhTab');
    el.innerHTML = '<div class="row g-4"><div class="col-md-4"><div class="mh-panel mh-doc"><i class="bi bi-filetype-html"></i><b>' + L('Full documentation', 'توثيق كامل') + '</b><p class="mh-note">' + L('One HTML page with the health score, every issue, all tables and columns, every measure with its DAX and dependencies, and the relationships. Opens in any browser and prints to PDF.', 'صفحة HTML واحدة فيها التقييم وكل المشاكل وكل الجداول والأعمدة وكل مقياس بصيغته واعتماداته والعلاقات. تفتح في أي متصفح ويمكن طباعتها PDF.') + '</p><button type="button" class="btn btn-accent" data-doc="html"><i class="bi bi-download"></i> ' + L('Download HTML', 'تحميل HTML') + '</button></div></div>' +
      '<div class="col-md-4"><div class="mh-panel mh-doc"><i class="bi bi-markdown"></i><b>Markdown</b><p class="mh-note">' + L('The same documentation as Markdown, ready for a Git repo, Azure DevOps wiki or Confluence.', 'نفس التوثيق بصيغة Markdown، جاهز لمستودع Git أو Azure DevOps wiki أو Confluence.') + '</p><button type="button" class="tg-btn2" data-doc="md"><i class="bi bi-download"></i> ' + L('Download .md', 'تحميل ‎.md') + '</button></div></div>' +
      '<div class="col-md-4"><div class="mh-panel mh-doc"><i class="bi bi-filetype-csv"></i><b>' + L('Measures list', 'قائمة المقاييس') + '</b><p class="mh-note">' + L('Every measure with folder, format, usage and DAX as a CSV for Excel.', 'كل المقاييس مع المجلد والتنسيق والاستخدام وصيغة DAX كملف CSV لـ Excel.') + '</p><button type="button" class="tg-btn2" data-doc="csv"><i class="bi bi-download"></i> ' + L('Download CSV', 'تحميل CSV') + '</button></div></div></div>';
    el.querySelectorAll('[data-doc]').forEach((b) => b.onclick = () => {
      const base = (R.meta.fileName || 'model').replace(/\.[^.]+$/, '');
      if (b.dataset.doc === 'html') download(base + ' - documentation.html', docHtml(), 'text/html');
      if (b.dataset.doc === 'md') download(base + ' - documentation.md', docMd(), 'text/markdown');
      if (b.dataset.doc === 'csv') {
        const rows = [['Measure', 'Table', 'Folder', 'Format', 'Used', 'Visuals', 'Pages', 'Depth', 'Description', 'DAX']].concat(R.measures.map((m) => [m.name, m.table, m.folder, m.formatString, m.used == null ? '' : m.used ? 'yes' : 'no', m.visuals, m.pages.join('; '), m.depth, m.description, m.expr.trim()]));
        download(base + ' - measures.csv', '﻿' + rows.map((r) => r.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n'), 'text/csv');
      }
      track('mh_download', { kind: b.dataset.doc });
    });
  }

  // ---------- documentation builders (always English, like the model) ----------
  function docHtml() {
    const s = R.stats, sc = score(), d = new Date().toISOString().slice(0, 10);
    const h = (x) => esc(x);
    const folders = {};
    R.measures.forEach((m) => { const k = m.folder || '(no folder)'; (folders[k] = folders[k] || []).push(m); });
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + h(R.meta.fileName) + ' - model documentation</title><style>' +
      'body{font:14px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827;max-width:1100px;margin:0 auto;padding:32px 20px;background:#fff}h1{font-size:26px;margin:0}h2{font-size:19px;margin:34px 0 10px;padding-bottom:6px;border-bottom:2px solid #e5e7eb}h3{font-size:15px;margin:20px 0 6px}' +
      '.sub{color:#6b7280}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:14px 0}.card{border:1px solid #e5e7eb;border-radius:10px;padding:10px 12px}.card b{display:block;font-size:22px}.card span{color:#6b7280;font-size:12px}' +
      'table{width:100%;border-collapse:collapse;margin:6px 0 14px;font-size:13px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #eef0f3;vertical-align:top}th{background:#f8fafc;font-weight:600}code,pre{font-family:ui-monospace,Consolas,monospace;font-size:12px}pre{background:#f8fafc;border:1px solid #eef0f3;border-radius:8px;padding:10px;white-space:pre-wrap;margin:6px 0}' +
      '.sev{display:inline-block;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700;text-transform:uppercase}.high{background:#fee2e2;color:#b91c1c}.medium{background:#fef3c7;color:#b45309}.low{background:#e0f2fe;color:#0369a1}.info{background:#f1f5f9;color:#475569}.no{color:#9ca3af}' +
      '.m{border:1px solid #eef0f3;border-radius:10px;padding:10px 14px;margin:10px 0;page-break-inside:avoid}.m .meta{color:#6b7280;font-size:12px}footer{margin-top:40px;color:#9ca3af;font-size:12px}@media print{h2{page-break-after:avoid}}</style></head><body>' +
      '<h1>' + h(R.meta.fileName) + '</h1><div class="sub">Model documentation and health check · ' + d + '</div>' +
      '<div class="grid"><div class="card"><b>' + sc.overall + '/100</b><span>Health score</span></div><div class="card"><b>' + sc.perf + '</b><span>Performance</span></div><div class="card"><b>' + sc.maint + '</b><span>Maintainability</span></div><div class="card"><b>' + sc.bp + '</b><span>Best practice</span></div>' +
      '<div class="card"><b>' + s.tables + '</b><span>Tables</span></div><div class="card"><b>' + s.columns + '</b><span>Columns</span></div><div class="card"><b>' + s.measures + '</b><span>Measures</span></div><div class="card"><b>' + s.relationships + '</b><span>Relationships</span></div>' + (s.pages != null ? '<div class="card"><b>' + s.pages + '</b><span>Report pages</span></div><div class="card"><b>' + s.visuals + '</b><span>Visuals</span></div>' : '') + '</div>' +
      (s.sources.length ? '<p><b>Data sources:</b> ' + s.sources.map((x) => h(x.name) + ' (' + x.count + ')').join(', ') + '</p>' : '') +
      '<h2>Health check findings</h2><table><tr><th>Severity</th><th>Area</th><th>Finding</th><th>Count</th><th>How to fix</th></tr>' + R.findings.map((f) => '<tr><td><span class="sev ' + f.sev + '">' + f.sev + '</span></td><td>' + CAT[f.cat].en + '</td><td>' + h(RULES()[f.id].en[0]) + '</td><td>' + f.items.length + '</td><td>' + h(RULES()[f.id].en[2]) + '</td></tr>').join('') + '</table>' +
      R.findings.map((f) => '<h3>' + h(RULES()[f.id].en[0]) + ' (' + f.items.length + ')</h3><div>' + f.items.map((i) => '<code>' + h(i.obj) + '</code>' + (i.detail ? ' <span class="no">' + h(i.detail) + '</span>' : '')).join(', ') + '</div>').join('') +
      '<h2>Tables</h2><table><tr><th>Table</th><th>Type</th><th>Columns</th><th>Measures</th><th>Description</th></tr>' + R.tables.filter((t) => !t.auto).map((t) => '<tr><td><b>' + h(t.name) + '</b>' + (t.hidden ? ' <span class="no">(hidden)</span>' : '') + '</td><td>' + (t.isCalcTable ? 'DAX' : h(t.mode)) + '</td><td>' + t.columns.length + '</td><td>' + t.measures + '</td><td>' + h(t.description) + '</td></tr>').join('') + '</table>' +
      R.tables.filter((t) => !t.auto).map((t) => '<h3>' + h(t.name) + '</h3><table><tr><th>Column</th><th>Type</th><th>Kind</th><th>Used</th><th>Notes</th></tr>' + t.columns.map((c) => '<tr><td>' + h(c.name) + '</td><td>' + h(c.dataType) + '</td><td>' + (c.kind === 'calculated' ? 'Calculated' : 'Data') + (c.hidden ? ', hidden' : '') + '</td><td>' + (c.used == null ? '' : c.used ? 'Yes' : '<span class="no">No</span>') + '</td><td>' + (c.sortBy ? 'Sorted by ' + h(c.sortBy) + '. ' : '') + h(c.description) + (c.expr ? '<pre>' + h(c.expr.trim()) + '</pre>' : '') + '</td></tr>').join('') + '</table>' + (t.calcExpr ? '<pre>' + h(t.calcExpr.trim()) + '</pre>' : '')).join('') +
      '<h2>Measures</h2>' + Object.keys(folders).sort().map((k) => '<h3>' + h(k) + ' (' + folders[k].length + ')</h3>' + folders[k].map((m) => '<div class="m"><b>[' + h(m.name) + ']</b> <span class="meta">' + (m.formatString ? 'Format ' + h(m.formatString) + ' · ' : '') + (m.used == null ? '' : m.used ? (m.visuals ? 'in ' + m.visuals + ' visuals on ' + m.pages.length + ' pages' : 'used by other measures or filters') : '<span class="no">unused</span>') + '</span>' + (m.description ? '<div>' + h(m.description) + '</div>' : '') + '<pre>' + h(m.expr.trim()) + '</pre>' + (m.dependsOn.length ? '<div class="meta">Depends on: ' + m.dependsOn.map((x) => x.type === 'measure' ? '[' + h(x.name) + ']' : x.type === 'column' ? h(x.table) + '[' + h(x.name) + ']' : h(x.name)).join(', ') + '</div>' : '') + '</div>').join('')).join('') +
      '<h2>Relationships</h2><table><tr><th>From</th><th>To</th><th>Cardinality</th><th>Filter direction</th><th>Active</th></tr>' + R.relationships.map((r) => '<tr><td>' + h(r.fromTable) + '[' + h(r.fromColumn) + ']</td><td>' + h(r.toTable) + '[' + h(r.toColumn) + ']</td><td>' + (r.fromCard === 'many' ? 'Many' : 'One') + ' to ' + (r.toCard === 'many' ? 'many' : 'one') + '</td><td>' + (r.cross === 'bothDirections' ? 'Both' : 'Single') + '</td><td>' + (r.active ? 'Yes' : 'No') + '</td></tr>').join('') + '</table>' +
      '<footer>Generated in the browser by the free Power BI Model Health Check at dataarcus.com/tools. The file was not uploaded anywhere.</footer></body></html>';
  }
  function docMd() {
    const s = R.stats, sc = score(), lines = [];
    const cell = (x) => String(x == null ? '' : x).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    lines.push('# ' + R.meta.fileName, '', 'Model documentation and health check, ' + new Date().toISOString().slice(0, 10), '');
    lines.push('**Health score: ' + sc.overall + '/100** (Performance ' + sc.perf + ', Maintainability ' + sc.maint + ', Best practice ' + sc.bp + ')', '');
    lines.push('| Tables | Columns | Measures | Relationships |' + (s.pages != null ? ' Pages | Visuals |' : ''), '|---|---|---|---|' + (s.pages != null ? '---|---|' : ''), '| ' + [s.tables, s.columns, s.measures, s.relationships].join(' | ') + ' |' + (s.pages != null ? ' ' + s.pages + ' | ' + s.visuals + ' |' : ''), '');
    lines.push('## Findings', '', '| Severity | Finding | Count | How to fix |', '|---|---|---|---|');
    R.findings.forEach((f) => lines.push('| ' + f.sev + ' | ' + cell(RULES()[f.id].en[0]) + ' | ' + f.items.length + ' | ' + cell(RULES()[f.id].en[2]) + ' |'));
    lines.push('', '## Tables', '');
    R.tables.filter((t) => !t.auto).forEach((t) => {
      lines.push('### ' + t.name, '', '| Column | Type | Kind | Used |', '|---|---|---|---|');
      t.columns.forEach((c) => lines.push('| ' + cell(c.name) + ' | ' + c.dataType + ' | ' + (c.kind === 'calculated' ? 'Calculated' : 'Data') + (c.hidden ? ', hidden' : '') + ' | ' + (c.used == null ? '' : c.used ? 'Yes' : 'No') + ' |'));
      lines.push('');
    });
    lines.push('## Measures', '');
    R.measures.slice().sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name)).forEach((m) => {
      lines.push('### ' + m.name, '', (m.folder ? 'Folder: ' + m.folder + '  ' : '') + (m.formatString ? 'Format: `' + m.formatString + '`  ' : '') + (m.used == null ? '' : m.used ? (m.visuals ? 'In ' + m.visuals + ' visuals on ' + m.pages.length + ' pages' : 'Used by other measures or filters') : 'Unused'), '');
      if (m.description) lines.push(m.description, '');
      lines.push('```dax', m.expr.trim(), '```', '');
    });
    lines.push('## Relationships', '', '| From | To | Cardinality | Filter | Active |', '|---|---|---|---|---|');
    R.relationships.forEach((r) => lines.push('| ' + cell(r.fromTable + '[' + r.fromColumn + ']') + ' | ' + cell(r.toTable + '[' + r.toColumn + ']') + ' | ' + (r.fromCard === 'many' ? 'Many' : 'One') + ':' + (r.toCard === 'many' ? 'Many' : 'One') + ' | ' + (r.cross === 'bothDirections' ? 'Both' : 'Single') + ' | ' + (r.active ? 'Yes' : 'No') + ' |'));
    lines.push('', '_Generated in the browser by the free Power BI Model Health Check at dataarcus.com/tools._');
    return lines.join('\n');
  }

  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function copy(txt) {
    const done = () => toast(L('Copied', 'تم النسخ'));
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => fallback());
    else fallback();
    function fallback() { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } t.remove(); }
  }
  let tt;
  function toast(msg) {
    let t = $('mhToast');
    if (!t) { t = document.createElement('div'); t.id = 'mhToast'; t.className = 'mh-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 1800);
  }

  new MutationObserver(() => render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
});
