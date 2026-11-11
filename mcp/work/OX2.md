## Summary
- **Approval:** the owner, 11 Nov, D-1111-16 ("go for your recommendations": OX1's asks, the brief check next, the
  Arabic verdicts drafted for approval, "Revenue by month and region" answers "Revenue by month", worded "answers it,
  split further", the public sentence held) and D-1111-17 ("go you have all night"). Relayed by the hub,
  session_015Q77oNR7YVFznptSuZoZZ2.
- **Base:** `feat/0.3.3-ox2` from `origin/integration/0.3.3` at 1e5c539a. Push only this branch; never merge, no PR.
- **Scope:** OX1's stage 2: `check_report` option `brief` and section `briefCheck` (beside `impactCheck` and
  `likeForLike`), the "one value on every row" findings for every report that names its model; question names through
  impact.mjs's `parseReach`; report measures judged through lineage's own nodes; one reading of the report and one of its
  model for every section and step; TOOLS.md, PRIVACY.md, CHANGELOG (and SEEN-BACKLOG 35, the 0.3.3 CHANGELOG's first
  bullet), MODULES.md, CONTRACTS.md, tests.json. Not: OX1's stages 3 and 4; no Arabic in any answer (drafts below).
- **Expected checks:** (written before the code) new suite `ox2` (area checker) about 36 checks, red on 1e5c539a first;
  ox1 57 with X10 changed on purpose (a report measure is judged); ix2 33, hx2 43, hx1 59 unchanged in number; tl1 51
  with the saved tools/list shape given the one new property; tk1 15 with tools/list under 61,000 (59,592 before, about
  60,400 after); the suites that pin a check_report answer, each said under "Changed on purpose";
  `node scripts/check-modules.mjs --strict` PASS; check-contracts, test-contracts, check-result-lines,
  check-agent-memory, changelog-words, test-site-config PASS; lint 0; CI on the branch.
- **Resume:** planning. Next: the code, then the suites that pin check_report.

## The plan (written 2026-11-11T20:10Z, before any code)
1. **One reading.** check-report.mjs's reading step reads the report once (it already does: `walk`, `diskSource`,
   `inventory`) and hands that reading to impact.mjs: `readOnModel(path, option, shared)` builds the lineage files from
   the inventory it is given (`filesOf`, the one builder, also `reportOf`'s) instead of reading the report again.
   The model is loaded once per call (`modelAt`, a memo by path) for briefCheck, impactCheck's "after", likeForLike,
   the pending measures, the field parameters and the lint (today each loads it again).
   Measured on 1e5c539a (a scratch count of `fs.openSync`, Souq as a .pbip): a default call opens model.bim 2 times and
   the report's JSON 57 times; `againstModel` 4 and 100; `checks: ["schemas"]` with `likeForLike` 1 and 58.
   Expected after: default 1 and at most 57; `againstModel` 2 and fewer than 100; never more than on the base.
2. **The section.** `briefCheck` = brief.mjs's `checkVisuals` (counts, the "one value" findings with why, the names not
   in the model) and, with `brief`, `checkBrief`'s questions; `proves` and `notProved` once; `unread` when a report or
   model file was not read fully. Listed 60 (`notListed`, `notInModelNotListed`), the section cut to 16,000 characters
   (`SECTION_MAX`), then cut last inside the answer's cap. Runs on every call whose report names its model when `checks`
   is not narrowed; with `checks` narrowed only when `brief` is given. A report naming no model folder: no section and
   one `notChecked` line; with `brief`: refused, naming brief, before any check (as likeForLike).
3. **The questions.** `brief: [{ id, measure, by: [] }]` (at most 60; `measure` "[Revenue]" or "Revenue"; `by` names
   like "Calendar[Month]" or "'Store'[Region]"), each name read by `parseReach` (called, never copied). A measure written
   with its table ("Sales[Revenue]") is read as the measure, as `reach` does. A `by` name that is not a column: "not read".
4. **Wording (D-1111-16).** A visual grouped by the question's columns and more answers it: status `answered`, worded
   `how: "answers it, split further"`, the extra columns named; "partly" stays only for a visual that shows the measure
   by other columns. In doubt "cannot tell": USERELATIONSHIP or CROSSFILTER under a number makes every relationship count.
5. **Report measures.** lineage.mjs's own reading of reportExtensions.json moves into one exported function
   (`reportMeasures`), called by `lineageOf` and by brief.mjs; a report measure is judged by the tables its DAX reads.
6. **Arabic.** No Arabic in any answer; `brief` with `lens: "arabic"` refused with a plain reason (IX2's decision 4).
   The drafts, each word with its why, under "For the owner".

### Expected numbers (worked out by hand from OX1's table before the code)
| # | check | expected |
|---|---|---|
| T1 | Souq as a .pbip, default call | briefCheck: 6 of 6 pairs move, 0 findings, no questions key |
| T2 | OX1's AI page added | 12 pairs: 9 move, 3 one value (the three of OX1's P7), 1 name not in the model ([Net Sales]) |
| T3 | 8 questions (OX1's 7 and "Revenue by region" with a matrix by month and region added) | 4 answered (1 "answers it, split further"), 1 partly, 1 not answered, 2 cannot answer |
| T4 | a report measure SUM ( Targets[Target] ) by Store[Region]; one calling it | one value, one value (was cannot tell) |
| T5 | `checks: ["schemas"]` with and without brief | section, no section |
| T6 | no model folder; with brief; with lens "arabic" | a notChecked line and no section; refused naming brief; refused |
| T7 | `lang: "ar"` | the section in English |
| O1 | files opened (scratch count above) | default model.bim 1, report JSON at most 57; againstModel 2 |
| C1 | 80 one-value visuals; 404 visuals | 60 listed + 20 counted, section under 16,000; answer under 40,000 |
| Q1 | an extra key, 61 questions, an empty measure | refused by the schema |
| S1 | a literal planted in a DAX text and a filter | in no answer; no hash |
| D1 | TOOLS.md, PRIVACY.md, CHANGELOG | the option, what is read and sent, the plain-words line |
