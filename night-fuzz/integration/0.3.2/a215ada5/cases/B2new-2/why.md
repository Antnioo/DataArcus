# B2new-2 (B2new): new overlap introduced

Branch integration/0.3.2, head a215ada512b7f51c68d9f7a195a41e22cb2b48d5. Previous head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112126 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v8",
      "p0/v17",
      "English [{\"x\":723,\"y\":386,\"width\":179,\"height\":312,\"z\":8000},{\"x\":1001,\"y\":259,\"width\":527,\"height\":440,\"z\":17000}]",
      "Arabic [{\"x\":727,\"y\":386,\"width\":477,\"height\":312,\"z\":8000},{\"x\":392,\"y\":259,\"width\":527,\"height\":440,\"z\":17000}]",
      "plan on v8: fitted.buttons",
      "plan on v17: movedByRule: gave width to a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- a215ada5: fails P1, D1, B2, B2new
- 550cea1b: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
