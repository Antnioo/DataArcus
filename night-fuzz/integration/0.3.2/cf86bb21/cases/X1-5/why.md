# X1-5 (X1): offset from the grid left edge differs

Branch integration/0.3.2, head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7. Previous head a234f06f471118f6d6bf2f8c86aa8f7f555b6341.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026110946 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:270`: underGrids moves the chart once per matching heatmap and the last match wins: a small second heatmap over the chart passes the share test (0.8 of the narrower box) and pulls the chart off the grid it is lined up with (here to the page edge, "moved to stay inside its page")
- `mcp/lib/twin-pages.mjs:253`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "offset from the grid left edge differs",
    "files": [
      "p0/v1",
      "p0/v0",
      "English offset 32.00 (grid left 290.00)",
      "Arabic offset -108.00 (grid left 108.00)",
      "plan on v1: movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge) | movedByRule: kept lined up with its heatmap's grid (English's offset from its left edge), moved to stay inside its page",
      "plan on v0: none"
    ]
  }
]
```

## Replays

- cf86bb21: fails P1, D1, X1
- a234f06f: fails P1, D1, X1

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
