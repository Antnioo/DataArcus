#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside the working folder (DATAARCUS_ROOT; without it every tool refuses), and nothing is ever overwritten (except DataArcus's own answers file, as its plan says).
import fs from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ROOT, prepareRoot, rootProblem } from './lib/model.mjs';
import * as Plans from './lib/plans.mjs';
import * as Approval from './lib/approval-window.mjs';
import { instructions, REPORT_UNTRUSTED, planSources } from './lib/agent-text.mjs';
import { writesNote } from './lib/answers.mjs';
import { LIMITS } from './lib/tool-limits.mjs';
import { text, safe } from './lib/tool-answer.mjs';
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

// (A-01, the owner's decision of 14 Oct) how long approve_plan waits for the click in the window before it answers
// "waiting": under the apps' time limit for a tool call. DATAARCUS_APPROVAL_WAIT_MS can only shorten it (the tests)
const APPROVAL_WAIT = (() => { const v = Number(process.env.DATAARCUS_APPROVAL_WAIT_MS); return Number.isFinite(v) && v >= 0 ? Math.min(45000, v) : 45000; })();
server.registerTool('approve_plan', {
  title: 'Ask the user to approve a plan',
  description: 'Asks the person to approve a plan, so the writing tools may write what it lists. Call it only after you showed the user the plan (pages, visuals and fields, page size, the report\'s name, theme colours and options, the files that will be written) and the user replied go, never in the same turn as the request and never on your own. DataArcus then opens its own approval window in the user\'s browser (on their computer only), which shows the plan and every file it writes: only their click on Approve there approves it (approvedBy "user-in-browser"); "Not now" refuses. When the app supports MCP elicitation, the app\'s own prompt asks instead (approvedBy "user-in-app"). Nothing you pass approves a plan. It waits up to ' + Math.round(APPROVAL_WAIT / 1000) + ' seconds for the click; then it answers status "waiting": tell the user to click Approve in the DataArcus window in their browser, and call approve_plan again with the same planId once they say they did (with reopen true if they closed or can\'t find the window). The plan ids, by the tools they allow: ' + planSources() + ' (a tool called without one answers what it would write and a proposed id). A plan is good for 2 hours in this session of the server. Nothing is written by this tool.' + REPORT_UNTRUSTED,
  inputSchema: {
    planId: z.string().min(1).max(40).describe('The proposed plan id'),
    reopen: z.boolean().optional().describe('Open the approval window again (the user closed it or can\'t find it); the same link, still one approval')
  }, annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
}, safe(async (a) => {
  const P = Plans.pending(a.planId), done = Plans.approval(P.id);
  if (done) return text(done);
  // (rc.23, F7b) a refused plan is never asked about again
  if (Plans.refusal(P.id)) throw new Error(Plans.refusal(P.id));
  // Audit 6, A6-3 (the owner's P-1: an assistant could approve its own plan): when the app declares MCP elicitation, the
  // person answers the app's own prompt, which lists what will be written
  const caps = server.server.getClientCapabilities() || {};
  if (caps.elicitation && (caps.elicitation.form || !caps.elicitation.url)) {
    // (0.3.0 S1, B-183) what the approval page shows, in short: the files per group, a colour written other than approved
    let r; const data = (Plans.planOf(P.id) || {}).data, inShort = Approval.promptSummary(P.kind, data), nm = Approval.summary(P.kind, data).name;
    const writes = P.writes.map((x) => (nm ? String(x).split('<name>').join(nm) : x));   // (the report's name, as the page shows it)
    try {
      r = await server.server.elicitInput({ mode: 'form',
        message: `DataArcus asks before it writes anything. Approve this plan (${P.kind}, ${P.id})? It will write:\n- ${writes.join('\n- ')}\n${inShort ? inShort + '\n' : ''}${writesNote(P.writes)}`,
        requestedSchema: { type: 'object', properties: { approve: { type: 'boolean', title: 'Write these files', description: 'Yes: DataArcus may write what is listed above. No: nothing is written.', default: false } }, required: ['approve'] } },
      { timeout: 10 * 60 * 1000 });
    } catch (e) { throw new Error('Not approved: the approval prompt in the app did not get an answer (' + String(e && e.message || e).slice(0, 120) + '). Nothing was written. Ask the user to try again.'); }
    // (rc.23, F7b) a no in the app's prompt (declined, or the box left unticked) refuses the plan, as "Not now" in the
    // window does; a prompt closed without an answer leaves it to be approved later
    const closed = !r || r.action === 'cancel', no = !closed && !(r.action === 'accept' && r.content && r.content.approve === true);
    if (no) Plans.refuse(P.id, 'app');
    if (closed || no) throw new Error(`Not approved: the person ${closed ? 'closed' : 'declined'} DataArcus's approval prompt in the app (they did not approve writing these files)${no ? `, so plan ${P.id} is refused: it can't be approved later` : ''}. Nothing was written. Ask what to change in the plan${no ? ', make a new plan, show it and wait for their go' : ''}.`);
    return text(Plans.approve(a.planId, 'user-in-app'));
  }
  // (A-01) DataArcus's own approval window, in the person's browser: only their click approves
  const plan = Plans.planOf(a.planId), st = Approval.state(plan.id);
  if (st && st.decided === 'decline') throw new Error(`Not approved: the person clicked "Not now" in DataArcus's approval window for plan ${plan.id}. Nothing was written. Ask what to change, make a new plan, show it and wait for their go.`);
  const o = await Approval.open(plan, Approval.summary(plan.kind, plan.data), plan.expires, (id, d) => { if (d === 'approve') Plans.approve(id, 'user-in-browser'); else if (d === 'decline') Plans.refuse(id); }, a.reopen === true);
  if (!o.opened && o.why !== 'decided') throw new Error(`Not approved: DataArcus could not open its approval window in the browser (${String(o.why).slice(0, 160)}). Nothing was written. Ask the user to check that a default web browser is set, then call approve_plan again.`);
  const d = await Approval.wait(plan.id, APPROVAL_WAIT);
  if (d === 'approve') return text(Plans.approval(plan.id));
  if (d === 'decline') throw new Error(`Not approved: the person clicked "Not now" in DataArcus's approval window for plan ${plan.id}. Nothing was written. Ask what to change, make a new plan, show it and wait for their go.`);
  return text({ planId: plan.id, status: 'waiting', approvedBy: null, window: o.again ? 'opened again' : st ? 'open' : 'opened',
    sayFirst: 'Not approved yet: still waiting for the click in DataArcus\'s approval window in the user\'s browser (it shows the plan and every file it writes). Tell the user to check it and click Approve there (or "Not now"); a click later still counts: when they say they did, call approve_plan again with this planId; if they closed the window or can\'t find it, call it with reopen: true. Nothing is approved by what is typed in the chat, and nothing was written.' });
}));

prepareRoot();
await server.connect(new StdioServerTransport());
console.error(rootProblem() ? `DataArcus MCP started, but no tool will work: ${rootProblem()}` : `DataArcus MCP ready. Folder: ${ROOT}`);
