# B2new-3 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113639 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v1",
      "p0/v12",
      "English [{\"x\":1570,\"y\":676,\"width\":350,\"height\":403,\"z\":1000},{\"x\":751,\"y\":744,\"width\":624,\"height\":226,\"z\":12000}]",
      "Arabic [{\"x\":0,\"y\":676,\"width\":350,\"height\":403,\"z\":1000},{\"x\":337,\"y\":744,\"width\":624,\"height\":226,\"z\":12000}]",
      "plan on v1: none",
      "plan on v12: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
