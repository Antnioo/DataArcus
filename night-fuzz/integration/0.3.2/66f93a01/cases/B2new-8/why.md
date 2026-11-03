# B2new-8 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112856 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v13",
      "p0/v15",
      "English [{\"x\":981,\"y\":158,\"width\":299,\"height\":296,\"z\":13000},{\"x\":636,\"y\":23,\"width\":314,\"height\":266,\"z\":15000}]",
      "Arabic [{\"x\":154,\"y\":158,\"width\":299,\"height\":296,\"z\":13000},{\"x\":330,\"y\":23,\"width\":314,\"height\":266,\"z\":15000}]",
      "plan on v13: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "plan on v15: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
