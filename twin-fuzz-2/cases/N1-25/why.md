# N1

assets/js/report-mirror.js:594: derived Names identifier; mcp/lib/twin-plan.mjs:202: plan lists source heatmap identifiers.

Reproduced on 1a5f65847c837bae50608ef9dfed1f2b170f8e7c.

Failure metadata:

```json
[
  {
    "why": "added name collides with original visual",
    "files": [
      "p0/v0Names"
    ]
  }
]
```

Reduced by page/visual deletion followed by an optional-property fixed point, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/N1-25/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).

Final replay: target failure reproduced on integration 1a5f65847c837bae50608ef9dfed1f2b170f8e7c and MX8 e5122932f78cfc5a757868a9b1ceb4aca949ff8a. MX8 fixes none of this case’s recorded failures.
