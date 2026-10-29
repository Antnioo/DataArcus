# TB1c (0.3.1): laptop part 5's two twin fails (a field's own name, a title bound to a column), titleMeasures, the validator's fix text

## Summary
- **Approval:** the reviewer's brief "TB1c: the two part 5 fails" (29 Oct): laptop part 5 (rc.4 = integration
  115db29f) on the owner's 6 dashboards: B2 and B4 FAIL. The owner: D-1029-01 (the twin's promises), D-1027-03 (a
  title all Arabic or all English), D-1027-04 (Arabic titles drafted and approved), never translate silently.
- **Base:** `fix/0.3.1-tb1c` from `origin/integration/0.3.1` at 115db29f. Push only this branch.
- **Scope:** 1. `mcp/lib/twin-texts.mjs` (fieldNamesOf: the field's text always the model's own name, from the
  field itself). 2. `twin-texts.mjs` (a title whose text is any expression but a literal or a translatable report
  measure: a column, an aggregation: a dynamicTitle), `twin-plan.mjs` (mixedTitles covers it). 3. `twin-pages.mjs`
  (titleMeasures: a measure whose every title was approved as a fixed Arabic title is no longer "not translated").
  4. `mcp/lib/check-report.mjs` (a validator finding's fix: only what is measured).
- **Expected checks:** (written before the work) a new suite `tb1c`, about 10 checks, red on 115db29f first except
  guards. F (one measure, two cards renamed "Male" / "Female" (Desktop's shape: the Female card's nativeQueryRef
  "Female" too), five visuals with no displayName: the field's text the model's name; Male and Female each their own;
  approving the field writes on the five only, each card its own: about 4). C (a line chart whose title is Min of a
  field parameter's column, its date axis approved Arabic: listed EN and AR; kept: no plan id (mixedTitles); approved
  a fixed Arabic title: a plan id and written: about 3). W (the write answer's titleMeasures agrees with notTranslated
  for two measure titles approved as fixed Arabic: 1). V (a validator finding of an openedInDesktop code: its fix says
  only what is measured; no "fixes most structure problems" anywhere: about 2). Other suites: a report whose
  projection's nativeQueryRef differs from its field's name may list one more own name (said per test if any moves).
  Full run: the base's suites + 1 (tb1c).
- **State:** planned.
- **Resume:** the red tests (test-0.3.1-tb1c.mjs), then items 1-4.

## The plan
1. **The field's text.** The field-level text (`field:<queryRef>`) is always the model's own name: the measure's or
   column's Property (an aggregation's nativeQueryRef, else the queryRef's name), never a visual's displayName nor a
   nativeQueryRef Desktop rewrote. Every projection with a displayName other than that name is its own `fieldAt:` text.
2. **A title bound to a column.** A title whose text is an expression other than a literal or a report measure the twin
   translates (a column, an aggregation of a column, a model measure): a dynamicTitle naming what gives it, approved as
   a fixed Arabic title or kept; kept on a visual where another field gets an Arabic name: mixedTitles, no plan id (as
   TB1b's field parameter titles). A title given by a measure keeps TB1's rule (keep allowed: the reviewer's part 5
   PASS).
3. **titleMeasures.** A title measure whose every title in the twin was replaced by an approved fixed Arabic title is
   said as `fixed` (no longer in notTranslated nor in "cannot"); the plan's and the write's blocks agree.
4. **The validator's fix.** No finding says "opening and saving the report fixes most structure problems" (not
   measured); an openedInDesktop code's fix says the measurement: Desktop 2.159 opened reports with this shape with
   no error, and saving in Desktop may rewrite it.
