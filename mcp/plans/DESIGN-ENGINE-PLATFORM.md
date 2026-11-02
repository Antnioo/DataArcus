# The design engine as a platform: plan

**Plan only. No code was written for it.** Written 2026-10-04 (round 6) from the code on `fix/round-6-fields`. The
owner's aim: an engine "good enough so I can build anything on top of it". Effort is in builder sessions (one
session is one focused sitting: tests first, the suites, a commit); "Desktop" means a measurement or a check in
Power BI Desktop is needed before the item can be called done.

## Where the engine stands today
- **Three files do the work**, shared by the website and the MCP: `design-engine.js` (colours, the theme JSON, page
  sizes, the layout slots, the background drawing), `pbip-export.js` (writes the PBIR project: every visual, the
  phone layout, tooltip pages, page buttons, the slide-in panel), `pbip-bind.js` (reads a model and picks fields).
- **What it can express:** four layout presets (`exec`, `analysis`, `ops`, `focus`), each a fixed arrangement with
  ten adjustable sizes; fifteen visual kinds (title, logo, KPI card, card, line, bar, column, donut, table, gauge,
  funnel, treemap, map, slicer, text); six colour presets or a brand colour with a harmony; one binding model (one
  main measure for every chart, two categories, a time axis, three slicers); left to right and right to left.
- **What it can't:** a visual outside the fifteen; two charts with different measures; a matrix; a layout that is
  not one of the four; more than two pages of the user's choosing; a second accent colour or type scale per brand;
  anything written by a third party (the "design" object is the website's saved state, not a documented format).
- **What makes it worth building on:** every size rule is measured in Desktop (`scripts/tests/DESKTOP-TESTS.md`),
  right to left is mirrored by the engine and not by hand, Microsoft's validator runs on every export in the tests,
  and nothing a report shows is a guess.

## The pieces, each with value, effort, risk and what needs Desktop

### 1. A versioned design spec (the foundation of everything else)
A JSON document, `dataarcus.design/1`, that says what a report is: pages, each with a grid, sections and components;
tokens; the binding of every visual; language and direction. The website, the MCP and third parties write the same
document, and one function turns it into PBIR. Today's `design` becomes one of its producers (a preset expands
into a spec), so nothing existing breaks.
- **Value:** the one thing that turns the engine from "our four layouts" into something others can target; it also
  removes the gap the agent runs showed (a plan the tool then can't follow): the plan *is* the spec.
- **Effort:** 3 sessions: the schema with a JSON Schema file and a validator (unknown keys refused, as round 6
  started doing); the four presets re-expressed as specs with a test that the output is byte-identical to today's;
  versioning rules (additive changes keep the version; a breaking change is `/2` with an upgrader, as
  `design-engine.js` already upgrades saved layouts).
- **Risk:** freezing the wrong shape. Keep v1 small (see the cut below) and mark the rest "experimental".
- **Desktop:** none (same output).

### 2. Layout beyond the four presets: grid, spans, sections
A page is a grid (12 columns on the 720-tall design grid the engine already uses), rows of a given height or
"fill", and sections (header, filter rail, KPI row, body, footer). A visual says which columns and rows it spans.
The engine keeps doing what it does now: margins, gaps, mirroring, rounding edges not sizes, the phone order.
- **Value:** the designer's first request; every "can it do two charts on top and a wide table below" becomes yes.
- **Effort:** 3 sessions (the grid solver; the presets as grids; the phone layout from the reading order).
- **Risk:** a free grid lets a user make a card too small for its text. The measured minimums (card heights, text
  box heights, slicer heights, button heights) must become checks the spec validator runs, with the reason.
- **Desktop:** yes, once: the minimum sizes at the page sizes not measured yet (1366 x 768, 2560 x 1440), and one
  free-grid page per language to confirm nothing overlaps.

### 3. Binding per visual
Each visual names its own fields (round 6's `fields` does this for the report as a whole: one measure for all
charts). In the spec a line chart can show two measures, a bar chart its own measure and category, a table its own
columns, a card its own measure and an optional reference label.
- **Value:** needed for any real report beyond an executive summary; it is also what golden task 3 needs.
- **Effort:** 2 sessions (the exporter already takes a binding per kind; it becomes per visual, with the same
  validation against the model as `fields`).
- **Risk:** low. Multi-series charts need the legend and colours to be right.
- **Desktop:** a line chart with two series, a stacked column, a table with five columns: titles, legend, tooltips.

### 4. Visual types
Ranked by how often business reports need them and how much each costs to get right:
| Visual | Why it matters | Effort | Desktop |
|---|---|---|---|
| Matrix (rows, columns, subtotals) | finance and sales reports live on it | 2 | header alignment, right to left, totals, column widths |
| Stacked and 100% stacked bar and column, combo (line + column) | composition and target vs actual | 1 | legend, data labels, the second axis |
| Area and stacked area, ribbon | trends by category | 1 | labels |
| The new card with a reference label (target, variance) | the KPI with "vs last year" under it | 2 | the label's size and place at every card size |
| Page and report filters (the filter pane), a date range slicer, a list slicer | golden task 3's "limit the page to Ramadan" | 2 | the pane's look, the slicer heights |
| Waterfall, scatter, pie | asked for, less often | 1 each | basics |
| Decomposition tree, key influencers, Q&A, custom visuals (Sankey...) | interactive analysis | not in v1 | each needs its own study; custom visuals need a file the user must trust |
- **Risk:** each new visual is a new set of measured sizes. Add them one at a time, each with its fixture.

### 5. Design tokens as a documented API
Colours (data, text, card, page, accent, good/neutral/bad), a type scale (title, label, callout, by page size),
spacing (margin, gap, padding), radii, shadows, line weights: named values in the spec, with the rule each one
feeds (theme JSON, card padding, panel radius). Today they exist but are spread over `design-engine.js` and
`pbip-export.js` as constants.
- **Value:** a brand is a set of tokens; a designer changes a token and every page follows. Also the base for
  "themes per brand".
- **Effort:** 2 sessions (collect, name, document; a test that changing each token changes exactly its rule).
- **Risk:** a token Power BI ignores for one visual (the measured "selector" quirks). The documentation says where.
- **Desktop:** spot checks only (the rules are already measured).

### 6. Reusable components that compose
Header (title, logo, page buttons, Filters button), KPI row, filter rail or strip, slide-in panel, tooltip page,
detail table, "what it means" text: each a function from (tokens, box, binding, language) to visuals, with its own
minimum size and phone behaviour. The exporter is already organised this way inside one long function; the work is
to separate them and give each a contract.
- **Value:** new layouts and third-party pages reuse what was measured; a new component is added without touching
  the others.
- **Effort:** 3 sessions (split `pbip-export.js`, 800 lines, into components with the same output: byte-identical
  fixtures are the safety net).
- **Risk:** regressions while splitting. The fixtures and the validator catch them; no behaviour change is allowed
  in the same session.
- **Desktop:** none (same output).

### 7. Multi-page navigation patterns
Today: two pages with page buttons, tooltip pages. Patterns to add: a home page with tiles, a tab bar for 3 to 6
pages, drill-through to a detail page (with the back button), bookmarks as view switches (chart or table).
- **Value:** real reports have 4 to 8 pages.
- **Effort:** 2 sessions for tabs and N pages; 2 more for drill-through and view switches.
- **Risk:** the page navigator's limits (no order setting right to left: already worked around with buttons).
- **Desktop:** yes: button widths for 3 to 6 names in both fonts, drill-through's back button, bookmark groups.

### 8. Themes per brand
A brand file (tokens, logo, fonts, do and don't) that any spec can point at; a report is rebranded by swapping it.
- **Value:** the consultant's and the agency's use: one layout, many clients.
- **Effort:** 1 session after 5.
- **Risk:** low. **Desktop:** the contrast warnings already cover the dangerous cases.

### 9. Right to left as a first-class option everywhere
It is today for the layouts, tables, page buttons and the phone layout. To finish: every new component and visual
states its mirrored form in its contract; mixed-direction text (an English field name in an Arabic title) gets
isolation marks where Power BI respects them; Arabic digits and the Hijri calendar stay the model's.
- **Value:** the product's difference from Microsoft's own tools (finding 001).
- **Effort:** part of every item above (a mirrored fixture for each); 1 session for mixed-direction titles.
- **Desktop:** yes for mixed-direction text; it has surprised us before.

### 10. How it is tested
- **Fixtures:** a spec in, the PBIR files out, compared byte for byte (the design fixtures do this today for the
  website); every component and visual gets an English and an Arabic one.
- **Validator:** Microsoft's on every fixture (in `npm test` today for two exports; make it all).
- **Rules from measurements:** `report-check.mjs` grows with every measured rule; the spec validator runs the same
  rules before anything is written and says which box is too small and why.
- **Desktop:** a standing "measure once" list per new visual, and a sweep (the one of 2026-10-04) before a release.
- **Agent level:** the golden tasks, with a task added for each new capability.
- **Effort:** 1 session to make the fixture and validator run cover everything; then part of each item.

## Recommended order
1. The design spec with the presets re-expressed in it (item 1).
2. Binding per visual (3), because round 6's `fields` already did half and the golden tasks need it.
3. Components split out, same output (6), then tokens documented (5).
4. The grid (2).
5. Visuals, in the table's order: matrix, stacked and combo, the card's reference label, filters and slicers (4).
6. Navigation patterns (7), brand files (8), the right-to-left finish (9) alongside each.

## The v1 cut (what "good enough to build on" means first)
**In v1:** the versioned spec with a JSON Schema and a validator; binding per visual; the grid with sections and
spans; tokens documented; the existing components behind contracts; matrix, stacked and combo charts; page and
report filters; N pages with a tab bar; right to left for all of it; fixtures and the validator on everything.
About 16 builder sessions and three Desktop evenings (grid minimums; matrix and stacked charts; tabs and filters).

**Not in v1:** drill-through and bookmark view switches, the card's reference label, waterfall, scatter, pie, brand
files as a separate artefact, custom visuals, decomposition tree and the other AI visuals, a visual editor on the
website for free grids (the spec can be written by hand or by the agent first).

## Open source later, and what stays private (the Authority direction: Microsoft MVP)
- **Could be opened** (it is knowledge the community lacks and it builds the owner's name): the design spec and its
  JSON Schema; the measured Power BI rules as a document and as `report-check.mjs` (text box heights, card sizing,
  selector quirks, right-to-left facts: each with its Desktop evidence); the spec validator; a small reference
  writer for a few visuals. Findings 001 and 002 are already this kind of contribution.
- **Stays private** (it is the product): the full PBIR writer with every measured size, the layout solver and the
  presets, the field picker, the Gulf calendar pack and the Arabic handling, the health check's fix scripts, the MCP
  and its packaging, the golden tasks.
- **Before opening anything:** the owner's employer rules and the MVP programme's rules are confirmed, never
  assumed (ROADMAP); a licence is chosen with a lawyer; nothing measured on an employer's model is in it (it is
  not: every measurement is on made-up models).

## Decisions for the owner
1. Is the v1 cut the right one, or should the matrix or the filters come before the grid?
2. May the spec's name and schema be public from the start (even while the writer stays private)?
3. Who are the first two outside users of the spec (a designer, a developer)? Their first requests should decide
   what is "experimental".
