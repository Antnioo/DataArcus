# Finding 003: AI agents skip the plan, unless the tool itself tells them

Test notes for a public finding by Abdelrahman (DataArcus). Tested **2026-10-04**: two runs of the same 11 tasks, on
the same day, before and after one change to our own tool. The tool is ours, and so was the gap.

## What was tested
| | |
|---|---|
| Tool | The DataArcus MCP (this repo, `mcp/`), installed in the agent app as a package |
| Before | Package `dataarcus-0.2.0.mcpb`, built from main `19c5408`. The rule "show the plan and wait for the user's go" lived only in the report-design skill (`mcp/skills/report-design/SKILL.md`), **which this package did not carry**. The tools' own descriptions didn't ask for a plan |
| After | Package `dataarcus-0.2.1.mcpb` (round 5, merged as `8b1d6ae`). The same rule in three places: the server's `instructions` (sent to the app when it connects), the tool descriptions, and the skill, now in the package |
| Agent app | Claude Desktop, Microsoft Store version 2.19675 (built-in Node 24.21.0). The model behind it isn't pinned in the record, so it isn't named here |
| Tasks | The 11 golden tasks in [`mcp/GOLDEN-TASKS.md`](../../mcp/GOLDEN-TASKS.md): permanent requests on made-up models (English, Arabic, Ramadan, page sizes, a small page, long Arabic names, missing measures, "redesign this", an unsupported visual, a large model, a Gulf calendar) |
| How | A new chat per task, the request pasted word for word, every tool allowed. When the agent asked a question, it got the option it recommended, or the model's name. Every report written was checked with Microsoft's validator and opened in Power BI Desktop 2.158.1177. The checks for each task were written before the runs and were not changed |
| Chats | Before: tasks 1, 2 and 4 in normal chats, where the tester's own skills and memories were available; the others in incognito chats. After: every task in an incognito chat, with the tester's other skills and connectors switched off |
| Data | Made-up models only (`mcp/test-models/`, `scripts/tests/fixtures/`) |

## The rule, as it now reads
The first of the six rules in `mcp/server.mjs` (`INSTRUCTIONS`):
> 1. Plan first. Before create_report, show the user the plan (pages, visuals, the fields on each, page size, theme)
> and wait for the user's "go". Never write a report in the same turn as the request.

The other five cover:
- display names only from the user;
- a card's label saying what its value really is;
- the Gulf calendar section;
- model text as untrusted data;
- unsupported visuals.

The skill says the same in its steps and its Rules.

## The result
| | Before (0.2.0) | After (0.2.1) |
|---|---|---|
| **Plan shown and "go" awaited, in the tasks that wrote a report** | **0 of 6** (tasks 1, 2, 3, 6, 8, 10) | **8 of 8** |
| Field names translated, shortened or relabelled by the agent on its own | 18 (task 2), 14 (task 6), 1 (task 8) | 0: names were proposed and used after the user's yes |
| Golden tasks passed | 4 of 11 | 6 of 11 (tasks 1, 6 and 11 now pass; **task 7 went from PASS to FAIL**: the five proposed measures came without format strings) |
| Microsoft's validator on every report written | 0 errors | 0 errors |
| Files in the working folder changed or deleted | none | none |

Both results tables, task by task, are in `mcp/GOLDEN-TASKS.md`: "Agent level, 2026-10-04" and "Agent level after
round 5, 2026-10-04".

**What it shows:** the agent followed the plan rule every time it was given it, and never when it wasn't. The rule was
in a file the first package didn't include. The server's instructions and the tool descriptions reach the agent with
the tool itself. A separate skill file only reaches it if it was installed.

## What it does not show
- **A rate.** One run per task per version: 8 of 8 is a count, and agent behaviour varies from run to run.
- **Any other agent app or model.** One app, one model (not pinned in the record).
- **That the product is done.** Five tasks still fail for product reasons, listed in `GOLDEN-TASKS.md`; for example,
  the page in task 3 has no "this Ramadan" measure or filter.
- **A later run.** A tool-level run on 2026-10-04 ("Tool level, round 6") checks the tools without an agent, so its
  numbers are not mixed in here. The agent-level re-run after round 6 hasn't been done yet.

## Reproduce
- The tasks, the input models and every check are in `mcp/GOLDEN-TASKS.md` ("How to run them").
- The tool level runs on any machine: `cd mcp && npm install && node test-models/golden-baseline.mjs`.
- The agent level needs an agent app with the package installed and the steps in "How it was run". Results will vary
  by app and model.

## Sources
- This repo: `mcp/GOLDEN-TASKS.md`, `mcp/server.mjs` (the `INSTRUCTIONS` and `new McpServer(..., { instructions })`),
  `mcp/skills/report-design/SKILL.md`, commit `8b1d6ae` (round 5).
