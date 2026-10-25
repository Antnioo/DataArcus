# mcp/WORK.md archive

`mcp/WORK.md` was one file of 6,589 lines until 25 Oct 2026. G1 (0.3.1) moved every finished round and wave entry here,
text unchanged, newest first as it was; `mcp/WORK.md` now holds only the current release. A pointer such as
`mcp/WORK.md, "The .pbit limits"` in an older note, test comment or code comment means the section of that name below.

| File | Period | What |
|---|---|---|
| [WORK-2026-10-25.md](WORK-2026-10-25.md) | 25 Oct 2026 | 0.3.1 waves 1 to 6 (the integration branch `integration/0.3.1`) |
| [WORK-2026-10-15-22.md](WORK-2026-10-15-22.md) | 15 to 22 Oct 2026 | 0.3.0 and its R&D, with 0.2.9 rc.22 to rc.24 and 0.2.9.1 that ran alongside |
| [WORK-2026-10-11-14.md](WORK-2026-10-11-14.md) | 11 to 14 Oct 2026 | 0.2.9: the gate, the integration, picker and writer rounds |
| [WORK-2026-10-05-09.md](WORK-2026-10-05-09.md) | 5 to 9 Oct 2026 | rounds 11 to 24, the laptop sittings, the beta page and the home page |
| [WORK-2026-10-01-04.md](WORK-2026-10-01-04.md) | 1 to 4 Oct 2026 | rounds 0 to 10, the first "Where things stand", the first open items and "How to work" |

## The old header (lines 1 to 6 of `mcp/WORK.md`, unchanged)

```
# Current work (the memory between sessions)

Read this first; update it as you go (rules in `mcp/CLAUDE.md`, "Keeping the memory"). **Current (25 Oct): "0.3.1, wave 1" just below; before it (22 Oct): "Night-audit fixes, October"; before it (21 Oct): "T1" (branch `fix/0.3.0-testers`); before it (19 Oct): "R7" (branch `fix/0.3.0-privacy-reread`, no PR yet); then "R6" (branch `fix/0.3.0-approval-disclosure`, PR into release/0.3.0); then "R4" and "R5" (branches `fix/0.3.0-write-safety` and `fix/0.3.0-answers-safety`, PRs into release/0.3.0; R5 merged); then "R3" (branch `fix/0.3.0-waterfall-rtl`, PR into release/0.3.0); then "0.3.0 release branch" (branch `release/0.3.0`, draft PR #74); then "B-146" (branch `feat/0.3-aggregation-guard`, draft PR); before it the sections main added (0.2.9 #67, 0.2.9.1 #70 #71, rc.24 #55, AUD-040 #66, merged); before it "B-155" (merged, PR #50); before it "rc.23" (merged, PR #49); before it "B-145" (branch `ci/parallel-tests`, PR to main); before it "rc.22" (branch `fix/0.2.9-rc22`, PR to main, not merged). 0.3.0 steps 1-2 wait as draft PRs #37 and #38 (their memory is in those branches' WORK.md).** Older: "Picker round 9" just below (branch fix/0.2.9-picker9), then "Picker round 8", then "Integration round 7" (the rc head: picker + writer + design merged), then "Picker fixes from the rc's laptop proof", "Integration round 6", then "Integration round 5", then "Integration round 4: ALL MERGED", then "Integration round 3", then "Integration round 2", then "0.2.9 integration", then "0.2.9 audit fixes (picker)", then parts 2 and 1 (11 Oct).** Older header text: last updated 2026-10-03
by the reviewer: **round 2 is merged (`ada2942`) and the Gulf Calendar pack is merged (`2e6fc3d`)**; main is at
`2e6fc3d`. Next: "Next step" below (the queued builder work). The "Round 2 in progress" section is now history.

```

## Every section, by file

### [WORK-2026-10-25.md](WORK-2026-10-25.md)
- mcp/WORK.md as it stood before A1 capped it (25 Oct, ddae546; its lines 7 to 51, moved unchanged by A1)
- 0.3.1, wave 5: D5 release prep, the docs (25 Oct, builder; branch `docs/0.3.1-sweep` from integration/0.3.1 e8ccecc)
- 0.3.1, wave 4: L6 the DAX function library, ported onto today's code (25 Oct, builder; branch `feat/0.3.1-dax-functions-2` from integration/0.3.1 e8ccecc)
- 0.3.1, wave 4: K1 DataArcus as a plugin next to Microsoft's (25 Oct, builder; branch `feat/0.3.1-plugin-folder` from integration/0.3.1 11df69b)
- 0.3.1, wave 3: C time to first value, the sample project (25 Oct, builder; branch `feat/0.3.1-sample-project` from integration/0.3.1 11df69b)
- 0.3.1, wave 2: X2 one report in English and Arabic from create_report (25 Oct, builder; branch `feat/0.3.1-bilingual-report-2` from integration/0.3.1 ed23620)
- 0.3.1, wave 2: M1 the matrix mirror lab and one engine (25 Oct, builder; branch `feat/0.3.1-matrix-mirror` from integration/0.3.1 ebf1d51)
- 0.3.1, wave 1 (25 Oct, reviewer; the owner: "proceed with 0.3.1 ... 3 builders at a time ... fix the things I saw myself in the MCP")

### [WORK-2026-10-15-22.md](WORK-2026-10-15-22.md)
- Night-audit fixes, October (22 Oct, reviewer; branch `fix/night-audit-oct` from main 361dcc0; one PR, the owner merges)
- T1: the simulated beta testers' fixes, into 0.3.0 (21 Oct, cloud builder; branch `fix/0.3.0-testers` from main 2befc8d = 0.3.0 819f4b5 + #87; no PR yet: the reviewer opens it; never merged by the builder)
- R7: every privacy and safety claim re-read against the code (19 Oct, cloud builder; branch `fix/0.3.0-privacy-reread` from `fix/0.3.0-approval-disclosure` e4ae1cd = R6, PR #79; the reviewer opens the PR into release/0.3.0 after #79 merges; the owner merges)
- R6: the approval page shows everything the click approves; the theme pins its model (19 Oct, cloud builder; branch `fix/0.3.0-approval-disclosure` from `release/0.3.0` c058e87; one PR into release/0.3.0, not merged)
- R4: the rollback never deletes or replaces what is not ours (19 Oct, cloud builder; branch `fix/0.3.0-write-safety` from `release/0.3.0` 1ae53f3; one PR into release/0.3.0, not merged)
- R5: the answers file and memory, safe and truthful (19 Oct, cloud builder; branch `fix/0.3.0-answers-safety` from `release/0.3.0`; one PR into release/0.3.0, not merged)
- R3: a right-to-left waterfall reads from the right (19 Oct, cloud builder; branch `fix/0.3.0-waterfall-rtl` from `release/0.3.0`; one PR into release/0.3.0, not merged)
- 0.3.0 R2: English titles in an Arabic report from an English-named model (19 Oct, cloud builder; branch `fix/0.3.0-arabic-titles` from `release/0.3.0` f5455c9; normal PR #75 to `release/0.3.0`, not merged)
- 0.3.0 release branch (19 Oct, cloud builder; branch `release/0.3.0` from main `d76703c`; DRAFT PR #74 to main, the owner merges after the laptop proof)
- B-146: the aggregation guard (18 Oct, cloud builder; branch `feat/0.3-aggregation-guard` from main `4a837f9`; DRAFT PR, merges after 0.2.9 reaches testers)
- J14: check the exact artifact before writing (19 Oct, cloud builder; branch `feat/0.3-exact-artifact` from main `d76703c`; ONE DRAFT PR, merges only after 0.2.9 testers report)
- 0.2.9.1: two fixes after 0.2.9 shipped (19 Oct, cloud builder; branch `fix/0.2.9.1` from main `d76703c`; one PR, not merged)
- 0.2.9.1, B-173: Arabic table headers, "cut" vs "may be cut", and check_report (19 Oct, cloud builder; branch `fix/0.2.9.1-headers` from main `d76703c`; one PR, not merged)
- J13 redesign step 2: every page, as a copy with allowlisted patches (19 Oct, cloud builder; branch `feat/0.3-redesign-step2` = #62's `feat/0.3-redesign` rebased on main `d76703c`; ONE DRAFT PR, supersedes #62)
- J9 step 1: a redesign that keeps the original (19 Oct, cloud builder; branch `feat/0.3-redesign` from main `f09bf30`; one DRAFT PR, merges only after 0.2.9 reaches testers)
- 0.2.9 release notes (19 Oct, reviewer; branch `release/0.2.9-notes` from main `0dc8144`; one PR, not merged)
- 0.3 J4: story titles + B-130 / B-131 (18 Oct, cloud builder; branch `feat/0.3-story-titles` from main `f09bf30`; draft PR, not merged)
- rc.24: the gaps of the laptop's Desktop release proof of rc.23 (18 Oct, cloud builder; branch `fix/0.2.9-rc24` from main `f09bf30`; one PR, not merged)
- AUD-040: a .pbit also keeps filter, slicer and formatting values (19 Oct, cloud builder; branch `site/aud040-pbit-filter-values` from main `c71ed52`; one PR, not merged)
- 0.3.0 step 6: phone layout (18 Oct, cloud builder; branch `feat/0.3-phone-layout` from main `dcc0f1a`; DRAFT PR, not merged)
- B-148: confirmation memory (0.3 R&D, 18 Oct, cloud builder; branch `feat/0.3-confirm-memory` from main `f09bf30`; one DRAFT PR, merges only after 0.2.9 reaches testers)
- J5 (0.3 R&D): privacy and approval hardening B-152 + B-154 (18 Oct, cloud builder; branch `feat/0.3-approval-hardening` from main `f09bf30`; ONE DRAFT PR, merges only after 0.2.9 reaches testers)
- B-153: partial writes (18 Oct, cloud builder; 0.3 R&D, branch `feat/0.3-partial-writes` from main `f09bf30`; one DRAFT PR, merges only after 0.2.9 reaches testers)
- J7: accessibility of written reports (18 Oct, cloud builder; branch `feat/0.3-accessibility` from main `f09bf30`; ONE DRAFT PR, merges only after 0.2.9 reaches testers)
- J8: the visual gallery's foundation (19 Oct, cloud builder; branch `feat/0.3-gallery-foundation` from main `f09bf30`; DRAFT PR, merges only after 0.2.9 reaches testers)
- J11: label limits keep column charts (19 Oct, cloud builder; branch `feat/0.3-label-limits` from main `f09bf30`; ONE DRAFT PR, merges only after 0.2.9 reaches testers)
- B-155: what a .pbit holds, said exactly (18 Oct, cloud builder; branch `site/pbit-wording` from main `4a837f9`; one PR, not merged)
- rc.23: three fixes from an outside audit of 0.2.9 (18 Oct, cloud builder; branch `fix/0.2.9-rc23` from main `4a837f9`; one PR, not merged)
- 0.3.0 step 2: Check before download / write (18 Oct, cloud builder; branch `feat/0.3.0-check` from `feat/0.3.0-preview` `6eac888`; draft PR stacked on #37, not merged)
- J12: preview fidelity fixes (19 Oct, cloud builder; branch `feat/0.3-preview-fidelity` from `feat/0.3.0-preview` `269983b` = draft PR #37; a draft PR stacked on #37, merged only after 0.2.9 reaches testers)
- 0.3.0 step 1: Preview before Approve (18 Oct, cloud builder; branch `feat/0.3.0-preview` from main `6d88fe4`; draft PR, not merged)
- B-147: format review as "Please confirm" (18 Oct, cloud builder; branch `feat/0.3-format-review` from `hc/b143-unrelated-tables` (draft #48); DRAFT PR)
- B-145: faster CI, no check lost (18 Oct, cloud builder; branch `ci/parallel-tests` from main `5c0ad21`; one PR, not merged)
- rc.22: fixes from the owner's rc.21 Desktop test (18 Oct, cloud builder; branch `fix/0.2.9-rc22` from main `cd6f1b6`; PR to main, not merged)
- 0.3.0 step 6: theme from a logo (18 Oct, cloud builder; branch `feat/0.3-theme-from-logo` from main `dcc0f1a`; DRAFT PR, not merged)
- Health Check 3: precision fixes and "Please confirm" (18 Oct, cloud builder; branch `hc3/precision-and-confirm` from main `6d88fe4`; one PR, not merged)
- Health Check 2, phase 1 "trust" (15 Oct, cloud builder; website engine only; branch `fix/health-check-p1` from main `33ea82d`; not merged, no PR)

### [WORK-2026-10-11-14.md](WORK-2026-10-11-14.md)
- A-01: DataArcus's own approval window (14 Oct, cloud reviewer; branch `fix/0.2.9-approval-window` from the gate `42640c0` = rc.16; not merged)
- Integration round P4, the last code round for 0.2.9 before the owner's test (13 Oct, cloud builder 5; `fix/0.2.9-gate` from `f688ada`; not merged to main, no PR)
- Integration round P2c, the owner's go (13 Oct, cloud builder 5; `fix/0.2.9-gate` from `52ed08b`; not merged to main, no PR)
- Integration round P3b (13 Oct, cloud builder 5; `fix/0.2.9-gate` from `e189551`; not merged to main, no PR)
- Integration round P3 (13 Oct, cloud builder 5; `fix/0.2.9-gate` from `15139ed`; not merged to main, no PR)
- Integration round P2, the owner's polish round (12 Oct, cloud builder 5; `fix/0.2.9-gate` from `f48057f`; not merged to main, no PR): rc.8's base
- Integration round 11 (12 Oct, cloud builder 5; `fix/0.2.9-gate` from `ad5c7f2`; not merged to main, no PR): rc.7's base
- Integration round 10 + 10a, final for 0.2.9 (12 Oct, cloud builder 5; `fix/0.2.9-gate` from `1ed1530`; not merged to main, no PR): rc.6's base
- Picker round 10, final for 0.2.9 (12 Oct, cloud builder 5; branch `fix/0.2.9-picker10` from `0a657a0`; not merged yet)
- Integration round 9b (12 Oct, cloud builder 5; `fix/0.2.9-gate` from `82dae46`; not merged to main, no PR): rc.5's base
- Integration round 9 (12 Oct, cloud builder 5; `fix/0.2.9-gate` from `69ea11c`; not merged to main, no PR): rc.5's base
- Owner's standing go (12 Oct, valid until 0.2.9 is released)
- Picker round 9 (12 Oct, cloud builder 5; branch `fix/0.2.9-picker9` rebased on the gate `69ea11c` (round 8b); not merged, no PR)
- Picker round 8 (12 Oct, cloud builder 5; branch `fix/0.2.9-picker8` from `07ad9bc`; not merged, no PR)
- Integration round 7: picker + writer + design merged (11-12 Oct, cloud builder 5; `fix/0.2.9-gate` from `c83e86d`; not merged to main, no PR)
- Picker fixes from the rc's laptop proof (11 Oct, from 20:33 UTC, cloud builder 5; branch `fix/0.2.9-picker` from `c83e86d`; not merged, no PR)
- Integration round 6: custom visuals merged (11 Oct, from 20:23 UTC, cloud builder 5; `fix/0.2.9-gate`; not merged to main, no PR)
- Integration round 5: Z fixes + main + version sources (11 Oct, from 18:27 UTC, cloud builder 5; `fix/0.2.9-gate`; not merged to main, no PR)
- Integration round 4: ALL MERGED (11 Oct, from 14:41 UTC, cloud builder 5; `fix/0.2.9-gate`; not merged to main, no PR)
- Integration round 3: reader update + design merged (11 Oct, from 14:00 UTC, cloud builder 5; `fix/0.2.9-gate`; not merged, no PR)
- Integration round 2: reader + tools merged (11 Oct, from 12:56 UTC, cloud builder 5; `fix/0.2.9-gate`; not merged, no PR)
- Writer P3 (12 Oct from 22:03 UTC; branch `fix/0.2.9-writer-p3` from `d73a773`; not merged)
- Writer P2, the owner's polish (12 Oct from 19:30 UTC; `fix/0.2.9-writer` reset to the gate `f48057f`; not merged)
- Writer round 11 (12 Oct from 14:11 UTC; `fix/0.2.9-writer` reset to the gate `ad5c7f2`; not merged)
- Writer round 10, final for 0.2.9 (12 Oct from 11:21 UTC; `fix/0.2.9-writer` reset to the gate `1ed1530`; not merged)
- Writer round 9 (12 Oct from 06:02 UTC, cloud builder 11; `fix/0.2.9-writer` from `5f92d45`; not merged)
- Writer round 8 (12 Oct from 01:26 UTC, cloud builder 11; `fix/0.2.9-writer` reset to gate `07ad9bc`; not merged)
- rc1 release blockers, writer (11 Oct from 20:22 UTC, cloud builder 11; `fix/0.2.9-writer` reset to `46037f3`; not merged, no PR)
- 0.2.9 writer block (11 Oct, cloud builder 11; branch `fix/0.2.9-writer` from `fix/0.2.9-gate` `d2300f9`; not merged, no PR)
- 0.2.9 design engine block (11 Oct, cloud builder 10; branch `fix/0.2.9-design` from `fix/0.2.9-gate` `d2300f9`; not merged, no PR)
- 0.2.9 integration (11 Oct, cloud builder 5; `fix/0.2.9-gate` is the integration branch for tonight's laptop proof; not merged, no PR)
- 0.2.9 audit fixes (picker) (11 Oct, cloud builder 5; same branch `fix/0.2.9-gate`; not merged, no PR)
- 0.2.9 part 2: the report writer fixes (11 Oct, cloud builder; same branch `fix/0.2.9-gate`, on top of part 1 `4785367`; not merged, no PR)
- 0.2.9 part 1: the gate, the plan's limits, the user's choices (11 Oct, cloud builder; branch `fix/0.2.9-gate` from main `517e702`; not merged, no PR)

### [WORK-2026-10-05-09.md](WORK-2026-10-05-09.md)
- Home page part A (9 Oct, cloud builder; website only; not merged, no PR)
- The beta page /power-bi-mcp/ (8-9 Oct, cloud builder; website only; not merged, no PR)
- Round 24, B1 and B2 of the laptop's re-proof (8 Oct, cloud builder; website download only; not merged, no PR)
- Round 23, the Arabic table's "Total" word, way 4 (8 Oct, cloud builder; branch `fix/round-23-total` from main `f9f461d`; not merged, no PR)
- Round 22b, the reviewer's code review of `fix/round-22` (7 Oct, cloud builder; branch `fix/round-22b` from `origin/fix/round-22` `10234be`; not merged, no PR)
- Sitting 7-8 Oct (laptop builder; branch `fix/round-22` from `origin/fix/round-21` `9d927a9` with `origin/main` `7cdf252` merged in as `8b7d4d6`; not merged, no PR)
- Round 21, the capabilities lab's "adopt now" (7 Oct, 08:31-09:31 UTC, cloud builder; branch `fix/round-21` from `fix/round-20` `585d107`; not merged)
- Round 20, the owner's "all recommended" (7 Oct, 02:54-03:55 UTC, cloud builder; branch `fix/round-20` from main `11ed33a`; not merged)
- Night sitting 6-7 Oct (laptop builder 2)
- Round 17, the outside review's fixes (2026-10-06, 13:19-14:19 UTC, cloud builder; branch `fix/round-17` from `fix/round-16` `26ba7ef`; item 6 on `feat/check-report-2`; not merged)
- Rounds 15-17, the laptop proof (6 Oct evening; `fix/round-17` at `5cf5d6e`; the owner away)
- Round 17, done (npm test 522 -> 529, golden PASS)
- Round 16, round 13's design leftovers (2026-10-06, 12:06-13:05 UTC, cloud builder; branch `fix/round-16` from `fix/round-15b` `ead6106`; not merged)
- The 1-hour round (2026-10-06, 11:26-12:26 UTC, cloud builder; nothing merged)
- Round 15, the owner's accepted recommendations of rounds 13 and 14 (2026-10-06, cloud builder; branch `fix/round-15` from `fix/round-14` `7be2f22`; not merged)
- Round 14, the owner's late Arabic asks (2026-10-06 morning, cloud builder; branch `fix/round-14` from `origin/fix/round-13` `6f54d6a`; dataarcus-engine `fix/round-14` from its main `51f82c6`; not merged)
- Round 13, the laptop's six-hour Desktop sitting (2026-10-06, laptop builder; branch `fix/round-13` from main `1cef9ac`; not merged)
- Round 12b, small non-severe leftovers (2026-10-05 night, cloud builder; branch `fix/round-12b` from `fix/round-12` `26d9c6c`; not merged)
- Round 12, every small detail fixed in code (2026-10-05 night, cloud builder; branch `fix/round-12` from main `1cef9ac`; not merged)
- Round 11, the long overnight Desktop sitting (2026-10-05, laptop builder; branch `fix/round-11` from main `3803b7a`; dataarcus-engine `release/0.2.6` from its main `d8d3341`; not merged)
- Round 11, small fixes (2026-10-05, cloud; branch `fix/round-11-small` from main `850b0a0`; not merged)
- The .pbit limits (2026-10-05, cloud; branch `fix/pbit-limits` from main `1a92be1`; the outside review's F-02; not merged)

### [WORK-2026-10-01-04.md](WORK-2026-10-01-04.md)
- Where things stand
- Next step: round 10, the overnight sitting (owner's go 2026-10-04: "make sure everything falls in place and looks like a world-class dashboard"; 6 hours from 21:32; branch `fix/round-10` in both repos, from main `8f6d2c3`)
- Next step: round 9, separators on cards, "this Ramadan only", SVG columns (experimental), the capability map (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-9` from main `3af6657`; dataarcus-engine: the same branch name, for the package)
- Next step: round 8, a page filter, the taller header (plan only), the laptop paths (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-8` from main `3564fe7`)
- Next step: round 7, four small fixes from the night audit and the manifest text (owner's go 2026-10-04; TERMINAL ONLY; branch `fix/round-7-audit` from main `ed13112`; dataarcus-engine: the same branch name, the packaging only)
- Round 6 in progress: fields, thousand separators, the header logo, the platform plan (owner's go 2026-10-04; TERMINAL ONLY: no mouse, keyboard, UI Automation, Power BI Desktop, Claude Desktop or screenshots; branch `fix/round-6-fields`, from main `4d86788`)
- Round 5 in progress: the audit's MCP fixes, the agent's guidance, the install experience (owner's go 2026-10-04, in advance for every step; branch `fix/round-5-agent`, from main `a5707fd`; dataarcus-engine branch `fix/round-5-agent`, from its main `f716775`)
- Laptop sitting 2026-10-04 (owner's go, in advance for every part; results branch `test/golden-agent-level`; nothing merged)
- Next step (owner's go 2026-10-02, after reviews by ChatGPT and Gemini): users and a first paid client sooner
- Round 3 in progress: safety before the first beta build (owner's go 2026-10-03, in advance for every step; branch `fix/round-3-safety`, from main `a261f65`)
- Round 4 in progress: large models and missing measures (owner's go 2026-10-03, in advance for every step; branch `fix/round-4-models`, from main `b76bbbf`)
- The Gulf calendar beta cut in progress (owner's go 2026-10-03, in advance for every step; branch `feat/gulf-calendar-mcp-cut`, from main `87d9b33`)
- Next step (queued, approved 2026-10-03; builder; plan first, then go)
- Round 2 (history; merged as `ada2942`) (owner's go 2026-10-03, in advance for every step; branch `fix/round-2-arabic`, from main `bc05275`)
- Round 1 in progress (owner's go 2026-10-03, in advance for every step; branch `fix/round-1-visible`)
- The rounds: what was built, and the plans for rounds 1 and 2 (builder)
- Open items (flagged, need the owner's go before any work)
- How to work (short)
