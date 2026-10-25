// The "Please confirm" answers file (B-148, 0.3): "<model>.dataarcus-answers.json" next to the model, where the fix
// scripts go. It holds the records of assets/js/confirm-memory.js: hashes (of the question, its object and the metadata
// it was based on), the answer and its date; never a name, DAX text or data.
// Read on every check_model_health; written only by check_model_health with an approved plan that lists it.
// The one file DataArcus replaces: its own, and only when what is there is still the DataArcus answers file it checked
// (R5, the outside audit of 19 Oct, F04: its device and inode, size and content hash, taken when it is read and taken
// again right before the replace; anything else there is never replaced). Written through write-io (F05): a temporary
// file created inside the try and removed on any failure (AF2: only while it is still the file this call made), and what
// could not be removed is named.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { nothingAt, readCapped, real } from './model.mjs';
import { noteWritten } from './files.mjs';
import { io, writeFileNew, writeFailed, shownWritePath, createFile, rollBack } from './write-io.mjs';

const require = createRequire(import.meta.url);
export const Memory = require('../../assets/js/confirm-memory.js');
const KIND = 'dataarcus-confirm-answers', MAX = 1024 * 1024, MAX_RECORDS = 2000;
export const answersName = (base) => base + '.dataarcus-answers.json';

// what the file at that name is: its device and inode (lstat: a link is itself, never its target), size and content hash
function identity(file, buf) {
  const st = fs.lstatSync(file), b = buf || readCapped(file, MAX, 'answers file');
  return { dev: st.dev, ino: st.ino, size: st.size, hash: crypto.createHash('sha256').update(b).digest('hex') };
}
const same = (a, b) => !!a && !!b && a.dev === b.dev && a.ino === b.ino && a.size === b.size && a.hash === b.hash;

/** What the file next to the model holds: { records, problem, checked }. No file: no records. A file that is not ours,
 *  too big or not JSON: no records, and the problem said (its text is never quoted). checked: the identity of the
 *  DataArcus answers file read (dev, ino, size, hash), which a replace needs unchanged. */
export function readAnswers(dir, base) {
  if (!dir) return { records: [], file: null };
  const file = path.join(dir, answersName(base));
  if (nothingAt(file)) return { records: [], file, exists: false };
  let j, b, st;
  try { st = fs.lstatSync(file); b = readCapped(file, MAX, 'answers file'); j = JSON.parse(b.toString('utf8').replace(/^\uFEFF/, '')); } catch (e) { return { records: [], file, exists: true, problem: `The file "${path.basename(file)}" could not be read as DataArcus answers (${String(e && e.code || 'not JSON')}); its questions are asked again, and it is never replaced.` }; }
  if (!j || j.kind !== KIND || j.version !== 1 || !Array.isArray(j.answers)) return { records: [], file, exists: true, problem: `The file "${path.basename(file)}" is not a DataArcus answers file; its questions are asked again, and it is never replaced. Rename or move it to keep answers.` };
  const checked = { dev: st.dev, ino: st.ino, size: b.length, hash: crypto.createHash('sha256').update(b).digest('hex') };
  return { records: j.answers.map(Memory.upgrade).filter(Memory.valid), file, exists: true, ours: true, checked };
}

const changed = (file) => { const e = new Error(`Nothing was written: the answers file "${shownWritePath(file)}" changed after DataArcus checked it (another program, or a copy put in its place), so it was not replaced. Nothing else was touched. Check the model again to read what is there now.`); e.code = 'ANSWERS_CHANGED'; e.left = { ours: [], foreign: [] }; return e; };

/** Writes the records to the answers file. checked: readAnswers' answer from the check this write follows. No file was
 *  there: a new file (write-io's writeFileNew, which never replaces anything). A DataArcus answers file was: replaced
 *  only if it is still that file (dev+ino, size, content hash), verified right before the rename; otherwise refused,
 *  nothing changed. Anything else at that name is never replaced: throws. A failed write throws write-io's error
 *  (e.left: what this call could not remove). */
export function writeAnswers(dir, base, records, checked) {
  const file = path.join(dir, answersName(base));
  real(file);
  const was = checked || readAnswers(dir, base);
  if (was.exists && !was.ours) throw new Error(was.problem || `"${path.basename(file)}" is not a DataArcus answers file: not replaced.`);
  const data = JSON.stringify({ kind: KIND, version: 1, note: 'Answers to the DataArcus Health Check\'s "Please confirm" questions: hashes (of each question, its object and its metadata), the answer and its date; no name, no DAX, no data. A question comes back when what it is about changes.', answers: records.slice(0, MAX_RECORDS) }, null, 2) + '\n';
  if (!was.exists) { writeFileNew(file, data); noteWritten(file); return file; }   // (EEXIST when a file appeared: never replaced)
  if (!was.checked) throw changed(file);
  const tmp = path.join(dir, `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}`);
  // what this call created, recorded before the call that creates it (write-io's way). (0.3.1 AF2, the release audit's
  // F07) the temp is written through createFile, with its identity and the hash of its bytes, and removed by rollBack: only
  // while it is still the file this call made; another file put at its name is left, and named
  const made = [{ path: tmp }];
  try {
    try { createFile(made[0], data); } catch (e) { if (e && e.code === 'EEXIST') made.pop(); throw e; }
    let now = null; try { now = identity(file); } catch (e) { now = null; }
    if (!same(now, was.checked)) throw changed(file);   // (taken right before the replace: the file checked, or nothing)
    io.renameSync(tmp, file);
    made.length = 0;
  } catch (e) {
    const { ours, foreign } = rollBack(made);
    if (e && e.code === 'ANSWERS_CHANGED' && !ours.length && !foreign.length) throw e;
    throw writeFailed(e, `the file "${shownWritePath(file)}"`, ours, foreign);
  }
  noteWritten(file);
  return file;
}

// (R5, F04) what the approval says about overwriting: an answers file DataArcus wrote is replaced, nothing else is.
// (R6, the outside audit of 19 Oct, F09 e: "Nothing is overwritten or deleted" was not true of every plan) each plan's
// sentence says what it replaces, that everything else is new, and what a failed write removes: only what it created
export const REPLACES = 'which replaces the answers file DataArcus wrote there';
const FAILED = 'If the write fails part-way, DataArcus removes what this call created, and names anything it could not remove.';
export const writesNote = (writes) => {
  const w = (writes || []).map(String);
  if (w.some((x) => x.includes(REPLACES))) return `This plan replaces the answers file DataArcus wrote next to the project (only if it is still the file DataArcus checked); every other file is new: nothing else is overwritten or deleted. ${FAILED}`;
  if (w.some((x) => /^the answers file /.test(x))) return `This plan writes a new answers file next to the project. New files only: nothing is overwritten or deleted. ${FAILED}`;
  return `New files only: nothing is overwritten or deleted. ${FAILED}`;
};

// (0.3.0 T1, T-5) the same sentences on an Arabic plan's approval page
const FAILED_AR = 'إن فشلت الكتابة في منتصفها، يحذف DataArcus ما أنشأه هذا الطلب، ويذكر أي شيء لم يستطع حذفه.';
export const writesNoteAr = (writes) => {
  const w = (writes || []).map(String);
  if (w.some((x) => x.includes(REPLACES))) return `تستبدل هذه الخطة ملف الإجابات الذي كتبه DataArcus بجانب المشروع (إن كان لا يزال الملف الذي فحصه DataArcus)، وكل ملف آخر جديد: لا يُكتب فوق أي ملف آخر ولا يُحذف شيء. ${FAILED_AR}`;
  if (w.some((x) => /^the answers file /.test(x))) return `تكتب هذه الخطة ملف إجابات جديدًا بجانب المشروع. ملفات جديدة فقط: لا يُكتب فوق أي ملف ولا يُحذف شيء. ${FAILED_AR}`;
  return `ملفات جديدة فقط: لا يُكتب فوق أي ملف ولا يُحذف شيء. ${FAILED_AR}`;
};

/** The short key the assistant passes back for a question: the first 16 characters of its signature. */
export const answerKey = (sig) => String(sig).slice(0, 16);
