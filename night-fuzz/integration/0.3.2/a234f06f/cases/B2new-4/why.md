# B2new-4 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110613 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v7",
      "p0/v12",
      "English [{\"x\":1551,\"y\":879,\"width\":369,\"height\":201,\"z\":7000},{\"x\":1297,\"y\":606,\"width\":109,\"height\":474,\"z\":12000}]",
      "Arabic [{\"x\":212,\"y\":879,\"width\":369,\"height\":201,\"z\":7000},{\"x\":514,\"y\":606,\"width\":109,\"height\":474,\"z\":12000}]",
      "plan on v7: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "plan on v12: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
