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

## Results (after: `docs/0.3.1-agent-memory`)
Commits: 8c588ee plan and before sizes; e635901 the check, red (below); 93f9219 the moves, the routes, the CI step and
the check's fixture test; ec93adb TOOLS.md by section; 6c3ea08 the five summaries; then this note.

**Red first** (e635901 on ddae546's files): `FAIL  agent-memory  8 of 11 checks`: CLAUDE.md 77 lines / 6,061
characters, mcp/CLAUDE.md 207 / 20,751, ARCHITECTURE.md 7,982 characters, mcp/WORK.md 4,202 characters, the pack
38,996 of 14,800, and no task routes.

| File | Before (lines / characters) | After | Cap |
|---|---|---|---|
| `CLAUDE.md` | 77 / 6,061 | 39 / 3,038 | 60 / 3,200 |
| `mcp/CLAUDE.md` | 207 / 20,751 | 35 / 2,408 | 60 / 3,200 |
| `ARCHITECTURE.md` | 89 / 7,982 | 55 / 5,131 | 90 / 5,200 |
| `mcp/WORK.md` | 51 / 4,202 | 39 / 2,653 | 60 / 3,200 |
| **the four** | 424 / **38,996** | 168 / **13,230** | 14,800 |
| a job's `## Summary` | none | 10-16 lines, 698-1,314 | 40 / 4,400 |

A fresh session's startup reading: 13,230 + its job's summary (at most 4,400) = at most 17,630 characters (was 38,996
plus a whole job note, 20-23 KB for S9 or G1).

**What moved where (unchanged, each line checked present in its new file):**
- `mcp/docs/OWNER-RULES.md` (9,548): the root CLAUDE.md's whole text below its title (before doing anything, Working
  efficiently, Writing prompts and keeping memory, Website changes, One place for every version, Commit attribution)
  and mcp/CLAUDE.md's rules 1-10, "Keeping the memory" and "Writing prompts for another agent or session".
- `mcp/docs/HOW-BUILT.md` (2,669): mcp/CLAUDE.md's opening paragraph and "How it is built".
- `mcp/docs/TESTS.md` (2,820): "Tests". `mcp/docs/LAPTOP.md` (1,484): "The live loop on this laptop".
- `mcp/docs/RULES-POWERBI.md` (11,423): "Power BI facts learned the hard way", rounds 0-4 and the 6-7 Oct night;
  the measurements stay in `scripts/tests/DESKTOP-TESTS.md`, linked.
- `mcp/docs/MODULES.md` (7,045): ARCHITECTURE.md's "The parts", "One write, start to end" (in full) and "Where to
  start reading".
- `mcp/WORK.md` lines 7-51 -> the first section of `mcp/work/archive/WORK-2026-10-25.md` (indexed in the README there).
The startup files keep each rule's wording (the untrusted-metadata rule with "never data values" whole; rules 1-10 by
their bold first sentences; commit attribution whole) or a short line linking to the full text by section.

**The routes and their check:** ARCHITECTURE.md "## Task routes": (a) a check_report rule, (b) one visual type's
Arabic mirror, (c) a create_report option with the 5-line pin checklist, (d) EN and AR page text, (e) a Windows-only
CI failure; each with files and symbols (`file: symbol, ...`) and tests. `scripts/check-agent-memory.mjs` checks 18
paths (code spans) and 14 symbols there, plus caps, summaries and every link: `PASS  agent-memory  85 checks`;
`scripts/test-agent-memory.mjs` (its fixture test, as test-result-lines.mjs is for its check): `PASS  agent-memory-test
10 checks`. CI: one step in website-checks after the result-lines step.

**TOOLS.md:** a `## \`<tool>\`` heading per tool (11) and two for the 0.3.1 options, an index line of links; each row
kept as a one-row table under its heading. The text is the same after whitespace normalization (checked by script);
the 11 rows `test-0.3.0-claims.mjs` reads are the same text before and after.

**The doc-reading checks (ddae546 -> this branch, same counts):** `check-result-lines` 73 -> 73 PASS;
`test-site-config` PASS (76 URLs, 78 pages) -> the same; `test-0.3.0-claims` 202 -> 202; `test-release-text` 38 -> 38;
`test-0.2.9-agent` 23 -> 23; `test-rc23` 51 -> 51; `test-0.3.0-sweep-s1` 30 -> 30; `test-whats-new` 167 PASS.
The one moved check, said: `test-0.3.0-claims.mjs`'s row reader (`mrow`) also ends a row where the next `#` heading
starts; nothing else in a test changed.

**Full run** (`cd mcp && npm test -- --keep-going`, once, on 6c3ea08): running when this was committed; its result follows in the next commit.
