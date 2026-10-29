# SQ15c (0.3.1 Seen, the owner's "Yes, fix now", 26 Oct): test.mjs reads reports as the product does; website coverage

## Summary
- **Approval:** the owner, 26 Oct: "Yes, fix now" to every open "Seen, not in scope" item, the bigger ones included;
  the reviewer's brief "Go on SQ15c". Items from [SEEN-QUEUE.md](SEEN-QUEUE.md): 0.2.9-reader-S21, Q1-S5.
- **Scope:** tests and CI only, no product code: `mcp/test.mjs` (its report readers), `scripts/tests/lib.mjs` and
  `run-all.mjs` (a coverage hook, off unless `DA_WEB_COVERAGE` is set), a new `scripts/coverage-web.mjs`,
  `scripts/coverage-summary.mjs` (a title argument), one new job in `.github/workflows/tests.yml`, the root
  `package.json` (one script), `mcp/docs/TESTS.md` (the numbers), the two Status cells in SEEN-QUEUE.md.
  Not SQ14's files (arabic-calendar.js, pbip-query.js, report-mirror.js, check-report internals) nor SQ15b's
  (report-run.mjs, plan-lint.mjs, metric-switcher, pbip-export, the isolate rule).
- **Base:** `fix/0.3.1-sq15c` from `origin/integration/0.3.1` (c2a67d6). Push only this branch; the reviewer merges.
- **Expected checks:** test.mjs the same counts before and after (base: shards 1-4 33 / 584 / 634 / 339 = 1,590); a
  deliberately broken reader (`lib/read-report.mjs`, a temp edit, restored) turns test.mjs red where the
  base's copy of test.mjs stays green; website suites 21 PASS with and without coverage, the same counts;
  `npm test -- --keep-going` all suites PASS; check-result-lines, lint, check-agent-memory PASS.
- **Got:** test.mjs shards 33 / 584 / 634 / 339 = 1,590 before and after (unsharded 1,591 here and 1,591 on the
  base); the broken reader: base shard 2 PASS 584, this branch's FAIL (5 checks); website 21 PASS, every count the same
  with coverage (1,398 s -> 1,462 s); coverage lines 82.9 %, branches 73.0 %, calendar-generator.js 98.9 % lines;
  `npm test -- --keep-going` "run-tests: 88 suites passed"; check-result-lines 88, lint, agent-memory PASS.
- **Resume:** done (657234c plan; 8b9a352 reader-S21; 1ae5f7d Q1-S5; 438f18e the queue); waits for the reviewer.
  Nothing needs Desktop.

## The items, confirmed on c2a67d6
1. **0.2.9-reader-S21**: `mcp/test.mjs` reads written reports with readers of its own, never the product's:
   `readReport` (pageOrder, page.json, every visual.json, group offsets), `boundFields` and the create_report block's
   `walk` (every visual.json under the folder), the dark theme's `walkT`, `cardProblems` (visual.json and mobile.json),
   `visualsOf` (round 17's) and `report` (round 20's). A reader bug the product has (a group offset, a page order) is
   invisible to them: they read the files their own way.
2. **Q1-S5**: Q1's c8 job runs `npm test` only; the website suites (Chromium) have no coverage report, so
   `assets/js/calendar-generator.js` reads 59.6 % lines: its page code runs only in the browser.

## Plan
1. This note, pushed first.
2. **reader-S21**: one helper `reportOf(dir)` = `inventory(diskSource({ reportDir }))` from `lib/read-report.mjs`;
   a part left unread (unreadable file, link, size or count cap) throws, so no check runs on half a report. Every
   reader above becomes a mapping of it (same shape, same order: pageOrder, the folder's visual order); the checks are
   not touched. Single-file reads that test what the writer wrote (definition.pbir, the theme file, a PNG, bookmarks'
   folder, reportExtensions.json) stay: they check bytes, not a reading. Proof: a broken copy of the reader (a group's
   offset not added) run against the base's test.mjs and the new one: green there, red here.
3. **Q1-S5**: `DA_WEB_COVERAGE=<dir>` in `scripts/tests/lib.mjs`: every page of a visitor records
   `page.coverage` JS coverage until it or its context closes (run-all flushes the rest); the engines' entries
   (`assets/js/*.js`; the translations are data) are written as Node V8 coverage files named by the source, and the
   server sends an engine's source for its `.min.js` (the pages load the minified file), so c8 reports the source's
   lines and branches. `scripts/coverage-web.mjs` runs run-all so, then `c8 report` (c8 is already pinned): one line
   out, `coverage/web/` (coverage-summary.json, coverage.txt, summary.md, run-all.log) as the artifact. CI: a job
   `coverage-web` beside `coverage`, Linux, `continue-on-error`, needed by nothing; its summary to the job summary.

## Expected numbers (written before the runs)
- test.mjs: shards 1-4 the same counts as the base (one check may be the same check counted the same; none dropped).
- Broken reader: test.mjs (new) at least 3 FAIL checks (design-report's slot boxes use grouped KPI cards); base 0.
- Website: 21 suites, the same counts with coverage as without; whole-run time with coverage +10-30 %.
- Coverage of the engines under the website suites: lines 60-80 %; calendar-generator.js 90 % or more.

## Results: each item before -> after
1. **0.2.9-reader-S21** (8b9a352): before, seven readers of test.mjs's own (above); after, one `reportOf(dir)` over
   `inventory(diskSource(...))`, and `readReport`, `boundFields`, the create_report block's walk, the dark theme's
   titles, `cardProblems` (its phone file from the inventory's `mobile`), `visualsOf`, `report` map it; `visualJsons`
   for the field walks. Checks untouched: shards 1-4 33 / 584 / 634 / 339 before and after, each check the same check.
   **Broken copy:** `read-report.mjs` with a group's offset not added (`gx += 0; gy += 0`, then `git checkout`),
   `DA_SHARD=2/4 node test.mjs` in a worktree of the base and here, side by side: base `PASS mcp 584 checks`; here
   `FAIL mcp 584 checks`, 5 checks red: the design report's grouped title and the slicers outside the rail (2 pages),
   and three logo boxes 36 px off (`logo tall.png`, `logo wide.png` (ar), `logo wide.jpg`).
2. **Q1-S5** (1ae5f7d): before, no coverage of the website suites (calendar-generator.js 59.6 % lines, read under
   `npm test`); after, `npm run coverage:web` / CI job `coverage-web` (beside `coverage`, continue-on-error, needed by
   nothing): one line, e.g. `coverage-web: lines 82.9 % (13214/15943), branches 73.0 % (7240/9924) in 34 engine
   files; calendar-generator.js lines 98.9 %; 1581 pages; suites: All 21 passed (1462s, 3 at a time) (1465 s)`, the
   per-file table in the job summary, `coverage/web/` as the artifact. Without `DA_WEB_COVERAGE` nothing changes
   (the hook is off). The website run's counts with coverage are the base's exactly (21 suites diffed by name and count).
   Lowest branches: label-limits.js 34.5, svg-kpi-compiler.js 54.5, report-mirror.js 55.7, report-rules.js 56.2,
   page-preview.js 57.3 (most of these are the MCP's engines, covered by `npm test`'s c8 report instead).

Suites, before -> after: test.mjs 1,590 -> 1,590 (shards), 1,591 -> 1,591 (unsharded); website 21 PASS -> 21 PASS (same counts); `npm test --
--keep-going` -> "run-tests: 88 suites passed" (28 min 28 s; mutation 72 mutants, all killed); check-result-lines
PASS 88; `npm run lint` clean; check-agent-memory PASS 147.

## CHANGELOG line
None: internal (tests and CI only).

## Decisions I made
- Every page/visual reader in test.mjs moved, not only `readReport` (the item's audit duplicate counts it as one of
  several); single-file reads that check the writer's bytes stay (definition.pbir, the theme file, PNGs, the bookmarks
  folder, reportExtensions.json).
- `reportOf` throws on a part the inventory left unread (unreadable file, link, size or count cap): the old readers
  would have thrown on a bad file too; the product's reader skips it, so the test must not.
- A visual's `text` is now its JSON as one string (`JSON.stringify`), not the file's bytes: every check that searches
  it looks for a key or a colour, never for the file's spacing.
- Coverage served each engine's source for its `.min.js` (coverage mode only), so c8 reports the source's lines; the
  gate keeps testing the minified files. The translations (data) and the pages' inline scripts are left out.
- `continue-on-error: true` on the job and `coverage-web.mjs` exits 0 whatever the suites say (as Q1's step);
  exit 1 only when no coverage was recorded. One unsharded job (about 25 min on 4 cores here), no Node-only suites.
- `coverage-summary.mjs` takes an optional title (its second argument), so both reports share one table.
- Measured, against the plan: time +4.6 % (planned +10-30 %), lines 82.9 % (planned 60-80 %).

## Seen, not in scope
- With the broken reader, the base's shard 2 stayed green: no other check there reads a group's offset through the
  product's reader. A mutant for it in `test-0.3.1-mutation.mjs` would keep it caught.
- The coverage report lists only engines a page loads (c8 `all` off): engines no page loads do not appear.
- Pages a site page opens itself (popups, `window.open`) are not recorded; only a test's own pages are.
- The Node-only website suites (svg-kpi, tmdl-model, github-links) run without coverage.
- report-mirror.js reads 50.2 % lines under the website suites: its page use is small (the MCP's twin is its caller).
