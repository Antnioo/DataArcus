# B2new-13 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112582 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v14",
      "p0/v17",
      "English [{\"x\":617,\"y\":246,\"width\":125,\"height\":210,\"z\":14000},{\"x\":203,\"y\":154,\"width\":401,\"height\":207,\"z\":17000}]",
      "Arabic [{\"x\":742,\"y\":246,\"width\":125,\"height\":210,\"z\":14000},{\"x\":676,\"y\":154,\"width\":401,\"height\":207,\"z\":17000}]",
      "plan on v14: movedByRule: moved with a button beside it",
      "plan on v17: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
