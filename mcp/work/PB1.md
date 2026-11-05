## Summary
- **Approval:** the brief "PB1 (0.3.2)" (5 Nov); the owner D-1105-14 ("I agree queue them": MIT tools only) and the
  product promise (never damages a user's file; metadata only). Tests only: product code is read, never changed.
- **Base:** `feat/0.3.2-pb1` from `origin/integration/0.3.2` at 6b419ef. Push only this branch; never merge, no PR.
- **Scope:** fast-check 4.10.2 as an exact devDependency of mcp/ (MIT, LICENSE read in the npm tarball, published
  19 Sep 2026; its one dependency pure-rand 8.4.2, MIT, LICENSE read; the lock marks both `dev: true`), and one new
  suite `mcp/test-0.3.2-pb1.mjs` (tests.json, area safety) holding the generators once. Nothing else.
- **The 9 checks:** D1 the pin (package.json, lock dev: true for both, installed); D2 no shipped file (server.mjs,
  lib/, tools/, assets/js/) imports fast-check.
  - T1 tmdl-name.js: a name written by tmdlName reads back the same (tmdl-model.js parse) as a table, column, measure.
  - T2 a made-up model (1-3 tables, columns, measures; Arabic and Latin names, quotes, hyphens, dots, =, spaces)
    written by shadow-model.mjs shadowModel and read by tmdl-model.js fromFiles: same names, types, expressions.
  - V1 a made-up visual's literals (text as Ls, a number as String(n) + D, true or false), read by pbir-values.js and
    written back: JSON byte-equal; a literal no reader reads fails.
  - X1 htmlEsc, X2 xmlEsc: no raw < > " ' and every & opens one of the five escapes.
  - R1 text-runs.js paragraphTexts: an Arabic and English text box cut in random runs gives every character, in order.
  - C1 canon.mjs: canon of a plan-like value (fc.jsonValue) is the same with its keys reordered at every level.
- **Run counts (the whole suite under 3 s locally):** T1 10,000; T2 2,000; V1 5,000; X1 10,000; X2 10,000;
  R1 5,000; C1 5,000.
- **The seed rule:** each property has a FIXED seed in the suite (3201101-3201107), in CI and locally: a failure
  replays. `DA_PB1_SEED=<n>` runs every property on that seed (to explore). A failure prints seed, path, shrunk input.
- **Expected checks:** a new suite `PASS  pb1  9 checks`; every other suite's number as on the base; lint 0;
  check-agent-memory, check-modules --strict, check-result-lines green. No CHANGELOG line.
- **Found:** no real bug: all 9 green on the fixed seeds and on 13 more seeds by hand. Red proof: 7 of 7 (below).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41996195672 on 59be953f7eee5a6079e19796d13474e42efc6206
- **State:** DONE (Linux and Windows CI; local 210 of 210 suites).
- **Resume:** the reviewer reads and merges.

## Plan (one commit each)
1. This note. 2. fast-check pinned (mcp/package.json, mcp/package-lock.json, nothing else).
3. The suite and its tests.json line. 4. The red proof, written here. 5. merge origin/integration/0.3.2 once if it
moved, `npm run build:min`, every check, tests.yml on this branch, `CI green:` here.

## Red proof (a one-character bug planted on the working copy, the suite run, the file restored)
| Property | The planted bug | Shrunk input that fails |
|---|---|---|
| T1 | tmdl-name.js: `"''"` -> `"'"` (a quote no longer doubled) | the name `'ا` (T2 fails too: a column `'ا`) |
| T2 | shadow-model.mjs: `q(m.name)` -> `(m.name)` (a measure name written bare) | one table `a`, a measure ` ا` (a leading space) |
| V1 | pbir-values.js: QUOTED `/^'.*'$/s` -> `/^'.*'$/` (no line break in a text) | a visual whose `title.show` is the text `'\n'` |
| X1 | html-escape.js: `/[&<>"']/g` -> `/[&<>']/g` | the text `"` |
| X2 | svg-escape.js: `replace(/'/g, '&apos;')` -> `replace(/'/, ...)` (first only) | the text `''` |
| R1 | text-runs.js: runs joined with `' '` instead of `''` | one empty paragraph of two empty runs (gives a space) |
| C1 | canon.mjs: `!Array.isArray(x)` -> `Array.isArray(x)` (objects not sorted) | `{"":false," ":""}` reordered |
The first V1 run kept a literal no reader read as it was, so its planted bug passed: the suite now fails such a literal
(commit 95ccc88), and the bug goes red.

## Decisions I made
- The TMDL writer is shadow-model.mjs shadowModel (it writes a whole model from a model's JSON), the reader
  tmdl-model.js fromFiles; tmdl-name round-trips through tmdl-model.js parse (its readName is not exported).
- Names may start or end with a space (they round-trip); no line break in a name and no backtick in an expression,
  and no space at an expression line's end (see "Seen").
- V1's writers: a text as twin-visuals.mjs Ls, a number as String(n) + D (as twin-text-fit and twin-pages write it).
- The packager's graph test is in the private packaging repo (audit-8): here D1 proves the lock marks fast-check and
  pure-rand `dev: true` (round22's shipped list is the lock without dev) and D2 that nothing shipped imports it.
- One area, safety. Run counts set for under 60 s on a slow CI runner with room to spare (under 3 s here).

## For the owner
none

## Risky changes
none (a devDependency and a test; nothing shipped changes)

## Seen, not in scope
- A model name holding a line break reads back cut at the break (`x\ny` -> `x`); an expression line that is exactly
  ``` reads back empty; an expression line's trailing spaces are dropped. Desktop names hold no line break; tried
  by hand only, outside this suite's generators.
- The private packaging repo's graph test should name fast-check and pure-rand as not shipped (laptop list).

## Lessons for the reviewer
- A property's red proof found a hole in the property itself (V1): plant the bug before trusting a green property.
