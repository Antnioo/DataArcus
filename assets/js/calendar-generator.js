/*
 * DataArcus - DAX Calendar Table Generator (with Hijri dates)
 * Builds a DAX calculated table: Gregorian, fiscal, relative and Hijri
 * (Umm al-Qura) columns, Ramadan and Eid flags, and GCC weekends.
 * Hijri month starts are computed in the browser with Intl and embedded
 * in the DAX as a small DATATABLE, so the result needs no external data.
 */
document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const STORE = 'dataarcus-calendar-generator';

  const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  };
  const DAYS = { // index 1 = Sunday (WEEKDAY type 1)
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  };
  const HIJRI = {
    en: ['Muharram', 'Safar', "Rabi al-Awwal", "Rabi al-Thani", 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qa'dah", 'Dhu al-Hijjah'],
    ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
  };
  const WEEKENDS = { 'sat-sun': [7, 1], 'fri-sat': [6, 7], 'fri': [6], 'sun': [1] }; // WEEKDAY type 1 numbers

  // ---------- Hijri (Umm al-Qura) via Intl ----------
  let hijriFmt = null;
  try { hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch (e) { hijriFmt = null; }
  const hijri = (t) => {
    const o = {}; hijriFmt.formatToParts(new Date(t)).forEach((p) => { if (p.type === 'day' || p.type === 'month' || p.type === 'year') o[p.type] = parseInt(p.value, 10); });
    return o;
  };
  const DAY = 864e5;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const hijriMonthStarts = (from, to) => {
    const out = [];
    for (let t = from - 40 * DAY; t <= to; t += DAY) { const h = hijri(t); if (h.day === 1) out.push({ t, y: h.year, m: h.month }); }
    return out;
  };

  // ---------- state ----------
  const DEFAULTS = { name: 'Calendar', start: '2022-01-01', end: '2027-12-31', fy: 1, week: 'sun', weekend: 'sat-sun', lang: 'en', hijri: true, fiscal: true, relative: true };
  let state;
  try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || '{}') }; } catch (e) { state = { ...DEFAULTS }; }
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };

  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const sw = (expr, list, offset = 1) => `SWITCH ( ${expr}, ${list.map((v, i) => `${i + offset}, ${q(v)}`).join(', ')} )`;
  const tableName = () => (state.name || 'Calendar').replace(/[^\w ]/g, '').trim() || 'Calendar';

  // ---------- DAX builder ----------
  let colCount = 0;
  const buildDax = () => {
    const s = parse(state.start), e = parse(state.end);
    const lang = state.lang, fy = +state.fy;
    const L = []; const col = (name, expr) => L.push(`        ${q(name)}, ${expr}`);
    // day-of-week number depending on week start (1 = first day of the week)
    const dow = state.week === 'mon' ? 'WEEKDAY ( [Date], 2 )' : state.week === 'sat' ? 'MOD ( WEEKDAY ( [Date], 1 ), 7 ) + 1' : 'WEEKDAY ( [Date], 1 )';
    const wk = WEEKENDS[state.weekend];

    col('Year', 'YEAR ( [Date] )');
    col('Quarter', '"Q" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    col('Year Quarter', 'YEAR ( [Date] ) & " Q" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    col('Month Number', 'MONTH ( [Date] )');
    col('Month Name', sw('MONTH ( [Date] )', MONTHS[lang]));
    col('Month Short', lang === 'en' ? sw('MONTH ( [Date] )', MONTHS.en.map((m) => m.slice(0, 3))) : sw('MONTH ( [Date] )', MONTHS.ar));
    col('Year Month', 'FORMAT ( [Date], "YYYY-MM" )');
    col('Year Month Sort', 'YEAR ( [Date] ) * 100 + MONTH ( [Date] )');
    col('Day', 'DAY ( [Date] )');
    col('Day of Week', dow);
    col('Day Name', sw('WEEKDAY ( [Date], 1 )', DAYS[lang]));
    col('Week Start', `[Date] - ( ${dow} ) + 1`);
    col('ISO Week', 'WEEKNUM ( [Date], 21 )');
    col('Is Weekend', `WEEKDAY ( [Date], 1 ) IN { ${wk.join(', ')} }`);
    col('Is Working Day', `NOT ( WEEKDAY ( [Date], 1 ) IN { ${wk.join(', ')} } )`);
    if (state.fiscal && fy !== 1) {
      col('Fiscal Year', `"FY" & ( YEAR ( [Date] ) + IF ( MONTH ( [Date] ) >= ${fy}, 1, 0 ) )`);
      col('Fiscal Month Number', `MOD ( MONTH ( [Date] ) - ${fy}, 12 ) + 1`);
      col('Fiscal Quarter', `"FQ" & ROUNDUP ( ( MOD ( MONTH ( [Date] ) - ${fy}, 12 ) + 1 ) / 3, 0 )`);
    } else if (state.fiscal) {
      col('Fiscal Year', '"FY" & YEAR ( [Date] )');
      col('Fiscal Month Number', 'MONTH ( [Date] )');
      col('Fiscal Quarter', '"FQ" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    }
    if (state.relative) {
      col('Day Offset', 'INT ( [Date] - TODAY () )');
      col('Month Offset', '( YEAR ( [Date] ) - YEAR ( TODAY () ) ) * 12 + MONTH ( [Date] ) - MONTH ( TODAY () )');
      col('Year Offset', 'YEAR ( [Date] ) - YEAR ( TODAY () )');
      col('Is Past', '[Date] < TODAY ()');
    }

    let hijriVar = '', hijriLayer = '', hijriCols = 0;
    if (state.hijri && hijriFmt) {
      const starts = hijriMonthStarts(s, e);
      hijriVar = `-- Umm al-Qura Hijri month starts, generated by dataarcus.com
VAR _HijriMonths =
    DATATABLE (
        "HStart", DATETIME, "HYear", INTEGER, "HMonth", INTEGER,
        {
${starts.map((h) => `            { "${iso(h.t)}", ${h.y}, ${h.m} }`).join(',\n')}
        }
    )
`;
      hijriLayer = `VAR _WithHijri =
    ADDCOLUMNS (
        ADDCOLUMNS (
            _Dates,
            "Hijri Month Start", MAXX ( FILTER ( _HijriMonths, [HStart] <= [Date] ), [HStart] )
        ),
        "Hijri Year", MAXX ( FILTER ( _HijriMonths, [HStart] = [Hijri Month Start] ), [HYear] ),
        "Hijri Month Number", MAXX ( FILTER ( _HijriMonths, [HStart] = [Hijri Month Start] ), [HMonth] ),
        "Hijri Day", INT ( [Date] - [Hijri Month Start] ) + 1
    )
`;
      const hm = '[Hijri Month Number]', hy = '[Hijri Year]', hd = '[Hijri Day]';
      hijriCols = 4;
      col('Hijri Month Name', sw(hm, HIJRI[lang]));
      col('Hijri Date', `${hd} & " " & ${sw(hm, HIJRI[lang])} & " " & ${hy}`);
      col('Hijri Year Month Sort', `${hy} * 100 + ${hm}`);
      col('Is Ramadan', `${hm} = 9`);
      col('Ramadan Day', `IF ( ${hm} = 9, ${hd} )`);
      col('Is Eid al-Fitr', `${hm} = 10 && ${hd} <= 3`);
      col('Is Eid al-Adha', `${hm} = 12 && ${hd} >= 10 && ${hd} <= 13`);
    }

    const src = hijriLayer ? '_WithHijri' : '_Dates';
    colCount = L.length + 1 + hijriCols;
    return `${tableName()} =
-- DAX calendar table generated by dataarcus.com/tools/dax-calendar-table-generator.html
-- ${iso(s)} to ${iso(e)} · week starts ${ {sun: 'Sunday', mon: 'Monday', sat: 'Saturday'}[state.week] } · weekend ${state.weekend}${state.fiscal ? ' · fiscal year starts month ' + fy : ''}
VAR _Dates = CALENDAR ( DATE ( ${state.start.split('-').map(Number).join(', ')} ), DATE ( ${state.end.split('-').map(Number).join(', ')} ) )
${hijriVar}${hijriLayer}RETURN
    ADDCOLUMNS (
        ${src},
${L.join(',\n')}
    )`;
  };

  // ---------- preview (same logic in JS) ----------
  const previewRows = () => {
    const s = parse(state.start), e = parse(state.end);
    // Show the first Ramadan in range if Hijri is on, otherwise the first days
    let t0 = s;
    if (state.hijri && hijriFmt) { for (let t = s; t <= e; t += DAY) { const h = hijri(t); if (h.month === 9 && h.day === 1) { t0 = t - 2 * DAY; break; } } }
    const rows = [];
    for (let k = 0; k < 7 && t0 + k * DAY <= e; k++) {
      const t = t0 + k * DAY, d = new Date(t), wd = d.getUTCDay() + 1;
      const h = state.hijri && hijriFmt ? hijri(t) : null;
      rows.push({ date: iso(t), day: DAYS[state.lang][wd - 1], weekend: WEEKENDS[state.weekend].includes(wd),
        hijri: h ? `${h.day} ${HIJRI[state.lang][h.month - 1]} ${h.year}` : '', ramadan: h ? h.month === 9 : false });
    }
    return rows;
  };
  const ramadanList = () => {
    if (!state.hijri || !hijriFmt) return [];
    const s = parse(state.start), e = parse(state.end), out = [];
    let cur = null;
    for (let t = s; t <= e; t += DAY) { const h = hijri(t);
      if (h.month === 9) { if (!cur) cur = { y: h.year, a: t, b: t }; else cur.b = t; } else if (cur) { out.push(cur); cur = null; } }
    if (cur) out.push(cur);
    return out;
  };
  const fmt = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  // ---------- render ----------
  const render = () => {
    const s = parse(state.start), e = parse(state.end);
    const bad = !(s && e) || e < s || (e - s) / DAY > 365 * 60;
    $('err').textContent = bad ? 'End date must be after the start date (max 60 years).' : '';
    if (bad) return;
    const dax = buildDax();
    $('dax').textContent = dax;
    $('stats').textContent = `${Math.round((e - s) / DAY) + 1} rows · ${colCount} columns`;
    const rows = previewRows();
    $('preview').innerHTML = `<table class="tg-table"><tr><th>Date</th><th>Day</th>${state.hijri ? '<th>Hijri date</th><th>Ramadan</th>' : ''}<th>Weekend</th></tr>${rows.map((r) =>
      `<tr${r.ramadan ? ' class="ram"' : ''}><td>${r.date}</td><td>${r.day}</td>${state.hijri ? `<td>${r.hijri}</td><td>${r.ramadan ? '✓' : ''}</td>` : ''}<td>${r.weekend ? '✓' : ''}</td></tr>`).join('')}</table>`;
    const rl = ramadanList();
    $('ramadan').innerHTML = state.hijri ? (rl.length ? rl.map((r) => `<span class="cg-chip">Ramadan ${r.y}: ${fmt(r.a)} to ${fmt(r.b)}</span>`).join('') : '<span class="text-white-50 small">No Ramadan in this range.</span>') : '';
    $('ramWrap').style.display = state.hijri ? '' : 'none';
    save();
  };

  // ---------- wiring ----------
  const bind = (id, key, cast = (v) => v) => {
    const el = $(id); if (!el) return;
    if (el.type === 'checkbox') el.checked = !!state[key]; else el.value = state[key];
    el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => { state[key] = el.type === 'checkbox' ? el.checked : cast(el.value); render(); });
  };
  bind('cgName', 'name'); bind('cgStart', 'start'); bind('cgEnd', 'end'); bind('cgFy', 'fy', Number);
  bind('cgWeek', 'week'); bind('cgWeekend', 'weekend'); bind('cgLang', 'lang');
  bind('cgHijri', 'hijri'); bind('cgFiscal', 'fiscal'); bind('cgRel', 'relative');
  if (!hijriFmt) { $('cgHijri').checked = false; $('cgHijri').disabled = true; state.hijri = false; $('hijriNote').textContent = 'Your browser does not support Hijri dates. Try Chrome, Edge or Safari.'; }

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  $('copyBtn').addEventListener('click', () => {
    const text = $('dax').textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('dax')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Selected. Press Ctrl+C to copy'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast('DAX copied. Paste it in New table'), fallback); else fallback();
    track('calendar_copy', { hijri: state.hijri, week: state.week, weekend: state.weekend, fiscal_start: state.fy });
  });
  $('dlBtn').addEventListener('click', () => {
    const blob = new Blob([$('dax').textContent], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = tableName().toLowerCase().replace(/\s+/g, '-') + '-table.dax';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Downloaded'); track('calendar_download', { hijri: state.hijri });
  });
  document.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
    const p = b.dataset.quick;
    if (p === 'uae') Object.assign(state, { week: 'mon', weekend: 'sat-sun', hijri: true });
    if (p === 'ksa') Object.assign(state, { week: 'sun', weekend: 'fri-sat', hijri: true });
    if (p === 'egypt') Object.assign(state, { week: 'sat', weekend: 'fri-sat', hijri: true });
    if (p === 'global') Object.assign(state, { week: 'mon', weekend: 'sat-sun', hijri: false });
    ['cgWeek', 'cgWeekend'].forEach((id) => { $(id).value = state[id === 'cgWeek' ? 'week' : 'weekend']; });
    $('cgHijri').checked = state.hijri;
    render(); track('calendar_preset', { preset: p });
  }));
  render();
});
