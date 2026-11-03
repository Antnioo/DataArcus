# B-304: tidy an existing dashboard (aligned, evenly spaced, symmetrical, nothing else changed)

The owner: "remember the idea of redesigning and optimizing the already designed dashboard just like fixing stuff make
everything symmetrical and stuff". A person gives DataArcus a report someone already made and gets back a COPY whose
visuals are aligned, evenly spaced and symmetrical; every other byte is the original's. Prototype:
`node mcp/research/rd1/b304/prototype.mjs` (made-up pages only; never reads data).

## (a) What the code does today (read from the code)
- `mcp/lib/redesign.mjs:1-25`: copy-and-patch; `:121-126` `ALLOW`: a visual.json may change only
  `/position/(x|y|width|height)`, a static title and its own text settings. `:135-141` `KEEP`: text boxes, shapes,
  images, buttons, page and bookmark navigators stay; `:143-152` `reasonOf`: a group and every visual in a group
  stay, as do custom, hidden and schema-less visuals. **Claim confirmed, with one nuance:** `:265-280` only top-level
  visuals are items, and through D4 (`unitsOf`, `:271`) a text box, shape, image or button LYING ON a moved visual
  moves with it; a free one stays.
- `:282` the place comes from `gridPage` (unless a tooltip page or `keepPositions`); `:291-296` one patch per changed
  field, `{ page, visual, pointer, from, to }`; `:296, 322` the plan entry carries `from`/`to` boxes, `:323` every
  visual not changed carries its `why`; `:374` `sayInPlan`; `:376` the pin; `:471` `verifyCopy` (only the plan's
  patches differ, everything else byte-identical); `:511` `writeRedesign` recomputes the patches before writing.
- `mcp/lib/redesign-grid.mjs` (SP19): `:10` `overlap` (edges, 0.5 tolerance), `:20` `TOL = 1`, `:27` `unitsOf`, `:41`
  `follow`, `:65-145` `gridPage`: `:66` margins and gaps `M = G = 16`, step `S = 8` at a 720-high page (scaled
  h/720); rows re-laid at proportional widths; `:123-125` a table never smaller; `:129` a new overlap keeps the row.
  It IS a re-layout: it imposes 16, whatever the author's spacing was.
- How a plan is shown and approved: `plan_layout` with `redesignFrom` (`mcp/tools/plan_layout.mjs:111, 118`) proposes;
  `approve_plan` (`mcp/tools/approve_plan.mjs:15-56`) asks the person (the app's own form, or DataArcus's window
  in the browser; only their click approves); `create_report` writes (`mcp/lib/plans.mjs:26`; the gate `:142-170`
  compares the pinned inputs). The approval page lists each change in words, "moves 12 to the right and 4 down,
  18 wider (now W x H, its top left corner at x, y)" (`mcp/lib/approval-window.mjs:592-600, 619-622`), and every
  visual not changed with why. A tidy plan fits this as it is.
- Constants already in the repo: `assets/js/layout-check.js:66` `PAGE_SLACK 1` (off page), `:69` `COVER_NEAR 3`,
  `:70-71` `OVERLAP_SHARE 0.1 / 0.5`; the grid's "within 32" closeness (`redesign-grid.mjs:57-62`).
- The twin: `assets/js/report-mirror.js:5-8, 253` `x' = W - x - width`, W the page's width or the parent group's
  (a position in a group is relative to it); `:771-802` `mirrorPage` (importable with `require`).

## (b) What Microsoft documents
- Align, distribute, snap, smart guides: https://learn.microsoft.com/power-bi/create-reports/desktop-gridlines-snap-to-grid
  ("Align" to the edges or centre of the selected visuals; "Distribute horizontally / vertically"; "Snap objects to
  grid"; smart guides "for the center, sides, top, and bottom"; z-order in the Selection pane). No pixel size of the
  grid or of the guides' pull is documented: N below is DataArcus's choice, not Microsoft's.
- Groups: https://learn.microsoft.com/power-bi/create-reports/desktop-grouping-visuals ("treat the group like a single
  object. Moving, resizing, and working with layers"; groups nest).
- Page size: https://learn.microsoft.com/power-bi/create-reports/power-bi-report-display-settings#canvas-settings
  (16:9 default; 1280 x 720, 1920 x 1080, 2560 x 1440, 3840 x 2160; Custom in pixels).
- PBIR files: https://learn.microsoft.com/power-bi/developer/projects/projects-report#pbir-format (visual.json holds the
  position). Pinned schema `mcp/schemas/fabric/item/report/definition/visualContainer/2.13.0/schema.json`:
  `VisualContainerPosition` x, y ("between 0 and width of the containing page"), z (stacking), width ("x + width
  should be less than the width of the containing page"), height, tabOrder (keyboard order), angle; required x, y,
  width, height. `parentGroupName`: "Name of the parent group". `VisualGroupConfig` displayName, `groupMode`:
  **ScaleMode** "Visuals are scaled as group resizes", **ScrollMode** "not resized ... scrollbar is added".
  `page/2.0.0/schema.json`: width and height in pixels. That a child's x, y are relative to its group is the repo's
  Desktop measurement (`report-mirror.js:6-7`), not a sentence found on Learn.
- Microsoft's validator (`mcp/node_modules/@microsoft/powerbi-report-authoring-cli` 0.5.0, `dist/index.js:1472-1504`
  `validateLayoutBounds`): a warning past the page by more than 10, or a negative x / y. No overlap, alignment or
  group check.

## The rules (with numbers; page units, scaled by h/720 like the grid)
1. **One line:** edges of the same kind (left, right, top, bottom) within **N = 24** of each other are one line
   (sorted, single linkage; a chain longer than 2N is split at its widest step). 24 = 3 grid steps of 8, under the
   grid's own "within 32" closeness and far above `COVER_NEAR 3` / `TOL 1`; two distinct lines closer than 24 are
   not told apart (the plan shows it). The line lands on the 8 step; what stays (a group in A, a free text box or
   shape) and the page's margin lines (G from each edge) are anchors: their value wins.
2. **One gap G:** the median of the original's gaps (row neighbours, and each visual to the nearest above), over the
   whole report, on the 8 step: the author's spacing, never the grid's 16. Measured: G = 24 from 43 messy gaps (clean 24).
3. **Rows:** a row (most of its height shared) is laid between its first left and last right edge with gaps of G;
   same-kind visuals in it get one width, one top and one height (medians). A gap wider than G + 2N is a space on
   purpose: the row is not refitted (only an overlap in it is pushed apart). Then a row's top is G below the lowest
   bottom above it, its bottoms kept; a visual beside a row it is not in (a side panel) gets its left edge G from it.
4. **Symmetry:** left and right margins within N of each other are made equal (the whole block moves), unless what
   stays holds a side; a narrower row whose centre is within N of the page's is centred. Not vertical (a title band).
5. **Off the page:** moved in on its own axis, inside the page's margins. **Overlaps** (not a D4 unit) are pushed apart.
6. **Never onto another:** after all moves, any pair that overlaps (edges, 0.5 tolerance, `redesign-grid.mjs:10`;
   never centres) and did not before puts the one that moved back, with what follows it, and says why.
7. **A table never smaller** (scrollbar, as the grid's rule). **z and tabOrder never change** (not in `ALLOW`).
8. **Groups** move as one unit (B): the group's own x, y only, never its width or height (ScaleMode would scale its
   text, ScrollMode could add a scrollbar); its visuals' files are untouched (relative). **Text boxes and shapes:**
   on a visual, they follow it (D4, today); a free one just above a visual (its header, within G + N) moves with it
   (B); any other stays, as an anchor.

## (c) Three ways to build it
| | Change | Risk | Size |
|---|---|---|---|
| A | `tidy: true` on `plan_layout` with `redesignFrom`: `lib/redesign-tidy.mjs` (`tidyPage`, rules 1 to 7) instead of `gridPage` at `redesign.mjs:282`; top-level native visuals and their D4 overlays; same ALLOW, same verifyCopy, same approval | low: no new pointer, no new file kind | M |
| B | A + groups moved as one unit (rule 8: `reasonOf` lets a group be an item in tidy mode; its visual.json gets x, y only; verifyCopy checks its children byte-identical) + a free header text box moves with its visual | low-medium: one Desktop proof (moving a group's x, y alone moves its visuals) | M |
| C | today's redesign: a full re-layout on `gridPage` | it changes the spacing (16), and keeps rows it can't place | S (exists) |

## (d) Prototype, measured (seed 304; 7 made-up pages, 1280 x 720; each edge jittered 3 to 20 px; one overlap of 40
on "overview", one table 80 off the page on "kpis"; groups with a text box and a shape on "overview" and "regional")
Columns: distinct left / distinct top / gap spread (max minus min gap between row neighbours) / overlaps / off-page /
max edge move (the off-page visual not counted) / validator errors-warnings on that page. Counts are top-level native
visuals and groups.

| page | clean | before | A | B | C (grid) |
|---|---|---|---|---|---|
| overview | 5/4/0/0/0 | 9/9/283/1/0 | 7/5/0/0/0, 67 | **5/5/0/0/0, 59** | 8/6/36/0/0, 186 |
| trends | 4/2/0/0/0 | 5/5/44/0/0 | 4/2/0/0/0, 28 | **4/2/0/0/0, 28** | 5/2/0/0/0, 26 |
| panel | 3/4/0/0/0 | 7/7/14/0/0 | 4/4/0/0/0, 38 | **4/4/0/0/0, 38** | 6/4/0/0/0, 30 |
| kpis | 6/2/0/0/0 | 7/7/199/0/1 (0/1) | 6/2/0/0/0, 28 | **6/2/0/0/0, 28** | 7/7/199/0/1, 0 (0/1) |
| regional | 5/3/0/0/0 | 8/9/48/0/0 | 8/4/0/0/0, 24 | **7/3/0/0/0, 23** | 7/4/0/0/0, 42 |
| detail | 2/2/0/0/0 | 3/3/0/0/0 | 2/2/0/0/0, 24 | **2/2/0/0/0, 24** | 3/2/0/0/0, 11 |
| centred | 3/2/0/0/0 | 4/4/16/0/0 | 3/2/0/0/0, 32 | **3/2/0/0/0, 32** | 4/2/0/0/0, 32 |

- Validator (whole report): clean 0/0; before 0/1 (`PBIR_LAYOUT_OUT_OF_BOUNDS_WIDTH`); **A 0/0; B 0/0**; C 0/1 (the grid
  kept the off-page table's row: it would have made the table smaller).
- B against A: on "overview" A leaves 7 left edges (the header group stays where it drifted, and is an anchor that
  pulls the cards to 32); on "regional" A cannot even the row the note group stands in. B reaches the clean counts
  on 5 of 7 pages. The two misses: "overview" tops 5 (the table keeps its top, rule 7) and "regional" lefts 7.
- Max move 59 to 67 on "overview" is the overlap fix (Margin card right edge +67 in A); elsewhere 23 to 38.
- **Twin of B** (`mirrorPage`): every top-level x' = W - x - width and every in-group x' = gW - x - width, max error
  0.00 on all 7 pages; overlaps 0; distinct left after = distinct right before, right after = left before, tops
  equal on every page (e.g. overview 5 = 5, 5 = 5, 5 = 5).
- The plan's lines (B, "Sales overview"), as the approval page would list them:
  `Header group: x 40 -> 24, y 7 -> 24` / `Revenue card: x 36 -> 24, y 89 -> 96, width 272 -> 290, height 139 -> 112` /
  `Margin card: x 619 -> 652, y 114 -> 96, width 264 -> 290, height 77 -> 112` /
  `Top products table: x 35 -> 24, width 580 -> 604 (a table: never smaller (a scrollbar))` (9 lines in all).
- `npx eslint mcp/research/rd1/b304`: clean. The temp folder is removed.

## (e) Recommendation
**B**, as an option of the redesign (`tidy: true`), size **M**, risk **low-medium**. It keeps the author's spacing
and design, moves each visual by tens of px at most, fixes overlaps and off-page visuals, needs no new pointer in
`ALLOW`, and its twin mirrors exactly. C stays for "redesign"; A alone leaves pages with groups half tidied.

## (f) Power BI Desktop checks (the tidied copy of a made-up report, Desktop 2.159 or newer)
1. Every page opens with no error. Per moved visual: Format > General > Properties > Size and position: X, Y,
   Width, Height equal the plan's "to" values (to the pixel).
2. Each moved group: its Position equals the plan's; select a visual in it: its X, Y are its old offset plus the
   group's move; the group's text box text size and the shape's line are unchanged (no scaling).
3. View > Smart guides on, Ctrl+click the visuals of a row: tops line up, the gaps read the same.
4. Selection pane: layer order and Tab order identical to the original's.
5. Every table and matrix: no new scrollbar; the off-page visual is fully on the page.
6. A free header text box moved with its visual; one that is not a header stayed.
7. Save in Desktop, close, reopen: positions kept. Then the twin of the tidied copy: each visual at W - x - width.

## (g) Builder brief
- **Do:** `mcp/lib/redesign-tidy.mjs`: `tidyPage(page, items, { G })` and `gapSamples` (rules 1 to 8, the
  prototype's code as the start); `redesign.mjs`: option `tidy` (pinned at `:376`), at `:282` `tidyPage` in place of
  `gridPage`, `reasonOf` lets a group be an item in tidy mode (x, y only), `verifyCopy` checks a moved group's
  children byte-identical; the plan's `why` per kept visual (rules 5 to 7); `plan_layout`/`TOOLS.md` the option; the
  approval page's wording unchanged (it already says each move).
- **Test** (tests first, one line in `mcp/tests.json`): the 7 prototype pages as fixtures: before/after counts as in
  (d); never a new overlap (edge test); never off the page; tables never smaller; z and tabOrder unchanged; group
  children byte-identical; validator 0 errors; the twin's x' formula and 0 overlaps; a page already tidy gives no
  patch (idempotent: tidy twice = tidy once). Then the Desktop checks (f) on the laptop.
- **Not in this job:** vertical symmetry; resizing groups; moving buttons, navigators, images, custom or hidden
  visuals; changing the grid's own rules; text or theme changes; tooltip pages.

## Owner's decision
1. Groups moved as one unit (B) or left (A)? Recommended: B.
2. The tolerance N = 24 (at 720 high) and the author's own gap (G from the report) rather than the grid's 16?
   Recommended: yes to both.

## Seen, not in scope
- `gridPage` (C) keeps a row it can't place, so a table off the page stays off it (measured: "kpis" 0/1 warning after
  the redesign); worth a line in the redesign's plan, or its own fix.
- Microsoft's validator checks only page bounds (10 px slack), not overlaps or groups: DataArcus's own checks carry those.
- Rule 7 (a table never smaller) can leave a table's top off its row's line ("overview": 5 tops, clean 4).
