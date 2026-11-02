# B2new-9 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026110605 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v2",
      "p0/v3",
      "English [{\"x\":561,\"y\":104,\"width\":371,\"height\":114,\"z\":2000},{\"x\":347,\"y\":146,\"width\":184,\"height\":72,\"z\":3000}]",
      "Arabic [{\"x\":348,\"y\":104,\"width\":371,\"height\":114,\"z\":2000},{\"x\":335,\"y\":146,\"width\":184,\"height\":72,\"z\":3000}]",
      "plan on v2: none",
      "plan on v3: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
