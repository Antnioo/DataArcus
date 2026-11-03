# B2new-7 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113409 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v10",
      "p0/v12",
      "English [{\"x\":1340,\"y\":439,\"width\":104,\"height\":374,\"z\":10000},{\"x\":1080,\"y\":148,\"width\":250,\"height\":416,\"z\":12000}]",
      "Arabic [{\"x\":695,\"y\":439,\"width\":104,\"height\":374,\"z\":10000},{\"x\":590,\"y\":148,\"width\":250,\"height\":416,\"z\":12000}]",
      "plan on v10: movedByRule: moved with a button beside it",
      "plan on v12: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
