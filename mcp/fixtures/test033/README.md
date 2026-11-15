# test033: a bookmark view as Power BI Desktop saved it (RX1, R-82)

Made-up report "Gulf Views" (the lab's Gulf Retail sample model, no data), written by DataArcus 0.3.3 at 103097b2
with `plan_layout` `bookmarks` (3 views on 2 pages) and `slidePanel: true`, opened in Power BI Desktop (Store build)
on 15 Nov 2026 and saved with Ctrl+S, nothing else changed.

- `desktop-saved-view.bookmark.json`: the view "Overview" after Desktop's save. DataArcus wrote it with the bookmark
  schema 1.4.0 and `explorationState.version` "1.3"; Desktop rewrote it as schema **2.1.0** and version **"1.0"**,
  `options` unchanged (`suppressData`, `suppressDisplay`), the same page, no visual state.
- `desktop-saved-bookmarks.json`: bookmarks.json after the same save: the 3 views first in the plan's order, the
  3 slide-panel helpers after.

Results: dataarcus-engine, branch lab/test033, business/beta/test033/RESULTS.md, block C.
