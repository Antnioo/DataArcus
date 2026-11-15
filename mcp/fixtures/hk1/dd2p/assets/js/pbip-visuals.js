/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's visuals (0.3.2 SP28, moved from pbip-page.js unchanged in what they write): each builder takes
// explicit read-only inputs and returns the visual's JSON with its diagnostics; it names no visual, writes no file and
// keeps nothing between calls. pbip-page.js is the page assembly: it names each visual (rnd), gives z and tab order,
// applies the diagnostics in the order they come, keeps the report-wide lists and writes the files.
//   themeSizes(o)        the theme's text sizes the writer reads: { TH, TITLE, CALLOUT, LABEL, SLICER_TEXT }
//   look({ theme: { o, u, font, edge, W }, direction: { align, rtl } })
//                        the visuals' look and sizes (the kit): frame, textbox, the cards', the buttons' and the Reset's
//                        look, the page filters, the sizes that follow the font; LOOK_KEYS names them
//   slotKind, categoryPlan (pbip-visuals-charts.js); kpiRow, slicers (pbip-visuals-tables.js): given here as they are
//   visual({ theme, look, metrics, binding, slot, plan, kpiIndex, page, direction, known, measures })
//                        -> { skip, visual, box, tableH, filters, hov, fitted, bands, colourKey, svg, rings, noData, panel,
//                        notes, counts }: one slot's visual (title, logo, text, cards, charts, tables); the charts' steps
//                        are pbip-visuals-charts.js's, the cards' and tables' pbip-visuals-tables.js's
//   noDataCard({ look: { LABEL }, theme: { u }, ent, nm, tableH }), emptyPanel(): the "No data" card and the theme's panel
//   phoneLook({ look, theme: { u, font }, known: { rowLabels }, kind, band }, v, p): a visual's own sizes on the phone
// notes: [list, entry] pairs, in order, for the report's lists ('titles.wrapped': c.titles.wrapped); counts: { 'n.blankFiltered': 1 }.
// known: the report's lists read (never written) here; measures: the report's measure registry (pbip-query.js measures,
// freeExt), the one service a builder calls, as the tooltip pages' (SP7).
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Q = (node ? require('./pbip-query.js') : root.DAPbipQuery), Z = (node ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const {
    AR_LETTERS, CHARTS, S0, TYPES, bindQuery, bindStory, bool, kpiLabel,
    color, daxNames, hasControl, lit,
    mixHex, num, obj, pageFilterOf, proj, q, resource,
    shown, str
  } = Q;
  // (0.3, J4: the story titles' rules, story-titles.js, loaded before pbip-query.js on the website's pages)
  const ST = (node ? require('./story-titles.js') : root.DAStoryTitles);
  // the families' steps (0.3.2 SP28: pbip-visuals-charts.js and pbip-visuals-tables.js, loaded before this file)
  const Ch = (node ? require('./pbip-visuals-charts.js') : root.DAPbipVisualCharts), Tb = (node ? require('./pbip-visuals-tables.js') : root.DAPbipVisualTables);
  const { barBand, barSpan, columnRoom, textWidth } = Z;
  // the visual gallery (0.3, J8; visual-gallery.js): optional in the browser. A gallery slot reaches here only when the
  // design's flag is on and its fields fit (pbip-export.js resolves the others to their plain kind first)
  const G = (node ? require('./visual-gallery.js') : root.DAGallery || null);
  const isGallery = (kind) => !!(G && G.isKind(kind));

  // the theme's text sizes the writer reads (the kit's, and fitOptions')
  const themeSizes = (o) => { const TH = (o.theme && o.theme.textClasses) || {}, LABEL = +(TH.label || {}).fontSize || 10;
    return { TH, TITLE: +(TH.title || {}).fontSize || 12, CALLOUT: +(TH.callout || {}).fontSize || 28, LABEL, SLICER_TEXT: +((((((o.theme || {}).visualStyles || {}).slicer || {})['*'] || {}).header || [{}])[0].textSize) || LABEL }; };

  // The visuals' look and sizes shared by a report's pages and its tooltip pages (frames, cards, buttons), made once per
  // report (pbip-page.js kit)
  function look(x) {
    const { theme: { o, u, font, edge, W }, direction: { align, rtl } } = x;

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
    // the theme's text sizes are made for the report's full page; the 320 x 284 tooltip page and the phone get their own
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
      value: obj(Object.assign({ fontSize: num(c.V), horizontalAlignment: str(side || 'center') }, FULL || (f && (f.pct || f.unitAuto || cardCode(f))) ? {} : { labelPrecision: lit('2L') }), DEF)
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
    // the sizes that follow the font and the label size (pbip-sizing.js)
    const { cardFit, pt, charW, boxH, buttonH, slicerH, pillH, pillRoom, pillFits, pillW, PILL_PAD, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines, kpiTitleFit, titleFit, oneLine, phoneCardFit } = Z.make({ font, LABEL });
    return {
      paneObjects, SOLID, headed, frame, textbox, TH, TITLE, CALLOUT, TIP_VALUE, TIP_TITLE,
      FULL, valueEm, resetFill, resetIcon, resetLook, resetTip, LABEL, SLICER_TEXT, DEF, cardCode,
      cardObjects, cardFrame, def, pageFilters, cardFit, pt, charW, boxH, buttonH,
      slicerH, pillH, pillRoom, pillFits, pillW, PILL_PAD, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines,
      kpiTitleFit, titleFit, oneLine, phoneCardFit
    };
  }
  const LOOK_KEYS = Object.freeze(['paneObjects', 'SOLID', 'headed', 'frame', 'textbox', 'TH', 'TITLE', 'CALLOUT', 'TIP_VALUE', 'TIP_TITLE', 'FULL', 'valueEm', 'resetFill', 'resetIcon', 'resetLook', 'resetTip', 'LABEL', 'SLICER_TEXT', 'DEF', 'cardCode', 'cardObjects', 'cardFrame', 'def', 'pageFilters', 'cardFit', 'pt', 'charW', 'boxH', 'buttonH', 'slicerH', 'pillH', 'pillRoom', 'pillFits', 'pillW', 'PILL_PAD', 'RESET_GAP', 'resetFit', 'resetW', 'boxFit', 'textMid', 'centred', 'AUTO_EM', 'wrapLines', 'kpiTitleFit', 'titleFit', 'oneLine', 'phoneCardFit']);
  // the look a page is written with, from the report's context (the kit's keys only)
  const lookOf = (c) => Object.fromEntries(LOOK_KEYS.map((k) => [k, c[k]]));

  // One slot's visual: the header's title and logo, a text box, a card, a chart or a table, with its fixes; the assembly
  // gives it its name and z, the "No data" card's measure its name, and adds the panel behind a table on its rows
  function visual(x) {
    const { theme: { o, u, W, font, base, lang, logoFile, NODATA }, look: L,
      binding: { B, own, chartTitles }, slot: s, kpiIndex, page: { pg }, direction: { rtl, align }, known } = x;
    const { rowLabels, noDataSkipped } = known;
    const { LABEL, SOLID, TITLE, boxFit, centred, frame, pt, textbox, titleFit } = L;
    const out = { notes: [], counts: {}, rings: [] }, note = (key, e) => out.notes.push([key, e]), count = (key) => { out.counts[key] = (out.counts[key] || 0) + 1; };
    const sink = { out, note, count };   // (the builder's output: the family steps add their notes and counts to it)
    const tc = { own, LABEL, font }, type = TYPES[s.kind] || (isGallery(s.kind) ? G.typeOf(s.kind) : 'cardVisual');
    let pending = null;   // (this table's row label, for its own column widths: Tb.fix reads it with the report's)
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
      if (!logoFile && o.logoPlaceholder === false) return Object.assign(out, { skip: true });
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
      // a table keeps only the fields its width has room for (pbip-visuals-tables.js prepare); Bt is the bind this visual is
      // written from, and each chart's category, measure and axis (pbip-visuals-charts.js prepare)
      let { Bt, tableText, smallEntry } = Tb.prepare(x, { Bt: B }, sink);
      Bt = Ch.prepare(x, { Bt }, sink);
      const query = B ? (isGallery(s.kind) ? G.bindQuery(s.kind, Bt) : bindQuery(s.kind, Bt, kpiIndex, rtl)) : null;
      hov = Ch.hover(s.kind, B, Bt);
      let ttl = s.title;
      const extra = {};
      // (round 10: the sample download names its charts by their fields too, "Total Revenue by Month", as a report on a
      // user's model does; before, it kept the layout's role names, "Main trend")
      // (0.3, J4: the story title, story-titles.js: every form its rules allow, the full one first; a gallery visual
      // (0.3, J8) keeps its own title, visual-gallery.js)
      const story = B && query && !isGallery(s.kind) ? bindStory(s.kind, Bt, W.by || 'by') : null;
      if (story) ttl = story[0].text;
      else if (B && query && isGallery(s.kind)) ttl = G.title(s.kind, Bt, W.by || 'by') || ttl;
      // (rc1: a chart cut to its top N says so in its title, as the tooltip page's "Top 6")
      let topOf = null, topLead = '', tail = '', told = null;
      // (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) its «أعلى» / "Top" and its «التفاصيل» /
      // "detail" are in the title's language, not the report's: "Top 6: Total Sales by Region" in an Arabic report too
      const arT = AR_LETTERS.test(ttl || '');
      { const top = B && query ? Ch.topCount(tc, s, pg, Ch.catOf(Bt, query)) : 0; if (top && ttl) { topLead = (arT ? 'أعلى ' : 'Top ') + top + ': '; topOf = { n: top, cat: Ch.catOf(Bt, query), y: query.queryState.Y.projections[0].field }; } }
      if ((s.kind === 'table' || s.kind === 'matrix') && ttl && chartTitles.has(ttl)) tail = ': ' + (arT ? (W.detail && AR_LETTERS.test(W.detail) ? W.detail : 'التفاصيل') : (W.detail && !AR_LETTERS.test(W.detail) ? W.detail : 'detail'));   // (round 14: in the title's own script)
      // (0.3, J4, B-131: a long title was cut at a word, "...حسب قناة البيع المستخدمة في…") the first form whose title
      // fits its box on two lines, with its "Top 999 of 999: " (the report measure's longest lead) and its ": detail";
      // the writer's word cut below is left for a title no rule shortens enough
      if (story && s.kind !== 'kpi' && s.kind !== 'card') {
        const room = s.w - 2 * Math.round(16 * pg.page.h / 1080), lead = topOf ? (arT ? 'أعلى 999 من 999: ' : 'Top 999 of 999: ') : '';
        told = ST.fit(story, (t) => titleFit(lead + t + tail, TITLE, room).mode !== 'shortened'); ttl = told.text;
      }
      if (ttl) ttl = topLead + ttl + tail;
      // (0.3, J4, the owner's decision of 19 Oct: the alt text is the FULL story title, never the fitted one; a screen
      // reader has no box to fit)
      const altFull = story && ttl && s.kind !== 'kpi' ? topLead + story[0].text + tail : null;
      if (s.kind === 'kpi') { if (B && query) ttl = kpiLabel(B.kpis[kpiIndex], W.by); }
      // KPI names read as labels: semibold, so the number below stays the hero
      if (s.kind === 'kpi') extra.title = obj({ show: bool(true), text: str(shown(ttl)), alignment: str(align), bold: bool(true) });
      // a visual that shows data is never written without its fields (Microsoft's validator: PBIR_QUERY_STATE_MISSING;
      // Desktop shows an empty box): on a user's own model it is left out and told (leftOut). The KPI cards are
      // counted by the caller.
      if (B && own && !query && (CHARTS.includes(s.kind) || isGallery(s.kind) || ['table', 'matrix', 'gauge', 'card'].includes(s.kind))) { note('leftOut', { page: pg.name || base, kind: s.kind, title: s.title || null }); return Object.assign(out, { skip: true }); }
      visual = { visualType: type, visualContainerObjects: frame(ttl, altFull || ttl, extra, true), drillFilterOtherVisuals: true };
      if (query) visual.query = query;
      // the charts' own formatting (pbip-visuals-charts.js format)
      const toMirror = Ch.format(x, { visual, query, Bt, ttl }, sink);
      // Round 21 (the capabilities lab's #2, Desktop 2.158, 7 Oct 2026: one small line under the title, shaped right in
      // Arabic, kept on Save): a subtitle from the approved plan only (o.subtitles: a slot's plan role, English or
      // Arabic, or a hand-placed slot's title -> its text); the writer never makes one up
      // (round 22, the code review's b, measured in Desktop 2.158.1304 on 7 Oct: on a planned KPI card the subtitle's line
      // pushes the value down and cuts it in half, the card is sized for a title and a value: never on a card. The keys
      // used are reported, subtitlesUsed, so the caller can say which were not)
      if (o.subtitles && ttl && visual.visualContainerObjects && s.kind !== 'kpi' && s.kind !== 'card') { const key = [].concat(s.role || [], s.title || []).find((k) => typeof o.subtitles[k] === 'string' && o.subtitles[k].trim());
        if (key != null) { visual.visualContainerObjects.subTitle = obj({ show: bool(true), text: str(o.subtitles[key].trim()) }); note('subtitlesUsed', key); } }
      // Round 12 (#24; seen in Desktop 2.158, 5 Oct 2026: long Arabic chart titles and a slicer header were cut at their
      // start, "...عات حسب اسم الفرع التجاري الرئيسي", so the measure's name was lost). A chart's or table's title too
      // long for one line wraps to two (titleWrap, as a KPI title does), and one too long for two lines is shortened at a
      // word with "…" at its end, so it still begins with the measure's name; the full title stays the alt text. The
      // room: the visual's width less 16 a side (1920 x 1080, scaled); the theme's title size, measured as bold.
      if (s.kind !== 'kpi' && s.kind !== 'card' && ttl) {
        const tf = titleFit(ttl, TITLE, s.w - 2 * Math.round(16 * pg.page.h / 1080)), tp = visual.visualContainerObjects.title[0].properties;
        // (0.3.0 D2: a gallery visual had no story entry, so two charts that read the same were numbered "(2)") its measure
        // and axis as its title says them, and its kind's word for a page where no other sentence is left
        const gs = !told && B && query && isGallery(s.kind) ? G.storyOf(s.kind, Bt, W.by || 'by') : null;
        out.fitted = { ttl, avail: s.w - 2 * Math.round(16 * pg.page.h / 1080), page: pg.name || base, top: topOf, story: told ? { m: told.m, c: told.c, ranked: !!topOf, full: story[0], alt: story[0].text + tail }
          : gs ? { m: gs.m, c: gs.c, ranked: false, full: { m: gs.m, c: gs.c }, alt: ttl, tail: gs.tail } : null };
        if (tf.mode !== 'one') { tp.text = str(tf.shown); if (!tf.one) tp.titleWrap = bool(true); note('titles.' + tf.mode, out.fitted.entry = { page: pg.name || base, title: ttl, shown: tf.shown }); }
      }
      // the cards' formatting (pbip-visuals-tables.js card)
      Tb.card(x, { visual, query, ttl, type }, sink);
      // the tables' formatting, their row labels, pictures and whole rows (pbip-visuals-tables.js format)
      ({ tableH, pending } = Tb.format(x, { visual, query, Bt, tableText, smallEntry, box }, sink));
      // the fixes once the fields are written: the charts' filters, bars and axes, the tables' column widths (with this
      // table's own row label: pending), then a mirrored report's charts turned
      if (B && visual && visual.query) { vFilters = Ch.fix(x, { visual, Bt }, sink); Tb.fix(x, { visual, Bt, tt: tableText, rowLabels: pending ? rowLabels.concat(pending) : rowLabels }, sink); }
      if (toMirror && visual && visual.query) Ch.mirror(x, { visual }, sink);
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
        if (!noDataSkipped.some((x) => x.t === sk.t && x.m === sk.m)) note('noDataSkipped', sk);
      } else if (pr) {
        // (A3-11: two measures whose names differ only by a format character get a name each, "(2)": the assembly names it)
        const ent = pr.field.Measure.Expression.SourceRef.Entity, mm = pr.field.Measure.Property, expression = 'IF ( ISBLANK ( ' + daxNames.column(ent, mm) + ' ), ' + daxNames.string(lang === 'ar' ? 'لا توجد بيانات لهذا الاختيار' : 'No data for this selection') + ', "" )';
        out.noData = { ent, mm, expression, want: (W.noDataName || 'No data: ') + shown(mm) };
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
      out.panel = !!(SOLID && !ndBehind);   // (the assembly adds it, as the header's and the rail's bands: emptyPanel)
    }
    return Object.assign(out, { visual, box, tableH, filters: vFilters, hov });
  }

  // Round 19: the "No data for this selection" card, one layer below its visual (nm: its report measure's name, given by
  // the assembly), and the panel the theme draws behind the header, the rail or a table on its whole rows (an empty text box)
  const noDataCard = (x) => { const { look: { LABEL }, theme: { u }, ent, nm, tableH } = x;
    return { visualType: 'cardVisual',
      query: q({ Data: [{ field: { Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: ent } }, Property: nm } }, queryRef: ent + '.' + nm, nativeQueryRef: nm }] }),
      objects: { value: [{ properties: { fontSize: num(LABEL), fontColor: color(mixHex(u.text, u.card, 0.3)), horizontalAlignment: str('center') }, selector: { id: 'default' } }], label: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], outline: [{ properties: { show: bool(false) }, selector: { id: 'default' } }], fillCustom: [{ properties: { show: bool(false) } }] },
      visualContainerObjects: { title: obj({ show: bool(false) }), visualTooltip: obj({ show: bool(false) }), general: obj({ altText: str('') }), dropShadow: obj({ show: bool(!!tableH) }) } };   /* (writer round 9: behind a table on its whole rows the card is the panel, with the panel's shadow) */
  };
  const emptyPanel = () => ({ visualType: 'textbox', objects: { general: obj({ paragraphs: [{ textRuns: [{ value: '' }] }] }) }, visualContainerObjects: { title: obj({ show: bool(false) }) } });

  // Text on the phone (pbip-page.js lays the phone out). The page's text sizes are made for the page: on the 323-wide phone canvas they are cut (15pt
  // slicers on 1080, everything on 2160), so each visual gets its own sizes in mobile.json, the same on every page
  // size. A size there is used only when it is written with the selector that property needs on the page (measured
  // in Desktop 2.158, DESKTOP-TESTS.md round 1): none for a text box's paragraph, a slicer's header and items, a
  // container title, a chart's axes, a table's text and the card's container padding (under "default" Desktop
  // ignores it and the page's padding, with its accent-bar side, stays); "default" for a button's text; each state
  // for page buttons. Not covered (not measured): data labels, legends and the text inside donut, funnel, treemap,
  // map and gauge.
  const PHONE = { title: 14, nav: 10, slicer: 10, button: 10, heading: 12, axis: 8, table: 8 };
  function phoneLook(x, v, p) {
    const { look: { TIP_TITLE, TIP_VALUE, DEF, oneLine, phoneCardFit }, theme: { u, font }, known: { rowLabels }, kind, band } = x;
    const vis = v.visual, t = vis.visualType, objects = {}, vco = {};
    const ttl = (vis.visualContainerObjects || {}).title, shown = !!(ttl && ttl[0].properties.show && ttl[0].properties.show.expr.Literal.Value === 'true');
    if (t === 'cardVisual') {
      // a card on the phone (157.5 x 100) gets its own sizes, as on the small tooltip page: the page's 42 would not fit
      // Round 12 (#1; seen in Desktop 2.158, round 11: "Total Sales Last Rama..." on every phone page): a title too
      // long for one line at 10pt wraps to two (titleWrap, as on the page) where two lines and the value fit the card,
      // otherwise it is shortened at a word with "…"; the phone shows the full name where the page shortened it.
      // (the rule: pbip-sizing.js phoneCardFit, the Arabic twin's too)
      const tl = { fontSize: num(TIP_TITLE), fontColor: color(u.text) }, full = S0(((vis.visualContainerObjects || {}).general || [{ properties: {} }])[0].properties.altText);
      const pf = phoneCardFit(shown && full ? full : '', p.w, p.h, TIP_TITLE, TIP_VALUE), c = pf.c;
      if (pf.mode === 'wrap') Object.assign(tl, { text: str(full), titleWrap: bool(true) });
      else if (pf.mode === 'cut') tl.text = str(oneLine(full, TIP_TITLE, pf.room));
      return { objects: { value: obj({ fontSize: num(c.V) }, DEF), padding: obj({ paddingUniform: num(c.I) }, DEF) },
        visualContainerObjects: { title: obj(tl), padding: obj({ top: num(c.P), bottom: num(c.P), left: num(c.P), right: num(c.P) }) } };
    }
    // (round 12, #4; seen in Desktop 2.158, round 11: pale grey titles on the phone) the title in the text colour
    if (shown) vco.title = obj({ fontSize: num(PHONE.heading), fontColor: color(u.text) });
    if (t === 'textbox' && kind === 'title') {
      // the header title: 14pt, or the largest size down to 8 whose one line fits the phone's width (pbip-sizing.js
      // phoneTitleSize, the Arabic twin's rule too)
      const para = vis.objects.general[0].properties.paragraphs[0], run = para.textRuns[0];
      const size = Z.phoneTitleSize(run.value, p.w, PHONE.title);
      objects.general = obj({ paragraphs: [Object.assign({}, para, { textRuns: [Object.assign({}, run, { textStyle: Object.assign({}, run.textStyle, { fontSize: size + 'pt' }) })] })] });
    } else if (t === 'pageNavigator') objects.text = ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(PHONE.nav) }, selector: { id } }));
    else if (t === 'slicer') { objects.header = obj({ textSize: num(PHONE.slicer) }); objects.items = obj({ textSize: num(PHONE.slicer) }); }
    else if (t === 'advancedSlicerVisual') objects.value = obj({ fontSize: num(PHONE.slicer) }, DEF);   // (L2: the pills' text, as a button's)
    else if (t === 'actionButton') objects.text = obj({ fontSize: num(PHONE.button) }, DEF);
    else if (t === 'lineChart' || t === 'clusteredBarChart' || t === 'clusteredColumnChart') { objects.categoryAxis = obj({ fontSize: num(PHONE.axis) }); objects.valueAxis = obj({ fontSize: num(PHONE.axis) });
      // (0.3.1 FX5) the thickness rule on the phone's box, in its own 720-high units (a count the page's chart was set by)
      const pb = band !== undefined ? barBand(band, barSpan(Ch.BAR_TYPES.test(t), p.w, p.h, 720), 720) : null;
      if (pb) Object.assign(objects.categoryAxis[0].properties, { innerPadding: lit(pb.pct + 'L'), outerPadding: lit(pb.pct + 'L') }); }
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
  }

  const api = {
    themeSizes, look, LOOK_KEYS, lookOf, slotKind: Ch.slotKind, kpiRow: Tb.kpiRow, slicers: Tb.slicers, categoryPlan: Ch.categoryPlan, visual, noDataCard,
    emptyPanel, phoneLook
  };
  if (node) module.exports = api; else root.DAPbipVisuals = api;
})(typeof self !== 'undefined' ? self : this);
