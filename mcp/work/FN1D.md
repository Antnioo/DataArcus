# FN1D (0.3.2): the model-health functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1D" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1d` from `origin/integration/0.3.2` at a16fa727. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module):
  `assets/js/model-health-engine.js` `analyze`, `assets/js/gulf-health.js` `analyze`, `assets/js/health-confirm.js`
  `pleaseConfirm`. Code moves; no text, order, key or output change. FN1C's method: steps are file-level functions
  given one context object.
- **Function sizes before (my measure, `espree`, first to last line, nested functions inside their parent):** engine
  analyze 245 (:38), gulf analyze 184 (:143), pleaseConfirm 152 (:104), as the brief. Files 301, 329, 260 lines.
  Target: each under 150, every new step 80 or fewer, each file under 600. The gate's count 18 -> 15 (21 on a16fa727).
- **Expected checks:** on the base after `npm run build:min`: MCP `npm test -- model checker` all pass; website
  model-health, gulf-calendar, sp9, sp15, sp24, sp27, sp32 pass; then the same totals on each split commit, no fixture
  re-recorded (sp9-health.json, sp15-index.json, sp27-health.json unchanged). New suite fn1d (mcp/test-0.3.2-fn1d.mjs):
  the whole output of the three functions for every made-up model the suites read, recorded on a16fa727 only.
- **Contracts:** no ledger place in mcp/docs/CONTRACTS.md or scripts/contracts-probe.mjs names these functions
  (grep, a16fa727): nothing to move; `node scripts/test-contracts.mjs` run all the same.
- **Resume:** plan committed; next: characterise (suites green on the base, mutants in a worktree of a16fa727).

## The plan: parts by line range (a16fa727) and the steps
- **model-health-engine.js analyze (38-282)**, context `ah`:
  graphStep 39-80 (normalise, index, auto date tables, the dependency graph from DAX and the model), rootsStep 82-130
  (the report's use per visual, broken references, the roots), reachStep 132-163 (reachable set, used-by edges, the
  depth function, the measures list), rulesStep 165-175 (M queries, sources, chain depths, runRules), scoreStep
  177-208 (penalties, scores, the findings' order), docsStep 210-251 (nice, the measures' and tables' documentation),
  analyze builds the answer (252-281).
- **gulf-health.js analyze (143-326)**, context `gh`: setupStep 144-178 (options, the country, the weekend rule, the
  texts, `out`), calendarStep 180-201 (next Ramadan, the calendar, the measures, no calendar, the columns),
  columnsStep 203-215, weekendStep 217-233, datesStep 235-275, rangeStep and measuresStep 277-292, then the order and
  the fixes; `fixes` (a nested function reading nextRamadan, W, code, SAME, NONE, CHECK) becomes a file-level step
  given the context.
- **health-confirm.js pleaseConfirm (104-255)**, context `pc`: kitStep 105-123 (column, measures, ask, hundred,
  thousands), measureStep 124-176 (one measure's questions), relationshipStep 177-195 (the wrong key),
  unrelatedStep 196-254 (B-143: tables no relationship touches); the early return at 209 stays (the step returns).

## Decisions I made
- (filled as I go)

## CHANGELOG line
- (at the end)

## For the owner
none

## Risky changes
none planned

## For the laptop
none

## Seen, not in scope
- (at the end)

## Lessons for the reviewer
- (at the end)
