# SN1 (0.3.3): close the safe, small "Seen, not in scope" items

## Summary
- **Approval:** the owner D-1111-17 (11 Nov): "go you have all night to finish everything we got so far also don't overlook the seen not in scope"; the reviewer hub's brief SN1.
- **Base:** `feat/0.3.3-sn1` from `origin/integration/0.3.3` at 2960587c. Pushed only this branch; never merged, no PR.
- **Scope:** `mcp/tests.json`, `mcp/run-tests.mjs` (the duplicate-key check), `.github/workflows/tests.yml`, `scripts/tests/run-all.mjs`, `mcp/lib/report-inputs.mjs`, plan_layout's text, the docs item 5 lists, `.claude/settings.json` and `scripts/agent-stop-check.mjs` if item 6 needs it, the MICROSOFT-WATCH file, their tests, `mcp/WORK.md`, this note.
- **Expected checks:** `node scripts/check-modules.mjs --strict`; each touched area's run; `npm run lint` 0; tk1 size (cap 61,000) before and after; then CI on the branch.
- **Resume:** the state is the last line of this note.

## Plan
Seven items, each its own commit, red first where code: 1 tests.json duplicates + base (test in scripts/test-result-lines.mjs through registryProblems);
2 website shards: install --with-deps only when needed (measure per shard first); 3 run-all.mjs one line per suite;
4 report-inputs text and planFields text, tools/list not larger; 5 laptop-flow docs; 6 Stop hook cause; 7 the watch line.
## Before -> after (each its own commit)
1. **Closed** (commit "SN1 item 1"): `mcp/tests.json` has one list per key, `base` is `origin/integration/0.3.3`. The later list of each
   pair stayed (it is the one JSON.parse kept, so nothing the runner read changed). `duplicateKeys()` in `mcp/run-tests.mjs`;
   `registryProblems` names a duplicate key, so `check-result-lines` (a CI step) fails on one. **Red on 2960587c first** (the real file: 4 keys
   named), green after; 3 new checks in `scripts/test-result-lines.mjs` (8 -> 11).
2. **Closed** (commit "SN1 item 2"): the website shards run `npx playwright-core install chromium` (no apt), the launch proves it, and
   `install-deps chromium` (apt) runs only when that launch fails. Measured BEFORE, step "Install Chromium", website-suites, green runs
   43051896471, 43052560843, 43066836292: 13, 19, 20, 13, 27, 51, 83 s, and 663 s and 890 s (two shards that waited on the mirror;
   the failures 16:16-16:42Z were the same wait ending in "Temporary failure resolving"). AFTER, run 43076330799 and the one before it:
   "Install Chromium" 0 to 1 s, launch 0 to 1 s, the apt step skipped on all 3 shards (the runner already has Chromium's packages).
   Red first: the adapter's new check failed on the old workflow, green after (44 -> 45 checks).
3. **Closed** (commit "SN1 item 3"): `run-all.mjs` prints `done  <name> PASS|FAIL <s>s (k of N)` as each suite ends; not a result line
   (`mcp/test-results.mjs` RESULT needs PASS/FAIL/SKIP first), the final lines unchanged. Red first (no done lines), green after.
4. **Closed** (commit "SN1 item 4"): `CREATE_REPORT_INPUTS` no longer defines the 14 entries no tool takes from it (path, planId, design, layout,
   kpis, focus, tables, filters, header, page, dir, fields, displayNames, lang); `PLAN_ONLY_KEYS` keeps the refusal's "the approved plan holds
   it" for them. planFields' text no longer says "create_report's fields shape". tools/list **58,837 -> 58,805** (tk1 cap 61,000; tk1 15 checks
   pass). New suite `sn1` (20 checks), red on 2960587c first (T1, T3, T4). **Not closed, one sentence:** `unknownKeys`' "Fields go in
   create_report's own "fields" input" is pinned byte for byte by fn1j (fixtures/fn1j-pins.json, recorded on 0.3.2): see "For the owner" 1.
5. **Closed** (commit "SN1 item 5"): `mcp/docs/OWNER-RULES.md` (the builder scripts folder, "the full run once at the end", the prompt checklist),
   `mcp/docs/TESTS.md` (the builder's loop: CI on the branch, no full local run), `mcp/docs/LAPTOP.md` (a first line: the owner's, builders
   never use it), `mcp/CLAUDE.md` (one link text). The adapter's pin on TESTS.md's old wording now pins the new (red on the old
   TESTS.md first). Left as history: `mcp/research/POWERBI-HIDDEN-CAPABILITIES.md` ("the laptop builder", a dated research note) and the `mcp/lab/*.md`
   steps (the owner's laptop checks, correctly written).
6. **Closed as far as the cause can be measured** (commit "SN1 item 6"): cause found in our files. Claude Code runs a hook in the session's
   working directory; a builder's Bash had done `cd mcp` (this very session's directory reads `mcp/` at times). From `mcp/`,
   `node scripts/agent-stop-check.mjs` is "Cannot find module", exit 1, and only exit 2 blocks. A found script also used the session's folder as the repo
   and looked for `mcp/work/<CODE>.md` under `mcp/`: "note could not be read: allowed". Fix: the command is `node "${CLAUDE_PROJECT_DIR:-.}/scripts/agent-stop-check.mjs"`
   and the script's default root is the repo it lives in. Four new checks (25 -> 29), 3 red on 2960587c. **Not seen in a live Stop event**, and I
   could not read the two builders' transcripts: this is the cause reproduced, not proven to be theirs (see "For the owner" 2).
7. **Closed** (commit "SN1 item 7"): `mcp/research/MICROSOFT-WATCH.md`, a section "Facts read from Learn"; I read the Learn page again today.

## Decisions I made
- Item 1: the later list of each duplicate stays (JSON's rule), so the picks of `--affected` are unchanged. The duplicate check lives in `registryProblems` (so the CI step
  `check-result-lines` runs it), not in a new suite.
- Item 2: no `--with-deps` on the website shards at all (even on a cache miss): the browser download is the only network step, and apt is asked only after a failed launch.
  `coverage.yml` keeps `--with-deps` (the scope names tests.yml; it is one job, not on every push).
- Item 4: the dead entries were removed, not reworded (a text nobody can see cannot be made true by rewording; the keys are kept for the refusal text).
- Item 6: `${CLAUDE_PROJECT_DIR:-.}`: with the variable missing, the old behaviour from the repo root still works.

## For the owner
1. Re-record `fixtures/fn1j-pins.json` (`FN1J_RECORD=1 node test-0.3.2-fn1j.mjs`) when you want `unknownKeys`' sentence to say "plan_layout's planFields"? That file freezes plan_layout's answers from before the 0.3.2 split;
   two cases (C05, H15) carry the sentence. Re-recording needs your word, and test.mjs line 1407 only checks the lowercase word "fields".
2. The Stop hook: does the Claude Code in your cloud sessions set `CLAUDE_PROJECT_DIR` for hooks? The docs say so; I could not see a live Stop event. A builder that ends its turn early again after this commit is the signal to look at the session's hook log.

## Risky changes
- **`.github/workflows/tests.yml`, the website-suites job:** the Chromium install no longer asks Ubuntu's mirror (apt) on every run. What: `install chromium` (browser only), then
  the launch step (`continue-on-error`), then `install-deps chromium` only if that launch failed (then a second launch, which fails the job). Why: apt failed on every shard on 11 Nov.
  Limit: a runner image without Chromium's packages launches nothing, then apt runs once (as before). Measured on this branch: 0 to 1 s instead of 13 to 890 s.
- **`.claude/settings.json`** (every builder session's Stop hook): command path now by `CLAUDE_PROJECT_DIR`. Tested on made-up repos with a shell, not in a live Stop event.

## Not closed from the source notes (the reason)
- Owned by others tonight (the brief): check_report, lineage.mjs, impact.mjs, like-for-like.mjs, health-confirm.js, field-catalog.js, gulf-*.js, design-metrics.js, the layout engine:
  IX1 2, 3, 4 (like-for-like, field-catalog, flip-cards, dax-functions are those or in the banned list), 5 (gulf-dates.js), 7 (read-report is not mine; a cut name); OX1 "picker's reach rule vs lineage graph";
  HX1 1-5 (model-health-engine, dax-reference-parser, lineage); HX2 3-5 (lineage, impact); FB3 1-4 (geometry, REFLOW_KEEP, topN: layout engine, "For the owner" in FB3).
- Needs a decision, not a safe small change: FB3 6 (the full local MCP run took over an hour: a fact, now moot since LR3 says no full local run); IX1 6 (the brief says 243 suites, tests.json lists 248: the count is
  the brief's, not a file); TL1 `planSources()` "(its own proposal)" x4 (generated and pinned: fn1j / approval pins), the UNTRUSTED sentence on 7 tools (pinned by cx2/rc23 texts: a cap of tk1 is not at risk, so left),
  `scripts-measure-tokens.mjs` measures characters (no tokenizer is a dependency: a new dependency is the owner's), TOOLS.md size (a docs rewrite), the server instructions' repeated rules (at their cap, A1).
- HX2 1: tools/list budget per tool: now 58,805 of 61,000 after TL1 and this job; no code needed. TR1: the validator's columnWidth check (RD1 X2) and the twin preview's "grow to fit" (twin and approval page: other builders' files).
- DQ1's other hand-written DAX quoters (assets/js: model-health-tmdl, gulf-measures, measure-builder, svg-kpi-compiler, health-view, field-catalog): several are in the banned list and each is its own risk.

## Seen, not in scope
- `coverage.yml` still runs `--with-deps` (one job, same apt risk; its install step is pinned by the adapter's workflow check).
- The website `run-all.mjs` `SLOW` and `SHARDS` lists carry measured seconds from 18 Oct (main 5c0ad21); the shards are no longer balanced the same (shard 1 median 749 s, shard 2 448 s on 10 Nov, TR1).
- `scripts/test-results-adapter.mjs` now holds 45 checks, and runs the website runner on two Node-only suites (about 3 s): fine, but it is the only test that starts a browser outside the website jobs.

## Lessons for the reviewer
- A frozen pin of answers (fn1j) makes a one-sentence text fix a re-record: the brief's "make the text true" met a byte-for-byte guard (CI run 43073433013, red on exactly that sentence). Say in a brief which texts are pinned.
- Hooks run in the session's folder: any hook command in `.claude/settings.json` must name its script by `CLAUDE_PROJECT_DIR`; and `cd` in a builder's Bash persists.

- **CI green: https://github.com/Antnioo/DataArcus/actions/runs/43078488062 on e7ed0ad860069fe18453d2ee14268e8c0d483315** (third run: the first two were red on the fn1j/test.mjs sentence and on one unused import, both fixed above). State at 2026-11-11T18:44Z: DONE.
