// RD9 scratch: way C's prototype, one cut rule with a per-tool cut list. A tool declares its lists in the order they
// are cut (the first is cut first, the next only when the first is at its floor), each with its floor and how the rest
// is reached; fitAnswer keeps the largest k per list (binary search, as answer.mjs fitLists) and writes
// "<key>NotListed" beside a cut list. Run on the measured answers (os.tmpdir()/rd9-answers.json, measure.mjs) with
// the cap lowered so they must be cut; compares with today's check_report loop (x0.7 steps). Prints; checks nothing.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const A = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'rd9-answers.json'), 'utf8'));
const size = (o) => JSON.stringify(o).length;
const at = (o, p) => p.split('.').reduce((x, k) => (x == null ? x : x[k]), o);
const holder = (o, p) => { const ks = p.split('.'); return [ks.slice(0, -1).reduce((x, k) => (x == null ? x : x[k]), o), ks[ks.length - 1]]; };
// the note that says what was cut is counted too (the lesson of scope.mjs's Q1 and twin-plan.mjs's PLAN_ROOM): a first
// pass measures it, the second fits under the cap less the note
export function fitAnswer(answer, cuts, cap) {
  const first = fitOnce(answer, cuts, cap), note = first.a.cut ? JSON.stringify(first.a.cut).length + 8 : 0;
  return note ? fitOnce(answer, cuts, cap - note, cap) : first;
}
function fitOnce(answer, cuts, cap, capSaid) {
  const a = JSON.parse(JSON.stringify(answer)), said = [];
  for (const c of cuts) {
    if (size(a) <= cap) break;
    const [h, k] = holder(a, c.path); if (!h || !Array.isArray(h[k])) continue;
    const full = h[k].slice(), floor = Math.min(c.floor ?? 1, full.length);
    const apply = (n) => { h[k] = full.slice(0, n); if (n < full.length) h[k + 'NotListed'] = full.length - n; else delete h[k + 'NotListed']; };
    let lo = floor, hi = full.length;
    while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); apply(mid); if (size(a) <= cap) lo = mid; else hi = mid - 1; }
    apply(lo); if (lo < full.length) said.push({ list: c.path, kept: lo, of: full.length, how: c.how });
  }
  if (said.length) a.cut = { lists: said.map(({ list, kept, of }) => ({ list, kept, of })), how: said.map((x) => x.how).filter(Boolean) };
  return { a, fits: size(a) <= (capSaid || cap), said };
}
// today's check_report loop (lib/check-report.mjs:548-552), on a copy, for the comparison
function todayCheck(answer, cap) {
  const a = JSON.parse(JSON.stringify(answer)), n = a.findings.length;
  while (size(a) > cap && a.findings.length > 1) a.findings = a.findings.slice(0, Math.max(1, Math.floor(a.findings.length * 0.7)));
  if (a.findings.length < n) a.findingsNotListed = n - a.findings.length;
  while (size(a) > cap && a.lint && a.lint.findings.length) a.lint.findings = a.lint.findings.slice(0, Math.floor(a.lint.findings.length * 0.7));
  return { a, fits: size(a) <= cap };
}
const CHECK_CUTS = [{ path: 'findings', floor: 1, how: 'counts.byRule counts every finding; call check_report again with checks: ["<one check>"]' }, { path: 'lint.findings', floor: 0 }, { path: 'suspiciousNames.names', floor: 5 }, { path: 'notChecked', floor: 10 }];
const TWIN_CUTS = [{ path: 'texts', floor: 20, how: 'textsFrom' }, { path: 'terminology.sheet', floor: 1, how: 'termsFrom' }, { path: 'notTranslated', floor: 0 }, { path: 'texts', floor: 0, how: 'textsFrom' }];
const rows = [];
for (const [call, cuts] of [['check_report {"path":"twin-project/Twin Sales.pbip"}', CHECK_CUTS], ['check_report {"path":"health-project/Health Test Report.pbip"}', CHECK_CUTS], ['create_arabic_twin {"path":"twin-project/Twin Sales.pbip"}', TWIN_CUTS]]) {
  const ans = A[call]; if (!ans) continue;
  for (const share of [0.8, 0.6, 0.4]) {
    const cap = Math.round(size(ans) * share), t0 = performance.now(), r = fitAnswer(ans, cuts, cap), ms = +(performance.now() - t0).toFixed(1);
    const row = { call: call.split(' ')[0] + (call.includes('health') ? ' (health)' : ''), size: size(ans), cap, fits: r.fits, after: size(r.a), ms, kept: r.said.map((x) => `${x.list} ${x.kept}/${x.of}`).join('; ') };
    if (call.startsWith('check_report')) { const t = todayCheck(ans, cap); row.todayFits = t.fits; row.todayKept = `findings ${t.a.findings.length}/${ans.findings.length}` + (t.a.lint ? `; lint ${t.a.lint.findings.length}/${ans.lint.findings.length}` : ''); }
    rows.push(row);
  }
}
console.log(JSON.stringify(rows, null, 1));
