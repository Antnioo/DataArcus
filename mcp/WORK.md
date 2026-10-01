# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). Last updated 2026-10-02
by the builder: stopped for today with nothing in progress. Main is at `bbc42df`. After the owner's usage limit resets
on Sunday 2026-10-04: (1) the reviewer's split of `pbip-export.js`, (2) the reviewer: the validator on every export in CI,
(3) round 1. See "Next step". **The split's plan is written and waits for the owner's go: "Split plan" below
(branch `plan/split-pbip-export`, plan only, no code changed).**

## Where things stand
- **Now (2026-10-02, main `e8fe171`):** 6 MCP tools (`read_model`, `suggest_fields`, `check_model_health`,
  `generate_theme`, `plan_layout`, `create_report`), 120 checks in `npm test`; 16 website suites; CI runs all of them
  on every push. Merged since 2026-10-01: round 0 (`14dd467`: the tooltip page on every chart, the logo at its own
  shape and the `logo` input, the tooltip bar chart, table headers aligned with their columns, card fill and padding,
  the theme name and `.platform`), `fix/card-theme-radius` (`99d1cee`: Microsoft's validator passes on the MCP's
  exports) and `fix/mcp-visual-style` (`e8fe171`: a solid design shows its panels on the MCP's reports). Each was
  measured and checked in Power BI Desktop 2.158.1177 (`scripts/tests/DESKTOP-TESTS.md`). The lines below are older.
- **Phase 2 (design engine in the MCP): built, merged and checked in Desktop.** `generate_theme` and `plan_layout`
  reproduce the website byte for byte on all 54 design fixtures; `create_report` builds the website's project
  download from a design (60 project fixtures). Details: `mcp/PHASE2-SPEC.md`.
- **Report fixes merged** (buttons' "show" outside the state, tooltip page sizes, logo placeholder, field choice
  for untyped columns, `modelNotes`), and verified in Power BI Desktop 2.157 on "Gulf Sales AR 2": all 8 checks PASS
  (`scripts/tests/DESKTOP-TESTS.md`).

- **Table fix merged** (owner found it on "Gulf Sales AR 2": the Arabic title "جدول التفاصيل" on
  the far right, the table on the far left): tables now set `columnHeaders.columnAdjustment: growToFit` and
  `autoSizeColumnWidth: true` (Microsoft's table reference: always grow to fit; without it columns shrink to their
  content); in right-to-left reports the table's columns are reversed so the category column sits on the right;
  `modelNotes` also tells day names without a sort-by column (days showed Friday, Monday, ...). 3 new MCP checks
  (75), failing before; all 16 website suites pass. `pbip-export.min.js?v=20260930f`, `theme-generator.min.js?v=20260930h`.
  **Checked in Power BI Desktop 2.157 on "Gulf Sales AR 3": all 6 checks PASS** (both tables fill their width, Day
  Name rightmost, the three `modelNotes`, everything else identical to AR 2, KPI values equal DAX;
  `scripts/tests/DESKTOP-TESTS.md`).
- **Cards moved to `cardVisual`** (merged, `e22b346`; the plan and sizes table are in branch commit `6a7ecd3`'s
  WORK.md): KPI cards and the tooltip card use `cardVisual` with role `Data`, value and title sizes fitted to each card
  by `cardFit` in `pbip-export.js`, the number centred, label and inner outline off; phone sizes in `mobile.json`
  (title 10, value 20). The theme is unchanged (it already styles `cardVisual`) and no fixture changed. Microsoft's
  default number format is kept (101.914K; owner's decision, forcing decimals would show counts as 47.00). MCP 77
  checks, all 16 website suites pass. **Desktop 2.157: six reports PASS on items 1-6**; item 7 (phone) FAIL from the
  old phone-position bug (open item); item 8 skipped by the owner (a hand-added card following the theme is Power
  BI's own behaviour). `pbip-export.min.js?v=20260930g`, `theme-generator.min.js?v=20260930i`.
- **Website dropdowns fixed** (merged): the open list was white on white on every tool page; form fields now use
  `color-scheme: dark` with dark option colours (`assets/css/style.css`), checked on every tool page in `tools.mjs`.

## Split plan (waiting for the owner's go)

### Report (2026-10-02, plan only: no code, test or fixture changed)
- **Commit:** the plan is the first commit on `plan/split-pbip-export` (from main `bbc42df`); its hash is in the
  line added by the commit after it, at the end of this report. `docs/work-next-steps` was deleted, locally and on
  GitHub (its content is in main as `bbc42df`, a squash; its old tip was `3287216`).
- **Module map:** a new folder `assets/js/pbip/` with 21 small CommonJS files: `helpers`, `zip`, `sample`,
  `fields`, `sizes` (every Desktop-measured rule with its pointer), `frame`; `visuals/` `card`, `slicer`, `button`,
  `table`, `chart`, `textbox`, `image`; `page/` `shell`, `page`, `header`, `rail`, `panel`, `tooltip`,
  `bookmarks`; `phone`; and `index` (`build`). About 1,000 lines in all, the largest file about 130.
- **Build tool:** a small Node script with no dependencies, `scripts/build-pbip.mjs`. It joins the parts into
  `assets/js/pbip-export.js` (generated, committed, same global `DAPbip`); `terser` makes `pbip-export.min.js` as
  today and the page loads it with `?v=` as today. The MCP requires `assets/js/pbip/index.js` directly and needs
  no new package.
- **Proof:** no existing test pins the writer's bytes (the fixtures hold what goes *into* the writer), so the split
  starts by adding the check: the writer as it is on main, kept as a frozen copy, and the new one build the same
  inputs with the same ids, and every file is compared byte for byte: the 60 project fixtures, the 54 designs with
  their own theme, a set of inputs for the branches the fixtures don't reach, in Node (parts, joined file, minified
  file), in the browser on both generator pages (zip included), and the MCP's reports over stdio by hashes
  recorded on main. The same script writes every file to disk before and after for a folder comparison.
- **Decisions the owner needs to make:**
  1. Go on this plan (the split's branch: `refactor/split-pbip-export`, from main, in a fresh reviewer session).
  2. The build tool: the Node script (proposed) or esbuild.
  3. Add `terser` 5.51.2 as a pinned dev dependency of the website (not of the MCP), so CI can check that the
     committed `.min.js` is the one built from the parts. Proposed: yes. Today it is run with `npx` and is in no
     `package.json`; 5.51.2 reproduces the committed `pbip-export.min.js` byte for byte (checked on 2026-10-02).
  4. After the split merges: keep the byte check in CI as a file of hashes that a later round updates on purpose,
     with its proof (proposed), or remove it with the frozen copy.
  5. No Desktop check for the split, because the files are byte for byte the same (proposed), or one look at one
     report.
- **Seen, not in scope:** (a) `origin/fix/generators` (23 commits ahead of main) and `origin/fix/report-quality` (5
  ahead) still exist and differ from main in `pbip-export.js`; they look like old branches merged as squashes.
  The split must not start until the owner says they are dead (or they are deleted). (b) In `pbip-export.js`:
  `boxH` is defined and never called; two comments still say the tooltip page is 320 x 240 (it is 320 x 284); the
  slicer visual and the Reset button are each written twice, word for word (filter rail and slide-in panel). The
  split moves all of it as it is; cleaning any of it is a later, separate change. (c) The 2.25 x pt Reset icon and
  the 0.45 em button character width are stated in the code's comment but I found no line in `DESKTOP-TESTS.md`
  with those two numbers; the phone canvas's 323 width and slot heights are not there either. `sizes.js` will say
  "no measurement recorded" for them rather than point at a wrong place.

### 1. The map of `assets/js/pbip-export.js` today (675 lines, 56,800 bytes; main `bbc42df`)
One wrapper function, `(function (root) { ... })(typeof self !== 'undefined' ? self : this)`, exporting
`{ build, zip, crc32 }` as `module.exports` in Node and as `DAPbip` in the browser.

| Lines | What | Does | Depends on | Writes |
|---|---|---|---|---|
| 8-23 | `S`, `SCHEMA` | Microsoft's schema addresses (12) | none | `$schema` of every JSON file |
| 26-33 | `lit`, `str`, `bool`, `num`, `color`, `obj`, `resource`, `json` | PBIR literals, a formatting entry with or without a selector, a registered resource, JSON with 2 spaces | none | every formatting value |
| 34-44 | `rnd`, `guid` | a random 20-hex id; a GUID from two of them | `root.crypto` in the browser, `Math.random` in Node | visual, page and bookmark names; `.platform` `logicalId` |
| 45-49 | `mixHex` | mixes two colours | none | pane, button and placeholder colours |
| 52-77 | `CRC`, `crc32`, `zip` | a stored zip | `TextEncoder`, `Date` | the download (`build().zip()`) |
| 80-121 | `T`, `dq`, `ref`, `sampleModel` | the sample table and its 6 measures, English and Arabic | none | `model.bim` |
| 124-129 | `fieldCol`, `fieldMea`, `q`, `proj`, `label` | a bound field as a query projection; its name | none | every visual's `query`, titles |
| 133-148 | `TYPES`, `sampleBind` | slot kind to visual type; the sample's fields per visual | `T` | `visualType` |
| 150-180 | `CHARTS`, `tableFields`, `bindQuery`, `bindTitle` | which kinds are charts; a visual's query (null when a field is missing); "X by Y" | `proj`, `label`, `q` | `query`, chart titles |
| 189-218 | `build`: setup | language, texts, own model or sample, the report's name (`tidy`, `base`, `theirs`, taken names), `slug`, folder names, `PAGES` (an id and a background file name each), `add`, `align`, `edge` | `rnd`, `mixHex`, `sampleBind` | every path |
| 220-238 | `build`: project shell | `.pbip`, `definition.pbir`, `.platform` (report, model), `definition.pbism`, `model.bim` | `guid`, `sampleModel` | those files |
| 240-260 | `build`: resources | the theme under its file name, backgrounds, logo, `version.json`, `report.json` | `obj`, `bool` | `StaticResources/...`, `report.json` |
| 263-273 | `tipName`, `pages.json`, `paneObjects` | page order; the filter pane's colours | `rnd`, `color`, `mixHex` | `pages.json`; part of each `page.json` |
| 280-290 | `SOLID`, `frame`, `textbox` | who draws the panel (read from the theme); a visual's container objects (title, background/border/shadow rule, alt text); a text box's paragraph | `o.theme`, `align`, `font` | `visualContainerObjects`, text boxes |
| 296-333 | `TITLE`, `CALLOUT`, `TIP_VALUE`, `TIP_TITLE`, `cardFit`, `pt`, `charW`, `boxH`, `buttonH`, `iconH`, `slicerH`, `resetFit`, `boxFit`, `LABEL`, `SLICER_TEXT` | every size rule | the theme's text sizes | sizes and positions |
| 339-357 | `DEF`, `cardObjects`, `cardFrame` | the card's own objects and its container padding and spacing, each with the selector Desktop needs | `obj`, `num`, `rtl` | card `visual.json` |
| 361-366 | `def` | a button's formatting card: `show` alone, the look under `default` | none | buttons |
| 369-377 | per page: `page.json` | size, background image, outspace, pane | `paneObjects` | `pages/<id>/page.json` |
| 380-392 | `container`, `origin` | one visual container: name, position (relative to its group), z and tab order, group, hidden; also the list for the phone | `rnd` | the `visuals` and `mob` lists |
| 394-410 | `sorted`, `groupOf`, groups | reading order; the Header, KPI cards and Filters groups and their boxes | `SOLID`, `container` | group containers |
| 413-435 | header layout | the page buttons' box and text size, the Filters button's box | `charW`, `buttonH`, `pt`, `LABEL` | `nav`, `openBtn` |
| 437-471 | filter rail | three dropdown slicers (down a side rail or across a top strip), Reset and its bookmark | `resetFit`, `slicerH`, `iconH`, `charW`, `frame`, `def` | slicers, Reset, a bookmark |
| 472-509 | the other slots | title, logo or its placeholder, text slot, cards, charts, tables | `textbox`, `frame`, `bindQuery`, `bindTitle`, `cardFit`, `cardObjects`, `cardFrame`, `tableFields` | those visuals |
| 510-528 | after the title | the page navigator; the Filters button and its two bookmark names | `frame`, `def` | navigator, Filters button |
| 533-577 | slide-in panel | a hidden group: card, Close, three slicers, Reset; three bookmarks | `resetFit`, `slicerH`, `charW`, `pt`, `frame`, `textbox`, `def` | panel visuals, bookmarks |
| 581 | tooltip link | `visualTooltip` `Canvas` on every chart | `tipName` | added to the charts |
| 585-620 | phone layout | `PW`, `GAP`, `SIZE`, `place`, group boxes; then writes each `visual.json` and `mobile.json` (cards with phone sizes) | `cardFit`, `TIP_*`, `DEF` | `visual.json`, `mobile.json` |
| 624-635 | bookmarks | one file per bookmark (data-only for Reset, display-only for the panel), `bookmarks.json` | `SCHEMA` | `bookmarks/` |
| 640-662 | tooltip page | 320 x 284: a card and a bar chart, or a placeholder text box | `cardFit`, `cardObjects`, `cardFrame`, `frame`, `textbox` | the tooltip page and its visuals |
| 666-670 | the end | `.gitignore` and `README.md` (not next to someone's model); returns `{ base, files, zip }` | `zip` | those files |

Who loads it today: `theme-generator.js` line 452 adds `pbip-export.min.js?v=20261002a` as a script and uses
`window.DAPbip`; `mcp/lib/model.mjs` line 11 and `scripts/tests/pbip.mjs` (four places) `require` the full file;
`capture-design-fixtures.mjs` wraps `window.DAPbip.build` to record what the page hands it.

### 2. The modules (`assets/js/pbip/`, CommonJS, each `'use strict'`)
Sizes are lines including comments. Code is moved as it is written today: same expressions, same order.

| File | Functions | In | Out | Lines |
|---|---|---|---|---|
| `helpers.js` | `SCHEMA`, `lit`, `str`, `bool`, `num`, `color`, `obj`, `resource`, `json`, `rnd`, `guid`, `mixHex`, `DEF` | values | PBIR literals, ids | 55 |
| `zip.js` | `crc32`, `zip` | `[{ path, data }]` | `Uint8Array` | 30 |
| `sample.js` | `T`, `sampleModel`, `sampleBind` | language | the sample table for `model.bim`; its bind | 70 |
| `fields.js` | `fieldCol`, `fieldMea`, `q`, `proj`, `label`, `TYPES`, `CHARTS`, `tableFields`, `bindQuery`, `bindTitle` | a bind, a slot kind | a query or null; a title | 60 |
| `sizes.js` | `pt`, `charW`, `boxH`, `boxFit`, `buttonH`, `iconH`, `slicerH`, `resetFit`, `cardFit`, `themeSizes`, and the named numbers: tooltip (320 x 284, card 296 x 76, chart 296 x 184, 8pt, 40), `TIP_VALUE`, `TIP_TITLE`, phone (`PW` 323, `GAP` 8, `SIZE`, half width 157.5) | numbers, the theme | numbers only, never PBIR JSON | 130 |
| `frame.js` | `isSolid(theme)`, `frame`, `textbox` | the build's context, a title | `visualContainerObjects`; a paragraph | 35 |
| `visuals/card.js` | `cardObjects`, `cardFrame`, `card` | a slot, the query, the page's inset | a `cardVisual` | 50 |
| `visuals/slicer.js` | `slicer` (one copy for rail and panel) | a field or none, its alt text | a dropdown slicer | 15 |
| `visuals/button.js` | `def`, `resetButton`, `filtersButton`, `closeButton`, `pageNavigator` | text, the bookmark, the icon choice, the text size | an `actionButton` or `pageNavigator` | 50 |
| `visuals/table.js` | `table` | the bind, the direction | `columnHeaders`, `columnFormatting` | 20 |
| `visuals/chart.js` | `chart`, `tooltipLink`, `tooltipBarChart` | a slot kind, the query, a title | chart visuals | 35 |
| `visuals/textbox.js` | `titleBox`, `logoPlaceholder`, `textSlot`, `panelCard`, `tooltipPlaceholder` | text, the slot's height | a `textbox` | 35 |
| `visuals/image.js` | `logoImage` | the logo's file name | an `image` with `fit` `'Fit'` | 10 |
| `page/shell.js` | `names` (`tidy`, `base`, `theirs`, `slug`, folders), `projectFiles`, `resources`, `reportJson`, `pagesJson`, `endFiles` | `o` | everything outside `pages/<id>/` and `bookmarks/` | 95 |
| `page/page.js` | `paneObjects`, `pageJson`, `container`, `groups`, `slots` (the loop over the slots in reading order) | the context, one page | the page's list of containers | 95 |
| `page/header.js` | `headerLayout` (the boxes), `headerExtras` (navigator, Filters button) | title and logo slots, page names | `nav`, `openBtn`, their containers | 50 |
| `page/rail.js` | `rail` | the slicer slot | three slicers, Reset, one bookmark | 40 |
| `page/panel.js` | `panel` | the page's panel box | the hidden group, its five kinds of visual, three bookmarks | 55 |
| `page/tooltip.js` | `tooltipPage` | the bind's `tip` | the tooltip page and its visuals | 35 |
| `page/bookmarks.js` | `bookmarkFiles` | the list of bookmarks | `bookmarks/*.json` | 20 |
| `phone.js` | `phonePositions`, `mobileJson` | the page's containers and groups | `mobile.json` per visual | 55 |
| `index.js` | `build`, and `module.exports = { build, zip, crc32 }` | `o` (unchanged) | `{ base, files, zip }` (unchanged) | 60 |

**`sizes.js`: every rule with its pointer** (by section title in `scripts/tests/DESKTOP-TESTS.md`, since line
numbers move; the split's first job on this file is to confirm each pointer by reading the section):

| Rule | Measured in |
|---|---|
| a text box line: `10 + 1.8 x pt` (`boxH`, `boxFit`); a dropdown slicer: `16 + 4 x pt` (`slicerH`); width `0.55` em per character (`charW`) | "2026-10-01: measured in Power BI Desktop 2.157, the heights text boxes, dropdown slicers and Reset need" |
| button text `2 + 1.6 x pt` per line (`buttonH`); a button never wraps; its icon grows with its height; a page button wraps when narrow | "round 2 of the phone and size fix" and "measured on Power BI Desktop 2.158.1177: KPI cards, Reset buttons, page buttons" |
| Reset: `max(40k, 6 + 1.6 x pt)`, the icon only when text and icon fit side by side (`resetFit`); Close `max(32k, 6 + 1.6 x pt)` | "measured on Power BI Desktop 2.158.1177: the Reset button's height, Arabic and English" |
| `iconH` `2.25 x pt`; `0.45` em per character in `resetFit` | no measurement recorded (see the report above) |
| `cardFit`: a line `1.5 x` its size, padding `8 x s / 1.5`, 7 characters wide, the value never under 8 | "cards moved to `cardVisual`" and "measured on Power BI Desktop 2.158.1177: KPI cards, Reset buttons, page buttons" |
| card title margin `round(12k)`, the accent-bar side from `kpiInset`; padding and spacing without a selector; `fillCustom` off without a selector | "round 0 measurements", rows 6 and 7 |
| tooltip page 320 x 284, bar chart 184 high (22 a row plus 46), axis text 8pt, axis room 40; `TIP_VALUE` 20, `TIP_TITLE` 10 | "round 0 measurements", row 3; the report fixes of 2026-09-30 for the 20pt value |
| phone: cards two per row, value 20 and title 10; grouped visuals in page positions | "cards moved to `cardVisual`", item 7; "`fix/phone-and-sizes` after the Reset rule" |
| phone canvas 323 wide, gap 8, slot heights (`SIZE`) | no measurement recorded; round 1 item 1.1 measures the phone |
| header, rail and panel numbers made on 1920 x 1080 and scaled by `k` (140, 180, 120, 160, 76, 96, 44, 24, 16, 10, 8) | design numbers, not measurements; `sizes.js` says so |

**How the parts share the build's state.** Today everything inside `build` reads about 30 names from one closure.
`index.js` makes one object for the build (`ctx`: language, direction, colours, font, texts, the bind, names and
folders, `add`, `align`, `edge`, solid or not, the four theme sizes, the tooltip page's name, the bookmark list) and
one per page (`pc`: the page, its name, `k`, the container list, the phone list, groups, charts, slicer names, and
the two counters `z` and `kpiIndex`). Builders take what they need from these and return plain objects.

### 3. The build step
- **The tool: `scripts/build-pbip.mjs`**, about 50 lines of Node with no dependencies. It reads the parts in a
  fixed list, wraps each in `def('./sizes.js', function (module, exports, require) { ... })`, puts a 10-line
  registry in front, and writes `assets/js/pbip-export.js` with today's first line (the copyright banner, which
  terser keeps), a "generated, edit `assets/js/pbip/`" line, today's wrapper and today's last line
  (`module.exports = api` or `root.DAPbip = api`). It fails if a file in the folder is missing from the list or a
  `require` points outside it. `--check` builds in memory and compares with the committed file.
- **Why not esbuild:** it is a binary package per platform for a job that is joining files; its output changes
  between versions, so the committed joined file would change without the parts changing; and nothing else on the
  site is bundled ("the site itself needs no build"). **Why CommonJS parts:** the MCP and the tests load every
  engine with a synchronous `require`; parts as ES modules would force either a bundler or awaited imports in
  tests that may not be changed to pass.
- **The website:** unchanged in what it loads. `node scripts/build-pbip.mjs`, then
  `npx terser assets/js/pbip-export.js -c -m -o assets/js/pbip-export.min.js` (the rule in `mcp/CLAUDE.md`), then
  the `?v=` in `theme-generator.js` line 452 is bumped, `theme-generator.min.js` rebuilt and its `?v=` bumped on
  both generator pages, as every round has done. One `?v=` for the whole branch, set at step 2.
- **The MCP:** `mcp/lib/model.mjs` line 11 becomes `require('../../assets/js/pbip/index.js')`: the parts, not
  the joined file. Nothing is added to `mcp/package.json`; the build script and terser are never run by the MCP
  or by its `npm test`. For packaging and for the private repo the folder `assets/js/pbip/` is copied with the
  other engines, and the "both copies match" check covers it.
- **The tests:** `scripts/tests/pbip.mjs` keeps `require('../../assets/js/pbip-export.js')` (not edited), so the
  website's suites test the joined file and the page's `.min.js`, and the MCP's checks test the parts.

### 4. The proof
**What exists and what it proves.** `design-engine` (598 checks): both pages still make the 54 design fixtures
and the lab page still hands the writer the 60 recorded inputs. `pbip` (67), `theme-generator` and
`theme-generator-lab` (883 each): the downloads' structure through the page's `.min.js`, and blocks 9 to 12 on the
54 designs through `require`. `npm test` in `mcp/` (120): `generate_theme` and `plan_layout` byte for byte, the
reports' structure, Microsoft's validator on two exports. All of these must stay as they are and pass, untouched.
**None of them compares the writer's output byte for byte**, because `cases.json` and `project-pages.json` hold
themes, slots and build inputs, not `visual.json` files. So the proof is a new check, built the way
`builder-scripts\mvs-proof.mjs` proved `f0142b4`.

**The new check (added first, on the unchanged writer):**
- `scripts/tests/fixtures/pbip-export.before-split.js`: main's `pbip-export.js`, byte for byte (git blob
  `157595b`), the "before" writer.
- `scripts/tests/pbip-golden.mjs`, the 17th website suite, and a command: `--write <folder>` writes every file of
  every case to disk. It builds each input with the before writer and with the new one, with the same ids
  (`Math.random` seeded in Node; `crypto.getRandomValues` seeded and `Date` fixed in the browser), and compares
  every file's bytes and the list of files:
  1. the 60 project fixtures: the exact build input the page hands the writer, with the fixtures' own
     backgrounds. Expected: 60 cases, 4369 files, all identical;
  2. the 54 designs with their own theme (41 solid, 13 transparent), second page, with and without the panel,
     with `kpiInset`: the MCP's kind of report;
  3. the 16 default layouts on 640 x 360 and 3840 x 2160 that `pbip.mjs` block 11 builds;
  4. the branches those don't reach: a logo (PNG and JPG); the user's own model by path, with taken names, and by
     connection; no sample and no model; one page; the old single-page input (`page`, `slots`, `png`); more KPI
     slots than KPIs; a top filter strip; a Reset too narrow for its icon; page names too long for buttons; the
     report names of `pbip.mjs` block 9. Node's built-in coverage (`NODE_V8_COVERAGE`) is run once over sets 1
     to 4: every line of the parts must be reached, or the line is listed with the input added for it;
  5. three loaders in Node on sets 1 to 4: the parts, the joined file, and the minified file;
  6. the browser, on the lab page and the live page, through the page's own `pbip-export.min.js?v=`: the 60
     project cases driven as `captureProjects` drives them; the before writer is loaded into the same page, and
     each case's files and the zip's bytes are compared;
  7. `node scripts/build-pbip.mjs --check`, and (decision 3) that terser's output from the joined file is the
     committed `.min.js`.
- In `mcp/test.mjs`: the MCP's `Pbip` (the parts) against the before writer on set 2 with a bind from the MCP's
  own fixtures; and the reports of `create_report` over stdio, with a second server started with a seeded
  `Math.random` (a preload, no change to `server.mjs`): design and hand-placed pages, English and Arabic, the four
  layouts, 1280 x 720 and 1920 x 1080, panel on and off, the three logos. Their hashes are recorded in
  `mcp/fixtures/report-hashes.json` at step 1, on main's writer, and must not change.
- **The check must be able to fail:** step 1 also runs it once with one number changed in memory and expects it to
  report that file; otherwise a comparison that compares nothing would pass.
- **On disk, for the report:** `--write` on main's writer into `C:\DataArcus\tests\split-proof\before`, and after
  the last step into `...\after`; `diff -rq` prints nothing; the file count and one SHA-256 of the whole tree go
  into the final commit message and into this file.
- **Expected numbers:** website 16 suites -> 17, every existing count unchanged (pbip 67, design-engine 598,
  theme-generator 883 twice); MCP 120 -> 122; fixtures recaptured: none; expected numbers changed: none. The file
  counts of sets 2 to 6 are written into this file by step 1's run, before any code moves.

### 5. The order of steps (each one commit or a few, CI green after each)
1. **The check, on the unchanged writer:** the frozen copy, `pbip-golden.mjs`, the MCP's two checks and hashes,
   the suite added to `run-all.mjs`, the counts written here. Nothing the site or the MCP ships changes.
2. **The build chain with one part:** `build-pbip.mjs`; `assets/js/pbip/index.js` holding today's whole body,
   unchanged; the joined file and the `.min.js` generated; `?v=` bumped. This proves the joining, the minifying
   and the browser path before any logic moves.
3. **The MCP on the parts:** `mcp/lib/model.mjs` line 11. From here every step is checked through both loaders.
4. **The parts with no state:** `helpers`, `zip`, `sample`, `fields`, one commit each.
5. **`sizes`:** the rules as functions of numbers, each with its pointer; `resetFit` takes the label size as an
   argument instead of reading it from the closure.
6. **The context, inside `index.js`:** the closure's names become `ctx` and `pc`, the body becomes functions that
   take them, still in one file. This is the step most likely to break something, so it moves no file.
7. **Visual builders:** `frame`, then `card`, `slicer`, `button`, `table`, `chart`, `textbox`, `image`.
8. **Page assembly:** `shell`, `page`, `header`, `rail`, `panel`, `tooltip`, `bookmarks`.
9. **Phone layout:** `phone`.
10. **The end:** the on-disk comparison; `mcp/CLAUDE.md` ("How it is built", the rebuild rule), `mcp/ROADMAP.md`,
    `scripts/tests/README.md`, the workflow's comment (17 suites) and this file updated; decision 4 applied. The
    reviewer merges after CI is green; nobody merges their own work.
At every step: the joined file and `.min.js` rebuilt, `pbip-golden`, `pbip` and `npm test` in `mcp/` run locally,
the full run in CI. A step that cannot be made identical is reverted and reported, not adjusted.

**Risks, and how each is avoided:**
- **The order of the random ids.** Byte for byte with the same seed needs `rnd()` called in today's order: each
  page's id; the report's `.platform` GUID, then the model's; the tooltip page's name and binding; per page the
  groups in the order their first slot is met; then per slot in reading order: three slicers, the Reset's bookmark,
  then the Reset; any other visual; after the title the navigator, then the open and close bookmark names, then the
  Filters button; the panel: group, card, Close, slicers, the Reset's bookmark, Reset; last the tooltip's visuals.
  A builder that makes its bookmark name after its container instead of before would change every later id.
- **Key order.** `JSON.stringify` writes keys in the order they were added: `frame` (title, the three panel
  entries, general, extras), then `cardFrame` adds padding and spacing, then the tooltip link is added to charts
  after the whole page. Builders return the same object that later code adds to: no copies, no reordering.
- **Arithmetic.** Expressions are moved as written (`0.45 * 4 / 3 * LABEL * n + h + 6`), not simplified: floating
  point depends on the order, and several results are rounded after.
- **Shared counters and lists.** `z`, `kpiIndex`, `bookmarks`, `slicerNames`, `origin`, `groups`, and
  `openBm`/`closeBm` written on the page are changed from several places; they live on `ctx` and `pc`, never in a
  module's own variable, so two builds can never share state.
- **Global names and shadowing.** In the browser the only global stays `DAPbip`, a plain object with `build`,
  `zip`, `crc32` (the capture script wraps its `build`). In the joined file each part is inside its own function.
  Today's file reuses names in inner scopes (`T`, `S`, `ref`, `k`, `y`, `P`, `title`, `add`/`add1`, `def`/`DEF`,
  `o`/`o0`): once lifted to a file's top a name can quietly mean something else, so every moved function gets its
  outside names listed and passed in; `'use strict'` everywhere; the coverage run reaches every line.
- **Browser and Node.** `rnd` uses `crypto` only where `self` exists and `Math.random` otherwise, exactly as now
  (`helpers.js`: `const root = typeof self !== 'undefined' ? self : {}`); it must not become `globalThis.crypto`,
  which Node also has, and which would end seeding the ids in tests and proofs. The parts use nothing of the
  browser (`window`, `document`) and nothing of Node (`fs`, `Buffer`). No syntax newer than today's file uses.
- **Minifying.** terser cannot shorten property names, so `ctx.rtl` costs more than today's `rtl`: functions
  unpack what they use at their top. Today's `.min.js` is 27,983 bytes; expected under 32,000; more is reported.
  The minified file is checked by loaders 5 and 6, not assumed.
- **Line endings.** The laptop checks files out with CRLF, CI with LF. The build script reads with CRLF turned
  into LF and writes LF, and the parts contain no multi-line template strings, so both machines write the same
  file.
- **A stale joined or minified file,** or a hand edit of the joined file: caught by `--check` and decision 3.
- **One writer.** Round 1 does not start, and no other branch touches the writer, until the split merges (see
  "Seen, not in scope" (a) above).

### 6. What changes for the next rounds
A fix is made in a part; then `node scripts/build-pbip.mjs`, terser, `?v=`; never in the joined file.

| Round item | Lands in |
|---|---|
| 1.1 phone text sizes; 1.1b and 1.5 phone card padding | `phone.js`; the measured phone rules in `sizes.js` |
| 1.2 slide-in panel (only if the Desktop check fails) | `page/panel.js`, `sizes.js` |
| 1.3 the page button "Executive…" | `sizes.js` (the page-button width rule), `page/header.js` |
| 1.4 title and logo centred in their boxes | `visuals/textbox.js`, `visuals/image.js` |
| 1.6 the tooltip chart by month | `page/tooltip.js`, `visuals/chart.js` (and `pbip-bind.js` for the field) |
| 1.7 header band and filter rail on a solid design | `page/page.js` (groups), `page/header.js`, `page/rail.js`, `frame.js` |
| 2.1 Arabic display names | `fields.js` (`label`, `proj`, `bindTitle`), `visuals/slicer.js`, `visuals/table.js`, `page/tooltip.js`; `mcp/server.mjs` |
| 2.2 sort order and formats | the health engine, not the writer |
| 2.3 the sample download's refresh message | `sample.js`, `page/shell.js` (the README) |
| the validator on every export | reads the folders `pbip-golden.mjs --write` makes |

With decision 4 as proposed, a round that changes the output on purpose updates the recorded hashes and says in
its commit which cases changed and by what, which replaces the one-off proof scripts of earlier rounds
(`r0-fixture-proof`, `ctr-fixture-proof`, `mvs-proof`).

## Next step (builder, 2026-10-02): stopped for today; three steps after the owner's usage limit resets
Main is at `bbc42df`. Nothing is in progress: round 0 (`14dd467`), `fix/card-theme-radius` (`99d1cee`) and
`fix/mcp-visual-style` (`e8fe171`) are merged and their branches deleted; no test report is open in Power BI Desktop.
`docs/work-next-steps` is merged (`bbc42df`) and deleted. The only open branch is `plan/split-pbip-export`, which
holds the split's plan in this file ("Split plan" above) and nothing else, for the owner to read.
**The owner's weekly usage limit resets on Sunday, 2026-10-04. Nothing is to be done before then.**

**The next steps after the reset, in this order (owner 2026-10-02):**
1. **The reviewer's split of `assets/js/pbip-export.js`, in a fresh reviewer session.** Small modules with one job
   each (sizes, visual builders, page assembly, phone layout; `mcp/ROADMAP.md`), the output byte for byte identical
   on all 54 design and 60 project fixtures. **Nobody else touches `pbip-export.js` until that merges.**
2. **The validator on every export in CI (the reviewer, owner 2026-10-02: CI and test tooling run on Linux).** Microsoft's validator (their report authoring CLI, already a dev
   dependency of the MCP's tests, pinned to 0.4.0) runs today on two MCP exports in `npm test`; it is to run on every
   export the tests build, on every push.
3. **Round 1** (builder; plan below under "Round 1", items 1.1 to 1.7; it starts with the owner's go, on its own
   branch from main, after the split has merged).

Then round 2 (Arabic accuracy), the design summary, packaging, the private-repo move, the beta and the launch
(`mcp/ROADMAP.md`). **Dated:** the Gulf Calendar pack ready by 2026-12-01.

**Testing speed (owner 2026-10-01):** the builder runs only the failing tests and the suites a change touches; CI
runs all 16 website suites and the MCP's checks on every push, and the reviewer checks it before every merge. No
15-minute full runs on the laptop unless the reviewer asks.

### The rounds: what was built, and the plans for rounds 1 and 2 (builder)
Rounds 1 and 2 below are plans: nothing in them is built. Each round starts with the owner's go, on its own branch
from main. Modules are named as in `mcp/ROADMAP.md` (sizes, visual builders, page assembly, phone layout); until the
split merges all of them are still `assets/js/pbip-export.js`. Every round: measure in Desktop first; failing tests
first; only the suites the change touches (`pbip`, `design-engine`, `theme-generator`, `model-health`, `npm test` in
`mcp/`); reports built with the branch's `mcp/server.mjs` over stdio; Desktop 2.158.1177 on 1920 x 1080 and
1280 x 720, English and Arabic, plus what the round touches, judged from full-size crops; results into
`scripts/tests/DESKTOP-TESTS.md`; only our own sample model (`C:\DataArcus\tests\5-tmdl-sample`) and the website's
sample data. Stop when a failure could change what Desktop shows; otherwise note it and continue (root `CLAUDE.md`).

#### `fix/mcp-visual-style`: merged into main as `e8fe171`; how it was built
Commits (from main `99d1cee`): plan `ff25e53`, tests failing first `b6132f2`, code `f0142b4`.
- **Change (`assets/js/pbip-export.js`):** when the theme it is given has solid visuals (its `"*"` visuals have a
  background), the visuals that sit on a panel (KPI cards, charts, tables, text slots) get no `background`, `border`
  or `dropShadow` entry, so the theme draws their panel, and the group around the KPI cards gets
  `background: show false`, so no band lies behind them. With a transparent theme everything is written as before.
  No new input: solid is read from the theme. `mcp/server.mjs`: `create_report`'s description, its message for a
  design with transparent visuals, and a new `panels` line in the result say what the report shows.
  `pbip-export.min.js?v=20261002a`, `theme-generator.min.js?v=20261002a`.
- **Measured first in Desktop 2.158**, then checked on nine reports (`scripts/tests/DESKTOP-TESTS.md`): PASS. Solid
  designs through the MCP show a panel behind every card, chart and table, English and Arabic, light and dark; the
  website's download is the same as in round 0.
- **Tests, before -> after:** pbip 67 checks, 1 failing (the 82 builds with a solid theme) -> 67 pass; MCP 120
  checks, 6 failing -> 120 pass; design-engine 598, theme-generator 883 and theme-generator-lab 883 pass.
- **Fixtures: none change.** Proof in commit `f0142b4` (`builder-scripts\mvs-proof.mjs`, the old and the new writer on
  the same inputs with the same ids): the 60 project fixtures' builds, which are what the website hands the writer,
  are byte for byte the same (4369 files); in the 41 solid designs built with their own theme the only changes are
  the three entries removed from cards, charts, tables and text slots and the background switched off on the KPI
  group; the 13 transparent designs are byte for byte the same.
- **Microsoft's validator:** 0 errors on all nine reports of the check.
- **Seen, now in round 1 (item 1.7, owner 2026-10-02):** on a solid design the header band and the filter rail have
  square corners and no shadow, unlike the panels beside them (a group has no border or shadow setting).

#### The plan `fix/mcp-visual-style` was built from (owner's go 2026-10-02; reference, its state is above)
`fix/card-theme-radius` is merged into main as `99d1cee` and its branch deleted; the validator stays a dev dependency
of the MCP's tests; the tag `round-0-tooltip-logo-table` stays. This branch is from main.

**The problem.** On the MCP's reports no visual has a panel: charts, tables and cards sit straight on the page,
although the report's theme has solid visuals and `create_report` says the theme gives the visuals "their own solid
cards to keep them visible".
- **Where it is switched off:** `assets/js/pbip-export.js`, `frame()`: every visual's `visualContainerObjects` gets
  `background`, `border` and `dropShadow` with `show: false`, whatever the design. `visual.json` outranks the theme,
  so the theme's solid background, rounded border and shadow never show.
- **Why it was written so:** the website's download always carries a background image that draws the panels, with a
  theme whose visuals are transparent (`theme-generator.js` forces `transparent` for the project's theme); there,
  off is right. The MCP has no background image and makes the theme solid, and then the same switch hides the cards.

**The rule.**
- **Transparent design** (the background image draws the panels; the theme's visuals are transparent): the visuals'
  background, border and shadow stay off, as today. This is every website download: nothing in it changes.
- **Solid design** (no panels in a background image; the theme's visuals are solid): the visuals that sit on a panel
  are left to the theme: `visual.json` writes no `background`, `border` or `dropShadow` for them, so the theme's card
  colour, rounded corners and shadow show, as the website's own preview of a solid design shows them.
- **How the report writer knows:** from the theme it is given: solid when `theme.visualStyles["*"]["*"].background[0]
  .show` is true. No new input, so the page's build input and the 60 project fixtures are untouched.

**Expected result per visual, solid design (to be confirmed by the measurement, then pinned by tests):**

| Visual | Transparent design (today, unchanged) | Solid design (after) |
|---|---|---|
| KPI cards | on the image's panels, no fill of their own | each card its own panel from the theme (card colour, rounded, shadow if the design has it); the "KPI cards" group draws no band behind them |
| charts, table, text slot | on the image's panels | each its own panel from the theme |
| slicers and Reset in the filter rail | on the image's rail panel | inside one rail panel (the "Filters" group, from the theme); the slicers themselves without panels |
| header: title, page buttons, logo | on the image's header band | on one header band (the "Header" group, from the theme), without panels of their own, as today |
| buttons (Reset, Filters, Close), page buttons | their own fill, by design | the same |
| slide-in panel | its own card (written in `visual.json`) | the same |
| tooltip page | the page's card colour; its visuals without panels | the same |

**Website download:** follows the rule already (always the transparent side); checked by a test that its `visual.json`
files are byte for byte what they are today apart from random ids.

**Steps:** this plan committed; measured in Desktop (one solid design through the MCP as it is and with the candidate
change, one transparent design as the website's download; English and Arabic, 1080, light and dark); tests first
(failing); code in `pbip-export.js`, and `create_report`'s description and message in `mcp/server.mjs` saying what the
report shows; `pbip`, `design-engine`, `theme-generator`, `npm test`; `.min.js` and `?v=`; fixtures: none expected to
change (stated with proof); CI green; the Desktop check; the report. Stop if a failure could change what Desktop
shows.

#### `fix/card-theme-radius`: merged into main as `99d1cee`; how it was built
Round 0 is merged into main as `14dd467`; its branch tip is kept as the tag `round-0-tooltip-logo-table` (the fixture
proof is in commit `0b9c813` there); `fix/tooltip-logo-table` and `plan/next-rounds` are deleted.
Commits on `fix/card-theme-radius` (from main): tests failing first `51cdf5b`, code and fixtures `9057a6b`.
- **Change:** in `design-engine.js` (`buildTheme`) the card visual's theme entry has the border without `radius`;
  every other visual type keeps its radius. `design-engine.min.js` rebuilt, `?v=20261001c` on both generator pages.
- **Measured first in Desktop 2.158** (`scripts/tests/DESKTOP-TESTS.md`): a report whose theme has the card's radius
  removed is byte for byte the same on screen as one with it, light and dark, also for a card left to the theme.
- **Tests, before -> after:** MCP 114 checks, 4 failing -> 114 pass; design-engine: the new check failed on 41 of 54
  designs -> 598 pass; pbip 66 pass; theme-generator and theme-generator-lab 883 pass. One existing check changed as
  the change requires (`theme-generator.mjs`: the radius on every visual type but the card visual).
- **Microsoft's validator:** 0 errors on the MCP's exports, now also checked in `mcp/test.mjs` on every run. For that
  the validator (Microsoft's report authoring CLI, MIT) is a dev dependency of the MCP's tests, pinned to 0.4.0; it is
  not shipped with the MCP. **Needs the owner's yes** (the alternative: keep it as a check on the laptop only).
- **Fixtures (owner's go):** the design fixtures recaptured; proof in commit `9057a6b`: 13 cases byte for byte the
  same (the 13 designs with transparent visuals), 41 changed (the 41 with solid visuals) by the removed
  `cardVisual` radius only. The 60 project fixtures are not recaptured and still match (their theme is always
  transparent).
- **Desktop look after the code:** four MCP reports, English and Arabic, 1080, light and dark: cards and everything
  else as before (pixel comparisons in `DESKTOP-TESTS.md`).
- **Seen, not assigned yet:** on the MCP's reports every visual is drawn without a panel, because `visual.json`
  switches the container's background, border and shadow off, so the solid theme `create_report` promises never
  shows. Needs the owner's decision on its round.

#### Round 0: merged into main as `14dd467` (tag `round-0-tooltip-logo-table`); how it was built
Commits: decisions `bda14f4`, tests failing first `199eab7`, code `93eb7ff`, Desktop results `92581ee`, main merged
`4cb35c1` (CI now runs on every push), project fixtures recaptured `0b9c813`.
- **Tests, before -> after:** pbip 66 checks, 18 failing -> 66 pass; MCP 110 checks, 19 failing -> 110 pass;
  design-engine 597 checks, 7 failing -> 597 pass (after the recapture); theme-generator 879 and
  theme-generator-lab 879 pass. No full run on the laptop: CI runs all 16 suites and the MCP checks on the branch.
- **Fixtures (owner's go 2026-10-01):** the 60 project fixtures recaptured from the lab page, because the page now
  hands pbip-export one new field per page, `kpiInset`. Proof in commit `0b9c813`: in all 60 cases the build input is
  equal once `kpiInset` is left out; it is the only field that differs (114 pages); languages, options and every page
  background are equal. The 54 design fixtures are untouched and match the live and the lab page. The engine check in
  `design-engine.mjs` builds the same page object as the page does (with `kpiInset`).
- **Desktop 2.158.1177, ten reports** (`scripts/tests/DESKTOP-TESTS.md`, "round 0 built"): changes 1 to 6 PASS in
  English and Arabic, 1080 and 720, light and dark, website download and MCP. One expected number corrected: the tall
  logo's box is 20 x 48 mirrored on 1080 (19 in English; the engine rounds edges, not sizes).
- **Microsoft's validator:** the six website exports pass with 0 errors. The four MCP exports fail with 1 error,
  "Unknown theme property border.radius for cardVisual", which predates this round: **its own round, right after this
  one** (below).
- **Expectations changed in tests, each for a stated reason:** the theme inside a project carries its file name
  (owner's change 7; `mcp/test.mjs`); `.platform` is allowed in the names check like `.gitignore` (owner's change 8;
  `pbip.mjs`); the engine check carries `kpiInset` (the recapture); in the new tests the Arabic tall logo is 20 wide
  and a new visitor's download has the side bar's inset.
- **Rule from now on (owner 2026-10-01, in the root `CLAUDE.md`):** stop when a failure could change what Desktop
  shows; otherwise note it and continue.

#### The plan `fix/card-theme-radius` was built from (reference; its state is above)
- **Problem:** Microsoft's validator fails on every export whose theme has solid visuals (all the MCP's reports):
  `PBIR_THEME_VISUAL_PROP_UNKNOWN`, "Unknown theme property border.radius for cardVisual". `design-engine.js` writes
  the rounded container border (`border: [{ show, color, width, radius }]`) for every visual type, and inside a theme
  the card visual's `border` is the card's own border object, which has no `radius`. Themes with transparent visuals
  (the website's project download) write `border: [{ show: false }]` and pass.
- **Change (`assets/js/design-engine.js`, `buildTheme`):** the card visual's entry gets the border without `radius`;
  every other type is unchanged. `.min.js` and `?v=` on both generator pages.
- **Measure first (Desktop, one look):** an MCP report today and with the entry changed by hand: are the KPI cards'
  corners the same (expected: yes, the property is unknown to the card and so does nothing today), and does the
  card's own border show (it is written with `show: true` in the card colour)? If the corners change, stop and report.
- **Tests first (failing):** `design-engine.mjs`: no theme has `radius` in `visualStyles.cardVisual`; `mcp/test.mjs`:
  the registered theme of a report with solid visuals has none. A validator run on one MCP export: 0 errors.
- **Fixtures:** the theme JSON of every design with solid visuals changes: 41 of the 54 design fixtures (and the
  project fixtures that hold those themes). Recaptured with the owner's go, with the proof in the commit: in each
  changed theme the only difference is `visualStyles.cardVisual["*"].border[0].radius`, and the 13 designs with
  transparent visuals are byte for byte the same.
- **Desktop check:** MCP reports in English and Arabic at 1080 and 720, and one website download with solid visuals:
  card corners and everything else as before; Microsoft's validator passes on all of them.

#### Where every "Seen, not in scope" item now lives (owner 2026-10-01)
- **Round 1** (with the phone text and the slide-in panel, see 1.1 to 1.7 below): the header band and the filter
  rail on a solid design (1.7, owner 2026-10-02); the page button "Executive…" on the
  website's 1080 download; the header title and logo centred vertically in their boxes on big pages; phone padding at
  3840 x 2160 with a side bar; the tooltip chart as the hovered item's trend by month.
- **Round 2** (see 2.1 to 2.3 below): English names in Arabic reports; day and month sorting; the "calculated tables
  need refreshing" message on the sample download.
- **After the beta:** the 640 x 360 items (open items, "Small-page round").
- **`fix/card-theme-radius`:** the validator's theme error on the MCP's exports.

#### Round 0: GO (owner, 2026-10-01). Branch `fix/tooltip-logo-table`, from `plan/next-rounds`
The reviewer has not started the split, so `assets/js/pbip-export.js` is changed as it is today; the split comes right
after this round merges. Where this block differs from the measured plan below it, this block wins.

**The owner's decisions on the five questions:** (1) tooltip transparency is dropped: Desktop doesn't support it;
(2) the tooltip page grows to 320 x 284, so 6 rows fit; (3) a tall logo keeps its own ratio, and when a logo is taller
than wide the report notes say "This logo is tall; a horizontal version will read much better in the header.";
(4) card title: top margin `round(12k)` (12 at 1080, 8 at 720) and a side padding that keeps the title clear of the
accent bar (26 at 1080, 17 at 720), both reserved by `cardFit`; (5) the table's own fill stays.

**Eight changes, in this order:**
1. Tooltip link: `visualTooltip.type` `'Canvas'` on every chart of every main page.
2. Logo: width from the image's ratio, no minimum, `image.fit: 'Fit'`, the new `logo` input on `create_report`, and
   the tall-logo note (`create_report`'s notes; on the website a line under the logo's file name).
3. Tooltip chart: a bar chart, axis text 8pt, 40% axis room, value axis off, data labels on (8pt), on a 320 x 284
   tooltip page (card 296 x 76 at 12, 8; chart 296 x 184 at 12, 92: floor((184 - 46) / 22) = 6 rows).
4. Table header alignment: `columnFormatting` per column with "Apply to header"; text left, numbers right, mirrored
   in Arabic.
5. Card fill off: `fillCustom` `show: false`, no selector.
6. Card padding and spacing written without the selector: top `round(12k)`; on the side of a side accent bar the
   bar's end plus `round(5k)` (26 / 17); the other sides `P`; `cardFit` reserves all four.
7. The theme inside the project carries the name `report.json` references (the theme's file name with `.json`), as
   Microsoft's theming reference requires; the theme download on its own keeps its name.
8. A `.platform` file in the report folder (and in the sample model's folder), as Microsoft's scaffold writes it.
   Microsoft's validator (`powerbi-report-author validate`) must pass on our export.

**Recorded elsewhere:** the phone card padding selector goes to round 1 (in this round the phone keeps what it
writes today); "calculated tables need to be manually refreshed" on the sample download is an open item.

**Steps:** this block committed and pushed; the tests, failing, committed; the code (`pbip-export.js`,
`design-engine.js`, `pbip-bind.js`, `mcp/server.mjs`, `theme-generator.js` for the logo's ratio and note); only the
touched suites (`pbip`, `design-engine`, `theme-generator`, `npm test` in `mcp/`); the `.min.js` files and `?v=`;
the Desktop check; the validator; this file updated, committed and pushed. Stop at the first real failure.

**Tests written first, with what must fail before the code:**

| Test | Where | Before the code |
|---|---|---|
| every chart linked with `Canvas` to a tooltip page; nothing else linked | `report-check.mjs` `tooltipProblems`; `pbip.mjs`, `mcp/test.mjs` | the default two-page report: 4 of 4 charts |
| `imageSize` (PNG, JPG); the logo box from the ratio; `image.fit` `'Fit'`, no `imageScaling`; the `logo` input, its refusals, the tall-logo note | `design-engine.mjs`, `pbip.mjs`, `mcp/test.mjs` | no `imageSize`; every report with a logo; no `logo` input |
| the tooltip page is 320 x 284, its chart a bar chart with the four settings, 6 rows | `report-check.mjs` `tooltipPageProblems` | every report with a bound tooltip page |
| each table column has its `columnFormatting` entry | `report-check.mjs` `tableProblems` | the default report: 8 of 8 columns |
| each card: `fillCustom` off without a selector; `padding` and `spacing` without a selector; top `round(12k)`; the bar side clear; fits its box | `pbip.mjs` `cardProblems`, `mcp/test.mjs` | the default report: 8 of 8 cards |
| the project's theme `name` = `customTheme.name` = the item's `name` = its `path`, ending `.json` | `report-check.mjs` `projectProblems` | every project |
| `.platform` in the report folder (type Report, the report's name, a GUID) | the same | every project |

**The Desktop check (expected results, written before any run).** Power BI Desktop 2.158.1177, test reports only,
closed without saving. Ten reports: the website's sample download for English and Arabic at 1920 x 1080 and
1280 x 720, light (Corporate, side accent bar), each with one logo (EN 1080 wide, AR 1080 tall, EN 720 square,
AR 720 wide); EN 1080 and AR 1080 dark (DataArcus, accent bar on top) without a logo; and through the MCP on our
sample model (`5-tmdl-sample`) EN 1080 with the tall logo and AR 720 with the square logo, plus EN 1080 and AR 1080
without one. Pages at 2x, hovers from the screen, judged from full-size crops.

| # | Checked | Expected |
|---|---|---|
| 1 | every chart on both pages hovered (`m0-hover.ps1`) | our tooltip page shows on each (4 charts: page 1 line, bar, column; page 2 column), filtered to the hovered point; cards and tables show their usual hover |
| 2 | header logo: wide, square, tall | undistorted and whole; boxes (page units) wide 192 x 48 at x 1692 on 1080 and 128 x 32 at x 1128 on 720 (Arabic: x 36 / 24); square 48 x 48 at x 1836 and 32 x 32 at x 1224; tall 19 x 48 at x 1865 (Arabic x 36; corrected after the build: 20 x 48 there, the engine rounds edges), thin as measured; title and page buttons whole, not touching the logo; the tall logo's note in the MCP's result; without a logo the placeholder as before |
| 3 | the tooltip (hover and the page) | 320 x 284; the card as before; a bar chart with every category name whole and horizontal and its value beside the bar, 4 rows (the sample's 4 categories), no scrollbar, no "…"; English and Arabic |
| 4 | every table | each header over its own values: English text left, numbers right; Arabic text column (rightmost) right, numbers left; columns fill the width |
| 5 | KPI cards on the website download | the accent bar whole (left in English, right in Arabic, on top on the dark design); panel border and shadow visible |
| 6 | KPI cards | the title clear of the panel's top (12 on 1080, 8 on 720) and clear of the side bar (26 / 17); the number whole and centred in what is left; value sizes 42 on 1080 and 28 on 720, the tooltip card 20 |
| 7, 8 | Microsoft's validator on each export; the theme in Desktop | `validate`: 0 errors; colours, fonts and text sizes as before (the theme is applied) |
| all | everything else on both pages | unchanged: header, slicers, Reset, page buttons, chart positions, phone layout without overlaps |

#### Round 0, the measured plan per change (reference; the GO block above has the final decisions)
**Measured in Desktop 2.158.1177 on 2026-10-01, before any code** (`scripts/tests/DESKTOP-TESTS.md`, "round 0
measurements": the table of results, the test reports and the scripts `builder-scripts\m0-*`). The plan below uses what
was measured, not the earlier guesses. Property names and values were first read from Microsoft's report CLI
(`powerbi-report-author` 0.4.0, installed on the laptop as a reference: `formatting describe-object`, `validate`).
The seven, in build order: 1 tooltip link, 2 logo, 3 tooltip bar chart, 4 tooltip transparency (**measured: not
possible, see 0.4**), 5 table header alignment, 6 transparent card fill, 7 card title margin.
**One lesson runs through 6 and 7 (and the buttons before): a formatting entry's selector decides whether Desktop
uses it.** The card's container `padding` and `spacing` and `fillCustom.show` are ignored with the `default` selector
and work without one, while the card's `value`, `label` and `outline` need it. Every entry is written the way it was
measured to work, and the tests pin the selector, not only the value.

**The Desktop check for the whole round (after the code, once):** four reports as the website's sample download
(English and Arabic, 1920 x 1080 and 1280 x 720, side accent bar) with the wide logo, the square and the tall logo on
the same four, one dark report, and the same designs through the MCP on our sample model with the `logo` input. On
each: every chart hovered (`m0-hover.ps1`), the tooltip page itself, every table, the KPI cards, the header with its
logo, the phone layout (`phone-check.ps1`). Crops at 1x and 2x. Expected results are listed per change.

**0.1 The tooltip page linked to every chart.** Module: page assembly (the link), visual builders (charts).
- **Measured:** today's `type: 'ReportPage'` shows Power BI's default tooltip; Microsoft's validator rejects the value
  ("valid: Default, Canvas"); with `type: 'Canvas'` our tooltip page shows on every hovered chart, in English and
  Arabic, on 1080 and 720, light and dark.
- **Change:** every chart on every main page (kinds line, bar, column, donut, funnel, treemap, map) gets
  `visualTooltip: { show: true, type: 'Canvas', section: <tooltip page name> }`; today only the first chart of page 1
  gets a link, with the wrong type. Cards, tables, slicers, text and buttons get none. The website's README step
  "Hover the main chart on the first page" becomes "Hover any chart" (both languages, `theme-generator.js`, `?v=`).
- **Tests first (failing):** `scripts/tests/report-check.mjs` gets `tooltipProblems(files)`: every chart has the link
  with `type` `'Canvas'` and a `section` that is a page of `type: 'Tooltip'`; nothing else has one. In `pbip.mjs` (54
  designs x 2 languages, both downloads) and `mcp/test.mjs`. Before: the default two-page report has 4 charts (page 1
  line, bar, column; page 2 column), 1 linked with the wrong type: 4 of 4 fail; the ops layout 5 of 5. After: 0.
- **Expected in Desktop:** hovering each of the 4 charts shows our tooltip page filtered to the hovered point.
- **Fixtures:** none change (`cases.json` and `project-pages.json` hold themes and slots, not `visual.json`).

**0.2 The logo box sized from the logo, and a `logo` input in `create_report`.** Module: the shared design engine
(`assets/js/design-engine.js`), visual builders (image), `mcp/server.mjs`.
- **Measured:** today's `imageScaling.imageScalingType: 'Fit'` stretches the image to its box (the same as
  `image.fit: 'Stretch'`); `image.fit: 'Fit'` keeps the ratio and shows the whole image, centred; `'Fill'` and
  `'Normal'` crop. In a box of the logo's own shape the logo is undistorted. **The tall logo (100 x 250) at 19 x 48
  (13 x 32 on 720) is whole but very thin**; the crop is `shots-m0\c-owner-logo-ratio-boxes.png` for the owner
  (decision 3); nothing is changed for it until he answers.
- **Owner's decisions:** the box takes the logo's shape (designed height, width from the ratio, **no 100 minimum for
  an attached logo**, the 360 maximum stays); the title and page buttons use what's left; `create_report` gets `logo`.
- **Change, engine:** `imageSize(bytes)` (PNG: IHDR; JPG: the SOF marker; null when it can't); `computeSlots`,
  `projectSlots` and `projectPages` take an optional `logoRatio`: logo height `hh - 24`, width
  `min(360, round(height x ratio))`, its far edge where it is today. Without it every result is identical to today.
- **Change, report:** the image is written with `image.fit: 'Fit'` (the old `imageScaling` entry goes).
- **Change, callers:** `theme-generator.js` passes the attached logo's ratio; `create_report` gets an optional `logo`
  (a PNG or JPG inside the working folder, 2 MB at most; copied into the new report, never changed; another type, a
  bigger file or one outside the folder is refused with the reason). Hand-placed pages keep their box, get the scaling.
- **Tests first (failing):** `design-engine.mjs`: `imageSize` on four logos of ours
  (`scripts/tests/fixtures/logos/`: `wide.png` 400 x 100, `square.png` 200 x 200, `tall.png` 100 x 250, `wide.jpg`
  600 x 50) and the boxes below; `pbip.mjs` and `mcp/test.mjs` (the `logo` input and its three refusals): the image's
  box, `image.fit` `'Fit'` and no `imageScaling`, page buttons ending 24k before the logo, no overlap in the header,
  `layoutProblems` clean, both languages. Before: every report with a logo fails on the scaling and the box.
- **Expected boxes (default header 56, page units; today 225 x 48 at x 1659 on 1080, 150 x 32 at x 1106 on 720; in
  Arabic the logo starts at x 36 / 24):**

  | Logo | Ratio | 1920 x 1080 (x, w x h) | 1280 x 720 (x, w x h) | Drawn |
  |---|---|---|---|---|
  | wide 400 x 100 | 4 | 1692, 192 x 48 | 1128, 128 x 32 | fills its box |
  | square 200 x 200 | 1 | 1836, 48 x 48 | 1224, 32 x 32 | fills its box |
  | tall 100 x 250 | 0.4 | 1865, 19 x 48 | 1243, 13 x 32 | fills its box (thin: decision 3) |
  | very wide 600 x 50 | 12 | 1344, 540 x 48 (the 360 maximum) | 896, 360 x 32 | 540 x 45 / 360 x 30, whole |

  The title stays 840 x 48 (560 x 32); the logo's far edge stays at 1884 (1256).
- **Expected in Desktop:** each logo undistorted (ratio in the crop within 2%), whole, at the header's far edge; title
  and page buttons whole and not touching it; without a logo the placeholder as before.
- **Fixtures:** none change (no fixture has a logo; the input is optional). If one differs, stop and report.

**0.3 The tooltip chart as a bar chart whose labels fit** (owner's yes to the bar chart). Module: page assembly (the
tooltip page), sizes (the measured tooltip rule).
- **Measured (296 x 140, English and Arabic):** today's column chart with the theme's 15pt axis text shows "El…",
  "F…". A bar chart writes names horizontally; with axis text 8pt and axis room 40% (`categoryAxis.maxMarginFactor`)
  a 20-character name is whole ("Ras Al Khaimah North", "رأس الخيمة الشمالية"); at 9pt and 10pt it needs 50%. **A bar
  chart of this size shows only 3 rows, then a scrollbar** (which can't be used inside a tooltip); with the value axis
  off and data labels on it shows 4, each bar with its value. One row takes 22:
  rows = floor((height - 46) / 22) without the value axis.
- **Change:** the tooltip chart becomes `clusteredBarChart`: `categoryAxis` `fontSize` 8, `maxMarginFactor` 40, axis
  title off; `valueAxis` off; `labels` on at 8pt; its title as today (10pt). The card above it unchanged.
- **Open point (decision 2):** 4 rows at today's size. A category with more values hides the rest behind the
  scrollbar. Proposed: the tooltip page grows from 320 x 240 to 320 x 284 and the chart from 140 to 184 high, which
  shows 6 rows; the report can't know how many values a field has, so beyond that the scrollbar stays.
- **Tests first (failing):** `report-check.mjs` gets `tooltipPageProblems(files)`: the tooltip chart is a bar chart
  with these four settings, and its height gives the rows the rule promises (4, or 6 after decision 2). In `pbip.mjs`
  (sample data, both languages) and `mcp/test.mjs`. Before: every report with a bound tooltip page fails; after: 0.
- **Expected in Desktop (hover and the page itself):** every category name whole and horizontal with its value,
  "Abu Dhabi" and the Arabic names included, no "…"; 4 rows (6) without a scrollbar; the card as before.
- **Fixtures:** none change.

**0.4 Tooltip transparency: measured, not possible in Power BI Desktop.**
- **Measured:** the tooltip is opaque at 0, 10, 15 and 20 alike (pixels inside it are exactly the card colour, light
  and dark, also where a dark bar is behind it). Still opaque with the page background at 100, the wallpaper at 100
  or removed, and with the hovered visual's own tooltip transparency or background colour set. Desktop draws a report
  page tooltip on an opaque box; no setting tried shows the page through it.
- **Plan:** nothing is built. **Decision 1:** drop it (proposed), or the owner checks one published report in the
  Power BI service, which the builder can't do from here.

**0.5 Table header alignment** (closes the open item). Module: visual builders (table); `assets/js/pbip-bind.js` (a
bound field says whether it is a number).
- **Measured:** one `columnFormatting` entry per column, selector `{ metadata: <the column's queryRef> }`, with
  `alignment` and `styleHeader`, `styleValues`, `styleTotal` on, puts each header over its own values: text `Left` and
  numbers `Right` in English; text `Right` and numbers `Left` in Arabic, where the text column is the rightmost. The
  columns still fill the width.
- **Change:** every table column gets that entry: measures and columns of a number type on the number side, other
  columns on the text side; a column whose type the files don't give (DAX tables) follows how it was picked (as a
  category: text). The sample data's table the same way.
- **Tests first (failing):** `report-check.mjs` gets `tableProblems(files)`: each column of every table has exactly
  one entry with its queryRef, the alignment its type and the report's direction ask for, and the three switches on.
  `pbip.mjs` (54 designs x 2 languages, both downloads), `mcp/test.mjs`. Before: the default report has 2 tables of 4
  columns: 8 of 8 fail; after: 0.
- **Expected in Desktop:** each header over its own values; English: Region left, three number columns right;
  Arabic: المنطقة right, numbers left.
- **Fixtures:** none change.

**0.6 Transparent card fill, so the panel and its accent bar show.** Module: visual builders (card).
- **Measured:** the solid fill is the card visual's own default (`fillCustom`, on in the theme's background colour),
  not the theme and not `visualContainerObjects.background`; it covers the card below its title, so the accent bar
  shows only as a sliver. `fillCustom: [{ properties: { show: false } }]` **with no selector** removes it and the bar
  shows whole (side bar and top bar, English and Arabic, light and dark); the same entry with the `default` selector
  is ignored. **Other types:** charts, slicers and text boxes have no fill; the table's header and rows have their own
  (the theme's colours, the same as the panel, so nothing is hidden: decision 5); buttons are filled by design.
- **Change:** every card (KPI cards, the tooltip card, the phone) gets that entry. Reports without a background image
  (the MCP's) look the same as today: there the panel is the theme's visual background in the same colour.
- **Tests first (failing):** `cardProblems` (`pbip.mjs`) and the card checks in `mcp/test.mjs`: each card has
  `fillCustom` with `show` false and no selector. Before: every card on the 54 designs and both downloads fails (the
  default report: 7 KPI cards and the tooltip card, 8 of 8); after: 0.
- **Expected in Desktop:** on the website download every KPI card shows its accent bar whole (left in English, right
  in Arabic, on top on the dark design) and the panel's border and shadow; numbers and titles unchanged.
- **Fixtures:** none change.

**0.7 The card title's margin.** Module: visual builders (card), sizes (`cardFit`).
- **Measured:** the title touches the top because **the card's container padding is ignored**: we write `padding`
  and `spacing` with the `default` selector, and the card is the same with them, without them and with top 30. With no
  selector both apply. So today the title sits 0 from the top and from the side, and **with a side accent bar the
  title is drawn over the bar**. On the real panels: top 8 on 1080 (5 on 720) is clear but tight, **12 (8) is the
  smallest that looks right**, 16 and up looks loose; on the bar's side 22 (15) just touches the bar, **26 (17) leaves
  a clear gap**. The number stays whole at every step.
- **Change:** `padding` and `spacing` are written with no selector (on the page and in `mobile.json`); the top
  padding becomes `round(12k)` (k = page height / 1080: 12 on 1080, 8 on 720), scaled like the other paddings; the
  other sides stay `P` (8 on 1080, 5 on 720). Where the page has a side accent bar the padding on that side is the
  bar's end plus `round(5k)` (26 on 1080, 17 on 720; **needs the owner's yes, decision 4**): a new engine function
  gives it and the callers pass it per page, so `projectPages` and its fixtures stay as they are. The tooltip card and
  the phone cards keep `P` on every side. `cardFit` takes the four paddings and reserves them:
  value = min(callout, floor((h - top - bottom - 2I - title line) / 1.5), floor((w - start - end - 2I) / 5.13)).
- **Expected numbers:** default cards keep their value size (1080: 454 x 144, room for 54, value 42; 720: 96 high,
  room for 36, value 28; tooltip card 20; phone card 20). The lowest KPI height on 1080 (96) goes from 24 to 22. Any
  pinned value size that moves (small pages) is listed with its reason for the reviewer before the code; none is
  edited to pass. The 640 x 360 cards stay an open item: there the padding now really takes room.
- **Tests first (failing):** `cardProblems`: `padding` and `spacing` have no selector; the top padding is
  `round(12k)` on main pages; with a side bar the start-side padding clears it; the height and the width the card
  needs (from the written paddings) fit its box. Before: every card fails on the selector; after: 0.
- **Expected in Desktop:** the title clear of the panel's top (12 on 1080, 8 on 720), not over the accent bar, the
  number whole and centred, on both pages, the tooltip and the phone; English and Arabic.
- **Fixtures:** none change (they hold no card sizes).

#### Round 1: phone text, and the slide-in panel in Desktop (branch `fix/phone-text`)
**1.1 Phone text sizes (module: phone layout, with the sizes module's rules).**
- **Cause (seen in Desktop 2.158, `DESKTOP-TESTS.md`):** phone slots are fixed (title 56, page buttons 44, slicer 64,
  button 40, charts 190-270 on the 323-wide canvas) but only cards have phone sizes in `mobile.json`; the rest keeps
  the page's text (15pt on 1080: slicer boxes cut, 76 needed in 64; 30-40pt on 2160: nothing fits).
- **Measurement M1 (before any code), English and Arabic, on a 1080 and a 2160 report:** for each visual type,
  whether a size written in `mobile.json` is used in the mobile layout, and the height the text then needs on the
  phone canvas: slicer (header and items), Reset and other buttons, page buttons (default, hover, selected), chart and
  table titles, and the header title (can a text box's `general.paragraphs` be overridden in `mobile.json`?). Read
  the properties from a report where the owner (or UI Automation) changed one size in the mobile layout and saved.
- **Change:** each visual's `mobile.json` gets sizes that fit its phone slot, the same on every page size, as cards
  have: slicer header and items 10pt (rule 16 + 4 x pt = 56 <= 64); buttons 10pt (6 + 1.6 x pt = 22 <= 40), the Reset
  icon by `resetFit` on the phone width; page buttons 10pt in all three states; chart and table titles 12pt; the
  header title 14pt if a text box can be overridden, otherwise its slot grows to what the page's size needs. The
  numbers are the plan's starting point: where M1 shows another need, the measured one is used and written down.
- **Tests first (failing):** `report-check.mjs` reads each visual's phone size (the `mobile.json` override, else the
  page's) and checks it against its phone box with the measured rules; `pbip.mjs` on the 54 designs plus the 16
  layouts at 640 x 360 and 3840 x 2160, `mcp/test.mjs` on the five "Sizes" reports. Expected before the fix: every
  design with a slicer fails at 1080 and up (76 > 64), every 2160 design fails on title, page buttons, slicers and
  Reset; after: 0. Cards and phone positions unchanged; no fixture changes.
- **Desktop check:** `phone-check.ps1` (extended to scroll the phone canvas, so the whole page is captured, not only
  its top) on EN and AR at 1080, 720 and 2160. **Expected:** every title, slicer box, button and page button whole
  on every phone page, no "...", no overlap; cards as before (title 10, value 20).

**1.1b The phone card padding selector (owner 2026-10-01, from round 0).** `mobile.json` writes the card's container
padding with the `default` selector, which Desktop ignores on the page (measured in round 0). Check it in the mobile
layout and write it without the selector if it is ignored there too, with `cardFit` on the phone box unchanged.

**1.2 Slide-in panel checked in Desktop (never done; no code planned unless it fails).**
- Reports: the design with `slidePanel: true`, EN and AR at 1080 and 720, built over stdio, and one website download
  (EN 1080) to cover that path. New script `builder-scripts\panel-check.ps1`: Ctrl+click on Filters, capture, pick a
  slicer value, Ctrl+click Close, capture (only on a "Gulf Sales ..." window; otherwise one batched request to the
  owner: 3 clicks per report).
- **Expected sizes (page units; label text 15pt on 1080, 10pt on 720):**

  | | 1920 x 1080 | 1280 x 720 |
  |---|---|---|
  | Filters button ("☰  Filters" / "☰  الفلاتر") | 144 x 48 | 96 x 32 |
  | Panel | 360 x 951 at x 1536 (Arabic: x 24), y 105 | 240 x 634 at x 1024 (Arabic: x 16), y 70 |
  | Close ("✕  Close" / "✕  إغلاق") | 104 x 32 | 69 x 22 |
  | Slicers | 3, each 76 high | 3, each 56 high |
  | Reset | 40 high, with its icon | 27 high |

- **Expected in Desktop:** Filters whole in the header, on the logo's side; the panel opens over the page under it
  with its card, "Filters" / "الفلاتر", Close whole, three slicers whole, Reset whole; a chosen slicer value stays
  after Close; the panel is hidden again; Arabic mirrored (panel on the left, Close at its left). A failure is
  reported with its measurement and a proposed fix, not fixed in the same step.

**1.3 The page button "Executive…" cut on the website's 1080 download (owner 2026-10-01, seen in round 0).** On
1920 x 1080 with Segoe UI the first page button reads "Executive…"; on 1280 x 720 it is whole, and on the MCP's
reports (Tahoma) it wraps on two lines and is whole. The width rule assumes a long name wraps on two lines when the
header holds them. **Measure first (Desktop, English and Arabic, Segoe UI and Tahoma, 1080 and 720):** when a page
button's text wraps and when it is cut, and the width a name needs on one line at each size. Then fix the
page-button width rule (module: sizes, page assembly) with a failing test in `report-check.mjs` first.

**1.4 The header title and logo centred vertically in their boxes on big pages (owner 2026-10-01).** They sit at the
top of their boxes. Measure what a text box and an image offer for vertical alignment in Desktop, then centre them
(module: visual builders), with the placeholder "Your logo" included.

**1.5 Phone padding at 3840 x 2160 with a side bar (owner 2026-10-01, with 1.1 and 1.1b).** Since round 0 the card's
page padding is applied, and the phone takes it (top 24, side 52 on 2160), which leaves a phone card too little room.
Fixed together with 1.1b (the phone's own padding without the selector) and checked on the phone at 2160.

**1.6 The tooltip chart shows the hovered item's trend by month (owner's choice 2026-10-01).** The tooltip's chart
becomes the measure by month for the hovered item; when the page's charts are themselves by month, it falls back to a
second category. **Measure first:** month labels at tooltip size (320 x 284), English and Arabic, as a line or column
chart and as a bar chart: which names are whole, and how many months fit. Module: page assembly (the tooltip page);
`pbip-bind.js` for the choice of field.

**1.7 The header band and the filter rail on a solid design (owner 2026-10-02, seen in `fix/mcp-visual-style`).** On
a solid design (the MCP's reports) the cards, charts and tables are rounded with a shadow, drawn by the theme, while
the header band and the filter rail have square corners and no shadow: they are drawn by their groups, and a group
has no border or shadow setting (only a background, which can be switched off). **Measure the options in Desktop
first, then plan:** for example a rounded shape behind the header and behind the rail, styled from the theme's panel
settings (card colour, the design's corner radius, its shadow), with the groups' own backgrounds switched off; also a
text box used as the panel, as the slide-in panel's card already is. For each option, in English and Arabic, light
and dark, at 1080 and 720: does it match the panels beside it (corners, shadow, colour), does it stay behind the
title, page buttons, logo, slicers and Reset, and how does it behave in the phone layout and in the selection order.
A transparent design (the website's download) is not to change: there the background image draws the band and rail.

#### Round 2: Arabic accuracy (branch `feature/arabic-accuracy`)
**2.1 Arabic display names in `create_report`.**
- **Change:** `create_report` takes optional `displayNames`: `{ "Table[Field]": "name to show" }`. The report shows
  that name wherever it shows the field: KPI card titles, chart titles ("X حسب Y" built from the given names), slicer
  headers, table column headers, axis and legend, the tooltip page. The model is never renamed. In an Arabic report
  the result lists, under `arabicNames.missing`, every field the report uses that has no display name and whose model
  name has no Arabic letters, with one line on how to pass them; names given for fields the report doesn't use are
  listed as not used. **No translation is ever made up**: a field without a name keeps its model name.
- **Modules:** visual builders (a bound field carries an optional name: titles through `label`, the query projection's
  display name), page assembly (tooltip page titles); `mcp/server.mjs` (input, the missing list). The website's field
  picker is not changed in this round.
- **Measurement M2.1 (before any code):** in Desktop rename a field "for this visual" on a chart, a table, a slicer
  and a card, in an English and an Arabic report, save, and read what is written (expected: `displayName` on the
  projection; the slicer's header may need `header.text`, as Microsoft's `slicers.md` says).
- **Tests first (failing), `mcp/test.mjs`:** an Arabic report on the sample model with names for some fields: every
  title, header and projection of a named field shows the given name; `arabicNames.missing` is exactly the used
  fields without one; an English report has no such list; without `displayNames` a report is the same as today apart
  from random ids. `pbip.mjs`: the engine with and without names. No fixture changes.
- **Desktop check:** Gulf Sales in Arabic at 1080 and 720 with names for every used field: no English field name on
  any page, phone page or the tooltip; the same report with two names left out: those two show in English and are
  the two listed. English 1080 and 720: unchanged.

**2.2 Sort order and format strings as health findings with ready TMDL scripts.**
- **What exists today:** the engine already finds `MONTH_SORT` (month and day names without a sort column, English
  names only), `NO_FORMAT` (info) and `PCT_FORMAT` (a format that isn't a percentage); the website builds a TMDL
  script for the sort (`model-health.js` picks the sort column, `model-health-tmdl.js` writes it); the MCP's
  `check_model_health` returns findings without scripts; `create_report` has its own three `modelNotes` rules.
- **Change (`model-health-engine.js`, `model-health-tmdl.js`, `model-health.js`, `mcp/server.mjs`):**
  - the choice of the sort column and the fix edits move from the website's page code into the shared engine, so the
    website and the MCP give the same script; `check_model_health` returns `fixScript` (TMDL) and `byHand` per
    finding; `modelNotes` in `create_report` uses the same rules and points to the health check;
  - day names: sorted by the model's weekday number column when there is one; when there is none, the script adds
    one. The week start is a choice by country (owner 2026-10-01): `check_model_health` takes
    `weekStart: 'sunday' | 'monday' | 'saturday'`, **Sunday by default** (Saudi Arabia and most of the Gulf:
    `WEEKDAY(date, 1)`), Monday for UAE companies on the Saturday-Sunday weekend (`WEEKDAY(date, 2)`), Saturday as an
    option (`MOD(WEEKDAY(date, 1), 7) + 1`); the finding says which start the script uses and how to ask for another;
  - month names: by the month number column, or the script adds `MONTH(date)`; "Month Year" by a year-month number;
  - Arabic column names (اسم الشهر, اسم اليوم, الشهر, اليوم) are recognised too;
  - measures without a format string: a **suggested** script that sets one on each measure the builder can rewrite
    safely, with the reason shown beside each measure, never applied automatically (owner 2026-10-01): a name that
    reads as a percentage (%, pct, rate, ratio, share, margin, نسبة, هامش) gets `0.0%`; a count (COUNT, COUNTROWS,
    DISTINCTCOUNT) or a sum of a whole-number column gets `#,0`; every other measure `#,0.00`; measures the builder
    must not rewrite are listed "by hand".
- **Known limit to measure first (M2.2):** the columns of a DAX table (the calendar generator's calendars, our Gulf
  Sales sample) can't be rewritten under `ref table` (TMDL rejects it, confirmed in Desktop earlier), so today they
  go to "by hand". Measure in TMDL view on the sample model whether a `createOrReplace` of the whole DAX table (its
  expression with the new number column, and `sortByColumn`) is accepted and keeps the relationships and the report
  working; if not, these stay as exact by-hand steps and the plan says so. Also measured: the script from an imported
  calendar; scripts carry the files' lineage tags.
- **Scores must not move by accident:** the new details ride on the existing findings (`MONTH_SORT`, `NO_FORMAT`), so
  the scores and finding counts the tests expect stay as they are. Before coding, every expected number that a change
  would move (for example Arabic names newly found) is listed with its reason for the reviewer; no expected number is
  edited without that.
- **Tests first (failing):** `scripts/tests/model-health.mjs` (the website) and `mcp/test.mjs`: on the `tmdl-ramadan`
  and `health-project` fixtures and a small model of our own with a day name, a month name and a ratio measure: the
  finding carries a script; the script names the right sort column; the Sunday (default), Monday and Saturday
  versions differ only in the weekday expression; each suggested format has its reason; a DAX table goes where M2.2 says; a measure with a format string is never in the script; the
  website's script equals the MCP's.
- **Desktop check (owner applies each script in TMDL view: one batched request), on a copy of the sample model, with
  an English and an Arabic report at 1080 and 720. Expected:** days in the column chart, table and slicer run
  Sunday to Saturday (the default script), Monday to Sunday or Saturday to Friday (the other two), months January to
  December; the % card
  shows 34.0% instead of 0.34; the table shows 101,914 where the card shows 101.91K; running the health check again
  finds neither issue; nothing else in the model changed (TMDL diff: only the named columns and measures).

**2.3 The sample download opens with "One or more calculated tables need to be manually refreshed" (owner
2026-10-01).** Find out why (the sample table is a DAX table in a `model.bim` without data) and avoid it if the
project can carry what Desktop needs; otherwise add one line of instructions to the download (the README already
says to refresh once; put it where the visitor sees it). Measure in Desktop first: what removes the banner.

#### The owner's answers (2026-10-01), applied above
1. `b931ecd` is tagged `round-phone-and-sizes` (pushed); `fix/phone-and-sizes` is deleted, locally and on GitHub.
2. `create_report` gets a `logo` input (a file inside the working folder): round 0.2.
3. The logo box takes the logo's shape; no 100 minimum for an attached logo: round 0.2.
4. Microsoft's report CLI is installed as a reference (0.4.0); Desktop stays the final check.
5. Week start by country: Sunday by default, Monday for UAE companies on the Saturday-Sunday weekend, Saturday as an
   option: round 2.2.
6. Formats: `#,0` for counts and whole-number sums, `#,0.00` otherwise, as suggested scripts with the reason shown,
   never applied automatically: round 2.2.
7. Display names as `{ "Table[Field]": "name" }`: round 2.1.
8. The tooltip chart becomes a bar chart; tooltip transparency starts at 15 within 10-20 (measured since: not
   possible, decision 1 below).

#### The owner's answers to the five round 0 questions (2026-10-01)
In the GO block of round 0: transparency dropped; tooltip page 320 x 284; tall logos keep their ratio, with a note;
card title margins 12k and the bar-side padding; the table's fill stays. No decision is open.

## Open items (flagged, need the owner's go before any work)
- **Next round, after `fix/phone-and-sizes` (owner 2026-10-01; plan only, then "go"):**
  - **Arabic reports show English titles** ("Total Sales حسب Quarter", English KPI names, table headers, slicer titles):
    measure and column names come from the model. Plan: `create_report` takes optional display names per field; in
    an Arabic report, every field without an Arabic name is listed in the notes. No made-up translations.
  - **Days and months sort alphabetically** (Friday, Monday, ...; April, August, ...): `Calendar[Day Name]` and
    `Calendar[Month Name]` have no sort-by column (in `modelNotes` since "Gulf Sales AR 3"). Plan: a model health
    finding with a ready TMDL script that sets the sort column for day and month names, covering a week that starts on
    Saturday or Sunday. The model is still never changed without the user.
  - **Measures without a format string**, as model health findings: the % card shows 0.34 (Sales[Total Sales vs Last
    Ramadan %]); the table shows 101914 while the cards show 101.914K.
- **Small-page round, with the 640 x 360 cards (after the beta, owner 2026-10-01):**
  - **KPI cards cut at 640 x 360** (already on main): the numbers in the 42- and 48-high cards are cut at the bottom.
    Measured (2.158, `scripts/tests/DESKTOP-TESTS.md`): 8pt title / value 12 needs 48, value 14 needs 56 on 640 x 360,
    but 44 on 1920 x 1080 and 3840 x 2160; 42pt cards on 1080 need 88 (126 and 144 fine). No single rule fits yet:
    measure 1280 x 720, 960 x 720, 1366 x 768, 700 x 525, 2560 x 1440 and 640 x 360 again (steps of 2, the card as
    `cardFit` writes it there), then a rule by page size or a table; 1080 and up keep 42-60 (owner).
  - **Long KPI titles end in "..."** on 640 x 360 (8pt, Power BI's minimum).
  - **Charts on 640 x 360:** month and day labels slanted and cut ("Wednes..."); "Total Sales by Quarter" hides Q4
    behind a scrollbar.
  - **Detail table on 640 x 360:** shows two rows with scrollbars, and its fourth column is cut.
- **Table header alignment** (seen on "Gulf Sales AR 3"): headers are left aligned while numbers are right aligned,
  so on a wide table each number sits nearer the next column's header than its own. **Now in scope: round 0.5**
  (owner 2026-10-01), see "Next step".
- **Flaky tests on a busy laptop:** `consent` ("Berlin: no banner") and `anchors` (home page #contact) failed once
  each under load and pass alone. They don't use `ready()` yet (`scripts/tests/lib.mjs`).
- **Phase 3:** background PNGs from the engine's SVG (first test whether Power BI accepts the SVG itself).
- **Roadmap after that:** Arabic/right-to-left and Gulf DAX in a private repo, then packaging (`mcp/ROADMAP.md`).

## How to work (short)
- Plan first, wait for "go"; tests first; one writer on the repo at a time; branch → push → the reviewer tests and
  merges; never merge yourself. Keep the laptop awake during full runs.
