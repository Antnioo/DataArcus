# Tests

Moved here unchanged by A1 (0.3.1, 25 Oct) from `mcp/CLAUDE.md` ("Tests"); its short form stays there.

- MCP: `cd mcp && npm install && npm test` (starts the server over stdio and calls every tool on copies of the fixtures).
  The suites are listed once, by area, in `mcp/tests.json` (file, area, one-line purpose); `npm test` runs them through
  `mcp/run-tests.mjs` in that order and stops at the first failure; `npm test -- <area>` runs one area,
  `npm test -- --keep-going` runs all and fails at the end (CI's shard 0 does), `npm test -- --list` lists them. A new
  suite gets one line in `tests.json`'s `suites` (a helper or a block of `test.mjs` goes in `ignored`, with why): a
  `test-*.mjs` in neither stops the run and fails `scripts/check-result-lines.mjs`. The MCP must stay self-contained: its code and tests use only its own
  `mcp/package.json` packages, never the website's `node_modules`, so it can be packaged on its own.
- CI runs `test.mjs` in 4 shards (`DA_SHARD=k/4`, B-145) and `npm test`'s other scripts with `DA_SHARD=0/4`; the
  required checks `mcp` / `mcp-windows` add them up (`scripts/ci-sum.mjs`). A new block in `test.mjs` must be a part
  (`if (part('id')) {`) listed in exactly one of `SHARDS`; a part that reads what an earlier part wrote goes in
  `TOGETHER` with it. The run fails otherwise. To rebalance: `DA_PART_TIMES=1 node test.mjs` prints each part's
  seconds and reports (G-13 validates about 2 s a report). The website: `run-all.mjs --shard k/3`, `SHARDS` there.
- Every script in `npm test` ends with exactly one result line, `PASS  <name>  <N> checks` (or `FAIL  <name>  ...` /
  `SKIP  <name>  ...`), as `scripts/ci-sum.mjs` counts them; `scripts/check-result-lines.mjs` (CI) names a script without one.
- Failures (A2, 0.3.1): the runner shows each suite's result line; a failing suite then prints one line,
  `FAIL script=<file> check="<first failing check>" cause=<cause> os=<os> shard=<k/N>`, and at most 4 KB of its detail
  (16 KB a run, "N more lines not shown"); repo paths relative, no home or temp path. The causes: `checks-failed`,
  `timeout` (`--timeout <s>`, `DA_SUITE_TIMEOUT`, default 2,700 s), `crash` (non-zero exit, no result line),
  `no-result-line`, `duplicate-suite`, `unexpected-skip`, `zero-checks`, `exit-nonzero`, `wrong-name` (tests.json's
  `name` is the name the result line prints). The full output: `mcp/.test-logs/<file>.log` (git-ignored; `--log-dir`),
  CI's artifacts; `--verbose` streams it all as before. One adapter reads results everywhere: `mcp/test-results.mjs`.
- CI's sum (`scripts/ci-sum.mjs`) checks identities, not counts: shard 0 prints exactly tests.json's suites by name,
  once each (test.mjs's SKIP the one allowed, as `sharded`), shards 1-4 exactly test.mjs; the website exactly
  run-all.mjs's `ALL`. Each problem and each `::error` annotation is the one-line form above.
- `npm test -- --affected[=<ref>]` is for local runs only: it runs the suites the files changed since `<ref>` touch
  (default tests.json `affected.base`; `git diff --name-only`, new files too), printing the reason for each pick
  ("mcp/lib/twin-write.mjs -> area twin: ..."); a safety-infrastructure path, an unmapped engine or an unknown path picks
  every suite (tests.json `affected`). CI and the final gate never use it: they run every suite (it refuses in CI).
- CI (`.github/workflows/tests.yml`) runs on pushes to `main`, on every pull request and by hand: a branch without a
  PR gets no automatic CI: open a (draft) PR, or use Run workflow (Actions > Tests > Run workflow, pick the branch).
- Website: `node scripts/tests/run-all.mjs` from the repo root (21 suites: `ALL` there, 3 at a time; `tmdl-model` and `github-links` (SQ11: every GitHub blob link's file and #anchor) run in Node alone too: `node scripts/tests/<name>.mjs`; a suite that ran 0 checks fails, `zero-checks`). Needs `npm install` in the repo root and Chromium (`npx playwright-core install chromium` if Chrome isn't found).
- After editing a file in `assets/js/`, rebuild its `.min.js` (`npm run build:min` in the repo root: terser, pinned to 5.51.2 in the root `package.json`, rebuilds every stale one; CI fails when a committed `.min.js` is not what its source gives); for `assets/css/style.css` use `npx lightningcss-cli --minify style.css -o style.min.css`. Where a page loads a file with `?v=...`, bump that version.
- Power BI Desktop checks: `scripts/tests/DESKTOP-TESTS.md` has what was proven in Desktop, how, and the quirks. Add every new Desktop result there.
- Lint and coverage (Q1, 0.3.1; root `package.json`): `npm run lint` (ESLint, bug rules only, `eslint.config.mjs`; the site pages' inline scripts too, SQ11;
  CI's website-checks) and `npm run coverage:mcp` (c8 over `npm test`, `.c8rc.json`; CI's `coverage` job, not a gate).
- The website suites' coverage (SQ15c, 0.3.1): `npm run coverage:web` (`scripts/coverage-web.mjs`: run-all with
  `DA_WEB_COVERAGE`, Chromium's `page.coverage` on every page, the engines served as their source; c8 reports
  `assets/js/*.js`) prints one line and writes `coverage/web/`; CI's `coverage-web` job, not a gate (continue-on-error).
  Measured 26 Oct (Linux, 3 at a time, 1,462 s against 1,398 s without): lines 82.9 % (13,214 / 15,943), branches
  73.0 % (7,240 / 9,924) in 34 engine files; calendar-generator.js lines 98.9 % (59.6 % under `npm test` alone).
