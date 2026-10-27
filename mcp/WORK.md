# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.1, 27 Oct)
- `integration/0.3.1` (from main d501c78): builders branch from it and push only their branch; the reviewer merges;
  one PR integration -> main at the end, the owner merges (the owner: max 4 builders for three rounds, then 2-3).
- Merged: waves 1-6 (to A2, K2, GC2, RB, Q1); the release audit [AF1](work/AF1.md), [AF2](work/AF2.md),
  [DS1](work/DS1.md), [AU47](work/AU47.md); the Seen batches [SQ1](work/SQ1.md), [SQ2](work/SQ2.md),
  [SQ3](work/SQ3.md), [SQ4](work/SQ4.md), [SQ5](work/SQ5.md), [SQ6](work/SQ6.md), [SQ7](work/SQ7.md),
  [SQ8](work/SQ8.md), [SQ9](work/SQ9.md), [SQ10](work/SQ10.md), [SQ11](work/SQ11.md), [SQ13](work/SQ13.md).
  Wave 6 notes: [A2](work/A2.md), [K2](work/K2.md), [GC2](work/GC2.md), [RB](work/RB.md), [Q1](work/Q1.md).
- Merged 26 Oct: [LR1](work/LR1.md), [LR2](work/LR2.md), [BD1](work/BD1.md), [NC1](work/NC1.md), [CS1](work/CS1.md),
  [GL1](work/GL1.md), [NC2](work/NC2.md), [RD1](work/RD1.md).
- 27 Oct merged: [R4A](work/R4A.md), [GL2](work/GL2.md), [BD2](work/BD2.md), [CS2](work/CS2.md), [NC3](work/NC3.md),
  [TT1](work/TT1.md), [GC3](work/GC3.md), [GD1](work/GD1.md) (glass the default), [GD2](work/GD2.md) (the twin
  identical in glass; glass previews).
- Done, merging next: ST1 (the Seen sweep on [SEEN-QUEUE.md](work/SEEN-QUEUE.md)), SF1 (the hard rules proven; the way
  back to 0.3.0). Next builders: TS1 (FHD text x 1.25), then TW1 (the rest of the twin identical), TT2 (Arabic names
  on the website's download), then LC1 (the layout preview after the fit).

## Next step
1. The reviewer merges ST1, SF1, then TS1, TW1, TT2, LC1; then the final full run and two identical dry builds.
2. The laptop part 3: every "For the laptop" list of 0.3.1 (GD2's twin and approval page first).
3. An outside review (Codex); then the PR integration -> main: the owner merges.

## Open decisions (the owner's; no work before his go)
- The matrix variant, then `MATRIX_RTL_DEFAULT` (M1 "Seen" 1-2, panels and "Total": decided, the owner's "twin identical", TW1).
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
