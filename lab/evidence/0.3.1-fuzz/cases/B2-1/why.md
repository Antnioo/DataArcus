# B2

Disclosed matrix-margin overlap removal; strict B2 is too broad for this intended rule (mcp/lib/twin-pages.mjs:390).

Reproduced on a7d04ad5f15ddc19a38f994cba9d6b4c68073137.

Failure metadata:

```json
[
  {
    "why": "existing overlap lost",
    "files": [
      "p0/v12",
      "p0/v13"
    ]
  }
]
```

Deletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/B2-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).
