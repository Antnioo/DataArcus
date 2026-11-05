## Summary
- **Approval:** the brief "DD2X (0.3.2): one XML escape" (5 Nov); owner D-1104-12 (one library, fix at the source),
  D-1104-15 (Phase 2 equal copies: one copy, no answer changes).
- **Base:** `feat/0.3.2-dd2x` from `origin/integration/0.3.2` at 3d9811a9. Push only this branch; never merge, no PR.
- **Scope:** CONTRACTS.md family xml. `assets/js/svg-escape.js` `xmlEsc` becomes the one place; `mcp/lib/flip-cards.mjs`
  reads it (createRequire, as twin-geometry.mjs requires mirror-policy.js) and keeps `const xml = SvgEscape.xmlEsc`
  as a one-line alias so the ledger and the probe still find the place. Not in this job: family html, any other file.
- **Copies before -> after:** 2 (svg-escape.js `xmlEsc`, flip-cards.mjs `xml`) -> 1.
- **Answers:** the probe's 10 texts give the same answer before and after (both copies are the same line today).
- **Expected checks:** new `mcp/test-0.3.2-dd2x.mjs` passes (in tests.json beside the dd tests); every other suite's
  number unchanged; lint 0; mutation 76/76; check-contracts, check-modules --strict, check-agent-memory,
  check-result-lines green. Same-shape groups go down.
- **Red proof (not committed):** take the `.replace(/'/g, '&apos;')` step out of svg-escape.js; the new test fails on
  the texts holding an apostrophe, for both names.
- **State:** code done, running the checks and CI.
- **Resume:** run the full suite as 4 shards, merge integration once, `npm run build:min`, `gh workflow run tests.yml --ref feat/0.3.2-dd2x`.

## Plan (one commit each)
1. This note.
2. flip-cards.mjs reads svg-escape.js; its copy goes. The test dd2x: the probe's 10 texts through both names, one
   answer each, `xml === xmlEsc`; a source check that flip-cards.mjs holds no escape chain of its own.
3. CONTRACTS.md (xml "One place" line), MODULES.md (svg-escape.js "used by" names flip-cards.mjs).
