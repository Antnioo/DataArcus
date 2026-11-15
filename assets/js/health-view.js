/*
 * DataArcus Power BI Model Health Check: the page's views (0.3.2 SP32, the split of model-health.js: the Codex split
 * map, B-280): the drop zone, the loading, error and partial-model panels, the result with its seven tabs (Issues and
 * its "Please confirm" questions, Fix plan, Unused, Measures, Tables, Relationships, Documentation). Interface:
 *   MHView.create(app, host) -> view    app: the page's #mhApp element (DOM out: inside it, and the "Copied" toast)
 *   host.state   the result and the person's selection, a plain object the page owns (nothing is hidden here):
 *                { result, prev, ignored, tab, filt: { cat }, msQuery, msFilter, msOpen, cardHide }; result: the
 *                worker's analysis (metadata only: names, DAX, descriptions; never data values) or null; prev: the
 *                last check of the same file { d, s } or null; ignored: a Set of rule ids. The view changes only the
 *                selection (tab, filt, ms*, cardHide, ignored; result = null for "Check another file")
 *   host.track(name, params): analytics (the page's); host.store { get(key, default), set(key, value) }: storage;
 *   host.dismissed { all() -> Set, add(key) }: the questions dismissed this session; host.saveIgnored();
 *   host.pick(file), host.sample(): a file chosen, the sample asked for; host.save(kind): a text download
 *   (health-downloads.js); host.scoreCard(): the score card's picture
 *   view.render(), view.loading(fileName), view.setStep(step), view.showError(code, message): what the page shows;
 *   view.score() -> { overall, perf, maint, bp } (ignored rules out); view.rehashAnswers(): the confirm answers held
 *   hashed; view.cardText(lines, rtl): the score card's text for screen readers; view.text { isAr, L, num, esc, rt,
 *   grade, RULES }: the language helpers and the rules, one place for the page and its score card
 * Reads the rules' texts (MHEngine), the Fix plan (health-fix-plan.js), the TMDL helper and the confirm memory
 * (confirm-memory.js); never the worker. Loaded before model-health.js on the tool pages. (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // the HTML escape: html-escape.js htmlEsc, its one home (0.3.2 DD2H; the page loads it first, Node requires it)
  const HE = typeof module !== 'undefined' && module.exports ? require('./html-escape.js') : root.DAHtmlEscape;
  // the toast: page-toast.js toast and boxToast, their one home (0.3.2 DD2W; the page loads it first, Node requires it)
  const PT = typeof module !== 'undefined' && module.exports ? require('./page-toast.js') : root.DAPageToast;
  // the categories, severities and the Fix plan's kinds: data, one copy for every step below
  const CAT = {
    perf: { en: 'Performance', ar: 'الأداء', icon: 'bi-lightning-charge' },
    maint: { en: 'Maintainability', ar: 'سهولة الصيانة', icon: 'bi-tools' },
    bp: { en: 'Best practice', ar: 'أفضل الممارسات', icon: 'bi-patch-check' }
  };
  const SEVL = { high: ['High', 'عالية'], medium: ['Medium', 'متوسطة'], low: ['Low', 'منخفضة'], info: ['Info', 'معلومة'] };
  const BPA_L = ['Microsoft Best Practice Analyzer rule', 'قاعدة Best Practice Analyzer من Microsoft'];
  const QUICK = new Set(['DATE_NOT_MARKED', 'MONTH_SORT', 'SUMMARIZE_KEYS', 'FK_VISIBLE', 'UNUSED_COL', 'UNUSED_MEASURE']);
  const EXPERT = new Set(['FILTER_TABLE', 'FILTER_MEASURE', 'BIDI', 'M2M', 'DEEP_CHAIN', 'LONG_MEASURE', 'CALC_COLS', 'STRING_KEYS', 'LONG_M', 'HARDCODED_PATH', 'NO_RLS']);
  // (0.3.2 FN1A) the view is built by named steps, each one part of the page; each step's code is the code it was
  // inside create, moved. v: the view's context (app, host, the state S, $) that each step adds its functions to.
  function create(app, host) {
    const S = host.state, $ = (id) => document.getElementById(id);
    const v = { app, host, S, $ };
    [textKit, confirmPart, panels, resultPart, issuesTab, listTabs, tmdlPart, fixTab, measuresTab, docsTab].forEach((step) => step(v));
    const { render, loading, setStep, showError, score, qRehash, cardText, isAr, L, num, esc, rt, grade, RULES } = v;
    return { render, loading, setStep, showError, score, rehashAnswers: qRehash, cardText,
      text: { isAr, L, num, esc, rt, grade, RULES } };
  }

  // the language helpers, the rules' texts and sources, copy and the toast, the score card's text
  function textKit(v) {
    const { S, $ } = v;
    const isAr = () => document.documentElement.lang === 'ar';
    const L = (en, ar) => (isAr() ? ar : en);
    const esc = HE.htmlEsc;
    const num = (n) => new Intl.NumberFormat(isAr() ? 'ar-u-nu-latn' : 'en-US').format(n);
    const bdi = (x) => '<bdi dir="ltr">' + esc(x) + '</bdi>';
    const RULES = () => (window.MHEngine && window.MHEngine.RULES) || {};
    const score = () => (window.MHEngine && window.MHEngine.scoreFrom ? window.MHEngine.scoreFrom(S.result.findings, S.ignored) : S.result.score);
    const grade = (s) => (s >= 85 ? [L('Excellent', 'ممتاز'), '#22c55e'] : s >= 70 ? [L('Good', 'جيد'), '#84cc16'] : s >= 50 ? [L('Needs work', 'يحتاج تحسين'), '#f59e0b'] : [L('At risk', 'في خطر'), '#ef4444']);
    const rt = (id) => { const r = RULES()[id]; return r ? (isAr() ? r.ar : r.en) : [id, '', '']; };
    // where a rule comes from (the engine's RULES[id].source): Microsoft Learn, a Best Practice Analyzer rule, or our own
    const srcOf = (id) => (RULES()[id] || {}).source || null;
    const srcHtml = (id) => {
      const s = srcOf(id); if (!s) return '';
      const says = esc(isAr() ? s.says.ar : s.says.en), ext = ' target="_blank" rel="noopener noreferrer"';
      const bpa = (rule) => '<a href="' + esc(window.MHEngine.BPA_URL) + '"' + ext + '>' + L(BPA_L[0], BPA_L[1]) + '</a> ' + bdi(rule);
      const head = s.kind === 'microsoft' ? '<a href="' + esc(s.url) + '"' + ext + ' title="' + esc(s.title) + '">' + L('Microsoft guidance', 'إرشادات Microsoft') + '</a>'
        : s.kind === 'bpa' ? bpa(s.title) : '<b>' + L('DataArcus rule', 'قاعدة من DataArcus') + '</b>';
      return '<p class="mh-src"><i class="bi ' + (s.kind === 'dataarcus' ? 'bi-person-check' : 'bi-book') + '"></i> ' + head + ': ' + says + (s.bpa ? ' (' + bpa(s.bpa) + ')' : '') + '</p>';
    };
    // (the same in English, for the CSV and the documentation: health-downloads.js, 0.3.2 SP24)
    function copy(txt) {
      const done = () => toast(L('Copied', 'تم النسخ'));
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, () => fallback());
      else fallback();
      function fallback() { const t = document.createElement('textarea'); t.value = txt; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } t.remove(); }
    }
    function toast(msg) { PT.toast(msg, { el: PT.boxToast('mhToast', 'mh-toast'), cls: 'show', ms: 1800 }); }
    // the score card's lines, listed for screen readers under the card's button
    function cardText(lines, rtl) {
      const list = $('mhCardText');
      if (list) { list.setAttribute('dir', rtl ? 'rtl' : 'ltr'); list.innerHTML = lines.map((t) => '<li>' + esc(t) + '</li>').join(''); }
    }
    Object.assign(v, { isAr, L, esc, num, bdi, RULES, score, grade, rt, srcHtml, copy, cardText });
  }

  function confirmPart(v) {
    const { host, S, isAr, L, esc, num, bdi } = v;
    // "Please confirm": the engine's questions about possible calculation mistakes (S.result.confirm), never findings and never in
    // the score. Each can be dismissed for this browser session
    // the page keeps the dismissed ones for this browser session
    const qDismissed = () => host.dismissed.all();
    const qKey = (c) => c.id + '|' + c.obj + '|' + c.evidence;
    // object names such as Sales[Amount] keep their left-to-right order inside an Arabic sentence
    const qText = (t) => String(t).split(/(\S+\[[^\]]+\])/).map((x, i) => (i % 2 ? bdi(x) : esc(x))).join('');
    // (B-148, 0.3) an answer is remembered in this browser only (confirm-memory.js: localStorage, per model fingerprint),
    // reused while the measure or relationship is unchanged; the question comes back when it changes. Hashes, the answer
    // and its date are stored, never a name or the DAX. (R5) An answer whose measure or relationship changed is kept, not
    // applied, until "Forget my answers": nothing is deleted without that click
    const qMem = () => {
      const M = window.DataArcusConfirmMemory;
      if (!M || !S.result || !S.result.rawTables) return null;
      const fp = M.fingerprint(S.result.rawTables);
      return { M, fp, a: M.apply(S.result.confirm || [], M.load(fp), S.result.rawTables) };
    };
    // (R5) answers stored before with names in plain text are held hashed from now on; none is dropped
    const qRehash = () => { const m = qMem(); if (m && m.M.kept(m.a).length) m.M.save(m.fp, m.M.kept(m.a)); };
    const qAnswerText = (a) => (a === 'intended' ? L('Intended', 'مقصود') : L('A mistake: still to fix', 'خطأ: لم يُصلح بعد'));
    const answeredHtml = (answered, stale) => !answered.length && !stale ? '' : '<div class="mh-qmem" id="mhAnswered"><div class="mh-qhead"><b>' + L('Your earlier answers on this model', 'إجاباتك السابقة على هذا النموذج') + '</b>' +
      '<button type="button" class="mh-copy" id="mhForget"><i class="bi bi-trash3"></i> ' + L('Forget my answers', 'انسَ إجاباتي') + '</button></div>' +
      '<p class="mh-note">' + L('Your answers stay in this browser only and are never sent. A question comes back when the measure or relationship it is about changes.', 'تبقى إجاباتك في هذا المتصفح فقط ولا تُرسل إلى أي مكان. يعود السؤال عندما يتغير المقياس أو العلاقة التي يخصها.') + '</p>' +
      (answered.length ? '<ul>' + answered.map((x) => '<li><code>' + esc(x.question.obj) + '</code> · ' + qAnswerText(x.record.answer) + ' (' + L('unchanged since', 'لم يتغير منذ ذلك الحين') + ')</li>').join('') + '</ul>' : '') +
      (stale ? '<p class="mh-note" id="mhStale">' + L(num(stale) + ' earlier ' + (stale === 1 ? 'answer no longer applies' : 'answers no longer apply') + ': what ' + (stale === 1 ? 'it was' : 'they were') + ' about changed, so ' + (stale === 1 ? 'its question is' : 'their questions are') + ' asked again. ' + (stale === 1 ? 'It stays' : 'They stay') + ' in this browser until you click Forget my answers.',
        'إجابات سابقة لم تعد تنطبق: ' + num(stale) + '. تغيّر ما كانت عنه، لذلك تُطرح أسئلتها من جديد. تبقى في هذا المتصفح حتى تنقر «انسَ إجاباتي».') + '</p>' : '') + '</div>';
    const confirmHtml = () => {
      const mem = qMem(), gone = qDismissed(), list = (mem ? mem.a.ask : S.result.confirm || []).filter((c) => !gone.has(qKey(c))), answered = mem ? mem.a.answered : [], stale = mem ? mem.a.stale.length : 0;
      if (!list.length && !answered.length && !stale) return '';
      return '<section class="mh-confirm" id="mhConfirm"><h3 class="mh-h"><i class="bi bi-question-circle"></i> ' + L('Please confirm', 'يرجى التأكيد') + ' <span class="mh-count">' + num(list.length) + '</span></h3>' +
        '<p class="mh-note">' + L('The check asks about some common calculation mistakes. These are questions, not findings, and they don\'t affect the score: the check reads the model\'s structure and DAX, not your numbers, so it can\'t tell whether a result is wrong.',
          'يسأل الفحص عن بعض أخطاء الحساب الشائعة. هذه أسئلة وليست مشاكل، ولا تؤثر في التقييم: يقرأ الفحص بنية النموذج وصيغ <bdi>DAX</bdi> لا أرقامك، لذلك لا يستطيع أن يعرف إن كانت النتيجة خاطئة.') + '</p>' +
        list.map((c) => '<div class="mh-q" data-q="' + esc(qKey(c)) + '"' + (c.signature ? ' data-qsig="' + esc(c.signature) + '"' : '') + '><div class="mh-qhead"><code>' + esc(c.obj) + '</code><span class="mh-qbtns">' +
          (mem ? '<button type="button" class="mh-copy" data-qanswer="intended"><i class="bi bi-check2"></i> ' + L('Yes, intended', 'نعم، مقصود') + '</button><button type="button" class="mh-copy" data-qanswer="mistake"><i class="bi bi-exclamation-circle"></i> ' + L('No, a mistake', 'لا، خطأ') + '</button>' : '') +
          '<button type="button" class="mh-copy" data-qdismiss><i class="bi bi-x-lg"></i> ' + L('Dismiss', 'إخفاء') + '</button></span></div>' +
          '<p>' + qText(isAr() ? c.message.ar : c.message.en) + '</p>' +
          (c.evidence ? '<pre class="mh-dax mh-qdax" dir="ltr"><code>' + esc(c.evidence) + '</code></pre>'
            : c.relationship ? '<p class="mh-qrel">' + L('Relationship', 'العلاقة') + ': ' + bdi(c.obj) + ' · ' + L('unused column', 'العمود غير المستخدم') + ': ' + bdi(c.relationship.fromTable + '[' + c.relationship.candidateColumn + ']') + '</p>' : '') + '</div>').join('') + answeredHtml(answered, stale) + '</section>';
    };
    Object.assign(v, { qMem, qRehash, confirmHtml });
  }

  // loading, a step, an error, and the views: the drop zone, a model read in part, the result
  function panels(v) {
    const { app, host, S, $, isAr, L, esc, num, bdi, RULES } = v;
    const renderResult = () => v.renderResult(); // drawn by a later step
    function loading(name) {
      app.innerHTML = '<div class="mh-panel mh-loading"><div class="mh-spin"></div><div><b>' + esc(name) + '</b><div class="mh-note" id="mhStep">' + L('Reading the file in your browser…', 'قراءة الملف داخل متصفحك…') + '</div></div></div>';
    }
    function setStep(step) {
      const el = $('mhStep'); if (!el) return;
      el.textContent = { model: L('Reading the model…', 'قراءة النموذج…'), report: L('Reading report pages and visuals…', 'قراءة صفحات التقرير والـ visuals…'), analyze: L('Checking the rules…', 'فحص القواعد…') }[step] || '';
    }
    function showError(code, msg) {
      const T = {
        PBIX: [L('This is a .pbix file', 'هذا ملف ‎.pbix'), L('A .pbix holds your data in a compressed format that browsers cannot read. Export a template instead: in Power BI Desktop, File > Export > Power BI template. It takes a few seconds and contains no data.', 'ملف pbix يحتوي بياناتك بصيغة مضغوطة لا يقرأها المتصفح. صدّر قالبًا بدلًا منه: في Power BI Desktop اختر File > Export > Power BI template. يستغرق ثوانٍ ولا يحتوي أي بيانات.')],
        NO_MODEL: [L('No model found in this file', 'لم يتم العثور على نموذج في هذا الملف'), L('Use a .pbit (File > Export > Power BI template), a model.bim, or a zipped PBIP project folder.', 'استخدم ملف .pbit أو model.bim أو مجلد مشروع PBIP مضغوط.')],
        NOT_ZIP: [L('Could not open this file', 'تعذر فتح الملف'), L('It does not look like a Power BI template. Try exporting it again.', 'لا يبدو كقالب Power BI. جرّب تصديره مرة أخرى.')],
        ZIP_LIMIT: [L('This file unpacks to more than the check reads', 'هذا الملف يتجاوز عند فك ضغطه الحجم الذي يقرؤه الفحص'), L('A part of it would unpack to more than 64 MB (the model) or 32 MB (a report file), or to more than it says. A Power BI template without data is usually under 20 MB: export a fresh .pbit from Power BI Desktop and try again. Nothing was uploaded.', 'جزء منه يتجاوز عند فك ضغطه 64 ميجابايت (النموذج) أو 32 ميجابايت (ملف تقرير)، أو أكبر مما يذكره الملف. القالب بدون بيانات عادة أقل من 20 ميجابايت: صدّر ملف ‎.pbit‎ جديدًا من Power BI Desktop وحاول مرة أخرى. لم يُرفع أي شيء.')],
        TOO_BIG: [L('This file is very large', 'الملف كبير جدًا'), L('A template without data is usually under 20 MB. If this is a .pbix, export a .pbit instead.', 'القالب بدون بيانات عادة أقل من 20 ميجابايت. إن كان ملف pbix فصدّر .pbit بدلًا منه.')],
        WORKER: [L('Your browser blocked the analysis', 'المتصفح منع التحليل'), L('Please open the page from dataarcus.com in an up-to-date Chrome, Edge, Firefox or Safari.', 'افتح الصفحة من dataarcus.com في متصفح حديث.')]
      }[code] || [L('Something went wrong', 'حدث خطأ'), L('The file could not be analysed. If it opens in Power BI Desktop, try exporting a fresh .pbit.', 'تعذر تحليل الملف. إن كان يفتح في Power BI Desktop فجرّب تصدير .pbit جديد.')];
      host.track('mh_error', { code });
      app.innerHTML = '<div class="mh-panel mh-error"><i class="bi bi-exclamation-triangle"></i><div><b>' + T[0] + '</b><p>' + T[1] + '</p>' + (msg && code === 'PARSE' ? '<code>' + esc(msg).slice(0, 200) + '</code>' : '') + '<button type="button" class="tg-btn2 btn-sm mt-2" id="mhAgain">' + L('Try another file', 'جرّب ملفًا آخر') + '</button></div></div>';
      $('mhAgain').onclick = () => { S.result = null; render(); };
    }
    // ---------- views ----------
    function render() {
      if (!S.result) return renderDrop();
      if (S.result.unreadable) return renderUnreadable();
      renderResult();
    }
    // (AU47) a model read only in part: the files that could not be read and why, no score, no score card or share, and
    // the findings the check could still make, marked partial
    function renderUnreadable() {
      const fs0 = S.result.findings || [], rule = (f) => (RULES()[f.id] || {})[isAr() ? 'ar' : 'en'] || [f.id];
      app.innerHTML =
        '<div class="mh-filebar"><span><i class="bi bi-file-earmark-bar-graph"></i> <b>' + bdi(S.result.meta.fileName) + '</b></span><button type="button" class="tg-btn2 btn-sm" id="mhNew"><i class="bi bi-arrow-repeat"></i> ' + L('Check another file', 'افحص ملفًا آخر') + '</button></div>' +
        '<div class="mh-panel mh-error mh-unreadable"><i class="bi bi-exclamation-triangle"></i><div><b>' + L('No score: part of this model could not be read', 'لا توجد نتيجة: تعذّرت قراءة جزء من هذا النموذج') + '</b>' +
        '<p>' + esc(L(S.result.unreadable.en, S.result.unreadable.ar)) + '</p>' +
        '<p class="mh-note">' + L('A score of the part that was read would be wrong: a model Power BI Desktop cannot open could score higher than the whole model.', 'نتيجة الجزء المقروء ستكون خاطئة: قد يحصل نموذج لا يفتحه Power BI Desktop على نتيجة أعلى من النموذج كاملًا.') + '</p></div></div>' +
        '<div class="mh-panel mt-3"><span class="tg-label">' + L('Partial findings: what the check could still find in the part that was read', 'ملاحظات جزئية: ما وجده الفحص في الجزء المقروء فقط') + '</span>' +
        (fs0.length ? '<ul class="mh-partial">' + fs0.map((f) => '<li>' + esc(rule(f)[0]) + ' <small>(' + num(f.items.length) + ')</small></li>').join('') + '</ul>' : '<p class="mh-note">' + L('No findings in the part that was read.', 'لا توجد ملاحظات في الجزء المقروء.') + '</p>') + '</div>';
      $('mhNew').onclick = () => { S.result = null; render(); };
    }
    function renderDrop() {
      app.innerHTML =
        '<div class="mh-drop" id="mhDrop" tabindex="0" role="button" aria-label="' + L('Choose a Power BI file', 'اختر ملف Power BI') + '">' +
        '<i class="bi bi-cloud-arrow-up"></i><b>' + L('Drop your .pbit here', 'أسقط ملف .pbit هنا') + '</b>' +
        '<span>' + L('or click to choose a file', 'أو اضغط لاختيار ملف') + '</span>' +
        '<small>' + L('Also works with model.bim or a zipped PBIP project (TMDL or model.bim)', 'يعمل أيضًا مع model.bim أو مشروع PBIP مضغوط (TMDL أو model.bim)') + '</small>' +
        '<input type="file" id="mhFile" accept=".pbit,.bim,.json,.zip" hidden></div>' +
        '<div class="mh-under"><button type="button" class="tg-btn2 btn-sm" id="mhSample"><i class="bi bi-play-circle"></i> ' + L('Try it with a sample model', 'جرّب على نموذج تجريبي') + '</button>' +
        '<span class="mh-note"><i class="bi bi-shield-lock"></i> ' + L('Your file never leaves your computer. It is read and checked inside this browser tab.', 'ملفك لا يغادر جهازك أبدًا. تتم قراءته وفحصه داخل هذه الصفحة فقط.') + '</span></div>' +
        '<div class="mh-how"><b>' + L('How to get a .pbit (10 seconds)', 'كيف تحصل على ملف .pbit (10 ثوانٍ)') + '</b><ol><li>' + L('Open your report in Power BI Desktop.', 'افتح التقرير في Power BI Desktop.') + '</li><li>' + L('File > Export > Power BI template.', 'File > Export > Power BI template.') + '</li><li>' + L('Save it and drop it above. A template has your model and report layout, but no data.', 'احفظه وأسقطه في الأعلى. القالب يحتوي النموذج وتصميم التقرير بدون أي بيانات.') + '</li></ol></div>';
      const drop = $('mhDrop'), inp = $('mhFile');
      drop.onclick = () => inp.click();
      drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } };
      inp.onchange = () => host.pick(inp.files[0]);
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', (e) => host.pick(e.dataTransfer.files[0]));
      $('mhSample').onclick = () => host.sample();
    }
    Object.assign(v, { loading, setStep, showError, render });
  }

  // the result: the score ring and bars, the file bar, the score card, the tabs (each tab is drawn by its own step)
  function resultPart(v) {
    const { app, host, S, $, isAr, L, num, bdi, esc, score, grade, rt, render } = v;
    const ring = (score, size) => {
      const [g, col] = grade(score), r = 44, c = 2 * Math.PI * r;
      return '<div class="mh-ring" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="' + r + '" class="bg"/><circle cx="50" cy="50" r="' + r + '" class="fg" style="stroke:' + col + ';stroke-dasharray:' + c + ';stroke-dashoffset:' + c * (1 - score / 100) + '"/></svg><div><b>' + score + '</b><span>' + g + '</span></div></div>';
    };
    const bar = (v, col) => '<div class="mh-bar"><span style="width:' + Math.max(2, v) + '%;background:' + (col || grade(v)[1]) + '"></span></div>';

    function renderResult() {
      const s = S.result.stats, sc = score(), rep = S.result.meta.hasReport;
      const counts = { issues: S.result.findings.length };
      const pill = (icon, v, lab) => '<span class="mh-pill"><i class="bi ' + icon + '"></i><b>' + v + '</b> ' + lab + '</span>';
      const quick = S.result.findings.filter((f) => f.penalty > 0 && !S.ignored.has(f.id)).slice(0, 3);
      // points gained by fixing one check: the real change on the score curve, not the raw penalty
      const gain = (f) => (window.MHEngine && window.MHEngine.scoreFrom ? window.MHEngine.scoreFrom(S.result.findings, new Set(Array.from(S.ignored).concat(f.id))).overall - sc.overall : 0);
      app.innerHTML =
        '<div class="mh-filebar"><span><i class="bi bi-file-earmark-bar-graph"></i> <b>' + bdi(S.result.meta.fileName) + '</b> · ' + L('checked in ', 'تم الفحص في ') + (S.result.meta.ms < 100 ? L('under 0.1 s', 'أقل من 0.1 ث') : (S.result.meta.ms / 1000).toFixed(1) + L(' s', ' ث')) + '</span><button type="button" class="tg-btn2 btn-sm" id="mhNew"><i class="bi bi-arrow-repeat"></i> ' + L('Check another file', 'افحص ملفًا آخر') + '</button></div>' +
        // (AU1, AUD-068) a zip with more than one model: which was read and which not, before the score
        (S.result.models ? '<div class="mh-panel mh-note mh-models mb-3"><i class="bi bi-info-circle"></i> ' + esc(L(S.result.models.en, S.result.models.ar)) + '</div>' : '') +
        '<div class="row g-4">' +
        '<div class="col-lg-4"><div class="mh-panel mh-scorecard text-center">' + ring(sc.overall, 170) +
        (S.prev ? (() => { const dlt = sc.overall - S.prev.s; return '<div class="mh-delta ' + (dlt > 0 ? 'up' : dlt < 0 ? 'down' : '') + '">' + (dlt > 0 ? '▲ +' + dlt : dlt < 0 ? '▼ ' + dlt : '=') + ' ' + L('since your last check (' + S.prev.d + ')', 'منذ آخر فحص (' + S.prev.d + ')') + '</div>'; })() : '') +
        (S.ignored.size && S.result.findings.some((f) => S.ignored.has(f.id)) ? '<div class="mh-note mt-1">' + L(num(S.result.findings.filter((f) => S.ignored.has(f.id)).length) + ' check(s) ignored', 'تم تجاهل ' + num(S.result.findings.filter((f) => S.ignored.has(f.id)).length) + ' فحص') + '</div>' : '') +
        '<div class="mh-cats">' + Object.keys(CAT).map((k) => '<div><span><i class="bi ' + CAT[k].icon + '"></i> ' + L(CAT[k].en, CAT[k].ar) + '</span><b>' + sc[k] + '</b>' + bar(sc[k]) + '</div>').join('') + '</div>' +
        '<button type="button" class="mh-share" id="mhShare"><i class="bi bi-linkedin"></i> ' + L('Share my score', 'شارك نتيجتي') + '</button></div></div>' +
        '<div class="col-lg-8"><div class="mh-panel"><div class="mh-pills">' +
        pill('bi-table', num(s.tables), L('tables', 'جداول')) + pill('bi-layout-three-columns', num(s.columns), L('columns', 'أعمدة')) + pill('bi-calculator', num(s.measures), L('measures', 'مقاييس')) +
        pill('bi-diagram-3', num(s.relationships), L('relationships', 'علاقات')) + (rep ? pill('bi-file-earmark-richtext', num(s.pages), L('pages', 'صفحات')) + pill('bi-bar-chart', num(s.visuals), L('visuals', 'مرئيات')) : '') +
        '</div>' +
        (rep ? '<div class="mh-unusedsum"><div><b>' + num(s.unusedColumns) + '</b><span>' + L('columns nobody uses', 'عمود غير مستخدم') + '</span></div><div><b>' + num(s.unusedMeasures) + '</b><span>' + L('measures nobody uses', 'مقياس غير مستخدم') + '</span></div><div><b>' + num(s.calcColumns) + '</b><span>' + L('calculated columns', 'عمود محسوب') + '</span></div></div>'
          : '<div class="mh-warn"><i class="bi bi-info-circle"></i> ' + L('This file has no report pages, so unused columns and measures could not be checked. Use a .pbit to include them.', 'الملف لا يحتوي صفحات تقرير، لذلك لم يتم فحص الأعمدة والمقاييس غير المستخدمة. استخدم ملف .pbit لتضمينها.') + '</div>') +
        (quick.length ? '<span class="tg-label mt-3">' + L('Fix these first', 'ابدأ بإصلاح هذه') + '</span><div class="mh-quick">' + quick.map((f) => '<button type="button" data-jump="' + f.id + '"><span class="mh-sev cap-pill ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span><span>' + rt(f.id)[0] + ' <small>(' + num(f.items.length) + ')</small></span>' + (gain(f) > 0 ? '<b title="' + L('Points added to the overall score', 'نقاط تضاف للتقييم العام') + '">+' + num(gain(f)) + '</b>' : '') + '</button>').join('') + '</div>' : '') +
        '</div></div></div>' +
        '<div class="mh-tabs" role="tablist">' + [['issues', L('Issues', 'المشاكل'), counts.issues], ['fix', L('Fix plan', 'خطة الإصلاح'), null], ['unused', L('Unused', 'غير المستخدم'), rep ? s.unusedColumns + s.unusedMeasures : null], ['measures', L('Measures', 'المقاييس'), s.measures], ['tables', L('Tables', 'الجداول'), s.tables], ['rels', L('Relationships', 'العلاقات'), s.relationships], ['docs', L('Documentation', 'التوثيق'), null]]
          .map((t) => '<button type="button" role="tab" data-tab="' + t[0] + '" class="' + (S.tab === t[0] ? 'on' : '') + '" aria-selected="' + (S.tab === t[0]) + '">' + t[1] + (t[2] != null ? ' <small>' + num(t[2]) + '</small>' : '') + '</button>').join('') + '</div>' +
        '<div id="mhTab"></div>';
      $('mhNew').onclick = () => { S.result = null; render(); };
      $('mhShare').onclick = () => {
        host.track('mh_share', { score: sc.overall });
        window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent('https://dataarcus.com/tools/power-bi-model-health-check.html?utm_source=linkedin&utm_medium=social&utm_campaign=mh_share'), '_blank', 'noopener');
      };
      app.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { S.tab = b.dataset.tab; host.track('mh_tab', { tab: S.tab }); renderResult(); });
      app.querySelectorAll('[data-jump]').forEach((b) => b.onclick = () => { S.tab = 'issues'; S.filt.cat = 'all'; renderResult(); const el = document.querySelector('[data-rule="' + b.dataset.jump + '"]'); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      ({ issues: v.tIssues, fix: v.tFix, unused: v.tUnused, measures: v.tMeasures, tables: v.tTables, rels: v.tRels, docs: v.tDocs })[S.tab]();
    }
    Object.assign(v, { renderResult });
  }

  function issuesTab(v) {
    const { host, S, $, isAr, L, esc, num, bdi, RULES, score, rt, srcHtml, qMem, confirmHtml, renderResult } = v;
    // an item's own advice (a rule's variants, such as FILTER_TABLE's VAR), in the page's language; else its detail
    const variantText = (v) => { const r = Object.values(RULES()).find((x) => x.variants && x.variants[v]); return r ? (isAr() ? r.variants[v].ar : r.variants[v].en) : ''; };
    const itemList = (items, limit) => {
      const lim = limit || 25;
      return '<ul class="mh-items">' + items.slice(0, lim).map((i) => { const d = (i.variant && variantText(i.variant)) || i.detail;
        // DAX inside the advice keeps its left-to-right order in Arabic
        const k = d ? d.indexOf('VAR ') : -1, html = k < 0 ? esc(d) : esc(d.slice(0, k)) + bdi(d.slice(k).replace(/\.$/, '')) + (/\.$/.test(d) ? '.' : '');
        return '<li><code>' + esc(i.obj) + '</code>' + (d ? ' <small>' + html + '</small>' : '') + '</li>'; }).join('') + '</ul>' +
        (items.length > lim ? '<button type="button" class="mh-more" data-more>' + L('Show all ' + num(items.length), 'عرض الكل (' + num(items.length) + ')') + '</button>' : '');
    };

    function tIssues() {
      const el = $('mhTab');
      const list = S.result.findings.filter((f) => S.filt.cat === 'all' || f.cat === S.filt.cat);
      el.innerHTML = '<div class="mh-chips">' + [['all', L('All', 'الكل')]].concat(Object.keys(CAT).map((k) => [k, L(CAT[k].en, CAT[k].ar)]))
        .map((c) => '<button type="button" class="tg-preset' + (S.filt.cat === c[0] ? ' active' : '') + '" data-cat="' + c[0] + '">' + c[1] + ' <small>' + num(c[0] === 'all' ? S.result.findings.length : S.result.findings.filter((f) => f.cat === c[0]).length) + '</small></button>').join('') +
        '<button type="button" class="tg-btn2 btn-sm ms-auto" id="mhCsv"><i class="bi bi-download"></i> CSV</button></div>' +
        (list.length ? list.map((f) => {
          const [title, why, fix] = rt(f.id);
          const ign = S.ignored.has(f.id);
          const kind = QUICK.has(f.id) ? 'quick' : EXPERT.has(f.id) ? 'expert' : '';
          const badge = kind === 'quick' ? '<span class="mh-kind quick cap-pill" title="' + L('The Fix plan tab has a ready script or step for this', 'تبويب خطة الإصلاح فيه سكربت أو خطوة جاهزة لهذا') + '"><i class="bi bi-lightning-charge-fill"></i> ' + L('Quick fix', 'إصلاح سريع') + '</span>' : kind === 'expert' ? '<span class="mh-kind expert cap-pill" title="' + L('Needs design decisions and testing, not a script', 'يحتاج قرارات تصميم واختبار وليس سكربتًا') + '"><i class="bi bi-person-gear"></i> ' + L('Expert', 'خبير') + '</span>' : '';
          const extra = kind === 'quick' ? '<button type="button" class="tg-btn2 btn-sm mt-1 mb-2" data-gofix><i class="bi bi-list-check"></i> ' + L('Open the fix plan', 'افتح خطة الإصلاح') + '</button>'
            : kind === 'expert' ? '<div class="mh-expert"><i class="bi bi-person-gear"></i><div><b>' + L('Want this fixed for you?', 'تريد من يصلحها لك؟') + '</b><span>' + L('This one needs design decisions and testing, not just a script. DataArcus reviews and fixes models like this.', 'هذه تحتاج قرارات تصميم واختبار وليس مجرد سكربت. DataArcus تراجع وتصلح نماذج كهذه.') + '</span></div><a href="/#contact" class="btn btn-accent btn-sm" data-expert="' + f.id + '">' + L('Book a free call', 'احجز مكالمة مجانية') + '</a></div>' : '';
          return '<details class="mh-issue' + (ign ? ' ignored' : '') + '" data-rule="' + f.id + '"><summary><span class="mh-sev cap-pill ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span><b>' + title + '</b>' + badge + '<span class="mh-count">' + num(f.items.length) + '</span>' + (f.penalty ? '<span class="mh-pen">−' + f.penalty + '</span>' : '') + '<i class="bi bi-chevron-down"></i></summary>' +
            '<div class="mh-ibody"><p><b>' + L('Why it matters', 'لماذا يهم') + ':</b> ' + why + '</p><p class="mh-fix"><i class="bi bi-wrench-adjustable"></i> <b>' + L('How to fix', 'طريقة الإصلاح') + ':</b> ' + fix + '</p>' + srcHtml(f.id) + extra +
            '<div class="mh-cat"><i class="bi ' + CAT[f.cat].icon + '"></i> ' + L(CAT[f.cat].en, CAT[f.cat].ar) + (f.share != null ? ' · ' + L(f.share + '% of objects', f.share + '% من العناصر') : '') + '<button type="button" class="mh-ign" data-ign="' + f.id + '">' + (ign ? '<i class="bi bi-eye"></i> ' + L('Count it again', 'احسبه مرة أخرى') : '<i class="bi bi-eye-slash"></i> ' + L('Ignore this check', 'تجاهل هذا الفحص')) + '</button></div>' + itemList(f.items) + '</div></details>';
        }).join('') : '<div class="mh-panel mh-note">' + L('No issues in this group. Nice work.', 'لا توجد مشاكل في هذه المجموعة. عمل ممتاز.') + '</div>') + confirmHtml();
      el.querySelectorAll('[data-qdismiss]').forEach((b) => b.onclick = () => {
        host.dismissed.add(b.closest('.mh-q').dataset.q);
        const q = b.closest('.mh-q'), sec = q.closest('.mh-confirm'); q.remove();
        if (sec && !sec.querySelector('.mh-q')) sec.remove(); else if (sec) sec.querySelector('.mh-count').textContent = num(sec.querySelectorAll('.mh-q').length);
      });
      // (B-148) an answer: recorded in this browser, the question moves to "Your earlier answers"
      el.querySelectorAll('[data-qanswer]').forEach((b) => b.onclick = () => {
        const m = qMem(), sig = b.closest('.mh-q').dataset.qsig, q = m && m.a.ask.find((c) => c.signature === sig);
        if (!q) return;
        m.M.save(m.fp, m.M.kept(m.a).concat(m.M.record(q, b.dataset.qanswer, S.result.rawTables)));
        tIssues();
      });
      const fg = el.querySelector('#mhForget');
      if (fg) fg.onclick = () => { window.DataArcusConfirmMemory.forget(); tIssues(); };
      el.querySelectorAll('[data-cat]').forEach((b) => b.onclick = () => { S.filt.cat = b.dataset.cat; tIssues(); });
      el.querySelectorAll('[data-gofix]').forEach((b) => b.onclick = () => { S.tab = 'fix'; renderResult(); const t = document.getElementById('mhTab'); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
      el.querySelectorAll('[data-expert]').forEach((a) => a.addEventListener('click', () => host.track('mh_expert_click', { rule: a.dataset.expert, score: score().overall })));
      el.querySelectorAll('.mh-issue').forEach((d) => d.addEventListener('toggle', () => { if (d.open) host.track('mh_issue_open', { rule: d.dataset.rule }); }));
      el.querySelectorAll('[data-ign]').forEach((b) => b.onclick = (e) => {
        e.preventDefault(); const id = b.dataset.ign;
        if (S.ignored.has(id)) S.ignored.delete(id); else S.ignored.add(id);
        host.saveIgnored(); host.track('mh_ignore', { rule: id, on: S.ignored.has(id) });
        const y = window.scrollY; renderResult(); const d = document.querySelector('[data-rule="' + id + '"]'); if (d) d.open = true; window.scrollTo(0, y);
      });
      el.querySelectorAll('[data-more]').forEach((b) => b.onclick = () => { const d = b.closest('.mh-issue'); const f = S.result.findings.find((x) => x.id === d.dataset.rule); b.previousElementSibling.outerHTML = itemList(f.items, 100000).replace(/<button[\s\S]*$/, ''); b.remove(); });
      $('mhCsv').onclick = () => {
        host.save('findings-csv');
        host.track('mh_download', { kind: 'csv' });
      };
    }
    Object.assign(v, { tIssues });
  }

  // the Unused, Tables and Relationships tabs
  function listTabs(v) {
    const { host, S, $, L, esc, num, bdi, copy, renderResult } = v;
    function tUnused() {
      const el = $('mhTab');
      if (!S.result.meta.hasReport) { el.innerHTML = '<div class="mh-panel mh-note">' + L('Unused items need the report pages. Use a .pbit file.', 'فحص العناصر غير المستخدمة يحتاج صفحات التقرير. استخدم ملف .pbit.') + '</div>'; return; }
      const cols = [], tablesUnused = [];
      S.result.tables.filter((t) => !t.auto).forEach((t) => {
        const u = t.columns.filter((c) => c.used === false);
        if (u.length) cols.push({ t, u });
        if (t.used === false) tablesUnused.push(t);
      });
      const ms = S.result.measures.filter((m) => m.used === false);
      const byFolder = {};
      ms.forEach((m) => { const k = m.folder || L('(no folder)', '(بدون مجلد)'); (byFolder[k] = byFolder[k] || []).push(m); });
      el.innerHTML = '<div class="mh-panel mh-caution"><i class="bi bi-info-circle"></i> ' + L('"Unused" means not used by any visual, filter, measure, relationship, sort or security rule in this file. If other reports connect to the same model, check them before deleting.', '"غير مستخدم" تعني غير مستخدم في أي visual أو فلتر أو مقياس أو علاقة أو ترتيب أو قاعدة أمان في هذا الملف. إن كانت تقارير أخرى متصلة بنفس النموذج فراجعها قبل الحذف.') + '</div>' +
        '<div class="row g-4 mt-1"><div class="col-lg-6"><div class="mh-panel"><div class="mh-h"><b>' + L('Columns', 'الأعمدة') + '</b> <span class="mh-count">' + num(cols.reduce((a, x) => a + x.u.length, 0)) + '</span><button type="button" class="mh-copy ms-auto" data-copy="cols"><i class="bi bi-clipboard"></i> ' + L('Copy list', 'نسخ القائمة') + '</button></div>' +
        (tablesUnused.length ? '<div class="mh-tunused"><b>' + L('Whole tables unused', 'جداول غير مستخدمة بالكامل') + ':</b> ' + tablesUnused.map((t) => '<code>' + esc(t.name) + '</code>').join(' ') + '</div>' : '') +
        cols.map((x) => '<div class="mh-group"><div class="mh-gh">' + bdi(x.t.name) + ' <small>' + num(x.u.length) + ' / ' + num(x.t.columns.length) + '</small></div><div class="mh-tags">' + x.u.map((c) => '<code' + (c.kind === 'calculated' ? ' class="calc" title="' + L('Calculated column', 'عمود محسوب') + '"' : '') + '>' + esc(c.name) + '</code>').join('') + '</div></div>').join('') + '</div></div>' +
        '<div class="col-lg-6"><div class="mh-panel"><div class="mh-h"><b>' + L('Measures', 'المقاييس') + '</b> <span class="mh-count">' + num(ms.length) + '</span><button type="button" class="mh-copy ms-auto" data-copy="ms"><i class="bi bi-clipboard"></i> ' + L('Copy list', 'نسخ القائمة') + '</button></div>' +
        Object.keys(byFolder).sort().map((k) => '<div class="mh-group"><div class="mh-gh"><i class="bi bi-folder2"></i> ' + bdi(k) + ' <small>' + num(byFolder[k].length) + '</small></div><div class="mh-tags">' + byFolder[k].map((m) => '<code class="ms" data-ms="' + esc(m.name) + '">' + esc(m.name) + '</code>').join('') + '</div></div>').join('') + '</div></div></div>';
      el.insertAdjacentHTML('beforeend', '<div class="mh-panel mt-4 d-flex flex-wrap align-items-center gap-3"><i class="bi bi-magic text-accent fs-4"></i><div class="flex-grow-1"><b>' + L('Ready-made cleanup scripts', 'سكربتات تنظيف جاهزة') + '</b><div class="mh-note">' + L('Power Query steps for these columns and a Tabular Editor script for these measures are in the Fix plan.', 'خطوات Power Query لهذه الأعمدة وسكربت Tabular Editor لهذه المقاييس موجودة في خطة الإصلاح.') + '</div></div><button type="button" class="btn btn-accent btn-sm" data-gofix>' + L('Open the fix plan', 'افتح خطة الإصلاح') + '</button></div>');
      el.querySelectorAll('[data-gofix]').forEach((b) => b.onclick = () => { S.tab = 'fix'; renderResult(); });
      el.querySelectorAll('[data-ms]').forEach((c) => c.onclick = () => { S.tab = 'measures'; S.msOpen = c.dataset.ms; renderResult(); });
      el.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => {
        const txt = b.dataset.copy === 'cols' ? cols.map((x) => x.u.map((c) => "'" + x.t.name + "'[" + c.name + ']').join('\n')).join('\n') : ms.map((m) => '[' + m.name + ']').join('\n');
        copy(txt); host.track('mh_copy', { list: b.dataset.copy });
      });
    }

    function tTables() {
      const el = $('mhTab');
      const modeL = (t) => (t.auto ? L('Auto date', 'تاريخ تلقائي') : t.isCalcTable ? L('DAX table', 'جدول DAX') : (t.mode === 'directLake' ? 'Direct Lake' : t.mode === 'directQuery' ? 'DirectQuery' : t.mode === 'dual' ? 'Dual' : 'Import'));
      el.innerHTML = '<div class="mh-panel"><div class="mh-tscroll"><table class="mh-table"><thead><tr><th>' + L('Table', 'الجدول') + '</th><th>' + L('Type', 'النوع') + '</th><th>' + L('Columns', 'الأعمدة') + '</th><th>' + L('Measures', 'المقاييس') + '</th>' + (S.result.meta.hasReport ? '<th>' + L('Unused columns', 'أعمدة غير مستخدمة') + '</th>' : '') + '</tr></thead><tbody>' +
        S.result.tables.filter((t) => !t.auto).map((t) => '<tr data-t="' + esc(t.name) + '"><td><b>' + bdi(t.name) + '</b>' + (t.hidden ? ' <i class="bi bi-eye-slash mh-dim"></i>' : '') + (t.markedDate ? ' <span class="mh-badge">' + L('date table', 'جدول تاريخ') + '</span>' : '') + (t.used === false ? ' <span class="mh-badge off">' + L('unused', 'غير مستخدم') + '</span>' : '') + '</td><td>' + modeL(t) + '</td><td>' + num(t.columns.length) + '</td><td>' + num(t.measures) + '</td>' + (S.result.meta.hasReport ? '<td>' + (() => { const u = t.columns.filter((c) => c.used === false).length; return u ? '<span class="mh-unum">' + num(u) + '</span>' : '0'; })() + '</td>' : '') + '</tr>' +
          '<tr class="mh-cols" hidden><td colspan="5"><div class="mh-tags">' + t.columns.map((c) => '<code class="' + (c.used === false ? 'off' : '') + (c.kind === 'calculated' ? ' calc' : '') + '" title="' + esc(c.dataType + (c.kind === 'calculated' ? ' · calculated' : '') + (c.hidden ? ' · hidden' : '')) + '">' + esc(c.name) + ' <small>' + esc(c.dataType) + '</small></code>').join('') + '</div></td></tr>').join('') +
        '</tbody></table></div><p class="mh-note mt-2">' + L('Click a table to see its columns. Faded = unused, dashed = calculated column.', 'اضغط على جدول لرؤية أعمدته. الباهت = غير مستخدم، والمنقط = عمود محسوب.') + '</p></div>';
      el.querySelectorAll('tr[data-t]').forEach((tr) => tr.onclick = () => { const n = tr.nextElementSibling; n.hidden = !n.hidden; tr.classList.toggle('open', !n.hidden); });
    }

    function tRels() {
      const el = $('mhTab');
      el.innerHTML = '<div class="mh-panel"><div class="mh-tscroll"><table class="mh-table"><thead><tr><th>' + L('From (many side)', 'من (جهة many)') + '</th><th></th><th>' + L('To (one side)', 'إلى (جهة one)') + '</th><th>' + L('Cardinality', 'نوع العلاقة') + '</th><th>' + L('Filter', 'التصفية') + '</th><th>' + L('Active', 'نشطة') + '</th></tr></thead><tbody>' +
        S.result.relationships.map((r) => {
          const card = (r.fromCard === 'many' ? '*' : '1') + ':' + (r.toCard === 'many' ? '*' : '1');
          return '<tr class="' + (r.active ? '' : 'mh-dimrow') + '"><td dir="ltr"><code>' + esc(r.fromTable) + '[' + esc(r.fromColumn) + ']</code></td><td>' + (r.cross === 'bothDirections' ? '<i class="bi bi-arrow-left-right text-warning"></i>' : '<i class="bi bi-arrow-left"></i>') + '</td><td dir="ltr"><code>' + esc(r.toTable) + '[' + esc(r.toColumn) + ']</code></td><td>' + (card === '*:*' ? '<span class="mh-badge off">*:*</span>' : card) + '</td><td>' + (r.cross === 'bothDirections' ? '<span class="text-warning">' + L('Both', 'اتجاهين') + '</span>' : L('Single', 'اتجاه واحد')) + '</td><td>' + (r.active ? '<i class="bi bi-check-lg text-success"></i>' : '<span class="mh-dim">' + L('inactive', 'غير نشطة') + '</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }
    Object.assign(v, { tUnused, tTables, tRels });
  }

  // the Fix plan's TMDL panel
  function tmdlPart(v) {
    const { L, esc, num } = v;
    function tmdlPanel(tm) {
      if (!tm || (!(tm.fixes && tm.fixes.script) && !(tm.move && tm.move.script) && !tm.formats && !tm.dates.length)) return '';
      const btn = (k, label, n) => '<button type="button" class="btn btn-accent btn-sm" data-script="' + k + '"><i class="bi bi-clipboard"></i> ' + label + ' <small>(' + num(n) + ')</small></button>';
      let h = '<div class="mh-panel mt-4 mh-premium"><div class="mh-h"><b><i class="bi bi-stars"></i> ' + L('Apply in Power BI Desktop, no install', 'طبّق داخل Power BI Desktop بدون تثبيت أي أداة') + '</b><span class="mh-prem cap-pill">' + L('Premium preview', 'نسخة مميزة تجريبية') + '</span></div>' +
        '<p class="mh-note">' + L('TMDL scripts that run in Power BI Desktop\'s own TMDL view. Each object is written out in full, the way Power BI writes it, with only the fix changed.', 'سكربتات TMDL تعمل داخل TMDL view في Power BI Desktop نفسه. كل عنصر مكتوب بالكامل بنفس طريقة Power BI مع تغيير الإصلاح فقط.') + '</p>' +
        '<ol class="mh-steps"><li>' + L('Export a fresh .pbit of the exact file you will change, and check it here.', 'صدّر ملف .pbit جديدًا من نفس الملف الذي ستعدّله وافحصه هنا.') + '</li><li>' + L('In Power BI Desktop open TMDL view, add a new tab and paste the script.', 'في Power BI Desktop افتح TMDL view وأضف تبويبًا جديدًا والصق السكربت.') + '</li><li>' + L('Click <b>Preview</b> and read the diff: only the listed properties should change.', 'اضغط <b>Preview</b> وراجع الفروقات: يجب أن تتغير الخصائص المذكورة فقط.') + '</li><li>' + L('Click <b>Apply</b>, check your report, then save.', 'اضغط <b>Apply</b> وراجع تقريرك ثم احفظ.') + '</li></ol>' +
        '<div class="mh-sbtns">' + (tm.fixes && tm.fixes.script ? btn('tmdl:fixes', L('Copy quick fixes', 'نسخ الإصلاحات السريعة'), tm.fixes.count) : '') + (tm.move && tm.move.script ? btn('tmdl:move', L('Copy: move unused measures', 'نسخ: نقل المقاييس غير المستخدمة'), tm.move.count) : '') + (tm.formats && tm.formats.script ? btn('tmdl:formats', L('Copy: right number formats', 'نسخ: تنسيقات الأرقام الصحيحة'), tm.formats.count) : '') + '</div>';
      if (tm.formats) h += '<span class="tg-label mt-3">' + L('Number and date formats', 'تنسيقات الأرقام والتواريخ') + '</span><p class="mh-note">' + L('A ratio shows as 0.0%, a count or whole number as #,0, money in its own currency format, other numbers as #,0.00, a date as dd mmm yyyy. Formats already right are left alone.', 'النسبة تظهر بتنسيق 0.0%، والعدد أو الرقم الصحيح بتنسيق #,0، والمبالغ بتنسيق عملتها نفسه، وبقية الأرقام بتنسيق #,0.00، والتاريخ بتنسيق dd mmm yyyy. التنسيقات الصحيحة تبقى كما هي.') + '</p><ul class="mh-manual mh-formats">' +
        tm.formats.items.concat(tm.formats.byHand).slice(0, 50).map((i) => '<li dir="auto">' + esc(i.object + ': ' + (i.from || L('no format', 'بلا تنسيق')) + ' → ' + i.to) + '</li>').join('') + '</ul>' + (tm.formats.more ? '<p class="mh-help">' + L(num(tm.formats.more) + ' more: apply this script, then check again.', num(tm.formats.more) + ' أخرى: طبّق هذا السكربت ثم افحص مجددًا.') + '</p>' : '');
      const manual = [];
      tm.dates.forEach((d) => manual.push(L('Mark ' + d.table + ' as a date table (Table tools > Mark as date table > ' + d.column + ')', 'علّم ' + d.table + ' كجدول تاريخ (Table tools > Mark as date table > ' + d.column + ')')));
      tm.notes.forEach((n) => manual.push(n));
      if (tm.fixes) tm.fixes.manual.forEach((m) => {
        const what = m.set && m.set.isHidden ? L('hide it', 'أخفِه') : m.set && m.set.summarizeBy ? L('set Summarization to Don\'t summarize', 'اضبط Summarization على Don\'t summarize') : m.set && m.set.sortByColumn ? L('sort by ' + m.set.sortByColumn, 'رتّبه حسب ' + m.set.sortByColumn) : L('change by hand', 'غيّره يدويًا');
        manual.push(m.table + '[' + m.column + ']: ' + what + (m.reason === 'daxTable' ? L(' (column of a DAX table, TMDL cannot change it alone)', ' (عمود في جدول DAX لا يمكن لـ TMDL تعديله منفردًا)') : ''));
      });
      if (tm.move) tm.move.manual.forEach((m) => manual.push('[' + m + ']: ' + L('move by hand', 'انقله يدويًا')));
      if (manual.length) h += '<span class="tg-label mt-3">' + L('Do these by hand', 'نفّذ هذه يدويًا') + '</span><ul class="mh-manual">' + manual.map((x) => '<li dir="auto">' + esc(x) + '</li>').join('') + '</ul>';
      return h + '<p class="mh-help mt-2">' + L('Preview feature: always use Preview before Apply, and keep a copy of your file. Tell us if a script fails: hello@dataarcus.com', 'ميزة تجريبية: استخدم Preview دائمًا قبل Apply واحتفظ بنسخة من ملفك. أخبرنا إن فشل سكربت: hello@dataarcus.com') + '</p></div>';
    }
    Object.assign(v, { tmdlPanel });
  }

  function fixTab(v) {
    const { host, S, $, isAr, L, esc, num, bdi, score, rt, copy, tmdlPanel } = v;
    // ---------- Fix plan: safe order, quick-fixes script, cleanup scripts, expert items ----------
    // the plan's data and scripts (quick edits, the cleanup, the Tabular Editor, Power Query and TMDL scripts):
    // health-fix-plan.js (0.3.2 SP32); the copy buttons give plan.scripts[key]
    const fixPlan = () => window.MHFixPlan.plan({ result: S.result, ignored: S.ignored, lang: isAr() ? 'ar' : 'en', tmdl: window.MHTmdl || null });
    function tFix() {
      const el = $('mhTab');
      const key = String(S.result.meta.fileName).toLowerCase();
      const plans = host.store.get('dataarcus-mh-plan', {});
      const done = new Set(plans[key] || []);
      const fp = fixPlan(), plan = fp.cleanup;
      scripts = fp.scripts;
      const ms = plan.ms;
      const broken = fp.broken;
      const qf = fp.quick;
      const pqCount = plan.pq.length;
      const calcCount = plan.calc.length;
      const steps = [['copy', L('Save a copy of your .pbix', 'احفظ نسخة من ملف ‎.pbix'), L('Every step below changes the model. Keep a copy so you can go back.', 'كل خطوة بالأسفل تغيّر النموذج، فاحتفظ بنسخة للرجوع إليها.')]];
      if (broken) steps.push(['broken', L('Fix ' + num(broken.items.length) + ' broken fields in visuals', 'أصلح ' + num(broken.items.length) + ' حقلًا مكسورًا في الـ visuals'), L('The Issues tab lists the page and visual for each missing field. Replace or remove the field there. Users see these errors today.', 'تبويب المشاكل يذكر الصفحة والـ visual لكل حقل مفقود. استبدل الحقل أو احذفه هناك، فالمستخدمون يرون هذه الأخطاء الآن.')]);
      if (qf) steps.push(['quick', L('Run the quick-fixes script (' + num(qf.count) + ' changes)', 'شغّل سكربت الإصلاحات السريعة (' + num(qf.count) + ' تعديل)'), L('Date tables, month sorting, summarization and hidden keys. Safe, mechanical changes.', 'جداول التاريخ وترتيب الشهور والتجميع وإخفاء المفاتيح. تعديلات آمنة وآلية.')]);
      if (ms.length) steps.push(['measures', L('Move ' + num(ms.length) + ' unused measures to a review folder', 'انقل ' + num(ms.length) + ' مقياسًا غير مستخدم إلى مجلد مراجعة'), L('Nothing is deleted. Look through the folder, then delete it when you are sure.', 'لا يُحذف شيء. راجع المجلد ثم احذفه عندما تتأكد.')]);
      // calculated columns first: one may read a column the Power Query step removes
      if (calcCount) steps.push(['calc', L('Delete ' + num(calcCount) + ' unused calculated columns', 'احذف ' + num(calcCount) + ' عمودًا محسوبًا غير مستخدم'), L('Listed at the bottom of this page.', 'موجودة في أسفل هذه الصفحة.')]);
      if (pqCount) steps.push(['columns', L('Remove unused columns in Power Query (' + num(pqCount) + ' tables)', 'احذف الأعمدة غير المستخدمة في Power Query (' + num(pqCount) + ' جدول)'), L('Paste one line per table. Hiding is not enough: hidden columns still load.', 'الصق سطرًا واحدًا لكل جدول. الإخفاء لا يكفي فالأعمدة المخفية ما زالت تُحمَّل.')]);
      steps.push(['recheck', L('Refresh, export a new .pbit and check again', 'حدّث النموذج وصدّر .pbit جديدًا وافحصه مرة أخرى'), L('Your score history shows how many points you gained.', 'سجل التقييم يوضح كم نقطة كسبت.')]);
      const nDone = steps.filter((x) => done.has(x[0])).length;
      const experts = S.result.findings.filter((f) => EXPERT.has(f.id) && !S.ignored.has(f.id) && f.sev !== 'info');
      el.innerHTML = '<div class="row g-4"><div class="col-lg-5"><div class="mh-panel mh-plan"><div class="mh-h"><b><i class="bi bi-list-check"></i> ' + L('Safe order', 'الترتيب الآمن') + '</b><span class="ms-auto mh-note">' + L(num(nDone) + ' of ' + num(steps.length) + ' done', 'تم ' + num(nDone) + ' من ' + num(steps.length)) + '</span></div>' +
        '<div class="mh-bar mb-3"><span style="width:' + Math.round(nDone / steps.length * 100) + '%;background:#22c55e"></span></div>' +
        steps.map((x, i) => '<label class="mh-step' + (done.has(x[0]) ? ' done' : '') + '"><input type="checkbox" data-step="' + x[0] + '"' + (done.has(x[0]) ? ' checked' : '') + '><span><b>' + (i + 1) + '. ' + x[1] + '</b><small>' + x[2] + '</small></span></label>').join('') + '</div>' +
        (experts.length ? '<div class="mh-panel mt-4 mh-expertbox"><div class="mh-h"><b><i class="bi bi-person-gear"></i> ' + L('Needs an expert', 'يحتاج خبيرًا') + '</b></div><p class="mh-note">' + L('These need design decisions and testing against your data, not a script. Getting them wrong can change the numbers in your reports.', 'هذه تحتاج قرارات تصميم واختبارًا على بياناتك وليس سكربتًا، والخطأ فيها قد يغيّر أرقام تقاريرك.') + '</p><ul class="mh-elist">' + experts.map((f) => '<li><span class="mh-sev cap-pill ' + f.sev + '">' + (isAr() ? SEVL[f.sev][1] : SEVL[f.sev][0]) + '</span> ' + rt(f.id)[0] + ' <small>(' + num(f.items.length) + ')</small></li>').join('') + '</ul><a href="/#contact" class="btn btn-accent btn-sm" data-expert="plan"><i class="bi bi-calendar3"></i> ' + L('Book a free call', 'احجز مكالمة مجانية') + '</a></div>' : '') +
        '</div><div class="col-lg-7">' +
        (qf ? '<div class="mh-panel mh-clean"><div class="mh-h"><b><i class="bi bi-lightning-charge-fill text-warning"></i> ' + L('Quick-fixes script', 'سكربت الإصلاحات السريعة') + '</b><span class="mh-count">' + num(qf.count) + '</span><button type="button" class="mh-copy ms-auto" data-script="te:quick"><i class="bi bi-clipboard"></i> ' + L('Copy', 'نسخ') + '</button></div><p class="mh-note">' + L('One Tabular Editor script for the mechanical fixes. External tools > Tabular Editor > C# Script, paste, run, save. If Power BI Desktop blocks one change, do that one by hand.', 'سكربت Tabular Editor واحد للإصلاحات الآلية. من External tools افتح Tabular Editor ثم C# Script والصق وشغّل واحفظ. إن منع Power BI Desktop تعديلًا فنفّذه يدويًا.') + '</p><pre class="mh-dax mh-qf">' + esc(qf.code) + '</pre></div>' : '') +
        tmdlPanel(fp.tmdl) +
        (S.result.meta.hasReport ? cleanupHtml(plan) :'<div class="mh-panel mh-note">' + L('Cleanup scripts for unused columns and measures need the report pages. Use a .pbit.', 'سكربتات تنظيف الأعمدة والمقاييس غير المستخدمة تحتاج صفحات التقرير. استخدم ملف .pbit.') + '</div>') +
        '</div></div>';
      el.querySelectorAll('[data-step]').forEach((c) => c.onchange = () => {
        if (c.checked) done.add(c.dataset.step); else done.delete(c.dataset.step);
        plans[key] = Array.from(done); host.store.set('dataarcus-mh-plan', plans);
        host.track('mh_plan_step', { step: c.dataset.step, done: c.checked });
        const y = window.scrollY; tFix(); window.scrollTo(0, y);
      });
      el.querySelectorAll('[data-script]').forEach((b) => b.onclick = () => { copy(scripts[b.dataset.script]); host.track('mh_copy', { list: 'script_' + b.dataset.script.replace(':', '_') }); });
      el.querySelectorAll('[data-expert]').forEach((a) => a.addEventListener('click', () => host.track('mh_expert_click', { rule: a.dataset.expert, score: score().overall })));
    }

    // Ready-to-paste cleanup: Power Query steps for unused source columns, Tabular Editor scripts for unused measures
    let scripts = {};
    function cleanupHtml(plan) {
      const { pq, calc, kept, ms } = plan;
      let html = '<div class="mh-panel mt-4 mh-clean"><div class="mh-h"><b><i class="bi bi-magic"></i> ' + L('Cleanup scripts', 'سكربتات التنظيف') + '</b></div><p class="mh-note">' + L('Save a copy of your file first. Then use these to remove what nobody uses.', 'احفظ نسخة من ملفك أولًا، ثم استخدم هذه السكربتات لحذف ما لا يستخدمه أحد.') + '</p>';
      if (pq.length) {
        html += '<span class="tg-label mt-2">' + L('Power Query: remove unused source columns', 'Power Query: حذف أعمدة المصدر غير المستخدمة') + '</span><p class="mh-note">' + L('In Power Query, select the table, click fx to add a step, and paste the line. Replace #"Previous step" with the name Power Query shows in the formula bar.', 'في Power Query اختر الجدول واضغط fx لإضافة خطوة والصق السطر. استبدل #"Previous step" بالاسم الذي يظهره Power Query في شريط الصيغة.') + '</p>';
        pq.forEach((x, i) => {
          const code = scripts['pq:' + i];
          html += '<div class="mh-script"><div class="mh-sh"><b>' + bdi(x.t.name) + '</b> <small>' + L(num(x.names.length) + ' columns', num(x.names.length) + ' عمود') + '</small><button type="button" class="mh-copy ms-auto" data-script="pq:' + i + '"><i class="bi bi-clipboard"></i> ' + L('Copy', 'نسخ') + '</button></div><pre class="mh-dax">' + esc(code) + '</pre></div>';
        });
      }
      if (ms.length) {
        html += '<span class="tg-label mt-3">' + L('Tabular Editor: ' + num(ms.length) + ' unused measures', 'Tabular Editor: ' + num(ms.length) + ' مقياس غير مستخدم') + '</span><p class="mh-note">' + L('Open the model in Tabular Editor (External tools), then C# Script, paste and run, then save. Start with "move to folder": it hides nothing and deletes nothing, so you can review first.', 'افتح النموذج في Tabular Editor من External tools ثم C# Script والصق وشغّل ثم احفظ. ابدأ بـ "نقل لمجلد": لا يحذف شيئًا، فتراجع أولًا.') + '</p>' +
          '<div class="mh-sbtns"><button type="button" class="tg-btn2 btn-sm" data-script="te:move"><i class="bi bi-folder-symlink"></i> ' + L('Copy: move to a review folder', 'نسخ: نقل إلى مجلد مراجعة') + '</button><button type="button" class="tg-btn2 btn-sm mh-danger" data-script="te:delete"><i class="bi bi-trash3"></i> ' + L('Copy: delete them', 'نسخ: حذفها') + '</button></div>';
      }
      if (calc.length) html += '<span class="tg-label mt-3">' + L('Calculated columns to delete by hand', 'أعمدة محسوبة تُحذف يدويًا') + '</span><div class="mh-tags">' + calc.map((x) => '<code>' + esc(x.t) + '[' + esc(x.c) + ']</code>').join('') + '</div>';
      if (kept.length) html += '<span class="tg-label mt-3">' + L('Unused, but kept for now', 'غير مستخدمة لكن أُبقيت الآن') + '</span><p class="mh-note">' + L('Removing these now would break something that stays, so the scripts above leave them. Check again after the cleanup.', 'حذفها الآن يكسر شيئًا باقيًا في النموذج، لذلك لا تحذفها السكربتات أعلاه. افحص مرة أخرى بعد التنظيف.') + '</p><ul class="mh-manual mh-kept">' + kept.map((x) => '<li dir="auto"><code>' + esc(x.t) + '[' + esc(x.c) + ']</code> ' + esc(x.why) + '</li>').join('') + '</ul>';
      return html + '</div>';
    }
    Object.assign(v, { tFix });
  }

  function measuresTab(v) {
    const { S, $, L, esc, num, bdi } = v;
    // Measure dependency tree (measures only), capped so huge models stay readable
    function chainTree(name) {
      const byName = new Map(S.result.measures.map((m) => [m.name.toLowerCase(), m]));
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
      const q = S.msQuery.toLowerCase();
      let list = S.result.measures.filter((m) => (!q || m.name.toLowerCase().includes(q) || (m.folder || '').toLowerCase().includes(q) || m.expr.toLowerCase().includes(q)));
      if (S.msFilter === 'unused') list = list.filter((m) => m.used === false);
      if (S.msFilter === 'visual') list = list.filter((m) => m.visuals > 0);
      list.sort((a, b) => (a.folder || '').localeCompare(b.folder || '') || a.name.localeCompare(b.name));
      const sel = S.msOpen ? S.result.measures.find((m) => m.name === S.msOpen) : null;
      const chip = (d) => '<button type="button" class="mh-dep ' + (d.type === 'table' ? 'tbl' : d.type) + '" ' + (d.type === 'measure' ? 'data-ms="' + esc(d.name) + '"' : '') + '><i class="bi ' + (d.type === 'measure' ? 'bi-calculator' : d.type === 'column' ? 'bi-layout-three-columns' : d.type === 'function' ? 'bi-braces' : 'bi-table') + '"></i> ' + (d.type === 'column' ? esc(d.table) + '[' + esc(d.name) + ']' : d.type === 'measure' ? '[' + esc(d.name) + ']' : esc(d.name)) + '</button>';
      el.innerHTML = '<div class="row g-4"><div class="col-lg-5"><div class="mh-panel mh-mlist"><div class="mh-search"><i class="bi bi-search"></i><input type="search" id="mhQ" value="' + esc(S.msQuery) + '" placeholder="' + L('Search name, folder or DAX', 'ابحث بالاسم أو المجلد أو DAX') + '"></div>' +
        '<div class="mb-seg mb-2">' + [['all', L('All', 'الكل')], ['visual', L('In visuals', 'في visuals')], ['unused', L('Unused', 'غير مستخدم')]].map((x) => '<button type="button" data-mf="' + x[0] + '" class="' + (S.msFilter === x[0] ? 'active' : '') + '">' + x[1] + '</button>').join('') + '</div>' +
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
      qi.oninput = () => { S.msQuery = qi.value; const pos = qi.selectionStart; tMeasures(); const n = $('mhQ'); n.focus(); n.setSelectionRange(pos, pos); };
      el.querySelectorAll('[data-mf]').forEach((b) => b.onclick = () => { S.msFilter = b.dataset.mf; tMeasures(); });
      const ap = el.querySelector('[data-allpages]'); if (ap) ap.onclick = () => { ap.parentElement.querySelectorAll('span[hidden]').forEach((x) => { x.hidden = false; }); ap.remove(); };
      el.querySelectorAll('[data-ms]').forEach((b) => b.onclick = () => { S.msOpen = b.dataset.ms; tMeasures(); if (window.innerWidth < 992) { const d = el.querySelector('.mh-mdetail'); if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
      const on = el.querySelector('.mh-mrow.on'); if (on) on.scrollIntoView({ block: 'nearest' });
    }
    Object.assign(v, { tMeasures });
  }

  function docsTab(v) {
    const { host, S, $, L, bdi } = v;
    function tDocs() {
      const el = $('mhTab');
      el.innerHTML = '<div class="row g-4"><div class="col-md-6 col-xxl-3"><div class="mh-panel mh-doc"><i class="bi bi-filetype-html"></i><b>' + L('Full documentation', 'توثيق كامل') + '</b><p class="mh-note">' + L('One HTML page with the health score, every issue, all tables and columns, every measure with its DAX and dependencies, and the relationships. Opens in any browser and prints to PDF.', 'صفحة HTML واحدة فيها التقييم وكل المشاكل وكل الجداول والأعمدة وكل مقياس بصيغته واعتماداته والعلاقات. تفتح في أي متصفح ويمكن طباعتها PDF.') + '</p><button type="button" class="btn btn-accent" data-doc="html"><i class="bi bi-download"></i> ' + L('Download HTML', 'تحميل HTML') + '</button></div></div>' +
        '<div class="col-md-6 col-xxl-3"><div class="mh-panel mh-doc"><i class="bi bi-markdown"></i><b>Markdown</b><p class="mh-note">' + L('The same documentation as Markdown, ready for a Git repo, Azure DevOps wiki or Confluence.', 'نفس التوثيق بصيغة Markdown، جاهز لمستودع Git أو Azure DevOps wiki أو Confluence.') + '</p><button type="button" class="tg-btn2" data-doc="md"><i class="bi bi-download"></i> ' + L('Download .md', 'تحميل ‎.md') + '</button></div></div>' +
        '<div class="col-md-6 col-xxl-3"><div class="mh-panel mh-doc"><i class="bi bi-filetype-csv"></i><b>' + L('Measures list', 'قائمة المقاييس') + '</b><p class="mh-note">' + L('Every measure with folder, format, usage and DAX as a CSV for Excel.', 'كل المقاييس مع المجلد والتنسيق والاستخدام وصيغة DAX كملف CSV لـ Excel.') + '</p><button type="button" class="tg-btn2" data-doc="csv"><i class="bi bi-download"></i> ' + L('Download CSV', 'تحميل CSV') + '</button></div></div>' +
        // I-1: the score card, a picture to share (rule and object names only, never DAX or descriptions)
        '<div class="col-md-6 col-xxl-3"><div class="mh-panel mh-doc"><i class="bi bi-image"></i><b>' + L('Score card', 'بطاقة النتيجة') + '</b><p class="mh-note">' + L('A 1200 × 630 picture for LinkedIn: the score, the model\'s size and the top 5 findings. Drawn in your browser, nothing is uploaded.', 'صورة ' + bdi('1200 × 630') + ' لـ LinkedIn: التقييم وحجم النموذج وأهم 5 ملاحظات. تُرسم في متصفحك ولا يُرفع أي شيء.') + '</p>' +
        '<div class="form-check form-switch mb-2"><input class="form-check-input" type="checkbox" role="switch" id="mhCardHide"' + (S.cardHide ? ' checked' : '') + '><label class="form-check-label" for="mhCardHide">' + L('Hide object names', 'إخفاء أسماء العناصر') + '</label></div>' +
        '<button type="button" class="tg-btn2" id="mhCard"><i class="bi bi-download"></i> ' + L('Download score card', 'تحميل بطاقة النتيجة') + '</button><ul id="mhCardText" class="visually-hidden"></ul></div></div></div>';
      $('mhCardHide').onchange = (e) => { S.cardHide = e.target.checked; };
      $('mhCard').onclick = () => host.scoreCard();
      el.querySelectorAll('[data-doc]').forEach((b) => b.onclick = () => {
        host.save({ html: 'doc-html', md: 'doc-md', csv: 'measures-csv' }[b.dataset.doc]);
        host.track('mh_download', { kind: b.dataset.doc });
      });
    }
    Object.assign(v, { tDocs });
  }

  root.MHView = { create };
})(typeof self !== 'undefined' ? self : this);
