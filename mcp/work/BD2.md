# BD2 (0.3.1, 27 Oct): the measured bidi rule (V3: the isolates, the whole text in RLI ... PDI), once, in the shared engine

## Summary
- **Approval:** the reviewer's brief "Go on BD2" (27 Oct), on the laptop's measurement of BD1's bidi lab (Power BI
  Desktop 2.159, 27 Oct, Windows text recognition; engine branch lab/rc031-proof, RESULTS.md "BD1 bidi lab"): V0 wrong
  everywhere; V1 (today's isolateLatin) right except where Desktop cuts a text with "..." (cards); **V3 (V1 wrapped
  whole in U+2067 ... U+2069) right on every canvas kind, cut card texts included**; V4 draws as V3 (old embeddings);
  no variant helps the tab strip (page and tooltip page names lay out left to right).
- **Scope:** `assets/js/text-measure.js` (the rule), `assets/js/pbip-export.js` (isolateFiles: DAX texts wrapped whole),
  `assets/js/pbip-page.js` (Arabic tooltip page names), their `.min.js` and `?v=` stamps; `mcp/lib/dax-functions.mjs`
  (DA.StoryTitle), `mcp/lib/arabic-lens.mjs` (TEXT_MIXED's words), `mcp/tools/plan_layout.mjs` (the page names note),
  `mcp/lab/bidi-lab.mjs` (V1 from isolateRuns; the buttons), the article (EN, AR, its translation file), a new suite
  `mcp/test-0.3.1-bd2.mjs`; tests that pin V1 changed only by the wrap (each said below). Not R4A's, GL2's, TT1's
  (story-titles.js) or CS2's files.
- **Base:** `fix/0.3.1-bd2` from `origin/integration/0.3.1` (e2236be). Push only this branch; the reviewer merges.
- **Expected checks:** (written before the work) bd2 about 22 checks, about 18 red first on e2236be; `-- arabic` 12
  suites -> 13 (bd2); bd1, bidi-lab, terminology-sheet: the same counts, pins changed only by the wrap; `-- report`
  28 = 28 (sq15b's J1/J2 pins by the wrap; dax-functions 92 = 92); `-- core` 6 = 6, test.mjs 1591 = 1591, the golden
  reports: no golden report is an Arabic build with a Latin run (SQ15b) so byte for byte, else each change said;
  website `theme-generator pbip` the same counts (pbip.mjs LR2-a3 pin by the wrap); full run 93 -> 94 suites.
- **Invariants:** metadata only; the marks come from the writer only (a person's name with one stays refused).
- **Resume:** see "Results" (filled as the work lands).

## Plan
1. This note, pushed first. Baselines on e2236be (a clean worktree): arabic, report, core, the website's two suites.
2. Red first, `mcp/test-0.3.1-bd2.mjs` (in process, made-up texts and a made-up model, `os.tmpdir()`):
   - R1-R6 the rule: `isolateLatin` start / middle / end = U+2067 + V1 + U+2069 (V1 = the new `isolateRuns`, today's
     text); idempotent (twice = once); an already-V1 text gets the wrap (a text from an older build); no Latin run,
     digits only, English, empty: unchanged; `isolateNames` wraps what it isolates; textWidth unchanged by the marks.
   - K1-K4 each kind through the writer (`Pbip.build` lang "ar", English model names kept): titles, text boxes, buttons,
     table and slicer headers (projection displayName), alt texts, tooltip titles: every mixed text is V3, none V1 only;
     English report: no mark at all.
   - D1-D3 DAX: a Text measure in reportExtensions with a mixed literal: the literals V1, the whole expression
     `UNICHAR ( 8295 ) & ( ... ) & UNICHAR ( 8297 )`, once (isolateFiles twice: the same); DA.StoryTitle's Arabic
     (a JS evaluation of its own DAX, as bd1) = RLI + RLM ... RLM + PDI; English unchanged.
   - P1-P3 page names: an Arabic build's tooltip pages on fields kept in English: no Latin letter in their names, names
     still unique; English names unchanged; plan_layout (lang "ar") answers `pageNames` naming any page name with a
     Latin run and saying Power BI lays tabs out left to right (measured in Desktop 2.159, 27 Oct).
   - L1-L3 the lens's TEXT_MIXED fix names the isolates and the whole text in U+2067 ... U+2069; flags a V1-only text;
     page names: keep English out. A1-A2 the article EN and AR say the same, dateModified 2026-10-27.
   - B1-B2 the lab: V1 is `isolateRuns`, V3 equals `isolateLatin`; page 4's buttons write `show` in an entry of its own
     and `text` in another, as pbip-page.js's buttons.
3. The work at the cause, as above. Then the suites, build:min, stamps, csp, ar-pages, sitemap-lastmod, the note.

## Baseline (e2236be) -> after
(filled from the runs)
