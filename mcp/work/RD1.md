# RD1 (0.3.1): the redesign's name and the grid's gaps ("clean up the clutter")

## Summary
- **Approval:** the owner, 26 Oct: "replaces all custom visuals with native ones and clean up the clutter"; NC1's lab
  found two defects in the redesign (mcp/work/NC1.md "Seen, not in scope" 6 and 7); the reviewer approved fixing them
  now. The brief "Go on RD1". Builder; the reviewer reviews and merges.
- **Scope:** `mcp/lib/redesign.mjs` (nameFor and locate; gridPage's vertical placement and obstacles; the plan's note
  when a margin can't be kept); a new suite `mcp/test-0.3.1-rd1.mjs` (one line in `mcp/tests.json`); the lab suite's
  expectations if they name the old gaps; CHANGELOG; this note. Not NC2's files (visual-meaning.mjs, native-copy.mjs,
  visual-replace.js, the native copy's approval rows).
- **Base:** `fix/0.3.1-rd1` from `origin/integration/0.3.1` df14c65. Push only it; no merge, no PR.
- **Items:** 1. the name: the copy's name keeps DataArcus's own suffixes (" native", " (EN-AR)") and cuts the stem;
  a cut name that is taken gets a counter (" 2" to " 9"); the write still refuses an existing folder; the plan says
  the final name. 2. the grid: rows stacked with 16 between them and 16 at the page's edges, never touching; a text
  box, shape, image or custom visual that stays is an obstacle the rows keep 16 from; the plan says when a margin
  could not be kept because of one. keepPositions unchanged. 3. every other redesign test as it was, or each change
  said with why.
- **Expected checks:** (written before the work) rd1 about 20 checks, red first on df14c65 (the lab's native copy
  redesigned as "Gulf Retail Review redesigned"; page 1's rows touching at 248; page 3's and 4's gaps 8 and 24);
  redesign 50 and redesign-overlay 29 and cs1 44 the same counts and PASS (their fixtures' rows may move: any changed
  position said below with why); custom-visuals-lab 38 PASS; `npm test -- report` the base's suites + 1, `-- core` the
  same; mutation the same killed; full run the base's count + 1; check-result-lines, changelog-words,
  check-agent-memory PASS.
- **Resume:** the plan (this note) pushed; then the tests red, the fix, the suites.

## The plan
1. `nameFor(base, taken)`: the stem is the name without a trailing DataArcus suffix (" native", " (EN-AR)"); the
   stem is cut at a whole word so stem + suffix + " redesigned" fits 30 characters. When the stem was cut and the
   name is taken (its .Report or .pbip next to the original), " 2" to " 9" before " redesigned" (the stem cut again
   to fit). A name not cut and taken: refused as today (it is this report's own redesign: the person decides).
   The plan's `newReport` is the final name; `nameCut` says it was shortened and from what.
2. `gridPage`: the rows as today (members, horizontal placement); then top to bottom: a row's top is 16 below the
   lowest of what lies above it (a placed row, or a visual that stays) when it was within 32 of it, else its own
   top on the 8 step (and never closer than 16); the page's top edge is 16. A row with nothing below it that ended
   within 32 of the page's bottom ends 16 above it. Heights: a row's own height (equal in the row), cut only at the
   page's bottom. Horizontally a row keeps 16 from a visual that stays beside it. A row that fails (a table smaller,
   off the page, a new overlap) keeps its place and the layout is made again with it as an obstacle.
3. The plan's page entry `margins` (only when one applies): "the grid's margin of 16 is not kept ... because <name>
   (a text box, kept where it is) ...".
