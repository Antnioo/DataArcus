# NC1 (0.3.2): the number check, layer 1: check_report says whether a copy asks the model the same questions

## Summary
- **Approval:** the owner, D-1104-01 (4 Nov) "Agree on all r&ds": RD2's recommendation (way 1) built as its section g
  says (`rd/0.3.2-number-check`, `mcp/research/RD2-number-check.md`, read only). D-1102-02: CI on the branch is the gate.
- **Base:** `feat/0.3.2-nc1` from `origin/integration/0.3.2` at 1e5e3b3. Push only this branch; never merge, no PR.
- **Scope:** `check_report { path, against }`: `path` the copy, `against` the original; a `sameQuestion` section
  beside the findings, visual by visual (page id and visual name), in three tiers: question (the numbers can differ),
  display (units, decimals), order (sort; the same fields in another order). Filters, slicer selections, visual
  calculations, report measures and bookmarks compared by SHA-256, said by field, type and count of literals, never
  returned (nor the hashes). At most 60 visuals listed, the rest counted. Read-only. Refused: two models, PBIR-Legacy,
  outside the folder, a link, a copy naming no model. Files: new `lib/same-question.mjs`; `lib/check-report.mjs`
  (+5 lines), `tools/check_report.mjs` (option, description), `TOOLS.md`, `PRIVACY.md` (check_report's row, layer 2's
  line), the public line in `ROADMAP.md` and `plans/NUMBER-CHECK.md`; new suite `test-0.3.2-same-question.mjs`
  (checker), `tests.json`, CHANGELOG, WORK. Not touched: the twin, mirror, native copy, redesign, read-report.mjs.
- **Expected checks:** (written before the code) `same-question` about 30 checks, red on 1e5e3b3 first: twin 6 same /
  2 order / 1 question / 0 display / 8 no query / 0 not matched; native 8 / 0 / 1 / 0; redesign 9 / 0 / 0 / 0; the
  planted changes each found once on its visual, nothing else; a canary in a page filter, a visual filter, a slicer
  selection, a visual calculation, a report measure and a bookmark: in no answer; 1,017 visuals with 300 differing: 60
  listed, the whole answer under 40,000 and without `truncated`, under 2 s; the refusals; files byte for byte after;
  the public line. No other suite's expected number moves; checker area and claims green.
- **Answer size (L-1102-06, measured on twin-project, base 1e5e3b3 -> after):** check_report without `against`:
  the original 14,487 -> 14,487, its twin 15,690 -> 15,690 (+0); the twin with `against`: 17,471 (the section 1,765),
  not cut. 1,017 visuals, 300 differing (`checks: ["schemas"]`): 20,239, not cut. The description 1,192 -> 1,472
  (+280), the input schema 2,039 -> 2,591 (+552). The server's instructions untouched.
- **Got:** `same-question` 41 checks, red on 1e5e3b3: 34 of 41 failed (7 guards green there: the copies written, no
  section without against, S2, S3, R3, W1, C1). After: 41 of 41. Twin 6 / 2 / 1 / 0 / 8 / 0, native 8 / 0 / 1 / 0 /
  8 / 0, redesign 9 / 0 / 0 / 0 / 8 / 0 (RD2's numbers); 10 planted changes found once each; 1,017 visuals in about
  800 ms. checker 9 of 9 suites, release 5 of 5, lint 0; the full run: below.
- **State:** CI: below.
- **Resume:** CI on the branch, then the reviewer.

## The plan
1. Red first: `test-0.3.2-same-question.mjs` on the base (the twin, native copy and redesign made through the real
   server: plan, approve_plan, write; the planted copies; the scale copies; the refusals), registered in tests.json.
2. `lib/same-question.mjs` from RD2's prototype: the reading block (locate, diskSource, inventory) for both, names out
   through safeName, fields written as read_report writes them, the same-model check, the tiers, the cap.
3. check_report: the option, the section, its budget inside AIM; the description and TOOLS.md, PRIVACY.md's row.
4. The public line: layer 1 said exactly (what it proves, what it does not); layer 2 stays planned.
5. Area runs, lint, merge the base once if it moved, CI.

## What the answer says (the twin of twin-project)
`said`: "6 of 9 visuals ask the same question; 1 differs (listed); 2 only in order; 0 only in display." Listed:
tblProducts (question: "Values: field added" the Row label report measure, "report measure changed"), colRegion and
lineMonth (order: the sort the mirror turns). Then `tiers`, `proves`, `notProved` (it does not run the queries).

## CHANGELOG line
- **Check that a copy asks the same questions:** `check_report` takes the original report as `against` and says,
  visual by visual, whether the copy (an Arabic twin, a native copy, a redesign or your own) asks the model the same
  question: the same fields, totals, filters, sort, Top N and visual calculations, the same display units and
  decimals, or only another order. It reads the files only and changes nothing; filter values and slicer selections
  are compared, never shown; it does not run the queries, so it never says the numbers themselves are the same.

## Decisions I made
- `path` is the copy and `against` the original, so `check_report`'s own checks run on the copy (the report just
  made) as before, and the compare is one more section; a refusal of `against` refuses the whole call, before any
  other work (the brief: "else refused").
- The same model: `definition.pbir`'s `byPath` resolved to its real path (lower case on Windows), or `byConnection`
  by hash. Two copies of one model in two folders count as two models: the brief says "on the same model", and
  layer 1 cannot tell two model folders are the same model.
- Fields as read_report writes them (`Table[Column]`, `[Measure]`, `Sum(...)`, the same aggregation words), each name
  through safeName; a visual calculation said by its name, its expression only in the key by hash; a per-series
  display entry said as "(one series)", its selector (which can hold a value) only in the key by hash.
- No hash is returned (RD2's prototype returned 12 characters of one): a short expression's hash could be guessed.
- A page's or the report's filter that changed counts as a question on each visual of that page (their numbers can
  differ), said once in `pages` / `report` and as one line on the visual.
- Bookmarks in their own line (before, after, changed, added, removed): a bookmark is not a visual's question.
- `expected` (what a copy's plan changes on purpose) is not built: it is way 2 (its own brief, RD2 section e).
- The list: question first, then display, then order; at most 60 and within 16,000 characters (the counts never cut).
- The suite plants 10 changes, RD2's 6 plus a slicer selection, a sort with no Top N (order only), a report measure
  and a bookmark state, so each canary kind the brief names is planted.
- The suite registers in the checker area (its code is check_report's).

## For the owner
none (nothing a report shows changes: the option is new and read-only)

## Risky changes
none (read-only; one new option; without `against` the answer is byte for byte the base's size, measured)

## Seen, not in scope
- `content/BLOG-PLAN.md` line 10 still says "a number check is planned": an internal content plan, not the public
  line; worth one word ("layer 2 of a number check is planned") at the next article.
- The EN-AR copy (`into: "same"`) gives its Arabic pages new ids: `against` finds those visuals "not found" (RD2's
  decision: matching them needs the plan's page pairs, way 2).
- The twin's waterfall rebuild (report-mirror.js) changes the query on purpose: `against` says "question differs"
  for it until way 2 passes the mirror's own list.
- R3 (an original outside the folder) passes on the base too, for another reason (the unknown input is refused).

## For the laptop
RD2's Desktop checks D2 and D3 (made-up model only: twin-project or "Ramadan Test"):
| Check | Test | Expected |
|---|---|---|
| RD2-D2 a visual calculation turned | twin-project's p1overview `lineMonth` with a visual calculation `RUNNINGSUM([Total Sales])` added; its twin; open both, Performance Analyzer on `lineMonth` | either the same running totals per month (the calculation follows the month order, not the sort: then "order changed on a visual with a visual calculation: its numbers can change" is too strict) or other totals (then the twin must not turn it, or must say so: a mirror fix) |
| RD2-D3 a sort near a data limit | a column chart with more than 60 series (made-up), sorted, then the sort turned (a copy); `check_report { path: copy, against: original }` says "sort direction changed" (order) | whether Desktop shows the same 60 series in both; if not, "order" on such a visual becomes a question |

## Lessons for the reviewer
- A copy beside the original with its own model folder is "another model" by design: tests that copy a whole project
  must point the copy's `definition.pbir` at the original's model (the suite's `copyReport`).
- The scale test runs with `checks: ["schemas"]`, so its size and its "no truncated" (L-1103-03) measure the
  section and not check_report's other findings on 1,017 made-up visuals (not measured with every check).
