# B2new-11 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head a215ada512b7f51c68d9f7a195a41e22cb2b48d5. Previous head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112302 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:37`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v12",
      "p0/v20",
      "English [{\"x\":26,\"y\":470,\"width\":396,\"height\":488,\"z\":12000},{\"x\":509,\"y\":749,\"width\":581,\"height\":268,\"z\":20000}]",
      "Arabic [{\"x\":1337,\"y\":470,\"width\":583,\"height\":488,\"z\":12000},{\"x\":830,\"y\":749,\"width\":581,\"height\":268,\"z\":20000}]",
      "plan on v12: fitted.buttons",
      "plan on v20: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- a215ada5: fails P1, D1, B2, B2new
- 550cea1b: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
