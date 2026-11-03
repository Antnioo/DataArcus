# B2new-15 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026113383 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v2",
      "p0/v3",
      "English [{\"x\":256,\"y\":152,\"width\":297,\"height\":180,\"z\":2000},{\"x\":625,\"y\":194,\"width\":321,\"height\":191,\"z\":3000}]",
      "Arabic [{\"x\":727,\"y\":152,\"width\":297,\"height\":180,\"z\":2000},{\"x\":430,\"y\":194,\"width\":321,\"height\":191,\"z\":3000}]",
      "plan on v2: none",
      "plan on v3: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
