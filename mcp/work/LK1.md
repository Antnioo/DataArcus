# LK1 (0.3.3): a linked visuals folder is named, its page is not "0 visuals", one link counts once (B-415, AUD-057)

## Summary
- **Approval:** the reviewer's brief "LK1" (9 Nov). Owner D-1104-12 (a library of functions, fix at the source), D-1104-18 (keep building the library functions). Finding: night audit AUD-057 (B-415).
- **Base:** `fix/0.3.3-lk1` from `origin/integration/0.3.3` at f3c1b7e1. Push only this branch.
- **Scope:** read-report.mjs (walk records a link by its report-relative path; one shared helper `addLink` + `linksSaid`), report-answer.mjs (PAGE line, NOT READ line), check-report.mjs (the two links lines), report-inventory.mjs (one call: its `sk.links.push` goes through `addLink`; see Decisions). New suite lk1. Links are still never followed.
- **Expected checks:** new `lk1` red on f3c1b7e1 first (page line, names, count 1 in both answers, 12-link cap); every suite that calls read_report or check_report unchanged counts; no recorded fixture moves (no fixture holds a link); mutation run before and after, one new mutant (the dedup) killed.
- **Resume:** 2026-11-09T19:31Z: plan committed; next: the suite, red on the base.

## Measured (step 1, on f3c1b7e1, 2026-11-09T19:31Z)
The audit's case (twin-project copy, p1overview/visuals moved outside and linked), sk.links printed:
- after check_report's `walk`: `["<ROOT>/p/Twin Sales.Report/definition/pages/p1overview/visuals"]` (absolute, OS separators: `walk` pushes `path.join(d, e.name)`)
- after `inventory(diskSource(...))` on the same sk: `[ that, "definition/pages/p1overview/visuals" ]` (report-relative, `/`: diskSource's `linked`)
- read_report alone (no walk): `["definition/pages/p1overview/visuals"]`
The field that varies: the spelling, absolute OS path (walk) vs report-relative POSIX path (diskSource, inventory). `linked()` dedups by exact string, so both stay. The audit's guess ("the same folder under two spellings") holds; "two spellings" is absolute vs relative.
Also seen by reading: inventory's `json()` pushes a linked file (page.json) with no dedup at all, so a linked page.json also counts twice in check_report (walk + inventory). Covered by the suite.

## Plan
1. read-report.mjs: `addLink(sk, rel)` records one link once, by its report-relative path with `/`; `walk` records links relative to its first folder (a 6th argument, the root, passed down); diskSource's `linked` and inventory's `json()` call `addLink`.
2. read-report.mjs: `linksSaid(sk)` the one capped, screened list: sorted, `shownPath` on each, first 10 quoted, then "and N more". Both answers call it.
3. report-answer.mjs: a page whose `definition/pages/<id>/visuals` is in sk.links: `| visuals not read: its folder is a link` in place of `| 0 visuals` (JSON: `visualsNotRead` on that page only). NOT READ: `N link(s) never followed: "<path>", ...`.
4. check-report.mjs: notChecked "links" and the validator's "not run" reason name the same paths with the same count.
5. Suite test-0.3.3-lk1.mjs through both registered handlers; tests.json one line.
6. Mutation: one mutant on the dedup in addLink.
