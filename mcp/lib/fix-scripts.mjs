// The TMDL fix scripts written next to the model (check_model_health's, create_report's format script, the calendar's):
// their names, the write itself, and the formats answer.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import fs from 'node:fs';
import path from 'node:path';
import { nothingAt, writeNew, modelOf, visible, inside } from './model.mjs';
import { noteWritten } from './files.mjs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const Pbip = require('../../assets/js/pbip-export.js');
const Fix = require('../../assets/js/model-health-tmdl.js');

// A fix script goes to a new file, never into an answer: a script rewrites whole objects, so it holds the user's own
// expressions and descriptions, and everything a tool returns is read by the AI app (audit AUD-006). The file gets a
// free name; asked again, the file that already holds exactly this script is named again instead of a second copy.
// (R4) a script that was not written: the write's own words, which name exactly what it left on disk, if anything
export const notWrittenWhy = (dir, e) => 'The script could not be written to ' + dir + ' (' + String((e && e.code) || 'error') + ')' + (e && e.left ? ': ' + e.message : '.');
const sameFile = (f, data) => { try { const st = fs.lstatSync(f); return st.isFile() && st.size === Buffer.byteLength(data) && fs.readFileSync(f, 'utf8') === data; } catch (e) { return false; } };
export function writeScript(dir, base, script, plan) {
  for (let n = 1; n < 1000; n++) {
    const f = path.join(dir, base + (n > 1 ? ' ' + n : '') + '.tmdl');
    if (nothingAt(f)) { if (plan) return f; try { writeNew(f, script); noteWritten(f); return f; } catch (e) { if (e.code !== 'EEXIST') throw e; } }
    else if (sameFile(f, script)) return f;
  }
  throw new Error('no free file name');
}
// The owner's ask (6 Oct 2026), formats fixed at the source: one script (model-health-tmdl.js's formatReview, the
// same rule everywhere) written to the same file by check_model_health, plan_layout and create_report, next to the
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
// write: false (0.2.9, the gate: no approved plan yet) names the script's file without writing it; afterGo says who writes it;
// pw: the plan policy of the call's writes (check_model_health's planWrites; create_report writes it inside its withPlan)
export function formatsAnswer(m, p, keys, maxItems, write = true, afterGo = '', pw = null) {
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
  let file = {};
  if (s.script && !scriptDir) file = { scriptNotWritten: 'The working folder is the model folder itself, and a script is never written inside a model folder. Choose the project folder as the working folder and ask again; until then set the formats by hand in Power BI Desktop (Measure tools or Column tools > Format).' };
  else if (s.script && !write) file = { scriptAfterGo: scriptBase + ' - fix formats.tmdl', notWrittenYet: 'Not written yet: ' + afterGo };
  else if (s.script) { try { const f = pw ? pw.step(() => writeScript(scriptDir, scriptBase + ' - fix formats', s.script)) : writeScript(scriptDir, scriptBase + ' - fix formats', s.script); file = { fixScriptFile: f, howToApply: 'The script is in the file "' + path.basename(f) + '", next to the project; it sets the right format of ' + s.count + ' object' + (s.count === 1 ? '' : 's') + ' of the model (the same file check_model_health writes). ' + FORMAT_HOW }; }
    catch (e) { file = { scriptNotWritten: notWrittenWhy(scriptDir, e) + ' Set the formats by hand in Power BI Desktop.' }; } }
  return Object.assign({ fields: list }, mine.length > cap ? { more: mine.length - cap } : {}, s.more ? { scriptCovers: `The script covers ${s.count} objects; ${s.more} more need the same fix (a script is kept under 30,000 characters): apply it, then check the model again.` } : {}, file);
}
