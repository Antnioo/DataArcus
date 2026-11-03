# B2unsaid-1 (B2unsaid): new overlap the plan does not mention (no group box involved)

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111445 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pictures.mjs:87`: the new-overlap pass (MX8) skips pages kept left to right, while the page's visuals can still move (a button fitted to its Arabic text)
- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap the plan does not mention (no group box involved)",
    "files": [
      "p0/v4",
      "p0/v8",
      "English [{\"x\":1118,\"y\":50,\"width\":108,\"height\":189,\"z\":4000},{\"x\":170,\"y\":3,\"width\":135,\"height\":116,\"z\":8000}]",
      "Arabic [{\"x\":960,\"y\":50,\"width\":320,\"height\":189,\"z\":4000},{\"x\":170,\"y\":3,\"width\":135,\"height\":116,\"z\":8000}]",
      "plan on v4: fitted.buttons",
      "plan on v8: none",
      "page kept left to right: true; picture: kept"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2unsaid, B2new
- a6000a27: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
