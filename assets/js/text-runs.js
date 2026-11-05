/* DataArcus text runs: what text a text box's paragraphs hold, read in one place (0.3.2 DD2T; the owner D-1104-12 "we
 * create a library of functions where a place calls them so if we need to fix something we fix it at the source",
 * D-1016-01). A text box holds paragraphs, each { textRuns: [{ value }] }. One reader, a pure function that never
 * throws and never changes its input:
 *   paragraphTexts(paragraphs)  one text per paragraph: its runs' values joined as written. A string value as it is,
 *                               null or undefined as "", anything else as its String (0 -> "0", true -> "true").
 *                               A paragraph or a run that is not an object is skipped; paragraphs or textRuns that
 *                               are not a list read as none.
 * How the lines are joined is the caller's question, answered where it calls: " / " and trimmed to show a box's lines
 * on one line (layout-check.js, report-inventory.mjs), " " to test for text and to draw it (report-a11y.js,
 * page-preview.js). Where the paragraphs sit in a visual stays the caller's too. The ledger: mcp/docs/CONTRACTS.md
 * (text-runs); the test: mcp/test-0.3.2-dd2t.mjs.
 * Browser, worker and Node (module.exports / window.DATextRuns / self.DATextRuns). */
(function (root) {
  'use strict';
  const isObj = (x) => !!x && typeof x === 'object';
  const runText = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v));
  const paragraphTexts = (paragraphs) => (Array.isArray(paragraphs) ? paragraphs : [])
    .filter(isObj)
    .map((p) => (Array.isArray(p.textRuns) ? p.textRuns : []).filter(isObj).map((r) => runText(r.value)).join(''));
  const api = Object.freeze({ paragraphTexts });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DATextRuns = api;
})(typeof self !== 'undefined' ? self : this);
