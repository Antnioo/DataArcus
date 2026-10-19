/*! DataArcus visual gallery | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The visual gallery (0.3, J8): three of Power BI's own visuals the writer did not know, written only with the design
// flag gallery: true, each where its fields' roles say it fits (never from the data: the tools never read it).
//   combo       lineClusteredColumnComboChart: one measure as columns, a second as a line, over a time or ordered axis,
//               on ONE shared axis: only when both measures' units are known and the same (0.3.0 D2, the outside audit's
//               C13: no automatic secondary axis). Two units, or a unit not known: two panels, a line chart each (split).
//   waterfall   waterfallChart: one additive measure by one category with few, known members (a stage, a quarter, a
//               month name): each column is that member's part of the total.
//   multiples   clusteredColumnChart with a small-multiples field (the Rows role): one column chart per member of a
//               second category with few members, the same axis in every panel.
// Every role and formatting property written here is Microsoft's own for that visual type: the data roles and objects
// of @microsoft/powerbi-core-visual-schema (the version mcp/package.json pins; data/capabilities.json), inside the
// PBIR schemas bundled in mcp/schemas (visualConfiguration 2.1.0 schema-embedded.json:8 visualType, :27 objects, :52
// sortDefinition, :60 queryState, :139 ProjectionState). mcp/test-0.3-gallery.mjs checks every written property
// against that list and runs Microsoft's validator on the written samples.
// A gallery slot that does not fit (or a design without the flag) is written as its plain kind (fallback; a designed slot
// keeps its own kind, s.plain) and told. The MCP's tools name multiples "smallMultiples" (TOOL_NAMES); assign() puts the
// kinds the user asked for on a designed page's slots (0.3.0 D2: never chosen silently).
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
  // (0.3.0 D2: a city, an address or a street, as the picker's manyValued: a panel per city is never few)
  const MANY = /\b(id|key|code|no|number|guid|email|phone|name|customer|client|product|item|sku|invoice|order|city|cities|address|street)s?\b|معرف|رمز|رقم|اسم|العميل|المنتج|الفاتورة|المدينة|العنوان/i;
  const wordsOf = (n) => String(n).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-]+/g, ' ');

  // ---- the fields each kind takes, from the report's bound fields (B) ----
  // B.gallery (optional, from the plan): { combo: { columns, line, axis }, waterfall: { y, cat }, multiples: { y, cat, split } }
  function fieldsOf(kind, B) {
    const G = (B && B.gallery) || {}, g = G[kind] || {}, cats = (B && B.cats) || {}, y = (B && B.y) || {};
    if (kind === 'combo') {
      const axis = g.axis || B.date || cats.combo || null;
      let columns = g.columns || y.combo || B.measure || null;
      // (0.3.0 D2) the line in the columns' own unit first (one shared axis), then a percent, then any other measure
      const others = (B.kpis || []).filter(Boolean).filter((f) => !same(f, columns)), u = unitOf(columns);
      let line = g.line || (u && others.find((f) => unitOf(f) === u)) || others.find((f) => unitOf(f) === 'percent') || others[0] || null;
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
      // (0.3.0 D2, C13) one shared axis only: two units, or a unit not known, are two panels (split), never a second axis
      const uc = unitOf(F.columns), ul = unitOf(F.line);
      if (!uc || !ul || uc !== ul) return { fits: false, split: true, fields: F, why: uc && ul ? `the two measures are in different units (${uc}, ${ul}): two panels, a line chart each, never a second axis` : 'the units of the two measures are not known to be the same: two panels, a line chart each, never a second axis' };
      return { fits: true, why: `two measures in one unit (${uc}) over an ordered axis: one shared axis`, fields: F, secondary: false };
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
  // (0.3.0 D2) a designed slot goes back to its own kind (s.plain: a bar chart asked to be small multiples stays a bar
  // chart); a combo in two units is two panels (slots: the two line charts, split below), told as such
  function resolve(s, B, gallery, rtl) {
    if (!s || !isKind(s.kind)) return { slot: s, note: null };
    const to = s.plain || KINDS[s.kind].fallback, base = Object.assign({}, s); delete base.plain;
    const plain = (why) => ({ slot: Object.assign(base, { kind: to, galleryFrom: s.kind }), note: { from: s.kind, to, title: s.title || null, why } });
    if (!gallery) return plain('the design\'s gallery flag is off');
    if (!B) return { slot: base, note: null };   // the sample download without a model: written by its role names
    const f = fits(s.kind, B);
    if (f.split) { const two = split(base, f.fields, rtl); return { slot: two[0], slots: two, note: { from: s.kind, to: 'two panels', title: s.title || null, why: f.why } }; }
    return f.fits ? { slot: base, note: null } : plain(f.why);
  }
  // a combo's two panels: its box in two (side by side, or one above the other in a box taller than wide), a line chart of
  // each measure over the combo's axis, the columns' measure at the reading start; each panel carries its fields (bind)
  const GAP = 16;
  function split(s, F, rtl) {
    const across = s.w >= s.h, g = GAP, a = across ? { w: (s.w - g) / 2, h: s.h } : { w: s.w, h: (s.h - g) / 2 };
    const at = (i) => (across ? { x: s.x + (rtl ? 1 - i : i) * (a.w + g), y: s.y } : { x: s.x, y: s.y + i * (a.h + g) });
    return [F.columns, F.line].map((m, i) => Object.assign({}, s, at(i), { w: Math.floor(a.w), h: Math.floor(a.h), kind: 'line', galleryFrom: s.kind, bind: { measure: m, date: F.axis } }));
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
      // one shared axis, always (0.3.0 D2, C13: a combo in two units is two panels; secShow, "Show secondary", off)
      va.secShow = bool(false);
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
  const WF_WORDS = { en: ['Base', 'Rise', 'Fall', 'Rise below 0', 'Fall below 0', 'Running total', 'Total'], ar: ['القاعدة', 'ارتفاع', 'انخفاض', 'ارتفاع تحت الصفر', 'انخفاض تحت الصفر', 'الإجمالي الجاري', 'الإجمالي'] };
  const WF_WHAT = {
    columnChart: 'no Total column in Arabic: the last step on the left ends at the total (labelled "الإجمالي" with its value, and every step\'s tooltip gives the running total). Written as a stacked column chart drawn as a waterfall (an invisible base under each step, from the report\'s own measures), because Power BI draws a waterfall left to right only and its axis holds only the model\'s members: the first period at the right, each step rising or falling from the one at its right, the value axis at the right, labels on the steps, no legend; hovering the empty space under a step shows its base',
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
      'IF ( ISBLANK ( _y ), BLANK (), _e )',
      // the total, as text, on the last step only (the leftmost): the step whose order is the last with a value
      null
    ];
    const lastOf = (dir === 'Descending' ? 'MINX' : 'MAXX') + ' ( FILTER ( ALL ( ' + o + ' ), NOT ISBLANK ( ' + y + ' ) ), ' + o + ' )';
    DAX[6] = 'VAR _last = CALCULATE ( ' + lastOf + (o === cn ? '' : ', REMOVEFILTERS ( ' + cn + ' )') + ' ) RETURN IF ( NOT ISBLANK ( _y ) && _o = _last, ' + Q.daxNames.string(WF_WORDS[c.lang === 'en' ? 'en' : 'ar'][6] + ' ') + ' & FORMAT ( _e, ' + Q.daxNames.string(c.formatString || '#,0') + ' ) )';
    const words = WF_WORDS[c.lang === 'en' ? 'en' : 'ar'], measures = [];
    const projOf = (i) => {
      const want = 'Waterfall ' + (i < 5 ? WF_PARTS[i] : i === 5 ? 'running total' : 'total label') + ': ' + shown(yName);
      const m = c.extMeasure(t, want, head + DAX[i], i === 6 ? 'Text' : 'Double', i === 6 ? null : c.formatString || null);
      measures.push({ t, m, expression: head + DAX[i] });
      return { field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: t } }, Property: m } }, queryRef: t + '.' + m, nativeQueryRef: m, displayName: words[i] };
    };
    const Y = [0, 1, 2, 3, 4].map(projOf), run = projOf(5), total = projOf(6);
    const query = { queryState: { Category: JSON.parse(JSON.stringify(qs.Category)), Y: { projections: Y }, Tooltips: { projections: [run].concat(JSON.parse(JSON.stringify((qs.Tooltips || {}).projections || []))) } },
      sortDefinition: { sort: [{ field: JSON.parse(JSON.stringify(sortField)), direction: dir === 'Descending' ? 'Ascending' : 'Descending' }], isDefaultSort: true } };
    const sel = (i) => ({ metadata: Y[i].queryRef }), col = c.colours || {};
    const fills = [1, 2, 3, 4].map((i) => (col[i % 2 ? 'rise' : 'fall'] ? { properties: { fill: col[i % 2 ? 'rise' : 'fall'] }, selector: sel(i) } : null)).filter(Boolean);
    const objects = {
      valueAxis: obj(Object.assign({ switchAxisPosition: bool(true) }, c.grid ? { gridlineColor: color(c.grid) } : {})),
      legend: obj({ show: bool(false) }),
      dataPoint: [{ properties: { fillTransparency: num(100) }, selector: sel(0) }].concat(fills),
      // (the reviewer's ask of 19 Oct: the total readable on the leftmost step) the rise and fall labels carry a detail
      // line, the total measure, which has a value on the last step only (Power BI's custom detail label, labels'
      // dynamicLabelDetail; not yet seen in Desktop)
      labels: [{ properties: { show: bool(true) } }].concat([0, 3, 4].map((i) => ({ properties: { showSeries: bool(false) }, selector: sel(i) })),
        [1, 2].map((i) => ({ properties: { enableDetailDataLabel: bool(true), detailContentType: str('Custom'), dynamicLabelDetail: { expr: { Measure: total.field.Measure } } }, selector: sel(i) })))
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

  // (0.3.0 D2) the bound measures' units from the model's own format strings (the picker's fields carry the card's format
  // only when it differs): f.unit, read by unitOf; tables: the model's (name, measures[{ name, formatString }]). Pure:
  // the binding is copied; only the measures of kpis, measure and y are touched
  function withUnits(B, tables) {
    if (!B) return B;
    const fmt = new Map(); (tables || []).forEach((t) => (t.measures || []).forEach((x) => fmt.set(t.name + '\u0000' + x.name, x.formatString || '')));
    const one = (f) => { if (!f || f.m == null || f.unit) return f; const fs = fmt.get(f.t + '\u0000' + f.m), u = unitOf(Object.assign({}, f, fs ? { formatString: fs } : {})); return u ? Object.assign({}, f, { unit: u }) : f; };
    return Object.assign({}, B, { kpis: (B.kpis || []).map(one), measure: one(B.measure), y: Object.fromEntries(Object.entries(B.y || {}).map(([k, f]) => [k, one(f)])) });
  }

  // ---- the tools' names and words (0.3.0 D2) ----
  // the MCP's slot kinds: multiples is "smallMultiples" there
  const TOOL_NAMES = Object.freeze({ combo: 'combo', waterfall: 'waterfall', multiples: 'smallMultiples' });
  const fromTool = (k) => (k === 'smallMultiples' ? 'multiples' : k);
  const toTool = (k) => TOOL_NAMES[k] || k;
  // the visual's name as a plan shows it, English and Arabic (Power BI's own names for the visual types)
  const LABELS = Object.freeze({ combo: { en: 'Line and clustered column chart (combo)', ar: 'مخطط خطي وعمودي (مركب)' }, waterfall: { en: 'Waterfall chart', ar: 'مخطط شلالي' },
    multiples: { en: 'Column chart, small multiples', ar: 'مخطط أعمدة بمضاعفات صغيرة' } });
  const labelOf = (k, lang) => { const L = LABELS[fromTool(k)]; return L ? L[lang === 'ar' ? 'ar' : 'en'] : null; };
  // which slot of a designed page a kind asked for takes (ask: true, every kind; or a list of kinds, either name): combo
  // the first line chart (the trend); waterfall the first column chart, else the line chart; multiples a column chart,
  // else a bar chart. (0.3.0 D2, the reviewer's decision of 19 Oct) at most ONE gallery visual a page, on every designed
  // page, and only where its fields suit (B, the bound fields: fits; a combo in two units does not suit a page it was not
  // placed on by the person); a kind used on an earlier page (o.avoid) comes after the others. Each keeps its own kind
  // (plain) for the writer to go back to. Pure: the slots are copied
  const PLACES = { combo: ['line'], waterfall: ['column', 'line'], multiples: ['column', 'bar'] };
  const askedKinds = (ask) => (ask === true ? KIND_NAMES.slice() : Array.isArray(ask) ? KIND_NAMES.filter((k) => ask.map(fromTool).includes(k)) : []);
  function assign(slots, ask, o) {
    const B = o && o.B, avoid = (o && o.avoid) || new Set(), want = askedKinds(ask), out = (slots || []).map((s) => Object.assign({}, s));
    const order = want.filter((k) => !avoid.has(k)).concat(want.filter((k) => avoid.has(k)));
    for (const k of order) {
      if (B && !fits(k, B).fits) continue;
      for (const kind of PLACES[k]) { const i = out.findIndex((s) => s.kind === kind); if (i >= 0) { out[i] = Object.assign(out[i], { kind: k, plain: kind }); return out; } }
    }
    return out;
  }
  // a gallery visual's title parts for the writer's "two charts read the same" rule (story-titles.js alternate, #57):
  // the measure and the axis as the title says them, and the kind's own word for a page where no other sentence is left
  // (an Arabic report on English names: no English word is added, so the kind is said in Arabic, as the table's «التفاصيل»)
  const TAILS = { combo: { en: 'columns and line', ar: 'أعمدة وخط' }, waterfall: { en: 'step by step', ar: 'خطوة بخطوة' }, multiples: { en: 'small multiples', ar: 'مضاعفات صغيرة' } };
  function storyOf(kind, B, by) {
    const p = titleParts(kind, B);
    if (!p) return null;
    const inAr = AR_LETTERS.test(by || ''), m = nameOf(p.m, inAr), c = nameOf(p.c, inAr), m2 = p.m2 ? nameOf(p.m2, inAr) : null;
    const ar = AR_LETTERS.test(m), both = m2 && AR_LETTERS.test(m2) === ar && (ar || !inAr) ? m + (ar ? AND.ar : AND.en) + m2 : m;
    return { m: both, c, tail: TAILS[kind][inAr ? 'ar' : 'en'] };
  }

  const api = { KINDS, KIND_NAMES, TOOL_NAMES, LABELS, MAX_PANELS, MAX_STEPS, WRITES, isKind, typeOf, unitOf, unitsDiffer, additive, ordered, membersOf, fieldsOf, fits, pick, resolve, split, assign, askedKinds, withUnits, fromTool, toTool, labelOf, storyOf, bindQuery, titleParts, title, objects, mirrorSort, rtlWaterfall, fillOf, WF_WHAT, WF_WORDS };
  if (node) module.exports = api; else root.DAGallery = api;
})(typeof self !== 'undefined' ? self : this);
