# ST1 (0.3.2): the ?v= stamps made by the build, never by hand

## Summary
- **Approval:** the reviewer's brief "ST1 (0.3.2)" (4 Nov); the owner D-1104-12 (solve the stamp function), D-1016-01
  (a stamp is written by the build, never by a person), D-1104-11 (cleanup after the split). Codex's review (4 Nov)
  set the design: build time only, a content hash, dependency order, a second build a no-op.
- **Base:** `feat/0.3.2-st1` from `origin/integration/0.3.2` at 762bba06 (not moved since: nothing merged in).
  Push only this branch; never merge, no PR.
- **Note's name:** `mcp/work/ST1.md` is 0.3.1's ST1 (the Seen sweep, 153 KB); this job's note is `ST1-stamps.md`.
- **Scope:** `scripts/stamps.mjs` (`--list`, `--write`, the check), called by `npm run build:min` and by
  `scripts/check-min.mjs` (its "changed since main" stamp block retired); `scripts/test-stamps.mjs`; the tests that
  pinned a stamp read it from the one helper (`stampOf`); one line in ARCHITECTURE.md, TESTS.md fixed, MODULES.md.
  No engine behaviour, no loader, no load order changes; nothing in mcp/ changes how it loads.
- **Measured on 762bba06 (`node scripts/stamps.mjs --list`):** 1,152 `?v=` references in 84 files: 974 .js, 156 .css,
  12 .svg, 6 .jpg, 4 .webp; 0 missing targets; all typed by hand (1,108 in 81 pages and sources, the reviewer's
  ~1,108; 44 inside 3 built .min.js: theme-generator, model-health-worker, health-worker-client).
- **Expected checks:** hand-typed stamps 1,152 -> 0; `PASS  stamps  1152 checks`; a second build changes no file;
  test-stamps red on made-up trees, green on the real tree (about 10 checks); the pinned tests unchanged in number.
- **Got:** stamps by hand **1,152 -> 0** (1,152 content stamps, 84 files written); `PASS  stamps  1152 checks`; a
  second `npm run build:min`: "stamps: nothing to change", `git status` clean; `PASS  stamps-test  17 checks`
  (red-first: two mutations of stamps.mjs fail it, 4 and 7 checks). Pinned tests: sp32 and test.mjs round 10 item 4
  were red on the built tree before step 4 (sp32 P1 "worker now ...?v=d8390a780e6b"), green after; sp14 20, sp31 17,
  sp32 39 (numbers unchanged). Lint 0; agent-memory, check-modules --strict, result-lines, site-config, csp, ar-pages,
  literal-requires PASS. Full runs: below (Results).
- **State:** the work done; the full runs and CI below.
- **Resume:** the reviewer's merge, then the gate's stamp tools (Lessons for the reviewer).

## Before -> after
- Stamps typed by hand: 1,152 -> 0. A page or loader that is stale: CI fails (`node scripts/check-min.mjs` runs the
  check) with one `FAIL  <file>: <ref>: ... (fix: npm run build:min)` line each. A person never types a stamp.
- `npm run build:min` = `check-min.mjs --write` (each stale .min.js) `&& stamps.mjs --write` (the stamps, in order).
- A stamp is `sha256(file, text as LF)`, first 12 hex: `?v=d8390a780e6b`. Order: 395 holders, a file after every
  file it loads; a source whose stamps changed has its .min.js rebuilt at once (tmdl-model 97, model-health-worker 98,
  health-worker-client 99, theme-generator 145, the pages from 391).

## Decisions I made
- The note is `ST1-stamps.md` (ST1.md is 0.3.1's job; not overwritten, as A1-agent-memory.md and R7-claims.md did).
- `https://dataarcus.com/...` (2 og:image addresses in the redesign article, EN and AR) is the site's own file and is
  stamped; any other address is left alone (none on the tree has a `?v=`).
- The holders: every tracked .html, .js and .css outside mcp/, scripts/, lab/ (the .min.js checked, rebuilt not
  written; .min.css holds none). A script's path made for its page (`../assets/js/x` in assets/js/) falls back to the
  path without its leading ../, as check-min's old block did.
- The build re-minifies only a source whose stamps it changed (check-min --write ran just before for the rest).
- `minOf` (check-min.mjs) is the one minifier; check-min runs stamps.mjs as a child (no import loop).
- A loop of references is refused with its chain (none on the tree).
- sp32's recording keeps its bytes: the worker URL's stamp in it is read as `stampOf(worker)` when loaded (the brief:
  never re-record a fixture). sp31 M2: `\?v=\d` -> `\?v=\w` (a content stamp may start with a letter).
- MODULES.md: "## Every module" takes module files only (check-modules fails a scripts/ row: tried), so the two
  scripts have their lines in "The parts" under "The site's build".
- `test-stamps.mjs` is not run by CI yet: CI's steps are in .github/ (not mine). check-min.mjs (in CI) runs the check.

## The cache (step 6, measured 4 Nov, never assumed)
- GitHub Pages ignores the query: `main.min.js`, `?v=20261025f` and `?v=0123456789ab` gave the same 15,488 bytes, the
  same etag "6ae9f2b2-3c80"; HTML and JS are sent with `cache-control: max-age=600`.
- A made-up page (scratch, Chromium, a server that ignores the query and sends max-age=600; x.min.js changed and the
  page's stamp moved from aaaa... to bbbb...): an old HTML still in the browser cache asks the old stamp and gets the
  old file from its cache while fresh (the server asked nothing); an old HTML whose script is not cached asks the old
  stamp and the server gives today's file; the new HTML asks the new stamp and fetches today's file. This is today's
  behaviour too: a stamp only decides which URL the browser cache keys on, for at most the 10 minutes of max-age.

## Results
- (the full runs and the CI line are written here)

## For the owner
none

## Risky changes
- Every page's `<script>`/`<link>` stamp changed once (84 files, the stamp text only): visitors fetch each file once.
  Nothing a page loads, or its order, changed (sp25, sp31, sp32, sp33, sp35, sp36 green: they pin the order).

## Seen, not in scope
- `node scripts/test-sitemap-lastmod.mjs` crashes on this clone ("invalid object name 'e0eb2db'"): a shallow history;
  CI checks out the whole history (fetch-depth 0). Not this job's.
- mcp/ROADMAP.md:138 and code comments (theme-generator.js 255, health-worker-client.js 22) still say "its ?v= stamp"
  (true: the stamp's place is unchanged; the build writes it).

## Lessons for the reviewer
- The gate's stamp tools (ops/gate): drop any "bump the stamp" or "changed since main" step; a stamp conflict in a
  merge is settled by taking either side and running `npm run build:min` (then `git status` shows the true stamps);
  the check is `node scripts/check-min.mjs` (min files, then the stamps). Add `node scripts/test-stamps.mjs` to
  tests.yml next to "Every .min.js is built from its source".
- A builder never edits a `?v=`; a brief that names one should say "run npm run build:min" instead.
