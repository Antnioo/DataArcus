## Summary
- **Approval:** the brief "PB1 (0.3.2)" (5 Nov); the owner D-1105-14 ("I agree queue them": MIT tools only) and the
  product promise (never damages a user's file; metadata only). Tests only: product code is read, never changed.
- **Base:** `feat/0.3.2-pb1` from `origin/integration/0.3.2` at 6b419ef. Push only this branch; never merge, no PR.
- **The tool:** fast-check 4.10.2 (MIT, LICENSE read in the npm tarball; published 19 Sep 2026), its one dependency
  pure-rand 8.4.2 (MIT, LICENSE read). An exact pin in mcp/package.json devDependencies; the lock marks both `dev: true`.
- **The suite:** `mcp/test-0.3.2-pb1.mjs` (tests.json, area safety), 9 checks; the generators live there once:
  - D1 the pin: package.json, the lock (dev: true, pure-rand too), installed; D2 no shipped file imports fast-check.
  - T1 tmdl-name.js: a name written by tmdlName reads back the same (tmdl-model.js parse), as a table, column, measure.
  - T2 a made-up model (1-3 tables, columns, measures; Arabic and Latin names, quotes, hyphens, dots, =, spaces)
    written by shadow-model.mjs shadowModel and read by tmdl-model.js fromFiles: same names, types, expressions.
  - V1 a made-up visual's literals (text as Ls, a number as String(n) + D, true or false), read by pbir-values.js and
    written back: JSON byte-equal.
  - X1 htmlEsc, X2 xmlEsc: no raw < > " ' and every & opens one of the five escapes.
  - R1 text-runs.js paragraphTexts: an Arabic and English text box cut in random runs gives every character, in order.
  - C1 canon.mjs: canon of a plan-like value (fc.jsonValue) is the same with its keys reordered at every level.
- **Run counts (measured locally: the whole suite under 3 s):** T1 10,000; T2 2,000; V1 5,000; X1 10,000; X2 10,000;
  R1 5,000; C1 5,000.
- **The seed rule:** each property has a FIXED seed in the suite (3201101-3201107), in CI and locally: a failure
  replays. `DA_PB1_SEED=<n>` runs every property on that seed (to explore). A failure prints seed, path, shrunk input.
- **Expected checks:** a new suite `PASS  pb1  9 checks`; every other suite's number as on the base; lint 0;
  check-agent-memory, check-modules --strict, check-result-lines green. No CHANGELOG line.
- **Red proof:** one planted bug per property on the working copy (restored after), each named below with its shrunk
  input. A real bug found: that property stops, "For the owner" names it, the code stays as it is.
- **State:** plan. **Resume:** step 2 (the pin).

## Plan (one commit each)
1. This note. 2. fast-check pinned (mcp/package.json, mcp/package-lock.json, nothing else).
3. The suite and its tests.json line. 4. The red proof, written here. 5. merge origin/integration/0.3.2 once if it
moved, `npm run build:min`, every check, tests.yml on this branch, `CI green:` here.
