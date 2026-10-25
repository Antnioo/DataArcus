# A1 (0.3.1, wave 6): the agent's startup pack, capped; task routes; section-addressable docs

## Summary
- **Approval:** the owner, 25 Oct, on an outside review (Codex, of integration/0.3.1): "make it all in 0.3.1". Brief:
  the reviewer's "Go on A1"; adopt the review's proposals, adjust only with a reason under "Decisions I made".
- **Scope:** docs and one CI check only, no product code: caps on the startup pack (`CLAUDE.md`, `mcp/CLAUDE.md`,
  `ARCHITECTURE.md`, `mcp/WORK.md`, a job note's summary) checked by `scripts/check-agent-memory.mjs`; what is cut moves
  unchanged into `mcp/docs/`; five task routes in `ARCHITECTURE.md`; per-tool headings in `mcp/TOOLS.md`; summaries on
  the five newest 0.3.1 job notes.
- **Base:** branch `docs/0.3.1-agent-memory` from `origin/integration/0.3.1` (ddae546). Push only this branch; no PR, no
  merge.
- **Expected checks:** `node scripts/check-agent-memory.mjs` FAIL on ddae546 (the numbers below), PASS after;
  `check-result-lines`, `test-site-config`, `test-0.3.0-claims` (202), `test-release-text` (38) and the full
  `npm test -- --keep-going` the same counts as before (73 PASS).
- **Resume:** read "Plan"; the commits under "Results" say how far it got.

(The ID A1 was used in 0.3.0 for the integration audit: its file `mcp/work/A1.md` is kept as it is; this job's memory is
this file, as R1-see-the-result.md and R7-claims.md sit next to theirs.)

## Plan
1. This file and the before sizes; commit, push.
2. `scripts/check-agent-memory.mjs`, red first on today's files (one result line `PASS|FAIL  agent-memory  <N> checks`):
   - caps (lines / characters): `CLAUDE.md` 60 / 3,200; `mcp/CLAUDE.md` 60 / 3,200; `ARCHITECTURE.md` 90 / 5,200;
     `mcp/WORK.md` 60 / 3,200; total of the four at most 14,800;
   - every job note `mcp/work/<ID>.md` not on the list of notes written before A1 starts with `## Summary` (its first
     `##` heading), at most 40 lines and 4,400 characters, naming Approval, Scope, Base, Expected checks and Resume;
     a listed note that has a summary is held to the same; `mcp/work/archive/` is never read;
   - every relative link in the startup files, in `mcp/docs/*.md` and in the summaries resolves (file, and `#section`
     when it names one);
   - the task routes: every path named in `ARCHITECTURE.md`'s routes table exists, and every symbol named after it
     (`file: symbolA, symbolB`) is in that file.
   Run in CI's website-checks job (one step, away from Q1's lint step).
3. The moves, unchanged, into `mcp/docs/` by subject: `OWNER-RULES.md` (the root's working rules and mcp/CLAUDE.md's
   rules, "Keeping the memory", "Writing prompts"), `HOW-BUILT.md`, `TESTS.md`, `LAPTOP.md` (the live loop),
   `RULES-POWERBI.md` (the Power BI facts; DESKTOP-TESTS.md stays where the measurements are), `MODULES.md`
   (ARCHITECTURE.md's parts list and reading table). The startup files keep the rules' wording or a short line that links
   to the full text.
4. The routes in `ARCHITECTURE.md`: (a) a check_report rule, (b) one visual type's Arabic mirror, (c) a create_report
   option (with the 5-line pin checklist), (d) EN and AR page text, (e) a Windows-only CI failure.
5. `mcp/TOOLS.md`: a `##` heading per tool (each tool's row kept as a one-row table under it, text unchanged).
6. Summaries on top of T1, S9, G1, D5, E2 (the five newest 0.3.1 notes), nothing below them changed.
7. The doc-reading checks, then the full run once.

## Before (ddae546; lines / characters, characters counted as code points)
| File | Lines | Characters |
|---|---|---|
| `CLAUDE.md` | 77 | 6,061 |
| `mcp/CLAUDE.md` | 207 | 20,751 |
| `ARCHITECTURE.md` | 89 | 7,982 |
| `mcp/WORK.md` | 51 | 4,202 |
| **total** | 424 | **38,996** |

`mcp/TOOLS.md`: 25 lines, 20,737 characters, no per-tool heading.
