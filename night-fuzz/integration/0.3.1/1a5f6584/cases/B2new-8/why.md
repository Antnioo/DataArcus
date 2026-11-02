# B2new-8 (B2new): new overlap introduced

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111392 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v7",
      "p0/v8",
      "English [{\"x\":938,\"y\":369,\"width\":79,\"height\":203,\"z\":7000},{\"x\":441,\"y\":309,\"width\":358,\"height\":65,\"z\":8000}]",
      "Arabic [{\"x\":410,\"y\":369,\"width\":79,\"height\":203,\"z\":7000},{\"x\":481,\"y\":309,\"width\":358,\"height\":65,\"z\":8000}]",
      "plan on v7: movedByRule: moved with a button beside it",
      "plan on v8: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
