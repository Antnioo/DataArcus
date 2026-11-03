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
Commits: 6a9a119 plan, 6ef965c red tests, a083b17 the article and its wiring, a89fc61 sitemap dates, 7a7cf85 E's terms,
then this note.
- `mcp/test-0.3.0-claims.mjs`: 117 -> 150 checks. Red first (before the page existed): 150 checks, 33 failed (every
  new one: 21 forbidden-word checks over the three missing files, 12 W checks), the 117 old ones passing. After: 150/150.
- Website suites that pick the page up by themselves (git ls-files: the English page, tested in English and Arabic, and
  its Arabic copy), before (5db2627 + W.md) -> after, all PASS:
  | Suite | Before | After | Why it moved |
  |---|---|---|---|
  | site | 473 | 483 | +10: the new pages (English page in two languages, its Arabic copy) |
  | anchors | 120 | 120 | unchanged: the page has no in-page `#section` link (its only `#` link goes to /power-bi-mcp/#join) |
  | spacing | 1056 | 1074 | +18: the new pages' stacked boxes |
  | lang-switcher | 1405 | 1442 | +37: the switcher on the new pages |
  | text-align | 468 | 474 | +6: the new pages' text blocks |
- `node scripts/test-site-config.mjs` PASS (sitemap 76 URLs, llms.txt, 78 pages: the new pages' heads, canonical, preview
  image); `node scripts/ar-pages.mjs` PASS (38 copies); `npm run check:min` all match, every changed `.min.js` with a new
  stamp; `node scripts/csp.mjs --write`: every page has its policy; `sitemap-lastmod --write` after the commit (full clone:
  `git fetch --unshallow` first): the home page and the blog, both languages, 2026-10-25.
- E's terms (origin/feat/0.3.1-arabic-terms, 25d09e3, read before finishing): its scanner (`mcp/lib/arabic-terms.mjs`
  `fileHits`, `englishOnceProblem`, run from a scratch copy of that branch's two files) finds 0 variants in the article's
  Arabic (translations file and ar/ copy), slicer and tooltip given in English once. Articles are on E's allow-list, so
  E's test would not have failed either way; the page uses the sheet's terms as the brief asks.
- Full website run once at the end (`node scripts/tests/run-all.mjs`, on 7a7cf85 + these notes): 20 of 20 PASS, 11,282
  checks (the five suites above +71; the other 15 not touched by this branch, counts as they run on 5db2627: 11,211 before).
- The page: `articles/article-power-bi-report-ready-for-arabic.html` and `ar/articles/...`; translations
  `assets/js/translations/article-power-bi-report-ready-for-arabic.js` (+ .min.js, ?v=20261025a); six pictures
  `assets/img/articles/ready-for-arabic-{reading,text,charts,tables,months,slicers}.svg` (3-7 KB each, shapes only,
  made up; month names and years where the picture is about them); share image `assets/img/og/report-ready-for-arabic.jpg`
  (1200 x 630, 66 KB, under make-share-images.mjs's 280 KB).
- Screenshots at 1280 and 390, English and Arabic, attached to the session (not committed).

## CHANGELOG line
- **A new article on dataarcus.com: "Is your Power BI report ready for Arabic?"** In English and Arabic. It goes through
  what reads wrong when a report built in English, or by hand, is read in Arabic, in 19 kinds (where the eye starts,
  text, charts, tables and the matrix, month and day names, slicers), each with a small picture and its fix: what
  DataArcus does through your approval, the Power BI Desktop setting to change, or plainly that Power BI has no setting
  for it. It says what the Arabic twin can and cannot do today, and how to run the check yourself with check_report's
  Arabic lens.

## For the owner (the Arabic page, for your read)
`ar/articles/article-power-bi-report-ready-for-arabic.html` (its text: the `"ar"` half of the translations file). Please
read in particular:
1. The title «هل تقرير Power BI الخاص بك جاهز للعربية؟ 19 أمرًا تفحصها» and the badge «التقارير العربية».
2. The three answers: «يقوم به DataArcus، بموافقتك» / «إعداد في Power BI Desktop» / «لا إعداد له في Power BI».
3. «النسخة العربية» for the twin (the beta page's word), «ترتيب التنقل بمفتاح Tab» for the Tab order, «متصفح الصفحات
   (Page navigator)», «مخطط شريطي» / «مخطط أعمدة» / «مخطط شلال», «المقسّمات ذات الأزرار المستديرة» became «مقسمات طريقة
   العرض ذات الأزرار المستديرة» (E's sheet; long: say if a shorter one is wanted, e.g. «أزرار التصفية»).
4. Microsoft's quote stays in English with an Arabic gloss in brackets (p1); Desktop's setting names stay English, isolated
   (Desktop has no Arabic, Microsoft Learn).
5. «مختلقة» for "made-up" (the four reports): or «تجريبية»?
6. The figure captions say «على اليسار ... وعلى اليمين ...»: the pictures are not mirrored on the Arabic page, so left
   is still "as built".

## Decisions I made
- **An article, not a tools page** (see "Where the page goes"); slug `article-power-bi-report-ready-for-arabic`, blog
  topic "Gulf & Ramadan" (the pillar is "Gulf business logic (and Arabic)"; the blog has no Arabic topic), badge ARABIC
  REPORTS, dated 25 Oct 2026 (datePublished): it goes live when integration/0.3.1 reaches main with the lens. The home
  page's latest three now start with it (the Gulf calendar card left the three, as #98 did with the AI-ready card).
- **Pictures: simple SVG**, not the page-preview renderer: the renderer draws grey placeholders without alignment, sort
  or text, so it cannot show a title's alignment, month names or a pill's centring; each SVG shows both sides (as built /
  as an Arabic reader expects) with an arrow for the reading direction. Not mirrored on the Arabic page.
- **The 19 kinds** are L1's 18 with pill slicers split into order and centring (the lens's PILLS_ORDER and PILLS_ALIGN),
  in six groups.
- **Desktop setting names only where sourced or measured**: Tab order (Learn), Title > Horizontal alignment (Learn),
  Invert range (Learn), Sort axis > Sort descending (Learn), Sort by column (Learn), Rename for this visual (a Microsoft
  Learn page names it; the display name shown everywhere is measured, round 2), the value axis on the right and a
  categorical axis ignoring Invert (measured, round 13). The lens's "Switch axis position" and the pill's "Values >
  Horizontal alignment: Center" are not on Learn and not read off Desktop (L1's "For the laptop" 3): the page says "move
  the axis to the other side" and "centre the values" without a menu path.
- **Arabic bidi in HTML**: every Latin run in the Arabic text the page sets as HTML is wrapped in `<bdi>` (the custom-visual
  article did the same for its quotes): the first screenshots showed "Power BI. DataArcus:" and "Tab." drawn out of order.
  E's note says HTML needs no isolates; the screenshots said otherwise for runs beside a full stop or colon. Keys set as
  plain text (headings, badges, buttons, the table head) are not wrapped.
- **No back-link from another article** (the checklist's "links from related posts back"): it would change a published
  article's translations and stamp; the new page links the Gulf calendar article. Left for the owner.
- **Claims guarded in the MCP claims test** (`mcp/test-0.3.0-claims.mjs`, the test the brief names): the site has no
  separate claims check for articles.
- **No LinkedIn drafts** (BLOG-PLAN's checklist asks for three): not in this brief; BLOG-PLAN.md's log, pillar and "Next
  up" 5 are updated.
- **The share image** is the custom-visual article's layout (`scripts/make-share-images.mjs`, one new entry and
  RTLREADY).

## Seen, not in scope
Status of these items: [mcp/work/SEEN-QUEUE.md#w](SEEN-QUEUE.md#w)
1. Merge with E: both branches stamp `lang-manager.min.js` on every page (mine 20261025a, E's 20261025e) and both rebuild
   `blog.min.js` / `homepage.min.js`: the reviewer's merge takes the later stamp and runs `npm run build:min`,
   `check:min`, `ar-pages.mjs --write`, `csp.mjs --write`.
2. The lens's own fix texts name "Switch axis position" and "Values > Horizontal alignment: Center" (arabic-lens.mjs),
   still unread off Desktop's Format pane (L1 "For the laptop" 3); the page avoids them until then.
3. The Arabic figure captions read "left/right" over pictures that are not mirrored: right for the content, but an
   Arabic reader meets the "as built" side last.
4. The article says the lens comes "from DataArcus 0.3.1": the beta page's download is still 0.3.0, so the article must
   not reach main before 0.3.1's release (it rides integration/0.3.1).
5. BLOG-PLAN's "All 16 website suites" is now 20 in run-all.mjs (stale count in the plan, not changed).
6. The page's English quote of Microsoft (p1) ends its sentence inside the quotation marks ("...language.") as Learn's
   sentence does; the Arabic page quotes only the first sentence in English and glosses the second in Arabic.
