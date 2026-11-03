# B2new-3 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113354 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v0",
      "p0/v3",
      "English [{\"x\":991,\"y\":522,\"width\":289,\"height\":231,\"z\":0},{\"x\":899,\"y\":475,\"width\":62,\"height\":325,\"z\":3000}]",
      "Arabic [{\"x\":0,\"y\":522,\"width\":289,\"height\":231,\"z\":0},{\"x\":196,\"y\":475,\"width\":62,\"height\":325,\"z\":3000}]",
      "plan on v0: movedByRule: gave width to a button beside it",
      "plan on v3: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
