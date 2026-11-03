# F1

assets/js/report-mirror.js:646-650: fit eligibility omits rowPadding; :694-696: added height includes rowPadding for only one extra row.

Reproduced on 1a5f65847c837bae50608ef9dfed1f2b170f8e7c.

Failure metadata:

```json
[
  {
    "why": "estimated rows exceed added or resized box",
    "files": [
      "p0/v0",
      "{\"need\":269,\"height\":190,\"row\":32.875}"
    ]
  },
  {
    "why": "estimated rows exceed added or resized box",
    "files": [
      "p0/v0Names",
      "{\"need\":269,\"height\":222.88,\"row\":32.875}"
    ]
  }
]
```

Reduced by page/visual deletion followed by an optional-property fixed point, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/F1-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).

Final replay: target failure reproduced on integration 1a5f65847c837bae50608ef9dfed1f2b170f8e7c and MX8 e5122932f78cfc5a757868a9b1ceb4aca949ff8a. MX8 fixes none of this case’s recorded failures.
