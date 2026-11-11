# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.3)
- 0.3.2 is on main (#117, f3c1b7e1; each job's note in `mcp/work/<ID>.md`, the list in `CHANGELOG.md`).
- `integration/0.3.3`: builders branch from it, push only their branch; the reviewer merges; the owner merges to main.
- 0.3.3 merged: BA1 (data-only bot PRs merge themselves, D-1109-10), HK1 (suites read saved fixtures), LK1 (linked visuals folder named, one link counts once), WE1 (Arabic write errors), PQ1, HC2 (Arabic Hijri month column), DB1 (3 unreachable branches removed), SG1 (11 same-job groups moved into the library), TC1 (type-checking pilot on lib/model.mjs, one CI step), SG2 (sp10, sp30, sp42 read pure shared files via `mcp/ledger-places.mjs`). FW1 (Windows folder window wording), FT1 (a hand-placed report's font reaches every visual), MM1 (minimatch 11.0.5 by npm override, B-310; `work/MM1.md`), FT2 (B-432, `work/FT2.md`). DQ1 (DAX names quoted in one place; the twin's field key is the pair; B-437, B-438, B-434; `work/DQ1.md`). TC2 (`work/TC2.md`). CL2 (B-435, `work/CL2.md`). HK2 (B-414: sp6, sp29 saved files; `work/HK2.md`). FB1 (`work/FB1.md`: `pageFill`, how well a page is filled, as numbers; nothing a tool writes changes).
- DB2 (a plan without a report name gets no plan id). LG2 (B-419: write tools already say the approved Arabic; pin test only, `work/LG2.md`). MH1 (test client: call timeout, restart; `work/MH1.md`).
- AT1 (B-429, B-449): Arabic title «من أصل», header bracket, 3 Arabic model-path errors (`work/AT1.md`).
- DONE, CI green: TR1 (B-439 flake fixed at its cause, CI artifact retry; tests and CI only, `work/TR1.md`).

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
