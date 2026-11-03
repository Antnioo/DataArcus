# B2new-2 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113636 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v7",
      "p0/v10",
      "English [{\"x\":63,\"y\":335,\"width\":567,\"height\":224,\"z\":7000},{\"x\":297,\"y\":21,\"width\":72,\"height\":123,\"z\":10000}]",
      "Arabic [{\"x\":650,\"y\":335,\"width\":567,\"height\":224,\"z\":7000},{\"x\":0,\"y\":21,\"width\":288,\"height\":123,\"z\":10000}]",
      "plan on v7: none",
      "plan on v10: fitted.buttons",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
