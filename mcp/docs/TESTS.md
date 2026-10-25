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
- CI (`.github/workflows/tests.yml`) runs on pushes to `main`, on every pull request and by hand: a branch without a
  PR gets no automatic CI: open a (draft) PR, or use Run workflow (Actions > Tests > Run workflow, pick the branch).
- Website: `node scripts/tests/run-all.mjs` from the repo root (13 suites, 3 at a time; `tmdl-model` runs in Node alone too: `node scripts/tests/tmdl-model.mjs`). Needs `npm install` in the repo root and Chromium (`npx playwright-core install chromium` if Chrome isn't found).
- After editing a file in `assets/js/`, rebuild its `.min.js` (`npm run build:min` in the repo root: terser, pinned to 5.51.2 in the root `package.json`, rebuilds every stale one; CI fails when a committed `.min.js` is not what its source gives); for `assets/css/style.css` use `npx lightningcss-cli --minify style.css -o style.min.css`. Where a page loads a file with `?v=...`, bump that version.
- Power BI Desktop checks: `scripts/tests/DESKTOP-TESTS.md` has what was proven in Desktop, how, and the quirks. Add every new Desktop result there.
