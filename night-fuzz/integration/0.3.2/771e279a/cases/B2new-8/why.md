# B2new-8 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111665 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v5",
      "p0/v6",
      "English [{\"x\":402,\"y\":390,\"width\":120,\"height\":38,\"z\":5000},{\"x\":90,\"y\":162,\"width\":294,\"height\":265,\"z\":6000}]",
      "Arabic [{\"x\":1070,\"y\":390,\"width\":120,\"height\":38,\"z\":5000},{\"x\":896,\"y\":162,\"width\":294,\"height\":265,\"z\":6000}]",
      "plan on v5: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "plan on v6: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
