# B2new-13 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113160 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v8",
      "p0/v9",
      "English [{\"x\":1019,\"y\":19,\"width\":261,\"height\":273,\"z\":8000},{\"x\":116,\"y\":34,\"width\":201,\"height\":285,\"z\":9000}]",
      "Arabic [{\"x\":0,\"y\":19,\"width\":261,\"height\":273,\"z\":8000},{\"x\":0,\"y\":34,\"width\":367,\"height\":285,\"z\":9000}]",
      "plan on v8: none",
      "plan on v9: fitted.buttons",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2new
- 66f93a01: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
