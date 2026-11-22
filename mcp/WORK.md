# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.4)
- 0.3.3 is on main (#129, cbab5f96; the download lines #133, cc03504b; the list in `CHANGELOG.md`).
- `integration/0.3.4`: builders branch from it, push only their branch; the reviewer merges; the owner merges to main.
- 0.3.3's list: [the archive](work/archive/WORK-0.3.3.md).
- SW2 (`fix/0.3.4-sw2`): the job sweep's six items, to merge: [work/SW2.md](work/SW2.md).
- AF3 (`fix/0.3.4-af3`): AUD-081, AUD-083, AUD-084, to merge: [work/AF3.md](work/AF3.md).
- LG3 (`fix/0.3.4-lg3`): the favicon mark with a space between bars and arc, to merge: [work/LG3.md](work/LG3.md).

## Next step
1. The reviewer plans 0.3.4's first jobs (the night audit's AUD-078 and AUD-080 are routed to it).

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
- Each suite once in `mcp/tests.json` (G1). Startup files capped, cut text moved to `mcp/docs/` (A1).
- BA2 (D-1116-06): `scripts/bot-pr-files.mjs <prices|outlines>`: a list per bot, the price bot's generated pages only if they equal a fresh regeneration (`mcp/work/BA2.md`).
