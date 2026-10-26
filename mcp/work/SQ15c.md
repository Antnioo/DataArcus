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
- **Resume:** the plan is pushed; the work next.

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
