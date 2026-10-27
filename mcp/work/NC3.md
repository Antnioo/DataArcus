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

## Before -> after
1. **Map** (NC3-1a to f, on a made-up copy of the lab with a map of a city column and a value): before, the plan said
   only "a native Azure map" and its look's losses; nothing about what Azure Maps needs, the location column's data
   category, or any other way. After: each Azure map carries `needs` (the two tenant settings by their exact names,
   Desktop of May 2025 or later signed in, how to tell no tiles from no bubbles) and, from the model's metadata, "its
   location column has no geographic data category ... Column tools > Data category"; the plan lists the settings once
   (`turnOn`), `sayInPlan` says to tell them, the tell sentence says the map draws only where Azure Maps is turned on,
   the approval page shows "to turn on: ...", and the write's nextSteps repeats them. Second option: a clustered bar
   chart of the size by the place (a table when there is no value or no place name), "which draws without Azure Maps".
2. **Search box** (NC3-2a to d, a made-up `textFilter` of one text column in a 156 x 40 box): before, a native slicer
   with no mode (Desktop: a vertical checkbox list cut by its box). After: the slicer in Dropdown mode
   (`data.mode`), its search on (`general.selfFilterEnabled`), its header off (40 < 56, slicerH at 10pt), its box grown
   to 48 high, downward (Microsoft's validator: below 48 a dropdown's selector is clipped, an error), each said in its
   losses; tell "a native slicer (a dropdown with its search on)"; second option the input slicer (`textSlicer`, in its
   own 40-high box). Validator 0 errors on the copy's native copy.
3. **Word cloud** (NC3-3, the lab's cloud): before, no sort written (Desktop: A to Z). After: `sortDefinition`
   Descending by its value (Units Sold), `isDefaultSort` true.
4. **Chip row** (NC3-4a to c, the lab's chip slicer, 700 x 64): before, a slicer with no mode (rows cut). After: a
   dropdown in its 64-high box, the header kept (56 needed at 10pt), with why: "its row of chips: the native button
   slicer's pills need 79 high at 10pt (measured on Desktop 2.159) and each value's width, and a copy that reads metadata
   only does not know the values: a dropdown in its 64-high box". A chip row in a 40-high box: header off, grown to 48.

## Results
- custom-visuals-lab: 56 -> 70 checks PASS (the 14 new; 13 red on 77c2876 first: NC3-2c, the validator, was already 0
  errors there, as the old copy wrote no dropdown). The lab's own plan unchanged: 11 replaced, 0 high, 7 medium, 4 low,
  2 second options; the made-up copy: 13 replaced.
- The validator on the lab's native copy: 0 errors; one new warning, PBIR_SLICER_HEADER_MAY_CLIP on the chip slicer
  ("64px < 76px full height (header 28 + selector 32 + padding 8/8)"): Microsoft's validator's own numbers, against our
  measured 56 for a dropdown and its header at 10pt (2.157): for the laptop (below).
- `npm test -- report`: "run-tests: 34 suites passed (report)" (the registry has 34 report suites at this base).
- test.mjs shard 4 (v029visuals with it): "PASS  mcp  339 checks (shard 4/4: 13 parts)".
- build:min "All 74 .min.js files match their sources" (`visual-replace.js` has no .min.js and no page loads it: no
  ?v=, csp, ar-pages or sitemap change); test-site-config, changelog-words 184, check-result-lines 99, check-agent-memory
  PASS.

## CHANGELOG line
"Native copies that draw in Desktop" in `mcp/CHANGELOG.md` [Unreleased]: the map's two tenant settings by their names
and its location column's data category, a bar chart second that draws without Azure Maps; a text search as a dropdown
slicer with its search on (the input slicer second); a chip row a dropdown with why; a word cloud's bars by value.

## Decisions I made
1. The map stays Azure Maps first: Microsoft's validator calls `map` and `filledMap` deprecated (Bing), and Desktop's
   "Use Map and Filled Map visuals" (Options > Global > Security) is for those only. What DataArcus can fix is that the
   map never arrives silently empty: the settings by their exact names everywhere the person reads (plan, approval
   page, the write's next steps) and a second option that needs no Azure Maps. The cause on the owner's report (no tiles:
   the tenant settings; tiles without bubbles: the places) is for the laptop to tell; nothing was estimated.
2. The data category is read from the model's metadata (`dataCategory`, as read_model reads it); DataArcus never sets
   it (the model is not written): the step is said. Not said for a map keyed by its latitude (no place names).
3. The search box's first option is the dropdown with search (the brief's); the input slicer (generally available since
   February 2026, Learn) is second: its JSON is not measured, so only by the person's choice. A dropdown below 48 grows to
   48 downward (Microsoft's validator's floor, an error below it) rather than be clipped; said, with "check nothing below
   it is covered". Its header is off below 56 (our measured slicerH at 10pt), on from 56 (the validator warns below 76:
   our measurement wins, the laptop checks).
4. A chip row is never written as pills by the native copy: the pills need their values' widths (C1's pillFits) and a
   copy that reads metadata only does not know them; so a dropdown, with the measured height in the why.
5. Forms by the id's words only (search: search, searchbox, textfilter, textsearch; chips: chip, pill, button, tag),
   matched as words or, 8 letters and more, inside the joined words ("textFilter"); the fields still decide (a slicer).
6. The sort by value is the word cloud's only (its loss line promised "longest bar first"); other replaced bar charts
   keep what the original had (Seen 2).

## For the laptop (Desktop 2.159; the lab with `mcp/lab/CUSTOM-VISUALS-LAB.md`, and the owner's reports' native copies)
1. The owner's DataDNA map: does the copy's map show map tiles? None at all: in the admin portal, "Users can use the
   Azure Maps visual" and (a Gulf tenant is outside the US and EU) "Data sent to Azure Maps can be processed outside your
   tenant's geographic region, compliance boundary, or national cloud instance"; Desktop signed in to that tenant. Tiles
   but no bubbles: the location column's Data category (Column tools). Tell the reviewer which it was; the plan's
   second option (`customVisualsSecond` with the map's key) gives a bar chart that draws either way.
2. The owner's ER text search: a dropdown with a search box when opened, in the original's box (40 high or less: grown
   to 48, header off); typing filters the list. Also once the second option (the input slicer): does it filter as typed?
3. The lab, page 3: the word cloud's bar chart, the longest bar on top, down to the shortest.
4. The lab, page 2: the chip slicer a dropdown in its 64-high box with its header ("Country") whole (the validator warns
   below 76; we measured 56): a full-size crop. If the header is cut, the threshold becomes 76.

## Seen, not in scope
1. Other replaced bar charts with no sort of their own (the drill bar, the tornado) are drawn A to Z too: the same
   `sortDefinition` by value would order them, if wanted (the owner's call).
2. The evidence line reads "its id's words name a Azure map" (the article before a vowel).
3. The validator's slicer floor (48 with no header, 76 with it) and our measured 56 disagree for a dropdown with its
   header: one Desktop crop decides (laptop item 4).
4. A dropdown grown to 48 may cover a few pixels of the visual below it in a tight layout: said in the plan, not moved.
5. The approval page shows a second option's losses but not its needs (only the map's first option has needs today).
