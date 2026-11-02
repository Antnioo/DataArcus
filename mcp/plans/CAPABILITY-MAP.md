# The engine's capability map (plan only; round 9, 2026-10-04)

The owner's words: "I want the engine to expand and be able to do all sorts of manipulation in Power BI ... more
room for creativity ... a tool used all the time to build other tools." This file lists every kind of change a Power
BI report allows that the engine could make, what each needs, and an order. **No code was written for it.** It feeds
the owner's reading on 10 October, next to `research/ENGINE-POSSIBILITIES.md` (dataarcus-engine) and
`mcp/plans/DESIGN-ENGINE-PLATFORM.md`.

## How to read it
- **Where a fact comes from** is marked: **[measured]** = seen in Power BI Desktop 2.158 and recorded in
  `scripts/tests/DESKTOP-TESTS.md`; **[code]** = what the engine does today; **[schema]** = Microsoft's public PBIR
  schemas (`github.com/microsoft/json-schemas`, `fabric/item/report/definition`) or Microsoft's report-authoring
  reference (their `powerbi-authoring` plugin, 0.3.18); **[Learn]** = Microsoft Learn as quoted in
  ENGINE-POSSIBILITIES.md. **Everything not marked [measured] is unproven in Desktop** and has a Desktop check named.
- **Schema versions.** The engine writes report 2.1.0, page 2.0.0, visualContainer 2.1.0, mobile 2.1.0, bookmark
  1.4.0 [code]. The current ones are report 3.3.0, page 2.1.0, visualContainer 2.12.0, visualContainerMobileState
  2.7.0, bookmark 2.1.0, reportExtension 1.0.0 (ENGINE-POSSIBILITIES.md, section 2). A capability that needs a newer
  schema means moving a version, and every fixture with it: that cost is named where it applies.
- **Effort** is in builder sessions (one session = one round of the size of rounds 5 to 9: plan, tests first, code,
  record), without the Desktop sitting each one needs.
- **Rules that hold for every row:** the model is never changed; nothing is overwritten or deleted (a change to an
  existing report is always a new copy); model names and a report's own texts are untrusted input; no data values in
  answers, and none written into a file without saying so; Microsoft's validator must give 0 errors; a rule Power BI
  decides is measured in Desktop before it is coded.

## The map

### 1. Editing an existing report into a NEW copy
- **What it is:** read a PBIR report, change something (add a page, restyle, re-bind a visual, add a filter), and
  write the result under a free name. The original is never touched (the owner's rule).
- **Today: none.** `create_report` only writes new reports from a design; `check_model_health` reads reports only
  to see which fields are used [code].
- **Files and schema:** the whole `definition/` folder (report, pages, visuals, bookmarks, `reportExtensions.json`),
  `StaticResources/`, `.platform` (a new `logicalId`), `definition.pbir` (the same model reference) [schema]. The
  source may be in any schema version up to the current ones: the copier must keep what it does not understand
  byte for byte and change only the files it means to.
- **What it unlocks:** every other row applied to reports people already have ("add a tooltip page to my report",
  "make an Arabic copy", "put my theme on it"). For tool builders: a read-modify-write API over any report, which is
  what makes the engine a platform and not only a generator.
- **Risks:** a report saved by a newer Desktop than the engine knows (unknown properties must survive); a PBIR-Legacy
  report (`report.json` only: Desktop converts it on save [Learn], the engine should refuse it and say so); files
  that hold data values (slicer selections, bookmark states: "PBIR files can hold data values" [Learn]) are copied,
  never returned in an answer; a name clash; visual ids inside bookmarks and `mobile.json` must stay consistent.
- **Desktop checks:** a copy of a Desktop-saved report opens with no repair message and no diff when saved again;
  the same for a report from Microsoft's samples; a copy with one changed visual shows only that change.
- **Effort:** 2 sessions (1: the reader and the byte-exact copier with a free name; 2: the first three edits).

### 2. Bookmarks and view switches
- **What it is:** bookmarks that show or hide groups of visuals (chart or table view, a details layer), with buttons
  that apply them.
- **Today: partial.** The Reset button's bookmark (clears the slicers) and the slide-in filter panel's two bookmarks
  are written, schema 1.4.0 [code], and work in Desktop [measured, rounds 0 to 2].
- **Files and schema:** `definition/bookmarks/<id>.bookmark.json` and `bookmarks.json` (bookmark 2.1.0 today);
  the button's `visualLink` type `Bookmark` in `visual.json` [schema, code].
- **What it unlocks:** view toggles, guided "story" steps, a help overlay, a "show the numbers" switch: the patterns
  dashboard builders use most after navigation.
- **Risks:** a bookmark can store filter and slicer **values** (data): the engine must write display-only bookmarks
  (visibility, no data state) and say so; hidden visuals still query unless they are hidden in the bookmark's
  display state; each toggle doubles the visuals on a page (the 1,000-visual limit is far, performance is not).
- **Desktop checks:** a two-state toggle (chart or table) switches with one click and survives a slicer change;
  the bookmark keeps no data state; right-to-left; the phone layout.
- **Effort:** 1 session.

### 3. Drillthrough with Back
- **What it is:** a details page that opens filtered to the clicked value, with a Back button.
- **Today: none.**
- **Files and schema:** the target page's `page.json` (`pageBinding` of type `Drillthrough` with its parameters, and
  the drillthrough field in the page's filters); a Back button (`actionButton` with the `Back` link type) [schema].
  The shape must be taken from Microsoft's reference or a Desktop-saved page, not guessed (as round 8 did for
  filters).
- **What it unlocks:** master and detail reports: an overview by region, a click, the region's page. With
  cross-report drillthrough left out (it needs the service).
- **Risks:** the drillthrough field must exist in the model and be used by the source visual; "keep all filters";
  a hidden details page that nobody can reach if the field is wrong.
- **Desktop checks:** right-click > Drill through shows the page; the page opens filtered; Back returns; Arabic.
- **Effort:** 1 session.

### 4. Tooltip pages per visual
- **What it is:** a tooltip page made for one visual (its own measure, its own small chart), not one shared page.
- **Today: partial.** Every report gets one tooltip page by category and one trend page by month, linked with
  `visualTooltip.type: 'Canvas'` [code, measured in round 0].
- **Files and schema:** a page with `type: 'Tooltip'` and a `pageBinding`; each chart's `visualTooltip` section
  [code]. The tooltip is always opaque and 320 x 240 needs its own text sizes [measured].
- **What it unlocks:** "hover a bar, see that product's trend and target": richer answers without more pages; SVG
  measures inside a tooltip (after their own check).
- **Risks:** a bar chart inside a tooltip can't scroll [measured]; each tooltip page is a hidden page to keep in
  sync; too many make a report slow to open.
- **Desktop checks:** two visuals on one page show two different tooltip pages; hover in right-to-left.
- **Effort:** 1 session (the plan's `fields` per visual must name the tooltip's fields).

### 5. Page navigation
- **What it is:** menus across pages: a top or side menu, a home page with tiles, back and next.
- **Today: built for two pages.** A page navigator in English, single page buttons in right-to-left reports
  (the navigator has no order setting) [code, measured in round 2].
- **Files and schema:** `actionButton` with `visualLink` type `PageNavigation`, or the `pageNavigator` visual [code].
- **What it unlocks:** reports of 3 to 10 pages with one consistent menu, a landing page, sections.
- **Risks:** a long page name is cut unless two lines fit (3.5 x pt in Segoe UI, 3.2 x pt in Tahoma) [measured];
  every page must carry the same menu at the same place; hidden pages must not be in it.
- **Desktop checks:** a five-page report in both directions; the selected state on each page; the phone layout.
- **Effort:** 1 session (it rides on "more than two pages" in the platform plan, piece 7).

### 6. Field parameters
- **What it is:** a slicer that swaps the measure or the dimension a chart shows.
- **Today: none.**
- **Files and schema:** **a field parameter is a calculated table in the model** (`NAMEOF` rows with extended
  properties), not a report object [Learn]. The report only binds to it.
- **What it unlocks:** one chart, many views, chosen by the reader: the most asked-for interactivity.
- **Risks:** it needs a model change, which the engine never makes. The honest forms: (a) the engine writes a TMDL
  script for the user to apply (as the health fixes do) and binds the report to the parameter once it exists;
  (b) bookmarks that swap visuals (row 2), which need no model change. Not possible as a report-level measure.
- **Desktop checks:** the script applies in TMDL view; the slicer swaps the chart's field; Arabic display names.
- **Effort:** 2 sessions (script, then binding); or 0 beyond row 2 for the bookmark form.

### 7. Visual calculations
- **What it is:** a calculation that lives on one visual (a running total, a moving average, percent of parent).
- **Today: none.**
- **Files and schema:** inside the visual's query in `visual.json` (visualContainer 2.12.0 names them; the engine
  writes 2.1.0, so this needs the newer schema) [schema]. They don't work in custom visuals [Learn].
- **What it unlocks:** running totals and "% of total" columns without a measure in the model: analysis the user's
  model does not have, with the model untouched.
- **Risks:** the schema move (every fixture); a visual calculation refers to the visual's own columns, so it breaks
  when a field is swapped; they are hidden from the Data pane, so the plan must show them in words.
- **Desktop checks:** a running total on a column chart and a table; export to Excel; the validator on 2.12.0.
- **Effort:** 2 sessions (1 for the schema move with all fixtures, 1 for three calculations).

### 8. Conditional formatting
- **What it is:** colours, icons and data bars that follow a value: red and green, a colour scale, a rule.
- **Today: none** in standard visuals. The SVG columns of round 9 colour by rule inside the picture [code].
- **Files and schema:** `visual.objects` entries whose value is an expression instead of a literal (a rule set, a
  gradient, or a measure that returns a colour), each with a selector (`metadata` or a data-view wildcard) [schema;
  the same selector kind D8 showed on the card]. Microsoft's reference has seven pages on it.
- **What it unlocks:** status colours on cards and tables, data bars, "bad is red" in every visual, colours from a
  measure of the model.
- **Risks:** many shapes (rules, gradient, field value), each per visual type; a colour rule must keep contrast on
  both themes; colour alone fails accessibility (an icon or a sign must go with it).
- **Desktop checks:** per shape and per visual type (table background, card value colour, bar colour): one page
  each, English and Arabic.
- **Effort:** 2 sessions (1: card and table by rules; 2: bars, gradients, data bars).

### 9. More visual types
- **What it is:** matrix, scatter, combo, waterfall, ribbon, a shape map or filled map **without internet calls**,
  the decomposition tree, the new card's images and reference labels, the new slicers (button, list).
- **Today: 14 kinds** (title, logo, KPI card, line, bar, column, donut, table, gauge, funnel, treemap, map, slicer,
  text) [code]. The map kind is Power BI's bubble map, which calls Bing: it is offered and must say so.
- **Files and schema:** `visual.json` per type: the roles of its query and its formatting objects (Microsoft's CLI
  lists both: `formatting describe-object`) [schema].
- **What it unlocks:** the matrix alone covers most finance reports; scatter and combo cover analysis; the new card's
  image takes an SVG measure (D-P1's open half).
- **Risks:** each type has its own measured rules (sizes, label room, what happens with no data) and its own
  right-to-left behaviour; AI visuals (decomposition tree, key influencers) query in ways that need data to check;
  maps: only a shape map with a packed TopoJSON avoids an outside call, and it is a preview feature.
- **Desktop checks:** per type, the round 0 method: the smallest and the largest page, English and Arabic, real data.
- **Effort:** 1 session per two types; the matrix alone 1 (headers, totals, right-to-left).

### 10. Themes with visualStyles and background art
- **What it is:** a theme that carries the look of every visual type, and pages with drawn backgrounds.
- **Today: built.** The theme has `visualStyles` for the kinds the engine writes; the page background is a PNG drawn
  from SVG and packed into the project [code, measured in rounds 0 to 2].
- **Files and schema:** `StaticResources/SharedResources/BaseThemes` and `RegisteredResources` (the theme JSON, the
  images), `report.json`'s `resourcePackages`; the Report Theme schema [schema].
- **What it unlocks:** brand packs (a client's theme + art + logo as one input), seasonal skins (Ramadan), per-page
  art; themes other people publish for the engine.
- **Risks:** the menu import refuses a theme with a font size outside 8 to 60 [measured]; PDF export drops the
  wallpaper [Learn]; text drawn into a background is invisible to screen readers.
- **Desktop checks:** D-P5 (a `data:` image inside a theme); a brand pack on all four layouts.
- **Effort:** 1 session for brand packs as an input.

### 11. The mobile layout
- **What it is:** the phone view of each page.
- **Today: built.** `mobile.json` per visual, positions in page units, its own text sizes [code, measured in round
  1: positions inside a group are page positions there].
- **Files and schema:** `visuals/<id>/mobile.json` (visualContainerMobileState 2.1.0 written; 2.7.0 current).
- **What it unlocks:** phone-first reports, a different order on the phone, hiding heavy visuals there.
- **Risks:** nothing reads the phone view back without Desktop's mobile layout view (UI Automation opens it);
  SVG pictures on a phone are unproven (D-P7).
- **Desktop checks:** D7 (open), D-P7.
- **Effort:** 1 session for a phone-only order and hide list.

### 12. The Deneb bridge (certified, opt-in)
- **What it is:** the engine writes a Deneb visual (Vega-Lite) from a template: charts Power BI has no visual for.
- **Today: none.**
- **Files and schema:** `report.json`'s `publicCustomVisuals`; the visual's spec in its `visual.json` objects
  [schema]. Deneb is certified (no outside calls, exports to PDF) and MIT [ENGINE-POSSIBILITIES.md 2.3].
- **What it unlocks:** bullet charts, small multiples, calendar heat maps, Hijri calendar grids, anything Vega-Lite
  draws. For tool builders: a template format that already has a community.
- **Risks:** a tenant can block custom visuals; the visual must be installed (first use downloads it from
  AppSource: an internet call the user must agree to); visuals "may be updated automatically"; no visual
  calculations; a spec is code-like input and must be a template with named fields, never free text from a model.
- **Desktop checks:** D-P6 (offline, installed and not installed).
- **Effort:** 2 sessions, only after the owner's go (it is the one row that leaves "Microsoft's own visuals only").

### 13. The engine as a library for other tools
- **What it is:** the engines behind the MCP as a documented API: read a model, pick fields, plan a layout, write a
  report, compile an SVG component, check a report, each callable from Node (and the browser) without the MCP.
- **Today: partial.** The engines are plain JavaScript files shared by the website and the MCP [code]; there is no
  versioned API, no package, no docs, and the design spec has no version (platform plan, piece 1).
- **Files and schema:** `assets/js/*.js` (the engines), `mcp/lib/*.mjs`; a package with types and a changelog.
- **What it unlocks:** the owner's own next tools (the calendar, the measure builder, the SVG designer) on one
  engine; other people's tools; a CLI; CI checks of reports ("the validator plus our layout checks").
- **Risks:** a public API freezes names and shapes: every later change is a version; the open or private decision
  (the engine repo is private today); support load; the safety rules (never overwrite, untrusted names) must live
  inside the library, not in the MCP server around it.
- **Desktop checks:** none of its own; every capability keeps its own.
- **Effort:** 2 sessions (1: the spec version and the entry points; 2: docs, types, an example tool), after the
  owner's platform decisions of 10 October.

### Also possible, smaller (one line each)
- **Report and visual-level filters** (round 8 wrote page filters): the same structure in `report.json` and
  `visual.json`; Top N exists only at visual level. 1 session with relative-date filters; dates need their literal
  measured.
- **Report-side number formats beyond cards** (tables, tooltips, axis labels): D8's other half; 1 session after the
  Desktop check.
- **SVG measures in more places** (card image, matrix, image visual, tooltips): D-P1's other half, D-P2 to D-P4,
  D-P7; 1 session after the checks.
- **Alt text and tab order** (accessibility): `visualContainerObjects.general.altText`, a `tabOrder` per visual
  [schema]; alt text from a measure, 250 characters [Learn]. 1 session.
- **Sync slicers across pages** and **slicer defaults**: `syncGroup` in the slicer's `visual.json` [schema]; a
  default selection stores a data value, so it must be the user's own choice. 1 session.
- **Reference lines, error bars, small multiples, zoom sliders** on the charts the engine writes: formatting objects
  only [schema]. 1 session per two.
- **Report settings** (`report.json` settings: cross-highlight or cross-filter, export data, persistent filters):
  1 session, mostly text for the plan.

## Proposed order, rounds 10 to 14
The order follows three rules: what turns today's open Desktop checks into shipped value comes first; then what makes
every other row reusable (the copy); then breadth.

| Round | What | Why here | Needs first |
|---|---|---|---|
| 10 | **Finish what round 9 opened:** report-side formats in tables and tooltips, SVG in the card image and the matrix, the length cap replaced by the measured limit, alt text for SVG columns | everything is already half measured; it closes D8 and D-P1 instead of leaving experiments | one Desktop sitting: D16, D-P1b, D8 (tables), D-P2, D-P3 |
| 11 | **Edit into a new copy** (row 1) with three edits: add a page filter, apply a theme, make a right-to-left copy | it turns every later capability from "new reports only" into "your reports too"; the largest single unlock for other tools | the owner's go on reading existing reports; a Desktop round-trip check |
| 12 | **Interactions:** bookmarks and view switches (row 2), drillthrough with Back (row 3), tooltip pages per visual (row 4), navigation for more than two pages (row 5) | four small rows that share buttons, pages and bookmarks, best measured in one sitting | the platform plan's "more than two pages" (piece 7) |
| 13 | **More visuals and conditional formatting:** the matrix, scatter and combo (row 9), colours by rule on cards and tables (row 8) | breadth people ask for by name; each needs its own measurements, so it comes after the structure is settled | a Desktop sitting per two types |
| 14 | **The library** (row 13): a versioned spec, entry points, docs, one example tool built on it; then, only with the owner's go, visual calculations (row 7, the schema move) or the Deneb bridge (row 12) | the API should freeze only after rounds 10 to 13 have shown what its shapes must carry | the owner's platform decisions of 10 October |

Field parameters (row 6) are left out of the order on purpose: they need a model change. The bookmark form comes
with round 12; the script form waits for the owner's decision.

## Decisions for the owner
1. **Reading and copying existing reports (row 1):** go or not. It means the engine reads reports the user made,
   which may hold data values in slicers and bookmarks; they would be copied, never returned in an answer.
2. **Schema versions:** stay on the versions written today (validated, measured) until a capability needs a newer
   one, or move everything to the current ones in one round (all fixtures change once). Recommended: stay, and move
   once, with round 14's visual calculations, if those are wanted.
3. **Field parameters:** only the bookmark form (no model change), or also a TMDL script the user applies.
4. **Custom visuals (Deneb):** in or out. It is certified, but it is the first thing the engine would write that is
   not Microsoft's own, and its first use downloads from AppSource.
5. **The map visual:** keep offering the bubble map (it calls Bing) with a warning, or drop it until a shape map
   without outside calls is measured.
6. **The library:** open or private, and when. The order above freezes the API in round 14; opening it earlier
   means freezing earlier.
7. **Experimental features in the package:** round 9's SVG columns ship marked experimental. Keep shipping
   experiments marked so, or hold them back until their Desktop checks pass.
