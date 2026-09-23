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
          background: [{ show: true, color: { solid: { color: u.card } }, transparency: 0 }],
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
  const renderAll = () => { renderPreview(); renderContrast(); renderJson(); save(); };

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

  renderInputs(); renderAll();
  // Redraw script-generated text when the visitor switches language
  new MutationObserver(() => { renderPresets(); renderInputs(); renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
