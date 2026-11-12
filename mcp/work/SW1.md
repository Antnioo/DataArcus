## Summary
- **Approval:** the owner 12 Nov, D-1112-06 ("okk i agree" to the reviewer's list); the sweep is his yes of D-1112-03.
- **Scope:** two small items, one commit each, nothing else. (1) I-1112-1696: mcp/WORK.md is at its cap; move its oldest finished line to mcp/work/archive/ the way the repo does, leave room for 5 lines, cap unchanged. (2) I-1112-1702: scripts/test-whats-new.mjs names what it checks. Not touched: .github/workflows/tests.yml (CI3's).
- **Base:** origin/integration/0.3.3 9ee1b0ce (branch fix/0.3.3-sw1).
- **Expected checks:** `node scripts/check-modules.mjs --strict`; check-agent-memory, check-result-lines, changelog-words PASS; `node scripts/test-whats-new.mjs` PASS.
- **Resume:** item 1 then item 2 then the CI run; see "For the reviewer" below for the state.

## Before -> after (2026-11-12T22:51Z)
- mcp/WORK.md: 3,193 characters (check-agent-memory --sizes, cap 3,200; 7 left) -> 2,437 (763 left, room for 5 lines of about 150). The oldest finished line ("0.3.3 merged: BA1 ... FB4") moved unchanged to `mcp/work/archive/WORK-2026-11-12.md`, linked from the archive README as the repo's archive rule says (OWNER-RULES, "Keeping the memory"). Cap untouched. RX1 said 1 left; on 9ee1b0ce the tool reads 7 (code points).
- scripts/test-whats-new.mjs: header and result name said 0.3.0 alone -> "0.3.0 and 0.3.1" (the sections it checks: beta.new and beta.new31); printed name `whats-new` -> `whats-new-030-031`; 171 checks (169 + 2 self-checks).

## CHANGELOG line
none (no user-visible change).

## Decisions I made
- Item 2: the "current section" the test checks is two sections, 0.3.0 and 0.3.1, so the name says both. No other file reads the old name (grep over json, mjs, js).
- Red first for item 1: no code changes, so the existing check-agent-memory was shown red by adding one 200-character line to WORK.md on 9ee1b0ce: `FAIL agent-memory 1 of 536: mcp/WORK.md: 3392 characters, 3200 at most`; reverted. Green now.
- R-33: origin/integration/0.3.3 has no commit beyond my base 9ee1b0ce (read at 2026-11-12T22:51Z), so there was nothing to merge in.

## For the owner
none

## For the reviewer
- I-1112-1696: commit 44bb6bd8. Red on 9ee1b0ce first (above).
- I-1112-1702: commit e3c05e01. Red on 44bb6bd8 first (`FAIL whats-new 1 of 171: the header says which sections this checks`).
- .github/workflows/tests.yml line 115 still says "What's new in 0.3.0": CI3's file tonight, not edited.
- Checks run: check-modules --strict PASS 1264; check-agent-memory PASS 537; check-result-lines PASS 257; changelog-words PASS 110; test-whats-new PASS 171.

## Risky changes
none

## For the laptop
none

## Seen, not in scope
- tests.yml step name "The beta page's "What's new in 0.3.0"..." (line 115) | route: job | size: S | why: CI3 owns tests.yml tonight; rename it to the new printed name after CI3 merges

## Lessons for the reviewer
- A note's size claim ("1 character left") differed from the tool's (7): name the tool and unit (code points) in such items.
