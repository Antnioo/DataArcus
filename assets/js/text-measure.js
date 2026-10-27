/*! DataArcus text measure | (c) 2026 DataArcus, dataarcus.com | All rights reserved. Not licensed for copying or reuse. */
// The measured width of a line of text, one copy for the report writer (pbip-export.js) and the measured rules
// (report-rules.js): audit 4's A4-5 (11 Oct 2026), the rules no longer load the writer to measure. Browser and Node
// (module.exports / window.DataArcusTextMeasure).
(function (root) {
  'use strict';
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
      if (c >= 0x2066 && c <= 0x2069) continue;     // (0.3.0 J18) nor the direction isolates the writer puts round a Latin run in Arabic text
      if ((c >= 0x0600 && c <= 0x06FF) || (c >= 0xFB50 && c <= 0xFEFF)) em += bold ? 0.62 : 0.55;
      else if (c >= 0x30 && c <= 0x39) em += 0.54 * (bold ? 1.09 : 1) * wide;
      else if (LETTER[ch] != null) em += LETTER[ch] * (bold ? 1.09 : 1) * wide;
      else em += (c < 0x2000 ? 0.62 : 1) * (bold ? 1.09 : 1) * wide;
    }
    return em * t * 4 / 3 * 1.03;
  }
  // ---- bidi isolation (0.3.0 J18, B-171 item 5; moved here from the MCP's terminology.mjs by SQ15b, J18-S2, so the
  // website's own Arabic download isolates by the same rule) ----
  // Power BI draws a title as a left-to-right paragraph (DESKTOP-TESTS.md, round 13: a "…" after Arabic words went to the
  // reading start of the line). A Latin run between Arabic words is read in the right place, but one at either end of
  // the text, or one with signs inside it ("Q1/2024"), is not. Each Latin run (letters, with the digits and the signs
  // between them: "KPI 2024", "Q1/2024") inside Arabic text is wrapped in a first-strong isolate (U+2068 ... U+2069), and
  // a run at either end of the text gets a right-to-left mark (U+200F) beside it, so the reading order is mirrored, never
  // the run's own characters. Numbers alone and {n} placeholders are left as they are (they read right in Arabic text);
  // a text with no Arabic letter, or already isolated, is unchanged. The isolates come from the writer only: a name a
  // person gives with one is refused (the MCP's display-names.mjs, writtenName). textWidth counts them 0 wide.
  const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/, ISOLATED = /[\u2066-\u2069]/;
  const RUN = /[A-Za-z0-9](?:[A-Za-z0-9_%]|[ .,'&+#/\-](?=[A-Za-z0-9]))*/g;
  const FSI = '\u2068', PDI = '\u2069', RLM = '\u200F';
  const runs = (t) => t.replace(RUN, (run) => (/[A-Za-z]/.test(run) ? FSI + run + PDI : run));
  const ends = (t) => t.replace(/^(\s*)\u2068/, '$1' + RLM + FSI).replace(/\u2069(\s*)$/, PDI + RLM + '$1');
  function isolateLatin(s) {
    const t = String(s == null ? '' : s);
    if (!ARABIC.test(t) || !/[A-Za-z]/.test(t) || ISOLATED.test(t)) return t;
    return ends(runs(t));
  }
  // (0.3.1 TT1, the owner, 27 Oct: a title is wholly Arabic or wholly English) an English title in an Arabic report is
  // isolated as a whole where the writer places it, with the marks an end run takes (U+200F, U+2068 ... U+2069, U+200F),
  // so it reads as one run; a text with an Arabic letter, without a Latin letter, or already isolated is unchanged
  function isolateWhole(s) {
    const t = String(s == null ? '' : s);
    if (ARABIC.test(t) || !/[A-Za-z]/.test(t) || ISOLATED.test(t)) return t;
    return ends(FSI + t + PDI);
  }
  // (the full run's test.mjs, e/h and P3-2: isolating every mixed text changed Arabic titles that keep a model name in
  // English, outside what a person approved: the owner decided that one, F1) a text with an approved name in it: that
  // name's Latin runs isolated where the text holds it, and a right-to-left mark at an end the name's run reaches
  function isolateNames(s, names) {
    let t = String(s == null ? '' : s);
    if (ISOLATED.test(t)) return t;
    let hit = false;
    for (const n of names || []) { if (!n || !t.includes(n)) continue; t = t.split(n).join(runs(n)); hit = true; }
    return hit ? ends(t) : t;
  }
  const api = { textWidth, LETTER, TAHOMA_LATIN, ARABIC, ISOLATED, isolateLatin, isolateNames, isolateWhole };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DataArcusTextMeasure = api;
})(typeof self !== 'undefined' ? self : this);
