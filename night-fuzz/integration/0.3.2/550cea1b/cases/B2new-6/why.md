# B2new-6 (B2new): new overlap introduced

Branch integration/0.3.2, head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3. Previous head 771e279a54dcf6900cf4d49f430f246b4134c00b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111961 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v9",
      "p0/v14",
      "English [{\"x\":230,\"y\":601,\"width\":170,\"height\":199,\"z\":9000},{\"x\":458,\"y\":324,\"width\":295,\"height\":337,\"z\":14000}]",
      "Arabic [{\"x\":880,\"y\":601,\"width\":170,\"height\":199,\"z\":9000},{\"x\":588,\"y\":324,\"width\":295,\"height\":337,\"z\":14000}]",
      "plan on v9: none",
      "plan on v14: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 550cea1b: fails P1, D1, B2, B2new
- 771e279a: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
