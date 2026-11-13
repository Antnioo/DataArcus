## Summary
- **Approval:** the owner, 11 Nov, D-1111-17: "go you have all night to finish everything we got so far also don't
  overlook the seen not in scope"; D-1104-12 (one job, one place). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2,
  as job LX1 (13 items; item 13 is the reviewer's night audit AUD-069).
- **Base:** `feat/0.3.3-lx1` from `origin/integration/0.3.3` at c21df8d5. Push only this branch; never merge, no PR.
- **Scope:** the 13 items of the brief, in its order of value: 13, 8, 10, 11, 12, 1, 3, 4, 5, 6, 9, 2, 7. Files: a new
  engine `assets/js/relationship-filter.js` (item 13) and its callers `mcp/lib/lineage.mjs` (and through it
  `mcp/lib/brief.mjs`), `assets/js/field-catalog.js`, the theme generator's loader; `dax-reference-parser.js`
  (items 1, 7, 8), `health-confirm.js` (1, 2), `mcp/lib/report-inputs.mjs` (10), `mcp/lib/approval-ar.mjs` (11),
  `mcp/work/LR3.md` (12, one heading), the check_report sections (4, 5, 6), `like-for-like.mjs` (9, 2); MODULES.md and
  CONTRACTS.md rows; the tests named per item; CHANGELOG, WORK.md, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict` PASS; `node scripts/test-contracts.mjs` PASS;
  `node scripts/check-contracts.mjs` PASS; area runs (report, checker, model) as I go; tk1 under 61,000; lint 0; CI.
- **Resume:** items 13, 8, 10, 11, 12, 9, 4, 6 done; 5 held for the owner ("For the owner" 1); 1, 3, 2, 7 measured and
  left under "Seen, not in scope" with why. DONE; the reviewer: review and merge (check-modules --strict 1262,
  test-contracts 14 PASS, run here).
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43133530959 on 9cb61ba50e83e2556b6f96b6c109857de8bd2d37
  (2026-11-12T01:31Z; Linux 5 of 5 parts, Windows 5 of 5, the website 3 of 3 and its checks, macOS skipped by the workflow;
  integration/0.3.3 still at c21df8d5, nothing to merge in, R-33).

## The plan (written before the code, 2026-11-12T00:12Z)
Measured on c21df8d5 (file:line, who calls it):
- **13 (AUD-069).** The filter direction of a relationship is decided in two places, both from `crossFilteringBehavior`
  alone: `mcp/lib/lineage.mjs:73` (`modelGraph`, `both: r.cross === 'bothDirections'`; read by `relsFor` in
  lineage.mjs:105 and by `brief.mjs:100` `reachOf`, which gets the graph from `modelGraph`) and
  `assets/js/field-catalog.js:98` (`relsOfTmsl`, read by `reached` :487, the picker and suggest_fields). Microsoft Learn,
  "Model relationships in Power BI Desktop", Cross filter direction
  (https://learn.microsoft.com/power-bi/transform-model/desktop-relationships-understand#relationship-properties):
  "For one-to-one relationships, the cross filter direction is always from both tables." Plan: one pure engine
  `assets/js/relationship-filter.js` `filtersBoth(r)` (TMSL names or the index's `cross`, `fromCard`, `toCard`):
  both ways when `bothDirections` or one-to-one. Called by lineage.mjs (so brief.mjs too) and field-catalog.js; the
  theme generator loads it before field-catalog.min.js. Red first on a made-up Souq: Store to a new Bridge one-to-one
  (no bothDirections), Targets to Bridge many-to-one; "Target by Region": briefCheck says one value (old) and moves
  (new), through the real server; lineageOf + compareLineage with the one-to-one turned off: "can only show other
  numbers if the data changed" (old), can show other numbers (new); field-catalog `relsOfTmsl` both (new).
  Pins expected to move: sp30 K2 (field-catalog's requires) and K3/loader order, said per test.
- **8.** `collectReportRefs` (dax-reference-parser.js:46) drops `SourceRef.Schema`; lineage.mjs `keyOfRef` tells a
  report measure by the report's list only. Plan: keep `schema: 'extension'` on the reference; keyOfRef uses it first.
  Red: a report measure and a model measure of one name, the visual on the model one.
- **10.** `unknownKeys` (report-inputs.mjs:27) names create_report's "fields" input; the input is plan_layout's
  `planFields`. Correct the sentence; re-record fn1j by its own recorder ON PURPOSE (C05, H15 per SN1).
- **11.** approval-ar.mjs:50 says DRAFT; D-1105-16 approved it: the comment says approved.
- **12.** LR3.md:19 is a plan line wrapped so it starts with `## For the owner"`: rewrap that one line.
- **1, 3, 4, 5, 6, 9, 2, 7:** measured when reached; written below or under "Seen, not in scope" with why.
Expected numbers: new suite `lx1` (about 25 checks), red on c21df8d5 first; every other suite's numbers unchanged
except those said per test under "Changed on purpose".

## Before -> after (group 1, 2026-11-12T00:28Z)
New suite `lx1` (mcp/tests.json, area checker): 19 checks, **red on c21df8d5 first** (base files checked out: R1, R2,
R3, R3c, R4, R4b, L8, L8c, L9, L10, L10b, L11, L12 failed; the controls R1b, R1c, R2b, R3b, L8b, L9b passed).
- **13 (AUD-069), closed.** One rule: `assets/js/relationship-filter.js` `filtersBoth` (bothDirections, or one-to-one,
  cited from Learn above). `lineage.mjs` `modelGraph` (each relationship's `both`, read by `relsFor` and by
  brief.mjs's `reachOf`) and `field-catalog.js` `relsOfTmsl` call it; neither reads bothDirections itself (R4b). The
  theme generator loads relationship-filter.min.js before field-catalog.min.js (new stamp a94fd468ba2f). Through the
  real server: "Target by Region" over a one-to-one Store to Bridge was "one value" (R1), now moves; lineage now says
  it can show other numbers when that relationship is turned off (R2); the picker reaches it (R3, R3c). CONTRACTS.md
  family `rel-both` (11 probe inputs), MODULES.md row.
- **8, closed.** `collectReportRefs` keeps `schema: "extension"` (the key only when written); lineage.mjs `keyOfRef`
  reads it first, so a visual on a report measure named like a model measure follows the report's DAX (L8, L8c).
  sp9 (which pins collectReportRefs' output) unchanged: 16 checks pass.
- **10, closed.** `unknownKeys`: "Fields go in plan_layout's own "planFields" input, not inside the design; layout
  choices are its other inputs." No Arabic copy of the sentence exists (grep). fn1j re-recorded ON PURPOSE by its own
  recorder (`FN1J_RECORD=1`): C05 and H15 only; their dumps before and after differ in that sentence only (checked).
- **11, closed.** approval-ar.mjs:50: "approved by the owner, D-1105-16, 5 Nov". Comment only.
- **12, closed.** LR3.md line 19 (a wrapped plan line that began `## For the owner"`) now starts "the owner's heading";
  nothing else in LR3.md changed (`git diff`: one line).
- **9, closed.** like-for-like.mjs `row()`: a base measure's name whole to NAME_OUT (200), as `lacking` (L9; past 200
  the cut is marked, L9b). ix1 64 and ix2 33 unchanged.

## Before -> after (group 2, 2026-11-12T00:49Z)
lx1 19 -> 22 checks; L4, L6, L6b **red on 25ea7865 first** (the committed impact, lineage, same-question,
check-report, read-report files stashed).
- **10, corrected.** CI run 43127713110 failed one check: `mcp/test.mjs` (5b) wants the lowercase word "fields" in the
  sentence, and "Fields go in plan_layout's own "planFields"" has none. The sentence now starts "The fields go in";
  fn1j recorded again by its recorder (the same two cases, C05 and H15).
- **4, closed.** `read-report.mjs` `reading(p, tool)`: one reading ({ loc, sk, src, inv }, the inventory worked out
  when first asked for, so a report naming no model is still refused first). check_report keeps one per report a call
  reads; `sameQuestion` (opts.readingOf), the Impact check (its new 5th argument, against's reading) and the checks
  share them. Measured with the same count (fs.openSync on the visual files, 11 visuals, against + againstModel):
  original 44 -> 33 opens, copy 55 -> 44: one inventory pass each (L4). The opens left are the two model loads
  (loadModel reads the reports beside a model): "Seen, not in scope".
- **6, closed.** `lineage.mjs` `reachOf(lineage, what, max)`: the one cap (default LISTED_MAX), the strongest tier first.
  impact.mjs's `reach` passes what is left of its answer's 60 and no longer matches visuals (keyMatch, tierOf) or cuts
  again. Said on purpose: with more than 60 visuals, the listed ones are the question tier first across pages (L6:
  63 visuals, the one where Month Number is the question was cut before, listed now); under 60 nothing changes (pages
  in the report's order, each page's visuals by tier, as before: hx1 59, hx2 43 unchanged).
- **5, not changed** (see "For the owner" 1 and "Decisions I made").

## Changed on purpose
- `mcp/fixtures/fn1j-pins.json`: A1 C05 and A1 H15 (the sentence of item 10, twice: group 1, then the wording CI
  asked for), and its `about` says so. No other pinned answer moved (the suites below).

## Runs
lx1 19, sp30 21, dd1h 35, ox1 57, ox2 29, hx1 59, hx2 43, sp9 16, fn1j 3, ix1 64, ix2 33 PASS; `npm test -- checker`
19 suites and `-- model` 31 suites PASS; website theme-generator, pbip, sp31 PASS (each alone, after build:min);
check-modules --strict 1262, check-contracts 868, test-contracts 14, result-lines 253, changelog-words 73 PASS; lint 0.
Group 2: lx1 22, v029d 22 (R9 caught `reading` naming a tool of its own: fixed, the caller passes it), mutation 250
(99 mutants, all killed), same-question 41, hx2 43, ox2 29, ix2 33, fn1e 591, sp41 25, hr2 7, pf2 15, rv1 484, audit6 47,
large-model-caps 217, sn1 20, fb4 14, lk1 23, we1 19, ox1 57, tl1 51 PASS; terminology-sheet 48 and bilingual-report 34,
3 times each (R-77); `npm test -- report` 80 suites, `-- arabic` 20 suites PASS; test.mjs 1595 PASS; lint 0.

## CHANGELOG line
Five lines in `mcp/CHANGELOG.md` [Unreleased]: the one-to-one relationship, the report's own measure, the planFields
sentence, the like-for-like base name, read_model's reach order.

## Decisions I made
- Item 13's one place is a new engine, `relationship-filter.js`, not model-index.js: the website's picker
  (field-catalog.js) does not load model-index.js and its parser; one small file costs one loader line.
- Item 13's rule is Microsoft's (Learn, quoted above), not measured by DataArcus in Desktop; the engine's header says so.
- Item 5: the clearer word is `notListed` (it says how many). Only the lint section says `truncated` (no count) inside
  check_report; the answer-level `truncated` is every tool's word for "this answer was cut" (lib/answer.mjs) and comes
  with `findingsNotListed`. Changing the lint section moves 4 outputs fn1e recorded on f6bf9fac ("Never re-recorded to
  make a run pass") and its C2 needle: measured, then put back, the owner's word asked.
- Item 6: the cap is reachOf's `max`; impact.mjs keeps only its answer's share (60 across reports).
- Item 4: the reading's skip record is shared, so a link or a file too large in a report counts once more in the
  later reader's `unread` (in doubt, more); in the tests nothing changed.
- Items 1, 3, 2, 7 left (below): each changes a pinned or shown answer, measured; the order of value put 4, 6, 9 in reach.

## For the owner
1. Item 5: check_report's lint section says `truncated: true` when its list is cut; every other section says
   `notListed: <how many>`. May fixtures/fn1e-pins.json be recorded again (4 cases: "sizes and unreadable, cap 3",
   "many overlaps", "many overlaps, lint only", "cut to the bone") so the lint says `notListed` too?

## Risky changes
- `assets/js/theme-generator.js`: the picker's loader loads one more engine (relationship-filter.min.js) before
  field-catalog.min.js; without it the picker would stop (field-catalog reads it when it loads). Website suites
  theme-generator, pbip, sp31 pass.

## For the laptop
- A model with a one-to-one relationship saved without "both directions" (Desktop writes it so): check_report's
  briefCheck should not say "one value on every row" across it (item 13). Microsoft's rule; nothing else to measure.

## Seen, not in scope
1. **Item 1 (two DAX lexers), not done, measured:** `tokenizeDax` (dax-reference-parser.js) and `CF.lex`
   (health-confirm.js) disagree on `[a] <> 0` (two tokens against one), `1.5e-3` and `.5`, `""` inside a string
   (kept escaped against unescaped), `Total×2` (one name against three tokens), `x && y`. tokenizeDax has 18 callers
   (daxCode's regex checks, the health engine, model-index's daxRefs) and sp9 pins its tokens. One lexer means one of
   the two behaviours changes what those callers find: a job of its own, with the health check's pinned answers.
2. **Item 3 (what a measure reads), not done:** the picker's `reached` (field-catalog.js, regexes, in the browser) and
   lineage's graph (Node, the health engine's graphStep) are two readings; one needs the picker to load the health
   engine's graph or the graph to move into the picker's engines, and changes suggest_fields' picks where they differ.
3. **Item 2 (three time-intelligence lists), not done:** health-confirm.js `TI` (30 names, "filters nothing through an
   unrelated table"), field-catalog.js `TIME_DAX` (15, "a time variant"), like-for-like.mjs `FIXED`/`BY_ARGS` (11, the
   shift). One list with flags needs a file both the health worker (importScripts) and the picker load; low value.
4. **Item 7 (visual type names), not done:** `typeName` answers the type id (read_report, check_report) and
   `VISUAL_TYPES` a friendly label (the health check's report view); one list of labels in visual-types.js would need the
   health page and worker to load visual-types.js. Lowest value.
5. Item 4's measurement: with againstModel the report's model folder is loaded twice when againstModel is the same
   folder (loadModel reads the reports beside a model each time); the memo `modelAt` is not used for againstModel.
6. lx1's L6 builds 63 visuals through `writeProject`: a reach suite with many visuals now exists (lx1), none before.

## Lessons for the reviewer
- `mcp/test.mjs` 5b checks the lowercase word "fields" in unknownKeys' sentence: a rewording that keeps only
  "Fields"/"planFields" fails it (CI caught it, the area runs had not reached test.mjs yet).
- v029d R9 forbids a reading-block function that names a tool itself: a new read-report.mjs helper takes the caller's name.
- CI run 43131641086 (on 68f418aa): Linux 22,489 checks PASS; two fixes after it: the type check (`npx tsc -p
  tsconfig.tc1.json` in mcp/) wants a JSDoc type on a `let x = null` later given a value in read-report.mjs (run tsc
  before CI when touching a file it checks), and lx1 L12 split LR3.md on "\n" (Windows checks out CRLF: split /\r?\n/).
