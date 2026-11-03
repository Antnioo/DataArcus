# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.1, 27 Oct)
- `integration/0.3.1` (from main d501c78): builders branch from it and push only their branch; the reviewer merges;
  one PR integration -> main at the end, the owner merges (the owner: max 4 builders for three rounds, then 2-3).
- Merged 21-28 Oct: waves 1-6, the release audit, the Seen batches SQ1-SQ13, LR1 to CX1, and laptop part 3's SPD, P3A, FX1-FX6 (FX3b-FX5b) (each note in `mcp/work/<ID>.md`).
- 29 Oct-1 Nov (laptop parts 4-8): TB2, TB1, TB1b, TB1c, MP1, MP1b, MP1c, MR1, MP1d, MX1, MP1e, MX2, MP1f, MX3, MX4, MX5, MX6, MX7, MX8 (each in `work/<ID>.md`).
- 0.3.2 (this branch): TK1, DP1, OP1, HR1 (plan headroom), SP1-9, SP12-16, SP18-20 (the split). Running: none.

## Next step
1. 0.3.1: the laptop's yes, then the owner's merge to main. 2. 0.3.2 after it.

## Open decisions (the owner's; no work before his go)
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
