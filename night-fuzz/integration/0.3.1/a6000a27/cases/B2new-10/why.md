# B2new-10 (B2new): new overlap introduced

Branch integration/0.3.1, head a6000a279374788cf6f0a76246b08d41eff23f86. Previous head eb09d194d04d5eb296a440891a326a5110aef094.

**NEW (passes on previous head).**

Found by: grid (X1 generator), seeds 2026110322 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v4",
      "p0/v5",
      "English [{\"x\":552,\"y\":173,\"width\":474,\"height\":168,\"z\":4000},{\"x\":1093,\"y\":177,\"width\":483,\"height\":219,\"z\":5000}]",
      "Arabic [{\"x\":894,\"y\":173,\"width\":474,\"height\":168,\"z\":4000},{\"x\":1320,\"y\":177,\"width\":483,\"height\":219,\"z\":5000}]",
      "plan on v4: none",
      "plan on v5: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a6000a27: fails P1, D1, B2, B2new
- eb09d194: fails P1, D1

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
