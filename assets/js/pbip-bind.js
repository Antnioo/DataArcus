/*
 * DataArcus - Power BI project export: bring your own semantic model.
 * Reads the structure of the user's model in the browser (nothing is uploaded), suggests which of their
 * fields goes in each visual of the design, and lets them change every choice before the download.
 * Inputs: a project's .SemanticModel folder (TMDL or model.bim), a model.bim, or a .pbit.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  // ---------- reading the model ----------
  const decodeText = (u8) => {
    if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) return new TextDecoder('utf-8').decode(u8.subarray(3));
    if (u8.length >= 2 && u8[1] === 0x00) return new TextDecoder('utf-16le').decode(u8);
    return new TextDecoder('utf-8').decode(u8);
  };
  // TMDL names: plain, or in single quotes with '' for a quote; a name ends at " =" or the end of the line
  function tmdlName(rest) {
    rest = rest.trim();
    if (rest[0] === "'") {
      let out = '', i = 1;
      for (; i < rest.length; i++) {
        if (rest[i] === "'") { if (rest[i + 1] === "'") { out += "'"; i++; } else break; } else out += rest[i];
      }
      return out;
    }
    return rest.replace(/\s*=.*$/, '').trim();
  }
  // Only what the field picker needs: tables, their columns (type, hidden, category) and measures (hidden, format).
  // Expressions are skipped, fenced (```) or not, since they sit deeper than the properties.
  function parseTmdl(text) {
    const tables = [];
    let table = null, cur = null, fence = false;
    text.split(/\r?\n/).forEach((raw) => {
      const line = raw.replace(/^( {4})+/, (s) => '\t'.repeat(s.length / 4));
      const trimmed = line.trim();
      if (fence) { if (trimmed === '```') fence = false; else if (cur && cur.isMeasure) { addExpr(cur, trimmed); if (divides(trimmed)) cur.divides = true; } return; }
      if (/=\s*```\s*$/.test(trimmed)) fence = true;
      if (!trimmed || trimmed.startsWith('///')) return;
      const depth = line.match(/^\t*/)[0].length;
      if (depth === 0) {
        const m = trimmed.match(/^table\s+(.+)$/);
        table = m ? { name: tmdlName(m[1]), hidden: false, date: false, columns: [], measures: [] } : null;
        if (table) tables.push(table);
        cur = null;
      } else if (depth === 1 && table) {
        const m = trimmed.match(/^(column|measure)\s+(.+)$/);
        if (m) {
          // a column with no dataType line (columns of DAX tables in a project Desktop saved) is 'unknown', never
          // guessed as text: guessing made numbers and dates look like categories (a chart "by Amount")
          cur = m[1] === 'column' ? { name: tmdlName(m[2]), dataType: 'unknown', isHidden: false } : { name: tmdlName(m[2]), isHidden: false, divides: divides(m[2].replace(/^('(?:[^']|'')*'|[^=]*)=/, '')) };
          if (m[1] === 'measure') { Object.defineProperty(cur, 'isMeasure', { value: true }); addExpr(cur, m[2].replace(/^('(?:[^']|'')*'|[^=]*)=/, '').replace(/```\s*$/, '')); }
          table[m[1] === 'column' ? 'columns' : 'measures'].push(cur);
        } else {
          cur = null;
          if (/^isHidden(\s*:\s*true)?$/.test(trimmed)) table.hidden = true;
          if (/^dataCategory\s*:\s*Time$/i.test(trimmed)) table.date = true;
        }
      } else if (depth === 2 && cur) {
        const p = trimmed.match(/^(dataType|dataCategory|formatString)\s*:\s*(.*)$/);
        if (p) cur[p[1]] = p[2].trim();
        else if (/^sortByColumn\s*:/.test(trimmed)) cur.sortBy = tmdlName(trimmed.replace(/^sortByColumn\s*:\s*/, ''));
        else if (/^isHidden(\s*:\s*true)?$/.test(trimmed)) cur.isHidden = true;
        else if (cur.isMeasure && !/^[A-Za-z]+\s*(:|=|$)/.test(trimmed)) { addExpr(cur, trimmed); if (divides(trimmed)) cur.divides = true; }
      } else if (depth > 2 && cur && cur.isMeasure) { addExpr(cur, trimmed); if (divides(trimmed)) cur.divides = true; }
    });
    return tables;
  }
  // a measure's expression, kept (up to 4,000 characters) only for what the picker reads from it: whether it counts and
  // whether it returns text (never sent anywhere: the field picker and the report writer read it on the user's machine)
  const addExpr = (m, line) => { const t = String(line || '').trim(); if (!t) return; const e = m.expr ? m.expr + '\n' + t : t; Object.defineProperty(m, 'expr', { value: e.slice(0, 4000), writable: true, configurable: true }); };
  // model.bim / DataModelSchema (TMSL JSON) into the same shape
  function fromTmsl(json) {
    const m = (json && json.model) || json || {};
    return (m.tables || []).filter((t) => t && t.name != null).map((t) => ({
      name: String(t.name), hidden: !!t.isHidden, date: /^time$/i.test(t.dataCategory || ''),
      columns: (t.columns || []).filter((c) => c.type !== 'rowNumber' && c.name != null)
        .map((c) => Object.assign({ name: String(c.name), dataType: c.dataType || 'string', isHidden: !!c.isHidden, dataCategory: c.dataCategory }, c.sortByColumn ? { sortBy: String(c.sortByColumn) } : {})),
      measures: (t.measures || []).filter((x) => x.name != null).map((x) => { const m = { name: String(x.name), isHidden: !!x.isHidden, formatString: x.formatString, divides: divides(x.expression) }; addExpr(m, Array.isArray(x.expression) ? x.expression.join('\n') : x.expression); return m; })
    }));
  }
  // Round 23 (the owner's "nothing critical left": the website's picker had no relationships, so a download could show
  // the same total on every bar): the active relationships a model carries, { fromTable, toTable }, as the MCP gives
  // them to suggest. From a model.bim or DataModelSchema (TMSL: isActive) or the health engine's answer (active), and
  // from a project's definition/relationships.tmdl (isActive: false left out; a column is Table.Column, either quoted).
  const relsOfTmsl = (json) => { const m = (json && json.model) || json || {};
    return (m.relationships || []).filter((r) => r && r.fromTable && r.toTable && r.isActive !== false && String(r.isActive) !== 'false' && r.active !== false).map((r) => Object.assign({ fromTable: String(r.fromTable), toTable: String(r.toTable) }, /^bothDirections$/i.test(r.crossFilteringBehavior || r.cross || '') ? { both: true } : {})); };   // (part 5: both: filters both ways)
  function relsOfTmdl(text) {
    const out = [], tableOf = (v) => { const m = String(v).trim().match(/^('(?:[^']|'')*'|[^.]+)\./); return m ? tmdlName(m[1]) : null; };
    String(text || '').split(/\r?\n(?=relationship\s)/).forEach((block) => {
      if (!/^relationship\s/.test(block.trim())) return;
      const get = (k) => { const m = block.match(new RegExp('^\\s+' + k + '\\s*:\\s*(.+)$', 'm')); return m ? m[1].trim() : null; };
      const from = tableOf(get('fromColumn') || ''), to = tableOf(get('toColumn') || '');
      if (from && to && !/^false$/i.test(get('isActive') || '')) out.push(Object.assign({ fromTable: from, toTable: to }, /^bothDirections$/i.test(get('crossFilteringBehavior') || '') ? { both: true } : {}));
    });
    return out;
  }
  // Power BI's hidden automatic date tables are not fields anyone picks
  const clean = (tables) => tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));

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
    if (bim) { const j = JSON.parse(decodeText(new Uint8Array(await bim.arrayBuffer()))); tables = fromTmsl(j); relationships = relsOfTmsl(j); }
    else {
      const rf = inside.find((f) => /\/definition\/relationships\.tmdl$/i.test(f.webkitRelativePath || f.name));
      if (rf) relationships = relsOfTmdl(decodeText(new Uint8Array(await rf.arrayBuffer())));
      const tmdl = inside.filter((f) => /\/definition\/tables\/[^/]+\.tmdl$/i.test(f.webkitRelativePath || f.name));
      if (!tmdl.length) throw new Error('NO_MODEL');
      tables = [];
      for (const f of tmdl) tables.push(...parseTmdl(decodeText(new Uint8Array(await f.arrayBuffer()))));
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
  const DIVIDES = /\bDIVIDE\s*\(|(^|[^/])\/(?!\/)/i;
  const divides = (expr) => DIVIDES.test(Array.isArray(expr) ? expr.join('\n') : String(expr == null ? '' : expr));
  // (round 12, the owner's ask, 6 Oct 2026: "vs", "growth" and "change" count too, on the same terms as margin and share)
  const PCT = (x) => /%/.test(x.formatString || '') || /%|ratio|rate|نسبة/i.test(x.name) || (/margin|share|\bvs\b|growth|change|هامش|نمو/i.test(x.name) && !x.formatString && !!x.divides);
  // Round 12 (#26; seen in Desktop 2.158, golden task 8: a KPI card showed "Yes"): a measure that shows text, never a
  // number: a format of quoted words only ("Yes";"Yes";"No"), Yes/No, True/False, On/Off, a date format; or DAX that
  // returns text (a string at the top, FORMAT, CONCATENATE, text joined with &, an IF or SWITCH whose results are
  // strings). It is never put on a KPI card.
  const TEXT_FMT = (f) => { if (!f) return false; if (/^\s*(yes\/no|true\/false|on\/off)\s*$/i.test(f)) return true; if (/^\s*(general( number)?|currency|fixed|standard|percent|scientific)\s*$/i.test(f)) return false;
    const bare = String(f).replace(/"[^"]*"/g, '').replace(/\\./g, ''); return !/[0#%]/.test(bare); };
  const TEXT_EXPR = /^\s*"|^\s*(FORMAT|CONCATENATEX?|UNICHAR|UPPER|LOWER|LEFT|RIGHT|MID|SUBSTITUTE|REPT|COMBINEVALUES)\s*\(|"\s*&|&\s*"|\b(IF|SWITCH)\s*\([\s\S]*,\s*"[^"]*"\s*\)\s*$/i;
  const isText = (x) => TEXT_FMT(x.formatString) || TEXT_EXPR.test(x.expr || '');
  // a measure that counts (its DAX counts rows or values)
  const COUNTS = /\b(COUNTROWS|DISTINCTCOUNT(NOBLANK)?|COUNTA?X?|COUNTBLANK)\s*\(/i;
  // Round 12, the owner's ask (6 Oct 2026): a KPI card shows a percent as a percent without useless decimals (the
  // model's percent format where it has one decimal or none, otherwise "0.0%"), a measure whose format has no decimals
  // (or a count without a format) as its whole number with separators ("179", "101,914"), and the rest with automatic
  // units and 2 decimals. Returns { pctFormat } or { wholeFormat } or {}.
  const cardKind = (x) => {
    const f = String(x.formatString || '');
    if (PCT(x)) { const d = (f.match(/\.([0#]+)\s*%/) || ['', ''])[1].length; return { pctFormat: /%/.test(f) && d <= 1 ? f : '0.0%' }; }
    if (isText(x)) return {};
    if (f && !/\.[0#]/.test(f) && /[0#]/.test(f)) return { wholeFormat: /^[#,0]+$/.test(f) ? '#,0' : f };
    if (!f && COUNTS.test(x.expr || '')) return { wholeFormat: '#,0' };
    return {};
  };
  // time intelligence variants (MTD, PY, YoY %...) are not the headline number
  const VARIANT = /\b(PY|LY|YoY|MoM|QoQ|MTD|QTD|YTD|PYTD|PM|Prior|Previous|Prev|Last|vs|Rolling|Running|Avg|Average|\d+D)\b/i;
  // a measure someone left behind: the whole word old, test, unused, backup or temp in its name ("Sales (old)", "Test
  // margin", "TEMP total"; not "Oldham", "Latest" or "Contest"). It is picked only when no other measure is left.
  const STALE = /(^|[^A-Za-z])(old|test|unused|backup|temp)([^A-Za-z]|$)/i;
  const MAIN = /revenue|sales|amount|income|profit|value|bookings|orders|leads|deals|calls|visits|spend|cost|الإيرادات|المبيعات|الأرباح|الطلبات/i;
  const COUNTISH = /total|count|number|#|qty|quantity|units|customers|clients|tickets|إجمالي|عدد/i;
  const CAT = /category|product|brand|region|country|city|emirate|segment|channel|type|status|department|store|branch|source|platform|model|team|group|class|stage|agent|rep|salesperson|campaign|الفئة|المنتج|العلامة|المنطقة|المدينة|القناة|الفرع|المصدر/i;
  // (round 23, the owner's "nothing critical left": "Order Id", "Invoice No" and "Customer Code" were chart categories:
  // an identifier's last word (id, key, code, guid, sk, no, num, number) is read without regard to case; the other words
  // as before; a camel-case end, OrderID, InvoiceNo, stays case-sensitive: "Paid" and "Casino" are words)
  const NOT_CAT_OLD = /(^|[\s_-])(id|key|code|guid|sk|sort|order|index|url|link|email|phone|mobile|address|description|notes?|comments?|remarks?)s?$|[a-z]ID$|Key$/;
  const NOT_CAT_ID = /(^|[\s_-])(id|key|code|guid|sk|no|num|number)s?$/i, NOT_CAT_CAMEL = /[a-z](Id|No|Code)$/;
  // (round 23 part 5, the review's 9: read without an Arabic mark, so "Order No (AR)" is an identifier too)
  const NOT_CAT = { test: (x0) => { const x = String(x0).replace(/\s*\((arabic|عربي|ar)\)\s*$/i, ''); return NOT_CAT_OLD.test(x) || NOT_CAT_ID.test(x) || NOT_CAT_CAMEL.test(x); } };
  const DATE_TABLE = /date|calendar|time|period|تقويم|تاريخ/i;
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
  function sortColumnFor(columns, name) {
    if (!nameLike(name)) return null;
    const kind = sortKind(name), fam = family(name);
    // a column the files give no type for (a DAX table's) counts only when its name says it is a number ("Month
    // Number", "Year Month Sort", "Day of Week"): "Year Month" or "Month" alone may be text
    const type = (c) => String(c.dataType || 'string').toLowerCase(), plain = (c) => c.name.replace(FAMILY, '').trim();
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
    columns.filter((c) => c.lang).forEach((c) => { (byTable[c.t] = byTable[c.t] || []).push(c); });
    Object.values(byTable).forEach((cs) => {
      const ar = cs.filter((c) => c.lang === 'ar'), en = cs.filter((c) => c.lang === 'en'), free = (c) => !c.twin;
      const tie = (a, e) => { if (a && e) { a.twin = e; e.twin = a; } };
      ar.forEach((a) => tie(a, en.find((e) => free(e) && twinKey(e.c) === twinKey(a.c))));
      ar.filter(free).forEach((a) => tie(a, en.find((e) => free(e) && a.cat && e.cat && a.cat === e.cat)));
      // (round 23 part 5, the review's 5: the column next to it only when the table's layout says which: every Arabic
      // column left without a twin has a free English one just before it, or every one just after, not both ways;
      // [Product, المدينة, City] could be either: no twin)
      const at = (i) => en.find((e) => free(e) && e.i === i), left = ar.filter(free);
      const fits = (dir) => left.length && left.every((a) => at(a.i + dir)) && new Set(left.map((a) => a.i + dir)).size === left.length;
      const before = fits(-1), after = fits(1);
      if (before !== after) left.forEach((a) => tie(a, at(a.i + (before ? -1 : 1))));
    });
  }
  function catalog(tables) {
    const shown = tables.filter((t) => !t.hidden);
    const measures = [], columns = [];
    shown.forEach((t) => {
      t.measures.filter((m) => !m.isHidden).forEach((m) => measures.push(Object.assign({ t: t.name, m: m.name, pct: PCT(m), variant: VARIANT.test(m.name), stale: STALE.test(m.name), text: isText(m) }, cardKind(m))));
      t.columns.filter((c) => !c.isHidden).forEach((c, i) => { const by = c.sortBy ? null : sortColumnFor(t.columns, c.name), type = String(c.dataType || 'string').toLowerCase();
        // (round 12, #17: a month or day name the model itself sorts is ordered: a table sorts it by itself)
        // (round 23: lang and i, the column's place, for the language rule: text columns only; non-enumerable, so the
        // fields given out keep their shape)
        const col = Object.assign({ t: t.name, c: c.name, type, dateTable: t.date || DATE_TABLE.test(t.name), cat: c.dataCategory }, by ? { sortBy: { t: t.name, c: by.name } } : {}, c.sortBy && nameLike(c.name) ? { ordered: true } : {});
        Object.defineProperties(col, { lang: { value: type === 'string' || type === 'unknown' ? langOf(c.name) : null, writable: true }, i: { value: i }, twin: { value: null, writable: true } });
        columns.push(col); });
    });
    columns.forEach((c) => { if (c.lang === 'en' && AR_SUFFIX.test(c.c)) { const base = c.c.replace(AR_SUFFIX, '').trim().toLowerCase(); if (columns.some((o) => o !== c && o.t === c.t && o.lang === 'en' && o.c.trim().toLowerCase() === base)) c.lang = 'ar'; } });
    pairTwins(columns);
    return { measures, columns };
  }
  // the language rule on a list of candidates for one role (round 23). lang "en": no "ar" column while the list has
  // another (else the "ar" ones, told: fallback). lang "ar": each "en" column that has an "ar" twin gives its place to
  // the twin (an "en" column without one stays: its name is shown through an Arabic display name, never translated),
  // except in a date table, whose Arabic name columns the MCP swaps in itself (round 12b). No lang: as before.
  function byLang(list, lang, note) {
    if (lang === 'en') { const ok = list.filter((c) => c.lang !== 'ar'); list.filter((c) => c.lang === 'ar').forEach((c) => (ok.length ? note.skipped : note.fallback).add(c)); return ok.length || !list.length ? ok : list; }
    if (lang === 'ar') { const out = []; list.forEach((c) => { const x = c.lang === 'en' && c.twin && !c.dateTable ? c.twin : c; if (x !== c) note.skipped.add(c); if (!out.includes(x)) out.push(x); }); return out; }
    return list;
  }
  const langNote = (lang, note) => (lang && (note.skipped.size || note.fallback.size) ? { language: Object.assign({ lang },
    note.skipped.size ? { skipped: [...note.skipped].map((c) => `${c.t}[${c.c}]`) } : {}, note.fallback.size ? { fallback: [...note.fallback].map((c) => `${c.t}[${c.c}]`) } : {}) } : {});
  // the tables a measure reaches (round 22b): the tables its DAX names ('Sales'[Amount], Sales[Amount], COUNTROWS ( Sales ))
  // and those of the measures it calls ([Base Amount]), with its own table, then every table a relationship leads to from
  // them (many to one, from fromTable to toTable). The reviewer's second review (items 2, 3, 10): names are matched as
  // DAX does, without regard to case; tables are the whole model's (opt.modelTables), not only those in the pick's
  // scope; and the DAX is read once per measure (its quoted names and its words looked up), not once per table
  const KEYWORDS = new Set(['var', 'return', 'true', 'false', 'in', 'not', 'and', 'or', 'evaluate', 'define', 'measure', 'order', 'by', 'asc', 'desc']);
  function reached(tables, main, rels) {
    const lc = (x) => String(x).toLowerCase(), byName = new Map(), byMeasure = new Map();
    tables.forEach((t) => { byName.set(lc(t.name), t.name); (t.measures || []).forEach((m) => { if (!byMeasure.has(lc(m.name))) byMeasure.set(lc(m.name), m.expr || ''); }); });
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
  // Round 23 (the owner, 8 Oct 2026; lab 1b "Delivered Qty 9,012 on every Hub Zone row", golden task 10): a table's
  // measures all reach its row column's table, by the rule its charts follow (reached): a measure of a fact table not
  // related to the rows would repeat one total on every row, so it is left out of the table and named (notReached).
  // Without relationships (the website's picker of a model that gives none) the table is as before.
  function reachTable(table, opt) {
    const rels = (opt && opt.relationships) || [], all = (opt && opt.modelTables) || [], row = (table || []).find((f) => f && f.c != null);
    if (!rels.length || !row || !all.length) return { table, notReached: [] };
    // (part 6, the re-review's 8: the tables each measure reaches are kept with the choices' reach, so a binding built
    // again from them (each picker change) does not walk the model again)
    if (!opt.cache) Object.defineProperty(opt, 'cache', { value: new Map() });
    const reachOf = (f) => { const k = f.t + '\u0000' + f.m; if (!opt.cache.has(k)) opt.cache.set(k, reached(all, f, rels)); return opt.cache.get(k); };
    const notReached = table.filter((f) => f && f.m != null && !reachOf(f).has(row.t));
    return { table: table.filter((f) => !notReached.includes(f)), notReached: notReached.map((f) => ({ t: f.t, m: f.m, row: { t: row.t, c: row.c } })) };
  }
  function suggest(tables, nKpis, opt) {
    const { measures, columns } = catalog(tables);
    const score = (x) => (MAIN.test(x.m) ? 3 : 0) + (COUNTISH.test(x.m) ? 2 : 0) - (x.variant ? 4 : 0) - (x.pct ? 1 : 0);
    // (measures left behind, see STALE, come after every other one)
    // (a measure that shows text is never picked: round 12, #26)
    // (round 23: with a report language (opt.lang), a measure named in the other language comes after those named in
    // its own or in none, as a measure left behind does)
    const L = opt && opt.lang, note = { skipped: new Set(), fallback: new Set() }, other = (x) => (L && langOf(x.m) && langOf(x.m) !== L ? 1 : 0);
    const ranked = measures.filter((x) => !x.text).sort((a, b) => (a.stale ? 1 : 0) - (b.stale ? 1 : 0) || other(a) - other(b) || score(b) - score(a));
    const main = ranked.find((x) => !x.pct) || ranked[0] || null;
    // KPIs: the strongest base measures, with one ratio among them when the model has one; a measure left behind only
    // when the cards outnumber the other measures
    const current = ranked.filter((x) => !x.stale);
    const kpis = current.filter((x) => !x.pct && !x.variant).slice(0, Math.max(0, nKpis - 1));
    const ratio = current.find((x) => x.pct && !x.variant);
    if (ratio && kpis.length < nKpis) kpis.push(ratio);
    ranked.forEach((x) => { if (kpis.length < nKpis && !kpis.includes(x)) kpis.push(x); });
    while (kpis.length < nKpis) kpis.push(null);   // more cards than measures: the rest stay empty
    // Round 22b (the review of round 22, items 2 and 3): only the main chart's category took this order, the column
    // chart's and the map's (catB) and the pool every other chart takes from still reached a table the measure is not
    // related to; and the walk began at the table the measure is stored in, which for a measures table of its own is
    // related to nothing. Now it begins at the tables the measure's DAX reads (through the measures it calls too) and
    // its own table, and only reached categories are given out (catB falls back to catA). The reviewer's second review:
    // the measure is the plan's (opt.main) where it names one (item 4), and the time axis and the year slicer come from
    // a reached table too (item 5: two calendars, the measure related to one)
    const rels = (opt && opt.relationships) || [], anchor = (opt && opt.main && opt.main.m != null ? opt.main : null) || main;
    const reach = rels.length && anchor ? reached((opt && opt.modelTables) || tables, anchor, rels) : null, near = (c) => !reach || reach.has(c.t);
    // time axis: a month column from the date table, else its date column, else any date column
    const quiet = { skipped: new Set(), fallback: new Set() }, inDate = byLang(columns.filter((c) => c.dateTable && near(c)), L, quiet);   // (the calendar's own Arabic columns are not told)
    let date = inDate.find((c) => /^(month[\s_-]*(name|year)?|year[\s_-]*month|الشهر)$/i.test(c.c)) || inDate.find((c) => /month|الشهر/i.test(c.c))
      || inDate.find((c) => /date/.test(c.type)) || columns.find((c) => /date/.test(c.type) && near(c))
      || byLang(columns.filter((c) => /^(month[\s_-]*(name)?|الشهر)$/i.test(c.c) && near(c)), L, quiet)[0] || null;   // no date table: a month column anywhere
    // Round 12 (#16; seen in Desktop 2.158, round 11: "January" ... "December" slanted on the line chart): the time axis
    // takes the model's short month names ("Jan") where it has them, in the same order
    const SHORT_MONTH = /^(month\s*(short|abbr|abbreviation)|short\s*month|mmm)$/i;
    if (date && /month|الشهر/i.test(date.c) && !/date/.test(date.type)) { const sh = columns.find((c) => c.t === date.t && SHORT_MONTH.test(c.c.replace(FAMILY, '').trim()) && family(c.c) === family(date.c)); if (sh) date = sh; }
    const year = inDate.find((c) => /^(year|السنة)$/i.test(c.c)) || null;
    // a category: a text column, or one of unknown type whose name reads as a category (not a number, date or key)
    const textLike = (c) => c.type === 'string' || (c.type === 'unknown' && !NUMBERISH.test(c.c) && !DATEISH.test(c.c));
    // (round 23: in the report's language; an Arabic twin keeps its English one's place)
    // (round 23 part 5, the review's 4: the reach first, then the language on what is reached, with its Arabic fallback;
    // before, an English column of an unrelated table took the place and then the reach left no category)
    let cats = columns.filter((c) => !c.dateTable && textLike(c) && !NOT_CAT.test(c.c) && c !== date)
      .sort((a, b) => (CAT.test(b.c) || (b.lang === 'ar' && b.twin && CAT.test(b.twin.c)) ? 1 : 0) - (CAT.test(a.c) || (a.lang === 'ar' && a.twin && CAT.test(a.twin.c)) ? 1 : 0));
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
    // no category outside the date table: the date table's named parts (quarter, day, month names), never the time axis
    if (!cats.length) cats = DATE_PARTS.map((re) => inDate.find((c) => re.test(c.c) && textLike(c) && c !== date && (!reach || reach.has(c.t)))).filter(Boolean);
    const catA = cats[0] || null, catB = cats.find((c) => c !== catA && c.t !== (catA && catA.t)) || cats[1] || catA;
    const sl = [year, catA, catB, date].filter((x, i, l) => x && l.indexOf(x) === i);
    // (round 23 part 5, the review's 2: the table's reach rule lives in build, so a binding built again from these choices
    // (a picker change, the website's own picks) keeps it: choices.reach)
    const out = build(Object.assign({ kpis, main, date, catA, catB, slicers: [sl[0] || null, sl[1] || null, sl[2] || null] }, reach ? { reach: { relationships: rels, modelTables: (opt && opt.modelTables) || tables } } : {}));
    Object.assign(out, langNote(L, note));
    // (round 23: no time axis because the measure reaches no calendar of the model: said with the calendars' names)
    // (part 8, the review's 3: a date column of a table the measure does not reach, with no marked calendar, is named too:
    // kind 'date', "no date column is related to")
    if (!date && reach) { const cal = [...new Set(columns.filter((c) => c.dateTable && !reach.has(c.t)).map((c) => c.t))], dt = [...new Set(columns.filter((c) => !c.dateTable && /date/.test(c.type) && !reach.has(c.t)).map((c) => c.t))];
      if (cal.length) out.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: cal.slice(0, 5), kind: 'calendar' };
      else if (dt.length) out.noRelatedCalendar = { measure: { t: anchor.t, m: anchor.m }, tables: dt.slice(0, 5), kind: 'date' }; }
    if (!cats.length && unreached.length) out.noRelatedCategory = { measure: { t: anchor.t, m: anchor.m }, tables: [...new Set(unreached.map((c) => c.t))].slice(0, 5) };
    // every column a slicer could take, in the order they are picked (round 12, #22: the caller replaces a slicer that
    // a page filter makes pointless)
    out.slicerPool = [year].concat(cats, [date]).filter((x, i, l) => x && l.indexOf(x) === i);
    // the categories a page's charts can take, in the picker's order (round 16, design finding #18: the operations
    // layout drew two bar charts and a donut all by Quarter): the writer gives each chart of a page one not used there yet
    out.catPool = cats.slice(0, 8).map((c) => Object.assign({ t: c.t, c: c.c }, c.sortBy ? { sortBy: c.sortBy } : {}, c.ordered ? { ordered: true } : {}));
    // the measures left behind that were not picked, so the caller can say so (none: no such key)
    const skipped = ranked.filter((x) => x.stale && !kpis.includes(x) && x !== main).map((x) => ({ t: x.t, m: x.m }));
    if (skipped.length) out.skipped = skipped;
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
    const f = (x) => (x ? (x.m != null ? Object.assign({ t: x.t, m: x.m }, x.pct ? { pct: true } : {}, x.pctFormat ? { pctFormat: x.pctFormat } : {}, x.wholeFormat ? { wholeFormat: x.wholeFormat } : {})
      : Object.assign(/^(int64|double|decimal|number)$/.test(x.type || '') ? { t: x.t, c: x.c, num: true } : { t: x.t, c: x.c }, x.sortBy ? { sortBy: x.sortBy } : {}, x.ordered ? { ordered: true } : {})) : null);
    const kpis = (ch.kpis || []).map(f);
    const main = f(ch.main), second = kpis.find((k) => k && main && k.m !== main.m) || main;
    const ratio = (ch.kpis || []).find((k) => k && k.pct);
    const A = f(ch.catA), Bc = f(ch.catB);
    const uniq = (list) => list.filter((x, i) => x && list.findIndex((y) => y && JSON.stringify(y) === JSON.stringify(x)) === i);
    // (round 23 part 5, the review's 2: the table keeps only the measures that reach its rows, on every path)
    const TB = reachTable(uniq([Bc || A, main, second, kpis[2]]), ch.reach);
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
      tip: { card: main, cat: A, y: f((ch.kpis || []).find((k) => k && ch.main && k.m !== ch.main.m && !k.variant && !k.pct && (!ch.reach || [A, Bc, ch.date].filter(Boolean).every((c) => !reachTable([c, k], ch.reach).notReached.length)))) || main, date: ch.date && /month|\u0627\u0644\u0634\u0647\u0631/i.test(ch.date.c) ? f(ch.date) : null }
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
  const measureCard = (m) => { const x = { name: String(m.name), formatString: m.formatString, divides: !!m.divides, expr: m.expr || (Array.isArray(m.expression) ? m.expression.join('\n') : m.expression) || '' }; return Object.assign({ text: isText(x), pct: PCT(x) }, cardKind(x)); };
  // the twins of a model's text columns, { 'T[c]': 'T[twin]' } both ways (round 23: the MCP's note on named fields)
  // the language of each text column as the picker reads it, with the table's context ({ 'T[c]': 'ar' | 'en' })
  const langsOf = (tables) => { const out = {}; catalog(tables).columns.filter((c) => c.lang).forEach((c) => { out[`${c.t}[${c.c}]`] = c.lang; }); return out; };
  const twinsOf = (tables) => { const out = {}; catalog(tables).columns.filter((c) => c.twin).forEach((c) => { out[`${c.t}[${c.c}]`] = `${c.twin.t}[${c.twin.c}]`; }); return out; };
  const api = { langOf, langsOf, twinsOf, reachTable, relsOfTmsl, relsOfTmdl, isPercent, measureCard, nameLike, iso, parseTmdl, fromTmsl, fromFolder, fromFile, suggest, build, counts, sortColumnFor, renderPicker, connection };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DABind = api;
})(typeof self !== 'undefined' ? self : this);
