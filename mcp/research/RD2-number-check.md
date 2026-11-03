# RD2: the number check, layer 1 ("same question")

## Summary
- **Approval:** the owner, D-1103-12 (3 Nov): "Go for 10 r&ds during the night ... choose the best r&ds ideas that
  will best fit our code and make us shine"; this is the scout's brief RD2 (`mcp/research/SCOUT-0.3.2.md` on
  `rd/0.3.2-scout`). The public line stays "a number check ... is planned, not built" (`mcp/ROADMAP.md`).
- **The question:** can check_report, given `before` and `after` (the original and its twin, native copy or
  redesign), prove visual by visual that each asks the model the same question (fields, aggregations, filters, sort,
  Top N, display units), from the files only, never a value, and name which visual differs and how?
- **Scope:** research only: this note and scratch scripts under `mcp/research/rd2/`. No product file changes.
- **Base:** `rd/0.3.2-number-check` from `origin/integration/0.3.2`. Push only it; no merge, no PR.
- **Expected checks:** no product suite touched; the prototype prints one `PASS  rd2-layer1  <N> checks` line.
- **Expected numbers (written before the run):** on `twin-project` (2 pages with visuals + a tooltip page): every
  visual matched by name in all three pairs; twin and native copy: every query "same question" except what the
  mirror changes on purpose (projection order of a mirrored chart's axis, never a field); redesign: all "same
  question" (positions, titles and theme only). The 6 planted changes: each found once, on the right visual, with the
  right kind; no filter literal in any answer. Time under 1 s, answer under 10,000 characters.
- **Got:** (filled at the end)
- **Resume:** (filled at the end)

## The plan
1. Read today's code: inventory, diskSource, verifyCopy's opaque hashes, the twin's read and what the mirror changes.
2. Read Microsoft's docs: semanticQuery, visual calculations, PBIR filters (values in a filter).
3. Prototype `rd2/layer1.mjs`: a canonical "question" per visual (roles and fields, aggregations, sort, Top N,
   filters by hash with their count of literals, visual calculations, display units and decimals), matched by name.
4. Measure on copies in `os.tmpdir()`: twin, native copy, redesign made through the tools' handlers; then the 6 planted
   changes; the time and answer size.
5. Write a) to g): today's code, the docs, 2-3 ways, numbers, recommendation, Desktop checks, a builder brief.
