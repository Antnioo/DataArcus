# Night fuzz: integration/0.3.2 at 04a99222

- Head: 04a99222dcd49cdb2e9f98db036dfe528e087d81 (previous head for replays: a215ada512b7f51c68d9f7a195a41e22cb2b48d5)
- Run: 2026-11-03T01:18:24Z to 2026-11-03T01:22:58Z UTC (5 min wall, 4 processes)
- Generated seeds: 2026112400 to 2026112699 (300); real shapes: 57 (evidence c9a151d9); reduced cases: 6 (lab's cases/); grid generator (X1): seeds 2026112400 to 2026112499 (100)
- New failures (pass on a215ada5, fail on 04a99222): **none**

## Properties that count (failed reports / reports run)

| Property | generated | real shapes | grid | same seeds on a215ada5 (gen / shapes / grid) | kinds |
|---|---|---|---|---|---|
| V1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| V2 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| D1n | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| M1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B2new | 29/300 | 0/57 | 0/100 | 29/300 / 0/57 / 0/100 | new overlap introduced, said in pictureChecks.newOverlaps 26; new overlap introduced, not said in the plan, one of the two is a group box 7; new overlap introduced, not said in the plan 1 |
| B2unsaid | 1/300 | 0/57 | 0/100 | 1/300 / 0/57 / 0/100 | new overlap the plan does not mention (no group box involved) 1 |
| T1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| S1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| X1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |

D1n: D1 after normalising the twin's logical id (and renamed page ids). B2new: B2 for new overlaps only (visuals that did not overlap in English). B2unsaid: the B2new pairs the plan does not mention (pictureChecks.newOverlaps), neither of the two a group box. X1: the night lab's own check (a chart lined up with a matrix grid keeps its category order and its offset from the grid).

## The lab's own strict properties (counts only)

| Property | generated | real shapes | grid |
|---|---|---|---|
| D1 | 300/300 | 57/57 | 100/100 |
| B2 | 140/300 | 0/57 | 2/100 |
| B3 | 0/300 | 5/57 | 0/100 |
| P1 | 300/300 | 57/57 | 100/100 |

## The 6 reduced cases (lab cases/, replayed on the head)

- B1-1: counting properties failing: none (lab-only: P1, D1)
- B1-3: counting properties failing: none (lab-only: P1, D1)
- B2-1: counting properties failing: none (lab-only: P1, D1, B2)
- B3-1: counting properties failing: none (lab-only: P1, D1, B3)
- M1-1: counting properties failing: none (lab-only: P1, D1)
- V1-1: counting properties failing: none (lab-only: P1, D1)

## Cases (reduced, replayed on the head and the previous head)

| Case | Status | Failure | Cause |
|---|---|---|---|
| B2new-1 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-2 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:505` |
| B2new-3 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-4 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-5 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:505` |
| B2new-6 | OLD (fails on previous head too) | new overlap introduced, not said in the plan, one of the two is a group box | `mcp/lib/twin-pages.mjs:159` |
| B2new-7 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-8 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-9 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-10 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-11 | OLD (fails on previous head too) | new overlap introduced, not said in the plan, one of the two is a group box | `mcp/lib/twin-pages.mjs:37` |
| B2new-12 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-13 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-14 | OLD (fails on previous head too) | new overlap introduced, said in pictureChecks.newOverlaps | `mcp/lib/twin-pages.mjs:37` |
| B2new-15 | OLD (fails on previous head too) | new overlap introduced, not said in the plan, one of the two is a group box | `assets/js/report-mirror.js:739` |
| B2new-16 | OLD (fails on previous head too) | new overlap introduced, not said in the plan, one of the two is a group box | `mcp/lib/twin-pages.mjs:505` |
| B2unsaid-1 | OLD (fails on previous head too) | new overlap the plan does not mention (no group box involved) | `mcp/lib/twin-pictures.mjs:87`, `mcp/lib/twin-pages.mjs:37` |

Not reduced (the night lab reduces at most 4 per property and failure kind per process; the rest are counted above): 13 (B2new:new overlap introduced, said in pictureChecks.newOverlaps 13).

X1 judged 85 lined-up chart and grid pairs; skipped 17 (English sets no row header width, so the grid's left edge is not in the files); not at English's offset but said in the plan (movedByRule "kept at its mirror", not counted as a failure): 3.

## Lab errors (an exception, not a property failure)

None.

## Method

Codex's lab (evidence/0.3.1-fuzz, fuzz.mjs) copied outside the checkout, with four additions in the night lab's copy: D1n and B2new split out of D1 and B2; X1 and its grid generator (a weekday by hour heatmap with a column, line or area chart under or over it, both edges within one cell of the grid, sometimes in a group, Hour typed text or whole number); reduction only for the properties that count (P1 and raw D1 fail on every report by the lab's own definition). Made-up shapes only; no data values.
