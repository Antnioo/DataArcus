/*
 * DataArcus - Microsoft exam practice simulator (DP-600 by default, PL-300 via window.EXAM)
 * Independent practice tool. Not affiliated with or endorsed by Microsoft.
 * Questions are original, written for DataArcus from the public DP-600 skills
 * outline and Microsoft Learn documentation. Progress stays in the browser.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Exam settings. DP-600 is the default; another exam page sets window.EXAM before this script.
  const EX = Object.assign({
    data: 'DP600', code: 'DP-600', store: 'dataarcus-dp600-v1', ev: 'dp600',
    outline: '../assets/data/dp600-outline.json',
    page: 'https://dataarcus.com/tools/dp-600-practice-exam.html',
    dom: {
      prep: { en: 'Prepare data', ar: 'تجهيز البيانات', w: '45–50%', wt: 47.5 },
      model: { en: 'Implement and manage semantic models', ar: 'بناء وإدارة النماذج الدلالية', w: '25–30%', wt: 27.5 },
      maintain: { en: 'Maintain a data analytics solution', ar: 'صيانة حل التحليلات', w: '25–30%', wt: 27.5 }
    },
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
    official: [
      ['https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600', 'DP-600 study guide: the skills measured', 'دليل مذاكرة DP-600: المهارات المقاسة'],
      ['https://learn.microsoft.com/en-us/credentials/certifications/exams/dp-600/practice/assessment?assessment-type=practice&assessmentId=90', 'Microsoft\'s free practice assessment', 'التقييم التدريبي المجاني من Microsoft'],
      ['https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/', 'Fabric Analytics Engineer Associate certification page', 'صفحة شهادة Fabric Analytics Engineer Associate'],
      ['https://aka.ms/examdemo', 'Exam sandbox: try the real exam interface', 'بيئة تجربة واجهة الاختبار الحقيقية']
    ]
  }, window.EXAM || {});
  const DATA = window[EX.data];
  const root = document.getElementById('dpApp');
  if (!DATA || !root) return;

  // ---------- helpers ----------
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params || {}); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => new Intl.NumberFormat(isAr() ? 'ar-u-nu-latn' : 'en-US').format(n);
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const LET = 'ABCDEFGH';
  const fmtTime = (s) => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const today = () => new Date().toISOString().slice(0, 10);

  // ---------- data ----------
  const QS = DATA.q.slice();
  const CASES = DATA.cases;
  const byId = {};
  QS.forEach((q) => { byId[q.id] = q; });
  CASES.forEach((c) => c.questions.forEach((q) => { q.caseId = c.id; byId[q.id] = q; }));
  const ALL = Object.values(byId);

  const DOM = EX.dom;
  const SKILL = EX.skill;
  const skillName = (s) => L(SKILL[s].en, SKILL[s].ar);
  const domName = (d) => L(DOM[d].en, DOM[d].ar);

  // Most-cited Microsoft Learn pages per skill, taken from the question references
  const LEARN = {};
  Object.keys(SKILL).forEach((s) => {
    const cnt = {};
    ALL.filter((q) => q.s === s).forEach((q) => (q.ref || []).forEach((r) => { const k = r.u; cnt[k] = cnt[k] || { t: r.t, u: r.u, n: 0 }; cnt[k].n++; }));
    LEARN[s] = Object.values(cnt).sort((a, b) => b.n - a.n).slice(0, 3);
  });

  // ---------- saved progress ----------
  const STORE = EX.store;
  const blank = () => ({ ans: {}, bm: [], mocks: [], days: [], mock: null });
  let P;
  try { P = Object.assign(blank(), JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) { P = blank(); }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(P)); } catch (e) { /* private mode */ } };
  const markDay = () => { const t = today(); if (!P.days.includes(t)) { P.days.push(t); P.days = P.days.slice(-60); } };
  const streak = () => {
    const set = new Set(P.days); let n = 0; const d = new Date();
    if (!set.has(today())) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  const record = (q, ok) => {
    const a = P.ans[q.id] || { n: 0, c: 0 };
    a.n++; if (ok) a.c++; a.last = ok ? 1 : 0; a.t = Date.now();
    P.ans[q.id] = a; markDay(); save();
  };
  const isBm = (id) => P.bm.includes(id);
  const toggleBm = (id) => { P.bm = isBm(id) ? P.bm.filter((x) => x !== id) : P.bm.concat(id); save(); };

  const stats = (list) => {
    let seen = 0, right = 0;
    list.forEach((q) => { const a = P.ans[q.id]; if (a) { seen++; if (a.last) right++; } });
    return { total: list.length, seen, right, acc: seen ? right / seen : 0 };
  };
  const readiness = () => {
    let sum = 0, w = 0;
    Object.keys(DOM).forEach((d) => {
      const st = stats(ALL.filter((q) => q.d === d));
      const cover = Math.min(1, st.seen / (st.total * 0.6));
      sum += DOM[d].wt * st.acc * cover; w += DOM[d].wt;
    });
    return Math.round((sum / w) * 100);
  };
  const mistakes = () => ALL.filter((q) => P.ans[q.id] && !P.ans[q.id].last);

  // ---------- grading ----------
  // Returns a value between 0 and 1. Multi and yes/no give partial credit, order is all or nothing.
  const grade = (q, r) => {
    if (r == null) return 0;
    if (q.type === 'single') return r === q.ans ? 1 : 0;
    if (q.type === 'multi') { if (!r.length) return 0; const hit = r.filter((i) => q.ans.includes(i)).length, miss = r.length - hit; return Math.max(0, (hit - miss) / q.n); }
    if (q.type === 'yesno') { let k = 0; q.ans.forEach((v, i) => { if (r[i] === v) k++; }); return k / q.ans.length; }
    if (q.type === 'order') return r.length === q.ans.length && r.every((v, i) => v === q.ans[i]) ? 1 : 0;
    return 0;
  };
  const answered = (q, r) => {
    if (r == null) return false;
    if (q.type === 'single') return typeof r === 'number';
    if (q.type === 'multi') return r.length === q.n;
    if (q.type === 'yesno') return r.every((v) => v === true || v === false);
    if (q.type === 'order') return r.length > 0;
    return false;
  };
  const newInst = (q) => ({ id: q.id, perm: q.type === 'yesno' ? range(q.opts.length) : shuffle(range(q.opts.length)), r: q.type === 'yesno' ? q.opts.map(() => null) : q.type === 'single' ? null : [] });

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
  const top = () => { const y = root.getBoundingClientRect().top + window.scrollY - 90; if (window.scrollY > y) window.scrollTo({ top: y, behavior: 'auto' }); };

  // ---------- weekly outline check (assets/data/dp600-outline.json, refreshed by a GitHub Action) ----------
  let OUT = null;
  const fmtDate = (iso) => new Intl.DateTimeFormat(isAr() ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
  function renderOutline() {
    const el = document.getElementById('dpOutline');
    if (!el || !OUT || !OUT.checked) return;
    const guide = '<a href="' + esc(OUT.sources.studyGuide) + '" target="_blank" rel="noopener">' + L('study guide', 'دليل المذاكرة') + '</a>';
    let html;
    if (OUT.status === 'review') {
      el.className = 'dp-outline review';
      html = '<i class="bi bi-arrow-repeat"></i> ' + L('Microsoft updated the ' + EX.code + ' skills outline (checked ' + fmtDate(OUT.checked) + '). We are reviewing the questions now. Most of them still apply. See the ' + guide + ' for what changed.',
        'حدّثت Microsoft منهج ' + EX.code + ' (آخر فحص ' + fmtDate(OUT.checked) + '). نراجع الأسئلة الآن ومعظمها ما زال صالحًا. راجع ' + guide + ' لمعرفة التغييرات.');
    } else {
      el.className = 'dp-outline';
      html = '<i class="bi bi-shield-check"></i> ' + L('Checked weekly against Microsoft\'s ' + EX.code + ' ' + guide + '. Last check: ' + fmtDate(OUT.checked) + '. Questions match the skills measured as of ' + fmtDate(OUT.bankOutlineDate) + '.',
        'نراجع أسبوعيًا ' + guide + ' الخاص بـ ' + EX.code + ' من Microsoft. آخر فحص: ' + fmtDate(OUT.checked) + '. الأسئلة مطابقة للمهارات المقاسة اعتبارًا من ' + fmtDate(OUT.bankOutlineDate) + '.');
      if (today() < OUT.bankOutlineDate) html += ' ' + L('Taking the exam before then? The previous outline is still live and most topics overlap.', 'ستختبر قبل هذا التاريخ؟ المنهج السابق ما زال ساريًا ومعظم المواضيع مشتركة.');
    }
    el.innerHTML = html;
  }
  if (EX.outline) fetch(EX.outline, { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (!d) return;
      OUT = d;
      const names = EX.outlineNames;
      (d.domains || []).forEach((x) => { const k = Object.keys(names).find((n) => names[n] === String(x.name).toLowerCase()); if (k && x.w) DOM[k].w = x.w; });
      renderOutline();
      if (view === 'home') home();
    })
    .catch(() => { /* opened as a file or offline: keep the built-in weights */ });

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
    const rd = readiness(), st = stats(ALL), mk = mistakes().length, best = P.mocks.reduce((m, x) => Math.max(m, x.score), 0);
    const inProg = !!P.mock;
    const domRows = Object.keys(DOM).map((d) => {
      const s = stats(ALL.filter((q) => q.d === d));
      return '<div class="dp-domrow"><div class="dp-domtop"><span>' + domName(d) + ' <small>' + DOM[d].w + '</small></span><b>' + (s.seen ? Math.round(s.acc * 100) + '%' : '·') + '</b></div>' + bar(s.acc * Math.min(1, s.seen / s.total * 1.6)) + '<div class="dp-domsub">' + L(num(s.seen) + ' of ' + num(s.total) + ' answered', 'أجبت ' + num(s.seen) + ' من ' + num(s.total)) + '</div></div>';
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
      modeCard('practice', 'bi-lightning-charge', L('Practice by skill', 'تدريب حسب المهارة'), L('Pick a skill, answer, and see why each option is right or wrong.', 'اختر مهارة وأجب، وشاهد لماذا كل خيار صحيح أو خطأ.')) +
      modeCard('cases', 'bi-journal-text', L('Case studies', 'دراسات الحالة'), L('Read a full company scenario and answer its questions.', 'اقرأ سيناريو شركة كامل وأجب عن أسئلته.')) +
      modeCard('mistakes', 'bi-arrow-repeat', L('Review mistakes', 'مراجعة الأخطاء'), mk ? L(num(mk) + ' questions to fix', num(mk) + ' سؤال للمراجعة') : L('Nothing yet. Wrong answers land here.', 'لا شيء بعد. الإجابات الخاطئة تظهر هنا.'), false, !mk) +
      modeCard('bookmarks', 'bi-bookmark-star', L('Bookmarks', 'المحفوظات'), P.bm.length ? L(num(P.bm.length) + ' saved', num(P.bm.length) + ' محفوظ') : L('Save questions to revisit.', 'احفظ أسئلة لتعود إليها.'), false, !P.bm.length) +
      modeCard('plan', 'bi-map', L('Study plan', 'خطة المذاكرة'), L('Your weakest skills first, with the Microsoft Learn pages to read.', 'مهاراتك الأضعف أولًا، مع صفحات Microsoft Learn المناسبة.')) +
      '</div>' +
      (P.mocks.length ? '<div class="dp-panel mt-3"><span class="tg-label">' + L('Mock history', 'سجل الاختبارات') + '</span><div class="dp-hist">' + P.mocks.slice(-8).map((m) => '<div class="dp-histbar ' + (m.score >= 700 ? 'pass' : '') + '" title="' + m.score + '"><span style="height:' + Math.max(6, m.score / 10) + '%"></span><b>' + m.score + '</b></div>').join('') + '<i class="dp-passline"></i></div></div>' : '') +
      '</div></div>';
    root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const g = b.dataset.go;
      if (g === 'resume') return go('mock');
      if (g === 'mock') return go('mockSetup');
      if (g === 'practice') return go('practiceSetup');
      if (g === 'cases') return go('cases');
      if (g === 'plan') return go('plan');
      if (g === 'mistakes') return startSession(shuffle(mistakes()), 'mistakes');
      if (g === 'bookmarks') return startSession(P.bm.map((id) => byId[id]).filter(Boolean), 'bookmarks');
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
        const acc = {}; Object.keys(SKILL).forEach((s) => { const st = stats(ALL.filter((q) => q.s === s)); acc[s] = st.seen ? st.acc : 0.5; });
        list.sort((a, b) => acc[a.s] - acc[b.s]);
      }
      if (pset.fresh) list.sort((a, b) => (P.ans[a.id] ? (P.ans[a.id].last ? 2 : 1) : 0) - (P.ans[b.id] ? (P.ans[b.id].last ? 2 : 1) : 0));
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
    const c = ctx, n = Object.keys(c.checked).length, right = Object.values(c.checked).filter((g) => g === 1).length;
    const bySkill = {};
    c.items.forEach((inst, i) => { if (c.checked[i] == null) return; const s = byId[inst.id].s; bySkill[s] = bySkill[s] || [0, 0]; bySkill[s][1]++; if (c.checked[i] === 1) bySkill[s][0]++; });
    root.innerHTML = back() + '<div class="dp-panel text-center dp-end"><div class="dp-ringwrap">' + ring(n ? right / n : 0, '<b>' + num(right) + '/' + num(n) + '</b><span>' + L('correct', 'صحيحة') + '</span>') + '</div>' +
      '<h2 class="h4 fw-bold mt-3">' + (n && right / n >= 0.8 ? L('Strong session', 'جلسة قوية') : L('Session complete', 'انتهت الجلسة')) + '</h2>' +
      '<div class="dp-skilltable">' + Object.keys(bySkill).map((s) => '<div><span>' + skillName(s) + '</span>' + bar(bySkill[s][0] / bySkill[s][1]) + '<b>' + bySkill[s][0] + '/' + bySkill[s][1] + '</b></div>').join('') + '</div>' +
      '<div class="dp-actions justify-content-center"><button type="button" class="btn btn-accent" data-a="again">' + L('Practice more', 'تدرّب أكثر') + '</button>' + (mistakes().length ? '<button type="button" class="tg-btn2" data-a="mist">' + L('Review mistakes', 'راجع الأخطاء') + ' (' + num(mistakes().length) + ')</button>' : '') + '</div></div>';
    bindBack();
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
    const rows = Object.keys(SKILL).map((s) => ({ s, st: stats(ALL.filter((q) => q.s === s)) }))
      .sort((a, b) => (a.st.seen ? a.st.acc : -1 + a.st.seen) - (b.st.seen ? b.st.acc : -1 + b.st.seen));
    const status = (st) => !st.seen ? ['new', L('Not started', 'لم تبدأ')] : st.acc < 0.6 ? ['weak', L('Needs work', 'تحتاج جهدًا')] : st.acc < 0.8 ? ['mid', L('Getting there', 'في الطريق')] : ['good', L('Strong', 'قوية')];
    root.innerHTML = back() + '<div class="dp-panel"><h2 class="h4 fw-bold">' + L('Your study plan', 'خطة مذاكرتك') + '</h2><p class="dp-note">' + L('Work top to bottom. Each skill links to the Microsoft Learn pages our questions draw on most.', 'ابدأ من الأعلى. كل مهارة مرتبطة بصفحات Microsoft Learn التي تعتمد عليها أسئلتنا أكثر.') + '</p>' +
      rows.map(({ s, st }) => {
        const [k, lab] = status(st);
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
  const MOCKS = {
    full: { n: 44, cs: 1, min: 100 },
    half: { n: 25, cs: 0, min: 50 },
    quick: { n: 10, cs: 0, min: 15 }
  };
  let mset = 'full';
  function mockSetup() {
    const card = (k, t, d) => '<button type="button" class="dp-mode' + (mset === k ? ' primary' : '') + '" data-len="' + k + '"><i class="bi ' + (k === 'full' ? 'bi-trophy' : k === 'half' ? 'bi-hourglass-split' : 'bi-lightning') + '"></i><span><b>' + t + '</b><small>' + d + '</small></span></button>';
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
      if (P.mock && P.mock.endAt > Date.now()) modal(L('Replace the exam in progress?', 'استبدال الاختبار الحالي؟'), L('Your unfinished mock exam will be discarded.', 'سيتم حذف الاختبار غير المكتمل.'), L('Start new exam', 'ابدأ اختبارًا جديدًا'), go2);
      else go2();
    });
  }
  function buildMock(kind) {
    const cfg = MOCKS[kind];
    const pool = QS.slice();
    // questions per exam area: fixed shares when given, otherwise by the official weights; the last area takes the rest
    const doms = Object.keys(DOM), wsum = doms.reduce((a, d) => a + DOM[d].wt, 0), want = {};
    doms.slice(0, -1).forEach((d) => { want[d] = Math.round(cfg.n * (EX.mix ? EX.mix[d] : DOM[d].wt / wsum)); });
    want[doms[doms.length - 1]] = cfg.n - doms.slice(0, -1).reduce((a, d) => a + want[d], 0);
    // prefer questions the learner has not seen, then ones they got wrong
    const pri = (q) => (P.ans[q.id] ? (P.ans[q.id].last ? 2 : 1) : 0) + Math.random();
    let ids = [];
    Object.keys(want).forEach((d) => {
      const skills = Object.keys(SKILL).filter((s) => SKILL[s].d === d);
      const bySk = {}; skills.forEach((s) => { bySk[s] = pool.filter((q) => q.s === s).sort((a, b) => pri(a) - pri(b)); });
      let k = 0; const picked = [];
      while (picked.length < want[d]) { const s = skills[k++ % skills.length]; if (bySk[s].length) picked.push(bySk[s].shift().id); else if (skills.every((x) => !bySk[x].length)) break; }
      ids = ids.concat(picked);
    });
    ids = shuffle(ids);
    let caseId = null;
    if (cfg.cs) { const c = CASES[Math.floor(Math.random() * CASES.length)]; caseId = c.id; ids = ids.concat(c.questions.map((q) => q.id)); }
    P.mock = { kind, caseId, items: ids.map((id) => newInst(byId[id])), flags: [], i: 0, start: Date.now(), endAt: Date.now() + cfg.min * 60000, min: cfg.min };
    save();
    track(EX.ev + '_mock_start', { length: kind, questions: ids.length });
  }
  function mock() {
    const M = P.mock;
    if (!M) return go('home');
    if (Date.now() >= M.endAt) return submitMock(true);
    if (ctx.review) return mockReview();
    const inst = M.items[M.i], q = byId[inst.id], cs = caseOf(q), flagged = M.flags.includes(M.i);
    root.innerHTML =
      '<div class="dp-exambar"><span class="dp-ex-title">' + EX.code + ' ' + L('mock exam', 'اختبار تجريبي') + '</span><span class="dp-ex-count">' + (M.i + 1) + ' / ' + M.items.length + '</span><span class="dp-timer" id="dpTimer"><i class="bi bi-clock"></i> <b></b></span></div>' +
      bar(M.items.filter((it) => answered(byId[it.id], it.r)).length / M.items.length, 'thin') +
      '<div class="' + (cs ? 'dp-split' : '') + '">' + (cs ? caseHTML(cs) : '') +
      '<div class="dp-panel dp-qpanel">' + '<div class="dp-qmeta"><span class="dp-tag">' + (cs ? 'Case study' : L('Question', 'سؤال') + ' ' + (M.i + 1)) + '</span><button type="button" class="dp-flag' + (flagged ? ' on' : '') + '" id="dpFlag"><i class="bi bi-flag' + (flagged ? '-fill' : '') + '"></i> ' + L('Review later', 'مراجعة لاحقًا') + '</button></div>' +
      '<div id="dpQ">' + qHTML(q, inst, false) + '</div>' +
      '<div class="dp-actions dp-exnav"><button type="button" class="tg-btn2" id="dpPrev" ' + (M.i === 0 ? 'disabled' : '') + '><i class="bi bi-arrow-left"></i> ' + L('Previous', 'السابق') + '</button>' +
      '<button type="button" class="tg-btn2" id="dpRev"><i class="bi bi-grid-3x3-gap"></i> ' + L('Review', 'مراجعة') + '</button>' +
      (M.i + 1 < M.items.length ? '<button type="button" class="btn btn-accent" id="dpNext">' + L('Next', 'التالي') + ' <i class="bi bi-arrow-right"></i></button>' : '<button type="button" class="btn btn-accent" id="dpRev2">' + L('Review and submit', 'مراجعة وتسليم') + '</button>') +
      '</div></div></div>';
    bindQ(root.querySelector('#dpQ'), q, inst, () => { save(); const y = window.scrollY; mock(); window.scrollTo(0, y); });
    root.querySelector('#dpFlag').addEventListener('click', () => { M.flags = flagged ? M.flags.filter((x) => x !== M.i) : M.flags.concat(M.i); save(); mock(); });
    root.querySelector('#dpPrev').addEventListener('click', () => { M.i--; save(); mock(); top(); });
    const nx = root.querySelector('#dpNext'); if (nx) nx.addEventListener('click', () => { M.i++; save(); mock(); top(); });
    root.querySelector('#dpRev').addEventListener('click', () => { ctx.review = true; mock(); top(); });
    const r2 = root.querySelector('#dpRev2'); if (r2) r2.addEventListener('click', () => { ctx.review = true; mock(); top(); });
    startTimer();
  }
  function startTimer() {
    const tick = () => {
      const M = P.mock; if (!M) return;
      const left = (M.endAt - Date.now()) / 1000;
      const t = document.querySelector('#dpTimer b'); if (t) { t.textContent = fmtTime(left); t.parentElement.classList.toggle('low', left < 300); }
      if (left <= 0) { clearInterval(timer); timer = null; submitMock(true); }
    };
    if (!timer) timer = setInterval(tick, 1000);
    tick();
  }
  function mockReview() {
    const M = P.mock;
    const un = M.items.filter((it) => !answered(byId[it.id], it.r)).length;
    root.innerHTML = '<div class="dp-exambar"><span class="dp-ex-title">' + L('Review your answers', 'راجع إجاباتك') + '</span><span></span><span class="dp-timer" id="dpTimer"><i class="bi bi-clock"></i> <b></b></span></div>' +
      '<div class="dp-panel"><div class="dp-legend"><span><i class="dp-sq done"></i>' + L('Answered', 'مُجاب') + '</span><span><i class="dp-sq"></i>' + L('Not answered', 'غير مُجاب') + '</span><span><i class="bi bi-flag-fill text-warning"></i> ' + L('Flagged', 'معلّم') + '</span></div>' +
      '<div class="dp-grid">' + M.items.map((it, i) => {
        const q = byId[it.id];
        return '<button type="button" class="dp-cell' + (answered(q, it.r) ? ' done' : '') + (M.flags.includes(i) ? ' flag' : '') + (q.caseId ? ' cs' : '') + '" data-j="' + i + '">' + (i + 1) + '</button>';
      }).join('') + '</div>' +
      '<div class="dp-actions"><button type="button" class="tg-btn2" id="dpBackQ"><i class="bi bi-arrow-left"></i> ' + L('Back to questions', 'رجوع للأسئلة') + '</button>' + (M.flags.length ? '<button type="button" class="tg-btn2" id="dpFlagged"><i class="bi bi-flag"></i> ' + L('Review flagged', 'راجع المعلّمة') + '</button>' : '') + '<button type="button" class="btn btn-accent" id="dpSubmit">' + L('Submit exam', 'سلّم الاختبار') + '</button></div>' +
      (un ? '<p class="dp-note mt-2 text-warning">' + L(un + ' question(s) not answered. Unanswered questions score zero.', 'يوجد ' + un + ' سؤال بلا إجابة، وسيُحسب صفرًا.') + '</p>' : '') + '</div>';
    root.querySelectorAll('[data-j]').forEach((b) => b.addEventListener('click', () => { M.i = +b.dataset.j; ctx.review = false; save(); mock(); top(); }));
    root.querySelector('#dpBackQ').addEventListener('click', () => { ctx.review = false; mock(); });
    const fl = root.querySelector('#dpFlagged'); if (fl) fl.addEventListener('click', () => { M.i = M.flags.slice().sort((a, b) => a - b)[0]; ctx.review = false; save(); mock(); top(); });
    root.querySelector('#dpSubmit').addEventListener('click', () => modal(L('Submit your exam?', 'تسليم الاختبار؟'), un ? L('You still have ' + un + ' unanswered question(s).', 'لا يزال لديك ' + un + ' سؤال بلا إجابة.') : L('You can review every answer and explanation after submitting.', 'ستتمكن من مراجعة كل إجابة وشرحها بعد التسليم.'), L('Submit', 'تسليم'), () => submitMock(false)));
    startTimer();
  }
  function submitMock(timeUp) {
    const M = P.mock; if (!M) return;
    if (timer) { clearInterval(timer); timer = null; }
    const dom = {}, sk = {}; Object.keys(DOM).forEach((d) => { dom[d] = [0, 0]; });
    let pts = 0;
    const res = M.items.map((it) => {
      const q = byId[it.id], g = answered(q, it.r) || q.type === 'multi' || q.type === 'yesno' ? grade(q, it.r) : 0;
      pts += g; dom[q.d][0] += g; dom[q.d][1]++;
      sk[q.s] = sk[q.s] || [0, 0]; sk[q.s][0] += g; sk[q.s][1]++;
      if (answered(q, it.r)) P.ans[q.id] = Object.assign(P.ans[q.id] || { n: 0, c: 0 }, { n: ((P.ans[q.id] || {}).n || 0) + 1, c: ((P.ans[q.id] || {}).c || 0) + (g === 1 ? 1 : 0), last: g === 1 ? 1 : 0, t: Date.now() });
      return g;
    });
    const score = Math.round((pts / M.items.length) * 1000);
    const used = Math.min(M.min * 60, Math.round((Date.now() - M.start) / 1000));
    const rec = { t: Date.now(), kind: M.kind, score, pass: score >= 700, n: M.items.length, used, dom, sk };
    P.mocks.push(rec); P.mocks = P.mocks.slice(-30);
    const last = { rec, items: M.items, flags: M.flags, res, timeUp };
    P.mock = null; markDay(); save();
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
      '<div class="dp-passbadge ' + (pass ? 'pass' : 'fail') + '">' + (pass ? L('Pass', 'ناجح') : L('Not yet', 'ليس بعد')) + '</div>' +
      '<p class="dp-note mt-2">' + L('Passing score: 700. Time used: ' + fmtTime(r.used) + '.', 'درجة النجاح: 700. الوقت المستخدم: ' + fmtTime(r.used) + '.') + '</p>' +
      '<p class="dp-note">' + L('This is an estimate from original practice questions. Microsoft scales real exam scores differently.', 'هذه نتيجة تقديرية من أسئلة تدريبية أصلية. Microsoft تحسب نتائج الاختبار الحقيقي بطريقة مختلفة.') + '</p>' +
      '<div class="dp-actions justify-content-center"><button type="button" class="btn btn-accent" data-a="retake">' + L('New mock exam', 'اختبار جديد') + '</button><button type="button" class="tg-btn2" data-a="weak">' + L('Practice weak skills', 'تدرّب على نقاط الضعف') + '</button></div>' +
      '<button type="button" class="dp-share" data-a="share"><i class="bi bi-linkedin"></i> ' + L('Share my score', 'شارك نتيجتي') + '</button>' +
      '</div></div><div class="col-lg-7"><div class="dp-panel"><span class="tg-label">' + L('By exam area', 'حسب محور الاختبار') + '</span>' +
      Object.keys(DOM).map((d) => { const v = r.dom[d]; const p = v[1] ? v[0] / v[1] : 0; return '<div class="dp-domrow"><div class="dp-domtop"><span>' + domName(d) + ' <small>' + DOM[d].w + '</small></span><b>' + (v[1] ? Math.round(p * 100) + '%' : '·') + '</b></div>' + bar(p, p >= 0.7 ? 'good' : 'warn') + '</div>'; }).join('') +
      '<span class="tg-label mt-3">' + L('By skill', 'حسب المهارة') + '</span><div class="dp-skilltable">' + Object.keys(r.sk).map((s) => { const v = r.sk[s]; return '<div><span>' + skillName(s) + '</span>' + bar(v[0] / v[1], v[0] / v[1] >= 0.7 ? 'good' : 'warn') + '<b>' + Math.round(v[0] / v[1] * 100) + '%</b></div>'; }).join('') + '</div></div></div></div>' +
      '<div class="dp-panel mt-4"><div class="dp-revhead"><span class="tg-label mb-0">' + L('Review answers', 'مراجعة الإجابات') + '</span><div class="mb-seg">' +
      [['all', L('All', 'الكل')], ['wrong', L('Incorrect', 'الخاطئة')], ['flag', L('Flagged', 'المعلّمة')]].map((x) => '<button type="button" data-f="' + x[0] + '" class="' + (f === x[0] ? 'active' : '') + '">' + x[1] + '</button>').join('') + '</div></div>' +
      (rows.length ? rows.map((x) => '<details class="dp-rev"><summary><span class="dp-revn">' + (x.i + 1) + '</span><i class="bi ' + (x.g === 1 ? 'bi-check-circle-fill ok' : x.g > 0 ? 'bi-dash-circle-fill part' : 'bi-x-circle-fill bad') + '"></i><span class="dp-revq" lang="en" dir="ltr">' + esc(x.q.q.replace(/<pre>[\s\S]*?<\/pre>/g, ' [code] ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').slice(0, 140)) + '…</span><span class="dp-tag">' + skillName(x.q.s) + '</span></summary><div class="dp-revbody" data-k="' + x.i + '"></div></details>').join('') : '<p class="dp-note">' + L('Nothing here.', 'لا يوجد شيء هنا.') + '</p>') + '</div>';
    bindBack();
    root.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { ctx.filter = b.dataset.f; results(); }));
    root.querySelectorAll('details.dp-rev').forEach((d) => d.addEventListener('toggle', () => {
      const body = d.querySelector('.dp-revbody'); if (!d.open || body.innerHTML) return;
      const i = +body.dataset.k, it = last.items[i], q = byId[it.id], cs = caseOf(q);
      body.innerHTML = (cs ? '<details class="dp-csmini"><summary>' + L('Show case study', 'عرض دراسة الحالة') + '</summary>' + caseHTML(cs) + '</details>' : '') + qHTML(q, it, true) + explainHTML(q, it.r) + '<button type="button" class="dp-bm' + (isBm(q.id) ? ' on' : '') + '" data-bmq="' + q.id + '"><i class="bi bi-bookmark' + (isBm(q.id) ? '-fill' : '') + '"></i> ' + L('Bookmark', 'حفظ') + '</button>';
      bindQ(body, q, it, () => {});
      body.querySelector('[data-bmq]').addEventListener('click', (e) => { toggleBm(q.id); const b = e.currentTarget; b.classList.toggle('on', isBm(q.id)); b.querySelector('i').className = 'bi bi-bookmark' + (isBm(q.id) ? '-fill' : ''); });
    }));
    root.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'retake') go('mockSetup');
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
  document.addEventListener('click', (e) => { if (!e.target.closest('#dpReset')) return; modal(L('Reset all progress?', 'مسح كل التقدم؟'), L('This clears your answers, bookmarks and mock history on this device.', 'سيتم مسح إجاباتك ومحفوظاتك وسجل الاختبارات على هذا الجهاز.'), L('Reset', 'مسح'), () => { P = blank(); save(); go('home'); toast(L('Progress cleared', 'تم مسح التقدم')); }); });

  // Re-render in the new language, keeping the current screen
  new MutationObserver(() => { const y = window.scrollY; render(); window.scrollTo(0, y); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // Deep links: ?mode=mock / practice / cases / plan
  const qm = new URLSearchParams(location.search).get('mode');
  if (qm === 'mock') go('mockSetup'); else if (qm === 'practice') go('practiceSetup'); else if (qm === 'cases') go('cases'); else if (qm === 'plan') go('plan');
  else render();
});
