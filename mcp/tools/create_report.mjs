// The create_report tool: its registration (description, inputs, handler) and its own helpers; server.mjs registers it in its place.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import { inside, loadModel, refuseUnreadable } from '../lib/model.mjs';
import { withPlan } from '../lib/files.mjs';
import { writeNative } from '../lib/native-copy.mjs';
import { writeRedesign } from '../lib/redesign.mjs';
import { modelPrintOf, digestOf, bindingOf } from '../lib/artifact.mjs';
import * as Plans from '../lib/plans.mjs';
import * as Terms from '../lib/terminology.mjs';
import { UNTRUSTED } from '../lib/agent-text.mjs';
import { writeSample, writtenSaid } from '../lib/sample-project.mjs';
import { text, safe } from '../lib/tool-answer.mjs';
import { ADDS } from '../lib/tool-inputs.mjs';
import { modelRef, sameModelBeforeWrite } from '../lib/plan-keys.mjs';
import { axesOf } from '../lib/report-fields.mjs';
import { CREATE_REPORT_INPUTS, REPORT_LOOK, withLookDefaults, reportPin, redesignPin, samplePin } from '../lib/report-inputs.mjs';
import { reportRun } from '../lib/report-run.mjs';

export function register(server, ctx) {
  server.registerTool('create_report', {
    title: 'Create a report project for an existing model',
    description: 'Writes only with an approved planId from plan_layout for the same model: without one it refuses and writes nothing. Before calling this, call plan_layout with the model and the plan\'s fields (planFields), show the user the plan (pages, visuals, the fields on each, sizes, theme) and wait for their "go"; then approve_plan with the user\'s reply, and pass the planId and the approved plan\'s fields in fields, so the report shows exactly what the user approved. When the answer has formats (first), tell the user that first: the fields without their right number or date format and the script file that sets them in the model (never applied by this tool; the report already shows them right). Writes a new Power BI report (PBIR) next to the user\'s model: every visual placed, bound to the model\'s fields (suggested, or given), theme applied; each KPI card, chart and table on its own panel (drawn by the theme\'s solid visuals, or by a page\'s background image when one is given). The model and any existing report are never touched; the new report gets a free name. Every report also gets a hidden tooltip page, shown when a chart is hovered. An optional logo (a PNG or JPG in the DataArcus folder) goes in the header at its own shape. Give either pages (hand-placed slots) or a design (from generate_theme or plan_layout): with a design the pages, positions, second page, slide-in filter panel, labels and theme are exactly the DataArcus Theme Generator\'s project download. Open the new .pbip in Power BI Desktop afterwards (or reload it with the Desktop bridge). A KPI card shows a measure as the model defines it, filtered only by the page filters you pass and the user\'s slicers: its label must say what the value really is. When the request limits the report to part of the data (for example "Ramadan only"), pass a page filter in pageFilters and show it in the plan: it filters every visual on the pages, the cards included. A visual outside the list of kinds is not supported: write nothing and offer the closest supported ones.' + UNTRUSTED,
    inputSchema: CREATE_REPORT_INPUTS, annotations: ADDS
  }, safe(async (a) => {
    // (0.3.1 C) the sample project: only with its own approved plan, only into the folder the plan named, never over anything
    if (a.sample || (a.planId != null && (Plans.planOf(a.planId) || {}).kind === 'sample')) {
      const other = Object.keys(a).filter((k) => !['sample', 'path', 'lang', 'planId'].includes(k) && a[k] !== undefined);
      if (!a.sample || other.length) throw new Error(`Nothing was written: this is the sample project's plan. Call create_report with sample true, path (the plan's sample.folder), lang and the approved planId${other.length ? `; leave ${other.join(', ')} out` : ''}.`);
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
      if (a.redesignFrom == null) throw new Error('Nothing was written: this plan is a redesign. Call create_report with redesignFrom (the original), path and the approved planId, and the plan\'s titles and restyle if it has them.');
      if (a.pages || a.design || a.customVisualsFrom != null) throw new Error('Nothing was written: redesignFrom writes a copy of that report with the approved changes alone. Call create_report with redesignFrom, path, the approved planId, and the plan\'s titles and restyle if it has them.');
      const mm = refuseUnreadable(loadModel(a.path)), p = Plans.gate('create_report', a.planId, modelRef(mm, a.path), redesignPin(a));
      const art = keptCopy(a.planId);
      return text(withPlan(a.planId, 'create_report', () => { sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(mm)); return writeRedesign(a.redesignFrom, mm, p, { titles: a.titles, restyle: a.restyle }, art); }));
    }
    // (0.2.9, custom visuals, step C) the native copy of an existing report: only the approved replacements, nothing else
    if (a.customVisualsFrom != null) {
      if (a.pages || a.design) throw new Error('Nothing was written: customVisualsFrom writes the native copy of that report alone; a new design is its own plan. Call create_report with customVisualsFrom, path and the approved planId only.');
      const mm = refuseUnreadable(loadModel(a.path)), p = Plans.gate('create_report', a.planId, modelRef(mm, a.path), reportPin(a, a.fields));
      const art = keptCopy(a.planId);
      return text(withPlan(a.planId, 'create_report', () => { sameModelBeforeWrite(a.planId, () => modelPrintOf(loadModel(a.path)), modelPrintOf(mm)); return writeNative(a.customVisualsFrom, mm, p, axesOf(mm, a.sharedAxes), art, { second: a.customVisualsSecond }); }));
    }
    // J14 (0.3, B-168): an approved plan holds the exact report plan_layout built and checked: it is written as approved,
    // never built again (a build draws new random ids). Without one, the build below runs for its refusals, and refuses at
    // the write
    const art = a.planId != null ? Plans.artifactOf(a.planId) : null;
    if (art && art.copy) throw new Error(`Nothing was written: plan ${a.planId} is the ${art.copy === 'native' ? 'native copy of a report (customVisualsFrom)' : 'redesign of a report (redesignFrom)'}. Call create_report with ${art.copy === 'native' ? 'customVisualsFrom' : 'redesignFrom'}, path and the approved planId.`);
    return text(art ? writeApproved(a, art) : reportRun(a, 'write'));
  }));
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
  input(!a.pages !== !a.design, 'Give create_report pages or a design, not both and not neither: pages with hand-placed slots, or the design from generate_theme or plan_layout.');
  input(!!a.name, 'Give create_report a name for the new report (Report name).');
  const m = refuseUnreadable(loadModel(a.path));
  { const pn = Plans.pinned(a.planId, 'create_report', 'displayNames'); if (pn) a = Object.assign({}, a, { displayNames: Object.assign({}, pn, a.displayNames || {}) }); }
  Plans.gate('create_report', a.planId, modelRef(m, a.path), reportPin(a, a.fields));
  const again = ' Make the plan again with plan_layout, show it to the user and wait for their go.';
  if (modelPrintOf(m) !== art.modelPrint) throw new Error(`Nothing was written: the model changed since plan ${a.planId} was approved, so the report that was checked is not the one this model gives.${again}`);
  if (digestOf(art.files) !== art.digest || bindingOf(art.digest, art.pin, art.modelPrint) !== Plans.approvedBinding(a.planId)) throw new Error(`Nothing was written: the report kept for plan ${a.planId} is not the one that was approved.${again}`);
  const done = art.finish(a.planId);
  // (0.3.0 J18) the terms of a written Arabic plan are confirmed for this model (this session only)
  { const pd = Plans.planOf(a.planId); if (pd && pd.data && Array.isArray(pd.data.terminology)) Terms.remember(m, pd.data.terminology); }
  // (0.3.1 X2) the bilingual report: what the one write holds
  const B = art.bilingual ? art.bilingual.P.answer.languages : null;
  return Object.assign(done, { exact: { status: art.check.status, digest: art.digest, files: art.files.length, pages: art.check.pages,
    note: 'These are the files plan_layout built and checked before the go, written byte for byte (the digest is the plan\'s).' } },
    B ? { bilingual: { pairs: B.pairs.length, languageButtons: B.buttons.filter((b) => b.placed).length, phoneButtons: B.buttons.filter((b) => b.phone).length, syncGroups: B.syncGroups.length, tabsShown: art.bilingual.P.copy.tabsShown === 'ar' ? 'Arabic' : 'English', tabs: B.tabs,
      nextSteps: 'Open the .pbip in Power BI Desktop: the English pages are in the tabs (or the Arabic, as planned); each page\'s language button opens its counterpart (Ctrl+click while editing); a slicer set on a page holds on its counterpart. Check it with check_report.' } } : {});
}
