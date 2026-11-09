/* DataArcus TMDL names (0.3.2 DD2N; mcp/docs/CONTRACTS.md family tmdl-name): a table, column or measure name as TMDL
 * writes it. Bare when it is a plain identifier (a letter or _, then letters, digits or _), else in single quotes with
 * each ' doubled. A hyphen is quoted: quoting a name that needs none is always read the same by TMDL, a bare hyphen is
 * the risky side. The one home of this rule: the health check's fix scripts, the DAX measure builder, the twin and
 * create_report's sample read it here (the owner, D-1104-12, D-1016-01). Not DAX names ('Table'[Column]) nor M.
 * Pure: a name in, its text out; a number is safe (String first).
 * Browser and Node (module.exports / window.DATmdlName). */
(function (root) {
  'use strict';
  const PLAIN = /^[A-Za-z_][A-Za-z0-9_]*$/;
  // n: a name (any value: String(n) first). Its TMDL text
  const tmdlName = (n) => { const s = String(n); return PLAIN.test(s) ? s : "'" + s.replace(/'/g, "''") + "'"; };

  const api = Object.freeze({ PLAIN, tmdlName });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DATmdlName = api;
})(typeof self !== 'undefined' ? self : this);
