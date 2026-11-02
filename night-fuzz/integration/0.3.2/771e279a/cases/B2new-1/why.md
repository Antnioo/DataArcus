# B2new-1 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111508 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:463`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v0",
      "p0/v13",
      "English [{\"x\":302,\"y\":461,\"width\":403,\"height\":251,\"z\":0},{\"x\":737,\"y\":254,\"width\":176,\"height\":302,\"z\":13000}]",
      "Arabic [{\"x\":575,\"y\":461,\"width\":403,\"height\":251,\"z\":0},{\"x\":526,\"y\":254,\"width\":176,\"height\":302,\"z\":13000}]",
      "plan on v0: none",
      "plan on v13: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
