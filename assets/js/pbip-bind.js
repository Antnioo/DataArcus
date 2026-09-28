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
      if (fence) { if (trimmed === '```') fence = false; return; }
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
          cur = m[1] === 'column' ? { name: tmdlName(m[2]), dataType: 'string', isHidden: false } : { name: tmdlName(m[2]), isHidden: false };
          table[m[1] === 'column' ? 'columns' : 'measures'].push(cur);
        } else {
          cur = null;
          if (/^isHidden(\s*:\s*true)?$/.test(trimmed)) table.hidden = true;
          if (/^dataCategory\s*:\s*Time$/i.test(trimmed)) table.date = true;
        }
      } else if (depth === 2 && cur) {
        const p = trimmed.match(/^(dataType|dataCategory|formatString)\s*:\s*(.*)$/);
        if (p) cur[p[1]] = p[2].trim();
        else if (/^isHidden(\s*:\s*true)?$/.test(trimmed)) cur.isHidden = true;
      }
    });
    return tables;
  }
  // model.bim / DataModelSchema (TMSL JSON) into the same shape
  function fromTmsl(json) {
    const m = (json && json.model) || json || {};
    return (m.tables || []).filter((t) => t && t.name != null).map((t) => ({
      name: String(t.name), hidden: !!t.isHidden, date: /^time$/i.test(t.dataCategory || ''),
      columns: (t.columns || []).filter((c) => c.type !== 'rowNumber' && c.name != null)
        .map((c) => ({ name: String(c.name), dataType: c.dataType || 'string', isHidden: !!c.isHidden, dataCategory: c.dataCategory })),
      measures: (t.measures || []).filter((x) => x.name != null).map((x) => ({ name: String(x.name), isHidden: !!x.isHidden, formatString: x.formatString }))
    }));
  }
  // Power BI's hidden automatic date tables are not fields anyone picks
  const clean = (tables) => tables.filter((t) => !/^(LocalDateTable_|DateTableTemplate_)/.test(t.name));

  // A folder from <input webkitdirectory>: the .SemanticModel folder itself, or a project folder holding one
  async function fromFolder(fileList) {
    const files = Array.from(fileList || []);
    const modelOf = (f) => { const m = (f.webkitRelativePath || f.name).match(/(^|\/)([^/]+\.SemanticModel)\//i); return m ? m[2] : null; };
    const models = [...new Set(files.map(modelOf).filter(Boolean))];
    if (!models.length) throw new Error('NO_SEMANTIC_MODEL');
    const folder = models[0], inside = files.filter((f) => modelOf(f) === folder);
    const bim = inside.find((f) => /\/model\.bim$/i.test(f.webkitRelativePath || f.name));
    let tables;
    if (bim) tables = fromTmsl(JSON.parse(decodeText(new Uint8Array(await bim.arrayBuffer()))));
    else {
      const tmdl = inside.filter((f) => /\/definition\/tables\/[^/]+\.tmdl$/i.test(f.webkitRelativePath || f.name));
      if (!tmdl.length) throw new Error('NO_MODEL');
      tables = [];
      for (const f of tmdl) tables.push(...parseTmdl(decodeText(new Uint8Array(await f.arrayBuffer()))));
    }
    return { folder, others: models.length - 1, tables: clean(tables) };
  }
  // A model.bim, or a .pbit (unzipped by the Model Health Check's worker, which already reads them)
  function fromFile(file, workerUrl) {
    if (/\.pbix$/i.test(file.name)) return Promise.reject(new Error('PBIX'));
    return file.arrayBuffer().then((buf) => {
      const u8 = new Uint8Array(buf);
      if (!(u8[0] === 0x50 && u8[1] === 0x4b)) return { tables: clean(fromTmsl(JSON.parse(decodeText(u8)))) };
      return new Promise((resolve, reject) => {
        const w = new Worker(workerUrl);
        w.onmessage = (ev) => {
          const d = ev.data;
          if (d.type === 'done') { w.terminate(); resolve({ tables: clean(fromTmsl({ tables: d.result.rawTables })) }); }
          else if (d.type === 'error') { w.terminate(); reject(new Error(d.code)); }
        };
        w.onerror = () => { w.terminate(); reject(new Error('PARSE')); };
        w.postMessage({ buffer: buf, fileName: file.name }, [buf]);
      });
    });
  }

  // ---------- suggestions ----------
  const PCT = (x) => /%/.test(x.formatString || '') || /%|ratio|rate|margin|share|نسبة|هامش/i.test(x.name);
  // time intelligence variants (MTD, PY, YoY %...) are not the headline number
  const VARIANT = /\b(PY|LY|YoY|MoM|QoQ|MTD|QTD|YTD|PYTD|PM|Prior|Previous|Prev|Last|vs|Rolling|Running|Avg|Average|\d+D)\b/i;
  const MAIN = /revenue|sales|amount|income|profit|value|bookings|orders|leads|deals|calls|visits|spend|cost|الإيرادات|المبيعات|الأرباح|الطلبات/i;
  const COUNTISH = /total|count|number|#|qty|quantity|units|customers|clients|tickets|إجمالي|عدد/i;
  const CAT = /category|product|brand|region|country|city|emirate|segment|channel|type|status|department|store|branch|source|platform|model|team|group|class|stage|agent|rep|salesperson|campaign|الفئة|المنتج|العلامة|المنطقة|المدينة|القناة|الفرع|المصدر/i;
  const NOT_CAT = /(^|[\s_-])(id|key|code|guid|sk|sort|order|index|url|link|email|phone|mobile|address|description|notes?|comments?|remarks?)s?$|[a-z]ID$|Key$/;
  const DATE_TABLE = /date|calendar|time|period|تقويم|تاريخ/i;

  function catalog(tables) {
    const shown = tables.filter((t) => !t.hidden);
    const measures = [], columns = [];
    shown.forEach((t) => {
      t.measures.filter((m) => !m.isHidden).forEach((m) => measures.push({ t: t.name, m: m.name, pct: PCT(m), variant: VARIANT.test(m.name) }));
      t.columns.filter((c) => !c.isHidden).forEach((c) => columns.push({ t: t.name, c: c.name, type: String(c.dataType || 'string').toLowerCase(), dateTable: t.date || DATE_TABLE.test(t.name), cat: c.dataCategory }));
    });
    return { measures, columns };
  }
  function suggest(tables, nKpis) {
    const { measures, columns } = catalog(tables);
    const score = (x) => (MAIN.test(x.m) ? 3 : 0) + (COUNTISH.test(x.m) ? 2 : 0) - (x.variant ? 4 : 0) - (x.pct ? 1 : 0);
    const ranked = measures.slice().sort((a, b) => score(b) - score(a));
    const main = ranked.find((x) => !x.pct) || ranked[0] || null;
    // KPIs: the strongest base measures, with one ratio among them when the model has one
    const kpis = ranked.filter((x) => !x.pct && !x.variant).slice(0, Math.max(0, nKpis - 1));
    const ratio = ranked.find((x) => x.pct && !x.variant);
    if (ratio && kpis.length < nKpis) kpis.push(ratio);
    ranked.forEach((x) => { if (kpis.length < nKpis && !kpis.includes(x)) kpis.push(x); });
    while (kpis.length < nKpis) kpis.push(null);   // more cards than measures: the rest stay empty
    // time axis: a month column from the date table, else its date column, else any date column
    const inDate = columns.filter((c) => c.dateTable);
    const date = inDate.find((c) => /^(month[\s_-]*(name|year)?|year[\s_-]*month|الشهر)$/i.test(c.c)) || inDate.find((c) => /month|الشهر/i.test(c.c))
      || inDate.find((c) => /date/.test(c.type)) || columns.find((c) => /date/.test(c.type))
      || columns.find((c) => /^(month[\s_-]*(name)?|الشهر)$/i.test(c.c)) || null;   // no date table: a month column anywhere
    const year = inDate.find((c) => /^(year|السنة)$/i.test(c.c)) || null;
    const cats = columns.filter((c) => !c.dateTable && c.type === 'string' && !NOT_CAT.test(c.c) && c !== date)
      .sort((a, b) => (CAT.test(b.c) ? 1 : 0) - (CAT.test(a.c) ? 1 : 0));
    const catA = cats[0] || null, catB = cats.find((c) => c !== catA && c.t !== (catA && catA.t)) || cats[1] || catA;
    // three different slicers: the year, then the categories, then the time axis
    const sl = [year, catA, catB, date].filter((x, i, l) => x && l.indexOf(x) === i);
    return build({ kpis, main, date, catA, catB, slicers: [sl[0] || null, sl[1] || null, sl[2] || null] });
  }
  // the visual-by-visual binding the exporter reads, from the few choices the user makes
  function build(ch) {
    const f = (x) => (x ? (x.m != null ? { t: x.t, m: x.m } : { t: x.t, c: x.c }) : null);
    const kpis = (ch.kpis || []).map(f);
    const main = f(ch.main), second = kpis.find((k) => k && main && k.m !== main.m) || main;
    const ratio = (ch.kpis || []).find((k) => k && k.pct);
    const A = f(ch.catA), Bc = f(ch.catB);
    const uniq = (list) => list.filter((x, i) => x && list.findIndex((y) => y && JSON.stringify(y) === JSON.stringify(x)) === i);
    return {
      choices: ch,
      kpis, measure: main, date: f(ch.date),   // an empty KPI choice leaves that card empty
      cats: { bar: A, donut: A, funnel: A, treemap: A, column: Bc, map: Bc },
      y: { funnel: second, gauge: f(ratio) || main },
      table: uniq([Bc || A, main, second, kpis[2]]),
      slicers: (ch.slicers || []).map(f),
      tip: { card: main, cat: A, y: second }
    };
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
    el.addEventListener('change', (e) => {
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

  const api = { iso, parseTmdl, fromTmsl, fromFolder, fromFile, suggest, build, renderPicker, connection };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DABind = api;
})(typeof self !== 'undefined' ? self : this);
