## Summary
- **Approval:** the reviewer's brief "HR1" (3 Nov, B-293); D-1016-01, D-1102-02, L-1102-06.
- **Base:** `fix/0.3.2-hr1` from `origin/integration/0.3.2` at 0c7450e. Pushed only this branch.
- **Approval, step 2:** the owner's choice OPTION 1 "Remove repeats" (relayed by the reviewer, 3 Nov 08:4x).
- **Scope:** plan_layout's ANSWER only (`tools/plan_layout.mjs`, `lib/gulf-date-questions.mjs`'s answer object); the
  plan's stored data, the approval binding and the approval page untouched. `test-0.3.2-hr1.mjs` moves into `suites`
  (area report); bilingual-report's B5h also fails on `truncated`; suite lines that read a moved field move with it.
- **Plan (option 1), each answer-only:**
  1. flipCards: `back` once on flipCards when every card's is the same (else on each card, as now).
  2. flipCards: the 3 new measures a card adds on each page follow one rule, said once (`measureNames`); a card whose
     names differ from the rule (a name already taken in the model gets another number) keeps its `measures` list.
  3. gulfDates.candidates[].relationship: `"to Calendar[Date]"` (the field is not repeated).
  4. gulfDates.candidates: once the person confirmed the date (dateRole answered), only that one, and
     `otherCandidates: <n>`; before that, every candidate (they are the question's choices).
  5. forAuthoring: `tabOrder` dropped where it equals z, said once (`tabOrderIsZ`).
  6. slots[].galleryWhy dropped (the same why is on gallery.slots for that page and title).
- **Expected checks:** B5 plan (long path) 40,319 cut -> about 37,200 uncut (<= 38,000); hr1 5 of 5 green;
  bilingual-report 33 checks, B5h stricter and green; flip-cards, gulf-date-questions: lines named below move.
- **State: IN PROGRESS.**
- **Resume:** the steps above in order; then the areas, lint, the merge (once), CI.

## Step 1 (measured, 3 Nov): the cause
- The brief's cause (an absolute path repeated in the answer)
  is not what I measured: no plan_layout, check_report or create_arabic_twin answer carries the project path, before
  or after the scrub. The B5 plan is over the cap on every path, and is cut today.
- **Measured** (`test-0.3.2-hr1.mjs`, B5's plan with every option, from a 15- and a 136-character temporary folder;
  the answer before capAnswer logged by a local probe, not committed):
  - plan_layout B5 before the cap: 40,328 (short) and 40,319 (long). Over ANSWER_MAX on both, so capAnswer cuts
    `flipCards.cards` 4 -> 2 and the text sent is 39,615-39,640. The same on bilingual-report's own run on 0c7450e
    (its B5 answer: `truncated.cut {"flipCards.cards":{"kept":2,"of":4}}`). B5h passes only because the cut answer
    is under 40,000; it fails when the cut lands at exactly 40,000 (`< 40000`): the flicker.
  - Fields holding the folder: plan_layout none; check_report none; create_arabic_twin plan none; create_report one
    (`open`, scrubbed to relative before it leaves). The scrub (tool-answer.mjs) runs after the cap, so a path would
    count, but none is there.
  - What varies between runs (about 25 characters) is the ORDER of `bilingual.texts` (and so which made-up Arabic
    name each text gets in the test), not the path.

## The repeats measured (saving on the 40,328 answer)
- flipCards.cards[].back identical on every card -> once on flipCards: 591.
- flipCards.cards[].measures (21 names, each "<title> (flip front|back|backdrop)" and " 2"): a rule instead: 852.
- gulfDates.candidates[].relationship repeats `field` -> `to: "Calendar[Date]"`: 400.
- forAuthoring[].position.tabOrder always equal to z: 178.
- gallery.slots[].why repeated in slots[].galleryWhy: 158.
- Largest parts: bilingual 16,265 (texts 4,739, terminology 3,427, cannot 1,674), gulfDates 4,131, flipCards 3,349.

## The guard (committed, red on purpose, in tests.json `ignored` with why)
`test-0.3.2-hr1.mjs`: H1 the long-folder B5 plan not cut and at most 38,000; H2 short vs long within 200; H3 the
plan names the folder at most once; H4 check_report and the twin's plan the same. Now: H1 red (39,616, cut), H2-H4
green. Moves into `suites` (area report) with the fix.

## For the owner
Chosen: 1 (3 Nov). The options as offered:
1. Recommended: the five repeats above plus `gulfDates.candidates` cut to the one in use and a count of the others
   (measured together: 40,328 -> 37,184, headroom 2,816 under 40,000, 816 under the 38,000 bar). The 2,000-character
   bar (38,000) is met; "at least 2,000 on the long path" too. 18 suite lines that read these fields move with it.
2. Or raise the bar differently: the plan's AIM for a bilingual plan with every option is the cap; B5h becomes
   "not cut" instead of "< 40,000".
3. Or keep the plan as it is and only make B5h honest: fail when `truncated` is present (red today).

## Risky changes
none (no answer code changed).

## Seen, not in scope
- The B5 plan is cut TODAY (2 of 4 flip cards' details dropped from the plan the person reads), on every path.
- `bilingual.texts` order varies run to run (same machine, same fixture): an answer that is not deterministic.
- capAnswer measures the answer before the scrub (tool-answer.mjs compact): harmless today (no path in it).

## Lessons for the reviewer
Near the cap (text sent): plan_layout B5 39,6xx (cut); create_arabic_twin's plan on the large fixture 34,269;
check_report 9,969. B5h's `< 40000` cannot see a cut answer: check `truncated` too.
