/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Power BI Theme & Layout Generator (page code on the design engine)
 * The page: controls, preview, downloads, the Power BI project. The theme and layout logic is in design-engine.js
 * (window.DAEngine), shared with the DataArcus MCP. Both generator pages load the engine first, then this file.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const STORE = 'dataarcus-theme-generator';
  // Arabic/English for text drawn by this script (static page text uses data-i18n)
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const PRESET_AR = { 'DataArcus': 'داتا أركوس', 'Corporate': 'رسمي', 'Colorblind safe': 'آمن لعمى الألوان', 'Desert Gulf': 'صحراء الخليج', 'Midnight': 'منتصف الليل', 'Earthy': 'ترابي' };

  const E = window.DAEngine;   // design-engine.js: colours, theme JSON, page sizes, slots, background
  const PRESETS = E.PRESETS;
  const UI_LABELS_EN = { background: 'Page', card: 'Visual', text: 'Text', accent: 'Table accent', good: 'Good', neutral: 'Neutral', bad: 'Bad' };
  const UI_LABELS_AR = { background: 'الصفحة', card: 'العنصر المرئي', text: 'النص', accent: 'لون الجدول', good: 'جيد', neutral: 'محايد', bad: 'سيئ' };
  const uiLabel = (k) => (isAr() ? UI_LABELS_AR : UI_LABELS_EN)[k];
  const UI_LABELS = UI_LABELS_EN;

  const { clampHex, mix, contrast, generate } = E;

  // ---------- state ----------
  let state;
  try { state = JSON.parse(localStorage.getItem(STORE)); } catch (e) { state = null; }
  // an old or hand-edited save may be partial: each value that is not valid falls back to its default
  state = E.repairState(state);
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  // ---------- builders ----------
  const colorInput = (key, value, label) => `<div class="tg-color"><input type="color" value="${value}" data-key="${key}" aria-label="${label} color"><input type="text" value="${value}" data-key="${key}" maxlength="9" aria-label="${label} hex code" spellcheck="false"><span>${label}</span></div>`;
  const CHART_INPUTS = { csLabels: 'labels', csGrid: 'grid', csLegend: 'legend', csAxis: 'axis', csTable: 'table' };
  const renderInputs = () => {
    $('dataColors').innerHTML = state.data.map((c, i) => colorInput('d' + i, c, L('Color ', 'اللون ') + (i + 1))).join('');
    $('uiColors').innerHTML = Object.keys(UI_LABELS).map((k) => colorInput('u_' + k, state.ui[k], uiLabel(k))).join('');
    $('themeName').value = state.name; $('font').value = state.font;
    Object.entries(CHART_INPUTS).forEach(([id, k]) => { $(id).value = chart()[k]; });
    document.querySelectorAll('.tg-preset').forEach((b) => b.classList.toggle('active', b.dataset.p === state.preset));
  };
  const setColor = (key, val) => { if (key[0] === 'd') state.data[+key.slice(1)] = val; else state.ui[key.slice(2)] = val; state.preset = null; };

  // chart style choices with the defaults filled in, and the theme JSON
  const chart = () => E.chart(state);
  const buildTheme = () => E.buildTheme(state, isAr() ? 'ar' : 'en');

  const renderPreview = () => {
    const u = state.ui, d = state.data, sec = mix(u.text, u.card, 0.35), grid = mix(u.text, u.card, 0.85), cs = chart();
    const card = (k, v, delta, good) => `<div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${sec}">${k}</div><div class="v">${v}</div><div class="d" style="color:${good ? u.good : u.bad}">${delta}</div></div>`;
    const months = isAr() ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const s1 = [42, 55, 48, 63, 70, 78], s2 = [30, 34, 41, 38, 49, 52], s3 = [18, 22, 20, 27, 25, 31];
    const bars = months.map((m, i) => [s1[i], s2[i], s3[i]].map((v, j) => { const x = 34 + i * 58 + j * 15, h = v * 1.6; return `<rect x="${x}" y="${150 - h}" width="13" height="${h}" rx="2" fill="${d[j]}"/>`
      + (cs.labels === 'on' ? `<text x="${x + 6.5}" y="${146 - h}" font-size="7" text-anchor="middle" fill="${sec}">${v}</text>` : ''); }).join('') + `<text x="${34 + i * 58 + 21}" y="166" font-size="10" text-anchor="middle" fill="${sec}">${m}</text>`).join('');
    const gridLines = [0, 40, 80, 120].map((v) => `${cs.grid === 'off' && v ? '' : `<line x1="28" x2="380" y1="${150 - v}" y2="${150 - v}" stroke="${cs.grid === 'dotted' && v ? mix(u.text, u.card, 0.8) : grid}" stroke-width="1"${cs.grid === 'dotted' && v ? ' stroke-dasharray="1 3"' : ''}/>`}<text x="22" y="${154 - v}" font-size="9" text-anchor="end" fill="${sec}">${v / 1.6 | 0}</text>`).join('');
    // legend of the bar chart, where the theme puts it (Power BI's default is top left)
    const legendItems = [L('Online', 'أونلاين'), L('Stores', 'المتاجر'), L('Partners', 'الشركاء')].map((n, i) => `<span style="display:inline-flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:50%;background:${d[i]};display:inline-block"></i>${n}</span>`).join('');
    const side = cs.legend === 'Right';
    // a "Side" legend goes where the theme puts it: left when the design reads right to left (the same rtl() as the
    // theme), whatever the page's own writing direction, so the row is reversed when the two differ
    const row = side && rtl() !== isAr() ? 'row-reverse' : 'row';
    const legend = cs.legend === 'off' ? '' : `<div class="tg-legend" style="display:flex;${side ? 'flex-direction:column;justify-content:center;' : ''}gap:${side ? 4 : 10}px;font-size:.68rem;color:${sec};justify-content:${cs.legend === 'TopCenter' ? 'center' : side ? 'center' : 'flex-start'};margin:${side ? '0' : '4px 0'}">${legendItems}</div>`;
    const barSvg = (g, b) => `<svg viewBox="0 0 390 172" role="img" aria-label="Clustered bar chart preview"${side ? ' style="flex:1;min-width:0"' : ''}>${g}${b}</svg>`;
    const barChart = (g, b) => (side ? `<div style="display:flex;flex-direction:${row};gap:8px">${barSvg(g, b)}${legend}</div>` : cs.legend === 'Bottom' ? barSvg(g, b) + legend : legend + barSvg(g, b));
    const pts = (arr, k) => arr.map((v, i) => `${40 + i * 62},${150 - v * k}`).join(' ');
    const donutVals = [40, 25, 20, 15]; let acc = 0; const R = 46, C = 2 * Math.PI * R;
    const donut = donutVals.map((v, i) => { const seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${d[i]}" stroke-width="20" stroke-dasharray="${C * v / 100} ${C}" stroke-dashoffset="${-C * acc / 100}" transform="rotate(-90 70 70)"/>`; acc += v; return seg; }).join('');
    $('preview').style.background = u.background;
    $('preview').style.fontFamily = `'${state.font}', 'Segoe UI', sans-serif`;
    $('preview').innerHTML = `
      <div class="tg-kpis">${card(L('Revenue', 'الإيرادات'), 'AED 1.24M', L('▲ 12.4% vs LM', '▲ 12.4% عن الشهر الماضي'), true)}${card(L('Orders', 'الطلبات'), '8,432', L('▲ 5.1% vs LM', '▲ 5.1% عن الشهر الماضي'), true)}${card(L('Return rate', 'نسبة المرتجعات'), '4.8%', L('▼ 0.6 pts', '▼ 0.6 نقطة'), false)}</div>
      <div class="tg-grid2">
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Sales by channel', 'المبيعات حسب القناة')}</div>
          ${barChart(gridLines, bars)}</div>
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Share by brand', 'الحصة حسب العلامة')}</div>
          <svg viewBox="0 0 140 140" style="max-width:170px;margin:6px auto 0" role="img" aria-label="Donut chart preview">${donut}<text x="70" y="75" font-size="16" font-weight="800" text-anchor="middle" fill="${u.text}">40%</text></svg></div>
      </div>
      <div class="tg-grid2" style="margin-top:10px">
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Trend', 'الاتجاه')}</div>
          <svg viewBox="0 0 390 160" role="img" aria-label="Line chart preview">${gridLines}<polyline points="${pts(s1, 1.6)}" fill="none" stroke="${d[0]}" stroke-width="3" stroke-linejoin="round"/><polyline points="${pts(s2, 1.6)}" fill="none" stroke="${d[1]}" stroke-width="3" stroke-linejoin="round"/></svg></div>
        <div class="tg-card" style="background:${u.card};color:${u.text};overflow-x:auto"><table class="tg-table">
          <tr style="background:${u.accent}">${(isAr() ? ['العلامة', 'المبيعات', 'الحالة'] : ['Brand', 'Sales', 'Status']).map((h) => `<th style="color:${contrast(u.accent, '#ffffff') >= contrast(u.accent, '#111111') ? '#ffffff' : '#111111'}">${h}</th>`).join('')}</tr>
          ${[[L('North', 'الشمال'), '412K', 'good'], [L('South', 'الجنوب'), '288K', 'neutral'], [L('East', 'الشرق'), '176K', 'bad']].map((r, i) => `<tr style="background:${i % 2 && cs.table !== 'minimal' ? mix(u.card, u.accent, 0.08) : u.card}${cs.table === 'minimal' ? `;border-bottom:1px solid ${mix(u.text, u.card, 0.85)}` : ''}"><td>${r[0]}</td><td>${r[1]}</td><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${u[r[2]]}"></span></td></tr>`).join('')}
        </table></div>
      </div>`;
  };

  const renderContrast = () => {
    // the numbers come from the engine (the MCP reports the same); the page gives each check its words
    const NAMES = { textOnVisuals: L('Text on visuals', 'النص على العناصر المرئية'), labelsOnVisuals: L('Labels on visuals', 'التسميات على العناصر المرئية'),
      textOnPage: L('Text on page', 'النص على الصفحة'), color1OnVisuals: L('Color 1 on visuals', 'اللون 1 على العناصر المرئية') };
    const r0 = E.contrastChecks(state), checks = r0.checks.map((x) => [NAMES[x.id], x.ratio, x.min]), weak = r0.weak;
    // a failing ratio is rounded down, so 4.48 shows as 4.4:1 and never as the 4.5:1 it misses
    const shown = (r, min) => (r >= min ? r : Math.floor(r * 10) / 10).toFixed(1);
    $('contrast').innerHTML = checks.map(([k, r, min]) => `<div class="${r >= min ? 'ok' : 'warn'}"><i class="bi ${r >= min ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1"></i>${k}: ${shown(r, min)}:1 ${r >= min ? '' : L(`(aim for ${min}:1)`, `(المطلوب ${min}:1)`)}</div>`).join('')
      + (weak.length ? `<div class="warn"><i class="bi bi-exclamation-triangle me-1"></i>${L(`Color ${weak.join(', ')} almost disappears on the visual background.`, `اللون ${weak.join('، ')} يكاد يختفي على خلفية العنصر المرئي.`)}</div>` : '');
  };

  const renderJson = () => { $('json').textContent = JSON.stringify(buildTheme(), null, 2); updateStatus(); };
  const renderAll = () => { renderPreview(); renderContrast(); renderJson(); renderLayout(); save(); if (window.__tgFoldSums) window.__tgFoldSums(); };
  // Every font in the list is built into Power BI, but only some have Arabic letters: in an Arabic or
  // right-to-left report the others fall back to another font, so say so under the font picker.
  const AR_FONTS = E.AR_FONTS;
  function fontNote() {
    const sel = $('font'); if (!sel) return;
    let n = $('fontNote');
    if (!n) { n = document.createElement('small'); n.id = 'fontNote'; n.className = 'd-block mt-1 tg-warn'; n.setAttribute('role', 'status'); sel.insertAdjacentElement('afterend', n); }
    const arabic = isAr() || (state.layout && state.layout.dir === 'rtl');
    n.textContent = arabic && !AR_FONTS.includes(state.font)
      ? L(`${state.font} has no Arabic letters, so Arabic text will show in another font. For Arabic reports use Segoe UI, Tahoma or Arial.`, `خط ${state.font} لا يحتوي حروفًا عربية، فسيظهر النص العربي بخط آخر. للتقارير العربية استخدم Segoe UI أو Tahoma أو Arial.`)
      : '';
    n.hidden = !n.textContent;
  }

  // ---------- events ----------
  const renderPresets = () => {
    $('presets').innerHTML = Object.entries(PRESETS).map(([name, p]) => `<button class="tg-preset${name === state.preset ? ' active' : ''}" type="button" data-p="${name}"><span class="sw">${p.data.slice(0, 5).map((c) => `<i style="background:${c}"></i>`).join('')}</span>${isAr() ? PRESET_AR[name] : name}</button>`).join('');
  };
  renderPresets();
  $('presets').addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    const p = PRESETS[b.dataset.p]; state.preset = b.dataset.p; state.data = p.data.slice(); state.ui = { ...p.ui };
    renderInputs(); renderAll(); track('theme_preset', { preset: state.preset });
  });
  const onColor = (e) => {
    const el = e.target; if (!el.dataset.key) return;
    const val = el.type === 'color' ? el.value : clampHex(el.value);
    if (el.type === 'text') { el.classList.toggle('is-invalid', !val); el.setAttribute('aria-invalid', String(!val)); }
    if (!val) return;
    setColor(el.dataset.key, val);
    const twin = el.parentElement.querySelector(el.type === 'color' ? 'input[type=text]' : 'input[type=color]'); twin.value = val;
    document.querySelectorAll('.tg-preset').forEach((b) => b.classList.remove('active'));
    renderAll();
  };
  ['dataColors', 'uiColors'].forEach((id) => { $(id).addEventListener('input', onColor); });
  // leaving a hex box with something that is not a color: the box shows the color in use again, and says why
  ['dataColors', 'uiColors'].forEach((id) => $(id).addEventListener('change', (e) => {
    const el = e.target; if (el.type !== 'text' || !el.dataset.key) return;
    const k = el.dataset.key, cur = k[0] === 'd' ? state.data[+k.slice(1)] : state.ui[k.slice(2)], val = clampHex(el.value);
    if (!val) toast(L('Use a hex color like #1a2b3c', 'استخدم رمز لون مثل ‎#1a2b3c'));
    el.value = val || cur; el.classList.remove('is-invalid'); el.setAttribute('aria-invalid', 'false');
  }));
  $('genBtn').addEventListener('click', () => {
    state.data = generate($('brand').value, $('harmony').value); state.ui.accent = state.data[0]; state.preset = null;
    renderInputs(); renderAll(); track('theme_generate', { harmony: $('harmony').value });
  });
  $('themeName').addEventListener('input', (e) => { state.name = e.target.value.slice(0, 60); renderJson(); save(); });
  $('font').addEventListener('change', (e) => { state.font = e.target.value; renderAll(); });
  Object.entries(CHART_INPUTS).forEach(([id, k]) => $(id).addEventListener('change', (e) => {
    state.chart = Object.assign(chart(), { [k]: e.target.value }); renderAll(); track('theme_chart_style', { [k]: e.target.value });
  }));

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  $('copyBtn').addEventListener('click', () => {
    const text = JSON.stringify(buildTheme(), null, 2);
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('json')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Theme JSON copied', 'تم نسخ ملف السمة')), fallback); else fallback();
    lastJson = text; updateStatus();
    track('theme_copy', { preset: state.preset || 'custom' });
  });
  const downloadJson = (from) => {
    const text = JSON.stringify(buildTheme(), null, 2), blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileBase() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    lastJson = text; updateStatus();
    toast(L('Downloaded. Import it via View → Themes', 'تم التنزيل. استورده من View → Themes'));
    track('theme_download', { preset: state.preset || 'custom', font: state.font, from });
  };
  $('dlBtn').addEventListener('click', () => downloadJson('step3'));

  // ---------- page layout: a full background with a place for every visual ----------
  // Power BI's default page is 1280 × 720, so every slot is in those units and can be typed straight
  // into Format › General › Properties. The PNG is drawn at 1.5× (1920 × 1080) so it stays sharp.
  let PW = 1280, PH = 720;   // the current page's size on the 720-tall design grid
  const { M, PAGES, LIM, within, fitCustom, KINDS, LAYOUTS, hasMain, hasSplit } = E;
  const page = (c) => E.page(c || lay());
  let pageMsg = '';   // shown once after a typed value was outside the limits
  const shapeMsg = (c) => { if (c.page !== 'custom') return ''; const [w, h] = fitCustom(c.pageW, c.pageH);
    return w === c.pageW && h === c.pageH ? '' : L(`This shape is outside 4:3 to 2.4:1, so the preview uses ${w} × ${h}.`, `هذا الشكل خارج النطاق من 4:3 إلى 2.4:1، لذلك تستخدم المعاينة <bdi dir="ltr">${w} × ${h}</bdi>.`); };
  const applyPage = (c) => { const p = page(c); PW = Math.round(p.w / p.s); PH = 720; return p; };
  const toPage = (v, c) => E.toPage(v, c || lay());
  const boxOf = (s, c) => E.boxOf(s, c || lay());
  const lay = () => state.layout;
  const rtl = (c) => E.rtl(c || lay(), isAr() ? 'ar' : 'en');
  const nm = (pair) => (isAr() ? pair[1] : pair[0]);

  // sizes kept inside their safe ranges (the filter panel's depends on the current page width; the header's and the top
  // filter rail's start higher on a small page, so their text fits)
  const rangeOf = (k) => E.rangeOf(k, PW, lay());
  const clampTo = (k, v) => E.clampTo(k, v, PW, lay());
  const sizes = (c) => E.sizes(c, PW);
  function computeSlots(c) { applyPage(c); return E.computeSlots(c, isAr() ? 'ar' : 'en'); }

  // Sample content so the preview reads like a finished report (never drawn in the PNG)
  function sample(s, u, right) {
    const d = state.data, sec = mix(u.text, u.card, 0.35), grid = mix(u.text, u.card, 0.85), p = 14;
    const X = s.x + p, Y = s.y + 32, W = s.w - 2 * p, H = s.h - 32 - p;
    const at = (fx) => (right ? s.x + s.w - p - fx : X + fx); // horizontal position from the reading start
    const font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
    switch (s.kind) {
      case 'kpi': {
        const vals = ['AED 1.24M', '8,432', '4.8%', '312', '96%', '27 min'], v = vals[(+s.role[0].split(' ')[1] - 1) % vals.length];
        const fs = Math.min(30, Math.round(s.h * 0.3));
        return `<text x="${at(c0(s))}" y="${s.y + s.h / 2 + fs / 2.6}" ${font} font-size="${fs}" font-weight="800" fill="${u.text}" text-anchor="${right ? 'end' : 'start'}">${v}</text>`
          + `<text x="${at(c0(s))}" y="${s.y + s.h - 14}" ${font} font-size="11" font-weight="600" fill="${u.good}" text-anchor="${right ? 'end' : 'start'}">▲ ${L('5.1% vs LM', '5.1% عن الشهر الماضي')}</text>`;
      }
      case 'line': {
        const a = [0.55, 0.62, 0.58, 0.7, 0.66, 0.78, 0.74, 0.86, 0.82, 0.92], b = [0.35, 0.4, 0.38, 0.45, 0.5, 0.48, 0.56, 0.54, 0.6, 0.64];
        const pts = (arr) => arr.map((v, i) => `${(X + (i / (arr.length - 1)) * W).toFixed(1)},${(Y + H - v * H * 0.9).toFixed(1)}`).join(' ');
        return [0.25, 0.5, 0.75].map((f) => `<line x1="${X}" x2="${X + W}" y1="${Y + H * f}" y2="${Y + H * f}" stroke="${grid}"/>`).join('')
          + `<polyline points="${pts(b)}" fill="none" stroke="${d[1]}" stroke-width="2.5" stroke-linejoin="round"/><polyline points="${pts(a)}" fill="none" stroke="${d[0]}" stroke-width="3" stroke-linejoin="round"/>`;
      }
      case 'bar': {
        const v = [0.92, 0.74, 0.61, 0.45, 0.32], n = Math.max(3, Math.min(5, Math.floor(H / 26))), bh = Math.min(16, H / n - 8);
        return v.slice(0, n).map((f, i) => { const w = (W - 8) * f; return `<rect x="${right ? X + W - w : X}" y="${Y + i * (H / n) + 4}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${d[0]}" opacity="${1 - i * 0.12}"/>`; }).join('');
      }
      case 'column': {
        const v = [0.5, 0.64, 0.58, 0.72, 0.68, 0.84, 0.78, 0.95], n = v.length, gap = W / n;
        return v.map((f, i) => `<rect x="${(X + i * gap + gap * 0.18).toFixed(1)}" y="${(Y + H - f * H).toFixed(1)}" width="${(gap * 0.64).toFixed(1)}" height="${(f * H).toFixed(1)}" rx="3" fill="${d[0]}" opacity="${i === n - 1 ? 1 : 0.5}"/>`).join('');
      }
      case 'donut': {
        const r = Math.max(10, Math.min(W, H) / 2 - 10), cx = s.x + s.w / 2, cy = Y + H / 2, C = 2 * Math.PI * r; let acc = 0;
        return [0.4, 0.25, 0.2, 0.15].map((v, i) => { const seg = `<circle r="${r.toFixed(1)}" cx="${cx}" cy="${cy}" fill="none" stroke="${d[i]}" stroke-width="${Math.max(8, r * 0.36).toFixed(1)}" stroke-dasharray="${(C * v).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-C * acc).toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`; acc += v; return seg; }).join('');
      }
      case 'table': {
        const rows = Math.max(3, Math.min(8, Math.floor((H - 12) / 24)));
        let t = `<rect x="${X}" y="${Y}" width="${W}" height="20" rx="4" fill="${u.accent}" opacity=".9"/>`;
        for (let i = 1; i < rows; i++) t += `<rect x="${X}" y="${Y + i * 24 + 16}" width="${W}" height="1" fill="${grid}"/>` + [0.34, 0.18, 0.14].map((f, j) => `<rect x="${right ? X + W - (8 + j * W * 0.36) - W * f : X + 8 + j * W * 0.36}" y="${Y + i * 24 + 4}" width="${(W * f).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".45"/>`).join('');
        return t;
      }
      case 'text': return [1, 0.92, 0.96, 0.7, 0, 1, 0.84, 0.6].map((f, i) => (f ? `<rect x="${right ? X + W - W * f : X}" y="${Y + 6 + i * 18}" width="${(W * f).toFixed(1)}" height="7" rx="3.5" fill="${sec}" opacity=".45"/>` : '')).join('');
      case 'slicer': if (s.w > s.h * 3) { const n = 4, bw = (W - (n - 1) * 10) / n, by = s.y + Math.max(28, s.h - 38); return Array.from({ length: n }, (_, i) => { const bx = right ? X + W - (i + 1) * bw - i * 10 : X + i * (bw + 10); return `<rect x="${bx.toFixed(1)}" y="${by}" width="${bw.toFixed(1)}" height="26" rx="7" fill="none" stroke="${grid}" stroke-width="1.5"/><rect x="${(right ? bx + bw - 10 - bw * 0.45 : bx + 10).toFixed(1)}" y="${by + 10}" width="${(bw * 0.45).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".5"/>`; }).join(''); }
        return [0, 1, 2, 3].map((i) => `<rect x="${X}" y="${Y + i * 46}" width="${W}" height="30" rx="7" fill="none" stroke="${grid}" stroke-width="1.5"/><rect x="${right ? X + W - 10 - W * 0.45 : X + 10}" y="${Y + i * 46 + 12}" width="${(W * 0.45).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".5"/>`).join('');
      case 'title': return `<text x="${right ? s.x + s.w : s.x}" y="${(s.y + s.h * 0.72).toFixed(1)}" ${font} font-size="${Math.min(30, Math.round(s.h * 0.6))}" font-weight="700" fill="${u.text}" text-anchor="${right ? 'end' : 'start'}">${L('Sales overview', 'نظرة عامة على المبيعات')}</text>`;
      case 'logo': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6" fill="none" stroke="${sec}" stroke-dasharray="4 4" opacity=".6"/><text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 4}" ${font} font-size="11" font-weight="700" fill="${sec}" text-anchor="middle" letter-spacing="1">${L('YOUR LOGO', 'شعارك')}</text>`;
    }
    return '';
  }
  // accent bars: side, thickness and color (Advanced options)
  const barW = (k, c) => E.barW(k, c || lay());
  const barColor = (k, i) => E.barColor(state, k, i);
  const c0 = () => E.c0(lay()); // KPI text sits after a side bar

  // The background (design engine); the preview adds sample visuals, slot names and sizes over the panels
  const previewMarks = (slots) => {
    const u = state.ui, c = lay(), right = rtl(), r = +c.radius;
    let s = '';
    const sec = mix(u.text, u.card, 0.35), font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
    slots.forEach((p, i) => {
      let g = c.samples ? sample(p, u, right) : '';
      if (p.kind !== 'title' && p.kind !== 'logo') {
        const lx = right ? p.x + p.w - 14 - (p.kind === 'kpi' ? c0(p) : 0) : p.x + 14 + (p.kind === 'kpi' ? c0(p) : 0);
        g += `<text x="${lx}" y="${p.y + 22}" ${font} font-size="12" font-weight="700" fill="${sec}" text-anchor="${right ? 'end' : 'start'}">${nm(p.role)}</text>`
          + `<text x="${right ? p.x + 12 : p.x + p.w - 12}" y="${p.y + 22}" font-family="Consolas, monospace" font-size="10" fill="${sec}" opacity=".75" text-anchor="${right ? 'start' : 'end'}">${((b) => `${b.w}×${b.h}`)(boxOf(p, c))}</text>`;   // the slot table's size (boxOf), for the layout drawn
      }
      s += `<g data-s="${i}">${g}<rect class="o" x="${p.x - 2}" y="${p.y - 2}" width="${p.w + 4}" height="${p.h + 4}" rx="${r + 2}" fill="none" stroke="#fdcb6e" stroke-width="3" opacity="0"/></g>`;
    });
    return s;
  };
  const bgSvg = (slots, opt) => E.bgSvg(state, slots, Object.assign({}, opt, { overlay: previewMarks }), isAr() ? 'ar' : 'en');

  // small wireframe for the layout buttons
  const thumb = (key) => {
    const c = Object.assign({}, lay(), { preset: key, kpis: LAYOUTS[key].kpis, filters: LAYOUTS[key].filters, kpiH: null, mainW: null, split: null }), u = state.ui;
    return `<svg viewBox="0 0 ${PW} ${PH}"><rect width="${PW}" height="${PH}" fill="${u.background}"/>${c.header ? `<rect width="${PW}" height="${sizes(c).hh}" fill="${mix(u.card, u.background, 0.25)}"/>` : ''}`
      + computeSlots(c).filter((s) => s.kind !== 'title' && s.kind !== 'logo').map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="18" fill="${s.kind === 'kpi' ? u.accent : u.card}" opacity="${s.kind === 'kpi' ? 0.55 : 1}"/>`).join('') + '</svg>';
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
  const colorSeg = (key, cur) => { const u = state.ui;
    return seg(key, [['accent', dot(u.accent) + L('Accent', 'التمييز')], ['good', dot(u.good) + L('Good', 'جيد')], ['neutral', dot(u.neutral) + L('Neutral', 'محايد')], ['data', `<span class="tg-dots">${state.data.slice(0, 3).map(dot).join('')}</span>` + L('Data colors', 'ألوان البيانات')]], cur || 'accent'); };
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
  function renderLayoutPreview() {
    const c = lay(), slots = computeSlots(c), pg = page(c), T = (v) => toPage(v, c), [pw, ph] = pngSize(c);
    $('layCanvas').innerHTML = bgSvg(slots, { preview: true });
    const H = isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height'];
    $('slotTable').innerHTML = `<table><thead><tr>${H.map((h, i) => `<th${i > 1 ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${slots.map((s, i) => `<tr data-i="${i}"><td>${nm(s.role)}</td><td>${nm(KINDS[s.kind])}</td>${((b) => [b.x, b.y, b.w, b.h].map((n) => `<td class="n">${n}</td>`).join(''))(boxOf(s, c))}</tr>`).join('')}</tbody></table>`;
    updateStatus();
    const note = $('layUnits'); if (note) note.innerHTML = L(`Numbers are for a Power BI page of <b>${pg.w} × ${pg.h}</b> (Format page › Canvas settings). The PNG is ${pw} × ${ph} pixels for a sharp background; with Image fit <b>Stretch</b> it lines up exactly.`, `الأرقام لصفحة Power BI بمقاس <b><bdi dir="ltr">${pg.w} × ${pg.h}</bdi></b> (<bdi dir="ltr">Format page › Canvas settings</bdi>). الصورة PNG بمقاس <bdi dir="ltr">${pw} × ${ph}</bdi> بكسل لتكون حادة، ومع <bdi dir="ltr">Image fit: Stretch</bdi> تنطبق تمامًا.`);
  }
  function renderLayout() {
    const c = lay(); applyPage(c); renderJson(); // the theme's corner radius follows the page size and corners
    // page size first: it is set once in Power BI and every number below depends on it
    $('pageSize').innerHTML = `<span class="tg-label">${L('Power BI page size', 'مقاس صفحة Power BI')}</span>
      <div>${seg('page', [['1920x1080', `1920 × 1080<small>${L('16:9 · Power BI default', '16:9 · افتراضي Power BI')}</small>`], ['1280x720', `1280 × 720<small>${L('16:9 · older reports', '16:9 · تقارير أقدم')}</small>`], ['960x720', `960 × 720<small>4:3</small>`], ['custom', `${L('Custom', 'مخصص')}<small>${L('any size', 'أي مقاس')}</small>`]], c.page === 'custom' || PAGES[c.page] ? c.page : '1920x1080')}
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
    renderLayoutPreview(); renderVis(); fontNote();
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
    if (['kpiBar', 'kpiBarC', 'headLine', 'headLineC'].includes(k)) track('theme_accent', { option: k, value: v });
    layoutChanged(); renderLayout(); save();
  });
  // sliders redraw the preview while dragging, without rebuilding the controls
  step2.addEventListener('input', (e) => {
    const el = e.target.closest('input[type="range"][data-l]'); if (!el) return;
    lay()[el.dataset.l] = clampTo(el.dataset.l, el.value / (+el.dataset.f || 1));
    const o = $('layControls').querySelector(`[data-out="${el.dataset.l}"]`); if (o) o.textContent = el.value + el.dataset.u;
    // the exact radius slider keeps the Square/Soft/Round buttons in step
    if (el.dataset.l === 'radius') $('layControls').querySelectorAll('button[data-l="radius"]').forEach((b) => { const on = +b.dataset.v === lay().radius; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
    if (el.dataset.l === 'radius') renderJson();
    layoutChanged(); renderLayoutPreview(); save();
  });
  step2.addEventListener('change', (e) => {
    const num = e.target.closest('input[type="number"][data-l]');
    if (num) {
      const c = lay(), k = num.dataset.l, isW = k === 'pageW', lim = isW ? LIM.w : LIM.h;
      if (num.value === '' || !isFinite(+num.value)) { pageMsg = L('Enter a whole number.', 'أدخل رقمًا صحيحًا.'); renderLayout(); return; }
      const v = Math.round(+num.value), kept = within(v, lim);
      pageMsg = kept !== v ? (isW ? L(`Width set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط العرض على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`) : L(`Height set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط الارتفاع على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`)) : '';
      c[k] = kept; const [w, h] = fitCustom(c.pageW, c.pageH); track('theme_page_size', { size: w + 'x' + h });
      layoutChanged(); renderLayout(); save(); return;
    }
    const el = e.target.closest('input[type="checkbox"][data-l]'); if (!el) return;
    lay()[el.dataset.l] = el.checked;
    layoutChanged(); renderLayout(); save();
  });
  // remember whether Advanced options is open when the controls are rebuilt (toggle does not bubble)
  $('layControls').addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('tg-adv')) advOpen = e.target.open; }, true);
  // hovering a row outlines its panel on the preview
  const hl = (i) => { $('layCanvas').querySelectorAll('[data-s] .o').forEach((o) => o.setAttribute('opacity', o.parentNode.dataset.s === i ? '1' : '0')); };
  $('slotTable').addEventListener('mouseover', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) hl(tr.dataset.i); });
  $('slotTable').addEventListener('mouseleave', () => hl(null));

  // every download is named after the theme: letters of any script are kept (Arabic, café), other symbols dropped
  const fileBase = () => E.fileBase(state.name);
  const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const slotRows = () => computeSlots(lay()).map((s) => { const b = boxOf(s); return [nm(s.role), nm(KINDS[s.kind]), b.x, b.y, b.w, b.h]; });
  const slotHead = () => (isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height']);
  $('slotCopy').addEventListener('click', () => {
    const text = [slotHead()].concat(slotRows()).map((r) => r.join('\t')).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Table copied. Paste it into Excel or Notes', 'تم نسخ الجدول. الصقه في Excel أو الملاحظات')), () => toast(L('Copy failed. Use Download .csv', 'تعذّر النسخ. استخدم تنزيل .csv')));
    lastCsv = csvKey(); updateStatus();
    track('theme_layout_slots', { method: 'copy', layout: lay().preset });
  });
  const downloadCsv = () => {
    const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const credit = [[], [L('Made with the DataArcus Power BI Theme & Layout Generator: dataarcus.com/tools/power-bi-theme-generator.html', 'صُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: dataarcus.com/tools/power-bi-theme-generator.html')]];   // a credit line after the table
    const csv = '﻿' + [slotHead()].concat(slotRows(), credit).map((r) => r.map(q).join(',')).join('\r\n');
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileBase()}-layout-${lay().preset}.csv`);
    lastCsv = csvKey(); updateStatus();
    toast(L('Table downloaded. Open it next to Power BI', 'تم تنزيل الجدول. افتحه بجانب Power BI'));
    track('theme_layout_slots', { method: 'csv', layout: lay().preset });
  };
  $('slotCsv').addEventListener('click', downloadCsv);
  // PNG text metadata (tEXt chunks after the header) credit DataArcus without touching a single pixel
  const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (u) => { let c = 0xffffffff; for (const x of u) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const textChunk = (key, value) => {
    const data = new TextEncoder().encode(`${key}\0${value}`.replace(/[^\x00-\xff]/g, '')), out = new Uint8Array(12 + data.length), v = new DataView(out.buffer);
    v.setUint32(0, data.length); out.set([116, 69, 88, 116], 4); out.set(data, 8); v.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const withCredits = (blob) => blob.arrayBuffer().then((buf) => {
    const png = new Uint8Array(buf), head = 33;   // 8-byte signature + 25-byte IHDR chunk
    const chunks = [textChunk('Software', 'DataArcus Power BI Theme & Layout Generator'), textChunk('Source', 'https://dataarcus.com/tools/power-bi-theme-generator.html')];
    return new Blob([png.subarray(0, head), ...chunks, png.subarray(head)], { type: 'image/png' });
  }).catch(() => blob);
  // the background as a PNG blob (with the credit metadata); used by the PNG download and the Power BI project
  const pngBlob = (c) => new Promise((resolve, reject) => {
    const was = state.layout; if (c) state.layout = c;
    const [pw, ph] = pngSize(), svg = bgSvg(computeSlots(lay()), { w: pngSize()[0], h: pngSize()[1] });
    state.layout = was; if (c) applyPage(was);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = pw; cv.height = ph;
      cv.getContext('2d').drawImage(img, 0, 0, pw, ph);
      cv.toBlob((b) => (b ? withCredits(b).then(resolve) : reject(new Error('png'))), 'image/png');
    };
    img.onerror = () => reject(new Error('png'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const downloadPng = () => {
    const key = pngKey();
    pngBlob().then((png) => {
      lastPng = key; updateStatus();
      saveBlob(png, `${fileBase()}-background-${lay().preset}.png`);
      toast(L('Background downloaded. Set it in Format page › Canvas background', 'تم تنزيل الخلفية. ضعها من Format page › Canvas background'));
    }, () => toast(L('Could not create the image in this browser', 'تعذّر إنشاء الصورة في هذا المتصفح')));
    track('theme_layout_png', { layout: lay().preset, direction: rtl() ? 'rtl' : 'ltr', kpis: lay().kpis });
  };
  $('pngBtn').addEventListener('click', downloadPng);

  // ---------- Power BI project (.pbip): theme, background and every visual in one download ----------
  // Only on pages that have the project card (the lab page for now). The builder loads on first use.
  const pbipBtn = $('pbipBtn');
  let pbipSync = null;   // set below on pages with the project card: keeps the field picker in step with the layout
  if (pbipBtn) {
    let logo = null;
    const loadBuilder = () => (window.DAPbip ? Promise.resolve(window.DAPbip) : new Promise((resolve, reject) => {
      const sc = document.createElement('script'); sc.src = '../assets/js/pbip-export.min.js?v=20261004a'; sc.onload = () => resolve(window.DAPbip); sc.onerror = reject; document.head.appendChild(sc);
    }));
    // ---- your own model: a local project (the report points at its .SemanticModel folder) or a published one ----
    // Each choice keeps its own model and the fields picked for it, so switching between them never pairs one
    // model's fields with the other's location: own.local / own.service = { tables, msg, bad, folder, dir, reports, choices }
    const dataIn = $('pbipData'), own = { local: null, service: null, getBind: null };
    const loadBind = () => (window.DABind ? Promise.resolve(window.DABind) : new Promise((resolve, reject) => {
      const sc = document.createElement('script'); sc.src = '../assets/js/pbip-bind.min.js?v=20261004a'; sc.onload = () => resolve(window.DABind); sc.onerror = reject; document.head.appendChild(sc);
    }));
    const ownMsg = (text, bad) => { const m = $('pbipOwnMsg'); if (m) { m.textContent = text; m.style.color = bad ? '#fca5a5' : ''; } };
    const mode = () => (dataIn ? dataIn.value : 'sample');
    // KPI cards on the pages this download makes: the main layout and the second page (3 or 4)
    const kpiSlots = () => Math.max(lay().kpis || 0, $('pbipPages') && $('pbipPages').checked ? 4 : 0, 1);
    // the picker for the model of the current choice, one KPI row per card; the visitor's picks are kept
    const showPicker = (DB) => {
      if (own.getBind) own.getBind();   // remember the picks shown so far
      own.getBind = null; const map = $('pbipMap'); if (map) map.innerHTML = '';
      const e = own[mode()];
      if (!e || !map) { ownMsg(''); return; }
      ownMsg(e.msg, e.bad);
      if (!e.tables.length) return;
      const n = kpiSlots(), fresh = DB.suggest(e.tables, n);
      let bind = fresh;
      if (e.choices) {
        const id = (k) => (k ? k.t + '\u0000' + k.m : ''), kpis = e.choices.kpis.slice(0, n);
        fresh.choices.kpis.forEach((k) => { if (k && kpis.length < n && !kpis.some((x) => id(x) === id(k))) kpis.push(k); });
        while (kpis.length < n) kpis.push(null);
        bind = DB.build(Object.assign({}, e.choices, { kpis }));
      }
      e.kpiN = n;
      const get = DB.renderPicker(map, e.tables, bind, L);
      own.getBind = () => { const b = get(); e.choices = b.choices; return b; };
    };
    // the number of KPI cards changed (layout, second page): the picker follows
    pbipSync = () => { const e = own[mode()]; if (e && window.DABind && e.kpiN !== kpiSlots()) showPicker(window.DABind); };
    const showOwn = () => {
      const m = mode(), box = $('pbipOwn'); if (!box) return;
      box.hidden = m !== 'local' && m !== 'service';
      box.querySelectorAll('[data-own]').forEach((d) => { d.hidden = d.dataset.own !== m; });
      if (!box.hidden) loadBind().then(showPicker).catch(() => {});
    };
    const loaded = (m, res, where0) => loadBind().then((DB) => {
      const where = DB.iso(where0);
      const ms = res.tables.reduce((a, t) => a + t.measures.filter((x) => !x.isHidden).length, 0);
      own[m] = Object.assign({}, res, !res.tables.length ? { msg: L('No tables found in this model.', 'لم يتم العثور على جداول في هذا النموذج.'), bad: true }
        : { msg: L(`${where}: ${res.tables.length} tables, ${ms} measures. Each visual below has a suggested field; change any of them.`,
          `${where}: ${res.tables.length} جدول، ${ms} مقياس. لكل عنصر أدناه حقل مقترح، ويمكنك تغيير أي منها.`)
          + (!ms ? L(' This model has no measures, so KPI cards and charts stay empty until you add some.', ' لا توجد مقاييس في هذا النموذج، لذا تبقى البطاقات والمخططات فارغة حتى تضيفها.') : '') });
      if (mode() === m) { own.getBind = null; showPicker(DB); }   // a new model starts from the suggestions
      if (res.tables.length) track('theme_pbip_model', { mode: m, tables: res.tables.length, measures: ms });
    });
    const failed = (m, e) => {
      const code = e && e.message;
      own[m] = { tables: [], bad: true, msg: code === 'NO_SEMANTIC_MODEL' ? L('No .SemanticModel folder here. Choose the folder you saved the Power BI project in.', 'لا يوجد مجلد .SemanticModel هنا. اختر المجلد الذي حفظت فيه مشروع Power BI.')
        : code === 'PBIX' ? L('A .pbix keeps its model in a format only Power BI reads. Use File › Export › Power BI template (.pbit).', 'ملف .pbix يحفظ النموذج بصيغة لا يقرؤها إلا Power BI. استخدم File › Export › Power BI template (.pbit).')
          : code === 'TMDL_ONLY' ? L('This file has the model as TMDL. Choose the project folder instead, on the other option.', 'هذا الملف يحفظ النموذج بصيغة TMDL. اختر مجلد المشروع بدلًا منه.')
            : L('Could not read the model in this file.', 'تعذّرت قراءة النموذج في هذا الملف.') };
      if (mode() === m) { own.getBind = null; loadBind().then(showPicker).catch(() => ownMsg(own[m].msg, true)); }
    };
    if (dataIn) {
      dataIn.addEventListener('change', showOwn); showOwn();
      if ($('pbipPages')) $('pbipPages').addEventListener('change', () => pbipSync());
      $('pbipFolder').addEventListener('change', (e) => {
        const files = e.target.files; if (!files || !files.length) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        // with more than one model in the folder, say which one (by its path) the report will use
        loadBind().then((DB) => DB.fromFolder(files)).then((res) => loaded('local', Object.assign(res, { dir: res.path.replace(/\/?[^/]*$/, '') }),
          res.others ? res.path + L(` (${res.others + 1} models in this folder; this one is used)`, ` (عدد النماذج في المجلد: ${res.others + 1}، ويُستخدم هذا النموذج)`) : res.folder))
          .catch((err) => failed('local', err));
      });
      $('pbipModelFile').addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        loadBind().then((DB) => DB.fromFile(f, '../assets/js/model-health-worker.min.js?v=20261003a')).then((res) => loaded('service', res, f.name)).catch((err) => failed('service', err));
      });
    }
    const logoIn = $('pbipLogo');
    if (logoIn) logoIn.addEventListener('change', () => {
      const f = logoIn.files && logoIn.files[0]; logo = null;
      const out = $('pbipLogoName');
      if (!f) { if (out) out.textContent = ''; return; }
      const ext = /png$/i.test(f.type) ? 'png' : /jpe?g$/i.test(f.type) ? 'jpg' : null;
      if (!ext || f.size > 2 * 1024 * 1024) { logoIn.value = ''; if (out) out.textContent = ''; toast(L('Use a PNG or JPG logo under 2 MB', 'استخدم شعارًا بصيغة PNG أو JPG أقل من 2 ميجابايت')); return; }
      // the logo's own size, so its box in the header takes its shape; a tall logo gets a hint (it will be thin there)
      f.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf), size = E.imageSize(bytes);
        logo = { bytes, ext, ratio: size ? size.w / size.h : undefined };
        if (out) out.textContent = f.name + (size && size.h > size.w ? '. ' + L('This logo is tall; a horizontal version will read much better in the header.', 'هذا الشعار طولي؛ نسخة أفقية منه ستكون أوضح بكثير في الشريط العلوي.') : '');
      });
    });
    pbipBtn.addEventListener('click', () => {
      const c = lay(), p = page(c), m = mode(), sample = m === 'sample';
      // your own model: where it is, and the fields picked for each visual
      let model = null;
      if (m === 'local') {
        if (!own.local || !own.local.folder) { toast(L('Choose your Power BI project folder first', 'اختر مجلد مشروع Power BI أولًا')); return; }
        model = { byPath: own.local.folder, taken: own.local.reports };
      } else if (m === 'service') {
        const ws = $('pbipWs').value.trim(), mn = $('pbipModelName').value.trim();
        if (!ws || !mn) { toast(L('Type the workspace and the semantic model names', 'اكتب اسم مساحة العمل واسم النموذج الدلالي')); return; }
        model = { ws, mn };   // the connection string is written once the helper has loaded, below
      }
      // the picker always shows the model of the current choice (see showPicker)
      const bind = model && own[m] && own.getBind ? own.getBind() : null;
      pbipBtn.disabled = true;
      // visuals sit on the panels of the background image, so the project's theme always has transparent visuals
      const was = c.transparent; c.transparent = true; const theme = buildTheme(); c.transparent = was;
      // the pages (design engine): this layout, a second page in a complementary layout when asked, and filters as a
      // slide-in panel when asked; each page's background is drawn for its own layout
      const specs = E.projectPages(c, isAr() ? 'ar' : 'en', { second: !!($('pbipPages') && $('pbipPages').checked), panel: !!($('pbipPanel') && $('pbipPanel').checked), logoRatio: logo ? logo.ratio : undefined });
      Promise.all([loadBuilder(), model ? loadBind() : null].concat(specs.map((sp) => pngBlob(sp.layout).then((b) => b.arrayBuffer())))).then(([P, DB, ...bufs]) => {
        if (model && model.ws) model = { byConnection: DB.connection(model.ws, model.mn) };
        // kpiInset: where the KPI titles start beside the side accent bar drawn in this page's background
        const pages = specs.map((sp, i) => ({ name: sp.name, page: sp.page, slots: sp.slots, png: new Uint8Array(bufs[i]), panel: sp.panel, kpiInset: E.kpiInset(sp.layout) }));
        const r = P.build({
          name: state.name || 'Power BI Report', title: state.name || L('Sales overview', 'نظرة عامة على المبيعات'), pageName: nm(LAYOUTS[c.preset].name),
          lang: isAr() ? 'ar' : 'en', rtl: rtl(), font: state.font, ui: state.ui, pages, theme, logo, sample, model, bind,
          // the report's labels come from the design engine (the MCP uses the same); the readme stays here
          texts: Object.assign({}, E.REPORT_TEXTS[isAr() ? 'ar' : 'en'], {
            readme: m === 'service' ? L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop and sign in. The report connects live to your published semantic model.\n3. Check each visual, then publish the report to the same workspace.\n\n## Check it in Power BI (2 minutes)\n1. On every page, each visual sits on its panel in the background and shows data.\n2. If the colours look off: **View > Themes > Browse for themes** and pick the theme file in **{name}.Report/StaticResources/RegisteredResources**.\n3. Hover any chart: the tooltip page shows.\n4. Ctrl+click the page buttons and **Reset filters** (and the **Filters** button if you chose the slide-in panel).\n5. **View > Mobile layout**: the phone version is already laid out.\n\nSomething looks wrong? Send a screenshot to hello@dataarcus.com.\n',
              '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop وسجّل الدخول. يتصل التقرير مباشرة بنموذجك الدلالي المنشور.\n3. راجع كل عنصر، ثم انشر التقرير في نفس مساحة العمل.\n\n## راجعه في Power BI (دقيقتان)\n1. في كل صفحة، كل عنصر في مكانه على لوحته في الخلفية ويعرض بيانات.\n2. إذا بدت الألوان غير صحيحة: **View > Themes > Browse for themes** واختر ملف السمة في **{name}.Report/StaticResources/RegisteredResources**.\n3. مرّر الماوس على أي مخطط: تظهر صفحة التلميح.\n4. اضغط Ctrl مع النقر على أزرار الصفحات و **Reset filters** (وزر **Filters** إذا اخترت اللوحة المنزلقة).\n5. **View > Mobile layout**: نسخة الهاتف جاهزة.\n\nهل يبدو شيء غير صحيح؟ أرسل لقطة شاشة إلى hello@dataarcus.com.\n') : L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop.\n3. If you chose sample data, click **Refresh** once so it loads.\n\n## Use your own data\nGet data, then drag your fields into each visual. The theme, background, positions, tooltip page and filter pane styling are already set.\n\nOlder Power BI Desktop versions: turn on **File > Options > Preview features > Power BI Project (.pbip) save option** and **Store reports using enhanced metadata format (PBIR)**.\n\n## Check it in Power BI (2 minutes)\n1. On every page, each visual sits on its panel in the background and shows data.\n2. If the colours look off: **View > Themes > Browse for themes** and pick the theme file in **{name}.Report/StaticResources/RegisteredResources**.\n3. Hover any chart: the tooltip page shows.\n4. Ctrl+click the page buttons and **Reset filters** (and the **Filters** button if you chose the slide-in panel).\n5. **View > Mobile layout**: the phone version is already laid out.\n\nSomething looks wrong? Send a screenshot to hello@dataarcus.com.\n',
              '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop.\n3. إذا اخترت البيانات التجريبية، اضغط **Refresh** مرة واحدة لتظهر.\n\n## استخدم بياناتك\nاضغط Get data ثم اسحب حقولك إلى كل عنصر. السمة والخلفية والمواضع وصفحة التلميح وتنسيق لوحة الفلاتر جاهزة.\n\nفي إصدارات Power BI Desktop الأقدم: فعّل **File > Options > Preview features > Power BI Project (.pbip) save option** و **Store reports using enhanced metadata format (PBIR)**.\n\n## راجعه في Power BI (دقيقتان)\n1. في كل صفحة، كل عنصر في مكانه على لوحته في الخلفية ويعرض بيانات.\n2. إذا بدت الألوان غير صحيحة: **View > Themes > Browse for themes** واختر ملف السمة في **{name}.Report/StaticResources/RegisteredResources**.\n3. مرّر الماوس على أي مخطط: تظهر صفحة التلميح.\n4. اضغط Ctrl مع النقر على أزرار الصفحات و **Reset filters** (وزر **Filters** إذا اخترت اللوحة المنزلقة).\n5. **View > Mobile layout**: نسخة الهاتف جاهزة.\n\nهل يبدو شيء غير صحيح؟ أرسل لقطة شاشة إلى hello@dataarcus.com.\n')
          })
        });
        saveBlob(new Blob([r.zip()], { type: 'application/zip' }), `${fileBase()}-power-bi-${m === 'local' || m === 'service' ? 'report' : 'project'}.zip`);
        if (m === 'local') {
          const e = own.local, at = e.dir ? ` (${e.dir})` : '';
          const msg = L(`Unzip it into the folder that holds ${e.folder}${at}, then open ${r.base}.pbip`, `فك الضغط داخل المجلد الذي فيه ${e.folder}${at}، ثم افتح ${r.base}.pbip`);
          toast(msg); ownMsg(msg);
        } else toast(L('Project downloaded. Unzip it and open the .pbip file', 'تم تنزيل المشروع. فك الضغط وافتح ملف .pbip'));
        track('theme_pbip', { layout: c.preset, direction: rtl() ? 'rtl' : 'ltr', kpis: c.kpis, sample, data: m, bound: !!bind, logo: !!logo, page: c.page, pages: pages.length, panel: pages.some((pp) => pp.panel) });
      }).catch(() => toast(L('Could not build the project in this browser', 'تعذّر إنشاء المشروع في هذا المتصفح'))).then(() => { pbipBtn.disabled = false; });
    });
  }

  // ---------- step 3: visual backgrounds, and a reminder when a downloaded file is out of date ----------
  // each file keeps a fingerprint of what was downloaded; a different fingerprint now means it is out of date
  let lastJson = null, lastPng = null, lastCsv = null;
  function pngKey() { return bgSvg(computeSlots(lay()), {}); }
  function csvKey() { return JSON.stringify(computeSlots(lay()).map((s) => [s.kind, boxOf(s)])); }
  // Visual backgrounds follow what the visitor uses (owner 2026-10-04): Solid for a colour-only visitor, Transparent
  // from the first change in the Layout step (they are making a background), unless they picked one themselves
  let autoSwitched = false;
  function layoutChanged() {
    const c = lay(); if (c.transparent || c.visPicked) return;
    c.transparent = true; autoSwitched = true; renderVis(); renderJson();
    toast(L('Visual backgrounds set to Transparent, to sit on the background image', 'أصبحت خلفيات العناصر شفافة، لتجلس على صورة الخلفية'));
  }
  function renderVis() {
    const t = !!lay().transparent;
    $('dlVis').innerHTML = `<span class="tg-label">${L('Visual backgrounds in the theme', 'خلفيات العناصر في السمة')}</span>${seg('transparent', [[1, L('Transparent (use with the background)', 'شفافة (مع الخلفية)')], [0, L('Solid (theme only)', 'مصمتة (السمة فقط)')]], t ? 1 : 0)}
      ${t && autoSwitched ? `<small class="d-block mt-1 tg-warn" data-auto>${L('Switched to Transparent because you changed the layout. Choose Solid if you only use the theme.', 'تحوّلت إلى شفافة لأنك غيّرت التخطيط. اختر مصمتة إن كنت تستخدم السمة فقط.')}</small>` : ''}
      <small class="d-block mt-1 text-white-50">${t ? L('Visuals have no fill, so each one sits on its panel in the background image.', 'العناصر بلا تعبئة، فيجلس كل عنصر على لوحته في صورة الخلفية.') : L('Each visual gets its own card color. Choose this if you only use the theme, without the background image.', 'يأخذ كل عنصر لون بطاقة خاصًا به. اختره إذا كنت تستخدم السمة فقط دون صورة الخلفية.')}</small>`;
  }
  $('dlVis').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-l="transparent"]'); if (!b) return;
    lay().transparent = b.dataset.v === '1'; lay().visPicked = true; autoSwitched = false; renderVis(); renderJson(); save();
    track('theme_visuals', { transparent: lay().transparent });
  });
  function updateStatus() {
    if (!$('dlStatus')) return;
    const files = [
      ['json', L('Theme', 'السمة'), lastJson !== null && lastJson !== JSON.stringify(buildTheme(), null, 2)],
      ['png', L('Background', 'الخلفية'), lastPng !== null && lastPng !== pngKey()],
      ['csv', L('Layout table', 'جدول التخطيط'), lastCsv !== null && lastCsv !== csvKey()]];
    const old = files.filter((f) => f[2]), solid = lastPng !== null && !lay().transparent;
    const note = (text, act, btn) => `<div class="tg-note"><i class="bi bi-exclamation-circle" aria-hidden="true"></i><span>${text}</span><button type="button" data-dl="${act}">${btn}</button></div>`;
    let h = '';
    if (old.length) h += note(L(`Changed since you downloaded: <b>${old.map((f) => f[1]).join(', ')}</b>.`, `تغيّر منذ التنزيل: <b>${old.map((f) => f[1]).join('، ')}</b>.`), 'stale', old.length > 1 ? L('Download these again', 'نزّلها من جديد') : L('Download again', 'نزّل من جديد'));
    if (solid) h += note(L('Your theme has solid visual backgrounds, so visuals will cover the panels in the background image.', 'سمتك بخلفيات عناصر مصمتة، فستغطي العناصر اللوحات في صورة الخلفية.'), 'transparent', L('Switch to transparent', 'حوّلها إلى شفافة'));
    $('dlStatus').innerHTML = h;
    files.forEach((f) => { const card = document.querySelector(`.tg-file[data-file="${f[0]}"]`); if (card) card.classList.toggle('stale', f[2]); });
    const s3 = document.querySelector('.tg-steps [data-step="download"]'); if (s3) s3.classList.toggle('stale', old.length > 0 || solid);
    if (pbipSync) pbipSync();
  }
  const DL = { json: () => downloadJson('reminder'), png: downloadPng, csv: downloadCsv };
  document.querySelector('main.tg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dl]'); if (!b) return;
    const a = b.dataset.dl;
    // several files one after another, so the browser does not merge or block them
    if (a === 'stale') [['json', lastJson !== null && lastJson !== JSON.stringify(buildTheme(), null, 2)], ['png', lastPng !== null && lastPng !== pngKey()], ['csv', lastCsv !== null && lastCsv !== csvKey()]]
      .filter((f) => f[1]).forEach((f, i) => setTimeout(DL[f[0]], i * 400));
    else if (a === 'transparent') { lay().transparent = true; lay().visPicked = true; renderVis(); renderJson(); save(); toast(L('Visuals are transparent. Download the theme again', 'أصبحت العناصر شفافة. نزّل السمة من جديد')); }
  });

  // ---------- steps bar: pinned under the navbar, highlights the step in view ----------
  const steps = $('tgSteps');
  if (steps) {
    const ids = ['colors', 'layout', 'download'];
    let tick = 0;
    const mark = () => {
      tick = 0;
      const line = steps.getBoundingClientRect().bottom + 40;
      let cur = ids[0];
      ids.forEach((id) => { const el = $(id); if (el && el.getBoundingClientRect().top <= line) cur = id; });
      // at the very bottom of the page the last step is the one in view
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = 'download';
      steps.querySelectorAll('a').forEach((a) => { const on = a.dataset.step === cur; a.classList.toggle('active', on); if (on) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    };
    mark();
    addEventListener('resize', mark);
    addEventListener('scroll', () => { if (!tick) tick = requestAnimationFrame(mark); }, { passive: true });
    const label = () => steps.setAttribute('aria-label', L('Steps', 'الخطوات'));
    label(); new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  // ---------- foldable steps: each section folds on its own; a folded one shows a one-line summary ----------
  // All open on a first visit; what the visitor folds is remembered. Anything that points at a section
  // (the steps bar, "See an example", a #download link) unfolds it first, so nobody lands on a closed step.
  const FOLD = STORE + '-folded', FOLDS = ['colors', 'layout', 'download'];
  let folded = [];
  try { folded = JSON.parse(localStorage.getItem(FOLD) || '[]').filter((id) => FOLDS.includes(id)); } catch (e) { folded = []; }
  const foldSum = (id) => {
    const c = lay(), p = page(c);
    if (id === 'colors') return (state.preset ? (isAr() ? PRESET_AR[state.preset] || state.preset : state.preset) : L('Your colors', 'ألوانك')) + ' · ' + state.font + ' · ' + (state.name || '');
    if (id === 'layout') return nm(LAYOUTS[c.preset].name) + ' · ' + p.w + ' × ' + p.h + ' · ' + L(`${c.kpis} KPI cards`, `${c.kpis} بطاقات مؤشرات`);
    return L('Theme, background and layout table', 'السمة والخلفية وجدول المواضع');
  };
  const foldSums = () => FOLDS.forEach((id) => { const s2 = document.querySelector(`#${id} > .tg-fold-sum`); if (s2) s2.textContent = foldSum(id); });
  const setFold = (id, fold, restoring) => {
    const panel = $(id); if (!panel) return;
    panel.classList.toggle('tg-folded', fold);
    const b = panel.querySelector(':scope > .tg-fold');
    b.setAttribute('aria-expanded', String(!fold));
    b.setAttribute('aria-label', (fold ? L('Open', 'افتح') : L('Fold', 'اطوِ')) + ' ' + panel.querySelector('h2 .tg-step').textContent);
    if (!restoring) {
      folded = FOLDS.filter((f) => $(f) && $(f).classList.contains('tg-folded'));
      try { localStorage.setItem(FOLD, JSON.stringify(folded)); } catch (e) { /* private mode */ }
    }
    if (fold) foldSums();
  };
  const openStep = (id) => { if ($(id) && $(id).classList.contains('tg-folded')) setFold(id, false); };
  FOLDS.forEach((id) => {
    const panel = $(id); if (!panel) return;
    const h2 = panel.querySelector(':scope > h2');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tg-fold'; b.setAttribute('aria-controls', id);
    b.innerHTML = '<i class="bi bi-chevron-up" aria-hidden="true"></i>';
    b.addEventListener('click', () => setFold(id, !panel.classList.contains('tg-folded')));
    h2.addEventListener('click', (e) => { if (!e.target.closest('a, button')) setFold(id, !panel.classList.contains('tg-folded')); });
    const sum = document.createElement('p'); sum.className = 'tg-fold-sum'; sum.setAttribute('aria-live', 'polite');
    h2.after(sum); panel.prepend(b);
    setFold(id, folded.includes(id), true);
  });
  window.__tgFoldSums = foldSums;
  // links to a section unfold it before the page scrolls there
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const t = document.getElementById(a.getAttribute('href').slice(1)); if (!t) return;
    const panel = FOLDS.map($).find((pnl) => pnl && pnl.contains(t)); if (panel) openStep(panel.id);
  }, true);
  // arriving with #layout or #download in the address, or the address changing to one, opens that step too
  const openHash = () => { const t = location.hash && document.getElementById(location.hash.slice(1)); const panel = t && FOLDS.map($).find((pnl) => pnl && pnl.contains(t)); if (panel) openStep(panel.id); };
  openHash(); addEventListener('hashchange', openHash);
  new MutationObserver(() => FOLDS.forEach((id) => { if ($(id)) setFold(id, $(id).classList.contains('tg-folded'), true); }))
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // "See an example": a complete executive sales design; the visitor's own design can be restored
  // the visitor's design is kept next to the saved one, so Undo still works after a reload
  const UNDO = STORE + '-before';
  let beforeExample = null;
  try { beforeExample = localStorage.getItem(UNDO); } catch (e) { /* private mode */ }
  if (beforeExample) $('exampleUndo').hidden = false;
  $('exampleBtn').addEventListener('click', () => {
    if (!beforeExample) { beforeExample = JSON.stringify(state); try { localStorage.setItem(UNDO, beforeExample); } catch (e) { /* private mode */ } }
    const p = PRESETS['Desert Gulf'];
    state = { preset: 'Desert Gulf', name: 'Executive Sales', font: 'Segoe UI', data: p.data.slice(), ui: { ...p.ui },
      layout: { preset: 'exec', kpis: 4, filters: true, fpos: 'top', dir: isAr() ? 'rtl' : 'ltr', v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', kpiBarC: 'data', headLine: 'full', samples: true, transparent: true, page: '1920x1080', hh: 64, logoW: 200 } };
    pageMsg = ''; renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = false;
    openStep('layout'); $('layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(L('Example loaded: an executive sales report', 'تم تحميل المثال: تقرير مبيعات تنفيذي'));
    track('theme_example', { example: 'executive-sales' });
  });
  const exCard = $('exampleCard'), exImg = $('exampleImg');
  if (exCard) exCard.addEventListener('click', () => $('exampleBtn').click());
  const exPic = () => { if (exImg) exImg.src = `../assets/img/tools/theme-example-${isAr() ? 'ar' : 'en'}.jpg`; };
  exPic(); new MutationObserver(exPic).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  $('exampleUndo').addEventListener('click', () => {
    if (!beforeExample) return;
    state = JSON.parse(beforeExample); beforeExample = null; pageMsg = '';
    try { localStorage.removeItem(UNDO); } catch (e) { /* private mode */ }
    renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = true;
    toast(L('Your design is back', 'عاد تصميمك'));
  });

  renderInputs(); renderAll();
  // Redraw script-generated text when the visitor switches language
  new MutationObserver(() => { renderPresets(); renderInputs(); renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
