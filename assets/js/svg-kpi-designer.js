/*
 * DataArcus SVG KPI Designer: editor UI.
 * Draw a KPI visual, link parts of it to your measures, copy the DAX.
 * The design is compiled by svg-kpi-compiler.js: the canvas, the preview and the DAX all come from it.
 * Nothing is uploaded; designs live in this browser (and in share links).
 * (c) DataArcus. All rights reserved.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const K = window.SVGKPI, T = window.SVGKPITemplates;
  if (!K || !T || !window.SVGEditorStore || !window.SVGEditorPointer || !window.SVGEditorPanels || !$('kdApp')) return;
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params || {}); };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const r1 = (n) => Math.round(n * 10) / 10;
  const STORE = 'dataarcus-svg-kpi-v2', LIB = 'dataarcus-svg-kpi-library';
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };

  const TYPES = {
    rect: { en: 'Rectangle', ar: 'مستطيل', icon: 'bi-square' },
    circle: { en: 'Circle', ar: 'دائرة', icon: 'bi-circle' },
    line: { en: 'Line', ar: 'خط', icon: 'bi-slash-lg' },
    text: { en: 'Text', ar: 'نص', icon: 'bi-fonts' },
    ring: { en: 'Progress ring', ar: 'حلقة تقدم', icon: 'bi-bullseye' },
    arrow: { en: 'Trend arrow', ar: 'سهم اتجاه', icon: 'bi-caret-up-fill' },
    spark: { en: 'Sparkline', ar: 'خط الاتجاه', icon: 'bi-graph-up' }
  };
  const POS = { rect: [['x', 'y']], circle: [['cx', 'cy']], ring: [['cx', 'cy']], text: [['x', 'y']], arrow: [['x', 'y']], line: [['x1', 'y1'], ['x2', 'y2']], spark: [['x', 'y']] };

  // ---------- design state ----------
  const blankDesign = () => ({ name: 'My KPI', w: 240, h: 80, values: clone(T.TEMPLATES[0].values), layers: [] });
  const sanitize = (d) => {
    if (!d || typeof d !== 'object' || !Array.isArray(d.layers) || !Array.isArray(d.values)) return null;
    d.layers = d.layers.filter((l) => l && TYPES[l.type]).slice(0, 60);
    d.values = d.values.filter((v) => v && v.id && ['measure', 'ratio', 'diff', 'pct'].includes(v.kind)).slice(0, 30);
    d.w = Math.max(8, Math.min(1200, +d.w || 240)); d.h = Math.max(8, Math.min(1200, +d.h || 80));
    return d;
  };
  // the design, the selection and the undo history: svg-editor-store.js (0.3.2 SP25; the pages load it first)
  const S = window.SVGEditorStore.create({ limit: 100 });
  let zoom = 1; // the canvas's scale, set by renderCanvas; the pointer reads it
  let tour = null; // the beginner tutorial, set up below

  // ---------- history ----------
  const doUndo = () => S.undo();
  const doRedo = () => S.redo();
  const syncHistoryBtns = () => { $('undoBtn').disabled = !S.canUndo; $('redoBtn').disabled = !S.canRedo; };
  S.on('history', syncHistoryBtns);
  S.on('restore', () => renderAll());
  // Typing in a field makes one undo step per field visit, not one per key
  $('kdApp').addEventListener('focusin', () => S.newField());

  // ---------- values ----------
  const samples = () => {
    const m = {};
    S.design.values.forEach((v) => { if (v.kind === 'measure' && v.sample !== '' && v.sample != null && isFinite(+v.sample)) m[v.measure] = +v.sample; });
    return m;
  };
  // Test series for sparklines (newest first), made from each measure's test value and the chosen shape
  const SHAPES = {
    wave: (i, ph) => 1 + 0.12 * Math.sin(i * 0.9 + ph) + 0.05 * Math.cos(i * 2.1 + ph),
    up: (i, ph) => 1 / (1 + 0.045 * i) + 0.04 * Math.sin(i * 1.3 + ph),
    down: (i, ph) => 1 + 0.045 * i + 0.04 * Math.sin(i * 1.3 + ph)
  };
  const seriesFor = () => {
    const out = {}, shape = SHAPES[S.design.testShape] || SHAPES.up;
    S.design.values.forEach((v) => {
      if (v.kind !== 'measure' || v.sample === '' || v.sample == null || !isFinite(+v.sample)) return;
      let ph = 0; for (const ch of String(v.measure)) ph = (ph * 31 + ch.charCodeAt(0)) % 628;
      out[v.measure] = Array.from({ length: 60 }, (_, i) => (i === 0 ? +v.sample : Math.round(+v.sample * shape(i, ph / 100) / shape(0, ph / 100) * 100) / 100));
    });
    return out;
  };
  const preview = (d, tag) => K.toImageUrl(d, samples(), { tag: tag, series: seriesFor() });

  // ---------- canvas ----------
  const stage = $('stage');
  const compileForCanvas = () => preview(Object.assign({}, S.design, { hideIfBlank: null }), true);
  const svgEl = () => stage.querySelector('svg.kd-svg');
  const bboxOf = (i) => { const g = stage.querySelector(`g[data-l='${i}']`); if (!g) return null; try { const b = g.getBBox(); return b.width || b.height ? b : { x: b.x, y: b.y, width: 1, height: 1 }; } catch (e) { return null; } };
  const toDesign = (e) => { const s = svgEl(); const r = s.getBoundingClientRect(); return { x: (e.clientX - r.left) * S.design.w / r.width, y: (e.clientY - r.top) * S.design.h / r.height }; };

  const handlesFor = (l, b) => {
    const bd = l.bind || {}, H = [];
    if (l.type === 'rect' || l.type === 'spark') { if (!bd.w && !bd.h) H.push(['se', l.x + l.w, l.y + l.h]); if (!bd.w) H.push(['e', l.x + l.w, l.y + l.h / 2]); if (!bd.h) H.push(['s', l.x + l.w / 2, l.y + l.h]); }
    if ((l.type === 'circle' && !bd.r) || l.type === 'ring') H.push(['r', l.cx + l.r, l.cy]);
    if (l.type === 'line') { if (!bd.x1 && !bd.y1) H.push(['p1', l.x1, l.y1]); if (!bd.x2 && !bd.y2) H.push(['p2', l.x2, l.y2]); }
    if (l.type === 'arrow') H.push(['size', l.x + l.size, l.y + l.size]);
    if (l.type === 'text' && b) H.push(['fs', b.x + b.width, b.y + b.height]);
    return H;
  };

  function renderCanvas() {
    const out = compileForCanvas();
    const W = S.design.w, H = S.design.h;
    const box = stage.parentElement.clientWidth - 40;
    zoom = Math.max(0.5, Math.min(6, box / W, 360 / H));
    const body = decodeURIComponent(out.url.slice(K.PREFIX.length));
    stage.innerHTML = body;
    const s = stage.querySelector('svg');
    s.classList.add('kd-svg');
    s.setAttribute('width', Math.round(W * zoom)); s.setAttribute('height', Math.round(H * zoom));
    s.setAttribute('role', 'img'); s.setAttribute('aria-label', L('Design canvas', 'لوحة التصميم'));
    stage.classList.toggle('kd-transparent', !/^#[0-9a-f]{6}$/i.test(S.design.bg || ''));
    // editor overlay (never part of the design)
    const ns = 'http://www.w3.org/2000/svg';
    const ui = document.createElementNS(ns, 'g'); ui.setAttribute('class', 'kd-ui');
    const px = 1 / zoom;
    ptr.guides.forEach((g) => { const ln = document.createElementNS(ns, 'line'); Object.entries(g.axis === 'x' ? { x1: g.at, x2: g.at, y1: 0, y2: H } : { y1: g.at, y2: g.at, x1: 0, x2: W }).forEach(([k, v]) => ln.setAttribute(k, v)); ln.setAttribute('class', 'kd-guide'); ln.setAttribute('stroke-width', px); ui.appendChild(ln); });
    if (S.sel >= 0 && S.design.layers[S.sel]) {
      const b = bboxOf(S.sel), l = S.design.layers[S.sel];
      if (b) {
        const r = document.createElementNS(ns, 'rect');
        [['x', b.x - 2 * px], ['y', b.y - 2 * px], ['width', b.width + 4 * px], ['height', b.height + 4 * px], ['stroke-width', 1.5 * px]].forEach(([k, v]) => r.setAttribute(k, v));
        r.setAttribute('class', 'kd-selbox'); r.setAttribute('stroke-dasharray', `${4 * px} ${3 * px}`); ui.appendChild(r);
      }
      handlesFor(l, b).forEach(([id, x, y]) => {
        const h = document.createElementNS(ns, 'rect'), s2 = 9 * px;
        [['x', x - s2 / 2], ['y', y - s2 / 2], ['width', s2], ['height', s2], ['rx', 2 * px], ['stroke-width', 1.5 * px]].forEach(([k, v]) => h.setAttribute(k, v));
        h.setAttribute('class', 'kd-handle'); h.dataset.h = id; ui.appendChild(h);
      });
    }
    s.appendChild(ui);
    const hidden = preview(S.design, false).url === '';
    $('blankNote').hidden = !hidden;
    if (tour) tour.check();
  }

  // ---------- pointer: select, move, resize: svg-editor-pointer.js (0.3.2 SP33; the pages load it first) ----------
  const ptr = window.SVGEditorPointer.attach({
    stage, store: S, pos: POS, r1, clone,
    view: { hasCanvas: () => !!svgEl(), zoom: () => zoom, toDesign, bboxOf },
    on: { picked: () => { renderLayers(); renderProps(); }, canvas: () => renderCanvas(), moved: () => renderDax(), dropped: () => { renderProps(); save(); } }
  });

  // ---------- the panels: layers, add bar, properties, data: svg-editor-panels.js (0.3.2 SP33; the pages load it first) ----------
  const P = window.SVGEditorPanels.create({
    $, store: S, K, types: TYPES, pos: POS, L, esc, clone, r1, samples, track, toast: (m) => toast(m), tour: () => tour,
    view: { canvas: () => renderCanvas(), dax: () => renderDax(), save: () => save(), all: () => renderAll() }
  });
  const { renderLayers, renderAddBar, renderProps, renderValues, layerAction, valueName } = P;

  // Values that can only give 100% (or 0): two values on the same measure, or a formula of a value with itself
  function sameWarnings() {
    const out = [], seen = {}, vname = (v) => v.label || v.measure || v.id;
    S.design.values.forEach((v) => {
      if (v.kind !== 'measure') return;
      const k = String(v.measure || '').trim().toLowerCase(); if (!k) return;
      if (seen[k]) out.push(L(`${vname(seen[k])} and ${vname(v)} both use [${v.measure}], so any comparison between them is always 100% (or 0).`, `${vname(seen[k])} و${vname(v)} يستخدمان نفس المقياس [${v.measure}]، لذلك أي مقارنة بينهما ستكون دائمًا 100% (أو 0).`));
      else seen[k] = v;
    });
    S.design.values.forEach((v) => { if (v.kind !== 'measure' && v.a && v.a === v.b) out.push(L(`${vname(v)} compares ${valueName(v.a)} with itself.`, `${vname(v)} يقارن ${valueName(v.a)} بنفسه.`)); });
    return out;
  }

  // ---------- DAX ----------
  function renderDax() {
    const d = K.toDax(S.design);
    $('dax').textContent = d.dax;
    const warns = sameWarnings();
    const errs = d.errors.filter((e, i, a) => a.indexOf(e) === i).concat(warns);
    $('errors').textContent = errs.join(' · ');
    $('errors').hidden = !errs.length;
    $('valWarn').innerHTML = warns.map((w) => '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i> ' + esc(w)).join('<br>');
    $('valWarn').hidden = !warns.length;
  }

  // ---------- starters, share, import/export, library ----------
  const renderStarters = () => {
    $('starters').innerHTML = T.TEMPLATES.map((t) => `<button class="kd-starter${t.premium ? ' kd-pro' : ''}" type="button" data-t="${t.id}">${esc(isAr() && t.nameAr ? t.nameAr : t.name)}${t.premium ? ` <span class="kd-prem cap-pill">${L('Premium preview', 'نسخة مميزة تجريبية')}</span>` : ''}</button>`).join('') +
      `<button class="kd-starter" type="button" data-t="__blank"><i class="bi bi-plus-lg"></i> ${L('Blank card', 'بطاقة فارغة')}</button>`;
  };
  $('starters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    const old = {}; S.design.values.forEach((v) => { if (v.kind === 'measure') old[v.id] = v; });
    const t = b.dataset.t === '__blank' ? blankDesign() : clone(T.TEMPLATES.find((x) => x.id === b.dataset.t));
    if (b.dataset.t === '__blank' && tour) tour.blank(t);
    // keep the measure names and test values the visitor already typed
    t.values.forEach((v) => { if (old[v.id]) { v.measure = old[v.id].measure; v.sample = old[v.id].sample; } });
    S.replace(t); renderAll();
    track('svgkpi_template_select', { template: b.dataset.t });
    if (t.premium) track('svgkpi_premium_click', { feature: 'template_' + t.id });
  });

  const b64u = { enc: (bytes) => btoa(String.fromCharCode.apply(null, bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)) };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const encodeDesign = async () => {
    const raw = new TextEncoder().encode(JSON.stringify(S.design));
    if (typeof CompressionStream === 'function') { try { return 'z' + b64u.enc(await pipe(raw, new CompressionStream('deflate-raw'))); } catch (e) { /* fall through */ } }
    return 'j' + b64u.enc(raw);
  };
  const decodeDesign = async (s) => {
    const bytes = b64u.dec(s.slice(1));
    const raw = s[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
    return sanitize(JSON.parse(new TextDecoder().decode(raw)));
  };
  $('shareBtn').addEventListener('click', async () => {
    const code = await encodeDesign();
    const url = location.origin + location.pathname + '#d=' + code;
    history.replaceState(null, '', '#d=' + code);
    const done = () => toast(L('Share link copied', 'تم نسخ رابط المشاركة'));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => toast(L('Link is in the address bar', 'الرابط في شريط العنوان'))); else toast(L('Link is in the address bar', 'الرابط في شريط العنوان'));
    track('svgkpi_share', { layers: S.design.layers.length });
  });
  $('exportBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(S.design, null, 2)], { type: 'application/json' }));
    a.download = (S.design.name || 'svg-kpi').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.svgkpi.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track('svgkpi_export');
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', () => {
    const f = $('importFile').files[0]; if (!f) return;
    f.text().then((t) => { const d = sanitize(JSON.parse(t)); if (!d) throw new Error('bad'); S.replace(d); renderAll(); toast(L('Design imported', 'تم استيراد التصميم')); })
      .catch(() => toast(L('That file is not a design', 'هذا الملف ليس تصميمًا')));
    $('importFile').value = '';
  });

  // Premium preview: a library of saved designs in this browser
  const renderLibrary = () => {
    const lib = store.get(LIB, []);
    $('libList').innerHTML = lib.length ? lib.map((d, i) => `<li><button type="button" class="kd-link" data-lib-open="${i}"><i class="bi bi-folder2-open"></i> ${esc(d.name || 'SVG KPI')}</button><small>${esc(new Date(d.savedAt || 0).toLocaleDateString(isAr() ? 'ar' : 'en'))}</small><button type="button" class="kd-x" data-lib-del="${i}" aria-label="${L('Delete', 'حذف')}"><i class="bi bi-trash"></i></button></li>`).join('') : `<li class="kd-empty">${L('Nothing saved yet.', 'لا يوجد شيء محفوظ بعد.')}</li>`;
  };
  $('libBtn').addEventListener('click', () => { const p = $('libPanel'); p.hidden = !p.hidden; if (!p.hidden) { renderLibrary(); track('svgkpi_premium_click', { feature: 'library' }); } });
  $('libSave').addEventListener('click', () => {
    const lib = store.get(LIB, []).filter((d) => d.name !== S.design.name);
    lib.unshift(Object.assign(clone(S.design), { savedAt: Date.now() }));
    store.set(LIB, lib.slice(0, 50)); renderLibrary(); toast(L('Saved to your library', 'تم الحفظ في مكتبتك'));
    track('svgkpi_library_save', { layers: S.design.layers.length });
  });
  $('libList').addEventListener('click', (e) => {
    const o = e.target.closest('[data-lib-open]'), x = e.target.closest('[data-lib-del]');
    const lib = store.get(LIB, []);
    if (o) { const d = sanitize(clone(lib[+o.dataset.libOpen])); if (d) { delete d.savedAt; S.replace(d); renderAll(); } }
    if (x) { lib.splice(+x.dataset.libDel, 1); store.set(LIB, lib); renderLibrary(); }
  });

  // ---------- copy ----------
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 2200); };
  $('copyBtn').addEventListener('click', () => {
    const text = $('dax').textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('dax')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('DAX copied. Set Data category to Image URL.', 'تم نسخ DAX. اجعل Data category = Image URL.')), fallback); else fallback();
    track('svgkpi_copy', { template: S.design.id || 'custom', layers: S.design.layers.length });
    if (tour) tour.copied();
  });
  $('undoBtn').addEventListener('click', doUndo);
  $('redoBtn').addEventListener('click', doRedo);

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
    if (S.sel < 0 || !S.design.layers[S.sel]) return;
    if (!$('kdApp').contains(document.activeElement) && document.activeElement !== document.body) return;
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); layerAction('dup', S.sel); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); layerAction('del', S.sel); return; }
    if (e.key === 'Escape') { S.select(-1); renderAll(); return; }
    const step = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) {
      e.preventDefault(); S.checkpoint();
      const l = S.design.layers[S.sel], bd = l.bind || {};
      POS[l.type].forEach(([kx, ky]) => { if (!bd[kx]) l[kx] = r1(+l[kx] + mv[0]); if (!bd[ky]) l[ky] = r1(+l[ky] + mv[1]); });
      renderCanvas(); renderDax(); renderProps(); save();
    }
  });

  // ---------- tutorial: build your first KPI card ----------
  // Each step checks the design itself, so it moves on as soon as the visitor has done it.
  tour = (() => {
    const KEY = 'dataarcus-svg-kpi-tour';
    let step = -1, flags = {}, startSample = null, advancing = false, panel = null;
    const texts = () => S.design.layers.filter((l) => l.type === 'text');
    const sales = () => S.design.values.find((v) => v.kind === 'measure');
    const rectIndex = () => S.design.layers.findIndex((l) => l.type === 'rect');
    const selectRect = () => { const i = rectIndex(); if (i >= 0 && S.sel !== i) { S.select(i); renderAll(); } };
    const STEPS = [
      { target: () => '[data-t="__blank"]', t: ['Start with a blank card', 'ابدأ ببطاقة فارغة'],
        d: ['Click <b>Blank card</b> at the top. You will build a small sales card from nothing.', 'اضغط <b>بطاقة فارغة</b> في الأعلى. ستبني بطاقة مبيعات صغيرة من الصفر.'], ok: () => flags.blank },
      { target: () => '[data-add="text"]', t: ['Add a title', 'أضف عنوانًا'],
        d: ['Click <b>Text</b> in the Add panel. We place it at the top of the card for you.', 'اضغط <b>نص</b> في لوحة الإضافة. سنضعه في أعلى البطاقة.'], ok: () => texts().length >= 1 },
      { target: () => '[data-p="text"]', t: ['Name it', 'سمّه'],
        d: ['In the panel on the right, change the text to <b>Sales</b>, or any title you like.', 'من اللوحة الجانبية، غيّر النص إلى <b>المبيعات</b> أو أي عنوان تحبه.'],
        ok: () => texts().some((l) => !(l.bind && l.bind.text) && String(l.text || '').trim() && !/^(Text|نص)$/.test(String(l.text).trim())) },
      { target: () => (texts().length >= 2 ? '[data-bind-toggle="text"]' : '[data-add="text"]'), t: ['Show a live number', 'اعرض رقمًا حيًا'],
        d: ['Add another <b>Text</b>, then under <b>Link to data</b> tick <b>Show a value</b>. It now shows your Sales measure, formatted.', 'أضف <b>نصًا</b> آخر، ثم من <b>اربط بالبيانات</b> فعّل <b>اعرض قيمة</b>. سيعرض الآن مقياس المبيعات منسقًا.'],
        ok: () => texts().some((l) => l.bind && l.bind.text && l.bind.text.v) },
      { target: () => (rectIndex() >= 0 ? '[data-bind-toggle="w"]' : '[data-add="rect"]'), prep: selectRect, t: ['Make a progress bar', 'اصنع شريط تقدم'],
        d: ['Add a <b>Rectangle</b>, then tick <b>Width from a value</b>. It grows with Achievement (Sales ÷ Target).', 'أضف <b>مستطيلًا</b>، ثم فعّل <b>العرض من قيمة</b>. سيكبر مع نسبة الإنجاز (المبيعات ÷ الهدف).'],
        ok: () => S.design.layers.some((l) => l.type === 'rect' && l.bind && l.bind.w && l.bind.w.v) },
      { target: () => '[data-bind-toggle="fill"]', prep: selectRect, t: ['Color it by rules', 'لوّنه حسب قواعد'],
        d: ['With the bar selected, tick <b>Fill color by rules</b>. Below 0.9, which means 90% of target, it turns red.', 'والشريط محدد، فعّل <b>لون التعبئة حسب قواعد</b>. تحت 0.9، أي 90% من الهدف، يتحول للأحمر.'],
        ok: () => S.design.layers.some((l) => l.bind && l.bind.fill && l.bind.fill.rules) },
      { target: () => '.kd-slider', enter: () => { startSample = (sales() || {}).sample; }, t: ['Test it', 'جرّبه'],
        d: ['Drag the <b>Sales</b> test slider in the Data panel. Watch the number, the bar and its color react.', 'اسحب شريط تجربة <b>المبيعات</b> في لوحة البيانات. شاهد الرقم والشريط ولونه يتفاعل.'],
        ok: () => sales() && sales().sample !== startSample },
      { target: () => '#copyBtn', t: ['Take it to Power BI', 'انقله إلى Power BI'],
        d: ['Click <b>Copy DAX</b>. In Power BI: <b>New measure</b>, paste, set <b>Data category</b> to <b>Image URL</b>. Then <b>Insert › Image</b> and set its <b>Image URL</b> with <b>fx › Field value</b> to your measure.',
          'اضغط <b>نسخ DAX</b>. في Power BI: <b>New measure</b> ثم الصق واجعل <b>Data category</b> = <b>Image URL</b>. بعدها <b>Insert › Image</b> واختر في <b>Image URL</b> عبر <b>fx › Field value</b> مقياسك.'], ok: () => flags.copied }
    ];
    const target = () => { const sel_ = STEPS[step].target(); let el = document.querySelector(sel_); if (el && el.tagName === 'INPUT' && el.closest('label')) el = el.closest('label'); return el; };
    const clearHint = () => document.querySelectorAll('.kd-glow').forEach((e) => e.classList.remove('kd-glow'));
    const hint = () => { clearHint(); if (step < 0 || step >= STEPS.length) return; const el = target(); if (el) el.classList.add('kd-glow'); };
    const draw = (ok) => {
      if (!panel) { panel = document.createElement('div'); panel.className = 'kd-tour'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-live', 'polite'); document.body.appendChild(panel);
        panel.addEventListener('click', (e) => { const b = e.target.closest('[data-tour]'); if (!b) return; const a = b.dataset.tour;
          if (a === 'show') { const s0 = STEPS[step]; if (s0 && s0.prep) s0.prep(); const el = target(); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); hint(); } }
          if (a === 'skip') next(); if (a === 'close') stop(); if (a === 'again') start();
          if (a === 'kpi') { stop(); const btn = document.querySelector('[data-t="card"]'); if (btn) btn.click(); }
          if (a === 'spark') { stop(); const btn = document.querySelector('[data-add="spark"]'); if (btn) btn.click(); }
          if (a === 'share') { stop(); $('shareBtn').click(); } }); }
      if (step >= STEPS.length) {
        panel.className = 'kd-tour kd-tour-done';
        panel.innerHTML = `<div class="kd-tour-top"><span class="kd-tour-k"><i class="bi bi-trophy-fill"></i> ${L('Tutorial complete', 'اكتمل الدرس')}</span><button type="button" class="kd-x" data-tour="close" aria-label="${L('Close', 'إغلاق')}"><i class="bi bi-x-lg"></i></button></div>
          <h4>${L('You built a live KPI card!', 'بنيت بطاقة مؤشر حيّة!')}</h4><p>${L('Title, live value, a progress bar and color rules, all in one DAX measure. Where next?', 'عنوان وقيمة حيّة وشريط تقدم وقواعد ألوان، كلها في مقياس DAX واحد. ماذا بعد؟')}</p>
          <div class="kd-tour-btns kd-tour-wrap"><button type="button" class="kd-link" data-tour="spark"><i class="bi bi-graph-up"></i> ${L('Add a sparkline', 'أضف خط اتجاه')}</button><button type="button" class="kd-link" data-tour="kpi"><i class="bi bi-stars"></i> ${L('Open the KPI card', 'افتح بطاقة المؤشر')}</button><button type="button" class="kd-link" data-tour="share"><i class="bi bi-link-45deg"></i> ${L('Share your design', 'شارك تصميمك')}</button></div>`;
        return;
      }
      const s0 = STEPS[step];
      panel.className = 'kd-tour' + (ok ? ' ok' : '');
      panel.innerHTML = `<div class="kd-tour-top"><span class="kd-tour-k"><i class="bi bi-mortarboard"></i> ${L('Tutorial', 'درس تفاعلي')} · ${step + 1} / ${STEPS.length}</span><button type="button" class="kd-x" data-tour="close" aria-label="${L('Close', 'إغلاق')}"><i class="bi bi-x-lg"></i></button></div>
        <div class="kd-tour-bar"><b style="width:${Math.round(100 * (step + (ok ? 1 : 0)) / STEPS.length)}%"></b></div>
        <h4>${ok ? '<i class="bi bi-check-circle-fill"></i> ' : ''}${L(s0.t[0], s0.t[1])}</h4><p>${L(s0.d[0], s0.d[1])}</p>
        <div class="kd-tour-btns"><button type="button" class="btn btn-accent btn-sm" data-tour="show"><i class="bi bi-cursor"></i> ${L('Show me', 'أرني')}</button><button type="button" class="kd-link" data-tour="skip">${L('Skip step', 'تخطَّ الخطوة')}</button></div>`;
    };
    const confetti = () => { const box = document.createElement('div'); box.className = 'kd-confetti'; const cs = ['#00d4ff', '#6c5ce7', '#fdcb6e', '#00cec9', '#fd79a8'];
      for (let i = 0; i < 36; i++) { const c = document.createElement('i'); c.style.left = Math.random() * 100 + 'vw'; c.style.background = cs[i % cs.length]; c.style.animationDelay = (Math.random() * 0.5) + 's'; box.appendChild(c); }
      document.body.appendChild(box); setTimeout(() => box.remove(), 2600); };
    function next() {
      advancing = false; step++;
      track('svgkpi_tutorial_step', { step: step });
      if (step >= STEPS.length) { clearHint(); draw(); confetti(); store.set(KEY, { done: true }); track('svgkpi_tutorial_complete'); return; }
      if (STEPS[step].enter) STEPS[step].enter();
      draw(false); hint(); check();
    }
    function start() { hideBanner(); step = -1; flags = {}; store.set(KEY, { seen: true }); track('svgkpi_tutorial_start'); next(); }
    function stop() { step = -1; clearHint(); if (panel) { panel.remove(); panel = null; } }
    function check() {
      if (step < 0 || step >= STEPS.length || advancing) return;
      hint();
      if (!STEPS[step].ok()) return;
      advancing = true; draw(true); setTimeout(next, 900);
    }
    // place the tutorial's layers neatly: title top-left, value under it, bar along the bottom
    function place(l) {
      if (step < 0) return;
      const W = S.design.w;
      if (l.type === 'text' && texts().length === 1) Object.assign(l, { x: 16, y: 26, size: 12, weight: 600, anchor: 'start', fill: '#94a3b8' });
      else if (l.type === 'text') Object.assign(l, { x: 16, y: 58, size: 26, weight: 800, anchor: 'start', fill: '#f8fafc' });
      else if (l.type === 'rect') Object.assign(l, { x: 16, y: 70, w: W - 32, h: 8, rx: 4, fill: '#00d4ff' });
    }
    function blank(d) { if (step < 0) return; flags.blank = true; Object.assign(d, { name: 'Sales card', w: 260, h: 92, bg: '#1a1f2e', radius: 12 }); }
    function copied() { if (step >= 0) { flags.copied = true; check(); } }
    // entry points: a button with the other actions, and a one-time invitation for first visits
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'kd-tour-btn';
    const label = () => { btn.innerHTML = `<i class="bi bi-mortarboard"></i> ${L('Tutorial', 'درس تفاعلي')}`; };
    label(); btn.addEventListener('click', start); document.querySelector('.kd-actions').prepend(btn);
    // the first-visit banner is in the page's HTML (so nothing jumps when it appears); returning visitors never see it
    const banner = $('kdBanner');
    const drawBanner = () => { banner.innerHTML = `<i class="bi bi-mortarboard"></i><div><b>${L('New here? Build your first KPI card in 2 minutes.', 'جديد هنا؟ ابنِ أول بطاقة مؤشر في دقيقتين.')}</b><span>${L('A short, guided tutorial. No Power BI needed until the last step.', 'درس قصير موجّه. لا تحتاج Power BI حتى الخطوة الأخيرة.')}</span></div><button type="button" class="btn btn-accent btn-sm" data-b="go">${L('Start tutorial', 'ابدأ الدرس')}</button><button type="button" class="kd-link" data-b="no">${L('No thanks', 'لا، شكرًا')}</button>`; };
    function hideBanner() { if (banner) banner.remove(); }
    if (banner) banner.addEventListener('click', (e) => { const b = e.target.closest('[data-b]'); if (!b) return; if (b.dataset.b === 'go') start(); else { store.set(KEY, { seen: true }); hideBanner(); } });
    const st = store.get(KEY, null);
    if (st) hideBanner();
    new MutationObserver(() => { label(); if (banner && banner.isConnected) drawBanner(); if (step >= 0 || (panel && step >= STEPS.length)) draw(false); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    return { check: check, place: place, blank: blank, copied: copied, start: start };
  })();

  // ---------- render + boot ----------
  const save = () => store.set(STORE, S.design);
  function renderAll() { renderStarters(); renderAddBar(); renderLayers(); renderProps(); renderValues(); renderCanvas(); renderDax(); syncHistoryBtns(); save(); }
  window.addEventListener('resize', () => { clearTimeout(renderAll.t); renderAll.t = setTimeout(renderCanvas, 120); });
  new MutationObserver(() => renderAll()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  (async () => {
    const m = /#d=([zj][\w-]+)/.exec(location.hash);
    if (m) { try { S.load(await decodeDesign(m[1])); if (S.design) track('svgkpi_open_shared'); } catch (e) { S.load(null); } }
    if (!S.design) S.load(sanitize(store.get(STORE, null)));
    if (!S.design) S.load(clone(T.TEMPLATES[0]));
    renderAll();
  })();
});
