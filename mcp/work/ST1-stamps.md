# ST1 (0.3.2): the ?v= stamps made by the build, never by hand

## Summary
- **Approval:** the reviewer's brief "ST1 (0.3.2)" (4 Nov); the owner D-1104-12 (solve the stamp function), D-1016-01
  (a stamp is written by the build, never by a person), D-1104-11 (cleanup after the split). Codex's review (4 Nov)
  set the design: build time only, a content hash, dependency order, a second build a no-op.
- **Base:** `feat/0.3.2-st1` from `origin/integration/0.3.2` at 762bba06. Push only this branch; never merge, no PR.
- **Note's name:** `mcp/work/ST1.md` is 0.3.1's ST1 (the Seen sweep, 153 KB); this job's note is `ST1-stamps.md`.
- **Scope:** `scripts/stamps.mjs` (`--list`, `--write`, the check), called by `npm run build:min` and by
  `scripts/check-min.mjs` (its "changed since main" stamp block retired); `scripts/test-stamps.mjs`; the tests that
  pin a stamp read it from the one helper (`stampOf`) or check only that the reference exists; one line in
  ARCHITECTURE.md (the build), MODULES.md rows. No engine behaviour, no loader, no load order changes; nothing in mcp/
  changes how it loads.
- **Measured on 762bba06 (`node scripts/stamps.mjs --list`):** 1,152 `?v=` references in 84 files: 974 .js, 156 .css,
  12 .svg, 6 .jpg, 4 .webp; 0 missing targets; all 1,152 typed by hand (1,108 in 81 pages and sources, the reviewer's
  ~1,108; 44 inside 3 built .min.js: theme-generator, model-health-worker, health-worker-client).
- **Expected checks:** after the build, hand-typed stamps 1,152 -> 0; `PASS  stamps  1152 checks`; a second
  `npm run build:min` changes no file; `scripts/test-stamps.mjs` red on 4 made-up trees (a page with an old stamp, a
  loader with a typed one, a missing target, a target changed after the build), green on the real tree and on its
  second build (about 10 checks). Pinned tests: sp14 (WORKER_URL), sp31 M2 (`\?v=\d` -> any stamp), test.mjs R10.5
  item 4 (`\d{8}...` -> the hash); every suite's number unchanged; lint 0; agent-memory, check-modules --strict,
  result-lines, test-site-config, csp PASS.
- **State:** plan pushed; the work next.
- **Resume:** step 1 (`--list`), then 2 (the build), 3 (the check and its test), 4 (pinned tests), 5 (docs), 6 (cache).

## Plan, one commit each
1. Measure: `scripts/stamps.mjs --list` (every reference, file, target, exists; external URLs left alone; counts by kind).
2. The build: `--write`, after the .min.js rebuild in `npm run build:min`; holders in dependency order (a file after
   every file it loads; a .min.js rebuilt from its source right after its stamps change), so the leaf .min.js, then
   the worker's imports, the worker, its client and theme-generator.js's builder list, then the HTML. Run it.
3. The check: `scripts/stamps.mjs` (no flag), run by `scripts/check-min.mjs` where its stamp block ran; one FAIL line
   per stale reference with the fix; `scripts/test-stamps.mjs`.
4. The pinned tests. 5. The docs. 6. The cache, checked on a made-up page.
