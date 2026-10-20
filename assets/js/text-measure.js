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
  const api = { textWidth, LETTER, TAHOMA_LATIN };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DataArcusTextMeasure = api;
})(typeof self !== 'undefined' ? self : this);
