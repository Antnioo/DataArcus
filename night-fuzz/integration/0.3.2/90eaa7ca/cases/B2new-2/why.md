# B2new-2 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113003 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v12",
      "p0/v14",
      "English [{\"x\":76,\"y\":601,\"width\":271,\"height\":141,\"z\":12000},{\"x\":549,\"y\":449,\"width\":253,\"height\":351,\"z\":14000}]",
      "Arabic [{\"x\":933,\"y\":601,\"width\":271,\"height\":141,\"z\":12000},{\"x\":736,\"y\":449,\"width\":253,\"height\":351,\"z\":14000}]",
      "plan on v12: none",
      "plan on v14: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2new
- 66f93a01: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
