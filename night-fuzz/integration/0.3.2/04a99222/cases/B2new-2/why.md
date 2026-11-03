# B2new-2 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112408 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v18",
      "p0/v21",
      "English [{\"x\":1461,\"y\":295,\"width\":459,\"height\":345,\"z\":18000},{\"x\":848,\"y\":169,\"width\":512,\"height\":214,\"z\":21000}]",
      "Arabic [{\"x\":204,\"y\":295,\"width\":459,\"height\":345,\"z\":18000},{\"x\":560,\"y\":169,\"width\":512,\"height\":214,\"z\":21000}]",
      "plan on v18: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "plan on v21: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
