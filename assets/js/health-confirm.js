/*
 * DataArcus Power BI Model Health Check: "Please confirm", the questions (0.3.2 SP27, out of model-health-engine.js).
 * Pure JavaScript, no DOM, no state, no require: the same model always gives the same questions, and it is never changed.
 *
 * Interface (one input, one output):
 *   pleaseConfirm(M, ctx)
 *     Input:  M, the normalised model (model-index.js's normalizeModel); ctx: { userTables } (M's tables without the
 *             automatic date tables; M.tables when left out).
 *     Output: [{ id, obj, message: { en, ar }, evidence, format?, relationship?, table? }], in asking order. id is one
 *             of totalFilter, duplicateAggregate, wrongColumn, shiftedCurrentDate, ratioAsPercent, percentTwice,
 *             thousandsPlain, wrongRelationshipKey, unrelatedTable; evidence: the exact piece of the measure's DAX
 *             ('' for a relationship or a table, whose own fields name the evidence).
 *   CF: the DAX reader the questions use (lex: tokens with their place; calls: each call's name and arguments; args,
 *     close, strip, rootCall, piece, same, reference, words), exported once for the MCP's like-for-like check (0.3.3 IX2).
 *   Never a finding and never in the score: the engine reads structure and DAX, not the numbers, so it can only ask.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const lc = (s) => String(s == null ? '' : s).toLowerCase();

  // Each question names its object and its evidence: an exact piece of the measure's DAX, or a relationship's own
  // columns. A small lexical reader, not a DAX evaluator.
  const NUM = /(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y, WORD = /[\p{L}_][\p{L}\p{N}_.]*/uy;
  const CF = {
    // tokens with their start and end in the source, so a piece of DAX is quoted exactly as written
    lex(src) {
      const s = String(src || ''), ts = [];
      let i = 0;
      while (i < s.length) {
        if (/\s/u.test(s[i])) { i++; continue; }
        if (s.startsWith('//', i) || s.startsWith('--', i)) { const j = s.indexOf('\n', i); i = j < 0 ? s.length : j; continue; }
        if (s.startsWith('/*', i)) { const j = s.indexOf('*/', i + 2); i = j < 0 ? s.length : j + 2; continue; }
        const start = i, c = s[i];
        if (c === '"' || c === "'" || c === '[') {
          const end = c === '[' ? ']' : c;
          let value = '';
          i++;
          while (i < s.length) { if (s[i] === end) { if (s[i + 1] === end) { value += end; i += 2; continue; } i++; break; } value += s[i++]; }
          ts.push({ kind: c === '"' ? 'string' : c === '[' ? 'ref' : 'table', value, start, end: i });
          continue;
        }
        NUM.lastIndex = i;
        let m = NUM.exec(s);
        if (m) { i += m[0].length; ts.push({ kind: 'number', value: m[0], start, end: i }); continue; }
        WORD.lastIndex = i;
        m = WORD.exec(s);
        if (m) { i += m[0].length; ts.push({ kind: 'word', value: m[0], start, end: i }); continue; }
        const op = ['<>', '<=', '>=', '==', '&&', '||'].find((x) => s.startsWith(x, i)) || c;
        i += op.length;
        ts.push({ kind: 'op', value: op, start, end: i });
      }
      return ts;
    },
    close(ts, i) {
      const open = ts[i] && ts[i].value, target = { '(': ')', '{': '}' }[open];
      if (!target) return -1;
      for (let j = i + 1, d = 1; j < ts.length; j++) { if (ts[j].value === open) d++; if (ts[j].value === target && !--d) return j; }
      return -1;
    },
    args(ts, open, end) {
      if (end === undefined) end = CF.close(ts, open);
      if (end < 0) return [];
      const out = [];
      let start = open + 1;
      for (let i = start, d = 0; i < end; i++) {
        if (ts[i].value === '(' || ts[i].value === '{') d++;
        if (ts[i].value === ')' || ts[i].value === '}') d--;
        if (ts[i].value === ',' && !d) { out.push(ts.slice(start, i)); start = i + 1; }
      }
      if (start < end) out.push(ts.slice(start, end));
      return out;
    },
    calls(ts, name) {
      const out = [];
      for (let i = 0; i < ts.length - 1; i++) {
        if (ts[i].kind !== 'word' || ts[i + 1].value !== '(' || (name && ts[i].value.toUpperCase() !== name)) continue;
        const end = CF.close(ts, i + 1);
        if (end >= 0) out.push({ name: ts[i].value.toUpperCase(), start: i, end, tokens: ts.slice(i, end + 1), args: CF.args(ts, i + 1, end) });
      }
      return out;
    },
    strip(ts) { while (ts.length && ts[0].value === '(' && CF.close(ts, 0) === ts.length - 1) ts = ts.slice(1, -1); return ts; },
    rootCall(ts) { ts = CF.strip(ts); return CF.calls(ts).find((c) => c.start === 0 && c.end === ts.length - 1) || null; },
    piece(s, ts) { return ts.length ? s.slice(ts[0].start, ts[ts.length - 1].end) : ''; },
    same(a, b) { const k = (ts) => ts.map((t) => t.kind + ':' + (t.kind === 'string' ? t.value : lc(t.value))).join('|'); return k(a) === k(b); },
    reference(ts) {
      ts = CF.strip(ts);
      if (ts.length === 2 && (ts[0].kind === 'word' || ts[0].kind === 'table') && ts[1].kind === 'ref') return { table: ts[0].value, column: ts[1].value };
      return null;
    },
    words(s) { return String(s).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean); }
  };
  const CONCEPTS = { deaths: ['death', 'deaths', 'fatalities'], cases: ['case', 'cases', 'infections'], revenue: ['revenue'], cost: ['cost', 'costs', 'expense', 'expenses'],
    quantity: ['quantity', 'quantities', 'qty', 'units'], price: ['price', 'prices'] };
  const CONCEPT_AR = { deaths: 'الوفيات', cases: 'الحالات', revenue: 'الإيرادات', cost: 'التكاليف', quantity: 'الكمية', price: 'السعر' };
  // B-147: a percent format (a % outside quotes and not escaped: 0.0% multiplies by 100; 0.0"%" and 0.0\% only show the sign)
  const percentFormat = (f) => /%/.test(String(f || '').replace(/"[^"]*"/g, '').replace(/\\./g, ''));
  // names of a ratio or a multiple (shown as 1.5x), and names that say a percentage
  const MULTIPLE = /\b(current|quick|acid[- ]test|cash|liquidity|debt|leverage|coverage|solvency|price[- ]to[- ]\w+|p\/e|ev\/\w+)\s+ratio\b|\b(asset|assets|inventory|stock|receivables?|payables?|capital|fixed asset)\s+turnover\b|\bdebt[- ]to[- ]\w+\b|\btimes interest earned\b|\binterest coverage\b|\b(earnings|revenue|ebitda)\s+multiple\b|\bmultiple\b/i;
  const PERCENTISH = /%|\b(pct|percent|percentage|rate|share|margin|yield|growth|return on)\b|نسبة مئوية/i;
  // an amount (a K or M display format makes sense) and a unit conversion (milliseconds to seconds, grams to kilograms)
  const AMOUNT = /\b(sales|revenue|revenues|amount|amounts|cost|costs|profit|profits|value|price|budget|spend|spending|income|expense|expenses|turnover|ebitda|cash|payroll|salary|salaries)\b|المبيعات|الإيرادات|التكلفة|الربح|القيمة|المبلغ/i;
  const UNIT = /\b(ms|sec|secs|second|seconds|minute|minutes|hour|hours|duration|time|bytes?|kb|mb|gb|tb|size|memory|meters?|metres?|km|grams?|kg|tons?|tonnes?|liters?|litres?|ml|mwh|kwh|watts?)\b|ms\b|ms\]/i;
  const SCALED = /(^|[^a-z])(k|m|mn|bn|thousands?|millions?|000s|in 000)([^a-z]|$)|بالآلاف|بالملايين/i;
  // the questions in three steps, each given the context { M, ctx, out } and adding to out in the old order (0.3.2 FN1D)
  function pleaseConfirm(M, ctx) {
    ctx = ctx || {};
    const out = [];
    const pc = { M, ctx, out };
    measureQuestions(pc);
    relationshipQuestions(pc);
    unrelatedQuestions(pc);
    return out;
  }

  // names written as one word, and the generic ids that are an entity's own (never a role-qualified key)
  const flat = (s) => CF.words(s).join('');
  const GENERIC = ['id', 'key', 'code', 'no', 'number', 'date', 'recordid', 'recordkey'];

  // each measure's questions: a total leaving out a category, an aggregate added twice, the wrong column, a shifted date,
  // a format that may not show what the measure means
  function measureQuestions(pc) {
    const { M, out } = pc;
    const column = (r) => { const t = r && M.tables.find((x) => lc(x.name) === lc(r.table)); return t ? t.columns.find((c) => lc(c.name) === lc(r.column)) || null : null; };
    const measures = [];
    M.tables.forEach((t) => t.measures.forEach((m) => measures.push({ m, ts: CF.lex(m.expr) })));
    const ask = (id, m, en, ar, ts) => out.push({ id, obj: `[${m.name}]`, message: { en, ar }, evidence: CF.piece(m.expr, ts) });
    const askFormat = (id, m, en, ar, ts) => out.push({ id, obj: `[${m.name}]`, message: { en, ar }, evidence: CF.piece(m.expr, ts), format: m.formatString });
    // "* 100" or "100 *" at any depth, outside a text: the piece as written
    const hundred = (ts) => { for (let i = 0; i < ts.length - 1; i++) {
      if (ts[i].value === '*' && ts[i + 1].kind === 'number' && Number(ts[i + 1].value) === 100) return [ts[i], ts[i + 1]];
      if (ts[i].kind === 'number' && Number(ts[i].value) === 100 && ts[i + 1].value === '*') return [ts[i], ts[i + 1]]; } return null; };
    // DIVIDE ( x, 1000 ) or x / 1000 (1,000,000 too) with the column x reads, the piece as written
    const thousands = (ts) => {
      const big = (t) => t && t.kind === 'number' && (Number(t.value) === 1000 || Number(t.value) === 1000000);
      const colOf = (xs) => xs.filter((t) => t.kind === 'ref').map((t) => t.value).join(' ');
      for (const c of CF.calls(ts, 'DIVIDE')) { const d = CF.strip(c.args[1] || []); if (d.length === 1 && big(d[0])) return { n: String(Number(d[0].value)), ts: c.tokens, column: colOf(c.args[0] || []) }; }
      for (let i = 1; i < ts.length - 1; i++) if (ts[i].value === '/' && big(ts[i + 1]) && !(ts[i + 2] && /^[*\/^]$/.test(ts[i + 2].value))) return { n: String(Number(ts[i + 1].value)), ts: [ts[i], ts[i + 1]], column: colOf(ts.slice(0, i)) };
      return null;
    };
    measures.forEach(({ m, ts }) => {
      // a total that leaves out one hard-coded category: CALCULATE(..., Table[Column] <> "value")
      if (/\b(total|overall|all)\b/i.test(m.name)) {
        CF.calls(ts, 'CALCULATE').forEach((c) => c.args.slice(1).forEach((a) => {
          const z = CF.strip(a), pos = z.findIndex((t) => t.value === '<>'), last = z[z.length - 1];
          if (pos < 0 || !last || last.kind !== 'string' || !last.value) return;
          if (column(CF.reference(z.slice(0, pos)))) ask('totalFilter', m, 'Should this total leave out a hard-coded category?', 'هل يجب أن يستبعد هذا الإجمالي فئة ثابتة في الصيغة؟', a);
        }));
      }
      // the same aggregate added to itself: SUM(x) + SUM(x)
      const aggs = CF.calls(ts).filter((c) => /^(SUM|COUNT|COUNTA|COUNTROWS|DISTINCTCOUNT)$/.test(c.name));
      aggs.forEach((left) => {
        const right = aggs.find((x) => x.start === left.end + 2);
        if (ts[left.end + 1] && ts[left.end + 1].value === '+' && right && CF.same(left.tokens, right.tokens))
          ask('duplicateAggregate', m, 'The same aggregate is added twice. Is the doubling intentional?', 'يُضاف التجميع نفسه مرتين. هل المضاعفة مقصودة؟', ts.slice(left.start, right.end + 1));
      });
      // the measure's name says one thing and its only aggregate reads another: Deaths = SUM(T[Cases])
      const root = CF.rootCall(ts);
      if (root && /^(SUM|AVERAGE|MIN|MAX)$/.test(root.name)) {
        const r = CF.reference(root.args[0] || []);
        const concept = (s) => { const w = new Set(CF.words(s)), hits = Object.keys(CONCEPTS).filter((k) => CONCEPTS[k].some((x) => w.has(x))); return hits.length === 1 ? hits[0] : null; };
        const a = concept(m.name), b = r && column(r) ? concept(r.column) : null;
        if (a && b && a !== b) ask('wrongColumn', m, `The name says ${a}, but the measure reads a ${b} column. Is it the right column?`, `يدل الاسم على ${CONCEPT_AR[a]}، لكن المقياس يقرأ عمود ${CONCEPT_AR[b]}. هل هذا هو العمود الصحيح؟`, root.tokens);
      }
      // a current or as-of value shifted by one day
      if (/\b(as of|latest|current)\b/i.test(m.name) && !/\b(previous|prior|yesterday|lag|last complete)\b/i.test(m.name)) {
        CF.calls(ts, 'DATEADD').forEach((c) => {
          const a = c.args;
          if (a.length === 3 && /^[+-]?1$/.test(a[1].map((t) => t.value).join('')) && a[2].map((t) => t.value).join('').toUpperCase() === 'DAY')
            ask('shiftedCurrentDate', m, 'This current or as-of value moves the dates by one day. Is the lag intentional?', 'تُزاح التواريخ في هذه القيمة الحالية بيوم واحد. هل هذا التأخير مقصود؟', c.tokens);
        });
        CF.calls(ts).filter((c) => /^(MAX|TODAY|NOW)$/.test(c.name)).forEach((c) => {
          if (c.name === 'MAX' && (column(CF.reference(c.args[0] || [])) || {}).dataType !== 'dateTime') return;
          if (ts[c.end + 1] && ts[c.end + 1].value === '-' && ts[c.end + 2] && ts[c.end + 2].value === '1')
            ask('shiftedCurrentDate', m, 'This current or as-of date subtracts one day. Is that the right boundary?', 'يطرح هذا التاريخ الحالي يومًا واحدًا. هل هذا هو الحد الصحيح؟', ts.slice(c.start, c.end + 3));
        });
      }
      // B-147 (0.3): a format that may not show what the measure means; the measure's own format string (m.format), a
      // dynamic format (fsExpr) never asked about
      if (m.formatString && !m.fsExpr) {
        const f = m.formatString, pct = percentFormat(f);
        // a ratio or a multiple (Current Ratio, Asset Turnover, Debt to Equity) shown as a percentage: 1.5 shows as 150%
        if (pct && MULTIPLE.test(m.name) && !PERCENTISH.test(m.name))
          askFormat('ratioAsPercent', m, 'Should this ratio be shown as a multiple (1.5x) rather than a percentage?', 'هل يجب أن تُعرض هذه النسبة كمضاعف (1.5x) بدلًا من نسبة مئوية؟', []);
        // a value already multiplied by 100 and formatted as a percentage, which multiplies by 100 again
        const times = pct ? hundred(ts) : null;
        if (times) askFormat('percentTwice', m, 'The measure already multiplies by 100, and its percentage format multiplies by 100 again. Is the value shown 100 times too large?', 'يضرب المقياس القيمة في 100، وتنسيق النسبة المئوية يضربها في 100 مرة أخرى. هل تظهر القيمة أكبر بمئة مرة؟', times);
        // an amount divided by 1,000 or 1,000,000 and shown as a plain number: a K or M display format may have been meant
        const by = !pct && !/[kKmM]|thousand|million|,["\s]*$|,\./.test(f.replace(/"[^"]*"/g, (q) => (/[kKmM]|thousand|million|mn|bn/i.test(q) ? 'K' : ''))) ? thousands(ts) : null;
        if (by && AMOUNT.test(m.name + ' ' + by.column) && !UNIT.test(m.name + ' ' + by.column) && !SCALED.test(m.name))
          askFormat('thousandsPlain', m, `The measure divides by ${by.n === '1000' ? '1,000' : '1,000,000'} and its format shows a plain number. Was a ${by.n === '1000' ? 'thousands (K)' : 'millions (M)'} display format meant?`,
            `يقسم المقياس على ${by.n === '1000' ? '1,000' : '1,000,000'} ويعرض تنسيقه رقمًا عاديًا. هل كان المقصود تنسيق عرض ${by.n === '1000' ? 'بالآلاف (K)' : 'بالملايين (M)'}؟`, by.ts);
      }
    });
  }

  // a relationship on another column while an unused column of the same table carries the key's own name and type
  function relationshipQuestions(pc) {
    const { M, out } = pc;
    const inRel = (t, c) => M.relationships.some((x) => (x.fromTable === t && x.fromColumn === c) || (x.toTable === t && x.toColumn === c));
    M.relationships.forEach((r) => {
      if (!r.active || r.fromCard !== 'many' || r.toCard !== 'one') return;
      const from = M.tables.find((t) => t.name === r.fromTable), to = M.tables.find((t) => t.name === r.toTable);
      const used = from && from.columns.find((c) => c.name === r.fromColumn), key = to && to.columns.find((c) => c.name === r.toColumn);
      if (!used || !key || used.dataType !== key.dataType || used.dataType === 'unknown' || flat(used.name) === flat(key.name)) return;
      // an entity's own generic id (Id, Key, Code, Date...) is not a role-qualified key another column could carry
      if (!/(id|key|code|no|number)$/i.test(flat(key.name)) || GENERIC.includes(flat(key.name))) return;
      const cands = from.columns.filter((c) => c.name !== used.name && c.dataType === key.dataType && flat(c.name) === flat(key.name) && !inRel(from.name, c.name));
      if (cands.length !== 1) return;
      out.push({ id: 'wrongRelationshipKey', obj: `${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]`,
        message: { en: `${from.name}[${cands[0].name}] has the key's name and type but is not used. Is the relationship on the right column?`,
          ar: `العمود ${from.name}[${cands[0].name}] يحمل اسم المفتاح ونوعه لكنه غير مستخدم. هل العلاقة على العمود الصحيح؟` },
        evidence: '', relationship: { fromTable: r.fromTable, fromColumn: r.fromColumn, toTable: r.toTable, toColumn: r.toColumn, candidateColumn: cands[0].name } });
    });
  }

  function unrelatedQuestions(pc) {
    const { M, ctx, out } = pc;
    // B-143: a date table or a fact table that no relationship touches (the owner's rc.21 test: Calendar and Sales with
    // no relationship, and nothing said so). Tables that are meant to stand alone are never asked about: calculation
    // groups, field parameters, what-if and other DAX helper tables, measure tables, hidden tables, one-column tables
    // (pickers, lists), and a date table that DAX reads directly (a disconnected date slicer: MAX, SELECTEDVALUE, TREATAS)
    const regular = (ctx.userTables || M.tables).filter((t) => {
      const cols = t.columns.filter((c) => c.kind !== 'rowNumber');
      if (t.calcGroup || t.hidden || cols.length < 2 || (t.measures.length && cols.every((c) => c.hidden))) return false;
      if (cols.some((c) => c.relatedColumnDetails || /ParameterMetadata/.test(JSON.stringify(c.extendedProperties || '')))) return false;
      return !(t.isCalcTable && /\b(GENERATESERIES|NAMEOF|DATATABLE|SELECTCOLUMNS|ROW|UNION)\s*\(/i.test(t.calcExpr));
    });
    const related = (t) => M.relationships.some((r) => lc(r.fromTable) === lc(t.name) || lc(r.toTable) === lc(t.name));
    if (regular.length < 2) return;
    // where DAX reads a table, outside time-intelligence calls (those filter nothing through a table no relationship touches)
    const TI = /^(SAMEPERIODLASTYEAR|DATEADD|DATESYTD|DATESQTD|DATESMTD|TOTALYTD|TOTALQTD|TOTALMTD|PARALLELPERIOD|PREVIOUSDAY|PREVIOUSMONTH|PREVIOUSQUARTER|PREVIOUSYEAR|NEXTDAY|NEXTMONTH|NEXTQUARTER|NEXTYEAR|DATESINPERIOD|DATESBETWEEN|OPENINGBALANCEYEAR|CLOSINGBALANCEYEAR|STARTOFYEAR|ENDOFYEAR|STARTOFMONTH|ENDOFMONTH|STARTOFQUARTER|ENDOFQUARTER|FIRSTDATE|LASTDATE)$/;
    const daxOf = [];
    M.tables.forEach((t) => {
      t.measures.forEach((m) => daxOf.push(m.expr));
      t.columns.forEach((c) => { if (c.expr) daxOf.push(c.expr); });
      if (t.isCalcTable) daxOf.push(t.calcExpr);
      if (t.calcGroup) t.calcGroup.items.forEach((ci) => daxOf.push(ci.expr));
    });
    const readOutsideTI = (t) => daxOf.some((e) => {
      const ts = CF.lex(e), ti = CF.calls(ts).filter((c) => TI.test(c.name));
      return ts.some((x, i) => (x.kind === 'table' || x.kind === 'word') && lc(x.value) === lc(t.name) && (!ts[i + 1] || ts[i + 1].kind === 'ref' || ts[i + 1].value !== '(') &&
        !ti.some((c) => i > c.start && i < c.end));
    });
    const keyName = (n) => /(id|key|code|no|number)$/.test(flat(n)) && !GENERIC.includes(flat(n));
    regular.filter((t) => !related(t)).forEach((t) => {
      const cols = t.columns.filter((c) => c.kind !== 'rowNumber');
      const dateLike = cols.some((c) => c.dataType === 'dateTime') && (lc(t.dataCategory) === 'time' || /^(dim[_ ]?)?(calendar|dates?|date\s*table|(ال)?تقويم)(?![\p{L}\p{N}_])/iu.test(t.name.trim()));
      if (dateLike) {
        if (!readOutsideTI(t)) out.push({ id: 'unrelatedTable', obj: t.name, evidence: '', table: { name: t.name, looksLike: 'date' },
          message: { en: 'This date table has no relationship, so it filters nothing. Should it be related to the other tables?', ar: 'لا يرتبط جدول التاريخ هذا بأي علاقة، فلا يصفّي شيئًا. هل يجب أن يرتبط بالجداول الأخرى؟' } });
        return;
      }
      // a fact table: a number column, and a key column whose name and type a dimension has (Sales[CustomerKey] and
      // Customer[CustomerKey]); a role-qualified key, never a generic Id or Code. The other table must be a dimension (the
      // key is its own: marked as the key, the one side of a relationship, or named after a table without numbers of its
      // own, as CustomerKey is Customer's): two logs sharing an operation id, or a fact of stages and its comparer, are not
      // meant to be related. A fact whose key DAX reads (TREATAS, FILTER on the key) is linked in DAX on purpose
      const values = cols.filter((c) => /^(double|decimal|int64)$/.test(c.dataType) && !keyName(c.name));
      if (cols.length < 3 || !values.length) return;
      const namedAfter = (u, c) => { const base = flat(c.name).replace(/(id|key|code|no|number)$/, ''), n = flat(u.name).replace(/^dim/, '');
        return !!base && (n === base || n === base + 's' || n === base + 'es'); };
      const numbers = (u) => u.columns.some((c) => c.kind !== 'rowNumber' && /^(double|decimal|int64)$/.test(c.dataType) && !keyName(c.name));
      const ownKey = (u, c) => c.isKey || M.relationships.some((r) => lc(r.toTable) === lc(u.name) && lc(r.toColumn) === lc(c.name) && r.toCard === 'one') || (namedAfter(u, c) && !numbers(u));
      const keyRead = (k) => daxOf.some((e) => { const ts = CF.lex(e); return ts.some((x, i) => (x.kind === 'table' || x.kind === 'word') && lc(x.value) === lc(t.name) && ts[i + 1] && ts[i + 1].kind === 'ref' && lc(ts[i + 1].value) === lc(k.name)); });
      const keys = cols.filter((c) => /^(int64|string|unknown)$/.test(c.dataType) && keyName(c.name) && !keyRead(c));
      for (const k of keys) {
        const other = regular.find((u) => u !== t && u.columns.some((c) => flat(c.name) === flat(k.name) && (c.dataType === k.dataType || c.dataType === 'unknown' || k.dataType === 'unknown') && ownKey(u, c)));
        if (!other) continue;
        const oc = other.columns.find((c) => flat(c.name) === flat(k.name) && ownKey(other, c));
        out.push({ id: 'unrelatedTable', obj: t.name, evidence: '', table: { name: t.name, looksLike: 'fact', column: k.name, otherTable: other.name, otherColumn: oc.name },
          message: { en: `${t.name}[${k.name}] and ${other.name}[${oc.name}] share a key, but no relationship links the tables. Should they be related?`,
            ar: `يشترك ${t.name}[${k.name}] و ${other.name}[${oc.name}] في مفتاح، لكن لا توجد علاقة بين الجدولين. هل يجب أن يرتبطا؟` } });
        return;
      }
    });
  }

  // (0.3.3 IX2) CF, the one reader of a DAX text's tokens and calls, exported for like-for-like.mjs (D-1104-12: one
  // reader, never a copy); frozen, so no caller can change it for the others
  const api = { pleaseConfirm, CF: Object.freeze(CF) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAHealthConfirm = api;
})(typeof self !== 'undefined' ? self : this);
