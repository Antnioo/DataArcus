/*! DataArcus Power BI Theme & Layout Generator | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The report writer's sizes (0.2.9, audit 3's A3-12): text widths by their letters (measured in Desktop), a table's
// columns by their room, and make(): the sizes that follow a report's font and label size. Every number here was
// measured in Power BI Desktop (scripts/tests/DESKTOP-TESTS.md) unless its comment says it is a guess.
(function (root) {
  'use strict';
  const Q = (typeof module !== 'undefined' && module.exports ? require('./pbip-query.js') : root.DAPbipQuery);
  const { catKind, isTextField, isValue, namesOf, tproj } = Q;
  // The width of one line of text (measured in Power BI Desktop 2.158, DESKTOP-TESTS.md round 10): one copy in
  // text-measure.js, shared with the measured rules (report-rules.js; audit 4's A4-5, 11 Oct 2026)
  const Measure = typeof module !== 'undefined' && module.exports ? require('./text-measure.js') : root.DataArcusTextMeasure;
  const { textWidth, LETTER, TAHOMA_LATIN } = Measure;
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
  // 0.2.9 rc1 (the laptop's PERF-COMPARE S1, S2: amounts wrapped onto a second line in number columns written 108 to 130
  // wide, and headers were cut with "..." in tables with free width): a table column's room is its header (bold) or its
  // widest value, whichever is wider, plus the cell's padding (24 at 1080, O-14's, scaled with the page). A number's widest
  // value is ten digits with separators (a total) with its format's sign, words and decimals where the field carries the
  // format (tableFormat, wholeFormat, cardFormat or the model's format); a measure whose format is not given is taken as
  // an amount with a sign and 2 decimals; a percent as -100.0%. A number is never given less, so it never wraps.
  const numberSample = (f) => {
    if (f.pct || f.pctFormat) return '-100.0%';
    const fmt = String(f.tableFormat || f.wholeFormat || f.cardFormat || f.format || '').split(';')[0];
    if (!fmt) return f.agg != null || f.num ? '-8,888,888,888' : '-$8,888,888,888.88';
    const dec = ((fmt.match(/\.([0#]+)/) || ['', ''])[1]).length, words = (fmt.match(/"[^"]*"|[$€£¥₹%]/g) || []).map((x) => x.replace(/"/g, '')).join('');
    return '-' + words + '8,888,888,888' + (dec ? '.' + '8'.repeat(dec) : '');
  };
  const cellRoom = (f, t, font, sc) => {
    const p = tproj(f), head = textWidth(p.displayName || p.nativeQueryRef || '', t, true, font), k = isTextField(f) && catKind(f);
    const names = k && (k.kind === 'day' || k.kind === 'month') ? namesOf(f, k.kind) : null;
    const value = isValue(f) || f.num ? textWidth(numberSample(f), t, false, font) : names ? Math.max(...names.map((x) => textWidth(x, t, false, font))) : 12 * 0.55 * t * 4 / 3;
    return Math.ceil(Math.max(head, value) + 24 * sc);
  };
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
  // (rc1: sc given, the page's scale, the room is cellRoom's, the one the column widths are written by)
  const tableFit = (fields, width, t, font, sc) => {
    const fs = (fields || []).filter(Boolean);
    if (fs.length <= 2) return { kept: fs, leftOut: [] };
    const room = (f) => (sc ? cellRoom(f, t, font, sc) : fieldRoom(f, t, font)), must = [fs.find(isTextField), fs.find(isValue)].filter(Boolean);
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
    // 0.2.9, the fuzz test's F-W1 (a measure name of 200,000 characters hung the writer: each shorter try was measured
    // again, a quadratic search): a title that does not fit is first cut to what its box could ever show, its first
    // characters up to three times the room (two lines and the space between them fit in less), measured as it is cut;
    // the search for the shortened title then runs on that, whatever the name's length. A text that fits is never cut.
    const bounded = (text, size, avail) => { let w = 0, out = ''; for (const ch of String(text)) { out += ch; w += textWidth(ch, size, true, font); if (w > 3 * avail + 2 * size) break; } return out; };
    const kpiTitleFit = (text, size, avail, c, two) => {
      if (text == null || textWidth(text, size, true, font) <= avail) return { mode: 'one' };
      text = bounded(text, size, avail);
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
      text = bounded(text, size, avail);   // (F-W1)
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
      text = bounded(text, size, avail);   // (F-W1)
      const words = String(text).split(' ');
      for (let n = words.length - 1; n >= 1; n--) { const t = cutAt(words.slice(0, n).join(' ').replace(/[\s,;:(\-–]+$/, '')); if (textWidth(t, size, true, font) <= avail) return t; }
      const ch = [...String(text)];
      for (let n = ch.length - 1; n >= 1; n--) { const t = cutAt(ch.slice(0, n).join('').trimEnd()); if (textWidth(t, size, true, font) <= avail) return t; }
      return '…';
    };
    return { cardFit, pt, charW, boxH, buttonH, iconH, slicerH, RESET_GAP, resetFit, resetW, boxFit, textMid, centred, AUTO_EM, wrapLines, kpiTitleFit, titleFit, oneLine };
  }

  // A table's height in rows (writer round 8, S3; one table of constants for the known-rows rule and the whole-rows rule).
  // In page units (px at 100%), t the values' text in pt, ht the header's (t when none of its own), title the visual title's
  // size, pad the grid's rowPadding (Desktop draws 1 when none is written), font the font the report writes (the theme's).
  // SOURCE: MEASURED in Power BI Desktop 2.158, dataarcus-engine lab/proof-0.2.9-rc1 business/beta/N21-LAB.md (13 Oct 2026,
  // P3-3 N21; PDF and screen agree to 0.3 px; the title on, 18pt at 15pt and 12pt at 10, 9 and 8pt):
  //   a row's pitch, the same in Segoe UI and Segoe UI Semibold: 8pt 18.0, 9pt 19.0, 10pt 20.0, 15pt 30.0 = max(2t, t + 10);
  //   the title and the header to the rule under it: regular 8pt 58.8, 9pt 59.9, 10pt 62.0, 15pt 90.0; Semibold 8pt 59.9,
  //   10pt 63.0, 15pt 92.0; the pinned total, its rule to the visual's bottom: regular 10pt 29.3, 15pt 40.2; Semibold 10pt
  //   30.3, 15pt 42.2 (so N whole rows need regular 130.2 + 30N at 15pt, 91.3 + 20N at 10pt; Semibold 134.2 + 30N, 93.3 + 20N).
  // Between the measured sizes (11-14pt; Semibold's 9pt) the header and the total's part over a row are interpolated
  // linearly; past 15pt they follow the 10-15pt line; a pinned total at 8 or 9pt was not measured and keeps 10pt's part
  // over its row. The title's own share is still S3's 2.275 x its size x 4 / 3 (MEASURE-TABLE-ROWS.md), so a title other than
  // the measured one moves the header by that. A row padding other than 1 moves every row (header and total too) by 2 x
  // (pad - 1), S3's measured 2 x pad. A font never measured (DIN, Arial, Tahoma ...) takes regular Segoe UI's numbers.
  // Each extra header line adds 26.9 at 15pt (measured; not used: the writer's columns hold their headers whole, S2).
  // (Before, P3-3: S3's fit, a pitch of 2t - 0.2 and fixed parts 127.3 at 15pt and 87.1 at 10pt, for every font: short by
  // 2.2 a row at 8pt, by 2.9 to 6.9 a table at 15pt, so the total line cut the last row (N21, D3, R3). Before S3: round 11's
  // 8pt measure, 1.415 x t x 4 / 3 + 2 x pad.)
  const TABLE_ROWS = { source: 'N21-LAB.md (Desktop 2.158, 13 Oct 2026)', titleK: 2.275,
    head: { regular: [[8, 58.8, 12], [9, 59.9, 12], [10, 62.0, 12], [15, 90.0, 18]], semibold: [[8, 59.9, 12], [10, 63.0, 12], [15, 92.0, 18]] },
    total: { regular: [[10, 29.3], [15, 40.2]], semibold: [[10, 30.3], [15, 42.2]] } };
  const pitch1 = (t) => Math.max(2 * t, t + 10), padBy = (pad) => 2 * ((pad == null ? 1 : pad) - 1);
  const face = (font) => (/semibold/i.test(String(font || '')) ? 'semibold' : 'regular');
  // a measured series [[size, value], ...] at t: held below its first size, linear between, along its last line past its end
  const along = (pts, t) => { if (t <= pts[0][0]) return pts[0][1]; let i = 1; while (i < pts.length - 1 && t > pts[i][0]) i++;
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; return y0 + (y1 - y0) * (t - x0) / (x1 - x0); };
  const titlePart = (title) => TABLE_ROWS.titleK * title * 4 / 3;
  const rowPitch = (t, pad) => pitch1(t) + padBy(pad);
  // the title and the header block, to the rule where row 1 starts
  const tableHead = (ht, title, pad, font) => titlePart(title) + along(TABLE_ROWS.head[face(font)].map(([x, y, ti]) => [x, y - titlePart(ti)]), ht) + padBy(pad);
  // the pinned total block: its row and what is under it
  const tableTotal = (t, pad, font) => rowPitch(t, pad) + along(TABLE_ROWS.total[face(font)].map(([x, y]) => [x, y - pitch1(x)]), t);
  // the height that shows a table's n rows and its total whole
  const tableHeight = (n, t, title, pad, ht, font) => tableHead(ht || t, title, pad, font) + n * rowPitch(t, pad) + tableTotal(t, pad, font);
  const api = {
    TABLE_ROWS, rowPitch, tableHeight, cellRoom, numberSample, fieldRoom, LETTER, TAHOMA_LATIN, textWidth, cutAt, columnRoom, BAR_NARROW_720, barNameShare, tableFit, make
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAPbipSizing = api;
})(typeof self !== 'undefined' ? self : this);
