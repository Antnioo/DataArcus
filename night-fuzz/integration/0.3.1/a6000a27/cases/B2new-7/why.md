# B2new-7 (B2new): new overlap introduced

Branch integration/0.3.1, head a6000a279374788cf6f0a76246b08d41eff23f86. Previous head eb09d194d04d5eb296a440891a326a5110aef094.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110462 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v10",
      "p0/v15",
      "English [{\"x\":199,\"y\":635,\"width\":347,\"height\":165,\"z\":10000},{\"x\":29,\"y\":537,\"width\":128,\"height\":263,\"z\":15000}]",
      "Arabic [{\"x\":734,\"y\":635,\"width\":347,\"height\":165,\"z\":10000},{\"x\":895,\"y\":537,\"width\":385,\"height\":263,\"z\":15000}]",
      "plan on v10: movedByRule: gave width to a button beside it",
      "plan on v15: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  },
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v12",
      "p0/v15",
      "English [{\"x\":307,\"y\":616,\"width\":286,\"height\":184,\"z\":12000},{\"x\":29,\"y\":537,\"width\":128,\"height\":263,\"z\":15000}]",
      "Arabic [{\"x\":687,\"y\":616,\"width\":286,\"height\":184,\"z\":12000},{\"x\":895,\"y\":537,\"width\":385,\"height\":263,\"z\":15000}]",
      "plan on v12: none",
      "plan on v15: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a6000a27: fails P1, D1, B2, B2new
- eb09d194: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
