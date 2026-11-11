## Summary
- **Approval:** the owner, 11 Nov, D-1111-17: "go you have all night to finish everything we got so far also don't
  overlook the seen not in scope": FB3's "Seen, not in scope" 3 and 4 (relayed by the reviewer's hub; the builder never merges).
- **Base:** `feat/0.3.3-fb4` from `origin/integration/0.3.3` at 58bf3de5. Push only this branch; never merge, no PR.
- **Scope:** assets/js/design-metrics.js (fitSlots, secondLayout) and its .min.js, assets/js/pbip-page.js (fitOf) and its
  .min.js, a new suite `test-0.3.3-fb4.mjs`, the fixtures the change moves (each by its own recorder), mcp/CHANGELOG.md,
  mcp/WORK.md, this note. Nothing else.
- **Expected checks:** new fb4 suite red on the base first; fb1 pins unchanged in geometry (topN is not in them);
  `node scripts/check-modules.mjs --strict`; contracts; lint 0; CI green.
- **Resume:** plan written (2026-11-11T20:52Z); next: red tests, then the two changes, recorders, CI.

## Measured first, on the base 58bf3de5 (2026-11-11T20:52Z)
- **Item 1 (topN).** computeSlots sets `topN` from categoryFit on the 720 grid (design-metrics.js:242); fitSlots never
  touches it. On the fb1 guard grid (4 layouts x 2 rail sides x 3 pages x 1-3 dropdowns x cards or none x time or none,
  English) 468 slots carry a topN, 345 change size in fitSlots, and for 193 of them categoryFit on the final size
  disagrees (e.g. 1920x1080 bar 508x440 -> 508x312: topN 9, should be 5; 508x440 -> 508x228: 9, should be 2; column
  771x331 -> 1083x331: 7, should be 10). 0 unchanged slots disagree. The units: topN is worked on the 720 grid, the
  slots after projectSlots are in page units (x1.5 at 1080), so fitSlots needs the scale (`topScale`, from pbip-page fitOf).
- **Item 2 (`filters: 'none'`): reproduced.** plan_layout on the written sample, layout exec, filters none: page 1 has no
  slicer slot, yet `slicers.written` lists 3. Cause (named from the page lists): `secondLayout` forces `filters: true` for the
  "Details" page of an exec/ops/focus first page, so the second page holds the rail and its 3 slicers.
  E.projectPages(filters false) -> page 2 has a slicer slot.
## Plan
1. fb4 suite, red on the base: the 312-high bar's topN (5 not 9), and 'none' answering 0 written slicers.
2. fitSlots: `topScale` option, one recompute through categoryFit at the end; fitScale scales it; fitOf passes page.h / 720.
3. secondLayout: filters follow the first page when it has none (decision: 'none' means no slicers anywhere).
4. Recorders (R-116), read every changed key; CHANGELOG, WORK.md.
