# B2new-6 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110760 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v13",
      "p0/v16",
      "English [{\"x\":603,\"y\":243,\"width\":236,\"height\":285,\"z\":13000},{\"x\":848,\"y\":295,\"width\":432,\"height\":190,\"z\":16000}]",
      "Arabic [{\"x\":151,\"y\":243,\"width\":236,\"height\":285,\"z\":13000},{\"x\":0,\"y\":295,\"width\":432,\"height\":190,\"z\":16000}]",
      "plan on v13: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "plan on v16: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
