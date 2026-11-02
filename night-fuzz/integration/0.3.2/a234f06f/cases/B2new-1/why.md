# B2new-1 (B2new): new overlap introduced

Branch integration/0.3.2, head a234f06f471118f6d6bf2f8c86aa8f7f555b6341. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026110600 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v4",
      "p0/v8",
      "English [{\"x\":100,\"y\":148,\"width\":213,\"height\":243,\"z\":4000},{\"x\":476,\"y\":368,\"width\":197,\"height\":273,\"z\":8000}]",
      "Arabic [{\"x\":967,\"y\":148,\"width\":213,\"height\":243,\"z\":4000},{\"x\":607,\"y\":368,\"width\":403,\"height\":273,\"z\":8000}]",
      "plan on v4: movedByRule: gave width to a button beside it",
      "plan on v8: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a234f06f: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
