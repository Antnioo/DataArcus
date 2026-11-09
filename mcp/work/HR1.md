## Summary
- **Approval:** the reviewer's brief "HR1" (3 Nov, B-293); D-1016-01, D-1102-02, L-1102-06.
- **Base:** `fix/0.3.2-hr1` from `origin/integration/0.3.2` at 0c7450e. Pushed only this branch.
- **Approval, step 2:** the owner's choice OPTION 1 "Remove repeats" (relayed by the reviewer, 3 Nov 08:4x).
- **Scope:** plan_layout's ANSWER only: new `lib/plan-headroom.mjs` (fitRepeats), one call in `tools/plan_layout.mjs`;
  the plan's stored data, the approval binding and the approval page untouched (fitRepeats copies, never mutates: U2).
  `test-0.3.2-hr1.mjs` in `suites` (area report); bilingual-report's B5h also fails when a plan with an id is cut.
- **What changed (option 1), only when the answer is past AIM = 95% of ANSWER_MAX (38,000):** flipCards `back` once
  (when every card's is the same) and `measureNames` (the rule; a card whose names differ keeps `measures`);
  gulfDates.candidates: once confirmed, that one and `otherCandidates: n` (before: all, they are the choices); each
  relationship `"to Calendar[Date]"`; slots[].galleryWhy dropped (said on gallery.slots).
- **Numbers (B5 plan, text sent):** short folder 39,615 cut -> 37,704 uncut; long folder (136 characters) 39,616 cut
  -> 37,680 uncut. Headroom 2,320 under 40,000 (320 under the 38,000 bar). Before the cap: 40,328 -> about 37,700.
- **Expected checks:** (written first) B5 <= 38,000 uncut, hr1 green, B5h strict. **Got:** hr1 10 checks (H1-H5, U1-U4), red on 0c7450e (H1, H5), green on ea124e05. bilingual-report 33 checks:
  B5h red on 0c7450e (the B5 plan cut), green after. No other suite line moved (the reshape is conditional).
  Areas on ea124e05: see Results.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41611277931 on bd2c1ace.
- **Resume:** none; the reviewer's merge.

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

## Results
- Commits: 1397e0c (step 1: measured, the guard red), 9f77721 (the plan), ea124e05 (the code and tests),
  bd2c1ace (merge of origin/integration/0.3.2 at 67f1d234; WORK.md's 0.3.2 line kept from both sides).
- Line counts (before -> after): lib/plan-headroom.mjs 0 -> 54 (new); tools/plan_layout.mjs +4 -2; test-0.3.2-hr1.mjs
  0 -> 131 (new); test-0.3.1-bilingual-report.mjs +8 -4; tests.json one line moved; CHANGELOG.md +3.
- Areas on ea124e05: report 51 suites passed, arabic 15, checker 7, core 11; lint exit 0. After the merge (bd2c1ace):
  report 55 suites passed; bilingual-report 33 checks and fx1 22 checks, three times each, all PASS; hr1 10 checks PASS.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41611277931 on bd2c1ace.

## CHANGELOG line
"A large plan is no longer cut: a plan close to the answer limit (one report in English and Arabic with every option
on) says once what it repeated (the flip cards' back and helper measure names, the confirmed date), so every flip card
stays in the plan; smaller plans read exactly as before."

## Decisions I made
- The reshape applies only past AIM (95% of the limit), as fitLists does for lists: the reviewer expected 18 suite
  lines to move, but the characterisation suites (sp3 R6, sp4 P2 and, with the tabOrder change, sp3, sp4, sp7, sp13
  byte for byte) would have needed their recorded fixtures re-recorded, which the rules forbid. Conditional: none moves.
- Step 5 of the plan (forAuthoring tabOrder said once) dropped: it is in every plan (every characterisation suite
  moves) and B5 is under 38,000 without it.
- B5h counts a cut only on an answer with a plan id: a step before it is still cut (For the owner, 2).
- The code is in a new `lib/plan-headroom.mjs`, so the rule can be checked on made-up answers (U1-U4).

## The repeats measured in step 1 (saving on the 40,328 answer)
- flipCards.cards[].back identical on every card -> once on flipCards: 591.
- flipCards.cards[].measures (21 names, each "<title> (flip front|back|backdrop)" and " 2"): a rule instead: 852.
- gulfDates.candidates[].relationship repeats `field` -> `to: "Calendar[Date]"`: 400.
- forAuthoring[].position.tabOrder always equal to z: 178.
- gallery.slots[].why repeated in slots[].galleryWhy: 158.
- Largest parts: bilingual 16,265 (texts 4,739, terminology 3,427, cannot 1,674), gulfDates 4,131, flipCards 3,349.

## The guard (step 1 committed it red in `ignored`; now in `suites`)
`test-0.3.2-hr1.mjs`: H1 the long-folder B5 plan not cut and at most 38,000; H2 short vs long within 200; H3 the
plan names the folder at most once; H4 check_report and the twin's plan the same; H5 the repeats said once; U1-U4
fitRepeats on made-up answers. On 0c7450e: H1 red (39,616, cut), H5 red; on ea124e05 all green.

## For the owner
1. Chosen: option 1 (3 Nov), done as above.
2. Still cut, before and after this job: the B5 step BEFORE the Arabic texts are given (no plan id yet) is 42,587
   characters before the cap; capAnswer cuts `bilingual.notTranslated` (25 of 50 kept), the texts the person must
   label. Its 50 entries repeat 4 reasons (38 times one of them): the reasons once would save 3,233 (to 39,354),
   still near the cap. A job of its own, if you want it.

## Risky changes
- An answer past 38,000 now has a second shape (the repeats said once): an AI reading `flipCards.cards[].back`
  finds it on `flipCards.back`. Said in the answer itself (measureNames, back beside cards).

## Seen, not in scope
- `bilingual.texts` order varies run to run (same machine, same fixture): the reviewer files it separately.
- capAnswer measures the answer before the scrub (tool-answer.mjs compact): harmless today (no path in it).

## Lessons for the reviewer
Near the cap (text sent, after this job): plan_layout B5 37,7xx; the B5 step before the Arabic texts 40,000 (cut,
For the owner 2); create_arabic_twin's plan on the large fixture 34,2xx; check_report 9,969. A `< 40000` check cannot
see a cut answer: check `truncated.cut` too (check_report's own `truncated: true` is its findings list, not the cap).
