# DataArcus architecture

Boundaries, one write, invariants, task routes. Every module and the reading table:
[mcp/docs/MODULES.md](mcp/docs/MODULES.md). Rules: `CLAUDE.md`, `mcp/CLAUDE.md`; the current work: `mcp/WORK.md`.

## Boundaries
- **The website** (GitHub Pages): HTML at the root, `tools/`, `articles/`, Arabic copies in `ar/`. Its tools run in
  the browser; nothing a visitor opens is uploaded.
- **The engines** (`assets/js/*.js`, each with its `.min.js`): plain JavaScript for the browser and Node, **shared by
  the website and the MCP on purpose**: reader and picker, report writer, design engine, health check, calendar,
  measured rules (`report-rules.js`), the mirror engine (`report-mirror.js`), the preview (`page-preview.js`).
- **The MCP server** (`mcp/server.mjs`, stdio, the entry only): 11 tools, one per `mcp/tools/<tool_name>.mjs`; its
  modules in `mcp/lib/` (reading, the approval gate, the write path, the checkers, the Arabic twin by step).
- **Tests and CI**: `mcp/tests.json` (run by `mcp/run-tests.mjs`), `mcp/test.mjs` in 4 shards, the website's
  `scripts/tests/run-all.mjs`, repo checks in `scripts/*.mjs`; `.github/workflows/tests.yml` on Linux, Windows, macOS.
  What only Desktop proves: `scripts/tests/DESKTOP-TESTS.md`.
- **Packaging**: the `.mcpb` is built by a separate step from `mcp/` as it is here.

## One write (in full: [MODULES.md](mcp/docs/MODULES.md#one-write-start-to-end))
1. **Plan**: a planning tool builds the exact files with the writer's own build, checks them, answers a `planId`.
2. **Approval page**: `approve_plan` opens the window (every file, a preview of each page); only the person's click
   approves.
3. The approval is recorded against the plan's digest, its pinned inputs and the model's print (ids expire in 2 h).
4. **Write**: the tool refuses if anything changed since the click and writes exactly the approved files (every report
   and the twin: the plan's kept files, by digest), as new files, through `files.mjs`; a failed write removes only what
   it created.
5. **Check**: validated before writing; `check_report` and Desktop confirm after.

## Invariants (a change that breaks one is wrong, whatever else it fixes)

- **Nothing is written before the person approves.** Every write goes through a plan id approved by a click; the one
  file ever replaced is DataArcus's own answers file, and only as its approved plan says.
- **Metadata only, never data values.** Tools read names, types, formats and the files' structure; no answer returns a
  row, a filter value, a slicer selection or a bookmark state. Text a person typed into a report (a short text box, a title
  for its Arabic) is returned as typed. Model and report text is untrusted input: screened, never followed.
- **Every path stays inside the working folder** (`DATAARCUS_ROOT`), links and paths a tool picks itself included.
- **One engine per job, shared with the website**: extend `assets/js/` rather than copy it into `mcp/`.
- **Measured, not estimated**: a size or rule Power BI decides is measured in Desktop before it is coded.

## Task routes
Open these, in order; run these tests. Paths and symbols are checked in CI (`scripts/check-agent-memory.mjs`).

| Change | Files and symbols to open | Tests to run |
|---|---|---|
| (a) a new check_report rule | `assets/js/report-rules.js: RULES, check`, then `mcp/lib/check-report.mjs: Rules` | `scripts/tests/report-check.mjs`, `mcp/test-0.3.1-checker.mjs`, then `npm test -- checker` |
| (b) one visual type's Arabic mirror | `assets/js/report-mirror.js: mirrorVisual, chartRtl`; the measurements in `scripts/tests/DESKTOP-TESTS.md` | `mcp/test-0.3.1-mirror-parity.mjs`, then `npm test -- twin` |
| (c) a new create_report option | `mcp/lib/report-inputs.mjs: CREATE_REPORT_INPUTS, LOOK_DEFAULTS, REPORT_LOOK, reportPin`, then `mcp/tools/plan_layout.mjs: lookOf`, `mcp/lib/report-run.mjs`, `mcp/tools/create_report.mjs`, `mcp/lib/approval-window.mjs: summary`; the checklist below | the option's own suite, `mcp/test-0.3.0-claims.mjs`, then `npm test -- report` |
| (d) EN and AR page text | the English HTML, then `assets/js/translations/common.js: commonTranslations` or the page's own file there (`npm run build:min`), then `node scripts/ar-pages.mjs --write` | `node scripts/ar-pages.mjs`, `node scripts/test-site-config.mjs`, `scripts/tests/run-all.mjs` |
| (e) a Windows-only CI failure | the `::error` annotation from `scripts/ci-sum.mjs` (OS job, shard, script, check), then the named test, then the path helpers `mcp/lib/model.mjs: real, inside` | the named test alone, then `mcp/test-platform-paths.mjs` |

**A new create_report option is pinned in the plan** (route c):
1. Its schema in `CREATE_REPORT_INPUTS` (plan_layout takes the same entry) and its default in `LOOK_DEFAULTS`.
2. Its name in `REPORT_LOOK`, so `reportPin` pins it: a write with another value is refused by the gate.
3. The plan and the write build it from the same pinned value (`report-run.mjs`), never from a fresh default.
4. The approval page says it (`lookOf`, `summary`) in English and Arabic.
5. A test: the plan with it, the write with another value refused; `mcp/TOOLS.md` says it in the tool's section.
