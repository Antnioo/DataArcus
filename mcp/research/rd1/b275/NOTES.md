# B-275: a reversed table's columns end at its box's right edge

The owner, 1 Nov: "in matrices we could switch columns but in tables it's not yet done why?". The twin reverses a
table's columns, but Power BI lays a table from its LEFT edge: a table narrower than its box keeps its blank at the
right, so the first English column (now the last) does not stand at the right edge and the table reads as not switched.

Codex's lab (`dataarcus-exchange`, results/2026-11-01-table-matrix-rtl): not reachable from this session
(`git ls-remote https://github.com/Antnioo/dataarcus-exchange`: "could not read Username ... terminal prompts
disabled"). No B-288 summary exists in this repo (grep "B-288" over `mcp/`, `mcp/work/`, `mcp/work/archive/`,
`SEEN-QUEUE.md`, all branches' commit messages: 0 hits), so W1, G1, R1, F1 could not be read; this note works from
the repo and Microsoft's documents only, and the Desktop pass (f) stands in for the lab.

## (a) What the code does today (read from the code)
- `assets/js/report-mirror.js:326-331`: a `tableEx` (and a flat matrix written as one, `matrixAsTable`) has its
  `Values` projections reversed; `:333-349` text columns get `columnFormatting` alignment `Right`. Nothing about width.
- `mcp/lib/twin-pages.mjs:198-217, 218-245` (`keepView`, after the mirror, `:701`): `BOX_ROOM = 20, SCROLLBAR_W = 12`
  (`:218`, measured MX3/MX5); a table that fits gets its slack on its leftmost column, "the room less 1" (`:236`), so
  its names end at the box's right edge. **But** it returns at `:222` when the table has no `columnWidth` array, and at
  `:228` unless every column has its own width. So DataArcus's own tables (the writer sets every width:
  `assets/js/pbip-page.js:296-307`, autoSize off, values word wrap) already end at the right edge; **a table Power BI
  sizes from the data (no or some widths, every user-made table) is reversed and left where it is: this is B-275.**
- `mcp/lib/twin-pages.mjs:326-358` (`fitHeaders`): widens a set width to its Arabic header; again only tables with
  `columnWidth`.
- `mcp/lib/twin-plan.mjs:266-287, 315-316`: the plan names "tables that may be wider than their box" (some columns
  sized from data, known ones take half the room) and "tables wider than their box"; nothing for a narrower one.
- Precedents for "grow to fit": `assets/js/pbip-page.js:884-886`, the writer's early table: `columnAdjustment
  'growToFit'` + `autoSizeColumnWidth true`, its comment: "on a right-to-left page the title sat on the right and the
  table on the left" (the same symptom); `assets/js/report-mirror.js:662, 670`: the twin's heatmap matrix is set
  `growToFit` so its grid fills its box (MX3, proven on the laptop parts 12 and 13).
- The caution: `assets/js/layout-check.js:33, 117-123` `TABLE_GROW_TO_FIT` (O-14, high): "grow to fit" with no word
  wrap and a text column, "the text column grows and pushes the others off" (seen by the owner on 0.2.8; the fix then,
  `mcp/work/archive/WORK-2026-10-11-14.md:540`: fixed widths per field + values word wrap). `check_report` runs it
  (`mcp/lib/check-report.mjs:32`, `mcp/lib/design-lint.mjs:14`).
- Header width estimate: `assets/js/report-rules.js:120-123` `headerNeed` (bold `textWidth` + 24 a 1080 page;
  Arabic `lowW` band 0.7), on `assets/js/text-measure.js:19` `textWidth`. Reused by the prototype.

## (b) What Microsoft documents
- Tables, "Adjust column width > Auto-size behavior": **Fit to content** "as wide as they need to be to show the
  data"; **Grow to fit** "Columns automatically expand to fill the visual container ... Any leftover horizontal space
  is distributed evenly to each column"; **Fixed width** with a Default width. "Width inputs that show *(auto)*
  indicate the column is using the auto-size behavior rather than a custom width" (custom widths and the auto-size
  mode coexist per column). https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-tables#adjust-column-width
- Same page, considerations: "Power BI calculates the maximum cell size for a table based on the contents of the first
  20 columns and the first 50 rows"; column alignment Auto "supports languages where you read left-to-right".
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-tables#considerations-and-troubleshooting
- Desktop "doesn't support right-to-left languages"; "the layout of visuals doesn't change" in RTL.
  https://learn.microsoft.com/power-bi/fundamentals/supported-languages-countries-regions#languages-for-power-bi-desktop
- Release notes: Nov 2025, matrix gets Grow to fit ("Horizontal scrollbar behavior corrected"); May 2026 (2.154),
  Fixed width and default width GA for table and matrix.
  https://learn.microsoft.com/power-bi/fundamentals/desktop-latest-update-archive
- Pinned capabilities, `mcp/node_modules/@microsoft/powerbi-core-visual-schema/data/capabilities.json` (0.1.3),
  `tableEx.objects`: `columnHeaders` { `autoSizeColumnWidth` bool, `columnAdjustment` enum fitToContent | growToFit |
  fixedWidth ("Auto-size behavior"), `defaultColumnWidth` numeric, `customColumnWidth` bool transient, `wordWrap` };
  `values.wordWrap`; `total.totals`; `columnWidth.value` numeric (selector `metadata` = queryRef); `grid.*`. No
  direction or right-to-left property on `tableEx` or `pivotTable`.
- Not documented: how `growToFit` treats columns with a custom width beside auto ones; how the older
  `autoSizeColumnWidth` combines with `columnAdjustment`; whether "grow to fit" changes anything when the content is
  wider than the box (O-14 says the text column runs wide; Fit to content may do the same). Desktop must show these.

## (c) Ways to build it
| | Change | Risk | Size |
|---|---|---|---|
| A. Grow to fit | On a twin table with fewer widths than columns and no `columnAdjustment` of its own: `columnHeaders.columnAdjustment 'growToFit'` (autoSize, wrap as English). Power BI spreads the blank over every column, so the last (the names) ends at the right edge. No width is computed, no data read | Low/medium: the even spread also widens the names a little; O-14 (a long text column, no wrap) must be shown not to get worse than English's fit to content; `TABLE_GROW_TO_FIT` would fire on the twin's tables | S |
| B. Widths from headers | `columnWidth` per field from `headerNeed` (Arabic), slack to the leftmost (keepView's rule), autoSize off; optional values word wrap | High: fixes widths of columns English sized from the data, which the twin never reads: a value wider than its header is cut (or wraps and rows grow, fewer rows in view) | M |
| C. Leading spacer | A blank-header extension measure as the leftmost column, its width = room less the others | High: same unknown widths (the spacer cannot know the slack), adds a field to the query (export, sort, selection, the plan's field list) | M/L |
| (D) Box to content | Narrow the box to the columns' width, anchored right | Needs the data widths: not possible | - |

## (d) Prototype: `mcp/research/rd1/b275/prototype.mjs`
Made-up report (page 1920 x 1080, one `tableEx` 800 x 400 on table "Sales": Region, Revenue, Customers, Arabic
`displayName`s), one report per candidate in `fs.mkdtempSync(os.tmpdir()/b275-)`, removed at the end; Microsoft's
validator (`@microsoft/powerbi-report-authoring-cli` 0.5.0) exactly as `mcp/lib/check-report.mjs:362-363`. Without a
`.platform` file every candidate got 1 error `PBIR_PLATFORM_MISSING`; with it (below) all are clean.

| id | candidate | errors | warnings | codes |
|---|---|---|---|---|
| C0 | today: reversed, no width setting | 0 | 0 | - |
| C1 | columnAdjustment growToFit | 0 | 0 | - |
| C2 | growToFit + autoSizeColumnWidth true (pbip-page.js:886) | 0 | 0 | - |
| C3 | columnWidth per field from Arabic headers, slack to leftmost, autoSize false | 0 | 0 | - |
| C4 | C3 + values.wordWrap true | 0 | 0 | - |
| C5 | fixedWidth + defaultColumnWidth + columnWidth per field | 0 | 0 | - |
| C6 | leading spacer measure (blank header), its width the slack | 0 | 0 | - |
| X1 | control: columnAdjustment "stretch" (not in the enum) | 1 | 0 | PBIR_FORMATTING_ENUM_INVALID |
| X2 | control: columnWidth on a queryRef not in the visual | 0 | 0 | - |

X1 shows the validator reads `columnHeaders` (the enum is checked); X2 shows it does not check a `columnWidth`
selector against the query, so a wrong queryRef would pass silently: the builder's tests must check it themselves.

Header-only widths, 10pt Segoe UI, bold + 24 (`headerNeed`), room = box less 32 (twin-pages.mjs:218):

| box | lang | headers (twin order, left to right) | need each | sum | room | slack | C3 widths |
|---|---|---|---|---|---|---|---|
| 300 | en | Customers / Revenue / Region | 95, 81, 71 | 247 | 268 | 20 | 115, 81, 71 |
| 300 | ar | العملاء / الإيرادات / المنطقة | 84, 101, 84 | 269 | 268 | -2 | does not fit |
| 500 | en | Customers / Revenue / Region | 95, 81, 71 | 247 | 468 | 220 | 315, 81, 71 |
| 500 | ar | العملاء / الإيرادات / المنطقة | 84, 101, 84 | 269 | 468 | 198 | 282, 101, 84 |
| 800 | en | Customers / Revenue / Region | 95, 81, 71 | 247 | 768 | 520 | 615, 81, 71 |
| 800 | ar | العملاء / الإيرادات / المنطقة | 84, 101, 84 | 269 | 768 | 498 | 582, 101, 84 |
| 300 | en | + Average Order Value | 162, 95, 81, 71 | 409 | 268 | -142 | does not fit |
| 300 | ar | + متوسط قيمة الطلب | 152, 84, 101, 84 | 421 | 268 | -154 | does not fit |
| 500 | en | + Average Order Value | 162, 95, 81, 71 | 409 | 468 | 58 | 220, 95, 81, 71 |
| 500 | ar | + متوسط قيمة الطلب | 152, 84, 101, 84 | 421 | 468 | 46 | 198, 84, 101, 84 |
| 800 | en | + Average Order Value | 162, 95, 81, 71 | 409 | 768 | 358 | 520, 95, 81, 71 |
| 800 | ar | + متوسط قيمة الطلب | 152, 84, 101, 84 | 421 | 768 | 346 | 498, 84, 101, 84 |

Read: the Arabic headers here need 269 for English's 247 (+9%; per column +20, +13, -11), so headers alone rarely
decide; the box's blank (198 to 498 here) is what reads as "not switched". Header needs are a lower bound of a
column's width (values are data): B and C would set widths the twin cannot check, A sets none.

## (e) Recommendation
**A, size S**, behind a Desktop pass first: on the twin's right-to-left pages, a `tableEx` with fewer `columnWidth`
entries than columns (what `keepView` skips at twin-pages.mjs:222/228) and no `columnAdjustment` of its own gets
`columnHeaders.columnAdjustment 'growToFit'`; tables with every width keep `keepView` (already right); English's own
`fixedWidth` or `growToFit` is kept. The plan says it per table ("its columns fill its box: grow to fit"). If Desktop
shows O-14 worse under growToFit than under English's fit to content (a long text column pushing the others out),
add `values.wordWrap true` only on those tables, said in the plan; B stays the fallback for a mixed table only if
Desktop shows growToFit leaves the blank when some widths are set.

## (f) Desktop checks (Power BI Desktop, the laptop; made-up report, 1920 x 1080, 10pt)
1. `tableEx` 800 wide, 3 short columns, no widths: C0 vs C1. Measure the blank between the last column and the box's
   right edge (C0: expected about 500 at the right; C1: 0 to the scrollbar gutter), and each column's width (even
   spread?). Same in a 300 wide box (Arabic headers 269 in 268: does C1 cut a header?).
2. C1 vs C2 (`autoSizeColumnWidth` true/false with growToFit): any difference in widths.
3. Mixed: one column with `columnWidth` 120, two without, growToFit: does the set column stay 120 and the auto ones
   take the blank, and do the columns still end at the right edge?
4. O-14: a text column of 60-character made-up values, no word wrap, box 600: C0 vs C1, are the other columns pushed
   out of view in both, or only in C1? Then C1 + `values.wordWrap true`: row height and rows in view.
5. Totals on (`total.totals` true) and a vertical scrollbar (40 made-up rows in a 400 high box): does the last
   column end at the scrollbar's left, the total row's label still in the rightmost column?
6. Column headers `wordWrap` true with a two-word Arabic header (متوسط قيمة الطلب) in growToFit: one line or two.
7. A table wider than its box under growToFit: same as C0 (scroll from the left, names behind the scroll)? The plan's
   "wider than their box" message must stay true.
8. Publish to the service (or the phone layout) once: the same spread.

## (g) Brief for the builder
**Do**
- In `mcp/lib/twin-pages.mjs`, beside `keepView` (`:219`), on right-to-left pages only: a `tableEx` with at least 2
  projections, not every one with a `columnWidth` (keepView's `:222`/`:228` returns), and no
  `columnHeaders.columnAdjustment` set: set it `growToFit` in the unselected `columnHeaders` entry (create the entry if
  absent; keep every other property, `autoSizeColumnWidth` as English). Return the list for the plan.
- In `mcp/lib/twin-plan.mjs` (`:266-316`): say per table "its columns fill its box (grow to fit) so its first column
  ends at the right"; keep "wider than their box" and "may be wider" as they are.
- `TABLE_GROW_TO_FIT` (`assets/js/layout-check.js:117-123`): decide with the Desktop result of check 4 whether the
  twin's growToFit tables are exempt (no worse than English) or get values word wrap; `npm run build:min` after.
- Plan, expected numbers and the Desktop result first in the job's note, as the rules ask.

**Test** (a new suite, area twin, made-up shapes, red before the change)
- G1: a 3-column table with no widths on an Arabic page: growToFit set, projections reversed, nothing else changed.
- G2: every column with a width: no growToFit, keepView's slack to the leftmost as today (guard).
- G3: English's own `fixedWidth`: kept. G4: an LTR (kept left to right) page: untouched.
- G5: mixed widths: per the Desktop result of check 3.
- G6: the plan lists the table; the validator (as `check-report.mjs:362`) 0 new errors on the written twin; every
  `columnWidth` selector names a projection (the validator does not check it: X2).
- Mirror parity: `mirror-parity` and `mx1`-`mx3` unchanged, or each moved check said.

**Not in this job**
- Matrices (their own route: `matrixRtl`, the heatmap names, `matrixAsTable`); setting widths from headers (B); a
  spacer column (C); resizing or moving the box; the website's report mirror page beyond the shared engine.
