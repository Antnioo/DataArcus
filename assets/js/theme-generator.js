/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Power BI Theme & Layout Generator
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
  const CHART_INPUTS = { csLabels: 'labels', csGrid: 'grid', csLegend: 'legend', csAxis: 'axis', csTable: 'table' };
  const renderInputs = () => {
    $('dataColors').innerHTML = state.data.map((c, i) => colorInput('d' + i, c, L('Color ', 'اللون ') + (i + 1))).join('');
    $('uiColors').innerHTML = Object.keys(UI_LABELS).map((k) => colorInput('u_' + k, state.ui[k], uiLabel(k))).join('');
    $('themeName').value = state.name; $('font').value = state.font;
    Object.entries(CHART_INPUTS).forEach(([id, k]) => { $(id).value = chart()[k]; });
    document.querySelectorAll('.tg-preset').forEach((b) => b.classList.toggle('active', b.dataset.p === state.preset));
  };
  const setColor = (key, val) => { if (key[0] === 'd') state.data[+key.slice(1)] = val; else state.ui[key.slice(2)] = val; state.preset = null; };

  // Every visual type in Power BI's theme schema (2.157). The Fluent 2 base theme sets rounded corners per
  // visual type, which outranks a theme's "every visual" (*) value, so the radius is also written per type.
  const VISUAL_TYPES = ['group', 'actionButton', 'bookmarkNavigator', 'textbox', 'pageNavigator', 'shape', 'barChart', 'columnChart', 'clusteredBarChart',
    'clusteredColumnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'lineChart', 'areaChart', 'stackedAreaChart',
    'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'lineClusteredColumnComboChart', 'ribbonChart', 'waterfallChart', 'funnel',
    'scatterChart', 'pieChart', 'donutChart', 'treemap', 'map', 'filledMap', 'shapeMap', 'azureMap', 'gauge', 'cardVisual', 'card', 'multiRowCard', 'kpi',
    'slicer', 'tableEx', 'pivotTable', 'scriptVisual', 'pythonVisual', 'keyDriversVisual', 'decompositionTreeVisual', 'qnaVisual', 'aiNarratives',
    'scorecard', 'rdlVisual', 'advancedSlicerVisual', 'textSlicer', 'listSlicer', 'image'];
  // Corners: Power BI only rounds a visual when its border is on. Solid visuals get a 1px border in their own
  // background color (invisible, only the rounded shape shows); transparent visuals sit on the PNG panels, no border.
  const borderStyle = (u) => (state.layout && state.layout.transparent
    ? [{ show: false }]
    : [{ show: true, color: { solid: { color: u.card } }, width: 1, radius: toPage(+state.layout.radius || 0) }]);
  // Power BI's own visual shadow (on by default in Fluent 2) is a square box: with the PNG it would show around
  // the rounded panels, so transparent visuals never get it; solid visuals follow the Soft shadows option
  const shadowStyle = () => [{ show: !!(state.layout && !state.layout.transparent && state.layout.shadow) }];
  // Power BI's default text sizes (title 12, label 10, callout 28) are made for a 1280 × 720 page. On a bigger page
  // everything looks small, so every size grows with the page: × 1.5 on 1920 × 1080, unchanged on 1280 × 720.
  const fs = (n) => Math.round(n * page(state.layout).s * 2) / 2;
  const textSizes = () => {
    const merge = (t, extra) => ({ [t]: { '*': Object.assign({ border: borderStyle(state.ui), dropShadow: shadowStyle() }, extra) } });
    const grid = { values: [{ fontSize: fs(10) }], columnHeaders: [{ fontSize: fs(10) }], total: [{ fontSize: fs(10) }] };
    return Object.assign({},
      merge('tableEx', grid),
      merge('pivotTable', Object.assign({ rowHeaders: [{ fontSize: fs(10) }] }, grid)),
      merge('slicer', { header: [{ textSize: fs(10) }], items: [{ textSize: fs(10) }] }),
      merge('card', { labels: [{ fontSize: fs(28) }], categoryLabels: [{ fontSize: fs(10) }] }),
      merge('multiRowCard', { cardTitle: [{ fontSize: fs(12) }], dataLabels: [{ fontSize: fs(18) }], categoryLabels: [{ fontSize: fs(10) }] }));
  };
  // Chart style: theme-wide defaults, written only to the visual types whose theme schema (2.157) has that
  // setting, because Power BI rejects the whole theme when one property is unknown. "auto" writes nothing.
  const CHART_DEFAULTS = { labels: 'auto', grid: 'auto', legend: 'auto', axis: 'auto', table: 'auto' };
  const chart = () => Object.assign({}, CHART_DEFAULTS, state.chart);
  const AXIS_CHARTS = ['barChart', 'columnChart', 'clusteredBarChart', 'clusteredColumnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart',
    'lineChart', 'areaChart', 'stackedAreaChart', 'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'lineClusteredColumnComboChart', 'ribbonChart', 'waterfallChart'];
  const chartStyles = (u) => {
    const c = chart(), out = {};
    const add = (types, card, props) => types.forEach((t) => {
      const v = ((out[t] = out[t] || { '*': {} })['*']);
      v[card] = [Object.assign((v[card] || [{}])[0], props)];
    });
    if (c.labels !== 'auto') add(AXIS_CHARTS, 'labels', { show: c.labels === 'on' });
    if (c.grid !== 'auto') {
      const g = c.grid === 'off' ? { gridlineShow: false } : { gridlineShow: true, gridlineStyle: 'dotted', gridlineColor: { solid: { color: mix(u.text, u.card, 0.8) } } };
      add(AXIS_CHARTS.concat('scatterChart'), 'valueAxis', g);
      // waterfall has no category gridlines in the schema; Power BI draws none there anyway
      if (c.grid === 'off') add(AXIS_CHARTS.concat('scatterChart').filter((t) => t !== 'waterfallChart'), 'categoryAxis', { gridlineShow: false });
    }
    if (c.legend !== 'auto') add(AXIS_CHARTS.concat('scatterChart', 'pieChart', 'donutChart', 'treemap'), 'legend', c.legend === 'off' ? { show: false } : { show: true, position: c.legend });
    if (c.axis === 'off') ['valueAxis', 'categoryAxis'].forEach((a) => add(AXIS_CHARTS.concat('scatterChart'), a, { showAxisTitle: false }));
    if (c.table !== 'auto') {
      const line = { solid: { color: mix(u.text, u.card, 0.85) } };
      add(['tableEx', 'pivotTable'], 'grid', { gridVertical: false, gridHorizontal: c.table === 'minimal', gridHorizontalColor: line });
      add(['tableEx', 'pivotTable'], 'values', { backColorPrimary: { solid: { color: u.card } }, backColorSecondary: { solid: { color: c.table === 'banded' ? mix(u.card, u.accent, 0.08) : u.card } } });
    }
    return out;
  };
  // Adds the chart style cards into the per-visual entries built above (tables already carry text sizes there)
  const withChartStyles = (vs, u) => {
    Object.entries(chartStyles(u)).forEach(([t, v]) => {
      const cur = ((vs[t] = vs[t] || { '*': {} })['*']);
      Object.entries(v['*']).forEach(([card, arr]) => { cur[card] = [Object.assign({}, (cur[card] || [{}])[0], arr[0])]; });
    });
    return vs;
  };
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
        callout: { fontSize: fs(28), fontFace: f, color: u.text },
        title: { fontSize: fs(12), fontFace: f, color: u.text },
        header: { fontSize: fs(12), fontFace: f, color: u.text },
        label: { fontSize: fs(10), fontFace: f, color: sec }
      },
      visualStyles: withChartStyles({
        '*': { '*': {
          // with a layout background the panels are drawn in the image, so visuals go transparent
          background: state.layout && state.layout.transparent ? [{ show: false }] : [{ show: true, color: { solid: { color: u.card } }, transparency: 0 }],
          // same corners as the panels in the background PNG, in page units
          border: borderStyle(u),
          dropShadow: shadowStyle()
        } },
        page: { '*': {
          background: [{ color: { solid: { color: u.background } }, transparency: 0 }],
          outspace: [{ color: { solid: { color: u.background } } }]
        } },
        ...Object.fromEntries(VISUAL_TYPES.map((t) => [t, { '*': { border: borderStyle(u), dropShadow: shadowStyle() } }])),
        // visuals with their own text sizes, which do not follow the text classes above
        ...textSizes()
      }, u)
    };
  };

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
    const legend = cs.legend === 'off' ? '' : `<div class="tg-legend" style="display:flex;${side ? 'flex-direction:column;justify-content:center;' : ''}gap:${side ? 4 : 10}px;font-size:.68rem;color:${sec};justify-content:${cs.legend === 'TopCenter' ? 'center' : side ? 'center' : 'flex-start'};margin:${side ? '0' : '4px 0'}">${legendItems}</div>`;
    const barSvg = (g, b) => `<svg viewBox="0 0 390 172" role="img" aria-label="Clustered bar chart preview"${side ? ' style="flex:1;min-width:0"' : ''}>${g}${b}</svg>`;
    const barChart = (g, b) => (side ? `<div style="display:flex;gap:8px">${barSvg(g, b)}${legend}</div>` : cs.legend === 'Bottom' ? barSvg(g, b) + legend : legend + barSvg(g, b));
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

  const renderJson = () => { $('json').textContent = JSON.stringify(buildTheme(), null, 2); updateStatus(); };
  const renderAll = () => { renderPreview(); renderContrast(); renderJson(); renderLayout(); save(); };
  // Every font in the list is built into Power BI, but only some have Arabic letters: in an Arabic or
  // right-to-left report the others fall back to another font, so say so under the font picker.
  const AR_FONTS = ['Segoe UI', 'Segoe UI Semibold', 'Arial', 'Tahoma'];
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
    a.download = (state.name || 'power-bi-theme').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
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
  let PW = 1280, PH = 720;
  const M = 16, G = 12, HH = 56;
  // Page sizes: the layout is designed on a grid 720 units tall and converted to the page's own units,
  // so the table, CSV and sliders always show the numbers to type into Power BI for that page.
  const PAGES = { '1280x720': [1280, 720], '1920x1080': [1920, 1080], '960x720': [960, 720] };
  // Custom page: whole numbers, 640-3840 wide, 360-2160 tall, shaped between 4:3 and 2.4:1 so the layout grid still works
  const LIM = { w: [640, 3840], h: [360, 2160], r: [4 / 3, 2.4] };
  const within = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));
  function fitCustom(w, h) {
    w = within(Math.round(+w) || 1280, LIM.w); h = within(Math.round(+h) || 720, LIM.h);
    if (w / h < LIM.r[0]) h = Math.round(w / LIM.r[0]);
    if (w / h > LIM.r[1]) h = Math.round(w / LIM.r[1]);
    if (h < LIM.h[0]) { h = LIM.h[0]; w = Math.max(w, Math.round(h * LIM.r[0])); }
    return [w, h];
  }
  const page = (c) => { c = c || lay(); const [w, h] = c.page === 'custom' ? fitCustom(c.pageW, c.pageH) : PAGES[c.page] || PAGES['1920x1080']; return { w, h, s: h / 720 }; };
  let pageMsg = '';   // shown once after a typed value was outside the limits
  const shapeMsg = (c) => { if (c.page !== 'custom') return ''; const [w, h] = fitCustom(c.pageW, c.pageH);
    return w === c.pageW && h === c.pageH ? '' : L(`This shape is outside 4:3 to 2.4:1, so the preview uses ${w} × ${h}.`, `هذا الشكل خارج النطاق من 4:3 إلى 2.4:1، لذلك تستخدم المعاينة <bdi dir="ltr">${w} × ${h}</bdi>.`); };
  const applyPage = (c) => { const p = page(c); PW = Math.round(p.w / p.s); PH = 720; return p; };
  const toPage = (v, c) => Math.round(v * page(c).s);
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
  // v2: corners 0/8/16, and the KPI accent bar became a choice of side (from the old on/off accentBar)
  const upgrade = (l) => {
    if (l && !l.v) {
      if (+l.radius === 12) l.radius = 8; else if (+l.radius === 14) l.radius = 16;
      if (!l.kpiBar) l.kpiBar = l.accentBar === false ? 'none' : 'start';
      delete l.accentBar; l.v = 2;
    }
    // v3: the default page became 1920 x 1080; older saved designs keep the 1280 x 720 they were made on
    if (l && l.v < 3) { if (!l.page) l.page = '1280x720'; l.v = 3; }
    return l;
  };
  state.layout = Object.assign({ v: 3, page: '1920x1080', preset: 'exec', kpis: 4, filters: false, dir: '', radius: 8, shadow: true, header: true, kpiBar: 'start', headLine: 'short', samples: true, transparent: false }, upgrade(state.layout) || {});
  if (!LAYOUTS[state.layout.preset]) state.layout.preset = 'exec';
  const lay = () => state.layout;
  const rtl = (c) => ((c || lay()).dir ? (c || lay()).dir === 'rtl' : isAr());
  const nm = (pair) => (isAr() ? pair[1] : pair[0]);

  // Adjustable sizes, each kept inside a safe range so every visual stays usable
  const RANGE = { hh: [44, 96], logoW: [100, 360], fw: [160, 320], fh: [56, 120], kpiH: [64, 160], mainW: [40, 75], split: [30, 70], radius: [0, 24], kpiBarW: [2, 8], headLineW: [2, 8] };
  // on a narrow (4:3) page the side filter panel is capped at a quarter of the width
  const rangeOf = (k) => (k === 'fw' ? [160, Math.min(320, Math.round(PW / 4))] : RANGE[k]);
  const clampTo = (k, v) => Math.max(rangeOf(k)[0], Math.min(rangeOf(k)[1], Math.round(+v)));
  const hasMain = (P) => P.rows[0].length > 1 && P.rows[0][0][0] > P.rows[0][1][0];   // a wider first chart
  const hasSplit = (P) => P.rows.length === 2;
  function sizes(c) {
    const P = LAYOUTS[c.preset], n = (k, d) => clampTo(k, c[k] == null || !isFinite(+c[k]) ? d : c[k]);
    const w0 = P.rows[0].reduce((a, col) => a + col[0], 0);
    return { hh: n('hh', HH), logoW: n('logoW', 150), fpos: ['start', 'end', 'top'].includes(c.fpos) ? c.fpos : 'start', fw: n('fw', 196), fh: n('fh', 72),
      kpiH: n('kpiH', P.kpiH), mainW: n('mainW', 100 * P.rows[0][0][0] / w0), split: n('split', P.flex.length === 2 ? 100 * P.flex[0] / (P.flex[0] + P.flex[1]) : 50) };
  }

  function computeSlots(c) {
    applyPage(c);
    const P = LAYOUTS[c.preset], z = sizes(c), slots = [];
    let top = c.header ? z.hh + 14 : M;
    if (c.header) {
      const th = z.hh - 24, lx = PW - M - 8 - z.logoW;
      slots.push({ kind: 'title', role: ['Page title', 'عنوان الصفحة'], x: M + 8, y: 12, w: Math.min(560, lx - 24 - (M + 8)), h: th });
      slots.push({ kind: 'logo', role: ['Logo', 'الشعار'], x: lx, y: 12, w: z.logoW, h: th });
    }
    let x0 = M, cw = PW - 2 * M;
    if (c.filters && z.fpos === 'top') { slots.push({ kind: 'slicer', role: ['Filters', 'الفلاتر'], x: M, y: top, w: cw, h: z.fh, rail: true }); top += z.fh + G; }
    else if (c.filters) {
      const fx = z.fpos === 'end' ? PW - M - z.fw : M;
      slots.push({ kind: 'slicer', role: ['Filters', 'الفلاتر'], x: fx, y: top, w: z.fw, h: PH - M - top, rail: true });
      cw = PW - 2 * M - z.fw - G; if (z.fpos !== 'end') x0 = M + z.fw + G;
    }
    // the first chart row: the main chart takes its share, the others split the rest by their weights
    const first = P.rows[0].map((col, i) => col.slice());
    if (hasMain(P)) { const rest = first.slice(1).reduce((a, col) => a + col[0], 0); first[0][0] = rest * z.mainW / (100 - z.mainW); }
    const flex = hasSplit(P) ? [z.split, 100 - z.split] : P.flex.slice();
    const flexSum = flex.reduce((a, b) => a + b, 0), free = PH - M - top - G * P.rows.length - z.kpiH;
    // no chart row shorter than 90: move the split back if needed
    if (hasSplit(P) && free >= 180) { const h0 = free * flex[0] / flexSum; if (h0 < 90) flex[0] = flexSum * 90 / free; else if (free - h0 < 90) flex[0] = flexSum * (free - 90) / free; flex[1] = flexSum - flex[0]; }
    const rows = [{ fixed: z.kpiH, cols: Array.from({ length: c.kpis }, (_, i) => [1, 'kpi', [`KPI ${i + 1}`, `مؤشر ${i + 1}`]]) }]
      .concat([first].concat(P.rows.slice(1)).map((cols, i) => ({ flex: flex[i], cols })));
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
      case 'slicer': if (s.w > s.h * 3) { const n = 4, bw = (W - (n - 1) * 10) / n, by = s.y + Math.max(28, s.h - 38); return Array.from({ length: n }, (_, i) => { const bx = right ? X + W - (i + 1) * bw - i * 10 : X + i * (bw + 10); return `<rect x="${bx.toFixed(1)}" y="${by}" width="${bw.toFixed(1)}" height="26" rx="7" fill="none" stroke="${grid}" stroke-width="1.5"/><rect x="${(right ? bx + bw - 10 - bw * 0.45 : bx + 10).toFixed(1)}" y="${by + 10}" width="${(bw * 0.45).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".5"/>`; }).join(''); }
        return [0, 1, 2, 3].map((i) => `<rect x="${X}" y="${Y + i * 46}" width="${W}" height="30" rx="7" fill="none" stroke="${grid}" stroke-width="1.5"/><rect x="${right ? X + W - 10 - W * 0.45 : X + 10}" y="${Y + i * 46 + 12}" width="${(W * 0.45).toFixed(1)}" height="6" rx="3" fill="${sec}" opacity=".5"/>`).join('');
      case 'title': return `<text x="${right ? s.x + s.w : s.x}" y="${(s.y + s.h * 0.72).toFixed(1)}" ${font} font-size="${Math.min(30, Math.round(s.h * 0.6))}" font-weight="700" fill="${u.text}" text-anchor="${right ? 'end' : 'start'}">${L('Sales overview', 'نظرة عامة على المبيعات')}</text>`;
      case 'logo': return `<rect x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="6" fill="none" stroke="${sec}" stroke-dasharray="4 4" opacity=".6"/><text x="${s.x + s.w / 2}" y="${s.y + s.h / 2 + 4}" ${font} font-size="11" font-weight="700" fill="${sec}" text-anchor="middle" letter-spacing="1">${L('YOUR LOGO', 'شعارك')}</text>`;
    }
    return '';
  }
  // accent bars: side, thickness and color (Advanced options)
  const barW = (k, c) => clampTo(k, (c || lay())[k] == null ? (k === 'kpiBarW' ? 4 : 3) : (c || lay())[k]);
  const barColor = (k, i) => { const v = lay()[k], u = state.ui; return v === 'data' ? state.data[i % state.data.length] : (u[v] || u.accent); };
  const c0 = () => (lay().kpiBar === 'start' ? barW('kpiBarW') + 8 : 0); // KPI text sits after a side bar

  // The PNG matches the table to the pixel. In Power BI, with Image fit: Stretch, each panel lands exactly under
  // its visual (checked with calibration backgrounds on 1920 × 1080 and 1280 × 720 pages).
  function bgSvg(slots, opt) {
    const u = state.ui, c = lay(), right = rtl(), light = lum(u.background) > 0.45;
    const edge = mix(u.text, u.card, light ? 0.86 : 0.9), rail = mix(u.card, u.background, 0.35), r = +c.radius;
    let s = `<rect width="${PW}" height="${PH}" fill="${u.background}"/>`;
    if (c.header) {
      const hh = sizes(c).hh;
      s += `<rect width="${PW}" height="${hh}" fill="${mix(u.card, u.background, 0.25)}"/><rect y="${hh - 1}" width="${PW}" height="1" fill="${edge}"/>`
        + (c.headLine === 'none' ? '' : (() => { const t = barW('headLineW', c), col = barColor('headLineC', 0);
          return c.headLine === 'full' ? `<rect class="hl" y="${hh - t}" width="${PW}" height="${t}" fill="${col}"/>`
            : `<rect class="hl" x="${right ? PW - M - 8 - 40 : M + 8}" y="${hh - 6 - t}" width="40" height="${t}" rx="${t / 2}" fill="${col}"/>`; })());
    }
    let clips = '';
    slots.forEach((p, i) => {
      if (p.kind === 'title' || p.kind === 'logo') return;
      s += `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}" fill="${p.rail ? rail : u.card}"${c.shadow ? ' filter="url(#sh)"' : ''}${light || !c.shadow ? ` stroke="${edge}" stroke-width="1"` : ''}/>`;
      if (p.kind !== 'kpi' || !c.kpiBar || c.kpiBar === 'none') return;
      const t = barW('kpiBarW', c), col = barColor('kpiBarC', +p.role[0].split(' ')[1] - 1);
      if (c.kpiBar === 'start') s += `<rect class="kb" x="${right ? p.x + p.w - 10 - t : p.x + 10}" y="${p.y + 16}" width="${t}" height="${p.h - 32}" rx="${t / 2}" fill="${col}"/>`;
      else { // a strip along the top or bottom edge, clipped to the card's corners
        clips += `<clipPath id="kc${i}"><rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${r}"/></clipPath>`;
        s += `<rect class="kb" x="${p.x}" y="${c.kpiBar === 'top' ? p.y : p.y + p.h - t}" width="${p.w}" height="${t}" fill="${col}" clip-path="url(#kc${i})"/>`;
      }
    });
    if (opt.preview) {
      const sec = mix(u.text, u.card, 0.35), font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
      slots.forEach((p, i) => {
        let g = c.samples ? sample(p, u, right) : '';
        if (p.kind !== 'title' && p.kind !== 'logo') {
          const lx = right ? p.x + p.w - 14 - (p.kind === 'kpi' ? c0(p) : 0) : p.x + 14 + (p.kind === 'kpi' ? c0(p) : 0);
          g += `<text x="${lx}" y="${p.y + 22}" ${font} font-size="12" font-weight="700" fill="${sec}" text-anchor="${right ? 'end' : 'start'}">${nm(p.role)}</text>`
            + `<text x="${right ? p.x + 12 : p.x + p.w - 12}" y="${p.y + 22}" font-family="Consolas, monospace" font-size="10" fill="${sec}" opacity=".75" text-anchor="${right ? 'start' : 'end'}">${toPage(p.w)}×${toPage(p.h)}</text>`;
        }
        s += `<g data-s="${i}">${g}<rect class="o" x="${p.x - 2}" y="${p.y - 2}" width="${p.w + 4}" height="${p.h + 4}" rx="${r + 2}" fill="none" stroke="#fdcb6e" stroke-width="3" opacity="0"/></g>`;
      });
    }
    const defs = c.shadow || clips ? `<defs>${c.shadow ? `<filter id="sh" x="-10%" y="-10%" width="120%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="${light ? 4 : 6}" flood-color="#000" flood-opacity="${light ? 0.1 : 0.35}"/></filter>` : ''}${clips}</defs>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PW} ${PH}" width="${opt.w || PW}" height="${opt.h || PH}"${opt.preview ? ' role="img" aria-label="Page layout preview"' : ''}>${defs}${s}</svg>`;
  }

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
  const pngSize = (c) => { const p = page(c), k = Math.max(1, 1920 / p.w); return [Math.round(p.w * k), Math.round(p.h * k)]; };
  function renderLayoutPreview() {
    const c = lay(), slots = computeSlots(c), pg = page(c), T = (v) => toPage(v, c), [pw, ph] = pngSize(c);
    $('layCanvas').innerHTML = bgSvg(slots, { preview: true });
    const H = isAr() ? ['العنصر', 'النوع المقترح', 'أفقي X', 'رأسي Y', 'العرض', 'الارتفاع'] : ['Slot', 'Suggested visual', 'X (horizontal)', 'Y (vertical)', 'Width', 'Height'];
    $('slotTable').innerHTML = `<table><thead><tr>${H.map((h, i) => `<th${i > 1 ? ' class="n"' : ''}>${h}</th>`).join('')}</tr></thead><tbody>${slots.map((s, i) => `<tr data-i="${i}"><td>${nm(s.role)}</td><td>${nm(KINDS[s.kind])}</td><td class="n">${T(s.x)}</td><td class="n">${T(s.y)}</td><td class="n">${T(s.w)}</td><td class="n">${T(s.h)}</td></tr>`).join('')}</tbody></table>`;
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
    renderLayout(); save();
  });
  // sliders redraw the preview while dragging, without rebuilding the controls
  step2.addEventListener('input', (e) => {
    const el = e.target.closest('input[type="range"][data-l]'); if (!el) return;
    lay()[el.dataset.l] = clampTo(el.dataset.l, el.value / (+el.dataset.f || 1));
    const o = $('layControls').querySelector(`[data-out="${el.dataset.l}"]`); if (o) o.textContent = el.value + el.dataset.u;
    // the exact radius slider keeps the Square/Soft/Round buttons in step
    if (el.dataset.l === 'radius') $('layControls').querySelectorAll('button[data-l="radius"]').forEach((b) => { const on = +b.dataset.v === lay().radius; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on); });
    if (el.dataset.l === 'radius') renderJson();
    renderLayoutPreview(); save();
  });
  step2.addEventListener('change', (e) => {
    const num = e.target.closest('input[type="number"][data-l]');
    if (num) {
      const c = lay(), k = num.dataset.l, isW = k === 'pageW', lim = isW ? LIM.w : LIM.h;
      if (num.value === '' || !isFinite(+num.value)) { pageMsg = L('Enter a whole number.', 'أدخل رقمًا صحيحًا.'); renderLayout(); return; }
      const v = Math.round(+num.value), kept = within(v, lim);
      pageMsg = kept !== v ? (isW ? L(`Width set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط العرض على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`) : L(`Height set to ${kept} (allowed ${lim[0]} to ${lim[1]}).`, `تم ضبط الارتفاع على ${kept} (المسموح من ${lim[0]} إلى ${lim[1]}).`)) : '';
      c[k] = kept; const [w, h] = fitCustom(c.pageW, c.pageH); track('theme_page_size', { size: w + 'x' + h });
      renderLayout(); save(); return;
    }
    const el = e.target.closest('input[type="checkbox"][data-l]'); if (!el) return;
    lay()[el.dataset.l] = el.checked;
    renderLayout(); save();
  });
  // remember whether Advanced options is open when the controls are rebuilt (toggle does not bubble)
  $('layControls').addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('tg-adv')) advOpen = e.target.open; }, true);
  // hovering a row outlines its panel on the preview
  const hl = (i) => { $('layCanvas').querySelectorAll('[data-s] .o').forEach((o) => o.setAttribute('opacity', o.parentNode.dataset.s === i ? '1' : '0')); };
  $('slotTable').addEventListener('mouseover', (e) => { const tr = e.target.closest('tr[data-i]'); if (tr) hl(tr.dataset.i); });
  $('slotTable').addEventListener('mouseleave', () => hl(null));

  const fileBase = () => (state.name || 'power-bi-theme').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'power-bi-theme';
  const saveBlob = (blob, name) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const slotRows = () => computeSlots(lay()).map((s) => [nm(s.role), nm(KINDS[s.kind]), toPage(s.x), toPage(s.y), toPage(s.w), toPage(s.h)]);
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
  if (pbipBtn) {
    let logo = null;
    const loadBuilder = () => (window.DAPbip ? Promise.resolve(window.DAPbip) : new Promise((resolve, reject) => {
      const sc = document.createElement('script'); sc.src = '../assets/js/pbip-export.min.js?v=20260930a'; sc.onload = () => resolve(window.DAPbip); sc.onerror = reject; document.head.appendChild(sc);
    }));
    // ---- your own model: a local project (the report points at its .SemanticModel folder) or a published one ----
    const dataIn = $('pbipData'), own = { tables: null, folder: null, dir: '', getBind: null };
    const loadBind = () => (window.DABind ? Promise.resolve(window.DABind) : new Promise((resolve, reject) => {
      const sc = document.createElement('script'); sc.src = '../assets/js/pbip-bind.min.js?v=20260930d'; sc.onload = () => resolve(window.DABind); sc.onerror = reject; document.head.appendChild(sc);
    }));
    const ownMsg = (text, bad) => { const m = $('pbipOwnMsg'); if (m) { m.textContent = text; m.style.color = bad ? '#fca5a5' : ''; } };
    const mode = () => (dataIn ? dataIn.value : 'sample');
    const showOwn = () => {
      const m = mode(), box = $('pbipOwn'); if (!box) return;
      box.hidden = m !== 'local' && m !== 'service';
      box.querySelectorAll('[data-own]').forEach((d) => { d.hidden = d.dataset.own !== m; });
      if (!box.hidden) loadBind().catch(() => {});
    };
    // KPI cards on the pages this download makes: the main layout and the second page (3 or 4)
    const kpiSlots = () => Math.max(lay().kpis || 0, $('pbipPages') && $('pbipPages').checked ? 4 : 0, 1);
    const loaded = (res, where0) => loadBind().then((DB) => {
      const where = DB.iso(where0);
      own.tables = res.tables;
      const ms = res.tables.reduce((a, t) => a + t.measures.filter((x) => !x.isHidden).length, 0);
      if (!res.tables.length) { own.getBind = null; $('pbipMap').innerHTML = ''; ownMsg(L('No tables found in this model.', 'لم يتم العثور على جداول في هذا النموذج.'), true); return; }
      own.getBind = DB.renderPicker($('pbipMap'), res.tables, DB.suggest(res.tables, kpiSlots()), L);
      ownMsg(L(`${where}: ${res.tables.length} tables, ${ms} measures. Each visual below has a suggested field; change any of them.`,
        `${where}: ${res.tables.length} جدول، ${ms} مقياس. لكل عنصر أدناه حقل مقترح، ويمكنك تغيير أي منها.`)
        + (!ms ? L(' This model has no measures, so KPI cards and charts stay empty until you add some.', ' لا توجد مقاييس في هذا النموذج، لذا تبقى البطاقات والمخططات فارغة حتى تضيفها.') : ''));
      track('theme_pbip_model', { mode: mode(), tables: res.tables.length, measures: ms });
    });
    const failed = (e) => {
      const code = e && e.message;
      own.getBind = null; if ($('pbipMap')) $('pbipMap').innerHTML = '';
      ownMsg(code === 'NO_SEMANTIC_MODEL' ? L('No .SemanticModel folder here. Choose the folder you saved the Power BI project in.', 'لا يوجد مجلد .SemanticModel هنا. اختر المجلد الذي حفظت فيه مشروع Power BI.')
        : code === 'PBIX' ? L('A .pbix keeps its model in a format only Power BI reads. Use File › Export › Power BI template (.pbit).', 'ملف .pbix يحفظ النموذج بصيغة لا يقرؤها إلا Power BI. استخدم File › Export › Power BI template (.pbit).')
          : code === 'TMDL_ONLY' ? L('This file has the model as TMDL. Choose the project folder instead, on the other option.', 'هذا الملف يحفظ النموذج بصيغة TMDL. اختر مجلد المشروع بدلًا منه.')
            : L('Could not read the model in this file.', 'تعذّرت قراءة النموذج في هذا الملف.'), true);
    };
    if (dataIn) {
      dataIn.addEventListener('change', showOwn); showOwn();
      $('pbipFolder').addEventListener('change', (e) => {
        const files = e.target.files; if (!files || !files.length) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        // with more than one model in the folder, say which one (by its path) the report will use
        loadBind().then((DB) => DB.fromFolder(files)).then((res) => { own.folder = res.folder; own.dir = res.path.replace(/\/?[^/]*$/, '');
          return loaded(res, res.others ? res.path + L(` (${res.others + 1} models in this folder; this one is used)`, ` (عدد النماذج في المجلد: ${res.others + 1}، ويُستخدم هذا النموذج)`) : res.folder); })
          .catch((err) => { own.folder = null; failed(err); });
      });
      $('pbipModelFile').addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0]; if (!f) return;
        ownMsg(L('Reading the model…', 'جارٍ قراءة النموذج…'));
        loadBind().then((DB) => DB.fromFile(f, '../assets/js/model-health-worker.min.js?v=20260928b')).then((res) => loaded(res, f.name)).catch(failed);
      });
    }
    const logoIn = $('pbipLogo');
    if (logoIn) logoIn.addEventListener('change', () => {
      const f = logoIn.files && logoIn.files[0]; logo = null;
      const out = $('pbipLogoName');
      if (!f) { if (out) out.textContent = ''; return; }
      const ext = /png$/i.test(f.type) ? 'png' : /jpe?g$/i.test(f.type) ? 'jpg' : null;
      if (!ext || f.size > 2 * 1024 * 1024) { logoIn.value = ''; if (out) out.textContent = ''; toast(L('Use a PNG or JPG logo under 2 MB', 'استخدم شعارًا بصيغة PNG أو JPG أقل من 2 ميجابايت')); return; }
      f.arrayBuffer().then((buf) => { logo = { bytes: new Uint8Array(buf), ext }; if (out) out.textContent = f.name; });
    });
    pbipBtn.addEventListener('click', () => {
      const c = lay(), p = page(c), m = mode(), sample = m === 'sample';
      // your own model: where it is, and the fields picked for each visual
      let model = null;
      if (m === 'local') {
        if (!own.folder) { toast(L('Choose your Power BI project folder first', 'اختر مجلد مشروع Power BI أولًا')); return; }
        model = { byPath: own.folder };
      } else if (m === 'service') {
        const ws = $('pbipWs').value.trim(), mn = $('pbipModelName').value.trim();
        if (!ws || !mn) { toast(L('Type the workspace and the semantic model names', 'اكتب اسم مساحة العمل واسم النموذج الدلالي')); return; }
        model = { ws, mn };   // the connection string is written once the helper has loaded, below
      }
      const bind = model && own.getBind && (m === 'service' || own.folder) ? own.getBind() : null;
      pbipBtn.disabled = true;
      // visuals sit on the panels of the background image, so the project's theme always has transparent visuals
      const was = c.transparent; c.transparent = true; const theme = buildTheme(); c.transparent = was;
      const slotsOf = (cc) => { const was = state.layout; state.layout = cc; const r = computeSlots(cc).map((s) => ({ kind: s.kind, title: nm(s.role), rail: !!s.rail, x: toPage(s.x, cc), y: toPage(s.y, cc), w: toPage(s.w, cc), h: toPage(s.h, cc) })); state.layout = was; applyPage(was); return r; };
      // a second page in a complementary layout: an analysis page (filters, a main chart, a wide table) after an
      // overview, or an executive overview after an analysis page
      const second = $('pbipPages') && $('pbipPages').checked;
      const c2 = Object.assign({}, c, c.preset === 'analysis' ? { preset: 'exec', kpis: 4, filters: false } : { preset: 'analysis', kpis: 3, filters: true, fpos: 'start' }, { kpiH: null, mainW: null, split: null });
      const slide = $('pbipPanel') && $('pbipPanel').checked;
      const withPanel = (cc) => {
        if (!slide || !cc.filters || !cc.header) return { c: cc, panel: null };
        const open = Object.assign({}, cc, { filters: false });
        const was = state.layout; state.layout = cc; applyPage(cc);
        const z = sizes(cc), w = Math.max(240, Math.min(320, z.fw + 40)), top = z.hh + 14;
        // the panel opens under the Filters button, at the end of the header (right in English, left in Arabic)
        const r = { x: rtl(cc) ? M : PW - M - w, y: top, w, h: PH - M - top };
        const panel = { x: toPage(r.x, cc), y: toPage(r.y, cc), w: toPage(r.w, cc), h: toPage(r.h, cc) };
        state.layout = was; applyPage(was);
        return { c: open, panel };
      };
      const specs = [{ c, name: nm(LAYOUTS[c.preset].name) }].concat(second ? [{ c: c2, name: c.preset === 'analysis' ? L('Overview', 'نظرة عامة') : L('Details', 'التفاصيل') }] : [])
        .map((sp) => Object.assign(sp, withPanel(sp.c)));
      Promise.all([loadBuilder(), model ? loadBind() : null].concat(specs.map((sp) => pngBlob(sp.c).then((b) => b.arrayBuffer())))).then(([P, DB, ...bufs]) => {
        if (model && model.ws) model = { byConnection: DB.connection(model.ws, model.mn) };
        const pages = specs.map((sp, i) => ({ name: sp.name, page: { w: page(sp.c).w, h: page(sp.c).h }, slots: slotsOf(sp.c), png: new Uint8Array(bufs[i]), panel: sp.panel || null }));
        const r = P.build({
          name: state.name || 'Power BI Report', title: state.name || L('Sales overview', 'نظرة عامة على المبيعات'), pageName: nm(LAYOUTS[c.preset].name),
          lang: isAr() ? 'ar' : 'en', rtl: rtl(), font: state.font, ui: state.ui, pages, theme, logo, sample, model, bind,
          texts: {
            reset: L('Reset filters', 'إعادة ضبط الفلاتر'), pages: L('Pages', 'الصفحات'), close: L('Close', 'إغلاق'),
            filterPanel: L('Filter panel', 'لوحة الفلاتر'), openFilters: L('Open the filter panel', 'افتح لوحة الفلاتر'), closeFilters: L('Close the filter panel', 'أغلق لوحة الفلاتر'),
            filtersOpen: L('Filters open', 'الفلاتر مفتوحة'), filtersClosed: L('Filters closed', 'الفلاتر مغلقة'),
            header: L('Header', 'الشريط العلوي'), kpis: L('KPI cards', 'بطاقات المؤشرات'), filters: L('Filters', 'الفلاتر'), slicer: L('Slicer', 'مقسم'),
            logo: L('Logo', 'الشعار'), logoHere: L('Your logo', 'شعارك'), textHere: L('Explain what the main chart shows and what to do about it.', 'اشرح ما يعرضه المخطط الرئيسي وما الإجراء المطلوب.'),
            by: L('by', 'حسب'), newDesign: L('New design', 'تصميم جديد'),
            tooltipPage: L('Tooltip', 'تلميح'), tooltipHere: L('Tooltip page: add a card or a small chart here.', 'صفحة التلميح: أضف بطاقة أو مخططًا صغيرًا هنا.'),
            readme: m === 'service' ? L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop and sign in. The report connects live to your published semantic model.\n3. Check each visual, then publish the report to the same workspace.\n',
              '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop وسجّل الدخول. يتصل التقرير مباشرة بنموذجك الدلالي المنشور.\n3. راجع كل عنصر، ثم انشر التقرير في نفس مساحة العمل.\n') : L('# {name}\n\nMade with the DataArcus Power BI Theme & Layout Generator: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## Open it\n1. Unzip this folder.\n2. Open **{name}.pbip** in Power BI Desktop.\n3. If you chose sample data, click **Refresh** once so it loads.\n\n## Use your own data\nGet data, then drag your fields into each visual. The theme, background, positions, tooltip page and filter pane styling are already set.\n\nOlder Power BI Desktop versions: turn on **File > Options > Preview features > Power BI Project (.pbip) save option** and **Store reports using enhanced metadata format (PBIR)**.\n',
              '# {name}\n\nصُنع بمولّد السمات والتخطيطات لـ Power BI من DataArcus: https://dataarcus.com/tools/power-bi-theme-generator.html\n\n## افتحه\n1. فك ضغط هذا المجلد.\n2. افتح **{name}.pbip** في Power BI Desktop.\n3. إذا اخترت البيانات التجريبية، اضغط **Refresh** مرة واحدة لتظهر.\n\n## استخدم بياناتك\nاضغط Get data ثم اسحب حقولك إلى كل عنصر. السمة والخلفية والمواضع وصفحة التلميح وتنسيق لوحة الفلاتر جاهزة.\n\nفي إصدارات Power BI Desktop الأقدم: فعّل **File > Options > Preview features > Power BI Project (.pbip) save option** و **Store reports using enhanced metadata format (PBIR)**.\n')
          }
        });
        saveBlob(new Blob([r.zip()], { type: 'application/zip' }), `${fileBase()}-power-bi-${m === 'local' || m === 'service' ? 'report' : 'project'}.zip`);
        if (m === 'local') {
          const at = own.dir ? ` (${own.dir})` : '';
          const msg = L(`Unzip it into the folder that holds ${own.folder}${at}, then open ${r.base}.pbip`, `فك الضغط داخل المجلد الذي فيه ${own.folder}${at}، ثم افتح ${r.base}.pbip`);
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
  function csvKey() { return JSON.stringify(computeSlots(lay()).map((s) => [s.kind, toPage(s.x), toPage(s.y), toPage(s.w), toPage(s.h)])); }
  function renderVis() {
    const t = !!lay().transparent;
    $('dlVis').innerHTML = `<span class="tg-label">${L('Visual backgrounds in the theme', 'خلفيات العناصر في السمة')}</span>${seg('transparent', [[1, L('Transparent (use with the background)', 'شفافة (مع الخلفية)')], [0, L('Solid (theme only)', 'مصمتة (السمة فقط)')]], t ? 1 : 0)}
      <small class="d-block mt-1 text-white-50">${t ? L('Visuals have no fill, so each one sits on its panel in the background image.', 'العناصر بلا تعبئة، فيجلس كل عنصر على لوحته في صورة الخلفية.') : L('Each visual gets its own card color. Choose this if you only use the theme, without the background image.', 'يأخذ كل عنصر لون بطاقة خاصًا به. اختره إذا كنت تستخدم السمة فقط دون صورة الخلفية.')}</small>`;
  }
  $('dlVis').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-l="transparent"]'); if (!b) return;
    lay().transparent = b.dataset.v === '1'; renderVis(); renderJson(); save();
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
  }
  const DL = { json: () => downloadJson('reminder'), png: downloadPng, csv: downloadCsv };
  document.querySelector('main.tg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-dl]'); if (!b) return;
    const a = b.dataset.dl;
    // several files one after another, so the browser does not merge or block them
    if (a === 'stale') [['json', lastJson !== null && lastJson !== JSON.stringify(buildTheme(), null, 2)], ['png', lastPng !== null && lastPng !== pngKey()], ['csv', lastCsv !== null && lastCsv !== csvKey()]]
      .filter((f) => f[1]).forEach((f, i) => setTimeout(DL[f[0]], i * 400));
    else if (a === 'transparent') { lay().transparent = true; renderVis(); renderJson(); save(); toast(L('Visuals are transparent. Download the theme again', 'أصبحت العناصر شفافة. نزّل السمة من جديد')); }
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

  // "See an example": a complete executive sales design; the visitor's own design can be restored
  let beforeExample = null;
  $('exampleBtn').addEventListener('click', () => {
    if (!beforeExample) beforeExample = JSON.stringify(state);
    const p = PRESETS['Desert Gulf'];
    state = { preset: 'Desert Gulf', name: 'Executive Sales', font: 'Segoe UI', data: p.data.slice(), ui: { ...p.ui },
      layout: { preset: 'exec', kpis: 4, filters: true, fpos: 'top', dir: isAr() ? 'rtl' : 'ltr', v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', kpiBarC: 'data', headLine: 'full', samples: true, transparent: true, page: '1920x1080', hh: 64, logoW: 200 } };
    pageMsg = ''; renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = false;
    $('layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = true;
    toast(L('Your design is back', 'عاد تصميمك'));
  });

  renderInputs(); renderAll();
  // Redraw script-generated text when the visitor switches language
  new MutationObserver(() => { renderPresets(); renderInputs(); renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
