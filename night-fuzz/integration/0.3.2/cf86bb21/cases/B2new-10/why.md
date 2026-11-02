# B2new-10 (B2new): new overlap introduced

Branch integration/0.3.2, head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7. Previous head a234f06f471118f6d6bf2f8c86aa8f7f555b6341.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026110927 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:463`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v3",
      "p0/v5",
      "English [{\"x\":294,\"y\":532,\"width\":305,\"height\":135,\"z\":3000},{\"x\":1148,\"y\":263,\"width\":614,\"height\":274,\"z\":5000}]",
      "Arabic [{\"x\":140,\"y\":532,\"width\":305,\"height\":135,\"z\":3000},{\"x\":158,\"y\":263,\"width\":614,\"height\":274,\"z\":5000}]",
      "plan on v3: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "plan on v5: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- cf86bb21: fails P1, D1, B2, B2new
- a234f06f: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
