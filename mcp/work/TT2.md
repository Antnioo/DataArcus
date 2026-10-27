# TT2 (0.3.1): the website's Arabic download asks for Arabic names first (drafted, approved, never silent)

## Summary
- **Approval:** the reviewer's brief "Go on TT2"; the owner, 27 Oct, D-1027-19 "Both A" (TT1-S1 in 0.3.1: the website's
  Arabic download lists the English names with Arabic drafts the person edits and approves before it builds, never
  silent); D-1027-04 (Arabic reports: no English titles, drafted and approved); D-1027-03 (a title all Arabic or all
  English).
- **The rule:** the Theme Generator's project download, Arabic, on the person's own model: every field the report's
  visuals show with no Arabic name is listed (its English name, an editable Arabic draft, a "keep English" choice).
  Drafts only from DataArcus's fixed words (assets/data/arabic-report-words.json, read by the same code as the MCP's
  proposeArabic); any other name starts empty. Nothing is built until each listed name is approved (Arabic text, or
  "keep English" ticked: never the default, written in the download's README). The approved names are the display
  names the titles use: each title wholly Arabic, or wholly English for a name kept English. English download unchanged;
  a model already named in Arabic, and the sample data, see no step.
- **Scope:** new engine `assets/js/arabic-names.js` (+ .min.js; the MCP's `mcp/lib/arabic-names.mjs` proposeArabic now
  reads through it: one reading); `assets/js/theme-generator.js` (one block, the download's gate);
  `assets/js/pbip-export.js` (`namesNote`: the README section, only when given); the lab page (`#pbipNames` box), its CSS
  and ?v= stamps; tests. Not design-engine.js (TS1), not the twin files (TW1).
- **Base:** `fix/0.3.1-arabic-names-site` from `origin/integration/0.3.1` (13afb3a).
- **Expected checks:** (written before the work) tt2 (new MCP suite, about 12, red first: the engine does not exist on
  13afb3a); arabic-names (new website suite, about 12, red first: no step on 13afb3a, the Arabic download builds at once);
  pbip 111 = 111 (its four Arabic own-model downloads now pass the step, each with "keep English" chosen for every
  name, so their checks stay as they are: said per test); theme-generator-lab 920 = 920; lr1 and test.mjs's
  proposeArabic checks the same counts; full run: the base's suites + 1 (tt2).
- **Got:** tt2 13 (13 of 13 red on 13afb3a first); arabic-names 14 (12 of 14 red on 13afb3a first: W7 is the pin of the
  English download, W8 the no-step guard, both green there by design); pbip 111 = 111; theme-generator-lab 920 = 920;
  tt1 28 = 28, lr1 18 = 18; npm test arabic 15 suites; lint 0; full run: below.
- **Resume:** done; waits for the reviewer (the full-run line below, then CI on the branch).

## Plan
1. This note (commit, push).
2. Red first: `mcp/test-0.3.1-tt2.mjs` (engine: proposals equal proposeArabic, drafts only from the given words, the
   list from a build, approval rules, titles one language, README) and `scripts/tests/arabic-names.mjs` (the page:
   refused without approval, approved Arabic, one kept English, English unchanged, Arabic-named model no step, RTL at
   phone width, keyboard). Run on 13afb3a: red.
3. `assets/js/arabic-names.js` (UMD, `DAArabicNames`): `make(list).propose`, `toApprove(result, bind, list)`,
   `approve(items, answers)`, `withNames(bind, names, mapFields)`, `note(approval)`; mcp/lib/arabic-names.mjs uses it.
4. `pbip-export.js`: `namesNote` (string): appended to README.md; next to the person's project (no README there, it
   would replace theirs) as `<report>.README.md`.
5. theme-generator.js, its own block: Arabic page + own model: a trial build, `#pbipNames` listed; the approve button
   checks every row and starts the download; the approved names flow through withProject (download and preview).
6. pbip.mjs: its `run` helper passes the step with "keep English" for every name (the old checks unchanged).
7. build:min, ?v= stamps, csp, ar-pages, sitemap; suites; full run; CI.

## Results
Commits: plan d6152c4, red first a89c230 (re-pinned 126fc8e), the work c3e0cb8, CHANGELOG and this note (next).

| Before (13afb3a) | After |
|---|---|
| Arabic download on English names: built at once, titles wholly English ("Total Sales by Region", isolated) | not built: `#pbipNames` lists each name (English beside an editable Arabic draft, "Keep English" unticked) |
| no draft anywhere on the site | drafts only from arabic-report-words.json (same code as the MCP's proposeArabic); an unknown name empty |
| - | approve: each box Arabic (an Arabic letter, no invisible sign, at most 80) or "Keep English" ticked; else no build, the names said, the first box focused |
| - | approved: every title wholly Arabic («إجمالي المبيعات حسب الإقليم»); one kept English: its titles wholly English, the rest Arabic, none mixed |
| README: the report's text only | + "الأسماء العربية (Arabic names)": every approved name and every name kept English (by choice); next to the person's project, `<report>.README.md` (never their README.md) |
| English download | unchanged (W7: its files, pictures aside and random names numbered, equal to 13afb3a's) |
| model named in Arabic, sample data | no step (W8) |

Tests, red first (`red on 13afb3a first`): tt2 N1-N6c (13 of 13 red: the engine missing); arabic-names W1-W6, W9, W10,
W10b, W2b (12 of 14 red: no step, the download at once). Two of my own expectations fixed after red, before green: N5
named the column chart's title, which is a Top-N report measure (the literal is the line chart's); N6b expected the
local report's name from the model folder (it is the name given). W7's pin was re-taken on 13afb3a with the writer's
random names numbered in order (visual, filter and .platform ids are random per build: two base builds differed), and
two base runs then gave the same digest (e2d99eba...).
Moved on purpose (count the same): pbip.mjs's `run` helper: the four Arabic own-model downloads (Round 24 B1/B2 "Lean",
R24-1 "Two", LR2 a-d "Own", the published model "Exec Board") now meet the step (seen: 4 of 15 downloads asked) and tick
"Keep English" for every name, the person's explicit choice, so every check they hold is unchanged (LR2-a1's
"English names give wholly English titles" is now the kept-English case).
Rendered check: `scripts/tests/shots/tt2-names-ar-390.png` (the list at 390 wide, right to left, English names isolated);
W9 measures it (inside the screen, no sideways scroll, each English name `direction: ltr`, `unicode-bidi: isolate`).

## CHANGELOG line
- **The website's Arabic download asks for Arabic names before it builds:** in the Theme Generator, an Arabic project on your own model lists every field name the report shows in English, each with an Arabic draft you can edit. Drafts come only from DataArcus's fixed list of report words; a name the list doesn't hold starts empty for you to type. Nothing is translated by a service and nothing about your model is sent. The report is built only when you approve every name, either your Arabic name or "Keep English" for that name (your choice, never the default); then every title is wholly Arabic, or wholly English for a name you kept in English, and the download's README lists each name. The English download is unchanged, and a model already named in Arabic downloads at once.
(TT1's line said "the website's Arabic download, which has no step to approve names, writes the English title whole":
now "asks for the names first (below)".)

## Decisions I made
1. **Which names are listed:** every field the written visuals show (the writer's `bound`, from a build of the very
   input), not only the ones in chart titles: KPI titles, slicer headers and table headers show names too, and the MCP's
   arabicNames lists every field the same way. A superset of the titles' names, so no English name reaches an Arabic
   report unapproved.
2. **The words file is fetched** from the site itself (`/assets/data/arabic-report-words.json`, same origin, the one
   source), with the engine script; nothing about the model goes out (W2b: no other request). If either fails to load,
   the download fails with the existing "Could not build" message: never built with unapproved names.
3. **The gate is on the page, not in the writer:** pbip-export.js stays the MCP's writer too, whose own approval is the
   plan's (TT1). The writer only gained `namesNote` (the README section), and is byte for byte the same without it.
4. **"Keep English"** disables its box; the box's text is kept, so unticking brings the draft back. Approved answers live
   in the page only (never saved): a new field after a change of the picker is listed again with the earlier answers in
   their boxes, and needs the button again.
5. **An "Arabic" name with no Arabic letter is refused** (tick "Keep English" instead), so a title is never English by
   accident; an invisible sign is refused as the MCP's writtenName refuses it; at most 80 characters (the MCP's limit).
6. **The README beside the person's project** is `<report>.README.md` (the writer never writes README.md there: it
   would replace theirs); elsewhere the section follows the README's own text. Both languages, one table.
7. **The preview** shows the approved names once given; before approval it previews as before (the step guards the
   download, which is the file the person opens).
8. **One reading of the words:** proposeArabic moved into the shared engine whole (date compounds, patterns); one
   change on the way: a word is looked up as the list's own key only (`hasOwnProperty`), so a model name like
   "Constructor" can no longer pick up a JavaScript object property. Same drafts for every word and pattern (N1).

## For the owner
none

## Risky changes
- **The approval step (new, website):** the Arabic project download is held until every listed name is approved
  (theme-generator.js namesFor/askNames). It fails closed: if the engine or the words file cannot load, nothing is built.
- **Network:** the page fetches `/assets/data/arabic-report-words.json` from its own origin (allowed by its CSP's
  default-src 'self'), and loads `/assets/js/arabic-names.min.js`; no model data in either request (W2b).
- **File writing (writer):** `namesNote` adds a README section, or the file `<report>.README.md` next to the person's
  project (a new name of the report's own, never one of theirs); without namesNote, the files are unchanged (N6c, W7).
- **A test helper that changed what it passes:** pbip.mjs's `run` ticks "Keep English" when the step appears (4
  downloads); no check removed, counts the same (111).

## For the laptop (Power BI Desktop, part 3)
1. The lab page in Arabic, "My model: Power BI project on my PC", a made-up model with English names (as W's: Total
   Sales, Orders, Total Cost, Units, Customer, Territory, Month): Download project: the list shows; approve 3 names
   (say Total Sales, Orders, Territory typed «الإقليم»), keep 1 English (Customer), approve the rest as drafted.
   Record: the chart, KPI and table titles in Desktop: each wholly Arabic, or wholly English for Customer
   ("Total Sales by Customer", one run, right aligned like the others); none cut or with boxes; the README beside the
   report lists the names and Customer as kept English.
2. The same page in English: the download as before (no list), titles English.

## Seen, not in scope
1. plan_layout.mjs's englishTitles reads titles as this engine's toApprove reads the writer's `bound`; two readers of
   one build (the MCP's lists titles, the site's lists fields). One shared reader would be a later tidy-up.
2. The live (non-lab) Theme Generator page has no project card, so no step there; the step lives where the download is.
3. The page's floating WhatsApp button overlaps the list's last row at 390 wide while scrolling (the page's own button,
   seen in the screenshot).

## Lessons for the reviewer
- A "byte for byte" pin on a download needs the writer's random ids (visual, filter, .platform GUID) numbered first:
  two builds of the same input differ otherwise (cost two pin reruns).
- theme-generator.js's builder stamp list is shared with TW1: this branch changed pbip-export's stamp there
  (`20261027tt2n`) and theme-generator.min.js's stamp on its three pages; a merge with TW1 will touch the same lines.
