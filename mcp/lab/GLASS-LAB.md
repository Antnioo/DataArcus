# The glass look's lab (0.3.1 GL1)

The look's values (the cards' transparency, the rim, the corners, the shadow) are picked here from Power BI Desktop,
not from a guess. The job's note: [mcp/work/GL1.md](../work/GL1.md).

**What the look is, said the same way everywhere:** Power BI has no blur behind a visual. The look is made of what it
has: each visual's background colour with transparency, a 1-pixel border (the rim) at the design's corners, a soft
shadow, and the page's background picture, which DataArcus draws already soft from the theme's own colours (no photo,
no text). Seen through the see-through cards, the picture reads as frosted glass.

## Run it
From `mcp/`, with an empty folder (made-up data only; nothing outside the folder is touched):

```
node lab/glass-lab.mjs C:\DataArcus\tests\glass-lab
```

It prints four `.pbip` files: `Glass EN light`, `Glass EN dark`, `Glass AR light`, `Glass AR dark` (the two middle ones
with Chart style table "banded": every other row a faint tint; GL2, [mcp/work/GL2.md](../work/GL2.md)). Each has:
- its two report pages as `create_report` writes them with the look (KPI cards, line, bar and column charts, a table,
  dropdown slicers, the page and Reset buttons), the soft picture behind every page;
- three variant pages, each row labelled above it, outside the visuals (a KPI card, the bar chart, the table and a
  matrix, the look written on each visual):
  - **Variants: transparency**: 20%, 35% (shipped), 50% (a value the contrast floor lowers says so in its label);
  - **Variants: corners**: 0, 8 (shipped), 16 on the 720 grid (0, 12, 24 on this 1920 x 1080 page);
  - **Variants: shadow**: none, soft (shipped), strong.

Microsoft's validator and `check_report` run on each report; the cloud run of 26 Oct: 0 errors and 0 "can break" on
all four. Open each in Desktop, click Refresh once (the rows load), then screenshot every page unattended with the
lab-tools harness (`harness.ps1`, the laptop's builder scripts), at full size.

## What to judge (per report: EN and AR, light and dark)
1. Every text whole and readable on the cards and on the picture (titles, values, labels, axis labels, the table's and
   the matrix's cells, the slicers' text, the buttons): none cut, none faint.
2. Which transparency reads best (20 / 35 / 50): the picture shows through, the numbers stay calm.
3. Which corners read best (0 / 8 / 16), and that every visual is rounded (the KPI card visual has no radius of its
   own in a theme: see whether its corners follow).
4. Which shadow reads best (none / soft / strong); on a dark page whether the soft one shows at all.
5. Whether the rim reads (white on light; the card lightened 25% on dark).
6. The KPI card visual, the table and the matrix: are their cells see-through, or does an inner fill of their own
   cover the look (a card visual's own background, a table's value background)? (GL2) The table and the matrix: no
   solid row anywhere (values, alternate rows, column and row headers, totals): the picture shows through every cell,
   the text readable, the grid lines visible; on "Glass EN dark" and "Glass AR light" every other row a faint tint
   (6% and 4% as the contrast left it), not a solid colour. If Desktop draws a clear fill (alpha 00) as solid or
   black, say so: the theme's colours carry alpha (#RRGGBBAA, the theme schema's pattern) because these cards have
   no transparency of their own.
7. The slicers and buttons sit straight on the picture (no card of their own): readable?
8. Arabic: the same, mirrored; the labels above the rows at the right.

## Results (filled by the laptop run)

| Report | Text readable | Transparency picked | Corners | Shadow | Rim | Card / table / matrix fills | Slicers, buttons | Seen |
|---|---|---|---|---|---|---|---|---|
| Glass EN light | | | | | | | | |
| Glass EN dark | | | | | | | | |
| Glass AR light | | | | | | | | |
| Glass AR dark | | | | | | | | |

The values picked go into `GLASS` in `assets/js/design-engine.js` (`t`, `shadow`, the rim in `glassLook`), one place for
the website and the MCP.
