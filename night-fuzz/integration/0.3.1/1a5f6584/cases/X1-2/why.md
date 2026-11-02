# X1-2 (X1): offset from the grid left edge differs

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**NEW (passes on previous head).**

Found by: grid (X1 generator), seeds 2026111255 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:290`: underGrids (MX7): the lined-up chart is not at English's offset from the grid left edge

## Failure metadata (head)

```json
[
  {
    "why": "offset from the grid left edge differs",
    "files": [
      "p0/v1",
      "p0/v0",
      "English offset 16.00 (grid left 1057.00)",
      "Arabic offset -108.00 (grid left 404.00)",
      "plan on v1: movedByRule: kept at its mirror, not lined up with its heatmap's grid: there it would cover v2, which it does not in English",
      "plan on v0: none"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, X1
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
