# B2new-8 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111368 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v14",
      "p0/v16",
      "English [{\"x\":58,\"y\":747,\"width\":597,\"height\":241,\"z\":14000},{\"x\":682,\"y\":542,\"width\":125,\"height\":396,\"z\":16000}]",
      "Arabic [{\"x\":1265,\"y\":747,\"width\":597,\"height\":241,\"z\":14000},{\"x\":1315,\"y\":542,\"width\":125,\"height\":396,\"z\":16000}]",
      "plan on v14: none",
      "plan on v16: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
