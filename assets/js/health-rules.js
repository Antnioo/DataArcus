/*
 * DataArcus Power BI Model Health Check: the rules (0.3.2 SP27, out of model-health-engine.js).
 * Pure JavaScript, no DOM, no state: the same input always gives the same findings, and the input is never changed.
 *
 * Interface (one input, one output):
 *   RULES, BPA_URL: the catalogue (health-texts.js's own objects: each rule's category, severity, texts and source).
 *   runRules(input)
 *     Input:  { M: the normalised model, IX: its frozen index (both model-index.js), report: analyzeReport's reading
 *               or null, used: Set of the nodes the report, relationships and roles reach, vis: the visuals using each
 *               measure and column, broken: the report's references the model lacks, styleByMeasure: daxRefs's style
 *               per measure, userTables, autoDateTables, allMeasures: lists of M, mQueries: [{ name, expr, isExpr }],
 *               chainDepths: allMeasures[i]'s measure-chain depth }
 *     Output: { findings: [{ id, items: [{ obj, detail?, variant? }] }] in checking order, skipped: [{ id,
 *               reason: 'unknownType', items: [{ obj }] }] (a check left out for a column of unknown type) }
 *   No score here: the engine (model-health-engine.js) weighs the findings.
 * Requires dax-reference-parser.js (tokens), model-index.js (K, the node keys) and health-texts.js (RULES and BPA_URL,
 * re-exported: the same objects), loaded before this file.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const P = node ? require('./dax-reference-parser.js') : root.DADaxParser;
  const X = node ? require('./model-index.js') : root.DAModelIndex;
  const T = node ? require('./health-texts.js') : root.DAHealthTexts;
  const { tokenizeDax, daxCode } = P;
  const { K } = X;
  const lc = (s) => String(s == null ? '' : s).toLowerCase(), uniq = (a) => Array.from(new Set(a));

  // ---------- the rule catalogue: health-texts.js (data only) ----------
  const { RULES, BPA_URL } = T;

  // ---------- the rules: the model in, findings out ----------
  // (0.3.2 FN1A) runRules calls one named step per rule group, in the checking order; each step's code is the code
  // it was inside runRules, moved. x: runRules's input; out: the collector; sh: the DAX shape helpers.
  function runRules(input) {
    const out = collector(), sh = daxShape(input.IX);
    relationshipRules(input, out);
    autoDateRules(input, out);
    unusedRules(input, out);
    columnRules(input, out, sh);
    dateTableRules(input, out);
    measureRules(input, out, sh);
    duplicateRules(input, out, sh);
    namingRules(input, out);
    powerQueryRules(input, out);
    return { findings: out.findings, skipped: out.skipped };
  }

  // the findings and the skipped checks, each in the order it is added
  function collector() {
    const findings = [];
    const add = (id, items) => { if (items && items.length) findings.push({ id, items }); };
    // A check that needs a column's type is skipped for a column whose type is unknown (dataType "unknown": a TMDL
    // project gives no type for columns of DAX tables), and listed, so a missing type never becomes a wrong finding.
    const skipped = [];
    const skip = (id, obj) => {
      let s = skipped.find((x) => x.id === id);
      if (!s) skipped.push(s = { id, reason: 'unknownType', items: [] });
      if (!s.items.some((x) => x.obj === obj)) s.items.push({ obj });
    };
    return { findings, skipped, add, skip };
  }
  const untyped = (c) => c.dataType === 'unknown';

  function relationshipRules(x, out) {
    const { M, IX, report: rep, broken } = x, { add, skip } = out;
    // ---- relationships ----
    // Microsoft's exceptions (Bi-directional relationship guidance): a one-to-one relationship is always both ways (it
    // can't be set otherwise), never a finding; a many-to-many dimension bridge needs one both-way relationship. A
    // bridge here: the many side of two or more one-to-many relationships, no measures, and only key columns (Microsoft's
    // "factless" bridge). A fact table has other columns, so it keeps BIDI (Microsoft: CROSSFILTER in the measure).
    const oneToMany = (r) => r.fromCard === 'many' && r.toCard === 'one';
    const isBridge = (name) => {
      const t = IX.tables.get(lc(name)), rels = M.relationships.filter((r) => oneToMany(r) && lc(r.fromTable) === lc(name));
      if (!t || t.measures.length || rels.length < 2) return false;
      const keys = new Set(rels.map((r) => lc(r.fromColumn)));
      return t.columns.filter((c) => c.kind !== 'rowNumber').every((c) => keys.has(lc(c.name)));
    };
    // an inactive relationship filters nothing until USERELATIONSHIP turns it on (INACTIVE_UNUSED reports it if nothing does)
    const bidi = M.relationships.filter((r) => r.cross === 'bothDirections' && r.active && !(r.fromCard === 'one' && r.toCard === 'one'));
    const bridgeBidi = bidi.filter((r) => oneToMany(r) && isBridge(r.fromTable));
    const relObj = (r) => ({ obj: `${r.fromTable}[${r.fromColumn}] ↔ ${r.toTable}[${r.toColumn}]` });
    add('BIDI', bidi.filter((r) => !bridgeBidi.includes(r)).map(relObj));
    add('BIDI_BRIDGE', bridgeBidi.map(relObj));
    add('M2M', M.relationships.filter((r) => r.fromCard === 'many' && r.toCard === 'many').map((r) => ({ obj: `${r.fromTable}[${r.fromColumn}] ↔ ${r.toTable}[${r.toColumn}]` })));
    const daxSources = [];
    M.tables.forEach((t) => {
      t.measures.forEach((ms) => daxSources.push({ where: '[' + ms.name + ']', expr: [ms.expr, ms.fsExpr, ms.detailRows, ms.kpi].join('\n') }));
      t.columns.forEach((c) => { if (c.expr) daxSources.push({ where: t.name + '[' + c.name + ']', expr: c.expr }); });
      if (t.calcExpr) daxSources.push({ where: t.name, expr: t.calcExpr });
      if (t.calcGroup) t.calcGroup.items.forEach((ci) => daxSources.push({ where: t.name + ' / ' + ci.name, expr: ci.expr + '\n' + ci.fsExpr }));
    });
    M.roles.forEach((ro) => ro.permissions.forEach((p) => daxSources.push({ where: 'Role ' + ro.name, expr: p.filter })));
    M.functions.forEach((f) => daxSources.push({ where: f.name, expr: f.expr }));
    if (rep) rep.ext.forEach((x) => daxSources.push({ where: '[' + x.name + ']', expr: x.expr }));
    const useRel = []; // { a: 'table|col', b: 'table|col', where }
    daxSources.forEach((src) => {
      if (!/USERELATIONSHIP/i.test(src.expr || '')) return;
      const tk = tokenizeDax(src.expr);
      for (let i = 0; i < tk.length; i++) {
        if (!(tk[i].t === 'id' && tk[i].v.toUpperCase() === 'USERELATIONSHIP' && tk[i + 1] && tk[i + 1].v === '(')) continue;
        const cols = [];
        for (let j = i + 2; j < tk.length && cols.length < 2; j++) {
          if (tk[j].t === 'op' && tk[j].v === ')') break;
          if ((tk[j].t === 'tbl' || tk[j].t === 'id') && tk[j + 1] && tk[j + 1].t === 'br') { cols.push(lc(tk[j].v) + '|' + lc(tk[j + 1].v)); j++; }
        }
        if (cols.length === 2) useRel.push({ a: cols[0], b: cols[1], where: src.where });
      }
    });
    const relKey = (r) => [lc(r.fromTable) + '|' + lc(r.fromColumn), lc(r.toTable) + '|' + lc(r.toColumn)];
    const relUsed = (r) => { const [f, t2] = relKey(r); return useRel.filter((u) => (u.a === f && u.b === t2) || (u.a === t2 && u.b === f)); };
    add('INACTIVE_UNUSED', M.relationships.filter((r) => !r.active && !relUsed(r).length).map((r) => ({ obj: `${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]` })));
    const activeUse = [];
    M.relationships.filter((r) => r.active).forEach((r) => { const u = relUsed(r); if (u.length) activeUse.push({ obj: `${r.fromTable}[${r.fromColumn}] → ${r.toTable}[${r.toColumn}]`, detail: uniq(u.map((x) => x.where)).slice(0, 3).join(', ') }); });
    add('USEREL_ACTIVE', activeUse);
    if (broken.size) add('BROKEN_REF', Array.from(broken.values()).sort((a, b) => b.n - a.n).map((b) => ({ obj: b.obj, detail: Array.from(b.pages).join('; ') })));
    const strKeys = [];
    M.relationships.forEach((r) => {
      const c = IX.columns.get(lc(r.toTable) + '|' + lc(r.toColumn));
      if (c && untyped(c.col)) skip('STRING_KEYS', `${r.toTable}[${r.toColumn}]`);
      if (c && c.col.dataType === 'string' && !strKeys.some((x) => x.obj === `${r.toTable}[${r.toColumn}]`)) strKeys.push({ obj: `${r.toTable}[${r.toColumn}]` });
    });
    add('STRING_KEYS', strKeys);
  }

  function autoDateRules(x, out) {
    const { M, autoDateTables } = x, { add } = out;
    // ---- auto date/time ----
    if (autoDateTables.length) add('AUTODATE', autoDateTables.filter((t) => /^LocalDateTable_/.test(t.name)).map((t) => {
      const owner = M.tables.find((x) => x.columns.some((c) => c.relatedColumnDetails || (c.extendedProperties && JSON.stringify(c.extendedProperties).includes(t.name))));
      return { obj: t.name, detail: owner ? owner.name : '' };
    }));
  }

  function unusedRules(x, out) {
    const { report: rep, used, userTables, allMeasures } = x, { add } = out;
    // ---- unused (only with a report) ----
    if (rep) {
      const unusedCols = [];
      userTables.forEach((t) => {
        if (t.calcGroup) return;
        t.columns.forEach((c) => {
          if (c.kind === 'rowNumber') return;
          if (!used.has(K.c(t.name, c.name))) unusedCols.push({ obj: `${t.name}[${c.name}]`, detail: t.isCalcTable ? 'DAX table: edit its DAX' : c.kind === 'calculated' ? 'calculated' : (c.hidden ? 'hidden' : '') });
        });
      });
      add('UNUSED_COL', unusedCols);
      add('UNUSED_MEASURE', allMeasures.filter((ms) => !used.has(K.m(ms.name))).map((ms) => ({ obj: `[${ms.name}]`, detail: ms.displayFolder })));
      add('UNUSED_TABLE', userTables.filter((t) => !used.has(K.t(t.name)) && !t.columns.some((c) => used.has(K.c(t.name, c.name))) && !t.measures.some((ms) => used.has(K.m(ms.name)))).map((t) => ({ obj: t.name })));
    }
  }

  // ---- the DAX shape helpers, over the model's index ----
  function daxShape(IX) {
    const isTbl = (tk) => tk && (tk.t === 'tbl' || tk.t === 'id') && IX.tables.has(lc(tk.v));
    const isOp = (x, v) => x && x.t === 'op' && x.v === v;
    const call = (tk, i) => tk[i] && tk[i].t === 'id' && isOp(tk[i + 1], '(');
    const closeOf = (tk, i) => { for (let d = 0, j = i; j < tk.length; j++) { if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')') && !--d) return j; } return tk.length; };
    const argsOf = (tk, i) => { // the arguments of the call whose "(" is at i
      const out = [[]], end = closeOf(tk, i);
      for (let j = i + 1, d = 0; j < end; j++) {
        if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
        if (!d && isOp(tk[j], ',')) out.push([]); else out[out.length - 1].push(tk[j]);
      }
      return out;
    };
    // a measure reference: [Name] that is a measure and not a column of the qualifying (or home) table
    const measureRef = (tk, j, home) => {
      const x = tk[j], p = tk[j - 1];
      if (x.t !== 'br' || !IX.measures.has(lc(x.v))) return false;
      if (isTbl(p)) return !IX.columns.has(lc(p.v) + '|' + lc(x.v));
      return !(home && IX.columns.has(lc(home) + '|' + lc(x.v)));
    };
    return { isTbl, isOp, call, closeOf, argsOf, measureRef };
  }
  function textCheck(IX, sh) {
    const { isTbl, isOp, call, closeOf, argsOf, measureRef } = sh;
    // Does a measure return text, so a number format can't apply? From the DAX: the result (after VAR ... RETURN) is a
    // string, an "&", CONCATENATE(X), FORMAT, UNICHAR, SELECTEDVALUE / MAX / MIN of a text column, a variable holding
    // one of these, an IF / SWITCH whose results are all text, CALCULATE(TABLE) of one of these, an EXTERNALMEASURE
    // declared STRING (a composite model's remote measure), or a measure that returns text. Anything unclear is not
    // text (the finding stays).
    const isBlankCall = (r) => r.length === 3 && r[0].t === 'id' && /^BLANK$/i.test(r[0].v) && isOp(r[1], '(') && isOp(r[2], ')');
    const isText = (tk, vars, n) => {
      if (n > 12 || !tk.length) return false;
      while (tk.length > 2 && isOp(tk[0], '(') && closeOf(tk, 0) === tk.length - 1) tk = tk.slice(1, -1);
      if (tk[0].t === 'id' && /^VAR$/i.test(tk[0].v)) {
        const v2 = Object.assign({}, vars);
        for (let j = 0, d = 0, name = null, start = 0; j < tk.length; j++) {
          if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
          if (d || tk[j].t !== 'id' || !/^(VAR|RETURN)$/i.test(tk[j].v)) continue;
          if (name != null) v2[name] = tk.slice(start, j);
          if (/^RETURN$/i.test(tk[j].v)) return isText(tk.slice(j + 1), v2, n + 1);
          name = tk[j + 1] ? lc(tk[j + 1].v) : ''; start = j + 3; j += 2;
        }
        return false;
      }
      for (let j = 0, d = 0; j < tk.length; j++) {
        if (isOp(tk[j], '(')) d++; else if (isOp(tk[j], ')')) d--;
        else if (!d && isOp(tk[j], '&') && !isOp(tk[j + 1], '&') && !isOp(tk[j - 1], '&')) return true; // "&", not "&&"
      }
      if (tk.length === 1 && measureRef(tk, 0, null)) return isText(tokenizeDax(IX.measures.get(lc(tk[0].v)).m.expr), {}, n + 1);
      if (tk.length === 2 && isTbl(tk[0]) && measureRef(tk, 1, null)) return isText(tokenizeDax(IX.measures.get(lc(tk[1].v)).m.expr), {}, n + 1);
      if (tk.length === 1) return tk[0].t === 'str' || (tk[0].t === 'id' && !!vars[lc(tk[0].v)] && isText(vars[lc(tk[0].v)], vars, n + 1));
      if (!call(tk, 0) || closeOf(tk, 1) !== tk.length - 1) return false;
      const fn = tk[0].v.toUpperCase(), args = argsOf(tk, 1);
      const allText = (res) => { res = res.filter((r) => !isBlankCall(r)); return res.length > 0 && res.every((r) => isText(r, vars, n + 1)); };
      if (/^(CONCATENATE|CONCATENATEX|FORMAT|UNICHAR)$/.test(fn)) return true;
      if (fn === 'EXTERNALMEASURE') return !!args[1] && args[1].length === 1 && args[1][0].t === 'id' && /^STRING$/i.test(args[1][0].v);
      if (/^CALCULATE(TABLE)?$/.test(fn)) return isText(args[0], vars, n + 1); // its value is its expression's
      // FIRSTNONBLANK / LASTNONBLANK return the column's value; their VALUE forms return the expression's; MINX / MAXX
      // (over ALLSELECTED, VALUES or a table) return their expression's
      const textCol = (a) => { const c = a && a.length === 2 && isTbl(a[0]) && a[1].t === 'br' && IX.columns.get(lc(a[0].v) + '|' + lc(a[1].v)); return !!c && c.col.dataType === 'string'; };
      if (/^(FIRSTNONBLANK|LASTNONBLANK)$/.test(fn)) return args.length === 2 && textCol(args[0]);
      if (/^(FIRSTNONBLANKVALUE|LASTNONBLANKVALUE|MINX|MAXX)$/.test(fn)) return args.length === 2 && (textCol(args[1]) || isText(args[1], vars, n + 1));
      if (/^(SELECTEDVALUE|MAX|MIN)$/.test(fn)) {
        const a = args[0], c = a && a.length === 2 && isTbl(a[0]) && a[1].t === 'br' && IX.columns.get(lc(a[0].v) + '|' + lc(a[1].v));
        return !!c && c.col.dataType === 'string' && args.length <= (fn === 'SELECTEDVALUE' ? 2 : 1);
      }
      if (fn === 'IF') return args.length >= 2 && allText(args.slice(1));
      if (fn === 'SWITCH') { const rest = args.slice(1), res = []; for (let k = 1; k < rest.length; k += 2) res.push(rest[k]); if (rest.length % 2) res.push(rest[rest.length - 1]); return allText(res); }
      return false;
    };
    const returnsText = (expr) => isText(tokenizeDax(expr), {}, 0);
    return returnsText;
  }
  function daxOnlyColumnOf(sh) {
    const { isTbl, call, measureRef } = sh;
    // A calculated column Microsoft says belongs in DAX ("when the formula involves evaluating measures, or it requires
    // specific modeling functionality only supported in DAX functions"): parent-child paths, a measure, context
    // transition, RANKX, EARLIER, or an aggregate over another table. RELATED alone is a lookup a merge can do.
    const AGG_FN = /^(SUMX|AVERAGEX|COUNTX|COUNTAX|MINX|MAXX|PRODUCTX|CONCATENATEX|COUNTROWS|FILTER|SUMMARIZE|ADDCOLUMNS|TOPN|SUM|AVERAGE|MIN|MAX|COUNT|COUNTA|DISTINCTCOUNT|COUNTBLANK)$/i;
    const daxOnlyColumn = (expr, home) => {
      const tk = tokenizeDax(expr);
      for (let i = 0; i < tk.length; i++) {
        if (call(tk, i) && /^(PATH|PATHITEM|PATHITEMREVERSE|PATHLENGTH|PATHCONTAINS|CALCULATE|CALCULATETABLE|RANKX|EARLIER|EARLIEST|RELATEDTABLE)$/i.test(tk[i].v)) return true;
        if (call(tk, i) && AGG_FN.test(tk[i].v)) {
          let a = tk[i + 2];
          if (call(tk, i + 2) && /^(ALL|ALLNOBLANKROW|VALUES|DISTINCT)$/i.test(a.v)) a = tk[i + 4];
          if (isTbl(a) && lc(a.v) !== lc(home)) return true;
        }
        if (measureRef(tk, i, home)) return true;
      }
      return false;
    };
    return daxOnlyColumn;
  }

  // ---- columns ----
  // The month and day names the sort rule looks for (one place, here). English, Gregorian or Hijri: "Month Name", "Hijri Month
  // Name", "Day Name", "MMM", "Month Year"; Arabic: «الشهر», «اليوم», «اسم الشهر», «اسم اليوم».
  const MONTH_NAME_LIKE = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$|^(اسم\s*)?(الشهر|اليوم)$/i;
  // (0.3.3 HC2, B-425) a Hijri month name written in Arabic: «الشهر الهجري», «اسم الشهر الهجري», «شهر هجري», the article and the
  // spacing optional. Tested on the name with the Arabic short vowels and the tatweel taken off (the same marks time-names.js drops).
  // The whole name only: «الهجري», «سنة هجرية», «رقم الشهر الهجري» are not month names.
  const AR_MARKS = /[ً-ٰٟـ]/g;
  const HIJRI_MONTH_AR = /^(اسم\s*)?(ال)?شهر[\s_]*(ال)?هجري$/;
  function columnRules(x, out, sh) {
    const { M, report: rep, used, userTables } = x, { add, skip } = out, daxOnlyColumn = daxOnlyColumnOf(sh);
    const doubles = [], calcCols = [], fkVisible = [], sumKeys = [], monthSort = [];
    const manySide = new Set(M.relationships.filter((r) => r.fromCard === 'many' && r.toCard === 'one').map((r) => lc(r.fromTable) + '|' + lc(r.fromColumn)));
    const isUnused = (t, c) => rep && !used.has(K.c(t.name, c.name));
    userTables.forEach((t) => {
      const importFromSource = !t.isCalcTable && t.mode !== 'directQuery';
      t.columns.forEach((c) => {
        if (c.kind === 'rowNumber') return;
        // map coordinates are left alone: Microsoft says "Latitude and Longitude fields must be in Decimal Number format"
        // (Decimal number is the double type; https://learn.microsoft.com/power-bi/visuals/power-bi-map-tips-and-tricks)
        const coordinate = /^(latitude|longitude)$/i.test(c.dataCategory);
        if (c.dataType === 'double' && !c.hidden && !coordinate) doubles.push({ obj: `${t.name}[${c.name}]` });
        if (untyped(c) && !c.hidden) skip('DOUBLE', `${t.name}[${c.name}]`);
        if (c.kind === 'calculated' && importFromSource && !daxOnlyColumn(c.expr, t.name)) calcCols.push({ obj: `${t.name}[${c.name}]`, detail: /RELATED|LOOKUPVALUE|CALCULATE|SUMX|COUNTROWS|FILTER/i.test(c.expr) ? 'uses model data' : '' });
        if (isUnused(t, c)) return; // already reported as unused, do not count it twice
        if (!c.hidden && manySide.has(lc(t.name) + '|' + lc(c.name))) fkVisible.push({ obj: `${t.name}[${c.name}]` });
        const cn = c.name.trim();
        // (a key written in CamelCase: a lower-case letter directly followed by ID, Id, Key, Code or No at the end of the
        // name, as in OrderID, CustomerKey, ProductCode, InvoiceNo. The capital matters: Paid, Monkey, Barcode, Casino
        // and Turkey are not keys)
        const keyLike = !c.hidden && (c.summarizeBy === 'default' || c.summarizeBy === 'sum') && (/[a-z](ID|Id|Key|Code|No)$/.test(cn) || /((^|[\s_])(id|key|code|no|index)$|_id$|^(year|month|week|day|quarter)(\s*(no|num|number))?$|^(fiscal\s*)?year$|(month|week|day|quarter)\s*(no|num|number|of year)$|sort\s*(order|key)?$)/i.test(cn));
        if (keyLike && /^(int64|double|decimal)$/.test(c.dataType)) sumKeys.push({ obj: `${t.name}[${c.name}]` });
        if (keyLike && untyped(c)) skip('SUMMARIZE_KEYS', `${t.name}[${c.name}]`);
        const monthLike = MONTH_NAME_LIKE.test(cn) || HIJRI_MONTH_AR.test(cn.replace(AR_MARKS, '')) || (c.kind === 'calculated' && /FORMAT\s*\([^)]*"\s*(mmm|mmmm|ddd|dddd)\s*"/i.test(c.expr));
        if (monthLike && c.dataType === 'string' && !c.sortBy) monthSort.push({ obj: `${t.name}[${c.name}]` });
        if (monthLike && untyped(c) && !c.sortBy) skip('MONTH_SORT', `${t.name}[${c.name}]`);
      });
    });
    add('DOUBLE', doubles); add('CALC_COLS', calcCols); add('FK_VISIBLE', fkVisible); add('SUMMARIZE_KEYS', sumKeys); add('MONTH_SORT', monthSort);
  }

  function dateTableRules(x, out) {
    const { M, userTables } = x, { add, skip } = out;
    // ---- date table ----
    const dateParts = (t) => t.columns.filter((c) => /^(year|month|month name|month number|quarter|weekday|week|day|fiscal year)/i.test(c.name.trim())).length;
    const relDateTargets = new Set(M.relationships.map((r) => lc(r.toTable) + '|' + lc(r.toColumn)));
    // a calendar: a date column (isDate) and a calendar name, or date parts and a relationship to its date column
    const calendarBy = (isDate) => (t) => t.columns.some(isDate) && (
      // not \b: in JavaScript it only knows ASCII letters, so it never matches after an Arabic word
      /^(dim[_ ]?)?(calendar|dates?|date\s*table|(ال)?تقويم)(?![\p{L}\p{N}_])/iu.test(t.name.trim()) ||
      (dateParts(t) >= 2 && t.columns.some((c) => isDate(c) && relDateTargets.has(lc(t.name) + '|' + lc(c.name)))));
    // a date picker (a disconnected start or end date for a slicer) is not a calendar: its only column is a date and no relationship touches it
    const isPicker = (t) => { const cols = t.columns.filter((c) => c.kind !== 'rowNumber'); return cols.length === 1 && (cols[0].dataType === 'dateTime' || untyped(cols[0])) && !M.relationships.some((r) => lc(r.fromTable) === lc(t.name) || lc(r.toTable) === lc(t.name)); };
    const calendars = userTables.filter((t) => !isPicker(t)).filter(calendarBy((c) => c.dataType === 'dateTime'));
    add('DATE_NOT_MARKED', calendars.filter((t) => lc(t.dataCategory) !== 'time').map((t) => ({ obj: t.name })));
    // would be a calendar if a column of unknown type were a date
    userTables.filter((t) => !calendars.includes(t) && !isPicker(t) && lc(t.dataCategory) !== 'time' && calendarBy((c) => c.dataType === 'dateTime' || untyped(c))(t)).forEach((t) => skip('DATE_NOT_MARKED', t.name));
    add('CALENDARAUTO', userTables.filter((t) => t.isCalcTable && /CALENDARAUTO\s*\(/i.test(daxCode(t.calcExpr))).map((t) => ({ obj: t.name })));
  }

  // ---- DAX patterns ----
  function filterKinds(sh) {
    const { isTbl, isOp, call, closeOf, measureRef } = sh;
    // FILTER(<table>, ...) or FILTER(ALL(<table>), ...) used directly as a filter argument of CALCULATE / CALCULATETABLE.
    // Returns which kinds it found: 'table' (the predicate tests columns: a Boolean filter can do it) and 'measure' (the
    // predicate references a measure: a Boolean filter can't, so FILTER is right, over a column; Microsoft's own advice).
    // What the FILTER predicate starting at token j (up to FILTER's closing parenthesis) tests: 'measure' (it references
    // a measure), 'var' (it compares with another table's column or an aggregate, which a Boolean filter can't take as
    // written; a value inside RELATED is a row lookup, not that), or 'table' (columns of the filtered table only).
    const PRED_AGG = /^(MIN|MAX|SUM|AVERAGE|COUNT|COUNTA|COUNTROWS|DISTINCTCOUNT|MINX|MAXX|SUMX|AVERAGEX|COUNTX|MINA|MAXA|FIRSTDATE|LASTDATE|CALCULATE)$/i;
    const predKind = (tk, j, filtered) => {
      let kind = 'table';
      for (let depth = 0; j < tk.length; j++) {
        const x = tk[j];
        if (call(tk, j) && /^RELATED$/i.test(x.v)) { j = closeOf(tk, j + 1); continue; }
        if (call(tk, j) && PRED_AGG.test(x.v)) kind = 'var';
        if (isOp(x, '(')) depth++;
        else if (isOp(x, ')')) { if (!depth) return kind; depth--; }
        else if (x.t === 'br') {
          if (measureRef(tk, j, null)) return 'measure';
          if (isTbl(tk[j - 1]) && lc(tk[j - 1].v) !== lc(filtered)) kind = 'var';
        }
      }
      return kind;
    };
    const filterOverTable = (src) => {
      const tk = tokenizeDax(src), stack = [], kinds = new Set();
      for (let i = 0; i < tk.length; i++) {
        const t = tk[i];
        if (t.t === 'op' && t.v === '(') { stack.push({ fn: tk[i - 1] && tk[i - 1].t === 'id' ? tk[i - 1].v.toUpperCase() : '', argStart: true }); continue; }
        if (t.t === 'op' && t.v === ')') { stack.pop(); continue; }
        if (t.t === 'op' && t.v === ',') { if (stack.length) stack[stack.length - 1].argStart = true; continue; }
        const top = stack[stack.length - 1];
        if (top && top.argStart && /^CALCULATE(TABLE)?$/.test(top.fn) && t.t === 'id' && t.v.toUpperCase() === 'FILTER' && tk[i + 1] && tk[i + 1].v === '(') {
          const a = tk[i + 2];
          let pred = -1, filtered = '';
          if (isTbl(a) && tk[i + 3] && tk[i + 3].v === ',') { pred = i + 4; filtered = a.v; }
          else if (a && a.t === 'id' && /^(ALL|ALLNOBLANKROW)$/i.test(a.v) && tk[i + 3] && tk[i + 3].v === '(' && isTbl(tk[i + 4]) && tk[i + 5] && tk[i + 5].v === ')') { pred = i + 7; filtered = tk[i + 4].v; }
          if (pred >= 0) kinds.add(predKind(tk, pred, filtered));
        }
        if (top && t.t !== 'op') top.argStart = false;
      }
      return kinds;
    };
    return filterOverTable;
  }
  function measureShape(IX, sh) {
    const { isOp, call, closeOf, argsOf } = sh;
    const msHidden = (ms) => ms.hidden || !!(IX.tables.get(lc(ms.table)) || {}).hidden;
    // daxCode with each use of a VAR bound to a nonzero number written as that number (VAR _Ticks = 60 ... / _Ticks)
    const constVarCode = (src) => {
      const tk = tokenizeDax(src), consts = new Map();
      for (let j = 0; j + 3 < tk.length; j++) {
        if (tk[j].t !== 'id' || !/^VAR$/i.test(tk[j].v) || tk[j + 1].t !== 'id' || !isOp(tk[j + 2], '=') || tk[j + 3].t !== 'num') continue;
        const after = tk[j + 4];
        if (Number(tk[j + 3].v) && (!after || (after.t === 'id' && /^(VAR|RETURN)$/i.test(after.v)))) consts.set(lc(tk[j + 1].v), String(Number(tk[j + 3].v)));
      }
      if (!consts.size) return daxCode(src);
      return tk.map((t, j) => (t.t === 'id' && consts.has(lc(t.v)) && !(tk[j - 1] && tk[j - 1].t === 'id' && /^VAR$/i.test(tk[j - 1].v)) ? consts.get(lc(t.v))
        : t.t === 'str' ? '""' : t.t === 'tbl' ? "'_'" : t.t === 'br' ? '[_]' : t.v)).join(' ');
    };
    // the measure's value is a count: COUNTROWS, COUNT, COUNTA or DISTINCTCOUNT at its root (inside CALCULATE too)
    const countRoot = (src) => {
      let tk = tokenizeDax(src);
      for (let n = 0; n < 4 && tk.length; n++) {
        while (tk.length > 2 && isOp(tk[0], '(') && closeOf(tk, 0) === tk.length - 1) tk = tk.slice(1, -1);
        if (!call(tk, 0) || closeOf(tk, 1) !== tk.length - 1) return false;
        if (/^(COUNTROWS|COUNT|COUNTA|DISTINCTCOUNT)$/i.test(tk[0].v)) return true;
        if (!/^CALCULATE$/i.test(tk[0].v)) return false;
        tk = argsOf(tk, 1)[0] || [];
      }
      return false;
    };
    return { msHidden, constVarCode, countRoot };
  }
  function measureRules(x, out, sh) {
    const { IX, vis, styleByMeasure, allMeasures, chainDepths } = x, { add } = out;
    const filterOverTable = filterKinds(sh), returnsText = textCheck(IX, sh), { msHidden, constVarCode, countRoot } = measureShape(IX, sh);
    const filterTable = [], filterMeasure = [], iferr = [], division = [], noFmt = [], pctFmt = [], noFolder = [], noDesc = [], longMs = [], deep = [], qualM = [], unqualC = [];
    allMeasures.forEach((ms, i) => {
      const code = daxCode(ms.expr);
      const name = `[${ms.name}]`;
      if (/\bCALCULATE(TABLE)?\b/i.test(code) && /\bFILTER\b/i.test(code)) {
        const kinds = filterOverTable(ms.expr);
        if (kinds.has('var')) filterTable.push({ obj: name, detail: RULES.FILTER_TABLE.variants.VAR.en, variant: 'VAR' });
        else if (kinds.has('table')) filterTable.push({ obj: name });
        if (kinds.has('measure')) filterMeasure.push({ obj: name });
      }
      if (/\b(IFERROR|ISERROR)\s*\(/i.test(code)) iferr.push({ obj: name });
      // "/" followed by something that is not a plain number (a VAR bound to a nonzero number counts as that number)
      if (/\/\s*(?![\d.\s]+(?:[)\s,]|$))[\[\w'(]/.test(constVarCode(ms.expr))) division.push({ obj: name });
      // a measure returning text takes no number format; a hidden one no visual shows is not seen (BPA's rule is for visible measures)
      if (!ms.formatString && !ms.fsExpr && !returnsText(ms.expr) && !(msHidden(ms) && !vis.measures.has(lc(ms.name)))) noFmt.push({ obj: name });
      // (a ratio such as Current Ratio or Asset Turnover is a multiple, 0.00 on purpose; a count is a whole number whatever its name)
      // (AUD-043: the Arabic and full-width percent signs ٪ ％ and نسبة "ratio, percentage" too; not معدل, which is also
      // "average": a wrong finding is worse than a missed one. تغير/فرق are change/diff, left out like them)
      if (/(%|٪|％|نسبة|\bpct\b|\bpercent(age)?\b|\brate\b|\bshare\b)/i.test(ms.name) && !/(colou?r|icon|label|text|arrow|title|\bpp\b|\(pp\)|mom|yoy|delta|change|diff|hourly|exchange|run rate|\bper\b|\bcount\b|▲|▼|تغير|فرق)/i.test(ms.name) && ms.formatString && !/[%@]|pp|percent/i.test(ms.formatString) && !ms.fsExpr && !countRoot(ms.expr)) pctFmt.push({ obj: name, detail: ms.formatString });
      // folders and descriptions are for the field list: hidden measures are not in it
      if (!ms.displayFolder && !msHidden(ms)) noFolder.push({ obj: name });
      if (!ms.description && !msHidden(ms)) noDesc.push({ obj: name });
      const lines = ms.expr.split('\n').length;
      if (lines > 60) longMs.push({ obj: name, detail: lines + ' lines' });
      const dd = chainDepths[i];
      if (dd >= 8) deep.push({ obj: name, detail: dd + ' levels' });
      const st = styleByMeasure[ms.name];
      if (st && st.qualifiedMeasures.length) qualM.push({ obj: name, detail: uniq(st.qualifiedMeasures).slice(0, 3).join(', ') });
      if (st && st.unqualifiedColumns.length) unqualC.push({ obj: name, detail: uniq(st.unqualifiedColumns).slice(0, 3).join(', ') });
    });
    add('FILTER_TABLE', filterTable); add('FILTER_MEASURE', filterMeasure); add('IFERROR', iferr); add('DIVISION', division);
    add('NO_FORMAT', noFmt); add('PCT_FORMAT', pctFmt);
    const shown = allMeasures.filter((ms) => !msHidden(ms)).length; // visible measures, in the share and the floor
    if (shown >= 20 && noFolder.length / shown > 0.3) add('NO_FOLDERS', noFolder);
    if (shown && noDesc.length / shown > 0.5) add('NO_DESC', noDesc);
    add('LONG_MEASURE', longMs); add('DEEP_CHAIN', deep);
    add('QUALIFIED_MEASURE', qualM); add('UNQUALIFIED_COLUMN', unqualC);
  }

  function duplicateRules(x, out, sh) {
    const { IX, allMeasures } = x, { add } = out, { isTbl } = sh;
    // identical DAX
    const byExpr = new Map();
    allMeasures.forEach((ms) => {
      const tk = tokenizeDax(ms.expr), k0 = tk.map((t) => t.t + ':' + t.v).join('\u0001').toLowerCase();
      if (k0.length < 24) return;
      // an unqualified column is its home table's: SUM([SalesAmount]) in two tables sums two different columns
      const k = tk.map((t, i) => (t.t === 'br' && !isTbl(tk[i - 1]) && !IX.measures.has(lc(t.v)) && IX.columns.has(lc(ms.table) + '|' + lc(t.v)) ? 'br:' + ms.table + '|' + t.v : t.t + ':' + t.v)).join('\u0001').toLowerCase();
      if (!byExpr.has(k)) byExpr.set(k, []); byExpr.get(k).push(ms.name);
    });
    const dups = [];
    byExpr.forEach((names) => { if (names.length > 1) dups.push({ obj: names.map((n) => `[${n}]`).join(' = ') }); });
    add('DUP_MEASURE', dups);
  }

  function namingRules(x, out) {
    const { M, userTables } = x, { add } = out;
    // ---- naming ----
    const styles = { underscore: [], space: [] };
    userTables.forEach((t) => { const m2 = t.name.match(/^(dim|fact|fct|d|f)([_ ])/i); if (m2) (m2[2] === '_' ? styles.underscore : styles.space).push(t.name); });
    if (styles.underscore.length && styles.space.length) {
      const minority = styles.underscore.length <= styles.space.length ? styles.underscore : styles.space;
      add('NAMING', minority.map((n) => ({ obj: n })));
    }
    const spaced = [];
    M.tables.forEach((t) => {
      if (t.name !== t.name.trim()) spaced.push({ obj: `'${t.name}'` });
      t.columns.forEach((c) => { if (c.name !== c.name.trim()) spaced.push({ obj: `${t.name}[${c.name}]` }); });
      t.measures.forEach((ms) => { if (ms.name !== ms.name.trim()) spaced.push({ obj: `[${ms.name}]` }); });
    });
    add('TRAILING_SPACE', spaced);
  }

  function powerQueryRules(x, out) {
    const { M, mQueries } = x, { add } = out;
    // ---- Power Query ----
    const hard = [], buffer = [], longM = [];
    mQueries.forEach((q) => {
      const e = q.expr;
      // a template placeholder ({{NAME}}) is filled in per deployment, not a fixed server or path
      const eLit = e.replace(/"(?:[^"]|"")*\{\{\s*[\w.-]+\s*\}\}(?:[^"]|"")*"/g, '""');
      const isParam = /IsParameterQuery\s*=\s*true/i.test(e);
      const isEntitySource = q.isExpr && (M.entityExprs.has(lc(q.name)) || /^DatabaseQuery$/i.test(q.name));
      const literalDb = /\b(Sql\.Databases?|Oracle\.Database|MySQL\.Database|PostgreSQL\.Database|Snowflake\.Databases|AnalysisServices\.Databases?|Teradata\.Database|Sybase\.Database|IbmDb2\.Database|SapHana\.Database)\s*\(\s*"[^"]+"/.test(eLit);
      if (!isParam && !isEntitySource && literalDb) hard.push({ obj: q.name });
      else if (!isParam && !isEntitySource && /"(?:[A-Za-z]:\\\\?|\\\\\\\\|https?:\/\/[^"]*(?:sharepoint|onedrive|\.database\.windows\.net|\.fabric\.microsoft\.com|\.datawarehouse)|[a-z0-9-]+\.(?:database\.windows\.net|datawarehouse\.fabric\.microsoft\.com))/i.test(eLit)) hard.push({ obj: q.name });
      if (/Table\.Buffer\s*\(/.test(e)) buffer.push({ obj: q.name });
      const steps = (e.match(/^\s*(#"[^"]+"|[A-Za-z_]\w*)\s*=/gm) || []).length;
      if (steps > 40) longM.push({ obj: q.name, detail: steps + ' steps' });
    });
    add('HARDCODED_PATH', hard); add('TABLE_BUFFER', buffer); add('LONG_M', longM);
    if (!M.roles.length) add('NO_RLS', [{ obj: 'Model' }]);
  }

  const api = { RULES, BPA_URL, runRules };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAHealthRules = api;
})(typeof self !== 'undefined' ? self : this);
