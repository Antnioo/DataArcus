# B2new-10 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113883 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v6",
      "p0/v14",
      "English [{\"x\":702,\"y\":173,\"width\":130,\"height\":285,\"z\":6000},{\"x\":164,\"y\":388,\"width\":354,\"height\":332,\"z\":14000}]",
      "Arabic [{\"x\":344,\"y\":173,\"width\":450,\"height\":285,\"z\":6000},{\"x\":762,\"y\":388,\"width\":354,\"height\":332,\"z\":14000}]",
      "plan on v6: fitted.buttons",
      "plan on v14: movedByRule: gave width to a button beside it",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
