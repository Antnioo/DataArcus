# MP1e (0.3.1): part 8's English-beside-Arabic differences

## Summary
- **Evidence:** DataArcus branch `evidence/0.3.1-shapes` (c9a151d9, the owner allowed it; read only, never merged):
  lab/evidence/0.3.1-shapes/ (the reviewer's part8-en-vs-ar.md; each item's visual.json EN and AR). The tests use
  made-up shapes built from those (no file copied whole). The engine itself stays unreadable here (not needed now).
- **Approval:** the reviewer's brief "MP1e" (1 Nov, 06:45), the owner's D-1101-03 (every part 8 difference fixed in
  0.3.1). Not this job: legend fitting, table widths, matrix code (MX2).
- **Base:** `fix/0.3.1-mp1e` from `origin/integration/0.3.1` (7c54e918), then merged in the brief's order:
  `fix/0.3.1-mr1` (76d70767, clean), `fix/0.3.1-mp1d` (c8c90c9f: `mcp/tests.json`, both suites' lines kept),
  `fix/0.3.1-mx1` (f4ad3a86: `mcp/tests.json` and `mcp/CHANGELOG.md`, both sides kept, as each later branch intends:
  every line added, none dropped). After the merges: lint 0, check-min 75 match.
- **Scope:** `assets/js/report-mirror.js` (1, 2, 3, 4, 7, 8; build:min and new stamps), `mcp/lib/twin-texts.mjs` (5),
  `mcp/lib/twin-plan.mjs` (4's and 6's lines in cannot), a new suite `mp1e` from the real shapes. Not MX2's ground.
- **Expected checks:** (written before the work) a new suite `mp1e`, about 14 checks, red on the merged base (6bbcaec4)
  first except guards: C1 (a card of 4 values laid out vertically, orientation 1D: its values keep their order) and
  C2 (a grid of 7 in one row, 2D: reversed, a guard); T1-T4 (time runs right to left: a line on a date column of a
  date table the model did not type (invertAxis as well as the sort), an area chart likewise, a line on a 4-level date
  hierarchy sorted ascending on every level (every level's sort turned), a line on a 2-level hierarchy with no sort
  (every level sorted descending)); S1 (a button slicer laid out as a 3 x 3 grid, 50 px high, one row of months:
  sorted descending); K1-K2 (a card grid of agents: the photo and the name header to the right; one of several rows:
  named in cannot); R1 (reference label titles padded into a column in English: their Arabic padded to one width);
  A1 (a card's text value with its own value entry: right-aligned like the numbers); A2 (centred KPI values stay
  centred); F1 (a field parameter's choices on a slicer: named in cannot with the step that would make them Arabic).
  mp1, mp1-shapes and MD-e stay green. Full run: the base's suites + 1 (mp1e).
- **State:** plan pushed; the work next.
- **Resume:** the red checks in `mcp/test-0.3.1-mp1e.mjs`, then the code.

## The causes, found in the real files
1. Fintech p3 (card b21f11f3): `layout.orientation` "1D", `rowCount` 4: a vertical list; mirrorVisual reverses any new
   card's Data. The grid cards there are "2D" with columnCount 9 (one row). Fix: no reverse for "1D".
2. Time: RepeatIQ (areaChart 66308a3f, small multiples 817b3aef): the axis is `DateTable.StartOfMonth`, the sort was
   turned but no invertAxis (the model read did not type the column a date, so `dateColumns` missed it), and a
   continuous axis ignores the sort. AdventureWorks (88420081, 0035f931, 607811533) and Consumer Complaints (a491bdd2,
   eadad3ca): a date hierarchy; only the first sort key (Year) was turned, or a descending sort added on the first
   level only, so the months inside a year kept ascending (CC p1, 1bdc6109, starts with Month and is right). Fix:
   every category sort key turned, a default sort on every level, invertAxis on any time category (a date table's
   column or a hierarchy level: Desktop ignores it on a categorical axis, T-2).
3. Call Center's month slicer (ec1a6ac4, 9921d870): an advancedSlicerVisual laid out "2D", 3 x 3, 50 px high: one row
   of buttons; the mirror turned only rowCount 1. Fix: a one-row slicer by its height too.
4. Call Center p2 (c47dbc53): the four agent cards are ONE cardVisual with small multiples (Rows: Agent, 2 x 2), the
   photo `image.position` 'Left', the name `smallMultiplesLayout.headerPosition` 'Left': the box moved, the inside did
   not. Fix: photo and header to the right; a grid of several rows has no right-to-left order in Power BI: named.
5. Call Center p1 (bae91c53): the English reference label titles are padded with "space + LRM" runs to make a value
   column; the Arabic titles replaced them whole. Fix: the Arabic padded to one measured width ("space + RLM").
6. AdventureWorks p4: "Total Customers" and "Revenue per Customer" are the rows of the field parameter table
   `Customer Metric Selection` (the slicer 7f08fe21 and the line 88420081's fieldParameters): model values the English
   report shares, not texts of a visual. The twin never changes the model: named in cannot with the step (an Arabic
   field parameter table, a script like the month script) for the owner to decide.
7. Consumer Complaints p2 (335035ae): the twin set the value alignment on the card's default entry only; the two text
   measures have their own value entries (textWrap, size). Fix: every value entry right-aligned (centred kept).
8. RepeatIQ (8886cd92): the English values are centred; a card of several values got the default entry set to right
   unconditionally. Fix: centred stays centred (the container's padding already swaps sides).
## For the laptop
- (to fill per item, with its page, for part 9)
