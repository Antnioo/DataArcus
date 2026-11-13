/*
 * DataArcus - the field suggestions: which of a model's fields goes in each visual, ranked by deterministic rules on
 * its metadata (field-catalog.js's fields), for the website's picker and the MCP. 0.3.2 SP30: moved from pbip-bind.js,
 * which re-exports counts and statsOf and keeps suggest as build(rank(...).choices) with the notes beside it (the same
 * answers in the same order). Pure: no file, no page, no network, no state, no random source; never a data value (the
 * model's own counts, when the caller gives them, are counts only, never sampled here).
 *
 * Interface (one input, one output each):
 *   rank(tables, nKpis, opt) -> { choices, notes }
 *     tables   the readers' tables (field-catalog.js's contract); nKpis the number of KPI cards
 *     opt      { lang, relationships, modelTables, stats, pinned, main, excludeColumns, axisFor, kpiValues } (each optional)
 *     choices  { kpis, main, date, catA, catB, slicers, full?, reach?, table? }: the fields picked (Field shape), which
 *              pbip-bind.js's build(choices) turns into the visual-by-visual binding
 *     notes    { language?, noCategory?, excluded?, axisBy?, calendarNames?, formatsMixed?, calendarSwaps?,
 *              noRelatedCalendar?, noRelatedCategory?, slicerPool, catPool?, skipped?, why?, whyNotListed?,
 *              statsNotInModel? }: what the answer says beside the binding, in this order
 *   counts(tables, names?, opt?) -> [Field]: numbers counted or summed by the visual, for a model without measures
 *   statsOf(tables, stats) -> { given, rows(t), distinct(t, c), notInModel }: the caller's counts, matched as DAX does
 * The order is part of the answer: every sort here is stable and keyed on the rules alone (never a random source).
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  // the model's metadata, normalised (field-catalog.js): its fields and its META side table, shared, never copied
  const C = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./field-catalog.js') : root.DAFieldCatalog;
  const { catalog, fieldOf, fieldKey, exprOf, metaOf, langOf, reached, CORE, argsOf, inlineVars, valueKey, splitName, sortKind, SORT_BY, FAMILY, family } = C;
  // ---------- suggestions ----------
  // S4: a measure that needs one period: blank over the whole date range, or guarded on one selected value
  const NEEDS_PERIOD = /\b(PREVIOUS(DAY|MONTH|QUARTER|YEAR)|NEXT(DAY|MONTH|QUARTER|YEAR)|PARALLELPERIOD|HASONEVALUE|HASONEFILTER|ISFILTERED|ISINSCOPE)\s*\(/i;
  // The name words, one named tie-break (builder 7's audit A3-6, 11 Oct: the rank is the measure's shape first; these
  // English and Arabic words only break ties between measures of the same shape, +0.5 each; a model in another
  // language ranks by shape alone): money words and count words
  const TIEBREAK_WORDS = { money: /revenue|sales|amount|income|profit|value|bookings|orders|leads|deals|calls|visits|spend|cost|budget|الإيرادات|المبيعات|الأرباح|الطلبات|الميزانية/i, count: /total|count|number|#|qty|quantity|units|customers|clients|tickets|إجمالي|عدد/i };
  const CAT = /category|product|brand|region|country|city|emirate|segment|channel|type|status|department|store|branch|source|platform|model|team|group|class|stage|agent|rep|salesperson|campaign|الفئة|المنتج|العلامة|المنطقة|المدينة|القناة|الفرع|المصدر/i;
  // (round 23, the owner's "nothing critical left": "Order Id", "Invoice No" and "Customer Code" were chart categories:
  // an identifier's last word (id, key, code, guid, sk, no, num, number) is read without regard to case; the other words
  // as before; a camel-case end, OrderID, InvoiceNo, stays case-sensitive: "Paid" and "Casino" are words)
  // (0.3.1 FX6, FX4's Seen 1: "Notes", "Comments", "Description" with a capital passed as categories) the words without
  // regard to case; the camel-case ends (OrderID, ProductKey) stay case-sensitive ("Paid", "Turkey"), and so does the
  // singular "note" (the test project's only text column, Sales[Note], is the category of 22 suites: mcp/work/FX6.md)
  const NOT_CAT_OLD = { test: (x) => /(^|[\s_-])(id|key|code|guid|sk|sort|order|index|url|link|email|phone|mobile|address|description|notes|comments?|remarks?)s?$/i.test(x) || /(^|[\s_-])note$|[a-z]ID$|Key$/.test(x) };
  const NOT_CAT_ID = /(^|[\s_-])(id|key|code|guid|sk|no|num|number)s?$/i, NOT_CAT_CAMEL = /[a-z](Id|No|Code)$/;
  // (round 23 part 5, the review's 9: read without an Arabic mark, so "Order No (AR)" is an identifier too)
  const NOT_CAT = { test: (x0) => { const x = String(x0).replace(/\s*\((arabic|عربي|ar)\)\s*$/i, ''); return NOT_CAT_OLD.test(x) || NOT_CAT_ID.test(x) || NOT_CAT_CAMEL.test(x); } };
  // names that read as a number or a date, for columns whose type the files don't give
  const NUMBERISH = /amount|qty|quantity|price|cost|value|sales|revenue|total|count|number|units|profit|margin|rate|score|percent|%|offset|sort|المبلغ|الكمية|السعر|القيمة|المبيعات|العدد/i;
  const DATEISH = /date|time|stamp|تاريخ|وقت/i;
  // the date table's parts that make good categories when the model has no other ones, in order of preference
  const DATE_PARTS = [/^(year\s*)?quarter$|الربع/i, /^(day|weekday)\s*name$|اسم اليوم/i, /^(hijri\s*)?month\s*name$|اسم الشهر/i];

  // the language rule on a list of candidates for one role (round 23). lang "en": no "ar" column while the list has
  // another (else the "ar" ones, told: fallback). lang "ar": each "en" column that has an "ar" twin gives its place to
  // the twin (an "en" column without one stays: its name is shown through an Arabic display name, never translated),
  // except in a date table, whose Arabic name columns the MCP swaps in itself (round 12b). No lang: as before.
  function byLang(list, lang, note) {
    if (lang === 'en') { const ok = list.filter((c) => metaOf(c).lang !== 'ar'); list.filter((c) => metaOf(c).lang === 'ar').forEach((c) => (ok.length ? note.skipped : note.fallback).add(c)); return ok.length || !list.length ? ok : list; }
    if (lang === 'ar') { const out = []; list.forEach((c) => { const x = metaOf(c).lang === 'en' && metaOf(c).twin && !c.dateTable ? metaOf(c).twin : c; if (x !== c) note.skipped.add(c); if (!out.includes(x)) out.push(x); }); return out; }
    return list;
  }
  const langNote = (lang, note) => (lang && (note.skipped.size || note.fallback.size) ? { language: Object.assign({ lang },
    note.skipped.size ? { skipped: [...note.skipped].map((c) => fieldKey(c.t, c.c)) } : {}, note.fallback.size ? { fallback: [...note.fallback].map((c) => fieldKey(c.t, c.c)) } : {}) } : {});
  // (0.3.1 FX4, the laptop's part 3, H-3; the owner's D-1028-04) the model's own counts, when the caller has them
  // (suggest_fields' columnStats, read in Desktop): { rows: { Table: n }, distinct: { 'Table[Column]': n } }. Counts
  // only, never a value. Names are matched as DAX does, without regard to case; a name the model does not have, or a
  // count that is no whole number, is named in notInModel, never used
  const STAT_KEY = /^(?:'((?:[^']|'')+)'|([^'[\]]+?))\s*\[((?:[^\]]|\]\])+)\]$/;
  function statsOf(tables, stats) {
    const lc = (x) => String(x).trim().toLowerCase(), rows = new Map(), dist = new Map(), notInModel = [], ok = (n) => Number.isInteger(n) && n >= 0;
    const has = (t, c) => (tables || []).some((x) => lc(x.name) === t && (c == null || (x.columns || []).some((y) => lc(y.name) === c)));
    Object.entries((stats && stats.rows) || {}).forEach(([t, n]) => { if (!ok(n) || !has(lc(t))) notInModel.push(t); else rows.set(lc(t), n); });
    Object.entries((stats && stats.distinct) || {}).forEach(([k, n]) => { const m = String(k).trim().match(STAT_KEY), t = m && lc((m[1] || m[2]).replace(/''/g, "'")), c = m && lc(m[3].replace(/\]\]/g, ']'));
      if (!m || !ok(n) || !has(t, c)) notInModel.push(k); else dist.set(t + '\u0000' + c, n); });
    return { given: !!stats, rows: (t) => rows.get(lc(t)), distinct: (t, c) => dist.get(lc(t) + '\u0000' + lc(c)), notInModel };
  }
  // (FX4) a text column named as coordinates (a point on a map, never a category), and one named as invoice numbers
  const COORD = /(^|\s)(latitude|longitude|lat|lon|lng|coordinates?|geo\s?point|geo\s?location|lat\s?long|lat\s?lon)(\s|$)/i, INVOICE = /(^|\s)(invoice|receipt)s?$/i;
  // (FX4) a measure's gross form and the measure it is the gross of: Gross Sales / Sales, Gross Revenue / Net Revenue,
  // Sales before Discounts / Sales (names compared without regard to case, spaces or "_")
  const plainName = (x) => String(x).toLowerCase().replace(/[\s_-]+/g, ' ').trim();
  const grossBase = (n) => { const s = plainName(n), g = s.match(/^(.*?)\s*\bgross\b\s*(.*)$/), b = s.match(/^(.+?)\s*\b(before|pre)\s*discounts?$/);
    const base = g ? plainName(g[1] + ' ' + g[2]) : b ? plainName(b[1]) : ''; return base || null; };
  const WHY_MAX = 20;
  function rank(tables, nKpis, opt) {
    const { measures, columns, hiddenMeasures } = catalog(tables, opt && opt.modelTables);
    // (FX4) every rule that acts says itself here, one plain line per field (the first rule that names it)
    const ST = statsOf((opt && opt.modelTables) || tables, opt && opt.stats), why = [], say = (field, line) => { if (!why.some((w) => w.field === field)) why.push({ field, line }); };
    const num = (n) => Number(n).toLocaleString('en-US');
    // (A3-6: a measure other measures build on, [Its Name] in their DAX, is a core number: a shape, in any language)
    const usedBy = new Set(measures.filter((y) => measures.some((z) => z !== y && exprOf(z).includes('[' + y.m + ']'))).map((y) => y.m));
    const score = (x) => (CORE.test(exprOf(x)) ? 3 : 0) + (metaOf(x).amount ? 1 : 0) - (x.variant ? 4 : 0) - (x.pct ? 1 : 0)
      + (usedBy.has(x.m) ? 1 : 0) + (TIEBREAK_WORDS.money.test(x.m) ? 0.5 : 0) + (TIEBREAK_WORDS.count.test(x.m) ? 0.5 : 0);   // (0.2.9, O-7, G1, A3-6: shape first, names a tiebreak)
    // (measures left behind, see STALE, come after every other one)
    // (a measure that shows text is never picked: round 12, #26)
    // (round 23: with a report language (opt.lang), a measure named in the other language comes after those named in
    // its own or in none, as a measure left behind does)
    const L = opt && opt.lang, note = { skipped: new Set(), fallback: new Set() }, other = (x) => (L && langOf(x.m) && langOf(x.m) !== L ? 1 : 0);
    // (the rc's laptop proof, 11 Oct, S4: a measure that needs one period to show a number says "No data" on a card of the
    // whole page: PREVIOUSMONTH and the like, NEXT..., PARALLELPERIOD (blank over the whole date range), or a guard on a
    // single selected value; directly or through the measures it calls, as reached() reads them. A PY or "last" measure
    // still shows a number: it stays a variant, after every base measure)
    const byName = new Map(hiddenMeasures.concat(measures).map((x) => [x.m.toLowerCase(), x])), refs = (x) => (exprOf(x).match(/(^|[^\w\]'])\[(?:[^\]]|\]\])+\]/g) || []).map((r) => byName.get(r.slice(r.indexOf('[') + 1, -1).replace(/\]\]/g, ']').toLowerCase())).filter(Boolean);
    const walk = (test) => { const memo = new Map(), go = (x, seen) => { if (memo.has(x)) return memo.get(x); if (seen.has(x)) return false; seen.add(x); const v = test(x) || refs(x).some((y) => go(y, seen)); memo.set(x, v); return v; }; measures.forEach((x) => go(x, new Set())); return memo; };
    const timeDep = walk((x) => x.variant), needsPeriod = walk((x) => NEEDS_PERIOD.test(exprOf(x)));
    // (D6 + D14: an alias, [Other] alone, has its value: the same key)
    const keyOf = (x, n) => { const k = metaOf(x).key; if (!/^alias:/.test(k) || (n || 0) > 20) return k; const y = byName.get(k.slice(6)); return y ? keyOf(y, (n || 0) + 1) : k; };
    // (A3-5: every base measure before any time variant, then the shape score; the rc's proof, D5 + D13: a plain amount
    // (a sum of money, a revenue) before a plain count or quantity, then the computed measures, amounts first (O-7: no
    // computed indicator before the plain numbers); D17: a dynamic-format measure is no amount: its shown format is not known)
    // (round 8, D5: a currency-formatted total is a core amount however it is computed: RELATED, a variable; not an
    // average or a ratio, which divides)
    const group = (x) => (metaOf(x).currency && !metaOf(x).divides ? 0 : (metaOf(x).base ? 0 : 2) + (metaOf(x).amount ? 0 : 1));
    const ranked = measures.filter((x) => !x.text).sort((a, b) => (a.stale ? 1 : 0) - (b.stale ? 1 : 0) || other(a) - other(b) || (timeDep.get(a) ? 1 : 0) - (timeDep.get(b) ? 1 : 0)
      || group(a) - group(b) || score(b) - score(a));
    // (FX4, D-1028-04: net before gross) where a measure and its gross form are both there, the net one goes first, so
    // it is the headline and the first card; the gross one may follow (a time variant or a percent is never moved
    // ahead of a base amount by this)
    const nets = [];
    ranked.slice().forEach((g) => { const b = grossBase(g.m); if (!b) return;
      const n = ranked.find((y) => y !== g && !grossBase(y.m) && [b, 'net ' + b, b + ' net'].includes(plainName(y.m)));
      if (!n || n.stale || !!n.pct !== !!g.pct || (timeDep.get(n) ? 1 : 0) > (timeDep.get(g) ? 1 : 0)) return;
      const gi = ranked.indexOf(g), ni = ranked.indexOf(n); if (ni > gi) { ranked.splice(ni, 1); ranked.splice(gi, 0, n); } nets.push([n, g]); });
    // a card shows one number for the whole page: never a period measure (S4: "No data" without its period), a what-if
    // value (D4), a helper (D2) or a share of all (D14); never two cards with the same value (D6, D14)
    // (rc.4, round 9, N5 + D14: one measure over another of the same value (the second its ALL form): 100 % on a card)
    const selfShare = (x) => { const e = inlineVars(exprOf(x)), m = e.match(/^DIVIDE\s*\(\s*\[([^\]]+)\]\s*,\s*\[([^\]]+)\]\s*(,[\s\S]*)?\)$/i) || e.match(/^\[([^\]]+)\]\s*\/\s*\[([^\]]+)\]$/);
      const a = m && byName.get(m[1].toLowerCase()), b = m && byName.get(m[2].toLowerCase()); return !!(a && b && a !== b && keyOf(a) === keyOf(b)); };
    // (SHAPES-RC4, N5: a value widened to every row (COUNTROWS ( ALLSELECTED ( T ) ), CALCULATE ( x, ALL (...) )) beside the
    // plain value is that value's denominator: never a card while the plain one is there)
    const widened = (x) => { const e = exprOf(x).trim(), c = e.match(/^CALCULATE\s*\(([\s\S]*)\)$/i), a = c && argsOf(c[1]);
      return /^COUNTROWS\s*\(\s*(ALL|ALLNOBLANKROW|ALLSELECTED)\s*\(/i.test(e) || !!(a && a.length > 1 && a.slice(1).every((f) => /^(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT|ALLNOBLANKROW)\s*\(/i.test(f))); };
    const denominator = (x) => widened(x) && measures.some((y) => y !== x && !y.text && !widened(y) && keyOf(y) === keyOf(x));
    // (round 11, RESCORE-4: "[All x] - [x]", a chart's dummy line, is 0 on a card: a value minus its own ALL form, either way)
    const partKey = (p) => { const t = p.trim().replace(/^\(([\s\S]*)\)$/, '$1').trim(), r = t.match(/^\[([^\]]+)\]$/), y = r && byName.get(r[1].toLowerCase()); if (y) return keyOf(y);
      const k = valueKey(t); return /^alias:/.test(k) && byName.get(k.slice(6)) ? keyOf(byName.get(k.slice(6))) : k; };
    const selfDiff = (x) => { const e = inlineVars(exprOf(x)); let d = 0, q = false, at = -1, n = 0;
      for (let i = 0; i < e.length; i++) { const ch = e[i]; if (ch === '"') q = !q; if (q) continue; if (ch === '(') d++; else if (ch === ')') d--; else if (ch === '-' && d === 0 && i > 0) { at = i; n++; } }
      return n === 1 && partKey(e.slice(0, at)) === partKey(e.slice(at + 1)); };
    const cardable = (x) => !needsPeriod.get(x) && !metaOf(x).notCard && !selfShare(x) && !denominator(x) && !selfDiff(x);
    const main = ranked.find((x) => !x.pct && cardable(x)) || ranked.find((x) => !x.pct && !metaOf(x).notCard) || ranked[0] || null;
    // KPIs: the strongest base measures, with one ratio among them when the model has one; a measure left behind only
    // when the cards outnumber the other measures
    const current = ranked.filter((x) => !x.stale && cardable(x)), keys = new Set(), fresh = (x) => { const k = keyOf(x); if (keys.has(k)) return false; keys.add(k); return true; };
    const kpis = current.filter((x) => !x.pct && !timeDep.get(x) && fresh(x)).slice(0, Math.max(0, nKpis - 1));
    keys.clear(); kpis.forEach((x) => keys.add(keyOf(x)));   // (fresh() saw every candidate; only the cards taken count)
    const ratio = current.find((x) => x.pct && !timeDep.get(x) && !keys.has(keyOf(x)));
    if (ratio && kpis.length < nKpis) { kpis.push(ratio); keys.add(keyOf(ratio)); }
    ranked.filter((x) => cardable(x)).forEach((x) => { if (kpis.length < nKpis && !kpis.includes(x) && !keys.has(keyOf(x))) { kpis.push(x); keys.add(keyOf(x)); } });
    while (kpis.length < nKpis) kpis.push(null);   // more cards than measures: the rest stay empty
    nets.forEach(([n, g]) => { if (main === n || kpis.includes(n)) say(fieldKey(n.t, n.m), `${n.m} is the headline number before ${g.m}: the net amount first; the gross one (before discounts or returns) may follow.`); });
    // Round 22b (the review of round 22, items 2 and 3): only the main chart's category took this order, the column
    // chart's and the map's (catB) and the pool every other chart takes from still reached a table the measure is not
    // related to; and the walk began at the table the measure is stored in, which for a measures table of its own is
    // related to nothing. Now it begins at the tables the measure's DAX reads (through the measures it calls too) and
    // its own table, and only reached categories are given out (catB falls back to catA). The reviewer's second review:
    // the measure is the plan's (opt.main) where it names one (item 4), and the time axis and the year slicer come from
    // a reached table too (item 5: two calendars, the measure related to one)
    const P = (opt && opt.pinned) || {};
    const rels = (opt && opt.relationships) || [], anchor = (opt && opt.main && opt.main.m != null ? opt.main : null) || (P.main && P.main.m != null ? P.main : null) || main;
    const reach = rels.length && anchor ? reached((opt && opt.modelTables) || tables, anchor, rels) : null, near = (c) => !reach || reach.has(c.t);
    // time axis: a month column from the date table, else its date column, else any date column
    const quiet = { skipped: new Set(), fallback: new Set() }, inDate = byLang(columns.filter((c) => c.dateTable && near(c)), L, quiet);   // (the calendar's own Arabic columns are not told)
    // (the rc's laptop proof, 11 Oct: S8, a month as a number is no axis: its name column, sorted by it, or the date; D9, a
    // time stamp is never the axis: one point per moment)
    // (the second sweep, T3: a column another column is sorted by is that one's number, also in a DAX calendar whose
    // files give no types)
    const sortTargets = new Set(); ((opt && opt.modelTables) || tables).concat(tables).forEach((t) => (t.columns || []).forEach((c) => { if (c.sortBy) sortTargets.add(t.name + '\u0000' + String(c.sortBy)); }));
    const sortsOther = (c) => sortTargets.has(c.t + '\u0000' + c.c) || columns.some((o) => o !== c && o.t === c.t && o.sortBy && o.sortBy.c === c.c);
    const monthText = (c) => !/^(int64|double|decimal|number)$/.test(c.type) && !metaOf(c).numeric && !sortsOther(c),   /* (round 11: a summed month number is no month axis) */ dayDate = (c) => /date/.test(c.type) && !metaOf(c).stamp;
    let date = inDate.find((c) => monthText(c) && /^(month[\s_-]*(name|year|label)?|year[\s_-]*month|الشهر)$/i.test(c.c)) || inDate.find((c) => monthText(c) && /month|الشهر/i.test(c.c))
      || inDate.find(dayDate) || columns.find((c) => dayDate(c) && near(c))
      || byLang(columns.filter((c) => monthText(c) && /^(month[\s_-]*(name)?|الشهر)$/i.test(c.c) && near(c)), L, quiet)[0] || null;   // no date table: a month column anywhere
    // Round 12 (#16; seen in Desktop 2.158, round 11: "January" ... "December" slanted on the line chart): the time axis
    // takes the model's short month names ("Jan") where it has them, in the same order
    const SHORT_MONTH = /^(month\s*(short|abbr|abbreviation)|short\s*month|mmm)$/i;
    if (date && /month|الشهر/i.test(date.c) && !/date/.test(date.type)) { const sh = columns.find((c) => c.t === date.t && SHORT_MONTH.test(c.c.replace(FAMILY, '').trim()) && family(c.c) === family(date.c)); if (sh) date = sh; }
    // (FX4, D-1028-04) a month NAME on the axis while the dates span more than one year adds up the same month of every
    // year in one point: the same table's year-month column takes its place, else its date. The span is known by the
    // counts (a year of 2 values or more, a year-month of 13 or more), else (FX4b, the owner's D-1028-07) by the
    // calendar's own DAX (CALENDAR ( DATE ( y1 .. ), DATE ( y2 .. ) ), y2 > y1); not known: the month name stays and the
    // answer says so. The report puts a year-month label in time order by its month's first date ("Month start (sort)")
    if (date && !/date/.test(date.type) && /month|الشهر/i.test(date.c) && sortKind(date.c) !== 'yearMonth' && !(opt && opt.pinned && opt.pinned.date)) {
      const all = ((opt && opt.modelTables) || []).concat(tables), tb = all.find((t) => t.name === date.t), raw = (tb && tb.columns) || [];
      const ymName = (n) => sortKind(n) === 'yearMonth' && /month/i.test(n) && /year/i.test(n);
      const yc = raw.filter((c) => /^(calendar\s*|fiscal\s*)?year$/i.test(c.name) && !/fiscal/i.test(c.name)).map((c) => ST.distinct(date.t, c.name)).find((n) => n != null);
      const ym = raw.filter((c) => ymName(c.name)).map((c) => ST.distinct(date.t, c.name)).find((n) => n != null), yrs = tb && metaOf(tb).years;
      const span = yc != null ? (yc > 1 ? `${num(yc)} years by the model's counts` : null) : ym != null ? (ym > 12 ? `${num(ym)} months by the model's counts` : null)
        : yrs ? (yrs[1] > yrs[0] ? `${yrs[0]} to ${yrs[1]} by the calendar's own DAX` : null) : undefined;
      const to = span ? (columns.find((c) => c.t === date.t && ymName(c.c) && monthText(c)) || columns.find((c) => c.t === date.t && dayDate(c)) || inDate.find(dayDate)) : null;
      // (FX4b) the year-month label's order, by the writer's own precedence (timeAxisPlan): the model's sort-by column
      // (ordered), else the table's year-month number ("Year Month Sort", "Year Month Number": sortBy, Min of it in the
      // chart, measured in round 2), else its month's first date, MIN of the table's date ("Month start (sort)", measured
      // for O-13). The name rule that gives month and day names their order (nameLike) does not read "Year Month", so the
      // order is set here, on the field this rule picks only. A table built with CALENDAR always has its own Date column,
      // a date, even where the files give it no type (a DAX calendar without a refresh): never the label read as a date
      // (DATEVALUE, which depends on Desktop's reading of the text)
      if (to && !/date/.test(to.type) && !to.ordered && !to.sortBy) {
        const own = raw.find((c) => c.name === to.c), typeOf = (c) => String(c.dataType || 'unknown').toLowerCase();
        const n = raw.find((c) => c.name !== to.c && SORT_BY.yearMonth.test(c.name.trim()) && (/^(int64|double|decimal|number)$/.test(typeOf(c)) || (typeOf(c) === 'unknown' && /(no|num|number|index|key|sort|order|id)$/i.test(c.name.trim()))));
        if (own && (own.sortBy || own.sortByColumn)) to.ordered = true;
        else if (n) to.sortBy = { t: to.t, c: n.name };
        else if (!to.dateOf && tb && metaOf(tb).calendarShape) { const dc = raw.find((c) => /^date$/i.test(c.name) && /^(unknown|date|datetime)$/.test(typeOf(c))); if (dc) to.dateOf = { t: to.t, c: dc.name }; }
      }
      if (to) { say(fieldKey(to.t, to.c), `The time axis is ${to.c}, not ${date.c}: the dates span more than one year (${span}), and a month name would add up the same month of every year in one point.`); date = to; }
      else if (span === undefined) say(fieldKey(date.t, date.c), `${date.c} is the time axis; the date range is not known (no counts given, no calendar DAX that names it). If the dates span more than one year, use a year-month column or the date instead.`);
    }
    let year = inDate.find((c) => /^(year|السنة)$/i.test(c.c)) || null;
    // (FX4) a year of one value is no slicer
    if (year && ST.distinct(year.t, year.c) === 1) { say(fieldKey(year.t, year.c), `${year.c} is not a slicer: the model's counts give it one value.`); year = null; }
    // a category: a text column, or one of unknown type whose name reads as a category (not a number, date or key)
    // (round 11, N18: a column the model sums or formats as a plain number is a number, whatever its type in the files)
    const textLike = (c) => !metaOf(c).numeric && (c.type === 'string' || (c.type === 'unknown' && !NUMBERISH.test(c.c) && !DATEISH.test(c.c)));
    // (round 23: in the report's language; an Arabic twin keeps its English one's place)
    // (round 23 part 5, the review's 4: the reach first, then the language on what is reached, with its Arabic fallback;
    // before, an English column of an unrelated table took the place and then the reach left no category)
    // (the rc's laptop proof, 11 Oct: D11, a two-value category after every other; S5, one with many values (a lookup's own
    // name, a city) after the others)
    // (round 8, N1: an identifier or a contact-details label after every other, even a two-value one)
    const catRank = (c) => (metaOf(c).id ? 3 : metaOf(c).two ? 2 : metaOf(c).wide ? 1 : 0);
    // (round 10, RESCORE-3's N12: a time level (a year, a quarter, a month name) is the trend's, never a category: "Calls by
    // Year" was one bar on a calculated calendar the files give no types)
    let cats = columns.filter((c) => !c.dateTable && !c.time && (textLike(c) || c.type === 'boolean') && !NOT_CAT.test(c.c) && c !== date)
      .sort((a, b) => catRank(a) - catRank(b) || (CAT.test(b.c) || (metaOf(b).lang === 'ar' && metaOf(b).twin && CAT.test(metaOf(b).twin.c)) ? 1 : 0) - (CAT.test(a.c) || (metaOf(a).lang === 'ar' && metaOf(a).twin && CAT.test(metaOf(a).twin.c)) ? 1 : 0));
    // Round 22 (golden task 10 in Desktop 2.158.1304, 7 Oct 2026: the same total for every Carrier Group, the lookup's
    // table was related to another fact table only): with the model's relationships (opt.relationships, each
    // { fromTable, toTable }; the MCP gives them, the website's picker has none and is unchanged) a category of the
    // main measure's own table, or of a table reached from it along the relationships, comes before every other
    // (the outside review's X-04: where none is reached, none is given: a chart by a table the measure is not related
    // to shows the same total on every bar; the date table's parts only when reached, else the charts that need a
    // category are left out and the caller says why: noRelatedCategory)
    const unreached = reach ? cats.filter((c) => !reach.has(c.t)) : [];
    if (reach) cats = cats.filter((c) => reach.has(c.t));
    cats = byLang(cats, L, note);
    // (FX4, D-1028-04) never a category (a chart's axis, a slicer, a table's group): a column of one value by the model's
    // counts; a text column of mostly unique values (90% of its table's rows or more, in a table of over 100 rows: a small
    // lookup's own names stay) or of over 5,000; one named as coordinates, or as invoice numbers. Without counts the name
    // rules alone (the caller says counts were not available). Each column left out is said in why
    const notCat = (c) => { const n = ST.distinct(c.t, c.c), r = ST.rows(c.t), txt = textLike(c), nm = splitName(c.c);
      if (n === 1) return `${c.c} is not a category: the model's counts give it one value, so a chart or slicer by it shows one item.`;
      if (txt && (COORD.test(nm) || /^(latitude|longitude)$/i.test(String(c.cat || '')))) return `${c.c} is not a category: its name says it holds coordinates (a point on a map).`;
      if (txt && INVOICE.test(nm)) return `${c.c} is not a category: its name says it holds invoice numbers, one item per invoice.`;
      if (txt && n != null && r > 100 && n >= 0.9 * r) return `${c.c} is not a category: ${num(n)} distinct values in ${num(r)} rows, mostly unique (an identifier or free text).`;
      if (txt && n != null && n > 5000) return `${c.c} is not a category: ${num(n)} distinct values, more than a chart or slicer can show (5,000 at most).`;
      return null; };
    const keepCat = (c) => { const w = notCat(c); if (w) say(fieldKey(c.t, c.c), w); return !w; };
    cats = cats.filter(keepCat);
    // no category outside the date table: the date table's named parts (quarter, day, month names), never the time axis
    // no category outside the date table: the date table's named parts (quarter, day, month names), never the time axis
    // (round 11, RESCORE-4's N18: never its numbers: a summed or "0"-formatted column is no part; when even these are
    // missing the charts that need a category are left out and the answer says so: noCategory)
    if (!cats.length) cats = DATE_PARTS.map((re) => inDate.find((c) => re.test(c.c) && textLike(c) && c !== date && (!reach || reach.has(c.t)) && keepCat(c))).filter(Boolean);
    const noCategory = !cats.length;
    // (the rc's laptop proof, D7: the column chart never by the bar chart's field, nor by a field of the same name in
    // another table: the same chart twice; with no other category, a date table's part, else the bar chart's: its slot
    // would stay empty)
    const nm = (c) => String(c.c).toLowerCase(), catA = cats[0] || null, otherName = (c) => catA && c !== catA && nm(c) !== nm(catA);
    const catB = catA ? (cats.find((c) => otherName(c) && c.t !== catA.t && catRank(c) <= catRank(catA)) || cats.find((c) => otherName(c) && catRank(c) < 2)
      || (catA.dateTable ? DATE_PARTS.slice(1).map((re) => inDate.find((c) => re.test(c.c) && textLike(c) && c !== date && otherName(c))).filter(Boolean)[0] : null) || catA) : null;   /* (round 10, N12: never the quarter beside a real category; round 11, N18: no calendar part beside a real category at all) */   /* (round 10, N12: never the quarter beside a real category) */   // (catA only when the model has no other category: a chart left out leaves its slot empty, the writer's)
    // (D8 + D10: never two slicers on fields of the same name, never on a time stamp)
    const sl = [year, catA, catB, date].filter((x, i, l) => x && l.indexOf(x) === i && !metaOf(x).stamp && l.findIndex((y) => y && nm(y) === nm(x)) === i);
    // (round 23 part 5, the review's 2: the table's reach rule lives in build, so a binding built again from these choices
    // (a picker change, the website's own picks) keeps it: choices.reach)
    // (builder 7's audit A3-2, 11 Oct: these rules were create_report's, by the Gulf calendar's own names, so the website's
    // download of the same model had none of them; the caller now passes options and builds nothing itself)
    // pinned: the fields the user names ({ kpis, main, date, catA, catB, slicers, table }, as fieldOf and measureOf give
    // them), kept as named: the given slicers first, a slot left over keeps the picker's
    const same = (x, y) => x && y && x.t === y.t && x.c === y.c;
    let ch = Object.assign({ kpis, main, date, catA, catB, slicers: [sl[0] || null, sl[1] || null, sl[2] || null] }, opt && opt.kpiValues === 'full' ? { full: true } : {}, reach ? { reach: { relationships: rels, modelTables: (opt && opt.modelTables) || tables } } : {});
    ['kpis', 'main', 'date', 'catA', 'catB', 'table'].forEach((k) => { if (P[k]) ch[k] = P[k]; });
    if (P.slicers) { ch.slicers = P.slicers.concat(ch.slicers.filter((x) => x && !P.slicers.some((g) => same(g, x)))).slice(0, 3); while (ch.slicers.length < 3) ch.slicers.push(null); }
    // excludeColumns (round 12, #22; seen in Desktop 2.158, golden task 3: slicers showed "All" while a page filter had
    // fixed them): no slicer on a column a page filter fixes; the next column the picker would take instead, and named
    const ex = (opt && opt.excludeColumns) || [], fixed = (x) => x && ex.some((e) => same(e, x)), pool = [year].concat(cats, [date]).filter((x, i, l) => x && l.indexOf(x) === i && !metaOf(x).stamp && l.findIndex((y) => y && nm(y) === nm(x)) === i), excluded = [];
    if (ex.length) { const keep = ch.slicers.filter((x) => x && !fixed(x)); ch.slicers.filter(fixed).forEach((x) => { if (!excluded.some((e) => same(e, x))) excluded.push({ t: x.t, c: x.c }); });
      pool.forEach((x) => { if (keep.length < 3 && !fixed(x) && !keep.some((k) => same(k, x) || nm(k) === nm(x))) keep.push(x); });
      ch.slicers = keep.concat([null, null, null]).slice(0, 3); }
    // axisFor (round 12, #21; golden task 3: one Ramadan by month was a line of two points): with a page filter that keeps
    // a flag true ("Is Festival", "Is Ramadan"), the time axis runs by the flag's own day column of the same table
    // ("Festival Day": the flag's word and "day"), unless the plan named the axis
    let axisBy = null;
    if (!P.date) for (const fl of (opt && opt.axisFor) || []) {
      if (!fl || !(fl.values || []).length || !fl.values.every((v) => v === true)) continue;
      const tb = ((opt && opt.modelTables) || tables).concat(tables).find((x) => x.name === fl.t), word = String(fl.c).replace(/^\s*(is|flag)[\s_-]+/i, '').replace(/[\s_-]+flag\s*$/i, '').trim().toLowerCase();
      const dc = tb && word && (tb.columns || []).find((c) => c.name !== fl.c && c.name.replace(/[\s_-]+/g, ' ').trim().toLowerCase() === word.replace(/[\s_-]+/g, ' ') + ' day');
      if (dc) { ch.date = fieldOf(tb, dc.name); axisBy = { t: tb.name, c: dc.name, flag: { t: fl.t, c: fl.c } }; break; }
    }
    // lang "ar" (owner 2026-10-06, the MCP's until A3-2): the calendar's Arabic name columns in place of the English ones,
    // wherever a field is bound (picked or pinned), with their own sort: a day or month name's Arabic twin, else the
    // table's Arabic name of the same kind (a month name for "Month Short") and calendar (Hijri or not); a calendar name
    // with neither is named (calendarNames), so the caller can say how to get one
    const calendarNames = [], swaps = [];
    const inAr = (x) => {
      // (0.3.0 C1, the owner, 21 Oct) any column of a date table with its "<name> (Arabic)" twin there (the Arabic
      // calendar columns: quarters, fiscal, the flags' labels, the names): the twin, once the script added it
      if (L === 'ar' && x && x.c != null) { const nm = String(x.c).trim().toLowerCase() + ' (arabic)', tw = columns.find((c) => c.t === x.t && c.dateTable && String(c.c).trim().toLowerCase() === nm);
        if (tw) { if (!swaps.some((w) => same(w.from, x))) swaps.push({ from: { t: x.t, c: x.c }, to: { t: tw.t, c: tw.c } }); return tw; } }
      if (L !== 'ar' || !x || x.c == null || !x.cal || !/^(month|day)$/.test(x.cal.kind)) return x;
      const c0 = columns.find((c) => c.t === x.t && c.c === x.c); if (!c0 || metaOf(c0).lang !== 'en') return x;
      const hijri = (c) => (c.cal || {}).family === 'hijri';
      const tw = (metaOf(c0).twin && metaOf(c0).twin.cal ? metaOf(c0).twin : null) || columns.find((c) => c.t === x.t && metaOf(c).lang === 'ar' && c.cal && c.cal.kind === x.cal.kind && hijri(c) === hijri(x));
      if (!tw) { if (!calendarNames.some((e) => same(e, x))) calendarNames.push({ t: x.t, c: x.c }); return x; }
      if (!swaps.some((w) => same(w.from, x))) swaps.push({ from: { t: x.t, c: x.c }, to: { t: tw.t, c: tw.c } });
      return tw;
    };
    if (L === 'ar') { ['date', 'catA', 'catB'].forEach((k) => { ch[k] = inAr(ch[k]); }); ch.slicers = ch.slicers.map(inAr); if (ch.table) ch.table = ch.table.map(inAr); }
    // (SP30: the binding of ch is pbip-bind.js's build; these are the notes beside it, in the order the answer gives them)
    const notes = Object.assign({}, langNote(L, note));
    if (noCategory && !P.catA && !P.catB) notes.noCategory = 'The model has no text column outside its calendar to group by, so the charts by category are left out: say it in the plan (a calendar\'s year, month or day belongs on the trend).';
    if (excluded.length) notes.excluded = excluded;
    if (axisBy) notes.axisBy = axisBy;
    if (calendarNames.length) notes.calendarNames = calendarNames;
    // (D17: a card whose format is set by DAX beside cards in a currency: told, so the plan can say it or pick another)
    const cardsNow = (ch.kpis || []).filter(Boolean);
    // (round 8: an amount with no format at all beside them too: its card shows no currency either)
    const mixed = (x) => metaOf(x).dynamic || (metaOf(x).amount && metaOf(x).unformatted);
    if (cardsNow.some(mixed) && cardsNow.some((x) => metaOf(x).currency)) notes.formatsMixed = cardsNow.filter(mixed).map((x) => Object.assign({ t: x.t, m: x.m }, metaOf(x).dynamic ? {} : { unformatted: true }));
    if (swaps.length) notes.calendarSwaps = swaps;
    // (round 23: no time axis because the measure reaches no calendar of the model: said with the calendars' names)
    // (part 8, the review's 3: a date column of a table the measure does not reach, with no marked calendar, is named too:
    // kind 'date', "no date column is related to")
    if (!ch.date && reach) { const cal = [...new Set(columns.filter((c) => c.dateTable && !reach.has(c.t)).map((c) => c.t))], dt = [...new Set(columns.filter((c) => !c.dateTable && /date/.test(c.type) && !reach.has(c.t)).map((c) => c.t))];
      if (cal.length) notes.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: cal.slice(0, 5), kind: 'calendar' };
      else if (dt.length) notes.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: dt.slice(0, 5), kind: 'date' }; }
    if (!cats.length && unreached.length && !ch.catA && !ch.catB) notes.noRelatedCategory = { measure: { t: anchor.t, m: anchor.m }, tables: [...new Set(unreached.map((c) => c.t))].slice(0, 5) };
    // every column a slicer could take, in the order they are picked (round 12, #22)
    notes.slicerPool = pool;
    // the categories a page's charts can take, in the picker's order (round 16, design finding #18: the operations
    // layout drew two bar charts and a donut all by Quarter): the writer gives each chart of a page one not used there yet;
    // none when the plan names its categories (round 16: they are kept as given)
    if (!P.catA && !P.catB) notes.catPool = cats.slice(0, 8).map(inAr).filter((x, i, l) => l.indexOf(x) === i).map((c) => Object.assign({ t: c.t, c: c.c }, c.sortBy ? { sortBy: c.sortBy } : {}, c.ordered ? { ordered: true } : {}, c.time != null ? { time: c.time } : {}, c.cal ? { cal: c.cal } : {}, metaOf(c).short ? { short: metaOf(c).short } : {}));
    // the measures left behind that were not picked, so the caller can say so (none: no such key)
    const skipped = ranked.filter((x) => x.stale && !kpis.includes(x) && x !== main).map((x) => ({ t: x.t, m: x.m }));
    if (skipped.length) notes.skipped = skipped;
    // (FX4) why: one plain line per field a rule acted on, capped; counts given for names the model does not have
    if (why.length) { notes.why = why.slice(0, WHY_MAX); if (why.length > WHY_MAX) notes.whyNotListed = why.length - WHY_MAX; }
    if (ST.notInModel.length) notes.statsNotInModel = ST.notInModel.slice(0, WHY_MAX);
    return { choices: ch, notes };
  }
  // Round 12 (#25; seen in Desktop 2.158, round 11: a report on a model without measures was a header and one small
  // table, four fifths of the page empty). Numbers from columns, counted or summed by the visual itself (the report
  // writer's f.agg: 2 a distinct count, 0 a sum), from the table with the most visible columns: the count of its ID
  // column first, then the sums of its number columns (never an ID, a sort key or a date part), then the distinct counts
  // of its text columns. names: { count: (c) => text, sum: (c) => text } for their display names.
  // (a number column is summed only when a sum means something: never a rate, a ratio, a percent, a price, an average,
  // a score, an age or a coordinate)
  const ID = /(^|[\s_-])(id|key|code|no|number|num)$|[a-z]ID$/i, DATE_PART = /year|quarter|month|week|day|hour|sort|order|index|offset/i,
    NOT_SUM = /rate|ratio|percent|%|pct|price|avg|average|mean|score|rank|age|lat(itude)?$|long(itude)?$|نسبة|سعر|متوسط/i;
  function counts(tables, names, opt) {
    const { columns } = catalog(tables), by = {}, L = opt && opt.lang, note = { skipped: new Set(), fallback: new Set() };
    columns.forEach((c) => { (by[c.t] = by[c.t] || []).push(c); });
    const main = Object.keys(by).sort((a, b) => by[b].length - by[a].length)[0];
    if (!main) return [];
    const cs = by[main], nm = names || { count: (c) => 'Count of ' + c, sum: (c) => 'Sum of ' + c };
    const id = cs.find((c) => ID.test(c.c) && !/date/.test(c.type));
    const nums = cs.filter((c) => c !== id && /^(int64|double|decimal|number)$/.test(c.type) && !ID.test(c.c) && !DATE_PART.test(c.c) && !NOT_SUM.test(c.c));
    // (round 23: the text columns counted follow the report's language, as the picker's categories do)
    const texts = byLang(cs.filter((c) => c !== id && (c.type === 'string' || (c.type === 'unknown' && !NUMBERISH.test(c.c) && !DATEISH.test(c.c))) && !NOT_CAT.test(c.c)), L, note);
    return [].concat(id ? [{ t: main, c: id.c, agg: 2, num: true, name: nm.count(id.c), wholeFormat: '#,0' }] : [],
      nums.map((c) => ({ t: main, c: c.c, agg: 0, num: true, name: nm.sum(c.c), wholeFormat: '#,0' })),
      // (round 16, design finding #14: a count of a category column, "Count of Region", is marked: never a KPI card)
      texts.map((c) => ({ t: main, c: c.c, agg: 2, num: true, name: nm.count(c.c), wholeFormat: '#,0', category: true })));
  }
  const api = { rank, counts, statsOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAFieldSuggest = api;
})(typeof self !== 'undefined' ? self : this);
