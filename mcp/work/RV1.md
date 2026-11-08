# RV1 (0.3.2): every tool's input-validation error is capped (Codex release-review-032, B-392), and the two promises say what the code does (B-393)

## Summary
- **Approval:** the owner, 8 Nov: D-1108-03 (testers after 0.3.2), "codex is free we can run something we really need"
  (the release review); D-1108-09 "yes to both, go with your recommendations" (B-393 wording narrowed, in RV1).
- **Base:** `fix/0.3.2-rv1` from `origin/integration/0.3.2` (225498d2). Push only it; never merge, no PR.
- **Scope:** part 1: `mcp/lib/tool-answer.mjs` (`guardInputErrors`, `inputErrorSaid`), `mcp/server.mjs` (one call after
  the tools are registered), `mcp/tools/check_report.mjs` (`checks` max 50), `mcp/tools/generate_theme.mjs` (`folder`
  max 500), new `mcp/test-0.3.2-rv1.mjs` (+ row in `tests.json`). Part 2: the words of the two promises (list below).
- **Expected checks:** new suite rv1: about 467 checks through the real server (stdio), red first on 225498d2 (14 failed
  there: check_report `checks` 470,031 characters at 3,000 items, plan_layout `pages` 187,971 and 423,861, generate_theme
  `folder` with a 150,000-character string HANGS the server (no answer in 10 s), the shape checks S3-S6). All other suites
  unchanged by a byte (the pinned fixtures); `agent` suites re-checked for the instructions' last line.
- **Resume:** part 1 code and test written; part 2 wording next; then area runs, lint, CI.

## Plan
1. Red first: `test-0.3.2-rv1.mjs` on 225498d2 (done: red).
2. Fix at the protocol boundary once: `guardInputErrors(server)` wraps the SDK's `validateToolInput` (on the instance, never
   node_modules): on a validation failure it re-parses with the tool's own zod schema and answers with `inputErrorSaid`:
   the tool, the number of problems, the first 5 (path, message, what was got, a value cut at 40 characters), "and N
   more", "Fix the input and call again". `createToolError` is wrapped too, so every error the SDK makes is scrubbed and
   capped as safe()'s are (an unknown tool with a 100,000-character name).
3. Bound the two schemas whose real input is bounded.
4. Part 2: the two promise sentences in every statement; the hit list below.
