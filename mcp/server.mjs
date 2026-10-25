#!/usr/bin/env node
// DataArcus MCP server: the engines behind dataarcus.com's Power BI tools, for an AI agent.
// Pairs with Microsoft's Power BI Authoring MCP server (model edits, DAX) and the Desktop bridge (reload, screenshots).
// Every path stays inside the working folder (DATAARCUS_ROOT; without it every tool refuses), and nothing is ever overwritten (except DataArcus's own answers file, as its plan says).
import fs from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createRequire } from 'node:module';
import { ROOT, inside, loadModel, prepareRoot, rootProblem } from './lib/model.mjs';
import { withPlan } from './lib/files.mjs';
import { addGulfCalendar } from './lib/gulf-calendar.mjs';
import { reportPrint } from './lib/read-report.mjs';
import { modelPrintOf } from './lib/artifact.mjs';
import * as Plans from './lib/plans.mjs';
import * as Approval from './lib/approval-window.mjs';
// the engines this server uses, required here (A1-10: the model reader exports reading only)
const require = createRequire(import.meta.url);
const Gallery = require('../assets/js/visual-gallery.js');
const Fix = require('../assets/js/model-health-tmdl.js'), Gulf = require('../assets/js/gulf-health.js');
import { instructions, UNTRUSTED, REPORT_UNTRUSTED, planSources } from './lib/agent-text.mjs';
import { columnsByKind } from './lib/gulf-calendar.mjs';
import { scriptIs as scriptIsSaid, APPLY_STEPS, NEVER_APPLIED, whereSaid } from './lib/plain-words.mjs';   // (0.3.0 T1, T-4 and T-9)
import { planTwin, twinKey, twinOutputs, writeTwin, monthOffer as calendarOffer, MATRIX_SAID } from './lib/arabic-twin.mjs';
import { writesNote } from './lib/answers.mjs';
import { twinPreview } from './lib/arabic-twin.mjs';   // (0.3.1 V1: the twin's pages drawn on its approval page)
import { LIMITS } from './lib/tool-limits.mjs';
import { text, compact, safe } from './lib/tool-answer.mjs';
import { WATERFALL_RTL_INPUT, planIdInput, ADDS, modelPath } from './lib/tool-inputs.mjs';
import { modelRef, sameModelBeforeWrite, inputsPin } from './lib/plan-keys.mjs';
import { writeScript } from './lib/fix-scripts.mjs';
// (0.3.1 S9) one module a tool, registered below in the same order as before (tools/list keeps its order)
import { register as registerReadModel } from './tools/read_model.mjs';
import { register as registerSuggestFields } from './tools/suggest_fields.mjs';
import { register as registerCheckModelHealth } from './tools/check_model_health.mjs';
import { register as registerCreateReport } from './tools/create_report.mjs';
import { register as registerGenerateTheme } from './tools/generate_theme.mjs';
import { register as registerCheckReport } from './tools/check_report.mjs';
import { register as registerReadReport } from './tools/read_report.mjs';
import { register as registerPlanLayout } from './tools/plan_layout.mjs';

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
// (0.3.0 Q1) an answer whose indented form passes AIM (34,000) goes out without the indentation (the same JSON, as
// compact's): on the large model plan_layout in Arabic with every option on was 37,908 characters indented
// (0.3.0 A3) opts.last: a twin's plan keeps its texts whole while any other list can be cut: a text the plan does not
// show can't be given an Arabic label
const TWIN_CAP = { last: ['texts'] };
// the file writeScript would write now, named and not written (a plan names the file its click writes: 0.3.0 A1)
const scriptNameNow = (dir, base, script) => writeScript(dir, base, script, true);
registerReadModel(server, ctx);
registerSuggestFields(server, ctx);
registerCheckModelHealth(server, ctx);
registerCreateReport(server, ctx);
registerGenerateTheme(server, ctx);
registerCheckReport(server, ctx);
registerReadReport(server, ctx);
registerPlanLayout(server, ctx);

server.registerTool('add_gulf_calendar', {
  title: 'Add a Gulf calendar table',
  description: 'Writes the DataArcus Calendar Generator\'s date table for a Gulf model (Hijri year, month and day, Ramadan and Eid flags and Ramadan Day, the UAE\'s announced Ramadan and Eid dates with later ones marked as estimates, and the official weekend of the chosen country with the dates it changed) as a TMDL script in a new file next to the project, only with an approved planId: called without one it checks everything, says what it would write and gives a proposed planId (show the user, wait for go, approve_plan, then call again with planId). The user applies it in Power BI Desktop\'s TMDL view after checking Preview; this tool never writes into the model, never returns the DAX and never overwrites a file. firstYear and lastYear are required: ask the user which years their data covers (the tool returns no data values). It refuses, writing nothing, when the model already has a table, measure or column with the table\'s name, when a relateTo column is missing or is not a date, and when the years are outside Power BI\'s dates or more than 60. Relationships are written only for the relateTo columns the user names (a column whose type the files don\'t give is accepted with a note); Month Name, Day Name and Hijri Month Name (and their (Arabic) columns) are sorted by their numbers in the script; marking the date table is a step by hand in the answer. Tell the user every step and note.' + UNTRUSTED,
  inputSchema: {
    path: modelPath.describe('The model the table is for (read for name clashes and the relateTo columns); the script file goes next to it'),
    firstYear: z.number().int().optional().describe('First year of the calendar (1 January). Ask the user: the years their data covers. Needed unless arabicColumnsOnly'),
    lastYear: z.number().int().optional().describe('Last year of the calendar (31 December); at most 60 years in all. Needed unless arabicColumnsOnly'),
    arabicColumnsOnly: z.boolean().optional().describe('Only when the user wants Arabic month, day and flag names on their OWN date table, without a report: no new table; the script adds the Arabic calendar columns (each sorted like its English column) to the model\'s date table, as an Arabic report\'s script does. The years and country are not needed'),
    country: z.enum(['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn']).default('uae').describe('The country whose official weekend the table uses (with the dates it changed) and that the answer names'),
    weekend: z.enum(['country', 'sat-sun', 'fri-sat', 'fri', 'sun']).default('country').describe('country (default): the country\'s official weekend; or a fixed weekend for a company whose weekend differs'),
    announced: z.boolean().default(true).describe('Ramadan, Shawwal and Dhu al-Hijjah on the UAE\'s announced dates (later ones are Umm al-Qura estimates); false: Umm al-Qura only'),
    lang: z.enum(['en', 'ar']).default('en').describe('Language of the month, day and Hijri month names in the table (the column names stay English)'),
    arabicNames: z.boolean().default(true).describe('Also write Day Name (Arabic), Month Name (Arabic) and Hijri Month Name (Arabic), sorted by their numbers, so an Arabic report can show Arabic names (an English table only: with lang "ar" the names are Arabic already)'),
    name: z.string().max(80).default('Gulf Calendar').describe('The new table\'s name: letters, digits, spaces and _, at most 40 characters. Never the name of a table, measure or column the model has'),
    weekStart: z.enum(['sunday', 'monday', 'saturday']).default('sunday').describe('The first day of the week for Day of Week and Week Start'),
    fiscalStart: z.number().int().min(1).max(12).default(1).describe('The month the fiscal year starts'),
    relateTo: z.array(z.string()).max(5).optional().describe('Date columns of the user\'s fact tables to relate to the new table\'s Date, as "Table[Column]" (many to one, single direction). Only columns the user names'),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('The date the self-check counts as today (YYYY-MM-DD; default: today). For tests'),
    planId: planIdInput
  }, annotations: ADDS
}, safe(async (a) => {
  const m = loadModel(a.path);
  if (a.arabicColumnsOnly) return arabicColumnsOnly(m, a);
  if (a.firstYear == null || a.lastYear == null) throw new Error('Nothing was written: firstYear and lastYear are needed (ask the user the years their data covers); for Arabic names on the model\'s own date table only, pass arabicColumnsOnly true instead.');
  // the gate (0.2.9): with an approved plan the script is written; without one every check runs and the file is only named
  const write = a.planId != null && a.planId !== '' && !!Plans.gate('add_gulf_calendar', a.planId, modelRef(m, a.path), inputsPin(a));
  // the script's place, as check_model_health's fix scripts: next to the project, never inside the model folder
  const scriptDir = m.folder ? m.projectDir : path.dirname(inside(a.path));
  const scriptBase = m.folder ? path.basename(m.folder).replace(/\.(SemanticModel|Dataset)$/i, '') : path.basename(inside(a.path)).replace(/\.[^.]+$/, '');
  // (0.3.0 T1, T-4) the write answer says what the file is and the 3 steps, as the plan did; the columns lead grouped
  if (write) return text(withPlan(a.planId, 'add_gulf_calendar', () => { const r = addGulfCalendar(m, a, { Gulf, Fix, writeScript, scriptDir, scriptBase }); return Object.assign({ columnsByKind: columnsByKind(r.columns) }, r, { scriptIs: scriptIsSaid('the calendar table'), howToApplyScript: APPLY_STEPS.slice() }); }));
  const { scriptFile, howToApply, columns, ...rest } = addGulfCalendar(m, a, { Gulf, Fix, writeScript: scriptNameNow, scriptDir, scriptBase });
  return text(Object.assign({ written: false, scriptAfterGo: path.basename(scriptFile), columnsByKind: columnsByKind(columns) }, rest, { howToApplyAfterGo: howToApply,
    plan: Plans.proposal(Plans.propose('calendar', modelRef(m, a.path), [`the TMDL script "${path.basename(scriptFile)}" ${whereSaid(scriptDir)}, adding the table ${JSON.stringify(rest.table)} (${rest.range.from} to ${rest.range.to})${rest.relationships.length ? ' and ' + rest.relationships.length + ' relationship' + (rest.relationships.length > 1 ? 's' : '') : ''}; ${NEVER_APPLIED}`], { pins: { add_gulf_calendar: inputsPin(a) }, outputs: [path.basename(scriptFile)] })) }));
}));

// (0.3.0 T1, C1: the HR tester refused a 32-file report plan when she wanted one script) only the Arabic calendar columns
// for the model's own date table: the same script an Arabic report writes (monthOffer, one builder), planned and
// approved like every script ('calendar' plan), written next to the project; no report, no new table
function arabicColumnsOnly(m, a) {
  const scriptDir = m.folder ? m.projectDir : path.dirname(inside(a.path));
  const scriptBase = m.folder ? path.basename(m.folder).replace(/\.(SemanticModel|Dataset)$/i, '') : path.basename(inside(a.path)).replace(/\.[^.]+$/, '');
  if (!scriptDir) throw new Error('Nothing was written: the working folder is the model folder itself, and a script is never written inside a model folder. Choose the project folder (the folder that holds the model folder) as the working folder and ask again.');
  const co = calendarOffer({ m }, null, scriptBase);
  if (!co.offered) throw new Error(`Nothing was written: no Arabic calendar columns can be added: ${co.why}.${(co.leftOut || []).length ? ` Left out: ${co.leftOut.map((x) => `${x.table || x.column}: ${x.why}`).join('; ')}.` : ''}`);
  const said = { table: co.table, dateColumn: co.dateColumn, columns: co.columns.length, columnNames: co.columns.map((c) => c.name), ...(co.leftOut ? { leftOut: co.leftOut } : {}), ...(co.note ? { note: co.note } : {}),
    afterApply: 'Then the Arabic columns are in the date table: an Arabic report (plan_layout with lang "ar", or create_arabic_twin) binds them, and any visual can show them.' };
  const pin = inputsPin(a);
  if (a.planId != null && a.planId !== '') {
    Plans.gate('add_gulf_calendar', a.planId, modelRef(m, a.path), pin);
    const file = withPlan(a.planId, 'add_gulf_calendar', () => { sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(m)); return writeScript(scriptDir, scriptBase + ' - Arabic calendar', co.script); });
    return text(Object.assign({ written: true, scriptFile: file }, said, { scriptIs: scriptIsSaid(`${co.columns.length} Arabic calendar columns`), howToApplyScript: APPLY_STEPS.slice(), howToApply: co.howToApply }));
  }
  const name = path.basename(scriptNameNow(scriptDir, scriptBase + ' - Arabic calendar', co.script));
  return text(Object.assign({ written: false, scriptAfterGo: name }, said, {
    plan: Plans.proposal(Plans.propose('calendar', modelRef(m, a.path), [`the TMDL script "${name}" ${whereSaid(scriptDir)}, adding ${co.columns.length} Arabic calendar column${co.columns.length === 1 ? '' : 's'} to your date table ${JSON.stringify(co.table)}; no report and no new table; ${NEVER_APPLIED}`], { pins: { add_gulf_calendar: pin }, outputs: [name] })) }));
}

// rc.22, B-139 (the twin's approval page listed internal ids): each approved text named by what it is and its own text,
// as the plan shows it (texts that read like an instruction stay withheld)
const TWIN_KIND = { page: 'Page name', button: 'Button', title: 'Title', textbox: 'Text box', field: 'Field name', bookmark: 'Bookmark', titleMeasure: 'Chart title (from a title measure)', measureText: 'Text of a report measure', altText: 'Alt text', blankText: 'Text when there is no data', buttonTooltip: 'Button tooltip', text: 'Text' };
const twinNames = (P) => Object.fromEntries(P.texts.filter((t) => P.labels[t.id] != null).map((t) => [t.id, `${t.phone ? 'Phone layout: ' : ''}${t.kind === 'button' && t.goesTo ? 'Page button' : TWIN_KIND[t.kind] || 'Text'}${t.text != null ? ` "${t.text}"` : ' (withheld: reads like an instruction)'}${t.labelFrom ? ` (${t.labelFrom})` : ''}`]));
server.registerTool('create_arabic_twin', {
  title: 'Create the Arabic twin of a report',
  description: 'Makes the right-to-left Arabic twin of an existing PBIR report: a new "<name> AR" report and .pbip next to the original (or, with into "same", one copy "<name> (EN-AR)" holding the English pages and their Arabic pages, with a language button on each page to its counterpart and the slicers of each pair in sync), on the same model, every page mirrored in place (each visual\'s place mirrored, groups included; bar charts growing from the right; column, line and area charts with the value axis at the right and their order reversed by the sort; legends, titles, text boxes and table columns to the right), page ids, visual names and bookmarks kept so navigation keeps working. The original is only read, never changed; nothing is ever written over. Without planId it writes nothing and answers the plan: the pages, what mirrors, what cannot (custom visuals, the page navigator\'s order, Power BI\'s own words, data values), every text of the report with an id for its Arabic (the phone layout, alt texts and the empty state too; the phone layout is mirrored like the pages), what stays English and why (notTranslated), and the Arabic month column offered as a TMDL script the user applies. The Arabic texts are DRAFTS for the user to approve: pass the approved ones as labels to get a plan id for exactly those; never translate silently. After the user\'s go: approve_plan, then this tool with planId.' + REPORT_UNTRUSTED + UNTRUSTED,
  inputSchema: {
    path: z.string().describe('The original report: its .pbip file or its .Report folder, inside the working folder'),
    labels: z.record(z.string().max(200), z.string().max(200)).optional().describe('The Arabic texts the user approved, by the text ids of the plan ({ "page:<id>": "...", "title:<page>/<visual>": "...", "field:<queryRef>": "..." }). A text without a label stays as it is'),
    terms: z.record(z.string().max(300), z.string().max(200)).optional().describe('The terminology sheet\'s terms the user approved, one Arabic name per field: { "Table[Field]": "الاسم" }, or the field\'s English name to keep it in English. A term is written on every header of its field and every title, tooltip and alt text made of its name, the same word everywhere (terminology in the answer: ask its askNext, one at a time)'),
    timeRightToLeft: z.boolean().default(true).describe('Charts over time (months, dates) run right to left like the rest of the page (default); false keeps time left to right. The user\'s choice'),
    waterfallRtl: WATERFALL_RTL_INPUT(),
    arabicMonth: z.boolean().default(true).describe('Offer (and after the go write) the TMDL script that adds an Arabic month name column to the date table; the user applies it in TMDL view'),
    mirrorPicturePages: z.boolean().default(false).describe('A page drawn on a background picture is kept left to right by default (Power BI has no setting that mirrors the picture, so mirrored visuals would leave its panels); true mirrors such pages anyway. The plan names them: ask the user'),
    into: z.enum(['separate', 'same']).optional().describe('"separate" (the default): the twin is its own report "<name> AR". "same": ONE report holding both languages, a copy "<name> (EN-AR)" next to the original (never the original itself): its English pages as they are and their Arabic pages, a language button on every page to its counterpart, the slicers of each page pair kept in sync. Only when the user asks for one report with both languages'),
    tabsShown: z.enum(['en', 'ar']).optional().describe('With into "same": the pages shown in the tabs; the other language\'s are hidden and reached by the language button. "en" (the default) or "ar"'),
    textsFrom: z.number().int().min(0).max(100000).optional().describe('The plan only: list the texts from this one on (moreTexts.from in an answer that could not list them all); the plan and what is written stay the same'),
    planId: planIdInput
  }, annotations: ADDS
}, safe(async (a) => {
  if (a.labels && Object.keys(a.labels).length > 400) throw new Error('At most 400 labels in one plan.');
  const key = twinKey(a.path);
  if (a.planId != null && a.planId !== '') { const P = Plans.gate('create_arabic_twin', a.planId, key); return text(withPlan(a.planId, 'create_arabic_twin', () => writeTwin(a, P))); }
  const P = planTwin(a);
  if (!P.answer.twin.nameFree) throw new Error(`Nothing was written: "${P.answer.twin.report}" or "${P.answer.twin.pbip}" is already there. DataArcus never writes over a file: rename or move the old twin, then ask again.`);
  const LG = P.answer.languages;
  const writes = [LG ? `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original: its ${LG.pairs.length} English pages as they are and their ${LG.pairs.length} Arabic pages (${P.answer.labels.given} Arabic texts as approved), ${LG.buttons.filter((b) => b.placed).length} language buttons, ${LG.syncGroups.length} slicer pairs kept in sync, the ${P.copy.tabsShown === 'ar' ? 'English' : 'Arabic'} pages hidden in the tabs; the original is not changed`
    : `the new report "${P.answer.twin.report}" and "${P.answer.twin.pbip}" next to the original (${P.answer.pages.length} pages mirrored, ${P.answer.labels.given} Arabic texts as approved); the original is not changed`]
    .concat(P.month.offered ? [`the TMDL script "${P.month.scriptAfterGo}" ${whereSaid(path.dirname(inside(a.path)))} (the Arabic calendar columns: ${(P.month.columns || []).length || 1}); ${NEVER_APPLIED}`] : []);
  // (0.3.1 V1) the approval page draws each Arabic page from the plan's own build (kept with the plan, never in the answer)
  P.answer.approvalPreview = `The approval page shows each Arabic page as it will be written${LG ? ', beside its English page' : ''}: where each visual goes, its type and its Arabic title${LG ? ', and the language buttons' : ''} (grey placeholders, never data). Tell the user to look at it before Approve.`;
  return compact(Object.assign(P.answer, { plan: Plans.proposal(Plans.propose('twin', { key, print: P.modelPrint }, writes, { preview: twinPreview(P), labels: P.labels, terms: P.terms, terminology: P.termRows.map(({ where, ...r }) => Object.assign(r, { places: where.length })), modelPrint: P.modelPrint, names: twinNames(P), notTranslated: P.notTranslated.map((x) => ({ field: `${x.text != null ? `"${x.text}"` : '(withheld: reads like an instruction)'} (${x.where})`, why: x.why })), timeRightToLeft: a.timeRightToLeft !== false, waterfallRtl: Gallery.waterfallRtlOf(a.waterfallRtl), arabicMonth: a.arabicMonth !== false, mirrorPicturePages: a.mirrorPicturePages === true, source: reportPrint(a.path), outputs: twinOutputs(P),
    // (0.3.0 T1, T-7) the options the report uses: its waterfalls and its pages drawn on a picture, counted
    waterfalls: (P.answer.mirrors || []).filter((x) => /^waterfall/.test(x.kind)).reduce((n, x) => n + (x.count || 0), 0) + ((P.answer.cannot || []).find((x) => /waterfall/.test(x.what)) || { where: [] }).where.length, picturePages: (P.answer.picturePages || []).length, matrices: (P.answer.cannot || []).some((x) => x.what === 'matrices') ? MATRIX_SAID : null,
    ...(LG ? { into: 'same', tabsShown: P.copy.tabsShown, languages: { copy: LG.copy, pairs: LG.pairs, buttons: LG.buttons, syncGroups: LG.syncGroups, tabs: LG.tabs, bookmarks: LG.bookmarks, measures: LG.measures || [] } } : {}) })) }), TWIN_CAP);
}));

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
