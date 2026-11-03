# M1

mcp/lib/twin-pages.mjs:706: rule move disclosure collection.

Reproduced on 1a5f65847c837bae50608ef9dfed1f2b170f8e7c.

Failure metadata:

```json
[
  {
    "why": "double position reflection differs without disclosed exception",
    "files": [
      "p0/v0Names",
      "English {\"x\":20,\"y\":20,\"width\":30,\"height\":30,\"z\":2000}",
      "Arabic {\"x\":1017,\"y\":230,\"width\":43,\"height\":210.88,\"z\":1}"
    ]
  }
]
```

Reduced by page/visual deletion followed by an optional-property fixed point, not a proof of a globally smallest report. Mandatory identity and geometry keys remain. Every originating failure is reduced separately; identical final fixtures share this folder.

Replay: `node fuzz.mjs /path/to/DataArcus --replay cases/M1-1/spec.json --out /absolute/path/inside/lab/replay` (use an absolute output path inside this lab).

Final replay: target failure reproduced on integration 1a5f65847c837bae50608ef9dfed1f2b170f8e7c and MX8 e5122932f78cfc5a757868a9b1ceb4aca949ff8a. MX8 fixes none of this case’s recorded failures.
