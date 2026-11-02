# B2new-2 (B2new): new overlap introduced

Branch integration/0.3.2, head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7. Previous head a234f06f471118f6d6bf2f8c86aa8f7f555b6341.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110902 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v1",
      "p0/v3",
      "English [{\"x\":871,\"y\":767,\"width\":315,\"height\":42,\"z\":1000},{\"x\":1487,\"y\":725,\"width\":433,\"height\":259,\"z\":3000}]",
      "Arabic [{\"x\":734,\"y\":767,\"width\":315,\"height\":42,\"z\":1000},{\"x\":382,\"y\":725,\"width\":433,\"height\":259,\"z\":3000}]",
      "plan on v1: none",
      "plan on v3: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- cf86bb21: fails P1, D1, B2, B2new
- a234f06f: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
