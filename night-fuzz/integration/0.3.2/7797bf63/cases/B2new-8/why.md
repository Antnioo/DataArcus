# B2new-8 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a. Previous head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113417 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v22",
      "p0/v24",
      "English [{\"x\":605,\"y\":654,\"width\":419,\"height\":426,\"z\":22000},{\"x\":323,\"y\":8,\"width\":229,\"height\":58,\"z\":24000}]",
      "Arabic [{\"x\":896,\"y\":654,\"width\":557,\"height\":426,\"z\":22000},{\"x\":141,\"y\":8,\"width\":229,\"height\":58,\"z\":24000}]",
      "plan on v22: fitted.buttons",
      "plan on v24: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 7797bf63: fails P1, D1, B2, B2new
- 90eaa7ca: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
