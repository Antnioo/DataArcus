/*
 * DataArcus - Power BI project export: bring your own semantic model.
 * Reads the structure of the user's model in the browser (nothing is uploaded), suggests which of their
 * fields goes in each visual of the design, and lets them change every choice before the download.
 * Inputs: a project's .SemanticModel folder (TMDL or model.bim), a model.bim, or a .pbit.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  // (0.3.2 SP30) the model's metadata, normalised: field-catalog.js (the {tables, relationships, fields} contract, every
  // field and measure rule, the relationship traversal); this file keeps the binding and re-exports the catalog's names
  const C = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./field-catalog.js') : root.DAFieldCatalog;
  const { fromTmsl, relsOfTmsl, clean, markCalendars, catalog, fieldOf, measureOf, measureCard, isPercent, dateColumnFor, sortColumnFor, isDateTable, nameLike, langOf, langsOf, twinsOf, fieldKey, exprOf, metaOf, readTables, reachTable } = C;
  // ---------- reading the model ----------
  // (the audit's A1-8: one TMDL parse for the website and the MCP: a TMDL folder is read by tmdl-model.js into the
  // model's JSON, as a model.bim is, and the picker's fields and relationships come from that JSON; this file has no
  // TMDL parser of its own any more)
  const Tmdl = () => (typeof module !== 'undefined' && module.exports ? require('./tmdl-model.js') : root.TmdlModel);

  // the browser's input (0.3.2 SP14: model-import-browser.js reads a chosen folder or a model.bim / .pbit, with the size
  // limits and the .pbix refusal; it calls this file's parsers, handed over here, never copies of them)
  const Import = () => (typeof module !== 'undefined' && module.exports ? require('./model-import-browser.js') : root.DAModelImport);
  const readers = { fromTmsl, relsOfTmsl, clean, tmdl: Tmdl };
  // A folder from <input webkitdirectory> (the .SemanticModel folder itself, or a project folder holding one)
  const fromFolder = (fileList) => Import().fromFolder(fileList, readers);
  // A model.bim, or a .pbit (unzipped by the Model Health Check's worker at workerUrl)
  const fromFile = (file, workerUrl) => Import().fromFile(file, workerUrl, readers);

  // ---------- suggestions (0.3.2 SP30: ranked by field-suggest.js; the binding of its choices is build's, below) ----------
  const S = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./field-suggest.js') : root.DAFieldSuggest;
  const { counts, statsOf } = S;
  // the binding for a model: build of the ranked choices, with the notes beside it (the same answer as before the split)
  function suggest(tables, nKpis, opt) { const r = S.rank(tables, nKpis, opt); return Object.assign(build(r.choices), r.notes); }
  // the visual-by-visual binding the exporter reads, from the few choices the user makes
  function build(ch) {
    // a column the model types as a number says so (num), so a table can put it on the number side, like a measure
    // and a month or day name without a sort-by column says which number column puts it in order (sortBy)
    // (a measure keeps pct: its KPI card shows the model's own percent format, the owner's design choice 2, 5 Oct 2026)
    // (A3-3: a table's field carries the format rule's tableFormat; a card its fullFormat as cardFormat with kpiValues
    // "full", ch.full; the server no longer re-decides either)
    // (A3-2: role 'cat', a chart's category, carries its short day name; a column the visual counts or sums itself
    // (counts: agg, its name) keeps them, so a model without measures is bound here too)
    const tfOf = (x) => x.tableFormat || metaOf(x).tableFormat, shortOf = (x) => x.short || metaOf(x).short;
    const f = (x, role) => (x ? (x.m != null ? Object.assign({ t: x.t, m: x.m }, x.pct ? { pct: true } : {}, x.pctFormat ? { pctFormat: x.pctFormat } : {}, x.wholeFormat ? { wholeFormat: x.wholeFormat } : {}, x.unitAuto ? { unitAuto: true } : {},   /* (round 11, RESCORE-4: unitAuto was dropped here, so the written card kept its 2 decimals) */ role === 'table' && tfOf(x) ? { tableFormat: tfOf(x) } : {})
      : Object.assign(/^(int64|double|decimal|number)$/.test(x.type || '') || x.num ? { t: x.t, c: x.c, num: true } : { t: x.t, c: x.c }, x.sortBy ? { sortBy: x.sortBy } : {}, x.ordered ? { ordered: true } : {}, x.dateOf ? { dateOf: x.dateOf } : {}, x.time != null ? { time: x.time } : {}, x.cal ? { cal: x.cal } : {}, x.two || metaOf(x).two ? { two: true } : {}, x.texts || metaOf(x).texts ? { texts: x.texts || metaOf(x).texts } : {}, x.few || metaOf(x).few ? { few: x.few || metaOf(x).few } : {}, x.wide || metaOf(x).wide ? { wide: true } : {},
        x.agg != null ? Object.assign({ agg: x.agg }, x.name ? { name: x.name } : {}, x.wholeFormat ? { wholeFormat: x.wholeFormat } : {}) : {}, role === 'table' && tfOf(x) ? { tableFormat: tfOf(x) } : {}, role === 'cat' && shortOf(x) ? { short: shortOf(x) } : {})) : null);
    const card = (x) => { const o = f(x); return o && ch.full && x.fullFormat ? Object.assign(o, { cardFormat: x.fullFormat }) : o; };
    // the same field: a measure by its name (as before), a column by its table, name and aggregation
    const same = (x, y) => (x.m != null || y.m != null ? x.m === y.m : x.t === y.t && x.c === y.c && x.agg === y.agg);
    const kpis = (ch.kpis || []).map(card);
    const main = f(ch.main), second = kpis.find((k) => k && main && !same(k, main)) || main;
    const ratio = (ch.kpis || []).find((k) => k && k.pct);
    const A = f(ch.catA, 'cat'), Bc = f(ch.catB, 'cat');
    const uniq = (list) => list.filter((x, i) => x && list.findIndex((y) => y && JSON.stringify(y) === JSON.stringify(x)) === i);
    // (round 23 part 5, the review's 2: the table keeps only the measures that reach its rows, on every path)
    // (A3-2: a table the user names, ch.table, is kept as named, through this same field builder)
    const tf = (x) => f(x, 'table'), second0 = (ch.kpis || []).find((k) => k && ch.main && !same(k, ch.main)) || ch.main;
    const TB = ch.table ? { table: ch.table.filter(Boolean).map(tf), notReached: [] } : reachTable(uniq([tf(ch.catB) || tf(ch.catA), tf(ch.main), tf(second0), tf((ch.kpis || [])[2])]), ch.reach);
    const out = {
      choices: ch,
      kpis, measure: main, date: f(ch.date),   // an empty KPI choice leaves that card empty
      cats: { bar: A, donut: A, funnel: A, treemap: A, column: Bc, map: Bc },
      // (round 16, design finding #16: a funnel drawn on a ratio read 0.19, 1.31, "681.9%"): a funnel shows an amount,
      // never a percent; with none, it has no measure and is left out (and told)
      y: { funnel: [second, main].concat(kpis).find((k) => k && !k.pct) || null, gauge: f(ratio) || main },
      table: TB.table,
      slicers: (ch.slicers || []).map(f),
      // the category tooltip's chart shows a base measure other than the main one, else the main one: never a variant
      // ("last Ramadan", "previous", "vs") or a ratio, which is empty or meaningless for one hovered item
      // the tooltip's trend by month: the time axis when it is a month column (a date column would give a column per day)
      // (round 23, the laptop's W1: the tooltip's bar by A shows a measure that reaches A's table, by the table's rule;
      // the second KPI of an unrelated fact table repeated one total on every bar)
      // (part 8, the review's 1: every chart that opens that tooltip filters it by its own category, the line chart by the
      // month: the measure reaches each of those tables, A's, B's and the time axis's)
      tip: { card: card(ch.main), cat: f(ch.catA), y: f((ch.kpis || []).find((k) => k && ch.main && !same(k, ch.main) && !k.variant && !k.pct && (!ch.reach || [A, Bc, ch.date].filter(Boolean).every((c) => !reachTable([c, k], ch.reach).notReached.length)))) || main, date: ch.date && /month|\u0627\u0644\u0634\u0647\u0631/i.test(ch.date.c) ? f(ch.date) : null }
    };
    if (TB.notReached.length) out.notReached = TB.notReached;
    return out;
  }

  // ---------- the field picker (drawn by field-picker-ui.js, SP8: it gets the catalog's fields and the binding, and
  // gives back the binding the visitor's choices make, through build) ----------
  // field names keep their own direction inside an Arabic page ("Discount %" does not become "% Discount")
  const iso = (s) => '\u2068' + s + '\u2069';
  const Picker = () => (typeof module !== 'undefined' && module.exports ? require('./field-picker-ui.js') : root.DAFieldPicker);
  function renderPicker(el, tables, bind, L) { return Picker().render(el, catalog(tables), bind, L, { build, iso }); }

  // Connection string for a model published in a Power BI workspace (the form Microsoft documents for definition.pbir)
  const connection = (workspace, model) => {
    const qv = (v) => '"' + String(v).trim().replace(/"/g, '""') + '"';
    return 'Data Source=' + qv('powerbi://api.powerbi.com/v1.0/myorg/' + String(workspace).trim()) + ';initial catalog=' + qv(model) + ';access mode=readonly;integrated security=ClaimsToken';
  };

  // every field of a binding mapped by fn (a display name, a format), as copies: a field the binding shares (the bar's
  // and the donut's category) stays shared, and the picker's own fields are never changed (A3-2: the server's named()
  // used to set name on them in place)
  const FIELD_KEYS = ['date', 'measure', 'kpis', 'cats', 'y', 'table', 'slicers', 'tip', 'catPool', 'slicerPool'];
  function mapFields(bind, fn) {
    if (!bind) return bind;
    const done = new Map(), one = (x) => { if (!x || typeof x !== 'object') return x; if (!done.has(x)) done.set(x, fn(x)); return done.get(x); };
    const each = (v) => (Array.isArray(v) ? v.map(one) : v && typeof v === 'object' && v.t == null ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, one(x)])) : one(v));
    return Object.assign({}, bind, Object.fromEntries(FIELD_KEYS.filter((k) => bind[k] != null).map((k) => [k, each(bind[k])])));
  }
  const api = { dateColumnFor, mapFields, fieldOf, measureOf, isDateTable, markCalendars, exprOf, fieldKey, langOf, langsOf, twinsOf, reachTable, readTables, relsOfTmsl, isPercent, measureCard, nameLike, iso, fromTmsl, fromFolder, fromFile, suggest, statsOf, build, counts, sortColumnFor, renderPicker, connection };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DABind = api;
})(typeof self !== 'undefined' ? self : this);
