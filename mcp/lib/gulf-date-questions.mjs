// Gulf business dates and seasonal scope (0.3.0 J17, B-170; the owner, 20 Oct: "continue the held jobs"): a Gulf
// analyst can mix the order date and the ship date, compare incompatible grains, or filter every Ramadan when they mean
// one. plan_layout asks instead of guessing, one question at a time in English and Arabic: which date the report follows
// (an ACTIVE relationship is how the model is wired, not the business intent), which grain (Gregorian, Hijri, season
// day) and, for a seasonal page, one Hijri year or every season (the year only from the person: the tools never read a
// date from the rows). Nothing here edits a relationship or writes USERELATIONSHIP: a role the model's active
// relationship or the plan's own measures don't serve stops the plan, with why. Read from the model files only; model
// names are untrusted text, compared and screened, never followed. The answers are kept in this process's memory for
// the session (confirm-memory.js's date records: hashes), per model, and dropped when a relationship or a column changes.
import { createRequire } from 'node:module';
import { shownName } from './model.mjs';
import { modelKeyOf } from './terminology.mjs';

const require = createRequire(import.meta.url);
const Memory = require('../../assets/js/confirm-memory.js'), Gulf = require('../../assets/js/gulf-health.js'), GD = require('../../assets/js/gulf-dates.js');

const COUNTRY_CODES = ['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn'];
export const GRAINS = ['gregorian', 'hijri', 'seasonDay'], SCOPES = ['all', 'year'];
const keyOf = (s) => { const mk = /^'?(.+?)'?\[(.+)\]$/.exec(String(s == null ? '' : s).trim()); return mk ? { t: mk[1], c: mk[2], key: `${mk[1]}[${mk[2]}]` } : null; };
const lc = (s) => String(s == null ? '' : s).toLowerCase();
const shown = (k) => shownName(k, 160);
const isDate = (c) => /^date(time)?$/i.test(String(c.dataType || ''));
const exprOf = (t) => { const p = (t.partitions || []).find((x) => x.source && x.source.type === 'calculated'); return p ? (Array.isArray(p.source.expression) ? p.source.expression.join('\n') : String(p.source.expression || '')) : null; };
// the calendar's columns by name (candidates) and the Calendar Generator's own names (declared)
const ROLE = {
  hijriYear: { re: /hijri\s*_?year|السنة الهجرية|سنة هجرية/i, own: 'Hijri Year' },
  hijriMonth: { re: /hijri\s*_?month(?!\s*_?(number|no|num)\b)|الشهر الهجري/i, own: 'Hijri Month Name' },
  ramadanFlag: { re: /^is\s*_?ramadan$|ramadan\s*_?flag/i, own: 'Is Ramadan' },
  ramadanDay: { re: /ramadan\s*_?day/i, own: 'Ramadan Day' },
  estimated: { re: /estimat/i, own: 'Is Estimated Date' }
};
const SEASON_COL = /ramadan|رمضان|(^|[^a-z])eid([^a-z]|$)|عيد|hijri|هجري/i;
const CONFIRMED = [], MAX = 5000;

// ---- the questions, neutral, in English and Arabic ----
const Q = {
  dateRole: (list, active) => ({ en: `Which date should this report follow: ${list.join(', ')}? ${active ? `The model's active relationship uses ${active}: that is how the model is wired, not necessarily the date you mean.` : 'None of them has an active relationship to the calendar.'}`,
    ar: `أي تاريخ يجب أن يتبعه هذا التقرير: ${list.join('، ')}؟ ${active ? `العلاقة النشطة في النموذج تستخدم ${active}، وهذا هو ربط النموذج وليس بالضرورة التاريخ الذي تقصده.` : 'لا يرتبط أي منها بالتقويم بعلاقة نشطة.'}` }),
  grain: () => ({ en: 'Should the dates be shown by Gregorian months, by Hijri months, or by the day of the season (Ramadan day 1, 2, 3 ...)?',
    ar: 'هل تُعرض التواريخ بالأشهر الميلادية، أم بالأشهر الهجرية، أم بيوم الموسم (اليوم الأول من رمضان، الثاني، الثالث ...)؟' }),
  scope: (season, seasonAr) => ({ en: `Should this page show one ${season} (a Hijri year you name) or every ${season} in the calendar together?`,
    ar: `هل تعرض هذه الصفحة ${seasonAr} واحدًا (سنة هجرية تحددها) أم كل ${seasonAr} في التقويم معًا؟` }),
  year: (season, seasonAr) => ({ en: `Which Hijri year's ${season}? Give the year number as the calendar's Hijri year column holds it.`,
    ar: `${seasonAr} أي سنة هجرية؟ اذكر رقم السنة كما يحفظه عمود السنة الهجرية في التقويم.` }),
  hijriYearColumn: (list) => ({ en: `Which column holds the Hijri year: ${list.join(', ')}? It was found by its name only.`,
    ar: `أي عمود يحفظ السنة الهجرية: ${list.join('، ')}؟ وُجد بالاسم فقط.` })
};
const OPTIONS = { grain: GRAINS, scope: SCOPES };
export const HOW = 'Ask askNext, in the person\'s language, and wait for their answer; then call plan_layout again with it in gulfDates ({ dateRole: "Table[Column]", grain: "gregorian" | "hijri" | "seasonDay", scope: "all" | "year", year: <the Hijri year the person gives>, hijriYearColumn: "Table[Column]", and for a missing calendar country, firstYear, lastYear }). Never answer a question yourself, never take a year as "the current one", and never infer the date from which relationship is active.';
const SAY = 'Say in the plan which date the report follows and whether the person confirmed it (using); for a seasonal page the grain, the scope (one Hijri year the person named, or every season together) and the dates\' status (announced or estimated, and the country\'s limits). Never claim how a season performed, or that seasons are complete or comparable: the tools read no data. DataArcus never activates a relationship, never edits one and never writes USERELATIONSHIP.';

/**
 * The date questions of a plan. m: the loaded model; a: plan_layout's inputs (planFields, pageFilters, gulfDates);
 * opts: { axis: "Table[Column]" the trend's axis (the plan's, or the one the picker takes) }.
 * Returns null when there is nothing to ask or say, else { answer, problems, rows }.
 */
export function gulfDateQuestions(m, a, opts) {
  const model = (m && m.tmsl && (m.tmsl.model || m.tmsl)) || {}, raw = (model.tables || []).filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(String(t.name)));
  const rels = (model.relationships || []).filter((r) => r && r.fromTable != null && r.toTable != null);
  const given = Object.assign({}, a.gulfDates || {}), pf = a.planFields || {}, problems = [];
  const tableOf = (n) => raw.find((t) => String(t.name) === n), colOf = (k) => { const x = keyOf(k), t = x && tableOf(x.t); return t ? (t.columns || []).find((c) => String(c.name) === x.c && c.type !== 'rowNumber') : null; };
  const axis = keyOf(pf.timeAxis || (opts && opts.axis));

  // the calendar: the axis's table when relationships end at it; else the Gulf check's own calendar
  const toCal = (n) => rels.some((r) => String(r.toTable) === n);
  const cal = (axis && toCal(axis.t) && tableOf(axis.t)) || Gulf.findCalendar({ model: { tables: raw } }) || null, C = cal ? String(cal.name) : null;
  const measureHome = (k) => { const x = keyOf(k); if (!x) return null; const t = tableOf(x.t); if (t && (t.measures || []).some((y) => String(y.name) === x.c)) return x.t;
    const h = raw.find((tt) => (tt.measures || []).some((y) => String(y.name) === x.c)); return h ? String(h.name) : null; };
  const planMeasures = [...(pf.kpis || []), ...(pf.measure ? [pf.measure] : [])].map(keyOf).filter((x) => x && measureHome(x.key)).map((x) => ({ key: x.key, home: measureHome(x.key) }));

  // 1. the structural date candidates: each date column of the fact tables (tables with a relationship to the
  // calendar, and the tables of the plan's measures), with the relationship from it to the calendar and its flag
  const facts = [...new Set(rels.filter((r) => C && String(r.toTable) === C && String(r.fromTable) !== C).map((r) => String(r.fromTable)).concat(planMeasures.map((x) => x.home)))].filter((n) => n !== C && tableOf(n));
  const candidates = [];
  facts.forEach((f) => (tableOf(f).columns || []).forEach((c) => {
    const rel = C ? rels.find((r) => String(r.fromTable) === f && String(r.fromColumn) === String(c.name) && String(r.toTable) === C) : null;
    if (!isDate(c) && !rel) return;
    candidates.push({ key: `${f}[${c.name}]`, table: f, column: String(c.name), rel: rel ? { to: `${C}[${rel.toColumn}]`, active: rel.isActive !== false } : null });
  }));
  const ambiguous = facts.some((f) => candidates.filter((x) => x.table === f).length >= 2);

  // seasonal: a Ramadan, Eid or Hijri page filter or axis, or a seasonal grain asked for
  const filters = (a.pageFilters || []).map((f) => Object.assign({ k: keyOf(f && f.field) }, f)).filter((f) => f.k);
  const seasonFilter = filters.find((f) => SEASON_COL.test(f.k.c) && !ROLE.hijriYear.re.test(f.k.c));
  const seasonal = !!(seasonFilter || (axis && SEASON_COL.test(axis.c)) || ['hijri', 'seasonDay'].includes(given.grain));
  if (!ambiguous && !seasonal && !a.gulfDates) return null;
  const isEid = seasonFilter && /(^|[^a-z])eid([^a-z]|$)|عيد/i.test(seasonFilter.k.c);
  const season = isEid ? 'Eid' : 'Ramadan', seasonAr = isEid ? 'العيد' : 'رمضان';

  // 4. the calendar's fields: declared by the Calendar Generator's own table, confirmed by the person, or candidates by name
  const gen = cal ? Gulf.readGenerated(exprOf(cal)) : null;
  const calCols = cal ? (cal.columns || []).filter((c) => c.type !== 'rowNumber').map((c) => String(c.name)) : [];
  const roleField = (role) => {
    if (!cal) return null;
    if (gen && calCols.includes(ROLE[role].own)) return { field: `${C}[${ROLE[role].own}]`, by: 'declared' };
    const n = calCols.find((x) => ROLE[role].re.test(x));
    return n ? { field: `${C}[${n}]`, by: 'name' } : null;
  };
  const columns = Object.fromEntries(Object.keys(ROLE).map((r) => [r, roleField(r)]));
  const hijriYearCandidates = cal ? calCols.filter((x) => ROLE.hijriYear.re.test(x)).map((x) => `${C}[${x}]`) : [];

  // the memory: an answer given before for this model, while its evidence is unchanged
  const mk = modelKeyOf(m), seasonKeys = Object.values(columns).filter(Boolean).map((x) => x.field).concat(C ? [`${C}[Date]`] : []);
  const evidenceOf = (q) => Memory.dateEvidence(model, q, q === 'dateRole' ? candidates.map((x) => x.key) : seasonKeys);
  const fieldAnswer = (v, among) => among.find((k) => Memory.dateField(k) === v) || null;
  const memo = Memory.applyDates(Memory.DATE_QUESTIONS.map((q) => ({ question: q, evidence: evidenceOf(q) })), CONFIRMED, mk);
  const earlier = [], answers = {};
  const take = (q, valid, fromMemo) => {
    if (given[q] != null) { const v = valid(given[q]); if (v != null) { answers[q] = v; return 'given'; } return 'invalid'; }
    if (memo.has(q)) { const v = fromMemo(memo.get(q)); if (v != null) { answers[q] = v; earlier.push(q); return 'earlier'; } }
    return null;
  };
  const roleSt = take('dateRole', (v) => { const k = keyOf(v); const hit = k && candidates.find((x) => x.key === k.key); if (!hit) { problems.push(`gulfDates.dateRole ${shown(String(v))} is not one of the date candidates of the plan's tables (${candidates.map((x) => shown(x.key)).join(', ') || 'none'}): ask the person which of them they mean.`); return null; } return hit.key; },
    (v) => fieldAnswer(v, candidates.map((x) => x.key)));
  take('grain', (v) => (GRAINS.includes(v) ? v : null), (v) => (GRAINS.includes(v) ? v : null));
  take('scope', (v) => (SCOPES.includes(v) ? v : null), (v) => (SCOPES.includes(v) ? v : null));
  take('year', (v) => (Number.isInteger(v) ? v : null), (v) => (/^\d{3,4}$/.test(v) ? +v : null));
  take('hijriYearColumn', (v) => { const k = keyOf(v); if (!k || !colOf(k.key)) { problems.push(`gulfDates.hijriYearColumn ${shown(String(v))} is not a column of the model.`); return null; } return k.key; },
    (v) => fieldAnswer(v, raw.flatMap((t) => (t.columns || []).map((c) => `${t.name}[${c.name}]`))));
  if (answers.hijriYearColumn && columns.hijriYear && columns.hijriYear.by !== 'declared') columns.hijriYear = { field: answers.hijriYearColumn, by: 'confirmed' };
  else if (answers.hijriYearColumn && !columns.hijriYear) columns.hijriYear = { field: answers.hijriYearColumn, by: 'confirmed' };

  // the questions, in order; each asked only when it applies
  const active = candidates.find((x) => x.rel && x.rel.active), list = [];
  if (ambiguous) list.push(Object.assign({ id: 'dateRole', options: candidates.map((x) => shown(x.key)) }, Q.dateRole(candidates.map((x) => shown(x.key)), active && shown(active.key))));
  if (seasonal) {
    list.push(Object.assign({ id: 'grain', options: GRAINS }, Q.grain()));
    list.push(Object.assign({ id: 'scope', options: SCOPES }, Q.scope(season, seasonAr)));
    if (answers.scope === 'year') {
      list.push(Object.assign({ id: 'year', options: [] }, Q.year(season, seasonAr)));
      if ((columns.hijriYear && columns.hijriYear.by === 'name') || answers.hijriYearColumn) list.push(Object.assign({ id: 'hijriYearColumn', options: hijriYearCandidates.map(shown) }, Q.hijriYearColumn(hijriYearCandidates.map(shown))));
    }
  }
  const pleaseConfirm = list.map((q) => Object.assign(q, { status: answers[q.id] != null ? 'answered' : 'open' }, answers[q.id] != null ? { answer: typeof answers[q.id] === 'string' ? shown(answers[q.id]) : answers[q.id] } : {}, earlier.includes(q.id) ? { earlier: true } : {}));
  const open = pleaseConfirm.filter((q) => q.status === 'open');
  const askNext = open[0] ? { id: open[0].id, en: open[0].en, ar: open[0].ar, options: open[0].options } : null;

  // 2. the date the report follows, and whether it is served (a confirmed role the plan can't follow stops the plan)
  let using = null; const blocked = [];
  if (candidates.length) {
    const role = answers.dateRole && candidates.find((x) => x.key === answers.dateRole);
    const own = axis && candidates.find((x) => x.key === axis.key);
    if (role) {
      using = { field: shown(role.key), confirmed: true, why: earlier.includes('dateRole') ? 'confirmed by the person earlier in this session (the relationships unchanged since)' : 'confirmed by the person' };
      const direct = axis && axis.key === role.key;
      if (!direct && axis && C && axis.t === C) {
        const serves = (mm) => { const t = tableOf(mm.home), x = keyOf(mm.key), me = t && (t.measures || []).find((y) => String(y.name) === x.c); const e = me ? String(Array.isArray(me.expression) ? me.expression.join('\n') : me.expression || '') : '';
          return /USERELATIONSHIP/i.test(e) && new RegExp(`(^|[^\\w])'?${role.table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'?\\s*\\[\\s*${role.column.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\]`, 'i').test(e); };
        if (!role.rel) blocked.push(`${shown(role.key)} has no relationship to ${shown(C)}, so the plan's charts by ${shown(axis.key)} can't follow it. DataArcus never activates a relationship, never adds or edits one and never writes USERELATIONSHIP: relate it in the model first, or choose another date.`);
        else if (!role.rel.active) {
          const servedBy = planMeasures.filter(serves).map((x) => x.key);
          if (planMeasures.length && servedBy.length === planMeasures.length) using.servedBy = servedBy.map(shown);
          else {
            const others = raw.flatMap((t) => (t.measures || []).map((y) => ({ key: `${t.name}[${y.name}]`, home: String(t.name) }))).filter((mm) => serves(mm) && !servedBy.includes(mm.key)).slice(0, 5).map((x) => shown(x.key));
            blocked.push(`${shown(role.key)} reaches ${shown(role.rel.to)} only through an inactive relationship, and no measure of the plan uses it (USERELATIONSHIP)${planMeasures.length && servedBy.length ? ` in every chart (${planMeasures.filter((x) => !servedBy.includes(x.key)).map((x) => shown(x.key)).join(', ')} does not)` : ''}: the charts would follow ${active ? shown(active.key) : 'another date'} instead. DataArcus never activates a relationship, never edits one and never writes USERELATIONSHIP. ${others.length ? `The model's measure${others.length === 1 ? '' : 's'} ${others.join(', ')} use${others.length === 1 ? 's' : ''} it: put ${others.length === 1 ? 'it' : 'them'} in planFields (kpis and measure), or` : 'Add a measure in the model that uses it, or'} choose the date the active relationship follows.`);
          }
        }
      }
    } else if (own) using = { field: shown(own.key), confirmed: false, why: 'the trend\'s axis is this column itself; not confirmed by the person as the date they mean' };
    else {
      const f = (axis && C && axis.t === C && active) || active;
      using = f ? { field: shown(f.key), confirmed: false, why: `the model's active relationship (${shown(f.key)} -> ${shown(f.rel.to)}) is what the charts follow; an active relationship is how the model is wired, not the business intent: ask the person which date they mean` }
        : { field: null, confirmed: false, why: 'no date candidate has an active relationship to the calendar' };
    }
  }

  // 3. the grain and the scope (seasonal pages), against the axis and the page filters
  let grain = null, offer = null;
  const needCal = (what) => { offer = offer || calendarOffer(given); blocked.push(`${what} The model has no such column${cal ? ` in ${shown(C)}` : ' (no calendar table)'}: add the Gulf calendar first (offer: add_gulf_calendar, with the person's own country and years), or choose another grain.`); };
  if (answers.grain) {
    const isSeasonAxis = axis && SEASON_COL.test(axis.c);
    if (answers.grain === 'gregorian' && isSeasonAxis) problems.push(`gulfDates.grain "gregorian", but the trend's axis ${shown(axis.key)} is a Hijri or season column: pass a Gregorian date or month column in planFields.timeAxis, or answer the grain the person means.`);
    if (answers.grain === 'hijri') {
      if (!columns.hijriMonth) needCal('grain "hijri" needs the calendar\'s Hijri month.');
      else {
        const hc = colOf(columns.hijriMonth.field), by = hc && hc.sortByColumn ? `${C}[${hc.sortByColumn}]` : null;
        grain = { grain: 'hijri', axis: shown(columns.hijriMonth.field), sortedBy: by ? shown(by) : null, order: by ? 'Hijri month order, by its sort-by column' : 'A to Z: the column has no sort-by column in the model (add one, the Hijri month number)' };
        if (!axis || axis.key !== columns.hijriMonth.field) problems.push(`gulfDates.grain "hijri": the trend's axis is ${axis ? shown(axis.key) : 'not given'}; pass planFields.timeAxis "${shown(columns.hijriMonth.field)}"${by ? ` (sorted by ${shown(by)})` : ''}.`);
      }
    }
    if (answers.grain === 'seasonDay') {
      if (!columns.ramadanDay) needCal('grain "seasonDay" needs the calendar\'s Ramadan Day.');
      else { grain = { grain: 'seasonDay', axis: shown(columns.ramadanDay.field), sortedBy: null, order: 'the day number\'s own order' };
        if (!axis || axis.key !== columns.ramadanDay.field) problems.push(`gulfDates.grain "seasonDay": the trend's axis is ${axis ? shown(axis.key) : 'not given'}; pass planFields.timeAxis "${shown(columns.ramadanDay.field)}" (the day of the season, 1, 2, 3 ...).`); }
    }
    if (answers.grain === 'gregorian') grain = { grain: 'gregorian', axis: axis ? shown(axis.key) : null };
  }
  let scopeNote = null;
  if (seasonal && answers.scope) {
    const yearFilters = filters.filter((f) => (columns.hijriYear && f.k.key === columns.hijriYear.field) || ROLE.hijriYear.re.test(f.k.c));
    if (answers.scope === 'all') {
      if (yearFilters.length) problems.push(`gulfDates.scope "all" (every ${season} together), but pageFilters keeps ${yearFilters.map((f) => shown(f.k.key)).join(', ')} (Hijri Year): remove that filter, or ask the person whether they mean one ${season}.`);
      scopeNote = `Every ${season} of the calendar together: whether each season is complete or comparable is not checked (the tools read no data); an estimated or unfinished ${season} is included as the calendar marks it.`;
    } else if (!columns.hijriYear) needCal(`scope "year" needs the calendar's Hijri year.`);
    else if (answers.year != null && columns.hijriYear.by !== 'name') {
      const want = { field: columns.hijriYear.field, values: [answers.year] }, on = yearFilters.find((f) => f.k.key === columns.hijriYear.field);
      if (!on) problems.push(`gulfDates.scope "year" ${answers.year}: the page doesn't keep that year yet. Add this page filter to pageFilters: ${JSON.stringify(want)} (the year the person gave).`);
      else if (!(on.values || []).length || !(on.values || []).every((v) => +v === answers.year)) problems.push(`pageFilters keeps ${shown(on.k.key)} = ${JSON.stringify(on.values)}, but the person's year is ${answers.year}: use ${JSON.stringify(want)}.`);
      yearFilters.filter((f) => f !== on).forEach((f) => problems.push(`pageFilters also keeps ${shown(f.k.key)}: one Hijri-year filter, ${JSON.stringify(want)}.`));
      scopeNote = `One ${season}: Hijri year ${answers.year}, as the person gave it.`;
    }
  }
  if (seasonal && open.length) problems.push(`A seasonal page with an open question (gulfDates.askNext: ${open[0].id}): ask the person, one question at a time, then call plan_layout again with gulfDates. No plan id until the date, the grain and the scope are answered.`);
  blocked.forEach((b) => problems.push(b));

  // 5. the dates' status: announced or estimated, and the country's limits (the Gulf calendar's own notes)
  const status = seasonal ? statusOf({ gen, columns, cal: C, answers, country: given.country, season, seasonAr }) : null;

  // remember the answers the person gave now (valid ones), for this model and their evidence
  Object.keys(answers).filter((q) => given[q] != null).forEach((q) => {
    const v = answers[q], ans = q === 'dateRole' || q === 'hijriYearColumn' ? Memory.dateField(v) : String(v);
    try { CONFIRMED.push(Memory.dateRecord({ modelKey: mk, question: q, evidence: evidenceOf(q), answer: ans })); } catch (e) { /* not a recordable answer */ }
  });
  if (CONFIRMED.length > MAX) CONFIRMED.splice(0, CONFIRMED.length - MAX);

  const shownAnswers = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, typeof v === 'string' ? shown(v) : v]));
  const answer = Object.assign({
    candidates: candidates.slice(0, 12).map((x) => ({ field: shown(x.key), relationship: x.rel ? `${shown(x.key)} -> ${shown(x.rel.to)}` : null, active: x.rel ? x.rel.active : null, status: answers.dateRole === x.key ? 'confirmed' : 'candidate' })),
    ambiguous, seasonal, using, answers: shownAnswers, pleaseConfirm, askNext, remaining: open.length
  }, earlier.length ? { earlier } : {}, blocked.length ? { blocked } : {}, grain ? { grain } : {}, scopeNote ? { scope: scopeNote } : {},
  cal ? { calendar: { table: shown(C), declared: !!gen, columns: Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, v ? { field: shown(v.field), by: v.by } : null])) } } : { calendar: null },
  status ? { status } : {}, offer ? { offer } : {}, { how: HOW, sayInPlan: SAY });
  const SCOPE_SAID = answers.scope === 'all' ? `every ${season} of the calendar together` : answers.scope === 'year' ? (answers.year != null ? `${season} of Hijri year ${answers.year} only` : `one ${season} (the year not given yet)`) : 'not answered';
  const rows = [['Date followed', using ? (using.field ? `${using.field} (${using.confirmed ? 'confirmed by the person' : 'the active relationship; not confirmed by the person'})` : using.why) : 'no date column'],
    ...(seasonal ? [['Grain', answers.grain ? { gregorian: 'Gregorian months', hijri: 'Hijri months', seasonDay: 'day of the season' }[answers.grain] + (grain && grain.axis ? ` (${grain.axis}${grain.sortedBy ? `, sorted by ${grain.sortedBy}` : ''})` : '') : 'not answered'],
      ['Seasonal scope', SCOPE_SAID + (scopeNote && answers.scope === 'all' ? `; ${scopeNote.replace(/^[^:]*: /, '')}` : '')]] : []),
    ...(status ? [[`${season} dates`, status.en]] : [])];
  return { answer, problems, rows };
}

// the add_gulf_calendar offer: the person's own country and years (never a default), the country's weekend option
function calendarOffer(g) {
  const inputs = {}, ask = [];
  if (COUNTRY_CODES.includes(g.country)) inputs.country = g.country; else ask.push('country');
  if (Number.isInteger(g.firstYear)) inputs.firstYear = g.firstYear; else ask.push('firstYear');
  if (Number.isInteger(g.lastYear)) inputs.lastYear = g.lastYear; else ask.push('lastYear');
  return { tool: 'add_gulf_calendar', inputs, askTheUser: ask, weekend: inputs.country ? Gulf.COUNTRIES[inputs.country].weekendOption : null,
    weekends: COUNTRY_CODES.map((c) => Gulf.COUNTRIES[c].weekendOption),
    notModelled: 'The weekend differs by country (the generator\'s own options above), and the generator has no option for an emirate\'s own government weekend (Sharjah\'s differs from the federal one) or the Friday half day: ask the person which weekend their business keeps.',
    what: 'add_gulf_calendar writes the calendar as a TMDL script in a new file next to the project, for the person to apply in TMDL view; nothing is written into the model. Ask the person for their country and the years their data covers: never take a default.' };
}

// whether the season's dates are announced or estimated, from the calendar's files and gulf-dates.js (never from rows)
function statusOf({ gen, columns, cal, answers, country, season, seasonAr }) {
  const C = COUNTRY_CODES.includes(country) ? Gulf.COUNTRIES[country] : null, other = C && country !== 'uae' && country !== 'ksa';
  const limit = other ? ` For ${C.name} the generator uses the UAE's announced dates or Umm al-Qura estimates: ${C.name} may announce another day.` : '';
  const limitAr = other ? ` بالنسبة إلى ${C.nameAr} يستخدم المولّد تواريخ الإمارات المعلنة أو تقديرات أم القرى، وقد تُعلن ${C.nameAr} يومًا آخر.` : '';
  if (!gen) return { dates: 'cantTell', en: `The ${season} dates in ${shown(cal || 'the calendar')} come from its data: DataArcus can't tell whether they are announced or estimated (the tools read no rows).${limit}`,
    ar: `تواريخ ${seasonAr} في ${shown(cal || 'التقويم')} تأتي من بياناته، ولا يمكن لـ DataArcus معرفة هل هي معلنة أم تقديرية (الأدوات لا تقرأ الصفوف).${limitAr}` };
  const observed = !!columns.estimated, est = shown(columns.estimated ? columns.estimated.field : `${cal}[Is Estimated Date]`);
  const firstEst = GD.events.find((e) => (e.estimate || []).includes('ramadan'));
  if (answers.scope === 'year' && answers.year != null) {
    const e = GD.events.find((x) => x.hijriYear === answers.year), estimated = !observed || !e || (e.estimate || []).includes('ramadan');
    return estimated ? { dates: 'estimated', en: `${season} ${answers.year}: estimated dates (${observed ? `Umm al-Qura, not yet announced; marked in ${est}` : 'Umm al-Qura: this calendar was made without the announced dates'}). Say so in the report's plan; the dates can move by a day when announced.${limit}`,
      ar: `${seasonAr} ${answers.year}: تواريخ تقديرية (${observed ? `أم القرى، لم تُعلن بعد؛ معلَّمة في ${est}` : 'أم القرى: صُنع هذا التقويم دون التواريخ المعلنة'}). قد تتغير بيوم عند الإعلان.${limitAr}` }
      : { dates: 'announced', en: `${season} ${answers.year}: the UAE's announced dates (checked to ${GD.checked}; they match Saudi Arabia's).${limit}`,
        ar: `${seasonAr} ${answers.year}: التواريخ المعلنة في الإمارات (مُراجَعة حتى ${GD.checked}، وتطابق تواريخ السعودية).${limitAr}` };
  }
  return { dates: observed ? 'mixed' : 'estimated', en: observed ? `Every ${season}: the UAE's announced dates up to ${GD.checked}; from Hijri year ${firstEst ? firstEst.hijriYear : 'the next one'} on they are Umm al-Qura estimates, marked in ${est}.${limit}` : `Every ${season}: Umm al-Qura estimates (this calendar was made without the announced dates).${limit}`,
    ar: observed ? `كل ${seasonAr}: التواريخ المعلنة في الإمارات حتى ${GD.checked}، ومن السنة الهجرية ${firstEst ? firstEst.hijriYear : 'التالية'} تقديرات أم القرى، معلَّمة في ${est}.${limitAr}` : `كل ${seasonAr}: تقديرات أم القرى (صُنع هذا التقويم دون التواريخ المعلنة).${limitAr}` };
}
