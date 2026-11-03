# B2unsaid-1 (B2unsaid): new overlap the plan does not mention (no group box involved)

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112898 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pictures.mjs:87`: the new-overlap pass (MX8) skips pages kept left to right, while the page's visuals can still move (a button fitted to its Arabic text)
- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap the plan does not mention (no group box involved)",
    "files": [
      "p0/v10",
      "p0/v14",
      "English [{\"x\":411,\"y\":198,\"width\":225,\"height\":362,\"z\":10000},{\"x\":836,\"y\":318,\"width\":715,\"height\":438,\"z\":14000}]",
      "Arabic [{\"x\":411,\"y\":198,\"width\":225,\"height\":362,\"z\":10000},{\"x\":444,\"y\":318,\"width\":715,\"height\":438,\"z\":14000}]",
      "plan on v10: none",
      "plan on v14: movedByRule: moved with a button beside it",
      "page kept left to right: true; picture: kept"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2unsaid, B2new
- 04a99222: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
