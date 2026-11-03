# RD9 (0.3.2 R&D): one answer and plan contract

## Summary
- **Approval:** the owner, D-1103-11 (3 Nov): "push more tokens to make sure we are building the best schematic";
  the scout's brief RD9 (`mcp/research/SCOUT-0.3.2.md` on `rd/0.3.2-scout`), D-1103-12.
- **Question:** can every tool's answer and every plan be described by one schema module (an `outputSchema` per
  tool, MCP's structured output), with one cap and one cut rule instead of hand-made loops, and the plan's pinned
  inputs read from the same schema?
- **Scope:** docs only: this file and scratch scripts under `mcp/research/rd9/`. No product file changes.
- **Base:** `rd/0.3.2-answer-contract` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** none by a product suite (no product file changes). The measurement script runs the real
  server over the fixtures in `os.tmpdir()`, made-up data only.
- **Expected numbers (stated before measuring):** the SDK sends structuredContent beside the text, so an answer with
  both is about 2x its text size; 11 tools, 0 with an outputSchema today; between 5 and 8 hand-made cut loops.
- **Resume:** see the plan below; the sections a-g are filled in order.

## The plan
1. Read today's code (answer.mjs, tool-answer.mjs, scope.mjs, check-report.mjs's cut, plan-headroom.mjs,
   twin-plan.mjs, read-report.mjs, plans.mjs propose, report-inputs.mjs REPORT_PINNED, report-result.mjs) and list
   every cap and cut, file:line (a).
2. Read the MCP specification (2025-06-18 structured output) and the installed SDK: outputSchema validation on the
   server and the client, structuredContent, whether the text is kept (b).
3. Measure on the fixtures (`mcp/research/rd9/measure.mjs`): each tool's answer size, with and without
   structuredContent; the fields no description names; time per call (d).
4. Three ways with size and risk (c); the recommendation (e); the client checks (f); a builder brief (g).
