// (0.3.3 OX2) check_report's answer without OX2's own section: every default check of a report that names its model now
// carries briefCheck (pinned by test-0.3.3-ox2.mjs), and a report without a model folder one notChecked line. The suites
// that pin a whole answer recorded before OX2 (fn1e, sp20, sp41) compare the rest with their base recording, so a
// change anywhere else still shows; `had` counts the answers that carried it.
export function withoutBrief(a, tally) {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return a;
  const c = Object.assign({}, a);
  if ('briefCheck' in c) { delete c.briefCheck; if (tally) tally.had++; }
  if (Array.isArray(c.notChecked) && c.notChecked.some((n) => n && n.rule === 'briefCheck')) { c.notChecked = c.notChecked.filter((n) => !(n && n.rule === 'briefCheck')); if (tally) tally.noted++; }
  return c;
}
