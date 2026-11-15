#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside the working folder (DATAARCUS_ROOT; without it every tool refuses), and nothing is ever overwritten (except DataArcus's own answers file, as its plan says).
import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ROOT, prepareRoot, rootProblem } from './lib/model.mjs';
import { instructions } from './lib/agent-text.mjs';
import { LIMITS } from './lib/tool-limits.mjs';
import { guardInputErrors } from './lib/tool-answer.mjs';
import { leanToolsList } from './lib/tools-list.mjs';
// (0.3.1 S9) one module a tool, registered below in the same order as before (tools/list keeps its order)
import { register as registerReadModel } from './tools/read_model.mjs';
import { register as registerSuggestFields } from './tools/suggest_fields.mjs';
import { register as registerCheckModelHealth } from './tools/check_model_health.mjs';
import { register as registerCreateReport } from './tools/create_report.mjs';
import { register as registerGenerateTheme } from './tools/generate_theme.mjs';
import { register as registerCheckReport } from './tools/check_report.mjs';
import { register as registerReadReport } from './tools/read_report.mjs';
import { register as registerPlanLayout } from './tools/plan_layout.mjs';
import { register as registerAddGulfCalendar } from './tools/add_gulf_calendar.mjs';
import { register as registerCreateArabicTwin } from './tools/create_arabic_twin.mjs';
import { register as registerApprovePlan } from './tools/approve_plan.mjs';

// the version is in one place: mcp/package.json
const VERSION = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
// The rules an AI app must follow with these tools, sent to it when the server starts: built from LIMITS and the plan
// kinds in lib/agent-text.mjs (the audit's A7-4: one source for the instructions, the shared description sentences
// and the tests' cap)
const INSTRUCTIONS = instructions(LIMITS);
const server = new McpServer({ name: 'dataarcus', version: VERSION }, { instructions: INSTRUCTIONS });
// What every tool's register(server, ctx) gets from the server (0.3.1 S9): the tools' limits, the same object the
// instructions above are built from.
const ctx = { LIMITS };
registerReadModel(server, ctx);
registerSuggestFields(server, ctx);
registerCheckModelHealth(server, ctx);
registerCreateReport(server, ctx);
registerGenerateTheme(server, ctx);
registerCheckReport(server, ctx);
registerReadReport(server, ctx);
registerPlanLayout(server, ctx);
registerAddGulfCalendar(server, ctx);
registerCreateArabicTwin(server, ctx);
registerApprovePlan(server, ctx);
// (0.3.2 RV1, B-392) a call whose input fails the schema is answered short and capped, for every tool
guardInputErrors(server);
// (0.3.3 TL1) tools/list without the schema keys that say nothing (it starts every chat); what a call accepts is unchanged
leanToolsList(server);

prepareRoot();
await server.connect(new StdioServerTransport());
console.error(rootProblem() ? `DataArcus MCP started, but no tool will work: ${rootProblem()}` : `DataArcus MCP ready. Folder: ${ROOT}`);
