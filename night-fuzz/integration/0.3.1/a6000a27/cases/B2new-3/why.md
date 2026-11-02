# B2new-3 (B2new): new overlap introduced

Branch integration/0.3.1, head a6000a279374788cf6f0a76246b08d41eff23f86. Previous head eb09d194d04d5eb296a440891a326a5110aef094.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110312 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:463`: a bar chart over a table kept on it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v10",
      "p0/v12",
      "English [{\"x\":1743,\"y\":1007,\"width\":177,\"height\":73,\"z\":10000},{\"x\":749,\"y\":846,\"width\":768,\"height\":234,\"z\":12000}]",
      "Arabic [{\"x\":670,\"y\":1007,\"width\":177,\"height\":73,\"z\":10000},{\"x\":403,\"y\":846,\"width\":768,\"height\":234,\"z\":12000}]",
      "plan on v10: movedByRule: a bar chart over a table or matrix that stays left to right: kept on it, its bars' direction kept",
      "plan on v12: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a6000a27: fails P1, D1, B2, B2new
- eb09d194: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
