// How every tool answers: the answer's text (scrubbed of local paths, capped), its errors and the working folder's notice,
// and safe(), the wrapper around each tool's handler.
// (0.3.1 S9: moved out of server.mjs as it was, no change of behaviour)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT, rootProblem, Notice } from './model.mjs';
import { AIM } from './scope.mjs';
import { wordOf } from './read-words.mjs';
import { writtenSince } from './files.mjs';
import { nameOut as textOut, out, capAnswer, failText, ANSWER_MAX } from './answer.mjs';

// Round 17 (the outside review's G-02, privacy): no answer or error sends an absolute local path to the AI. Paths in the
// working folder become relative to it, the working folder itself is named by its last folder name, and the user's home
// folder becomes "~" (a Windows path holds the user name). The local log (stderr) keeps full paths.
const scrub = (str) => {
  let s = String(str);
  const forms = (p) => (p ? [...new Set([p, p.replace(/\\/g, '/'), p.replace(/\\/g, '\\\\')])].sort((a, b) => b.length - a.length) : []);
  const roots = ROOT ? [...new Set([ROOT, (() => { try { return fs.realpathSync.native(ROOT); } catch (e) { return ROOT; } })()])] : [];
  for (const r of roots) for (const f of forms(r)) { s = s.split(f + '/').join('').split(f + '\\\\').join('').split(f + '\\').join('').split(f).join(path.basename(r)); }
  const home = os.homedir();
  if (home && home.length > 3) for (const f of forms(home)) s = s.split(f).join('~');
  return s;
};
// (audit 6, A6-6: every answer leaves through out(): a model name's hidden characters as code points, lib/answer.mjs)
// (A6-8: and no answer passes 40,000 characters: capAnswer cuts the longest lists and says so)
export const pretty = (o) => JSON.stringify(o, null, 2), flat = (o) => JSON.stringify(o);
// (CX1, Codex's F11: a text answer passed whole) a text over 40,000 characters is cut as the lists are, and the cut said
const CUT_SAID = `\n\n(This answer was cut to stay under ${ANSWER_MAX.toLocaleString('en-US')} characters: the rest is not shown. Ask for one part at a time. Tell the user the answer was cut.)`;
// (FX6, Codex's D05) never inside a control character's escape (model.mjs visible(): \u and 4 or 5 hex digits): the cut
// goes back to the escape's start, then never after a lone high surrogate
const capText = (s) => { if (s.length <= ANSWER_MAX) return s; let n = ANSWER_MAX - CUT_SAID.length;
  const i = s.lastIndexOf('\\', n - 1), tok = i > n - 7 ? /^\\u[0-9a-f]{4,5}/.exec(s.slice(i, i + 7)) : null; if (tok && i + tok[0].length > n) n = i;
  if (/[\uD800-\uDBFF]/.test(s[n - 1])) n--; return s.slice(0, n) + CUT_SAID; };
export const text = (o, opts) => { if (typeof o === 'string') return { content: [{ type: 'text', text: capText(scrub(textOut(o))) }] }; const x = out(o); return pretty(x).length > AIM ? compact(o, opts) : { content: [{ type: 'text', text: scrub(pretty(capAnswer(x, (y) => pretty(y).length, opts))) }] }; };
export const compact = (o, opts) => ({ content: [{ type: 'text', text: scrub(flat(capAnswer(out(o), (x) => flat(x).length, opts))) }] });
// (A1-9: the reading block's coded errors are worded here, in the tool layer; A6: a name's invisible characters shown, nameOut)
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: scrub(textOut(wordOf(e))) }] });
// A working folder that is chosen but can't be used yet (it doesn't exist, or it is empty): a normal answer with what
// to do, not an error (an AI app shows an error as "Failed" in red, though nothing went wrong). Nothing is read or written.
const notice = (state, whatToDo) => text({ workingFolder: ROOT ? path.basename(ROOT) : ROOT, state, done: 'Nothing was read or written.', whatToDo });
// no working folder set: every tool refuses with the reason and touches no file
// (audit 6, A6-17: an internal error is told as one, with what this call wrote, from the files module's log)
export const safe = (fn) => async (args) => { const mark = writtenSince(); try { const problem = rootProblem(); if (problem) return ROOT ? notice('missing', problem) : fail(problem); return await fn(args); } catch (e) { return e instanceof Notice ? notice(e.state, e.message) : fail(e && e.code && !/^E[A-Z]+$/.test(e.code) ? e : failText(e, writtenSince(mark))); } };   // (a reading block's coded error is worded by wordOf, A1-9; any other by failText, A6)
