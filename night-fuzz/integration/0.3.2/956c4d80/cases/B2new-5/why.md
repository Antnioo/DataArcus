# B2new-5 (B2new): new overlap introduced, said in pictureChecks.newOverlaps

Branch integration/0.3.2, head 956c4d8098822fde42e73f62212676f59f859d17. Previous head 7797bf63eb031ccbb8dee238502f56b20a8e6b4a.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026113675 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, said in pictureChecks.newOverlaps",
    "files": [
      "p0/v0",
      "p0/v5",
      "English [{\"x\":843,\"y\":440,\"width\":166,\"height\":280,\"z\":0},{\"x\":1098,\"y\":631,\"width\":182,\"height\":89,\"z\":5000}]",
      "Arabic [{\"x\":61,\"y\":440,\"width\":166,\"height\":280,\"z\":0},{\"x\":0,\"y\":631,\"width\":182,\"height\":89,\"z\":5000}]",
      "plan on v0: movedByRule: moved with a button beside it",
      "plan on v5: none",
      "in pictureChecks.newOverlaps: true"
    ]
  }
]
```

## Replays

- 956c4d80: fails P1, D1, B2, B2new
- 7797bf63: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
