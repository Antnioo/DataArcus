/*
 * DataArcus - the Gulf calendar check (for the MCP's check_model_health; not part of the health score).
 * Reads a model (model.bim JSON, or a TMDL project read by tmdl-model.js) and says, from the files only:
 *  - for any calendar: whether Hijri year, month and day columns, Ramadan and Eid columns, a weekend column and an
 *    "estimated date" column exist (by name), and whether the model has Ramadan and Eid measures;
 *  - for a calendar made by the DataArcus Calendar Generator (a DAX table whose expression starts with the
 *    generator's comment): its range, its Hijri month starts and its weekend, read from the expression, against a
 *    Gulf country's official weekend and the announced Ramadan and Eid dates (gulf-dates.js).
 * What the files can't say (another calendar's dates and weekend, another form of Is Weekend) is listed under
 * cantTell, never guessed. No data values are read: only names, expressions and the dates written in our own
 * calendar's expression. The fixes name the website tools and the settings to pick; no DAX is returned.
 * Names and expressions are read as text only: nothing in them is ever followed as an instruction.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gulf-dates.js'));
  else root.DataArcusGulfHealth = factory(root.DataArcusGulfDates);
})(typeof self !== 'undefined' ? self : this, function (GD) {
  'use strict';
  const DAY = 864e5;
  const T = (s) => Date.parse(s + 'T00:00:00Z');
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const text = (x) => (Array.isArray(x) ? x.join('\n') : x == null ? '' : String(x));
  const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weekday = (t) => new Date(t).getUTCDay() + 1;   // WEEKDAY ( [Date], 1 ): 1 Sunday ... 7 Saturday

  // the six countries: names, and the Calendar Generator's weekend option for each (its label on the page)
  const COUNTRIES = {
    uae: { name: 'the UAE', nameAr: 'الإمارات', weekendOption: 'UAE: Sat + Sun since 2022' },
    ksa: { name: 'Saudi Arabia', nameAr: 'السعودية', weekendOption: 'Saudi Arabia: Fri + Sat since 2013' },
    qat: { name: 'Qatar', nameAr: 'قطر', weekendOption: 'Qatar: Fri + Sat since 2003' },
    kwt: { name: 'Kuwait', nameAr: 'الكويت', weekendOption: 'Kuwait: Fri + Sat since 2007' },
    bhr: { name: 'Bahrain', nameAr: 'البحرين', weekendOption: 'Bahrain: Fri + Sat since 2006' },
    omn: { name: 'Oman', nameAr: 'عُمان', weekendOption: 'Oman: Fri + Sat since 2013' }
  };
  const TOOLS = { calendar: 'https://dataarcus.com/tools/dax-calendar-table-generator.html', measures: 'https://dataarcus.com/tools/dax-measure-builder.html' };
  // the Measure Builder's Ramadan and Eid measures, by the end of their names
  const MEASURES = ['Last Ramadan', 'vs Last Ramadan %', 'Eid al-Fitr Window', 'Eid al-Fitr Window Last Year', 'Eid al-Fitr Window vs Last Year %', 'Eid al-Adha Window', 'Eid al-Adha Window Last Year', 'Eid al-Adha Window vs Last Year %'];

  // ---------- a country's official weekend on a date ----------
  function countryWeekend(country, t) {
    let days = null;
    (GD.weekends[country] || []).forEach((r) => { if (r.from === null || T(r.from) <= t) days = r.days; });
    return days || [];
  }

  // ---------- the generator's Is Weekend expression, as a function of the date ----------
  // Only the generator's own forms: WEEKDAY ( [Date], 1 ) IN { n, ... }, IF ( [Date] >= DATE ( y, m, d ), a, b ) and
  // NOT ( a ). Anything else gives null: "can't tell from the files".
  function weekendRule(expr) {
    const s = text(expr).replace(/\s+/g, '');
    let i = 0;
    const eat = (lit) => { if (s.startsWith(lit, i)) { i += lit.length; return true; } return false; };
    const num = () => { const m = /^\d+/.exec(s.slice(i)); if (!m) return null; i += m[0].length; return +m[0]; };
    function node(depth) {
      if (depth > 12) return null;
      if (eat('WEEKDAY([Date],1)IN{')) {
        const days = [];
        for (;;) { const n = num(); if (n == null || n < 1 || n > 7) return null; days.push(n); if (eat('}')) break; if (!eat(',')) return null; }
        return (t) => days.includes(weekday(t));
      }
      if (eat('IF([Date]>=DATE(')) {
        const y = num(); if (y == null || !eat(',')) return null;
        const m = num(); if (m == null || !eat(',')) return null;
        const d = num(); if (d == null || !eat('),')) return null;
        const a = node(depth + 1); if (!a || !eat(',')) return null;
        const b = node(depth + 1); if (!b || !eat(')')) return null;
        const from = Date.UTC(y, m - 1, d);
        return (t) => (t >= from ? a(t) : b(t));
      }
      if (eat('NOT(')) { const a = node(depth + 1); if (!a || !eat(')')) return null; return (t) => !a(t); }
      return null;
    }
    const f = node(0);
    return f && i === s.length ? f : null;
  }

  // ---------- a calendar made by the Calendar Generator, read from its expression ----------
  function readGenerated(expr) {
    const s = text(expr);
    if (!/^\s*(--|\/\/)\s*DAX calendar table generated by dataarcus\.com\/tools\/dax-calendar-table-generator\.html/.test(s)) return null;
    const out = { range: null, months: [], weekend: null, weekendText: null, columns: [] };
    const r = /CALENDAR\s*\(\s*DATE\s*\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)\s*,\s*DATE\s*\(\s*(\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})\s*\)\s*\)/.exec(s);
    if (r) { const a = Date.UTC(+r[1], +r[2] - 1, +r[3]), b = Date.UTC(+r[4], +r[5] - 1, +r[6]); if (b >= a && (b - a) / DAY < 366 * 200) out.range = { start: a, end: b }; }
    const row = /\{\s*"(\d{4}-\d{2}-\d{2})"\s*,\s*(\d{3,4})\s*,\s*(\d{1,2})\s*\}/g;
    for (let m; (m = row.exec(s));) { const t = T(m[1]); if (Number.isFinite(t)) out.months.push({ start: t, year: +m[2], month: +m[3] }); }
    s.split('\n').forEach((line) => {
      const c = /^\s*"([^"]+)",\s*(.*?),?\s*$/.exec(line);
      if (!c) return;
      out.columns.push(c[1]);
      if (c[1] === 'Is Weekend') { out.weekendText = c[2]; out.weekend = weekendRule(c[2]); }
    });
    return out;
  }

  // ---------- which columns a calendar has, by name ----------
  const NAMES = {
    hijriYear: /hijri\s*_?year|^h\s*_?year$|السنة الهجرية|سنة هجرية/i,
    hijriMonth: /hijri\s*_?month|^h\s*_?month$|الشهر الهجري|شهر هجري/i,
    hijriMonthNumber: /hijri\s*_?month\s*_?(number|no|num)\b/i,
    hijriDay: /hijri\s*_?(day|date)|^h\s*_?day$|اليوم الهجري|التاريخ الهجري/i,
    ramadan: /ramadan|رمضان/i,
    eid: /(^|[^a-z])eid([^a-z]|$)|عيد/i,
    weekend: /weekend|working\s*_?day|عطلة|يوم عمل/i,
    estimated: /estimat|تقدير/i
  };
  const ANY_GULF = /hijri|هجري|ramadan|رمضان/i;
  const has = (names, re) => names.find((n) => re.test(n)) || null;

  const tablesOf = (model) => ((model && (model.model || model)) || {}).tables || [];
  const exprOf = (t) => { const p = (t.partitions || []).find((x) => x.source && x.source.type === 'calculated'); return p ? text(p.source.expression) : null; };
  const colNames = (t) => (t.columns || []).filter((c) => c.type !== 'rowNumber').map((c) => String(c.name));
  const hidden = (t) => /^(LocalDateTable_|DateTableTemplate_)/.test(String(t.name));

  // The calendar: a table the generator made; else one marked as a date table; else one with a date key; else one
  // named like a calendar that has a date column
  function findCalendar(model) {
    const ts = tablesOf(model).filter((t) => !hidden(t));
    const dateCol = (t) => (t.columns || []).some((c) => /^(date|datekey|التاريخ)$/i.test(String(c.name)) || c.dataType === 'dateTime');
    return ts.find((t) => readGenerated(exprOf(t)))
      || ts.find((t) => t.dataCategory === 'Time')
      || ts.find((t) => (t.columns || []).some((c) => c.isKey && c.dataType === 'dateTime'))
      || ts.find((t) => /calendar|^dim\s*_?date$|^dates?$|تقويم/i.test(String(t.name)) && (dateCol(t) || exprOf(t) != null))
      || null;
  }
  // Does the model already have Hijri or Ramadan columns? (the section shows without a country only then)
  function hasGulfColumns(model) {
    return tablesOf(model).filter((t) => !hidden(t)).some((t) => colNames(t).some((n) => ANY_GULF.test(n)) || (readGenerated(exprOf(t)) || { columns: [] }).columns.some((n) => ANY_GULF.test(n)));
  }

  // Umm al-Qura, as the Calendar Generator works it out
  let UAQ = null;
  try { UAQ = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }); if (!/islamic-umalqura/.test(UAQ.resolvedOptions().calendar)) UAQ = null; } catch (e) { UAQ = null; }
  const uaq = (t) => { const o = {}; UAQ.formatToParts(new Date(t)).forEach((p) => { if (p.type === 'day' || p.type === 'month' || p.type === 'year') o[p.type] = +p.value; }); return o; };

  const EVENT = { ramadan: 'Ramadan', fitr: 'Eid al-Fitr', adha: 'Eid al-Adha' }, EVENT_AR = { Ramadan: 'رمضان', 'Eid al-Fitr': 'عيد الفطر', 'Eid al-Adha': 'عيد الأضحى' };
  const eventAr = (e) => e.replace(/^(Ramadan|Eid al-Fitr|Eid al-Adha)/, (m) => EVENT_AR[m]);
  const longDate = (t) => { const d = new Date(t); return d.getUTCDate() + ' ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };

  // opts: { country: 'uae' (default) | 'ksa' | 'qat' | 'kwt' | 'bhr' | 'omn', asOf: 'YYYY-MM-DD' (default today), maxItems: 15 }
  function analyze(model, opts) {
    const o = opts || {}, code = Object.prototype.hasOwnProperty.call(COUNTRIES, o.country) ? o.country : 'uae', C = COUNTRIES[code];
    const asOf = o.asOf && Number.isFinite(T(o.asOf)) ? T(o.asOf) : T(new Date().toISOString().slice(0, 10));
    const max = Math.max(1, Math.min(200, o.maxItems || 15));
    const findings = [], cantTell = [];
    const add = (id, level, en, ar, items, count) => findings.push({ id, level, title: en[0], why: en[1], fix: en[2], ar: { title: ar[0], why: ar[1], fix: ar[2] }, source: 'files', count: count == null ? items.length : count, items: items.slice(0, max) });
    // Which dates a country is compared with (owner 2026-10-03): the UAE and Saudi Arabia with the announced dates
    // (gulf-dates.js holds the UAE's; all of Saudi Arabia's 2018-2026 are sourced and match them: DATES-SOURCES.md).
    // Qatar, Kuwait, Bahrain and Oman have no sourced dates yet: Umm al-Qura, and a difference is only a low note.
    const uaeDates = code === 'uae' || code === 'ksa';
    const SAME = 'the UAE\'s announced dates, which match Saudi Arabia\'s for 2018-2026';
    const CHECK = 'check ' + C.name + '\'s official announcement';
    const out = {
      scored: false,
      note: 'Not part of the health score: these are checks of the calendar for a Gulf model, read from the model files only.',
      country: { code, name: C.name === 'the UAE' ? 'UAE' : C.name, nameAr: C.nameAr },
      asOf: iso(asOf),
      datesComparedWith: uaeDates
        ? { with: 'uae-announced', checked: GD.checked, note: (code === 'ksa' ? 'Ramadan and Eid dates are compared with ' + SAME + ' (scripts/gulf-calendar/DATES-SOURCES.md)' : 'Ramadan and Eid dates are compared with the dates announced in the UAE') + ', checked to ' + GD.checked + '; later dates are Umm al-Qura estimates.' }
        : { with: 'umm-al-qura', note: 'No announced Ramadan and Eid dates are sourced for ' + C.name + ' yet, so its dates are compared with the Umm al-Qura calendar. A date that differs is only a note, not an error: ' + CHECK + '.' },
      calendar: null, findings, cantTell
    };

    // the next Ramadan that has not ended by asOf
    let nextRamadan = null;
    GD.events.forEach((e) => { const end = e.fitr ? T(e.fitr) - DAY : T(e.ramadan) + 29 * DAY; if (!nextRamadan && end >= asOf) nextRamadan = { hijriYear: e.hijriYear, start: T(e.ramadan), end }; });
    const cal = findCalendar(model);
    const measures = tablesOf(model).reduce((l, t) => l.concat((t.measures || []).map((m) => String(m.name))), []);
    const lacks = MEASURES.filter((sfx) => !measures.some((n) => { const a = n.toLowerCase(), b = sfx.toLowerCase(); return a.endsWith(b) && !(sfx === 'Last Ramadan' && a.endsWith('vs last ramadan')); }));
    const anyGulfMeasure = measures.some((n) => NAMES.ramadan.test(n) || NAMES.eid.test(n));

    if (!cal) {
      add('GC_NO_CALENDAR', 'medium',
        ['No calendar table', 'Without one there is nowhere for Hijri dates, Ramadan and Eid or the weekend, so every comparison falls back to Gregorian months.', 'Add one from the DataArcus Calendar Generator (Hijri dates, announced Ramadan and Eid, your country\'s weekend), then mark it as a date table (fixes.calendarGenerator).'],
        ['لا يوجد جدول تقويم', 'بدونه لا مكان للتاريخ الهجري ولا لرمضان والعيد ولا لعطلة نهاية الأسبوع، فتعود كل مقارنة إلى الأشهر الميلادية.', 'أضف جدولًا من مولّد التقويم في داتا أركوس (التاريخ الهجري، ومواعيد رمضان والعيد المعلنة، وعطلة دولتك)، ثم علّمه كجدول تاريخ (fixes.calendarGenerator).'], []);
      out.fixes = fixes(null, null);
      return out;
    }

    const gen = readGenerated(exprOf(cal)), names = colNames(cal).concat(gen ? gen.columns : []);
    const kind = gen ? 'dataarcus-dax' : exprOf(cal) != null ? 'dax' : 'imported';
    const cols = { hijriYear: has(names, NAMES.hijriYear), hijriMonth: has(names, NAMES.hijriMonthNumber) || has(names, NAMES.hijriMonth), hijriDay: has(names, NAMES.hijriDay), ramadan: has(names, NAMES.ramadan), eid: has(names, NAMES.eid),
      weekend: has(names, NAMES.weekend), estimated: has(names, NAMES.estimated) };
    const hijri = !!(cols.hijriYear && cols.hijriMonth && cols.hijriDay), range = gen && gen.range;
    out.calendar = { table: String(cal.name), kind, range: range ? { start: iso(range.start), end: iso(range.end) } : null,
      columns: { hijriYear: cols.hijriYear, hijriMonth: cols.hijriMonth, hijriDay: cols.hijriDay, ramadan: cols.ramadan, eid: cols.eid, weekend: cols.weekend, estimatedDate: cols.estimated } };

    // --- columns ---
    if (!hijri) {
      const missing = [['Hijri Year', cols.hijriYear], ['Hijri Month Number', cols.hijriMonth], ['Hijri Day', cols.hijriDay]].filter((x) => !x[1]).map((x) => ({ missingColumn: x[0] }));
      add('GC_NO_HIJRI', 'medium',
        ['The calendar has no Hijri dates', 'Ramadan and Eid move about 11 days a year; without the Hijri year, month and day a report can only compare Gregorian months, which mixes Ramadan with ordinary days.', 'Add Hijri Year, Hijri Month Number and Hijri Day (fixes.calendarGenerator).'],
        ['التقويم بلا تاريخ هجري', 'يتحرك رمضان والعيد نحو 11 يومًا كل عام، وبدون السنة والشهر واليوم الهجري لا يقارن التقرير إلا الأشهر الميلادية، فيخلط رمضان بالأيام العادية.', 'أضف Hijri Year وHijri Month Number وHijri Day (fixes.calendarGenerator).'], missing);
    } else if (!cols.ramadan && !cols.eid) {
      add('GC_NO_FLAGS', 'low',
        ['No Ramadan or Eid columns', 'Without Is Ramadan, Ramadan Day and the Eid flags, Ramadan can\'t be compared day by day and Eid can\'t be filtered.', 'Add them (fixes.calendarGenerator).'],
        ['لا توجد أعمدة لرمضان أو العيد', 'بدون Is Ramadan وRamadan Day وعلامات العيد لا يمكن مقارنة رمضان يومًا بيوم ولا تصفية العيد.', 'أضفها (fixes.calendarGenerator).'],
        ['Is Ramadan', 'Ramadan Day', 'Is Eid al-Fitr', 'Is Eid al-Adha'].map((c) => ({ missingColumn: c })));
    }

    // --- the weekend against the country's rule ---
    if (cols.weekend) {
      if (!gen) cantTell.push({ check: 'weekend', why: 'Which days ' + cal.name + '[' + cols.weekend + '] marks is in the data, not in the model files, so it is not compared with ' + C.name + '\'s weekend.' });
      else if (!gen.weekend || !range) cantTell.push({ check: 'weekend', why: 'Is Weekend is not written in one of the Calendar Generator\'s forms (or the calendar\'s range could not be read), so it is not compared with ' + C.name + '\'s weekend.' });
      else {
        const items = []; let n = 0;
        for (let t = range.start; t <= range.end; t += DAY) {
          const inModel = !!gen.weekend(t), inCountry = countryWeekend(code, t).includes(weekday(t));
          if (inModel !== inCountry) { n++; if (items.length < max) items.push({ date: iso(t), day: WEEKDAYS[weekday(t) - 1], inTheModel: inModel ? 'weekend' : 'working day', in: inCountry ? 'weekend' : 'working day' }); }
        }
        if (n) {
          const x = items[0];
          add('GC_WEEKEND', 'high',
            ['The weekend doesn\'t match ' + C.name, 'Working-day counts and averages are wrong on ' + n + ' days, for example ' + x.day + ' ' + longDate(T(x.date)) + ' marked as a ' + x.inTheModel + '.', 'Use the ' + (C.name === 'the UAE' ? 'UAE' : C.name) + ' weekend (fixes.calendarGenerator).'],
            ['عطلة نهاية الأسبوع لا تطابق ' + C.nameAr, 'عدد أيام العمل ومتوسطاتها خاطئة في ' + n + ' يومًا، مثل ' + x.date + ' المسجل ' + (x.inTheModel === 'weekend' ? 'عطلة' : 'يوم عمل') + '.', 'استخدم عطلة ' + C.nameAr + ' (fixes.calendarGenerator).'], items, n);
        }
      }
    }

    // --- Ramadan and Eid dates ---
    if (hijri) {
      if (!gen || !gen.months.length || !range) cantTell.push({ check: 'dates', why: 'The dates of Ramadan and Eid in ' + cal.name + ' are in the data, not in the model files, so they are not compared with the ' + (uaeDates ? 'announced dates' : 'Umm al-Qura calendar') + '; nor whether future dates are marked as estimates.' });
      else {
        const startOf = (y, m) => { const r = gen.months.find((x) => x.year === y && x.month === m); return r ? r.start : null; };
        const inRange = (t) => t >= range.start && t <= range.end;
        const differ = [];
        if (uaeDates) {
          GD.events.forEach((e) => Object.keys(EVENT).forEach((k) => {
            if (!e[k]) return;
            const s = startOf(e.hijriYear, k === 'ramadan' ? 9 : k === 'fitr' ? 10 : 12); if (s == null) return;
            const inModel = k === 'adha' ? s + 9 * DAY : s, want = T(e[k]);
            if (inModel !== want && (inRange(inModel) || inRange(want))) differ.push({ event: EVENT[k] + ' ' + e.hijriYear, model: iso(inModel), announced: e[k] });
          }));
        } else if (UAQ) {
          gen.months.filter((r) => r.month === 9 || r.month === 10 || r.month === 12).forEach((r) => {
            let want = null;
            for (let t = r.start - 3 * DAY; t <= r.start + 3 * DAY; t += DAY) { const h = uaq(t); if (h.year === r.year && h.month === r.month && h.day === 1) want = t; }
            const off = r.month === 12 ? 9 * DAY : 0, k = r.month === 9 ? 'ramadan' : r.month === 10 ? 'fitr' : 'adha';
            if (want !== r.start && (inRange(r.start + off) || (want != null && inRange(want + off)))) differ.push({ event: EVENT[k] + ' ' + r.year, model: iso(r.start + off), ummAlQura: want == null ? null : iso(want + off) });
          });
        } else cantTell.push({ check: 'dates', why: 'This machine can\'t work out the Umm al-Qura calendar, so the dates were not compared.' });
        if (differ.length) {
          const x = differ[0], other = x.announced || x.ummAlQura;
          if (uaeDates) add('GC_DATES_DIFFER', 'medium',
            ['Ramadan or Eid dates differ from the announced ones', 'For example ' + x.event + ' starts on ' + longDate(T(x.model)) + ' in the model; ' + (code === 'ksa' ? 'the announced date is ' + longDate(T(other)) + ' (' + SAME + ')' : 'the UAE announced ' + longDate(T(other))) + '. Sources: scripts/gulf-calendar/DATES-SOURCES.md.', 'Use the announced dates (fixes.calendarGenerator).'],
            ['مواعيد رمضان أو العيد تختلف عن المعلنة', 'مثلًا يبدأ ' + eventAr(x.event) + ' في النموذج يوم ' + x.model + '، و' + (code === 'ksa' ? 'الموعد المعلن ' + other + ' (مواعيد الإمارات المعلنة، وهي تطابق مواعيد السعودية للأعوام 2018-2026)' : 'أعلنت الإمارات ' + other) + '. المصادر: DATES-SOURCES.md.', 'استخدم المواعيد المعلنة (fixes.calendarGenerator).'], differ);
          // no sourced dates for this country: never "wrong", only a note to check the official announcement
          else add('GC_DATES_NOTE', 'low',
            ['Ramadan or Eid dates differ from Umm al-Qura: ' + CHECK, 'For example ' + x.event + ' starts on ' + longDate(T(x.model)) + ' in the model; Umm al-Qura gives ' + (other ? longDate(T(other)) : 'another date') + '. No announced dates are sourced for ' + C.name + ' yet, so this is not an error: the moon sighting can move a date by a day.', 'Compare with ' + C.name + '\'s official announcement; keep the model\'s date if it matches.'],
            ['مواعيد رمضان أو العيد تختلف عن تقويم أم القرى: راجع الإعلان الرسمي في ' + C.nameAr, 'مثلًا يبدأ ' + eventAr(x.event) + ' في النموذج يوم ' + x.model + (other ? '، وتقويم أم القرى يعطي ' + other : '') + '. لا توجد بعد مواعيد معلنة موثَّقة لـ' + C.nameAr + '، فهذا ليس خطأ: قد تغيّر رؤية الهلال الموعد يومًا واحدًا.', 'قارن بالإعلان الرسمي في ' + C.nameAr + '، وأبقِ موعد النموذج إن طابقه.'], differ);
        }
        // future dates not marked as estimates
        if (!cols.estimated) {
          const later = [];
          GD.events.forEach((e) => Object.keys(EVENT).forEach((k) => { if (e[k] && T(e[k]) > T(GD.checked) && inRange(T(e[k]))) later.push({ event: EVENT[k] + ' ' + e.hijriYear, date: e[k] }); }));
          if (later.length) add('GC_ESTIMATES', 'info',
            ['Future Ramadan and Eid dates are not marked as estimates', 'Dates after ' + GD.checked + ' are not announced yet and can move by a day.', 'Add Is Estimated Date (fixes.calendarGenerator), and regenerate after each announcement.'],
            ['مواعيد رمضان والعيد المستقبلية غير مميَّزة كتقديرات', 'المواعيد بعد ' + GD.checked + ' لم تُعلن بعد وقد تتغير يومًا واحدًا.', 'أضف Is Estimated Date (fixes.calendarGenerator)، وأعد إنشاء التقويم بعد كل إعلان.'], later);
        }
      }
    }

    // --- the range against the next Ramadan ---
    let endsEarly = false;
    if (range && nextRamadan && range.end < nextRamadan.end) {
      endsEarly = true;
      add('GC_ENDS_EARLY', 'medium',
        ['The calendar ends before the next Ramadan', 'It ends on ' + iso(range.end) + '; Ramadan ' + nextRamadan.hijriYear + ' is expected from ' + iso(nextRamadan.start) + '.', 'Extend the calendar\'s end date (fixes.calendarGenerator).'],
        ['التقويم ينتهي قبل رمضان القادم', 'ينتهي في ' + iso(range.end) + '، ومن المتوقع أن يبدأ رمضان ' + nextRamadan.hijriYear + ' في ' + iso(nextRamadan.start) + '.', 'مدّد تاريخ نهاية التقويم (fixes.calendarGenerator).'],
        [{ calendarEnds: iso(range.end), hijriYear: nextRamadan.hijriYear, ramadanFrom: iso(nextRamadan.start), ramadanTo: iso(nextRamadan.end) }]);
    } else if (!range) cantTell.push({ check: 'range', why: 'The first and last date of ' + cal.name + ' are in the data, not in the model files, so whether it covers the next Ramadan' + (nextRamadan ? ' (' + nextRamadan.hijriYear + ', expected from ' + iso(nextRamadan.start) + ')' : '') + ' is not checked.' });

    // --- measures ---
    if (hijri && !anyGulfMeasure) {
      add('GC_NO_MEASURES', 'info',
        ['No Ramadan or Eid measures', 'Last Ramadan, vs Last Ramadan % and the Eid windows compare like with like.', 'Add them (fixes.measureBuilder).'],
        ['لا توجد مقاييس لرمضان أو العيد', 'مقاييس رمضان الماضي ونسبة التغير وفترات العيد تقارن المتماثل بالمتماثل.', 'أضفها (fixes.measureBuilder).'], lacks.map((m) => ({ missingMeasure: m })));
    }

    const ORDER = { high: 0, medium: 1, low: 2, info: 3 };
    findings.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
    out.fixes = fixes({ kind, range, hijri, endsEarly, calendarFindings: findings.some((f) => f.id !== 'GC_NO_MEASURES') }, lacks);
    return out;

    // The fixes: the website tools and the exact settings to pick. No DAX is returned, and nothing is applied.
    function fixes(c, missingMeasures) {
      const f = {};
      if (!c || c.calendarFindings) {
        const last = c && c.range ? (c.endsEarly ? new Date(nextRamadan.end).getUTCFullYear() + '-12-31' : iso(c.range.end)) : null;
        f.calendarGenerator = {
          tool: TOOLS.calendar,
          settings: {
            firstDate: c && c.range ? iso(c.range.start) : 'the first date of your data (or of your calendar today)',
            lastDate: last || 'the last date of your calendar today' + (nextRamadan ? ', and not before ' + iso(nextRamadan.end) + ' (the end of Ramadan ' + nextRamadan.hijriYear + ')' : ''),
            weekend: C.weekendOption,
            hijriDates: 'on ("Hijri dates, Ramadan and Eid")',
            announcedDates: code === 'uae' ? 'on' : code === 'ksa' ? 'on: "Announced Ramadan and Eid dates (UAE)" gives ' + SAME
              : 'your choice: "Announced Ramadan and Eid dates (UAE)" moves Ramadan and Eid to the UAE\'s announced dates. No announced dates are sourced for ' + C.name + ' yet: where a date differs from Umm al-Qura, ' + CHECK
          },
          then: 'Copy the table\'s DAX from the page. Save a copy of your file first. In Power BI Desktop add it as a new table (Modeling > New table)' + (c ? ', or replace your calendar table\'s DAX with it, then check its relationships, its sort-by columns and "Mark as date table"' : ', mark it as a date table and relate it to your dates') + '. DataArcus changes nothing in your model.'
        };
      }
      if (missingMeasures && missingMeasures.length && (!c || c.hijri || c.calendarFindings)) {
        f.measureBuilder = {
          tool: TOOLS.measures,
          tick: missingMeasures,
          needs: 'The calendar\'s Hijri Year, Hijri Month Number and Hijri Day columns' + (c && c.hijri ? '' : ' (add them first: fixes.calendarGenerator)') + '. Give the page your base measure and your calendar table\'s name, tick these measures, and copy the script into DAX query view.'
        };
      }
      return f;
    }
  }

  return { analyze, hasGulfColumns, findCalendar, readGenerated, weekendRule, countryWeekend, COUNTRIES, MEASURES };
});
