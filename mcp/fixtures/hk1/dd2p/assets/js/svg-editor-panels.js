/*
 * DataArcus SVG KPI Designer: the panels, the layer list, the add bar, the properties panel and the data panel
 * (0.3.2 SP33, moved from svg-kpi-designer.js). They read the store's state and change the design only after a store
 * command (one undo step each); no storage, no timers, no canvas.
 *   const P = SVGEditorPanels.create({ $, store, K, types, pos, L, esc, clone, r1, samples, track, toast, tour, view });
 *   in:  $ (the page's getElementById: #layers, #addBar, #props, #propsTitle, #values, #addMeasure, #addFormula);
 *        store (SVGEditorStore: reads design and sel; commands select(i), apply(fn), checkpoint(), editOnce());
 *        K (SVGKPI: OPS, formatNumber); types (TYPES), pos (POS); L, esc, clone, r1 (the designer's language, escaping,
 *        copy and rounding); samples() (each measure's test value); track(name, params); toast(msg); tour() (the
 *        tutorial, or null: its place(layer) runs inside the add command)
 *   out: view.canvas(), view.dax(), view.save(), view.all() (render requests, called after an edit, in the order the
 *        editor always used); the returned P.renderLayers(), P.renderAddBar(), P.renderProps(), P.renderValues() (draw
 *        a panel from the store's state); P.layerAction(act, i) (sel, up, down, dup, del: the keyboard uses it too);
 *        P.valueName(id) (a value's shown name, for the DAX warnings)
 * Undo steps: a field visit is one step (store.editOnce, the page's focusin starts a visit); a button is one step
 * (checkpoint or apply before the change); selecting is no step.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
'use strict';
function create(opt) {
  const $ = opt.$, S = opt.store, K = opt.K, TYPES = opt.types, POS = opt.pos, L = opt.L, esc = opt.esc, clone = opt.clone, r1 = opt.r1;
  const samples = opt.samples, track = opt.track, toast = opt.toast, view = opt.view;
  const renderCanvas = view.canvas, renderDax = view.dax, save = view.save, renderAll = view.all;

  const FMT = [['auto', 'Auto (1.2K / 3.4M)', 'تلقائي (1.2K / 3.4M)'], ['n0', '1,235', '1,235'], ['n1', '1,234.6', '1,234.6'], ['n2', '1,234.57', '1,234.57'], ['k1', '1.2K', '1.2K'], ['m1', '1.2M', '1.2M'], ['p0', '83%', '83%'], ['p1', '82.7%', '82.7%']];
  const KINDS = { ratio: ['A ÷ B', 'أ ÷ ب'], diff: ['A − B', 'أ − ب'], pct: ['% change of A vs B', 'نسبة تغير أ عن ب'] };

  // ---------- values (what the panels show of them) ----------
  const byId = (id) => S.design.values.find((v) => v.id === id);
  const valueName = (id) => { const v = byId(id); return v ? v.label || v.measure || v.id : '?'; };
  // Same BLANK rules as the compiler, for showing formula results next to the inputs
  const evalValues = () => {
    const out = {}, m = samples();
    S.design.values.forEach((v) => {
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
    S.design.values.forEach((v) => { if (v.a === id || v.b === id) refs.push(v.label); });
    const walk = (o) => { if (!o || typeof o !== 'object') return false; if (o.v === id) return true; return Object.values(o).some(walk); };
    S.design.layers.forEach((l) => { if (walk(l.bind)) refs.push(l.name || l.type); });
    if (S.design.hideIfBlank === id) refs.push(L('Hide when blank', 'الإخفاء عند الفراغ'));
    return refs;
  };
  const newId = (base) => { let i = 1; while (S.design.values.some((v) => v.id === base + i)) i++; return base + i; };
  const firstValue = (preferFraction) => { const f = S.design.values.find((v) => (preferFraction ? v.kind !== 'measure' : true)); return (f || S.design.values[0] || {}).id; };

  // ---------- layers panel ----------
  function renderLayers() {
    const list = S.design.layers.map((l, i) => ({ l, i })).reverse(); // top layer first, like design tools
    $('layers').innerHTML = list.length ? list.map(({ l, i }) => {
      const t = TYPES[l.type], linked = l.bind && Object.keys(l.bind).length;
      return `<li class="kd-layer${i === S.sel ? ' active' : ''}" data-i="${i}"><button type="button" class="kd-lname" data-act="sel" data-i="${i}" aria-pressed="${i === S.sel}"><i class="bi ${t.icon}"></i><span>${esc(l.name || L(t.en, t.ar))}</span>${linked ? `<i class="bi bi-link-45deg kd-linked" title="${L('Linked to data', 'مرتبط بالبيانات')}"></i>` : ''}</button>
        <span class="kd-lbtns"><button type="button" data-act="up" data-i="${i}" aria-label="${L('Bring forward', 'تقديم للأمام')}" ${i === S.design.layers.length - 1 ? 'disabled' : ''}><i class="bi bi-arrow-up"></i></button><button type="button" data-act="down" data-i="${i}" aria-label="${L('Send backward', 'إرجاع للخلف')}" ${i === 0 ? 'disabled' : ''}><i class="bi bi-arrow-down"></i></button><button type="button" data-act="dup" data-i="${i}" aria-label="${L('Duplicate', 'تكرار')}"><i class="bi bi-copy"></i></button><button type="button" data-act="del" data-i="${i}" aria-label="${L('Delete', 'حذف')}"><i class="bi bi-trash"></i></button></span></li>`;
    }).join('') : `<li class="kd-empty">${L('No layers yet. Add one above.', 'لا توجد طبقات بعد. أضف واحدة من الأعلى.')}</li>`;
  }
  const layerAction = (act, i) => {
    if (act === 'sel') { S.select(i); renderAll(); return; }
    S.checkpoint();
    const ls = S.design.layers;
    if (act === 'up' && i < ls.length - 1) { [ls[i], ls[i + 1]] = [ls[i + 1], ls[i]]; S.select(i + 1); }
    if (act === 'down' && i > 0) { [ls[i], ls[i - 1]] = [ls[i - 1], ls[i]]; S.select(i - 1); }
    if (act === 'dup') { const c = clone(ls[i]); c.name = (c.name || L(TYPES[c.type].en, TYPES[c.type].ar)) + ' 2'; POS[c.type].forEach(([kx, ky]) => { c[kx] = +c[kx] + 6; c[ky] = +c[ky] + 6; }); ls.splice(i + 1, 0, c); S.select(i + 1); }
    if (act === 'del') { ls.splice(i, 1); S.select(Math.min(i, ls.length - 1)); }
    renderAll();
  };
  $('layers').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) layerAction(b.dataset.act, +b.dataset.i); });

  // ---------- add layers ----------
  const makeLayer = (type) => {
    const W = S.design.w, H = S.design.h, m = Math.min(W, H), n = S.design.layers.filter((l) => l.type === type).length + 1;
    const name = L(TYPES[type].en, TYPES[type].ar) + ' ' + n;
    const R = (v) => Math.round(v);
    switch (type) {
      case 'rect': return { type, name, x: R(W / 2 - Math.min(40, W / 3)), y: R(H / 2 - Math.min(10, H / 4)), w: R(Math.min(80, W / 1.5)), h: R(Math.min(20, H / 2)), rx: 4, fill: '#00d4ff' };
      case 'circle': return { type, name, cx: R(W / 2), cy: R(H / 2), r: Math.max(4, R(m / 4)), fill: '#6c5ce7' };
      case 'line': return { type, name, x1: R(W * 0.25), y1: R(H / 2), x2: R(W * 0.75), y2: R(H / 2), stroke: '#94a3b8', sw: 2, cap: 'round' };
      case 'text': return { type, name, x: R(W / 2), y: R(H / 2 + 5), size: 14, weight: 600, anchor: 'middle', fill: '#f8fafc', text: L('Text', 'نص') };
      case 'ring': return { type, name, cx: R(W / 2), cy: R(H / 2), r: Math.max(8, R(m / 2 - 10)), sw: 8, track: '#1e293b', fill: '#00d4ff', cap: 'round', p: 0.75 };
      case 'arrow': return { type, name, x: R(W / 2 - 8), y: R(H / 2 - 8), size: 16, goodWhen: 'up', good: '#22c55e', bad: '#ef4444', neutral: '#94a3b8' };
      case 'spark': {
        const mv = S.design.values.find((v) => v.kind === 'measure') || S.design.values[0];
        return { type, name, x: 8, y: 8, w: Math.max(20, W - 16), h: Math.max(10, H - 16), n: 12, grain: 'month', end: 'data', stroke: '#00d4ff', sw: 2, area: true, areaColor: '#00d4ff', areaOpacity: 0.2, dot: true, dotR: 3, dotColor: '#ffffff', bind: mv ? { series: { v: mv.id } } : undefined };
      }
    }
  };
  $('addBar').innerHTML = Object.entries(TYPES).map(([k, t]) => `<button type="button" class="kd-add" data-add="${k}"><i class="bi ${t.icon}"></i><span data-tn="${k}"></span></button>`).join('');
  const renderAddBar = () => $('addBar').querySelectorAll('[data-tn]').forEach((s) => { const t = TYPES[s.dataset.tn]; s.textContent = L(t.en, t.ar); });
  $('addBar').addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]'); if (!b) return;
    S.apply((d) => { d.layers.push(makeLayer(b.dataset.add)); S.select(d.layers.length - 1); });
    { const tour = opt.tour(); if (tour) tour.place(S.design.layers[S.sel]); }
    renderAll();
    track('svgkpi_add_layer', { layer_type: b.dataset.add });
  });

  // ---------- properties panel ----------
  const valOpts = (cur, onlyBefore) => S.design.values.filter((v, i) => onlyBefore == null || i < onlyBefore).map((v) => `<option value="${esc(v.id)}"${v.id === cur ? ' selected' : ''}>${esc(v.label || v.measure || v.id)}</option>`).join('');
  const num = (label, path, v, step) => `<label class="kd-f"><span>${label}</span><input type="number" step="${step || 'any'}" data-p="${path}" value="${esc(v == null ? '' : v)}"></label>`;
  const col = (label, path, v) => `<label class="kd-f"><span>${label}</span><input type="color" data-p="${path}" value="${esc(/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000')}"></label>`;
  const txt = (label, path, v, extra) => `<label class="kd-f kd-wide"><span>${label}</span><input type="text" data-p="${path}" value="${esc(v == null ? '' : v)}" ${extra || ''}></label>`;
  const sel_ = (label, path, v, opts, wide) => `<label class="kd-f${wide ? ' kd-wide' : ''}"><span>${label}</span><select data-p="${path}">${opts.map(([k, t]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const toggle = (label, bindKey, on, hint) => `<label class="kd-toggle"><input type="checkbox" data-bind-toggle="${bindKey}"${on ? ' checked' : ''}> <span>${label}</span>${hint ? `<small>${hint}</small>` : ''}</label>`;
  const OPS = K.OPS.map((o) => [o, o]);

  const scaleUI = (key, label, b, rangeLabel) => {
    const on = !!(b && b.v);
    let h = toggle(label, key, on);
    if (on) {
      const frac = isFraction(b.v);
      h += `<div class="kd-bind">${sel_(L('Value', 'القيمة'), `bind.${key}.v`, b.v, S.design.values.map((v) => [v.id, v.label || v.measure]))}
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
      h += `<div class="kd-bind">${sel_(L('Value', 'القيمة'), 'bind.text.v', b.v, S.design.values.map((v) => [v.id, v.label || v.measure]))}
        ${sel_(L('Format', 'التنسيق'), 'bind.text.fmt', b.fmt || 'auto', FMT.map(([k, en, ar]) => [k, L(en, ar)]))}
        <div class="kd-row2">${txt(L('Before', 'قبل'), 'bind.text.prefix', b.prefix, 'maxlength="20"')}${txt(L('After', 'بعد'), 'bind.text.suffix', b.suffix, 'maxlength="30"')}</div>
        <label class="kd-toggle"><input type="checkbox" data-p="bind.text.sign"${b.sign ? ' checked' : ''}> <span>${L('Plus sign for positive values', 'علامة + للقيم الموجبة')}</span></label></div>`;
    }
    return h;
  };

  function renderProps() {
    const P = $('props');
    if (S.sel < 0 || !S.design.layers[S.sel]) {
      $('propsTitle').textContent = L('Card', 'البطاقة');
      const hasBg = /^#[0-9a-f]{6}$/i.test(S.design.bg || '');
      P.innerHTML = `<div class="kd-grid">${txt(L('Measure name', 'اسم المقياس'), 'card.name', S.design.name, 'maxlength="80"')}
        ${num(L('Width', 'العرض'), 'card.w', S.design.w, 1)}${num(L('Height', 'الارتفاع'), 'card.h', S.design.h, 1)}
        <label class="kd-toggle kd-wide"><input type="checkbox" data-card-bg${hasBg ? ' checked' : ''}> <span>${L('Background color', 'لون الخلفية')}</span><small>${L('Off = transparent, takes the report background', 'بدونها تكون شفافة وتأخذ خلفية التقرير')}</small></label>
        ${hasBg ? col(L('Background', 'الخلفية'), 'card.bg', S.design.bg) + num(L('Corner radius', 'استدارة الزوايا'), 'card.radius', S.design.radius || 0, 1) : ''}
        ${S.design.layers.some((l) => l.type === 'spark') ? `${txt(L('Date column for sparklines', 'عمود التاريخ لخطوط الاتجاه'), 'card.dateCol', S.design.dateCol || "'Date'[Date]", 'maxlength="100" spellcheck="false"')}
        <label class="kd-toggle kd-wide"><input type="checkbox" data-p="card.clearDateFilters"${S.design.clearDateFilters !== false ? ' checked' : ''}> <span>${L('Ignore date slicers inside the sparkline', 'تجاهل فلاتر التاريخ داخل خط الاتجاه')}</span><small>${L('Keeps the full trend when a Year or Month slicer is set. Turn off if your dates are not in a separate date table.', 'يحافظ على الاتجاه كاملًا عند اختيار سنة أو شهر. أوقفه إذا لم تكن التواريخ في جدول تاريخ منفصل.')}</small></label>` : ''}
        <label class="kd-toggle kd-wide"><input type="checkbox" data-p="card.mirror"${S.design.mirror ? ' checked' : ''}> <span>${L('Right to left', 'من اليمين إلى اليسار')}</span><small>${L('For Arabic reports: shapes are mirrored (a ring fills counter-clockwise, a bar from the right); text is never flipped.', 'للتقارير العربية: تنعكس الأشكال (تمتلئ الحلقة عكس عقارب الساعة والشريط من اليمين)، ولا ينعكس النص أبدًا.')}</small></label>
        ${sel_(L('Show nothing when this is blank', 'لا تعرض شيئًا عندما تكون هذه فارغة'), 'card.hideIfBlank', S.design.hideIfBlank || '', [['', L('(always show)', '(اعرض دائمًا)')]].concat(S.design.values.filter((v) => v.kind === 'measure').map((v) => [v.id, v.label || v.measure])), true)}</div>
        <p class="kd-hint mt-2">${L('Click a layer on the canvas to edit it.', 'اضغط على أي طبقة في اللوحة لتعديلها.')}</p>`;
      return;
    }
    const l = S.design.layers[S.sel], b = l.bind || {}, t = TYPES[l.type];
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
      case 'spark':
        h += pos('x', 'y') + num(L('Width', 'العرض'), 'w', l.w) + num(L('Height', 'الارتفاع'), 'h', l.h) +
          sel_(L('Each point is a', 'كل نقطة تمثل'), 'grain', l.grain || 'month', [['month', L('Month', 'شهر')], ['week', L('Week', 'أسبوع')], ['day', L('Day', 'يوم')]]) + num(L('Number of points', 'عدد النقاط'), 'n', l.n || 12, 1) +
          `<div class="kd-wide">${sel_(L('Ends at', 'ينتهي عند'), 'end', l.end || 'data', [['data', L('The last date with data', 'آخر تاريخ فيه بيانات')], ['filter', L('The last date in the current filters', 'آخر تاريخ في الفلاتر الحالية')]])}</div>` +
          ((l.grain || 'month') === 'month' ? `<label class="kd-toggle kd-wide"><input type="checkbox" data-p="complete"${l.complete ? ' checked' : ''}> <span>${L('Complete months only', 'الأشهر المكتملة فقط')}</span><small>${L('A month that is still running is left out, so a half month does not look like a drop.', 'يُستبعد الشهر الذي لم ينتهِ بعد، حتى لا يبدو نصف الشهر كأنه انخفاض.')}</small></label>` : '') +
          col(L('Line color', 'لون الخط'), 'stroke', l.stroke) + num(L('Thickness', 'السماكة'), 'sw', l.sw) +
          `<label class="kd-toggle kd-wide"><input type="checkbox" data-p="area"${l.area ? ' checked' : ''}> <span>${L('Fill the area under the line', 'تعبئة المساحة تحت الخط')}</span></label>` +
          (l.area ? col(L('Area color', 'لون المساحة'), 'areaColor', l.areaColor || l.stroke) + num(L('Area opacity', 'شفافية المساحة'), 'areaOpacity', l.areaOpacity == null ? 0.2 : l.areaOpacity, 0.05) : '') +
          `<label class="kd-toggle kd-wide"><input type="checkbox" data-p="dot"${l.dot ? ' checked' : ''}> <span>${L('Dot on the latest point', 'نقطة على آخر قيمة')}</span></label>` +
          (l.dot ? col(L('Dot color', 'لون النقطة'), 'dotColor', l.dotColor || l.stroke) + num(L('Dot size', 'حجم النقطة'), 'dotR', l.dotR || 3, 0.5) : '');
        break;
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
      case 'spark': h += `<div class="kd-bind kd-bind-flat">${sel_(L('Trend of', 'اتجاه'), 'bind.series.v', (b.series && b.series.v) || '', S.design.values.map((v) => [v.id, v.label || v.measure]))}<p class="kd-hint">${L('Recalculated for each period using the date column in Card settings.', 'تُحسب لكل فترة باستخدام عمود التاريخ في إعدادات البطاقة.')}</p></div>` + rulesUI('stroke', L('Line color by rules', 'لون الخط حسب قواعد'), b.stroke, l.stroke); break;
      case 'arrow': h += `<div class="kd-bind kd-bind-flat">${sel_(L('Direction from', 'الاتجاه من'), 'bind.dir.v', (b.dir && b.dir.v) || '', [['', L('(fixed: up)', '(ثابت: للأعلى)')]].concat(S.design.values.map((v) => [v.id, v.label || v.measure])))}<p class="kd-hint">${L('Points up above 0, down below 0, flat at 0.', 'يتجه للأعلى فوق 0، وللأسفل تحت 0، وأفقي عند 0.')}</p></div>`; break;
    }
    h += showUI(b.show) + '</div>';
    P.innerHTML = h;
  }

  // set a value on an object by a dotted path like "bind.fill.rules.0.c"
  const setPath = (obj, path, v) => { const ks = path.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; }); o[ks[ks.length - 1]] = v; };
  const NUMERIC = /(^|\.)(x|y|w|h|rx|r|cx|cy|x1|y1|x2|y2|sw|size|opacity|p|d0|d1|r0|r1|t|radius|weight|n|dotR|areaOpacity)$/;
  $('props').addEventListener('input', (e) => {
    const el = e.target, path = el.dataset.p; if (!path) return;
    S.editOnce();
    let v = el.type === 'checkbox' ? el.checked : el.value;
    const numeric = NUMERIC.test(path);
    if (numeric) { if (v === '' || !isFinite(+v)) return; v = +v; }
    if (path.startsWith('card.')) {
      const k = path.slice(5);
      if (k === 'w' || k === 'h') v = Math.max(8, Math.min(1200, v));
      // (round 15: the "Right to left" switch sets the compiler's mirror; off removes it, so a saved design stays as before)
      if ((k === 'hideIfBlank' || k === 'mirror') && !v) delete S.design[k]; else S.design[k] = v;
    } else {
      const l = S.design.layers[S.sel]; if (!l) return;
      if (path === 'bind.dir.v') { l.bind = l.bind || {}; if (v) l.bind.dir = { v: v }; else delete l.bind.dir; }
      else if (path === 'n') l.n = Math.max(2, Math.min(60, Math.round(v)));
      else setPath(l, path, v);
    }
    renderCanvas(); renderDax(); renderLayers(); save();
    if (el.type === 'checkbox' && (path === 'area' || path === 'dot')) { renderProps(); return; }
    // a changed value can change which hints apply
    if (/\.v$/.test(path) || path === 'card.w' || path === 'card.h' || path === 'grain') { if (el.tagName === 'SELECT') renderProps(); }
  });
  $('props').addEventListener('change', (e) => { if (e.target.dataset.cardBg != null) { S.apply((d) => { if (e.target.checked) { d.bg = '#1a1f2e'; d.radius = d.radius || 12; } else delete d.bg; }); renderAll(); } });
  $('props').addEventListener('click', (e) => {
    const add = e.target.closest('[data-rule-add]'), del = e.target.closest('[data-rule-del]');
    const l = S.design.layers[S.sel]; if (!l || (!add && !del)) return;
    S.checkpoint();
    if (add) { const r = l.bind[add.dataset.ruleAdd]; const last = r.rules[r.rules.length - 1]; r.rules.push({ v: last ? last.v : firstValue(true), op: '<', t: last ? +last.t : 0, c: '#f59e0b' }); }
    if (del) { const r = l.bind[del.dataset.ruleDel]; r.rules.splice(+del.dataset.i, 1); if (!r.rules.length) delete l.bind[del.dataset.ruleDel]; }
    renderAll();
  });
  // turning a data link on fills in sensible defaults from the layer
  $('props').addEventListener('change', (e) => {
    const key = e.target.dataset.bindToggle; if (!key) return;
    const l = S.design.layers[S.sel]; if (!l) return;
    S.checkpoint();
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
    const shape = S.design.layers.some((l) => l.type === 'spark') ? `<label class="kd-f"><span>${L('Test trend shape (preview only)', 'شكل الاتجاه للتجربة (للمعاينة فقط)')}</span><select id="testShape">${[['wave', L('Up and down', 'صعود وهبوط')], ['up', L('Growing', 'نمو')], ['down', L('Falling', 'انخفاض')]].map(([k, t]) => `<option value="${k}"${(S.design.testShape || 'up') === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>` : '';
    $('values').innerHTML = shape + S.design.values.map((v, i) => {
      const del = `<button type="button" class="kd-x" data-vdel="${i}" aria-label="${L('Remove', 'حذف')}"><i class="bi bi-trash"></i></button>`;
      if (v.kind === 'measure') {
        const s = +v.sample || 0, max = Math.max(10, Math.abs(s) * 2);
        return `<div class="kd-val"><div class="kd-val-h"><input class="kd-vlabel" data-v="${i}" data-vk="label" value="${esc(v.label)}" aria-label="${L('Label', 'التسمية')}" maxlength="30"><span class="kd-tag cap-pill">${L('Measure', 'مقياس')}</span>${del}</div>
          <div class="kd-row2"><label class="kd-f"><span>${L('Name in your model', 'الاسم في نموذجك')}</span><input data-v="${i}" data-vk="measure" value="${esc(v.measure)}" spellcheck="false" maxlength="80"></label><label class="kd-f"><span>${L('Test value', 'قيمة للتجربة')}</span><input type="number" step="any" data-v="${i}" data-vk="sample" value="${esc(v.sample)}"></label></div>
          <input type="range" class="kd-slider" data-v="${i}" data-vk="sample" min="${Math.min(0, -max)}" max="${max}" step="${max / 200}" value="${s}" aria-label="${L('Test value slider', 'شريط قيمة التجربة')}"></div>`;
      }
      return `<div class="kd-val"><div class="kd-val-h"><input class="kd-vlabel" data-v="${i}" data-vk="label" value="${esc(v.label)}" aria-label="${L('Label', 'التسمية')}" maxlength="30"><span class="kd-tag kd-tag2 cap-pill">${L('Formula', 'معادلة')}</span>${del}</div>
        <div class="kd-rule"><select data-v="${i}" data-vk="a" aria-label="${L('First value', 'القيمة الأولى')}">${valOpts(v.a, i)}</select><select data-v="${i}" data-vk="kind" aria-label="${L('Formula', 'المعادلة')}">${Object.entries(KINDS).map(([k, t]) => `<option value="${k}"${k === v.kind ? ' selected' : ''}>${L(t[0], t[1])}</option>`).join('')}</select><select data-v="${i}" data-vk="b" aria-label="${L('Second value', 'القيمة الثانية')}">${valOpts(v.b, i)}</select></div>
        <div class="kd-hint">= ${esc(fmtVal(vals[v.id]))}${isFraction(v.id) && vals[v.id] != null ? ' (' + r1(vals[v.id] * 100) + '%)' : ''}</div></div>`;
    }).join('');
  }
  $('values').addEventListener('input', (e) => {
    const el = e.target, i = el.dataset.v; if (i == null) return;
    S.editOnce();
    const v = S.design.values[+i], k = el.dataset.vk;
    if (k === 'sample') { v.sample = el.value === '' ? '' : +el.value; const twin = $('values').querySelectorAll(`[data-v="${i}"][data-vk="sample"]`); twin.forEach((t) => { if (t !== el) t.value = el.value; }); }
    else if (k === 'measure') v.measure = el.value.replace(/^\[|\]$/g, '');
    else v[k] = el.value;
    renderCanvas(); renderDax(); save();
    if (k === 'sample' || k === 'measure' || k === 'a' || k === 'b' || k === 'kind') $('values').querySelectorAll('.kd-val').forEach((row, j) => { const f = S.design.values[j]; if (f.kind !== 'measure') { const vals = evalValues(); row.querySelector('.kd-hint').textContent = '= ' + fmtVal(vals[f.id]) + (isFraction(f.id) && vals[f.id] != null ? ' (' + r1(vals[f.id] * 100) + '%)' : ''); } });
  });
  $('values').addEventListener('change', (e) => {
    if (e.target.id === 'testShape') { S.design.testShape = e.target.value; renderCanvas(); save(); return; }
    if (e.target.dataset.vk === 'label') { renderProps(); renderLayers(); }
  });
  $('values').addEventListener('click', (e) => {
    const b = e.target.closest('[data-vdel]'); if (!b) return;
    const v = S.design.values[+b.dataset.vdel], refs = usedBy(v.id);
    if (refs.length) { toast(L('Still used by: ', 'ما زالت مستخدمة في: ') + refs.slice(0, 3).join(', ')); return; }
    S.apply((d) => d.values.splice(+b.dataset.vdel, 1)); renderAll();
  });
  $('addMeasure').addEventListener('click', () => {
    S.checkpoint(); const id = newId('m'), n = S.design.values.filter((v) => v.kind === 'measure').length + 1;
    S.design.values.push({ id, label: L('Measure ', 'مقياس ') + n, kind: 'measure', measure: 'Measure ' + n, sample: 100 });
    renderAll();
  });
  $('addFormula').addEventListener('click', () => {
    if (S.design.values.length < 2) { toast(L('Add two values first', 'أضف قيمتين أولًا')); return; }
    S.checkpoint(); const ms = S.design.values;
    S.design.values.push({ id: newId('f'), label: L('Formula ', 'معادلة ') + (ms.filter((v) => v.kind !== 'measure').length + 1), kind: 'ratio', a: ms[0].id, b: ms[1].id });
    renderAll();
  });
  return Object.freeze({ renderLayers, renderAddBar, renderProps, renderValues, layerAction, valueName });
}
root.SVGEditorPanels = Object.freeze({ create: create });
})(typeof window !== 'undefined' ? window : globalThis);
