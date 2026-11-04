## Summary
- **Approval:** the brief "DD1C2" (4 Nov); the owner D-1104-12 (one library, fix at the source), D-1104-11 (one big
  check), D-1016-01 (never 100 places), D-1104-15 (a group with a broken box: the page's width, else unknown).
- **Base:** `feat/0.3.2-dd1c2` from `origin/integration/0.3.2` at 240d179 (DD1C and ST1 in it). Push only this branch;
  never merge.
- **Scope:** the fourth frame reader, mcp/lib/twin-geometry.mjs `underGrids` (a chart kept under a heatmap's grid),
  reads `Units.frameWidth` like `aroundTables`; its own `widthIn` (a group's position.width unchecked, else the page's)
  is gone. Unknown frame: the chart keeps its wanted x, unclamped (as today on a non-finite width), nothing new said.
- **Plan (one commit each):**
  1. twin-geometry.mjs underGrids: `widthOf = (v) => Units.frameWidth({ width: pageW }, byName, v)` (pageW is the
     page's width its one caller passes, `pageOf(pg).width`: the signature and sp26's call check stay).
  2. mcp/test-0.3.2-dd1c.mjs: G1-G13 the grid chart's frame on the same 13 made-up frames, read from its behaviour
     (the twin's matrix pushed far right, the chart clamped to W - width; unknown: left at its wanted x), one answer
     with the other three; S4 underGrids calls frameWidth. Red proof: the old widthIn back.
  3. mcp/docs/CONTRACTS.md family 1c: "One place" line, "Since DD1C" says all four; the probe's 1c places fixed so
     they run (on the base the probe's 1c fails: twin-text-fit's destructured frameWidth is not found, and
     aroundTables is given a Map for byName); its table: one answer per input.
- **Expected checks:** dd1c 61 -> 75 (+13 G, +1 S4); every other suite's number as on the base; mutation 76/76;
  lint 0; check-contracts, check-modules --strict, agent-memory, stamps green.
- **Resume:** step 1.
