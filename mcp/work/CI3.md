# CI3 (0.3.3): the flaky CI checks that slow every release

## Summary
- **Approval:** the owner D-1112-06 (12 Nov, "okk i agree ..."): CI3 after RL33; the reviewer hub's brief "CI3"
  (I-1112-1700, I-1112-1703). D-1104-19 (macOS off the integration path, required before main) kept exactly.
- **Base:** `fix/0.3.3-ci3` from `origin/integration/0.3.3` at 9ee1b0ce. Push it, and `check/0.3.3-ci3` (the same
  commits, only for the macOS proof runs: a manual run on fix/* skips macOS, as CI2 did); never merge, no PR.
- **Scope:** `scripts/tests/sp35.mjs` (its fixed waits), `scripts/tests/lib.mjs` (a shared wait, if one is needed
  twice), `.github/workflows/tests.yml` (the macOS jobs' grouping; a retried log upload; the "What's new" step's
  name), `mcp/docs/TESTS.md` if it states the grouping, this note, one `mcp/WORK.md` line. No product code; no
  recorded value of sp35's fixture changes (R-10).
- **Expected checks:** (written before the fix)
  - sp35 under load (CPU throttled 16x plus 8 busy loops): red on 9ee1b0ce first ("E1/A1 ... ripples: 1 -> 0",
    CI's line), then green 5 of 5 under the same load after; green unloaded; 38 checks before and after.
  - macOS: no job near 40 minutes. Before (from the logs): job "0 2" 2405 s, cancelled (run 43267699060 att. 1),
    1188 s on a normal runner (run 43316573737). After: each job one plan shard, the longest about 1100 s normal.
  - The missing shard: its cause named from job 131249962878's log; the upload retried once.
  - `node scripts/check-modules.mjs --strict` PASS; lint 0; check-agent-memory, check-result-lines PASS; tests.yml
    green on Linux, Windows (fix/) and macOS (check/), each job read.
- **Resume:** DONE (CI green line under Progress). The reviewer: read runs 43332884820 and 43332888170, then merge.

## Plan
1. This note, pushed.
2. sp35: every fixed wait replaced by a wait for the state the step's check reads (the ripple counted by a
   MutationObserver, the page's scroll ended through lib.mjs's `settle`, the menu's collapse ended, the counters
   at their targets); red under load on the base first, then 5 of 5 green under the same load.
3. tests.yml: macOS one job per plan shard (5 jobs); the parts' log upload tried a second time after a failed one;
   the "What's new in 0.3.0" step renamed to what it checks.
4. Checks, merge origin/integration/0.3.3 once, the last runs (fix/ and check/), the green line.

## Progress
- 2026-11-12T23:07Z: plan written; base reproduced red under load (sp35, 16x throttled: E1 and A1 "ripples: 1 -> 0").
- 2026-11-12T23:34Z: code pushed (9a8676de): sp35's waits, lib.mjs's shared wait, macOS 5 jobs, the upload's second try, the step's name; the load proof and CI running.
- 2026-11-12T23:58Z: base red 3 of 3 more under the same load (E1, A1 "ripples: 1 -> 0" each time; run 2 also "A3 a
  #contact arrival (ar): opened smooth: false -> true" and the A4 navbar values below). The A3 race was still in my
  version, so the arrival's 2.5 s timer is now held until its step (5947cf47); the fix's load runs restarted on it.
- 2026-11-13T00:25Z: DONE. The fix green 5 of 5 under load; CI on 5947cf47 read job by job (below).

CI green: https://github.com/Antnioo/DataArcus/actions/runs/43332884820 on 5947cf47 (Linux and Windows, 19 jobs, macOS skipped on fix/ by design)
macOS: https://github.com/Antnioo/DataArcus/actions/runs/43332888170 on 5947cf47 (check/0.3.3-ci3): the 5 macOS jobs and
mcp-macos green; Linux and Windows green too, except website shard 2: sp29, a suite this job did not touch (below).

## Before -> after
| What | Before | After | Source |
|---|---|---|---|
| sp35 under load (16x CPU throttle + 8 busy loops) | red 4 of 4 on 9ee1b0ce | green 5 of 5 on 5947cf47 | the runs' result lines (loadproof.log, fixproof.log) |
| sp35 unloaded | 38 checks | 38 checks, 136 s | run-all result lines |
| sp35's fixed waits | 24 (100 to 3000 ms) and 150 ms after every step | 0 | the file at 9ee1b0ce, grep |
| macOS jobs | 3 (0 2 / 1 3 / 4) | 5 (one plan shard each) | tests.yml |
| longest macOS job, normal runner | 1514 s ("1 3", run 43316573737) | 860 s (shard 4, run 43332888170) | job start/end times |
| macOS job on the slow runner | "0 2": 2405 s, cancelled (run 43267699060 att. 1) | one shard: shard 0 alone took 1689 s there | job log group times |
| macOS jobs after (run 43332888170) | | 761, 655, 700, 844, 860 s; mutation 411 s | job start/end, "PASS  mutation" line |
| a failed log upload | the job red, a re-run (job 131249962878) | one more try after 20 s, `overwrite: true` | tests.yml |

What varied, measured (R-9):
- **ripple** (CI: "A1 ... a ripple on the submit button ripples: 1 -> 0", run 43237079137): the ripple is removed by a
  600 ms timer (site-navigation.js:290); the read came after "2 frames + 150 ms", which under load took longer. Red
  on 9ee1b0ce first, 4 of 4 under load. Now a MutationObserver counts the ripples the step added and the read waits
  for the removal timer, so the count is 1 at any speed; "the ripple gone" waits for that timer, not 700 ms.
- **navbar after a form's focus** (CI: "A2 ... a form first focus, twice navbar: class change"): the focus scrolls
  the page smoothly; the navbar's class changes at scrollY > 20 (site-navigation.js:111). Now the read waits until the
  page holds still for 5 frames with no work left (`quiet`).
- **#contact arrival** ("A3 opened smooth: false -> true", base run 2 under load): the class comes from a 2.5 s timer
  after load (site-navigation.js:182), raced by ready(). Held by the test until the "settled" step.
- **components** (CI: "blog.html 1440px ... opacity 0.14864"): RL33 fixed it at its cause (the fade waited for);
  its bound was 4 s, now WAIT (30 s): still a wait for the state, not a time.

Every timing change in sp35 and why the new wait cannot race:
- after each step: `markWork` then `quiet` (lib.mjs): the page's timers of up to 3 s and the frames it asked for since
  the mark, its finite animations, and the page still for 5 frames. Counted, so a slow runner only waits longer.
  Timers over 3 s (the form result hidden after 6 s, the article's 30 s) are not waited for: the reads come before.
- counters (2600 ms): waits until every `#about [data-count]` reads its target and suffix.
- toggler twice (700 ms each): `quiet` after each click (Bootstrap's collapse timer and transition).
- form sends (400 ms): waits until the submit button is enabled again (the post answered, site-forms.js finally).
- phone menu (500, 600 ms), blog search (1700, 100, 400 ms), the facade (300), consent (100 to 300), the AI
  referral (100), the language flip (100), the article (200, 100): removed; `quiet` waits for their timers,
  transitions and scroll.
- the article session has a fake clock (Playwright replaces the timers), so it is not tracked; it waits for its
  scroll with lib.mjs's `settle`, as before.

## CHANGELOG line
None: tests and CI only; no user sees a change.

## Decisions I made
- **One shared wait in `scripts/tests/lib.mjs` (`trackWork`, `markWork`, `quiet`).** RL33's helix fix had no helper
  to reuse (inline waits in build-page.mjs); the shared one is new, in the shared test helpers (R-12). Only sp35
  uses it today. lib.mjs has no row in mcp/docs/MODULES.md (scripts/tests is not listed there); check-modules --strict PASS.
- **The scroll is judged by frames, not the `__scrolling` flag.** An instant scroll leaves the flag set (measured: 5 s
  after a submit click the flag was still true, the page still), so `settle` paid its 3 s fallback each time and a
  6 s page clock ran out first (E5-A7 read the result hidden on my first try).
- **E4 and A4: 8 recorded values changed, on purpose (R-10).** After "an inside link" the old read came 600 ms into a
  3 s smooth scroll; the next step's instant scroll to the top landed at 200 px, not 0 (measured: scrollY 200 after
  scrollTo(0) at 600 ms; 0 after 4 s), so the record says "scrolled". Now the scroll ends first and the top is 0:
  `navbar` loses "scrolled" in E4 and A4 steps 3-6 ("open again", "an outside click", "open again", "Escape"). Found by
  recording with the new waits and diffing: exactly these 8 values differ, nothing else. The base under load gave
  the same A4 values red (base run 2): the record held a race.
- **The #contact arrival's 2.5 s timer is held by the test** (an init script defers that one timer; the "settled"
  step releases it), so "opened" is always read inside the hold, as the record says.
- **macOS: 5 jobs, not a split of the mutation suite.** The mutation suite took 1006 s on one runner and 397 and 327 s on
  others; the whole shard was slow there (shard 2's MCP part 466 s vs 252 s), so it is the runner, not the suite.
  One shard per job halves the worst job. timeout-minutes stays 40.
- **The upload retry on all four parts jobs**, not only macOS: the ENOTFOUND is the runner's, any job can meet it.
- **check/0.3.3-ci3 pushed** (the same commits) for the macOS run, as CI2 did: a manual run on fix/* skips macOS.
- **sp35's diff message**: `String(JSON.stringify(...))`, so a step missing on one side is reported, not a crash.

## For the owner
none

## For the reviewer
- The macOS proof is run 43332888170 on check/0.3.3-ci3 (same sha 5947cf47); delete that branch after the merge.
- That run's website shard 2 was red in sp29 (not touched here): "generator EN: the preview, now vs the base engine
  (39c46bb): saved: the preview differs (43865 vs 43868 bytes)" (job 131582311894); the same sha's shard 2 was green
  on run 43332884820. Not rerun (R-7); listed below as a job.

## Risky changes
- tests.yml: macOS 5 jobs per run where it runs (was 3): 2 more chances to wait for a runner; every one acquired
  on run 43332888170.

## For the laptop
none

## Seen, not in scope
- sp29 compares a preview screenshot by bytes and was red once under CI load (43865 vs 43868 bytes, run 43332888170) | route: job | size: M | why: the same pattern as sp35; a capture probably taken while something still draws, not yet measured
- The E3 and A3 "opened" step and other first reads still follow ready()'s readings, not `quiet` | route: drop | why: ready() waits for the page's own setup; no red seen
- build-page.mjs's helix checks keep inline waits (RL33) that could call `quiet` | route: backlog | size: S | why: green, one place is better

## Lessons for the reviewer
- A characterisation record can hold a race: when a new wait changes recorded values, record with it and diff; the
  diff names the values, the base under load shows they were never stable.
- The page's `__scrolling` flag stays set after an instant scroll; a wait built on it pays settle's 3 s fallback.
