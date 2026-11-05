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
- **State:** steps 1-4 committed; the local gate and CI are the last step.
- **Resume:** CI green line below, then DONE; the reviewer reads and merges.

## Plan (one commit each)
1. This note.
2. contrast.js + .min.js (`npm run build:min`) + test dd2k (unit) in tests.json + MODULES.md row.
3. The three places read it; scripts loaded before each; their copies go; stamps by `npm run build:min`.
4. Parity in dd2k; CONTRACTS.md "One place" line; check-contracts green.

## Copies before -> after
| place | before | after |
|---|---|---|
| design-colours.js | `lum` + `contrast` (own) | reads contrast.js; `lum` and `contrast` exported as the SAME functions |
| pbip-query.js | `lum` + `contrast` (own) | reads contrast.js; `lum` and `contrast` exported as the SAME functions |
| svg-kpi-compiler.js | `lumOf` + `contrastOf` (own) | `contrastOf` = contrast.js `contrast`; no luminance |
| total | 3 luminance + 3 contrast | 1 + 1 (assets/js/contrast.js) |

## The answers, before and after
The probe's 9 pairs, identical in all three places before and in all four after (pinned in dd2k from the base):
#000000/#FFFFFF 21; #ffffff/#ffffff 1; #767676/#FFFFFF 4.542224959605253; #118DFF/#FFFFFF 3.345129056818874;
#FFF/#000000 NaN; 118DFF/#FFFFFF 1.8102189821748678; red/#FFFFFF NaN; ''/#FFFFFF NaN; #000000FF/#FFFFFF 21.
Luminances: #000000 0; #FFFFFF 1; #767676 0.18116424424986022; #118DFF 0.26388923481431276; #FFF NaN; red NaN.
Scripts loaded: the three theme generator pages (en, lab, ar), the SVG KPI designer (en, ar), theme-generator.js BUILDER.

## Red proof
`sed` the `+ 0.05) / (Math.min(x, y) + 0.05)` in assets/js/contrast.js to 0.04: dd2k fails 26 of 62 checks (C1, C3,
C4, C6, C9 and the parity checks P of all four places). With the 0.04 in a caller's own copy instead, S1 and S2 (no
copy in a caller) and its parity check fail. dd2k's R1 also checks a 0.04 copy is told apart on the pairs.

## Decisions I made
- `luminance` reads `String(hex)` (pbip-query's form). The other two copies threw on a non-text colour
  (`undefined.slice`); the probe never gives one, no test does. Now NaN, never a throw. A crash became NaN only.
- design-colours.js and pbip-query.js take `lum` and `contrast` in two plain `const` lines (the ledger check finds
  a function by its `const` name; a destructuring is not found). MODULES.md "used by" then names the callers.
- The ledger and the probe: contrast.js is a 4th place of the family (probe 4 places, 0 disagree); `ar/` pages edited
  by hand with the same line (same shape as the English pages), not regenerated.
- dd2k's test area is `report` (no area `design` exists).

## For the owner
none

## Risky changes
none (a colour that is not #rrggbb gave NaN before and gives NaN now; only a non-text colour changed from a throw to NaN).

## Seen, not in scope
- design-colours.js Lab/sRGB code has its own `toLinear` (0.04045) beside the WCAG one (0.03928): a different threshold
  on purpose, not this family.
- `hexToRgb` stays a copy in design-colours.js, pbip-query.js (mixHex) and svg-kpi-compiler.js (mixHex): the colour
  readers' own job.

## Lessons for the reviewer
- `check-min.mjs --write` only rebuilds `git ls-files` .min.js: a new module's .min.js must be `git add`-ed first.
- `check-contracts.mjs` finds a place by its `const name =`; a destructured `const { a: lum }` is not seen.
