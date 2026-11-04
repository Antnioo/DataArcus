## Summary
- **Approval:** the brief "DD1C2" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-11 (one big
  check), D-1016-01 (never 100 places), D-1104-15 (a group with a broken box: the page's width, else unknown).
- **Base:** `feat/0.3.2-dd1c2` from `origin/integration/0.3.2` at 240d179 (DD1C and ST1 in it). Pushed only this
  branch; never merged.
- **Scope:** the fourth frame reader, mcp/lib/twin-geometry.mjs `underGrids` (a chart kept under a heatmap's grid),
  reads `Units.frameWidth` like `aroundTables`; its own `widthIn` is gone. Unknown frame: the chart keeps its wanted
  x, unclamped (as before on a non-finite width), nothing new said.
- **Plan (one commit each), done:**
  1. feff93f twin-geometry.mjs underGrids: `widthOf = (v) => Units.frameWidth({ width: pageW }, byName, v)` (pageW is
     what its one caller passes, `pageOf(pg).width`: the signature and sp26's call check stay).
  2. 1caf310 mcp/test-0.3.2-dd1c.mjs: F1-F13 now read four callers (the grid chart's clamp, W - 150; unknown: left at
     its wanted x); S4 underGrids calls frameWidth. tests.json's dd1c purpose names the grid chart.
  3. aacfadcf CONTRACTS.md family 1c starts with its one place; "Since DD1C" says all four; the top row 0 of
     10; the probe's 1c places fixed so they run (on the base the probe failed on 1c: twin-text-fit's destructured
     frameWidth was not found, and aroundTables was given a Map for byName, so it read 1280 for a valid group).
- **Expected:** dd1c 61 -> 75; every other suite as on the base; mutation 76/76; lint 0. **Got:** see Results.
- **Red proof:** with the old widthIn back, dd1c 68 of 75 (F2-F6, F13 grid, S4).
- **Merge:** integration/0.3.2 did not move (240d179): no merge.
- **Resume:** none once CI is green; the reviewer reads and merges.

## Four readers -> one (made-up inputs, page 1280 unless said; underGrids before -> after, the other three already 1)
| input | underGrids before | after (all four) |
|---|---|---|
| a valid group 400 | 400 | 400 |
| group width "wide" / no width / no position / x "a" | unknown (chart unclamped) | 1280 |
| group width 0 / -5 | 0 / -5 (chart at x 0) | 1280 |
| no group; a group not there | 1280 | 1280 |
| page with no width / width "x" / "wide" group in it | unknown | unknown |
| nested group 300 in 600 | 300 | 300 |
| a group named an empty text (the probe) | 1280 (page) | 400 (its group) |

## Decisions I made
- underGrids keeps its `pageW` parameter and gives frameWidth `{ width: pageW }`: its one caller passes the page's
  width, sp26 checks that call's text, and the brief keeps every other suite as it is.
- The group is looked up in the twin's visuals (`r.visuals`), as widthIn did; a group's box is the same in both.
- The local is named `widthOf` (as in aroundTables), so the probe and the ledger name it the same way.
- The probe's mirror-units place is `frameWidth` (the one place), not its alias `widthOf`.
- The probe's twin-text-fit place is given frameWidth as a local (its `const { frameWidth } = require(...)` is not a
  definition the probe's source reader finds); a probe fix, not a product change.
- The ledger's "Today" table is kept as the snapshot before DD1C, said in the paragraph under it.

## For the owner
none (no golden or twin test changed its answer).

## Risky changes
- A chart kept under its heatmap's grid in a group whose box is broken (width 0, below 0, text, no width, x not a
  number, no position) is now clamped to its page; before it was unclamped, or put at x 0 (width 0 or below).

## Results
(filled after the full runs)

## Seen, not in scope
- twin-geometry's boxOk still accepts a width of 0 or below for the twin's own visuals (B-335).
- contracts-probe's source reader does not find a name defined by a destructured require (`const { a } = require()`).

## Lessons for the reviewer
- The probe is not run in CI: DD1C left its 1c family failing (ReferenceError) unseen. Run
  `node scripts/contracts-probe.mjs` when a family's place changes.
