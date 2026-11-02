# B2new-11 (B2new): new overlap introduced

Branch integration/0.3.2, head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7. Previous head a234f06f471118f6d6bf2f8c86aa8f7f555b6341.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026110937 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on
- `assets/js/report-mirror.js:724`: a badge moves with its host (same offset from the host left edge)

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v3",
      "p0/v5",
      "English [{\"x\":392,\"y\":220,\"width\":169,\"height\":113,\"z\":3000},{\"x\":753,\"y\":196,\"width\":170,\"height\":161,\"z\":5000}]",
      "Arabic [{\"x\":311,\"y\":220,\"width\":169,\"height\":113,\"z\":3000},{\"x\":357,\"y\":196,\"width\":170,\"height\":161,\"z\":5000}]",
      "plan on v3: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "plan on v5: movedByRule: a small visual kept on its host would cover another: mirrored on its own | keptTogether: small visuals on a bigger visual (badges, icons) [p0/v5 on v0]",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- cf86bb21: fails P1, D1, B2, B2new
- a234f06f: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
