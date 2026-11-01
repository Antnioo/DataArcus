# MX2 (0.3.1): every English-vs-Arabic difference of laptop part 8 left to this job

## Summary
- **Approval:** the reviewer's brief "MX2" (1 Nov, 06:46); the owner's D-1101-03 (every difference of part 8 fixed in
  0.3.1). Another builder (MP1e) has time direction, card order and alignment, buttons, Call Center's cards: not here.
- **Base:** `fix/0.3.1-mx2` from `origin/integration/0.3.1` (7c54e918), then merged, in order: `origin/fix/0.3.1-mr1`
  (clean), `origin/fix/0.3.1-mp1d` (conflict in `mcp/tests.json`: both suite lines kept, mr1 and mp1-shapes),
  `origin/fix/0.3.1-mx1` (conflicts in `mcp/tests.json` and `mcp/CHANGELOG.md`: both sides kept). On the merged base:
  mx1 41, mp1-shapes 10, mr1 26, mp1 100, mirror-parity 62, all PASS.
- **Scope:** (planned) 1 every part-8 matrix classified from its real JSON (flat: MX1's A; grouped: MX1's C offer);
  2 Arabic legends that are cut or made identical (`twin-pages.mjs` fitting, a new function, not MP1d's); 3 a reversed
  table wider than its box fixed where safe (`twin-pages.mjs`, the header fitting's rule: no text cut); 4 one plain plan
  line per visual Power BI cannot mirror (`twin-plan.mjs`).
- **Expected checks:** a new suite `mx2` (area twin), about 20 checks, each red on the merged base first, each built
  from the real shapes of `business/beta/shapes/<name>/en|ar/definition/` (made-up names, no data): 1 one check per
  named matrix (8) and per table already right (said); 2 four (two items never identical; each fits its approved
  Arabic or is named; the two real legends); 3 four (the roadmap and the watchlist fit with no text cut, or named;
  a guard that fits); 4 five (decomposition tree, treemap, native waterfall, scatter, map: one line each). mp1-shapes
  and MP1d's never-shrink guard stay green. Full run: the merged base's suites + 1.
- **State: BLOCKED** on the evidence: this session cannot read `Antnioo/dataarcus-engine` (attaching it was refused
  by the session's permission check), so neither `business/reviews/2026-11-01-part8-en-vs-ar.md`, the part-8 shots
  nor branch `lab/dashboard-shapes` can be read here. Nothing beyond the base and this plan is done.
- **Resume:** the engine repo attached to this session (or its shapes copied into this repo's branch), then item 4
  (needs only the code), then 1-3 red first from the real shapes.

## What the code shows today (read on the merged base)
- Item 4, what the plan says now per kind (`report-mirror.js kindOf`, `twin-plan.mjs cannot`):
  decomposition tree (`decompositionTreeVisual`) and scatter (`scatterChart`): kind `other`, one cannot line for all
  of them ("other visuals (scatter and kinds without a proven setting): moved only"), the visual type in brackets;
  treemap and maps (`treemap`, `map`, `filledMap`, `azureMap`): kind `plain`, only in `mirrors` ("moved only: nothing
  in them has a side"), no cannot line; Power BI's own waterfall: `waterfallNative` / `waterfallKept`, said. Planned: one
  line per kind met, naming each visual (a treemap's tiles and a map do not mirror; a scatter keeps its axes; a
  decomposition tree grows left to right).
- Item 2: no fitting of a legend's text exists in `twin-pages.mjs` today (buttons, text boxes, headers, phone tabs only).
- Item 3: MX1's D names a wide table and never narrows it; the header fitting (`fitHeaders`) narrows only text
  columns to their own header's need. Planned: narrow a column only down to its header's need and only where the
  original's own width over that need is spare in its English too (no value cut by the twin that the English does not
  cut), else name it.

## For the laptop (part 9)
To be written with each item's page once the work is done.

## Seen, not in scope
- none yet.
