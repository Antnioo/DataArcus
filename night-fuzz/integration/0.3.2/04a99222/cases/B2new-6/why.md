# B2new-6 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.2, head 04a99222dcd49cdb2e9f98db036dfe528e087d81. Previous head a215ada512b7f51c68d9f7a195a41e22cb2b48d5.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026112524 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:159`: a text box widened or heightened to its Arabic lines

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v4",
      "p0/v11",
      "English [{\"x\":1050,\"y\":28,\"width\":230,\"height\":143,\"z\":4000},{\"x\":474,\"y\":124,\"width\":175,\"height\":30,\"z\":11000}]",
      "Arabic [{\"x\":0,\"y\":28,\"width\":230,\"height\":143,\"z\":4000},{\"x\":0,\"y\":124,\"width\":1280,\"height\":36,\"z\":11000}]",
      "plan on v4: none",
      "plan on v11: fitted.textboxes",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 04a99222: fails P1, D1, B2, B2new
- a215ada5: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
