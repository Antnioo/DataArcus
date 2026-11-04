## Summary
- **Approval:** the brief "DD1G (0.3.2)" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1016-01
  (never 100 places), and "check which files are duplicate and one shop is older than the other" (4 Nov).
- **Base:** `feat/0.3.2-dd1g` from `origin/integration/0.3.2` at 240d179. Push only this branch; never merge, no PR.
- **Scope:** one question, "which model folder does this folder mean?", answered in one place:
  `assets/js/model-nearest.js` (pure dual module, the shape of mirror-policy.js). Given model folder paths and their
  separator: the nearest one, or the tied ones at the nearest depth (sorted). Not in this job: byName, links, B-326.
- **Callers:** model-discovery.mjs `nearestModel` (adapter: keeps its ReadError and message); model-import-browser.js
  `fromFolder` (throws MANY_MODELS with the tied paths before any file is read); theme-download-ui.js says it in
  English and Arabic. A deeper backup still counts in "others" and never wins.
- **Before -> after:** the site picked the alphabetically first of two side-by-side models silently; after, it refuses
  with both named, as the MCP does (the MCP's answers do not change; its message lists the tied ones sorted).
- **Test:** mcp/test-0.3.2-dd1g.mjs, suite dd1g: the MCP's nearestModel and the browser's fromFolder on >= 8 made-up
  folder lists, one answer for both. Red proof: the old browser sort back, it fails.
- **Ledger and map:** CONTRACTS.md family 1g ("One place" line, places say who reads it); MODULES.md new row.
  One CHANGELOG line under 0.3.2.
- **Expected checks:** dd1g passes; sp14 (fromFolder) every number as on the base; contracts check and probe: 1g one
  answer per input; check-modules --strict green; lint 0; every other suite as on the base.
- **State:** started. **Resume:** the commits below, in order.

## Decisions I made
(filled as I go)
