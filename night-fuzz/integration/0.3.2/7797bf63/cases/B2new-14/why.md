# B2new-14 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113536 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v3",
      "p0/v4",
      "English [{\"x\":235,\"y\":388,\"width\":379,\"height\":331,\"z\":3000},{\"x\":705,\"y\":171,\"width\":408,\"height\":223,\"z\":4000}]",
      "Arabic [{\"x\":666,\"y\":388,\"width\":379,\"height\":331,\"z\":3000},{\"x\":396,\"y\":171,\"width\":408,\"height\":223,\"z\":4000}]",
      "plan on v3: none",
      "plan on v4: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
