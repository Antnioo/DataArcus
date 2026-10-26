// The Arabic twin, step 3: the model next to the report: its date tables (time left to right), the Arabic month
// column's offer, and the right-to-left waterfall's facts.
// (0.3.1 S9: moved out of lib/arabic-twin.mjs as it was, no change of behaviour; arabic-twin.mjs re-exports what others import)
import path from 'node:path';
import { loadModel, shownName, refuseUnreadable } from './model.mjs';
// (AF1, the release audit's F11) a model name as the month offer's answer shows it: the one screen (withheld when it reads
// like an instruction), invisible characters as code points, never cut (the plan's lists match these names)
const nm = (s) => shownName(s, Infinity);
import { tagOf } from './model-script.mjs';
import { relRoot, byPathOf } from './twin-read.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
// (as it stood in arabic-twin.mjs, MONTHS_AR with it: declared there, read nowhere; S9 moves it as it was)
// eslint-disable-next-line no-unused-vars -- kept: test-0.2.9i's "one Arabic month list" check reads this source for AR_MONTHS (Q1, listed)
const MONTHS_AR = require('../../assets/js/pbip-export.js').AR_MONTHS, hasControl = require('../../assets/js/pbip-export.js').hasControl, ArabicCal = require('../../assets/js/arabic-calendar.js');

const MONTH_COLUMN = 'Month Name (Arabic)', MONTH_SORT = 'Month Number (AR sort)';

// ---- the model next to the report: its date tables (for time left to right, T2) and the month offer ----
export function modelOf(R, loc) {
  const ref = byPathOf(R.pbir);
  if (!ref || !ref.path) return { m: null, why: 'the report is connected to a published model (not a model folder next to it): the column is a model step for the model\'s owner' };
  // (AU47) a model read only in part is refused, never planned on: outside the catch, so the refusal reaches the tool
  let m;
  try { m = loadModel(relRoot(path.resolve(loc.dir, String(ref.path)))); } catch (e) { return { m: null, why: 'the model that definition.pbir names next to the report could not be read (a model folder saved from Power BI Desktop is needed there; the error is not repeated: it holds the file\'s own path)' }; }
  return { m: refuseUnreadable(m) };
}
const isDateCol = (c) => /^date(time)?$/i.test(String(c.dataType || ''));
// (T-5 of the laptop's rc.2 twins: "the model has no date table" on a table spelled "Calender" and on one named
// "Calendar" but not marked: the date table was found by its name and mark, and a DAX table's columns carry no type)
// A date table by its SHAPE, never its name: a date column (typed date, or untyped in a table built with CALENDAR or
// CALENDARAUTO, which gives one row a day) and a month and a year column (by their DAX, or their names). Read from the
// model's own definitions (m.tmsl), where an untyped column is undefined, not guessed.
const untyped = (t) => (t == null || /^unknown$/i.test(String(t)) ? '' : String(t));
const MONTHISH = /\bmonth|الشهر|شهر/i, YEARISH = /\byear|السنة|سنة/i;
function dateTableShapes(m) {
  if (!m) return [];
  const raw = (m.tmsl && m.tmsl.model && Array.isArray(m.tmsl.model.tables)) ? m.tmsl.model.tables : [];
  return (m.tables || []).map((t) => {
    const r = raw.find((x) => x && x.name === t.name) || {}, rc = Array.isArray(r.columns) ? r.columns : [];
    const expr = (Array.isArray(r.partitions) ? r.partitions : []).map((p) => (p && p.source && typeof p.source.expression === 'string' ? p.source.expression : Array.isArray(p && p.source && p.source.expression) ? p.source.expression.join('\n') : '')).join('\n');
    const calendar = /\bCALENDAR(AUTO)?\s*\(/i.test(expr);
    // (rc.5: the TMDL reader marks an untyped DAX column 'unknown': untyped, as an empty type)
    const typeOf = (c) => { const x = rc.find((y) => y && y.name === c.name); return untyped(x ? x.dataType : c.dataType); };
    const dates = (t.columns || []).filter((c) => /^date(time)?$/i.test(typeOf(c)) || (calendar && !typeOf(c) && /^\[?date\]?$/i.test(String((rc.find((y) => y && y.name === c.name) || {}).sourceColumn || c.name))));
    const text = expr + ' ' + (t.columns || []).map((c) => c.name).join(' ');
    const shaped = dates.length && MONTHISH.test(text) && YEARISH.test(text);
    return shaped ? { name: t.name, marked: !!t.date, calendar, dates: dates.map((c) => c.name) } : null;
  }).filter(Boolean);
}
// the date tables (by shape) and every date column of the model, "Table.Column" (a continuous axis: T-2)
export const dateTablesOf = (m) => dateTableShapes(m).map((t) => t.name);
export const dateColumnsOf = (m) => (m ? [...new Set([].concat(...(m.tables || []).map((t) => (t.columns || []).filter(isDateCol).map((c) => t.name + '.' + c.name)), ...dateTableShapes(m).map((t) => t.dates.map((c) => t.name + '.' + c))))] : []);

// ---- the Arabic month column: a TMDL script offered when the model has one date table and no Arabic month ----
const tmdlName = (n) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(n) ? n : "'" + String(n).replace(/'/g, "''") + "'");
const daxCol = (t, c) => "'" + String(t).replace(/'/g, "''") + "'[" + String(c).replace(/]/g, ']]') + ']';
// (0.3.0 C1, the owner, 21 Oct) the full set of Arabic calendar columns (the shared builder, arabic-calendar.js): the
// Arabic twins of what the date table has (months, days, quarters, fiscal year and quarter, Hijri months, the flags'
// labels), each sorted by its English column's own sort column, else by the month number found here, else by a hidden
// number written with it. The month column stays first and as before (arabicMonth's own fields); the rest beside it
export function monthOffer(model, loc, outBase) {
  if (!model.m) return { offered: false, why: model.why };
  const m = model.m, isDate = isDateCol;
  // (T-5: by shape; when several, the one marked as the date table, then the one built with CALENDAR)
  const shapes = dateTableShapes(m);
  let pick = shapes; if (pick.length > 1 && pick.some((x) => x.marked)) pick = pick.filter((x) => x.marked); if (pick.length > 1 && pick.some((x) => x.calendar)) pick = pick.filter((x) => x.calendar);
  const cands = pick.map((x) => Object.assign({}, (m.tables || []).find((t) => t.name === x.name), { shapeDates: x.dates }));
  if (cands.length !== 1) return { offered: false, why: cands.length ? `the model has ${cands.length} date tables: say which one, and the columns are a model step done by hand` : 'the model has no date table (a table with a date column and month and year columns; built with CALENDAR or CALENDARAUTO, or marked as the date table)' };
  // (0.3.0 F7, the red team's F-2; AUD-032: a name with a control character, a tab or a line break, is never written raw
  // into a script) the date table, its date column or a column with one is left out and named, with why; a bidi or
  // zero-width name stays (inside its quotes, as every script writes it)
  const CC = 'its name holds a control character (a tab or a line break): no script names it; rename it in Power BI Desktop, then ask again';
  if (hasControl(cands[0].name)) return { offered: false, why: `the date table "${nm(cands[0].name)}": ${CC}`, leftOut: [{ table: nm(cands[0].name), why: CC }] };
  const t = cands[0], ccCols = (t.columns || []).filter((c) => hasControl(c.name)), cols = (t.columns || []).filter((c) => !hasControl(c.name));
  const ccLeft = ccCols.map((c) => ({ column: nm(c.name), why: CC }));
  const has = (re) => cols.find((c) => re.test(String(c.name)));
  const arabicMonthThere = !!(has(/^month name \(arabic\)$/i) || cols.some((c) => /(arabic|عربي|\bAR\b)/i.test(c.name) && /(month|شهر)/i.test(c.name)) || has(/^(اسم\s*)?الشهر$/));
  const raw = ((m.tmsl && m.tmsl.model && m.tmsl.model.tables) || []).find((x) => x.name === t.name) || {};
  const date = (raw.columns || []).find((c) => c.name && !hasControl(c.name) && isDate(c) && c.isKey) || cols.find(isDate) || cols.find((c) => (t.shapeDates || []).includes(c.name));
  // the month number to sort by: an integer column named like one (an untyped DAX column of that name counts: its DAX makes it a number)
  const typedRaw = (c) => { const x = (raw.columns || []).find((y) => y && y.name === c.name); return untyped(x ? x.dataType : c.dataType); };
  if (!date) return { offered: false, why: `the date table "${nm(t.name)}" has no date column a script can name`, ...(ccLeft.length ? { leftOut: ccLeft } : {}) };
  // (rc.5: an untyped column of a calculated calendar is a number only when its DAX there is MONTH ( ... ): a plain
  // "Month" there was FORMAT ( [Date], "MMM" ), a text, and sorting by it puts the months in alphabetical order)
  const calcExpr = (raw.partitions || []).filter((p) => p && p.source && p.source.type === 'calculated').map((p) => (Array.isArray(p.source.expression) ? p.source.expression.join('\n') : String(p.source.expression || ''))).join('\n');
  const daxFn = (c) => { const r = new RegExp('"' + String(c.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/"/g, '""') + '"\\s*,\\s*([A-Za-z.]+)\\s*\\(', 'i').exec(calcExpr); return r ? r[1].toUpperCase() : null; };
  const isMonthNo = (c) => { const ty = typedRaw(c), fn = ty ? null : daxFn(c), name = String(c.name).trim();
    if (ty) return /^int64$/i.test(ty) && /^(month\s*(number|no\.?|num|nr|of year|index)|monthnum(ber)?|month)$/i.test(name);
    if (fn) return fn === 'MONTH';
    return /^(month\s*(number|no\.?|num|nr|of year|index)|monthnum(ber)?)$/i.test(name); };
  const num = cols.find(isMonthNo);
  const calculated = (raw.partitions || []).some((p) => p.source && p.source.type === 'calculated');
  const ref = (c) => daxCol(t.name, c), dref = ref(date.name), col = (re) => cols.find((c) => re.test(String(c.name).trim()));
  const sortOf = (c) => { const x = (raw.columns || []).find((y) => y && y.name === c.name); return x && x.sortByColumn && !hasControl(x.sortByColumn) ? String(x.sortByColumn) : null; };
  const fyc = col(/^fiscal year$/i), fmc = col(/^fiscal month number$/i), fqc = col(/^fiscal quarter$/i), hmc = col(/^hijri month number$/i);
  const strip = (c, words) => words.reduce((e, w) => `SUBSTITUTE ( ${e}, "${w}", "" )`, ref(c.name));
  const list = cols.map((c) => ({ name: String(c.name), type: typedRaw(c) || '', sortBy: sortOf(c) }));
  // (as before C1: the month column even when the table names its months otherwise, "Month" or none)
  if (!arabicMonthThere && !list.some((c) => /^month name$/i.test(c.name))) list.unshift({ name: 'Month Name', type: 'string', sortBy: null });
  const built = ArabicCal.columnsFor({ columns: list.filter((c) => !(arabicMonthThere && /^month (name|short)$/i.test(c.name))),
    src: { month: `MONTH ( ${dref} )`, weekday: `WEEKDAY ( ${dref}, 1 )`, quarter: `QUARTER ( ${dref} )`, year: `YEAR ( ${dref} )`, hijriMonth: hmc ? ref(hmc.name) : null,
      fiscalMonth: fmc ? ref(fmc.name) : null, fiscalYearNo: fyc && /^int64$/i.test(typedRaw(fyc) || '') ? ref(fyc.name) : null,
      fiscalYearText: fyc && !/^int64$/i.test(typedRaw(fyc) || '') ? `TRIM ( ${strip(fyc, ['FY', 'fy'])} )` : null,
      fiscalQuarterText: fqc ? `TRIM ( ${strip(fqc, ['FQ', 'fq', 'Q', 'q'])} )` : null, flag: (n) => { const c = cols.find((x) => x.name === n); return c ? ref(c.name) : null; } },
    sorts: { month: num ? num.name : null, day: null, hijri: hmc ? hmc.name : null } });
  // the month column's sort as before: its English column's own, else the month number found, else a hidden one
  built.columns.filter((c) => c.kind === 'month').forEach((c) => { const en = list.find((x) => x.name === c.of); if (!(en && en.sortBy) && num) { c.sortBy = num.name; delete c.sortNew; } else if (!(en && en.sortBy) && !num) { c.sortBy = MONTH_SORT; c.sortNew = { name: MONTH_SORT, dax: `MONTH ( ${dref} )` }; } });
  built.skipped = ccLeft.map((x) => ({ of: x.column, why: x.why })).concat(built.skipped);
  if (!built.columns.length) return { offered: false, why: `the date table "${nm(t.name)}" has its Arabic calendar columns already${built.skipped.length ? ` (left out: ${built.skipped.map((x) => `${nm(x.of)}: ${x.why}`).join('; ')})` : ''}` };
  const seed = 'arabic-calendar\0' + t.name, tag = (n) => tagOf(seed, n), lines = ['createOrReplace', '', '\tref table ' + tmdlName(t.name), ''], made = new Set();
  built.columns.forEach((c) => { if (c.sortNew && !made.has(c.sortNew.name)) { made.add(c.sortNew.name); lines.push(`\t\tcolumn ${tmdlName(c.sortNew.name)} = ${c.sortNew.dax}`, '\t\t\tdataType: int64', '\t\t\tisHidden', `\t\t\tlineageTag: ${tag(c.sortNew.name)}`, '\t\t\tsummarizeBy: none', ''); } });
  built.columns.forEach((c) => lines.push(`\t\tcolumn ${tmdlName(c.name)} = ${c.dax}`, '\t\t\tdataType: string', `\t\t\tlineageTag: ${tag(c.name)}`, '\t\t\tsummarizeBy: none', ...(c.sortBy ? [`\t\t\tsortByColumn: ${tmdlName(c.sortBy)}`] : []), ''));
  const mc = built.columns.find((c) => c.name === MONTH_COLUMN);
  return { offered: true, table: nm(t.name), dateColumn: nm(date.name), column: mc ? MONTH_COLUMN : built.columns[0].name, sortBy: mc ? (mc.sortNew ? mc.sortBy + ' (written with it, hidden)' : nm(mc.sortBy)) : null,
    // (kept short: a twin's plan answer has one size budget, its texts first)
    columns: built.columns.map((c) => (c.sortBy ? { name: nm(c.name), sortBy: nm(c.sortBy) } : { name: nm(c.name) })),
    englishData: built.columns.filter((c) => cols.some((x) => x.name === c.of)).map((c) => `${nm(t.name)}[${nm(c.of)}]`),
    englishDataWhy: 'their values are the model\'s own English data: an Arabic page shows them as they are until the script adds their "(Arabic)" twins',
    ...(built.skipped.length ? { leftOut: built.skipped.map((x) => ({ column: nm(x.of), why: x.why })) } : {}),
    ...(calculated ? { note: 'the date table is a DAX (calculated) table: the lab added the column to its formula; adding it as a calculated column is not yet proven in Desktop through TMDL view: check Preview before Apply' } : {}),
    scriptAfterGo: `${outBase} - Arabic calendar.tmdl`, script: lines.join('\n') + '\n',
    howToApply: `Save a copy of the Power BI file first. Open the script file in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview (${built.columns.length} Arabic column${built.columns.length === 1 ? ' is' : 's are'} added to the date table, each sorted like its English column), then Apply. DataArcus never applies it: the model is changed only when the user applies it. Then ask for the Arabic report again (plan, approve, write): it binds the Arabic columns (يناير، الأحد، الربع 1، عطلة نهاية الأسبوع...) in place of the English ones.`,
    howToSwitch: 'Until the script is applied the Arabic report binds the English calendar columns (it always works) and shows their English values. To switch: apply the script in TMDL view, then plan the report again (plan_layout, approve, create_report): the Arabic columns are bound automatically.' };
}
// ---- the right-to-left waterfall's facts from the model (D1): a column's sort-by column and type, a measure's format ----
export const waterfallFacts = (m) => {
  const tab = (t) => (m && Array.isArray(m.tables) ? m.tables.find((x) => x && x.name === t) : null);
  const colOf = (t, c) => { const x = tab(t); return x && Array.isArray(x.columns) ? x.columns.find((y) => y && y.name === c) : null; };
  return { sortByOf: (t, c) => { const x = colOf(t, c); return x && x.sortBy ? String(x.sortBy) : null; }, typeOf: (t, c) => { const x = colOf(t, c); return x && x.dataType ? String(x.dataType) : null; },
    formatOf: (t, n) => { const x = tab(t), me = x && Array.isArray(x.measures) ? x.measures.find((y) => y && y.name === n) : null; return me && typeof me.formatString === 'string' && me.formatString ? me.formatString : null; } };
};
