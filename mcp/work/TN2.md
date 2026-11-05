## Summary
- **Approval:** the brief "TN2 (0.3.2)" (5 Nov); the owner D-1105-04 («عام» is time only as a name's first word), D-1104-15 (one time test).
- **Base:** `fix/0.3.2-tn2` from `origin/integration/0.3.2` (b7f69d2, DD1A in it). Push only this branch; never merged, never a PR.
- **Scope:** `assets/js/time-names.js` only: the word «عام» (after wordsOf: article off, alef folded) counts only when it
  is the first word wordsOf gives. Every other time word as today; «أعوام» (only "years") as today.
- **Commits:** 1 this plan; 2 the rule, `npm run build:min` stamps, sitemap lastmod if a stamp moved; 3 dd1a pins,
  CONTRACTS.md 1a line, CHANGELOG (folded into DD1A's line), WORK.md line, this note.
- **Pins (dd1a +8):** time: «العام», «العام المالي», «عام 2024», «عام». Not time: «المدير العام», «الرصيد العام»,
  «القطاع العام», «Sales العام».
- **Expected checks:** dd1a 311 -> 319; every other suite's number as before; lint 0; mutation 76/76.
- **Not in scope:** any other word, the four callers, any other file.
- **State:** planned.
- **Resume:** start at commit 2.

## Before -> after (each name)
(filled after the rule)

## Decisions I made
none yet

## For the owner
none

## Risky changes
none

## Seen, not in scope
none yet
