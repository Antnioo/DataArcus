# B2new-5 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112770 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `assets/js/report-mirror.js:771`: the decision point for B2new (no plan rule named the visuals)

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v5",
      "p0/v14",
      "English [{\"x\":921,\"y\":165,\"width\":84,\"height\":473,\"z\":5000},{\"x\":73,\"y\":40,\"width\":339,\"height\":157,\"z\":14000}]",
      "Arabic [{\"x\":915,\"y\":165,\"width\":84,\"height\":473,\"z\":5000},{\"x\":78,\"y\":40,\"width\":339,\"height\":157,\"z\":14000}]",
      "plan on v5: none",
      "plan on v14: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
