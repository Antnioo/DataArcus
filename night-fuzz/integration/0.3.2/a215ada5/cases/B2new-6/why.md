# B2new-6 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head a215ada512b7f51c68d9f7a195a41e22cb2b48d5. Previous head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112253 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v18",
      "p0/v20",
      "English [{\"x\":840,\"y\":457,\"width\":246,\"height\":306,\"z\":18000},{\"x\":338,\"y\":195,\"width\":452,\"height\":265,\"z\":20000}]",
      "Arabic [{\"x\":369,\"y\":457,\"width\":246,\"height\":306,\"z\":18000},{\"x\":490,\"y\":195,\"width\":452,\"height\":265,\"z\":20000}]",
      "plan on v18: movedByRule: moved with a button beside it",
      "plan on v20: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- a215ada5: fails P1, D1, B2, B2new
- 550cea1b: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
