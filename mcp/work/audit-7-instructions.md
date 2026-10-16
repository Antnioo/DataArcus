# Audit 7: agent instructions and public claims (base d2300f9, integrated fix/0.2.9-gate)

Read-only; lines at d2300f9; claims run through the SDK client (`serverClient`) on the fixtures and made-up inputs, in scratch. 11 tools; instructions 2,479 characters. Nothing fixed. Verified by the builder against the cited lines (approve_plan in plans.mjs). Written on `fix/0.2.9-checks` (this session may push only there).

## History
| Commit | Round | Change to agent text | Patch or enforcement |
|---|---|---|---|
| 4e1bec3 | r1-9 | instructions (1,993 chars), skill, README, PRIVACY | the base |
| 3803b7a | r10 | rule 3: "page filters you pass" | follows the code (pageFilters) |
| 11ed33a | r15-19 | rule 5 `suspiciousNames`; skill step 5 | follows the code (the screen) |
| 56b14f7 | 0.2.9 gate | rule 1 rewritten (plan_layout, approve_plan); rule 1b added (2,590 chars) | **patch**: "pass the approved plan's fields", "never on your own" cover A6-1 to A6-3. 1b repeats O-1, O-8 and O-11, which 030c6f2 already enforces in code |
| 61c1006 | reader | read_report and designLint added; rules 2, 3 and 5 cut to fit the cap ("This Ramadan" dropped) | meaning trimmed to fit the cap (B-12) |
| dc66344 | twin | the skill's twin section, the README row | the instructions never name the twin |
| e316751 | C3 | README and PRIVACY rows for `reports` | the README row went under read_model (A7-13) |
| 817c4cf | O-16 | impact kinds in README and PRIVACY | lint findings carry none (A4-7) |

## Claims checked
| Claim | Where | Code evidence | Verdict | Fix |
|---|---|---|---|---|
| 11 tools, named | README:18-19, 69 | server.mjs:403-1342 (11 registerTool calls) | TRUE | — |
| "The 8 tools", "(8 tools)" | power-bi-mcp/index.html:127-135; beta-page.js:36, 113; index.html:529 | the server has 11 | FALSE at d2300f9 | A7-10 |
| "Reads and writes only inside the one folder"; "links are not followed out" | PRIVACY:21, 89-90, 95-97; README:16, 49; server.mjs:4 | model.mjs:193: the `.pbip` route's `beside` path is not passed through `real()` | FALSE for reads (writes stay inside) | A7-1 |
| "Nothing is ever overwritten or deleted" | server.mjs:38; PRIVACY:101-112 | `writeNew` with wx; no unlink | TRUE (but a failed write can leave a half report: A6-4) | A6-4 |
| "Never data values"; "structure only" | server.mjs:38; SKILL:141 | read_report returns titles and text-box text (read-report.mjs:188-189, 234; reproduced `text "Sales overview"`), and the twin returns every text | PARTLY | A7-7 |
| "No network" | PRIVACY:15-20; check_report description | check-report.mjs:179 `skipSchema: true`; the validator's https paths run only when `!skipSchema` (its dist 2338, 3117) | TRUE | — |
| "A reply that says no or not yet is refused" | approve_plan description (server.mjs:1344) | plans.mjs:25-26, 52; reproduced as approved: "Wait, don't go yet", "No, I don't want to go ahead", "I said no", "nein, stop" | FALSE | A7-3 |
| "A plan is good for 2 hours" | server.mjs:1344; README:41 | plans.mjs:37, 53: a second approve resets `approvedAt`; reproduced still alive at 3.5 s with a TTL of 1 s | FALSE | A7-3 |
| The plan is what gets written (pinned inputs, used once, only the user approves) | rule 1; server.mjs:1344 | A6-1, A6-2, A6-3 | FALSE; the text works around the code | A6-1..3 |
| "Without one it writes nothing and proposes one" | rule 1 (server.mjs:29) | create_report: plans.mjs:60 throws an error and proposes nothing (reproduced) | PARTLY | A7-11 |
| Limits: slicers 3, KPI 6, table 8, filters 8, svg 4/6, names 80, text 400 | SKILL:32; README:40 | server.mjs:48, 567-603, 819 | TRUE, except that suggest_fields allows 8 KPIs (416; reproduced 8 picks) | A7-5 |
| `page.chosenBy` | server.mjs:1202; README:40 | the answer key is `pageSize.chosenBy` (1243-1244, 1285) | FALSE (key name) | A7-5 |
| Supported visuals list | rule 6; SKILL:135 | the enum has `matrix` (A6-16) | PARTLY | A6-16 |
| check_report: 3 impact kinds on each finding | README:43; PRIVACY:42 | check-report.mjs:226 sets impact on `all` only; lint findings at 247-248 get none | PARTLY | A4-7 |
| read_report returns screened titles, and PRIVACY says so | PRIVACY:40 | read-report.mjs:17, 188; the screen runs on the raw text (A5-5); field roles are returned raw (A5-1) | PARTLY | A5-1, A5-5 |
| Hidden characters written as code points by every tool | PRIVACY:44 | boundFields returns a raw U+202E (A6-6) | PARTLY | A6-6 |
| "DataArcus adds no filter and no measure" | SKILL:21 | pageFilters (585), the No-data measure on by default (603), SVG measures, the blank-category visual filter (1285), the month-start measure | FALSE | A7-6 |
| "It checks the report offline with Microsoft's validator" | power-bi-mcp:158 | create_report never calls checkReport (it runs only at 1188) | PARTLY | A7-10 |
| Annotations: 5 read, 5 add, approve writes nothing | README:51 | READS/ADDS (server.mjs:51); plan_layout writes no file (formatsAnswer with `write=false`, 1227) | TRUE; approve_plan's `idempotentHint: true` is false in effect (A7-3) | A7-3 |
| Also TRUE: website "writes only inside" (writes land at `dirname(m.folder)`); no descriptions or DAX in answers (fixture probe); check_report titles off (247, R5); Arabic font warning, brand exact, 1920 x 1080 default (reproduced) | index.html:693; PRIVACY:54; generate_theme description | as listed | TRUE | — |
| "Known gaps: None open"; "Checked against 0.2.8 (843c8dc)" | PRIVACY:3, 134-135 | A1-1, A6-1..3, A5-1, A6-6 are open | FALSE | A7-2 |

## Findings
| ID | Block | file:line | Evidence | Why it matters | Root fix: what, where, test (block) | Sev | Known as |
|---|---|---|---|---|---|---|---|
| A7-1 | instructions ← reading | PRIVACY:21, 89-90, 95-97; README:16, 49; server.mjs:4; CLAUDE.md:38 | model.mjs:193 `beside` not passed through `real()` | false public safety promise | Fix A1-1 (every path loadModel picks through `real()`); the text promises no more until then. Test: the `.pbip` link test (reading) | high | A1-1 (claim side new) |
| A7-2 | instructions | PRIVACY:3, 134-135 | "Checked against 0.2.8 (DataArcus `843c8dc`)"; "Known gaps: None open" | hides open gaps | "Known gaps" lists each open ID; header names the checked version. Test: header version = package.json (instructions) | high | new |
| A7-3 | MCP tools (gate) | plans.mjs:25-26, 37, 52-53; server.mjs:1344, 1349 | reproduced: 4 refusals approved; re-approval keeps a plan alive past its TTL | the gate's description overstates it | approve(): refuse an already-approved plan; TTL from proposal; refuse a hold/negation anywhere in the reply (fallback after A6-3's elicitation). Test: the 4 replies refused, re-approval refused, expiry (tools) | high | A6-3 related; new |
| A7-4 | instructions | server.mjs:27-38; test.mjs:1146 (`< 2500`) vs test-0.2.9c.mjs:221 (`<= 2500`) | 2,479 chars; 1b repeats O-1/O-8/O-11, now in code (030c6f2; 1243); rule 6 repeats LIMITS; rules 2-4 repeat descriptions; rule 1 works around A6-1..3 | no room; meaning already cut (61c1006) | Keep cross-tool rules only: drop 1b's code-enforced items; rule 6 from `LIMITS.visuals`; after A6-1..3, rule 1 = "show the plan, wait for go". One cap constant for both tests. Test: ≤ 2,200 chars; rule 6 = LIMITS (instructions) | med | B-12 |
| A7-5 | instructions/tools contract | server.mjs:416 vs 48, 567; server.mjs:1202 and README:40 vs 1243-1244 | suggest_fields allows `kpis` up to 8 (reproduced 8 picks) while plan_layout refuses more than 6; the descriptions name `page.chosenBy` but the key is `pageSize.chosenBy` | the agent follows a key or limit that doesn't exist | suggest_fields takes `max(LIMITS.kpiCards)`. Test: every backticked answer key in a description or the README exists in a recorded answer of that tool (tools) | low | A6-16 class |
| A7-6 | skill | SKILL:20-22 vs SKILL:46; server.mjs:585, 603, 1285 | "DataArcus adds no filter and no measure" | false statement to the user about a card | Reword: "adds nothing to the model; the report may add report-level measures and filters, all listed in the plan". Test: phrase gone (instructions) | med | new |
| A7-7 | instructions | server.mjs:38; SKILL:141 | "structure only (names, types, formats)" while read_report and the twin return titles, text boxes and button text | users told report text never goes to the AI | "names, types, formats, and a report's short screened titles and texts; never data values". Test: when read_report is registered, the instructions mention titles (instructions) | med | owner decision on R5 |
| A7-8 | instructions | server.mjs:1344; README:41; PRIVACY:101-112; server.mjs:27-38 | approve_plan's list of plan sources leaves out create_arabic_twin; PRIVACY section 4 does not list the twin's writes or its month script; the instructions never name the twin | a writing tool missing from gate/privacy texts | Build the sources sentence from `Plans.ALLOWS`; add the twin to PRIVACY section 4. Test: every tool in ALLOWS is named in approve_plan's description and in PRIVACY section 4 (instructions) | med | new |
| A7-9 | instructions (custom visuals) | none in INSTRUCTIONS or SKILL (Existing report, :68-81); check_report description (server.mjs:1181) | the only signals are a count in notChecked (check-report.mjs:218) and the twin's `cannot` | a redesign drops or misjudges them silently | See the custom-visuals section below. Test: the skill names read_report's custom-visual output, and a report with a custom visual never gets "nothing found" alone (instructions + A4-3) | med | A5-10, A5-13, A5-14 |
| A7-10 | website | power-bi-mcp/index.html:127-135, 158; beta-page.js:36, 113; index.html:529 | "8 tools"; "checks the report offline" | public page ≠ 0.2.9 code | List 11 tools (EN+AR); say "check_report checks any report offline", or create_report runs checkReport on its output (tools). Test: test-site-config tool count = listTools (website) | med | new |
| A7-11 | instructions | server.mjs:29 vs plans.mjs:60 | create_report without planId returns an error and no proposal | a wrong expectation | Wording: "create_report: get the id from plan_layout". Test: instructions vs a no-plan call (instructions) | low | new |
| A7-12 | instructions (untrusted) | server.mjs:1323, 1344; rule 5 (server.mjs:34) | twin says only "in a model" but returns report texts; approve_plan returns report/folder-derived names, no sentence; rule 5 names `suspiciousNames` only (read_report/twin: `withheld`; check_report: `INSTRUCTION_TEXT`) | uneven warnings | One `REPORT_UNTRUSTED` on read_report, check_report, twin, approve_plan; one flag key (A1-13's screen). Test: every name-returning tool has it (instructions) | low | A1-13, T5 |
| A7-13 | docs | README:35; SKILL:8; CLAUDE.md:34-36, 47-48 | the read_model row describes check_model_health's `reports.counted` (read_model returns `existingReports`, reproduced); the skill lists 6 tools; CLAUDE.md lists 8 and calls the calendar generator browser-only | stale texts | Fix the texts. Test: the README's tool rows and the skill's tool list equal listTools (instructions) | low | new |

## Custom visuals in the instructions
Today: nothing in INSTRUCTIONS or the skill's Existing report section. read_report lists them (server.mjs:1192); check_report only counts them in `notChecked` (check-report.mjs:218), not in its description; the twin lists them under `cannot` (SKILL:87); create_report can't write one. Unsaid: they are not size/format-checked, may raise a sign-in (B-21), are dropped by a create_report redesign, and their names are untrusted.

Once describe/replace exist (A5-10 source/package, A5-13 object names, A5-14 native mapping, A6 "describe/replace"), the skill (and one description sentence, not the capped instructions) should say: describe each custom visual before a redesign and tell the user its source and what DataArcus can't check; never replace one unasked; a replacement is its own plan (mapping, lost features, a new "<name> native" copy, original untouched) needing the user's go; a licensed visual may ask for sign-in.

## Already-known items at d2300f9
| Item | Status |
|---|---|
| B-02 | open by design: the client's prompt is the only human hook until A6-3; README should say so |
| B-10 | open, unverifiable (no manifest in the repo) |
| B-12 | open (2,479/2,500) → A7-4 |
| B-13 | fixed (11 tools; test.mjs:12-19 imports the 0.2.9 and twin suites) |
| R5 | fixed (check-report.mjs:247) |
| R4 / A5-1, A5-5 | open |
| A1-1 | open → A7-1 |
| A6-1, A6-2, A6-3 | open; rule 1 works around them (A7-4) |
| A6-6, A6-16, A4-7, A5-11 | open |

## Reuse
Partly. The instructions are host-neutral ("the assistant") but inline in server.mjs, and each rule lives in four places (INSTRUCTIONS, descriptions, SKILL, README/PRIVACY) with no single source, hence the drift (A7-5, A7-8, A7-13). The skill depends on Claude's skill format and named tools (`powerbi-desktop` bridge, `ListLocalInstances`). Fix: one agent-text module building the visual list, limits and gate sentences from LIMITS/ALLOWS, and doc-vs-listTools tests.

## Bias
- Examples are Gulf-calendar and golden-task shaped: "Ramadan only", "This Ramadan", `Calendar[Is Ramadan]`/`Calendar[Hijri Year]` (the generator's own columns; server.mjs:585), "logistics", "sales".
- English/Arabic only: approval words (plans.mjs:25-26; "non", "nein" approve), screens (A1-13), glossary (A6-18).
- Hosts: the website requires Claude Desktop; README/PRIVACY name Desktop and Code; Cowork never. Instructions neutral except "turn".
- Nothing portfolio-tuned in the agent texts.

## Seen, not in scope
- check_model_health and add_gulf_calendar declare `idempotentHint: false`, but a repeated call names the same file (server.mjs:81-89).
- Per server.mjs:26 a desktop extension carries no skill, so Desktop users miss the skill's screenshot/DAX consent rules (SKILL:55-64).
- SKILL:131 says the gulfCalendar section comes "with a country"; it also appears without one when the model has Hijri columns.
