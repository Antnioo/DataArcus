// The create_report tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { inside, loadModel, refuseUnreadable } from '../lib/model.mjs';
import { withPlan } from '../lib/files.mjs';
import { writeNative } from '../lib/native-copy.mjs';
import { writeRedesign } from '../lib/redesign.mjs';
import { modelPrintOf, digestOf, bindingOf } from '../lib/artifact.mjs';
import { validatorVerdict } from '../lib/check-report.mjs';
import * as Plans from '../lib/plans.mjs';
import * as Terms from '../lib/terminology.mjs';
import { UNTRUSTED, NO_VALUES } from '../lib/agent-text.mjs';
import { writeSample, writtenSaid } from '../lib/sample-project.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { ADDS, strictInputs } from '../lib/tool-inputs.mjs';
import { modelRef, sameModelBeforeWrite } from '../lib/plan-keys.mjs';
import { axesOf } from '../lib/report-fields.mjs';
import { CREATE_REPORT_WRITE, heldSaid, REPORT_LOOK, withLookDefaults, reportPin, redesignPin, samplePin, redesignOnly } from '../lib/report-inputs.mjs';
import { reportRun } from '../lib/report-run.mjs';

export function register(server, ctx) {
  server.registerTool('create_report', {
    title: 'Create a report project for an existing model',
    description: 'Writes an approved plan\'s report exactly as approved: call it with path (the model) and planId only; the plan holds every other input (to change one: plan_layout again, show the user the new plan, wait for their "go"). Without an approved planId it refuses and writes nothing. Before it: plan_layout, show the user the plan and wait for their "go", then approve_plan. It writes a new Power BI report (PBIR) next to the model, or the planned native copy, redesign or sample project; the model and any existing report are never touched. When the answer has formats (first), tell the user that first: the fields without their right number or date format and the script file that sets them (never applied by this tool). Say any difference the answer lists in boundFields. Open the new .pbip in Power BI Desktop afterwards.' + NO_VALUES + UNTRUSTED,
    inputSchema: strictInputs('create_report', CREATE_REPORT_WRITE, heldSaid), annotations: ADDS
  }, safe(async (call) => {
    // (0.3.2 TK1, B-272) the inputs are the plan's own (heldInputs, kept with its proposal), with the model and the plan id
    // of this call; a plan that holds none (unknown, expired, of another kind) is refused with the gate's own words
    const held = call.planId != null ? Plans.inputsOf(call.planId, 'create_report') : null;
    // (as before: a model that can't be read is named first, then the plan's problem)
    if (!held) { if (call.path != null && !Plans.planOf(call.planId)) refuseUnreadable(loadModel(call.path)); const why = Plans.approvalProblem('create_report', call.planId); throw new Error(why || `Nothing was written: plan ${call.planId} holds no inputs for create_report. Make the plan with plan_layout, show it to the user and wait for their go.`); }
    let a = Object.assign(held, { path: call.path, planId: call.planId });
    // (0.3.1 C) the sample project: only with its own approved plan, only into the folder the plan named, never over anything
    if (a.sample || (a.planId != null && (Plans.planOf(a.planId) || {}).kind === 'sample')) {
      const other = Object.keys(a).filter((k) => !['sample', 'path', 'lang', 'planId'].includes(k) && a[k] !== undefined);
      if (!a.sample || other.length) throw new Error(`Nothing was written: this is the sample project's plan. Call create_report with path (the plan's sample.folder) and the approved planId.`);
      Plans.gate('create_report', a.planId, { key: inside(a.path), print: null }, samplePin(a));
      const folder = String(a.path), n = withPlan(a.planId, 'create_report', () => writeSample(folder));
      return text(writtenSaid(folder, n, a.lang));
    }
    // (rc.4, N9: the approved plan's display names are written when the call leaves them out, as the plan says; other names
    // passed are still compared with the plan, and refused)
    // (design round 8's S6 does this below for a new report; the native copy returns before it)
    if (a.displayNames === undefined && a.planId != null) { const pn = Plans.pinned(a.planId, 'create_report', 'displayNames'); if (pn !== undefined) a = Object.assign({}, a, { displayNames: pn }); }
    // (A-02) the same for the report's look and options the plan holds: left out, the plan's value is written
    if (a.planId != null) { const fill = {}; REPORT_LOOK.forEach((k) => { if (a[k] === undefined) { const v = Plans.pinned(a.planId, 'create_report', k); if (v !== undefined) fill[k] = v; } }); if (Object.keys(fill).length) a = Object.assign({}, a, fill); }
    a = withLookDefaults(a);
    // (0.3, J13 redesign step 2) a redesign is a copy of the original with the approved patches only (lib/redesign.mjs)
    if (a.redesignFrom != null || (a.planId != null && (Plans.planOf(a.planId) || {}).kind === 'redesign')) {
      if (a.redesignFrom == null) throw new Error('Nothing was written: this plan is a redesign. Make it again with plan_layout and redesignFrom (the original), show it to the user and wait for their go.');
      if (a.pages || a.design || a.customVisualsFrom != null) throw new Error('Nothing was written: redesignFrom writes a copy of that report with the approved changes alone. Make the plan again with plan_layout and redesignFrom, show it to the user and wait for their go.');
      const mm = refuseUnreadable(loadModel(a.path)), p = Plans.gate('create_report', a.planId, modelRef(mm, a.path), redesignPin(a));
      const art = keptCopy(a.planId);
      return text(withPlan(a.planId, 'create_report', () => { sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(mm)); return writeRedesign(a.redesignFrom, mm, p, { titles: a.titles, restyle: a.restyle, consistentText: a.consistentText, keepPositions: a.keepPositions }, art); }));
    }
    // (0.3.1 SF1) a redesign's option outside a redesign: refused, never dropped (plan_layout refuses it at the plan too)
    { const only = redesignOnly(a); if (only.length) throw new Error(`Nothing was written: ${only.join(', ')} ${only.length === 1 ? 'works' : 'work'} on a redesign only (redesignFrom)${a.customVisualsFrom != null ? '; for a native copy with one text set, write the native copy first, then plan its redesign with ' + only.join(', ') : ''}. Make the plan again with plan_layout without ${only.length === 1 ? 'it' : 'them'}, show it to the user and wait for their go.`); }
    // (0.2.9, custom visuals, step C) the native copy of an existing report: only the approved replacements, nothing else
    if (a.customVisualsFrom != null) {
      if (a.pages || a.design) throw new Error('Nothing was written: customVisualsFrom writes the native copy of that report alone; a new design is its own plan. Make the plan again with plan_layout, show it to the user and wait for their go.');
      const mm = refuseUnreadable(loadModel(a.path)), p = Plans.gate('create_report', a.planId, modelRef(mm, a.path), reportPin(a, a.fields));
      const art = keptCopy(a.planId);
      return text(withPlan(a.planId, 'create_report', () => { sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(mm)); return writeNative(a.customVisualsFrom, mm, p, axesOf(mm, a.sharedAxes), art, { second: a.customVisualsSecond }); }));
    }
    // J14 (0.3, B-168): an approved plan holds the exact report plan_layout built and checked: it is written as approved,
    // never built again (a build draws new random ids). Without one, the build below runs for its refusals, and refuses at
    // the write
    a = listedSlicers(a);
    const art = a.planId != null ? Plans.artifactOf(a.planId) : null;
    if (art && art.copy) throw new Error(`Nothing was written: plan ${a.planId} is the ${art.copy === 'native' ? 'native copy of a report (customVisualsFrom)' : 'redesign of a report (redesignFrom)'}. Make it again with plan_layout, show it to the user and wait for their go.`);
    // (0.3.2 TK1) a plan whose exact report is not kept (none was built) is built from its inputs; a plan made with layout
    // inputs alone holds the design it resolved (the pin's), as the agent passed it before
    if (!art && !a.pages && !a.design) { const d = Plans.pinned(a.planId, 'create_report', 'design'); if (d) a = Object.assign({}, a, { design: d }); }
    return text(art ? writeApproved(a, art) : reportRun(a, 'write'));
  }));
}
// (0.3.1 R4A, round 4's problems 3 and 10: the plan and its approval page list the slicer DataArcus adds to fill the
// design's slots, but the plan pinned the asked ones only, so the listed three were refused) the slicers the approved page
// showed: the asked ones and exactly the plan's slicersAdded (any order, each once) are read as the asked ones, which the
// plan pinned; the plan's files are written either way (the same bytes). Any other list goes to the gate as it is, and is
// refused there with what differs
const slicerKey = (x) => { const mk = String(x).trim().match(/^'?(.+?)'?\[(.+)\]$/); return mk ? `${mk[1]}[${mk[2]}]` : String(x).trim(); };
function listedSlicers(a) {
  if (a.planId == null || !a.fields || !Array.isArray(a.fields.slicers)) return a;
  const p = Plans.planOf(a.planId), added = p && p.data && Array.isArray(p.data.slicersAdded) ? p.data.slicersAdded.map(slicerKey) : [];
  const pinnedFields = Plans.pinned(a.planId, 'create_report', 'fields'), asked = pinnedFields && Array.isArray(pinnedFields.slicers) ? pinnedFields.slicers : null;
  if (!added.length || !asked) return a;
  const given = a.fields.slicers.map(slicerKey), listed = asked.map(slicerKey).concat(added);
  const same = given.length === listed.length && new Set(given).size === given.length && listed.every((f) => given.includes(f));
  return same ? Object.assign({}, a, { fields: Object.assign({}, a.fields, { slicers: asked.slice() }) }) : a;
}
// (0.3.1 AF2, the release audit's F08) a copy's kept files (the native copy's, the redesign's), after the gate: the ones
// the approval recorded (their binding, as writeApproved checks it), or none (the writer then refuses)
function keptCopy(planId) {
  const art = Plans.artifactOf(planId);
  if (art && bindingOf(art.digest, art.pin, art.modelPrint) !== Plans.approvedBinding(planId)) throw new Error(`Nothing was written: the files kept for plan ${planId} are not the ones that were approved. Make the plan again with plan_layout, show it to the user and wait for their go.`);
  return art;
}
// J14 (0.3, B-168): create_report with an approved plan's artifact: the plan's inputs and model checked again (the gate
// compares every pinned input and the theme, logo and background files' contents; the model's print and the approval's
// binding here), then exactly the approved bytes are written. Any change: nothing is written, the plan is made again
function writeApproved(a, art) {
  const notReady = Plans.approvalProblem('create_report', a.planId);
  const input = (ok, msg) => { if (!ok) throw new Error(notReady ? `${notReady} Also: ${msg}` : msg); };
  input(!a.pages !== !(a.design || Plans.pinned(a.planId, 'create_report', 'design')), 'Give create_report pages or a design, not both and not neither: pages with hand-placed slots, or the design from generate_theme or plan_layout.');
  input(!!a.name, 'Give create_report a name for the new report (Report name).');
  const m = refuseUnreadable(loadModel(a.path));
  { const pn = Plans.pinned(a.planId, 'create_report', 'displayNames'); if (pn) a = Object.assign({}, a, { displayNames: Object.assign({}, pn, a.displayNames || {}) }); }
  Plans.gate('create_report', a.planId, modelRef(m, a.path), reportPin(a, a.fields));
  const again = ' Make the plan again with plan_layout, show it to the user and wait for their go.';
  if (modelPrintOf(m) !== art.modelPrint) throw new Error(`Nothing was written: the model changed since plan ${a.planId} was approved, so the report that was checked is not the one this model gives.${again}`);
  if (digestOf(art.files) !== art.digest || bindingOf(art.digest, art.pin, art.modelPrint) !== Plans.approvedBinding(a.planId)) throw new Error(`Nothing was written: the report kept for plan ${a.planId} is not the one that was approved.${again}`);
  const done = art.finish(a.planId);
  // (0.3.1 P3A, the laptop's part 3: this check said "0 problems" while check_report said "can break" on the same files)
  // Microsoft's validator ran on these very bytes in the plan's check: its findings, in the kinds check_report gives them
  const V = art.check && art.check.checks && art.check.checks.validator;
  if (done.check && V && V.ran) {
    const vv = validatorVerdict(V.kinds, a.lang);
    done.check = Object.assign({}, done.check, { tellUser: 'Checked before it was written (Microsoft\'s validator offline, the measured rules of what Power BI Desktop draws, and the layout check). Tell the user the summary; when it lists problems, say each one with its fix.',
      summary: vv ? `${String(done.check.summary || '').replace(/\.?\s*$/, '')}. ${vv}` : done.check.summary,
      validator: Object.assign({ ran: true, canBreak: +V.kinds.canBreak || 0, openedInDesktop: +V.kinds.openedInDesktop || 0, mayLook: +V.kinds.mayLook || 0, desktopOpens: +V.kinds.desktopOpens || 0 }, V.byRule ? { byRule: V.byRule } : {}) });
  }
  // (0.3.0 J18) the terms of a written Arabic plan are confirmed for this model (this session only)
  { const pd = Plans.planOf(a.planId); if (pd && pd.data && Array.isArray(pd.data.terminology)) Terms.remember(m, pd.data.terminology); }
  // (0.3.1 X2) the bilingual report: what the one write holds
  const B = art.bilingual ? art.bilingual.P.answer.languages : null;
  return Object.assign(done, { exact: { status: art.check.status, digest: art.digest, files: art.files.length, pages: art.check.pages,
    note: 'These are the files plan_layout built and checked before the go, written byte for byte (the digest is the plan\'s).' } },
    B ? { bilingual: { pairs: B.pairs.length, languageButtons: B.buttons.filter((b) => b.placed).length, phoneButtons: B.buttons.filter((b) => b.phone).length, syncGroups: B.syncGroups.length, tabsShown: art.bilingual.P.copy.tabsShown === 'ar' ? 'Arabic' : 'English', tabs: B.tabs,
      nextSteps: 'Open the .pbip in Power BI Desktop: the English pages are in the tabs (or the Arabic, as planned); each page\'s language button opens its counterpart (Ctrl+click while editing); a slicer set on a page holds on its counterpart. Check it with check_report.' } } : {});
}
