# B2new-4 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113644 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v21",
      "p0/v22",
      "English [{\"x\":27,\"y\":378,\"width\":136,\"height\":186,\"z\":21000},{\"x\":302,\"y\":175,\"width\":138,\"height\":307,\"z\":22000}]",
      "Arabic [{\"x\":1117,\"y\":378,\"width\":136,\"height\":186,\"z\":21000},{\"x\":1005,\"y\":175,\"width\":138,\"height\":307,\"z\":22000}]",
      "plan on v21: none",
      "plan on v22: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
