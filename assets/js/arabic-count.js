/* DataArcus Arabic count (0.3.3 AR7; the owner D-1112-05 and D-1104-12: one place): a number with its noun in Arabic,
 * by the six plural forms Microsoft and Google both write Arabic counts with (CLDR's zero, one, two, few, many, other:
 * Microsoft, learn.microsoft.com/globalization/internationalization/pluralization; Google,
 * developer.android.com/guide/topics/resources/string-resource "Quantity strings"; both read 12 Nov 2026).
 *   category(n)        the form a whole number takes: 0 zero, 1 one, 2 two, 3-10 (and 103-110 ...) few, 11-99 (and
 *                      111-199 ...) many, the rest other (100, 101, 102, 200 ...); Intl.PluralRules('ar') where the
 *                      runtime has Arabic's rule, else the same CLDR rule written here
 *   arCount(n, forms)  the text for n: forms is { one, two, few, many, other } (zero when a sentence wants its own
 *                      word; without it 0 reads as other), each a text where # is the number in Western digits
 *                      (ARABIC-STYLE.md). A missing form falls back to other, as ICU does.
 *   NOUNS              the forms of the nouns DataArcus counts, in the case its sentences use them in
 * The case is the sentence's: a caller passes its own forms when the noun is not in the case NOUNS holds.
 * Pure: no state, reads its arguments only. The test: mcp/test-0.3.3-ar7.mjs. Its row: mcp/docs/MODULES.md.
 * No caller yet: the first sentence written for it (the Health Check's two models) is held for the owner.
 * Browser, worker and Node (module.exports / window.DAArabicCount / self.DAArabicCount). */
(function (root) {
  'use strict';
  let rules = null;
  try { const r = new Intl.PluralRules('ar'); if (/^ar\b/.test(r.resolvedOptions().locale)) rules = r; } catch (e) { /* no Intl: the rule below */ }
  // CLDR, plurals.xml, locales "ar ars" (whole numbers)
  const byRule = (n) => { const h = n % 100; return n === 0 ? 'zero' : n === 1 ? 'one' : n === 2 ? 'two' : h >= 3 && h <= 10 ? 'few' : h >= 11 ? 'many' : 'other'; };
  const category = (n) => { const v = Math.abs(Math.trunc(Number(n) || 0)); return rules ? rules.select(v) : byRule(v); };
  function arCount(n, forms) {
    const f = forms || {}, c = category(n), v = Math.trunc(Number(n) || 0);
    const text = f[c] != null ? f[c] : f.other != null ? f.other : '#';
    return String(text).replace(/#/g, String(v));
  }
  const NOUNS = Object.freeze({
    // after «على» (the genitive): «على نموذجين دلاليين», «على 3 نماذج دلالية» (the owner's terms for two and for 3 and up)
    semanticModelsOn: Object.freeze({ one: 'نموذج دلالي واحد', two: 'نموذجين دلاليين', few: '# نماذج دلالية', many: '# نموذجًا دلاليًا', other: '# نموذج دلالي' })
  });
  const api = Object.freeze({ category, byRule, arCount, NOUNS });
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DAArabicCount = api;
})(typeof self !== 'undefined' ? self : this);
