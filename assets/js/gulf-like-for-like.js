/*
 * DataArcus - the Gulf like-for-like page (0.3.3 IX4; tools/gulf-like-for-like.html): is this month like the same
 * month last year? For a year, a month and a Gulf country it says, for the month and the same month a year before,
 * the Ramadan, Eid al-Fitr and Eid al-Adha days, the weekend days and which days they are, and the standard VAT rate,
 * and whether the two are like for like in IX1's words ("are not like for like", never "wrong"). Every count is
 * gulf-compare.js's (monthsCompared for the verdict, as check_report's likeForLike says it; monthOn for one month);
 * every date is gulf-dates.js's. Nothing is uploaded, requested or stored: the page reads its selects and writes text.
 *   answer({ year, month, country })  -> { known, like, verdict, rows, dates, estimated, note } (pure, Node too)
 *   overview({ year, country })       -> the 12 months of a year, each like for like or not (pure)
 *   DIFFER                            the dates where the two families of published Umm al-Qura tables differ by a day
 *                                     ('<Hijri year>:<ramadan|fitr|adha>'); empty: .NET's UmAlQuraCalendar and ICU
 *                                     agree on every estimate gulf-dates.js holds (scripts/tests/fixtures/umalqura-dotnet.json)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./gulf-dates.js'), require('./gulf-compare.js'));
  else {
    root.DataArcusGulfLikeForLike = factory(root.DataArcusGulfDates, root.DataArcusGulfCompare);
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => root.DataArcusGulfLikeForLike.init(document));
      else root.DataArcusGulfLikeForLike.init(document);
    }
  }
})(typeof self !== 'undefined' ? self : this, function (GD, GC) {
  'use strict';
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const COUNTRIES = [['uae', 'United Arab Emirates'], ['ksa', 'Saudi Arabia'], ['qat', 'Qatar'], ['kwt', 'Kuwait'], ['bhr', 'Bahrain'], ['omn', 'Oman'], ['shj', 'Sharjah (government)']];
  const DIFFER = [];
  const DAY = 864e5;
  const T = (s) => Date.parse(s + 'T00:00:00Z');
  const long = (s) => { const d = new Date(T(s)); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const days = (list) => list.map((l) => (Array.isArray(l) ? l.join(' + ') : l)).join(', then ');
  const pct = (list) => list.map((r) => r + '%').join(', then ');
  const SIGHTING = 'The real start of each Ramadan and Eid is announced after the moon is sighted, and may differ by a day from the estimate.';

  // the dates gulf-dates.js holds for the Hijri events that touch either month, each announced or an estimate
  function datesFor(country, months) {
    const out = [], touches = (a, b) => months.some((m) => a <= m.last && b >= m.first);
    const status = (e, k) => ((e.estimate || []).indexOf(k) < 0 ? 'announced' : DIFFER.indexOf(`${e.hijriYear}:${k}`) >= 0 ? 'estimate: published tables differ by a day' : 'estimate');
    GC.eventsOf(country).forEach((e) => {
      const rEnd = e.fitr ? T(e.fitr) - DAY : T(e.ramadan) + 28 * DAY;
      if (touches(T(e.ramadan), rEnd)) out.push({ what: `Ramadan ${e.hijriYear} began`, date: e.ramadan, long: long(e.ramadan), status: status(e, 'ramadan') });
      if (e.fitr && touches(T(e.fitr), T(e.fitr) + (GC.FITR_DAYS - 1) * DAY)) out.push({ what: `Eid al-Fitr ${e.hijriYear}`, date: e.fitr, long: long(e.fitr), status: status(e, 'fitr') });
      if (e.adha && touches(T(e.adha), T(e.adha) + (GC.ADHA_DAYS - 1) * DAY)) out.push({ what: `Eid al-Adha ${e.hijriYear}`, date: e.adha, long: long(e.adha), status: status(e, 'adha') });
    });
    return out.sort((a, b) => (a.date < b.date ? -1 : 1));
  }

  function answer(o) {
    o = o || {};
    const year = Number(o.year), month = Number(o.month), country = o.country || 'uae';
    const name = MONTHS[month - 1] || '?', base = { year, month, country, rows: [], dates: [], estimated: null, like: null };
    const c = GC.monthsCompared({ year, back: 12, country });
    if (!c.known || !MONTHS[month - 1]) {
      return Object.assign(base, { known: false, verdict: `Not known: ${c.why || 'pick a month.'} ${name} ${year} against ${name} ${year - 1} cannot be compared yet.`, note: '' });
    }
    const r = c.months[month - 1], A = GC.monthOn({ year, month, country }), B = GC.monthOn({ year: year - 1, month, country });
    const rows = [
      { key: 'ramadan', label: 'Ramadan days', pair: r.ramadan },
      { key: 'fitr', label: 'Eid al-Fitr days', pair: r.fitr },
      { key: 'adha', label: 'Eid al-Adha days', pair: r.adha },
      { key: 'weekendDays', label: 'Weekend days', pair: [A.weekendDays, B.weekendDays] },
      { key: 'weekend', label: 'Weekend', pair: [days(A.weekend), days(B.weekend)] }
    ];
    if (A.vat) rows.push({ key: 'vat', label: 'Standard VAT rate', pair: [pct(A.vat), pct(B.vat)] });
    rows.forEach((x) => { x.differs = String(x.pair[0]) !== String(x.pair[1]); });
    const a = `${name} ${year}`, b = `${name} ${year - 1}`, why = [];
    rows.slice(0, 3).forEach((x) => { if (x.differs) why.push(`${x.label}: ${x.pair[0]} against ${x.pair[1]}`); });
    if (r.weekend) why.push(`the weekend: ${days([r.weekend[0]])} against ${days([r.weekend[1]])}`);
    if (r.vat) why.push(`the standard VAT rate: ${pct(r.vat[0])} against ${pct(r.vat[1])}`);
    let verdict;
    if (r.differs) verdict = `${a} and ${b} are not like for like in the Gulf (${why.join('; ')}).`;
    else {
      verdict = `${a} and ${b} are like for like on the Gulf calendar: the same Ramadan, Eid al-Fitr and Eid al-Adha days, the same weekend${A.vat ? ' and VAT rate' : ''}.`;
      if (A.weekendDays !== B.weekendDays) verdict += ` ${a} holds ${A.weekendDays} weekend days against ${B.weekendDays}: the days of the week fall differently each year.`;
    }
    const estimated = !!(A.estimated || B.estimated);
    const dates = datesFor(country, [[year, month], [year - 1, month]].map(([y, m]) => ({ first: Date.UTC(y, m - 1, 1), last: Date.UTC(y, m, 0) })));
    const note = estimated ? `A day counted here is an estimate (a date after ${long(GC.CHECKED)}, the last date announced in DataArcus's table, comes from the Umm al-Qura calendar). ${SIGHTING}` : '';
    return Object.assign(base, { known: true, like: !r.differs, verdict, rows, dates, estimated, note, against: B.month, monthKey: A.month });
  }

  // the 12 months of a year against the same months a year before (monthsCompared), for the page's overview
  function overview(o) {
    const c = GC.monthsCompared({ year: Number(o && o.year), back: 12, country: (o && o.country) || 'uae' });
    return c.known ? c.months.map((r, i) => ({ month: i + 1, name: MONTHS[i], ramadan: r.ramadan, fitr: r.fitr, adha: r.adha, like: !r.differs, estimated: r.estimated })) : [];
  }

  // the page: three selects, the verdict, the rows, the dates used, the year's overview; text only (no HTML from data)
  function init(doc) {
    const $ = (id) => doc.getElementById(id);
    const year = $('lfYear'), month = $('lfMonth'), country = $('lfCountry');
    if (!year || !month || !country) return;
    const el = (tag, text, cls) => { const e = doc.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
    const opt = (v, t) => { const e = el('option', t); e.value = String(v); return e; };
    for (let y = GC.RANGE.first; y <= GC.RANGE.last + 2; y++) year.appendChild(opt(y, String(y)));
    MONTHS.forEach((m, i) => month.appendChild(opt(i + 1, m)));
    COUNTRIES.forEach(([v, t]) => country.appendChild(opt(v, t)));
    const now = new Date(), y0 = now.getUTCFullYear();
    year.value = String(y0 >= GC.RANGE.first + 1 && y0 <= GC.RANGE.last ? y0 : GC.RANGE.last);
    month.value = String(now.getUTCMonth() + 1);
    country.value = 'uae';
    function show() {
      const r = answer({ year: +year.value, month: +month.value, country: country.value });
      const v = $('lfVerdict');
      v.textContent = r.verdict;
      v.className = 'lf-verdict ' + (r.known ? (r.like ? 'like' : 'unlike') : 'unknown');
      $('lfDetail').hidden = !r.known;
      $('lfNote').textContent = r.note;
      const head = $('lfHead'), rows = $('lfRows'), dates = $('lfDates'), over = $('lfYearRows');
      head.textContent = ''; rows.textContent = ''; dates.textContent = ''; over.textContent = '';
      $('lfYearTitle').textContent = r.known ? `Every month of ${r.year} against ${r.year - 1}` : '';
      $('lfYearWrap').hidden = !r.known;
      if (!r.known) return;
      const name = MONTHS[r.month - 1];
      [['', 'th'], [`${name} ${r.year}`, 'th'], [`${name} ${r.year - 1}`, 'th']].forEach(([t, tag]) => head.appendChild(el(tag, t)));
      r.rows.forEach((x) => { const tr = el('tr', undefined, x.differs ? 'differs' : ''); tr.appendChild(el('th', x.label)); x.pair.forEach((p) => tr.appendChild(el('td', String(p)))); rows.appendChild(tr); });
      if (!r.dates.length) dates.appendChild(el('li', 'No Ramadan or Eid day falls in either month.'));
      r.dates.forEach((d) => { const li = el('li'); li.appendChild(el('span', `${d.what}: `)); li.appendChild(el('b', d.long)); li.appendChild(el('span', ` (${d.status})`, d.status === 'announced' ? 'lf-ok' : 'lf-est')); dates.appendChild(li); });
      overview({ year: r.year, country: r.country }).forEach((m) => {
        const tr = el('tr', undefined, (m.like ? '' : 'differs') + (m.month === r.month ? ' on' : ''));
        tr.dataset.month = String(m.month); tr.tabIndex = 0;
        tr.appendChild(el('th', m.name));
        [m.ramadan, m.fitr, m.adha].forEach((p) => tr.appendChild(el('td', `${p[0]} / ${p[1]}`)));
        tr.appendChild(el('td', (m.like ? 'like for like' : 'not like for like') + (m.estimated ? ' (estimate)' : '')));
        over.appendChild(tr);
      });
    }
    const go = (m) => { month.value = m; show(); };
    $('lfYearRows').addEventListener('click', (e) => { const tr = e.target.closest('tr[data-month]'); if (tr) go(tr.dataset.month); });
    $('lfYearRows').addEventListener('keydown', (e) => { const tr = e.target.closest('tr[data-month]'); if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); go(tr.dataset.month); } });
    [year, month, country].forEach((s) => s.addEventListener('change', show));
    $('lfChecked').textContent = long(GC.CHECKED);
    show();
  }

  return { answer, overview, init, DIFFER, MONTHS, COUNTRIES };
});
