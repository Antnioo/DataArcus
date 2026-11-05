// The binding of one report (0.3.2 SP4, the split's step 4: B-280, B-286; moved out of report-run.mjs as it was, no
// change of behaviour): the model's metadata and the plan's options to resolved field identities, formats and bindings.
// Explicit inputs, no IO: it reads no file, no plan state and no model on disk (the model is given, already read), and
// writes nothing. report-run.mjs calls each piece at the point it ran before, so every refusal keeps its order;
// report-run.mjs re-exports fieldsDesign and planBinding (plan-lint imports them from there).
import { visible } from './model.mjs';
import { writtenName } from './display-names.mjs';
import { relsOf } from './report-fields.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');

// (SQ15b, 0.2.9-reader-S8: plan-lint's binding was a hand copy of this one) the page and the binding of a plan's fields,
// create_report's and plan-lint's one rule. fieldsDesign: fields.kpis decides the number of cards (the design block's
// A2-4: 0-6), and the plan's table fields the table's share of a narrow row (SQ13, 0.2.9-design-S2).
export function fieldsDesign(design, F) {
  return { design: F && F.kpis ? Object.assign({}, design, { layout: Object.assign({}, design.layout, { kpis: Math.min(6, F.kpis.length) }) }) : design,
    tableFields: F && F.table ? F.table.length : undefined };
}
// planBinding: the binding for n KPI cards, the picker's, with every field the plan names pinned (builder 7's audit A3-2:
// the picker's rules are its own, so the website's download gets them too); the plan's measure, where it names one,
// decides what is related (round 22b, the reviewer's second review, item 4). o: { m, pickFrom, lang, F, design?, full
// (kpiValues "full"), more (create_report's page filters' options) }; with design, its fieldsDesign too.
export function planBinding(o) {
  const { m, pickFrom, lang, F } = o;
  const pinned = F ? Object.fromEntries([['kpis', F.kpis], ['main', F.measure], ['date', F.timeAxis], ['catA', F.category], ['catB', F.category2], ['slicers', F.slicers], ['table', F.table]].filter(([, v]) => v)) : null;
  const pickOpts = () => Object.assign(relsOf(m, lang), F && F.measure ? { main: F.measure } : {}, o.full ? { kpiValues: 'full' } : {}, pinned ? { pinned } : {}, o.more || {});
  return Object.assign(o.design ? fieldsDesign(o.design, F) : {}, { pinned, pickOpts, bindFor: (n) => Bind.suggest(pickFrom, n, pickOpts()) });
}

// (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) «عدد X» only for an Arabic column; an English
// one is "Count of X" in an Arabic report too (the mixed «عدد Order Id» made mixed titles)
// is this text Arabic: arabic-script.js, its one home (0.3.2 DD1F; CONTRACTS.md 1f)
const { hasArabic } = require('../../assets/js/arabic-script.js');
export const arName = (word, en) => (c) => (hasArabic(c) ? word + ' ' + c : en + ' ' + c);

// a binding's fields, and a field's key as the plan and the format script name it (Table[Field])
export const fieldsOf = (b) => (b ? [b.date, b.measure, ...(b.kpis || []), ...Object.values(b.cats || {}), ...Object.values(b.y || {}), ...(b.table || []), ...(b.slicers || []), ...Object.values(b.tip || {})].filter(Boolean) : []);
export const keyOf = (f) => `${f.t}[${f.c != null ? f.c : f.m}]`;

/** The display names given (displayNames), checked first: a Map of Bind.fieldKey -> { name, key, used } (a refusal
 *  throws, as before the move). */
export function givenNames(displayNames) {
  const given = new Map();
  for (const [k, v] of Object.entries(displayNames || {})) {
    const mk = String(k).trim().match(/^'?(.+?)'?\[(.+)\]$/), name = writtenName(v, `displayNames: ${visible(String(k)).slice(0, 160)}`);
    if (!mk) throw new Error(`displayNames: "${k}" is not written as Table[Field]`);
    if (!name || name.length > 80) throw new Error(`displayNames: the display name for ${k} is empty or longer than 80 characters`);
    given.set(Bind.fieldKey(mk[1], mk[2]), { name, key: String(k), used: false });
  }
  return given;
}

/** the display names given, as copies of the bound fields (A3-2: never set on the picker's fields in place); a calendar
 *  name the picker swapped for its Arabic column keeps the name given for the English one; marks each name used */
export function namedFields(b, given) {
  const from = new Map(((b && b.calendarSwaps) || []).map((w) => [Bind.fieldKey(w.to.t, w.to.c), Bind.fieldKey(w.from.t, w.from.c)]));
  // (0.3.1 FX2, the laptop's A-1: a model with no measures showed «رقم الطلب» for the count of Order Id) a column the
  // visual counts or sums keeps its aggregation in the name given: «عدد <name>», «مجموع <name>» (Count of, Sum of)
  const aggName = (f, name) => (f.agg == null ? name : f.agg === 0 ? arName('مجموع', 'Sum of')(name) : arName('عدد', 'Count of')(name));
  return Bind.mapFields(b, (f) => { const k = Bind.fieldKey(f.t, f.c != null ? f.c : f.m), g = given.get(k) || given.get(from.get(k)); if (!g) return f; g.used = true; return Object.assign({}, f, { name: aggName(f, g.name) }); });
}

/** The picker's binding for one report: o = { m (the model, read), pickFrom (the tables in scope), lang, F (the plan's
 *  fields, resolved), PF (the page filters, resolved), full (kpiValues "full"), sc (the scope) }. Returns the measures a
 *  card can show (usable), the columns counted without measures (COUNTS), bindFor(n), cardNote, listFormats with the
 *  lists it fills (cardFormats, tableFormats) and the picker's notes (slicersDropped, byFlagDay, englishNames). */
export function fieldBinding(o) {
  const { m, pickFrom, lang, F, PF, full, sc } = o;
  // Round 10: the cards show automatic units with 2 decimals by default (kpiValues "auto"), so a card's own format is
  // written only with kpiValues "full" (and then on the tooltip's card too). A table's measure column gets the same
  // format on its projection in both modes (measured in Desktop: "format" on the projection, 13857 -> 13,857).
  // (A3-3: the formats themselves are the picker's, by the one rule: cardFormat with kpiValues "full", tableFormat on a
  // table's fields; here they are only listed for the answer)
  // (round 13, seen in Desktop on 6 Oct: a card said 33.8% and the table's column of the same measure 0.34: a measure's
  // table column carries the percent format its card shows: the picker's tableFormat)
  const cardFormats = [], tableFormats = [];
  // (SQ10, audit-3-picker-writer-S2: each measure once by its table and name, never by its "T[c]" text)
  const listed = new Set(), listFormats = (b) => {
    const list = (to, f, code) => { const id = f && JSON.stringify([to === cardFormats, String(f.t), String(f.m)]); if (f && f.m != null && code && !listed.has(id)) { listed.add(id); to.push({ field: keyOf(f), format: code }); } };
    (b.kpis || []).forEach((f) => list(cardFormats, f, f && f.cardFormat)); (b.table || []).forEach((f) => list(tableFormats, f, f && f.tableFormat));
    return b;
  };
  const usable = F && F.kpis ? F.kpis.map((k) => k.m) : Bind.suggest(pickFrom, 8, relsOf(m, lang)).kpis.filter(Boolean).map((k) => k.m);
  // Round 12 (#25): a model without measures gets its numbers from its columns, counted or summed by the visuals
  // (Bind.counts), so the report has cards, charts and a table instead of a page four fifths empty
  // (0.3.1 TT1: arName above)
  const COUNTS = usable.length ? [] : Bind.counts(pickFrom, lang === 'ar' ? { count: arName('عدد', 'Count of'), sum: arName('مجموع', 'Sum of') } : null, { lang: lang });
  const nValues = usable.length || COUNTS.length;
  // (round 16, design finding #14: "Count of Region" made a weak KPI): the cards take counts of ID-like columns and sums
  // only; a count of a category column still feeds a chart or the table, never a card: fewer cards, and told
  const KPI_COUNTS = COUNTS.filter((c) => !c.category), nCards = usable.length || KPI_COUNTS.length;
  // The binding for n KPI cards: the picker's, with every given field in its place (builder 7's audit A3-2, 11 Oct: the
  // picker's rules, the fixed slicers, the flag's day axis, the Arabic calendar names and the short day names, are the
  // picker's own, so the website's download gets them too; the server passes options)
  // (SQ15b, 0.2.9-reader-S8: planBinding above, the one function plan-lint calls too)
  const PB = planBinding({ m, pickFrom, lang, F, full,
    more: PF ? { excludeColumns: PF.map((f) => ({ t: f.t, c: f.c })), axisFor: PF.map((f) => ({ t: f.t, c: f.c, values: f.values })) } : null });
  // what the picker did for the page filters and the Arabic report, for the notes
  const noted = (b) => { (b.excluded || []).forEach((x) => slicersDropped.push(`${x.t}[${x.c}]`)); if (b.axisBy) byFlagDay.push(b.axisBy); (b.calendarNames || []).forEach((x) => englishNames.add(`${x.t}[${x.c}]`));
    // (kept as before A3-2, an open item: with fields or page filters the binding had no category pool, so the charts
    // of a page take the plan's categories only)
    if (F || PF) delete b.catPool;
    return b; };
  // a model without measures: the same binding, its numbers the columns the visuals count or sum (through build, so the
  // table's and the tooltip's rules are the picker's)
  const countBind = (n) => { const b = PB.bindFor(n), C = COUNTS, ch = b.choices;
    const nb = Bind.build(Object.assign({}, ch, { kpis: Array.from({ length: n }, (_, i) => KPI_COUNTS[i] || null), main: C[0], table: [ch.catB || ch.catA, C[0], C[1]].filter((x, i, l) => x && l.indexOf(x) === i) }));
    delete b.notReached; return noted(Object.assign({}, b, nb)); };
  const bindFor = (n) => (COUNTS.length ? countBind(n) : noted(PB.bindFor(n)));
  const cardNote = (asked, built, leftOut) => (COUNTS.length ? Object.assign({ asked, built, counted: KPI_COUNTS.slice(0, built).map((f) => f.name),
    why: `The model has no measures, so the KPI cards, the charts and the table show counts and sums of its columns, made by the visuals themselves (${COUNTS.slice(0, 4).map((f) => f.name).join(', ')}); the model is not changed.${built < asked && COUNTS.some((c) => c.category) ? ` Fewer cards than asked: a count of a category column (${COUNTS.filter((c) => c.category).slice(0, 3).map((f) => f.name).join(', ')}) is not a KPI, so it is shown in a chart or the table, never on a card.` : ''} For real KPIs, propose measures with their format strings to the user; when they are in the model (added in Power BI Desktop), create the report again.` }, leftOut ? { leftOut } : {})
    : built >= asked ? null : Object.assign({ asked, built, measures: usable.slice(0, built),
    why: usable.length ? `The model has ${usable.length} measure${usable.length === 1 ? '' : 's'} a KPI card can show${sc.scope ? ' in this part of the model' : ''}, so ${built} of ${asked} KPI cards were built. Add measures to the model (in Power BI Desktop) for more cards, then create the report again.`
      : 'The model has no measures, so no KPI card was built, and the charts were left out too (they have no value to show; see leftOutVisuals). The report has its header, filters and table only. Propose measures with their format strings to the user; when they are in the model (added in Power BI Desktop), create the report again.' }, leftOut ? { leftOut } : {}));
  const slicersDropped = [], byFlagDay = [];
  // the names the picker swapped for the Arabic calendar's (noted)
  const englishNames = new Set();
  return { usable, COUNTS, nValues, nCards, bindFor, cardNote, listFormats, cardFormats, tableFormats, slicersDropped, byFlagDay, englishNames };
}
