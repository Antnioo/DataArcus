# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.1, 27 Oct)
- `integration/0.3.1` (from main d501c78): builders branch from it and push only their branch; the reviewer merges;
  one PR integration -> main at the end, the owner merges (the owner: max 4 builders for three rounds, then 2-3).
- Merged: waves 1-6 (A2, K2, GC2, RB, Q1); the release audit AF1, AF2, DS1, AU47; the Seen batches SQ1-SQ11, SQ13
  (each note in `mcp/work/<ID>.md`).
- Merged 26 Oct: LR1, LR2, BD1, NC1, CS1, GL1, NC2, RD1.
- 27 Oct merged: R4A, GL2, BD2, CS2, NC3, TT1, GC3, GD1 (glass the default), GD2 (the twin identical in glass; glass
  previews), [ST1](work/ST1.md) (every Seen item swept: its register is what is left),
  [SF1](work/SF1.md) (the hard rules proven; the way back to 0.3.0), [TT2](work/TT2.md) (Arabic names approved on the
  website's download), [TS1](work/TS1.md) (FHD text x 1.25; S10's gap), [PF1](work/PF1.md) (glass pictures fast),
  [TW1](work/TW1.md) (the twin identical: panels, Total, axes, phone titles; glass previews), [LC1](work/LC1.md)
  (the layout preview after the fit), [CX2](work/CX2.md) (Codex's wording findings), [CX1](work/CX1.md) (Codex's safety findings).
- 28 Oct (laptop part 3): [SPD](work/SPD.md) (CI 32 -> 12 min), [P3A](work/P3A.md), [FX1](work/FX1.md), [FX2](work/FX2.md), [FX3](work/FX3.md), [FX4](work/FX4.md), [FX5](work/FX5.md), [FX6](work/FX6.md), [FX5b](work/FX5b.md), [FX3b](work/FX3b.md), [FX4b](work/FX4b.md).
- 29 Oct (laptop part 4): [TB2](work/TB2.md), [TB1](work/TB1.md), [TB1b](work/TB1b.md), [TB1c](work/TB1c.md), [MP1](work/MP1.md), [MP1b](work/MP1b.md).
- Running: none (rc.6, then laptop part 7).

## Next step
1. rc.6 (two identical builds); laptop part 7: picture pages on the owner's 6 dashboards.
2. The PR integration -> main: the owner merges.

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
