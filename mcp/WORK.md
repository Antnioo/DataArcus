# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.3)
- 0.3.2 is on main (#117, f3c1b7e1; the list in `CHANGELOG.md`).
- `integration/0.3.3`: builders branch from it, push only their branch; the reviewer merges; the owner merges to main.
- Merged first: BA1 to FB4, as written in [the archive](work/archive/WORK-2026-11-12.md).
- DB2 (no plan id without a name). LG2 (B-419, `work/LG2.md`). MH1.
- AT1 (B-429, B-449): Arabic title «من أصل», header bracket, 3 Arabic model-path errors (`work/AT1.md`).
- TR1 (B-439; `TR1`), TR2 (`TR2`) merged.
- LR3 (P-01, P-08: a Stop hook; `LR3`). HX1 (`HX1`). HX2 (Impact check; `HX2`). TL1 (`TL1`). OX1 (`OX1`). IX1 (`IX1`). IX2 (`IX2`). SN1 (`SN1`). OX2. IX4. LX1 (`LX1`). AU2. SN3 (`SN3`). AU1 (`AU1`). SN4 (`SN4`). WF3 (`WF3`). RX1 (`RX1`). AR7 (`AR7`). TB3 (`TB3`). CI3 (`CI3`). SW1 (`SW1`: first merged line archived).

- LF1 (AUD-074, AUD-075; `work/LF1.md`): DONE on fix/0.3.3-lf1 once its CI line is in the note, for the reviewer.
- RL33: checklist `work/RL33-RELEASE.md`.
## Next step
1. PR #121 (RL032L, download lines) is on main. 2. The reviewer merges the DONE jobs above, one check each.

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
