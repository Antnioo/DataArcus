/*
 * DataArcus SVG KPI Designer: the SVG text safety (0.3.2 SP12, moved from svg-kpi-compiler.js as it was).
 * What the compiler writes into the picture as fixed text: a literal text (the design's own words, a prefix or suffix)
 * goes through safe() (XML escaping, then the data URL's % and #), an attribute through hexOk/color (only #rrggbb or
 * "none"; anything else is black) and attrNum (a number rounded to 2 decimals). The two stay apart: an attribute is
 * never a text run through safe(). Text from the model's data, known only when the measure runs, is escaped by the
 * expression tree's esc node instead (svg-expressions.js). Pure JavaScript, no DOM.
 * The designer pages load this file before svg-kpi-compiler.js (browser global SVGKPIEscape); Node requires it.
 * (c) DataArcus. All rights reserved.
 */
(function (root) {
  'use strict';

  // ---------- literal text ----------
  // Static text is escaped for XML, then for the data URL: % and # would break the image URL.
  const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
  const urlEsc = (s) => String(s).replace(/%/g, '%25').replace(/#/g, '%23');
  const safe = (s) => urlEsc(xmlEsc(s));
  // ---------- attributes ----------
  const hexOk = (c) => /^#[0-9a-fA-F]{6}$/.test(c || '');
  const color = (c) => (c === 'none' ? 'none' : hexOk(c) ? urlEsc(c.toLowerCase()) : '%23000000');
  const attrNum = (n) => { const v = Math.round((+n || 0) * 100) / 100; return String(Object.is(v, -0) ? 0 : v); };

  const api = Object.freeze({ xmlEsc: xmlEsc, urlEsc: urlEsc, safe: safe, hexOk: hexOk, color: color, attrNum: attrNum });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SVGKPIEscape = api;
})(typeof self !== 'undefined' ? self : this);
