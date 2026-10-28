/*
 * DataArcus - Power BI project export: bring your own semantic model.
 * Reads the structure of the user's model in the browser (nothing is uploaded), suggests which of their
 * fields goes in each visual of the design, and lets them change every choice before the download.
 * Inputs: a project's .SemanticModel folder (TMDL or model.bim), a model.bim, or a .pbit.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  // the one field-meaning rule (assets/js/field-meaning.js, shared with the health check: the block audit's A1-11, 11 Oct)
  const FM = typeof require === 'function' && typeof module === 'object' && module.exports ? require('./field-meaning.js') : root.DataArcusFieldMeaning;
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
  // ---------- reading the model ----------
  const decodeText = (u8) => {
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8.length >= 2 && u8[1] === 0x00) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  };
  // (the audit's A1-8: one TMDL parse for the website and the MCP: a TMDL folder is read by tmdl-model.js into the
  // model's JSON, as a model.bim is, and the picker's fields and relationships come from that JSON; this file has no
  // TMDL parser of its own any more)
  const Tmdl = () => (typeof module !== 'undefined' && module.exports ? require('./tmdl-model.js') : root.TmdlModel);
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
    return (m.relationships || []).filter((r) => r && r.fromTable && r.toTable && r.isActive !== false && String(r.isActive) !== 'false' && r.active !== false).map((r) => Object.assign({ fromTable: String(r.fromTable), toTable: String(r.toTable) }, /^bothDirections$/i.test(r.crossFilteringBehavior || r.cross || '') ? { both: true } : {})); };   // (part 5: both: filters both ways)
  // Power BI's hidden automatic date tables are not fields anyone picks
  const clean = (tables) => tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));

  // The MCP reader's limits (mcp/lib/model.mjs PBIT_LIMITS, the Health Check worker's too): a file over them is refused
  // before it is read (the audit of the reading block, "seen": the website read a model.bim of any size)
  const MB = 1024 * 1024, LIMITS = { model: 64 * MB, entry: 32 * MB, total: 128 * MB, file: 300 * MB };
  const tooBig = () => new Error('TOO_BIG');
  // A folder from <input webkitdirectory>: the .SemanticModel folder itself, or a project folder holding one.
  // A model is known by its whole path, not its name: a copy with the same name in a subfolder (a backup) is another
  // model, and the one nearest the top of the chosen folder is used.
  async function fromFolder(fileList) {
    const files = Array.from(fileList || []), rel = (f) => f.webkitRelativePath || f.name;
    // .Dataset is the older name of the model folder, still in Microsoft's own definition.pbir example
    const modelOf = (f) => { const m = rel(f).match(/^((?:[^/]+\/)*?[^/]+\.(?:SemanticModel|Dataset))\//i); return m ? m[1] : null; };
    const depth = (p) => p.split('/').length;
    const models = [...new Set(files.map(modelOf).filter(Boolean))].sort((a, b) => depth(a) - depth(b) || (a < b ? -1 : a > b ? 1 : 0));
    if (!models.length) throw new Error('NO_SEMANTIC_MODEL');
    const path = models[0], folder = path.replace(/^.*\//, ''), inside = files.filter((f) => modelOf(f) === path);
    const bim = inside.find((f) => /\/model\.bim$/i.test(f.webkitRelativePath || f.name));
    let tables, relationships = [];
    if (bim && (bim.size || 0) > LIMITS.model) throw tooBig();
    if (bim) { const j = JSON.parse(decodeText(new Uint8Array(await bim.arrayBuffer()))); tables = fromTmsl(j); relationships = relsOfTmsl(j); }
    else {
      const tmdl = inside.filter((f) => /\/definition\/.+\.tmdl$/i.test(f.webkitRelativePath || f.name));
      if (!tmdl.some((f) => /\/definition\/tables\/[^/]+\.tmdl$/i.test(f.webkitRelativePath || f.name))) throw new Error('NO_MODEL');
      if (tmdl.some((f) => (f.size || 0) > LIMITS.entry) || tmdl.reduce((n, f) => n + (f.size || 0), 0) > LIMITS.total) throw tooBig();
      const parts = [];
      for (const f of tmdl) parts.push({ path: rel(f).slice(path.length + 1), text: decodeText(new Uint8Array(await f.arrayBuffer())) });
      const j = Tmdl().fromFiles(parts);
      tables = fromTmsl(j); relationships = relsOfTmsl(j);
    }
    // the reports already next to the model (X.Report folders, X.pbip files), so the new one never takes their name
    const dir = path.includes('/') ? path.replace(/\/[^/]*$/, '') + '/' : '', reports = new Set();
    files.forEach((f) => {
      const p = rel(f); if (!p.startsWith(dir)) return;
      const m = p.slice(dir.length).match(/^([^/]+)\.pbip$|^([^/]+)\.Report\//i); if (m) reports.add(m[1] || m[2]);
    });
    return { folder, path, others: models.length - 1, reports: [...reports], tables: clean(tables), relationships };
  }
  // A model.bim, or a .pbit (unzipped by the Model Health Check's worker, which already reads them)
  function fromFile(file, workerUrl) {
    if (/\.pbix$/i.test(file.name)) return Promise.reject(new Error('PBIX'));
    if ((file.size || 0) > (/\.pbit$/i.test(file.name) ? LIMITS.file : LIMITS.model)) return Promise.reject(tooBig());
    return file.arrayBuffer().then((buf) => {
      const u8 = new Uint8Array(buf);
      if (!(u8[0] === 0x50 && u8[1] === 0x4b)) { const j = JSON.parse(decodeText(u8)); return { tables: clean(fromTmsl(j)), relationships: relsOfTmsl(j) }; }
      return new Promise((resolve, reject) => {
        const w = new Worker(workerUrl);
        w.onmessage = (ev) => {
          const d = ev.data;
          if (d.type === 'done') { w.terminate(); resolve({ tables: clean(fromTmsl({ tables: d.result.rawTables })), relationships: relsOfTmsl({ relationships: d.result.relationships }) }); }
          else if (d.type === 'error') { w.terminate(); reject(new Error(d.code)); }
        };
        w.onerror = () => { w.terminate(); reject(new Error('PARSE')); };
        w.postMessage({ buffer: buf, fileName: file.name }, [buf]);
      });
    });
  }

  // ---------- suggestions ----------
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
  // S4: a measure that needs one period: blank over the whole date range, or guarded on one selected value
  const NEEDS_PERIOD = /\b(PREVIOUS(DAY|MONTH|QUARTER|YEAR)|NEXT(DAY|MONTH|QUARTER|YEAR)|PARALLELPERIOD|HASONEVALUE|HASONEFILTER|ISFILTERED|ISINSCOPE)\s*\(/i;
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
  // The name words, one named tie-break (builder 7's audit A3-6, 11 Oct: the rank is the measure's shape first; these
  // English and Arabic words only break ties between measures of the same shape, +0.5 each; a model in another
  // language ranks by shape alone): money words and count words
  const TIEBREAK_WORDS = { money: /revenue|sales|amount|income|profit|value|bookings|orders|leads|deals|calls|visits|spend|cost|budget|الإيرادات|المبيعات|الأرباح|الطلبات|الميزانية/i, count: /total|count|number|#|qty|quantity|units|customers|clients|tickets|إجمالي|عدد/i };
  const CAT = /category|product|brand|region|country|city|emirate|segment|channel|type|status|department|store|branch|source|platform|model|team|group|class|stage|agent|rep|salesperson|campaign|الفئة|المنتج|العلامة|المنطقة|المدينة|القناة|الفرع|المصدر/i;
  // (round 23, the owner's "nothing critical left": "Order Id", "Invoice No" and "Customer Code" were chart categories:
  // an identifier's last word (id, key, code, guid, sk, no, num, number) is read without regard to case; the other words
  // as before; a camel-case end, OrderID, InvoiceNo, stays case-sensitive: "Paid" and "Casino" are words)
  const NOT_CAT_OLD = /(^|[\s_-])(id|key|code|guid|sk|sort|order|index|url|link|email|phone|mobile|address|description|notes?|comments?|remarks?)s?$|[a-z]ID$|Key$/;
  const NOT_CAT_ID = /(^|[\s_-])(id|key|code|guid|sk|no|num|number)s?$/i, NOT_CAT_CAMEL = /[a-z](Id|No|Code)$/;
  // (round 23 part 5, the review's 9: read without an Arabic mark, so "Order No (AR)" is an identifier too)
  const NOT_CAT = { test: (x0) => { const x = String(x0).replace(/\s*\((arabic|عربي|ar)\)\s*$/i, ''); return NOT_CAT_OLD.test(x) || NOT_CAT_ID.test(x) || NOT_CAT_CAMEL.test(x); } };
  // a calendar by its name (the block audit's A3-1, 11 Oct: tested without word boundaries, "Candidates", "Updates",
  // "Mandates", "Overtime" and "Time Sheets" were calendars and lost their categories): only a name that ends with a
  // calendar word (Date, Dates, Calendar: "Gulf Calendar", "Dim Date"), or is one (Time, Period), Arabic too
  const CAL_NAME = /(^|\s)(dates?|calendar)(\s*table)?$|^(dim\s*)?(time|period|periods)$|(^|\s)(التقويم|تقويم|التاريخ)$/i;
  const splitName = (n) => String(n).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  // names that read as a number or a date, for columns whose type the files don't give
  const NUMBERISH = /amount|qty|quantity|price|cost|value|sales|revenue|total|count|number|units|profit|margin|rate|score|percent|%|offset|sort|المبلغ|الكمية|السعر|القيمة|المبيعات|العدد/i;
  const DATEISH = /date|time|stamp|تاريخ|وقت/i;
  // the date table's parts that make good categories when the model has no other ones, in order of preference
  const DATE_PARTS = [/^(year\s*)?quarter$|الربع/i, /^(day|weekday)\s*name$|اسم اليوم/i, /^(hijri\s*)?month\s*name$|اسم الشهر/i];

  // Month and weekday names sort A to Z unless the model gives them a sort-by column. For such a column without one,
  // sortColumnFor finds the number column of the same table to sort by (the same rule as the Model Health Check's fix
  // script, model-health-tmdl.js: keep the two alike; mcp/test.mjs compares them): a year-month number for "Month
  // Year", a weekday number for a day name, a month number for a month name; a Hijri or fiscal name only by a Hijri or
  // fiscal number. The report then sorts its charts by it, without touching the model.
  const NAME_LIKE = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$|^(اسم\s*)?(الشهر|اليوم)$/i;
  const sortKind = (name) => (/month|الشهر/i.test(name) && /year|السنة/i.test(name) ? 'yearMonth' : /day|week|اليوم/i.test(name) ? 'day' : 'month');
  const SORT_BY = {
    yearMonth: /^(year\s*-?\s*month|month\s*-?\s*year|yyyymm)\s*(no|num|number|index|key|sort|order|id)?$/i,
    day: /(weekday|day\s*of\s*week)\s*(no|num|number|index)?$|^weekday$|^رقم\s*اليوم$/i,
    month: /month\s*(no|num|number|index)$|^month$|month\s*of\s*year|^رقم\s*الشهر$/i
  };
  const FAMILY = /hijri|fiscal|هجري|مالي/i;
  const family = (n) => (String(n).match(FAMILY) || [''])[0].toLowerCase();
  // the Gulf calendar's Arabic name columns ("Day Name (Arabic)") are the same kind of name as their English ones
  const ARABIC_SUFFIX = /\s*\((arabic|عربي)\)\s*$/i;
  const nameLike = (name) => NAME_LIKE.test(String(name).replace(ARABIC_SUFFIX, '').replace(FAMILY, '').trim());
  // a column's type as the readers give it, lower case; a column given with none (a DAX table's, a caller's own) is
  // unknown, never text (RULES-POWERBI.md: a missing type defaulted to text gives wrong findings; SQ13, 0.2.9-reader-S13)
  const colType = (c) => String((c && c.dataType) || 'unknown').toLowerCase();
  function sortColumnFor(columns, name) {
    if (!nameLike(name)) return null;
    const kind = sortKind(name), fam = family(name);
    // a column the files give no type for (a DAX table's) counts only when its name says it is a number ("Month
    // Number", "Year Month Sort", "Day of Week"): "Year Month" or "Month" alone may be text
    const type = colType, plain = (c) => c.name.replace(FAMILY, '').trim();
    const numberName = /(no|num|number|index|key|sort|order|id)$|day\s*of\s*week|month\s*of\s*year|^رقم/i;
    const ok = (c) => c.name !== name && family(c.name) === fam && SORT_BY[kind].test(plain(c)) && (/^(int64|double|decimal|number)$/.test(type(c)) || (type(c) === 'unknown' && numberName.test(plain(c))));
    return columns.find(ok) || null;
  }
  // Round 23 (the owner's rule, 8 Oct 2026: "in any model I want to make sure English in English reports and Arabic in
  // Arabic reports"; found in the 0.2.7 install test: on a bilingual model, Sales[City] and Sales[المدينة], an English
  // report took Sales[المدينة] for its column chart, its table and a slicer beside the City slicer). A field's language
  // is read from its name only (metadata, never its data): Arabic letters, or a name that says it is Arabic (the Gulf
  // calendar's "Day Name (Arabic)", "(AR)", "_ar", " AR"), is "ar"; Latin letters "en"; anything else (and a column that
  // is not text) none. Twins: an "ar" and an "en" text column of the same table that hold the same thing; the names
  // cannot tell a translation, so a twin is the one with the same name less its Arabic mark, else the same data
  // category, else the column next to it, each column in one pair at most.
  const AR_SCRIPT = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  // (round 23 part 5, the review's 8: "AR" or "_ar" alone is not a mark: "Aging AR" is accounts receivable; "(AR)",
  // "(Arabic)", the word Arabic, and Arabic letters are)
  // (part 6, the re-review's 3: the word Arabic only at the end or the start: "Non-Arabic Customers", "Is Arabic
  // Speaker" and "Name_Arabic_Short" are English names)
  const AR_MARK = /\s*\((arabic|عربي|ar)\)\s*$|[\s_-]+arabic$|^arabic[\s_-]+/i;
  // (part 6, the re-review's 2: "City_AR", "ProductName_ar", "Name AR" are the common bilingual habit, so a trailing
  // _AR, -AR or " AR" is Arabic where the same table has the English column of that name (City + City_AR); alone
  // ("Aging AR", accounts receivable) it stays English. Set in catalog, which sees the table)
  const AR_SUFFIX = /[\s_-]ar$/i;
  const langOf = (name) => { const n = String(name == null ? '' : name); return AR_SCRIPT.test(n) || AR_MARK.test(n) ? 'ar' : /[A-Za-z]/.test(n) ? 'en' : null; };
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
  function suggest(tables, nKpis, opt) {
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
    // counts only (a year of 2 values or more, a year-month of 13 or more); not known: the month name stays and the
    // answer says so. (A calendar's own DAX years were tried and left out: they moved every DAX calendar's axis, golden
    // tasks 1, 2 and 12 among them, to a year-month ordered by the report, untested in Desktop: mcp/work/FX4.md)
    if (date && !/date/.test(date.type) && /month|الشهر/i.test(date.c) && sortKind(date.c) !== 'yearMonth' && !(opt && opt.pinned && opt.pinned.date)) {
      const all = ((opt && opt.modelTables) || []).concat(tables), tb = all.find((t) => t.name === date.t), raw = (tb && tb.columns) || [];
      const ymName = (n) => sortKind(n) === 'yearMonth' && /month/i.test(n) && /year/i.test(n);
      const yc = raw.filter((c) => /^(calendar\s*|fiscal\s*)?year$/i.test(c.name) && !/fiscal/i.test(c.name)).map((c) => ST.distinct(date.t, c.name)).find((n) => n != null);
      const ym = raw.filter((c) => ymName(c.name)).map((c) => ST.distinct(date.t, c.name)).find((n) => n != null);
      const span = yc != null ? (yc > 1 ? `${num(yc)} years by the model's counts` : null) : ym != null ? (ym > 12 ? `${num(ym)} months by the model's counts` : null) : undefined;
      const to = span ? (columns.find((c) => c.t === date.t && ymName(c.c) && monthText(c)) || columns.find((c) => c.t === date.t && dayDate(c)) || inDate.find(dayDate)) : null;
      if (to) { say(fieldKey(to.t, to.c), `The time axis is ${to.c}, not ${date.c}: the dates span more than one year (${span}), and a month name would add up the same month of every year in one point.`); date = to; }
      else if (span === undefined) say(fieldKey(date.t, date.c), `${date.c} is the time axis; the date range is not known (no counts given). If the dates span more than one year, use a year-month column or the date instead.`);
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
    const out = build(ch);
    Object.assign(out, langNote(L, note));
    if (noCategory && !P.catA && !P.catB) out.noCategory = 'The model has no text column outside its calendar to group by, so the charts by category are left out: say it in the plan (a calendar\'s year, month or day belongs on the trend).';
    if (excluded.length) out.excluded = excluded;
    if (axisBy) out.axisBy = axisBy;
    if (calendarNames.length) out.calendarNames = calendarNames;
    // (D17: a card whose format is set by DAX beside cards in a currency: told, so the plan can say it or pick another)
    const cardsNow = (ch.kpis || []).filter(Boolean);
    // (round 8: an amount with no format at all beside them too: its card shows no currency either)
    const mixed = (x) => metaOf(x).dynamic || (metaOf(x).amount && metaOf(x).unformatted);
    if (cardsNow.some(mixed) && cardsNow.some((x) => metaOf(x).currency)) out.formatsMixed = cardsNow.filter(mixed).map((x) => Object.assign({ t: x.t, m: x.m }, metaOf(x).dynamic ? {} : { unformatted: true }));
    if (swaps.length) out.calendarSwaps = swaps;
    // (round 23: no time axis because the measure reaches no calendar of the model: said with the calendars' names)
    // (part 8, the review's 3: a date column of a table the measure does not reach, with no marked calendar, is named too:
    // kind 'date', "no date column is related to")
    if (!out.date && reach) { const cal = [...new Set(columns.filter((c) => c.dateTable && !reach.has(c.t)).map((c) => c.t))], dt = [...new Set(columns.filter((c) => !c.dateTable && /date/.test(c.type) && !reach.has(c.t)).map((c) => c.t))];
      if (cal.length) out.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: cal.slice(0, 5), kind: 'calendar' };
      else if (dt.length) out.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: dt.slice(0, 5), kind: 'date' }; }
    if (!cats.length && unreached.length && !ch.catA && !ch.catB) out.noRelatedCategory = { measure: { t: anchor.t, m: anchor.m }, tables: [...new Set(unreached.map((c) => c.t))].slice(0, 5) };
    // every column a slicer could take, in the order they are picked (round 12, #22)
    out.slicerPool = pool;
    // the categories a page's charts can take, in the picker's order (round 16, design finding #18: the operations
    // layout drew two bar charts and a donut all by Quarter): the writer gives each chart of a page one not used there yet;
    // none when the plan names its categories (round 16: they are kept as given)
    if (!P.catA && !P.catB) out.catPool = cats.slice(0, 8).map(inAr).filter((x, i, l) => l.indexOf(x) === i).map((c) => Object.assign({ t: c.t, c: c.c }, c.sortBy ? { sortBy: c.sortBy } : {}, c.ordered ? { ordered: true } : {}, c.time != null ? { time: c.time } : {}, c.cal ? { cal: c.cal } : {}, metaOf(c).short ? { short: metaOf(c).short } : {}));
    // the measures left behind that were not picked, so the caller can say so (none: no such key)
    const skipped = ranked.filter((x) => x.stale && !kpis.includes(x) && x !== main).map((x) => ({ t: x.t, m: x.m }));
    if (skipped.length) out.skipped = skipped;
    // (FX4) why: one plain line per field a rule acted on, capped; counts given for names the model does not have
    if (why.length) { out.why = why.slice(0, WHY_MAX); if (why.length > WHY_MAX) out.whyNotListed = why.length - WHY_MAX; }
    if (ST.notInModel.length) out.statsNotInModel = ST.notInModel.slice(0, WHY_MAX);
    return out;
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

  // ---------- the field picker ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // field names keep their own direction inside an Arabic page ("Discount %" does not become "% Discount")
  const iso = (s) => '\u2068' + s + '\u2069';
  const key = (x) => (x ? JSON.stringify([x.t, x.m != null ? 'm' : 'c', x.m != null ? x.m : x.c]) : '');
  // rows: [label, kind ('m' measure, 'c' column), current choice, path in the choices]
  function renderPicker(el, tables, bind, L) {
    const { measures, columns } = catalog(tables);
    const ch = bind.choices;
    const opts = (list, kind, cur) => {
      const byTable = {};
      list.forEach((x) => { (byTable[x.t] = byTable[x.t] || []).push(x); });
      return `<option value="">${esc(L('(leave empty)', '(اتركه فارغًا)'))}</option>` + Object.keys(byTable).map((t) => `<optgroup label="${esc(iso(t))}">${byTable[t].map((x) => {
        const k = key(x); return `<option value="${esc(k)}"${k === key(cur) ? ' selected' : ''}>${esc(iso(kind === 'm' ? x.m : x.c))}</option>`; }).join('')}</optgroup>`).join('');
    };
    const row = (label, kind, cur, path) => `<label class="tg-bind-row"><span>${esc(label)}</span><select class="form-select form-select-sm" data-path="${path}" data-kind="${kind}">${opts(kind === 'm' ? measures : columns, kind, cur)}</select></label>`;
    el.innerHTML = [
      `<div class="tg-bind-sec">${esc(L('KPI cards', 'بطاقات المؤشرات'))}</div>`,
      ...ch.kpis.map((k, i) => row(L('KPI ', 'المؤشر ') + (i + 1), 'm', k, 'kpis.' + i)),
      `<div class="tg-bind-sec">${esc(L('Charts', 'المخططات'))}</div>`,
      row(L('Main measure', 'المقياس الرئيسي'), 'm', ch.main, 'main'),
      row(L('Time axis (trend)', 'محور الزمن (الاتجاه)'), 'c', ch.date, 'date'),
      row(L('Category (bar, donut)', 'الفئة (أعمدة أفقية، دائري)'), 'c', ch.catA, 'catA'),
      row(L('Second category (column, table)', 'فئة ثانية (أعمدة، جدول)'), 'c', ch.catB, 'catB'),
      `<div class="tg-bind-sec">${esc(L('Filters', 'الفلاتر'))}</div>`,
      ...[0, 1, 2].map((i) => row(L('Slicer ', 'المقسم ') + (i + 1), 'c', ch.slicers[i], 'slicers.' + i))
    ].join('');
    const all = { m: measures, c: columns };
    let current = bind;
    // drawn again when the layout changes: the previous picker's listener goes
    if (el.daPick) el.removeEventListener('change', el.daPick);
    el.addEventListener('change', el.daPick = (e) => {
      const s = e.target.closest('select[data-path]'); if (!s) return;
      const pick = all[s.dataset.kind].find((x) => key(x) === s.value) || null;
      const [a, i] = s.dataset.path.split('.');
      const next = Object.assign({}, current.choices, { kpis: current.choices.kpis.slice(), slicers: current.choices.slicers.slice() });
      if (i != null) next[a][+i] = pick; else next[a] = pick;
      current = build(next);
    });
    return () => current;
  }

  // Connection string for a model published in a Power BI workspace (the form Microsoft documents for definition.pbir)
  const connection = (workspace, model) => {
    const qv = (v) => '"' + String(v).trim().replace(/"/g, '""') + '"';
    return 'Data Source=' + qv('powerbi://api.powerbi.com/v1.0/myorg/' + String(workspace).trim()) + ';initial catalog=' + qv(model) + ';access mode=readonly;integrated security=ClaimsToken';
  };

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
