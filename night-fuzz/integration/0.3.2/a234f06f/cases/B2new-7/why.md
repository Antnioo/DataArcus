# B2new-7 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110783 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v2",
      "p0/v5",
      "English [{\"x\":195,\"y\":157,\"width\":579,\"height\":258,\"z\":2000},{\"x\":819,\"y\":394,\"width\":74,\"height\":299,\"z\":5000}]",
      "Arabic [{\"x\":506,\"y\":157,\"width\":579,\"height\":258,\"z\":2000},{\"x\":387,\"y\":394,\"width\":381,\"height\":299,\"z\":5000}]",
      "plan on v2: movedByRule: gave width to a button beside it",
      "plan on v5: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  },
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v5",
      "p0/v7",
      "English [{\"x\":819,\"y\":394,\"width\":74,\"height\":299,\"z\":5000},{\"x\":27,\"y\":627,\"width\":515,\"height\":173,\"z\":7000}]",
      "Arabic [{\"x\":387,\"y\":394,\"width\":381,\"height\":299,\"z\":5000},{\"x\":765,\"y\":627,\"width\":515,\"height\":173,\"z\":7000}]",
      "plan on v5: fitted.buttons",
      "plan on v7: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
