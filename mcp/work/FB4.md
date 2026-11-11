## Summary
- **Approval:** the owner, 11 Nov, D-1111-17: "go you have all night to finish everything we got so far also don't
  overlook the seen not in scope": FB3's "Seen, not in scope" 3 and 4 (relayed by the reviewer's hub; the builder never merges).
- **Base:** `feat/0.3.3-fb4` from `origin/integration/0.3.3` at 58bf3de5. Push only this branch; never merge, no PR.
- **Scope:** assets/js/design-metrics.js (fitSlots, secondLayout) and its .min.js, assets/js/pbip-page.js (fitOf) and its
  .min.js, a new suite `test-0.3.3-fb4.mjs`, the fixtures the change moves (each by its own recorder), mcp/CHANGELOG.md,
  mcp/WORK.md, this note. Nothing else.
- **Expected checks:** new fb4 suite red on the base first; fb1 pins unchanged in geometry (topN is not in them);
  `node scripts/check-modules.mjs --strict`; contracts; lint 0; CI green.
- **Resume:** code, recorders and note done; CI run and the DONE line are the last step.

## Measured first, on the base 58bf3de5 (2026-11-11T20:52Z)
- **Item 1 (topN).** computeSlots sets `topN` from categoryFit on the 720 grid (design-metrics.js:242); fitSlots never
  touched it. On the fb1 guard grid (4 layouts x 2 rail sides x 3 pages x 1-3 dropdowns x cards or none x time or none,
  English, 468 category slots) 345 change size in fitSlots, and for 193 of them categoryFit on the final size disagrees
  (1920x1080 bar 508x440 -> 508x312: 9, should be 5; 508x440 -> 508x228: 9, should be 2; column 771x331 -> 1083x331: 7,
  should be 10). 0 unchanged slots disagree. Units: topN is worked on the 720 grid, projectSlots are in page units (x1.5 at
  1080), so fitSlots needs the scale: `topScale`, given by pbip-page fitOf (page.h / 720).
- **Item 2 (`filters: 'none'`): reproduced, cause named.** plan_layout on the written sample, exec, filters none: page 1 has no
  slicer slot, `slicers.written` lists 3. Field that varies: the page. `E.projectPages(filters false, second)` gives page 1 no
  slicer and the Details page (secondLayout, filters: true) a rail; `exec`, `ops` and `focus` all do; `analysis` none has
  none (its second page is the overview). The 3 are the Details page's own, not a leak.
## Decisions I made
1. topN: fitSlots takes `topScale` and recomputes through categoryFit at its end (one place, from the final size); a slot with
   no topN, a call without topScale, and a slot whose size fitSlots left alone are untouched (T5, T6).
2. `none`: kept as it is, the answer's wording changed. I first made secondLayout follow `filters` (red, 43 pins moved) and
   dropped it: exec, ops and focus default to filters false, so the Details page's rail is the designed default (without
   a flag the engine cannot tell a chosen "none" from the default), and a new layout key would change the saved-design
   schema. The sentence added to `slicers.sayInPlan` only under filters none: "filters "none" leaves the first page
   without a filter area; the second page (Details) keeps its filter rail, and these slicers are on it: say so in the
   plan; for a report with no slicers at all, call plan_layout again with secondPage false." (F2 red on the code
   without it; F4: secondPage false writes none.)
3. Arabic: no Arabic sentence shipped (D-1109-07). The English sentence reaches `sayInPlanAr` only as English; the draft for the owner, held:
   «عند اختيار الفلاتر «none» تبقى الصفحة الأولى بلا منطقة فلاتر، وتحتفظ الصفحة الثانية (التفاصيل) بشريط الفلاتر وعليه هذه المقسمات؛ ولتقرير بلا مقسمات اكتب secondPage false.»
## Changed on purpose, per test (R-10)
- fixtures re-recorded by their own recorders (sha256 and length keys only, every changed key read: lengths +45 where a second
  Keep/Title/Title AR measure set appears, +1 where a count gains a digit): fn1c (2 keys), fn1f (14), fn1j (74), sp1 (4),
  sp3 (16), sp4 (3), sp5 (2), sp13 (2), sp28 (3), sp43 (7). fb1, sp7, sp23, sp29, sp44 re-recorded: no change.
- sp3 L1 (by hand, BASE_EXT d87bede3 -> db46d4c6): the file diffed: only "Keep: Total Sales by Region (2)", "Title: ... (3)" and
  "Title AR: ... (3)" appear (the Details chart by Region now holds 5 categories, the other 9, so they no longer share a measure set).
- website design-engine cases.json: re-captured, 54 of 54 cases identical (only meta moved): not committed.
## Tests
fb4 (new, `area report`): 14 checks, red on 58bf3de5 first (the base: T1 "[[440,312,9,9]]", T4 386 stale slots, T7, F2) and green now.
## CHANGELOG line
"A bar or column chart's Top N now follows the size its page ends with ... With filters "none" the answer now says the second
page (Details) keeps its filter rail and its 3 slicers, and that `secondPage` false writes none."
## For the owner
none
## Risky changes
Written reports with a category chart that fitSlots resizes now carry the new Top N (and its own Keep/Title measures where two
charts by one field now differ): a different file, the same design. Laptop check below.
## For the laptop
Create the sample report (exec, three dropdowns at the start): the Details page's bar chart by Region (312 high) shows 5
categories, not 9, and fills its box with no cut label.
## Seen, not in scope
1. A layout key to say "no filters at all" (the first page and the Details page) if the owner wants it: schema change.
2. The Arabic copy of the new sentence waits for the owner (above).
## Lessons for the reviewer
- A layout rule that reads a boolean default (`filters`) cannot tell "chosen none" from "not chosen": measure the defaults first.
