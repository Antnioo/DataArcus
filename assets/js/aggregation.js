/*
 * DataArcus - the aggregation guard (B-146, 0.3). Which values must never be stacked or summed, read from metadata only:
 * a measure's DAX shape, its format string and its name (never data). Pure; browser and Node (module.exports /
 * window.DAAggregation).
 *   classify(item, ctx) -> { class: 'non_additive' | 'semi_additive_time' | 'unknown', confidence, evidence, timeHandled }
 *     item: a measure { name, expression, formatString } or a column a visual aggregates { column, agg } (agg as the
 *     reading block names it: Sum, Avg, Min, Max, Count, CountNonNull). ctx.measures: the model's measures, so a measure
 *     that refers to another ([Margin %]) is read through it.
 *     non_additive: a ratio, an average, a distinct count, a median or percentile, a rank, a minimum or maximum: its total
 *       is never the sum of its parts. semi_additive_time: a snapshot (a balance, a headcount, an inventory, a to-date
 *       total): it adds up across categories but not across time; timeHandled is true when the DAX already takes the
 *       period end or the running total (LASTDATE, CLOSINGBALANCEMONTH, TOTALYTD...).
 *     It never says a measure IS additive (a SUM can still be a snapshot the name doesn't tell): what it can't tell is
 *     "unknown", and nothing is changed or asked for it.
 *   guard(page, ctx) -> { nonAdditive, questions, problems } for one page the report writer built (the reading block's
 *     inventory: visuals with type and fields by role). ctx: { measures (with table), tables (the model's, for column
 *     types) }. A non-additive value in a stacked or area type is a problem; a snapshot not handled over time on a time
 *     axis or a card is one question, never a change; the non-additive values are listed with where they are.
 * Rules measured on public models before they were trusted (mcp/research/AGGREGATION-HOLDOUT.md).
 */
(function (root) {
  // the types that add the values of a series up (Microsoft's names, visual-types.js: barChart and columnChart are the
  // stacked bar and column charts; an areaChart overlaps its series, it doesn't stack them)
  var STACKED = ['barChart', 'columnChart', 'hundredPercentStackedBarChart', 'hundredPercentStackedColumnChart', 'stackedAreaChart',
    'hundredPercentStackedAreaChart', 'lineStackedColumnComboChart', 'ribbonChart', 'waterfallChart'];
  var CARDS = ['cardVisual', 'card', 'multiRowCard', 'kpi', 'gauge'], TABLES = ['tableEx', 'table', 'pivotTable', 'matrix'];
  var VALUE_ROLES = ['Y', 'Y2', 'Values', 'Data', 'Size', 'Value', 'Indicator', 'TargetValue', 'Gradient'];

  // what each function's result is (the outermost one decides)
  var NON = { DIVIDE: 'a ratio', AVERAGE: 'an average', AVERAGEA: 'an average', AVERAGEX: 'an average', DISTINCTCOUNT: 'a distinct count',
    DISTINCTCOUNTNOBLANK: 'a distinct count', APPROXIMATEDISTINCTCOUNT: 'a distinct count', MEDIAN: 'a median', MEDIANX: 'a median',
    'PERCENTILE.INC': 'a percentile', 'PERCENTILE.EXC': 'a percentile', 'PERCENTILEX.INC': 'a percentile', 'PERCENTILEX.EXC': 'a percentile',
    RANKX: 'a rank', RANK: 'a rank', GEOMEAN: 'an average', GEOMEANX: 'an average', MIN: 'a minimum', MAX: 'a maximum', MINA: 'a minimum',
    MAXA: 'a maximum', MINX: 'a minimum', MAXX: 'a maximum', 'STDEV.S': 'a deviation', 'STDEV.P': 'a deviation', 'STDEVX.S': 'a deviation',
    'STDEVX.P': 'a deviation', 'VAR.S': 'a variance', 'VAR.P': 'a variance', 'VARX.S': 'a variance', 'VARX.P': 'a variance' };
  var TIME = { TOTALYTD: 1, TOTALQTD: 1, TOTALMTD: 1, CLOSINGBALANCEMONTH: 1, CLOSINGBALANCEQUARTER: 1, CLOSINGBALANCEYEAR: 1,
    OPENINGBALANCEMONTH: 1, OPENINGBALANCEQUARTER: 1, OPENINGBALANCEYEAR: 1, LASTNONBLANKVALUE: 1, FIRSTNONBLANKVALUE: 1 };
  var SUMS = { SUM: 1, SUMX: 1, COUNT: 1, COUNTA: 1, COUNTAX: 1, COUNTX: 1, COUNTBLANK: 1 };
  var DISTINCT_TABLE = { DISTINCT: 1, VALUES: 1, SUMMARIZE: 1, SUMMARIZECOLUMNS: 1, GROUPBY: 1 };
  var BRANCHES = { IF: 1, 'IF.EAGER': 1, IFERROR: 1, COALESCE: 1, SWITCH: 1 };
  // a denominator that is the total of the whole selection, or of a dimension: the value is a share of it
  var SHARE = /\b(ALL|ALLSELECTED|REMOVEFILTERS|ALLEXCEPT|ALLNOBLANKROW)\s*\(/i;
  // a CALCULATE filter that takes the period end or the time so far
  var TIME_FILTER = /\b(LASTDATE|FIRSTDATE|DATESYTD|DATESQTD|DATESMTD|ENDOFMONTH|ENDOFQUARTER|ENDOFYEAR|STARTOFMONTH|STARTOFQUARTER|STARTOFYEAR|LASTNONBLANK|FIRSTNONBLANK)\s*\(|(<=|=)\s*MAX\s*\(/i;
  // names: a snapshot over time, a ratio
  var SNAPSHOT = /(^|[^a-z])(balance|balances|head ?count|headcount|on hand|closing|opening|ending|beginning|end of (month|period|year)|year to date|month to date|quarter to date|running total|cumulative)([^a-z]|$)|الرصيد|رصيد|عدد الموظفين|منذ بداية السنة/i;
  // (an inventory or a stock is a level only when it is a quantity summed: COUNTROWS ( reports ) of an "Inventory" is a
  // catalogue, one row per item)
  var TODATE = /(^|[^A-Za-z])(YTD|QTD|MTD|EOP|BOP)([^A-Za-z]|$)/;
  var STOCK = /(^|[^a-z])(inventory|stock|stock on hand|stock level)([^a-z]|$)|المخزون/i;
  // (a level word with a flow word is a flow: "Stock Movements", "Balance Transfers" add up over time)
  var FLOW = /(^|[^a-z])(movements?|transactions?|receipts?|issues?|purchases?|sales?|adjustments?|changes?|flows?|transfers?|postings?)([^a-z]|$)|حركة|حركات/i;
  var RATIO = /%|(^|[^a-z])(ratio|rate|pct|percent|percentage|avg|average|mean|median|share|per (unit|order|customer|head|capita|day|month|employee)|conversion|yield)([^a-z]|$)|نسبة|معدل|متوسط/i;

  // ---------- reading the DAX's shape (comments and texts out; never run) ----------
  // one pass, so a // or -- inside a text ("https://...") or a name ([a--b]) is not read as a comment: a text becomes "",
  // a quoted table name keeps its letters ('Sales_Orders'), a comment a space
  function clean(x) {
    var s = Array.isArray(x) ? x.join('\n') : String(x == null ? '' : x), out = '', i = 0, n = s.length;
    while (i < n) {
      var c = s[i], d = s[i + 1];
      if (c === '"') { i++; while (i < n && !(s[i] === '"' && s[i + 1] !== '"')) i += s[i] === '"' ? 2 : 1; i++; out += '""'; continue; }
      if (c === "'") { var q = i + 1; i++; while (i < n && !(s[i] === "'" && s[i + 1] !== "'")) i += s[i] === "'" ? 2 : 1; out += "'" + s.slice(q, i).replace(/[^\w\u0080-\uffff]+/g, '_') + "'"; i++; continue; }
      if (c === '[') { var j = s.indexOf(']', i); if (j < 0) j = n - 1; out += s.slice(i, j + 1); i = j + 1; continue; }
      if (c === '/' && d === '*') { var k = s.indexOf('*/', i + 2); i = k < 0 ? n : k + 2; out += ' '; continue; }
      if ((c === '/' && d === '/') || (c === '-' && d === '-')) { var e = s.indexOf('\n', i); i = e < 0 ? n : e; out += ' '; continue; }
      out += c; i++;
    }
    return out.trim();
  }
  // top-level positions: depth 0 outside [ ] and ( )
  function scan(s, at) { var d = 0, b = 0; for (var i = 0; i < s.length; i++) { var c = s[i]; if (c === '[') b++; else if (c === ']') b = Math.max(0, b - 1); else if (!b && c === '(') d++; else if (!b && c === ')') d--; else if (!b && !d && at(c, i) === false) return i; } return -1; }
  function unwrap(s) {
    s = s.trim();
    while (s[0] === '(') { var d = 0, end = -1; for (var i = 0; i < s.length; i++) { if (s[i] === '(') d++; else if (s[i] === ')') { d--; if (!d) { end = i; break; } } } if (end !== s.length - 1) break; s = s.slice(1, -1).trim(); }
    return s;
  }
  function args(inner) { var out = [], last = 0; scan(inner, function (c, i) { if (c === ',') { out.push(inner.slice(last, i)); last = i + 1; } }); out.push(inner.slice(last)); return out.map(function (a) { return a.trim(); }); }
  // VAR ... RETURN: the RETURN's expression, with the variables it may name
  function vars(s) {
    if (!/^VAR\b/i.test(s)) return null;
    var cuts = [], re = /\b(VAR|RETURN)\b(?!\s*\.)/gi, m;
    while ((m = re.exec(s))) { var before = s.slice(0, m.index), d = 0, b = 0; for (var i = 0; i < before.length; i++) { var c = before[i]; if (c === '[') b++; else if (c === ']') b--; else if (!b && c === '(') d++; else if (!b && c === ')') d--; } if (!d && !b) cuts.push({ k: m[1].toUpperCase(), at: m.index, end: re.lastIndex }); }
    var map = {}, ret = null;
    cuts.forEach(function (c, i) { var body = s.slice(c.end, i + 1 < cuts.length ? cuts[i + 1].at : s.length).trim();
      if (c.k === 'VAR') { var eq = body.indexOf('='); if (eq > 0) map[body.slice(0, eq).trim().toUpperCase()] = body.slice(eq + 1).trim(); } else ret = body; });
    return ret == null ? null : { ret: ret, vars: map };
  }
  // the shape of an expression: { s: 'non' | 'sum' | 'time' | 'const' | 'unknown', says }
  function shape(expr, env, depth) {
    if (depth > 12) return { s: 'unknown' };
    var s = unwrap(expr);
    if (!s) return { s: 'unknown' };
    var v = vars(s);
    if (v) { var env2 = Object.assign({}, env.vars || {}, v.vars); return shape(v.ret, Object.assign({}, env, { vars: env2 }), depth + 1); }
    if (/^-/.test(s)) s = s.slice(1).trim();
    if (/^(\d*\.?\d+([eE][+-]?\d+)?|BLANK\s*\(\s*\)|TRUE\s*\(\s*\)|FALSE\s*\(\s*\)|"")$/i.test(s)) return { s: 'const' };
    if (env.vars && /^[A-Za-z_][\w.]*$/.test(s) && env.vars[s.toUpperCase()] != null) return shape(env.vars[s.toUpperCase()], env, depth + 1);
    // operators at the top: a division is a ratio; a sum or difference keeps its terms' shape when they agree
    // (a division by a constant, SUM ( x ) / 1000, only changes the unit: the numerator's shape)
    var parts = [], from = 0;
    scan(s, function (c, i) { if (c === '/') { parts.push(s.slice(from, i)); from = i + 1; } });
    // (and by one selected value, SELECTEDVALUE ( Units[Value] ): the unit the user picks, the same for every row)
    // (and by the same total over ALL or ALLSELECTED: a share of the total, whose rows add up to the total row)
    if (parts.length) { parts.push(s.slice(from)); if (parts.slice(1).every(function (x) { return unit(shape(x, env, depth + 1)); })) return shape(parts[0], env, depth + 1);
      if (parts.slice(1).some(function (x) { return SHARE.test(x); })) return { s: 'share' }; return { s: 'non', says: 'a division (/)' }; }
    var terms = [], last = 0;
    // (a + or - after an operator is a sign; after a digit's E, an exponent)
    scan(s, function (c, i) { var before = s.slice(0, i).trimEnd(); if ((c === '+' || c === '-') && before && !/[(,*\/+\-<>=&|^]$/.test(before) && !/\d[eE]$/.test(before)) { terms.push(s.slice(last, i)); last = i + 1; } });
    // (arithmetic it can't read is marked op: a % format then doesn't decide, "Sales * ( days / days in quarter )" is an
    // amount whatever its format says)
    // a text joined with & (a title, an image's SVG): never a number to sum
    if (scan(s, function (c, i) { return c === '&' && s[i + 1] !== '&' && s[i - 1] !== '&' ? false : undefined; }) >= 0) return { s: 'text' };
    if (terms.length) { terms.push(s.slice(last)); var sum = agree(terms.map(function (t) { return shape(t, env, depth + 1); }), true); return sum.s === 'unknown' ? { s: 'unknown', op: true } : sum; }
    if (scan(s, function (c) { return /[*<>=&|^]/.test(c) ? false : undefined; }) >= 0) return { s: 'unknown', op: true };
    // a measure named alone: read through it
    var ref = s.match(/^\[([^\]]+)\]$/);
    if (ref) { var mm = (env.measures || []).find(function (x) { return String(x.name).toLowerCase() === ref[1].toLowerCase(); });
      if (!mm || (env.seen || []).indexOf(mm.name) >= 0) return { s: 'unknown' };
      return shape(clean(mm.expression), Object.assign({}, env, { vars: null, seen: (env.seen || []).concat([mm.name]) }), depth + 1); }
    var fn = s.match(/^([A-Za-z][A-Za-z0-9.]*)\s*\(/);
    if (!fn || !/\)$/.test(s)) return { s: 'unknown' };
    var name = fn[1].toUpperCase(), inner = s.slice(fn[0].length, -1);
    // the call's own closing parenthesis must be the last character ("SUM ( a ) * 2" was split above)
    var d = 0, close = -1, b = 0; for (var i = fn[0].length - 1; i < s.length; i++) { var ch = s[i]; if (ch === '[') b++; else if (ch === ']') b--; else if (!b && ch === '(') d++; else if (!b && ch === ')') { d--; if (!d) { close = i; break; } } }
    if (close !== s.length - 1) return { s: 'unknown' };
    var a = args(inner);
    if (name === 'DIVIDE' && a[1] != null && unit(shape(a[1], env, depth + 1))) return shape(a[0], env, depth + 1);
    if (name === 'DIVIDE' && a[1] != null && SHARE.test(a[1])) return { s: 'share' };
    if (name === 'SELECTEDVALUE') return { s: 'scalar' };
    if ((name === 'DISTINCTCOUNT' || name === 'DISTINCTCOUNTNOBLANK') && ownId(a[0], env)) return { s: 'unknown' };
    if (NON[name]) return { s: 'non', says: name + ': ' + NON[name] };
    if (TIME[name]) return { s: 'time', says: name };
    if (name === 'COUNTROWS') { var t = (unwrap(a[0] || '').match(/^([A-Za-z]+)\s*\(/) || [])[1]; return t && DISTINCT_TABLE[t.toUpperCase()] ? { s: 'non', says: 'COUNTROWS(' + t.toUpperCase() + '): a distinct count' } : { s: 'sum', says: 'COUNTROWS' }; }
    if ((name === 'SUMX') && a[1] != null && /\bDIVIDE\s*\(|\//.test(a[1]) && SHARE.test(a[1])) return { s: 'share' };
    if (SUMS[name]) return { s: 'sum', says: name };
    if (name === 'CALCULATE' || name === 'CALCULATETABLE') {
      // (a window with both ends, >= MIN ( ... ) && <= MAX ( ... ), keeps the rows of the period: not a running total)
      var hit = a.slice(1).filter(function (f) { return !/>=?\s*MIN\s*\(/i.test(f); }).map(function (f) { return f.match(TIME_FILTER); }).filter(Boolean)[0];
      if (hit) return { s: 'time', says: 'CALCULATE with ' + (hit[1] ? hit[1].toUpperCase() : 'the date up to its MAX') };
      return shape(a[0] || '', env, depth + 1);
    }
    if (BRANCHES[name]) {
      var vals = name === 'IF' || name === 'IF.EAGER' ? a.slice(1) : name === 'SWITCH' ? a.filter(function (x, i) { return i > 0 && (i % 2 === 0 || i === a.length - 1); }) : a;
      return agree(vals.map(function (x) { return shape(x, env, depth + 1); }), false);
    }
    return { s: 'unknown' };
  }
  // DISTINCTCOUNT ( T[c] ) where c is T's own row id (its key, "id", or T's own name with id/key/number: FactShipments[ShipmentID],
  // 'Resource Groups'[Resource Group Id], 'Virtual Machines'[VM Resource Id]): one row per id, so it adds up like a count
  function ownId(arg, env) {
    var m = String(arg || '').trim().match(/^(?:'([^']+)'|([A-Za-z_][\w]*))?\s*\[([^\]]+)\]$/); if (!m) return false;
    var t = String(m[1] || m[2] || ''), c = m[3], low = function (x) { return String(x).toLowerCase().replace(/[^a-z0-9\u0080-\uffff]+/g, ''); };
    var col = (env.tables || []).reduce(function (hit, tb) { return hit || ((!t || low(tb.name) === low(t)) ? (tb.columns || []).find(function (x) { return x.name === c; }) && (tb.columns || []).find(function (x) { return x.name === c; }) : null); }, null);
    if (col && col.isKey) return true;
    if (!t) return false;
    var lc = low(c);
    if (lc === 'id' || lc === 'key') return true;
    var words = t.replace(/^(fact|dim|f|d)(?=[A-Z_ ])/, '').replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_]+/).filter(Boolean).map(function (w) { return low(w).replace(/(ies)$/, 'y').replace(/s$/, ''); }).filter(function (w) { return w && ['all', 'cc', 'get', 'idle', 'the'].indexOf(w) < 0; });
    var base = lc.replace(/(id|key|number|no|code)$/, ''), initials = words.map(function (w) { return w[0]; }).join('');
    if (base === lc || !base) return false;
    return words.join('') === base || words.some(function (w) { return w.length > 2 && base.indexOf(w) === 0; }) || (initials.length > 1 && base.indexOf(initials) === 0);
  }
  // a denominator that only sets the unit: a constant, or one selected value
  function unit(x) { return x.s === 'const' || x.s === 'scalar'; }
  // several values: their shape when they agree (constants and blanks left out)
  function agree(list, arithmetic) {
    var real = list.filter(function (x) { return x.s !== 'const'; });
    if (!real.length) return { s: 'const' };
    if (real.every(function (x) { return x.s === 'scalar'; })) return { s: 'scalar' };
    if (real.some(function (x) { return x.s === 'unknown'; })) return { s: 'unknown' };
    if (real.every(function (x) { return x.s === 'non'; })) return { s: 'non', says: real[0].says };
    if (real.every(function (x) { return x.s === 'sum'; })) return { s: 'sum', says: real[0].says };
    if (arithmetic && real.every(function (x) { return x.s === 'time'; })) return { s: 'time', says: real[0].says };
    if (!arithmetic && real.every(function (x) { return x.s === 'time' || x.s === 'sum'; })) { var t = real.filter(function (x) { return x.s === 'time'; }); return t.length === real.length ? { s: 'time', says: t[0].says } : { s: 'unknown' }; }
    return { s: 'unknown' };
  }
  // a % format (outside quotes and escapes)
  function percentFormat(f) { return /%/.test(String(f || '').replace(/"[^"]*"/g, '').replace(/\\./g, '')); }

  function result(cls, confidence, evidence, extra) { return Object.assign({ class: cls, confidence: confidence, evidence: evidence }, extra || {}); }
  function classify(item, ctx) {
    var c = ctx || {}, it = item || {};
    if (it.column != null) {
      var agg = String(it.agg || ''), cn = String(it.column);
      if (/^(Avg|Average|Min|Max|Median|StandardDeviation|StdDev|StDev|Variance|Var|CountDistinct|DistinctCount)$/i.test(agg)) return result('non_additive', 'high', [{ kind: 'aggregation', says: agg }]);
      if (!FLOW.test(cn) && ((/^(Sum|Count|CountNonNull)$/i.test(agg) && (SNAPSHOT.test(cn) || TODATE.test(cn))) || (/^Sum$/i.test(agg) && STOCK.test(cn)))) return result('semi_additive_time', 'high', [{ kind: 'aggregation', says: agg }, { kind: 'name', says: 'named as a snapshot' }], { timeHandled: false });
      if (/^Sum$/i.test(agg) && RATIO.test(cn)) return result('non_additive', 'medium', [{ kind: 'name', says: 'named as a ratio or an average' }]);
      return result('unknown', 'low', []);
    }
    var name = String(it.name || ''), sh = it.expression != null ? shape(clean(it.expression), { measures: c.measures || [], tables: c.tables || [], seen: [name] }, 0) : { s: 'unknown' };
    if (sh.s === 'text' || sh.s === 'share') return result('unknown', 'low', []);
    if (sh.s === 'time') return result('semi_additive_time', 'high', [{ kind: 'dax', says: sh.says }], { timeHandled: true });
    if (sh.s === 'non') return result('non_additive', 'high', [{ kind: 'dax', says: sh.says }]);
    if (percentFormat(it.formatString) && !sh.op) return result('non_additive', 'high', [{ kind: 'format', says: 'a % format' }]);
    // (a name that reads as both, "Avg cumulative storage", is an average: averaged over time, never summed)
    var snap = !FLOW.test(name) && (SNAPSHOT.test(name) || TODATE.test(name) || (STOCK.test(name) && /^SUMX?$/.test(String(sh.says || ''))));
    if (snap && sh.s !== 'const' && !(RATIO.test(name) && sh.s !== 'sum')) return result('semi_additive_time', sh.s === 'sum' ? 'high' : 'medium', [{ kind: 'name', says: 'named as a snapshot' }].concat(sh.s === 'sum' ? [{ kind: 'dax', says: sh.says + ': summed over the dates' }] : []), { timeHandled: false });
    if (RATIO.test(name) && sh.s === 'unknown') return result('non_additive', 'medium', [{ kind: 'name', says: 'named as a ratio or an average' }]);
    return result('unknown', 'low', []);
  }

  // ---------- the guard on a page the writer built ----------
  // what a value is, in words (never a piece of its DAX: PRIVACY.md section 3)
  var AGG_WHY = { Avg: 'an average', Average: 'an average', Min: 'a minimum', Max: 'a maximum', Median: 'a median', CountDistinct: 'a distinct count', DistinctCount: 'a distinct count' };
  function whyOf(r) { var e = r.evidence[0] || {}; if (e.kind === 'format') return 'a percentage'; if (e.kind === 'name') return 'named as a ratio or an average'; if (e.kind === 'aggregation') return AGG_WHY[e.says] || 'not additive';
    return /division/.test(e.says) ? 'a ratio' : String(e.says || '').split(': ')[1] || 'not additive'; }
  function guard(page, ctx) {
    var c = ctx || {}, measures = c.measures || [], cols = {};
    (c.tables || []).forEach(function (t) { (t.columns || []).forEach(function (col) { cols[t.name + '[' + col.name + ']'] = { type: String(col.dataType || '').toLowerCase(), time: t.dataCategory === 'Time' }; }); });
    var isTime = function (f) { if (!f || f.kind !== 'column') return false; var k = cols[f.table + '[' + f.name + ']'] || {}; return /date/.test(k.type) || k.time || /(^|\s)(date|month|year|quarter|week|period)(\s|$)|الشهر|السنة|التاريخ/i.test(String(f.name)); };
    var seen = {}, out = { nonAdditive: [], questions: [], problems: [] };
    ((page && page.visuals) || []).forEach(function (v) {
      var fields = v.fields || {}, type = String(v.type || ''), cat = [].concat(fields.Category || [], fields.Axis || [], fields.X || []);
      var where = CARDS.indexOf(type) >= 0 ? 'card' : TABLES.indexOf(type) >= 0 ? (type === 'pivotTable' || type === 'matrix' ? 'matrix' : 'table') : cat.some(isTime) ? 'time axis' : 'chart';
      VALUE_ROLES.forEach(function (role) { (fields[role] || []).forEach(function (f) {
        if (!f || f.report || (f.kind !== 'measure' && f.kind !== 'aggregation')) return;
        var key = f.table + '[' + f.name + ']', r;
        if (f.kind === 'measure') { var m = measures.find(function (x) { return x.name === f.name && (!x.table || x.table === f.table); }); if (!m) return; r = classify(m, { measures: measures, tables: c.tables || [] }); }
        else r = classify({ column: f.name, agg: f.agg });
        var s = seen[key] || (seen[key] = { key: key, name: f.name, r: r, in: [] });
        if (s.in.indexOf(where) < 0) s.in.push(where);
        if (r.class === 'non_additive' && STACKED.indexOf(type) >= 0) out.problems.push({ field: key, visual: type,
          en: f.name + ' is ' + whyOf(r) + ': a ' + type + ' adds its values up, which means nothing for it. Use a clustered bar or column chart, or a line, instead.',
          ar: f.name + ' قيمة لا تُجمع: المخطط المكدّس يجمع قيمها فيعطي رقمًا بلا معنى. استخدم مخططًا شريطيًا أو عموديًا متجاورًا، أو خطيًا، بدلًا منه.' });
      }); });
    });
    Object.keys(seen).forEach(function (k) { var s = seen[k];
      if (s.r.class === 'non_additive') out.nonAdditive.push({ field: s.key, name: s.name, why: whyOf(s.r), confidence: s.r.confidence, in: s.in });
      if (s.r.class === 'semi_additive_time' && s.r.timeHandled === false && (s.in.indexOf('time axis') >= 0 || s.in.indexOf('card') >= 0)) out.questions.push({ field: s.key, name: s.name, in: s.in,
        en: 'Should ' + s.name + ' be taken at the period end rather than summed over time?',
        ar: 'هل تُؤخذ قيمة ' + s.name + ' في نهاية الفترة بدلًا من جمعها عبر الزمن؟' });
    });
    return out;
  }

  // what a value is, in Arabic (the plan's sentence for an Arabic report)
  var WHY_AR = { 'a ratio': 'نسبة', 'a percentage': 'نسبة مئوية', 'an average': 'متوسط', 'a distinct count': 'عدد مميز', 'a rank': 'ترتيب',
    'a minimum': 'حد أدنى', 'a maximum': 'حد أقصى', 'a median': 'وسيط', 'a percentile': 'مئين', 'a deviation': 'انحراف معياري', 'a variance': 'تباين',
    'named as a ratio or an average': 'اسمها يدل على نسبة أو متوسط', 'not additive': 'لا تُجمع' };
  function whyAr(w) { return WHY_AR[w] || WHY_AR['not additive']; }

  var api = { classify: classify, guard: guard, whyAr: whyAr, STACKED: STACKED };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAAggregation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
