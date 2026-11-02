# B2new-6 (B2new): new overlap introduced

Branch integration/0.3.2, head cf86bb21247293f4a259ca3e2ce1f0218ba2fdb7. Previous head a234f06f471118f6d6bf2f8c86aa8f7f555b6341.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111056 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v1",
      "p0/v15",
      "English [{\"x\":30,\"y\":603,\"width\":294,\"height\":185,\"z\":1000},{\"x\":345,\"y\":394,\"width\":211,\"height\":281,\"z\":15000}]",
      "Arabic [{\"x\":956,\"y\":603,\"width\":294,\"height\":185,\"z\":1000},{\"x\":955,\"y\":394,\"width\":211,\"height\":281,\"z\":15000}]",
      "plan on v1: none",
      "plan on v15: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- cf86bb21: fails P1, D1, B2, B2new
- a234f06f: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
