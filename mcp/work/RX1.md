# RX1 (0.3.3): alt text, bookmarks and their order: what the report writer has, what a strong report carries, and the top of the list built

## Summary
- **Approval:** the reviewer hub's brief "RX1" (12 Nov); the owner D-1112-04 ("one for introducing alt text and
  bookmarks and order for bookmarks and other features that get a powerbi report to next level"); D-1109-07, D-1104-12, D-1027-03.
- **Base:** `feat/0.3.3-rx1` from `origin/integration/0.3.3` at 624357f0. Only this branch is pushed; no merge, no PR.
- **Scope:** `assets/js/pbip-export.js` (the views' bookmark files, first in the list), `assets/js/report-rules.js`
  (two rules, `when`), `assets/js/layout-check.js` (the rules' input), `mcp/lib/report-inputs.mjs`, `report-build.mjs`,
  `report-result.mjs`, `check-report.mjs`, `plan-artifact.mjs`, `artifact.mjs`, `approval-disclosure.mjs`,
  `mcp/tools/plan_layout.mjs`, `mcp/TOOLS.md`, `PRIVACY.md`, `CHANGELOG.md`, `tests.json`, `WORK.md`, the new suite
  `mcp/test-0.3.3-rx1.mjs`, `mcp/fixtures/rx1-pins.mjs`; on purpose: tl1 and its fixture, sn1, fn1e, sp41. No new module.
- **Expected checks:** rx1 red on 624357f0 first (12 of 22 failed), then green: 49 checks; a11y 121 unchanged; tools/list
  60,930 of 61,000; Microsoft's validator 0 errors on every written report; lint exit 0; CI on three systems.
- **Gap (R-82):** no bookmark file saved by Desktop is in the repo and this session has no Desktop, so a view's shape is
  the writer's own Reset bookmark's (opened and saved again by Desktop 2.158, DESKTOP-TESTS.md M5) without its targets,
  with Data and Display both off. The schema and the validator accept it; Desktop has not opened it. See "For the laptop".
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
(a page the plan does not have, the same name twice, more than 8); a plan with other bookmarks is another plan
(the pin); check_report's two rules on a report broken by hand (a bookmark whose page is gone, whose visual is gone, a
`bookmarks.json` entry without a file, the order changed), found by the text around them, in numbers only.
3. The writer, the option (route c, all five steps), the rules (route a). 4. TOOLS.md, PRIVACY.md, CHANGELOG, MODULES
if a module is added, tests.json. 5. Area runs, the capped-answer suites 3 times, lint, merge integration once, CI.
- Alt text and tab order: no code; one new check in the suite that a written view report still has alt text on every
  data visual (the a11y suite's own count stays 121).
- State at 2026-11-12T14:36Z: built, the suites named below green locally; CI is the next line.

## Before -> after
- **Bookmarks for the plan's views (new).** Before: `plan_layout` refused `bookmarks` ("Unrecognized key"); a report had
  only helper bookmarks (Reset, Filters open and closed, flip cards). After: `plan_layout` takes
  `bookmarks: [{ name, page }]` (1 to 8; page 1 = the first; schema-checked), shows them in the plan's look, and the
  approval window lists each with its page's name before the click. `create_report` (path and planId only, as before)
  writes one `<id>.bookmark.json` a view: `options { suppressData: true, suppressDisplay: true }`, its page as
  `activeSection`, `sections: { <page>: { visualContainers: {} } }`; no filter, no slicer, no visual state, so no data
  value can be in it. The views are first in `bookmarks.json` in the plan's order, the writer's own bookmarks after
  them; `report.json` gets the annotation `DataArcusBookmarkOrder` (the views' ids in order). Works with a design and
  with hand-placed pages, English and Arabic (an Arabic name is written as given; the writer's bidi isolation applies).
  Refused with its reason, no plan made: a page the plan does not have, the same name twice, `languages: "en+ar"`, a
  redesign, the sample (and a native copy: in the code, not in the suite). A report planned without `bookmarks` is byte for byte what it was (sp7, sp13,
  sp43, sp3, sp4, fn1j pass unchanged).
- **check_report (new rules, group navigation).** `BOOKMARK_TARGET_MISSING` (warning): a bookmark names a page the report
  does not have, or visuals its page no longer has, or `bookmarks.json` lists a bookmark without a file; counted, the
  bookmark's file named, never its name or the ids. `BOOKMARK_ORDER` (note): the views DataArcus wrote are listed in
  another order than the recorded one (a removed view is no finding). Each runs only on a report it can judge (`when`:
  a report with a bookmark; a report with the record), so `rulesRun` of a report without bookmarks is unchanged.
- **Alt text, tab order (not built again).** Measured above: written and checked since 0.3. rx1 W14 checks that a
  report with views still has alt text of at most 250 characters on every Tab stop that shows data.
- **Numbers (each read from its run).** `node test-0.3.3-rx1.mjs`: FAIL 12 of 22 on 624357f0 (the option refused), FAIL 6
  of 46 with the old `report-rules.js` (W12, C1, C4, C5, C6, C9), PASS 49 now. tools/list 60,513 -> 60,930
  (`listTools`, JSON length; the option adds 417). fn1e 591 -> 592 checks, sp41 25 -> 26 (one tally check each).
  a11y 121, tl1 51, sn1 20, claims 752, tk1 15: PASS. Lint exit 0; check-min, result-lines, agent-memory, modules,
  contracts, changelog-words, site-config PASS.

## CHANGELOG line
Two lines under [Unreleased] in `mcp/CHANGELOG.md`: "New, only when asked: `plan_layout` takes `bookmarks` ..." and
"`check_report` has two new rules for any report ...".

## Safe to ship alone (for the 0.3.3 cut)
- The two check_report rules: yes. They read ids only, need no Desktop behaviour, and change no existing answer except
  `rulesRun` on a report that has bookmarks.
- The `bookmarks` option: off unless asked, and a report without it is unchanged. What Desktop does with a view (the
  gap above) is not measured. My advice: ship the option only after the laptop check below; until then the branch can
  wait for 0.3.4, or the reviewer can merge it with the CHANGELOG line as written ("not yet tried in Power BI Desktop").

## Decisions I made
- Alt text and tab order were not rebuilt: they exist, tested (121 checks). The owner's decision of 19 Oct (alt text is the
  visual's full title) stays; changing it is asked below.
- A view opens its page and nothing else (Data off, Display off). Display on with an empty state could show the hidden
  filter panel or a flip card's back; that needs Desktop to measure, so it is not written.
- No show or hide of visuals in a view yet: each role has a panel, a "No data" card and a phone layout that must move
  together (ranked 3, the next job).
- The plan's order is recorded in `report.json` as an annotation (Microsoft Learn: Desktop ignores annotations and
  keeps them for outside tools), so check_report can judge the order from the files alone.
- A bookmark name is not refused for mixing Arabic and English: D-1027-03 is about titles DataArcus composes; the name is
  the person's own text, written as given (isolated in an Arabic build like every other text).
- A bad view stops the plan with its reason. `plan-artifact.mjs` swallowed every build error and still proposed a plan;
  an error the writer marks `viewsProblem` is now passed on (the other errors as before).
- The plan's own check leaves the two bookmark rules out (`artifact.mjs`): they judge a report changed after it was
  written, and this keeps every plan and write pin as recorded (rx1 W12 checks the written report instead).
- The pinned check_report answers (fn1e, sp41) are compared without the two rule ids, by `fixtures/rx1-pins.mjs`, the
  way OX2's `fixtures/ox2-pins.mjs` does it; nothing was recorded again. sp20 needed nothing (its reports have no bookmark).
- The approval page's row uses the heading "Bookmarks" (its Arabic «الإشارات المرجعية» is already approved) and, as
  values, only the person's names and the plan's page names: no new English or Arabic wording on the page.
- check_report reads `bookmarks.json` itself, quietly (`check-report.mjs`), not through the shared inventory: the first CI
  run (43239014057 on cbf07526) failed sp42 and fn1g on Linux and Windows because the inventory had gained a key; the
  inventory is as it was again, and both pass (sp42 22, fn1g 222). I had not run those two locally before that run.
- The option's description is 151 characters on purpose: tools/list is at 60,930 of 61,000.

## Changes to other tests, on purpose (R-10, one line each)
- `test-0.3.3-tl1.mjs` S4: the left-out `maximum` count 9 -> 10 (the option has one whole number, a view's page);
  `fixtures/tl1-tools-list.json` got that one property (25 added lines, nothing else).
- `test-0.3.3-sn1.mjs` T6: tools/list `<= 60532` -> `<= 60930`.
- `test-0.3.2-fn1e.mjs`, `test-0.3.2-sp41.mjs`: answers compared through `withoutBookmarkRules`, plus one tally check
  each (47 and 10 answers list a bookmark rule).

## For the owner
- Ship the `bookmarks` option in 0.3.3 before you have opened a report with views in Power BI Desktop?
  | class: laptop | risk: two-way
  | rec: no, run the six laptop checks first (about 10 minutes); the two check_report rules can ship now
  | yes: the option ships in 0.3.3 with "not yet tried in Power BI Desktop" in the changelog
  | no: the branch waits for the laptop run, then 0.3.3 or 0.3.4
  | default: no
- Alt text has been the visual's full title since your decision of 19 Oct; Microsoft says a screen reader reads the title
  and then the alt text, so a listener hears the title twice. Change alt text to a sentence of its own ("Total Sales by
  Region, one bar per Region", already in the code for visuals without a title)?
  | class: direction | risk: two-way
  | rec: yes, as a job of its own; the Arabic sentence is shown to you as a draft before it ships (D-1109-07)
  | yes: a small job, about half a day, the a11y suite's expectations change on purpose
  | no: alt text stays the full title
  | default: no

## For the reviewer
- No new Arabic: no Arabic text was drafted or shipped (the approval row reuses an approved heading; an Arabic report's
  bookmark names are the person's own).
- R-82 is not fully met (the gap in the Summary): there is no Desktop-saved bookmark in the repo to copy from.
- tools/list has 70 characters left under the 61,000 cap: the next option needs the cap or a description shortened.
- `mcp/WORK.md` is at 3,199 of its 3,200 characters with my 13.
- `origin/integration/0.3.3` had not moved from 624357f0 when I fetched it before CI, so there was nothing to merge.
- RL33's files: I added two lines at the top of [Unreleased] in `mcp/CHANGELOG.md`, nothing else of theirs.

## Risky changes
- `assets/js/pbip-export.js` `bookmarkFiles`: with views, `bookmarks.json` is written even on a page without slicers,
  and `report.json` is parsed and written again with one more annotation. Without views both are as before (pinned suites).
- `mcp/lib/plan-artifact.mjs`: an error marked `viewsProblem` now leaves `exactArtifact`; every other error is still
  swallowed as before.
- `assets/js/report-rules.js` `check`: a rule with `when` is skipped (not in `ran`) where it does not apply.

## For the laptop
One report from the sample or any model: plan_layout with `bookmarks` of 3 views on 2 pages and `slidePanel: true`.
1. Desktop opens it with no message. 2. View > Bookmarks: the 3 views are first, in the plan's order, the helpers after.
3. Each view's menu shows Data off, Display off, Current page on. 4. "View" in the pane plays them in order; a view
with the filter panel open leaves the panel as it is and changes no slicer. 5. After Ctrl+S: the 3 files are still
there and `report.json` still has `DataArcusBookmarkOrder`. 6. Drag view 2 above view 1, save: check_report says
BOOKMARK_ORDER (a note); delete a slicer a Reset bookmark names, save without updating: BOOKMARK_TARGET_MISSING, or
Desktop has already dropped it from the bookmark (then say which). Also: copy one saved view file into
`mcp/fixtures/` (made-up report) so R-82 has its source.

## Seen, not in scope
- `plan-artifact.mjs` swallows any build error and plan_layout still answers a proposed plan that create_report can never write (seen with a bad view before my change) | route: job | why: a plan is shown and approved, then the write says "holds no checked report"; the cause is never told
- tools/list is at 60,930 of its 61,000 cap | route: job | why: the next option of any builder fails tk1, sn1 and sn4 unless text is cut first
- A view that shows or hides visuals (chart or table), then a bookmark navigator | route: job | why: ranked 3 and 4 above; the navigator's drawn size needs Desktop first
- Views on a report in both languages (`languages: "en+ar"`) | route: backlog | why: refused today; each view needs its Arabic twin and an approved Arabic name
- No Desktop-saved bookmark file is in the repo (the twin fixture's are made by `make-twin-fixture.mjs`) | route: job | why: R-82 cannot be met for any bookmark work until one is saved on the laptop
- Drill-through pages with a Back button are not written | route: backlog | why: ranked 5; what Desktop shows needs the laptop
- `mcp/WORK.md` has 1 character left under its cap | route: fix | size: S | why: the next builder's line fails check-agent-memory

## Lessons for the reviewer
- "Introduce alt text" was already done: a brief that names a feature should first say what the measurement found, or the builder spends the first hour proving it exists.
- A new check_report rule moves every pinned answer through `rulesRun`; a `when` on the rule and a small "without" helper kept that to two suites. Tell builders of route (a) about `fixtures/ox2-pins.mjs` and `rx1-pins.mjs`.
- The plan's exact check counts rules (`ran`), so a new rule moves six plan pins unless it is left out there.
