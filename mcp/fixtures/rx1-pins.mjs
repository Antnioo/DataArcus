// (0.3.3 RX1) check_report's answer without RX1's two bookmark rules in rulesRun: a report that has a bookmark now runs
// BOOKMARK_TARGET_MISSING, and one with DataArcus's recorded view order BOOKMARK_ORDER (both pinned by
// test-0.3.3-rx1.mjs). The suites that pin a whole answer recorded before RX1 (fn1e, sp20, sp41) compare the rest with
// their base recording, as they do for OX2's section (fixtures/ox2-pins.mjs), so a change anywhere else still shows;
// `ran` counts the answers that listed one. A finding of these rules is never removed: one would show as a difference.
export const BOOKMARK_RULES = ['BOOKMARK_TARGET_MISSING', 'BOOKMARK_ORDER'];
export function withoutBookmarkRules(a, tally) {
  if (!a || typeof a !== 'object' || Array.isArray(a) || !Array.isArray(a.rulesRun) || !a.rulesRun.some((r) => BOOKMARK_RULES.includes(r))) return a;
  if (tally) tally.ran++;
  return Object.assign({}, a, { rulesRun: a.rulesRun.filter((r) => !BOOKMARK_RULES.includes(r)) });
}
