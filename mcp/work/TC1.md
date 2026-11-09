# TC1 0.3.3: the type-checking pilot (B-396, D-1108-13)

## Summary
- **Approval:** D-1108-13 (8 Nov, "yes queue the type checking pilot after 0.3.2"); 0.3.2 shipped 9 Nov; tonight's mix D-1109-09.
- **Base:** `feat/0.3.3-tc1` from `origin/integration/0.3.3` (d8551081). Push only it; no merge, no PR.
- **Scope:** `mcp/lib/model.mjs` (comments only), mcp/package.json + package-lock.json (typescript devDependency, exact pin),
  new `mcp/tsconfig.tc1.json` (checks that one file), one step in tests.yml (mcp job, Linux), this note.
- **Expected checks:** comment-stripped model.mjs byte-identical to the base's; `npm pack` file list before/after identical
  (1325 files before); `npx tsc -p tsconfig.tc1.json` exits 0 after; area runs (model, core) PASS; lint 0; CI green.
- **Resume:** DONE; CI green (CI section below); waits for the reviewer. Recommendation: roll out (section below).

## Plan and numbers (measured 2026-11-09)
Busiest module: count of distinct mcp/lib and mcp/tools files importing each mcp/lib file (112 files scanned):
1. lib/model.mjs 45; 2. lib/read-report.mjs 31; 3. lib/files.mjs 15; 4. lib/plain-words.mjs 14; 5. lib/plans.mjs 12
(agent-text, path-rules, tool-answer also 12). Pilot: lib/model.mjs (435 lines).
Checker: typescript 7.0.2 (npm latest; published 2026-07-08, over 4 months old). Run: `npx tsc -p tsconfig.tc1.json`.

## Got (2026-11-09T21:35Z)
- **Busiest module:** lib/model.mjs 45 importers; read-report 31; files 15; plain-words 14; plans 12 (counted: distinct
  mcp/lib and mcp/tools files with a relative import of it, 112 files scanned; `import ... from`, `import()` and `require()`).
- **model.mjs:** `// @ts-check` plus JSDoc (81 comment lines added, 12 existing lines gained an inline comment). Every exported
  function and every helper has `@param`/`@returns`; shapes: ModelRead (existing, fixed), ModelIn, PbitLimits, ZipReader, SkippedFile.
- **No runtime change, proved:** `tsc --allowJs --noCheck --removeComments` on the base's file and on the new file gives
  byte-identical output (26324 bytes both). The proof is sensitive: changing `MAX_DEPTH = 256` to 257 makes it differ.
- **Checker:** typescript 7.0.2 (exact; npm "latest", published 2026-07-08) and @types/node 20.19.39 (exact; the Node
  typings, needed for `node:fs` and Buffer; engines say node >=20.10), both devDependencies of mcp only.
  `npx tsc -p tsconfig.tc1.json`: exit 0, 0.4 s locally; `npm ci` 2.6 s. CI step: in the `mcp` job (Linux), after ci-sum.
- **tsconfig.tc1.json:** strict on (noImplicitAny, strictNullChecks and the rest). Turned off: `checkJs` (false: the file opts
  in with `// @ts-check`, so the other files it imports are not reported, only typed through), `useUnknownInCatchVariables`
  (a `catch (e)` then reads `e.code` as 17 existing lines do; typing every catch needs a code change, which this job forbids).
- **npm pack before/after:** 1325 -> 1327 files; added exactly `tsconfig.tc1.json` and `work/TC1.md` (mcp has no "files"
  list, so every repo file under mcp/ is in the pack); nothing removed; no dependency is packed (devDependencies).
  So the list is identical apart from the two new repo files this job adds.

## What the checker caught on the base
On the base with only `// @ts-check` (no JSDoc): 109 error lines (about 85 implicit any, the rest null and shape errors).
After the types, 10 sites remain that I marked `// @ts-expect-error <why>` (a comment: the checker fails if one stops being needed):
1. model.mjs:103 `real()` passes `ROOT` (string or null) to `fs.realpathSync.native`: with no working folder it throws a TypeError, not
   the clean rootProblem() words. Callers (answers.mjs:53, redesign.mjs:133, read-report.mjs:179, twin-write.mjs:131,
   native-copy.mjs:149, files.mjs:43) must check first. A latent gap, no known path: **Seen** line for the reviewer, no fix here.
2. model.mjs:110 `inside()`: same null ROOT after `rootProblem()` returned nothing: a typing gap (checker cannot follow it).
3. model.mjs:200 `tooDeep`: `st.pop()` possibly undefined, guarded by `while (st.length)`: typing gap.
4. model.mjs:366 `loadModel` `root` string|null: null only when rootProblem() throws next line: typing gap.
5-8. model.mjs:455, 461, 463, 473: `projectDir` null only when `beside` is empty, so the callbacks never run with null: typing gaps.
9-10. model.mjs:402, 476: `.filter(Boolean)` drops the nulls at run time, the checker keeps them: typing gaps.
Also fixed in comments only (doc gaps, real): the ModelRead typedef did not list `print` (loadModel returns it), nor `reportsSeen.notRead`;
`Array` without a type argument (3 places). Wrong field names: none found. Possibly-undefined: only the gaps above. Uncapped lists: not a checker finding.
Real bugs found: 0 (one latent gap, item 1).

## Cost
About 25 minutes of work for one 435-line file (504 lines now), 81 comment lines of JSDoc, 10 expect-error lines. Most errors
were untyped parameters (mechanical); the 10 left are flow the checker cannot see. Roughly 3 s of CI time per run.

## Recommendation for the owner
Roll out, file by file, starting with the next busiest (read-report.mjs 31, files.mjs 15): the cost is low and the run is fast, it
caught one latent null path and three stale type comments in the first file, and the proof that no runtime line changed is cheap.
Keep each file's expect-errors listed; do not turn on checkJs for all of mcp at once.

## Decisions I made
- Added @types/node as a second devDependency (the checker cannot type `node:fs` without it). Pinned exact.
- checkJs false plus per-file `@ts-check`, so the pilot reports one file only.
- `@ts-expect-error` (comments) instead of casts, because a cast changes runtime parentheses.
## CHANGELOG line
none (nothing that ships changes).
## For the owner
- Roll out to the next files (read-report, files), or stop? Recommendation: roll out.
## Risky changes
none.
## For the laptop
none.
## Seen, not in scope
- real() in lib/model.mjs throws a TypeError when no working folder is set and a caller has not checked rootProblem() first (item 1).
- `npm run lint` needs the root `npm ci` too (a fresh clone fails with a missing module until it is run).
## Lessons for the reviewer
- TypeScript 7 has no JavaScript API (`require('typescript')` is absent); a comments-stripped comparison goes through `tsc --removeComments`.
- The brief said the shipped files list is identical: mcp has no "files" field, so adding any file under mcp/ changes `npm pack`'s list.

## CI
- First run 42704058686 on 185278d4: red only on `same-question` S4 (`the compare of 1,017 visuals under 2 s on linux: 2429 ms`, a 2000 ms budget at
  mcp/test-0.3.2-same-question.mjs:146, a file this job does not touch; it passed on the rerun). My TC1 step was skipped there because ci-sum failed
  first, so it got `if: always()`. Seen: that budget has no 2x headroom (L-1104-02).
- The TC1 step in the green run: 2 s (22:11:14 to 22:11:16Z, including `npm ci`); `tsc` itself 0.4 s.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/42708313346 on 9305b265 (2026-11-09T22:19Z; origin/integration/0.3.3 merged once before it).
- Area runs before the last code commit: `npm test -- model` 31 suites PASS, `npm test -- core` 12 suites PASS, lint exit 0, check-agent-memory and modules PASS.
