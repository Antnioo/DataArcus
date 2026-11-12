## Summary
- **Approval:** the owner, 12 Nov 04:15 Dubai, D-1112-01 (fix the open audit finds, go on without him while he sleeps);
  D-1104-12 (one job, one place). Relayed by the hub, session_015Q77oNR7YVFznptSuZoZZ2, as job SN4.
- **Base:** `feat/0.3.3-sn4` from `origin/integration/0.3.3` at 0dc0ea05 (LX1 c78c9f80 and AU2 merged). Push only this
  branch; never merge, no PR.
- **Scope:** (1) read_report's JSON form says what it did not read (LK1 "Seen" 1); (2) create_report's `font` text true
  for both routes (FT1, FT2); (3) check_report's lint section says `notListed` with its count, not `truncated`
  (LX1 "For the owner" 1, decided by the hub). Files: lib/report-answer.mjs, lib/report-inputs.mjs, lib/check-report.mjs
  (the lint lines only), fixtures by their recorders, new suite sn4, TOOLS.md, CHANGELOG, WORK.md, this note.
- **Expected checks:** sn4 red on 0dc0ea05 first, then green; fn1e only the 4 lint cases move (read every key, R-95);
  tl1 and tk1 pass, tools/list under 61,000 (60,532 now, measured); lk1 23, sn1 20, rv1 484 unchanged; lint 0; CI.
- **Resume:** DONE; the reviewer: review and merge. Items 1, 2, 3 closed; sp42 R3 and fn1e's 4 cases re-recorded on purpose.
- CI green: https://github.com/Antnioo/DataArcus/actions/runs/43145641444 on 3c435a56ad297f90c7a591f416b6e104df7846ba
  (2026-11-12T03:21Z; Linux, Windows and website all green, macOS skipped by the workflow; integration/0.3.3 still at 0dc0ea05, R-33).

## The plan (written before the code, 2026-11-12T02:33Z)
Measured on 0dc0ea05:
- **1.** report-answer.mjs: the text's NOT READ line (the tail) lists links, files over 8 MB (`inv.sk.big`),
  folders deeper than 12 (`inv.sk.deep`), unreadable (`inv.unreadable`), the cap (`inv.sk.capped`); the JSON `out` has
  `notRead: { links }` only. Plan: one function `notReadOf(inv, links)` builds the facts (count and names as the text
  line prints them); the text line formats it, the JSON adds its keys next to `links` under `notRead`, only when
  there is something to say (R-89). Names are screened by the same helpers as the text. Red first: a made-up report with a
  file over the limit, a folder too deep, an unreadable file; both forms through the real server.
  R-90: suites that record read_report's JSON, listed before the change below.
- **2.** report-inputs.mjs:91, "Hand-placed pages: the font (default Segoe UI)" -> a text true for both routes. tl1's
  fixture is recorded without descriptions; measured after the change whether it moves (said per test).
- **3.** check-report.mjs:397 (cap) and :430 (size loop) set `truncated: true` in the lint section; both become
  `notListed: <count>`. fn1e's 4 cases re-recorded by their recorder ON PURPOSE; C2's needle `"truncated":true}`
  follows to the new key.

## Before -> after (2026-11-12T02:48Z)
New suite `sn4` (checker), 11 checks, **red on 0dc0ea05 first** (8 of 10 then failed: A1 to A6 the JSON's notRead and
notReadOf, F1 the font text, L1 the lint's notListed; the controls A0, F2 passed). tools/list 60,532 -> 60,513 (read from
the real server, under tl1/tk1's 61,000).
- **1. Measured on the base:** with a file over 8 MB and a file not JSON, the text said "NOT READ 1 file(s) over 8 MB; 1
  file(s) not readable as JSON"; the JSON said nothing (no notRead key). **The folder too deep did not show in either
  form:** read_report reads fixed places and never walks folders, so `sk.deep` and `sk.capped` stay empty in it (only
  check_report's walk fills them). Fixed: `notReadOf(inv, links)` in lib/report-answer.mjs builds the text line and the
  JSON `notRead` from the same facts (links as LK1's linksSaid gave them, same keys; `tooLarge`, `tooDeep`, `unreadable`,
  `pastTheCap`), present only when something was left out (R-89). A3 proves deep and capped through the function itself.
  R-90, suites that run read_report with JSON, before the change: 0.2.9-agent, 0.2.9c, 0.2.9d, 0.2.9f, 0.2.9v, 0.3.0-claims,
  large-model-caps, powerbi-2026-10, sweep-s1, testers, audit-readers, checker, cx2, reader-seen, sf1, sq15a, sp21, sp42,
  tk1, lk1, tl1, fuzz, rc23, round22. **I wrote "none moved" before running sp42: wrong.** CI (run 43143955271, f620e1ee) failed sp42 R3 alone (Linux shard 3,
  Windows shard 4): its report has 3 unreadable files, so the two JSON answers of R3 (`json`, `page1`) gained `notRead:
  {unreadable: {count: 3, why: "not readable as JSON"}}` and their `size` (6538 -> 6604, 3956 -> 4022 characters), read from
  dumps of the base's and the new answerOf (every other case of sp42's 22 unchanged). **sp42 re-recorded ON PURPOSE by its
  recorder (SP42_RECORD=1): R3 only** (length 46132 -> 46265). The other suites of the list: no CI failure; `-- report`
  80 and `-- checker` 20 pass. A report read whole has no new key (A0).
- **2.** `font`: "Hand-placed pages: the font (default Segoe UI)" -> "The font (default Segoe UI)" (lib/report-inputs.mjs:91):
  true for hand pages (FT1) and a design (FT2: it replaces the design's font; the plan says which). **Arabic:** grep for
  the old text and for Arabic font wording in report-inputs.mjs and approval-ar.mjs: no Arabic copy of this description
  exists (the only other places are FT2.md and sn4's test). tl1: its fixture holds the schema without descriptions, so it
  did not move (51 checks, no re-record); tk1 K4 15 checks and sn1 T6 (a ceiling, 60,532) pass unchanged.
- **3.** lib/check-report.mjs: the lint section's two cuts (the maxFindings cut, the size loop) set `notListed: <count>`
  and no `truncated`. **fn1e re-recorded ON PURPOSE by its recorder (FN1E_RECORD=1): 4 cases, 1 key each, read from dumps of
  the old and new outputs (R-95):** "sizes and unreadable, cap 3" (len 10686 -> 10683, `"truncated":true` -> `"notListed":6`),
  "many overlaps" (27389 -> 27387, 19), "many overlaps, lint only" (26008 -> 26006, 19), "cut to the bone" (29464 -> 29462,
  12). Nothing else changed in them; the other 519 outputs keep their pins. C2's needle `"truncated":true}` followed to
  `never as errors.","notListed":` (the lint's own text before the key; it fails if no case cuts the lint), said in the test.
  The pins file's `about` says it.

## Changed on purpose
- fixtures/fn1e-pins.json: 4 lint cases (item 3). fixtures/sp42-split.json: R3 (item 1). test-0.3.2-fn1e.mjs C2's needle.

## Runs
sn4 11, sp42 22, fn1e 591, tl1 51, tk1 15, lk1 23, sn1 20, terminology-sheet 48 and bilingual-report 34 (3 times each, R-77), `npm test
-- report` 80 suites, `-- checker` 20 suites PASS; tsc (tsconfig.tc1.json) clean; lint 0; check-modules --strict 1263,
check-contracts 868, result-lines 255, agent-memory 529 (WORK.md), changelog-words 88, site config PASS.

## CHANGELOG line
Three lines in `mcp/CHANGELOG.md` [Unreleased]: read_report's JSON says what it did not read; the lint section's
`notListed`; the `font` description.

## Decisions I made
- The JSON keys: `notRead.tooLarge { count, over }`, `tooDeep { count, deeperThan }`, `unreadable { count, why }`,
  `pastTheCap { files }`: counts only (the text names none of them, so the JSON names none), links as LK1.
- The font text: the fewest true words are the first part only (the design route is in plan_layout's and the plan's own words).
- C2's needle: kept specific to the lint's cut, not loosened to any `notListed`.

## For the owner
none (item 3 is the hub's decision, D-1112-01; one word in an unreleased answer: say it in the morning).

## Risky changes
none.

## For the laptop
none.

## Seen, not in scope
1. read_report never reports a folder too deep or the file cap (it does not walk folders; only check_report does), so a
   report with a deep folder looks fully read in read_report. Measured above. Whether it should walk is a job of its own.
2. `size` in read_report's JSON cap is estimated before notRead is added (600 characters of slack); a report with all five
   kinds of loss and 10 long link names could add about 700 characters. Not measured over the cap.

## Lessons for the reviewer
- R-90 means running every suite on the list, not only the areas: sp42 was on my list and only CI ran it.
- A suite with a fixed number (sn1 T6) can be a ceiling: shortening a description needs no change there.
- fn1e's C2 needle is a text; a rename of a key in a pinned section moves it too.
