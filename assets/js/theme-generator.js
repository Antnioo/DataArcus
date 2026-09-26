/*
 * DataArcus - Power BI Theme Generator
 * Builds a Power BI report theme JSON from brand colors, with a live preview,
 * a WCAG contrast check, copy and download. No libraries, no server.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const STORE = 'dataarcus-theme-generator';
  // Arabic/English for text drawn by this script (static page text uses data-i18n)
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  const PRESET_AR = { 'DataArcus': 'داتا أركوس', 'Corporate': 'رسمي', 'Colorblind safe': 'آمن لعمى الألوان', 'Desert Gulf': 'صحراء الخليج', 'Midnight': 'منتصف الليل', 'Earthy': 'ترابي' };

  const PRESETS = {
    'DataArcus': { data: ['#00d4ff', '#6c5ce7', '#00cec9', '#fd79a8', '#0084ff', '#a29bfe', '#fdcb6e', '#40f3ff'], ui: { background: '#0a0f1c', card: '#1a1f2e', text: '#f8fafc', accent: '#00d4ff', good: '#00b894', neutral: '#fdcb6e', bad: '#e17055' } },
    'Corporate': { data: ['#1f4e79', '#2e75b6', '#f4b183', '#c55a11', '#548235', '#9dc3e6', '#a9d18e', '#7f7f7f'], ui: { background: '#f3f5f8', card: '#ffffff', text: '#1f2933', accent: '#1f4e79', good: '#2e7d32', neutral: '#f9a825', bad: '#c62828' } },
    'Colorblind safe': { data: ['#0072b2', '#e69f00', '#009e73', '#cc79a7', '#56b4e9', '#d55e00', '#f0e442', '#000000'], ui: { background: '#f5f5f5', card: '#ffffff', text: '#222222', accent: '#0072b2', good: '#009e73', neutral: '#e69f00', bad: '#d55e00' } },
    'Desert Gulf': { data: ['#0f4c5c', '#c8963e', '#e36414', '#2a9d8f', '#5f0f40', '#fb8b24', '#9a031e', '#6c757d'], ui: { background: '#faf6ef', card: '#ffffff', text: '#2b2118', accent: '#0f4c5c', good: '#2a9d8f', neutral: '#c8963e', bad: '#9a031e' } },
    'Midnight': { data: ['#4cc9f0', '#f72585', '#ffd166', '#4361ee', '#b5179e', '#90e0ef', '#7209b7', '#06d6a0'], ui: { background: '#0b0d17', card: '#15182a', text: '#e8eaf6', accent: '#4cc9f0', good: '#06d6a0', neutral: '#ffd166', bad: '#ef476f' } },
    'Earthy': { data: ['#6b705c', '#cb997e', '#3f4238', '#e9c46a', '#8a5a44', '#a5a58d', '#264653', '#ddbea9'], ui: { background: '#f7f4ef', card: '#ffffff', text: '#2d2a26', accent: '#6b705c', good: '#588157', neutral: '#e9c46a', bad: '#bc4749' } }
  };
  const UI_LABELS_EN = { background: 'Page', card: 'Visual', text: 'Text', accent: 'Table accent', good: 'Good', neutral: 'Neutral', bad: 'Bad' };
  const UI_LABELS_AR = { background: 'الصفحة', card: 'العنصر المرئي', text: 'النص', accent: 'لون الجدول', good: 'جيد', neutral: 'محايد', bad: 'سيئ' };
  const uiLabel = (k) => (isAr() ? UI_LABELS_AR : UI_LABELS_EN)[k];
  const UI_LABELS = UI_LABELS_EN;

  // ---------- color math ----------
  const clampHex = (v) => { v = (v || '').trim(); if (!v.startsWith('#')) v = '#' + v; return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : null; };
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = (r) => '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const lum = (h) => { const c = hexToRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const hexToHsl = (h) => {
    let [r, g, b] = hexToRgb(h).map((v) => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let hh = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      hh = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh *= 60; }
    return [hh, s, l];
  };
  const hslToHex = (h, s, l) => {
    h = ((h % 360) + 360) % 360; const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
  };
  const generate = (base, mode) => {
    const [h, s0, l0] = hexToHsl(base); const s = Math.max(0.45, s0), l = Math.min(0.55, Math.max(0.4, l0));
    const plans = {
      analogous: [[0, 0], [30, 0.05], [-30, 0.05], [60, 0.12], [-60, 0.1], [0, 0.2], [30, -0.12], [-30, -0.12]],
      complementary: [[0, 0], [180, 0], [0, 0.18], [180, 0.18], [0, -0.14], [180, -0.14], [30, 0.1], [210, 0.1]],
      triadic: [[0, 0], [120, 0], [240, 0], [0, 0.18], [120, 0.18], [240, 0.18], [60, 0.05], [180, 0.05]],
      mono: [[0, -0.2], [0, -0.1], [0, 0], [0, 0.1], [0, 0.18], [0, 0.26], [0, 0.32], [0, 0.38]]
    };
    return plans[mode].map(([dh, dl]) => hslToHex(h + dh, s, Math.min(0.85, Math.max(0.15, l + dl))));
  };

  // ---------- state ----------
  let state;
  try { state = JSON.parse(localStorage.getItem(STORE)); } catch (e) { state = null; }
  if (!state || !Array.isArray(state.data) || state.data.length !== 8) state = { preset: 'DataArcus', name: 'My Brand Theme', font: 'Segoe UI', data: PRESETS.DataArcus.data.slice(), ui: { ...PRESETS.DataArcus.ui } };
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  // ---------- builders ----------
  const colorInput = (key, value, label) => `<div class="tg-color"><input type="color" value="${value}" data-key="${key}" aria-label="${label} color"><input type="text" value="${value}" data-key="${key}" maxlength="7" aria-label="${label} hex code" spellcheck="false"><span>${label}</span></div>`;
  const renderInputs = () => {
    $('dataColors').innerHTML = state.data.map((c, i) => colorInput('d' + i, c, L('Color ', 'اللون ') + (i + 1))).join('');
    $('uiColors').innerHTML = Object.keys(UI_LABELS).map((k) => colorInput('u_' + k, state.ui[k], uiLabel(k))).join('');
    $('themeName').value = state.name; $('font').value = state.font;
    document.querySelectorAll('.tg-preset').forEach((b) => b.classList.toggle('active', b.dataset.p === state.preset));
  };
  const setColor = (key, val) => { if (key[0] === 'd') state.data[+key.slice(1)] = val; else state.ui[key.slice(2)] = val; state.preset = null; };

  const buildTheme = () => {
    const u = state.ui, sec = mix(u.text, u.card, 0.35), ter = mix(u.text, u.card, 0.6), f = state.font;
    return {
      name: state.name || 'My Brand Theme',
      dataColors: state.data,
      foreground: u.text,
      foregroundNeutralSecondary: sec,
      foregroundNeutralTertiary: ter,
      background: u.card,
      backgroundLight: mix(u.card, u.background, 0.5),
      backgroundNeutral: mix(u.text, u.card, 0.8),
      tableAccent: u.accent,
      good: u.good, neutral: u.neutral, bad: u.bad,
      maximum: u.good, center: u.neutral, minimum: u.bad,
      hyperlink: state.data[0], visitedHyperlink: mix(state.data[0], u.text, 0.3),
      textClasses: {
        callout: { fontSize: 28, fontFace: f, color: u.text },
        title: { fontSize: 12, fontFace: f, color: u.text },
        header: { fontSize: 12, fontFace: f, color: u.text },
        label: { fontSize: 10, fontFace: f, color: sec }
      },
      visualStyles: {
        '*': { '*': {
          // with a layout background the panels are drawn in the image, so visuals go transparent
          background: state.layout && state.layout.transparent ? [{ show: false }] : [{ show: true, color: { solid: { color: u.card } }, transparency: 0 }],
          border: [{ show: false }]
        } },
        page: { '*': {
          background: [{ color: { solid: { color: u.background } }, transparency: 0 }],
          outspace: [{ color: { solid: { color: u.background } } }]
        } }
      }
    };
  };

  const renderPreview = () => {
    const u = state.ui, d = state.data, sec = mix(u.text, u.card, 0.35), grid = mix(u.text, u.card, 0.85);
    const card = (k, v, delta, good) => `<div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${sec}">${k}</div><div class="v">${v}</div><div class="d" style="color:${good ? u.good : u.bad}">${delta}</div></div>`;
    const months = isAr() ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const s1 = [42, 55, 48, 63, 70, 78], s2 = [30, 34, 41, 38, 49, 52], s3 = [18, 22, 20, 27, 25, 31];
    const bars = months.map((m, i) => [s1[i], s2[i], s3[i]].map((v, j) => { const x = 34 + i * 58 + j * 15, h = v * 1.6; return `<rect x="${x}" y="${150 - h}" width="13" height="${h}" rx="2" fill="${d[j]}"/>`; }).join('') + `<text x="${34 + i * 58 + 21}" y="166" font-size="10" text-anchor="middle" fill="${sec}">${m}</text>`).join('');
    const gridLines = [0, 40, 80, 120].map((v) => `<line x1="28" x2="380" y1="${150 - v}" y2="${150 - v}" stroke="${grid}" stroke-width="1"/><text x="22" y="${154 - v}" font-size="9" text-anchor="end" fill="${sec}">${v / 1.6 | 0}</text>`).join('');
    const pts = (arr, k) => arr.map((v, i) => `${40 + i * 62},${150 - v * k}`).join(' ');
    const donutVals = [40, 25, 20, 15]; let acc = 0; const R = 46, C = 2 * Math.PI * R;
    const donut = donutVals.map((v, i) => { const seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${d[i]}" stroke-width="20" stroke-dasharray="${C * v / 100} ${C}" stroke-dashoffset="${-C * acc / 100}" transform="rotate(-90 70 70)"/>`; acc += v; return seg; }).join('');
    $('preview').style.background = u.background;
    $('preview').style.fontFamily = `'${state.font}', 'Segoe UI', sans-serif`;
    $('preview').innerHTML = `
      <div class="tg-kpis">${card(L('Revenue', 'الإيرادات'), 'AED 1.24M', L('▲ 12.4% vs LM', '▲ 12.4% عن الشهر الماضي'), true)}${card(L('Orders', 'الطلبات'), '8,432', L('▲ 5.1% vs LM', '▲ 5.1% عن الشهر الماضي'), true)}${card(L('Return rate', 'نسبة المرتجعات'), '4.8%', L('▼ 0.6 pts', '▼ 0.6 نقطة'), false)}</div>
      <div class="tg-grid2">
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Sales by channel', 'المبيعات حسب القناة')}</div>
          <svg viewBox="0 0 390 172" role="img" aria-label="Clustered bar chart preview">${gridLines}${bars}</svg></div>
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Share by brand', 'الحصة حسب العلامة')}</div>
          <svg viewBox="0 0 140 140" style="max-width:170px;margin:6px auto 0" role="img" aria-label="Donut chart preview">${donut}<text x="70" y="75" font-size="16" font-weight="800" text-anchor="middle" fill="${u.text}">40%</text></svg></div>
      </div>
      <div class="tg-grid2" style="margin-top:10px">
        <div class="tg-card" style="background:${u.card};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Trend', 'الاتجاه')}</div>
          <svg viewBox="0 0 390 160" role="img" aria-label="Line chart preview">${gridLines}<polyline points="${pts(s1, 1.6)}" fill="none" stroke="${d[0]}" stroke-width="3" stroke-linejoin="round"/><polyline points="${pts(s2, 1.6)}" fill="none" stroke="${d[1]}" stroke-width="3" stroke-linejoin="round"/></svg></div>
        <div class="tg-card" style="background:${u.card};color:${u.text};overflow-x:auto"><table class="tg-table">
          <tr style="background:${u.accent}">${(isAr() ? ['العلامة', 'المبيعات', 'الحالة'] : ['Brand', 'Sales', 'Status']).map((h) => `<th style="color:${contrast(u.accent, '#ffffff') >= contrast(u.accent, '#111111') ? '#ffffff' : '#111111'}">${h}</th>`).join('')}</tr>
          ${[[L('North', 'الشمال'), '412K', 'good'], [L('South', 'الجنوب'), '288K', 'neutral'], [L('East', 'الشرق'), '176K', 'bad']].map((r, i) => `<tr style="background:${i % 2 ? mix(u.card, u.accent, 0.08) : u.card}"><td>${r[0]}</td><td>${r[1]}</td><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${u[r[2]]}"></span></td></tr>`).join('')}
        </table></div>
      </div>`;
  };

  const renderContrast = () => {
    const u = state.ui, sec = mix(u.text, u.card, 0.35);
    const checks = [
      [L('Text on visuals', 'النص على العناصر المرئية'), contrast(u.text, u.card), 4.5],
      [L('Labels on visuals', 'التسميات على العناصر المرئية'), contrast(sec, u.card), 4.5],
      [L('Text on page', 'النص على الصفحة'), contrast(u.text, u.background), 4.5],
      [L('Color 1 on visuals', 'اللون 1 على العناصر المرئية'), contrast(state.data[0], u.card), 3]
    ];
    const weak = state.data.map((c, i) => [i + 1, contrast(c, u.card)]).filter(([, r]) => r < 1.6).map(([i]) => i);
    $('contrast').innerHTML = checks.map(([k, r, min]) => `<div class="${r >= min ? 'ok' : 'warn'}"><i class="bi ${r >= min ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1"></i>${k}: ${r.toFixed(1)}:1 ${r >= min ? '' : L(`(aim for ${min}:1)`, `(المطلوب ${min}:1)`)}</div>`).join('')
      + (weak.length ? `<div class="warn"><i class="bi bi-exclamation-triangle me-1"></i>${L(`Color ${weak.join(', ')} almost disappears on the visual background.`, `اللون ${weak.join('، ')} يكاد يختفي على خلفية العنصر المرئي.`)}</div>` : '');
  };

  const renderJson = () => { $('json').textContent = JSON.stringify(buildTheme(), null, 2); };
  const renderAll = () => { renderPreview(); renderContrast(); renderJson(); renderLayout(); save(); };

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
    if (!val) return;
    setColor(el.dataset.key, val);
    const twin = el.parentElement.querySelector(el.type === 'color' ? 'input[type=text]' : 'input[type=color]'); twin.value = val;
    document.querySelectorAll('.tg-preset').forEach((b) => b.classList.remove('active'));
    renderAll();
  };
  ['dataColors', 'uiColors'].forEach((id) => { $(id).addEventListener('input', onColor); });
  $('genBtn').addEventListener('click', () => {
    state.data = generate($('brand').value, $('harmony').value); state.ui.accent = state.data[0]; state.preset = null;
    renderInputs(); renderAll(); track('theme_generate', { harmony: $('harmony').value });
  });
  $('themeName').addEventListener('input', (e) => { state.name = e.target.value.slice(0, 60); renderJson(); save(); });
  $('font').addEventListener('change', (e) => { state.font = e.target.value; renderAll(); });

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  $('copyBtn').addEventListener('click', () => {
    const text = JSON.stringify(buildTheme(), null, 2);
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('json')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Theme JSON copied', 'تم نسخ ملف السمة')), fallback); else fallback();
    track('theme_copy', { preset: state.preset || 'custom' });
  });
  $('dlBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(buildTheme(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (state.name || 'power-bi-theme').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(L('Downloaded. Import it via View → Themes', 'تم التنزيل. استورده من View → Themes'));
    track('theme_download', { preset: state.preset || 'custom', font: state.font });
  });

  // ---------- page layout: a full background with a place for every visual ----------
  // Power BI's default page is 1280 × 720, so every slot is in those units and can be typed straight
  // into Format › General › Properties. The PNG is drawn at 1.5× (1920 × 1080) so it stays sharp.
  const PW = 1280, PH = 720, M = 16, G = 12, HH = 56;
  const KINDS = { kpi: ['Card', 'بطاقة'], line: ['Line chart', 'مخطط خطي'], bar: ['Bar chart', 'مخطط شريطي'], column: ['Column chart', 'مخطط أعمدة'], donut: ['Donut chart', 'مخطط دائري'], table: ['Table or matrix', 'جدول أو مصفوفة'], text: ['Text box or narrative', 'مربع نص أو سرد'], slicer: ['Slicers', 'مقسمات (Slicers)'], title: ['Text box (page title)', 'مربع نص (عنوان الصفحة)'], logo: ['Image (logo)', 'صورة (الشعار)'] };
  const LAYOUTS = {
    exec: { name: ['Executive summary', 'ملخص تنفيذي'], kpis: 4, kpiH: 96, filters: false, flex: [1.3, 1],
      rows: [[[2, 'line', ['Main trend', 'الاتجاه الرئيسي']], [1, 'bar', ['Breakdown', 'التوزيع']]], [[1, 'column', ['Comparison', 'المقارنة']], [1, 'table', ['Detail', 'التفاصيل']]]],
      why: [['Key numbers first, where the eye starts', 'الأرقام الأهم أولًا حيث تبدأ العين'], ['One screen, no scrolling', 'شاشة واحدة بدون تمرير'], ['8 visuals at most', '8 عناصر كحد أقصى']] },
    analysis: { name: ['Analysis', 'تحليل'], kpis: 3, kpiH: 84, filters: true, flex: [1, 1.25],
      rows: [[[1, 'column', ['Main chart', 'المخطط الرئيسي']]], [[1, 'table', ['Detail table', 'جدول التفاصيل']]]],
      why: [['All filters in one place', 'كل الفلاتر في مكان واحد'], ['Overview on top, detail below', 'النظرة العامة في الأعلى والتفاصيل في الأسفل'], ['A wide table that is easy to read', 'جدول عريض سهل القراءة']] },
    ops: { name: ['Operations monitor', 'مراقبة العمليات'], kpis: 6, kpiH: 84, filters: false, flex: [1, 1],
      rows: [[[1, 'line', ['Trend', 'الاتجاه']], [1, 'bar', ['Ranking', 'الترتيب']], [1, 'donut', ['Mix', 'التركيبة']]], [[1, 'column', ['Volume', 'الحجم']], [1, 'bar', ['Exceptions', 'الاستثناءات']], [1, 'table', ['Watch list', 'قائمة المتابعة']]]],
      why: [['Equal tiles for equal importance', 'مربعات متساوية لأهمية متساوية'], ['Dense but on one grid', 'كثيف لكن على شبكة واحدة'], ['Made for a daily check or a wall screen', 'مصمم للمتابعة اليومية أو شاشة العرض']] },
    focus: { name: ['Single focus', 'رسالة واحدة'], kpis: 3, kpiH: 96, filters: false, flex: [1],
      rows: [[[2.2, 'line', ['Hero chart', 'المخطط الرئيسي']], [1, 'text', ['What it means', 'ماذا يعني']]]],
      why: [['One message per page', 'رسالة واحدة لكل صفحة'], ['A short text explains the chart', 'نص قصير يشرح المخطط'], ['Generous white space', 'مساحة بيضاء مريحة']] }
  };
  state.layout = Object.assign({ preset: 'exec', kpis: 4, filters: false, dir: '', radius: 12, shadow: true, header: true, accentBar: true, samples: true, transparent: false }, state.layout || {});
  if (!LAYOUTS[state.layout.preset]) state.layout.preset = 'exec';
  const lay = () => state.layout;
  const rtl = (c) => ((c || lay()).dir ? (c || lay()).dir === 'rtl' : isAr());
  const nm = (pair) => (isAr() ? pair[1] : pair[0]);

  function computeSlots(c) {
    const P = LAYOUTS[c.preset], slots = [], top = c.header ? HH + 14 : M;
    if (c.header) {
      slots.push({ kind: 'title', role: ['Page title', 'عنوان الصفحة'], x: M + 8, y: 12, w: 560, h: 32 });
      slots.push({ kind: 'logo', role: ['Logo', 'الشعار'], x: PW - M - 8 - 150, y: 12, w: 150, h: 32 });
    }
    let x0 = M, cw = PW - 2 * M;
    if (c.filters) { slots.push({ kind: 'slicer', role: ['Filters', 'الفلاتر'], x: M, y: top, w: 196, h: PH - M - top, rail: true }); x0 = M + 196 + G; cw = PW - M - x0; }
    const rows = [{ fixed: P.kpiH, cols: Array.from({ length: c.kpis }, (_, i) => [1, 'kpi', [`KPI ${i + 1}`, `مؤشر ${i + 1}`]]) }]
      .concat(P.rows.map((cols, i) => ({ flex: P.flex[i], cols })));
    const flexSum = P.flex.reduce((a, b) => a + b, 0), free = PH - M - top - G * (rows.length - 1) - P.kpiH;
    let y = top;
    rows.forEach((r, ri) => {
      const h = r.fixed || (ri === rows.length - 1 ? PH - M - y : Math.round(free * r.flex / flexSum));
      const wsum = r.cols.reduce((a, col) => a + col[0], 0), avail = cw - G * (r.cols.length - 1);
      let x = x0;
      r.cols.forEach((col, ci) => {
        const w = ci === r.cols.length - 1 ? x0 + cw - x : Math.round(avail * col[0] / wsum);
        slots.push({ kind: col[1], role: col[2], x, y, w, h }); x += w + G;
      });
      y += h + G;
    });
    // Arabic reports read from the right: mirror the whole page so KPI 1 and the title start there
    if (rtl(c)) slots.forEach((s) => { s.x = PW - s.x - s.w; });
    return slots;
  }

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
      case 'slicer': return [0, 1, 2, 3].map((i) => `<rect x="${X}" y="${Y + i * 46}" width="${W}" height="30" rx="7" fill="none" stroke="${grid}" stroke-width="1.5"/><rect x="${right ? X + W - 10 - W * 0.45 : X + 10}" y="${Y + i * 46 + 12}" width="${(W * 0.45).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".5"/>`).join('');
      case 'title': return `<text x="${right ? s.x + s.w : s.x}" y="${s.y + 23}" ${font} font-size="19" font-weight="700" fill="${u.text}" text-anchor="${right ? 'end' : 'start'}">${L('Sales overview', 'نظرة عامة على المبيعات')}</text>`;
      case 'logo': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6" fill="none" stroke="${sec}" stroke-dasharray="4 4" opacity=".6"/><text x="${s.x + s.w / 2}" y="${s.y + 21}" ${font} font-size="11" font-weight="700" fill="${sec}" text-anchor="middle" letter-spacing="1">${L('YOUR LOGO', 'شعارك')}</text>`;
    }
    return '';
  }
  const c0 = () => (lay().accentBar ? 12 : 0); // KPI text sits after the accent bar

  function bgSvg(slots, opt) {
    const u = state.ui, c = lay(), right = rtl(), light = lum(u.background) > 0.45;
    const edge = mix(u.text, u.card, light ? 0.86 : 0.9), rail = mix(u.card, u.background, 0.35), r = +c.radius;
    let s = `<rect width="${PW}" height="${PH}" fill="${u.background}"/>`;
    if (c.header) {
      s += `<rect width="${PW}" height="${HH}" fill="${mix(u.card, u.background, 0.25)}"/><rect y="${HH - 1}" width="${PW}" height="1" fill="${edge}"/>`
        + `<rect x="${right ? PW - M - 8 - 40 : M + 8}" y="${HH - 9}" width="40" height="3" rx="1.5" fill="${u.accent}"/>`;
    }
    slots.forEach((p, i) => {
      if (p.kind === 'title' || p.kind === 'logo') return;
      s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}" fill="${p.rail ? rail : u.card}"${c.shadow ? ' filter="url(#sh)"' : ''}${light || !c.shadow ? ` stroke="${edge}" stroke-width="1"` : ''}/>`;
      if (p.kind === 'kpi' && c.accentBar) s += `<rect x="${right ? p.x + p.w - 14 : p.x + 10}" y="${p.y + 16}" width="4" height="${p.h - 32}" rx="2" fill="${u.accent}"/>`;
    });
    if (opt.preview) {
      const sec = mix(u.text, u.card, 0.35), font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
      slots.forEach((p, i) => {
        let g = c.samples ? sample(p, u, right) : '';
        if (p.kind !== 'title' && p.kind !== 'logo') {
          const lx = right ? p.x + p.w - 14 - (p.kind === 'kpi' ? c0(p) : 0) : p.x + 14 + (p.kind === 'kpi' ? c0(p) : 0);
          g += `<text x="${lx}" y="${p.y + 22}" ${font} font-size="12" font-weight="700" fill="${sec}" text-anchor="${right ? 'end' : 'start'}">${nm(p.role)}</text>`
            + `<text x="${right ? p.x + 12 : p.x + p.w - 12}" y="${p.y + 22}" font-family="Consolas, monospace" font-size="10" fill="${sec}" opacity=".75" text-anchor="${right ? 'start' : 'end'}">${p.w}×${p.h}</text>`;
        }
        s += `<g data-s="${i}">${g}<rect class="o" x="${p.x - 2}" y="${p.y - 2}" width="${p.w + 4}" height="${p.h + 4}" rx="${r + 2}" fill="none" stroke="#fdcb6e" stroke-width="3" opacity="0"/></g>`;
      });
    }
    const defs = c.shadow ? `<defs><filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="${light ? 4 : 6}" flood-color="#000" flood-opacity="${light ? 0.1 : 0.35}"/></filter></defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${opt.w || PW}" height="${opt.h || PH}"${opt.preview ? ' role="img" aria-label="Page layout preview"' : ''}>${defs}${s}</svg>`;
  }

  // small wireframe for the layout buttons
  const thumb = (key) => {
    const c = Object.assign({}, lay(), { preset: key, kpis: LAYOUTS[key].kpis, filters: LAYOUTS[key].filters }), u = state.ui;
    return `<svg viewBox="0 0 ${PW} ${PH}"><rect width="${PW}" height="${PH}" fill="${u.background}"/>${c.header ? `<rect width="${PW}" height="${HH}" fill="${mix(u.card, u.background, 0.25)}"/>` : ''}`
      + computeSlots(c).filter((s) => s.kind !== 'title' && s.kind !== 'logo').map((s) => `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="18" fill="${s.kind === 'kpi' ? u.accent : u.card}" opacity="${s.kind === 'kpi' ? 0.55 : 1}"/>`).join('') + '</svg>';
  };

  const seg = (key, opts, cur) => `<div class="tg-seg" role="group">${opts.map(([v, t]) => `<button type="button" data-l="${key}" data-v="${v}" class="${String(v) === String(cur) ? 'active' : ''}" aria-pressed="${String(v) === String(cur)}">${t}</button>`).join('')}</div>`;
  const chk = (key, t, note) => `<label class="tg-check"><input type="checkbox" data-l="${key}"${lay()[key] ? ' checked' : ''}> <span>${t}${note ? `<br><small class="text-white-50">${note}</small>` : ''}</span></label>`;

  function renderLayout() {
    const c = lay(), slots = computeSlots(c);
    $('layControls').innerHTML = `
      <div><span class="tg-label">${L('Layout', 'التخطيط')}</span><div class="tg-lays">${Object.keys(LAYOUTS).map((k) => `<button type="button" class="tg-lay-b${k === c.preset ? ' active' : ''}" data-l="preset" data-v="${k}" aria-pressed="${k === c.preset}">${thumb(k)}${nm(LAYOUTS[k].name)}</button>`).join('')}</div></div>
      <div><span class="tg-label">${L('KPI cards', 'بطاقات المؤشرات')}</span>${seg('kpis', [[3, '3'], [4, '4'], [5, '5'], [6, '6']], c.kpis)}</div>
      <div><span class="tg-label">${L('Reading direction', 'اتجاه القراءة')}</span>${seg('dir', [['ltr', L('Left to right', 'من اليسار لليمين')], ['rtl', L('Right to left (Arabic)', 'من اليمين لليسار (عربي)')]], rtl() ? 'rtl' : 'ltr')}</div>
      <div><span class="tg-label">${L('Corners', 'الزوايا')}</span>${seg('radius', [[0, L('Square', 'حادة')], [8, L('Soft', 'ناعمة')], [14, L('Round', 'دائرية')]], c.radius)}</div>
      <div class="d-flex flex-column gap-2">
        ${chk('header', L('Header band for title and logo', 'شريط علوي للعنوان والشعار'))}
        ${chk('filters', L('Filter panel on the side', 'لوحة فلاتر جانبية'))}
        ${chk('accentBar', L('Accent bar on KPI cards', 'خط ملون على بطاقات المؤشرات'))}
        ${chk('shadow', L('Soft shadows', 'ظلال خفيفة'))}
        ${chk('samples', L('Sample visuals in the preview', 'عناصر تجريبية في المعاينة'))}
        ${chk('transparent', L('Transparent visuals in the theme JSON', 'عناصر شفافة في ملف السمة'), L('Tick this before downloading the theme, so every visual sits on its panel.', 'فعّلها قبل تنزيل السمة حتى يجلس كل عنصر على لوحته.'))}
      </div>`;
    $('layCanvas').innerHTML = bgSvg(slots, { preview: true });
    $('layWhy').innerHTML = LAYOUTS[c.preset].why.map((w) => `<span><i class="bi bi-check2"></i> ${nm(w)}</span>`).join('');
    const H = isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height'];
    $('slotTable').innerHTML = `<table><thead><tr>${H.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${slots.map((s, i) => `<tr data-i="${i}"><td>${nm(s.role)}</td><td>${nm(KINDS[s.kind])}</td><td class="n">${s.x}</td><td class="n">${s.y}</td><td class="n">${s.w}</td><td class="n">${s.h}</td></tr>`).join('')}</tbody></table>`;
  }

  $('layControls').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-l]'); if (!b) return;
    const k = b.dataset.l, v = b.dataset.v, c = lay();
    if (k === 'preset') { c.preset = v; c.kpis = LAYOUTS[v].kpis; c.filters = LAYOUTS[v].filters; track('theme_layout', { layout: v }); }
    else c[k] = k === 'dir' ? v : +v;
    renderLayout(); save();
  });
  $('layControls').addEventListener('change', (e) => {
    const el = e.target.closest('input[data-l]'); if (!el) return;
    lay()[el.dataset.l] = el.checked;
    if (el.dataset.l === 'transparent') renderJson();
    renderLayout(); save();
  });
  // hovering a row outlines its panel on the preview
  const hl = (i) => { $('layCanvas').querySelectorAll('[data-s] .o').forEach((o) => o.setAttribute('opacity', o.parentNode.dataset.s === i ? '1' : '0')); };
  $('slotTable').addEventListener('mouseover', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) hl(tr.dataset.i); });
  $('slotTable').addEventListener('mouseleave', () => hl(null));

  const fileBase = () => (state.name || 'power-bi-theme').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'power-bi-theme';
  const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const slotRows = () => computeSlots(lay()).map((s) => [nm(s.role), nm(KINDS[s.kind]), s.x, s.y, s.w, s.h]);
  const slotHead = () => (isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height']);
  $('slotCopy').addEventListener('click', () => {
    const text = [slotHead()].concat(slotRows()).map((r) => r.join('\t')).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Table copied. Paste it into Excel or Notes', 'تم نسخ الجدول. الصقه في Excel أو الملاحظات')), () => toast(L('Copy failed. Use Download .csv', 'تعذّر النسخ. استخدم تنزيل .csv')));
    track('theme_layout_slots', { method: 'copy', layout: lay().preset });
  });
  $('slotCsv').addEventListener('click', () => {
    const q = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const csv = '﻿' + [slotHead()].concat(slotRows()).map((r) => r.map(q).join(',')).join('\r\n');
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileBase()}-layout-${lay().preset}.csv`);
    track('theme_layout_slots', { method: 'csv', layout: lay().preset });
  });
  $('pngBtn').addEventListener('click', () => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080;
      cv.getContext('2d').drawImage(img, 0, 0, 1920, 1080);
      cv.toBlob((b) => { if (!b) { toast(L('Could not create the image in this browser', 'تعذّر إنشاء الصورة في هذا المتصفح')); return; }
        saveBlob(b, `${fileBase()}-background-${lay().preset}.png`);
        toast(L('Background downloaded. Set it in Format page › Canvas background', 'تم تنزيل الخلفية. ضعها من Format page › Canvas background'));
      }, 'image/png');
    };
    img.onerror = () => toast(L('Could not create the image in this browser', 'تعذّر إنشاء الصورة في هذا المتصفح'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bgSvg(computeSlots(lay()), { w: 1920, h: 1080 }));
    track('theme_layout_png', { layout: lay().preset, direction: rtl() ? 'rtl' : 'ltr', kpis: lay().kpis });
  });

  renderInputs(); renderAll();
  // Redraw script-generated text when the visitor switches language
  new MutationObserver(() => { renderPresets(); renderInputs(); renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
