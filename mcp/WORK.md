# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.2, 3 Nov)
- 0.3.1 shipped: on main at b79a7ed6 (#104, #114, "## [0.3.1]: 2026-11-03"); each job's note in `mcp/work/<ID>.md`.
- `integration/0.3.2`: builders branch from it, push only their branch; the reviewer merges; the owner merges to main.
- 0.3.2: TK1, DP1, OP1, HR1-HR2 (answers fit uncut), HM1-HM2, R032 (main in, version 0.3.2, its own
  CHANGELOG section), DT1 (one texts order), ED1 (site: em dashes, phone shift), LV1 (label and value isolated), VC1 (a turned visual calculation said), SP1-16, SP18-23 (the split). Running: TT1.

## Next step
1. The reviewer: R032 into integration/0.3.2. 2. 0.3.2's other jobs; the release day flips the download lines.

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
