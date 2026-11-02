# X1-4 (X1): category order changes against the grid

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026111503 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `assets/js/report-mirror.js:173`: chartRtl flips a column/line/area chart's category sort (a text category: its order reverses in Desktop)
- `mcp/lib/twin-pages.mjs:253`: underGrids (MX7) keeps the chart's offset from the grid, while the grid keeps English's left-to-right column order: the chart's categories no longer stand under their columns

## Failure metadata (head)

```json
[
  {
    "why": "category order changes against the grid",
    "files": [
      "p0/v1",
      "p0/v0",
      "chart sort Ascending -> sort Descending (string axis)",
      "grid columns Ascending -> Ascending"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, X1
- cf86bb21: fails P1, D1, X1

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
