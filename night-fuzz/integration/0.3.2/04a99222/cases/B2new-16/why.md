# B2new-16 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112601 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v9",
      "p0/v18",
      "English [{\"x\":306,\"y\":428,\"width\":536,\"height\":363,\"z\":9000},{\"x\":123,\"y\":701,\"width\":131,\"height\":99,\"z\":18000}]",
      "Arabic [{\"x\":438,\"y\":428,\"width\":536,\"height\":363,\"z\":9000},{\"x\":761,\"y\":701,\"width\":131,\"height\":99,\"z\":18000}]",
      "plan on v9: none",
      "plan on v18: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
