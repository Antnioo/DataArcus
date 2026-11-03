# B2new-5 (B2new): new overlap introduced, not said in the plan, one of the two is a group box

Branch integration/0.3.1, head 1a5f65847c837bae50608ef9dfed1f2b170f8e7c. Previous head a6000a279374788cf6f0a76246b08d41eff23f86.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111301 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:159`: a text box widened or heightened to its Arabic lines

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced, not said in the plan, one of the two is a group box",
    "files": [
      "p0/v6",
      "p0/v12",
      "English [{\"x\":1125,\"y\":839,\"width\":795,\"height\":34,\"z\":6000},{\"x\":7,\"y\":601,\"width\":458,\"height\":428,\"z\":12000}]",
      "Arabic [{\"x\":0,\"y\":839,\"width\":1920,\"height\":36,\"z\":6000},{\"x\":1455,\"y\":601,\"width\":458,\"height\":428,\"z\":12000}]",
      "plan on v6: fitted.textboxes",
      "plan on v12: none",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 1a5f6584: fails P1, D1, B2, B2new
- a6000a27: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
