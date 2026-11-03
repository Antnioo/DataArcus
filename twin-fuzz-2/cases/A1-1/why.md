# A1

mcp/lib/twin-pages.mjs:290-320: underGrids eligibility, collision exception, positioning and keepInside.

Reproduced on 1a5f65847c837bae50608ef9dfed1f2b170f8e7c.

Failure metadata:

```json
[
  {
    "why": "grid offset changed; category sort changed; chart order differs from grid; valueAxis changed; padding changed",
    "files": [
      "p0/v0",
      "p0/v1"
    ]
  }
]
```

Reduced by page/visual deletion followed by an optional-property fixed point, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/A1-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).

Final replay: target failure reproduced on integration 1a5f65847c837bae50608ef9dfed1f2b170f8e7c and MX8 e5122932f78cfc5a757868a9b1ceb4aca949ff8a. MX8 fixes none of this case’s recorded failures.
