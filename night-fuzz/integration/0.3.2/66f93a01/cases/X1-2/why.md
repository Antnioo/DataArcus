# X1-2 (X1): offset from the grid left edge differs

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026112747 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:290`: underGrids (MX7): the lined-up chart is not at English's offset from the grid left edge
- `mcp/lib/twin-pages.mjs:290`: MX7 rule: a chart lined up with a heatmap grid takes English's offset from the grid left edge; nothing checks what it lands on
- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "offset from the grid left edge differs",
    "files": [
      "p0/v1",
      "p0/v0",
      "English offset -18.00 (grid left 534.00)",
      "Arabic offset -58.00 (grid left 180.00)",
      "plan on v1: movedByRule: kept lined up with its heatmap's grid, as English: its offset, padding, axis side and sort (the grid reads left to right) | movedByRule: moved with a button beside it",
      "plan on v0: none"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, X1
- 04a99222: fails P1, D1, X1

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
