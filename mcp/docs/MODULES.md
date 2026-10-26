# The modules, one write in full, where to start reading

Moved here unchanged by A1 (0.3.1, 25 Oct) from [ARCHITECTURE.md](../../ARCHITECTURE.md) ("The parts", "One write,
start to end", "Where to start reading"), which keeps the boundaries, the write in five lines, the invariants and the
task routes.

## The parts

- **The website** (dataarcus.com, GitHub Pages): the HTML pages at the root, `tools/`, `articles/`, and their Arabic
  copies in `ar/`. Its Power BI tools run in the browser; nothing a visitor opens is uploaded.
- **The engines** (`assets/js/*.js`, each with its `.min.js`): plain JavaScript that runs in the browser and in Node,
  **shared by the website and the MCP on purpose**, so both give the same answers. The model reader and field picker
  (`pbip-bind.js`, `tmdl-model.js`), the report writer (`pbip-export.js`, `pbip-page.js`, `pbip-query.js`), the design
  engine (`design-engine.js`), the health check (`model-health-engine.js`, `model-health-tmdl.js`, `gulf-health.js`),
  the calendar generator (`calendar-generator.js`, `gulf-dates.js`), the measured rules (`report-rules.js`,
  `label-limits.js`, `layout-check.js`, `report-a11y.js`), the mirror engine for right to left (`report-mirror.js`)
  and the preview renderer (`page-preview.js`).
- **The MCP server** (`mcp/server.mjs`, stdio): 11 tools, from `read_model` to `check_report` (every tool and option:
  `mcp/TOOLS.md`). Its modules are in `mcp/lib/`:
  - reading: `model.mjs` (models from disk, every path kept inside the working folder; the untrusted-text screen),
    `read-report.mjs` (what a PBIR report holds), `scope.mjs` (large models);
  - **the approval gate**: `plans.mjs` (plan ids, what each plan pins) and `approval-window.mjs` (the window in the
    person's browser, on 127.0.0.1 with a one-time link the AI never receives);
  - **the write path**: `artifact.mjs` (the exact files a plan builds and their digest), `files.mjs` (the one writer
    of new file trees: all or nothing, never over anything), `write-io.mjs` (one new file, never half-written);
  - **the checkers**: `check-report.mjs` (Microsoft's validator offline, schemas bundled in `mcp/schemas/`, and the
    measured rules), `design-lint.mjs`, `plan-lint.mjs`, `arabic-lens.mjs`;
  - **the Arabic twin**: `arabic-twin.mjs` (the twin, the EN-AR copy and the bilingual report's Arabic half), with
    `terminology.mjs`, `arabic-names.mjs`, `arabic-terms.mjs`; every Arabic path mirrors through `report-mirror.js`;
  - what leaves the server: `answer.mjs` (every answer), `agent-text.mjs` (the instructions and shared descriptions).
  - **the tools** (0.3.1 S9): `mcp/server.mjs` is the entry only (setup, the instructions, one `register` import per
    tool, in the order tools/list shows them); each tool is `mcp/tools/<tool_name>.mjs` exporting `register(server,
    ctx)`; helpers more than one tool uses are `lib/tool-answer.mjs`, `tool-inputs.mjs`, `tool-limits.mjs`,
    `plan-keys.mjs`, `fix-scripts.mjs`, `hidden-names.mjs`, and for reports `report-inputs.mjs`, `report-fields.mjs`,
    `report-said.mjs`, `report-run.mjs` (one report's whole build, the plan's exact artifact and the write alike);
  - the twin by step: `arabic-twin.mjs` re-exports `twin-read.mjs` (the source), `twin-visuals.mjs`, `twin-texts.mjs`
    (labels and terms), `twin-model.mjs`, `twin-copy.mjs` (the EN-AR copy, language buttons), `twin-pages.mjs`,
    `twin-plan.mjs`, `twin-preview.mjs`, `twin-write.mjs`;
  - tests that read source text go through `mcp/test-source.mjs` (a new tool or lib module is found from there).
- **Tests and CI**: the MCP's suites are listed once, by area, in `mcp/tests.json` and run by `mcp/run-tests.mjs`
  (`npm test` in `mcp/`); `mcp/test.mjs` runs every tool end to end and CI splits it in 4 shards. The website's
  suites: `scripts/tests/run-all.mjs`. Repo checks (site config, result lines, CHANGELOG words, ...): `scripts/*.mjs`.
  `.github/workflows/tests.yml` runs them on Linux, Windows and macOS and adds the shards up (`scripts/ci-sum.mjs`).
  What only Power BI Desktop can prove: `scripts/tests/DESKTOP-TESTS.md`.
- **Packaging**: the one-click extension (`.mcpb`) and its release notes are made by a separate build step from
  `mcp/` as it is here; `mcp/skills-packaging/` is the plugin folder next to Microsoft's.

## One write, start to end

1. **Plan.** `plan_layout` (or `create_arabic_twin`, `generate_theme`, `check_model_health`'s fix scripts,
   `add_gulf_calendar` without a plan id) reads the model's metadata, builds the exact files the write would make with
   the writer's own build, checks them (validator, every field against the model, the measured rules, the layout
   check) and answers with a proposed `planId`. Nothing is written.
2. **Approval page.** The AI calls `approve_plan`; the server opens its approval window: the plan, every file it
   writes and a preview of each page drawn from the plan (`page-preview.js`). Only the person's click on Approve (or
   the app's own elicitation prompt) approves; nothing the AI passes does.
3. **`approve_plan`** records the approval against the plan's digest, its pinned inputs and the model's print (a hash
   of its definition files). Ids expire after 2 hours and live in the server process only.
4. **Write.** The writing tool, called with the `planId`, refuses if anything changed since the click (the model, an
   input file, an option) and writes exactly the approved files, as new files next to the model, through `files.mjs`;
   a failed write removes only what that call created, and only while its content is what
   the call wrote (0.3.1 RB, `write-io.mjs`). create_report and the twin write the files their plan kept,
   byte for byte: `tools/create_report.mjs: writeApproved` compares their digest and binding; `lib/twin-write.mjs:
   writeTwin` (0.3.1 K2) the same, and builds the twin again for comparison only (a different build: nothing written). `mcp/test-0.3.1-write-gate.mjs` lists every file-writing call.
5. **Check.** The report was validated before it was written; `check_report` (any report, read only) and Power BI
   Desktop confirm it after.

## Where to start reading

| Change | Start with |
|---|---|
| A website page or tool | the page's HTML and its `assets/js/` engine; `node scripts/test-site-config.mjs`; `scripts/tests/run-all.mjs` |
| What a report looks like (layout, sizes, visuals) | `assets/js/pbip-export.js`, `pbip-page.js`, `design-engine.js`; `report-rules.js` for measured limits |
| Right to left and Arabic | `assets/js/report-mirror.js`; `mcp/lib/twin-*.mjs` (by step), `terminology.mjs`; `assets/data/arabic-report-words.json` |
| Reading models | `assets/js/pbip-bind.js`, `tmdl-model.js`; `mcp/lib/model.mjs`, `scope.mjs` |
| Model health | `assets/js/model-health-engine.js`, `model-health-tmdl.js`, `gulf-health.js` |
| A tool's inputs or answer | `mcp/tools/<tool_name>.mjs`, `mcp/lib/agent-text.mjs`, `mcp/TOOLS.md` |
| Approval or writing | `mcp/lib/plans.mjs`, `approval-window.mjs`, `artifact.mjs`, `files.mjs`, `write-io.mjs` |
| Checking reports | `mcp/lib/check-report.mjs`, `arabic-lens.mjs`, `design-lint.mjs`; `assets/js/layout-check.js` |
| Tests and CI | `mcp/tests.json`, `mcp/run-tests.mjs`, `mcp/test.mjs` (`SHARDS`), `.github/workflows/tests.yml`, `scripts/ci-sum.mjs` |
| Public claims (README, PRIVACY, the MCP page) | `mcp/test-0.3.0-claims.mjs`, `mcp/test-release-text.mjs` |

## A new create_report option is pinned in the plan

Moved here unchanged by SQ12 (0.3.1, 26 Oct) from ARCHITECTURE.md's task routes (route c links here).

1. Its schema in `CREATE_REPORT_INPUTS` (plan_layout takes the same entry) and its default in `LOOK_DEFAULTS`.
2. Its name in `REPORT_LOOK`, so `reportPin` pins it: a write with another value is refused by the gate.
3. The plan and the write build it from the same pinned value (`report-run.mjs`), never from a fresh default.
4. The approval page says it (`lookOf`, `summary`) in English and Arabic.
5. A test: the plan with it, the write with another value refused; `mcp/TOOLS.md` says it in the tool's section.
