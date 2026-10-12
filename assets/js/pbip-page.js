/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's pages (0.2.9, audit 3's A3-12): the visuals' look (kit), one report page with its visuals and
// its phone layout (write), the tooltip pages (tooltips), and the slot hand-off when a visual cannot be written
// (absorb, dropLines).
(function (root) {
  'use strict';
  // (0.2.9, A2-3: the design engine's fitSlots moves the slots; design-engine.js, loaded first on the website's pages)
  const E = (typeof module !== 'undefined' && module.exports ? require('./design-engine.js') : root.DAEngine);
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery), Z = (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const {
    AR_LETTERS, CAT_KINDS, CHARTS, ROW_LABEL, S0, SCHEMA, TYPES, bindQuery, bindTitle, bool, byTitle, catKind,
    color, contrast, daxNames, fieldCol, gradientFill, hasControl, isTextField, isTime, isValue, json, label, lit,
    mirrorChart, mixHex, namesOf, num, obj, orderHelper, orderedBy, pageFilterOf, proj, q, resource, rnd,
    rowLabelDax, rowLabelOf, shown, sorted, str, tableFields, timeAxisPlan, tproj
  } = Q;
  const { barNameShare, cellRoom, columnRoom, fieldRoom, rowPitch, tableFit, tableHeight, textWidth } = Z;


  // The page buttons as tabs (see write): the layout of a page's tabs, made per page from the report's context c
  const tabsFor = (c, pg) => {
    const { PAGES, base, boxFit, font, o, pt, rtl } = c;
      // The page buttons as tabs: their size and rows in the room between the end of the title's text and the logo (or
      // the Filters button: x0, x1), within a header H high; null when they don't fit even at 8pt. (Taken out of the
      // header's code in round 12 so the header can be tried one row taller first: see grown below.) The title's text
      // size comes from the slot's height before any growth (textH).
      return (title, logo, x0, x1, H) => {
        const kk = pg.page.h / 1080, gap = 24 * kk, th = title.textH || title.h;
        const names = PAGES.map((p) => String(p.name || base)), titleSize = Math.min(pt(th * 0.42), boxFit(th));
        const titleNeed = Math.min(title.w, Math.ceil(textWidth(shown(o.title || base), titleSize, true, font) + 24 * kk));
        // the room: between the end of the title's text and the logo (or the Filters button). The title's text is at the
        // reading start of its box, so room inside the box is taken only where the box's free end faces the logo
        const titleLeft = title.x < logo.x;
        const a0 = titleLeft ? (rtl ? title.x + title.w + gap : title.x + titleNeed + gap) : (rtl ? x0 : logo.x + logo.w + gap);
        const a1 = titleLeft ? (rtl ? logo.x - gap : x1) : (rtl ? title.x + title.w - titleNeed - gap : title.x - gap);
        const room = a1 - a0, padX = 8 * kk, gapB = Math.round(12 * kk), lineH = Math.max(2, Math.round(3 * kk));
        const rowH = (t) => Math.ceil(6 + 1.6 * t) + (/^segoe ui/i.test(font) ? 0 : 4) + lineH;
        const lay = (t, maxRows) => {
          const ws = names.map((nm) => Math.ceil(textWidth(nm, t, true, font) + 10 + 2 * padX));
          if (ws.some((w) => w > room)) return null;
          let row = [], used = 0; const rows = [row];
          ws.forEach((w, i) => { const need = (row.length ? gapB : 0) + w; if (row.length && used + need > room) { row = [i]; rows.push(row); used = w; } else { row.push(i); used += need; } });
          return rows.length <= maxRows && rows.length * rowH(t) <= H ? { t, ws, rows } : null;
        };
        let out = null;
        for (const maxRows of [1, 2, 3]) { for (let t = pt(th * 0.3); t >= 8 && !out; t--) out = lay(t, maxRows); if (out) break; }
        // Round 16 (the owner's yes, 6 Oct 2026, design finding #13: eight names at 8pt on one row beside a large title):
        // names that fit one row only at 8pt take two balanced rows, in reading order, at the largest size both rows
        // hold (by the measured widths), where the header is high enough; otherwise the one row stays
        if (out && out.rows.length === 1 && out.t <= 8 && names.length > 2) {
          for (let t = pt(th * 0.3); t > out.t; t--) {
            if (2 * rowH(t) > H) continue;
            const ws = names.map((nm) => Math.ceil(textWidth(nm, t, true, font) + 10 + 2 * padX)), sum = (a, b) => ws.slice(a, b).reduce((x, w) => x + w, 0) + gapB * (b - a - 1);
            let best = null;
            for (let cut = 1; cut < names.length; cut++) { const w = Math.max(sum(0, cut), sum(cut, names.length)); if (!best || w < best.w) best = { cut, w }; }
            if (best.w <= room) { out = { t, ws, rows: [names.slice(0, best.cut).map((_, i) => i), names.slice(best.cut).map((_, i) => best.cut + i)] }; break; }
          }
        }
        return out ? Object.assign(out, { a0, a1, gapB, lineH, rowH: rowH(out.t), toLogo: titleLeft ? 'right' : 'left' }) : null;
      };
  };
  // 0.2.9, audit 2's A2-3: what the writer measures for the design engine's fitSlots on one page (pure: no notes, no
  // files); build fits its pages with it, and Pbip.fitOptions gives it to the website's background and to plan_layout.
  // dropKinds: a user's model whose binding has no time axis: a designed page's line charts give their room away.
  // headerRows: Round 12 (the owner's go on round 11's recommendation 2): in a designed layout (pg.grow: the engine owns
  // the positions) a header whose page names don't fit one row of tabs grows by the height of the second row, where two
  // rows then fit. Hand-placed pages are the caller's: their header never grows.
  // railItems: the rail's dropdowns (the slicers the model has, three on the sample) and its Reset, as measured
  function fitOf(c, pg) {
    const { B, PAGES, SLICER_TEXT, own, resetFit, rtl, slicerH } = c, tabsLayout = tabsFor(c, pg);
    const dropKinds = B && own && !B.date && !pg.hand ? ['line'] : [];
    const headerRows = (() => {
      const slots = pg.slots, t0 = slots.find((x) => x.kind === 'title'), l0 = slots.find((x) => x.kind === 'logo');
      if (!pg.grow || PAGES.length < 2 || !t0 || !l0 || pg.panel) return 0;
      const kk = pg.page.h / 1080, gap = 24 * kk, x0 = rtl ? l0.x + l0.w + gap : t0.x + t0.w + gap, x1 = rtl ? t0.x - gap : l0.x - gap;
      if (tabsLayout(t0, l0, x0, x1, t0.h)) return 0;
      let extra = 0;
      for (let d = 1; d <= Math.ceil(30 * kk) + 25 && !extra; d++) { const tl = tabsLayout(t0, l0, x0, x1, t0.h + d); if (tl && tl.rows.length === 2 && d <= tl.rowH) extra = d; }
      return extra;
    })();
    const kk = pg.page.h / 1080, all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null);
    // (the Reset's height does not depend on its width: resetFit)
    const railItems = { n: Math.max(1, (B && own ? all3.filter(Boolean) : all3).length), minH: slicerH(SLICER_TEXT), maxH: 76 * kk, resetH: resetFit('', 0, kk).h, pad: 10 * kk, gap: 8 * kk };
    return { dropKinds, headerRows, railItems };
  }
  // the theme's text sizes the writer reads (the kit's, and fitOptions')
  const themeSizes = (o) => { const TH = (o.theme && o.theme.textClasses) || {}, LABEL = +(TH.label || {}).fontSize || 10;
    return { TH, TITLE: +(TH.title || {}).fontSize || 12, CALLOUT: +(TH.callout || {}).fontSize || 28, LABEL, SLICER_TEXT: +((((((o.theme || {}).visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize) || LABEL }; };

  // 0.2.9 rc1 (the laptop's PERF-COMPARE S5, D15, D19 and Task 1: a column chart of products or cities drew dozens of
  // vertical labels, cut, with a scrollbar; on a page narrowed by the filter rail the department labels were slanted and
  // cut): a bar or column chart by a text category (not a time category, nor one whose values the writer knows: days,
  // months, quarters) shows its top N by its measure, N the categories its slot holds, said in its title. A bar chart: its
  // rows, 22.2 a row with 45 above, 8 under and 38 for the value axis (measured at 10pt, 1280 x 720, scaled with the page);
  // a column chart: a column for a 12-character label at the label size (a GUESS, to be measured), so the names stay level
  // (integration round 7: on a designed page N is the design engine's, s.topN from its categoryFit, the design block's
  // S5; the writer's rc1 conditions stay: the sample's categories are never cut, nor a time or known category)
  const topCount = (c, s, pg, f) => {
    if (!c.own || !f || !isTextField(f) || isTime(f) || catKind(f) || f.sortBy || f.ordered || f.dateOf || (s.kind !== 'bar' && s.kind !== 'column')) return 0;
    if (s.topN) return s.topN;   // a designed page: the design engine's N
    // a hand-placed page (no design computed one): the writer's measured count. A bar chart: its rows, 22.2 a row with 45
    // above, 8 under and 38 for the value axis (measured at 10pt, 1280 x 720, scaled with the page); a column chart: a
    // column for a 12-character label at the label size (a GUESS, to be measured)
    if (s.kind === 'bar') return Math.max(3, Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2));
    const plot = s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40, need = textWidth('n'.repeat(12), c.LABEL, false, c.font) + 6;
    return Math.max(3, Math.floor(plot / need));
  };
  // the category field a chart's query shows (after the page's own choice of categories)
  const catOf = (Bt, query) => { const p = ((query.queryState.Category || {}).projections || [])[0], col = p && p.field.Column;
    return col ? Object.values(Bt.cats || {}).find((x) => x && x.t === col.Expression.SourceRef.Entity && x.c === col.Property) || null : null; };

  // The visuals' look and sizes shared by a report's pages and its tooltip pages (frames, cards, buttons, the visual
  // fixes of 0.2.9 part 2), made once per report from its context c (see build)
  function kit(c) {
    const {
      MIRROR, W, align, base, byMonthStart, edge, font, lastMonths, n, notBlank, o, rowLabels,
      rtl, timeAxes, topN, u
    } = c;

    // filter pane in the theme's colors, so it matches the page
    const paneObjects = {
      outspacePane: obj({ backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }),
      filterCard: [
        { properties: { backgroundColor: color(mixHex(u.card, u.background, 0.4)), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Applied' } },
        { properties: { backgroundColor: color(u.card), foregroundColor: color(u.text), transparency: num(0), border: bool(true), borderColor: color(edge), fontFamily: str(font) }, selector: { id: 'Available' } }
      ]
    };
    // Who draws the panel behind a visual. A transparent design has them in the page's background image, so every
    // visual's own background, border and shadow are switched off here (visual.json outranks the theme). A solid design
    // has no such image: its theme gives each visual a background in the card colour, rounded corners and a shadow, so
    // the visuals that sit on a panel (KPI cards, charts, tables, text slots: panel = true) are left to the theme and
    // nothing is written for them. Solid is read from the theme itself: its "*" visuals have a background.
    // Header title, logo, page buttons, slicers, buttons and the tooltip page's visuals stay off in both.
    const SOLID = !!((((((o.theme || {}).visualStyles || {})['*'] || {})['*'] || {}).background || [{}])[0] || {}).show;
    // Round 21 (the capabilities lab's #4, Desktop 2.158, 7 Oct 2026: accepted and kept, nothing to see): every shown
    // visual title carries a heading level for screen readers, 'Heading3' (the page title is a text box, not a title).
    // Round 22 (the code review's j): one rule, read from the title's own show value, called where each page's visuals
    // are written. Titles are made in four places (frame, the KPI card's own, the tooltip pages' two), so it is not
    // set in frame(): tried, and five of eight titles lost their heading
    const headed = (vis) => { const t = vis && ((vis.visualContainerObjects || {}).title || [])[0], sh = t && t.properties && t.properties.show;
      if (sh && sh.expr && sh.expr.Literal && sh.expr.Literal.Value === 'true') t.properties.heading = str('Heading3'); };
    const frame = (title, alt, extra, panel) => Object.assign({
      title: obj(title ? { show: bool(true), text: str(shown(title)), alignment: str(align) } : { show: bool(false) })
    }, panel && SOLID ? {} : {
      background: obj({ show: bool(false) }),
      border: obj({ show: bool(false) }),
      dropShadow: obj({ show: bool(false) })
    }, {
      general: obj({ altText: str(shown(alt || title || '')) })
    }, extra || {});
    const textbox = (text, size, bold, colr, side) => ({ general: obj({ paragraphs: [{ textRuns: [{ value: text, textStyle: { fontFamily: font, fontSize: size + 'pt', fontWeight: bold ? 'bold' : 'normal', color: colr } }], horizontalTextAlignment: side || align }] }) });
    // Card visuals: sized so the title and the number fit the box, from Microsoft's card sizing (a line of text takes
    // 1.5 x its size; the card's own label under the number stays hidden, the title already names the KPI). s: the page's
    // scale (height / 720); title, callout: the title and value sizes the card would have. The padding is 8 on a
    // 1920 x 1080 page, as in Microsoft's recipe, and scales with the page. The value keeps the callout size unless the
    // box is too short, or too narrow for 7 characters ("101.91K"); below 8 the inner padding goes first.
    const { TH, TITLE, CALLOUT, LABEL, SLICER_TEXT } = themeSizes(o);
    // the theme's text sizes are made for the report's full page; the 320 x 240 tooltip page and the phone get their own
    const TIP_VALUE = 20, TIP_TITLE = 10;
    // m (KPI cards on a page): { top, side }, the margin above the title (round(12k), k = page height / 1080: measured
    // in Desktop 2.158 as the smallest that looks right) and the padding on the reading-start side that keeps the title
    // clear of a side accent bar (the page's kpiInset from the design engine). Both are reserved here, so the number
    // still fits; the top margin gives way to P when even an 8pt number would not fit under it. On a solid design, where
    // the theme draws the card's panel with rounded corners and no accent bar, the side is round(16k): at P the title
    // touches the panel's corner (measured in Desktop 2.158, DESKTOP-TESTS.md round 2).
    // em: the width of the widest text the value can show, in em (round 10, measured: a digit 0.54, a separator 0.21,
    // "-888.88bn" 4.4). An automatic value (units and 2 decimals) is 4.4 em at most; a full number is sized for nine
    // digits with its separators and decimals (valueEm). Before round 10 this was 7 x 0.55 = 3.85, and "74,675.00" was cut.
    const FULL = o.kpiValues === 'full';
    const valueEm = (f) => (FULL && f && f.cardFormat ? 9 * 0.54 + 2 * 0.21 + (/\./.test(f.cardFormat) ? 0.21 + 2 * 0.54 : 0) : !FULL && f && f.wholeFormat ? 9 * 0.54 + 2 * 0.21 : AUTO_EM);
    // Reset is an icon button without a box (round 10, to match the navigator): no outline, no fill until it is hovered
    // (a light tint of the accent colour), the reset icon in the accent colour, and a tooltip that says what it does.
    const resetFill = () => [{ properties: { show: bool(true) } }, { properties: { fillColor: color(u.accent || u.text), transparency: num(100) }, selector: { id: 'default' } }, { properties: { fillColor: color(u.accent || u.text), transparency: num(88) }, selector: { id: 'hover' } }];
    // Round 12 (seen in Desktop 2.158, round 10: in Arabic the Reset's arrow and its text were at opposite ends): the icon
    // at the reading start (placement, in Microsoft's theme schema) and the text aligned to the same side, so they sit
    // together in a button only as wide as both
    const resetIcon = (r) => Object.assign({ shapeType: str(r.icon ? 'reset' : 'blank'), lineColor: color(u.accent || u.text), placement: str(rtl ? 'right' : 'left') }, r.icon ? { iconSize: num(Math.round(0.75 * r.h)) } : {});
    // (round 22, seen in Desktop on every Arabic report since round 14: the arrow touched the text's last letter. The
    // gap goes on the arrow's side: before the text in English, after it in a right-to-left report, where the arrow is
    // at the right and no-break spaces before Arabic text fall at its far end)
    const resetLook = (text, r) => ({ show: bool(true), text: str(r && r.icon ? (rtl ? text + RESET_GAP : RESET_GAP + text) : text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL), horizontalAlignment: str(rtl ? 'right' : 'left') });
    // (the Arabic tooltip is the button's own words, "إعادة ضبط الفلاتر": the owner's design choice 6, 5 Oct 2026)
    const resetTip = W.resetTip || (o.lang === 'ar' ? 'إعادة ضبط الفلاتر' : 'Clear the filters on this page');
    // The card's value, label, padding, layout and outline need the "default" selector, or Power BI ignores them; the
    // number stays centred, like the legacy card's, in both reading directions; the inner outline would draw a box inside
    // the panel. The card's own fill (on by default, in the theme's background colour) is switched off, so the panel and
    // its accent bar show: that switch works only WITHOUT a selector (measured in Desktop 2.158, DESKTOP-TESTS.md round 0;
    // with "default" it is ignored).
    const DEF = { id: 'default' };
    // The value: automatic units with 2 decimals ("3.43M", "14.81K", "231.50"), one setting for every card: Desktop's
    // "Value decimal places" is labelPrecision, and it works in the card's default entry (measured in Desktop 2.158,
    // round 10). With o.kpiValues "full" the cards keep Power BI's own default and a card whose measure carries
    // cardFormat gets the full number with separators (round 9's entry) instead.
    // (the owner's design choices 1 and 2, 5 Oct 2026: a KPI card's value sits at the reading start under its title,
    // side = align; other cards stay centred. A percent card (f.pct) shows the model's own format, 35.4% for 0.0%: no
    // "Value decimal places" on it.)
    // Round 12, the owner's ask (6 Oct 2026): a percent shows as a percent without useless decimals (f.pctFormat: the
    // model's percent format with one decimal or none, else "0.0%"), a number whose format has no decimals as its whole
    // number with separators (f.wholeFormat: "179", "101,914"; not with kpiValues "full", which has its own), the rest
    // with automatic units and 2 decimals. The format is a second entry of "value", selected by the field's query
    // reference, with Desktop's "Custom" display units (measured in Desktop 2.158, D8, for the full number).
    const cardCode = (f) => (f ? f.pctFormat || (!FULL && f.wholeFormat) || null : null);
    const cardObjects = (c, side, f) => ({
      value: obj(Object.assign({ fontSize: num(c.V), horizontalAlignment: str(side || 'center') }, FULL || (f && (f.pct || cardCode(f))) ? {} : { labelPrecision: lit('2L') }), DEF)
        .concat(cardCode(f) ? [{ properties: { labelDisplayUnits: num(-1), customFormatString: str(cardCode(f)) }, selector: { metadata: proj(f).queryRef } }] : []),
      label: obj({ show: bool(false) }, DEF),
      padding: obj({ paddingUniform: num(c.I) }, DEF),
      layout: obj({ paddingUniform: num(0) }, DEF),
      outline: obj({ show: bool(false) }, DEF),
      fillCustom: obj({ show: bool(false) })
    });
    // the container: its padding set on the visual (Power BI resets it when other container settings are set), no gap
    // under the title; title: the title's size, written so the height worked out above doesn't depend on the theme.
    // Padding and spacing are written WITHOUT a selector: with "default" Desktop 2.158 ignores both and the title sits
    // on the panel's top edge (measured, DESKTOP-TESTS.md round 0). c.T: the top, c.S: the reading-start side.
    // Round 10 (the design pass): a KPI title that would be cut ("Total Sales Last R...") gets the largest size, down to
    // 8pt, at which its bold text fits the card's width (text, w given); a title that fits keeps the theme's size.
    const cardFrame = (f, c, title, text, w) => {
      let size = title;
      if (text != null && w) { const avail = w - c.S - c.P; while (size > 8 && textWidth(text, size, true, font) > avail) size--; }
      if (f.title && f.title[0].properties.show && f.title[0].properties.show.expr.Literal.Value === 'true') f.title[0].properties.fontSize = num(size);
      f.padding = obj({ top: num(c.T), bottom: num(c.P), left: num(rtl ? c.P : c.S), right: num(rtl ? c.S : c.P) });
      f.spacing = obj({ customizeSpacing: bool(true), spaceBelowTitleArea: num(0), verticalSpacing: num(2) });
      return f;
    };
    // a button's formatting card: the on/off switch ("show") on its own, the look for the default state after it, the
    // way Power BI Desktop saves buttons (a "show" inside the state selector is ignored, and the text, fill or outline
    // stays hidden)
    const def = (props) => {
      const { show, ...look } = props, out = [];
      if (show !== undefined) out.push({ properties: { show } });
      if (Object.keys(look).length) out.push({ properties: look, selector: { id: 'default' } });
      return out;
    };

    // Page filters (o.pageFilters: [{ t, c, type, values }]: A3-9, the writer writes each typed value as Power BI writes
    // it, true, 'text', 5L, 5.5D; literals already written that way are still taken, checked by checkBuild). Each is a basic filter (Categorical, "is one of") on a column, in the shape Microsoft's report
    // authoring reference gives: the field by its table, the condition by the alias of From. Written on every report
    // page, each with its own name; not on the tooltip pages. The user sees and clears them in the Filters pane.
    // (A6-14: each by the query module's pageFilterOf, which writes the literals from the typed values)
    const pageFilters = () => (o.pageFilters || []).map((f) => pageFilterOf(f, f.values, Array.isArray(f.values) ? null : f.literals));
    // The fixes on a report visual, after its fields and objects are written (Bt: its binding, tt: its table's text size)
    const fixVisual = (visual, s, pg, Bt, tt) => {
      const st = visual.query.queryState, cat = st.Category && st.Category.projections[0], col = cat && cat.field.Column, filters = [];
      const put = (object, props) => { visual.objects = visual.objects || {}; const e = visual.objects[object] || (visual.objects[object] = [{ properties: {} }]); Object.assign(e[0].properties, props); };
      if (col && CHARTS.includes(s.kind)) { filters.push(notBlank(col)); n.blankFiltered++; }
      // (the design block's S5/D19, from the laptop's sweep of rc.1: a category with dozens of values gave cut vertical
      // labels and a scrollbar) a bar or column chart keeps the Top N categories its slot can show (s.topN, the design
      // engine's categoryFit), by its measure; never on a time axis or an ordered category, whose order would be lost;
      // said in its title (the writer's rc1 rule, topCount, with the design's N)
      const top = col && st.Y && st.Y.projections[0] ? topCount(c, s, pg, catOf(Bt, visual.query)) : 0;
      if (top) { filters.push(topN(col, st.Y.projections[0].field, top)); n.topCharts.push({ page: pg.name || base, kind: s.kind, field: col.Expression.SourceRef.Entity + '[' + col.Property + ']', top }); }
      // O-4: a bar chart's names get 40% of its width, 50% on a narrow chart (under 560 on the 720-high page); the default 25 cut them at about 10 characters
      // (design round 9, D19: a many-valued category's names, product names, get room for 25 characters where 40% of the
      // chart holds them, else 50%: measured, REPORT-FIXES-LAB B1/B2, 40% of 508 held about 20 characters, 50% about 25,
      // 10.2 page units a character on a 1080-high page)
      if (visual.visualType === 'clusteredBarChart') { const cf = catOf(Bt, visual.query), need = 25 * 10.2 * pg.page.h / 1080;
        put('categoryAxis', { maxMarginFactor: lit(Math.max(barNameShare(s.w, pg.page.h), cf && cf.wide && 0.4 * s.w < need ? 50 : 0) + 'L') }); }
      // O-13: the line chart's month label
      if (s.kind === 'line' && col && Bt.date && ['monthStart', 'monthLabel'].includes((timeAxisPlan(Bt.date) || {}).order) && col.Property === Bt.date.c) {
        byMonthStart(visual.query, Bt.date, MIRROR ? 'Descending' : 'Ascending');
        const lf = st.Y && lastMonths(Bt.date, st.Y.projections[0].field, 12); if (lf) filters.push(lf);
        timeAxes.push({ page: pg.name || base, field: Bt.date.t + '[' + Bt.date.c + ']', by: Bt.date.dateOf ? Bt.date.dateOf.t + '[' + Bt.date.dateOf.c + ']' : 'the label read as a date', last: lf ? 12 : null });
      }
      // O-14: a table's columns get set widths (auto-size off: grow-to-fit let a long text push the numbers out of view):
      // numbers 90 to 130 by their header, the text columns share the rest (160 at least), all within the width less 36
      // (padding and the scrollbar); values wrap. The order's helper (1) and the hidden name column (0) keep theirs.
      if (s.kind === 'table') {
        const ps = st.Values.projections, sc = pg.page.h / 1080, T = tt || +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
        const cw = (visual.objects.columnWidth = visual.objects.columnWidth || []), fixed = new Set(cw.map((e) => e.selector.metadata));
        const fieldOf = (p) => (Bt.table || []).filter(Boolean).find((f) => proj(f).queryRef === p.queryRef);
        const isNum = (p) => (p.field.Measure && !p.field.Measure.Expression.SourceRef.Schema) || !!p.field.Aggregation || !!((fieldOf(p) || {}).num);
        const isPic = (p) => p.field.Measure && p.field.Measure.Expression.SourceRef.Schema && !(rowLabels || []).some((r) => p.queryRef === r.t + '.' + r.m) && !/^Row label: /.test(p.field.Measure.Property);
        const free = ps.filter((p) => !fixed.has(p.queryRef)), usable = s.w - 36 - cw.reduce((a, e) => a + parseFloat(e.properties.value.expr.Literal.Value), 0);
        const pic = (((visual.objects.grid || [])[0] || { properties: {} }).properties.imageWidth || null), picW = pic ? parseFloat(pic.expr.Literal.Value) + 10 : 0;
        const w = new Map();
        // (0.2.9 rc1, S1/S2: each column at least its cellRoom, the room the table's fields were kept by: a number as wide as
        // its widest value, so it never wraps, and every header whole; the text columns share what is left, and give up
        // width only down to their own room; no number is narrowed)
        const room = (p) => { const f = fieldOf(p); return f ? cellRoom(f, T, font, sc) : Math.ceil(textWidth(p.displayName || p.nativeQueryRef || '', T, true, font) + 24 * sc); };
        free.filter(isNum).forEach((p) => w.set(p, room(p)));
        free.filter(isPic).forEach((p) => w.set(p, picW || 90 * sc));
        const texts = free.filter((p) => !w.has(p)), used = [...w.values()].reduce((a, x) => a + x, 0), mins = texts.map(room);
        const spare = usable - used - mins.reduce((a, x) => a + x, 0);
        texts.forEach((p, i) => w.set(p, mins[i] + Math.max(0, spare) / texts.length));
        // no text column: the numbers share the whole width
        if (!texts.length && w.size) { const k = usable / [...w.values()].reduce((a, x) => a + x, 0); if (k > 1) w.forEach((x, p) => w.set(p, x * k)); }
        free.forEach((p) => cw.push({ properties: { value: num(Math.floor(w.get(p))) }, selector: { metadata: p.queryRef } }));
        const ch = visual.objects.columnHeaders[0].properties; delete ch.columnAdjustment; ch.autoSizeColumnWidth = bool(false);
        put('values', { wordWrap: bool(true) });
      }
      return filters;
    };
    // the sizes that follow the font and the label size (pbip-sizing.js)
    const { cardFit, pt, charW, boxH, buttonH, iconH, slicerH, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines, kpiTitleFit, titleFit, oneLine } = Z.make({ font, LABEL });
    return {
      paneObjects, SOLID, headed, frame, textbox, TH, TITLE, CALLOUT, TIP_VALUE, TIP_TITLE,
      FULL, valueEm, resetFill, resetIcon, resetLook, resetTip, LABEL, SLICER_TEXT, DEF, cardCode,
      cardObjects, cardFrame, def, pageFilters, fixVisual, cardFit, pt, charW, boxH, buttonH,
      iconH, slicerH, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines,
      kpiTitleFit, titleFit, oneLine
    };
  }

  // One report page: its page.json, and every visual in reading order (visual.json, and mobile.json for the phone)
  function write(c, pg, pageIndex) {
    const {
      AUTO_EM, B, bound, CALLOUT, D, DEF, FULL, GRAD, GRID, LABEL, MIRROR, NODATA, PAGES,
      SLICER_TEXT, SOLID, TIP_TITLE, TIP_VALUE, TITLE, W, add, align, barCharts, base, blankKept, bookmarks,
      boxFit, buttonH, cardCode, cardFit, cardFrame, cardObjects, centred, charW, chartAxes, chartColors, def, edge,
      extFile, fixVisual, font, frame, freeExt, headed, headerGrew, kpiTitleFit, kpiTitles, lang, leftOut, logoFile,
      noData, noDataSkipped, noPageButtons, o, oneLine, own, pageFilters, paneObjects, pt, resetFill, resetFit, resetIcon,
      resetLook, resetTip, resetW, ringsSmall, rowLabelSkipped, rowLabels, rtl, same, shortDays, slicerH, subtitlesUsed, svgDone,
      svgSizes, tabRows, tableColumns, tableOrder, tableRows, tableSmaller, tableWide, textbox, tip, tipFor, tipName, titleFit, titles,
      trend, u, valueEm, wrapLines, extMeasure, extField, daxOf
    } = c;
    const pageName = pg.id, filters = pageFilters();
    add(D + '/pages/' + pageName + '/page.json', json(Object.assign({
      $schema: SCHEMA.page, name: pageName, displayName: pg.name || base, displayOption: 'FitToPage', width: pg.page.w, height: pg.page.h,
      objects: Object.assign({
        background: obj({ image: { image: { name: str(pg.bgFile), url: resource(pg.bgFile), scaling: str('Fit') } }, transparency: num(0) }),
        outspace: obj({ color: color(u.background) }),
        displayArea: obj({ verticalAlignment: str('Middle') })
      }, paneObjects)
    }, filters.length ? { filterConfig: { filters } } : {})));

    // visuals, in reading order: z and tab order follow it, so keyboard users move through the page the way it reads
    const visuals = [], mob = [], slicerNames = [];
    // a visual inside a group stores its position relative to the group's top-left corner, not the page
    const origin = {};
    const container = (spec) => {
      const o0 = spec.parent ? origin[spec.parent] : { x: 0, y: 0 };
      const v = { $schema: SCHEMA.visual, name: spec.name || rnd(), position: Object.assign({ x: spec.x - o0.x, y: spec.y - o0.y, z: spec.z, height: spec.h, width: spec.w }, spec.kind === 'nodata' || spec.kind === 'panel' ? {} : { tabOrder: spec.z }) };   // (a "No data" message card is no tab stop: seen in Desktop, 6-7 Oct, a card with a tabOrder was an unnamed stop before its chart)
      if (spec.group) origin[v.name] = { x: spec.x, y: spec.y };
      if (spec.group) v.visualGroup = spec.group; else v.visual = spec.visual;
      if (spec.parent) v.parentGroupName = spec.parent;
      if (spec.hidden) v.isHidden = true;
      visuals.push(v); mob.push({ v, kind: spec.kind, parent: spec.parent, group: spec.groupKey, noPhone: spec.noPhone, of: spec.of });
      return v;
    };

    // 0.2.9, audit 2's A2-3: the slots this page really gets, by the design engine's fitSlots with what the writer measures
    // (fitOf): a line chart's room given away on a model with no time axis (told in leftOut with gave; a hand-placed page
    // keeps the caller's positions), the header one row of tabs taller, the filter rail as high as its slicers and Reset
    const tabsLayout = tabsFor(c, pg), fit = fitOf(c, pg), placed = E.fitSlots(pg.slots, fit);
    placed.dropped.forEach((t) => leftOut.push({ page: pg.name || base, kind: 'line', title: t.title || null, gave: true }));
    if (fit.headerRows) headerGrew.push({ page: pg.name || base, by: fit.headerRows });
    pg = Object.assign({}, pg, { slots: placed.slots });
    // Round 19 (seen in Desktop, golden tasks 1 and 4:3: day names slant on the column charts of models without a short
    // day column): a column chart by day or month names whose widest name, at the label size, is wider than its share
    // of the plot (as S3 works it out) is written as a bar chart, whose names are level, where the slot holds one bar
    // per name (22 each + 46, measured in round 0 at 1280 x 720, scaled with the page). A model's "Day Short"
    // (round 18) is used first, so such a chart stays a column chart.
    // (0.2.9, A3-7: the names are measured in their own family, NAMES and namesOf: an Arabic month name by the Arabic
    // names, a Hijri one by the Hijri names; a category the picker gives a kind is taken by that kind)
    const asBar = (s) => {
      const f = B && s.kind === 'column' && (B.cats || {}).column;
      if (!f || f.short || f.c == null) return s;
      const kind = f.kind ? (['day', 'month'].includes(String(f.kind)) ? String(f.kind) : null) : /(^|\s)(day|weekday)\s*name|اسم اليوم/i.test(f.c) ? 'day' : /(^|\s)month\s*name|اسم الشهر/i.test(f.c) ? 'month' : null;
      const list = kind && namesOf(f, kind);
      // writer round 9 (RESCORE-2 D15: bank's "Debtconsolidation" slanted and cut, 6 columns on a designed page): a text
      // category whose names the writer can't measure (no values read) takes the writer's stand-in for a name, 12 letters at
      // the label size, as its tables do; where its columns (the design's N, else as many as hold that name) can't each
      // hold it, it is written as a bar chart, names level (the share of barNameShare), where the slot holds 3 rows (22.2 a
      // row + 45 + 8 + 38, measured); in a slot too low for that it keeps its columns, as many as hold the name
      if (!list) {
        if (!own || !isTextField(f) || isTime(f) || catKind(f) || f.sortBy || f.ordered || f.dateOf) return s;
        const plot = s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40, need = textWidth('n'.repeat(12), LABEL, false, font) + 6, fit = Math.max(3, Math.floor(plot / need));
        const n = s.topN || fit;
        if (plot / n >= need) return s;
        const rows = Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2);
        if (rows < 3) return Object.assign({}, s, { topN: fit });
        barCharts.push({ page: pg.name || base, field: label(f) });
        return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows, topN: rows });
      }
      const k = pg.page.h / 720, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / list.length, widest = Math.max(...list.map((d) => textWidth(d, LABEL, false, font)));
      // (night sitting 6-7 Oct, measured in Desktop 2.158 on a 221-high slot at 1280 x 720, names at the theme's 10pt: a
      // row is 22.2, the first starts 45 under the box's top and 8 stay under the last; the value axis and its room
      // take 38 more, and with it Saturday went behind a scrollbar. So: 23 a row + 54, and where the axis's 38 do not
      // fit as well the chart is written without its value axis, each bar's value beside it (rows, below).)
      if (widest + 6 <= room || s.h < (list.length * 23 + 54) * k) return s;
      barCharts.push({ page: pg.name || base, field: label(f) });
      return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows: list.length });
    };
    // (design round 9, the re-score's D11: two bars across a wide slot on four reports) a bar or column chart by a
    // category the picker marks two-valued (true/false, an IF of two words) is a donut: two shares read at a glance.
    // (D19: product names cut on a column chart, 6 of 8) a column chart by a many-valued category (a lookup table's name,
    // a city) is a bar chart, its names level; its rows are the bar rows its slot holds (the measured 22.2 a row).
    // A slot keeps the kind it was planned as (was): its category and its title are that kind's.
    const byField = (s) => {
      const f = B && (s.kind === 'bar' || s.kind === 'column') && (B.cats || {})[s.kind];
      if (!f || f.c == null) return s;
      if (f.two) return Object.assign({}, s, { kind: 'donut', was: s.kind, topN: null });
      if (s.kind === 'column' && f.wide && !s.wasColumn) { const rows = Math.max(1, Math.floor((s.h * 720 / pg.page.h - 45 - 8 - 38) / 22.2));
        barCharts.push({ page: pg.name || base, field: label(f) }); return Object.assign({}, s, { kind: 'bar', wasColumn: true, rows, topN: s.topN ? rows : s.topN }); }
      return s;
    };
    const sorted = pg.slots.map(asBar).map(byField).sort((a, b) => (a.y - b.y) || (rtl ? b.x - a.x : a.x - b.x));
    const groups = {};
    const groupOf = (kind) => (kind === 'title' || kind === 'logo' ? 'header' : kind === 'kpi' ? 'kpis' : kind === 'slicer' ? 'filters' : null);
    const GROUP_NAMES = { header: W.header || 'Header', kpis: W.kpis || 'KPI cards', filters: W.filters || 'Filters' };
    let z = 1000, kpiIndex = 0;
    // The KPI titles of a page share one size (seen in Desktop on 2026-10-05: 12pt beside 8pt in one row looked
    // wrong): the largest, down to 8pt, at which the longest title of the row fits its card.
    let kpiTitle = TITLE;
    sorted.filter((s) => s.kind === 'kpi').forEach((s, i) => {
      const f = B && B.kpis ? B.kpis[i] : null, text = f ? label(f) : s.title;
      const c = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, { top: Math.round(12 * pg.page.h / 1080), side: pg.kpiInset || (SOLID ? Math.round(16 * pg.page.h / 1080) : 0) }, valueEm(f));
      while (kpiTitle > 8 && text != null && textWidth(text, kpiTitle, true, font) > s.w - c.S - c.P) kpiTitle--;
    });
    // An SVG design on a card's image (o.svgCards): the image area is a percent of the card's inner width, which was
    // 0.8 of the card's width on the two cards measured (163 and 165 wide, 1280 x 720). The design is shown at its own
    // width where that is 10 to 25 percent, and the value is fitted to the width left (take: the area and a gap of 8).
    // Round 12 (the owner's go on round 11's recommendation 3, and #8): the image area is a percent of the card's width
    // less its padding, measured in Desktop 2.158 (round 11) as 25 a side at 1920 x 1080 and 17 at 1280 x 720 (25 x the
    // page's scale), not of 0.8 x the card; and one percent for the row, from its narrowest card, so the images are equal.
    const kpiSlots = sorted.filter((s) => s.kind === 'kpi'), rowMinW = kpiSlots.length ? Math.min(...kpiSlots.map((s) => s.w)) : 0, imgPad = 50 * pg.page.h / 1080;
    const imgOf = (s, i) => { const sc = (o.svgCards || []).find((x) => x.card === i); if (!sc) return null;
      // Round 13 (seen in Desktop 2.158, 6 Oct 2026, "SC EN light 720": a 64 x 64 ring on a 96-high card, sized by the
      // width alone, was drawn 54.6 high and its top was cut by the card): the picture is never taller than the
      // room under the card's title (the card less its top and bottom padding, the title's lines, the value's own
      // padding and the 2 between them: imgRoom), on the row's widest card; 5 percent at least.
      const byWidth = Math.max(10, Math.min(25, Math.round(100 * (+sc.w || 48) / Math.max(1, rowMinW - imgPad))));
      const byHeight = Math.floor(100 * imgRoom(s) * ((+sc.w || 48) / (+sc.h || 48)) / Math.max(1, rowMaxW - imgPad));
      const pct = Math.max(5, Math.min(byWidth, byHeight)); return { sc, pct, take: Math.ceil((s.w - imgPad) * pct / 100) + 8 }; };
    // (the title takes one line at the theme's size or two at 8pt, whichever is higher, so the room holds in both)
    const rowMaxW = kpiSlots.length ? Math.max(...kpiSlots.map((s) => s.w)) : 0;
    const imgRoom = (s) => { const c0 = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, KPI_M, AUTO_EM); return s.h - c0.T - c0.P - 2 * c0.I - Math.max(Math.ceil(TITLE * 1.5), 2 * Math.ceil(8 * 1.5)) - 2; };
    const KPI_M = { top: Math.round(12 * pg.page.h / 1080), side: pg.kpiInset || (SOLID ? Math.round(16 * pg.page.h / 1080) : 0) };
    // one KPI card's fit: on one title line (c), on two (two), its image, and how its title is shown (fit)
    const kpiFits = (s, i, text, f) => { const im = imgOf(s, i), take = im ? im.take : 0, c = cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, KPI_M, valueEm(f), 1, take), two = cardFit(s.w, s.h, pg.page.h / 720, kpiTitle, CALLOUT, KPI_M, valueEm(f), 2, take);
      return { c, two, im, fit: kpiTitleFit(text, kpiTitle, s.w - c.S - c.P, c, two) }; };
    // #9 (seen in Desktop 2.158, round 11: one 15pt value among 14pt ones): one value size for the row, the smallest
    // that fits every card
    let rowV = null;
    const rowValue = () => (rowV == null ? (rowV = Math.min(...kpiSlots.map((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? label(f) : s.title, f).c.V; }))) : rowV);
    let rowWrap = null;
    const rowWraps = () => (rowWrap == null ? (rowWrap = sorted.filter((s) => s.kind === 'kpi').some((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? label(f) : s.title, f).fit.mode === 'wrapped'; })) : rowWrap);
    // Round 12 (#24; seen in Desktop 2.158, 5 Oct 2026: long Arabic chart titles and a slicer header were cut at their
    // start, "...عات حسب اسم الفرع التجاري الرئيسي", so the measure's name was lost). A chart's or table's title too
    // long for one line wraps to two (titleWrap, as a KPI title does), and one too long for two lines is shortened at a
    // word with "…" at its end, so it still begins with the measure's name; the full title stays the alt text. The
    // room: the visual's width less 16 a side (1920 x 1080, scaled); the theme's title size, measured as bold.
    const fitted = new Map();   // round 22: each chart's full title and the room it was fitted to
    // a slicer's header, shortened to the slicer's width: the header's own text (header.text, in Microsoft's theme
    // schema), so the field keeps its name everywhere else; the full name stays the slicer's alt text
    // (rc1, PERF-COMPARE D3: "Enforcement_History..." cut where a smaller text held it whole: the header takes the largest
    // size, down to 8pt, at which the name is whole, as a KPI card's title; it is shortened only where even 8pt doesn't hold it)
    const slicerHeader = (f, w) => { const out = { show: bool(true), fontFamily: str(font) }; if (!f) return obj(out); const full = label(f), room = w - 2 * Math.round(8 * k);
      let size = SLICER_TEXT; while (size > 8 && oneLine(full, size, room) !== full) size = Math.ceil(size) - 1;
      if (size < SLICER_TEXT) out.textSize = num(size);
      const shown = oneLine(full, size, room);
      if (shown !== full) { titles.slicers.push({ page: pg.name || base, field: full, shown }); out.text = str(shown); } return obj(out); };
    // Round 12 (#15; seen in Desktop 2.158, round 11: "Total Sales by Day Name" twice on one page): a table whose title
    // is a chart's title on the same page is titled by what it adds, "...: detail"
    const pageCats = new Set();   // the categories this page's charts already show (round 16, #18)
    let catPlan = null;   // each categorical chart slot's category, given out once for the page (round 18)
    const chartTitles = new Set(B ? sorted.filter((s) => CHARTS.includes(s.kind)).map((s) => bindTitle(s.was || (s.wasColumn ? 'column' : s.kind), B, W.by || 'by')).filter(Boolean) : []);   // (wasColumn: a column chart written as a bar chart keeps its own title)
    const charts = [];
    sorted.forEach((s) => {
      const g = groupOf(s.kind);
      if (g && !groups[g]) groups[g] = { name: rnd(), x0: s.x, y0: s.y, x1: s.x + s.w, y1: s.y + s.h, z: 0 };
      if (g) { const G = groups[g]; G.x0 = Math.min(G.x0, s.x); G.y0 = Math.min(G.y0, s.y); G.x1 = Math.max(G.x1, s.x + s.w); G.y1 = Math.max(G.y1, s.y + s.h); }
    });
    // groups sit under their visuals in the layer order
    Object.keys(groups).forEach((g) => { const G = groups[g]; G.z = z; z += 1000;
      // in a solid design the theme would draw a band behind the whole group, square and without a shadow (a group
      // has neither a border nor a shadow), so no group draws one: the KPI cards each have their own panel, and the
      // header and the filter rail get a panel behind them (below)
      container({ name: G.name, x: G.x0, y: G.y0, w: G.x1 - G.x0, h: G.y1 - G.y0, z: G.z, kind: 'group', groupKey: g,
        group: Object.assign({ displayName: GROUP_NAMES[g], groupMode: 'ScaleMode' }, SOLID ? { objects: { background: obj({ show: bool(false) }) } } : {}) });
      // The header's and the filter rail's panel on a solid design: an empty text box left to the theme, under the
      // group in the layer order. Nothing is written for its background, border or shadow, so the theme draws the
      // same panel as behind the cards (measured in Desktop 2.158, DESKTOP-TESTS.md round 1; a shape with its own
      // rounded fill is not drawn rounded). The rail's is the group's box; the header's is grown by 12k at each side
      // and 6k above and below, which lines it up with the rail and the cards. Not in the phone layout.
      if (SOLID && g !== 'kpis') {
        const kk = pg.page.h / 1080, dx = g === 'header' ? Math.round(12 * kk) : 0, dy = g === 'header' ? Math.round(6 * kk) : 0;
        const bx = Math.max(0, G.x0 - dx), by = Math.max(0, G.y0 - dy);
        container({ x: bx, y: by, w: G.x1 + dx - bx, h: G.y1 + dy - by, z: G.z - 500, kind: 'band', noPhone: true,
          visual: { visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: '' }] }] }) }, visualContainerObjects: { title: obj({ show: bool(false) }) } } });
      } });

    // page navigation between the title and the logo, when the report has more than one page
    const title = pg.slots.find((s) => s.kind === 'title'), logo = pg.slots.find((s) => s.kind === 'logo');
    let nav = null, openBtn = null, tabs = null;
    const panel = pg.panel && title && logo ? pg.panel : null, k = pg.page.h / 1080;
    if (title && logo) {
      // (round 18, seen in Desktop on 6 Oct 2026: with the ☰ written first, an Arabic button drew it at the left of the
      // word, the reading end; written after the word, the left-to-right button draws it at the right)
      const gap = 24 * k, openText = rtl ? (W.filters || 'Filters') + '  ☰' : '☰  ' + (W.filters || 'Filters');
      let x0 = rtl ? logo.x + logo.w + gap : title.x + title.w + gap, x1 = rtl ? title.x - gap : logo.x - gap;
      // slide-in filters: the Filters button sits next to the logo, the page buttons use what is left
      if (panel) {
        const bw = Math.round(Math.max(Math.min(180 * k, Math.max(120 * k, (title.textH || title.h) * 3)), charW(LABEL) * openText.length + 16 * k));
        openBtn = { x: Math.round(rtl ? x0 : x1 - bw), y: title.y, w: bw, h: title.h, text: openText };
        if (rtl) x0 += bw + 16 * k; else x1 -= bw + 16 * k;
      }
      // page buttons: 140 each on 1920 x 1080, or what the longest page name needs (two lines when the header holds
      // them); squeezed into the room left, with smaller text if needed; left out when even 8pt doesn't fit
      // Round 10 (the owner's design note; looks and widths measured in Desktop 2.158, DESKTOP-TESTS.md round 10):
      // the navigator is tabs without boxes, one button per page in both directions: the current page's name bold in
      // the accent colour with a line under it, the others in a quieter text colour. Each button is as wide as its
      // own name needs (a button cuts its text when it is narrower than the text + 10), so no name is cut; they sit
      // at the logo's side of the room between the end of the title's text and the logo, at the largest size (down
      // to 8pt) that fits on one row, then on two or three rows if the header is high enough. Only when even that
      // does not fit does the page keep Power BI's own navigator (below), which cuts names.
      if (PAGES.length > 1) tabs = tabsLayout(title, logo, x0, x1, title.h);
      if (PAGES.length > 1 && !tabs) {
        const n = PAGES.length, longest = Math.max(...PAGES.map((p) => String(p.name || base).length));
        // (a page button puts a long name on two lines only when two lines fit its height, 3.5 x pt in Segoe UI and
        // 3.2 x pt in Tahoma, and cuts it with "..." otherwise: measured in Desktop 2.158, DESKTOP-TESTS.md round 1)
        const need = (t) => { const L = Math.min(2, Math.max(1, Math.floor(title.h / (1.8 * t)))); return Math.ceil(charW(t) * Math.ceil(longest / L) + 16 * k); };
        let t = pt(title.h * 0.3);
        const w = Math.min(x1 - x0, n * Math.max(140 * k, need(t)) + 40 * k);
        while (t > 8 && (need(t) > (w - 40 * k) / n || buttonH(t) > title.h)) t--;
        if (need(t) <= (w - 40 * k) / n && buttonH(t) <= title.h) nav = { x: rtl ? x0 : x1 - w, y: title.y, w, h: title.h, t };
        // Right to left: the page navigator has no setting for its order and always puts the first page on the
        // left, so the page buttons are single buttons, the first page's rightmost (measured in Desktop 2.158,
        // DESKTOP-TESTS.md round 2). A button never wraps its text, which is 0.45 em a character at most (measured
        // 0.38-0.42), and needs 6 + 1.6 x pt in height: the same box
        // rule with one line; where the header is too low or too narrow for that even at 8pt, the navigator stays.
        if (rtl) {
          const need1 = (t1) => Math.ceil(0.45 * 4 / 3 * t1 * longest + 16 * k), fits = (t1, w1) => need1(t1) <= (w1 - 40 * k) / n && Math.ceil(6 + 1.6 * t1) <= title.h;
          let t1 = pt(title.h * 0.3);
          const w1 = Math.min(x1 - x0, n * Math.max(140 * k, need1(t1)) + 40 * k);
          while (t1 > 8 && !fits(t1, w1)) t1--;
          if (fits(t1, w1)) nav = { x: x0, y: title.y, w: w1, h: title.h, t: t1, buttons: true };
        }
      }
      // Round 11 (seen in Desktop, 5 Oct: eight long names on a 1280 x 720 page with a 32-high header): when the names
      // fit neither as tabs nor in the navigator, the page gets no page buttons (a cut name is worse). That is told.
      if (PAGES.length > 1 && !tabs && !nav) noPageButtons.push({ page: pg.name || base });
    }

    sorted.forEach((s) => {
      const g = groupOf(s.kind), parent = g ? groups[g].name : null, type = TYPES[s.kind] || 'cardVisual';
      if (s.kind === 'slicer') {
        // the filter panel holds several dropdown slicers and a Reset button:
        // stacked in a side panel, side by side in a top strip
        // (sizes from 1920 x 1080 scaled by k; Reset as wide or as high as its text needs, slicers the height a dropdown needs)
        // (on a user's own model a slicer the model has no column for is left out and told, and the others share the room)
        const all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), fields = B && own ? all3.filter(Boolean) : all3, pad = 10 * k, gap = 8 * k, n = Math.max(1, fields.length);
        all3.forEach((f, i) => { if (B && own && !f) leftOut.push({ page: pg.name || base, kind: 'slicer', title: (W.slicer || 'Slicer') + ' ' + (i + 1) }); });
        const resetText = W.reset || 'Reset filters';
        const bw = resetW(resetText, k, s.w - 2 * pad);
        const reset = resetFit(resetText, bw, k), bh = reset.h;
        // Round 13 (seen in Desktop 2.158, 6 Oct 2026, "AK EN light": a hand-placed 444 x 310 slot, wider than high,
        // held three dropdowns 100 wide beside Reset, their headers cut to "Q…", "Da…"): the slot is a strip only when
        // each dropdown gets 160k at least; a slot too narrow for that stacks them like a rail where its height holds
        // them (a slot that holds them neither way stays a strip, as before).
        const stripW = (s.w - 2 * pad - bw - gap - gap * (n - 1)) / n, stackH = n * slicerH(SLICER_TEXT) + gap * n + bh + 2 * pad;
        const across = !s.stack && s.w > s.h && (stripW >= 160 * k || stackH > s.h);
        const room = across ? s.w - 2 * pad - bw - gap : s.w - 2 * pad;
        const sw = across ? (room - gap * (n - 1)) / n : room;
        const sh = across ? s.h - 2 * pad : Math.max(slicerH(SLICER_TEXT), Math.min(76 * k, (s.h - 2 * pad - bh - gap * n) / n));
        fields.forEach((f, i) => {
          // in a right-to-left report the first slicer is the rightmost one, so tab order follows the reading
          const x = across ? (rtl ? s.x + s.w - pad - sw - i * (sw + gap) : s.x + pad + i * (sw + gap)) : s.x + pad, y = across ? s.y + pad : s.y + pad + i * (sh + gap);
          const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
          const v = container({ x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(sh), z: z, parent, kind: 'slicer',
            visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
              objects: { data: obj({ mode: str('Dropdown') }), header: slicerHeader(f, Math.round(sw)) },
              visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
          slicerNames.push(v.name);
          z += 1000;
        });
        // Reset button: applies a bookmark that clears these slicers
        // (across: at the end of the strip; in a rail: at the reading start, lined up with the slicers)
        const bm = rnd(), bx = across ? (rtl ? s.x + pad : s.x + s.w - pad - bw) : (rtl ? s.x + s.w - pad - bw : s.x + pad), by = across ? s.y + (s.h - bh) / 2 : s.y + s.h - pad - bh;
        container({ x: Math.round(bx), y: Math.round(by), w: Math.round(bw), h: Math.round(bh), z, parent, kind: 'button',
          visual: { visualType: 'actionButton',
            objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
              fill: resetFill(), outline: def({ show: bool(false) }) },
            visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: str(bm) }) }) } });
        z += 1000;
        bookmarks.push({ name: bm, page: pageName, targets: slicerNames.slice(), label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
        return;
      }
      let visual, box = s, vFilters = null, tableH = null;   // (tableH: a table's whole-row height inside its panel, S3 with the design's N6)   // (vFilters: the visual's own filters, from fixVisual; the cross-review's G12)
      let hov = null;   // a chart's own measure and category, for its tooltip page (the second sweep's T4 and T5)
      if (s.kind === 'title') {
        // the title and the logo text follow the header's height (within 8-60pt), and stay on one line in it, with
        // the text's middle at the header's (see centred)
        const size = Math.min(pt((s.textH || s.h) * 0.42), boxFit(s.textH || s.h));
        box = centred(s, size);
        visual = { visualType: 'textbox', objects: textbox(shown(o.title || base), size, true, u.text), visualContainerObjects: frame(null, o.title || base) };
      } else if (s.kind === 'logo') {
        // image.fit 'Fit' keeps the logo's own ratio and shows it whole; the old imageScaling 'Fit' stretched it to the
        // box (measured in Desktop 2.158). The box itself has the logo's shape (the design engine, logoRatio).
        const size = Math.min(pt((s.textH || s.h) * 0.3), boxFit(s.textH || s.h));
        // (round 12, #30: the Tahoma placeholder sat 2.6 to 3.4 below the header's middle, measured in Desktop 2.158,
        // round 11 (D15): it is drawn 3 higher)
        // (0.2.9, O-6 of the owner's test of 0.2.8: "Your logo" stayed in a finished report's header): no placeholder
        // where the caller says so (create_report); the website's template download keeps it for the user to replace
        if (!logoFile && o.logoPlaceholder === false) return;
        if (!logoFile) { box = centred(s, size); if (/^tahoma/i.test(font) && box.y > s.y) { const up = Math.min(3, box.y - s.y); box = { y: box.y - up, h: box.h + up }; } }
        visual = logoFile
          ? { visualType: 'image', objects: { general: obj({ imageUrl: resource(logoFile) }), image: obj({ fit: str('Fit') }) }, visualContainerObjects: frame(null, W.logo || 'Logo') }
          // the placeholder until a logo is added: sized to the header slot, in the secondary text colour so it reads
          // (round 12, #30: aligned to the page's edge, the side the logo will take: right in English, left in Arabic;
          // "شعارك" started 150 in from the edge, seen in Desktop 2.158, round 11)
          : { visualType: 'textbox', objects: textbox(W.logoHere || 'Your logo', size, false, mixHex(u.text, u.card, 0.3), rtl ? 'left' : 'right'), visualContainerObjects: frame(null, W.logo || 'Logo') };
      } else if (s.kind === 'text') {
        // (round 13, seen in Desktop on 6 Oct, "R12 text EN": the sentence at 11pt on a 1920 x 1080 page read like a
        // footnote at the top of a tall panel: a given text is written at the theme's label size for the page, 11 at least)
        // (round 12, #20: the slot's own text when the caller gives one, s.text; the placeholder is for the website's
        // template download only: create_report leaves the box out when it has no text for it)
        visual = { visualType: 'textbox', objects: textbox(s.text != null ? String(s.text) : W.textHere || 'Explain what the main chart shows and what to do about it.', s.text != null ? Math.max(11, LABEL) : 11, false, u.text), visualContainerObjects: frame(s.title, s.title, null, true) };
      } else {
        // a table keeps only the fields its width has room for (tableFit); Bt is the bind this table is written from
        let Bt = B, tableText = null, smallEntry = null;
        if (B && (s.kind === 'table' || s.kind === 'matrix')) {   // (a matrix too: round 16, #15)
          // Round 12 (the owner's go on round 11's recommendation 5): a table too narrow for its fields first takes a
          // smaller text, down to 8pt: the largest size that keeps the most fields; a field is left out only where even
          // that doesn't hold it. The size is written on the table (values, headers, total) and told.
          const T0 = +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
          // (rc1, S1/S2: a table's fields are kept by cellRoom, the room its column widths are written by, within its width
          // less 36 (padding and scrollbar); a matrix keeps the earlier rule)
          const tsc = s.kind === 'table' ? pg.page.h / 1080 : null, tw = tsc ? s.w - 36 : s.w, roomOf = (f, t2) => (tsc ? cellRoom(f, t2, font, tsc) : fieldRoom(f, t2, font));
          let tf = tableFit(B.table, tw, T0, font, tsc);
          if (tf.leftOut.length) { for (let t2 = Math.ceil(T0) - 1; t2 >= 8; t2--) { const f2 = tableFit(B.table, tw, t2, font, tsc); if (f2.kept.length > tf.kept.length) { tf = f2; tableText = t2; } if (!f2.leftOut.length) break; } }
          // Round 22 (golden task 6 in English, in Desktop since the night of 6-7 Oct: two long names at the theme's 15pt
          // were wider than the table, a horizontal scrollbar): the fields a table keeps must fit its box too. The text
          // was only made smaller to keep more fields; the two that are always kept were never measured. It now goes
          // down, to 8pt at most, until the kept fields fit (told like every smaller table text)
          // Round 22b (the review of round 22, item 8): two fields wider than the box even at 8pt are told. (The fit is
          // not redone at this size: the loop above already tried every size down to 8 and kept the most fields, so
          // this only runs where the two alone are kept, and no third fits at any size: checked on 30,000 tables)
          { const need = (t2) => tf.kept.reduce((a2, f) => a2 + roomOf(f, t2), 0); let t3 = tableText || T0;
            while (t3 > 8 && need(t3) > tw) t3 = Math.ceil(t3) - 1;
            if (t3 < (tableText || T0)) tableText = t3;
            if (need(t3) > tw) tableWide.push({ page: pg.name || base, width: s.w, need: Math.ceil(need(t3)) }); }
          if (tableText) tableSmaller.push(smallEntry = { page: pg.name || base, size: tableText, from: T0 });
          if (tf.leftOut.length) { Bt = Object.assign({}, B, { table: tf.kept }); tableColumns.push({ page: pg.name || base, pageIndex, x: s.x, y: s.y, kept: tf.kept, leftOut: tf.leftOut }); }
        }
        // Round 16 (design finding #18): each chart of a page by a category not used on the page yet, from the picker's
        // pool (B.catPool), where the model has more than one; the same category only when it has no other
        // Round 18 (seen in Desktop, 6 Oct 2026: on a model with three text columns the operations layout's two bar
        // charts were both by the first one, because the column chart, earlier in the reading order, had taken the
        // third): the page's categories are given out once, the bar charts and the donut first in reading order,
        // then the column chart and the map; a chart repeats a category only when the pool has no unused one.
        // (night sitting 6-7 Oct, seen in Desktop: a column chart written as a bar chart, round 19, took the bar chart's
        // category: the page showed the same chart twice. It keeps the column chart's own: kindOf.)
        const kindOf = (x) => x.was || (x.wasColumn ? 'column' : x.kind);
        if (B && CAT_KINDS.includes(s.kind) && (B.cats || {})[kindOf(s)]) {
          const k0 = (f) => f.t + '\u0001' + f.c;
          if (!catPlan) { catPlan = new Map(); const last = (x) => kindOf(x) === 'column' || x.kind === 'map', all = sorted.filter((x) => CAT_KINDS.includes(x.kind) && (B.cats || {})[kindOf(x)]);
            all.filter((x) => !last(x)).concat(all.filter(last)).forEach((x) => { let c = B.cats[kindOf(x)]; if (pageCats.has(k0(c))) { const alt = (B.catPool || []).find((f) => !pageCats.has(k0(f))); if (alt) c = alt; } pageCats.add(k0(c)); catPlan.set(x, c); }); }
          const c = catPlan.get(s); if (c && c !== B.cats[s.kind]) Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { [s.kind]: c }) });
        }
        // (writer round 9: a column chart written as a bar chart keeps the column chart's own measure, as it keeps its
        // category and title; it took the bar chart's, so a page could show one measure twice)
        if (B && s.wasColumn) Bt = Object.assign({}, Bt, { y: Object.assign({}, Bt.y, { bar: (Bt.y || {}).column }) });
        // Round 18, S3 (the owner's yes, 6 Oct 2026; seen in Desktop: the day names slant on the 1920 x 1080 column
        // charts): a column chart by Day Name takes the calendar's Day Short where the model has it (c.short) and the
        // full names, at the label size, are wider than a seventh of the chart's plot (the value axis about 40)
        if (B && s.kind === 'column' && ((Bt.cats || {}).column || {}).short) {
          const c0 = Bt.cats.column, room = (s.w - 2 * Math.round(16 * pg.page.h / 1080) - 40) / 7;
          const widest = Math.max(...namesOf(c0, 'day').map((d) => textWidth(d, LABEL, false, font)));   // (A3-7: the day names of its own family)
          if (widest + 6 > room) { Bt = Object.assign({}, Bt, { cats: Object.assign({}, Bt.cats, { column: Object.assign({}, c0.short, { name: label(c0) }) }) }); shortDays.push({ page: pg.name || base }); }
        }
        const query = B ? bindQuery(s.kind, Bt, kpiIndex, rtl) : null;
        if (B && CHARTS.includes(s.kind)) { const k = s.kind;
          hov = { m: k === 'line' ? Bt.measure : k === 'funnel' && Bt.y && 'funnel' in Bt.y ? Bt.y.funnel : (Bt.y || {})[k] || Bt.measure, cat: k === 'line' ? Bt.date : (Bt.cats || {})[k] }; }
        let ttl = s.title;
        const extra = {};
        // (round 10: the sample download names its charts by their fields too, "Total Revenue by Month", as a report on a
        // user's model does; before, it kept the layout's role names, "Main trend")
        if (B && query) ttl = bindTitle(s.kind, Bt, W.by || 'by') || ttl;
        // (rc1: a chart cut to its top N says so in its title, as the tooltip page's "Top 6")
        let topOf = null;
        { const top = B && query ? topCount(c, s, pg, catOf(Bt, query)) : 0; if (top && ttl) { ttl = (lang === 'ar' ? 'أعلى ' : 'Top ') + top + ': ' + ttl; topOf = { n: top, cat: catOf(Bt, query), y: query.queryState.Y.projections[0].field }; } }
        if ((s.kind === 'table' || s.kind === 'matrix') && ttl && chartTitles.has(ttl)) ttl = ttl + ': ' + (AR_LETTERS.test(ttl) ? (W.detail && AR_LETTERS.test(W.detail) ? W.detail : 'التفاصيل') : (W.detail && !AR_LETTERS.test(W.detail) ? W.detail : 'detail'));   // (round 14: in the title's own script)
        if (s.kind === 'kpi') { if (B && query) ttl = label(B.kpis[kpiIndex]); kpiIndex++; }
        // KPI names read as labels: semibold, so the number below stays the hero
        if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(shown(ttl)), alignment: str(align), bold: bool(true) });
        // a visual that shows data is never written without its fields (Microsoft's validator: PBIR_QUERY_STATE_MISSING;
        // Desktop shows an empty box): on a user's own model it is left out and told (leftOut). The KPI cards are
        // counted by the caller.
        if (B && own && !query && (CHARTS.includes(s.kind) || ['table', 'matrix', 'gauge', 'card'].includes(s.kind))) { leftOut.push({ page: pg.name || base, kind: s.kind, title: s.title || null }); return; }
        visual = { visualType: type, visualContainerObjects: frame(ttl, ttl, extra, true), drillFilterOtherVisuals: true };
        if (query) visual.query = query;
        // bars that fade by value (gradientFill above): the report's own bar and column charts, never the tooltip pages'
        if (GRAD && query && (s.kind === 'bar' || s.kind === 'column')) { visual.objects = { dataPoint: gradientFill(query.queryState.Y.projections[0].field, GRAD) }; chartColors.charts++; }
        if (MIRROR && query && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line')) { mirrorChart(visual, s.kind); chartAxes.charts++; }
        // Round 21 (the capabilities lab's #6, Desktop 2.158, 7 Oct 2026: "77.7K" above the columns, kept on Save): a column
        // chart with few columns shows its values above them: labels at 'OutsideEnd', automatic units (0, K or M by the
        // values' size, as the KPI cards) with one decimal (a percent measure keeps its own format). Only where the
        // number of columns is known from the model's names: a quarter (4); other columns could have any number
        if (query && s.kind === 'column') { const cf = query.queryState.Category.projections[0], cn = String(cf.nativeQueryRef || cf.queryRef || '');
          // (round 22, the code review's f: "Year Quarter" and "Fiscal Year Quarter" end the same way and hold 8 to 40 values:
          // a name with a year in it is never taken for four columns)
          const four = (n) => /(^|\s|\.)quarter$|الربع/i.test(n) && !/year|سنة|السنة|عام/i.test(n);
          const cf0 = (Bt.cats || {}).column || {};   // (A3-7: the picker's kind and count first, where it gives them)
          if (cf0.kind ? String(cf0.kind) === 'quarter' && (catKind(cf0) || {}).rows === 4 : four(cn) || four(String(cf0.c || ''))) {
            const yf = ((Bt.y || {}).column || Bt.measure || {}), pct = !!yf.pct;
            visual.objects = visual.objects || {};
            visual.objects.labels = obj(Object.assign({ show: bool(true), labelPosition: str('OutsideEnd'), labelDisplayUnits: num(0) }, pct ? {} : { labelPrecision: lit('1L') }));
          } }
        if (GRID && query && (s.kind === 'bar' || s.kind === 'column' || s.kind === 'line')) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.gridlineColor = color(GRID); }
        // a column chart written as a bar chart (asBar) in a slot too low for its rows and a value axis: no value axis,
        // each bar's value beside it (the tooltip pages' bar chart, measured in round 0)
        if (s.wasColumn && query && s.h < (s.rows * 23 + 92) * (pg.page.h / 720)) { visual.objects = visual.objects || {}; const va = visual.objects.valueAxis || (visual.objects.valueAxis = [{ properties: {} }]); va[0].properties.show = bool(false); visual.objects.labels = obj({ show: bool(true) }); }
        // Round 21 (the capabilities lab's #2, Desktop 2.158, 7 Oct 2026: one small line under the title, shaped right in
        // Arabic, kept on Save): a subtitle from the approved plan only (o.subtitles: a slot's plan role, English or
        // Arabic, or a hand-placed slot's title -> its text); the writer never makes one up
        // (round 22, the code review's b, measured in Desktop 2.158.1304 on 7 Oct: on a planned KPI card the subtitle's line
        // pushes the value down and cuts it in half, the card is sized for a title and a value: never on a card. The keys
        // used are reported, subtitlesUsed, so the caller can say which were not)
        if (o.subtitles && ttl && visual.visualContainerObjects && s.kind !== 'kpi' && s.kind !== 'card') { const key = [].concat(s.role || [], s.title || []).find((k) => typeof o.subtitles[k] === 'string' && o.subtitles[k].trim());
          if (key != null) { visual.visualContainerObjects.subTitle = obj({ show: bool(true), text: str(o.subtitles[key].trim()) }); subtitlesUsed.add(key); } }
        if (s.kind !== 'kpi' && s.kind !== 'card' && ttl) {
          const tf = titleFit(ttl, TITLE, s.w - 2 * Math.round(16 * pg.page.h / 1080)), tp = visual.visualContainerObjects.title[0].properties;
          fitted.set(visual, { ttl, avail: s.w - 2 * Math.round(16 * pg.page.h / 1080), page: pg.name || base, top: topOf });
          if (tf.mode !== 'one') { tp.text = str(tf.shown); if (!tf.one) tp.titleWrap = bool(true); titles[tf.mode].push(fitted.get(visual).entry = { page: pg.name || base, title: ttl, shown: tf.shown }); }
        }
        // the title already names the KPI, so the card's own label under the number is not repeated
        if (type === 'cardVisual') {
          const cf0 = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex - 1] : B.measure) : null;
          const kf = s.kind === 'kpi' ? kpiFits(s, kpiIndex - 1, ttl, cf0) : null;
          const c = kf ? kf.c : cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, { top: Math.round(12 * pg.page.h / 1080), side: SOLID ? Math.round(16 * pg.page.h / 1080) : 0 }, valueEm(cf0));
          let cc = c;
          if (s.kind === 'kpi') {
            const fit = kf.fit;
            const tp = visual.visualContainerObjects.title[0].properties;
            if (fit.mode === 'wrapped') { cc = fit.c; tp.titleWrap = bool(true); kpiTitles.wrapped.push({ page: pg.name || base, title: ttl }); }
            // a one-line title in a row where another title wraps: the second line's height stays free above it, so
            // every value of the row sits at the same height (seen in Desktop 2.158, 2026-10-05: 6 apart without it)
            else if (rowWraps() && kf.two.V >= c.V) cc = Object.assign({}, kf.two, { V: c.V, T: kf.two.T + Math.ceil(kpiTitle * 1.5) });
            if (fit.mode === 'shortened') { tp.text = str(fit.shown); kpiTitles.shortened.push({ page: pg.name || base, title: ttl, shown: fit.shown }); }
          }
          if (s.kind === 'kpi') cc = Object.assign({}, cc, { V: Math.min(cc.V, rowValue()) });
          visual.objects = cardObjects(cc, s.kind === 'kpi' ? align : null, cf0); cardFrame(visual.visualContainerObjects, cc, s.kind === 'kpi' ? kpiTitle : TITLE);
          // Round 21 (the capabilities lab's #1, measured in Desktop 2.158 on 7 Oct 2026; the owner's go): with the "No data"
          // option a card says "No data" (Arabic: لا توجد بيانات) instead of "--": value.showBlankAs in the default entry.
          // The owner (7 Oct, "Keep numbers big"): the value keeps its size. The blank text is drawn at the value's size, so
          // it is written only where it fits there: the lab's anchor (the Arabic text whole on a card 300 wide at 30pt, cut
          // at 240) scaled by our letter widths; a narrower card keeps "--" (told: blankKept).
          if (NODATA && (s.kind === 'kpi' || s.kind === 'card')) {
            const ve = visual.objects.value.find((e) => e.selector && e.selector.id === 'default'), bt = lang === 'ar' ? 'لا توجد بيانات' : 'No data';
            const need = 300 * textWidth(bt, cc.V, false, font) / textWidth('لا توجد بيانات', 30, false, 'Segoe UI');
            if (ve && s.w >= need) ve.properties.showBlankAs = str(bt);
            else if (ve) blankKept.push({ page: pg.name || base, title: ttl || null, w: s.w, need: Math.ceil(need) });
          }
          // #7 (seen in Desktop 2.158, round 11: the value 9 to the right of its title's first letter): a KPI card's inner
          // padding is 0 at the reading start, so the value starts at its title's edge (paddingIndividual and the
          // margins, in Microsoft's theme schema for the card visual)
          if (s.kind === 'kpi') visual.objects.padding = obj({ paddingUniform: num(cc.I), paddingIndividual: bool(true), topMargin: num(cc.I), bottomMargin: num(cc.I), leftMargin: num(rtl ? cc.I : 0), rightMargin: num(rtl ? 0 : cc.I) }, DEF);
          // an SVG design on the card's image (o.svgCards; the JSON Desktop writes for "Select from data", measured in
          // Desktop 2.158, third sitting of 2026-10-04): the nth KPI card of every page
          // Its size (Desktop 2.158, 2026-10-05): without one the image was drawn 65 wide on a 163-wide card and the value
          // was cut; "Image area size" with fixedSize false sizes it (25 drew 32 wide, 30 drew 40): see imgOf.
          // Its side (Desktop 2.158, round 11, 2026-10-05): the card draws the image at the right by default, which in a
          // right-to-left report is the reading start, between the card's edge and the value (a 42pt value touched it);
          // position 'Left' puts it at the far end, and the value sits at the right under its title.
          const sc = kf && kf.im ? kf.im.sc : null;
          if (sc) visual.objects.image = [{ properties: Object.assign({ show: bool(true), imageType: str('imageData'), fixedSize: bool(false), imageAreaSize: num(kf.im.pct) }, rtl ? { position: str('Left') } : {}, { imageData: { expr: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: sc.t } }, Property: sc.m } } } }), selector: { id: 'default' } }];
          // A number format on the report side (measured in Desktop 2.158, D8, 2026-10-04): where the bound measure
          // carries cardFormat (the server sets it for a measure whose model format has no thousand separator),
          // the card gets the entry Desktop itself writes for Display units "Custom" with a format code: a second
          // entry of "value", selected by the field's query reference. Only cards: tables and tooltips not measured.
          const cf = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex - 1] : B.measure) : null;
          if (FULL && cf && cf.m != null && cf.cardFormat && !cardCode(cf)) visual.objects.value.push({ properties: { labelDisplayUnits: num(-1), customFormatString: str(cf.cardFormat) }, selector: { metadata: cf.t + '.' + cf.m } });
        }
        // tables fill their visual (grow to fit), instead of shrinking to their content and leaving the rest empty
        // (on a right-to-left page the title sat on the right and the table on the left)
        if (s.kind === 'table') visual.objects = { columnHeaders: obj(Object.assign({ columnAdjustment: str('growToFit'), autoSizeColumnWidth: bool(true) }, tableText ? { fontSize: num(tableText) } : {})) };
        if (s.kind === 'table' && tableText) Object.assign(visual.objects, { values: obj({ fontSize: num(tableText) }), total: obj({ fontSize: num(tableText) }) });
        // Round 18 (seen in Desktop, 6 Oct 2026, "P7 hand EN": a 420 x 220 matrix of Day Name and four long measures had
        // a horizontal scrollbar and showed three of seven days): the fit had chosen a smaller text and counted the rows
        // at it, but only a table was given that size, so the matrix drew at the theme's. A matrix gets it on its values,
        // headers, row headers and total.
        if (s.kind === 'matrix' && tableText) visual.objects = Object.assign(visual.objects || {}, { values: obj({ fontSize: num(tableText) }), columnHeaders: obj({ fontSize: num(tableText) }), rowHeaders: obj({ fontSize: num(tableText) }), total: obj({ fontSize: num(tableText) }) });
        // each column's header sits over its own values: text on the reading-start side, numbers (measures, and columns
        // the model types as numbers) right-aligned in both directions; "Apply to header" (styleHeader) makes the header
        // follow. (Round 12, #12; seen in Desktop 2.158, 5 Oct 2026: in a right-to-left table with left-aligned numbers,
        // "Friday", right-aligned at the left end, and its first number were 9 apart and read as one text, while 430
        // separated the two measures. Right-aligned, a number ends at its column's far edge, as in English.)
        // (round 23: the row-label measure, text, right-aligned as the name column it stands for)
        const rowLabel = s.kind === 'table' && query ? rowLabelOf(tableFields(Bt, rtl), rtl) : null;
        // (part 5: its DAX names this table's numbers, so a second table by the same column with other numbers gets a
        // label of its own, "(2)"; the same numbers share one)
        const rlExpr = rowLabel ? rowLabelDax(rowLabel, lang === 'ar' ? 'الإجمالي' : 'Total', query.queryState.Values.projections.filter((p) => (p.field.Measure && !p.field.Measure.Expression.SourceRef.Schema) || (p.field.Aggregation && p.displayName !== ' '))) : null;
        let rlName = rowLabel ? freeExt(rowLabel.t, ROW_LABEL + shown(rowLabel.c)) : null;
        if (rowLabel) { const same = (n) => rowLabels.find((x) => x.t === rowLabel.t && x.m === n); for (let k = 2; same(rlName) && same(rlName).expression !== rlExpr; k++) rlName = freeExt(rowLabel.t, ROW_LABEL + shown(rowLabel.c) + ' (' + k + ')'); }
        if (rowLabel && rlName !== ROW_LABEL + shown(rowLabel.c)) { const ps0 = query.queryState.Values.projections, lp = ps0[ps0.length - 1]; lp.field.Measure.Property = rlName; lp.queryRef = rowLabel.t + '.' + rlName; lp.nativeQueryRef = rlName; }
        if (s.kind === 'table' && query) visual.objects.columnFormatting = tableFields(Bt, rtl).map((f) => ({
          properties: { alignment: str(isValue(f) || f.num ? 'Right' : (rtl ? 'Right' : 'Left')), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) },
          selector: { metadata: proj(f).queryRef } })).concat(rowLabel ? [{ properties: { alignment: str('Right'), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) }, selector: { metadata: rowLabel.t + '.' + rlName } }] : []);
        // Round 12 (#23, #32; seen in Desktop 2.158, round 11: six of seven days and a scrollbar): a table whose rows are
        // known (a day, month or quarter name: 7, 12 or 4 rows, a header and a total) gets its rows tighter where they
        // would not fit (grid.rowPadding 0); one that still does not fit is told. Measured (round 11): a row's pitch is
        // 1.415 x the text's height + 2 x rowPadding (1 when none is written), the header 7 more; the title 1.5 x its
        // size; 16 for the visual's own padding.
        if ((s.kind === 'table' || s.kind === 'matrix') && query) {   // (a matrix too: round 16, #15)
          const tf = tableFields(Bt, rtl).find(isTextField), n = ((tf && catKind(tf)) || {}).rows || 0;   // (A3-7: the picker's count, else the kind's)
          if (n) {
            let T = tableText || +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
            const need = (pad, t = T) => tableHeight(n, t, TITLE, pad);   // (writer round 8: the one rule, pbip-sizing.js TABLE_ROWS)
            // Round 18 (FAIL 12: a 420 x 220 matrix at 1920 x 1080 showed three of seven days): a matrix whose rows do not
            // fit even tight takes the largest smaller text, down to Power BI's 8pt, that holds them (and told,
            // tableSmaller); only where even 8pt does not is it told that its last rows scroll (tableRows)
            // (round 19, item 10: a table too, with the same limits; its header keeps its grow-to-fit, the size is merged in)
            if (need(0) > s.h) {
              let t2 = Math.ceil(T) - 1; while (t2 > 8 && need(0, t2) > s.h) t2--;
              if (t2 >= 8 && need(0, t2) <= s.h) { const from = T; T = t2; (s.kind === 'matrix' ? ['values', 'columnHeaders', 'rowHeaders', 'total'] : ['values', 'columnHeaders', 'total']).forEach((k) => { visual.objects = visual.objects || {}; const e = (visual.objects[k] || [])[0]; if (e && e.properties) e.properties.fontSize = num(t2); else visual.objects[k] = obj({ fontSize: num(t2) }); });
                if (smallEntry) Object.assign(smallEntry, { size: t2, rows: true }); else tableSmaller.push({ page: pg.name || base, size: t2, from, rows: true }); }
            }
            if (need(1) > s.h) { visual.objects = visual.objects || {}; visual.objects.grid = [{ properties: Object.assign(((visual.objects.grid || [])[0] || {}).properties || {}, { rowPadding: num(0) }) }]; if (need(0) > s.h) tableRows.push({ page: pg.name || base, field: label(tf), rows: n, need: Math.ceil(need(0)), h: s.h }); }
          }
        }
        // the calendar order's helper column (see inOrder): its text in the card colour and as narrow as Desktop allows
        const oh = (s.kind === 'table' || s.kind === 'matrix') && query ? orderedBy(s.kind === 'matrix' ? (Bt.table || []).filter(Boolean) : tableFields(Bt, rtl)) : null;
        if (oh && oh.sortBy && s.kind === 'matrix') { visual.objects = visual.objects || {}; visual.objects.columnFormatting = visual.objects.columnFormatting || []; }
        if (oh && oh.sortBy) { const helperRef = orderHelper(oh).queryRef;
          visual.objects.columnFormatting.push({ properties: { fontColor: color(u.card), alignment: str('Right'), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) }, selector: { metadata: helperRef } });
          (visual.objects.columnWidth = visual.objects.columnWidth || []).push({ properties: { value: num(1) }, selector: { metadata: helperRef } });
          tableOrder.push({ page: pg.name || base, field: oh.t + '[' + oh.c + ']', by: oh.sortBy.t + '[' + oh.sortBy.c + ']' }); }
        // round 23: the name column at width 0 (hidden; the automatic widths stay on), its measure into the extensions
        if (rowLabel) {
          (visual.objects.columnWidth = visual.objects.columnWidth || []).push({ properties: { value: num(0) }, selector: { metadata: proj(rowLabel).queryRef } });
          const m = rlName;
          if (!rowLabels.some((x) => x.t === rowLabel.t && x.m === m)) rowLabels.push({ page: pg.name || base, t: rowLabel.t, c: rowLabel.c, m, expression: rlExpr });
        } else if (s.kind === 'table' && query && rtl) {
          const tf = tableFields(Bt, rtl), f = tf.find(isTextField);
          if (f && tf.some(isValue) && !rowLabelSkipped.some((x) => x.t === f.t && x.c === f.c)) rowLabelSkipped.push({ page: pg.name || base, t: f.t, c: f.c });
        }
        // SVG columns (experimental; measured in Desktop 2.158, D-P1, 2026-10-04): report-level measures of
        // reportExtensions.json, shown as the last columns of the page's first table (the reading end: on a
        // right-to-left page that is the left, where the table's first projection sits)
        // Round 10 (measured in Desktop 2.158, third sitting of 2026-10-04): a picture is never the first projection.
        // Power BI writes the total row's "Total" in the first projection's column, and only when that is a column of
        // text, so in a right-to-left table with pictures the text column comes first, then the pictures, then the
        // measures. The picture's size is the table's grid.imageHeight and imageWidth (75 x 75 by default, which made
        // a 160 x 24 bar 11 tall in a row 77 tall): the tallest and the widest design, within Power BI's 8 to 512.
        if ((s.kind === 'table' || s.kind === 'matrix') && query && !svgDone[pageIndex]) {
          const mine = (o.svgColumns || []).filter((c) => c.page === pageIndex);
          const cols = mine.map((c) => ({ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: c.t } }, Property: c.m } }, queryRef: c.t + '.' + c.m, nativeQueryRef: c.m }));
          if (cols.length) {
            const ps = query.queryState.Values.projections;
            // (round 14: a right-to-left table ends with its text column, so the pictures, the reading end, go at the
            // left, after the order's helper column where there is one)
            // (round 23: and after the hidden name column, which stays first)
            if (rtl && s.kind === 'table') { let lead = rowLabel ? 1 : 0; if (ps.length > lead && /^Min\(/.test(ps[lead].queryRef) && ps[lead].displayName === ' ') lead++; query.queryState.Values.projections = ps.slice(0, lead).concat(cols.slice().reverse(), ps.slice(lead)); }
            else query.queryState.Values.projections = ps.concat(cols);
            // The pictures never push the table past its box (Desktop showed a scrollbar and a cut header with three
            // fields and pictures of 160 and 180 in a 553-wide table, 5 Oct 2026): every other column keeps its room
            // (columnRoom) and the pictures share what is left, each with + 10 like a column; their width is capped by
            // that, 8 at least, and the height follows the designs' ratio. With room, the designs' own size is kept.
            const wide = Math.max(...mine.map((c) => +c.w || 0)) || 75, tt = +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
            // (rc1, S1/S2: a table's other columns take the room its fit and its column widths give them, cellRoom at the
            // table's own text, within its width less 36; the pictures had kept the earlier rule and could push it past)
            const tsc = s.kind === 'table' ? pg.page.h / 1080 : null, fOf = (p) => ((Bt || {}).table || []).filter(Boolean).find((f) => proj(f).queryRef === p.queryRef);
            const others = query.queryState.Values.projections.filter((p) => !(p.field.Measure && p.field.Measure.Expression.SourceRef.Schema) && p.displayName !== ' ').reduce((a, p) => a + (tsc && fOf(p) ? cellRoom(fOf(p), tableText || tt, font, tsc) : columnRoom(p, tt, font)), 0);
            const W = Math.max(8, Math.min(512, wide, Math.floor(((tsc ? s.w - 36 : s.w) - others) / cols.length) - 10));
            const H0 = Math.max(8, Math.min(512, Math.round(Math.max(...mine.map((c) => (+c.h || 75) * Math.min(1, W / (+c.w || 75)))))));
            // Round 18 (measured in Desktop 2.158, 6 Oct 2026, "P4 ring EN": a 64-high picture in a 221-high table at
            // 1280 x 720: the rows 66 apart (the picture + 2), the first 68 under the table's top; one and a half rows
            // showed): a table picture is no taller than lets four rows and the total show, 24 at least.
            const H = Math.min(H0, Math.max(24, Math.floor((s.h - 68 * pg.page.h / 720) / 5) - 2));
            // (0.2.9, audit 3's seen B-23: into the table's one grid entry, which may hold the tight rows already)
            visual.objects = visual.objects || {}; visual.objects.grid = [{ properties: Object.assign(((visual.objects.grid || [])[0] || {}).properties || {}, { imageHeight: num(H), imageWidth: num(W) }) }];
            svgSizes[pageIndex] = { w: W, h: H, design: wide, capped: W < wide };
            // Round 18 (the owner's answer, 6 Oct 2026: "yes drop the number under 40"; a 28-high ring's number could not
            // be read in Desktop): a ring drawn under 40 high takes its version without the number inside (the server's
            // expressionNoNumber); the table's value column carries the number
            if (H < 40 && extFile) mine.forEach((c) => { if (!c.expressionNoNumber) return; const e = extFile.entities.find((x) => x.name === c.t), me = e && e.measures.find((x) => x.name === c.m); if (me) { me.expression = c.expressionNoNumber; extFile.changed = true; ringsSmall.push({ page: pg.name || base, label: c.m, h: H }); } });
            svgDone[pageIndex] = true;
          }
        }
        // rc1 (PERF-COMPARE S3, 6 models: the last row a table showed was cut in half by its total line): a table whose rows
        // don't all show ends on a whole row. Its height is the title, the header, the whole rows that fit and the total, by
        // the measured rule (pbip-sizing.js TABLE_ROWS, MEASURE-TABLE-ROWS.md); the top stays. Not a table with pictures (their rows are taller).
        // (writer round 8, with the design block's N6, 3453718, the reviewer's resolution: the PANEL keeps the slot's height, so
        // its bottom lines up with the row's other panels; the TABLE inside it ends on its whole rows, tableH, and the rest
        // of the panel stays under it. Not by row padding: a table's height that isn't whole rows shows a part row over its
        // total, whatever the padding, as Desktop pins the total to the bottom.)
        if (s.kind === 'table' && visual && visual.query) {
          const gp = (((visual.objects || {}).grid || [])[0] || {}).properties || {}, padOf = gp.rowPadding ? +String(gp.rowPadding.expr.Literal.Value).replace(/D$/, '') : 1;
          const tv = (((visual.objects || {}).values || [])[0] || {}).properties || {}, t = tv.fontSize ? +String(tv.fontSize.expr.Literal.Value).replace(/D$/, '') : (+((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10);
          const tf = tableFields(Bt, rtl).find(isTextField), n = ((tf && catKind(tf)) || {}).rows || 0;
          // (writer round 8: the one rule, pbip-sizing.js TABLE_ROWS, with the laptop's measure)
          const hp = (((visual.objects || {}).columnHeaders || [])[0] || {}).properties || {}, ht = hp.fontSize ? +String(hp.fontSize.expr.Literal.Value).replace(/D$/, '') : t;
          const pitch = rowPitch(t, padOf), fixed = tableHeight(0, t, TITLE, padOf, ht), k0 = Math.floor((box.h - fixed) / pitch);
          if (!gp.imageHeight && k0 >= 1 && !(n && n <= k0)) { const h1 = Math.ceil(fixed + k0 * pitch); if (h1 < box.h) tableH = h1; }
        }
        if (B && visual && visual.query) vFilters = fixVisual(visual, s, pg, Bt, tableText);
      }
      // Round 19 (the owner's idea, 6 Oct 2026): "No data for this selection" where the visual's measure is blank. A
      // report-level measure (reportExtensions.json, the model untouched) gives the text only when the measure is blank,
      // and "" otherwise; a card shows it in the same box one layer below (a lower z), with the panel's look (the theme's
      // card style), its tooltip off and not on the phone; the visual above it is see-through, so the card's panel is
      // what shows, and its message only when the visual is empty. Charts and tables with a measure of the model.
      if (NODATA && visual && visual.query && ['bar', 'column', 'line', 'donut', 'table'].includes(s.kind)) {
        const st = visual.query.queryState, pr = [].concat((st.Y || {}).projections || [], (st.Values || {}).projections || []).find((p) => p.field && p.field.Measure && !p.field.Measure.Expression.SourceRef.Schema);
        // (round 22b, the outside review's X-05: the measure's DAX names the field, so none for a name with a control
        // character; told in the notes)
        if (pr && (hasControl(pr.field.Measure.Expression.SourceRef.Entity) || hasControl(pr.field.Measure.Property))) {
          const sk = { page: pg.name || base, t: pr.field.Measure.Expression.SourceRef.Entity, m: pr.field.Measure.Property };
          if (!noDataSkipped.some((x) => x.t === sk.t && x.m === sk.m)) noDataSkipped.push(sk);
        } else if (pr) {
          // (A3-11: two measures whose names differ only by a format character get a name each, "(2)")
          const ent = pr.field.Measure.Expression.SourceRef.Entity, mm = pr.field.Measure.Property, expression = 'IF ( ISBLANK ( ' + daxNames.column(ent, mm) + ' ), ' + daxNames.string(lang === 'ar' ? 'لا توجد بيانات لهذا الاختيار' : 'No data for this selection') + ', "" )';
          const want = (W.noDataName || 'No data: ') + shown(mm), other = (n) => noData.some((x) => x.t === ent && x.m === n && x.expression !== expression);
          let nm = freeExt(ent, want); for (let k = 2; other(nm); k++) nm = freeExt(ent, want + ' (' + k + ')');
          if (!noData.some((x) => x.t === ent && x.m === nm)) noData.push({ t: ent, m: nm, expression });
          container({ x: s.x, y: box.y, w: s.w, h: box.h, z: z - 500, parent, kind: 'nodata', noPhone: true, visual: { visualType: 'cardVisual',
            query: q({ Data: [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: ent } }, Property: nm } }, queryRef: ent + '.' + nm, nativeQueryRef: nm }] }),
            objects: { value: [{ properties: { fontSize: num(LABEL), fontColor: color(mixHex(u.text, u.card, 0.3)), horizontalAlignment: str('center') }, selector: { id: 'default' } }], label: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], outline: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], fillCustom: [{ properties: { show: bool(false) } }] },
            visualContainerObjects: { title: obj({ show: bool(false) }), visualTooltip: obj({ show: bool(false) }), general: obj({ altText: str('') }), dropShadow: obj({ show: bool(!!tableH) }) } } });   /* (writer round 9: behind a table on its whole rows the card is the panel, with the panel's shadow) */
          // Night sitting 6-7 Oct (seen in Desktop 2.158): the card's own inner outline drew a grey box inside every chart,
          // and a chart whose border and shadow were switched off drew about 5 nearer its box's edges than without the
          // option. So the card has no outline, its text centred, and no shadow of its own; the chart keeps the theme's
          // border and shadow and only its background is off (with data the page then differs from one without the option
          // by the panels' edge pixels only, at most 19 of 255).
          visual.visualContainerObjects.background = obj({ show: bool(false) });
          // (writer round 9, the laptop's local resolution, S3 FIXED in Desktop on rc.4: the table on its rows inside the card's panel
          // has its own shadow off, so the shadow is the panel's)
          if (tableH) visual.visualContainerObjects.dropShadow = obj({ show: bool(false) });
        }
      }
      // (S3 + N6) a table shorter than its slot: the panel at the slot's height behind it, the "No data" card where the
      // report has one (above, at the slot's box), else an empty text box, which the theme draws as a panel (measured,
      // round 1), on a solid theme; a transparent theme's panel is the page's background picture. The table keeps its
      // background and border (the panel's colour; night of 6-7 Oct: with its border off a visual drew about 5 nearer its
      // edges, and the measured rows would not hold); its shadow is off, the panel's is the one drawn (writer round 9: the
      // laptop's local resolution, S3 FIXED in Desktop on rc.4 with the table's shadow off).
      if (tableH) {
        const ndBehind = NODATA && visual.visualContainerObjects && visual.visualContainerObjects.background && visual.visualContainerObjects.background[0].properties.show && visual.visualContainerObjects.background[0].properties.show.expr.Literal.Value === 'false';
        if (SOLID) visual.visualContainerObjects.dropShadow = obj({ show: bool(false) });   // (writer round 9: the shadow is the panel's, as behind a "No data" card)
        if (SOLID && !ndBehind) container({ x: s.x, y: box.y, w: s.w, h: box.h, z: z - 500, parent, kind: 'panel', noPhone: true,   /* (written as the header's and the rail's bands: nothing but the title's switch, the theme draws it) */
          visual: { visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: '' }] }] }) }, visualContainerObjects: { title: obj({ show: bool(false) }) } } });
      }
      const v = container({ x: s.x, y: box.y, w: s.w, h: tableH || box.h, z, parent, visual, kind: s.kind });
      if (vFilters && vFilters.length) v.filterConfig = { filters: vFilters };
      if (CHARTS.includes(s.kind)) charts.push({ v, hov });
      z += 1000;
      // the page navigator follows the title in the reading order; its text size is set for the default, hover and
      // selected states (the current page's button is the selected one, and would otherwise show Power BI's own size)
      if (s.kind === 'title' && tabs) {
        const total = tabs.rows.length * tabs.rowH, y0 = title.y + (title.h - total) / 2, accent = u.accent || u.text;
        // the mark keeps the accent colour only where it can be read on the card (3:1 for bold text and a line)
        const mark = contrast(accent, u.card) >= 3 ? accent : u.text, muted = mixHex(u.text, u.card, 0.3);
        // (round 12, #6; seen in Desktop 2.158, round 11: two rows both ending at the logo's side did not line up):
        // the rows share one block, as wide as the widest row, at the logo's side; every row starts at its reading start
        const rowW = (row) => row.reduce((a, i) => a + tabs.ws[i], 0) + tabs.gapB * (row.length - 1), maxW = Math.max(...tabs.rows.map(rowW));
        if (tabs.rows.length > 1 && !tabRows.some((x) => x.page === (pg.name || base))) tabRows.push({ page: pg.name || base, rows: tabs.rows.length, size: tabs.t });
        tabs.rows.forEach((row, r) => {
          // the block sits at the logo's side of the room; in it the first page is at the reading start: leftmost in
          // English, rightmost in Arabic
          const left = tabs.toLogo === 'right' ? tabs.a1 - maxW : tabs.a0;
          let x = rtl ? left + maxW : left;
          row.forEach((i) => {
            const p = PAGES[i], bw = tabs.ws[i], bx = Math.round(rtl ? x - bw : x), current = i === pageIndex, name = String(p.name || base), by = Math.round(y0 + r * tabs.rowH), bh = tabs.rowH - tabs.lineH;
            const tabBtn = container({ x: bx, y: by, w: bw, h: bh, z, parent: groups.header.name, kind: 'navbtn',
              visual: { visualType: 'actionButton',
                objects: { icon: def({ shapeType: str('blank') }),
                  text: def({ show: bool(true), text: str(name), fontColor: color(current ? mark : muted), fontFamily: str(font), fontSize: num(tabs.t), bold: bool(current) }).concat(current ? [] : [{ properties: { fontColor: color(mark) }, selector: { id: 'hover' } }]),
                  fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
                visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
            z += 1000;
            if (current) {
              container({ x: Math.round(bx + 4 * k), y: by + bh, w: Math.max(4, Math.round(bw - 8 * k)), h: tabs.lineH, z, parent: groups.header.name, kind: 'navline', of: tabBtn.name,
                visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: str('rectangle') } }], fill: def({ show: bool(true), fillColor: color(mark), transparency: num(0) }), outline: def({ show: bool(false) }) },
                  visualContainerObjects: frame(null, '') } });
              z += 1000;
            }
            x = rtl ? x - bw - tabs.gapB : x + bw + tabs.gapB;
          });
        });
      } else if (s.kind === 'title' && nav && nav.buttons) {
        // one button per page, in the navigator's box, first page at the right; the current page's filled in the text
        // colour with bold text in the card colour, the others outlined (the navigator's own look)
        const n = PAGES.length, gap = 8 * k, bw = (nav.w - gap * (n - 1)) / n;
        PAGES.forEach((p, i) => {
          const current = i === pageIndex, name = String(p.name || base);
          container({ x: Math.round(nav.x + nav.w - (i + 1) * bw - i * gap), y: nav.y, w: Math.round(bw), h: nav.h, z, parent: groups.header.name, kind: 'navbtn',
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(name), fontColor: color(current ? u.card : u.text), fontFamily: str(font), fontSize: num(nav.t), bold: bool(current) }),
                fill: def({ show: bool(true), fillColor: color(current ? u.text : u.card), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(u.text) }) },
              visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
          z += 1000;
        });
      } else if (s.kind === 'title' && nav) {
        container({ x: Math.round(nav.x), y: nav.y, w: Math.round(nav.w), h: nav.h, z, parent: groups.header.name, kind: 'nav',
          visual: { visualType: 'pageNavigator', objects: { text: ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(nav.t) }, selector: { id } })) }, visualContainerObjects: frame(null, W.pages || 'Pages') } });
        z += 1000;
      }
      if (s.kind === 'title' && openBtn) {
        pg.openBm = rnd(); pg.closeBm = rnd();
        container({ x: openBtn.x, y: openBtn.y, w: openBtn.w, h: openBtn.h, z, parent: groups.header.name, kind: 'button', noPhone: true,
          visual: { visualType: 'actionButton',
            objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(openBtn.text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
              // (round 16, design finding #23: it was the only boxed control in a header of boxless tabs: no box, no outline;
              // the icon and the word in the text colour, as the tabs)
              fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
            visualContainerObjects: Object.assign(frame(null, W.openFilters || 'Open the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.openBm) }) }) } });
        z += 1000;
      }
    });

    // slide-in filter panel: one hidden group over the page (card, slicers, Reset, Close); two display-only
    // bookmarks show and hide it, so the user's slicer selections stay when it opens and closes
    if (panel && pg.openBm) {
      // (sizes from 1920 x 1080 scaled by k; Close and Reset as big as their text needs, slicers the height a dropdown needs)
      const P = panel, gname = rnd(), kids = [], pad = 16 * k, gap = 10 * k, sw = P.w - 2 * pad;
      // Close is as high as a button's text needs (Arabic: 6 + 1.6 x pt), and the panel's header holds it above the slicers
      const ch = Math.ceil(Math.max(32 * k, 6 + 1.6 * LABEL)), head = Math.max(44 * k, 12 * k + ch);
      const resetText = W.reset || 'Reset filters', closeText = '✕  ' + (W.close || 'Close');
      const rw = resetW(resetText, k, Math.round(sw)), reset = resetFit(resetText, rw, k), bh = reset.h;
      // (round 12, round 9's seen-not-in-scope: on a user's own model a slicer the model has no column for is left out
      // of the panel and told, as in the rail; the panel wrote all three before, the extra ones without a field)
      const all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), fields = B && own ? all3.filter(Boolean) : all3;
      all3.forEach((f, i) => { if (B && own && !f) leftOut.push({ page: pg.name || base, kind: 'slicer', title: (W.slicer || 'Slicer') + ' ' + (i + 1) }); });
      z = Math.max(z, 900000);
      container({ name: gname, x: P.x, y: P.y, w: P.w, h: P.h, z, hidden: true, kind: 'group', groupKey: 'panel', group: { displayName: W.filterPanel || 'Filter panel', groupMode: 'ScaleMode' } });
      z += 1000;
      const add1 = (spec) => { const v = container(Object.assign({ parent: gname, z, noPhone: true }, spec)); kids.push(v.name); z += 1000; return v; };
      // the card: an empty text box with the container background, border and shadow
      add1({ x: P.x, y: P.y, w: P.w, h: P.h, kind: 'text', visual: { visualType: 'textbox', objects: textbox(W.filters || 'Filters', pt(14 * k), true, u.text),
        visualContainerObjects: Object.assign(frame(null, W.filterPanel || 'Filter panel'), {
          background: obj({ show: bool(true), color: color(u.card), transparency: num(0) }),
          border: obj({ show: bool(true), color: color(edge), radius: num(Math.round(12 * k)) }),
          dropShadow: obj({ show: bool(true) }),
          padding: obj({ top: num(Math.round(14 * k)), left: num(Math.round(16 * k)), right: num(Math.round(16 * k)), bottom: num(Math.round(12 * k)) }) }) } });
      // Close, in the panel's top corner at the end of the reading line
      const cw = Math.round(Math.max(96 * k, charW(LABEL) * closeText.length + 16 * k));
      const cx = Math.round(rtl ? P.x + pad : P.x + P.w - pad - cw);
      add1({ x: cx, y: Math.round(P.y + 10 * k), w: cw, h: ch, kind: 'button', visual: { visualType: 'actionButton',
        objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(closeText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }), fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
        visualContainerObjects: Object.assign(frame(null, W.closeFilters || 'Close the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: str(pg.closeBm) }) }) } });
      // slicers stacked, then Reset at the bottom
      const sh = Math.max(slicerH(SLICER_TEXT), Math.min(76 * k, (P.h - head - pad - bh - gap * (fields.length + 1)) / Math.max(1, fields.length))), names = [];
      fields.forEach((f, i) => {
        const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
        const v = add1({ x: Math.round(P.x + pad), y: Math.round(P.y + head + 8 * k + i * (sh + gap)), w: Math.round(sw), h: Math.round(sh), kind: 'slicer',
          visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
            objects: { data: obj({ mode: str('Dropdown') }), header: slicerHeader(f, Math.round(sw)) },
            visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true } });
        names.push(v.name);
      });
      const rb = rnd();
      add1({ x: Math.round(rtl ? P.x + pad + sw - rw : P.x + pad), y: Math.round(P.y + P.h - pad - bh), w: rw, h: bh, kind: 'button', visual: { visualType: 'actionButton',
        objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
          fill: resetFill(), outline: def({ show: bool(false) }) },
        visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: str(rb) }) }) } });
      bookmarks.push({ name: rb, page: pageName, targets: names, label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pg.name || '') : '') });
      const suffix = PAGES.length > 1 ? ' · ' + (pg.name || '') : '';
      bookmarks.push({ name: pg.openBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: false, label: (W.filtersOpen || 'Filters open') + suffix });
      bookmarks.push({ name: pg.closeBm, page: pageName, targets: [gname].concat(kids), group: gname, hidden: true, label: (W.filtersClosed || 'Filters closed') + suffix });
    }

    // every chart shows the tooltip page when you hover it: type 'Canvas' is Power BI's name for a report page tooltip
    // ('ReportPage' is not a value: Desktop then shows its default tooltip; measured in Desktop 2.158)
    // (the laptop's second sweep of rc.1, T4 and T5) each chart opens the tooltip page of its own measure: by month (the
    // trend) when the chart is not by the month itself; otherwise by a category other than the chart's own, the picker's
    // tooltip category first, then the report's other chart categories; with none, Power BI's own tooltip
    const tipSection = (h) => {
      if (!tip) return tipName;
      const m = (h && h.m) || tip.card, cat = h && h.cat;
      if (trend && !same(cat, tip.date)) return tipFor('trend', m, tip.date).name;
      const other = [tip.cat].concat(Object.values(B.cats || {}), B.catPool || []).find((f) => f && f.c != null && f.agg == null && !same(f, cat) && !same(f, tip.date));
      return other ? tipFor('cat', m, other).name : null;
    };
    charts.forEach((c) => { const sec = tipSection(c.hov); if (sec) c.v.visual.visualContainerObjects.visualTooltip = obj({ show: bool(true), type: str('Canvas'), section: str(sec) }); });

    // phone layout: Power BI's phone canvas is 323 points wide. Cards go two per row (158 x 100), charts and
    // tables full width, slicers and buttons as short full-width rows, in the reading order of the page.
    const PW = 323, GAP = 8, SIZE = { title: 56, nav: 44, logo: 56, kpi: 100, card: 100, slicer: 64, button: 40, text: 120, table: 270, gauge: 180, donut: 220, map: 220, treemap: 220 };
    const pos = {}, bottom = {};
    let y = 0, col = 0;
    const navBtns = mob.filter((m) => m.kind === 'navbtn');
    const place = (m) => {
      const k = m.kind, half = k === 'kpi' || k === 'card';
      const h = SIZE[k] || 190;
      if (k === 'navbtn') {
        // the page buttons: rows of the 323-wide canvas, each button at least as wide as its name needs at the phone's
        // text size (so two pages share one row, and many pages wrap instead of being cut), the rest of a row shared
        // equally; the first page at the reading start
        const i = navBtns.indexOf(m);
        if (i === 0) {
          if (col) { y += 100 + GAP; col = 0; }
          const need = navBtns.map((b) => Math.min(PW, Math.ceil(textWidth(String(b.v.visual.objects.text[1].properties.text.expr.Literal.Value).slice(1, -1), 10, true, font) + 10)));
          let row = [], used = 0; const rows = [row];
          need.forEach((w, j) => { const add = (row.length ? GAP : 0) + w; if (row.length && used + add > PW) { row = [j]; rows.push(row); used = w; } else { row.push(j); used += add; } });
          // (round 12, #2; seen in Desktop 2.158, round 11: names centred in stretched buttons looked scattered): each
          // button as wide as its name, from the reading start, a fixed gap between them
          rows.forEach((r) => { let x = 0;
            r.forEach((j) => { const w = need[j]; pos[navBtns[j].v.name] = { x: rtl ? PW - x - w : x, y, w, h: SIZE.nav }; x += w + GAP; });
            y += SIZE.nav + GAP; });
        }
        return;
      }
      if (half) {
        const x = col ? PW - 157.5 : 0; pos[m.v.name] = { x: rtl ? PW - 157.5 - x : x, y, w: 157.5, h };
        if (col) { y += h + GAP; col = 0; } else col = 1;
      } else {
        if (col) { y += 100 + GAP; col = 0; }
        pos[m.v.name] = { x: 0, y, w: PW, h }; y += h + GAP;
      }
    };
    const order = ['header', 'filters', 'kpis', null];
    order.forEach((g) => mob.filter((m) => m.kind !== 'group' && !m.noPhone && m.kind !== 'navline' && (g ? m.parent === (groups[g] || {}).name : !m.parent) && m.kind !== 'logo').forEach(place));
    // #5 (round 12; seen in Desktop 2.158, round 11: on the phone the current page was only bold): the line under the
    // current tab on the phone too, 2 high, right under its button (in the gap before the next row)
    mob.filter((m) => m.kind === 'navline' && m.of && pos[m.of]).forEach((m) => { const b = pos[m.of]; pos[m.v.name] = { x: b.x + 4, y: b.y + b.h, w: Math.max(4, b.w - 8), h: 2 }; });
    if (col) { y += 100 + GAP; col = 0; }
    // groups wrap their children on the phone as well; the children keep their page positions: in mobile.json Power BI
    // Desktop reads a grouped visual's position as a page position, not relative to its group as in visual.json
    Object.keys(groups).forEach((g) => {
      const kids = mob.filter((m) => m.parent === groups[g].name && pos[m.v.name]);
      if (!kids.length) return;
      const x0 = Math.min(...kids.map((m) => pos[m.v.name].x)), y0 = Math.min(...kids.map((m) => pos[m.v.name].y));
      const x1 = Math.max(...kids.map((m) => pos[m.v.name].x + pos[m.v.name].w)), y1 = Math.max(...kids.map((m) => pos[m.v.name].y + pos[m.v.name].h));
      pos[groups[g].name] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    });
    // Text on the phone. The page's text sizes are made for the page: on the 323-wide phone canvas they are cut (15pt
    // slicers on 1080, everything on 2160), so each visual gets its own sizes in mobile.json, the same on every page
    // size. A size there is used only when it is written with the selector that property needs on the page (measured
    // in Desktop 2.158, DESKTOP-TESTS.md round 1): none for a text box's paragraph, a slicer's header and items, a
    // container title, a chart's axes, a table's text and the card's container padding (under "default" Desktop
    // ignores it and the page's padding, with its accent-bar side, stays); "default" for a button's text; each state
    // for page buttons. Not covered (not measured): data labels, legends and the text inside donut, funnel, treemap,
    // map and gauge.
    const PHONE = { title: 14, nav: 10, slicer: 10, button: 10, heading: 12, axis: 8, table: 8 };
    const kindOf = {}; mob.forEach((m) => { kindOf[m.v.name] = m.kind; });
    const phoneLook = (v, p) => {
      const vis = v.visual, t = vis.visualType, objects = {}, vco = {};
      const ttl = (vis.visualContainerObjects || {}).title, shown = !!(ttl && ttl[0].properties.show && ttl[0].properties.show.expr.Literal.Value === 'true');
      if (t === 'cardVisual') {
        // a card on the phone (157.5 x 100) gets its own sizes, as on the small tooltip page: the page's 42 would not fit
        // Round 12 (#1; seen in Desktop 2.158, round 11: "Total Sales Last Rama..." on every phone page): a title too
        // long for one line at 10pt wraps to two (titleWrap, as on the page) where two lines and the value fit the card,
        // otherwise it is shortened at a word with "…"; the phone shows the full name where the page shortened it.
        let c = cardFit(p.w, p.h, 1, TIP_TITLE, TIP_VALUE);
        const tl = { fontSize: num(TIP_TITLE), fontColor: color(u.text) }, full = S0(((vis.visualContainerObjects || {}).general || [{ properties: {} }])[0].properties.altText), room = p.w - 2 * c.P;
        if (shown && full && textWidth(full, TIP_TITLE, true, font) > room) {
          const ls = wrapLines(full, TIP_TITLE, room), two = cardFit(p.w, p.h, 1, TIP_TITLE, TIP_VALUE, null, undefined, 2);
          if (ls.length <= 2 && ls.every((l) => textWidth(l, TIP_TITLE, true, font) <= room) && two.V >= 8) { c = two; Object.assign(tl, { text: str(full), titleWrap: bool(true) }); }
          else tl.text = str(oneLine(full, TIP_TITLE, room));
        }
        return { objects: { value: obj({ fontSize: num(c.V) }, DEF), padding: obj({ paddingUniform: num(c.I) }, DEF) },
          visualContainerObjects: { title: obj(tl), padding: obj({ top: num(c.P), bottom: num(c.P), left: num(c.P), right: num(c.P) }) } };
      }
      // (round 12, #4; seen in Desktop 2.158, round 11: pale grey titles on the phone) the title in the text colour
      if (shown) vco.title = obj({ fontSize: num(PHONE.heading), fontColor: color(u.text) });
      if (t === 'textbox' && kindOf[v.name] === 'title') {
        // the header title: 14pt, or the largest size down to 8 whose one line fits the phone's width
        const para = vis.objects.general[0].properties.paragraphs[0], run = para.textRuns[0];
        const size = Math.max(8, Math.min(PHONE.title, Math.floor(p.w / (charW(1) * Math.max(1, String(run.value).length)))));
        objects.general = obj({ paragraphs: [Object.assign({}, para, { textRuns: [Object.assign({}, run, { textStyle: Object.assign({}, run.textStyle, { fontSize: size + 'pt' }) })] })] });
      } else if (t === 'pageNavigator') objects.text = ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(PHONE.nav) }, selector: { id } }));
      else if (t === 'slicer') { objects.header = obj({ textSize: num(PHONE.slicer) }); objects.items = obj({ textSize: num(PHONE.slicer) }); }
      else if (t === 'actionButton') objects.text = obj({ fontSize: num(PHONE.button) }, DEF);
      else if (t === 'lineChart' || t === 'clusteredBarChart' || t === 'clusteredColumnChart') { objects.categoryAxis = obj({ fontSize: num(PHONE.axis) }); objects.valueAxis = obj({ fontSize: num(PHONE.axis) }); }
      else if (t === 'tableEx') { objects.columnHeaders = obj({ fontSize: num(PHONE.table) }); objects.values = obj({ fontSize: num(PHONE.table) }); objects.total = obj({ fontSize: num(PHONE.table) });
        // Round 12 (#29; seen in Desktop 2.158, round 11: the phone table with pictures was wider than the canvas): the
        // pictures' size on the phone, capped by what the other columns leave of the 323 at the phone's 8pt (as on the
        // page, columnRoom), less the visual's padding (16)
        const g = vis.objects && vis.objects.grid && vis.objects.grid[0].properties;
        if (g && g.imageWidth) {
          // (round 23: the row-label measure is the name column, not a picture; the hidden name column takes no room)
          const ps = vis.query.queryState.Values.projections, hidden = (vis.objects.columnWidth || []).filter((e) => e.properties.value.expr.Literal.Value === '0D').map((e) => e.selector.metadata);
          const pics = ps.filter((x) => x.field.Measure && x.field.Measure.Expression.SourceRef.Schema && !rowLabels.some((r) => x.queryRef === r.t + '.' + r.m));
          const others = ps.filter((x) => !pics.includes(x) && !hidden.includes(x.queryRef)).reduce((a, x) => a + columnRoom(x, PHONE.table, font), 0);
          const w0 = parseFloat(g.imageWidth.expr.Literal.Value), h0 = parseFloat(g.imageHeight.expr.Literal.Value), w1 = Math.max(8, Math.min(w0, Math.floor((p.w - 16 - others) / Math.max(1, pics.length)) - 10));
          objects.grid = obj({ imageWidth: num(w1), imageHeight: num(Math.max(8, Math.round(h0 * w1 / w0))) });
        } }
      return Object.assign({}, Object.keys(objects).length ? { objects } : {}, Object.keys(vco).length ? { visualContainerObjects: vco } : {});
    };
    // Round 20 (golden task 7, the owner's (a), 7 Oct 2026: on the Arabic page of a model without measures three charts
    // were all titled "عدد Order Id"): charts of a page whose titles would be the same each get their grouping column
    // in brackets, "عدد Order Id (Region)", English and Arabic alike; a title that is already its own is not changed
    {
      const tOf = (v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0], x = t && t.properties && t.properties.text; return x && x.expr && x.expr.Literal ? String(x.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null; };
      // (round 22, the code review's e and h, and seen in Desktop on 7 Oct, "Total Sales by City (City)" twice: the
      // titles are compared in full, not as shortened; charts by the same column are left alone, a bracket would only
      // repeat itself; the new title is fitted like any title, and the alt text carries the same name)
      const same = {}, full = (v) => (fitted.get(v.visual) || {}).ttl || tOf(v), colOf = (v) => { const p = v.visual.query.queryState.Category.projections[0]; return shown(p.displayName || p.nativeQueryRef); };
      // (rc1: a chart cut to its top N keeps its "Top N: " before its title; the titles are compared without it, so two charts
      // that differ only by their N are still told apart by their column, and the new name keeps the prefix)
      const TOPPED = /^(Top|أعلى) \d+: /, core = (v) => full(v).replace(TOPPED, ''), prefix = (v) => (full(v).match(TOPPED) || [''])[0];
      visuals.filter((v) => v.visual && v.visual.query && v.visual.query.queryState.Category && tOf(v)).forEach((v) => { (same[core(v)] = same[core(v)] || []).push(v); });
      // (round 22b, the review of round 22, item 10: three charts and two columns, "عدد Order Id (Channel)" twice: charts
      // of the group by the same column too take a number after it in reading order, "(Channel 2)"; nothing else
      // tells them apart, as their measure and column are the same)
      const order = (a, b) => a.position.y - b.position.y || (rtl ? b.position.x - a.position.x : a.position.x - b.position.x);
      // the new title fitted like any title, the alt text the same name, the titles report following
      const rename = (v, k, name) => { const f = fitted.get(v.visual), tp = v.visual.visualContainerObjects.title[0].properties, g = (v.visual.visualContainerObjects.general || [])[0];
        const tf = f ? titleFit(name, TITLE, f.avail) : { mode: 'one', shown: name };
        if (f) f.final = name;
        tp.text = str(tf.shown); if (tf.mode !== 'one' && !tf.one) tp.titleWrap = bool(true); else delete tp.titleWrap;
        if (g && g.properties && g.properties.altText) g.properties.altText = str(name);
        // (the reviewer's third review, item 4: the entry this visual's title gave, not the first with the same title,
        // which may be another chart's)
        if (f) { ['wrapped', 'shortened'].forEach((m) => { const i = titles[m].indexOf(f.entry); if (i >= 0) titles[m].splice(i, 1); });
          f.entry = null; if (tf.mode !== 'one') titles[tf.mode].push(f.entry = { page: f.page, title: name, shown: tf.shown }); } };
      Object.keys(same).filter((k) => same[k].length > 1).forEach((k) => { const nth = {}, one = new Set(same[k].map(colOf)).size === 1; same[k].slice().sort(order).forEach((v) => { const c = colOf(v);
        // (the reviewer's second review, item 8: charts with the same measure and the same column kept the same title
        // and alt text: the second and later are numbered, "Total Sales by City (2)")
        if (one) { nth[''] = (nth[''] || 0) + 1; if (nth[''] > 1) rename(v, k, prefix(v) + k + ' (' + nth[''] + ')'); return; }
        // (never a script the title does not have already: round 14's rule keeps an Arabic title free of English names;
        // "عدد Order Id" holds Latin letters already, so "(Region)" may follow it)
        const lat = /[A-Za-z]/, adds = (x) => (AR_LETTERS.test(c) && !AR_LETTERS.test(x)) || (lat.test(c) && !lat.test(x));
        if (!c || adds(k)) return;
        nth[c] = (nth[c] || 0) + 1;
        rename(v, k, prefix(v) + k + ' (' + c + (nth[c] > 1 ? ' ' + nth[c] : '') + ')'); }); });
      // (design round 8, the re-score's N2 and N3: "Top 8:" stood over charts of 2, 4 or 6 bars, and a chart that left
      // categories out did not say how many there were) a chart cut to its Top N takes its title from a report-level
      // measure: "Top N of M: <title>" when more than N of its categories have a value under the page's filters (M counted
      // without the chart's own Top N, REMOVEFILTERS on its category column), its plain title otherwise. The tools never
      // read the data, so only the report can know. Each text is fitted as the title is, "M" taken as 999. (_n > N is written
      // MIN ( _n, N + 1 ) = N + 1: no comparison sign in the DAX, which round 9's names check keeps to names and strings)
      visuals.forEach((v) => { const f = v.visual && fitted.get(v.visual); if (!f || !f.top || !f.top.cat || f.top.cat.c == null) return;
        const y = daxOf(f.top.y); if (!y) return;
        const word = lang === 'ar' ? ['أعلى ', ' من '] : ['Top ', ' of '], core = (f.final || f.ttl).replace(TOPPED, ''), lead = word[0] + f.top.n + word[1];
        const plain = titleFit(core, TITLE, f.avail), long = titleFit(lead + '999: ' + core, TITLE, f.avail), rest = long.shown.indexOf(lead + '999: ') === 0 ? long.shown.slice((lead + '999: ').length) : null;
        if (rest == null) return;
        // (a name with a control character has no DAX: daxNames refuses it, and the chart keeps its text title)
        let col, expression; try { col = daxNames.column(f.top.cat.t, f.top.cat.c);
        expression = 'VAR _n = CALCULATE ( COUNTROWS ( FILTER ( VALUES ( ' + col + ' ), NOT ISBLANK ( ' + col + ' ) && NOT ISBLANK ( ' + y + ' ) ) ), REMOVEFILTERS ( ' + col + ' ) ) RETURN IF ( MIN ( _n, ' + (f.top.n + 1) + ' ) = ' + (f.top.n + 1) + ', ' + daxNames.string(lead) + ' & _n & ' + daxNames.string(': ' + rest) + ', ' + daxNames.string(plain.shown) + ' )'; } catch (e) { return; }
        const m = extMeasure(f.top.cat.t, 'Title: ' + core, expression, 'Text');
        const tp = v.visual.visualContainerObjects.title[0].properties, g = (v.visual.visualContainerObjects.general || [])[0];
        tp.text = { expr: extField(f.top.cat.t, m) };
        if (g && g.properties && g.properties.altText) g.properties.altText = str(core);   // (the alt text promises no cut either)
        // (the titles report tells the plain title's fit, the one shown when nothing is cut)
        ['wrapped', 'shortened'].forEach((md) => { const i = titles[md].indexOf(f.entry); if (i >= 0) titles[md].splice(i, 1); });
        f.entry = plain.mode !== 'one' ? { page: f.page, title: core, shown: plain.shown } : null; if (f.entry) titles[plain.mode].push(f.entry);
        if ((plain.mode !== 'one' && !plain.one) || (long.mode !== 'one' && !long.one)) tp.titleWrap = bool(true); else delete tp.titleWrap; });
    }
    // 0.2.9, audit 6's A6-12: what each written visual shows, in the page's order, for the caller's answer: its fields as
    // Table[Field] (a measure or a column) or Sum(Table[Field]) (a column the visual sums or counts), its roles in order; the
    // helpers are not fields (the Tooltips' sort, the hidden-header order column, the report's own measures: row labels,
    // pictures, "No data")
    const AGG_NAMES = { 0: 'Sum', 2: 'DistinctCount', 5: 'Count' };
    const fieldKey = (p) => { const f = p.field;
      if (f.Column) return f.Column.Expression.SourceRef.Entity + '[' + f.Column.Property + ']';
      if (f.Measure) return f.Measure.Expression.SourceRef.Schema ? null : f.Measure.Expression.SourceRef.Entity + '[' + f.Measure.Property + ']';
      if (f.Aggregation && p.displayName !== ' ') { const c = f.Aggregation.Expression.Column; return (AGG_NAMES[f.Aggregation.Function] || 'Agg') + '(' + c.Expression.SourceRef.Entity + '[' + c.Property + '])'; }
      return null; };
    bound.push({ page: pg.name || base, visuals: mob.filter((m) => m.v.visual && m.v.visual.query && m.kind !== 'nodata').map((m) => ({ kind: m.kind,
      fields: Object.keys(m.v.visual.query.queryState).filter((r) => r !== 'Tooltips').flatMap((r) => m.v.visual.query.queryState[r].projections.map(fieldKey)).filter(Boolean) })) });
    visuals.forEach((v) => { headed(v.visual);
      add(D + '/pages/' + pageName + '/visuals/' + v.name + '/visual.json', json(v));
      const p = pos[v.name];
      if (p) add(D + '/pages/' + pageName + '/visuals/' + v.name + '/mobile.json', json(Object.assign({ $schema: SCHEMA.mobile,
        position: { x: +p.x.toFixed(1), y: +p.y.toFixed(1), z: v.position.z, width: +p.w.toFixed(1), height: +p.h.toFixed(1), tabOrder: v.position.tabOrder } },
        v.visual ? phoneLook(v, p) : {})));
    });
  }

  // The tooltip pages (the card and the bar chart by category, and the trend by month); returns six, the trend kept to
  // its last 6 months
  function tooltips(c) {
    const {
      B, D, FULL, MIRROR, TIP_TITLE, TIP_VALUE, W, add, align, byMonthStart, cardCode, cardFit, cardFrame,
      cardObjects, frame, headed, lang, lastMonths, notBlank, sameField, textbox, tip, tipBinding, tipFor, tipName, tipPages, titleFit, topN, trend,
      u
    } = c;

    // tooltip page: small, hidden in view mode, shown when a chart is hovered. 320 x 284: the card, and a bar chart 184
    // high, which holds 6 rows (rc1: 187 and 287 by the measured rows, tipRows below; 284 stays for the empty page) (measured in Desktop 2.158: a bar row takes 22 and the title and padding 46; a tooltip
    // can't be scrolled, so rows past the last one would be lost behind a scrollbar)
    const tipPage = (name, binding, displayName, visuals, height, width) => {
      add(D + '/pages/' + name + '/page.json', json({
        $schema: SCHEMA.page, name, displayName, displayOption: 'FitToPage', width: width || 320, height: height || 284,
        type: 'Tooltip', visibility: 'HiddenInViewMode', pageBinding: { name: binding, type: 'Tooltip' },
        objects: { background: obj({ color: color(u.card), transparency: num(0) }), outspace: obj({ color: color(u.card) }) }
      }));
      visuals.forEach((s, i) => {
        const v = { $schema: SCHEMA.visual, name: rnd(), position: { x: s.x, y: s.y, z: (i + 1) * 1000, height: s.h, width: s.w, tabOrder: (i + 1) * 1000 }, visual: s.visual };
        if (s.filters && s.filters.length) v.filterConfig = { filters: s.filters };
        headed(s.visual);
        add(D + '/pages/' + name + '/visuals/' + v.name + '/visual.json', json(v));
      });
    };
    const tipCard = cardFit(296, 76, 1, TIP_TITLE, TIP_VALUE);
    // (the second sweep's T4: the tooltip now shows the hovered chart's own measure, whatever its name's length: a title
    // two lines of the page's width don't hold is shortened, as the report's chart titles are; the full name stays the alt text)
    const tipTitle = (t) => { const f = titleFit(t, TIP_TITLE, 296 - 16); return f.mode === 'shortened' ? f.shown : t; };
    const tipFrame = (t) => { const f = frame(t, t); f.title = obj({ show: bool(true), text: str(shown(tipTitle(t))), alignment: str(align), fontSize: num(TIP_TITLE) }); return f; };
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
    const tipTop = (tv, cat, m, t0) => { if (!cat || cat.c == null || cat.agg != null || isTime(cat)) return tv;
      tv.filters = [notBlankOf(cat), topN(fieldCol(cat.t, cat.c).field.Column, proj(m).field, 6)];
      const top = (W.top6 || (lang === 'ar' ? 'أعلى 6' : 'Top 6')) + ': ' + t0;
      tv.visual.visualContainerObjects.title[0].properties.text = str(tipTitle(top)); return tv; };
    // (the tooltip pages' bars grow from the right in a mirrored report too)
    const tipBar = (vis) => (MIRROR ? mirrorChart(vis, 'bar') : vis);
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
    const base = W.tooltipPage || 'Tooltip';
    if (!tip) {
      tipPage(tipName, tipBinding, base, [{ x: 12, y: 12, w: 296, h: 260, visual: { visualType: 'textbox', objects: textbox(W.tooltipHere || 'Tooltip page: add a card or a small chart here.', 11, false, u.text), visualContainerObjects: frame(null, base) } }]);
      return false;
    }
    // round 1's two pages are always there (the bar chart by category, and the trend where there is a month): a kind no
    // chart opened gets the picker's card by its category or by month, as before
    if (!tipPages.some((t) => t.kind === 'cat')) tipFor('cat', tip.card, tip.cat);
    if (trend && !tipPages.some((t) => t.kind === 'trend')) tipFor('trend', tip.card, tip.date);
    // each page's name says what tells it apart from the first of its kind: the measure, the category
    const nameOf = (t) => { const f = tipPages.find((x) => x.kind === t.kind);
      return [t.kind === 'trend' ? base + ' \u00b7 ' + label(tip.date) : base].concat(f === t ? [] : [sameField(f.m, t.m) ? null : label(t.m), t.kind === 'cat' && !sameField(f.cat, t.cat) ? label(t.cat) : null]).filter(Boolean).join(' \u00b7 '); };
    // the trend: the measure by month, as a bar chart with the same settings, 310 high on a 320 x 410 page: 12
    // rows (22 a row and 46 for the title and padding), so every month's name is whole and horizontal with its value
    // beside the bar, whatever the measure. Measured in Desktop 2.158 (DESKTOP-TESTS.md, "round 1 built"): at this width
    // a column or line chart loses the last month behind a scrollbar as soon as the value axis's labels are wide
    // ("100K", "0.4M"), and without that axis the first month's name is cut. The owner's choice, 2026-10-03.
    // (0.2.9 part 2, TOOLTIP-FIX-LAB: about 77 months in 310 showed 13 and a scrollbar: where the month's table has a date
    // column, the last 6 months, newest first, at 40 + 27 a bar; elsewhere the 12 rows as before)
    // (the cross-review's G3: the same rule as the trend's, so a month name the model or the report sorts keeps its 12)
    const six = !!(trend && ['monthStart', 'monthLabel'].includes((timeAxisPlan(tip.date) || {}).order));
    tipPages.forEach((t) => {
      const card = cardOf(t.m);
      if (t.kind === 'cat') {
        // a bar chart writes its category names horizontally (a column chart slants or cuts them); its own sizes, as
        // the card has: axis text 8pt, 40% of the width for the names (a 20-character name is whole), no value axis and
        // each bar's value beside it instead, which leaves room for one more row
        // (0.2.9 part 2, TOOLTIP-FIX-LAB: 9 products in 184 showed 6 bars and a scrollbar a tooltip can't use: the Top 6
        // by the measure shown, said in the title; a time category is never cut by value)
        tipPage(t.name, t.binding, nameOf(t), [tipCardVisual(card, topW),
          tipTop({ x: 12, y: 92, w: topW, h: tipSix, visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(t.cat)], Y: [proj(t.m)] }), t.cat, true),   /* (round 23: largest first) */
            objects: tipLook(card, topW),
            visualContainerObjects: tipFrame(byTitle(label(t.m), W.by || 'by', label(t.cat))) }) }, t.cat, t.m, shown(byTitle(label(t.m), W.by || 'by', label(t.cat))))], 92 + tipSix + 8, TOP_W);
        return;
      }
      const tv = { x: 12, y: 92, w: 296, h: six ? 40 + 27 * 6 + 8 : tipRows(12), visual: tipBar({ visualType: 'clusteredBarChart', query: sorted(q({ Category: [proj(tip.date)], Y: [proj(t.m)] }), tip.date),
        objects: tipLook(card),
        visualContainerObjects: tipFrame(byTitle(label(t.m), W.by || 'by', label(tip.date))) }) };
      // (rc1, DETAIL-2 T1: the month tooltip showed "(Blank)" first and 13 rows: it gets the chart's "is not blank" filter)
      tv.filters = [notBlankOf(tip.date)];
      if (six) { byMonthStart(tv.visual.query, tip.date, 'Descending'); const lf = lastMonths(tip.date, proj(t.m).field, 6); if (lf) tv.filters.push(lf); }
      tipPage(t.name, t.binding, nameOf(t), [tipCardVisual(card), tv], six ? 92 + tv.h + 12 : 92 + tv.h + 8);
    });
    return six;
  }

  const api = {
    fitOf, themeSizes, kit, write, tooltips
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipPage = api;
})(typeof self !== 'undefined' ? self : this);
