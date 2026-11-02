# B2new-11 (B2new): new overlap introduced

Branch integration/0.3.2, head 771e279a54dcf6900cf4d49f430f246b4134c00b. Previous head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7.

**OLD (fails on previous head too).**

Found by: grid (X1 generator), seeds 2026111554 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `assets/js/report-mirror.js:724`: a badge moves with its host (same offset from the host left edge)

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v1",
      "p0/v3",
      "English [{\"x\":102,\"y\":0,\"width\":862,\"height\":164,\"z\":1000},{\"x\":17,\"y\":202,\"width\":78,\"height\":98,\"z\":3000}]",
      "Arabic [{\"x\":7,\"y\":0,\"width\":862,\"height\":164,\"z\":1000},{\"x\":326,\"y\":202,\"width\":78,\"height\":98,\"z\":3000}]",
      "plan on v1: none",
      "plan on v3: keptTogether: small visuals on a bigger visual (badges, icons) [p0/v3 on v0]",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 771e279a: fails P1, D1, B2, B2new
- cf86bb21: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
