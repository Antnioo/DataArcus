## Summary
B-417: decided by the reviewer 9 Nov: keep. The six base-commit suites are done.
- **Approval:** reviewer brief HK1 (0.3.3, Haiku job), 9 Nov; owner D-1109-09 (run every check, record what is unsure).
- **Base:** origin/integration/0.3.3 at f3c1b7e1 (unchanged at merge time); branch fix/0.3.3-hk1.
- **Scope:** six suites (glass-tables, dd2c, dd2o, dd2p, sp29, sp6) read saved copies of their base commits from mcp/fixtures/hk1/<suite>/ instead of git show or git ls-tree. Not done: B-417 (claims date).
- **Expected checks:** glass-tables 113, dd2c 48, dd2o 89, dd2p 112, sp29 21, sp6 13: unchanged. claims 721: not touched.
- **Resume:** B-417 decided by the reviewer 9 Nov: keep the guide's 26 October date (only the price file was refreshed on 2 Nov; moving the guide's date unread would be untrue); claims test untouched.

## Before -> after
Counting rule: the last PASS/FAIL line of each suite's own output file (saved in the session scratchpad).
| suite | red on a5757d0 (origin/main, shallow, without the six commits) | before (f3c1b7e1 + npm ci) | after (5e6eef6) | shallow clone of fix/0.3.3-hk1 |
|---|---|---|---|---|
| glass-tables | FAIL 1 of 109 | PASS 113 | PASS 113 | PASS 113 |
| dd2c | FAIL 29 of 48 | PASS 48 | PASS 48 | PASS 48 |
| dd2o | FAIL 63 of 89 | PASS 89 | PASS 89 | PASS 89 |
| dd2p | FAIL 57 of 112 | PASS 112 | PASS 112 | PASS 112 |
| sp29 | FAIL 1 of 21 | PASS 21 | PASS 21 | PASS 21 |
| sp6 | FAIL 1 of 13 | PASS 13 | PASS 13 | PASS 13 |
| claims (not changed) | PASS 752 (main's file) | PASS 721 | not re-run (file untouched) | n/a |

red on a5757d0 first: the six failed on origin/main's shallow clone before any change (the first run of the old suites failed only with ERR_MODULE_NOT_FOUND until npm ci, so that baseline was discarded and repeated).

Area runs (after the last code commit 5e6eef6): `node run-tests.mjs report safety twin` -> "run-tests: 150 suites passed (report, safety, twin)", exit 0.
Lint: `npm run lint` exit 0 (after the last edit).
Gates: check-modules PASS 1200 checks; check-contracts PASS 717; check-literal-requires OK; check-result-lines PASS 230; check-agent-memory PASS 464; deny-scan could not run here (it needs DENY_TERMS, a CI secret).
Fixtures: 106 saved files, 2.6 MB (`du -sh mcp/fixtures/hk1`), copies of base bytes; no new module, no mcp/lib helper copy.

## CHANGELOG line
none (test-only change; no product, page or public text changed).

## Decisions I made
- Saved base files under mcp/fixtures/hk1/<suite>/<repo path>. The brief named mcp/test-fixtures/, which does not exist; the repo keeps its fixtures in mcp/fixtures/ (flat names), so I used that folder.
- Removed the env overrides (GL2_BASE, DD2C_BASE, DD2O_BASE, DD2P_BASE, SP29_BASE, SP6_BASE): a saved file has no commit to choose.
- dd2p also read `git ls-tree` on its base tree (not in the brief); it now lists the saved tree instead.
- Left mcp/test-0.3.0-claims.mjs untouched (B-417 held, see "For the owner").
- Installed mcp/ and the root node_modules with npm ci (lint and the suites need them).
- Commit trailers: CLAUDE.md's "Co-Authored-By: Claude <noreply@anthropic.com>" (no model name), not the reminder's model line.
- Re-recorded no fixture (no output changed), so no "Changed on purpose" entry.
- mcp/WORK.md: no HK1 line. The file is at its 3,200-character cap (my line made it 3,231), so this job's memory is mcp/work/HK1.md only.

## For the owner
none (B-417 decided by the reviewer 9 Nov: keep the guide's 26 October date; the question is closed).

## Risky changes
- The merge gate names mcp/fixtures/hk1/dd2c/mcp/lib/plans.mjs under "the approval step". It is a byte-for-byte saved copy of commit 128285e's mcp/lib/plans.mjs, used only as text by test-0.3.2-dd2c.mjs (its `const canon =` line is read and run). It is never imported as a module and never shipped. The approval-step text in it is the old file's own comment (lines 1-6: the 0.2.9 gate inside the tools, "no tool writes a file without a plan id that was proposed by a tool and then approved with approve_plan", and who approves: the person, by a click in DataArcus's own approval window). mcp/fixtures/hk1/dd2c/mcp/lib/artifact.mjs is the same kind of copy (the other dd2c old copy).
- The six suites read saved files with the same bytes git show returned (the green runs prove the same checks and numbers); no product code, network, process or file-writing change (temp folders are still os.tmpdir()).

## For the laptop
`cd mcp && npm ci`, then `npm test -- report safety twin`. Nothing on Desktop.

## Seen, not in scope
- deny-scan needs the DENY_TERMS secret (CI only); it was not run here.
- main's claims suite has 752 checks and this branch has 721: main has newer lines, so the merge will differ there.
- The shallow-clone proof used origin/main at a5757d0 fetched by hand, not the CI runner.

## Lessons for the reviewer
- The brief said plan first: I measured before the plan commit, then committed the plan note alone (7da58f77), then the code (5e6eef6). The plan's numbers were measured before the change.
- The brief's six suites missed one git read: dd2p's ls-tree of its base tree.
- A clone with no node_modules fails the suites with ERR_MODULE_NOT_FOUND before any git read; npm ci in mcp and in the root is the first step (lint needs the root one).
- B-417 cannot be done as written: the guide's date and its UAE figures come from different reads (see "For the owner").

Written: 2026-11-09T19:56Z

CI green: https://github.com/Antnioo/DataArcus/actions/runs/42688224957 on 7506eeeb (run 1592, success; written 2026-11-09T20:40Z)
