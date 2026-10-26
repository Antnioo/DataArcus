// The add_gulf_calendar tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { z } from 'zod';
import { loadModel, inside, refuseUnreadable } from '../lib/model.mjs';
import { withPlan } from '../lib/files.mjs';
import { addGulfCalendar } from '../lib/gulf-calendar.mjs';
import { modelPrintOf } from '../lib/artifact.mjs';
import * as Plans from '../lib/plans.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { columnsByKind } from '../lib/gulf-calendar.mjs';
import { scriptIs as scriptIsSaid, APPLY_STEPS, whereSaid, NEVER_APPLIED, NEVER_APPLIED_AR } from '../lib/plain-words.mjs';
import { monthOffer as calendarOffer } from '../lib/arabic-twin.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { planIdInput, ADDS_SAME, modelPath } from '../lib/tool-inputs.mjs';
import { modelRef, sameModelBeforeWrite, inputsPin } from '../lib/plan-keys.mjs';
import { freeScriptName, writePlannedScript } from '../lib/fix-scripts.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Gulf = require('../../assets/js/gulf-health.js');
const Fix = require('../../assets/js/model-health-tmdl.js');

// the file the plan names, chosen now and not written (a plan names the file its click writes: 0.3.0 A1)
const scriptNameNow = (dir, base, script) => freeScriptName(dir, base, script);
// (0.3.1 AF2, the release audit's F09 and F10) the write: the model read again right before it (changed since the gate:
// nothing is written), then the file the approved plan named (outputs), or nothing: never another name
const plannedWriter = (a, m) => (dir, base, script) => {
  sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(m));
  const name = ((((Plans.planOf(a.planId) || {}).data) || {}).outputs || [])[0];
  if (!name) throw new Error(`Nothing was written: plan ${a.planId} names no script file. Make the plan again (call add_gulf_calendar without planId), show it to the user and wait for their go.`);
  return writePlannedScript(dir, name, script);
};

export function register(server, ctx) {
  server.registerTool('add_gulf_calendar', {
    title: 'Add a Gulf calendar table',
    description: 'Writes the DataArcus Calendar Generator\'s date table for a Gulf model (Hijri year, month and day, Ramadan and Eid flags and Ramadan Day, the UAE\'s announced Ramadan and Eid dates with later ones marked as estimates, and the official weekend of the chosen country with the dates it changed) as a TMDL script in a new file next to the project, only with an approved planId: called without one it checks everything, says what it would write and gives a proposed planId (show the user, wait for go, approve_plan, then call again with planId). The user applies it in Power BI Desktop\'s TMDL view after checking Preview; this tool never writes into the model, never returns the DAX and never overwrites a file. firstYear and lastYear are required: ask the user which years their data covers (the tool returns no data values). It refuses, writing nothing, when the model already has a table, measure or column with the table\'s name, when a relateTo column is missing or is not a date, and when the years are outside Power BI\'s dates or more than 60. Relationships are written only for the relateTo columns the user names (a column whose type the files don\'t give is accepted with a note); Month Name, Day Name and Hijri Month Name (and their (Arabic) columns) are sorted by their numbers in the script; marking the date table is a step by hand in the answer. Tell the user every step and note.' + UNTRUSTED,
    inputSchema: {
      path: modelPath.describe('The model the table is for (read for name clashes and the relateTo columns); the script file goes next to it'),
      firstYear: z.number().int().optional().describe('First year of the calendar (1 January). Ask the user: the years their data covers. Needed unless arabicColumnsOnly'),
      lastYear: z.number().int().optional().describe('Last year of the calendar (31 December); at most 60 years in all. Needed unless arabicColumnsOnly'),
      arabicColumnsOnly: z.boolean().optional().describe('Only when the user wants Arabic month, day and flag names on their OWN date table, without a report: no new table; the script adds the Arabic calendar columns (each sorted like its English column) to the model\'s date table, as an Arabic report\'s script does. The years and country are not needed'),
      country: z.enum(['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn']).default('uae').describe('The country whose official weekend the table uses (with the dates it changed) and that the answer names'),
      weekend: z.enum(['country', 'shj', 'sat-sun', 'fri-sat', 'fri', 'sun']).default('country').describe('country (default): the country\'s official weekend; shj: Sharjah\'s government (Friday to Sunday from 2022, Friday and Saturday before); or a fixed weekend for a company whose weekend differs'),
      announced: z.boolean().default(true).describe('Ramadan, Shawwal and Dhu al-Hijjah on the UAE\'s announced dates, for every country (later ones are Umm al-Qura estimates); false: Umm al-Qura only'),
      lang: z.enum(['en', 'ar']).default('en').describe('Language of the month, day and Hijri month names in the table (the column names stay English)'),
      arabicNames: z.boolean().default(true).describe('Also write Day Name (Arabic), Month Name (Arabic) and Hijri Month Name (Arabic), sorted by their numbers, so an Arabic report can show Arabic names, and the Arabic labels of the quarters, fiscal year and quarter and the flags (with lang "ar" the names are Arabic already: only those labels)'),
      name: z.string().max(80).default('Gulf Calendar').describe('The new table\'s name: letters, digits, spaces and _, at most 40 characters. Never the name of a table, measure or column the model has'),
      weekStart: z.enum(['sunday', 'monday', 'saturday']).default('sunday').describe('The first day of the week for Day of Week and Week Start'),
      fiscalStart: z.number().int().min(1).max(12).default(1).describe('The month the fiscal year starts'),
      relateTo: z.array(z.string()).max(5).optional().describe('Date columns of the user\'s fact tables to relate to the new table\'s Date, as "Table[Column]" (many to one, single direction). Only columns the user names'),
      asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('The date the self-check counts as today (YYYY-MM-DD; default: today). For tests'),
      planId: planIdInput
    }, annotations: ADDS_SAME
  }, safe(async (a) => {
    const m = refuseUnreadable(loadModel(a.path));   // (AU47) nothing is planned on part of a model
    if (a.arabicColumnsOnly) return arabicColumnsOnly(m, a);
    if (a.firstYear == null || a.lastYear == null) throw new Error('Nothing was written: firstYear and lastYear are needed (ask the user the years their data covers); for Arabic names on the model\'s own date table only, pass arabicColumnsOnly true instead.');
    // the gate (0.2.9): with an approved plan the script is written; without one every check runs and the file is only named
    const write = a.planId != null && a.planId !== '' && !!Plans.gate('add_gulf_calendar', a.planId, modelRef(m, a.path), inputsPin(a));
    // the script's place, as check_model_health's fix scripts: next to the project, never inside the model folder
    const scriptDir = m.folder ? m.projectDir : path.dirname(inside(a.path));
    const scriptBase = m.folder ? path.basename(m.folder).replace(/\.(SemanticModel|Dataset)$/i, '') : path.basename(inside(a.path)).replace(/\.[^.]+$/, '');
    // (0.3.0 T1, T-4) the write answer says what the file is and the 3 steps, as the plan did; the columns lead grouped
    if (write) return text(withPlan(a.planId, 'add_gulf_calendar', () => { const r = addGulfCalendar(m, a, { Gulf, Fix, writeScript: plannedWriter(a, m), scriptDir, scriptBase }); return Object.assign({ columnsByKind: columnsByKind(r.columns) }, r, { scriptIs: scriptIsSaid('the calendar table'), howToApplyScript: APPLY_STEPS.slice() }); }));
    const { scriptFile, howToApply, columns, ...rest } = addGulfCalendar(m, a, { Gulf, Fix, writeScript: scriptNameNow, scriptDir, scriptBase });
    return text(Object.assign({ written: false, scriptAfterGo: path.basename(scriptFile), columnsByKind: columnsByKind(columns) }, rest, { howToApplyAfterGo: howToApply,
      plan: Plans.proposal(Plans.propose('calendar', modelRef(m, a.path), [`the TMDL script "${path.basename(scriptFile)}" ${whereSaid(scriptDir)}, adding the table ${JSON.stringify(rest.table)} (${rest.range.from} to ${rest.range.to})${rest.relationships.length ? ' and ' + rest.relationships.length + ' relationship' + (rest.relationships.length > 1 ? 's' : '') : ''}; ${NEVER_APPLIED}`], { pins: { add_gulf_calendar: inputsPin(a) }, outputs: [path.basename(scriptFile)],
        // (SQ3, T1-S6) the same line in Arabic, for the page of a plan with Arabic names
        writesAr: [`سكربت TMDL «${path.basename(scriptFile)}» ${whereSaid(scriptDir, undefined, true)}، يضيف الجدول «${rest.table}» (من ${rest.range.from} إلى ${rest.range.to})${rest.relationships.length ? `، والعلاقات: ${rest.relationships.length}` : ''}؛ ${NEVER_APPLIED_AR}`] })) }));
  }));
}

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
    const file = withPlan(a.planId, 'add_gulf_calendar', () => plannedWriter(a, m)(scriptDir, scriptBase + ' - Arabic calendar', co.script));
    return text(Object.assign({ written: true, scriptFile: file }, said, { scriptIs: scriptIsSaid(`${co.columns.length} Arabic calendar columns`), howToApplyScript: APPLY_STEPS.slice(), howToApply: co.howToApply }));
  }
  const name = path.basename(scriptNameNow(scriptDir, scriptBase + ' - Arabic calendar', co.script));
  return text(Object.assign({ written: false, scriptAfterGo: name }, said, {
    plan: Plans.proposal(Plans.propose('calendar', modelRef(m, a.path), [`the TMDL script "${name}" ${whereSaid(scriptDir)}, adding ${co.columns.length} Arabic calendar column${co.columns.length === 1 ? '' : 's'} to your date table ${JSON.stringify(co.table)}; no report and no new table; ${NEVER_APPLIED}`], { pins: { add_gulf_calendar: pin }, outputs: [name],
      writesAr: [`سكربت TMDL «${name}» ${whereSaid(scriptDir, undefined, true)}، يضيف أعمدة التقويم العربية (${co.columns.length}) إلى جدول التاريخ لديك «${co.table}»؛ دون تقرير ودون جدول جديد؛ ${NEVER_APPLIED_AR}`] })) }));
}
