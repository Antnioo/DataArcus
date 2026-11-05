# FN1C (0.3.2): three writer and twin functions into named steps, behaviour identical

## Summary
- **Approval:** the brief "FN1c" (5 Nov); the owner D-1104-13 (the ratchet on functions over 150 lines, FN1 in DD1's
  plan), D-1104-12 (a library of functions, fixed at the source), D-1104-18 (keep building the library).
- **Base:** `fix/0.3.2-fn1c` from `origin/integration/0.3.2` at ca3a1b73. Pushed only this branch; never merged, no PR.
- **Scope:** three functions split into named steps, each in its own file (no new module): `assets/js/pbip-page.js`
  `write`, `mcp/lib/twin-plan.mjs` `planTwin`, `mcp/lib/shadow-model.mjs` `shadowModel`. Code moves; no text, order,
  key or file byte changes. FN1A's method: steps are file-level functions given one context object.
- **Function sizes (my measure, `espree`, first to last line, nested functions inside their parent; the gate's
  `ops/gate/funcsize.py` is not in DataArcus):** on ca3a1b73 write 327 (at :65), planTwin 321 (:113), shadowModel 212
  (:135): the brief's numbers. Target: each under 150, every new step 80 or fewer, each file under 600 (today 426,
  433, 364). Ratchet: the gate's count 21 -> 18 for the reviewer to set (the baseline lives in `ops/gate/`).
- **Expected checks:** the base ca3a1b73 after `npm run build:min`: MCP `npm test -- report twin model` and website
  sp7, sp13, pbip, each total read from its output file (filled in below once run). Planned: the same totals after each
  split, no fixture re-recorded (sp7-reports.json, sp11/sp26/sp40-twins.json and sp28's recorded reports unchanged);
  new checks only where a mutant turns no suite red, each red on ca3a1b73 under its mutant first.
- **Characterisation:** one or more mutants per step, each in a git worktree of the base; which suite turns red.
- **Resume:** the plan is committed; next the base runs, the mutants, then one commit per file.

## The parts and the steps I will name (old line ranges on ca3a1b73)
- **pbip-page.js write (65-391), context `pc` (the page), the report's names destructured from `c` as today:**
  pagePart 73-81 (page.json), kitPart 84-126 (take, container, placeNav), slotsPart 131-160 (fitSlots, kinds,
  sorted, groups' boxes, the KPI row, slicers), groupsPart 162-177 (groups and their panels), headPart 180-187,
  visualsPart 189-229 (each slot's visual, the page buttons), tipsPart 232-247 (the filter panel, chart tooltips),
  phonePart 251-300 (the phone layout), sameTitlesPart 305-347, topTitlesPart 354-369, filesPart 375-390. The one
  `let` several steps write, `z`, becomes `pc.z` (a syntax-tree rename, identifiers only).
- **twin-plan.mjs planTwin (113-433), context `ctx`:** placeStep 116-121, picturesStep 125-145, labelsStep 146-193,
  pagesStep 195-219, mirrorsStep 221-230, cannotStep 231-271, checksStep 272-284, builtStep 286-293, tablesStep
  300-314, legendsStep 323-344, glassStep 348-357, copyStep 360-374, listsStep 376-396, answerStep 398-432 (the
  answer; planTwin returns it). `addedVisuals` (a `let` set twice) goes back to the context where it changes.
- **shadow-model.mjs shadowModel (135-346), context `sm`:** planStep 136-156, keysStep 158-172, sizesStep 174-185,
  poolsStep 187-197, rowsStep 199-251, tableFile 257-320 (one table's file), modelFiles 322-344.

## Decisions I made
- The steps are written by a script from the old line ranges (each moved line byte-identical); each step's inputs
  are read from its own syntax tree (eslint-scope: the names it uses that the old function declared), its outputs
  are the names it declares that a later step uses; lint's no-undef and no-unused-vars as the proof.
