# MP1e (0.3.1): part 8's English-beside-Arabic differences

## Summary
- **STOP (blocked on the evidence):** the real definition JSON of the 6 dashboards is on the engine
  (`Antnioo/dataarcus-engine`, branch `lab/dashboard-shapes`, business/beta/shapes/<name>/en|ar/definition/) and the
  review is business/reviews/2026-11-01-part8-en-vs-ar.md there. This session cannot read that repository: attaching
  it was refused by the session's permission check (not by GitHub). Six of the eight items start with "find what
  these are / find why" in the real files; building their red tests from guessed shapes is what MP1d's lesson warned
  against (made-up shapes that pass on the old code teach nothing). The owner decides: give this session read access
  to the engine, or copy `business/beta/shapes/` (and the review file) into a branch of this repo.
- **Approval:** the reviewer's brief "MP1e" (1 Nov, 06:45), the owner's D-1101-03 (every part 8 difference fixed in
  0.3.1). Not this job: legend fitting, table widths, matrix code (MX2).
- **Base:** `fix/0.3.1-mp1e` from `origin/integration/0.3.1` (7c54e918), then merged in the brief's order:
  `fix/0.3.1-mr1` (76d70767, clean), `fix/0.3.1-mp1d` (c8c90c9f: `mcp/tests.json`, both suites' lines kept),
  `fix/0.3.1-mx1` (f4ad3a86: `mcp/tests.json` and `mcp/CHANGELOG.md`, both sides kept, as each later branch intends:
  every line added, none dropped). After the merges: lint 0, check-min 75 match.
- **State:** base merged and pushed; the work waits for the shapes.
- **Resume:** fetch the shapes, then the plan below, red first from each real visual.json.

## What the code shows already (before the shapes)
1. Fintech p3, the status lines reversed: `assets/js/report-mirror.js` mirrorVisual reverses a new card's (cardVisual)
   Data projections whenever it has two or more, whatever its arrangement. Microsoft's catalog gives the arrangement
   as `layout.orientation`, an enumeration 0, 1, 2 (Learn names them Horizontal, Vertical, Grid but not their
   numbers), with `rowCount` / `columnCount`. The fix (reverse only a horizontal arrangement; a grid row by row) needs
   the real card's `layout` entry to know which number is vertical.
2. Time direction: line, area, stacked area, combo and ribbon charts are the mirror's "column" kind. A categorical
   axis turns by the sort (reversed, or a descending sort added when there is none); a continuous one by
   `categoryAxis.invertAxis`, only when the category is a column the model read as a date (`dateColumns`) and the axis
   is not set Categorical. Candidate causes for the left-to-right pages: a date hierarchy level on the axis (not a
   Column: no invertAxis), a date column the model read did not type, a sort by a measure, small multiples' roles.
   Which one each page has is in its visual.json.
3-8. (month buttons, the agent cards and their photos, the agent card's columns, AdventureWorks' two buttons, the text
   cards' alignment, RepeatIQ's centred KPI cards) each needs the visual's type, roles and formatting cards from the
   real file before a cause can be named.

## For the laptop
- (to fill per item, with its page, for part 9)
