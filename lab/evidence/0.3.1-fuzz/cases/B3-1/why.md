# B3

Strict absolute floor includes unchanged narrow source visuals; the product floor is conditional (mcp/lib/twin-pages.mjs:474).

Reproduced on a7d04ad5f15ddc19a38f994cba9d6b4c68073137.

Failure metadata:

```json
[
  {
    "why": "unchanged source width already below 60 px",
    "files": [
      "p0/v0",
      "English width 45.66332218506131",
      "Arabic width 45.66332218506131"
    ]
  }
]
```

Deletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/B3-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).
