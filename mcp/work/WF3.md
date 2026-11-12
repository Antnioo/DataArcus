# WF3 (0.3.3): the Stop hook also checks that the note's "Seen, not in scope" and "For the owner" can be read by a machine

## Summary
- **Approval:** the reviewer hub's brief "WF3" (12 Nov); the owner D-1112-03 ("For wf1 1 to 5 yes"), his words D-1112-02.
- **Base:** `feat/0.3.3-wf3` from `origin/integration/0.3.3` at c921955d. Pushed only this branch; never merged, no PR.
- **Scope:** `scripts/agent-stop-check.mjs`, `scripts/test-agent-stop-check.mjs`, `mcp/docs/OWNER-RULES.md` (the note
  template: it had none), `mcp/WORK.md`, this note. Nothing a user of DataArcus sees changes.
- **Expected checks:** `node scripts/test-agent-stop-check.mjs` red on c921955d for the 6 new cases, then green (now 25
  checks; the new total is read from the run); check-result-lines, changelog-words, check-agent-memory PASS; `npm run lint` exit 0; CI.
- **Resume:** start at "Plan"; the state is the last line of this note.

## Plan
1. This note. 2. Tests first (red on the base): a statement under For the owner; a question without rec; a Seen line without
route; a wrapped item is one item; "none"; a heading that only contains the words. 3. The hook. 4. Template in OWNER-RULES.md.
5. WORK.md line, checks, merge origin/integration/0.3.3 once, CI, wait.
- Parser (constants as pasted from items.py): CLASSES, BUILDER_ROUTES, PIPE_KEYS; an item starts with "- ", "* " or "1. ";
  a line starting (after spaces) with "| <key>:" continues the item. Sections are found by a heading line that is exactly
  the heading. Checked only when the existing checks would allow on a CI green line (a STOP: line still allows at once).

## CHANGELOG line
none (not a user change: the hook is a builder tool).
- State at 2026-11-12T06:07Z: plan written.

## Decisions I made
- The format is checked on the CI green path only, as the brief says; the old "a question under For the owner allows the stop" path stays as it is.

## For the owner
none

## For the reviewer
- no new Arabic
- nothing to decide

## Risky changes
none

## For the laptop
none

## Seen, not in scope
none

## Lessons for the reviewer
