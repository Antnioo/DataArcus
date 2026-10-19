/*! DataArcus visual gallery | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The visual gallery (0.3, J8): three of Power BI's own visuals the writer did not know, written only with the design
// flag gallery: true, each where its fields' roles say it fits (never from the data: the tools never read it).
//   combo       lineClusteredColumnComboChart: one measure as columns, a second as a line, over a time or ordered axis;
//               the line gets the secondary axis only when the two measures' units differ (a percent beside an amount).
//   waterfall   waterfallChart: one additive measure by one category with few, known members (a stage, a quarter, a
//               month name): each column is that member's part of the total.
//   multiples   clusteredColumnChart with a small-multiples field (the Rows role): one column chart per member of a
//               second category with few members, the same axis in every panel.
// Every role and formatting property written here is Microsoft's own for that visual type: the data roles and objects
// of @microsoft/powerbi-core-visual-schema (the version mcp/package.json pins; data/capabilities.json), inside the
// PBIR schemas bundled in mcp/schemas (visualConfiguration 2.1.0 schema-embedded.json:8 visualType, :27 objects, :52
// sortDefinition, :60 queryState, :139 ProjectionState). mcp/test-0.3-gallery.mjs checks every written property
// against that list and runs Microsoft's validator on the written samples.
// A gallery slot that does not fit (or a design without the flag) is written as its plain kind (fallback) and told.
// Browser and Node (module.exports / window.DAGallery). Pure: no files.
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Q = node ? require('./pbip-query.js') : root.DAPbipQuery;
  // the story titles (0.3 J4, a separate draft) are optional: with them a measure's name is said as its title says it
  const ST = () => { if (!node) return root.DAStoryTitles || null; try { return require('./story-titles.js'); } catch (e) { return null; } };
  const { proj, q, sorted, isTime, catKind, label, byTitle, AR_LETTERS, bool, num, str, isValue, shown } = Q;

  const KINDS = Object.freeze({
    combo: { visualType: 'lineClusteredColumnComboChart', fallback: 'line' },
    waterfall: { visualType: 'waterfallChart', fallback: 'column' },
    multiples: { visualType: 'clusteredColumnChart', fallback: 'column' }
  });
  const KIND_NAMES = Object.freeze(Object.keys(KINDS));
  const isKind = (k) => Object.prototype.hasOwnProperty.call(KINDS, String(k));
  const typeOf = (k) => (isKind(k) ? KINDS[k].visualType : null);
  // the most panels a small-multiples chart or columns a waterfall is given (members of its category, from the picker's
  // count or the kind's own: 7 days, 12 months, 4 quarters)
  const MAX_PANELS = 9, MAX_STEPS = 12;

  // ---- what a field's role says ----
  const same = (a, b) => !!a && !!b && a.t === b.t && (a.m != null ? a.m === b.m : a.c === b.c && a.agg === b.agg);
  // a measure's unit, from its metadata only: 'percent' (the picker's pct, a % format), 'currency' (a currency sign or
  // code in its format), 'count' (a whole-number format, a counted column), else null (not known)
  const CURRENCY = /[$€£¥₹]|\b(AED|SAR|QAR|KWD|BHD|OMR|EGP|USD|EUR|GBP)\b|د\.إ|ر\.س|ر\.ق/;
  function unitOf(f) {
    if (!f || !isValue(f)) return null;
    if (f.unit) return String(f.unit);
    if (f.pct) return 'percent';
    const fmt = [f.cardFormat, f.tableFormat, f.fullFormat, f.formatString].filter(Boolean).join(' ');
    if (/%/.test(fmt)) return 'percent';
    if (CURRENCY.test(fmt)) return 'currency';
    if (f.agg === 2 || f.agg === 5 || f.wholeFormat === '#,0') return 'count';
    return null;
  }
  // the line gets its own axis only when both units are known and differ (unknown: one axis, as Power BI's default)
  const unitsDiffer = (a, b) => { const x = unitOf(a), y = unitOf(b); return !!x && !!y && x !== y; };
  // a measure whose parts add up to its total (a waterfall's columns must): no percent, no average, rate, ratio,
  // share or margin, no distinct count (a customer in two months is counted in both)
  const NOT_ADDITIVE = /\b(avg|average|mean|median|rate|ratio|share|margin|pct|percent(age)?|distinct)\b|%|متوسط|نسبة|معدل|هامش|حصة/i;
  const additive = (f) => !!f && isValue(f) && !f.pct && unitOf(f) !== 'percent' && f.agg !== 2 && !NOT_ADDITIVE.test(String(f.name || '') + ' ' + String(f.m != null ? f.m : f.c));
  // an axis a line can run along: time, or a category the model or the picker puts in order
  const ordered = (f) => !!f && f.c != null && f.agg == null && (isTime(f) || !!f.ordered || !!f.sortBy || !!f.num);
  // how many members a category has, from the picker's count or its kind (0: not known)
  const membersOf = (f) => { const k = catKind(f); return k && k.rows ? k.rows : f && f.rows != null && isFinite(+f.rows) ? +f.rows : 0; };
  // a column whose members are many by its name (an id, a code, a person's or product's name): never a split
  const MANY = /\b(id|key|code|no|number|guid|email|phone|name|customer|client|product|item|sku|invoice|order)s?\b|معرف|رمز|رقم|اسم|العميل|المنتج|الفاتورة/i;
  const wordsOf = (n) => String(n).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ');

  // ---- the fields each kind takes, from the report's bound fields (B) ----
  // B.gallery (optional, from the plan): { combo: { columns, line, axis }, waterfall: { y, cat }, multiples: { y, cat, split } }
  function fieldsOf(kind, B) {
    const G = (B && B.gallery) || {}, g = G[kind] || {}, cats = (B && B.cats) || {}, y = (B && B.y) || {};
    if (kind === 'combo') {
      const axis = g.axis || B.date || cats.combo || null;
      let columns = g.columns || y.combo || B.measure || null;
      let line = g.line || (B.kpis || []).filter(Boolean).find((f) => !same(f, columns) && unitOf(f) === 'percent') || (B.kpis || []).filter(Boolean).find((f) => !same(f, columns)) || null;
      // a percent reads as a line over amounts, never as columns that look like they add up
      if (!g.columns && columns && line && unitOf(columns) === 'percent' && unitOf(line) !== 'percent') { const t = columns; columns = line; line = t; }
      return { axis, columns, line };
    }
    if (kind === 'waterfall') return { y: g.y || y.waterfall || B.measure || null, cat: g.cat || cats.waterfall || B.date || cats.column || null };
    if (kind === 'multiples') return { y: g.y || y.multiples || y.column || B.measure || null, cat: g.cat || cats.multiples || cats.column || B.date || null, split: g.split || (B.gallery || {}).split || cats.split || null };
    return {};
  }

  // ---- when each kind fits: { fits, why, fields }; why names the rule that decided (English, for the caller's notes) ----
  function fits(kind, B) {
    if (!isKind(kind)) return { fits: false, why: 'not a gallery kind', fields: {} };
    if (!B) return { fits: false, why: 'no bound fields', fields: {} };
    const F = fieldsOf(kind, B), no = (why) => ({ fits: false, why, fields: F });
    if (kind === 'combo') {
      if (!F.axis) return no('no time or ordered axis');
      if (!ordered(F.axis)) return no('the axis is not time or ordered: a line across unordered categories reads as a trend that is not there');
      if (!F.columns || !F.line) return no('needs two measures');
      if (same(F.columns, F.line)) return no('the two measures are the same');
      return { fits: true, why: unitsDiffer(F.columns, F.line) ? 'two measures over time, different units: the line on its own axis' : 'two measures over time, one unit: one shared axis', fields: F, secondary: unitsDiffer(F.columns, F.line) };
    }
    if (kind === 'waterfall') {
      if (!F.y || !F.cat) return no('needs one measure and one category');
      if (!additive(F.y)) return no('the measure does not add up across its parts (a percent, an average, a rate or a distinct count)');
      const n = membersOf(F.cat);
      if (!n) return no('the category\'s number of members is not known (a waterfall needs few: a stage, a quarter, a month name)');
      if (n > MAX_STEPS) return no('the category has more than ' + MAX_STEPS + ' members');
      return { fits: true, why: 'an additive measure by a category of ' + n + ' members', fields: F };
    }
    // multiples
    if (!F.y || !F.cat) return no('needs a column chart\'s measure and category');
    if (!F.split) return no('no second category for the panels');
    if (same(F.split, F.cat)) return no('the panels\' category is the axis\'s own');
    if (F.split.c == null || F.split.agg != null) return no('the panels\' field is not a category');
    if (isTime(F.split)) return no('the panels\' field is time: one line chart reads better than a panel per period');
    const n = membersOf(F.split);
    if (n > MAX_PANELS) return no('the panels\' category has more than ' + MAX_PANELS + ' members');
    if (!n && MANY.test(wordsOf(F.split.c))) return no('the panels\' category reads as one with many members (an id, a code or a name)');
    return { fits: true, why: n ? 'a second category of ' + n + ' members' : 'a second category of a grouping kind (its number of members not known)', fields: F };
  }
  // the gallery kinds that fit a report's fields, for a plan to propose
  const pick = (B) => KIND_NAMES.map((k) => Object.assign({ kind: k }, fits(k, B))).filter((x) => x.fits).map((x) => ({ kind: x.kind, why: x.why }));

  // ---- a slot before the page is written: kept, or its plain kind with the reason (gallery: the design's flag) ----
  function resolve(s, B, gallery) {
    if (!s || !isKind(s.kind)) return { slot: s, note: null };
    const plain = (why) => ({ slot: Object.assign({}, s, { kind: KINDS[s.kind].fallback, galleryFrom: s.kind }), note: { from: s.kind, to: KINDS[s.kind].fallback, title: s.title || null, why } });
    if (!gallery) return plain('the design\'s gallery flag is off');
    if (!B) return { slot: s, note: null };   // the sample download without a model: written by its role names
    const f = fits(s.kind, B);
    return f.fits ? { slot: s, note: null } : plain(f.why);
  }

  // ---- the query of a gallery visual (null when a field it needs is not bound) ----
  function bindQuery(kind, B) {
    const f = fits(kind, B), F = f.fields;
    if (!f.fits) return null;
    // (the axis keeps its own order: a time axis by its sort column, as the line chart's; a text category by its measure)
    if (kind === 'combo') return sorted(q({ Category: [proj(F.axis)], Y: [proj(F.columns)], Y2: [proj(F.line)] }), F.axis);
    if (kind === 'waterfall') return sorted(q({ Category: [proj(F.cat)], Y: [proj(F.y)] }), F.cat, true);
    return sorted(q({ Category: [proj(F.cat)], Y: [proj(F.y)], Rows: [proj(F.split)] }), F.cat, true);
  }

  // ---- the title: "Sales and Margin % by Month", "Sales by Quarter", "Sales by Channel, per Region" ----
  // A field's name as the story titles say it when they are loaded (time intelligence in words), else as the writer does
  const nameOf = (f, inAr) => { const S = ST(); return f ? (S && S.nameOf ? S.nameOf(f, shown, inAr) : label(f)) : null; };
  const AND = { en: ' and ', ar: ' و' }, PER = { en: ', per ', ar: '، لكل ' };
  // the parts of a title, for the story titles to shorten (variants(m, c, by, shown)): the measure field and the axis field
  function titleParts(kind, B) {
    const f = fits(kind, B), F = f.fields;
    if (!f.fits) return null;
    if (kind === 'combo') return { m: F.columns, m2: F.line, c: F.axis };
    if (kind === 'waterfall') return { m: F.y, c: F.cat };
    return { m: F.y, c: F.cat, split: F.split };
  }
  function title(kind, B, by) {
    const p = titleParts(kind, B);
    if (!p) return null;
    // (0.3.0 R2: the report's word decides the language: an Arabic report joins no English names with "and" or "per")
    const inAr = AR_LETTERS.test(by || ''), join = (x) => AR_LETTERS.test(x) === ar && (ar || !inAr);
    let m = nameOf(p.m, inAr);
    const ar = AR_LETTERS.test(m);
    // (never half Arabic, half English: a second name in the other script is left out, as byTitle does)
    if (p.m2) { const m2 = nameOf(p.m2, inAr); if (join(m2)) m = m + (ar ? AND.ar : AND.en) + m2; }
    let t = byTitle(m, by, nameOf(p.c, inAr));
    if (p.split) { const sp = nameOf(p.split, inAr); if (join(sp)) t = t + (ar ? PER.ar : PER.en) + sp; }
    return t;
  }

  // ---- the formatting each kind is written with (ctx: { mirror, grid }: a right-to-left report's mirrored axes, the
  // quiet gridline colour) ----
  const obj = (props) => [{ properties: props }];
  const color = (hex) => ({ solid: { color: { expr: { Literal: { Value: "'" + hex + "'" } } } } });
  function objects(kind, B, ctx) {
    const c = ctx || {}, out = {}, f = fits(kind, B);
    if (!f.fits) return out;
    const va = {};
    if (kind === 'combo') {
      // the line on its own axis only when the units differ; one shared axis otherwise (secShow, "Show secondary")
      va.secShow = bool(!!f.secondary);
      // the line 3 wide, as the writer's line charts (P2)
      out.lineStyles = obj({ strokeWidth: num(3) });
    }
    if (c.grid) va.gridlineColor = color(c.grid);
    // a right-to-left report: the value axis on the right (the waterfall has no invertAxis on its category axis: its
    // columns are put right to left by the sort, as mirrorChart does for the others)
    if (c.mirror) va.switchAxisPosition = bool(true);
    if (Object.keys(va).length) out.valueAxis = obj(va);
    if (c.mirror && kind !== 'waterfall') out.categoryAxis = obj({ invertAxis: bool(true) });
    return out;
  }
  // a right-to-left report: the first column at the right (the sort reversed; a chart sorted by its measure keeps the
  // largest at the right), as pbip-query.js mirrorChart does for the bar, column and line charts
  function mirrorSort(query) {
    if (!query) return query;
    const sd = query.queryState && query.sortDefinition, y = query.queryState.Y && query.queryState.Y.projections[0];
    if (sd && sd.sort && sd.sort[0]) { const byY = y && JSON.stringify(sd.sort[0].field) === JSON.stringify(y.field); sd.sort[0].direction = byY ? 'Ascending' : 'Descending'; }
    else query.sortDefinition = { sort: [{ field: query.queryState.Category.projections[0].field, direction: 'Descending' }], isDefaultSort: true };
    return query;
  }

  // ---- a right-to-left waterfall (D1, the owner's must-fix 2; seen in Desktop 2.159 on R3's Descending waterfall) ----
  // Power BI accumulates a waterfall in its sort order, left to right, and has no setting to invert its category axis:
  // sorted Descending, December was the first step at the LEFT and the bars climbed to January. So a right-to-left
  // waterfall is a stacked column chart (columnChart) drawn as one, from report-level measures (reportExtensions.json):
  // an invisible base and the step, the running total in the ORIGINAL order (the time order), the axis sorted the other
  // way (the first period at the RIGHT), the value axis at the right. A step that crosses zero is drawn in two parts:
  // Power BI stacks positives up from 0 and negatives down from 0. No Total column: the category axis holds only the
  // model's members. query: the waterfall's own (one Category column, one Y; Tooltips only for its sort);
  // ctx: { extMeasure (t, want, expression, dataType, formatString) -> its free name, sortByOf (t, c) -> the model's
  // sort-by column or null, typeOf (t, c) -> its data type or null, colours: { rise, fall } (fills) or null, grid, lang,
  // formatString }. Returns { ok: true, visualType, query, objects, measures } or { ok: false, why }.
  const WF_PARTS = ['base', 'rise', 'fall', 'rise below 0', 'fall below 0'];
  const WF_WORDS = { en: ['Base', 'Rise', 'Fall', 'Rise below 0', 'Fall below 0', 'Running total'], ar: ['القاعدة', 'ارتفاع', 'انخفاض', 'ارتفاع تحت الصفر', 'انخفاض تحت الصفر', 'الإجمالي الجاري'] };
  const WF_WHAT = {
    columnChart: 'written as a stacked column chart drawn as a waterfall (an invisible base under each step, from the report\'s own measures): the running total in time order, the first period at the right and each step rising or falling from the one at its right, the value axis at the right, labels on the steps; no Total column (Power BI\'s axis holds only the model\'s members: the total is where the leftmost step ends, and every step\'s tooltip gives the running total); no legend; hovering the empty space under a step shows its base',
    waterfallChart: 'A waterfall reads left to right in Power BI: its order is not mirrored (kept a waterfall, left to right, the value axis at the right)'
  };
  const NUMERIC = /^(int64|integer|whole|double|decimal|number|currency|date|datetime|datetimezone)$/i;
  function rtlWaterfall(query0, ctx) {
    const c = ctx || {}, no = (why) => ({ ok: false, why });
    const qs = query0 && query0.queryState;
    if (!qs || !qs.Category || !qs.Y) return no('the waterfall has no category or value');
    if (Object.keys(qs).some((r) => !['Category', 'Y', 'Tooltips'].includes(r))) return no('the waterfall has a breakdown');
    const cp = qs.Category.projections || [], yp = qs.Y.projections || [];
    if (cp.length !== 1 || yp.length !== 1) return no('the waterfall has more than one category or value');
    const cat = cp[0].field && cp[0].field.Column, yf = yp[0].field || {};
    if (!cat || !(yf.Measure && !yf.Measure.Expression.SourceRef.Schema || yf.Aggregation && yf.Aggregation.Expression.Column)) return no('the waterfall\'s category or value is not a column or a measure of the model');
    const colOf = (f) => ({ t: f.Expression.SourceRef.Entity, c: f.Property });
    const cc = colOf(cat), sd = query0.sortDefinition && query0.sortDefinition.sort && query0.sortDefinition.sort[0];
    // the order the steps follow left to right in the original: its sort's column, or the category's own order
    let order = null, sortField = null, textOrder = false;
    const catType = c.typeOf ? c.typeOf(cc.t, cc.c) : null;
    const dir = sd && sd.direction === 'Descending' ? 'Descending' : 'Ascending';
    if (sd && sd.field && sd.field.Aggregation && sd.field.Aggregation.Expression.Column) { order = colOf(sd.field.Aggregation.Expression.Column); sortField = sd.field; }
    else if (!sd || (sd.field && sd.field.Column && JSON.stringify(sd.field) === JSON.stringify(cp[0].field))) {
      const by = c.sortByOf ? c.sortByOf(cc.t, cc.c) : null;
      if (by) order = { t: cc.t, c: by }; else if (NUMERIC.test(String(catType || ''))) order = cc;
      // a text with no sort-by column: A to Z, when that is known to be its order (sorted by itself, or the writer's own
      // rule for a time text with no order, ctx.azText: timeAxisPlan's 'az')
      else if (sd || c.azText) { order = cc; textOrder = true; }
      else return no('its category is a text with no order of its own (no sort-by column, no sort): the running total has no order to follow');
      sortField = cp[0].field;
    } else return no('it is sorted by its value: the running total would follow the ranking, not time');
    const yName = yf.Measure ? yf.Measure.Property : yf.Aggregation.Expression.Column.Property, t = yf.Measure ? yf.Measure.Expression.SourceRef.Entity : yf.Aggregation.Expression.Column.Expression.SourceRef.Entity;
    let y, o, cn;
    try { y = Q.valueDax({ field: yf }); o = Q.daxNames.column(order.t, order.c); cn = Q.daxNames.column(cc.t, cc.c); } catch (e) { return no('a name holds a control character, which no DAX may name'); }
    // (no comparison sign, as the writer's other report measures: a <= b is MAX ( a, b ) = b; a text is compared with
    // <= or >=, the sort's own A to Z: MAX of two texts is not proven)
    const upTo = textOrder ? o + (dir === 'Descending' ? ' >= _o' : ' <= _o') : dir === 'Descending' ? 'MIN ( ' + o + ', _o ) = _o' : 'MAX ( ' + o + ', _o ) = _o';
    const head = 'VAR _y = ' + y + ' VAR _o = MAX ( ' + o + ' ) VAR _e = CALCULATE ( ' + y + ', ' + (o === cn ? '' : 'REMOVEFILTERS ( ' + cn + ' ), ') + 'FILTER ( ALL ( ' + o + ' ), ' + upTo + ' ) ) VAR _s = _e - _y VAR _lo = MIN ( _s, _e ) VAR _hi = MAX ( _s, _e ) RETURN ';
    const above = 'MIN ( _lo, 0 ) = 0', below = 'MAX ( _hi, 0 ) = 0', step = 'IF ( ' + above + ', _hi - _lo, IF ( ' + below + ', _lo - _hi, _hi ) )', cross = 'NOT ( ' + above + ' ) && NOT ( ' + below + ' )';
    const DAX = [
      'IF ( ISBLANK ( _y ), BLANK (), IF ( ' + above + ', _lo, IF ( ' + below + ', _hi, BLANK () ) ) )',
      'IF ( SIGN ( _y ) = 1, ' + step + ' )',
      'IF ( SIGN ( _y ) = -1, ' + step + ' )',
      'IF ( SIGN ( _y ) = 1 && ' + cross + ', _lo )',
      'IF ( SIGN ( _y ) = -1 && ' + cross + ', _lo )',
      'IF ( ISBLANK ( _y ), BLANK (), _e )'
    ];
    const words = WF_WORDS[c.lang === 'en' ? 'en' : 'ar'], measures = [];
    const projOf = (i) => {
      const want = 'Waterfall ' + (i < 5 ? WF_PARTS[i] : 'running total') + ': ' + shown(yName);
      const m = c.extMeasure(t, want, head + DAX[i], 'Double', c.formatString || null);
      measures.push({ t, m, expression: head + DAX[i] });
      return { field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m, displayName: words[i] };
    };
    const Y = [0, 1, 2, 3, 4].map(projOf), run = projOf(5);
    const query = { queryState: { Category: JSON.parse(JSON.stringify(qs.Category)), Y: { projections: Y }, Tooltips: { projections: [run].concat(JSON.parse(JSON.stringify((qs.Tooltips || {}).projections || []))) } },
      sortDefinition: { sort: [{ field: JSON.parse(JSON.stringify(sortField)), direction: dir === 'Descending' ? 'Ascending' : 'Descending' }], isDefaultSort: true } };
    const sel = (i) => ({ metadata: Y[i].queryRef }), col = c.colours || {};
    const fills = [1, 2, 3, 4].map((i) => (col[i % 2 ? 'rise' : 'fall'] ? { properties: { fill: col[i % 2 ? 'rise' : 'fall'] }, selector: sel(i) } : null)).filter(Boolean);
    const objects = {
      valueAxis: obj(Object.assign({ switchAxisPosition: bool(true) }, c.grid ? { gridlineColor: color(c.grid) } : {})),
      legend: obj({ show: bool(false) }),
      dataPoint: [{ properties: { fillTransparency: num(100) }, selector: sel(0) }].concat(fills),
      labels: [{ properties: { show: bool(true) } }].concat([0, 3, 4].map((i) => ({ properties: { showSeries: bool(false) }, selector: sel(i) })))
    };
    // a column chart by a date or a number draws a continuous axis, which ignores the sort (the twin's T-2, round 13):
    // one column per member, as the waterfall's own axis
    if (NUMERIC.test(String(catType || ''))) objects.categoryAxis = obj({ axisType: str('Categorical') });
    return { ok: true, visualType: 'columnChart', query, objects, measures };
  }
  // a fill from a colour (#rrggbb), for the callers' colours
  const fillOf = (hex) => (typeof hex === 'string' && /^#[0-9a-f]{6}$/i.test(hex) ? color(hex) : null);

  // the formatting objects and properties written per kind, for the tests to check against Microsoft's capabilities
  const WRITES = Object.freeze({
    lineClusteredColumnComboChart: { roles: ['Category', 'Y', 'Y2'], objects: { valueAxis: ['secShow', 'gridlineColor', 'switchAxisPosition'], lineStyles: ['strokeWidth'], categoryAxis: ['invertAxis'] } },
    waterfallChart: { roles: ['Category', 'Y'], objects: { valueAxis: ['gridlineColor', 'switchAxisPosition'] } },
    clusteredColumnChart: { roles: ['Category', 'Y', 'Rows'], objects: { valueAxis: ['gridlineColor', 'switchAxisPosition'], categoryAxis: ['invertAxis'] } }
  });

  const api = { KINDS, KIND_NAMES, MAX_PANELS, MAX_STEPS, WRITES, isKind, typeOf, unitOf, unitsDiffer, additive, ordered, membersOf, fieldsOf, fits, pick, resolve, bindQuery, titleParts, title, objects, mirrorSort, rtlWaterfall, fillOf, WF_WHAT, WF_WORDS };
  if (node) module.exports = api; else root.DAGallery = api;
})(typeof self !== 'undefined' ? self : this);
