## Summary
B-414 rest: the two website suites that still read an off-main commit from git now read pinned saved files.
- **Approval:** reviewer brief HK2 (0.3.3); owner D-1110-05 "1 yes yes yes, 2 yes, 3 yes, 5 yes" (B-414 now), D-1104-12 (one shared place).
- **Base:** origin/integration/0.3.3 at ad50f1d7; branch fix/0.3.3-hk2.
- **Scope:** scripts/tests/sp6.mjs, scripts/tests/sp29.mjs, one shared helper scripts/tests/base-engine.mjs, two pinned files under mcp/fixtures/hk1/, mcp/WORK.md, this note.
- **Expected checks:** sp6 4 checks and sp29 8 checks (run-all output, unchanged); `node scripts/check-modules.mjs --strict`.
- **Resume:** code done and proven in a main-only clone; the one open step is the CI run (see the last line).

## Measured: what each suite reads
| suite | reads from git (old) | HK1 copy | sha256 of the commit's bytes | after |
|---|---|---|---|---|
| sp6 | 04a9922:assets/js/design-engine.min.js (54348 bytes) | design-engine.js only (unminified, sha 3898745f..., not the same bytes) | c6521186...bb7a44 | new pinned mcp/fixtures/hk1/sp6/assets/js/design-engine.min.js, same sha |
| sp29 | 39c46bb:assets/js/design-engine.min.js (41504 bytes) | design-engine.js only (sha 4cf6cd44..., not the same bytes) | 64b824c9...e13f4 | new pinned mcp/fixtures/hk1/sp29/assets/js/design-engine.min.js, same sha |
Each suite reads that one file; the brief's guess that HK1's copies already held it was wrong (they hold the source, the pages serve the .min.js).

## Before -> after
Counting rule: the last PASS/FAIL line of each suite's own output file (scratchpad).
| suite | red on 0c7143b (origin/main, main-only clone, old suite) | before (ad50f1d7) | after, in the main-only clone | after, this tree |
|---|---|---|---|---|
| sp6 | FAIL 1 check: base engine (04a9922) could not be read | PASS 4 | PASS 4 | PASS 4 (final run) |
| sp29 | FAIL 1 check: base engine (39c46bb) could not be read | PASS 8 | PASS 8 | PASS 8 (final run) |
red on 0c7143b first. Check counts unchanged (4 and 8).
Proof commands: `git clone --single-branch --branch main <origin> <scratch>/mainclone` (git cat-file says 04a9922 and 39c46bb are not valid objects there), node_modules linked, the old suites copied in -> `node scripts/tests/run-all.mjs sp6 sp29` FAIL as above; then the new sp6, sp29, base-engine.mjs and the two fixture folders copied in -> PASS sp6 4 checks, PASS sp29 8 checks.
`grep -n "04a9922\|39c46bb" scripts/tests/*.mjs`: only comments, the pinned label and the error text; no git read. The only `git show` is in scripts/tests/base-engine.mjs, behind SP6_BASE / SP29_BASE (opt-in).
Gates: `node scripts/check-modules.mjs --strict` PASS 1223 checks; check-agent-memory PASS 506; `npm run lint` exit 0.

## CHANGELOG line
none (test-only change).

## Decisions I made
- One shared helper scripts/tests/base-engine.mjs (D-1104-12): reads the saved bytes, checks them against a pinned SHA-256 (a wrong or CRLF-changed file fails loudly), the env override reads git only when set.
- Saved the .min.js beside HK1's copies (mcp/fixtures/hk1/<suite>/assets/js/), and added both to .gitattributes as -text (HK1 added nothing; a CRLF checkout would change the hash).
- mcp/WORK.md was at 3183 of 3200 characters: shortened the TC2, CL2 entries to fit the HK2 line.

## For the owner
none

## Risky changes
none (test-only; no product code, page or public text changed; fixtures are byte copies of old commits, 54348 and 41504 bytes).

## For the laptop
nothing on Desktop.

## Seen, not in scope
- mcp/test-0.3.2-sp27.mjs names 39c46bb in a comment only (line 4); no git read.
- Old notes (SP6, SP29, SP4, DD1C, PV2, AN1, SP27) still say "git show <base>" as history.

## Lessons for the reviewer
- The brief assumed HK1's sp6 and sp29 copies held the needed bytes; they hold design-engine.js, the suites need design-engine.min.js. Measure the path before reusing.

Written: 2026-11-10T13:49Z
CI green: https://github.com/Antnioo/DataArcus/actions/runs/42828338418 on 146fbc49 (success; written 2026-11-10T14:08Z)
