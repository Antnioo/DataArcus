# Night fuzz: integration/0.3.1 at 1a5f6584

- Head: 1a5f65847c837bae50608ef9dfed1f2b170f8e7c (previous head for replays: a6000a279374788cf6f0a76246b08d41eff23f86)
- Run: 2026-11-02T23:32:42Z to 2026-11-02T23:35:42Z UTC (3 min wall, 4 processes)
- Generated seeds: 2026111200 to 2026111499 (300); real shapes: 57 (evidence c9a151d9); reduced cases: 6 (lab's cases/); grid generator (X1): seeds 2026111200 to 2026111299 (100)
- New failures (pass on a6000a27, fail on 1a5f6584): **none**

## Properties that count (failed reports / reports run)

| Property | generated | real shapes | grid | same seeds on a6000a27 (gen / shapes / grid) | kinds |
|---|---|---|---|---|---|
| V1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| V2 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| D1n | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| M1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| B2new | 26/300 | 0/57 | 0/100 | 47/300 / 0/57 / 5/100 | new overlap introduced 26 |
| T1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| S1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 0/100 | - |
| X1 | 0/300 | 0/57 | 0/100 | 0/300 / 0/57 / 51/100 | - |

D1n: D1 after normalising the twin's logical id (and renamed page ids). B2new: B2 for new overlaps only (visuals that did not overlap in English). X1: the night lab's own check (a chart lined up with a matrix grid keeps its category order and its offset from the grid).

## The lab's own strict properties (counts only)

| Property | generated | real shapes | grid |
|---|---|---|---|
| D1 | 300/300 | 57/57 | 100/100 |
| B2 | 138/300 | 0/57 | 5/100 |
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
| B2new-1 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:505` |
| B2new-2 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-3 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-4 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-5 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-6 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-7 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |
| B2new-8 | OLD (fails on previous head too) | new overlap introduced | `mcp/lib/twin-pages.mjs:37` |

Not reduced (the night lab reduces at most 4 per property and failure kind per process; the rest are counted above): 18 (B2new:new overlap introduced 18).

X1 judged 75 lined-up chart and grid pairs; skipped 25 (English sets no row header width, so the grid's left edge is not in the files); not at English's offset but said in the plan (movedByRule "kept at its mirror", not counted as a failure): 3.

## Lab errors (an exception, not a property failure)

None.

## Method

Codex's lab (evidence/0.3.1-fuzz, fuzz.mjs) copied outside the checkout, with four additions in the night lab's copy: D1n and B2new split out of D1 and B2; X1 and its grid generator (a weekday by hour heatmap with a column, line or area chart under or over it, both edges within one cell of the grid, sometimes in a group, Hour typed text or whole number); reduction only for the properties that count (P1 and raw D1 fail on every report by the lab's own definition). Made-up shapes only; no data values.
