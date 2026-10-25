# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries, unchanged: [work/archive/](work/archive/README.md) (this file before A1's cap: its first
section of `WORK-2026-10-25.md`).

## Integration head (0.3.1, 25 Oct)
- `integration/0.3.1` (from main d501c78). Builders branch from it and push only their branch; the reviewer merges;
  one PR integration -> main at the end, the owner merges (the owner: max 4 builders for three rounds, then 2-3).
- Merged: waves 1-5 (S1, R1, P1, V1, M1, L1, X2, I, E, W, C, K1, L6, E2, D5); wave 6 S9, G1, T1 (+ its Windows fix),
  GC, A1 (this merge).

## Active jobs (wave 6)
- Q1 `chore/0.3.1-lint-coverage`: lint, a coverage report in CI, 6 missing checks.
- RB `fix/0.3.1-rollback-identity`: the rollback's content hash; check_report says only what ran.
- Next: K2 (the twin writes exactly the approved files), A2 (short failure lines, `--affected`).

## Next step
1. The reviewer reviews and merges A1, GC, Q1, RB.
2. One batched laptop run of every "For the laptop" list: R1, M1, V1, L1, X2, C, L6; the owner picks M1's matrix
   variant or none.
3. The release: `mcp/work/D5.md` "For the reviewer" 1-4; the PR integration -> main (the owner merges); then K1's
   public repo (`mcp/work/K1.md` "For the owner").

## Open decisions (the owner's; no work before his go)
- M1 "Seen" 1-2 (text-box panels; the twin's tables lose "Total"); the matrix variant, then `MATRIX_RTL_DEFAULT`.
- L6 "Seen" 1: Arabic DA measures for the twin and the bilingual report's Arabic half.
- C: the beta task list's line. T1 "Seen" 1: inode reuse can fool the rollback's identity check.
- Every job's "Seen, not in scope" stays open until he decides each line (`mcp/work/<ID>.md`).

## Decisions in force
- Plan and expected numbers first in the job's note, pushed before the work; tests first by risk; the reviewer merges.
- `mcp/CHANGELOG.md` [Unreleased] in plain words; job codes only in `mcp/work/` (`scripts/changelog-words.mjs`).
- Desktop items wait for one batched laptop run. The .mcpb keeps `win32` until one real Mac run (P1).
- The DAX function library is off by default (L6). The sample project is an option, not a 12th tool (C).
- The server's instructions are at their cap (2,196 of 2,200): new behaviour goes in tool descriptions.
- The owner's Arabic terms: «الفلاتر، مقسم، تلميح، المرئيات، لوحة معلومات» (E2).
- Every suite once in `mcp/tests.json` (G1). Startup files capped, cut text moved to `mcp/docs/` (A1).
