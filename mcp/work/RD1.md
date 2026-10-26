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

## Before -> after
The lab's native copy redesigned ("Gulf Retail native" -> the redesign; `node lab/custom-visuals-run.mjs`), per page
(vertical gaps between rows; the left, right and bottom margins of what moves):

| Page | Before (df14c65) | After |
|---|---|---|
| 1 Overview | top row 96-248, row 2 starts at 248 (gap 0, touching); bottom 696 | top row 92-237, row 2 at 253 (16); bottom 704 (16) |
| 2 Branches | slicers 88-152, charts 176 (24), grid 448 (8); bottom 696 | 90-154, 170 (16), 446 (16); bottom 704 |
| 3 Products | card 88-200, charts 208 (8), table 464 (16) | 91-201, 217 (16), 473 (16); bottom 704 |
| 4 Calendar | slicer 88-152, charts 160 (8), line 488 (24) | 91-151, 167 (16), 483 (16); bottom 704 |
| 5 Flows | matrix 480-696 under the networks (16) | 480-704 (16 below the networks, 16 at the bottom) |

Every row's top is 16 below the band (the shape) or the row above; the text boxes, shapes and the two networks are
untouched. Names: "Gulf Retail Review native" -> "Gulf Retail native redesigned" (was "Gulf Retail Review
redesigned", the original's name); a cut name taken -> " 2" ("Gulf Retail redesigned 2").

Suites: rd1 new, 14 checks (red first on df14c65: 9 of 14 failed); report "run-tests: 32 suites passed (report)" ->
"run-tests: 33 suites passed (report)" (redesign 50 = 50, redesign-overlay 29 = 29, cs1 44 = 44, custom-visuals-lab
38 = 38); core "run-tests: 6 suites passed (core)" = 6 (mcp 1591 = 1591, golden 12 match); mutation 73 killed = 73
(189 checks = 189); check-result-lines PASS 98, changelog-words PASS 160, check-agent-memory PASS 164. Full run: see
the Summary.

The one expectation changed, said in the test: redesign-overlay O2, the twin fixture's chart row and its overlays
at y 246, height 430 (was 248, 432): the row now sits 16 below the group grpKpi, which stays and ends at 230 (it
was 18 below it), and keeps its own height (it was rounded up to the 8 step). Its other 24 checks are unchanged.

## CHANGELOG line
- **A redesign that cleans up evenly:** the rows of a redesigned page now sit exactly 16 apart and 16 from the
  page's edges, so two rows never touch. Text boxes, shapes, images and custom visuals still stay where they are: the
  rows keep 16 from them, and the plan says when one of them keeps a row from the page's margin. A redesign of a copy
  keeps the copy's own name: "Gulf Retail Review native" becomes "Gulf Retail native redesigned", never the name the
  original's redesign gets; a long name that is already another report's gets a number.

## Decisions I made
1. The name: the stem is cut, the suffixes stay (" native", " (EN-AR)": DataArcus's copies), because the suffix is
   what tells the copy from the original. The list is written in redesign.mjs, not imported: native-copy.mjs is NC2's
   file and does not export its suffix (a follow-up can export it).
2. A counter (" 2" to " 9", after " redesigned") only when the name was cut and is taken: two long names that start
   alike can still meet. A whole name that is taken is this report's own earlier redesign: refused as before (the
   person decides; nothing is written over). The write still uses exclusive create; the plan says the final name
   (`nameCut`), and the write computes the same name again (a change between plan and write is refused as before).
3. The grid: what a row sat close to (within 32, two gaps) sets its top exactly 16 below; what was far only keeps
   it 16 away, so a row the author placed apart on purpose stays apart. The same at the sides and the bottom.
4. A row's top is no longer forced onto the 8 step when it is set by what lies above (e.g. y 91 under a band ending
   at 75): the 16 is the promise; the 8 step stays for rows placed on their own. Heights are the row's own (no
   rounding up), so a row grows only to reach the page's bottom margin.
5. A row that fails (a table smaller, off the page, a new overlap) keeps its place and the page is placed again with
   it as one more visual that stays, one row at a time (all at once after 20 passes, so a big page stays quick).
6. `margins` in a page's plan entry only when what stays keeps a row from the page's margin (a shape beside it at
   the left, as G2's fixture); the lab has none.

## For the laptop
In the batched run, with NC1's lab (`mcp/lab/CUSTOM-VISUALS-LAB.md`): open "Gulf Retail native redesigned" in
Desktop, every page at 100%, full-size crops:
1. Every row 16 below the band or the row above; no two rows touching (page 1: the cards end at 237, the charts
   start at 253); every page's last row 16 above the bottom (704 of 720), the rows 16 from the left and right.
2. The names in the folder: "Gulf Retail native" and "Gulf Retail native redesigned" next to the original.
3. Check that the cards on page 1 (now 145 tall, were 140) still show their values without clipping.

## Seen, not in scope
1. The page title text boxes stay at x 24 and the two networks on page 5 at x 24 to 1256 while the rows go to 16 to
   1264: an 8 px misalignment the rule (never move a text box or a custom visual) keeps.
2. A counter can cut the stem hard: "Gulf Retail Review native" with "Gulf Retail native redesigned" taken gives
   "Gulf native redesigned 2".
3. Rows set below a band are off the 8 step (91, 217, 473): exact gaps, but not round numbers in the Format pane.
4. A whole name that is taken is still refused with "rename or move it": a counter there too is the owner's call.
5. NC1's Seen 1-5, 8 and 9 (the native copy's replacements and the mixed titles) are unchanged by this job.
