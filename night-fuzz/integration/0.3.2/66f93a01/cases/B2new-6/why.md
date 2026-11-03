# B2new-6 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112851 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v3",
      "p0/v11",
      "English [{\"x\":974,\"y\":960,\"width\":331,\"height\":120,\"z\":3000},{\"x\":1448,\"y\":608,\"width\":210,\"height\":472,\"z\":11000}]",
      "Arabic [{\"x\":615,\"y\":960,\"width\":331,\"height\":120,\"z\":3000},{\"x\":262,\"y\":608,\"width\":474,\"height\":472,\"z\":11000}]",
      "plan on v3: movedByRule: gave width to a button beside it",
      "plan on v11: fitted.buttons",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
