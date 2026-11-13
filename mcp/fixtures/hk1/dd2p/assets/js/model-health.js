/*
 * DataArcus Power BI Model Health Check: the page (the orchestration). The file is read in the browser and analysed in
 * a Web Worker; nothing is uploaded. Since 0.3.2 SP32 (the split, finished) this file joins the parts and keeps what
 * belongs to the page as a whole:
 *   the file chosen (size and .pbix refused here, read into an ArrayBuffer) -> health-worker-client.js (the worker's
 *   lifecycle: typed progress, result and error messages) -> the state below (the result and the person's selection)
 *   -> health-view.js (every view, the error and loading panels; it changes only the selection) -> DOM.
 *   Kept here: the score history and the ignored rules (localStorage), the questions dismissed this session
 *   (sessionStorage), analytics (track: never in the worker's messages), the downloads (health-downloads.js and the
 *   link), the score card (a canvas picture; sq7 pins its Arabic counts here).
 * (c) DataArcus. All rights reserved.
 */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('mhApp');
  if (!root) return;
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params || {}); };
  // an Arabic count: w { one, two, few (3-10), many (11-99), hundred (100, 101, 102...) }, fmt the number's format
  const arCount = (n, w, fmt) => { const r = n % 100; return n === 1 ? w.one : n === 2 ? w.two : fmt(n) + ' ' + (r >= 3 && r <= 10 ? w.few : r >= 11 ? w.many : n >= 100 ? w.hundred : w.few); };
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  const QKEY = 'dataarcus-mh-confirm-dismissed';
  const dismissed = {
    all() { try { return new Set(JSON.parse(sessionStorage.getItem(QKEY) || '[]')); } catch (e) { return new Set(); } },
    add(k) { const gone = dismissed.all(); gone.add(k); try { sessionStorage.setItem(QKEY, JSON.stringify(Array.from(gone))); } catch (e) { /* private mode: dismissed until the page reloads */ } }
  };
  // the result (the worker's analysis, metadata only) and the person's selection: the view reads it and changes the selection
  const S = { result: null, prev: null, ignored: new Set(store.get('dataarcus-mh-ignored', [])), tab: 'issues', filt: { cat: 'all' }, msQuery: '', msFilter: 'all', msOpen: null, cardHide: false };
  const view = window.MHView.create(root, { state: S, track, store, dismissed, pick, sample, save: (kind) => save(kind), scoreCard: () => scoreCard(),
    saveIgnored: () => store.set('dataarcus-mh-ignored', Array.from(S.ignored)) });
  const { isAr, L, num, rt, grade, RULES } = view.text, score = view.score, { loading, setStep, showError } = view;

  // ---------- file input ----------
  function pick(file) {
    if (!file) return;
    if (file.size > 300 * 1024 * 1024) return showError('TOO_BIG');
    if (/\.pbix$/i.test(file.name)) return showError('PBIX');
    loading(file.name);
    const reader = new FileReader();
    reader.onload = () => run(reader.result, file.name);
    reader.onerror = () => showError('READ');
    reader.readAsArrayBuffer(file);
  }
  function sample() {
    loading('Contoso-Sales-Demo.pbit');
    track('mh_sample');
    fetch('/assets/data/model-health-sample.pbit').then((r) => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then((b) => run(b, 'Contoso-Sales-Demo.pbit')).catch(() => showError('READ'));
  }
  // the worker's lifecycle (started when the page loads, kept between runs, a run still going cancelled by the next
  // file): health-worker-client.js (0.3.2 SP32). Its messages are typed; what is shown and counted is decided here
  const client = window.MHWorkerClient.create();
  function run(buffer, fileName) {
    client.run(buffer, fileName, (m) => {
      if (m.type === 'progress') setStep(m.step);
      else if (m.type === 'error') showError(m.code, m.message);
      else if (m.type === 'result') analysed(m.result, fileName);
    });
  }
  function analysed(result, fileName) {
    Object.assign(S, { result, tab: 'issues', filt: { cat: 'all' }, msOpen: null, msQuery: '', msFilter: 'all' });
    const R = result;
    // (AU47, AUD-047) a model file that could not be read: no score, so none is kept in the history either
    if (R.unreadable) { view.render(); root.scrollIntoView({ behavior: 'smooth', block: 'start' }); track('mh_analyze', { file_type: R.meta.source, has_report: R.meta.hasReport }); return; }
    view.rehashAnswers();   // (B-148, R5) answers whose measure or relationship changed are kept, not applied: their questions are asked again
    const hist = store.get('dataarcus-mh-history', {});
    const key = String(fileName).toLowerCase();
    S.prev = hist[key] && hist[key].length ? hist[key][hist[key].length - 1] : null;
    // re-insert the file so key order is least recently checked first, and the oldest check is the one dropped
    const runs = (hist[key] || []).concat({ d: new Date().toISOString().slice(0, 10), s: score().overall }).slice(-10);
    delete hist[key]; hist[key] = runs;
    const keys = Object.keys(hist); if (keys.length > 30) delete hist[keys[0]];
    store.set('dataarcus-mh-history', hist);
    view.render();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' }); // lands below the navbar (scroll-padding-top in style.css)
    // (17 Oct, the outside audit: nothing about the user's model is sent, not even its size, counts or score)
    track('mh_analyze', { file_type: R.meta.source, has_report: R.meta.hasReport, sample: fileName === 'Contoso-Sales-Demo.pbit' });
  }

  // ---------- the text downloads (findings CSV, documentation HTML and Markdown, measures CSV): health-downloads.js
  // (0.3.2 SP24). One input (the result, the rules, the score shown, today's date), one file out; always English ----------
  const save = (kind) => { const f = window.MHDownloads.build(kind, { result: S.result, rules: RULES(), score: score(), date: new Date().toISOString().slice(0, 10) }); download(f.name, f.text, f.type); };

  // ---------- score card (I-1): one 1200 x 630 PNG drawn on a canvas here. It holds the score, the size line, the top 5
  // findings by rule name and object name (the first item's; never an item's detail, DAX, a description or M) and the
  // tool's address. Arabic: right to left in the page's own font, each name isolated (FSI ... PDI) so it keeps its order ----------
  const SEVC = { high: '#ef4444', medium: '#f59e0b', low: '#38bdf8', info: '#94a3b8' };
  function cardContent() {
    const s = S.result.stats, sc = score().overall, cut = (x) => (x.length > 60 ? x.slice(0, 59) + '…' : x);
    // (0.3.1 SQ7, E-S2) the Arabic word agrees with the number: 1 and 2 by the word alone, 3-10 the plural, 11-99 the
    // singular (accusative), and a hundred and its 1 and 2 the singular; E2's singular of «المرئيات» is «مرئي»
    const many = (n, one, more, ar) => (isAr() ? arCount(n, { one: ar[0], two: ar[1], few: ar[2], many: ar[3], hundred: ar[4] }, num) : num(n) + ' ' + (n === 1 ? one : more));
    const size = [many(s.tables, 'table', 'tables', ['جدول واحد', 'جدولان', 'جداول', 'جدولًا', 'جدول']), many(s.measures, 'measure', 'measures', ['مقياس واحد', 'مقياسان', 'مقاييس', 'مقياسًا', 'مقياس'])]
      .concat(S.result.meta.hasReport ? [many(s.visuals, 'visual', 'visuals', ['مرئي واحد', 'مرئيان', 'مرئيات', 'مرئيًا', 'مرئي'])] : []).join('  ·  ');
    const top = S.result.findings.filter((f) => !S.ignored.has(f.id)).slice(0, 5).map((f, i) => {
      const obj = f.items[0] && f.items[0].obj, n = f.items.length;
      // the rule on one line, its first object below it (its count when names are hidden)
      // (Arabic: a right-to-left mark keeps the count after a rule name that ends in Latin letters, "... CALCULATE")
      return { sev: f.sev, text: num(i + 1) + '. ' + rt(f.id)[0] + (S.cardHide || !obj ? L('', '\u200f') + ' (' + num(n) + ')' : ''),
        obj: S.cardHide || !obj ? '' : '\u2068' + cut(String(obj)) + '\u2069' + (n > 1 ? L(' +' + num(n - 1), ' و' + num(n - 1) + ' أخرى') : '') };
    });
    return { title: L('Power BI Model Health Check', 'فحص صحة نموذج Power BI'), sub: L('What the check found in this model', 'ما وجده الفحص في هذا النموذج'),
      score: sc, grade: grade(sc), size, head: L('Top findings', 'أهم الملاحظات'), none: L('No findings', 'لا توجد ملاحظات'), top, foot: 'dataarcus.com/tools/power-bi-model-health-check' };
  }
  async function scoreCard() {
    const W = 1200, H = 630, rtl = isAr(), k = cardContent(), drawn = [];
    const ff = getComputedStyle(document.body).fontFamily;
    try { await Promise.race([Promise.all(['400', '600', '800'].map((w) => document.fonts.load(w + ' 32px ' + ff, rtl ? 'بطاقة Power BI' : 'Power BI'))), new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* draws with what is loaded */ }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    c.direction = rtl ? 'rtl' : 'ltr';
    const X = (x) => (rtl ? W - x : x);
    // one line of text at the start side (or centred), cut with an ellipsis to its width; every line is also listed in #mhCardText
    const text = (t, x, y, size, weight, color, maxW, align) => {
      c.font = weight + ' ' + size + 'px ' + ff; c.fillStyle = color; c.textAlign = align || 'start'; c.textBaseline = 'alphabetic';
      let s = t;
      if (maxW && c.measureText(s).width > maxW) { while (s.length > 1 && c.measureText(s + '…').width > maxW) s = s.slice(0, -1); s = s.replace(/[\u2068\s]+$/, '') + (s.includes('\u2068') && !s.includes('\u2069') ? '…\u2069' : '…'); }
      c.fillText(s, align === 'center' ? x : X(x), y); drawn.push(s);
    };
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0a0f1c'); bg.addColorStop(1, '#1a1f2e');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.fillStyle = '#00d4ff'; c.fillRect(rtl ? W - 12 : 0, 0, 12, H);
    text(k.title, 60, 84, 40, '800', '#ffffff', 1080);
    text(k.sub, 60, 124, 24, '400', 'rgba(255,255,255,0.65)', 1080);
    // the score ring, in the grade's colour as on the page
    const cx = X(240), cy = 330, r = 118;
    c.lineWidth = 22; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(cx, cy, r, 0, 2 * Math.PI); c.stroke();
    c.strokeStyle = k.grade[1]; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * k.score / 100 * (rtl ? -1 : 1), rtl); c.stroke();
    text(num(k.score), cx, cy + 22, 84, '800', '#ffffff', 200, 'center');
    text(k.grade[0], cx, cy + 62, 26, '600', k.grade[1], 200, 'center');
    text(k.size, 460, 194, 26, '600', '#ffffff', 680);
    text(k.head, 460, 244, 21, '600', '#00d4ff', 680);
    if (!k.top.length) text(k.none, 460, 294, 24, '400', 'rgba(255,255,255,0.85)', 680);
    k.top.forEach((f, i) => {
      const y = 290 + i * 54;
      c.fillStyle = SEVC[f.sev] || SEVC.info; c.beginPath(); c.arc(X(468), y - 8, 7, 0, 2 * Math.PI); c.fill();
      text(f.text, 488, y, 23, '600', 'rgba(255,255,255,0.92)', 652);
      if (f.obj) text(f.obj, 488, y + 24, 19, '400', 'rgba(255,255,255,0.6)', 652);
    });
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(60, 560, W - 120, 1);
    text(k.foot, 60, 600, 22, '600', 'rgba(255,255,255,0.7)', 1080);
    view.cardText(drawn, rtl);
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
    if (!blob) return;
    download((S.result.meta.fileName || 'model').replace(/\.[^.]+$/, '') + ' - score card.png', blob);
    track('health_card_download', { names_hidden: S.cardHide, lang: rtl ? 'ar' : 'en' });
  }

  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: type + ';charset=utf-8' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  new MutationObserver(() => view.render()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  view.render();
});
