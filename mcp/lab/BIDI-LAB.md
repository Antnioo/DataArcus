# The bidi lab (BD1, 0.3.1): which marks make Arabic with a Latin run read right in Power BI Desktop

What Desktop 2.159.883.0 showed on 26 Oct (the owner's laptop run): a visual title «U+200F U+2068 Total Sales U+2069:
التفاصيل» reads in order; DA.StoryTitle's Arabic, which started with an isolate and had no U+200F, read out of order; a
text box with no marks and a Latin run in the MIDDLE («عدد الأوامر حسب Department في كل شهر») drew its two Arabic phrases
swapped. Not measured: a text box with DataArcus's marks, and a wrap of the whole text in RLI ... PDI or RLE ... PDF. This
lab measures all of them, on every kind of text Power BI draws, before the next rule is coded.

## What it writes
`mcp/lab/bidi-lab.mjs` writes one project into an empty folder (it refuses any other): a made-up model (orders by four
departments and six months, typed Power Query rows; no employer or client data) and a report "Bidi Lab". On each kind,
the same Arabic text with the Latin run "Department" at the start, in the middle and at the end (the rows), in five
variants (the columns, left to right V0 ... V4):

| Variant | What it is |
|---|---|
| V0 | no marks |
| V1 | DataArcus's rule before BD2 (`isolateRuns`: each Latin run in U+2068 ... U+2069, U+200F beside a run at either end) |
| V2 | V1 plus U+200F at the start of the text (the same as V1 for the start row: V1 already opens with it) |
| V3 | V1 wrapped whole in U+2067 ... U+2069 (RLI ... PDI): DataArcus's rule since BD2 (`isolateLatin`) |
| V4 | V1 wrapped whole in U+202B ... U+202C (RLE ... PDF) |

| Page id | Kind |
|---|---|
| p1textbox | a text box (paragraph aligned right) |
| p2title | a visual title (a card's, aligned right) |
| p3cardlabel | a card's category label (the measure's display name) |
| p3cardcallout | a card's callout value (a text measure returning the text) |
| p4button | a blank button's text |
| p5tableheader | a table's column header |
| p6slicerheader | a list slicer's header |
| p7tooltips, then p7tipV0start ... p7tipV4end | a tooltip page's name (15 tooltip pages; p7tooltips binds a card to each) |
| p8nameV0start ... p8nameV4end | a page's name (15 pages) |

Each tested box has its label ("V2 middle") in plain ASCII in a text box of its own above it, never inside the tested text;
each named page and tooltip page carries its own ASCII label box. `node lab/bidi-lab.mjs --key` prints every tested text
with its marks named ([RLM] [FSI] [PDI] [RLI] [RLE] [PDF]); `--pages` the 38 page ids in order.

## How the laptop runs it, unattended (Power BI Desktop 2.159 or later)
1. On this branch, from `C:\DataArcus\DataArcus\mcp`: `node lab/bidi-lab.mjs C:\DataArcus\tests\bd1-lab` (an empty folder).
   It prints the key, then "wrote 38 pages, 135 tested texts" and the validator's result: 0 errors.
2. Open `C:\DataArcus\tests\bd1-lab\Bidi Lab.pbip` with the engine's `lab-tools\harness.ps1` (its open step, as in the
   earlier laptop runs), wait until the model has loaded, Refresh once (typed rows).
3. Screenshot every page by its id, one at a time, at 100%: for each line of `node lab/bidi-lab.mjs --pages`,
   `powerbi-desktop screenshot <page-id>` saved as `bd1-<page-id>.png` (38 files). The first shot after opening can come
   back empty (DESKTOP-TESTS.md, quirks): take it again before judging. On the tooltip pages and the named pages the
   tested text is the page's own tab, the active one in the shot (the tab bar scrolls to it).
4. Judge from full-size crops, never a scaled page: for each kind, position and variant, does the Arabic read right to left
   in order, with "Department" in its place (start: first from the right; middle: between «حسب» and «في كل شهر»; end:
   last, at the left)? Yes or no; for a no, one line saying what drew where (as the text with its marks: `--key`). Also
   say any box, gap or visible mark, and any text cut.
5. Fill the table below, copy it into `scripts/tests/DESKTOP-TESTS.md` (a new "BD1 bidi lab" section, with the Desktop
   version), commit with the 38 screenshots' names (not the screenshots), push.

## Result (to fill: yes / no per cell)
| Kind | Position | V0 | V1 | V2 | V3 | V4 |
|---|---|---|---|---|---|---|
| text box | start | | | | | |
| text box | middle | | | | | |
| text box | end | | | | | |
| visual title | start | | | | | |
| visual title | middle | | | | | |
| visual title | end | | | | | |
| card label | start | | | | | |
| card label | middle | | | | | |
| card label | end | | | | | |
| card callout | start | | | | | |
| card callout | middle | | | | | |
| card callout | end | | | | | |
| button text | start | | | | | |
| button text | middle | | | | | |
| button text | end | | | | | |
| table header | start | | | | | |
| table header | middle | | | | | |
| table header | end | | | | | |
| slicer header | start | | | | | |
| slicer header | middle | | | | | |
| slicer header | end | | | | | |
| tooltip page name | start | | | | | |
| tooltip page name | middle | | | | | |
| tooltip page name | end | | | | | |
| page name | start | | | | | |
| page name | middle | | | | | |
| page name | end | | | | | |

Then the one question for the owner: which variant (V1, V2, V3 or V4) reads right on every kind; DataArcus's rule
(`isolateLatin` in `assets/js/text-measure.js`, used by the MCP and the website's Arabic download) changes to it only
after his go.

## Measured (the laptop, Power BI Desktop 2.159, 27 Oct, Windows text recognition; BD2)
V0 wrong everywhere; V1 right everywhere except where Desktop cuts a text with "..." (cards: the "..." at the wrong end);
V3 right on every canvas kind, cut card texts included; V4 draws as V3 (the older embeddings); no variant helps the tab
strip: page and tooltip page names lay out left to right. The reviewer adopted V3: `isolateLatin` is V3 since BD2 (the
lab's V1 is `isolateRuns`, unchanged). BD2 also fixed page 4: its buttons drew no text (`show` sat inside the state
selector with `text`); `show` is now an entry of its own, as DataArcus's writer does.
