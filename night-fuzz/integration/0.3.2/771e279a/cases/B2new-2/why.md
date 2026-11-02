# B2new-2 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111520 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v18",
      "p0/v20",
      "English [{\"x\":428,\"y\":589,\"width\":98,\"height\":131,\"z\":18000},{\"x\":568,\"y\":486,\"width\":393,\"height\":234,\"z\":20000}]",
      "Arabic [{\"x\":754,\"y\":589,\"width\":98,\"height\":131,\"z\":18000},{\"x\":466,\"y\":486,\"width\":393,\"height\":234,\"z\":20000}]",
      "plan on v18: none",
      "plan on v20: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
