# Night fuzz: latest

## Final summary (night lab, 2 Nov 21:05 to 3 Nov 04:00 UTC)

- Heads tested: integration/0.3.1 a6000a27, 1a5f6584 (MX8); integration/0.3.2 a234f06f, cf86bb21 (DP1), 771e279a (OP1), 550cea1b (SP1), a215ada5 (0.3.1 merged in), 04a99222 (SP3), 66f93a01 (SP2), 90eaa7ca (SP5), 7797bf63 (SP4), 956c4d80 (SP6). 12 heads; for each: 300 generated + 57 real shapes + 6 reduced cases + 100 grid specs, the same seeds also on the previous head. Seeds 2026110300 to 2026113899. No lab errors.
- V1, V2, D1n, M1, B1, T1, S1: 0 failures on every head. The lab's 6 reduced cases: no counting property fails on any head (V1-1, B1-1, B1-3, M1-1 stay fixed).
- The one NEW failure of the night: integration/0.3.1 a6000a27 (MX7), B2new: underGrids (mcp/lib/twin-pages.mjs, `function underGrids`) moved a chart onto its heatmap's grid offset over another visual, unsaid (B2new 33 -> 53 of 300 on the same seeds vs eb09d194; 7 reduced cases). MX8 (1a5f6584) answered it: B2new 47 -> 26, every remaining one said in pictureChecks.newOverlaps or involving a group box.
- X1 (the night lab's own check, a chart lined up with a heatmap grid): before MX8, 50 to 65 of 100 grid specs: a text-typed category's sort was flipped (assets/js/report-mirror.js chartRtl) while the grid stays left to right. MX8: 0 of 100 on most heads. Still seen (old, 2 of 100 on 66f93a01): a chart matched by two heatmaps is moved twice and the last match wins (twin-pages.mjs underGrids, the 0.8-of-the-narrower share test), and a lined-up chart then moved by button fitting (twin-pages.mjs fitButtons) leaves its grid.
- B2unsaid (new overlaps the plan does not mention, no group box): about 1 of 300 on each MX8 head (0 to 2), old: a page kept left to right (its picture not a PNG or JPEG) is skipped by MX8's new-overlap pass (mcp/lib/twin-pictures.mjs:87) while a button on it is still widened over a neighbour.
- Lab fixes made in the night lab's copy (not the product): X1 treats a plan-named exception ("kept at its mirror") as M1 does. Three NEW X1 lines for 1a5f6584 at 23:25 were this false positive and were withdrawn. Codex's lab is missing campaign.mjs (any run over 250 cases without --cases fails); the night lab ran batches of 150.
- Lab-only counts (P1, raw D1, B2, B3) are in each REPORT.md: P1 and raw D1 fail on every report by the lab's own definition; B3 5/57 real shapes on every head.

NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-1 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-1/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-6 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-6/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-8 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-8/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-9 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-9/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-10 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-10/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-11 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-11/why.md)
NEW FAILURE integration/0.3.1 a6000a27 B2new: B2new-12 (new overlap introduced), passes on eb09d194. [why](integration/0.3.1/a6000a27/cases/B2new-12/why.md)

One line per head tested, newest first (counts: failed reports over 300 generated + 57 real shapes + 100 grid specs):

- 2026-11-03T03:53:13Z integration/0.3.2 956c4d80 (seeds 2026113600-2026113899): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 21, B2unsaid 0, T1 0, S1 0, X1 4; cases 14 (0 new); lab errors 0. [REPORT](integration/0.3.2/956c4d80/REPORT.md)
- 2026-11-03T03:22:48Z integration/0.3.2 7797bf63 (seeds 2026113300-2026113599): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 25, B2unsaid 0, T1 0, S1 0, X1 0; cases 15 (0 new); lab errors 0. [REPORT](integration/0.3.2/7797bf63/REPORT.md)
- 2026-11-03T02:53:11Z integration/0.3.2 90eaa7ca (seeds 2026113000-2026113299): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 35, B2unsaid 1, T1 0, S1 0, X1 0; cases 19 (0 new); lab errors 0. [REPORT](integration/0.3.2/90eaa7ca/REPORT.md)
- 2026-11-03T01:52:35Z integration/0.3.2 66f93a01 (seeds 2026112700-2026112999): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 27, B2unsaid 2, T1 0, S1 0, X1 2; cases 18 (0 new); lab errors 0. [REPORT](integration/0.3.2/66f93a01/REPORT.md)
- 2026-11-03T01:22:58Z integration/0.3.2 04a99222 (seeds 2026112400-2026112699): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 29, B2unsaid 1, T1 0, S1 0, X1 0; cases 17 (0 new); lab errors 0. [REPORT](integration/0.3.2/04a99222/REPORT.md)
- 2026-11-03T00:47:56Z integration/0.3.2 a215ada5 (seeds 2026112100-2026112399): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 33, B2unsaid 1, T1 0, S1 0, X1 0; cases 14 (0 new); lab errors 0. [REPORT](integration/0.3.2/a215ada5/REPORT.md)
- 2026-11-03T00:44:02Z integration/0.3.1 1a5f6584 (seeds 2026111200-2026111499): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 26, B2unsaid 1, T1 0, S1 0, X1 0; cases 14 (0 new); lab errors 0. [REPORT](integration/0.3.1/1a5f6584/REPORT.md)
- 2026-11-02T23:51:54Z integration/0.3.2 550cea1b (seeds 2026111800-2026112099): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 43, T1 0, S1 0, X1 50; cases 15 (0 new); lab errors 0. [REPORT](integration/0.3.2/550cea1b/REPORT.md)
- 2026-11-02T23:25:03Z integration/0.3.2 771e279a (seeds 2026111500-2026111799): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 54, T1 0, S1 0, X1 49; cases 17 (0 new); lab errors 0. [REPORT](integration/0.3.2/771e279a/REPORT.md)
- 2026-11-02T22:21:57Z integration/0.3.2 cf86bb21 (seeds 2026110900-2026111199): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 47, T1 0, S1 0, X1 52; cases 17 (0 new); lab errors 0. [REPORT](integration/0.3.2/cf86bb21/REPORT.md)
- 2026-11-02T21:16:00Z integration/0.3.2 a234f06f (seeds 2026110600-2026110899): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 55, T1 0, S1 0, X1 54; cases 21 (0 new); lab errors 0. [REPORT](integration/0.3.2/a234f06f/REPORT.md)
- 2026-11-02T21:12:19Z integration/0.3.1 a6000a27 (seeds 2026110300-2026110599): V1 0, V2 0, D1n 0, M1 0, B1 0, B2new 60, T1 0, S1 0, X1 65; cases 18 (7 new); lab errors 0. [REPORT](integration/0.3.1/a6000a27/REPORT.md)
