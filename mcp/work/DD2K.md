## Summary
- **Approval:** the brief "DD2K (0.3.2)" (5 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-18
  (keep building it), D-1104-15 (families he did not decide: the reviewer's call, as in CONTRACTS.md).
- **Base:** `feat/0.3.2-dd2k` from `origin/integration/0.3.2` at 023af77. Push only this branch; never merge, no PR.
- **Scope:** one equal-copy family in one place, NO answer changes: `contrast` (the WCAG contrast of two colours).
  One pure dual module `assets/js/contrast.js` (`luminance`, `contrast`; CommonJS, `window.DAContrast`). Not in this
  job: hexToRgb, the palette rules, the 3:1 and 4.5:1 thresholds (each caller's own).
- **Callers:** design-colours.js (`lum`, `contrast` keep their export names as the SAME functions), pbip-query.js
  (`contrast`), svg-kpi-compiler.js (`contrastOf`). Loaded before each: the theme generator pages (and the lab page),
  theme-generator.js's BUILDER list, the SVG KPI designer page.
- **Before -> after:** luminance copies 3 -> 1; contrast copies 3 -> 1. Every answer as before (NaN stays NaN).
- **Test:** mcp/test-0.3.2-dd2k.mjs (suite dd2k): the probe's 9 pairs and 6 luminances, each answer pinned (NaN as
  NaN); then the three places and contrast.js give one answer per pair. Red proof: 0.05 changed to 0.04 in one copy.
- **Expected checks:** dd2k passes; every other suite's number as on the base; check-contracts and check-modules
  --strict green; contracts probe: contrast one answer per pair; lint 0; mutation 76/76.
- **State:** step 1 (this plan) committed.
- **Resume:** step 2.

## Plan (one commit each)
1. This note.
2. contrast.js + .min.js (`npm run build:min`) + test dd2k (unit) in tests.json + MODULES.md row.
3. The three places read it; scripts loaded before each; their copies go; stamps by `npm run build:min`.
4. Parity in dd2k; CONTRACTS.md "One place" line; check-contracts green.
