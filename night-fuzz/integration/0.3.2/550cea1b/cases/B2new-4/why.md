# B2new-4 (B2new): new overlap introduced

Branch integration/0.3.2, head 550cea1bac7aed446ba17b56dec4f7c5bc13a0e3. Previous head 771e279a54dcf6900cf4d49f430f246b4134c00b.

**OLD (fails on previous head too).**

Found by: generated, seeds 2026111828 (lab copy in the night lab; the reduced spec is deletion-minimal under the lab's reducer).

## Cause (file:line at the head)

- `mcp/lib/twin-pages.mjs:36`: a button widened to its Arabic text, its row moving with it

## Failure metadata (head)

```json
[
  {
    "why": "new overlap introduced",
    "files": [
      "p0/v5",
      "p0/v20",
      "English [{\"x\":1309,\"y\":862,\"width\":591,\"height\":218,\"z\":5000},{\"x\":336,\"y\":53,\"width\":114,\"height\":240,\"z\":20000}]",
      "Arabic [{\"x\":20,\"y\":862,\"width\":591,\"height\":218,\"z\":5000},{\"x\":150,\"y\":53,\"width\":322,\"height\":240,\"z\":20000}]",
      "plan on v5: none",
      "plan on v20: fitted.buttons",
      "in pictureChecks.newOverlaps: false"
    ]
  }
]
```

## Replays

- 550cea1b: fails P1, D1, B2, B2new
- 771e279a: fails P1, D1, B2, B2new

Replay: `node fuzz.mjs /path/to/DataArcus --replay spec.json --out <absolute path inside the lab folder>` with the night lab's copy of fuzz.mjs (it adds D1n, B2new and X1; see REPORT.md).
