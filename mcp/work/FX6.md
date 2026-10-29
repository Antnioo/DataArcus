# FX6 (0.3.1): Codex's delta review (D01, D04, D05, D06) and FX4's Seen 1

## Summary
- **Approval:** the reviewer's brief "Go on FX6" (28 Oct). Binding: D-1028-02 (Codex's findings fixed in 0.3.1),
  D-1027-13 (0.3.1 backed by every means), D-1027-12 (the twin identical), nothing written that the person did not approve.
- **Source:** Codex's delta review 75652532..5690ea89 (dataarcus-exchange results/2026-10-28-delta-review-031), as
  quoted in the brief: D01 (high), D04 (medium), D05 (low), D06 (low); FX4's Seen 1 (suggest_fields' word list).
- **Base:** `fix/0.3.1-fx6` from `origin/integration/0.3.1` at 1356a16 (Merge FX4). Push only this branch.
- **Scope:** `assets/js/report-mirror.js` (phoneCard, labelMobile, mirrorVisual's shadow; + .min.js),
  `assets/js/pbip-bind.js` (NOT_CAT_OLD; + .min.js), `mcp/lib/tool-answer.mjs` (capText), `scripts/microsoft-watch.mjs`
  (the comment pages), `mcp/CHANGELOG.md` (one line at the end of [Unreleased]). Tests: `test-0.3.1-tw1.mjs` (P4-P6),
  `test-0.3.1-cx2.mjs` (S7-S10), `scripts/test-microsoft-watch.mjs` (W13 x2), new `test-0.3.1-fx6.mjs` (W, C, N).
  twin-pages.mjs NOT touched (the fix fits in report-mirror.js); none of FX3's or FX5's files.
- **Expected checks:** (written before the work, a07e950) tw1 18 -> 21 (P4, P5 red first; P6 a guard); cx2 16 -> 20
  (S7-S9 red first; S10 a guard); microsoft-watch 65 -> 67 (both W13 red first); new `fx6` about 6 checks. Every other
  suite the same count; golden picks may move only where a capitalised Notes/Description/Comments column was a category.
- **Got:** tw1 18 -> 21, cx2 16 -> 20, microsoft-watch 65 -> 67, new fx6 8 checks (W1, W3, C1, C2, N1 red on 1356a16
  first; W2, C3, N2 guards green there). All red on 1356a16 first (tests committed red: f9d913f), green on 92bbb45 and 9b780e1.
  golden task 10 suggestChars 6604 -> 6022 on purpose (below); no other suite's number changed. Suites: base + 1 (fx6).
Full run on 9b780e1: "run-tests: 119 suites passed"
- **Resume:** done; CI on the branch (tests.yml, started after the full run), then the reviewer.

## Before -> after
| Item | Before (1356a16) | After (92bbb45) | Test |
|---|---|---|---|
| D01 | desktop title wraps, phone title approved apart: the phone's replaced by the desktop's; a phone-only change never fitted | the phone card's own final title (as approved, else as it was) is fitted and kept; the desktop's full name only when the phone layout has no title of its own | tw1 P4, P5 (P6 guard) |
| D04 | theme `*`/`*` dropShadow BottomRight, no local preset: the Arabic card still cast BottomRight | the Arabic visual gets its own preset, mirrored (BottomLeft); the visual type's theme preset first, then `*`; the English pages and the theme unchanged | cx2 S7-S10, fx6 W1-W3 (twin written, EN-AR copy) |
| D05 | 39,857 x "a" + U+202E: the answer ended `\u` before its notice | the cut goes back to the escape's start (`\u` + 4-5 hex), then off a high surrogate | fx6 C1-C3 (every offset, 3 escapes) |
| D06 | pages stopped silently after 100, then a duplicate post | read to the end; at 1,000 pages (100,000 comments) nothing posted, the run fails saying the history is incomplete | watch W13 (page 101; the cap) |
| FX4 Seen 1 | "Notes" (6 values) offered as a category | words read without regard to case, except the singular "note"; camel ends (OrderID, ...Key) case-sensitive as before | fx6 N1 (N2 guard) |

## CHANGELOG line
One line at the end of [Unreleased]: "The Arabic twin's phone titles and shadows as approved" (all five, plain words).
The existing shadow line (63) and the watch line (31) are now true (the watch's: up to 100,000 comments, and beyond
it nothing is posted, so no finding is repeated). Number in it: 100,000 = `COMMENT_PAGES` 1,000 x per_page 100
(scripts/microsoft-watch.mjs); 40,000 = `ANSWER_MAX` (mcp/lib/answer.mjs).

## Decisions I made
- D01: "an explicit phone title" = the phone layout's own title text (mobile.json); approved or not, it is what the
  phone shows, so it is the one fitted; it is fitted only when it differs from the original phone text.
- D04: the theme reaches mirrorVisual as `opts.theme`, else `opts.waterfall.theme` (the twin's and the plan's options
  already carry it there), so twin-pages.mjs and twin-plan.mjs (FX3's) stay untouched. Only a side preset is written;
  a local dropShadow entry without a preset takes it; selector entries and odd shapes are left.
- D05: a backslash that does not start a full escape is a literal one and is not backed over; a 4-digit escape
  followed by a hex letter may be backed over (harmless: a complete escape or none).
- D06: a cap kept (1,000 pages) rather than none, so a broken API answer cannot loop for ever; at it the run throws
  (exit 1, "::error::") and posts nothing.
- Item 5: the word list case-insensitive (sort, order, phone... too), the camel-case ends kept case-sensitive. The
  singular "Note" keeps the old, case-sensitive rule: the first full run (92bbb45) failed 8 suites (test.mjs, golden,
  rc22, check, a11y, label-limits, r6-disclosure, testers, r4a) because `fixtures/health-project`'s only text column,
  Sales[Note], is the category of the reports 22 suites build; with it no category is left and the chart slots are
  empty. test.mjs is FX3's file and the fixture is shared, so the fixture stays; see For the owner.

## For the owner
- A text column named "Note" (singular, capitalised) is still offered as a category; "Notes", "Comments",
  "Description" no longer are. Making "Note" no category too needs the shared test project's Sales[Note] replaced by
  a real category (22 suites, test.mjs among them): your call, a later job.

## Risky changes
- What an answer returns: a text answer over 40,000 characters may now be up to 6 characters shorter before its notice
  (the cut goes back over a split escape). Nothing more is returned than before.
- Network: the weekly watch reads up to 1,000 pages of comments (was 100) and, past them, posts nothing and fails the
  run. Only GETs added; no new host.
- No test loses checks.

## For the laptop
- The twin of a report whose phone card has its own title, approved apart from the desktop title: the phone card
  shows the approved phone title, fitted. A theme with a side shadow: the Arabic pages' shadow on the other side.

## Seen, not in scope
- `mirrorMobile` mirrors only a phone layout's own preset; a phone layout inherits the desktop visual's (now local)
  preset, so nothing is left, but it is not measured in Desktop that mobile.json inherits a container's shadow.

## Tests changed on purpose
- golden task 10 `suggestChars` 6604 -> 6022: four capitalised "... Description" columns (Customs Status, Hub, Lane,
  Logistics Lookup 010) left the slicer pool; measured against 1356a16, nothing else in the answer moved. Its "why"
  written in golden-expected.json.

## Lessons for the reviewer
- `scripts/check-agent-memory.mjs` needs the exact form `- **Expected checks:**`; "Expected checks (before the work):"
  failed it (the note fixed before the full run's line).
- `npm test -- --affected` with a CHANGELOG or tool-*.mjs change runs every suite: start the gate's `--keep-going` run
  directly after the last code commit instead.
- A name rule's case change reaches the shared test project: run the suites that build reports from
  `fixtures/health-project` (22) before the full run when touching pbip-bind's word lists.
