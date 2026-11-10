# SG1 (0.3.3): the 15 same-shape groups, each into the shared library or written down as different (B-422)

## Summary
- **Approval:** the reviewer's brief "SG1" (9 Nov); the owner D-1109-05 ("yes queue it for 0.3.3 after LK1"), D-1104-12 (one job, one place, the shared library). B-422.
- **Base:** `fix/0.3.3-sg1` from `origin/integration/0.3.3` at 8f5624e6 (LK1 merged). Push only this branch.
- **Scope:** 11 groups SAME JOB moved into an existing shared file (no new module), 4 groups DIFFERENT written down below for the engine's allow list. No behaviour change: every answer, page and written file byte for byte the same.
- **CI:** CI green: https://github.com/Antnioo/DataArcus/actions/runs/42729802765 on 10259cfe (Linux and Windows MCP parts, every website job; macOS skipped on a branch run). Runs 1 and 2 red, causes and fixes under Tests.
- **Expected checks:** new suite `sg1` (one parity part per moved group, red on 8f5624e6 first: the shared names do not exist there); every split test that pins the touched files' requires (sp10, sp11, sp20, sp21, sp26, sp30, sp38, sp40, sp42) passes, a new shared require allowed on purpose and said per test; no recorded fixture moves; test-contracts, check-contracts, check-modules, lint PASS; areas report, core, arabic, checker, model; site suites dd2w, theme-generator, build page.
- **Resume:** 2026-11-10T00:59Z: State: DONE (CI green on 10259cfe); the reviewer merges and adds the 4 DIFFERENT groups to the engine's allow list.

## Plan (group, decision, where it goes)
1. `text` x6 (confirm-memory, dax-reference-parser, gulf-health, model-health-tmdl, model-index, mcp shadow-model `textOf`): SAME JOB (an expression given as a string or as lines -> one text). One place: `assets/js/dax-reference-parser.js` `exprText` (its own `text` was the first; it loads first on the health page and in the worker).
2. `lit`/`litOf` x6 (mirror-policy, report-a11y, report-rules, visual-replace, mcp check-impact, mcp arabic-lens): SAME JOB (a property's raw Literal.Value, else undefined). One place: `assets/js/pbir-values.js` `litValue` (all six already load pbir-values).
3. `el` x3 (build-page, build-usage, theme-download-ui): SAME JOB (an element with a class and a text). One place: `assets/js/page-toast.js` `el(doc, tag, cls, text)`; build/index.html loads page-toast.min.js before build-usage.
4. `keyOf` x2 (metric-switcher, status-icons): SAME JOB ("'T'[M]" -> { t, m }). One place: `mcp/lib/model-script.mjs` `keyOf` (both already import it).
5. isDir/isLink/isFile (model.mjs, read-report.mjs): DIFFERENT (below).
6. rank / addGulfCalendar: DIFFERENT (below).
7. `leaves` x2 (redesign-kinds, redesign-patches): SAME JOB. One place: redesign-kinds.mjs exports it; redesign-patches reads `Kinds.leaves`.
8. `pathOut` x2 (native-copy, twin-read): SAME JOB (and native-copy's `relRoot` is twin-read's too). One place: twin-read.mjs (already exported).
9. `save` x3 (calendar-generator, licensing-calculator, measure-builder): SAME JOB (a page's state into localStorage, private mode ignored). One place: page-toast.js `saveState(key, state)`; the licensing page loads page-toast.min.js.
10. `hexToRgb` / pbip-query `p` (in mixHex): SAME JOB (#rrggbb -> [r, g, b]). One place: `assets/js/design-colours.js` `hexToRgb` (its own, already exported; pbip-query reads it when called). Planned for contrast.js; moved after CI run 1 (dd2k M2 pins contrast.js to its two functions).
11. toast (exam-view, health-view): DIFFERENT (below).
12. shown / cleanName: DIFFERENT (below).
13. `entries` x2 (layout-check, report-inventory; their `plain` and `anyOf` are the same copies): SAME JOB. One place: pbir-values.js `entries`, `plain`, `anyOf` (both already load it).
14. `relOut` x2 (arabic-lens, check-redact): SAME JOB. One place: check-redact.mjs (already exported).
15. `put` x2 (dax-functions, status-icons): SAME JOB (a JSON written back into the plan's file at that path). One place: model-script.mjs `putJson(files, at, p, j)` (both import it). flip-cards' `put` adds a missing file too: a different answer, left.

## For the reviewer: allow list
- 5. `mcp/lib/model.mjs` `isDir`, `isLink`; `mcp/lib/read-report.mjs` `isFile`, `isDir`: four questions: model.mjs `isDir` follows a link (statSync), read-report's `isDir` and `isFile` never do (lstatSync, the read boundary that refuses links), `isLink` asks for the link itself. Already in CONTRACTS.md "Not one question" (isDir/isLink). (model.mjs is TC1's file tonight: not touched.)
- 6. `assets/js/field-suggest.js` `rank`, `mcp/lib/gulf-calendar.mjs` `addGulfCalendar`: two step pipelines (FN1F, FN1G) with the same shape (a context, five calls, the last returned): field ranking and the calendar table, different jobs.
- 11. `assets/js/exam-view.js` `toast`, `assets/js/health-view.js` `toast`: already one-line calls of the one place (page-toast.js `toast` + `boxToast`, DD2W); each passes its own box id, class and time (2200 / 1800 ms).
- 12. `mcp/lib/plans.mjs` `shown`, `mcp/lib/read-report.mjs` `cleanName`: a plan value's canonical text capped at 200 (the approval's wording) and a report name made visible and capped at 60 (the read boundary): different texts, different caps.

## Before -> after
- 15 groups: 11 SAME JOB moved (N = 11: 1, 2, 3, 4, 7, 8, 9, 10, 13, 14, 15), 4 DIFFERENT written down (M = 4: 5, 6, 11, 12); N + M = 15.
- Copies gone: 6 `text`, 6 raw-literal readers, 2 x (entries, plain, anyOf), 3 `el`, 3 `save`, 2 hex parses, 2 `keyOf`, 2 `put`, 1 `leaves`, 1 `pathOut` + `relRoot`, 1 `relOut`; each now a call or a name for the one place.
- Ledger: 28 -> 39 families (each moved group one family, "**One place:**", 1 place, 0 disagree); check-contracts 717 -> 843 checks (hex-rgb's one place: design-colours.js); probe 39 families, 111 places, 0 disagree. "Not one question" gains the 4 DIFFERENT groups.
- Lines (wc -l, the 34 member and library files, list in the plan): 7787 -> 7816 (+29: the shared exports and their one-line comments; the callers lose their bodies but keep a named alias where the name is used many times). Changed files: confirm-memory 274 -> 276, dax-reference-parser 192 -> 194, model-health-tmdl 332 -> 333, build-page 287 -> 289, build-usage 139 -> 141, pbip-query 489 -> 488, layout-check 341 -> 340, page-toast 35 -> 41, pbir-values 51 -> 60, check-impact 168 -> 170, metric-switcher 231 -> 230, status-icons 193 -> 192, model-script 36 -> 42, redesign-kinds 161 -> 162, native-copy 158 -> 157, report-inventory 230 -> 228; the other 17 the same count (a line replaced by a line). Also: contracts-probe.mjs 722 -> 789, CONTRACTS.md 1018 -> 1187, new test-0.3.3-sg1.mjs 129.
- Pages: build/index.html loads page-toast.min.js before build-usage.min.js; the licensing calculator (EN, AR by ar-pages --write) loads it before licensing-calculator.min.js. Every page that loads a changed .min.js has its new ?v= (build:min, stamps-write 426 checks); sitemap lastmod for the two licensing pages.

## Tests before -> after
- new `sg1`: red on 8f5624e6 first ("FAIL  sg1  67 of 71 checks": every parity check and every S check but P10, P11 and S8's two "no own copy" lines, which held already); green after: "PASS  sg1  71 checks" (957f7ae1); with group 10's place in design-colours.js S8 is two checks, not four: "PASS  sg1  69 checks" (e0e7b53c).
- Split guard tests (pin requires): sp10 113, sp11 21, sp20 7, sp21 11, sp26 26, sp30 21, sp38 50, sp40 28, sp41 24, sp42 22: all PASS unchanged, no new file allowed in any (no new module; the new requires are of files those guards already admit).
- Repo checks after the last code commit: lint exit 0; test-contracts 14, check-contracts 843, check-modules 1216, check-result-lines 233, changelog-words 6, check-agent-memory 490, test-site-config PASS; contracts-probe 1355 checks (with DATAARCUS_ROOT for path-out and rel-out).
- No recorded fixture moved (no fixture re-recorded).
- CI run 1 (551cbfcf, https://github.com/Antnioo/DataArcus/actions/runs/42724204025): red on two suites only, every other MCP part and every website job green: dd2k "FAIL  dd2k  61 of 62 checks" (M2: contrast.js holds luminance and contrast only) and dd2n crash "Cannot read properties of undefined (reading 'exprText')" (dd2n runs model-health-tmdl.min.js in a vm with tmdl-name, field-meaning and sort-column only). Fixed in e0e7b53c, neither test changed: hexToRgb stays in design-colours.js; model-health-tmdl.js reads exprText when called. After: dd2k 62, dd2n 32 PASS.
- After the last code commit: `npm test -- model` "run-tests: 31 suites passed (model)"; site suites alone: model-health 255, theme-generator 922, pbip 111, sp31 17 PASS; lint exit 0; check-contracts 843, check-modules 1217, test-contracts 14, contracts-probe 1355. The local full run was stopped (it ran 957f7ae1, and CI run 1 had run every suite on it).
- CI run 2 (f37553fe, https://github.com/Antnioo/DataArcus/actions/runs/42726488242): every MCP job green on Linux and Windows (dd2k, dd2n fixed); website-suites (3) red on sp24 D8 only: "en ramadan.zip ... [data-doc=\"html\"] (now length 19022, recorded 19026)". Measured: the base 8f5624e6 fails the same way today; the field that varies is the ramadan fixture's Hijri month start `"2026-11-11"` (scripts/tests/fixtures/model-health/tmdl-ramadan, Calendar.tmdl), which sp24's `undate` masked as `<DATE>` because it masks UTC today and the days either side (10 -> 6 characters = 4 bytes). It fails on every branch from 2026-11-10 to 2026-11-12 UTC. Fixed in sp24.mjs (see Risky changes): the page's clock fixed to 2000-01-02T12:00Z (no fixture holds that date) and only that date masked; the recorded fixture unchanged; red on 8f5624e6 first ("FAIL  sp24  23 checks", D8), green after "PASS  sp24  23 checks" twice.
- packaging/build.test.mjs: not run: there is no packaging/ folder in this repo (the bundle is built by the separate step); the new Node requires are dax-reference-parser.js (from confirm-memory.js, gulf-health.js, model-health-tmdl.js, shadow-model.mjs) and pbir-values.js (from check-impact.mjs), both files the MCP already loads (model-index.js, report-rules.js), so the bundle's file list does not grow. Said for the reviewer (L-1028-06).

## Changed on purpose
- none: no answer, page text or written file changes; the pages change only by their ?v= stamps and the one new script tag each on the build and licensing pages.

## CHANGELOG line
- none: no behaviour a person sees changes (mcp/CHANGELOG.md not touched; see Decisions).

## Decisions I made
- No new module: every group went to an existing library file whose page or worker already loads before the callers (dax-reference-parser.js loads first on the health page and in the worker; contrast.js and pbir-values.js are already read by every member; page-toast.js is the tool pages' helper file, now also on the build and licensing pages).
- Group 3 (`el`) and group 9 (`save`) as SAME JOB though the brief's example of DIFFERENT is "two small DOM builders for different pages": these answer one question with one body; the cost is one script tag on two pages, measured by the site suites.
- Group 13: `plain` and `anyOf` moved with `entries` (the finder named `entries`; the two beside it were the same copies in the same two files and call it).
- Group 15: flip-cards.mjs's `put` left: it also adds a file the plan lacks, a different answer.
- Callers keep their old local name (`text`, `lit`, `litOf`, `el`, `save`, `put`) as an alias of the one place where they use it often: no renames beyond the move.
- check-impact.mjs still exports `litOf` (check-report.mjs re-exports it, check-language.mjs imports it): now pbir-values' litValue itself.
- No CHANGELOG line: the change is internal; changelog-words reads only the newest section and stays as it was.

## For the owner
- none.

## Risky changes
- none in a security policy, the approval step, file writing, what an answer returns, network or processes: `putJson` writes into the plan's in-memory file list exactly as before (the same JSON, two spaces), before the approval as before; relOut and pathOut (paths in answers) are the same functions, imported. No test loses checks. One test changed, not its expected answers: scripts/tests/sp24.mjs (another job's suite, SP24) masked any date within a day of the run, which also masked a date inside a model on 10 to 12 Nov; it now fixes the page's clock (Playwright `clock.setFixedTime`) to 2000-01-02 and masks that date only. Same 23 checks, same recorded file.

## For the laptop
- none (nothing Desktop shows changes).

## Seen, not in scope
- Other suites may mask run dates the same way as sp24 did (not searched beyond sp24).
- contracts-probe's path-out and rel-out need DATAARCUS_ROOT (model.mjs reads ROOT at import): said in the probe.
- flip-cards.mjs `put` (add or replace) and contrast.js `luminance`'s own inline hex parse (String(hex) first) are near copies of put-json and hex-rgb with different answers: left, a family each for the next ledger.
- HC2 changes the theme-generator and health check pages' stamps tonight too: the reviewer's merge will meet ?v= conflicts there (build:min regenerates them).

## Lessons for the reviewer
- A text mask built from "today and the days either side" meets any data date in those days: sp24 failed every branch from 2026-11-10 to 12 (a Hijri month start in a fixture). Fixed clock plus one masked date is the safe shape; grep other suites for `864e5).toISOString().slice(0, 10)` masks.
- dd2k M2 pins contrast.js's export list and dd2n loads model-health-tmdl.min.js in a vm without its page's earlier files: neither is in the brief's list of pinning tests; an engine that gains a require fails such a vm loader at load time unless it reads the dependency when called.
- check-modules reads every backticked name in a row's "used by" as a caller file: a function name there fails it (use it unquoted).
- `node scripts/tests/run-all.mjs --list` does not list: it runs every site suite (cost a parallel run).
