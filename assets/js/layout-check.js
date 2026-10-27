/*! DataArcus layout check | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The check of a generated project before it is written or downloaded (0.3.0 step 2, "Check before download / before
// write", the owner's go of 18 Oct 2026): the measured rules (report-rules.js: what Power BI Desktop draws) and the
// layout check (the design lint, moved here from mcp/lib/design-lint.mjs, which is now its adapter) on the project's
// files in memory. One engine for the MCP (create_report, the approval window) and the lab page's download.
// Structure only: the check reads the report's files (types, places, sizes, titles, fields, formatting), never data.
// Browser and Node (module.exports / window.DALayoutCheck).
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const VT = node ? require('./visual-types.js') : root.DAVisualTypes;
  const Rules = () => (node ? require('./report-rules.js') : root.DARules);

  // ---------- the design lint (from mcp/lib/design-lint.mjs, unchanged in what it finds) ----------
  // LAYER checks (0.2.9 item 11): the design lint. It reads the reading layer's inventory (lib/read-report.mjs) and,
  // when it has one, the model's tables (types and sort-by columns: what a report's files cannot say), and never opens a
  // report file itself. It never reads data: what depends on the data (how long the labels are, how many points an axis
  // has) is a guess from names and types, and such a finding is marked "~" (guess: true). Measured on the laptop
  // against the owner's test reports (Desktop 2.158): the time axis (O-13), bar labels (O-4), tables (O-14) and the logo
  // placeholder (O-6) were caught wherever they happened, and the table rule was narrowed to the setting that was seen
  // to fail ("grow to fit" without word wrap), which removed most false alarms on hand-built reports.
  // A finding names the visual by its type, title (cleaned), place and size; it never quotes a text box or a value.
  // the names a finding shows, by default as the report has them; the MCP gives its own (screened and capped)
  const NAMES = {
    refOf: (x) => { if (!x) return '(an expression)'; const core = x.kind === 'measure' ? `[${x.name}]${x.report ? '(report measure)' : ''}` : `${x.table}[${x.name}]${x.level ? '.' + x.level : ''}`; return x.agg ? `${x.agg}(${core})` : core; },
    keyOf: (x) => (x && x.kind !== 'measure' ? `${x.table}[${x.name}]` : null),
    typeName: (t) => (t === 'group' || VT.isNative(t) ? t : 'custom ' + t)
  };
  const LINT_RULES = {
    AXIS_TEXT_TIME_UNSORTED: 'a chart\'s axis is a text column with a time-like name, no sort-by column in the model, and the visual is not sorted by another field: it sorts A to Z (O-13)',
    AXIS_TIME_UNKNOWN: 'a time-like axis whose type and sort-by column are unknown (no model read)',
    AXIS_HAS_BLANK: 'a chart\'s axis field has a blank value and no "is not blank" filter: a "(Blank)" point (O-3); runs only when the blank count is known',
    TABLE_GROW_TO_FIT: 'a table with "grow to fit" columns, no word wrap and a text column: the text column grows and pushes the others off (O-14)',
    TABLE_WIDTHS_TOO_WIDE: 'a table\'s set column widths add up to more than the table',
    BAR_LABELS_MAY_BE_CUT: 'a bar chart whose category axis holds fewer than 18 characters at the label size: longer names end in "..." (O-4)',
    OFF_PAGE: 'a visual outside the page',
    OVERLAP: 'two visible data visuals, cards or slicers overlapping by more than 10% of the smaller',
    COVER_CARDS: 'a card laid over another visual at the same place (a "no data" message): counted apart, not an overlap',
    NO_TITLE: 'a chart or table whose title is switched off, with no text box just above it (with no title setting Power BI draws its own title)',
    PLACEHOLDER_TEXT: 'placeholder wording left in a title or text box ("Your logo", «شعارك», lorem ipsum...) (O-6)'
  };

  const CHARTS = /^(lineChart|areaChart|stackedAreaChart|columnChart|clusteredColumnChart|barChart|clusteredBarChart|stackedBarChart|stackedColumnChart|hundredPercentStacked\w+|line\w*ComboChart|ribbonChart|waterfallChart)$/;
  const BARS = /^(barChart|clusteredBarChart|stackedBarChart|hundredPercentStackedBarChart)$/;
  const DATA = /Chart$|^tableEx$|^pivotTable$|^treemap$|^funnel$|^gauge$|^map$|^filledMap$|^azureMap$/;
  // (A4-9, audit 4: a time-like name by its whole words, never inside another word: "Candidate" and "Update Status" are
  // not dates; "OrderDate", "Month-Year", "fiscal_period", «الشهر» are) a name's words: split on spaces, marks and camel case
  const wordsOf = (name) => String(name || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9\u0600-\u06ff]+/).filter(Boolean).map((w) => w.replace(/^ال(?=..)/, ''));
  const TIME_WORDS = new Set(['month', 'months', 'year', 'years', 'date', 'dates', 'week', 'weeks', 'quarter', 'quarters', 'qtr', 'period', 'periods', 'day', 'days', 'شهر', 'سنة', 'تاريخ', 'أسبوع', 'ربع', 'يوم']);
  const TIMEY = { test: (name) => wordsOf(name).some((w) => TIME_WORDS.has(w)) };
  const many = (name) => { const w = wordsOf(name); return (w.some((x) => /^months?$/.test(x)) && w.some((x) => /^years?$/.test(x))) || w.some((x) => /^dates?$|^تاريخ$/.test(x)); };
  // (A4-8) the reading layer's titleOff; a visual JSON when given (the reading branch's inventory keeps it, a test's too)
  const titleOff = (x) => { if (x.titleOff) return true; const t = (((((x.json || {}).visual || {}).visualContainerObjects || {}).title) || []).find((e) => e && !e.selector && e.properties && e.properties.show); const v = t && t.properties.show.expr && t.properties.show.expr.Literal && t.properties.show.expr.Literal.Value; return String(v) === 'false'; };
  const PLACEHOLDER = /your logo|logo here|lorem ipsum|placeholder|title here|text here|click to add|شعارك|عنوان هنا|نص هنا/i;
  // a character of a label at a point size (Segoe UI, measured in the report-fixes lab): 1.333 px a point x 0.57 em
  // (R7, the cross-review: every number the rules use, named, with where it comes from; a number that was chosen and not
  // measured says so, and a finding that rests on one, or on a word list, is a guess)
  const MEASURED = {
    PX_PER_PT: { value: 1.333, source: 'a point is 4/3 of a page unit (Power BI\'s 96 dpi page)' },
    CHAR_EM: { value: 0.57, source: 'measured on the laptop, Power BI Desktop 2.158, 10 Oct 2026: the average width of a category label\'s character in Segoe UI, in em' },
    AXIS_SHARE: { value: 25, source: 'Power BI\'s default category-axis maximum width, in % of the visual (no maxMarginFactor set)' },
    BAR_FIT_WARN: { value: 18, source: 'chosen, not measured: fewer characters than this on a bar chart\'s axis is worth a look (a guess)' },
    BAR_FIT_HIGH: { value: 13, source: 'chosen, not measured: fewer than this is likely to cut most names (a guess)' },
    TABLE_SLACK: { value: 20, source: 'chosen, not measured: set widths more than this past the table\'s width scroll' },
    PIVOT_SCROLL: { value: 1.5, source: 'chosen, not measured: a matrix\'s set widths scroll by design up to 1.5 x its width' },
    PAGE_SLACK: { value: 1, source: 'chosen: a visual this far past the page edge is still on the page (rounding)' },
    LABEL_ABOVE: { value: 70, source: 'chosen, not measured: a text box ending up to this far above a visual names it' },
    LABEL_INTO: { value: 12, source: 'chosen, not measured: ... or reaching this far into it' },
    COVER_NEAR: { value: 3, source: 'chosen, not measured: a card within this of another visual\'s place and size lies over it (a "no data" message)' },
    OVERLAP_SHARE: { value: 0.1, source: 'chosen, not measured: an overlap above this share of the smaller visual is worth a look' },
    OVERLAP_HIGH: { value: 0.5, source: 'chosen, not measured: above this share an overlap is high' }
  };
  const V = (k) => MEASURED[k].value;
  const pxPerChar = (pt) => pt * V('PX_PER_PT') * V('CHAR_EM');

  // model: the model reader's tables ([{ name, columns: [{ name, dataType, sortBy }] }]) or null
  // facts: { "Table[Column]": { blank: true } } (the blank count, when the user agreed to read it; not read by the MCP yet)
  // opts: { pages: [page numbers] } to lint only those
  function lint(inv, model, facts, opts) {
    const o = opts || {}, cols = {};
    // (the names of fields and types as the caller shows them: the MCP screens and caps them, read-report.mjs; the page
    // shows them as the user's own)
    const { keyOf, refOf, typeName } = Object.assign({}, NAMES, o.names || {});
    (model || []).forEach((t) => (t.columns || []).forEach((c) => { cols[`${t.name}[${c.name}]`] = { type: String(c.dataType || 'unknown').toLowerCase(), sortBy: c.sortBy || null }; }));
    const hasModel = !!(model && model.length);
    const findings = [];
    // (o.titles false: the visual by its type and place only; check_report's lint never returns a report's text, the owner's
    // decision R5 of 11 Oct) (o.places: each finding also gives its visual's place in plain words, placeOf; SQ5)
    // (R4: the type through the reading block's screen, never raw; the place rounded)
    const where = (x) => `${typeName(x.type)}${x.title && o.titles !== false ? ` "${x.title}"` : ''} at ${Math.round(x.x)},${Math.round(x.y)} ${Math.round(x.w)}x${Math.round(x.h)}`;
    const add = (rule, severity, p, x, why, fix, guess) => findings.push(Object.assign({ rule, severity, guess: !!guess, page: { n: p.n, name: p.name }, visual: x ? where(x) : null, why, fix }, x && o.places ? { place: placeOf(x, p) } : {}));
    const typeOf = (f) => { const k = keyOf(f), m = k && cols[k]; return m ? m.type : null; };
    const isText = (f) => { if (!f || f.kind !== 'column') return false; const t = typeOf(f); return t == null || t === 'unknown' || t === 'string'; };
    for (const p of inv.pages) {
      if (o.pages && o.pages.length && !o.pages.includes(p.n)) continue;
      const shown = p.visuals.filter((x) => !x.hidden && !x.hiddenByGroup && x.type !== 'group');
      for (const x of shown) {
        const F = x.fields || {}, cat = F.Category || [];
        // (a) a text month or date on an axis, sorted A to Z (O-13)
        if (CHARTS.test(x.type)) for (const f of cat) {
          if (!f || f.kind !== 'column' || !TIMEY.test(f.name)) continue;
          const k = keyOf(f), m = cols[k];
          // (N16, the laptop's RESCORE-3: a chart sorted by anything but the axis's own text, its measure (by value)
          // included, is ordered on purpose: no alphabetical time axis to warn about)
          const sortedByOther = x.sort.some((s) => s.field && !(s.field.table === f.table && s.field.name === f.name));
          if (sortedByOther) continue;
          if (m && m.type === 'string' && !m.sortBy)
            add('AXIS_TEXT_TIME_UNSORTED', many(f.name) ? 'high' : 'medium', p, x, `${refOf(f)} is a text column and the model gives it no sort-by column, so the axis runs in alphabetical order${x.sort.length ? ' (the visual is sorted by this text itself)' : ''}${many(f.name) ? '; a label holding month and year is likely to give many points and a scrollbar' : ''}`,
              'order the chart by the earliest date of each label (a MIN of the date column in Tooltips, then sort by it), and keep the last 12 months when there are more than about two years; or put Year and Month on the axis as two levels', true);   // (R7: a time field known by the words of its name: a guess)
          else if (m && m.type === 'unknown' && !m.sortBy)
            add('AXIS_TEXT_TIME_UNSORTED', 'medium', p, x, `If ${refOf(f)} holds text, the chart shows it in alphabetical order (April, August, December...), not in time order`, 'in Power BI Desktop, check that the chart runs in time order; if not, select the column and choose Column tools > Sort by column, then its date or month number', true);   // (R4A, round 4: a column of a DAX table has no type in the model's files; said plainly)
          else if (!m && !hasModel) add('AXIS_TIME_UNKNOWN', 'note', p, x, `${refOf(f)} is named like a time field, and without the model its type and sort-by column cannot be known`, 'make sure it is a date, or a text column with a sort-by column', true);
        }
        // (a2) a blank on the axis (O-3): only when the blank count is known (facts), never guessed
        if (CHARTS.test(x.type) && facts) for (const f of cat) { const k = keyOf(f); if (k && facts[k] && facts[k].blank && !x.filters.some((g) => g.notBlank && g.field && g.field.table === f.table && g.field.name === f.name))
          add('AXIS_HAS_BLANK', 'medium', p, x, `${refOf(f)} has blank values: the axis gets a "(Blank)" point`, 'filter the axis field to "is not blank" on the visual, or tell the user that some rows have no value there', false); }
        // (b) tables (O-14): "grow to fit" without word wrap and a text column; set widths wider than the table
        if (x.type === 'tableEx' || x.type === 'pivotTable') {
          const all = Object.values(F).flat(), text = all.filter(isText), fm = x.format || {};
          const widths = Object.values(fm.widths || {}).reduce((a, b) => a + b, 0), setAll = Object.keys(fm.widths || {}).length >= all.length && all.length > 0;
          if (fm.growToFit && fm.wordWrap !== true && text.length && all.length > 1)
            add('TABLE_GROW_TO_FIT', 'high', p, x, `the columns are set to "grow to fit" with no word wrap, so ${text.map(refOf).join(', ')} widen${text.length === 1 ? 's' : ''} to the longest text and the other ${all.length - text.length} column(s) move out of view`,
              'switch off auto-size, give each column its own width (90 to 130 for numbers, what is left for text) and switch on word wrap', text.some((f) => typeOf(f) == null || typeOf(f) === 'unknown'));
          else if (setAll && fm.autoSize === false && widths > (x.type === 'pivotTable' ? x.w * V('PIVOT_SCROLL') : x.w - V('TABLE_SLACK')))
            add('TABLE_WIDTHS_TOO_WIDE', 'medium', p, x, `the set column widths add up to ${Math.round(widths)} in a table ${x.w} wide`, `bring the widths down to ${Math.round(x.w - 36)} in all, or widen the table`, false);
        }
        // (c) bar labels (O-4): the axis share of the width at the label size the visual or the theme sets
        if (BARS.test(x.type) && cat.length) {
          const share = (x.format && x.format.axisShare) || V('AXIS_SHARE'), pt = (x.format && x.format.axisFontSize) || inv.theme.labelSize || 10;
          const fit = Math.floor(x.w * share / 100 / pxPerChar(pt)), f = cat[cat.length - 1];
          if (isText(f) && fit < V('BAR_FIT_WARN')) add('BAR_LABELS_MAY_BE_CUT', fit < V('BAR_FIT_HIGH') ? 'high' : 'medium', p, x, `about ${fit} characters of a category name fit (visual ${x.w} wide, category axis share ${share}, label ${pt} pt); ${refOf(f)} is text, so longer names are cut with "..."`,
            'raise the category axis maximum width to 40 or 50, or give the chart more width; the longest name decides', true);
        }
        // (d) off the page
        if (p.w && p.h && (x.x < -V('PAGE_SLACK') || x.y < -V('PAGE_SLACK') || x.x + x.w > p.w + V('PAGE_SLACK') || x.y + x.h > p.h + V('PAGE_SLACK'))) add('OFF_PAGE', 'high', p, x, `part of the visual lies outside the ${p.w}x${p.h} page`, 'move it or make it smaller', false);
        // (e) a data visual with its title switched off and no text box just above it. (A4-8, audit 4: with no title setting,
        // Power BI draws its own title, "Sales by Region", so that is not a missing title)
        if (DATA.test(x.type) && !x.title && titleOff(x)) {
          const label = shown.some((t) => t.type === 'textbox' && t.text && t.y + t.h <= x.y + V('LABEL_INTO') && t.y + t.h >= x.y - V('LABEL_ABOVE') && t.x < x.x + x.w && t.x + t.w > x.x);
          if (!label) add('NO_TITLE', 'medium', p, x, 'no title, and no text box just above it to name it', 'add a title that says what the visual answers', false);
        }
        // (f) placeholder wording (read from the raw text, never quoted)
        if (PLACEHOLDER.test([x.rawTitle, x.rawText].filter(Boolean).join(' '))) add('PLACEHOLDER_TEXT', 'high', p, x, 'the words of a placeholder are still there', 'put the real content in, or take the visual out', true);   // (R7: a word list: a guess)
      }
      // (d2) overlapping data visuals; a card over another visual at the same place (within 3) is a cover, counted apart
      const data = shown.filter((x) => DATA.test(x.type) || /^card/.test(x.type) || x.type === 'multiRowCard' || x.type === 'kpi' || x.slicer);
      let covers = 0;
      for (let a = 0; a < data.length; a++) for (let b = a + 1; b < data.length; b++) {
        const A = data[a], B = data[b];
        const ox = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x), oy = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
        if (ox <= 2 || oy <= 2) continue;
        const near = (m, n) => Math.abs(m - n) <= V('COVER_NEAR');
        if (near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w) && near(A.h, B.h) && (/^card/.test(A.type) || /^card/.test(B.type))) { covers++; continue; }
        // (writer round 9, RESCORE-2's OVERLAP 2 on every rc.4 report) a card behind its own table: the table's panel, at the
        // slot's height, the table on its whole rows inside it (same place and width, the card at least as high): a cover
        const panelOf = (cd, tb) => /^card/.test(cd.type) && /^(tableEx|pivotTable)$/.test(tb.type) && cd.h >= tb.h - V('COVER_NEAR') && (cd.z == null || tb.z == null || cd.z < tb.z);
        if (near(A.x, B.x) && near(A.y, B.y) && near(A.w, B.w) && (panelOf(A, B) || panelOf(B, A))) { covers++; continue; }
        const share = ox * oy / Math.max(1, Math.min(A.w * A.h, B.w * B.h));
        if (share > V('OVERLAP_SHARE')) add('OVERLAP', share > V('OVERLAP_HIGH') ? 'high' : 'medium', p, A, `covers ${Math.round(share * 100)}% of the smaller of it and ${where(B)}`, 'move one of the two, or show them one at a time with bookmarks when they are alternatives', false);
      }
      // (0.3.1 R4A, round 4's problem 8: "the 'no data' message pattern" read as a fault) said as what it is: meant
      if (covers) add('COVER_CARDS', 'note', p, null, covers === 1 ? 'a card laid over a chart shows a message when the chart has no data: this is meant' : `${covers} cards laid over charts each show a message when their chart has no data: this is meant`, 'nothing to do', false);
    }
    const rank = { high: 0, medium: 1, note: 2 };
    findings.sort((a, b) => rank[a.severity] - rank[b.severity]);
    const counts = {}; findings.forEach((f) => { counts[f.rule] = (counts[f.rule] || 0) + 1; });
    const notChecked = [].concat(facts ? [] : ['AXIS_HAS_BLANK: needs the number of blanks per axis column, read from the model only with the user\'s consent (laptop-only for now)'],
      hasModel ? [] : ['the model was not read: column types and sort-by columns are unknown, so the time-axis rule can only say "~"'],
      ['label and text lengths: read from the names and types, not the data (the "~" findings)']);
    return { findings, counts, modelRead: hasModel, guesses: findings.filter((f) => f.guess).length, notChecked,
      sayFirst: findings.length ? 'Findings marked guess (~) come from field names and types, not from data: say so when you tell the user. On DataArcus\'s own planned page, fix them in the plan before showing it; on the user\'s existing report, show them as "worth a look", never as errors.' : 'No design findings.' };
  }

  // ---------- reading a project's files in memory (the shape the lint and the rules read) ----------
// The same fields mcp/lib/read-report.mjs's inventory() gives the lint and the rules (the MCP's reader of any report
  // on disk keeps its own limits and screens), read from the files the report writer gives: [{ path, data }], paths
  // with or without the "<Name>.Report/" folder. opts.clean: how a title or text box is kept (the MCP screens it).
  const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
  const litStr = (p) => { const v = lit(p); return v == null ? null : /^'.*'$/s.test(String(v)) ? String(v).slice(1, -1).replace(/''/g, "'") : String(v).replace(/[DLM]$/, ''); };
  const litNum = (p) => { const v = parseFloat(lit(p)); return isNaN(v) ? null : v; };
  const litBool = (p) => { const v = lit(p); return v === 'true' || v === true ? true : v === 'false' || v === false ? false : null; };
  const entries = (list) => (Array.isArray(list) ? list.filter((e) => e && typeof e === 'object') : []);
  const plain = (list) => entries(list).filter((e) => e && !e.selector).reduce((a, e) => Object.assign(a, e.properties || {}), {});
  const anyOf = (list) => entries(list).reduce((a, e) => Object.assign(a, (e && e.properties) || {}), {});
  const AGG = { 0: 'Sum', 1: 'Avg', 2: 'DistinctCount', 3: 'Min', 4: 'Max', 5: 'Count', 6: 'Median', 7: 'StDev', 8: 'Var' };
  function fieldOf(f) {
    if (!f || typeof f !== 'object') return null;
    const src = (x) => (((x || {}).Expression || {}).SourceRef || {});
    if (f.Column) { const s = src(f.Column); return { kind: 'column', table: String(s.Entity || s.Source || ''), name: String(f.Column.Property || '') }; }
    if (f.Measure) { const s = src(f.Measure); return Object.assign({ kind: 'measure', table: String(s.Entity || s.Source || ''), name: String(f.Measure.Property || '') }, s.Schema === 'extension' ? { report: true } : {}); }
    if (f.Aggregation) { const inner = fieldOf(f.Aggregation.Expression || {}); return inner ? Object.assign({}, inner, { kind: 'aggregation', agg: AGG[f.Aggregation.Function] || 'Agg' }) : null; }
    if (f.HierarchyLevel) { const h = ((f.HierarchyLevel.Expression || {}).Hierarchy) || {}, s = src(h); return { kind: 'column', table: String(s.Entity || ''), name: String(h.Hierarchy || ''), level: String(f.HierarchyLevel.Level || '') }; }
    return null;
  }
  const filtersOf = (cfg) => { try { return entries(cfg && cfg.filters).map((f) => {
    const field = fieldOf(f.field), s = JSON.stringify(f.filter || {});
    const notBlank = /^(Advanced|Categorical)$/.test(String(f.type)) && /"Not"/.test(s) && /"Value":"null"/.test(s);
    const top = f.type === 'TopN' ? (/"Top":\s*(\d+)/.exec(s) || /"Value":"(\d+)L"/.exec(s) || [])[1] : null;
    return Object.assign({ field, type: String(f.type || 'unknown').replace(/[^A-Za-z]/g, '').slice(0, 30) || 'unknown', set: !!f.filter }, notBlank ? { notBlank: true } : {}, top ? { top: +top } : {});
  }); } catch (e) { return []; } };
  const textOf = (j) => { const ps = plain(((j.visual || {}).objects || {}).general).paragraphs; return (Array.isArray(ps) ? ps : []).filter((q) => q && typeof q === 'object').map((q) => entries(q.textRuns).map((r) => String(r.value == null ? '' : r.value)).join('')).join(' / ').trim(); };
  const txt = (d) => (typeof d === 'string' ? d : new TextDecoder().decode(d));

  function inventoryOf(files, opts) {
    const o = opts || {}, clean = o.clean || ((t) => String(t)), by = new Map();
    // (a path inside the report folder: "<Name>.Report/..." or "<folder>/<Name>.Report/..." as a download has it; with
    // a report folder among the files, only its files are read)
    const inRep = (files || []).some((f) => /(^|\/)[^/]+\.Report\//.test(String(f.path || '')));
    (files || []).forEach((f) => { const p0 = String(f.path || ''), m = /^(?:.*\/)?[^/]+\.Report\/(.*)$/.exec(p0); if (m) by.set(m[1], f.data); else if (!inRep) by.set(p0, f.data); });
    const json = (rel) => { if (!by.has(rel)) return null; try { const j = JSON.parse(txt(by.get(rel))); return j && typeof j === 'object' && !Array.isArray(j) ? j : null; } catch (e) { return null; } };
    const dirs = (rel) => [...new Set([...by.keys()].filter((k) => k.startsWith(rel + '/')).map((k) => k.slice(rel.length + 1)).filter((k) => k.includes('/')).map((k) => k.split('/')[0]))];
    const report = json('definition/report.json') || {};
    const order = ((json('definition/pages/pages.json') || {}).pageOrder || []).map(String), ids = dirs('definition/pages');
    const pageIds = order.filter((id) => ids.includes(id)).concat(ids.filter((id) => !order.includes(id)));
    const tc = report.themeCollection || {}, ref = tc.customTheme && tc.customTheme.name ? String(tc.customTheme.name).split(/[\\/]/).pop() : null;
    const th = ref ? json('StaticResources/RegisteredResources/' + ref) : null;
    const labelSize = +((((th || {}).textClasses || {}).label || {}).fontSize) || 10;
    const pages = pageIds.map((id, i) => {
      const prel = `definition/pages/${id}`, pj = json(prel + '/page.json') || {};
      const page = { id, n: i + 1, name: clean(pj.displayName || id), rawName: String(pj.displayName || ''), w: +pj.width || 0, h: +pj.height || 0,
        kind: pj.type === 'Tooltip' ? 'Tooltip' : pj.pageBinding && /drill/i.test(String(pj.pageBinding.type || '')) ? 'Drillthrough' : null,
        hidden: pj.visibility === 'HiddenInViewMode', filters: filtersOf(pj.filterConfig), visuals: [], raw: pj, file: prel + '/page.json' };
      const list = [];
      dirs(prel + '/visuals').forEach((vid) => {
        const vrel = `${prel}/visuals/${vid}/visual.json`, j = json(vrel); if (!j) return;
        const pos = j.position || {}, mrel = `${prel}/visuals/${vid}/mobile.json`, mobile = by.has(mrel) ? json(mrel) : null;
        const x = { id: String(j.name || vid), file: vrel, json: j, mobile, mobileFile: mobile ? mrel : null, rx: +pos.x || 0, ry: +pos.y || 0, w: +pos.width || 0, h: +pos.height || 0, z: +pos.z || 0, group: j.parentGroupName ? String(j.parentGroupName) : null, hidden: !!j.isHidden };
        if (j.visualGroup) { Object.assign(x, { type: 'group', groupTitle: String(j.visualGroup.displayName || '') }); list.push(x); return; }
        const v = j.visual || {}, vco = v.visualContainerObjects || {}, ob = v.objects || {};
        x.type = String(v.visualType || 'unknown');
        const t = plain(vco.title), tp = t.text;
        if (litBool(t.show) === false) x.titleOff = true;
        if (litBool(t.show) !== false && tp) { const lt = litStr(tp); if (lt != null) { x.rawTitle = lt; x.title = clean(lt); } else if (tp.expr) { x.title = 'fx ' + (o.names && o.names.refOf ? o.names.refOf : NAMES.refOf)(fieldOf(tp.expr)); } }
        x.fields = {};
        Object.entries((v.query || {}).queryState || {}).forEach(([role, r]) => { const l = entries(r && r.projections).map((q) => Object.assign({}, fieldOf(q.field) || { kind: 'other' }, { queryRef: String(q.queryRef || '') }, q.displayName ? { displayName: String(q.displayName) } : {})); if (l.length) x.fields[role] = l; });
        x.sort = entries(((v.query || {}).sortDefinition || {}).sort).map((q) => ({ field: fieldOf(q.field), dir: /desc/i.test(String(q.direction || '')) ? 'desc' : 'asc' }));
        x.filters = filtersOf(j.filterConfig);
        if (VT.isSlicer(x.type)) x.slicer = true;
        if (x.type === 'textbox') { const tx = textOf(j); if (tx) { x.rawText = tx; x.text = clean(tx); } }
        const ch = anyOf(ob.columnHeaders), ca = anyOf(ob.categoryAxis), vals = anyOf(ob.values), widths = {};
        entries(ob.columnWidth).forEach((e) => { const k = e && e.selector && e.selector.metadata, w = litNum(((e || {}).properties || {}).value); if (k && w != null) widths[k] = w; });
        x.format = { axisShare: litNum(ca.maxMarginFactor), axisFontSize: litNum(ca.fontSize), autoSize: litBool(ch.autoSizeColumnWidth), growToFit: litStr(ch.columnAdjustment) === 'growToFit', wordWrap: litBool(vals.wordWrap), widths };
        list.push(x);
      });
      // positions on the page: a visual inside a group is placed relative to the group; hidden with its group
      const byId = Object.fromEntries(list.map((x) => [x.id, x]));
      list.forEach((x) => { let gx = 0, gy = 0, g = x.group, d = 0, hid = false; while (g && byId[g] && d++ < 10) { gx += byId[g].rx; gy += byId[g].ry; hid = hid || byId[g].hidden; g = byId[g].group; }
        if (hid) x.hiddenByGroup = true; x.px = { gx, gy }; });
      list.forEach((x) => { Object.assign(x, { x: Math.round((x.rx + x.px.gx) * 10) / 10, y: Math.round((x.ry + x.px.gy) * 10) / 10 }); delete x.rx; delete x.ry; delete x.px; });
      page.visuals = list;
      return page;
    });
    return { pages, theme: { labelSize }, themeJson: th, themeRef: ref, themeFile: ref ? 'StaticResources/RegisteredResources/' + ref : null, report, hasPlatform: by.has('.platform') };
  }

  // The measured rules' input from an inventory (check_report reads it so too: one copy)
  // opts.isCustom: the caller's custom-visual test (the MCP's reading block's; by default the catalog's)
  function rulesInput(inv, opts) {
    const isCustom = (opts && opts.isCustom) || VT.isCustom;
    const TC = (inv.themeJson && inv.themeJson.textClasses) || {}, VS = (inv.themeJson && inv.themeJson.visualStyles) || {};
    const R = { pages: [], visuals: [], textSize: 12, labelSize: +((TC.label || {}).fontSize) || 10, font: (TC.label || {}).fontFace || 'Segoe UI',
      theme: inv.themeRef ? { file: inv.themeFile, ref: inv.themeRef, json: inv.themeJson } : null, hasPlatform: inv.hasPlatform };
    R.slicerSize = +(((((VS.slicer || {})['*'] || {}).header || [{}])[0] || {}).textSize) || R.labelSize;
    const texts = [];   // the report's own words, only to tell the reading direction and instruction-like text (never returned)
    let customVisuals = 0;
    inv.pages.forEach((pg) => {
      const page = { id: pg.id, name: pg.name, rawName: pg.rawName, w: pg.raw.width, h: pg.raw.height, tooltip: pg.kind === 'Tooltip', json: pg.raw, visuals: [] };   // (0.3, J7: the page's background, for the a11y contrast rule)
      pg.visuals.forEach((x) => {
        const j = x.json, type = j.visual ? String(j.visual.visualType || '') : j.visualGroup ? 'group' : 'unknown';
        if (j.visual && isCustom(type)) customVisuals++;
        page.visuals.push({ name: x.id, type, file: x.file, mobileFile: x.mobileFile, json: j, mobile: x.mobile, parent: x.group, page: { id: pg.id, name: pg.name }, x: x.x, y: x.y, w: +(j.position || {}).width || 0, h: +(j.position || {}).height || 0 });
        if (type === 'textbox' && x.rawText) texts.push(x.rawText);
      });
      R.pages.push(page); R.visuals.push(...page.visuals);
      texts.push(page.rawName);
    });
    return { R, versions: inv.versions, texts, customVisuals, unreadable: inv.unreadable, bookmarks: inv.bookmarkFiles, bookmarkNames: (inv.bookmarks || []).map((b) => ({ file: b.file, name: b.rawName })) };
  }

  // ---------- a visual's place in plain words ----------
  // (0.3.1 SQ5, T1-S7: an item "worth a look" named its visual "clusteredBarChart at 12,92 296x320") its kind in words
  // and the third of the page its middle is in: "the bar chart, top left of the page". Never its title or any text of
  // the report (the owner's decision R5: type and place only); a custom or unknown type is "a visual". x: { type, x, y,
  // w, h }; page: { w, h } (without its size, the kind alone)
  const KINDS = [[/^(barChart|clusteredBarChart|stackedBarChart|hundredPercentStackedBarChart)$/, 'bar chart'], [/^(columnChart|clusteredColumnChart|stackedColumnChart|hundredPercentStackedColumnChart)$/, 'column chart'],
    [/^(lineChart|areaChart|stackedAreaChart|hundredPercentStackedAreaChart)$/, 'line chart'], [/ComboChart$/, 'combo chart'], [/^waterfallChart$/, 'waterfall chart'], [/^(donutChart|pieChart)$/, 'donut chart'],
    [/^scatterChart$/, 'scatter chart'], [/^tableEx$/, 'table'], [/^pivotTable$/, 'matrix'], [/^(card|cardVisual|multiRowCard)$/, 'card'], [/^kpi$/, 'KPI'], [/^gauge$/, 'gauge'],
    [/^(map|filledMap|azureMap|shapeMap)$/, 'map'], [/^treemap$/, 'treemap'], [/^funnel$/, 'funnel'], [/^ribbonChart$/, 'ribbon chart'], [/^slicer$|Slicer$/, 'slicer'], [/^textbox$/, 'text box'], [/^actionButton$/, 'button'],
    [/^pageNavigator$/, 'page navigator'], [/^bookmarkNavigator$/, 'bookmark navigator'], [/^image$/, 'picture'], [/^(shape|basicShape)$/, 'shape'], [/^group$/, 'group'], [/Chart$/, 'chart']];
  function placeOf(x, page) {
    const t = String((x && x.type) || ''), k = VT.isNative(t) || t === 'group' ? KINDS.find(([re]) => re.test(t)) : null;
    const kind = k ? `the ${k[1]}` : 'a visual', W = page && +page.w, H = page && +page.h;
    if (!(W > 0 && H > 0)) return kind;
    const third = (mid, len) => (mid < len / 3 ? 0 : mid < 2 * len / 3 ? 1 : 2);
    const v = ['top', 'middle', 'bottom'][third(+x.y + +x.h / 2, H)], h = ['left', 'centre', 'right'][third(+x.x + +x.w / 2, W)];
    return `${kind}, ${v === 'middle' && h === 'centre' ? 'in the middle' : v === 'middle' ? `middle ${h}` : `${v} ${h}`} of the page`;
  }

  // ---------- the check before a write or a download ----------
  // A problem "Power BI Desktop would show": a measured rule's warning or error (each measured in Desktop, its source in
  // DESKTOP-TESTS.md), or a layout finding that is not a guess and not a note (a visual off the page, two visuals
  // overlapping, a table's set widths past its width, a chart with no title, placeholder wording). The rest is listed
  // as "worth a look": guesses from names and types (bar labels, a time axis) and notes.
  const DESKTOP_RULES = 'the measured rules\' warnings and errors, and the layout findings that are neither guesses nor notes';
  const isDesktopProblem = (f) => (f.origin === 'rule' ? f.severity === 'error' || f.severity === 'warning' : !f.guess && f.severity !== 'note');
  const WORDS = {
    en: { none: '0 problems Power BI Desktop would show', some: (n) => `${n} problem${n === 1 ? '' : 's'} Power BI Desktop would show`, look: (n) => `${n} more worth a look` },
    ar: { none: 'لا مشاكل سيُظهرها Power BI Desktop', some: (n) => `${n} ${n === 1 ? 'مشكلة' : 'مشاكل'} سيُظهرها Power BI Desktop`, look: (n) => `و${n} للمراجعة` }
  };
  const summaryOf = (r, lang) => { const W = WORDS[lang === 'ar' ? 'ar' : 'en']; return (r.desktop ? W.some(r.desktop) : W.none) + (r.worth ? (lang === 'ar' ? ' ' : ', ') + W.look(r.worth) : ''); };

  /** The check of a generated project: files [{ path, data }] (the writer's). opts: { model (the model's tables, for
   *  the column types and sort-by columns; none: those findings are notes), lang ('en' | 'ar'), names, clean (how
   *  the MCP shows names), titles }. Returns { pages, visuals (what was read), desktop, worth, summary, problems, worthALook, counts, ran }:
   *  findings as { origin: rule | lint, rule, severity, guess, page, visual, place, what, fix }. Nothing is written. */
  function checkProject(files, opts) {
    const o = opts || {}, lang = o.lang === 'ar' ? 'ar' : 'en', inv = inventoryOf(files, o);
    const { R } = rulesInput(inv), RL = Rules();
    RL.normalize(R); R.lang = lang; R.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const ruled = RL.check(R, { groups: RL.GROUPS });
    const L = lint(inv, o.model || null, null, { names: o.names, titles: o.titles, places: true });
    const pageNo = new Map(inv.pages.map((p) => [p.id, p.n])), pageOf = new Map(inv.pages.map((p) => [p.id, p]));
    // (visual: its type and box, which plan-lint matches the preview's flags by; place: the same visual in plain words)
    const rules = ruled.findings.map((f) => Object.assign({ origin: 'rule', rule: f.rule, severity: f.severity, guess: false, page: f.page ? { n: pageNo.get(f.page.id) || null, name: f.page.name } : null,
      visual: f.visual ? `${f.visual.type} at ${Math.round(f.visual.x)},${Math.round(f.visual.y)} ${Math.round(f.visual.w)}x${Math.round(f.visual.h)}` : null, what: f.what, fix: f.fix },
      f.visual ? { place: placeOf(f.visual, f.page && pageOf.get(f.page.id)) } : {}));
    const lints = L.findings.map((f) => Object.assign({ origin: 'lint', rule: f.rule, severity: f.severity, guess: f.guess, page: f.page, visual: f.visual, what: f.why, fix: f.fix }, f.place ? { place: f.place } : {}));
    // (0.3.1 R4A, round 4's problem 8) a generated project's cards over its charts are DataArcus's own "no data" pattern:
    // counted, never listed as worth a look
    const all = rules.concat(lints), problems = all.filter(isDesktopProblem), worthALook = all.filter((f) => !isDesktopProblem(f) && f.rule !== 'COVER_CARDS');
    const counts = {}; all.forEach((f) => { counts[f.rule] = (counts[f.rule] || 0) + 1; });
    const r = { pages: inv.pages.length, visuals: inv.pages.reduce((n, p) => n + p.visuals.length, 0), desktop: problems.length, worth: worthALook.length, problems, worthALook, counts, ran: ruled.ran.concat(Object.keys(LINT_RULES)), failed: ruled.failed, modelRead: L.modelRead };
    r.summary = summaryOf(r, lang);
    return r;
  }
  const api = { LINT_RULES, MEASURED, lint, inventoryOf, rulesInput, checkProject, DESKTOP_RULES, isDesktopProblem, summaryOf, placeOf };
  if (node) module.exports = api; else root.DALayoutCheck = api;
})(typeof self !== 'undefined' ? self : this);
