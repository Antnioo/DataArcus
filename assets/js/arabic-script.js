/* DataArcus Arabic script: is this text Arabic? Answered in one place (0.3.2 DD1F; the owner D-1104-12 "a library of
 * functions where a place calls them so if we need to fix something we fix it at the source", D-1104-15, D-1016-01).
 *   ARABIC        one character class, no g flag: the Arabic block U+0600-06FF, its supplement U+0750-077F,
 *                 extended-A U+08A0-08FF and both presentation-form blocks U+FB50-FDFF, U+FE70-FEFF
 *   hasArabic(t)  true when the text holds one of them; null and undefined are no text (false, never "null")
 * Arabic-Indic digits and the Arabic question mark sit in the block and count; a direction mark alone does not.
 * Pure: no state, never throws, reads the text only. The ledger: mcp/docs/CONTRACTS.md (1f); the test:
 * mcp/test-0.3.2-dd1f.mjs. Browser, worker and Node (module.exports / window.DAArabicScript / self.DAArabicScript). */
(function (root) {
  'use strict';
  const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
  const hasArabic = (t) => ARABIC.test(String(t ?? ''));
  const api = Object.freeze({ ARABIC, hasArabic });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAArabicScript = api;
})(typeof self !== 'undefined' ? self : this);
