# B2new-4 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head a215ada512b7f51c68d9f7a195a41e22cb2b48d5. Previous head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112130 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v7",
      "p0/v12",
      "English [{\"x\":902,\"y\":431,\"width\":378,\"height\":369,\"z\":7000},{\"x\":343,\"y\":615,\"width\":552,\"height\":185,\"z\":12000}]",
      "Arabic [{\"x\":0,\"y\":431,\"width\":378,\"height\":369,\"z\":7000},{\"x\":100,\"y\":615,\"width\":552,\"height\":185,\"z\":12000}]",
      "plan on v7: none",
      "plan on v12: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- a215ada5: fails P1, D1, B2, B2new
- 550cea1b: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
