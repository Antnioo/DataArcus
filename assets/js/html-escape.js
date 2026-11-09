/* DataArcus HTML escape: a text made safe inside an HTML page, in one place (0.3.2 DD2H; the owner D-1104-12 "we
 * create a library of functions where a place calls them so if we need to fix something we fix it at the source").
 *   htmlEsc(s)  the text with & < > " ' as &amp; &lt; &gt; &quot; &#39; (an element's text or a quoted attribute);
 *               null and undefined give "", anything else its String (12 -> "12"). Pure, never throws on a string,
 *               a number, null or undefined.
 * The ledger: mcp/docs/CONTRACTS.md (family html); the test: mcp/test-0.3.2-dd2h.mjs. XML (an SVG) is svg-escape.js's.
 * Browser, worker and Node (module.exports / window.DAHtmlEscape / self.DAHtmlEscape). */
(function (root) {
  'use strict';
  const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const htmlEsc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => MAP[c]);
  const api = Object.freeze({ htmlEsc });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAHtmlEscape = api;
})(typeof self !== 'undefined' ? self : this);
