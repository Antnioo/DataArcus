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
  if (!K || !T || !$('kdApp')) return;
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
    arrow: { en: 'Trend arrow', ar: 'سهم اتجاه', icon: 'bi-caret-up-fill' }
  };
  const FMT = [['auto', 'Auto (1.2K / 3.4M)', 'تلقائي (1.2K / 3.4M)'], ['n0', '1,235', '1,235'], ['n1', '1,234.6', '1,234.6'], ['n2', '1,234.57', '1,234.57'], ['k1', '1.2K', '1.2K'], ['m1', '1.2M', '1.2M'], ['p0', '83%', '83%'], ['p1', '82.7%', '82.7%']];
  const KINDS = { ratio: ['A ÷ B', 'أ ÷ ب'], diff: ['A − B', 'أ − ب'], pct: ['% change of A vs B', 'نسبة تغير أ عن ب'] };
  const POS = { rect: [['x', 'y']], circle: [['cx', 'cy']], ring: [['cx', 'cy']], text: [['x', 'y']], arrow: [['x', 'y']], line: [['x1', 'y1'], ['x2', 'y2']] };

  // ---------- design state ----------
  const blankDesign = () => ({ name: 'My KPI', w: 240, h: 80, values: clone(T.TEMPLATES[0].values), layers: [] });
  const sanitize = (d) => {
    if (!d || typeof d !== 'object' || !Array.isArray(d.layers) || !Array.isArray(d.values)) return null;
    d.layers = d.layers.filter((l) => l && TYPES[l.type]).slice(0, 60);
    d.values = d.values.filter((v) => v && v.id && ['measure', 'ratio', 'diff', 'pct'].includes(v.kind)).slice(0, 30);
    d.w = Math.max(8, Math.min(1200, +d.w || 240)); d.h = Math.max(8, Math.min(1200, +d.h || 80));
    return d;
  };
  let design = null, sel = -1, zoom = 1, drag = null, guides = [];
  const undo = [], redo = [];

  // ---------- history ----------
  const snap = () => JSON.stringify(design);
  const checkpoint = () => { undo.push(snap()); if (undo.length > 100) undo.shift(); redo.length = 0; syncHistoryBtns(); };
  const restore = (s) => { design = JSON.parse(s); if (sel >= design.layers.length) sel = design.layers.length - 1; renderAll(); };
  const doUndo = () => { if (!undo.length) return; redo.push(snap()); restore(undo.pop()); };
  const doRedo = () => { if (!redo.length) return; undo.push(snap()); restore(redo.pop()); };
  const syncHistoryBtns = () => { $('undoBtn').disabled = !undo.length; $('redoBtn').disabled = !redo.length; };
  // Typing in a field makes one undo step per field visit, not one per key
  let armed = true;
  $('kdApp').addEventListener('focusin', () => { armed = true; });
  const beforeEdit = () => { if (armed) { checkpoint(); armed = false; } };

  // ---------- values ----------
  const byId = (id) => design.values.find((v) => v.id === id);
  const valueName = (id) => { const v = byId(id); return v ? v.label || v.measure || v.id : '?'; };
  const samples = () => {
    const m = {};
    design.values.forEach((v) => { if (v.kind === 'measure' && v.sample !== '' && v.sample != null && isFinite(+v.sample)) m[v.measure] = +v.sample; });
    return m;
  };
  // Same BLANK rules as the compiler, for showing formula results next to the inputs
  const evalValues = () => {
    const out = {}, m = samples();
    design.values.forEach((v) => {
      const a = out[v.a], b = out[v.b];
      if (v.kind === 'measure') out[v.id] = v.measure in m ? m[v.measure] : null;
      else if (v.kind === 'ratio') out[v.id] = a == null || b == null || b === 0 ? null : a / b;
      else if (v.kind === 'diff') out[v.id] = a == null && b == null ? null : (a || 0) - (b || 0);
      else if (v.kind === 'pct') { const n = a == null && b == null ? null : (a || 0) - (b || 0); out[v.id] = n == null || b == null || b === 0 ? null : n / b; }
    });
    return out;
  };
  const isFraction = (id) => { const v = byId(id); return v && (v.kind === 'ratio' || v.kind === 'pct'); };
  const usedBy = (id) => {
    const refs = [];
    design.values.forEach((v) => { if (v.a === id || v.b === id) refs.push(v.label); });
    const walk = (o) => { if (!o || typeof o !== 'object') return false; if (o.v === id) return true; return Object.values(o).some(walk); };
    design.layers.forEach((l) => { if (walk(l.bind)) refs.push(l.name || l.type); });
    if (design.hideIfBlank === id) refs.push(L('Hide when blank', 'الإخفاء عند الفراغ'));
    return refs;
  };
  const newId = (base) => { let i = 1; while (design.values.some((v) => v.id === base + i)) i++; return base + i; };
  const firstValue = (preferFraction) => { const f = design.values.find((v) => (preferFraction ? v.kind !== 'measure' : true)); return (f || design.values[0] || {}).id; };

  // ---------- canvas ----------
  const stage = $('stage');
  const compileForCanvas = () => K.toImageUrl(Object.assign({}, design, { hideIfBlank: null }), samples(), { tag: true });
  const svgEl = () => stage.querySelector('svg.kd-svg');
  const bboxOf = (i) => { const g = stage.querySelector(`g[data-l='${i}']`); if (!g) return null; try { const b = g.getBBox(); return b.width || b.height ? b : { x: b.x, y: b.y, width: 1, height: 1 }; } catch (e) { return null; } };
  const toDesign = (e) => { const s = svgEl(); const r = s.getBoundingClientRect(); return { x: (e.clientX - r.left) * design.w / r.width, y: (e.clientY - r.top) * design.h / r.height }; };

  const handlesFor = (l, b) => {
    const bd = l.bind || {}, H = [];
    if (l.type === 'rect') { if (!bd.w && !bd.h) H.push(['se', l.x + l.w, l.y + l.h]); if (!bd.w) H.push(['e', l.x + l.w, l.y + l.h / 2]); if (!bd.h) H.push(['s', l.x + l.w / 2, l.y + l.h]); }
    if ((l.type === 'circle' && !bd.r) || l.type === 'ring') H.push(['r', l.cx + l.r, l.cy]);
    if (l.type === 'line') { if (!bd.x1 && !bd.y1) H.push(['p1', l.x1, l.y1]); if (!bd.x2 && !bd.y2) H.push(['p2', l.x2, l.y2]); }
    if (l.type === 'arrow') H.push(['size', l.x + l.size, l.y + l.size]);
    if (l.type === 'text' && b) H.push(['fs', b.x + b.width, b.y + b.height]);
    return H;
  };

  function renderCanvas() {
    const out = compileForCanvas();
    const W = design.w, H = design.h;
    const box = stage.parentElement.clientWidth - 40;
    zoom = Math.max(0.5, Math.min(6, box / W, 360 / H));
    const body = decodeURIComponent(out.url.slice(K.PREFIX.length));
    stage.innerHTML = body;
    const s = stage.querySelector('svg');
    s.classList.add('kd-svg');
    s.setAttribute('width', Math.round(W * zoom)); s.setAttribute('height', Math.round(H * zoom));
    s.setAttribute('role', 'img'); s.setAttribute('aria-label', L('Design canvas', 'لوحة التصميم'));
    stage.classList.toggle('kd-transparent', !/^#[0-9a-f]{6}$/i.test(design.bg || ''));
    // editor overlay (never part of the design)
    const ns = 'http://www.w3.org/2000/svg';
    const ui = document.createElementNS(ns, 'g'); ui.setAttribute('class', 'kd-ui');
    const px = 1 / zoom;
    guides.forEach((g) => { const ln = document.createElementNS(ns, 'line'); Object.entries(g.axis === 'x' ? { x1: g.at, x2: g.at, y1: 0, y2: H } : { y1: g.at, y2: g.at, x1: 0, x2: W }).forEach(([k, v]) => ln.setAttribute(k, v)); ln.setAttribute('class', 'kd-guide'); ln.setAttribute('stroke-width', px); ui.appendChild(ln); });
    if (sel >= 0 && design.layers[sel]) {
      const b = bboxOf(sel), l = design.layers[sel];
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
    const hidden = K.toImageUrl(design, samples()).url === '';
    $('blankNote').hidden = !hidden;
  }

  // ---------- pointer: select, move, resize ----------
  stage.addEventListener('pointerdown', (e) => {
    if (!svgEl() || e.button > 0) return;
    const p = toDesign(e), hEl = e.target.closest('[data-h]'), lEl = e.target.closest('[data-l]');
    if (hEl && sel >= 0) drag = { mode: 'resize', h: hEl.dataset.h, p0: p, l0: clone(design.layers[sel]), b0: bboxOf(sel), moved: false };
    else if (lEl) {
      const i = +lEl.dataset.l;
      if (i !== sel) { sel = i; renderLayers(); renderProps(); }
      drag = { mode: 'move', p0: p, l0: clone(design.layers[sel]), b0: bboxOf(sel), others: design.layers.map((_, j) => (j === sel ? null : bboxOf(j))).filter(Boolean), moved: false };
    } else { sel = -1; renderLayers(); renderProps(); renderCanvas(); return; }
    stage.setPointerCapture(e.pointerId);
    renderCanvas();
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toDesign(e); let dx = p.x - drag.p0.x, dy = p.y - drag.p0.y;
    if (!drag.moved) { if (Math.hypot(dx, dy) * zoom < 3) return; checkpoint(); drag.moved = true; }
    const l = design.layers[sel], l0 = drag.l0, bd = l0.bind || {};
    guides = [];
    if (drag.mode === 'move') {
      // snap the box edges and centre to the card and to other layers (hold Alt to turn off)
      if (!e.altKey && drag.b0) {
        const thr = 5 / zoom, b = drag.b0;
        const tx = [0, design.w / 2, design.w], ty = [0, design.h / 2, design.h];
        drag.others.forEach((o) => { tx.push(o.x, o.x + o.width / 2, o.x + o.width); ty.push(o.y, o.y + o.height / 2, o.y + o.height); });
        const best = (start, size, targets, d) => { let bestD = null; [0, size / 2, size].forEach((off) => targets.forEach((t) => { const diff = t - (start + d + off); if (Math.abs(diff) < thr && (bestD == null || Math.abs(diff) < Math.abs(bestD.diff))) bestD = { diff: diff, at: t }; })); return bestD; };
        const sx = best(b.x, b.width, tx, dx), sy = best(b.y, b.height, ty, dy);
        if (sx) { dx += sx.diff; guides.push({ axis: 'x', at: sx.at }); }
        if (sy) { dy += sy.diff; guides.push({ axis: 'y', at: sy.at }); }
      }
      POS[l.type].forEach(([kx, ky]) => { if (!bd[kx]) l[kx] = r1(l0[kx] + dx); if (!bd[ky]) l[ky] = r1(l0[ky] + dy); });
    } else {
      const h = drag.h;
      if (h === 'se' || h === 'e') l.w = Math.max(1, r1(p.x - l0.x));
      if (h === 'se' || h === 's') l.h = Math.max(1, r1(p.y - l0.y));
      if (h === 'r') l.r = Math.max(1, r1(Math.hypot(p.x - l0.cx, p.y - l0.cy)));
      if (h === 'p1') { l.x1 = r1(p.x); l.y1 = r1(p.y); }
      if (h === 'p2') { l.x2 = r1(p.x); l.y2 = r1(p.y); }
      if (h === 'size') l.size = Math.max(4, r1(Math.max(p.x - l0.x, p.y - l0.y)));
      if (h === 'fs' && drag.b0) l.size = Math.max(4, Math.min(200, r1(l0.size * (p.y - drag.b0.y) / drag.b0.height)));
    }
    renderCanvas(); renderDax();
  });
  const endDrag = () => { if (!drag) return; const moved = drag.moved; drag = null; guides = []; if (moved) { renderProps(); save(); } renderCanvas(); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // ---------- layers panel ----------
  function renderLayers() {
    const list = design.layers.map((l, i) => ({ l, i })).reverse(); // top layer first, like design tools
    $('layers').innerHTML = list.length ? list.map(({ l, i }) => {
      const t = TYPES[l.type], linked = l.bind && Object.keys(l.bind).length;
      return `<li class="kd-layer${i === sel ? ' active' : ''}" data-i="${i}"><button type="button" class="kd-lname" data-act="sel" data-i="${i}"><i class="bi ${t.icon}"></i><span>${esc(l.name || L(t.en, t.ar))}</span>${linked ? `<i class="bi bi-link-45deg kd-linked" title="${L('Linked to data', 'مرتبط بالبيانات')}"></i>` : ''}</button>
        <span class="kd-lbtns"><button type="button" data-act="up" data-i="${i}" aria-label="${L('Bring forward', 'تقديم للأمام')}" ${i === design.layers.length - 1 ? 'disabled' : ''}><i class="bi bi-arrow-up"></i></button><button type="button" data-act="down" data-i="${i}" aria-label="${L('Send backward', 'إرجاع للخلف')}" ${i === 0 ? 'disabled' : ''}><i class="bi bi-arrow-down"></i></button><button type="button" data-act="dup" data-i="${i}" aria-label="${L('Duplicate', 'تكرار')}"><i class="bi bi-copy"></i></button><button type="button" data-act="del" data-i="${i}" aria-label="${L('Delete', 'حذف')}"><i class="bi bi-trash"></i></button></span></li>`;
    }).join('') : `<li class="kd-empty">${L('No layers yet. Add one above.', 'لا توجد طبقات بعد. أضف واحدة من الأعلى.')}</li>`;
  }
  const layerAction = (act, i) => {
    if (act === 'sel') { sel = i; renderAll(); return; }
    checkpoint();
    const ls = design.layers;
    if (act === 'up' && i < ls.length - 1) { [ls[i], ls[i + 1]] = [ls[i + 1], ls[i]]; sel = i + 1; }
    if (act === 'down' && i > 0) { [ls[i], ls[i - 1]] = [ls[i - 1], ls[i]]; sel = i - 1; }
    if (act === 'dup') { const c = clone(ls[i]); c.name = (c.name || L(TYPES[c.type].en, TYPES[c.type].ar)) + ' 2'; POS[c.type].forEach(([kx, ky]) => { c[kx] = +c[kx] + 6; c[ky] = +c[ky] + 6; }); ls.splice(i + 1, 0, c); sel = i + 1; }
    if (act === 'del') { ls.splice(i, 1); sel = Math.min(i, ls.length - 1); }
    renderAll();
  };
  $('layers').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) layerAction(b.dataset.act, +b.dataset.i); });

  // ---------- add layers ----------
  const makeLayer = (type) => {
    const W = design.w, H = design.h, m = Math.min(W, H), n = design.layers.filter((l) => l.type === type).length + 1;
    const name = L(TYPES[type].en, TYPES[type].ar) + ' ' + n;
    const R = (v) => Math.round(v);
    switch (type) {
      case 'rect': return { type, name, x: R(W / 2 - Math.min(40, W / 3)), y: R(H / 2 - Math.min(10, H / 4)), w: R(Math.min(80, W / 1.5)), h: R(Math.min(20, H / 2)), rx: 4, fill: '#00d4ff' };
      case 'circle': return { type, name, cx: R(W / 2), cy: R(H / 2), r: Math.max(4, R(m / 4)), fill: '#6c5ce7' };
      case 'line': return { type, name, x1: R(W * 0.25), y1: R(H / 2), x2: R(W * 0.75), y2: R(H / 2), stroke: '#94a3b8', sw: 2, cap: 'round' };
      case 'text': return { type, name, x: R(W / 2), y: R(H / 2 + 5), size: 14, weight: 600, anchor: 'middle', fill: '#f8fafc', text: L('Text', 'نص') };
      case 'ring': return { type, name, cx: R(W / 2), cy: R(H / 2), r: Math.max(8, R(m / 2 - 10)), sw: 8, track: '#1e293b', fill: '#00d4ff', cap: 'round', p: 0.75 };
      case 'arrow': return { type, name, x: R(W / 2 - 8), y: R(H / 2 - 8), size: 16, goodWhen: 'up', good: '#22c55e', bad: '#ef4444', neutral: '#94a3b8' };
    }
  };
  $('addBar').innerHTML = Object.entries(TYPES).map(([k, t]) => `<button type="button" class="kd-add" data-add="${k}"><i class="bi ${t.icon}"></i><span data-tn="${k}"></span></button>`).join('');
  const renderAddBar = () => $('addBar').querySelectorAll('[data-tn]').forEach((s) => { const t = TYPES[s.dataset.tn]; s.textContent = L(t.en, t.ar); });
  $('addBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    checkpoint(); design.layers.push(makeLayer(b.dataset.add)); sel = design.layers.length - 1; renderAll();
    track('svgkpi_add_layer', { layer_type: b.dataset.add });
  });

  // ---------- properties panel ----------
  const valOpts = (cur, onlyBefore) => design.values.filter((v, i) => onlyBefore == null || i < onlyBefore).map((v) => `<option value="${esc(v.id)}"${v.id === cur ? ' selected' : ''}>${esc(v.label || v.measure || v.id)}</option>`).join('');
  const num = (label, path, v, step) => `<label class="kd-f"><span>${label}</span><input type="number" step="${step || 'any'}" data-p="${path}" value="${esc(v == null ? '' : v)}"></label>`;
  const col = (label, path, v) => `<label class="kd-f"><span>${label}</span><input type="color" data-p="${path}" value="${esc(/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000')}"></label>`;
  const txt = (label, path, v, extra) => `<label class="kd-f kd-wide"><span>${label}</span><input type="text" data-p="${path}" value="${esc(v == null ? '' : v)}" ${extra || ''}></label>`;
  const sel_ = (label, path, v, opts) => `<label class="kd-f"><span>${label}</span><select data-p="${path}">${opts.map(([k, t]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const toggle = (label, bindKey, on, hint) => `<label class="kd-toggle"><input type="checkbox" data-bind-toggle="${bindKey}"${on ? ' checked' : ''}> <span>${label}</span>${hint ? `<small>${hint}</small>` : ''}</label>`;
  const OPS = K.OPS.map((o) => [o, o]);

  const scaleUI = (key, label, b, rangeLabel) => {
    const on = !!(b && b.v);
    let h = toggle(label, key, on);
    if (on) {
      const frac = isFraction(b.v);
      h += `<div class="kd-bind">${sel_(L('Value', 'القيمة'), `bind.${key}.v`, b.v, design.values.map((v) => [v.id, v.label || v.measure]))}
        <div class="kd-row2">${num(L('When value is', 'عندما تكون القيمة'), `bind.${key}.d0`, b.d0)}${num(L('up to', 'حتى'), `bind.${key}.d1`, b.d1)}</div>
        ${rangeLabel ? `<div class="kd-row2">${num(rangeLabel + ' ' + L('from', 'من'), `bind.${key}.r0`, b.r0)}${num(L('to', 'إلى'), `bind.${key}.r1`, b.r1)}</div>` : ''}
        ${frac ? `<p class="kd-hint">${L('This value is a fraction: 1 means 100%.', 'هذه القيمة نسبة: 1 تعني 100%.')}</p>` : ''}</div>`;
    }
    return h;
  };
  const rulesUI = (key, label, b, base) => {
    const on = !!(b && b.rules);
    let h = toggle(label, key, on);
    if (on) {
      h += '<div class="kd-bind">' + b.rules.map((r, i) => `<div class="kd-rule"><span>${L('If', 'إذا')}</span><select data-p="bind.${key}.rules.${i}.v">${valOpts(r.v)}</select><select data-p="bind.${key}.rules.${i}.op">${OPS.map(([o]) => `<option${o === r.op ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select><input type="number" step="any" data-p="bind.${key}.rules.${i}.t" value="${esc(r.t)}" aria-label="${L('Threshold', 'الحد')}"><input type="color" data-p="bind.${key}.rules.${i}.c" value="${esc(r.c)}" aria-label="${L('Color', 'اللون')}"><button type="button" class="kd-x" data-rule-del="${key}" data-i="${i}" aria-label="${L('Remove rule', 'حذف القاعدة')}"><i class="bi bi-x"></i></button></div>`).join('') +
        `<div class="kd-rule"><span>${L('Otherwise', 'وإلا')}</span><input type="color" data-p="bind.${key}.other" value="${esc(b.other || base)}"><button type="button" class="kd-link" data-rule-add="${key}"><i class="bi bi-plus"></i> ${L('Add rule', 'إضافة قاعدة')}</button></div>
        <p class="kd-hint">${L('Rules are checked from the top; the first match wins.', 'تُفحص القواعد من الأعلى، وأول قاعدة مطابقة تُطبّق.')}</p></div>`;
    }
    return h;
  };
  const showUI = (b) => {
    const on = !!(b && b.v);
    let h = toggle(L('Only show if', 'أظهر فقط إذا'), 'show', on);
    if (on) h += `<div class="kd-bind"><div class="kd-rule"><select data-p="bind.show.v">${valOpts(b.v)}</select><select data-p="bind.show.op">${OPS.map(([o]) => `<option${o === b.op ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select><input type="number" step="any" data-p="bind.show.t" value="${esc(b.t)}" aria-label="${L('Threshold', 'الحد')}"></div></div>`;
    return h;
  };
  const textUI = (b) => {
    const on = !!(b && b.v);
    let h = toggle(L('Show a value', 'اعرض قيمة'), 'text', on);
    if (on) {
      h += `<div class="kd-bind">${sel_(L('Value', 'القيمة'), 'bind.text.v', b.v, design.values.map((v) => [v.id, v.label || v.measure]))}
        ${sel_(L('Format', 'التنسيق'), 'bind.text.fmt', b.fmt || 'auto', FMT.map(([k, en, ar]) => [k, L(en, ar)]))}
        <div class="kd-row2">${txt(L('Before', 'قبل'), 'bind.text.prefix', b.prefix, 'maxlength="20"')}${txt(L('After', 'بعد'), 'bind.text.suffix', b.suffix, 'maxlength="30"')}</div>
        <label class="kd-toggle"><input type="checkbox" data-p="bind.text.sign"${b.sign ? ' checked' : ''}> <span>${L('Plus sign for positive values', 'علامة + للقيم الموجبة')}</span></label></div>`;
    }
    return h;
  };

  function renderProps() {
    const P = $('props');
    if (sel < 0 || !design.layers[sel]) {
      $('propsTitle').textContent = L('Card', 'البطاقة');
      const hasBg = /^#[0-9a-f]{6}$/i.test(design.bg || '');
      P.innerHTML = `<div class="kd-grid">${txt(L('Measure name', 'اسم المقياس'), 'card.name', design.name, 'maxlength="80"')}
        ${num(L('Width', 'العرض'), 'card.w', design.w, 1)}${num(L('Height', 'الارتفاع'), 'card.h', design.h, 1)}
        <label class="kd-toggle kd-wide"><input type="checkbox" data-card-bg${hasBg ? ' checked' : ''}> <span>${L('Background color', 'لون الخلفية')}</span><small>${L('Off = transparent, takes the report background', 'بدونها تكون شفافة وتأخذ خلفية التقرير')}</small></label>
        ${hasBg ? col(L('Background', 'الخلفية'), 'card.bg', design.bg) + num(L('Corner radius', 'استدارة الزوايا'), 'card.radius', design.radius || 0, 1) : ''}
        ${sel_(L('Show nothing when this is blank', 'لا تعرض شيئًا عندما تكون هذه فارغة'), 'card.hideIfBlank', design.hideIfBlank || '', [['', L('(always show)', '(اعرض دائمًا)')]].concat(design.values.filter((v) => v.kind === 'measure').map((v) => [v.id, v.label || v.measure])))}</div>
        <p class="kd-hint mt-2">${L('Click a layer on the canvas to edit it.', 'اضغط على أي طبقة في اللوحة لتعديلها.')}</p>`;
      return;
    }
    const l = design.layers[sel], b = l.bind || {}, t = TYPES[l.type];
    $('propsTitle').textContent = L(t.en, t.ar);
    let h = `<div class="kd-grid">${txt(L('Layer name', 'اسم الطبقة'), 'name', l.name, 'maxlength="40"')}`;
    const pos = (kx, ky) => num('X', kx, l[kx]) + num('Y', ky, l[ky]);
    switch (l.type) {
      case 'rect': h += pos('x', 'y') + num(L('Width', 'العرض'), 'w', l.w) + num(L('Height', 'الارتفاع'), 'h', l.h) + num(L('Corner radius', 'استدارة الزوايا'), 'rx', l.rx || 0) + col(L('Fill', 'التعبئة'), 'fill', l.fill); break;
      case 'circle': h += pos('cx', 'cy') + num(L('Radius', 'نصف القطر'), 'r', l.r) + col(L('Fill', 'التعبئة'), 'fill', l.fill); break;
      case 'line': h += num('X1', 'x1', l.x1) + num('Y1', 'y1', l.y1) + num('X2', 'x2', l.x2) + num('Y2', 'y2', l.y2) + col(L('Color', 'اللون'), 'stroke', l.stroke) + num(L('Thickness', 'السماكة'), 'sw', l.sw) + sel_(L('Ends', 'الأطراف'), 'cap', l.cap || 'butt', [['butt', L('Square', 'مربعة')], ['round', L('Round', 'دائرية')]]); break;
      case 'text':
        h += pos('x', 'y') + (b.text && b.text.v ? '' : txt(L('Text', 'النص'), 'text', l.text, 'maxlength="80"')) +
          num(L('Size', 'الحجم'), 'size', l.size) + sel_(L('Weight', 'السماكة'), 'weight', l.weight || 400, [[400, L('Regular', 'عادي')], [600, L('Semibold', 'شبه عريض')], [700, L('Bold', 'عريض')], [800, L('Extra bold', 'عريض جدًا')]]) +
          sel_(L('Align', 'المحاذاة'), 'anchor', l.anchor || 'start', [['start', L('From X to the right', 'من X إلى اليمين')], ['middle', L('Centred on X', 'في منتصف X')], ['end', L('Ending at X', 'ينتهي عند X')]]) + col(L('Color', 'اللون'), 'fill', l.fill);
        break;
      case 'ring': h += pos('cx', 'cy') + num(L('Radius', 'نصف القطر'), 'r', l.r) + num(L('Thickness', 'السماكة'), 'sw', l.sw) + col(L('Progress color', 'لون التقدم'), 'fill', l.fill) + col(L('Track color', 'لون المسار'), 'track', l.track) + sel_(L('Ends', 'الأطراف'), 'cap', l.cap || 'butt', [['butt', L('Square', 'مربعة')], ['round', L('Round', 'دائرية')]]) + (b.p && b.p.v ? '' : num(L('Progress (0 to 1)', 'التقدم (0 إلى 1)'), 'p', l.p, 0.05)); break;
      case 'arrow': h += pos('x', 'y') + num(L('Size', 'الحجم'), 'size', l.size) + sel_(L('Good when', 'جيد عندما'), 'goodWhen', l.goodWhen || 'up', [['up', L('Value goes up', 'القيمة ترتفع')], ['down', L('Value goes down', 'القيمة تنخفض')]]) + col(L('Good', 'جيد'), 'good', l.good) + col(L('Bad', 'سيئ'), 'bad', l.bad) + col(L('No change', 'بدون تغيير'), 'neutral', l.neutral); break;
    }
    if (['rect', 'circle', 'text'].includes(l.type)) h += num(L('Opacity (0 to 1)', 'الشفافية (0 إلى 1)'), 'opacity', l.opacity == null ? 1 : l.opacity, 0.05);
    h += '</div><div class="kd-data"><div class="kd-data-h"><i class="bi bi-link-45deg"></i> ' + L('Link to data', 'اربط بالبيانات') + '</div>';
    switch (l.type) {
      case 'rect': h += scaleUI('w', L('Width from a value', 'العرض من قيمة'), b.w, L('Width', 'العرض')) + scaleUI('h', L('Height from a value', 'الارتفاع من قيمة'), b.h, L('Height', 'الارتفاع')) + rulesUI('fill', L('Fill color by rules', 'لون التعبئة حسب قواعد'), b.fill, l.fill); break;
      case 'circle': h += scaleUI('r', L('Radius from a value', 'نصف القطر من قيمة'), b.r, L('Radius', 'نصف القطر')) + rulesUI('fill', L('Fill color by rules', 'لون التعبئة حسب قواعد'), b.fill, l.fill); break;
      case 'line': h += scaleUI('x2', L('End X from a value', 'نهاية X من قيمة'), b.x2, 'X2') + rulesUI('stroke', L('Color by rules', 'اللون حسب قواعد'), b.stroke, l.stroke); break;
      case 'text': h += textUI(b.text) + rulesUI('fill', L('Color by rules', 'اللون حسب قواعد'), b.fill, l.fill); break;
      case 'ring': h += scaleUI('p', L('Progress from a value', 'التقدم من قيمة'), b.p) + rulesUI('fill', L('Progress color by rules', 'لون التقدم حسب قواعد'), b.fill, l.fill); break;
      case 'arrow': h += `<div class="kd-bind kd-bind-flat">${sel_(L('Direction from', 'الاتجاه من'), 'bind.dir.v', (b.dir && b.dir.v) || '', [['', L('(fixed: up)', '(ثابت: للأعلى)')]].concat(design.values.map((v) => [v.id, v.label || v.measure])))}<p class="kd-hint">${L('Points up above 0, down below 0, flat at 0.', 'يتجه للأعلى فوق 0، وللأسفل تحت 0، وأفقي عند 0.')}</p></div>`; break;
    }
    h += showUI(b.show) + '</div>';
    P.innerHTML = h;
  }

  // set a value on an object by a dotted path like "bind.fill.rules.0.c"
  const setPath = (obj, path, v) => { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; }); o[ks[ks.length - 1]] = v; };
  const NUMERIC = /(^|\.)(x|y|w|h|rx|r|cx|cy|x1|y1|x2|y2|sw|size|opacity|p|d0|d1|r0|r1|t|radius|weight)$/;
  $('props').addEventListener('input', (e) => {
    const el = e.target, path = el.dataset.p; if (!path) return;
    beforeEdit();
    let v = el.type === 'checkbox' ? el.checked : el.value;
    const numeric = NUMERIC.test(path);
    if (numeric) { if (v === '' || !isFinite(+v)) return; v = +v; }
    if (path.startsWith('card.')) {
      const k = path.slice(5);
      if (k === 'w' || k === 'h') v = Math.max(8, Math.min(1200, v));
      if (k === 'hideIfBlank' && !v) delete design.hideIfBlank; else design[k] = v;
    } else {
      const l = design.layers[sel]; if (!l) return;
      if (path === 'bind.dir.v') { l.bind = l.bind || {}; if (v) l.bind.dir = { v: v }; else delete l.bind.dir; }
      else setPath(l, path, v);
    }
    renderCanvas(); renderDax(); renderLayers(); save();
    // a changed value can change which hints apply
    if (/\.v$/.test(path) || path === 'card.w' || path === 'card.h') { if (el.tagName === 'SELECT') renderProps(); }
  });
  $('props').addEventListener('change', (e) => { if (e.target.dataset.cardBg != null) { checkpoint(); if (e.target.checked) { design.bg = '#1a1f2e'; design.radius = design.radius || 12; } else delete design.bg; renderAll(); } });
  $('props').addEventListener('click', (e) => {
    const add = e.target.closest('[data-rule-add]'), del = e.target.closest('[data-rule-del]');
    const l = design.layers[sel]; if (!l || (!add && !del)) return;
    checkpoint();
    if (add) { const r = l.bind[add.dataset.ruleAdd]; const last = r.rules[r.rules.length - 1]; r.rules.push({ v: last ? last.v : firstValue(true), op: '<', t: last ? +last.t : 0, c: '#f59e0b' }); }
    if (del) { const r = l.bind[del.dataset.ruleDel]; r.rules.splice(+del.dataset.i, 1); if (!r.rules.length) delete l.bind[del.dataset.ruleDel]; }
    renderAll();
  });
  // turning a data link on fills in sensible defaults from the layer
  $('props').addEventListener('change', (e) => {
    const key = e.target.dataset.bindToggle; if (!key) return;
    const l = design.layers[sel]; if (!l) return;
    checkpoint();
    l.bind = l.bind || {};
    if (!e.target.checked) delete l.bind[key];
    else {
      const fv = firstValue(true), frac = isFraction(fv), vals = evalValues();
      const top = frac ? 1 : Math.max(1, Math.round(Math.abs(vals[fv] || 100) * 1.5));
      if (key === 'fill' || key === 'stroke') l.bind[key] = { rules: [{ v: fv, op: '<', t: frac ? 0.9 : 0, c: '#ef4444' }], other: l[key] || '#22c55e' };
      else if (key === 'text') l.bind.text = { v: firstValue(false), fmt: 'auto' };
      else if (key === 'show') l.bind.show = { v: fv, op: '>=', t: frac ? 1 : 0 };
      else if (key === 'p') l.bind.p = { v: fv, d0: 0, d1: top };
      else l.bind[key] = { v: fv, d0: 0, d1: top, r0: 0, r1: +l[key] || 100 };
    }
    if (!Object.keys(l.bind).length) delete l.bind;
    renderAll();
  });

  // ---------- data panel ----------
  const fmtVal = (x) => (x == null ? L('blank', 'فارغ') : Math.abs(x) < 10 && x % 1 ? x.toFixed(3) : K.formatNumber(x, '#,0.00').replace(/\.00$/, ''));
  function renderValues() {
    const vals = evalValues();
    $('values').innerHTML = design.values.map((v, i) => {
      const del = `<button type="button" class="kd-x" data-vdel="${i}" aria-label="${L('Remove', 'حذف')}"><i class="bi bi-trash"></i></button>`;
      if (v.kind === 'measure') {
        const s = +v.sample || 0, max = Math.max(10, Math.abs(s) * 2);
        return `<div class="kd-val"><div class="kd-val-h"><input class="kd-vlabel" data-v="${i}" data-vk="label" value="${esc(v.label)}" aria-label="${L('Label', 'التسمية')}" maxlength="30"><span class="kd-tag">${L('Measure', 'مقياس')}</span>${del}</div>
          <div class="kd-row2"><label class="kd-f"><span>${L('Name in your model', 'الاسم في نموذجك')}</span><input data-v="${i}" data-vk="measure" value="${esc(v.measure)}" spellcheck="false" maxlength="80"></label><label class="kd-f"><span>${L('Test value', 'قيمة للتجربة')}</span><input type="number" step="any" data-v="${i}" data-vk="sample" value="${esc(v.sample)}"></label></div>
          <input type="range" class="kd-slider" data-v="${i}" data-vk="sample" min="${Math.min(0, -max)}" max="${max}" step="${max / 200}" value="${s}" aria-label="${L('Test value slider', 'شريط قيمة التجربة')}"></div>`;
      }
      return `<div class="kd-val"><div class="kd-val-h"><input class="kd-vlabel" data-v="${i}" data-vk="label" value="${esc(v.label)}" aria-label="${L('Label', 'التسمية')}" maxlength="30"><span class="kd-tag kd-tag2">${L('Formula', 'معادلة')}</span>${del}</div>
        <div class="kd-rule"><select data-v="${i}" data-vk="a">${valOpts(v.a, i)}</select><select data-v="${i}" data-vk="kind">${Object.entries(KINDS).map(([k, t]) => `<option value="${k}"${k === v.kind ? ' selected' : ''}>${L(t[0], t[1])}</option>`).join('')}</select><select data-v="${i}" data-vk="b">${valOpts(v.b, i)}</select></div>
        <div class="kd-hint">= ${esc(fmtVal(vals[v.id]))}${isFraction(v.id) && vals[v.id] != null ? ' (' + r1(vals[v.id] * 100) + '%)' : ''}</div></div>`;
    }).join('');
  }
  $('values').addEventListener('input', (e) => {
    const el = e.target, i = el.dataset.v; if (i == null) return;
    beforeEdit();
    const v = design.values[+i], k = el.dataset.vk;
    if (k === 'sample') { v.sample = el.value === '' ? '' : +el.value; const twin = $('values').querySelectorAll(`[data-v="${i}"][data-vk="sample"]`); twin.forEach((t) => { if (t !== el) t.value = el.value; }); }
    else if (k === 'measure') v.measure = el.value.replace(/^\[|\]$/g, '');
    else v[k] = el.value;
    renderCanvas(); renderDax(); save();
    if (k === 'sample' || k === 'a' || k === 'b' || k === 'kind') $('values').querySelectorAll('.kd-val').forEach((row, j) => { const f = design.values[j]; if (f.kind !== 'measure') { const vals = evalValues(); row.querySelector('.kd-hint').textContent = '= ' + fmtVal(vals[f.id]) + (isFraction(f.id) && vals[f.id] != null ? ' (' + r1(vals[f.id] * 100) + '%)' : ''); } });
  });
  $('values').addEventListener('change', (e) => { if (e.target.dataset.vk === 'label') { renderProps(); renderLayers(); } });
  $('values').addEventListener('click', (e) => {
    const b = e.target.closest('[data-vdel]'); if (!b) return;
    const v = design.values[+b.dataset.vdel], refs = usedBy(v.id);
    if (refs.length) { toast(L('Still used by: ', 'ما زالت مستخدمة في: ') + refs.slice(0, 3).join(', ')); return; }
    checkpoint(); design.values.splice(+b.dataset.vdel, 1); renderAll();
  });
  $('addMeasure').addEventListener('click', () => {
    checkpoint(); const id = newId('m'), n = design.values.filter((v) => v.kind === 'measure').length + 1;
    design.values.push({ id, label: L('Measure ', 'مقياس ') + n, kind: 'measure', measure: 'Measure ' + n, sample: 100 });
    renderAll();
  });
  $('addFormula').addEventListener('click', () => {
    if (design.values.length < 2) { toast(L('Add two values first', 'أضف قيمتين أولًا')); return; }
    checkpoint(); const ms = design.values;
    design.values.push({ id: newId('f'), label: L('Formula ', 'معادلة ') + (ms.filter((v) => v.kind !== 'measure').length + 1), kind: 'ratio', a: ms[0].id, b: ms[1].id });
    renderAll();
  });

  // ---------- DAX ----------
  function renderDax() {
    const d = K.toDax(design);
    $('dax').textContent = d.dax;
    const errs = d.errors.filter((e, i, a) => a.indexOf(e) === i);
    $('errors').textContent = errs.join(' · ');
    $('errors').hidden = !errs.length;
  }

  // ---------- starters, share, import/export, library ----------
  const renderStarters = () => {
    $('starters').innerHTML = T.TEMPLATES.map((t) => `<button class="kd-starter${t.premium ? ' kd-pro' : ''}" type="button" data-t="${t.id}">${esc(isAr() && t.nameAr ? t.nameAr : t.name)}${t.premium ? ` <span class="kd-prem">${L('Premium preview', 'نسخة مميزة تجريبية')}</span>` : ''}</button>`).join('') +
      `<button class="kd-starter" type="button" data-t="__blank"><i class="bi bi-plus-lg"></i> ${L('Blank card', 'بطاقة فارغة')}</button>`;
  };
  $('starters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    checkpoint();
    const old = {}; design.values.forEach((v) => { if (v.kind === 'measure') old[v.id] = v; });
    const t = b.dataset.t === '__blank' ? blankDesign() : clone(T.TEMPLATES.find((x) => x.id === b.dataset.t));
    // keep the measure names and test values the visitor already typed
    t.values.forEach((v) => { if (old[v.id]) { v.measure = old[v.id].measure; v.sample = old[v.id].sample; } });
    design = t; sel = -1; renderAll();
    track('svgkpi_template_select', { template: b.dataset.t });
    if (t.premium) track('svgkpi_premium_click', { feature: 'template_' + t.id });
  });

  const b64u = { enc: (bytes) => btoa(String.fromCharCode.apply(null, bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''), dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)) };
  const pipe = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
  const encodeDesign = async () => {
    const raw = new TextEncoder().encode(JSON.stringify(design));
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
    track('svgkpi_share', { layers: design.layers.length });
  });
  $('exportBtn').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' }));
    a.download = (design.name || 'svg-kpi').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.svgkpi.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track('svgkpi_export');
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', () => {
    const f = $('importFile').files[0]; if (!f) return;
    f.text().then((t) => { const d = sanitize(JSON.parse(t)); if (!d) throw new Error('bad'); checkpoint(); design = d; sel = -1; renderAll(); toast(L('Design imported', 'تم استيراد التصميم')); })
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
    const lib = store.get(LIB, []).filter((d) => d.name !== design.name);
    lib.unshift(Object.assign(clone(design), { savedAt: Date.now() }));
    store.set(LIB, lib.slice(0, 50)); renderLibrary(); toast(L('Saved to your library', 'تم الحفظ في مكتبتك'));
    track('svgkpi_library_save', { layers: design.layers.length });
  });
  $('libList').addEventListener('click', (e) => {
    const o = e.target.closest('[data-lib-open]'), x = e.target.closest('[data-lib-del]');
    const lib = store.get(LIB, []);
    if (o) { const d = sanitize(clone(lib[+o.dataset.libOpen])); if (d) { checkpoint(); delete d.savedAt; design = d; sel = -1; renderAll(); } }
    if (x) { lib.splice(+x.dataset.libDel, 1); store.set(LIB, lib); renderLibrary(); }
  });

  // ---------- copy ----------
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 2200); };
  $('copyBtn').addEventListener('click', () => {
    const text = $('dax').textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('dax')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('DAX copied. Set Data category to Image URL.', 'تم نسخ DAX. اجعل Data category = Image URL.')), fallback); else fallback();
    track('svgkpi_copy', { template: design.id || 'custom', layers: design.layers.length });
  });
  $('undoBtn').addEventListener('click', doUndo);
  $('redoBtn').addEventListener('click', doRedo);

  // ---------- keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea, [contenteditable]')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? doRedo() : doUndo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); doRedo(); return; }
    if (sel < 0 || !design.layers[sel]) return;
    if (!$('kdApp').contains(document.activeElement) && document.activeElement !== document.body) return;
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); layerAction('dup', sel); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); layerAction('del', sel); return; }
    if (e.key === 'Escape') { sel = -1; renderAll(); return; }
    const step = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) {
      e.preventDefault(); checkpoint();
      const l = design.layers[sel], bd = l.bind || {};
      POS[l.type].forEach(([kx, ky]) => { if (!bd[kx]) l[kx] = r1(+l[kx] + mv[0]); if (!bd[ky]) l[ky] = r1(+l[ky] + mv[1]); });
      renderCanvas(); renderDax(); renderProps(); save();
    }
  });

  // ---------- render + boot ----------
  const save = () => store.set(STORE, design);
  function renderAll() { renderStarters(); renderAddBar(); renderLayers(); renderProps(); renderValues(); renderCanvas(); renderDax(); syncHistoryBtns(); save(); }
  window.addEventListener('resize', () => { clearTimeout(renderAll.t); renderAll.t = setTimeout(renderCanvas, 120); });
  new MutationObserver(() => renderAll()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  (async () => {
    const m = /#d=([zj][\w-]+)/.exec(location.hash);
    if (m) { try { design = await decodeDesign(m[1]); if (design) track('svgkpi_open_shared'); } catch (e) { design = null; } }
    if (!design) design = sanitize(store.get(STORE, null));
    if (!design) design = clone(T.TEMPLATES[0]);
    renderAll();
  })();
});
