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
- State at 2026-11-12T06:25Z: done; CI green on the last code commit.
CI green: https://github.com/Antnioo/DataArcus/actions/runs/43166273678 on 1fd37d24366a584a5394c1843f80890496cfdf75

## Before -> after
- The Stop hook let a note through on a CI green line whatever its two sections said. Now it refuses (exit 2, one message naming the line, format shown once) when a line under "## For the owner" is not a question with class/rec/yes/no/default, or a line under "## Seen, not in scope" has no valid route/why (fix: size). 3-refusals rule and STOP: unchanged.
- Test: `scripts/test-agent-stop-check.mjs` 25 -> 59 checks, **red on c921955d first** (20 of 59 failed with the old hook; read from the run), green after.
- `mcp/docs/OWNER-RULES.md` has the note template (the repo had none) with one example per line format and "## For the reviewer".

## Decisions I made
- A bare indented line continues the item before it; a bare unindented line is an item of its own. Fenced code is skipped.
- The refusal counter is per branch, so the new tests give each call its own state folder.
- `npm run lint` needed `npm ci --ignore-scripts` in this container (no node_modules); then exit 0.
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
- The note's section format is now a gate: a builder note with an old-style Seen or For the owner line is refused up to 3 times (tell builders to use the template).
