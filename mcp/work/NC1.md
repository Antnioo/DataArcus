# NC1 (0.3.2): the number check, layer 1: check_report says whether a copy asks the model the same questions

## Summary
- **Approval:** the owner, D-1104-01 (4 Nov) "Agree on all r&ds": RD2's recommendation (way 1) built as its section g
  says (`rd/0.3.2-number-check`, `mcp/research/RD2-number-check.md`, read only). D-1102-02: CI on the branch is the gate.
- **Base:** `feat/0.3.2-nc1` from `origin/integration/0.3.2` at 1e5e3b3. Push only this branch; never merge, no PR.
- **Scope:** `check_report { path, against }`: `path` the copy, `against` the original; a `sameQuestion` section
  beside the findings, visual by visual (matched by page id and visual name), in three tiers: question (the numbers
  can differ), display (units, decimals), order (sort, the same fields in another order). Every filter, slicer
  selection, visual calculation and report measure compared by SHA-256, said by field, type and count of literals,
  never returned. At most 60 visuals listed, the rest counted. Read-only. Both reports inside the working folder, PBIR,
  no link, on the same model (`definition.pbir`), else refused. Files: new `mcp/lib/same-question.mjs`,
  `mcp/lib/check-report.mjs` (the section and its share of the cap), `mcp/tools/check_report.mjs` (option and
  description), `mcp/TOOLS.md`, `mcp/PRIVACY.md` (check_report's row), the public line in `mcp/ROADMAP.md` and
  `mcp/plans/NUMBER-CHECK.md`, new suite `mcp/test-0.3.2-same-question.mjs` (checker), `mcp/tests.json`, CHANGELOG, WORK.
  Not touched: the twin, the mirror, the native copy, the redesign, read-report.mjs (only imported).
- **Expected checks (written before the code; red on 1e5e3b3 first: `against` is refused there as an unknown input):**
  `same-question` about 30 checks: twin 6 same / 2 order / 1 question / 0 display / 8 no query / 0 not matched;
  native copy 8 / 0 / 1 / 0; redesign 9 / 0 / 0 / 0; the 6 planted changes each found once on its visual, nothing
  else; a canary in a page filter, a visual filter, a slicer selection, a visual calculation, a report measure and a
  bookmark: in no answer; 1,017 visuals with 300 differing: 60 listed, 300 counted, the whole answer under 40,000
  characters and without `truncated`, under 2 s; refusals: another model, PBIR-Legacy, outside the folder, a link;
  both reports' files byte for byte after; the public line and the description say what layer 1 proves and not.
  No other suite's expected number moves; checker area green; claims green.
- **Answer size (L-1102-06):** check_report's answer without `against` unchanged (+0); with it, measured below.
- **Got:** (after the run)
- **Resume:** the plan is pushed; next the red suite, then the module.

## The plan
1. Red first: `test-0.3.2-same-question.mjs` on the base (the twin, native copy and redesign made through the real
   server: plan, approve_plan, write; the planted copies; the scale copies; the refusals), registered in tests.json.
2. `lib/same-question.mjs` from RD2's prototype: the reading block (locate, diskSource, inventory) for both, names out
   through safeName and fields through refOf (read_report's screen), the same-model check, the tiers, the cap.
3. check_report: the option, the section, its budget inside AIM; the description and TOOLS.md, PRIVACY.md's row.
4. The public line: layer 1 said exactly (what it proves, what it does not); layer 2 stays planned.
5. Area runs, lint, merge the base once if it moved, CI.

## CHANGELOG line
(when written)

## Decisions I made
(as made)

## For the owner
none yet

## Risky changes
none yet

## Seen, not in scope
(as seen)

## For the laptop
RD2's Desktop checks D2 and D3 (below, when written).

## Lessons for the reviewer
(at the end)
