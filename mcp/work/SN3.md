# SN3 (0.3.3): four small items from the night audit and the "Seen, not in scope" lists

## Summary
- **Approval:** the owner D-1112-01 (12 Nov 04:15 Dubai): fix the open audit finds and the small "Seen" items while he sleeps; the reviewer hub's brief SN3.
- **Base:** `feat/0.3.3-sn3` from `origin/integration/0.3.3` at c21df8d5. Pushed only this branch; never merged, no PR.
- **Scope:** `assets/js/svg-expressions.js` (+ .min.js, 2 ?v= stamps), `scripts/test-svg-kpi.mjs`, `mcp/fixtures/sp16-codegen.json` (E1 record, item 1), `scripts/test-pl300-bank.mjs`, the exam suite, `scripts/tests/build-page.mjs`, `scripts/tests/sp32.mjs`, `scripts/clock-shift.cjs`, `scripts/run-shifted-clock.mjs` (item 4), `mcp/CHANGELOG.md` (item 1), `mcp/WORK.md`, this note.
- **Expected checks:** svg-kpi (939 -> 981 checks), sp12, sp16, dd2z; test-site-config; pl300-bank; the exam suite; the files item 4 finds; CI green on the last code commit; lint 0.
- **Resume:** the state is the last line of this note.

## Plan
1. AUD-063: red first (42 of the new checks fail on c21df8d5, the 80 pinned answers stay green), then `roundDecimal` prints the value's 15 significant digits and zeros from 1e21.
2. DP-600 count check in test-pl300-bank (220 = 208 + 12), bitten once by a changed count.
3. Measure whether any test fails with the exam's options in source order; add one if none.
4. Static list of the clock-reading suites, run under three shifted clocks with a preload, fix each red at its cause.

## Before -> after
1. **AUD-063 closed** (commit "SN3 item 1"). `roundDecimal` (assets/js/svg-expressions.js) took `abs.toFixed(d + 6)` apart at the dot; toFixed answers in exponent form from 1e21, so `formatNumber(1e21, "#,0")` was "1e+21" and a 1e30 preview "1e+30", "1e+3.2%" (a ratio to percent) or "1e+2.4M". From 1e21 it now prints the value's 15 significant digits and then zeros (`formatNumber(1e21, "#,0")` = "1,000,000,000,000,000,000,000"), grouped as the pattern says, never an "e". Under 1e21 nothing moved: 20 values x 4 patterns (80 answers: 0, 0.005, 0.004999, 69.115, 999999.995, 1e15, 1e20, -0.001, -1234.5, 0.995, 9.995, 99.5, 123456789.125, 1e6, 12345.678, -0.005, 1e-7, 0.5, 1.005, 999.9999) were read off c21df8d5 and pinned in `scripts/test-svg-kpi.mjs`. **Red on c21df8d5 first**: 42 of the new checks failed, the 80 pinned ones passed; green after (svg-kpi 939 -> 981 checks). What Power BI's FORMAT prints past 15 significant digits is NOT measured here (15 digits then zeros is my reading of the brief; see "For the laptop"). Infinity and NaN cannot come from the page's inputs: left as they are. The .min.js is rebuilt; the new ?v= stamp is on tools/svg-kpi-designer.html and ar/tools/svg-kpi-designer.html (the only two pages that load it; `build:min` wrote them, `stamps-write 435 checks`).
   **A change I caused on purpose, per test:** `mcp/fixtures/sp16-codegen.json` E1 (sp16: the preview evaluator and the DAX text agree) recorded 2 disagreements on the base; one, D25 (2.5e21 and 6.02e23 through FORMAT: evaluator "3 0.00 6.03", DAX "2,500,000,000,000,000,000,000 0.00 602000000000000000000000.00"), is this same bug and is now gone: "agree" 140 -> 141, D25 removed from the list, D26 (the -0.0 case) stays. sp16 red on the fix with the old record (1 of 32), green with the new (32 checks). Edited by hand, not re-recorded (the recorder is for the base only).
2. **DP-600 count checked** (commit "SN3 item 2"). `scripts/test-pl300-bank.mjs` now reads every "N questions" next to DP-600 / Fabric in the 13 files PL-300's check reads (plus the .min.js copies, the hubs and the home pages): 28 stated counts, each must equal the bank's questions + case questions (`dp.q.length` 208 + 12 case questions = 220, read from assets/data/dp600-questions.js). True today: no page text changed. **Proven to bite:** in my working copy I changed one count at a time and each went red, then restored it (`git status` clean after): tools/index.html 220 -> 221 ("says 221 DP-600 questions, the bank holds 220"), scripts/make-share-images.mjs 220 -> 219, ar/tools/dp-600-practice-exam.html 220 -> 210. pl300-bank 29 -> 62 checks (the exam-mix check below added two).
3. **The exam mixes its options: measured, and it does** (commit "SN3 item 3"). Measurement: I drew every option in source order (newInst's `perm` = identity, in assets/js/exam-session.js and the .min.js the pages load) and ran every suite that touches the exam. Only sp34 (a seeded recording of the exam's steps, 22 of 40 steps differ in S7 alone) failed; dd2w, fn1a, text-align, tools, dd2h, pl300-bank and sitemap-lastmod all passed. sp34 would also fail for any other change of the drawn order, so nothing named the property. I added one (in pl300-bank): the bank's right option is first in 100% of the PL-300 single-answer questions and 74.5% of DP-600's in source order; drawn through `newInst` with a fixed seed (20 draws of the whole bank) it is first in 874/3480 = 25.1% (PL-300) and 695/2740 = 25.4% (DP-600), limit 40%. **Red first** with the identity `perm` (PL-300 100.0%, DP-600 74.5%, both FAIL), green on the real code. The mutation was never committed (`git checkout`). No exam logic changed; no STOP.
4. **Clock sweep** (commit "SN3 item 4"): the table is below (counts: 7 files hold a `\d{4}-\d{2}-\d{2}` pattern and 30 call `new Date()` or `Date.now()` on c21df8d5, grep over mcp/test-*.mjs, scripts/tests/*.mjs, scripts/test-*.mjs; the brief said 6 and 28, so I list all 36 distinct files, round22 is in both). The tool: `scripts/clock-shift.cjs` (a `node --require` preload; `SHIFT_CLOCK=tomorrow|newyear|leap|<ISO>`; `new Date()` and `Date.now()` answer real time plus an offset, `new Date(x)` untouched; through `NODE_OPTIONS` it reaches child processes) and `scripts/run-shifted-clock.mjs` (runs suite files under the clocks, site suites through run-all as R-57 says). tomorrow = +24 h, newyear = 31 Dec 2026 23:59:00 UTC (the suite crosses midnight), leap = 29 Feb 2028 12:00 UTC.


### The clock table (shifted clocks: tomorrow / 31 Dec 23:59 UTC / 29 Feb 2028; node's clock only)
"none" = the same file unshifted, run for comparison where it went red. Every red below was **red on c21df8d5 first** (the table's first run was on it, unchanged files).

| file | how it reads the clock | moves? | result |
|---|---|---|---|
| scripts/tests/build-page.mjs | fixtures' times from node `Date.now()`; the page reads the browser's clock | **yes**, red under all 3 clocks (S1: builder's run), green unshifted | **fixed at its cause**: `v.ctx.clock.install({ time: now })`, the page gets the "now" its fixtures were written from. Green under none/tomorrow/newyear/leap (83 checks). |
| scripts/tests/sp32.mjs | masks the 3 days around node's `Date.now()` (a wholesale mask, `undate`); the page writes the dates with the browser's clock | **yes**, red under newyear and leap (P1 "local now": the history day "2026-11-12" unmasked), green tomorrow | **fixed at its cause**: the 3 days are taken from the page's clock in `open()`, where they are written. Green under none/tomorrow/newyear/leap (39 checks). The mask is still the 3 days (the recording's `<DATE>` hashes hold); narrowing it to the places the tool writes them is not done, see Seen. |
| scripts/test-site-config.mjs | `new Date(exp) > new Date()` and "more than 30 days" on security.txt's Expires (2027-10-06) | **yes, by design** (a renewal reminder) | listed, not fixed: red from 6 Sep 2027 (30 days before) and under the 2028 clock; green tomorrow and 31 Dec 2026. The owner renews .well-known/security.txt before then (see For the owner). |
| mcp/test-0.3.1-mutation.mjs | `Date.now()` for its timing; one mutant edits an expiry test of the approval window | no (green x3 and none; 360 to 378 s each) | none needed |
| scripts/tests/sp35.mjs | `new Date().getFullYear()` against the page's footer year | no (green x3) | caveat: node is shifted, the browser is not, so the Jan 1 crossing is not measured, see Seen |
| scripts/tests/sp5.mjs, sp7.mjs, sp8.mjs, sp13.mjs | the suite fixes the page's clock (2 Nov 2026 10:20:30) | no (green x3) | none needed |
| scripts/tests/tools.mjs | `Date.now() - 60000` and `endAt` inside the page (a mock exam's elapsed time) | no (green x3) | none needed |
| scripts/tests/model-health.mjs, mcp/test-0.2.9-layouts.mjs, 0.2.9w, 0.3.1-twin-fuzz, 0.3.2-pb1, rv1, wn1, 0.3.3-mh1, test-audit6, test-fuzz, test-phone, test-round22, scripts/test-settle.mjs | `Date.now()` as a stopwatch (a time limit or a printed duration) | no (green x3 each) | none needed |
| mcp/test-0.3.2-sp44.mjs | `Date.now()` plus 5 s / 1 h for an approval link's expiry, relative | no (green x3) | none needed |
| mcp/test-0.3.2-sp5.mjs | the suite stubs `new Date()` to 2026-11-02 10:20:30 for the ZIP entries | no (green x3) | none needed |
| mask files: mcp/test-0.3.2-gm1.mjs, test-r1-see-the-result.mjs, test-round22.mjs, scripts/tests/gulf-calendar.mjs, gulf-like-for-like.mjs, scripts/test-analytics-events.mjs | a `\d{4}-\d{2}-\d{2}` pattern that CHECKS a date's shape (a recorded Hijri month start, "yyyy-mm-dd", a campaign name); none replaces dates wholesale | no (green x3) | none needed |
| scripts/tests/sp24.mjs | `undate` replaces the date only after "health check ·" (where the tool writes it, R-52) | no (green x3) | none needed |
| scripts/tests/capture-design-fixtures.mjs, capture-gm1-baseline.mjs, capture-gulf-baseline.mjs | not suites: they write fixtures (capture-gm1 and capture-gulf write today's date as `captured`, by design) | n/a | not run (running them would rewrite the fixtures); listed |
| scripts/tests/lib.mjs, run-all.mjs | a wait loop and the run's timer | no | not suites; covered by every run above |

The sweep covered every suite file of the list inside the 80 minutes (nothing is left over); the three capture files and the two helpers are the only ones not run, and why is in the table.

## CHANGELOG line
- (item 1 only, in `mcp/CHANGELOG.md` [Unreleased]) "The SVG KPI Designer's preview prints a very large value in digits (1,000,000,000,000,000,000,000 for 1e21), never as "1e+21" or a wrong percent. Up to 15 significant digits are the value's, then zeros."

## Decisions I made
- Item 1: "the value's 15 significant digits, then zeros" is `toExponential(14)` (rounded to 15 digits, not cut): 1.23456789012345678e22 prints 12345678901234600000000. The brief's words allow either; rounding is what `toPrecision(15)` and Excel do.
- Item 1: I edited sp16's recorded E1 by hand (agree 141, D25 removed) instead of re-recording, because the recorder is for the base only. Said per test above.
- Item 3: a test fails if the options are drawn in source order (sp34), so the brief's "if none does" was not met; I added the property test anyway, because sp34 is a recording that fails on ANY change and names no cause. It costs 2 checks and no exam logic.
- Item 4: the shifted clock is node's only (the page's browser clock stays real); where a suite writes fixtures from node's clock for the page to read (build-page, sp32), the page is given the suite's clock. I did NOT shift the browser for every page suite (a Playwright-level change): see Seen.
- Item 4: test-site-config's security.txt expiry check is a calendar dependency on purpose (a renewal reminder); I listed it and did not weaken it.
- Item 4: the preload and the runner live in scripts/ (not scripts/tests/, whose .mjs files are suites).
- mcp/ and the root had no installed packages in this container: `npm ci --ignore-scripts` in both before any suite (dd2z failed 135 of 153 on the base before that, for the missing packages only).

## For the owner
- Renew `.well-known/security.txt` (Expires 2027-10-06) before 6 Sep 2027, when test-site-config goes red on its own 30-day rule.

## Risky changes
- none (item 1 changes the text a preview prints only from 1e21 up; items 2 to 4 are tests and test tools).

## For the laptop
- One Desktop read: `FORMAT(1E30, "#,0")` (and `FORMAT(1E21, "#,0")`) in Power BI Desktop, to see whether the digits past the 15th are zeros, as the preview now prints, or the value's exact binary digits (1,000,000,000,000,000,019,884,624,838,656 for 1e30).

## Seen, not in scope
- test-0.3.2-dd2z fails 135 of 153 checks on the base here without `npm ci` in mcp/ (missing packages); after it, not re-run in this job (it is not in the sweep).
- sp32's mask still replaces the 3 days around the page's now wholesale (R-52 asks for masks only where the tool writes the date); narrowing it needs a re-recording of 20 or so hashes.
- Page suites read the browser's clock, which my preload leaves real; a real 31 Dec to 1 Jan crossing of a PAGE (sp35's footer year, the Gulf calendar's year pages) needs the browser shifted too (Playwright `context.clock`), not measured. A tool for that would be one more helper in scripts/tests/lib.mjs.
- The count of date-shaped patterns is 7 and of clock reads 30 on c21df8d5 against the brief's 6 and 28; the extra files are test-r1-see-the-result / round22 and the capture files.
- `npm test` for the 4 shards was not run locally (D-1102-02); CI is the gate.

## Lessons for the reviewer
- A recording suite (sp34) fails on any change, so "does a test fail when X" is a weak measure of coverage; the brief could say which kind of failure counts.
- "mask 6 files" in a brief was a count of patterns, none of which masked; a grep for the replace call (`undate`) finds the real masks (sp24, sp32).

CI green: https://github.com/Antnioo/DataArcus/actions/runs/43137712487 on 6942b4c9 (every area run, website-suites 1-3, mcp-parts 0-4, mcp-windows-parts 0-4 and website-checks passed; the two macOS jobs are skipped by the workflow). Lint exit 0 run locally; the WORK.md line is in that commit. Done 2026-11-12T02:10Z.
