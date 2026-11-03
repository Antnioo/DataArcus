# B2new-18 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113298 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v13",
      "p0/v14",
      "English [{\"x\":457,\"y\":541,\"width\":358,\"height\":179,\"z\":13000},{\"x\":900,\"y\":332,\"width\":380,\"height\":217,\"z\":14000}]",
      "Arabic [{\"x\":465,\"y\":541,\"width\":358,\"height\":179,\"z\":13000},{\"x\":115,\"y\":332,\"width\":380,\"height\":217,\"z\":14000}]",
      "plan on v13: none",
      "plan on v14: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2new
- 66f93a01: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
