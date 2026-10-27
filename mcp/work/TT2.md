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
- **Expected checks (written before the work):** tt2 (new MCP suite, about 12, red first: the engine does not exist on
  13afb3a); arabic-names (new website suite, about 12, red first: no step on 13afb3a, the Arabic download builds at once);
  pbip 111 = 111 (its four Arabic own-model downloads now pass the step, each with "keep English" chosen for every
  name, so their checks stay as they are: said per test); theme-generator-lab 920 = 920; lr1 and test.mjs's
  proposeArabic checks the same counts; full run: the base's suites + 1 (tt2).
- **Resume:** step 1 (this note), then red tests, then the engine, the page, the README, the moved pbip helper.

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
