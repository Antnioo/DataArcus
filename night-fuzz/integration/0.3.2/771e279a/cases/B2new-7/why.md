# B2new-7 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111653 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v1",
      "p0/v6",
      "English [{\"x\":245,\"y\":896,\"width\":628,\"height\":184,\"z\":1000},{\"x\":919,\"y\":798,\"width\":406,\"height\":282,\"z\":6000}]",
      "Arabic [{\"x\":1047,\"y\":896,\"width\":628,\"height\":184,\"z\":1000},{\"x\":981,\"y\":798,\"width\":406,\"height\":282,\"z\":6000}]",
      "plan on v1: none",
      "plan on v6: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
