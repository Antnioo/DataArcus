# B2new-14 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 90eaa7ca37adc283c3d5b5c1d5b637fda49f1f03. Previous head 66f93a0136e8bf76ca9f562a610e01e5dae1988b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113171 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:505`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v14",
      "p0/v20",
      "English [{\"x\":928,\"y\":774,\"width\":763,\"height\":134,\"z\":14000},{\"x\":1701,\"y\":437,\"width\":185,\"height\":451,\"z\":20000}]",
      "Arabic [{\"x\":0,\"y\":774,\"width\":763,\"height\":134,\"z\":14000},{\"x\":34,\"y\":437,\"width\":185,\"height\":451,\"z\":20000}]",
      "plan on v14: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept; moved 115 to stay inside its page",
      "plan on v20: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 90eaa7ca: fails P1, D1, B2, B2new
- 66f93a01: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
