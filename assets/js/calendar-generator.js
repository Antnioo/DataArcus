/*
 * DataArcus - DAX Calendar Table Generator (with Hijri dates)
 * Builds a DAX calculated table: Gregorian, fiscal, relative and Hijri
 * (Umm al-Qura) columns, Ramadan and Eid flags, and GCC weekends.
 * Hijri month starts are computed in the browser with Intl and embedded
 * in the DAX as a small DATATABLE, so the result needs no external data.
 * Options from the Gulf Calendar pack (gulf-dates.js): the UAE's announced Ramadan and Eid dates, and each GCC
 * country's weekend with the dates it changed. With them off, the table is what it was before.
 * The table's rules are a shared module (DataArcusCalendar in the browser, require() in Node): the MCP's
 * add_gulf_calendar builds the same table from it; the page below only wires the form.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gulf-dates.js'));
  else root.DataArcusCalendar = factory(root.DataArcusGulfDates || null);
})(typeof self !== 'undefined' ? self : this, function (GD) {
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
  const COUNTRY = (GD && GD.weekends) || {};
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // ---------- Hijri (Umm al-Qura) via Intl ----------
  let hijriFmt = null;
  try { hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); } catch (e) { hijriFmt = null; }
  const hijri = (t) => {
    const o = {}; hijriFmt.formatToParts(new Date(t)).forEach((p) => { if (p.type === 'day' || p.type === 'month' || p.type === 'year') o[p.type] = parseInt(p.value, 10); });
    return o;
  };
  const DAY = 864e5;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  // the year as typed: Date.UTC alone would read 0025 as 1925, while DAX's DATE reads 25 as 2025
  const parse = (s) => { const [y, m, d] = String(s).split('-').map(Number); const t = new Date(Date.UTC(2000, m - 1, d)); t.setUTCFullYear(y); return t.getTime(); };
  // Power BI's DATE takes 1 March 1900 to 31 December 9999 (Microsoft Learn, DATE function)
  const MIN_DATE = Date.UTC(1900, 2, 1), MAX_DATE = Date.UTC(9999, 11, 31);
  const addYears = (t, n) => { const d = new Date(t); return Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()); };
  const hijriMonthStarts = (st, from, to) => {
    const out = [];
    for (let t = from - 40 * DAY; t <= to; t += DAY) { const h = hijri(t); if (h.day === 1) out.push({ t, y: h.year, m: h.month }); }
    if (!observedOn(st)) return out;
    // Ramadan, Shawwal and Dhu al-Hijjah start on the announced dates (Dhu al-Hijjah 9 days before Eid al-Adha)
    const moved = {};
    GD.events.forEach((ev) => {
      if (ev.ramadan) moved[ev.hijriYear + '-9'] = parse(ev.ramadan);
      if (ev.fitr) moved[ev.hijriYear + '-10'] = parse(ev.fitr);
      if (ev.adha) moved[ev.hijriYear + '-12'] = parse(ev.adha) - 9 * DAY;
    });
    return out.map((h) => (moved[h.y + '-' + h.m] !== undefined ? { ...h, t: moved[h.y + '-' + h.m] } : h));
  };
  // a date's Hijri year, month and day from a list of month starts, the way the generated DAX finds them
  const hijriFrom = (starts) => (t) => {
    let lo = 0, hi = starts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid].t <= t) lo = mid; else hi = mid - 1; }
    const s = starts[lo]; return { year: s.y, month: s.m, day: Math.round((t - s.t) / DAY) + 1, start: s.t };
  };

  // ---------- settings: the page's state, or the MCP's add_gulf_calendar ----------
  // arabicNames (round 12b, the owner's ask, 6 Oct 2026): "Day Name (Arabic)", "Month Name (Arabic)" and "Hijri Month
  // Name (Arabic)" beside the English names, so a bilingual model shows Arabic names on Arabic pages. On for a new
  // table; a table saved before the option keeps its columns (the page reads a save without it as off).
  const DEFAULTS = { name: 'Calendar', start: '2022-01-01', end: '2027-12-31', fy: 1, week: 'sun', weekend: 'sat-sun', lang: 'en', hijri: true, fiscal: true, relative: true, observed: false, arabicNames: true };
  // the Arabic name columns: written when the names are not Arabic already
  const ARABIC = { day: 'Day Name (Arabic)', month: 'Month Name (Arabic)', hijri: 'Hijri Month Name (Arabic)' };
  const arabicOn = (st) => !!st.arabicNames && st.lang !== 'ar';
  // the announced dates apply only to the Hijri columns
  const observedOn = (st) => !!(st.observed && st.hijri && hijriFmt && GD);
  const dateDax = (s) => `DATE ( ${s.split('-').map(Number).join(', ')} )`;
  // the weekend days of a date (WEEKDAY type 1 numbers): a country's rule for that date, or the fixed weekend
  const weekendDays = (st, t) => {
    if (!own(COUNTRY, st.weekend)) return WEEKENDS[st.weekend];
    let days = null; COUNTRY[st.weekend].forEach((r) => { if (r.from === null || parse(r.from) <= t) days = r.days; });
    return days;
  };
  // the same in DAX: the newest rule first, each older one in the IF's else branch
  const weekendDax = (st) => {
    const inDays = (d) => `WEEKDAY ( [Date], 1 ) IN { ${d.join(', ')} }`;
    if (!own(COUNTRY, st.weekend)) return inDays(WEEKENDS[st.weekend]);
    const nest = (rules) => (rules.length === 1 ? inDays(rules[0].days)
      : `IF ( [Date] >= ${dateDax(rules[rules.length - 1].from)}, ${inDays(rules[rules.length - 1].days)}, ${nest(rules.slice(0, -1))} )`);
    return nest(COUNTRY[st.weekend]);
  };

  const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  const sw = (expr, list, offset = 1) => `SWITCH ( ${expr}, ${list.map((v, i) => `${i + offset}, ${q(v)}`).join(', ')} )`;
  // letters and digits of any script (an Arabic name like تقويم is a valid table name), spaces and _
  const tableName = (st) => (st.name || 'Calendar').replace(/[^\p{L}\p{M}\p{N}_ ]/gu, '').trim() || 'Calendar';

  // ---------- DAX builder ----------
  // the table for these settings: its DAX (as the page shows it), its column names in order, and its row count
  const build = (st) => {
    const s = parse(st.start), e = parse(st.end);
    const lang = st.lang, fy = +st.fy;
    const L = [], names = []; const col = (name, expr) => { names.push(name); L.push(`        ${q(name)}, ${expr}`); };
    // day-of-week number depending on week start (1 = first day of the week)
    const dow = st.week === 'mon' ? 'WEEKDAY ( [Date], 2 )' : st.week === 'sat' ? 'MOD ( WEEKDAY ( [Date], 1 ), 7 ) + 1' : 'WEEKDAY ( [Date], 1 )';

    col('Year', 'YEAR ( [Date] )');
    col('Quarter', '"Q" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    col('Year Quarter', 'YEAR ( [Date] ) & " Q" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    col('Month Number', 'MONTH ( [Date] )');
    col('Month Name', sw('MONTH ( [Date] )', MONTHS[lang]));
    if (arabicOn(st)) col(ARABIC.month, sw('MONTH ( [Date] )', MONTHS.ar));
    col('Month Short', lang === 'en' ? sw('MONTH ( [Date] )', MONTHS.en.map((m) => m.slice(0, 3))) : sw('MONTH ( [Date] )', MONTHS.ar));
    col('Year Month', 'FORMAT ( [Date], "YYYY-MM" )');
    col('Year Month Sort', 'YEAR ( [Date] ) * 100 + MONTH ( [Date] )');
    col('Day', 'DAY ( [Date] )');
    col('Day of Week', dow);
    col('Day Name', sw('WEEKDAY ( [Date], 1 )', DAYS[lang]));
    // (round 18, the owner's yes, 6 Oct 2026: "Sun" ... "Sat" for column charts, whose full day names slant; English
    // only: the Arabic day names are short already)
    if (lang === 'en') col('Day Short', sw('WEEKDAY ( [Date], 1 )', DAYS.en.map((d) => d.slice(0, 3))));
    if (arabicOn(st)) col(ARABIC.day, sw('WEEKDAY ( [Date], 1 )', DAYS.ar));
    col('Week Start', `[Date] - ( ${dow} ) + 1`);
    col('ISO Week', 'WEEKNUM ( [Date], 21 )');
    col('Is Weekend', weekendDax(st));
    col('Is Working Day', `NOT ( ${weekendDax(st)} )`);
    if (st.weekend === 'uae' && GD) col('Is After UAE Weekend Change', `[Date] >= ${dateDax(GD.uaeWeekendChange)}`);
    if (st.fiscal && fy !== 1) {
      col('Fiscal Year', `"FY" & ( YEAR ( [Date] ) + IF ( MONTH ( [Date] ) >= ${fy}, 1, 0 ) )`);
      col('Fiscal Month Number', `MOD ( MONTH ( [Date] ) - ${fy}, 12 ) + 1`);
      col('Fiscal Quarter', `"FQ" & ROUNDUP ( ( MOD ( MONTH ( [Date] ) - ${fy}, 12 ) + 1 ) / 3, 0 )`);
    } else if (st.fiscal) {
      col('Fiscal Year', '"FY" & YEAR ( [Date] )');
      col('Fiscal Month Number', 'MONTH ( [Date] )');
      col('Fiscal Quarter', '"FQ" & ROUNDUP ( MONTH ( [Date] ) / 3, 0 )');
    }
    if (st.relative) {
      col('Day Offset', 'INT ( [Date] - TODAY () )');
      col('Month Offset', '( YEAR ( [Date] ) - YEAR ( TODAY () ) ) * 12 + MONTH ( [Date] ) - MONTH ( TODAY () )');
      col('Year Offset', 'YEAR ( [Date] ) - YEAR ( TODAY () )');
      col('Is Past', '[Date] < TODAY ()');
    }

    let hijriVar = '', hijriLayer = '', hijriCols = 0;
    if (st.hijri && hijriFmt) {
      const starts = hijriMonthStarts(st, s, e);
      hijriVar = `${observedOn(st) ? `-- Hijri month starts: Umm al-Qura, with Ramadan, Shawwal and Dhu al-Hijjah moved to the dates the UAE announced
-- (checked to ${GD.checked}; later ones are Umm al-Qura estimates). Sources: github.com/Antnioo/DataArcus, scripts/gulf-calendar/DATES-SOURCES.md` : '-- Umm al-Qura Hijri month starts, generated by dataarcus.com'}
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
      if (arabicOn(st)) col(ARABIC.hijri, sw(hm, HIJRI.ar));
      col('Hijri Date', `${hd} & " " & ${sw(hm, HIJRI[lang])} & " " & ${hy}`);
      col('Hijri Year Month Sort', `${hy} * 100 + ${hm}`);
      col('Is Ramadan', `${hm} = 9`);
      col('Ramadan Day', `IF ( ${hm} = 9, ${hd} )`);
      col('Is Eid al-Fitr', `${hm} = 10 && ${hd} <= 3`);
      col('Is Eid al-Adha', `${hm} = 12 && ${hd} >= 10 && ${hd} <= 13`);
      // Ramadan and Eid days whose month starts after the last checked announcement: Umm al-Qura's estimate
      if (observedOn(st)) col('Is Estimated Date', `( ${hm} = 9 || ( ${hm} = 10 && ${hd} <= 3 ) || ( ${hm} = 12 && ${hd} >= 10 && ${hd} <= 13 ) ) && [Hijri Month Start] > ${dateDax(GD.checked)}`);
    }

    const src = hijriLayer ? '_WithHijri' : '_Dates';
    const dax = `${tableName(st)} =
-- DAX calendar table generated by dataarcus.com/tools/dax-calendar-table-generator.html
-- ${iso(s)} to ${iso(e)} · week starts ${ {sun: 'Sunday', mon: 'Monday', sat: 'Saturday'}[st.week] } · weekend ${st.weekend}${st.fiscal ? ' · fiscal year starts month ' + fy : ''}${observedOn(st) ? ' · Ramadan and Eid as announced in the UAE' : ''}
VAR _Dates = CALENDAR ( DATE ( ${st.start.split('-').map(Number).join(', ')} ), DATE ( ${st.end.split('-').map(Number).join(', ')} ) )
${hijriVar}${hijriLayer}RETURN
    ADDCOLUMNS (
        ${src},
${L.join(',\n')}
    )`;
    const columns = ['Date'].concat(hijriCols ? ['Hijri Month Start', 'Hijri Year', 'Hijri Month Number', 'Hijri Day'] : [], names);
    return { dax, columns, rows: Math.round((e - s) / DAY) + 1 };
  };

  // the Hijri date the preview shows: the browser's Umm al-Qura, or the table's month starts with announced dates
  const hijriFor = (st) => (observedOn(st) ? hijriFrom(hijriMonthStarts(st, parse(st.start), parse(st.end))) : hijri);

  return { MONTHS, DAYS, HIJRI, ARABIC, arabicOn, WEEKENDS, COUNTRY, GD, DAY, DEFAULTS, MIN_DATE, MAX_DATE, own, iso, parse, addYears, hijriFmt, hijri, hijriFrom, hijriMonthStarts, hijriFor,
    observedOn, weekendDays, tableName, build };
});

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);
  const track = (name, params) => { if (typeof window.dataArcusTrack === 'function') window.dataArcusTrack(name, params); };
  const STORE = 'dataarcus-calendar-generator';
  const isAr = () => document.documentElement.lang === 'ar';
  const L = (en, ar) => (isAr() ? ar : en);

  const C = window.DataArcusCalendar;
  const { MONTHS, DAYS, HIJRI, WEEKENDS, COUNTRY, GD, DAY, MIN_DATE, MAX_DATE, own, iso, parse, addYears, hijriFmt } = C;

  // ---------- state ----------
  const DEFAULTS = C.DEFAULTS;
  let state;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { saved = null; }
  // keep only saved values of the right type and range, so an old or hand-edited save cannot break the page
  if (saved && typeof saved === 'object') {
    const ok = { start: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v), end: (v) => /^\d{4}-\d{2}-\d{2}$/.test(v), fy: (v) => Number.isInteger(v) && v >= 1 && v <= 12,
      week: (v) => ['sun', 'mon', 'sat'].includes(v), weekend: (v) => own(WEEKENDS, v) || own(COUNTRY, v), lang: (v) => own(MONTHS, v) };
    saved = Object.fromEntries(Object.entries(saved).filter(([k, v]) => own(DEFAULTS, k) && typeof v === typeof DEFAULTS[k] && (!ok[k] || ok[k](v))));
  } else saved = null;
  // First visit in Arabic: default the month and day names to Arabic too
  state = { ...DEFAULTS, ...(saved ? {} : { lang: (isAr() || (() => { try { return localStorage.getItem('dataarcus-lang') === 'ar'; } catch (e) { return false; } })()) ? 'ar' : 'en' }), ...(saved || {}) };
  // a table saved before the Arabic name columns existed keeps its columns (round 12b)
  if (saved && !own(saved, 'arabicNames')) state.arabicNames = false;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } };
  // the table's rules live in the shared module (the MCP's add_gulf_calendar builds the same table)
  const observedOn = () => C.observedOn(state);
  const weekendDays = (t) => C.weekendDays(state, t);
  const tableName = () => C.tableName(state);

  // ---------- preview (same logic in JS) ----------
  const hijriFor = () => C.hijriFor(state);
  const previewRows = () => {
    const s = parse(state.start), e = parse(state.end), hijri = hijriFor();
    // Show the first Ramadan in range if Hijri is on, otherwise the first days
    let t0 = s;
    if (state.hijri && hijriFmt) { for (let t = s; t <= e; t += DAY) { const h = hijri(t); if (h.month === 9 && h.day === 1) { t0 = t - 2 * DAY; break; } } }
    const rows = [];
    for (let k = 0; k < 7 && t0 + k * DAY <= e; k++) {
      const t = t0 + k * DAY, d = new Date(t), wd = d.getUTCDay() + 1;
      const h = state.hijri && hijriFmt ? hijri(t) : null;
      rows.push({ date: iso(t), day: DAYS[state.lang][wd - 1], weekend: weekendDays(t).includes(wd),
        hijri: h ? `${h.day} ${HIJRI[state.lang][h.month - 1]} ${h.year}` : '', ramadan: h ? h.month === 9 : false });
    }
    return rows;
  };
  const ramadanList = () => {
    if (!state.hijri || !hijriFmt) return [];
    const s = parse(state.start), e = parse(state.end), out = [], hijri = hijriFor();
    let cur = null;
    for (let t = s; t <= e; t += DAY) { const h = hijri(t);
      if (h.month === 9) { if (!cur) cur = { y: h.year, a: t, b: t }; else cur.b = t; } else if (cur) { out.push(cur); cur = null; } }
    if (cur) out.push(cur);
    return out;
  };
  const fmt = (t) => new Date(t).toLocaleDateString(isAr() ? 'ar-u-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  // ---------- render ----------
  const render = () => {
    const s = parse(state.start), e = parse(state.end);
    // 1970-01-01 is timestamp 0, so test for NaN rather than falsy; 60 calendar years, leap days included
    const outside = !Number.isNaN(s) && !Number.isNaN(e) && (s < MIN_DATE || e < MIN_DATE || s > MAX_DATE || e > MAX_DATE);
    const bad = Number.isNaN(s) || Number.isNaN(e) || outside || e < s || e >= addYears(s, 60);
    const msg = outside ? L('Use four-digit years: Power BI dates run from 1 March 1900 to 31 December 9999 (a year typed as 25 would be read as 2025 by Power BI).', 'استخدم سنوات من أربعة أرقام: تواريخ Power BI من 1 مارس 1900 إلى 31 ديسمبر 9999 (السنة المكتوبة 25 يقرؤها Power BI على أنها 2025).')
      : bad ? L('End date must be after the start date (max 60 years).', 'يجب أن يكون تاريخ النهاية بعد تاريخ البداية (بحد أقصى 60 عامًا).') : '';
    $('err').textContent = msg;
    ['copyBtn', 'dlBtn'].forEach((id) => { $(id).disabled = bad; });
    if (bad) {
      // clear the old table, so Copy and Download never hand out DAX for dates the form no longer shows;
      // the message also goes where the output was, as the form's own message can be below the fold
      $('dax').textContent = ''; $('stats').textContent = ''; $('ramadan').innerHTML = '';
      $('preview').innerHTML = `<p class="cg-err mb-0">${msg}</p>`;
      return;
    }
    const table = C.build(state), colCount = table.columns.length;
    $('dax').textContent = table.dax;
    $('stats').textContent = L(`${Math.round((e - s) / DAY) + 1} rows · ${colCount} columns`, `${Math.round((e - s) / DAY) + 1} صف · ${colCount} عمود`);
    const rows = previewRows();
    $('preview').innerHTML = `<table class="tg-table"><tr><th>${L('Date', 'التاريخ')}</th><th>${L('Day', 'اليوم')}</th>${state.hijri ? `<th>${L('Hijri date', 'التاريخ الهجري')}</th><th>${L('Ramadan', 'رمضان')}</th>` : ''}<th>${L('Weekend', 'عطلة')}</th></tr>${rows.map((r) =>
      `<tr${r.ramadan ? ' class="ram"' : ''}><td>${r.date}</td><td>${r.day}</td>${state.hijri ? `<td>${r.hijri}</td><td>${r.ramadan ? '✓' : ''}</td>` : ''}<td>${r.weekend ? '✓' : ''}</td></tr>`).join('')}</table>`;
    const rl = ramadanList();
    const est = (r) => (observedOn() && r.a > parse(GD.checked) ? L(' (estimate)', ' (تقديري)') : '');
    $('ramadan').innerHTML = state.hijri ? (rl.length ? rl.map((r) => `<span class="cg-chip">${L(`Ramadan ${r.y}: ${fmt(r.a)} to ${fmt(r.b)}`, `رمضان ${r.y}: من ${fmt(r.a)} إلى ${fmt(r.b)}`)}${est(r)}</span>`).join('') : `<span class="text-white-50 small">${L('No Ramadan in this range.', 'لا يوجد رمضان ضمن هذا النطاق.')}</span>`) : '';
    $('ramWrap').style.display = state.hijri ? '' : 'none';
    if ($('cgObserved')) $('cgObserved').disabled = !state.hijri || !hijriFmt || !GD;
    // the names are Arabic already: the Arabic name columns would repeat them
    if ($('cgArabic')) $('cgArabic').disabled = state.lang === 'ar';
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
  bind('cgHijri', 'hijri'); bind('cgFiscal', 'fiscal'); bind('cgRel', 'relative'); bind('cgObserved', 'observed'); bind('cgArabic', 'arabicNames');
  if (!hijriFmt) { $('cgHijri').checked = false; $('cgHijri').disabled = true; state.hijri = false; $('hijriNote').textContent = L('Your browser does not support Hijri dates. Try Chrome, Edge or Safari.', 'متصفحك لا يدعم التاريخ الهجري. جرّب Chrome أو Edge أو Safari.'); }

  const toast = (msg) => { const t = $('toast'); t.textContent = msg; t.style.opacity = 1; clearTimeout(toast.h); toast.h = setTimeout(() => { t.style.opacity = 0; }, 1800); };
  $('copyBtn').addEventListener('click', () => {
    const text = $('dax').textContent;
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('dax')); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); toast(L('Selected. Press Ctrl+C to copy', 'تم التحديد. اضغط Ctrl+C للنسخ')); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(L('DAX copied. Paste it in New table', 'تم نسخ DAX. الصقه في New table')), fallback); else fallback();
    track('calendar_copy', { hijri: state.hijri, week: state.week, weekend: state.weekend, fiscal_start: state.fy, observed: observedOn() });
  });
  $('dlBtn').addEventListener('click', () => {
    const blob = new Blob([$('dax').textContent], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = tableName().toLowerCase().replace(/\s+/g, '-') + '-table.dax';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(L('Downloaded', 'تم التنزيل')); track('calendar_download', { hijri: state.hijri });
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
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
});
