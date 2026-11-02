# B2new-5 (B2new): new overlap introduced

Branch integration/0.3.1, head a6000a279374788cf6f0a76246b08d41eff23f86. Previous head eb09d194d04d5eb296a440891a326a5110aef094.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110454 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v13",
      "p0/v17",
      "English [{\"x\":95,\"y\":98,\"width\":70,\"height\":72,\"z\":13000},{\"x\":1215,\"y\":44,\"width\":65,\"height\":238,\"z\":17000}]",
      "Arabic [{\"x\":71,\"y\":98,\"width\":70,\"height\":72,\"z\":13000},{\"x\":0,\"y\":44,\"width\":132,\"height\":238,\"z\":17000}]",
      "plan on v13: none",
      "plan on v17: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a6000a27: fails P1, D1, B2, B2new
- eb09d194: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
