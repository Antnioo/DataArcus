## Summary
- **Approval:** the brief "DD2T (0.3.2): one reader of a text box's runs (family text-runs)" (5 Nov); the owner
  D-1104-12 (one library, fix at the source), D-1104-18 (keep building it), D-1104-15 (text-runs is the reviewer's
  call, as CONTRACTS.md proposes), D-1016-01.
- **Base:** `feat/0.3.2-dd2t` from `origin/integration/0.3.2` at e1015660 (DD1A, DD1B, DD2O in). Push only this branch.
- **Scope:** one shared pure dual module `assets/js/text-runs.js` (CommonJS in Node, `window.DATextRuns` /
  `self.DATextRuns`): `paragraphTexts(paragraphs)`, one text per paragraph. The four `textOf` of CONTRACTS.md's
  text-runs read it; each keeps its own join and trim at the call (A " / " and trim, B " ").
- **Plan, one commit each:** 1 the module, its .min.js, suite dd2t (tests.json, beside the dd suites); 2
  report-inventory.mjs reads it (through visual-meaning.mjs, as PV); 3 layout-check.js, report-a11y.js,
  page-preview.js read it, loaded first in theme-generator.js (BUILDER, loadPreview), `npm run build:min`; 4 the parity
  test (every place, every input); 5 CONTRACTS.md, MODULES.md, CHANGELOG, WORK.md. Then merge integration once if it
  moved, `npm run build:min`, every check, `gh workflow run tests.yml`, wait.
- **Expected checks:** 4 readers -> 1 (2 joins, each named at its caller). dd2t about 50 checks after step 1, about 110
  after step 4 (exact numbers in Results). Every other suite's number unchanged; mutation 76/76; lint 0;
  check-contracts, check-modules --strict green; same-shape groups go down (4 copies of the runs reader -> 0).
- **Answers that change (only these):** a run whose value is 0 (or false) is text for report-a11y (a Tab stop, its alt
  text) and is drawn by page-preview (12 already was). Two paragraphs, an empty paragraph, spaces around: each caller's
  answer as before. No golden, twin or Desktop-measured test changed its answer.
- **State:** step 5 (the ledger, the probe, MODULES.md, CHANGELOG, WORK.md); the full run next.
- **Resume:** the full run, the merge if integration moved, CI.

## The rule
`paragraphTexts(paragraphs)`: a list, one text per paragraph that is an object (a paragraph that is not one is
skipped, as A and report-a11y skipped it); a paragraph's text is its runs' values joined as written (a run that is not
an object skipped); a value that is a string as it is, null or undefined as "", anything else as its String (0 ->
"0", true -> "true"). Never throws (paragraphs not an array: []; textRuns not an array: ""), never changes its input.
Where the paragraphs sit (`plain(general)` in three callers, `general[0]` in page-preview) stays the caller's.

## Copies before -> after (each place)
| place | before | after |
|---|---|---|
| `assets/js/layout-check.js` `textOf` | its own runs reader, `.join(' / ').trim()` | `TR.paragraphTexts(plain(general).paragraphs).join(' / ').trim()` |
| `mcp/lib/report-inventory.mjs` `textOf` | its own runs reader, `.join(' / ').trim()` | the same call; `TR` from visual-meaning.mjs (as `PV`) |
| `assets/js/report-a11y.js` `textOf` | its own runs reader (`(r && r.value) \|\| ''`), `.join(' ')` | `TR.paragraphTexts(plain(general).paragraphs).join(' ')` |
| `assets/js/page-preview.js` `textOf` | its own runs reader (`r.value \|\| ''`), `.join(' ')` | `TR.paragraphTexts(general[0].properties.paragraphs).join(' ')` |

4 runs readers -> 1 (`assets/js/text-runs.js` `paragraphTexts`), 2 joins, each named at its caller. The probe's family
text-runs: 4 places, 4 of 9 inputs disagree -> 1 place, 0 of 9. Same-shape copies (git grep of the runs reader
`textRuns ... .map((r) => String(` in assets/js and mcp/lib, no .min.js): 4 files -> 0.

## The answers, before and after (made-up inputs)
| input | layout-check, report-inventory | report-a11y | page-preview |
|---|---|---|---|
| a run with the value 0 | "0" -> "0" | "" -> "0": a Tab stop, alt text "0" | "" -> "0": drawn |
| a run with the value false | "false" -> "false" | "" -> "false" | "" -> "false" |
| a run with 12 beside text ("Top ", 12) | "Top 12" | "Top 12" (unchanged: 12 was truthy) | "Top 12" (unchanged) |
| two paragraphs | "Top / Bottom" (unchanged) | "Top Bottom" (unchanged) | "Top Bottom" (unchanged) |
| an empty paragraph between two | "A /  / B" (unchanged) | "A  B" (unchanged) | "A  B" (unchanged) |
| spaces around | "Sales" (unchanged) | "  Sales  " (unchanged) | "  Sales  " (unchanged) |
| a null paragraph before "A" | "A" (unchanged) | " A" -> "A" (`shown` trims: the same test) | threw -> "A" |
| paragraphs that are not a list | "" (unchanged) | "" (unchanged) | threw -> "" |

Only 0 and false change what a reader sees (a number that is not 0 was already text in B). A null paragraph or run,
or paragraphs that are not a list, made page-preview throw; now they read as nothing.

## Decisions I made
- report-inventory.mjs takes the module through visual-meaning.mjs (`TR`, exported beside `VT` and `PV`), not a fourth
  import: sp42 P4 pins its imports to ./read-report.mjs, ./visual-meaning.mjs, node:path, and DD1B chose the same road
  for pbir-values.js; one road for both is easier to read than an exception in P4.
- Where the paragraphs sit stays each caller's: page-preview reads the first general entry only, the other three merge
  every entry without a selector (`plain`). That is a different question (which entry holds the text), not the runs.
- A paragraph or run that is not an object is skipped, as A and report-a11y's `entries` did; a value that is an object
  stays its String, as all four copies gave it.
- The probe's family text-runs has one place now (paragraphTexts, the paragraphs taken from the first general entry,
  as the probe's boxes hold them); the callers and their joins are pinned by dd2t P, which runs them with the probe's
  own loaders (an engine's inner name, report-inventory's definition read from its source).
- The theme generator: text-runs.min.js right after pbir-values.min.js in BUILDER (report-a11y and the writer read it),
  and loaded before page-preview in loadPreview unless already there; loadCheck loads BUILDER first, so CHECK needs no
  entry. No page loads the three engines by a script tag: no HTML change but the stamps.
- MODULES.md's row grew with each step (only files that load it may be named in backticks).
- samejob.py is not in the repo: the same-shape count above is a git grep.

## For the owner
none (no golden, twin or Desktop-measured test changed its answer).

## Risky changes
- report-a11y: a text box that holds only 0 (or false) is now text: it keeps its Tab stop and the writer gives it the
  alt text "0" (before: its Tab stop was taken away as an empty panel).

## Seen, not in scope
- Other readers of a text box's runs, not in the ledger: arabic-lens.mjs `boxText` (`r.value || ''`, 0 is ""),
  twin-geometry.mjs `runText` (strings only), twin-text-fit.mjs (the twin's text fitting, out of this job), the
  writers. A family for the next ledger.
- page-preview's `textOf` still throws on a first general entry with no `properties` (where the paragraphs sit, not
  the runs).

## Lessons for the reviewer
- A loader chain edited by hand is only proven in the browser: my first step 3 put the new `.then` inside the
  time-names arrow (`null.then` when time-names was already on the page), so the theme generator's preview drew
  nothing; every Node suite passed, the website's pbip and sp31 caught it (fixed in its own commit).
- "A number value reads as ''" was true for 0 only: `(r && r.value) || ''` keeps 12. A made-up input of each falsy
  value (0, false, '', null) shows the real difference faster than the type.
- A one-place family whose callers differ by design (the join) fits the probe as one place plus a suite that runs each
  caller with the probe's loaders; four places that disagree on purpose would keep the family "disagreeing" for ever.

## Results
