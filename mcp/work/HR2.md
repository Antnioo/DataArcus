## Summary
- **Approval:** the reviewer's brief "HR2" (3 Nov, B-295, HR1's "For the owner" 2); D-1016-01, D-1102-02, D-1103-06.
- **Base:** `fix/0.3.2-hr2` from `origin/integration/0.3.2` at 10aa0f2. Pushed only this branch.
- **Scope:** plan_layout's ANSWER only, in HR1's `lib/plan-headroom.mjs` fitRepeats (past AIM = 95% of ANSWER_MAX,
  38,000, only): the plan's data, its binding and the approval page untouched (they read their own copies).
- **The step:** bilingual-report's B5 (every 0.3.0 option, the large fixture) after the Gulf date answer, before
  the Arabic names and texts are given (no plan id). Measured before (a local probe, not committed; the
  120-character folder): 42,710 before the cap, cut by capAnswer: `bilingual.notTranslated` 25 of 50.
- **What changed, past AIM only:** `bilingual.notTranslated` grouped by its why (each why, and whyAr, once; its
  texts, each text and where, under it): 3,582 saved. `bilingual.terminology.sheet[].why`, the same for every row of
  a status, once in `whyByStatus` (713). `forAuthoring[].position` repeated its slot's x, y, width, height (by role)
  and tabOrder equalled z: each `{ role, kind, z }` and the rule once, `forAuthoringPosition` (about 900).
- **Numbers (text sent):** the step, long folder (136 characters): 39,318 cut (42,710 before the cap) -> 37,800
  uncut, notTranslated 50 of 50; short folder: 37,902 uncut. Headroom: 98-200 under 38,000, 2,100-2,200 under 40,000.
  B5's plan with an id (hr1): 37,7xx -> 37,046 (forAuthoring reshaped too).
- **Expected checks:** (written first) hr2 red on 10aa0f2, green after; no other suite's line moves. **Got:** hr2
  red on 10aa0f2 (G1-G3 and U), 7 checks green on d89206cc; hr1 10 checks green. Areas: see Results.
- **State: DONE.** CI green: https://github.com/Antnioo/DataArcus/actions/runs/41622279492 on 7160e562.
- **Resume:** none; the reviewer's merge.

## Results
- Commits: b09b4dd8 (the plan), 260ba438 (the guard red, in `ignored`), d89206cc (the code, hr2 in `suites`, CHANGELOG),
  96f85e95 (merge of origin/integration/0.3.2 at c46ba4ea).
- Line counts (before -> after): lib/plan-headroom.mjs 54 -> 92; test-0.3.2-hr2.mjs 0 -> 89 (new); tests.json +1;
  CHANGELOG.md +2; WORK.md's 0.3.2 line names HR2.
- Areas on d89206cc (before the merge): report 55 suites passed and 1 failed: glass-tables, because this clone was
  shallow (`git show cba24a5` not found); after `git fetch --unshallow` it passes, 113 checks. arabic 15, checker 7.
- After the merge (96f85e95): report 56 suites passed (hr1 10, hr2 7 checks), arabic 15, checker 8, core 11;
  bilingual-report 33 checks and fx1 22 checks, three times each, all PASS. Lint: exit 0.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/41622279492 on 7160e562 (the first attempt: macOS
  shard 2 failed custom-visuals-lab CL-2, Microsoft's validator `PBIR_SCHEMA_UNREACHABLE`, a network warning on the
  runner; `gh run rerun --failed` once: green).

## CHANGELOG line
"Every text that stays English is listed: the bilingual plan's step before the Arabic texts (every option on) is no
longer cut; it says each reason once, with its texts under it, so the person sees every text to label."

## Decisions I made
- notTranslated grouped (each why once, its texts under it) rather than each text pointing to a reason key: 3,582
  saved against 3,031, and nothing to look up. The key stays `notTranslated` (sayFirst names it); a group keeps
  whyAr when its texts had one. Only when some why repeats.
- Step 3 was needed: the reasons alone left the step at about 39,100 (under 40,000, so uncut, but over the 38,000
  bar). The next repeats in that answer, measured: the sheet's why per status and forAuthoring's positions (HR1
  dropped tabOrder alone because it was in every plan; here it is past AIM only, so no characterisation suite moves).
- Not done (not a repeat that can be said once without changing what is listed): the 38 texts that are both in
  `bilingual.texts` and in `notTranslated` (the texts the person is being asked to label): notTranslated keeps each
  text and where, as the brief says.
- One rerun of the failed macOS shard (a FAIL line, not a cancel): its cause was the validator not reaching
  Microsoft's schema (a warning), in a suite this job does not touch, green on Linux and Windows in the same run.
- The guard drives HR1's person only up to the first answer with `bilingual` (the step), so it stays short.

## For the owner
none

## Risky changes
- An answer past 38,000 has a third shape: an AI reading `bilingual.notTranslated[].why` finds groups
  (`{ why, whyAr?, texts: [{ text, where }] }`), `forAuthoring[].position` is `slots` by role (said in
  `forAuthoringPosition`), and a sheet row's why may be in `terminology.whyByStatus`. Under 38,000: byte for byte
  as before (U1, and no suite line moved).

## Seen, not in scope
- `bilingual.texts` order still varies run to run (HR1's Seen): about 100 characters between two runs.
- custom-visuals-lab CL-2 fails when the runner cannot reach Microsoft's PBIR schema (macOS, 3 Nov): a network
  warning counted as a warning.
- A shallow clone fails glass-tables (`git show cba24a5`): CI's checkout depth is fine, a local session is not.

## Lessons for the reviewer
Near the cap (text sent, after this job): the B5 step before the Arabic texts 37,800-37,902 (98 under 38,000: the
next to grow); plan_layout B5 with an id 37,046; create_arabic_twin's plan on the large fixture 34,2xx (HR1's).
