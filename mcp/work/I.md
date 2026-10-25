# I (0.3.1, wave 3): the Health Check's score card and the exams' study links

Cloud builder, 25 Oct. Branch `feat/0.3.1-site-card-study` from `origin/integration/0.3.1` (6bed05d). No PR, no merge
(the reviewer reviews and merges). The owner's "Yes" (22 Oct) to two website additions. Out of my files: M1's
`assets/js/report-mirror.js` and the MCP's Arabic writers, L1's `assets/js/report-rules.js`.

## What is there already (read before planning)
- The Health Check (`assets/js/model-health.js`) keeps the result in `R` (stats, findings sorted by the engine: severity,
  then penalty, then count) and shows the score with `score()` (ignored checks left out). The Documentation tab has three
  exports (HTML, Markdown, measures CSV) in a `row` of three `col-md-4` panels. Numbers are written with Latin digits on
  the Arabic page too (`ar-u-nu-latn`), and the size pills say "tables / measures / visuals" (Arabic: جداول / مقاييس /
  مرئيات). Events go through `track()` -> `window.dataArcusTrack` (main.js), which only reaches GA4 when the consent code
  loaded gtag: the same consent as every other event.
- The exams (`assets/js/dp600-sim.js`, PL-300 through `window.EXAM` built by `scripts/pl300-bank/build.js` into
  `assets/data/pl300-questions.js`, CI checks the two agree): the mock result shows "By exam area" rows without links; the
  renewal result links each renewal skill under 70% to its Learn module (`p < 0.7`, `data-learn`, new tab, noopener);
  the practice summary shows skills only. The renewal links are modules per renewal skill, not per exam area: they don't
  map one to one onto the areas, so the areas get the study guide's own sections (Decisions).
- The study guides, read on Microsoft Learn on 25 Oct 2026 (page titles "Study guide for Exam PL-300: Microsoft Power BI
  Data Analyst" and "Study guide for Exam DP-600: Implementing Analytics Solutions Using Microsoft Fabric"); each area's
  heading and its id on the page:
  - PL-300 (skills measured as of 20 Apr 2026): Prepare the data (25–30%) `#prepare-the-data-2530`; Model the data
    (25–30%) `#model-the-data-2530`; Visualize and analyze the data (25–30%) `#visualize-and-analyze-the-data-2530`;
    Manage and secure Power BI (15–20%) `#manage-and-secure-power-bi-1520`.
  - DP-600 (as of 19 Oct 2026): Prepare data (45–50%) `#prepare-data-4550`; Implement and manage semantic models
    (25–30%) `#implement-and-manage-semantic-models-2530`; Maintain a data analytics solution (25–30%)
    `#maintain-a-data-analytics-solution-2530`.
  Each heading is the area's name and weight as the exam page's `dom` has them.

## Plan
1. **Score card** (`assets/js/model-health.js`, `tools/power-bi-model-health-check.html`, its Arabic copy by
   `ar-pages.mjs`). A fourth panel in the Documentation tab's row, "Score card": the button "Download score card" and a
   switch "Hide object names" (off). The PNG (1200 x 630) is drawn on a canvas in the page (`toBlob`, then the page's own
   `download()`): nothing uploaded, no request. On it: the tool's name, the score and its grade in a ring (the page's
   colours), the size line (tables, measures, and visuals when the file has report pages, as the pills count them), "Top
   findings" with at most 5 lines `n. rule name: object name` (the first item's object; "+k" when the rule has more), the
   footer `dataarcus.com/tools/power-bi-model-health-check`. Findings: the engine's order, ignored checks left out, the
   rule's title in the page's language; never an item's detail, DAX, a description or M. Hidden names: `n. rule name (k)`.
   Arabic: canvas `direction = 'rtl'`, right aligned, the page's Arabic font (IBM Plex Sans Arabic, as the page's font
   stack, loaded before drawing), Latin digits as the page writes them, each object name between FSI and PDI so a Latin or
   Arabic name keeps its own order. Every line drawn is also written as a visually hidden list `#mhCardText` (the card's
   text for screen readers; the tests read it). Event `health_card_download` with `names_hidden` and `lang`.
2. **Study links** (`assets/js/dp600-sim.js`, `scripts/pl300-bank/build.js` -> `assets/data/pl300-questions.js`): each
   exam area gets `study` (the study guide's section above) in its `dom`. One helper draws an area row: name, weight,
   percent, bar, and under 70% (the percent as shown, rounded) the link "Study: this area in Microsoft's study guide"
   (Arabic "ذاكر: هذا المحور في دليل المذاكرة من Microsoft"), new tab, noopener, `data-learn data-study`, its click
   tracked as the other Learn links (`<ev>_learn_click`, from `results` / `practice`). Mock results: the "By exam area"
   rows use it. Practice summary: a "By exam area" block over the skills (only the areas with checked questions). The
   renewal result is not touched.
3. `npm run build:min`, `check:min`; new `?v=` stamps (20261025i) on the pages that load a changed file: the Health
   Check (`model-health.min.js`), both exams (`dp600-sim.min.js`), PL-300 (`pl300-questions.js`), the Arabic copies;
   `csp.mjs --write`, `ar-pages.mjs --write`, `sitemap-lastmod.mjs --write` after the commits, `test-site-config.mjs`,
   then all suites.

## Tests first (red before the work)
- `model-health` suite, block I-1: a made-up garden centre model (.pbit with a report page and one visual) with planted
  DAX (`ZQX_PLANTED_DAX_STRING`), descriptions (table, column, measure) and M (`ZQX_PLANTED_M`). EN and AR at 1440: the
  download is a 1200 x 630 PNG; the card's text holds the score, "3 tables / 3 measures / 1 visual" (AR "3 جداول / 3
  مقاييس / 1 مرئيات"), the footer last; min(5, findings) finding lines in the page's language; none of the planted texts
  in the text or the PNG bytes, no DAX function; names isolated (FSI..PDI), the card's direction ltr / rtl; with the
  switch on the same number of lines and no object name; two downloads -> two `health_card_download` events
  (`names_hidden` false, true); no request leaves the page after the file is chosen. EN and AR at 1440 and 390: the
  button and the switch (role switch, off) sit in the exports' row on the screen, no sideways scroll.
  **Expected: model-health +20 checks** (4 x 1 + 2 x 8); red before the work (no button).
- `tools` suite, block I-2, per exam (PL-300, DP-600) and language: a mock exam built in localStorage and submitted by
  its time: area 1 at 69/100, area 2 at 7/10, area 3 at 0/5, (PL-300) area 4 at 5/5. One row per area; 69% has the link
  and 70% none; 0% links, 100% doesn't; each link is its area's study guide section (the verified addresses, written in
  the test), new tab, noopener; its text in the page's language. Practice: 10 questions, the first area's answered
  right, the others wrong: each area at 0% links to its section, 100% doesn't. **Expected: tools +24 checks** (4 x 6);
  red before the work (no `data-dom` rows, no links).
- Unchanged: the renewal checks (tools), every other suite's numbers. `test-analytics-events.mjs` passes with the new
  event (letters and _, no reserved prefix or attribution name).

## Results
(filled in after the run)

## CHANGELOG line
(filled in after the run)

## Decisions I made
(filled in as I go)

## Seen, not in scope
(filled in as I go)
