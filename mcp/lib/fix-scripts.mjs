// The TMDL fix scripts written next to the model (check_model_health's, create_report's format script, the calendar's):
// their names, the write itself, and the formats answer.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import fs from 'node:fs';
import path from 'node:path';
import { nothingAt, writeNew, modelOf, visible, inside } from './model.mjs';
import { noteWritten } from './files.mjs';
import { createRequire } from 'node:module';
import { besideSaid } from './plain-words.mjs';   // (0.3.1 R4A, T-9: the folder by its name and where it is)
const require = createRequire(import.meta.url);
const Pbip = require('../../assets/js/pbip-export.js');
const Fix = require('../../assets/js/model-health-tmdl.js');

// A fix script goes to a new file, never into an answer: a script rewrites whole objects, so it holds the user's own
// expressions and descriptions, and everything a tool returns is read by the AI app (audit AUD-006). The file gets a
// free name; asked again, the file that already holds exactly this script is named again instead of a second copy.
// (0.3.1 AF2, the release audit's F09) the name is chosen once, by the plan (freeScriptName: it writes nothing), and shown
// with it; the write writes that name (writePlannedScript) or nothing, never another name.
// (R4) a script that was not written: the write's own words, which name exactly what it left on disk, if anything
export const notWrittenWhy = (dir, e) => 'The script could not be written to ' + dir + ' (' + String((e && e.code) || 'error') + ')' + (e && e.left ? ': ' + e.message : '.');
const sameFile = (f, data) => { try { const st = fs.lstatSync(f); return st.isFile() && st.size === Buffer.byteLength(data) && fs.readFileSync(f, 'utf8') === data; } catch (e) { return false; } };
export function freeScriptName(dir, base, script) {
  for (let n = 1; n < 1000; n++) {
    const f = path.join(dir, base + (n > 1 ? ' ' + n : '') + '.tmdl');
    if (nothingAt(f) || sameFile(f, script)) return f;
  }
  throw new Error('no free file name');
}
/** (AF2) Why the file a plan named can't be written now: null when nothing is there or it already holds exactly this
 *  script; else the refusal. */
export function plannedTaken(dir, name, script) {
  const f = path.join(dir, path.basename(String(name)));
  return nothingAt(f) || sameFile(f, script) ? null : new Error(`Nothing was written: "${path.basename(String(name))}" is already there, and it is not the file the plan named (DataArcus never writes over a file, nor under another name than the plan showed). Make the plan again (call the tool without planId), show it to the user and wait for their go.`);
}
/** (AF2) Writes the script to the file the plan named, as a new file; the same script already there is named again and
 *  nothing is written; anything else at that name: nothing is written (plannedTaken's refusal). Returns the file. */
export function writePlannedScript(dir, name, script) {
  const f = path.join(dir, path.basename(String(name))), taken = plannedTaken(dir, name, script);
  if (taken) throw taken;
  if (sameFile(f, script)) return f;
  writeNew(f, script); noteWritten(f); return f;
}
// The owner's ask (6 Oct 2026), formats fixed at the source: one script (model-health-tmdl.js's formatReview, the
// same rule everywhere) written by check_model_health, plan_layout and create_report, each with its own keys, next to the
// project (never into the model). keys: the report's fields ("Table[Field]") to name; without keys, every object.
const FORMAT_HOW = 'Save a copy of the Power BI file first; open the script file in Notepad, select all and copy; in Power BI Desktop open TMDL view, paste, choose Preview (only the formats of the listed objects change), then Apply. The script is never applied by DataArcus: the model\'s files are not changed until the user applies it. It holds the model\'s own definitions of the objects it changes, which is why it is in a file: don\'t read the file into the conversation unless the user asks.';
// AUD-032 (round 20) and the code review's a (round 22): a name with a control character (a tab, a line break) is
// never written raw into a fix script. Every script is built from the model without such tables, columns and
// measures (the scripts touch only the objects they name, under "ref table"); skipped names them, escaped
export const hasControl = Pbip.hasControl;   // (the writer's, one test for both: round 22b, X-05)
export function scriptTables(m) {
  const raw0 = modelOf(m.tmsl).tables || [], skipped = [];
  const raw = raw0.filter((t) => { if (hasControl(t.name)) { skipped.push(visible(t.name)); return false; } return true; }).map((t) => {
    const keep = (x) => { if (!hasControl(x.name)) return true; skipped.push(`${visible(t.name)}[${visible(x.name)}]`); return false; };
    return Object.assign({}, t, { columns: (t.columns || []).filter(keep), measures: (t.measures || []).filter(keep) }); });
  return { raw0, raw, skipped };
}
// (AF2) the format script of these keys, and the free name the plan gives it now (nothing written): { scriptDir, base,
// file, script, count } or null (no script, or no place for one)
export function formatsScriptOf(m, p, keys, maxItems) {
  const f = formatsOf(m, p, keys, maxItems);
  if (!f || !f.s.script || !f.scriptDir) return null;
  const base = f.scriptBase + ' - fix formats';
  return { scriptDir: f.scriptDir, base, file: freeScriptName(f.scriptDir, base, f.s.script), script: f.s.script, count: f.s.count };
}
function formatsOf(m, p, keys, maxItems) {
  const raw = scriptTables(m).raw, s0 = Fix.formatReview(raw);
  const all = s0.items.concat(s0.byHand), mine = keys ? all.filter((i) => keys.has(i.object)) : all;
  if (!mine.length) return null;
  // (0.3.0 F7, the red team's F-3: the plan listed the report's 3 fields and the script rewrote 11 objects) with keys, the
  // script changes only the objects the plan lists (the owner's rule: nothing written without being shown first);
  // check_model_health (no keys) keeps the whole model's script, which its plan lists in full
  const cap = maxItems || 50, shownMine = mine.slice(0, cap), s = keys ? Fix.formatReview(raw, { only: new Set(shownMine.map((i) => i.object)) }) : s0;
  const list = shownMine.map((i) => Object.assign({ object: i.object, kind: i.kind, from: i.from, to: i.to, why: i.reason }, i.steps ? { byHand: i.steps } : {}));
  const scriptDir = m.folder ? m.projectDir : path.dirname(inside(p));
  const scriptBase = m.folder ? path.basename(m.folder).replace(/\.(SemanticModel|Dataset)$/i, '') : path.basename(inside(p)).replace(/\.[^.]+$/, '');
  return { mine, cap, s, list, scriptDir, scriptBase };
}
// write: false (0.2.9, the gate: no approved plan yet) names the script's file without writing it (AF2: the free name
// now, the one the write then writes); afterGo says who writes it. write: true with put (AF2): put(dir, base, script)
// writes the script, or hands it to the caller's write, and returns its file
export function formatsAnswer(m, p, keys, maxItems, write = false, afterGo = '', put = null) {
  const F = formatsOf(m, p, keys, maxItems);
  if (!F) return null;
  const { mine, cap, s, list, scriptDir, scriptBase } = F;
  let file = {};
  if (s.script && !scriptDir) file = { scriptNotWritten: 'The working folder is the model folder itself, and a script is never written inside a model folder. Choose the project folder as the working folder and ask again; until then set the formats by hand in Power BI Desktop (Measure tools or Column tools > Format).' };
  // (0.3.1 SQ10, AF2-S4) the same script already there is named as already there: the write writes no copy of it
  else if (s.script && (!write || !put)) { const f = freeScriptName(scriptDir, scriptBase + ' - fix formats', s.script);
    file = nothingAt(f) ? { scriptAfterGo: path.basename(f), notWrittenYet: 'Not written yet: ' + afterGo } : { scriptAfterGo: path.basename(f), alreadyThere: `Already there: "${path.basename(f)}" next to the project holds exactly this script, so it is named again and not written again.` }; }
  else if (s.script) { try { const f = put(scriptDir, scriptBase + ' - fix formats', s.script); file = { fixScriptFile: f, howToApply: 'The script is in the file "' + path.basename(f) + '", ' + besideSaid(path.dirname(f)) + '; it sets the right format of ' + s.count + ' object' + (s.count === 1 ? '' : 's') + ' of the model (the same kind of script check_model_health writes). ' + FORMAT_HOW }; }
    catch (e) { file = { scriptNotWritten: notWrittenWhy(scriptDir, e) + ' Set the formats by hand in Power BI Desktop.' }; } }
  return Object.assign({ fields: list }, mine.length > cap ? { more: mine.length - cap } : {}, s.more ? { scriptCovers: `The script covers ${s.count} objects; ${s.more} more need the same fix (a script is kept under 30,000 characters): apply it, then check the model again.` } : {}, file);
}
