# B2new-17 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113272 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v16",
      "p0/v17",
      "English [{\"x\":448,\"y\":180,\"width\":210,\"height\":251,\"z\":16000},{\"x\":110,\"y\":115,\"width\":268,\"height\":184,\"z\":17000}]",
      "Arabic [{\"x\":825,\"y\":180,\"width\":210,\"height\":251,\"z\":16000},{\"x\":902,\"y\":115,\"width\":268,\"height\":184,\"z\":17000}]",
      "plan on v16: movedByRule: moved with a button beside it",
      "plan on v17: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2new
- 66f93a01: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
