# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). This file holds only the
current release: where it stands, the next step, what is open and the decisions in force. How DataArcus is put
together: `ARCHITECTURE.md` (repo root). Every finished round and wave, unchanged: `mcp/work/archive/` (its
`README.md` lists every section by file). Each job's plan, results and "Seen, not in scope": `mcp/work/<ID>.md`.

## Where things stand (0.3.1, 25 Oct)
- Branch model (the owner, 25 Oct: "proceed with 0.3.1 ... 3 builders at a time"): `integration/0.3.1` from main
  d501c78. Each builder branches from it, pushes only its own branch, never merges; the reviewer reviews and merges into
  the integration branch; one PR integration -> main at the end, the owner merges.
- Merged into `integration/0.3.1`: wave 1 S1, R1, P1; wave 2 V1, M1, L1, X2; wave 3 I, E, W, C; wave 4 K1, L6;
  wave 5 E2, D5; wave 6 S9 (263ab27: server.mjs by tool into `mcp/tools/`, the twin by step into `lib/twin-*.mjs`,
  byte for byte the same) and G1 (this merge: the registry, this file's archive, `ARCHITECTURE.md`, the README split).
  Each entry, unchanged: `mcp/work/archive/WORK-2026-10-25.md` and `mcp/work/<ID>.md`.
- Wave 6, still running (25 Oct): T1 done, branch `test/0.3.1-mutation`, not merged: `mcp/test-0.3.1-mutation.mjs` in
  `suites` (core), 58 mutants all killed in 2.5 min, 2 equivalent listed; 21 missing checks added in their owning suites;
  no product code changed; full npm test 73 PASS; one product weakness for the owner (`mcp/work/T1.md` "Seen" 1: inode
  reuse can fool the rollback's identity check). Next GC (the Gulf calendar facts from Codex's audit:
  6 false public sentences, a Fri/Sat/Sun weekend for Sharjah) and Q1 (lint and a coverage report in CI).

## Next step
1. The reviewer reviews and merges T1, GC and Q1.
2. One batched laptop run of every "For the laptop" list: R1, M1, V1, L1, X2, C, L6 (`mcp/work/<ID>.md`); the owner
   picks the matrix variant (M1) or none.
3. The release: `mcp/work/D5.md` "For the reviewer" 1-4 (the CHANGELOG heading, the page's flag and download, the
   README download lines, the engine's release notes); then the PR integration -> main, the owner merges; then K1's
   public repo (`mcp/work/K1.md` "For the owner"; draft #85 is closed).

## Open items (the owner decides; no work before his go)
- M1 "Seen, not in scope" 1 (text-box panels: create_report vs the twin) and 2 (the twin's tables lose "Total");
  the matrix variant, then `MATRIX_RTL_DEFAULT` for every path (`mcp/work/M1.md`).
- L6 "Seen" 1: Arabic DA measures for the twin and the bilingual report's Arabic half (`mcp/work/L6.md`).
- C: the beta task list's line (`mcp/work/C.md` "For the reviewer").
- Every job's "Seen, not in scope" list stays open until the owner decides each line: S1, R1, P1, V1, M1, L1, X2, I,
  E, E2, W, C, K1, L6, D5, G1 (`mcp/work/<ID>.md`).
- Older open items (1-3 Oct, many since done or overtaken): `mcp/work/archive/WORK-2026-10-01-04.md`, "Open items".

## Decisions in force
- Plan and expected numbers first, in the job's own `mcp/work/<ID>.md`, committed and pushed before the work; tests
  first by risk; one writer on a branch; the reviewer merges, never the builder (root `CLAUDE.md`, "Working efficiently").
- `mcp/CHANGELOG.md` [Unreleased] in plain words; job and finding codes only in `mcp/work/*.md` (CI:
  `scripts/changelog-words.mjs`).
- Desktop items wait for one batched laptop run.
- The .mcpb keeps `win32` until one real Mac run (P1).
- The matrix's right-to-left default stays as it is until the owner picks a variant (M1).
- The DAX function library is off by default; its compatibility step (1702) comes first and is said in the person's
  language (L6). The sample project is an option of `plan_layout` / `create_report`, not a 12th tool (C).
- The server's instructions are at their cap (2,196 of 2,200 at S1): new behaviour is said in tool descriptions.
- The owner's Arabic terms (25 Oct): «الفلاتر، مقسم، تلميح، المرئيات، لوحة معلومات» (E2).
- Every suite is listed once in `mcp/tests.json`; `npm test` runs it through `mcp/run-tests.mjs` (G1).
