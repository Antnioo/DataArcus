# B2new-4 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112753 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v4",
      "p0/v10",
      "English [{\"x\":322,\"y\":895,\"width\":450,\"height\":185,\"z\":4000},{\"x\":826,\"y\":749,\"width\":557,\"height\":331,\"z\":10000}]",
      "Arabic [{\"x\":1148,\"y\":895,\"width\":450,\"height\":185,\"z\":4000},{\"x\":764,\"y\":749,\"width\":557,\"height\":331,\"z\":10000}]",
      "plan on v4: none",
      "plan on v10: movedByRule: moved with a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
