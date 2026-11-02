# V1

Missing schema on the generated heatmap names table (assets/js/report-mirror.js:577; mcp/lib/twin-write.mjs:50).

Reproduced on a7d04ad5f15ddc19a38f994cba9d6b4c68073137.

Failure metadata:

```json
[
  {
    "why": "PBIR_JSON_FILE_NO_SCHEMA",
    "files": [
      "definition/pages/p0/visuals/v0Names/visual.json"
    ]
  }
]
```

Deletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/V1-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).
