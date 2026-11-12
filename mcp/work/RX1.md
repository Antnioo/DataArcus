# RX1 (0.3.3): alt text, bookmarks and their order: what the report writer has, what a strong report carries, and the top of the list built

## Summary
- **Approval:** the reviewer hub's brief "RX1" (12 Nov); the owner D-1112-04 ("one for introducing alt text and
  bookmarks and order for bookmarks and other features that get a powerbi report to next level"); D-1109-07, D-1104-12, D-1027-03.
- **Base:** `feat/0.3.3-rx1` from `origin/integration/0.3.3` at 624357f0. Only this branch is pushed; no merge, no PR.
- **Scope:** `assets/js/pbip-export.js` (the views' bookmark files, their order first), `assets/js/report-rules.js`
  (two bookmark rules), `assets/js/layout-check.js` (the rules' input), `mcp/lib/report-inputs.mjs`,
  `mcp/lib/plan-disclosure.mjs`, `mcp/lib/report-run.mjs`, the approval page's words, `mcp/TOOLS.md`,
  `mcp/PRIVACY.md`, `mcp/CHANGELOG.md`, `mcp/tests.json`, one new suite `mcp/test-0.3.3-rx1.mjs`, `mcp/WORK.md`, this note.
- **Expected checks:** the new suite red on 624357f0 first, then green (its count is read from the run);
  `npm test -- report`, `-- checker`, `-- twin` pass; a11y stays 121 checks (run on the base: PASS a11y 121 checks);
  tools/list stays under 61,000 (60,513 on the base, measured with `listTools`; the new option must cost under 487);
  Microsoft's validator 0 errors on every written report; lint exit 0; CI on three systems.
- **Resume:** the state is the last line of this note; the plan is "Plan" below.

## Measured first (on 624357f0, 2026-11-12T14:09Z; a report written through the real server from `mcp/fixtures/health-project`, layout exec)
What create_report / plan_layout / check_report do today. The numbers are from that written report (40 visuals, 4 pages).
| | Today | Source |
|---|---|---|
| (a) alt text | **Written since 0.3 (J7).** 23 of 40 visuals carry alt text: every chart, table, card with a field, slicer, button and the header's text. The 17 without: 5 groups, 2 shapes and 3 text boxes and 7 panel cards with no field (decorative, taken out of the tab order). Alt text is the visual's full title from its fields ("Total by Note"), never a value, cut at 250 (`ALT_MAX`, `assets/js/report-a11y.js`); a visual that has alt text keeps it (`apply` fills only the empty ones). check_report's rule `A11Y_ALT_TEXT` reports a data visual or a text box with text that has none. Suite: `mcp/test-0.3-a11y.mjs`, 121 checks. | the probe; report-a11y.js; pbip-visuals.js |
| (b) bookmarks | **Only helpers.** 1 bookmark in the default report (Reset filters, one per page with slicers), 3 with `slidePanel` (Filters open, Filters closed, Reset), 2 per flip card. No bookmark for a view of the plan, no order the plan gives, no check of a bookmark's targets. check_report counts bookmarks (`summary.report.bookmarks`) and names a broken field inside one; Microsoft's validator names a button whose bookmark is missing (`PBIR_BOOKMARK_ACTION_TARGET_MISSING`). | pbip-export.js `bookmarkFiles`; pbip-navigation.js; flip-cards.mjs |
| (c) tab order | **Written since 0.3 (J7).** 28 of 40 visuals are Tab stops, in reading order per page and per group (right to left in an Arabic report); decorative parts are out of it. check_report: `A11Y_TAB_ORDER`, `A11Y_DECORATIVE`. | report-a11y.js `apply`, `readingOrder` |
| (d) page navigation | **Written.** Page buttons in the header on every page (2 per page here), the current page marked; check_report: `PAGE_BUTTON_WRAP`, `PAGE_LINK_MISSING`. Power BI's own page navigator visual is not used (measured 3 Oct: it has no order setting). | pbip-navigation.js; report-rules.js |
| (e) tooltip pages | **Written.** 2 tooltip pages here (one for categories, one for the time axis), bound to the charts; check_report: `TOOLTIP_TYPE`, `TOOLTIP_SCROLL`. | pbip-tooltip.js |
| (f) drill-through | **Not written.** No drill-through page, no Back button. | grep "drillthrough" in assets/js: none in the writer |
| (g) titles that state the finding | **Partly.** Story titles from the fields ("Note ranked by Total", top N, time words) since 0.3 (J4); the plan's own sentence goes in the text box (`text`) and under titles (`subtitles`); a title never states a value (the tools never read data). | story-titles.js; report-inputs.js |
| (h) other | Phone layout for every page, a "No data" message, the theme, right-to-left mirror, status icons by shape: written. Not written: bookmark views, a bookmark navigator, drill-through, visual-level show or hide views, sync slicers across pages, report-level "Personalize visuals". | the probe's file list |

So the brief's item 1 (alt text) and item 3's tab order were built in 0.3 and are tested; they are **not built again**
(D-1104-12: a job done twice lives once). The gap is item 2: bookmarks for the plan's views, their order, and their check.

## Research (Microsoft Learn, read 2026-11-12 through the Microsoft Learn MCP; never the "MCP Engine for Power BI" connector)
- Alt text: "The Alt Text textbox has a limit of 250 characters"; a screen reader "reads out the title, visual type, and
  any alt text"; "calling out an insight or specific data points might not be the best thing to put in static alt text
  because data in Power BI is dynamic"; text boxes: "put text contents in the alt text box"; decorative shapes and images
  "hidden in the tab order". https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-accessibility-creating-reports
- Tab order: set in the Selection pane, "in an order that matches the way users visually process the report visuals". Same page.
- Bookmarks: a bookmark saves the current page, filters, slicers, selection, sort, drill, visibility, spotlight; its
  options are Data, Display, Current page, All visuals or Selected visuals; "you likely want to turn off data properties,
  so that filters aren't reset when users switch views"; "The order of your bookmarks can be important when you use the
  View feature" (the slide show). https://learn.microsoft.com/power-bi/create-reports/desktop-bookmarks
- The slide show: View in the Bookmarks pane steps through the bookmarks in their order, the name in a title bar.
  https://learn.microsoft.com/power-bi/explore-reports/end-user-bookmarks#bookmarks-as-a-slideshow
- Bookmark navigator: "The ordering of the buttons matches the order of your report bookmarks"; a group limits it.
  https://learn.microsoft.com/power-bi/create-reports/button-navigators
- PBIR: `definition/bookmarks/<name>.bookmark.json` ("target visuals and filters") and `bookmarks.json` ("bookmark
  order and groups"); "Some report metadata files, such as visual.json or bookmarks.json, can be saved with data values";
  a copied bookmark loses the visuals its page does not have on save; annotations on `report` are ignored by Desktop
  and kept for outside tools. https://learn.microsoft.com/power-bi/developer/projects/projects-report#pbir-format
- The checklist asks: "Are you using bookmarks for navigation? Try navigating your report with a keyboard".

## Ranked (what a user gains per day of work; "files alone" = DataArcus can write it without Desktop and test it)
| # | Candidate | Gain | Days | Files alone, safe, testable? |
|---|---|---|---|---|
| 1 | Bookmarks for the plan's views, in the plan's order (the slide show, a bookmark navigator later) | high: a presenter's story in order, the brief's item 2 | 1 | yes: display-only bookmarks (`suppressData`: no filter, no slicer state, so no data value can be stored), the shape the writer's own bookmarks already use and Desktop opened |
| 2 | check_report: a bookmark whose page or visual is gone, bookmarks out of the plan's order | high: a hand-edited report breaks these silently | 0.5 | yes: ids only, no text of the report |
| 3 | A view that hides or shows visuals (chart or table) | high | 1.5 | yes in shape (the flip cards' lab), but each role's panel, phone layout and "No data" card must move together: next job |
| 4 | A bookmark navigator visual for the views | medium | 1 | no: its drawn size and RTL order must be measured in Desktop first |
| 5 | Drill-through page with Back | medium | 2 | partly: the binding is in the schema; what Desktop shows needs the laptop |
| 6 | Alt text as a sentence of its own instead of the title | low: the owner decided 19 Oct that alt text is the full title | 0.5 | yes, but it reverses his decision: asked below, not built |
| 7 | Tab order, page navigation, tooltip pages | none: already written and checked | 0 | done |

## Plan
1. This note, pushed. 2. `mcp/test-0.3.3-rx1.mjs`, red on the base through the real server: plan_layout with
`bookmarks` (a list of { name, page }), the approval summary names them, create_report writes one
`<id>.bookmark.json` each and `bookmarks.json` with the views first in the plan's order; each bookmark display-only
with the current page, no data state; the validator 0 errors; the Arabic report; refusals through the registered schema
(a page the plan does not have, a mixed Arabic and English name, more than 8); a plan with other bookmarks is another plan
(the pin); check_report's two rules on a report broken by hand (a bookmark whose page is gone, whose visual is gone, a
`bookmarks.json` entry without a file, the order changed), found by the text around them, in numbers only.
3. The writer, the option (route c, all five steps), the rules (route a). 4. TOOLS.md, PRIVACY.md, CHANGELOG, MODULES
if a module is added, tests.json. 5. Area runs, the capped-answer suites 3 times, lint, merge integration once, CI.
- Alt text and tab order: no code; one new check in the suite that a written view report still has alt text on every
  data visual (the a11y suite's own count stays 121).
- State at 2026-11-12T14:09Z: plan written, no code yet.
