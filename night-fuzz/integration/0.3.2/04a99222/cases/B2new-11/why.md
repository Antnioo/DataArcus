# B2new-11 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112579 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v2",
      "p0/v17",
      "English [{\"x\":749,\"y\":590,\"width\":106,\"height\":210,\"z\":2000},{\"x\":481,\"y\":563,\"width\":229,\"height\":62,\"z\":17000}]",
      "Arabic [{\"x\":547,\"y\":590,\"width\":106,\"height\":210,\"z\":2000},{\"x\":570,\"y\":563,\"width\":229,\"height\":62,\"z\":17000}]",
      "plan on v2: movedByRule: moved with a button beside it",
      "plan on v17: movedByRule: gave width to a button beside it",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
