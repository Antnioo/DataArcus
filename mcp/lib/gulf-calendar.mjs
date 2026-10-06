// add_gulf_calendar: the website's Calendar Generator table (Hijri dates, announced Ramadan and Eid, the country's
// weekend) as a TMDL script in a new file, for the user to apply in TMDL view. The table comes from the website's own
// generator (assets/js/calendar-generator.js, shared, never copied). Nothing is written into the model, the DAX is never
// in the answer, and a table, measure or column of the same name is refused, never replaced. Names read from the
// model are untrusted text: they are compared and quoted, never followed, and never placed in the DAX.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const Cal = require('../../assets/js/calendar-generator.js');
const GD = require('../../assets/js/gulf-dates.js');

const COUNTRY_CODES = ['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn'];
const FIXED = { 'sat-sun': 'Saturday + Sunday', 'fri-sat': 'Friday + Saturday', fri: 'Friday only', sun: 'Sunday only' };
const WEEK = { sunday: 'sun', monday: 'mon', saturday: 'sat' };
// the generator's names that sort by a number. Round 12 (the owner's go on round 11's recommendation 4a): written in the
// script as sortByColumn, since Desktop 2.158 applied a script with them, Problems 0, and three slicers came out January
// to December, Sunday to Saturday and Muharram to Dhu al-Hijjah (DESKTOP-TESTS.md round 11, D-GC3)
const SORTS = [['Month Name', 'Month Number'], ['Day Name', 'Day of Week'], ['Hijri Month Name', 'Hijri Month Number']];
// the gulfCalendar findings about the calendar itself (not the model's measures)
const CALENDAR_IDS = ['GC_NO_HIJRI', 'GC_NO_FLAGS', 'GC_WEEKEND', 'GC_DATES_DIFFER', 'GC_DATES_NOTE', 'GC_ESTIMATES', 'GC_ENDS_EARLY'];
const NOTHING = ' Nothing was written.';

const refuse = (msg) => { throw new Error(msg + NOTHING); };
const key = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
const T = (s) => Date.parse(s + 'T00:00:00Z');

// every name a new table must not take: tables (hidden and automatic ones too), measures and columns
function takenNames(raw) {
  const out = new Map();
  raw.forEach((t) => {
    out.set(key(t.name), { kind: 'table', name: String(t.name) });
    (t.measures || []).forEach((x) => { if (!out.has(key(x.name))) out.set(key(x.name), { kind: 'measure', name: `${t.name}[${x.name}]` }); });
    (t.columns || []).filter((c) => c.type !== 'rowNumber').forEach((c) => { if (!out.has(key(c.name))) out.set(key(c.name), { kind: 'column', name: `${t.name}[${c.name}]` }); });
  });
  return out;
}
const freeNames = (taken) => { const out = []; for (let n = 1; out.length < 2 && n < 100; n++) { const s = 'Gulf Calendar' + (n > 1 ? ' ' + n : ''); if (!taken.has(key(s))) out.push(s); } return out; };

// The script: one createOrReplace with the new table (its columns as Power BI Desktop saves a DAX table's columns,
// its DAX as the partition, the three names sorted by their numbers) and one relationship per relateTo column.
// Mark-as-date-table stays by hand until a person has seen the ribbon with it in a script (mcp/WORK.md, D-GC2).
function scriptOf(Fix, table, columns, body, rels) {
  const out = ['createOrReplace', '', `\ttable ${Fix.name(table)}`, ''], sortBy = new Map(SORTS.filter(([n, by]) => columns.includes(n) && columns.includes(by)));
  columns.forEach((c) => out.push(`\t\tcolumn ${Fix.name(c)}`, '\t\t\tisNameInferred', `\t\t\tsourceColumn: [${c.replace(/]/g, ']]')}]`, ...(sortBy.has(c) ? [`\t\t\tsortByColumn: ${Fix.name(sortBy.get(c))}`] : []), ''));
  out.push(`\t\tpartition ${Fix.name(table)} = calculated`, '\t\t\tmode: import', '\t\t\tsource =', ...body.split('\n').map((l) => '\t\t\t\t\t' + l), '');
  rels.forEach((r) => out.push(`\trelationship ${Fix.name(r.name)}`, `\t\tfromColumn: ${Fix.name(r.table)}.${Fix.name(r.column)}`, `\t\ttoColumn: ${Fix.name(table)}.Date`, ''));
  return out.join('\n').replace(/\n+$/, '\n');
}

/**
 * Builds the script and the answer. a: the tool's inputs; env: { Gulf, Fix, writeScript, scriptDir, scriptBase }.
 * Throws an Error (with "Nothing was written.") for every refusal.
 */
export function addGulfCalendar(m, a, env) {
  const { Gulf, Fix, writeScript, scriptDir, scriptBase } = env;
  const raw = ((m.tmsl && (m.tmsl.model || m.tmsl)) || {}).tables || [];
  const country = a.country || 'uae';
  if (!COUNTRY_CODES.includes(country)) refuse(`Unknown country "${country}": use one of ${COUNTRY_CODES.join(', ')}.`);
  const C = Gulf.COUNTRIES[country];

  // the table's name: the generator's letters (any script), digits, spaces and _; refused, never cleaned
  const table = String(a.name == null ? 'Gulf Calendar' : a.name).trim();
  if (!table || table.length > 40 || !/^[\p{L}\p{M}\p{N}_ ]+$/u.test(table)) refuse(`The table name ${JSON.stringify(String(a.name))} can't be used: use letters, digits, spaces and _ only, at most 40 characters.`);
  if (/^(LocalDateTable_|DateTableTemplate_)/i.test(table)) refuse(`The table name ${JSON.stringify(table)} is one Power BI uses for its automatic date tables.`);
  const taken = takenNames(raw), clash = taken.get(key(table));
  if (clash) refuse(`The model already has a ${clash.kind} named ${JSON.stringify(clash.name)}, so a table named ${JSON.stringify(table)} could replace or confuse it. A script never replaces anything: choose another name, for example ${freeNames(taken).map((n) => JSON.stringify(n)).join(' or ')}.`);

  // the years: required (the tool reads no data); the generator's limits (Power BI's DATE, at most 60 years)
  const fy = a.firstYear, ly = a.lastYear;
  if (!Number.isInteger(fy) || !Number.isInteger(ly)) refuse('firstYear and lastYear are required whole years: ask the user which years their data covers (the tool reads no data).');
  if (ly < fy) refuse(`lastYear (${ly}) is before firstYear (${fy}).`);
  if (ly - fy + 1 > 60) refuse(`${fy} to ${ly} is ${ly - fy + 1} years; the calendar takes at most 60.`);
  const start = `${String(fy).padStart(4, '0')}-01-01`, end = `${String(ly).padStart(4, '0')}-12-31`;
  if (fy < 1000 || Cal.parse(start) < Cal.MIN_DATE || ly > 9999 || Cal.parse(end) > Cal.MAX_DATE) refuse(`Power BI dates run from 1 March 1900 to 31 December 9999, so ${fy} to ${ly} can't be a calendar: the first year is at least 1901.`);

  // relationships, only for the date columns the user names
  const relateTo = a.relateTo || [];
  if (relateTo.length > 5) refuse('relateTo takes at most 5 columns.');
  const relNames = new Set((((m.tmsl && (m.tmsl.model || m.tmsl)) || {}).relationships || []).map((r) => key(r.name)));
  const rels = [], seen = new Set(), untyped = [];
  relateTo.forEach((x, i) => {
    const mk = String(x).trim().match(/^'?(.+?)'?\[(.+)\]$/);
    if (!mk) refuse(`relateTo[${i}] ${JSON.stringify(String(x))} is not written as Table[Column].`);
    const t = raw.find((y) => key(y.name) === key(mk[1]) && !/^(LocalDateTable_|DateTableTemplate_)/.test(String(y.name)));
    const c = t && (t.columns || []).find((y) => y.type !== 'rowNumber' && key(y.name) === key(mk[2]));
    if (!t || !c) refuse(`relateTo[${i}] ${JSON.stringify(String(x))} is not a column of the model.`);
    const type = String(c.dataType || '').toLowerCase();
    // (round 12, the owner's go on round 11's recommendation 4d: a column whose type the files don't give, a DAX table's,
    // is accepted with a note: the relationship fails loudly in Preview if it is not a date; seen in Desktop, round 11)
    if (type && type !== 'datetime' && type !== 'unknown') refuse(`relateTo[${i}] ${JSON.stringify(`${t.name}[${c.name}]`)} is not a date column (its type is ${type}).`);
    if (!type || type === 'unknown') untyped.push(`${t.name}[${c.name}]`);
    const k = key(t.name) + '|' + key(c.name);
    if (seen.has(k)) refuse(`relateTo names ${JSON.stringify(`${t.name}[${c.name}]`)} twice.`);
    seen.add(k);
    let n = rels.length + 1, name; do { name = `DataArcus ${table} ${n++}`; } while (relNames.has(key(name)));
    relNames.add(key(name));
    rels.push({ table: String(t.name), column: String(c.name), name });
  });

  // the generator's own table for these settings (the website's defaults for what isn't asked: fiscal and relative
  // columns on, Hijri on, as the page)
  const weekend = a.weekend === 'country' || a.weekend == null ? country : a.weekend;
  if (!(COUNTRY_CODES.includes(weekend) || FIXED[weekend])) refuse(`Unknown weekend "${a.weekend}".`);
  const st = Object.assign({}, Cal.DEFAULTS, { name: table, start, end, fy: a.fiscalStart || 1, week: WEEK[a.weekStart || 'sunday'], weekend, lang: a.lang || 'en',
    hijri: true, fiscal: true, relative: true, observed: a.announced !== false });
  if (!Cal.hijriFmt) refuse('This Node.js has no Umm al-Qura calendar (it needs full ICU), so the Hijri dates can\'t be worked out.');
  const built = Cal.build(st), body = built.dax.split('\n').slice(1).join('\n');

  // what the check reads in the table it makes (the same reader as check_model_health's gulfCalendar section)
  const own = Gulf.analyze({ model: { tables: [{ name: table, columns: built.columns.map((name) => ({ name })), partitions: [{ source: { type: 'calculated', expression: body } }] }] } },
    { country, asOf: a.asOf, maxItems: 5 });
  const selfCheck = { calendar: own.calendar && own.calendar.kind, country: C.name,
    findings: own.findings.filter((f) => CALENDAR_IDS.includes(f.id)).map((f) => ({ id: f.id, title: f.title, count: f.count })) };
  const before = Gulf.analyze(m.tmsl, { country, asOf: a.asOf, maxItems: 1 });
  const notes = [];
  if (before.calendar && before.calendar.kind === 'dataarcus-dax') notes.push(`The model already has a calendar made by the DataArcus generator (${JSON.stringify(before.calendar.table)}). This adds a second one; use one of them for the relationships.`);
  if (untyped.length) notes.push(`The type of ${untyped.join(', ')} is not in the model's files (a DAX table's column), so it could not be checked: make sure ${untyped.length === 1 ? 'it is a date column' : 'they are date columns'}. If not, Preview shows the relationship as an error and nothing should be applied.`);
  if (st.observed && country !== 'uae' && country !== 'ksa') notes.push(`The announced dates are the UAE's; none are sourced for ${C.name} yet. Where ${C.name} announces another date, it shows in check_model_health's gulfCalendar section.`);

  // the file: next to the project, a free name, never over another file; the same script asked again names its file
  if (!scriptDir) refuse('The working folder is the model folder itself, and a script is never written inside a model folder. Choose the project folder (the folder that holds the model folder) as the working folder and ask again.');
  const script = scriptOf(Fix, table, built.columns, body, rels);
  let file; try { file = writeScript(scriptDir, scriptBase + ' - add Gulf calendar', script); } catch (e) { refuse('The script could not be written to ' + scriptDir + ' (' + String((e && e.code) || (e && e.message) || e) + ').'); }

  const later = st.observed ? GD.events.flatMap((e) => [['ramadan', e.ramadan, 0], ['fitr', e.fitr, 0], ['adha', e.adha, 9]].filter(([, d]) => d)
    .filter(([, d, back]) => T(d) - back * 864e5 > T(GD.checked) && T(d) >= T(start) && T(d) <= T(end)).map(([, d]) => d)).sort()[0] || null : null;
  const q = JSON.stringify(table);
  // (round 12: the sort-by columns are in the script now, so marking the date table is the one step by hand)
  const byHand = [`Mark ${q} as the date table: in Data view select it, then Table tools > Mark as date table > Date.`];
  if (!rels.length) byHand.push(`Relate your fact tables' date columns to ${q}[Date] (Model view: drag each date column onto Date; many to one, single direction).`);
  return {
    scriptFile: file, table, rows: built.rows, columns: built.columns, range: { from: start, to: end },
    country: { code: country, name: C.name }, weekend: COUNTRY_CODES.includes(weekend) ? Gulf.COUNTRIES[weekend].weekendOption : FIXED[weekend], weekStart: a.weekStart || 'sunday',
    announced: st.observed ? { on: true, checkedTo: GD.checked, estimatesFrom: later, why: 'Ramadan, Shawwal and Dhu al-Hijjah start on the UAE\'s announced dates up to ' + GD.checked + '; later ones are Umm al-Qura estimates, flagged in Is Estimated Date. Sources: scripts/gulf-calendar/DATES-SOURCES.md.' }
      : { on: false, why: 'Umm al-Qura for every month, as the website does with the option off.' },
    relationships: rels.map((r) => `${r.table}[${r.column}] -> ${table}[Date] (many to one, single direction)`),
    byHand,
    howToApply: `The script is in the file "${file.split(/[\\/]/).pop()}", next to the project. Save a copy of your file first. In Power BI Desktop open TMDL view, open a new tab and paste the file's text, then choose Preview: it must show one new table ${q}${rels.length ? ' and ' + rels.length + ' new relationship' + (rels.length > 1 ? 's' : '') : ''}, and nothing changed or replaced. If Preview shows a change to a table you already have, stop: the model changed since the files were read. Preview will not warn about it: it shows a table of the same name as replaced, without an error (seen in Desktop). Then Apply, refresh the table (Home > Refresh) and do the steps by hand. The script is never applied by this tool.`,
    selfCheck,
    ...(notes.length ? { notes } : {})
  };
}

// check_model_health's gulfCalendar fix, for this tool: the same settings as the Calendar Generator's, as its inputs
export function gulfFixInputs(gc) {
  const cg = gc && gc.fixes && gc.fixes.calendarGenerator;
  if (!cg) return null;
  const year = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(String(s)) ? +String(s).slice(0, 4) : null);
  const code = gc.country && gc.country.code;
  const inputs = { firstYear: year(cg.settings.firstDate), lastYear: year(cg.settings.lastDate), country: code, weekend: 'country', announced: code === 'uae' || code === 'ksa' ? true : null };
  const ask = Object.keys(inputs).filter((k) => inputs[k] === null);
  ask.forEach((k) => delete inputs[k]);
  return { tool: 'add_gulf_calendar', inputs, ...(ask.length ? { askTheUser: ask } : {}),
    what: 'add_gulf_calendar writes this table as a TMDL script in a new file next to the project, for the user to apply in TMDL view; nothing is written into the model.' };
}
