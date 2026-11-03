# RD8: add a page to an existing report (as a copy)

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov night), "Go for 10 r&ds during the night ... choose the best r&ds ideas
  that will best fit our code and make us shine"; the scout's brief RD8 (`rd/0.3.2-scout`,
  `mcp/research/SCOUT-0.3.2.md`); the capability map's row 1 (`mcp/plans/CAPABILITY-MAP.md:28`).
- **Scope:** research only: this file and scratch scripts under `mcp/research/rd8/`. No product file changes.
- **Base:** `rd/0.3.2-add-page` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite runs (no product file changes). The prototype runs on made-up reports in
  `os.tmpdir()` only: the twin fixture and two lab reports built by the repo's own engines.
- **Expected numbers (to beat or explain):** pages after = pages before + 1; files byte-identical = every file
  before, except `pages.json` (one id appended); added files = the page's `page.json` + one `visual.json` per
  visual; validator 0 errors; 0 page-id and 0 visual-name clashes; bookmarks pointing where they did = all.
- **Got (measured, `rd8/add-page.mjs`, `rd8/results.json`):** yes, it can. On 3 reports: validator 0 errors on every
  copy, 0 fresh dangling references, 0 page-id clashes, every bookmark where it was, the active page unchanged, the
  Arabic report gets an Arabic right-aligned page. Five expectations were wrong, each explained in (d): one page is
  3 pages (2 tooltip pages come with it); 3-4 original files change, not 1 (by additions only); the page brings a
  picture and extension measures; 2 extension measures clashed by name with different DAX; and the page's look
  rests on 73 theme style properties the report's theme does not have.
- **Recommendation:** a plan_layout input `into` (an existing report), written by redesign's copy-and-patch through
  a patch-kind registry with a new kind "page". Not a 12th tool. Builder brief: size L, risk M-H (g).
- **Resume:** done; the owner picks whether the builder brief (g) goes out, and the 3 decisions in (e).

## The plan
1. (a) Today's code. 2. (b) Microsoft's docs. 3. (c) 2-3 ways with size and risk, the registry as the design.
4. (d) A measured prototype. 5. (e) The recommendation, (f) the Desktop checks, (g) a builder brief.

## a) Today's code
- **The copy-and-patch** (`mcp/lib/redesign.mjs`): `ALLOW` (`:121`) is one literal of JSON pointers per file kind
  (visual, platform, theme, report); `kindOf` (`:127`) maps a file to its kind. `buildCopy` (`:403`) copies every
  byte and applies `set`/`remove`/`add` patches; `add` may only create a file the original lacks. `verifyCopy`
  (`:471`) refuses any lost file, any added file that is not one `StaticResources/RegisteredResources/*.json` (the
  CS1 text theme), any changed pointer outside `ALLOW`, any change to `report.json` that is not an addition, any new
  dangling reference (`danglingOf`, `:427`: page order, active page, bookmarks, buttons, tooltips, groups, theme),
  and any change in an opaque payload (filters, bindings, bookmarks by hash). A new page breaks three of these
  today: added files under `definition/pages/`, a pointer appended to `pages.json`, an item appended to
  `report.json`'s resources. That is the scout's weakness 4 exactly.
- **Adding pages to a copy already exists, in another module:** the EN-AR copy (`mcp/lib/twin-copy.mjs:129`
  languageCopy) appends the Arabic pages to `pageOrder` (`:269-276`), registers their pictures in `report.json`
  (`:279-288`), gives fresh page ids and visual names (hashes, never one the report has, `:233-240`), writes a new
  `.platform` (`:26` newPlatform, `:294-297`). Its added-files list is the shape a "page" kind needs; it is not
  checked by `verifyCopy` (the twin has its own checks).
- **One page:** `assets/js/pbip-page.js:322` write(c, pg, pageIndex) writes one page.json and its visuals in reading
  order, but needs the whole build context `c` (fonts, theme tokens, tooltip pages, extension measures). The
  practical unit is `reportRun(a, 'build')` (`mcp/lib/report-run.mjs:50`): a whole report in memory, from which the
  prototype takes one page and what it names.
- **The theme:** plan_layout with `path` already starts a design's colours from the model's own report
  (`mcp/tools/plan_layout.mjs:130`, `read-report.mjs:532` existingTheme, `:483` reportTheme). Measured: on the twin
  fixture `colours.from` = "report theme". A DataArcus-built report is skipped (its `generatedBy`), so on the lab
  reports built by DataArcus the colours were the engine's own (SP21's move of the identity does not change this).
- **Language:** plan_layout's `lang` is given by the caller; nothing reads a report's language today.

## b) Microsoft's docs (Learn, "Power BI Desktop project report folder", PBIR format; "Use Report view")
- PBIR is documented "to support modifications from non-Power BI applications"; one of its listed scenarios is
  "Copy pages/visuals/bookmarks between reports".
- Object names (page, visual, bookmark folders) are word characters or hyphens; a name outside it is ignored by
  Desktop (the page silently missing). The prototype's names: all pass.
- `pageBinding.name` (drillthrough, tooltip pages) must be unique in the report ("Values for the
  'pageBinding.name' property must be unique"); GUIDs by default since June 2024. Measured: unique on all 3 copies.
- `pages.json` is optional; an invalid `activePageName` is a non-blocking error Desktop fixes on open.
- Copy-paste between reports: "Visual elements that rely on a theme or the default settings automatically update
  to match the theme of the destination report." This is the theme finding in (d) said by Microsoft: what a page
  takes from its theme, it takes from the report's.

## c) Three ways
| Way | What | Size | Risk | Fit |
|---|---|---|---|---|
| A. plan_layout `into: "<report>"` | the plan builds one page with plan_layout's own design, colours from that report (existingTheme with `themeFrom` = it), its page size and language read from it; create_report writes the copy by copy-and-patch | L (about 450 lines with tests) | M-H | the whole planner, checks, preview and gate as they are; one input, no new tool |
| B. redesign patch kind "page" only | the redesign takes a page spec (KPIs, chart, table) as a patch | M | H | redesign has no field binding or layout engine: it would re-grow plan_layout inside redesign |
| C. a 12th tool add_page | its own plan and write | L+ | M | the instructions sit at their cap (`agent-text.mjs:9`); the owner chose "an option, not a 12th tool" (C) |

**The design (all three need it): the patch-kind registry.** Each kind declares, in one entry: the files it may add
(a regex: "page": `definition/pages/<new id>/**`, `StaticResources/RegisteredResources/<new name>.png`), the
pointers it may set or append (`pages.json` `/pageOrder/<n>` for n past the original's length; `report.json`
`/resourcePackages/<i>/items/<n>` appended; `reportExtensions.json` `/entities/<i>/measures/<n>` appended), whether
the original's values may change (for "page": never, additions only), and its own verify step (new ids not in the
original, case-insensitive; names match `[\w-]+`; pageBinding names unique). `verifyCopy` reads the registry
instead of `ALLOW`/`kindOf`; today's kinds (visual, platform, theme, report) become its first four entries, with
no change of behaviour (a test: every 0.3.1 redesign plan's patches and copy check give the same answer). RD4
(skins) and RD6 (phone layout) add their kinds the same way.

## d) The measured prototype (`mcp/research/rd8/add-page.mjs`, results in `rd8/results.json`)
How: copy the report's bytes; plan_layout on its model (`page` = its first non-tooltip page's size, `lang` = its
own, exec layout, 2 KPIs); `reportRun(..., 'build')`; take the main page, the tooltip pages its visuals name, the
pictures they name and the extension measures; add them; append to `pages.json`; register the picture; merge the
measures; new `.platform` ("<name> plus"). Then Microsoft's validator (the authoring CLI) on original and copy,
`checkArtifact` with the model's tables (validator skipped there), `danglingOf` before and after.

| Measure | Twin Sales (fixture) | Gulf Retail (sample) | Gulf AR (Arabic lab) |
|---|---|---|---|
| language read from the report | en | en | ar |
| pages before / after | 3 / 6 | 1 / 4 | 3 / 6 |
| pages added (main + tooltip) | 3 (1 + 2) | 3 (1 + 2) | 3 (1 + 2) |
| original files byte-identical | 27 of 30 | 3 of 6 | 42 of 46 |
| original files changed (additions only) | pages.json, report.json, .platform | same 3 | same 3 + reportExtensions.json |
| files added | 32 | 32 | 31 |
| page-id clashes / pageBinding unique / names `[\w-]+` | 0 / yes / yes | 0 / yes / yes | 0 / yes / yes |
| extension measures: same name, same DAX / different DAX | 0 / 0 | 0 / 0 | 4 / **2** |
| bookmarks where they were / fresh dangling refs | 2 of 2 / 0 | none / 0 | none / 0 |
| validator errors original / copy | 0 / 0 | 0 / 0 | 0 / 0 |
| validator warnings added | +1 PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR | +1 same | +1 same |
| rules added by the page | TOOLTIP_SCROLL 1, COVER_CARDS 1 | same | same (both also on the original, built by DataArcus) |
| new page size / report's pages | 1280x720 / 1280x720, 1920x1080, tooltip | 1280x720 / 1280x720 | 1280x720 / 1280x720, tooltips |
| new page: Arabic letters, right / left aligned | 0, 0 / 12 | 0, 0 / 12 | 674, 12 / 0 |
| theme style properties the page needs that the report's theme lacks | 73 (5 visual types) | 73 | 0 (the report is DataArcus's) |

What the five wrong expectations teach:
1. **One page is 3 pages:** the build gives each chart its tooltip page. The plan must list them (hidden pages).
2. **Not 1 file changed, 3-4:** `report.json` (the page's background picture registered), `.platform` (name, id),
   `reportExtensions.json` (the page's measures). Each change is an addition; a registry entry can prove it.
3. **The extension-measure clash is real:** on Gulf AR two measures ("Keep: Total Sales by Channel" and the
   Arabic title measure) had the same names and different DAX (a different top-N). The prototype kept the
   original's, so the new page would silently show the original's top-N: wrong. A clash needs a fresh name and the
   new page's references rewritten (or a refusal); same name and same DAX is reused.
4. **The look rests on the DataArcus theme:** the page's visuals carry 31 literal colours but 0 theme colour
   references, and 73 text and card style properties come from the DataArcus theme's `visualStyles`, which the
   twin's theme does not have. As Microsoft says (b), those take the report's theme: the page will not look like
   its preview. Changing the report's theme is not allowed (it restyles the old pages), so the page must carry them.
5. **Page size:** a report can mix sizes (Twin Sales: 1280x720 and 1920x1080). The plan must say which it chose.

## e) The recommendation
Way A: `plan_layout` with `into` (one of the model's own reports, by name as `colours.otherReports` lists it), and
`create_report` writing "<name> plus" next to it by copy-and-patch, verified by the registry's kind "page". It reuses
the planner, the field checks, the exact build check, the preview and the approval gate as they are; the only new
engine is the registry (which RD4 and RD6 need too) and the page's extraction. Decisions for the owner:
1. The look: bake the 73 style properties onto the new page's visuals (it looks like its preview, and the old
   pages are untouched), or let the page take the report's theme (it looks like the report, not like the preview).
   Recommended: bake, and the preview is drawn with the report's colours (they already are).
2. A clashing extension measure: renamed with a suffix ("Keep: Total Sales by Channel 2") and said in the plan.
3. The copy's name: "<name> plus" (proposed by the brief), cut to `NAME_MAX` 30 like redesign's `nameOf`.

## f) The Desktop checks (one batched laptop run)
1. The copy opens with no error and no "Apply external changes" correction.
2. The new page draws with the report's colours; its cards, titles and table text look as in the plan's preview
   (with the 73 properties baked); the old pages look exactly as in the original (side by side).
3. The new page's tooltips open their tooltip pages; the tooltip pages are hidden in the tabs.
4. Bookmarks and page buttons of the old pages go where they went; the report opens on its old active page.
5. On the Arabic report: the new page reads right to left (cards from the right, titles right-aligned, the chart
   mirrored as the twin draws it).
6. A clashing extension measure: the new page shows its own top-N, the old page its old one.

## g) Builder brief (size L, about 450 lines with tests; risk M-H: the look in Desktop and the measure rename)
- **Base:** a branch from `integration/0.3.2` (or 0.3.3), after SP21. Tests first, by risk.
- **Step 1, the registry, no behaviour change:** `mcp/lib/patch-kinds.mjs` with today's 4 kinds; `verifyCopy` and
  `kindOf` read it. Test: every redesign suite passes unchanged; a hand-made copy with a page added is refused.
- **Step 2, kind "page":** added files under a new page id (not in the original, case-insensitive), pictures under
  a new name, appends to `pageOrder`, `resourcePackages` items and `reportExtensions` measures; nothing of the
  original changes. Tests (made-up, in tmp): the 3 reports above, every row of (d)'s table as a check.
- **Step 3, plan_layout `into`:** reads the report (one of the model's own, never one outside, never the original
  written), its page size (asks when mixed), its language (said in the plan, never silent), its theme colours;
  plans one page; the answer lists the pages added (tooltip ones included), the files changed by addition, any
  measure renamed. Test: no plan id when the report can't be read or is PBIR-Legacy.
- **Step 4, the write:** `create_report` with the plan id writes "<name> plus" by `buildCopy` + `verifyCopy`, the
  digest-pinned files, exclusive create. Tests: the original's bytes unchanged after the write; validator 0 errors.
- **Step 5, the look:** bake the theme style properties onto the page's visuals (decision 1). Desktop checks (f).
- **Files:** `mcp/lib/patch-kinds.mjs` (new), `redesign.mjs`, `report-run.mjs`, `tools/plan_layout.mjs`,
  `tools/create_report.mjs`, `report-inputs.mjs` (the input), `TOOLS.md`, `CHANGELOG.md` [Unreleased], one suite in
  `tests.json`.

## Decisions I made
1. The prototype adds plan_layout's full exec page (2 KPIs, charts, a table) and not a hand-made minimal page: it
   is what the feature would write, so its tooltip pages, pictures and measures were measured too.
2. The language was read from the report's own texts (Arabic letters over 30% of letters): good enough for 3
   reports; the builder should reuse whatever SP21's identity reads, if it reads language.
3. The Arabic lab report was built by DataArcus itself (no hand-made Arabic report exists in the fixtures); this is
   why its theme gap is 0 and its measures clashed. A hand-made Arabic report is a Desktop check, not tonight.
4. `results.json` is committed: it holds only fixture page ids, bookmark names and counts (made-up data).

## Seen, not in scope
- Every DataArcus build adds PBIR_TEXTBOX_HEIGHT_BELOW_FLOOR (1 warning) and TOOLTIP_SCROLL and COVER_CARDS (1
  each) on an exec page at 1280x720: the engine's own, also on a fresh build; worth one look by the layout owner.
- `checkArtifact` without the model's tables reports every field as REF_UNRESOLVED (17 on the twin fixture); with
  them, 0. Any caller that passes `[]` gets a false block.
