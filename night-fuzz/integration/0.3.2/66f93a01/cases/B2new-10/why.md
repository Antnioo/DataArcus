# B2new-10 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 66f93a0136e8bf76ca9f562a610e01e5dae1988b. Previous head 04a99222dcd49cdb2e9f98db036dfe528e087d81.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112861 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v5",
      "p0/v11",
      "English [{\"x\":450,\"y\":244,\"width\":83,\"height\":335,\"z\":5000},{\"x\":680,\"y\":3,\"width\":455,\"height\":244,\"z\":11000}]",
      "Arabic [{\"x\":412,\"y\":244,\"width\":83,\"height\":335,\"z\":5000},{\"x\":145,\"y\":3,\"width\":455,\"height\":244,\"z\":11000}]",
      "plan on v5: movedByRule: moved with a button beside it",
      "plan on v11: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 66f93a01: fails P1, D1, B2, B2new
- 04a99222: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
