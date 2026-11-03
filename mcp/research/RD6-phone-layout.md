# RD6: a phone layout for an existing report (3 Nov 2026)

Research, cloud session; branch `rd/0.3.2-phone-layout` from `origin/integration/0.3.2`. No product file changes:
this note and scratch scripts under `mcp/research/rd6/` only. Made-up reports in `os.tmpdir()` only.

## Summary
- **Approval:** the owner's D-1103-12 (3 Nov, "10 r&ds during the night"); the brief: SCOUT-0.3.2.md "RD6" on
  `rd/0.3.2-scout`.
- **The question:** can a redesign patch add `mobile.json` to every page that has none (right to left on an Arabic
  page), placed by the writer's own phone rules, with nothing else changed?
- **Scope:** read the code (a), Microsoft's docs (b), 2-3 ways with size and risk (c), a measured prototype (d), the
  recommendation (e), the Desktop checks (f), a builder brief (g).
- **The rule kept everywhere:** a page that has a phone layout (any visual on it with a `mobile.json`) is never
  touched: not completed, not moved, not resized. Tooltip pages and hidden pages are skipped too (no phone view).
- **Base:** `origin/integration/0.3.2` at the branch point. **Resume point:** see "State" at the end.

## Plan and expected numbers (written before the work)
1. Read: `pbip-page.js` (mob, the phone placement, mobile.json), `layout-check.js`, `report-rules.js` PHONE_OVERLAP,
   `twin-pages.mjs` fitPhoneTabs, `read-report.mjs` (mobile read), `redesign.mjs` ALLOW / buildCopy / verifyCopy.
2. Microsoft Learn: "Create mobile-optimized reports" (auto-create, what it leaves off, the canvas) and the PBIR
   mobile.json schema (visualContainerMobileState).
3. Prototype (`mcp/research/rd6/phone.mjs`): the writer's placement rules (323 wide, cards two a row 157.5 x 100,
   everything else full width with the writer's heights, 8 gap, reading order) lifted onto an existing report's
   visuals by their type; groups wrap their children with page positions; right to left mirrors x.
4. Measure on made-up reports: the 25 twin-fuzz seeds (20261102..20261126, the lab's generator) and the two fixture
   reports, plus reports the writer itself writes with their mobile.json removed (the prototype's layout compared with
   the writer's own). Per page: laid out or skipped (why), visuals placed vs left off (why), PHONE_OVERLAP findings,
   phone page height, time.
5. The copy check: the prototype's files through `buildCopy` + `verifyCopy` as they are today (expected: refused,
   "file(s) not in the original"), and with a patch-kind registry entry for `mobile.json` (expected: passes,
   every other file byte-identical).

Expected (guesses, to be checked): PHONE_OVERLAP 0 on every laid-out page (the placement is a column, nothing can
overlap except a group's box over its children, which the rule skips); 60-80% of visuals placed on the fuzz seeds
(shapes, images, hidden visuals, tooltip pages left off); phone pages 1,000-4,000 high; under 50 ms a report; on
writer reports the positions equal the writer's own for every non-group visual (same rules, same order).

## a) Today's code
- **The writer lays out every page it writes** (`assets/js/pbip-page.js:1082-1130`): 323 wide (`report-rules.js:90`
  PHONE_W), cards two a row 157.5 x 100, everything else full width at a height by kind (title 56, tabs 44, slicer 64,
  button 40, text 120, table 270, gauge 180, donut/map/treemap 220, other charts 190), an 8 gap, in the order header,
  filters, cards, the rest (`:1117`); page tabs in rows each as wide as its name at 10pt (`pbip-sizing.js:275`
  phoneTabWidth), the line under the current tab under it (`:1121`); groups wrap their children, whose mobile.json
  positions are page positions (`:1123-1130`, measured); then text sizes per type with the selectors measured in
  Desktop 2.158 (`:1132-1190` phoneLook). It reads the writer's own kinds (`mob`, `:345-371`): band, panel, nodata and
  logo are `noPhone`. `o.phoneLayout === false` writes none (`:1274-1277`).
- **The twin mirrors a phone layout only where one exists** (`mcp/lib/twin-pages.mjs:366` fitPhoneTabs and the mirror
  of each mobile.json): measured below, the Arabic twin of a report with no phone layout has none either (45 of 45
  twin pages of the fuzz seeds had no mobile.json).
- **The read** (`read-report.mjs:397`, `layout-check.js:226`) keeps each visual's mobile.json beside its visual.json;
  PHONE_OVERLAP (`report-rules.js:265-286`) checks boxes inside 323 and no two boxes over each other, a group's box
  and a flip card's stacked images excepted. Nothing else checks a phone layout.
- **Redesign** (`mcp/lib/redesign.mjs`): ALLOW (`:121-126`) names the JSON pointers a copy may change by file kind
  (`kindOf` `:127`: visual, platform, theme, report); `verifyCopy` (`:471`) refuses any file the original lacks unless
  it is an added theme under `StaticResources/RegisteredResources/` (`:478-479`). A mobile.json is neither: **today
  every added mobile.json is refused** (measured: "N file(s) not in the original" on 62 of 63 reports; the 63rd had
  no page to lay out, so nothing to add). SCHEMAS already knows `visualContainerMobileState` 2.x (`:92`).
- So the gap is real and narrow: the placement exists and is measured in Desktop; what is missing is (1) the kinds
  read from an existing report instead of the writer's plan, (2) a way for the copy check to accept an added file.

## b) Microsoft's docs (Microsoft Learn, read 3 Nov through its search)
- "Create mobile-optimized Power BI reports": a page's phone layout shows in the mobile apps in portrait; a page
  without one shows the desktop page small, in landscape. Browsers always show the desktop page.
- "Mobile layout view", Automatic mobile layout creation (GA April 2025): it replaces any existing layout on the page;
  it "places both visible and hidden visuals, so if you have bookmarks that change a visual's visibility, they work";
  it "reads the report horizontally from left to right, starting from the top" (a left navigation rail does badly);
  "can't handle background images"; "too much overlaying is a challenge"; with many images "not all of them might fit".
- "Best practices": 323 pt is the canvas width; sizes XL 323 x 270, L 323 x 180, M 323 x 100, S 158 x 100; side by
  side only for cards, KPIs, buttons; 6-8 pt between visuals; fonts not under 9 pt; flow top to bottom, most
  important first; leave less important visuals off.
- "Power BI Desktop project report folder": `mobile.json` is optional per visual (schema `visualContainerMobileState`).
- Side by side with ours on an **Arabic page**: Microsoft's engine reads left to right, so a mirrored page comes out in
  reverse (the last Arabic card first, placed on the left half); ours reads from the right and puts the first card on
  the right half, as the writer's Arabic reports do (identical boxes below). Microsoft places hidden visuals and every
  image; ours stacks a hidden visual on the box of the shown visual it shares its page box with (a bookmark swap) and
  leaves unlinked images, shapes, empty text boxes, backdrops and overlays off, each listed with why. Microsoft's
  replaces a layout; ours never touches a page that has one. Not measured: Microsoft's own output (needs Desktop: f).

## c) The ways, with size and risk
| Way | What | Size | Risk |
|---|---|---|---|
| 1. A redesign option `phone` (recommended) | `plan_layout` with `redesignFrom` and `phone: true` (default off; with `keepPositions` for "phone only"): the plan lists per page laid out / skipped with why, per visual placed / left off with why; `create_report` writes the copy. A patch kind `phone` in a patch-kind registry (Decision 3) | M: `lib/phone-layout.mjs` (~150 lines, the prototype's rules), the registry (~60 lines changed in `redesign.mjs`), 1 option in `report-inputs.mjs` + `redesignOnly`, one suite | Low-medium: the original is only read; the copy check proves every original file byte-identical; the placement rules are the writer's, measured |
| 2. A twin step | `create_arabic_twin` adds a phone layout to the Arabic pages when the original has none | M, and a second writer of mobile.json beside the mirror | Medium: the twin's contract is "mirror what is there"; adding is a different promise, and the English pages would still have none |
| 3. Part of the native copy | `customVisualsFrom` also lays out the phone | S on top of 1 | Wrong place: a person asking for native visuals has not asked for a phone layout (owner's rule 1) |

**The patch-kind registry (Decision 3).** Today ALLOW is one literal keyed by file kind and `verifyCopy` hard-codes the
one added file it accepts. Proposed shape, so RD4 (skins), RD6 (phone) and RD8 (a page) add an entry, not an edit of
the check:
```
PATCH_KINDS = [
  { id: 'place',  file: VISUAL_JSON, pointers: [/^\/position\/(x|y|width|height)$/] },
  { id: 'title',  file: VISUAL_JSON, pointers: [TITLE_POINTER] },
  { id: 'text',   file: VISUAL_JSON, pointers: [TEXT_POINTER], removes: true },
  { id: 'theme',  file: THEME, pointers: [TOKENS, THEME_STYLE_AT], adds: THEME_FILE },
  { id: 'phone',  adds: /^definition\/pages\/[^/]+\/visuals\/[^/]+\/mobile\.json$/,
                  addCheck: (src, rel, j) => visual.json beside it in src; no mobile.json on its page in src;
                                             keys $schema + position (x, y, z, width, height, tabOrder); inside 323 }
]
```
`verifyCopy` then accepts an added file only when one entry's `adds` matches and its `addCheck` passes, and a changed
pointer only when an entry names it; danglingOf and opaqueOf need no change (a mobile.json with a position only holds
no reference and no opaque payload). Prototyped in `measure.mjs` (the registry run): 63 of 63 reports pass, every
original file byte-identical.

## d) The prototype, measured (`mcp/research/rd6/phone.mjs`, `measure.mjs`; 3 Nov, integration/0.3.2 at e3f0123)
Inputs, all made up, in `os.tmpdir()`: **W** the writer's own 8 reports from the SP7 suite's runs (EN and AR, glass and
plain, 1920 and 1280, the tiny model and the fixtures) with their mobile.json removed; **F** the two fixture reports;
**S** the 25 twin-fuzz seeds (English as generated) and **their Arabic twins** written by create_arabic_twin's real
flow; **B** three seeds with 7 hidden tables sharing a chart's box (bookmark swaps). Run:
`node test-0.3.2-sp7.mjs; node research/rd6/measure.mjs <tmp>/dataarcus-sp7-* [--hidden own]`.

| Set | Reports | Pages laid out / skipped (why) | Visuals placed / left off | PHONE_OVERLAP | Phone page height (min / median / max) | Time a report (median / max) |
|---|---|---|---|---|---|---|
| W writer, EN+AR | 8 | 15 / 16 tooltip pages | 157 / 82 (31 backdrops, 22 empty text boxes, 15 overlays, 14 shapes) | 0 | 334 / 1154 / 1514 | 6.3 / 11.7 ms |
| F fixtures | 2 | 1 / 2 have a phone layout (never touched), 2 tooltip | 5 / 0 | 0 | 782 | 0.8 ms |
| S-EN fuzz | 25 | 45 / 3 tooltip | 425 / 159 (79 overlays, 39 shapes, 37 unlinked images, 4 backdrops); 25 groups with nothing placed | 0 | 190 / 1806 / 3640 | 0.7 / 3.8 ms |
| S-AR twins | 25 | 45 (45 right to left) / 3 tooltip | 424 / 160 | 0 | 190 / 1806 / 3640 | 0.9 / 4.0 ms |
| B bookmarks, `stack` | 3 | 6 / 2 tooltip | 47, 6 hidden stacked on their pair, 1 in its own place (its pair was an overlay) | **6** (each stacked pair) | 270 / 1410 / 2942 | 0.7 ms |
| B bookmarks, `own` | 3 | 6 / 2 | 47, every hidden in its own place | 0 | 270 / 1794 / 3220 | 0.7 ms |

- **Against the writer** (W): of the writer's 171 phone boxes (groups aside), **157 are identical** (x, y, width,
  height within 0.5), EN and AR alike; the 14 others are the 2-high lines under the current page tab (a shape: left
  off by the prototype), 0 placed that the writer left off. So on the writer's own reports the prototype is the
  writer's rule, Arabic included (the first card on the right half, tabs from the right).
- **The never-touched rule** held: the twin fixture's Overview (one visual with a mobile.json, the others without)
  was skipped whole, not completed; its Details page was laid out.
- **The Arabic gap, measured:** every Arabic twin of a report with no phone layout has none (45 of 45 pages); the
  prototype lays them out right to left from the page's own Arabic titles and texts (45 of 45 detected).
- **Bookmarks:** stacking a hidden visual on its pair keeps a swap in place on the phone (Microsoft's documented
  intent) but PHONE_OVERLAP reports each pair (6 of 6): the rule excepts flip-card images only. Placing it on its own
  leaves an empty slot when hidden (to be seen in Desktop, f). Decision: stack, and extend PHONE_OVERLAP's exception
  to "one of the two hidden, the same page box", after the Desktop check.
- **The copy check:** as it is today, 62 of 63 refused ("N file(s) not in the original"); with the `phone` registry
  entry, 63 of 63 pass, every original file byte-identical.
- Seen: the fuzz seeds' 79 overlays are the generator's random stacking; on real reports an overlay is mostly a "no
  data" card or a label over a picture. Phone pages reach 3,640 high on 25-visual pages (Microsoft: "leave less
  important visuals off"): the plan should say the height.
- Not in the prototype: text sizes (the writer's phoneLook); the page background; a list slicer's real height
  (64 under 90 high on the page, 180 above); custom visuals take 190 full width.

## e) The recommendation
Way 1: a redesign option `phone` (default off), built on a patch-kind registry, with the writer's phone rules lifted
into one shared module the writer and the redesign both call (one rule, not two copies: `assets/js/phone-layout.js`,
the writer's `place` and group wrap moved there as they are, proven by the SP7/SP13 suites staying byte for byte).
Positions only in the first step; text sizes (phoneLook) a second step after Desktop shows how an existing report's
own sizes look on the phone. A page with any mobile.json is never touched; tooltip pages skipped; everything left off
is listed with why before the go.

## f) The Desktop checks (one batched laptop run, Desktop 2.159)
1. One made-up report's copy with `phone`, EN: open the phone layout of each page; no visual cut at the right edge,
   order header, filters, cards, the rest; screenshot each page.
2. The same report's Arabic twin, then `phone` on the twin: the first card on the right, the tabs from the right, the
   title whole; compare with Desktop's own Auto-create on the same page (its order, left to right).
3. A grouped visual: its children where the plan says (page positions), the group's box around them; move the group
   in Desktop's phone view and save: does Desktop keep our positions?
4. A bookmark that hides a chart and shows a table on the same box: both stacked on one phone box; switch the
   bookmark in the phone view: the table takes the chart's place. And the `own` variant: is an empty slot left?
5. A page with a background image: does the phone show it (Microsoft: auto-create "can't handle" them)?
6. A page that already has a phone layout: unchanged byte for byte in the copy, and in Desktop.
Each ends with "Seen, not in scope".

## g) The builder brief (size M, risk low-medium)
- **Base:** `integration/0.3.2` (or the next); branch `feature/<ver>-phone`; plan and expected numbers first.
- **Step 1, the registry (tests first):** `PATCH_KINDS` in `redesign.mjs` (shape above); ALLOW and the added theme
  become entries; `verifyCopy` reads them. Red first: a copy adding a mobile.json is refused today; after: accepted
  only on a page with none, beside a visual.json, $schema and position only, inside 323; every existing redesign
  suite unchanged (SP19's recorded redesigns byte for byte).
- **Step 2, one phone rule:** `assets/js/phone-layout.js` from `pbip-page.js:1082-1130` (place, tabs, group wrap) as
  it is; the writer calls it with its kinds; SP7/SP13 stay byte for byte. Then `kindsOf(inventory)` for an existing
  report (the prototype's `kindOf`, backdrop and overlay rules, Arabic detection, hidden pairs stacked).
- **Step 3, the option:** `phone: true` in `report-inputs.mjs` and `redesignOnly`; the plan's `redesign.phone`: per
  page laid out or skipped (why) and height, per visual placed or left off (why), the stacked pairs; computed from the
  copy's positions after the grid (or with keepPositions); create_report writes it through the same gate.
- **Step 4, the check:** PHONE_OVERLAP excepts a hidden visual stacked on the shown one with the same page box (after
  Desktop check 4).
- **Tests:** the 25 fuzz seeds and their twins (0 PHONE_OVERLAP besides stacked pairs, every original file
  byte-identical, Arabic pages right to left); the writer's 8 SP7 reports with mobile.json removed give the writer's
  boxes (157 of 171, the tab lines aside); a page with a partial phone layout untouched; a tooltip page skipped.
- **Not in it:** text sizes on the phone, Microsoft's Auto-create, a twin step.

## Decisions I made
1. A page "has a phone layout" when any visual on it has a mobile.json: a partial layout is never completed.
2. Hidden pages are laid out (buttons and drillthrough reach them on the phone); tooltip pages are not.
3. Left off, each with why: shapes, unlinked images, empty text boxes, visuals with no field, a card holding other
   visuals (backdrop), a visual nine tenths inside another (overlay). Linked images count as buttons.
4. The order is the writer's (header, filters, cards, the rest), not Microsoft's left-to-right reading: a left
   filter rail goes to the top, as on the writer's reports.
5. A group's children stay together at the place of its first child; nested groups count as their children.
6. An Arabic page: its name, or more than half of its titles and texts, in Arabic.
7. Bookmark pairs stacked (`stack`), PHONE_OVERLAP's exception left to the builder after Desktop check 4.

## Seen, not in scope
- PHONE_OVERLAP does not except a group's box over a non-child when the group's children are not consecutive on the
  phone (the writer's never are; an existing report's could be): the prototype keeps children together.
- The SP7 suite leaves its working folder in the temp folder (`test-0.3.2-sp7.mjs` has no rmSync); the fuzz suite
  removes its own.

## State
Done: a-g measured and written; scripts in `mcp/research/rd6/` (`fuzz-gen.mjs` is lines 44-144 of
`test-0.3.1-twin-fuzz.mjs`, extracted with sed, plus its imports). Next: the owner's decision on way 1 and the
registry; then the laptop's checks f1-f6 in the next batched run.
