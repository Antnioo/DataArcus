# B2new-12 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111411 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v13",
      "p0/v19",
      "English [{\"x\":553,\"y\":464,\"width\":64,\"height\":177,\"z\":13000},{\"x\":318,\"y\":310,\"width\":229,\"height\":213,\"z\":19000}]",
      "Arabic [{\"x\":1584,\"y\":464,\"width\":64,\"height\":177,\"z\":13000},{\"x\":1373,\"y\":310,\"width\":229,\"height\":213,\"z\":19000}]",
      "plan on v13: movedByRule: moved with a button beside it",
      "plan on v19: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
