# B2new-1 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111242 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v16",
      "p0/v20",
      "English [{\"x\":434,\"y\":133,\"width\":418,\"height\":253,\"z\":16000},{\"x\":1149,\"y\":316,\"width\":131,\"height\":208,\"z\":20000}]",
      "Arabic [{\"x\":428,\"y\":133,\"width\":418,\"height\":253,\"z\":16000},{\"x\":403,\"y\":316,\"width\":131,\"height\":208,\"z\":20000}]",
      "plan on v16: none",
      "plan on v20: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
