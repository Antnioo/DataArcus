# SP1 (0.3.2, the split, step 1): plan_layout.mjs -> lib/plan-disclosure.mjs (pure wording; behaviour identical)

## Summary
- **Approval:** the reviewer's brief "SP1" (2 Nov); the owner D-1016-01, D-1101-01, D-1102-02, D-1102-04. Backlog
  B-280 (hubs), B-286 (the split map: the Codex design audit, 1 Nov, plan_layout.mjs first, wording only).
- **Base:** `feat/0.3.2-sp1` from `origin/integration/0.3.2` at a234f06 (0.3.1's a6000a27 + TK1). Pushed only this
  branch; never merged. integration/0.3.2 had not moved when checked (still a234f06): nothing merged in.
- **Scope:** new `mcp/lib/plan-disclosure.mjs` with the pure functions that turn a built plan into its words; plan_layout
  imports them; nothing else moves. Out: plan-variants (SP2), plan-artifact, any wording change, report-run.mjs, assets/js.
- **What moved:** `lookOf` (the plan's look, A-02), `bilingualSaid` and `BILINGUAL_LAST` (the bilingual answer, X2),
  `NOT_TRANSLATED_WHY`, `MARKS`, `englishTitles` and `sayArabicPlan` (the title-language lines, R2, TT1), and the
  page-size line (O-8, the page description: the handler's two inline lines, now `pageSizeSaid(asked, page)`). Stays:
  the build (`exactArtifact`, `bilingualOf`), the sample and redesign branches and `redesignFit` (SP2), registration.
- **The test that counts:** new suite `sp1` (core), `test-0.3.2-sp1.mjs`: plan_layout's whole answer for 10 made-up
  plans, sha256 + length of each recorded on the base in `fixtures/sp1-answers.json`; the server's random ids from one
  fixed seed (`fixtures/sp1/seeded-random.mjs`, loaded only by this test); normalised: the plan id, the working folder.
- **Expected checks:** sp1 11. **Got:** sp1 11 (P1-P10, C1) on the base code at ab510e3 AND after the move at f9eb523,
  the recorded file unchanged between them. A one-character wording change in the new module: sp1 FAIL 1 of 11.
- **Before -> after:** `tools/plan_layout.mjs` 635 -> 585 lines; `lib/plan-disclosure.mjs` 63 lines (new).
- **Guards (Codex's list) after the move:** j14 30, test-0.3.1-write-gate 7, bilingual-report 33, mr1 (in core), bd1 18:
  all PASS, counts unchanged. Areas and CI: below.
- **State:** the move pushed; areas core, report, release and CI below.
- **Resume:** if CI is red, read its FAIL line; sp1 must stay byte for byte (never re-record after the base).

## The plans in sp1
P1 the sample; P2 a layout alone, page 1280x720 asked (no plan id); P3 English on twin-project; P4 Arabic with approved
names, plan fields, a page filter, a second page (tiny model); P5 Arabic with no names (twin); P6 bilingual en+ar (twin);
P7 a redesign of twin; P8 hand-placed pages (health-project); P9 flip cards and a metric switcher (tiny); P10 Arabic with
a measure no list names (notTranslated, titlesInEnglish, planProblems). C1: the answers hold every moved piece's words.

## CHANGELOG line
- **Inside the MCP:** the words a report plan says are kept in one file of their own; every plan says exactly what it
  said before.

## Decisions I made
- Seeded randomness instead of normalising ids: on two runs of the base the page ids, digests and the order of the
  terminology sheet and its places (sorted by random ids) differed. A preload module given to the test's server only
  (NODE_OPTIONS `--import`) seeds node:crypto's randomBytes, randomFillSync, randomUUID, the web crypto's
  getRandomValues and Math.random (the assets/js engines loaded by require fall back to it). Then digests compare too.
  The product code is untouched; the server never loads that module.
- Hashes, not whole answers, in the fixture (10 answers, about 150 KB); `SP1_DUMP=<file>` writes them to compare.
  The answers hold no path (checked: no working folder, no separators), so the hashes hold on Windows and macOS too.
- The page size: the brief's "page description"; its two inline lines became one pure function, same words.
- `redesignFit` stayed: it cuts the redesign's lists (SP2's variant), not wording.
- ARCHITECTURE.md route (c) names `lib/plan-disclosure.mjs: lookOf`; tests.json's affected "report" list adds the file.

## For the owner
none

## Risky changes
none (no wording or behaviour change; sp1 proves the answers identical).

## Seen, not in scope
- `docs/MODULES.md` (line 90) names `lookOf` without a file: still right, left.
- plan_layout's handler still normalises "Table[Field]" with the same regex in six places (slicerKey, norm, given...):
  a candidate for a later wording/inputs helper, not this step.

## Lessons for the reviewer
- sp1 is the gate for every later split of plan_layout: SP2 (plan-variants: `samplePlan`, `redesignPlan`,
  `redesignFit`) must pass it unchanged; P1 and P7 are the sample and the redesign. Never re-record the fixture on a
  split branch: only a deliberate wording job may, and then it says so.
- A plan's answer is deterministic only with the seed: a new random source (another crypto call) would show as a
  difference in sp1 on both base and branch; seed it in `fixtures/sp1/seeded-random.mjs`, do not normalise it away.
- Source-reading tests pin plan_layout.mjs text: sq13 (`previewOf(exact ? exact.files : null)`), bd1 (the DAX
  functions' sayInPlan), 0.3.0-claims (the kpis schema), write-gate (formatsAnswer x2), sq10 (each import once). SP2
  must keep those in plan_layout.mjs or move the tests' file names with them.
