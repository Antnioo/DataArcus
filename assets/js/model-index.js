/*
 * DataArcus Power BI Model Health Check: the model's normalised form, its index and its dependency references
 * (0.3.2 SP15, the split of model-health-engine.js: the Codex split map, B-280). Pure functions: model JSON in, the
 * normalised model out; the normalised model in, an index of metadata out (frozen: never changed after it is built);
 * one DAX text in, the model objects it references out. Loaded after dax-reference-parser.js and before
 * model-health-engine.js (the worker's importScripts, the tool pages); in Node the engine requires it.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // the DAX tokens (dax-reference-parser.js, loaded before this file in the worker and on the tool pages)
  const P = (typeof module !== 'undefined' && module.exports ? require('./dax-reference-parser.js') : root.DADaxParser);
  const { tokenizeDax } = P;
  const text = P.exprText;   // (0.3.3 SG1) one place: dax-reference-parser.js

  const lc = (s) => String(s == null ? '' : s).toLowerCase();
  const uniq = (a) => Array.from(new Set(a));
  const refuse = () => { throw new TypeError('the model index is read-only'); };
  const readOnly = (m) => { m.set = refuse; m.delete = refuse; m.clear = refuse; return Object.freeze(m); };

  // ---------- 1. normalise the TOM JSON ----------
  function normalizeModel(json) {
    json = json || {};
    const m = json.model || json;
    const nm = (x) => String(x == null ? '' : x);
    const tables = (m.tables || []).filter((t) => t && t.name != null).map((t) => {
      const parts = (t.partitions || []).map((p) => ({
        name: p.name,
        mode: p.mode || m.defaultMode || 'import',
        sourceType: (p.source && p.source.type) || 'm',
        expression: text(p.source && (p.source.expression || p.source.query)),
        entityName: p.source && p.source.entityName,
        schemaName: p.source && p.source.schemaName
      }));
      const calcPart = parts.find((p) => p.sourceType === 'calculated');
      return {
        name: nm(t.name),
        hidden: !!t.isHidden,
        description: text(t.description),
        dataCategory: t.dataCategory || '',
        isPrivate: !!t.isPrivate,
        showAsVariationsOnly: !!t.showAsVariationsOnly,
        partitions: parts,
        isCalcTable: !!calcPart,
        calcExpr: calcPart ? calcPart.expression : '',
        mode: parts[0] ? parts[0].mode : 'import',
        calcGroup: t.calculationGroup ? {
          precedence: t.calculationGroup.precedence || 0,
          items: (t.calculationGroup.calculationItems || []).map((ci) => ({
            name: ci.name, expr: text(ci.expression),
            fsExpr: ci.formatStringDefinition ? text(ci.formatStringDefinition.expression) : ''
          }))
        } : null,
        columns: (t.columns || []).filter((c) => c && c.name != null).map((c) => ({
          name: nm(c.name),
          kind: c.type || (c.expression != null ? 'calculated' : 'data'),
          dataType: c.dataType || 'string',
          hidden: !!c.isHidden,
          expr: text(c.expression),
          sortBy: c.sortByColumn || '',
          summarizeBy: c.summarizeBy || 'default',
          formatString: c.formatString || '',
          displayFolder: c.displayFolder || '',
          description: text(c.description),
          dataCategory: c.dataCategory || '',
          isKey: !!c.isKey,
          sourceColumn: c.sourceColumn || '',
          extendedProperties: c.extendedProperties || null,
          relatedColumnDetails: c.relatedColumnDetails || null,
          alternateOf: c.alternateOf || null
        })),
        measures: (t.measures || []).filter((ms) => ms && ms.name != null).map((ms) => ({
          name: nm(ms.name),
          table: nm(t.name),
          expr: text(ms.expression),
          formatString: ms.formatString || '',
          fsExpr: ms.formatStringDefinition ? text(ms.formatStringDefinition.expression) : '',
          displayFolder: ms.displayFolder || '',
          description: text(ms.description),
          hidden: !!ms.isHidden,
          detailRows: ms.detailRowsDefinition ? text(ms.detailRowsDefinition.expression) : '',
          kpi: ms.kpi ? [ms.kpi.targetExpression, ms.kpi.statusExpression, ms.kpi.trendExpression].map(text).join('\n') : ''
        })),
        hierarchies: (t.hierarchies || []).map((h) => ({ name: h.name, levels: (h.levels || []).map((l) => ({ name: l.name, column: l.column })) }))
      };
    });
    const relationships = (m.relationships || []).filter((r) => r && r.fromTable && r.toTable).map((r) => ({
      name: r.name,
      fromTable: r.fromTable, fromColumn: r.fromColumn, toTable: r.toTable, toColumn: r.toColumn,
      active: r.isActive !== false,
      cross: r.crossFilteringBehavior || 'oneDirection',
      fromCard: r.fromCardinality || 'many', toCard: r.toCardinality || 'one',
      securityBoth: r.securityFilteringBehavior === 'bothDirections'
    }));
    const roles = (m.roles || []).map((r) => ({
      name: r.name,
      permissions: (r.tablePermissions || []).map((tp) => ({ table: tp.name, filter: text(tp.filterExpression), columns: (tp.columnPermissions || []).map((c) => c.name) }))
    }));
    const expressions = (m.expressions || []).map((e) => ({ name: nm(e.name), kind: e.kind || 'm', expr: text(e.expression) }));
    const entityExprs = new Set();
    (m.tables || []).forEach((t) => (t.partitions || []).forEach((p) => { if (p && p.source && p.source.expressionSource) entityExprs.add(lc(p.source.expressionSource)); }));
    const functions = (m.functions || []).map((f) => ({ name: nm(f.name), expr: text(f.expression) }));
    const annotations = {};
    (m.annotations || []).forEach((a) => { annotations[a.name] = text(a.value); });
    return {
      compatibilityLevel: json.compatibilityLevel || null,
      culture: m.culture || '',
      tables, relationships, roles, expressions, annotations, entityExprs, functions,
      perspectives: (m.perspectives || []).length,
      cultures: (m.cultures || []).length
    };
  }

  // ---------- 2. index and dependency graph ----------
  function buildIndex(M) {
    const tables = new Map(), columns = new Map(), measures = new Map(), colsByName = new Map();
    M.tables.forEach((t) => {
      tables.set(lc(t.name), t);
      t.columns.forEach((c) => { const e = { table: t, col: c }; columns.set(lc(t.name) + '|' + lc(c.name), e); if (!colsByName.has(lc(c.name))) colsByName.set(lc(c.name), []); colsByName.get(lc(c.name)).push(e); });
      t.measures.forEach((ms) => measures.set(lc(ms.name), { table: t, m: ms }));
    });
    const functions = new Map(M.functions.map((f) => [lc(f.name), f]));
    // (0.3.2 SP15) the index is metadata, built once and never changed: its maps refuse set, delete and clear
    return Object.freeze({ tables: readOnly(tables), columns: readOnly(columns), measures: readOnly(measures), colsByName: readOnly(colsByName), functions: readOnly(functions) });
  }
  const K = Object.freeze({
    m: (name) => 'm:' + lc(name),
    c: (t, c) => 'c:' + lc(t) + '|' + lc(c),
    t: (t) => 't:' + lc(t),
    f: (f) => 'f:' + lc(f)
  });

  // Resolves references in one DAX expression. homeTable: table for unqualified column refs.
  function daxRefs(expr, homeTable, IX) {
    const src = expr || '';
    const toks = tokenizeDax(src);
    // names created inside the expression (ADDCOLUMNS, SELECTCOLUMNS, SUMMARIZE, ROW...) are virtual columns, not model objects
    const virtual = new Set(toks.filter((t) => t.t === 'str').map((t) => lc(t.v)));
    const seenTables = [];
    toks.forEach((t, i) => { if ((t.t === 'tbl' || t.t === 'id') && IX.tables.has(lc(t.v)) && !(toks[i + 1] && toks[i + 1].t === 'op' && toks[i + 1].v === '(')) seenTables.push(lc(t.v)); });
    const refs = [];
    const style = { qualifiedMeasures: [], unqualifiedColumns: [] };
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i], nx = toks[i + 1];
      if ((tk.t === 'tbl' || tk.t === 'id') && nx && nx.t === 'br' && /^\s*$/.test(src.slice(tk.p + (tk.t === 'tbl' ? tk.v.replace(/'/g, "''").length + 2 : tk.v.length), nx.p))) {
        const tName = tk.v, x = nx.v;
        const col = IX.columns.get(lc(tName) + '|' + lc(x));
        if (col) refs.push(K.c(col.table.name, col.col.name));
        else if (IX.measures.has(lc(x)) && IX.tables.has(lc(tName))) { refs.push(K.m(x)); style.qualifiedMeasures.push(tName + '[' + x + ']'); }
        else if (IX.tables.has(lc(tName))) refs.push(K.t(tName));
        i++;
        continue;
      }
      if (tk.t === 'br') {
        const key = lc(tk.v);
        if (IX.measures.has(key) && !virtual.has(key)) refs.push(K.m(tk.v));
        else if (homeTable && IX.columns.has(lc(homeTable) + '|' + key)) refs.push(K.c(homeTable, tk.v));
        else if (!homeTable && !virtual.has(key) && IX.colsByName.has(key)) {
          // unqualified column inside a measure (row context of an iterator): prefer tables named in the same expression
          const cands = IX.colsByName.get(key);
          const hit = cands.find((c) => seenTables.includes(lc(c.table.name))) || (cands.length === 1 ? cands[0] : null);
          if (hit) { refs.push(K.c(hit.table.name, hit.col.name)); style.unqualifiedColumns.push('[' + tk.v + ']'); }
        }
        continue;
      }
      if (tk.t === 'tbl' || tk.t === 'id') {
        if (tk.t === 'id' && nx && nx.t === 'op' && nx.v === '(') { if (IX.functions.has(lc(tk.v))) refs.push(K.f(tk.v)); continue; } // function call: a model function (UDF) is a dependency
        if (IX.tables.has(lc(tk.v))) refs.push(K.t(tk.v));
      }
    }
    return { refs: uniq(refs), style };
  }

  // Detail column (or table) of an aggregation column. baseColumn is written as { table, column } or as 'Table'[Column].
  function aggBase(a) {
    if (!a) return null;
    const b = a.baseColumn;
    if (b && typeof b === 'object' && b.table && b.column) return K.c(b.table, b.column);
    const m = typeof b === 'string' && b.match(/^\s*(?:'((?:[^']|'')+)'|([^\[]+?))\s*\[((?:[^\]]|\]\])+)\]\s*$/);
    if (m) return K.c((m[1] || m[2]).replace(/''/g, "'"), m[3].replace(/]]/g, ']'));
    const t = a.baseTable && (typeof a.baseTable === 'object' ? a.baseTable.name : a.baseTable);
    return t ? K.t(t) : null;
  }

  const api = { normalizeModel, buildIndex, K, daxRefs, aggBase };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DAModelIndex = api;
})(typeof self !== 'undefined' ? self : this);
