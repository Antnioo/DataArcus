# MR1 (0.3.1): two answers the MCP review found wrong (B-270, B-271)

## Summary
- **Approval:** the reviewer's brief "MR1" (1 Nov), from the MCP review with the mcp-builder skill (findings 1 and 2).
  The owner: D-1101-01 (these two into 0.3.1; the rest of the review is 0.3.2), D-1027-13 (the release bar).
- **Base:** `fix/0.3.1-mr1` from `origin/integration/0.3.1` at 7c54e918. Push only this branch.
- **Scope:** `mcp/lib/tool-inputs.mjs` (strictInputs, strictObject), the 11 `mcp/tools/*.mjs` registrations,
  `mcp/lib/report-inputs.mjs` (colors), `mcp/lib/model.mjs` loadModel, `mcp/lib/read-words.mjs`, a new suite
  `mcp/test-0.3.1-mr1.mjs` (area core), CHANGELOG [Unreleased] one line. No `assets/js/` change.
- **Expected checks:** (written before the work, pushed in the plan commit) `mr1` about 24, each fix check red on
  7c54e918 first: S1-S11 (each tool with an unknown key), S12 (tools/list additionalProperties false), S13 guard,
  N1-N3 nested option objects, P1-P6 (the six tools with `twin-project/Twin Sale.SemanticModel`), P7-P8 guards.
  Other suites: none to move, except tests that passed an undeclared key (named below).
- **Got:** `mr1` 26 checks (S1-S13, N1-N4, P0-P8; the estimate said about 24: N took 4 and the P0 probe), red on
  7c54e918 first: 22 of 26 failed there (S1-S12, N1-N4, P1-P6); S13, P0, P7, P8 guards passed. Lint 0;
  changelog-words, result-lines PASS. Six suites changed in their calls only, each the same count as on the base
  (fx5b 21, sq9 22, metric-switcher 60, arabic-sweep 255, bilingual-report 33, large-model-caps 217); approval window
  31 (its W-01 call).
- **State: DONE.** Full run on 2789e32d: "run-tests: 129 suites passed" (mr1 26, mcp 1594, mutation 198, 76 mutants
  all killed; the base's 128 plus mr1). CI on 37e2d17b: run 41274963404 green (Linux, Windows, macOS).
- **Resume:** none; the reviewer's merge.

## Before -> after
- `read_model {path, tabels:["Sales"]}`: the whole model -> `Input validation error: Invalid arguments for tool
  read_model: Unrecognized key 'tabels'; the inputs of read_model are: path, tables. Call again without it (or with
  the input you meant).` (the SDK's prefix, then our words; zod's own is only "Unrecognized key: ...", no what-to-do).
  Same on all 11 tools; tools/list shows `additionalProperties: false` on each.
- `read_model {path:"twin-project/Twin Sale.SemanticModel"}` (and suggest_fields, plan_layout, check_model_health,
  add_gulf_calendar, create_report, generate_theme with path): "DataArcus could not finish: an internal error
  (ENOENT ...)" -> `Nothing at "twin-project/Twin Sale.SemanticModel" in the working folder <folder name>. Models
  there: twin-project/Twin Sales.SemanticModel. Call the tool again with one of these paths (relative to the working
  folder), or "." for the working folder itself.`

## CHANGELOG line
- **Two answers that misled the assistant:** a misspelled option is refused and named, not ignored; a mistyped model
  path lists the models.

## Decisions I made
- One helper: `strictInputs(tool, shape)` (the tool's inputs) and `strictObject(option, shape)` (an option object
  inside them) in lib/tool-inputs.mjs, worded by `unknownKeysSaid`; each tools/*.mjs registers through it.
- Nested objects made strict (a person or the assistant types their keys by hand; a misspelled one was dropped the
  same way): generate_theme's `palette`, `palette.ui`, `chart`, `layout`, and `colors` (create_report, plan_layout).
  Already strict and kept: columnStats, answers, gulfDates, statusIcons, restyle. Kept as they are on purpose:
  `fields`/`planFields`, `pages`/`slot`, `pageFilters`, `svgColumns`, `svgCards`, `sharedAxes`, `page {w,h}`,
  `design` (a record): they carry what an earlier answer returned (a plan's fields, a design), where a strict object
  could refuse a key an answer itself gives back; 0.3.2 can make them strict with each answer's shape measured.
- B-271: the list of models is byName's own search (relative, screened, capped at 12, "and N more"), so no new
  folder walk; no guess at the model meant (a near name is not suggested, as for a bare wrong name).
- Tests that relied on the bug, their calls fixed, never the rule: `gulfDates` (plan_layout's input only) passed to
  create_report in large-model-caps, metric-switcher, arabic-sweep, bilingual-report; `userReply` (no input since
  14 Oct) passed to approve_plan in test-approval W-01 (mr1 S6 now proves a typed go is refused and approves
  nothing). Two tests read a registration's raw shape (fx5b S, sq9): now `.inputSchema.shape`.

## For the owner
none

## Risky changes
- What an answer returns: a call with an unknown key now fails at the input (an error naming the key) instead of
  answering; an assistant that passed plan_layout's own keys (gulfDates, planFields, themeFrom, redesignPages) to
  create_report is now refused once and told which key to leave out. No check lost; no security policy, approval
  step, file writing, network or process changed.

## For the laptop
- In Claude Desktop: one call with a misspelled option (e.g. read_model with `tabels`) shows the refusal naming the
  key, and the assistant calls again without it.

## Seen, not in scope
- create_report's description says "then approve_plan with the user's reply": approve_plan takes no reply (its
  click is the approval); an assistant that passes one is now refused with the key named. A wording fix for 0.3.2.
- `test-0.3.1-glass-tables.mjs` N0 runs `git show cba24a5`: it fails on a shallow clone (seen here before
  unshallowing). The builder rules prefer a fixture file.

## Lessons for the reviewer
- A strict input finds the tests that pass keys a tool never had: they were proving nothing about those keys.
