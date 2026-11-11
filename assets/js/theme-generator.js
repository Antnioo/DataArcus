/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
/*
 * DataArcus - Power BI Theme & Layout Generator (page code on the design engine)
 * The page: controls, preview, downloads, the Power BI project. The theme and layout logic is in design-engine.js
 * (window.DAEngine), shared with the DataArcus MCP. Both generator pages load the engine first, then this file.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  // Arabic/English for text drawn by this script (static page text uses data-i18n)
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);

  const E = window.DAEngine;   // design-engine.js: colours, theme JSON, page sizes, slots, background
  const PRESETS = E.PRESETS;

  const { mix, contrast, LAYOUTS } = E;
  // (0.3.2 OP1) the font choices are the engine's list (text-measure.js's catalog), drawn here: the page has no copy
  if ($('font')) $('font').innerHTML = E.FONTS.map((f) => `<option>${f}</option>`).join('');

  // ---------- state: the saved design and its migration (theme-state-ui.js, 0.3.2 SP31) ----------
  // `state` is the store's design: every change of the whole design goes through S.replace, which rebinds it here
  const S = window.DAThemeState.createStore({ storage: (() => { try { return window.localStorage; } catch (e) { return null; } })(), engine: E });
  let state = S.get();
  S.subscribe((s) => { state = s; });
  const save = () => S.save();

  // ---------- the controls and the layout step (theme-layout-ui.js, 0.3.2 SP31) ----------
  const Lay = window.DAThemeLayoutUI.mount({ store: S, engine: E, $, L, isAr, track, toast: (m) => toast(m),
    hooks: { renderAll: () => renderAll(), renderJson: () => renderJson(), clearLook: () => { lookMsg = ''; }, glassUrl: () => glassUrl(), bgSvg: (slots, opt) => bgSvg(slots, opt),
      canvasFit: () => Dl.canvasFit(), renderVis: () => Dl.renderVis(), updateStatus: () => Dl.updateStatus(), layoutChanged: () => Dl.layoutChanged() } });
  const { PH, PRESET_AR, lay, page, boxOf, rtl, nm, renderInputs, renderPresets, renderLayout } = Lay;

  // chart style choices with the defaults filled in, and the theme JSON
  const chart = () => E.chart(state);
  const buildTheme = () => E.buildTheme(state, isAr() ? 'ar' : 'en');

  // (0.3.1 GL1) the glass look's picture as a data URL, made by the engine (glassPng) at a small size: the same soft
  // picture the report gets at the page's size. Made again only when the colours change
  let glassPic = { key: null, url: '' };
  const glassUrl = () => {
    const key = JSON.stringify([state.ui, state.data]);
    if (glassPic.key !== key) { const b = E.glassPng(state, 640, 360); let bin = ''; for (let i = 0; i < b.length; i += 8192) bin += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); glassPic = { key, url: 'data:image/png;base64,' + btoa(bin) }; }
    return glassPic.url;
  };
  const rgba = (h, a) => `rgba(${E.hexToRgb(h).join(',')},${a})`;
  const renderPreview = () => {
    // (GL1) glass: what Power BI draws, no more: the card colour at the look's transparency over the soft picture, the
    // 1-pixel rim and the shadow; no blur (Power BI has none)
    const u = state.ui, d = state.data, ro = E.roles(u), cs = chart(), gl = E.isGlass(state) ? E.glassLook(state) : null, sec = gl ? gl.labels : ro.secondary, grid = ro.grid;   // (A2-10: the engine's derived colours)
    const cardBg = gl ? `background:${rgba(u.card, (100 - gl.t) / 100)};border:1px solid ${gl.rim}${lay().shadow ? `;box-shadow:0 ${gl.shadow.distance}px ${gl.shadow.blur}px rgba(0,0,0,${(100 - gl.shadow.transparency) / 100})` : ''}` : `background:${u.card}`;
    const card = (k, v, delta, good) => `<div class="tg-card" style="${cardBg};color:${u.text}"><div class="k" style="color:${sec}">${k}</div><div class="v">${v}</div><div class="d" style="color:${good ? u.good : u.bad}">${delta}</div></div>`;
    const months = isAr() ? window.DataArcusArabicCalendar.MONTHS.slice(0, 6) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const s1 = [42, 55, 48, 63, 70, 78], s2 = [30, 34, 41, 38, 49, 52], s3 = [18, 22, 20, 27, 25, 31];
    const bars = months.map((m, i) => [s1[i], s2[i], s3[i]].map((v, j) => { const x = 34 + i * 58 + j * 15, h = v * 1.6; return `<rect x="${x}" y="${150 - h}" width="13" height="${h}" rx="2" fill="${d[j]}"/>`
      + (cs.labels === 'on' ? `<text x="${x + 6.5}" y="${146 - h}" font-size="7" text-anchor="middle" fill="${sec}">${v}</text>` : ''); }).join('') + `<text x="${34 + i * 58 + 21}" y="166" font-size="10" text-anchor="middle" fill="${sec}">${m}</text>`).join('');
    const gridLines = [0, 40, 80, 120].map((v) => `${cs.grid === 'off' && v ? '' : `<line x1="28" x2="380" y1="${150 - v}" y2="${150 - v}" stroke="${cs.grid === 'dotted' && v ? ro.gridline : grid}" stroke-width="1"${cs.grid === 'dotted' && v ? ' stroke-dasharray="1 3"' : ''}/>`}<text x="22" y="${154 - v}" font-size="9" text-anchor="end" fill="${sec}">${v / 1.6 | 0}</text>`).join('');
    // legend of the bar chart, where the theme puts it (Power BI's default is top left)
    const legendItems = [L('Online', 'أونلاين'), L('Stores', 'المتاجر'), L('Partners', 'الشركاء')].map((n, i) => `<span style="display:inline-flex;align-items:center;gap:4px"><i style="width:8px;height:8px;border-radius:50%;background:${d[i]};display:inline-block"></i>${n}</span>`).join('');
    const side = cs.legend === 'Right';
    // a "Side" legend goes where the theme puts it: at the right in both directions (round 15, the owner's go on round
    // 13's recommendation 2c), whatever the page's own writing direction, so the row is reversed on an Arabic page
    const row = side && isAr() ? 'row-reverse' : 'row';
    const legend = cs.legend === 'off' ? '' : `<div class="tg-legend" style="display:flex;${side ? 'flex-direction:column;justify-content:center;' : ''}gap:${side ? 4 : 10}px;font-size:.68rem;color:${sec};justify-content:${cs.legend === 'TopCenter' ? 'center' : side ? 'center' : 'flex-start'};margin:${side ? '0' : '4px 0'}">${legendItems}</div>`;
    const barSvg = (g, b) => `<svg viewBox="0 0 390 172" role="img" aria-label="Clustered bar chart preview"${side ? ' style="flex:1;min-width:0"' : ''}>${g}${b}</svg>`;
    const barChart = (g, b) => (side ? `<div style="display:flex;flex-direction:${row};gap:8px">${barSvg(g, b)}${legend}</div>` : cs.legend === 'Bottom' ? barSvg(g, b) + legend : legend + barSvg(g, b));
    const pts = (arr, k) => arr.map((v, i) => `${40 + i * 62},${150 - v * k}`).join(' ');
    const donutVals = [40, 25, 20, 15]; let acc = 0; const R = 46, C = 2 * Math.PI * R;
    const donut = donutVals.map((v, i) => { const seg = `<circle r="${R}" cx="70" cy="70" fill="none" stroke="${d[i]}" stroke-width="20" stroke-dasharray="${C * v / 100} ${C}" stroke-dashoffset="${-C * acc / 100}" transform="rotate(-90 70 70)"/>`; acc += v; return seg; }).join('');
    $('preview').style.background = gl ? `${u.background} url(${glassUrl()}) center / cover no-repeat` : u.background;
    $('preview').style.fontFamily = `'${state.font}', 'Segoe UI', sans-serif`;
    $('preview').innerHTML = `
      <div class="tg-kpis">${card(L('Revenue', 'الإيرادات'), 'AED 1.24M', L('▲ 12.4% vs LM', '▲ 12.4% عن الشهر الماضي'), true)}${card(L('Orders', 'الطلبات'), '8,432', L('▲ 5.1% vs LM', '▲ 5.1% عن الشهر الماضي'), true)}${card(L('Return rate', 'نسبة المرتجعات'), '4.8%', L('▼ 0.6 pts', '▼ 0.6 نقطة'), false)}</div>
      <div class="tg-grid2">
        <div class="tg-card" style="${cardBg};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Sales by channel', 'المبيعات حسب القناة')}</div>
          ${barChart(gridLines, bars)}</div>
        <div class="tg-card" style="${cardBg};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Share by brand', 'الحصة حسب العلامة')}</div>
          <svg viewBox="0 0 140 140" style="max-width:170px;margin:6px auto 0" role="img" aria-label="Donut chart preview">${donut}<text x="70" y="75" font-size="16" font-weight="800" text-anchor="middle" fill="${u.text}">40%</text></svg></div>
      </div>
      <div class="tg-grid2" style="margin-top:10px">
        <div class="tg-card" style="${cardBg};color:${u.text}"><div class="k" style="color:${u.text};opacity:1;font-weight:700;text-transform:none;font-size:.8rem">${L('Trend', 'الاتجاه')}</div>
          <svg viewBox="0 0 390 160" role="img" aria-label="Line chart preview">${gridLines}<polyline points="${pts(s1, 1.6)}" fill="none" stroke="${d[0]}" stroke-width="3" stroke-linejoin="round"/><polyline points="${pts(s2, 1.6)}" fill="none" stroke="${d[1]}" stroke-width="3" stroke-linejoin="round"/></svg></div>
        <div class="tg-card" style="${cardBg};color:${u.text};overflow-x:auto"><table class="tg-table">
          <tr style="background:${gl ? 'transparent' : u.accent}">${(isAr() ? ['العلامة', 'المبيعات', 'الحالة'] : ['Brand', 'Sales', 'Status']).map((h) => `<th style="color:${gl ? u.text : contrast(u.accent, '#ffffff') >= contrast(u.accent, '#111111') ? '#ffffff' : '#111111'}">${h}</th>`).join('')}</tr>
          ${[[L('North', 'الشمال'), '412K', 'good'], [L('South', 'الجنوب'), '288K', 'neutral'], [L('East', 'الشرق'), '176K', 'bad']].map((r, i) => `<tr style="background:${gl ? (i % 2 && gl.table.band ? gl.table.band : 'transparent') : i % 2 && cs.table !== 'minimal' ? mix(u.card, u.accent, 0.08) : u.card}${cs.table === 'minimal' ? `;border-bottom:1px solid ${grid}` : ''}"><td>${r[0]}</td><td>${r[1]}</td><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${u[r[2]]}"></span></td></tr>`).join('')}
        </table></div>
      </div>${gl ? `<p class="tg-glassnote" style="margin:10px 0 0;font-size:.72rem;color:${u.text}">${L(`Glass: see-through cards (${gl.t}% transparency) over a soft page picture made from your colours. Power BI has no blur behind a visual: this preview draws what Power BI draws, and the report gets the same picture.`, `زجاجي: بطاقات شفافة (شفافية ${gl.t}%) فوق صورة صفحة ناعمة مصنوعة من ألوانك. لا يرسم Power BI ضبابية خلف المرئيات: هذه المعاينة ترسم ما يرسمه Power BI، والتقرير يأخذ الصورة نفسها.`)}</p>` : lookMsg ? `<p class="tg-glassnote" style="margin:10px 0 0;font-size:.72rem;color:${u.text}">${lookMsg}</p>` : ''}`;
  };

  const renderContrast = () => {
    // the numbers come from the engine (the MCP reports the same); the page gives each check its words
    const NAMES = { textOnVisuals: L('Text on visuals', 'النص على المرئيات'), labelsOnVisuals: L('Labels on visuals', 'التسميات على المرئيات'),
      textOnPage: L('Text on page', 'النص على الصفحة'), color1OnVisuals: L('Color 1 on visuals', 'اللون 1 على المرئيات'),
      // (GL1) the glass look's worst cases: a see-through card over the darkest and the lightest pixel of the picture
      textOnGlass: L('Text on the see-through cards', 'النص على البطاقات الشفافة'), labelsOnGlass: L('Labels on the see-through cards', 'التسميات على البطاقات الشفافة'),
      color1OnGlass: L('Color 1 on the see-through cards', 'اللون 1 على البطاقات الشفافة'), textOnPicture: L('Text on the page picture', 'النص على صورة الصفحة') };
    const r0 = E.contrastChecks(state), checks = r0.checks.map((x) => [NAMES[x.id], x.ratio, x.min]), weak = r0.weak;
    // a failing ratio is rounded down, so 4.48 shows as 4.4:1 and never as the 4.5:1 it misses
    const shown = (r, min) => (r >= min ? r : Math.floor(r * 10) / 10).toFixed(1);
    $('contrast').innerHTML = checks.map(([k, r, min]) => `<div class="${r >= min ? 'ok' : 'warn'}"><i class="bi ${r >= min ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1"></i>${k}: ${shown(r, min)}:1 ${r >= min ? '' : L(`(aim for ${min}:1)`, `(المطلوب ${min}:1)`)}</div>`).join('')
      + (weak.length ? `<div class="warn"><i class="bi bi-exclamation-triangle me-1"></i>${L(`Color ${weak.join(', ')} almost disappears on the visual background.`, `اللون ${weak.join('، ')} يكاد يختفي على خلفية المرئي.`)}</div>` : '');
  };

  const renderJson = () => { $('json').textContent = JSON.stringify(buildTheme(), null, 2); Dl.updateStatus(); };
  // (GD1) contrast is the gate: glass only where it keeps everything readable (the engine's glassFit); otherwise the
  // page goes to Plain and the preview says why
  let lookMsg = '';
  const lookGate = () => {
    if (!E.isGlass(state)) return;
    const f = E.glassFit(state);
    if (f.fits) { lookMsg = ''; return; }
    state.chart = Object.assign(chart(), { look: 'auto' }); $('csLook').value = 'auto';
    lookMsg = L('Plain look: with these colours the glass look can\'t keep every text readable, so the cards are solid. Choose other colours for glass.', 'شكل عادي: بهذه الألوان لا يُبقي الشكل الزجاجي كل النصوص مقروءة، لذا البطاقات مصمتة. اختر ألوانًا أخرى للشكل الزجاجي.');
  };
  const renderAll = () => { lookGate(); renderPreview(); renderContrast(); renderJson(); renderLayout(); save(); if (window.__tgFoldSums) window.__tgFoldSums(); };

  // ---------- a theme from a logo (0.3.0 step 6) ----------
  // The file is drawn on a small canvas in this tab and only its pixels are read (an object URL, revoked at once): it is
  // never uploaded, never saved, and no request is made. The engine finds the brand colours (logoColours) and builds the
  // palette with the generator's own generate() (logoTheme), each colour at 3:1 on the visuals and ordered for
  // colour-blind readers; it is applied like "Generate". Only the result is kept, in memory, to redraw on a language change.
  if ($('logoFile') && $('logoOut')) {
    const LOGO_SIDE = 128, LOGO_MAX = 5 * 1024 * 1024;
    let logoRes = null;
    // the HTML escape: html-escape.js htmlEsc, its one home (0.3.2 DD2H; the page loads it before this file)
    const esc = window.DAHtmlEscape.htmlEsc;
    const pixelsOf = (file) => new Promise((resolve, reject) => {
      const src = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(src);
        try {
          const w0 = img.naturalWidth || 300, h0 = img.naturalHeight || 150, k = Math.min(1, LOGO_SIDE / Math.max(w0, h0));
          const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(w0 * k)); cv.height = Math.max(1, Math.round(h0 * k));
          const g = cv.getContext('2d', { willReadFrequently: true }); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(g.getImageData(0, 0, cv.width, cv.height).data);
        } catch (e) { reject(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(src); reject(new Error('IMAGE')); };
      img.src = src;
    });
    // hex codes and the file name read left to right inside Arabic text (else "#ffd84a" shows as "ffd84a#")
    const hx = (h) => `<bdi dir="ltr">${h}</bdi>`;
    const sw = (hex, extra) => `<span data-hex="${hex}"><i style="background:${hex}"></i>${hx(hex)}${extra || ''}</span>`;
    const ratio = (r) => r.toFixed(1) + ':1';
    const renderLogo = () => {
      const out = $('logoOut'), r = logoRes; if (!r) return;
      out.hidden = false; out.dataset.n = String(r.n);
      if (r.error) { out.innerHTML = `<div class="warn tg-logo-error"><i class="bi bi-exclamation-triangle me-1"></i>${r.error === 'EMPTY' ? L('No colours found in this image: it looks empty or white.', 'لم نجد ألوانًا في هذه الصورة: تبدو فارغة أو بيضاء.') : L('This file could not be read as an image. Use a PNG, SVG or JPG under 5 MB.', 'تعذّرت قراءة هذا الملف كصورة. استخدم ملف PNG أو SVG أو JPG أقل من 5 ميجابايت.')}</div>`; return; }
      const t = r.theme, yes = L('Yes', 'نعم'), no = L('No', 'لا');
      out.innerHTML = `<div><span>${L(`Read from ${hx(esc(r.name))} in this tab; nothing was uploaded.`, `قُرئ من ${hx(esc(r.name))} داخل هذه الصفحة؛ لم يُرفع شيء.`)}</span></div>`
        + `<div><b>${L('Logo colours', 'ألوان الشعار')}</b>${r.mono ? ' ' + L('(no hue: the palette starts from its dark colour)', '(بلا لون واضح: تبدأ اللوحة من لونه الداكن)') : ''}<div class="sw tg-logo-swatches">${r.colours.map((c) => sw(c.hex, ` <small>${Math.round(c.share * 100)}%</small>`)).join('')}</div></div>`
        + `<div><b>${L('Palette, in order', 'اللوحة بالترتيب')}</b><div class="sw tg-logo-palette">${t.data.map((c) => sw(c)).join('')}</div></div>`
        + t.adjusted.filter((a) => a.logo).map((a) => `<div class="warn tg-logo-adjusted"><i class="bi bi-info-circle me-1"></i><span>${L(`Your logo's ${hx(a.from)} stands ${ratio(a.before)} on the visual background, under the 3:1 bars and lines need; the palette uses ${hx(a.to)} (${ratio(a.after)}) instead. Your logo itself is unchanged.`, `لون شعارك ${hx(a.from)} يبلغ تباينه ${ratio(a.before)} على خلفية المرئي، أقل من 3:1 الذي تحتاجه الأعمدة والخطوط؛ لذلك تستخدم اللوحة ${hx(a.to)} ‏(${ratio(a.after)}) بدلًا منه. شعارك نفسه لم يتغيّر.`)}</span></div>`).join('')
        + `<table class="tg-logo-table"><thead><tr><th>${L('Colour', 'اللون')}</th><th>${L('On visuals', 'على العناصر')}</th><th>${L('On page', 'على الصفحة')}</th><th>${L('Bars, lines (3:1)', 'أعمدة وخطوط (3:1)')}</th><th>${L('Text (4.5:1)', 'نص (4.5:1)')}</th></tr></thead><tbody>`
        + t.table.map((x) => `<tr><td><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${x.hex}"></i> ${hx(x.hex)}</td><td>${ratio(x.onCard)}</td><td>${ratio(x.onPage)}</td><td class="${x.shapes ? 'ok' : 'warn'}">${x.shapes ? yes : no}</td><td class="${x.text ? 'ok' : 'warn'}">${x.text ? yes : no}</td></tr>`).join('') + '</tbody></table>'
        + `<div class="tg-logo-cvd ${t.cvd.min >= 10 ? 'ok' : 'warn'}"><i class="bi ${t.cvd.min >= 10 ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-1"></i>${L(`Colour-blind check: neighbouring colours stay at least ${t.cvd.min.toFixed(1)} apart (CIEDE2000; deuteranopia ${t.cvd.deutan.toFixed(1)}, protanopia ${t.cvd.protan.toFixed(1)}, normal vision ${t.cvd.normal.toFixed(1)}).`, `فحص عمى الألوان: تبقى الألوان المتجاورة متباعدة بمقدار ${t.cvd.min.toFixed(1)} على الأقل (CIEDE2000؛ عمى الأخضر ${t.cvd.deutan.toFixed(1)}، عمى الأحمر ${t.cvd.protan.toFixed(1)}، الرؤية العادية ${t.cvd.normal.toFixed(1)}).`)}${t.cvd.min >= 10 ? '' : ' ' + L('Some neighbours are close: add data labels or a legend.', 'بعض الألوان المتجاورة قريبة: أضف تسميات البيانات أو وسيلة إيضاح.')}</div>`
        + `<small class="text-white-50">${L('Text in a data colour needs 4.5:1; Power BI writes labels in the text colour unless you change it.', 'النص بلون من ألوان البيانات يحتاج 4.5:1؛ يكتب Power BI التسميات بلون النص ما لم تغيّره.')}</small>`;
    };
    let logoN = 0;
    const readLogo = (file) => {
      const n = ++logoN, done = (res) => { if (n !== logoN) return; logoRes = Object.assign({ n }, res); renderLogo(); };
      if (!file || file.size > LOGO_MAX || !/^image\/(png|jpeg|svg\+xml)$/.test(file.type) && !/\.(png|jpe?g|svg)$/i.test(file.name || '')) return done({ error: 'FILE' });
      pixelsOf(file).then((px) => {
        const found = E.logoColours(px);
        if (!found.colours.length) return done({ error: 'EMPTY' });
        const theme = E.logoTheme(found.colours, { ui: state.ui, harmony: $('harmony').value });
        state.data = theme.data.slice(); state.ui.accent = theme.accent; state.preset = null; $('brand').value = found.colours[0].hex;
        document.querySelectorAll('.tg-preset').forEach((b) => b.classList.remove('active'));
        renderInputs(); renderAll();
        done({ name: file.name || 'logo', colours: found.colours, mono: found.mono, theme });
      }).catch(() => done({ error: 'FILE' }));
    };
    $('logoFile').addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; readLogo(f); });
    const drop = $('logoDrop');
    ['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); readLogo(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]); });
    new MutationObserver(renderLogo).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  }

  const toast = (msg) => window.DAPageToast.toast(msg, { ms: 1800 });   // page-toast.js, its one home (0.3.2 DD2W; the page loads it first)

  // (0.3.1 FX5) the sample's bars and columns as thick as Power BI draws n of them in the slot: the writer's rule
  // (pbip-sizing.js barBand, never thicker than its maximum), else Desktop's default (its 20% between categories);
  // null before the sizes are loaded (the sample's own look)
  const barThick = (n, horizontal, s) => {
    const Z = window.DAPbipSizing; if (!Z || !Z.barBand) return null;
    const span = Z.barSpan(horizontal, s.w, s.h, PH), b = Z.barBand(n, span, PH);
    return b ? b.bar : span / n * (1 - Z.BAR_DEFAULT_INNER);
  };
  // Sample content so the preview reads like a finished report (never drawn in the PNG)
  function sample(s, u, right) {
    const d = state.data, R = E.roles(u), sec = R.secondary, grid = R.grid, p = 14;
    const X = s.x + p, Y = s.y + 32, W = s.w - 2 * p, H = s.h - 32 - p;
    const at = (fx) => (right ? s.x + s.w - p - fx : X + fx); // horizontal position from the reading start
    const font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
    switch (s.kind) {
      case 'kpi': {
        const vals = ['AED 1.24M', '8,432', '4.8%', '312', '96%', '27 min'], v = vals[(s.index || 0) % vals.length];   // (A2-6: the slot's own index)
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
        const v = [0.92, 0.74, 0.61, 0.45, 0.32], n = Math.max(3, Math.min(5, Math.floor(H / 26))), t = barThick(n, true, s), bh = t ? Math.min(t, H / n) : Math.min(16, H / n - 8);
        return v.slice(0, n).map((f, i) => { const w = (W - 8) * f; return `<rect x="${right ? X + W - w : X}" y="${(Y + i * (H / n) + (t ? (H / n - bh) / 2 : 4)).toFixed(1)}" width="${w.toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${d[0]}" opacity="${1 - i * 0.12}"/>`; }).join('');
      }
      case 'column': {
        const v = [0.5, 0.64, 0.58, 0.72, 0.68, 0.84, 0.78, 0.95], n = v.length, gap = W / n, t = barThick(n, false, s), cw = t ? Math.min(t, gap) : gap * 0.64;
        return v.map((f, i) => `<rect x="${(X + i * gap + (gap - cw) / 2).toFixed(1)}" y="${(Y + H - f * H).toFixed(1)}" width="${cw.toFixed(1)}" height="${(f * H).toFixed(1)}" rx="3" fill="${d[0]}" opacity="${i === n - 1 ? 1 : 0.5}"/>`).join('');
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
  const c0 = () => E.c0(lay()); // KPI text sits after a side bar

  // The background (design engine); the preview adds sample visuals, slot names and sizes over the panels
  const previewMarks = (slots) => {
    const u = state.ui, c = lay(), right = rtl(), r = +c.radius;
    let s = '';
    const sec = E.roles(u).secondary, font = `font-family="'${state.font}', 'Segoe UI', Arial, sans-serif"`;
    slots.forEach((p, i) => {
      let g = c.samples ? sample(p, u, right) : '';
      if (p.kind !== 'title' && p.kind !== 'logo') {
        const lx = right ? p.x + p.w - 14 - (p.kind === 'kpi' ? c0(p) : 0) : p.x + 14 + (p.kind === 'kpi' ? c0(p) : 0);
        g += `<text x="${lx}" y="${p.y + 22}" ${font} font-size="12" font-weight="700" fill="${sec}" text-anchor="${right ? 'end' : 'start'}">${nm(p.role)}</text>`
          + `<text x="${right ? p.x + 12 : p.x + p.w - 12}" y="${p.y + 22}" font-family="Consolas, monospace" font-size="10" fill="${sec}" opacity=".75" text-anchor="${right ? 'start' : 'end'}">${((b) => `${b.w}×${b.h}`)(boxOf(p, c))}</text>`;   // the slot table's size (boxOf), for the layout drawn
      }
      s += `<g data-s="${p.s != null ? p.s : i}">${g}<rect class="o" x="${p.x - 2}" y="${p.y - 2}" width="${p.w + 4}" height="${p.h + 4}" rx="${r + 2}" fill="none" stroke="#fdcb6e" stroke-width="3" opacity="0"/></g>`;
    });
    return s;
  };
  const bgSvg = (slots, opt) => E.bgSvg(state, slots, Object.assign({}, opt, { overlay: previewMarks }), isAr() ? 'ar' : 'en');

  // ---------- every script loaded on demand, each with its ?v= stamp: here only (0.3.2 SP31: the downloads get them) ----------
  // (0.2.9, A3-12: the writer is its modules first (0.3 J7: report-a11y.js before pbip-export.js), in this order; each written out with its own ?v= stamp;
  // audit 4's A4-5: text-measure.js first, the one text measurement the sizes use; 0.3.1 M1: the shared mirror engine,
  // report-mirror.js after the visual catalog it reads, before the writer whose Arabic charts it turns round; 0.3.2 SP5:
  // the writer's ZIP and its sample model, pbip-zip.js and pbip-sample.js (after pbip-query.js, which it reads), before it;
  // 0.3.2 SP7: the tooltip pages' builder, pbip-tooltip.js (after pbip-query, pbip-sizing and story-titles, which it
  // reads), before pbip-page.js, which calls it; 0.3.2 SP13: the page buttons' and filter panels' builder,
  // pbip-navigation.js, right after it, before pbip-page.js, which calls it; 0.3.2 SP10: the twin's named rules,
  // mirror-policy.js, after the visual catalog it reads, before report-mirror.js, which reads them; 0.3.2 SP39: the
  // twin's chart transforms, mirror-charts.js, after mirror-policy.js, then its text runs and literals, mirror-text.js,
  // which reads both, and its group and badge geometry, mirror-units.js, before report-mirror.js, which calls them; 0.3.2 SP43: the
  // writer's bidi isolation, pbip-bidi.js, after text-measure.js, which it reads, before the writer, which calls it; 0.3.2
  // DD1B: a literal's text, number and true or false, pbir-values.js, first: the writer, the a11y rules and the check
  // read it; DD1A: is a column time by its name, time-names.js, right after it: the twin, the writer and the check read
  // it; DD1F: is a text Arabic, arabic-script.js, first of all: text-measure.js, the writer and the check read it
  // when they load; DD2T: a text box's paragraphs, text-runs.js, right after pbir-values.js: the a11y rules and the
  // check read it; 0.3.2 DD2K: the contrast of two colours, contrast.js, right after it: the writer reads it when it loads; 0.3.2 DD2P:
  // the picture bytes, png-bytes.js, before pbip-zip.js, which reads its CRC-32 (the page loads it already: not loaded again))
  const BUILDER = ['/assets/js/arabic-script.min.js?v=07b91699d1e3', '/assets/js/contrast.min.js?v=064538a9ae1e', '/assets/js/pbir-values.min.js?v=efce5155fdf9', '/assets/js/text-runs.min.js?v=047b2eda2154', '/assets/js/time-names.min.js?v=2cf40585fc6e', '/assets/js/text-measure.min.js?v=13d0792030b9', '/assets/js/story-titles.min.js?v=596a8e4e04fa', '/assets/js/visual-types.min.js?v=55431aa586c5', '/assets/js/mirror-policy.min.js?v=40c2f796248d', '/assets/js/mirror-charts.min.js?v=f29d54b64c7b', '/assets/js/mirror-text.min.js?v=f1bf57acb463', '/assets/js/mirror-units.min.js?v=91337fe5c334', '/assets/js/report-mirror.min.js?v=767cd538c95d', '/assets/js/pbip-query.min.js?v=c618c34e093a', '/assets/js/pbip-sizing.min.js?v=14c9a147b14e', '/assets/js/pbip-notes.min.js?v=38120f9ce6fd',
    '/assets/js/label-limits.min.js?v=28489c70397d', '/assets/js/pbip-visuals-charts.min.js?v=7d1bb8b90fa6', '/assets/js/pbip-visuals-tables.min.js?v=ad2b43d89afd', '/assets/js/pbip-visuals.min.js?v=9280599b56a8', '/assets/js/pbip-tooltip.min.js?v=f840b971a8b9', '/assets/js/pbip-navigation.min.js?v=30ed39d92fb2', '/assets/js/pbip-page.min.js?v=b00bd55a8c94', '/assets/js/report-a11y.min.js?v=642cabaa4e15',
    '/assets/js/png-bytes.min.js?v=0f8f6e3b3c39', '/assets/js/pbip-zip.min.js?v=57524637fbad', '/assets/js/pbip-sample.min.js?v=c2586f4ca3c2', '/assets/js/pbip-bidi.min.js?v=7bfb226aefb3', '/assets/js/pbip-export.min.js?v=c60adc01937f'];
  // (0.3.1 FX5: the page loads the sizes and what they read, for the canvas's bars; a script already on the page is not
  // loaded again)
  const onPage = (src) => [...document.scripts].some((x) => x.src === new URL(src, location.href).href);
  const loadBuilder = () => (window.DAPbip ? Promise.resolve(window.DAPbip) : BUILDER.reduce((p, src) => p.then(() => new Promise((resolve, reject) => {
    if (onPage(src)) return resolve();
    const sc = document.createElement('script'); sc.src = src; sc.onload = resolve; sc.onerror = reject; document.head.appendChild(sc);
  })), Promise.resolve()).then(() => window.DAPbip));
  // (0.2.9: the field picker reads its field-meaning rule from field-meaning.js, and a TMDL folder through tmdl-model.js,
  // the one TMDL reader (A1-8): both loaded first)
  const loadScript = (src) => new Promise((resolve, reject) => { const sc = document.createElement('script'); sc.src = src; sc.onload = resolve; sc.onerror = reject; document.head.appendChild(sc); });
  // (round 9: loaded once; two choices made quickly (the data option, then the folder) loaded pbip-bind twice, and the
  // model read by one copy was picked by the other, whose own field notes (a WeakMap) knew none of it: one KPI card)
  let binding = null;
  const loadBind = () => binding || (binding = (window.DABind ? Promise.resolve(window.DABind)
    : (window.DataArcusFieldMeaning ? Promise.resolve() : loadScript('/assets/js/field-meaning.min.js?v=07343b7cf536'))
      .then(() => (window.TmdlModel ? null : loadScript('/assets/js/tmdl-model.min.js?v=f4832d0d3ac0')))
      // (SP8: the picker's drawing is field-picker-ui.js's, which pbip-bind.js calls: loaded first)
      .then(() => (window.DAHtmlEscape ? null : loadScript('/assets/js/html-escape.min.js?v=b560fc5666ec')))   // (DD2H: the picker's escape)
      .then(() => (window.DAFieldPicker ? null : loadScript('/assets/js/field-picker-ui.min.js?v=c74879eca806')))
      // (SP14: reading the chosen folder or file is model-import-browser.js's, which pbip-bind.js forwards to: loaded first; DD1G: which model folder it means is model-nearest.js's, loaded before it; DD2D: a file's text and the limits are model-file.js's, loaded before it too)
      .then(() => (window.DAModelFile ? null : loadScript('/assets/js/model-file.min.js?v=47bc00d4a4cb')))
      .then(() => (window.DAModelNearest ? null : loadScript('/assets/js/model-nearest.min.js?v=c6ffd3114120')))
      .then(() => (window.DAModelImport ? null : loadScript('/assets/js/model-import-browser.min.js?v=16b8206a59b7')))
      // (DD1H: which column sorts a month or day name is sort-column.js's, which field-catalog.js reads when it loads: loaded first)
      .then(() => (window.DASortColumn ? null : loadScript('/assets/js/sort-column.min.js?v=8fba2c19aba2')))
      // (DD1F: is a text Arabic is arabic-script.js's, which field-catalog.js reads when it loads: loaded first)
      .then(() => (window.DAArabicScript ? null : loadScript('/assets/js/arabic-script.min.js?v=07b91699d1e3')))
      // (SP30: the model's metadata, normalised, is field-catalog.js's, which pbip-bind.js reads when it loads: loaded first)
      .then(() => (window.DAFieldCatalog ? null : loadScript('/assets/js/field-catalog.min.js?v=910ad9ad493d')))
      // (SP30: the ranking is field-suggest.js's, which reads field-catalog.js and which pbip-bind.js reads: loaded between)
      .then(() => (window.DAFieldSuggest ? null : loadScript('/assets/js/field-suggest.min.js?v=ca404cf26ee2')))
      .then(() => loadScript('/assets/js/pbip-bind.min.js?v=600d69b2b551')).then(() => window.DABind)).catch((e) => { binding = null; throw e; }));
  let words = null;
  const loadNames = () => Promise.all([window.DAArabicNames ? window.DAArabicNames : loadScript('/assets/js/arabic-names.min.js?v=637dc63aff40').then(() => window.DAArabicNames),
    words || (words = fetch('/assets/data/arabic-report-words.json').then((r) => (r.ok ? r.json() : Promise.reject(new Error('words')))).catch((e) => { words = null; throw e; }))]);
  const CHECK = ['../assets/js/visual-types.min.js?v=55431aa586c5', '../assets/js/report-rules.min.js?v=148ec22d3e30', '../assets/js/layout-check.min.js?v=e6f85451661b'];
  const loadCheck = () => (window.DALayoutCheck ? Promise.resolve(window.DALayoutCheck) : loadBuilder().then(() => CHECK.reduce((q, src) => q.then(() => loadScript(src)), Promise.resolve())).then(() => window.DALayoutCheck));
  // (0.3.2 DD1B: the preview reads its literals with pbir-values.js, DD1A: its time names with time-names.js, DD2T:
  // a text box's paragraphs with text-runs.js, each
  // loaded first unless the builder or the page already did)
  const loadPreview = () => (window.DAPagePreview ? Promise.resolve(window.DAPagePreview) : (window.DAPbirValues ? Promise.resolve() : loadScript('../assets/js/pbir-values.min.js?v=efce5155fdf9')).then(() => (window.DATimeNames ? null : loadScript('../assets/js/time-names.min.js?v=2cf40585fc6e'))).then(() => (window.DATextRuns ? null : loadScript('../assets/js/text-runs.min.js?v=047b2eda2154'))).then(() => (window.DAHtmlEscape ? null : loadScript('../assets/js/html-escape.min.js?v=b560fc5666ec'))).then(() => (window.DAVisualTypes ? null : loadScript('../assets/js/visual-types.min.js?v=55431aa586c5'))).then(() => loadScript('../assets/js/page-preview.min.js?v=878598b10089')).then(() => window.DAPagePreview));
  const MODEL_WORKER = '/assets/js/model-health-worker.min.js?v=f7bb3033e770';

  // ---------- the downloads, the visual backgrounds and the reminder (theme-download-ui.js, 0.3.2 SP31) ----------
  const Dl = window.DAThemeDownloadUI.mount({ store: S, engine: E, $, L, isAr, track, toast, layout: Lay,
    loaders: { builder: loadBuilder, bind: loadBind, names: loadNames, check: loadCheck, preview: loadPreview, worker: MODEL_WORKER },
    hooks: { buildTheme, renderJson: () => renderJson(), bgSvg } });

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
  const FOLD = S.keep('-folded'), FOLDS = ['colors', 'layout', 'download'];
  let folded = [];
  try { folded = JSON.parse(FOLD.get() || '[]').filter((id) => FOLDS.includes(id)); } catch (e) { folded = []; }
  const foldSum = (id) => {
    const c = lay(), p = page(c);
    if (id === 'colors') return (state.preset ? (isAr() ? PRESET_AR[state.preset] || state.preset : state.preset) : L('Your colors', 'ألوانك')) + ' · ' + state.font + ' · ' + (state.name || '');
    // (0.3.1 SQ8, 0.2.9-design-S4) the layout the preview shows: a small page's executive layout is the single-focus one
    if (id === 'layout') return nm(LAYOUTS[E.fitLayout(c).preset].name) + ' · ' + p.w + ' × ' + p.h + ' · ' + L(`${c.kpis} KPI cards`, `${c.kpis} بطاقات مؤشرات`);
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
      FOLD.set(JSON.stringify(folded));
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
  const UNDO = S.keep('-before');
  let beforeExample = UNDO.get();
  if (beforeExample) $('exampleUndo').hidden = false;
  $('exampleBtn').addEventListener('click', () => {
    if (!beforeExample) { beforeExample = JSON.stringify(state); UNDO.set(beforeExample); }
    const p = PRESETS['Desert Gulf'];
    S.replace({ preset: 'Desert Gulf', name: 'Executive Sales', font: 'Segoe UI', data: p.data.slice(), ui: { ...p.ui },
      layout: { preset: 'exec', kpis: 4, filters: true, fpos: 'top', dir: isAr() ? 'rtl' : 'ltr', v: 3, radius: 8, shadow: true, header: true, kpiBar: 'top', kpiBarC: 'data', headLine: 'full', samples: true, transparent: true, page: E.DEFAULT_PAGE, hh: 64, logoW: 200 } });
    Lay.clearPageMsg(); renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = false;
    openStep('layout'); $('layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast(L('Example loaded: an executive sales report', 'تم تحميل المثال: تقرير مبيعات تنفيذي'));
    track('theme_example', { example: 'executive-sales' });
  });
  const exCard = $('exampleCard'), exImg = $('exampleImg');
  if (exCard) exCard.addEventListener('click', () => $('exampleBtn').click());
  const exPic = () => { if (exImg) exImg.src = `/assets/img/tools/theme-example-${isAr() ? 'ar' : 'en'}.jpg`; };
  exPic(); new MutationObserver(exPic).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  $('exampleUndo').addEventListener('click', () => {
    if (!beforeExample) return;
    S.replace(JSON.parse(beforeExample)); beforeExample = null; Lay.clearPageMsg();
    UNDO.remove();
    renderPresets(); renderInputs(); renderAll();
    $('exampleUndo').hidden = true;
    toast(L('Your design is back', 'عاد تصميمك'));
  });

  renderInputs(); renderAll();
  // Redraw script-generated text when the visitor switches language
  new MutationObserver(() => { renderPresets(); renderInputs(); renderAll(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
