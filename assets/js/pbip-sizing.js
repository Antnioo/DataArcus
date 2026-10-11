/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's sizes (0.2.9, audit 3's A3-12): text widths by their letters (measured in Desktop), a table's
// columns by their room, and make(): the sizes that follow a report's font and label size. Every number here was
// measured in Power BI Desktop (scripts/tests/DESKTOP-TESTS.md) unless its comment says it is a guess.
(function (root) {
  'use strict';
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery);
  const { catKind, isTextField, isValue, namesOf, tproj } = Q;
  // The width of one line of text in page units (measured in Power BI Desktop 2.158, DESKTOP-TESTS.md round 10): the
  // width depends on the letters, not on their count ("Executive summary" 0.49 em a character, "Reset filters" 0.38),
  // so Latin text is added up from Segoe UI's letter widths (within 5% of the measured widths, on the safe side), bold
  // is 1.09 x, and an Arabic letter counts 0.55 em (0.62 bold; Tahoma measured 0.53 and up to 0.60). 3% is added.
  const LETTER = { a: 0.51, b: 0.59, c: 0.46, d: 0.59, e: 0.52, f: 0.31, g: 0.59, h: 0.57, i: 0.24, j: 0.24, k: 0.5, l: 0.24, m: 0.86, n: 0.57, o: 0.59, p: 0.59, q: 0.59, r: 0.35, s: 0.42, t: 0.34, u: 0.57, v: 0.48, w: 0.72, x: 0.46, y: 0.48, z: 0.45,
    A: 0.65, B: 0.57, C: 0.62, D: 0.7, E: 0.51, F: 0.49, G: 0.69, H: 0.71, I: 0.27, J: 0.36, K: 0.58, L: 0.47, M: 0.9, N: 0.75, O: 0.75, P: 0.56, Q: 0.75, R: 0.6, S: 0.53, T: 0.52, U: 0.69, V: 0.62, W: 0.93, X: 0.59, Y: 0.55, Z: 0.57,
    ' ': 0.27, '.': 0.22, ',': 0.22, ':': 0.22, ';': 0.22, '\'': 0.2, '!': 0.28, '|': 0.24, '-': 0.4, '(': 0.3, ')': 0.3, '/': 0.39, '&': 0.8, '%': 0.82, '+': 0.68, '·': 0.22 };
  // Round 13 (measured in Desktop 2.158, 6 Oct 2026, "R12 CI AR 1080": bold 17pt titles in Tahoma, ink in page units):
  // Latin text in Tahoma is wider than the Segoe UI table gives ("Total Sales" 123.7 for 119.4 worked out, "Conversion
  // Rate" 185.2 for 183.0), and "Growth vs Last Year", worked out at 219.9 for a room of 220, was cut by Desktop. So
  // Latin letters, digits and marks count 6% more in Tahoma (TAHOMA_LATIN); Arabic letters were measured in Tahoma.
  const TAHOMA_LATIN = 1.06;
  function textWidth(text, t, bold, font) {
    let em = 0;
    const wide = /tahoma/i.test(String(font || '')) ? TAHOMA_LATIN : 1;
    for (const ch of String(text == null ? '' : text)) {
      const c = ch.codePointAt(0);
      if (c === 0x200E || c === 0x200F) continue;   // direction marks have no width
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB50 && c <= 0xFEFF)) em += bold ? 0.62 : 0.55;
      else if (c >= 0x30 && c <= 0x39) em += 0.54 * (bold ? 1.09 : 1) * wide;
      else if (LETTER[ch] != null) em += LETTER[ch] * (bold ? 1.09 : 1) * wide;
      else em += (c < 0x2000 ? 0.62 : 1) * (bold ? 1.09 : 1) * wide;
    }
    return em * t * 4 / 3 * 1.03;
  }
  // A text shortened with "…" (KPI, chart and table titles, slicer headers). Round 13 (seen in Desktop 2.158, 6 Oct
  // 2026, "G6 Long AR" on round 12's titles): after Arabic words the "…" was drawn at the right end of the line, the
  // reading start, so the title looked cut at its beginning (a visual's title is a left-to-right paragraph, and a
  // closing mark with no direction of its own goes to that paragraph's end). With a right-to-left mark (U+200F)
  // after it the "…" was drawn at the left, where the Arabic line ends. Latin text gets none.
  const cutAt = (s) => s + '…' + (/[\u0590-\u08FF\uFB1D-\uFEFC]/.test(s) ? '\u200F' : '');
  // The room a table column takes beside SVG pictures, in page units, at the table's text size t: its header (bold) or
  // its widest value, + 10 (a cell's padding is not measured yet: the measured button rule, 5 a side, stands in). A
  // measure's widest value is taken as nine digits with separators ("888,888,888", 0.54 em a digit and 0.21 a
  // separator, measured in round 10); a column's values are not known to the writer, so 12 letters at 0.55 em.
  // (0.2.9, audit 3's seen B-06: names, the column's values where they are known, a day or month name's family: its
  // widest name, not 12 letters)
  const columnRoom = (p, t, font, names) => {
    const head = textWidth(p.displayName || p.nativeQueryRef || '', t, true, font);
    const value = p.field && (p.field.Measure || p.field.Aggregation) ? (9 * 0.54 + 2 * 0.21) * t * 4 / 3 : names && names.length ? Math.max(...names.map((x) => textWidth(x, t, false, font))) : 12 * 0.55 * t * 4 / 3;
    return Math.ceil(Math.max(head, value) + 10);
  };
  // a bound field's room in a table: its projection's, with its known names (a day or month name; catKind, namesOf)
  const fieldRoom = (f, t, font) => { const k = isTextField(f) && catKind(f), names = k && (k.kind === 'day' || k.kind === 'month') ? namesOf(f, k.kind) : null; return columnRoom(tproj(f), t, font, names); };
  // 0.2.9 part 2 (O-4) and the cross-review's G8: the share of a bar chart's width its category names get
  // (categoryAxis.maxMarginFactor). Measured on the laptop (REPORT-FIXES-LAB B1/B2, Desktop 2.158.1304, 10 Oct): a chart
  // 508 wide on a 1080-high page cut names at about 10 characters with the default 25; 40 held about 20, 50 about 25.
  // BAR_NARROW_720 = 560 (in 720-high units) is a GUESS, not measured: under it a chart is as narrow as the measured one
  // or a little wider and takes 50; at and over it 40, which leaves the bars about 60% (only 508 wide was measured).
  const BAR_NARROW_720 = 560;
  const barNameShare = (w, pageH) => (w * 720 / pageH < BAR_NARROW_720 ? 50 : 40);
  // Round 11 (seen in Desktop 2.158, 5 Oct 2026: on a 960 x 720 page a table of a text column and three measures was
  // wider than its box, a header cut and a column off the box behind a scrollbar; at 1920 x 1080 too with four long
  // measure names). A table holds only the fields its width has room for, by the rule its pictures already follow
  // (columnRoom): the first text column and the first measure always, then the others in their order while they fit;
  // the first that does not fit and every field after it are left out of that table (and told: tableColumns).
  const tableFit = (fields, width, t, font) => {
    const fs = (fields || []).filter(Boolean);
    if (fs.length <= 2) return { kept: fs, leftOut: [] };
    const room = (f) => fieldRoom(f, t, font), must = [fs.find(isTextField), fs.find(isValue)].filter(Boolean);
    let used = must.reduce((a, f) => a + room(f), 0), full = false;
    const kept = [], leftOut = [];
    fs.forEach((f) => { if (must.includes(f)) return void kept.push(f); if (!full && used + room(f) <= width) { used += room(f); kept.push(f); } else { full = true; leftOut.push(f); } });
    return { kept, leftOut };
  };

  // The sizes that depend on a report's font and its label size (LABEL): the cards, the buttons, the text boxes, the
  // titles that wrap or are shortened. make({ font, LABEL })
  function make(c) {
    const {
      LABEL, font
    } = c;
    // n: the title's lines (1, or 2 for a KPI title that wraps, see kpiTitleFit); img: the width an image beside the value takes
    const cardFit = (w, h, s, title, callout, m, em, n, img) => {
      const P = Math.round(8 * s / 1.5), line = (f) => Math.ceil(f * 1.5) * (n || 1), S = (m && m.side) || P;
      const T = m && m.top > P && Math.floor((h - m.top - P - line(title)) / 1.5) >= 8 ? m.top : P;
      const fit = (I) => Math.min(callout, Math.floor((h - T - P - 2 * I - line(title)) / 1.5), Math.floor((w - S - P - 2 * I - (img || 0)) / ((em || AUTO_EM) * 4 / 3)));
      let I = P, V = fit(I);
      if (V < 8) { I = 0; V = Math.max(8, fit(0)); }
      return { P, I, V, T, S };
    };
    // Sizes of the header, page buttons, filter rail and slide-in panel were made on a 1920 x 1080 page: they scale with
    // the page (k = page height / 1080), as cardFit does, and text follows the page within Power BI's limits (8-60pt).
    // Where the 8pt minimum makes a text bigger than its scaled box (small pages), the box grows to fit the text.
    // Heights measured in Power BI Desktop 2.157 (scripts/tests/DESKTOP-TESTS.md, 2026-10-01), in page units (a point
    // size takes the same page units on any page): a text box needs 10 + 1.8 x pt per line (points to pixels 4/3, a line
    // about 1.35 of that, padding about 5 above and below), button text 2 + 1.6 x pt per line, the Reset icon 2.25 x pt,
    // a dropdown slicer (title and box) 16 + 4 x pt. Width: 0.55 em per character, in pixels (charW).
    // Buttons (measured on 2.158): Power BI never wraps a button's text, and its icon grows with the button's height
    // (about as wide as the button is high) and is drawn at the start. resetFit(text, w, k): a Reset button w wide is one
    // line high, max(40k, 6 + 1.6 x pt) (Arabic text needs 4 more than English: 19 at 8pt, 30 at 15pt), and keeps its icon only where the text (0.45 em per character, measured 0.40-0.41)
    // and the icon fit side by side; otherwise the icon is left out rather than drawn over the text.
    // pt(t): a size within 8-60pt. LABEL: button text, the theme's label size.
    const pt = (t) => Math.max(8, Math.min(60, Math.round(t))), charW = (t) => t * 0.55 * 4 / 3;
    const boxH = (t, n) => Math.ceil(10 + 1.8 * t * (n || 1)), buttonH = (t, n) => Math.ceil(2 + 1.6 * t * (n || 1));
    const iconH = (t) => Math.ceil(2.25 * t), slicerH = (t) => Math.ceil(16 + 4 * t);
    // Round 10: the text's width is taken from its letters (textWidth), and the button needs the text + 10 beside the icon.
    // Round 13 (seen in Desktop 2.158, 6 Oct 2026, on round 12's buttons: with icon.placement written Desktop draws the
    // arrow at its own small size, tight against the text, in English too). Measured by hand on a 40-high button:
    // iconSize is honoured (30 drew the arrow as large as before round 12); the icon's and the text's margins did
    // nothing (8L, 20L and 20D tried); two no-break spaces before the text give the gap the old button had. So the
    // arrow is three quarters of the button's height and the shown text starts with RESET_GAP (the button is as wide
    // as that text needs); the tooltip, the alt text and the bookmark keep the plain words.
    const RESET_GAP = '  ';
    const resetFit = (text, w, k) => {
      const h = Math.ceil(Math.max(40 * k, 6 + 1.6 * LABEL));
      return { h, icon: textWidth(RESET_GAP + text, LABEL, false, font) + 10 + h <= w };
    };
    // Reset is only as wide as its icon and its text (the owner's design choice 7, 5 Oct 2026; Desktop showed the icon at
    // one end of a 274-wide rail button and the text at the other): the icon as wide as the button is high, the text
    // + 10 (measured, M3), within the room it has
    const resetW = (text, k, room) => Math.min(room, Math.ceil(textWidth(RESET_GAP + text, LABEL, false, font) + 10 + Math.ceil(Math.max(40 * k, 6 + 1.6 * LABEL))));
    // the largest text size within 8-60 whose one line fits a text box h high (8 at least)
    const boxFit = (h) => Math.max(8, Math.floor((h - 10) / 1.8));
    // A text box is top-aligned and has no vertical alignment: the middle of its text is about 1.2 x pt below the box's
    // top (measured in Desktop 2.158, DESKTOP-TESTS.md round 1: Segoe UI 3 + 1.19 x pt, Tahoma 1.12 x pt). centred(s, t):
    // the slot's y and height with the box moved down so the text's middle is the slot's, as far as the text's own height
    // allows; unchanged when the text is already there (the title at 0.42 x its box).
    // (round 6: the font's own number, not one rule for both. With 1.2 x pt for every font the header's text sat about 3
    // below the middle in Segoe UI and up to 3 above it in Tahoma: the logo placeholder "drifted downwards". A font that
    // was not measured keeps 1.2 x pt.)
    const textMid = (t) => (/^segoe ui/i.test(font) ? 3 + 1.19 * t : /^tahoma/i.test(font) ? 1.12 * t : 1.2 * t);
    const centred = (s, t) => { const d = Math.min(Math.round(s.h / 2 - textMid(t)), s.h - boxH(t)); return d > 0 ? { y: s.y + d, h: s.h - d } : { y: s.y, h: s.h }; };
    const AUTO_EM = 4.4;   // (the widest automatic value, in em: see the cards' valueEm)
    // "Never cut" for a KPI title (the owner's rule, 5 Oct 2026). A title that doesn't fit one line even at the 8pt
    // minimum wraps to two lines (titleWrap) where the card has the height for both lines and its value at the size
    // the row's other cards have (a line is 1.5 x the size, Microsoft's card sizing, as in cardFit); otherwise it is shortened at a word, with
    // "…", and the full name stays the card's alt text and Power BI's own tooltip on the card (the field's name).
    // Wrapping is preferred: the reader sees the whole name. Both are told in kpiTitles. (The wrap itself and the
    // tooltip are to be proven in Desktop; titleWrap is the title's "Text wrap", in Microsoft's default theme.)
    const wrapLines = (text, size, avail) => { const out = []; let cur = ''; String(text).split(' ').forEach((w) => { const t = cur ? cur + ' ' + w : w; if (!cur || textWidth(t, size, true, font) <= avail) cur = t; else { out.push(cur); cur = w; } }); out.push(cur); return out; };
    const kpiTitleFit = (text, size, avail, c, two) => {
      if (text == null || textWidth(text, size, true, font) <= avail) return { mode: 'one' };
      const ls = wrapLines(text, size, avail);
      if (size === 8 && ls.length === 2 && ls.every((l) => textWidth(l, size, true, font) <= avail) && two && two.V >= c.V) return { mode: 'wrapped', c: Object.assign({}, two, { V: c.V }) };
      const words = String(text).split(' ');
      let shown = '';
      for (let n = words.length - 1; n >= 1 && !shown; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (textWidth(t, size, true, font) <= avail) shown = t; }
      if (!shown) { const ch = [...String(text)]; for (let n = ch.length - 1; n >= 1 && !shown; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) shown = t; } }
      return { mode: 'shortened', shown: shown || '…' };
    };
    const titleFit = (text, size, avail) => {
      if (text == null || textWidth(text, size, true, font) <= avail) return { mode: 'one', shown: text };
      const two = (t) => { const ls = wrapLines(t, size, avail); return ls.length <= 2 && ls.every((l) => textWidth(l, size, true, font) <= avail); };
      if (two(text)) return { mode: 'wrapped', shown: text };
      const words = String(text).split(' ');
      for (let n = words.length - 1; n >= 1; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (two(t)) return { mode: 'shortened', shown: t }; }
      const ch = [...String(text)];
      for (let n = ch.length - 1; n >= 1; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) return { mode: 'shortened', shown: t, one: true }; }
      return { mode: 'shortened', shown: '…', one: true };
    };
    // one line only, shortened at its end (a slicer's header, a phone title that two lines don't hold)
    const oneLine = (text, size, avail) => {
      if (text == null || textWidth(text, size, true, font) <= avail) return text;
      const words = String(text).split(' ');
      for (let n = words.length - 1; n >= 1; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (textWidth(t, size, true, font) <= avail) return t; }
      const ch = [...String(text)];
      for (let n = ch.length - 1; n >= 1; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) return t; }
      return '…';
    };
    return { cardFit, pt, charW, boxH, buttonH, iconH, slicerH, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines, kpiTitleFit, titleFit, oneLine };
  }

  const api = {
    fieldRoom, LETTER, TAHOMA_LATIN, textWidth, cutAt, columnRoom, BAR_NARROW_720, barNameShare, tableFit, make
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipSizing = api;
})(typeof self !== 'undefined' ? self : this);
