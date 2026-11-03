# B2new-6 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113391 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v2",
      "p0/v8",
      "English [{\"x\":700,\"y\":382,\"width\":76,\"height\":243,\"z\":2000},{\"x\":305,\"y\":382,\"width\":393,\"height\":30,\"z\":8000}]",
      "Arabic [{\"x\":779,\"y\":382,\"width\":76,\"height\":243,\"z\":2000},{\"x\":582,\"y\":382,\"width\":393,\"height\":30,\"z\":8000}]",
      "plan on v2: movedByRule: moved with a button beside it",
      "plan on v8: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
