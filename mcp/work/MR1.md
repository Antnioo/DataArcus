# MR1 (0.3.1): two answers the MCP review found wrong (B-270, B-271)

## Summary
- **Approval:** the reviewer's brief "MR1" (1 Nov), from the MCP review with the mcp-builder skill (findings 1 and 2).
  The owner: D-1101-01 (these two into 0.3.1; the rest of the review is 0.3.2), D-1027-13 (the release bar).
- **Base:** `fix/0.3.1-mr1` from `origin/integration/0.3.1` at 7c54e918. Push only this branch.
- **Scope:** `mcp/lib/tool-inputs.mjs` (one helper, strictInputs), the 11 `mcp/tools/*.mjs` registrations,
  `mcp/lib/model.mjs` loadModel (a path that does not exist), `mcp/lib/read-words.mjs` (its words), a new suite
  `mcp/test-0.3.1-mr1.mjs` (registered in `mcp/tests.json`, area core), CHANGELOG [Unreleased] one line.
- **Expected checks (written before the work):** `mr1` about 24, each fix check red on 7c54e918 first:
  S1-S11 (each of the 11 tools with an unknown key: refused, the key named, the inputs listed, "call again without
  it"); S12 (tools/list: `additionalProperties: false` on all 11); S13 (a call with only declared keys still answers:
  a guard); N1-N3 (nested option objects a person types by hand, named under "Decisions": a misspelled key there
  refused too); P1-P6 (read_model, suggest_fields, plan_layout, check_model_health, add_gulf_calendar, create_report
  with `twin-project/Twin Sale.SemanticModel`: the models in the working folder listed, "call again", no "internal
  error", no absolute path); P7-P8 guards (a bare wrong name: as before; a path outside the folder: still refused).
  Other suites: none should move, except a test that passed an undeclared key (each named in the note if any).
- **Got:** (after the work)
- **State:** plan pushed; the work next.
- **Resume:** write the red suite on 7c54e918, then the fix.

## The plan
1. B-270: `strictInputs(tool, shape)` in lib/tool-inputs.mjs returns `z.object(shape).strict()` with its own words
   for an unknown key; every tools/*.mjs registers its inputSchema through it. The SDK's own message for a strict
   object is zod's "Unrecognized key: ..." (it does not say what to do), so the helper words it.
2. B-271: loadModel: a path with a folder part that does not exist throws a ReadError `NO_MODEL_AT` with the models
   in the working folder (relative, capped at 12 as NO_MODEL_NAMED is); read-words.mjs words it with "call again".
