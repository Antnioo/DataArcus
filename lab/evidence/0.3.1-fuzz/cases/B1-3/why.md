# B1

The bar-over-table rule retains an offset that can extend beyond the page edge (mcp/lib/twin-pages.mjs:379).

Reproduced on a7d04ad5f15ddc19a38f994cba9d6b4c68073137.

Failure metadata:

```json
[
  {
    "why": "visual outside page",
    "files": [
      "p0/v5"
    ]
  }
]
```

Deletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/B1-3/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).
