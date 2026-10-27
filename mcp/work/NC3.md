# NC3 (0.3.1): the native copy's four Desktop defects (the map, the search box, the word cloud's order, the chip row)

## Summary
- **Approval:** the owner's question ("replace all custom visuals with native ones and clean up the clutter"); the laptop
  ran 0.3.1 on his reports in Desktop 2.159 on 27 Oct (answer "partly": an empty map panel, a text search that became a
  cramped checkbox list, the word cloud's bars A to Z, a chip slicer's slot too short); the reviewer approved fixing
  these now. The brief "Go on NC3". Builder; the reviewer reviews and merges.
- **Scope:** `mcp/lib/visual-meaning.mjs` (the forms, the map's needs and second option, the slicer's settings, the
  cloud's sort), `assets/js/visual-replace.js` (writes them), `mcp/lib/native-copy.mjs` (the model's data categories,
  the plan's "turn on" list), `mcp/lib/approval-window.mjs` only if the rows need it, the lab suite. Not GL2's, TT1's,
  BD2's (`text-measure.js`) or CS2's (`redesign.mjs`, `text-format.mjs`) files.
- **Base:** `fix/0.3.1-nc3` from `origin/integration/0.3.1` 77c2876. Push only it; no merge, no PR.
- **Expected checks:** custom-visuals-lab 56 -> about 68 (the new NC3 checks red on 77c2876 first); the lab's own plan
  unchanged in count (11 replaced, 0 high, 7 medium, 4 low, 2 second options); a made-up copy of the lab with a map and a
  text search added: 13 replaced, validator 0 errors on its native copy; `npm test -- report` 30 suites, `-- core`
  golden byte for byte, the full run 95 suites; check-result-lines, changelog-words, check-agent-memory PASS.
- **Resume:** the plan is pushed; then the tests (red), the code, the suites, the results below.

## The evidence (Microsoft Learn and the schema; nothing of the owner's reports)
1. **The map.** DataArcus writes `azureMap` (Microsoft's validator calls `map` and `filledMap` deprecated, "Legacy Bing
   Maps visual - replaced by Azure Maps"). Learn ("Manage Azure Maps Power BI visual within your organization",
   "Integration tenant settings"): the visual works only where the tenant setting **"Users can use the Azure Maps
   visual"** is on, and "is currently only available in the United States and European Union regions. If your tenant is
   located outside these regions, the Azure Maps Power BI visual won't function unless you enable" **"Data sent to
   Azure Maps can be processed outside your tenant's geographic region, compliance boundary, or national cloud
   instance"**; Desktop's "Tenant switch not enabled" error needs Desktop of May 2025 or later. A Gulf tenant is outside
   both regions: an empty panel with no map tiles at all fits this. Desktop's own "Use Map and Filled Map visuals"
   (Options > Global > Security) is for the Bing `map` and `filledMap` only, never written here. Second, from the
   geocoding page: the Location field is geocoded; "set the Data Category" (Column tools > Data category: City, Country,
   ...) "to ensure fields are correctly geocoded", and "if no valid location data is uploaded, data layers that depend on
   geocoded locations, such as heat maps or bubble layers, don't display": tiles with no bubbles fits this one. The
   schema's Location role prefers a geographic category (`preferredTypes` geography.*).
2. **The search box.** The native slicer with no mode is drawn as a vertical checkbox list. Microsoft's capabilities:
   `data.mode` "Dropdown" (measured to draw on 2.158, DESKTOP-TESTS.md 12 Oct) and `general.selfFilterEnabled`
   (`operations.searchEnabled`: the slicer's search). Learn (February 2026, 2.151): the text slicer is renamed the
   **input slicer** and is generally available (`textSlicer`, one Values field, filters by typed text).
3. **The word cloud's order.** No sort was written, and Desktop drew the bars A to Z. The writer's own bar charts write
   `sortDefinition` Descending by the value with `isDefaultSort` (pbip-query.js), the form Desktop draws.
4. **The chip row.** The native slicer had no mode in a 64-high box: rows cut. Pills (the button slicer) need pillH:
   79 at 10pt (F6, measured on 2.159 with margins 0) and each value's width (C1's pillFits), which needs the values'
   texts: a native copy reads metadata only, so they are not known. A dropdown needs slicerH 56 at 10pt (16 + 4 x pt).

## The plan
1. **Map** (a test on a made-up map first): every Azure map replacement carries `needs` with the two tenant settings by
   their exact names, the Desktop version, and how to tell the two causes apart (no tiles: the settings; tiles without
   bubbles: the locations); the plan answer lists them once (`turnOn`), the approval page shows them, and the write's
   nextSteps repeats them. The Location column's data category is read from the model (metadata): none, or not a
   geographic one, is said with the step to set it. A second option that draws without Azure Maps: a clustered bar
   chart of the size by the location (a table when there is no value), by `customVisualsSecond`.
2. **Search box** (a test on a made-up textFilter first): a custom visual whose id says a text search (text filter,
   search) becomes the native slicer in Dropdown mode with its search on, in its own box; its header off when the box
   is lower than slicerH (a search box has none); the plan says what it became; second option the input slicer.
3. **Word cloud** (the lab's cloud): its bar chart sorted by its value, largest first (`sortDefinition` Descending,
   `isDefaultSort`), when the original kept no sort of its own.
4. **Chip row** (the lab's chip slicer): a chip-like slicer (id words chip, pill, button, tag) becomes the native slicer
   in Dropdown mode, with why in its losses ("the pills need 79 high at 10pt and their values' widths, not known to a
   copy that reads metadata only: a dropdown in its 64-high box"); its header off when the box is lower than slicerH.
5. The lab: a `--extra` copy is not needed; the suite adds the map and the text search to a copy of the lab (made up).

## Expected numbers (before any run)
- Lab plan: 11 replaced (0 high, 7 medium, 4 low), the chip slicer and the cloud same native types; nothing else moved.
- The made-up copy with a map (Location a city column with no data category, Size a measure) and a text search (one
  text column): 13 replaced; the map azureMap with `needs` (2 settings) and a second option clusteredBarChart; the text
  search a slicer, Dropdown, search on, second option textSlicer; validator 0 errors on its native copy.
