/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The Theme Generator's controls and its layout step (0.3.2 SP31, the split of theme-generator.js: the Codex split map,
// B-280): the colour inputs, the presets, Generate, the theme's name, the font and its Arabic note, the chart styles;
// the page size, the layout buttons and their thumbnails, the KPI cards, direction, corners, accent bars and lines, the
// checkboxes, the sizes' sliders, Advanced options, the layout canvas and the slot table. The numbers are the design
// engine's (DAEngine); this file draws them and takes the visitor's choices into the design.
//
// Interface (one input, one output; its own state is only what the controls show: the page's width on the 720 grid,
// the page-size message, whether Advanced options is open):
//   In:  mount({ store, engine, $, L, isAr, track, toast, hooks })
//        store   the design's store (theme-state-ui.js): get() is read on every call, never kept; save() after a change
//        engine  the design engine (DAEngine)
//        $, L, isAr, track, toast  the page's element lookup, its language function L(en, ar), whether it is Arabic,
//                its analytics call and its toast
//        hooks   what the page and the downloads draw, called when the design changes:
//                renderAll(), renderJson(), clearLook() (the glass refusal's message is said again on the next draw),
//                glassUrl() (the glass picture as a data URL), bgSvg(slots, opt) (the background with the sample
//                visuals over it), canvasFit() (page 1 as the project download writes it, or null),
//                renderVis(), updateStatus(), layoutChanged() (the download coordinator's)
//   Out: { PH, PRESET_AR, lay, page, applyPage, computeSlots, boxOf, rtl, nm, pngSize, seg, renderInputs, renderPresets,
//          renderLayout, renderLayoutPreview, fontNote, clearPageMsg }
//        It draws the presets when mounted and listens to its own controls; the page calls renderInputs and renderAll.
(function (root) {
  'use strict';

  function mount({ store, engine, $, L, isAr, track, toast, hooks }) {
    const E = engine, PRESETS = E.PRESETS, design = () => store.get();
    const { clampHex, generate, PAGES, LIM, within, fitCustom, KINDS, LAYOUTS, hasMain, hasSplit } = E;
    const chart = () => E.chart(design());
    // the presets' names in Arabic (the fold's one-line summary uses them too)
    const PRESET_AR = { 'DataArcus': 'DataArcus', 'Corporate': 'رسمي', 'Colorblind safe': 'آمن لعمى الألوان', 'Desert Gulf': 'صحراء الخليج', 'Midnight': 'منتصف الليل', 'Earthy': 'ترابي' };
    const UI_LABELS_EN = { background: 'Page', card: 'Visual', text: 'Text', accent: 'Table accent', good: 'Good', neutral: 'Neutral', bad: 'Bad' };
    const UI_LABELS_AR = { background: 'الصفحة', card: 'المرئي', text: 'النص', accent: 'لون الجدول', good: 'جيد', neutral: 'محايد', bad: 'سيئ' };
    const uiLabel = (k) => (isAr() ? UI_LABELS_AR : UI_LABELS_EN)[k];
    const UI_LABELS = UI_LABELS_EN;
    // ---------- the controls: colours, presets, Generate, name, font, chart styles ----------
    const colorInput = (key, value, label) => `<div class="tg-color"><input type="color" value="${value}" data-key="${key}" aria-label="${label} color"><input type="text" value="${value}" data-key="${key}" maxlength="9" aria-label="${label} hex code" spellcheck="false"><span>${label}</span></div>`;
    const CHART_INPUTS = { csLabels: 'labels', csGrid: 'grid', csLegend: 'legend', csAxis: 'axis', csTable: 'table', csLook: 'look' };
    const renderInputs = () => {
      $('dataColors').innerHTML = design().data.map((c, i) => colorInput('d' + i, c, L('Color ', 'اللون ') + (i + 1))).join('');
      $('uiColors').innerHTML = Object.keys(UI_LABELS).map((k) => colorInput('u_' + k, design().ui[k], uiLabel(k))).join('');
      $('themeName').value = design().name; $('font').value = design().font;
      Object.entries(CHART_INPUTS).forEach(([id, k]) => { $(id).value = chart()[k]; });
      document.querySelectorAll('.tg-preset').forEach((b) => b.classList.toggle('active', b.dataset.p === design().preset));
    };
    const setColor = (key, val) => { if (key[0] === 'd') design().data[+key.slice(1)] = val; else design().ui[key.slice(2)] = val; design().preset = null; };
    // Every font in the list is built into Power BI, but only some have Arabic letters: in an Arabic or
    // right-to-left report the others fall back to another font, so say so under the font picker.
    const AR_FONTS = E.AR_FONTS;
    function fontNote() {
      const sel = $('font'); if (!sel) return;
      let n = $('fontNote');
      if (!n) { n = document.createElement('small'); n.id = 'fontNote'; n.className = 'd-block mt-1 tg-warn'; n.setAttribute('role', 'status'); sel.insertAdjacentElement('afterend', n); }
      const arabic = isAr() || (design().layout && design().layout.dir === 'rtl');
      n.textContent = arabic && !AR_FONTS.includes(design().font)
        ? L(`${design().font} has no Arabic letters, so Arabic text will show in another font. For Arabic reports use Segoe UI, Tahoma or Arial.`, `خط ${design().font} لا يحتوي حروفًا عربية، فسيظهر النص العربي بخط آخر. للتقارير العربية استخدم Segoe UI أو Tahoma أو Arial.`)
        : '';
      n.hidden = !n.textContent;
    }
    const renderPresets = () => {
      $('presets').innerHTML = Object.entries(PRESETS).map(([name, p]) => `<button class="tg-preset${name === design().preset ? ' active' : ''}" type="button" data-p="${name}"><span class="sw">${p.data.slice(0, 5).map((c) => `<i style="background:${c}"></i>`).join('')}</span>${isAr() ? PRESET_AR[name] : name}</button>`).join('');
    };
    renderPresets();
    $('presets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const p = PRESETS[b.dataset.p]; design().preset = b.dataset.p; design().data = p.data.slice(); design().ui = { ...p.ui };
      renderInputs(); hooks.renderAll(); track('theme_preset', { preset: design().preset });
    });
    const onColor = (e) => {
      const el = e.target; if (!el.dataset.key) return;
      const val = el.type === 'color' ? el.value : clampHex(el.value);
      if (el.type === 'text') { el.classList.toggle('is-invalid', !val); el.setAttribute('aria-invalid', String(!val)); }
      if (!val) return;
      setColor(el.dataset.key, val);
      const twin = el.parentElement.querySelector(el.type === 'color' ? 'input[type=text]' : 'input[type=color]'); twin.value = val;
      document.querySelectorAll('.tg-preset').forEach((b) => b.classList.remove('active'));
      hooks.renderAll();
    };
    ['dataColors', 'uiColors'].forEach((id) => { $(id).addEventListener('input', onColor); });
    // leaving a hex box with something that is not a color: the box shows the color in use again, and says why
    ['dataColors', 'uiColors'].forEach((id) => $(id).addEventListener('change', (e) => {
      const el = e.target; if (el.type !== 'text' || !el.dataset.key) return;
      const k = el.dataset.key, cur = k[0] === 'd' ? design().data[+k.slice(1)] : design().ui[k.slice(2)], val = clampHex(el.value);
      if (!val) toast(L('Use a hex color like #1a2b3c', 'استخدم رمز لون مثل ‎#1a2b3c'));
      el.value = val || cur; el.classList.remove('is-invalid'); el.setAttribute('aria-invalid', 'false');
    }));
    $('genBtn').addEventListener('click', () => {
      design().data = generate($('brand').value, $('harmony').value); design().ui.accent = design().data[0]; design().preset = null;
      renderInputs(); hooks.renderAll(); track('theme_generate', { harmony: $('harmony').value });
    });
    $('themeName').addEventListener('input', (e) => { design().name = e.target.value.slice(0, 60); hooks.renderJson(); store.save(); });
    $('font').addEventListener('change', (e) => { design().font = e.target.value; hooks.renderAll(); });
    Object.entries(CHART_INPUTS).forEach(([id, k]) => $(id).addEventListener('change', (e) => {
      design().chart = Object.assign(chart(), { [k]: e.target.value }); hooks.clearLook(); hooks.renderAll(); track('theme_chart_style', { [k]: e.target.value });
    }));
    // ---------- page layout: a full background with a place for every visual ----------
    // Power BI's default page is 1280 × 720, so every slot is in those units and can be typed straight
    // into Format › General › Properties. The PNG is drawn at 1.5× (1920 × 1080) so it stays sharp.
    let PW = 1280;   // the current page's width on the 720-tall design grid (set by applyPage)
    const PH = 720;
    const page = (c) => E.page(c || lay());
    let pageMsg = '';   // shown once after a typed value was outside the limits
    const shapeMsg = (c) => { if (c.page !== 'custom') return ''; const [w, h] = fitCustom(c.pageW, c.pageH);
      // (0.2.9, the audit's A2-1: the small-page rule is the design engine's, so the page says what the report will get)
      const sp = E.smallPage(c), small = sp ? L(`Under ${E.SMALL_PAGE.w} wide the executive layout becomes the single-focus layout (the KPI cards and one large chart), with no second page.`, `تحت عرض ${E.SMALL_PAGE.w} يصبح الملخص التنفيذي تخطيط الرسالة الواحدة (بطاقات المؤشرات ومخطط كبير واحد)، بدون صفحة ثانية.`) : '';
      return [w === c.pageW && h === c.pageH ? '' : L(`This shape is outside 4:3 to 2.4:1, so the preview uses ${w} × ${h}.`, `هذا الشكل خارج النطاق من 4:3 إلى 2.4:1، لذلك تستخدم المعاينة <bdi dir="ltr">${w} × ${h}</bdi>.`), small].filter(Boolean).join(' '); };
    const applyPage = (c) => { const p = page(c); PW = Math.round(p.w / p.s); return p; };
    const boxOf = (s, c) => E.boxOf(s, c || lay());
    const lay = () => design().layout;
    const rtl = (c) => E.rtl(c || lay(), isAr() ? 'ar' : 'en');
    const nm = (x) => E.label(x, isAr() ? 'ar' : 'en');   // (A2-9: the engine's labels are keyed by language)

    // sizes kept inside their safe ranges (the filter panel's depends on the current page width; the header's and the top
    // filter rail's start higher on a small page, so their text fits)
    const rangeOf = (k) => E.rangeOf(k, PW, lay());
    const clampTo = (k, v) => E.clampTo(k, v, PW, lay());
    const sizes = (c) => E.sizes(c, PW);
    function computeSlots(c) { applyPage(c); return E.computeSlots(c, isAr() ? 'ar' : 'en'); }
    // accent bars: side, thickness and color (Advanced options)
    const barW = (k, c) => E.barW(k, c || lay());
    // small wireframe for the layout buttons (corners: the design's radius, as the panels; the audit's seen-not-in-scope)
    const thumb = (key) => {
      const c = Object.assign({}, lay(), { preset: key, kpis: LAYOUTS[key].kpis, filters: LAYOUTS[key].filters, kpiH: null, mainW: null, split: null }), u = design().ui;
      return `<svg viewBox="0 0 ${PW} ${PH}"><rect width="${PW}" height="${PH}" fill="${u.background}"/>${c.header ? `<rect width="${PW}" height="${sizes(c).hh}" fill="${E.roles(u).band}"/>` : ''}`
        + computeSlots(c).filter((s) => s.kind !== 'title' && s.kind !== 'logo').map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="${+c.radius || 0}" fill="${s.kind === 'kpi' ? u.accent : u.card}" opacity="${s.kind === 'kpi' ? 0.55 : 1}"/>`).join('') + '</svg>';
    };

    const seg = (key, opts, cur) => `<div class="tg-seg" role="group">${opts.map(([v, t]) => `<button type="button" data-l="${key}" data-v="${v}" class="${String(v) === String(cur) ? 'active' : ''}" aria-pressed="${String(v) === String(cur)}">${t}</button>`).join('')}</div>`;
    const chk = (key, t, note) => `<label class="tg-check"><input type="checkbox" data-l="${key}"${lay()[key] ? ' checked' : ''}> <span>${t}${note ? `<br><small class="text-white-50">${note}</small>` : ''}</span></label>`;

    // sliders show and take page units (percentages stay percentages)
    const rng = (key, label, v, unit, st) => { const f = unit === '%' ? 1 : page().s, [lo, hi] = rangeOf(key);
      return `<label class="tg-range"><span>${label} <b data-out="${key}">${Math.round(v * f)}${unit || ''}</b></span><input type="range" data-l="${key}" data-u="${unit || ''}" data-f="${f}" min="${Math.round(lo * f)}" max="${Math.round(hi * f)}" step="${unit === '%' ? 1 : Math.max(1, Math.round((st || 4) * f))}" value="${Math.round(v * f)}"></label>`; };
    function sizeControls(c) {
      applyPage(c);
      const P = LAYOUTS[c.preset], z = sizes(c), out = [], pg = page(c);
      if (c.header) out.push(rng('hh', L('Header height', 'ارتفاع الشريط العلوي'), z.hh), rng('logoW', L('Logo width', 'عرض الشعار'), z.logoW));
      if (c.filters) {
        out.push(`<div><span class="tg-label">${L('Filter panel position', 'موضع لوحة الفلاتر')}</span>${seg('fpos', [['start', L('Start side', 'جهة البداية')], ['end', L('End side', 'جهة النهاية')], ['top', L('Top', 'أعلى')]], z.fpos)}</div>`);
        out.push(z.fpos === 'top' ? rng('fh', L('Filter strip height', 'ارتفاع شريط الفلاتر'), z.fh) : rng('fw', L('Filter panel width', 'عرض لوحة الفلاتر'), z.fw));
      }
      out.push(rng('kpiH', L('KPI row height', 'ارتفاع صف المؤشرات'), z.kpiH));
      if (hasMain(P)) out.push(rng('mainW', L('Main chart width', 'عرض المخطط الرئيسي'), z.mainW, '%'));
      if (hasSplit(P)) out.push(rng('split', L('Top row share of the chart area', 'حصة الصف العلوي من مساحة المخططات'), z.split, '%'));
      return `<div class="tg-sizes"><div class="d-flex justify-content-between align-items-center"><span class="tg-label mb-0">${L('Adjust sizes', 'ضبط المقاسات')}</span><button type="button" class="tg-reset" data-l="reset"><i class="bi bi-arrow-counterclockwise"></i> ${L('Reset sizes', 'إعادة المقاسات')}</button></div>
      <small class="text-white-50 d-block mb-2">${L(`Start side is the left in left-to-right reports and the right in Arabic ones. Sizes are in your page units (${pg.w} × ${pg.h}).`, `جهة البداية هي اليسار في التقارير من اليسار لليمين واليمين في التقارير العربية. المقاسات بوحدات صفحتك (${pg.w} × ${pg.h}).`)}</small>${out.join('')}</div>`;
    }
    // Advanced options: exact values for people who want them; closed by default
    let advOpen = false;
    const dot = (col) => `<i class="tg-dot" style="background:${col}"></i>`;
    const colorSeg = (key, cur) => { const u = design().ui;
      return seg(key, [['accent', dot(u.accent) + L('Accent', 'التمييز')], ['good', dot(u.good) + L('Good', 'جيد')], ['neutral', dot(u.neutral) + L('Neutral', 'محايد')], ['data', `<span class="tg-dots">${design().data.slice(0, 3).map(dot).join('')}</span>` + L('Data colors', 'ألوان البيانات')]], cur || 'accent'); };
    function advControls(c) {
      const out = [rng('radius', L('Exact corner radius', 'نصف قطر الزوايا بدقة'), +c.radius || 0, '', 1)];
      if (c.kpiBar && c.kpiBar !== 'none') out.push(rng('kpiBarW', L('KPI bar thickness', 'سُمك خط المؤشرات'), barW('kpiBarW', c), '', 1),
        `<div><span class="tg-label">${L('KPI bar color', 'لون خط المؤشرات')}</span>${colorSeg('kpiBarC', c.kpiBarC)}</div>`);
      if (c.header && c.headLine !== 'none') out.push(rng('headLineW', L('Header line thickness', 'سُمك خط الشريط العلوي'), barW('headLineW', c), '', 1),
        `<div><span class="tg-label">${L('Header line color', 'لون خط الشريط العلوي')}</span>${colorSeg('headLineC', c.headLineC)}</div>`);
      return `<details class="tg-adv"${advOpen ? ' open' : ''}><summary>${L('Advanced options', 'خيارات متقدمة')}</summary><div class="tg-sizes mt-2">
      <div class="d-flex justify-content-between align-items-center"><small class="text-white-50">${L(`Fine control over corners and accent lines, in your page units (${page(c).w} × ${page(c).h}).`, `تحكم دقيق في الزوايا والخطوط الملونة، بوحدات صفحتك (${page(c).w} × ${page(c).h}).`)}</small><button type="button" class="tg-reset flex-shrink-0" data-l="resetAdv"><i class="bi bi-arrow-counterclockwise"></i> ${L('Reset', 'إعادة')}</button></div>
      ${out.join('')}</div></details>`;
    }
    const pngSize = (c) => E.pngSize(c || lay());
    // (0.3.1 LC1) the canvas's slots: page 1 as the project download writes it (canvasFit, page units) on the 720 grid,
    // each with its row in the slot table (s: the same kind and name, in order), or the layout's slots
    const canvasSlots = (c, slots) => {
      const fit = hooks.canvasFit(); if (!fit) return null;
      const own = computeSlots(fit.layout), k = page(fit.layout).s, seen = {};
      const drawn = fit.slots.map((f) => { const key = f.kind + '|' + nm(own[f.i].role), n = seen[key] = (seen[key] || 0) + 1;
        const row = slots.map((x, j) => [x, j]).filter(([x]) => x.kind + '|' + nm(x.role) === key)[n - 1];
        return Object.assign({}, own[f.i], { x: f.x / k, y: f.y / k, w: f.w / k, h: f.h / k, s: row ? row[1] : null }, f.stack ? { stack: true } : {}); });
      computeSlots(c);   // (the page's size back to the layout's)
      return { drawn, moved: drawn.length !== slots.length || drawn.some((d) => { const b = boxOf(d, c), r = d.s != null ? boxOf(slots[d.s], c) : null; return !r || b.x !== r.x || b.y !== r.y || b.w !== r.w || b.h !== r.h; }) };
    };
    function renderLayoutPreview() {
      const c = lay(), slots = computeSlots(c), pg = page(c), [pw, ph] = pngSize(c), fit = canvasSlots(c, slots);
      $('layCanvas').innerHTML = hooks.bgSvg(fit ? fit.drawn : slots, Object.assign({ preview: true }, E.isGlass(design()) ? { glass: Object.assign({ url: hooks.glassUrl() }, E.glassLook(design())) } : {}));
      if (fit) $('layCanvas').querySelector('svg').setAttribute('data-fit', fit.moved ? 'moved' : 'same');
      const H = isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height'];
      $('slotTable').innerHTML = `<table><thead><tr>${H.map((h, i) => `<th${i > 1 ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${slots.map((s, i) => `<tr data-i="${i}"><td>${nm(s.role)}</td><td>${nm(KINDS[s.kind])}</td>${((b) => [b.x, b.y, b.w, b.h].map((n) => `<td class="n">${n}</td>`).join(''))(boxOf(s, c))}</tr>`).join('')}</tbody></table>`;
      hooks.updateStatus();
      const note = $('layUnits'); if (note) note.innerHTML = L(`Numbers are for a Power BI page of <b>${pg.w} × ${pg.h}</b> (Format page › Canvas settings). The PNG is ${pw} × ${ph} pixels for a sharp background; with Image fit <b>Stretch</b> it lines up exactly.`, `الأرقام لصفحة Power BI بمقاس <b><bdi dir="ltr">${pg.w} × ${pg.h}</bdi></b> (<bdi dir="ltr">Format page › Canvas settings</bdi>). الصورة PNG بمقاس <bdi dir="ltr">${pw} × ${ph}</bdi> بكسل لتكون حادة، ومع <bdi dir="ltr">Image fit: Stretch</bdi> تنطبق تمامًا.`) + (fit && fit.moved ? ' ' + L('The preview shows page 1 as the Power BI project download writes it (the filter panel as high as its slicers). The table, PNG and CSV keep the layout\'s slots, for placing visuals yourself.', 'تعرض المعاينة الصفحة 1 كما يكتبها تنزيل مشروع Power BI (لوحة الفلاتر بارتفاع مقسماتها). يبقى الجدول وصورة PNG وملف CSV بمواضع التخطيط، لتضع العناصر بنفسك.') : '');
    }
    function renderLayout() {
      const c = lay(); applyPage(c); hooks.renderJson(); // the theme's corner radius follows the page size and corners
      // page size first: it is set once in Power BI and every number below depends on it
      $('pageSize').innerHTML = `<span class="tg-label">${L('Power BI page size', 'مقاس صفحة Power BI')}</span>
      <div>${seg('page', [[E.DEFAULT_PAGE, `${E.PAGES[E.DEFAULT_PAGE].join(' × ')}<small>${L('16:9 · Power BI default', '16:9 · افتراضي Power BI')}</small>`], ['1280x720', `1280 × 720<small>${L('16:9 · older reports', '16:9 · تقارير أقدم')}</small>`], ['960x720', `960 × 720<small>4:3</small>`], ['custom', `${L('Custom', 'مخصص')}<small>${L('any size', 'أي مقاس')}</small>`]], c.page === 'custom' || PAGES[c.page] ? c.page : E.DEFAULT_PAGE)}
        ${c.page === 'custom' ? `<div class="tg-custom"><label>${L('Width', 'العرض')}<input type="number" inputmode="numeric" data-l="pageW" min="${LIM.w[0]}" max="${LIM.w[1]}" step="1" value="${c.pageW}"></label><span aria-hidden="true">×</span><label>${L('Height', 'الارتفاع')}<input type="number" inputmode="numeric" data-l="pageH" min="${LIM.h[0]}" max="${LIM.h[1]}" step="1" value="${c.pageH}"></label></div>
        <small class="d-block mt-1 ${pageMsg || shapeMsg(c) ? 'tg-warn' : 'text-white-50'}" role="status">${[pageMsg, shapeMsg(c)].filter(Boolean).join(' ') || L('Match Format page › Canvas settings › Custom in Power BI.', 'طابقه مع <bdi dir="ltr">Format page › Canvas settings › Custom</bdi> في Power BI.')}</small>` : ''}</div>
      <small class="d-block mt-2 text-white-50">${L('Use the same size in Power BI: <b>Format page › Canvas settings</b>. All sizes and positions below follow it.', 'استخدم المقاس نفسه في Power BI: <b><bdi dir="ltr">Format page › Canvas settings</bdi></b>. كل المقاسات والمواضع أدناه تتبعه.')}</small>`;
      $('layControls').innerHTML = `
      <div><span class="tg-label">${L('Layout', 'التخطيط')}</span><div class="tg-lays">${Object.keys(LAYOUTS).map((k) => `<button type="button" class="tg-lay-b${k === c.preset ? ' active' : ''}" data-l="preset" data-v="${k}" aria-pressed="${k === c.preset}">${thumb(k)}${nm(LAYOUTS[k].name)}</button>`).join('')}</div></div>
      <div><span class="tg-label">${L('KPI cards', 'بطاقات المؤشرات')}</span>${seg('kpis', [[3, '3'], [4, '4'], [5, '5'], [6, '6']], c.kpis)}</div>
      <div><span class="tg-label">${L('Reading direction', 'اتجاه القراءة')}</span>${seg('dir', [['ltr', L('Left to right', 'من اليسار لليمين')], ['rtl', L('Right to left (Arabic)', 'من اليمين لليسار (عربي)')]], rtl() ? 'rtl' : 'ltr')}</div>
      <div><span class="tg-label">${L('Corners', 'الزوايا')}</span>${seg('radius', [[0, L('Square', 'حادة')], [8, L('Soft', 'ناعمة')], [16, L('Round', 'دائرية')]], c.radius)}</div>
      <div><span class="tg-label">${L('KPI accent bar', 'الخط الملون لبطاقات المؤشرات')}</span>${seg('kpiBar', [['start', L('Start side', 'جهة البداية')], ['top', L('Top', 'أعلى')], ['bottom', L('Bottom', 'أسفل')], ['none', L('None', 'بدون')]], c.kpiBar || 'none')}</div>
      ${c.header ? `<div><span class="tg-label">${L('Header accent line', 'الخط الملون للشريط العلوي')}</span>${seg('headLine', [['short', L('Short, under the title', 'قصير تحت العنوان')], ['full', L('Full width', 'بعرض الصفحة')], ['none', L('None', 'بدون')]], c.headLine || 'short')}</div>` : ''}
      <div class="d-flex flex-column gap-2">
        ${chk('header', L('Header band for title and logo', 'شريط علوي للعنوان والشعار'))}
        ${chk('filters', L('Filter panel', 'لوحة الفلاتر'))}
        ${chk('shadow', L('Soft shadows', 'ظلال خفيفة'))}
        ${chk('samples', L('Sample visuals in the preview', 'عناصر تجريبية في المعاينة'))}
      </div>
      ${sizeControls(c)}
      ${advControls(c)}`;
      $('layWhy').innerHTML = LAYOUTS[c.preset].why.map((w) => `<span><i class="bi bi-check2"></i> ${nm(w)}</span>`).join('');
      renderLayoutPreview(); hooks.renderVis(); fontNote();
    }

    const step2 = $('layout');
    step2.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-l]'); if (!b) return;
      const k = b.dataset.l, v = b.dataset.v, c = lay();
      if (k === 'preset') { c.preset = v; c.kpis = LAYOUTS[v].kpis; c.filters = LAYOUTS[v].filters; delete c.kpiH; delete c.mainW; delete c.split; track('theme_layout', { layout: v }); }
      else if (k === 'reset') ['hh', 'logoW', 'fpos', 'fw', 'fh', 'kpiH', 'mainW', 'split'].forEach((x) => delete c[x]);
      else if (k === 'resetAdv') { c.radius = 8; ['kpiBarW', 'kpiBarC', 'headLineW', 'headLineC'].forEach((x) => delete c[x]); }
      else if (k === 'page') { if (v === 'custom' && c.page !== 'custom') { const p = page(c); c.pageW = p.w; c.pageH = p.h; } c.page = v; pageMsg = ''; track('theme_page_size', { size: v }); }
      else c[k] = ['dir', 'fpos', 'kpiBar', 'kpiBarC', 'headLine', 'headLineC'].includes(k) ? v : +v;
      if (['kpiBar', 'kpiBarC', 'headLine', 'headLineC'].includes(k)) track('theme_accent', { option: k, accent_value: v });
      hooks.layoutChanged(); renderLayout(); store.save();
    });
    // sliders redraw the preview while dragging, without rebuilding the controls
    step2.addEventListener('input', (e) => {
      const el = e.target.closest('input[type="range"][data-l]'); if (!el) return;
      lay()[el.dataset.l] = clampTo(el.dataset.l, el.value / (+el.dataset.f || 1));
      const o = $('layControls').querySelector(`[data-out="${el.dataset.l}"]`); if (o) o.textContent = el.value + el.dataset.u;
      // the exact radius slider keeps the Square/Soft/Round buttons in step
      if (el.dataset.l === 'radius') $('layControls').querySelectorAll('button[data-l="radius"]').forEach((b) => { const on = +b.dataset.v === lay().radius; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
      if (el.dataset.l === 'radius') hooks.renderJson();
      hooks.layoutChanged(); renderLayoutPreview(); store.save();
    });
    step2.addEventListener('change', (e) => {
      const num = e.target.closest('input[type="number"][data-l]');
      if (num) {
        const c = lay(), k = num.dataset.l, isW = k === 'pageW', lim = isW ? LIM.w : LIM.h;
        if (num.value === '' || !isFinite(+num.value)) { pageMsg = L('Enter a whole number.', 'أدخل رقمًا صحيحًا.'); renderLayout(); return; }
        const v = Math.round(+num.value), kept = within(v, lim);
        pageMsg = kept !== v ? (isW ? L(`Width set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط العرض على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`) : L(`Height set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط الارتفاع على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`)) : '';
        c[k] = kept; const [w, h] = fitCustom(c.pageW, c.pageH); track('theme_page_size', { size: w + 'x' + h });
        hooks.layoutChanged(); renderLayout(); store.save(); return;
      }
      const el = e.target.closest('input[type="checkbox"][data-l]'); if (!el) return;
      lay()[el.dataset.l] = el.checked;
      hooks.layoutChanged(); renderLayout(); store.save();
    });
    // remember whether Advanced options is open when the controls are rebuilt (toggle does not bubble)
    $('layControls').addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('tg-adv')) advOpen = e.target.open; }, true);
    // hovering a row outlines its panel on the preview
    const hl = (i) => { $('layCanvas').querySelectorAll('[data-s] .o').forEach((o) => o.setAttribute('opacity', o.parentNode.dataset.s === i ? '1' : '0')); };
    $('slotTable').addEventListener('mouseover', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) hl(tr.dataset.i); });
    $('slotTable').addEventListener('mouseleave', () => hl(null));

    return { PH, PRESET_AR, lay, page, applyPage, computeSlots, boxOf, rtl, nm, pngSize, seg, renderInputs, renderPresets, renderLayout, renderLayoutPreview, fontNote,
      clearPageMsg: () => { pageMsg = ''; } };
  }

  const api = { mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAThemeLayoutUI = api;
})(typeof self !== 'undefined' ? self : this);
