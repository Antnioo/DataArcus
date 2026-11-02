# B2new-2 (B2new): new overlap introduced

Branch integration/0.3.1, head a6000a279374788cf6f0a76246b08d41eff23f86. Previous head eb09d194d04d5eb296a440891a326a5110aef094.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110311 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v5",
      "p0/v6",
      "English [{\"x\":667,\"y\":82,\"width\":742,\"height\":350,\"z\":5000},{\"x\":1429,\"y\":332,\"width\":114,\"height\":434,\"z\":6000}]",
      "Arabic [{\"x\":511,\"y\":82,\"width\":742,\"height\":350,\"z\":5000},{\"x\":406,\"y\":332,\"width\":114,\"height\":434,\"z\":6000}]",
      "plan on v5: none",
      "plan on v6: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a6000a27: fails P1, D1, B2, B2new
- eb09d194: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
