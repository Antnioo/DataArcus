# B2new-10 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head a215ada512b7f51c68d9f7a195a41e22cb2b48d5. Previous head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112301 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v9",
      "p0/v14",
      "English [{\"x\":53,\"y\":701,\"width\":357,\"height\":99,\"z\":9000},{\"x\":424,\"y\":696,\"width\":163,\"height\":104,\"z\":14000}]",
      "Arabic [{\"x\":870,\"y\":701,\"width\":357,\"height\":99,\"z\":9000},{\"x\":745,\"y\":696,\"width\":163,\"height\":104,\"z\":14000}]",
      "plan on v9: none",
      "plan on v14: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a215ada5: fails P1, D1, B2, B2new
- 550cea1b: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
