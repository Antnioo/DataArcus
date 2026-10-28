# FX5 (0.3.1): bar and column thickness by the number of categories

## Summary
- **Approval:** the reviewer's brief "Go on FX5" (28 Oct), the owner's D-1028-06 ("yes fx5 now": "we need to apply
  some kind of sizing to display them in the right way and also not make the bars that wide or columns in case of
  column chart"). Binding: D-1027-12 (the twin identical to the English report).
- **Scope:** one rule in `assets/js/pbip-sizing.js` (`BAR_MAX_720`, `barSpan`, `barBand`), used by the writer
  (`assets/js/pbip-page.js` fixVisual and the phone layout), the preview (`assets/js/page-preview.js`) and the Theme
  Generator's canvas (`assets/js/theme-generator.js`); their .min.js and `?v=`; new suite `mcp/test-0.3.1-fx5.mjs`.
  Not FX2's or FX4's files (design-engine.js, report-mirror.js, pbip-bind.js, plan_layout, create_report, TOOLS.md).
- **Base:** `fix/0.3.1-fx5` from `origin/integration/0.3.1` (84596b9c). Push only this branch.
- **The rule (planned):** Microsoft's catalog (@microsoft/powerbi-core-visual-schema 0.1.3, capabilities.json) gives
  every bar and column kind `categoryAxis.innerPadding` ("Space between categories", integer percent of a category)
  and `categoryAxis.outerPadding` ("Outer padding", the same at the edges). A bar is never thicker than
  `BAR_MAX_720` = 36 at 1280 x 720 (two of Desktop's own default bars: 22.2 a row at its 20% inner padding is 17.8),
  times the text factor on other pages (`textScale`: 45 at 1920 x 1080). Where the count n is known (the chart's Top N;
  a day, month or quarter axis; a field of two or a few known texts; a calendar's rows) and Desktop's default bar
  (span / n x 0.8) would be thicker than the maximum, the writer sets inner = outer = p, p = (span - max x n) /
  (span + max), rounded up to a whole percent: the bars at the maximum, the gaps equal, the chart centred. Count not
  known, or the default already thin enough: nothing written (today's look). Never the value axis (D-1028-06's three
  equal bars are equal values).
- **Expected numbers (before the work):** bar chart, 3 categories, 277 high at 1280 x 720 (span 186): default 49.6 ->
  inner = outer 36, bars 35.4. The same at 1920 x 1080 (416 high, span 279.5): 74.5 -> 45, bars 44.6. 12 categories
  at 277 high: 12.4, nothing written. Column chart 1,872 wide at 1920 x 1080 with 3 (span 1,800): 480 -> 91, bars 41.4.
  Phone layout: the same rule on the phone's box, at 720 units. Previews: the bars drawn at the written thickness.
- **Expected checks:** new `fx5` about 20 checks, red on 84596b9 first except its guards (12 categories unchanged, the
  count unknown unchanged, the value axis untouched); Microsoft's validator 0 errors on the written charts. Other
  suites: no number changed unless a golden's chart has a known count; each such change said per test below. Website:
  `pbip`, `theme-generator` the same counts unless said. Full run: base + 1 (fx5).
- **Got:** (to fill)
- **Resume:** the plan pushed; next the red test, then the rule.

## Before -> after
(to fill)

## CHANGELOG line
(to fill)

## Decisions I made
- `BAR_MAX_720` 36 is derived from Desktop's measured default row (DESKTOP-TESTS.md, 22.2 a row at 10pt, 1280 x 720),
  not measured as a maximum: the laptop confirms the look (For the laptop).

## For the owner
(to fill)

## Risky changes
(to fill)

## For the laptop
(to fill)

## Seen, not in scope
(to fill)

## Lessons for the reviewer
(to fill)
