# B2new-9 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026111518 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:463`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v2",
      "p0/v3",
      "English [{\"x\":887,\"y\":258,\"width\":197,\"height\":162,\"z\":2000},{\"x\":48,\"y\":402,\"width\":229,\"height\":103,\"z\":3000}]",
      "Arabic [{\"x\":980,\"y\":258,\"width\":197,\"height\":162,\"z\":2000},{\"x\":1003,\"y\":402,\"width\":229,\"height\":103,\"z\":3000}]",
      "plan on v2: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "plan on v3: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
