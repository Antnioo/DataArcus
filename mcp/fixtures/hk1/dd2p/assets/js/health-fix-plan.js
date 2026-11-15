/*
 * DataArcus Power BI Model Health Check: the Fix plan's data and scripts (0.3.2 SP32, the split of model-health.js:
 * the Codex split map, B-280; its own file so that health-view.js stays under 600 lines). One input, one output, no state:
 *   MHFixPlan.plan({ result, ignored, lang, tmdl }) -> { broken, quick, tmdl, cleanup, scripts }
 *   result:  the analysis (metadata only: names, DAX, descriptions; never data values), with result.meta
 *   ignored: a Set of the rule ids the person ignored (their findings are left out of the plan)
 *   lang:    'en' or 'ar' (the reasons a column is kept, and the date-table step, in that language)
 *   tmdl:    the TMDL helper (model-health-tmdl.js: sortColumnFor, noSortColumn, columnFixes, moveMeasures,
 *            formatReview); without it no TMDL scripts and no sort column are proposed
 *   broken:  the BROKEN_REF finding or null; quick: the Tabular Editor quick fixes { count, code } or null;
 *   tmdl:    { fixes, move, formats, dates, notes } or null; cleanup: { pq: [{ t, names }], calc, kept, ms } (empty
 *            lists without report pages); scripts: every text a copy button gives, by its key ('te:quick',
 *            'tmdl:fixes', 'tmdl:move', 'tmdl:formats', 'pq:<n>', 'te:move', 'te:delete')
 * It reads nothing else (no page, no clock, no storage, no worker) and never changes its input.
 * Loaded before health-view.js on the tool pages; in Node, require it. (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';
  const csStr = (x) => '"' + String(x).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  const mStr = (x) => '"' + String(x).replace(/"/g, '""') + '"';
  const splitObj = (o) => { const m = String(o).match(/^(.*)\[(.*)\]$/); return m ? [m[1], m[2]] : null; };

  function plan(input) {
    const R = input.result, ignored = input.ignored, T = input.tmdl || null;
    const L = (en, ar) => (input.lang === 'ar' ? ar : en);
    const unusedData = () => {
      const cols = [];
      R.tables.filter((t) => !t.auto).forEach((t) => { const u = t.columns.filter((c) => c.used === false); if (u.length) cols.push({ t, u }); });
      return { cols, ms: R.measures.filter((m) => m.used === false) };
    };
    const findingOf = (id) => (ignored.has(id) ? null : R.findings.find((f) => f.id === id));
    // The column a month or day name should sort by. "Month Year" needs a year-month number (202401):
    // sorting it by the month number 1-12 would put January of every year together.
    // (the rule itself is in model-health-tmdl.js, shared with the MCP's health check and kept like the report writer's)
    const sortColumnFor = (t, name) => (T ? T.sortColumnFor(t.columns, name) : null);
    const noSortColumn = (name) => (T ? T.noSortColumn(name) : 'no number column');
    // the date column of a calendar table: the one a relationship points to, else "Date", else the first date column
    const dateColumn = (t) => {
      const target = R.relationships.find((r) => r.toTable === t.name && t.columns.some((c) => c.name === r.toColumn && c.dataType === 'dateTime'));
      return (target && target.toColumn) || (t.columns.find((c) => /^date$/i.test(c.name) && c.dataType === 'dateTime') || t.columns.find((c) => c.dataType === 'dateTime') || {}).name;
    };
    // Mechanical fixes as data, shared by the Tabular Editor and TMDL versions
    function quickEdits() {
      const dates = [], edits = [], notes = [];
      const dt = findingOf('DATE_NOT_MARKED');
      if (dt) dt.items.forEach((i) => {
        const t = R.tables.find((x) => x.name === i.obj); if (!t) return;
        const dcol = dateColumn(t);
        if (dcol) dates.push({ table: t.name, column: dcol });
      });
      const ms = findingOf('MONTH_SORT');
      if (ms) ms.items.forEach((i) => {
        const p = splitObj(i.obj); if (!p) return;
        const t = R.tables.find((x) => x.name === p[0]); if (!t) return;
        const sortCol = sortColumnFor(t, p[1]);
        if (sortCol) edits.push({ table: t.name, column: p[1], set: { sortByColumn: sortCol.name }, kind: 'sort' });
        else notes.push(t.name + '[' + p[1] + ']: ' + noSortColumn(p[1]));
      });
      const sk = findingOf('SUMMARIZE_KEYS');
      if (sk) sk.items.forEach((i) => { const p = splitObj(i.obj); if (p) edits.push({ table: p[0], column: p[1], set: { summarizeBy: 'none' }, kind: 'sum' }); });
      const fk = findingOf('FK_VISIBLE');
      if (fk) fk.items.forEach((i) => { const p = splitObj(i.obj); if (p) edits.push({ table: p[0], column: p[1], set: { isHidden: true }, kind: 'hide' }); });
      return { dates, edits, notes };
    }
    // What the cleanup can safely remove. An unused column stays when something that stays needs it (a measure
    // that is only moved to the review folder, a hierarchy, a DAX table, the sort of a column that stays, a quick
    // fix), or when it is the last column of its table. Removing any of these would break the next refresh.
    function cleanupPlan() {
      const { cols, ms } = unusedData();
      const key = (t, c) => (t + '|' + c).toLowerCase();
      const qe = quickEdits();
      const fixNeeds = new Map();
      qe.edits.forEach((e) => { if (e.set.sortByColumn) fixNeeds.set(key(e.table, e.set.sortByColumn), L('the quick fixes sort ' + e.column + ' by it', 'الإصلاحات السريعة ترتّب ' + e.column + ' حسبه')); });
      qe.dates.forEach((d) => fixNeeds.set(key(d.table, d.column), L('the date column when ' + d.table + ' is marked as a date table', 'عمود التاريخ عند تعليم ' + d.table + ' كجدول تاريخ')));
      const out = new Map(); // key -> { t, c }: removed in Power Query (data columns) or deleted by hand (calculated columns)
      cols.forEach((x) => x.u.forEach((c) => { if ((c.kind === 'data' && x.t.fromM) || c.kind === 'calculated') out.set(key(x.t.name, c.name), { t: x.t, c }); }));
      const kept = [];
      const keep = (k, why) => { const x = out.get(k); out.delete(k); kept.push({ t: x.t.name, c: x.c.name, why }); };
      R.tables.filter((t) => !t.auto && t.columns.length && t.columns.every((c) => out.has(key(t.name, c.name)))).forEach((t) => t.columns.forEach((c) => keep(key(t.name, c.name),
        t.used === false ? L('nothing in ' + t.name + ' is used: delete the whole table instead', 'لا شيء في ' + t.name + ' مستخدم: احذف الجدول كله بدلًا من ذلك') : L(t.name + ' would have no columns left', 'لن يبقى في ' + t.name + ' أي عمود'))));
      const what = (d) => (d.type === 'measure' ? '[' + d.name + ']' : d.type === 'column' ? d.table + '[' + d.name + ']' : d.type === 'hierarchy' ? L('hierarchy ', 'التسلسل الهرمي ') + d.table + '[' + d.name + ']' : d.type === 'function' ? d.name + '()' : d.name);
      for (let changed = true; changed;) {
        changed = false;
        Array.from(out.keys()).forEach((k) => {
          const x = out.get(k);
          const needs = (x.c.neededBy || []).filter((d) => !(d.type === 'column' && out.has(key(d.table, d.name))));
          if (fixNeeds.has(k)) keep(k, fixNeeds.get(k));
          else if (needs.length) keep(k, L('still needed by ', 'ما زال يحتاجه ') + needs.slice(0, 3).map(what).join(', ') + (needs.length > 3 ? ' …' : ''));
          else return;
          changed = true;
        });
      }
      const pq = [], calc = [];
      cols.forEach((x) => {
        const names = x.u.filter((c) => c.kind === 'data' && out.has(key(x.t.name, c.name))).map((c) => c.sourceColumn || c.name);
        if (names.length) pq.push({ t: x.t, names });
        x.u.forEach((c) => { if (c.kind === 'calculated' && out.has(key(x.t.name, c.name))) calc.push({ t: x.t.name, c: c.name }); });
      });
      return { pq, calc, kept, ms };
    }
    function tmdlScripts() {
      if (!T || !R.rawTables) return null;
      const qe = quickEdits();
      const fixes = qe.edits.length ? T.columnFixes(R.rawTables, qe.edits) : null;
      const unused = R.meta.hasReport ? R.measures.filter((m) => m.used === false).map((m) => m.name) : [];
      const move = unused.length ? T.moveMeasures(R.rawTables, unused, '_Unused (review)') : null;
      // formats fixed at the source (6 Oct 2026): the same rule and the same script as the MCP's check_model_health
      const formats = T.formatReview ? T.formatReview(R.rawTables) : null;
      return { fixes, move, formats: formats && (formats.items.length || formats.byHand.length) ? formats : null, dates: qe.dates, notes: qe.notes };
    }
    function quickFixScript() {
      const lines = [];
      const q = (x) => csStr(x);
      const col = (t, c) => 'Model.Tables[' + q(t) + '].Columns[' + q(c) + ']';
      const has = (t, c) => 'Model.Tables.Contains(' + q(t) + ') && Model.Tables[' + q(t) + '].Columns.Contains(' + q(c) + ')';
      let count = 0;
      const dt = findingOf('DATE_NOT_MARKED');
      if (dt) {
        lines.push('', '// 1. Mark calendar tables as date tables');
        dt.items.forEach((i) => {
          const t = R.tables.find((x) => x.name === i.obj); if (!t) return;
          const dcol = dateColumn(t);
          if (!dcol) return;
          lines.push('if (' + has(t.name, dcol) + ') { Model.Tables[' + q(t.name) + '].DataCategory = "Time"; ' + col(t.name, dcol) + '.IsKey = true; n++; }'); count++;
        });
      }
      const ms = findingOf('MONTH_SORT');
      if (ms) {
        const out = [];
        ms.items.forEach((i) => {
          const p = splitObj(i.obj); if (!p) return;
          const t = R.tables.find((x) => x.name === p[0]); if (!t) return;
          const sortCol = sortColumnFor(t, p[1]);
          if (sortCol) { out.push('if (' + has(t.name, p[1]) + ' && Model.Tables[' + q(t.name) + '].Columns.Contains(' + q(sortCol.name) + ')) { ' + col(t.name, p[1]) + '.SortByColumn = ' + col(t.name, sortCol.name) + '; n++; }'); count++; }
          else out.push('// ' + t.name + '[' + p[1] + ']: ' + noSortColumn(p[1]) + ' found. Add one, then sort by it.');
        });
        if (out.length) lines.push('', '// 2. Sort month and day names by their number'), lines.push.apply(lines, out);
      }
      const sk = findingOf('SUMMARIZE_KEYS');
      if (sk) {
        lines.push('', '// 3. IDs, years and codes: do not summarize');
        sk.items.forEach((i) => { const p = splitObj(i.obj); if (p) { lines.push('if (' + has(p[0], p[1]) + ') { ' + col(p[0], p[1]) + '.SummarizeBy = AggregateFunction.None; n++; }'); count++; } });
      }
      const fk = findingOf('FK_VISIBLE');
      if (fk) {
        lines.push('', '// 4. Hide key columns on the many side of relationships');
        fk.items.forEach((i) => { const p = splitObj(i.obj); if (p) { lines.push('if (' + has(p[0], p[1]) + ') { ' + col(p[0], p[1]) + '.IsHidden = true; n++; }'); count++; } });
      }
      if (!count) return null;
      return { count, code: '// DataArcus Model Health Check: quick fixes (' + count + ' changes). Save a copy of your file first.\n// Tabular Editor: C# Script tab, paste, run (F5), then save (Ctrl+S).\nint n = 0;' + lines.join('\n') + '\n\nInfo(n + " quick fixes applied. Save the model to keep them.");' };
    }

    const cleanup = R.meta.hasReport ? cleanupPlan() : { pq: [], calc: [], kept: [], ms: [] };
    const quick = quickFixScript(), tm = tmdlScripts(), scripts = {};
    // Ready-to-paste cleanup: Power Query steps for unused source columns, Tabular Editor scripts for unused measures
    cleanup.pq.forEach((x, i) => { scripts['pq:' + i] = '= Table.RemoveColumns(#"Previous step", {' + x.names.map(mStr).join(', ') + '}, MissingField.Ignore)'; });
    if (cleanup.ms.length) {
      const list = 'var names = new[] {\n    ' + cleanup.ms.map((m) => csStr(m.name)).join(',\n    ') + '\n};\n';
      scripts['te:move'] = '// DataArcus Model Health Check: move measures no visual uses into a review folder (safe, nothing is deleted)\n' + list + 'foreach (var n in names) {\n    var m = Model.AllMeasures.FirstOrDefault(x => x.Name == n);\n    if (m != null) m.DisplayFolder = string.IsNullOrEmpty(m.DisplayFolder) ? ' + csStr('_Unused (review)') + ' : ' + csStr('_Unused (review)\\') + ' + m.DisplayFolder;\n}';
      scripts['te:delete'] = '// DataArcus Model Health Check: delete measures no visual uses. Save a copy of your file first.\n' + list + 'foreach (var n in names) {\n    var m = Model.AllMeasures.FirstOrDefault(x => x.Name == n);\n    if (m != null) m.Delete();\n}';
    }
    if (quick) scripts['te:quick'] = quick.code;
    if (tm && tm.fixes && tm.fixes.script) scripts['tmdl:fixes'] = tm.fixes.script;
    if (tm && tm.move && tm.move.script) scripts['tmdl:move'] = tm.move.script;
    if (tm && tm.formats && tm.formats.script) scripts['tmdl:formats'] = tm.formats.script;
    return { broken: findingOf('BROKEN_REF') || null, quick, tmdl: tm, cleanup, scripts };
  }

  const api = { plan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHFixPlan = api;
})(typeof self !== 'undefined' ? self : this);
