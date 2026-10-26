# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries, unchanged: [work/archive/](work/archive/README.md) (this file before A1's cap: its first
section of `WORK-2026-10-25.md`).

## Where it stands (0.3.1, 26 Oct)
- `integration/0.3.1` (from main d501c78): builders branch from it and push only their branch; the reviewer merges;
  one PR integration -> main at the end, the owner merges (the owner: max 4 builders for three rounds, then 2-3).
- Merged: waves 1-6 (to A2, K2, GC2, RB, Q1); the release audit [AF1](work/AF1.md), [AF2](work/AF2.md),
  [DS1](work/DS1.md), [AU47](work/AU47.md); the Seen batches [SQ1](work/SQ1.md), [SQ2](work/SQ2.md),
  [SQ3](work/SQ3.md), [SQ4](work/SQ4.md), [SQ5](work/SQ5.md), [SQ6](work/SQ6.md), [SQ7](work/SQ7.md),
  [SQ8](work/SQ8.md), [SQ9](work/SQ9.md), [SQ10](work/SQ10.md), [SQ11](work/SQ11.md), [SQ13](work/SQ13.md).
  Wave 6 notes: [A2](work/A2.md), [K2](work/K2.md), [GC2](work/GC2.md), [RB](work/RB.md), [Q1](work/Q1.md).
- Merged into integration/0.3.1 on 26 Oct: [LR1](work/LR1.md), [LR2](work/LR2.md), [BD1](work/BD1.md) (Arabic Latin runs, the bidi lab),
  [NC1](work/NC1.md) (the custom visuals lab), [CS1](work/CS1.md) (one text set). Running: GL1 (the glass look), NC2 (the native copy, honest).

## Next step
1. The reviewer merges SQ12, SQ14, SQ15; every batch and item status: [work/SEEN-QUEUE.md](work/SEEN-QUEUE.md).
2. One batched laptop run: every "For the laptop" list (R1, M1, V1, L1, X2, C, L6) and the queue's laptop list; the
   owner picks M1's matrix variant or none.
3. The release: `mcp/work/D5.md` "For the reviewer" 1-4; the PR integration -> main (the owner merges); then K1's
   public repo (`mcp/work/K1.md` "For the owner").

## Open decisions (the owner's; no work before his go)
- M1 "Seen" 1-2 (text-box panels; the twin's tables lose "Total"); the matrix variant, then `MATRIX_RTL_DEFAULT`.
- L6 "Seen" 1: Arabic DA measures for the twin and the bilingual report's Arabic half.
- C: the beta task list's line.
- Every other item for him: the queue's [decisions](work/SEEN-QUEUE.md#decisions) and laptop list.

## Decisions in force
- Plan and expected numbers first in the job's note, pushed before the work; tests first by risk; the reviewer merges.
- `mcp/CHANGELOG.md` [Unreleased] in plain words; job codes only in `mcp/work/` (`scripts/changelog-words.mjs`).
- Desktop items wait for one batched laptop run. The .mcpb keeps `win32` until one real Mac run (P1).
- The DAX function library is off by default (L6). The sample project is an option, not a 12th tool (C).
- The server's instructions are within a few characters of their cap (`INSTRUCTIONS_MAX`, `mcp/lib/agent-text.mjs`):
  new behaviour goes in tool descriptions.
- The owner's Arabic terms: «الفلاتر، مقسم، تلميح، المرئيات، لوحة معلومات» (E2).
- Every suite once in `mcp/tests.json` (G1). Startup files capped, cut text moved to `mcp/docs/` (A1).
