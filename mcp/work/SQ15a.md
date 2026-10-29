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
- **Expected checks:** (written before the work) sq15a about 20 checks, about 16 red first; reader-seen 19 -> 21 (2
  red first); mutation 69 -> 72 mutants, all killed; v029g 21 checks before and after (same count, its model path
  named); `npm test -- --keep-going` 86 -> 87 suites, all PASS; `DA_SHARD=1/4 npm test` PASS; `npm test -- model`,
  `-- safety`, `-- report`, `node test-platform-paths.mjs` PASS; check-agent-memory PASS.
- **Invariants:** metadata only: a KPI target is answered as a measure reference or "an expression", its text never;
  an image is named by its file name (screened as every name), never its content; the drill level is a field name,
  never a drilled-into value. Every guard kept (AF1's ancestors, SQ6's .pbit reads, AU47's unreadable files).
- **Got:** sq15a 23 checks (18 red first); reader-seen 19 -> 21 (S4-1, S4-2 red first); mutation 69 -> 72 mutants, all
  killed; v029g 21 -> 21; full run "run-tests: 88 suites passed" (87 before: the 86 above was my miscount of `--list`);
  shard 1/4 PASS; model 13, safety 14, report 27 suites PASS; platform paths 30 PASS; lint clean; agent-memory PASS.
- **Resume:** done; waits for the reviewer. Nothing needs Desktop. The CHANGELOG line below is the reviewer's to add.

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

## Results
Commits: plan 99d336d, red first b9cf1bf, MANY_MODELS 41bd0da, KPI and report details 7f8275e, Status cells b47ccd0.

| Item | Before | After | Test (red -> green) |
|---|---|---|---|
| 0.2.9-checks-S4 | `loadModel`: two model folders at the top depth: the first the folder lists, silently | `ReadError('MANY_MODELS', { models })`, both named, worded "Give read_model the path of the one you mean" (SQ6's taken-back code, re-applied) | reader-seen S4-1, S4-2 red -> green; S4-3 (nearest model, one of two by path) passes |
| L5-S1 | a measure's `kpi.targetExpression` parsed (TMDL) or carried (TMSL) but never read; `targetOf` by names only | `kpiTarget` (model.mjs): one other measure (`[M]`, `T[M]`, `'T'[M]`, any case) is the target; any other expression `{ expression: true }`; `targetOf` takes the KPI's measure first; statusIcons says "its KPI ... is an expression"; read_model lists `kpis` [{ measure, target: "T[M]" / "an expression" / "none" }], at most 50 | sq15a L5-1..L5-4, L5-6, L5-7 red -> green (model.bim and TMDL); L5-5 (the marker in no answer) and L5-8 (pins) pass |
| 0.2.9-reader-S4 | drill level, image names, decoration folding, custom names absent; z in the JSON | `drillLevel` (a hierarchy role's `active` levels, a field only); `images` on a visual and a page (`background`, `wallpaper`), each through `safeName` and flagged when it reads like an instruction; two or more decorations (a shape or image with no field, text, title, action) of one group as one text line, the JSON keeps each; a custom visual's `name` from its id ("Chiclet Slicer"; an id with nothing to take off: none); z unchanged | sq15a RS4-1..RS4-6, RS4-8 red -> green; RS4-7, RS4-9, RS4-10 (pins) pass |

Mutants: before `PASS  mutation  179 checks (69 mutants, all killed, ...)`; after `PASS  mutation  186 checks (72 mutants, all killed, 37 guard suites, 174s; ...)`: R-model-tie (back, reader-seen), R-kpi-quoted (the expression returned, sq15a), R-image-screen (an image name unscreened, sq15a).

## CHANGELOG line
- Two Power BI projects side by side in one folder are no longer read as whichever comes first: DataArcus names both and asks which; a measure's own KPI target is used as its target for status icons and bullet bars (named, never quoted); read_report says the drill level a chart shows, the image files a report uses, a custom visual's name, and folds a group's shapes and images into one line.

## Decisions I made
1. **v029g changed on purpose** (the item's own change): every project there holds `M.SemanticModel` beside
   `Other.SemanticModel`, and each call read the folder, relying on the file system's listing order. Its calls now name
   `<dir>/M.SemanticModel` (one helper, `model`), as a user would after the refusal; same 21 checks, none removed.
   This also closes SQ6 "Seen" 3 (that order was a latent flake).
2. **A KPI target that is an expression is not used**: inlining the model's DAX into a script would be a second copy of
   an expression and an untested DAX shape; the user gives thresholds instead, as before. Only a reference to one other
   existing measure counts (a column, the measure itself or a missing measure: "an expression").
3. **read_model's `kpis` key** appears only when the model has a visible measure with a KPI: no other answer changes.
4. **A custom visual's name from its id only** (a trailing timestamp, a 32-digit GUID or `_OrgStore` taken off, the
   words split at capitals); never from a vendor list, and a private visual's package is still not read (SQ6's note).
5. **Decorations fold only in the text answer** and only at two or more in one group; size counting keeps each line
   (an over-count, so the 40,000 cap still holds).
6. Image file names count as names: screened, cut at 60, and an instruction-like one adds a `suspicious` entry.

## Seen, not in scope
1. `mcp/TOOLS.md` (SQ12's docs) does not yet say read_model's `kpis` or read_report's `drillLevel`, `images` and the
   decoration line.
2. bulletBar's "not used" line (dax-functions.mjs) does not say when a measure's KPI target is an expression, as
   statusIcons now does.
3. A KPI's status expression and status graphic are read by the TMDL reader but used nowhere (metadata a design could
   follow: the model's own traffic light).
