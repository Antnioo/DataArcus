/*
 * DataArcus - DAX Time Intelligence Measure Builder
 * Turns one base measure into a full set of time-intelligence measures
 * (MTD, YTD, prior year, YoY %, rolling, running total, Ramadan vs last Ramadan).
 * Output 1: one DAX query view script that adds every measure at once.
 * Output 2: each measure on its own, for Modeling > New measure.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const STORE = 'dataarcus-measure-builder';
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);
  // Arabic explanations per pattern (measure names stay English because they go into the model)
  const WHAT_AR = {
    mtd: 'من بداية الشهر حتى التاريخ المحدد.',
    qtd: 'من بداية الربع حتى التاريخ المحدد.',
    ytd: 'من بداية السنة حتى التاريخ المحدد. يستخدم نهاية سنتك المالية إذا حددتها.',
    py: 'نفس الفترة من السنة الماضية.',
    yoy: 'الفرق عن السنة الماضية بنفس وحدة المقياس الأساسي.',
    yoyPct: 'نسبة النمو عن السنة الماضية. تظهر فارغة إذا لم توجد بيانات للسنة الماضية.',
    pytd: 'السنة الماضية، لنفس فترة YTD.',
    ytdPct: 'نمو YTD مقارنة بنفس الفترة من السنة الماضية.',
    pm: 'الشهر السابق (يُرجع الاختيار الحالي شهرًا واحدًا).',
    momPct: 'نسبة النمو عن الشهر السابق.',
    roll: () => `إجمالي آخر ${state.n} أشهر حتى التاريخ المحدد.`,
    avgDays: () => `المتوسط اليومي لآخر ${state.days} يومًا. يخفف القفزات في خطوط الاتجاه.`,
    running: 'الإجمالي التراكمي من أول تاريخ حتى التاريخ المحدد.',
    share: 'النسبة من الإجمالي للفترة المعروضة، مثل حصة كل علامة تجارية من المبيعات.',
    ramLY: 'نفس أيام رمضان من السنة الهجرية الماضية. ضع Ramadan Day على المحور للمقارنة يومًا بيوم. يحتاج جدول تقويم داتا أركوس.',
    ramPct: 'نسبة النمو مقارنة بنفس أيام رمضان الماضي.'
  };
  const GROUP_AR = { 'To date': 'حتى تاريخه', 'Compare': 'مقارنة', 'Rolling': 'متحرك وتراكمي', 'Ramadan': 'رمضان (يحتاج تقويم داتا أركوس)' };

  const DEFAULTS = {
    mode: 'column', agg: 'SUM', fact: 'Sales', column: 'Amount', base: 'Total Sales', existing: 'Total Sales', home: 'Sales',
    cal: 'Calendar', dateCol: 'Date', fyEnd: '12-31', n: 3, days: 30,
    pick: ['mtd', 'ytd', 'py', 'yoy', 'yoyPct', 'pm', 'momPct', 'roll', 'running']
  };
  let state;
  try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch (e) { state = { ...DEFAULTS }; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  // ---------- DAX name helpers ----------
  const tbl = (t) => "'" + String(t || '').trim().replace(/'/g, "''") + "'";
  const colRef = (t, c) => `${tbl(t)}[${String(c || '').trim().replace(/]/g, ']]')}]`;
  const mRef = (m) => `[${String(m || '').trim().replace(/]/g, ']]')}]`;
  const baseName = () => (state.mode === 'column' ? state.base : state.existing).trim() || 'Measure';
  const home = () => (state.mode === 'column' ? state.fact : state.home).trim() || 'Measures';
  const dateRef = () => colRef(state.cal, state.dateCol);
  const fyEndArg = () => { const [mm, dd] = state.fyEnd.split('-').map(Number); return mm === 12 && dd === 31 ? '' : `, "${mm}/${dd}"`; };

  // Each pattern: id, group, name suffix, what it does, expression builder, format hint, needs other patterns
  const PATTERNS = [
    { id: 'mtd', g: 'To date', suffix: 'MTD', what: 'Month to date: from the 1st of the month to the selected date.',
      dax: (b, d) => `CALCULATE ( ${b}, DATESMTD ( ${d} ) )` },
    { id: 'qtd', g: 'To date', suffix: 'QTD', what: 'Quarter to date.',
      dax: (b, d) => `CALCULATE ( ${b}, DATESQTD ( ${d} ) )` },
    { id: 'ytd', g: 'To date', suffix: 'YTD', what: 'Year to date. Uses your fiscal year end if you set one.',
      dax: (b, d) => `CALCULATE ( ${b}, DATESYTD ( ${d}${fyEndArg()} ) )` },
    { id: 'py', g: 'Compare', suffix: 'PY', what: 'Same period last year.',
      dax: (b, d) => `CALCULATE ( ${b}, SAMEPERIODLASTYEAR ( ${d} ) )` },
    { id: 'yoy', g: 'Compare', suffix: 'YoY', what: 'Change vs last year, in the same unit as the base measure.', needs: ['py'],
      dax: (b) => `${b} - ${mRef(baseName() + ' PY')}` },
    { id: 'yoyPct', g: 'Compare', suffix: 'YoY %', pct: true, what: 'Growth vs last year. Blank when last year had no data.', needs: ['py'],
      dax: (b) => `VAR _Current = ${b}\nVAR _PY = ${mRef(baseName() + ' PY')}\nRETURN\n    DIVIDE ( _Current - _PY, _PY )` },
    { id: 'pytd', g: 'Compare', suffix: 'PYTD', what: 'Last year, same year-to-date window.', needs: ['ytd'],
      dax: (b, d) => `CALCULATE ( ${mRef(baseName() + ' YTD')}, SAMEPERIODLASTYEAR ( ${d} ) )` },
    { id: 'ytdPct', g: 'Compare', suffix: 'YTD vs PYTD %', pct: true, what: 'Year-to-date growth vs the same window last year.', needs: ['ytd', 'pytd'],
      dax: () => `DIVIDE ( ${mRef(baseName() + ' YTD')} - ${mRef(baseName() + ' PYTD')}, ${mRef(baseName() + ' PYTD')} )` },
    { id: 'pm', g: 'Compare', suffix: 'PM', what: 'Previous month (shifts the current selection back one month).',
      dax: (b, d) => `CALCULATE ( ${b}, DATEADD ( ${d}, -1, MONTH ) )` },
    { id: 'momPct', g: 'Compare', suffix: 'MoM %', pct: true, what: 'Growth vs previous month.', needs: ['pm'],
      dax: (b) => `VAR _Current = ${b}\nVAR _PM = ${mRef(baseName() + ' PM')}\nRETURN\n    DIVIDE ( _Current - _PM, _PM )` },
    { id: 'roll', g: 'Rolling', suffix: () => `Rolling ${state.n}M`, what: () => `Total of the last ${state.n} months, ending at the selected date.`,
      dax: (b, d) => `CALCULATE (\n    ${b},\n    DATESINPERIOD ( ${d}, MAX ( ${d} ), -${state.n}, MONTH )\n)` },
    { id: 'avgDays', g: 'Rolling', suffix: () => `${state.days}D Avg`, what: () => `Daily average over the last ${state.days} days. Smooths out spikes in trend lines.`,
      dax: (b, d) => `AVERAGEX (\n    DATESINPERIOD ( ${d}, MAX ( ${d} ), -${state.days}, DAY ),\n    ${b}\n)` },
    { id: 'running', g: 'Rolling', suffix: 'Running Total', what: 'Cumulative total from the first date up to the selected date.',
      dax: (b, d) => `VAR _LastDate = MAX ( ${d} )\nRETURN\n    CALCULATE (\n        ${b},\n        ${d} <= _LastDate,\n        REMOVEFILTERS ( ${tbl(state.cal)} )\n    )` },
    { id: 'share', g: 'Rolling', suffix: '% of Total', pct: true, what: 'Share of the grand total for the visible period, e.g. each brand’s share of sales.',
      dax: (b) => `DIVIDE ( ${b}, CALCULATE ( ${b}, ALLSELECTED () ) )` },
    { id: 'ramLY', g: 'Ramadan', suffix: 'Last Ramadan', ramadan: true,
      what: 'Same Ramadan days last Hijri year. Put Ramadan Day on the axis to compare day by day. Needs the DataArcus calendar table.',
      dax: (b) => `VAR _HijriYear = MAX ( ${tbl(state.cal)}[Hijri Year] )\nVAR _Days = VALUES ( ${tbl(state.cal)}[Ramadan Day] )\nRETURN\n    CALCULATE (\n        ${b},\n        REMOVEFILTERS ( ${tbl(state.cal)} ),\n        ${tbl(state.cal)}[Is Ramadan] = TRUE (),\n        ${tbl(state.cal)}[Hijri Year] = _HijriYear - 1,\n        TREATAS ( _Days, ${tbl(state.cal)}[Ramadan Day] )\n    )` },
    { id: 'ramPct', g: 'Ramadan', suffix: 'vs Last Ramadan %', pct: true, ramadan: true, needs: ['ramLY'],
      what: 'Growth vs the same days of last Ramadan.',
      dax: (b) => `DIVIDE ( ${b} - ${mRef(baseName() + ' Last Ramadan')}, ${mRef(baseName() + ' Last Ramadan')} )` }
  ];
  const val = (x) => (typeof x === 'function' ? x() : x);

  // ---------- build ----------
  const buildMeasures = () => {
    const picked = new Set(state.pick);
    // pull in dependencies so every generated reference exists
    let grew = true;
    while (grew) { grew = false; PATTERNS.forEach((p) => { if (picked.has(p.id)) (p.needs || []).forEach((n) => { if (!picked.has(n)) { picked.add(n); grew = true; } }); }); }
    const b = mRef(baseName()), d = dateRef(), out = [];
    if (state.mode === 'column') {
      const expr = state.agg === 'COUNTROWS' ? `COUNTROWS ( ${tbl(state.fact)} )` : `${state.agg} ( ${colRef(state.fact, state.column)} )`;
      out.push({ name: baseName(), expr, what: L('Your base measure. Every other measure builds on it.', 'المقياس الأساسي. كل المقاييس الأخرى مبنية عليه.'), auto: false });
    }
    PATTERNS.forEach((p) => { if (picked.has(p.id)) out.push({ name: `${baseName()} ${val(p.suffix)}`, expr: p.dax(b, d), what: isAr() ? val(WHAT_AR[p.id]) : val(p.what), pct: !!p.pct, auto: !state.pick.includes(p.id), g: p.g }); });
    return out;
  };
  const indent = (s, pad) => s.split('\n').map((l, i) => (i === 0 ? l : pad + l)).join('\n');

  const render = () => {
    const ms = buildMeasures(), h = tbl(home());
    const script = `// Generated by dataarcus.com/tools/dax-measure-builder.html
// Power BI Desktop: open DAX query view, paste, then click "Update model: Add new measure"
// above each MEASURE line (or "Update model with changes" for all of them).
DEFINE
${ms.map((m) => `    MEASURE ${h}[${m.name.replace(/]/g, ']]')}] =\n        ${indent(m.expr, '        ')}`).join('\n\n')}

EVALUATE
    { ${mRef(baseName())} }`;
    $('script').textContent = script;
    $('count').textContent = L(`${ms.length} measure${ms.length === 1 ? '' : 's'}`, `${ms.length} مقياس`);
    $('list').innerHTML = ms.map((m, i) => `<div class="mb-card">
        <div class="mb-head"><div><b>${escapeHtml(m.name)}</b>${m.pct ? `<span class="mb-tag">${L('Format as %', 'تنسيق كنسبة %')}</span>` : ''}${m.auto ? `<span class="mb-tag dep">${L('Added: needed by another measure', 'أُضيف: يحتاجه مقياس آخر')}</span>` : ''}<div class="mb-what">${escapeHtml(m.what)}</div></div>
        <button class="tg-btn2 mb-copy" type="button" data-i="${i}" aria-label="Copy ${escapeHtml(m.name)}"><i class="bi bi-clipboard"></i></button></div>
        <pre class="tg-json mb-pre">${escapeHtml(`${m.name} =\n${m.expr}`)}</pre></div>`).join('');
    $('list').querySelectorAll('.mb-copy').forEach((btn) => btn.addEventListener('click', () => {
      const m = ms[+btn.dataset.i]; copy(`${m.name} =\n${m.expr}`, btn.closest('.mb-card').querySelector('pre'));
      track('measure_copy_one', { pattern: m.name.replace(baseName(), '').trim() || 'base' });
    }));
    $('ramNote').style.display = ms.some((m) => /Ramadan/.test(m.name)) ? '' : 'none';
    save();
  };
  const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- inputs ----------
  const setMode = () => {
    document.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
    $('modeColumn').style.display = state.mode === 'column' ? '' : 'none';
    $('modeExisting').style.display = state.mode === 'existing' ? '' : 'none';
    $('column').disabled = state.agg === 'COUNTROWS';
  };
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.mode; setMode(); render(); }));
  ['agg', 'fact', 'column', 'base', 'existing', 'home', 'cal', 'dateCol', 'fyEnd', 'n', 'days'].forEach((k) => {
    const el = $(k); if (!el) return; el.value = state[k];
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
      state[k] = (k === 'n' || k === 'days') ? Math.max(1, Math.min(365, parseInt(el.value, 10) || 1)) : el.value;
      if (k === 'agg') setMode();
      render();
    });
  });
  // pattern checkboxes grouped
  const groups = [...new Set(PATTERNS.map((p) => p.g))];
  const renderPatterns = () => { $('patterns').innerHTML = groups.map((g) => `<div class="mb-group"><span class="tg-label">${isAr() ? GROUP_AR[g] : (g === 'Ramadan' ? 'Ramadan (needs the DataArcus calendar)' : g)}</span>${PATTERNS.filter((p) => p.g === g).map((p) =>
    `<label class="mb-check"><input type="checkbox" value="${p.id}" ${state.pick.includes(p.id) ? 'checked' : ''}><span>${escapeHtml(val(p.suffix))}</span></label>`).join('')}</div>`).join(''); };
  renderPatterns();
  $('patterns').addEventListener('change', (e) => {
    if (e.target.type !== 'checkbox') return;
    state.pick = [...$('patterns').querySelectorAll('input:checked')].map((i) => i.value);
    render();
  });
  const relabel = () => { $('patterns').querySelectorAll('input').forEach((i) => { const p = PATTERNS.find((x) => x.id === i.value); i.nextElementSibling.textContent = val(p.suffix); }); };
  ['n', 'days'].forEach((k) => $(k).addEventListener('input', relabel));

  // ---------- copy / download ----------
  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  const copy = (text, pre) => {
    const fallback = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('Copied', 'تم النسخ')), fallback); else fallback();
  };
  $('copyAll').addEventListener('click', () => { copy($('script').textContent, $('script')); track('measure_copy_all', { count: buildMeasures().length, mode: state.mode }); });
  $('dlBtn').addEventListener('click', () => {
    const blob = new Blob([$('script').textContent], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = baseName().toLowerCase().replace(/[^\w]+/g, '-') + '-measures.dax';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(L('Downloaded', 'تم التنزيل')); track('measure_download', { count: buildMeasures().length });
  });
  document.querySelectorAll('[data-tab-out]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-tab-out]').forEach((x) => x.classList.toggle('active', x === b));
    $('outAll').style.display = b.dataset.tabOut === 'all' ? '' : 'none';
    $('outOne').style.display = b.dataset.tabOut === 'one' ? '' : 'none';
  }));

  setMode(); render();
  new MutationObserver(() => { renderPatterns(); render(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
