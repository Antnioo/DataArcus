# B2new-2 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111251 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v1",
      "p0/v9",
      "English [{\"x\":685,\"y\":82,\"width\":311,\"height\":220,\"z\":1000},{\"x\":210,\"y\":232,\"width\":345,\"height\":129,\"z\":9000}]",
      "Arabic [{\"x\":652,\"y\":82,\"width\":311,\"height\":220,\"z\":1000},{\"x\":725,\"y\":232,\"width\":345,\"height\":129,\"z\":9000}]",
      "plan on v1: movedByRule: moved with a button beside it",
      "plan on v9: movedByRule: gave width to a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2unsaid, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
