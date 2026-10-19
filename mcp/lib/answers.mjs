// The "Please confirm" answers file (B-148, 0.3): "<model>.dataarcus-answers.json" next to the model, where the fix
// scripts go. It holds the records of assets/js/confirm-memory.js (hashes and the answer, never DAX text or data).
// Read on every check_model_health; written only by check_model_health with an approved plan that lists it.
// The one file DataArcus replaces: its own, and only when what is there is a DataArcus answers file.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { nothingAt, readCapped, real } from './model.mjs';
import { noteWritten } from './files.mjs';

const require = createRequire(import.meta.url);
export const Memory = require('../../assets/js/confirm-memory.js');
const KIND = 'dataarcus-confirm-answers', MAX = 1024 * 1024, MAX_RECORDS = 2000;
export const answersName = (base) => base + '.dataarcus-answers.json';

/** What the file next to the model holds: { records, problem }. No file: no records. A file that is not ours, too big
 *  or not JSON: no records, and the problem said (its text is never quoted). */
export function readAnswers(dir, base) {
  if (!dir) return { records: [], file: null };
  const file = path.join(dir, answersName(base));
  if (nothingAt(file)) return { records: [], file, exists: false };
  let j;
  try { const b = readCapped(file, MAX, 'answers file'); j = JSON.parse(b.toString('utf8').replace(/^﻿/, '')); } catch (e) { return { records: [], file, exists: true, problem: `The file "${path.basename(file)}" could not be read as DataArcus answers (${String(e && e.code || 'not JSON')}); its questions are asked again, and it is never replaced.` }; }
  if (!j || j.kind !== KIND || j.version !== 1 || !Array.isArray(j.answers)) return { records: [], file, exists: true, problem: `The file "${path.basename(file)}" is not a DataArcus answers file; its questions are asked again, and it is never replaced. Rename or move it to keep answers.` };
  return { records: j.answers.filter(Memory.valid), file, exists: true, ours: true };
}

/** Writes the records to the answers file: a new file, or a replacement of a DataArcus answers file (written to a new
 *  temporary file first, then renamed over it). Anything else at that name is never replaced: throws. */
export function writeAnswers(dir, base, records) {
  const file = path.join(dir, answersName(base));
  real(file);
  const now = readAnswers(dir, base);
  if (now.exists && !now.ours) throw new Error(now.problem || `"${path.basename(file)}" is not a DataArcus answers file: not replaced.`);
  const data = JSON.stringify({ kind: KIND, version: 1, note: 'Answers to the DataArcus Health Check\'s "Please confirm" questions: hashes and the answer only. A question comes back when its measure or relationship changes.', answers: records.slice(0, MAX_RECORDS) }, null, 2) + '\n';
  const tmp = path.join(dir, `.dataarcus-tmp-${crypto.randomBytes(5).toString('hex')}.json`);
  fs.writeFileSync(tmp, data, { flag: 'wx' });
  try {
    if (!now.exists) { fs.linkSync(tmp, file); fs.unlinkSync(tmp); }   // a new file: link, which fails rather than replace
    else fs.renameSync(tmp, file);
  } catch (e) { try { fs.unlinkSync(tmp); } catch (x) { /* gone */ } throw e; }
  noteWritten(file);
  return file;
}

/** The short key the assistant passes back for a question: the first 16 characters of its signature. */
export const answerKey = (sig) => String(sig).slice(0, 16);
