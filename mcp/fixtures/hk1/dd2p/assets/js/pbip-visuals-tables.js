/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's cards, tables and slicers (0.3.2 SP28, from pbip-page.js through pbip-visuals.js; what they write
// unchanged): each step takes the slot builder's read-only input x (pbip-visuals.js visual) and the step's own state, and
// returns its result; notes and counts go to the builder's sink ({ out, note, count }). Nothing is kept between calls; no
// visual is named, no file written.
//   kpiRow({ look, theme: { o, W, font }, binding: { B }, page: { pg }, slots }) -> { kpiTitle, kpiFits, rowValue, rowWraps }
//   slicers({ look, theme: { o, u, font, edge, base }, metrics: { k }, direction: { rtl }, page: { pg } })
//                        -> { slicerVisual(f, title, w, h) -> { visual, notes }, stackHeights(fields, h, room) }
//   prepare(x, { Bt }, sink) -> { Bt, tableText, smallEntry };  card(x, { visual, query, ttl, type }, sink)
//   format(x, { visual, query, Bt, tableText, smallEntry, box }, sink) -> { tableH, pending };  fix(x, { visual, Bt, tt, rowLabels })
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Q = (node ? require('./pbip-query.js') : root.DAPbipQuery), Z = (node ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const {
    ROW_LABEL, catKind, color, contrast, isTextField, isValue, kpiLabel, label, lit, mixHex, num, obj, orderHelper, orderedBy, proj, q,
    rowLabelDax, rowLabelOf, shown, str, bool, tableFields
  } = Q;
  const { cellRoom, columnRoom, fieldRoom, rowPitch, tableFit, tableHeight, textWidth } = Z;

  // A page's row of KPI cards: one title size and one value size for the row (and whether a title wraps)
  function kpiRow(x) {
    const { look: { TITLE, CALLOUT, SOLID, AUTO_EM, valueEm, cardFit, kpiTitleFit }, theme: { o, W, font }, binding: { B }, page: { pg }, slots: sorted } = x;
    // The KPI titles of a page share one size (seen in Desktop on 2026-10-05: 12pt beside 8pt in one row looked
    // wrong): the largest, down to 8pt, at which the longest title of the row fits its card.
    let kpiTitle = TITLE;
    sorted.filter((s) => s.kind === 'kpi').forEach((s, i) => {
      const f = B && B.kpis ? B.kpis[i] : null, text = f ? kpiLabel(f, W.by) : s.title;
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
    const rowValue = () => (rowV == null ? (rowV = Math.min(...kpiSlots.map((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? kpiLabel(f, W.by) : s.title, f).c.V; }))) : rowV);
    let rowWrap = null;
    const rowWraps = () => (rowWrap == null ? (rowWrap = sorted.filter((s) => s.kind === 'kpi').some((s, i) => { const f = B && B.kpis ? B.kpis[i] : null; return kpiFits(s, i, f ? kpiLabel(f, W.by) : s.title, f).fit.mode === 'wrapped'; })) : rowWrap);
    return { kpiTitle, kpiFits, rowValue, rowWraps };
  }

  // A page's slicers: each slicer's visual (a rounded dropdown, or pills) with its notes, and the heights of stacked slicers
  function slicers(x) {
    const { look: { frame, DEF, SLICER_TEXT, pillH, pillFits, pillW, pillRoom, PILL_PAD, slicerH, oneLine }, theme: { o, u, font, edge, base }, metrics: { k }, direction: { rtl }, page: { pg } } = x;
    // a slicer's header, shortened to the slicer's width: the header's own text (header.text, in Microsoft's theme
    // schema), so the field keeps its name everywhere else; the full name stays the slicer's alt text
    // (rc1, PERF-COMPARE D3: "Enforcement_History..." cut where a smaller text held it whole: the header takes the largest
    // size, down to 8pt, at which the name is whole, as a KPI card's title; it is shortened only where even 8pt doesn't hold it)
    // (polish round P2, the owner's rounded slicer boxes; seen in Desktop 2.158, DESKTOP-TESTS.md 2026-10-12) a dropdown
    // slicer's box rounded at 8, the cards' corners, with the design's edge colour as its border. Exactly these three
    // properties: Microsoft's validator 0.4.0 does not know the "dropdown" object, and check_report shows exactly this
    // shape as a known note (mcp/lib/check-report.mjs VALIDATOR_GAPS); any other property in it would stay an error.
    const slicerBox = () => obj({ borderRadius: num(8), borderIndividualCorners: bool(false), borderColor: color(edge) });
    // (0.3.0 L2, the polish lab of 12-13 Oct, Desktop 2.158: "pills") with o.slicerStyle 'pills', a slicer whose field has
    // 2-6 values known from the model's metadata alone (two values: true/false or an IF/SWITCH of two texts; a quarter; a
    // calculated column of 3-6 texts, the picker's few) is Power BI's button slicer: rounded buttons on one row, a calm fill,
    // the selected one in the accent; every other slicer stays the rounded dropdown. Each is told with why (slicerStyles).
    // Names and values from Microsoft's catalog (powerbi-core-visual-schema): the state-keyed cards as a button's (each
    // card's show with no selector, its look in "default", the selected look in "selected"); shape and layout have no states.
    // Right to left: sorted descending by the field on its one row, so the first value is at the right.
    const PILLS = o.slicerStyle === 'pills', int = (x) => lit(Math.round(x) + 'L');
    const valuesKnown = (f) => (!f ? null : f.two ? { n: 2, why: 'two values (true/false, or a formula of two texts)' } : f.cal && f.cal.rows ? { n: f.cal.rows, why: f.cal.rows + ' values (a ' + f.cal.kind + ')' } : f.few ? { n: f.few, why: f.few + ' values (a formula of ' + f.few + ' texts)' } : null);
    const slicerVisual = (f, ttl, w, h) => {
      const notes = [], note = (key, e) => notes.push([key, e]);
      const kv = valuesKnown(f);
      // (0.3.0 F1) the pills' text size: the slicer text, a size smaller at a time (to 8) until the header and one row of
      // tiles fit the visual's height (pillH); a slot too low even at 8 keeps the dropdown, said with why
      let pt0 = SLICER_TEXT; while (h && pt0 > 8 && pillH(pt0) > h) pt0 = Math.max(8, Math.ceil(pt0) - 1);
      // (0.3.0 C1 add-on, the laptop's PILLS-F6: "Medium" drawn "Mediu…" in a rail's 86 px pill) and the width: the widest
      // value known from the model (true/false, a formula's texts; a calendar's quarter by the longest way it is written)
      // at the text size, plus its room, in one pill (pillFits), a size smaller at a time to 8; else the dropdown, said
      const texts = kv ? (f.texts || (f.cal && f.cal.kind === 'quarter' ? ['Quarter 4', 'الربع 4'] : null)) : null;
      // (a smaller text needs a little more height, pillRoom: the first size where both the height and the width hold)
      if (kv && texts && w && !pillFits(texts, kv.n, w, pt0)) { let p = pt0; while (p > 8 && !(pillFits(texts, kv.n, w, p) && !(h && pillH(p) > h))) p = Math.max(8, Math.ceil(p) - 1); if (pillFits(texts, kv.n, w, p) && !(h && pillH(p) > h)) pt0 = p; }
      const narrow = !!(kv && w && (!texts || !pillFits(texts, kv.n, w, pt0))), widest = texts ? texts.slice().sort((x, y) => y.length - x.length)[0] : null;
      const low = !narrow && !!(h && pillH(pt0) > h), pill = PILLS && kv && kv.n >= 2 && kv.n <= 6 && !low && !narrow;
      if (PILLS && f) note('slicerStyles', { page: pg.name || base, field: f.t + '[' + f.c + ']', written: pill ? 'pills' : 'dropdown',
        why: pill ? kv.why + ', known from the model' + (pt0 < SLICER_TEXT ? '; text ' + pt0 + 'pt so the header and the pills fit the slicer\'s height and every value fits its pill' : '') : kv && kv.n >= 2 && kv.n <= 6 && narrow && !low ? (texts ? 'the pills would cut «' + widest + '» (' + Math.floor(pillW(kv.n, w)) + ' a pill; no smaller text fits both its width and the slicer\'s height): a dropdown' : 'its values\' texts are not known from the model, so their width can\'t be checked: a dropdown') : kv && kv.n >= 2 && kv.n <= 6 ? 'the slicer is ' + Math.round(h) + ' high, the pills need ' + pillH(8) + ' at their smallest text (8pt): a dropdown' : kv ? kv.why + ': more than pills hold (2-6)' : 'its number of values is not known from the model\'s metadata' });
      if (!pill) return { visual: { visualType: 'slicer', query: f ? q({ Values: [proj(f)] }) : undefined,
        objects: { data: obj({ mode: str('Dropdown') }), header: slicerHeader(f, w, note), dropdown: slicerBox() }, visualContainerObjects: frame(null, ttl), drillFilterOtherVisuals: true }, notes };
      const query = q({ Values: [proj(f)] }), acc = u.accent || u.text, calm = mixHex(acc, u.card, 0.9), onAcc = contrast(u.text, acc) >= contrast(u.card, acc) ? u.text : u.card, SEL = { id: 'selected' };
      if (rtl) query.sortDefinition = { sort: [{ field: query.queryState.Values.projections[0].field, direction: 'Descending' }] };
      // (0.3.0 F1, the laptop proof on Desktop 2.159: every pill drawn with no text) the button slicer's item text is its
      // "Values" card (value); written as the new card's value is measured to need (round 0, mcp/docs/RULES-POWERBI.md): everything
      // under the default selector, show included, never an entry without one; the outline likewise. The fill's show
      // stays without a selector (the card's fillCustom.show: measured). Other shapes for the laptop: mcp/lab/pills-variants.mjs
      const states = (show, look, picked) => [{ properties: show }, { properties: look, selector: DEF }, { properties: picked, selector: SEL }];
      const keyed = (look, picked) => [{ properties: look, selector: DEF }, { properties: picked, selector: SEL }];
      const full = label(f), shownT = oneLine(full, pt0, w - 2 * Math.round(8 * k));
      if (shownT !== full) note('titles.slicers', { page: pg.name || base, field: full, shown: shownT });
      return { visual: { visualType: 'advancedSlicerVisual', query,
        // (0.3.0 F4, the owner: "remove the margins in the pills, that will give you more room") every margin the button
        // slicer has, by Microsoft's capabilities (advancedSlicerVisual; vco-capabilities for the container), written 0:
        // the layout's cell, row and column padding and outer margins (no states), the tiles' padding and the space
        // between value and label (state-keyed: default), the container's padding and the space below its title
        // (F5, the owner: "nothing touches or breaks") except the gap between two pills, columnPadding 6: across, no height
        objects: { shapeCustomRectangle: obj({ tileShape: str('pill') }), layout: obj({ rowCount: int(1), columnCount: int(kv.n), customizePadding: bool(true), cellPadding: int(0), rowPadding: int(0), columnPadding: int(6),
            topOuterMargin: int(0), bottomOuterMargin: int(0), leftOuterMargin: int(0), rightOuterMargin: int(0) }),
          fillCustom: states({ show: bool(true) }, { fillColor: color(calm) }, { fillColor: color(acc) }),
          // (0.3.0 P7, the owner: "if English then the value in the pill LTR, if Arabic then RTL") each value centred in its
          // pill, in both languages (value.horizontalAlignment, Microsoft's capabilities), text wrap off (a wrapped value
          // needs a second line the measured height has no room for); the tiles' order is the sort's (no direction setting)
          value: keyed({ show: bool(true), fontFamily: str(font), fontSize: num(pt0), fontColor: color(u.text), horizontalAlignment: str('center'), textWrap: bool(false) }, { fontColor: color(onAcc) }),
          outline: keyed({ show: bool(true), lineColor: color(edge) }, { lineColor: color(acc) }),
          padding: obj({ paddingSelection: str('Custom'), topMargin: int(PILL_PAD), bottomMargin: int(PILL_PAD), leftMargin: int(PILL_PAD), rightMargin: int(PILL_PAD) }, DEF),
          spacing: obj({ verticalSpacing: int(0) }, DEF) },
        // (F1) the header written at the tiles' size, as the dropdown's is (Power BI's own title size took the tiles' room)
        visualContainerObjects: (() => { const fr = frame(shownT, full); Object.assign(fr.title[0].properties, { fontSize: num(pt0), fontFamily: str(font) });
          return Object.assign(fr, { padding: obj({ top: num(0), bottom: num(0), left: num(0), right: num(0) }), spacing: obj({ customizeSpacing: bool(true), spaceBelowTitle: num(pillRoom(pt0)), spaceBelowTitleArea: num(0) }) }); })(), drillFilterOtherVisuals: true }, notes };
    };
    // (0.3.0 F2) the heights of stacked slicers: each pill slicer pillH (the measured need) when all fit the room, else the
    // room left after the dropdowns, shared by the pills (never less than the dropdown's height)
    const isPill = (f) => { const kv = PILLS && valuesKnown(f); return !!(kv && kv.n >= 2 && kv.n <= 6); };
    const stackHeights = (fields, sh, room) => {
      const want = fields.map((f) => (isPill(f) ? Math.max(sh, pillH(SLICER_TEXT)) : sh)), np = fields.filter(isPill).length;
      if (!np || want.reduce((a, b) => a + b, 0) <= room) return want;
      // (0.3.0 F3, the rail on 2.159: 76 at 8pt cut the pills' text) short of room, a dropdown gives up its extra height
      // first, down to its own measured need (slicerH), so the pills keep theirs; then the pills share what is left
      const nd = fields.length - np, dmin = Math.min(sh, slicerH(SLICER_TEXT));
      const pe = Math.max(dmin, Math.min(pillH(SLICER_TEXT), (room - nd * dmin) / np)), de = nd ? Math.max(dmin, Math.min(sh, (room - np * pe) / nd)) : 0;
      return fields.map((f) => (isPill(f) ? pe : de));
    };
    const slicerHeader = (f, w, note) => { const out = { show: bool(true), fontFamily: str(font) }; if (!f) return obj(out); const full = label(f), room = w - 2 * Math.round(8 * k);
      let size = SLICER_TEXT; while (size > 8 && oneLine(full, size, room) !== full) size = Math.ceil(size) - 1;
      if (size < SLICER_TEXT) out.textSize = num(size);
      const shown = oneLine(full, size, room);
      if (shown !== full) { note('titles.slicers', { page: pg.name || base, field: full, shown }); out.text = str(shown); } return obj(out); };
    return { slicerVisual, stackHeights };
  }

  // A table's or matrix's binding: the fields its width has room for (tableFit), at the largest text that keeps the most
  // -> { Bt, tableText (a smaller text, or null), smallEntry (its tableSmaller note, which the rows may change) }
  function prepare(x, st, sink) {
    const { theme: { o, font, base }, binding: { B }, slot: s, page: { pg, pageIndex } } = x, { note } = sink;
    let Bt = st.Bt, tableText = null, smallEntry = null;
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
        if (need(t3) > tw) note('tableWide', { page: pg.name || base, width: s.w, need: Math.ceil(need(t3)) }); }
      if (tableText) note('tableSmaller', smallEntry = { page: pg.name || base, size: tableText, from: T0 });
      if (tf.leftOut.length) { Bt = Object.assign({}, B, { table: tf.kept }); note('tableColumns', { page: pg.name || base, pageIndex, x: s.x, y: s.y, kept: tf.kept, leftOut: tf.leftOut }); }
    }
    return { Bt, tableText, smallEntry };
  }

  // A card's formatting (a KPI card in its row, or a card): its value, padding, title, "No data", picture and format
  function card(x, st, sink) {
    const { theme: { lang, font, base, NODATA }, look: { CALLOUT, DEF, FULL, SOLID, TITLE, cardCode, cardFit, cardFrame, cardObjects, valueEm }, metrics: { kpiTitle, kpiFits, rowValue, rowWraps },
      binding: { B }, slot: s, kpiIndex, page: { pg }, direction: { rtl, align } } = x, { visual, query, ttl, type } = st, { note } = sink;
    // the title already names the KPI, so the card's own label under the number is not repeated
    if (type === 'cardVisual') {
      const cf0 = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex] : B.measure) : null;
      const kf = s.kind === 'kpi' ? kpiFits(s, kpiIndex, ttl, cf0) : null;
      const c = kf ? kf.c : cardFit(s.w, s.h, pg.page.h / 720, TITLE, CALLOUT, { top: Math.round(12 * pg.page.h / 1080), side: SOLID ? Math.round(16 * pg.page.h / 1080) : 0 }, valueEm(cf0));
      let cc = c;
      if (s.kind === 'kpi') {
        const fit = kf.fit;
        const tp = visual.visualContainerObjects.title[0].properties;
        if (fit.mode === 'wrapped') { cc = fit.c; tp.titleWrap = bool(true); note('kpiTitles.wrapped', { page: pg.name || base, title: ttl }); }
        // a one-line title in a row where another title wraps: the second line's height stays free above it, so
        // every value of the row sits at the same height (seen in Desktop 2.158, 2026-10-05: 6 apart without it)
        else if (rowWraps() && kf.two.V >= c.V) cc = Object.assign({}, kf.two, { V: c.V, T: kf.two.T + Math.ceil(kpiTitle * 1.5) });
        if (fit.mode === 'shortened') { tp.text = str(fit.shown); note('kpiTitles.shortened', { page: pg.name || base, title: ttl, shown: fit.shown }); }
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
        else if (ve) note('blankKept', { page: pg.name || base, title: ttl || null, w: s.w, need: Math.ceil(need) });
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
      const cf = query && B ? (s.kind === 'kpi' ? B.kpis[kpiIndex] : B.measure) : null;
      if (FULL && cf && cf.m != null && cf.cardFormat && !cardCode(cf)) visual.objects.value.push({ properties: { labelDisplayUnits: num(-1), customFormatString: str(cf.cardFormat) }, selector: { metadata: cf.t + '.' + cf.m } });
    }
  }

  // A table's or matrix's formatting: its text size, its columns' alignment and row label, tight rows, the calendar
  // order's helper, its pictures (svgColumns) and its whole-row height. -> { tableH, pending (its row label's note) }
  function format(x, st, sink) {
    const { theme: { o, u, font, base, lang }, look: { TITLE }, slot: s, page: { pg, pageIndex }, direction: { rtl }, known, measures: { freeExt } } = x, { rowLabels, rowLabelSkipped } = known;
    const { visual, query, Bt, tableText, smallEntry, box } = st, { note, out } = sink;
    let tableH = null, pending = null;
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
        // (P3-3 N21: by the font the report writes, the theme's, Semibold's rows apart; N21-LAB)
        const need = (pad, t = T) => tableHeight(n, t, TITLE, pad, t, (((o.theme || {}).textClasses || {}).label || {}).fontFace || font);   // (writer round 8: the one rule, pbip-sizing.js TABLE_ROWS)
        // Round 18 (FAIL 12: a 420 x 220 matrix at 1920 x 1080 showed three of seven days): a matrix whose rows do not
        // fit even tight takes the largest smaller text, down to Power BI's 8pt, that holds them (and told,
        // tableSmaller); only where even 8pt does not is it told that its last rows scroll (tableRows)
        // (round 19, item 10: a table too, with the same limits; its header keeps its grow-to-fit, the size is merged in)
        if (need(0) > s.h) {
          let t2 = Math.ceil(T) - 1; while (t2 > 8 && need(0, t2) > s.h) t2--;
          if (t2 >= 8 && need(0, t2) <= s.h) { const from = T; T = t2; (s.kind === 'matrix' ? ['values', 'columnHeaders', 'rowHeaders', 'total'] : ['values', 'columnHeaders', 'total']).forEach((k) => { visual.objects = visual.objects || {}; const e = (visual.objects[k] || [])[0]; if (e && e.properties) e.properties.fontSize = num(t2); else visual.objects[k] = obj({ fontSize: num(t2) }); });
            if (smallEntry) Object.assign(smallEntry, { size: t2, rows: true }); else note('tableSmaller', { page: pg.name || base, size: t2, from, rows: true }); }
        }
        if (need(1) > s.h) { visual.objects = visual.objects || {}; visual.objects.grid = [{ properties: Object.assign(((visual.objects.grid || [])[0] || {}).properties || {}, { rowPadding: num(0) }) }]; if (need(0) > s.h) note('tableRows', { page: pg.name || base, field: label(tf), rows: n, need: Math.ceil(need(0)), h: s.h }); }
      }
    }
    // the calendar order's helper column (see inOrder): its text in the card colour and as narrow as Desktop allows
    const oh = (s.kind === 'table' || s.kind === 'matrix') && query ? orderedBy(s.kind === 'matrix' ? (Bt.table || []).filter(Boolean) : tableFields(Bt, rtl)) : null;
    if (oh && oh.sortBy && s.kind === 'matrix') { visual.objects = visual.objects || {}; visual.objects.columnFormatting = visual.objects.columnFormatting || []; }
    if (oh && oh.sortBy) { const helperRef = orderHelper(oh).queryRef;
      visual.objects.columnFormatting.push({ properties: { fontColor: color(u.card), alignment: str('Right'), styleHeader: bool(true), styleValues: bool(true), styleTotal: bool(true) }, selector: { metadata: helperRef } });
      (visual.objects.columnWidth = visual.objects.columnWidth || []).push({ properties: { value: num(1) }, selector: { metadata: helperRef } });
      note('tableOrder', { page: pg.name || base, field: oh.t + '[' + oh.c + ']', by: oh.sortBy.t + '[' + oh.sortBy.c + ']' }); }
    // round 23: the name column at width 0 (hidden; the automatic widths stay on), its measure into the extensions
    if (rowLabel) {
      (visual.objects.columnWidth = visual.objects.columnWidth || []).push({ properties: { value: num(0) }, selector: { metadata: proj(rowLabel).queryRef } });
      const m = rlName;
      if (!rowLabels.some((x) => x.t === rowLabel.t && x.m === m)) note('rowLabels', pending = { page: pg.name || base, t: rowLabel.t, c: rowLabel.c, m, expression: rlExpr });
    } else if (s.kind === 'table' && query && rtl) {
      const tf = tableFields(Bt, rtl), f = tf.find(isTextField);
      if (f && tf.some(isValue) && !rowLabelSkipped.some((x) => x.t === f.t && x.c === f.c)) note('rowLabelSkipped', { page: pg.name || base, t: f.t, c: f.c });
    }
    // SVG columns (experimental; measured in Desktop 2.158, D-P1, 2026-10-04): report-level measures of
    // reportExtensions.json, shown as the last columns of the page's first table (the reading end: on a
    // right-to-left page that is the left, where the table's first projection sits)
    // Round 10 (measured in Desktop 2.158, third sitting of 2026-10-04): a picture is never the first projection.
    // Power BI writes the total row's "Total" in the first projection's column, and only when that is a column of
    // text, so in a right-to-left table with pictures the text column comes first, then the pictures, then the
    // measures. The picture's size is the table's grid.imageHeight and imageWidth (75 x 75 by default, which made
    // a 160 x 24 bar 11 tall in a row 77 tall): the tallest and the widest design, within Power BI's 8 to 512.
    if ((s.kind === 'table' || s.kind === 'matrix') && query && !known.svgDone) {
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
        out.svg = { w: W, h: H, design: wide, capped: W < wide };
        // Round 18 (the owner's answer, 6 Oct 2026: "yes drop the number under 40"; a 28-high ring's number could not
        // be read in Desktop): a ring drawn under 40 high takes its version without the number inside (the server's
        // expressionNoNumber); the table's value column carries the number
        // (the report's reportExtensions.json is the assembly's: it gives each such ring its version, and tells it, ringsSmall)
        if (H < 40 && known.extFile) mine.forEach((c) => { if (c.expressionNoNumber) out.rings.push({ t: c.t, m: c.m, expressionNoNumber: c.expressionNoNumber, h: H }); });
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
      const pitch = rowPitch(t, padOf), fixed = tableHeight(0, t, TITLE, padOf, ht, (((o.theme || {}).textClasses || {}).label || {}).fontFace || font), k0 = Math.floor((box.h - fixed) / pitch);
      if (!gp.imageHeight && k0 >= 1 && !(n && n <= k0)) { const h1 = Math.ceil(fixed + k0 * pitch); if (h1 < box.h) tableH = h1; }
    }
    return { tableH, pending };
  }

  // A table's column widths, after its fields are written (tt: its text size; rowLabels: the report's with this table's own)
  function fix(x, st) {
    const { theme: { o, font }, slot: s, page: { pg } } = x, { visual, Bt, tt, rowLabels } = st;
    const qs = visual.query.queryState, put = (object, props) => { visual.objects = visual.objects || {}; const e = visual.objects[object] || (visual.objects[object] = [{ properties: {} }]); Object.assign(e[0].properties, props); };
    // O-14: a table's columns get set widths (auto-size off: grow-to-fit let a long text push the numbers out of view):
    // numbers 90 to 130 by their header, the text columns share the rest (160 at least), all within the width less 36
    // (padding and the scrollbar); values wrap. The order's helper (1) and the hidden name column (0) keep theirs.
    if (s.kind === 'table') {
      const ps = qs.Values.projections, sc = pg.page.h / 1080, T = tt || +((((((o.theme || {}).visualStyles || {}).tableEx || {})['*'] || {}).values || [{}])[0].fontSize) || 10;
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
  }

  const api = { kpiRow, slicers, prepare, card, format, fix };
  if (node) module.exports = api; else root.DAPbipVisualTables = api;
})(typeof self !== 'undefined' ? self : this);
