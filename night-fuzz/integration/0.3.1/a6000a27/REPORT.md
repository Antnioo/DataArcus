# Night fuzz: integration/0.3.1 at a6000a27

- Head: a6000a279374788cf6f0a76246b08d41eff23f86 (previous head for replays: eb09d194d04d5eb296a440891a326a5110aef094)
- Run: 2026-11-02T21:09:05Z to 2026-11-02T21:12:19Z UTC (3 min wall, 4 processes)
- Generated seeds: 2026110300 to 2026110599 (300); real shapes: 57 (evidence c9a151d9); reduced cases: 6 (lab's cases/); grid generator (X1): seeds 2026110300 to 2026110399 (100)
- New failures (pass on eb09d194, fail on a6000a27): **B2new-1, B2new-6, B2new-8, B2new-9, B2new-10, B2new-11, B2new-12**

## Properties that count (failed reports / reports run)

| Property | generated | real shapes | grid | same seeds on eb09d194 (gen / shapes / grid) | kinds |
|---|---|---|---|---|---|
| V1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| V2 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| D1n | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| M1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B2new | 53/300 | 0/57 | 7/100 | 33/300 / 0/57 / 0/100 | new overlap introduced 60 |
| T1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| S1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| X1 | 0/300 | 0/57 | 65/100 | 0/300 / 0/57 / 80/100 | category order changes against the grid 65; offset from the grid left edge differs 2 |

D1n: D1 after normalising the twin's logical id (and renamed page ids). B2new: B2 for new overlaps only (visuals that did not overlap in English). X1: the night lab's own check (a chart lined up with a matrix grid keeps its category order and its offset from the grid).

## The lab's own strict properties (counts only)

| Property | generated | real shapes | grid |
|---|---|---|---|
| D1 | 300/300 | 57/57 | 100/100 |
| B2 | 138/300 | 0/57 | 13/100 |
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
| B2new-1 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253`, `mcp/lib/twin-pages.mjs:474` |
| B2new-2 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:36` |
| B2new-3 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:463` |
| B2new-4 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:36` |
| B2new-5 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:36` |
| B2new-6 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| B2new-7 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:36` |
| B2new-8 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| B2new-9 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| B2new-10 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| B2new-11 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| B2new-12 | NEW (passes on previous head) | new overlap introduced | `mcp/lib/twin-pages.mjs:253` |
| X1-1 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |
| X1-2 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |
| X1-3 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |
| X1-4 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |
| X1-5 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |
| X1-6 | OLD (fails on previous head too) | category order changes against the grid | `assets/js/report-mirror.js:173`, `mcp/lib/twin-pages.mjs:253` |

Not reduced (the night lab reduces at most 4 per property and failure kind per process; the rest are counted above): 107 (B2new:new overlap introduced 48; X1:category order changes against the grid 59).

X1 judged 191 lined-up chart and grid pairs; skipped 24 (English sets no row header width, so the grid's left edge is not in the files).

## Lab errors (an exception, not a property failure)

None.

## Method

Codex's lab (evidence/0.3.1-fuzz, fuzz.mjs) copied outside the checkout, with four additions in the night lab's copy: D1n and B2new split out of D1 and B2; X1 and its grid generator (a weekday by hour heatmap with a column, line or area chart under or over it, both edges within one cell of the grid, sometimes in a group, Hour typed text or whole number); reduction only for the properties that count (P1 and raw D1 fail on every report by the lab's own definition). Made-up shapes only; no data values.
