/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's page buttons and filter panels (0.3.2 SP13, the split of pbip-page.js: the Codex split map, B-280):
// the tabs' layout, the header's plan (tabs, Power BI's navigator or single buttons, the Filters button), the header's
// page buttons, the filter rail or strip (its slicers and Reset) and the slide-in filter panel (Close, slicers, Reset).
// Each builder takes explicit read-only inputs (the theme, the metrics, the page's slots, the direction, the look, the
// binding, the pages) and returns its visuals' JSON in their order plus bookmarks and diagnostics. It writes no file and
// names no visual: an item says which name it needs by a ref ({ draw } asks for a name of its own, ref / nameRef /
// parentRef / ofRef / link / a bookmark's fields point at one), and pbip-page.js's write (the page assembly) draws every
// name and z in the order the items come, resolves the refs, pushes the bookmarks and the notes.
(function (root) {
  'use strict';
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery), Z = (typeof module !== 'undefined' && module.exports ? require('./pbip-sizing.js') : root.DAPbipSizing);
  const TM = (typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure);
  const { bool, color, contrast, label, mixHex, num, obj, shown, str } = Q;
  const { textWidth } = Z;
  const frozen = (o) => Object.freeze(Object.assign({}, o));
  // a bookmark a button applies, by ref: the assembly writes the bookmark's name in its place (the key keeps its place)
  const BM = (ref) => ({ ref });

  // The page buttons as tabs: input { pages: { PAGES, base }, theme: { font, title }, metrics: { pt, boxFit },
  // direction: { rtl }, pageH }; returns tabs(title, logo, x0, x1, H): their size and rows in the room between the end of
  // the title's text and the logo (or the Filters button: x0, x1), within a header H high; null when they don't fit even
  // at 8pt. (Taken out of the header's code in round 12 so the header can be tried one row taller first: see pbip-page.js
  // fitOf.) The title's text size comes from the slot's height before any growth (textH).
  function tabsLayout(input) {
    const pages = frozen(input.pages), theme = frozen(input.theme), metrics = frozen(input.metrics), direction = frozen(input.direction), pageH = input.pageH;
    const { PAGES, base } = pages, { font } = theme, { pt, boxFit } = metrics, { rtl } = direction;
    return (title, logo, x0, x1, H) => {
      const kk = pageH / 1080, gap = 24 * kk, th = title.textH || title.h;
      const names = PAGES.map((p) => String(p.name || base)), titleSize = Math.min(pt(th * 0.42), boxFit(th));
      const titleNeed = Math.min(title.w, Math.ceil(textWidth(shown(theme.title || base), titleSize, true, font) + 24 * kk));
      // the room: between the end of the title's text and the logo (or the Filters button). The title's text is at the
      // reading start of its box, so room inside the box is taken only where the box's free end faces the logo
      const titleLeft = title.x < logo.x;
      const a0 = titleLeft ? (rtl ? title.x + title.w + gap : title.x + titleNeed + gap) : (rtl ? x0 : logo.x + logo.w + gap);
      const a1 = titleLeft ? (rtl ? logo.x - gap : x1) : (rtl ? title.x + title.w - titleNeed - gap : title.x - gap);
      const room = a1 - a0, padX = 8 * kk, gapB = Math.round(12 * kk), lineH = Math.max(2, Math.round(3 * kk));
      const rowH = (t) => TM.buttonH(t) + (/^segoe ui/i.test(font) ? 0 : 4) + lineH;
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
  }

  // The header's plan, page navigation between the title and the logo when the report has more than one page: input
  // { slots: { title, logo, panel }, pages: { PAGES, base, name }, theme: { W, LABEL }, metrics: { k, pt, charW, buttonH },
  // direction: { rtl }, tabs (tabsLayout's) }; returns { tabs, nav, openBtn, diagnostics: { noPageButtons } }
  function headerPlan(input) {
    const slots = frozen(input.slots), pages = frozen(input.pages), theme = frozen(input.theme), metrics = frozen(input.metrics), direction = frozen(input.direction), tabsAt = input.tabs;
    const { title, logo, panel } = slots, { PAGES, base } = pages, { W, LABEL } = theme, { k, pt, charW, buttonH } = metrics, { rtl } = direction;
    let nav = null, openBtn = null, tabs = null;
    const noPageButtons = [];
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
      if (PAGES.length > 1) tabs = tabsAt(title, logo, x0, x1, title.h);
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
          const need1 = (t1) => Math.ceil(0.45 * 4 / 3 * t1 * longest + 16 * k), fits = (t1, w1) => need1(t1) <= (w1 - 40 * k) / n && buttonH(t1) <= title.h;
          let t1 = pt(title.h * 0.3);
          const w1 = Math.min(x1 - x0, n * Math.max(140 * k, need1(t1)) + 40 * k);
          while (t1 > 8 && !fits(t1, w1)) t1--;
          if (fits(t1, w1)) nav = { x: x0, y: title.y, w: w1, h: title.h, t: t1, buttons: true };
        }
      }
      // Round 11 (seen in Desktop, 5 Oct: eight long names on a 1280 x 720 page with a 32-high header): when the names
      // fit neither as tabs nor in the navigator, the page gets no page buttons (a cut name is worse). That is told.
      if (PAGES.length > 1 && !tabs && !nav) noPageButtons.push({ page: pages.name || base });
    }
    return { tabs, nav, openBtn, diagnostics: { noPageButtons } };
  }

  // The header's page buttons, after the title in the reading order, and the Filters button: input { plan (headerPlan's),
  // slots: { title }, pages: { PAGES, base, name, pageIndex }, theme: { u, W, font, LABEL }, metrics: { k },
  // direction: { rtl }, look: { frame, def }, parent (the header group's name) }; returns { items, diagnostics: { tabRows } }
  function pageButtons(input) {
    const plan = frozen(input.plan), slots = frozen(input.slots), pages = frozen(input.pages), theme = frozen(input.theme), metrics = frozen(input.metrics), direction = frozen(input.direction), look = frozen(input.look), parent = input.parent;
    const { tabs, nav, openBtn } = plan, { title } = slots, { PAGES, base, pageIndex } = pages, { u, W, font, LABEL } = theme, { k } = metrics, { rtl } = direction, { frame, def } = look;
    const items = []; let tabRows = null;
    // the page navigator follows the title in the reading order; its text size is set for the default, hover and
    // selected states (the current page's button is the selected one, and would otherwise show Power BI's own size)
    if (tabs) {
      const total = tabs.rows.length * tabs.rowH, y0 = title.y + (title.h - total) / 2, accent = u.accent || u.text;
      // the mark keeps the accent colour only where it can be read on the card (3:1 for bold text and a line)
      const mark = contrast(accent, u.card) >= 3 ? accent : u.text, muted = mixHex(u.text, u.card, 0.3);
      // (round 12, #6; seen in Desktop 2.158, round 11: two rows both ending at the logo's side did not line up):
      // the rows share one block, as wide as the widest row, at the logo's side; every row starts at its reading start
      const rowW = (row) => row.reduce((a, i) => a + tabs.ws[i], 0) + tabs.gapB * (row.length - 1), maxW = Math.max(...tabs.rows.map(rowW));
      if (tabs.rows.length > 1) tabRows = { page: pages.name || base, rows: tabs.rows.length, size: tabs.t };
      tabs.rows.forEach((row, r) => {
        // the block sits at the logo's side of the room; in it the first page is at the reading start: leftmost in
        // English, rightmost in Arabic
        const left = tabs.toLogo === 'right' ? tabs.a1 - maxW : tabs.a0;
        let x = rtl ? left + maxW : left;
        row.forEach((i) => {
          const p = PAGES[i], bw = tabs.ws[i], bx = Math.round(rtl ? x - bw : x), current = i === pageIndex, name = String(p.name || base), by = Math.round(y0 + r * tabs.rowH), bh = tabs.rowH - tabs.lineH;
          items.push({ ref: 'tab' + i, x: bx, y: by, w: bw, h: bh, parent, kind: 'navbtn',
            visual: { visualType: 'actionButton',
              objects: { icon: def({ shapeType: str('blank') }),
                text: def({ show: bool(true), text: str(name), fontColor: color(current ? mark : muted), fontFamily: str(font), fontSize: num(tabs.t), bold: bool(current) }).concat(current ? [] : [{ properties: { fontColor: color(mark) }, selector: { id: 'hover' } }]),
                fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
              visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
          if (current) {
            items.push({ x: Math.round(bx + 4 * k), y: by + bh, w: Math.max(4, Math.round(bw - 8 * k)), h: tabs.lineH, parent, kind: 'navline', ofRef: 'tab' + i,
              visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: str('rectangle') } }], fill: def({ show: bool(true), fillColor: color(mark), transparency: num(0) }), outline: def({ show: bool(false) }) },
                visualContainerObjects: frame(null, '') } });
          }
          x = rtl ? x - bw - tabs.gapB : x + bw + tabs.gapB;
        });
      });
    } else if (nav && nav.buttons) {
      // one button per page, in the navigator's box, first page at the right; the current page's filled in the text
      // colour with bold text in the card colour, the others outlined (the navigator's own look)
      const n = PAGES.length, gap = 8 * k, bw = (nav.w - gap * (n - 1)) / n;
      PAGES.forEach((p, i) => {
        const current = i === pageIndex, name = String(p.name || base);
        items.push({ x: Math.round(nav.x + nav.w - (i + 1) * bw - i * gap), y: nav.y, w: Math.round(bw), h: nav.h, parent, kind: 'navbtn',
          visual: { visualType: 'actionButton',
            objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(name), fontColor: color(current ? u.card : u.text), fontFamily: str(font), fontSize: num(nav.t), bold: bool(current) }),
              fill: def({ show: bool(true), fillColor: color(current ? u.text : u.card), transparency: num(0) }), outline: def({ show: bool(true), lineColor: color(u.text) }) },
            visualContainerObjects: Object.assign(frame(null, name), { visualLink: obj({ show: bool(true), type: str('PageNavigation'), navigationSection: str(p.id) }) }) } });
      });
    } else if (nav) {
      items.push({ x: Math.round(nav.x), y: nav.y, w: Math.round(nav.w), h: nav.h, parent, kind: 'nav',
        visual: { visualType: 'pageNavigator', objects: { text: ['default', 'hover', 'selected'].map((id) => ({ properties: { fontSize: num(nav.t) }, selector: { id } })) }, visualContainerObjects: frame(null, W.pages || 'Pages') } });
    }
    if (openBtn) {
      // the two bookmarks that show and hide the slide-in panel (filterPanel's), drawn before the button
      items.push({ draw: 'open' }, { draw: 'close' });
      items.push({ x: openBtn.x, y: openBtn.y, w: openBtn.w, h: openBtn.h, parent, kind: 'button', noPhone: true, link: true,
        visual: { visualType: 'actionButton',
          objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(openBtn.text), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }),
            // (round 16, design finding #23: it was the only boxed control in a header of boxless tabs: no box, no outline;
            // the icon and the word in the text colour, as the tabs)
            fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
          visualContainerObjects: Object.assign(frame(null, W.openFilters || 'Open the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: BM('open') }) }) } });
    }
    return { items, diagnostics: { tabRows } };
  }

  // the slicers a filter panel holds: the binding's three, or on a user's own model the ones it has a column for (each
  // one left out is told)
  const slicerFields = (B, own, W, page) => {
    const all3 = [0, 1, 2].map((i) => (B && B.slicers && B.slicers[i]) || null), fields = B && own ? all3.filter(Boolean) : all3.slice(), leftOut = [];
    all3.forEach((f, i) => { if (B && own && !f) leftOut.push({ page, kind: 'slicer', title: (W.slicer || 'Slicer') + ' ' + (i + 1) }); });
    return { fields, leftOut };
  };

  // The filter slot: several dropdown slicers and a Reset button, stacked in a side panel (a rail), side by side in a top
  // strip. input { slot, pages: { PAGES, base, name, id }, theme: { W, SLICER_TEXT }, metrics: { k, slicerH, resetW,
  // resetFit }, direction: { rtl }, binding: { B, own }, look: { frame, def, resetIcon, resetLook, resetFill, resetTip,
  // slicerVisual, stackHeights }, parent (the filters group's name) }; returns { items, bookmarks, diagnostics: { leftOut } }
  // (an item with slicer: true is one of the page's slicers; a bookmark's targets 'slicers': the page's slicers so far)
  function filterRail(input) {
    const pages = frozen(input.pages), theme = frozen(input.theme), metrics = frozen(input.metrics), direction = frozen(input.direction), binding = frozen(input.binding), look = frozen(input.look), s = input.slot, parent = input.parent;
    const { PAGES, base } = pages, { W, SLICER_TEXT } = theme, { k, slicerH, resetW, resetFit } = metrics, { rtl } = direction, { B, own } = binding;
    const { frame, def, resetIcon, resetLook, resetFill, resetTip, slicerVisual, stackHeights } = look;
    const items = [], bookmarks = [];
    // (sizes from 1920 x 1080 scaled by k; Reset as wide or as high as its text needs, slicers the height a dropdown needs)
    // (on a user's own model a slicer the model has no column for is left out and told, and the others share the room)
    const { fields, leftOut } = slicerFields(B, own, W, pages.name || base), pad = 10 * k, gap = 8 * k, n = Math.max(1, fields.length);
    const resetText = W.reset || 'Reset filters';
    const bw = resetW(resetText, k, s.w - 2 * pad);
    const reset = resetFit(resetText, bw, k), bh = reset.h;
    // Round 13 (seen in Desktop 2.158, 6 Oct 2026, "AK EN light": a hand-placed 444 x 310 slot, wider than high,
    // held three dropdowns 100 wide beside Reset, their headers cut to "Q…", "Da…"): the slot is a strip only when
    // each dropdown gets 160k at least; a slot too narrow for that stacks them like a rail where its height holds
    // them (a slot that holds them neither way stays a strip, as before).
    const stripW = (s.w - 2 * pad - bw - gap - gap * (n - 1)) / n, stackH = n * slicerH(SLICER_TEXT) + gap * n + bh + 2 * pad;
    const across = !s.stack && s.w > s.h && (stripW >= 160 * k || stackH > s.h);
    // (0.3.1 SQ1, M1-S4: a 240 x 80 strip gave its two Arabic slicers -5 each beside a 227 Reset) a strip never writes a
    // slicer narrower than SLICER_MIN (Desktop draws one 24 wide as a sliver, and one with a negative width not at all:
    // DESKTOP-TESTS.md, round 23's facts): the Reset button is left out first, then slicers from the last; each is told
    // (narrow). A slot that holds them is as before.
    const SLICER_MIN = 24;
    let withReset = true;
    const roomOf = () => (across ? (withReset ? s.w - 2 * pad - bw - gap : s.w - 2 * pad) : s.w - 2 * pad);   // (the same sums as before, to the last bit)
    const swOf = () => (across ? (roomOf() - gap * (fields.length - 1)) / Math.max(1, fields.length) : roomOf());
    if (across && swOf() < SLICER_MIN) { withReset = false; leftOut.push({ page: pages.name || base, kind: 'reset', title: resetText, narrow: true }); }
    while (across && fields.length && swOf() < SLICER_MIN) { const i = fields.length - 1, f = fields.pop(); leftOut.push({ page: pages.name || base, kind: 'slicer', title: label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1), narrow: true }); }
    // (0.3.1 TW1, SQ1-S2: a 60 x 80 slot, higher than wide, put its second slicer at y 88, under the slot) stacked, the
    // slicers (each the height a dropdown needs, slicerH) and the Reset button hold the slot's height: the Reset is left
    // out first, then slicers from the last, each told (narrow, short); the first slicer stays, as high as the slot gives it,
    // as a strip keeps one SLICER_MIN wide. A slot that holds them is as before (the same sums).
    const SH = slicerH(SLICER_TEXT), stackNeed = () => fields.length * SH + (withReset ? bh + gap * fields.length : gap * (fields.length - 1)) + 2 * pad;
    if (!across && fields.length && stackNeed() > s.h) { withReset = false; leftOut.push({ page: pages.name || base, kind: 'reset', title: resetText, narrow: true, short: true }); }
    while (!across && fields.length > 1 && stackNeed() > s.h) { const i = fields.length - 1, f = fields.pop(); leftOut.push({ page: pages.name || base, kind: 'slicer', title: label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1), narrow: true, short: true }); }
    const sw = swOf(), nn = Math.max(1, fields.length), stackRoom = withReset ? s.h - 2 * pad - bh - gap * n : s.h - 2 * pad - gap * (nn - 1);
    const sh = across ? s.h - 2 * pad : withReset ? Math.max(SH, Math.min(76 * k, (s.h - 2 * pad - bh - gap * n) / n)) : Math.min(stackRoom / nn, Math.max(SH, Math.min(76 * k, stackRoom / nn)));
    // (0.3.0 F2) stacked, a pill slicer gets the height measured for it (pillH) where the rail has room, else its share
    // of what is left; a strip keeps its height (the pills' text, then the dropdown, decide in slicerVisual)
    const hs = across ? fields.map(() => sh) : stackHeights(fields, sh, stackRoom);
    let yAt = s.y + pad;
    fields.forEach((f, i) => {
      // in a right-to-left report the first slicer is the rightmost one, so tab order follows the reading
      const x = across ? (rtl ? s.x + s.w - pad - sw - i * (sw + gap) : s.x + pad + i * (sw + gap)) : s.x + pad, y = across ? s.y + pad : yAt;
      yAt += hs[i] + gap;
      const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
      items.push({ slicer: true, x: Math.round(x), y: Math.round(y), w: Math.round(sw), h: Math.round(hs[i]), parent, kind: 'slicer',
        visual: slicerVisual(f, ttl, Math.round(sw), Math.round(hs[i])) });
    });
    if (!withReset) return { items, bookmarks, diagnostics: { leftOut } };
    // Reset button: applies a bookmark that clears these slicers
    // (across: at the end of the strip; in a rail: at the reading start, lined up with the slicers)
    const bx = across ? (rtl ? s.x + pad : s.x + s.w - pad - bw) : (rtl ? s.x + s.w - pad - bw : s.x + pad), by = across ? s.y + (s.h - bh) / 2 : s.y + s.h - pad - bh;
    items.push({ draw: 'reset' });
    items.push({ x: Math.round(bx), y: Math.round(by), w: Math.round(bw), h: Math.round(bh), parent, kind: 'button', link: true,
      visual: { visualType: 'actionButton',
        objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
          fill: resetFill(), outline: def({ show: bool(false) }) },
        visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: BM('reset') }) }) } });
    bookmarks.push({ name: 'reset', page: pages.id, targets: 'slicers', label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pages.name || '') : '') });
    return { items, bookmarks, diagnostics: { leftOut } };
  }

  // The slide-in filter panel: one hidden group over the page (card, slicers, Reset, Close); two display-only bookmarks
  // ('open' and 'close', drawn with the Filters button: pageButtons) show and hide it, so the user's slicer selections
  // stay when it opens and closes. input { slots: { panel }, pages: { PAGES, base, name, id }, theme: { u, W, font, LABEL,
  // SLICER_TEXT, edge }, metrics: { k, pt, charW, buttonH, slicerH, resetW, resetFit }, direction: { rtl }, binding:
  // { B, own }, look: { frame, def, textbox, resetIcon, resetLook, resetFill, resetTip, slicerVisual, stackHeights } };
  // returns { items, bookmarks, diagnostics: { leftOut } } (the group's item has zAtLeast: it sits over the page)
  function filterPanel(input) {
    const slots = frozen(input.slots), pages = frozen(input.pages), theme = frozen(input.theme), metrics = frozen(input.metrics), direction = frozen(input.direction), binding = frozen(input.binding), look = frozen(input.look);
    const P = slots.panel, { PAGES, base } = pages, { u, W, font, LABEL, SLICER_TEXT, edge } = theme, { k, pt, charW, buttonH, slicerH, resetW, resetFit } = metrics, { rtl } = direction, { B, own } = binding;
    const { frame, def, textbox, resetIcon, resetLook, resetFill, resetTip, slicerVisual, stackHeights } = look;
    const items = [], bookmarks = [], kids = [];
    // (sizes from 1920 x 1080 scaled by k; Close and Reset as big as their text needs, slicers the height a dropdown needs)
    const pad = 16 * k, gap = 10 * k, sw = P.w - 2 * pad;
    // Close is as high as a button's text needs (Arabic: 6 + 1.6 x pt), and the panel's header holds it above the slicers
    const ch = Math.ceil(Math.max(32 * k, buttonH(LABEL))), head = Math.max(44 * k, 12 * k + ch);
    const resetText = W.reset || 'Reset filters', closeText = '✕  ' + (W.close || 'Close');
    const rw = resetW(resetText, k, Math.round(sw)), reset = resetFit(resetText, rw, k), bh = reset.h;
    // (round 12, round 9's seen-not-in-scope: on a user's own model a slicer the model has no column for is left out
    // of the panel and told, as in the rail; the panel wrote all three before, the extra ones without a field)
    const { fields, leftOut } = slicerFields(B, own, W, pages.name || base);
    items.push({ draw: 'panel' });
    items.push({ zAtLeast: 900000, nameRef: 'panel', x: P.x, y: P.y, w: P.w, h: P.h, hidden: true, kind: 'group', groupKey: 'panel', group: { displayName: W.filterPanel || 'Filter panel', groupMode: 'ScaleMode' } });
    const add1 = (spec) => { const ref = 'kid' + kids.length; kids.push(ref); items.push(Object.assign({ ref, parentRef: 'panel', noPhone: true }, spec)); return ref; };
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
    add1({ x: cx, y: Math.round(P.y + 10 * k), w: cw, h: ch, kind: 'button', link: true, visual: { visualType: 'actionButton',
      objects: { icon: def({ shapeType: str('blank') }), text: def({ show: bool(true), text: str(closeText), fontColor: color(u.text), fontFamily: str(font), fontSize: num(LABEL) }), fill: def({ show: bool(false) }), outline: def({ show: bool(false) }) },
      visualContainerObjects: Object.assign(frame(null, W.closeFilters || 'Close the filter panel'), { visualLink: obj({ show: bool(true), type: str('Bookmark'), bookmark: BM('close') }) }) } });
    // slicers stacked, then Reset at the bottom
    const sh = Math.max(slicerH(SLICER_TEXT), Math.min(76 * k, (P.h - head - pad - bh - gap * (fields.length + 1)) / Math.max(1, fields.length))), names = [];
    // (0.3.0 F2) a pill slicer the height measured for it where the panel has room (stackHeights)
    const hs = stackHeights(fields, sh, P.h - head - pad - bh - gap * (fields.length + 1));
    let yAt = P.y + head + 8 * k;
    fields.forEach((f, i) => {
      const ttl = label(f) || (W.slicer || 'Slicer') + ' ' + (i + 1);
      const ref = add1({ x: Math.round(P.x + pad), y: Math.round(yAt), w: Math.round(sw), h: Math.round(hs[i]), kind: 'slicer',
        visual: slicerVisual(f, ttl, Math.round(sw), Math.round(hs[i])) });
      yAt += hs[i] + gap;
      names.push(ref);
    });
    items.push({ draw: 'panelReset' });
    add1({ x: Math.round(rtl ? P.x + pad + sw - rw : P.x + pad), y: Math.round(P.y + P.h - pad - bh), w: rw, h: bh, kind: 'button', link: true, visual: { visualType: 'actionButton',
      objects: { icon: def(resetIcon(reset)), text: def(resetLook(resetText, reset)),
        fill: resetFill(), outline: def({ show: bool(false) }) },
      visualContainerObjects: Object.assign(frame(null, resetText), { visualLink: obj({ show: bool(true), type: str('Bookmark'), enabledTooltip: str(resetTip), bookmark: BM('panelReset') }) }) } });
    bookmarks.push({ name: 'panelReset', page: pages.id, targets: names, label: (W.reset || 'Reset filters') + (PAGES.length > 1 ? ' · ' + (pages.name || '') : '') });
    const suffix = PAGES.length > 1 ? ' · ' + (pages.name || '') : '';
    bookmarks.push({ name: 'open', page: pages.id, targets: ['panel'].concat(kids), group: 'panel', hidden: false, label: (W.filtersOpen || 'Filters open') + suffix });
    bookmarks.push({ name: 'close', page: pages.id, targets: ['panel'].concat(kids), group: 'panel', hidden: true, label: (W.filtersClosed || 'Filters closed') + suffix });
    return { items, bookmarks, diagnostics: { leftOut } };
  }

  const api = { tabsLayout, headerPlan, pageButtons, filterRail, filterPanel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipNavigation = api;
})(typeof self !== 'undefined' ? self : this);
