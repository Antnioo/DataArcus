# R7: every privacy and safety claim, against the code (19 Oct 2026, cloud builder)

Branch `fix/0.3.0-privacy-reread` from `fix/0.3.0-approval-disclosure` e4ae1cd (R6, PR #79, = release/0.3.0 with R4,
R5 and R6). One row per sentence of `mcp/PRIVACY.md` (as it read on e4ae1cd), then the other files' claims.
True = the code does what the sentence says. Reworded = the sentence was overstated or untrue, and the new wording is
in the Action column (fixed by wording only). Needs code = only a code change makes it true: listed at the end, not
changed. Evidence names `file:function` (or the test that pins it).

## mcp/PRIVACY.md

### Header and "In one paragraph"
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| H1 | Checked against 0.3.0 (the release candidate; the build writes its version, source says 0.1.0) | true | `mcp/package.json` "version": "0.1.0"; `test-release-text.mjs` (header vs CHANGELOG) | kept |
| H2 | Each 0.3 change updated this page for what it changed | true | WORK.md sections J5, B-148, B-153, R4, R5, R6 each list their PRIVACY lines | kept |
| H3 | The whole page was last read against the code on 2026-10-11, with Microsoft's validator 0.4.0 | stale | the last full read is this one | reworded: "2026-10-19 (R7 ... `mcp/work/R7-claims.md`), with the version of Microsoft's validator that `mcp/package.json` pins" (one place for every version) |
| H4 | If the code changes, this page is checked again before the next release | true (a process) | this re-read; CLAUDE.md "Before a release" | kept |
| H5 | What is not true yet is listed under "Known gaps" | was incomplete | read_report's short titles were not listed | a Known-gaps row added |
| P1 | The MCP runs on your own computer and sends nothing anywhere by itself | true | no network module in `server.mjs`, `lib/*` or the engines it loads (grep: only `approval-window.mjs` imports `node:http`, a 127.0.0.1 server); packaging smoke test (dataarcus-engine) refuses outgoing connections | kept |
| P2 | Everything a DataArcus tool returns is read by the AI app | true | MCP stdio (`server.mjs` StdioServerTransport) | kept |
| P3 | With Claude, it goes to Anthropic under your Claude account's terms | true (how MCP works) | - | kept |
| P4 | DataArcus returns your model's structure ... never the data in your tables | overstated | `lib/read-report.mjs:safeText` returns a title/text box ≤120 characters that does not read like an instruction (cut at 60); `lib/arabic-twin.mjs` returns reader texts ≤200 | reworded: added "From a report, it also returns the short texts a person typed there ... screened for instructions and length only, so a short title that holds a figure or a name is returned as it is" |

### 1. The MCP runs on your machine
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| 1.1 | A Node.js program the AI app starts; talks only to that app over stdio | true | `server.mjs` (StdioServerTransport, last lines) | kept |
| 1.2 | Connects to nothing outside your computer; no account, telemetry or analytics | true | grep of `server.mjs`, `lib/`, `assets/js/` engines loaded (pbip-bind, model-health-engine, pbip-export, report-mirror, model-health-tmdl, svg-kpi-compiler, gulf-health, design-engine, confirm-memory): no fetch/http/net/dns | kept |
| 1.3 | One local page at http://127.0.0.1:<port> while a plan waits | true | `lib/approval-window.mjs:open` (`s.listen(0, '127.0.0.1')`) | kept |
| 1.4 | Nothing outside can reach that address; the page loads nothing from the internet; the click goes only to DataArcus | true | `approval-window.mjs:page` (inline CSS, no external src; CSP default-src 'none'); form posts to the same origin | kept |
| 1.5 | Each link is for one plan, takes one click, stops when the plan expires (2 hours) or the app closes | true | `approval-window.mjs` (secret per plan, `bySecret`, `close`); `lib/plans.mjs` TTL_DEFAULT 2 h | kept |
| 1.6 | No network call in server/lib/engines; smoke test refuses connections | true | as 1.2 | kept |
| 1.7 | `https://` addresses in written files are schema names; nothing downloaded | true | `assets/js/pbip-export.js` writes `$schema` strings only | kept |
| 1.8 | `check_report` runs Microsoft's validator offline, in process; schemas from `mcp/schemas/` | true | `lib/check-report.mjs:checkReport` (`runReportValidation({ skipSchema: true })`, `schemaCheck` with `SCHEMAS`) | kept |
| 1.9 | The validator's schema download is switched off (`skipSchema`) and never called | true | same | kept |
| 1.10 | It reads and writes files only inside one working folder | overstated | `lib/artifact.mjs:validate` writes the J14 check copy to `os.tmpdir()/dataarcus-check-*` (removed in `finally`); `approval-window.mjs:launch` starts the default browser | reworded: "your files only inside one working folder ... The one write outside it: `plan_layout`'s check copy ... deleted as soon as the check ends. To open the approval window it starts your default browser" |
| 1.11 | It writes one line to the app's local log when it starts | true, incomplete | `server.mjs` last line: `console.error(...)` "ready. Folder: <full ROOT>" or "started, but no tool will work: ..."; no other console/stderr write in `server.mjs`/`lib` | reworded: names the full path and the other start line; "It logs nothing else" |

### 2. Whatever a tool returns goes to the AI app
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| 2.1 | Every tool answer is sent to the AI app; DataArcus controls what it puts in answers | true | MCP | kept |
| 2.2 | `read_model` row | true | `server.mjs` read_model → `lib/model.mjs:summary`, `lib/scope.mjs:largeSummary` (caps: 15 per folder, 100 tables) | kept |
| 2.3 | `suggest_fields` row | true | `server.mjs` suggest_fields; `pbip-bind.js` (old/test/backup names listed) | kept |
| 2.4 | `check_model_health` row (findings name objects; data source kinds without server or file names; DAX of a question not returned; fix scripts as paths) | true | `model-health-engine.js` (HARDCODED_PATH etc. push `{ obj: q.name }` only), `server.mjs` check_model_health (fixScriptFile path, `pleaseConfirm` without DAX: `test.mjs` / `test-confirm-memory.mjs`) | kept |
| 2.5 | `add_gulf_calendar` row; never the DAX, never data values | true | `lib/gulf-calendar.mjs:addGulfCalendar` (script written, path returned) | kept |
| 2.6 | `generate_theme` row | true | `server.mjs` generate_theme, `lib/read-report.mjs:existingTheme` (hex only) | kept |
| 2.7 | `approve_plan` row; one-time secret never returned to the AI | true | `server.mjs` approve_plan answer has no URL; `approval-window.mjs` keeps `secret` in `windows` | kept |
| 2.8 | `plan_layout` row, except the redesign part | true | `server.mjs` plan_layout, `lib/plan-lint.mjs`, `lib/artifact.mjs:checkArtifact` (counts, rule ids, paths, digest) | kept |
| 2.9 | `plan_layout` `redesign`: "its visuals by their names, types, places, sizes and short titles" | untrue since R6 | `lib/redesign.mjs:planRedesign` `shown` = visual id, type, fields, place: no title text (R6, F08) | reworded: "by their names (ids), types, fields, places and sizes, never their title text (0.3.0 R6 ...)" |
| 2.10 | redesign: files copied as bytes; filter values, slicer selections, bookmark states never read into an answer | true | `redesign.mjs` keptAsIs.how, `buildCopy`/`verifyCopy` | kept |
| 2.11 | `create_report` row | true | `server.mjs` create_report answer keys (modelNotes, kpiCards, boundFields, numberFormats, pageFilters, svgMeasures: DAX length only) | kept |
| 2.12 | `read_report`: "its screened title and text box text (shown when short and plain; longer than 120 characters or reading like an instruction: withheld, with its length)" | overstated | `read-report.mjs:safeText`: instruction-like → WITHHELD (no length); >120 → withheld with length; else `cleanName` (cut at 60). The screen is for instructions and length only: a short title holding a value or a name is returned | reworded: "its title and text box text as a person typed them, cut at 60 characters (screened for instructions and length only ... otherwise returned as it is, so a short title holding a figure, a customer's or a person's name goes to the AI app)". Needs code N1 |
| 2.13 | `read_report`: "Slicer selections and bookmark states are read ... never returned; it reads no data" | overstated | the report's files it reads hold saved filter/slicer values (`read-report.mjs:inventory` reads them, never returns them) | reworded: "it reads none of your tables' data" |
| 2.14 | `read_report`: It writes nothing | true | READS annotation; `read-report.mjs` has no write | kept |
| 2.15 | `create_arabic_twin` row (texts capped at 200, instruction-like withheld; never data values, filter values or slicer selections) | true | `lib/arabic-twin.mjs:planTwin` | kept |
| 2.16 | `check_report` row; never the report's own text | true | `check-report.mjs` (texts counted for `langOf`, never returned); test plants values (`test.mjs` check_report part) | kept |
| 2.17 | hiddenCharacters: names with an invisible character, up to 20 | true | `server.mjs:hiddenOf` (line ~188) | kept |
| 2.18 | A report name given with such characters is written without them | true | `server.mjs` create_report name via `visible()` | kept |
| 2.19 | Error messages are sent too | true | `server.mjs:safe` | kept |
| 2.20 | No answer or error holds a full local path; folder by last name; home as `~` | true | `lib/model.mjs:shownPath`, `lib/write-io.mjs:shownWritePath`, `lib/answer.mjs` | kept |
| 2.21 | "The full paths stay in the server's local log on your computer" | untrue | the only log line is the start line (full working-folder path); errors are not logged | reworded: "The full path of the working folder is written once, in the start line ...; no other path is logged" |

### 3. Metadata only
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| 3.1 | No DataArcus tool returns the data in your tables to Claude | true | every answer path above; data files refused (3.4) | kept |
| 3.2 | It reads files to check and fingerprint them: "only the model's definition files ... and the report's definition files" | incomplete | also read: the report's StaticResources images/themes and private custom visual files (`native-copy.mjs`, `arabic-twin.mjs`, `redesign.mjs` copy them; `read-report.mjs:reportPrint` hashes them), files you name (`files.mjs:readUserFile`), the answers file (`answers.mjs:readAnswers`) | reworded: lists all four; "Whole files are read and hashed (SHA-256): a plan pins the model and the files it is made from by these hashes, and a write after one of them changed is refused" (`model.mjs` print, `read-report.mjs:reportPrint`, `artifact.mjs:modelPrintOf`, `plans.mjs`) |
| 3.3 | Never opens the data cache, never connects to Desktop or data sources, runs no queries | true | no such code; `model.mjs` walks only `definition/*.tmdl` / model.bim | kept |
| 3.4 | Refuses a .pbix and data files by name before opening, and a template whose parts list shows a data cache | true | `model.mjs` (PBIX_WHY, the data-file extension refusal, `DataModel` without `DataModelSchema`) | kept |
| 3.5 | Enter data / DATATABLE values: read in the definition files, never decoded, never returned | true, one exception | `model.mjs` inflates only the .pbit zip parts; nothing decodes Power Query `Binary.FromText`; but `assets/js/gulf-health.js` reads the DataArcus generator's own DATATABLE (Hijri month starts) and names a differing Ramadan/Eid start | sentence kept (pinned by test-rc23 F3); the exception added after it |
| 3.6 | Values you type (page filter) are written and repeated in the answer | true | `server.mjs` create_report `pageFilters`, `reportNotes` | kept |
| 3.7 | Names are information too ("Salaries 2026") | true | - | kept; a sentence added on a report's typed texts (read_report ≤120 cut at 60; twin ≤200; screen for instructions and length only) |
| 3.8 | Expressions read for the health check, not returned; only names; descriptions not returned | true | `server.mjs` check_model_health answer; `test.mjs` round 5 checks | kept |
| 3.9 | The twin's title-measure exception: fixed texts only; any other shape named, never quoted | true | `arabic-twin.mjs` titleMeasures (`notTranslated` by measure name) | kept |
| 3.10 | Fix scripts are files, the text never in an answer; until 2026-10-04 it was | true | `server.mjs` check_model_health (`fixScriptFile`) | kept |
| 3.11 | An AI app that reads files could open the script; instructions say not to | true | SKILL.md "Fix scripts ... don't read the file" | kept |
| 3.12 | `add_gulf_calendar` reads the model only to refuse a taken name, find relateTo columns, see a DataArcus calendar | true | `lib/gulf-calendar.mjs` | kept |
| 3.13 | It writes the generator's DAX (from your inputs, never your data) and relationships as a script; never writes into the model | true | `gulf-calendar.mjs`, `calendar-generator.js` | kept |
| 3.14 | create_report writes Power BI's files next to the model; they hold field names, positions, styling | true | `pbip-export.js` | kept |
| 3.15 | Page filters: values from the request ... "DataArcus reads no data to find them" | overstated wording (R6 left it) | `server.mjs` create_report pageFilters: values from the call, type checked against the column (or taken from the values) | reworded: "DataArcus never looks them up (it checks only their type against the column's)" |
| 3.16 | They are also in the answer | true | `pageFilters` / `reportNotes` | kept |
| 3.17 | KPI card number format from the model's format string | true | `server.mjs` numberFormats.cards | kept |
| 3.18 | SVG columns: report measure in reportExtensions.json, computed by Power BI; values never pass through DataArcus; model not changed | true | `svg-kpi-compiler.js`, `pbip-export.js` reportExtensions | kept |
| 3.19 | Data values only when you ask: other tools; the skill asks each time | true (an instruction) | SKILL.md Rules ("needs the user's yes first") | kept |

### 4. Your files
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| 4.0 | Heading "Your files: never overwritten" | untrue | `answers.mjs:writeAnswers` replaces its own answers file (rename over it) | reworded: "new files only (DataArcus's own answers file aside)" |
| 4.1 | Every path resolved inside DATAARCUS_ROOT; outside refused | true | `model.mjs:inside`, `real` | kept |
| 4.2 | No working folder: every tool refuses; never falls back | true | `model.mjs:rootProblem`, `server.mjs:safe` | kept |
| 4.3 | A missing folder is created when its parent exists | true | `model.mjs:prepareRoot` | kept |
| 4.4 | Links out of the folder refused for reading and writing; real path checked | true | `model.mjs:real`, `realIn`; `test.mjs` round 3 | kept |
| 4.5 | The same for paths a tool picks itself; links never followed when searching | true | `model.mjs` (.pbip target via `realIn`; walk skips links) | kept |
| 4.6 | "What these checks are not": not a defence against another program changing the folder | true, incomplete | R4/R5 residuals: between `write-io.mjs:removeOurs`'s lstat and its unlink, and between `writeAnswers`'s last identity check and its rename | reworded: adds "in the instant between DataArcus's last check of a name and its write or its clean-up of that name (a single call), a swap by another program can still win" |
| 4.7 | A model folder as working folder: reading works; create_report refuses | true | `server.mjs` create_report (`input(!!m.folder ...)`), `model.mjs` | kept |
| 4.8 | Nothing is overwritten, except the answers file; a failed write removes what that call created | true, incomplete | `write-io.mjs:removeOurs` names `left.ours` / `left.foreign` | reworded: "... and names anything it could not remove" |
| 4.9 | create_report: free name, refuses if any file exists, never changes the model or a report | true | `files.mjs:writeTree` (exclusive mkdir, 'wx'), `report-names.mjs:takenNames` | kept |
| 4.10 | generate_theme: new file, free name (name-2, name-3) | true | `files.mjs:freeFile` | kept |
| 4.11 | create_arabic_twin: new "<name> AR", refuses a taken name, original only read; title measures in the twin; month script new file | true | `arabic-twin.mjs:writeTwin`, `planTwin` | kept |
| 4.12 | Twin and native copy copy only the report's own files; other files never read, hashed or copied; the plan names them | true | `read-report.mjs:strictFiles` (`isReportFile`, `left`) | kept |
| 4.13 | Scripts as new files, free names; the same script named again; no script in a model folder | true | `server.mjs` check_model_health / `gulf-calendar.mjs` (`freeFile`, same-content lookup) | kept |
| 4.14 | The answers file: name, written after an approved plan; "It holds hashes and your answers" ... "No name, no DAX text, no data" | overstated (audit F10) | `confirm-memory.js:record` = { questionHash, objectHash, answer, evidenceSignature, at (ISO date and time), by: 'user' }; plain SHA-256 (no salt: `sha256(JSON.stringify(['b148-object', name]))`); the file name is `<model>.dataarcus-answers.json` (`answers.mjs:answersName`). R5 already hashes the question id and object name (the brief's "questionId and object in plain text" was the pre-R5 shape, now read through `upgrade()` and kept hashed) | reworded: names the plain-text fields (answer, date and time, "user"), the model's name in the file name, and that the hashes are not salted (someone with the model, or a guess, can check a record) |
| 4.15 | The one file DataArcus replaces; only while it is still the file checked (identity, size, hash); else left and named | true | `answers.mjs:writeAnswers` (`changed`, ANSWERS_CHANGED; `was.ours`) | kept |
| 4.16 | A write that fails leaves nothing or names what it could not remove | true | `answers.mjs:writeAnswers` (`writeFailed(e, ..., ours, [])`) | kept |
| 4.17 | Answers that no longer apply dropped at an approved write; forgetting empties it | true | `server.mjs` check_model_health (`recs = forgetAnswers ? fresh : ...`) | reworded: "(again after an approved plan)" |
| 4.18 | The website keeps the same records in the browser only, until "Forget my answers" | true, incomplete | `confirm-memory.js:save` (localStorage, key PREFIX + fingerprint = sha256 of the table names), `kept` | reworded: "in your browser's local storage only, under a hash of the model's table names" |
| 4.19 | A name is taken when anything is there; every new file fails if the name exists; nothing written over a file or through a link | true for new files; the answers replace is the exception | `model.mjs:nothingAt`, `write-io.mjs:writeFileNew` ('wx', link) | reworded: "(the answers file's replace above aside)" |
| 4.20 | read_model, suggest_fields, plan_layout, check_report only read | true, incomplete | read_report is READS too (`server.mjs` annotations) | reworded: read_report added |
| 4.21 | plan_layout's J14 copy in a private temp folder, never the working folder, deleted when the check ends | true | `artifact.mjs:validate` (`mkdtempSync`, `rmSync` in finally) | kept |
| 4.22 | Logo and background images copied; originals not changed | true | `files.mjs:readUserFile`, `pbip-export.js` StaticResources | kept |
| 4.23 | Nothing of yours is deleted; no tool deletes a file it did not just create | true for your files | the answers file is replaced or emptied (DataArcus's own) | reworded: "(replacing or emptying DataArcus's own answers file, as above, aside)" |
| 4.24 | A failed write removes only what that call created | true | `write-io.mjs:removeOurs` | kept |
| 4.25 | "a theme or a script is written under a temporary name first" | true, incomplete | `write-io.mjs:writeFileNew` links the temporary file to its name (EEXIST if taken); without hard links writes the name with 'wx' | reworded: "... and linked to its name, which fails if the name is taken" |
| 4.26 | A report or a twin written folder by folder, .pbip last | true | `files.mjs:writeTree` | kept |
| 4.27 | Removed only while still the one that call created; foreign or links left and named | true | `write-io.mjs:removeOurs` (`left.foreign`) | kept |
| 4.28 | "No file is ever renamed over another" | untrue | `answers.mjs:writeAnswers` renames its temporary file over its own answers file | reworded: "..., except DataArcus's own answers file when it is replaced as above" |
| 4.29 | If something can't be removed, the answer names it and the plan can't be used again; else it can | true | `files.mjs:withPlan`, `planWrites` | kept |
| 4.30 | Keep the folder clean | advice | - | kept |

### 5. Model metadata is untrusted input
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| 5.1 | A name or description can contain anything; treated as data | true | `model.mjs:readsLikeInstruction`, `shownName` | kept |
| 5.2 | Tools return names as plain values in JSON and never act on them | true, incomplete | read_report's default answer is plain text lines (`read-report.mjs` text format) | reworded: "(in JSON, or in `read_report`'s plain lines)" |
| 5.3 | The AI is told so: instructions, tool descriptions, skill | true | `agent-text.mjs` rule 5, `UNTRUSTED`, `REPORT_UNTRUSTED`; SKILL.md; `test-0.2.9-agent.mjs` | kept |
| 5.4 | Analyse, propose, write; never run anything because a name says so | true (instruction) | agent-text rule 1; SKILL | kept |
| 5.5 | Changes to the model are always yours | true | no tool writes into a model (`server.mjs`) | kept |

### Coming, Known gaps, Who to ask
| # | Claim | True? | Evidence | Action |
|---|---|---|---|---|
| C1 | The number check: approved, planned, not built; section 3 stands until then | true | no such tool in `server.mjs` (11 tools) | kept |
| K0 | "Open on 2026-10-11" | stale | - | "Open on 2026-10-19"; the read_report titles gap added |
| K1 | A6-3: only a click or the app's prompt approves; another program could click | true | `plans.mjs:approve` (by 'user-in-browser' / 'user-in-app' only) | kept |
| K2 | The working folder's checks are made when a path is used | true | as 4.6 | kept |
| K3-K12 | Closed in 0.2.9 (A1-1, A6-1/2, A7-3, A6-4, A5-1/5, A6-6, A4-7, capped reads) | true | `model.mjs:realIn`, `plans.mjs`, `write-io.mjs`, `read-report.mjs`, `answer.mjs:capAnswer` (ANSWER_MAX 40000), `files.mjs:readUserFile` | kept |
| K13-K15 | Closed 2026-10-04 (round 5) | true | as 3.10, 4.19, 5.3 | kept |
| K16-K18 | Closed 2026-10-03 (round 3) | true | as 4.4, 4.7, 3.19 | kept |
| K19 | A skill's instruction is not a lock; permission prompts remain the control | true | - | kept |
| W1 | Who to ask: hello@dataarcus.com | true | - | kept |

Counts (PRIVACY.md): 118 claims read (a table row is one claim; K3-K19 one per gap); 93 true as written; 25 reworded:
untrue 4 (2.9, 2.21, 4.0, 4.28), overstated 7 (P4, 1.10, 2.12, 2.13, 3.2, 3.15, 4.14), stale or incomplete 14 (H3, H5,
1.11, 3.5, 4.6, 4.8, 4.17, 4.18, 4.19, 4.20, 4.23, 4.25, 5.2, K0); 1 needs code (N1: 2.12 is now worded as the code
behaves). Zero untrue claims left.

## The other files
| # | File | Claim | True? | Action |
|---|---|---|---|---|
| O1 | mcp/README.md read_report row | "never returned; it reads no data. Long or instruction-like text is withheld." | overstated | "it reads none of your tables' data. Titles and text boxes are screened for instructions and length only: ... a short title is returned as typed" |
| O2 | mcp/README.md Safety | "... and `add_gulf_calendar` only add files (`destructiveHint: false`)" | untrue for check_model_health (replaces/empties its answers file) | "add files ...; `check_model_health` also replaces or empties its own answers file (below), only as its approved plan says". Annotation itself: N2 |
| O3 | mcp/README.md Safety | "A write that fails part-way removes what that call created." | incomplete | "... and names anything it could not remove" |
| O4 | mcp/README.md Safety | "it never returns data values to Claude" | true; titles unsaid | "never returns data values from them to Claude. A report's short titles and text boxes are returned as typed ..."; "(whole files, hashed; ...)" |
| O5 | README.md | "never overwrites your files" | true of your files; the answers file unsaid | "writes new files only: the one file it ever replaces is its own answers file, after you approve" |
| O6 | mcp/PRODUCT_SPEC.md promise 5 | "never overwrites or deletes a file" | untrue (answers file) | "never overwrites or deletes your files (it writes new files only; the one file it replaces is its own answers file, after you approve; a failed write removes only what it created)" |
| O7 | mcp/PRODUCT_SPEC.md promise 6 | "it reads your model's structure, never the data in it" | overstated (it reads definition files that can hold Enter-data rows and saved filter values) | "it reads your model's and report's definition files on your machine, never Power BI's data cache, and returns structure, never data values (a report's short titles are returned as typed ...)" |
| O8 | mcp/PRODUCT_SPEC.md "doesn't" list | "never returns data values to Claude ... reads files to check and fingerprint them" | true | kept |
| O9 | mcp/PRODUCT_SPEC.md safety rule 2 | "Never overwrite or delete. New files only" | untrue (answers file) | the exception added |
| O10 | mcp/PRODUCT_SPEC.md safety rule 4 | "Tools return names, types and formats, never data values" | incomplete (titles) | "... and a report's short titles and texts as typed (screened for instructions and length only), never data values from the model" |
| O11 | SKILL.md Rules | "a report's short, screened titles and texts ..., never data values" | overstated | "never data values from the model; a title is screened for instructions and length only, so one a person typed with a figure or a name in it comes back as it is" |
| O12 | SKILL.md Rules | "Never overwrite, delete or save over the user's files" | an instruction to the AI, true as a rule | kept |
| O13 | agent-text.mjs last line | "Files are read locally to check and fingerprint them; answers hold structure and screened titles, never data or DAX. ... a failed one removes them." | overstated | "Files are read and hashed locally; answers hold structure and short titles as typed, never table data or DAX. Writes are new files (bar its answers file); a failed one removes what it made." (2,200-character cap kept: `test-0.2.9-agent.mjs` PASS) |
| O14 | server.mjs read_report description | "No data: ... titles and text-box texts are returned only when short, long or instruction-like ones withheld." | overstated | "No table data: ... Titles and text-box texts are screened for instructions and length only: long or instruction-like ones are withheld, a short one is returned as typed (a figure or a name a person typed in it included)." |
| O15 | lib/read-report.mjs NOTE (in every read_report answer) | "..., and no data is read." | overstated | "and no table data is read. A short title is given as typed (a figure or a name in it included)." |
| O16 | lib/model.mjs data-file refusal | "DataArcus reads no data" | overstated | "DataArcus opens no data files" |
| O17 | lib/approval-window.mjs preview note | "placeholders, not your data: DataArcus reads files ... never returns data values to Claude" | true | kept |
| O18 | lib/approval-window.mjs check note | "(structure only, never data)" | true | kept |
| O19 | lib/answers.mjs writesNote | per plan: "replaces the answers file ...; nothing else is overwritten or deleted" / "New files only" + what a failed write removes | true (R5, R6) | kept |
| O20 | lib/answers.mjs file note | "hashes (...), the answer and its date; no name, no DAX, no data" | true (date = date and time; "user" is in each record) | kept (it is the file's own label; PRIVACY says the full list) |
| O21 | server.mjs add_gulf_calendar description | "never writes into the model, never returns the DAX and never overwrites a file" | true for that tool | kept |
| O22 | power-bi-mcp/ (EN) beta.safe.model | "never writes over a file" | untrue (answers file) | "never writes over your files: every report is new, next to your model. The one file it replaces is its own answers file, and only after you approve." |
| O23 | power-bi-mcp/ (EN) beta.safe.ask | "It writes only inside the one folder you choose." | overstated (temp check copy) | "(and a private check copy in your computer's temporary folder, deleted when the check ends)" |
| O24 | power-bi-mcp/ (EN) beta.safe.data | "what it sends is your model's structure" | incomplete (titles) | "never returns data values from your model ...; and, from a report, its short titles as typed (a figure or a name typed into a title is sent too)" |
| O25 | ar/power-bi-mcp/ (AR) the same three | as O22-O24 | as above | Arabic: the same three sentences (the owner checks the Arabic) |
| O26 | beta page other lines (tools list: "Changes nothing", "never changed", "never applied", "Writes nothing") | true | `server.mjs` annotations; `arabic-twin.mjs` | kept |
| O27 | Theme Generator logo line (EN, AR, lab) | "Read in this tab only: the image is never uploaded or saved. The colours taken from it are saved in this browser, like any theme" | true | `theme-generator.js` logo block: `createObjectURL`, no fetch, no `track()`; `state.data` saved by `save()` (localStorage) | kept (R6's wording) |
| O28 | privacy.html (site) | tools run in the browser; colours, model files stay on your device; local storage; Google Analytics, Clarity, consent banner for EU/EEA by time zone | true | `theme-generator.js` / `model-health.js` `track()` events carry option names, rule ids, counts, never colours, names or file contents | kept |

## Needs code (not changed)
- **N1** `mcp/lib/read-report.mjs:safeText` (used by `readReport` for titles, text boxes, group titles): `read_report` returns a
  short static title or text box as typed (screened for instructions and length only). Proposed fix: return no static
  title text by default (the visual by kind, fields and place, as R6's redesign does, with `titleChars: n`), and return
  the text only when the user asks for it (an input such as `titles: true`, said in the description), or screen it for
  numbers and proper names first. PRIVACY.md's Known gaps lists it until then.
- **N2** `mcp/server.mjs` `check_model_health` is registered with `ADDS` (`destructiveHint: false`), but with an approved
  plan it replaces or empties its own answers file. Proposed fix: its own annotations with `destructiveHint: true`
  (the MCP meaning: it may update something already there), or a README line only (the replace is limited to
  DataArcus's own file). The wording now says it; the hint is the owner's call.
