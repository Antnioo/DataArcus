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
- **State:** code and pins done; full run and CI below.
- **Resume:** run the full suites, then CI.

## Before -> after (each name; isTimeName)
| name | before | after |
|---|---|---|
| «العام» | true | true |
| «العام المالي» | true | true |
| «عام 2024» | true | true |
| «عام» | true | true |
| «المدير العام» | true | false |
| «الرصيد العام» | true | false |
| «القطاع العام» | true | false |
| «Sales العام» | true | false |

## Decisions I made
- The 8 pins are their own U1 line in dd1a (isTimeName only), so dd1a grows 311 -> 319 as the brief says. Adding them
  to the shared name lists would also run the four places on them (+27 more checks, 346): not done, the brief says
  "nothing else moves". Red: with the old rule 4 of the 8 fail (315 of 319).
- WORK.md was 3,197 characters; TN2 was added to its DD1A list and three words trimmed elsewhere to stay under 3,200.
- `npm ci` in the repo root was needed for the build (terser); no lock file changed.
- The sitemap lastmod did not move (checked after unshallowing the clone).

## For the owner
none

## Risky changes
none: one condition in one function; the four callers read it unchanged. A name with «عام» as a later word and no other
time word («القطاع العام») is no longer a time name, which is the decided rule.

## Seen, not in scope
- The P parity names in dd1a do not include the 8 TN2 names; adding them is +27 checks.
