# LK1 (0.3.3): a linked visuals folder is named, its page is not "0 visuals", one link counts once (B-415, AUD-057)

## Summary
- **Approval:** the reviewer's brief "LK1" (9 Nov). Owner D-1104-12 (a library of functions, fix at the source), D-1104-18 (keep building the library functions). Finding: night audit AUD-057 (B-415).
- **Base:** `fix/0.3.3-lk1` from `origin/integration/0.3.3` at f3c1b7e1. Push only this branch.
- **Scope:** read-report.mjs (walk records a link by its report-relative path; `Linked` carries the link met on the way; one shared helper `addLink` + `linksSaid`), report-answer.mjs (PAGE line, NOT READ line), check-report.mjs (the two links lines), report-inventory.mjs (one call: its `sk.links.push` goes through `addLink`; see Decisions). New suite lk1. Links are still never followed.
- **CI:** CI green: https://github.com/Antnioo/DataArcus/actions/runs/42687668529 on c4326b8e (attempt 2; Linux, Windows, website; macOS skipped on a branch run). Attempt 1: every MCP job green, website-suites (3) red on theme-generator "en: steps bar did not open and land on Layout" (the flake PH1 saw, a page this job does not touch); green on the re-run of the failed jobs.
- **Expected checks:** new `lk1` red on f3c1b7e1 first (page line, names, count 1 in both answers, 12-link cap); every suite that calls read_report or check_report unchanged counts; no recorded fixture moves (no fixture holds a link); mutation run before and after, one new mutant (the dedup) killed.
- **Resume:** 2026-11-09T20:44Z: State: DONE (CI green on c4326b8e); the reviewer merges.

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

## Before -> after
- read_report, the audit's case: `PAGE 1 "Overview" 1280x720 | 0 visuals` -> `PAGE 1 "Overview" 1280x720 | visuals not read: its folder is a link`; `NOT READ 1 file(s) that are links (never followed)` -> `NOT READ 1 link(s) never followed: "definition/pages/p1overview/visuals"`. JSON form: that page gets `visualsNotRead: "its folder is a link"`, the answer `notRead.links {count, named, more, note}` (only when there is a link).
- check_report, the same case: notChecked "2 files or folders are links ..." -> "1 file or folder is a link (symbolic links or junctions) inside the report, \"definition/pages/p1overview/visuals\": never followed, ..."; validator "not run: the report holds 2 links ..." -> "... holds 1 link (a symbolic link or a junction), \"definition/pages/p1overview/visuals\", which ...".
- A linked page.json and a linked StaticResources folder: also 2 -> 1 in check_report (found by the suite: the inventory's `json()` pushed with no dedup; a file behind a linked folder was named instead of the folder). Over 10 links: 10 named, sorted, then "and N more".

## Tests before -> after
- new `lk1` 0 -> 23 checks. Red on f3c1b7e1 first: "FAIL  lk1  18 of 23 checks" (A1, A2, A5-A8, A10, A11, P1-P3, S1, S2, C1-C3, D1, D2). Green after: "PASS  lk1  23 checks". Passing on the base too (pins of what was already right): A0, A3 (other PAGE lines), A4, A9 (nothing read through the link), D3.
- Where it proves what: directory links are symlinks on Linux/macOS, junctions on Windows (A, S, C run everywhere); P needs a file symlink: skipped with "SKIPPED PART P ..." where Windows gives no rights.
- Every suite that calls read_report or check_report (grep of `read_report|check_report` in mcp/test-*.mjs, 87 files, L-1105-32; the list: scratch `suites.txt`, the same grep reproduces it): 85 passed unchanged, 2 moved on purpose (below). Among them test-0.3.1-audit-readers (24), the 8 pinning split tests (sp11 21, sp20 7, sp21 11, sp26 26, sp38 50, sp40 28, sp41 24, sp42 22) and the suites reaching every recorded fixture the brief lists.
- Areas after the last code commit: `npm test -- checker` "run-tests: 12 suites passed (checker)"; `npm test -- safety` "run-tests: 25 suites passed (safety)". lint exit 0; check-result-lines 231, changelog-words 3, release-text 44, agent-memory 464, test-contracts 14: all PASS.
- `mutation`: base f3c1b7e1 "PASS  mutation  244 checks (97 mutants, all killed, 45 guard suites, 234s ...)"; after: "PASS  mutation  247 checks (98 mutants, all killed, 46 guard suites, 254s ...)": the new R-link-once (addLink without its dedup) killed by lk1.
- No new require or file in the bundle, so packaging/build.test.mjs not run (L-1028-06 does not apply).

## Changed on purpose
- mcp/fixtures/sp42-split.json, R5 (a linked StaticResources folder), base vs this branch (SP42_DUMP of both): `sk.links[0]` "StaticResources/RegisteredResources/twin-theme.json" -> "StaticResources" (inventory and pagesOnly); text line 32 `NOT READ 1 file(s) that are links (never followed)` -> `NOT READ 1 link(s) never followed: "StaticResources"`; line 35 SIZE 2701 -> 2703; json and page1 gain `notRead.links` (count 1, named ["StaticResources"], more 0, note) and their size (7297 -> 7437, 4724 -> 4864). Pin: length 51399 -> 51611. No other case moved.
- mcp/fixtures/fn1e-pins.json, "C links" and "C one link" (FN1E_DUMP of the base in a worktree at f3c1b7e1 and of this branch): only notChecked's links `why` and the validator's `why` gain the names (`"StaticResources/linked", "StaticResources/linked2"`; `"StaticResources/linked"`); counts unchanged (2 and 1: those links are seen by walk only). Pins: 14855 -> 15026, 14847 -> 14931. The other 588 pins unchanged.
- mcp/test-0.3.1-audit-readers.mjs F05-a2/F05-b2: the pattern `/links \(never followed\)/` -> the exact new line, `NOT READ 1 link(s) never followed: "StaticResources/RegisteredResources"` (a) / `"StaticResources"` (b). Same check count (24); now stricter (count and path).

## CHANGELOG line
- Under a new `## [Unreleased]` (no version: see Decisions): "A link inside a report (a symbolic link or a junction) is now named in `read_report` and `check_report`, at most 10 and then a count, and counted once (`check_report` counted one link twice); a page whose visuals folder is a link says "visuals not read: its folder is a link" instead of "0 visuals". Links are still never followed."

## MODULES.md (the reviewer writes them at the merge)
- `read-report.mjs` row, its job: add "; a link inside the report recorded once by its path in the report (`addLink`) and named, capped, by `linksSaid`, the one list both answers call". Callers add `report-answer.mjs`, `report-inventory.mjs` (already importers).
- `report-answer.mjs`, `report-inventory.mjs`: no change of job.

## Decisions I made
- The dedup key is the measured difference: every link is recorded by its path inside the report with "/" (walk now passes its first folder down and records `path.relative`), in one function `addLink` that the walk, the source and the inventory call.
- `Linked` carries the link met on the way (`rel`), so a file behind a linked folder names the folder, the one place on disk that is a link. Found by sp42 R5 and the suite's S case; without it the same link counted twice again (folder from walk, file from the inventory).
- report-inventory.mjs (not in Owns) changed by one call: its `sk.links.push(rel)` -> `addLink(sk, e.rel || rel)` and the import. Needed: it pushed with no dedup, so a linked page.json counted twice (P case).
- The page's flag is worked out in report-answer.mjs from sk.links (`definition/pages/<id>/visuals`), so the inventory's shape is unchanged.
- The JSON form of read_report also names the links (`notRead.links`) and the page (`visualsNotRead`): "both answers name the linked places" holds in both forms. Only present when there is a link.
- Named list sorted (readdir order differs by system); the cap is `LINKS_NAMED = 10` in read-report.mjs.
- CHANGELOG: `## [Unreleased]` without a version: the package is 0.3.2 (released, PRIVACY "Checked against 0.3.2"); naming 0.3.3 fails test-release-text until the release job bumps it, and "Unreleased: 0.3.2" would be false.
- WORK.md was at 3196 of its 3200 characters on the base: the "0.3.1 shipped" bullet became "Shipped: 0.3.1 (b79a7ed6), 0.3.2 (f3c1b7e1, #117)." to make room for the one 0.3.3 line.
- No Arabic: grep of mcp/lib and mcp/tools for an Arabic NOT READ or links line found none (the two hits, dax-functions.mjs and model-culture.mjs, are other texts).

## For the owner
- none

## Risky changes
- What an answer returns: read_report and check_report now return the paths of links inside the report (at most 10, through `shownPath`, the screen the answers use for other paths; names only, never a value, never anything behind the link). read_report's JSON gains `notRead` and a page's `visualsNotRead` when a link is there. Links are still never followed (A9: a marker visual behind the link never appears).
- Two recorded fixtures and one other suite's pattern moved on purpose (above); no test lost a check.

## For the laptop
- none (no Desktop look: the answers' words only).

## Seen, not in scope
- read_report's JSON form carries no NOT READ for files too large, folders too deep or unreadable files (only the new links part); the text form has them.
- The `## [Unreleased]` heading of 0.2.9.1 lower in CHANGELOG.md is history (changelog-words reads the first section only).

## Lessons for the reviewer
- The audit's guess held only in part: "two spellings" was absolute (walk) vs report-relative (source); the suite found two more paths to the double count (the inventory's undeduped push for a linked file, and a file named behind a linked folder). One case per kind of link (folder, file, folder on the way) found them; the audit's one case would not.
- The brief's list of suites to run left out fn1e, whose pins hold check_report's links words; grepping for the tool names found it (L-1105-32 works).
- mcp/WORK.md sits at 3196 of 3200 characters on integration/0.3.3: every 0.3.3 builder must trim to add its line; worth archiving the 0.3.2 list once.
- The 87 suites run one by one are slow (13 in about 12 minutes here); four at a time (xargs -P 4) is the faster local route.
