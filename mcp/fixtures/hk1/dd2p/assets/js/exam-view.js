/*
 * DataArcus practice exams: the page (0.3.2 SP34, out of dp600-sim.js): every screen's HTML, its clicks and keys, and
 * the routing between the screens (home, practice setup and session, case studies, study plan, mock setup, the mock,
 * its review and results), the toast and the dialogs, the outline note. The only module that touches the DOM.
 *
 * Interface (one input, one output):
 *   mount(x) -> { start(mode), outline(data) }
 *     x: { root (the #dpApp element), EX (the exam's settings), QS (the bank's questions), CASES, byId (id -> question),
 *          ALL (every question), DOM (area -> { en, ar, w, wt, study }), SKILL (skill -> { d, en, ar }), REN (the renewal
 *          check or null), renTopic (bank tag -> renewal skill), LEARN (exam-progress.js's learnPages), PR (exam-progress.js's
 *          progress), MK (exam-session.js's mock in progress), SES (exam-session.js), G (exam-grade.js), track(name, params) }
 *     start(mode): the first screen (?mode= mock, renewal, practice, cases, plan; else home). outline(data): the weekly
 *     outline file has come (dp600-sim.js has applied its weights): its note under the exam, home drawn again.
 *   Its own state, the page's: the screen and its context, the practice and mock choices, the mock's timer.
 * (c) DataArcus. All rights reserved.
 */
(function (glob) {
  'use strict';
  function mount({ root, EX, QS, CASES, byId, ALL, DOM, SKILL, REN, renTopic, LEARN, PR, MK, SES, G, track }) {
    const { stats, readiness, mistakes, streak, record, isBm, toggleBm, rank } = PR;

    // ---------- helpers ----------
    const isAr = () => document.documentElement.lang === 'ar';
    const L = (en, ar) => (isAr() ? ar : en);
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const num = (n) => new Intl.NumberFormat(isAr() ? 'ar-u-nu-latn' : 'en-US').format(n);
    const shuffle = (a) => SES.shuffle(a, Math.random);
    const LET = 'ABCDEFGH';
    const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

    const renName = (k) => { const t = REN.topics.find((x) => x.k === k); return L(t.en, t.ar); };
    const skillName = (s) => L(SKILL[s].en, SKILL[s].ar);
    const domName = (d) => L(DOM[d].en, DOM[d].ar);
    // (I-2) one exam area's result row: under 70% (the percent as shown) a link to its section of Microsoft's study guide
    const domRow = (d, right, n) => {
      const p = n ? right / n : 0, pct = Math.round(p * 100), weak = n > 0 && pct < 70;
      return '<div class="dp-domrow" data-dom="' + d + '"><div class="dp-domtop"><span>' + domName(d) + ' <small><bdi dir="ltr">' + DOM[d].w + '</bdi></small></span><b>' + (n ? pct + '%' : '·') + '</b></div>' + bar(p, pct >= 70 ? 'good' : 'warn') +
        (weak && DOM[d].study ? '<div class="dp-domsub"><a href="' + esc(DOM[d].study) + '" target="_blank" rel="noopener" data-learn data-study><i class="bi bi-book"></i> ' + L('Study: this area in Microsoft\'s study guide', 'ذاكر: هذا المحور في دليل المذاكرة من Microsoft') + '</a></div>' : '') + '</div>';
    };

    // ---------- grading (exam-grade.js: pure, answers in, score out) ----------
    const { grade, answered, scoreMock, tallySession } = G;
    const newInst = (q) => SES.newInst(q, Math.random);

    // ---------- question renderer ----------
    const diffDots = (d) => '<span class="dp-diff" title="' + L('Difficulty', 'الصعوبة') + '">' + [1, 2, 3].map((i) => '<i class="' + (i <= d ? 'on' : '') + '"></i>').join('') + '</span>';

    const typeHint = (q) => ({
      single: L('Choose one answer.', 'اختر إجابة واحدة.'),
      multi: L('Select ' + q.n + ' answers.', 'اختر ' + q.n + ' إجابات.'),
      yesno: L('Select Yes or No for each statement.', 'اختر نعم أو لا لكل عبارة.'),
      order: L('Tap the actions in the right order to build your answer.', 'اضغط على الخطوات بالترتيب الصحيح لبناء إجابتك.')
    }[q.type]);

    function qHTML(q, inst, reveal) {
      const r = inst.r;
      let body = '';
      if (q.type === 'single' || q.type === 'multi') {
        body = '<div class="dp-opts" role="' + (q.type === 'single' ? 'radiogroup' : 'group') + '">' + inst.perm.map((oi, k) => {
          const sel = q.type === 'single' ? r === oi : r.includes(oi);
          const corr = q.type === 'single' ? q.ans === oi : q.ans.includes(oi);
          let cls = 'dp-opt' + (sel ? ' sel' : '');
          if (reveal) cls += corr ? ' ok' : sel ? ' bad' : ' dim';
          const why = reveal && q.why && q.why[oi] ? '<span class="dp-why">' + q.why[oi] + '</span>' : '';
          return '<button type="button" class="' + cls + '" data-opt="' + oi + '" ' + (reveal ? 'disabled' : '') + ' aria-pressed="' + sel + '"><span class="dp-let ' + (q.type === 'multi' ? 'sq' : '') + '">' + LET[k] + '</span><span class="dp-otxt">' + q.opts[oi] + why + '</span>' + (reveal ? (corr ? '<i class="bi bi-check-circle-fill dp-mk ok"></i>' : sel ? '<i class="bi bi-x-circle-fill dp-mk bad"></i>' : '') : '') + '</button>';
        }).join('') + '</div>';
      } else if (q.type === 'yesno') {
        body = '<table class="dp-yn"><thead><tr><th>' + 'Statement' + '</th><th>Yes</th><th>No</th></tr></thead><tbody>' + q.opts.map((s, i) => {
          const cell = (val) => {
            const sel = r[i] === val; let cls = 'dp-ynb' + (sel ? ' sel' : '');
            if (reveal) cls += q.ans[i] === val ? ' ok' : sel ? ' bad' : ' dim';
            return '<td><button type="button" class="' + cls + '" data-yn="' + i + '" data-v="' + (val ? 1 : 0) + '" ' + (reveal ? 'disabled' : '') + ' aria-pressed="' + sel + '" aria-label="' + (val ? 'Yes' : 'No') + '"></button></td>';
          };
          const why = reveal && q.why && q.why[i] ? '<span class="dp-why">' + q.why[i] + '</span>' : '';
          return '<tr><td>' + s + why + '</td>' + cell(true) + cell(false) + '</tr>';
        }).join('') + '</tbody></table>';
      } else if (q.type === 'order') {
        const pool = inst.perm.filter((oi) => !r.includes(oi));
        const left = '<div class="dp-ocol"><div class="dp-ohead">Actions</div>' + (pool.length ? pool.map((oi) => '<button type="button" class="dp-oitem" data-add="' + oi + '" ' + (reveal ? 'disabled' : '') + '>' + q.opts[oi] + (reveal && q.why && q.why[oi] && !q.ans.includes(oi) ? '<span class="dp-why">' + q.why[oi] + '</span>' : '') + '</button>').join('') : '<div class="dp-oempty">' + L('All actions used', 'تم استخدام كل الخطوات') + '</div>') + '</div>';
        const right = '<div class="dp-ocol ans"><div class="dp-ohead">Answer area</div>' + (r.length ? r.map((oi, k) => {
          let cls = 'dp-oitem in';
          if (reveal) cls += q.ans[k] === oi ? ' ok' : ' bad';
          return '<div class="' + cls + '"><span class="dp-onum">' + (k + 1) + '</span><span class="dp-otxt">' + q.opts[oi] + '</span>' + (reveal ? '' : '<span class="dp-octl"><button type="button" data-up="' + k + '" aria-label="Move up" ' + (k === 0 ? 'disabled' : '') + '><i class="bi bi-chevron-up"></i></button><button type="button" data-down="' + k + '" aria-label="Move down" ' + (k === r.length - 1 ? 'disabled' : '') + '><i class="bi bi-chevron-down"></i></button><button type="button" data-rm="' + k + '" aria-label="Remove"><i class="bi bi-x-lg"></i></button></span>') + '</div>';
        }).join('') : '<div class="dp-oempty">' + L('Tap actions on the left to add them here, in order.', 'اضغط على الخطوات لإضافتها هنا بالترتيب.') + '</div>') + '</div>';
        body = '<div class="dp-order">' + left + right + '</div>';
        if (reveal) body += '<div class="dp-seq"><b>' + L('Correct sequence', 'الترتيب الصحيح') + ':</b><ol>' + q.ans.map((oi) => '<li>' + q.opts[oi] + '</li>').join('') + '</ol></div>';
      }
      return '<div class="dp-q" data-qid="' + q.id + '" lang="en" dir="ltr"><div class="dp-qtext">' + q.q + '</div><div class="dp-hint" lang="' + (isAr() ? 'ar' : 'en') + '" dir="' + (isAr() ? 'rtl' : 'ltr') + '">' + typeHint(q) + '</div>' + body + '</div>';
    }

    function explainHTML(q, r) {
      const g = grade(q, r), ok = g === 1;
      const verdict = ok ? '<span class="dp-verdict ok"><i class="bi bi-check-circle-fill"></i> ' + L('Correct', 'إجابة صحيحة') + '</span>'
        : g > 0 ? '<span class="dp-verdict part"><i class="bi bi-dash-circle-fill"></i> ' + L('Partly correct', 'صحيحة جزئيًا') + ' (' + Math.round(g * 100) + '%)</span>'
          : '<span class="dp-verdict bad"><i class="bi bi-x-circle-fill"></i> ' + L('Not quite', 'ليست صحيحة') + '</span>';
      const refs = (q.ref || []).map((x) => '<li><a href="' + esc(x.u) + '" target="_blank" rel="noopener" data-learn>' + esc(x.t) + ' <i class="bi bi-box-arrow-up-right"></i></a></li>').join('');
      return '<div class="dp-exp">' + verdict +
        '<div class="dp-exptext" lang="en" dir="ltr">' + q.exp + '</div>' +
        (q.ar && isAr() ? '<div class="dp-ar" lang="ar" dir="rtl"><span>' + 'الخلاصة' + '</span>' + q.ar + '</div>' : '') +
        (refs ? '<div class="dp-refs"><b>' + L('Learn more on Microsoft Learn', 'اقرأ أكثر على Microsoft Learn') + '</b><ul>' + refs + '</ul></div>' : '') + '</div>';
    }

    // Wires clicks inside a rendered question to update inst.r, then calls onChange
    function bindQ(el, q, inst, onChange) {
      el.querySelectorAll('[data-opt]').forEach((b) => b.addEventListener('click', () => {
        const oi = +b.dataset.opt;
        if (q.type === 'single') inst.r = oi;
        else if (inst.r.includes(oi)) inst.r = inst.r.filter((x) => x !== oi);
        else if (inst.r.length < q.n) inst.r = inst.r.concat(oi);
        else { toast(L('You can select ' + q.n + '. Unselect one first.', 'يمكنك اختيار ' + q.n + ' فقط. ألغِ اختيارًا أولًا.')); return; }
        onChange();
      }));
      el.querySelectorAll('[data-yn]').forEach((b) => b.addEventListener('click', () => { inst.r[+b.dataset.yn] = b.dataset.v === '1'; onChange(); }));
      el.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => { inst.r = inst.r.concat(+b.dataset.add); onChange(); }));
      el.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => { const k = +b.dataset.rm; inst.r = inst.r.filter((_, i) => i !== k); onChange(); }));
      const mv = (k, d) => { const a = inst.r.slice(); [a[k], a[k + d]] = [a[k + d], a[k]]; inst.r = a; onChange(); };
      el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => mv(+b.dataset.up, -1)));
      el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => mv(+b.dataset.down, 1)));
      el.querySelectorAll('[data-learn]').forEach((a) => a.addEventListener('click', () => track(EX.ev + '_learn_click', { question_id: q.id })));
    }

    function caseHTML(c) {
      return '<div class="dp-case" lang="en" dir="ltr"><div class="dp-casehead"><i class="bi bi-journal-text"></i> Case study: ' + esc(c.title) + '</div><div class="dp-casebody">' + c.scenario + '</div></div>';
    }
    const caseOf = (q) => (q.caseId ? CASES.find((c) => c.id === q.caseId) : null);

    // ---------- small UI bits ----------
    let toastT;
    function toast(msg) {
      let t = document.getElementById('dpToast');
      if (!t) { t = document.createElement('div'); t.id = 'dpToast'; t.className = 'dp-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
    }
    function modal(title, text, okLabel, onOk, cancelLabel) {
      const m = document.createElement('div');
      m.className = 'dp-modal';
      m.innerHTML = '<div class="dp-mbox" role="dialog" aria-modal="true"><h3>' + title + '</h3><p>' + text + '</p><div class="dp-mbtns"><button type="button" class="tg-btn2" data-x>' + (cancelLabel || L('Cancel', 'إلغاء')) + '</button><button type="button" class="btn btn-accent" data-ok>' + okLabel + '</button></div></div>';
      document.body.appendChild(m);
      const close = () => m.remove();
      m.querySelector('[data-x]').onclick = close;
      m.querySelector('[data-ok]').onclick = () => { close(); onOk(); };
      m.addEventListener('click', (e) => { if (e.target === m) close(); });
      m.querySelector('[data-ok]').focus();
    }
    const ring = (pct, label, color) => {
      const r = 42, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(1, pct)));
      return '<svg class="dp-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="' + r + '" class="bg"/><circle cx="50" cy="50" r="' + r + '" class="fg" style="stroke:' + (color || 'var(--accent)') + ';stroke-dasharray:' + c + ';stroke-dashoffset:' + off + '"/></svg><div class="dp-ringlabel">' + label + '</div>';
    };
    const bar = (pct, cls) => '<div class="dp-bar ' + (cls || '') + '"><span style="width:' + Math.round(Math.max(0, Math.min(1, pct)) * 100) + '%"></span></div>';
    // back to the top of the exam when it is scrolled out of view; the offset comes from --top-offset (style.css)
    const top = () => { if (root.getBoundingClientRect().top < parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)) root.scrollIntoView({ behavior: 'instant', block: 'start' }); };

    // ---------- weekly outline check (assets/data/dp600-outline.json, refreshed by a GitHub Action) ----------
    let OUT = null;
    const fmtDate = (iso) => new Intl.DateTimeFormat(isAr() ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
    function renderOutline() {
      const el = document.getElementById('dpOutline');
      if (!el || !OUT || !OUT.checked) return;
      const guide = '<a href="' + esc(OUT.sources.studyGuide) + '" target="_blank" rel="noopener">' + L('study guide', 'دليل المذاكرة') + '</a>';
      let html;
      el.classList.toggle('review', OUT.status === 'review');  // toggled, not replaced: the page's own classes (its margin) stay
      if (OUT.status === 'review') {
        html = '<i class="bi bi-arrow-repeat"></i> ' + L('Microsoft updated the ' + EX.code + ' skills outline (checked ' + fmtDate(OUT.checked) + '). We are reviewing the questions now. Most of them still apply. See the ' + guide + ' for what changed.',
          'حدّثت Microsoft منهج ' + EX.code + ' (آخر فحص ' + fmtDate(OUT.checked) + '). نراجع الأسئلة الآن ومعظمها ما زال صالحًا. راجع ' + guide + ' لمعرفة التغييرات.');
      } else {
        html = '<i class="bi bi-shield-check"></i> ' + L('Checked weekly against Microsoft\'s ' + EX.code + ' ' + guide + '. Last check: ' + fmtDate(OUT.checked) + '. Questions match the skills measured as of ' + fmtDate(OUT.bankOutlineDate) + '.',
          'نراجع أسبوعيًا ' + guide + ' الخاص بـ ' + EX.code + ' من Microsoft. آخر فحص: ' + fmtDate(OUT.checked) + '. الأسئلة مطابقة للمهارات المقاسة اعتبارًا من ' + fmtDate(OUT.bankOutlineDate) + '.');
        if (PR.today() < OUT.bankOutlineDate) html += ' ' + L('Taking the exam before then? The previous outline is still live and most topics overlap.', 'ستختبر قبل هذا التاريخ؟ المنهج السابق ما زال ساريًا ومعظم المواضيع مشتركة.');
      }
      el.innerHTML = html;
    }
    // ---------- router ----------
    let view = 'home', ctx = {};
    let timer = null;
    const go = (v, c) => { view = v; ctx = c || {}; if (timer && v !== 'mock') { clearInterval(timer); timer = null; } render(); top(); };
    function render() {
      root.classList.toggle('dp-exammode', view === 'mock');
      renderOutline();
      ({ home, practiceSetup, session, mockSetup, mock, results, plan, cases: caseList })[view]();
    }

    // ---------- HOME ----------
    function home() {
      const rd = readiness(), st = stats(ALL), mk = mistakes().length, best = PR.state().mocks.reduce((m, x) => Math.max(m, x.score), 0);
      const inProg = !!MK.current();
      const domRows = Object.keys(DOM).map((d) => {
        const s = stats(ALL.filter((q) => q.d === d));
        return '<div class="dp-domrow"><div class="dp-domtop"><span>' + domName(d) + ' <small><bdi dir="ltr">' + DOM[d].w + '</bdi></small></span><b>' + (s.seen ? Math.round(s.acc * 100) + '%' : '·') + '</b></div>' + bar(s.acc * Math.min(1, s.seen / s.total * 1.6)) + '<div class="dp-domsub">' + L(num(s.seen) + ' of ' + num(s.total) + ' answered', 'أجبت ' + num(s.seen) + ' من ' + num(s.total)) + '</div></div>';
      }).join('');
      root.innerHTML =
        (inProg ? '<div class="dp-resume"><span><i class="bi bi-hourglass-split"></i> ' + L('You have a mock exam in progress.', 'لديك اختبار تجريبي لم يكتمل.') + '</span><button type="button" class="btn btn-accent btn-sm" data-go="resume">' + L('Resume', 'متابعة') + '</button></div>' : '') +
        '<div class="row g-4">' +
        '<div class="col-lg-5"><div class="dp-panel dp-dash">' +
        '<div class="dp-ringwrap">' + ring(rd / 100, '<b>' + rd + '%</b><span>' + L('ready', 'جاهزية') + '</span>') + '</div>' +
        '<div class="dp-kpis"><div><b>' + num(st.seen) + '</b><span>' + L('answered', 'سؤال مُجاب') + '</span></div><div><b>' + (st.seen ? Math.round(st.acc * 100) + '%' : '·') + '</b><span>' + L('accuracy', 'الدقة') + '</span></div><div><b>' + (best || '·') + '</b><span>' + L('best mock', 'أفضل نتيجة') + '</span></div><div><b>' + streak() + '</b><span>' + L('day streak', 'أيام متتالية') + '</span></div></div>' +
        '<div class="dp-doms">' + domRows + '</div>' +
        '<p class="dp-note">' + L('Readiness blends your accuracy with how much of each exam area you have covered, weighted like the real exam.', 'الجاهزية تجمع دقتك مع مقدار ما غطيته من كل محور، بنفس أوزان الاختبار الحقيقي.') + '</p>' +
        '</div></div>' +
        '<div class="col-lg-7"><div class="dp-modes">' +
        modeCard('mock', 'bi-stopwatch', L('Mock exam', 'اختبار تجريبي'), L('Timed, weighted like the real exam, with a case study, flag for review and a score out of 1000.', 'بوقت محدد وأوزان مثل الاختبار الحقيقي، مع دراسة حالة ومراجعة ونتيجة من 1000.'), true) +
        (REN ? modeCard('renewal', 'bi-arrow-clockwise', L('Renewal check', 'اختبار التجديد'), L(num(REN.n) + ' questions · ' + num(REN.min) + ' minutes, only on the ' + num(REN.topics.length) + ' skills Microsoft\'s renewal assessment covers.', num(REN.n) + ' سؤالًا · ' + num(REN.min) + ' دقيقة، فقط على المهارات الـ' + num(REN.topics.length) + ' التي يغطيها تقييم التجديد من Microsoft.')) : '') +
        modeCard('practice', 'bi-lightning-charge', L('Practice by skill', 'تدريب حسب المهارة'), L('Pick a skill, answer, and see why each option is right or wrong.', 'اختر مهارة وأجب، وشاهد لماذا كل خيار صحيح أو خطأ.')) +
        modeCard('cases', 'bi-journal-text', L('Case studies', 'دراسات الحالة'), L('Read a full company scenario and answer its questions.', 'اقرأ سيناريو شركة كامل وأجب عن أسئلته.')) +
        modeCard('mistakes', 'bi-arrow-repeat', L('Review mistakes', 'مراجعة الأخطاء'), mk ? L(num(mk) + ' questions to fix', num(mk) + ' سؤال للمراجعة') : L('Nothing yet. Wrong answers land here.', 'لا شيء بعد. الإجابات الخاطئة تظهر هنا.'), false, !mk) +
        modeCard('bookmarks', 'bi-bookmark-star', L('Bookmarks', 'المحفوظات'), PR.state().bm.length ? L(num(PR.state().bm.length) + ' saved', num(PR.state().bm.length) + ' محفوظ') : L('Save questions to revisit.', 'احفظ أسئلة لتعود إليها.'), false, !PR.state().bm.length) +
        modeCard('plan', 'bi-map', L('Study plan', 'خطة المذاكرة'), L('Your weakest skills first, with the Microsoft Learn pages to read.', 'مهاراتك الأضعف أولًا، مع صفحات Microsoft Learn المناسبة.')) +
        '</div>' +
        (PR.state().mocks.length ? '<div class="dp-panel mt-3"><span class="tg-label">' + L('Mock history', 'سجل الاختبارات') + '</span><div class="dp-hist">' + PR.state().mocks.slice(-8).map((m) => '<div class="dp-histbar ' + (m.score >= 700 ? 'pass' : '') + '" title="' + m.score + '"><span style="height:' + Math.max(6, m.score / 10) + '%"></span><b>' + m.score + '</b></div>').join('') + '<i class="dp-passline"></i></div></div>' : '') +
        '</div></div>';
      root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
        const g = b.dataset.go;
        if (g === 'resume') return go('mock');
        if (g === 'mock') { if (mset === 'renewal') mset = 'full'; return go('mockSetup'); }
        if (g === 'renewal') { mset = 'renewal'; return go('mockSetup'); }
        if (g === 'practice') return go('practiceSetup');
        if (g === 'cases') return go('cases');
        if (g === 'plan') return go('plan');
        if (g === 'mistakes') return startSession(shuffle(mistakes()), 'mistakes');
        if (g === 'bookmarks') return startSession(PR.state().bm.map((id) => byId[id]).filter(Boolean), 'bookmarks');
      }));
    }
    const modeCard = (go, icon, title, desc, primary, disabled) =>
      '<button type="button" class="dp-mode' + (primary ? ' primary' : '') + '" data-go="' + go + '" ' + (disabled ? 'disabled' : '') + '><i class="bi ' + icon + '"></i><span><b>' + title + '</b><small>' + desc + '</small></span></button>';

    // ---------- PRACTICE SETUP ----------
    let pset = { skill: 'all', diff: 0, count: 10, fresh: true };
    function practiceSetup() {
      const chip = (k, label, sel, attr) => '<button type="button" class="tg-preset' + (sel ? ' active' : '') + '" ' + attr + '="' + k + '">' + label + '</button>';
      const skills = ['all', 'weak'].concat(Object.keys(SKILL));
      root.innerHTML = back() + '<div class="dp-panel dp-setup"><h2 class="h4 fw-bold">' + L('Practice by skill', 'تدريب حسب المهارة') + '</h2>' +
        '<span class="tg-label">' + L('Skill', 'المهارة') + '</span><div class="dp-chips">' + skills.map((s) => {
          const label = s === 'all' ? L('All skills', 'كل المهارات') : s === 'weak' ? L('Weakest first', 'الأضعف أولًا') : skillName(s) + ' <small>' + stats(ALL.filter((q) => q.s === s)).total + '</small>';
          return chip(s, label, pset.skill === s, 'data-skill');
        }).join('') + '</div>' +
        '<span class="tg-label mt-3">' + L('Difficulty', 'الصعوبة') + '</span><div class="dp-chips">' + [[0, L('Any', 'الكل')], [1, L('Easy', 'سهل')], [2, L('Medium', 'متوسط')], [3, L('Hard', 'صعب')]].map((d) => chip(d[0], d[1], pset.diff === d[0], 'data-diff')).join('') + '</div>' +
        '<span class="tg-label mt-3">' + L('Questions', 'عدد الأسئلة') + '</span><div class="dp-chips">' + [10, 20, 40, 0].map((n) => chip(n, n ? num(n) : L('All', 'الكل'), pset.count === n, 'data-count')).join('') + '</div>' +
        '<label class="dp-check mt-3"><input type="checkbox" id="dpFresh" ' + (pset.fresh ? 'checked' : '') + '> ' + L('Questions I have not answered yet first', 'الأسئلة التي لم أجب عنها أولًا') + '</label>' +
        '<div class="mt-4"><button type="button" class="btn btn-accent" id="dpStart">' + L('Start practice', 'ابدأ التدريب') + ' <i class="bi bi-arrow-right"></i></button> <span class="dp-note ms-2" id="dpAvail"></span></div></div>';
      const pool = () => {
        let list = ALL.filter((q) => !q.caseId);
        if (pset.skill !== 'all' && pset.skill !== 'weak') list = list.filter((q) => q.s === pset.skill);
        if (pset.diff) list = list.filter((q) => q.diff === pset.diff);
        return list;
      };
      const upd = () => { root.querySelector('#dpAvail').textContent = L(num(pool().length) + ' questions available', num(pool().length) + ' سؤال متاح'); };
      upd();
      const bindChip = (attr, key, cast) => root.querySelectorAll('[' + attr + ']').forEach((b) => b.addEventListener('click', () => { pset[key] = cast(b.getAttribute(attr)); practiceSetup(); }));
      bindChip('data-skill', 'skill', String); bindChip('data-diff', 'diff', Number); bindChip('data-count', 'count', Number);
      root.querySelector('#dpFresh').addEventListener('change', (e) => { pset.fresh = e.target.checked; });
      bindBack();
      root.querySelector('#dpStart').addEventListener('click', () => {
        let list = shuffle(pool());
        if (pset.skill === 'weak') {
          const acc = PR.skillAccuracy();
          list.sort((a, b) => acc[a.s] - acc[b.s]);
        }
        if (pset.fresh) list.sort((a, b) => rank(a.id) - rank(b.id));
        if (pset.count) list = list.slice(0, pset.count);
        if (!list.length) return toast(L('No questions match. Try another filter.', 'لا توجد أسئلة مطابقة. جرّب اختيارًا آخر.'));
        track(EX.ev + '_practice_start', { skill: pset.skill, count: list.length });
        startSession(list, 'practice');
      });
    }
    const back = () => '<button type="button" class="dp-back" id="dpBack"><i class="bi bi-arrow-left"></i> ' + L('Dashboard', 'لوحة التقدم') + '</button>';
    const bindBack = () => { const b = root.querySelector('#dpBack'); if (b) b.addEventListener('click', () => go('home')); };

    // ---------- PRACTICE / REVIEW SESSION ----------
    function startSession(list, kind, extra) {
      if (!list.length) return;
      go('session', Object.assign({ kind, items: list.map(newInst), i: 0, checked: {}, score: 0 }, extra || {}));
    }
    function session() {
      const c = ctx;
      if (c.i >= c.items.length) return sessionEnd();
      const inst = c.items[c.i], q = byId[inst.id], done = c.checked[c.i] != null;
      const cs = caseOf(q);
      const title = { practice: L('Practice', 'تدريب'), mistakes: L('Review mistakes', 'مراجعة الأخطاء'), bookmarks: L('Bookmarks', 'المحفوظات'), case: L('Case study', 'دراسة حالة') }[c.kind];
      root.innerHTML = back() +
        '<div class="dp-sbar"><span><b>' + title + '</b> · ' + L('Question ' + (c.i + 1) + ' of ' + c.items.length, 'سؤال ' + (c.i + 1) + ' من ' + c.items.length) + '</span><span class="dp-sscore"><i class="bi bi-check2-circle"></i> ' + num(c.score) + '</span></div>' + bar((c.i + (done ? 1 : 0)) / c.items.length, 'thin') +
        '<div class="' + (cs ? 'dp-split' : '') + '">' + (cs ? caseHTML(cs) : '') +
        '<div class="dp-panel dp-qpanel"><div class="dp-qmeta"><span class="dp-tag">' + skillName(q.s) + '</span><span class="dp-tag alt">' + esc(q.tag) + '</span>' + diffDots(q.diff) + '<button type="button" class="dp-bm' + (isBm(q.id) ? ' on' : '') + '" id="dpBm" aria-label="' + L('Bookmark', 'حفظ') + '"><i class="bi bi-bookmark' + (isBm(q.id) ? '-fill' : '') + '"></i></button></div>' +
        '<div id="dpQ">' + qHTML(q, inst, done) + '</div>' + (done ? explainHTML(q, inst.r) : '') +
        '<div class="dp-actions">' + (done
          ? '<button type="button" class="btn btn-accent" id="dpNext">' + (c.i + 1 < c.items.length ? L('Next question', 'السؤال التالي') : L('See summary', 'عرض الملخص')) + ' <i class="bi bi-arrow-right"></i></button>'
          : '<button type="button" class="btn btn-accent" id="dpCheck" ' + (answered(q, inst.r) ? '' : 'disabled') + '>' + L('Check answer', 'تحقق من الإجابة') + '</button><button type="button" class="tg-btn2" id="dpSkip">' + L('Skip', 'تخطي') + '</button>') +
        '</div></div></div>';
      bindBack();
      root.querySelector('#dpBm').addEventListener('click', () => { toggleBm(q.id); session(); });
      if (!done) {
        bindQ(root.querySelector('#dpQ'), q, inst, session);
        root.querySelector('#dpCheck').addEventListener('click', check);
        root.querySelector('#dpSkip').addEventListener('click', () => { if (c.i >= c.items.length - 1) c.i++; else c.items.push(c.items.splice(c.i, 1)[0]); session(); top(); });
      } else {
        bindQ(root.querySelector('.dp-exp'), q, inst, () => {});
        root.querySelector('#dpNext').addEventListener('click', () => { c.i++; session(); top(); });
      }
    }
    function check() {
      const c = ctx, inst = c.items[c.i], q = byId[inst.id];
      if (!answered(q, inst.r)) return;
      const g = grade(q, inst.r);
      c.checked[c.i] = g; c.score += g === 1 ? 1 : 0;
      record(q, g === 1);
      session();
      const e = root.querySelector('.dp-exp'); if (e && e.getBoundingClientRect().top > window.innerHeight - 120) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    function sessionEnd() {
      const c = ctx, { n, right, bySkill, byDom } = tallySession(c.items, c.checked, byId);
      root.innerHTML = back() + '<div class="dp-panel text-center dp-end"><div class="dp-ringwrap">' + ring(n ? right / n : 0, '<b>' + num(right) + '/' + num(n) + '</b><span>' + L('correct', 'صحيحة') + '</span>') + '</div>' +
        '<h2 class="h4 fw-bold mt-3">' + (n && right / n >= 0.8 ? L('Strong session', 'جلسة قوية') : L('Session complete', 'انتهت الجلسة')) + '</h2>' +
        (Object.keys(byDom).length ? '<div class="dp-enddoms text-start"><span class="tg-label">' + L('By exam area', 'حسب محور الاختبار') + '</span>' + Object.keys(DOM).filter((d) => byDom[d]).map((d) => domRow(d, byDom[d][0], byDom[d][1])).join('') + '</div>' : '') +
        '<div class="dp-skilltable">' + Object.keys(bySkill).map((s) => '<div><span>' + skillName(s) + '</span>' + bar(bySkill[s][0] / bySkill[s][1], bySkill[s][0] / bySkill[s][1] >= 0.7 ? 'good' : 'warn') + '<b>' + bySkill[s][0] + '/' + bySkill[s][1] + '</b></div>').join('') + '</div>' +
        '<div class="dp-actions justify-content-center"><button type="button" class="btn btn-accent" data-a="again">' + L('Practice more', 'تدرّب أكثر') + '</button>' + (mistakes().length ? '<button type="button" class="tg-btn2" data-a="mist">' + L('Review mistakes', 'راجع الأخطاء') + ' (' + num(mistakes().length) + ')</button>' : '') + '</div></div>';
      bindBack();
      root.querySelectorAll('[data-learn]').forEach((a) => a.addEventListener('click', () => track(EX.ev + '_learn_click', { from: 'practice' })));
      root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => (b.dataset.a === 'again' ? go('practiceSetup') : startSession(shuffle(mistakes()), 'mistakes'))));
    }

    // ---------- CASE STUDIES ----------
    function caseList() {
      root.innerHTML = back() + '<div class="row g-4">' + CASES.map((c) => {
        const st = stats(c.questions);
        const intro = (c.scenario.match(/<p>(.*?)<\/p>/) || ['', ''])[1];
        return '<div class="col-md-6"><div class="dp-panel h-100 d-flex flex-column"><span class="dp-tag">' + c.id + '</span><h2 class="h5 fw-bold mt-2" lang="en" dir="ltr">' + esc(c.title) + '</h2><p class="dp-note flex-grow-1" lang="en" dir="ltr">' + intro + '</p><div class="dp-note mb-2">' + L(num(c.questions.length) + ' questions · ' + num(st.right) + ' correct so far', num(c.questions.length) + ' أسئلة · ' + num(st.right) + ' صحيحة حتى الآن') + '</div><button type="button" class="btn btn-accent align-self-start" data-case="' + c.id + '">' + L('Start case study', 'ابدأ دراسة الحالة') + '</button></div></div>';
      }).join('') + '</div><p class="dp-note mt-3">' + L('On the real exam, case studies come as a separate section. Read the scenario first, then answer. The scenario stays next to every question.', 'في الاختبار الحقيقي تأتي دراسات الحالة كقسم منفصل. اقرأ السيناريو أولًا ثم أجب، وسيبقى السيناريو بجانب كل سؤال.') + '</p>';
      bindBack();
      root.querySelectorAll('[data-case]').forEach((b) => b.addEventListener('click', () => {
        const c = CASES.find((x) => x.id === b.dataset.case);
        track(EX.ev + '_case_start', { case_id: c.id });
        startSession(c.questions.slice(), 'case');
      }));
    }

    // ---------- STUDY PLAN ----------
    function plan() {
      const rows = PR.planRows();
      const status = { new: L('Not started', 'لم تبدأ'), weak: L('Needs work', 'تحتاج جهدًا'), mid: L('Getting there', 'في الطريق'), good: L('Strong', 'قوية') };
      root.innerHTML = back() + '<div class="dp-panel"><h2 class="h4 fw-bold">' + L('Your study plan', 'خطة مذاكرتك') + '</h2><p class="dp-note">' + L('Work top to bottom. Each skill links to the Microsoft Learn pages our questions draw on most.', 'ابدأ من الأعلى. كل مهارة مرتبطة بصفحات Microsoft Learn التي تعتمد عليها أسئلتنا أكثر.') + '</p>' +
        rows.map(({ s, st, k }) => {
          const lab = status[k];
          return '<div class="dp-planrow"><div class="dp-plantop"><div><b>' + skillName(s) + '</b> <small class="dp-note">' + domName(SKILL[s].d) + '</small></div><span class="dp-status ' + k + '">' + lab + '</span></div>' +
            '<div class="dp-planmid">' + bar(st.acc * Math.min(1, st.seen / st.total * 1.6)) + '<span class="dp-note">' + L(num(st.seen) + '/' + num(st.total) + ' answered · ' + (st.seen ? Math.round(st.acc * 100) + '% right' : 'no answers yet'), 'أجبت ' + num(st.seen) + '/' + num(st.total) + ' · ' + (st.seen ? Math.round(st.acc * 100) + '% صحيحة' : 'لا إجابات بعد')) + '</span></div>' +
            '<div class="dp-planlinks" lang="en" dir="ltr">' + LEARN[s].map((r) => '<a href="' + esc(r.u) + '" target="_blank" rel="noopener" data-learn><i class="bi bi-book"></i> ' + esc(r.t) + '</a>').join('') + '</div>' +
            '<button type="button" class="tg-btn2 btn-sm" data-skill="' + s + '">' + L('Practice this skill', 'تدرّب على هذه المهارة') + '</button></div>';
        }).join('') +
        '<div class="dp-official"><b>' + L('Official Microsoft resources (free)', 'مصادر Microsoft الرسمية (مجانية)') + '</b><ul>' +
        EX.official.map((o) => '<li><a href="' + o[0] + '" target="_blank" rel="noopener" data-learn>' + L(o[1], o[2]) + '</a></li>').join('') + '</ul></div></div>';
      bindBack();
      root.querySelectorAll('[data-learn]').forEach((a) => a.addEventListener('click', () => track(EX.ev + '_learn_click', { from: 'plan' })));
      root.querySelectorAll('[data-skill]').forEach((b) => b.addEventListener('click', () => { pset.skill = b.dataset.skill; go('practiceSetup'); }));
    }

    // ---------- MOCK EXAM ----------
    const MOCKS = SES.lengths(REN);
    let mset = 'full';
    function mockSetup() {
      const card = (k, t, d) => '<button type="button" class="dp-mode' + (mset === k ? ' primary' : '') + '" data-len="' + k + '"><i class="bi ' + (k === 'full' ? 'bi-trophy' : k === 'half' ? 'bi-hourglass-split' : 'bi-lightning') + '"></i><span><b>' + t + '</b><small>' + d + '</small></span></button>';
      if (mset === 'renewal' && REN) return renewalSetup();
      root.innerHTML = back() + '<div class="dp-panel dp-setup"><h2 class="h4 fw-bold">' + L('Mock exam', 'اختبار تجريبي') + '</h2>' +
        '<div class="dp-modes one">' +
        card('full', L('Full exam', 'اختبار كامل'), L('50 questions including a 6-question case study · 100 minutes', '50 سؤالًا منها دراسة حالة من 6 أسئلة · 100 دقيقة')) +
        card('half', L('Half exam', 'نصف اختبار'), L('25 questions · 50 minutes', '25 سؤالًا · 50 دقيقة')) +
        card('quick', L('Quick check', 'اختبار سريع'), L('10 questions · 15 minutes', '10 أسئلة · 15 دقيقة')) + '</div>' +
        '<ul class="dp-rules">' +
        '<li>' + L(EX.mixText[0], EX.mixText[1]) + '</li>' +
        '<li>' + L('No answers are shown until you submit. Flag questions and use the review screen, like on the real exam.', 'لا تظهر الإجابات حتى التسليم. علّم الأسئلة واستخدم شاشة المراجعة كما في الاختبار الحقيقي.') + '</li>' +
        '<li>' + L('Scored out of 1000 with 700 to pass. Multiple-answer and Yes/No questions can earn partial credit.', 'النتيجة من 1000 والنجاح من 700. أسئلة الاختيارات المتعددة ونعم/لا تمنح درجات جزئية.') + '</li>' +
        '<li>' + L('Your exam is saved if you close the tab. The timer keeps running.', 'يُحفظ اختبارك إذا أغلقت الصفحة، لكن الوقت يستمر.') + '</li></ul>' +
        '<button type="button" class="btn btn-accent mt-2" id="dpGo">' + L('Start exam', 'ابدأ الاختبار') + ' <i class="bi bi-arrow-right"></i></button></div>';
      bindBack();
      root.querySelectorAll('[data-len]').forEach((b) => b.addEventListener('click', () => { mset = b.dataset.len; mockSetup(); }));
      root.querySelector('#dpGo').addEventListener('click', () => {
        const go2 = () => { buildMock(mset); go('mock'); };
        if (MK.running()) modal(L('Replace the exam in progress?', 'استبدال الاختبار الحالي؟'), L('Your unfinished mock exam will be discarded.', 'سيتم حذف الاختبار غير المكتمل.'), L('Start new exam', 'ابدأ اختبارًا جديدًا'), go2);
        else go2();
      });
    }
    // Renewal check: what Microsoft's renewal assessment is (from its pages on Microsoft Learn), and the 9 skills it covers
    function renewalSetup() {
      const d = (iso) => new Date(iso + 'T00:00:00Z').toLocaleDateString(isAr() ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      root.innerHTML = back() + '<div class="dp-panel dp-setup"><h2 class="h4 fw-bold">' + L(EX.code + ' renewal check', 'اختبار تجديد ' + EX.code) + '</h2>' +
        '<p class="dp-note">' + L('A short check on the skills Microsoft\'s renewal assessment covers, instead of a full mock exam.', 'اختبار قصير على المهارات التي يغطيها تقييم التجديد من Microsoft، بدل اختبار تجريبي كامل.') + '</p>' +
        '<span class="tg-label mt-2">' + L('The real renewal, per Microsoft', 'التجديد الحقيقي كما تقول Microsoft') + '</span>' +
        '<ul class="dp-rules">' +
        '<li>' + L('Free and online on Microsoft Learn, and only on what has changed. Microsoft says it takes about ' + num(REN.min) + ' minutes; it doesn\'t publish the number of questions or the pass mark.', 'مجاني وعبر الإنترنت على Microsoft Learn، ويركّز فقط على ما تغيّر. تقول Microsoft إنه يستغرق نحو ' + num(REN.min) + ' دقيقة، ولا تنشر عدد الأسئلة ولا درجة النجاح.') + '</li>' +
        '<li>' + L('It opens 6 months before your certification expires and must be passed before it expires. A pass updates your expiry date at once.', 'يُفتح قبل انتهاء الشهادة بستة أشهر ويجب اجتيازه قبل انتهائها. عند النجاح يتحدّث تاريخ الانتهاء فورًا.') + '</li>' +
        '<li>' + L('Retakes are unlimited: one more try straight away, then at least 24 hours between attempts.', 'المحاولات غير محدودة: محاولة ثانية فورًا، ثم 24 ساعة على الأقل بين المحاولات.') + '</li></ul>' +
        '<span class="tg-label mt-3">' + L('The ' + num(REN.topics.length) + ' skills it measures (Microsoft updated them on ' + d(REN.updated) + ')', 'المهارات الـ' + num(REN.topics.length) + ' التي يقيسها (حدّثتها Microsoft في ' + d(REN.updated) + ')') + '</span>' +
        '<ol class="dp-rules">' + REN.topics.map((t) => '<li><a href="' + esc(t.learn) + '" target="_blank" rel="noopener" data-learn>' + esc(L(t.en, t.ar)) + '</a></li>').join('') + '</ol>' +
        '<span class="tg-label mt-3">' + L('This check', 'هذا الاختبار') + '</span>' +
        '<ul class="dp-rules">' +
        '<li>' + L(num(REN.n) + ' questions in ' + num(REN.min) + ' minutes, about the same share from each skill. ' + num(REN.n) + ' is our choice, since Microsoft doesn\'t publish the count.', num(REN.n) + ' سؤالًا في ' + num(REN.min) + ' دقيقة، بحصة متقاربة من كل مهارة. عدد ' + num(REN.n) + ' اختيارنا لأن Microsoft لا تنشر العدد.') + '</li>' +
        '<li>' + L('No answers until you submit. Your result shows each skill, with Microsoft\'s module to study for the ones to work on.', 'لا تظهر الإجابات حتى التسليم. النتيجة تُظهر كل مهارة، مع وحدة Microsoft للمذاكرة لما يحتاج تحسينًا.') + '</li>' +
        '<li>' + L('Scored out of 1000 with 700 as a guide, as in our mock exams. The real renewal\'s pass mark isn\'t published.', 'النتيجة من 1000 وحد الـ700 دليل فقط كما في اختباراتنا التجريبية. درجة نجاح التجديد الحقيقي غير منشورة.') + '</li></ul>' +
        '<p class="dp-note">' + L('From Microsoft Learn, checked ' + d(REN.checked) + ': ', 'من Microsoft Learn، تم التحقق في ' + d(REN.checked) + ': ') + '<a href="' + esc(REN.url) + '" target="_blank" rel="noopener" data-learn>' + L('the renewal page', 'صفحة التجديد') + '</a> · <a href="' + esc(REN.faq) + '" target="_blank" rel="noopener" data-learn>' + L('renewal FAQ', 'الأسئلة الشائعة عن التجديد') + '</a></p>' +
        '<button type="button" class="btn btn-accent mt-2" id="dpGo">' + L('Start renewal check', 'ابدأ اختبار التجديد') + ' <i class="bi bi-arrow-right"></i></button></div>';
      bindBack();
      root.querySelectorAll('[data-learn]').forEach((a) => a.addEventListener('click', () => track(EX.ev + '_learn_click', { from: 'renewal' })));
      root.querySelector('#dpGo').addEventListener('click', () => {
        const go2 = () => { buildMock('renewal'); go('mock'); };
        if (MK.running()) modal(L('Replace the exam in progress?', 'استبدال الاختبار الحالي؟'), L('Your unfinished mock exam will be discarded.', 'سيتم حذف الاختبار غير المكتمل.'), L('Start new', 'ابدأ جديدًا'), go2);
        else go2();
      });
    }
    function buildMock(kind) {
      const cfg = MOCKS[kind];
      const { ids, caseId } = kind === 'renewal' ? { ids: SES.pickRenewal(cfg.n, { topics: REN.topics, questions: QS, rank, rand: Math.random }), caseId: null }
        : SES.pickMock(cfg, { questions: QS, cases: CASES, domains: DOM, skills: SKILL, mix: EX.mix, rank, rand: Math.random });
      MK.start({ kind, ids, caseId, min: cfg.min }, (id) => newInst(byId[id]));
      track(EX.ev + '_mock_start', { length: kind, questions: ids.length });
    }
    function mock() {
      const M = MK.current();
      if (!M) return go('home');
      if (MK.expired()) return submitMock(true);
      if (ctx.review) return mockReview();
      const inst = M.items[M.i], q = byId[inst.id], cs = caseOf(q), flagged = MK.flagged();
      root.innerHTML =
        '<div class="dp-exambar"><span class="dp-ex-title">' + EX.code + ' ' + (M.kind === 'renewal' ? L('renewal check', 'اختبار التجديد') : L('mock exam', 'اختبار تجريبي')) + '</span><span class="dp-ex-count">' + (M.i + 1) + ' / ' + M.items.length + '</span><span class="dp-timer" id="dpTimer"><i class="bi bi-clock"></i> <b></b></span></div>' +
        bar(M.items.filter((it) => answered(byId[it.id], it.r)).length / M.items.length, 'thin') +
        '<div class="' + (cs ? 'dp-split' : '') + '">' + (cs ? caseHTML(cs) : '') +
        '<div class="dp-panel dp-qpanel">' + '<div class="dp-qmeta"><span class="dp-tag">' + (cs ? 'Case study' : L('Question', 'سؤال') + ' ' + (M.i + 1)) + '</span><button type="button" class="dp-flag' + (flagged ? ' on' : '') + '" id="dpFlag"><i class="bi bi-flag' + (flagged ? '-fill' : '') + '"></i> ' + L('Review later', 'مراجعة لاحقًا') + '</button></div>' +
        '<div id="dpQ">' + qHTML(q, inst, false) + '</div>' +
        '<div class="dp-actions dp-exnav"><button type="button" class="tg-btn2" id="dpPrev" ' + (M.i === 0 ? 'disabled' : '') + '><i class="bi bi-arrow-left"></i> ' + L('Previous', 'السابق') + '</button>' +
        '<button type="button" class="tg-btn2" id="dpRev"><i class="bi bi-grid-3x3-gap"></i> ' + L('Review', 'مراجعة') + '</button>' +
        (M.i + 1 < M.items.length ? '<button type="button" class="btn btn-accent" id="dpNext">' + L('Next', 'التالي') + ' <i class="bi bi-arrow-right"></i></button>' : '<button type="button" class="btn btn-accent" id="dpRev2">' + L('Review and submit', 'مراجعة وتسليم') + '</button>') +
        '</div></div></div>';
      bindQ(root.querySelector('#dpQ'), q, inst, () => { MK.changed(); const y = window.scrollY; mock(); window.scrollTo(0, y); });
      root.querySelector('#dpFlag').addEventListener('click', () => { MK.flag(); mock(); });
      root.querySelector('#dpPrev').addEventListener('click', () => { MK.prev(); mock(); top(); });
      const nx = root.querySelector('#dpNext'); if (nx) nx.addEventListener('click', () => { MK.next(); mock(); top(); });
      root.querySelector('#dpRev').addEventListener('click', () => { ctx.review = true; mock(); top(); });
      const r2 = root.querySelector('#dpRev2'); if (r2) r2.addEventListener('click', () => { ctx.review = true; mock(); top(); });
      startTimer();
    }
    function startTimer() {
      const tick = () => {
        if (!MK.current()) return;
        const { left, low, up } = MK.clock();
        const t = document.querySelector('#dpTimer b'); if (t) { t.textContent = fmtTime(left); t.parentElement.classList.toggle('low', low); }
        if (up) { clearInterval(timer); timer = null; submitMock(true); }
      };
      if (!timer) timer = setInterval(tick, 1000);
      tick();
    }
    function mockReview() {
      const M = MK.current();
      const un = M.items.filter((it) => !answered(byId[it.id], it.r)).length;
      root.innerHTML = '<div class="dp-exambar"><span class="dp-ex-title">' + L('Review your answers', 'راجع إجاباتك') + '</span><span></span><span class="dp-timer" id="dpTimer"><i class="bi bi-clock"></i> <b></b></span></div>' +
        '<div class="dp-panel"><div class="dp-legend"><span><i class="dp-sq done"></i>' + L('Answered', 'مُجاب') + '</span><span><i class="dp-sq"></i>' + L('Not answered', 'غير مُجاب') + '</span><span><i class="bi bi-flag-fill text-warning"></i> ' + L('Flagged', 'معلّم') + '</span></div>' +
        '<div class="dp-grid">' + M.items.map((it, i) => {
          const q = byId[it.id];
          return '<button type="button" class="dp-cell' + (answered(q, it.r) ? ' done' : '') + (M.flags.includes(i) ? ' flag' : '') + (q.caseId ? ' cs' : '') + '" data-j="' + i + '">' + (i + 1) + '</button>';
        }).join('') + '</div>' +
        '<div class="dp-actions"><button type="button" class="tg-btn2" id="dpBackQ"><i class="bi bi-arrow-left"></i> ' + L('Back to questions', 'رجوع للأسئلة') + '</button>' + (M.flags.length ? '<button type="button" class="tg-btn2" id="dpFlagged"><i class="bi bi-flag"></i> ' + L('Review flagged', 'راجع المعلّمة') + '</button>' : '') + '<button type="button" class="btn btn-accent" id="dpSubmit">' + L('Submit exam', 'سلّم الاختبار') + '</button></div>' +
        (un ? '<p class="dp-note mt-2 text-warning">' + L(un + ' question(s) not answered. Unanswered questions score zero.', 'يوجد ' + un + ' سؤال بلا إجابة، وسيُحسب صفرًا.') + '</p>' : '') + '</div>';
      root.querySelectorAll('[data-j]').forEach((b) => b.addEventListener('click', () => { MK.move(+b.dataset.j); ctx.review = false; mock(); top(); }));
      root.querySelector('#dpBackQ').addEventListener('click', () => { ctx.review = false; mock(); });
      const fl = root.querySelector('#dpFlagged'); if (fl) fl.addEventListener('click', () => { MK.firstFlagged(); ctx.review = false; mock(); top(); });
      root.querySelector('#dpSubmit').addEventListener('click', () => modal(L('Submit your exam?', 'تسليم الاختبار؟'), un ? L('You still have ' + un + ' unanswered question(s).', 'لا يزال لديك ' + un + ' سؤال بلا إجابة.') : L('You can review every answer and explanation after submitting.', 'ستتمكن من مراجعة كل إجابة وشرحها بعد التسليم.'), L('Submit', 'تسليم'), () => submitMock(false)));
      startTimer();
    }
    function submitMock(timeUp) {
      const M = MK.current(); if (!M) return;
      if (timer) { clearInterval(timer); timer = null; }
      const { res, score, dom, sk, ren } = scoreMock(M.items, byId, { domains: Object.keys(DOM), renTopic, renewal: M.kind === 'renewal' });
      const used = MK.used();
      const rec = Object.assign({ t: Date.now(), kind: M.kind, score, pass: score >= 700, n: M.items.length, used, dom, sk }, M.kind === 'renewal' ? { ren } : {});
      PR.recordMock(M.items.map((it) => ({ q: byId[it.id], r: it.r })), res, answered, rec);
      const last = { rec, items: M.items, flags: M.flags, res, timeUp };
      MK.end();
      track(EX.ev + '_mock_finish', { length: rec.kind, score, passed: rec.pass, questions: rec.n, time_used_min: Math.round(used / 60) });
      go('results', { last, filter: 'all' });
    }

    // ---------- RESULTS ----------
    function results() {
      const { last } = ctx; if (!last) return go('home');
      const r = last.rec, pass = r.pass;
      const f = ctx.filter;
      const rows = last.items.map((it, i) => ({ it, i, q: byId[it.id], g: last.res[i] }))
        .filter((x) => f === 'all' || (f === 'wrong' && x.g < 1) || (f === 'flag' && last.flags.includes(x.i)));
      root.innerHTML = back() +
        (last.timeUp ? '<div class="dp-resume"><span><i class="bi bi-alarm"></i> ' + L('Time is up. Your exam was submitted automatically.', 'انتهى الوقت وتم تسليم الاختبار تلقائيًا.') + '</span></div>' : '') +
        '<div class="row g-4"><div class="col-lg-5"><div class="dp-panel text-center dp-score">' +
        '<div class="dp-ringwrap big">' + ring(r.score / 1000, '<b>' + r.score + '</b><span>/ 1000</span>', pass ? '#22c55e' : '#f59e0b') + '</div>' +
        '<div class="dp-passbadge cap-pill ' + (pass ? 'pass' : 'fail') + '">' + (pass ? L('Pass', 'ناجح') : L('Not yet', 'ليس بعد')) + '</div>' +
        '<p class="dp-note mt-2">' + L('Passing score: 700. Time used: ' + fmtTime(r.used) + '.', 'درجة النجاح: 700. الوقت المستخدم: ' + fmtTime(r.used) + '.') + '</p>' +
        (r.ren ? '<p class="dp-note">' + L('Microsoft doesn\'t publish the renewal assessment\'s pass mark: 700 here is the same guide as our mock exams.', 'Microsoft لا تنشر درجة نجاح تقييم التجديد: الـ700 هنا دليل فقط كما في اختباراتنا التجريبية.') + '</p>' : '') +
        '<p class="dp-note">' + L('This is an estimate from original practice questions. Microsoft scales real exam scores differently.', 'هذه نتيجة تقديرية من أسئلة تدريبية أصلية. Microsoft تحسب نتائج الاختبار الحقيقي بطريقة مختلفة.') + '</p>' +
        '<div class="dp-actions justify-content-center"><button type="button" class="btn btn-accent" data-a="retake">' + L('New mock exam', 'اختبار جديد') + '</button><button type="button" class="tg-btn2" data-a="weak">' + L('Practice weak skills', 'تدرّب على نقاط الضعف') + '</button></div>' +
        '<button type="button" class="dp-share" data-a="share"><i class="bi bi-linkedin"></i> ' + L('Share my score', 'شارك نتيجتي') + '</button>' +
        '</div></div><div class="col-lg-7"><div class="dp-panel">' + (r.ren && REN ?
        // a renewal check: the renewal skills, each under 70% with Microsoft's module to study
        '<span class="tg-label">' + L('By renewal skill', 'حسب مهارة التجديد') + '</span>' +
        REN.topics.filter((t) => r.ren[t.k]).map((t) => { const v = r.ren[t.k], p = v[0] / v[1]; return '<div class="dp-domrow"><div class="dp-domtop"><span><bdi>' + esc(renName(t.k)) + '</bdi> <small><bdi>' + L(num(v[1]) + (v[1] === 1 ? ' question' : ' questions'), v[1] === 1 ? 'سؤال واحد' : v[1] === 2 ? 'سؤالان' : num(v[1]) + ' أسئلة') + '</bdi></small></span><b>' + Math.round(p * 100) + '%</b></div>' + bar(p, p >= 0.7 ? 'good' : 'warn') + (p < 0.7 ? '<div class="dp-domsub"><a href="' + esc(t.learn) + '" target="_blank" rel="noopener" data-learn><i class="bi bi-book"></i> ' + L('Study: Microsoft Learn module', 'ذاكر: وحدة Microsoft Learn') + '</a></div>' : '') + '</div>'; }).join('') :
        '<span class="tg-label">' + L('By exam area', 'حسب محور الاختبار') + '</span>' +
        Object.keys(DOM).map((d) => domRow(d, r.dom[d][0], r.dom[d][1])).join('')) +
        '<span class="tg-label mt-3">' + L('By skill', 'حسب المهارة') + '</span><div class="dp-skilltable">' + Object.keys(r.sk).map((s) => { const v = r.sk[s]; return '<div><span>' + skillName(s) + '</span>' + bar(v[0] / v[1], v[0] / v[1] >= 0.7 ? 'good' : 'warn') + '<b>' + Math.round(v[0] / v[1] * 100) + '%</b></div>'; }).join('') + '</div></div></div></div>' +
        '<div class="dp-panel mt-4"><div class="dp-revhead"><span class="tg-label mb-0">' + L('Review answers', 'مراجعة الإجابات') + '</span><div class="mb-seg">' +
        [['all', L('All', 'الكل')], ['wrong', L('Incorrect', 'الخاطئة')], ['flag', L('Flagged', 'المعلّمة')]].map((x) => '<button type="button" data-f="' + x[0] + '" class="' + (f === x[0] ? 'active' : '') + '">' + x[1] + '</button>').join('') + '</div></div>' +
        (rows.length ? rows.map((x) => '<details class="dp-rev"><summary><span class="dp-revn">' + (x.i + 1) + '</span><i class="bi ' + (x.g === 1 ? 'bi-check-circle-fill ok' : x.g > 0 ? 'bi-dash-circle-fill part' : 'bi-x-circle-fill bad') + '"></i><span class="dp-revq" lang="en" dir="ltr">' + esc(x.q.q.replace(/<pre>[\s\S]*?<\/pre>/g, ' [code] ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').slice(0, 140)) + '…</span><span class="dp-tag">' + skillName(x.q.s) + '</span></summary><div class="dp-revbody" data-k="' + x.i + '"></div></details>').join('') : '<p class="dp-note">' + L('Nothing here.', 'لا يوجد شيء هنا.') + '</p>') + '</div>';
      bindBack();
      root.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { ctx.filter = b.dataset.f; results(); }));
      root.querySelectorAll('[data-learn]').forEach((a) => a.addEventListener('click', () => track(EX.ev + '_learn_click', { from: 'results' })));
      root.querySelectorAll('details.dp-rev').forEach((d) => d.addEventListener('toggle', () => {
        const body = d.querySelector('.dp-revbody'); if (!d.open || body.innerHTML) return;
        const i = +body.dataset.k, it = last.items[i], q = byId[it.id], cs = caseOf(q);
        body.innerHTML = (cs ? '<details class="dp-csmini"><summary>' + L('Show case study', 'عرض دراسة الحالة') + '</summary>' + caseHTML(cs) + '</details>' : '') + qHTML(q, it, true) + explainHTML(q, it.r) + '<button type="button" class="dp-bm' + (isBm(q.id) ? ' on' : '') + '" data-bmq="' + q.id + '"><i class="bi bi-bookmark' + (isBm(q.id) ? '-fill' : '') + '"></i> ' + L('Bookmark', 'حفظ') + '</button>';
        bindQ(body, q, it, () => {});
        body.querySelector('[data-bmq]').addEventListener('click', (e) => { toggleBm(q.id); const b = e.currentTarget; b.classList.toggle('on', isBm(q.id)); b.querySelector('i').className = 'bi bi-bookmark' + (isBm(q.id) ? '-fill' : ''); });
      }));
      root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.a;
        if (a === 'retake') { mset = r.kind === 'renewal' ? 'renewal' : (mset === 'renewal' ? 'full' : mset); go('mockSetup'); }
        if (a === 'weak') { pset = Object.assign(pset, { skill: 'weak', diff: 0, count: 20, fresh: false }); go('practiceSetup'); }
        if (a === 'share') {
          track(EX.ev + '_share', { score: r.score });
          const url = EX.page + '?utm_source=linkedin&utm_medium=social&utm_campaign=' + EX.ev + '_share';
          window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url), '_blank', 'noopener');
        }
      }));
    }

    // ---------- keyboard ----------
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
      if (view !== 'session' && view !== 'mock') return;
      const k = e.key;
      if (/^[1-8]$/.test(k)) { const opts = root.querySelectorAll('.dp-q [data-opt]:not([disabled]), .dp-q [data-add]:not([disabled])'); const b = opts[+k - 1]; if (b) { b.click(); e.preventDefault(); } }
      if (k === 'Enter' && view === 'session') { const b = root.querySelector('#dpCheck:not([disabled]), #dpNext'); if (b && document.activeElement.tagName !== 'BUTTON') { b.click(); e.preventDefault(); } }
    });

    // ---------- reset ----------
    // delegated: the button sits inside translated HTML that is replaced on language change
    document.addEventListener('click', (e) => { if (!e.target.closest('#dpReset')) return; modal(L('Reset all progress?', 'مسح كل التقدم؟'), L('This clears your answers, bookmarks and mock history on this device.', 'سيتم مسح إجاباتك ومحفوظاتك وسجل الاختبارات على هذا الجهاز.'), L('Reset', 'مسح'), () => { PR.reset(); go('home'); toast(L('Progress cleared', 'تم مسح التقدم')); }); });

    // Re-render in the new language, keeping the current screen
    new MutationObserver(() => { const y = window.scrollY; render(); window.scrollTo(0, y); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    // Deep links: ?mode=mock / renewal / practice / cases / plan
    const start = (qm) => {
      if (qm === 'renewal' && REN) { mset = 'renewal'; go('mockSetup'); } else if (qm === 'mock') go('mockSetup'); else if (qm === 'practice') go('practiceSetup'); else if (qm === 'cases') go('cases'); else if (qm === 'plan') go('plan');
      else render();
    };
    // the outline file has come: its note, and the home screen again with the weights it gives
    const outline = (d) => { OUT = d; renderOutline(); if (view === 'home') home(); };
    return { start, outline };
  }

  const api = { mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else glob.DAExamView = api;
})(typeof self !== 'undefined' ? self : this);
