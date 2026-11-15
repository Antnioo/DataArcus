/*
 * DataArcus - the field catalog: a Power BI model's metadata, read and normalised for the field picker (the website)
 * and the MCP (suggest_fields, plan_layout, create_report). 0.3.2 SP30: moved from pbip-bind.js, which re-exports every
 * name it exported (the same functions). Pure: no file, no page, no network, no state but the META side table; never a
 * data value (names, types, formats, DAX and relationships only).
 *
 * The {tables, relationships, fields} contract (one input, one output each):
 *   tables         the readers' shape: [{ name, hidden, date, columns: [{ name, dataType, isHidden, dataCategory, sortBy?,
 *                  displayFolder?, formatString?, summarizeBy? }], measures: [{ name, isHidden, formatString, divides,
 *                  displayFolder?, formatStringDefinition? }] }] (a measure's DAX in META: exprOf)
 *   relationships  [{ fromTable, toTable, both? }], the active ones (many to one, from fromTable to toTable; both: relationship-filter.js)
 *   fields         the Field shape below: { measures, columns, hiddenMeasures } from catalog(tables, modelTables?)
 * Interface:
 *   fromTmsl(json) -> tables; relsOfTmsl(json) -> relationships; clean(tables) -> tables without the automatic date
 *   tables; markCalendars(tables, json) -> tables (marks dateKey and the relationship keys in META)
 *   catalog(tables, modelTables?) -> fields; fieldOf(table, name) -> Field | null; measureOf(table, name, tables) -> Field
 *   | null; measureCard(measure, tables) -> { text, pct, pctFormat?, wholeFormat?, ... }; isPercent(name, format, dax)
 *   reached(tables, { t, m }, relationships) -> Set of table names; readTables(tables, { m }) -> [table names];
 *   reachTable(tableFields, { relationships, modelTables }) -> { table, notReached } (its cache keyed by that options
 *   object, never put on it)
 *   langOf(name), langsOf(tables), twinsOf(tables), fieldKey(t, c), exprOf(o), metaOf(o), isDateTable(t), nameLike(n),
 *   sortColumnFor(columns, name), dateColumnFor(columns, name, type, table)
 *   and the shape rules field-suggest.js ranks with: CORE, argsOf, inlineVars, valueKey, splitName, sortKind, SORT_BY,
 *   FAMILY, family. META is one WeakMap, shared by the catalog and the ranking through metaOf: never copied.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  // the one field-meaning rule (assets/js/field-meaning.js, shared with the health check: the block audit's A1-11, 11 Oct)
  const FM = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./field-meaning.js') : root.DataArcusFieldMeaning;
  // the sort-column rule (0.3.2 DD1H): sort-column.js, its one home; the page loads it before this file
  const SC = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./sort-column.js') : root.DASortColumn;
  // is this text Arabic: arabic-script.js, its one home (0.3.2 DD1F; CONTRACTS.md 1f)
  const AS = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./arabic-script.js') : root.DAArabicScript;
  // which ways a relationship filters: relationship-filter.js, its one home (0.3.3 LX1, AUD-069: a one-to-one filters both ways)
  const RF = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./relationship-filter.js') : root.DARelationshipFilter;
  /**
   * The field shape the picker gives out (builder 7's audit A3-9, 11 Oct: one documented contract):
   * @typedef {Object} Field
   * @property {string} t        the table
   * @property {string} [c]      a column's name (a column field)
   * @property {string} [m]      a measure's name (a measure field)
   * @property {string} [type]   a column's type as the model gives it (string, int64, double, dateTime, unknown...)
   * @property {boolean} [num]   a column the model types as a number
   * @property {{t: string, c: string}} [sortBy]  the number column that puts a month or day name in order (the model has none)
   * @property {boolean} [ordered] the model sorts the column itself (its sort-by column)
   * @property {{t: string, c: string}} [dateOf]  the date a month label is ordered and limited by (a date table's)
   * @property {boolean} [time]  a time category (A3-8): a date table's column, one sorted by a number, or a date
   * @property {{kind: string, rows: ?number, family: string}} [cal]  a calendar category (A3-7)
   * @property {boolean} [pct]   a measure shown as a percent; pctFormat its format
   * @property {string} [pctFormat]
   * @property {string} [wholeFormat] a measure shown as its whole number, in this format
   * @property {number} [agg]    a column a visual counts or sums (0 Sum, 2 DistinctCount, 5 Count); name its label
   * What the picker knows beyond that shape (a measure's DAX, a column's language, place and twin, an amount, a TMDL
   * measure under construction) is kept in META, a side table no copy of a field keeps or loses: never a hidden property.
   */
  const META = new WeakMap(), REACH = new WeakMap();
  const meta = (o) => { let r = META.get(o); if (!r) { r = {}; META.set(o, r); } return r; };
  const metaOf = (o) => (o && typeof o === 'object' && META.get(o)) || {};
  // a measure's DAX: the reader's (META), or the expression the object carries (a model.bim measure, a caller's)
  const exprOf = (o) => { if (!o) return ''; const e = metaOf(o).expr; if (e != null) return e; const x = o.expr != null ? o.expr : o.expression; return Array.isArray(x) ? x.join('\n') : x == null ? '' : String(x); };
  // a measure's expression, kept (up to 4,000 characters) only for what the picker reads from it: whether it counts and
  // whether it returns text (never sent anywhere: the field picker and the report writer read it on the user's machine)
  const addExpr = (m, line) => { const t = String(line || '').trim(); if (!t) return; const prev = metaOf(m).expr; meta(m).expr = (prev ? prev + '\n' + t : t).slice(0, 4000); };
  // model.bim / DataModelSchema (TMSL JSON) into the same shape
  function fromTmsl(json) {
    const m = (json && json.model) || json || {};
    return markCalendars((m.tables || []).filter((t) => t && t.name != null).map((t) => tableExprCols(t, {
      name: String(t.name), hidden: !!t.isHidden, date: /^time$/i.test(t.dataCategory || ''),
      columns: (t.columns || []).filter((c) => c.type !== 'rowNumber' && c.name != null)
        // (A1-6: a column with no type is unknown, as in TMDL: never guessed as text)
        .map((c) => { const o = Object.assign({ name: String(c.name), dataType: c.dataType || 'unknown', isHidden: !!c.isHidden, dataCategory: c.dataCategory }, c.sortByColumn ? { sortBy: String(c.sortByColumn) } : {}, c.displayFolder ? { displayFolder: String(c.displayFolder) } : {}, c.formatString != null ? { formatString: String(c.formatString) } : {}, c.summarizeBy ? { summarizeBy: String(c.summarizeBy) } : {});
          if (c.expression != null) meta(o).expr = String(Array.isArray(c.expression) ? c.expression.join('\n') : c.expression).slice(0, 4000);   // (a calculated column's DAX: D11, two values)
          if (c.isKey === true || String(c.isKey) === 'true') meta(o).key = true;   // (round 8, N1: the model's own key column)
          return o; }),
      measures: (t.measures || []).filter((x) => x.name != null).map((x) => { const m = Object.assign({ name: String(x.name), isHidden: !!x.isHidden, formatString: x.formatString, divides: divides(x.expression) }, x.displayFolder ? { displayFolder: String(x.displayFolder) } : {}, x.formatStringDefinition ? { formatStringDefinition: true } : {}); addExpr(m, Array.isArray(x.expression) ? x.expression.join('\n') : x.expression); return m; })
    })), m);
  }
  // (round 10, RESCORE-3's D11: a calculated table's columns made by ADDCOLUMNS or SELECTCOLUMNS ("Week Type", IF (...)):
  // each column without its own expression takes its pair's, so a two-word IF there marks it two-valued)
  function tableExprCols(t, out) {
    const src = (t.partitions || []).map((p) => p && p.source && p.source.expression).concat([t.expression]).find((e) => e != null);
    const e = String(Array.isArray(src) ? src.join('\n') : src || '').trim(), m0 = e.match(/^(ADDCOLUMNS|SELECTCOLUMNS)\s*\(([\s\S]*)\)$/i);
    // (round 11, RESCORE-4's N18: a table built with CALENDAR or CALENDARAUTO is a calendar by its shape, whatever its name)
    if (/\bCALENDAR(AUTO)?\s*\(/i.test(e)) meta(out).calendarShape = true;   // (the picker's note: the model's answers are unchanged)
    // (0.3.1 FX4b, the owner's D-1028-07) the years a calendar's own DAX names, CALENDAR ( DATE ( y1, .. ), DATE ( y2, .. ) ):
    // the model's definition, never its data; suggest's time axis rule reads whether they span more than one year
    const yrs = e.match(/\bCALENDAR\s*\(\s*DATE\s*\(\s*(\d{4})\s*,[^()]*\)\s*,\s*DATE\s*\(\s*(\d{4})\s*,/i);
    if (yrs) meta(out).years = [+yrs[1], +yrs[2]];
    if (!m0) return out;
    const a = argsOf(m0[2]);
    for (let i = 1; i + 1 < a.length; i += 2) { const nm = a[i].match(/^"((?:[^"]|"")*)"$/); if (!nm) continue;
      const c = out.columns.find((x) => x.name === nm[1].replace(/""/g, '"')); if (c && metaOf(c).expr == null) meta(c).expr = a[i + 1].slice(0, 4000); }
    return out;
  }
  // Round 23 (the owner's "nothing critical left": the website's picker had no relationships, so a download could show
  // the same total on every bar): the active relationships a model carries, { fromTable, toTable }, as the MCP gives
  // them to suggest. From a model.bim or DataModelSchema (TMSL: isActive) or the health engine's answer (active), and
  // from a project's definition/relationships.tmdl (isActive: false left out; a column is Table.Column, either quoted).
  const relsOfTmsl = (json) => { const m = (json && json.model) || json || {};
    return (m.relationships || []).filter((r) => r && r.fromTable && r.toTable && r.isActive !== false && String(r.isActive) !== 'false' && r.active !== false).map((r) => Object.assign({ fromTable: String(r.fromTable), toTable: String(r.toTable) }, RF.filtersBoth(r) ? { both: true } : {})); };   // (part 5: both: filters both ways; LX1: a one-to-one too, RF)
  // Power BI's hidden automatic date tables are not fields anyone picks
  const clean = (tables) => tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));

  // A percentage: a % in the format or the name, or a name that says ratio or rate. "Margin" and "share" are money
  // as often as a percentage ("Total Margin" = SUM): they count only when the measure has no format and its DAX
  // divides (DIVIDE or /). x: { name, formatString, divides }
  const divides = FM.divides;
  // (round 12, the owner's ask, 6 Oct 2026: "vs", "growth" and "change" count too, on the same terms as margin and share)
  // (the block audit's A1-11, 11 Oct: the format string decides first: a number format without % is no percent; a name
  // alone counts only by whole words and never for a NOT_PCT name: "Corporate Revenue", "Generated Leads", "Exchange
  // Rate" are no percents. The rule is field-meaning.js's, shared with the health check)
  const PCT = (x) => FM.formatHasPercent(x.formatString) || (!(x.formatString && FM.isNumberFormat(x.formatString)) && FM.percentFromName(x.name, { divides: !!x.divides, format: x.formatString, soft: 'noFormat' }));
  // Round 12 (#26; seen in Desktop 2.158, golden task 8: a KPI card showed "Yes"): a measure that shows text, never a
  // number: a format of quoted words only ("Yes";"Yes";"No"), Yes/No, True/False, On/Off, a date format; or DAX that
  // returns text (a string at the top, FORMAT, CONCATENATE, text joined with &, an IF or SWITCH whose results are
  // strings). It is never put on a KPI card.
  const TEXT_FMT = FM.isTextFormat, TEXT_EXPR = FM.TEXT_EXPR;
  const isText = (x) => TEXT_FMT(x.formatString) || TEXT_EXPR.test(exprOf(x));
  // a measure that counts (its DAX counts rows or values)
  const COUNTS = FM.COUNTS;
  // Round 12, the owner's ask (6 Oct 2026): a KPI card shows a percent as a percent without useless decimals (the
  // model's percent format where it has one decimal or none, otherwise "0.0%"), a measure whose format has no decimals
  // (or a count without a format) as its whole number with separators ("179", "101,914"), and the rest with automatic
  // units and 2 decimals. The model's own format read alone: { pct, pctFormat } or { pct, wholeFormat } or { pct }.
  const ownKind = (x) => {
    const f = String(x.formatString || '');
    if (PCT(x)) { const d = (f.match(/\.([0#]+)\s*%/) || ['', ''])[1].length; return { pct: true, pctFormat: /%/.test(f) && d <= 1 ? f : '0.0%' }; }
    if (isText(x)) return { pct: false };
    // 0.2.9 (O-2 of the owner's test of 0.2.8: "EUR 54,662,000" on a card where he wanted EUR 54.66M): an amount (a
    // currency in its format, or a sum of money: a SUM with a money word in its name) keeps automatic units with 2
    // decimals although its format has none; counts and other whole numbers stay whole
    if (f && !/\.[0#]/.test(f) && /[0#]/.test(f)) return AMOUNT(x, f) ? { pct: false } : { pct: false, wholeFormat: /^[#,0]+$/.test(f) ? '#,0' : f };
    if (!f && COUNTS.test(exprOf(x))) return { pct: false, wholeFormat: '#,0' };
    return { pct: false };
  };
  // A measure's card and table formats (builder 7's audit A3-3, 11 Oct: the server re-decided them after the picker by
  // a second rule, so the website's download and the MCP's showed one measure two ways): the one format rule
  // (field-meaning.js reportFormatOf) decides where it would change the model's format; the model's own format (ownKind)
  // where the rule leaves it alone. tables: the model's (a sum of a whole-number column is a count).
  // Returns { pct, pctFormat?, wholeFormat?, tableFormat?, fullFormat? }: tableFormat, a table column's format;
  // fullFormat, the card's with kpiValues "full" (never a percent)
  // (writer round 9, the laptop's N8, SHAPES-RC4: "-€0,050.87M": the model's "€#,##0,000;-€#,##0,000;€0" has fixed zero
  // placeholders after a thousands comma; scaled to millions by the card's automatic units the number is padded to four
  // digits. Radiation from the report writer's block, explained: such a card shows the number unscaled, in the model's
  // format with the padding taken out (all but the last zero of each section's whole part made "#"), as a whole number's
  // card does (Custom units and its format, measured D8); an ordinary "€#,0" keeps automatic units.)
  const padded = (f) => String(f || '').split(';').some((sec) => { const m = sec.replace(/"[^"]*"|\\./g, '').match(/[#0,]+/); return !!m && /0,*[#0]/.test(m[0]); });
  // (round 10, RESCORE-3 N11 + N13: the unscaled number, "-€50,866,000", was cut on a 6-card row and read in another style
  // than the row's "€ 105.53M" cards) the card's own format scales to millions (the value's size isn't known when the
  // report is written): each sign section keeps its symbols and text, its number becomes #,0,,.00"M" (Microsoft's rule: two
  // commas just left of the decimal point divide by a million, model, visual and element level alike), so a text suffix
  // follows the "M" with its space ("-50.87M AED"); a zero section (the third) stays as the model wrote it
  const scaled = (f) => String(f).split(';').map((sec, i) => { if (i === 2) return sec; let done = false;
    return sec.replace(/("[^"]*"|\\.)|([#0][#0,]*(?:\.[#0]+)?)/g, (all, q, run) => (q || done ? all : (done = true, '#,0,,.00"M"'))); }).join(';');
  // (F4) a section's quoted text after its last digit placeholder, or before its first when that text is no currency
  const glued = (f) => String(f || '').split(';').some((sec) => { const last = Math.max(sec.lastIndexOf('0'), sec.lastIndexOf('#')), first = sec.search(/[#0]/);
    return (sec.match(/"[^"]*"/g) || []).some((q) => { const at = sec.indexOf(q); return /\S/.test(q.slice(1, -1)) && (at > last || (at < first && !hasCurrency(q))); }); });
  const cardKind = (x, tables) => { const k = cardKind0(x, tables), f = x.formatString;
    if (!k.pct && padded(f) && !(k.wholeFormat && !padded(k.wholeFormat))) k.wholeFormat = scaled(f);
    // (writer round 9, the laptop's F4, N8-LAB: "#,0 \"AED\";-#,0 \"AED\"" read "-50.87KAED" / "50.87MAED" in automatic units,
    // the unit letter glued to the text; with Custom units and the model's own format it read right: a format with quoted
    // text after the number (a suffix), or before it when it is no currency (the owner's O-2: "EUR" #,0 reads "EUR 54.66M"
    // in automatic units, and so does a currency code or sign before the number), is shown unscaled in that format, as N8's)
    // (round 10's review: a text suffix without padding is not forced to millions, "950 AED" would read "0.00M AED"; the
    // card takes N8-LAB's setting B, automatic units with its decimals left unset, measured right: "-51K AED", "51K AED",
    // the space kept, a small value whole)
    else if (!k.pct && !k.wholeFormat && glued(f)) k.unitAuto = true;
    return k; };
  const cardKind0 = (x, tables) => {
    const r = FM.reportFormatOf({ name: x.name, formatString: x.formatString, formatStringDefinition: x.formatStringDefinition, expression: exprOf(x) }, 'measure', tables || []);
    if (r && /%/.test(r.format)) return { pct: true, pctFormat: r.format, tableFormat: r.format };
    const own = ownKind(x);
    // (writer round 8, RESCORE-1 D18, radiation from the report writer's block: "$4,344,705.7026" in a table, the model's own
    // format where the rule leaves it alone: a table shows 2 decimals at most, the report's number rule, its currency and
    // separators kept; the cards keep their own rule)
    // (writer round 9, RESCORE-2 D18: "$2,484,247.5", "$1,395,881.25" and "$2,721,900" in one column from "$#,0.####", cut to
    // "$#,0.##": optional digits are made fixed, so one column has one number of decimals, 2; a fixed 1 or 2 stays as it is)
    const fs0 = String(x.formatString || ''), dec = (fs0.match(/\.[0#]+/g) || []);
    const two = !own.pct && !/%/.test(fs0) && dec.some((d) => d.length > 3 || d.includes('#')) ? fs0.replace(/\.[0#]+/g, '.00') : null;
    if (!r) return Object.assign(own, own.pctFormat && own.pctFormat !== x.formatString ? { tableFormat: own.pctFormat } : two ? { tableFormat: two } : {});
    delete own.pctFormat; own.pct = false;
    // (the second sweep, I8: an amount by its formula, a sum of a decimal column or a row's quantity x price, keeps
    // automatic units on its card although the model gives it no format; a count or a whole quantity stays whole)
    const amountByFormula = !String(x.formatString || '').trim() && !x.formatStringDefinition && sumOfDecimal(exprOf(x), tables || []);   // (no format at all: a format the model gives decides, round 12)
    if (amountByFormula) delete own.wholeFormat;
    return Object.assign(own, r.format === '#,0' && !amountByFormula ? { wholeFormat: '#,0' } : {}, { tableFormat: r.format, fullFormat: r.format });
  };
  // an amount for the card rule above, read from the format string: a currency in it, by its ISO 4217 code ("EUR" #,0,
  // #,0 "INR") or a currency sign ($, €, £, ¥, ₹, the Gulf's د.إ and ر.س ...); a unit ("kg", "pcs") is no currency.
  // (The cross-review's G2, 11 Oct: the first cut took any short quoted text for a currency.) Without a currency, a plain
  // SUM whose name says money and whose format has no unit is an amount too: a weak tiebreak by the name, documented.
  const hasCurrency = FM.hasCurrency, hasUnit = FM.hasUnit;
  const MONEY = /revenue|sales|amount|income|profit|cost|budget|spend|المبيعات|الإيرادات|التكلفة|الميزانية|المبلغ/i;
  const AMOUNT = (x, f) => !COUNTS.test(exprOf(x)) && (hasCurrency(f) || (!hasUnit(f) && MONEY.test(x.name || '') && /^\s*SUM\s*\(/i.test(exprOf(x))));
  // time intelligence variants (MTD, PY, YoY %...) are not the headline number
  // (builder 7's audit A3-5, 11 Oct: "Avg" and "Average" made "Average Order Value" a variant; an average is a base
  // measure. A variant is a time-intelligence measure: by its name's whole words, or by its DAX (language-free))
  const VARIANT = /\b(PY|LY|YoY|MoM|QoQ|MTD|QTD|YTD|PYTD|PM|Prior|Previous|Prev|Last|vs|Rolling|Running|\d+D)\b/i;
  const TIME_DAX = /\b(SAMEPERIODLASTYEAR|DATEADD|PARALLELPERIOD|PREVIOUS(DAY|MONTH|QUARTER|YEAR)|TOTAL(MTD|QTD|YTD)|DATES(MTD|QTD|YTD|INPERIOD|BETWEEN))\s*\(/i;
  const isVariant = (m) => VARIANT.test(String(m.name)) || TIME_DAX.test(exprOf(m));
  // a measure someone left behind: the whole word old, test, unused, backup or temp in its name ("Sales (old)", "Test
  // margin", "TEMP total"; not "Oldham", "Latest" or "Contest"). It is picked only when no other measure is left.
  const STALE = /(^|[^A-Za-z])(old|test|unused|backup|temp)([^A-Za-z]|$)/i;
  // 0.2.9 (O-7: an executive page got computed indicators where the user wanted the core counts and amounts; the
  // cross-review's G1, 11 Oct: ranked by the measure's shape and format, not by a list of names): a plain count or sum
  // of one column is a core number (+3), an amount in a currency +1; the name words (TIEBREAK_WORDS) only break ties (+0.5)
  const CORE = /^\s*(SUM|COUNTROWS|COUNT|COUNTA|DISTINCTCOUNT(NOBLANK)?)\s*\([^()]*\)\s*$/i;
  // (the rc's laptop proof, 11 Oct: picks by formula and format, never by names)
  // D4: a what-if parameter's value is the slicer's selection, never a number of the model: SELECTEDVALUE, or
  // IF(HASONEVALUE(...), VALUES(...)), at the top of the DAX
  const PARAM_DAX = /^\s*(SELECTEDVALUE\s*\(|IF\s*\(\s*HASONEVALUE\s*\()/i;
  // D2: a helper (a Top N threshold, a rank) only serves another visual's filter or sort
  const HELPER_DAX = /\b(RANKX|TOPN|RANK)\s*\(/i;
  // D14: a share of the total, [X] divided by [X] with every filter removed, is 100 % on a card: never a card
  // (round 8, N5: any value over itself under ALL, written with DIVIDE or "/": a measure, a SUM, any expression; spaces aside)
  const SHARE_OF_ALL = { test: (e) => { const x = String(e || '').replace(/\s+/g, '');
    return /DIVIDE\((.+?),CALCULATE\(\1,(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT)\(/i.test(x) || /^(.+?)\/CALCULATE\(\1,(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT)\(/i.test(x); } };
  // N4 (round 8): the model's placeholder measure: no expression, BLANK (), or a constant (a number or a text): never a card
  const PLACEHOLDER = { test: (e) => /^\s*(BLANK\s*\(\s*\)|-?\d+(\.\d+)?|"(?:[^"]|"")*")?\s*$/i.test(String(e || '')) };
  // D5 + D13: an amount by its formula: a SUM of a decimal column, or a SUMX that multiplies (quantity x price); the
  // money format (hasCurrency) says it too. Counts and sums of whole numbers are quantities, ranked after the amounts
  const colTypeOf = (tables, t, c) => { const tb = (tables || []).find((x) => String(x.name).toLowerCase() === String(t).toLowerCase()), co = tb && (tb.columns || []).find((x) => String(x.name).toLowerCase() === String(c).toLowerCase()); return co ? String(co.dataType || '').toLowerCase() : null; };
  const sumOfDecimal = (e, tables) => { const m = String(e).match(/^\s*SUM\s*\(\s*'?([^'\[\]()]+?)'?\s*\[\s*([^\]]+)\]\s*\)\s*$/i); if (m) return /^(double|decimal)$/.test(colTypeOf(tables, m[1].trim(), m[2].trim()) || '');
    return ROW_PRODUCT.test(String(e)); };
  // a row's quantity times its price: SUMX over one table that multiplies two of its columns (not a column by a constant,
  // which is a computed indicator)
  const ROW_PRODUCT = /^\s*SUMX\s*\(\s*'?([^'(),]+?)'?\s*,\s*'?\1'?\s*\[[^\]]+\]\s*\*\s*'?\1'?\s*\[[^\]]+\]\s*\)\s*$/i;
  // D6 + D14: what a measure's value is, for "never two cards with the same value": the same DAX (spaces and case aside),
  // an alias ([Other] alone, resolved in suggest), or a count of the same column (COUNT, COUNTA)
  // (round 8, N5 + D6: a count of a table's rows, COUNTROWS or COUNT/COUNTA of one of its columns, is one value; so is a
  // CALCULATE that only removes filters around another value: on a card of the whole page it shows the same number)
  // (round 10: a measure's VARs put into its RETURN, so the shape rules read "VAR t = [Total] RETURN DIVIDE ( [A], t )" as
  // DIVIDE ( [A], [Total] ); a VAR's text in parentheses unless it is one measure)
  const inlineVars = (e0) => { const e = String(e0 || '').trim(), m = e.match(/^VAR\b([\s\S]*?)\bRETURN\b([\s\S]*)$/i); if (!m) return e;
    const vars = []; String('VAR' + m[1]).replace(/\bVAR\s+([A-Za-z_][\w.]*)\s*=\s*([\s\S]*?)(?=\bVAR\b|$)/gi, (x, n, v) => { vars.push([n, v.trim()]); return x; });
    let r = m[2].trim(); vars.slice().reverse().forEach(([n, v]) => { const val = /^\[[^\]]+\]$/.test(v) ? v : '(' + v + ')'; r = r.replace(new RegExp('(^|[^\\w\\[\'.])' + n.replace(/\./g, '\\.') + '(?![\\w\\]])', 'g'), (x, p1) => p1 + val); });
    return r; };
  // N10 (round 10): a chart helper that shows a value only where it equals its own MAX or MIN over ALL (...), else blank:
  // "No data" on a card
  const EXTREME = { test: (e) => { const x = inlineVars(e); return /\bIF\s*\(/i.test(x) && /\b(MAXX?|MINX?)\s*\(\s*(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT)\s*\(/i.test(x) && /[^<>!]=[^>]/.test(x.replace(/\bVAR\b[\s\S]*?=/gi, '')); } };
  const argsOf = (x) => { const out = []; let d = 0, q = false, cur = ''; for (const ch of x) { if (ch === '"') q = !q; if (!q && ch === '(') d++; if (!q && ch === ')') d--;
    if (!q && d === 0 && ch === ',') { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((a) => a.trim()); };
  const valueKey = (e) => { const x = String(e || '').trim(), alias = x.match(/^\[([^\]]+)\]$/); if (alias) return 'alias:' + alias[1].toLowerCase();
    const rows = x.match(/^COUNTROWS\s*\(\s*'?([^'\[\]()]+?)'?\s*\)$/i) || x.match(/^COUNTROWS\s*\(\s*(?:ALL|ALLNOBLANKROW|ALLSELECTED)\s*\(\s*'?([^'\[\]()]+?)'?\s*\)\s*\)$/i) || x.match(/^(?:COUNT|COUNTA)\s*\(\s*'?([^'\[\]()]+?)'?\s*\[[^\]]+\]\s*\)$/i); if (rows) return 'rows:' + rows[1].replace(/\s+/g, ' ').trim().toLowerCase();
    const calc = x.match(/^CALCULATE\s*\(([\s\S]*)\)$/i), a = calc && argsOf(calc[1]);
    if (a && a[0] && a.slice(1).every((f) => /^(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT|ALLNOBLANKROW)\s*\(/i.test(f))) return valueKey(a[0]);
    return 'dax:' + x.replace(/\s+/g, '').toLowerCase(); };
  // a calendar by its name (the block audit's A3-1, 11 Oct: tested without word boundaries, "Candidates", "Updates",
  // "Mandates", "Overtime" and "Time Sheets" were calendars and lost their categories): only a name that ends with a
  // calendar word (Date, Dates, Calendar: "Gulf Calendar", "Dim Date"), or is one (Time, Period), Arabic too
  const CAL_NAME = /(^|\s)(dates?|calendar)(\s*table)?$|^(dim\s*)?(time|period|periods)$|(^|\s)(التقويم|تقويم|التاريخ)$/i;
  const splitName = (n) => String(n).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();

  // Month and weekday names sort A to Z unless the model gives them a sort-by column: which number column sorts such a
  // name is the one rule in sort-column.js (0.3.2 DD1H; the Model Health Check's fix script reads it too, D-1104-12).
  // The report then sorts its charts by it, without touching the model.
  const { sortKind, SORT_BY, FAMILY, family, ARABIC_SUFFIX, nameLike } = SC;
  // a column's type as the readers give it, lower case; a column given with none (a DAX table's, a caller's own) is
  // unknown, never text (RULES-POWERBI.md: a missing type defaulted to text gives wrong findings; SQ13, 0.2.9-reader-S13)
  const colType = SC.colType;
  const sortColumnFor = (columns, name) => SC.sortColumnFor(columns, name, colType);
  // Round 23 (the owner's rule, 8 Oct 2026: "in any model I want to make sure English in English reports and Arabic in
  // Arabic reports"; found in the 0.2.7 install test: on a bilingual model, Sales[City] and Sales[المدينة], an English
  // report took Sales[المدينة] for its column chart, its table and a slicer beside the City slicer). A field's language
  // is read from its name only (metadata, never its data): Arabic letters, or a name that says it is Arabic (the Gulf
  // calendar's "Day Name (Arabic)", "(AR)", "_ar", " AR"), is "ar"; Latin letters "en"; anything else (and a column that
  // is not text) none. Twins: an "ar" and an "en" text column of the same table that hold the same thing; the names
  // cannot tell a translation, so a twin is the one with the same name less its Arabic mark, else the same data
  // category, else the column next to it, each column in one pair at most.
  // (0.3.2 DD1F: Arabic letters are arabic-script.js's hasArabic, their one home; CONTRACTS.md 1f)
  // (round 23 part 5, the review's 8: "AR" or "_ar" alone is not a mark: "Aging AR" is accounts receivable; "(AR)",
  // "(Arabic)", the word Arabic, and Arabic letters are)
  // (part 6, the re-review's 3: the word Arabic only at the end or the start: "Non-Arabic Customers", "Is Arabic
  // Speaker" and "Name_Arabic_Short" are English names)
  const AR_MARK = /\s*\((arabic|عربي|ar)\)\s*$|[\s_-]+arabic$|^arabic[\s_-]+/i;
  // (part 6, the re-review's 2: "City_AR", "ProductName_ar", "Name AR" are the common bilingual habit, so a trailing
  // _AR, -AR or " AR" is Arabic where the same table has the English column of that name (City + City_AR); alone
  // ("Aging AR", accounts receivable) it stays English. Set in catalog, which sees the table)
  const AR_SUFFIX = /[\s_-]ar$/i;
  const langOf = (name) => { const n = String(name == null ? '' : name); return AS.hasArabic(n) || AR_MARK.test(n) ? 'ar' : /[A-Za-z]/.test(n) ? 'en' : null; };
  const twinKey = (n) => String(n).replace(AR_MARK, '').replace(AR_SUFFIX, '').trim().toLowerCase();
  function pairTwins(columns) {
    const byTable = {};
    columns.filter((c) => metaOf(c).lang).forEach((c) => { (byTable[c.t] = byTable[c.t] || []).push(c); });
    Object.values(byTable).forEach((cs) => {
      const ar = cs.filter((c) => metaOf(c).lang === 'ar'), en = cs.filter((c) => metaOf(c).lang === 'en'), free = (c) => !metaOf(c).twin;
      const tie = (a, e) => { if (a && e) { meta(a).twin = e; meta(e).twin = a; } };
      ar.forEach((a) => tie(a, en.find((e) => free(e) && twinKey(e.c) === twinKey(a.c))));
      ar.filter(free).forEach((a) => tie(a, en.find((e) => free(e) && a.cat && e.cat && a.cat === e.cat)));
      // (round 23 part 5, the review's 5: the column next to it only when the table's layout says which: every Arabic
      // column left without a twin has a free English one just before it, or every one just after, not both ways;
      // [Product, المدينة, City] could be either: no twin)
      const at = (i) => en.find((e) => free(e) && metaOf(e).i === i), left = ar.filter(free);
      const fits = (dir) => left.length && left.every((a) => at(metaOf(a).i + dir)) && new Set(left.map((a) => metaOf(a).i + dir)).size === left.length;
      const before = fits(-1), after = fits(1);
      if (before !== after) left.forEach((a) => tie(a, at(metaOf(a).i + (before ? -1 : 1))));
    });
  }
  // 0.2.9 (O-13: a "Month-Year" text column on the line chart ran Apr 2018, Apr 2019 ... A to Z): a month label (a text
  // column with month or period in its name) whose table has a date column names it (dateOf), so the report can order
  // the label by the month's first date and keep the last months; the model is not touched
  // (the cross-review's G11, 11 Oct: "Payment Period" of a fact table took its Order Date: only a label of a date table,
  // or a column whose own DAX is made from that date, is ordered by it)
  // a calendar: marked (dataCategory Time), shaped like one (a relationship's one side on its date column: unique dates;
  // the reader marks it, dateKey), or named like one by whole words
  const isDateTable = (t) => !!(t && (t.date || metaOf(t).calendarShape || /^time$/i.test(t.dataCategory || '') || t.dateKey || CAL_NAME.test(splitName(t.name))));
  // the reader's part: a table whose date column is the one side of a relationship holds unique dates (metadata only)
  function markCalendars(tables, json) {
    const m = (json && json.model) || json || {};
    (m.relationships || []).filter((r) => r && r.toTable && r.toColumn && r.isActive !== false && String(r.isActive) !== 'false').forEach((r) => {
      const t = (tables || []).find((x) => x.name === String(r.toTable)), c = t && (t.columns || []).find((x) => x.name === String(r.toColumn));
      if (c && /^date(time)?$/i.test(String(c.dataType || '')) && (!r.toCardinality || /^one$/i.test(r.toCardinality))) t.dateKey = true; });
    // (round 8, N1: both ends of a relationship are key columns, an identifier, when the one side's table has a better text
    // column to show (a code beside its name); a join on a readable name alone (Region to Region) stays a category. Round 9
    // (SHAPES-RC4's N7): "better" is read in catalog: a people table whose other text columns are a picture, contact data
    // and a glue column keeps its name, the join key, as the category)
    const colOf = (tn, cn) => { const t = tn != null && (tables || []).find((x) => x.name === String(tn)); return t && cn != null ? [t, (t.columns || []).find((x) => x.name === String(cn))] : [t, null]; };
    (m.relationships || []).forEach((r) => { if (!r) return; const [tt, tc] = colOf(r.toTable, r.toColumn), [, fc] = colOf(r.fromTable, r.fromColumn);
      if (!tc) return; meta(tc).relKey = { table: tt, col: tc }; if (fc) meta(fc).relKey = { table: tt, col: tc }; });
    return tables;
  }
  function dateColumnFor(columns, name, type, table) {
    if (!/month|period|الشهر/i.test(String(name)) || !/^(string|unknown)$/.test(String(type || 'unknown').toLowerCase())) return null;
    const dates = (columns || []).filter((c) => /^date(time)?$/i.test(String(c.dataType || '')) && c.name !== name);
    const self = (columns || []).find((c) => c.name === name), expr = String((self && self.expression) || '');
    const made = dates.find((d) => expr && expr.toLowerCase().includes('[' + String(d.name).toLowerCase() + ']'));
    if (made) return made;
    if (table && !isDateTable(table)) return null;
    return dates.find((c) => /^(date|التاريخ)$/i.test(c.name)) || dates[0] || null;
  }
  // a column as the picker gives it out ({ t, c, type, sortBy, ordered, dateOf }), the one field builder (the cross-review's
  // G9: create_report's field check used to rebuild it): table as the readers give it, name the column's
  function fieldOf(table, name) {
    const cols = table.columns || [], c = cols.find((x) => x.name === name); if (!c) return null;
    const type = colType(c), sortBy = c.sortBy || c.sortByColumn || null;
    const by = sortBy ? null : sortColumnFor(cols, c.name), dt = dateColumnFor(cols, c.name, type, table);
    // (A3-3: tableFormat, the one format rule's for a table's column, where it would change the model's)
    const r = FM.reportFormatOf(c, 'column', []), marks = timeMarks(table, c.name, type, !!(sortBy || by)), sh = shortOf(table, c.name, marks.cal);
    // (design round 9, the re-score's D11 and D19: the writer reads the picker's two-valued and many-valued marks from
    // the field itself, so a chart by "Yes/No" or by a product name is drawn for it; builder 5's marks, carried only)
    return Object.assign({ t: table.name, c: c.name, type }, by ? { sortBy: { t: table.name, c: by.name } } : {}, sortBy && nameLike(c.name) ? { ordered: true } : {}, dt ? { dateOf: { t: table.name, c: dt.name } } : {},
      marks, r ? { tableFormat: r.format } : {}, sh ? { short: sh } : {}, twoValued(c, type) ? { two: true } : {}, fewValued(c, type) ? { few: fewValued(c, type) } : {}, (twoValued(c, type) || fewValued(c, type)) && knownTexts(c, type) ? { texts: knownTexts(c, type) } : {}, manyValued(table, c) ? { wide: true } : {});
  }
  // (round 18, S3, the owner's yes on 6 Oct: a chart's day names slant on a column chart; builder 7's audit A3-2, 11 Oct:
  // it was the server's, by the Gulf calendar's names "Day Name" and "Day Short"): a day-name column carries its
  // calendar's short day name, found by shape: a column of the same table with a short word (Short, Abbr, ddd) that is a
  // day name of the same family, sorted as the calendar sorts it. The writer uses it where the full names would slant.
  const SHORT_WORD = /(^|[\s_-])(short|abbr|abbreviation)([\s_-]|$)|^ddd$/i;
  function shortOf(table, name, cal) {
    if (!cal || cal.kind !== 'day' || SHORT_WORD.test(name)) return null;
    const cols = table.columns || [];
    const s = cols.find((x) => x.name !== name && SHORT_WORD.test(x.name.replace(ARABIC_SUFFIX, '')) && nameLike(x.name) && sortKind(x.name) === 'day'
      && (timeMarks(table, x.name, colType(x), true).cal || {}).family === cal.family);
    if (!s) return null;
    const sortBy = s.sortBy || s.sortByColumn || null, by = sortBy ? null : sortColumnFor(cols, s.name);
    return Object.assign({ t: table.name, c: s.name, type: 'string' }, sortBy ? { ordered: true } : by ? { sortBy: { t: table.name, c: by.name } } : {});
  }
  // (builder 7's audit A3-8, 11 Oct: the writer told a time category from its name's words, so "Day Type" and "Period
  // Status" were taken as their opposite): the picker marks it from the model: a column of a date table, one the model or
  // the picker sorts by a number, or a date. A3-7: a calendar category's kind (month, day, quarter), its known number of
  // rows (12, 7, 4) and its names' family (english, arabic, hijri), so the writer measures the right names
  // (integration round 4: a column whose whole name is a calendar name, a month, day or quarter name written in any case or
  // with "_" (QuarterName, Month_Name), is time too, in any table; a name that only holds such a word, "Period Status",
  // is not)
  const CAL_WHOLE = /^(year\s*)?(quarter|qtr)(\s*(name|label))?$|^(fiscal\s*|calendar\s*)?year(\s*(name|label|number|no))?$/i;   // (round 10, N12: a year too)
  const calendarName = (name) => { const n = splitName(name).replace(/\s+/g, ' '); return nameLike(n) || CAL_WHOLE.test(n); };
  function timeMarks(table, name, type, sorted) {
    const time = isDateTable(table) || sorted || /^date/.test(type) || ((type === 'string' || type === 'unknown') && calendarName(name));
    const quarter = /quarter|الربع/i.test(name) && !/year|السنة|سنة/i.test(name);
    const named = nameLike(name) || sorted, k = quarter ? 'quarter' : named ? sortKind(name) : null;
    const cal = k ? { kind: k === 'yearMonth' ? 'month' : k, rows: k === 'quarter' ? 4 : k === 'day' ? 7 : k === 'month' ? 12 : null,
      family: /hijri|هجري/i.test(name) ? 'hijri' : langOf(name) === 'ar' ? 'arabic' : 'english' } : null;
    return Object.assign({ time }, cal && time ? { cal } : {});
  }
  // a measure as the picker gives it out ({ t, m, pct, variant, stale, text, pctFormat?, wholeFormat?, tableFormat?,
  // fullFormat? }); its DAX and whether it is an amount in META. tables: the model's, for the format rule
  function measureField(table, m, tables) {
    const x = Object.assign({ t: table.name, m: m.name, variant: isVariant(m), stale: STALE.test(m.name), text: isText(m) }, cardKind(m, tables));
    const e = exprOf(m), dynamic = !!m.formatStringDefinition;
    Object.assign(meta(x), { expr: e, amount: !x.pct && !dynamic && (hasCurrency(m.formatString || '') || (!hasUnit(m.formatString || '') && sumOfDecimal(e, tables))), base: CORE.test(e) || ROW_PRODUCT.test(e), dynamic, currency: hasCurrency(m.formatString || ''),
      notCard: PLACEHOLDER.test(e) ? 'placeholder' : PARAM_DAX.test(e) ? 'param' : HELPER_DAX.test(e) || EXTREME.test(e) ? 'helper' : SHARE_OF_ALL.test(e) ? 'share' : null, key: valueKey(e), unformatted: !String(m.formatString || '').trim() && !dynamic, divides: !!m.divides });
    return x;
  }
  // the same by name, for a measure the user names (create_report's fields): null when the table has none of that name
  const measureOf = (table, name, tables) => { const m = ((table && table.measures) || []).find((x) => x.name === name); return m ? measureField(table, m, tables || [table]) : null; };
  // D9 + D10: a date with a time of day (by its format or its name's whole words) is a time stamp: one point per moment
  const isStamp = (c, type) => /^date/.test(type) && (/(^|[^a-z])(time|timestamp|stamp|hour)([^a-z]|$)/i.test(splitName(c.name)) || /general date|am\/pm|[hHs]/.test(FM.unquoted(c.formatString || '')));
  // D11: a column that can hold two values only: true/false, or a calculated column whose DAX returns one of two words
  // (SQ13, L2-S1: every quoted text was counted, so SWITCH ( [Code], "A", "Alpha", "B", "Beta" ) held 4) the texts an IF
  // or SWITCH column can return, by its formula alone (never its data): IF's two branches, SWITCH's results and its
  // else (never the values compared, nor a condition's texts), nested IF and SWITCH followed; BLANK () adds nothing.
  // null when a result is anything else (a column, a number, a joined text): its values are not known then
  const formulaOf = (c) => metaOf(c).expr || (Array.isArray(c.expression) ? c.expression.join('\n') : typeof c.expression === 'string' ? c.expression : '');
  // the arguments of a formula that is one IF or SWITCH call and nothing after it (argsOf above), or null
  const callArgs = (e, open) => { let d = 0, q = false;
    for (let i = open; i < e.length; i++) { const ch = e[i]; if (ch === '"') q = !q; if (q) continue; if (ch === '(') d++; if (ch === ')' && --d === 0) return e.slice(i + 1).trim() ? null : argsOf(e.slice(open + 1, i)); }
    return null; };
  const resultTexts = (e, depth) => {
    const m = /^\s*(IF|SWITCH)\s*\(/i.exec(String(e || '')); if (!m || (depth || 0) > 8) return null;
    const args = callArgs(String(e), m[0].length - 1); if (!args || (/^IF$/i.test(m[1]) ? args.length < 2 : args.length < 3)) return null;
    const results = /^IF$/i.test(m[1]) ? args.slice(1, 3) : args.slice(1).filter((x, i, l) => i % 2 === 1 || i === l.length - 1);
    const out = [];
    for (const r of results) {
      if (/^"(?:[^"]|"")*"$/.test(r)) out.push(r.slice(1, -1).replace(/""/g, '"'));
      else if (/^BLANK\s*\(\s*\)$/i.test(r)) continue;
      else { const nest = resultTexts(r, (depth || 0) + 1); if (!nest) return null; out.push(...nest); }
    }
    return out;
  };
  const distinctResults = (c) => { const r = resultTexts(formulaOf(c)), seen = new Map(); if (!r) return null; r.forEach((v) => { if (!seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v); }); return [...seen.values()]; };
  const twoValued = (c, type) => { if (type === 'boolean') return true;
    // (round 8, D11: a SWITCH or nested IFs whose results are two texts hold two values too)
    const r = distinctResults(c); return !!r && r.length === 2; };
  // (0.3.0 L2: the pills slicer) a calculated column whose DAX is IF or SWITCH with 3-6 distinct texts holds that many
  // values at most (by its formula, never its data): few, for the writer's button slicer; 0 otherwise
  const fewValued = (c, type) => { if (type === 'boolean') return 0; const r = distinctResults(c), n = r ? r.length : 0; return n >= 3 && n <= 6 ? n : 0; };
  // (0.3.0 C1 add-on: the pills' width) the values a two- or few-valued column can hold, known from its metadata alone:
  // true/false, or the texts its IF/SWITCH formula returns (never its data); null when they are not known
  const knownTexts = (c, type) => { if (type === 'boolean') return ['False', 'True']; const r = distinctResults(c); return r && r.length >= 2 && r.length <= 6 ? r : null; };
  // S5: a column with many values: a lookup table's own name column (Product Name in Products), or a detail place
  // (a city, an address, a postcode: by the model's data category, or its whole words)
  const DETAIL_PLACE = /^(city|address|place|postalcode|postcode|zip|latitude|longitude|weburl)$/i;
  const manyValued = (t, c) => { const tn = splitName(t.name).toLowerCase().replace(/s$/, ''), cn = splitName(c.name).toLowerCase();
    return cn === tn + ' name' || cn === 'name' || DETAIL_PLACE.test(String(c.dataCategory || '')) || /(^|[\s_])(city|address|street|zip|postcode|postal code)([\s_]|$)/i.test(splitName(c.name)); };
  // N1 (round 8): a text column of identifiers or contact details: the model's key column, a relationship's key, a web or
  // image link or a barcode (its data category), or a calculated column that joins several columns or breaks lines (a
  // free-text label: "name, e-mail, phone"); by metadata and formula, never by values
  // (rc.4, N7: a picture or web address with no data category: by its name's whole words, "Img", "Photo URL",
  // "product_image", "LogoLink"; "Pickup" or "Logout" hold the letters only)
  const LINK_WORD = /^(img|imgs|image|images|photo|photos|picture|pictures|pic|pics|logo|logos|url|urls|uri|link|links|href|thumbnail|thumbnails|thumb|icon|icons|avatar)$/i;
  const linkName = (n) => splitName(n).split(/\s+/).some((w) => LINK_WORD.test(w));
  // (round 9, SHAPES-RC4: contact data by its name's whole words, in any case: "Phone", "Email", "E-mail", "Address", "Fax")
  const CONTACT = /(^|\s)(e\s?mail|emails?|phones?|mobile|telephone|tel|fax|whatsapp|address(es)?)(\s|$)/i;
  const idBase = (c) => !!(metaOf(c).key || /^(WebUrl|ImageUrl|Barcode)$/i.test(String(c.dataCategory || '')) || linkName(c.name) || CONTACT.test(splitName(c.name))
    || /UNICHAR\s*\(\s*1[03]\s*\)/i.test(metaOf(c).expr || '') || (/&|\b(CONCATENATE|COMBINEVALUES)\s*\(/i.test(metaOf(c).expr || '') && ((metaOf(c).expr || '').match(/\[[^\]]+\]/g) || []).length >= 2));
  // a relationship's key is an identifier when the one side's table has another text column that is a better label
  const idLike = (c) => { if (idBase(c)) return true; const r = metaOf(c).relKey; if (!r || !r.table) return false;
    return (r.table.columns || []).some((o) => o !== r.col && !o.isHidden && /^string$/i.test(String(o.dataType || '')) && !idBase(o)); };
  function catalog(tables, modelTables) {
    const shown = tables.filter((t) => !t.hidden), all = modelTables || tables;
    const measures = [], columns = [], hiddenMeasures = [];
    // (round 10, RESCORE-3's N5: a hidden measure is never a card, but a share over it is still a share: known to the rules)
    tables.forEach((t) => (t.measures || []).filter((m) => m.isHidden || t.hidden).forEach((m) => hiddenMeasures.push(measureField(t, m, all))));
    shown.forEach((t) => {
      t.measures.filter((m) => !m.isHidden).forEach((m) => { const x = measureField(t, m, all);
        measures.push(x); });
      t.columns.filter((c) => !c.isHidden).forEach((c, i) => { const type = colType(c);
        // (round 12, #17: a month or day name the model itself sorts is ordered: a table sorts it by itself)
        // (round 23: lang and i, the column's place, for the language rule: text columns only; non-enumerable, so the
        // fields given out keep their shape)
        const fo = fieldOf(t, c.name);
        const col = Object.assign({ t: t.name, c: c.name, type, dateTable: isDateTable(t), cat: c.dataCategory }, fo.sortBy ? { sortBy: fo.sortBy } : {}, fo.ordered ? { ordered: true } : {}, fo.dateOf ? { dateOf: fo.dateOf } : {}, { time: fo.time }, fo.cal ? { cal: fo.cal } : {});
        // (A3-3: its table format in META too: build puts it on a table's field only)
        Object.assign(meta(col), { lang: type === 'string' || type === 'unknown' ? langOf(c.name) : null, i, twin: null, tableFormat: fo.tableFormat || null, short: fo.short || null,
          stamp: isStamp(c, type), two: twoValued(c, type), few: fewValued(c, type), texts: twoValued(c, type) || fewValued(c, type) ? knownTexts(c, type) : null, wide: manyValued(t, c), id: idLike(c),
          numeric: /^(sum|average|min|max|count|distinctcount)$/i.test(String(c.summarizeBy || '')) || /^[#0,.\s]+%?$/.test(String(c.formatString || '').trim()) && /0/.test(String(c.formatString || '')) });
        columns.push(col); });
    });
    columns.forEach((c) => { if (metaOf(c).lang === 'en' && AR_SUFFIX.test(c.c)) { const base = c.c.replace(AR_SUFFIX, '').trim().toLowerCase(); if (columns.some((o) => o !== c && o.t === c.t && metaOf(o).lang === 'en' && o.c.trim().toLowerCase() === base)) meta(c).lang = 'ar'; } });
    // (0.3.0 C1) a true/false column with its "<name> (Arabic)" label beside it (the Arabic calendar's flags) is the
    // English side of that pair, as a text column with its Arabic twin is
    columns.forEach((c) => { if (c.type === 'boolean' && !metaOf(c).lang) { const nm = String(c.c).trim().toLowerCase() + ' (arabic)'; if (columns.some((o) => o.t === c.t && String(o.c).trim().toLowerCase() === nm)) meta(c).lang = 'en'; } });
    pairTwins(columns);
    return { measures, columns, hiddenMeasures };
  }
  // the tables a measure reaches (round 22b): the tables its DAX names ('Sales'[Amount], Sales[Amount], COUNTROWS ( Sales ))
  // and those of the measures it calls ([Base Amount]), with its own table, then every table a relationship leads to from
  // them (many to one, from fromTable to toTable). The reviewer's second review (items 2, 3, 10): names are matched as
  // DAX does, without regard to case; tables are the whole model's (opt.modelTables), not only those in the pick's
  // scope; and the DAX is read once per measure (its quoted names and its words looked up), not once per table
  const KEYWORDS = new Set(['var', 'return', 'true', 'false', 'in', 'not', 'and', 'or', 'evaluate', 'define', 'measure', 'order', 'by', 'asc', 'desc']);
  function reached(tables, main, rels) {
    const lc = (x) => String(x).toLowerCase(), byName = new Map(), byMeasure = new Map();
    tables.forEach((t) => { byName.set(lc(t.name), t.name); (t.measures || []).forEach((m) => { if (!byMeasure.has(lc(m.name))) byMeasure.set(lc(m.name), exprOf(m)); }); });
    const reads = (expr) => { const e = String(expr || '').replace(/"(?:[^"]|"")*"/g, '""').replace(/--[^\n]*|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, ' '), out = { tables: [], measures: [] };
      (e.match(/'(?:[^']|'')*'/g) || []).forEach((x) => { const n = byName.get(lc(x.slice(1, -1).replace(/''/g, "'"))); if (n) out.tables.push(n); });
      // (the reviewer's third review, items 1 and 2: a quoted table name stands as a word, so 'Sales'[Quantity] stays a
      // column; a word followed by "(" is a function (DATE, YEAR, CALENDAR), and VAR, RETURN, TRUE... are keywords)
      // (the reviewer's final item 4: DAX allows spaces between a table and its column, 'Sales' [Quantity]: they are closed
      // up, except after a keyword, RETURN [Total] being a measure call)
      const bare = e.replace(/'(?:[^']|'')*'/g, '_').replace(/([\p{L}\p{N}_]+)\s+\[/gu, (x, w) => (KEYWORDS.has(lc(w)) ? x : w + '['));
      // a measure is [Name] not right after a table name ('Sales'[Amount] and Sales[Amount] are columns)
      (bare.match(/(^|[^\w\]])\[(?:[^\]]|\]\])+\]/g) || []).forEach((x) => { const n = lc(x.slice(x.indexOf('[') + 1, -1).replace(/\]\]/g, ']')); if (byMeasure.has(n)) out.measures.push(n); });
      (bare.replace(/\[(?:[^\]]|\]\])*\]/g, ' ').match(/[\p{L}_][\p{L}\p{N}_]*(?!\s*\(|[\p{L}\p{N}_])/gu) || []).forEach((w) => { const n = !KEYWORDS.has(lc(w)) && byName.get(lc(w)); if (n) out.tables.push(n); });
      return out; };
    const reach = new Set([main.t]), seen = new Set(), todo = [lc(main.m)];
    while (todo.length && seen.size < 500) { const n = todo.shift(); if (seen.has(n) || !byMeasure.has(n)) continue; seen.add(n);
      const r = reads(byMeasure.get(n)); r.tables.forEach((t) => reach.add(t)); todo.push(...r.measures); }
    for (let grew = true; grew;) { grew = false; rels.forEach((r) => { if (reach.has(r.fromTable) && !reach.has(r.toTable)) { reach.add(r.toTable); grew = true; } if (r.both && reach.has(r.toTable) && !reach.has(r.fromTable)) { reach.add(r.fromTable); grew = true; } }); }   // (round 23 part 5, the review's 3: a relationship that filters both ways, both ways)
    return reach;
  }
  // (SQ15b, L3-S2) the model tables a measure's DAX reads, its own and those of the measures it calls, by the rule above
  // (its home table not counted, no relationship followed): none means a constant, the same value on any axis
  function readTables(tables, f) { const r = reached(tables || [], { t: null, m: f.m }, []); r.delete(null); return [...r]; }
  // Round 23 (the owner, 8 Oct 2026; lab 1b "Delivered Qty 9,012 on every Hub Zone row", golden task 10): a table's
  // measures all reach its row column's table, by the rule its charts follow (reached): a measure of a fact table not
  // related to the rows would repeat one total on every row, so it is left out of the table and named (notReached).
  // Without relationships (the website's picker of a model that gives none) the table is as before.
  function reachTable(table, opt) {
    const rels = (opt && opt.relationships) || [], all = (opt && opt.modelTables) || [], row = (table || []).find((f) => f && f.c != null);
    if (!rels.length || !row || !all.length) return { table, notReached: [] };
    // (part 6, the re-review's 8: the tables each measure reaches are kept with the choices' reach, so a binding built
    // again from them (each picker change) does not walk the model again)
    // (A3-9: the cache of each measure's reach is the picker's own, keyed by the caller's options object, never put on it)
    let cache = REACH.get(opt); if (!cache) { cache = new Map(); REACH.set(opt, cache); }
    const reachOf = (f) => { const k = f.t + '\u0000' + f.m; if (!cache.has(k)) cache.set(k, reached(all, f, rels)); return cache.get(k); };
    const notReached = table.filter((f) => f && f.m != null && !reachOf(f).has(row.t));
    return { table: table.filter((f) => !notReached.includes(f)), notReached: notReached.map((f) => ({ t: f.t, m: f.m, row: { t: row.t, c: row.c } })) };
  }
  // is this measure a percentage? (name, format string, DAX)
  const isPercent = (name, formatString, expression) => PCT({ name: String(name), formatString, divides: divides(expression) });
  // a measure of the model (as the readers give it) for its card: { text, pctFormat | wholeFormat }
  const measureCard = (m, tables) => { const x = { name: String(m.name), formatString: m.formatString, formatStringDefinition: m.formatStringDefinition, divides: m.divides != null ? !!m.divides : divides(exprOf(m)), expression: exprOf(m) }; return Object.assign({ text: isText(x) }, cardKind(x, tables)); };
  // the twins of a model's text columns, { 'T[c]': 'T[twin]' } both ways (round 23: the MCP's note on named fields)
  // the language of each text column as the picker reads it, with the table's context ({ 'T[c]': 'ar' | 'en' })
  // (the audit's "seen, not in scope": a key "T[c]" was ambiguous for a name with "]"; fieldKey writes it as DAX does, "]]")
  const fieldKey = (t, c) => String(t) + '[' + String(c).replace(/\]/g, ']]') + ']';
  const langsOf = (tables) => { const out = {}; catalog(tables).columns.filter((c) => metaOf(c).lang).forEach((c) => { out[fieldKey(c.t, c.c)] = metaOf(c).lang; }); return out; };
  const twinsOf = (tables) => { const out = {}; catalog(tables).columns.filter((c) => metaOf(c).twin).forEach((c) => { const w = metaOf(c).twin; out[fieldKey(c.t, c.c)] = fieldKey(w.t, w.c); }); return out; };
  const api = { fromTmsl, relsOfTmsl, clean, markCalendars, catalog, fieldOf, measureOf, measureCard, isPercent, dateColumnFor, sortColumnFor,
    isDateTable, nameLike, langOf, langsOf, twinsOf, fieldKey, exprOf, metaOf, reached, readTables, reachTable,
    CORE, argsOf, inlineVars, valueKey, splitName, sortKind, SORT_BY, FAMILY, family };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAFieldCatalog = api;
})(typeof self !== 'undefined' ? self : this);
