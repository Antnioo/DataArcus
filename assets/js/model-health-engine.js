/*
 * DataArcus Power BI Model Health Check: analysis engine.
 * Pure JavaScript, no DOM. Runs in a Web Worker in the browser and in Node for tests.
 * Input: the model JSON (DataModelSchema / model.bim) and, optionally, the report
 * definition (legacy Report/Layout or PBIR files). Nothing is sent anywhere.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // ---------- helpers ----------
  const lc = (s) => String(s == null ? '' : s).toLowerCase();
  const text = (v) => (Array.isArray(v) ? v.join('\n') : v == null ? '' : String(v));
  const uniq = (a) => Array.from(new Set(a));

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
          relatedColumnDetails: c.relatedColumnDetails || null
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

  // ---------- 2. DAX tokenizer and reference extraction ----------
  // Returns tokens without comments; strings are kept as a single token so their contents are ignored.
  function tokenizeDax(src) {
    const s = src || '';
    const out = [];
    let i = 0;
    const n = s.length;
    while (i < n) {
      const c = s[i];
      const d = s[i + 1];
      if (c === '/' && d === '/') { while (i < n && s[i] !== '\n') i++; continue; }
      if (c === '-' && d === '-') { while (i < n && s[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { const e = s.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '"') { let j = i + 1; while (j < n) { if (s[j] === '"') { if (s[j + 1] === '"') { j += 2; continue; } break; } j++; } out.push({ t: 'str', v: s.slice(i + 1, j), p: i }); i = j + 1; continue; }
      if (c === "'") { let j = i + 1; while (j < n) { if (s[j] === "'") { if (s[j + 1] === "'") { j += 2; continue; } break; } j++; } out.push({ t: 'tbl', v: s.slice(i + 1, j).replace(/''/g, "'"), p: i }); i = j + 1; continue; }
      if (c === '[') { let j = i + 1; while (j < n) { if (s[j] === ']') { if (s[j + 1] === ']') { j += 2; continue; } break; } j++; } out.push({ t: 'br', v: s.slice(i + 1, j).replace(/]]/g, ']'), p: i }); i = j + 1; continue; }
      if (/[A-Za-z_À-￿]/.test(c)) { let j = i + 1; while (j < n && /[\w.À-￿]/.test(s[j])) j++; out.push({ t: 'id', v: s.slice(i, j), p: i }); i = j; continue; }
      if (/[0-9]/.test(c)) { let j = i + 1; while (j < n && /[0-9.eE]/.test(s[j])) j++; out.push({ t: 'num', v: s.slice(i, j), p: i }); i = j; continue; }
      if (/\s/.test(c)) { i++; continue; }
      out.push({ t: 'op', v: c, p: i }); i++;
    }
    return out;
  }

  // Strip comments and string contents, for regex based checks that must not match inside strings.
  function daxCode(src) {
    return tokenizeDax(src).map((t) => (t.t === 'str' ? '""' : t.t === 'tbl' ? "'" + t.v + "'" : t.t === 'br' ? '[' + t.v + ']' : t.v)).join(' ');
  }

  // ---------- 3. index and dependency graph ----------
  function buildIndex(M) {
    const tables = new Map(), columns = new Map(), measures = new Map(), colsByName = new Map();
    M.tables.forEach((t) => {
      tables.set(lc(t.name), t);
      t.columns.forEach((c) => { const e = { table: t, col: c }; columns.set(lc(t.name) + '|' + lc(c.name), e); if (!colsByName.has(lc(c.name))) colsByName.set(lc(c.name), []); colsByName.get(lc(c.name)).push(e); });
      t.measures.forEach((ms) => measures.set(lc(ms.name), { table: t, m: ms }));
    });
    return { tables, columns, measures, colsByName };
  }
  const K = {
    m: (name) => 'm:' + lc(name),
    c: (t, c) => 'c:' + lc(t) + '|' + lc(c),
    t: (t) => 't:' + lc(t)
  };

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
        if (tk.t === 'id' && nx && nx.t === 'op' && nx.v === '(') continue; // function call
        if (IX.tables.has(lc(tk.v))) refs.push(K.t(tk.v));
      }
    }
    return { refs: uniq(refs), style };
  }

  // ---------- 4. report field usage ----------
  // Walks any report JSON (PBIR files or parsed legacy Layout) and collects entity/property references.
  function collectReportRefs(node, acc, aliases) {
    if (node == null) return;
    if (typeof node === 'string') {
      const s = node.trim();
      if ((s[0] === '{' && s[s.length - 1] === '}') || (s[0] === '[' && s[s.length - 1] === ']')) {
        try { collectReportRefs(JSON.parse(s), acc, aliases); } catch (e) { /* not JSON */ }
      }
      return;
    }
    if (Array.isArray(node)) { node.forEach((x) => collectReportRefs(x, acc, aliases)); return; }
    if (typeof node !== 'object') return;
    let al = aliases;
    if (Array.isArray(node.From)) {
      al = Object.assign({}, aliases);
      node.From.forEach((f) => { if (f && f.Name && f.Entity) al[f.Name] = f.Entity; });
    }
    const entityOf = (expr) => {
      const sr = expr && expr.SourceRef;
      if (!sr) return null;
      return sr.Entity || (sr.Source && al[sr.Source]) || null;
    };
    ['Column', 'Measure'].forEach((kind) => {
      const f = node[kind];
      if (f && typeof f === 'object' && f.Property && f.Expression) {
        const ent = entityOf(f.Expression);
        if (ent) acc.push({ kind, entity: ent, prop: f.Property });
      }
    });
    if (node.PropertyVariationSource && node.PropertyVariationSource.Property) {
      const ent = entityOf(node.PropertyVariationSource.Expression);
      if (ent) acc.push({ kind: 'Column', entity: ent, prop: node.PropertyVariationSource.Property });
    }
    if (node.HierarchyLevel && node.HierarchyLevel.Expression && node.HierarchyLevel.Expression.Hierarchy) {
      const h = node.HierarchyLevel.Expression.Hierarchy;
      const ent = entityOf(h.Expression);
      if (ent) acc.push({ kind: 'HierarchyLevel', entity: ent, hierarchy: h.Hierarchy, level: node.HierarchyLevel.Level });
    }
    for (const k in node) if (Object.prototype.hasOwnProperty.call(node, k)) collectReportRefs(node[k], acc, al);
  }

  // report = { format: 'pbir'|'legacy', files: [{path, json}] } ; returns stats + refs
  function analyzeReport(report) {
    if (!report || !report.files || !report.files.length) return null;
    const refs = [];
    const ext = [];
    let pages = 0, visuals = 0;
    const pageNames = [];
    const perVisual = [];
    if (report.format === 'legacy') {
      const layout = report.files[0].json || {};
      (layout.sections || []).forEach((sec) => {
        pages++; pageNames.push(sec.displayName || sec.name);
        collectReportRefs(sec.filters, refs, {});
        (sec.visualContainers || []).forEach((vc) => {
          visuals++;
          const r = [];
          collectReportRefs(vc.config, r, {});
          collectReportRefs(vc.filters, r, {});
          collectReportRefs(vc.query, r, {});
          collectReportRefs(vc.dataTransforms, r, {});
          r.forEach((x) => { x.page = sec.displayName || sec.name; });
          refs.push.apply(refs, r);
          perVisual.push({ page: sec.displayName || sec.name, refs: r });
        });
      });
      collectReportRefs(layout.filters, refs, {});
      collectReportRefs(layout.config, refs, {});
      collectReportRefs(layout.pods, refs, {});
      try {
        const cfg = typeof layout.config === 'string' ? JSON.parse(layout.config) : (layout.config || {});
        (cfg.modelExtensions || []).forEach((me) => (me.entities || []).forEach((en) => (en.measures || []).forEach((ms) => ext.push({ entity: en.name, name: ms.name, expr: text(ms.expression) }))));
      } catch (e) { /* no extensions */ }
    } else {
      const pageTitle = {};
      report.files.forEach((f) => {
        const m = f.path.match(/pages\/([^/]+)\/page\.json$/);
        if (m) { const dn = (f.json && f.json.displayName) || m[1]; pages++; pageTitle[m[1]] = dn; pageNames.push(dn); }
      });
      report.files.forEach((f) => {
        if (/reportExtensions\.json$/i.test(f.path)) {
          ((f.json && f.json.entities) || []).forEach((en) => (en.measures || []).forEach((ms) => ext.push({ entity: en.name, name: ms.name, expr: text(ms.expression) })));
          return;
        }
        const r = [];
        collectReportRefs(f.json, r, {});
        const pm = f.path.match(/pages\/([^/]+)\//);
        if (pm) r.forEach((x) => { x.page = pageTitle[pm[1]] || pm[1]; });
        refs.push.apply(refs, r);
        const vm = f.path.match(/pages\/([^/]+)\/visuals\/[^/]+\/visual\.json$/);
        if (vm) { visuals++; perVisual.push({ page: pageTitle[vm[1]] || vm[1], refs: r }); }
      });
    }
    if (!pages && !visuals) return null; // no report pages: treat as model only
    return { format: report.format, pages, visuals, pageNames, refs, perVisual, ext };
  }

  // ---------- 5. rule catalogue ----------
  // sev: high 8, medium 4, low 2, info 0 (per item, capped per rule)
  const SEV = { high: 8, medium: 4, low: 2, info: 0 };
  const CAP = { high: 30, medium: 20, low: 10, info: 0 };

  const RULES = {
    BIDI: { cat: 'perf', sev: 'medium',
      en: ['Relationships that filter in both directions', 'Both-direction filtering makes every query do more work and can create ambiguous paths between tables.', 'Set cross filter direction to Single. Where you need it, use CROSSFILTER(..., Both) inside the one measure that needs it.'],
      ar: ['علاقات تفلتر في الاتجاهين', 'الفلترة في الاتجاهين تجعل كل استعلام أبطأ وقد تسبب مسارات غامضة بين الجداول.', 'اجعل اتجاه الفلترة Single، واستخدم CROSSFILTER(..., Both) داخل المقياس الذي يحتاجه فقط.'] },
    M2M: { cat: 'perf', sev: 'medium',
      en: ['Many-to-many relationships', 'Many-to-many relationships are slower and often hide duplicate keys in a dimension.', 'Check the dimension for duplicate keys. If both sides really are many, use a bridge table with one-to-many relationships.'],
      ar: ['علاقات many-to-many', 'هذه العلاقات أبطأ وغالبًا تخفي مفاتيح مكررة في جدول الأبعاد.', 'تحقق من وجود مفاتيح مكررة. إن كان الطرفان متعددين فعلًا فاستخدم جدول bridge بعلاقات one-to-many.'] },
    AUTODATE: { cat: 'perf', sev: 'high',
      en: ['Auto date/time is on', 'Power BI builds a hidden date table for every date column. They add memory and refresh time and are rarely needed when you have a real calendar table.', 'File > Options > Current file > Data load: turn off Auto date/time, and use your own calendar table.'],
      ar: ['خاصية Auto date/time مفعّلة', 'ينشئ Power BI جدول تاريخ مخفيًا لكل عمود تاريخ، فيزيد الحجم ووقت التحديث بلا حاجة عند وجود جدول تقويم.', 'من File > Options > Current file > Data load أوقف Auto date/time واستخدم جدول التقويم الخاص بك.'] },
    UNUSED_COL: { cat: 'perf', sev: 'low',
      en: ['Columns not used anywhere', 'Every imported column costs memory and refresh time. These are not used in any visual, filter, measure, relationship, sort or security rule in this report.', 'Remove them in Power Query (not just hide them). If other reports use this model, check those first.'],
      ar: ['أعمدة غير مستخدمة', 'كل عمود مستورد يستهلك ذاكرة ووقت تحديث. هذه الأعمدة غير مستخدمة في أي visual أو فلتر أو مقياس أو علاقة أو ترتيب أو قاعدة أمان في هذا التقرير.', 'احذفها من Power Query (لا تكتفِ بإخفائها). إن كانت تقارير أخرى تستخدم النموذج فتحقق منها أولًا.'] },
    UNUSED_MEASURE: { cat: 'maint', sev: 'low',
      en: ['Measures not used by any visual', 'These measures are not in any visual or filter, and no used measure depends on them. Dead measures make the model harder to maintain.', 'Delete them, or move them to a display folder such as "Archive" if you want to keep them.'],
      ar: ['مقاييس غير مستخدمة في أي visual', 'هذه المقاييس ليست في أي visual أو فلتر، ولا يعتمد عليها أي مقياس مستخدم. المقاييس الميتة تصعّب صيانة النموذج.', 'احذفها، أو انقلها إلى مجلد مثل "Archive" إن أردت الاحتفاظ بها.'] },
    UNUSED_TABLE: { cat: 'perf', sev: 'medium',
      en: ['Tables not used at all', 'Nothing in the report, the measures or the relationships uses these tables.', 'Remove them, or disable load in Power Query if another query needs them.'],
      ar: ['جداول غير مستخدمة إطلاقًا', 'لا شيء في التقرير أو المقاييس أو العلاقات يستخدم هذه الجداول.', 'احذفها، أو أوقف Enable load في Power Query إن كان استعلام آخر يحتاجها.'] },
    DOUBLE: { cat: 'bp', sev: 'info',
      en: ['Decimal (floating point) columns', 'Decimal number columns can show tiny rounding differences in totals. Fixed decimal is exact to 4 places.', 'For money and rates, use Fixed decimal number in Power Query.'],
      ar: ['أعمدة Decimal (عشري عائم)', 'أعمدة Decimal قد تُظهر فروق تقريب صغيرة في الإجماليات، بينما Fixed decimal دقيق حتى 4 خانات.', 'للمبالغ والنسب استخدم Fixed decimal number في Power Query.'] },
    CALC_COLS: { cat: 'perf', sev: 'low',
      en: ['Calculated columns on imported tables', 'Calculated columns are computed after load, compress worse than Power Query columns and slow down refresh.', 'Move simple ones (IF, text, dates) into Power Query or the source. Keep DAX columns only when they need model data like RELATED across tables.'],
      ar: ['أعمدة محسوبة على جداول مستوردة', 'الأعمدة المحسوبة تُحسب بعد التحميل وتنضغط أسوأ من أعمدة Power Query وتبطئ التحديث.', 'انقل البسيطة منها (IF، نصوص، تواريخ) إلى Power Query أو المصدر، وأبقِ أعمدة DAX فقط عندما تحتاج بيانات النموذج مثل RELATED.'] },
    FILTER_TABLE: { cat: 'perf', sev: 'medium',
      en: ['FILTER over a whole table inside CALCULATE', 'FILTER(Table, ...) as a CALCULATE filter scans every row of the table. A column filter is much faster.', 'Filter the column instead: CALCULATE([Sales], Table[Column] = "X"), or KEEPFILTERS(Table[Column] = "X").'],
      ar: ['FILTER على جدول كامل داخل CALCULATE', 'استخدام FILTER(Table, ...) كفلتر داخل CALCULATE يمر على كل صفوف الجدول، وفلترة العمود أسرع بكثير.', 'فلتر العمود بدلًا من الجدول: CALCULATE([Sales], Table[Column] = "X") أو KEEPFILTERS(...).'] },
    IFERROR: { cat: 'perf', sev: 'low',
      en: ['IFERROR or ISERROR in measures', 'Error handling forces the engine to evaluate the expression row by row and hides real problems.', 'Use DIVIDE for division, and handle blanks with IF or COALESCE.'],
      ar: ['استخدام IFERROR أو ISERROR في المقاييس', 'التعامل مع الأخطاء يجبر المحرك على الحساب صفًا بصف ويخفي المشاكل الحقيقية.', 'استخدم DIVIDE للقسمة، وتعامل مع القيم الفارغة بـ IF أو COALESCE.'] },
    DIVISION: { cat: 'bp', sev: 'low',
      en: ['Division with "/" instead of DIVIDE', 'A "/" by a measure or column fails with an error or infinity when the denominator is zero or blank.', 'Use DIVIDE(numerator, denominator). It returns blank safely.'],
      ar: ['قسمة بـ "/" بدل DIVIDE', 'القسمة بـ "/" على مقياس أو عمود تعطي خطأ أو ما لا نهاية عندما يكون المقام صفرًا أو فارغًا.', 'استخدم DIVIDE(البسط، المقام) فهي تعيد قيمة فارغة بأمان.'] },
    INACTIVE_UNUSED: { cat: 'maint', sev: 'low',
      en: ['Inactive relationships nobody uses', 'An inactive relationship only matters when a measure turns it on with USERELATIONSHIP. No measure does for these.', 'Delete them, or add the measure that was meant to use them.'],
      ar: ['علاقات غير نشطة لا يستخدمها أحد', 'العلاقة غير النشطة لها فائدة فقط عندما يفعّلها مقياس بـ USERELATIONSHIP، ولا يوجد مقياس يفعل ذلك هنا.', 'احذفها، أو أضف المقياس الذي كان يُفترض أن يستخدمها.'] },
    DATE_NOT_MARKED: { cat: 'bp', sev: 'medium',
      en: ['Calendar table not marked as a date table', 'Time intelligence works more reliably when the calendar is marked as a date table, and marking it avoids auto date tables for it.', 'Table tools > Mark as date table, and choose the date column.'],
      ar: ['جدول التقويم غير معلَّم كجدول تاريخ', 'دوال الوقت تعمل بشكل أدق عندما يُعلَّم التقويم كجدول تاريخ.', 'من Table tools اختر Mark as date table وحدد عمود التاريخ.'] },
    CALENDARAUTO: { cat: 'perf', sev: 'low',
      en: ['CALENDARAUTO in a calendar table', 'CALENDARAUTO scans every date column in the model, so one wrong date (like 1900 or 2099) stretches the calendar and slows refresh.', 'Use CALENDAR with explicit start and end dates based on your fact tables.'],
      ar: ['استخدام CALENDARAUTO في جدول التقويم', 'CALENDARAUTO يفحص كل أعمدة التاريخ، فتاريخ خاطئ واحد (مثل 1900) يمد التقويم ويبطئ التحديث.', 'استخدم CALENDAR بتاريخ بداية ونهاية واضحين من جداول الحقائق.'] },
    FK_VISIBLE: { cat: 'maint', sev: 'low',
      en: ['Visible key columns on the many side', 'Report builders should slice by the dimension, not by the fact table key. Visible keys invite wrong filters.', 'Hide the key columns on the many side of relationships.'],
      ar: ['مفاتيح ظاهرة في جداول الحقائق', 'يجب التقطيع باستخدام جدول الأبعاد لا مفتاح جدول الحقائق، والمفاتيح الظاهرة تسبب فلاتر خاطئة.', 'أخفِ أعمدة المفاتيح في جهة many من العلاقات.'] },
    SUMMARIZE_KEYS: { cat: 'bp', sev: 'low',
      en: ['ID, year or code columns that sum by default', 'Numeric columns like IDs, years and codes should never be summed. Dragging them into a visual shows a meaningless total.', 'Set Summarization to Don\'t summarize for these columns.'],
      ar: ['أعمدة معرّفات أو سنوات أو أكواد يتم جمعها افتراضيًا', 'الأعمدة الرقمية مثل المعرّفات والسنوات والأكواد لا يجب جمعها، وسحبها في visual يعطي مجموعًا بلا معنى.', 'اضبط Summarization على Don\'t summarize لهذه الأعمدة.'] },
    NO_FORMAT: { cat: 'bp', sev: 'info',
      en: ['Measures without a format string', 'Without a format, the same number can show as 0.2345 in one visual and 23% in another, depending on who built it.', 'Set a format on each measure (whole number, %, currency).'],
      ar: ['مقاييس بدون تنسيق', 'بدون تنسيق قد يظهر نفس الرقم 0.2345 في visual و23% في آخر حسب من صممه.', 'حدد تنسيقًا لكل مقياس (رقم صحيح، نسبة، عملة).'] },
    PCT_FORMAT: { cat: 'bp', sev: 'low',
      en: ['Rate or % measures not formatted as percentage', 'The name says rate or percent but the format does not, so visuals show 0.23 instead of 23%.', 'Set the format to Percentage.'],
      ar: ['مقاييس نسب غير منسقة كنسبة مئوية', 'الاسم يدل على نسبة لكن التنسيق ليس نسبة، فتظهر 0.23 بدل 23%.', 'اضبط التنسيق على Percentage.'] },
    NO_FOLDERS: { cat: 'maint', sev: 'low',
      en: ['Measures without a display folder', 'With many measures, a flat list is hard to navigate for anyone who builds reports.', 'Group measures into display folders by topic (for example Sales, Leads, Time intelligence).'],
      ar: ['مقاييس بدون مجلد عرض', 'مع كثرة المقاييس تصبح القائمة المسطحة صعبة التصفح لمن يبني التقارير.', 'نظّم المقاييس في مجلدات حسب الموضوع (مثل Sales وLeads وTime intelligence).'] },
    NO_DESC: { cat: 'maint', sev: 'info',
      en: ['Measures without a description', 'Descriptions show as tooltips in the field list and are the cheapest documentation you can write.', 'Add a one-line description to the key measures first.'],
      ar: ['مقاييس بدون وصف', 'الوصف يظهر كتلميح في قائمة الحقول وهو أبسط توثيق ممكن.', 'أضف وصفًا من سطر واحد للمقاييس الأساسية أولًا.'] },
    QUALIFIED_MEASURE: { cat: 'maint', sev: 'info',
      en: ['Measures referenced with a table name', 'Writing Table[Measure] makes a measure look like a column. The common convention is [Measure] for measures and Table[Column] for columns.', 'Remove the table prefix from measure references.'],
      ar: ['الإشارة إلى مقاييس مع اسم جدول', 'كتابة Table[Measure] تجعل المقياس يبدو كعمود. العرف المتبع هو [Measure] للمقاييس وTable[Column] للأعمدة.', 'احذف اسم الجدول من الإشارات إلى المقاييس.'] },
    UNQUALIFIED_COLUMN: { cat: 'maint', sev: 'low',
      en: ['Column references without a table name in measures', 'In a measure, [Column] without a table is easy to confuse with a measure and breaks if a measure with the same name is added.', 'Always write Table[Column] for columns.'],
      ar: ['إشارة لأعمدة بدون اسم الجدول داخل المقاييس', 'كتابة [Column] بدون جدول داخل مقياس تجعله يشبه مقياسًا، وتنكسر إذا أُضيف مقياس بنفس الاسم.', 'اكتب دائمًا Table[Column] للأعمدة.'] },
    DUP_MEASURE: { cat: 'maint', sev: 'low',
      en: ['Measures with identical DAX', 'Two measures with the same formula drift apart when one is edited and the other is forgotten.', 'Keep one and point visuals and other measures to it.'],
      ar: ['مقاييس لها نفس صيغة DAX', 'مقياسان بنفس الصيغة يختلفان مع الوقت عندما يُعدَّل أحدهما ويُنسى الآخر.', 'احتفظ بواحد واجعل الـ visuals والمقاييس الأخرى تستخدمه.'] },
    LONG_MEASURE: { cat: 'maint', sev: 'info',
      en: ['Very long measures', 'Measures over 60 lines are hard to review and often mix several jobs.', 'Split them with variables and helper measures.'],
      ar: ['مقاييس طويلة جدًا', 'المقاييس التي تزيد عن 60 سطرًا صعبة المراجعة وغالبًا تجمع أكثر من مهمة.', 'قسّمها باستخدام المتغيرات ومقاييس مساعدة.'] },
    DEEP_CHAIN: { cat: 'maint', sev: 'info',
      en: ['Deep measure chains', 'These measures sit on top of 8 or more levels of other measures. A change at the bottom is hard to trace.', 'Check the chain in the Measures tab and flatten where a level adds nothing.'],
      ar: ['سلاسل مقاييس عميقة', 'هذه المقاييس تعتمد على 8 مستويات أو أكثر من مقاييس أخرى، وأي تعديل في الأسفل يصعب تتبعه.', 'راجع السلسلة في تبويب المقاييس وقلّل المستويات غير الضرورية.'] },
    NAMING: { cat: 'maint', sev: 'low',
      en: ['Mixed table naming styles', 'Some tables use one style (Dim_X) and others another (Dim X). Consistent names make the model easier to read.', 'Pick one convention and rename the tables that differ.'],
      ar: ['أسماء جداول بأنماط مختلفة', 'بعض الجداول بنمط (Dim_X) وأخرى بنمط (Dim X)، والأسماء الموحدة تجعل النموذج أسهل للقراءة.', 'اختر نمطًا واحدًا وأعد تسمية الجداول المختلفة.'] },
    TRAILING_SPACE: { cat: 'maint', sev: 'low',
      en: ['Names with leading or trailing spaces', 'Extra spaces in names break copy-pasted DAX and look like duplicates in the field list.', 'Rename them without the extra spaces.'],
      ar: ['أسماء تبدأ أو تنتهي بمسافة', 'المسافات الزائدة في الأسماء تكسر DAX المنسوخ وتبدو كتكرار في قائمة الحقول.', 'أعد التسمية بدون المسافات الزائدة.'] },
    HARDCODED_PATH: { cat: 'bp', sev: 'low',
      en: ['Hard-coded file paths or servers in Power Query', 'Paths to a personal folder or a fixed server break when someone else refreshes or when you move to test and production.', 'Put the server, database or folder in a Power Query parameter.'],
      ar: ['مسارات ملفات أو خوادم مكتوبة مباشرة في Power Query', 'المسارات إلى مجلد شخصي أو خادم ثابت تنكسر عند التحديث من شخص آخر أو عند الانتقال بين بيئات الاختبار والإنتاج.', 'ضع الخادم أو قاعدة البيانات أو المجلد في Parameter داخل Power Query.'] },
    TABLE_BUFFER: { cat: 'perf', sev: 'info',
      en: ['Table.Buffer in Power Query', 'Table.Buffer loads the whole table into memory and stops query folding. It helps in a few cases and hurts in most.', 'Remove it unless you measured that it speeds up this query.'],
      ar: ['استخدام Table.Buffer في Power Query', 'Table.Buffer يحمّل الجدول كاملًا في الذاكرة ويوقف query folding، ويفيد في حالات قليلة ويضر في أغلبها.', 'احذفه إلا إذا قست أنه يسرّع هذا الاستعلام فعلًا.'] },
    LONG_M: { cat: 'maint', sev: 'info',
      en: ['Very long Power Query queries', 'Queries with more than 40 steps are hard to debug and usually repeat work that could be a function or done at the source.', 'Move repeated logic into a function or into a view at the source.'],
      ar: ['استعلامات Power Query طويلة جدًا', 'الاستعلامات التي تتجاوز 40 خطوة صعبة التتبع وغالبًا تكرر عملًا يمكن جعله دالة أو تنفيذه في المصدر.', 'انقل المنطق المتكرر إلى دالة أو إلى view في المصدر.'] },
    MONTH_SORT: { cat: 'bp', sev: 'medium',
      en: ['Month or day names without a sort column', 'Month and weekday names sort alphabetically (April, August, December) unless you set Sort by column.', 'Select the column > Sort by column > the month or day number.'],
      ar: ['أسماء الشهور أو الأيام بدون عمود ترتيب', 'أسماء الشهور والأيام تترتب أبجديًا (April, August, December) ما لم تضبط Sort by column.', 'اختر العمود ثم Sort by column ثم رقم الشهر أو اليوم.'] },
    NO_RLS: { cat: 'bp', sev: 'info',
      en: ['No row-level security roles', 'Fine for a personal report. If the model is shared with teams who should see only their own data, RLS is the safe way to do it.', 'Add roles in Modeling > Manage roles if different people should see different rows.'],
      ar: ['لا توجد أدوار Row-level security', 'لا بأس لتقرير شخصي، لكن إن كان النموذج مشتركًا مع فرق يجب أن يرى كل منها بياناته فقط فإن RLS هو الطريقة الآمنة.', 'أضف أدوارًا من Modeling > Manage roles إن كان يجب أن يرى كل شخص صفوفًا مختلفة.'] },
    BROKEN_REF: { cat: 'bp', sev: 'high',
      en: ['Visuals that point to fields that no longer exist', 'These visuals or filters use a measure or column that was renamed or deleted. They show an error or a blank box to report users.', 'Open each page listed, then replace or remove the broken field in the visual or filter.'],
      ar: ['Visuals تشير إلى حقول لم تعد موجودة', 'هذه الـ visuals أو الفلاتر تستخدم مقياسًا أو عمودًا تمت إعادة تسميته أو حذفه، فتظهر خطأ أو مربعًا فارغًا لمستخدمي التقرير.', 'افتح كل صفحة مذكورة واستبدل الحقل المكسور أو احذفه من الـ visual أو الفلتر.'] },
    USEREL_ACTIVE: { cat: 'maint', sev: 'low',
      en: ['USERELATIONSHIP on a relationship that is already active', 'USERELATIONSHIP only changes something for inactive relationships. On an active one it does nothing and confuses whoever reads the measure next.', 'Remove the USERELATIONSHIP call, or check whether the intended relationship is a different, inactive one.'],
      ar: ['USERELATIONSHIP على علاقة نشطة بالفعل', 'USERELATIONSHIP يغيّر شيئًا فقط مع العلاقات غير النشطة، وعلى علاقة نشطة لا يفعل شيئًا ويربك من يقرأ المقياس لاحقًا.', 'احذف USERELATIONSHIP أو تحقق إن كانت العلاقة المقصودة علاقة أخرى غير نشطة.'] },
    STRING_KEYS: { cat: 'perf', sev: 'info',
      en: ['Text columns used as relationship keys', 'Relationships on whole numbers are smaller and faster than on text.', 'Where the source allows, relate on an integer key.'],
      ar: ['أعمدة نصية كمفاتيح علاقات', 'العلاقات على أرقام صحيحة أصغر وأسرع من العلاقات على النصوص.', 'استخدم مفتاحًا رقميًا صحيحًا للعلاقة حيثما أمكن.'] }
  };

  // ---------- 6. analysis ----------
  function analyze(modelJson, report) {
    const M = normalizeModel(modelJson);
    const IX = buildIndex(M);
    const deps = new Map();   // node -> Set(nodes it depends on)
    const addDeps = (node, arr) => { if (!deps.has(node)) deps.set(node, new Set()); arr.forEach((x) => deps.get(node).add(x)); };
    const styleByMeasure = {};
    const findings = [];
    const add = (id, items) => { if (items && items.length) findings.push({ id, items }); };

    const autoDateTables = M.tables.filter((t) => /^(LocalDateTable_|DateTableTemplate_)/.test(t.name));
    const autoSet = new Set(autoDateTables.map((t) => lc(t.name)));
    const userTables = M.tables.filter((t) => !autoSet.has(lc(t.name)));

    // dependencies from DAX
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
      t.hierarchies.forEach((h) => h.levels.forEach((l) => addDeps('h:' + lc(t.name) + '|' + lc(h.name), [K.c(t.name, l.column)])));
      // a column always needs its table
      t.columns.forEach((c) => addDeps(K.c(t.name, c.name), [K.t(t.name)]));
      t.measures.forEach((ms) => addDeps(K.m(ms.name), [K.t(t.name)]));
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
      const b = broken.get(k); b.n++; if (r.page) b.pages.add(r.page);
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

    // ---- relationships ----
    add('BIDI', M.relationships.filter((r) => r.cross === 'bothDirections').map((r) => ({ obj: `${r.fromTable}[${r.fromColumn}] ↔ ${r.toTable}[${r.toColumn}]` })));
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
    if (broken.size) add('BROKEN_REF', Array.from(broken.values()).sort((a, b) => b.n - a.n).map((b) => ({ obj: b.obj, detail: Array.from(b.pages).slice(0, 3).join(', ') })));
    const strKeys = [];
    M.relationships.forEach((r) => {
      const c = IX.columns.get(lc(r.toTable) + '|' + lc(r.toColumn));
      if (c && c.col.dataType === 'string' && !strKeys.some((x) => x.obj === `${r.toTable}[${r.toColumn}]`)) strKeys.push({ obj: `${r.toTable}[${r.toColumn}]` });
    });
    add('STRING_KEYS', strKeys);

    // ---- auto date/time ----
    if (autoDateTables.length) add('AUTODATE', autoDateTables.filter((t) => /^LocalDateTable_/.test(t.name)).map((t) => {
      const owner = M.tables.find((x) => x.columns.some((c) => c.relatedColumnDetails || (c.extendedProperties && JSON.stringify(c.extendedProperties).includes(t.name))));
      return { obj: t.name, detail: owner ? owner.name : '' };
    }));

    // ---- unused (only with a report) ----
    if (rep) {
      const unusedCols = [];
      userTables.forEach((t) => {
        if (t.calcGroup) return;
        const measureTable = t.measures.length > 0 && t.columns.filter((c) => c.kind !== 'rowNumber').length <= 1;
        t.columns.forEach((c) => {
          if (c.kind === 'rowNumber') return;
          if (measureTable && c.hidden) return; // placeholder column of a measures-only table
          if (!used.has(K.c(t.name, c.name))) unusedCols.push({ obj: `${t.name}[${c.name}]`, detail: t.isCalcTable ? 'DAX table: edit its DAX' : c.kind === 'calculated' ? 'calculated' : (c.hidden ? 'hidden' : '') });
        });
      });
      add('UNUSED_COL', unusedCols);
      add('UNUSED_MEASURE', allMeasures.filter((ms) => !used.has(K.m(ms.name))).map((ms) => ({ obj: `[${ms.name}]`, detail: ms.displayFolder })));
      add('UNUSED_TABLE', userTables.filter((t) => !used.has(K.t(t.name)) && !t.columns.some((c) => used.has(K.c(t.name, c.name))) && !t.measures.some((ms) => used.has(K.m(ms.name)))).map((t) => ({ obj: t.name })));
    }

    // ---- columns ----
    const doubles = [], calcCols = [], fkVisible = [], sumKeys = [], monthSort = [];
    const manySide = new Set(M.relationships.filter((r) => r.fromCard === 'many' && r.toCard === 'one').map((r) => lc(r.fromTable) + '|' + lc(r.fromColumn)));
    const isUnused = (t, c) => rep && !used.has(K.c(t.name, c.name));
    userTables.forEach((t) => {
      const importFromSource = !t.isCalcTable && t.mode !== 'directQuery';
      t.columns.forEach((c) => {
        if (c.kind === 'rowNumber') return;
        if (c.dataType === 'double' && !c.hidden) doubles.push({ obj: `${t.name}[${c.name}]` });
        if (c.kind === 'calculated' && importFromSource) calcCols.push({ obj: `${t.name}[${c.name}]`, detail: /RELATED|LOOKUPVALUE|CALCULATE|SUMX|COUNTROWS|FILTER/i.test(c.expr) ? 'uses model data' : '' });
        if (isUnused(t, c)) return; // already reported as unused, do not count it twice
        if (!c.hidden && manySide.has(lc(t.name) + '|' + lc(c.name))) fkVisible.push({ obj: `${t.name}[${c.name}]` });
        const cn = c.name.trim();
        if (!c.hidden && /^(int64|double|decimal)$/.test(c.dataType) && (c.summarizeBy === 'default' || c.summarizeBy === 'sum') && /((^|[\s_])(id|key|code|no|index)$|_id$|^(year|month|week|day|quarter)(\s*(no|num|number))?$|^(fiscal\s*)?year$|(month|week|day|quarter)\s*(no|num|number|of year)$|sort\s*(order|key)?$)/i.test(cn)) sumKeys.push({ obj: `${t.name}[${c.name}]` });
        const monthLike = /(^|\s|_)(month|day|weekday)\s*_?(name|short)$|^(day of week|weekday|mmm|mmmm)$|short\s*month|month\s*-?\s*year|^month\s*year$/i.test(cn) || (c.kind === 'calculated' && /FORMAT\s*\([^)]*"\s*(mmm|mmmm|ddd|dddd)\s*"/i.test(c.expr));
        if (monthLike && c.dataType === 'string' && !c.sortBy) monthSort.push({ obj: `${t.name}[${c.name}]` });
      });
    });
    add('DOUBLE', doubles); add('CALC_COLS', calcCols); add('FK_VISIBLE', fkVisible); add('SUMMARIZE_KEYS', sumKeys); add('MONTH_SORT', monthSort);

    // ---- date table ----
    const dateParts = (t) => t.columns.filter((c) => /^(year|month|month name|month number|quarter|weekday|week|day|fiscal year)/i.test(c.name.trim())).length;
    const relDateTargets = new Set(M.relationships.map((r) => lc(r.toTable) + '|' + lc(r.toColumn)));
    const calendars = userTables.filter((t) => t.columns.some((c) => c.dataType === 'dateTime') && (
      /^(dim[_ ]?)?(calendar|dates?|date\s*table|تقويم)\b/i.test(t.name.trim()) ||
      (dateParts(t) >= 2 && t.columns.some((c) => c.dataType === 'dateTime' && relDateTargets.has(lc(t.name) + '|' + lc(c.name))))));
    add('DATE_NOT_MARKED', calendars.filter((t) => lc(t.dataCategory) !== 'time').map((t) => ({ obj: t.name })));
    add('CALENDARAUTO', userTables.filter((t) => t.isCalcTable && /CALENDARAUTO\s*\(/i.test(daxCode(t.calcExpr))).map((t) => ({ obj: t.name })));

    // ---- DAX patterns ----
    const filterTable = [], iferr = [], division = [], noFmt = [], pctFmt = [], noFolder = [], noDesc = [], longMs = [], deep = [], qualM = [], unqualC = [];
    // FILTER(<table>, ...) or FILTER(ALL(<table>), ...) used directly as a filter argument of CALCULATE / CALCULATETABLE
    const isTbl = (tk) => tk && (tk.t === 'tbl' || tk.t === 'id') && IX.tables.has(lc(tk.v));
    const filterOverTable = (src) => {
      const tk = tokenizeDax(src), stack = [];
      for (let i = 0; i < tk.length; i++) {
        const t = tk[i];
        if (t.t === 'op' && t.v === '(') { stack.push({ fn: tk[i - 1] && tk[i - 1].t === 'id' ? tk[i - 1].v.toUpperCase() : '', argStart: true }); continue; }
        if (t.t === 'op' && t.v === ')') { stack.pop(); continue; }
        if (t.t === 'op' && t.v === ',') { if (stack.length) stack[stack.length - 1].argStart = true; continue; }
        const top = stack[stack.length - 1];
        if (top && top.argStart && /^CALCULATE(TABLE)?$/.test(top.fn) && t.t === 'id' && t.v.toUpperCase() === 'FILTER' && tk[i + 1] && tk[i + 1].v === '(') {
          const a = tk[i + 2];
          if (isTbl(a) && tk[i + 3] && tk[i + 3].v === ',') return true;
          if (a && a.t === 'id' && /^(ALL|ALLNOBLANKROW)$/i.test(a.v) && tk[i + 3] && tk[i + 3].v === '(' && isTbl(tk[i + 4]) && tk[i + 5] && tk[i + 5].v === ')') return true;
        }
        if (top && t.t !== 'op') top.argStart = false;
      }
      return false;
    };
    allMeasures.forEach((ms) => {
      const code = daxCode(ms.expr);
      const name = `[${ms.name}]`;
      if (/\bCALCULATE(TABLE)?\b/i.test(code) && /\bFILTER\b/i.test(code) && filterOverTable(ms.expr)) filterTable.push({ obj: name });
      if (/\b(IFERROR|ISERROR)\s*\(/i.test(code)) iferr.push({ obj: name });
      // "/" followed by something that is not a plain number
      if (/\/\s*(?![\d.\s]+(?:[)\s,]|$))[\[\w'(]/.test(code)) division.push({ obj: name });
      if (!ms.formatString && !ms.fsExpr) noFmt.push({ obj: name });
      if (/(%|\bpct\b|\bpercent(age)?\b|\brate\b|\bratio\b|\bshare\b)/i.test(ms.name) && !/(colou?r|icon|label|text|arrow|title|\bpp\b|\(pp\)|mom|yoy|delta|change|diff|hourly|exchange|run rate|\bper\b|▲|▼)/i.test(ms.name) && ms.formatString && !/[%@]|pp|percent/i.test(ms.formatString) && !ms.fsExpr) pctFmt.push({ obj: name, detail: ms.formatString });
      if (!ms.displayFolder) noFolder.push({ obj: name });
      if (!ms.description) noDesc.push({ obj: name });
      const lines = ms.expr.split('\n').length;
      if (lines > 60) longMs.push({ obj: name, detail: lines + ' lines' });
      const dd = depth(K.m(ms.name), new Set());
      if (dd >= 8) deep.push({ obj: name, detail: dd + ' levels' });
      const st = styleByMeasure[ms.name];
      if (st && st.qualifiedMeasures.length) qualM.push({ obj: name, detail: uniq(st.qualifiedMeasures).slice(0, 3).join(', ') });
      if (st && st.unqualifiedColumns.length) unqualC.push({ obj: name, detail: uniq(st.unqualifiedColumns).slice(0, 3).join(', ') });
    });
    add('FILTER_TABLE', filterTable); add('IFERROR', iferr); add('DIVISION', division);
    add('NO_FORMAT', noFmt); add('PCT_FORMAT', pctFmt);
    if (allMeasures.length >= 20 && noFolder.length / allMeasures.length > 0.3) add('NO_FOLDERS', noFolder);
    if (allMeasures.length && noDesc.length / allMeasures.length > 0.5) add('NO_DESC', noDesc);
    add('LONG_MEASURE', longMs); add('DEEP_CHAIN', deep);
    add('QUALIFIED_MEASURE', qualM); add('UNQUALIFIED_COLUMN', unqualC);

    // identical DAX
    const byExpr = new Map();
    allMeasures.forEach((ms) => { const k = tokenizeDax(ms.expr).map((t) => t.t + ':' + t.v).join('\u0001').toLowerCase(); if (k.length < 24) return; if (!byExpr.has(k)) byExpr.set(k, []); byExpr.get(k).push(ms.name); });
    const dups = [];
    byExpr.forEach((names) => { if (names.length > 1) dups.push({ obj: names.map((n) => `[${n}]`).join(' = ') }); });
    add('DUP_MEASURE', dups);

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

    // ---- Power Query ----
    const mQueries = [];
    userTables.forEach((t) => t.partitions.forEach((p) => { if (p.sourceType === 'm' && p.expression) mQueries.push({ name: t.name, expr: p.expression }); }));
    M.expressions.forEach((e) => { if (e.kind === 'm') mQueries.push({ name: e.name, expr: e.expr, isExpr: true }); });
    const hard = [], buffer = [], longM = [];
    const sources = new Map();
    mQueries.forEach((q) => {
      const e = q.expr;
      const isParam = /IsParameterQuery\s*=\s*true/i.test(e);
      const isEntitySource = q.isExpr && (M.entityExprs.has(lc(q.name)) || /^DatabaseQuery$/i.test(q.name));
      const literalDb = /\b(Sql\.Databases?|Oracle\.Database|MySQL\.Database|PostgreSQL\.Database|Snowflake\.Databases|AnalysisServices\.Databases?|Teradata\.Database|Sybase\.Database|IbmDb2\.Database|SapHana\.Database)\s*\(\s*"[^"]+"/.test(e);
      if (!isParam && !isEntitySource && literalDb) hard.push({ obj: q.name });
      else if (!isParam && !isEntitySource && /"(?:[A-Za-z]:\\\\?|\\\\\\\\|https?:\/\/[^"]*(?:sharepoint|onedrive|\.database\.windows\.net|\.fabric\.microsoft\.com|\.datawarehouse)|[a-z0-9-]+\.(?:database\.windows\.net|datawarehouse\.fabric\.microsoft\.com))/i.test(e)) hard.push({ obj: q.name });
      if (/Table\.Buffer\s*\(/.test(e)) buffer.push({ obj: q.name });
      const steps = (e.match(/^\s*(#"[^"]+"|[A-Za-z_]\w*)\s*=/gm) || []).length;
      if (steps > 40) longM.push({ obj: q.name, detail: steps + ' steps' });
      (e.match(/\b(Sql\.Databases?|Lakehouse\.Contents|Fabric\.Warehouse|PowerPlatform\.Dataflows|PowerBI\.Dataflows|SharePoint\.(?:Files|Contents|Tables)|Excel\.Workbook|Csv\.Document|Web\.Contents|OData\.Feed|Odbc\.DataSource|OleDb\.DataSource|Oracle\.Database|MySQL\.Database|PostgreSQL\.Database|Snowflake\.Databases|GoogleBigQuery\.Database|Salesforce\.Data|Dynamics365\.Contents|CommonDataService\.Database|AzureStorage\.DataLake|Folder\.Files|Json\.Document|Databricks\.Catalogs)\b/g) || []).forEach((s) => sources.set(s, (sources.get(s) || 0) + 1));
    });
    add('HARDCODED_PATH', hard); add('TABLE_BUFFER', buffer); add('LONG_M', longM);
    if (!M.roles.length) add('NO_RLS', [{ obj: 'Model' }]);

    // ---- scores ----
    const catScore = { perf: 100, maint: 100, bp: 100 };
    // Rules that apply to many objects are judged by the share of objects affected, so a large model is not punished for being large.
    const SCOPE = {
      measures: ['FILTER_TABLE', 'IFERROR', 'DIVISION', 'NO_FORMAT', 'PCT_FORMAT', 'UNUSED_MEASURE', 'QUALIFIED_MEASURE', 'UNQUALIFIED_COLUMN', 'LONG_MEASURE', 'DEEP_CHAIN', 'NO_DESC', 'NO_FOLDERS', 'DUP_MEASURE'],
      columns: ['UNUSED_COL', 'DOUBLE', 'CALC_COLS', 'FK_VISIBLE', 'SUMMARIZE_KEYS', 'TRAILING_SPACE'],
      rels: ['BIDI', 'M2M', 'INACTIVE_UNUSED', 'STRING_KEYS', 'USEREL_ACTIVE'],
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
      tables,
      measures,
      relationships: M.relationships,
      roles: M.roles.map((r) => ({ name: r.name, tables: r.permissions.map((p) => p.table) })),
      pageNames: rep ? rep.pageNames : [],
      rawTables: (((modelJson || {}).model || modelJson || {}).tables || []).filter((t) => t && t.name != null).map((t) => ({ name: String(t.name), columns: t.columns || [], measures: t.measures || [] }))
    };
  }

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

  const api = { analyze, scoreFrom, normalizeModel, tokenizeDax, daxRefs, collectReportRefs, analyzeReport, RULES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MHEngine = api;
})(typeof self !== 'undefined' ? self : this);
