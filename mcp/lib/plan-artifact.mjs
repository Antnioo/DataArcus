// plan_layout's exact artifact (0.3.2 SP43, the split's last step for plan_layout.mjs: B-280, B-286; moved out of
// tools/plan_layout.mjs as it was, no change of behaviour): the report create_report will write, built by create_report's
// own build with the plan's inputs, made one EN-AR report when asked, checked on every page, and its digest.
//   exactArtifact(ab, pin, lang) -> { formatKeys, files, finish, digest, modelPrint, pin, binding, check, a11y, ... } or null
//     in:  ab, the normalized request (create_report's inputs as the plan pins them: withLookDefaults, the plan's display
//          names, fields and design; planId null); pin, the plan's pin (reportPin); lang, the report's language. The
//          model's metadata is the build's own (reportRun reads it from ab.path: the same read the write repeats)
//     out: the built files, the check (checkArtifact: Microsoft's validator offline, the fields against the model, the
//          measured rules), the pin, the model's print, the digest and the binding of the three; with languages "en+ar",
//          bilingual (the twin's plan, the combined files, the English files); null when the build or the copy refuses
//   bilingualOf(built, ab) -> { files, P, base }: the EN-AR copy's engine (planTwin, into "same") on the English build.
//   No module state and no tool context: what it is given only. It proposes nothing and writes nothing: plan_layout
//   proposes the plan (the one place a plan is proposed) and keeps this artifact with it.
import { scriptModel } from './metric-switcher.mjs';
import { checkArtifact, digestOf, modelPrintOf, bindingOf } from './artifact.mjs';
import { planTwin } from './arabic-twin.mjs';
import { reportRun } from './report-run.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Bind = require('../../assets/js/pbip-bind.js');

// plan_layout's exact artifact (J14): create_report's build with the plan's inputs, checked on every page; or why not
export async function exactArtifact(ab, pin, lang) {
  let built;
  // (0.3.3 RX1) a view the plan cannot have (a page it lacks, a name twice) is told as itself: no plan is made
  try { built = reportRun(ab, 'build'); } catch (e) { if (e && e.viewsProblem) throw e; return null; }
  // (0.3.1 X2) languages "en+ar": the English report just built, made one report with its Arabic pages by the EN-AR
  // copy's engine; the build's own file list takes the combined files, so the check, the digest and the write are theirs
  let bilingual = null;
  if (ab.languages === 'en+ar') { try { bilingual = bilingualOf(built, ab); } catch (e) { return null; } bilingual.english = built.files.slice(); built.files.splice(0, built.files.length, ...bilingual.files); }
  // (L3) the metric switcher's page reads the table its script adds: its fields are checked against the model with it
  const tables = built.metricSwitcher ? built.m.tables.concat(Bind.fromTmsl(scriptModel(built.metricSwitcher.table))) : built.m.tables;
  // (L4) the flip cards' measures are written with the report, as a script the user applies first: counted as there
  // (L5) the status icons' measures likewise
  // (L6) the DAX functions' measures likewise
  const pending = [].concat(built.flip ? built.flip.pending : [], built.icons ? built.icons.pending : [], built.dax ? built.dax.pending : []);
  // (0.3.1 FX2, C23) an overlap blocks a report laid out by DataArcus (a design); pages placed by hand are the person's own
  const check = await checkArtifact(built.files, tables, lang === 'ar' ? 'ar' : 'en', Object.assign(pending.length ? { pending } : {}, ab.design && !ab.pages ? { blockOverlap: true } : {}));
  const digest = digestOf(built.files), modelPrint = modelPrintOf(built.m);
  return { formatKeys: built.formatKeys, files: built.files, finish: built.finish, digest, modelPrint, pin, binding: bindingOf(digest, pin, modelPrint), check, a11y: built.a11y, barThickness: built.barThickness, slicers: built.slicers, gallery: built.gallery, waterfallRtl: built.waterfallRtl, metricSwitcher: built.metricSwitcher, flip: built.flip, icons: built.icons, dax: built.dax, bilingual };
}
// (0.3.1 X2, the owner, 20 Oct: "I wanna integrate that AR/EN toggle") the one engine of the EN-AR copy (X1,
// lib/arabic-twin.mjs: planTwin into "same", which builds the Arabic pages exactly as the twin does, R1's language
// buttons, tab order, fits and text boxes and M1's mirror included, and adds the buttons, the sync groups, the hidden tabs
// and the bookmarks) run on the English report this plan built in memory, under the report's own name. Returns the
// combined files (the report's, then the build's others: the .pbip and the model scripts, written once) and the twin's
// plan, whose answer the plan shows
export function bilingualOf(built, ab) {
  const rep = built.files.find((f) => /^[^/]+\.Report\//.test(f.path)), base = rep.path.split('/')[0].replace(/\.Report$/, ''), pre = base + '.Report/';
  const P = planTwin({ inMemory: { files: built.files, base, projectDir: built.m.projectDir }, into: 'same', tabsShown: ab.tabsShown, textLabels: ab.arabicTexts || {}, terms: ab.arabicTerms || {},
    arabicMonth: false, waterfallRtl: ab.waterfallRtl });
  const byRel = new Map(built.files.filter((f) => f.path.startsWith(pre)).map((f) => [f.path.slice(pre.length), f.data]));
  const files = P.copy.files.map((f) => ({ path: pre + f.rel, data: f.data != null ? f.data : byRel.get(f.from) })).concat(built.files.filter((f) => !f.path.startsWith(pre)));
  return { files, P, base };
}
