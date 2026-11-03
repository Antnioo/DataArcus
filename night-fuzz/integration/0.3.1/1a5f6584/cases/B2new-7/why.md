# B2new-7 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111324 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v9",
      "p0/v17",
      "English [{\"x\":762,\"y\":381,\"width\":213,\"height\":309,\"z\":9000},{\"x\":357,\"y\":640,\"width\":233,\"height\":80,\"z\":17000}]",
      "Arabic [{\"x\":530,\"y\":381,\"width\":213,\"height\":309,\"z\":9000},{\"x\":690,\"y\":640,\"width\":233,\"height\":80,\"z\":17000}]",
      "plan on v9: movedByRule: moved with a button beside it",
      "plan on v17: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
