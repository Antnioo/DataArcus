# M1

Button fitting shifts neighbors, while the answer names the button and only counts its shifted neighbors (mcp/lib/twin-pages.mjs:60, :79, :103, :122).

Reproduced on a7d04ad5f15ddc19a38f994cba9d6b4c68073137.

Failure metadata:

```json
[
  {
    "why": "double position reflection differs without disclosed exception",
    "files": [
      "p0/v15",
      "English {\"x\":563,\"y\":189,\"width\":433,\"height\":58,\"z\":15000}",
      "Arabic {\"x\":312,\"y\":189,\"width\":433,\"height\":58,\"z\":15000}"
    ]
  }
]
```

Deletion-minimal under the lab reducer, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/M1-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).
