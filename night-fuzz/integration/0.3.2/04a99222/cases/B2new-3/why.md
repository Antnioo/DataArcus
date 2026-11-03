# B2new-3 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112413 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v4",
      "p0/v13",
      "English [{\"x\":697,\"y\":362,\"width\":313,\"height\":327,\"z\":4000},{\"x\":204,\"y\":258,\"width\":392,\"height\":147,\"z\":13000}]",
      "Arabic [{\"x\":584,\"y\":362,\"width\":313,\"height\":327,\"z\":4000},{\"x\":684,\"y\":258,\"width\":392,\"height\":147,\"z\":13000}]",
      "plan on v4: movedByRule: moved with a button beside it",
      "plan on v13: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
