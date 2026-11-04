/*
 * DataArcus Power BI Model Health Check: analysis engine.
 * Pure JavaScript, no DOM. Runs in a Web Worker in the browser and in Node for tests.
 * Input: the model JSON (DataModelSchema / model.bim) and, optionally, the report
 * definition (legacy Report/Layout or PBIR files). Nothing is sent anywhere.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  // (0.3.2 SP9) the DAX tokens and the report references (dax-reference-parser.js, loaded before this file in the worker
  // and on the tool pages)
  const P = (typeof module !== 'undefined' && module.exports ? require('./dax-reference-parser.js') : root.DADaxParser);
  // (0.3.2 SP15) the normalised model, its index and dependency references (model-index.js, loaded after the parser and
  // before this file)
  const X = (typeof module !== 'undefined' && module.exports ? require('./model-index.js') : root.DAModelIndex);
  // (0.3.2 SP27) the rule catalogue and the rules (health-rules.js, loaded after the index and before this file)
  const R = (typeof module !== 'undefined' && module.exports ? require('./health-rules.js') : root.DAHealthRules);
  // (0.3.2 SP27) the "Please confirm" questions (health-confirm.js, loaded after the rules and before this file)
  const C = (typeof module !== 'undefined' && module.exports ? require('./health-confirm.js') : root.DAHealthConfirm);

  // ---------- helpers ----------
  const lc = (s) => String(s == null ? '' : s).toLowerCase();
  const uniq = (a) => Array.from(new Set(a));

  // ---------- 2. DAX tokens and report references: dax-reference-parser.js (0.3.2 SP9) ----------
  const { tokenizeDax, collectReportRefs, analyzeReport } = P;

  // ---------- 1, 3. the normalised model, its index and dependency references: model-index.js (0.3.2 SP15) ----------
  const { normalizeModel, buildIndex, K, daxRefs, aggBase } = X;

  // ---------- 5. the rule catalogue and the rules: health-rules.js (0.3.2 SP27) ----------
  const { RULES, BPA_URL, runRules } = R;
  // the score: per item by severity, capped per rule (high 8, medium 4, low 2, info 0)
  const SEV = { high: 8, medium: 4, low: 2, info: 0 };
  const CAP = { high: 30, medium: 20, low: 10, info: 0 };

  // ---------- 6. analysis ----------
  function analyze(modelJson, report) {
    const M = normalizeModel(modelJson);
    const IX = buildIndex(M);
    const deps = new Map();   // node -> Set(nodes it depends on)
    const addDeps = (node, arr) => { if (!deps.has(node)) deps.set(node, new Set()); arr.forEach((x) => deps.get(node).add(x)); };
    const styleByMeasure = {};

    const autoDateTables = M.tables.filter((t) => /^(LocalDateTable_|DateTableTemplate_)/.test(t.name));
    const autoSet = new Set(autoDateTables.map((t) => lc(t.name)));
    const userTables = M.tables.filter((t) => !autoSet.has(lc(t.name)));

    // dependencies from DAX
    M.functions.forEach((f) => addDeps(K.f(f.name), daxRefs(f.expr, null, IX).refs));
    M.tables.forEach((t) => {
      t.measures.forEach((ms) => {
        const r = daxRefs(ms.expr + '\n' + ms.fsExpr + '\n' + ms.detailRows + '\n' + ms.kpi, null, IX);
        addDeps(K.m(ms.name), r.refs);
        styleByMeasure[ms.name] = r.style;
      });
      t.columns.forEach((c) => { if (c.kind === 'calculated') addDeps(K.c(t.name, c.name), daxRefs(c.expr, t.name, IX).refs); });
      if (t.isCalcTable) {
        const r = daxRefs(t.calcExpr, null, IX).refs;
        addDeps(K.t(t.name), r);
        t.columns.forEach((c) => addDeps(K.c(t.name, c.name), [K.t(t.name)]));
      }
      if (t.calcGroup) t.calcGroup.items.forEach((ci) => addDeps(K.t(t.name), daxRefs(ci.expr + '\n' + ci.fsExpr, null, IX).refs));
      t.columns.forEach((c) => { if (c.sortBy) addDeps(K.c(t.name, c.name), [K.c(t.name, c.sortBy)]); });
      // aggregation tables: queries on the detail table are answered from the hidden aggregation table, so an aggregation
      // column is used whenever its detail column (or for Count table rows, its detail table) is, and it needs that detail
      t.columns.forEach((c) => {
        const base = aggBase(c.alternateOf);
        if (base) { addDeps(base, [K.c(t.name, c.name)]); addDeps(K.c(t.name, c.name), [base]); }
      });
      // field parameters: the visible column groups by the hidden "Fields" column, so a visual using one uses both
      t.columns.forEach((c) => ((c.relatedColumnDetails && c.relatedColumnDetails.groupByColumns) || []).forEach((g) => { if (g && g.groupingColumn) addDeps(K.c(t.name, c.name), [K.c(t.name, g.groupingColumn)]); }));
      t.hierarchies.forEach((h) => h.levels.forEach((l) => addDeps('h:' + lc(t.name) + '|' + lc(h.name), [K.c(t.name, l.column)])));
      // a column always needs its table
      t.columns.forEach((c) => addDeps(K.c(t.name, c.name), [K.t(t.name)]));
      t.measures.forEach((ms) => addDeps(K.m(ms.name), [K.t(t.name)]));
      // a measures table needs its only column (the "Enter data" placeholder): a table cannot lose its last column
      const cols = t.columns.filter((c) => c.kind !== 'rowNumber');
      if (t.measures.length && cols.length === 1) addDeps(K.t(t.name), [K.c(t.name, cols[0].name)]);
    });

    // roots: report, relationships, security
    const roots = new Set();
    const rep = analyzeReport(report);
    const reportUse = { measures: new Map(), columns: new Map() };
    const vis = { measures: new Map(), columns: new Map() }; // key -> { v: distinct visuals, p: Set(pages) }
    if (rep) rep.perVisual.forEach((pv, i) => {
      const seen = new Set();
      pv.refs.forEach((r) => {
        const t = IX.tables.get(lc(r.entity)); if (!t || !r.prop) return;
        const isM = IX.measures.has(lc(r.prop)) && (r.kind === 'Measure' || !IX.columns.has(lc(t.name) + '|' + lc(r.prop)));
        const bucket = isM ? vis.measures : vis.columns, key = isM ? lc(r.prop) : lc(t.name) + '|' + lc(r.prop);
        if (seen.has(bucket === vis.measures ? 'm' + key : 'c' + key)) return;
        seen.add(bucket === vis.measures ? 'm' + key : 'c' + key);
        if (!bucket.has(key)) bucket.set(key, { v: 0, p: new Set() });
        const e = bucket.get(key); e.v++; e.p.add(pv.page);
      });
    });
    const broken = new Map();
    const extNames = new Set();
    const noteBroken = (r) => {
      const k = lc(r.entity) + '|' + lc(r.prop);
      if (!broken.has(k)) broken.set(k, { obj: r.entity + '[' + r.prop + ']', pages: new Set(), n: 0 });
      const b = broken.get(k); b.n++;
      b.pages.add(r.page ? r.page + (r.visual ? ' › ' + r.visual : '') : r.bookmark != null ? 'bookmark "' + r.bookmark + '"' : 'report filter');
    };
    if (rep) {
      rep.ext.forEach((x) => { extNames.add(lc(x.name)); daxRefs(x.expr, null, IX).refs.forEach((n) => roots.add(n)); });
      rep.refs.forEach((r) => {
        const t = IX.tables.get(lc(r.entity));
        if (!t) { if (r.kind !== 'HierarchyLevel' && !extNames.has(lc(r.prop))) noteBroken(r); return; }
        if (r.kind === 'HierarchyLevel') {
          const h = t.hierarchies.find((x) => lc(x.name) === lc(r.hierarchy));
          const lvl = h && h.levels.find((l) => lc(l.name) === lc(r.level));
          if (lvl) roots.add(K.c(t.name, lvl.column));
          else { const auto = IX.columns.get(lc(t.name) + '|' + lc(r.hierarchy)); if (auto) roots.add(K.c(t.name, auto.col.name)); }
          return;
        }
        if (IX.measures.has(lc(r.prop)) && (r.kind === 'Measure' || !IX.columns.has(lc(t.name) + '|' + lc(r.prop)))) {
          roots.add(K.m(r.prop));
          const k = lc(r.prop); reportUse.measures.set(k, (reportUse.measures.get(k) || 0) + 1);
        } else if (IX.columns.has(lc(t.name) + '|' + lc(r.prop))) {
          roots.add(K.c(t.name, r.prop));
          const k = lc(t.name) + '|' + lc(r.prop); reportUse.columns.set(k, (reportUse.columns.get(k) || 0) + 1);
        } else if (!extNames.has(lc(r.prop)) && !t.hierarchies.some((h) => lc(h.name) === lc(r.prop))) noteBroken(r);
      });
    }
    M.relationships.forEach((r) => { roots.add(K.c(r.fromTable, r.fromColumn)); roots.add(K.c(r.toTable, r.toColumn)); });
    M.roles.forEach((ro) => ro.permissions.forEach((p) => { roots.add(K.t(p.table)); daxRefs(p.filter, p.table, IX).refs.forEach((x) => roots.add(x)); }));
    M.tables.forEach((t) => { if (t.calcGroup) roots.add(K.t(t.name)); });

    // reachability
    const used = new Set();
    const stack = Array.from(roots);
    while (stack.length) {
      const n = stack.pop();
      if (used.has(n)) continue;
      used.add(n);
      const d = deps.get(n);
      if (d) d.forEach((x) => { if (!used.has(x)) stack.push(x); });
    }
    // reverse edges (used by)
    const usedBy = new Map();
    deps.forEach((set, from) => set.forEach((to) => { if (!usedBy.has(to)) usedBy.set(to, new Set()); usedBy.get(to).add(from); }));

    // measure depth
    const depthMemo = new Map();
    let cycleHit = false;
    const depth = (node, seen) => {
      if (depthMemo.has(node)) return depthMemo.get(node);
      if (seen.has(node)) { cycleHit = true; return 0; }
      seen.add(node);
      const before = cycleHit; cycleHit = false;
      let d = 0;
      (deps.get(node) || new Set()).forEach((x) => { if (x.startsWith('m:')) d = Math.max(d, 1 + depth(x, seen)); });
      seen.delete(node);
      if (!cycleHit) depthMemo.set(node, d); // results cut short by a cycle depend on visit order, so they are not cached
      cycleHit = cycleHit || before;
      return d;
    };

    const allMeasures = [];
    M.tables.forEach((t) => t.measures.forEach((ms) => allMeasures.push(ms)));

    // ---- the rules (health-rules.js): the model, its index, the report's use and the graph in; findings out ----
    const mQueries = [];
    userTables.forEach((t) => t.partitions.forEach((p) => { if (p.sourceType === 'm' && p.expression) mQueries.push({ name: t.name, expr: p.expression }); }));
    M.expressions.forEach((e) => { if (e.kind === 'm') mQueries.push({ name: e.name, expr: e.expr, isExpr: true }); });
    const sources = new Map();
    mQueries.forEach((q) => {
      const e = q.expr;
      (e.match(/\b(Sql\.Databases?|Lakehouse\.Contents|Fabric\.Warehouse|PowerPlatform\.Dataflows|PowerBI\.Dataflows|SharePoint\.(?:Files|Contents|Tables)|Excel\.Workbook|Csv\.Document|Web\.Contents|OData\.Feed|Odbc\.DataSource|OleDb\.DataSource|Oracle\.Database|MySQL\.Database|PostgreSQL\.Database|Snowflake\.Databases|GoogleBigQuery\.Database|Salesforce\.Data|Dynamics365\.Contents|CommonDataService\.Database|AzureStorage\.DataLake|Folder\.Files|Json\.Document|Databricks\.Catalogs)\b/g) || []).forEach((s) => sources.set(s, (sources.get(s) || 0) + 1));
    });
    const chainDepths = allMeasures.map((ms) => depth(K.m(ms.name), new Set()));
    const { findings, skipped } = runRules(Object.freeze({ M, IX, report: rep, used, vis, broken, styleByMeasure, userTables, autoDateTables, allMeasures, mQueries, chainDepths }));

    // ---- scores ----
    const catScore = { perf: 100, maint: 100, bp: 100 };
    // Rules that apply to many objects are judged by the share of objects affected, so a large model is not punished for being large.
    const SCOPE = {
      measures: ['FILTER_TABLE', 'FILTER_MEASURE', 'IFERROR', 'DIVISION', 'NO_FORMAT', 'PCT_FORMAT', 'UNUSED_MEASURE', 'QUALIFIED_MEASURE', 'UNQUALIFIED_COLUMN', 'LONG_MEASURE', 'DEEP_CHAIN', 'NO_DESC', 'NO_FOLDERS', 'DUP_MEASURE'],
      columns: ['UNUSED_COL', 'DOUBLE', 'CALC_COLS', 'FK_VISIBLE', 'SUMMARIZE_KEYS', 'TRAILING_SPACE'],
      rels: ['BIDI', 'BIDI_BRIDGE', 'M2M', 'INACTIVE_UNUSED', 'STRING_KEYS', 'USEREL_ACTIVE'],
      queries: ['HARDCODED_PATH', 'TABLE_BUFFER', 'LONG_M']
    };
    const denom = {
      measures: allMeasures.length,
      columns: userTables.reduce((a, t) => a + t.columns.filter((c) => c.kind !== 'rowNumber').length, 0),
      rels: M.relationships.length,
      queries: mQueries.length
    };
    findings.forEach((f) => {
      const R = RULES[f.id];
      f.cat = R.cat; f.sev = R.sev;
      const scope = Object.keys(SCOPE).find((k) => SCOPE[k].includes(f.id));
      let pen;
      if (scope && CAP[R.sev]) {
        const share = f.items.length / Math.max(1, denom[scope]);
        pen = Math.round(CAP[R.sev] * Math.min(1, 0.3 + 2.5 * share));
        f.share = Math.round(share * 1000) / 10;
      } else pen = SEV[R.sev] * f.items.length;
      f.penalty = Math.min(CAP[R.sev], pen);
    });
    const sc = scoreFrom(findings);
    Object.assign(catScore, sc);
    const overall = sc.overall;
    const sevRank = { high: 0, medium: 1, low: 2, info: 3 };
    findings.sort((a, b) => sevRank[a.sev] - sevRank[b.sev] || b.penalty - a.penalty || b.items.length - a.items.length);

    // ---- documentation data ----
    const mDeps = (ms) => Array.from(deps.get(K.m(ms.name)) || []).filter((x) => !x.startsWith('t:') || x !== K.t(ms.table));
    const nice = (node) => {
      if (node.startsWith('m:')) { const x = IX.measures.get(node.slice(2)); return x ? { type: 'measure', name: x.m.name, table: x.table.name } : null; }
      if (node.startsWith('c:')) { const [t, c] = node.slice(2).split('|'); const x = IX.columns.get(t + '|' + c); return x ? { type: 'column', name: x.col.name, table: x.table.name } : null; }
      if (node.startsWith('t:')) { const x = IX.tables.get(node.slice(2)); return x ? { type: 'table', name: x.name } : null; }
      if (node.startsWith('h:')) {
        const [t, hn] = node.slice(2).split('|'); const x = IX.tables.get(t);
        const h = x && x.hierarchies.find((y) => lc(y.name) === hn);
        return h ? { type: 'hierarchy', name: h.name, table: x.name } : null;
      }
      if (node.startsWith('f:')) { const f = IX.functions.get(node.slice(2)); return f ? { type: 'function', name: f.name } : null; }
      return null;
    };
    const measures = allMeasures.map((ms) => ({
      name: ms.name, table: ms.table, expr: ms.expr, formatString: ms.formatString, folder: ms.displayFolder, description: ms.description, hidden: ms.hidden,
      used: rep ? used.has(K.m(ms.name)) : null,
      visuals: vis.measures.has(lc(ms.name)) ? vis.measures.get(lc(ms.name)).v : 0,
      pages: vis.measures.has(lc(ms.name)) ? Array.from(vis.measures.get(lc(ms.name)).p) : [],
      refs: reportUse.measures.get(lc(ms.name)) || 0,
      depth: depth(K.m(ms.name), new Set()),
      dependsOn: mDeps(ms).map(nice).filter((x) => x && !(x.type === 'table' && x.name === ms.table)),
      usedBy: Array.from(usedBy.get(K.m(ms.name)) || []).map(nice).filter(Boolean)
    }));
    const tables = M.tables.map((t) => ({
      name: t.name, hidden: t.hidden, mode: t.mode, isCalcTable: t.isCalcTable, auto: autoSet.has(lc(t.name)), description: t.description,
      source: t.isCalcTable ? 'DAX' : (t.partitions[0] && t.partitions[0].sourceType) || '',
      markedDate: lc(t.dataCategory) === 'time',
      calcExpr: t.calcExpr,
      mExpr: (t.partitions.find((p) => p.sourceType === 'm') || {}).expression || '',
      fromM: t.partitions.some((p) => p.sourceType === 'm'),
      measures: t.measures.length,
      used: rep ? used.has(K.t(t.name)) || t.columns.some((c) => used.has(K.c(t.name, c.name))) : null,
      columns: t.columns.filter((c) => c.kind !== 'rowNumber').map((c) => ({
        name: c.name, dataType: c.dataType, kind: c.kind, hidden: c.hidden, expr: c.expr, sortBy: c.sortBy, format: c.formatString, description: c.description, sourceColumn: c.sourceColumn,
        used: rep ? used.has(K.c(t.name, c.name)) : null,
        // model objects that read this column (measures, calculated columns and tables, sorts, hierarchies), so a cleanup never breaks them
        neededBy: Array.from(usedBy.get(K.c(t.name, c.name)) || []).map(nice).filter((x) => x && !(x.type === 'table' && x.name === t.name)),
        visuals: vis.columns.has(lc(t.name) + '|' + lc(c.name)) ? vis.columns.get(lc(t.name) + '|' + lc(c.name)).v : 0,
        refs: reportUse.columns.get(lc(t.name) + '|' + lc(c.name)) || 0
      }))
    }));
    const userCols = userTables.reduce((a, t) => a + t.columns.filter((c) => c.kind !== 'rowNumber').length, 0);
    return {
      version: 1,
      stats: {
        tables: userTables.length, autoDateTables: autoDateTables.length,
        columns: userCols,
        calcColumns: userTables.reduce((a, t) => a + t.columns.filter((c) => c.kind === 'calculated').length, 0),
        measures: allMeasures.length, relationships: M.relationships.length,
        activeRelationships: M.relationships.filter((r) => r.active).length,
        roles: M.roles.length, calcGroups: M.tables.filter((t) => t.calcGroup).length,
        calcTables: userTables.filter((t) => t.isCalcTable).length,
        modes: uniq(userTables.map((t) => t.mode)),
        compatibilityLevel: M.compatibilityLevel, culture: M.culture,
        pages: rep ? rep.pages : null, visuals: rep ? rep.visuals : null, reportFormat: rep ? rep.format : null,
        sources: Array.from(sources.entries()).map(([k, v]) => ({ name: k, count: v })).sort((a, b) => b.count - a.count),
        unusedColumns: rep ? (findings.find((f) => f.id === 'UNUSED_COL') || { items: [] }).items.length : null,
        unusedMeasures: rep ? (findings.find((f) => f.id === 'UNUSED_MEASURE') || { items: [] }).items.length : null
      },
      score: { overall, perf: catScore.perf, maint: catScore.maint, bp: catScore.bp },
      findings,
      // questions for the user, never findings: not in the score (section 7: health-confirm.js)
      confirm: pleaseConfirm(M, { userTables }),
      skipped,
      tables,
      measures,
      relationships: M.relationships,
      roles: M.roles.map((r) => ({ name: r.name, tables: r.permissions.map((p) => p.table) })),
      pageNames: rep ? rep.pageNames : [],
      rawTables: (((modelJson || {}).model || modelJson || {}).tables || []).filter((t) => t && t.name != null).map((t) => ({ name: String(t.name), isHidden: !!t.isHidden, dataCategory: t.dataCategory, columns: t.columns || [], measures: t.measures || [] }))
    };
  }

  // ---------- 7. "Please confirm": the questions and their evidence, apart from the score: health-confirm.js (0.3.2 SP27) ----------
  const { pleaseConfirm } = C;

  // Diminishing curve: the first problems cost the most, and a score never collapses to zero.
  // ignored: optional Set of rule ids the user chose to ignore.
  function scoreFrom(findings, ignored) {
    const lost = { perf: 0, maint: 0, bp: 0 };
    (findings || []).forEach((f) => { if (!(ignored && ignored.has(f.id))) lost[f.cat] += f.penalty || 0; });
    const out = {};
    Object.keys(lost).forEach((k) => { out[k] = Math.round(100 * Math.exp(-lost[k] / 90)); });
    out.overall = Math.round(out.perf * 0.4 + out.maint * 0.3 + out.bp * 0.3);
    return out;
  }

  const api = { analyze, scoreFrom, normalizeModel, tokenizeDax, daxRefs, collectReportRefs, analyzeReport, RULES, BPA_URL };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHEngine = api;
})(typeof self !== 'undefined' ? self : this);
