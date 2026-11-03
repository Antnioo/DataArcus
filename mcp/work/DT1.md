## Summary
- **Approval:** the reviewer's brief "DT1" (3 Nov, B-294, HR1 and HR2's "Seen, not in scope"); D-1016-01, D-1102-02, D-1103-09.
- **Base:** `fix/0.3.2-dt1` from `origin/integration/0.3.2` at e2cf676. Push only this branch.
- **Scope:** the ORDER of the texts the person labels (`bilingual.texts` of plan_layout, and the same list in
  create_arabic_twin's plan, both from `textsOf`, `lib/twin-texts.mjs`). Every text, its where and its label slot
  unchanged; only the order. Not: the content of a text, the Arabic labels, the approval binding.
- **The cause (measured before any change):** `lib/twin-read.mjs:51` (readOriginal) sorts each page's visuals by
  their file path, `definition/pages/<page>/visuals/<visual name>/visual.json`, and a visual's name is a random hex
  id (`assets/js/pbip-query.js:43`, `rnd()`, crypto random). `textsOf` (`lib/twin-texts.mjs`) walks the visuals in
  that order, so the texts (and the order of each text's `where`, "title (4), field" or "field, title (4)") follow
  random ids. A probe (4 runs of B5 in fresh folders, not committed): 4 different orders, the same 49 texts.
  The bookmarks come in file order too (`lib/read-report.mjs` inventory: in memory the build's order, on disk the
  folder listing, by the bookmark's id).
- **The order, decided once (written in `lib/twin-texts.mjs`, `readingOrder`):** the order a person reads the report:
  pages in the report's page order (pages.json); on a page, its visuals top to bottom, then left to right (position
  y, then x), ties by z, tabOrder, visual type, the visual's first text, its file last (reached only when everything
  a person sees is the same); in a visual, its texts in the place they have (as now). Bookmarks in the Bookmarks
  pane's order (bookmarks.json), the rest by their name shown. Only `textsOf` reads in that order: the twin's pages,
  files and writes keep theirs (twin-read's order is used by the build and the copy, untouched).
- **Guard:** `test-0.3.2-dt1.mjs` (suite `dt1`, area report):
  D1 the B5 plan (hr1's person, every 0.3.0 option, the large fixture) 5 times, each in a fresh temporary folder:
  the same `bilingual.texts` (the whole list, JSON) at the step before the Arabic texts and at the plan with an id.
  D2 an English report with the same options written to disk, create_arabic_twin's plan; then every page id and
  visual name renamed (other ids, in the reverse order of their file names, every reference replaced): the same
  texts in the same order (ids aside). D3 the order is the reading order (a page's texts top to bottom).
  U1-U3 readingOrder on made-up visuals: by y then x; ties never by the name; the input is not changed.
- **Expected checks (written first):** dt1 red on e2cf676 (D1, D2), green after; hr1 10, hr2 7 checks stay green;
  no other suite's line moves unless a check reads texts by index (each named here if so).
  Answer size (L-1102-06), the step before the Arabic texts: before 37,774-37,902 over 4 runs, after one number,
  at most 37,902; the plan with an id: before 36,169-36,195, after at most 36,195.
- **State:** the plan. **Resume:** the guard red on the base, then the code.
