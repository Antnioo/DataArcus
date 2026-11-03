# B2unsaid-1 (B2unsaid): new overlap the plan does not mention (no group box involved)

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113256 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pictures.mjs:87`: the new-overlap pass (MX8) skips pages kept left to right, while the page's visuals can still move (a button fitted to its Arabic text)
- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap the plan does not mention (no group box involved)",
    "files": [
      "p0/v18",
      "p0/v19",
      "English [{\"x\":49,\"y\":104,\"width\":126,\"height\":177,\"z\":18000},{\"x\":248,\"y\":517,\"width\":296,\"height\":283,\"z\":19000}]",
      "Arabic [{\"x\":49,\"y\":104,\"width\":126,\"height\":177,\"z\":18000},{\"x\":96,\"y\":517,\"width\":448,\"height\":283,\"z\":19000}]",
      "plan on v18: none",
      "plan on v19: fitted.buttons",
      "page kept left to right: true; picture: kept"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2unsaid, B2new
- 66f93a01: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
