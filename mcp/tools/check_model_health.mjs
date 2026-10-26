// The check_model_health tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import path from 'node:path';
import { z } from 'zod';
import { loadModel, inside, applyColumnTypes, visible, ROOT, unreadableOf, refuseUnreadable } from '../lib/model.mjs';
import { planWrites } from '../lib/files.mjs';
import { AIM } from '../lib/scope.mjs';
import { gulfFixInputs } from '../lib/gulf-calendar.mjs';
import * as Plans from '../lib/plans.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { whereSaid, NEVER_APPLIED } from '../lib/plain-words.mjs';
import { readAnswers, Memory, answerKey, writeAnswers, answersName, REPLACES } from '../lib/answers.mjs';
import { fitLists, out } from '../lib/answer.mjs';
import { pretty, text, safe } from '../lib/tool-answer.mjs';
import { planIdInput, ADDS, modelPath } from '../lib/tool-inputs.mjs';
import { modelRef, sameModelBeforeWrite } from '../lib/plan-keys.mjs';
import { notWrittenWhy, freeScriptName, plannedTaken, writePlannedScript, hasControl, scriptTables, formatsAnswer } from '../lib/fix-scripts.mjs';
import { hiddenOf } from '../lib/hidden-names.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Health = require('../../assets/js/model-health-engine.js');
const Fix = require('../../assets/js/model-health-tmdl.js');
const Gulf = require('../../assets/js/gulf-health.js');

// The DAX query that reads every column's type from the model open in Power BI Desktop (run it with Microsoft's
// Power BI Authoring MCP). INFO.COLUMNS gives the Tabular DataType numbers; a column Power BI names or types from DAX
// has them in InferredName / InferredDataType. Its rows go into check_model_health's columnTypes as Table[Column]: type.
const COLUMN_TYPES_QUERY = [
  'EVALUATE',
  'VAR _Tables = SELECTCOLUMNS ( INFO.TABLES (), "TableID", [ID], "Table", [Name] )',
  'VAR _Columns =',
  '    SELECTCOLUMNS (',
  '        FILTER ( INFO.COLUMNS (), [Type] <> 3 ),',
  '        "TableID", [TableID],',
  '        "Column", IF ( [ExplicitName] = "", [InferredName], [ExplicitName] ),',
  '        "Type", IF ( [ExplicitDataType] IN { 1, 19 }, [InferredDataType], [ExplicitDataType] )',
  '    )',
  'RETURN SELECTCOLUMNS ( NATURALLEFTOUTERJOIN ( _Columns, _Tables ), "Table", [Table], "Column", [Column], "Type", [Type] )'
].join('\n');

export function register(server, ctx) {
  server.registerTool('check_model_health', {
    title: 'Check model health',
    description: 'Runs the DataArcus Model Health Check: score, and every finding with the objects it concerns (unused columns and measures, risky relationships, slow DAX, date tables...). Reads a project saved by Power BI Desktop (TMDL or model.bim), a model.bim or a .pbit. The model is never changed. Ready fix scripts (sort order, number formats) are written to new files next to the project only with an approved planId: called without one, it returns every finding, names the script files it would write and gives a proposed planId (show the user, wait for go, approve_plan, then call again with planId); a script is never returned as text and never applied. With a country, the gulfCalendar section is not part of the score, and say so: for its fixes point to the Calendar Generator settings the answer gives, or offer add_gulf_calendar with the inputs in fixes.addGulfCalendar (it writes the table as a script file), and never write calendar DAX yourself. pleaseConfirm lists questions for the user, never fixes: ask the user, and never edit DAX because of them.' + UNTRUSTED,
    inputSchema: {
      path: modelPath, maxItems: z.number().int().min(1).max(200).default(15).describe('Objects listed per finding'),
      weekStart: z.enum(['sunday', 'monday', 'saturday']).default('sunday').describe('The first day of the week, used only when a fix script has to add a weekday number column to sort day names: sunday (default: Saudi Arabia and most of the Gulf), monday (a Saturday-Sunday weekend, as in the UAE since 2022), or saturday'),
      country: z.enum(['uae', 'ksa', 'qat', 'kwt', 'bhr', 'omn']).optional().describe('For a Gulf model: the country whose official weekend the calendar is checked against (uae, ksa, qat, kwt, bhr, omn). Giving it adds the gulfCalendar section (not part of the score): Hijri, Ramadan and Eid columns, the weekend, the Ramadan and Eid dates, the range of the calendar. Without it the section appears only when the model already has Hijri or Ramadan columns, checked for the UAE. It never changes weekStart'),
      asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('The date the gulfCalendar section counts as today (YYYY-MM-DD; default: today). For tests'),
      planId: planIdInput,
      // (0.3.0 Q1) the parts of the answer to show: on a large model the lists are shortened to fit one answer
      only: z.array(z.string().max(40)).min(1).max(20).optional().describe('Only these parts of the answer, for the rest of a list the answer shortened (listsCut says so): finding ids (findings[].id, skipped.checks[].id), fix names (MONTH_SORT, NO_FORMAT, PCT_FORMAT, THOUSANDS, FORMATS), "pleaseConfirm" or "gulfCalendar". The score, the scripts and what is written stay the same'),
      // (B-148) the user's answers to pleaseConfirm questions, remembered in a file next to the model (with an approved plan)
      answers: z.array(z.object({ answerKey: z.string().max(64), answer: z.enum(['intended', 'mistake']) }).strict()).max(200).optional()
        .describe('Only with the user\'s own answers to pleaseConfirm questions: { answerKey (from the question), answer: intended (the user says it is right) or mistake }. Recorded in "<model>.dataarcus-answers.json" next to the model (hashes, the answer and its date; no name, no DAX) after an approved plan, like the fix scripts; the question is not asked again until its measure or relationship changes. Never answer for the user'),
      forgetAnswers: z.boolean().optional().describe('The user asked to forget their recorded answers: empties the answers file (after an approved plan)'),
      columnTypes: z.record(z.string(), z.union([z.string(), z.number()])).optional()
        .describe('Only when a TMDL project skipped checks: column types read from the same model open in Power BI Desktop, as { "Table[Column]": type }. The type is a model.bim name (string, int64, double, decimal, dateTime, boolean) or the number INFO.COLUMNS returns (2, 6, 8, 10, 9, 11), also as text. Fills only columns the files leave without a type.')
    }, annotations: ADDS
  }, safe(async ({ path: p, maxItems, columnTypes, weekStart, country, asOf, planId, answers, forgetAnswers, only }) => {
    const m = loadModel(p);
    // (AU47, the night audit's AUD-047) a definition file that could not be read fully: no score, the findings the check
    // could still make marked partial, no script plan; with a planId nothing is written
    if (m.skipped.length) { if (planId != null && planId !== '') refuseUnreadable(m); return text(healthFit(partialHealth(m, maxItems), only)); }
    const wouldWrite = [];
    const AFTER_GO = 'the user has not approved it. Tell the user which script files this check would write, wait for their go, call approve_plan with the planId of this answer and the user\'s reply, then call check_model_health again with planId.';
    // where a fix script may go: next to the project (never inside the model folder), or beside a model file. When the
    // working folder is the model folder itself there is no such place inside it: no file, and the answer says why
    const scriptDir = m.folder ? m.projectDir : path.dirname(inside(p));
    const scriptBase = m.folder ? path.basename(m.folder).replace(/\.(SemanticModel|Dataset)$/i, '') : path.basename(inside(p)).replace(/\.[^.]+$/, '');
    // (0.3.1 AF2, the release audit's F09) each script's file is named by the plan (the free name now, scriptNames in its
    // data) and shown; the write queues each script under that name and writes them all after checking every name
    const scriptNames = {}, queue = [];
    const put = (dir, base, script) => { const name = planNames[base]; queue.push({ base, name, script, file: name ? path.join(dir, name) : null }); return path.join(dir, name || base + '.tmdl'); };
    let planNames = {};
    const scriptAnswer = (what, script, refresh) => {
      if (!script) return {};
      if (!scriptDir) return { scriptNotWritten: 'The working folder is the model folder itself, and a script is never written inside a model folder. Choose the project folder (the folder that holds the model folder) as the working folder and ask again; until then use the object names above and make the changes by hand in Power BI Desktop.' };
      const base = scriptBase + ' - fix ' + what;
      if (!write) { const name = path.basename(freeScriptName(scriptDir, base, script)); scriptNames[base] = name; wouldWrite.push(name); return { scriptAfterGo: name, notWrittenYet: 'Not written yet: ' + AFTER_GO }; }
      const file = put(scriptDir, base, script);
      return { fixScriptFile: file, howToApply: 'The script is in the file "' + path.basename(file) + '", next to the project. ' + howToApply + (refresh ? refreshAfter : '') };
    };
    const typed = columnTypes ? applyColumnTypes(m, columnTypes) : undefined;   // (A1-6: both views)
    const r = Health.analyze(m.tmsl, m.report);
    // (B-148) the answers given before (the file next to the model), and the new ones: each a record of hashes and the
    // answer, pinned in the plan without its date, so the write records exactly what the user approved
    const mem = readAnswers(scriptDir, scriptBase), applied = Memory.apply(r.confirm || [], mem.records, r.rawTables);
    const byKey = new Map(applied.ask.concat(applied.answered.map((x) => x.question)).map((q) => [answerKey(q.signature), q]));
    const answersNotRecorded = (answers || []).filter((a) => !byKey.has(a.answerKey)).map((a) => ({ answerKey: a.answerKey, why: 'No question with this answerKey is asked on this model now (the measure or relationship changed, or the key is wrong): nothing is recorded for it.' }));
    const given = (answers || []).filter((a) => byKey.has(a.answerKey)).map((a) => { const x = Memory.record(byKey.get(a.answerKey), a.answer, r.rawTables); delete x.at; return x; });
    const answerPin = given.length ? given : undefined, writeAnswersFile = !!forgetAnswers || given.length > 0;
    // the gate (0.2.9): the scripts are written only with an approved plan; without one they are named, for after go
    const pinH = { path: p, maxItems, columnTypes, weekStart, country, asOf, answers: answerPin, forgetAnswers: forgetAnswers || undefined };
    const print0 = m.print, gated = planId != null && planId !== '' ? Plans.gate('check_model_health', planId, modelRef(m, p), pinH) : null, write = !!gated;
    if (gated) planNames = (gated.data && gated.data.scriptNames) || {};
    // (0.3.0 R4, F06: every write of this call follows the plan policy: files.mjs planWrites)
    const pw = write ? planWrites(planId, 'check_model_health') : null;
    // ready fixes for three findings, as TMDL scripts the user applies in Power BI Desktop (TMDL view); nothing is ever
    // applied by this tool. What a script can't do safely is listed as steps by hand, never guessed.
    // AUD-032 (round 20): a name with a control character (a tab, a line break) is never written raw into a fix script:
    // such tables, columns and measures are left out of what the scripts are built from (the scripts touch only the
    // objects they name, under "ref table"), and the answer names them, escaped
    const { raw0, raw, skipped: scriptSkip } = scriptTables(m), cc = hasControl;
    const itemsOf = (id) => ((r.findings.find((f) => f.id === id) || {}).items || []).concat((((r.skipped || []).find((s) => s.id === id)) || {}).items || []);
    const howToApply = 'Tell the user: save a copy of the Power BI file first; open the script file in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview to see the changes, then Apply. The script is a suggestion: it is never applied by this tool. It holds the model\'s own definitions (expressions, descriptions) of the objects it changes, which is why it is in a file and not in this answer: don\'t read the file into the conversation unless the user asks.';
    // measured in Power BI Desktop 2.158: after a script that adds a column, every visual shows an error until the
    // yellow bar's "Refresh now" is pressed
    const refreshAfter = ' This script adds a column: after Apply, press "Refresh now" in the yellow bar at the top of the report (until then every visual shows an error).';
    const fixes = {};
    {
      const cols = itemsOf('MONTH_SORT').map((i) => String(i.obj).match(/^(.*)\[(.*)\]$/)).filter(Boolean).map((x) => ({ table: x[1], column: x[2] }));
      // (round 22, the code review's g) a column left out for a control character in its name is not "not found", and
      // its table's number column is not added a second time beside one whose name holds such a character: both are
      // steps by hand, with the reason
      const ccHand = [], plain = (x) => String(x).replace(/\p{Cc}/gu, '').trim().toLowerCase();
      const ask = cols.filter((c) => { if (!cc(c.table) && !cc(c.column)) return true; ccHand.push({ column: `${visible(c.table)}[${visible(c.column)}]`, why: 'its name holds a control character (a tab or a line break): no script names it', steps: 'Rename the column in Power BI Desktop (remove the hidden character), then check the model again.' }); return false; });
      let s = ask.length ? Fix.sortFixes(raw, ask, { weekStart }) : { sorts: [], byHand: [], script: '', weekStart };
      const twin = (x) => { if (!x.added) return null; const mt = String(x.by).match(/^(.*)\[(.*)\]$/), tb = mt && raw0.find((q) => q.name === mt[1]); return (tb && (tb.columns || []).find((c) => cc(c.name) && plain(c.name) === plain(mt[2]))) || null; };
      const twins = s.sorts.filter(twin);
      if (twins.length) { const names = new Set(twins.map((x) => x.column)), rest = ask.filter((c) => !names.has(`${c.table}[${c.column}]`));
        twins.forEach((x) => ccHand.push({ column: x.column, why: `its number column, ${visible(twin(x).name)}, holds a control character (a tab or a line break) in its name: no script names it, and a second column of the same name is not added`, steps: 'Rename that number column in Power BI Desktop (remove the hidden character), then Column tools > Sort by column; or check the model again after renaming.' }));
        s = rest.length ? Fix.sortFixes(raw, rest, { weekStart }) : { sorts: [], byHand: [], script: '', weekStart }; }
      s.byHand = (s.byHand || []).concat(ccHand);
      if (cols.length) {
        fixes.MONTH_SORT = Object.assign({ weekStart: s.weekStart, weekStartNote: s.sorts.some((x) => x.added && /Day of Week/.test(x.by)) ? `A weekday number column is added with the week starting on ${s.weekStart}; call again with weekStart: 'sunday', 'monday' or 'saturday' for another start.` : undefined,
          sorts: s.sorts, byHand: s.byHand }, scriptAnswer('sort order', s.script, s.sorts.some((x) => x.added))); }
      for (const [id, percent] of [['NO_FORMAT', false], ['PCT_FORMAT', true]]) {
        const names = itemsOf(id).map((i) => String(i.obj).replace(/^\[|\]$/g, '')).filter((n) => !cc(n));   // (round 22, g: named under scriptsSkip, never "not found")
        if (!names.length) continue;
        // the script and its list cover maxItems measures (as the findings list their objects), and stay under 30,000
        // characters: on a large model the whole script was the biggest part of the answer (measured: 147,000 characters)
        let n = Math.min(names.length, maxItems), s = Fix.formatFixes(raw, names.slice(0, n), { percent });
        while (n > 1 && String(s.script || '').length > 30000) { n = Math.floor(n * 0.7); s = Fix.formatFixes(raw, names.slice(0, n), { percent }); }
        const covers = n < names.length ? { covers: { measures: n, of: names.length, note: `The script and the list cover the first ${n} of ${names.length} measures. Call again with a larger maxItems (up to 200) for more; a script is kept under 30,000 characters.` } } : {};
        fixes[id] = Object.assign({ suggested: s.suggested, byHand: s.byHand }, covers, scriptAnswer(percent ? 'percentage formats' : 'number formats', s.script, false));
      }
    }
    // thousand separators (round 6): not a finding and not in the score. Measures and summed number columns whose format
    // has no separator (13857, not 13,857), with the script that adds it. A table, a tooltip and a card with display
    // units off take a number's format from the model, so this is where it is fixed.
    {
      const s = Fix.separatorFixes(raw, { max: maxItems });
      if (s.measures.length || s.columns.length || s.byHand.length) fixes.THOUSANDS = Object.assign({
        note: 'Not a finding and not part of the score. These numbers show without a thousand separator (13857, not 13,857) wherever Power BI takes the format from the model: tables, tooltips, cards and labels with display units off.',
        measures: s.measures, columns: s.columns, byHand: s.byHand },
        s.more ? { covers: { note: `${s.more} more are not listed. Call again with a larger maxItems (up to 200).` } } : {}, scriptAnswer('thousand separators', s.script, false));
    }
    // formats fixed at the source (the owner's ask, 6 Oct 2026): every measure and column whose format is not the right
    // one by the shared rule, in one script; plan_layout and create_report hand over this same file
    {
      const f = formatsAnswer(m, p, null, maxItems, write, AFTER_GO, put);
      if (f && f.scriptAfterGo) { wouldWrite.push(f.scriptAfterGo); scriptNames[scriptBase + ' - fix formats'] = f.scriptAfterGo; }
      if (f) fixes.FORMATS = Object.assign({ note: 'Not a finding and not part of the score. The right format of each measure and column by one rule: a ratio 0.0%, a count or whole number #,0, money its own currency format, other numbers #,0.00, a date dd mmm yyyy; anything already well formatted is left alone. plan_layout and create_report name the same fixes and hand over the same file.' }, f);
    }
    // the Gulf calendar check: its own section, never scored; shown when a country is given or the model already has
    // Hijri or Ramadan columns. Read from the model files only; its fixes name the website tools and their settings.
    const gulfCalendar = country || Gulf.hasGulfColumns(m.tmsl) ? Gulf.analyze(m.tmsl, { country: country || 'uae', asOf, maxItems }) : undefined;
    // the same fix as add_gulf_calendar's inputs (the tool writes the generator's table as a script file)
    const addGulf = gulfFixInputs(gulfCalendar);
    if (addGulf) gulfCalendar.fixes.addGulfCalendar = addGulf;
    // (0.3.1 AF2, F10) right before the first write, the model read again: changed since the gate, nothing is written
    if (write) sameModelBeforeWrite(planId, () => loadModel(p).print, print0);
    // (AF2, F09) every name the plan showed checked before the first write: one taken by another file, nothing is written
    for (const q of queue) {
      if (!q.name) throw new Error(`Nothing was written: plan ${planId} did not name the script "${q.base}.tmdl" (the model's findings changed since the plan). Make the plan again (call check_model_health without planId), show it to the user and wait for their go.`);
      const taken = plannedTaken(scriptDir, q.name, q.script); if (taken) throw taken;
    }
    for (const q of queue) {
      try { pw.step(() => writePlannedScript(scriptDir, q.name, q.script)); } catch (e) {
        const fx = Object.entries(fixes).find(([, x]) => x && x.fixScriptFile === q.file);
        if (fx) { delete fx[1].fixScriptFile; delete fx[1].howToApply; fx[1].scriptNotWritten = notWrittenWhy(scriptDir, e) + (fx[0] === 'FORMATS' ? ' Set the formats by hand in Power BI Desktop.' : ' Use the object names above and make the changes by hand in Power BI Desktop.'); }
      }
    }
    // (B-148) the answers file: written only with the approved plan, which lists it; never without a place next to the model
    let answersDone = {}, shown = applied;
    if (writeAnswersFile && !scriptDir) answersDone = { answersNotWritten: 'The working folder is the model folder itself, and nothing is written inside a model folder: choose the project folder as the working folder to keep answers.' };
    else if (writeAnswersFile && write) {
      const at = new Date().toISOString(), fresh = given.map((x) => Object.assign({}, x, { at }));
      const recs = forgetAnswers ? fresh : applied.keep.filter((k) => !fresh.some((x) => x.evidenceSignature === k.evidenceSignature)).concat(fresh);
      // (R5, F04) replaced only if it is still the file read at the start of this call (mem.checked)
      try { const f = pw.step(() => writeAnswers(scriptDir, scriptBase, recs, mem)); answersDone = { answersFile: path.basename(f), recorded: fresh.length, forgotten: forgetAnswers ? mem.records.length : applied.stale.length }; shown = Memory.apply(r.confirm || [], recs, r.rawTables); }
      catch (e) {
        // (R5, F05) what the failed write left is named; whether the plan was used is pw.done()'s (R4), below
        const left = (e && e.left && e.left.ours) || [];
        answersDone = { answersNotWritten: String(e && e.message || e).slice(0, 600) };
        if (left.length) answersDone.answersLeftOnDisk = left.map((f) => path.relative(ROOT || '.', f).split(path.sep).join('/'));
      }
    }
    const planUse = pw ? pw.done() : null;   // (audit 6, A6-2; R4: unused only when a write failed and the disk is as approved)
    if (planUse && answersDone.answersNotWritten) answersDone.answersPlan = planUse;
    // the plan for the scripts (and the answers file), when there are any to write and no approved plan was given
    // (R5, F04) the plan says whether the file is new or replaces the one DataArcus wrote, and what is dropped from it
    const answersWrite = writeAnswersFile && scriptDir && !write ? [`the answers file "${answersName(scriptBase)}" ${whereSaid(scriptDir)}, ${mem.ours ? REPLACES : 'a new file'}: ${forgetAnswers ? 'emptied (the user\'s recorded answers forgotten)' : `the user's answers to ${given.length} "Please confirm" question${given.length === 1 ? '' : 's'}${mem.ours && applied.stale.length ? `; ${applied.stale.length} earlier answer${applied.stale.length === 1 ? '' : 's'} that no longer appl${applied.stale.length === 1 ? 'ies' : 'y'} dropped` : ''}`} (hashes, the answer and its date; no name, no DAX)`] : [];
    const plan = !write && (wouldWrite.length || answersWrite.length) ? { plan: Plans.proposal(Plans.propose('scripts', modelRef(m, p), wouldWrite.map((f) => `the fix script "${f}" ${whereSaid(scriptDir)} (${NEVER_APPLIED})`).concat(answersWrite), { pins: { check_model_health: pinH }, scriptNames, answersShown: (answers || []).filter((x) => byKey.has(x.answerKey)).map((x) => { const q = byKey.get(x.answerKey); return { object: q.obj, question: (q.message && q.message.en) || q.id, answer: x.answer }; }), forgetAnswers: !!forgetAnswers })) } : {};
    return text(healthFit({
      source: m.source, score: r.score, stats: r.stats, reportRead: !!m.report, ...plan, ...(planUse ? { planUse } : {}),
      // (rc.22, B-144) when no report was read, the answer says so and why, beside the unused-columns figures it leaves out
      ...(!m.report ? { reportNotRead: (m.reportsSeen && m.reportsSeen.notRead && m.reportsSeen.notRead.length ? `No report of this model could be read (${m.reportsSeen.notRead.map((x) => `"${x.report}": ${x.why}`).join('; ')}).` : m.reportsSeen && m.reportsSeen.counted.length === 0 ? 'No report of this model was found next to it (a .Report folder whose definition.pbir points at this model).' : 'No report was read: the model is not inside a project folder with its reports.') + ' So unused columns and measures were not checked (stats.unusedColumns and unusedMeasures are null): never tell the user that columns are unused.' } : {}),
      // (0.2.9 item 13) which reports beside the model were read: only this model's (lib/model.mjs, notThisModel)
      ...(m.reportsSeen && (m.reportsSeen.counted.length || m.reportsSeen.notCounted.length) ? { reports: Object.assign({}, m.reportsSeen, { note: 'Only the reports whose definition.pbir points at this model were read and counted; the others belong to another model or a published one and were not read. A broken field is fixed inside its visual (replace or remove the field in Power BI Desktop): never suggest deleting a report.' }) } : {}),
      fixes: Object.keys(fixes).length ? fixes : undefined,
      ...(scriptSkip.length ? { scriptsSkip: { names: scriptSkip.slice(0, 20), note: 'These names hold a control character (a tab or a line break, shown as a code point): no fix script names them, as it would break the script. Tell the user; renaming them in Power BI Desktop lets the scripts include them.' } } : {}),
      gulfCalendar,
      ...hiddenOf(m),
      // what was done with columnTypes: types used, types the files already had (kept), names and types that could not be used
      columnTypes: typed,
      findings: r.findings.map((f) => findingOut(f, maxItems)),
      // (HC3) the engine's "Please confirm" questions: never findings, never in the score. The DAX piece the website shows
      // stays on the machine (PRIVACY.md section 3: expressions are not returned); the measure and the question are given
      pleaseConfirm: (r.confirm || []).length || mem.problem || answersNotRecorded.length || answersDone.answersNotWritten ? Object.assign({ note: 'Questions for the user, not findings and not in the score: the check reads structure and DAX, not the numbers. Ask the user each question; never edit DAX because of them. The DAX piece behind a question is not returned: the user sees it in Power BI Desktop or in the website\'s Health Check. To remember the user\'s own answer, call again with answers [{ answerKey, answer }] (through a plan, like the fix scripts); answered questions are not asked again until their measure or relationship changes.',
        items: shown.ask.slice(0, maxItems).map((c) => Object.assign({ id: c.id, object: c.obj, question: c.message.en, answerKey: answerKey(c.signature) }, c.relationship ? { relationship: c.relationship } : {})), count: (r.confirm || []).length },
        shown.answered.length ? { answered: shown.answered.slice(0, maxItems).map((x) => ({ id: x.question.id, object: x.question.obj, answer: x.record.answer, at: x.record.at, answerKey: answerKey(x.question.signature) })), answeredNote: 'The user answered these before and the measure or relationship is unchanged: don\'t ask again. A "mistake" answer means the user still has to fix it.' } : {},
        !answersDone.answersFile && applied.stale.length ? { answersForgotten: { count: applied.stale.length, note: 'Answers recorded before whose measure or relationship changed (or is gone): their questions are asked again. They are dropped from the file at its next approved write.' } } : {},
        answersNotRecorded.length ? { answersNotRecorded } : {}, mem.problem ? { answersFileProblem: mem.problem } : {}, answersDone) : undefined,
      // checks that need a column type the files don't give (columns of DAX tables in a TMDL project): listed, not guessed
      skipped: r.skipped.length ? {
        why: 'The TMDL files give no data type for these columns: Power BI works out the types of a DAX table\'s columns from its DAX, and only the open model knows them. The checks below need the type, so they were not run for these objects and are not in the score.',
        getThem: ['Export a .pbit from the same model (Power BI Desktop: File > Export > Power BI template) and run check_model_health on it.',
          'Or read the types from the same model open in Power BI Desktop: run this DAX query with Microsoft\'s Power BI Authoring MCP (dax_query_operations, Execute), then call check_model_health again with columnTypes = { "Table[Column]": Type } for every row:\n' + COLUMN_TYPES_QUERY],
        checks: r.skipped.map((s) => ({ id: s.id, title: ((Health.RULES[s.id] || {}).en || [s.id])[0], count: s.items.length, items: s.items.slice(0, maxItems) }))
      } : undefined
    }, only));
  }));
}
// one finding as the answer gives it
function findingOut(f, maxItems) {
  const rule = Health.RULES[f.id] || {}; const en = rule.en || [f.id, '', ''];
  // (HC2, the owner's 15 Oct: the website and the MCP run the same engine) the rule's source, as the website shows it
  const src = rule.source ? Object.assign({ kind: rule.source.kind }, rule.source.url ? { url: rule.source.url } : {}, rule.source.title ? { rule: rule.source.title } : {}, { says: (rule.source.says || {}).en }) : undefined;
  return { id: f.id, severity: rule.sev, category: rule.cat, title: en[0], why: en[1], fix: en[2], source: src, count: f.items.length, items: f.items.slice(0, maxItems) };
}
// (AU47) the answer on a model read only in part: the unreadable files first, no score (a score of what was read would
// be wrong: the audit measured 96 for a model Desktop could not open, 92 for the whole one), the findings partial
function partialHealth(m, maxItems) {
  const r = Health.analyze(m.tmsl, m.report);
  return Object.assign(unreadableOf(m), { source: m.source,
    scoreWithheld: `No score: ${m.skipped.length} model file(s) could not be read, and a score of the part that was read would be wrong (a model Power BI Desktop cannot open can score higher than the whole model). Fix the file and check again for the score.`,
    stats: r.stats, reportRead: !!m.report,
    findingsPartial: 'Partial: these are the findings the check could still make on the part of the model that was read; nothing in the files above was checked, and no fix script is offered until they are read.',
    findings: r.findings.map((f) => findingOut(f, maxItems)) }, hiddenOf(m));
}
// (0.3.0 Q1) check_model_health's answer on a large model: at maxItems 200 on the 300-table model it was 168,550
// characters, and the backstop kept 1 of its 6 findings. Every finding, fix and question is kept with its count; their
// object lists are shortened evenly (each with "<list>NotListed"), and only gives the rest of one part
const HEALTH_PARTS = ['MONTH_SORT', 'NO_FORMAT', 'PCT_FORMAT', 'THOUSANDS', 'FORMATS', 'pleaseConfirm', 'gulfCalendar'];
function healthFit(a, only) {
  if (only) {
    const want = new Set(only.map((x) => String(x).trim())), unknown = [...want].filter((x) => !HEALTH_PARTS.includes(x) && !(a.findings || []).some((f) => f.id === x) && !((a.skipped || {}).checks || []).some((c) => c.id === x));
    a.findings = (a.findings || []).filter((f) => want.has(f.id));
    if (a.skipped) a.skipped.checks = a.skipped.checks.filter((c) => want.has(c.id));
    if (a.fixes) { Object.keys(a.fixes).forEach((k) => { if (!want.has(k)) delete a.fixes[k]; }); if (!Object.keys(a.fixes).length) delete a.fixes; }
    if (!want.has('pleaseConfirm')) delete a.pleaseConfirm;
    if (!want.has('gulfCalendar')) delete a.gulfCalendar;
    a.only = Object.assign({ shown: [...want].filter((x) => !unknown.includes(x)), note: 'Only these parts of the check are in this answer (only); the score counts every finding.' }, unknown.length ? { notFound: unknown } : {});
  }
  const lists = (x) => [].concat((x.findings || []).map((f) => [f, 'items']), ((x.skipped || {}).checks || []).map((c) => [c, 'items']),
    x.pleaseConfirm ? [[x.pleaseConfirm, 'items'], [x.pleaseConfirm, 'answered']] : [],
    ...Object.values(x.fixes || {}).map((f) => ['sorts', 'suggested', 'measures', 'columns', 'fields', 'byHand'].map((k) => [f, k])));
  const fit = fitLists(a, lists, (x) => pretty(out(x)).length, AIM);
  if (fit && fit.cut) a.listsCut = { listed: fit.k, lists: fit.cut, how: `This answer lists at most ${fit.k} objects per finding, fix and question, to stay under ${AIM.toLocaleString('en-US')} characters; every finding is kept with its full count, and "<list>NotListed" says how many objects each list leaves out. The fix script files are not shortened: they hold every object they cover. For the rest of one part, call check_model_health again with the same inputs and only: ["<a finding id or fix name>"] (no planId needed: it writes nothing). Tell the user the lists were shortened.` };
  return a;
}
