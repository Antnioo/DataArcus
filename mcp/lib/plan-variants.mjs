// plan_layout's two plans of their own kind (0.3.2 SP2, the split, step 2: B-280, B-286): the sample (a made-up project
// in a new folder) and the redesign (a copy of an existing report with the allowlisted patches). Moved from
// tools/plan_layout.mjs as they were. Explicit inputs only: the request, and for the redesign the model plan_layout read;
// no server context. Each returns { answer } and, for a plan within the limits, what to propose
// ({ kind, model, writes, data, artifact }): plan_layout proposes it (Plans.propose, Plans.proposal), the one place a plan
// is proposed, and adds it to the answer as its last key (plan), as before.
import path from 'node:path';
import { inside, visible } from './model.mjs';
import { AIM } from './scope.mjs';
import { planRedesign } from './redesign.mjs';
import { modelPrintOf, bindingOf } from './artifact.mjs';
import { relOf } from './plain-words.mjs';
import { freeFolder, sampleFiles, sampleSaid, sampleSaidAr, sampleWrites, sampleWritesAr } from './sample-project.mjs';
import { out, fitLists } from './answer.mjs';
import { pretty } from './tool-answer.mjs';
import { modelRef } from './plan-keys.mjs';
import { REPORT_LOOK, withLookDefaults, redesignPin, samplePin, heldInputs } from './report-inputs.mjs';

// (0.3.1 C) plan_layout with sample: the made-up project in the first free folder, a plan of its own kind (sample). The
// folder is the plan's "model" key (its path; no print: nothing is there yet), so the gate stays as it is; create_report
// writes it with the same inputs. Any model input with it is a plan problem
export const SAMPLE_KEYS = ['sample', 'lang'];
export function samplePlan(a) {
  const other = Object.keys(a).filter((k) => !SAMPLE_KEYS.includes(k) && a[k] !== undefined);
  if (other.length) return { answer: { planProblems: [`sample is a plan of its own (a made-up project in a new folder, no model of the user's): leave ${other.join(', ')} out.`], sayFirst: 'No plan id: change the call as the problem says, then call plan_layout again.' } };
  const folder = freeFolder(), files = sampleFiles(folder), said = sampleSaid(folder);
  return { answer: { sample: Object.assign({}, said, { files: files.map((f) => f.path) }), sayFirst: 'Nothing was written. Show the user what the sample holds (sample: the tables, the date table, that every name and number is made up) and the files it writes; wait for their go, then approve_plan, then create_report with path (sample.folder) and the planId.' },
    propose: { kind: 'sample', model: { key: inside(folder), print: null }, writes: sampleWrites(folder, files.length), data: { pins: { create_report: samplePin({ path: folder, lang: a.lang }) }, inputs: { create_report: heldInputs({ sample: true, lang: a.lang }) }, sample: said, ...(a.lang === 'ar' ? { sampleAr: sampleSaidAr(folder) } : {}), outputs: files.map((f) => f.path), outputsAt: '.', writesAr: sampleWritesAr(folder, files.length) } } };
}
// (0.3, J13 redesign step 2: lib/redesign.mjs) plan_layout with redesignFrom: every page of the original, copied with the
// allowlisted patches; a plan of its own kind (redesign), written by create_report with the same inputs. First the
// request's own problems (before the model is read: no plan id), then the plan on the model plan_layout read
export function redesignProblems(a) {
  const problems = [];
  if (!a.path) problems.push('redesignFrom needs path (the original\'s model), so the copy is checked to be on it.');
  // (0.3.1 SQ10, L6-S4) the new report's options too: a redesign never uses them (daxFunctions, flipCards...), so one given
  // (other than its default) is said, never dropped silently
  const defaults = withLookDefaults({});
  const other = ['pages', 'design', 'customVisualsFrom', 'planFields', 'fields', 'layout'].filter((k) => a[k] != null)
    .concat(REPORT_LOOK.filter((k) => a[k] !== undefined && a[k] !== defaults[k]));
  if (other.length) problems.push(`redesignFrom is a plan of its own (a copy of the original with the allowlisted changes): leave ${other.join(', ')} out.`);
  return problems.length ? { answer: { planProblems: problems, sayFirst: 'No plan id: change the call as each problem says, then call plan_layout again.' } } : null;
}
export function redesignPlan(a, m) {
  const R = planRedesign(a.redesignFrom, m, { titles: a.titles, restyle: a.restyle, consistentText: a.consistentText, keepPositions: a.keepPositions }), pin = redesignPin(a);
  const writes = [`the new report "${R.answer.newReport}" and its "${visible(R.name)}.pbip" next to the original: a copy of every file of "${R.answer.original.replace(/: only read, never changed$/, '')}" with the ${R.answer.counts.changed} change(s) listed; the original is not changed`];
  const shown = { original: R.answer.original, newReport: R.answer.newReport, pages: R.answer.pages, theme: R.answer.theme || null, text: R.answer.text || null, keptAsIs: R.answer.keptAsIs };
  const answer = { redesign: redesignFit(JSON.parse(JSON.stringify(R.answer)), a.redesignPages) };
  if (R.problems.length) return { answer: Object.assign(answer, { planProblems: R.problems, sayFirst: 'This redesign can\'t be written as asked: no plan id. Change it as each problem says (or ask the user), then call plan_layout again; never show a plan the tools would refuse.' }) };
  return { answer, propose: { kind: 'redesign', model: modelRef(m, a.path), writes, data: { pins: { create_report: pin }, inputs: { create_report: heldInputs(a) }, patches: R.patches.map((x) => ({ file: x.file, pointer: x.pointer, to: x.to, op: x.op })), shown,
    outputs: R.files.concat(R.added).map((r) => `${visible(R.name)}.Report/${r}`).concat([`${visible(R.name)}.pbip`]), outputsAt: relOf(path.dirname(inside(a.redesignFrom))), copied: R.files.length },
    // (0.3.1 AF2, the release audit's F08) the copy's exact files, built now with the logical id chosen now, kept with the
    // plan (this session only) and bound to its pins and the model's print: after the go they are written byte for byte
    artifact: R.tree ? { files: R.tree, digest: R.digest, logicalId: R.logicalId, copy: 'redesign', pin, modelPrint: modelPrintOf(m), binding: bindingOf(R.digest, pin, modelPrintOf(m)) } : null } };
}
// (0.3.0 Q1) the redesign's answer grows with every page (a two-page report with every option on: 35,098 characters, its
// pages' lists 20,384 of them). Cut at that cause, in this order, until it fits: the visuals not changed, the patches (the
// same changes as file edits), then the changes; each with its count. The approval window shows every one of them
// (the plan's own copy, never cut), and redesignPages lists one page's in full here
export function redesignFit(r, only) {
  if (only && only.length) { const want = new Set(only.map(String)); r.pagesNotShown = (r.pages || []).filter((p) => !want.has(p.id) && !want.has(p.page)).length; r.pages = (r.pages || []).filter((p) => want.has(p.id) || want.has(p.page)); }
  const size = (x) => pretty(out({ redesign: x })).length + 2500, pages = r.pages || [];
  // (0.3.1 CS1) the consistent copy's lists of visuals kept as they are go with the visuals not changed
  const tiers = [() => pages.map((p) => [p, 'notChanged']).concat(r.text ? [[r.text, 'untouched'], [r.text, 'kept']] : []), () => [[r, 'patches']], () => pages.map((p) => [p, 'changes'])];
  let cut = 0;
  for (const t of tiers) { const f = fitLists(r, t, size, AIM); if (!f) break; cut += f.cut; if (f.k > 0) break; }
  if (cut) r.listsCut = { how: `This plan lists fewer visuals than it changes or keeps, to stay under ${AIM.toLocaleString('en-US')} characters ("<list>NotListed" says how many each list leaves out). DataArcus's approval window shows every change and every visual not changed before the person approves. To list one page in full here, call plan_layout again with the same inputs and redesignPages: ["<page id>"] (redesign.pages[].id); the plan is the same.` };
  return r;
}
