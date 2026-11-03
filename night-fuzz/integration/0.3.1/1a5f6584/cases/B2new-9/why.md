# B2new-9 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111378 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v2",
      "p0/v7",
      "English [{\"x\":387,\"y\":279,\"width\":227,\"height\":456,\"z\":2000},{\"x\":31,\"y\":125,\"width\":318,\"height\":369,\"z\":7000}]",
      "Arabic [{\"x\":1083,\"y\":279,\"width\":587,\"height\":456,\"z\":2000},{\"x\":1571,\"y\":125,\"width\":318,\"height\":369,\"z\":7000}]",
      "plan on v2: fitted.buttons",
      "plan on v7: movedByRule: gave width to a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
