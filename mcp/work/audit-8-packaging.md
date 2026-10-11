# Audit 8: packaging (private packaging folder at its HEAD; public base d2300f9)

Read-only. Verified by the builder (the manifest lists 8 tools at 0.2.8; the build list names none of the new files). Written on `fix/0.2.9-checks` (this session may push only there). Private files are cited by path:line only and described in my own words. The private clone is **shallow:
one commit** (its HEAD, 11 Oct 2026), so the history below comes from its PACKAGING.md and the release records, not
from git. One run: the build's own staging function (`stageBundle` from `packaging/build.mjs`) against d2300f9,
writing only to a scratch folder. `--check 0.2.8` cannot run in this clone (the recorded packaging commit is not in
the shallow history).

## History

| When | Build / change | Source | Fix kind |
|---|---|---|---|
| 4 Oct | 0.2.0: hand-kept list of 18 files, unsigned | PACKAGING.md:129-149 | — |
| 4-5 Oct | Release records, `--check`; lib folder taken whole; engines from the require graph | PACKAGING.md:151-168, build.mjs:55-64 | root (partly) |
| 5-6 Oct | 0.2.6: gulf-calendar, arabic-names added to the list by hand | build.test.mjs:13-16 | symptom |
| 7 Oct | 0.2.7: X-01 schemas, X-02 version/tool parity, X-03 Node range, X-07 smoke test of the packed file, X-08 licence version; code reviews 1-8 and 1-6 | PACKAGING.md:282-377 | root |
| 7 Oct | Validator moved to production dependencies (check_report runs it) | build.mjs:73-75 | right block; caused B-24 |
| 8 Oct | 0.2.8: six packaging tests red until slots.mjs was added to the hand list | PACKAGING.md:520-540 | **symptom patch** (cause: A8-1) |
| public WORK.md | Round 23: the package must carry slots.mjs; 0.2.9 integration: 11 tools; no 0.2.9 packaging step | mcp/WORK.md:552, 7-21 | — |

No wrong-block patch. The 0.2.8 change fixed the symptom, not the cause (a hand list checked against files the build
already finds itself).

## Findings

| ID | block | file:line | evidence | why it matters | root fix: what, where, test (block) | severity | known as |
|---|---|---|---|---|---|---|---|
| A8-1 | build | packaging/build.mjs:38-51, 165-178 | Libs and engines are found automatically, then checked against a hand list. **Run at d2300f9: staging fails**, naming report-mirror.js, arabic-twin, design-lint, plan-lint, plans, read-report as unexpected | 0.2.9 cannot be packaged. Fails closed, but every new lib stops a release (third time) | build.mjs: expected = hand-kept packaging/server/package/skill files + `engineFiles` + `schemaFiles`. Test (packaging): build.test stages d2300f9 green; a made-up commit with a new lib and engine stages with no build.mjs edit | break | B-18 (open) |
| A8-2 | manifest | packaging/manifest.json:27-62, 7 | 8 tools listed; the server at d2300f9 registers 11 (adds read_report, create_arabic_twin, approve_plan); long description names 8 | Archive smoke fails on parity (smoke.mjs:51); bypassed, Desktop would show 8 of 11 and no gate tool on the install screen | Add the 3 tools (one sentence each) and name them in the long description; build.mjs compares `serverTools` at the commit with the manifest before packing. Test (packaging): build.test.mjs:119 with DATAARCUS_COMMIT=d2300f9; the fixed 8 at :242 taken from the server | break | B-10 (open) |
| A8-3 | smoke | packaging/smoke.mjs:35-44 | create_report is called with no planId; no recipe for the 3 new tools. At d2300f9 create_report refuses without an approved plan (server.mjs:612) | With A8-1 and A8-2 fixed, the build still fails at the smoke test | smoke.mjs recipes: read_report on the fixture .pbip; plan_layout with planFields from suggest_fields; approve_plan with a fixed test reply; create_report with that id; create_arabic_twin proposed then approved. Test (packaging): an 11-tool archive passes; a list without approve_plan fails, named | break | new |
| A8-4 | manifest | packaging/manifest.json:37-38, 41-42, 57-58 | check_model_health, generate_theme, add_gulf_calendar described as writing; at d2300f9 they write only after approve_plan | The install screen describes writes the gate blocks | Reword those three to "after the plan is approved". Test (packaging): every manifest tool whose server schema has planId mentions approval | med | new |
| A8-5 | smoke | packaging/smoke.mjs:153, 179 | Only "not an error" is checked; the log says a file was written for the three write tools even when they returned a proposal | A pass does not prove the bundle writes a report; 0.2.8's notes already saw a reported write with no new file | Each write recipe asserts its named file exists; the summary reads the answer. Test (packaging): a write tool answering ok with no file fails the verdict | high | B-25 (related) |
| A8-6 | deps | public mcp/package-lock.json; build.mjs:269-273 | The validator brings playwright, playwright-core, powerbi-client, desktop bridge as production packages; only its CLI and preview use them, not the index check-report imports (about 21 MB locally) | Size and attack surface: a browser driver in an offline extension | build.mjs: after `npm ci`, remove a named unused list (beside DEV_ONLY), record it; smoke (check_report offline) proves nothing needed went. Test (packaging): none in staged node_modules, smoke green | med | B-24 (open) |
| A8-7 | plugin | packaging/plugin/.claude-plugin/plugin.json:41-50; PACKAGING.md:148 | The plugin points at mcp/server.mjs under its root, but the folder holds only two JSON files; the build only stamps the version (build.mjs:316); assembly is by hand, with no smoke or record | The Claude Code route is not reproducible and never tested; needs Node on PATH, unchecked | build.mjs writes dist/plugin (staged tree + skill + .claude-plugin), records it and smoke-tests it as plugin.json starts it. Test (packaging): dist/plugin has server and skill; tools match the server | high | new |
| A8-8 | versions | public mcp/package.json:3 (0.1.0); manifest.json:5, plugin.json:18 (0.2.8); public PRIVACY.md:3 (0.2.8) | Three sources disagree; the build reconciles only inside the bundle (build.mjs:173, 249) | Run from source the server says 0.1.0; PRIVACY names the wrong version | Public mcp/package.json is the one version; the build reads it and refuses a differing `--version` or manifest. Test (packaging): mismatch refused; (public) PRIVACY version = package.json | low | A7-2 (open) |
| A8-9 | deps | public mcp/package.json:20 | SDK declared as a caret range; lock pins 1.32.1, `npm ci` follows the lock | Plan item 14 met in practice; a regenerated lock could move it | Exact version in package.json. Test (public): declared = locked | low | new |
| A8-10 | build | packaging/build.mjs:58-62 | Engine discovery matches one quote style and one path form | A double-quoted or computed require is left out silently | `engineFiles` refuses any unresolved relative require/import. Test (packaging): a double-quoted made-up engine is found or refused | low | new |
| A8-11 | record | packaging/build.mjs:19, 309 | Test counts in the record are typed in by the builder; 0.2.8 recorded a run not made at that build | Looks like proof, is a claim | Mark the field as vouched with the commit tested, or run build.test in the build. Test (packaging): record needs that commit | low | new |
| A8-12 | build | packaging/build.mjs:269, 293; smoke.mjs:20 | `npm ci` without `--ignore-scripts`; mcpb via `npx --yes` (version pinned, no lock) | No install script today (lockfile checked); a future one runs on the build machine | `--ignore-scripts`; mcpb as a locked dev dependency of packaging. Test (packaging): npm arguments include it | low | new |

Safety otherwise sound: working folder required, **no default** (manifest.json:81-86, guarded by build.test.mjs:39;
plugin.json:33-39 the same); offline at runtime, proven by the smoke preload that refuses the network
(smoke.mjs:68-77; child processes not covered); no postinstall in the lockfile; unsigned by the owner's decision
(build.mjs:18, PACKAGING.md:266-280), SHA-256 for testers; the bundle holds only public sources plus manifest, licence,
icon; the record refuses user paths and secrets (build.mjs:213-224). File permissions: not set (Windows target).

## Require graph vs build list

Grepped require/import at d2300f9; identical to `engineFiles` output.

| Needed at d2300f9 | Loaded by | In hand list (build.mjs:44-49) | Staged |
|---|---|---|---|
| lib/read-report.mjs | server, check-report, design-lint, plan-lint, arabic-twin | no | refused (A8-1) |
| lib/design-lint.mjs, plan-lint.mjs, plans.mjs, arabic-twin.mjs | check-report/plan-lint; server | no | refused |
| assets/js/report-mirror.js | arabic-twin | no | refused |
| pbip-export.js, report-rules.js | model, arabic-twin, report-rules; check-report | yes | yes |
| gulf-health.js, gulf-dates.js | model, gulf-calendar, calendar-generator | yes | yes |
| design-engine (calm palette G7), pbip-bind, model-health-engine/tmdl, tmdl-model, svg-kpi-compiler, calendar-generator | model, design, gulf-calendar | yes | yes |
| the other 7 libs | server | yes | yes |
| mcp/schemas (113 incl. LICENSE, SOURCE.md); skill | check-report; the AI | whole; yes | yes |
| sdk 1.32.1, zod 4.6.5, ajv 8.20.0, ajv-formats 3.0.1, validator 0.4.0 | server, check-report | lockfile | 108 prod packages |

## Already-known items
- **B-10** open: confirmed (A8-2); A7 could not see the private manifest.
- **B-18** open: confirmed and wider: report-mirror.js plus five libs (A8-1).
- **B-24** open: confirmed with names and entry points (A8-6).
- **A7-2** open: part of A8-8. **B-25**: invisible to the smoke test (A8-5).

## Reuse
**Another version: yes** (`--commit`, `--version`) if no lib, engine or tool was added. **Another server: no**: the
hand list, manifest tools, smoke recipes, fixture name (smoke.mjs:21), instruction words checked (build.mjs:290),
empty-folder answer (:289) and mcp/assets layout (:53, :61) are DataArcus-specific. `--check` needs full private history.

## Bias
- One made-up fixture; any non-error answer passes. Not tuned to the owner's models, but blind to missing writes (A8-5).
- The build's live check calls only read_model on an empty folder.
- Drift tests default to origin/main (build.test.mjs:123, 162, 183), not the commit packaged.
- Fixed counts (26 files :21, 8 tools :242) raised by hand each release.

## Seen, not in scope
- Header comment and test plan still say 8 tools (build.mjs:13-14; PACKAGING.md:232).
- Build tests rewrite committed packaging files and restore them in `finally` (build.test.mjs:347-366).
- No privacy-policy field in the manifest.
- Approvals live in memory (public plans.mjs:32-36): a restart forgets them.
