# B2new-14 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026112732 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it
- `assets/js/report-mirror.js:739`: a badge moves with its host (same offset from the host left edge)

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v4",
      "p0/v5",
      "English [{\"x\":577,\"y\":571,\"width\":195,\"height\":79,\"z\":4000},{\"x\":1046,\"y\":568,\"width\":315,\"height\":143,\"z\":5000}]",
      "Arabic [{\"x\":1148,\"y\":571,\"width\":195,\"height\":79,\"z\":4000},{\"x\":860,\"y\":568,\"width\":315,\"height\":143,\"z\":5000}]",
      "plan on v4: movedByRule: a small visual kept on its host would cover another: mirrored on its own | keptTogether: small visuals on a bigger visual (badges, icons) [p0/v4 on v0]",
      "plan on v5: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
