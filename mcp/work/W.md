# W (0.3.1, wave 3): the website page "Is your Power BI report ready for Arabic?"

Cloud builder, 25 Oct. Branch `feat/0.3.1-ready-for-arabic` from `origin/integration/0.3.1` (5db2627: S1, R1, V1, P1,
M1, L1, I merged). Push only this branch; no merge, no PR (the reviewer merges into the integration branch). Others at
work now: E (Arabic terms, `feat/0.3.1-arabic-terms`: not on origin when this started) and X2 (MCP writers): their files
are not touched.

## Where the page goes (decided)
An **article**: `articles/article-power-bi-report-ready-for-arabic.html` and its Arabic copy
`ar/articles/article-power-bi-report-ready-for-arabic.html` (rendered by `scripts/ar-pages.mjs --write`). Why: the site
files a "is your X ready?" explainer as an article (`article-power-bi-model-ai-ready.html`, "Is your Power BI model ready
for AI? A 7-point check"; `article-power-bi-custom-visual-ai-checks.html`, 4 checks), while `tools/` holds pages that run
something in the browser and `power-bi-mcp/` is the one product page. This page runs nothing: it explains and points at
check_report on the MCP page. BLOG-PLAN.md "Next up" 5 ("Arabic and right-to-left Power BI reports done right") is this
topic. Wired as #98 (the custom-visual article) was: translations file, lang-manager entry, blog card and JSON-LD list,
the home page's latest posts and article count, sitemap (both languages, hreflang by ar-pages.mjs), llms.txt, share image
(`scripts/make-share-images.mjs`, 1200 x 630 JPEG), BLOG-PLAN.md log and pillar. No analytics event of its own: no article has one
(the site-wide events are main.js's, which every page loads).

## The page's outline
Title (under 60): "Is Your Power BI Report Ready for Arabic?" Badge: ARABIC REPORTS. Pillar: Gulf business logic (and Arabic).
1. Intro: Power BI Desktop has no right-to-left support and a report's layout does not change for a right-to-left
   language (Microsoft Learn, supported languages). A report built in English, or by hand, reads from the left; an Arabic
   reader starts at the right. The three kinds of answer, said once: **DataArcus does it** (through your approval: the
   Arabic twin, or a script that adds Arabic calendar columns), **a Power BI Desktop setting** (named), **Power BI has no
   setting for it** (said plainly, with what you can do instead).
2. Six sections, L1's 19 kinds grouped; one small made-up picture each (simple SVG, no text from any report):
   - **Where the eye starts** (4): the heading at the left; the Tab order left to right; a row of page buttons in page
     order from the left; the page navigator (no order setting).
   - **Text** (5): visual titles aligned left; Arabic text boxes aligned left; Arabic and English mixed in one text
     without direction isolation; English titles, text boxes, buttons and page names; English field names.
   - **Charts** (4): bar charts; column, line and combo charts; charts over time; waterfalls.
   - **Tables and the matrix** (2): table column order; matrices.
   - **Month and day names** (1): the date table's names in English.
   - **Slicers** (3): dropdown and list items; pill slicers' order; pill values not centred.
   A table at the end: the 19 kinds, each with its answer from an English report (DataArcus) and on an Arabic page you
   built (the Desktop setting, or "no setting").
3. What the Arabic twin can and cannot do today (L1's list; arabic-twin.mjs `cannot`; the matrix: only the order of its
   measures today, its right-to-left options being tried in Power BI Desktop: nothing promised).
4. Run the check: check_report with `lens: "arabic"`, from DataArcus 0.3.1 (0.3.0 has no lens); a prompt to type;
   links to the MCP page and its install steps (`/power-bi-mcp/#join`).
5. What we found on four made-up reports (L1's numbers only).
6. The privacy line: it reads the report's files on your computer, never your data, and changes nothing.
7. FAQ (3, FAQPage data as the other articles): does Power BI support Arabic; can a matrix read right to left; does
   the check change my report.

## Sources (every Power BI fact in the page is one of these, or measured)
- Microsoft Learn, Supported languages: "Desktop doesn't support right-to-left languages"; "Inside reports, the layout
  of visuals doesn't change if you're using a right-to-left language"; "your data isn't automatically translated"; Desktop
  is not available in Arabic (so its setting names stay English).
  https://learn.microsoft.com/power-bi/fundamentals/supported-languages-countries-regions
- Microsoft Learn, Create page and bookmark navigators: "The ordering of the buttons matches the order of your report pages."
  https://learn.microsoft.com/power-bi/create-reports/button-navigators
- Microsoft Learn, Design reports for accessibility: Tab order in View > Selection.
  https://learn.microsoft.com/power-bi/create-reports/desktop-accessibility-creating-reports
- Microsoft Learn, Customize visualization titles: Horizontal alignment left, center or right.
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-customize-title-background-and-legend
- Microsoft Learn, Customize x-axis and y-axis: Invert range (line, bar, column, area, combo).
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-customize-x-axis-and-y-axis
- Microsoft Learn, Waterfall charts: displayed in ascending or chronological order.
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-waterfall-charts
- Microsoft Learn, Slicer visual: items sort ascending; More options > Sort axis > Sort descending.
  https://learn.microsoft.com/power-bi/visuals/power-bi-visualization-slicer-visual
- Microsoft Learn, Sort one column by another column (month names in order).
  https://learn.microsoft.com/power-bi/create-reports/desktop-sort-by-column
- Measured in Power BI Desktop 2.158 (`scripts/tests/DESKTOP-TESTS.md`, round 13): a categorical axis ignores "Invert
  axis" and runs right to left when sorted by its category, Descending; the value axis moves to the right
  (switchAxisPosition); a bar chart's bars grow from the right (the value axis inverted); a title is a left-to-right
  paragraph ("…" after Arabic words drawn at the reading start without U+200F). Round 2: the page navigator has no
  order setting; a slicer's "All" is Power BI's own word. A projection's display name is shown everywhere (round 2).
- The lens and the twin: `mcp/work/L1.md` ("For the website", Results), `mcp/lib/arabic-lens.mjs`,
  `assets/js/report-mirror.js` (KIND_WHAT), `mcp/lib/arabic-twin.mjs` (MATRIX_SAID, `cannot`), `mcp/work/M1.md`.
- Unicode bidi isolation (U+2068 / U+2069): Unicode Standard Annex #9 (https://www.unicode.org/reports/tr9/).

## Tests (written before the page; expected numbers before any run)
- `mcp/test-0.3.0-claims.mjs` (the claims test the brief names): the article's three files (EN, AR, translations) join
  its SPEAK list (the forbidden words: 7 patterns each, +21 checks), plus W checks, red before the page exists:
  W-1 the lens said as coming with DataArcus 0.3.1 (EN and AR); W-2 the numbers only as L1 measured them, "on four
  made-up reports" (18, 14, 13, 4); W-3 the privacy line (reads the files on your computer, never your data, changes
  nothing; EN and AR); W-4 nothing promised for the matrix (no "soon / coming / will / planned" in a matrix sentence; the
  "only the order of its measures" sentence there; EN and AR); W-5 the Learn source for "no right-to-left support" linked;
  W-6 no headline (title, h1, og:title) with first, only, official or free. Expected: 117 -> 117 + 21 + 12 = 150 (W-1..W-4
  two each, W-5 and W-6 two each); on 5db2627 every new check red (the files do not exist: a missing file fails its
  checks, never crashes the suite).
- Website suites that pick a new page up by themselves (git ls-files; the page must be `git add`ed): site, anchors,
  spacing, text-align, lang-switcher; counts rise by the checks one more article (EN page in EN and AR, and its AR copy)
  adds. Before: recorded below from the run on 5db2627; after: the same suites, each rise said and why.
- `node scripts/test-site-config.mjs` (sitemap, llms.txt, heads, share image), `node scripts/ar-pages.mjs` (copies),
  `npm run check:min`, `node scripts/csp.mjs`, `node scripts/sitemap-lastmod.mjs` (after the commits), then the full
  website run once (`node scripts/tests/run-all.mjs`) and `cd mcp && node test-0.3.0-claims.mjs`.

## Results
(filled in as the work goes)
