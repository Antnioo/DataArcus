# SQ15a (0.3.1 Seen, the owner's "Yes, fix now", 26 Oct): report details, model KPI targets, two models at one depth

## Summary
- **Approval:** the owner, 26 Oct: "Yes, fix now" to every open "Seen, not in scope" item, the bigger ones included;
  the reviewer's brief "Go on SQ15a". Items from [SEEN-QUEUE.md](SEEN-QUEUE.md): 0.2.9-reader-S4, L5-S1,
  0.2.9-checks-S4 (held by SQ6 for the owner: he said yes, so v029g's fixture call changes, on purpose).
- **Scope:** `mcp/lib/read-report.mjs` (inventory, the answer), `mcp/lib/model.mjs` (loadModel's tie; `kpiTarget`),
  `mcp/lib/read-words.mjs`, `mcp/lib/status-icons.mjs` (targetOf), `mcp/tools/read_model.mjs` (a KPI line);
  `mcp/test-0.2.9g.mjs` (its model path only); a new suite `mcp/test-0.3.1-sq15a.mjs` (one line in `tests.json`);
  `mcp/test-0.3.1-reader-seen.mjs` (S4-1, S4-2 back); new mutants in `mcp/test-0.3.1-mutation.mjs`; three Status cells.
  Not SQ14's files (arabic-calendar.js, pbip-query.js, report-mirror.js, check-report internals) nor SQ12's (docs).
- **Base:** `fix/0.3.1-sq15a` from `origin/integration/0.3.1` (fe3682f). Push only this branch; the reviewer merges.
- **Expected checks** (written before the work): sq15a about 20 checks, about 16 red first; reader-seen 19 -> 21 (2
  red first); mutation 69 -> 72 mutants, all killed; v029g 21 checks before and after (same count, its model path
  named); `npm test -- --keep-going` 86 -> 87 suites, all PASS; `DA_SHARD=1/4 npm test` PASS; `npm test -- model`,
  `-- safety`, `-- report`, `node test-platform-paths.mjs` PASS; check-agent-memory PASS.
- **Invariants:** metadata only: a KPI target is answered as a measure reference or "an expression", its text never;
  an image is named by its file name (screened as every name), never its content; the drill level is a field name,
  never a drilled-into value. Every guard kept (AF1's ancestors, SQ6's .pbit reads, AU47's unreadable files).
- **Resume:** see "Results" (filled as each step lands).

## The items, confirmed on fe3682f
1. **0.2.9-reader-S4** (the lab's list): drill level: absent (a projection's `active` is never read); image names:
   absent (no `ResourcePackageItem` read); z: **already read** (`z` in every visual of the JSON answer, read-report.mjs
   374 and the answer's strip); decoration folded per group: absent (each shape is its own line); custom visuals'
   friendly names: absent (`custom ChicletSlicer1448559807354`).
2. **L5-S1**: the TMDL reader already parses a measure's `kpi` block into `kpi.targetExpression` (and a model.bim
   carries it as TMSL does), but nothing reads it: `targetOf` (status-icons.mjs:39) looks at names only.
3. **0.2.9-checks-S4**: `loadModel` (model.mjs:448-449): sort by depth, then `dirs[0]`, no tie check.

## Plan
1. This note, pushed first.
2. Red first: `mcp/test-0.3.1-sq15a.mjs` (made-up names, temp working folders, in process):
   - S4: a hierarchy with Year and Month, Month `active`: the visual's drill level is `Calendar[Month]` (JSON and text);
     an image visual and a page background naming made-up files: their file names; a file name that reads like an
     instruction is withheld (the screen); a group of a shape, two images and a card: one "decoration" line for the
     three, the card its own line (text); the JSON keeps every visual (pin); a custom visual with a timestamped id:
     its name from the id ("Chiclet Slicer"); z still in the JSON (pin).
   - L5: a TMDL and a model.bim measure whose KPI target is `[Sales Target]`: kpiTarget gives the measure, targetOf
     uses it even when no name matches; a KPI target that is an expression with a made-up marker number: "an
     expression", never used, the marker in no answer (read_model, plan_layout with statusIcons); read_model lists
     each KPI with its target.
   - checks-S4: in reader-seen, S4-1 and S4-2 back.
3. Fixes at the cause, as above; v029g passes `<dir>/M.SemanticModel` where it read a folder of two models (said in
   words under "Decisions I made").
4. Mutants: R-model-tie (back), R-kpi-quoted (the expression returned), R-image-screen (an image name unscreened).
5. Suites, results below; SEEN-QUEUE.md Status cells in the same push.
