// 0.3.3 IX1 (the owner, 11 Nov, D-1111-15; mcp/work/IX1.md): like for like in the Gulf. Since IX2 (mcp/work/IX2.md)
// check_report's lens likeForLike, read through impact.mjs's reading.
// It joins three parts that never met: the number's lineage (lineage.mjs: for each visual, every measure its numbers
// pass through, with the path that reached it), the DAX calls (health-confirm.js's CF, the one reader) and DataArcus's
// own sourced Gulf dates (gulf-compare.js on gulf-dates.js). It answers, from the files only:
//   - which visuals compare with the same Gregorian dates of another period (SAMEPERIODLASTYEAR, DATEADD,
//     PARALLELPERIOD, PREVIOUS* and NEXT*), through which measure or calculation item and which chain of names;
//   - for a year the person gives, the months in which those two periods are not like for like in the Gulf: Ramadan
//     days, Eid days, a weekend or a VAT rate that changed (the calendar's facts, never the person's numbers);
//   - whether the model already has the measure that compares the same Ramadan days (the DAX Measure Builder's
//     "<base> Last Ramadan", gulf-measures.js), and the names of the ones it lacks.
//   comparisonsIn(dax)                    the comparisons one DAX text makes: [{ fn, unit, n, back, shift, dates, base }]
//   likeForLike(model, report, opts)      model: the TMSL JSON a model.bim holds; report: { files: [{ path, json }] }
//                                         (lineage.mjs's inputs); opts: { year, country } (gulf-compare.js's)
// It says "not like for like", never "wrong": whether a business's numbers move with Ramadan is the person's to know.
// Never a value: a DAX text is read for function names, a measure reference and a column reference only; a literal in
// it is never returned. Names leave through safeName (a missing like-for-like measure's name whole, to 200 characters,
// a longer one marked with its cut). Every list is capped, the rest counted. The year is the caller's: nothing here reads a date from a row,
// and no "current year" is assumed. Pure: nothing is read or written here.
import { createRequire } from 'node:module';
import { lineageOf, LISTED_MAX, WHY_MAX, TIERS } from './lineage.mjs';
import { safeName } from './read-report.mjs';
import { shownName, NAME_OUT } from './model-names.mjs';

const require = createRequire(import.meta.url);
const Parser = require('../../assets/js/dax-reference-parser.js'), Health = require('../../assets/js/model-health-engine.js');
// (0.3.3 IX2) the one DAX call reader (IX1's callsOf removed: D-1104-12)
const { CF } = require('../../assets/js/health-confirm.js');
const GC = require('../../assets/js/gulf-compare.js'), GM = require('../../assets/js/gulf-measures.js');
const { K } = require('../../assets/js/model-index.js');
export { LISTED_MAX, WHY_MAX };
// at most this many distances compared in the calendar (the most used first), the rest counted
export const CALENDAR_MAX = 4;

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const arr = (x) => (Array.isArray(x) ? x : []);
const lc = (s) => String(s == null ? '' : s).toLowerCase();
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// at most this many measure names in the sentence, the rest counted
export const NAMED_MAX = 4;

export const PROVES = 'From the files only: which visuals show a number that passes through a comparison with the same Gregorian dates of another period (a time-intelligence function in a measure the visual reaches), and, from the Ramadan, Eid, weekend and VAT dates DataArcus keeps with their sources, in which months those two periods differ.';
export const NOT_PROVED = `It runs no query and reads no data: which years the data holds and whether this business's numbers move with Ramadan, an Eid or a weekend are the person's to know. A comparison written without a time-intelligence function (a filter on a year column, an offset column) and what a DAX text builds at run time are not seen; the items of a calculation group are read on the visuals that use the group's column (a field or a filter), not where the group is applied another way. The dates are the UAE's announcements (Oman's own where they differ), checked on ${GC.CHECKED}; a later date is the Umm al-Qura calendar's estimate and a sighting can move it by a day. A weekend is the government's; a private company's can differ. Say "not like for like", never "wrong".`;

// ---- a DAX text's comparisons ----
// months in a unit (a day has none: no month is compared)
const UNITS = { year: 12, quarter: 3, month: 1, day: null };
const FIXED = { SAMEPERIODLASTYEAR: ['year', -1], PREVIOUSYEAR: ['year', -1], PREVIOUSQUARTER: ['quarter', -1], PREVIOUSMONTH: ['month', -1], PREVIOUSDAY: ['day', -1],
  NEXTYEAR: ['year', 1], NEXTQUARTER: ['quarter', 1], NEXTMONTH: ['month', 1], NEXTDAY: ['day', 1] };
const BY_ARGS = ['DATEADD', 'PARALLELPERIOD'];   // ( dates, a number, a unit )
const RUN_TIME = 'by an amount set when it runs';
const shiftOf = (unit, n) => (n === null || !unit ? RUN_TIME : `${Math.abs(n) === 1 ? 'one ' + unit : Math.abs(n) + ' ' + unit + 's'} ${n < 0 ? 'back' : 'ahead'}`);
const backSaid = (back) => (back % 12 === 0 ? shiftOf('year', -back / 12) : shiftOf('month', -back));
// the comparisons, with the base measure's own name (raw: for a look-up only, never returned)
function scan(dax) {
  const ts = CF.lex(Parser.exprText(dax)), calls = CF.calls(ts), out = [];
  calls.forEach((c) => {
    let unit = null, n = null;
    if (FIXED[c.name]) [unit, n] = FIXED[c.name];
    else if (BY_ARGS.includes(c.name)) {
      const amount = arr(c.args[1]).map((t) => t.value).join(''), u = arr(c.args[2]).length === 1 ? lc(c.args[2][0].value) : '';
      unit = Object.prototype.hasOwnProperty.call(UNITS, u) ? u : null;
      n = unit && /^[+-]?\d+$/.test(amount) && arr(c.args[1]).every((t) => t.kind === 'op' || t.kind === 'number') ? Number(amount) : null;
      if (n === 0) return;
    } else return;
    const ref = CF.reference(arr(c.args[0])), dates = ref ? `${safeName(ref.table)}[${safeName(ref.column)}]` : null;
    // the base: the one measure a CALCULATE around this call filters (the innermost such CALCULATE)
    const around = calls.filter((x) => /^CALCULATE(TABLE)?$/.test(x.name) && x.args.length > 1 && c.start > x.start + 1 + x.args[0].length && c.end < x.end).pop();
    const first = around ? CF.strip(around.args[0]) : [], baseRaw = first.length === 1 && first[0].kind === 'ref' ? first[0].value : null;
    out.push({ fn: c.name, unit, n, back: n === null || UNITS[unit] === null ? null : -n * UNITS[unit], shift: shiftOf(unit, n), dates, baseRaw });
  });
  return out;
}
const shown = (c) => ({ fn: c.fn, unit: c.unit, n: c.n, back: c.back, shift: c.shift, dates: c.dates, base: c.baseRaw === null ? null : safeName(c.baseRaw) });
export function comparisonsIn(dax) { return scan(dax).map(shown); }

// ---- a report on a model ----
const label = (name) => `[${safeName(name)}]`;
// (0.3.3 LX1, IX2 "Seen" 2) a base measure's name, whole to NAME_OUT characters, as lacking says its partner (safeName's 60
// cut a long base in measures and comparisons while lacking named it whole); a longer one ends with its cut mark
const baseLabel = (name) => `[${shownName(name, NAME_OUT)}]`;
// the like-for-like measure's name for a base measure: the Measure Builder's own ("<base> Last Ramadan")
const partnerOf = (base) => `${String(base).trim()} ${GM.byId('ramLY').suffix}`;
const chainOf = (v, k) => { const path = [v.nodes[k].label]; let at = v.nodes[k].via, n = 0; while (at && v.nodes[at] && n++ < 50) { path.unshift(v.nodes[at].label); at = v.nodes[at].via; } return path.join(' uses '); };
const weekendSaid = (w) => (Array.isArray(w[0]) ? w.map((x) => x.join(' + ')).join(', then ') : w.join(' + '));
const monthSaid = (r) => { const p = []; [['ramadan', 'Ramadan'], ['fitr', 'Eid al-Fitr'], ['adha', 'Eid al-Adha']].forEach(([k, name]) => { if (r[k][0] !== r[k][1]) p.push(`${r[k][0]} ${name} day${r[k][0] === 1 ? '' : 's'} against ${r[k][1]}`); }); return p.length ? `${MONTHS[+r.month.slice(5) - 1]}: ${p.join(', ')}` : null; };
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function likeForLike(model, report, opts) {
  const o = isObj(opts) ? opts : {}, lin = lineageOf(model, report);
  // every measure's comparisons, by the lineage's own keys: the model's (m:) and the report's own (x:)
  // (0.3.3 IX2) each key holds its rows: one for a measure, one for each item of a calculation group (the group's table
  // key: a visual reaches it through the group's column, as a field or a filter)
  const found = new Map(), names = new Set();
  const add = (key, name, kind, expr, label) => { const comps = scan(expr); if (!comps.length) return; if (!found.has(key)) found.set(key, { rows: [], visuals: 0 }); const f = found.get(key); if (kind !== 'calculation item' && f.rows.length) return; comps.forEach((c) => f.rows.push({ name, kind, c, label })); };
  Health.graphStep(isObj(model) ? model : {}).M.tables.forEach((t) => {
    t.measures.forEach((m) => { names.add(lc(m.name)); add(K.m(m.name), m.name, 'measure', m.expr); });
    if (t.calcGroup) arr(t.calcGroup.items).forEach((ci) => add(K.t(t.name), ci.name, 'calculation item', ci.expr, `${safeName(t.name)}[${safeName(ci.name)}]`));
  });
  arr(isObj(report) ? report.files : null).filter((f) => f && typeof f.path === 'string' && isObj(f.json) && /(^|\/)reportExtensions\.json$/i.test(f.path))
    .forEach((f) => arr(f.json.entities).filter(isObj).forEach((en) => arr(en.measures).filter(isObj).forEach((ms) => add('x:' + lc(ms.name), ms.name, 'report measure', ms.expression))));
  // a comparison a whole number of years away can have its Ramadan partner: has, none; any other: null
  const partner = (c) => (c.baseRaw === null || c.back === null || c.back % 12 !== 0 ? null : names.has(lc(partnerOf(c.baseRaw))) ? 'has' : 'none');
  const row = (r) => { const c = r.c; return { measure: r.label || label(r.name), kind: r.kind, fn: c.fn, shift: c.shift, dates: c.dates, base: c.baseRaw === null ? null : baseLabel(c.baseRaw), likeForLike: partner(c) }; };
  // a missing like-for-like measure's name, whole to NAME_OUT characters (safeName's 60 would cut " Last Ramadan" off a long base); a longer one ends with its cut mark
  const wanted = (base) => `[${shownName(partnerOf(base), NAME_OUT)}]`;

  const list = [], backs = new Map(), through = new Set();
  const withQuery = lin.visuals.filter((v) => v.prints).length;
  lin.visuals.forEach((v) => {
    if (!v.nodes) return;
    const comparisons = [];
    Object.keys(v.nodes).filter((k) => found.has(k)).forEach((k) => {
      const m = found.get(k); m.visuals++;
      m.rows.forEach((r) => { through.add(row(r).measure); comparisons.push(Object.assign(row(r), { tier: v.nodes[k].tier, chain: chainOf(v, k) })); if (r.c.back !== null) backs.set(r.c.back, (backs.get(r.c.back) || 0) + 1); });
    });
    // a visual's comparisons: the question's first, at most WHY_MAX, the rest counted
    if (comparisons.length) list.push(Object.assign({ page: v.page, visual: v.visual, type: v.type, comparisons: comparisons.sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier)).slice(0, WHY_MAX) }, comparisons.length > WHY_MAX ? { more: comparisons.length - WHY_MAX } : {}));
  });
  const measures = [...found.values()].flatMap((m) => m.rows.map((r) => Object.assign(row(r), { visuals: m.visuals })));
  const lacking = [...new Set([...found.values()].flatMap((m) => m.rows.filter((r) => partner(r.c) === 'none').map((r) => wanted(r.c.baseRaw))))].sort();

  // the calendar: one entry for each distance the shown comparisons use, the most used first
  const year = Number.isInteger(o.year) ? o.year : null, country = typeof o.country === 'string' ? o.country : undefined;
  const distances = [...backs.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const calendar = distances.slice(0, CALENDAR_MAX).map(([back, uses]) => {
    const head = { back, shift: backSaid(back), comparisons: uses };
    if (year === null) { const r = GC.rangeCompared({ back, country }); return Object.assign(head, { years: r.years, differ: r.differ, monthsCompared: r.months, estimated: r.estimated }); }
    const c = GC.monthsCompared({ year, back, country });
    return c.known ? Object.assign(head, { year, known: true, differ: c.differ, estimated: c.estimated, dates: c.dates, months: c.months.filter((m) => m.differs), notChecked: c.notChecked })
      : Object.assign(head, { year: o.year, known: false, why: c.why });
  });

  let said = `None of the ${withQuery} visuals compares with the same Gregorian dates of another period.`;
  if (list.length) {
    const by = [...through].sort();
    said = `${list.length} of ${withQuery} visuals compare with the same Gregorian dates of another period (through ${by.slice(0, NAMED_MAX).join(', ')}${by.length > NAMED_MAX ? ` and ${by.length - NAMED_MAX} more` : ''}).`;
    const c = calendar[0];
    if (c && year === null) said += c.years.length ? ` ${cap(c.shift)}, ${c.years[0].year} to ${c.years[c.years.length - 1].year}: ${c.differ} of ${c.monthsCompared} months are not like for like in the Gulf; no year was given, so no month is listed.` : '';
    else if (c && !c.known) said += ' ' + c.why;
    else if (c) {
      const months = c.months.map(monthSaid).filter(Boolean), w = c.months.find((m) => m.weekend), vat = c.months.filter((m) => m.vat).length;
      said += ` ${cap(c.shift)}, ${c.back % 12 === 0 ? `${year} against ${year - c.back / 12}` : `each month of ${year}`}: ${c.differ} of 12 months are not like for like in the Gulf${months.length ? ` (${months.join('; ')})` : ''}.`;
      if (w) said += ` Between the two periods the weekend changed (${weekendSaid(w.weekend[0])} against ${weekendSaid(w.weekend[1])}).`;
      if (vat) said += ` The standard VAT rate differs in ${vat} of the 12 months.`;
      if (c.estimated) said += ` ${c.estimated} of those months rest on a date not announced yet (the Umm al-Qura calendar's estimate).`;
    }
  }
  // every list capped (the counts kept): the visuals and the measures at LISTED_MAX, the lacking names too, the distances at CALENDAR_MAX
  const more = (n, cap, key) => (n > cap ? { [key]: n - cap } : {});
  return Object.assign({ said, visuals: lin.visuals.length, withQuery, compared: list.length, list: list.slice(0, LISTED_MAX) }, more(list.length, LISTED_MAX, 'notListed'),
    { measures: measures.slice(0, LISTED_MAX) }, more(measures.length, LISTED_MAX, 'measuresNotListed'), { lacking: lacking.slice(0, LISTED_MAX) }, more(lacking.length, LISTED_MAX, 'lackingNotListed'),
    { calendar }, more(distances.length, CALENDAR_MAX, 'calendarNotListed'), { proves: PROVES, notProved: NOT_PROVED });
}
