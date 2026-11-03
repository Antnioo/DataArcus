# X1-1 (X1): offset from the grid left edge differs

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026112713 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:307`: underGrids moves the chart once per matching heatmap and the last match wins: a small second heatmap over the chart passes the share test (0.8 of the narrower box) and pulls the chart off the grid it is lined up with (here to the page edge, "moved to stay inside its page")
- `mcp/lib/twin-pages.mjs:290`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on

## Failure metadata (head)

```json
[
  {
    "why": "offset from the grid left edge differs",
    "files": [
      "p0/v1",
      "p0/v0",
      "English offset -35.00 (grid left 69.00)",
      "Arabic offset -448.00 (grid left 832.00)",
      "plan on v1: movedByRule: kept lined up with its heatmap's grid, as English: its offset, padding, axis side and sort (the grid reads left to right), moved to stay inside its page | movedByRule: kept lined up with its heatmap's grid, as English: its offset, padding, axis side and sort (the grid reads left to right)",
      "plan on v0: none"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, X1
- 04a99222: fails P1, D1, X1

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
