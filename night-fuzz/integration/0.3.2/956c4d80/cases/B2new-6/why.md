# B2new-6 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113781 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v14",
      "p0/v18",
      "English [{\"x\":800,\"y\":360,\"width\":134,\"height\":285,\"z\":14000},{\"x\":551,\"y\":97,\"width\":121,\"height\":291,\"z\":18000}]",
      "Arabic [{\"x\":599,\"y\":360,\"width\":134,\"height\":285,\"z\":14000},{\"x\":608,\"y\":97,\"width\":121,\"height\":291,\"z\":18000}]",
      "plan on v14: movedByRule: moved with a button beside it",
      "plan on v18: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
