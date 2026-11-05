# Current work (the memory between sessions)

The current release only, capped (60 lines, 3,200 characters: `scripts/check-agent-memory.mjs`). Rules:
[CLAUDE.md, "Keeping the memory"](CLAUDE.md#keeping-the-memory). Each job: `mcp/work/<ID>.md`, its `## Summary`
first. Finished entries: [work/archive/](work/archive/README.md).

## Where it stands (0.3.2, 3 Nov)
- 0.3.1 shipped: on main at b79a7ed6 (#104, #114, "## [0.3.1]: 2026-11-03"); each job's note in `mcp/work/<ID>.md`.
- `integration/0.3.2`: builders branch from it, push only their branch; the reviewer merges; the owner merges to main.
- 0.3.2: TK1, DP1, OP1, HR1-HR2 (answers fit uncut), HM1-HM2, R032 (main in, version 0.3.2, its own
  CHANGELOG section), DT1 (one texts order), ED1 (site: em dashes, phone shift), LV1 (label and value isolated), VC1-VC2 (a turned visual calculation said, on the page too), TT1 (twin tables), SP1-16, SP18-26 (the split), CI1 (macOS only where the reviewer merges), PK1 (redesign patch kinds), GM1 (Gulf measures), NC1 (the number check, layer 1), TR1 (tables to the right edge), AN1 (Arabic names in the model), SP28 (pbip-page split), SP27 (health engine split), SP30 (pbip-bind split), SP33 (svg designer split), MD1 (MODULES.md rows, check-modules), SP29 (design-engine split), SP32 (model-health page split), SP34 (exam page split), SP37 (visual meaning split), SP31 (theme-generator split), SP38 (redesign split), SP40 (twin measures), SP35 (main.js split), SP41 (check-report split), SP36 (lang-manager split), SP42 (the two readers), SP39 (report-mirror split), SP44 (approval window split), SP43 (the split is done, SP1-SP44), CL1 (the contract ledger, `docs/CONTRACTS.md`), DD1C-DD1C2 (one frame rule: mirror-units.js frameWidth, 4 readers), ST1 (`?v=` stamps made by `npm run build:min`, never typed), DD1G-DD1H, DD2D, DD2P (one place each: model-nearest, sort-column, model-file, png-bytes), CI2 (macOS on Intel), DD1B, DD1A (one place each: pbir-values.js, time-names.js). Next DD1F.

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
