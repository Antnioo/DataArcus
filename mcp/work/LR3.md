# LR3 (0.3.3): a Stop hook so a builder's turn does not end before CI is green; DataArcus's own files say how the project runs today

## Summary
- **Approval:** the reviewer's brief "LR3" (11 Nov), LR1's P-01 and P-08; the owner D-1111-03 (yes to LR1's asks 1 and 9).
- **Base:** `feat/0.3.3-lr3` from `origin/integration/0.3.3` at 7960ac78. Pushed only this branch; never merged, no PR.
- **Scope:** `scripts/agent-stop-check.mjs` (new), `scripts/test-agent-stop-check.mjs` (new), `.claude/settings.json` (new:
  the repo had none), `CLAUDE.md` lines 4-5, `mcp/CLAUDE.md` lines 29-30, `mcp/docs/MODULES.md`, `mcp/WORK.md`, this note.
- **Expected checks:** `node scripts/test-agent-stop-check.mjs` red on 7960ac78 (no script), then green; `node scripts/check-modules.mjs --strict`;
  check-result-lines, changelog-words, check-agent-memory PASS; `npm run lint` exit 0; then CI on the branch.
- **Resume:** start at "Plan" below; the state is the last line of this note.

## Plan
1. This note (commit, push). 2. The test, red on the base (the script does not exist). 3. The script, green.
4. `.claude/settings.json`, the two wordings, MODULES.md row, WORK.md line. 5. Checks, merge origin/integration/0.3.3 once, CI, wait.
- The hook: Stop, on `fix/*` or `feat/*` only. Refuses (exit 2, message on stderr) when the note `mcp/work/<CODE>.md` has no
  `CI green: <url> on <sha>` naming the head, no `STOP:` line and no question under "
- CI run 42952240376 was red: `scripts/test-results-adapter.mjs` pinned the old local-loop text of mcp/CLAUDE.md (job website-checks, "AssertionError: mcp/CLAUDE.md"). I changed that one test to the new sentence (outside the listed scope; the wording change requires it); TESTS.md keeps its old check.

## For the owner". Allows after 3
  refusals in a row (count in a file under os.tmpdir(), keyed by branch). Any read failure: allow and print why.
- Test cases: no CI line; CI line on an older sha; CI line on the head; STOP: line; a question for the owner; the 4th call
  after 3 refusals; integration branch; unreadable git; plus a note-only commit after the green run.

## CHANGELOG line
none (nothing a user sees).
- State at 2026-11-11T03:19Z: plan written, pushed.

## Before -> after
- No hook: a builder could end its turn with CI not run or still red. Now the Stop hook refuses (max 3 times in a row) on
  fix/* and feat/* until the note shows the CI line for the head, a STOP: line or an owner question.
- `CLAUDE.md` lines 4-5 and `mcp/CLAUDE.md` lines 29-30 are the two sentences of P-08, word for word.
- Test: `scripts/test-agent-stop-check.mjs` 25 checks, **red on 7d144326 first** (no script: 25 of 25 failed), green after.

## Decisions I made
- Scripts tests run as steps of `.github/workflows/tests.yml` (TR1's file, not mine); `mcp/tests.json` holds only mcp/ suites.
  So the new test is not yet a CI step: the reviewer adds `node scripts/test-agent-stop-check.mjs` after TR1 merges (see For the owner).
- A green line naming an older sha also counts when every file changed since is the job's note or `mcp/WORK.md` (the note
  is written after the green run, so the head always moves past the CI sha). Any code change after the sha: refused.
- The "?" test for the owner question looks at the lines under "## For the owner" only; "none" is no question.
- `OWNER-RULES.md` lines 10-11 repeated the old CLAUDE.md sentence; I made them the new one (they contradicted it).
- `.claude/settings.json` did not exist: created with only the Stop hook. Hook path is relative (`node scripts/...`): a session
  started in a subfolder of the repo finds no script, node fails with exit 1, which does not block (only exit 2 does).

## For the owner
- Lines that no longer match the two sentences, left unchanged: `OWNER-RULES.md` line 28 (builder scripts in `C:\DataArcus\...`),
  line 31 ("the full run once, at the end") and line 53 ("the full run"); `mcp/docs/TESTS.md` lines 40-41 (one full local run
  `npm test -- --keep-going`, 30-40 min, then CI); `mcp/CLAUDE.md` line 34 and `mcp/docs/LAPTOP.md` (the laptop loop as a builder's);
  `mcp/WORK.md` and the skills' "builder on his laptop" wording elsewhere. A later job (LR2 or a docs job) can make them true.
- The reviewer adds the step for `scripts/test-agent-stop-check.mjs` to tests.yml once TR1 is merged.

## Risky changes
- **The Stop hook changes how every builder session in this repo ends.** What: Stop runs `scripts/agent-stop-check.mjs`; on
  fix/* and feat/* a note without the CI line gets one refusal message and the turn continues. Why: LR1 found builders ending
  turns before CI finished. Limits: 3 refusals in a row, then the stop is allowed; every read failure allows it; other
  branches are never held. Tried only on made-up repos, not in a live Stop event: the exit-2-with-stderr protocol is Claude Code's.

## Seen, not in scope
- Docs outside the brief that still describe the laptop-builder flow (listed above).

## Lessons for the reviewer
- A brief that says "registered in mcp/tests.json or the website runner" should name where scripts/ tests live: they are
  tests.yml steps, a file another builder owns; the brief's scope list and its file ban collide there.
- State at 2026-11-11T03:21Z: code done, checks next.
- State at 2026-11-11T03:36Z: CI 1 red (results-adapter pinned old wording), fixed, CI 2 next.
- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/42953863979 on aea7ab5f131d4a618eb3f195fcbf9dff8a97a3a7** (second run; first red, see Decisions). State at 2026-11-11T03:50Z: DONE.
