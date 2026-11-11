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
  `CI green: <url> on <sha>` naming the head, no `STOP:` line and no question under "## For the owner". Allows after 3
  refusals in a row (count in a file under os.tmpdir(), keyed by branch). Any read failure: allow and print why.
- Test cases: no CI line; CI line on an older sha; CI line on the head; STOP: line; a question for the owner; the 4th call
  after 3 refusals; integration branch; unreadable git; plus a note-only commit after the green run.

## CHANGELOG line
none (nothing a user sees).
- State at 2026-11-11T03:19Z: plan written, pushed.
