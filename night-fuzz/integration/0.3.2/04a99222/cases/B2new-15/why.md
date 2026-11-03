# B2new-15 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112589 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `assets/js/report-mirror.js:739`: a badge moves with its host (same offset from the host left edge)

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v2",
      "p0/v12",
      "English [{\"x\":196,\"y\":472,\"width\":657,\"height\":371,\"z\":2000},{\"x\":1386,\"y\":757,\"width\":222,\"height\":131,\"z\":12000}]",
      "Arabic [{\"x\":1067,\"y\":472,\"width\":657,\"height\":371,\"z\":2000},{\"x\":919,\"y\":757,\"width\":222,\"height\":131,\"z\":12000}]",
      "plan on v2: none",
      "plan on v12: keptTogether: small visuals on a bigger visual (badges, icons) [p0/v12 on v0]",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
