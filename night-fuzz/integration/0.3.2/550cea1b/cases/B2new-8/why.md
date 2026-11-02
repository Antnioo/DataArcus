# B2new-8 (B2new): new overlap introduced

Branch integration/0.3.2, head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3. Previous head 771e279a54dcf6900cf4d49f430f246b4134c00b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112005 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v4",
      "p0/v21",
      "English [{\"x\":525,\"y\":354,\"width\":574,\"height\":322,\"z\":4000},{\"x\":1146,\"y\":126,\"width\":134,\"height\":237,\"z\":21000}]",
      "Arabic [{\"x\":181,\"y\":354,\"width\":574,\"height\":322,\"z\":4000},{\"x\":59,\"y\":126,\"width\":134,\"height\":237,\"z\":21000}]",
      "plan on v4: none",
      "plan on v21: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge)",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 550cea1b: fails P1, D1, B2, B2new
- 771e279a: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
