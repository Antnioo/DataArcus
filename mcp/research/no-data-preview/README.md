# The "No data" option, both ways (preview only)

Pictures for the owner to compare on a phone, made on 7 October 2026 in Power BI Desktop 2.158. Nothing in the writer
changes here. The reports were built by `create_report` from `fix/round-21` at `78d30f7` on the made-up Ramadan sample:
executive layout, 1920 x 1080, English and Arabic. Only the KPI cards' `visual.json` differ between A and B.

Each picture has the three versions one above the other, each under its label:

| Label | What it is |
|---|---|
| **OFF (today)** | the option off: a blank card shows "--", charts and the table are empty boxes |
| **A: Keep numbers big** | the option on, the card values at their normal size, the blank text at that same size |
| **B: Shrink one size** | the option on as built at `78d30f7`: every card value one step smaller so the blank text fits |

| File | Shows |
|---|---|
| `en-with-data.png` | English, the normal page |
| `en-empty.png` | English, a page filter on a Hijri year the sample has no rows for (1400): every card and chart is blank |
| `ar-with-data.png` | Arabic, the normal page |
| `ar-empty.png` | Arabic, the same empty selection |
| `empty-chart-and-table-closeup.png` | the bottom row (a chart and the table) with the option on, empty, English above Arabic; the chart message is the same in A and B |

## Measured
- **Value size:** OFF and A **42pt**; B **34pt** (42 x 0.8, rounded). With data, B's numbers are that much smaller on
  every page of every report, also when nothing is blank.
- **The cards:** three KPI cards, each 612 wide on this page.
- **A, does the text fit at 42pt?** Yes, on all three cards in both languages: "No data" and «لا توجد بيانات» are whole,
  not cut, and the Arabic letters' dots clear the card's bottom (judged from the capture at twice the page's size).
  **No card in A had to fall back to "--".**
- The small cards of the tooltip pages (296 wide, 20pt) have no blank text in either version (they are under 300
  wide), so they still show "--".

## Limits
- One layout and one page size. A narrower card was not tried here: in the lab of 7 October the Arabic text was cut
  with "…" on a card 240 wide at 38pt and at 30pt, and whole on a card 304 wide at 30pt, with its lowest strokes cut
  at 38pt. So "keep numbers big" needs the width rule checked for layouts with four or more cards in a row before it
  is the default there.
- The header of each page shows the test report's own name ("A empty EN" and so on).
- The pictures are the page only, scaled to 1600 wide from a capture 2250 wide.
