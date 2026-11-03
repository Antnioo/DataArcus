# B2new-2 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113331 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v3",
      "p0/v9",
      "English [{\"x\":382,\"y\":558,\"width\":551,\"height\":162,\"z\":3000},{\"x\":60,\"y\":7,\"width\":230,\"height\":175,\"z\":9000}]",
      "Arabic [{\"x\":347,\"y\":558,\"width\":551,\"height\":162,\"z\":3000},{\"x\":0,\"y\":7,\"width\":304,\"height\":175,\"z\":9000}]",
      "plan on v3: none",
      "plan on v9: fitted.buttons",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
