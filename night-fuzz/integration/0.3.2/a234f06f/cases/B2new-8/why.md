# B2new-8 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110784 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v1",
      "p0/v6",
      "English [{\"x\":538,\"y\":564,\"width\":520,\"height\":156,\"z\":1000},{\"x\":1125,\"y\":278,\"width\":155,\"height\":294,\"z\":6000}]",
      "Arabic [{\"x\":222,\"y\":564,\"width\":520,\"height\":156,\"z\":1000},{\"x\":0,\"y\":278,\"width\":459,\"height\":294,\"z\":6000}]",
      "plan on v1: movedByRule: gave width to a button beside it",
      "plan on v6: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
