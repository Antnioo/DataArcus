/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's tooltip pages (0.3.2 SP7, the split of pbip-page.js: the Codex split map, B-280): the card and the
// bar chart by category (the Top 6), and the trend by month. One page at a time, from explicit read-only inputs (the
// theme, the metrics, the binding, the direction, the look and the measure helpers): the page's JSON and its visuals'
// JSON plus diagnostics. It writes no file and names no visual: pbip-page.js's tooltips (the page assembly) asks for the
// pages, names each visual and adds the files, in the order the report has always had them (the random ids and the
// report measures come out in the same sequence).
(function (root) {
  'use strict';
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery), Z = (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const { AR_LETTERS, SCHEMA, bool, color, fieldCol, isTime, label, lit, mirrorChart, num, obj, proj, q, shown, sorted, str, timeAxisPlan } = Q;
  // (0.3, J4: the story titles' rules, story-titles.js, loaded before pbip-query.js on the website's pages)
  const ST = (typeof module !== 'undefined' && module.exports ? require('./story-titles.js') : root.DAStoryTitles);
  const { barNameShare } = Z;
  const frozen = (o) => Object.freeze(Object.assign({}, o));

  // input: { theme: { u, W, FULL }, metrics: { TIP_TITLE, TIP_VALUE, cardFit, titleFit },
  //   binding: { B, tip, trend, tipName, tipBinding, tipPages }, direction: { lang, align, MIRROR, CONTINUOUS, isoTop },
  //   look: { frame, textbox, cardObjects, cardFrame, cardCode, sameField },
  //   measures: { notBlank, topN, topSet, lastMonths, byMonthStart, extField } }
  // returns { base, six, wanted(), empty(), page(t) }: wanted lists the pages a report always has ([kind, measure,
  // category] for the binding's tipFor); empty and page give { name, binding, page, visuals, diagnostics }, each visual
  // { x, y, w, h, visual, filters } in its order on the page
  function tooltipPages(input) {
    const theme = frozen(input.theme), metrics = frozen(input.metrics), bound = frozen(input.binding), direction = frozen(input.direction), look = frozen(input.look), measures = frozen(input.measures);
    const { u, W, FULL } = theme, { TIP_TITLE, TIP_VALUE, cardFit, titleFit } = metrics, { B, tip, trend, tipName, tipBinding, tipPages } = bound;
    const { lang, align, MIRROR, CONTINUOUS, isoTop } = direction, { frame, textbox, cardObjects, cardFrame, cardCode, sameField } = look;
    const { notBlank, topN, topSet, lastMonths, byMonthStart, extField } = measures;

    // tooltip page: small, hidden in view mode, shown when a chart is hovered. 320 x 284: the card, and a bar chart 184
    // high, which holds 6 rows (rc1: 187 and 287 by the measured rows, tipRows below; 284 stays for the empty page) (measured in Desktop 2.158: a bar row takes 22 and the title and padding 46; a tooltip
    // can't be scrolled, so rows past the last one would be lost behind a scrollbar)
    const tipPage = (name, binding, displayName, visuals, height, width, diagnostics) => ({ name, binding, visuals, diagnostics,
      page: {
        $schema: SCHEMA.page, name, displayName, displayOption: 'FitToPage', width: width || 320, height: height || 284,
        type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: binding, type: 'Tooltip' },
        objects: { background: obj({ color: color(u.card), transparency: num(0) }), outspace: obj({ color: color(u.card) }) }
      } });
    const tipCard = cardFit(296, 76, 1, TIP_TITLE, TIP_VALUE);
    // (the second sweep's T4: the tooltip now shows the hovered chart's own measure, whatever its name's length: a title
    // two lines of the page's width don't hold is shortened, as the report's chart titles are; the full name stays the alt text)
    const tipTitle = (t) => { const f = titleFit(t, TIP_TITLE, 296 - 16); return f.mode === 'shortened' ? f.shown : t; };
    // (0.3, J4, B-131: the tooltip's bar chart title was cut with "…" too) the story title's first form that fits, with
    // the Top-N lead where its category is cut to its top 6 (the same rules as the page's charts, story-titles.js)
    // (TT1: the lead in each title's language)
    const tipStory = (m, c) => { const topped = c && c.c != null && c.agg == null && !isTime(c), lead = (x) => (!topped ? '' : AR_LETTERS.test(x) ? 'أعلى 999 من 999: ' : 'Top 999 of 999: ');
      return ST.fit(ST.variants(m, c, W.by || 'by', shown), (x) => titleFit(lead(x) + x, TIP_TITLE, 296 - 16).mode !== 'shortened').text; };
    const tipFull = (m, c) => ST.variants(m, c, W.by || 'by', shown)[0].text;   // (19 Oct: the alt text, whole)
    const tipFrame = (t, alt) => { const f = frame(t, alt || t); f.title = obj({ show: bool(true), text: str(shown(tipTitle(t))), alignment: str(align), fontSize: num(TIP_TITLE) }); return f; };
    // the theme's text sizes are made for the report's full page; on this small page the card value and the titles get
    // their own, so the value isn't cut off and the titles fit
    // (the tooltip's card follows the KPI cards: automatic units with 2 decimals, or the full number with kpiValues "full")
    // (the second sweep's T4: the card is the hovered chart's measure, with the card format the report gives it: the
    // picker's tooltip card, or the KPI card of the same measure)
    const cardOf = (m) => (sameField(m, tip.card) ? tip.card : (B && B.kpis || []).find((k) => sameField(k, m)) || m);
    const tipCardVisual = (card, w) => { const objects = cardObjects(tipCard, null, card);
      if (FULL && card && card.m != null && card.cardFormat && !cardCode(card)) objects.value.push({ properties: { labelDisplayUnits: num(-1), customFormatString: str(card.cardFormat) }, selector: { metadata: card.t + '.' + card.m } });
      return { x: 12, y: 8, w: w || 296, h: 76, visual: { visualType: 'cardVisual', query: q({ Data: [proj(card)] }), objects, visualContainerObjects: cardFrame(tipFrame(label(card)), tipCard, TIP_TITLE) } }; };
    const notBlankOf = (f) => notBlank(fieldCol(f.t, f.c).field.Column);
    // (design round 10, N15: "Top 6:" stood over 2 bars, and "Top 6" over 7 where two tied) the tooltip keeps its fixed
    // Top 6 filter (no extra rows: a tooltip can't scroll; it keeps the same bars as the rank, ties too, and check_report's
    // TOOLTIP_SCROLL reads it), and its title is the report measure that counts them: "Top S of M" only when it leaves
    // categories out, S the bars shown (7 where two tie); the fixed words only where the DAX can't name the fields
    const tipTop = (tv, cat, m, t0) => { if (!cat || cat.c == null || cat.agg != null || isTime(cat)) return tv;
      const arT = AR_LETTERS.test(t0), set = topSet(cat, proj(m).field, 6, 0), word = arT ? ['أعلى ', ' من '] : ['Top ', ' of '], lead = word[0] + '999' + word[1] + '999: ';   // (TT1: in the title's language)
      const long = tipTitle(lead + t0), rest = long.indexOf(lead) === 0 ? long.slice(lead.length) : null;
      let name = null; if (set && rest != null) { try { name = set.title('Title: ' + t0, ...isoTop(lang === 'ar', word, rest, tipTitle(t0))); } catch (e) { name = null; } }
      tv.filters = [notBlankOf(cat), topN(fieldCol(cat.t, cat.c).field.Column, proj(m).field, 6)];
      tv.visual.visualContainerObjects.title[0].properties.text = name ? { expr: extField(cat.t, name) } : str(tipTitle((arT ? (W.top6 && AR_LETTERS.test(W.top6) ? W.top6 : 'أعلى 6') : (W.top6 && !AR_LETTERS.test(W.top6) ? W.top6 : 'Top 6')) + ': ' + t0)); return tv; };
    // (the tooltip pages' bars grow from the right in a mirrored report too)
    const tipBar = (vis) => (MIRROR ? mirrorChart(vis, 'bar', { dateColumns: CONTINUOUS }) : vis);
    // rc1 (DETAIL-2 T6, T9; measured in Desktop 2.158 on the night of 6-7 Oct at the 10pt text, the tooltip's 8pt being
    // smaller): a bar chart without its value axis needs 22.2 a row, 45 above the first and 8 under the last. 184 for 6
    // bars and 310 for 12 months were short of that: a scrollbar beside the Top 6, the 12th month cut.
    const tipRows = (n) => Math.ceil(45 + 8 + 22.2 * n);
    // writer round 8 (RESCORE-1 T6: a scrollbar beside the 6 bars at 187, on a model of long names): the Top 6 takes the
    // tooltip lab's measure of this very chart (8pt names, values beside the bars; TOOLTIP-FIX-LAB, report-rules TIP_ROWS_6),
    // 27 a bar and 40, plus 8 under the last, as the 6-month trend already does; the page rule above (10pt) stays for 12 months
    const tipSix = 40 + 27 * 6 + 8;
    // writer round 8 (RESCORE-1 T8: "Microsoft 365 Business Sta..." at 50% of 296): measured on the laptop's crops, the names'
    // visible room is the share x the chart's width - 18 (40%: "Microsoft 365 Busin", 96; 50%: "...Business Sta", 129); 50%
    // is the most measured to work, so the Top 6 page is 376 wide (the reviewer's yes, 12 Oct): its chart and card 352, room
    // for a 31-letter name at 8pt (158). The trend's month names stay on 320.
    const TOP_W = 376, topW = TOP_W - 24;
    // rc1 (T8: "Microsoft 365 Busin..."): the names take the share of a narrow bar chart, as the page's (barNameShare)
    // rc1 (T10: "8.0Kkg" where the card read "60,000 kg"): a measure the cards show whole (wholeFormat: a unit, a count)
    // keeps its own format on the bars' values (display units None), as on its card; the rest keep Power BI's automatic
    const tipLook = (y, w) => ({ categoryAxis: obj({ fontSize: num(8), maxMarginFactor: lit(barNameShare(w || 296, 720) + 'L'), showAxisTitle: bool(false) }), valueAxis: obj({ show: bool(false) }),
      labels: obj(Object.assign({ show: bool(true), fontSize: num(8) }, y && y.wholeFormat && !y.pct ? { labelDisplayUnits: num(1) } : {})) });
    // a category the Top 6 cuts (the rule tipTop keeps)
    const topped = (cat) => !!cat && cat.c != null && cat.agg == null && !isTime(cat);
    const base = W.tooltipPage || 'Tooltip';
    // a report with no tooltip card: one page that says where to add one
    const empty = () => tipPage(tipName, tipBinding, base, [{ x: 12, y: 12, w: 296, h: 260, visual: { visualType: 'textbox', objects: textbox(W.tooltipHere || 'Tooltip page: add a card or a small chart here.', 11, false, u.text), visualContainerObjects: frame(null, base) } }], undefined, undefined, { kind: 'empty', top: null, months: null });
    // round 1's two pages are always there (the bar chart by category, and the trend where there is a month): a kind no
    // chart opened gets the picker's card by its category or by month, as before
    const wanted = () => (!tip ? [] : [].concat(!tipPages.some((t) => t.kind === 'cat') ? [['cat', tip.card, tip.cat]] : [],
      trend && !tipPages.some((t) => t.kind === 'trend') ? [['trend', tip.card, tip.date]] : []));
    // each page's name says what tells it apart from the first of its kind: the measure, the category
    // (0.3.1 BD2, measured in Desktop 2.159, 27 Oct: no mark helps the page tab strip, a page name lays out left to right
    // whatever it holds) an Arabic tooltip page's name keeps no Latin run: the trend's month field kept in English is
    // «الشهر» (the trend is always by month), and a measure or category kept in English gives way to the page's number
    // among its kind, so the names stay apart
    const arTip = /[\u0600-\u06FF]/.test(base), latin = (x) => arTip && /[A-Za-z]/.test(String(x || ''));
    const nameOf = (t) => { const f = tipPages.find((x) => x.kind === t.kind), month = label(tip.date);
      const parts = f === t ? [] : [sameField(f.m, t.m) ? null : label(t.m), t.kind === 'cat' && !sameField(f.cat, t.cat) ? label(t.cat) : null].filter(Boolean);
      const kept = parts.filter((x) => !latin(x)).concat(parts.some(latin) ? [String(tipPages.filter((x) => x.kind === t.kind).indexOf(t) + 1)] : []);
      return [t.kind === 'trend' ? base + ' \u00b7 ' + (latin(month) ? '\u0627\u0644\u0634\u0647\u0631' : month) : base].concat(kept).join(' \u00b7 '); };
    // the trend: the measure by month, as a bar chart with the same settings, 310 high on a 320 x 410 page: 12
    // rows (22 a row and 46 for the title and padding), so every month's name is whole and horizontal with its value
    // beside the bar, whatever the measure. Measured in Desktop 2.158 (DESKTOP-TESTS.md, "round 1 built"): at this width
    // a column or line chart loses the last month behind a scrollbar as soon as the value axis's labels are wide
    // ("100K", "0.4M"), and without that axis the first month's name is cut. The owner's choice, 2026-10-03.
    // (0.2.9 part 2, TOOLTIP-FIX-LAB: about 77 months in 310 showed 13 and a scrollbar: where the month's table has a date
    // column, the last 6 months, newest first, at 40 + 27 a bar; elsewhere the 12 rows as before)
    // (the cross-review's G3: the same rule as the trend's, so a month name the model or the report sorts keeps its 12)
    const six = !!(trend && ['monthStart', 'monthLabel'].includes((timeAxisPlan(tip.date) || {}).order));
    const page = (t) => {
      const card = cardOf(t.m);
      if (t.kind === 'cat') {
        // a bar chart writes its category names horizontally (a column chart slants or cuts them); its own sizes, as
        // the card has: axis text 8pt, 40% of the width for the names (a 20-character name is whole), no value axis and
        // each bar's value beside it instead, which leaves room for one more row
        // (0.2.9 part 2, TOOLTIP-FIX-LAB: 9 products in 184 showed 6 bars and a scrollbar a tooltip can't use: the Top 6
        // by the measure shown, said in the title; a time category is never cut by value)
        return tipPage(t.name, t.binding, nameOf(t), [tipCardVisual(card, topW),
          tipTop({ x: 12, y: 92, w: topW, h: tipSix, visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(t.cat)], Y: [proj(t.m)] }), t.cat, true),   /* (round 23: largest first) */
            objects: tipLook(card, topW),
            visualContainerObjects: tipFrame(tipStory(t.m, t.cat), tipFull(t.m, t.cat)) }) }, t.cat, t.m, tipStory(t.m, t.cat))], 92 + tipSix + 8, TOP_W, { kind: 'cat', top: topped(t.cat) ? 6 : null, months: null });
      }
      const tv = { x: 12, y: 92, w: 296, h: six ? 40 + 27 * 6 + 8 : tipRows(12), visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(tip.date)], Y: [proj(t.m)] }), tip.date),
        objects: tipLook(card),
        visualContainerObjects: tipFrame(tipStory(t.m, tip.date), tipFull(t.m, tip.date)) }) };
      // (rc1, DETAIL-2 T1: the month tooltip showed "(Blank)" first and 13 rows: it gets the chart's "is not blank" filter)
      tv.filters = [notBlankOf(tip.date)];
      if (six) { byMonthStart(tv.visual.query, tip.date, 'Descending'); const lf = lastMonths(tip.date, proj(t.m).field, 6); if (lf) tv.filters.push(lf); }
      return tipPage(t.name, t.binding, nameOf(t), [tipCardVisual(card), tv], six ? 92 + tv.h + 12 : 92 + tv.h + 8, undefined, { kind: 'trend', top: null, months: six ? 6 : 12 });
    };
    return { base, six, wanted, empty, page };
  }

  const api = { tooltipPages };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipTooltip = api;
})(typeof self !== 'undefined' ? self : this);
